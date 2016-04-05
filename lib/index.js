import React from 'react';
import invariant from 'invariant';
import shallowEqual from 'shallowequal';
import { inheritStatics, isReactNative } from './utils';

let disableMode = false;
let testMode = false;

let stubComposers = [];

export class DummyComponent extends React.Component {
  render() {
    return null;
  }
}

export function DefaultErrorComponent({error}) {
  return (
    <pre style={{color: 'red'}}>
      {error.message} <br />
      {error.stack}
    </pre>
  );
}

export function DefaultLoadingComponent() {
  return (<p>Loading...</p>);
}

export function compose(fn, L1, E1, options = {pure: true}) {
  return (ChildComponent, L2, E2) => {
    invariant(
      Boolean(ChildComponent),
      'Should provide a child component to build the higher order container.'
    );

    if (isReactNative()) {
      invariant(
        L1 || L2,
        'Should provide a loading component in ReactNative.'
      );

      invariant(
        E1 || E2,
        'Should provide a error handling component in ReactNative.'
      );
    }

    const LoadingComponent = L1 || L2 || DefaultLoadingComponent;
    const ErrorComponent = E1 || E2 || DefaultErrorComponent;

    // If this is disabled, we simply need to return the DummyComponent
    if (disableMode) {
      return inheritStatics(DummyComponent, ChildComponent);
    }

    const Container = class extends React.Component {
      constructor(props, context) {
        super(props, context);

        this.state = {};

        // XXX: In the server side environment, we need to
        // stop the subscription right away. Otherwise, it's a starting
        // point to huge subscription leak.
        this._subscribe(props);
      }

      componentDidMount() {
        this._mounted = true;
      }

      componentWillReceiveProps(props) {
        this._subscribe(props);
      }

      componentWillUnmount() {
        this._mounted = false;
        this._unsubscribe();
      }

      shouldComponentUpdate(nextProps, nextState) {
        if (!options.pure) {
          return true;
        }

        return (
          !shallowEqual(this.props, nextProps) ||
          this.state.error !== nextState.error ||
          !shallowEqual(this.state.payload, nextState.payload)
        );
      }

      render() {
        const error = this._getError();
        const loading = this._isLoading();

        if (error) {
          return (<ErrorComponent error={error}/>);
        }

        if (loading) {
          return (<LoadingComponent />);
        }

        return (<ChildComponent {...this._getProps()} />);
      }

      _subscribe(props) {
        this._unsubscribe();

        this._stop = fn(props, (error, payload) => {
          if (error) {
            invariant(
              error.message && error.stack,
              'Passed error should be an instance of an Error.'
            );
          }

          const state = {error, payload};

          if (this._mounted) {
            this.setState(state);
          } else {
            this.state = state;
          }
        });
      }

      _unsubscribe() {
        if (this._stop) {
          this._stop();
        }
      }

      _getProps() {
        const {
          payload = {}
        } = this.state;

        const props = {
          ...this.props,
          ...payload
        };

        return props;
      }

      _getError() {
        const {error} = this.state;
        return error;
      }

      _isLoading() {
        const {payload} = this.state;
        return !Boolean(payload);
      }
    };

    return inheritStatics(Container, ChildComponent);
  };
}

export function composeWithTracker(reactiveFn, L, E, options) {
  const onPropsChange = (props, onData) => {
    let trackerCleanup;
    const handler = Tracker.nonreactive(() => {
      return Tracker.autorun(() => {
        trackerCleanup = reactiveFn(props, onData);
      });
    });

    return () => {
      if (typeof (trackerCleanup) === 'function') {
        trackerCleanup();
      }
      return handler.stop();
    };
  };

  return compose(onPropsChange, L, E, options);
}

export function composeWithPromise(fn, L, E, options) {
  const onPropsChange = (props, onData) => {
    const promise = fn(props);
    invariant(
      (typeof promise.then === 'function') &&
      (typeof promise.catch === 'function'),
      'Should return a promise from the callback of `composeWithPromise`'
    );

    onData();
    promise
      .then(data => {
        invariant(
          typeof data === 'object',
          'Should return a plain object from the promise'
        );
        const clonedData = {...data};
        onData(null, clonedData);
      })
      .catch(err => {
        onData(err);
      });
  };

  return compose(onPropsChange, L, E, options);
}

export function composeWithObservable(fn, L, E, options) {
  const onPropsChange = (props, sendData) => {
    const observable = fn(props);
    invariant(
      typeof observable.subscribe === 'function',
      'Should return an observable from the callback of `composeWithObservable`'
    );

    sendData();
    const onData = data => {
      invariant(
        typeof data === 'object',
        'Should return a plain object from the promise'
      );
      const clonedData = {...data};
      sendData(null, clonedData);
    };

    const onError = err => {
      sendData(err);
    };

    const sub = observable.subscribe(onData, onError);
    return sub.completed.bind(sub);
  };

  return compose(onPropsChange, L, E, options);
}

// utility function to compose multiple composers at once.
export function composeAll(...composers) {
  return function (BaseComponent) {
    if (disableMode) {
      return DummyComponent;
    }

    if (testMode) {
      stubComposers.forEach(record => {
        if (record.component === BaseComponent) {
          composers = record.composers;
        }
      });
    }

    if (BaseComponent === null || BaseComponent === undefined) {
      throw new Error('Curry function of composeAll needs an input.');
    }

    let finalComponent = BaseComponent;
    composers.forEach(composer => {
      if (typeof composer !== 'function') {
        throw new Error('Composer should be a function.');
      }

      finalComponent = composer(finalComponent);

      if (finalComponent === null || finalComponent === undefined) {
        throw new Error('Composer function should return a value.');
      }
    });

    return finalComponent;
  };
}

// A way to disable the functionality of react-komposer and always show the
// loading component.
// This is very useful in testing where we can ignore React kompser's behaviour.
export function disable(value = true) {
  disableMode = value;
}

// Enable test mode, which attempts to find a stub composer for components.
export function setTestMode(value = true) {
  testMode = value;
}

// Override the composers for a given component in test mode
export function createStubComposers(component, ...composers) {
  let isNew = true;
  stubComposers.forEach(record => {
    if (record.component === component) {
      record.composers = composers;
      isNew = false;
    }
  });
  if (isNew) {
    stubComposers.push({component, composers});
  }
}

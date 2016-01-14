import React from 'react';
import hoistStatics from 'hoist-non-react-statics';
import invariant from 'invariant';

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

export function compose(fn, L1, E1) {
  return (ChildComponent, L2, E2) => {
    invariant(
      Boolean(ChildComponent),
      'Should provide a child component to build the higher oder container.'
    );

    const LoadingComponent = L1 || L2 || DefaultLoadingComponent;
    const ErrorComponent = E1 || E2 || DefaultErrorComponent;

    const Container = class extends React.Component {
      constructor(props, context) {
        super(props, context);

        this.state = {_fnData: {}};
        this._subscribe(props);
        // XXX: In the server side environment, we need to
        // stop the subscription right away. Otherwise, it's a starting
        // point to huge subscription leak.
      }

      componentDidMount() {
        this._mounted = true;
      }

      componentWillReceiveProps(props) {
        this._subscribe(props);
      }

      componentWillUnmount() {
        this._unsubscribe();
      }

      render() {
        const error = this._getError();
        const loading = this._isLoading();

        return (
          <div>
            {error ? <ErrorComponent error={error}/> : null }
            {(!error && loading) ? <LoadingComponent /> : null}
            {(!error && !loading) ?
              <ChildComponent {...this._getProps()} /> : null}
          </div>
        );
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

          const state = {
            _fnData: {error, payload}
          };

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
        const {_fnData} = this.state;
        const {
          payload = {}
        } = _fnData;

        const props = {
          ...this.props,
          ...payload
        };

        return props;
      }

      _getError() {
        const {_fnData} = this.state;
        return _fnData.error;
      }

      _isLoading() {
        const {_fnData} = this.state;
        return !_fnData.payload;
      }
    };

    const childDisplayName =
      // Get the display name if it's set.
      ChildComponent.displayName ||
      // Get the display name from the function name.
      ChildComponent.name ||
      // If not, just add a default one.
      'ChildComponent';

    Container.displayName = `Container(${childDisplayName})`;
    return hoistStatics(Container, ChildComponent);
  };
}

export function composeWithTracker(reactiveFn, L, E) {
  const onPropsChange = (props, onData) => {
    let trackerCleanup;
    const handler = Tracker.autorun(() => {
      trackerCleanup = reactiveFn(props, onData);
    });

    return () => {
      if (typeof (trackerCleanup) === 'function') {
        trackerCleanup();
      }
      return handler.stop();
    };
  };

  return compose(onPropsChange, L, E);
}

export function composeWithPromise(fn, L, E) {
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

  return compose(onPropsChange, L, E);
}

export function composeWithObservable(fn, L, E) {
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

  return compose(onPropsChange, L, E);
}

// utility function to compose multiple composers at once.
export function composeAll(...composers) {
  return function (BaseComponent, L, E) {
    if (BaseComponent === null || BaseComponent === undefined) {
      throw new Error('Curry function of composeAll needs an input.');
    }

    let finalComponent = BaseComponent;
    composers.forEach(composer => {
      if (typeof composer !== 'function') {
        throw new Error('Composer should be a function.');
      }

      finalComponent = composer(finalComponent, L, E);

      if (finalComponent === null || finalComponent === undefined) {
        throw new Error('Composer function should return a value.');
      }
    });

    return finalComponent;
  };
}

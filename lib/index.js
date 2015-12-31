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

export function bindData(fn) {
  return (ChildComponent, L, E) => {
    invariant(
      Boolean(ChildComponent),
      'Should provide a child component to build the higher oder container.'
    );

    const LoadingComponent = L || DefaultLoadingComponent;
    const ErrorComponent = E || DefaultErrorComponent;

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

export function bindTrackerData(reactiveFn) {
  const onPropsChange = (props, onData) => {
    const handler = Tracker.autorun(() => {
      reactiveFn(props, onData);
    });

    return handler.stop.bind(handler);
  };

  return bindData(onPropsChange);
}

if (typeof window !== 'undefined') {
  window.ReactDataBinder = {
    bindData,
    bindTrackerData
  };
}

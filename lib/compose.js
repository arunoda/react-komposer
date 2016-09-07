import React from 'react';
import invariant from 'invariant';
import shallowEqual from 'shallowequal';
import { inheritStatics, isReactNative } from './utils';
import {
  DummyComponent,
} from './common_components';

import {
  getDisableMode,
  _getDefaultErrorComponent,
  _getDefaultLoadingComponent,
} from './';

export default function compose(
  fn,
  L1,
  E1,
  {
    contextTypes,
    pure = true,
    withRef = false
  } = {}
) {
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

    // If this is disabled, we simply need to return the DummyComponent
    if (getDisableMode()) {
      return inheritStatics(DummyComponent, ChildComponent);
    }

    const Container = class extends React.Component {
      constructor(props, context) {
        super(props, context);

        this.getWrappedInstance = this.getWrappedInstance.bind(this);

        this.state = {};

        // XXX: In the server side environment, we need to
        // stop the subscription right away. Otherwise, it's a starting
        // point to huge subscription leak.
        this._subscribe(props, context);
      }

      componentDidMount() {
        this._mounted = true;
      }

      componentWillReceiveProps(props, context) {
        this._subscribe(props, context);
      }

      componentWillUnmount() {
        this._mounted = false;
        this._unsubscribe();
      }

      shouldComponentUpdate(nextProps, nextState) {
        if (!pure) {
          return true;
        }

        return (
          !shallowEqual(this.props, nextProps) ||
          this.state.error !== nextState.error ||
          !shallowEqual(this.state.payload, nextState.payload)
        );
      }

      getWrappedInstance() {
        invariant(withRef,
          `To access the wrapped instance, you need to specify ` +
          `{ withRef: true } as the fourth argument of the compose() call.`
        );
        return this.refs.wrappedInstance;
      }

      render() {
        const error = this._getError();
        const loading = this._isLoading();
        const LoadingComponent = L1 || L2 || _getDefaultLoadingComponent();
        const ErrorComponent = E1 || E2 || _getDefaultErrorComponent();

        if (error) {
          return (<ErrorComponent error={error}/>);
        }

        if (loading) {
          return (<LoadingComponent {...this._getProps()} />);
        }

        return (<ChildComponent {...this._getProps()} />);
      }

      _subscribe(props, context) {
        this._unsubscribe();

        const onData = (error, payload) => {
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
        };

        this._stop = fn(props, onData, context);
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

        if (withRef) {
          props.ref = 'wrappedInstance';
        }

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

    Container.contextTypes = contextTypes;
    return inheritStatics(Container, ChildComponent);
  };
}

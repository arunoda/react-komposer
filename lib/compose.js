import React from 'react';
import invariant from 'invariant';
import shallowEqual from 'shallowequal';
import { inheritStatics, isReactNative } from './utils';
import {
  DummyComponent,
  DefaultLoadingComponent,
  DefaultErrorComponent
} from './common_components';

import { getDisableMode } from './';

export default function compose(fn, L1, E1, options = {pure: true}) {
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
    if (getDisableMode()) {
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

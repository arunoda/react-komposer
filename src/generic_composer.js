import React from 'react';
import shallowEqual from 'shallowequal';
import pick from 'lodash.pick';

// TODO: extend static props
// TODO: get display name.

export default function genericComposer(dataLoader, options) {
  return function (Child) {
    const {
      errorHandler = (err) => { throw err; },
      loadingHandler = () => null,
      context = {},
      pure = false,
      propsToWatch = null, // Watch all the props.
      shouldSubscribe = null,
    } = options;

    class Container extends React.Component {
      constructor(props, ...args) {
        super(props, ...args);
        this.state = {};
        this.propsCache = {};

        this._subscribe(props, true);
      }

      componentDidMount() {
        this._mounted = true;
      }

      componentWillReceiveProps(props) {
        this._subscribe(props);
      }

      shouldComponentUpdate(nextProps, nextState) {
        if (!pure) {
          return true;
        }

        return (
          !shallowEqual(this.props, nextProps) ||
          this.state.error !== nextState.error ||
          !shallowEqual(this.state.data, nextState.data)
        );
      }

      componentWillUnmount() {
        this._mounted = false;
        this._unsubscribe();
      }

      _shouldSubscribe(props, firstRun) {
        if (firstRun) return true;

        const nextProps = pick(props, propsToWatch);
        const currentProps = this._cachedWatchingProps || {};
        this._cachedWatchingProps = nextProps;

        if (typeof shouldSubscribe === 'function') {
          return !shouldSubscribe(currentProps, nextProps);
        }

        if (propsToWatch === null) return true;
        if (propsToWatch.length === 0) return false;
        return !shallowEqual(currentProps, nextProps);
      }

      _subscribe(props, firstRun) {
        if (!this._shouldSubscribe(props, firstRun)) return;

        const onData = (error, data) => {
          if (!this._mounted && !firstRun) {
            throw new Error(`Tyring set data after component(${Container.displayName}) has unmounted.`);
          }

          const payload = { error, data };

          if (firstRun) {
            this.state = {
              ...this.state,
              ...payload,
            };
            return;
          }

          this.setState(payload);
        };

        // We need to do this before subscribing again.
        this._unsubscribe();
        this._stop = dataLoader.call(context, onData);
      }

      _unsubscribe() {
        if (this._stop) {
          this._stop();
        }
      }

      render() {
        const props = this.props;
        const { data, error } = this.state;

        if (error) {
          return errorHandler(error);
        }

        if (!data) {
          return loadingHandler();
        }

        const finalProps = {
          ...props,
          ...data,
        };

        const setChildRef = (c) => {
          this.child = c;
        };

        return (
          <Child ref={setChildRef} {...finalProps} />
        );
      }
    }

    return Container;
  };
}

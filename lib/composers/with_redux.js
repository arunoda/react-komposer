import { compose } from 'mantra-core';

export default function composeWithRedux(fn, L, E, options) {
  const onPropsChange = (props, onData) => {
    const context = typeof props.context === 'function' ? props.context() : props.context;
    const Store = options && options.store
      ? options.store
      : context.Store || context.store;

    if (! Store) {
      throw new Error('No store found');
    }

    const processState = () => {
      try {
        const state = Store.getState();

        fn({ ...props, state }, onData);
      } catch (error) {
        onData(error);
      }
    };

    processState();

    Store.subscribe(processState);
  };

  return compose(onPropsChange, L, E, options);
}

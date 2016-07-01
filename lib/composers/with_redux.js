import compose from '../compose';

export default function composeWithRedux(fn, L, E, options) {
  const onPropsChange = (props, onData) => {
    const storeName = options && options.storeName
      ? options.storeName
      : 'Store';
    const Store = options && options.store
      ? options.store
      : props.context()[storeName];

    fn(props, onData);

    Store.subscribe(() => {
      fn(props, onData);
    });
  };

  return compose(onPropsChange, L, E, options);
}

import compose from '../compose';
import { autorun } from 'mobx';

export default function composeWithMobx(fn, L, E, options) {
  const onPropsChange = (props, onData) => autorun(() => fn(props, onData));

  return compose(onPropsChange, L, E, options);
}

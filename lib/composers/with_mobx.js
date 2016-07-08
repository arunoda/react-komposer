import compose from '../compose';
import {autorun} from 'mobx';

export default function composeWithMobx(fn, L, E, options) {
  const onPropsChange = (props, onData) => {
    const reactiveFn = () => fn(props, onData);

    autorun(reactiveFn);

    return reactiveFn();
  };

  return compose(onPropsChange, L, E, options);
}

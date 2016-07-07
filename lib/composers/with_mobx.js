import compose from '../compose';
import {autorun} from 'mobx';

export default function composeWithMobx(fn, L, E, options) {
  const onPropsChange = (props, onData) => {
    const disposer = () => fn(props, onData);

    autorun(disposer);

    return disposer();
  };

  return compose(onPropsChange, L, E, options);
}

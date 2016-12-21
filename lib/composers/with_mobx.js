import compose from '../compose';
import { autorun } from 'mobx';

export default function composeWithMobx(fn, L, E, options) {
  const onPropsChange = (props, onData) => {
    const processState = () => fn(props, onData);

    processState();

    autorun(processState);
  };

  return compose(onPropsChange, L, E, options);
}

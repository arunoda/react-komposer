/* eslint import/prefer-default-export: 0 */
import { setStubbingMode as _setStubbingMode } from 'react-stubber';
import _compose from './compose';

export const setStubbingMode = _setStubbingMode;
export const compose = _compose;

export function setDefaults(mainOptions = {}) {
  return function (dataLoader, otherOptions = {}) {
    const options = {
      ...mainOptions,
      ...otherOptions,
    };

    return _compose(dataLoader, options);
  };
}

export function merge(...enhancers) {
  // TODO: Try to get a single HOC merging all the composers together
  return function (Child) {
    return enhancers.reduce((C, enhancer) => {
      return enhancer(C);
    }, Child);
  };
}

export const composeAll = merge;

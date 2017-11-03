import _Object$assign from 'babel-runtime/core-js/object/assign';
/* eslint import/prefer-default-export: 0 */
import { setStubbingMode as _setStubbingMode, stub as _stub } from 'react-stubber';
import _compose from './compose';

export var setStubbingMode = _setStubbingMode;
export var stub = _stub;
export var compose = _compose;

export function setDefaults() {
  var mainOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (dataLoader) {
    var otherOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var options = _Object$assign({}, mainOptions, otherOptions);

    return _compose(dataLoader, options);
  };
}

export function merge() {
  for (var _len = arguments.length, enhancers = Array(_len), _key = 0; _key < _len; _key++) {
    enhancers[_key] = arguments[_key];
  }

  // TODO: Try to get a single HOC merging all the composers together
  return function (Child) {
    return enhancers.reduce(function (C, enhancer) {
      return enhancer(C);
    }, Child);
  };
}

export var composeAll = merge;
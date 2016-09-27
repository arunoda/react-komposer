'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.makeComposer = makeComposer;

var _generic_composer = require('./generic_composer');

var _generic_composer2 = _interopRequireDefault(_generic_composer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeComposer() {
  var mainOptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return function (dataLoader) {
    var otherOptions = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var options = (0, _extends3.default)({}, mainOptions, otherOptions);

    return (0, _generic_composer2.default)(dataLoader, options);
  };
}
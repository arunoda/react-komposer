'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DefaultErrorComponent = DefaultErrorComponent;
exports.DefaultLoadingComponent = DefaultLoadingComponent;
exports.compose = compose;
exports.composeWithTracker = composeWithTracker;
exports.composeWithPromise = composeWithPromise;
exports.composeWithObservable = composeWithObservable;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function DefaultErrorComponent(_ref) {
  var error = _ref.error;

  return _react2.default.createElement(
    'pre',
    { style: { color: 'red' } },
    error.message,
    ' ',
    _react2.default.createElement('br', null),
    error.stack
  );
}

function DefaultLoadingComponent() {
  return _react2.default.createElement(
    'p',
    null,
    'Loading...'
  );
}

function compose(fn) {
  return function (ChildComponent, L, E) {
    (0, _invariant2.default)(Boolean(ChildComponent), 'Should provide a child component to build the higher oder container.');

    var LoadingComponent = L || DefaultLoadingComponent;
    var ErrorComponent = E || DefaultErrorComponent;

    var Container = (function (_React$Component) {
      (0, _inherits3.default)(Container, _React$Component);

      function Container(props, context) {
        (0, _classCallCheck3.default)(this, Container);

        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Container).call(this, props, context));

        _this.state = { _fnData: {} };
        _this._subscribe(props);
        // XXX: In the server side environment, we need to
        // stop the subscription right away. Otherwise, it's a starting
        // point to huge subscription leak.
        return _this;
      }

      (0, _createClass3.default)(Container, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
          this._mounted = true;
        }
      }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(props) {
          this._subscribe(props);
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          this._unsubscribe();
        }
      }, {
        key: 'render',
        value: function render() {
          var error = this._getError();
          var loading = this._isLoading();

          return _react2.default.createElement(
            'div',
            null,
            error ? _react2.default.createElement(ErrorComponent, { error: error }) : null,
            !error && loading ? _react2.default.createElement(LoadingComponent, null) : null,
            !error && !loading ? _react2.default.createElement(ChildComponent, this._getProps()) : null
          );
        }
      }, {
        key: '_subscribe',
        value: function _subscribe(props) {
          var _this2 = this;

          this._unsubscribe();

          this._stop = fn(props, function (error, payload) {
            if (error) {
              (0, _invariant2.default)(error.message && error.stack, 'Passed error should be an instance of an Error.');
            }

            var state = {
              _fnData: { error: error, payload: payload }
            };

            if (_this2._mounted) {
              _this2.setState(state);
            } else {
              _this2.state = state;
            }
          });
        }
      }, {
        key: '_unsubscribe',
        value: function _unsubscribe() {
          if (this._stop) {
            this._stop();
          }
        }
      }, {
        key: '_getProps',
        value: function _getProps() {
          var _fnData = this.state._fnData;
          var _fnData$payload = _fnData.payload;
          var payload = _fnData$payload === undefined ? {} : _fnData$payload;

          var props = (0, _extends3.default)({}, this.props, payload);

          return props;
        }
      }, {
        key: '_getError',
        value: function _getError() {
          var _fnData = this.state._fnData;

          return _fnData.error;
        }
      }, {
        key: '_isLoading',
        value: function _isLoading() {
          var _fnData = this.state._fnData;

          return !_fnData.payload;
        }
      }]);
      return Container;
    })(_react2.default.Component);

    var childDisplayName =
    // Get the display name if it's set.
    ChildComponent.displayName ||
    // Get the display name from the function name.
    ChildComponent.name ||
    // If not, just add a default one.
    'ChildComponent';

    Container.displayName = 'Container(' + childDisplayName + ')';
    return (0, _hoistNonReactStatics2.default)(Container, ChildComponent);
  };
}

function composeWithTracker(reactiveFn) {
  var onPropsChange = function onPropsChange(props, onData) {
    var handler = Tracker.autorun(function () {
      reactiveFn(props, onData);
    });

    return handler.stop.bind(handler);
  };

  return compose(onPropsChange);
}

function composeWithPromise(fn) {
  var onPropsChange = function onPropsChange(props, onData) {
    var promise = fn(props);
    (0, _invariant2.default)(typeof promise.then === 'function' && typeof promise.catch === 'function', 'Should return a promise from the callback of `composeWithPromise`');

    onData();
    promise.then(function (data) {
      (0, _invariant2.default)((typeof data === 'undefined' ? 'undefined' : (0, _typeof3.default)(data)) === 'object', 'Should return a plain object from the promise');
      var clonedData = (0, _extends3.default)({}, data);
      onData(null, clonedData);
    }).catch(function (err) {
      onData(err);
    });
  };

  return compose(onPropsChange);
}

function composeWithObservable(fn) {
  var onPropsChange = function onPropsChange(props, sendData) {
    var observable = fn(props);
    (0, _invariant2.default)(typeof observable.subscribe === 'function', 'Should return an observable from the callback of `composeWithObservable`');

    sendData();
    var onData = function onData(data) {
      (0, _invariant2.default)((typeof data === 'undefined' ? 'undefined' : (0, _typeof3.default)(data)) === 'object', 'Should return a plain object from the promise');
      var clonedData = (0, _extends3.default)({}, data);
      sendData(null, clonedData);
    };

    var onError = function onError(err) {
      sendData(err);
    };

    var sub = observable.subscribe(onData, onError);
    return sub.completed.bind(sub);
  };

  return compose(onPropsChange);
}
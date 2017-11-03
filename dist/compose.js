import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React from 'react';
import shallowEqual from 'shallowequal';
import pick from 'lodash.pick';
import { mayBeStubbed } from 'react-stubber';
import { inheritStatics } from './utils';

export default function compose(dataLoader) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return function (Child) {
    var _options$errorHandler = options.errorHandler,
        errorHandler = _options$errorHandler === undefined ? function (err) {
      throw err;
    } : _options$errorHandler,
        _options$loadingHandl = options.loadingHandler,
        loadingHandler = _options$loadingHandl === undefined ? function () {
      return null;
    } : _options$loadingHandl,
        _options$env = options.env,
        env = _options$env === undefined ? {} : _options$env,
        _options$pure = options.pure,
        pure = _options$pure === undefined ? false : _options$pure,
        _options$propsToWatch = options.propsToWatch,
        propsToWatch = _options$propsToWatch === undefined ? null : _options$propsToWatch,
        _options$shouldSubscr = options.shouldSubscribe,
        shouldSubscribe = _options$shouldSubscr === undefined ? null : _options$shouldSubscr,
        _options$shouldUpdate = options.shouldUpdate,
        shouldUpdate = _options$shouldUpdate === undefined ? null : _options$shouldUpdate;

    var Container = function (_React$Component) {
      _inherits(Container, _React$Component);

      function Container(props) {
        var _ref;

        _classCallCheck(this, Container);

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = Container.__proto__ || _Object$getPrototypeOf(Container)).call.apply(_ref, [this, props].concat(args)));

        _this.state = {};
        _this.propsCache = {};

        _this._subscribe(props);
        return _this;
      }

      _createClass(Container, [{
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
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
          if (shouldUpdate) {
            return shouldUpdate(this.props, nextProps);
          }

          if (!pure) {
            return true;
          }

          return !shallowEqual(this.props, nextProps) || this.state.error !== nextState.error || !shallowEqual(this.state.data, nextState.data);
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          this._unmounted = true;
          this._unsubscribe();
        }
      }, {
        key: '_shouldSubscribe',
        value: function _shouldSubscribe(props) {
          var firstRun = !this._cachedWatchingProps;
          var nextProps = pick(props, propsToWatch);
          var currentProps = this._cachedWatchingProps || {};
          this._cachedWatchingProps = nextProps;

          if (firstRun) return true;
          if (typeof shouldSubscribe === 'function') {
            return shouldSubscribe(currentProps, nextProps);
          }

          if (propsToWatch === null) return true;
          if (propsToWatch.length === 0) return false;
          return !shallowEqual(currentProps, nextProps);
        }
      }, {
        key: '_subscribe',
        value: function _subscribe(props) {
          var _this2 = this;

          if (!this._shouldSubscribe(props)) return;

          var onData = function onData(error, data) {
            if (_this2._unmounted) {
              throw new Error('Trying to set data after component(' + Container.displayName + ') has unmounted.');
            }

            var payload = { error: error, data: data };

            if (!_this2._mounted) {
              _this2.state = _Object$assign({}, _this2.state, payload);
              return;
            }

            _this2.setState(payload);
          };

          // We need to do this before subscribing again.
          this._unsubscribe();
          this._stop = dataLoader(props, onData, env);
        }
      }, {
        key: '_unsubscribe',
        value: function _unsubscribe() {
          if (this._stop) {
            this._stop();
          }
        }
      }, {
        key: 'render',
        value: function render() {
          var _this3 = this;

          var props = this.props;
          var _state = this.state,
              data = _state.data,
              error = _state.error;


          if (error) {
            return errorHandler(error);
          }

          if (!data) {
            return loadingHandler();
          }

          var finalProps = _Object$assign({}, props, data);

          var setChildRef = function setChildRef(c) {
            _this3.child = c;
          };

          return React.createElement(Child, _Object$assign({ ref: setChildRef }, finalProps));
        }
      }]);

      return Container;
    }(React.Component);

    Container.__komposerData = {
      dataLoader: dataLoader, options: options
    };

    inheritStatics(Container, Child);
    return mayBeStubbed(Container);
  };
}
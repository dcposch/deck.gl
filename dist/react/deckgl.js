'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _autobind = require('./autobind');

var _autobind2 = _interopRequireDefault(_autobind);

var _webglRenderer = require('./webgl-renderer');

var _webglRenderer2 = _interopRequireDefault(_webglRenderer);

var _lib = require('../lib');

var _experimental = require('../experimental');

var _luma = require('luma.gl');

var _viewports = require('../lib/viewports');

var _utils = require('../lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


function noop() {}

var propTypes = {
  id: _react.PropTypes.string,
  width: _react.PropTypes.number.isRequired,
  height: _react.PropTypes.number.isRequired,
  layers: _react.PropTypes.arrayOf(_react.PropTypes.instanceOf(_lib.Layer)).isRequired,
  effects: _react.PropTypes.arrayOf(_react.PropTypes.instanceOf(_experimental.Effect)),
  gl: _react.PropTypes.object,
  debug: _react.PropTypes.bool,
  viewport: _react.PropTypes.instanceOf(_viewports.Viewport),
  onWebGLInitialized: _react.PropTypes.func,
  onLayerClick: _react.PropTypes.func,
  onLayerHover: _react.PropTypes.func,
  onAfterRender: _react.PropTypes.func
};

var defaultProps = {
  id: 'deckgl-overlay',
  debug: false,
  gl: null,
  effects: [],
  onWebGLInitialized: noop,
  onLayerClick: noop,
  onLayerHover: noop,
  onAfterRender: noop
};

var DeckGL = function (_React$Component) {
  _inherits(DeckGL, _React$Component);

  function DeckGL(props) {
    _classCallCheck(this, DeckGL);

    var _this = _possibleConstructorReturn(this, (DeckGL.__proto__ || Object.getPrototypeOf(DeckGL)).call(this, props));

    _this.state = {};
    _this.needsRedraw = true;
    _this.layerManager = null;
    _this.effectManager = null;
    (0, _autobind2.default)(_this);
    return _this;
  }

  _createClass(DeckGL, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this._updateLayers(nextProps);
    }
  }, {
    key: '_updateLayers',
    value: function _updateLayers(nextProps) {
      var width = nextProps.width,
          height = nextProps.height,
          latitude = nextProps.latitude,
          longitude = nextProps.longitude,
          zoom = nextProps.zoom,
          pitch = nextProps.pitch,
          bearing = nextProps.bearing,
          altitude = nextProps.altitude;
      var viewport = nextProps.viewport;

      // If Viewport is not supplied, create one from mercator props

      viewport = viewport || new _viewports.WebMercatorViewport({
        width: width, height: height, latitude: latitude, longitude: longitude, zoom: zoom, pitch: pitch, bearing: bearing, altitude: altitude
      });

      if (this.layerManager) {
        this.layerManager.setViewport(viewport).updateLayers({ newLayers: nextProps.layers });
      }
    }
  }, {
    key: '_onRendererInitialized',
    value: function _onRendererInitialized(_ref) {
      var gl = _ref.gl,
          canvas = _ref.canvas;

      gl.enable(_luma.GL.BLEND);
      gl.blendFunc(_luma.GL.SRC_ALPHA, _luma.GL.ONE_MINUS_SRC_ALPHA);

      this.props.onWebGLInitialized(gl);

      // Note: avoid React setState due GL animation loop / setState timing issue
      this.layerManager = new _lib.LayerManager({ gl: gl });
      this.effectManager = new _experimental.EffectManager({ gl: gl, layerManager: this.layerManager });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.props.effects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var effect = _step.value;

          this.effectManager.addEffect(effect);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this._updateLayers(this.props);

      // Check if a mouse event has been specified and that at least one of the layers is pickable
      var hasEvent = this.props.onLayerClick !== noop || this.props.onLayerHover !== noop;
      var hasPickableLayer = this.layerManager.layers.map(function (l) {
        return l.props.pickable;
      }).includes(true);
      if (this.layerManager.layers.length && hasEvent && !hasPickableLayer) {
        _utils.log.once(0, 'You have supplied a mouse event handler but none of your layers got the `pickable` flag.');
      }

      this.events = (0, _luma.addEvents)(canvas, {
        cacheSize: false,
        cachePosition: false,
        centerOrigin: false,
        onClick: this._onClick,
        onMouseMove: this._onMouseMove
      });
    }

    // Route events to layers

  }, {
    key: '_onClick',
    value: function _onClick(event) {
      var x = event.x,
          y = event.y;

      var selectedInfos = this.layerManager.pickLayer({ x: x, y: y, mode: 'click' });
      if (selectedInfos.length) {
        var firstInfo = selectedInfos.find(function (info) {
          return info.index >= 0;
        });
        // Event.event holds the original MouseEvent object
        this.props.onLayerClick(firstInfo, selectedInfos, event.event);
      }
    }

    // Route events to layers

  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(event) {
      var x = event.x,
          y = event.y;

      var selectedInfos = this.layerManager.pickLayer({ x: x, y: y, mode: 'hover' });
      if (selectedInfos.length) {
        var firstInfo = selectedInfos.find(function (info) {
          return info.index >= 0;
        });
        // Event.event holds the original MouseEvent object
        this.props.onLayerHover(firstInfo, selectedInfos, event.event);
      }
    }
  }, {
    key: '_onRenderFrame',
    value: function _onRenderFrame(_ref2) {
      var gl = _ref2.gl;

      var redraw = this.layerManager.needsRedraw({ clearRedrawFlags: true });
      if (!redraw) {
        return;
      }

      // clear depth and color buffers
      gl.clear(_luma.GL.COLOR_BUFFER_BIT | _luma.GL.DEPTH_BUFFER_BIT);

      this.effectManager.preDraw();
      this.layerManager.drawLayers({ pass: 'primary' });
      this.effectManager.draw();
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          width = _props.width,
          height = _props.height,
          gl = _props.gl,
          debug = _props.debug;


      return (0, _react.createElement)(_webglRenderer2.default, Object.assign({}, this.props, {
        width: width,
        height: height,
        gl: gl,
        debug: debug,
        viewport: { x: 0, y: 0, width: width, height: height },
        onRendererInitialized: this._onRendererInitialized,
        onNeedRedraw: this._onNeedRedraw,
        onRenderFrame: this._onRenderFrame,
        onMouseMove: this._onMouseMove,
        onClick: this._onClick
      }));
    }
  }]);

  return DeckGL;
}(_react2.default.Component);

exports.default = DeckGL;


DeckGL.propTypes = propTypes;
DeckGL.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZWFjdC9kZWNrZ2wuanMiXSwibmFtZXMiOlsibm9vcCIsInByb3BUeXBlcyIsImlkIiwic3RyaW5nIiwid2lkdGgiLCJudW1iZXIiLCJpc1JlcXVpcmVkIiwiaGVpZ2h0IiwibGF5ZXJzIiwiYXJyYXlPZiIsImluc3RhbmNlT2YiLCJlZmZlY3RzIiwiZ2wiLCJvYmplY3QiLCJkZWJ1ZyIsImJvb2wiLCJ2aWV3cG9ydCIsIm9uV2ViR0xJbml0aWFsaXplZCIsImZ1bmMiLCJvbkxheWVyQ2xpY2siLCJvbkxheWVySG92ZXIiLCJvbkFmdGVyUmVuZGVyIiwiZGVmYXVsdFByb3BzIiwiRGVja0dMIiwicHJvcHMiLCJzdGF0ZSIsIm5lZWRzUmVkcmF3IiwibGF5ZXJNYW5hZ2VyIiwiZWZmZWN0TWFuYWdlciIsIm5leHRQcm9wcyIsIl91cGRhdGVMYXllcnMiLCJsYXRpdHVkZSIsImxvbmdpdHVkZSIsInpvb20iLCJwaXRjaCIsImJlYXJpbmciLCJhbHRpdHVkZSIsInNldFZpZXdwb3J0IiwidXBkYXRlTGF5ZXJzIiwibmV3TGF5ZXJzIiwiY2FudmFzIiwiZW5hYmxlIiwiQkxFTkQiLCJibGVuZEZ1bmMiLCJTUkNfQUxQSEEiLCJPTkVfTUlOVVNfU1JDX0FMUEhBIiwiZWZmZWN0IiwiYWRkRWZmZWN0IiwiaGFzRXZlbnQiLCJoYXNQaWNrYWJsZUxheWVyIiwibWFwIiwibCIsInBpY2thYmxlIiwiaW5jbHVkZXMiLCJsZW5ndGgiLCJvbmNlIiwiZXZlbnRzIiwiY2FjaGVTaXplIiwiY2FjaGVQb3NpdGlvbiIsImNlbnRlck9yaWdpbiIsIm9uQ2xpY2siLCJfb25DbGljayIsIm9uTW91c2VNb3ZlIiwiX29uTW91c2VNb3ZlIiwiZXZlbnQiLCJ4IiwieSIsInNlbGVjdGVkSW5mb3MiLCJwaWNrTGF5ZXIiLCJtb2RlIiwiZmlyc3RJbmZvIiwiZmluZCIsImluZm8iLCJpbmRleCIsInJlZHJhdyIsImNsZWFyUmVkcmF3RmxhZ3MiLCJjbGVhciIsIkNPTE9SX0JVRkZFUl9CSVQiLCJERVBUSF9CVUZGRVJfQklUIiwicHJlRHJhdyIsImRyYXdMYXllcnMiLCJwYXNzIiwiZHJhdyIsIk9iamVjdCIsImFzc2lnbiIsIm9uUmVuZGVyZXJJbml0aWFsaXplZCIsIl9vblJlbmRlcmVySW5pdGlhbGl6ZWQiLCJvbk5lZWRSZWRyYXciLCJfb25OZWVkUmVkcmF3Iiwib25SZW5kZXJGcmFtZSIsIl9vblJlbmRlckZyYW1lIiwiQ29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQW1CQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7K2VBMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFVQSxTQUFTQSxJQUFULEdBQWdCLENBQUU7O0FBRWxCLElBQU1DLFlBQVk7QUFDaEJDLE1BQUksaUJBQVVDLE1BREU7QUFFaEJDLFNBQU8saUJBQVVDLE1BQVYsQ0FBaUJDLFVBRlI7QUFHaEJDLFVBQVEsaUJBQVVGLE1BQVYsQ0FBaUJDLFVBSFQ7QUFJaEJFLFVBQVEsaUJBQVVDLE9BQVYsQ0FBa0IsaUJBQVVDLFVBQVYsWUFBbEIsRUFBK0NKLFVBSnZDO0FBS2hCSyxXQUFTLGlCQUFVRixPQUFWLENBQWtCLGlCQUFVQyxVQUFWLHNCQUFsQixDQUxPO0FBTWhCRSxNQUFJLGlCQUFVQyxNQU5FO0FBT2hCQyxTQUFPLGlCQUFVQyxJQVBEO0FBUWhCQyxZQUFVLGlCQUFVTixVQUFWLHFCQVJNO0FBU2hCTyxzQkFBb0IsaUJBQVVDLElBVGQ7QUFVaEJDLGdCQUFjLGlCQUFVRCxJQVZSO0FBV2hCRSxnQkFBYyxpQkFBVUYsSUFYUjtBQVloQkcsaUJBQWUsaUJBQVVIO0FBWlQsQ0FBbEI7O0FBZUEsSUFBTUksZUFBZTtBQUNuQnBCLE1BQUksZ0JBRGU7QUFFbkJZLFNBQU8sS0FGWTtBQUduQkYsTUFBSSxJQUhlO0FBSW5CRCxXQUFTLEVBSlU7QUFLbkJNLHNCQUFvQmpCLElBTEQ7QUFNbkJtQixnQkFBY25CLElBTks7QUFPbkJvQixnQkFBY3BCLElBUEs7QUFRbkJxQixpQkFBZXJCO0FBUkksQ0FBckI7O0lBV3FCdUIsTTs7O0FBQ25CLGtCQUFZQyxLQUFaLEVBQW1CO0FBQUE7O0FBQUEsZ0hBQ1hBLEtBRFc7O0FBRWpCLFVBQUtDLEtBQUwsR0FBYSxFQUFiO0FBQ0EsVUFBS0MsV0FBTCxHQUFtQixJQUFuQjtBQUNBLFVBQUtDLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxVQUFLQyxhQUFMLEdBQXFCLElBQXJCO0FBQ0E7QUFOaUI7QUFPbEI7Ozs7OENBRXlCQyxTLEVBQVc7QUFDbkMsV0FBS0MsYUFBTCxDQUFtQkQsU0FBbkI7QUFDRDs7O2tDQUVhQSxTLEVBQVc7QUFBQSxVQUNoQnpCLEtBRGdCLEdBQ3NEeUIsU0FEdEQsQ0FDaEJ6QixLQURnQjtBQUFBLFVBQ1RHLE1BRFMsR0FDc0RzQixTQUR0RCxDQUNUdEIsTUFEUztBQUFBLFVBQ0R3QixRQURDLEdBQ3NERixTQUR0RCxDQUNERSxRQURDO0FBQUEsVUFDU0MsU0FEVCxHQUNzREgsU0FEdEQsQ0FDU0csU0FEVDtBQUFBLFVBQ29CQyxJQURwQixHQUNzREosU0FEdEQsQ0FDb0JJLElBRHBCO0FBQUEsVUFDMEJDLEtBRDFCLEdBQ3NETCxTQUR0RCxDQUMwQkssS0FEMUI7QUFBQSxVQUNpQ0MsT0FEakMsR0FDc0ROLFNBRHRELENBQ2lDTSxPQURqQztBQUFBLFVBQzBDQyxRQUQxQyxHQUNzRFAsU0FEdEQsQ0FDMENPLFFBRDFDO0FBQUEsVUFFbEJwQixRQUZrQixHQUVOYSxTQUZNLENBRWxCYixRQUZrQjs7QUFJdkI7O0FBQ0FBLGlCQUFXQSxZQUFZLG1DQUF3QjtBQUM3Q1osb0JBRDZDLEVBQ3RDRyxjQURzQyxFQUM5QndCLGtCQUQ4QixFQUNwQkMsb0JBRG9CLEVBQ1RDLFVBRFMsRUFDSEMsWUFERyxFQUNJQyxnQkFESixFQUNhQztBQURiLE9BQXhCLENBQXZCOztBQUlBLFVBQUksS0FBS1QsWUFBVCxFQUF1QjtBQUNyQixhQUFLQSxZQUFMLENBQ0dVLFdBREgsQ0FDZXJCLFFBRGYsRUFFR3NCLFlBRkgsQ0FFZ0IsRUFBQ0MsV0FBV1YsVUFBVXJCLE1BQXRCLEVBRmhCO0FBR0Q7QUFDRjs7O2lEQUVvQztBQUFBLFVBQWJJLEVBQWEsUUFBYkEsRUFBYTtBQUFBLFVBQVQ0QixNQUFTLFFBQVRBLE1BQVM7O0FBQ25DNUIsU0FBRzZCLE1BQUgsQ0FBVSxTQUFHQyxLQUFiO0FBQ0E5QixTQUFHK0IsU0FBSCxDQUFhLFNBQUdDLFNBQWhCLEVBQTJCLFNBQUdDLG1CQUE5Qjs7QUFFQSxXQUFLckIsS0FBTCxDQUFXUCxrQkFBWCxDQUE4QkwsRUFBOUI7O0FBRUE7QUFDQSxXQUFLZSxZQUFMLEdBQW9CLHNCQUFpQixFQUFDZixNQUFELEVBQWpCLENBQXBCO0FBQ0EsV0FBS2dCLGFBQUwsR0FBcUIsZ0NBQWtCLEVBQUNoQixNQUFELEVBQUtlLGNBQWMsS0FBS0EsWUFBeEIsRUFBbEIsQ0FBckI7QUFSbUM7QUFBQTtBQUFBOztBQUFBO0FBU25DLDZCQUFxQixLQUFLSCxLQUFMLENBQVdiLE9BQWhDLDhIQUF5QztBQUFBLGNBQTlCbUMsTUFBOEI7O0FBQ3ZDLGVBQUtsQixhQUFMLENBQW1CbUIsU0FBbkIsQ0FBNkJELE1BQTdCO0FBQ0Q7QUFYa0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFZbkMsV0FBS2hCLGFBQUwsQ0FBbUIsS0FBS04sS0FBeEI7O0FBRUE7QUFDQSxVQUFNd0IsV0FBVyxLQUFLeEIsS0FBTCxDQUFXTCxZQUFYLEtBQTRCbkIsSUFBNUIsSUFBb0MsS0FBS3dCLEtBQUwsQ0FBV0osWUFBWCxLQUE0QnBCLElBQWpGO0FBQ0EsVUFBTWlELG1CQUFtQixLQUFLdEIsWUFBTCxDQUFrQm5CLE1BQWxCLENBQXlCMEMsR0FBekIsQ0FBNkI7QUFBQSxlQUFLQyxFQUFFM0IsS0FBRixDQUFRNEIsUUFBYjtBQUFBLE9BQTdCLEVBQW9EQyxRQUFwRCxDQUE2RCxJQUE3RCxDQUF6QjtBQUNBLFVBQUksS0FBSzFCLFlBQUwsQ0FBa0JuQixNQUFsQixDQUF5QjhDLE1BQXpCLElBQW1DTixRQUFuQyxJQUErQyxDQUFDQyxnQkFBcEQsRUFBc0U7QUFDcEUsbUJBQUlNLElBQUosQ0FDRSxDQURGLEVBRUUsMEZBRkY7QUFJRDs7QUFFRCxXQUFLQyxNQUFMLEdBQWMscUJBQVVoQixNQUFWLEVBQWtCO0FBQzlCaUIsbUJBQVcsS0FEbUI7QUFFOUJDLHVCQUFlLEtBRmU7QUFHOUJDLHNCQUFjLEtBSGdCO0FBSTlCQyxpQkFBUyxLQUFLQyxRQUpnQjtBQUs5QkMscUJBQWEsS0FBS0M7QUFMWSxPQUFsQixDQUFkO0FBT0Q7O0FBRUQ7Ozs7NkJBQ1NDLEssRUFBTztBQUFBLFVBQ1BDLENBRE8sR0FDQ0QsS0FERCxDQUNQQyxDQURPO0FBQUEsVUFDSkMsQ0FESSxHQUNDRixLQURELENBQ0pFLENBREk7O0FBRWQsVUFBTUMsZ0JBQWdCLEtBQUt4QyxZQUFMLENBQWtCeUMsU0FBbEIsQ0FBNEIsRUFBQ0gsSUFBRCxFQUFJQyxJQUFKLEVBQU9HLE1BQU0sT0FBYixFQUE1QixDQUF0QjtBQUNBLFVBQUlGLGNBQWNiLE1BQWxCLEVBQTBCO0FBQ3hCLFlBQU1nQixZQUFZSCxjQUFjSSxJQUFkLENBQW1CO0FBQUEsaUJBQVFDLEtBQUtDLEtBQUwsSUFBYyxDQUF0QjtBQUFBLFNBQW5CLENBQWxCO0FBQ0E7QUFDQSxhQUFLakQsS0FBTCxDQUFXTCxZQUFYLENBQXdCbUQsU0FBeEIsRUFBbUNILGFBQW5DLEVBQWtESCxNQUFNQSxLQUF4RDtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7aUNBQ2FBLEssRUFBTztBQUFBLFVBQ1hDLENBRFcsR0FDSEQsS0FERyxDQUNYQyxDQURXO0FBQUEsVUFDUkMsQ0FEUSxHQUNIRixLQURHLENBQ1JFLENBRFE7O0FBRWxCLFVBQU1DLGdCQUFnQixLQUFLeEMsWUFBTCxDQUFrQnlDLFNBQWxCLENBQTRCLEVBQUNILElBQUQsRUFBSUMsSUFBSixFQUFPRyxNQUFNLE9BQWIsRUFBNUIsQ0FBdEI7QUFDQSxVQUFJRixjQUFjYixNQUFsQixFQUEwQjtBQUN4QixZQUFNZ0IsWUFBWUgsY0FBY0ksSUFBZCxDQUFtQjtBQUFBLGlCQUFRQyxLQUFLQyxLQUFMLElBQWMsQ0FBdEI7QUFBQSxTQUFuQixDQUFsQjtBQUNBO0FBQ0EsYUFBS2pELEtBQUwsQ0FBV0osWUFBWCxDQUF3QmtELFNBQXhCLEVBQW1DSCxhQUFuQyxFQUFrREgsTUFBTUEsS0FBeEQ7QUFDRDtBQUNGOzs7MENBRW9CO0FBQUEsVUFBTHBELEVBQUssU0FBTEEsRUFBSzs7QUFDbkIsVUFBTThELFNBQVMsS0FBSy9DLFlBQUwsQ0FBa0JELFdBQWxCLENBQThCLEVBQUNpRCxrQkFBa0IsSUFBbkIsRUFBOUIsQ0FBZjtBQUNBLFVBQUksQ0FBQ0QsTUFBTCxFQUFhO0FBQ1g7QUFDRDs7QUFFRDtBQUNBOUQsU0FBR2dFLEtBQUgsQ0FBUyxTQUFHQyxnQkFBSCxHQUFzQixTQUFHQyxnQkFBbEM7O0FBRUEsV0FBS2xELGFBQUwsQ0FBbUJtRCxPQUFuQjtBQUNBLFdBQUtwRCxZQUFMLENBQWtCcUQsVUFBbEIsQ0FBNkIsRUFBQ0MsTUFBTSxTQUFQLEVBQTdCO0FBQ0EsV0FBS3JELGFBQUwsQ0FBbUJzRCxJQUFuQjtBQUNEOzs7NkJBRVE7QUFBQSxtQkFDNEIsS0FBSzFELEtBRGpDO0FBQUEsVUFDQXBCLEtBREEsVUFDQUEsS0FEQTtBQUFBLFVBQ09HLE1BRFAsVUFDT0EsTUFEUDtBQUFBLFVBQ2VLLEVBRGYsVUFDZUEsRUFEZjtBQUFBLFVBQ21CRSxLQURuQixVQUNtQkEsS0FEbkI7OztBQUdQLGFBQU8sbURBQTZCcUUsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsS0FBSzVELEtBQXZCLEVBQThCO0FBQ2hFcEIsb0JBRGdFO0FBRWhFRyxzQkFGZ0U7QUFHaEVLLGNBSGdFO0FBSWhFRSxvQkFKZ0U7QUFLaEVFLGtCQUFVLEVBQUNpRCxHQUFHLENBQUosRUFBT0MsR0FBRyxDQUFWLEVBQWE5RCxZQUFiLEVBQW9CRyxjQUFwQixFQUxzRDtBQU1oRThFLCtCQUF1QixLQUFLQyxzQkFOb0M7QUFPaEVDLHNCQUFjLEtBQUtDLGFBUDZDO0FBUWhFQyx1QkFBZSxLQUFLQyxjQVI0QztBQVNoRTVCLHFCQUFhLEtBQUtDLFlBVDhDO0FBVWhFSCxpQkFBUyxLQUFLQztBQVZrRCxPQUE5QixDQUE3QixDQUFQO0FBWUQ7Ozs7RUFsSGlDLGdCQUFNOEIsUzs7a0JBQXJCcEUsTTs7O0FBcUhyQkEsT0FBT3RCLFNBQVAsR0FBbUJBLFNBQW5CO0FBQ0FzQixPQUFPRCxZQUFQLEdBQXNCQSxZQUF0QiIsImZpbGUiOiJkZWNrZ2wuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuaW1wb3J0IFJlYWN0LCB7UHJvcFR5cGVzLCBjcmVhdGVFbGVtZW50fSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgYXV0b2JpbmQgZnJvbSAnLi9hdXRvYmluZCc7XG5pbXBvcnQgV2ViR0xSZW5kZXJlciBmcm9tICcuL3dlYmdsLXJlbmRlcmVyJztcbmltcG9ydCB7TGF5ZXJNYW5hZ2VyLCBMYXllcn0gZnJvbSAnLi4vbGliJztcbmltcG9ydCB7RWZmZWN0TWFuYWdlciwgRWZmZWN0fSBmcm9tICcuLi9leHBlcmltZW50YWwnO1xuaW1wb3J0IHtHTCwgYWRkRXZlbnRzfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7Vmlld3BvcnQsIFdlYk1lcmNhdG9yVmlld3BvcnR9IGZyb20gJy4uL2xpYi92aWV3cG9ydHMnO1xuaW1wb3J0IHtsb2d9IGZyb20gJy4uL2xpYi91dGlscyc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIGlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICB3aWR0aDogUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICBoZWlnaHQ6IFByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgbGF5ZXJzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuaW5zdGFuY2VPZihMYXllcikpLmlzUmVxdWlyZWQsXG4gIGVmZmVjdHM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5pbnN0YW5jZU9mKEVmZmVjdCkpLFxuICBnbDogUHJvcFR5cGVzLm9iamVjdCxcbiAgZGVidWc6IFByb3BUeXBlcy5ib29sLFxuICB2aWV3cG9ydDogUHJvcFR5cGVzLmluc3RhbmNlT2YoVmlld3BvcnQpLFxuICBvbldlYkdMSW5pdGlhbGl6ZWQ6IFByb3BUeXBlcy5mdW5jLFxuICBvbkxheWVyQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICBvbkxheWVySG92ZXI6IFByb3BUeXBlcy5mdW5jLFxuICBvbkFmdGVyUmVuZGVyOiBQcm9wVHlwZXMuZnVuY1xufTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBpZDogJ2RlY2tnbC1vdmVybGF5JyxcbiAgZGVidWc6IGZhbHNlLFxuICBnbDogbnVsbCxcbiAgZWZmZWN0czogW10sXG4gIG9uV2ViR0xJbml0aWFsaXplZDogbm9vcCxcbiAgb25MYXllckNsaWNrOiBub29wLFxuICBvbkxheWVySG92ZXI6IG5vb3AsXG4gIG9uQWZ0ZXJSZW5kZXI6IG5vb3Bcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlY2tHTCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICB0aGlzLmxheWVyTWFuYWdlciA9IG51bGw7XG4gICAgdGhpcy5lZmZlY3RNYW5hZ2VyID0gbnVsbDtcbiAgICBhdXRvYmluZCh0aGlzKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgdGhpcy5fdXBkYXRlTGF5ZXJzKG5leHRQcm9wcyk7XG4gIH1cblxuICBfdXBkYXRlTGF5ZXJzKG5leHRQcm9wcykge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0LCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCB6b29tLCBwaXRjaCwgYmVhcmluZywgYWx0aXR1ZGV9ID0gbmV4dFByb3BzO1xuICAgIGxldCB7dmlld3BvcnR9ID0gbmV4dFByb3BzO1xuXG4gICAgLy8gSWYgVmlld3BvcnQgaXMgbm90IHN1cHBsaWVkLCBjcmVhdGUgb25lIGZyb20gbWVyY2F0b3IgcHJvcHNcbiAgICB2aWV3cG9ydCA9IHZpZXdwb3J0IHx8IG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHtcbiAgICAgIHdpZHRoLCBoZWlnaHQsIGxhdGl0dWRlLCBsb25naXR1ZGUsIHpvb20sIHBpdGNoLCBiZWFyaW5nLCBhbHRpdHVkZVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMubGF5ZXJNYW5hZ2VyKSB7XG4gICAgICB0aGlzLmxheWVyTWFuYWdlclxuICAgICAgICAuc2V0Vmlld3BvcnQodmlld3BvcnQpXG4gICAgICAgIC51cGRhdGVMYXllcnMoe25ld0xheWVyczogbmV4dFByb3BzLmxheWVyc30pO1xuICAgIH1cbiAgfVxuXG4gIF9vblJlbmRlcmVySW5pdGlhbGl6ZWQoe2dsLCBjYW52YXN9KSB7XG4gICAgZ2wuZW5hYmxlKEdMLkJMRU5EKTtcbiAgICBnbC5ibGVuZEZ1bmMoR0wuU1JDX0FMUEhBLCBHTC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcblxuICAgIHRoaXMucHJvcHMub25XZWJHTEluaXRpYWxpemVkKGdsKTtcblxuICAgIC8vIE5vdGU6IGF2b2lkIFJlYWN0IHNldFN0YXRlIGR1ZSBHTCBhbmltYXRpb24gbG9vcCAvIHNldFN0YXRlIHRpbWluZyBpc3N1ZVxuICAgIHRoaXMubGF5ZXJNYW5hZ2VyID0gbmV3IExheWVyTWFuYWdlcih7Z2x9KTtcbiAgICB0aGlzLmVmZmVjdE1hbmFnZXIgPSBuZXcgRWZmZWN0TWFuYWdlcih7Z2wsIGxheWVyTWFuYWdlcjogdGhpcy5sYXllck1hbmFnZXJ9KTtcbiAgICBmb3IgKGNvbnN0IGVmZmVjdCBvZiB0aGlzLnByb3BzLmVmZmVjdHMpIHtcbiAgICAgIHRoaXMuZWZmZWN0TWFuYWdlci5hZGRFZmZlY3QoZWZmZWN0KTtcbiAgICB9XG4gICAgdGhpcy5fdXBkYXRlTGF5ZXJzKHRoaXMucHJvcHMpO1xuXG4gICAgLy8gQ2hlY2sgaWYgYSBtb3VzZSBldmVudCBoYXMgYmVlbiBzcGVjaWZpZWQgYW5kIHRoYXQgYXQgbGVhc3Qgb25lIG9mIHRoZSBsYXllcnMgaXMgcGlja2FibGVcbiAgICBjb25zdCBoYXNFdmVudCA9IHRoaXMucHJvcHMub25MYXllckNsaWNrICE9PSBub29wIHx8IHRoaXMucHJvcHMub25MYXllckhvdmVyICE9PSBub29wO1xuICAgIGNvbnN0IGhhc1BpY2thYmxlTGF5ZXIgPSB0aGlzLmxheWVyTWFuYWdlci5sYXllcnMubWFwKGwgPT4gbC5wcm9wcy5waWNrYWJsZSkuaW5jbHVkZXModHJ1ZSk7XG4gICAgaWYgKHRoaXMubGF5ZXJNYW5hZ2VyLmxheWVycy5sZW5ndGggJiYgaGFzRXZlbnQgJiYgIWhhc1BpY2thYmxlTGF5ZXIpIHtcbiAgICAgIGxvZy5vbmNlKFxuICAgICAgICAwLFxuICAgICAgICAnWW91IGhhdmUgc3VwcGxpZWQgYSBtb3VzZSBldmVudCBoYW5kbGVyIGJ1dCBub25lIG9mIHlvdXIgbGF5ZXJzIGdvdCB0aGUgYHBpY2thYmxlYCBmbGFnLidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5ldmVudHMgPSBhZGRFdmVudHMoY2FudmFzLCB7XG4gICAgICBjYWNoZVNpemU6IGZhbHNlLFxuICAgICAgY2FjaGVQb3NpdGlvbjogZmFsc2UsXG4gICAgICBjZW50ZXJPcmlnaW46IGZhbHNlLFxuICAgICAgb25DbGljazogdGhpcy5fb25DbGljayxcbiAgICAgIG9uTW91c2VNb3ZlOiB0aGlzLl9vbk1vdXNlTW92ZVxuICAgIH0pO1xuICB9XG5cbiAgLy8gUm91dGUgZXZlbnRzIHRvIGxheWVyc1xuICBfb25DbGljayhldmVudCkge1xuICAgIGNvbnN0IHt4LCB5fSA9IGV2ZW50O1xuICAgIGNvbnN0IHNlbGVjdGVkSW5mb3MgPSB0aGlzLmxheWVyTWFuYWdlci5waWNrTGF5ZXIoe3gsIHksIG1vZGU6ICdjbGljayd9KTtcbiAgICBpZiAoc2VsZWN0ZWRJbmZvcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGZpcnN0SW5mbyA9IHNlbGVjdGVkSW5mb3MuZmluZChpbmZvID0+IGluZm8uaW5kZXggPj0gMCk7XG4gICAgICAvLyBFdmVudC5ldmVudCBob2xkcyB0aGUgb3JpZ2luYWwgTW91c2VFdmVudCBvYmplY3RcbiAgICAgIHRoaXMucHJvcHMub25MYXllckNsaWNrKGZpcnN0SW5mbywgc2VsZWN0ZWRJbmZvcywgZXZlbnQuZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJvdXRlIGV2ZW50cyB0byBsYXllcnNcbiAgX29uTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgY29uc3Qge3gsIHl9ID0gZXZlbnQ7XG4gICAgY29uc3Qgc2VsZWN0ZWRJbmZvcyA9IHRoaXMubGF5ZXJNYW5hZ2VyLnBpY2tMYXllcih7eCwgeSwgbW9kZTogJ2hvdmVyJ30pO1xuICAgIGlmIChzZWxlY3RlZEluZm9zLmxlbmd0aCkge1xuICAgICAgY29uc3QgZmlyc3RJbmZvID0gc2VsZWN0ZWRJbmZvcy5maW5kKGluZm8gPT4gaW5mby5pbmRleCA+PSAwKTtcbiAgICAgIC8vIEV2ZW50LmV2ZW50IGhvbGRzIHRoZSBvcmlnaW5hbCBNb3VzZUV2ZW50IG9iamVjdFxuICAgICAgdGhpcy5wcm9wcy5vbkxheWVySG92ZXIoZmlyc3RJbmZvLCBzZWxlY3RlZEluZm9zLCBldmVudC5ldmVudCk7XG4gICAgfVxuICB9XG5cbiAgX29uUmVuZGVyRnJhbWUoe2dsfSkge1xuICAgIGNvbnN0IHJlZHJhdyA9IHRoaXMubGF5ZXJNYW5hZ2VyLm5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzOiB0cnVlfSk7XG4gICAgaWYgKCFyZWRyYXcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBjbGVhciBkZXB0aCBhbmQgY29sb3IgYnVmZmVyc1xuICAgIGdsLmNsZWFyKEdMLkNPTE9SX0JVRkZFUl9CSVQgfCBHTC5ERVBUSF9CVUZGRVJfQklUKTtcblxuICAgIHRoaXMuZWZmZWN0TWFuYWdlci5wcmVEcmF3KCk7XG4gICAgdGhpcy5sYXllck1hbmFnZXIuZHJhd0xheWVycyh7cGFzczogJ3ByaW1hcnknfSk7XG4gICAgdGhpcy5lZmZlY3RNYW5hZ2VyLmRyYXcoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodCwgZ2wsIGRlYnVnfSA9IHRoaXMucHJvcHM7XG5cbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudChXZWJHTFJlbmRlcmVyLCBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLCB7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIGdsLFxuICAgICAgZGVidWcsXG4gICAgICB2aWV3cG9ydDoge3g6IDAsIHk6IDAsIHdpZHRoLCBoZWlnaHR9LFxuICAgICAgb25SZW5kZXJlckluaXRpYWxpemVkOiB0aGlzLl9vblJlbmRlcmVySW5pdGlhbGl6ZWQsXG4gICAgICBvbk5lZWRSZWRyYXc6IHRoaXMuX29uTmVlZFJlZHJhdyxcbiAgICAgIG9uUmVuZGVyRnJhbWU6IHRoaXMuX29uUmVuZGVyRnJhbWUsXG4gICAgICBvbk1vdXNlTW92ZTogdGhpcy5fb25Nb3VzZU1vdmUsXG4gICAgICBvbkNsaWNrOiB0aGlzLl9vbkNsaWNrXG4gICAgfSkpO1xuICB9XG59XG5cbkRlY2tHTC5wcm9wVHlwZXMgPSBwcm9wVHlwZXM7XG5EZWNrR0wuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
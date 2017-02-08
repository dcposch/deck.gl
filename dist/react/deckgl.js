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

// import {Viewport, WebMercatorViewport} from 'viewport-mercator-project';


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
      if (hasEvent && !hasPickableLayer) {
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
      var firstInfo = selectedInfos.find(function (info) {
        return info.index >= 0;
      });
      // Event.event holds the original MouseEvent object
      this.props.onLayerClick(firstInfo, selectedInfos, event.event);
    }

    // Route events to layers

  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(event) {
      var x = event.x,
          y = event.y;

      var selectedInfos = this.layerManager.pickLayer({ x: x, y: y, mode: 'hover' });
      var firstInfo = selectedInfos.find(function (info) {
        return info.index >= 0;
      });
      // Event.event holds the original MouseEvent object
      this.props.onLayerHover(firstInfo, selectedInfos, event.event);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZWFjdC9kZWNrZ2wuanMiXSwibmFtZXMiOlsibm9vcCIsInByb3BUeXBlcyIsImlkIiwic3RyaW5nIiwid2lkdGgiLCJudW1iZXIiLCJpc1JlcXVpcmVkIiwiaGVpZ2h0IiwibGF5ZXJzIiwiYXJyYXlPZiIsImluc3RhbmNlT2YiLCJlZmZlY3RzIiwiZ2wiLCJvYmplY3QiLCJkZWJ1ZyIsImJvb2wiLCJ2aWV3cG9ydCIsIm9uV2ViR0xJbml0aWFsaXplZCIsImZ1bmMiLCJvbkxheWVyQ2xpY2siLCJvbkxheWVySG92ZXIiLCJvbkFmdGVyUmVuZGVyIiwiZGVmYXVsdFByb3BzIiwiRGVja0dMIiwicHJvcHMiLCJzdGF0ZSIsIm5lZWRzUmVkcmF3IiwibGF5ZXJNYW5hZ2VyIiwiZWZmZWN0TWFuYWdlciIsIm5leHRQcm9wcyIsIl91cGRhdGVMYXllcnMiLCJsYXRpdHVkZSIsImxvbmdpdHVkZSIsInpvb20iLCJwaXRjaCIsImJlYXJpbmciLCJhbHRpdHVkZSIsInNldFZpZXdwb3J0IiwidXBkYXRlTGF5ZXJzIiwibmV3TGF5ZXJzIiwiY2FudmFzIiwiZW5hYmxlIiwiQkxFTkQiLCJibGVuZEZ1bmMiLCJTUkNfQUxQSEEiLCJPTkVfTUlOVVNfU1JDX0FMUEhBIiwiZWZmZWN0IiwiYWRkRWZmZWN0IiwiaGFzRXZlbnQiLCJoYXNQaWNrYWJsZUxheWVyIiwibWFwIiwibCIsInBpY2thYmxlIiwiaW5jbHVkZXMiLCJvbmNlIiwiZXZlbnRzIiwiY2FjaGVTaXplIiwiY2FjaGVQb3NpdGlvbiIsImNlbnRlck9yaWdpbiIsIm9uQ2xpY2siLCJfb25DbGljayIsIm9uTW91c2VNb3ZlIiwiX29uTW91c2VNb3ZlIiwiZXZlbnQiLCJ4IiwieSIsInNlbGVjdGVkSW5mb3MiLCJwaWNrTGF5ZXIiLCJtb2RlIiwiZmlyc3RJbmZvIiwiZmluZCIsImluZm8iLCJpbmRleCIsInJlZHJhdyIsImNsZWFyUmVkcmF3RmxhZ3MiLCJjbGVhciIsIkNPTE9SX0JVRkZFUl9CSVQiLCJERVBUSF9CVUZGRVJfQklUIiwicHJlRHJhdyIsImRyYXdMYXllcnMiLCJwYXNzIiwiZHJhdyIsIk9iamVjdCIsImFzc2lnbiIsIm9uUmVuZGVyZXJJbml0aWFsaXplZCIsIl9vblJlbmRlcmVySW5pdGlhbGl6ZWQiLCJvbk5lZWRSZWRyYXciLCJfb25OZWVkUmVkcmF3Iiwib25SZW5kZXJGcmFtZSIsIl9vblJlbmRlckZyYW1lIiwiQ29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQW1CQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQU9BOzs7QUFJQSxTQUFTQSxJQUFULEdBQWdCLENBQUU7O0FBRWxCLElBQU1DLFlBQVk7QUFDaEJDLE1BQUksaUJBQVVDLE1BREU7QUFFaEJDLFNBQU8saUJBQVVDLE1BQVYsQ0FBaUJDLFVBRlI7QUFHaEJDLFVBQVEsaUJBQVVGLE1BQVYsQ0FBaUJDLFVBSFQ7QUFJaEJFLFVBQVEsaUJBQVVDLE9BQVYsQ0FBa0IsaUJBQVVDLFVBQVYsWUFBbEIsRUFBK0NKLFVBSnZDO0FBS2hCSyxXQUFTLGlCQUFVRixPQUFWLENBQWtCLGlCQUFVQyxVQUFWLHNCQUFsQixDQUxPO0FBTWhCRSxNQUFJLGlCQUFVQyxNQU5FO0FBT2hCQyxTQUFPLGlCQUFVQyxJQVBEO0FBUWhCQyxZQUFVLGlCQUFVTixVQUFWLHFCQVJNO0FBU2hCTyxzQkFBb0IsaUJBQVVDLElBVGQ7QUFVaEJDLGdCQUFjLGlCQUFVRCxJQVZSO0FBV2hCRSxnQkFBYyxpQkFBVUYsSUFYUjtBQVloQkcsaUJBQWUsaUJBQVVIO0FBWlQsQ0FBbEI7O0FBZUEsSUFBTUksZUFBZTtBQUNuQnBCLE1BQUksZ0JBRGU7QUFFbkJZLFNBQU8sS0FGWTtBQUduQkYsTUFBSSxJ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aEU1QixxQkFBYSxLQUFLQyxZQVQ4QztBQVVoRUgsaUJBQVMsS0FBS0M7QUFWa0QsT0FBOUIsQ0FBN0IsQ0FBUDtBQVlEOzs7O0VBOUdpQyxnQkFBTThCLFM7O2tCQUFyQm5FLE07OztBQWlIckJBLE9BQU90QixTQUFQLEdBQW1CQSxTQUFuQjtBQUNBc0IsT0FBT0QsWUFBUCxHQUFzQkEsWUFBdEIiLCJmaWxlIjoiZGVja2dsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cbmltcG9ydCBSZWFjdCwge1Byb3BUeXBlcywgY3JlYXRlRWxlbWVudH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGF1dG9iaW5kIGZyb20gJy4vYXV0b2JpbmQnO1xuaW1wb3J0IFdlYkdMUmVuZGVyZXIgZnJvbSAnLi93ZWJnbC1yZW5kZXJlcic7XG5pbXBvcnQge0xheWVyTWFuYWdlciwgTGF5ZXJ9IGZyb20gJy4uL2xpYic7XG5pbXBvcnQge0VmZmVjdE1hbmFnZXIsIEVmZmVjdH0gZnJvbSAnLi4vZXhwZXJpbWVudGFsJztcbmltcG9ydCB7R0wsIGFkZEV2ZW50c30gZnJvbSAnbHVtYS5nbCc7XG4vLyBpbXBvcnQge1ZpZXdwb3J0LCBXZWJNZXJjYXRvclZpZXdwb3J0fSBmcm9tICd2aWV3cG9ydC1tZXJjYXRvci1wcm9qZWN0JztcbmltcG9ydCB7Vmlld3BvcnQsIFdlYk1lcmNhdG9yVmlld3BvcnR9IGZyb20gJy4uL2xpYi92aWV3cG9ydHMnO1xuaW1wb3J0IHtsb2d9IGZyb20gJy4uL2xpYi91dGlscyc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIGlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICB3aWR0aDogUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICBoZWlnaHQ6IFByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgbGF5ZXJzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuaW5zdGFuY2VPZihMYXllcikpLmlzUmVxdWlyZWQsXG4gIGVmZmVjdHM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5pbnN0YW5jZU9mKEVmZmVjdCkpLFxuICBnbDogUHJvcFR5cGVzLm9iamVjdCxcbiAgZGVidWc6IFByb3BUeXBlcy5ib29sLFxuICB2aWV3cG9ydDogUHJvcFR5cGVzLmluc3RhbmNlT2YoVmlld3BvcnQpLFxuICBvbldlYkdMSW5pdGlhbGl6ZWQ6IFByb3BUeXBlcy5mdW5jLFxuICBvbkxheWVyQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuICBvbkxheWVySG92ZXI6IFByb3BUeXBlcy5mdW5jLFxuICBvbkFmdGVyUmVuZGVyOiBQcm9wVHlwZXMuZnVuY1xufTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBpZDogJ2RlY2tnbC1vdmVybGF5JyxcbiAgZGVidWc6IGZhbHNlLFxuICBnbDogbnVsbCxcbiAgZWZmZWN0czogW10sXG4gIG9uV2ViR0xJbml0aWFsaXplZDogbm9vcCxcbiAgb25MYXllckNsaWNrOiBub29wLFxuICBvbkxheWVySG92ZXI6IG5vb3AsXG4gIG9uQWZ0ZXJSZW5kZXI6IG5vb3Bcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlY2tHTCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICB0aGlzLmxheWVyTWFuYWdlciA9IG51bGw7XG4gICAgdGhpcy5lZmZlY3RNYW5hZ2VyID0gbnVsbDtcbiAgICBhdXRvYmluZCh0aGlzKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgdGhpcy5fdXBkYXRlTGF5ZXJzKG5leHRQcm9wcyk7XG4gIH1cblxuICBfdXBkYXRlTGF5ZXJzKG5leHRQcm9wcykge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0LCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCB6b29tLCBwaXRjaCwgYmVhcmluZywgYWx0aXR1ZGV9ID0gbmV4dFByb3BzO1xuICAgIGxldCB7dmlld3BvcnR9ID0gbmV4dFByb3BzO1xuXG4gICAgLy8gSWYgVmlld3BvcnQgaXMgbm90IHN1cHBsaWVkLCBjcmVhdGUgb25lIGZyb20gbWVyY2F0b3IgcHJvcHNcbiAgICB2aWV3cG9ydCA9IHZpZXdwb3J0IHx8IG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHtcbiAgICAgIHdpZHRoLCBoZWlnaHQsIGxhdGl0dWRlLCBsb25naXR1ZGUsIHpvb20sIHBpdGNoLCBiZWFyaW5nLCBhbHRpdHVkZVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMubGF5ZXJNYW5hZ2VyKSB7XG4gICAgICB0aGlzLmxheWVyTWFuYWdlclxuICAgICAgICAuc2V0Vmlld3BvcnQodmlld3BvcnQpXG4gICAgICAgIC51cGRhdGVMYXllcnMoe25ld0xheWVyczogbmV4dFByb3BzLmxheWVyc30pO1xuICAgIH1cbiAgfVxuXG4gIF9vblJlbmRlcmVySW5pdGlhbGl6ZWQoe2dsLCBjYW52YXN9KSB7XG4gICAgZ2wuZW5hYmxlKEdMLkJMRU5EKTtcbiAgICBnbC5ibGVuZEZ1bmMoR0wuU1JDX0FMUEhBLCBHTC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcblxuICAgIHRoaXMucHJvcHMub25XZWJHTEluaXRpYWxpemVkKGdsKTtcblxuICAgIC8vIE5vdGU6IGF2b2lkIFJlYWN0IHNldFN0YXRlIGR1ZSBHTCBhbmltYXRpb24gbG9vcCAvIHNldFN0YXRlIHRpbWluZyBpc3N1ZVxuICAgIHRoaXMubGF5ZXJNYW5hZ2VyID0gbmV3IExheWVyTWFuYWdlcih7Z2x9KTtcbiAgICB0aGlzLmVmZmVjdE1hbmFnZXIgPSBuZXcgRWZmZWN0TWFuYWdlcih7Z2wsIGxheWVyTWFuYWdlcjogdGhpcy5sYXllck1hbmFnZXJ9KTtcbiAgICBmb3IgKGNvbnN0IGVmZmVjdCBvZiB0aGlzLnByb3BzLmVmZmVjdHMpIHtcbiAgICAgIHRoaXMuZWZmZWN0TWFuYWdlci5hZGRFZmZlY3QoZWZmZWN0KTtcbiAgICB9XG4gICAgdGhpcy5fdXBkYXRlTGF5ZXJzKHRoaXMucHJvcHMpO1xuXG4gICAgLy8gQ2hlY2sgaWYgYSBtb3VzZSBldmVudCBoYXMgYmVlbiBzcGVjaWZpZWQgYW5kIHRoYXQgYXQgbGVhc3Qgb25lIG9mIHRoZSBsYXllcnMgaXMgcGlja2FibGVcbiAgICBjb25zdCBoYXNFdmVudCA9IHRoaXMucHJvcHMub25MYXllckNsaWNrICE9PSBub29wIHx8IHRoaXMucHJvcHMub25MYXllckhvdmVyICE9PSBub29wO1xuICAgIGNvbnN0IGhhc1BpY2thYmxlTGF5ZXIgPSB0aGlzLmxheWVyTWFuYWdlci5sYXllcnMubWFwKGwgPT4gbC5wcm9wcy5waWNrYWJsZSkuaW5jbHVkZXModHJ1ZSk7XG4gICAgaWYgKGhhc0V2ZW50ICYmICFoYXNQaWNrYWJsZUxheWVyKSB7XG4gICAgICBsb2cub25jZShcbiAgICAgICAgMCxcbiAgICAgICAgJ1lvdSBoYXZlIHN1cHBsaWVkIGEgbW91c2UgZXZlbnQgaGFuZGxlciBidXQgbm9uZSBvZiB5b3VyIGxheWVycyBnb3QgdGhlIGBwaWNrYWJsZWAgZmxhZy4nXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMuZXZlbnRzID0gYWRkRXZlbnRzKGNhbnZhcywge1xuICAgICAgY2FjaGVTaXplOiBmYWxzZSxcbiAgICAgIGNhY2hlUG9zaXRpb246IGZhbHNlLFxuICAgICAgY2VudGVyT3JpZ2luOiBmYWxzZSxcbiAgICAgIG9uQ2xpY2s6IHRoaXMuX29uQ2xpY2ssXG4gICAgICBvbk1vdXNlTW92ZTogdGhpcy5fb25Nb3VzZU1vdmVcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFJvdXRlIGV2ZW50cyB0byBsYXllcnNcbiAgX29uQ2xpY2soZXZlbnQpIHtcbiAgICBjb25zdCB7eCwgeX0gPSBldmVudDtcbiAgICBjb25zdCBzZWxlY3RlZEluZm9zID0gdGhpcy5sYXllck1hbmFnZXIucGlja0xheWVyKHt4LCB5LCBtb2RlOiAnY2xpY2snfSk7XG4gICAgY29uc3QgZmlyc3RJbmZvID0gc2VsZWN0ZWRJbmZvcy5maW5kKGluZm8gPT4gaW5mby5pbmRleCA+PSAwKTtcbiAgICAvLyBFdmVudC5ldmVudCBob2xkcyB0aGUgb3JpZ2luYWwgTW91c2VFdmVudCBvYmplY3RcbiAgICB0aGlzLnByb3BzLm9uTGF5ZXJDbGljayhmaXJzdEluZm8sIHNlbGVjdGVkSW5mb3MsIGV2ZW50LmV2ZW50KTtcbiAgfVxuXG4gIC8vIFJvdXRlIGV2ZW50cyB0byBsYXllcnNcbiAgX29uTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgY29uc3Qge3gsIHl9ID0gZXZlbnQ7XG4gICAgY29uc3Qgc2VsZWN0ZWRJbmZvcyA9IHRoaXMubGF5ZXJNYW5hZ2VyLnBpY2tMYXllcih7eCwgeSwgbW9kZTogJ2hvdmVyJ30pO1xuICAgIGNvbnN0IGZpcnN0SW5mbyA9IHNlbGVjdGVkSW5mb3MuZmluZChpbmZvID0+IGluZm8uaW5kZXggPj0gMCk7XG4gICAgLy8gRXZlbnQuZXZlbnQgaG9sZHMgdGhlIG9yaWdpbmFsIE1vdXNlRXZlbnQgb2JqZWN0XG4gICAgdGhpcy5wcm9wcy5vbkxheWVySG92ZXIoZmlyc3RJbmZvLCBzZWxlY3RlZEluZm9zLCBldmVudC5ldmVudCk7XG4gIH1cblxuICBfb25SZW5kZXJGcmFtZSh7Z2x9KSB7XG4gICAgY29uc3QgcmVkcmF3ID0gdGhpcy5sYXllck1hbmFnZXIubmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3M6IHRydWV9KTtcbiAgICBpZiAoIXJlZHJhdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNsZWFyIGRlcHRoIGFuZCBjb2xvciBidWZmZXJzXG4gICAgZ2wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xuXG4gICAgdGhpcy5lZmZlY3RNYW5hZ2VyLnByZURyYXcoKTtcbiAgICB0aGlzLmxheWVyTWFuYWdlci5kcmF3TGF5ZXJzKHtwYXNzOiAncHJpbWFyeSd9KTtcbiAgICB0aGlzLmVmZmVjdE1hbmFnZXIuZHJhdygpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0LCBnbCwgZGVidWd9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiBjcmVhdGVFbGVtZW50KFdlYkdMUmVuZGVyZXIsIE9iamVjdC5hc3NpZ24oe30sIHRoaXMucHJvcHMsIHtcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgZ2wsXG4gICAgICBkZWJ1ZyxcbiAgICAgIHZpZXdwb3J0OiB7eDogMCwgeTogMCwgd2lkdGgsIGhlaWdodH0sXG4gICAgICBvblJlbmRlcmVySW5pdGlhbGl6ZWQ6IHRoaXMuX29uUmVuZGVyZXJJbml0aWFsaXplZCxcbiAgICAgIG9uTmVlZFJlZHJhdzogdGhpcy5fb25OZWVkUmVkcmF3LFxuICAgICAgb25SZW5kZXJGcmFtZTogdGhpcy5fb25SZW5kZXJGcmFtZSxcbiAgICAgIG9uTW91c2VNb3ZlOiB0aGlzLl9vbk1vdXNlTW92ZSxcbiAgICAgIG9uQ2xpY2s6IHRoaXMuX29uQ2xpY2tcbiAgICB9KSk7XG4gIH1cbn1cblxuRGVja0dMLnByb3BUeXBlcyA9IHByb3BUeXBlcztcbkRlY2tHTC5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
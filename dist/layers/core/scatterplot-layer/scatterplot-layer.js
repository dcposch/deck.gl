'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _utils = require('../../../lib/utils');

var _fp = require('../../../lib/utils/fp64');

var _luma = require('luma.gl');

var _scatterplotLayerVertex = require('./scatterplot-layer-vertex.glsl');

var _scatterplotLayerVertex2 = _interopRequireDefault(_scatterplotLayerVertex);

var _scatterplotLayerVertex3 = require('./scatterplot-layer-vertex-64.glsl');

var _scatterplotLayerVertex4 = _interopRequireDefault(_scatterplotLayerVertex3);

var _scatterplotLayerFragment = require('./scatterplot-layer-fragment.glsl');

var _scatterplotLayerFragment2 = _interopRequireDefault(_scatterplotLayerFragment);

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

var DEFAULT_COLOR = [0, 0, 0, 255];

var defaultProps = {
  radiusScale: 1, //  point radius in meters
  radiusMinPixels: 0, //  min point radius in pixels
  radiusMaxPixels: Number.MAX_SAFE_INTEGER, // max point radius in pixels
  strokeWidth: 1,
  outline: false,
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getRadius: function getRadius(x) {
    return x.radius || 1;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  }
};

var ScatterplotLayer = function (_Layer) {
  _inherits(ScatterplotLayer, _Layer);

  function ScatterplotLayer() {
    _classCallCheck(this, ScatterplotLayer);

    return _possibleConstructorReturn(this, (ScatterplotLayer.__proto__ || Object.getPrototypeOf(ScatterplotLayer)).apply(this, arguments));
  }

  _createClass(ScatterplotLayer, [{
    key: 'getShaders',
    value: function getShaders(id) {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _scatterplotLayerVertex4.default, fs: _scatterplotLayerFragment2.default, modules: ['fp64', 'project64']
      } : {
        vs: _scatterplotLayerVertex2.default, fs: _scatterplotLayerFragment2.default, modules: []
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this._getModel(gl) });

      /* eslint-disable max-len */
      /* deprecated props check */
      this._checkRemovedProp('radius', 'radiusScale');
      this._checkRemovedProp('drawOutline', 'outline');

      this.state.attributeManager.addInstanced({
        instancePositions: { size: 3, accessor: 'getPosition', update: this.calculateInstancePositions },
        instanceRadius: { size: 1, accessor: 'getRadius', defaultValue: 1, update: this.calculateInstanceRadius },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateAttribute',
    value: function updateAttribute(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (props.fp64 !== oldProps.fp64) {
        var attributeManager = this.state.attributeManager;

        attributeManager.invalidateAll();

        if (props.fp64 && props.projectionMode === _lib.COORDINATE_SYSTEM.LNG_LAT) {
          attributeManager.addInstanced({
            instancePositions64xyLow: {
              size: 2,
              accessor: 'getPosition',
              update: this.calculateInstancePositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instancePositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(ScatterplotLayer.prototype.__proto__ || Object.getPrototypeOf(ScatterplotLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var _props = this.props,
          radiusScale = _props.radiusScale,
          radiusMinPixels = _props.radiusMinPixels,
          radiusMaxPixels = _props.radiusMaxPixels,
          outline = _props.outline,
          strokeWidth = _props.strokeWidth;

      this.state.model.render(Object.assign({}, uniforms, {
        outline: outline ? 1 : 0,
        strokeWidth: strokeWidth,
        radiusScale: radiusScale,
        radiusMinPixels: radiusMinPixels,
        radiusMaxPixels: radiusMaxPixels
      }));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      // a square that minimally cover the unit circle
      var positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          positions: new Float32Array(positions)
        }),
        isInstanced: true
      });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var position = getPosition(point);
          value[i++] = (0, _utils.get)(position, 0);
          value[i++] = (0, _utils.get)(position, 1);
          value[i++] = (0, _utils.get)(position, 2) || 0;
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
    }
  }, {
    key: 'calculateInstancePositions64xyLow',
    value: function calculateInstancePositions64xyLow(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getPosition = _props3.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;

          var position = getPosition(point);
          value[i++] = (0, _fp.fp64ify)((0, _utils.get)(position, 0))[1];
          value[i++] = (0, _fp.fp64ify)((0, _utils.get)(position, 1))[1];
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceRadius',
    value: function calculateInstanceRadius(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getRadius = _props4.getRadius;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var point = _step3.value;

          var radius = getRadius(point);
          value[i++] = isNaN(radius) ? 1 : radius;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props5 = this.props,
          data = _props5.data,
          getColor = _props5.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var point = _step4.value;

          var color = getColor(point) || DEFAULT_COLOR;
          value[i++] = (0, _utils.get)(color, 0);
          value[i++] = (0, _utils.get)(color, 1);
          value[i++] = (0, _utils.get)(color, 2);
          value[i++] = isNaN((0, _utils.get)(color, 3)) ? 255 : (0, _utils.get)(color, 3);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }]);

  return ScatterplotLayer;
}(_lib.Layer);

exports.default = ScatterplotLayer;


ScatterplotLayer.layerName = 'ScatterplotLayer';
ScatterplotLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zY2F0dGVycGxvdC1sYXllci9zY2F0dGVycGxvdC1sYXllci5qcyJdLCJuYW1lcyI6WyJERUZBVUxUX0NPTE9SIiwiZGVmYXVsdFByb3BzIiwicmFkaXVzU2NhbGUiLCJyYWRpdXNNaW5QaXhlbHMiLCJyYWRpdXNNYXhQaXhlbHMiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwic3Ryb2tlV2lkdGgiLCJvdXRsaW5lIiwiZnA2NCIsImdldFBvc2l0aW9uIiwieCIsInBvc2l0aW9uIiwiZ2V0UmFkaXVzIiwicmFkaXVzIiwiZ2V0Q29sb3IiLCJjb2xvciIsIlNjYXR0ZXJwbG90TGF5ZXIiLCJpZCIsInByb3BzIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2dldE1vZGVsIiwiX2NoZWNrUmVtb3ZlZFByb3AiLCJzdGF0ZSIsImF0dHJpYnV0ZU1hbmFnZXIiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBvc2l0aW9ucyIsInNpemUiLCJhY2Nlc3NvciIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zIiwiaW5zdGFuY2VSYWRpdXMiLCJkZWZhdWx0VmFsdWUiLCJjYWxjdWxhdGVJbnN0YW5jZVJhZGl1cyIsImluc3RhbmNlQ29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJpbnZhbGlkYXRlQWxsIiwicHJvamVjdGlvbk1vZGUiLCJMTkdfTEFUIiwiaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwicmVtb3ZlIiwidXBkYXRlQXR0cmlidXRlIiwidW5pZm9ybXMiLCJyZW5kZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJwb3NpdGlvbnMiLCJzaGFkZXJzIiwiZ2V0U2hhZGVycyIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJUUklBTkdMRV9GQU4iLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsImkiLCJwb2ludCIsImlzTmFOIiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBb0JBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUE3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBYUEsSUFBTUEsZ0JBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsR0FBVixDQUF0Qjs7QUFFQSxJQUFNQyxlQUFlO0FBQ25CQyxlQUFhLENBRE0sRUFDRjtBQUNqQkMsbUJBQWlCLENBRkUsRUFFQztBQUNwQkMsbUJBQWlCQyxPQUFPQyxnQkFITCxFQUd1QjtBQUMxQ0MsZUFBYSxDQUpNO0FBS25CQyxXQUFTLEtBTFU7QUFNbkJDLFFBQU0sS0FOYTs7QUFRbkJDLGVBQWE7QUFBQSxXQUFLQyxFQUFFQyxRQUFQO0FBQUEsR0FSTTtBQVNuQkMsYUFBVztBQUFBLFdBQUtGLEVBQUVHLE1BQUYsSUFBWSxDQUFqQjtBQUFBLEdBVFE7QUFVbkJDLFlBQVU7QUFBQSxXQUFLSixFQUFFSyxLQUFGLElBQVdoQixhQUFoQjtBQUFBO0FBVlMsQ0FBckI7O0lBYXFCaUIsZ0I7Ozs7Ozs7Ozs7OytCQUNSQyxFLEVBQUk7QUFDYixhQUFPLDRCQUFtQixLQUFLQyxLQUF4QixJQUFpQztBQUN0Q0MsNENBRHNDLEVBQ2JDLHNDQURhLEVBQ1lDLFNBQVMsQ0FBQyxNQUFELEVBQVMsV0FBVDtBQURyQixPQUFqQyxHQUVIO0FBQ0ZGLDRDQURFLEVBQ3FCQyxzQ0FEckIsRUFDOENDLFNBQVM7QUFEdkQsT0FGSjtBQUtEOzs7c0NBRWlCO0FBQUEsVUFDVEMsRUFEUyxHQUNILEtBQUtDLE9BREYsQ0FDVEQsRUFEUzs7QUFFaEIsV0FBS0UsUUFBTCxDQUFjLEVBQUNDLE9BQU8sS0FBS0MsU0FBTCxDQUFlSixFQUFmLENBQVIsRUFBZDs7QUFFQTtBQUNBO0FBQ0EsV0FBS0ssaUJBQUwsQ0FBdUIsUUFBdkIsRUFBaUMsYUFBakM7QUFDQSxXQUFLQSxpQkFBTCxDQUF1QixhQUF2QixFQUFzQyxTQUF0Qzs7QUFFQSxXQUFLQyxLQUFMLENBQVdDLGdCQUFYLENBQTRCQyxZQUE1QixDQUF5QztBQUN2Q0MsMkJBQW1CLEVBQUNDLE1BQU0sQ0FBUCxFQUFVQyxVQUFVLGFBQXBCLEVBQW1DQyxRQUFRLEtBQUtDLDBCQUFoRCxFQURvQjtBQUV2Q0Msd0JBQWdCLEVBQUNKLE1BQU0sQ0FBUCxFQUFVQyxVQUFVLFdBQXBCLEVBQWlDSSxjQUFjLENBQS9DLEVBQWtESCxRQUFRLEtBQUtJLHVCQUEvRCxFQUZ1QjtBQUd2Q0Msd0JBQWdCLEVBQUNQLE1BQU0sQ0FBUCxFQUFVUSxNQUFNLFNBQUdDLGFBQW5CLEVBQWtDUixVQUFVLFVBQTVDLEVBQXdEQyxRQUFRLEtBQUtRLHVCQUFyRTtBQUh1QixPQUF6QztBQUtBO0FBQ0Q7OzswQ0FFK0M7QUFBQSxVQUEvQnhCLEtBQStCLFFBQS9CQSxLQUErQjtBQUFBLFVBQXhCeUIsUUFBd0IsUUFBeEJBLFFBQXdCO0FBQUEsVUFBZEMsV0FBYyxRQUFkQSxXQUFjOztBQUM5QyxVQUFJMUIsTUFBTVYsSUFBTixLQUFlbUMsU0FBU25DLElBQTVCLEVBQWtDO0FBQUEsWUFDekJxQixnQkFEeUIsR0FDTCxLQUFLRCxLQURBLENBQ3pCQyxnQkFEeUI7O0FBRWhDQSx5QkFBaUJnQixhQUFqQjs7QUFFQSxZQUFJM0IsTUFBTVYsSUFBTixJQUFjVSxNQUFNNEIsY0FBTixLQUF5Qix1QkFBa0JDLE9BQTdELEVBQXNFO0FBQ3BFbEIsMkJBQWlCQyxZQUFqQixDQUE4QjtBQUM1QmtCLHNDQUEwQjtBQUN4QmhCLG9CQUFNLENBRGtCO0FBRXhCQyx3QkFBVSxhQUZjO0FBR3hCQyxzQkFBUSxLQUFLZTtBQUhXO0FBREUsV0FBOUI7QUFPRCxTQVJELE1BUU87QUFDTHBCLDJCQUFpQnFCLE1BQWpCLENBQXdCLENBQ3RCLDBCQURzQixDQUF4QjtBQUdEO0FBRUY7QUFDRjs7O3VDQUUyQztBQUFBLFVBQS9CaEMsS0FBK0IsU0FBL0JBLEtBQStCO0FBQUEsVUFBeEJ5QixRQUF3QixTQUF4QkEsUUFBd0I7QUFBQSxVQUFkQyxXQUFjLFNBQWRBLFdBQWM7O0FBQzFDLHNJQUFrQixFQUFDMUIsWUFBRCxFQUFReUIsa0JBQVIsRUFBa0JDLHdCQUFsQixFQUFsQjtBQUNBLFVBQUkxQixNQUFNVixJQUFOLEtBQWVtQyxTQUFTbkMsSUFBNUIsRUFBa0M7QUFBQSxZQUN6QmMsRUFEeUIsR0FDbkIsS0FBS0MsT0FEYyxDQUN6QkQsRUFEeUI7O0FBRWhDLGFBQUtFLFFBQUwsQ0FBYyxFQUFDQyxPQUFPLEtBQUtDLFNBQUwsQ0FBZUosRUFBZixDQUFSLEVBQWQ7QUFDRDtBQUNELFdBQUs2QixlQUFMLENBQXFCLEVBQUNqQyxZQUFELEVBQVF5QixrQkFBUixFQUFrQkMsd0JBQWxCLEVBQXJCO0FBQ0Q7OztnQ0FFZ0I7QUFBQSxVQUFYUSxRQUFXLFNBQVhBLFFBQVc7QUFBQSxtQkFDK0QsS0FBS2xDLEtBRHBFO0FBQUEsVUFDUmpCLFdBRFEsVUFDUkEsV0FEUTtBQUFBLFVBQ0tDLGVBREwsVUFDS0EsZUFETDtBQUFBLFVBQ3NCQyxlQUR0QixVQUNzQkEsZUFEdEI7QUFBQSxVQUN1Q0ksT0FEdkMsVUFDdUNBLE9BRHZDO0FBQUEsVUFDZ0RELFdBRGhELFVBQ2dEQSxXQURoRDs7QUFFZixXQUFLc0IsS0FBTCxDQUFXSCxLQUFYLENBQWlCNEIsTUFBakIsQ0FBd0JDLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCSCxRQUFsQixFQUE0QjtBQUNsRDdDLGlCQUFTQSxVQUFVLENBQVYsR0FBYyxDQUQyQjtBQUVsREQsZ0NBRmtEO0FBR2xETCxnQ0FIa0Q7QUFJbERDLHdDQUprRDtBQUtsREM7QUFMa0QsT0FBNUIsQ0FBeEI7QUFPRDs7OzhCQUVTbUIsRSxFQUFJO0FBQ1o7QUFDQSxVQUFNa0MsWUFBWSxDQUFDLENBQUMsQ0FBRixFQUFLLENBQUMsQ0FBTixFQUFTLENBQVQsRUFBWSxDQUFDLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsRUFBK0IsQ0FBL0IsRUFBa0MsQ0FBQyxDQUFuQyxFQUFzQyxDQUF0QyxDQUFsQjtBQUNBLFVBQU1DLFVBQVUsa0NBQWdCbkMsRUFBaEIsRUFBb0IsS0FBS29DLFVBQUwsRUFBcEIsQ0FBaEI7O0FBRUEsYUFBTyxnQkFBVTtBQUNmcEMsY0FEZTtBQUVmTCxZQUFJLEtBQUtDLEtBQUwsQ0FBV0QsRUFGQTtBQUdmRSxZQUFJc0MsUUFBUXRDLEVBSEc7QUFJZkMsWUFBSXFDLFFBQVFyQyxFQUpHO0FBS2Z1QyxrQkFBVSxtQkFBYTtBQUNyQkMsb0JBQVUsU0FBR0MsWUFEUTtBQUVyQkwscUJBQVcsSUFBSU0sWUFBSixDQUFpQk4sU0FBakI7QUFGVSxTQUFiLENBTEs7QUFTZk8scUJBQWE7QUFURSxPQUFWLENBQVA7QUFXRDs7OytDQUUwQkMsUyxFQUFXO0FBQUEsb0JBQ1IsS0FBSzlDLEtBREc7QUFBQSxVQUM3QitDLElBRDZCLFdBQzdCQSxJQUQ2QjtBQUFBLFVBQ3ZCeEQsV0FEdUIsV0FDdkJBLFdBRHVCO0FBQUEsVUFFN0J5RCxLQUY2QixHQUVwQkYsU0FGb0IsQ0FFN0JFLEtBRjZCOztBQUdwQyxVQUFJQyxJQUFJLENBQVI7QUFIb0M7QUFBQTtBQUFBOztBQUFBO0FBSXBDLDZCQUFvQkYsSUFBcEIsOEhBQTBCO0FBQUEsY0FBZkcsS0FBZTs7QUFDeEIsY0FBTXpELFdBQVdGLFlBQVkyRCxLQUFaLENBQWpCO0FBQ0FGLGdCQUFNQyxHQUFOLElBQWEsZ0JBQUl4RCxRQUFKLEVBQWMsQ0FBZCxDQUFiO0FBQ0F1RCxnQkFBTUMsR0FBTixJQUFhLGdCQUFJeEQsUUFBSixFQUFjLENBQWQsQ0FBYjtBQUNBdUQsZ0JBQU1DLEdBQU4sSUFBYSxnQkFBSXhELFFBQUosRUFBYyxDQUFkLEtBQW9CLENBQWpDO0FBQ0Q7QUFUbUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVVyQzs7O3NEQUVpQ3FELFMsRUFBVztBQUFBLG9CQUNmLEtBQUs5QyxLQURVO0FBQUEsVUFDcEMrQyxJQURvQyxXQUNwQ0EsSUFEb0M7QUFBQSxVQUM5QnhELFdBRDhCLFdBQzlCQSxXQUQ4QjtBQUFBLFVBRXBDeUQsS0FGb0MsR0FFM0JGLFNBRjJCLENBRXBDRSxLQUZvQzs7QUFHM0MsVUFBSUMsSUFBSSxDQUFSO0FBSDJDO0FBQUE7QUFBQTs7QUFBQTtBQUkzQyw4QkFBb0JGLElBQXBCLG1JQUEwQjtBQUFBLGNBQWZHLEtBQWU7O0FBQ3hCLGNBQU16RCxXQUFXRixZQUFZMkQsS0FBWixDQUFqQjtBQUNBRixnQkFBTUMsR0FBTixJQUFhLGlCQUFRLGdCQUFJeEQsUUFBSixFQUFjLENBQWQsQ0FBUixFQUEwQixDQUExQixDQUFiO0FBQ0F1RCxnQkFBTUMsR0FBTixJQUFhLGlCQUFRLGdCQUFJeEQsUUFBSixFQUFjLENBQWQsQ0FBUixFQUEwQixDQUExQixDQUFiO0FBQ0Q7QUFSMEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVM1Qzs7OzRDQUV1QnFELFMsRUFBVztBQUFBLG9CQUNQLEtBQUs5QyxLQURFO0FBQUEsVUFDMUIrQyxJQUQwQixXQUMxQkEsSUFEMEI7QUFBQSxVQUNwQnJELFNBRG9CLFdBQ3BCQSxTQURvQjtBQUFBLFVBRTFCc0QsS0FGMEIsR0FFakJGLFNBRmlCLENBRTFCRSxLQUYwQjs7QUFHakMsVUFBSUMsSUFBSSxDQUFSO0FBSGlDO0FBQUE7QUFBQTs7QUFBQTtBQUlqQyw4QkFBb0JGLElBQXBCLG1JQUEwQjtBQUFBLGNBQWZHLEtBQWU7O0FBQ3hCLGNBQU12RCxTQUFTRCxVQUFVd0QsS0FBVixDQUFmO0FBQ0FGLGdCQUFNQyxHQUFOLElBQWFFLE1BQU14RCxNQUFOLElBQWdCLENBQWhCLEdBQW9CQSxNQUFqQztBQUNEO0FBUGdDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRbEM7Ozs0Q0FFdUJtRCxTLEVBQVc7QUFBQSxvQkFDUixLQUFLOUMsS0FERztBQUFBLFVBQzFCK0MsSUFEMEIsV0FDMUJBLElBRDBCO0FBQUEsVUFDcEJuRCxRQURvQixXQUNwQkEsUUFEb0I7QUFBQSxVQUUxQm9ELEtBRjBCLEdBRWpCRixTQUZpQixDQUUxQkUsS0FGMEI7O0FBR2pDLFVBQUlDLElBQUksQ0FBUjtBQUhpQztBQUFBO0FBQUE7O0FBQUE7QUFJakMsOEJBQW9CRixJQUFwQixtSUFBMEI7QUFBQSxjQUFmRyxLQUFlOztBQUN4QixjQUFNckQsUUFBUUQsU0FBU3NELEtBQVQsS0FBbUJyRSxhQUFqQztBQUNBbUUsZ0JBQU1DLEdBQU4sSUFBYSxnQkFBSXBELEtBQUosRUFBVyxDQUFYLENBQWI7QUFDQW1ELGdCQUFNQyxHQUFOLElBQWEsZ0JBQUlwRCxLQUFKLEVBQVcsQ0FBWCxDQUFiO0FBQ0FtRCxnQkFBTUMsR0FBTixJQUFhLGdCQUFJcEQsS0FBSixFQUFXLENBQVgsQ0FBYjtBQUNBbUQsZ0JBQU1DLEdBQU4sSUFBYUUsTUFBTSxnQkFBSXRELEtBQUosRUFBVyxDQUFYLENBQU4sSUFBdUIsR0FBdkIsR0FBNkIsZ0JBQUlBLEtBQUosRUFBVyxDQUFYLENBQTFDO0FBQ0Q7QUFWZ0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVdsQzs7Ozs7O2tCQWxJa0JDLGdCOzs7QUFxSXJCQSxpQkFBaUJzRCxTQUFqQixHQUE2QixrQkFBN0I7QUFDQXRELGlCQUFpQmhCLFlBQWpCLEdBQWdDQSxZQUFoQyIsImZpbGUiOiJzY2F0dGVycGxvdC1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU19IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2dldH0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzJztcbmltcG9ydCB7ZnA2NGlmeSwgZW5hYmxlNjRiaXRTdXBwb3J0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuXG5pbXBvcnQgc2NhdHRlcnBsb3RWZXJ0ZXggZnJvbSAnLi9zY2F0dGVycGxvdC1sYXllci12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgc2NhdHRlcnBsb3RWZXJ0ZXg2NCBmcm9tICcuL3NjYXR0ZXJwbG90LWxheWVyLXZlcnRleC02NC5nbHNsJztcbmltcG9ydCBzY2F0dGVycGxvdEZyYWdtZW50IGZyb20gJy4vc2NhdHRlcnBsb3QtbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICByYWRpdXNTY2FsZTogMSwgIC8vICBwb2ludCByYWRpdXMgaW4gbWV0ZXJzXG4gIHJhZGl1c01pblBpeGVsczogMCwgLy8gIG1pbiBwb2ludCByYWRpdXMgaW4gcGl4ZWxzXG4gIHJhZGl1c01heFBpeGVsczogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIC8vIG1heCBwb2ludCByYWRpdXMgaW4gcGl4ZWxzXG4gIHN0cm9rZVdpZHRoOiAxLFxuICBvdXRsaW5lOiBmYWxzZSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgZ2V0UG9zaXRpb246IHggPT4geC5wb3NpdGlvbixcbiAgZ2V0UmFkaXVzOiB4ID0+IHgucmFkaXVzIHx8IDEsXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUlxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2NhdHRlcnBsb3RMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycyhpZCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcykgPyB7XG4gICAgICB2czogc2NhdHRlcnBsb3RWZXJ0ZXg2NCwgZnM6IHNjYXR0ZXJwbG90RnJhZ21lbnQsIG1vZHVsZXM6IFsnZnA2NCcsICdwcm9qZWN0NjQnXVxuICAgIH0gOiB7XG4gICAgICB2czogc2NhdHRlcnBsb3RWZXJ0ZXgsIGZzOiBzY2F0dGVycGxvdEZyYWdtZW50LCBtb2R1bGVzOiBbXVxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgLyogZGVwcmVjYXRlZCBwcm9wcyBjaGVjayAqL1xuICAgIHRoaXMuX2NoZWNrUmVtb3ZlZFByb3AoJ3JhZGl1cycsICdyYWRpdXNTY2FsZScpO1xuICAgIHRoaXMuX2NoZWNrUmVtb3ZlZFByb3AoJ2RyYXdPdXRsaW5lJywgJ291dGxpbmUnKTtcblxuICAgIHRoaXMuc3RhdGUuYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM6IHtzaXplOiAzLCBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zfSxcbiAgICAgIGluc3RhbmNlUmFkaXVzOiB7c2l6ZTogMSwgYWNjZXNzb3I6ICdnZXRSYWRpdXMnLCBkZWZhdWx0VmFsdWU6IDEsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVJhZGl1c30sXG4gICAgICBpbnN0YW5jZUNvbG9yczoge3NpemU6IDQsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0Q29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnN9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gIH1cblxuICB1cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcblxuICAgICAgaWYgKHByb3BzLmZwNjQgJiYgcHJvcHMucHJvamVjdGlvbk1vZGUgPT09IENPT1JESU5BVEVfU1lTVEVNLkxOR19MQVQpIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgICAgIGluc3RhbmNlUG9zaXRpb25zNjR4eUxvdzoge1xuICAgICAgICAgICAgc2l6ZTogMixcbiAgICAgICAgICAgIGFjY2Vzc29yOiAnZ2V0UG9zaXRpb24nLFxuICAgICAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjR4eUxvd1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLnJlbW92ZShbXG4gICAgICAgICAgJ2luc3RhbmNlUG9zaXRpb25zNjR4eUxvdydcbiAgICAgICAgXSk7XG4gICAgICB9XG5cbiAgICB9XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge3JhZGl1c1NjYWxlLCByYWRpdXNNaW5QaXhlbHMsIHJhZGl1c01heFBpeGVscywgb3V0bGluZSwgc3Ryb2tlV2lkdGh9ID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcihPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgb3V0bGluZTogb3V0bGluZSA/IDEgOiAwLFxuICAgICAgc3Ryb2tlV2lkdGgsXG4gICAgICByYWRpdXNTY2FsZSxcbiAgICAgIHJhZGl1c01pblBpeGVscyxcbiAgICAgIHJhZGl1c01heFBpeGVsc1xuICAgIH0pKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIC8vIGEgc3F1YXJlIHRoYXQgbWluaW1hbGx5IGNvdmVyIHRoZSB1bml0IGNpcmNsZVxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFstMSwgLTEsIDAsIC0xLCAxLCAwLCAxLCAxLCAwLCAxLCAtMSwgMF07XG4gICAgY29uc3Qgc2hhZGVycyA9IGFzc2VtYmxlU2hhZGVycyhnbCwgdGhpcy5nZXRTaGFkZXJzKCkpO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgICBnbCxcbiAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgdnM6IHNoYWRlcnMudnMsXG4gICAgICBmczogc2hhZGVycy5mcyxcbiAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICBkcmF3TW9kZTogR0wuVFJJQU5HTEVfRkFOLFxuICAgICAgICBwb3NpdGlvbnM6IG5ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zKVxuICAgICAgfSksXG4gICAgICBpc0luc3RhbmNlZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBnZXQocG9zaXRpb24sIDApO1xuICAgICAgdmFsdWVbaSsrXSA9IGdldChwb3NpdGlvbiwgMSk7XG4gICAgICB2YWx1ZVtpKytdID0gZ2V0KHBvc2l0aW9uLCAyKSB8fCAwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjR4eUxvdyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0UG9zaXRpb24ocG9pbnQpO1xuICAgICAgdmFsdWVbaSsrXSA9IGZwNjRpZnkoZ2V0KHBvc2l0aW9uLCAwKSlbMV07XG4gICAgICB2YWx1ZVtpKytdID0gZnA2NGlmeShnZXQocG9zaXRpb24sIDEpKVsxXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVJhZGl1cyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UmFkaXVzfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCByYWRpdXMgPSBnZXRSYWRpdXMocG9pbnQpO1xuICAgICAgdmFsdWVbaSsrXSA9IGlzTmFOKHJhZGl1cykgPyAxIDogcmFkaXVzO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihwb2ludCkgfHwgREVGQVVMVF9DT0xPUjtcbiAgICAgIHZhbHVlW2krK10gPSBnZXQoY29sb3IsIDApO1xuICAgICAgdmFsdWVbaSsrXSA9IGdldChjb2xvciwgMSk7XG4gICAgICB2YWx1ZVtpKytdID0gZ2V0KGNvbG9yLCAyKTtcbiAgICAgIHZhbHVlW2krK10gPSBpc05hTihnZXQoY29sb3IsIDMpKSA/IDI1NSA6IGdldChjb2xvciwgMyk7XG4gICAgfVxuICB9XG59XG5cblNjYXR0ZXJwbG90TGF5ZXIubGF5ZXJOYW1lID0gJ1NjYXR0ZXJwbG90TGF5ZXInO1xuU2NhdHRlcnBsb3RMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
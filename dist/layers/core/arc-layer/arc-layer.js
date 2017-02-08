'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _fp = require('../../../lib/utils/fp64');

var _arcLayerVertex = require('./arc-layer-vertex.glsl');

var _arcLayerVertex2 = _interopRequireDefault(_arcLayerVertex);

var _arcLayerVertex3 = require('./arc-layer-vertex-64.glsl');

var _arcLayerVertex4 = _interopRequireDefault(_arcLayerVertex3);

var _arcLayerFragment = require('./arc-layer-fragment.glsl');

var _arcLayerFragment2 = _interopRequireDefault(_arcLayerFragment);

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
  strokeWidth: 1,
  fp64: false,

  getSourcePosition: function getSourcePosition(x) {
    return x.sourcePosition;
  },
  getTargetPosition: function getTargetPosition(x) {
    return x.targetPosition;
  },
  getSourceColor: function getSourceColor(x) {
    return x.color || DEFAULT_COLOR;
  },
  getTargetColor: function getTargetColor(x) {
    return x.color || DEFAULT_COLOR;
  }
};

var ArcLayer = function (_Layer) {
  _inherits(ArcLayer, _Layer);

  function ArcLayer() {
    _classCallCheck(this, ArcLayer);

    return _possibleConstructorReturn(this, (ArcLayer.__proto__ || Object.getPrototypeOf(ArcLayer)).apply(this, arguments));
  }

  _createClass(ArcLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _arcLayerVertex4.default, fs: _arcLayerFragment2.default, modules: ['fp64', 'project64']
      } : {
        vs: _arcLayerVertex2.default, fs: _arcLayerFragment2.default, modules: []
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this._getModel(gl) });

      var attributeManager = this.state.attributeManager;

      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instancePositions: { size: 4, accessor: ['getSourcePosition', 'getTargetPosition'], update: this.calculateInstancePositions },
        instanceSourceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getSourceColor', update: this.calculateInstanceSourceColors },
        instanceTargetColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getTargetColor', update: this.calculateInstanceTargetColors }
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
            instancePositions64Low: {
              size: 4,
              accessor: ['getSourcePosition', 'getTargetPosition'],
              update: this.calculateInstancePositions64Low
            }
          });
        } else {
          attributeManager.remove(['instancePositions64Low']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(ArcLayer.prototype.__proto__ || Object.getPrototypeOf(ArcLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      // Re-generate model if geometry changed
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
      var strokeWidth = this.props.strokeWidth;


      this.state.model.render(Object.assign({}, uniforms, {
        strokeWidth: strokeWidth
      }));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      var positions = [];
      var NUM_SEGMENTS = 50;
      /*
       *  (0, -1)-------------_(1, -1)
       *       |          _,-"  |
       *       o      _,-"      o
       *       |  _,-"          |
       *   (0, 1)"-------------(1, 1)
       */
      for (var i = 0; i < NUM_SEGMENTS; i++) {
        positions = positions.concat([i, -1, 0, i, 1, 0]);
      }

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      var model = new _luma.Model({
        gl: gl,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_STRIP,
          positions: new Float32Array(positions)
        }),
        isInstanced: true
      });

      model.setUniforms({ numSegments: NUM_SEGMENTS });

      return model;
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getSourcePosition = _props.getSourcePosition,
          getTargetPosition = _props.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var sourcePosition = getSourcePosition(object);
          var targetPosition = getTargetPosition(object);
          value[i + 0] = sourcePosition[0];
          value[i + 1] = sourcePosition[1];
          value[i + 2] = targetPosition[0];
          value[i + 3] = targetPosition[1];
          i += size;
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
    key: 'calculateInstancePositions64Low',
    value: function calculateInstancePositions64Low(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getSourcePosition = _props2.getSourcePosition,
          getTargetPosition = _props2.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var sourcePosition = getSourcePosition(object);
          var targetPosition = getTargetPosition(object);
          value[i + 0] = (0, _fp.fp64ify)(sourcePosition[0])[1];
          value[i + 1] = (0, _fp.fp64ify)(sourcePosition[1])[1];
          value[i + 2] = (0, _fp.fp64ify)(targetPosition[0])[1];
          value[i + 3] = (0, _fp.fp64ify)(targetPosition[1])[1];
          i += size;
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
    key: 'calculateInstanceSourceColors',
    value: function calculateInstanceSourceColors(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getSourceColor = _props3.getSourceColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getSourceColor(object);
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = isNaN(color[3]) ? 255 : color[3];
          i += size;
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
    key: 'calculateInstanceTargetColors',
    value: function calculateInstanceTargetColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getTargetColor = _props4.getTargetColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          var color = getTargetColor(object);
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = isNaN(color[3]) ? 255 : color[3];
          i += size;
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

  return ArcLayer;
}(_lib.Layer);

exports.default = ArcLayer;


ArcLayer.layerName = 'ArcLayer';
ArcLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9hcmMtbGF5ZXIvYXJjLWxheWVyLmpzIl0sIm5hbWVzIjpbIkRFRkFVTFRfQ09MT1IiLCJkZWZhdWx0UHJvcHMiLCJzdHJva2VXaWR0aCIsImZwNjQiLCJnZXRTb3VyY2VQb3NpdGlvbiIsIngiLCJzb3VyY2VQb3NpdGlvbiIsImdldFRhcmdldFBvc2l0aW9uIiwidGFyZ2V0UG9zaXRpb24iLCJnZXRTb3VyY2VDb2xvciIsImNvbG9yIiwiZ2V0VGFyZ2V0Q29sb3IiLCJBcmNMYXllciIsInByb3BzIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2dldE1vZGVsIiwiYXR0cmlidXRlTWFuYWdlciIsInN0YXRlIiwiYWRkSW5zdGFuY2VkIiwiaW5zdGFuY2VQb3NpdGlvbnMiLCJzaXplIiwiYWNjZXNzb3IiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyIsImluc3RhbmNlU291cmNlQ29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVJbnN0YW5jZVNvdXJjZUNvbG9ycyIsImluc3RhbmNlVGFyZ2V0Q29sb3JzIiwiY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRDb2xvcnMiLCJvbGRQcm9wcyIsImNoYW5nZUZsYWdzIiwiaW52YWxpZGF0ZUFsbCIsInByb2plY3Rpb25Nb2RlIiwiTE5HX0xBVCIsImluc3RhbmNlUG9zaXRpb25zNjRMb3ciLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0TG93IiwicmVtb3ZlIiwidXBkYXRlQXR0cmlidXRlIiwidW5pZm9ybXMiLCJyZW5kZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJwb3NpdGlvbnMiLCJOVU1fU0VHTUVOVFMiLCJpIiwiY29uY2F0Iiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVfU1RSSVAiLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsInNldFVuaWZvcm1zIiwibnVtU2VnbWVudHMiLCJhdHRyaWJ1dGUiLCJkYXRhIiwidmFsdWUiLCJvYmplY3QiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVlBLElBQU1BLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsZUFBYSxDQURNO0FBRW5CQyxRQUFNLEtBRmE7O0FBSW5CQyxxQkFBbUI7QUFBQSxXQUFLQyxFQUFFQyxjQUFQO0FBQUEsR0FKQTtBQUtuQkMscUJBQW1CO0FBQUEsV0FBS0YsRUFBRUcsY0FBUDtBQUFBLEdBTEE7QUFNbkJDLGtCQUFnQjtBQUFBLFdBQUtKLEVBQUVLLEtBQUYsSUFBV1YsYUFBaEI7QUFBQSxHQU5HO0FBT25CVyxrQkFBZ0I7QUFBQSxXQUFLTixFQUFFSyxLQUFGLElBQVdWLGFBQWhCO0FBQUE7QUFQRyxDQUFyQjs7SUFVcUJZLFE7Ozs7Ozs7Ozs7O2lDQUNOO0FBQ1gsYUFBTyw0QkFBbUIsS0FBS0MsS0FBeEIsSUFBaUM7QUFDdENDLG9DQURzQyxFQUNyQkMsOEJBRHFCLEVBQ0pDLFNBQVMsQ0FBQyxNQUFELEVBQVMsV0FBVDtBQURMLE9BQWpDLEdBRUg7QUFDRkYsb0NBREUsRUFDYUMsOEJBRGIsRUFDOEJDLFNBQVM7QUFEdkMsT0FGSjtBQUtEOzs7c0NBRWlCO0FBQUEsVUFDVEMsRUFEUyxHQUNILEtBQUtDLE9BREYsQ0FDVEQsRUFEUzs7QUFFaEIsV0FBS0UsUUFBTCxDQUFjLEVBQUNDLE9BQU8sS0FBS0MsU0FBTCxDQUFlSixF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QlksSUFBckIsbUlBQTJCO0FBQUEsY0FBaEJFLE1BQWdCOztBQUN6QixjQUFNdkQsUUFBUUMsZUFBZXNELE1BQWYsQ0FBZDtBQUNBRCxnQkFBTWIsSUFBSSxDQUFWLElBQWV6QyxNQUFNLENBQU4sQ0FBZjtBQUNBc0QsZ0JBQU1iLElBQUksQ0FBVixJQUFlekMsTUFBTSxDQUFOLENBQWY7QUFDQXNELGdCQUFNYixJQUFJLENBQVYsSUFBZXpDLE1BQU0sQ0FBTixDQUFmO0FBQ0FzRCxnQkFBTWIsSUFBSSxDQUFWLElBQWVlLE1BQU14RCxNQUFNLENBQU4sQ0FBTixJQUFrQixHQUFsQixHQUF3QkEsTUFBTSxDQUFOLENBQXZDO0FBQ0F5QyxlQUFLekIsSUFBTDtBQUNEO0FBWHNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFZeEM7Ozs7OztrQkF4SmtCZCxROzs7QUEySnJCQSxTQUFTdUQsU0FBVCxHQUFxQixVQUFyQjtBQUNBdkQsU0FBU1gsWUFBVCxHQUF3QkEsWUFBeEIiLCJmaWxlIjoiYXJjLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllcn0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCB7YXNzZW1ibGVTaGFkZXJzfSBmcm9tICcuLi8uLi8uLi9zaGFkZXItdXRpbHMnO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7ZnA2NGlmeSwgZW5hYmxlNjRiaXRTdXBwb3J0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNfSBmcm9tICcuLi8uLi8uLi9saWInO1xuXG5pbXBvcnQgYXJjVmVydGV4IGZyb20gJy4vYXJjLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCBhcmNWZXJ0ZXg2NCBmcm9tICcuL2FyYy1sYXllci12ZXJ0ZXgtNjQuZ2xzbCc7XG5pbXBvcnQgYXJjRnJhZ21lbnQgZnJvbSAnLi9hcmMtbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBzdHJva2VXaWR0aDogMSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgZ2V0U291cmNlUG9zaXRpb246IHggPT4geC5zb3VyY2VQb3NpdGlvbixcbiAgZ2V0VGFyZ2V0UG9zaXRpb246IHggPT4geC50YXJnZXRQb3NpdGlvbixcbiAgZ2V0U291cmNlQ29sb3I6IHggPT4geC5jb2xvciB8fCBERUZBVUxUX0NPTE9SLFxuICBnZXRUYXJnZXRDb2xvcjogeCA9PiB4LmNvbG9yIHx8IERFRkFVTFRfQ09MT1Jcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyY0xheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcykgPyB7XG4gICAgICB2czogYXJjVmVydGV4NjQsIGZzOiBhcmNGcmFnbWVudCwgbW9kdWxlczogWydmcDY0JywgJ3Byb2plY3Q2NCddXG4gICAgfSA6IHtcbiAgICAgIHZzOiBhcmNWZXJ0ZXgsIGZzOiBhcmNGcmFnbWVudCwgbW9kdWxlczogW11cbiAgICB9O1xuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcblxuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge3NpemU6IDQsIGFjY2Vzc29yOiBbJ2dldFNvdXJjZVBvc2l0aW9uJywgJ2dldFRhcmdldFBvc2l0aW9uJ10sIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uc30sXG4gICAgICBpbnN0YW5jZVNvdXJjZUNvbG9yczoge3NpemU6IDQsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0U291cmNlQ29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VDb2xvcnN9LFxuICAgICAgaW5zdGFuY2VUYXJnZXRDb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldFRhcmdldENvbG9yJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0Q29sb3JzfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG5cbiAgICAgIGlmIChwcm9wcy5mcDY0ICYmIHByb3BzLnByb2plY3Rpb25Nb2RlID09PSBDT09SRElOQVRFX1NZU1RFTS5MTkdfTEFUKSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgICAgICBpbnN0YW5jZVBvc2l0aW9uczY0TG93OiB7XG4gICAgICAgICAgICBzaXplOiA0LFxuICAgICAgICAgICAgYWNjZXNzb3I6IFsnZ2V0U291cmNlUG9zaXRpb24nLCAnZ2V0VGFyZ2V0UG9zaXRpb24nXSxcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0TG93XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFtcbiAgICAgICAgICAnaW5zdGFuY2VQb3NpdGlvbnM2NExvdydcbiAgICAgICAgXSk7XG4gICAgICB9XG5cbiAgICB9XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIC8vIFJlLWdlbmVyYXRlIG1vZGVsIGlmIGdlb21ldHJ5IGNoYW5nZWRcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtzdHJva2VXaWR0aH0gPSB0aGlzLnByb3BzO1xuXG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIoT2JqZWN0LmFzc2lnbih7fSwgdW5pZm9ybXMsIHtcbiAgICAgIHN0cm9rZVdpZHRoXG4gICAgfSkpO1xuICB9XG5cbiAgX2dldE1vZGVsKGdsKSB7XG4gICAgbGV0IHBvc2l0aW9ucyA9IFtdO1xuICAgIGNvbnN0IE5VTV9TRUdNRU5UUyA9IDUwO1xuICAgIC8qXG4gICAgICogICgwLCAtMSktLS0tLS0tLS0tLS0tXygxLCAtMSlcbiAgICAgKiAgICAgICB8ICAgICAgICAgIF8sLVwiICB8XG4gICAgICogICAgICAgbyAgICAgIF8sLVwiICAgICAgb1xuICAgICAqICAgICAgIHwgIF8sLVwiICAgICAgICAgIHxcbiAgICAgKiAgICgwLCAxKVwiLS0tLS0tLS0tLS0tLSgxLCAxKVxuICAgICAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTlVNX1NFR01FTlRTOyBpKyspIHtcbiAgICAgIHBvc2l0aW9ucyA9IHBvc2l0aW9ucy5jb25jYXQoW2ksIC0xLCAwLCBpLCAxLCAwXSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVycyA9IGFzc2VtYmxlU2hhZGVycyhnbCwgdGhpcy5nZXRTaGFkZXJzKCkpO1xuXG4gICAgY29uc3QgbW9kZWwgPSBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGZzOiBzaGFkZXJzLmZzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRV9TVFJJUCxcbiAgICAgICAgcG9zaXRpb25zOiBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucylcbiAgICAgIH0pLFxuICAgICAgaXNJbnN0YW5jZWQ6IHRydWVcbiAgICB9KTtcblxuICAgIG1vZGVsLnNldFVuaWZvcm1zKHtudW1TZWdtZW50czogTlVNX1NFR01FTlRTfSk7XG5cbiAgICByZXR1cm4gbW9kZWw7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0U291cmNlUG9zaXRpb24sIGdldFRhcmdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3Qgc291cmNlUG9zaXRpb24gPSBnZXRTb3VyY2VQb3NpdGlvbihvYmplY3QpO1xuICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSBnZXRUYXJnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gc291cmNlUG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBzb3VyY2VQb3NpdGlvblsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IHRhcmdldFBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSArIDNdID0gdGFyZ2V0UG9zaXRpb25bMV07XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NExvdyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0U291cmNlUG9zaXRpb24sIGdldFRhcmdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3Qgc291cmNlUG9zaXRpb24gPSBnZXRTb3VyY2VQb3NpdGlvbihvYmplY3QpO1xuICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSBnZXRUYXJnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gZnA2NGlmeShzb3VyY2VQb3NpdGlvblswXSlbMV07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBmcDY0aWZ5KHNvdXJjZVBvc2l0aW9uWzFdKVsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGZwNjRpZnkodGFyZ2V0UG9zaXRpb25bMF0pWzFdO1xuICAgICAgdmFsdWVbaSArIDNdID0gZnA2NGlmeSh0YXJnZXRQb3NpdGlvblsxXSlbMV07XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFNvdXJjZUNvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRTb3VyY2VDb2xvcihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSArIDNdID0gaXNOYU4oY29sb3JbM10pID8gMjU1IDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFRhcmdldENvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRUYXJnZXRDb2xvcihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSArIDNdID0gaXNOYU4oY29sb3JbM10pID8gMjU1IDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG59XG5cbkFyY0xheWVyLmxheWVyTmFtZSA9ICdBcmNMYXllcic7XG5BcmNMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
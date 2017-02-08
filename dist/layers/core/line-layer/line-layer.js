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

var _lineLayerVertex = require('./line-layer-vertex.glsl');

var _lineLayerVertex2 = _interopRequireDefault(_lineLayerVertex);

var _lineLayerVertex3 = require('./line-layer-vertex-64.glsl');

var _lineLayerVertex4 = _interopRequireDefault(_lineLayerVertex3);

var _lineLayerFragment = require('./line-layer-fragment.glsl');

var _lineLayerFragment2 = _interopRequireDefault(_lineLayerFragment);

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
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  }
};

var LineLayer = function (_Layer) {
  _inherits(LineLayer, _Layer);

  function LineLayer() {
    _classCallCheck(this, LineLayer);

    return _possibleConstructorReturn(this, (LineLayer.__proto__ || Object.getPrototypeOf(LineLayer)).apply(this, arguments));
  }

  _createClass(LineLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _lineLayerVertex4.default, fs: _lineLayerFragment2.default, modules: ['fp64', 'project64']
      } : {
        vs: _lineLayerVertex2.default, fs: _lineLayerFragment2.default, modules: []
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
        instanceSourcePositions: { size: 3, accessor: 'getSourcePosition', update: this.calculateInstanceSourcePositions },
        instanceTargetPositions: { size: 3, accessor: 'getTargetPosition', update: this.calculateInstanceTargetPositions },
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
            instanceSourceTargetPositions64xyLow: {
              size: 4,
              accessor: ['getSourcePosition', 'getTargetPosition'],
              update: this.calculateInstanceSourceTargetPositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instanceSourceTargetPositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(LineLayer.prototype.__proto__ || Object.getPrototypeOf(LineLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

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
      /*
       *  (0, -1)-------------_(1, -1)
       *       |          _,-"  |
       *       o      _,-"      o
       *       |  _,-"          |
       *   (0, 1)"-------------(1, 1)
       */
      var positions = [0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0];

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_STRIP,
          positions: new Float32Array(positions)
        }),
        isInstanced: true
      });
    }
  }, {
    key: 'calculateInstanceSourcePositions',
    value: function calculateInstanceSourcePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getSourcePosition = _props.getSourcePosition;
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
          value[i + 0] = sourcePosition[0];
          value[i + 1] = sourcePosition[1];
          value[i + 2] = isNaN(sourcePosition[2]) ? 0 : sourcePosition[2];
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
    key: 'calculateInstanceTargetPositions',
    value: function calculateInstanceTargetPositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
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

          var targetPosition = getTargetPosition(object);
          value[i + 0] = targetPosition[0];
          value[i + 1] = targetPosition[1];
          value[i + 2] = isNaN(targetPosition[2]) ? 0 : targetPosition[2];
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
    key: 'calculateInstanceSourceTargetPositions64xyLow',
    value: function calculateInstanceSourceTargetPositions64xyLow(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getSourcePosition = _props3.getSourcePosition,
          getTargetPosition = _props3.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var sourcePosition = getSourcePosition(object);
          var targetPosition = getTargetPosition(object);
          value[i + 0] = (0, _fp.fp64ify)(sourcePosition[0])[1];
          value[i + 1] = (0, _fp.fp64ify)(sourcePosition[1])[1];
          value[i + 2] = (0, _fp.fp64ify)(targetPosition[0])[1];
          value[i + 3] = (0, _fp.fp64ify)(targetPosition[1])[1];
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
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          var color = getColor(object);
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

  return LineLayer;
}(_lib.Layer);

exports.default = LineLayer;


LineLayer.layerName = 'LineLayer';
LineLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9saW5lLWxheWVyL2xpbmUtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsInN0cm9rZVdpZHRoIiwiZnA2NCIsImdldFNvdXJjZVBvc2l0aW9uIiwieCIsInNvdXJjZVBvc2l0aW9uIiwiZ2V0VGFyZ2V0UG9zaXRpb24iLCJ0YXJnZXRQb3NpdGlvbiIsImdldENvbG9yIiwiY29sb3IiLCJMaW5lTGF5ZXIiLCJwcm9wcyIsInZzIiwiZnMiLCJtb2R1bGVzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsImF0dHJpYnV0ZU1hbmFnZXIiLCJzdGF0ZSIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlU291cmNlUG9zaXRpb25zIiwic2l6ZSIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VQb3NpdGlvbnMiLCJpbnN0YW5jZVRhcmdldFBvc2l0aW9ucyIsImNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0UG9zaXRpb25zIiwiaW5zdGFuY2VDb2xvcnMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImludmFsaWRhdGVBbGwiLCJwcm9qZWN0aW9uTW9kZSIsIkxOR19MQVQiLCJpbnN0YW5jZVNvdXJjZVRhcmdldFBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVRhcmdldFBvc2l0aW9uczY0eHlMb3ciLCJyZW1vdmUiLCJ1cGRhdGVBdHRyaWJ1dGUiLCJ1bmlmb3JtcyIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsInBvc2l0aW9ucyIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVfU1RSSVAiLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsImkiLCJvYmplY3QiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVlBLElBQU1BLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsZUFBYSxDQURNO0FBRW5CQyxRQUFNLEtBRmE7O0FBSW5CQyxxQkFBbUI7QUFBQSxXQUFLQyxFQUFFQyxjQUFQO0FBQUEsR0FKQTtBQUtuQkMscUJBQW1CO0FBQUEsV0FBS0YsRUFBRUcsY0FBUDtBQUFBLEdBTEE7QUFNbkJDLFlBQVU7QUFBQSxXQUFLSixFQUFFSyxLQUFGLElBQVdWLGFBQWhCO0FBQUE7QUFOUyxDQUFyQjs7SUFTcUJXLFM7Ozs7Ozs7Ozs7O2lDQUNOO0FBQ1gsYUFBTyw0QkFBbUIsS0FBS0MsS0FBeEIsSUFBaUM7QUFDdENDLHFDQURzQyxFQUNwQkMsK0JBRG9CLEVBQ0ZDLFNBQVMsQ0FBQyxNQUFELEVBQVMsV0FBVDtBQURQLE9BQWpDLEdBRUg7QUFDRkYscUNBREUsRUFDY0MsK0JBRGQsRUFDZ0NDLFNBQVM7QUFEekMsT0FGSjtBQUtEOzs7c0NBRWlCO0FBQUEsVUFFVEMsRUFGUyxHQUVILEtBQUtDLE9BRkYsQ0FFVEQsRUFGUzs7QUFHaEIsV0FBS0UsUUFBTCxDQUFjLEVBQUNDLE9BQU8sS0FBS0MsU0FBTCxDQUFlSixFQUFmLENBQVIsRUFBZDs7QUFIZ0IsVUFLVEssZ0JBTFMsR0FLVyxLQUFLQyxLQUxoQixDQUtURCxnQkFMUzs7QUFPaEI7O0FBQ0FBLHVCQUFpQkUsWUFBakIsQ0FB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QUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWWxDOzs7Ozs7a0JBOUlrQmQsUzs7O0FBaUpyQkEsVUFBVW9ELFNBQVYsR0FBc0IsV0FBdEI7QUFDQXBELFVBQVVWLFlBQVYsR0FBeUJBLFlBQXpCIiwiZmlsZSI6ImxpbmUtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IHthc3NlbWJsZVNoYWRlcnN9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtmcDY0aWZ5LCBlbmFibGU2NGJpdFN1cHBvcnR9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscy9mcDY0JztcbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU19IGZyb20gJy4uLy4uLy4uL2xpYic7XG5cbmltcG9ydCBsaW5lVmVydGV4IGZyb20gJy4vbGluZS1sYXllci12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgbGluZVZlcnRleDY0IGZyb20gJy4vbGluZS1sYXllci12ZXJ0ZXgtNjQuZ2xzbCc7XG5pbXBvcnQgbGluZUZyYWdtZW50IGZyb20gJy4vbGluZS1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIHN0cm9rZVdpZHRoOiAxLFxuICBmcDY0OiBmYWxzZSxcblxuICBnZXRTb3VyY2VQb3NpdGlvbjogeCA9PiB4LnNvdXJjZVBvc2l0aW9uLFxuICBnZXRUYXJnZXRQb3NpdGlvbjogeCA9PiB4LnRhcmdldFBvc2l0aW9uLFxuICBnZXRDb2xvcjogeCA9PiB4LmNvbG9yIHx8IERFRkFVTFRfQ09MT1Jcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbmVMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4gZW5hYmxlNjRiaXRTdXBwb3J0KHRoaXMucHJvcHMpID8ge1xuICAgICAgdnM6IGxpbmVWZXJ0ZXg2NCwgZnM6IGxpbmVGcmFnbWVudCwgbW9kdWxlczogWydmcDY0JywgJ3Byb2plY3Q2NCddXG4gICAgfSA6IHtcbiAgICAgIHZzOiBsaW5lVmVydGV4LCBmczogbGluZUZyYWdtZW50LCBtb2R1bGVzOiBbXVxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcblxuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VTb3VyY2VQb3NpdGlvbnM6IHtzaXplOiAzLCBhY2Nlc3NvcjogJ2dldFNvdXJjZVBvc2l0aW9uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zfSxcbiAgICAgIGluc3RhbmNlVGFyZ2V0UG9zaXRpb25zOiB7c2l6ZTogMywgYWNjZXNzb3I6ICdnZXRUYXJnZXRQb3NpdGlvbicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVRhcmdldFBvc2l0aW9uc30sXG4gICAgICBpbnN0YW5jZUNvbG9yczoge3NpemU6IDQsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0Q29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnN9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gIH1cblxuICB1cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcblxuICAgICAgaWYgKHByb3BzLmZwNjQgJiYgcHJvcHMucHJvamVjdGlvbk1vZGUgPT09IENPT1JESU5BVEVfU1lTVEVNLkxOR19MQVQpIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgICAgIGluc3RhbmNlU291cmNlVGFyZ2V0UG9zaXRpb25zNjR4eUxvdzoge1xuICAgICAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgICAgIGFjY2Vzc29yOiBbJ2dldFNvdXJjZVBvc2l0aW9uJywgJ2dldFRhcmdldFBvc2l0aW9uJ10sXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VUYXJnZXRQb3NpdGlvbnM2NHh5TG93XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFtcbiAgICAgICAgICAnaW5zdGFuY2VTb3VyY2VUYXJnZXRQb3NpdGlvbnM2NHh5TG93J1xuICAgICAgICBdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuXG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBjb25zdCB7c3Ryb2tlV2lkdGh9ID0gdGhpcy5wcm9wcztcblxuICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKE9iamVjdC5hc3NpZ24oe30sIHVuaWZvcm1zLCB7XG4gICAgICBzdHJva2VXaWR0aFxuICAgIH0pKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIC8qXG4gICAgICogICgwLCAtMSktLS0tLS0tLS0tLS0tXygxLCAtMSlcbiAgICAgKiAgICAgICB8ICAgICAgICAgIF8sLVwiICB8XG4gICAgICogICAgICAgbyAgICAgIF8sLVwiICAgICAgb1xuICAgICAqICAgICAgIHwgIF8sLVwiICAgICAgICAgIHxcbiAgICAgKiAgICgwLCAxKVwiLS0tLS0tLS0tLS0tLSgxLCAxKVxuICAgICAqL1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFswLCAtMSwgMCwgMCwgMSwgMCwgMSwgLTEsIDAsIDEsIDEsIDBdO1xuXG4gICAgY29uc3Qgc2hhZGVycyA9IGFzc2VtYmxlU2hhZGVycyhnbCwgdGhpcy5nZXRTaGFkZXJzKCkpO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgICBnbCxcbiAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgdnM6IHNoYWRlcnMudnMsXG4gICAgICBmczogc2hhZGVycy5mcyxcbiAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICBkcmF3TW9kZTogR0wuVFJJQU5HTEVfU1RSSVAsXG4gICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICB9KSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0U291cmNlUG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IGdldFNvdXJjZVBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBzb3VyY2VQb3NpdGlvblswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IHNvdXJjZVBvc2l0aW9uWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gaXNOYU4oc291cmNlUG9zaXRpb25bMl0pID8gMCA6IHNvdXJjZVBvc2l0aW9uWzJdO1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0UG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRUYXJnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gZ2V0VGFyZ2V0UG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IHRhcmdldFBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSArIDFdID0gdGFyZ2V0UG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpICsgMl0gPSBpc05hTih0YXJnZXRQb3NpdGlvblsyXSkgPyAwIDogdGFyZ2V0UG9zaXRpb25bMl07XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VUYXJnZXRQb3NpdGlvbnM2NHh5TG93KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbiwgZ2V0VGFyZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IGdldFNvdXJjZVBvc2l0aW9uKG9iamVjdCk7XG4gICAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IGdldFRhcmdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBmcDY0aWZ5KHNvdXJjZVBvc2l0aW9uWzBdKVsxXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGZwNjRpZnkoc291cmNlUG9zaXRpb25bMV0pWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gZnA2NGlmeSh0YXJnZXRQb3NpdGlvblswXSlbMV07XG4gICAgICB2YWx1ZVtpICsgM10gPSBmcDY0aWZ5KHRhcmdldFBvc2l0aW9uWzFdKVsxXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpICsgM10gPSBpc05hTihjb2xvclszXSkgPyAyNTUgOiBjb2xvclszXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cbn1cblxuTGluZUxheWVyLmxheWVyTmFtZSA9ICdMaW5lTGF5ZXInO1xuTGluZUxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==
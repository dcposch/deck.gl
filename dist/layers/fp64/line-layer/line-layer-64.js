'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lineLayer = require('../../core/line-layer');

var _lineLayer2 = _interopRequireDefault(_lineLayer);

var _fp = require('../../../lib/utils/fp64');

var _path = require('path');

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

var LineLayer64 = function (_LineLayer) {
  _inherits(LineLayer64, _LineLayer);

  function LineLayer64() {
    _classCallCheck(this, LineLayer64);

    return _possibleConstructorReturn(this, (LineLayer64.__proto__ || Object.getPrototypeOf(LineLayer64)).apply(this, arguments));
  }

  _createClass(LineLayer64, [{
    key: 'initializeState',
    value: function initializeState() {
      _get(LineLayer64.prototype.__proto__ || Object.getPrototypeOf(LineLayer64.prototype), 'initializeState', this).call(this);

      var attributeManager = this.state.attributeManager;

      attributeManager.addInstanced({
        instanceSourcePositions64: {
          size: 4,
          update: this.calculateInstanceSourcePositions
        },
        instanceTargetPositions64: {
          size: 4,
          update: this.calculateInstanceTargetPositions
        },
        instanceElevations: {
          size: 2,
          update: this.calculateInstanceElevations
        }
      });
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2016 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME line-layer-64-vertex-shader\n\nattribute vec3 positions;\nattribute vec4 instanceSourcePositions64;\nattribute vec4 instanceTargetPositions64;\nattribute vec2 instanceElevations;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  // Position\n  vec2 projectedSourceCoord[2];\n  project_position_fp64(instanceSourcePositions64, projectedSourceCoord);\n  vec2 projectedTargetCoord[2];\n  project_position_fp64(instanceTargetPositions64, projectedTargetCoord);\n\n  // linear interpolation of source & target to pick right coord\n  float segmentIndex = positions.x;\n  vec2 mixed_temp[2];\n\n  vec2_mix_fp64(projectedSourceCoord, projectedTargetCoord, segmentIndex, mixed_temp);\n\n  float mixedElevation =\n    mix(instanceElevations.x, instanceElevations.y, segmentIndex);\n\n  vec2 vertex_pos_modelspace[4];\n\n  vertex_pos_modelspace[0] = mixed_temp[0];\n  vertex_pos_modelspace[1] = mixed_temp[1];\n  vertex_pos_modelspace[2] = vec2(project_scale(mixedElevation), 0.0);\n  vertex_pos_modelspace[3] = vec2(1.0, 0.0);\n\n  gl_Position = project_to_clipspace_fp64(vertex_pos_modelspace);\n\n  // Color\n  vec4 color = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n\n  vColor = mix(\n    color,\n    pickingColor,\n    renderPickingBuffer\n  );\n}\n',
        fs: _get(LineLayer64.prototype.__proto__ || Object.getPrototypeOf(LineLayer64.prototype), 'getShaders', this).call(this).fs,
        fp64: true,
        project64: true
      };
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

          var _fp64ify = (0, _fp.fp64ify)(sourcePosition[0]);

          var _fp64ify2 = _slicedToArray(_fp64ify, 2);

          value[i + 0] = _fp64ify2[0];
          value[i + 1] = _fp64ify2[1];

          var _fp64ify3 = (0, _fp.fp64ify)(sourcePosition[1]);

          var _fp64ify4 = _slicedToArray(_fp64ify3, 2);

          value[i + 2] = _fp64ify4[0];
          value[i + 3] = _fp64ify4[1];

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

          var _fp64ify5 = (0, _fp.fp64ify)(targetPosition[0]);

          var _fp64ify6 = _slicedToArray(_fp64ify5, 2);

          value[i + 0] = _fp64ify6[0];
          value[i + 1] = _fp64ify6[1];

          var _fp64ify7 = (0, _fp.fp64ify)(targetPosition[1]);

          var _fp64ify8 = _slicedToArray(_fp64ify7, 2);

          value[i + 2] = _fp64ify8[0];
          value[i + 3] = _fp64ify8[1];

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
    key: 'calculateInstanceElevations',
    value: function calculateInstanceElevations(attribute) {
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
          value[i + 0] = sourcePosition[2] || 0;
          value[i + 1] = targetPosition[2] || 0;
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
  }]);

  return LineLayer64;
}(_lineLayer2.default);

exports.default = LineLayer64;


LineLayer64.layerName = 'LineLayer64';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZnA2NC9saW5lLWxheWVyL2xpbmUtbGF5ZXItNjQuanMiXSwibmFtZXMiOlsiTGluZUxheWVyNjQiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVNvdXJjZVBvc2l0aW9uczY0Iiwic2l6ZSIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zIiwiaW5zdGFuY2VUYXJnZXRQb3NpdGlvbnM2NCIsImNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0UG9zaXRpb25zIiwiaW5zdGFuY2VFbGV2YXRpb25zIiwiY2FsY3VsYXRlSW5zdGFuY2VFbGV2YXRpb25zIiwidnMiLCJmcyIsImZwNjQiLCJwcm9qZWN0NjQiLCJhdHRyaWJ1dGUiLCJwcm9wcyIsImRhdGEiLCJnZXRTb3VyY2VQb3NpdGlvbiIsInZhbHVlIiwiaSIsIm9iamVjdCIsInNvdXJjZVBvc2l0aW9uIiwiZ2V0VGFyZ2V0UG9zaXRpb24iLCJ0YXJnZXRQb3NpdGlvbiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBb0JBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7OytlQXZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFPcUJBLFc7Ozs7Ozs7Ozs7O3NDQUVEO0FBQ2hCOztBQURnQixVQUdUQyxnQkFIUyxHQUdXLEtBQUtDLEtBSGhCLENBR1RELGdCQUhTOztBQUloQkEsdUJBQWlCRSxZQUFqQixDQUE4QjtBQUM1QkMsbUNBQTJCO0FBQ3pCQyxnQkFBTSxDQURtQjtBQUV6QkMsa0JBQVEsS0FBS0M7QUFGWSxTQURDO0FBSzVCQyxtQ0FBMkI7QUFDekJILGdCQUFNLENBRG1CO0FBRXpCQyxrQkFBUSxLQUFLRztBQUZZLFNBTEM7QUFTNUJDLDRCQUFvQjtB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LE1BQWxCLENBQXZCO0FBQ0FGLGdCQUFNQyxJQUFJLENBQVYsSUFBZUUsZUFBZSxDQUFmLEtBQXFCLENBQXBDO0FBQ0FILGdCQUFNQyxJQUFJLENBQVYsSUFBZUksZUFBZSxDQUFmLEtBQXFCLENBQXBDO0FBQ0FKLGVBQUtoQixJQUFMO0FBQ0Q7QUFWb0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVd0Qzs7Ozs7O2tCQWxFa0JMLFc7OztBQXFFckJBLFlBQVkwQixTQUFaLEdBQXdCLGFBQXhCIiwiZmlsZSI6ImxpbmUtbGF5ZXItNjQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQgTGluZUxheWVyIGZyb20gJy4uLy4uL2NvcmUvbGluZS1sYXllcic7XG5pbXBvcnQge2ZwNjRpZnl9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscy9mcDY0JztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2pvaW59IGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW5lTGF5ZXI2NCBleHRlbmRzIExpbmVMYXllciB7XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHN1cGVyLmluaXRpYWxpemVTdGF0ZSgpO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVNvdXJjZVBvc2l0aW9uczY0OiB7XG4gICAgICAgIHNpemU6IDQsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVBvc2l0aW9uc1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlVGFyZ2V0UG9zaXRpb25zNjQ6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0UG9zaXRpb25zXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VFbGV2YXRpb25zOiB7XG4gICAgICAgIHNpemU6IDIsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUVsZXZhdGlvbnNcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZzOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL2xpbmUtbGF5ZXItNjQtdmVydGV4Lmdsc2wnKSwgJ3V0ZjgnKSxcbiAgICAgIGZzOiBzdXBlci5nZXRTaGFkZXJzKCkuZnMsXG4gICAgICBmcDY0OiB0cnVlLFxuICAgICAgcHJvamVjdDY0OiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHNvdXJjZVBvc2l0aW9uID0gZ2V0U291cmNlUG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIFt2YWx1ZVtpICsgMF0sIHZhbHVlW2kgKyAxXV0gPSBmcDY0aWZ5KHNvdXJjZVBvc2l0aW9uWzBdKTtcbiAgICAgIFt2YWx1ZVtpICsgMl0sIHZhbHVlW2kgKyAzXV0gPSBmcDY0aWZ5KHNvdXJjZVBvc2l0aW9uWzFdKTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVRhcmdldFBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0VGFyZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IGdldFRhcmdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICBbdmFsdWVbaSArIDBdLCB2YWx1ZVtpICsgMV1dID0gZnA2NGlmeSh0YXJnZXRQb3NpdGlvblswXSk7XG4gICAgICBbdmFsdWVbaSArIDJdLCB2YWx1ZVtpICsgM11dID0gZnA2NGlmeSh0YXJnZXRQb3NpdGlvblsxXSk7XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VFbGV2YXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbiwgZ2V0VGFyZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IGdldFNvdXJjZVBvc2l0aW9uKG9iamVjdCk7XG4gICAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IGdldFRhcmdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBzb3VyY2VQb3NpdGlvblsyXSB8fCAwO1xuICAgICAgdmFsdWVbaSArIDFdID0gdGFyZ2V0UG9zaXRpb25bMl0gfHwgMDtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cbn1cblxuTGluZUxheWVyNjQubGF5ZXJOYW1lID0gJ0xpbmVMYXllcjY0JztcbiJdfQ==
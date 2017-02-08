'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _arcLayer = require('../../core/arc-layer');

var _arcLayer2 = _interopRequireDefault(_arcLayer);

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

var ArcLayer64 = function (_ArcLayer) {
  _inherits(ArcLayer64, _ArcLayer);

  function ArcLayer64() {
    _classCallCheck(this, ArcLayer64);

    return _possibleConstructorReturn(this, (ArcLayer64.__proto__ || Object.getPrototypeOf(ArcLayer64)).apply(this, arguments));
  }

  _createClass(ArcLayer64, [{
    key: 'initializeState',
    value: function initializeState() {
      _get(ArcLayer64.prototype.__proto__ || Object.getPrototypeOf(ArcLayer64.prototype), 'initializeState', this).call(this);

      var attributeManager = this.state.attributeManager;


      attributeManager.addInstanced({
        instanceSourcePositions64: {
          size: 4,
          update: this.calculateInstanceSourcePositions64
        },
        instanceTargetPositions64: {
          size: 4,
          update: this.calculateInstanceTargetPositions64
        }
        // Reuse from base class
        // instanceSourceColors: {
        //   size: 4,
        //   type: GL.UNSIGNED_BYTE,
        //   update: this.calculateInstanceSourceColors
        // },
        // instanceTargetColors: {
        //   size: 4,
        //   type: GL.UNSIGNED_BYTE,
        //   update: this.calculateInstanceTargetColors
        // }
      });
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2016 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME arc-layer-64-vertex-shader\n\nconst float N = 49.0;\n\nattribute vec3 positions;\nattribute vec4 instanceSourceColors;\nattribute vec4 instanceTargetColors;\nattribute vec3 instancePickingColors;\nattribute vec4 instanceSourcePositions64;\nattribute vec4 instanceTargetPositions64;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\nvec2 paraboloid_fp64(vec2 source[2], vec2 target[2], float ratio) {\n\n  vec2 x[2];\n  vec2_mix_fp64(source, target, ratio, x);\n  vec2 center[2];\n  vec2_mix_fp64(source, target, 0.5, center);\n\n  vec2 dSourceCenter = vec2_distance_fp64(source, center);\n  vec2 dXCenter = vec2_distance_fp64(x, center);\n  return mul_fp64(sum_fp64(dSourceCenter, dXCenter), sub_fp64(dSourceCenter, dXCenter));\n}\n\nvoid main(void) {\n  vec2 projectedSourceCoord[2];\n  project_position_fp64(instanceSourcePositions64, projectedSourceCoord);\n  vec2 projectedTargetCoord[2];\n  project_position_fp64(instanceTargetPositions64, projectedTargetCoord);\n\n  float segmentRatio = smoothstep(0.0, 1.0, positions.x / N);\n\n  vec2 mixed_temp[2];\n\n  vec2_mix_fp64(projectedSourceCoord, projectedTargetCoord, segmentRatio, mixed_temp);\n\n  vec2 vertex_pos_modelspace[4];\n\n  vertex_pos_modelspace[0] = mixed_temp[0];\n  vertex_pos_modelspace[1] = mixed_temp[1];\n\n  vec2 vertex_height = paraboloid_fp64(projectedSourceCoord, projectedTargetCoord, segmentRatio);\n  if (vertex_height.x < 0.0 || (vertex_height.x == 0.0 && vertex_height.y <= 0.0)) vertex_height = vec2(0.0, 0.0);\n\n  vertex_pos_modelspace[2] = sqrt_fp64(vertex_height);\n  vertex_pos_modelspace[3] = vec2(1.0, 0.0);\n\n  gl_Position = project_to_clipspace_fp64(vertex_pos_modelspace);\n\n  vec4 color = mix(instanceSourceColors, instanceTargetColors, segmentRatio) / 255.;\n\n  vColor = mix(\n    vec4(color.rgb, color.a * opacity),\n    vec4(instancePickingColors / 255., 1.),\n    renderPickingBuffer\n  );\n}\n',
        fs: _get(ArcLayer64.prototype.__proto__ || Object.getPrototypeOf(ArcLayer64.prototype), 'getShaders', this).call(this).fs,
        fp64: true,
        project64: true
      };
    }
  }, {
    key: 'calculateInstanceSourcePositions64',
    value: function calculateInstanceSourcePositions64(attribute) {
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
    key: 'calculateInstanceTargetPositions64',
    value: function calculateInstanceTargetPositions64(attribute) {
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
  }]);

  return ArcLayer64;
}(_arcLayer2.default);

exports.default = ArcLayer64;


ArcLayer64.layerName = 'ArcLayer64';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZnA2NC9hcmMtbGF5ZXIvYXJjLWxheWVyLTY0LmpzIl0sIm5hbWVzIjpbIkFyY0xheWVyNjQiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVNvdXJjZVBvc2l0aW9uczY0Iiwic2l6ZSIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zNjQiLCJpbnN0YW5jZVRhcmdldFBvc2l0aW9uczY0IiwiY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRQb3NpdGlvbnM2NCIsInZzIiwiZnMiLCJmcDY0IiwicHJvamVjdDY0IiwiYXR0cmlidXRlIiwicHJvcHMiLCJkYXRhIiwiZ2V0U291cmNlUG9zaXRpb24iLCJ2YWx1ZSIsImkiLCJvYmplY3QiLCJzb3VyY2VQb3NpdGlvbiIsImdldFRhcmdldFBvc2l0aW9uIiwidGFyZ2V0UG9zaXRpb24iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQW9CQTs7OztBQUNBOztBQUVBOzs7Ozs7OzsrZUF2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBT3FCQSxVOzs7Ozs7Ozs7OztzQ0FFRDtBQUNoQjs7QUFEZ0IsVUFHVEMsZ0JBSFMsR0FHVyxLQUFLQyxLQUhoQixDQUdURCxnQkFIUzs7O0FBS2hCQSx1QkFBaUJFLFlBQWpCLENBQThCO0FBQzVCQyxtQ0FBMkI7QUFDekJDLGdCQUFNLENBRG1CO0FBRXpCQyxrQkFBUSxLQUFLQztBQUZZLFNBREM7QUFLNUJDLG1DQUEyQjtBQUN6QkgsZ0JBQU0sQ0FEbUI7QUFFekJDLGtCQUFRLEtBQUtHO0FBRlk7QUFJM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQW5CNEIsT0FBOUI7QUFxQkQ7OztpQ0FFWTtBQUNYLGFBQU87QUFDTEMscWlHQURLO0FBRUxDLFlBQUksbUhBQW1CQSxFQUZsQjtBQUdMQyxjQUFNLElBSEQ7QUFJTEMsbUJBQVc7QUFKTixPQUFQO0FBTUQ7Ozt1REFFa0NDLFMsRUFBVztBQUFBLG1CQUNWLEtBQUtDLEtBREs7QUFBQSxVQUNyQ0MsSUFEcUMsVUFDckNBLElBRHFDO0FBQUEsVUFDL0JDLGlCQUQrQixVQUMvQkEsaUJBRCtCO0FBQUEsVUFFckNDLEtBRnFDLEdBRXRCSixTQUZzQixDQUVyQ0ksS0FGcUM7QUFBQSxVQUU5QmIsSUFGOEIsR0FFdEJTLFNBRnNCLENBRTlCVCxJQUY4Qjs7QUFHNUMsVUFBSWMsSUFBSSxDQUFSO0FBSDRDO0FBQUE7QUFBQTs7QUFBQTtBQUk1Qyw2QkFBcUJILElBQXJCLDhIQUEyQjtBQUFBLGNBQWhCSSxNQUFnQjs7QUFDekIsY0FBTUMsaUJBQWlCSixrQkFBa0JHLE1BQWxCLENBQXZCOztBQUR5Qix5QkFFTSxpQkFBUUMsZUFBZSxDQUFmLENBQVIsQ0FGTjs7QUFBQTs7QUFFeEJILGdCQUFNQyxJQUFJLENBQVYsQ0FGd0I7QUFFVkQsZ0JBQU1DLElBQUksQ0FBVixDQUZVOztBQUFBLDBCQUdNLGlCQUFRRSxlQUFlLENBQWYsQ0FBUixDQUhOOztBQUFBOztBQUd4QkgsZ0JBQU1DLElBQUksQ0FBVixDQUh3QjtBQUdWRCxnQkFBTUMsSUFBSSxDQUFWLENBSFU7O0FBSXpCQSxlQUFLZCxJQUFMO0FBQ0Q7QUFUMkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVU3Qzs7O3VEQUVrQ1MsUyxFQUFXO0FBQUEsb0JBQ1YsS0FBS0MsS0FESztBQUFBLFVBQ3JDQyxJQURxQyxXQUNyQ0EsSUFEcUM7QUFBQSxVQUMvQk0saUJBRCtCLFdBQy9CQSxpQkFEK0I7QUFBQSxVQUVyQ0osS0FGcUMsR0FFdEJKLFNBRnNCLENBRXJDSSxLQUZxQztBQUFBLFVBRTlCYixJQUY4QixHQUV0QlMsU0FGc0IsQ0FFOUJULElBRjhCOztBQUc1QyxVQUFJYyxJQUFJLENBQVI7QUFINEM7QUFBQTtBQUFBOztBQUFBO0FBSTVDLDhCQUFxQkgsSUFBckIsbUlBQTJCO0FBQUEsY0FBaEJJLE1BQWdCOztBQUN6QixjQUFNRyxpQkFBaUJELGtCQUFrQkYsTUFBbEIsQ0FBdkI7O0FBRHlCLDBCQUVNLGlCQUFRRyxlQUFlLENBQWYsQ0FBUixDQUZOOztBQUFBOztBQUV4QkwsZ0JBQU1DLElBQUksQ0FBVixDQUZ3QjtBQUVWRCxnQkFBTUMsSUFBSSxDQUFWLENBRlU7O0FBQUEsMEJBR00saUJBQVFJLGVBQWUsQ0FBZixDQUFSLENBSE47O0FBQUE7O0FBR3hCTCxnQkFBTUMsSUFBSSxDQUFWLENBSHdCO0FBR1ZELGdCQUFNQyxJQUFJLENBQVYsQ0FIVTs7QUFJekJBLGVBQUtkLElBQUw7QUFDRDtBQVQyQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBVTdDOzs7Ozs7a0JBN0RrQkwsVTs7O0FBaUVyQkEsV0FBV3dCLFNBQVgsR0FBdUIsWUFBdkIiLCJmaWxlIjoiYXJjLWxheWVyLTY0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IEFyY0xheWVyIGZyb20gJy4uLy4uL2NvcmUvYXJjLWxheWVyJztcbmltcG9ydCB7ZnA2NGlmeX0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzL2ZwNjQnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyY0xheWVyNjQgZXh0ZW5kcyBBcmNMYXllciB7XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHN1cGVyLmluaXRpYWxpemVTdGF0ZSgpO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcblxuICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgIGluc3RhbmNlU291cmNlUG9zaXRpb25zNjQ6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zNjRcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZVRhcmdldFBvc2l0aW9uczY0OiB7XG4gICAgICAgIHNpemU6IDQsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVRhcmdldFBvc2l0aW9uczY0XG4gICAgICB9XG4gICAgICAvLyBSZXVzZSBmcm9tIGJhc2UgY2xhc3NcbiAgICAgIC8vIGluc3RhbmNlU291cmNlQ29sb3JzOiB7XG4gICAgICAvLyAgIHNpemU6IDQsXG4gICAgICAvLyAgIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgICAvLyAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVNvdXJjZUNvbG9yc1xuICAgICAgLy8gfSxcbiAgICAgIC8vIGluc3RhbmNlVGFyZ2V0Q29sb3JzOiB7XG4gICAgICAvLyAgIHNpemU6IDQsXG4gICAgICAvLyAgIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgICAvLyAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVRhcmdldENvbG9yc1xuICAgICAgLy8gfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vYXJjLWxheWVyLTY0LXZlcnRleC5nbHNsJyksICd1dGY4JyksXG4gICAgICBmczogc3VwZXIuZ2V0U2hhZGVycygpLmZzLFxuICAgICAgZnA2NDogdHJ1ZSxcbiAgICAgIHByb2plY3Q2NDogdHJ1ZVxuICAgIH07XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVBvc2l0aW9uczY0KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHNvdXJjZVBvc2l0aW9uID0gZ2V0U291cmNlUG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIFt2YWx1ZVtpICsgMF0sIHZhbHVlW2kgKyAxXV0gPSBmcDY0aWZ5KHNvdXJjZVBvc2l0aW9uWzBdKTtcbiAgICAgIFt2YWx1ZVtpICsgMl0sIHZhbHVlW2kgKyAzXV0gPSBmcDY0aWZ5KHNvdXJjZVBvc2l0aW9uWzFdKTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVRhcmdldFBvc2l0aW9uczY0KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRUYXJnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gZ2V0VGFyZ2V0UG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIFt2YWx1ZVtpICsgMF0sIHZhbHVlW2kgKyAxXV0gPSBmcDY0aWZ5KHRhcmdldFBvc2l0aW9uWzBdKTtcbiAgICAgIFt2YWx1ZVtpICsgMl0sIHZhbHVlW2kgKyAzXV0gPSBmcDY0aWZ5KHRhcmdldFBvc2l0aW9uWzFdKTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxufVxuXG5BcmNMYXllcjY0LmxheWVyTmFtZSA9ICdBcmNMYXllcjY0JztcbiJdfQ==
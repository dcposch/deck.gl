'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _scatterplotLayer = require('../../core/scatterplot-layer');

var _scatterplotLayer2 = _interopRequireDefault(_scatterplotLayer);

var _fp = require('../../../lib/utils/fp64');

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2016 Uber Technologies, Inc.
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

var ScatterplotLayer64 = function (_ScatterplotLayer) {
  _inherits(ScatterplotLayer64, _ScatterplotLayer);

  function ScatterplotLayer64() {
    _classCallCheck(this, ScatterplotLayer64);

    return _possibleConstructorReturn(this, (ScatterplotLayer64.__proto__ || Object.getPrototypeOf(ScatterplotLayer64)).apply(this, arguments));
  }

  _createClass(ScatterplotLayer64, [{
    key: 'getShaders',


    // Override the super class vertex shader
    value: function getShaders(id) {
      return {
        vs: '// Copyright (c) 2016 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME scatterplot-layer-64-vertex-shader\n\nattribute vec3 positions;\n\nattribute vec4 instancePositions64xy;\nattribute vec2 instancePositions64z;\nattribute float instanceRadius;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\n// Only one-dimensional arrays may be declared in GLSL ES 1.0. specs p.24\nuniform float opacity;\nuniform float radius;\nuniform float radiusMinPixels;\nuniform float radiusMaxPixels;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  // Multiply out radius and clamp to limits\n  float radiusPixels = clamp(\n    project_scale(radius * instanceRadius),\n    radiusMinPixels, radiusMaxPixels\n  );\n\n  vec2 projected_coord_xy[2];\n  project_position_fp64(instancePositions64xy, projected_coord_xy);\n\n  vec2 vertex_pos_localspace[4];\n  vec4_fp64(vec4(positions * radiusPixels, 0.0), vertex_pos_localspace);\n\n  vec2 vertex_pos_modelspace[4];\n  vertex_pos_modelspace[0] = sum_fp64(vertex_pos_localspace[0], projected_coord_xy[0]);\n  vertex_pos_modelspace[1] = sum_fp64(vertex_pos_localspace[1], projected_coord_xy[1]);\n  vertex_pos_modelspace[2] = sum_fp64(vertex_pos_localspace[2], vec2(instancePositions64z.x + 1.0, instancePositions64z.y));\n  vertex_pos_modelspace[3] = vec2(1.0, 0.0);\n\n  gl_Position = project_to_clipspace_fp64(vertex_pos_modelspace);\n\n  // Apply opacity to instance color, or return instance picking color\n  vec4 color = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n  vColor = mix(color, pickingColor, renderPickingBuffer);\n}\n',
        fs: _get(ScatterplotLayer64.prototype.__proto__ || Object.getPrototypeOf(ScatterplotLayer64.prototype), 'getShaders', this).call(this).fs,
        fp64: true,
        project64: true
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      // We use the model and all attributes except "instancePositions" of the base layer
      _get(ScatterplotLayer64.prototype.__proto__ || Object.getPrototypeOf(ScatterplotLayer64.prototype), 'initializeState', this).call(this);

      // Add the 64 bit positions
      var attributeManager = this.state.attributeManager;

      attributeManager.addInstanced({
        instancePositions64xy: { size: 4, update: this.calculateInstancePositions64xy },
        instancePositions64z: { size: 2, update: this.calculateInstancePositions64z }
        // Reusing from base class
        // instanceRadius: {size: 1, update: this.calculateInstanceRadius},
        // instanceColors: {size: 4, type: GL.UNSIGNED_BYTE, update: this.calculateInstanceColors}
      });
    }
  }, {
    key: 'calculateInstancePositions64xy',
    value: function calculateInstancePositions64xy(attribute) {
      var _props = this.props,
          data = _props.data,
          getPosition = _props.getPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var position = getPosition(point);

          var _fp64ify = (0, _fp.fp64ify)(position[0]);

          var _fp64ify2 = _slicedToArray(_fp64ify, 2);

          value[i + 0] = _fp64ify2[0];
          value[i + 1] = _fp64ify2[1];

          var _fp64ify3 = (0, _fp.fp64ify)(position[1]);

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
    key: 'calculateInstancePositions64z',
    value: function calculateInstancePositions64z(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;

          var position = getPosition(point);

          var _fp64ify5 = (0, _fp.fp64ify)(position[2] || 0);

          var _fp64ify6 = _slicedToArray(_fp64ify5, 2);

          value[i + 0] = _fp64ify6[0];
          value[i + 1] = _fp64ify6[1];

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

  return ScatterplotLayer64;
}(_scatterplotLayer2.default);

exports.default = ScatterplotLayer64;


ScatterplotLayer64.layerName = 'ScatterplotLayer64';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZnA2NC9zY2F0dGVycGxvdC1sYXllci9zY2F0dGVycGxvdC1sYXllci02NC5qcyJdLCJuYW1lcyI6WyJTY2F0dGVycGxvdExheWVyNjQiLCJpZCIsInZzIiwiZnMiLCJmcDY0IiwicHJvamVjdDY0IiwiYXR0cmlidXRlTWFuYWdlciIsInN0YXRlIiwiYWRkSW5zdGFuY2VkIiwiaW5zdGFuY2VQb3NpdGlvbnM2NHh5Iiwic2l6ZSIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjR4eSIsImluc3RhbmNlUG9zaXRpb25zNjR6IiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHoiLCJhdHRyaWJ1dGUiLCJwcm9wcyIsImRhdGEiLCJnZXRQb3NpdGlvbiIsInZhbHVlIiwiaSIsInBvaW50IiwicG9zaXRpb24iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQW9CQTs7OztBQUNBOztBQUVBOzs7Ozs7OzsrZUF2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBT3FCQSxrQjs7Ozs7Ozs7Ozs7OztBQUVuQjsrQkFDV0MsRSxFQUFJO0FBQ2IsYUFBTztBQUNMQyxrdkZBREs7QUFFTEMsWUFBSSxtSUFBbUJBLEVBRmxCO0FBR0xDLGNBQU0sSUFIRDtBQUlMQyxtQkFBVztBQUpOLE9BQVA7QUFNRDs7O3NDQUVpQjtBQUNoQjtBQUNBOztBQUVBO0FBSmdCLFVBS1RDLGdCQUxTLEdBS1csS0FBS0MsS0FMaEIsQ0FLVEQsZ0JBTFM7O0FBTWhCQSx1QkFBaUJFLFlBQWpCLENBQThCO0FBQzVCQywrQkFBdUIsRUFBQ0MsTUFBTSxDQUFQLEVBQVVDLFFBQVEsS0FBS0MsOEJBQXZCLEVBREs7QUFFNUJDLDhCQUFzQixFQUFDSCxNQUFNLENBQVAsRUFBVUMsUUFBUSxLQUFLRyw2QkFBdkI7QUFDdEI7QUFDQTtBQUNBO0FBTDRCLE9BQTlCO0FBT0Q7OzttREFFOEJDLFMsRUFBVztBQUFBLG1CQUNaLEtBQUtDLEtBRE87QUFBQSxVQUNqQ0MsSUFEaUMsVUFDakNBLElBRGlDO0FBQUEsVUFDM0JDLFdBRDJCLFVBQzNCQSxXQUQyQjtBQUFBLFVBRWpDQyxLQUZpQyxHQUVsQkosU0FGa0IsQ0FFakNJLEtBRmlDO0FBQUEsVUFFMUJULElBRjBCLEdBRWxCSyxTQUZrQixDQUUxQkwsSUFGMEI7O0FBR3hDLFVBQUlVLElBQUksQ0FBUjtBQUh3QztBQUFBO0FBQUE7O0FBQUE7QUFJeEMsNkJBQW9CSCxJQUFwQiw4SEFBMEI7QUFBQSxjQUFmSSxLQUFlOztBQUN4QixjQUFNQyxXQUFXSixZQUFZRyxLQUFaLENBQWpCOztBQUR3Qix5QkFFTyxpQkFBUUMsU0FBUyxDQUFULENBQVIsQ0FGUDs7QUFBQTs7QUFFdkJILGdCQUFNQyxJQUFJLENBQVYsQ0FGdUI7QUFFVEQsZ0JBQU1DLElBQUksQ0FBVixDQUZTOztBQUFBLDBCQUdPLGlCQUFRRSxTQUFTLENBQVQsQ0FBUixDQUhQOztBQUFBOztBQUd2QkgsZ0JBQU1DLElBQUksQ0FBVixDQUh1QjtBQUdURCxnQkFBTUMsSUFBSSxDQUFWLENBSFM7O0FBSXhCQSxlQUFLVixJQUFMO0FBQ0Q7QUFUdUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVV6Qzs7O2tEQUU2QkssUyxFQUFXO0FBQUEsb0JBQ1gsS0FBS0MsS0FETTtBQUFBLFVBQ2hDQyxJQURnQyxXQUNoQ0EsSUFEZ0M7QUFBQSxVQUMxQkMsV0FEMEIsV0FDMUJBLFdBRDBCO0FBQUEsVUFFaENDLEtBRmdDLEdBRWpCSixTQUZpQixDQUVoQ0ksS0FGZ0M7QUFBQSxVQUV6QlQsSUFGeUIsR0FFakJLLFNBRmlCLENBRXpCTCxJQUZ5Qjs7QUFHdkMsVUFBSVUsSUFBSSxDQUFSO0FBSHVDO0FBQUE7QUFBQTs7QUFBQTtBQUl2Qyw4QkFBb0JILElBQXBCLG1JQUEwQjtBQUFBLGNBQWZJLEtBQWU7O0FBQ3hCLGNBQU1DLFdBQVdKLFlBQVlHLEtBQVosQ0FBakI7O0FBRHdCLDBCQUVPLGlCQUFRQyxTQUFTLENBQVQsS0FBZSxDQUF2QixDQUZQOztBQUFBOztBQUV2QkgsZ0JBQU1DLElBQUksQ0FBVixDQUZ1QjtBQUVURCxnQkFBTUMsSUFBSSxDQUFWLENBRlM7O0FBR3hCQSxlQUFLVixJQUFMO0FBQ0Q7QUFSc0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVN4Qzs7Ozs7O2tCQWhEa0JWLGtCOzs7QUFtRHJCQSxtQkFBbUJ1QixTQUFuQixHQUErQixvQkFBL0IiLCJmaWxlIjoic2NhdHRlcnBsb3QtbGF5ZXItNjQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTYgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQgU2NhdHRlcnBsb3RMYXllciBmcm9tICcuLi8uLi9jb3JlL3NjYXR0ZXJwbG90LWxheWVyJztcbmltcG9ydCB7ZnA2NGlmeX0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzL2ZwNjQnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjYXR0ZXJwbG90TGF5ZXI2NCBleHRlbmRzIFNjYXR0ZXJwbG90TGF5ZXIge1xuXG4gIC8vIE92ZXJyaWRlIHRoZSBzdXBlciBjbGFzcyB2ZXJ0ZXggc2hhZGVyXG4gIGdldFNoYWRlcnMoaWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vc2NhdHRlcnBsb3QtbGF5ZXItNjQtdmVydGV4Lmdsc2wnKSwgJ3V0ZjgnKSxcbiAgICAgIGZzOiBzdXBlci5nZXRTaGFkZXJzKCkuZnMsXG4gICAgICBmcDY0OiB0cnVlLFxuICAgICAgcHJvamVjdDY0OiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICAvLyBXZSB1c2UgdGhlIG1vZGVsIGFuZCBhbGwgYXR0cmlidXRlcyBleGNlcHQgXCJpbnN0YW5jZVBvc2l0aW9uc1wiIG9mIHRoZSBiYXNlIGxheWVyXG4gICAgc3VwZXIuaW5pdGlhbGl6ZVN0YXRlKCk7XG5cbiAgICAvLyBBZGQgdGhlIDY0IGJpdCBwb3NpdGlvbnNcbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgIGluc3RhbmNlUG9zaXRpb25zNjR4eToge3NpemU6IDQsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHl9LFxuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM2NHo6IHtzaXplOiAyLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHp9XG4gICAgICAvLyBSZXVzaW5nIGZyb20gYmFzZSBjbGFzc1xuICAgICAgLy8gaW5zdGFuY2VSYWRpdXM6IHtzaXplOiAxLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VSYWRpdXN9LFxuICAgICAgLy8gaW5zdGFuY2VDb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnN9XG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHkoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIFt2YWx1ZVtpICsgMF0sIHZhbHVlW2kgKyAxXV0gPSBmcDY0aWZ5KHBvc2l0aW9uWzBdKTtcbiAgICAgIFt2YWx1ZVtpICsgMl0sIHZhbHVlW2kgKyAzXV0gPSBmcDY0aWZ5KHBvc2l0aW9uWzFdKTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eihhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0UG9zaXRpb24ocG9pbnQpO1xuICAgICAgW3ZhbHVlW2kgKyAwXSwgdmFsdWVbaSArIDFdXSA9IGZwNjRpZnkocG9zaXRpb25bMl0gfHwgMCk7XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG59XG5cblNjYXR0ZXJwbG90TGF5ZXI2NC5sYXllck5hbWUgPSAnU2NhdHRlcnBsb3RMYXllcjY0JztcbiJdfQ==
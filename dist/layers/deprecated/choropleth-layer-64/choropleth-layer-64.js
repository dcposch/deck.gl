'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _choroplethLayer = require('../choropleth-layer');

var _choroplethLayer2 = _interopRequireDefault(_choroplethLayer);

var _fp = require('../../../lib/utils/fp64');

var _lodash = require('lodash.flattendeep');

var _lodash2 = _interopRequireDefault(_lodash);

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

var ChoroplethLayer64 = function (_ChoroplethLayer) {
  _inherits(ChoroplethLayer64, _ChoroplethLayer);

  function ChoroplethLayer64() {
    _classCallCheck(this, ChoroplethLayer64);

    return _possibleConstructorReturn(this, (ChoroplethLayer64.__proto__ || Object.getPrototypeOf(ChoroplethLayer64)).apply(this, arguments));
  }

  _createClass(ChoroplethLayer64, [{
    key: 'initializeState',
    value: function initializeState() {
      _get(ChoroplethLayer64.prototype.__proto__ || Object.getPrototypeOf(ChoroplethLayer64.prototype), 'initializeState', this).call(this);

      this.state.attributeManager.addDynamic({
        positions64: { size: 4, update: this.calculatePositions64 },
        heights64: { size: 2, update: this.calculateHeights64 }
      });
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2016 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME choropleth-layer-64-vertex-shader\n\nattribute vec4 positions64;\nattribute vec2 heights64;\nattribute vec4 colors;\nattribute vec3 pickingColors;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\nuniform float pickingEnabled;\nvarying vec4 vPickingColor;\nvoid picking_setPickColor(vec3 pickingColor) {\n  vPickingColor = vec4(pickingColor,  1.);\n}\nvec4 picking_setNormalAndPickColors(vec4 color, vec3 pickingColor) {\n  vec4 pickingColor4 = vec4(pickingColor.rgb, 1.);\n  vPickingColor = mix(color, pickingColor4, pickingEnabled);\n  return vPickingColor;\n}\n\nvoid main(void) {\n  // For some reason, need to add one to elevation to show up in untilted mode\n  vec2 projectedCoord[2];\n  project_position_fp64(positions64, projectedCoord);\n\n  vec2 vertex_pos_modelspace[4];\n\n  vertex_pos_modelspace[0] = projectedCoord[0];\n  vertex_pos_modelspace[1] = projectedCoord[1];\n  vertex_pos_modelspace[2] = heights64;\n  vertex_pos_modelspace[3] = vec2(1.0, 0.0);\n\n  gl_Position = project_to_clipspace_fp64(vertex_pos_modelspace);\n\n  vec4 color = vec4(colors.rgb, colors.a * opacity) / 255.;\n\n  picking_setNormalAndPickColors(\n    color,\n    pickingColors / 255.\n  );\n}\n',
        fs: _get(ChoroplethLayer64.prototype.__proto__ || Object.getPrototypeOf(ChoroplethLayer64.prototype), 'getShaders', this).call(this).fs,
        fp64: true,
        project64: true
      };
    }
  }, {
    key: 'calculatePositions64',
    value: function calculatePositions64(attribute) {
      var vertices = (0, _lodash2.default)(this.state.choropleths);
      attribute.value = new Float32Array(vertices.length / 3 * 4);
      for (var index = 0; index < vertices.length / 3; index++) {
        var _fp64ify = (0, _fp.fp64ify)(vertices[index * 3]);

        var _fp64ify2 = _slicedToArray(_fp64ify, 2);

        attribute.value[index * 4] = _fp64ify2[0];
        attribute.value[index * 4 + 1] = _fp64ify2[1];

        var _fp64ify3 = (0, _fp.fp64ify)(vertices[index * 3 + 1]);

        var _fp64ify4 = _slicedToArray(_fp64ify3, 2);

        attribute.value[index * 4 + 2] = _fp64ify4[0];
        attribute.value[index * 4 + 3] = _fp64ify4[1];
      }
    }
  }, {
    key: 'calculateHeights64',
    value: function calculateHeights64(attribute) {
      var vertices = (0, _lodash2.default)(this.state.choropleths);
      attribute.value = new Float32Array(vertices.length / 3 * 2);
      for (var index = 0; index < vertices.length / 3; index++) {
        var _fp64ify5 = (0, _fp.fp64ify)(vertices[index * 3 + 2]);

        var _fp64ify6 = _slicedToArray(_fp64ify5, 2);

        attribute.value[index * 2] = _fp64ify6[0];
        attribute.value[index * 2 + 1] = _fp64ify6[1];
      }
    }
  }]);

  return ChoroplethLayer64;
}(_choroplethLayer2.default);

exports.default = ChoroplethLayer64;


ChoroplethLayer64.layerName = 'ChoroplethLayer64';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9jaG9yb3BsZXRoLWxheWVyLTY0L2Nob3JvcGxldGgtbGF5ZXItNjQuanMiXSwibmFtZXMiOlsiQ2hvcm9wbGV0aExheWVyNjQiLCJzdGF0ZSIsImF0dHJpYnV0ZU1hbmFnZXIiLCJhZGREeW5hbWljIiwicG9zaXRpb25zNjQiLCJzaXplIiwidXBkYXRlIiwiY2FsY3VsYXRlUG9zaXRpb25zNjQiLCJoZWlnaHRzNjQiLCJjYWxjdWxhdGVIZWlnaHRzNjQiLCJ2cyIsImZzIiwiZnA2NCIsInByb2plY3Q2NCIsImF0dHJpYnV0ZSIsInZlcnRpY2VzIiwiY2hvcm9wbGV0aHMiLCJ2YWx1ZSIsIkZsb2F0MzJBcnJheSIsImxlbmd0aCIsImluZGV4IiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFvQkE7Ozs7QUFDQTs7QUFDQTs7OztBQUVBOzs7Ozs7OzsrZUF4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBUXFCQSxpQjs7Ozs7Ozs7Ozs7c0NBRUQ7QUFDaEI7O0FBRUEsV0FBS0MsS0FBTCxDQUFXQyxnQkFBWCxDQUE0QkMsVUFBNUIsQ0FBdUM7QUFDckNDLHFCQUFhLEVBQUNDLE1BQU0sQ0FBUCxFQUFVQyxRQUFRLEtBQUtDLG9CQUF2QixFQUR3QjtBQUVyQ0MsbUJBQVcsRUFBQ0gsTUFBTSxDQUFQLEVBQVVDLFFBQVEsS0FBS0csa0JBQXZCO0FBRjBCLE9BQXZDO0FBSUQ7OztpQ0FFWTtBQUNYLGFBQU87QUFDTEMsNjJFQURLO0FBRUxDLFlBQUksaUlBQW1CQSxFQUZsQjtBQUdMQyxjQUFNLElBSEQ7QUFJTEMsbUJBQVc7QUFKTixPQUFQO0FBTUQ7Ozt5Q0FFb0JDLFMsRUFBVztBQUM5QixVQUFNQyxXQUFXLHNCQUFZLEtBQUtkLEtBQUwsQ0FBV2UsV0FBdkIsQ0FBakI7QUFDQUYsZ0JBQVVHLEtBQVYsR0FBa0IsSUFBSUMsWUFBSixDQUFpQkgsU0FBU0ksTUFBVCxHQUFrQixDQUFsQixHQUFzQixDQUF2QyxDQUFsQjtBQUNBLFdBQUssSUFBSUMsUUFBUSxDQUFqQixFQUFvQkEsUUFBUUwsU0FBU0ksTUFBVCxHQUFrQixDQUE5QyxFQUFpREMsT0FBakQsRUFBMEQ7QUFBQSx1QkFJcEQsaUJBQVFMLFNBQVNLLFFBQVEsQ0FBakIsQ0FBUixDQUpvRDs7QUFBQTs7QUFFdEROLGtCQUFVRyxLQUFWLENBQWdCRyxRQUFRLENBQXhCLENBRnNEO0FBR3RETixrQkFBVUcsS0FBVixDQUFnQkcsUUFBUSxDQUFSLEdBQVksQ0FBNUIsQ0FIc0Q7O0FBQUEsd0JBUXBELGlCQUFRTCxTQUFTSyxRQUFRLENBQVIsR0FBWSxDQUFyQixDQUFSLENBUm9EOztBQUFBOztBQU10RE4sa0JBQVVHLEtBQVYsQ0FBZ0JHLFFBQVEsQ0FBUixHQUFZLENBQTVCLENBTnNEO0FBT3RETixrQkFBVUcsS0FBVixDQUFnQkcsUUFBUSxDQUFSLEdBQVksQ0FBNUIsQ0FQc0Q7QUFTekQ7QUFDRjs7O3VDQUVrQk4sUyxFQUFXO0FBQzVCLFVBQU1DLFdBQVcsc0JBQVksS0FBS2QsS0FBTCxDQUFXZSxXQUF2QixDQUFqQjtBQUNBRixnQkFBVUcsS0FBVixHQUFrQixJQUFJQyxZQUFKLENBQWlCSCxTQUFTSSxNQUFULEdBQWtCLENBQWxCLEdBQXNCLENBQXZDLENBQWxCO0FBQ0EsV0FBSyxJQUFJQyxRQUFRLENBQWpCLEVBQW9CQSxRQUFRTCxTQUFTSSxNQUFULEdBQWtCLENBQTlDLEVBQWlEQyxPQUFqRCxFQUEwRDtBQUFBLHdCQUlwRCxpQkFBUUwsU0FBU0ssUUFBUSxDQUFSLEdBQVksQ0FBckIsQ0FBUixDQUpvRDs7QUFBQTs7QUFFdEROLGtCQUFVRyxLQUFWLENBQWdCRyxRQUFRLENBQXhCLENBRnNEO0FBR3RETixrQkFBVUcsS0FBVixDQUFnQkcsUUFBUSxDQUFSLEdBQVksQ0FBNUIsQ0FIc0Q7QUFLekQ7QUFDRjs7Ozs7O2tCQTVDa0JwQixpQjs7O0FBK0NyQkEsa0JBQWtCcUIsU0FBbEIsR0FBOEIsbUJBQTlCIiwiZmlsZSI6ImNob3JvcGxldGgtbGF5ZXItNjQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQgQ2hvcm9wbGV0aExheWVyIGZyb20gJy4uL2Nob3JvcGxldGgtbGF5ZXInO1xuaW1wb3J0IHtmcDY0aWZ5fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQgZmxhdHRlbkRlZXAgZnJvbSAnbG9kYXNoLmZsYXR0ZW5kZWVwJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2pvaW59IGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaG9yb3BsZXRoTGF5ZXI2NCBleHRlbmRzIENob3JvcGxldGhMYXllciB7XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHN1cGVyLmluaXRpYWxpemVTdGF0ZSgpO1xuXG4gICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmFkZER5bmFtaWMoe1xuICAgICAgcG9zaXRpb25zNjQ6IHtzaXplOiA0LCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zNjR9LFxuICAgICAgaGVpZ2h0czY0OiB7c2l6ZTogMiwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUhlaWdodHM2NH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZzOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL2Nob3JvcGxldGgtbGF5ZXItNjQtdmVydGV4Lmdsc2wnKSwgJ3V0ZjgnKSxcbiAgICAgIGZzOiBzdXBlci5nZXRTaGFkZXJzKCkuZnMsXG4gICAgICBmcDY0OiB0cnVlLFxuICAgICAgcHJvamVjdDY0OiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVBvc2l0aW9uczY0KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHZlcnRpY2VzID0gZmxhdHRlbkRlZXAodGhpcy5zdGF0ZS5jaG9yb3BsZXRocyk7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlcy5sZW5ndGggLyAzICogNCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHZlcnRpY2VzLmxlbmd0aCAvIDM7IGluZGV4KyspIHtcbiAgICAgIFtcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlW2luZGV4ICogNF0sXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZVtpbmRleCAqIDQgKyAxXVxuICAgICAgXSA9IGZwNjRpZnkodmVydGljZXNbaW5kZXggKiAzXSk7XG4gICAgICBbXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZVtpbmRleCAqIDQgKyAyXSxcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlW2luZGV4ICogNCArIDNdXG4gICAgICBdID0gZnA2NGlmeSh2ZXJ0aWNlc1tpbmRleCAqIDMgKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSGVpZ2h0czY0KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHZlcnRpY2VzID0gZmxhdHRlbkRlZXAodGhpcy5zdGF0ZS5jaG9yb3BsZXRocyk7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlcy5sZW5ndGggLyAzICogMik7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHZlcnRpY2VzLmxlbmd0aCAvIDM7IGluZGV4KyspIHtcbiAgICAgIFtcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlW2luZGV4ICogMl0sXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZVtpbmRleCAqIDIgKyAxXVxuICAgICAgXSA9IGZwNjRpZnkodmVydGljZXNbaW5kZXggKiAzICsgMl0pO1xuICAgIH1cbiAgfVxufVxuXG5DaG9yb3BsZXRoTGF5ZXI2NC5sYXllck5hbWUgPSAnQ2hvcm9wbGV0aExheWVyNjQnO1xuIl19
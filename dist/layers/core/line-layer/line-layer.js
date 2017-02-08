'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

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

var DEFAULT_COLOR = [0, 255, 0, 255];

var defaultProps = {
  getSourcePosition: function getSourcePosition(x) {
    return x.sourcePosition;
  },
  getTargetPosition: function getTargetPosition(x) {
    return x.targetPosition;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  },
  strokeWidth: 1
};

var LineLayer = function (_Layer) {
  _inherits(LineLayer, _Layer);

  function LineLayer() {
    _classCallCheck(this, LineLayer);

    return _possibleConstructorReturn(this, (LineLayer.__proto__ || Object.getPrototypeOf(LineLayer)).apply(this, arguments));
  }

  _createClass(LineLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this.createModel(gl) });

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
    key: 'draw',
    value: function draw(_ref) {
      var uniforms = _ref.uniforms;
      var gl = this.context.gl;

      var lineWidth = this.screenToDevicePixels(this.props.strokeWidth);
      gl.lineWidth(lineWidth);
      this.state.model.render(uniforms);
      // Setting line width back to 1 is here to workaround a Google Chrome bug
      // gl.clear() and gl.isEnabled() will return GL_INVALID_VALUE even with
      // correct parameter
      // This is not happening on Safari and Firefox
      gl.lineWidth(1.0);
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME line-layer-vertex-shader\n\nattribute vec3 positions;\nattribute vec3 instanceSourcePositions;\nattribute vec3 instanceTargetPositions;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  // Position\n  vec3 source = project_position(instanceSourcePositions);\n  vec3 target = project_position(instanceTargetPositions);\n\n  // linear interpolation of source & target to pick right coord\n  float segmentIndex = positions.x;\n  vec3 p = mix(source, target, segmentIndex);\n\n  gl_Position = project_to_clipspace(vec4(p, 1.));\n\n  // Color\n  vec4 color = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n  vColor = mix(\n    color,\n    pickingColor,\n    renderPickingBuffer\n  );\n}\n',
        fs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n#define SHADER_NAME line-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n}\n'
      };
    }
  }, {
    key: 'createModel',
    value: function createModel(gl) {
      var positions = [0, 0, 0, 1, 1, 1];

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.LINE_STRIP,
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
          value[i + 2] = sourcePosition[2] || 0;
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
          value[i + 2] = targetPosition[2] || 0;
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
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getColor = _props3.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getColor(object);
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = isNaN(color[3]) ? DEFAULT_COLOR[3] : color[3];
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

  return LineLayer;
}(_lib.Layer);

exports.default = LineLayer;


LineLayer.layerName = 'LineLayer';
LineLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9saW5lLWxheWVyL2xpbmUtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImdldFNvdXJjZVBvc2l0aW9uIiwieCIsInNvdXJjZVBvc2l0aW9uIiwiZ2V0VGFyZ2V0UG9zaXRpb24iLCJ0YXJnZXRQb3NpdGlvbiIsImdldENvbG9yIiwiY29sb3IiLCJzdHJva2VXaWR0aCIsIkxpbmVMYXllciIsImdsIiwiY29udGV4dCIsInNldFN0YXRlIiwibW9kZWwiLCJjcmVhdGVNb2RlbCIsImF0dHJpYnV0ZU1hbmFnZXIiLCJzdGF0ZSIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlU291cmNlUG9zaXRpb25zIiwic2l6ZSIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VQb3NpdGlvbnMiLCJpbnN0YW5jZVRhcmdldFBvc2l0aW9ucyIsImNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0UG9zaXRpb25zIiwiaW5zdGFuY2VDb2xvcnMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwidW5pZm9ybXMiLCJsaW5lV2lkdGgiLCJzY3JlZW5Ub0RldmljZVBpeGVscyIsInByb3BzIiwicmVuZGVyIiwidnMiLCJmcyIsInBvc2l0aW9ucyIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiTElORV9TVFJJUCIsIkZsb2F0MzJBcnJheSIsImlzSW5zdGFuY2VkIiwiYXR0cmlidXRlIiwiZGF0YSIsInZhbHVlIiwiaSIsIm9iamVjdCIsImlzTmFOIiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFFQTs7Ozs7OytlQXhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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O0FBQUEsVUFDMUJjLElBRDBCLFdBQzFCQSxJQUQwQjtBQUFBLFVBQ3BCeEMsUUFEb0IsV0FDcEJBLFFBRG9CO0FBQUEsVUFFMUJ5QyxLQUYwQixHQUVYRixTQUZXLENBRTFCRSxLQUYwQjtBQUFBLFVBRW5CNUIsSUFGbUIsR0FFWDBCLFNBRlcsQ0FFbkIxQixJQUZtQjs7QUFHakMsVUFBSTZCLElBQUksQ0FBUjtBQUhpQztBQUFBO0FBQUE7O0FBQUE7QUFJakMsOEJBQXFCRixJQUFyQixtSUFBMkI7QUFBQSxjQUFoQkcsTUFBZ0I7O0FBQ3pCLGNBQU0xQyxRQUFRRCxTQUFTMkMsTUFBVCxDQUFkO0FBQ0FGLGdCQUFNQyxJQUFJLENBQVYsSUFBZXpDLE1BQU0sQ0FBTixDQUFmO0FBQ0F3QyxnQkFBTUMsSUFBSSxDQUFWLElBQWV6QyxNQUFNLENBQU4sQ0FBZjtBQUNBd0MsZ0JBQU1DLElBQUksQ0FBVixJQUFlekMsTUFBTSxDQUFOLENBQWY7QUFDQXdDLGdCQUFNQyxJQUFJLENBQVYsSUFBZUUsTUFBTTNDLE1BQU0sQ0FBTixDQUFOLElBQWtCUixjQUFjLENBQWQsQ0FBbEIsR0FBcUNRLE1BQU0sQ0FBTixDQUFwRDtBQUNBeUMsZUFBSzdCLElBQUw7QUFDRDtBQVhnQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWWxDOzs7Ozs7a0JBMUZrQlYsUzs7O0FBNkZyQkEsVUFBVTBDLFNBQVYsR0FBc0IsV0FBdEI7QUFDQTFDLFVBQVVULFlBQVYsR0FBeUJBLFlBQXpCIiwiZmlsZSI6ImxpbmUtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IHthc3NlbWJsZVNoYWRlcnN9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMjU1LCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIGdldFNvdXJjZVBvc2l0aW9uOiB4ID0+IHguc291cmNlUG9zaXRpb24sXG4gIGdldFRhcmdldFBvc2l0aW9uOiB4ID0+IHgudGFyZ2V0UG9zaXRpb24sXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUixcbiAgc3Ryb2tlV2lkdGg6IDFcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbmVMYXllciBleHRlbmRzIExheWVyIHtcbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuY3JlYXRlTW9kZWwoZ2wpfSk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVNvdXJjZVBvc2l0aW9uczoge3NpemU6IDMsIGFjY2Vzc29yOiAnZ2V0U291cmNlUG9zaXRpb24nLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VQb3NpdGlvbnN9LFxuICAgICAgaW5zdGFuY2VUYXJnZXRQb3NpdGlvbnM6IHtzaXplOiAzLCBhY2Nlc3NvcjogJ2dldFRhcmdldFBvc2l0aW9uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0UG9zaXRpb25zfSxcbiAgICAgIGluc3RhbmNlQ29sb3JzOiB7c2l6ZTogNCwgdHlwZTogR0wuVU5TSUdORURfQllURSwgYWNjZXNzb3I6ICdnZXRDb2xvcicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yc31cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgbGluZVdpZHRoID0gdGhpcy5zY3JlZW5Ub0RldmljZVBpeGVscyh0aGlzLnByb3BzLnN0cm9rZVdpZHRoKTtcbiAgICBnbC5saW5lV2lkdGgobGluZVdpZHRoKTtcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcih1bmlmb3Jtcyk7XG4gICAgLy8gU2V0dGluZyBsaW5lIHdpZHRoIGJhY2sgdG8gMSBpcyBoZXJlIHRvIHdvcmthcm91bmQgYSBHb29nbGUgQ2hyb21lIGJ1Z1xuICAgIC8vIGdsLmNsZWFyKCkgYW5kIGdsLmlzRW5hYmxlZCgpIHdpbGwgcmV0dXJuIEdMX0lOVkFMSURfVkFMVUUgZXZlbiB3aXRoXG4gICAgLy8gY29ycmVjdCBwYXJhbWV0ZXJcbiAgICAvLyBUaGlzIGlzIG5vdCBoYXBwZW5pbmcgb24gU2FmYXJpIGFuZCBGaXJlZm94XG4gICAgZ2wubGluZVdpZHRoKDEuMCk7XG4gIH1cblxuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICB2czogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9saW5lLWxheWVyLXZlcnRleC5nbHNsJyksICd1dGY4JyksXG4gICAgICBmczogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9saW5lLWxheWVyLWZyYWdtZW50Lmdsc2wnKSwgJ3V0ZjgnKVxuICAgIH07XG4gIH1cblxuICBjcmVhdGVNb2RlbChnbCkge1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFswLCAwLCAwLCAxLCAxLCAxXTtcblxuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHJldHVybiBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IEdMLkxJTkVfU1RSSVAsXG4gICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICB9KSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0U291cmNlUG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IGdldFNvdXJjZVBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBzb3VyY2VQb3NpdGlvblswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IHNvdXJjZVBvc2l0aW9uWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gc291cmNlUG9zaXRpb25bMl0gfHwgMDtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVRhcmdldFBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0VGFyZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IGdldFRhcmdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSB0YXJnZXRQb3NpdGlvblswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IHRhcmdldFBvc2l0aW9uWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gdGFyZ2V0UG9zaXRpb25bMl0gfHwgMDtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpICsgM10gPSBpc05hTihjb2xvclszXSkgPyBERUZBVUxUX0NPTE9SWzNdIDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG59XG5cbkxpbmVMYXllci5sYXllck5hbWUgPSAnTGluZUxheWVyJztcbkxpbmVMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
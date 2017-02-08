'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

var DEFAULT_COLOR = [0, 0, 255, 255];

var defaultProps = {
  strokeWidth: 1,
  getSourcePosition: function getSourcePosition(x) {
    return x.sourcePosition;
  },
  getTargetPosition: function getTargetPosition(x) {
    return x.targetPosition;
  },
  getSourceColor: function getSourceColor(x) {
    return x.color;
  },
  getTargetColor: function getTargetColor(x) {
    return x.color;
  }
};

var ArcLayer = function (_Layer) {
  _inherits(ArcLayer, _Layer);

  function ArcLayer() {
    _classCallCheck(this, ArcLayer);

    return _possibleConstructorReturn(this, (ArcLayer.__proto__ || Object.getPrototypeOf(ArcLayer)).apply(this, arguments));
  }

  _createClass(ArcLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this._createModel(gl) });

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
        vs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME arc-layer-vertex-shader\n\nconst float N = 49.0;\n\nattribute vec3 positions;\nattribute vec4 instanceSourceColors;\nattribute vec4 instanceTargetColors;\nattribute vec4 instancePositions;\nattribute vec3 instancePickingColors;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\nfloat paraboloid(vec2 source, vec2 target, float ratio) {\n\n  vec2 x = mix(source, target, ratio);\n  vec2 center = mix(source, target, 0.5);\n\n  float dSourceCenter = distance(source, center);\n  float dXCenter = distance(x, center);\n  return (dSourceCenter + dXCenter) * (dSourceCenter - dXCenter);\n}\n\nvoid main(void) {\n  vec2 source = preproject(instancePositions.xy);\n  vec2 target = preproject(instancePositions.zw);\n\n  float segmentRatio = smoothstep(0.0, 1.0, positions.x / N);\n\n  float vertex_height = paraboloid(source, target, segmentRatio);\n  if (vertex_height < 0.0) vertex_height = 0.0;\n  vec3 p = vec3(\n    // xy: linear interpolation of source & target\n    mix(source, target, segmentRatio),\n    // z: paraboloid interpolate of source & target\n    sqrt(vertex_height)\n  );\n\n  gl_Position = project(vec4(p, 1.0));\n\n  vec4 color = mix(instanceSourceColors, instanceTargetColors, segmentRatio) / 255.;\n\n  vColor = mix(\n    vec4(color.rgb, color.a * opacity),\n    vec4(instancePickingColors / 255., 1.),\n    renderPickingBuffer\n  );\n}\n',
        fs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME arc-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n}\n'
      };
    }
  }, {
    key: '_createModel',
    value: function _createModel(gl) {
      var positions = [];
      var NUM_SEGMENTS = 50;
      for (var i = 0; i < NUM_SEGMENTS; i++) {
        positions = [].concat(_toConsumableArray(positions), [i, i, i]);
      }

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
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
    key: 'calculateInstanceSourceColors',
    value: function calculateInstanceSourceColors(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getSourceColor = _props2.getSourceColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var color = getSourceColor(object) || DEFAULT_COLOR;
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = isNaN(color[3]) ? DEFAULT_COLOR[3] : color[3];
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
    key: 'calculateInstanceTargetColors',
    value: function calculateInstanceTargetColors(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getTargetColor = _props3.getTargetColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getTargetColor(object) || DEFAULT_COLOR;
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

  return ArcLayer;
}(_lib.Layer);

exports.default = ArcLayer;


ArcLayer.layerName = 'ArcLayer';
ArcLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9hcmMtbGF5ZXIvYXJjLWxheWVyLmpzIl0sIm5hbWVzIjpbIkRFRkFVTFRfQ09MT1IiLCJkZWZhdWx0UHJvcHMiLCJzdHJva2VXaWR0aCIsImdldFNvdXJjZVBvc2l0aW9uIiwieCIsInNvdXJjZVBvc2l0aW9uIiwiZ2V0VGFyZ2V0UG9zaXRpb24iLCJ0YXJnZXRQb3NpdGlvbiIsImdldFNvdXJjZUNvbG9yIiwiY29sb3IiLCJnZXRUYXJnZXRDb2xvciIsIkFyY0xheWVyIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9jcmVhdGVNb2RlbCIsImF0dHJpYnV0ZU1hbmFnZXIiLCJzdGF0ZSIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZVNvdXJjZUNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VDb2xvcnMiLCJpbnN0YW5jZVRhcmdldENvbG9ycyIsImNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0Q29sb3JzIiwidW5pZm9ybXMiLCJsaW5lV2lkdGgiLCJzY3JlZW5Ub0RldmljZVBpeGVscyIsInByb3BzIiwicmVuZGVyIiwidnMiLCJmcyIsInBvc2l0aW9ucyIsIk5VTV9TRUdNRU5UUyIsImkiLCJzaGFkZXJzIiwiZ2V0U2hhZGVycyIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJMSU5FX1NUUklQIiwiRmxvYXQzMkFycmF5IiwiaXNJbnN0YW5jZWQiLCJhdHRyaWJ1dGUiLCJkYXRhIiwidmFsdWUiLCJvYmplY3QiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFvQkE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7Ozs7OytlQXhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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K0IsZUFBS25CLElBQUw7QUFDRDtBQVhzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWXhDOzs7Ozs7a0JBaEdrQlYsUTs7O0FBbUdyQkEsU0FBUzBDLFNBQVQsR0FBcUIsVUFBckI7QUFDQTFDLFNBQVNWLFlBQVQsR0FBd0JBLFlBQXhCIiwiZmlsZSI6ImFyYy1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7R0wsIE1vZGVsLCBHZW9tZXRyeX0gZnJvbSAnbHVtYS5nbCc7XG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtqb2lufSBmcm9tICdwYXRoJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAyNTUsIDI1NV07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgc3Ryb2tlV2lkdGg6IDEsXG4gIGdldFNvdXJjZVBvc2l0aW9uOiB4ID0+IHguc291cmNlUG9zaXRpb24sXG4gIGdldFRhcmdldFBvc2l0aW9uOiB4ID0+IHgudGFyZ2V0UG9zaXRpb24sXG4gIGdldFNvdXJjZUNvbG9yOiB4ID0+IHguY29sb3IsXG4gIGdldFRhcmdldENvbG9yOiB4ID0+IHguY29sb3Jcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyY0xheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fY3JlYXRlTW9kZWwoZ2wpfSk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge3NpemU6IDQsIGFjY2Vzc29yOiBbJ2dldFNvdXJjZVBvc2l0aW9uJywgJ2dldFRhcmdldFBvc2l0aW9uJ10sIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uc30sXG4gICAgICBpbnN0YW5jZVNvdXJjZUNvbG9yczoge3NpemU6IDQsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0U291cmNlQ29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VDb2xvcnN9LFxuICAgICAgaW5zdGFuY2VUYXJnZXRDb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldFRhcmdldENvbG9yJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0Q29sb3JzfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBsaW5lV2lkdGggPSB0aGlzLnNjcmVlblRvRGV2aWNlUGl4ZWxzKHRoaXMucHJvcHMuc3Ryb2tlV2lkdGgpO1xuICAgIGdsLmxpbmVXaWR0aChsaW5lV2lkdGgpO1xuICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKHVuaWZvcm1zKTtcbiAgICAvLyBTZXR0aW5nIGxpbmUgd2lkdGggYmFjayB0byAxIGlzIGhlcmUgdG8gd29ya2Fyb3VuZCBhIEdvb2dsZSBDaHJvbWUgYnVnXG4gICAgLy8gZ2wuY2xlYXIoKSBhbmQgZ2wuaXNFbmFibGVkKCkgd2lsbCByZXR1cm4gR0xfSU5WQUxJRF9WQUxVRSBldmVuIHdpdGhcbiAgICAvLyBjb3JyZWN0IHBhcmFtZXRlclxuICAgIC8vIFRoaXMgaXMgbm90IGhhcHBlbmluZyBvbiBTYWZhcmkgYW5kIEZpcmVmb3hcbiAgICBnbC5saW5lV2lkdGgoMS4wKTtcbiAgfVxuXG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZzOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL2FyYy1sYXllci12ZXJ0ZXguZ2xzbCcpLCAndXRmOCcpLFxuICAgICAgZnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vYXJjLWxheWVyLWZyYWdtZW50Lmdsc2wnKSwgJ3V0ZjgnKVxuICAgIH07XG4gIH1cblxuICBfY3JlYXRlTW9kZWwoZ2wpIHtcbiAgICBsZXQgcG9zaXRpb25zID0gW107XG4gICAgY29uc3QgTlVNX1NFR01FTlRTID0gNTA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOVU1fU0VHTUVOVFM7IGkrKykge1xuICAgICAgcG9zaXRpb25zID0gWy4uLnBvc2l0aW9ucywgaSwgaSwgaV07XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVycyA9IGFzc2VtYmxlU2hhZGVycyhnbCwgdGhpcy5nZXRTaGFkZXJzKCkpO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgICBnbCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IEdMLkxJTkVfU1RSSVAsXG4gICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICB9KSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0U291cmNlUG9zaXRpb24sIGdldFRhcmdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3Qgc291cmNlUG9zaXRpb24gPSBnZXRTb3VyY2VQb3NpdGlvbihvYmplY3QpO1xuICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSBnZXRUYXJnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gc291cmNlUG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBzb3VyY2VQb3NpdGlvblsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IHRhcmdldFBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSArIDNdID0gdGFyZ2V0UG9zaXRpb25bMV07XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFNvdXJjZUNvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRTb3VyY2VDb2xvcihvYmplY3QpIHx8IERFRkFVTFRfQ09MT1I7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpICsgM10gPSBpc05hTihjb2xvclszXSkgPyBERUZBVUxUX0NPTE9SWzNdIDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFRhcmdldENvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRUYXJnZXRDb2xvcihvYmplY3QpIHx8IERFRkFVTFRfQ09MT1I7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpICsgM10gPSBpc05hTihjb2xvclszXSkgPyBERUZBVUxUX0NPTE9SWzNdIDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG59XG5cbkFyY0xheWVyLmxheWVyTmFtZSA9ICdBcmNMYXllcic7XG5BcmNMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

var _glMatrix = require('gl-matrix');

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

var DEFAULT_COLOR = [255, 255, 255, 0];

/**
 * A generic GridLayer that takes latitude longitude delta of cells as a uniform
 * and the min lat lng of cells. grid can be 3d when pass in a height
 * and set enable3d to true
 *
 * @param {array} props.data -
 * @param {boolean} props.enable3d - enable grid height
 * @param {number} props.latDelta - grid cell size in lat delta
 * @param {number} props.lngDelta - grid cell size in lng delta
 * @param {number} props.opacity - opacity
 * @param {function} props.getPosition - position accessor, returned as [minLng, minLat]
 * @param {function} props.getElevation - elevation accessor
 * @param {function} props.getColor - color accessor, returned as [r, g, b]
 */
var defaultProps = {
  id: 'grid-layer',
  data: [],
  latDelta: 0.0089,
  lngDelta: 0.0113,
  enable3d: true,
  opacity: 0.6,
  getPosition: function getPosition(x) {
    return x.position;
  },
  getElevation: function getElevation(x) {
    return x.height;
  },
  getColor: function getColor(x) {
    return x.color;
  }
};

// viewMatrix added as Uniform for lighting calculation
var viewMatrixCompat = _glMatrix.mat4.create();
_glMatrix.mat4.lookAt(viewMatrixCompat, [0, 0, 0], [0, 0, -1], [0, 1, 0]);
var viewMatrix = new Float32Array(viewMatrixCompat);

var GridLayer = function (_Layer) {
  _inherits(GridLayer, _Layer);

  function GridLayer() {
    _classCallCheck(this, GridLayer);

    return _possibleConstructorReturn(this, (GridLayer.__proto__ || Object.getPrototypeOf(GridLayer)).apply(this, arguments));
  }

  _createClass(GridLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      var vertex = '// Inspired by screen-grid-layer vertex shader in deck.gl\n\n/* vertex shader for the grid-layer */\n#define SHADER_NAME grid-layer-vs\n#define LIGHT_MAX 1\n\nattribute vec3 positions;\nattribute vec3 normals;\n\nattribute vec4 instancePositions;\nattribute vec3 instanceColors;\nattribute vec3 instancePickingColors;\n\n// Picking uniforms\n// Set to 1.0 if rendering picking buffer, 0.0 if rendering for display\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\n// Projection uniforms\nuniform mat4 worldMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 worldInverseTransposeMatrix;\n\n// Custom uniforms\nuniform float enable3d;\nuniform float lngDelta;\nuniform float latDelta;\nuniform float opacity;\n\nuniform float testScale;\n\n// Lighting constants\nconst vec3 ambientColor = vec3(0.8, 0.8, 0.8);\nconst vec3 pointLocation = vec3(1.5, 1.5, 5.);\nconst vec3 pointColor = vec3(0.7, 0.7, 0.7);\nconst vec3 pointSpecularColor = vec3(0.6, 0.6, 0.6);\nconst float shininess = 3.;\nconst float pointLightAmbientCoefficient = 1.;\n\n// A magic number to scale elevation so that 1 unit approximate to 100 meter\n#define ELEVATION_SCALE 80.\n\n// Result\nvarying vec4 vColor;\n\nvoid main(void) {\n\n\n  // cube gemoetry vertics are between -1 to 1, scale and transform it to between 0, 1\n  vec2 ptPosition = instancePositions.xy + vec2((positions.x + 1.0 ) * lngDelta / 2.0, (positions.y + 1.0) * latDelta / 2.0);\n\n  vec2 pos = project_position(ptPosition);\n\n  // if 3d not enabled set elevation to 0\n  float elevation =  mix(0., project_scale(instancePositions.w  * (positions.z + 1.) * ELEVATION_SCALE), enable3d);\n\n  // extrude positions\n  vec3 extrudedPosition = vec3(pos.xy, elevation + 1.);\n\n  float selected = isPicked(instancePickingColors, selectedPickingColor);\n\n  vec3 lightWeighting = getLightWeight(\n    viewMatrix,\n    worldMatrix,\n    worldInverseTransposeMatrix,\n    positions,\n    normals,\n    selected,\n    ambientColor,\n    pointLocation,\n    pointColor,\n    pointSpecularColor,\n    pointLightAmbientCoefficient,\n    shininess\n  );\n\n  vec3 lightWeightedColor = mix(vec3(1), lightWeighting, enable3d) * (instanceColors / 255.0);\n  vec4 color = vec4(lightWeightedColor, opacity);\n\n  vec4 pickingColor = vec4(instancePickingColors / 255.0, 1.);\n\n  vColor = mix(color, pickingColor, renderPickingBuffer);\n\n  gl_Position = project_to_clipspace(vec4(extrudedPosition, 1.0));\n}\n';
      var lighting = '// get lighitng from position normals and lighting config\n\nvec3 getLightWeight(\n  mat4 viewMatrix,\n  mat4 worldMatrix,\n  mat4 worldInverseTransposeMatrix,\n  vec3 positions,\n  vec3 normals,\n  float selected,\n\n  vec3 ambientColor,\n  vec3 pointLocation,\n  vec3 pointColor,\n  vec3 pointSpecularColor,\n  float pointLightAmbientCoefficient,\n  float shininess\n) {\n  vec4 vPosition = worldMatrix * vec4(positions, 1.0);\n  vec4 vTransformedNormal = worldInverseTransposeMatrix * vec4(normals, 1);\n  vec3 normal = vTransformedNormal.xyz;\n  vec3 eyeDirection = normalize(-vPosition.xyz);\n\n  vec3 transformedPointLocation = (viewMatrix * vec4(pointLocation, 1.0)).xyz;\n  vec3 lightDirection = normalize(transformedPointLocation - vPosition.xyz);\n  vec3 reflectionDirection = reflect(-lightDirection, normal);\n\n  float specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), clamp(shininess, 1., 32.));\n  vec3 specularLight = specularLightWeighting * pointSpecularColor;\n\n  float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);\n  vec3 diffuseLight = diffuseLightWeighting * pointColor;\n\n\n  float factor = mix(0., 1., selected);\n  return (ambientColor * pointLightAmbientCoefficient + factor) + diffuseLight + specularLight;\n}\n';
      var picking = '// whether is point picked\nfloat isPicked(vec3 pickingColors, vec3 selectedColor) {\n return float(pickingColors.x == selectedColor.x\n && pickingColors.y == selectedColor.y\n && pickingColors.z == selectedColor.z);\n}\n';
      var vs = picking.concat(lighting).concat(vertex);

      return {
        vs: vs,
        fs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n/* fragment shader for the grid-layer */\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n}\n'
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this._createModel(gl) });

      var attributeManager = this.state.attributeManager;
      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instancePositions: { size: 4, accessor: ['getPosition', 'getElevation'], update: this.calculateInstancePositions },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: '_createModel',
    value: function _createModel(gl) {
      var geometry = new _luma.CubeGeometry({});
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: geometry,
        isInstanced: true
      });
    }
  }, {
    key: 'draw',
    value: function draw(_ref) {
      var uniforms = _ref.uniforms;

      _get(GridLayer.prototype.__proto__ || Object.getPrototypeOf(GridLayer.prototype), 'draw', this).call(this, { uniforms: Object.assign({
          enable3d: this.props.enable3d ? 1 : 0,
          latDelta: this.props.latDelta,
          lngDelta: this.props.lngDelta,
          opacity: this.props.opacity,
          viewMatrix: viewMatrix
        }, uniforms) });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getPosition = _props.getPosition,
          getElevation = _props.getElevation;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var position = getPosition(object);
          var height = getElevation(object) || 0;
          value[i + 0] = position[0];
          value[i + 1] = position[1];
          value[i + 2] = 0;
          value[i + 3] = height;
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
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getColor = _props2.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var color = getColor(object) || DEFAULT_COLOR;
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
  }]);

  return GridLayer;
}(_lib.Layer);

exports.default = GridLayer;


GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9ncmlkLWxheWVyL2dyaWQtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImlkIiwiZGF0YSIsImxhdERlbHRhIiwibG5nRGVsdGEiLCJlbmFibGUzZCIsIm9wYWNpdHkiLCJnZXRQb3NpdGlvbiIsIngiLCJwb3NpdGlvbiIsImdldEVsZXZhdGlvbiIsImhlaWdodCIsImdldENvbG9yIiwiY29sb3IiLCJ2aWV3TWF0cml4Q29tcGF0IiwiY3JlYXRlIiwibG9va0F0Iiwidmlld01hdHJpeCIsIkZsb2F0MzJBcnJheSIsIkdyaWRMYXllciIsInZlcnRleCIsImxpZ2h0aW5nIiwicGlja2luZyIsInZzIiwiY29uY2F0IiwiZnMiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2NyZWF0ZU1vZGVsIiwiYXR0cmlidXRlTWFuYWdlciIsInN0YXRlIiwiYWRkSW5zdGFuY2VkIiwiaW5zdGFuY2VQb3NpdGlvbnMiLCJzaXplIiwiYWNjZXNzb3IiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyIsImluc3RhbmNlQ29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyIsImdlb21ldHJ5Iiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJwcm9wcyIsImlzSW5zdGFuY2VkIiwidW5pZm9ybXMiLCJPYmplY3QiLCJhc3NpZ24iLCJhdHRyaWJ1dGUiLCJ2YWx1ZSIsImkiLCJvYmplY3QiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7OytlQXpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7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Z0I7O0FBQ3pCLGNBQU16QyxRQUFRRCxTQUFTMEMsTUFBVCxLQUFvQnZELGFBQWxDO0FBQ0FxRCxnQkFBTUMsSUFBSSxDQUFWLElBQWV4QyxNQUFNLENBQU4sQ0FBZjtBQUNBdUMsZ0JBQU1DLElBQUksQ0FBVixJQUFleEMsTUFBTSxDQUFOLENBQWY7QUFDQXVDLGdCQUFNQyxJQUFJLENBQVYsSUFBZXhDLE1BQU0sQ0FBTixDQUFmO0FBQ0F1QyxnQkFBTUMsSUFBSSxDQUFWLElBQWVFLE1BQU0xQyxNQUFNLENBQU4sQ0FBTixJQUFrQmQsY0FBYyxDQUFkLENBQWxCLEdBQXFDYyxNQUFNLENBQU4sQ0FBcEQ7QUFDQXdDLGVBQUtsQixJQUFMO0FBQ0Q7QUFYZ0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVlsQzs7Ozs7O2tCQTdFa0JoQixTOzs7QUFnRnJCQSxVQUFVcUMsU0FBVixHQUFzQixXQUF0QjtBQUNBckMsVUFBVW5CLFlBQVYsR0FBeUJBLFlBQXpCIiwiZmlsZSI6ImdyaWQtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IHthc3NlbWJsZVNoYWRlcnN9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgQ3ViZUdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2pvaW59IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHttYXQ0fSBmcm9tICdnbC1tYXRyaXgnO1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzI1NSwgMjU1LCAyNTUsIDBdO1xuXG4vKipcbiAqIEEgZ2VuZXJpYyBHcmlkTGF5ZXIgdGhhdCB0YWtlcyBsYXRpdHVkZSBsb25naXR1ZGUgZGVsdGEgb2YgY2VsbHMgYXMgYSB1bmlmb3JtXG4gKiBhbmQgdGhlIG1pbiBsYXQgbG5nIG9mIGNlbGxzLiBncmlkIGNhbiBiZSAzZCB3aGVuIHBhc3MgaW4gYSBoZWlnaHRcbiAqIGFuZCBzZXQgZW5hYmxlM2QgdG8gdHJ1ZVxuICpcbiAqIEBwYXJhbSB7YXJyYXl9IHByb3BzLmRhdGEgLVxuICogQHBhcmFtIHtib29sZWFufSBwcm9wcy5lbmFibGUzZCAtIGVuYWJsZSBncmlkIGhlaWdodFxuICogQHBhcmFtIHtudW1iZXJ9IHByb3BzLmxhdERlbHRhIC0gZ3JpZCBjZWxsIHNpemUgaW4gbGF0IGRlbHRhXG4gKiBAcGFyYW0ge251bWJlcn0gcHJvcHMubG5nRGVsdGEgLSBncmlkIGNlbGwgc2l6ZSBpbiBsbmcgZGVsdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcm9wcy5vcGFjaXR5IC0gb3BhY2l0eVxuICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvcHMuZ2V0UG9zaXRpb24gLSBwb3NpdGlvbiBhY2Nlc3NvciwgcmV0dXJuZWQgYXMgW21pbkxuZywgbWluTGF0XVxuICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvcHMuZ2V0RWxldmF0aW9uIC0gZWxldmF0aW9uIGFjY2Vzc29yXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9wcy5nZXRDb2xvciAtIGNvbG9yIGFjY2Vzc29yLCByZXR1cm5lZCBhcyBbciwgZywgYl1cbiAqL1xuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBpZDogJ2dyaWQtbGF5ZXInLFxuICBkYXRhOiBbXSxcbiAgbGF0RGVsdGE6IDAuMDA4OSxcbiAgbG5nRGVsdGE6IDAuMDExMyxcbiAgZW5hYmxlM2Q6IHRydWUsXG4gIG9wYWNpdHk6IDAuNixcbiAgZ2V0UG9zaXRpb246IHggPT4geC5wb3NpdGlvbixcbiAgZ2V0RWxldmF0aW9uOiB4ID0+IHguaGVpZ2h0LFxuICBnZXRDb2xvcjogeCA9PiB4LmNvbG9yXG59O1xuXG4vLyB2aWV3TWF0cml4IGFkZGVkIGFzIFVuaWZvcm0gZm9yIGxpZ2h0aW5nIGNhbGN1bGF0aW9uXG5jb25zdCB2aWV3TWF0cml4Q29tcGF0ID0gbWF0NC5jcmVhdGUoKTtcbm1hdDQubG9va0F0KHZpZXdNYXRyaXhDb21wYXQsIFswLCAwLCAwXSwgWzAsIDAsIC0xXSwgWzAsIDEsIDBdKTtcbmNvbnN0IHZpZXdNYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KHZpZXdNYXRyaXhDb21wYXQpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcmlkTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoKSB7XG4gICAgY29uc3QgdmVydGV4ID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9ncmlkLWxheWVyLXZlcnRleC5nbHNsJyksICd1dGY4Jyk7XG4gICAgY29uc3QgbGlnaHRpbmcgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL2xpZ2h0aW5nLmdsc2wnKSwgJ3V0ZjgnKTtcbiAgICBjb25zdCBwaWNraW5nID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9waWNraW5nLmdsc2wnKSwgJ3V0ZjgnKTtcbiAgICBjb25zdCB2cyA9IHBpY2tpbmcuY29uY2F0KGxpZ2h0aW5nKS5jb25jYXQodmVydGV4KTtcblxuICAgIHJldHVybiB7XG4gICAgICB2cyxcbiAgICAgIGZzOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL2dyaWQtbGF5ZXItZnJhZ21lbnQuZ2xzbCcpLCAndXRmOCcpXG4gICAgfTtcbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9jcmVhdGVNb2RlbChnbCl9KTtcblxuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgIGluc3RhbmNlUG9zaXRpb25zOiB7c2l6ZTogNCwgYWNjZXNzb3I6IFsnZ2V0UG9zaXRpb24nLCAnZ2V0RWxldmF0aW9uJ10sIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uc30sXG4gICAgICBpbnN0YW5jZUNvbG9yczoge3NpemU6IDQsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0Q29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnN9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gIH1cblxuICBfY3JlYXRlTW9kZWwoZ2wpIHtcbiAgICBjb25zdCBnZW9tZXRyeSA9IG5ldyBDdWJlR2VvbWV0cnkoe30pO1xuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHJldHVybiBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBzdXBlci5kcmF3KHt1bmlmb3JtczogT2JqZWN0LmFzc2lnbih7XG4gICAgICBlbmFibGUzZDogdGhpcy5wcm9wcy5lbmFibGUzZCA/IDEgOiAwLFxuICAgICAgbGF0RGVsdGE6IHRoaXMucHJvcHMubGF0RGVsdGEsXG4gICAgICBsbmdEZWx0YTogdGhpcy5wcm9wcy5sbmdEZWx0YSxcbiAgICAgIG9wYWNpdHk6IHRoaXMucHJvcHMub3BhY2l0eSxcbiAgICAgIHZpZXdNYXRyaXhcbiAgICB9LCB1bmlmb3Jtcyl9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRQb3NpdGlvbiwgZ2V0RWxldmF0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0RWxldmF0aW9uKG9iamVjdCkgfHwgMDtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IHBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSArIDFdID0gcG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpICsgMl0gPSAwO1xuICAgICAgdmFsdWVbaSArIDNdID0gaGVpZ2h0O1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3Iob2JqZWN0KSB8fCBERUZBVUxUX0NPTE9SO1xuICAgICAgdmFsdWVbaSArIDBdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSArIDNdID0gaXNOYU4oY29sb3JbM10pID8gREVGQVVMVF9DT0xPUlszXSA6IGNvbG9yWzNdO1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxufVxuXG5HcmlkTGF5ZXIubGF5ZXJOYW1lID0gJ0dyaWRMYXllcic7XG5HcmlkTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
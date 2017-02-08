'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _glMatrix = require('gl-matrix');

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

function positionsAreEqual(v1, v2) {
  // Hex positions are expected to change entirely, not to maintain some
  // positions and change others. Right now we only check a single vertex,
  // because H3 guarantees order, but even if that wasn't true, this would only
  // return a false positive for adjacent hexagons, which is close enough for
  // our purposes.
  return v1 === v2 || v1 && v2 && v1[0][0] === v2[0][0] && v1[0][1] === v2[0][1];
}

var defaultProps = {
  id: 'hexagon-layer',
  data: [],
  dotRadius: 1,
  enable3d: true,
  hexagonVertices: null,
  invisibleColor: [0, 0, 0],
  getCentroid: function getCentroid(x) {
    return x.centroid;
  },
  getColor: function getColor(x) {
    return x.color;
  },
  getAlpha: function getAlpha(x) {
    return 255;
  },
  getElevation: function getElevation(x) {
    return x.elevation;
  }
};

// viewMatrix added as Uniform for lighting calculation
var viewMatrixCompat = _glMatrix.mat4.create();
_glMatrix.mat4.lookAt(viewMatrixCompat, [0, 0, 0], [0, 0, -1], [0, 1, 0]);
var viewMatrix = new Float32Array(viewMatrixCompat);

var HexagonLayer = function (_Layer) {
  _inherits(HexagonLayer, _Layer);

  /**
   * @classdesc
   * HexagonLayer is a variation of grid layer, it is intended to render
   * hexagon tessellations. It supports elevation, lighting as well
   *
   * @class
   * @param {object} props
   * @param {number} props.data - all hexagons
   * @param {number} props.dotRadius - hexagon radius multiplier
   * @param {boolean} props.enable3d - if set to false, all hexagons will be flat
   * @param {array} props.hexagonVertices - primitive hexagon vertices as [[lon, lat]]
   * @param {object} props.invisibleColor - hexagon invisible color
   * @param {function} props.getCentroid - hexagon centroid should be formatted as [lon, lat]
   * @param {function} props.getColor -  hexagon color should be formatted as [255, 255, 255]
   * @param {function} props.alpha -  hexagon opacity should be from 0 - 255
   * @param {function} props.getElevation - hexagon elevation 1 unit approximate to 100 meters
   *
   */
  function HexagonLayer(props) {
    _classCallCheck(this, HexagonLayer);

    (0, _assert2.default)(props.hexagonVertices, 'hexagonVertices must be supplied');
    (0, _assert2.default)(props.hexagonVertices.length === 6, 'hexagonVertices should be an array of 6 [lon, lat] paris');
    return _possibleConstructorReturn(this, (HexagonLayer.__proto__ || Object.getPrototypeOf(HexagonLayer)).call(this, props));
  }

  /**
   * DeckGL calls initializeState when GL context is available
   * Essentially a deferred constructor
   */


  _createClass(HexagonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this.getModel(gl) });

      var attributeManager = this.state.attributeManager;
      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instancePositions: { size: 3, accessor: ['getCentroid', 'getElevation'], update: this.calculateInstancePositions },
        instanceColors: { size: 4, type: gl.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */

      this.updateRadiusAngle();
    }
  }, {
    key: 'updateState',
    value: function updateState() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          props = _ref.props,
          oldProps = _ref.oldProps,
          _ref$changeFlags = _ref.changeFlags,
          dataChanged = _ref$changeFlags.dataChanged,
          viewportChanged = _ref$changeFlags.viewportChanged;

      var _state = this.state,
          model = _state.model,
          attributeManager = _state.attributeManager;


      if (dataChanged) {
        attributeManager.invalidateAll();
      }

      // Update the positions in the model if they've changes
      var verticesChanged = !positionsAreEqual(oldProps.hexagonVertices, props.hexagonVertices);

      if (model && (verticesChanged || viewportChanged)) {
        this.updateRadiusAngle();
      }

      this.updateUniforms();
    }
  }, {
    key: 'updateRadiusAngle',
    value: function updateRadiusAngle() {
      var _props = this.props,
          vertices = _props.hexagonVertices,
          dotRadius = _props.dotRadius;


      var vertex0 = vertices[0];
      var vertex3 = vertices[3];

      // transform to space coordinates
      var spaceCoord0 = this.projectFlat(vertex0);
      var spaceCoord3 = this.projectFlat(vertex3);

      // distance between two close centroids
      var dx = spaceCoord0[0] - spaceCoord3[0];
      var dy = spaceCoord0[1] - spaceCoord3[1];
      var dxy = Math.sqrt(dx * dx + dy * dy);

      this.setUniforms({
        // Calculate angle that the perpendicular hexagon vertex axis is tilted
        angle: Math.acos(dx / dxy) * -Math.sign(dy) + Math.PI / 2,
        // Allow user to fine tune radius
        radius: dxy / 2 * Math.max(0, Math.min(1, dotRadius))
      });
    }
  }, {
    key: 'getCylinderGeometry',
    value: function getCylinderGeometry(radius) {
      return new _luma.CylinderGeometry({
        radius: radius,
        topRadius: radius,
        bottomRadius: radius,
        topCap: true,
        bottomCap: true,
        height: 1,
        nradial: 6,
        nvertical: 1
      });
    }
  }, {
    key: 'updateUniforms',
    value: function updateUniforms() {
      var _props2 = this.props,
          opacity = _props2.opacity,
          enable3d = _props2.enable3d,
          invisibleColor = _props2.invisibleColor;

      this.setUniforms({
        enable3d: enable3d ? 1 : 0,
        invisibleColor: invisibleColor,
        opacity: opacity
      });
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      var vertex = '#define SHADER_NAME extruded-hexagon-layer-vs\n\nattribute vec3 positions;\nattribute vec3 normals;\n\nattribute vec3 instancePositions;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\n// Picking uniforms\n// Set to 1.0 if rendering picking buffer, 0.0 if rendering for display\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\n// Projection uniforms\nuniform mat4 worldMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 worldInverseTransposeMatrix;\n\n// Custom uniforms\nuniform float opacity;\nuniform vec3 invisibleColor;\nuniform float radius;\nuniform float angle;\nuniform float enable3d;\n\n// Lighting constants\nconst vec3 ambientColor = vec3(1., 1., 1.);\nconst vec3 pointLocation = vec3(-1., 3., -1.);\nconst vec3 pointColor = vec3(1., 1., 1.);\nconst vec3 pointSpecularColor = vec3(0.6, 0.6, 0.6);\nconst float shininess = 3.;\nconst float pointLightAmbientCoefficient = 0.8;\n\n// Result\nvarying vec4 vColor;\n\n// A magic number to scale elevation so that 1 unit approximate to 100 meter\n#define ELEVATION_SCALE 80.\n\nvoid main(void) {\n\n  // rotate primitive position and normal\n  mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n\n  vec2 rPos = rotationMatrix * positions.xz;\n  vec2 rNorm = rotationMatrix * normals.xz;\n\n  vec3 rotatedPositions = vec3(rPos.x, positions.y, rPos.y);\n  vec3 rotatedNormals = vec3(rNorm.x, normals.y, rNorm.y);\n\n  // calculate elevation, if 3d not enabled set to 0\n  // cylindar gemoetry height are between -0.5 to 0.5, transform it to between 0, 1\n  float elevation =  mix(0., project_scale(instancePositions.z  * (positions.y + 0.5) * ELEVATION_SCALE), enable3d);\n\n  // project center of hexagon\n  vec4 centroidPosition = vec4(project_position(instancePositions.xy), elevation, 0.0);\n\n  gl_Position = project_to_clipspace(centroidPosition + vec4(vec2(rotatedPositions.xz * radius), 0., 1.));\n\n  // check whether hexagon is currently picked\n  float selected = isPicked(instancePickingColors, selectedPickingColor);\n\n  // calculate lighting\n  vec3 lightWeighting = getLightWeight(\n    viewMatrix,\n    worldMatrix,\n    worldInverseTransposeMatrix,\n    rotatedPositions,\n    rotatedNormals,\n    selected,\n    ambientColor,\n    pointLocation,\n    pointColor,\n    pointSpecularColor,\n    pointLightAmbientCoefficient,\n    shininess\n  );\n\n  vec3 lightWeightedColor = mix(vec3(1), lightWeighting, enable3d) * (instanceColors.rgb / 255.0);\n\n  // Hide hexagon if set to invisibleColor\n  float alpha = instanceColors.rgb == invisibleColor ? 0. : opacity;\n\n  // Color: Either opacity-multiplied instance color, or picking color\n  vec4 color = vec4(lightWeightedColor, alpha * instanceColors.a / 255.);\n\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n\n  vColor = mix(color, pickingColor, renderPickingBuffer);\n}\n';
      var lighting = '// get lighitng from position normals and lighting config\n\nvec3 getLightWeight(\n  mat4 viewMatrix,\n  mat4 worldMatrix,\n  mat4 worldInverseTransposeMatrix,\n  vec3 positions,\n  vec3 normals,\n  float selected,\n\n  vec3 ambientColor,\n  vec3 pointLocation,\n  vec3 pointColor,\n  vec3 pointSpecularColor,\n  float pointLightAmbientCoefficient,\n  float shininess\n) {\n  vec4 vPosition = worldMatrix * vec4(positions, 1.0);\n  vec4 vTransformedNormal = worldInverseTransposeMatrix * vec4(normals, 1);\n  vec3 normal = vTransformedNormal.xyz;\n  vec3 eyeDirection = normalize(-vPosition.xyz);\n\n  vec3 transformedPointLocation = (viewMatrix * vec4(pointLocation, 1.0)).xyz;\n  vec3 lightDirection = normalize(transformedPointLocation - vPosition.xyz);\n  vec3 reflectionDirection = reflect(-lightDirection, normal);\n\n  float specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), clamp(shininess, 1., 32.));\n  vec3 specularLight = specularLightWeighting * pointSpecularColor;\n\n  float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);\n  vec3 diffuseLight = diffuseLightWeighting * pointColor;\n\n\n  float factor = mix(0., 1., selected);\n  return (ambientColor * pointLightAmbientCoefficient + factor) + diffuseLight + specularLight;\n}\n';
      var picking = '// whether is point picked\nfloat isPicked(vec3 pickingColors, vec3 selectedColor) {\n return float(pickingColors.x == selectedColor.x\n && pickingColors.y == selectedColor.y\n && pickingColors.z == selectedColor.z);\n}\n';
      var vs = picking.concat(lighting).concat(vertex);

      return {
        vs: vs,
        fs: '// See: npm glsl-shader-name\n#define SHADER_NAME extruded-hexagon-layer-fs\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n}\n'
      };
    }
  }, {
    key: 'getModel',
    value: function getModel(gl) {
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: this.getCylinderGeometry(1),
        isInstanced: true
      });
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;

      _get(HexagonLayer.prototype.__proto__ || Object.getPrototypeOf(HexagonLayer.prototype), 'draw', this).call(this, { uniforms: Object.assign({}, { viewMatrix: viewMatrix }, uniforms) });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getCentroid = _props3.getCentroid,
          getElevation = _props3.getElevation;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var _getCentroid = getCentroid(object),
              _getCentroid2 = _slicedToArray(_getCentroid, 2),
              lon = _getCentroid2[0],
              lat = _getCentroid2[1];

          var elevation = getElevation(object);
          value[i + 0] = lon;
          value[i + 1] = lat;
          value[i + 2] = elevation || this.props.elevation;
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
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor,
          getAlpha = _props4.getAlpha;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var color = getColor(object);
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = getAlpha(object);
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

  return HexagonLayer;
}(_lib.Layer);

exports.default = HexagonLayer;


HexagonLayer.layerName = 'HexagonLayer';
HexagonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9oZXhhZ29uLWxheWVyL2hleGFnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsicG9zaXRpb25zQXJlRXF1YWwiLCJ2MSIsInYyIiwiZGVmYXVsdFByb3BzIiwiaWQiLCJkYXRhIiwiZG90UmFkaXVzIiwiZW5hYmxlM2QiLCJoZXhhZ29uVmVydGljZXMiLCJpbnZpc2libGVDb2xvciIsImdldENlbnRyb2lkIiwieCIsImNlbnRyb2lkIiwiZ2V0Q29sb3IiLCJjb2xvciIsImdldEFscGhhIiwiZ2V0RWxldmF0aW9uIiwiZWxldmF0aW9uIiwidmlld01hdHJpeENvbXBhdCIsImNyZWF0ZSIsImxvb2tBdCIsInZpZXdNYXRyaXgiLCJGbG9hdDMyQXJyYXkiLCJIZXhhZ29uTGF5ZXIiLCJwcm9wcyIsImxlbmd0aCIsImdsIiwiY29udGV4dCIsInNldFN0YXRlIiwibW9kZWwiLCJnZXRNb2RlbCIsImF0dHJpYnV0ZU1hbmFnZXIiLCJzdGF0ZSIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZUNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMiLCJ1cGRhdGVSYWRpdXNBbmdsZSIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJkYXRhQ2hhbmdlZCIsInZpZXdwb3J0Q2hhbmdlZCIsImludmFsaWRhdGVBbGwiLCJ2ZXJ0aWNlc0NoYW5nZWQiLCJ1cGRhdGVVbmlmb3JtcyIsInZlcnRpY2VzIiwidmVydGV4MCIsInZlcnRleDMiLCJzcGFjZUNvb3JkMCIsInByb2plY3RGbGF0Iiwic3BhY2VDb29yZDMiLCJkeCIsImR5IiwiZHh5IiwiTWF0aCIsInNxcnQiLCJzZXRVbmlmb3JtcyIsImFuZ2xlIiwiYWNvcyIsInNpZ24iLCJQSSIsInJhZGl1cyIsIm1heCIsIm1pbiIsInRvcFJhZGl1cyIsImJvdHRvbVJhZGl1cyIsInRvcENhcCIsImJvdHRvbUNhcCIsImhlaWdodCIsIm5yYWRpYWwiLCJudmVydGljYWwiLCJvcGFjaXR5IiwidmVydGV4IiwibGlnaHRpbmciLCJwaWNraW5nIiwidnMiLCJjb25jYXQiLCJmcyIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiZ2VvbWV0cnkiLCJnZXRDeWxpbmRlckdlb21ldHJ5IiwiaXNJbnN0YW5jZWQiLCJ1bmlmb3JtcyIsIk9iamVjdCIsImFzc2lnbiIsImF0dHJpYnV0ZSIsInZhbHVlIiwiaSIsIm9iamVjdCIsImxvbiIsImxhdCIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBb0JBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7OytlQTFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFVQSxTQUFTQSxpQkFBVCxDQUEyQkMsRUFBM0IsRUFBK0JDLEVBQS9CLEVBQW1DO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFPRCxPQUFPQyxFQUFQLElBQ0xELE1BQU1DLEVBQU4sSUFBWUQsR0FBRyxDQUFILEVBQU0sQ0FBTixNQUFhQyxHQUFHLENBQUgsRUFBTSxDQUFOLENBQXpCLElBQXFDRCxHQUFHLENBQUgsRUFBTSxDQUFOLE1BQWFDLEdBQUcsQ0FBSCxFQUFNLENBQU4sQ0FEcEQ7QUFHRDs7QUFFRCxJQUFNQyxlQUFlO0FBQ25CQyxNQUFJLGVBRGU7QUFFbkJDLFFBQU0sRUFGYTtBQUduQkMsYUFBVyxDQUhRO0FBSW5CQyxZQUFVLElBSlM7QUFLbkJDLG1CQUFpQixJQUxFO0FBTW5CQyxrQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FORztBQU9uQkMsZUFBYTtBQUFBLFdBQUtDLEVBQUVDLFFBQVA7QUFBQSxHQVBNO0FBUW5CQyxZQUFVO0FBQUEsV0FBS0YsRUFBRUcsS0FBUDtBQUFBLEdBUlM7QUFTbkJDLFlBQVU7QUFBQSxXQUFLLEdBQUw7QUFBQSxHQVRTO0FBVW5CQyxnQkFBYztBQUFBLFdBQUtMLEVBQUVNLFNBQVA7QUFBQTtBQVZLLENBQXJCOztBQWFBO0FBQ0EsSUFBTUMsbUJBQW1CLGVBQUtDLE1BQUwsRUFBekI7QUFDQSxlQUFLQyxNQUFMLENBQVlGLGdCQUFaLEVBQThCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBQTlCLEVBQXlDLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFDLENBQVIsQ0FBekMsRUFBcUQsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FBckQ7QUFDQSxJQUFNRyxhQUFhLElBQUlDLFlBQUosQ0FBaUJKLGdCQUFqQixDQUFuQjs7SUFFcUJLLFk7OztBQUVuQjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLHdCQUFZQyxLQUFaLEVBQW1CO0FBQUE7O0FBQ2pCLDBCQUFPQSxNQUFNaEIsZUFBYixFQUE4QixrQ0FBOUI7QUFDQSwwQkFBT2dCLE1BQU1oQixlQUFOLENBQXNCaUIsTUFBdEIsS0FBaUMsQ0FBeEMsRUFDSSwwREFESjtBQUZpQix1SEFJWEQsS0FKVztBQUtsQjs7QUFFRDs7Ozs7Ozs7c0NBSWtCO0FBQUEsVUFDVEUsRUFEUyxHQUNILEtBQUtDLE9BREYsQ0FDVEQsRUFEUzs7QUFFaEIsV0FBS0UsUUFBTCxDQUFjLEVBQUNDLE9BQU8sS0FBS0MsUUFBTCxDQUFjSixFQUFkLENBQVIsRUFBZDs7QUFGZ0IsVUFJVEssZ0JBSlMsR0FJVyxLQUFLQyxLQUpoQixDQUlURCxnQkFKUztBQUtoQjs7QUFDQUEsdUJBQWlCRSxZQUFqQixDQUE4QjtBQUM1QkMsMkJBQW1CLEVBQUNDLE1BQU0sQ0FBUCxFQUFVQyxVQUFVLENBQUMsYUFBRCxFQUFnQixjQUFoQixDQUFwQixFQUFxREMsUUFBUSxLQUFLQywwQkFBbEUsRUFEUztBQUU1QkMsd0JBQWdCLEVBQUNKLE1BQU0sQ0FBUCxFQUFVSyxNQUFNZCxHQUFHZSxhQUFuQixFQUFrQ0wsVUFBVSxVQUE1QyxFQUF3REMsUUFBUSxLQUFLSyx1QkFBckU7QUFGWSxPQUE5QjtBQUlBOztBQUVBLFdBQUtDLGlCQUFMO0FBQ0Q7OztrQ0FFZ0Y7QUFBQSxxRkFBSixFQUFJO0FBQUEsVUFBcEVuQixLQUFvRSxRQUFwRUEsS0FBb0U7QUFBQSxVQUE3RG9CLFFBQTZELFFBQTdEQSxRQUE2RDtBQUFBLGtDQUFuREMsV0FBbUQ7QUFBQSxVQUFyQ0MsV0FBcUMsb0JBQXJDQSxXQUFxQztBQUFBLFVBQXhCQyxlQUF3QixvQkFBeEJBLGVBQXdCOztBQUFBLG1CQUM3QyxLQUFLZixLQUR3QztBQUFBLFVBQ3hFSCxLQUR3RSxVQUN4RUEsS0FEd0U7QUFBQSxVQUNqRUUsZ0JBRGlFLFVBQ2pFQSxnQkFEaUU7OztBQUcvRSxVQUFJZSxXQUFKLEVBQWlCO0FBQ2ZmLHlCQUFpQmlCLGFBQWpCO0FBQ0Q7O0FBRUQ7QUFDQSxVQUFNQyxrQkFDSixDQUFDakQsa0JBQWtCNEMsU0FBU3BDLGVBQTNCLEVBQTRDZ0IsTUFBTWhCLGVBQWxELENBREg7O0FBR0EsVUFBSXFCLFVBQVVvQixtQkFBbUJGLGVBQTdCLENBQUosRUFBbUQ7QUFDakQsYUFBS0osaUJBQUw7QUFDRDs7QUFFRCxXQUFLTyxjQUFMO0FBQ0Q7Ozt3Q0FFbUI7QUFBQSxtQkFDNkIsS0FBSzFCLEtBRGxDO0FBQUEsVUFDTTJCLFFBRE4sVUFDWDNDLGVBRFc7QUFBQSxVQUNnQkYsU0FEaEIsVUFDZ0JBLFNBRGhCOzs7QUFHbEIsVUFBTThDLFVBQVVELFNBQVMsQ0FBVCxDQUFoQjtBQUNBLFVBQU1FLFVBQVVGLFNBQVMsQ0FBVCxDQUFoQjs7QUFFQTtBQUNBLFVBQU1HLGNBQWMsS0FBS0MsV0FBTCxDQUFpQkgsT0FBakIsQ0FBcEI7QUFDQSxVQUFNSSxjQUFjLEtBQUtELFdBQUwsQ0FBaUJGLE9BQWpCLENBQXBCOztBQUVBO0FBQ0EsVUFBTUksS0FBS0gsWUFBWSxDQUFaLElBQWlCRSxZQUFZLENBQVosQ0FBNUI7QUFDQSxVQUFNRSxLQUFLSixZQUFZLENBQVosSUFBaUJFLFlBQVksQ0FBWixDQUE1QjtBQUNBLFVBQU1HLE1BQU1DLEtBQUtDLElBQUwsQ0FBVUosS0FBS0EsRUFBTCxHQUFVQyxLQUFLQSxFQUF6QixDQUFaOztBQUVBLFdBQUtJLFdBQUwsQ0FBaUI7QUFDZjtBQUNBQyxlQUFPSCxLQUFLSSxJQUFMLENBQVVQLEtBQUtFLEdBQWYsSUFBc0IsQ0FBQ0MsS0FBS0ssSUFBTCxDQUFVUCxFQUFWLENBQXZCLEdBQXVDRSxLQUFLTSxFQUFMLEdBQVUsQ0FGekM7QUFHZjtBQUNBQyxnQkFBUVIsTUFBTSxDQUFOLEdBQVVDLEtBQUtRLEdBQUwsQ0FBUyxDQUFULEVBQVlSLEtBQUtTLEdBQUwsQ0FBUyxDQUFULEVBQVkvRCxTQUFaLENBQVo7QUFKSCxPQUFqQjtBQU1EOzs7d0NBRW1CNkQsTSxFQUFRO0FBQzFCLGFBQU8sMkJBQXFCO0FBQzFCQSxzQkFEMEI7QUFFMUJHLG1CQUFXSCxNQUZlO0FBRzFCSSxzQkFBY0osTUFIWTtBQUkxQkssZ0JBQVEsSUFKa0I7QUFLMUJDLG1CQUFXLElBTGU7QUFNMUJDLGdCQUFRLENBTmtCO0FBTzFCQyxpQkFBUyxDQVBpQjtBQVExQkMsbUJBQVc7QUFSZSxPQUFyQixDQUFQO0FBVUQ7OztxQ0FFZ0I7QUFBQSxvQkFDNkIsS0FBS3BELEtBRGxDO0FBQUEsVUFDUnFELE9BRFEsV0FDUkEsT0FEUTtBQUFBLFVBQ0N0RSxRQURELFdBQ0NBLFFBREQ7QUFBQSxVQUNXRSxjQURYLFdBQ1dBLGNBRFg7O0FBRWYsV0FBS3FELFdBQUwsQ0FBaUI7QUFDZnZELGtCQUFVQSxXQUFXLENBQVgsR0FBZSxDQURWO0FBRWZFLHNDQUZlO0FBR2ZvRTtBQUhlLE9BQWpCO0FBS0Q7OztpQ0FFWTtBQUNYLFVBQU1DLHMxRkFBTjtBQUNBLFVBQU1DLG94Q0FBTjtBQUNBLFVBQU1DLHlPQUFOO0FBQ0EsVUFBTUMsS0FBS0QsUUFBUUUsTUFBUixDQUFlSCxRQUFmLEVBQXlCRyxNQUF6QixDQUFnQ0osTUFBaEMsQ0FBWDs7QUFFQSxhQUFPO0FBQ0xHLGNBREs7QUFFTEU7QUFGSyxPQUFQO0FBSUQ7Ozs2QkFFUXpELEUsRUFBSTtBQUNYLFVBQU0wRCxVQUFVLGtDQUFnQjFELEVBQWhCLEVBQW9CLEtBQUsyRCxVQUFMLEVBQXBCLENBQWhCOztBQUVBLGFBQU8sZ0JBQVU7QUFDZjNELGNBRGU7QUFFZnRCLFlBQUksS0FBS29CLEtBQUwsQ0FBV3BCLEVBRkE7QUFHZjZFLFlBQUlHLFFBQVFILEVBSEc7QUFJZkUsWUFBSUMsUUFBUUQsRUFKRztBQUtmRyxrQkFBVSxLQUFLQyxtQkFBTCxDQUF5QixDQUF6QixDQUxLO0FBTWZDLHFCQUFhO0FBTkUsT0FBVixDQUFQO0FBUUQ7OztnQ0FFZ0I7QUFBQSxVQUFYQyxRQUFXLFNBQVhBLFFBQVc7O0FBQ2YsdUhBQVcsRUFBQ0EsVUFBVUMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsRUFBQ3RFLHNCQUFELEVBQWxCLEVBQWdDb0UsUUFBaEMsQ0FBWCxFQUFYO0FBQ0Q7OzsrQ0FFMEJHLFMsRUFBVztBQUFBLG9CQUNNLEtBQUtwRSxLQURYO0FBQUEsVUFDN0JuQixJQUQ2QixXQUM3QkEsSUFENkI7QUFBQSxVQUN2QkssV0FEdUIsV0FDdkJBLFdBRHVCO0FBQUEsVUFDVk0sWUFEVSxXQUNWQSxZQURVO0FBQUEsVUFFN0I2RSxLQUY2QixHQUVkRCxTQUZjLENBRTdCQyxLQUY2QjtBQUFBLFVBRXRCMUQsSUFGc0IsR0FFZHlELFNBRmMsQ0FFdEJ6RCxJQUZzQjs7QUFHcEMsVUFBSTJELElBQUksQ0FBUjtBQUhvQztBQUFBO0FBQUE7O0FBQUE7QUFJcEMsNkJBQXFCekYsSUFBckIsOEhBQTJCO0FBQUEsY0FBaEIwRixNQUFnQjs7QUFBQSw2QkFDTnJGLFlBQVlxRixNQUFaLENBRE07QUFBQTtBQUFBLGNBQ2xCQyxHQURrQjtBQUFBLGNBQ2JDLEdBRGE7O0FBRXpCLGNBQU1oRixZQUFZRCxhQUFhK0UsTUFBYixDQUFsQjtBQUNBRixnQkFBTUMsSUFBSSxDQUFWLElBQWVFLEdBQWY7QUFDQUgsZ0JBQU1DLElBQUksQ0FBVixJQUFlRyxHQUFmO0FBQ0FKLGdCQUFNQyxJQUFJLENBQVYsSUFBZTdFLGFBQWEsS0FBS08sS0FBTCxDQUFXUCxTQUF2QztBQUNBNkUsZUFBSzNELElBQUw7QUFDRDtBQVhtQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWXJDOzs7NENBRXVCeUQsUyxFQUFXO0FBQUEsb0JBQ0UsS0FBS3BFLEtBRFA7QUFBQSxVQUMxQm5CLElBRDBCLFdBQzFCQSxJQUQwQjtBQUFBLFVBQ3BCUSxRQURvQixXQUNwQkEsUUFEb0I7QUFBQSxVQUNWRSxRQURVLFdBQ1ZBLFFBRFU7QUFBQSxVQUUxQjhFLEtBRjBCLEdBRVhELFNBRlcsQ0FFMUJDLEtBRjBCO0FBQUEsVUFFbkIxRCxJQUZtQixHQUVYeUQsU0FGVyxDQUVuQnpELElBRm1COztBQUdqQyxVQUFJMkQsSUFBSSxDQUFSO0FBSGlDO0FBQUE7QUFBQTs7QUFBQTtBQUlqQyw4QkFBcUJ6RixJQUFyQixtSUFBMkI7QUFBQSxjQUFoQjBGLE1BQWdCOztBQUN6QixjQUFNakYsUUFBUUQsU0FBU2tGLE1BQVQsQ0FBZDtBQUNBRixnQkFBTUMsSUFBSSxDQUFWLElBQWVoRixNQUFNLENBQU4sQ0FBZjtBQUNBK0UsZ0JBQU1DLElBQUksQ0FBVixJQUFlaEYsTUFBTSxDQUFOLENBQWY7QUFDQStFLGdCQUFNQyxJQUFJLENBQVYsSUFBZWhGLE1BQU0sQ0FBTixDQUFmO0FBQ0ErRSxnQkFBTUMsSUFBSSxDQUFWLElBQWUvRSxTQUFTZ0YsTUFBVCxDQUFmO0FBQ0FELGVBQUszRCxJQUFMO0FBQ0Q7QUFYZ0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVlsQzs7Ozs7O2tCQXBLa0JaLFk7OztBQXVLckJBLGFBQWEyRSxTQUFiLEdBQXlCLGNBQXpCO0FBQ0EzRSxhQUFhcEIsWUFBYixHQUE0QkEsWUFBNUIiLCJmaWxlIjoiaGV4YWdvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7TW9kZWwsIEN5bGluZGVyR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge21hdDR9IGZyb20gJ2dsLW1hdHJpeCc7XG5cbmZ1bmN0aW9uIHBvc2l0aW9uc0FyZUVxdWFsKHYxLCB2Mikge1xuICAvLyBIZXggcG9zaXRpb25zIGFyZSBleHBlY3RlZCB0byBjaGFuZ2UgZW50aXJlbHksIG5vdCB0byBtYWludGFpbiBzb21lXG4gIC8vIHBvc2l0aW9ucyBhbmQgY2hhbmdlIG90aGVycy4gUmlnaHQgbm93IHdlIG9ubHkgY2hlY2sgYSBzaW5nbGUgdmVydGV4LFxuICAvLyBiZWNhdXNlIEgzIGd1YXJhbnRlZXMgb3JkZXIsIGJ1dCBldmVuIGlmIHRoYXQgd2Fzbid0IHRydWUsIHRoaXMgd291bGQgb25seVxuICAvLyByZXR1cm4gYSBmYWxzZSBwb3NpdGl2ZSBmb3IgYWRqYWNlbnQgaGV4YWdvbnMsIHdoaWNoIGlzIGNsb3NlIGVub3VnaCBmb3JcbiAgLy8gb3VyIHB1cnBvc2VzLlxuICByZXR1cm4gdjEgPT09IHYyIHx8IChcbiAgICB2MSAmJiB2MiAmJiB2MVswXVswXSA9PT0gdjJbMF1bMF0gJiYgdjFbMF1bMV0gPT09IHYyWzBdWzFdXG4gICk7XG59XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgaWQ6ICdoZXhhZ29uLWxheWVyJyxcbiAgZGF0YTogW10sXG4gIGRvdFJhZGl1czogMSxcbiAgZW5hYmxlM2Q6IHRydWUsXG4gIGhleGFnb25WZXJ0aWNlczogbnVsbCxcbiAgaW52aXNpYmxlQ29sb3I6IFswLCAwLCAwXSxcbiAgZ2V0Q2VudHJvaWQ6IHggPT4geC5jZW50cm9pZCxcbiAgZ2V0Q29sb3I6IHggPT4geC5jb2xvcixcbiAgZ2V0QWxwaGE6IHggPT4gMjU1LFxuICBnZXRFbGV2YXRpb246IHggPT4geC5lbGV2YXRpb25cbn07XG5cbi8vIHZpZXdNYXRyaXggYWRkZWQgYXMgVW5pZm9ybSBmb3IgbGlnaHRpbmcgY2FsY3VsYXRpb25cbmNvbnN0IHZpZXdNYXRyaXhDb21wYXQgPSBtYXQ0LmNyZWF0ZSgpO1xubWF0NC5sb29rQXQodmlld01hdHJpeENvbXBhdCwgWzAsIDAsIDBdLCBbMCwgMCwgLTFdLCBbMCwgMSwgMF0pO1xuY29uc3Qgdmlld01hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkodmlld01hdHJpeENvbXBhdCk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhleGFnb25MYXllciBleHRlbmRzIExheWVyIHtcblxuICAvKipcbiAgICogQGNsYXNzZGVzY1xuICAgKiBIZXhhZ29uTGF5ZXIgaXMgYSB2YXJpYXRpb24gb2YgZ3JpZCBsYXllciwgaXQgaXMgaW50ZW5kZWQgdG8gcmVuZGVyXG4gICAqIGhleGFnb24gdGVzc2VsbGF0aW9ucy4gSXQgc3VwcG9ydHMgZWxldmF0aW9uLCBsaWdodGluZyBhcyB3ZWxsXG4gICAqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHByb3BzLmRhdGEgLSBhbGwgaGV4YWdvbnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHByb3BzLmRvdFJhZGl1cyAtIGhleGFnb24gcmFkaXVzIG11bHRpcGxpZXJcbiAgICogQHBhcmFtIHtib29sZWFufSBwcm9wcy5lbmFibGUzZCAtIGlmIHNldCB0byBmYWxzZSwgYWxsIGhleGFnb25zIHdpbGwgYmUgZmxhdFxuICAgKiBAcGFyYW0ge2FycmF5fSBwcm9wcy5oZXhhZ29uVmVydGljZXMgLSBwcmltaXRpdmUgaGV4YWdvbiB2ZXJ0aWNlcyBhcyBbW2xvbiwgbGF0XV1cbiAgICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmludmlzaWJsZUNvbG9yIC0gaGV4YWdvbiBpbnZpc2libGUgY29sb3JcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvcHMuZ2V0Q2VudHJvaWQgLSBoZXhhZ29uIGNlbnRyb2lkIHNob3VsZCBiZSBmb3JtYXR0ZWQgYXMgW2xvbiwgbGF0XVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9wcy5nZXRDb2xvciAtICBoZXhhZ29uIGNvbG9yIHNob3VsZCBiZSBmb3JtYXR0ZWQgYXMgWzI1NSwgMjU1LCAyNTVdXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb3BzLmFscGhhIC0gIGhleGFnb24gb3BhY2l0eSBzaG91bGQgYmUgZnJvbSAwIC0gMjU1XG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb3BzLmdldEVsZXZhdGlvbiAtIGhleGFnb24gZWxldmF0aW9uIDEgdW5pdCBhcHByb3hpbWF0ZSB0byAxMDAgbWV0ZXJzXG4gICAqXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIGFzc2VydChwcm9wcy5oZXhhZ29uVmVydGljZXMsICdoZXhhZ29uVmVydGljZXMgbXVzdCBiZSBzdXBwbGllZCcpO1xuICAgIGFzc2VydChwcm9wcy5oZXhhZ29uVmVydGljZXMubGVuZ3RoID09PSA2LFxuICAgICAgICAnaGV4YWdvblZlcnRpY2VzIHNob3VsZCBiZSBhbiBhcnJheSBvZiA2IFtsb24sIGxhdF0gcGFyaXMnKTtcbiAgICBzdXBlcihwcm9wcyk7XG4gIH1cblxuICAvKipcbiAgICogRGVja0dMIGNhbGxzIGluaXRpYWxpemVTdGF0ZSB3aGVuIEdMIGNvbnRleHQgaXMgYXZhaWxhYmxlXG4gICAqIEVzc2VudGlhbGx5IGEgZGVmZXJyZWQgY29uc3RydWN0b3JcbiAgICovXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLmdldE1vZGVsKGdsKX0pO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM6IHtzaXplOiAzLCBhY2Nlc3NvcjogWydnZXRDZW50cm9pZCcsICdnZXRFbGV2YXRpb24nXSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zfSxcbiAgICAgIGluc3RhbmNlQ29sb3JzOiB7c2l6ZTogNCwgdHlwZTogZ2wuVU5TSUdORURfQllURSwgYWNjZXNzb3I6ICdnZXRDb2xvcicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yc31cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cblxuICAgIHRoaXMudXBkYXRlUmFkaXVzQW5nbGUoKTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzOiB7ZGF0YUNoYW5nZWQsIHZpZXdwb3J0Q2hhbmdlZH19ID0ge30pIHtcbiAgICBjb25zdCB7bW9kZWwsIGF0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcblxuICAgIGlmIChkYXRhQ2hhbmdlZCkge1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBwb3NpdGlvbnMgaW4gdGhlIG1vZGVsIGlmIHRoZXkndmUgY2hhbmdlc1xuICAgIGNvbnN0IHZlcnRpY2VzQ2hhbmdlZCA9XG4gICAgICAhcG9zaXRpb25zQXJlRXF1YWwob2xkUHJvcHMuaGV4YWdvblZlcnRpY2VzLCBwcm9wcy5oZXhhZ29uVmVydGljZXMpO1xuXG4gICAgaWYgKG1vZGVsICYmICh2ZXJ0aWNlc0NoYW5nZWQgfHwgdmlld3BvcnRDaGFuZ2VkKSkge1xuICAgICAgdGhpcy51cGRhdGVSYWRpdXNBbmdsZSgpO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG4gIHVwZGF0ZVJhZGl1c0FuZ2xlKCkge1xuICAgIGNvbnN0IHtoZXhhZ29uVmVydGljZXM6IHZlcnRpY2VzLCBkb3RSYWRpdXN9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IHZlcnRleDAgPSB2ZXJ0aWNlc1swXTtcbiAgICBjb25zdCB2ZXJ0ZXgzID0gdmVydGljZXNbM107XG5cbiAgICAvLyB0cmFuc2Zvcm0gdG8gc3BhY2UgY29vcmRpbmF0ZXNcbiAgICBjb25zdCBzcGFjZUNvb3JkMCA9IHRoaXMucHJvamVjdEZsYXQodmVydGV4MCk7XG4gICAgY29uc3Qgc3BhY2VDb29yZDMgPSB0aGlzLnByb2plY3RGbGF0KHZlcnRleDMpO1xuXG4gICAgLy8gZGlzdGFuY2UgYmV0d2VlbiB0d28gY2xvc2UgY2VudHJvaWRzXG4gICAgY29uc3QgZHggPSBzcGFjZUNvb3JkMFswXSAtIHNwYWNlQ29vcmQzWzBdO1xuICAgIGNvbnN0IGR5ID0gc3BhY2VDb29yZDBbMV0gLSBzcGFjZUNvb3JkM1sxXTtcbiAgICBjb25zdCBkeHkgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgdGhpcy5zZXRVbmlmb3Jtcyh7XG4gICAgICAvLyBDYWxjdWxhdGUgYW5nbGUgdGhhdCB0aGUgcGVycGVuZGljdWxhciBoZXhhZ29uIHZlcnRleCBheGlzIGlzIHRpbHRlZFxuICAgICAgYW5nbGU6IE1hdGguYWNvcyhkeCAvIGR4eSkgKiAtTWF0aC5zaWduKGR5KSArIE1hdGguUEkgLyAyLFxuICAgICAgLy8gQWxsb3cgdXNlciB0byBmaW5lIHR1bmUgcmFkaXVzXG4gICAgICByYWRpdXM6IGR4eSAvIDIgKiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBkb3RSYWRpdXMpKVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q3lsaW5kZXJHZW9tZXRyeShyYWRpdXMpIHtcbiAgICByZXR1cm4gbmV3IEN5bGluZGVyR2VvbWV0cnkoe1xuICAgICAgcmFkaXVzLFxuICAgICAgdG9wUmFkaXVzOiByYWRpdXMsXG4gICAgICBib3R0b21SYWRpdXM6IHJhZGl1cyxcbiAgICAgIHRvcENhcDogdHJ1ZSxcbiAgICAgIGJvdHRvbUNhcDogdHJ1ZSxcbiAgICAgIGhlaWdodDogMSxcbiAgICAgIG5yYWRpYWw6IDYsXG4gICAgICBudmVydGljYWw6IDFcbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZVVuaWZvcm1zKCkge1xuICAgIGNvbnN0IHtvcGFjaXR5LCBlbmFibGUzZCwgaW52aXNpYmxlQ29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLnNldFVuaWZvcm1zKHtcbiAgICAgIGVuYWJsZTNkOiBlbmFibGUzZCA/IDEgOiAwLFxuICAgICAgaW52aXNpYmxlQ29sb3IsXG4gICAgICBvcGFjaXR5XG4gICAgfSk7XG4gIH1cblxuICBnZXRTaGFkZXJzKCkge1xuICAgIGNvbnN0IHZlcnRleCA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vaGV4YWdvbi1sYXllci12ZXJ0ZXguZ2xzbCcpLCAndXRmOCcpO1xuICAgIGNvbnN0IGxpZ2h0aW5nID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9saWdodGluZy5nbHNsJyksICd1dGY4Jyk7XG4gICAgY29uc3QgcGlja2luZyA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vcGlja2luZy5nbHNsJyksICd1dGY4Jyk7XG4gICAgY29uc3QgdnMgPSBwaWNraW5nLmNvbmNhdChsaWdodGluZykuY29uY2F0KHZlcnRleCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdnMsXG4gICAgICBmczogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9oZXhhZ29uLWxheWVyLWZyYWdtZW50Lmdsc2wnKSwgJ3V0ZjgnKVxuICAgIH07XG4gIH1cblxuICBnZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHJldHVybiBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogdGhpcy5nZXRDeWxpbmRlckdlb21ldHJ5KDEpLFxuICAgICAgaXNJbnN0YW5jZWQ6IHRydWVcbiAgICB9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIHN1cGVyLmRyYXcoe3VuaWZvcm1zOiBPYmplY3QuYXNzaWduKHt9LCB7dmlld01hdHJpeH0sIHVuaWZvcm1zKX0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldENlbnRyb2lkLCBnZXRFbGV2YXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBbbG9uLCBsYXRdID0gZ2V0Q2VudHJvaWQob2JqZWN0KTtcbiAgICAgIGNvbnN0IGVsZXZhdGlvbiA9IGdldEVsZXZhdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gbG9uO1xuICAgICAgdmFsdWVbaSArIDFdID0gbGF0O1xuICAgICAgdmFsdWVbaSArIDJdID0gZWxldmF0aW9uIHx8IHRoaXMucHJvcHMuZWxldmF0aW9uO1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvciwgZ2V0QWxwaGF9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpICsgM10gPSBnZXRBbHBoYShvYmplY3QpO1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxufVxuXG5IZXhhZ29uTGF5ZXIubGF5ZXJOYW1lID0gJ0hleGFnb25MYXllcic7XG5IZXhhZ29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
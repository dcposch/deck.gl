'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _fp = require('../../../lib/utils/fp64');

var _luma = require('luma.gl');

var _utils = require('../../../lib/utils');

var _earcut = require('earcut');

var _earcut2 = _interopRequireDefault(_earcut);

var _glMatrix = require('gl-matrix');

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var DEFAULT_COLOR = [180, 180, 200];
var DEFAULT_AMBIENT_COLOR = [255, 255, 255];
var DEFAULT_POINTLIGHT_AMBIENT_COEFFICIENT = 0.1;
var DEFAULT_POINTLIGHT_LOCATION = [40.4406, -79.9959, 100];
var DEFAULT_POINTLIGHT_COLOR = [255, 255, 255];
var DEFAULT_POINTLIGHT_ATTENUATION = 1.0;
var DEFAULT_MATERIAL_SPECULAR_COLOR = [255, 255, 255];
var DEFAULT_MATERIAL_SHININESS = 1;

var defaultProps = {
  opacity: 1,
  elevation: 1
};

var ExtrudedChoroplethLayer64 = function (_Layer) {
  _inherits(ExtrudedChoroplethLayer64, _Layer);

  function ExtrudedChoroplethLayer64() {
    _classCallCheck(this, ExtrudedChoroplethLayer64);

    return _possibleConstructorReturn(this, (ExtrudedChoroplethLayer64.__proto__ || Object.getPrototypeOf(ExtrudedChoroplethLayer64)).apply(this, arguments));
  }

  _createClass(ExtrudedChoroplethLayer64, [{
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.state.attributeManager;

      attributeManager.add({
        indices: { size: 1, isIndexed: true, update: this.calculateIndices },
        positions: { size: 4, update: this.calculatePositions },
        heights: { size: 2, update: this.calculateHeights },
        normals: { size: 3, update: this.calculateNormals },
        colors: { size: 4, update: this.calculateColors }
      });

      var gl = this.context.gl;

      this.setState({
        numInstances: 0,
        model: this.getModel(gl)
      });
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var changeFlags = _ref.changeFlags;
      var attributeManager = this.state.attributeManager;

      if (changeFlags.dataChanged) {
        this.extractExtrudedChoropleth();
        attributeManager.invalidateAll();
      }

      var _props = this.props,
          elevation = _props.elevation,
          color = _props.color,
          ambientColor = _props.ambientColor,
          pointLightColor = _props.pointLightColor,
          pointLightLocation = _props.pointLightLocation,
          pointLightAmbientCoefficient = _props.pointLightAmbientCoefficient,
          pointLightAttenuation = _props.pointLightAttenuation,
          materialSpecularColor = _props.materialSpecularColor,
          materialShininess = _props.materialShininess;


      this.setUniforms({
        elevation: Number.isFinite(elevation) ? elevation : 1,
        colors: color || DEFAULT_COLOR,
        uAmbientColor: ambientColor || DEFAULT_AMBIENT_COLOR,
        uPointLightAmbientCoefficient: pointLightAmbientCoefficient || DEFAULT_POINTLIGHT_AMBIENT_COEFFICIENT,
        uPointLightLocation: pointLightLocation || DEFAULT_POINTLIGHT_LOCATION,
        uPointLightColor: pointLightColor || DEFAULT_POINTLIGHT_COLOR,
        uPointLightAttenuation: pointLightAttenuation || DEFAULT_POINTLIGHT_ATTENUATION,
        uMaterialSpecularColor: materialSpecularColor || DEFAULT_MATERIAL_SPECULAR_COLOR,
        uMaterialShininess: materialShininess || DEFAULT_MATERIAL_SHININESS
      });
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;

      this.state.model.render(uniforms);
    }
  }, {
    key: 'pick',
    value: function pick(opts) {
      _get(ExtrudedChoroplethLayer64.prototype.__proto__ || Object.getPrototypeOf(ExtrudedChoroplethLayer64.prototype), 'pick', this).call(this, opts);
      var info = opts.info;

      var index = this.decodePickingColor(info.color);
      var feature = index >= 0 ? this.props.data.features[index] : null;
      info.feature = feature;
      info.object = feature;
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME extruded-choropleths-layer-vertex-shader\n\nattribute vec4 positions;\nattribute vec2 heights;\nattribute vec3 normals;\nuniform vec3 colors;\n\nuniform float opacity;\nuniform float elevation;\n\nuniform vec3 uAmbientColor;\nuniform float uPointLightAmbientCoefficient;\nuniform vec3 uPointLightLocation;\nuniform vec3 uPointLightColor;\nuniform float uPointLightAttenuation;\n\nuniform vec3 uMaterialSpecularColor;\nuniform float uMaterialShininess;\n\nvarying vec4 vColor;\n\nvec3 applyLighting(vec3 position_modelspace, vec3 normal_modelspace, vec3 color) {\n\n  vec3 pointLightLocation_modelspace = vec3(project_position(uPointLightLocation));\n  vec3 lightDirection = normalize(pointLightLocation_modelspace - position_modelspace);\n\n  vec3 ambient = uPointLightAmbientCoefficient * color / 255.0 * uAmbientColor / 255.0;\n\n  float diffuseCoefficient = max(dot(normal_modelspace, lightDirection), 0.0);\n  vec3 diffuse = diffuseCoefficient * uPointLightColor / 255. * color / 255.;\n\n  return ambient + uPointLightAttenuation * diffuse;\n}\n\nvoid main(void) {\n  vec2 projected_xy[2];\n  project_position_fp64(positions, projected_xy);\n  vec2 scaled_height = mul_fp64(heights, vec2(projectionPixelsPerUnit.x * elevation, 0.0));\n\n  vec2 vertex_pos_modelspace[4];\n  vertex_pos_modelspace[0] = projected_xy[0];\n  vertex_pos_modelspace[1] = projected_xy[1];\n  vertex_pos_modelspace[2] = sum_fp64(scaled_height, vec2(1.0, 0.0));\n  vertex_pos_modelspace[3] = vec2(1.0, 0.0);\n\n  gl_Position = project_to_clipspace_fp64(vertex_pos_modelspace);\n\n  vec3 color = applyLighting(\n  \tvec3(\n  \t  vertex_pos_modelspace[0].x,\n  \t  vertex_pos_modelspace[1].x,\n  \t  vertex_pos_modelspace[2].x),\n  \tnormals,\n  \tcolors\n  );\n  vColor = vec4(color, opacity);\n}\n// `;\n',
        fs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n/* fragment shader for the building-layer */\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n}\n// `;\n',
        fp64: true,
        project64: true
      };
    }
  }, {
    key: 'getModel',
    value: function getModel(gl) {
      // Make sure we have 32 bit support
      // TODO - this could be done automatically by luma in "draw"
      // when it detects 32 bit indices
      if (!gl.getExtension('OES_element_index_uint')) {
        throw new Error('Extruded choropleth layer needs 32 bit indices');
      }

      // Buildings are 3d so depth test should be enabled
      // TODO - it is a little heavy handed to have a layer set this
      // Alternatively, check depth test and warn if not set, or add a prop
      // setDepthTest that is on by default.
      gl.enable(_luma.GL.DEPTH_TEST);
      gl.depthFunc(_luma.GL.LEQUAL);

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: this.props.drawWireframe ? _luma.GL.LINES : _luma.GL.TRIANGLES
        }),
        vertexCount: 0,
        isIndexed: true
      });
    }

    // each top vertex is on 3 surfaces
    // each bottom vertex is on 2 surfaces

  }, {
    key: 'calculatePositions',
    value: function calculatePositions(attribute) {
      var _this2 = this;

      var positions = this.state.positions;

      if (!positions) {
        positions = (0, _utils.flatten)(this.state.groupedVertices.map(function (vertices) {
          var topVertices = Array.prototype.concat.apply([], vertices);
          var baseVertices = topVertices.map(function (v) {
            return [v[0], v[1], 0];
          });
          return _this2.props.drawWireframe ? [topVertices, baseVertices] : [topVertices, topVertices, topVertices, baseVertices, baseVertices];
        }));
      }

      attribute.value = new Float32Array(positions.length / 3 * 4);

      for (var i = 0; i < positions.length / 3; i++) {
        var _fp64ify = (0, _fp.fp64ify)(positions[i * 3 + 0]);

        var _fp64ify2 = _slicedToArray(_fp64ify, 2);

        attribute.value[i * 4 + 0] = _fp64ify2[0];
        attribute.value[i * 4 + 1] = _fp64ify2[1];

        var _fp64ify3 = (0, _fp.fp64ify)(positions[i * 3 + 1]);

        var _fp64ify4 = _slicedToArray(_fp64ify3, 2);

        attribute.value[i * 4 + 2] = _fp64ify4[0];
        attribute.value[i * 4 + 3] = _fp64ify4[1];
      }
    }
  }, {
    key: 'calculateHeights',
    value: function calculateHeights(attribute) {
      var _this3 = this;

      var positions = this.state.positions;

      if (!positions) {
        positions = (0, _utils.flatten)(this.state.groupedVertices.map(function (vertices) {
          var topVertices = Array.prototype.concat.apply([], vertices);
          var baseVertices = topVertices.map(function (v) {
            return [v[0], v[1], 0];
          });
          return _this3.props.drawWireframe ? [topVertices, baseVertices] : [topVertices, topVertices, topVertices, baseVertices, baseVertices];
        }));
      }

      attribute.value = new Float32Array(positions.length / 3 * 2);
      for (var i = 0; i < positions.length / 3; i++) {
        var _fp64ify5 = (0, _fp.fp64ify)(positions[i * 3 + 2] + 0.1);

        var _fp64ify6 = _slicedToArray(_fp64ify5, 2);

        attribute.value[i * 2 + 0] = _fp64ify6[0];
        attribute.value[i * 2 + 1] = _fp64ify6[1];
      }
    }
  }, {
    key: 'calculateNormals',
    value: function calculateNormals(attribute) {
      var _this4 = this;

      var up = [0, 1, 0];

      var normals = this.state.groupedVertices.map(function (vertices, buildingIndex) {
        var topNormals = new Array(countVertices(vertices)).fill(up);
        var sideNormals = vertices.map(function (polygon) {
          return _this4.calculateSideNormals(polygon);
        });
        var sideNormalsForward = sideNormals.map(function (n) {
          return n[0];
        });
        var sideNormalsBackward = sideNormals.map(function (n) {
          return n[1];
        });

        return _this4.props.drawWireframe ? [topNormals, topNormals] : [topNormals, sideNormalsForward, sideNormalsBackward, sideNormalsForward, sideNormalsBackward];
      });

      attribute.value = new Float32Array((0, _utils.flatten)(normals));
    }
  }, {
    key: 'calculateSideNormals',
    value: function calculateSideNormals(vertices) {
      var numVertices = vertices.length;
      var normals = [];

      for (var i = 0; i < numVertices - 1; i++) {
        var n = getNormal(vertices[i], vertices[i + 1]);
        normals.push(n);
      }

      return [[].concat(normals, [normals[0]]), [normals[0]].concat(normals)];
    }
  }, {
    key: 'calculateIndices',
    value: function calculateIndices(attribute) {
      var _this5 = this;

      // adjust index offset for multiple buildings
      var multiplier = this.props.drawWireframe ? 2 : 5;
      var offsets = this.state.groupedVertices.reduce(function (acc, vertices) {
        return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + countVertices(vertices) * multiplier]);
      }, [0]);

      var indices = this.state.groupedVertices.map(function (vertices, buildingIndex) {
        return _this5.props.drawWireframe ?
        // 1. get sequentially ordered indices of each building wireframe
        // 2. offset them by the number of indices in previous buildings
        _this5.calculateContourIndices(vertices, offsets[buildingIndex]) :
        // 1. get triangulated indices for the internal areas
        // 2. offset them by the number of indices in previous buildings
        _this5.calculateSurfaceIndices(vertices, offsets[buildingIndex]);
      });

      attribute.value = new Uint32Array((0, _utils.flatten)(indices));
      attribute.target = _luma.GL.ELEMENT_ARRAY_BUFFER;
      this.state.model.setVertexCount(attribute.value.length / attribute.size);
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _this6 = this;

      var colors = this.state.groupedVertices.map(function (vertices, buildingIndex) {
        var color = _this6.props.color;

        var baseColor = Array.isArray(color) ? color[0] : color;
        var topColor = Array.isArray(color) ? color[color.length - 1] : color;
        var numVertices = countVertices(vertices);

        var topColors = new Array(numVertices).fill(topColor);
        var baseColors = new Array(numVertices).fill(baseColor);
        return _this6.props.drawWireframe ? [topColors, baseColors] : [topColors, topColors, topColors, baseColors, baseColors];
      });
      attribute.value = new Float32Array((0, _utils.flatten)(colors));
    }
  }, {
    key: 'extractExtrudedChoropleth',
    value: function extractExtrudedChoropleth() {
      var _this7 = this;

      var data = this.props.data;
      // Generate a flat list of buildings

      this.state.buildings = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var _state$buildings;

          var building = _step.value;
          var properties = building.properties,
              geometry = building.geometry;
          var coordinates = geometry.coordinates,
              type = geometry.type;

          if (!properties.height) {
            properties.height = Math.random() * 1000;
          }
          switch (type) {
            case 'MultiPolygon':
              // Maps to multiple buildings
              var buildings = coordinates.map(function (coords) {
                return { coordinates: coords, properties: properties };
              });
              (_state$buildings = _this7.state.buildings).push.apply(_state$buildings, _toConsumableArray(buildings));
              break;
            case 'Polygon':
              // Maps to a single building
              _this7.state.buildings.push({ coordinates: coordinates, properties: properties });
              break;
            default:
            // We are ignoring Points for now
          }
        };

        for (var _iterator = data.features[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }

        // Generate vertices for the building list
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

      this.state.groupedVertices = this.state.buildings.map(function (building) {
        return building.coordinates.map(function (polygon) {
          return polygon.map(function (coordinate) {
            return [coordinate[0], coordinate[1], building.properties.height || 10];
          });
        });
      });
    }
  }, {
    key: 'calculateContourIndices',
    value: function calculateContourIndices(vertices, offset) {
      var stride = countVertices(vertices);

      return vertices.map(function (polygon) {
        var indices = [offset];
        var numVertices = polygon.length;

        // building top
        // use vertex pairs for GL.LINES => [0, 1, 1, 2, 2, ..., n-1, n-1, 0]
        for (var i = 1; i < numVertices - 1; i++) {
          indices.push(i + offset, i + offset);
        }
        indices.push(offset);

        // building sides
        for (var _i = 0; _i < numVertices - 1; _i++) {
          indices.push(_i + offset, _i + stride + offset);
        }

        offset += numVertices;
        return indices;
      });
    }
  }, {
    key: 'calculateSurfaceIndices',
    value: function calculateSurfaceIndices(vertices, offset) {
      var stride = countVertices(vertices);
      var holes = null;
      var quad = [[0, 1], [0, 3], [1, 2], [1, 2], [0, 3], [1, 4]];

      if (vertices.length > 1) {
        holes = vertices.reduce(function (acc, polygon) {
          return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + polygon.length]);
        }, [0]).slice(1, vertices.length);
      }

      var topIndices = (0, _earcut2.default)((0, _utils.flatten)(vertices), holes, 3).map(function (index) {
        return index + offset;
      });

      var sideIndices = vertices.map(function (polygon) {
        var numVertices = polygon.length;
        // building top
        var indices = [];

        // building sides
        for (var i = 0; i < numVertices - 1; i++) {
          indices.push.apply(indices, _toConsumableArray(drawRectangle(i)));
        }

        offset += numVertices;
        return indices;
      });

      return [topIndices, sideIndices];

      function drawRectangle(i) {
        return quad.map(function (v) {
          return i + v[0] + stride * v[1] + offset;
        });
      }
    }
  }]);

  return ExtrudedChoroplethLayer64;
}(_lib.Layer);

exports.default = ExtrudedChoroplethLayer64;


ExtrudedChoroplethLayer64.layerName = 'ExtrudedChoroplethLayer64';
ExtrudedChoroplethLayer64.defaultProps = defaultProps;

/*
 * helpers
 */
// get normal vector of line segment
function getNormal(p1, p2) {
  if (p1[0] === p2[0] && p1[1] === p2[1]) {
    return [1, 0, 0];
  }

  var degrees2radians = Math.PI / 180;

  var lon1 = degrees2radians * p1[0];
  var lon2 = degrees2radians * p2[0];
  var lat1 = degrees2radians * p1[1];
  var lat2 = degrees2radians * p2[1];

  var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
  var b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

  return _glMatrix.vec3.normalize([], [b, 0, -a]);
}

// count number of vertices in geojson polygon
function countVertices(vertices) {
  return vertices.reduce(function (count, polygon) {
    return count + polygon.length;
  }, 0);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9leHRydWRlZC1jaG9yb3BsZXRoLWxheWVyLTY0L2V4dHJ1ZGVkLWNob3JvcGxldGgtbGF5ZXItNjQuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsIkRFRkFVTFRfQU1CSUVOVF9DT0xPUiIsIkRFRkFVTFRfUE9JTlRMSUdIVF9BTUJJRU5UX0NPRUZGSUNJRU5UIiwiREVGQVVMVF9QT0lOVExJR0hUX0xPQ0FUSU9OIiwiREVGQVVMVF9QT0lOVExJR0hUX0NPTE9SIiwiREVGQVVMVF9QT0lOVExJR0hUX0FUVEVOVUFUSU9OIiwiREVGQVVMVF9NQVRFUklBTF9TUEVDVUxBUl9DT0xPUiIsIkRFRkFVTFRfTUFURVJJQUxfU0hJTklORVNTIiwiZGVmYXVsdFByb3BzIiwib3BhY2l0eSIsImVsZXZhdGlvbiIsIkV4dHJ1ZGVkQ2hvcm9wbGV0aExheWVyNjQiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGQiLCJpbmRpY2VzIiwic2l6ZSIsImlzSW5kZXhlZCIsInVwZGF0ZSIsImNhbGN1bGF0ZUluZGljZXMiLCJwb3NpdGlvbnMiLCJjYWxjdWxhdGVQb3NpdGlvbnMiLCJoZWlnaHRzIiwiY2FsY3VsYXRlSGVpZ2h0cyIsIm5vcm1hbHMiLCJjYWxjdWxhdGVOb3JtYWxzIiwiY29sb3JzIiwiY2FsY3VsYXRlQ29sb3JzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJudW1JbnN0YW5jZXMiLCJtb2RlbCIsImdldE1vZGVsIiwiY2hhbmdlRmxhZ3MiLCJkYXRhQ2hhbmdlZCIsImV4dHJhY3RFeHRydWRlZENob3JvcGxldGgiLCJpbnZhbGlkYXRlQWxsIiwicHJvcHMiLCJjb2xvciIsImFtYmllbnRDb2xvciIsInBvaW50TGlnaHRDb2xvciIsInBvaW50TGlnaHRMb2NhdGlvbiIsInBvaW50TGlnaHRBbWJpZW50Q29lZmZpY2llbnQiLCJwb2ludExpZ2h0QXR0ZW51YXRpb24iLCJtYXRlcmlhbFNwZWN1bGFyQ29sb3IiLCJtYXRlcmlhbFNoaW5pbmVzcyIsInNldFVuaWZvcm1zIiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJ1QW1iaWVudENvbG9yIiwidVBvaW50TGlnaHRBbWJpZW50Q29lZmZpY2llbnQiLCJ1UG9pbnRMaWdodExvY2F0aW9uIiwidVBvaW50TGlnaHRDb2xvciIsInVQb2ludExpZ2h0QXR0ZW51YXRpb24iLCJ1TWF0ZXJpYWxTcGVjdWxhckNvbG9yIiwidU1hdGVyaWFsU2hpbmluZXNzIiwidW5pZm9ybXMiLCJyZW5kZXIiLCJvcHRzIiwiaW5mbyIsImluZGV4IiwiZGVjb2RlUGlja2luZ0NvbG9yIiwiZmVhdHVyZSIsImRhdGEiLCJmZWF0dXJlcyIsIm9iamVjdCIsInZzIiwiZnMiLCJmcDY0IiwicHJvamVjdDY0IiwiZ2V0RXh0ZW5zaW9uIiwiRXJyb3IiLCJlbmFibGUiLCJERVBUSF9URVNUIiwiZGVwdGhGdW5jIiwiTEVRVUFMIiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJpZCIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJkcmF3V2lyZWZyYW1lIiwiTElORVMiLCJUUklBTkdMRVMiLCJ2ZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZSIsImdyb3VwZWRWZXJ0aWNlcyIsIm1hcCIsInRvcFZlcnRpY2VzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjb25jYXQiLCJhcHBseSIsInZlcnRpY2VzIiwiYmFzZVZlcnRpY2VzIiwidiIsInZhbHVlIiwiRmxvYXQzMkFycmF5IiwibGVuZ3RoIiwiaSIsInVwIiwiYnVpbGRpbmdJbmRleCIsInRvcE5vcm1hbHMiLCJjb3VudFZlcnRpY2VzIiwiZmlsbCIsInNpZGVOb3JtYWxzIiwiY2FsY3VsYXRlU2lkZU5vcm1hbHMiLCJwb2x5Z29uIiwic2lkZU5vcm1hbHNGb3J3YXJkIiwibiIsInNpZGVOb3JtYWxzQmFja3dhcmQiLCJudW1WZXJ0aWNlcyIsImdldE5vcm1hbCIsInB1c2giLCJtdWx0aXBsaWVyIiwib2Zmc2V0cyIsInJlZHVjZSIsImFjYyIsImNhbGN1bGF0ZUNvbnRvdXJJbmRpY2VzIiwiY2FsY3VsYXRlU3VyZmFjZUluZGljZXMiLCJVaW50MzJBcnJheSIsInRhcmdldCIsIkVMRU1FTlRfQVJSQVlfQlVGRkVSIiwic2V0VmVydGV4Q291bnQiLCJiYXNlQ29sb3IiLCJpc0FycmF5IiwidG9wQ29sb3IiLCJ0b3BDb2xvcnMiLCJiYXNlQ29sb3JzIiwiYnVpbGRpbmdzIiwiYnVpbGRpbmciLCJwcm9wZXJ0aWVzIiwiY29vcmRpbmF0ZXMiLCJ0eXBlIiwiaGVpZ2h0IiwiTWF0aCIsInJhbmRvbSIsImNvb3JkcyIsImNvb3JkaW5hdGUiLCJvZmZzZXQiLCJzdHJpZGUiLCJob2xlcyIsInF1YWQiLCJzbGljZSIsInRvcEluZGljZXMiLCJzaWRlSW5kaWNlcyIsImRyYXdSZWN0YW5nbGUiLCJsYXllck5hbWUiLCJwMSIsInAyIiwiZGVncmVlczJyYWRpYW5zIiwiUEkiLCJsb24xIiwibG9uMiIsImxhdDEiLCJsYXQyIiwiYSIsInNpbiIsImNvcyIsImIiLCJub3JtYWxpemUiLCJjb3VudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBb0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7K2VBNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVlBLElBQU1BLGdCQUFnQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQUF0QjtBQUNBLElBQU1DLHdCQUF3QixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQUE5QjtBQUNBLElBQU1DLHlDQUF5QyxHQUEvQztBQUNBLElBQU1DLDhCQUE4QixDQUFDLE9BQUQsRUFBVSxDQUFDLE9BQVgsRUFBb0IsR0FBcEIsQ0FBcEM7QUFDQSxJQUFNQywyQkFBMkIsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgs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RUFBZixFQUFtQixDQUFDRCxDQUFELEVBQUksQ0FBSixFQUFPLENBQUNILENBQVIsQ0FBbkIsQ0FBUDtBQUNEOztBQUVEO0FBQ0EsU0FBU3JELGFBQVQsQ0FBdUJWLFFBQXZCLEVBQWlDO0FBQy9CLFNBQU9BLFNBQVN1QixNQUFULENBQWdCLFVBQUM2QyxLQUFELEVBQVF0RCxPQUFSO0FBQUEsV0FBb0JzRCxRQUFRdEQsUUFBUVQsTUFBcEM7QUFBQSxHQUFoQixFQUE0RCxDQUE1RCxDQUFQO0FBQ0QiLCJmaWxlIjoiZXh0cnVkZWQtY2hvcm9wbGV0aC1sYXllci02NC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7ZnA2NGlmeX0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzL2ZwNjQnO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7ZmxhdHRlbn0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzJztcbmltcG9ydCBlYXJjdXQgZnJvbSAnZWFyY3V0JztcbmltcG9ydCB7dmVjM30gZnJvbSAnZ2wtbWF0cml4JztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2pvaW59IGZyb20gJ3BhdGgnO1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzE4MCwgMTgwLCAyMDBdO1xuY29uc3QgREVGQVVMVF9BTUJJRU5UX0NPTE9SID0gWzI1NSwgMjU1LCAyNTVdO1xuY29uc3QgREVGQVVMVF9QT0lOVExJR0hUX0FNQklFTlRfQ09FRkZJQ0lFTlQgPSAwLjE7XG5jb25zdCBERUZBVUxUX1BPSU5UTElHSFRfTE9DQVRJT04gPSBbNDAuNDQwNiwgLTc5Ljk5NTksIDEwMF07XG5jb25zdCBERUZBVUxUX1BPSU5UTElHSFRfQ09MT1IgPSBbMjU1LCAyNTUsIDI1NV07XG5jb25zdCBERUZBVUxUX1BPSU5UTElHSFRfQVRURU5VQVRJT04gPSAxLjA7XG5jb25zdCBERUZBVUxUX01BVEVSSUFMX1NQRUNVTEFSX0NPTE9SID0gWzI1NSwgMjU1LCAyNTVdO1xuY29uc3QgREVGQVVMVF9NQVRFUklBTF9TSElOSU5FU1MgPSAxO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIG9wYWNpdHk6IDEsXG4gIGVsZXZhdGlvbjogMVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXh0cnVkZWRDaG9yb3BsZXRoTGF5ZXI2NCBleHRlbmRzIExheWVyIHtcbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGQoe1xuICAgICAgaW5kaWNlczoge3NpemU6IDEsIGlzSW5kZXhlZDogdHJ1ZSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluZGljZXN9LFxuICAgICAgcG9zaXRpb25zOiB7c2l6ZTogNCwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVBvc2l0aW9uc30sXG4gICAgICBoZWlnaHRzOiB7c2l6ZTogMiwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUhlaWdodHN9LFxuICAgICAgbm9ybWFsczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVOb3JtYWxzfSxcbiAgICAgIGNvbG9yczoge3NpemU6IDQsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVDb2xvcnN9XG4gICAgfSk7XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbnVtSW5zdGFuY2VzOiAwLFxuICAgICAgbW9kZWw6IHRoaXMuZ2V0TW9kZWwoZ2wpXG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7Y2hhbmdlRmxhZ3N9KSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQpIHtcbiAgICAgIHRoaXMuZXh0cmFjdEV4dHJ1ZGVkQ2hvcm9wbGV0aCgpO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgZWxldmF0aW9uLFxuICAgICAgY29sb3IsIGFtYmllbnRDb2xvciwgcG9pbnRMaWdodENvbG9yLFxuICAgICAgcG9pbnRMaWdodExvY2F0aW9uLCBwb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50LFxuICAgICAgcG9pbnRMaWdodEF0dGVudWF0aW9uLCBtYXRlcmlhbFNwZWN1bGFyQ29sb3IsIG1hdGVyaWFsU2hpbmluZXNzXG4gICAgfSA9IHRoaXMucHJvcHM7XG5cbiAgICB0aGlzLnNldFVuaWZvcm1zKHtcbiAgICAgIGVsZXZhdGlvbjogTnVtYmVyLmlzRmluaXRlKGVsZXZhdGlvbikgPyBlbGV2YXRpb24gOiAxLFxuICAgICAgY29sb3JzOiBjb2xvciB8fCBERUZBVUxUX0NPTE9SLFxuICAgICAgdUFtYmllbnRDb2xvcjogYW1iaWVudENvbG9yIHx8IERFRkFVTFRfQU1CSUVOVF9DT0xPUixcbiAgICAgIHVQb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50OlxuICAgICAgICBwb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50IHx8IERFRkFVTFRfUE9JTlRMSUdIVF9BTUJJRU5UX0NPRUZGSUNJRU5ULFxuICAgICAgdVBvaW50TGlnaHRMb2NhdGlvbjogcG9pbnRMaWdodExvY2F0aW9uIHx8IERFRkFVTFRfUE9JTlRMSUdIVF9MT0NBVElPTixcbiAgICAgIHVQb2ludExpZ2h0Q29sb3I6IHBvaW50TGlnaHRDb2xvciB8fCBERUZBVUxUX1BPSU5UTElHSFRfQ09MT1IsXG4gICAgICB1UG9pbnRMaWdodEF0dGVudWF0aW9uOiBwb2ludExpZ2h0QXR0ZW51YXRpb24gfHwgREVGQVVMVF9QT0lOVExJR0hUX0FUVEVOVUFUSU9OLFxuICAgICAgdU1hdGVyaWFsU3BlY3VsYXJDb2xvcjogbWF0ZXJpYWxTcGVjdWxhckNvbG9yIHx8IERFRkFVTFRfTUFURVJJQUxfU1BFQ1VMQVJfQ09MT1IsXG4gICAgICB1TWF0ZXJpYWxTaGluaW5lc3M6IG1hdGVyaWFsU2hpbmluZXNzIHx8IERFRkFVTFRfTUFURVJJQUxfU0hJTklORVNTXG4gICAgfSk7XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcih1bmlmb3Jtcyk7XG4gIH1cblxuICBwaWNrKG9wdHMpIHtcbiAgICBzdXBlci5waWNrKG9wdHMpO1xuICAgIGNvbnN0IHtpbmZvfSA9IG9wdHM7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmRlY29kZVBpY2tpbmdDb2xvcihpbmZvLmNvbG9yKTtcbiAgICBjb25zdCBmZWF0dXJlID0gaW5kZXggPj0gMCA/IHRoaXMucHJvcHMuZGF0YS5mZWF0dXJlc1tpbmRleF0gOiBudWxsO1xuICAgIGluZm8uZmVhdHVyZSA9IGZlYXR1cmU7XG4gICAgaW5mby5vYmplY3QgPSBmZWF0dXJlO1xuICB9XG5cbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vZXh0cnVkZWQtY2hvcm9wbGV0aC1sYXllci12ZXJ0ZXguZ2xzbCcpLCAndXRmOCcpLFxuICAgICAgZnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vZXh0cnVkZWQtY2hvcm9wbGV0aC1sYXllci1mcmFnbWVudC5nbHNsJyksICd1dGY4JyksXG4gICAgICBmcDY0OiB0cnVlLFxuICAgICAgcHJvamVjdDY0OiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIGdldE1vZGVsKGdsKSB7XG4gICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgMzIgYml0IHN1cHBvcnRcbiAgICAvLyBUT0RPIC0gdGhpcyBjb3VsZCBiZSBkb25lIGF1dG9tYXRpY2FsbHkgYnkgbHVtYSBpbiBcImRyYXdcIlxuICAgIC8vIHdoZW4gaXQgZGV0ZWN0cyAzMiBiaXQgaW5kaWNlc1xuICAgIGlmICghZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfZWxlbWVudF9pbmRleF91aW50JykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXh0cnVkZWQgY2hvcm9wbGV0aCBsYXllciBuZWVkcyAzMiBiaXQgaW5kaWNlcycpO1xuICAgIH1cblxuICAgIC8vIEJ1aWxkaW5ncyBhcmUgM2Qgc28gZGVwdGggdGVzdCBzaG91bGQgYmUgZW5hYmxlZFxuICAgIC8vIFRPRE8gLSBpdCBpcyBhIGxpdHRsZSBoZWF2eSBoYW5kZWQgdG8gaGF2ZSBhIGxheWVyIHNldCB0aGlzXG4gICAgLy8gQWx0ZXJuYXRpdmVseSwgY2hlY2sgZGVwdGggdGVzdCBhbmQgd2FybiBpZiBub3Qgc2V0LCBvciBhZGQgYSBwcm9wXG4gICAgLy8gc2V0RGVwdGhUZXN0IHRoYXQgaXMgb24gYnkgZGVmYXVsdC5cbiAgICBnbC5lbmFibGUoR0wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZGVwdGhGdW5jKEdMLkxFUVVBTCk7XG5cbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKHtcbiAgICAgIGdsLFxuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGZzOiBzaGFkZXJzLmZzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGRyYXdNb2RlOiB0aGlzLnByb3BzLmRyYXdXaXJlZnJhbWUgPyBHTC5MSU5FUyA6IEdMLlRSSUFOR0xFU1xuICAgICAgfSksXG4gICAgICB2ZXJ0ZXhDb3VudDogMCxcbiAgICAgIGlzSW5kZXhlZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgLy8gZWFjaCB0b3AgdmVydGV4IGlzIG9uIDMgc3VyZmFjZXNcbiAgLy8gZWFjaCBib3R0b20gdmVydGV4IGlzIG9uIDIgc3VyZmFjZXNcbiAgY2FsY3VsYXRlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGxldCB7cG9zaXRpb25zfSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKCFwb3NpdGlvbnMpIHtcbiAgICAgIHBvc2l0aW9ucyA9IGZsYXR0ZW4odGhpcy5zdGF0ZS5ncm91cGVkVmVydGljZXMubWFwKFxuICAgICAgICB2ZXJ0aWNlcyA9PiB7XG4gICAgICAgICAgY29uc3QgdG9wVmVydGljZXMgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCB2ZXJ0aWNlcyk7XG4gICAgICAgICAgY29uc3QgYmFzZVZlcnRpY2VzID0gdG9wVmVydGljZXMubWFwKHYgPT4gW3ZbMF0sIHZbMV0sIDBdKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5kcmF3V2lyZWZyYW1lID8gW3RvcFZlcnRpY2VzLCBiYXNlVmVydGljZXNdIDpcbiAgICAgICAgICAgIFt0b3BWZXJ0aWNlcywgdG9wVmVydGljZXMsIHRvcFZlcnRpY2VzLCBiYXNlVmVydGljZXMsIGJhc2VWZXJ0aWNlc107XG4gICAgICAgIH1cbiAgICAgICkpO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zLmxlbmd0aCAvIDMgKiA0KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zLmxlbmd0aCAvIDM7IGkrKykge1xuICAgICAgW2F0dHJpYnV0ZS52YWx1ZVtpICogNCArIDBdLCBhdHRyaWJ1dGUudmFsdWVbaSAqIDQgKyAxXV0gPSBmcDY0aWZ5KHBvc2l0aW9uc1tpICogMyArIDBdKTtcbiAgICAgIFthdHRyaWJ1dGUudmFsdWVbaSAqIDQgKyAyXSwgYXR0cmlidXRlLnZhbHVlW2kgKiA0ICsgM11dID0gZnA2NGlmeShwb3NpdGlvbnNbaSAqIDMgKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSGVpZ2h0cyhhdHRyaWJ1dGUpIHtcbiAgICBsZXQge3Bvc2l0aW9uc30gPSB0aGlzLnN0YXRlO1xuICAgIGlmICghcG9zaXRpb25zKSB7XG4gICAgICBwb3NpdGlvbnMgPSBmbGF0dGVuKHRoaXMuc3RhdGUuZ3JvdXBlZFZlcnRpY2VzLm1hcChcbiAgICAgICAgdmVydGljZXMgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvcFZlcnRpY2VzID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgdmVydGljZXMpO1xuICAgICAgICAgIGNvbnN0IGJhc2VWZXJ0aWNlcyA9IHRvcFZlcnRpY2VzLm1hcCh2ID0+IFt2WzBdLCB2WzFdLCAwXSk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZHJhd1dpcmVmcmFtZSA/IFt0b3BWZXJ0aWNlcywgYmFzZVZlcnRpY2VzXSA6XG4gICAgICAgICAgICBbdG9wVmVydGljZXMsIHRvcFZlcnRpY2VzLCB0b3BWZXJ0aWNlcywgYmFzZVZlcnRpY2VzLCBiYXNlVmVydGljZXNdO1xuICAgICAgICB9XG4gICAgICApKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucy5sZW5ndGggLyAzICogMik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3NpdGlvbnMubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgICBbYXR0cmlidXRlLnZhbHVlW2kgKiAyICsgMF0sIGF0dHJpYnV0ZS52YWx1ZVtpICogMiArIDFdXSA9XG4gICAgICAgZnA2NGlmeShwb3NpdGlvbnNbaSAqIDMgKyAyXSArIDAuMSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlTm9ybWFscyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB1cCA9IFswLCAxLCAwXTtcblxuICAgIGNvbnN0IG5vcm1hbHMgPSB0aGlzLnN0YXRlLmdyb3VwZWRWZXJ0aWNlcy5tYXAoXG4gICAgICAodmVydGljZXMsIGJ1aWxkaW5nSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdG9wTm9ybWFscyA9IG5ldyBBcnJheShjb3VudFZlcnRpY2VzKHZlcnRpY2VzKSkuZmlsbCh1cCk7XG4gICAgICAgIGNvbnN0IHNpZGVOb3JtYWxzID0gdmVydGljZXMubWFwKHBvbHlnb24gPT5cbiAgICAgICAgICB0aGlzLmNhbGN1bGF0ZVNpZGVOb3JtYWxzKHBvbHlnb24pKTtcbiAgICAgICAgY29uc3Qgc2lkZU5vcm1hbHNGb3J3YXJkID0gc2lkZU5vcm1hbHMubWFwKG4gPT4gblswXSk7XG4gICAgICAgIGNvbnN0IHNpZGVOb3JtYWxzQmFja3dhcmQgPSBzaWRlTm9ybWFscy5tYXAobiA9PiBuWzFdKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5kcmF3V2lyZWZyYW1lID8gW3RvcE5vcm1hbHMsIHRvcE5vcm1hbHNdIDpcbiAgICAgICAgW3RvcE5vcm1hbHMsIHNpZGVOb3JtYWxzRm9yd2FyZCwgc2lkZU5vcm1hbHNCYWNrd2FyZCxcbiAgICAgICAgICBzaWRlTm9ybWFsc0ZvcndhcmQsIHNpZGVOb3JtYWxzQmFja3dhcmRdO1xuICAgICAgfVxuICAgICk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KGZsYXR0ZW4obm9ybWFscykpO1xuICB9XG5cbiAgY2FsY3VsYXRlU2lkZU5vcm1hbHModmVydGljZXMpIHtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHZlcnRpY2VzLmxlbmd0aDtcbiAgICBjb25zdCBub3JtYWxzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVZlcnRpY2VzIC0gMTsgaSsrKSB7XG4gICAgICBjb25zdCBuID0gZ2V0Tm9ybWFsKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tpICsgMV0pO1xuICAgICAgbm9ybWFscy5wdXNoKG4pO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICBbLi4ubm9ybWFscywgbm9ybWFsc1swXV0sXG4gICAgICBbbm9ybWFsc1swXSwgLi4ubm9ybWFsc11cbiAgICBdO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5kaWNlcyhhdHRyaWJ1dGUpIHtcbiAgICAvLyBhZGp1c3QgaW5kZXggb2Zmc2V0IGZvciBtdWx0aXBsZSBidWlsZGluZ3NcbiAgICBjb25zdCBtdWx0aXBsaWVyID0gdGhpcy5wcm9wcy5kcmF3V2lyZWZyYW1lID8gMiA6IDU7XG4gICAgY29uc3Qgb2Zmc2V0cyA9IHRoaXMuc3RhdGUuZ3JvdXBlZFZlcnRpY2VzLnJlZHVjZShcbiAgICAgIChhY2MsIHZlcnRpY2VzKSA9PlxuICAgICAgICBbLi4uYWNjLCBhY2NbYWNjLmxlbmd0aCAtIDFdICsgY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcykgKiBtdWx0aXBsaWVyXSxcbiAgICAgIFswXVxuICAgICk7XG5cbiAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5zdGF0ZS5ncm91cGVkVmVydGljZXMubWFwKFxuICAgICAgKHZlcnRpY2VzLCBidWlsZGluZ0luZGV4KSA9PiB0aGlzLnByb3BzLmRyYXdXaXJlZnJhbWUgP1xuICAgICAgICAvLyAxLiBnZXQgc2VxdWVudGlhbGx5IG9yZGVyZWQgaW5kaWNlcyBvZiBlYWNoIGJ1aWxkaW5nIHdpcmVmcmFtZVxuICAgICAgICAvLyAyLiBvZmZzZXQgdGhlbSBieSB0aGUgbnVtYmVyIG9mIGluZGljZXMgaW4gcHJldmlvdXMgYnVpbGRpbmdzXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlQ29udG91ckluZGljZXModmVydGljZXMsIG9mZnNldHNbYnVpbGRpbmdJbmRleF0pIDpcbiAgICAgICAgLy8gMS4gZ2V0IHRyaWFuZ3VsYXRlZCBpbmRpY2VzIGZvciB0aGUgaW50ZXJuYWwgYXJlYXNcbiAgICAgICAgLy8gMi4gb2Zmc2V0IHRoZW0gYnkgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHByZXZpb3VzIGJ1aWxkaW5nc1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXRzW2J1aWxkaW5nSW5kZXhdKVxuICAgICk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgVWludDMyQXJyYXkoZmxhdHRlbihpbmRpY2VzKSk7XG4gICAgYXR0cmlidXRlLnRhcmdldCA9IEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSO1xuICAgIHRoaXMuc3RhdGUubW9kZWwuc2V0VmVydGV4Q291bnQoYXR0cmlidXRlLnZhbHVlLmxlbmd0aCAvIGF0dHJpYnV0ZS5zaXplKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCBjb2xvcnMgPSB0aGlzLnN0YXRlLmdyb3VwZWRWZXJ0aWNlcy5tYXAoXG4gICAgICAodmVydGljZXMsIGJ1aWxkaW5nSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qge2NvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IGJhc2VDb2xvciA9IEFycmF5LmlzQXJyYXkoY29sb3IpID8gY29sb3JbMF0gOiBjb2xvcjtcbiAgICAgICAgY29uc3QgdG9wQ29sb3IgPSBBcnJheS5pc0FycmF5KGNvbG9yKSA/XG4gICAgICAgICAgY29sb3JbY29sb3IubGVuZ3RoIC0gMV0gOiBjb2xvcjtcbiAgICAgICAgY29uc3QgbnVtVmVydGljZXMgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcblxuICAgICAgICBjb25zdCB0b3BDb2xvcnMgPSBuZXcgQXJyYXkobnVtVmVydGljZXMpLmZpbGwodG9wQ29sb3IpO1xuICAgICAgICBjb25zdCBiYXNlQ29sb3JzID0gbmV3IEFycmF5KG51bVZlcnRpY2VzKS5maWxsKGJhc2VDb2xvcik7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzLmRyYXdXaXJlZnJhbWUgPyBbdG9wQ29sb3JzLCBiYXNlQ29sb3JzXSA6XG4gICAgICAgICAgW3RvcENvbG9ycywgdG9wQ29sb3JzLCB0b3BDb2xvcnMsIGJhc2VDb2xvcnMsIGJhc2VDb2xvcnNdO1xuICAgICAgfVxuICAgICk7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheShmbGF0dGVuKGNvbG9ycykpO1xuICB9XG5cbiAgZXh0cmFjdEV4dHJ1ZGVkQ2hvcm9wbGV0aCgpIHtcbiAgICBjb25zdCB7ZGF0YX0gPSB0aGlzLnByb3BzO1xuICAgIC8vIEdlbmVyYXRlIGEgZmxhdCBsaXN0IG9mIGJ1aWxkaW5nc1xuICAgIHRoaXMuc3RhdGUuYnVpbGRpbmdzID0gW107XG4gICAgZm9yIChjb25zdCBidWlsZGluZyBvZiBkYXRhLmZlYXR1cmVzKSB7XG4gICAgICBjb25zdCB7cHJvcGVydGllcywgZ2VvbWV0cnl9ID0gYnVpbGRpbmc7XG4gICAgICBjb25zdCB7Y29vcmRpbmF0ZXMsIHR5cGV9ID0gZ2VvbWV0cnk7XG4gICAgICBpZiAoIXByb3BlcnRpZXMuaGVpZ2h0KSB7XG4gICAgICAgIHByb3BlcnRpZXMuaGVpZ2h0ID0gTWF0aC5yYW5kb20oKSAqIDEwMDA7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgICAgIC8vIE1hcHMgdG8gbXVsdGlwbGUgYnVpbGRpbmdzXG4gICAgICAgIGNvbnN0IGJ1aWxkaW5ncyA9IGNvb3JkaW5hdGVzLm1hcChcbiAgICAgICAgICBjb29yZHMgPT4gKHtjb29yZGluYXRlczogY29vcmRzLCBwcm9wZXJ0aWVzfSlcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5idWlsZGluZ3MucHVzaCguLi5idWlsZGluZ3MpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgICAvLyBNYXBzIHRvIGEgc2luZ2xlIGJ1aWxkaW5nXG4gICAgICAgIHRoaXMuc3RhdGUuYnVpbGRpbmdzLnB1c2goe2Nvb3JkaW5hdGVzLCBwcm9wZXJ0aWVzfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gV2UgYXJlIGlnbm9yaW5nIFBvaW50cyBmb3Igbm93XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgdmVydGljZXMgZm9yIHRoZSBidWlsZGluZyBsaXN0XG4gICAgdGhpcy5zdGF0ZS5ncm91cGVkVmVydGljZXMgPSB0aGlzLnN0YXRlLmJ1aWxkaW5ncy5tYXAoXG4gICAgICBidWlsZGluZyA9PiBidWlsZGluZy5jb29yZGluYXRlcy5tYXAoXG4gICAgICAgIHBvbHlnb24gPT4gcG9seWdvbi5tYXAoXG4gICAgICAgICAgY29vcmRpbmF0ZSA9PiBbXG4gICAgICAgICAgICBjb29yZGluYXRlWzBdLFxuICAgICAgICAgICAgY29vcmRpbmF0ZVsxXSxcbiAgICAgICAgICAgIGJ1aWxkaW5nLnByb3BlcnRpZXMuaGVpZ2h0IHx8IDEwXG4gICAgICAgICAgXVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbnRvdXJJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXQpIHtcbiAgICBjb25zdCBzdHJpZGUgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcblxuICAgIHJldHVybiB2ZXJ0aWNlcy5tYXAocG9seWdvbiA9PiB7XG4gICAgICBjb25zdCBpbmRpY2VzID0gW29mZnNldF07XG4gICAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHBvbHlnb24ubGVuZ3RoO1xuXG4gICAgICAvLyBidWlsZGluZyB0b3BcbiAgICAgIC8vIHVzZSB2ZXJ0ZXggcGFpcnMgZm9yIEdMLkxJTkVTID0+IFswLCAxLCAxLCAyLCAyLCAuLi4sIG4tMSwgbi0xLCAwXVxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBudW1WZXJ0aWNlcyAtIDE7IGkrKykge1xuICAgICAgICBpbmRpY2VzLnB1c2goaSArIG9mZnNldCwgaSArIG9mZnNldCk7XG4gICAgICB9XG4gICAgICBpbmRpY2VzLnB1c2gob2Zmc2V0KTtcblxuICAgICAgLy8gYnVpbGRpbmcgc2lkZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGkgKyBvZmZzZXQsIGkgKyBzdHJpZGUgKyBvZmZzZXQpO1xuICAgICAgfVxuXG4gICAgICBvZmZzZXQgKz0gbnVtVmVydGljZXM7XG4gICAgICByZXR1cm4gaW5kaWNlcztcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXQpIHtcbiAgICBjb25zdCBzdHJpZGUgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcbiAgICBsZXQgaG9sZXMgPSBudWxsO1xuICAgIGNvbnN0IHF1YWQgPSBbXG4gICAgICBbMCwgMV0sIFswLCAzXSwgWzEsIDJdLFxuICAgICAgWzEsIDJdLCBbMCwgM10sIFsxLCA0XVxuICAgIF07XG5cbiAgICBpZiAodmVydGljZXMubGVuZ3RoID4gMSkge1xuICAgICAgaG9sZXMgPSB2ZXJ0aWNlcy5yZWR1Y2UoXG4gICAgICAgIChhY2MsIHBvbHlnb24pID0+IFsuLi5hY2MsIGFjY1thY2MubGVuZ3RoIC0gMV0gKyBwb2x5Z29uLmxlbmd0aF0sXG4gICAgICAgIFswXVxuICAgICAgKS5zbGljZSgxLCB2ZXJ0aWNlcy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHRvcEluZGljZXMgPSBlYXJjdXQoZmxhdHRlbih2ZXJ0aWNlcyksIGhvbGVzLCAzKVxuICAgICAgLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldCk7XG5cbiAgICBjb25zdCBzaWRlSW5kaWNlcyA9IHZlcnRpY2VzLm1hcChwb2x5Z29uID0+IHtcbiAgICAgIGNvbnN0IG51bVZlcnRpY2VzID0gcG9seWdvbi5sZW5ndGg7XG4gICAgICAvLyBidWlsZGluZyB0b3BcbiAgICAgIGNvbnN0IGluZGljZXMgPSBbXTtcblxuICAgICAgLy8gYnVpbGRpbmcgc2lkZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgICAgaW5kaWNlcy5wdXNoKC4uLmRyYXdSZWN0YW5nbGUoaSkpO1xuICAgICAgfVxuXG4gICAgICBvZmZzZXQgKz0gbnVtVmVydGljZXM7XG4gICAgICByZXR1cm4gaW5kaWNlcztcbiAgICB9KTtcblxuICAgIHJldHVybiBbdG9wSW5kaWNlcywgc2lkZUluZGljZXNdO1xuXG4gICAgZnVuY3Rpb24gZHJhd1JlY3RhbmdsZShpKSB7XG4gICAgICByZXR1cm4gcXVhZC5tYXAodiA9PiBpICsgdlswXSArIHN0cmlkZSAqIHZbMV0gKyBvZmZzZXQpO1xuICAgIH1cbiAgfVxufVxuXG5FeHRydWRlZENob3JvcGxldGhMYXllcjY0LmxheWVyTmFtZSA9ICdFeHRydWRlZENob3JvcGxldGhMYXllcjY0JztcbkV4dHJ1ZGVkQ2hvcm9wbGV0aExheWVyNjQuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuXG4vKlxuICogaGVscGVyc1xuICovXG4vLyBnZXQgbm9ybWFsIHZlY3RvciBvZiBsaW5lIHNlZ21lbnRcbmZ1bmN0aW9uIGdldE5vcm1hbChwMSwgcDIpIHtcbiAgaWYgKHAxWzBdID09PSBwMlswXSAmJiBwMVsxXSA9PT0gcDJbMV0pIHtcbiAgICByZXR1cm4gWzEsIDAsIDBdO1xuICB9XG5cbiAgY29uc3QgZGVncmVlczJyYWRpYW5zID0gTWF0aC5QSSAvIDE4MDtcblxuICBjb25zdCBsb24xID0gZGVncmVlczJyYWRpYW5zICogcDFbMF07XG4gIGNvbnN0IGxvbjIgPSBkZWdyZWVzMnJhZGlhbnMgKiBwMlswXTtcbiAgY29uc3QgbGF0MSA9IGRlZ3JlZXMycmFkaWFucyAqIHAxWzFdO1xuICBjb25zdCBsYXQyID0gZGVncmVlczJyYWRpYW5zICogcDJbMV07XG5cbiAgY29uc3QgYSA9IE1hdGguc2luKGxvbjIgLSBsb24xKSAqIE1hdGguY29zKGxhdDIpO1xuICBjb25zdCBiID0gTWF0aC5jb3MobGF0MSkgKiBNYXRoLnNpbihsYXQyKSAtXG4gICAgIE1hdGguc2luKGxhdDEpICogTWF0aC5jb3MobGF0MikgKiBNYXRoLmNvcyhsb24yIC0gbG9uMSk7XG5cbiAgcmV0dXJuIHZlYzMubm9ybWFsaXplKFtdLCBbYiwgMCwgLWFdKTtcbn1cblxuLy8gY291bnQgbnVtYmVyIG9mIHZlcnRpY2VzIGluIGdlb2pzb24gcG9seWdvblxuZnVuY3Rpb24gY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcykge1xuICByZXR1cm4gdmVydGljZXMucmVkdWNlKChjb3VudCwgcG9seWdvbikgPT4gY291bnQgKyBwb2x5Z29uLmxlbmd0aCwgMCk7XG59XG4iXX0=
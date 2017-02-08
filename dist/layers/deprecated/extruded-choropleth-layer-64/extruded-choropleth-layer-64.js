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

var _extrudedChoroplethLayerVertex = require('./extruded-choropleth-layer-vertex.glsl');

var _extrudedChoroplethLayerVertex2 = _interopRequireDefault(_extrudedChoroplethLayerVertex);

var _extrudedChoroplethLayerFragment = require('./extruded-choropleth-layer-fragment.glsl');

var _extrudedChoroplethLayerFragment2 = _interopRequireDefault(_extrudedChoroplethLayerFragment);

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

  function ExtrudedChoroplethLayer64(props) {
    _classCallCheck(this, ExtrudedChoroplethLayer64);

    var _this = _possibleConstructorReturn(this, (ExtrudedChoroplethLayer64.__proto__ || Object.getPrototypeOf(ExtrudedChoroplethLayer64)).call(this, props));

    _utils.log.once('ExtrudedChoroplethLayer64 is deprecated. Consider using GeoJsonLayer instead');
    return _this;
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
    key: 'getPickingInfo',
    value: function getPickingInfo(opts) {
      var info = _get(ExtrudedChoroplethLayer64.prototype.__proto__ || Object.getPrototypeOf(ExtrudedChoroplethLayer64.prototype), 'getPickingInfo', this).call(this, opts);
      var index = this.decodePickingColor(info.color);
      var feature = index >= 0 ? this.props.data.features[index] : null;
      info.feature = feature;
      info.object = feature;
      return info;
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: _extrudedChoroplethLayerVertex2.default,
        fs: _extrudedChoroplethLayerFragment2.default,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9leHRydWRlZC1jaG9yb3BsZXRoLWxheWVyLTY0L2V4dHJ1ZGVkLWNob3JvcGxldGgtbGF5ZXItNjQuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsIkRFRkFVTFRfQU1CSUVOVF9DT0xPUiIsIkRFRkFVTFRfUE9JTlRMSUdIVF9BTUJJRU5UX0NPRUZGSUNJRU5UIiwiREVGQVVMVF9QT0lOVExJR0hUX0xPQ0FUSU9OIiwiREVGQVVMVF9QT0lOVExJR0hUX0NPTE9SIiwiREVGQVVMVF9QT0lOVExJR0hUX0FUVEVOVUFUSU9OIiwiREVGQVVMVF9NQVRFUklBTF9TUEVDVUxBUl9DT0xPUiIsIkRFRkFVTFRfTUFURVJJQUxfU0hJTklORVNTIiwiZGVmYXVsdFByb3BzIiwib3BhY2l0eSIsImVsZXZhdGlvbiIsIkV4dHJ1ZGVkQ2hvcm9wbGV0aExheWVyNjQiLCJwcm9wcyIsIm9uY2UiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGQiLCJpbmRpY2VzIiwic2l6ZSIsImlzSW5kZXhlZCIsInVwZGF0ZSIsImNhbGN1bGF0ZUluZGljZXMiLCJwb3NpdGlvbnMiLCJjYWxjdWxhdGVQb3NpdGlvbnMiLCJoZWlnaHRzIiwiY2FsY3VsYXRlSGVpZ2h0cyIsIm5vcm1hbHMiLCJjYWxjdWxhdGVOb3JtYWxzIiwiY29sb3JzIiwiY2FsY3VsYXRlQ29sb3JzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJudW1JbnN0YW5jZXMiLCJtb2RlbCIsImdldE1vZGVsIiwiY2hhbmdlRmxhZ3MiLCJkYXRhQ2hhbmdlZCIsImV4dHJhY3RFeHRydWRlZENob3JvcGxldGgiLCJpbnZhbGlkYXRlQWxsIiwiY29sb3IiLCJhbWJpZW50Q29sb3IiLCJwb2ludExpZ2h0Q29sb3IiLCJwb2ludExpZ2h0TG9jYXRpb24iLCJwb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50IiwicG9pbnRMaWdodEF0dGVudWF0aW9uIiwibWF0ZXJpYWxTcGVjdWxhckNvbG9yIiwibWF0ZXJpYWxTaGluaW5lc3MiLCJzZXRVbmlmb3JtcyIsIk51bWJlciIsImlzRmluaXRlIiwidUFtYmllbnRDb2xvciIsInVQb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50IiwidVBvaW50TGlnaHRMb2NhdGlvbiIsInVQb2ludExpZ2h0Q29sb3IiLCJ1UG9pbnRMaWdodEF0dGVudWF0aW9uIiwidU1hdGVyaWFsU3BlY3VsYXJDb2xvciIsInVNYXRlcmlhbFNoaW5pbmVzcyIsInVuaWZvcm1zIiwicmVuZGVyIiwib3B0cyIsImluZm8iLCJpbmRleCIsImRlY29kZVBpY2tpbmdDb2xvciIsImZlYXR1cmUiLCJkYXRhIiwiZmVhdHVyZXMiLCJvYmplY3QiLCJ2cyIsImZzIiwiZnA2NCIsInByb2plY3Q2NCIsImdldEV4dGVuc2lvbiIsIkVycm9yIiwiZW5hYmxlIiwiREVQVEhfVEVTVCIsImRlcHRoRnVuYyIsIkxFUVVBTCIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiZHJhd1dpcmVmcmFtZSIsIkxJTkVTIiwiVFJJQU5HTEVTIiwidmVydGV4Q291bnQiLCJhdHRyaWJ1dGUiLCJncm91cGVkVmVydGljZXMiLCJtYXAiLCJ0b3BWZXJ0aWNlcyIsIkFycmF5IiwicHJvdG90eXBlIiwiY29uY2F0IiwiYXBwbHkiLCJ2ZXJ0aWNlcyIsImJhc2VWZXJ0aWNlcyIsInYiLCJ2YWx1ZSIsIkZsb2F0MzJBcnJheSIsImxlbmd0aCIsImkiLCJ1cCIsImJ1aWxkaW5nSW5kZXgiLCJ0b3BOb3JtYWxzIiwiY291bnRWZXJ0aWNlcyIsImZpbGwiLCJzaWRlTm9ybWFscyIsImNhbGN1bGF0ZVNpZGVOb3JtYWxzIiwicG9seWdvbiIsInNpZGVOb3JtYWxzRm9yd2FyZCIsIm4iLCJzaWRlTm9ybWFsc0JhY2t3YXJkIiwibnVtVmVydGljZXMiLCJnZXROb3JtYWwiLCJwdXNoIiwibXVsdGlwbGllciIsIm9mZnNldHMiLCJyZWR1Y2UiLCJhY2MiLCJjYWxjdWxhdGVDb250b3VySW5kaWNlcyIsImNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzIiwiVWludDMyQXJyYXkiLCJ0YXJnZXQiLCJFTEVNRU5UX0FSUkFZX0JVRkZFUiIsInNldFZlcnRleENvdW50IiwiYmFzZUNvbG9yIiwiaXNBcnJheSIsInRvcENvbG9yIiwidG9wQ29sb3JzIiwiYmFzZUNvbG9ycyIsImJ1aWxkaW5ncyIsImJ1aWxkaW5nIiwicHJvcGVydGllcyIsImNvb3JkaW5hdGVzIiwidHlwZSIsImhlaWdodCIsIk1hdGgiLCJyYW5kb20iLCJjb29yZHMiLCJjb29yZGluYXRlIiwib2Zmc2V0Iiwic3RyaWRlIiwiaG9sZXMiLCJxdWFkIiwic2xpY2UiLCJ0b3BJbmRpY2VzIiwic2lkZUluZGljZXMiLCJkcmF3UmVjdGFuZ2xlIiwibGF5ZXJOYW1lIiwicDEiLCJwMiIsImRlZ3JlZXMycmFkaWFucyIsIlBJIiwibG9uMSIsImxvbjIiLCJsYXQxIiwibGF0MiIsImEiLCJzaW4iLCJjb3MiLCJiIiwibm9ybWFsaXplIiwiY291bnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUVBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OzsrZUE3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBYUEsSUFBTUEsZ0JBQWdCLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBQXRCO0FBQ0EsSUFBTUMsd0JBQXdCLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBQTlCO0FBQ0EsSUFBTUMseUNBQXlDLEdBQS9DO0FBQ0EsSUFBTUMsOEJBQThCLENBQUMsT0FBRCxFQUFVLENBQUMsT0FBWCxFQUFvQixHQUFwQixDQUFwQztBQUNBLElBQU1DLDJCQUEyQixDQUFDLEdBQUQsRUFB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QUFMLENBQVNILElBQVQsQ0FBakIsR0FBa0NwQixLQUFLdUIsR0FBTCxDQUFTTCxPQUFPRCxJQUFoQixDQURyQzs7QUFHQSxTQUFPLGVBQUtRLFNBQUwsQ0FBZSxFQUFmLEVBQW1CLENBQUNELENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBQ0gsQ0FBUixDQUFuQixDQUFQO0FBQ0Q7O0FBRUQ7QUFDQSxTQUFTckQsYUFBVCxDQUF1QlYsUUFBdkIsRUFBaUM7QUFDL0IsU0FBT0EsU0FBU3VCLE1BQVQsQ0FBZ0IsVUFBQzZDLEtBQUQsRUFBUXRELE9BQVI7QUFBQSxXQUFvQnNELFFBQVF0RCxRQUFRVCxNQUFwQztBQUFBLEdBQWhCLEVBQTRELENBQTVELENBQVA7QUFDRCIsImZpbGUiOiJleHRydWRlZC1jaG9yb3BsZXRoLWxheWVyLTY0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllcn0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCB7YXNzZW1ibGVTaGFkZXJzfSBmcm9tICcuLi8uLi8uLi9zaGFkZXItdXRpbHMnO1xuaW1wb3J0IHtmcDY0aWZ5fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtmbGF0dGVuLCBsb2d9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscyc7XG5pbXBvcnQgZWFyY3V0IGZyb20gJ2VhcmN1dCc7XG5pbXBvcnQge3ZlYzN9IGZyb20gJ2dsLW1hdHJpeCc7XG5cbmltcG9ydCBleHRydWRlZENob3JvcGxldGhWZXJ0ZXggZnJvbSAnLi9leHRydWRlZC1jaG9yb3BsZXRoLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCBleHRydWRlZENob3JvcGxldGhGcmFnbWVudCBmcm9tICcuL2V4dHJ1ZGVkLWNob3JvcGxldGgtbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMTgwLCAxODAsIDIwMF07XG5jb25zdCBERUZBVUxUX0FNQklFTlRfQ09MT1IgPSBbMjU1LCAyNTUsIDI1NV07XG5jb25zdCBERUZBVUxUX1BPSU5UTElHSFRfQU1CSUVOVF9DT0VGRklDSUVOVCA9IDAuMTtcbmNvbnN0IERFRkFVTFRfUE9JTlRMSUdIVF9MT0NBVElPTiA9IFs0MC40NDA2LCAtNzkuOTk1OSwgMTAwXTtcbmNvbnN0IERFRkFVTFRfUE9JTlRMSUdIVF9DT0xPUiA9IFsyNTUsIDI1NSwgMjU1XTtcbmNvbnN0IERFRkFVTFRfUE9JTlRMSUdIVF9BVFRFTlVBVElPTiA9IDEuMDtcbmNvbnN0IERFRkFVTFRfTUFURVJJQUxfU1BFQ1VMQVJfQ09MT1IgPSBbMjU1LCAyNTUsIDI1NV07XG5jb25zdCBERUZBVUxUX01BVEVSSUFMX1NISU5JTkVTUyA9IDE7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgb3BhY2l0eTogMSxcbiAgZWxldmF0aW9uOiAxXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFeHRydWRlZENob3JvcGxldGhMYXllcjY0IGV4dGVuZHMgTGF5ZXIge1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICBsb2cub25jZSgnRXh0cnVkZWRDaG9yb3BsZXRoTGF5ZXI2NCBpcyBkZXByZWNhdGVkLiBDb25zaWRlciB1c2luZyBHZW9Kc29uTGF5ZXIgaW5zdGVhZCcpO1xuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGQoe1xuICAgICAgaW5kaWNlczoge3NpemU6IDEsIGlzSW5kZXhlZDogdHJ1ZSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluZGljZXN9LFxuICAgICAgcG9zaXRpb25zOiB7c2l6ZTogNCwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVBvc2l0aW9uc30sXG4gICAgICBoZWlnaHRzOiB7c2l6ZTogMiwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUhlaWdodHN9LFxuICAgICAgbm9ybWFsczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVOb3JtYWxzfSxcbiAgICAgIGNvbG9yczoge3NpemU6IDQsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVDb2xvcnN9XG4gICAgfSk7XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbnVtSW5zdGFuY2VzOiAwLFxuICAgICAgbW9kZWw6IHRoaXMuZ2V0TW9kZWwoZ2wpXG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7Y2hhbmdlRmxhZ3N9KSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQpIHtcbiAgICAgIHRoaXMuZXh0cmFjdEV4dHJ1ZGVkQ2hvcm9wbGV0aCgpO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgZWxldmF0aW9uLFxuICAgICAgY29sb3IsIGFtYmllbnRDb2xvciwgcG9pbnRMaWdodENvbG9yLFxuICAgICAgcG9pbnRMaWdodExvY2F0aW9uLCBwb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50LFxuICAgICAgcG9pbnRMaWdodEF0dGVudWF0aW9uLCBtYXRlcmlhbFNwZWN1bGFyQ29sb3IsIG1hdGVyaWFsU2hpbmluZXNzXG4gICAgfSA9IHRoaXMucHJvcHM7XG5cbiAgICB0aGlzLnNldFVuaWZvcm1zKHtcbiAgICAgIGVsZXZhdGlvbjogTnVtYmVyLmlzRmluaXRlKGVsZXZhdGlvbikgPyBlbGV2YXRpb24gOiAxLFxuICAgICAgY29sb3JzOiBjb2xvciB8fCBERUZBVUxUX0NPTE9SLFxuICAgICAgdUFtYmllbnRDb2xvcjogYW1iaWVudENvbG9yIHx8IERFRkFVTFRfQU1CSUVOVF9DT0xPUixcbiAgICAgIHVQb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50OlxuICAgICAgICBwb2ludExpZ2h0QW1iaWVudENvZWZmaWNpZW50IHx8IERFRkFVTFRfUE9JTlRMSUdIVF9BTUJJRU5UX0NPRUZGSUNJRU5ULFxuICAgICAgdVBvaW50TGlnaHRMb2NhdGlvbjogcG9pbnRMaWdodExvY2F0aW9uIHx8IERFRkFVTFRfUE9JTlRMSUdIVF9MT0NBVElPTixcbiAgICAgIHVQb2ludExpZ2h0Q29sb3I6IHBvaW50TGlnaHRDb2xvciB8fCBERUZBVUxUX1BPSU5UTElHSFRfQ09MT1IsXG4gICAgICB1UG9pbnRMaWdodEF0dGVudWF0aW9uOiBwb2ludExpZ2h0QXR0ZW51YXRpb24gfHwgREVGQVVMVF9QT0lOVExJR0hUX0FUVEVOVUFUSU9OLFxuICAgICAgdU1hdGVyaWFsU3BlY3VsYXJDb2xvcjogbWF0ZXJpYWxTcGVjdWxhckNvbG9yIHx8IERFRkFVTFRfTUFURVJJQUxfU1BFQ1VMQVJfQ09MT1IsXG4gICAgICB1TWF0ZXJpYWxTaGluaW5lc3M6IG1hdGVyaWFsU2hpbmluZXNzIHx8IERFRkFVTFRfTUFURVJJQUxfU0hJTklORVNTXG4gICAgfSk7XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcih1bmlmb3Jtcyk7XG4gIH1cblxuICBnZXRQaWNraW5nSW5mbyhvcHRzKSB7XG4gICAgY29uc3QgaW5mbyA9IHN1cGVyLmdldFBpY2tpbmdJbmZvKG9wdHMpO1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5kZWNvZGVQaWNraW5nQ29sb3IoaW5mby5jb2xvcik7XG4gICAgY29uc3QgZmVhdHVyZSA9IGluZGV4ID49IDAgPyB0aGlzLnByb3BzLmRhdGEuZmVhdHVyZXNbaW5kZXhdIDogbnVsbDtcbiAgICBpbmZvLmZlYXR1cmUgPSBmZWF0dXJlO1xuICAgIGluZm8ub2JqZWN0ID0gZmVhdHVyZTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxuXG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZzOiBleHRydWRlZENob3JvcGxldGhWZXJ0ZXgsXG4gICAgICBmczogZXh0cnVkZWRDaG9yb3BsZXRoRnJhZ21lbnQsXG4gICAgICBmcDY0OiB0cnVlLFxuICAgICAgcHJvamVjdDY0OiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIGdldE1vZGVsKGdsKSB7XG4gICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgMzIgYml0IHN1cHBvcnRcbiAgICAvLyBUT0RPIC0gdGhpcyBjb3VsZCBiZSBkb25lIGF1dG9tYXRpY2FsbHkgYnkgbHVtYSBpbiBcImRyYXdcIlxuICAgIC8vIHdoZW4gaXQgZGV0ZWN0cyAzMiBiaXQgaW5kaWNlc1xuICAgIGlmICghZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfZWxlbWVudF9pbmRleF91aW50JykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXh0cnVkZWQgY2hvcm9wbGV0aCBsYXllciBuZWVkcyAzMiBiaXQgaW5kaWNlcycpO1xuICAgIH1cblxuICAgIC8vIEJ1aWxkaW5ncyBhcmUgM2Qgc28gZGVwdGggdGVzdCBzaG91bGQgYmUgZW5hYmxlZFxuICAgIC8vIFRPRE8gLSBpdCBpcyBhIGxpdHRsZSBoZWF2eSBoYW5kZWQgdG8gaGF2ZSBhIGxheWVyIHNldCB0aGlzXG4gICAgLy8gQWx0ZXJuYXRpdmVseSwgY2hlY2sgZGVwdGggdGVzdCBhbmQgd2FybiBpZiBub3Qgc2V0LCBvciBhZGQgYSBwcm9wXG4gICAgLy8gc2V0RGVwdGhUZXN0IHRoYXQgaXMgb24gYnkgZGVmYXVsdC5cbiAgICBnbC5lbmFibGUoR0wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZGVwdGhGdW5jKEdMLkxFUVVBTCk7XG5cbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKHtcbiAgICAgIGdsLFxuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGZzOiBzaGFkZXJzLmZzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGRyYXdNb2RlOiB0aGlzLnByb3BzLmRyYXdXaXJlZnJhbWUgPyBHTC5MSU5FUyA6IEdMLlRSSUFOR0xFU1xuICAgICAgfSksXG4gICAgICB2ZXJ0ZXhDb3VudDogMCxcbiAgICAgIGlzSW5kZXhlZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgLy8gZWFjaCB0b3AgdmVydGV4IGlzIG9uIDMgc3VyZmFjZXNcbiAgLy8gZWFjaCBib3R0b20gdmVydGV4IGlzIG9uIDIgc3VyZmFjZXNcbiAgY2FsY3VsYXRlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGxldCB7cG9zaXRpb25zfSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKCFwb3NpdGlvbnMpIHtcbiAgICAgIHBvc2l0aW9ucyA9IGZsYXR0ZW4odGhpcy5zdGF0ZS5ncm91cGVkVmVydGljZXMubWFwKFxuICAgICAgICB2ZXJ0aWNlcyA9PiB7XG4gICAgICAgICAgY29uc3QgdG9wVmVydGljZXMgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCB2ZXJ0aWNlcyk7XG4gICAgICAgICAgY29uc3QgYmFzZVZlcnRpY2VzID0gdG9wVmVydGljZXMubWFwKHYgPT4gW3ZbMF0sIHZbMV0sIDBdKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5kcmF3V2lyZWZyYW1lID8gW3RvcFZlcnRpY2VzLCBiYXNlVmVydGljZXNdIDpcbiAgICAgICAgICAgIFt0b3BWZXJ0aWNlcywgdG9wVmVydGljZXMsIHRvcFZlcnRpY2VzLCBiYXNlVmVydGljZXMsIGJhc2VWZXJ0aWNlc107XG4gICAgICAgIH1cbiAgICAgICkpO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zLmxlbmd0aCAvIDMgKiA0KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zLmxlbmd0aCAvIDM7IGkrKykge1xuICAgICAgW2F0dHJpYnV0ZS52YWx1ZVtpICogNCArIDBdLCBhdHRyaWJ1dGUudmFsdWVbaSAqIDQgKyAxXV0gPSBmcDY0aWZ5KHBvc2l0aW9uc1tpICogMyArIDBdKTtcbiAgICAgIFthdHRyaWJ1dGUudmFsdWVbaSAqIDQgKyAyXSwgYXR0cmlidXRlLnZhbHVlW2kgKiA0ICsgM11dID0gZnA2NGlmeShwb3NpdGlvbnNbaSAqIDMgKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSGVpZ2h0cyhhdHRyaWJ1dGUpIHtcbiAgICBsZXQge3Bvc2l0aW9uc30gPSB0aGlzLnN0YXRlO1xuICAgIGlmICghcG9zaXRpb25zKSB7XG4gICAgICBwb3NpdGlvbnMgPSBmbGF0dGVuKHRoaXMuc3RhdGUuZ3JvdXBlZFZlcnRpY2VzLm1hcChcbiAgICAgICAgdmVydGljZXMgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvcFZlcnRpY2VzID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgdmVydGljZXMpO1xuICAgICAgICAgIGNvbnN0IGJhc2VWZXJ0aWNlcyA9IHRvcFZlcnRpY2VzLm1hcCh2ID0+IFt2WzBdLCB2WzFdLCAwXSk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZHJhd1dpcmVmcmFtZSA/IFt0b3BWZXJ0aWNlcywgYmFzZVZlcnRpY2VzXSA6XG4gICAgICAgICAgICBbdG9wVmVydGljZXMsIHRvcFZlcnRpY2VzLCB0b3BWZXJ0aWNlcywgYmFzZVZlcnRpY2VzLCBiYXNlVmVydGljZXNdO1xuICAgICAgICB9XG4gICAgICApKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucy5sZW5ndGggLyAzICogMik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3NpdGlvbnMubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgICBbYXR0cmlidXRlLnZhbHVlW2kgKiAyICsgMF0sIGF0dHJpYnV0ZS52YWx1ZVtpICogMiArIDFdXSA9XG4gICAgICAgZnA2NGlmeShwb3NpdGlvbnNbaSAqIDMgKyAyXSArIDAuMSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlTm9ybWFscyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB1cCA9IFswLCAxLCAwXTtcblxuICAgIGNvbnN0IG5vcm1hbHMgPSB0aGlzLnN0YXRlLmdyb3VwZWRWZXJ0aWNlcy5tYXAoXG4gICAgICAodmVydGljZXMsIGJ1aWxkaW5nSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdG9wTm9ybWFscyA9IG5ldyBBcnJheShjb3VudFZlcnRpY2VzKHZlcnRpY2VzKSkuZmlsbCh1cCk7XG4gICAgICAgIGNvbnN0IHNpZGVOb3JtYWxzID0gdmVydGljZXMubWFwKHBvbHlnb24gPT5cbiAgICAgICAgICB0aGlzLmNhbGN1bGF0ZVNpZGVOb3JtYWxzKHBvbHlnb24pKTtcbiAgICAgICAgY29uc3Qgc2lkZU5vcm1hbHNGb3J3YXJkID0gc2lkZU5vcm1hbHMubWFwKG4gPT4gblswXSk7XG4gICAgICAgIGNvbnN0IHNpZGVOb3JtYWxzQmFja3dhcmQgPSBzaWRlTm9ybWFscy5tYXAobiA9PiBuWzFdKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5kcmF3V2lyZWZyYW1lID8gW3RvcE5vcm1hbHMsIHRvcE5vcm1hbHNdIDpcbiAgICAgICAgW3RvcE5vcm1hbHMsIHNpZGVOb3JtYWxzRm9yd2FyZCwgc2lkZU5vcm1hbHNCYWNrd2FyZCxcbiAgICAgICAgICBzaWRlTm9ybWFsc0ZvcndhcmQsIHNpZGVOb3JtYWxzQmFja3dhcmRdO1xuICAgICAgfVxuICAgICk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KGZsYXR0ZW4obm9ybWFscykpO1xuICB9XG5cbiAgY2FsY3VsYXRlU2lkZU5vcm1hbHModmVydGljZXMpIHtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHZlcnRpY2VzLmxlbmd0aDtcbiAgICBjb25zdCBub3JtYWxzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVZlcnRpY2VzIC0gMTsgaSsrKSB7XG4gICAgICBjb25zdCBuID0gZ2V0Tm9ybWFsKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tpICsgMV0pO1xuICAgICAgbm9ybWFscy5wdXNoKG4pO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICBbLi4ubm9ybWFscywgbm9ybWFsc1swXV0sXG4gICAgICBbbm9ybWFsc1swXSwgLi4ubm9ybWFsc11cbiAgICBdO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5kaWNlcyhhdHRyaWJ1dGUpIHtcbiAgICAvLyBhZGp1c3QgaW5kZXggb2Zmc2V0IGZvciBtdWx0aXBsZSBidWlsZGluZ3NcbiAgICBjb25zdCBtdWx0aXBsaWVyID0gdGhpcy5wcm9wcy5kcmF3V2lyZWZyYW1lID8gMiA6IDU7XG4gICAgY29uc3Qgb2Zmc2V0cyA9IHRoaXMuc3RhdGUuZ3JvdXBlZFZlcnRpY2VzLnJlZHVjZShcbiAgICAgIChhY2MsIHZlcnRpY2VzKSA9PlxuICAgICAgICBbLi4uYWNjLCBhY2NbYWNjLmxlbmd0aCAtIDFdICsgY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcykgKiBtdWx0aXBsaWVyXSxcbiAgICAgIFswXVxuICAgICk7XG5cbiAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5zdGF0ZS5ncm91cGVkVmVydGljZXMubWFwKFxuICAgICAgKHZlcnRpY2VzLCBidWlsZGluZ0luZGV4KSA9PiB0aGlzLnByb3BzLmRyYXdXaXJlZnJhbWUgP1xuICAgICAgICAvLyAxLiBnZXQgc2VxdWVudGlhbGx5IG9yZGVyZWQgaW5kaWNlcyBvZiBlYWNoIGJ1aWxkaW5nIHdpcmVmcmFtZVxuICAgICAgICAvLyAyLiBvZmZzZXQgdGhlbSBieSB0aGUgbnVtYmVyIG9mIGluZGljZXMgaW4gcHJldmlvdXMgYnVpbGRpbmdzXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlQ29udG91ckluZGljZXModmVydGljZXMsIG9mZnNldHNbYnVpbGRpbmdJbmRleF0pIDpcbiAgICAgICAgLy8gMS4gZ2V0IHRyaWFuZ3VsYXRlZCBpbmRpY2VzIGZvciB0aGUgaW50ZXJuYWwgYXJlYXNcbiAgICAgICAgLy8gMi4gb2Zmc2V0IHRoZW0gYnkgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHByZXZpb3VzIGJ1aWxkaW5nc1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXRzW2J1aWxkaW5nSW5kZXhdKVxuICAgICk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgVWludDMyQXJyYXkoZmxhdHRlbihpbmRpY2VzKSk7XG4gICAgYXR0cmlidXRlLnRhcmdldCA9IEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSO1xuICAgIHRoaXMuc3RhdGUubW9kZWwuc2V0VmVydGV4Q291bnQoYXR0cmlidXRlLnZhbHVlLmxlbmd0aCAvIGF0dHJpYnV0ZS5zaXplKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCBjb2xvcnMgPSB0aGlzLnN0YXRlLmdyb3VwZWRWZXJ0aWNlcy5tYXAoXG4gICAgICAodmVydGljZXMsIGJ1aWxkaW5nSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qge2NvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IGJhc2VDb2xvciA9IEFycmF5LmlzQXJyYXkoY29sb3IpID8gY29sb3JbMF0gOiBjb2xvcjtcbiAgICAgICAgY29uc3QgdG9wQ29sb3IgPSBBcnJheS5pc0FycmF5KGNvbG9yKSA/XG4gICAgICAgICAgY29sb3JbY29sb3IubGVuZ3RoIC0gMV0gOiBjb2xvcjtcbiAgICAgICAgY29uc3QgbnVtVmVydGljZXMgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcblxuICAgICAgICBjb25zdCB0b3BDb2xvcnMgPSBuZXcgQXJyYXkobnVtVmVydGljZXMpLmZpbGwodG9wQ29sb3IpO1xuICAgICAgICBjb25zdCBiYXNlQ29sb3JzID0gbmV3IEFycmF5KG51bVZlcnRpY2VzKS5maWxsKGJhc2VDb2xvcik7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzLmRyYXdXaXJlZnJhbWUgPyBbdG9wQ29sb3JzLCBiYXNlQ29sb3JzXSA6XG4gICAgICAgICAgW3RvcENvbG9ycywgdG9wQ29sb3JzLCB0b3BDb2xvcnMsIGJhc2VDb2xvcnMsIGJhc2VDb2xvcnNdO1xuICAgICAgfVxuICAgICk7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheShmbGF0dGVuKGNvbG9ycykpO1xuICB9XG5cbiAgZXh0cmFjdEV4dHJ1ZGVkQ2hvcm9wbGV0aCgpIHtcbiAgICBjb25zdCB7ZGF0YX0gPSB0aGlzLnByb3BzO1xuICAgIC8vIEdlbmVyYXRlIGEgZmxhdCBsaXN0IG9mIGJ1aWxkaW5nc1xuICAgIHRoaXMuc3RhdGUuYnVpbGRpbmdzID0gW107XG4gICAgZm9yIChjb25zdCBidWlsZGluZyBvZiBkYXRhLmZlYXR1cmVzKSB7XG4gICAgICBjb25zdCB7cHJvcGVydGllcywgZ2VvbWV0cnl9ID0gYnVpbGRpbmc7XG4gICAgICBjb25zdCB7Y29vcmRpbmF0ZXMsIHR5cGV9ID0gZ2VvbWV0cnk7XG4gICAgICBpZiAoIXByb3BlcnRpZXMuaGVpZ2h0KSB7XG4gICAgICAgIHByb3BlcnRpZXMuaGVpZ2h0ID0gTWF0aC5yYW5kb20oKSAqIDEwMDA7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgICAgIC8vIE1hcHMgdG8gbXVsdGlwbGUgYnVpbGRpbmdzXG4gICAgICAgIGNvbnN0IGJ1aWxkaW5ncyA9IGNvb3JkaW5hdGVzLm1hcChcbiAgICAgICAgICBjb29yZHMgPT4gKHtjb29yZGluYXRlczogY29vcmRzLCBwcm9wZXJ0aWVzfSlcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5zdGF0ZS5idWlsZGluZ3MucHVzaCguLi5idWlsZGluZ3MpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgICAvLyBNYXBzIHRvIGEgc2luZ2xlIGJ1aWxkaW5nXG4gICAgICAgIHRoaXMuc3RhdGUuYnVpbGRpbmdzLnB1c2goe2Nvb3JkaW5hdGVzLCBwcm9wZXJ0aWVzfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gV2UgYXJlIGlnbm9yaW5nIFBvaW50cyBmb3Igbm93XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgdmVydGljZXMgZm9yIHRoZSBidWlsZGluZyBsaXN0XG4gICAgdGhpcy5zdGF0ZS5ncm91cGVkVmVydGljZXMgPSB0aGlzLnN0YXRlLmJ1aWxkaW5ncy5tYXAoXG4gICAgICBidWlsZGluZyA9PiBidWlsZGluZy5jb29yZGluYXRlcy5tYXAoXG4gICAgICAgIHBvbHlnb24gPT4gcG9seWdvbi5tYXAoXG4gICAgICAgICAgY29vcmRpbmF0ZSA9PiBbXG4gICAgICAgICAgICBjb29yZGluYXRlWzBdLFxuICAgICAgICAgICAgY29vcmRpbmF0ZVsxXSxcbiAgICAgICAgICAgIGJ1aWxkaW5nLnByb3BlcnRpZXMuaGVpZ2h0IHx8IDEwXG4gICAgICAgICAgXVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbnRvdXJJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXQpIHtcbiAgICBjb25zdCBzdHJpZGUgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcblxuICAgIHJldHVybiB2ZXJ0aWNlcy5tYXAocG9seWdvbiA9PiB7XG4gICAgICBjb25zdCBpbmRpY2VzID0gW29mZnNldF07XG4gICAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHBvbHlnb24ubGVuZ3RoO1xuXG4gICAgICAvLyBidWlsZGluZyB0b3BcbiAgICAgIC8vIHVzZSB2ZXJ0ZXggcGFpcnMgZm9yIEdMLkxJTkVTID0+IFswLCAxLCAxLCAyLCAyLCAuLi4sIG4tMSwgbi0xLCAwXVxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBudW1WZXJ0aWNlcyAtIDE7IGkrKykge1xuICAgICAgICBpbmRpY2VzLnB1c2goaSArIG9mZnNldCwgaSArIG9mZnNldCk7XG4gICAgICB9XG4gICAgICBpbmRpY2VzLnB1c2gob2Zmc2V0KTtcblxuICAgICAgLy8gYnVpbGRpbmcgc2lkZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGkgKyBvZmZzZXQsIGkgKyBzdHJpZGUgKyBvZmZzZXQpO1xuICAgICAgfVxuXG4gICAgICBvZmZzZXQgKz0gbnVtVmVydGljZXM7XG4gICAgICByZXR1cm4gaW5kaWNlcztcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXQpIHtcbiAgICBjb25zdCBzdHJpZGUgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcbiAgICBsZXQgaG9sZXMgPSBudWxsO1xuICAgIGNvbnN0IHF1YWQgPSBbXG4gICAgICBbMCwgMV0sIFswLCAzXSwgWzEsIDJdLFxuICAgICAgWzEsIDJdLCBbMCwgM10sIFsxLCA0XVxuICAgIF07XG5cbiAgICBpZiAodmVydGljZXMubGVuZ3RoID4gMSkge1xuICAgICAgaG9sZXMgPSB2ZXJ0aWNlcy5yZWR1Y2UoXG4gICAgICAgIChhY2MsIHBvbHlnb24pID0+IFsuLi5hY2MsIGFjY1thY2MubGVuZ3RoIC0gMV0gKyBwb2x5Z29uLmxlbmd0aF0sXG4gICAgICAgIFswXVxuICAgICAgKS5zbGljZSgxLCB2ZXJ0aWNlcy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHRvcEluZGljZXMgPSBlYXJjdXQoZmxhdHRlbih2ZXJ0aWNlcyksIGhvbGVzLCAzKVxuICAgICAgLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldCk7XG5cbiAgICBjb25zdCBzaWRlSW5kaWNlcyA9IHZlcnRpY2VzLm1hcChwb2x5Z29uID0+IHtcbiAgICAgIGNvbnN0IG51bVZlcnRpY2VzID0gcG9seWdvbi5sZW5ndGg7XG4gICAgICAvLyBidWlsZGluZyB0b3BcbiAgICAgIGNvbnN0IGluZGljZXMgPSBbXTtcblxuICAgICAgLy8gYnVpbGRpbmcgc2lkZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgICAgaW5kaWNlcy5wdXNoKC4uLmRyYXdSZWN0YW5nbGUoaSkpO1xuICAgICAgfVxuXG4gICAgICBvZmZzZXQgKz0gbnVtVmVydGljZXM7XG4gICAgICByZXR1cm4gaW5kaWNlcztcbiAgICB9KTtcblxuICAgIHJldHVybiBbdG9wSW5kaWNlcywgc2lkZUluZGljZXNdO1xuXG4gICAgZnVuY3Rpb24gZHJhd1JlY3RhbmdsZShpKSB7XG4gICAgICByZXR1cm4gcXVhZC5tYXAodiA9PiBpICsgdlswXSArIHN0cmlkZSAqIHZbMV0gKyBvZmZzZXQpO1xuICAgIH1cbiAgfVxufVxuXG5FeHRydWRlZENob3JvcGxldGhMYXllcjY0LmxheWVyTmFtZSA9ICdFeHRydWRlZENob3JvcGxldGhMYXllcjY0JztcbkV4dHJ1ZGVkQ2hvcm9wbGV0aExheWVyNjQuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuXG4vKlxuICogaGVscGVyc1xuICovXG4vLyBnZXQgbm9ybWFsIHZlY3RvciBvZiBsaW5lIHNlZ21lbnRcbmZ1bmN0aW9uIGdldE5vcm1hbChwMSwgcDIpIHtcbiAgaWYgKHAxWzBdID09PSBwMlswXSAmJiBwMVsxXSA9PT0gcDJbMV0pIHtcbiAgICByZXR1cm4gWzEsIDAsIDBdO1xuICB9XG5cbiAgY29uc3QgZGVncmVlczJyYWRpYW5zID0gTWF0aC5QSSAvIDE4MDtcblxuICBjb25zdCBsb24xID0gZGVncmVlczJyYWRpYW5zICogcDFbMF07XG4gIGNvbnN0IGxvbjIgPSBkZWdyZWVzMnJhZGlhbnMgKiBwMlswXTtcbiAgY29uc3QgbGF0MSA9IGRlZ3JlZXMycmFkaWFucyAqIHAxWzFdO1xuICBjb25zdCBsYXQyID0gZGVncmVlczJyYWRpYW5zICogcDJbMV07XG5cbiAgY29uc3QgYSA9IE1hdGguc2luKGxvbjIgLSBsb24xKSAqIE1hdGguY29zKGxhdDIpO1xuICBjb25zdCBiID0gTWF0aC5jb3MobGF0MSkgKiBNYXRoLnNpbihsYXQyKSAtXG4gICAgIE1hdGguc2luKGxhdDEpICogTWF0aC5jb3MobGF0MikgKiBNYXRoLmNvcyhsb24yIC0gbG9uMSk7XG5cbiAgcmV0dXJuIHZlYzMubm9ybWFsaXplKFtdLCBbYiwgMCwgLWFdKTtcbn1cblxuLy8gY291bnQgbnVtYmVyIG9mIHZlcnRpY2VzIGluIGdlb2pzb24gcG9seWdvblxuZnVuY3Rpb24gY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcykge1xuICByZXR1cm4gdmVydGljZXMucmVkdWNlKChjb3VudCwgcG9seWdvbikgPT4gY291bnQgKyBwb2x5Z29uLmxlbmd0aCwgMCk7XG59XG4iXX0=
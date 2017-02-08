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

var _utils = require('../../../lib/utils');

var _fp = require('../../../lib/utils/fp64');

var _hexagonCellLayerVertex = require('./hexagon-cell-layer-vertex.glsl');

var _hexagonCellLayerVertex2 = _interopRequireDefault(_hexagonCellLayerVertex);

var _hexagonCellLayerVertex3 = require('./hexagon-cell-layer-vertex-64.glsl');

var _hexagonCellLayerVertex4 = _interopRequireDefault(_hexagonCellLayerVertex3);

var _hexagonCellLayerFragment = require('./hexagon-cell-layer-fragment.glsl');

var _hexagonCellLayerFragment2 = _interopRequireDefault(_hexagonCellLayerFragment);

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

function positionsAreEqual(v1, v2) {
  // Hex positions are expected to change entirely, not to maintain some
  // positions and change others. Right now we only check a single vertex,
  // because H3 guarantees order, but even if that wasn't true, this would only
  // return a false positive for adjacent hexagons, which is close enough for
  // our purposes.
  return v1 === v2 || v1 && v2 && v1[0][0] === v2[0][0] && v1[0][1] === v2[0][1];
}

var DEFAULT_COLOR = [255, 0, 255, 255];

var defaultProps = {
  hexagonVertices: null,
  radius: null,
  angle: null,
  coverage: 1,
  elevationScale: 1,
  extruded: true,
  fp64: false,

  getCentroid: function getCentroid(x) {
    return x.centroid;
  },
  getColor: function getColor(x) {
    return x.color;
  },
  getElevation: function getElevation(x) {
    return x.elevation;
  },

  lightSettings: {
    lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.00, 5000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [1.2, 0.0, 0.8, 0.0],
    numberOfLights: 2
  }
};

var HexagonCellLayer = function (_Layer) {
  _inherits(HexagonCellLayer, _Layer);

  function HexagonCellLayer(props) {
    _classCallCheck(this, HexagonCellLayer);

    var missingProps = false;
    if (!props.hexagonVertices && (!props.radius || !Number.isFinite(props.angle))) {
      _utils.log.once(0, 'HexagonLayer: Either hexagonVertices or radius and angel are ' + 'needed to calculate primitive hexagon.');
      missingProps = true;
    } else if (props.hexagonVertices && (!Array.isArray(props.hexagonVertices) || props.hexagonVertices.length < 6)) {
      _utils.log.once(0, 'HexagonLayer: HexagonVertices needs to be an array of 6 points');

      missingProps = true;
    }

    if (missingProps) {
      _utils.log.once(0, 'Now using 1000 meter as default radius, 0 as default angel');
      props.radius = 1000;
      props.angle = 0;
    }

    return _possibleConstructorReturn(this, (HexagonCellLayer.__proto__ || Object.getPrototypeOf(HexagonCellLayer)).call(this, props));
  }

  _createClass(HexagonCellLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _hexagonCellLayerVertex4.default, fs: _hexagonCellLayerFragment2.default, modules: ['fp64', 'project64', 'lighting']
      } : {
        vs: _hexagonCellLayerVertex2.default, fs: _hexagonCellLayerFragment2.default, modules: ['lighting']
      };
    }

    /**
     * DeckGL calls initializeState when GL context is available
     * Essentially a deferred constructor
     */

  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this._getModel(gl) });

      var attributeManager = this.state.attributeManager;
      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instancePositions: { size: 3, accessor: ['getCentroid', 'getElevation'],
          update: this.calculateInstancePositions },
        instanceColors: { size: 4, type: gl.UNSIGNED_BYTE, accessor: 'getColor',
          update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */

      this.updateRadiusAngle();
    }
  }, {
    key: 'updateAttribute',
    value: function updateAttribute(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (props.fp64 !== oldProps.fp64) {
        var attributeManager = this.state.attributeManager;

        attributeManager.invalidateAll();

        if (props.fp64 && props.projectionMode === _lib.COORDINATE_SYSTEM.LNG_LAT) {
          attributeManager.addInstanced({
            instancePositions64xyLow: {
              size: 2,
              accessor: 'getCentroid',
              update: this.calculateInstancePositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instancePositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(HexagonCellLayer.prototype.__proto__ || Object.getPrototypeOf(HexagonCellLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      var viewportChanged = changeFlags.viewportChanged;
      var model = this.state.model;

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
      var angle = void 0;
      var radius = void 0;
      var hexagonVertices = this.props.hexagonVertices;


      if (Array.isArray(hexagonVertices) && hexagonVertices.length >= 6) {

        // calculate angle and vertices from hexagonVertices if provided
        var vertices = this.props.hexagonVertices;

        var vertex0 = vertices[0];
        var vertex3 = vertices[3];

        // transform to space coordinates
        var spaceCoord0 = this.projectFlat(vertex0);
        var spaceCoord3 = this.projectFlat(vertex3);

        // distance between two close centroids
        var dx = spaceCoord0[0] - spaceCoord3[0];
        var dy = spaceCoord0[1] - spaceCoord3[1];
        var dxy = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle that the perpendicular hexagon vertex axis is tilted
        angle = Math.acos(dx / dxy) * -Math.sign(dy) + Math.PI / 2;
        radius = dxy / 2;
      } else if (this.props.radius && Number.isFinite(this.props.angle)) {

        // if no hexagonVertices provided, try use radius & angle
        var viewport = this.context.viewport;

        var _viewport$getDistance = viewport.getDistanceScales(),
            pixelsPerMeter = _viewport$getDistance.pixelsPerMeter;

        angle = this.props.angle;
        radius = this.props.radius * pixelsPerMeter[0];
      }

      this.setUniforms({
        angle: angle,
        radius: radius
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
      var _props = this.props,
          opacity = _props.opacity,
          elevationScale = _props.elevationScale,
          extruded = _props.extruded,
          coverage = _props.coverage,
          lightSettings = _props.lightSettings;


      this.setUniforms(Object.assign({}, {
        extruded: extruded,
        opacity: opacity,
        coverage: coverage,
        elevationScale: elevationScale
      }, lightSettings));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
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
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;

      _get(HexagonCellLayer.prototype.__proto__ || Object.getPrototypeOf(HexagonCellLayer.prototype), 'draw', this).call(this, { uniforms: Object.assign({}, uniforms) });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getCentroid = _props2.getCentroid,
          getElevation = _props2.getElevation;
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
    key: 'calculateInstancePositions64xyLow',
    value: function calculateInstancePositions64xyLow(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getCentroid = _props3.getCentroid;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var position = getCentroid(object);
          value[i++] = (0, _fp.fp64ify)(position[0])[1];
          value[i++] = (0, _fp.fp64ify)(position[1])[1];
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
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getColor(object) || DEFAULT_COLOR;

          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = Number.isFinite(color[3]) ? color[3] : DEFAULT_COLOR[3];
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

  return HexagonCellLayer;
}(_lib.Layer);

exports.default = HexagonCellLayer;


HexagonCellLayer.layerName = 'HexagonCellLayer';
HexagonCellLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9oZXhhZ29uLWNlbGwtbGF5ZXIvaGV4YWdvbi1jZWxsLWxheWVyLmpzIl0sIm5hbWVzIjpbInBvc2l0aW9uc0FyZUVxdWFsIiwidjEiLCJ2MiIsIkRFRkFVTFRfQ09MT1IiLCJkZWZhdWx0UHJvcHMiLCJoZXhhZ29uVmVydGljZXMiLCJyYWRpdXMiLCJhbmdsZSIsImNvdmVyYWdlIiwiZWxldmF0aW9uU2NhbGUiLCJleHRydWRlZCIsImZwNjQiLCJnZXRDZW50cm9pZCIsIngiLCJjZW50cm9pZCIsImdldENvbG9yIiwiY29sb3IiLCJnZXRFbGV2YXRpb24iLCJlbGV2YXRpb24iLCJsaWdodFNldHRpbmdzIiwibGlnaHRzUG9zaXRpb24iLCJhbWJpZW50UmF0aW8iLCJkaWZmdXNlUmF0aW8iLCJzcGVjdWxhclJhdGlvIiwibGlnaHRzU3RyZW5ndGgiLCJudW1iZXJPZkxpZ2h0cyIsIkhleGFnb25DZWxsTGF5ZXIiLCJwcm9wcyIsIm1pc3NpbmdQcm9wcyIsIk51bWJlciIsImlzRmluaXRlIiwib25jZSIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsInZzIiwiZnMiLCJtb2R1bGVzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsImF0dHJpYnV0ZU1hbmFnZXIiLCJzdGF0ZSIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZUNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMiLCJ1cGRhdGVSYWRpdXNBbmdsZSIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJpbnZhbGlkYXRlQWxsIiwicHJvamVjdGlvbk1vZGUiLCJMTkdfTEFUIiwiaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwicmVtb3ZlIiwidXBkYXRlQXR0cmlidXRlIiwidmlld3BvcnRDaGFuZ2VkIiwidmVydGljZXNDaGFuZ2VkIiwidXBkYXRlVW5pZm9ybXMiLCJ2ZXJ0aWNlcyIsInZlcnRleDAiLCJ2ZXJ0ZXgzIiwic3BhY2VDb29yZDAiLCJwcm9qZWN0RmxhdCIsInNwYWNlQ29vcmQzIiwiZHgiLCJkeSIsImR4eSIsIk1hdGgiLCJzcXJ0IiwiYWNvcyIsInNpZ24iLCJQSSIsInZpZXdwb3J0IiwiZ2V0RGlzdGFuY2VTY2FsZXMiLCJwaXhlbHNQZXJNZXRlciIsInNldFVuaWZvcm1zIiwidG9wUmFkaXVzIiwiYm90dG9tUmFkaXVzIiwidG9wQ2FwIiwiYm90dG9tQ2FwIiwiaGVpZ2h0IiwibnJhZGlhbCIsIm52ZXJ0aWNhbCIsIm9wYWNpdHkiLCJPYmplY3QiLCJhc3NpZ24iLCJzaGFkZXJzIiwiZ2V0U2hhZGVycyIsImlkIiwiZ2VvbWV0cnkiLCJnZXRDeWxpbmRlckdlb21ldHJ5IiwiaXNJbnN0YW5jZWQiLCJ1bmlmb3JtcyIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsImkiLCJvYmplY3QiLCJsb24iLCJsYXQiLCJwb3NpdGlvbiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBb0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUE3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBYUEsU0FBU0EsaUJBQVQsQ0FBMkJDLEVBQTNCLEVBQStCQyxFQUEvQixFQUFtQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBT0QsT0FBT0MsRUFBUCxJQUNMRCxNQUFNQyxFQUFOLElBQVlELEdBQUcsQ0FBSCxFQUFNLENBQU4sTUFBYUMsR0FBRyxD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QUZXLENBRTFCRSxLQUYwQjtBQUFBLFVBRW5CMUQsSUFGbUIsR0FFWHdELFNBRlcsQ0FFbkJ4RCxJQUZtQjs7QUFHakMsVUFBSTJELElBQUksQ0FBUjtBQUhpQztBQUFBO0FBQUE7O0FBQUE7QUFJakMsOEJBQXFCRixJQUFyQixtSUFBMkI7QUFBQSxjQUFoQkcsTUFBZ0I7O0FBQ3pCLGNBQU0zRixRQUFRRCxTQUFTNEYsTUFBVCxLQUFvQnhHLGFBQWxDOztBQUVBc0csZ0JBQU1DLElBQUksQ0FBVixJQUFlMUYsTUFBTSxDQUFOLENBQWY7QUFDQXlGLGdCQUFNQyxJQUFJLENBQVYsSUFBZTFGLE1BQU0sQ0FBTixDQUFmO0FBQ0F5RixnQkFBTUMsSUFBSSxDQUFWLElBQWUxRixNQUFNLENBQU4sQ0FBZjtBQUNBeUYsZ0JBQU1DLElBQUksQ0FBVixJQUFlN0UsT0FBT0MsUUFBUCxDQUFnQmQsTUFBTSxDQUFOLENBQWhCLElBQTRCQSxNQUFNLENBQU4sQ0FBNUIsR0FBdUNiLGNBQWMsQ0FBZCxDQUF0RDtBQUNBdUcsZUFBSzNELElBQUw7QUFDRDtBQVpnQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBYWxDOzs7Ozs7a0JBNU5rQnJCLGdCOzs7QUErTnJCQSxpQkFBaUJxRixTQUFqQixHQUE2QixrQkFBN0I7QUFDQXJGLGlCQUFpQnRCLFlBQWpCLEdBQWdDQSxZQUFoQyIsImZpbGUiOiJoZXhhZ29uLWNlbGwtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTYgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IHthc3NlbWJsZVNoYWRlcnN9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge01vZGVsLCBDeWxpbmRlckdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7bG9nfSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuaW1wb3J0IHtmcDY0aWZ5LCBlbmFibGU2NGJpdFN1cHBvcnR9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscy9mcDY0JztcbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU19IGZyb20gJy4uLy4uLy4uL2xpYic7XG5cbmltcG9ydCBoZXhDZWxsVmVydGV4IGZyb20gJy4vaGV4YWdvbi1jZWxsLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCBoZXhDZWxsVmVydGV4NjQgZnJvbSAnLi9oZXhhZ29uLWNlbGwtbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGhleENlbGxGcmFnbWVudCBmcm9tICcuL2hleGFnb24tY2VsbC1sYXllci1mcmFnbWVudC5nbHNsJztcblxuZnVuY3Rpb24gcG9zaXRpb25zQXJlRXF1YWwodjEsIHYyKSB7XG4gIC8vIEhleCBwb3NpdGlvbnMgYXJlIGV4cGVjdGVkIHRvIGNoYW5nZSBlbnRpcmVseSwgbm90IHRvIG1haW50YWluIHNvbWVcbiAgLy8gcG9zaXRpb25zIGFuZCBjaGFuZ2Ugb3RoZXJzLiBSaWdodCBub3cgd2Ugb25seSBjaGVjayBhIHNpbmdsZSB2ZXJ0ZXgsXG4gIC8vIGJlY2F1c2UgSDMgZ3VhcmFudGVlcyBvcmRlciwgYnV0IGV2ZW4gaWYgdGhhdCB3YXNuJ3QgdHJ1ZSwgdGhpcyB3b3VsZCBvbmx5XG4gIC8vIHJldHVybiBhIGZhbHNlIHBvc2l0aXZlIGZvciBhZGphY2VudCBoZXhhZ29ucywgd2hpY2ggaXMgY2xvc2UgZW5vdWdoIGZvclxuICAvLyBvdXIgcHVycG9zZXMuXG4gIHJldHVybiB2MSA9PT0gdjIgfHwgKFxuICAgIHYxICYmIHYyICYmIHYxWzBdWzBdID09PSB2MlswXVswXSAmJiB2MVswXVsxXSA9PT0gdjJbMF1bMV1cbiAgKTtcbn1cblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFsyNTUsIDAsIDI1NSwgMjU1XTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBoZXhhZ29uVmVydGljZXM6IG51bGwsXG4gIHJhZGl1czogbnVsbCxcbiAgYW5nbGU6IG51bGwsXG4gIGNvdmVyYWdlOiAxLFxuICBlbGV2YXRpb25TY2FsZTogMSxcbiAgZXh0cnVkZWQ6IHRydWUsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIGdldENlbnRyb2lkOiB4ID0+IHguY2VudHJvaWQsXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IsXG4gIGdldEVsZXZhdGlvbjogeCA9PiB4LmVsZXZhdGlvbixcblxuICBsaWdodFNldHRpbmdzOiB7XG4gICAgbGlnaHRzUG9zaXRpb246IFstMTIyLjQ1LCAzNy43NSwgODAwMCwgLTEyMi4wLCAzOC4wMCwgNTAwMF0sXG4gICAgYW1iaWVudFJhdGlvOiAwLjQsXG4gICAgZGlmZnVzZVJhdGlvOiAwLjYsXG4gICAgc3BlY3VsYXJSYXRpbzogMC44LFxuICAgIGxpZ2h0c1N0cmVuZ3RoOiBbMS4yLCAwLjAsIDAuOCwgMC4wXSxcbiAgICBudW1iZXJPZkxpZ2h0czogMlxuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZXhhZ29uQ2VsbExheWVyIGV4dGVuZHMgTGF5ZXIge1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgbGV0IG1pc3NpbmdQcm9wcyA9IGZhbHNlO1xuICAgIGlmICghcHJvcHMuaGV4YWdvblZlcnRpY2VzICYmICghcHJvcHMucmFkaXVzIHx8ICFOdW1iZXIuaXNGaW5pdGUocHJvcHMuYW5nbGUpKSkge1xuICAgICAgbG9nLm9uY2UoMCwgJ0hleGFnb25MYXllcjogRWl0aGVyIGhleGFnb25WZXJ0aWNlcyBvciByYWRpdXMgYW5kIGFuZ2VsIGFyZSAnICtcbiAgICAgICAgJ25lZWRlZCB0byBjYWxjdWxhdGUgcHJpbWl0aXZlIGhleGFnb24uJyk7XG4gICAgICBtaXNzaW5nUHJvcHMgPSB0cnVlO1xuXG4gICAgfSBlbHNlIGlmIChwcm9wcy5oZXhhZ29uVmVydGljZXMgJiYgKCFBcnJheS5pc0FycmF5KHByb3BzLmhleGFnb25WZXJ0aWNlcykgfHxcbiAgICAgIHByb3BzLmhleGFnb25WZXJ0aWNlcy5sZW5ndGggPCA2KSkge1xuICAgICAgbG9nLm9uY2UoMCwgJ0hleGFnb25MYXllcjogSGV4YWdvblZlcnRpY2VzIG5lZWRzIHRvIGJlIGFuIGFycmF5IG9mIDYgcG9pbnRzJyk7XG5cbiAgICAgIG1pc3NpbmdQcm9wcyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKG1pc3NpbmdQcm9wcykge1xuICAgICAgbG9nLm9uY2UoMCwgJ05vdyB1c2luZyAxMDAwIG1ldGVyIGFzIGRlZmF1bHQgcmFkaXVzLCAwIGFzIGRlZmF1bHQgYW5nZWwnKTtcbiAgICAgIHByb3BzLnJhZGl1cyA9IDEwMDA7XG4gICAgICBwcm9wcy5hbmdsZSA9IDA7XG4gICAgfVxuXG4gICAgc3VwZXIocHJvcHMpO1xuICB9XG5cbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4gZW5hYmxlNjRiaXRTdXBwb3J0KHRoaXMucHJvcHMpID8ge1xuICAgICAgdnM6IGhleENlbGxWZXJ0ZXg2NCwgZnM6IGhleENlbGxGcmFnbWVudCwgbW9kdWxlczogWydmcDY0JywgJ3Byb2plY3Q2NCcsICdsaWdodGluZyddXG4gICAgfSA6IHtcbiAgICAgIHZzOiBoZXhDZWxsVmVydGV4LCBmczogaGV4Q2VsbEZyYWdtZW50LCBtb2R1bGVzOiBbJ2xpZ2h0aW5nJ11cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIERlY2tHTCBjYWxscyBpbml0aWFsaXplU3RhdGUgd2hlbiBHTCBjb250ZXh0IGlzIGF2YWlsYWJsZVxuICAgKiBFc3NlbnRpYWxseSBhIGRlZmVycmVkIGNvbnN0cnVjdG9yXG4gICAqL1xuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge3NpemU6IDMsIGFjY2Vzc29yOiBbJ2dldENlbnRyb2lkJywgJ2dldEVsZXZhdGlvbiddLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnN9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBnbC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldENvbG9yJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuXG4gICAgdGhpcy51cGRhdGVSYWRpdXNBbmdsZSgpO1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG5cbiAgICAgIGlmIChwcm9wcy5mcDY0ICYmIHByb3BzLnByb2plY3Rpb25Nb2RlID09PSBDT09SRElOQVRFX1NZU1RFTS5MTkdfTEFUKSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgICAgICBpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3c6IHtcbiAgICAgICAgICAgIHNpemU6IDIsXG4gICAgICAgICAgICBhY2Nlc3NvcjogJ2dldENlbnRyb2lkJyxcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3dcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoW1xuICAgICAgICAgICdpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3cnXG4gICAgICAgIF0pO1xuICAgICAgfVxuXG4gICAgfVxuICB9XG5cbiAgdXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgc3VwZXIudXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcblxuICAgIGNvbnN0IHZpZXdwb3J0Q2hhbmdlZCA9IGNoYW5nZUZsYWdzLnZpZXdwb3J0Q2hhbmdlZDtcbiAgICBjb25zdCB7bW9kZWx9ID0gdGhpcy5zdGF0ZTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgcG9zaXRpb25zIGluIHRoZSBtb2RlbCBpZiB0aGV5J3ZlIGNoYW5nZXNcbiAgICBjb25zdCB2ZXJ0aWNlc0NoYW5nZWQgPVxuICAgICAgIXBvc2l0aW9uc0FyZUVxdWFsKG9sZFByb3BzLmhleGFnb25WZXJ0aWNlcywgcHJvcHMuaGV4YWdvblZlcnRpY2VzKTtcblxuICAgIGlmIChtb2RlbCAmJiAodmVydGljZXNDaGFuZ2VkIHx8IHZpZXdwb3J0Q2hhbmdlZCkpIHtcbiAgICAgIHRoaXMudXBkYXRlUmFkaXVzQW5nbGUoKTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVVbmlmb3JtcygpO1xuICB9XG5cbiAgdXBkYXRlUmFkaXVzQW5nbGUoKSB7XG4gICAgbGV0IGFuZ2xlO1xuICAgIGxldCByYWRpdXM7XG4gICAgY29uc3Qge2hleGFnb25WZXJ0aWNlc30gPSB0aGlzLnByb3BzO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGV4YWdvblZlcnRpY2VzKSAmJiBoZXhhZ29uVmVydGljZXMubGVuZ3RoID49IDYpIHtcblxuICAgICAgLy8gY2FsY3VsYXRlIGFuZ2xlIGFuZCB2ZXJ0aWNlcyBmcm9tIGhleGFnb25WZXJ0aWNlcyBpZiBwcm92aWRlZFxuICAgICAgY29uc3QgdmVydGljZXMgPSB0aGlzLnByb3BzLmhleGFnb25WZXJ0aWNlcztcblxuICAgICAgY29uc3QgdmVydGV4MCA9IHZlcnRpY2VzWzBdO1xuICAgICAgY29uc3QgdmVydGV4MyA9IHZlcnRpY2VzWzNdO1xuXG4gICAgICAvLyB0cmFuc2Zvcm0gdG8gc3BhY2UgY29vcmRpbmF0ZXNcbiAgICAgIGNvbnN0IHNwYWNlQ29vcmQwID0gdGhpcy5wcm9qZWN0RmxhdCh2ZXJ0ZXgwKTtcbiAgICAgIGNvbnN0IHNwYWNlQ29vcmQzID0gdGhpcy5wcm9qZWN0RmxhdCh2ZXJ0ZXgzKTtcblxuICAgICAgLy8gZGlzdGFuY2UgYmV0d2VlbiB0d28gY2xvc2UgY2VudHJvaWRzXG4gICAgICBjb25zdCBkeCA9IHNwYWNlQ29vcmQwWzBdIC0gc3BhY2VDb29yZDNbMF07XG4gICAgICBjb25zdCBkeSA9IHNwYWNlQ29vcmQwWzFdIC0gc3BhY2VDb29yZDNbMV07XG4gICAgICBjb25zdCBkeHkgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgYW5nbGUgdGhhdCB0aGUgcGVycGVuZGljdWxhciBoZXhhZ29uIHZlcnRleCBheGlzIGlzIHRpbHRlZFxuICAgICAgYW5nbGUgPSBNYXRoLmFjb3MoZHggLyBkeHkpICogLU1hdGguc2lnbihkeSkgKyBNYXRoLlBJIC8gMjtcbiAgICAgIHJhZGl1cyA9IGR4eSAvIDI7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMucmFkaXVzICYmIE51bWJlci5pc0Zpbml0ZSh0aGlzLnByb3BzLmFuZ2xlKSkge1xuXG4gICAgICAvLyBpZiBubyBoZXhhZ29uVmVydGljZXMgcHJvdmlkZWQsIHRyeSB1c2UgcmFkaXVzICYgYW5nbGVcbiAgICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgICBjb25zdCB7cGl4ZWxzUGVyTWV0ZXJ9ID0gdmlld3BvcnQuZ2V0RGlzdGFuY2VTY2FsZXMoKTtcblxuICAgICAgYW5nbGUgPSB0aGlzLnByb3BzLmFuZ2xlO1xuICAgICAgcmFkaXVzID0gdGhpcy5wcm9wcy5yYWRpdXMgKiBwaXhlbHNQZXJNZXRlclswXTtcblxuICAgIH1cblxuICAgIHRoaXMuc2V0VW5pZm9ybXMoe1xuICAgICAgYW5nbGUsXG4gICAgICByYWRpdXNcbiAgICB9KTtcbiAgfVxuXG4gIGdldEN5bGluZGVyR2VvbWV0cnkocmFkaXVzKSB7XG4gICAgcmV0dXJuIG5ldyBDeWxpbmRlckdlb21ldHJ5KHtcbiAgICAgIHJhZGl1cyxcbiAgICAgIHRvcFJhZGl1czogcmFkaXVzLFxuICAgICAgYm90dG9tUmFkaXVzOiByYWRpdXMsXG4gICAgICB0b3BDYXA6IHRydWUsXG4gICAgICBib3R0b21DYXA6IHRydWUsXG4gICAgICBoZWlnaHQ6IDEsXG4gICAgICBucmFkaWFsOiA2LFxuICAgICAgbnZlcnRpY2FsOiAxXG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVVbmlmb3JtcygpIHtcbiAgICBjb25zdCB7b3BhY2l0eSwgZWxldmF0aW9uU2NhbGUsIGV4dHJ1ZGVkLCBjb3ZlcmFnZSwgbGlnaHRTZXR0aW5nc30gPSB0aGlzLnByb3BzO1xuXG4gICAgdGhpcy5zZXRVbmlmb3JtcyhPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBleHRydWRlZCxcbiAgICAgIG9wYWNpdHksXG4gICAgICBjb3ZlcmFnZSxcbiAgICAgIGVsZXZhdGlvblNjYWxlXG4gICAgfSxcbiAgICBsaWdodFNldHRpbmdzKSk7XG4gIH1cblxuICBfZ2V0TW9kZWwoZ2wpIHtcbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKHtcbiAgICAgIGdsLFxuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGZzOiBzaGFkZXJzLmZzLFxuICAgICAgZ2VvbWV0cnk6IHRoaXMuZ2V0Q3lsaW5kZXJHZW9tZXRyeSgxKSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBzdXBlci5kcmF3KHt1bmlmb3JtczogT2JqZWN0LmFzc2lnbih7fSwgdW5pZm9ybXMpfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q2VudHJvaWQsIGdldEVsZXZhdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IFtsb24sIGxhdF0gPSBnZXRDZW50cm9pZChvYmplY3QpO1xuICAgICAgY29uc3QgZWxldmF0aW9uID0gZ2V0RWxldmF0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBsb247XG4gICAgICB2YWx1ZVtpICsgMV0gPSBsYXQ7XG4gICAgICB2YWx1ZVtpICsgMl0gPSBlbGV2YXRpb24gfHwgdGhpcy5wcm9wcy5lbGV2YXRpb247XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDZW50cm9pZH0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0Q2VudHJvaWQob2JqZWN0KTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzBdKVsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzFdKVsxXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCkgfHwgREVGQVVMVF9DT0xPUjtcblxuICAgICAgdmFsdWVbaSArIDBdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSArIDNdID0gTnVtYmVyLmlzRmluaXRlKGNvbG9yWzNdKSA/IGNvbG9yWzNdIDogREVGQVVMVF9DT0xPUlszXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cbn1cblxuSGV4YWdvbkNlbGxMYXllci5sYXllck5hbWUgPSAnSGV4YWdvbkNlbGxMYXllcic7XG5IZXhhZ29uQ2VsbExheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==
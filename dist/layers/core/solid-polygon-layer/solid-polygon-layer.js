'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _utils = require('../../../lib/utils');

var _luma = require('luma.gl');

var _fp = require('../../../lib/utils/fp64');

var _polygonTesselator = require('./polygon-tesselator');

var _polygonTesselatorExtruded = require('./polygon-tesselator-extruded');

var _solidPolygonLayerVertex = require('./solid-polygon-layer-vertex.glsl');

var _solidPolygonLayerVertex2 = _interopRequireDefault(_solidPolygonLayerVertex);

var _solidPolygonLayerVertex3 = require('./solid-polygon-layer-vertex-64.glsl');

var _solidPolygonLayerVertex4 = _interopRequireDefault(_solidPolygonLayerVertex3);

var _solidPolygonLayerFragment = require('./solid-polygon-layer-fragment.glsl');

var _solidPolygonLayerFragment2 = _interopRequireDefault(_solidPolygonLayerFragment);

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

// Polygon geometry generation is managed by the polygon tesselator


var defaultProps = {
  // Whether to extrude in 2.5D
  extruded: false,
  // Whether to draw a GL.LINES wireframe of the polygon
  wireframe: false,
  fp64: false,

  // Accessor for polygon geometry
  getPolygon: function getPolygon(f) {
    return (0, _utils.get)(f, 'polygon') || (0, _utils.get)(f, 'geometry.coordinates');
  },
  // Accessor for extrusion height
  getElevation: function getElevation(f) {
    return (0, _utils.get)(f, 'elevation') || (0, _utils.get)(f, 'properties.height') || 0;
  },
  // Accessor for color
  getColor: function getColor(f) {
    return (0, _utils.get)(f, 'color') || (0, _utils.get)(f, 'properties.color');
  },

  // Optional settings for 'lighting' shader module
  lightSettings: {
    lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.00, 5000],
    ambientRatio: 0.05,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [2.0, 0.0, 0.0, 0.0],
    numberOfLights: 2
  }
};

var SolidPolygonLayer = function (_Layer) {
  _inherits(SolidPolygonLayer, _Layer);

  function SolidPolygonLayer() {
    _classCallCheck(this, SolidPolygonLayer);

    return _possibleConstructorReturn(this, (SolidPolygonLayer.__proto__ || Object.getPrototypeOf(SolidPolygonLayer)).apply(this, arguments));
  }

  _createClass(SolidPolygonLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _solidPolygonLayerVertex4.default, fs: _solidPolygonLayerFragment2.default, modules: ['fp64', 'project64', 'lighting']
      } : {
        vs: _solidPolygonLayerVertex2.default, fs: _solidPolygonLayerFragment2.default, modules: ['lighting']
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({
        model: this._getModel(gl),
        numInstances: 0,
        IndexType: gl.getExtension('OES_element_index_uint') ? Uint32Array : Uint16Array
      });

      var attributeManager = this.state.attributeManager;

      var noAlloc = true;
      /* eslint-disable max-len */
      attributeManager.add({
        indices: { size: 1, isIndexed: true, update: this.calculateIndices, noAlloc: noAlloc },
        positions: { size: 3, accessor: 'getElevation', update: this.calculatePositions, noAlloc: noAlloc },
        normals: { size: 3, update: this.calculateNormals, noAlloc: noAlloc },
        colors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateColors, noAlloc: noAlloc },
        pickingColors: { size: 3, type: _luma.GL.UNSIGNED_BYTE, update: this.calculatePickingColors, noAlloc: noAlloc }
      });
      /* eslint-enable max-len */
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
          attributeManager.add({
            positions64xyLow: { size: 2, update: this.calculatePositionsLow }
          });
        } else {
          attributeManager.remove(['positions64xyLow']);
        }
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
      var _props = this.props,
          extruded = _props.extruded,
          lightSettings = _props.lightSettings;


      this.state.model.render(Object.assign({}, uniforms, {
        extruded: extruded ? 1.0 : 0.0
      }, lightSettings));
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref3) {
      var props = _ref3.props,
          oldProps = _ref3.oldProps,
          changeFlags = _ref3.changeFlags;

      _get(SolidPolygonLayer.prototype.__proto__ || Object.getPrototypeOf(SolidPolygonLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

      var geometryChanged = this.updateGeometry({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      // Re-generate model if geometry changed
      if (geometryChanged) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'updateGeometry',
    value: function updateGeometry(_ref4) {
      var _this2 = this;

      var props = _ref4.props,
          oldProps = _ref4.oldProps,
          changeFlags = _ref4.changeFlags;

      var regenerateModel = changeFlags.dataChanged || props.extruded !== oldProps.extruded || props.wireframe !== oldProps.wireframe || props.fp64 !== oldProps.fp64;

      if (regenerateModel) {
        var getPolygon = props.getPolygon,
            extruded = props.extruded,
            wireframe = props.wireframe,
            getElevation = props.getElevation;

        // TODO - avoid creating a temporary array here: let the tesselator iterate

        var polygons = props.data.map(getPolygon);

        this.setState({
          polygonTesselator: !extruded ? new _polygonTesselator.PolygonTesselator({ polygons: polygons, fp64: this.props.fp64 }) : new _polygonTesselatorExtruded.PolygonTesselatorExtruded({ polygons: polygons, wireframe: wireframe,
            getHeight: function getHeight(polygonIndex) {
              return getElevation(_this2.props.data[polygonIndex]);
            },
            fp64: this.props.fp64
          })
        });

        this.state.attributeManager.invalidateAll();
      }

      return regenerateModel;
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
        geometry: new _luma.Geometry({
          drawMode: this.props.wireframe ? _luma.GL.LINES : _luma.GL.TRIANGLES
        }),
        vertexCount: 0,
        isIndexed: true
      });
    }
  }, {
    key: 'calculateIndices',
    value: function calculateIndices(attribute) {
      attribute.value = this.state.polygonTesselator.indices();
      attribute.target = _luma.GL.ELEMENT_ARRAY_BUFFER;
      this.state.model.setVertexCount(attribute.value.length / attribute.size);
    }
  }, {
    key: 'calculatePositions',
    value: function calculatePositions(attribute) {
      attribute.value = this.state.polygonTesselator.positions().positions;
    }
  }, {
    key: 'calculatePositionsLow',
    value: function calculatePositionsLow(attribute) {
      attribute.value = this.state.polygonTesselator.positions().positions64xyLow;
    }
  }, {
    key: 'calculateNormals',
    value: function calculateNormals(attribute) {
      attribute.value = this.state.polygonTesselator.normals();
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _this3 = this;

      attribute.value = this.state.polygonTesselator.colors({
        getColor: function getColor(polygonIndex) {
          return _this3.props.getColor(_this3.props.data[polygonIndex]);
        }
      });
    }

    // Override the default picking colors calculation

  }, {
    key: 'calculatePickingColors',
    value: function calculatePickingColors(attribute) {
      attribute.value = this.state.polygonTesselator.pickingColors();
    }
  }]);

  return SolidPolygonLayer;
}(_lib.Layer);

exports.default = SolidPolygonLayer;


SolidPolygonLayer.layerName = 'SolidPolygonLayer';
SolidPolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zb2xpZC1wb2x5Z29uLWxheWVyL3NvbGlkLXBvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdFByb3BzIiwiZXh0cnVkZWQiLCJ3aXJlZnJhbWUiLCJmcDY0IiwiZ2V0UG9seWdvbiIsImYiLCJnZXRFbGV2YXRpb24iLCJnZXRDb2xvciIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiU29saWRQb2x5Z29uTGF5ZXIiLCJwcm9wcyIsInZzIiwiZnMiLCJtb2R1bGVzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsIm51bUluc3RhbmNlcyIsIkluZGV4VHlwZSIsImdldEV4dGVuc2lvbiIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJub0FsbG9jIiwiYWRkIiwiaW5kaWNlcyIsInNpemUiLCJpc0luZGV4ZWQiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbmRpY2VzIiwicG9zaXRpb25zIiwiYWNjZXNzb3IiLCJjYWxjdWxhdGVQb3NpdGlvbnMiLCJub3JtYWxzIiwiY2FsY3VsYXRlTm9ybWFscyIsImNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlQ29sb3JzIiwicGlja2luZ0NvbG9ycyIsImNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMiLCJvbGRQcm9wcyIsImNoYW5nZUZsYWdzIiwiaW52YWxpZGF0ZUFsbCIsInByb2plY3Rpb25Nb2RlIiwiTE5HX0xBVCIsInBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVQb3NpdGlvbnNMb3ciLCJyZW1vdmUiLCJ1bmlmb3JtcyIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsImdlb21ldHJ5Q2hhbmdlZCIsInVwZGF0ZUdlb21ldHJ5IiwidXBkYXRlQXR0cmlidXRlIiwicmVnZW5lcmF0ZU1vZGVsIiwiZGF0YUNoYW5nZWQiLCJwb2x5Z29ucyIsImRhdGEiLCJtYXAiLCJwb2x5Z29uVGVzc2VsYXRvciIsImdldEhlaWdodCIsInBvbHlnb25JbmRleCIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiTElORVMiLCJUUklBTkdMRVMiLCJ2ZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZSIsInZhbHVlIiwidGFyZ2V0IiwiRUxFTUVOVF9BUlJBWV9CVUZGRVIiLCJzZXRWZXJ0ZXhDb3VudCIsImxlbmd0aCIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFJQTs7QUFDQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVNBOzs7QUFRQSxJQUFNQSxlQUFlO0FBQ25CO0FBQ0FDLFlBQVUsS0FGUztBQUduQjtBQUNBQyxhQUFXLEtBSlE7QUFLbkJDLFFBQU0sS0FMYTs7QUFPbkI7QUFDQUMsY0FBWTtBQUFBLFdBQUssZ0JBQUlDLENBQUosRUFBTyxTQUFQLEtBQXFCLGdCQUFJQSxDQUFKLEVBQU8sc0JBQVAsQ0FBMUI7QUFBQSxHQVJPO0FBU25CO0FBQ0FDLGdCQUFjO0FBQUEsV0FBSyxnQkFBSUQsQ0FBSixFQUFPLFdBQVAsS0FBdUIsZ0JBQUlBLENBQUosRUFBTyxtQkFBUCxDQUF2QixJQUFzRCxDQUEzRDtBQUFBLEdBVks7QUFXbkI7QUFDQUUsWUFBVTtBQUFBLFdBQUssZ0JBQUlGLENBQUosRUFBTyxPQUFQLEtBQW1CLGdCQUFJQSxDQUFKLEVBQU8sa0JBQVAsQ0FBeEI7QUFBQSxHQVpTOztB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YUFBN0IsRUFBbEI7QUFDRDs7Ozs7O2tCQXZJa0JqQyxpQjs7O0FBMElyQkEsa0JBQWtCd0UsU0FBbEIsR0FBOEIsbUJBQTlCO0FBQ0F4RSxrQkFBa0JmLFlBQWxCLEdBQWlDQSxZQUFqQyIsImZpbGUiOiJzb2xpZC1wb2x5Z29uLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE2IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllcn0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCB7YXNzZW1ibGVTaGFkZXJzfSBmcm9tICcuLi8uLi8uLi9zaGFkZXItdXRpbHMnO1xuaW1wb3J0IHtnZXR9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtlbmFibGU2NGJpdFN1cHBvcnR9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscy9mcDY0JztcbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU19IGZyb20gJy4uLy4uLy4uL2xpYic7XG5cbi8vIFBvbHlnb24gZ2VvbWV0cnkgZ2VuZXJhdGlvbiBpcyBtYW5hZ2VkIGJ5IHRoZSBwb2x5Z29uIHRlc3NlbGF0b3JcbmltcG9ydCB7UG9seWdvblRlc3NlbGF0b3J9IGZyb20gJy4vcG9seWdvbi10ZXNzZWxhdG9yJztcbmltcG9ydCB7UG9seWdvblRlc3NlbGF0b3JFeHRydWRlZH0gZnJvbSAnLi9wb2x5Z29uLXRlc3NlbGF0b3ItZXh0cnVkZWQnO1xuXG5pbXBvcnQgc29saWRQb2x5Z29uVmVydGV4IGZyb20gJy4vc29saWQtcG9seWdvbi1sYXllci12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgc29saWRQb2x5Z29uVmVydGV4NjQgZnJvbSAnLi9zb2xpZC1wb2x5Z29uLWxheWVyLXZlcnRleC02NC5nbHNsJztcbmltcG9ydCBzb2xpZFBvbHlnb25GcmFnbWVudCBmcm9tICcuL3NvbGlkLXBvbHlnb24tbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgLy8gV2hldGhlciB0byBleHRydWRlIGluIDIuNURcbiAgZXh0cnVkZWQ6IGZhbHNlLFxuICAvLyBXaGV0aGVyIHRvIGRyYXcgYSBHTC5MSU5FUyB3aXJlZnJhbWUgb2YgdGhlIHBvbHlnb25cbiAgd2lyZWZyYW1lOiBmYWxzZSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgLy8gQWNjZXNzb3IgZm9yIHBvbHlnb24gZ2VvbWV0cnlcbiAgZ2V0UG9seWdvbjogZiA9PiBnZXQoZiwgJ3BvbHlnb24nKSB8fCBnZXQoZiwgJ2dlb21ldHJ5LmNvb3JkaW5hdGVzJyksXG4gIC8vIEFjY2Vzc29yIGZvciBleHRydXNpb24gaGVpZ2h0XG4gIGdldEVsZXZhdGlvbjogZiA9PiBnZXQoZiwgJ2VsZXZhdGlvbicpIHx8IGdldChmLCAncHJvcGVydGllcy5oZWlnaHQnKSB8fCAwLFxuICAvLyBBY2Nlc3NvciBmb3IgY29sb3JcbiAgZ2V0Q29sb3I6IGYgPT4gZ2V0KGYsICdjb2xvcicpIHx8IGdldChmLCAncHJvcGVydGllcy5jb2xvcicpLFxuXG4gIC8vIE9wdGlvbmFsIHNldHRpbmdzIGZvciAnbGlnaHRpbmcnIHNoYWRlciBtb2R1bGVcbiAgbGlnaHRTZXR0aW5nczoge1xuICAgIGxpZ2h0c1Bvc2l0aW9uOiBbLTEyMi40NSwgMzcuNzUsIDgwMDAsIC0xMjIuMCwgMzguMDAsIDUwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC4wNSxcbiAgICBkaWZmdXNlUmF0aW86IDAuNixcbiAgICBzcGVjdWxhclJhdGlvOiAwLjgsXG4gICAgbGlnaHRzU3RyZW5ndGg6IFsyLjAsIDAuMCwgMC4wLCAwLjBdLFxuICAgIG51bWJlck9mTGlnaHRzOiAyXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNvbGlkUG9seWdvbkxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcykgPyB7XG4gICAgICB2czogc29saWRQb2x5Z29uVmVydGV4NjQsIGZzOiBzb2xpZFBvbHlnb25GcmFnbWVudCwgbW9kdWxlczogWydmcDY0JywgJ3Byb2plY3Q2NCcsICdsaWdodGluZyddXG4gICAgfSA6IHtcbiAgICAgIHZzOiBzb2xpZFBvbHlnb25WZXJ0ZXgsIGZzOiBzb2xpZFBvbHlnb25GcmFnbWVudCwgbW9kdWxlczogWydsaWdodGluZyddXG4gICAgfTtcbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKSxcbiAgICAgIG51bUluc3RhbmNlczogMCxcbiAgICAgIEluZGV4VHlwZTogZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfZWxlbWVudF9pbmRleF91aW50JykgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5XG4gICAgfSk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IG5vQWxsb2MgPSB0cnVlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZCh7XG4gICAgICBpbmRpY2VzOiB7c2l6ZTogMSwgaXNJbmRleGVkOiB0cnVlLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5kaWNlcywgbm9BbGxvY30sXG4gICAgICBwb3NpdGlvbnM6IHtzaXplOiAzLCBhY2Nlc3NvcjogJ2dldEVsZXZhdGlvbicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnMsIG5vQWxsb2N9LFxuICAgICAgbm9ybWFsczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVOb3JtYWxzLCBub0FsbG9jfSxcbiAgICAgIGNvbG9yczoge3NpemU6IDQsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0Q29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlQ29sb3JzLCBub0FsbG9jfSxcbiAgICAgIHBpY2tpbmdDb2xvcnM6IHtzaXplOiAzLCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUGlja2luZ0NvbG9ycywgbm9BbGxvY31cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuXG4gICAgICBpZiAocHJvcHMuZnA2NCAmJiBwcm9wcy5wcm9qZWN0aW9uTW9kZSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HX0xBVCkge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZCh7XG4gICAgICAgICAgcG9zaXRpb25zNjR4eUxvdzoge3NpemU6IDIsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnNMb3d9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoW1xuICAgICAgICAgICdwb3NpdGlvbnM2NHh5TG93J1xuICAgICAgICBdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBjb25zdCB7ZXh0cnVkZWQsIGxpZ2h0U2V0dGluZ3N9ID0gdGhpcy5wcm9wcztcblxuICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKE9iamVjdC5hc3NpZ24oe30sIHVuaWZvcm1zLCB7XG4gICAgICBleHRydWRlZDogZXh0cnVkZWQgPyAxLjAgOiAwLjBcbiAgICB9LFxuICAgIGxpZ2h0U2V0dGluZ3MpKTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIHN1cGVyLnVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBjb25zdCBnZW9tZXRyeUNoYW5nZWQgPSB0aGlzLnVwZGF0ZUdlb21ldHJ5KHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICAvLyBSZS1nZW5lcmF0ZSBtb2RlbCBpZiBnZW9tZXRyeSBjaGFuZ2VkXG4gICAgaWYgKGdlb21ldHJ5Q2hhbmdlZCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIHVwZGF0ZUdlb21ldHJ5KHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGNvbnN0IHJlZ2VuZXJhdGVNb2RlbCA9IGNoYW5nZUZsYWdzLmRhdGFDaGFuZ2VkIHx8XG4gICAgICBwcm9wcy5leHRydWRlZCAhPT0gb2xkUHJvcHMuZXh0cnVkZWQgfHxcbiAgICAgIHByb3BzLndpcmVmcmFtZSAhPT0gb2xkUHJvcHMud2lyZWZyYW1lIHx8IHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQ7XG5cbiAgICBpZiAocmVnZW5lcmF0ZU1vZGVsKSB7XG4gICAgICBjb25zdCB7Z2V0UG9seWdvbiwgZXh0cnVkZWQsIHdpcmVmcmFtZSwgZ2V0RWxldmF0aW9ufSA9IHByb3BzO1xuXG4gICAgICAvLyBUT0RPIC0gYXZvaWQgY3JlYXRpbmcgYSB0ZW1wb3JhcnkgYXJyYXkgaGVyZTogbGV0IHRoZSB0ZXNzZWxhdG9yIGl0ZXJhdGVcbiAgICAgIGNvbnN0IHBvbHlnb25zID0gcHJvcHMuZGF0YS5tYXAoZ2V0UG9seWdvbik7XG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBwb2x5Z29uVGVzc2VsYXRvcjogIWV4dHJ1ZGVkID9cbiAgICAgICAgICBuZXcgUG9seWdvblRlc3NlbGF0b3Ioe3BvbHlnb25zLCBmcDY0OiB0aGlzLnByb3BzLmZwNjR9KSA6XG4gICAgICAgICAgbmV3IFBvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWQoe3BvbHlnb25zLCB3aXJlZnJhbWUsXG4gICAgICAgICAgICBnZXRIZWlnaHQ6IHBvbHlnb25JbmRleCA9PiBnZXRFbGV2YXRpb24odGhpcy5wcm9wcy5kYXRhW3BvbHlnb25JbmRleF0pLFxuICAgICAgICAgICAgZnA2NDogdGhpcy5wcm9wcy5mcDY0XG4gICAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnN0YXRlLmF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiByZWdlbmVyYXRlTW9kZWw7XG4gIH1cblxuICBfZ2V0TW9kZWwoZ2wpIHtcbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG4gICAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgICBnbCxcbiAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgdnM6IHNoYWRlcnMudnMsXG4gICAgICBmczogc2hhZGVycy5mcyxcbiAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICBkcmF3TW9kZTogdGhpcy5wcm9wcy53aXJlZnJhbWUgPyBHTC5MSU5FUyA6IEdMLlRSSUFOR0xFU1xuICAgICAgfSksXG4gICAgICB2ZXJ0ZXhDb3VudDogMCxcbiAgICAgIGlzSW5kZXhlZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5kaWNlcyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLmluZGljZXMoKTtcbiAgICBhdHRyaWJ1dGUudGFyZ2V0ID0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVI7XG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRWZXJ0ZXhDb3VudChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpO1xuICB9XG5cbiAgY2FsY3VsYXRlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IucG9zaXRpb25zKCkucG9zaXRpb25zO1xuICB9XG4gIGNhbGN1bGF0ZVBvc2l0aW9uc0xvdyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLnBvc2l0aW9ucygpLnBvc2l0aW9uczY0eHlMb3c7XG4gIH1cbiAgY2FsY3VsYXRlTm9ybWFscyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLm5vcm1hbHMoKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLmNvbG9ycyh7XG4gICAgICBnZXRDb2xvcjogcG9seWdvbkluZGV4ID0+IHRoaXMucHJvcHMuZ2V0Q29sb3IodGhpcy5wcm9wcy5kYXRhW3BvbHlnb25JbmRleF0pXG4gICAgfSk7XG4gIH1cblxuICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBwaWNraW5nIGNvbG9ycyBjYWxjdWxhdGlvblxuICBjYWxjdWxhdGVQaWNraW5nQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IucGlja2luZ0NvbG9ycygpO1xuICB9XG59XG5cblNvbGlkUG9seWdvbkxheWVyLmxheWVyTmFtZSA9ICdTb2xpZFBvbHlnb25MYXllcic7XG5Tb2xpZFBvbHlnb25MYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
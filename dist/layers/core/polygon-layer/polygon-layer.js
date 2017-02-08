'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

var _utils = require('../../../lib/utils');

var _polygonTesselator = require('./polygon-tesselator');

var _polygonTesselatorExtruded = require('./polygon-tesselator-extruded');

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


// const defaultColor = [0, 0, 0, 255];

var defaultProps = {
  // Whether to extrude in 2.5D
  extruded: false,
  // Whether to draw a GL.LINES wireframe of the polygon
  // TODO - not clear that this should be part of the main layer
  wireframe: false,
  // Accessor for polygon geometry
  getPolygon: function getPolygon(f) {
    return _utils.Container.get(f, 'polygon') || _utils.Container.get(f, 'geometry.coordinates');
  },
  // Accessor for extrusion height
  getHeight: function getHeight(f) {
    return _utils.Container.get(f, 'height') || _utils.Container.get(f, 'properties.height') || 0;
  },
  // Accessor for color
  getColor: function getColor(f) {
    return _utils.Container.get(f, 'color') || _utils.Container.get(f, 'properties.color');
  },
  // Optional settings for 'lighting' shader module
  lightSettings: {}
};

var PolygonLayer = function (_Layer) {
  _inherits(PolygonLayer, _Layer);

  function PolygonLayer() {
    _classCallCheck(this, PolygonLayer);

    return _possibleConstructorReturn(this, (PolygonLayer.__proto__ || Object.getPrototypeOf(PolygonLayer)).apply(this, arguments));
  }

  _createClass(PolygonLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2016 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n#define SHADER_NAME polygon-layer-vertex-shader\n\nattribute vec3 positions;\nattribute vec3 normals;\nattribute vec4 colors;\nattribute vec3 pickingColors;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\n// PICKING\nuniform float pickingEnabled;\nvarying vec4 vPickingColor;\n\nvoid picking_setPickColor(vec3 pickingColor) {\n  vPickingColor = vec4(pickingColor,  1.);\n}\n\nvec4 picking_setNormalAndPickColors(vec4 color, vec3 pickingColor) {\n  vec4 pickingColor4 = vec4(pickingColor.rgb, 1.);\n  vPickingColor = mix(color, pickingColor4, pickingEnabled);\n  return color;\n}\n\n// vec4 getColor(vec4 color, float opacity, vec3 pickingColor, float renderPickingBuffer) {\n//   vec4 color4 = vec4(color.xyz / 255., color.w / 255. * opacity);\n//   vec4 pickingColor4 = vec4(pickingColor / 255., 1.);\n//   return mix(color4, pickingColor4, renderPickingBuffer);\n// }\n\nvoid main(void) {\n  vec3 position_modelspace = project_position(positions);\n  gl_Position = project_to_clipspace(vec4(position_modelspace, 1.));\n\n  vec3 litColor = lighting_filterColor(position_modelspace, normals, colors.rgb);\n  // vec3 litColor = colors.rgb;\n\n  vec4 color = vec4(litColor.rgb, colors.a * opacity) / 255.;\n  picking_setNormalAndPickColors(color, pickingColors / 255.);\n}\n',
        fs: '// Copyright (c) 2016 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n#define SHADER_NAME polygon-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// PICKING\n// uniform bool pickingEnabled;\nvarying vec4 vPickingColor;\nvec4 picking_getColor() {\n  return vPickingColor;\n}\n// PICKING\n\nvoid main(void) {\n  gl_FragColor = picking_getColor();\n}\n',
        modules: ['lighting']
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({
        model: this.getModel(gl),
        numInstances: 0,
        IndexType: gl.getExtension('OES_element_index_uint') ? Uint32Array : Uint16Array
      });

      var attributeManager = this.state.attributeManager;

      var noAlloc = true;
      /* eslint-disable max-len */
      attributeManager.addDynamic({
        indices: { size: 1, isIndexed: true, update: this.calculateIndices, noAlloc: noAlloc },
        positions: { size: 3, accessor: 'getHeight', update: this.calculatePositions, noAlloc: noAlloc },
        normals: { size: 3, update: this.calculateNormals, noAlloc: noAlloc },
        colors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateColors, noAlloc: noAlloc },
        pickingColors: { size: 3, type: _luma.GL.UNSIGNED_BYTE, update: this.calculatePickingColors, noAlloc: noAlloc }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      this.updateGeometry({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      if (props.extruded) {
        this.setUniforms(_shaderUtils.lighting.updateSettings({
          settings: props.lightSettings,
          prevSettings: oldProps.lightSettings
        }));
      } else {
        this.setUniforms(_shaderUtils.lighting.updateSettings({ settings: { enabled: false } }));
      }
    }
  }, {
    key: 'updateGeometry',
    value: function updateGeometry(_ref2) {
      var _this2 = this;

      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      var geometryChanged = props.extruded !== oldProps.extruded || props.wireframe !== oldProps.wireframe;

      if (changeFlags.dataChanged || geometryChanged) {
        (function () {
          var getPolygon = props.getPolygon,
              extruded = props.extruded,
              wireframe = props.wireframe,
              _getHeight = props.getHeight;

          // TODO - avoid creating a temporary array here: let the tesselator iterate

          var polygons = props.data.map(getPolygon);

          _this2.setState({
            polygonTesselator: !extruded ? new _polygonTesselator.PolygonTesselator({ polygons: polygons }) : new _polygonTesselatorExtruded.PolygonTesselatorExtruded({ polygons: polygons, wireframe: wireframe,
              getHeight: function getHeight(polygonIndex) {
                return _getHeight(_this2.props.data[polygonIndex]);
              }
            })
          });

          _this2.state.attributeManager.invalidateAll();
        })();
      }
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
      attribute.value = this.state.polygonTesselator.positions();
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

  return PolygonLayer;
}(_lib.Layer);

exports.default = PolygonLayer;


PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wb2x5Z29uLWxheWVyL3BvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdFByb3BzIiwiZXh0cnVkZWQiLCJ3aXJlZnJhbWUiLCJnZXRQb2x5Z29uIiwiZ2V0IiwiZiIsImdldEhlaWdodCIsImdldENvbG9yIiwibGlnaHRTZXR0aW5ncyIsIlBvbHlnb25MYXllciIsInZzIiwiZnMiLCJtb2R1bGVzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsImdldE1vZGVsIiwibnVtSW5zdGFuY2VzIiwiSW5kZXhUeXBlIiwiZ2V0RXh0ZW5zaW9uIiwiVWludDMyQXJyYXkiLCJVaW50MTZBcnJheSIsImF0dHJpYnV0ZU1hbmFnZXIiLCJzdGF0ZSIsIm5vQWxsb2MiLCJhZGREeW5hbWljIiwiaW5kaWNlcyIsInNpemUiLCJpc0luZGV4ZWQiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbmRpY2VzIiwicG9zaXRpb25zIiwiYWNjZXNzb3IiLCJjYWxjdWxhdGVQb3NpdGlvbnMiLCJub3JtYWxzIiwiY2FsY3VsYXRlTm9ybWFscyIsImNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlQ29sb3JzIiwicGlja2luZ0NvbG9ycyIsImNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMiLCJwcm9wcyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJ1cGRhdGVHZW9tZXRyeSIsInNldFVuaWZvcm1zIiwidXBkYXRlU2V0dGluZ3MiLCJzZXR0aW5ncyIsInByZXZTZXR0aW5ncyIsImVuYWJsZWQiLCJnZW9tZXRyeUNoYW5nZWQiLCJkYXRhQ2hhbmdlZCIsInBvbHlnb25zIiwiZGF0YSIsIm1hcCIsInBvbHlnb25UZXNzZWxhdG9yIiwicG9seWdvbkluZGV4IiwiaW52YWxpZGF0ZUFsbCIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiTElORVMiLCJUUklBTkdMRVMiLCJ2ZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZSIsInZhbHVlIiwidGFyZ2V0IiwiRUxFTUVOVF9BUlJBWV9CVUZGRVIiLCJzZXRWZXJ0ZXhDb3VudCIsImxlbmd0aCIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFvQkE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBR0E7O0FBQ0E7O0FBQ0E7Ozs7OzsrZUE3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBUUE7OztBQUtBOztBQUVBLElBQU1BLGVBQWU7QUFDbkI7QUFDQUMsWUFBVSxLQUZTO0FBR25CO0FBQ0E7QUFDQUMsYUFBVyxLQUxRO0FBTW5CO0FBQ0FDLGNBQVk7QUFBQSxXQUFLLGlCQUFVQyxHQUFWLENBQWNDLENBQWQsRUFBaUIsU0FBakIsS0FBK0IsaUJBQVVELEdBQVYsQ0FBY0MsQ0FBZCxFQUFpQixzQkFBakIsQ0FBcEM7QUFBQSxHQVBPO0FBUW5CO0FBQ0FDLGFBQVc7QUFBQSxXQUFLLGlCQUFVRixHQUFWLENBQWNDLENBQWQsRUFBaUIsUUFBakIsS0FBOEIsaUJBQVVELEdBQVYsQ0FBY0MsQ0FBZCxFQUFpQixtQkFBakIsQ0FBOUIsSUFBdUUsQ0FBNUU7QUFBQSxHQVRRO0FBVW5CO0FBQ0FFLFlBQVU7QUFBQSxXQUFLLGlCQUFVSCxHQUFWLENBQWNDLENBQWQsRUFBaUIsT0FBakIsS0FBNkIsaUJBQVVELEdBQVYsQ0FBY0MsQ0FBZCxFQUFpQixrQkFBakIsQ0FBbEM7QUFBQSxHQVhTO0FBWW5CO0FBQ0FHLGlCQUFlO0FBYkksQ0FBckI7O0lBZ0JxQkMsWTs7Ozs7Ozs7Ozs7aUNBQ047QUFDWCxhQUFPO0FBQ0xDLCs2RUFESztBQUVMQyxrN0NBRks7QUFHTEMsaUJBQVMsQ0FBQyxVQUFEO0FBSEosT0FBUDtBQUtEOzs7c0NBRWlCO0FBQUEsVUFDVEMsRUFEUyxHQUNILEtBQUtDLE9BREYs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UyxFQUFXO0FBQUE7O0FBQ3pCQSxnQkFBVUMsS0FBVixHQUFrQixLQUFLN0MsS0FBTCxDQUFXaUMsaUJBQVgsQ0FBNkJwQixNQUE3QixDQUFvQztBQUNwRDlCLGtCQUFVO0FBQUEsaUJBQWdCLE9BQUtvQyxLQUFMLENBQVdwQyxRQUFYLENBQW9CLE9BQUtvQyxLQUFMLENBQVdZLElBQVgsQ0FBZ0JHLFlBQWhCLENBQXBCLENBQWhCO0FBQUE7QUFEMEMsT0FBcEMsQ0FBbEI7QUFHRDs7QUFFRDs7OzsyQ0FDdUJVLFMsRUFBVztBQUNoQ0EsZ0JBQVVDLEtBQVYsR0FBa0IsS0FBSzdDLEtBQUwsQ0FBV2lDLGlCQUFYLENBQTZCaEIsYUFBN0IsRUFBbEI7QUFDRDs7Ozs7O2tCQXhHa0JoQyxZOzs7QUEyR3JCQSxhQUFhaUUsU0FBYixHQUF5QixjQUF6QjtBQUNBakUsYUFBYVQsWUFBYixHQUE0QkEsWUFBNUIiLCJmaWxlIjoicG9seWdvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNiBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVycywgbGlnaHRpbmd9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5cbi8vIFBvbHlnb24gZ2VvbWV0cnkgZ2VuZXJhdGlvbiBpcyBtYW5hZ2VkIGJ5IHRoZSBwb2x5Z29uIHRlc3NlbGF0b3JcbmltcG9ydCB7Q29udGFpbmVyfSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuaW1wb3J0IHtQb2x5Z29uVGVzc2VsYXRvcn0gZnJvbSAnLi9wb2x5Z29uLXRlc3NlbGF0b3InO1xuaW1wb3J0IHtQb2x5Z29uVGVzc2VsYXRvckV4dHJ1ZGVkfSBmcm9tICcuL3BvbHlnb24tdGVzc2VsYXRvci1leHRydWRlZCc7XG5cbi8vIGNvbnN0IGRlZmF1bHRDb2xvciA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIC8vIFdoZXRoZXIgdG8gZXh0cnVkZSBpbiAyLjVEXG4gIGV4dHJ1ZGVkOiBmYWxzZSxcbiAgLy8gV2hldGhlciB0byBkcmF3IGEgR0wuTElORVMgd2lyZWZyYW1lIG9mIHRoZSBwb2x5Z29uXG4gIC8vIFRPRE8gLSBub3QgY2xlYXIgdGhhdCB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIHRoZSBtYWluIGxheWVyXG4gIHdpcmVmcmFtZTogZmFsc2UsXG4gIC8vIEFjY2Vzc29yIGZvciBwb2x5Z29uIGdlb21ldHJ5XG4gIGdldFBvbHlnb246IGYgPT4gQ29udGFpbmVyLmdldChmLCAncG9seWdvbicpIHx8IENvbnRhaW5lci5nZXQoZiwgJ2dlb21ldHJ5LmNvb3JkaW5hdGVzJyksXG4gIC8vIEFjY2Vzc29yIGZvciBleHRydXNpb24gaGVpZ2h0XG4gIGdldEhlaWdodDogZiA9PiBDb250YWluZXIuZ2V0KGYsICdoZWlnaHQnKSB8fCBDb250YWluZXIuZ2V0KGYsICdwcm9wZXJ0aWVzLmhlaWdodCcpIHx8IDAsXG4gIC8vIEFjY2Vzc29yIGZvciBjb2xvclxuICBnZXRDb2xvcjogZiA9PiBDb250YWluZXIuZ2V0KGYsICdjb2xvcicpIHx8IENvbnRhaW5lci5nZXQoZiwgJ3Byb3BlcnRpZXMuY29sb3InKSxcbiAgLy8gT3B0aW9uYWwgc2V0dGluZ3MgZm9yICdsaWdodGluZycgc2hhZGVyIG1vZHVsZVxuICBsaWdodFNldHRpbmdzOiB7fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9seWdvbkxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICB2czogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9wb2x5Z29uLWxheWVyLXZlcnRleC5nbHNsJyksICd1dGY4JyksXG4gICAgICBmczogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9wb2x5Z29uLWxheWVyLWZyYWdtZW50Lmdsc2wnKSwgJ3V0ZjgnKSxcbiAgICAgIG1vZHVsZXM6IFsnbGlnaHRpbmcnXVxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG1vZGVsOiB0aGlzLmdldE1vZGVsKGdsKSxcbiAgICAgIG51bUluc3RhbmNlczogMCxcbiAgICAgIEluZGV4VHlwZTogZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfZWxlbWVudF9pbmRleF91aW50JykgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5XG4gICAgfSk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IG5vQWxsb2MgPSB0cnVlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZER5bmFtaWMoe1xuICAgICAgaW5kaWNlczoge3NpemU6IDEsIGlzSW5kZXhlZDogdHJ1ZSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluZGljZXMsIG5vQWxsb2N9LFxuICAgICAgcG9zaXRpb25zOiB7c2l6ZTogMywgYWNjZXNzb3I6ICdnZXRIZWlnaHQnLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zLCBub0FsbG9jfSxcbiAgICAgIG5vcm1hbHM6IHtzaXplOiAzLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlTm9ybWFscywgbm9BbGxvY30sXG4gICAgICBjb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldENvbG9yJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUNvbG9ycywgbm9BbGxvY30sXG4gICAgICBwaWNraW5nQ29sb3JzOiB7c2l6ZTogMywgdHlwZTogR0wuVU5TSUdORURfQllURSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMsIG5vQWxsb2N9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICB0aGlzLnVwZGF0ZUdlb21ldHJ5KHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBpZiAocHJvcHMuZXh0cnVkZWQpIHtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXMobGlnaHRpbmcudXBkYXRlU2V0dGluZ3Moe1xuICAgICAgICBzZXR0aW5nczogcHJvcHMubGlnaHRTZXR0aW5ncyxcbiAgICAgICAgcHJldlNldHRpbmdzOiBvbGRQcm9wcy5saWdodFNldHRpbmdzXG4gICAgICB9KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXMobGlnaHRpbmcudXBkYXRlU2V0dGluZ3Moe3NldHRpbmdzOiB7ZW5hYmxlZDogZmFsc2V9fSkpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZUdlb21ldHJ5KHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGNvbnN0IGdlb21ldHJ5Q2hhbmdlZCA9XG4gICAgICBwcm9wcy5leHRydWRlZCAhPT0gb2xkUHJvcHMuZXh0cnVkZWQgfHxcbiAgICAgIHByb3BzLndpcmVmcmFtZSAhPT0gb2xkUHJvcHMud2lyZWZyYW1lO1xuXG4gICAgaWYgKGNoYW5nZUZsYWdzLmRhdGFDaGFuZ2VkIHx8IGdlb21ldHJ5Q2hhbmdlZCkge1xuICAgICAgY29uc3Qge2dldFBvbHlnb24sIGV4dHJ1ZGVkLCB3aXJlZnJhbWUsIGdldEhlaWdodH0gPSBwcm9wcztcblxuICAgICAgLy8gVE9ETyAtIGF2b2lkIGNyZWF0aW5nIGEgdGVtcG9yYXJ5IGFycmF5IGhlcmU6IGxldCB0aGUgdGVzc2VsYXRvciBpdGVyYXRlXG4gICAgICBjb25zdCBwb2x5Z29ucyA9IHByb3BzLmRhdGEubWFwKGdldFBvbHlnb24pO1xuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgcG9seWdvblRlc3NlbGF0b3I6ICFleHRydWRlZCA/XG4gICAgICAgICAgbmV3IFBvbHlnb25UZXNzZWxhdG9yKHtwb2x5Z29uc30pIDpcbiAgICAgICAgICBuZXcgUG9seWdvblRlc3NlbGF0b3JFeHRydWRlZCh7cG9seWdvbnMsIHdpcmVmcmFtZSxcbiAgICAgICAgICAgIGdldEhlaWdodDogcG9seWdvbkluZGV4ID0+IGdldEhlaWdodCh0aGlzLnByb3BzLmRhdGFbcG9seWdvbkluZGV4XSlcbiAgICAgICAgICB9KVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuc3RhdGUuYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0TW9kZWwoZ2wpIHtcbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG4gICAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgICBnbCxcbiAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgdnM6IHNoYWRlcnMudnMsXG4gICAgICBmczogc2hhZGVycy5mcyxcbiAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICBkcmF3TW9kZTogdGhpcy5wcm9wcy53aXJlZnJhbWUgPyBHTC5MSU5FUyA6IEdMLlRSSUFOR0xFU1xuICAgICAgfSksXG4gICAgICB2ZXJ0ZXhDb3VudDogMCxcbiAgICAgIGlzSW5kZXhlZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5kaWNlcyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLmluZGljZXMoKTtcbiAgICBhdHRyaWJ1dGUudGFyZ2V0ID0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVI7XG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRWZXJ0ZXhDb3VudChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpO1xuICB9XG5cbiAgY2FsY3VsYXRlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IucG9zaXRpb25zKCk7XG4gIH1cblxuICBjYWxjdWxhdGVOb3JtYWxzKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3Iubm9ybWFscygpO1xuICB9XG5cbiAgY2FsY3VsYXRlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IuY29sb3JzKHtcbiAgICAgIGdldENvbG9yOiBwb2x5Z29uSW5kZXggPT4gdGhpcy5wcm9wcy5nZXRDb2xvcih0aGlzLnByb3BzLmRhdGFbcG9seWdvbkluZGV4XSlcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHBpY2tpbmcgY29sb3JzIGNhbGN1bGF0aW9uXG4gIGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gdGhpcy5zdGF0ZS5wb2x5Z29uVGVzc2VsYXRvci5waWNraW5nQ29sb3JzKCk7XG4gIH1cbn1cblxuUG9seWdvbkxheWVyLmxheWVyTmFtZSA9ICdQb2x5Z29uTGF5ZXInO1xuUG9seWdvbkxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==
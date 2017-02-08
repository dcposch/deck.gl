'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _utils = require('../../../lib/utils');

var _geojson = require('./geojson');

var _luma = require('luma.gl');

var _earcut = require('earcut');

var _earcut2 = _interopRequireDefault(_earcut);

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

var DEFAULT_COLOR = [0, 0, 255, 255];

var defaultProps = {
  getColor: function getColor(feature) {
    return _utils.Container.get(feature, 'properties.color');
  },
  drawContour: false,
  strokeWidth: 1
};

var ChoroplethLayer = function (_Layer) {
  _inherits(ChoroplethLayer, _Layer);

  function ChoroplethLayer() {
    _classCallCheck(this, ChoroplethLayer);

    return _possibleConstructorReturn(this, (ChoroplethLayer.__proto__ || Object.getPrototypeOf(ChoroplethLayer)).apply(this, arguments));
  }

  _createClass(ChoroplethLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME choropleth-layer-vertex-shader\n\nattribute vec3 positions;\nattribute vec4 colors;\nattribute vec3 pickingColors;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\n// PICKING\nuniform float pickingEnabled;\nvarying vec4 vPickingColor;\nvoid picking_setPickColor(vec3 pickingColor) {\n  vPickingColor = vec4(pickingColor,  1.);\n}\nvec4 picking_setNormalAndPickColors(vec4 color, vec3 pickingColor) {\n  vec4 pickingColor4 = vec4(pickingColor.rgb, 1.);\n  vPickingColor = mix(color, pickingColor4, pickingEnabled);\n  return vPickingColor;\n}\n\n// PICKING\n// vec4 getColor(vec4 color, float opacity, vec3 pickingColor, float renderPickingBuffer) {\n//   vec4 color4 = vec4(color.xyz / 255., color.w / 255. * opacity);\n//   vec4 pickingColor4 = vec4(pickingColor / 255., 1.);\n//   return mix(color4, pickingColor4, renderPickingBuffer);\n// }\n\nvoid main(void) {\n\n  vec4 color = vec4(colors.rgb, colors.a * opacity) / 255.;\n\n  picking_setNormalAndPickColors(\n    color,\n    pickingColors / 255.\n  );\n\n  vec3 p = project_position(positions);\n  gl_Position = project_to_clipspace(vec4(p, 1.));\n}\n',
        fs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME choropleth-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// PICKING\n// uniform bool pickingEnabled;\nvarying vec4 vPickingColor;\nvec4 picking_getColor() {\n  return vPickingColor;\n}\n// PICKING\n\nvoid main(void) {\n  gl_FragColor = picking_getColor();\n}\n'
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;
      var attributeManager = this.state.attributeManager;

      attributeManager.addDynamic({
        // Primtive attributes
        indices: { size: 1, update: this.calculateIndices, isIndexed: true },
        positions: { size: 3, update: this.calculatePositions },
        colors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, update: this.calculateColors },
        // Instanced attributes
        pickingColors: {
          size: 3,
          type: _luma.GL.UNSIGNED_BYTE,
          update: this.calculatePickingColors,
          noAlloc: true
        }
      });

      var IndexType = gl.getExtension('OES_element_index_uint') ? Uint32Array : Uint16Array;

      this.setState({
        model: this.getModel(gl),
        numInstances: 0,
        IndexType: IndexType
      });
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      var attributeManager = this.state.attributeManager;

      if (changeFlags.dataChanged) {
        this.state.choropleths = (0, _geojson.extractPolygons)(props.data);
        attributeManager.invalidateAll();
      }

      if (oldProps.opacity !== props.opacity) {
        this.setUniforms({ opacity: props.opacity });
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
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
    key: 'pick',
    value: function pick(opts) {
      _get(ChoroplethLayer.prototype.__proto__ || Object.getPrototypeOf(ChoroplethLayer.prototype), 'pick', this).call(this, opts);
      var info = opts.info;

      var index = this.decodePickingColor(info.color);
      var feature = index >= 0 ? _utils.Container.get(this.props.data, ['features', index]) : null;
      info.feature = feature;
      info.object = feature;
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
          drawMode: this.props.drawContour ? _luma.GL.LINES : _luma.GL.TRIANGLES
        }),
        vertexCount: 0,
        isIndexed: true
      });
    }
  }, {
    key: 'calculateIndices',
    value: function calculateIndices(attribute) {
      var _this2 = this;

      // adjust index offset for multiple choropleths
      var offsets = this.state.choropleths.reduce(function (acc, choropleth) {
        return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + choropleth.reduce(function (count, polygon) {
          return count + polygon.length;
        }, 0)]);
      }, [0]);
      var IndexType = this.state.IndexType;

      if (IndexType === Uint16Array && offsets[offsets.length - 1] > 65535) {
        throw new Error('Vertex count exceeds browser\'s limit');
      }

      var indices = this.state.choropleths.map(function (choropleth, choroplethIndex) {
        return _this2.props.drawContour ?
        // 1. get sequentially ordered indices of each choropleth contour
        // 2. offset them by the number of indices in previous choropleths
        calculateContourIndices(choropleth).map(function (index) {
          return index + offsets[choroplethIndex];
        }) :
        // 1. get triangulated indices for the internal areas
        // 2. offset them by the number of indices in previous choropleths
        calculateSurfaceIndices(choropleth).map(function (index) {
          return index + offsets[choroplethIndex];
        });
      });

      attribute.value = new IndexType((0, _utils.flatten)(indices));
      attribute.target = _luma.GL.ELEMENT_ARRAY_BUFFER;
      this.state.model.setVertexCount(attribute.value.length / attribute.size);
    }
  }, {
    key: 'calculatePositions',
    value: function calculatePositions(attribute) {
      var vertices = (0, _utils.flatten)(this.state.choropleths);
      attribute.value = new Float32Array(vertices);
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _props = this.props,
          data = _props.data,
          getColor = _props.getColor;

      var features = _utils.Container.get(data, 'features');
      var colors = this.state.choropleths.map(function (choropleth, choroplethIndex) {
        var feature = _utils.Container.get(features, choropleth.featureIndex);
        var color = getColor(feature) || DEFAULT_COLOR;
        // Ensure alpha is set
        if (isNaN(color[3])) {
          color[3] = DEFAULT_COLOR[3];
        }
        return choropleth.map(function (polygon) {
          return polygon.map(function (vertex) {
            return color;
          });
        });
      });

      attribute.value = new Uint8Array((0, _utils.flatten)(colors));
    }

    // Override the default picking colors calculation

  }, {
    key: 'calculatePickingColors',
    value: function calculatePickingColors(attribute) {
      var _this3 = this;

      var colors = this.state.choropleths.map(function (choropleth, choroplethIndex) {
        var featureIndex = choropleth.featureIndex;

        var color = _this3.props.drawContour ? [0, 0, 0] : [(featureIndex + 1) % 256, Math.floor((featureIndex + 1) / 256) % 256, Math.floor((featureIndex + 1) / 256 / 256) % 256];
        return choropleth.map(function (polygon) {
          return polygon.map(function (vertex) {
            return color;
          });
        });
      });

      attribute.value = new Uint8Array((0, _utils.flatten)(colors));
    }
  }]);

  return ChoroplethLayer;
}(_lib.Layer);

exports.default = ChoroplethLayer;


ChoroplethLayer.layerName = 'ChoroplethLayer';
ChoroplethLayer.defaultProps = defaultProps;

/*
 * get vertex indices for drawing choropleth contour
 * @param {[Number,Number,Number][][]} choropleth
 * @returns {[Number]} indices
 */
function calculateContourIndices(choropleth) {
  var offset = 0;

  return choropleth.reduce(function (acc, polygon) {
    var numVertices = polygon.length;

    // use vertex pairs for gl.LINES => [0, 1, 1, 2, 2, ..., n-2, n-2, n-1]
    var indices = [].concat(_toConsumableArray(acc), [offset]);
    for (var i = 1; i < numVertices - 1; i++) {
      indices.push(i + offset, i + offset);
    }
    indices.push(offset + numVertices - 1);

    offset += numVertices;
    return indices;
  }, []);
}

/*
 * get vertex indices for drawing choropleth mesh
 * @param {[Number,Number,Number][][]} choropleth
 * @returns {[Number]} indices
 */
function calculateSurfaceIndices(choropleth) {
  var holes = null;

  if (choropleth.length > 1) {
    holes = choropleth.reduce(function (acc, polygon) {
      return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + polygon.length]);
    }, [0]).slice(1, choropleth.length);
  }

  return (0, _earcut2.default)((0, _utils.flatten)(choropleth), holes, 3);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9jaG9yb3BsZXRoLWxheWVyL2Nob3JvcGxldGgtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImdldENvbG9yIiwiZ2V0IiwiZmVhdHVyZSIsImRyYXdDb250b3VyIiwic3Ryb2tlV2lkdGgiLCJDaG9yb3BsZXRoTGF5ZXIiLCJ2cyIsImZzIiwiZ2wiLCJjb250ZXh0IiwiYXR0cmlidXRlTWFuYWdlciIsInN0YXRlIiwiYWRkRHluYW1pYyIsImluZGljZXMiLCJzaXplIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5kaWNlcyIsImlzSW5kZXhlZCIsInBvc2l0aW9ucyIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsImNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlQ29sb3JzIiwicGlja2luZ0NvbG9ycyIsImNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMiLCJub0FsbG9jIiwiSW5kZXhUeXBlIiwiZ2V0RXh0ZW5zaW9uIiwiVWludDMyQXJyYXkiLCJVaW50MTZBcnJheSIsInNldFN0YXRlIiwibW9kZWwiLCJnZXRNb2RlbCIsIm51bUluc3RhbmNlcyIsIm9sZFByb3BzIiwicHJvcHMiLCJjaGFuZ2VGbGFncyIsImRhdGFDaGFuZ2VkIiwiY2hvcm9wbGV0aHMiLCJkYXRhIiwiaW52YWxpZGF0ZUFsbCIsIm9wYWNpdHkiLCJzZXRVbmlmb3JtcyIsInVuaWZvcm1zIiwibGluZVdpZHRoIiwic2NyZWVuVG9EZXZpY2VQaXhlbHMiLCJyZW5kZXIiLCJvcHRzIiwiaW5mbyIsImluZGV4IiwiZGVjb2RlUGlja2luZ0NvbG9yIiwiY29sb3IiLCJvYmplY3QiLCJzaGFkZXJzIiwiZ2V0U2hhZGVycyIsImlkIiwiZ2VvbWV0cnkiLCJkcmF3TW9kZSIsIkxJTkVTIiwiVFJJQU5HTEVTIiwidmVydGV4Q291bnQiLCJhdHRyaWJ1dGUiLCJvZmZzZXRzIiwicmVkdWNlIiwiYWNjIiwiY2hvcm9wbGV0aCIsImxlbmd0aCIsImNvdW50IiwicG9seWdvbiIsIkVycm9yIiwibWFwIiwiY2hvcm9wbGV0aEluZGV4IiwiY2FsY3VsYXRlQ29udG91ckluZGljZXMiLCJjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyIsInZhbHVlIiwidGFyZ2V0IiwiRUxFTUVOVF9BUlJBWV9CVUZGRVIiLCJzZXRWZXJ0ZXhDb3VudCIsInZlcnRpY2VzIiwiRmxvYXQzMkFycmF5IiwiZmVhdHVyZXMiLCJmZWF0dXJlSW5kZXgiLCJpc05hTiIsIlVpbnQ4QXJyYXkiLCJNYXRoIiwiZmxvb3IiLCJsYXllck5hbWUiLCJvZmZzZXQiLCJudW1WZXJ0aWNlcyIsImkiLCJwdXNoIiwiaG9sZXMiLCJzbGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBOzs7Ozs7Ozs7OytlQTNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFXQSxJQUFNQSxnQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLEdBQVAsRUFBWSxHQUFaLENBQXRCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLFlBQVU7QUFBQSxXQUFXLGlCQUFVQyxHQUFWLENBQWNDLE9BQWQsRUFBdUIsa0JBQXZCLENBQVg7QUFBQSxHQURTO0FBRW5CQyxlQUFhLEtBRk07QUFHbkJDLGVBQWE7QUFITSxDQUFyQjs7SUFNcUJDLGU7Ozs7Ozs7Ozs7O2lDQUNOO0FBQ1gsYUFBTztBQUNMQyxpeUVBREs7QUFFTEM7QUFGSyxPQUFQO0FBSUQ7OztzQ0FFaUI7QUFBQSxVQUNUQyxFQURTLEdBQ0gsS0FBS0MsT0FERixDQUNURCxFQURTO0FBQUEsVUFHVEUsZ0JBSFMsR0FHVyxLQUFLQyxLQUhoQixDQUdURCxnQkFIUzs7QUFJaEJBLHVCQUFpQkUsVUFBakIs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OztBQUVBO0FBQ0EsUUFBTXRELHVDQUFjb0QsR0FBZCxJQUFtQnVCLE1BQW5CLEVBQU47QUFDQSxTQUFLLElBQUlFLElBQUksQ0FBYixFQUFnQkEsSUFBSUQsY0FBYyxDQUFsQyxFQUFxQ0MsR0FBckMsRUFBMEM7QUFDeEM3RSxjQUFROEUsSUFBUixDQUFhRCxJQUFJRixNQUFqQixFQUF5QkUsSUFBSUYsTUFBN0I7QUFDRDtBQUNEM0UsWUFBUThFLElBQVIsQ0FBYUgsU0FBU0MsV0FBVCxHQUF1QixDQUFwQzs7QUFFQUQsY0FBVUMsV0FBVjtBQUNBLFdBQU81RSxPQUFQO0FBQ0QsR0FaTSxFQVlKLEVBWkksQ0FBUDtBQWFEOztBQUVEOzs7OztBQUtBLFNBQVM2RCx1QkFBVCxDQUFpQ1IsVUFBakMsRUFBNkM7QUFDM0MsTUFBSTBCLFFBQVEsSUFBWjs7QUFFQSxNQUFJMUIsV0FBV0MsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUN6QnlCLFlBQVExQixXQUFXRixNQUFYLENBQ04sVUFBQ0MsR0FBRCxFQUFNSSxPQUFOO0FBQUEsMENBQXNCSixHQUF0QixJQUEyQkEsSUFBSUEsSUFBSUUsTUFBSixHQUFhLENBQWpCLElBQXNCRSxRQUFRRixNQUF6RDtBQUFBLEtBRE0sRUFFTixDQUFDLENBQUQsQ0FGTSxFQUdOMEIsS0FITSxDQUdBLENBSEEsRUFHRzNCLFdBQVdDLE1BSGQsQ0FBUjtBQUlEOztBQUVELFNBQU8sc0JBQU8sb0JBQVFELFVBQVIsQ0FBUCxFQUE0QjBCLEtBQTVCLEVBQW1DLENBQW5DLENBQVA7QUFDRCIsImZpbGUiOiJjaG9yb3BsZXRoLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllcn0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCB7YXNzZW1ibGVTaGFkZXJzfSBmcm9tICcuLi8uLi8uLi9zaGFkZXItdXRpbHMnO1xuaW1wb3J0IHtDb250YWluZXIsIGZsYXR0ZW59IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscyc7XG5pbXBvcnQge2V4dHJhY3RQb2x5Z29uc30gZnJvbSAnLi9nZW9qc29uJztcbmltcG9ydCB7R0wsIE1vZGVsLCBHZW9tZXRyeX0gZnJvbSAnbHVtYS5nbCc7XG5pbXBvcnQgZWFyY3V0IGZyb20gJ2VhcmN1dCc7XG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtqb2lufSBmcm9tICdwYXRoJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAyNTUsIDI1NV07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgZ2V0Q29sb3I6IGZlYXR1cmUgPT4gQ29udGFpbmVyLmdldChmZWF0dXJlLCAncHJvcGVydGllcy5jb2xvcicpLFxuICBkcmF3Q29udG91cjogZmFsc2UsXG4gIHN0cm9rZVdpZHRoOiAxXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaG9yb3BsZXRoTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZzOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL2Nob3JvcGxldGgtbGF5ZXItdmVydGV4Lmdsc2wnKSwgJ3V0ZjgnKSxcbiAgICAgIGZzOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL2Nob3JvcGxldGgtbGF5ZXItZnJhZ21lbnQuZ2xzbCcpLCAndXRmOCcpXG4gICAgfTtcbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZER5bmFtaWMoe1xuICAgICAgLy8gUHJpbXRpdmUgYXR0cmlidXRlc1xuICAgICAgaW5kaWNlczoge3NpemU6IDEsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbmRpY2VzLCBpc0luZGV4ZWQ6IHRydWV9LFxuICAgICAgcG9zaXRpb25zOiB7c2l6ZTogMywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVBvc2l0aW9uc30sXG4gICAgICBjb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlQ29sb3JzfSxcbiAgICAgIC8vIEluc3RhbmNlZCBhdHRyaWJ1dGVzXG4gICAgICBwaWNraW5nQ29sb3JzOiB7XG4gICAgICAgIHNpemU6IDMsXG4gICAgICAgIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQaWNraW5nQ29sb3JzLFxuICAgICAgICBub0FsbG9jOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBJbmRleFR5cGUgPSBnbC5nZXRFeHRlbnNpb24oJ09FU19lbGVtZW50X2luZGV4X3VpbnQnKSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG1vZGVsOiB0aGlzLmdldE1vZGVsKGdsKSxcbiAgICAgIG51bUluc3RhbmNlczogMCxcbiAgICAgIEluZGV4VHlwZVxuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQpIHtcbiAgICAgIHRoaXMuc3RhdGUuY2hvcm9wbGV0aHMgPSBleHRyYWN0UG9seWdvbnMocHJvcHMuZGF0YSk7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcbiAgICB9XG5cbiAgICBpZiAob2xkUHJvcHMub3BhY2l0eSAhPT0gcHJvcHMub3BhY2l0eSkge1xuICAgICAgdGhpcy5zZXRVbmlmb3Jtcyh7b3BhY2l0eTogcHJvcHMub3BhY2l0eX0pO1xuICAgIH1cbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgbGluZVdpZHRoID0gdGhpcy5zY3JlZW5Ub0RldmljZVBpeGVscyh0aGlzLnByb3BzLnN0cm9rZVdpZHRoKTtcbiAgICBnbC5saW5lV2lkdGgobGluZVdpZHRoKTtcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcih1bmlmb3Jtcyk7XG4gICAgLy8gU2V0dGluZyBsaW5lIHdpZHRoIGJhY2sgdG8gMSBpcyBoZXJlIHRvIHdvcmthcm91bmQgYSBHb29nbGUgQ2hyb21lIGJ1Z1xuICAgIC8vIGdsLmNsZWFyKCkgYW5kIGdsLmlzRW5hYmxlZCgpIHdpbGwgcmV0dXJuIEdMX0lOVkFMSURfVkFMVUUgZXZlbiB3aXRoXG4gICAgLy8gY29ycmVjdCBwYXJhbWV0ZXJcbiAgICAvLyBUaGlzIGlzIG5vdCBoYXBwZW5pbmcgb24gU2FmYXJpIGFuZCBGaXJlZm94XG4gICAgZ2wubGluZVdpZHRoKDEuMCk7XG4gIH1cblxuICBwaWNrKG9wdHMpIHtcbiAgICBzdXBlci5waWNrKG9wdHMpO1xuICAgIGNvbnN0IHtpbmZvfSA9IG9wdHM7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmRlY29kZVBpY2tpbmdDb2xvcihpbmZvLmNvbG9yKTtcbiAgICBjb25zdCBmZWF0dXJlID0gaW5kZXggPj0gMCA/IENvbnRhaW5lci5nZXQodGhpcy5wcm9wcy5kYXRhLCBbJ2ZlYXR1cmVzJywgaW5kZXhdKSA6IG51bGw7XG4gICAgaW5mby5mZWF0dXJlID0gZmVhdHVyZTtcbiAgICBpbmZvLm9iamVjdCA9IGZlYXR1cmU7XG4gIH1cblxuICBnZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHJldHVybiBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IHRoaXMucHJvcHMuZHJhd0NvbnRvdXIgPyBHTC5MSU5FUyA6IEdMLlRSSUFOR0xFU1xuICAgICAgfSksXG4gICAgICB2ZXJ0ZXhDb3VudDogMCxcbiAgICAgIGlzSW5kZXhlZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5kaWNlcyhhdHRyaWJ1dGUpIHtcbiAgICAvLyBhZGp1c3QgaW5kZXggb2Zmc2V0IGZvciBtdWx0aXBsZSBjaG9yb3BsZXRoc1xuICAgIGNvbnN0IG9mZnNldHMgPSB0aGlzLnN0YXRlLmNob3JvcGxldGhzLnJlZHVjZShcbiAgICAgIChhY2MsIGNob3JvcGxldGgpID0+IFsuLi5hY2MsIGFjY1thY2MubGVuZ3RoIC0gMV0gK1xuICAgICAgICBjaG9yb3BsZXRoLnJlZHVjZSgoY291bnQsIHBvbHlnb24pID0+IGNvdW50ICsgcG9seWdvbi5sZW5ndGgsIDApXSxcbiAgICAgIFswXVxuICAgICk7XG4gICAgY29uc3Qge0luZGV4VHlwZX0gPSB0aGlzLnN0YXRlO1xuICAgIGlmIChJbmRleFR5cGUgPT09IFVpbnQxNkFycmF5ICYmIG9mZnNldHNbb2Zmc2V0cy5sZW5ndGggLSAxXSA+IDY1NTM1KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZlcnRleCBjb3VudCBleGNlZWRzIGJyb3dzZXJcXCdzIGxpbWl0Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuc3RhdGUuY2hvcm9wbGV0aHMubWFwKFxuICAgICAgKGNob3JvcGxldGgsIGNob3JvcGxldGhJbmRleCkgPT4gdGhpcy5wcm9wcy5kcmF3Q29udG91ciA/XG4gICAgICAgIC8vIDEuIGdldCBzZXF1ZW50aWFsbHkgb3JkZXJlZCBpbmRpY2VzIG9mIGVhY2ggY2hvcm9wbGV0aCBjb250b3VyXG4gICAgICAgIC8vIDIuIG9mZnNldCB0aGVtIGJ5IHRoZSBudW1iZXIgb2YgaW5kaWNlcyBpbiBwcmV2aW91cyBjaG9yb3BsZXRoc1xuICAgICAgICBjYWxjdWxhdGVDb250b3VySW5kaWNlcyhjaG9yb3BsZXRoKS5tYXAoaW5kZXggPT4gaW5kZXggKyBvZmZzZXRzW2Nob3JvcGxldGhJbmRleF0pIDpcbiAgICAgICAgLy8gMS4gZ2V0IHRyaWFuZ3VsYXRlZCBpbmRpY2VzIGZvciB0aGUgaW50ZXJuYWwgYXJlYXNcbiAgICAgICAgLy8gMi4gb2Zmc2V0IHRoZW0gYnkgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHByZXZpb3VzIGNob3JvcGxldGhzXG4gICAgICAgIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKGNob3JvcGxldGgpLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldHNbY2hvcm9wbGV0aEluZGV4XSlcbiAgICApO1xuXG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEluZGV4VHlwZShmbGF0dGVuKGluZGljZXMpKTtcbiAgICBhdHRyaWJ1dGUudGFyZ2V0ID0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVI7XG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRWZXJ0ZXhDb3VudChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpO1xuICB9XG5cbiAgY2FsY3VsYXRlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHZlcnRpY2VzID0gZmxhdHRlbih0aGlzLnN0YXRlLmNob3JvcGxldGhzKTtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBmZWF0dXJlcyA9IENvbnRhaW5lci5nZXQoZGF0YSwgJ2ZlYXR1cmVzJyk7XG4gICAgY29uc3QgY29sb3JzID0gdGhpcy5zdGF0ZS5jaG9yb3BsZXRocy5tYXAoXG4gICAgICAoY2hvcm9wbGV0aCwgY2hvcm9wbGV0aEluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmUgPSBDb250YWluZXIuZ2V0KGZlYXR1cmVzLCBjaG9yb3BsZXRoLmZlYXR1cmVJbmRleCk7XG4gICAgICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IoZmVhdHVyZSkgfHwgREVGQVVMVF9DT0xPUjtcbiAgICAgICAgLy8gRW5zdXJlIGFscGhhIGlzIHNldFxuICAgICAgICBpZiAoaXNOYU4oY29sb3JbM10pKSB7XG4gICAgICAgICAgY29sb3JbM10gPSBERUZBVUxUX0NPTE9SWzNdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaG9yb3BsZXRoLm1hcChwb2x5Z29uID0+IHBvbHlnb24ubWFwKHZlcnRleCA9PiBjb2xvcikpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgVWludDhBcnJheShmbGF0dGVuKGNvbG9ycykpO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgdGhlIGRlZmF1bHQgcGlja2luZyBjb2xvcnMgY2FsY3VsYXRpb25cbiAgY2FsY3VsYXRlUGlja2luZ0NvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCBjb2xvcnMgPSB0aGlzLnN0YXRlLmNob3JvcGxldGhzLm1hcChcbiAgICAgIChjaG9yb3BsZXRoLCBjaG9yb3BsZXRoSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qge2ZlYXR1cmVJbmRleH0gPSBjaG9yb3BsZXRoO1xuICAgICAgICBjb25zdCBjb2xvciA9IHRoaXMucHJvcHMuZHJhd0NvbnRvdXIgPyBbMCwgMCwgMF0gOiBbXG4gICAgICAgICAgKGZlYXR1cmVJbmRleCArIDEpICUgMjU2LFxuICAgICAgICAgIE1hdGguZmxvb3IoKGZlYXR1cmVJbmRleCArIDEpIC8gMjU2KSAlIDI1NixcbiAgICAgICAgICBNYXRoLmZsb29yKChmZWF0dXJlSW5kZXggKyAxKSAvIDI1NiAvIDI1NikgJSAyNTZcbiAgICAgICAgXTtcbiAgICAgICAgcmV0dXJuIGNob3JvcGxldGgubWFwKHBvbHlnb24gPT4gcG9seWdvbi5tYXAodmVydGV4ID0+IGNvbG9yKSk7XG4gICAgICB9XG4gICAgKTtcblxuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IG5ldyBVaW50OEFycmF5KGZsYXR0ZW4oY29sb3JzKSk7XG4gIH1cbn1cblxuQ2hvcm9wbGV0aExheWVyLmxheWVyTmFtZSA9ICdDaG9yb3BsZXRoTGF5ZXInO1xuQ2hvcm9wbGV0aExheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcblxuLypcbiAqIGdldCB2ZXJ0ZXggaW5kaWNlcyBmb3IgZHJhd2luZyBjaG9yb3BsZXRoIGNvbnRvdXJcbiAqIEBwYXJhbSB7W051bWJlcixOdW1iZXIsTnVtYmVyXVtdW119IGNob3JvcGxldGhcbiAqIEByZXR1cm5zIHtbTnVtYmVyXX0gaW5kaWNlc1xuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVDb250b3VySW5kaWNlcyhjaG9yb3BsZXRoKSB7XG4gIGxldCBvZmZzZXQgPSAwO1xuXG4gIHJldHVybiBjaG9yb3BsZXRoLnJlZHVjZSgoYWNjLCBwb2x5Z29uKSA9PiB7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBwb2x5Z29uLmxlbmd0aDtcblxuICAgIC8vIHVzZSB2ZXJ0ZXggcGFpcnMgZm9yIGdsLkxJTkVTID0+IFswLCAxLCAxLCAyLCAyLCAuLi4sIG4tMiwgbi0yLCBuLTFdXG4gICAgY29uc3QgaW5kaWNlcyA9IFsuLi5hY2MsIG9mZnNldF07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBudW1WZXJ0aWNlcyAtIDE7IGkrKykge1xuICAgICAgaW5kaWNlcy5wdXNoKGkgKyBvZmZzZXQsIGkgKyBvZmZzZXQpO1xuICAgIH1cbiAgICBpbmRpY2VzLnB1c2gob2Zmc2V0ICsgbnVtVmVydGljZXMgLSAxKTtcblxuICAgIG9mZnNldCArPSBudW1WZXJ0aWNlcztcbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfSwgW10pO1xufVxuXG4vKlxuICogZ2V0IHZlcnRleCBpbmRpY2VzIGZvciBkcmF3aW5nIGNob3JvcGxldGggbWVzaFxuICogQHBhcmFtIHtbTnVtYmVyLE51bWJlcixOdW1iZXJdW11bXX0gY2hvcm9wbGV0aFxuICogQHJldHVybnMge1tOdW1iZXJdfSBpbmRpY2VzXG4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKGNob3JvcGxldGgpIHtcbiAgbGV0IGhvbGVzID0gbnVsbDtcblxuICBpZiAoY2hvcm9wbGV0aC5sZW5ndGggPiAxKSB7XG4gICAgaG9sZXMgPSBjaG9yb3BsZXRoLnJlZHVjZShcbiAgICAgIChhY2MsIHBvbHlnb24pID0+IFsuLi5hY2MsIGFjY1thY2MubGVuZ3RoIC0gMV0gKyBwb2x5Z29uLmxlbmd0aF0sXG4gICAgICBbMF1cbiAgICApLnNsaWNlKDEsIGNob3JvcGxldGgubGVuZ3RoKTtcbiAgfVxuXG4gIHJldHVybiBlYXJjdXQoZmxhdHRlbihjaG9yb3BsZXRoKSwgaG9sZXMsIDMpO1xufVxuIl19
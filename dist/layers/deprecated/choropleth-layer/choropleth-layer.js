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

var _choroplethLayerVertex = require('./choropleth-layer-vertex.glsl');

var _choroplethLayerVertex2 = _interopRequireDefault(_choroplethLayerVertex);

var _choroplethLayerFragment = require('./choropleth-layer-fragment.glsl');

var _choroplethLayerFragment2 = _interopRequireDefault(_choroplethLayerFragment);

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
    return (0, _utils.get)(feature, 'properties.color');
  },
  drawContour: false,
  strokeWidth: 1
};

var ChoroplethLayer = function (_Layer) {
  _inherits(ChoroplethLayer, _Layer);

  function ChoroplethLayer(props) {
    _classCallCheck(this, ChoroplethLayer);

    var _this = _possibleConstructorReturn(this, (ChoroplethLayer.__proto__ || Object.getPrototypeOf(ChoroplethLayer)).call(this, props));

    _utils.log.once('ChoroplethLayer is deprecated. Consider using GeoJsonLayer instead');
    return _this;
  }

  _createClass(ChoroplethLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: _choroplethLayerVertex2.default,
        fs: _choroplethLayerFragment2.default
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

      if (props.drawContour !== oldProps.drawContour) {
        this.state.model.geometry.drawMode = props.drawContour ? _luma.GL.LINES : _luma.GL.TRIANGLES;
        attributeManager.invalidateAll();
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
    key: 'getPickingInfo',
    value: function getPickingInfo(opts) {
      var info = _get(ChoroplethLayer.prototype.__proto__ || Object.getPrototypeOf(ChoroplethLayer.prototype), 'getPickingInfo', this).call(this, opts);
      var index = this.decodePickingColor(info.color);
      var feature = index >= 0 ? (0, _utils.get)(this.props.data, ['features', index]) : null;
      info.feature = feature;
      info.object = feature;
      return info;
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

      var features = (0, _utils.get)(data, 'features');
      var colors = this.state.choropleths.map(function (choropleth, choroplethIndex) {
        var feature = (0, _utils.get)(features, choropleth.featureIndex);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9jaG9yb3BsZXRoLWxheWVyL2Nob3JvcGxldGgtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImdldENvbG9yIiwiZmVhdHVyZSIsImRyYXdDb250b3VyIiwic3Ryb2tlV2lkdGgiLCJDaG9yb3BsZXRoTGF5ZXIiLCJwcm9wcyIsIm9uY2UiLCJ2cyIsImZzIiwiZ2wiLCJjb250ZXh0IiwiYXR0cmlidXRlTWFuYWdlciIsInN0YXRlIiwiYWRkRHluYW1pYyIsImluZGljZXMiLCJzaXplIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5kaWNlcyIsImlzSW5kZXhlZCIsInBvc2l0aW9ucyIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsImNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlQ29sb3JzIiwicGlja2luZ0NvbG9ycyIsImNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMiLCJub0FsbG9jIiwiSW5kZXhUeXBlIiwiZ2V0RXh0ZW5zaW9uIiwiVWludDMyQXJyYXkiLCJVaW50MTZBcnJheSIsInNldFN0YXRlIiwibW9kZWwiLCJnZXRNb2RlbCIsIm51bUluc3RhbmNlcyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJkYXRhQ2hhbmdlZCIsImNob3JvcGxldGhzIiwiZGF0YSIsImludmFsaWRhdGVBbGwiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiTElORVMiLCJUUklBTkdMRVMiLCJ1bmlmb3JtcyIsImxpbmVXaWR0aCIsInNjcmVlblRvRGV2aWNlUGl4ZWxzIiwicmVuZGVyIiwib3B0cyIsImluZm8iLCJpbmRleCIsImRlY29kZVBpY2tpbmdDb2xvciIsImNvbG9yIiwib2JqZWN0Iiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJpZCIsInZlcnRleENvdW50IiwiYXR0cmlidXRlIiwib2Zmc2V0cyIsInJlZHVjZSIsImFjYyIsImNob3JvcGxldGgiLCJsZW5ndGgiLCJjb3VudCIsInBvbHlnb24iLCJFcnJvciIsIm1hcCIsImNob3JvcGxldGhJbmRleCIsImNhbGN1bGF0ZUNvbnRvdXJJbmRpY2VzIiwiY2FsY3VsYXRlU3VyZmFjZUluZGljZXMiLCJ2YWx1ZSIsInRhcmdldCIsIkVMRU1FTlRfQVJSQVlfQlVGRkVSIiwic2V0VmVydGV4Q291bnQiLCJ2ZXJ0aWNlcyIsIkZsb2F0MzJBcnJheSIsImZlYXR1cmVzIiwiZmVhdHVyZUluZGV4IiwiaXNOYU4iLCJVaW50OEFycmF5IiwiTWF0aCIsImZsb29yIiwibGF5ZXJOYW1lIiwib2Zmc2V0IiwibnVtVmVydGljZXMiLCJpIiwicHVzaCIsImhvbGVzIiwic2xpY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFvQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7K2VBNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVlBLElBQU1BLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sR0FBUCxFQUFZLEdBQVosQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsWUFBVTtBQUFBLFdBQVcsZ0JBQUlDLE9BQUosRUFBYSxrQkFBYixDQUFYO0FBQUEsR0FEUztBQUVuQkMsZUFBYSxLQUZNO0FBR25CQyxlQUFhO0FBSE0sQ0FBckI7O0lBTXFCQyxlOzs7QUFFbkIsMkJBQVlDLEtBQVosRUFBbUI7QUFBQTs7QUFBQSxrSUFDWEEsS0FEVzs7QUFFakIsZUFBSUMsSUFBSixDQUFTLG9FQUFUO0FBRmlCO0FBR2xCOzs7O2lDQUVZO0FBQ1gsYUFBTztBQUNMQywyQ0FESztBQUVMQztBQUZLLE9BQVA7QUFJRDs7O3NDQUVpQjtBQUFBLFVBQ1RDLEVBRFMsR0FDSCxLQUFLQyxPQURGLENBQ1RELEVBRFM7QUFBQSxVQUdURSxn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UyxDQUFiOztBQUVBLFNBQU90QixXQUFXRixNQUFYLENBQWtCLFVBQUNDLEdBQUQsRUFBTUksT0FBTixFQUFrQjtBQUN6QyxRQUFNb0IsY0FBY3BCLFFBQVFGLE1BQTVCOztBQUVBO0FBQ0EsUUFBTW5ELHVDQUFjaUQsR0FBZCxJQUFtQnVCLE1BQW5CLEVBQU47QUFDQSxTQUFLLElBQUlFLElBQUksQ0FBYixFQUFnQkEsSUFBSUQsY0FBYyxDQUFsQyxFQUFxQ0MsR0FBckMsRUFBMEM7QUFDeEMxRSxjQUFRMkUsSUFBUixDQUFhRCxJQUFJRixNQUFqQixFQUF5QkUsSUFBSUYsTUFBN0I7QUFDRDtBQUNEeEUsWUFBUTJFLElBQVIsQ0FBYUgsU0FBU0MsV0FBVCxHQUF1QixDQUFwQzs7QUFFQUQsY0FBVUMsV0FBVjtBQUNBLFdBQU96RSxPQUFQO0FBQ0QsR0FaTSxFQVlKLEVBWkksQ0FBUDtBQWFEOztBQUVEOzs7OztBQUtBLFNBQVMwRCx1QkFBVCxDQUFpQ1IsVUFBakMsRUFBNkM7QUFDM0MsTUFBSTBCLFFBQVEsSUFBWjs7QUFFQSxNQUFJMUIsV0FBV0MsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUN6QnlCLFlBQVExQixXQUFXRixNQUFYLENBQ04sVUFBQ0MsR0FBRCxFQUFNSSxPQUFOO0FBQUEsMENBQXNCSixHQUF0QixJQUEyQkEsSUFBSUEsSUFBSUUsTUFBSixHQUFhLENBQWpCLElBQXNCRSxRQUFRRixNQUF6RDtBQUFBLEtBRE0sRUFFTixDQUFDLENBQUQsQ0FGTSxFQUdOMEIsS0FITSxDQUdBLENBSEEsRUFHRzNCLFdBQVdDLE1BSGQsQ0FBUjtBQUlEOztBQUVELFNBQU8sc0JBQU8sb0JBQVFELFVBQVIsQ0FBUCxFQUE0QjBCLEtBQTVCLEVBQW1DLENBQW5DLENBQVA7QUFDRCIsImZpbGUiOiJjaG9yb3BsZXRoLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllcn0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCB7YXNzZW1ibGVTaGFkZXJzfSBmcm9tICcuLi8uLi8uLi9zaGFkZXItdXRpbHMnO1xuaW1wb3J0IHtnZXQsIGZsYXR0ZW4sIGxvZ30gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzJztcbmltcG9ydCB7ZXh0cmFjdFBvbHlnb25zfSBmcm9tICcuL2dlb2pzb24nO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCBlYXJjdXQgZnJvbSAnZWFyY3V0JztcblxuaW1wb3J0IGNob3JvcGxldGhWZXJ0ZXggZnJvbSAnLi9jaG9yb3BsZXRoLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCBjaG9yb3BsZXRoRnJhZ21lbnQgZnJvbSAnLi9jaG9yb3BsZXRoLWxheWVyLWZyYWdtZW50Lmdsc2wnO1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzAsIDAsIDI1NSwgMjU1XTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBnZXRDb2xvcjogZmVhdHVyZSA9PiBnZXQoZmVhdHVyZSwgJ3Byb3BlcnRpZXMuY29sb3InKSxcbiAgZHJhd0NvbnRvdXI6IGZhbHNlLFxuICBzdHJva2VXaWR0aDogMVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2hvcm9wbGV0aExheWVyIGV4dGVuZHMgTGF5ZXIge1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIGxvZy5vbmNlKCdDaG9yb3BsZXRoTGF5ZXIgaXMgZGVwcmVjYXRlZC4gQ29uc2lkZXIgdXNpbmcgR2VvSnNvbkxheWVyIGluc3RlYWQnKTtcbiAgfVxuXG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZzOiBjaG9yb3BsZXRoVmVydGV4LFxuICAgICAgZnM6IGNob3JvcGxldGhGcmFnbWVudFxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcblxuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGREeW5hbWljKHtcbiAgICAgIC8vIFByaW10aXZlIGF0dHJpYnV0ZXNcbiAgICAgIGluZGljZXM6IHtzaXplOiAxLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5kaWNlcywgaXNJbmRleGVkOiB0cnVlfSxcbiAgICAgIHBvc2l0aW9uczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnN9LFxuICAgICAgY29sb3JzOiB7c2l6ZTogNCwgdHlwZTogR0wuVU5TSUdORURfQllURSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUNvbG9yc30sXG4gICAgICAvLyBJbnN0YW5jZWQgYXR0cmlidXRlc1xuICAgICAgcGlja2luZ0NvbG9yczoge1xuICAgICAgICBzaXplOiAzLFxuICAgICAgICB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUGlja2luZ0NvbG9ycyxcbiAgICAgICAgbm9BbGxvYzogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgSW5kZXhUeXBlID0gZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfZWxlbWVudF9pbmRleF91aW50JykgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5O1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBtb2RlbDogdGhpcy5nZXRNb2RlbChnbCksXG4gICAgICBudW1JbnN0YW5jZXM6IDAsXG4gICAgICBJbmRleFR5cGVcbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKGNoYW5nZUZsYWdzLmRhdGFDaGFuZ2VkKSB7XG4gICAgICB0aGlzLnN0YXRlLmNob3JvcGxldGhzID0gZXh0cmFjdFBvbHlnb25zKHByb3BzLmRhdGEpO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzLmRyYXdDb250b3VyICE9PSBvbGRQcm9wcy5kcmF3Q29udG91cikge1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5nZW9tZXRyeS5kcmF3TW9kZSA9IHByb3BzLmRyYXdDb250b3VyID8gR0wuTElORVMgOiBHTC5UUklBTkdMRVM7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcbiAgICB9XG5cbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgbGluZVdpZHRoID0gdGhpcy5zY3JlZW5Ub0RldmljZVBpeGVscyh0aGlzLnByb3BzLnN0cm9rZVdpZHRoKTtcbiAgICBnbC5saW5lV2lkdGgobGluZVdpZHRoKTtcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcih1bmlmb3Jtcyk7XG4gICAgLy8gU2V0dGluZyBsaW5lIHdpZHRoIGJhY2sgdG8gMSBpcyBoZXJlIHRvIHdvcmthcm91bmQgYSBHb29nbGUgQ2hyb21lIGJ1Z1xuICAgIC8vIGdsLmNsZWFyKCkgYW5kIGdsLmlzRW5hYmxlZCgpIHdpbGwgcmV0dXJuIEdMX0lOVkFMSURfVkFMVUUgZXZlbiB3aXRoXG4gICAgLy8gY29ycmVjdCBwYXJhbWV0ZXJcbiAgICAvLyBUaGlzIGlzIG5vdCBoYXBwZW5pbmcgb24gU2FmYXJpIGFuZCBGaXJlZm94XG4gICAgZ2wubGluZVdpZHRoKDEuMCk7XG4gIH1cblxuICBnZXRQaWNraW5nSW5mbyhvcHRzKSB7XG4gICAgY29uc3QgaW5mbyA9IHN1cGVyLmdldFBpY2tpbmdJbmZvKG9wdHMpO1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5kZWNvZGVQaWNraW5nQ29sb3IoaW5mby5jb2xvcik7XG4gICAgY29uc3QgZmVhdHVyZSA9IGluZGV4ID49IDAgPyBnZXQodGhpcy5wcm9wcy5kYXRhLCBbJ2ZlYXR1cmVzJywgaW5kZXhdKSA6IG51bGw7XG4gICAgaW5mby5mZWF0dXJlID0gZmVhdHVyZTtcbiAgICBpbmZvLm9iamVjdCA9IGZlYXR1cmU7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICBnZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHJldHVybiBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IHRoaXMucHJvcHMuZHJhd0NvbnRvdXIgPyBHTC5MSU5FUyA6IEdMLlRSSUFOR0xFU1xuICAgICAgfSksXG4gICAgICB2ZXJ0ZXhDb3VudDogMCxcbiAgICAgIGlzSW5kZXhlZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5kaWNlcyhhdHRyaWJ1dGUpIHtcbiAgICAvLyBhZGp1c3QgaW5kZXggb2Zmc2V0IGZvciBtdWx0aXBsZSBjaG9yb3BsZXRoc1xuICAgIGNvbnN0IG9mZnNldHMgPSB0aGlzLnN0YXRlLmNob3JvcGxldGhzLnJlZHVjZShcbiAgICAgIChhY2MsIGNob3JvcGxldGgpID0+IFsuLi5hY2MsIGFjY1thY2MubGVuZ3RoIC0gMV0gK1xuICAgICAgICBjaG9yb3BsZXRoLnJlZHVjZSgoY291bnQsIHBvbHlnb24pID0+IGNvdW50ICsgcG9seWdvbi5sZW5ndGgsIDApXSxcbiAgICAgIFswXVxuICAgICk7XG4gICAgY29uc3Qge0luZGV4VHlwZX0gPSB0aGlzLnN0YXRlO1xuICAgIGlmIChJbmRleFR5cGUgPT09IFVpbnQxNkFycmF5ICYmIG9mZnNldHNbb2Zmc2V0cy5sZW5ndGggLSAxXSA+IDY1NTM1KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZlcnRleCBjb3VudCBleGNlZWRzIGJyb3dzZXJcXCdzIGxpbWl0Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuc3RhdGUuY2hvcm9wbGV0aHMubWFwKFxuICAgICAgKGNob3JvcGxldGgsIGNob3JvcGxldGhJbmRleCkgPT4gdGhpcy5wcm9wcy5kcmF3Q29udG91ciA/XG4gICAgICAgIC8vIDEuIGdldCBzZXF1ZW50aWFsbHkgb3JkZXJlZCBpbmRpY2VzIG9mIGVhY2ggY2hvcm9wbGV0aCBjb250b3VyXG4gICAgICAgIC8vIDIuIG9mZnNldCB0aGVtIGJ5IHRoZSBudW1iZXIgb2YgaW5kaWNlcyBpbiBwcmV2aW91cyBjaG9yb3BsZXRoc1xuICAgICAgICBjYWxjdWxhdGVDb250b3VySW5kaWNlcyhjaG9yb3BsZXRoKS5tYXAoaW5kZXggPT4gaW5kZXggKyBvZmZzZXRzW2Nob3JvcGxldGhJbmRleF0pIDpcbiAgICAgICAgLy8gMS4gZ2V0IHRyaWFuZ3VsYXRlZCBpbmRpY2VzIGZvciB0aGUgaW50ZXJuYWwgYXJlYXNcbiAgICAgICAgLy8gMi4gb2Zmc2V0IHRoZW0gYnkgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHByZXZpb3VzIGNob3JvcGxldGhzXG4gICAgICAgIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKGNob3JvcGxldGgpLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldHNbY2hvcm9wbGV0aEluZGV4XSlcbiAgICApO1xuXG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEluZGV4VHlwZShmbGF0dGVuKGluZGljZXMpKTtcbiAgICBhdHRyaWJ1dGUudGFyZ2V0ID0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVI7XG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRWZXJ0ZXhDb3VudChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpO1xuICB9XG5cbiAgY2FsY3VsYXRlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHZlcnRpY2VzID0gZmxhdHRlbih0aGlzLnN0YXRlLmNob3JvcGxldGhzKTtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBmZWF0dXJlcyA9IGdldChkYXRhLCAnZmVhdHVyZXMnKTtcbiAgICBjb25zdCBjb2xvcnMgPSB0aGlzLnN0YXRlLmNob3JvcGxldGhzLm1hcChcbiAgICAgIChjaG9yb3BsZXRoLCBjaG9yb3BsZXRoSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgZmVhdHVyZSA9IGdldChmZWF0dXJlcywgY2hvcm9wbGV0aC5mZWF0dXJlSW5kZXgpO1xuICAgICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKGZlYXR1cmUpIHx8IERFRkFVTFRfQ09MT1I7XG4gICAgICAgIC8vIEVuc3VyZSBhbHBoYSBpcyBzZXRcbiAgICAgICAgaWYgKGlzTmFOKGNvbG9yWzNdKSkge1xuICAgICAgICAgIGNvbG9yWzNdID0gREVGQVVMVF9DT0xPUlszXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hvcm9wbGV0aC5tYXAocG9seWdvbiA9PiBwb2x5Z29uLm1hcCh2ZXJ0ZXggPT4gY29sb3IpKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IFVpbnQ4QXJyYXkoZmxhdHRlbihjb2xvcnMpKTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHBpY2tpbmcgY29sb3JzIGNhbGN1bGF0aW9uXG4gIGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3QgY29sb3JzID0gdGhpcy5zdGF0ZS5jaG9yb3BsZXRocy5tYXAoXG4gICAgICAoY2hvcm9wbGV0aCwgY2hvcm9wbGV0aEluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHtmZWF0dXJlSW5kZXh9ID0gY2hvcm9wbGV0aDtcbiAgICAgICAgY29uc3QgY29sb3IgPSB0aGlzLnByb3BzLmRyYXdDb250b3VyID8gWzAsIDAsIDBdIDogW1xuICAgICAgICAgIChmZWF0dXJlSW5kZXggKyAxKSAlIDI1NixcbiAgICAgICAgICBNYXRoLmZsb29yKChmZWF0dXJlSW5kZXggKyAxKSAvIDI1NikgJSAyNTYsXG4gICAgICAgICAgTWF0aC5mbG9vcigoZmVhdHVyZUluZGV4ICsgMSkgLyAyNTYgLyAyNTYpICUgMjU2XG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiBjaG9yb3BsZXRoLm1hcChwb2x5Z29uID0+IHBvbHlnb24ubWFwKHZlcnRleCA9PiBjb2xvcikpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgVWludDhBcnJheShmbGF0dGVuKGNvbG9ycykpO1xuICB9XG59XG5cbkNob3JvcGxldGhMYXllci5sYXllck5hbWUgPSAnQ2hvcm9wbGV0aExheWVyJztcbkNob3JvcGxldGhMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG5cbi8qXG4gKiBnZXQgdmVydGV4IGluZGljZXMgZm9yIGRyYXdpbmcgY2hvcm9wbGV0aCBjb250b3VyXG4gKiBAcGFyYW0ge1tOdW1iZXIsTnVtYmVyLE51bWJlcl1bXVtdfSBjaG9yb3BsZXRoXG4gKiBAcmV0dXJucyB7W051bWJlcl19IGluZGljZXNcbiAqL1xuZnVuY3Rpb24gY2FsY3VsYXRlQ29udG91ckluZGljZXMoY2hvcm9wbGV0aCkge1xuICBsZXQgb2Zmc2V0ID0gMDtcblxuICByZXR1cm4gY2hvcm9wbGV0aC5yZWR1Y2UoKGFjYywgcG9seWdvbikgPT4ge1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gcG9seWdvbi5sZW5ndGg7XG5cbiAgICAvLyB1c2UgdmVydGV4IHBhaXJzIGZvciBnbC5MSU5FUyA9PiBbMCwgMSwgMSwgMiwgMiwgLi4uLCBuLTIsIG4tMiwgbi0xXVxuICAgIGNvbnN0IGluZGljZXMgPSBbLi4uYWNjLCBvZmZzZXRdO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgIGluZGljZXMucHVzaChpICsgb2Zmc2V0LCBpICsgb2Zmc2V0KTtcbiAgICB9XG4gICAgaW5kaWNlcy5wdXNoKG9mZnNldCArIG51bVZlcnRpY2VzIC0gMSk7XG5cbiAgICBvZmZzZXQgKz0gbnVtVmVydGljZXM7XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH0sIFtdKTtcbn1cblxuLypcbiAqIGdldCB2ZXJ0ZXggaW5kaWNlcyBmb3IgZHJhd2luZyBjaG9yb3BsZXRoIG1lc2hcbiAqIEBwYXJhbSB7W051bWJlcixOdW1iZXIsTnVtYmVyXVtdW119IGNob3JvcGxldGhcbiAqIEByZXR1cm5zIHtbTnVtYmVyXX0gaW5kaWNlc1xuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyhjaG9yb3BsZXRoKSB7XG4gIGxldCBob2xlcyA9IG51bGw7XG5cbiAgaWYgKGNob3JvcGxldGgubGVuZ3RoID4gMSkge1xuICAgIGhvbGVzID0gY2hvcm9wbGV0aC5yZWR1Y2UoXG4gICAgICAoYWNjLCBwb2x5Z29uKSA9PiBbLi4uYWNjLCBhY2NbYWNjLmxlbmd0aCAtIDFdICsgcG9seWdvbi5sZW5ndGhdLFxuICAgICAgWzBdXG4gICAgKS5zbGljZSgxLCBjaG9yb3BsZXRoLmxlbmd0aCk7XG4gIH1cblxuICByZXR1cm4gZWFyY3V0KGZsYXR0ZW4oY2hvcm9wbGV0aCksIGhvbGVzLCAzKTtcbn1cbiJdfQ==
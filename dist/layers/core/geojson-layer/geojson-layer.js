'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _scatterplotLayer = require('../scatterplot-layer');

var _scatterplotLayer2 = _interopRequireDefault(_scatterplotLayer);

var _pathLayer = require('../path-layer/path-layer');

var _pathLayer2 = _interopRequireDefault(_pathLayer);

var _polygonLayer = require('../polygon-layer/polygon-layer');

var _polygonLayer2 = _interopRequireDefault(_polygonLayer);

var _utils = require('../../../lib/utils');

var _geojson = require('./geojson');

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

var defaultPointColor = [0xFF, 0x88, 0x00, 0xFF];
var defaultStrokeColor = [0x33, 0x33, 0x33, 0xFF];
var defaultFillColor = [0xBD, 0xE2, 0x7A, 0xFF];

var defaultProps = {
  drawPoints: true,
  drawLines: true,
  drawPolygons: true,
  fillPolygons: true,
  // extrudePolygons: false,
  // wireframe: false,

  // Point accessors
  getPointColor: function getPointColor(f) {
    return (0, _utils.get)(f, 'properties.color') || defaultPointColor;
  },
  getPointSize: function getPointSize(f) {
    return (0, _utils.get)(f, 'properties.size') || 5;
  },

  // Line and polygon outline accessors
  getStrokeColor: function getStrokeColor(f) {
    return (0, _utils.get)(f, 'properties.strokeColor') || defaultStrokeColor;
  },
  getStrokeWidth: function getStrokeWidth(f) {
    return (0, _utils.get)(f, 'properties.strokeWidth') || 1;
  },

  // Polygon fill accessors
  getFillColor: function getFillColor(f) {
    return (0, _utils.get)(f, 'properties.fillColor') || defaultFillColor;
  },

  // Polygon extrusion accessor
  getHeight: function getHeight(f) {
    return 1000;
  }
};

function noop() {}

var getCoordinates = function getCoordinates(f) {
  return (0, _utils.get)(f, 'geometry.coordinates');
};

var GeoJsonLayer = function (_Layer) {
  _inherits(GeoJsonLayer, _Layer);

  function GeoJsonLayer() {
    _classCallCheck(this, GeoJsonLayer);

    return _possibleConstructorReturn(this, (GeoJsonLayer.__proto__ || Object.getPrototypeOf(GeoJsonLayer)).apply(this, arguments));
  }

  _createClass(GeoJsonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        subLayers: null,
        pickInfos: []
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged) {
        var data = this.props.data;

        var features = (0, _geojson.getGeojsonFeatures)(data);
        this.state.subLayers = (0, _geojson.separateGeojsonFeatures)(features);
      }
    }
  }, {
    key: '_onHoverSublayer',
    value: function _onHoverSublayer(info) {
      this.state.pickInfos.push(info);
    }
  }, {
    key: 'pick',
    value: function pick(opts) {
      _get(GeoJsonLayer.prototype.__proto__ || Object.getPrototypeOf(GeoJsonLayer.prototype), 'pick', this).call(this, opts);

      var info = this.state.pickInfos.find(function (i) {
        return i.index >= 0;
      });

      if (opts.mode === 'hover') {
        this.state.pickInfos = [];
      }

      if (!info) {
        return;
      }

      Object.assign(opts.info, info, {
        layer: this,
        feature: (0, _utils.get)(info, 'object.feature') || info.object
      });
    }
  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      var _state$subLayers = this.state.subLayers,
          pointFeatures = _state$subLayers.pointFeatures,
          lineFeatures = _state$subLayers.lineFeatures,
          polygonFeatures = _state$subLayers.polygonFeatures,
          polygonOutlineFeatures = _state$subLayers.polygonOutlineFeatures;
      var _props = this.props,
          id = _props.id,
          getPointColor = _props.getPointColor,
          getPointSize = _props.getPointSize,
          getStrokeColor = _props.getStrokeColor,
          getStrokeWidth = _props.getStrokeWidth,
          getFillColor = _props.getFillColor,
          getHeight = _props.getHeight;
      var _props2 = this.props,
          extruded = _props2.extruded,
          wireframe = _props2.wireframe;
      var _props3 = this.props,
          drawPoints = _props3.drawPoints,
          drawLines = _props3.drawLines,
          drawPolygons = _props3.drawPolygons,
          fillPolygons = _props3.fillPolygons;

      drawPoints = drawPoints && pointFeatures && pointFeatures.length > 0;
      drawLines = drawLines && lineFeatures && lineFeatures.length > 0;
      drawPolygons = drawPolygons && polygonOutlineFeatures && polygonOutlineFeatures.length > 0;
      fillPolygons = fillPolygons && polygonFeatures && polygonFeatures.length > 0;

      // Override user's onHover and onClick props
      var handlers = {
        onHover: this._onHoverSublayer.bind(this),
        onClick: noop
      };

      // Filled Polygon Layer
      var polygonFillLayer = fillPolygons && new _polygonLayer2.default(Object.assign({}, this.props, handlers, {
        id: id + '-polygon-fill',
        data: polygonFeatures,
        getPolygon: getCoordinates,
        getHeight: getHeight,
        getColor: getFillColor,
        extruded: extruded,
        wireframe: false,
        updateTriggers: {
          getHeight: this.props.updateTriggers.getHeight,
          getColor: this.props.updateTriggers.getFillColor
        }
      }));

      // Polygon outline or wireframe
      var polygonOutlineLayer = null;
      if (drawPolygons && extruded && wireframe) {
        polygonOutlineLayer = new _polygonLayer2.default(Object.assign({}, this.props, handlers, {
          id: id + '-polygon-wireframe',
          data: polygonFeatures,
          getPolygon: getCoordinates,
          getHeight: getHeight,
          getColor: getStrokeColor,
          extruded: true,
          wireframe: true,
          updateTriggers: {
            getColor: this.props.updateTriggers.getStrokeColor
          }
        }));
      } else if (drawPolygons) {
        polygonOutlineLayer = new _pathLayer2.default(Object.assign({}, this.props, handlers, {
          id: id + '-polygon-outline',
          data: polygonOutlineFeatures,
          getPath: getCoordinates,
          getColor: getStrokeColor,
          getWidth: getStrokeWidth,
          updateTriggers: {
            getColor: this.props.updateTriggers.getStrokeColor,
            getWidth: this.props.updateTriggers.getStrokeWidth
          }
        }));
      }

      var lineLayer = drawLines && new _pathLayer2.default(Object.assign({}, this.props, handlers, {
        id: id + '-line-paths',
        data: lineFeatures,
        getPath: getCoordinates,
        getColor: getStrokeColor,
        getWidth: getStrokeWidth,
        updateTriggers: {
          getColor: this.props.updateTriggers.getStrokeColor,
          getWidth: this.props.updateTriggers.getStrokeWidth
        }
      }));

      var pointLayer = drawPoints && new _scatterplotLayer2.default(Object.assign({}, this.props, handlers, {
        id: id + '-points',
        data: pointFeatures,
        getPosition: getCoordinates,
        getColor: getPointColor,
        getRadius: getPointSize,
        updateTriggers: {
          getColor: this.props.updateTriggers.getPointColor,
          getRadius: this.props.updateTriggers.getPointSize
        }
      }));

      return [polygonFillLayer, polygonOutlineLayer, lineLayer, pointLayer].filter(Boolean);
    }
  }]);

  return GeoJsonLayer;
}(_lib.Layer);

exports.default = GeoJsonLayer;


GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9nZW9qc29uLWxheWVyL2dlb2pzb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdFBvaW50Q29sb3IiLCJkZWZhdWx0U3Ryb2tlQ29sb3IiLCJkZWZhdWx0RmlsbENvbG9yIiwiZGVmYXVsdFByb3BzIiwiZHJhd1BvaW50cyIsImRyYXdMaW5lcyIsImRyYXdQb2x5Z29ucyIsImZpbGxQb2x5Z29ucyIsImdldFBvaW50Q29sb3IiLCJmIiwiZ2V0UG9pbnRTaXplIiwiZ2V0U3Ryb2tlQ29sb3IiLCJnZXRTdHJva2VXaWR0aCIsImdldEZpbGxDb2xvciIsImdldEhlaWdodCIsIm5vb3AiLCJnZXRDb29yZGluYXRlcyIsIkdlb0pzb25MYXllciIsInN0YXRlIiwic3ViTGF5ZXJzIiwicGlja0luZm9zIiwib2xkUHJvcHMiLCJwcm9wcyIsImNoYW5nZUZsYWdzIiwiZGF0YUNoYW5nZWQiLCJkYXRhIiwiZmVhdHVyZXMiLCJpbmZvIiwicHVzaCIsIm9wdHMiLCJmaW5kIiwiaSIsImluZGV4IiwibW9kZSIsIk9iamVjdCIsImFzc2lnbiIsImxheWVyIiwiZmVhdHVyZSIsIm9iamVjdCIsInBvaW50RmVhdHVyZXMiLCJsaW5lRmVhdHVyZXMiLCJwb2x5Z29uRmVhdHVyZXMiLCJwb2x5Z29uT3V0bGluZUZlYXR1cmVzIiwiaWQiLCJleHRydWRlZCIsIndpcmVmcmFtZSIsImxlbmd0aCIsImhhbmRsZXJzIiwib25Ib3ZlciIsIl9vbkhvdmVyU3VibGF5ZXIiLCJiaW5kIiwib25DbGljayIsInBvbHlnb25GaWxsTGF5ZXIiLCJnZXRQb2x5Z29uIiwiZ2V0Q29sb3IiLCJ1cGRhdGVUcmlnZ2VycyIsInBvbHlnb25PdXRsaW5lTGF5ZXIiLCJnZXRQYXRoIiwiZ2V0V2lkdGgiLCJsaW5lTGF5ZXIiLCJwb2ludExheWVyIiwiZ2V0UG9zaXRpb24iLCJnZXRSYWRpdXMiLCJmaWx0ZXIiLCJCb29sZWFuIiwibGF5ZXJOYW1l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QVdpQyxjQUFYLENBQTBCL0MsYUFEdEI7QUFFZHNELHFCQUFXLEtBQUt4QyxLQUFMLENBQVdpQyxjQUFYLENBQTBCN0M7QUFGdkI7QUFOSSxPQUQ4QixDQUFyQixDQUFqQzs7QUFhQSxhQUFPLENBQ0wwQyxnQkFESyxFQUVMSSxtQkFGSyxFQUdMRyxTQUhLLEVBSUxDLFVBSkssRUFLTEcsTUFMSyxDQUtFQyxPQUxGLENBQVA7QUFNRDs7Ozs7O2tCQXZJa0IvQyxZOzs7QUEwSXJCQSxhQUFhZ0QsU0FBYixHQUF5QixjQUF6QjtBQUNBaEQsYUFBYWQsWUFBYixHQUE0QkEsWUFBNUIiLCJmaWxlIjoiZ2VvanNvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNiBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQgU2NhdHRlcnBsb3RMYXllciBmcm9tICcuLi9zY2F0dGVycGxvdC1sYXllcic7XG5pbXBvcnQgUGF0aExheWVyIGZyb20gJy4uL3BhdGgtbGF5ZXIvcGF0aC1sYXllcic7XG5pbXBvcnQgUG9seWdvbkxheWVyIGZyb20gJy4uL3BvbHlnb24tbGF5ZXIvcG9seWdvbi1sYXllcic7XG5cbmltcG9ydCB7Z2V0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuaW1wb3J0IHtnZXRHZW9qc29uRmVhdHVyZXMsIHNlcGFyYXRlR2VvanNvbkZlYXR1cmVzfSBmcm9tICcuL2dlb2pzb24nO1xuXG5jb25zdCBkZWZhdWx0UG9pbnRDb2xvciA9IFsweEZGLCAweDg4LCAweDAwLCAweEZGXTtcbmNvbnN0IGRlZmF1bHRTdHJva2VDb2xvciA9IFsweDMzLCAweDMzLCAweDMzLCAweEZGXTtcbmNvbnN0IGRlZmF1bHRGaWxsQ29sb3IgPSBbMHhCRCwgMHhFMiwgMHg3QSwgMHhGRl07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgZHJhd1BvaW50czogdHJ1ZSxcbiAgZHJhd0xpbmVzOiB0cnVlLFxuICBkcmF3UG9seWdvbnM6IHRydWUsXG4gIGZpbGxQb2x5Z29uczogdHJ1ZSxcbiAgLy8gZXh0cnVkZVBvbHlnb25zOiBmYWxzZSxcbiAgLy8gd2lyZWZyYW1lOiBmYWxzZSxcblxuICAvLyBQb2ludCBhY2Nlc3NvcnNcbiAgZ2V0UG9pbnRDb2xvcjogZiA9PiBnZXQoZiwgJ3Byb3BlcnRpZXMuY29sb3InKSB8fCBkZWZhdWx0UG9pbnRDb2xvcixcbiAgZ2V0UG9pbnRTaXplOiBmID0+IGdldChmLCAncHJvcGVydGllcy5zaXplJykgfHwgNSxcblxuICAvLyBMaW5lIGFuZCBwb2x5Z29uIG91dGxpbmUgYWNjZXNzb3JzXG4gIGdldFN0cm9rZUNvbG9yOiBmID0+IGdldChmLCAncHJvcGVydGllcy5zdHJva2VDb2xvcicpIHx8IGRlZmF1bHRTdHJva2VDb2xvcixcbiAgZ2V0U3Ryb2tlV2lkdGg6IGYgPT4gZ2V0KGYsICdwcm9wZXJ0aWVzLnN0cm9rZVdpZHRoJykgfHwgMSxcblxuICAvLyBQb2x5Z29uIGZpbGwgYWNjZXNzb3JzXG4gIGdldEZpbGxDb2xvcjogZiA9PiBnZXQoZiwgJ3Byb3BlcnRpZXMuZmlsbENvbG9yJykgfHwgZGVmYXVsdEZpbGxDb2xvcixcblxuICAvLyBQb2x5Z29uIGV4dHJ1c2lvbiBhY2Nlc3NvclxuICBnZXRIZWlnaHQ6IGYgPT4gMTAwMFxufTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmNvbnN0IGdldENvb3JkaW5hdGVzID0gZiA9PiBnZXQoZiwgJ2dlb21ldHJ5LmNvb3JkaW5hdGVzJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlb0pzb25MYXllciBleHRlbmRzIExheWVyIHtcbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBzdWJMYXllcnM6IG51bGwsXG4gICAgICBwaWNrSW5mb3M6IFtdXG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCkge1xuICAgICAgY29uc3Qge2RhdGF9ID0gdGhpcy5wcm9wcztcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gZ2V0R2VvanNvbkZlYXR1cmVzKGRhdGEpO1xuICAgICAgdGhpcy5zdGF0ZS5zdWJMYXllcnMgPSBzZXBhcmF0ZUdlb2pzb25GZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgfVxuICB9XG5cbiAgX29uSG92ZXJTdWJsYXllcihpbmZvKSB7XG4gICAgdGhpcy5zdGF0ZS5waWNrSW5mb3MucHVzaChpbmZvKTtcbiAgfVxuXG4gIHBpY2sob3B0cykge1xuICAgIHN1cGVyLnBpY2sob3B0cyk7XG5cbiAgICBjb25zdCBpbmZvID0gdGhpcy5zdGF0ZS5waWNrSW5mb3MuZmluZChpID0+IGkuaW5kZXggPj0gMCk7XG5cbiAgICBpZiAob3B0cy5tb2RlID09PSAnaG92ZXInKSB7XG4gICAgICB0aGlzLnN0YXRlLnBpY2tJbmZvcyA9IFtdO1xuICAgIH1cblxuICAgIGlmICghaW5mbykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIE9iamVjdC5hc3NpZ24ob3B0cy5pbmZvLCBpbmZvLCB7XG4gICAgICBsYXllcjogdGhpcyxcbiAgICAgIGZlYXR1cmU6IGdldChpbmZvLCAnb2JqZWN0LmZlYXR1cmUnKSB8fCBpbmZvLm9iamVjdFxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyTGF5ZXJzKCkge1xuICAgIGNvbnN0IHtzdWJMYXllcnM6IHtwb2ludEZlYXR1cmVzLCBsaW5lRmVhdHVyZXMsIHBvbHlnb25GZWF0dXJlcyxcbiAgICAgIHBvbHlnb25PdXRsaW5lRmVhdHVyZXN9fSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge2lkLCBnZXRQb2ludENvbG9yLCBnZXRQb2ludFNpemUsIGdldFN0cm9rZUNvbG9yLCBnZXRTdHJva2VXaWR0aCxcbiAgICAgIGdldEZpbGxDb2xvciwgZ2V0SGVpZ2h0fSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge2V4dHJ1ZGVkLCB3aXJlZnJhbWV9ID0gdGhpcy5wcm9wcztcblxuICAgIGxldCB7ZHJhd1BvaW50cywgZHJhd0xpbmVzLCBkcmF3UG9seWdvbnMsIGZpbGxQb2x5Z29uc30gPSB0aGlzLnByb3BzO1xuICAgIGRyYXdQb2ludHMgPSBkcmF3UG9pbnRzICYmIHBvaW50RmVhdHVyZXMgJiYgcG9pbnRGZWF0dXJlcy5sZW5ndGggPiAwO1xuICAgIGRyYXdMaW5lcyA9IGRyYXdMaW5lcyAmJiBsaW5lRmVhdHVyZXMgJiYgbGluZUZlYXR1cmVzLmxlbmd0aCA+IDA7XG4gICAgZHJhd1BvbHlnb25zID0gZHJhd1BvbHlnb25zICYmIHBvbHlnb25PdXRsaW5lRmVhdHVyZXMgJiYgcG9seWdvbk91dGxpbmVGZWF0dXJlcy5sZW5ndGggPiAwO1xuICAgIGZpbGxQb2x5Z29ucyA9IGZpbGxQb2x5Z29ucyAmJiBwb2x5Z29uRmVhdHVyZXMgJiYgcG9seWdvbkZlYXR1cmVzLmxlbmd0aCA+IDA7XG5cbiAgICAvLyBPdmVycmlkZSB1c2VyJ3Mgb25Ib3ZlciBhbmQgb25DbGljayBwcm9wc1xuICAgIGNvbnN0IGhhbmRsZXJzID0ge1xuICAgICAgb25Ib3ZlcjogdGhpcy5fb25Ib3ZlclN1YmxheWVyLmJpbmQodGhpcyksXG4gICAgICBvbkNsaWNrOiBub29wXG4gICAgfTtcblxuICAgIC8vIEZpbGxlZCBQb2x5Z29uIExheWVyXG4gICAgY29uc3QgcG9seWdvbkZpbGxMYXllciA9IGZpbGxQb2x5Z29ucyAmJiBuZXcgUG9seWdvbkxheWVyKE9iamVjdC5hc3NpZ24oe30sXG4gICAgICB0aGlzLnByb3BzLCBoYW5kbGVycywge1xuICAgICAgICBpZDogYCR7aWR9LXBvbHlnb24tZmlsbGAsXG4gICAgICAgIGRhdGE6IHBvbHlnb25GZWF0dXJlcyxcbiAgICAgICAgZ2V0UG9seWdvbjogZ2V0Q29vcmRpbmF0ZXMsXG4gICAgICAgIGdldEhlaWdodCxcbiAgICAgICAgZ2V0Q29sb3I6IGdldEZpbGxDb2xvcixcbiAgICAgICAgZXh0cnVkZWQsXG4gICAgICAgIHdpcmVmcmFtZTogZmFsc2UsXG4gICAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgICAgZ2V0SGVpZ2h0OiB0aGlzLnByb3BzLnVwZGF0ZVRyaWdnZXJzLmdldEhlaWdodCxcbiAgICAgICAgICBnZXRDb2xvcjogdGhpcy5wcm9wcy51cGRhdGVUcmlnZ2Vycy5nZXRGaWxsQ29sb3JcbiAgICAgICAgfVxuICAgICAgfSkpO1xuXG4gICAgLy8gUG9seWdvbiBvdXRsaW5lIG9yIHdpcmVmcmFtZVxuICAgIGxldCBwb2x5Z29uT3V0bGluZUxheWVyID0gbnVsbDtcbiAgICBpZiAoZHJhd1BvbHlnb25zICYmIGV4dHJ1ZGVkICYmIHdpcmVmcmFtZSkge1xuICAgICAgcG9seWdvbk91dGxpbmVMYXllciA9IG5ldyBQb2x5Z29uTGF5ZXIoT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5wcm9wcywgaGFuZGxlcnMsIHtcbiAgICAgICAgaWQ6IGAke2lkfS1wb2x5Z29uLXdpcmVmcmFtZWAsXG4gICAgICAgIGRhdGE6IHBvbHlnb25GZWF0dXJlcyxcbiAgICAgICAgZ2V0UG9seWdvbjogZ2V0Q29vcmRpbmF0ZXMsXG4gICAgICAgIGdldEhlaWdodCxcbiAgICAgICAgZ2V0Q29sb3I6IGdldFN0cm9rZUNvbG9yLFxuICAgICAgICBleHRydWRlZDogdHJ1ZSxcbiAgICAgICAgd2lyZWZyYW1lOiB0cnVlLFxuICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgIGdldENvbG9yOiB0aGlzLnByb3BzLnVwZGF0ZVRyaWdnZXJzLmdldFN0cm9rZUNvbG9yXG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9IGVsc2UgaWYgKGRyYXdQb2x5Z29ucykge1xuICAgICAgcG9seWdvbk91dGxpbmVMYXllciA9IG5ldyBQYXRoTGF5ZXIoT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5wcm9wcywgaGFuZGxlcnMsIHtcbiAgICAgICAgaWQ6IGAke2lkfS1wb2x5Z29uLW91dGxpbmVgLFxuICAgICAgICBkYXRhOiBwb2x5Z29uT3V0bGluZUZlYXR1cmVzLFxuICAgICAgICBnZXRQYXRoOiBnZXRDb29yZGluYXRlcyxcbiAgICAgICAgZ2V0Q29sb3I6IGdldFN0cm9rZUNvbG9yLFxuICAgICAgICBnZXRXaWR0aDogZ2V0U3Ryb2tlV2lkdGgsXG4gICAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgICAgZ2V0Q29sb3I6IHRoaXMucHJvcHMudXBkYXRlVHJpZ2dlcnMuZ2V0U3Ryb2tlQ29sb3IsXG4gICAgICAgICAgZ2V0V2lkdGg6IHRoaXMucHJvcHMudXBkYXRlVHJpZ2dlcnMuZ2V0U3Ryb2tlV2lkdGhcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmVMYXllciA9IGRyYXdMaW5lcyAmJiBuZXcgUGF0aExheWVyKE9iamVjdC5hc3NpZ24oe30sXG4gICAgICB0aGlzLnByb3BzLCBoYW5kbGVycywge1xuICAgICAgICBpZDogYCR7aWR9LWxpbmUtcGF0aHNgLFxuICAgICAgICBkYXRhOiBsaW5lRmVhdHVyZXMsXG4gICAgICAgIGdldFBhdGg6IGdldENvb3JkaW5hdGVzLFxuICAgICAgICBnZXRDb2xvcjogZ2V0U3Ryb2tlQ29sb3IsXG4gICAgICAgIGdldFdpZHRoOiBnZXRTdHJva2VXaWR0aCxcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRDb2xvcjogdGhpcy5wcm9wcy51cGRhdGVUcmlnZ2Vycy5nZXRTdHJva2VDb2xvcixcbiAgICAgICAgICBnZXRXaWR0aDogdGhpcy5wcm9wcy51cGRhdGVUcmlnZ2Vycy5nZXRTdHJva2VXaWR0aFxuICAgICAgICB9XG4gICAgICB9KSk7XG5cbiAgICBjb25zdCBwb2ludExheWVyID0gZHJhd1BvaW50cyAmJiBuZXcgU2NhdHRlcnBsb3RMYXllcihPYmplY3QuYXNzaWduKHt9LFxuICAgICAgdGhpcy5wcm9wcywgaGFuZGxlcnMsIHtcbiAgICAgICAgaWQ6IGAke2lkfS1wb2ludHNgLFxuICAgICAgICBkYXRhOiBwb2ludEZlYXR1cmVzLFxuICAgICAgICBnZXRQb3NpdGlvbjogZ2V0Q29vcmRpbmF0ZXMsXG4gICAgICAgIGdldENvbG9yOiBnZXRQb2ludENvbG9yLFxuICAgICAgICBnZXRSYWRpdXM6IGdldFBvaW50U2l6ZSxcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRDb2xvcjogdGhpcy5wcm9wcy51cGRhdGVUcmlnZ2Vycy5nZXRQb2ludENvbG9yLFxuICAgICAgICAgIGdldFJhZGl1czogdGhpcy5wcm9wcy51cGRhdGVUcmlnZ2Vycy5nZXRQb2ludFNpemVcbiAgICAgICAgfVxuICAgICAgfSkpO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIHBvbHlnb25GaWxsTGF5ZXIsXG4gICAgICBwb2x5Z29uT3V0bGluZUxheWVyLFxuICAgICAgbGluZUxheWVyLFxuICAgICAgcG9pbnRMYXllclxuICAgIF0uZmlsdGVyKEJvb2xlYW4pO1xuICB9XG59XG5cbkdlb0pzb25MYXllci5sYXllck5hbWUgPSAnR2VvSnNvbkxheWVyJztcbkdlb0pzb25MYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
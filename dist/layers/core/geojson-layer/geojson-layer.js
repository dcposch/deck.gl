'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _scatterplotLayer = require('../scatterplot-layer/scatterplot-layer');

var _scatterplotLayer2 = _interopRequireDefault(_scatterplotLayer);

var _pathLayer = require('../path-layer/path-layer');

var _pathLayer2 = _interopRequireDefault(_pathLayer);

var _solidPolygonLayer = require('../solid-polygon-layer/solid-polygon-layer');

var _solidPolygonLayer2 = _interopRequireDefault(_solidPolygonLayer);

var _geojson = require('./geojson');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectDestructuringEmpty(obj) { if (obj == null) throw new TypeError("Cannot destructure undefined"); }

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

// Use primitive layer to avoid "Composite Composite" layers for now


var defaultStrokeColor = [0xBD, 0xE2, 0x7A, 0xFF];
var defaultFillColor = [0xBD, 0xE2, 0x7A, 0xFF];

var defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,
  fp64: false,

  // TODO: Missing props: radiusMinPixels, strokeWidthMinPixels, ...

  // Line and polygon outline color
  getColor: function getColor(f) {
    return (0, _lib.get)(f, 'properties.strokeColor') || defaultStrokeColor;
  },
  // Point and polygon fill color
  getFillColor: function getFillColor(f) {
    return (0, _lib.get)(f, 'properties.fillColor') || defaultFillColor;
  },
  // Point radius
  getRadius: function getRadius(f) {
    return (0, _lib.get)(f, 'properties.radius') || (0, _lib.get)(f, 'properties.size') || 5;
  },
  // Line and polygon outline accessors
  getWidth: function getWidth(f) {
    return (0, _lib.get)(f, 'properties.strokeWidth') || 1;
  },
  // Polygon extrusion accessor
  getElevation: function getElevation(f) {
    return 1000;
  }
};

var getCoordinates = function getCoordinates(f) {
  return (0, _lib.get)(f, 'geometry.coordinates');
};

var GeoJsonLayer = function (_CompositeLayer) {
  _inherits(GeoJsonLayer, _CompositeLayer);

  function GeoJsonLayer() {
    _classCallCheck(this, GeoJsonLayer);

    return _possibleConstructorReturn(this, (GeoJsonLayer.__proto__ || Object.getPrototypeOf(GeoJsonLayer)).apply(this, arguments));
  }

  _createClass(GeoJsonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        features: {}
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
        this.state.features = (0, _geojson.separateGeojsonFeatures)(features);
      }
    }
  }, {
    key: '_onHoverSubLayer',
    value: function _onHoverSubLayer(info) {
      info.object = info.object && info.object.feature || info.object;
      this.props.onHover(info);
    }
  }, {
    key: '_onClickSubLayer',
    value: function _onClickSubLayer(info) {
      info.object = info.object && info.object.feature || info.object;
      this.props.onClick(info);
    }
  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      var features = this.state.features;
      var pointFeatures = features.pointFeatures,
          lineFeatures = features.lineFeatures,
          polygonFeatures = features.polygonFeatures,
          polygonOutlineFeatures = features.polygonOutlineFeatures;
      var _props = this.props,
          getColor = _props.getColor,
          getFillColor = _props.getFillColor,
          getRadius = _props.getRadius,
          getWidth = _props.getWidth,
          getElevation = _props.getElevation,
          updateTriggers = _props.updateTriggers;
      var _props2 = this.props,
          id = _props2.id,
          stroked = _props2.stroked,
          filled = _props2.filled,
          extruded = _props2.extruded,
          wireframe = _props2.wireframe;

      _objectDestructuringEmpty(this.props);

      var drawPoints = pointFeatures && pointFeatures.length > 0;
      var drawLines = lineFeatures && lineFeatures.length > 0;
      var hasPolygonOutline = polygonOutlineFeatures && polygonOutlineFeatures.length > 0;
      var hasPolygon = polygonFeatures && polygonFeatures.length > 0;

      var onHover = this._onHoverSubLayer.bind(this);
      var onClick = this._onClickSubLayer.bind(this);

      // Filled Polygon Layer
      var polygonFillLayer = filled && hasPolygon && new _solidPolygonLayer2.default(Object.assign({}, this.props, {
        id: id + '-polygon-fill',
        data: polygonFeatures,
        extruded: extruded,
        wireframe: false,
        getPolygon: getCoordinates,
        getElevation: getElevation,
        getColor: getFillColor,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getFillColor
        },
        onHover: onHover,
        onClick: onClick
      }));

      var polygonWireframeLayer = wireframe && extruded && hasPolygon && new _solidPolygonLayer2.default(Object.assign({}, this.props, {
        id: id + '-polygon-wireframe',
        data: polygonFeatures,
        extruded: extruded,
        wireframe: true,
        getPolygon: getCoordinates,
        getElevation: getElevation,
        getColor: getColor,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getColor
        },
        onHover: onHover,
        onClick: onClick
      }));

      var polygonOutlineLayer = !extruded && stroked && hasPolygonOutline && new _pathLayer2.default(Object.assign({}, this.props, {
        id: id + '-polygon-outline',
        data: polygonOutlineFeatures,
        getPath: getCoordinates,
        getColor: getColor,
        getWidth: getWidth,
        updateTriggers: {
          getColor: updateTriggers.getColor,
          getWidth: updateTriggers.getWidth
        },
        onHover: onHover,
        onClick: onClick
      }));

      var lineLayer = drawLines && new _pathLayer2.default(Object.assign({}, this.props, {
        id: id + '-line-paths',
        data: lineFeatures,
        getPath: getCoordinates,
        getColor: getColor,
        getWidth: getWidth,
        onHover: onHover,
        onClick: onClick,
        updateTriggers: {
          getColor: updateTriggers.getColor,
          getWidth: updateTriggers.getWidth
        }
      }));

      var pointLayer = drawPoints && new _scatterplotLayer2.default(Object.assign({}, this.props, {
        id: id + '-points',
        data: pointFeatures,
        getPosition: getCoordinates,
        getColor: getFillColor,
        getRadius: getRadius,
        updateTriggers: {
          getColor: updateTriggers.getFillColor,
          getRadius: updateTriggers.getRadius
        },
        onHover: onHover,
        onClick: onClick
      }));

      return [polygonFillLayer, polygonWireframeLayer, polygonOutlineLayer, lineLayer, pointLayer].filter(Boolean);
    }
  }]);

  return GeoJsonLayer;
}(_lib.CompositeLayer);

exports.default = GeoJsonLayer;


GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9nZW9qc29uLWxheWVyL2dlb2pzb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdFN0cm9rZUNvbG9yIiwiZGVmYXVsdEZpbGxDb2xvciIsImRlZmF1bHRQcm9wcyIsInN0cm9rZWQiLCJmaWxsZWQiLCJleHRydWRlZCIsIndpcmVmcmFtZSIsImZwNjQiLCJnZXRDb2xvciIsImYiLCJnZXRGaWxsQ29sb3IiLCJnZXRSYWRpdXMiLCJnZXRXaWR0aCIsImdldEVsZXZhdGlvbiIsImdldENvb3JkaW5hdGVzIiwiR2VvSnNvbkxheWVyIiwic3RhdGUiLCJmZWF0dXJlcyIsIm9sZFByb3BzIiwicHJvcHMiLCJjaGFuZ2VGbGFncyIsImRhdGFDaGFuZ2VkIiwiZGF0YSIsImluZm8iLCJvYmplY3QiLCJmZWF0dXJlIiwib25Ib3ZlciIsIm9uQ2xpY2siLCJwb2ludEZlYXR1cmVzIiwibGluZUZlYXR1cmVzIiwicG9seWdvbkZlYXR1cmVzIiwicG9seWdvbk91dGxpbmVGZWF0dXJlcyIsInVwZGF0ZVRyaWdnZXJzIiwiaWQiLCJkcmF3UG9pbnRzIiwibGVuZ3RoIiwiZHJhd0xpbmVzIiwiaGFzUG9seWdvbk91dGxpbmUiLCJoYXNQb2x5Z29uIiwiX29uSG92ZXJTdWJMYXllciIsImJpbmQiLCJfb25DbGlja1N1YkxheWVyIiwicG9seWdvbkZpbGxMYXllciIsIk9iamVjdCIsImFzc2lnbiIsImdldFBvbHlnb24iLCJwb2x5Z29uV2lyZWZyYW1lTGF5ZXIiLCJwb2x5Z29uT3V0bGluZUxheWVyIiwiZ2V0UGF0aCIsImxpbmVMYXllciIsInBvaW50TGF5ZXIiLCJnZXRQb3NpdGlvbiIsImZpbHRlciIsIkJvb2xlYW4iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBb0JBOztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUVBOzs7Ozs7Ozs7OytlQTFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUNkeEIsb0JBQVV3QixlQUFleEIsUUFEWDtBQUVkSSxvQkFBVW9CLGVBQWVwQjtBQUZYO0FBUnlELE9BQTlCLENBQWQsQ0FBL0I7O0FBY0EsVUFBTXNDLGFBQWFoQixjQUFjLCtCQUFxQlMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsS0FBS3pCLEtBQXZCLEVBQThCO0FBQ2xGYyxZQUFPQSxFQUFQLFlBRGtGO0FBRWxGWCxjQUFNTSxhQUY0RTtBQUdsRnVCLHFCQUFhckMsY0FIcUU7QUFJbEZOLGtCQUFVRSxZQUp3RTtBQUtsRkMsNEJBTGtGO0FBTWxGcUIsd0JBQWdCO0FBQ2R4QixvQkFBVXdCLGVBQWV0QixZQURYO0FBRWRDLHFCQUFXcUIsZUFBZXJCO0FBRlosU0FOa0U7QUFVbEZlLHdCQVZrRjtBQVdsRkM7QUFYa0YsT0FBOUIsQ0FBckIsQ0FBakM7O0FBY0EsYUFBTyxDQUNMZSxnQkFESyxFQUVMSSxxQkFGSyxFQUdMQyxtQkFISyxFQUlMRSxTQUpLLEVBS0xDLFVBTEssRUFNTEUsTUFOSyxDQU1FQyxPQU5GLENBQVA7QUFPRDs7Ozs7O2tCQWxJa0J0QyxZOzs7QUFxSXJCQSxhQUFhdUMsU0FBYixHQUF5QixjQUF6QjtBQUNBdkMsYUFBYWIsWUFBYixHQUE0QkEsWUFBNUIiLCJmaWxlIjoiZ2VvanNvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNiBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7Q29tcG9zaXRlTGF5ZXIsIGdldH0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCBTY2F0dGVycGxvdExheWVyIGZyb20gJy4uL3NjYXR0ZXJwbG90LWxheWVyL3NjYXR0ZXJwbG90LWxheWVyJztcbmltcG9ydCBQYXRoTGF5ZXIgZnJvbSAnLi4vcGF0aC1sYXllci9wYXRoLWxheWVyJztcbi8vIFVzZSBwcmltaXRpdmUgbGF5ZXIgdG8gYXZvaWQgXCJDb21wb3NpdGUgQ29tcG9zaXRlXCIgbGF5ZXJzIGZvciBub3dcbmltcG9ydCBTb2xpZFBvbHlnb25MYXllciBmcm9tICcuLi9zb2xpZC1wb2x5Z29uLWxheWVyL3NvbGlkLXBvbHlnb24tbGF5ZXInO1xuXG5pbXBvcnQge2dldEdlb2pzb25GZWF0dXJlcywgc2VwYXJhdGVHZW9qc29uRmVhdHVyZXN9IGZyb20gJy4vZ2VvanNvbic7XG5cbmNvbnN0IGRlZmF1bHRTdHJva2VDb2xvciA9IFsweEJELCAweEUyLCAweDdBLCAweEZGXTtcbmNvbnN0IGRlZmF1bHRGaWxsQ29sb3IgPSBbMHhCRCwgMHhFMiwgMHg3QSwgMHhGRl07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgc3Ryb2tlZDogdHJ1ZSxcbiAgZmlsbGVkOiB0cnVlLFxuICBleHRydWRlZDogZmFsc2UsXG4gIHdpcmVmcmFtZTogZmFsc2UsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIC8vIFRPRE86IE1pc3NpbmcgcHJvcHM6IHJhZGl1c01pblBpeGVscywgc3Ryb2tlV2lkdGhNaW5QaXhlbHMsIC4uLlxuXG4gIC8vIExpbmUgYW5kIHBvbHlnb24gb3V0bGluZSBjb2xvclxuICBnZXRDb2xvcjogZiA9PiBnZXQoZiwgJ3Byb3BlcnRpZXMuc3Ryb2tlQ29sb3InKSB8fCBkZWZhdWx0U3Ryb2tlQ29sb3IsXG4gIC8vIFBvaW50IGFuZCBwb2x5Z29uIGZpbGwgY29sb3JcbiAgZ2V0RmlsbENvbG9yOiBmID0+IGdldChmLCAncHJvcGVydGllcy5maWxsQ29sb3InKSB8fCBkZWZhdWx0RmlsbENvbG9yLFxuICAvLyBQb2ludCByYWRpdXNcbiAgZ2V0UmFkaXVzOiBmID0+IGdldChmLCAncHJvcGVydGllcy5yYWRpdXMnKSB8fCBnZXQoZiwgJ3Byb3BlcnRpZXMuc2l6ZScpIHx8IDUsXG4gIC8vIExpbmUgYW5kIHBvbHlnb24gb3V0bGluZSBhY2Nlc3NvcnNcbiAgZ2V0V2lkdGg6IGYgPT4gZ2V0KGYsICdwcm9wZXJ0aWVzLnN0cm9rZVdpZHRoJykgfHwgMSxcbiAgLy8gUG9seWdvbiBleHRydXNpb24gYWNjZXNzb3JcbiAgZ2V0RWxldmF0aW9uOiBmID0+IDEwMDBcbn07XG5cbmNvbnN0IGdldENvb3JkaW5hdGVzID0gZiA9PiBnZXQoZiwgJ2dlb21ldHJ5LmNvb3JkaW5hdGVzJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlb0pzb25MYXllciBleHRlbmRzIENvbXBvc2l0ZUxheWVyIHtcbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBmZWF0dXJlczoge31cbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKGNoYW5nZUZsYWdzLmRhdGFDaGFuZ2VkKSB7XG4gICAgICBjb25zdCB7ZGF0YX0gPSB0aGlzLnByb3BzO1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSBnZXRHZW9qc29uRmVhdHVyZXMoZGF0YSk7XG4gICAgICB0aGlzLnN0YXRlLmZlYXR1cmVzID0gc2VwYXJhdGVHZW9qc29uRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgIH1cbiAgfVxuXG4gIF9vbkhvdmVyU3ViTGF5ZXIoaW5mbykge1xuICAgIGluZm8ub2JqZWN0ID0gKGluZm8ub2JqZWN0ICYmIGluZm8ub2JqZWN0LmZlYXR1cmUpIHx8IGluZm8ub2JqZWN0O1xuICAgIHRoaXMucHJvcHMub25Ib3ZlcihpbmZvKTtcbiAgfVxuXG4gIF9vbkNsaWNrU3ViTGF5ZXIoaW5mbykge1xuICAgIGluZm8ub2JqZWN0ID0gKGluZm8ub2JqZWN0ICYmIGluZm8ub2JqZWN0LmZlYXR1cmUpIHx8IGluZm8ub2JqZWN0O1xuICAgIHRoaXMucHJvcHMub25DbGljayhpbmZvKTtcbiAgfVxuXG4gIHJlbmRlckxheWVycygpIHtcbiAgICBjb25zdCB7ZmVhdHVyZXN9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7cG9pbnRGZWF0dXJlcywgbGluZUZlYXR1cmVzLCBwb2x5Z29uRmVhdHVyZXMsIHBvbHlnb25PdXRsaW5lRmVhdHVyZXN9ID0gZmVhdHVyZXM7XG4gICAgY29uc3Qge2dldENvbG9yLCBnZXRGaWxsQ29sb3IsIGdldFJhZGl1cywgZ2V0V2lkdGgsIGdldEVsZXZhdGlvbiwgdXBkYXRlVHJpZ2dlcnN9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7aWQsIHN0cm9rZWQsIGZpbGxlZCwgZXh0cnVkZWQsIHdpcmVmcmFtZX0gPSB0aGlzLnByb3BzO1xuXG4gICAgbGV0IHt9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBkcmF3UG9pbnRzID0gcG9pbnRGZWF0dXJlcyAmJiBwb2ludEZlYXR1cmVzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgZHJhd0xpbmVzID0gbGluZUZlYXR1cmVzICYmIGxpbmVGZWF0dXJlcy5sZW5ndGggPiAwO1xuICAgIGNvbnN0IGhhc1BvbHlnb25PdXRsaW5lID0gcG9seWdvbk91dGxpbmVGZWF0dXJlcyAmJiBwb2x5Z29uT3V0bGluZUZlYXR1cmVzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgaGFzUG9seWdvbiA9IHBvbHlnb25GZWF0dXJlcyAmJiBwb2x5Z29uRmVhdHVyZXMubGVuZ3RoID4gMDtcblxuICAgIGNvbnN0IG9uSG92ZXIgPSB0aGlzLl9vbkhvdmVyU3ViTGF5ZXIuYmluZCh0aGlzKTtcbiAgICBjb25zdCBvbkNsaWNrID0gdGhpcy5fb25DbGlja1N1YkxheWVyLmJpbmQodGhpcyk7XG5cbiAgICAvLyBGaWxsZWQgUG9seWdvbiBMYXllclxuICAgIGNvbnN0IHBvbHlnb25GaWxsTGF5ZXIgPSBmaWxsZWQgJiZcbiAgICAgIGhhc1BvbHlnb24gJiZcbiAgICAgIG5ldyBTb2xpZFBvbHlnb25MYXllcihPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLCB7XG4gICAgICAgIGlkOiBgJHtpZH0tcG9seWdvbi1maWxsYCxcbiAgICAgICAgZGF0YTogcG9seWdvbkZlYXR1cmVzLFxuICAgICAgICBleHRydWRlZCxcbiAgICAgICAgd2lyZWZyYW1lOiBmYWxzZSxcbiAgICAgICAgZ2V0UG9seWdvbjogZ2V0Q29vcmRpbmF0ZXMsXG4gICAgICAgIGdldEVsZXZhdGlvbixcbiAgICAgICAgZ2V0Q29sb3I6IGdldEZpbGxDb2xvcixcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRFbGV2YXRpb246IHVwZGF0ZVRyaWdnZXJzLmdldEVsZXZhdGlvbixcbiAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0RmlsbENvbG9yXG4gICAgICAgIH0sXG4gICAgICAgIG9uSG92ZXIsXG4gICAgICAgIG9uQ2xpY2tcbiAgICAgIH0pKTtcblxuICAgIGNvbnN0IHBvbHlnb25XaXJlZnJhbWVMYXllciA9IHdpcmVmcmFtZSAmJlxuICAgICAgZXh0cnVkZWQgJiZcbiAgICAgIGhhc1BvbHlnb24gJiZcbiAgICAgIG5ldyBTb2xpZFBvbHlnb25MYXllcihPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLCB7XG4gICAgICAgIGlkOiBgJHtpZH0tcG9seWdvbi13aXJlZnJhbWVgLFxuICAgICAgICBkYXRhOiBwb2x5Z29uRmVhdHVyZXMsXG4gICAgICAgIGV4dHJ1ZGVkLFxuICAgICAgICB3aXJlZnJhbWU6IHRydWUsXG4gICAgICAgIGdldFBvbHlnb246IGdldENvb3JkaW5hdGVzLFxuICAgICAgICBnZXRFbGV2YXRpb24sXG4gICAgICAgIGdldENvbG9yLFxuICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgIGdldEVsZXZhdGlvbjogdXBkYXRlVHJpZ2dlcnMuZ2V0RWxldmF0aW9uLFxuICAgICAgICAgIGdldENvbG9yOiB1cGRhdGVUcmlnZ2Vycy5nZXRDb2xvclxuICAgICAgICB9LFxuICAgICAgICBvbkhvdmVyLFxuICAgICAgICBvbkNsaWNrXG4gICAgICB9KSk7XG5cbiAgICBjb25zdCBwb2x5Z29uT3V0bGluZUxheWVyID0gIWV4dHJ1ZGVkICYmXG4gICAgICBzdHJva2VkICYmXG4gICAgICBoYXNQb2x5Z29uT3V0bGluZSAmJlxuICAgICAgbmV3IFBhdGhMYXllcihPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLCB7XG4gICAgICAgIGlkOiBgJHtpZH0tcG9seWdvbi1vdXRsaW5lYCxcbiAgICAgICAgZGF0YTogcG9seWdvbk91dGxpbmVGZWF0dXJlcyxcbiAgICAgICAgZ2V0UGF0aDogZ2V0Q29vcmRpbmF0ZXMsXG4gICAgICAgIGdldENvbG9yLFxuICAgICAgICBnZXRXaWR0aCxcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0Q29sb3IsXG4gICAgICAgICAgZ2V0V2lkdGg6IHVwZGF0ZVRyaWdnZXJzLmdldFdpZHRoXG4gICAgICAgIH0sXG4gICAgICAgIG9uSG92ZXIsXG4gICAgICAgIG9uQ2xpY2tcbiAgICAgIH0pKTtcblxuICAgIGNvbnN0IGxpbmVMYXllciA9IGRyYXdMaW5lcyAmJiBuZXcgUGF0aExheWVyKE9iamVjdC5hc3NpZ24oe30sIHRoaXMucHJvcHMsIHtcbiAgICAgIGlkOiBgJHtpZH0tbGluZS1wYXRoc2AsXG4gICAgICBkYXRhOiBsaW5lRmVhdHVyZXMsXG4gICAgICBnZXRQYXRoOiBnZXRDb29yZGluYXRlcyxcbiAgICAgIGdldENvbG9yLFxuICAgICAgZ2V0V2lkdGgsXG4gICAgICBvbkhvdmVyLFxuICAgICAgb25DbGljayxcbiAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgIGdldENvbG9yOiB1cGRhdGVUcmlnZ2Vycy5nZXRDb2xvcixcbiAgICAgICAgZ2V0V2lkdGg6IHVwZGF0ZVRyaWdnZXJzLmdldFdpZHRoXG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgY29uc3QgcG9pbnRMYXllciA9IGRyYXdQb2ludHMgJiYgbmV3IFNjYXR0ZXJwbG90TGF5ZXIoT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5wcm9wcywge1xuICAgICAgaWQ6IGAke2lkfS1wb2ludHNgLFxuICAgICAgZGF0YTogcG9pbnRGZWF0dXJlcyxcbiAgICAgIGdldFBvc2l0aW9uOiBnZXRDb29yZGluYXRlcyxcbiAgICAgIGdldENvbG9yOiBnZXRGaWxsQ29sb3IsXG4gICAgICBnZXRSYWRpdXMsXG4gICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0RmlsbENvbG9yLFxuICAgICAgICBnZXRSYWRpdXM6IHVwZGF0ZVRyaWdnZXJzLmdldFJhZGl1c1xuICAgICAgfSxcbiAgICAgIG9uSG92ZXIsXG4gICAgICBvbkNsaWNrXG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIHBvbHlnb25GaWxsTGF5ZXIsXG4gICAgICBwb2x5Z29uV2lyZWZyYW1lTGF5ZXIsXG4gICAgICBwb2x5Z29uT3V0bGluZUxheWVyLFxuICAgICAgbGluZUxheWVyLFxuICAgICAgcG9pbnRMYXllclxuICAgIF0uZmlsdGVyKEJvb2xlYW4pO1xuICB9XG59XG5cbkdlb0pzb25MYXllci5sYXllck5hbWUgPSAnR2VvSnNvbkxheWVyJztcbkdlb0pzb25MYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
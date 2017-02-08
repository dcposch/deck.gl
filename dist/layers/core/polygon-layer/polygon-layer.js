'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _solidPolygonLayer = require('../solid-polygon-layer/solid-polygon-layer');

var _solidPolygonLayer2 = _interopRequireDefault(_solidPolygonLayer);

var _pathLayer = require('../path-layer/path-layer');

var _pathLayer2 = _interopRequireDefault(_pathLayer);

var _polygon = require('../solid-polygon-layer/polygon');

var Polygon = _interopRequireWildcard(_polygon);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

var defaultColor = [0xBD, 0xE2, 0x7A, 0xFF];
var defaultFillColor = [0xBD, 0xE2, 0x7A, 0xFF];

var defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,
  fp64: false,

  // TODO: Missing props: radiusMinPixels, strokeWidthMinPixels, ...

  // Polygon fill color
  getFillColor: function getFillColor(f) {
    return (0, _lib.get)(f, 'fillColor') || defaultFillColor;
  },
  // Point, line and polygon outline color
  getColor: function getColor(f) {
    return (0, _lib.get)(f, 'color') || (0, _lib.get)(f, 'strokeColor') || defaultColor;
  },
  // Line and polygon outline accessors
  getWidth: function getWidth(f) {
    return (0, _lib.get)(f, 'strokeWidth') || 1;
  },
  // Polygon extrusion accessor
  getElevation: function getElevation(f) {
    return 1000;
  }
};

var PolygonLayer = function (_CompositeLayer) {
  _inherits(PolygonLayer, _CompositeLayer);

  function PolygonLayer() {
    _classCallCheck(this, PolygonLayer);

    return _possibleConstructorReturn(this, (PolygonLayer.__proto__ || Object.getPrototypeOf(PolygonLayer)).apply(this, arguments));
  }

  _createClass(PolygonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        paths: [],
        onHover: this._onHoverSubLayer.bind(this),
        onClick: this._onClickSubLayer.bind(this)
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var _this2 = this;

      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged) {
        var _props = this.props,
            data = _props.data,
            getPolygon = _props.getPolygon;

        this.state.paths = [];
        data.forEach(function (object) {
          var complexPolygon = Polygon.normalize(getPolygon(object));
          complexPolygon.forEach(function (polygon) {
            return _this2.state.paths.push({
              path: polygon,
              object: object
            });
          });
        });
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
      var _props2 = this.props,
          getFillColor = _props2.getFillColor,
          getColor = _props2.getColor,
          getWidth = _props2.getWidth,
          getElevation = _props2.getElevation,
          updateTriggers = _props2.updateTriggers;
      var _props3 = this.props,
          data = _props3.data,
          id = _props3.id,
          stroked = _props3.stroked,
          filled = _props3.filled,
          extruded = _props3.extruded,
          wireframe = _props3.wireframe;
      var _state = this.state,
          paths = _state.paths,
          onHover = _state.onHover,
          onClick = _state.onClick;


      var hasData = data && data.length > 0;

      // Filled Polygon Layer
      var polygonLayer = filled && hasData && new _solidPolygonLayer2.default(Object.assign({}, this.props, {
        id: id + '-fill',
        data: data,
        getElevation: getElevation,
        getColor: getFillColor,
        extruded: extruded,
        wireframe: false,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getFillColor
        }
      }));

      var polygonWireframeLayer = extruded && wireframe && hasData && new _solidPolygonLayer2.default(Object.assign({}, this.props, {
        id: id + '-wireframe',
        data: data,
        getElevation: getElevation,
        getColor: getColor,
        extruded: true,
        wireframe: true,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getColor
        }
      }));

      // Polygon outline layer
      var polygonOutlineLayer = !extruded && stroked && hasData && new _pathLayer2.default(Object.assign({}, this.props, {
        id: id + '-stroke',
        data: paths,
        getPath: function getPath(x) {
          return x.path;
        },
        getColor: getColor,
        getWidth: getWidth,
        onHover: onHover,
        onClick: onClick,
        updateTriggers: {
          getWidth: updateTriggers.getWidth,
          getColor: updateTriggers.getColor
        }
      }));

      return [polygonLayer, polygonWireframeLayer, polygonOutlineLayer].filter(Boolean);
    }
  }]);

  return PolygonLayer;
}(_lib.CompositeLayer);

exports.default = PolygonLayer;


PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wb2x5Z29uLWxheWVyL3BvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiUG9seWdvbiIsImRlZmF1bHRDb2xvciIsImRlZmF1bHRGaWxsQ29sb3IiLCJkZWZhdWx0UHJvcHMiLCJzdHJva2VkIiwiZmlsbGVkIiwiZXh0cnVkZWQiLCJ3aXJlZnJhbWUiLCJmcDY0IiwiZ2V0RmlsbENvbG9yIiwiZiIsImdldENvbG9yIiwiZ2V0V2lkdGgiLCJnZXRFbGV2YXRpb24iLCJQb2x5Z29uTGF5ZXIiLCJzdGF0ZSIsInBhdGhzIiwib25Ib3ZlciIsIl9vbkhvdmVyU3ViTGF5ZXIiLCJiaW5kIiwib25DbGljayIsIl9vbkNsaWNrU3ViTGF5ZXIiLCJvbGRQcm9wcyIsInByb3BzIiwiY2hhbmdlRmxhZ3MiLCJkYXRhQ2hhbmdlZCIsImRhdGEiLCJnZXRQb2x5Z29uIiwiZm9yRWFjaCIsImNvbXBsZXhQb2x5Z29uIiwibm9ybWFsaXplIiwib2JqZWN0IiwicHVzaCIsInBhdGgiLCJwb2x5Z29uIiwiaW5mbyIsImZlYXR1cmUiLCJ1cGRhdGVUcmlnZ2VycyIsImlkIiwiaGFzRGF0YSIsImxlbmd0aCIsInBvbHlnb25MYXllciIsIk9iamVjdCIsImFzc2lnbiIsInBvbHlnb25XaXJlZnJhbWVMYXllciIsInBvbHlnb25PdXRsaW5lTGF5ZXIiLCJnZXRQYXRoIiwieCIsImZpbHRlciIsIkJvb2xlYW4iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBb0JBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7SUFBWUEsTzs7Ozs7Ozs7OzsrZUF2Qlo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBT0EsSUFBTUMsZUFBZSxDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsSUFBYixFQUFtQixJQUFuQixD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Y0FBTVYsS0FGb0M7QUFHMUM4QixpQkFBUztBQUFBLGlCQUFLQyxFQUFFZCxJQUFQO0FBQUEsU0FIaUM7QUFJMUN0QiwwQkFKMEM7QUFLMUNDLDBCQUwwQztBQU0xQ0ssd0JBTjBDO0FBTzFDRyx3QkFQMEM7QUFRMUNpQix3QkFBZ0I7QUFDZHpCLG9CQUFVeUIsZUFBZXpCLFFBRFg7QUFFZEQsb0JBQVUwQixlQUFlMUI7QUFGWDtBQVIwQixPQUE5QixDQUFkLENBSEY7O0FBaUJBLGFBQU8sQ0FDTDhCLFlBREssRUFFTEcscUJBRkssRUFHTEMsbUJBSEssRUFJTEcsTUFKSyxDQUlFQyxPQUpGLENBQVA7QUFLRDs7Ozs7O2tCQS9Ga0JuQyxZOzs7QUFrR3JCQSxhQUFhb0MsU0FBYixHQUF5QixjQUF6QjtBQUNBcEMsYUFBYVgsWUFBYixHQUE0QkEsWUFBNUIiLCJmaWxlIjoicG9seWdvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNiBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7Q29tcG9zaXRlTGF5ZXIsIGdldH0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCBTb2xpZFBvbHlnb25MYXllciBmcm9tICcuLi9zb2xpZC1wb2x5Z29uLWxheWVyL3NvbGlkLXBvbHlnb24tbGF5ZXInO1xuaW1wb3J0IFBhdGhMYXllciBmcm9tICcuLi9wYXRoLWxheWVyL3BhdGgtbGF5ZXInO1xuaW1wb3J0ICogYXMgUG9seWdvbiBmcm9tICcuLi9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24nO1xuXG5jb25zdCBkZWZhdWx0Q29sb3IgPSBbMHhCRCwgMHhFMiwgMHg3QSwgMHhGRl07XG5jb25zdCBkZWZhdWx0RmlsbENvbG9yID0gWzB4QkQsIDB4RTIsIDB4N0EsIDB4RkZdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIHN0cm9rZWQ6IHRydWUsXG4gIGZpbGxlZDogdHJ1ZSxcbiAgZXh0cnVkZWQ6IGZhbHNlLFxuICB3aXJlZnJhbWU6IGZhbHNlLFxuICBmcDY0OiBmYWxzZSxcblxuICAvLyBUT0RPOiBNaXNzaW5nIHByb3BzOiByYWRpdXNNaW5QaXhlbHMsIHN0cm9rZVdpZHRoTWluUGl4ZWxzLCAuLi5cblxuICAvLyBQb2x5Z29uIGZpbGwgY29sb3JcbiAgZ2V0RmlsbENvbG9yOiBmID0+IGdldChmLCAnZmlsbENvbG9yJykgfHwgZGVmYXVsdEZpbGxDb2xvcixcbiAgLy8gUG9pbnQsIGxpbmUgYW5kIHBvbHlnb24gb3V0bGluZSBjb2xvclxuICBnZXRDb2xvcjogZiA9PiBnZXQoZiwgJ2NvbG9yJykgfHwgZ2V0KGYsICdzdHJva2VDb2xvcicpIHx8IGRlZmF1bHRDb2xvcixcbiAgLy8gTGluZSBhbmQgcG9seWdvbiBvdXRsaW5lIGFjY2Vzc29yc1xuICBnZXRXaWR0aDogZiA9PiBnZXQoZiwgJ3N0cm9rZVdpZHRoJykgfHwgMSxcbiAgLy8gUG9seWdvbiBleHRydXNpb24gYWNjZXNzb3JcbiAgZ2V0RWxldmF0aW9uOiBmID0+IDEwMDBcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvbHlnb25MYXllciBleHRlbmRzIENvbXBvc2l0ZUxheWVyIHtcbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBwYXRoczogW10sXG4gICAgICBvbkhvdmVyOiB0aGlzLl9vbkhvdmVyU3ViTGF5ZXIuYmluZCh0aGlzKSxcbiAgICAgIG9uQ2xpY2s6IHRoaXMuX29uQ2xpY2tTdWJMYXllci5iaW5kKHRoaXMpXG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCkge1xuICAgICAgY29uc3Qge2RhdGEsIGdldFBvbHlnb259ID0gdGhpcy5wcm9wcztcbiAgICAgIHRoaXMuc3RhdGUucGF0aHMgPSBbXTtcbiAgICAgIGRhdGEuZm9yRWFjaChvYmplY3QgPT4ge1xuICAgICAgICBjb25zdCBjb21wbGV4UG9seWdvbiA9IFBvbHlnb24ubm9ybWFsaXplKGdldFBvbHlnb24ob2JqZWN0KSk7XG4gICAgICAgIGNvbXBsZXhQb2x5Z29uLmZvckVhY2gocG9seWdvbiA9PiB0aGlzLnN0YXRlLnBhdGhzLnB1c2goe1xuICAgICAgICAgIHBhdGg6IHBvbHlnb24sXG4gICAgICAgICAgb2JqZWN0XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIF9vbkhvdmVyU3ViTGF5ZXIoaW5mbykge1xuICAgIGluZm8ub2JqZWN0ID0gKGluZm8ub2JqZWN0ICYmIGluZm8ub2JqZWN0LmZlYXR1cmUpIHx8IGluZm8ub2JqZWN0O1xuICAgIHRoaXMucHJvcHMub25Ib3ZlcihpbmZvKTtcbiAgfVxuXG4gIF9vbkNsaWNrU3ViTGF5ZXIoaW5mbykge1xuICAgIGluZm8ub2JqZWN0ID0gKGluZm8ub2JqZWN0ICYmIGluZm8ub2JqZWN0LmZlYXR1cmUpIHx8IGluZm8ub2JqZWN0O1xuICAgIHRoaXMucHJvcHMub25DbGljayhpbmZvKTtcbiAgfVxuXG4gIHJlbmRlckxheWVycygpIHtcbiAgICBjb25zdCB7Z2V0RmlsbENvbG9yLCBnZXRDb2xvciwgZ2V0V2lkdGgsIGdldEVsZXZhdGlvbiwgdXBkYXRlVHJpZ2dlcnN9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7ZGF0YSwgaWQsIHN0cm9rZWQsIGZpbGxlZCwgZXh0cnVkZWQsIHdpcmVmcmFtZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtwYXRocywgb25Ib3Zlciwgb25DbGlja30gPSB0aGlzLnN0YXRlO1xuXG4gICAgY29uc3QgaGFzRGF0YSA9IGRhdGEgJiYgZGF0YS5sZW5ndGggPiAwO1xuXG4gICAgLy8gRmlsbGVkIFBvbHlnb24gTGF5ZXJcbiAgICBjb25zdCBwb2x5Z29uTGF5ZXIgPSBmaWxsZWQgJiYgaGFzRGF0YSAmJiBuZXcgU29saWRQb2x5Z29uTGF5ZXIoT2JqZWN0LmFzc2lnbih7fSxcbiAgICAgIHRoaXMucHJvcHMsIHtcbiAgICAgICAgaWQ6IGAke2lkfS1maWxsYCxcbiAgICAgICAgZGF0YSxcbiAgICAgICAgZ2V0RWxldmF0aW9uLFxuICAgICAgICBnZXRDb2xvcjogZ2V0RmlsbENvbG9yLFxuICAgICAgICBleHRydWRlZCxcbiAgICAgICAgd2lyZWZyYW1lOiBmYWxzZSxcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRFbGV2YXRpb246IHVwZGF0ZVRyaWdnZXJzLmdldEVsZXZhdGlvbixcbiAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0RmlsbENvbG9yXG4gICAgICAgIH1cbiAgICAgIH0pKTtcblxuICAgIGNvbnN0IHBvbHlnb25XaXJlZnJhbWVMYXllciA9IGV4dHJ1ZGVkICYmXG4gICAgICB3aXJlZnJhbWUgJiZcbiAgICAgIGhhc0RhdGEgJiZcbiAgICAgIG5ldyBTb2xpZFBvbHlnb25MYXllcihPYmplY3QuYXNzaWduKHt9LFxuICAgICAgdGhpcy5wcm9wcywge1xuICAgICAgICBpZDogYCR7aWR9LXdpcmVmcmFtZWAsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGdldEVsZXZhdGlvbixcbiAgICAgICAgZ2V0Q29sb3IsXG4gICAgICAgIGV4dHJ1ZGVkOiB0cnVlLFxuICAgICAgICB3aXJlZnJhbWU6IHRydWUsXG4gICAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgICAgZ2V0RWxldmF0aW9uOiB1cGRhdGVUcmlnZ2Vycy5nZXRFbGV2YXRpb24sXG4gICAgICAgICAgZ2V0Q29sb3I6IHVwZGF0ZVRyaWdnZXJzLmdldENvbG9yXG4gICAgICAgIH1cbiAgICAgIH0pKTtcblxuICAgIC8vIFBvbHlnb24gb3V0bGluZSBsYXllclxuICAgIGNvbnN0IHBvbHlnb25PdXRsaW5lTGF5ZXIgPSAhZXh0cnVkZWQgJiZcbiAgICAgIHN0cm9rZWQgJiZcbiAgICAgIGhhc0RhdGEgJiZcbiAgICAgIG5ldyBQYXRoTGF5ZXIoT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5wcm9wcywge1xuICAgICAgICBpZDogYCR7aWR9LXN0cm9rZWAsXG4gICAgICAgIGRhdGE6IHBhdGhzLFxuICAgICAgICBnZXRQYXRoOiB4ID0+IHgucGF0aCxcbiAgICAgICAgZ2V0Q29sb3IsXG4gICAgICAgIGdldFdpZHRoLFxuICAgICAgICBvbkhvdmVyLFxuICAgICAgICBvbkNsaWNrLFxuICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgIGdldFdpZHRoOiB1cGRhdGVUcmlnZ2Vycy5nZXRXaWR0aCxcbiAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0Q29sb3JcbiAgICAgICAgfVxuICAgICAgfSkpO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIHBvbHlnb25MYXllcixcbiAgICAgIHBvbHlnb25XaXJlZnJhbWVMYXllcixcbiAgICAgIHBvbHlnb25PdXRsaW5lTGF5ZXJcbiAgICBdLmZpbHRlcihCb29sZWFuKTtcbiAgfVxufVxuXG5Qb2x5Z29uTGF5ZXIubGF5ZXJOYW1lID0gJ1BvbHlnb25MYXllcic7XG5Qb2x5Z29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _hexagonCellLayer = require('../hexagon-cell-layer/hexagon-cell-layer');

var _hexagonCellLayer2 = _interopRequireDefault(_hexagonCellLayer);

var _utils = require('../../../lib/utils');

var _scaleUtils = require('../../../utils/scale-utils');

var _colorUtils = require('../../../utils/color-utils');

var _hexagonAggregator = require('./hexagon-aggregator');

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

var defaultProps = {
  colorRange: _colorUtils.defaultColorRange,
  elevationRange: [0, 1000],
  elevationScale: 1,
  radius: 1000,
  coverage: 1,
  hexagonAggregator: _hexagonAggregator.pointToHexbin,
  getPosition: function getPosition(x) {
    return x.position;
  },
  fp64: false
  //
};

function noop() {}

function _needsReProjectPoints(oldProps, props) {
  return oldProps.radius !== props.radius;
}

function _getCountRange(hexagons) {
  return [Math.min.apply(null, hexagons.map(function (bin) {
    return bin.points.length;
  })), Math.max.apply(null, hexagons.map(function (bin) {
    return bin.points.length;
  }))];
}

var HexagonLayer = function (_Layer) {
  _inherits(HexagonLayer, _Layer);

  function HexagonLayer(props) {
    _classCallCheck(this, HexagonLayer);

    if (!props.radius) {
      _utils.log.once(0, 'PointDensityHexagonLayer: radius in meter is needed to aggregate points into ' + 'hexagonal bins, Now using 1000 meter as default');

      props.radius = defaultProps.radius;
    }

    return _possibleConstructorReturn(this, (HexagonLayer.__proto__ || Object.getPrototypeOf(HexagonLayer)).call(this, props));
  }

  _createClass(HexagonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        hexagons: [],
        countRange: null,
        pickedCell: null
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged || _needsReProjectPoints(oldProps, props)) {
        var hexagonAggregator = this.props.hexagonAggregator;
        var viewport = this.context.viewport;


        var hexagons = hexagonAggregator(this.props, viewport);
        var countRange = _getCountRange(hexagons);

        Object.assign(this.state, { hexagons: hexagons, countRange: countRange });
      }
    }
  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(opts) {
      var info = _get(HexagonLayer.prototype.__proto__ || Object.getPrototypeOf(HexagonLayer.prototype), 'getPickingInfo', this).call(this, opts);
      var pickedCell = this.state.pickedCell;

      return Object.assign(info, {
        layer: this,
        // override index with cell index
        index: pickedCell ? pickedCell.index : -1,
        picked: Boolean(pickedCell),
        // override object with picked cell
        object: pickedCell
      });
    }
  }, {
    key: '_onHoverSublayer',
    value: function _onHoverSublayer(info) {

      this.state.pickedCell = info.picked && info.index > -1 ? this.state.hexagons[info.index] : null;
    }
  }, {
    key: '_onGetSublayerColor',
    value: function _onGetSublayerColor(cell) {
      var colorRange = this.props.colorRange;

      var colorDomain = this.props.colorDomain || this.state.countRange;

      return (0, _scaleUtils.quantizeScale)(colorDomain, colorRange, cell.points.length);
    }
  }, {
    key: '_onGetSublayerElevation',
    value: function _onGetSublayerElevation(cell) {
      var elevationRange = this.props.elevationRange;

      var elevationDomain = this.props.elevationDomain || [0, this.state.countRange[1]];
      return (0, _scaleUtils.linearScale)(elevationDomain, elevationRange, cell.points.length);
    }
  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      var _props = this.props,
          id = _props.id,
          radius = _props.radius;


      return new _hexagonCellLayer2.default(Object.assign({}, this.props, {
        id: id + '-density-hexagon',
        data: this.state.hexagons,
        radius: radius,
        angle: Math.PI,
        getColor: this._onGetSublayerColor.bind(this),
        getElevation: this._onGetSublayerElevation.bind(this),
        // Override user's onHover and onClick props
        onHover: this._onHoverSublayer.bind(this),
        onClick: noop,
        updateTriggers: {
          getColor: { colorRange: this.props.colorRange },
          getElevation: { elevationRange: this.props.elevationRange }
        }
      }));
    }
  }]);

  return HexagonLayer;
}(_lib.Layer);

exports.default = HexagonLayer;


HexagonLayer.layerName = 'HexagonLayer';
HexagonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9oZXhhZ29uLWxheWVyL2hleGFnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdFByb3BzIiwiY29sb3JSYW5nZSIsImVsZXZhdGlvblJhbmdlIiwiZWxldmF0aW9uU2NhbGUiLCJyYWRpdXMiLCJjb3ZlcmFnZSIsImhleGFnb25BZ2dyZWdhdG9yIiwiZ2V0UG9zaXRpb24iLCJ4IiwicG9zaXRpb24iLCJmcDY0Iiwibm9vcCIsIl9uZWVkc1JlUHJvamVjdFBvaW50cyIsIm9sZFByb3BzIiwicHJvcHMiLCJfZ2V0Q291bnRSYW5nZSIsImhleGFnb25zIiwiTWF0aCIsIm1pbiIsImFwcGx5IiwibWFwIiwiYmluIiwicG9pbnRzIiwibGVuZ3RoIiwibWF4IiwiSGV4YWdvbkxheWVyIiwib25jZSIsInN0YXRlIiwiY291bnRSYW5nZSIsInBpY2tlZENlbGwiLCJjaGFuZ2VGbGFncyIsImRhdGFDaGFuZ2VkIiwidmlld3BvcnQiLCJjb250ZXh0IiwiT2JqZWN0IiwiYXNzaWduIiwib3B0cyIsImluZm8iLCJsYXllciIsImluZGV4IiwicGlja2VkIiwiQm9vbGVhbiIsIm9iamVjdCIsImNlbGwiLCJjb2xvckRvbWFpbiIsImVsZXZhdGlvbkRvbWFpbiIsImlkIiwiZGF0YSIsImFuZ2xlIiwiUEkiLCJnZXRDb2xvciIsIl9vbkdldFN1YmxheWVyQ29sb3IiLCJiaW5kIiwiZ2V0RWxldmF0aW9uIiwiX29uR2V0U3VibGF5ZXJFbGV2YXRpb24iLCJvbkhvdmVyIiwiX29uSG92ZXJTdWJsYXllciIsIm9uQ2xpY2siLCJ1cGRhdGVUcmlnZ2VycyIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7OztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7Ozs7OzsrZUExQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LENBUkM7QUFTVkssaUJBQVM5QyxJQVRDO0FBVVYrQyx3QkFBZ0I7QUFDZFIsb0JBQVUsRUFBQ2pELFlBQVksS0FBS2EsS0FBTCxDQUFXYixVQUF4QixFQURJO0FBRWRvRCx3QkFBYyxFQUFDbkQsZ0JBQWdCLEtBQUtZLEtBQUwsQ0FBV1osY0FBNUI7QUFGQTtBQVZOLE9BRGMsQ0FBckIsQ0FBUDtBQWdCRDs7Ozs7O2tCQXBGa0J1QixZOzs7QUF1RnJCQSxhQUFha0MsU0FBYixHQUF5QixjQUF6QjtBQUNBbEMsYUFBYXpCLFlBQWIsR0FBNEJBLFlBQTVCIiwiZmlsZSI6ImhleGFnb24tbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTYgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IEhleGFnb25DZWxsTGF5ZXIgZnJvbSAnLi4vaGV4YWdvbi1jZWxsLWxheWVyL2hleGFnb24tY2VsbC1sYXllcic7XG5pbXBvcnQge2xvZ30gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzJztcblxuaW1wb3J0IHtxdWFudGl6ZVNjYWxlLCBsaW5lYXJTY2FsZX0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvc2NhbGUtdXRpbHMnO1xuaW1wb3J0IHtkZWZhdWx0Q29sb3JSYW5nZX0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvY29sb3ItdXRpbHMnO1xuaW1wb3J0IHtwb2ludFRvSGV4YmlufSBmcm9tICcuL2hleGFnb24tYWdncmVnYXRvcic7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgY29sb3JSYW5nZTogZGVmYXVsdENvbG9yUmFuZ2UsXG4gIGVsZXZhdGlvblJhbmdlOiBbMCwgMTAwMF0sXG4gIGVsZXZhdGlvblNjYWxlOiAxLFxuICByYWRpdXM6IDEwMDAsXG4gIGNvdmVyYWdlOiAxLFxuICBoZXhhZ29uQWdncmVnYXRvcjogcG9pbnRUb0hleGJpbixcbiAgZ2V0UG9zaXRpb246IHggPT4geC5wb3NpdGlvbixcbiAgZnA2NDogZmFsc2VcbiAgLy9cbn07XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBfbmVlZHNSZVByb2plY3RQb2ludHMob2xkUHJvcHMsIHByb3BzKSB7XG4gIHJldHVybiBvbGRQcm9wcy5yYWRpdXMgIT09IHByb3BzLnJhZGl1cztcbn1cblxuZnVuY3Rpb24gX2dldENvdW50UmFuZ2UoaGV4YWdvbnMpIHtcbiAgcmV0dXJuIFtcbiAgICBNYXRoLm1pbi5hcHBseShudWxsLCBoZXhhZ29ucy5tYXAoYmluID0+IGJpbi5wb2ludHMubGVuZ3RoKSksXG4gICAgTWF0aC5tYXguYXBwbHkobnVsbCwgaGV4YWdvbnMubWFwKGJpbiA9PiBiaW4ucG9pbnRzLmxlbmd0aCkpXG4gIF07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhleGFnb25MYXllciBleHRlbmRzIExheWVyIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBpZiAoIXByb3BzLnJhZGl1cykge1xuICAgICAgbG9nLm9uY2UoMCwgJ1BvaW50RGVuc2l0eUhleGFnb25MYXllcjogcmFkaXVzIGluIG1ldGVyIGlzIG5lZWRlZCB0byBhZ2dyZWdhdGUgcG9pbnRzIGludG8gJyArXG4gICAgICAgICdoZXhhZ29uYWwgYmlucywgTm93IHVzaW5nIDEwMDAgbWV0ZXIgYXMgZGVmYXVsdCcpO1xuXG4gICAgICBwcm9wcy5yYWRpdXMgPSBkZWZhdWx0UHJvcHMucmFkaXVzO1xuICAgIH1cblxuICAgIHN1cGVyKHByb3BzKTtcbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgaGV4YWdvbnM6IFtdLFxuICAgICAgY291bnRSYW5nZTogbnVsbCxcbiAgICAgIHBpY2tlZENlbGw6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKGNoYW5nZUZsYWdzLmRhdGFDaGFuZ2VkIHx8IF9uZWVkc1JlUHJvamVjdFBvaW50cyhvbGRQcm9wcywgcHJvcHMpKSB7XG4gICAgICBjb25zdCB7aGV4YWdvbkFnZ3JlZ2F0b3J9ID0gdGhpcy5wcm9wcztcbiAgICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG5cbiAgICAgIGNvbnN0IGhleGFnb25zID0gaGV4YWdvbkFnZ3JlZ2F0b3IodGhpcy5wcm9wcywgdmlld3BvcnQpO1xuICAgICAgY29uc3QgY291bnRSYW5nZSA9IF9nZXRDb3VudFJhbmdlKGhleGFnb25zKTtcblxuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLnN0YXRlLCB7aGV4YWdvbnMsIGNvdW50UmFuZ2V9KTtcbiAgICB9XG4gIH1cblxuICBnZXRQaWNraW5nSW5mbyhvcHRzKSB7XG4gICAgY29uc3QgaW5mbyA9IHN1cGVyLmdldFBpY2tpbmdJbmZvKG9wdHMpO1xuICAgIGNvbnN0IHBpY2tlZENlbGwgPSB0aGlzLnN0YXRlLnBpY2tlZENlbGw7XG5cbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihpbmZvLCB7XG4gICAgICBsYXllcjogdGhpcyxcbiAgICAgIC8vIG92ZXJyaWRlIGluZGV4IHdpdGggY2VsbCBpbmRleFxuICAgICAgaW5kZXg6IHBpY2tlZENlbGwgPyBwaWNrZWRDZWxsLmluZGV4IDogLTEsXG4gICAgICBwaWNrZWQ6IEJvb2xlYW4ocGlja2VkQ2VsbCksXG4gICAgICAvLyBvdmVycmlkZSBvYmplY3Qgd2l0aCBwaWNrZWQgY2VsbFxuICAgICAgb2JqZWN0OiBwaWNrZWRDZWxsXG4gICAgfSk7XG4gIH1cblxuICBfb25Ib3ZlclN1YmxheWVyKGluZm8pIHtcblxuICAgIHRoaXMuc3RhdGUucGlja2VkQ2VsbCA9IGluZm8ucGlja2VkICYmIGluZm8uaW5kZXggPiAtMSA/XG4gICAgICB0aGlzLnN0YXRlLmhleGFnb25zW2luZm8uaW5kZXhdIDogbnVsbDtcbiAgfVxuXG4gIF9vbkdldFN1YmxheWVyQ29sb3IoY2VsbCkge1xuICAgIGNvbnN0IHtjb2xvclJhbmdlfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgY29sb3JEb21haW4gPSB0aGlzLnByb3BzLmNvbG9yRG9tYWluIHx8IHRoaXMuc3RhdGUuY291bnRSYW5nZTtcblxuICAgIHJldHVybiBxdWFudGl6ZVNjYWxlKGNvbG9yRG9tYWluLCBjb2xvclJhbmdlLCBjZWxsLnBvaW50cy5sZW5ndGgpO1xuICB9XG5cbiAgX29uR2V0U3VibGF5ZXJFbGV2YXRpb24oY2VsbCkge1xuICAgIGNvbnN0IHtlbGV2YXRpb25SYW5nZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IGVsZXZhdGlvbkRvbWFpbiA9IHRoaXMucHJvcHMuZWxldmF0aW9uRG9tYWluIHx8IFswLCB0aGlzLnN0YXRlLmNvdW50UmFuZ2VbMV1dO1xuICAgIHJldHVybiBsaW5lYXJTY2FsZShlbGV2YXRpb25Eb21haW4sIGVsZXZhdGlvblJhbmdlLCBjZWxsLnBvaW50cy5sZW5ndGgpO1xuICB9XG5cbiAgcmVuZGVyTGF5ZXJzKCkge1xuICAgIGNvbnN0IHtpZCwgcmFkaXVzfSA9IHRoaXMucHJvcHM7XG5cbiAgICByZXR1cm4gbmV3IEhleGFnb25DZWxsTGF5ZXIoT2JqZWN0LmFzc2lnbih7fSxcbiAgICAgIHRoaXMucHJvcHMsIHtcbiAgICAgICAgaWQ6IGAke2lkfS1kZW5zaXR5LWhleGFnb25gLFxuICAgICAgICBkYXRhOiB0aGlzLnN0YXRlLmhleGFnb25zLFxuICAgICAgICByYWRpdXMsXG4gICAgICAgIGFuZ2xlOiBNYXRoLlBJLFxuICAgICAgICBnZXRDb2xvcjogdGhpcy5fb25HZXRTdWJsYXllckNvbG9yLmJpbmQodGhpcyksXG4gICAgICAgIGdldEVsZXZhdGlvbjogdGhpcy5fb25HZXRTdWJsYXllckVsZXZhdGlvbi5iaW5kKHRoaXMpLFxuICAgICAgICAvLyBPdmVycmlkZSB1c2VyJ3Mgb25Ib3ZlciBhbmQgb25DbGljayBwcm9wc1xuICAgICAgICBvbkhvdmVyOiB0aGlzLl9vbkhvdmVyU3VibGF5ZXIuYmluZCh0aGlzKSxcbiAgICAgICAgb25DbGljazogbm9vcCxcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRDb2xvcjoge2NvbG9yUmFuZ2U6IHRoaXMucHJvcHMuY29sb3JSYW5nZX0sXG4gICAgICAgICAgZ2V0RWxldmF0aW9uOiB7ZWxldmF0aW9uUmFuZ2U6IHRoaXMucHJvcHMuZWxldmF0aW9uUmFuZ2V9XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgfVxufVxuXG5IZXhhZ29uTGF5ZXIubGF5ZXJOYW1lID0gJ0hleGFnb25MYXllcic7XG5IZXhhZ29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
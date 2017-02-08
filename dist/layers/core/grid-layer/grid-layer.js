'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _gridCellLayer = require('../grid-cell-layer/grid-cell-layer');

var _gridCellLayer2 = _interopRequireDefault(_gridCellLayer);

var _gridAggregator = require('./grid-aggregator');

var _scaleUtils = require('../../../utils/scale-utils');

var _colorUtils = require('../../../utils/color-utils');

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

var defaultCellSize = 1000;
var defaultElevationRange = [0, 1000];
var defaultElevationScale = 1;

var defaultProps = {
  cellSize: defaultCellSize,
  colorRange: _colorUtils.defaultColorRange,
  elevationRange: defaultElevationRange,
  elevationScale: defaultElevationScale,
  getPosition: function getPosition(x) {
    return x.position;
  },
  fp64: false
  // AUDIT - getWeight ?
};

function noop() {}

function _needsReProjectPoints(oldProps, props) {
  return oldProps.cellSize !== props.cellSize;
}

var GridLayer = function (_Layer) {
  _inherits(GridLayer, _Layer);

  function GridLayer() {
    _classCallCheck(this, GridLayer);

    return _possibleConstructorReturn(this, (GridLayer.__proto__ || Object.getPrototypeOf(GridLayer)).apply(this, arguments));
  }

  _createClass(GridLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        gridOffset: { yOffset: 0.0089, xOffset: 0.0113 },
        layerData: [],
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
        var _props = this.props,
            data = _props.data,
            cellSize = _props.cellSize,
            getPosition = _props.getPosition;

        var _pointToDensityGridDa = (0, _gridAggregator.pointToDensityGridData)(data, cellSize, getPosition),
            gridOffset = _pointToDensityGridDa.gridOffset,
            layerData = _pointToDensityGridDa.layerData,
            countRange = _pointToDensityGridDa.countRange;

        Object.assign(this.state, { gridOffset: gridOffset, layerData: layerData, countRange: countRange });
      }
    }
  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(opts) {
      var info = _get(GridLayer.prototype.__proto__ || Object.getPrototypeOf(GridLayer.prototype), 'getPickingInfo', this).call(this, opts);
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

      this.state.pickedCell = info.picked && info.index > -1 ? this.state.layerData[info.index] : null;
    }
  }, {
    key: '_onGetSublayerColor',
    value: function _onGetSublayerColor(cell) {
      var colorRange = this.props.colorRange;

      var colorDomain = this.props.colorDomain || this.state.countRange;

      return (0, _scaleUtils.quantizeScale)(colorDomain, colorRange, cell.count);
    }
  }, {
    key: '_onGetSublayerElevation',
    value: function _onGetSublayerElevation(cell) {
      var elevationRange = this.props.elevationRange;

      var elevationDomain = this.props.elevationDomain || [0, this.state.countRange[1]];
      return (0, _scaleUtils.linearScale)(elevationDomain, elevationRange, cell.count);
    }
  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      var id = this.props.id;


      return new _gridCellLayer2.default(Object.assign({}, this.props, {
        id: id + '-density-grid',
        data: this.state.layerData,
        latOffset: this.state.gridOffset.yOffset,
        lonOffset: this.state.gridOffset.xOffset,
        getColor: this._onGetSublayerColor.bind(this),
        getElevation: this._onGetSublayerElevation.bind(this),
        getPosition: function getPosition(d) {
          return d.position;
        },
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

  return GridLayer;
}(_lib.Layer);

exports.default = GridLayer;


GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9ncmlkLWxheWVyL2dyaWQtbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdENlbGxTaXplIiwiZGVmYXVsdEVsZXZhdGlvblJhbmdlIiwiZGVmYXVsdEVsZXZhdGlvblNjYWxlIiwiZGVmYXVsdFByb3BzIiwiY2VsbFNpemUiLCJjb2xvclJhbmdlIiwiZWxldmF0aW9uUmFuZ2UiLCJlbGV2YXRpb25TY2FsZSIsImdldFBvc2l0aW9uIiwieCIsInBvc2l0aW9uIiwiZnA2NCIsIm5vb3AiLCJfbmVlZHNSZVByb2plY3RQb2ludHMiLCJvbGRQcm9wcyIsInByb3BzIiwiR3JpZExheWVyIiwic3RhdGUiLCJncmlkT2Zmc2V0IiwieU9mZnNldCIsInhPZmZzZXQiLCJsYXllckRhdGEiLCJjb3VudFJhbmdlIiwicGlja2VkQ2VsbCIsImNoYW5nZUZsYWdzIiwiZGF0YUNoYW5nZWQiLCJkYXRhIiwiT2JqZWN0IiwiYXNzaWduIiwib3B0cyIsImluZm8iLCJsYXllciIsImluZGV4IiwicGlja2VkIiwiQm9vbGVhbiIsIm9iamVjdCIsImNlbGwiLCJjb2xvckRvbWFpbiIsImNvdW50IiwiZWxldmF0aW9uRG9tYWluIiwiaWQiLCJsYXRPZmZzZXQiLCJsb25PZmZzZXQiLCJnZXRDb2xvciIsIl9vbkdldFN1YmxheWVyQ29sb3IiLCJiaW5kIiwiZ2V0RWxldmF0aW9uIiwiX29uR2V0U3VibGF5ZXJFbGV2YXRpb24iLCJkIiwib25Ib3ZlciIsIl9vbkhvdmVyU3VibGF5ZXIiLCJvbkNsaWNrIiwidXBkYXRlVHJpZ2dlcnMiLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFvQkE7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7K2VBekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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WUFBekIiLCJmaWxlIjoiZ3JpZC1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNiBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQgR3JpZENlbGxMYXllciBmcm9tICcuLi9ncmlkLWNlbGwtbGF5ZXIvZ3JpZC1jZWxsLWxheWVyJztcblxuaW1wb3J0IHtwb2ludFRvRGVuc2l0eUdyaWREYXRhfSBmcm9tICcuL2dyaWQtYWdncmVnYXRvcic7XG5pbXBvcnQge2xpbmVhclNjYWxlLCBxdWFudGl6ZVNjYWxlfSBmcm9tICcuLi8uLi8uLi91dGlscy9zY2FsZS11dGlscyc7XG5pbXBvcnQge2RlZmF1bHRDb2xvclJhbmdlfSBmcm9tICcuLi8uLi8uLi91dGlscy9jb2xvci11dGlscyc7XG5cbmNvbnN0IGRlZmF1bHRDZWxsU2l6ZSA9IDEwMDA7XG5jb25zdCBkZWZhdWx0RWxldmF0aW9uUmFuZ2UgPSBbMCwgMTAwMF07XG5jb25zdCBkZWZhdWx0RWxldmF0aW9uU2NhbGUgPSAxO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIGNlbGxTaXplOiBkZWZhdWx0Q2VsbFNpemUsXG4gIGNvbG9yUmFuZ2U6IGRlZmF1bHRDb2xvclJhbmdlLFxuICBlbGV2YXRpb25SYW5nZTogZGVmYXVsdEVsZXZhdGlvblJhbmdlLFxuICBlbGV2YXRpb25TY2FsZTogZGVmYXVsdEVsZXZhdGlvblNjYWxlLFxuICBnZXRQb3NpdGlvbjogeCA9PiB4LnBvc2l0aW9uLFxuICBmcDY0OiBmYWxzZVxuICAvLyBBVURJVCAtIGdldFdlaWdodCA/XG59O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gX25lZWRzUmVQcm9qZWN0UG9pbnRzKG9sZFByb3BzLCBwcm9wcykge1xuICByZXR1cm4gb2xkUHJvcHMuY2VsbFNpemUgIT09IHByb3BzLmNlbGxTaXplO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcmlkTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgZ3JpZE9mZnNldDoge3lPZmZzZXQ6IDAuMDA4OSwgeE9mZnNldDogMC4wMTEzfSxcbiAgICAgIGxheWVyRGF0YTogW10sXG4gICAgICBjb3VudFJhbmdlOiBudWxsLFxuICAgICAgcGlja2VkQ2VsbDogbnVsbFxuICAgIH07XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgfHwgX25lZWRzUmVQcm9qZWN0UG9pbnRzKG9sZFByb3BzLCBwcm9wcykpIHtcbiAgICAgIGNvbnN0IHtkYXRhLCBjZWxsU2l6ZSwgZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcblxuICAgICAgY29uc3Qge2dyaWRPZmZzZXQsIGxheWVyRGF0YSwgY291bnRSYW5nZX0gPVxuICAgICAgICBwb2ludFRvRGVuc2l0eUdyaWREYXRhKGRhdGEsIGNlbGxTaXplLCBnZXRQb3NpdGlvbik7XG5cbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwge2dyaWRPZmZzZXQsIGxheWVyRGF0YSwgY291bnRSYW5nZX0pO1xuICAgIH1cbiAgfVxuXG4gIGdldFBpY2tpbmdJbmZvKG9wdHMpIHtcbiAgICBjb25zdCBpbmZvID0gc3VwZXIuZ2V0UGlja2luZ0luZm8ob3B0cyk7XG4gICAgY29uc3QgcGlja2VkQ2VsbCA9IHRoaXMuc3RhdGUucGlja2VkQ2VsbDtcblxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKGluZm8sIHtcbiAgICAgIGxheWVyOiB0aGlzLFxuICAgICAgLy8gb3ZlcnJpZGUgaW5kZXggd2l0aCBjZWxsIGluZGV4XG4gICAgICBpbmRleDogcGlja2VkQ2VsbCA/IHBpY2tlZENlbGwuaW5kZXggOiAtMSxcbiAgICAgIHBpY2tlZDogQm9vbGVhbihwaWNrZWRDZWxsKSxcbiAgICAgIC8vIG92ZXJyaWRlIG9iamVjdCB3aXRoIHBpY2tlZCBjZWxsXG4gICAgICBvYmplY3Q6IHBpY2tlZENlbGxcbiAgICB9KTtcbiAgfVxuXG4gIF9vbkhvdmVyU3VibGF5ZXIoaW5mbykge1xuXG4gICAgdGhpcy5zdGF0ZS5waWNrZWRDZWxsID0gaW5mby5waWNrZWQgJiYgaW5mby5pbmRleCA+IC0xID9cbiAgICAgIHRoaXMuc3RhdGUubGF5ZXJEYXRhW2luZm8uaW5kZXhdIDogbnVsbDtcbiAgfVxuXG4gIF9vbkdldFN1YmxheWVyQ29sb3IoY2VsbCkge1xuICAgIGNvbnN0IHtjb2xvclJhbmdlfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgY29sb3JEb21haW4gPSB0aGlzLnByb3BzLmNvbG9yRG9tYWluIHx8IHRoaXMuc3RhdGUuY291bnRSYW5nZTtcblxuICAgIHJldHVybiBxdWFudGl6ZVNjYWxlKGNvbG9yRG9tYWluLCBjb2xvclJhbmdlLCBjZWxsLmNvdW50KTtcbiAgfVxuXG4gIF9vbkdldFN1YmxheWVyRWxldmF0aW9uKGNlbGwpIHtcbiAgICBjb25zdCB7ZWxldmF0aW9uUmFuZ2V9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBlbGV2YXRpb25Eb21haW4gPSB0aGlzLnByb3BzLmVsZXZhdGlvbkRvbWFpbiB8fCBbMCwgdGhpcy5zdGF0ZS5jb3VudFJhbmdlWzFdXTtcbiAgICByZXR1cm4gbGluZWFyU2NhbGUoZWxldmF0aW9uRG9tYWluLCBlbGV2YXRpb25SYW5nZSwgY2VsbC5jb3VudCk7XG4gIH1cblxuICByZW5kZXJMYXllcnMoKSB7XG4gICAgY29uc3Qge2lkfSA9IHRoaXMucHJvcHM7XG5cbiAgICByZXR1cm4gbmV3IEdyaWRDZWxsTGF5ZXIoT2JqZWN0LmFzc2lnbih7fSxcbiAgICAgIHRoaXMucHJvcHMsIHtcbiAgICAgICAgaWQ6IGAke2lkfS1kZW5zaXR5LWdyaWRgLFxuICAgICAgICBkYXRhOiB0aGlzLnN0YXRlLmxheWVyRGF0YSxcbiAgICAgICAgbGF0T2Zmc2V0OiB0aGlzLnN0YXRlLmdyaWRPZmZzZXQueU9mZnNldCxcbiAgICAgICAgbG9uT2Zmc2V0OiB0aGlzLnN0YXRlLmdyaWRPZmZzZXQueE9mZnNldCxcbiAgICAgICAgZ2V0Q29sb3I6IHRoaXMuX29uR2V0U3VibGF5ZXJDb2xvci5iaW5kKHRoaXMpLFxuICAgICAgICBnZXRFbGV2YXRpb246IHRoaXMuX29uR2V0U3VibGF5ZXJFbGV2YXRpb24uYmluZCh0aGlzKSxcbiAgICAgICAgZ2V0UG9zaXRpb246IGQgPT4gZC5wb3NpdGlvbixcbiAgICAgICAgLy8gT3ZlcnJpZGUgdXNlcidzIG9uSG92ZXIgYW5kIG9uQ2xpY2sgcHJvcHNcbiAgICAgICAgb25Ib3ZlcjogdGhpcy5fb25Ib3ZlclN1YmxheWVyLmJpbmQodGhpcyksXG4gICAgICAgIG9uQ2xpY2s6IG5vb3AsXG4gICAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgICAgZ2V0Q29sb3I6IHtjb2xvclJhbmdlOiB0aGlzLnByb3BzLmNvbG9yUmFuZ2V9LFxuICAgICAgICAgIGdldEVsZXZhdGlvbjoge2VsZXZhdGlvblJhbmdlOiB0aGlzLnByb3BzLmVsZXZhdGlvblJhbmdlfVxuICAgICAgICB9XG4gICAgICB9KSk7XG4gIH1cbn1cblxuR3JpZExheWVyLmxheWVyTmFtZSA9ICdHcmlkTGF5ZXInO1xuR3JpZExheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==
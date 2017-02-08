'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _fp = require('../../../lib/utils/fp64');

var _pathLayerVertex = require('./path-layer-vertex.glsl');

var _pathLayerVertex2 = _interopRequireDefault(_pathLayerVertex);

var _pathLayerVertex3 = require('./path-layer-vertex-64.glsl');

var _pathLayerVertex4 = _interopRequireDefault(_pathLayerVertex3);

var _pathLayerFragment = require('./path-layer-fragment.glsl');

var _pathLayerFragment2 = _interopRequireDefault(_pathLayerFragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2017 Uber Technologies, Inc.
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

var DEFAULT_COLOR = [0, 0, 0, 255];

var defaultProps = {
  opacity: 1,
  widthScale: 1, // stroke width in meters
  widthMinPixels: 0, //  min stroke width in pixels
  widthMaxPixels: Number.MAX_SAFE_INTEGER, // max stroke width in pixels
  rounded: false,
  miterLimit: 4,
  fp64: false,

  getPath: function getPath(object) {
    return object.path;
  },
  getColor: function getColor(object) {
    return object.color || DEFAULT_COLOR;
  },
  getWidth: function getWidth(object) {
    return object.width || 1;
  }
};

var isClosed = function isClosed(path) {
  var firstPoint = path[0];
  var lastPoint = path[path.length - 1];
  return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1] && firstPoint[2] === lastPoint[2];
};

var PathLayer = function (_Layer) {
  _inherits(PathLayer, _Layer);

  function PathLayer() {
    _classCallCheck(this, PathLayer);

    return _possibleConstructorReturn(this, (PathLayer.__proto__ || Object.getPrototypeOf(PathLayer)).apply(this, arguments));
  }

  _createClass(PathLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _pathLayerVertex4.default, fs: _pathLayerFragment2.default, modules: ['fp64', 'project64']
      } : {
        vs: _pathLayerVertex2.default, fs: _pathLayerFragment2.default, modules: []
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this._getModel(gl) });

      var attributeManager = this.state.attributeManager;
      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instanceStartPositions: { size: 3, update: this.calculateStartPositions },
        instanceEndPositions: { size: 3, update: this.calculateEndPositions },
        instanceLeftDeltas: { size: 3, update: this.calculateLeftDeltas },
        instanceRightDeltas: { size: 3, update: this.calculateRightDeltas },
        instanceStrokeWidths: { size: 1, accessor: 'getWidth', update: this.calculateStrokeWidths },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateColors },
        instancePickingColors: { size: 3, type: _luma.GL.UNSIGNED_BYTE, update: this.calculatePickingColors }
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
          attributeManager.addInstanced({
            instanceStartEndPositions64xyLow: {
              size: 4,
              update: this.calculateInstanceStartEndPositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instanceStartEndPositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;

      _get(PathLayer.prototype.__proto__ || Object.getPrototypeOf(PathLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

      var getPath = this.props.getPath;
      var attributeManager = this.state.attributeManager;

      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      if (changeFlags.dataChanged) {
        // this.state.paths only stores point positions in each path
        var paths = props.data.map(getPath);
        var numInstances = paths.reduce(function (count, path) {
          return count + path.length - 1;
        }, 0);

        this.setState({ paths: paths, numInstances: numInstances });
        attributeManager.invalidateAll();
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var _props = this.props,
          rounded = _props.rounded,
          miterLimit = _props.miterLimit,
          widthScale = _props.widthScale,
          widthMinPixels = _props.widthMinPixels,
          widthMaxPixels = _props.widthMaxPixels;


      this.state.model.render(Object.assign({}, uniforms, {
        jointType: Number(rounded),
        widthScale: widthScale,
        miterLimit: miterLimit,
        widthMinPixels: widthMinPixels,
        widthMaxPixels: widthMaxPixels
      }));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      /*
       *       _
       *        "-_ 1                   3                       5
       *     _     "o---------------------o-------------------_-o
       *       -   / ""--..__              '.             _.-' /
       *   _     "@- - - - - ""--..__- - - - x - - - -_.@'    /
       *    "-_  /                   ""--..__ '.  _,-` :     /
       *       "o----------------------------""-o'    :     /
       *      0,2                            4 / '.  :     /
       *                                      /   '.:     /
       *                                     /     :'.   /
       *                                    /     :  ', /
       *                                   /     :     o
       */

      var SEGMENT_INDICES = [
      // start corner
      0, 2, 1,
      // body
      1, 2, 4, 1, 4, 3,
      // end corner
      3, 4, 5];

      // [0] position on segment - 0: start, 1: end
      // [1] side of path - -1: left, 0: center, 1: right
      // [2] role - 0: offset point 1: joint point
      var SEGMENT_POSITIONS = [
      // bevel start corner
      0, 0, 1,
      // start inner corner
      0, -1, 0,
      // start outer corner
      0, 1, 0,
      // end inner corner
      1, -1, 0,
      // end outer corner
      1, 1, 0,
      // bevel end corner
      1, 0, 1];

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        fs: shaders.fs,
        vs: shaders.vs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLES,
          attributes: {
            indices: new Uint16Array(SEGMENT_INDICES),
            positions: new Float32Array(SEGMENT_POSITIONS)
          }
        }),
        isInstanced: true
      });
    }
  }, {
    key: 'calculateStartPositions',
    value: function calculateStartPositions(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        var numSegments = path.length - 1;
        for (var ptIndex = 0; ptIndex < numSegments; ptIndex++) {
          var point = path[ptIndex];
          value[i++] = point[0];
          value[i++] = point[1];
          value[i++] = point[2] || 0;
        }
      });
    }
  }, {
    key: 'calculateEndPositions',
    value: function calculateEndPositions(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          var point = path[ptIndex];
          value[i++] = point[0];
          value[i++] = point[1];
          value[i++] = point[2] || 0;
        }
      });
    }
  }, {
    key: 'calculateInstanceStartEndPositions64xyLow',
    value: function calculateInstanceStartEndPositions64xyLow(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        var numSegments = path.length - 1;
        for (var ptIndex = 0; ptIndex < numSegments; ptIndex++) {
          var startPoint = path[ptIndex];
          var endPoint = path[ptIndex + 1];
          value[i++] = (0, _fp.fp64ify)(startPoint[0])[1];
          value[i++] = (0, _fp.fp64ify)(startPoint[1])[1];
          value[i++] = (0, _fp.fp64ify)(endPoint[0])[1];
          value[i++] = (0, _fp.fp64ify)(endPoint[1])[1];
        }
      });
    }
  }, {
    key: 'calculateLeftDeltas',
    value: function calculateLeftDeltas(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        var numSegments = path.length - 1;
        var prevPoint = isClosed(path) ? path[path.length - 2] : path[0];

        for (var ptIndex = 0; ptIndex < numSegments; ptIndex++) {
          var point = path[ptIndex];
          value[i++] = point[0] - prevPoint[0];
          value[i++] = point[1] - prevPoint[1];
          value[i++] = point[2] - prevPoint[2] || 0;
          prevPoint = point;
        }
      });
    }
  }, {
    key: 'calculateRightDeltas',
    value: function calculateRightDeltas(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          var point = path[ptIndex];
          var nextPoint = path[ptIndex + 1];
          if (!nextPoint) {
            nextPoint = isClosed(path) ? path[1] : point;
          }

          value[i++] = nextPoint[0] - point[0];
          value[i++] = nextPoint[1] - point[1];
          value[i++] = nextPoint[2] - point[2] || 0;
        }
      });
    }
  }, {
    key: 'calculateStrokeWidths',
    value: function calculateStrokeWidths(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getWidth = _props2.getWidth;
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path, index) {
        var width = getWidth(data[index], index);
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          value[i++] = width;
        }
      });
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getColor = _props3.getColor;
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path, index) {
        var color = getColor(data[index], index) || DEFAULT_COLOR;
        if (Array.isArray(color[0])) {
          if (color.length !== path.length) {
            throw new Error('PathLayer getColor() returned a color array, but the number of ' + ('colors returned doesn\'t match the number of points in the path. Index ' + index));
          }
          color.forEach(function (pointColor) {
            var alpha = isNaN(pointColor[3]) ? 255 : pointColor[3];
            // two copies for outside edge and inside edge each
            value[i++] = pointColor[0];
            value[i++] = pointColor[1];
            value[i++] = pointColor[2];
            value[i++] = alpha;
          });
        } else {
          var pointColor = color;
          if (isNaN(pointColor[3])) {
            pointColor[3] = 255;
          }
          for (var ptIndex = 0; ptIndex < path.length; ptIndex++) {
            // two copies for outside edge and inside edge each
            value[i++] = pointColor[0];
            value[i++] = pointColor[1];
            value[i++] = pointColor[2];
            value[i++] = pointColor[3];
          }
        }
      });
    }

    // Override the default picking colors calculation

  }, {
    key: 'calculatePickingColors',
    value: function calculatePickingColors(attribute) {
      var _this2 = this;

      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path, index) {
        var pickingColor = _this2.encodePickingColor(index);
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          value[i++] = pickingColor[0];
          value[i++] = pickingColor[1];
          value[i++] = pickingColor[2];
        }
      });
    }
  }]);

  return PathLayer;
}(_lib.Layer);

exports.default = PathLayer;


PathLayer.layerName = 'PathLayer';
PathLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wYXRoLWxheWVyL3BhdGgtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsIm9wYWNpdHkiLCJ3aWR0aFNjYWxlIiwid2lkdGhNaW5QaXhlbHMiLCJ3aWR0aE1heFBpeGVscyIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJyb3VuZGVkIiwibWl0ZXJMaW1pdCIsImZwNjQiLCJnZXRQYXRoIiwib2JqZWN0IiwicGF0aCIsImdldENvbG9yIiwiY29sb3IiLCJnZXRXaWR0aCIsIndpZHRoIiwiaXNDbG9zZWQiLCJmaXJzdFBvaW50IiwibGFzdFBvaW50IiwibGVuZ3RoIiwiUGF0aExheWVyIiwicHJvcHMiLCJ2cyIsImZzIiwibW9kdWxlcyIsImdsIiwiY29udGV4dCIsInNldFN0YXRlIiwibW9kZWwiLCJfZ2V0TW9kZWwiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVN0YXJ0UG9zaXRpb25zIiwic2l6ZSIsInVwZGF0ZSIsImNhbGN1bGF0ZVN0YXJ0UG9zaXRpb25zIiwiaW5zdGFuY2VFbmRQb3NpdGlvbnMiLCJjYWxjdWxhdGVFbmRQb3NpdGlvbnMiLCJpbnN0YW5jZUxlZnREZWx0YXMiLCJjYWxjdWxhdGVMZWZ0RGVsdGFzIiwiaW5zdGFuY2VSaWdodERlbHRhcyIsImNhbGN1bGF0ZVJpZ2h0RGVsdGFzIiwiaW5zdGFuY2VTdHJva2VXaWR0aHMiLCJhY2Nlc3NvciIsImNhbGN1bGF0ZVN0cm9rZVdpZHRocyIsImluc3RhbmNlQ29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVDb2xvcnMiLCJpbnN0YW5jZVBpY2tpbmdDb2xvcnMiLCJjYWxjdWxhdGVQaWNraW5nQ29sb3JzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImludmFsaWRhdGVBbGwiLCJwcm9qZWN0aW9uTW9kZSIsIkxOR19MQVQiLCJpbnN0YW5jZVN0YXJ0RW5kUG9zaXRpb25zNjR4eUxvdyIsImNhbGN1bGF0ZUluc3RhbmNlU3RhcnRFbmRQb3NpdGlvbnM2NHh5TG93IiwicmVtb3ZlIiwidXBkYXRlQXR0cmlidXRlIiwiZGF0YUNoYW5nZWQiLCJwYXRocyIsImRhdGEiLCJtYXAiLCJudW1JbnN0YW5jZXMiLCJyZWR1Y2UiLCJjb3VudCIsInVuaWZvcm1zIiwicmVuZGVyIiwiT2JqZWN0IiwiYXNzaWduIiwiam9pbnRUeXBlIiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJTRUdNRU5UX0lORElDRVMiLCJTRUdNRU5UX1BPU0lUSU9OUyIsImlkIiwiZ2VvbWV0cnkiLCJkcmF3TW9kZSIsIlRSSUFOR0xFUyIsImF0dHJpYnV0ZXMiLCJpbmRpY2VzIiwiVWludDE2QXJyYXkiLCJwb3NpdGlvbnMiLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsImF0dHJpYnV0ZSIsInZhbHVlIiwiaSIsImZvckVhY2giLCJudW1TZWdtZW50cyIsInB0SW5kZXgiLCJwb2ludCIsInN0YXJ0UG9pbnQiLCJlbmRQb2ludCIsInByZXZQb2ludCIsIm5leHRQb2ludCIsImluZGV4IiwiQXJyYXkiLCJpc0FycmF5IiwiRXJyb3IiLCJwb2ludENvbG9yIiwiYWxwaGEiLCJpc05hTiIsInBpY2tpbmdDb2xvciIsImVuY29kZVBpY2tpbmdDb2xvciIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVlBLElBQU1BLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsV0FBUyxDQURVO0FBRW5CQyxjQUFZLENBRk8sRUFFSjtBQUNmQyxrQkFBZ0IsQ0FIRyxFQUdBO0FBQ25CQyxrQkFBZ0JDLE9BQU9DLGdCQUpKLEVBSXNCO0FBQ3pDQyxXQUFTLEtBTFU7QUFNbkJDLGNBQVksQ0FOTztBQU9uQkMsUUFBTSxLQVBhOztBQVNuQkMsV0FBUztBQUFBLFdBQVVDLE9BQU9DLElBQWpCO0FBQUEsR0FUVTtBQVVuQkMsWUFBVTtBQUFBLFdBQVVGLE9BQU9HLEtBQVAsSUFBZ0JmLGFBQTFCO0FBQUEsR0FWUztBQVduQmdCLFlBQVU7QUFBQSxXQUFVSixPQUFPSyxLQUFQLElBQWdCLENBQTFCO0FBQUE7QUFYUyxDQUFyQjs7QUFjQSxJQUFNQyxXQUFXLFNBQVhBLFFBQVcsT0FBUTtBQUN2QixNQUFNQyxhQUFhTixLQUFLLENBQUwsQ0FBbkI7QUFDQSxNQUFNTyxZQUFZUCxLQUFLQSxLQUFLUSxNQUFMLEdBQWMsQ0FBbkIsQ0FBbEI7QUFDQSxTQUFPRixXQUFXLENBQVgsTUFBa0JDLFVBQVUsQ0FBVixDQUFsQixJQUFrQ0QsV0FBVyxDQUFYLE1BQWtCQyxVQUFVLENBQVYsQ0FBcEQsSUFDTEQsV0FBVyxDQUFYLE1BQWtCQyxVQUFVLENBQVYsQ0FEcEI7QUFFRCxDQUxEOztJQU9xQkUsUzs7Ozs7Ozs7Ozs7aUNBQ047QUFDWCxhQUFPLDRCQUFtQixLQUFLQyxLQUF4QixJQUFpQztBQUN0Q0MscUNBRHNDLEVBQ3BCQywrQkFEb0IsRUFDRkMsU0FBUyxDQUFDLE1BQUQsRUFBUyxXQUFUO0FBRFAsT0FBakMsR0FFSDtBQUNGRixxQ0FERSxFQUNjQywrQkFEZCxFQUNnQ0MsU0FBUztBQUR6QyxPQUZKO0FBS0Q7OztzQ0FFaUI7QUFBQSxVQUNUQyxFQURTLEdBQ0gsS0FBS0MsT0FERixDQUNURCxFQURTOztBQUVoQixXQUFLRSxRQUFMLENBQWMsRUFBQ0MsT0FBTyxLQUFLQyxTQUFMLENBQWVKLEVBQWYsQ0FBUixFQUFkOztBQUZnQixVQUlUSyxnQkFKUyxHQUlXLEtBQUtDLEtBSmhCLENBSVRELGdCQUpTO0FBS2hCOztBQUNBQSx1QkFBaUJFLFlBQWpCLENBQThCO0FBQzVCQyxnQ0FBd0IsRUFBQ0MsTUFBTSxDQUFQLEVBQVVDLFFBQVEsS0FBS0MsdUJBQXZCLEVBREk7QUFFNUJDLDhCQUFzQixFQUFDSCxNQUFNLENBQVAsRUFBVUMsUUFBUSxLQUFLRyxxQkFBdkIsRUFGTTtBQUc1QkMsNEJBQW9CLEVBQUNMLE1BQU0sQ0FBUCxFQUFVQyxRQUFRLEtBQUtLLG1CQUF2QixFQUhRO0FBSTVCQyw2QkFBcUIsRUFBQ1AsTUFBTSxDQUFQLEVBQVVDLFFBQVEsS0FBS08sb0JBQXZCLEVBSk87QUFLNUJDLDhCQUFzQixFQUFDVCxNQUFNLENBQVAsRUFBVVUsVUFBVSxVQUFwQixFQUFnQ1QsUUFBUSxLQUFLVSxxQkFBN0MsRUFMTTtBQU01QkMsd0JBQWdCLEVBQUNaLE1BQU0sQ0FBUCxFQUFVYSxNQUFNLFNBQUdDLGFBQW5CLEVBQWtDSixVQUFVLFVBQTVDLEVBQXdEVCxRQUFRLEtBQUtjLGVBQXJFLEVBTlk7QUFPNUJDLCtCQUF1QixFQUFDaEIsTUFBTSxDQUFQLEVBQVVhLE1BQU0sU0FBR0MsYUFBbkIsRUFBa0NiLFFBQVEsS0FBS2dCLHNCQUEvQztBQVBLLE9BQTlCO0FBU0E7QUFDRDs7OzBDQUUrQztBQUFBLFVBQS9COUIsS0FBK0IsUUFBL0JBLEtBQStCO0FBQUEsVUFBeEIrQixRQUF3QixRQUF4QkEsUUFBd0I7QUFBQSxVQUFkQyxXQUFjLFFBQWRBLFdBQWM7O0FBQzlDLFVBQUloQyxNQUFNYixJQUFOLEtBQWU0QyxTQUFTNUMsSUFBNUIsRUFBa0M7QUFBQSxZQUN6QnNCLGdCQUR5QixHQUNMLEtBQUtDLEtBREEsQ0FDekJELGdCQUR5Qjs7QUFFaENBLHlCQUFpQndCLGFBQWpCOztBQUVBLFlBQUlqQyxNQUFNYixJQUFOLElBQWNhLE1BQU1rQyxjQUFOLEtBQXlCLHVCQUFrQkMsT0FBN0QsRUFBc0U7QUFDcEUxQiwyQkFBaUJFLFlBQWpCLENBQThCO0FBQzVCeUIsOENBQWtDO0FBQ2hDdkIsb0JBQU0sQ0FEMEI7QUFFaENDLHNCQUFRLEtBQUt1QjtBQUZtQjtBQUROLFdBQTlCO0FBTUQsU0FQRCxNQU9PO0FBQ0w1QiwyQkFBaUI2QixNQUFqQixDQUF3QixDQUN0QixrQ0FEc0IsQ0FBeEI7QUFHRDtBQUNGO0FBQ0Y7Ozt1Q0FFMkM7QUFBQSxVQUEvQlAsUUFBK0IsU0FBL0JBLFFBQStCO0FBQUEsVUFBckIvQixLQUFxQixTQUFyQkEsS0FBcUI7QUFBQSxVQUFkZ0MsV0FBYyxTQUFkQSxXQUFjOztBQUMxQyx3SEFBa0IsRUFBQ2hDLFlBQUQsRUFBUStCLGtCQUFSLEVBQWtCQyx3QkFBbEIsRUFBbEI7O0FBRDBDLFVBR25DNUMsT0FIbUMsR0FHeEIsS0FBS1ksS0FIbUIsQ0FHbkNaLE9BSG1DO0FBQUEsVUFJbkNxQixnQkFKbUMsR0FJZixLQUFLQyxLQUpVLENBSW5DRCxnQkFKbUM7O0FBSzFDLFVBQUlULE1BQU1iLElBQU4sS0FBZTRDLFNBQVM1QyxJQUE1QixFQUFrQztBQUFBLFlBQ3pCaUIsRUFEeUIsR0FDbkIsS0FBS0MsT0FEYyxDQUN6QkQsRUFEeUI7O0FBRWhDLGFBQUtFLFFBQUwsQ0FBYyxFQUFDQyxPQUFPLEtBQUtDLFNBQUwsQ0FBZUosRUFBZixDQUFSLEVBQWQ7QUFDRDtBQUNELFdBQUttQyxlQUFMLENBQXFCLEVBQUN2QyxZQUFELEVBQVErQixrQkFBUixFQUFrQkMsd0JBQWxCLEVBQXJCOztBQUVBLFVBQUlBLFlBQVlRLFdBQWhCLEVBQTZCO0FBQzNCO0FBQ0EsWUFBTUMsUUFBUXpDLE1BQU0wQyxJQUFOLENBQVdDLEdBQVgsQ0FBZXZELE9BQWYsQ0FBZDtBQUNBLFlBQU13RCxlQUFlSCxNQUFNSSxNQUFOLENBQWEsVUFBQ0MsS0FBRCxFQUFReEQsSUFBUjtBQUFBLGlCQUFpQndELFFBQVF4RCxLQUFLUSxNQUFiLEdBQXNCLENBQXZDO0FBQUEsU0FBYixFQUF1RCxDQUF2RCxDQUFyQjs7QUFFQSxhQUFLUSxRQUFMLENBQWMsRUFBQ21DLFlBQUQsRUFBUUcsMEJBQVIsRUFBZDtBQUNBbkMseUJBQWlCd0IsYUFBakI7QUFDRDtBQUNGOzs7Z0NBRWdCO0FBQUEsVUFBWGMsUUFBVyxTQUFYQSxRQUFXO0FBQUEsbUJBR1gsS0FBSy9DLEtBSE07QUFBQSxVQUViZixPQUZhLFVBRWJBLE9BRmE7QUFBQSxVQUVKQyxVQUZJLFVBRUpBLFVBRkk7QUFBQSxVQUVRTixVQUZSLFVBRVFBLFVBRlI7QUFBQSxVQUVvQkMsY0FGcEIsVUFFb0JBLGNBRnBCO0FBQUEsVUFFb0NDLGNBRnBDLFVBRW9DQSxjQUZwQzs7O0FBS2YsV0FBSzRCLEtBQUwsQ0FBV0gsS0FBWCxDQUFpQnlDLE1BQWpCLENBQXdCQyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQkgsUUFBbEIsRUFBNEI7QUFDbERJLG1CQUFXcEUsT0FBT0UsT0FBUCxDQUR1QztBQUVsREwsOEJBRmtEO0FBR2xETSw4QkFIa0Q7QUFJbERMLHNDQUprRDtBQUtsREM7QUFMa0QsT0FBNUIsQ0FBeEI7QUFPRDs7OzhCQUVTc0IsRSxFQUFJO0FBQ1osVUFBTWdELFVBQVUsa0NBQWdCaEQsRUFBaEIsRUFBb0IsS0FBS2lELFVBQUwsRUFBcEIsQ0FBaEI7O0FBRUE7Ozs7Ozs7Ozs7Ozs7OztBQWVBLFVBQU1DLGtCQUFrQjtBQUN0QjtBQUNBLE9BRnNCLEVBRW5CLENBRm1CLEVBRWhCLENBRmdCO0FBR3RCO0FBQ0EsT0FKc0IsRUFJbkIsQ0FKbUIsRUFJaEIsQ0FKZ0IsRUFJYixDQUphLEVBSVYsQ0FKVSxFQUlQLENBSk87QUFLdEI7QUFDQSxPQU5zQixFQU1uQixDQU5tQixFQU1oQixDQU5nQixDQUF4Qjs7QUFTQTtBQUNBO0FBQ0E7QUFDQSxVQUFNQyxvQkFBb0I7QUFDeEI7QUFDQSxPQUZ3QixFQUVyQixDQUZxQixFQUVsQixDQUZrQjtBQUd4QjtBQUNBLE9BSndCLEVBSXJCLENBQUMsQ0FKb0IsRUFJakIsQ0FKaUI7QUFLeEI7QUFDQSxPQU53QixFQU1yQixDQU5xQixFQU1sQixDQU5rQjtBQU94QjtBQUNBLE9BUndCLEVBUXJCLENBQUMsQ0FSb0IsRUFRakIsQ0FSaUI7QUFTeEI7QUFDQSxPQVZ3QixFQVVyQixDQVZxQixFQVVsQixDQVZrQjtBQVd4QjtBQUNBLE9BWndCLEVBWXJCLENBWnFCLEVBWWxCLENBWmtCLENBQTFCOztBQWVBLGFBQU8sZ0JBQVU7QUFDZm5ELGNBRGU7QUFFZm9ELFlBQUksS0FBS3hELEtBQUwsQ0FBV3dELEVBRkE7QUFHZnRELFlBQUlrRCxRQUFRbEQsRUFIRztBQUlmRCxZQUFJbUQsUUFBUW5ELEVBSkc7QUFLZndELGtCQUFVLG1CQUFhO0FBQ3JCQyxvQkFBVSxTQUFHQyxTQURRO0FBRXJCQyxzQkFBWTtBQUNWQyxxQkFBUyxJQUFJQyxXQUFKLENBQWdCUixlQUFoQixDQURDO0FBRVZTLHVCQUFXLElBQUlDLFlBQUosQ0FBaUJULGlCQUFqQjtBQUZEO0FBRlMsU0FBYixDQUxLO0FBWWZVLHFCQUFhO0FBWkUsT0FBVixDQUFQO0FBY0Q7Ozs0Q0FFdUJDLFMsRUFBVztBQUFBLFVBQzFCekIsS0FEMEIsR0FDakIsS0FBSy9CLEtBRFksQ0FDMUIrQixLQUQwQjtBQUFBLFVBRTFCMEIsS0FGMEIsR0FFakJELFNBRmlCLENBRTFCQyxLQUYwQjs7O0FBSWpDLFVBQUlDLElBQUksQ0FBUjtBQUNBM0IsWUFBTTRCLE9BQU4sQ0FBYyxnQkFBUTtBQUNwQixZQUFNQyxjQUFjaEYsS0FBS1EsTUFBTCxHQUFjLENBQWxDO0FBQ0EsYUFBSyxJQUFJeUUsVUFBVSxDQUFuQixFQUFzQkEsVUFBVUQsV0FBaEMsRUFBNkNDLFNBQTdDLEVBQXdEO0FBQ3RELGNBQU1DLFFBQVFsRixLQUFLaUYsT0FBTCxDQUFkO0FBQ0FKLGdCQUFNQyxHQUFOLElBQWFJLE1BQU0sQ0FBTixDQUFiO0FBQ0FMLGdCQUFNQyxHQUFOLElBQWFJLE1BQU0sQ0FBTixDQUFiO0FBQ0FMLGdCQUFNQyxHQUFOLElBQWFJLE1BQU0sQ0FBTixLQUFZLENBQXpCO0FBQ0Q7QUFDRixPQVJEO0FBU0Q7OzswQ0FFcUJOLFMsRUFBVztBQUFBLFVBQ3hCekIsS0FEd0IsR0FDZixLQUFLL0IsS0FEVSxDQUN4QitCLEtBRHdCO0FBQUEsVUFFeEIwQixLQUZ3QixHQUVmRCxTQUZlLENBRXhCQyxLQUZ3Qjs7O0FBSS9CLFVBQUlDLElBQUksQ0FBUjtBQUNBM0IsWUFBTTRCLE9BQU4sQ0FBYyxnQkFBUTtBQUNwQixhQUFLLElBQUlFLFVBQVUsQ0FBbkIsRUFBc0JBLFVBQVVqRixLQUFLUSxNQUFyQyxFQUE2Q3lFLFNBQTdDLEVBQXdEO0FBQ3RELGNBQU1DLFFBQVFsRixLQUFLaUYsT0FBTCxDQUFkO0FBQ0FKLGdCQUFNQyxHQUFOLElBQWFJLE1BQU0sQ0FBTixDQUFiO0FBQ0FMLGdCQUFNQyxHQUFOLElBQWFJLE1BQU0sQ0FBTixDQUFiO0FBQ0FMLGdCQUFNQyxHQUFOLElBQWFJLE1BQU0sQ0FBTixLQUFZLENBQXpCO0FBQ0Q7QUFDRixPQVBEO0FBUUQ7Ozs4REFFeUNOLFMsRUFBVztBQUFBLFVBQzVDekIsS0FENEMsR0FDbkMsS0FBSy9CLEtBRDhCLENBQzVDK0IsS0FENEM7QUFBQSxVQUU1QzBCLEtBRjRDLEdBRW5DRCxTQUZtQyxDQUU1Q0MsS0FGNEM7OztBQUluRCxVQUFJQyxJQUFJLENBQVI7QUFDQTNCLFlBQU00QixPQUFOLENBQWMsZ0JBQVE7QUFDcEIsWUFBTUMsY0FBY2hGLEtBQUtRLE1BQUwsR0FBYyxDQUFsQztBQUNBLGFBQUssSUFBSXlFLFVBQVUsQ0FBbkIsRUFBc0JBLFVBQVVELFdBQWhDLEVBQTZDQyxTQUE3QyxFQUF3RDtBQUN0RCxjQUFNRSxhQUFhbkYsS0FBS2lGLE9BQUwsQ0FBbkI7QUFDQSxjQUFNRyxXQUFXcEYsS0FBS2lGLFVBQVUsQ0FBZixDQUFqQjtBQUNBSixnQkFBTUMsR0FBTixJQUFhLGlCQUFRSyxXQUFXLENBQVgsQ0FBUixFQUF1QixDQUF2QixDQUFiO0FBQ0FOLGdCQUFNQyxHQUFOLElBQWEsaUJBQVFLLFdBQVcsQ0FBWCxDQUFSLEVBQXVCLENBQXZCLENBQWI7QUFDQU4sZ0JBQU1DLEdBQU4sSUFBYSxpQkFBUU0sU0FBUyxDQUFULENBQVIsRUFBcUIsQ0FBckIsQ0FBYjtBQUNBUCxnQkFBTUMsR0FBTixJQUFhLGlCQUFRTSxTQUFTLENBQVQsQ0FBUixFQUFxQixDQUFyQixDQUFiO0FBQ0Q7QUFDRixPQVZEO0FBV0Q7Ozt3Q0FFbUJSLFMsRUFBVztBQUFBLFVBQ3RCekIsS0FEc0IsR0FDYixLQUFLL0IsS0FEUSxDQUN0QitCLEtBRHNCO0FBQUEsVUFFdEIwQixLQUZzQixHQUViRCxTQUZhLENBRXRCQyxLQUZzQjs7O0FBSTdCLFVBQUlDLElBQUksQ0FBUjtBQUNBM0IsWUFBTTRCLE9BQU4sQ0FBYyxnQkFBUTtBQUNwQixZQUFNQyxjQUFjaEYsS0FBS1EsTUFBTCxHQUFjLENBQWxDO0FBQ0EsWUFBSTZFLFlBQVloRixTQUFTTCxJQUFULElBQWlCQSxLQUFLQSxLQUFLUSxNQUFMLEdBQWMsQ0FBbkIsQ0FBakIsR0FBeUNSLEtBQUssQ0FBTCxDQUF6RDs7QUFFQSxhQUFLLElBQUlpRixVQUFVLENBQW5CLEVBQXNCQSxVQUFVRCxXQUFoQyxFQUE2Q0MsU0FBN0MsRUFBd0Q7QUFDdEQsY0FBTUMsUUFBUWxGLEtBQUtpRixPQUFMLENBQWQ7QUFDQUosZ0JBQU1DLEdBQU4sSUFBYUksTUFBTSxDQUFOLElBQVdHLFVBQVUsQ0FBVixDQUF4QjtBQUNBUixnQkFBTUMsR0FBTixJQUFhSSxNQUFNLENBQU4sSUFBV0csVUFBVSxDQUFWLENBQXhCO0FBQ0FSLGdCQUFNQyxHQUFOLElBQWNJLE1BQU0sQ0FBTixJQUFXRyxVQUFVLENBQVYsQ0FBWixJQUE2QixDQUExQztBQUNBQSxzQkFBWUgsS0FBWjtBQUNEO0FBQ0YsT0FYRDtBQVlEOzs7eUNBRW9CTixTLEVBQVc7QUFBQSxVQUN2QnpCLEtBRHVCLEdBQ2QsS0FBSy9CLEtBRFMsQ0FDdkIrQixLQUR1QjtBQUFBLFVBRXZCMEIsS0FGdUIsR0FFZEQsU0FGYyxDQUV2QkMsS0FGdUI7OztBQUk5QixVQUFJQyxJQUFJLENBQVI7QUFDQTNCLFlBQU00QixPQUFOLENBQWMsZ0JBQVE7QUFDcEIsYUFBSyxJQUFJRSxVQUFVLENBQW5CLEVBQXNCQSxVQUFVakYsS0FBS1EsTUFBckMsRUFBNkN5RSxTQUE3QyxFQUF3RDtBQUN0RCxjQUFNQyxRQUFRbEYsS0FBS2lGLE9BQUwsQ0FBZDtBQUNBLGNBQUlLLFlBQVl0RixLQUFLaUYsVUFBVSxDQUFmLENBQWhCO0FBQ0EsY0FBSSxDQUFDSyxTQUFMLEVBQWdCO0FBQ2RBLHdCQUFZakYsU0FBU0wsSUFBVCxJQUFpQkEsS0FBSyxDQUFMLENBQWpCLEdBQTJCa0YsS0FBdkM7QUFDRDs7QUFFREwsZ0JBQU1DLEdBQU4sSUFBYVEsVUFBVSxDQUFWLElBQWVKLE1BQU0sQ0FBTixDQUE1QjtBQUNBTCxnQkFBTUMsR0FBTixJQUFhUSxVQUFVLENBQVYsSUFBZUosTUFBTSxDQUFOLENBQTVCO0FBQ0FMLGdCQUFNQyxHQUFOLElBQWNRLFVBQVUsQ0FBVixJQUFlSixNQUFNLENBQU4sQ0FBaEIsSUFBNkIsQ0FBMUM7QUFDRDtBQUNGLE9BWkQ7QUFhRDs7OzBDQUVxQk4sUyxFQUFXO0FBQUEsb0JBQ04sS0FBS2xFLEtBREM7QUFBQSxVQUN4QjBDLElBRHdCLFdBQ3hCQSxJQUR3QjtBQUFBLFVBQ2xCakQsUUFEa0IsV0FDbEJBLFFBRGtCO0FBQUEsVUFFeEJnRCxLQUZ3QixHQUVmLEtBQUsvQixLQUZVLENBRXhCK0IsS0FGd0I7QUFBQSxVQUd4QjBCLEtBSHdCLEdBR2ZELFNBSGUsQ0FHeEJDLEtBSHdCOzs7QUFLL0IsVUFBSUMsSUFBSSxDQUFSO0FBQ0EzQixZQUFNNEIsT0FBTixDQUFjLFVBQUMvRSxJQUFELEVBQU91RixLQUFQLEVBQWlCO0FBQzdCLFlBQU1uRixRQUFRRCxTQUFTaUQsS0FBS21DLEtBQUwsQ0FBVCxFQUFzQkEsS0FBdEIsQ0FBZDtBQUNBLGFBQUssSUFBSU4sVUFBVSxDQUFuQixFQUFzQkEsVUFBVWpGLEtBQUtRLE1BQXJDLEVBQTZDeUUsU0FBN0MsRUFBd0Q7QUFDdERKLGdCQUFNQyxHQUFOLElBQWExRSxLQUFiO0FBQ0Q7QUFDRixPQUxEO0FBTUQ7OztvQ0FFZXdFLFMsRUFBVztBQUFBLG9CQUNBLEtBQUtsRSxLQURMO0FBQUEsVUFDbEIwQyxJQURrQixXQUNsQkEsSUFEa0I7QUFBQSxVQUNabkQsUUFEWSxXQUNaQSxRQURZO0FBQUEsVUFFbEJrRCxLQUZrQixHQUVULEtBQUsvQixLQUZJLENBRWxCK0IsS0FGa0I7QUFBQSxVQUdsQjBCLEtBSGtCLEdBR1RELFNBSFMsQ0FHbEJDLEtBSGtCOzs7QUFLekIsVUFBSUMsSUFBSSxDQUFSO0FBQ0EzQixZQUFNNEIsT0FBTixDQUFjLFVBQUMvRSxJQUFELEVBQU91RixLQUFQLEVBQWlCO0FBQzdCLFlBQU1yRixRQUFRRCxTQUFTbUQsS0FBS21DLEtBQUwsQ0FBVCxFQUFzQkEsS0FBdEIsS0FBZ0NwRyxhQUE5QztBQUNBLFlBQUlxRyxNQUFNQyxPQUFOLENBQWN2RixNQUFNLENBQU4sQ0FBZCxDQUFKLEVBQTZCO0FBQzNCLGNBQUlBLE1BQU1NLE1BQU4sS0FBaUJSLEtBQUtRLE1BQTFCLEVBQWtDO0FBQ2hDLGtCQUFNLElBQUlrRixLQUFKLENBQVUsaUpBQzBESCxLQUQxRCxDQUFWLENBQU47QUFFRDtBQUNEckYsZ0JBQU02RSxPQUFOLENBQWMsVUFBQ1ksVUFBRCxFQUFnQjtBQUM1QixnQkFBTUMsUUFBUUMsTUFBTUYsV0FBVyxDQUFYLENBQU4sSUFBdUIsR0FBdkIsR0FBNkJBLFdBQVcsQ0FBWCxDQUEzQztBQUNBO0FBQ0FkLGtCQUFNQyxHQUFOLElBQWFhLFdBQVcsQ0FBWCxDQUFiO0FBQ0FkLGtCQUFNQyxHQUFOLElBQWFhLFdBQVcsQ0FBWCxDQUFiO0FBQ0FkLGtCQUFNQyxHQUFOLElBQWFhLFdBQVcsQ0FBWCxDQUFiO0FBQ0FkLGtCQUFNQyxHQUFOLElBQWFjLEtBQWI7QUFDRCxXQVBEO0FBUUQsU0FiRCxNQWFPO0FBQ0wsY0FBTUQsYUFBYXpGLEtBQW5CO0FBQ0EsY0FBSTJGLE1BQU1GLFdBQVcsQ0FBWCxDQUFOLENBQUosRUFBMEI7QUFDeEJBLHVCQUFXLENBQVgsSUFBZ0IsR0FBaEI7QUFDRDtBQUNELGVBQUssSUFBSVYsVUFBVSxDQUFuQixFQUFzQkEsVUFBVWpGLEtBQUtRLE1BQXJDLEVBQTZDeUUsU0FBN0MsRUFBd0Q7QUFDdEQ7QUFDQUosa0JBQU1DLEdBQU4sSUFBYWEsV0FBVyxDQUFYLENBQWI7QUFDQWQsa0JBQU1DLEdBQU4sSUFBYWEsV0FBVyxDQUFYLENBQWI7QUFDQWQsa0JBQU1DLEdBQU4sSUFBYWEsV0FBVyxDQUFYLENBQWI7QUFDQWQsa0JBQU1DLEdBQU4sSUFBYWEsV0FBVyxDQUFYLENBQWI7QUFDRDtBQUNGO0FBQ0YsT0E1QkQ7QUE2QkQ7O0FBRUQ7Ozs7MkNBQ3VCZixTLEVBQVc7QUFBQTs7QUFBQSxVQUN6QnpCLEtBRHlCLEdBQ2hCLEtBQUsvQixLQURXLENBQ3pCK0IsS0FEeUI7QUFBQSxVQUV6QjBCLEtBRnlCLEdBRWhCRCxTQUZnQixDQUV6QkMsS0FGeUI7OztBQUloQyxVQUFJQyxJQUFJLENBQVI7QUFDQTNCLFlBQU00QixPQUFOLENBQWMsVUFBQy9FLElBQUQsRUFBT3VGLEtBQVAsRUFBaUI7QUFDN0IsWUFBTU8sZUFBZSxPQUFLQyxrQkFBTCxDQUF3QlIsS0FBeEIsQ0FBckI7QUFDQSxhQUFLLElBQUlOLFVBQVUsQ0FBbkIsRUFBc0JBLFVBQVVqRixLQUFLUSxNQUFyQyxFQUE2Q3lFLFNBQTdDLEVBQXdEO0FBQ3RESixnQkFBTUMsR0FBTixJQUFhZ0IsYUFBYSxDQUFiLENBQWI7QUFDQWpCLGdCQUFNQyxHQUFOLElBQWFnQixhQUFhLENBQWIsQ0FBYjtBQUNBakIsZ0JBQU1DLEdBQU4sSUFBYWdCLGFBQWEsQ0FBYixDQUFiO0FBQ0Q7QUFDRixPQVBEO0FBUUQ7Ozs7OztrQkF4U2tCckYsUzs7O0FBNFNyQkEsVUFBVXVGLFNBQVYsR0FBc0IsV0FBdEI7QUFDQXZGLFVBQVVyQixZQUFWLEdBQXlCQSxZQUF6QiIsImZpbGUiOiJwYXRoLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllcn0gZnJvbSAnLi4vLi4vLi4vbGliJztcbmltcG9ydCB7YXNzZW1ibGVTaGFkZXJzfSBmcm9tICcuLi8uLi8uLi9zaGFkZXItdXRpbHMnO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7ZnA2NGlmeSwgZW5hYmxlNjRiaXRTdXBwb3J0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNfSBmcm9tICcuLi8uLi8uLi9saWInO1xuXG5pbXBvcnQgcGF0aFZlcnRleCBmcm9tICcuL3BhdGgtbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHBhdGhWZXJ0ZXg2NCBmcm9tICcuL3BhdGgtbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IHBhdGhGcmFnbWVudCBmcm9tICcuL3BhdGgtbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBvcGFjaXR5OiAxLFxuICB3aWR0aFNjYWxlOiAxLCAvLyBzdHJva2Ugd2lkdGggaW4gbWV0ZXJzXG4gIHdpZHRoTWluUGl4ZWxzOiAwLCAvLyAgbWluIHN0cm9rZSB3aWR0aCBpbiBwaXhlbHNcbiAgd2lkdGhNYXhQaXhlbHM6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLCAvLyBtYXggc3Ryb2tlIHdpZHRoIGluIHBpeGVsc1xuICByb3VuZGVkOiBmYWxzZSxcbiAgbWl0ZXJMaW1pdDogNCxcbiAgZnA2NDogZmFsc2UsXG5cbiAgZ2V0UGF0aDogb2JqZWN0ID0+IG9iamVjdC5wYXRoLFxuICBnZXRDb2xvcjogb2JqZWN0ID0+IG9iamVjdC5jb2xvciB8fCBERUZBVUxUX0NPTE9SLFxuICBnZXRXaWR0aDogb2JqZWN0ID0+IG9iamVjdC53aWR0aCB8fCAxXG59O1xuXG5jb25zdCBpc0Nsb3NlZCA9IHBhdGggPT4ge1xuICBjb25zdCBmaXJzdFBvaW50ID0gcGF0aFswXTtcbiAgY29uc3QgbGFzdFBvaW50ID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xuICByZXR1cm4gZmlyc3RQb2ludFswXSA9PT0gbGFzdFBvaW50WzBdICYmIGZpcnN0UG9pbnRbMV0gPT09IGxhc3RQb2ludFsxXSAmJlxuICAgIGZpcnN0UG9pbnRbMl0gPT09IGxhc3RQb2ludFsyXTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhdGhMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4gZW5hYmxlNjRiaXRTdXBwb3J0KHRoaXMucHJvcHMpID8ge1xuICAgICAgdnM6IHBhdGhWZXJ0ZXg2NCwgZnM6IHBhdGhGcmFnbWVudCwgbW9kdWxlczogWydmcDY0JywgJ3Byb2plY3Q2NCddXG4gICAgfSA6IHtcbiAgICAgIHZzOiBwYXRoVmVydGV4LCBmczogcGF0aEZyYWdtZW50LCBtb2R1bGVzOiBbXVxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVN0YXJ0UG9zaXRpb25zOiB7c2l6ZTogMywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVN0YXJ0UG9zaXRpb25zfSxcbiAgICAgIGluc3RhbmNlRW5kUG9zaXRpb25zOiB7c2l6ZTogMywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUVuZFBvc2l0aW9uc30sXG4gICAgICBpbnN0YW5jZUxlZnREZWx0YXM6IHtzaXplOiAzLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlTGVmdERlbHRhc30sXG4gICAgICBpbnN0YW5jZVJpZ2h0RGVsdGFzOiB7c2l6ZTogMywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVJpZ2h0RGVsdGFzfSxcbiAgICAgIGluc3RhbmNlU3Ryb2tlV2lkdGhzOiB7c2l6ZTogMSwgYWNjZXNzb3I6ICdnZXRXaWR0aCcsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVTdHJva2VXaWR0aHN9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldENvbG9yJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUNvbG9yc30sXG4gICAgICBpbnN0YW5jZVBpY2tpbmdDb2xvcnM6IHtzaXplOiAzLCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUGlja2luZ0NvbG9yc31cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuXG4gICAgICBpZiAocHJvcHMuZnA2NCAmJiBwcm9wcy5wcm9qZWN0aW9uTW9kZSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HX0xBVCkge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICAgICAgaW5zdGFuY2VTdGFydEVuZFBvc2l0aW9uczY0eHlMb3c6IHtcbiAgICAgICAgICAgIHNpemU6IDQsXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTdGFydEVuZFBvc2l0aW9uczY0eHlMb3dcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoW1xuICAgICAgICAgICdpbnN0YW5jZVN0YXJ0RW5kUG9zaXRpb25zNjR4eUxvdydcbiAgICAgICAgXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgc3VwZXIudXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcblxuICAgIGNvbnN0IHtnZXRQYXRofSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcblxuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCkge1xuICAgICAgLy8gdGhpcy5zdGF0ZS5wYXRocyBvbmx5IHN0b3JlcyBwb2ludCBwb3NpdGlvbnMgaW4gZWFjaCBwYXRoXG4gICAgICBjb25zdCBwYXRocyA9IHByb3BzLmRhdGEubWFwKGdldFBhdGgpO1xuICAgICAgY29uc3QgbnVtSW5zdGFuY2VzID0gcGF0aHMucmVkdWNlKChjb3VudCwgcGF0aCkgPT4gY291bnQgKyBwYXRoLmxlbmd0aCAtIDEsIDApO1xuXG4gICAgICB0aGlzLnNldFN0YXRlKHtwYXRocywgbnVtSW5zdGFuY2VzfSk7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcbiAgICB9XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBjb25zdCB7XG4gICAgICByb3VuZGVkLCBtaXRlckxpbWl0LCB3aWR0aFNjYWxlLCB3aWR0aE1pblBpeGVscywgd2lkdGhNYXhQaXhlbHNcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKE9iamVjdC5hc3NpZ24oe30sIHVuaWZvcm1zLCB7XG4gICAgICBqb2ludFR5cGU6IE51bWJlcihyb3VuZGVkKSxcbiAgICAgIHdpZHRoU2NhbGUsXG4gICAgICBtaXRlckxpbWl0LFxuICAgICAgd2lkdGhNaW5QaXhlbHMsXG4gICAgICB3aWR0aE1heFBpeGVsc1xuICAgIH0pKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIC8qXG4gICAgICogICAgICAgX1xuICAgICAqICAgICAgICBcIi1fIDEgICAgICAgICAgICAgICAgICAgMyAgICAgICAgICAgICAgICAgICAgICAgNVxuICAgICAqICAgICBfICAgICBcIm8tLS0tLS0tLS0tLS0tLS0tLS0tLS1vLS0tLS0tLS0tLS0tLS0tLS0tLV8tb1xuICAgICAqICAgICAgIC0gICAvIFwiXCItLS4uX18gICAgICAgICAgICAgICcuICAgICAgICAgICAgIF8uLScgL1xuICAgICAqICAgXyAgICAgXCJALSAtIC0gLSAtIFwiXCItLS4uX18tIC0gLSAtIHggLSAtIC0gLV8uQCcgICAgL1xuICAgICAqICAgIFwiLV8gIC8gICAgICAgICAgICAgICAgICAgXCJcIi0tLi5fXyAnLiAgXywtYCA6ICAgICAvXG4gICAgICogICAgICAgXCJvLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiXCItbycgICAgOiAgICAgL1xuICAgICAqICAgICAgMCwyICAgICAgICAgICAgICAgICAgICAgICAgICAgIDQgLyAnLiAgOiAgICAgL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvICAgJy46ICAgICAvXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyAgICAgOicuICAgL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyAgICAgOiAgJywgL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvICAgICA6ICAgICBvXG4gICAgICovXG5cbiAgICBjb25zdCBTRUdNRU5UX0lORElDRVMgPSBbXG4gICAgICAvLyBzdGFydCBjb3JuZXJcbiAgICAgIDAsIDIsIDEsXG4gICAgICAvLyBib2R5XG4gICAgICAxLCAyLCA0LCAxLCA0LCAzLFxuICAgICAgLy8gZW5kIGNvcm5lclxuICAgICAgMywgNCwgNVxuICAgIF07XG5cbiAgICAvLyBbMF0gcG9zaXRpb24gb24gc2VnbWVudCAtIDA6IHN0YXJ0LCAxOiBlbmRcbiAgICAvLyBbMV0gc2lkZSBvZiBwYXRoIC0gLTE6IGxlZnQsIDA6IGNlbnRlciwgMTogcmlnaHRcbiAgICAvLyBbMl0gcm9sZSAtIDA6IG9mZnNldCBwb2ludCAxOiBqb2ludCBwb2ludFxuICAgIGNvbnN0IFNFR01FTlRfUE9TSVRJT05TID0gW1xuICAgICAgLy8gYmV2ZWwgc3RhcnQgY29ybmVyXG4gICAgICAwLCAwLCAxLFxuICAgICAgLy8gc3RhcnQgaW5uZXIgY29ybmVyXG4gICAgICAwLCAtMSwgMCxcbiAgICAgIC8vIHN0YXJ0IG91dGVyIGNvcm5lclxuICAgICAgMCwgMSwgMCxcbiAgICAgIC8vIGVuZCBpbm5lciBjb3JuZXJcbiAgICAgIDEsIC0xLCAwLFxuICAgICAgLy8gZW5kIG91dGVyIGNvcm5lclxuICAgICAgMSwgMSwgMCxcbiAgICAgIC8vIGJldmVsIGVuZCBjb3JuZXJcbiAgICAgIDEsIDAsIDFcbiAgICBdO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgICBnbCxcbiAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICBkcmF3TW9kZTogR0wuVFJJQU5HTEVTLFxuICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgaW5kaWNlczogbmV3IFVpbnQxNkFycmF5KFNFR01FTlRfSU5ESUNFUyksXG4gICAgICAgICAgcG9zaXRpb25zOiBuZXcgRmxvYXQzMkFycmF5KFNFR01FTlRfUE9TSVRJT05TKVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVTdGFydFBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7cGF0aHN9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHBhdGhzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICBjb25zdCBudW1TZWdtZW50cyA9IHBhdGgubGVuZ3RoIC0gMTtcbiAgICAgIGZvciAobGV0IHB0SW5kZXggPSAwOyBwdEluZGV4IDwgbnVtU2VnbWVudHM7IHB0SW5kZXgrKykge1xuICAgICAgICBjb25zdCBwb2ludCA9IHBhdGhbcHRJbmRleF07XG4gICAgICAgIHZhbHVlW2krK10gPSBwb2ludFswXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHBvaW50WzFdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRbMl0gfHwgMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUVuZFBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7cGF0aHN9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHBhdGhzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICBmb3IgKGxldCBwdEluZGV4ID0gMTsgcHRJbmRleCA8IHBhdGgubGVuZ3RoOyBwdEluZGV4KyspIHtcbiAgICAgICAgY29uc3QgcG9pbnQgPSBwYXRoW3B0SW5kZXhdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRbMF07XG4gICAgICAgIHZhbHVlW2krK10gPSBwb2ludFsxXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHBvaW50WzJdIHx8IDA7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVN0YXJ0RW5kUG9zaXRpb25zNjR4eUxvdyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7cGF0aHN9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHBhdGhzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICBjb25zdCBudW1TZWdtZW50cyA9IHBhdGgubGVuZ3RoIC0gMTtcbiAgICAgIGZvciAobGV0IHB0SW5kZXggPSAwOyBwdEluZGV4IDwgbnVtU2VnbWVudHM7IHB0SW5kZXgrKykge1xuICAgICAgICBjb25zdCBzdGFydFBvaW50ID0gcGF0aFtwdEluZGV4XTtcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBwYXRoW3B0SW5kZXggKyAxXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IGZwNjRpZnkoc3RhcnRQb2ludFswXSlbMV07XG4gICAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHN0YXJ0UG9pbnRbMV0pWzFdO1xuICAgICAgICB2YWx1ZVtpKytdID0gZnA2NGlmeShlbmRQb2ludFswXSlbMV07XG4gICAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KGVuZFBvaW50WzFdKVsxXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUxlZnREZWx0YXMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge3BhdGhzfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcblxuICAgIGxldCBpID0gMDtcbiAgICBwYXRocy5mb3JFYWNoKHBhdGggPT4ge1xuICAgICAgY29uc3QgbnVtU2VnbWVudHMgPSBwYXRoLmxlbmd0aCAtIDE7XG4gICAgICBsZXQgcHJldlBvaW50ID0gaXNDbG9zZWQocGF0aCkgPyBwYXRoW3BhdGgubGVuZ3RoIC0gMl0gOiBwYXRoWzBdO1xuXG4gICAgICBmb3IgKGxldCBwdEluZGV4ID0gMDsgcHRJbmRleCA8IG51bVNlZ21lbnRzOyBwdEluZGV4KyspIHtcbiAgICAgICAgY29uc3QgcG9pbnQgPSBwYXRoW3B0SW5kZXhdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRbMF0gLSBwcmV2UG9pbnRbMF07XG4gICAgICAgIHZhbHVlW2krK10gPSBwb2ludFsxXSAtIHByZXZQb2ludFsxXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IChwb2ludFsyXSAtIHByZXZQb2ludFsyXSkgfHwgMDtcbiAgICAgICAgcHJldlBvaW50ID0gcG9pbnQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVSaWdodERlbHRhcyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7cGF0aHN9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHBhdGhzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICBmb3IgKGxldCBwdEluZGV4ID0gMTsgcHRJbmRleCA8IHBhdGgubGVuZ3RoOyBwdEluZGV4KyspIHtcbiAgICAgICAgY29uc3QgcG9pbnQgPSBwYXRoW3B0SW5kZXhdO1xuICAgICAgICBsZXQgbmV4dFBvaW50ID0gcGF0aFtwdEluZGV4ICsgMV07XG4gICAgICAgIGlmICghbmV4dFBvaW50KSB7XG4gICAgICAgICAgbmV4dFBvaW50ID0gaXNDbG9zZWQocGF0aCkgPyBwYXRoWzFdIDogcG9pbnQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YWx1ZVtpKytdID0gbmV4dFBvaW50WzBdIC0gcG9pbnRbMF07XG4gICAgICAgIHZhbHVlW2krK10gPSBuZXh0UG9pbnRbMV0gLSBwb2ludFsxXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IChuZXh0UG9pbnRbMl0gLSBwb2ludFsyXSkgfHwgMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVN0cm9rZVdpZHRocyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0V2lkdGh9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7cGF0aHN9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIHBhdGhzLmZvckVhY2goKHBhdGgsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCB3aWR0aCA9IGdldFdpZHRoKGRhdGFbaW5kZXhdLCBpbmRleCk7XG4gICAgICBmb3IgKGxldCBwdEluZGV4ID0gMTsgcHRJbmRleCA8IHBhdGgubGVuZ3RoOyBwdEluZGV4KyspIHtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHdpZHRoO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IoZGF0YVtpbmRleF0sIGluZGV4KSB8fCBERUZBVUxUX0NPTE9SO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29sb3JbMF0pKSB7XG4gICAgICAgIGlmIChjb2xvci5sZW5ndGggIT09IHBhdGgubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXRoTGF5ZXIgZ2V0Q29sb3IoKSByZXR1cm5lZCBhIGNvbG9yIGFycmF5LCBidXQgdGhlIG51bWJlciBvZiAnICtcbiAgICAgICAgICAgYGNvbG9ycyByZXR1cm5lZCBkb2Vzbid0IG1hdGNoIHRoZSBudW1iZXIgb2YgcG9pbnRzIGluIHRoZSBwYXRoLiBJbmRleCAke2luZGV4fWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbG9yLmZvckVhY2goKHBvaW50Q29sb3IpID0+IHtcbiAgICAgICAgICBjb25zdCBhbHBoYSA9IGlzTmFOKHBvaW50Q29sb3JbM10pID8gMjU1IDogcG9pbnRDb2xvclszXTtcbiAgICAgICAgICAvLyB0d28gY29waWVzIGZvciBvdXRzaWRlIGVkZ2UgYW5kIGluc2lkZSBlZGdlIGVhY2hcbiAgICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRDb2xvclswXTtcbiAgICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRDb2xvclsxXTtcbiAgICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRDb2xvclsyXTtcbiAgICAgICAgICB2YWx1ZVtpKytdID0gYWxwaGE7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcG9pbnRDb2xvciA9IGNvbG9yO1xuICAgICAgICBpZiAoaXNOYU4ocG9pbnRDb2xvclszXSkpIHtcbiAgICAgICAgICBwb2ludENvbG9yWzNdID0gMjU1O1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHB0SW5kZXggPSAwOyBwdEluZGV4IDwgcGF0aC5sZW5ndGg7IHB0SW5kZXgrKykge1xuICAgICAgICAgIC8vIHR3byBjb3BpZXMgZm9yIG91dHNpZGUgZWRnZSBhbmQgaW5zaWRlIGVkZ2UgZWFjaFxuICAgICAgICAgIHZhbHVlW2krK10gPSBwb2ludENvbG9yWzBdO1xuICAgICAgICAgIHZhbHVlW2krK10gPSBwb2ludENvbG9yWzFdO1xuICAgICAgICAgIHZhbHVlW2krK10gPSBwb2ludENvbG9yWzJdO1xuICAgICAgICAgIHZhbHVlW2krK10gPSBwb2ludENvbG9yWzNdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBwaWNraW5nIGNvbG9ycyBjYWxjdWxhdGlvblxuICBjYWxjdWxhdGVQaWNraW5nQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHBpY2tpbmdDb2xvciA9IHRoaXMuZW5jb2RlUGlja2luZ0NvbG9yKGluZGV4KTtcbiAgICAgIGZvciAobGV0IHB0SW5kZXggPSAxOyBwdEluZGV4IDwgcGF0aC5sZW5ndGg7IHB0SW5kZXgrKykge1xuICAgICAgICB2YWx1ZVtpKytdID0gcGlja2luZ0NvbG9yWzBdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcGlja2luZ0NvbG9yWzFdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcGlja2luZ0NvbG9yWzJdO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbn1cblxuUGF0aExheWVyLmxheWVyTmFtZSA9ICdQYXRoTGF5ZXInO1xuUGF0aExheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==
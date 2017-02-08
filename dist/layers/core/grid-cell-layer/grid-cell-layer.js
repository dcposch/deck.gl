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

var _gridCellLayerVertex = require('./grid-cell-layer-vertex.glsl');

var _gridCellLayerVertex2 = _interopRequireDefault(_gridCellLayerVertex);

var _gridCellLayerVertex3 = require('./grid-cell-layer-vertex-64.glsl');

var _gridCellLayerVertex4 = _interopRequireDefault(_gridCellLayerVertex3);

var _gridCellLayerFragment = require('./grid-cell-layer-fragment.glsl');

var _gridCellLayerFragment2 = _interopRequireDefault(_gridCellLayerFragment);

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

var DEFAULT_COLOR = [255, 0, 255, 255];

var defaultProps = {
  cellSize: 1000,
  // AUDIT - replace with cellsize
  lonOffset: 0.0113,
  latOffset: 0.0089,

  elevationScale: 1,
  extruded: true,
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getElevation: function getElevation(x) {
    return x.elevation;
  },
  getColor: function getColor(x) {
    return x.color;
  },

  lightSettings: {
    lightsPosition: [-122.45, 37.65, 8000, -122.45, 37.20, 1000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [1.0, 0.0, 0.8, 0.0],
    numberOfLights: 2
  }
};

var GridCellLayer = function (_Layer) {
  _inherits(GridCellLayer, _Layer);

  function GridCellLayer() {
    _classCallCheck(this, GridCellLayer);

    return _possibleConstructorReturn(this, (GridCellLayer.__proto__ || Object.getPrototypeOf(GridCellLayer)).apply(this, arguments));
  }

  _createClass(GridCellLayer, [{
    key: 'getShaders',

    /**
     * A generic GridLayer that takes latitude longitude delta of cells as a uniform
     * and the min lat lng of cells. grid can be 3d when pass in a height
     * and set enable3d to true
     *
     * @param {array} props.data -
     * @param {boolean} props.extruded - enable grid elevation
     * @param {number} props.latOffset - grid cell size in lat delta
     * @param {number} props.lonOffset - grid cell size in lng delta
     * @param {function} props.getPosition - position accessor, returned as [minLng, minLat]
     * @param {function} props.getElevation - elevation accessor
     * @param {function} props.getColor - color accessor, returned as [r, g, b, a]
     */

    value: function getShaders() {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _gridCellLayerVertex4.default, fs: _gridCellLayerFragment2.default, modules: ['fp64', 'project64', 'lighting']
      } : {
        vs: _gridCellLayerVertex2.default, fs: _gridCellLayerFragment2.default, modules: ['lighting']
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
        instancePositions: { size: 4, accessor: ['getPosition', 'getElevation'], update: this.calculateInstancePositions },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
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
            instancePositions64xyLow: {
              size: 2,
              accessor: 'getPosition',
              update: this.calculateInstancePositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instancePositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(GridCellLayer.prototype.__proto__ || Object.getPrototypeOf(GridCellLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      // Re-generate model if geometry changed
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
      this.updateUniforms();
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      var geometry = new _luma.CubeGeometry({});
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: geometry,
        isInstanced: true
      });
    }
  }, {
    key: 'updateUniforms',
    value: function updateUniforms() {
      var _props = this.props,
          opacity = _props.opacity,
          extruded = _props.extruded,
          elevationScale = _props.elevationScale,
          latOffset = _props.latOffset,
          lonOffset = _props.lonOffset,
          lightSettings = _props.lightSettings;


      this.setUniforms(Object.assign({}, {
        extruded: extruded,
        elevationScale: elevationScale,
        opacity: opacity,
        latOffset: latOffset,
        lonOffset: lonOffset
      }, lightSettings));
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;

      _get(GridCellLayer.prototype.__proto__ || Object.getPrototypeOf(GridCellLayer.prototype), 'draw', this).call(this, { uniforms: Object.assign({}, uniforms) });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition,
          getElevation = _props2.getElevation;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var position = getPosition(object);
          var elevation = getElevation(object) || 0;
          value[i + 0] = position[0];
          value[i + 1] = position[1];
          value[i + 2] = 0;
          value[i + 3] = elevation;
          i += size;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'calculateInstancePositions64xyLow',
    value: function calculateInstancePositions64xyLow(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getPosition = _props3.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;

          var position = getPosition(point);
          value[i++] = (0, _fp.fp64ify)(position[0])[1];
          value[i++] = (0, _fp.fp64ify)(position[1])[1];
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getColor(object) || DEFAULT_COLOR;
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = Number.isFinite(color[3]) ? color[3] : DEFAULT_COLOR[3];
          i += size;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }]);

  return GridCellLayer;
}(_lib.Layer);

exports.default = GridCellLayer;


GridCellLayer.layerName = 'GridCellLayer';
GridCellLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9ncmlkLWNlbGwtbGF5ZXIvZ3JpZC1jZWxsLWxheWVyLmpzIl0sIm5hbWVzIjpbIkRFRkFVTFRfQ09MT1IiLCJkZWZhdWx0UHJvcHMiLCJjZWxsU2l6ZSIsImxvbk9mZnNldCIsImxhdE9mZnNldCIsImVsZXZhdGlvblNjYWxlIiwiZXh0cnVkZWQiLCJmcDY0IiwiZ2V0UG9zaXRpb24iLCJ4IiwicG9zaXRpb24iLCJnZXRFbGV2YXRpb24iLCJlbGV2YXRpb24iLCJnZXRDb2xvciIsImNvbG9yIiwibGlnaHRTZXR0aW5ncyIsImxpZ2h0c1Bvc2l0aW9uIiwiYW1iaWVudFJhdGlvIiwiZGlmZnVzZVJhdGlvIiwic3BlY3VsYXJSYXRpbyIsImxpZ2h0c1N0cmVuZ3RoIiwibnVtYmVyT2ZMaWdodHMiLCJHcmlkQ2VsbExheWVyIiwicHJvcHMiLCJ2cyIsImZzIiwibW9kdWxlcyIsImdsIiwiY29udGV4dCIsInNldFN0YXRlIiwibW9kZWwiLCJfZ2V0TW9kZWwiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBvc2l0aW9ucyIsInNpemUiLCJhY2Nlc3NvciIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zIiwiaW5zdGFuY2VDb2xvcnMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImludmFsaWRhdGVBbGwiLCJwcm9qZWN0aW9uTW9kZSIsIkxOR19MQVQiLCJpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJyZW1vdmUiLCJ1cGRhdGVBdHRyaWJ1dGUiLCJ1cGRhdGVVbmlmb3JtcyIsImdlb21ldHJ5Iiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJpZCIsImlzSW5zdGFuY2VkIiwib3BhY2l0eSIsInNldFVuaWZvcm1zIiwiT2JqZWN0IiwiYXNzaWduIiwidW5pZm9ybXMiLCJhdHRyaWJ1dGUiLCJkYXRhIiwidmFsdWUiLCJpIiwib2JqZWN0IiwicG9pbnQiLCJOdW1iZXIiLCJpc0Zpbml0ZSIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVlBLElBQU1BLGdCQUFnQixDQUFDLEdBQUQsRUFBTSxDQUFOLEVBQVMsR0FBVCxFQUFjLEdBQWQsQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsWUFBVSxJQURTO0FBRW5CO0FBQ0FDLGFBQVcsTUFIUTtBQUluQkMsYUFBVyxNQUpROztBQU1uQkMsa0JBQWdCLENBTkc7QUFPbkJDLFlBQVUsSUFQUztBQVFuQkMsUUFBTSxLQVJhOztBQVVuQkMsZUFBYTtBQUFBLFdBQUtDLEVBQUVDLFFBQVA7QUFBQSxHQVZNO0FBV25CQyxnQkFBYztBQUFBLFdBQUtGLEVBQUVHLFNBQVA7QUFBQSxHQVhLO0FBWW5CQyxZQUFVO0FBQUEsV0FBS0osRUFBRUssS0FBUDtBQUFBLEdBWlM7O0FBY25CQyxpQkFBZTtBQUNiQyxvQkFBZ0IsQ0FBQyxDQUFDLE1BQUYsRUFBVSxLQUFWLEVBQWlCLElBQWpCLEVBQXVCLENBQUMsTUFBeEIsRUFBZ0MsS0FBaEMsRUFBdUMsSUFBdkMsQ0FESDtBQUViQyxrQkFBYyxHQUZEO0FBR2JDLGtCQUFjLEdBSEQ7QUFJYkMsbUJBQWUsR0FKRjtBQUtiQyxvQkFBZ0IsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsRUFBZ0IsR0FBaEIsQ0FMSDtBQU1iQyxvQkFBZ0I7QUFOSDtBQWRJLENBQXJCOztJQXdCcUJDLGE7Ozs7Ozs7Ozs7OztBQUNu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NUIsSUFGbUI7O0FBR2pDLFVBQUkrQixJQUFJLENBQVI7QUFIaUM7QUFBQTtBQUFBOztBQUFBO0FBSWpDLDhCQUFxQkYsSUFBckIsbUlBQTJCO0FBQUEsY0FBaEJHLE1BQWdCOztBQUN6QixjQUFNdEQsUUFBUUQsU0FBU3VELE1BQVQsS0FBb0JwRSxhQUFsQztBQUNBa0UsZ0JBQU1DLElBQUksQ0FBVixJQUFlckQsTUFBTSxDQUFOLENBQWY7QUFDQW9ELGdCQUFNQyxJQUFJLENBQVYsSUFBZXJELE1BQU0sQ0FBTixDQUFmO0FBQ0FvRCxnQkFBTUMsSUFBSSxDQUFWLElBQWVyRCxNQUFNLENBQU4sQ0FBZjtBQUNBb0QsZ0JBQU1DLElBQUksQ0FBVixJQUFlRyxPQUFPQyxRQUFQLENBQWdCekQsTUFBTSxDQUFOLENBQWhCLElBQTRCQSxNQUFNLENBQU4sQ0FBNUIsR0FBdUNkLGNBQWMsQ0FBZCxDQUF0RDtBQUNBbUUsZUFBSy9CLElBQUw7QUFDRDtBQVhnQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWWxDOzs7Ozs7a0JBMUlrQmQsYTs7O0FBNklyQkEsY0FBY2tELFNBQWQsR0FBMEIsZUFBMUI7QUFDQWxELGNBQWNyQixZQUFkLEdBQTZCQSxZQUE3QiIsImZpbGUiOiJncmlkLWNlbGwtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTYgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IHthc3NlbWJsZVNoYWRlcnN9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgQ3ViZUdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7ZnA2NGlmeSwgZW5hYmxlNjRiaXRTdXBwb3J0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNfSBmcm9tICcuLi8uLi8uLi9saWInO1xuXG5pbXBvcnQgZ3JpZENlbGxWZXJ0ZXggZnJvbSAnLi9ncmlkLWNlbGwtbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IGdyaWRDZWxsVmVydGV4NjQgZnJvbSAnLi9ncmlkLWNlbGwtbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGdyaWRDZWxsRnJhZ21lbnQgZnJvbSAnLi9ncmlkLWNlbGwtbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMjU1LCAwLCAyNTUsIDI1NV07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgY2VsbFNpemU6IDEwMDAsXG4gIC8vIEFVRElUIC0gcmVwbGFjZSB3aXRoIGNlbGxzaXplXG4gIGxvbk9mZnNldDogMC4wMTEzLFxuICBsYXRPZmZzZXQ6IDAuMDA4OSxcblxuICBlbGV2YXRpb25TY2FsZTogMSxcbiAgZXh0cnVkZWQ6IHRydWUsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIGdldFBvc2l0aW9uOiB4ID0+IHgucG9zaXRpb24sXG4gIGdldEVsZXZhdGlvbjogeCA9PiB4LmVsZXZhdGlvbixcbiAgZ2V0Q29sb3I6IHggPT4geC5jb2xvcixcblxuICBsaWdodFNldHRpbmdzOiB7XG4gICAgbGlnaHRzUG9zaXRpb246IFstMTIyLjQ1LCAzNy42NSwgODAwMCwgLTEyMi40NSwgMzcuMjAsIDEwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC40LFxuICAgIGRpZmZ1c2VSYXRpbzogMC42LFxuICAgIHNwZWN1bGFyUmF0aW86IDAuOCxcbiAgICBsaWdodHNTdHJlbmd0aDogWzEuMCwgMC4wLCAwLjgsIDAuMF0sXG4gICAgbnVtYmVyT2ZMaWdodHM6IDJcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3JpZENlbGxMYXllciBleHRlbmRzIExheWVyIHtcbiAgLyoqXG4gICAqIEEgZ2VuZXJpYyBHcmlkTGF5ZXIgdGhhdCB0YWtlcyBsYXRpdHVkZSBsb25naXR1ZGUgZGVsdGEgb2YgY2VsbHMgYXMgYSB1bmlmb3JtXG4gICAqIGFuZCB0aGUgbWluIGxhdCBsbmcgb2YgY2VsbHMuIGdyaWQgY2FuIGJlIDNkIHdoZW4gcGFzcyBpbiBhIGhlaWdodFxuICAgKiBhbmQgc2V0IGVuYWJsZTNkIHRvIHRydWVcbiAgICpcbiAgICogQHBhcmFtIHthcnJheX0gcHJvcHMuZGF0YSAtXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcHJvcHMuZXh0cnVkZWQgLSBlbmFibGUgZ3JpZCBlbGV2YXRpb25cbiAgICogQHBhcmFtIHtudW1iZXJ9IHByb3BzLmxhdE9mZnNldCAtIGdyaWQgY2VsbCBzaXplIGluIGxhdCBkZWx0YVxuICAgKiBAcGFyYW0ge251bWJlcn0gcHJvcHMubG9uT2Zmc2V0IC0gZ3JpZCBjZWxsIHNpemUgaW4gbG5nIGRlbHRhXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb3BzLmdldFBvc2l0aW9uIC0gcG9zaXRpb24gYWNjZXNzb3IsIHJldHVybmVkIGFzIFttaW5MbmcsIG1pbkxhdF1cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvcHMuZ2V0RWxldmF0aW9uIC0gZWxldmF0aW9uIGFjY2Vzc29yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb3BzLmdldENvbG9yIC0gY29sb3IgYWNjZXNzb3IsIHJldHVybmVkIGFzIFtyLCBnLCBiLCBhXVxuICAgKi9cblxuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcykgPyB7XG4gICAgICB2czogZ3JpZENlbGxWZXJ0ZXg2NCwgZnM6IGdyaWRDZWxsRnJhZ21lbnQsIG1vZHVsZXM6IFsnZnA2NCcsICdwcm9qZWN0NjQnLCAnbGlnaHRpbmcnXVxuICAgIH0gOiB7XG4gICAgICB2czogZ3JpZENlbGxWZXJ0ZXgsIGZzOiBncmlkQ2VsbEZyYWdtZW50LCBtb2R1bGVzOiBbJ2xpZ2h0aW5nJ11cbiAgICB9O1xuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM6IHtzaXplOiA0LCBhY2Nlc3NvcjogWydnZXRQb3NpdGlvbicsICdnZXRFbGV2YXRpb24nXSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zfSxcbiAgICAgIGluc3RhbmNlQ29sb3JzOiB7c2l6ZTogNCwgdHlwZTogR0wuVU5TSUdORURfQllURSwgYWNjZXNzb3I6ICdnZXRDb2xvcicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yc31cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuXG4gICAgICBpZiAocHJvcHMuZnA2NCAmJiBwcm9wcy5wcm9qZWN0aW9uTW9kZSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HX0xBVCkge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICAgICAgaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93OiB7XG4gICAgICAgICAgICBzaXplOiAyLFxuICAgICAgICAgICAgYWNjZXNzb3I6ICdnZXRQb3NpdGlvbicsXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFtcbiAgICAgICAgICAnaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93J1xuICAgICAgICBdKTtcbiAgICAgIH1cblxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIHN1cGVyLnVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG4gICAgLy8gUmUtZ2VuZXJhdGUgbW9kZWwgaWYgZ2VvbWV0cnkgY2hhbmdlZFxuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIHRoaXMudXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IGdlb21ldHJ5ID0gbmV3IEN1YmVHZW9tZXRyeSh7fSk7XG4gICAgY29uc3Qgc2hhZGVycyA9IGFzc2VtYmxlU2hhZGVycyhnbCwgdGhpcy5nZXRTaGFkZXJzKCkpO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgICBnbCxcbiAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgdnM6IHNoYWRlcnMudnMsXG4gICAgICBmczogc2hhZGVycy5mcyxcbiAgICAgIGdlb21ldHJ5LFxuICAgICAgaXNJbnN0YW5jZWQ6IHRydWVcbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZVVuaWZvcm1zKCkge1xuICAgIGNvbnN0IHtvcGFjaXR5LCBleHRydWRlZCwgZWxldmF0aW9uU2NhbGUsIGxhdE9mZnNldCwgbG9uT2Zmc2V0LCBsaWdodFNldHRpbmdzfSA9IHRoaXMucHJvcHM7XG5cbiAgICB0aGlzLnNldFVuaWZvcm1zKE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIGV4dHJ1ZGVkLFxuICAgICAgZWxldmF0aW9uU2NhbGUsXG4gICAgICBvcGFjaXR5LFxuICAgICAgbGF0T2Zmc2V0LFxuICAgICAgbG9uT2Zmc2V0XG4gICAgfSxcbiAgICBsaWdodFNldHRpbmdzKSk7XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBzdXBlci5kcmF3KHt1bmlmb3JtczogT2JqZWN0LmFzc2lnbih7fSwgdW5pZm9ybXMpfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UG9zaXRpb24sIGdldEVsZXZhdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0UG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIGNvbnN0IGVsZXZhdGlvbiA9IGdldEVsZXZhdGlvbihvYmplY3QpIHx8IDA7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBwb3NpdGlvblswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IHBvc2l0aW9uWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gMDtcbiAgICAgIHZhbHVlW2kgKyAzXSA9IGVsZXZhdGlvbjtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3coYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzBdKVsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzFdKVsxXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCkgfHwgREVGQVVMVF9DT0xPUjtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IGNvbG9yWzBdO1xuICAgICAgdmFsdWVbaSArIDFdID0gY29sb3JbMV07XG4gICAgICB2YWx1ZVtpICsgMl0gPSBjb2xvclsyXTtcbiAgICAgIHZhbHVlW2kgKyAzXSA9IE51bWJlci5pc0Zpbml0ZShjb2xvclszXSkgPyBjb2xvclszXSA6IERFRkFVTFRfQ09MT1JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG59XG5cbkdyaWRDZWxsTGF5ZXIubGF5ZXJOYW1lID0gJ0dyaWRDZWxsTGF5ZXInO1xuR3JpZENlbGxMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _fp = require('../../../lib/utils/fp64');

var _iconLayerVertex = require('./icon-layer-vertex.glsl');

var _iconLayerVertex2 = _interopRequireDefault(_iconLayerVertex);

var _iconLayerVertex3 = require('./icon-layer-vertex-64.glsl');

var _iconLayerVertex4 = _interopRequireDefault(_iconLayerVertex3);

var _iconLayerFragment = require('./icon-layer-fragment.glsl');

var _iconLayerFragment2 = _interopRequireDefault(_iconLayerFragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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


var DEFAULT_COLOR = [0, 0, 0, 255];

/*
 * @param {object} props
 * @param {Texture2D | string} props.iconAtlas - atlas image url or texture
 * @param {object} props.iconMapping - icon names mapped to icon definitions
 * @param {object} props.iconMapping[icon_name].x - x position of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].y - y position of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].width - width of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].height - height of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].anchorX - x anchor of icon on the atlas image,
 *   default to width / 2
 * @param {object} props.iconMapping[icon_name].anchorY - y anchor of icon on the atlas image,
 *   default to height / 2
 * @param {object} props.iconMapping[icon_name].mask - whether icon is treated as a transparency
 *   mask. If true, user defined color is applied. If false, original color from the image is
 *   applied. Default to false.
 * @param {number} props.size - icon size in pixels
 * @param {func} props.getPosition - returns anchor position of the icon, in [lng, lat, z]
 * @param {func} props.getIcon - returns icon name as a string
 * @param {func} props.getSize - returns icon size multiplier as a number
 * @param {func} props.getColor - returns color of the icon in [r, g, b, a]. Only works on icons
 *   with mask: true.
 */
var defaultProps = {
  iconAtlas: null,
  iconMapping: {},
  sizeScale: 1,
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getIcon: function getIcon(x) {
    return x.icon;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  },
  getSize: function getSize(x) {
    return x.size || 1;
  }
};

var IconLayer = function (_Layer) {
  _inherits(IconLayer, _Layer);

  function IconLayer() {
    _classCallCheck(this, IconLayer);

    return _possibleConstructorReturn(this, (IconLayer.__proto__ || Object.getPrototypeOf(IconLayer)).apply(this, arguments));
  }

  _createClass(IconLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.state.attributeManager;

      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instancePositions: { size: 3, accessor: 'getPosition', update: this.calculateInstancePositions },
        instanceSizes: { size: 1, accessor: 'getSize', update: this.calculateInstanceSizes },
        instanceOffsets: { size: 2, accessor: 'getIcon', update: this.calculateInstanceOffsets },
        instanceIconFrames: { size: 4, accessor: 'getIcon', update: this.calculateInstanceIconFrames },
        instanceColorModes: { size: 1, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getIcon', update: this.calculateInstanceColorMode },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */

      var gl = this.context.gl;

      this.setState({ model: this._getModel(gl) });
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
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;

      _get(IconLayer.prototype.__proto__ || Object.getPrototypeOf(IconLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

      var iconAtlas = props.iconAtlas;


      if (oldProps.iconAtlas !== iconAtlas) {
        var icons = {};
        this.state.icons = icons;

        if (iconAtlas instanceof _luma.Texture2D) {
          icons.texture = iconAtlas;
        } else if (typeof iconAtlas === 'string') {
          (0, _luma.loadTextures)(this.context.gl, {
            urls: [iconAtlas]
          }).then(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 1),
                texture = _ref4[0];

            icons.texture = texture;
          });
        }
      }

      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'draw',
    value: function draw(_ref5) {
      var uniforms = _ref5.uniforms;
      var sizeScale = this.props.sizeScale;

      var iconsTexture = this.state.icons && this.state.icons.texture;

      if (iconsTexture) {
        this.state.model.render(Object.assign({}, uniforms, {
          iconsTexture: iconsTexture,
          iconsTextureDim: [iconsTexture.width, iconsTexture.height],
          sizeScale: sizeScale
        }));
      }
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _iconLayerVertex4.default, fs: _iconLayerFragment2.default, modules: ['fp64', 'project64']
      } : {
        vs: _iconLayerVertex2.default, fs: _iconLayerFragment2.default, modules: []
      };
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      var positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          positions: new Float32Array(positions)
        }),
        isInstanced: true
      });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getPosition = _props.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var position = getPosition(object);
          value[i++] = position[0];
          value[i++] = position[1];
          value[i++] = position[2] || 0;
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
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition;
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
    key: 'calculateInstanceSizes',
    value: function calculateInstanceSizes(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getSize = _props3.getSize;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          value[i++] = getSize(object);
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
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          var color = getColor(object);

          value[i++] = color[0];
          value[i++] = color[1];
          value[i++] = color[2];
          value[i++] = isNaN(color[3]) ? 255 : color[3];
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceOffsets',
    value: function calculateInstanceOffsets(attribute) {
      var _props5 = this.props,
          data = _props5.data,
          iconMapping = _props5.iconMapping,
          getIcon = _props5.getIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = data[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var object = _step5.value;

          var icon = getIcon(object);
          var rect = iconMapping[icon] || {};
          value[i++] = 1 / 2 - rect.anchorX / rect.width || 0;
          value[i++] = 1 / 2 - rect.anchorY / rect.height || 0;
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceColorMode',
    value: function calculateInstanceColorMode(attribute) {
      var _props6 = this.props,
          data = _props6.data,
          iconMapping = _props6.iconMapping,
          getIcon = _props6.getIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = data[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var object = _step6.value;

          var icon = getIcon(object);
          var colorMode = iconMapping[icon] && iconMapping[icon].mask;
          value[i++] = colorMode ? 1 : 0;
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceIconFrames',
    value: function calculateInstanceIconFrames(attribute) {
      var _props7 = this.props,
          data = _props7.data,
          iconMapping = _props7.iconMapping,
          getIcon = _props7.getIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = data[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var object = _step7.value;

          var icon = getIcon(object);
          var rect = iconMapping[icon] || {};
          value[i++] = rect.x || 0;
          value[i++] = rect.y || 0;
          value[i++] = rect.width || 0;
          value[i++] = rect.height || 0;
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }]);

  return IconLayer;
}(_lib.Layer);

exports.default = IconLayer;


IconLayer.layerName = 'IconLayer';
IconLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9pY29uLWxheWVyL2ljb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImljb25BdGxhcyIsImljb25NYXBwaW5nIiwic2l6ZVNjYWxlIiwiZnA2NCIsImdldFBvc2l0aW9uIiwieCIsInBvc2l0aW9uIiwiZ2V0SWNvbiIsImljb24iLCJnZXRDb2xvciIsImNvbG9yIiwiZ2V0U2l6ZSIsInNpemUiLCJJY29uTGF5ZXIiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBvc2l0aW9ucyIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZVNpemVzIiwiY2FsY3VsYXRlSW5zdGFuY2VTaXplcyIsImluc3RhbmNlT2Zmc2V0cyIsImNhbGN1bGF0ZUluc3RhbmNlT2Zmc2V0cyIsImluc3RhbmNlSWNvbkZyYW1lcyIsImNhbGN1bGF0ZUluc3RhbmNlSWNvbkZyYW1lcyIsImluc3RhbmNlQ29sb3JNb2RlcyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VDb2xvck1vZGUiLCJpbnN0YW5jZUNvbG9ycyIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsInByb3BzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImludmFsaWRhdGVBbGwiLCJwcm9qZWN0aW9uTW9kZSIsIkxOR19MQVQiLCJpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJyZW1vdmUiLCJpY29ucyIsInRleHR1cmUiLCJ1cmxzIiwidGhlbiIsInVwZGF0ZUF0dHJpYnV0ZSIsInVuaWZvcm1zIiwiaWNvbnNUZXh0dXJlIiwicmVuZGVyIiwiT2JqZWN0IiwiYXNzaWduIiwiaWNvbnNUZXh0dXJlRGltIiwid2lkdGgiLCJoZWlnaHQiLCJ2cyIsImZzIiwibW9kdWxlcyIsInBvc2l0aW9ucyIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVfRkFOIiwiRmxvYXQzMkFycmF5IiwiaXNJbnN0YW5jZWQiLCJhdHRyaWJ1dGUiLCJkYXRhIiwidmFsdWUiLCJpIiwib2JqZWN0IiwicG9pbnQiLCJpc05hTiIsInJlY3QiLCJhbmNob3JYIiwiYW5jaG9yWSIsImNvbG9yTW9kZSIsIm1hc2siLCJ5IiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7OytlQTNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBV0EsSUFBTUEsZ0JBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsR0FBVixDQUF0Qjs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCQSxJQUFNQyxlQUFlO0FBQ25CQyxhQUFXLElBRFE7QUFFbkJDLGVBQWEsRUFGTTtBQUduQkMsYUFBVyxDQUhRO0FBSW5CQyxRQUFNLEtBSmE7O0FBTW5CQyxlQUFhO0FBQUEsV0FBS0MsRUFBRUMsUUFBUDtBQUFBLEdBTk07QUFPbkJDLFdBQVM7QUFBQSxXQUFLRixFQUFFRyxJQUFQO0FBQUEsR0FQVTtBQVFuQkMsWUFBVTtBQUFBLFdBQUtKLEVBQUVLLEtBQUYsSUFBV1osYUFBaEI7QUFBQSxHQVJTO0FBU25CYSxXQUFTO0FBQUEsV0FBS04sRUFBRU8sSUFBRixJQUFVLENBQWY7QUFBQTtBQVRVLENBQXJCOztJQVlxQkMsUzs7Ozs7Ozs7Ozs7c0NBQ0Q7QUFBQSxVQUNUQyxnQkFE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RixJQUFyQixtSUFBMkI7QUFBQSxjQUFoQkcsTUFBZ0I7O0FBQ3pCLGNBQU1wRSxPQUFPRCxRQUFRcUUsTUFBUixDQUFiO0FBQ0EsY0FBTUcsT0FBTzlFLFlBQVlPLElBQVosS0FBcUIsRUFBbEM7QUFDQWtFLGdCQUFNQyxHQUFOLElBQWFJLEtBQUsxRSxDQUFMLElBQVUsQ0FBdkI7QUFDQXFFLGdCQUFNQyxHQUFOLElBQWFJLEtBQUtLLENBQUwsSUFBVSxDQUF2QjtBQUNBVixnQkFBTUMsR0FBTixJQUFhSSxLQUFLckIsS0FBTCxJQUFjLENBQTNCO0FBQ0FnQixnQkFBTUMsR0FBTixJQUFhSSxLQUFLcEIsTUFBTCxJQUFlLENBQTVCO0FBQ0Q7QUFYb0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVl0Qzs7Ozs7O2tCQTlMa0I5QyxTOzs7QUFpTXJCQSxVQUFVd0UsU0FBVixHQUFzQixXQUF0QjtBQUNBeEUsVUFBVWQsWUFBVixHQUF5QkEsWUFBekIiLCJmaWxlIjoiaWNvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IHthc3NlbWJsZVNoYWRlcnN9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnksIFRleHR1cmUyRCwgbG9hZFRleHR1cmVzfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7ZnA2NGlmeSwgZW5hYmxlNjRiaXRTdXBwb3J0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvZnA2NCc7XG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNfSBmcm9tICcuLi8uLi8uLi9saWInO1xuXG5pbXBvcnQgaWNvblZlcnRleCBmcm9tICcuL2ljb24tbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IGljb25WZXJ0ZXg2NCBmcm9tICcuL2ljb24tbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGljb25GcmFnbWVudCBmcm9tICcuL2ljb24tbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTtcblxuLypcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wc1xuICogQHBhcmFtIHtUZXh0dXJlMkQgfCBzdHJpbmd9IHByb3BzLmljb25BdGxhcyAtIGF0bGFzIGltYWdlIHVybCBvciB0ZXh0dXJlXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMuaWNvbk1hcHBpbmcgLSBpY29uIG5hbWVzIG1hcHBlZCB0byBpY29uIGRlZmluaXRpb25zXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMuaWNvbk1hcHBpbmdbaWNvbl9uYW1lXS54IC0geCBwb3NpdGlvbiBvZiBpY29uIG9uIHRoZSBhdGxhcyBpbWFnZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nW2ljb25fbmFtZV0ueSAtIHkgcG9zaXRpb24gb2YgaWNvbiBvbiB0aGUgYXRsYXMgaW1hZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLndpZHRoIC0gd2lkdGggb2YgaWNvbiBvbiB0aGUgYXRsYXMgaW1hZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLmhlaWdodCAtIGhlaWdodCBvZiBpY29uIG9uIHRoZSBhdGxhcyBpbWFnZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nW2ljb25fbmFtZV0uYW5jaG9yWCAtIHggYW5jaG9yIG9mIGljb24gb24gdGhlIGF0bGFzIGltYWdlLFxuICogICBkZWZhdWx0IHRvIHdpZHRoIC8gMlxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nW2ljb25fbmFtZV0uYW5jaG9yWSAtIHkgYW5jaG9yIG9mIGljb24gb24gdGhlIGF0bGFzIGltYWdlLFxuICogICBkZWZhdWx0IHRvIGhlaWdodCAvIDJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLm1hc2sgLSB3aGV0aGVyIGljb24gaXMgdHJlYXRlZCBhcyBhIHRyYW5zcGFyZW5jeVxuICogICBtYXNrLiBJZiB0cnVlLCB1c2VyIGRlZmluZWQgY29sb3IgaXMgYXBwbGllZC4gSWYgZmFsc2UsIG9yaWdpbmFsIGNvbG9yIGZyb20gdGhlIGltYWdlIGlzXG4gKiAgIGFwcGxpZWQuIERlZmF1bHQgdG8gZmFsc2UuXG4gKiBAcGFyYW0ge251bWJlcn0gcHJvcHMuc2l6ZSAtIGljb24gc2l6ZSBpbiBwaXhlbHNcbiAqIEBwYXJhbSB7ZnVuY30gcHJvcHMuZ2V0UG9zaXRpb24gLSByZXR1cm5zIGFuY2hvciBwb3NpdGlvbiBvZiB0aGUgaWNvbiwgaW4gW2xuZywgbGF0LCB6XVxuICogQHBhcmFtIHtmdW5jfSBwcm9wcy5nZXRJY29uIC0gcmV0dXJucyBpY29uIG5hbWUgYXMgYSBzdHJpbmdcbiAqIEBwYXJhbSB7ZnVuY30gcHJvcHMuZ2V0U2l6ZSAtIHJldHVybnMgaWNvbiBzaXplIG11bHRpcGxpZXIgYXMgYSBudW1iZXJcbiAqIEBwYXJhbSB7ZnVuY30gcHJvcHMuZ2V0Q29sb3IgLSByZXR1cm5zIGNvbG9yIG9mIHRoZSBpY29uIGluIFtyLCBnLCBiLCBhXS4gT25seSB3b3JrcyBvbiBpY29uc1xuICogICB3aXRoIG1hc2s6IHRydWUuXG4gKi9cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgaWNvbkF0bGFzOiBudWxsLFxuICBpY29uTWFwcGluZzoge30sXG4gIHNpemVTY2FsZTogMSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgZ2V0UG9zaXRpb246IHggPT4geC5wb3NpdGlvbixcbiAgZ2V0SWNvbjogeCA9PiB4Lmljb24sXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUixcbiAgZ2V0U2l6ZTogeCA9PiB4LnNpemUgfHwgMVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSWNvbkxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcblxuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge3NpemU6IDMsIGFjY2Vzc29yOiAnZ2V0UG9zaXRpb24nLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnN9LFxuICAgICAgaW5zdGFuY2VTaXplczoge3NpemU6IDEsIGFjY2Vzc29yOiAnZ2V0U2l6ZScsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVNpemVzfSxcbiAgICAgIGluc3RhbmNlT2Zmc2V0czoge3NpemU6IDIsIGFjY2Vzc29yOiAnZ2V0SWNvbicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZU9mZnNldHN9LFxuICAgICAgaW5zdGFuY2VJY29uRnJhbWVzOiB7c2l6ZTogNCwgYWNjZXNzb3I6ICdnZXRJY29uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlSWNvbkZyYW1lc30sXG4gICAgICBpbnN0YW5jZUNvbG9yTW9kZXM6IHtzaXplOiAxLCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldEljb24nLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvck1vZGV9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldENvbG9yJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuXG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG4gIH1cblxuICB1cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcblxuICAgICAgaWYgKHByb3BzLmZwNjQgJiYgcHJvcHMucHJvamVjdGlvbk1vZGUgPT09IENPT1JESU5BVEVfU1lTVEVNLkxOR19MQVQpIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgICAgIGluc3RhbmNlUG9zaXRpb25zNjR4eUxvdzoge1xuICAgICAgICAgICAgc2l6ZTogMixcbiAgICAgICAgICAgIGFjY2Vzc29yOiAnZ2V0UG9zaXRpb24nLFxuICAgICAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjR4eUxvd1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLnJlbW92ZShbXG4gICAgICAgICAgJ2luc3RhbmNlUG9zaXRpb25zNjR4eUxvdydcbiAgICAgICAgXSk7XG4gICAgICB9XG5cbiAgICB9XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuXG4gICAgY29uc3Qge2ljb25BdGxhc30gPSBwcm9wcztcblxuICAgIGlmIChvbGRQcm9wcy5pY29uQXRsYXMgIT09IGljb25BdGxhcykge1xuICAgICAgY29uc3QgaWNvbnMgPSB7fTtcbiAgICAgIHRoaXMuc3RhdGUuaWNvbnMgPSBpY29ucztcblxuICAgICAgaWYgKGljb25BdGxhcyBpbnN0YW5jZW9mIFRleHR1cmUyRCkge1xuICAgICAgICBpY29ucy50ZXh0dXJlID0gaWNvbkF0bGFzO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWNvbkF0bGFzID09PSAnc3RyaW5nJykge1xuICAgICAgICBsb2FkVGV4dHVyZXModGhpcy5jb250ZXh0LmdsLCB7XG4gICAgICAgICAgdXJsczogW2ljb25BdGxhc11cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKFt0ZXh0dXJlXSkgPT4ge1xuICAgICAgICAgIGljb25zLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcblxuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge3NpemVTY2FsZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IGljb25zVGV4dHVyZSA9IHRoaXMuc3RhdGUuaWNvbnMgJiYgdGhpcy5zdGF0ZS5pY29ucy50ZXh0dXJlO1xuXG4gICAgaWYgKGljb25zVGV4dHVyZSkge1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIoT2JqZWN0LmFzc2lnbih7fSwgdW5pZm9ybXMsIHtcbiAgICAgICAgaWNvbnNUZXh0dXJlLFxuICAgICAgICBpY29uc1RleHR1cmVEaW06IFtpY29uc1RleHR1cmUud2lkdGgsIGljb25zVGV4dHVyZS5oZWlnaHRdLFxuICAgICAgICBzaXplU2NhbGVcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcykgPyB7XG4gICAgICB2czogaWNvblZlcnRleDY0LCBmczogaWNvbkZyYWdtZW50LCBtb2R1bGVzOiBbJ2ZwNjQnLCAncHJvamVjdDY0J11cbiAgICB9IDoge1xuICAgICAgdnM6IGljb25WZXJ0ZXgsIGZzOiBpY29uRnJhZ21lbnQsIG1vZHVsZXM6IFtdXG4gICAgfTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFstMSwgLTEsIDAsIC0xLCAxLCAwLCAxLCAxLCAwLCAxLCAtMSwgMF07XG5cbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKHtcbiAgICAgIGdsLFxuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGZzOiBzaGFkZXJzLmZzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRV9GQU4sXG4gICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICB9KSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMl0gfHwgMDtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3coYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzBdKVsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzFdKVsxXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVNpemVzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTaXplfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgdmFsdWVbaSsrXSA9IGdldFNpemUob2JqZWN0KTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCk7XG5cbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsyXTtcbiAgICAgIHZhbHVlW2krK10gPSBpc05hTihjb2xvclszXSkgPyAyNTUgOiBjb2xvclszXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZU9mZnNldHMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGljb25NYXBwaW5nLCBnZXRJY29ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgaWNvbiA9IGdldEljb24ob2JqZWN0KTtcbiAgICAgIGNvbnN0IHJlY3QgPSBpY29uTWFwcGluZ1tpY29uXSB8fCB7fTtcbiAgICAgIHZhbHVlW2krK10gPSAoMSAvIDIgLSByZWN0LmFuY2hvclggLyByZWN0LndpZHRoKSB8fCAwO1xuICAgICAgdmFsdWVbaSsrXSA9ICgxIC8gMiAtIHJlY3QuYW5jaG9yWSAvIHJlY3QuaGVpZ2h0KSB8fCAwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JNb2RlKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBpY29uTWFwcGluZywgZ2V0SWNvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IGljb24gPSBnZXRJY29uKG9iamVjdCk7XG4gICAgICBjb25zdCBjb2xvck1vZGUgPSBpY29uTWFwcGluZ1tpY29uXSAmJiBpY29uTWFwcGluZ1tpY29uXS5tYXNrO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yTW9kZSA/IDEgOiAwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlSWNvbkZyYW1lcyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgaWNvbk1hcHBpbmcsIGdldEljb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBpY29uID0gZ2V0SWNvbihvYmplY3QpO1xuICAgICAgY29uc3QgcmVjdCA9IGljb25NYXBwaW5nW2ljb25dIHx8IHt9O1xuICAgICAgdmFsdWVbaSsrXSA9IHJlY3QueCB8fCAwO1xuICAgICAgdmFsdWVbaSsrXSA9IHJlY3QueSB8fCAwO1xuICAgICAgdmFsdWVbaSsrXSA9IHJlY3Qud2lkdGggfHwgMDtcbiAgICAgIHZhbHVlW2krK10gPSByZWN0LmhlaWdodCB8fCAwO1xuICAgIH1cbiAgfVxufVxuXG5JY29uTGF5ZXIubGF5ZXJOYW1lID0gJ0ljb25MYXllcic7XG5JY29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
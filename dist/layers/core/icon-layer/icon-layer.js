'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

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
 * @param {func} props.getScale - returns icon size multiplier as a number
 * @param {func} props.getColor - returns color of the icon in [r, g, b, a]. Only works on icons
 *   with mask: true.
 */
var defaultProps = {
  getPosition: function getPosition(x) {
    return x.position;
  },
  getIcon: function getIcon(x) {
    return x.icon;
  },
  getColor: function getColor(x) {
    return x.color;
  },
  getScale: function getScale(x) {
    return x.size;
  },
  iconAtlas: null,
  iconMapping: {},
  size: 30
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
        instanceSizes: { size: 1, accessor: 'getScale', update: this.calculateInstanceSizes },
        instanceOffsets: { size: 2, accessor: 'getIcon', update: this.calculateInstanceOffsets },
        instanceIconFrames: { size: 4, accessor: 'getIcon', update: this.calculateInstanceIconFrames },
        instanceColorModes: { size: 1, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getIcon', update: this.calculateInstanceColorMode },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */

      var gl = this.context.gl;

      this.setState({ model: this.getModel(gl) });
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var _this2 = this;

      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      var iconAtlas = props.iconAtlas;


      if (oldProps.iconAtlas !== iconAtlas) {
        (function () {
          var icons = {};
          _this2.state.icons = icons;

          if (iconAtlas instanceof _luma.Texture2D) {
            icons.texture = iconAtlas;
          } else if (typeof iconAtlas === 'string') {
            (0, _luma.loadTextures)(_this2.context.gl, {
              urls: [iconAtlas]
            }).then(function (_ref2) {
              var _ref3 = _slicedToArray(_ref2, 1),
                  texture = _ref3[0];

              icons.texture = texture;
            });
          }
        })();
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref4) {
      var uniforms = _ref4.uniforms;
      var _context = this.context,
          _context$viewport = _context.viewport,
          width = _context$viewport.width,
          height = _context$viewport.height,
          gl = _context.gl;
      var size = this.props.size;

      var iconsTexture = this.state.icons && this.state.icons.texture;

      if (iconsTexture) {
        // transparency doesn't work with DEPTH_TEST on
        // tradeoff being we cannot guarantee that foreground icons will be rendered on top
        gl.disable(gl.DEPTH_TEST);

        this.state.model.render(Object.assign({}, uniforms, {
          iconsTexture: iconsTexture,
          iconsTextureDim: [iconsTexture.width, iconsTexture.height],
          size: [size / width, -size / height]
        }));

        gl.enable(gl.DEPTH_TEST);
      }
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n#define SHADER_NAME icon-layer-vertex-shader\n\nattribute vec2 positions;\n\nattribute vec3 instancePositions;\nattribute float instanceSizes;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\nattribute vec4 instanceIconFrames;\nattribute float instanceColorModes;\nattribute vec2 instanceOffsets;\n\nuniform vec2 size;\n\nuniform float renderPickingBuffer;\nuniform vec2 iconsTextureDim;\n\nvarying float vColorMode;\nvarying vec4 vColor;\nvarying vec2 vTextureCoords;\n\nvoid main(void) {\n  vec3 center = project_position(instancePositions);\n  vec2 vertex = (positions + instanceOffsets * 2.0) * size * instanceSizes;\n  gl_Position = project_to_clipspace(vec4(center, 1.0)) + vec4(vertex, 0.0, 0.0);\n\n  vTextureCoords = mix(\n    instanceIconFrames.xy,\n    instanceIconFrames.xy + instanceIconFrames.zw,\n    (positions.xy + 1.0) / 2.0\n  ) / iconsTextureDim;\n\n  vTextureCoords.y = 1.0 - vTextureCoords.y;\n\n  vec4 color = instanceColors / 255.;\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n  vColor = mix(color, pickingColor, renderPickingBuffer);\n\n  vColorMode = instanceColorModes;\n}\n',
        fs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n#define SHADER_NAME scatterplot-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform float opacity;\nuniform float renderPickingBuffer;\nuniform sampler2D iconsTexture;\n\nvarying float vColorMode;\nvarying vec4 vColor;\nvarying vec2 vTextureCoords;\n\nvoid main(void) {\n  vec4 texColor = texture2D(iconsTexture, vTextureCoords);\n\n  // if colorMode == 0, use pixel color from the texture\n  // if colorMode == 1 or rendering picking buffer, use texture as transparency mask\n  vec3 color = mix(texColor.rgb, vColor.rgb,\n    max(vColorMode, renderPickingBuffer)\n  );\n  float a = texColor.a * opacity * mix(1.0, vColor.a, vColorMode);\n\n  // if rendering to screen, use mixed alpha\n  // if rendering picking buffer, use binary alpha\n  a = mix(a, step(0.1, a), renderPickingBuffer);\n\n  gl_FragColor = vec4(color, a);\n}\n'
      };
    }
  }, {
    key: 'getModel',
    value: function getModel(gl) {
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
    key: 'calculateInstanceSizes',
    value: function calculateInstanceSizes(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getScale = _props2.getScale;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var size = getScale(object);
          value[i++] = isNaN(size) ? 1 : size;
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
      var _props3 = this.props,
          data = _props3.data,
          getColor = _props3.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getColor(object) || DEFAULT_COLOR;

          value[i++] = color[0];
          value[i++] = color[1];
          value[i++] = color[2];
          value[i++] = isNaN(color[3]) ? DEFAULT_COLOR[3] : color[3];
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
    key: 'calculateInstanceOffsets',
    value: function calculateInstanceOffsets(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          iconMapping = _props4.iconMapping,
          getIcon = _props4.getIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          var icon = getIcon(object);
          var rect = iconMapping[icon] || {};
          value[i++] = 1 / 2 - rect.anchorX / rect.width || 0;
          value[i++] = 1 / 2 - rect.anchorY / rect.height || 0;
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
    key: 'calculateInstanceColorMode',
    value: function calculateInstanceColorMode(attribute) {
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
          var colorMode = iconMapping[icon] && iconMapping[icon].mask;
          value[i++] = colorMode ? 1 : 0;
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
    key: 'calculateInstanceIconFrames',
    value: function calculateInstanceIconFrames(attribute) {
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
          var rect = iconMapping[icon] || {};
          value[i++] = rect.x || 0;
          value[i++] = rect.y || 0;
          value[i++] = rect.width || 0;
          value[i++] = rect.height || 0;
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
  }]);

  return IconLayer;
}(_lib.Layer);

exports.default = IconLayer;


IconLayer.layerName = 'IconLayer';
IconLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9pY29uLWxheWVyL2ljb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImdldFBvc2l0aW9uIiwieCIsInBvc2l0aW9uIiwiZ2V0SWNvbiIsImljb24iLCJnZXRDb2xvciIsImNvbG9yIiwiZ2V0U2NhbGUiLCJzaXplIiwiaWNvbkF0bGFzIiwiaWNvbk1hcHBpbmciLCJJY29uTGF5ZXIiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBvc2l0aW9ucyIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZVNpemVzIiwiY2FsY3VsYXRlSW5zdGFuY2VTaXplcyIsImluc3RhbmNlT2Zmc2V0cyIsImNhbGN1bGF0ZUluc3RhbmNlT2Zmc2V0cyIsImluc3RhbmNlSWNvbkZyYW1lcyIsImNhbGN1bGF0ZUluc3RhbmNlSWNvbkZyYW1lcyIsImluc3RhbmNlQ29sb3JNb2RlcyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VDb2xvck1vZGUiLCJpbnN0YW5jZUNvbG9ycyIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsImdldE1vZGVsIiwib2xkUHJvcHMiLCJwcm9wcyIsImNoYW5nZUZsYWdzIiwiaWNvbnMiLCJ0ZXh0dXJlIiwidXJscyIsInRoZW4iLCJ1bmlmb3JtcyIsInZpZXdwb3J0Iiwid2lkdGgiLCJoZWlnaHQiLCJpY29uc1RleHR1cmUiLCJkaXNhYmxlIiwiREVQVEhfVEVTVCIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsImljb25zVGV4dHVyZURpbSIsImVuYWJsZSIsInZzIiwiZnMiLCJwb3NpdGlvbnMiLCJzaGFkZXJzIiwiZ2V0U2hhZGVycyIsImlkIiwiZ2VvbWV0cnkiLCJkcmF3TW9kZSIsIlRSSUFOR0xFX0ZBTiIsIkZsb2F0MzJBcnJheSIsImlzSW5zdGFuY2VkIiwiYXR0cmlidXRlIiwiZGF0YSIsInZhbHVlIiwiaSIsIm9iamVjdCIsImlzTmFOIiwicmVjdCIsImFuY2hvclgiLCJhbmNob3JZIiwiY29sb3JNb2RlIiwibWFzayIsInkiLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7OzsrZUF2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQU9BLElBQU1BLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEI7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkEsSUFBTUMsZUFBZTtBQUNuQkMsZUFBYTtBQUFBLFdBQUtDLEVBQUVDLFFBQVA7QUFBQSxHQURNO0FBRW5CQyxXQUFTO0FBQUEsV0FBS0YsRUFBRUcsSUFBUDtBQUFBLEdBRlU7QUFHbkJDLFlBQVU7QUFBQSxXQUFLSixFQUFFSyxLQUFQO0FBQUEsR0FIUztBQUluQkMsWUFBVTtBQUFBLFdBQUtOLEVBQUVPLElBQVA7QUFBQSxHQUpTO0FBS25CQyxhQUFXLElBTFE7QUFNbkJDLGVBQWEsRUFOTTtBQU9uQkYsUUFBTTtBQVBhLENBQXJCOztJQVVxQkcsUzs7Ozs7Ozs7Ozs7c0NBQ0Q7QUFBQSxVQUNUQyxnQkFEUyxHQUNXLEtBQUtDLEtBRGhCLENBQ1RELGdCQURTO0FBRWhCOztBQUNBQSx1QkFBaUJFLFlBQWpCLENBQThCO0FBQzVCQywyQkFBbUIsRUFBQ1AsTUFBTSxDQUFQLEVBQVVRLFVBQVUsYUFBcEIsRUFBbUNDLFFBQVEsS0FBS0MsMEJBQWhELEVBRFM7QUFFNUJDLHVCQUFlLEVBQUNYLE1BQU0sQ0FBUCxFQUFVUSxVQUFVLFVBQXBCLEVBQWdDQyxR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O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWXRDOzs7Ozs7a0JBMUprQm5DLFM7OztBQTZKckJBLFVBQVVtRSxTQUFWLEdBQXNCLFdBQXRCO0FBQ0FuRSxVQUFVWixZQUFWLEdBQXlCQSxZQUF6QiIsImZpbGUiOiJpY29uLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7R0wsIE1vZGVsLCBHZW9tZXRyeSwgVGV4dHVyZTJELCBsb2FkVGV4dHVyZXN9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTtcblxuLypcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wc1xuICogQHBhcmFtIHtUZXh0dXJlMkQgfCBzdHJpbmd9IHByb3BzLmljb25BdGxhcyAtIGF0bGFzIGltYWdlIHVybCBvciB0ZXh0dXJlXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMuaWNvbk1hcHBpbmcgLSBpY29uIG5hbWVzIG1hcHBlZCB0byBpY29uIGRlZmluaXRpb25zXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMuaWNvbk1hcHBpbmdbaWNvbl9uYW1lXS54IC0geCBwb3NpdGlvbiBvZiBpY29uIG9uIHRoZSBhdGxhcyBpbWFnZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nW2ljb25fbmFtZV0ueSAtIHkgcG9zaXRpb24gb2YgaWNvbiBvbiB0aGUgYXRsYXMgaW1hZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLndpZHRoIC0gd2lkdGggb2YgaWNvbiBvbiB0aGUgYXRsYXMgaW1hZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLmhlaWdodCAtIGhlaWdodCBvZiBpY29uIG9uIHRoZSBhdGxhcyBpbWFnZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nW2ljb25fbmFtZV0uYW5jaG9yWCAtIHggYW5jaG9yIG9mIGljb24gb24gdGhlIGF0bGFzIGltYWdlLFxuICogICBkZWZhdWx0IHRvIHdpZHRoIC8gMlxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nW2ljb25fbmFtZV0uYW5jaG9yWSAtIHkgYW5jaG9yIG9mIGljb24gb24gdGhlIGF0bGFzIGltYWdlLFxuICogICBkZWZhdWx0IHRvIGhlaWdodCAvIDJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLm1hc2sgLSB3aGV0aGVyIGljb24gaXMgdHJlYXRlZCBhcyBhIHRyYW5zcGFyZW5jeVxuICogICBtYXNrLiBJZiB0cnVlLCB1c2VyIGRlZmluZWQgY29sb3IgaXMgYXBwbGllZC4gSWYgZmFsc2UsIG9yaWdpbmFsIGNvbG9yIGZyb20gdGhlIGltYWdlIGlzXG4gKiAgIGFwcGxpZWQuIERlZmF1bHQgdG8gZmFsc2UuXG4gKiBAcGFyYW0ge251bWJlcn0gcHJvcHMuc2l6ZSAtIGljb24gc2l6ZSBpbiBwaXhlbHNcbiAqIEBwYXJhbSB7ZnVuY30gcHJvcHMuZ2V0UG9zaXRpb24gLSByZXR1cm5zIGFuY2hvciBwb3NpdGlvbiBvZiB0aGUgaWNvbiwgaW4gW2xuZywgbGF0LCB6XVxuICogQHBhcmFtIHtmdW5jfSBwcm9wcy5nZXRJY29uIC0gcmV0dXJucyBpY29uIG5hbWUgYXMgYSBzdHJpbmdcbiAqIEBwYXJhbSB7ZnVuY30gcHJvcHMuZ2V0U2NhbGUgLSByZXR1cm5zIGljb24gc2l6ZSBtdWx0aXBsaWVyIGFzIGEgbnVtYmVyXG4gKiBAcGFyYW0ge2Z1bmN9IHByb3BzLmdldENvbG9yIC0gcmV0dXJucyBjb2xvciBvZiB0aGUgaWNvbiBpbiBbciwgZywgYiwgYV0uIE9ubHkgd29ya3Mgb24gaWNvbnNcbiAqICAgd2l0aCBtYXNrOiB0cnVlLlxuICovXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIGdldFBvc2l0aW9uOiB4ID0+IHgucG9zaXRpb24sXG4gIGdldEljb246IHggPT4geC5pY29uLFxuICBnZXRDb2xvcjogeCA9PiB4LmNvbG9yLFxuICBnZXRTY2FsZTogeCA9PiB4LnNpemUsXG4gIGljb25BdGxhczogbnVsbCxcbiAgaWNvbk1hcHBpbmc6IHt9LFxuICBzaXplOiAzMFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSWNvbkxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM6IHtzaXplOiAzLCBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zfSxcbiAgICAgIGluc3RhbmNlU2l6ZXM6IHtzaXplOiAxLCBhY2Nlc3NvcjogJ2dldFNjYWxlJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlU2l6ZXN9LFxuICAgICAgaW5zdGFuY2VPZmZzZXRzOiB7c2l6ZTogMiwgYWNjZXNzb3I6ICdnZXRJY29uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlT2Zmc2V0c30sXG4gICAgICBpbnN0YW5jZUljb25GcmFtZXM6IHtzaXplOiA0LCBhY2Nlc3NvcjogJ2dldEljb24nLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VJY29uRnJhbWVzfSxcbiAgICAgIGluc3RhbmNlQ29sb3JNb2Rlczoge3NpemU6IDEsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0SWNvbicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yTW9kZX0sXG4gICAgICBpbnN0YW5jZUNvbG9yczoge3NpemU6IDQsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIGFjY2Vzc29yOiAnZ2V0Q29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnN9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLmdldE1vZGVsKGdsKX0pO1xuICB9XG5cbiAgdXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgY29uc3Qge2ljb25BdGxhc30gPSBwcm9wcztcblxuICAgIGlmIChvbGRQcm9wcy5pY29uQXRsYXMgIT09IGljb25BdGxhcykge1xuICAgICAgY29uc3QgaWNvbnMgPSB7fTtcbiAgICAgIHRoaXMuc3RhdGUuaWNvbnMgPSBpY29ucztcblxuICAgICAgaWYgKGljb25BdGxhcyBpbnN0YW5jZW9mIFRleHR1cmUyRCkge1xuICAgICAgICBpY29ucy50ZXh0dXJlID0gaWNvbkF0bGFzO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWNvbkF0bGFzID09PSAnc3RyaW5nJykge1xuICAgICAgICBsb2FkVGV4dHVyZXModGhpcy5jb250ZXh0LmdsLCB7XG4gICAgICAgICAgdXJsczogW2ljb25BdGxhc11cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKFt0ZXh0dXJlXSkgPT4ge1xuICAgICAgICAgIGljb25zLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBjb25zdCB7dmlld3BvcnQ6IHt3aWR0aCwgaGVpZ2h0fSwgZ2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHtzaXplfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgaWNvbnNUZXh0dXJlID0gdGhpcy5zdGF0ZS5pY29ucyAmJiB0aGlzLnN0YXRlLmljb25zLnRleHR1cmU7XG5cbiAgICBpZiAoaWNvbnNUZXh0dXJlKSB7XG4gICAgICAvLyB0cmFuc3BhcmVuY3kgZG9lc24ndCB3b3JrIHdpdGggREVQVEhfVEVTVCBvblxuICAgICAgLy8gdHJhZGVvZmYgYmVpbmcgd2UgY2Fubm90IGd1YXJhbnRlZSB0aGF0IGZvcmVncm91bmQgaWNvbnMgd2lsbCBiZSByZW5kZXJlZCBvbiB0b3BcbiAgICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG5cbiAgICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKE9iamVjdC5hc3NpZ24oe30sIHVuaWZvcm1zLCB7XG4gICAgICAgIGljb25zVGV4dHVyZSxcbiAgICAgICAgaWNvbnNUZXh0dXJlRGltOiBbaWNvbnNUZXh0dXJlLndpZHRoLCBpY29uc1RleHR1cmUuaGVpZ2h0XSxcbiAgICAgICAgc2l6ZTogW3NpemUgLyB3aWR0aCwgLXNpemUgLyBoZWlnaHRdXG4gICAgICB9KSk7XG5cbiAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICB9XG4gIH1cblxuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICB2czogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9pY29uLWxheWVyLXZlcnRleC5nbHNsJyksICd1dGY4JyksXG4gICAgICBmczogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi9pY29uLWxheWVyLWZyYWdtZW50Lmdsc2wnKSwgJ3V0ZjgnKVxuICAgIH07XG4gIH1cblxuICBnZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFstMSwgLTEsIDAsIC0xLCAxLCAwLCAxLCAxLCAwLCAxLCAtMSwgMF07XG5cbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKHtcbiAgICAgIGdsLFxuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGZzOiBzaGFkZXJzLmZzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRV9GQU4sXG4gICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICB9KSxcbiAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMl0gfHwgMDtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVNpemVzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTY2FsZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHNpemUgPSBnZXRTY2FsZShvYmplY3QpO1xuICAgICAgdmFsdWVbaSsrXSA9IGlzTmFOKHNpemUpID8gMSA6IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldENvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihvYmplY3QpIHx8IERFRkFVTFRfQ09MT1I7XG5cbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsyXTtcbiAgICAgIHZhbHVlW2krK10gPSBpc05hTihjb2xvclszXSkgPyBERUZBVUxUX0NPTE9SWzNdIDogY29sb3JbM107XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VPZmZzZXRzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBpY29uTWFwcGluZywgZ2V0SWNvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IGljb24gPSBnZXRJY29uKG9iamVjdCk7XG4gICAgICBjb25zdCByZWN0ID0gaWNvbk1hcHBpbmdbaWNvbl0gfHwge307XG4gICAgICB2YWx1ZVtpKytdID0gKDEgLyAyIC0gcmVjdC5hbmNob3JYIC8gcmVjdC53aWR0aCkgfHwgMDtcbiAgICAgIHZhbHVlW2krK10gPSAoMSAvIDIgLSByZWN0LmFuY2hvclkgLyByZWN0LmhlaWdodCkgfHwgMDtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9yTW9kZShhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgaWNvbk1hcHBpbmcsIGdldEljb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBpY29uID0gZ2V0SWNvbihvYmplY3QpO1xuICAgICAgY29uc3QgY29sb3JNb2RlID0gaWNvbk1hcHBpbmdbaWNvbl0gJiYgaWNvbk1hcHBpbmdbaWNvbl0ubWFzaztcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvck1vZGUgPyAxIDogMDtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUljb25GcmFtZXMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGljb25NYXBwaW5nLCBnZXRJY29ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgaWNvbiA9IGdldEljb24ob2JqZWN0KTtcbiAgICAgIGNvbnN0IHJlY3QgPSBpY29uTWFwcGluZ1tpY29uXSB8fCB7fTtcbiAgICAgIHZhbHVlW2krK10gPSByZWN0LnggfHwgMDtcbiAgICAgIHZhbHVlW2krK10gPSByZWN0LnkgfHwgMDtcbiAgICAgIHZhbHVlW2krK10gPSByZWN0LndpZHRoIHx8IDA7XG4gICAgICB2YWx1ZVtpKytdID0gcmVjdC5oZWlnaHQgfHwgMDtcbiAgICB9XG4gIH1cbn1cblxuSWNvbkxheWVyLmxheWVyTmFtZSA9ICdJY29uTGF5ZXInO1xuSWNvbkxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==
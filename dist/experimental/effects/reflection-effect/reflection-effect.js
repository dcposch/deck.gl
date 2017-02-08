'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _luma = require('luma.gl');

var _shaderUtils = require('../../../shader-utils');

var _lib = require('../../lib');

var _viewports = require('../../../lib/viewports');

var _reflectionEffectVertex = require('./reflection-effect-vertex.glsl');

var _reflectionEffectVertex2 = _interopRequireDefault(_reflectionEffectVertex);

var _reflectionEffectFragment = require('./reflection-effect-fragment.glsl');

var _reflectionEffectFragment2 = _interopRequireDefault(_reflectionEffectFragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* global window */


var ReflectionEffect = function (_Effect) {
  _inherits(ReflectionEffect, _Effect);

  /**
   * @classdesc
   * ReflectionEffect
   *
   * @class
   * @param reflectivity How visible reflections should be over the map, between 0 and 1
   * @param blur how blurry the reflection should be, between 0 and 1
   */

  function ReflectionEffect() {
    var reflectivity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.5;
    var blur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.5;

    _classCallCheck(this, ReflectionEffect);

    var _this = _possibleConstructorReturn(this, (ReflectionEffect.__proto__ || Object.getPrototypeOf(ReflectionEffect)).call(this));

    _this.reflectivity = reflectivity;
    _this.blur = blur;
    _this.framebuffer = null;
    _this.setNeedsRedraw();
    return _this;
  }

  _createClass(ReflectionEffect, [{
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: _reflectionEffectVertex2.default,
        fs: _reflectionEffectFragment2.default
      };
    }
  }, {
    key: 'initialize',
    value: function initialize(_ref) {
      var gl = _ref.gl,
          layerManager = _ref.layerManager;

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      this.unitQuad = new _luma.Model({
        gl: gl,
        id: 'reflection-effect',
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          vertices: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])
        })
      });
      this.framebuffer = new _luma.Framebuffer(gl, { depth: true });
    }
  }, {
    key: 'preDraw',
    value: function preDraw(_ref2) {
      var gl = _ref2.gl,
          layerManager = _ref2.layerManager;
      var viewport = layerManager.context.viewport;
      /*
       * the renderer already has a reference to this, but we don't have a reference to the renderer.
       * when we refactor the camera code, we should make sure we get a reference to the renderer so
       * that we can keep this in one place.
       */

      var dpi = typeof window !== 'undefined' && window.devicePixelRatio || 1;
      this.framebuffer.resize({ width: dpi * viewport.width, height: dpi * viewport.height });
      var pitch = viewport.pitch;
      this.framebuffer.bind();
      /* this is a huge hack around the existing viewport class.
       * TODO in the future, once we implement bona-fide cameras, we really need to fix this.
       */
      layerManager.setViewport(new _viewports.WebMercatorViewport(Object.assign({}, viewport, { pitch: -180 - pitch })));
      gl.clear(_luma.GL.COLOR_BUFFER_BIT | _luma.GL.DEPTH_BUFFER_BIT);

      layerManager.drawLayers({ pass: 'reflection' });
      layerManager.setViewport(viewport);
      this.framebuffer.unbind();
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var gl = _ref3.gl,
          layerManager = _ref3.layerManager;

      /*
       * Render our unit quad.
       * This will cover the entire screen, but will lie behind all other geometry.
       * This quad will sample the previously generated reflection texture
       * in order to create the reflection effect
       */
      this.unitQuad.render({
        reflectionTexture: this.framebuffer.texture,
        reflectionTextureWidth: this.framebuffer.width,
        reflectionTextureHeight: this.framebuffer.height,
        reflectivity: this.reflectivity,
        blur: this.blur
      });
    }
  }, {
    key: 'finalize',
    value: function finalize(_ref4) {
      /* TODO: Free resources? */

      var gl = _ref4.gl,
          layerManager = _ref4.layerManager;
    }
  }]);

  return ReflectionEffect;
}(_lib.Effect);

exports.default = ReflectionEffect;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leHBlcmltZW50YWwvZWZmZWN0cy9yZWZsZWN0aW9uLWVmZmVjdC9yZWZsZWN0aW9uLWVmZmVjdC5qcyJdLCJuYW1lcyI6WyJSZWZsZWN0aW9uRWZmZWN0IiwicmVmbGVjdGl2aXR5IiwiYmx1ciIsImZyYW1lYnVmZmVyIiwic2V0TmVlZHNSZWRyYXciLCJ2cyIsImZzIiwiZ2wiLCJsYXllck1hbmFnZXIiLCJzaGFkZXJzIiwiZ2V0U2hhZGVycyIsInVuaXRRdWFkIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVfRkFOIiwidmVydGljZXMiLCJGbG9hdDMyQXJyYXkiLCJkZXB0aCIsInZpZXdwb3J0IiwiY29udGV4dCIsImRwaSIsIndpbmRvdyIsImRldmljZVBpeGVsUmF0aW8iLCJyZXNpemUiLCJ3aWR0aCIsImhlaWdodCIsInBpdGNoIiwiYmluZCIsInNldFZpZXdwb3J0IiwiT2JqZWN0IiwiYXNzaWduIiwiY2xlYXIiLCJDT0xPUl9CVUZGRVJfQklUIiwiREVQVEhfQlVGRkVSX0JJVCIsImRyYXdMYXllcnMiLCJwYXNzIiwidW5iaW5kIiwicmVuZGVyIiwicmVmbGVjdGlvblRleHR1cmUiLCJ0ZXh0dXJlIiwicmVmbGVjdGlvblRleHR1cmVXaWR0aCIsInJlZmxlY3Rpb25UZXh0dXJlSGVpZ2h0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBUEE7OztJQVNxQkEsZ0I7OztBQUVuQjs7Ozs7Ozs7O0FBU0EsOEJBQTRDO0FBQUEsUUFBaENDLFlBQWdDLHVFQUFqQixHQUFpQjtBQUFBLFFBQVpDLElBQVksdUVBQUwsR0FBSzs7QUFBQTs7QUFBQTs7QUFFMUMsVUFBS0QsWUFBTCxHQUFvQkEsWUFBcEI7QUFDQSxVQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFDQSxVQUFLQyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EsVUFBS0MsY0FBTDtBQUwwQztBQU0zQzs7OztpQ0FFWTtBQUNYLGFBQU87QUFDTEMsNENBREs7QUFFTEM7QUFGSyxPQUFQO0FBSUQ7OztxQ0FFOEI7QUFBQSxVQUFuQkMsRUFBbUIsUUFBbkJBLEVBQW1CO0FBQUEsVUFBZkMsWUFBZSxRQUFmQSxZQUFlOztBQUM3QixVQUFNQyxVQUFVLGtDQUFnQkYsRUFBaEIsRUFBb0IsS0FBS0csVUFBTCxFQUFwQixDQUFoQjs7QUFFQSxXQUFLQyxRQUFMLEdBQWdCLGdCQUFVO0FBQ3hCSixjQUR3QjtBQUV4QkssWUFBSSxtQkFGb0I7QUFHeEJQLFlBQUlJLFFBQVFKLEVBSFk7QUFJeEJDLFlBQUlHLFFBQVFILEVBSlk7QUFLeEJPLGtCQUFVLG1CQUFhO0FBQ3JCQyxvQkFBVSxTQUFHQyxZQURRO0FBRXJCQyxvQkFBVSxJQUFJQyxZQUFKLENBQWlCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsRUFBK0IsQ0FBL0IsRUFBa0MsQ0FBbEMsQ0FBakI7QUFGVyxTQUFiO0FBTGMsT0FBVixDQUFoQjtBQVVBLFdBQUtkLFdBQUwsR0FBbUIsc0JBQWdCSSxFQUFoQixFQUFvQixFQUFDVyxPQUFPLElBQVIsRUFBcEIsQ0FBbkI7QUFFRDs7O21DQUUyQjtBQUFBLFVBQW5CWCxFQUFtQixTQUFuQkEsRUFBbUI7QUFBQSxVQUFmQyxZQUFlLFNBQWZBLFlBQWU7QUFBQSxVQUNuQlcsUUFEbUIsR0FDUFgsYUFBYVksT0FETixDQUNuQkQsUUFEbUI7QUFFMUI7Ozs7OztBQUtBLFVBQU1FLE1BQU8sT0FBT0MsTUFBUCxLQUFrQixXQUFsQixJQUFpQ0EsT0FBT0MsZ0JBQXpDLElBQThELENBQTFFO0FBQ0EsV0FBS3BCLFdBQUwsQ0FBaUJxQixNQUFqQixDQUF3QixFQUFDQyxPQUFPSixNQUFNRixTQUFTTSxLQUF2QixFQUE4QkMsUUFBUUwsTUFBTUYsU0FBU08sTUFBckQsRUFBeEI7QUFDQSxVQUFNQyxRQUFRUixTQUFTUSxLQUF2QjtBQUNBLFdBQUt4QixXQUFMLENBQWlCeUIsSUFBakI7QUFDQTs7O0FBR0FwQixtQkFBYXFCLFdBQWIsQ0FDRSxtQ0FBd0JDLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCWixRQUFsQixFQUE0QixFQUFDUSxPQUFPLENBQUMsR0FBRCxHQUFPQSxLQUFmLEVBQTVCLENBQXhCLENBREY7QUFHQXBCLFNBQUd5QixLQUFILENBQVMsU0FBR0MsZ0JBQUgsR0FBc0IsU0FBR0MsZ0JBQWxDOztBQUVBMUIsbUJBQWEyQixVQUFiLENBQXdCLEVBQUNDLE1BQU0sWUFBUCxFQUF4QjtBQUNBNUIsbUJBQWFxQixXQUFiLENBQXlCVixRQUF6QjtBQUNBLFdBQUtoQixXQUFMLENBQWlCa0MsTUFBakI7QUFDRDs7O2dDQUV3QjtBQUFBLFVBQW5COUIsRUFBbUIsU0FBbkJBLEVBQW1CO0FBQUEsVUFBZkMsWUFBZSxTQUFmQSxZQUFlOztBQUN2Qjs7Ozs7O0FBTUEsV0FBS0csUUFBTCxDQUFjMkIsTUFBZCxDQUFxQjtBQUNuQkMsMkJBQW1CLEtBQUtwQyxXQUFMLENBQWlCcUMsT0FEakI7QUFFbkJDLGdDQUF3QixLQUFLdEMsV0FBTCxDQUFpQnNCLEtBRnRCO0FBR25CaUIsaUNBQXlCLEtBQUt2QyxXQUFMLENBQWlCdUIsTUFIdkI7QUFJbkJ6QixzQkFBYyxLQUFLQSxZQUpBO0FBS25CQyxjQUFNLEtBQUtBO0FBTFEsT0FBckI7QUFPRDs7O29DQUU0QjtBQUMzQjs7QUFEMkIsVUFBbkJLLEVBQW1CLFNBQW5CQSxFQUFtQjtBQUFBLFVBQWZDLFlBQWUsU0FBZkEsWUFBZTtBQUU1Qjs7Ozs7O2tCQXJGa0JSLGdCIiwiZmlsZSI6InJlZmxlY3Rpb24tZWZmZWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIHdpbmRvdyAqL1xuaW1wb3J0IHtHTCwgRnJhbWVidWZmZXIsIE1vZGVsLCBHZW9tZXRyeX0gZnJvbSAnbHVtYS5nbCc7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7RWZmZWN0fSBmcm9tICcuLi8uLi9saWInO1xuaW1wb3J0IHtXZWJNZXJjYXRvclZpZXdwb3J0fSBmcm9tICcuLi8uLi8uLi9saWIvdmlld3BvcnRzJztcblxuaW1wb3J0IHJlZmxlY3Rpb25WZXJ0ZXggZnJvbSAnLi9yZWZsZWN0aW9uLWVmZmVjdC12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgcmVmbGVjdGlvbkZyYWdtZW50IGZyb20gJy4vcmVmbGVjdGlvbi1lZmZlY3QtZnJhZ21lbnQuZ2xzbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlZmxlY3Rpb25FZmZlY3QgZXh0ZW5kcyBFZmZlY3Qge1xuXG4gIC8qKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIFJlZmxlY3Rpb25FZmZlY3RcbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSByZWZsZWN0aXZpdHkgSG93IHZpc2libGUgcmVmbGVjdGlvbnMgc2hvdWxkIGJlIG92ZXIgdGhlIG1hcCwgYmV0d2VlbiAwIGFuZCAxXG4gICAqIEBwYXJhbSBibHVyIGhvdyBibHVycnkgdGhlIHJlZmxlY3Rpb24gc2hvdWxkIGJlLCBiZXR3ZWVuIDAgYW5kIDFcbiAgICovXG5cbiAgY29uc3RydWN0b3IocmVmbGVjdGl2aXR5ID0gMC41LCBibHVyID0gMC41KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJlZmxlY3Rpdml0eSA9IHJlZmxlY3Rpdml0eTtcbiAgICB0aGlzLmJsdXIgPSBibHVyO1xuICAgIHRoaXMuZnJhbWVidWZmZXIgPSBudWxsO1xuICAgIHRoaXMuc2V0TmVlZHNSZWRyYXcoKTtcbiAgfVxuXG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZzOiByZWZsZWN0aW9uVmVydGV4LFxuICAgICAgZnM6IHJlZmxlY3Rpb25GcmFnbWVudFxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplKHtnbCwgbGF5ZXJNYW5hZ2VyfSkge1xuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHRoaXMudW5pdFF1YWQgPSBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogJ3JlZmxlY3Rpb24tZWZmZWN0JyxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IEdMLlRSSUFOR0xFX0ZBTixcbiAgICAgICAgdmVydGljZXM6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDEsIDAsIDAsIDEsIDEsIDAsIDAsIDEsIDBdKVxuICAgICAgfSlcbiAgICB9KTtcbiAgICB0aGlzLmZyYW1lYnVmZmVyID0gbmV3IEZyYW1lYnVmZmVyKGdsLCB7ZGVwdGg6IHRydWV9KTtcblxuICB9XG5cbiAgcHJlRHJhdyh7Z2wsIGxheWVyTWFuYWdlcn0pIHtcbiAgICBjb25zdCB7dmlld3BvcnR9ID0gbGF5ZXJNYW5hZ2VyLmNvbnRleHQ7XG4gICAgLypcbiAgICAgKiB0aGUgcmVuZGVyZXIgYWxyZWFkeSBoYXMgYSByZWZlcmVuY2UgdG8gdGhpcywgYnV0IHdlIGRvbid0IGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIHJlbmRlcmVyLlxuICAgICAqIHdoZW4gd2UgcmVmYWN0b3IgdGhlIGNhbWVyYSBjb2RlLCB3ZSBzaG91bGQgbWFrZSBzdXJlIHdlIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgcmVuZGVyZXIgc29cbiAgICAgKiB0aGF0IHdlIGNhbiBrZWVwIHRoaXMgaW4gb25lIHBsYWNlLlxuICAgICAqL1xuICAgIGNvbnN0IGRwaSA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykgfHwgMTtcbiAgICB0aGlzLmZyYW1lYnVmZmVyLnJlc2l6ZSh7d2lkdGg6IGRwaSAqIHZpZXdwb3J0LndpZHRoLCBoZWlnaHQ6IGRwaSAqIHZpZXdwb3J0LmhlaWdodH0pO1xuICAgIGNvbnN0IHBpdGNoID0gdmlld3BvcnQucGl0Y2g7XG4gICAgdGhpcy5mcmFtZWJ1ZmZlci5iaW5kKCk7XG4gICAgLyogdGhpcyBpcyBhIGh1Z2UgaGFjayBhcm91bmQgdGhlIGV4aXN0aW5nIHZpZXdwb3J0IGNsYXNzLlxuICAgICAqIFRPRE8gaW4gdGhlIGZ1dHVyZSwgb25jZSB3ZSBpbXBsZW1lbnQgYm9uYS1maWRlIGNhbWVyYXMsIHdlIHJlYWxseSBuZWVkIHRvIGZpeCB0aGlzLlxuICAgICAqL1xuICAgIGxheWVyTWFuYWdlci5zZXRWaWV3cG9ydChcbiAgICAgIG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KE9iamVjdC5hc3NpZ24oe30sIHZpZXdwb3J0LCB7cGl0Y2g6IC0xODAgLSBwaXRjaH0pKVxuICAgICk7XG4gICAgZ2wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xuXG4gICAgbGF5ZXJNYW5hZ2VyLmRyYXdMYXllcnMoe3Bhc3M6ICdyZWZsZWN0aW9uJ30pO1xuICAgIGxheWVyTWFuYWdlci5zZXRWaWV3cG9ydCh2aWV3cG9ydCk7XG4gICAgdGhpcy5mcmFtZWJ1ZmZlci51bmJpbmQoKTtcbiAgfVxuXG4gIGRyYXcoe2dsLCBsYXllck1hbmFnZXJ9KSB7XG4gICAgLypcbiAgICAgKiBSZW5kZXIgb3VyIHVuaXQgcXVhZC5cbiAgICAgKiBUaGlzIHdpbGwgY292ZXIgdGhlIGVudGlyZSBzY3JlZW4sIGJ1dCB3aWxsIGxpZSBiZWhpbmQgYWxsIG90aGVyIGdlb21ldHJ5LlxuICAgICAqIFRoaXMgcXVhZCB3aWxsIHNhbXBsZSB0aGUgcHJldmlvdXNseSBnZW5lcmF0ZWQgcmVmbGVjdGlvbiB0ZXh0dXJlXG4gICAgICogaW4gb3JkZXIgdG8gY3JlYXRlIHRoZSByZWZsZWN0aW9uIGVmZmVjdFxuICAgICAqL1xuICAgIHRoaXMudW5pdFF1YWQucmVuZGVyKHtcbiAgICAgIHJlZmxlY3Rpb25UZXh0dXJlOiB0aGlzLmZyYW1lYnVmZmVyLnRleHR1cmUsXG4gICAgICByZWZsZWN0aW9uVGV4dHVyZVdpZHRoOiB0aGlzLmZyYW1lYnVmZmVyLndpZHRoLFxuICAgICAgcmVmbGVjdGlvblRleHR1cmVIZWlnaHQ6IHRoaXMuZnJhbWVidWZmZXIuaGVpZ2h0LFxuICAgICAgcmVmbGVjdGl2aXR5OiB0aGlzLnJlZmxlY3Rpdml0eSxcbiAgICAgIGJsdXI6IHRoaXMuYmx1clxuICAgIH0pO1xuICB9XG5cbiAgZmluYWxpemUoe2dsLCBsYXllck1hbmFnZXJ9KSB7XG4gICAgLyogVE9ETzogRnJlZSByZXNvdXJjZXM/ICovXG4gIH1cbn1cbiJdfQ==
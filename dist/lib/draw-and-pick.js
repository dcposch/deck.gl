'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.drawLayers = drawLayers;
exports.pickLayers = pickLayers;

var _luma = require('luma.gl');

var _viewportUniforms = require('./viewport-uniforms');

var _utils = require('./utils');

var renderCount = 0; /* global window */
function drawLayers(_ref) {
  var layers = _ref.layers,
      pass = _ref.pass;

  _utils.log.log(2, 'DRAWING ' + layers.length + ' layers');

  var layerIndex = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = layers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var layer = _step.value;

      if (layer.props.visible) {
        layer.drawLayer({
          uniforms: Object.assign({}, layer.context.uniforms, (0, _viewportUniforms.getUniformsFromViewport)(layer.context.viewport, layer.props), { layerIndex: layerIndex })
        });
        layerIndex++;
      }
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

  _utils.log.log(1, 'RENDER PASS ' + pass + ': ' + renderCount++ + ' ' + layerIndex + ' visible, ' + layers.length + ' total');
}

/* eslint-disable max-depth, max-statements */
function pickLayers(gl, _ref2) {
  var layers = _ref2.layers,
      pickingFBO = _ref2.pickingFBO,
      _ref2$uniforms = _ref2.uniforms,
      uniforms = _ref2$uniforms === undefined ? {} : _ref2$uniforms,
      x = _ref2.x,
      y = _ref2.y,
      mode = _ref2.mode;

  // Convert from canvas top-left to WebGL bottom-left coordinates
  // And compensate for pixelRatio
  var pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  var deviceX = x * pixelRatio;
  var deviceY = gl.canvas.height - y * pixelRatio;

  // TODO - just return glContextWithState once luma updates
  var pickedInfos = [];

  // Make sure we clear scissor test and fbo bindings in case of exceptions
  // We are only interested in one pixel, no need to render anything else
  (0, _luma.glContextWithState)(gl, {
    frameBuffer: pickingFBO,
    framebuffer: pickingFBO,
    scissorTest: { x: deviceX, y: deviceY, w: 1, h: 1 }
  }, function () {

    var layerIndex = 0;
    var zOrder = 0;

    for (var i = layers.length - 1; i >= 0; --i) {
      var layer = layers[i];

      if (layer.props.visible) {
        layerIndex++;
      }

      if (layer.props.visible && layer.props.pickable) {

        // Clear the frame buffer, render and sample
        gl.clear(_luma.GL.COLOR_BUFFER_BIT | _luma.GL.DEPTH_BUFFER_BIT);
        var info = createInfo({
          layer: layer,
          pixel: [x, y],
          devicePixel: [deviceX, deviceY],
          pixelRatio: pixelRatio
        });

        layer.pickLayer({
          info: info,
          uniforms: Object.assign({}, layer.context.uniforms, (0, _viewportUniforms.getUniformsFromViewport)(layer.context.viewport, layer.props), { layerIndex: layerIndex }),
          pickEnableUniforms: { renderPickingBuffer: 1, pickingEnabled: 1 },
          pickDisableUniforms: { renderPickingBuffer: 0, pickingEnabled: 0 },
          deviceX: deviceX, deviceY: deviceY,
          mode: mode
        });

        if (info.index >= 0) {
          info.picked = true;
          info.zOrder = zOrder++;
          // If props.data is an indexable array, get the object
          if (Array.isArray(layer.props.data)) {
            info.object = layer.props.data[info.index];
          }
        }

        pickedInfos.push(info);
      }
    }
  });

  // Calling callbacks can have async interactions with React
  // which nullifies layer.state.
  var unhandledPickInfos = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = pickedInfos[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var info = _step2.value;

      var handled = null;
      switch (mode) {
        case 'click':
          handled = info.layer.props.onClick(info);break;
        case 'hover':
          handled = info.layer.props.onHover(info);break;
        default:
          throw new Error('unknown pick type');
      }

      if (!handled) {
        unhandledPickInfos.push(info);
      }
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

  return unhandledPickInfos;
}
/* eslint-enable max-depth, max-statements */

function createInfo(_ref3) {
  var info = _ref3.info,
      layer = _ref3.layer,
      pixel = _ref3.pixel,
      devicePixel = _ref3.devicePixel,
      pixelRatio = _ref3.pixelRatio;

  // Assign a number of potentially useful props to the "info" object
  return {
    layer: layer,
    index: -1,
    picked: false,
    x: pixel[0],
    y: pixel[1],
    pixel: pixel,
    devicePixel: devicePixel,
    pixelRatio: pixelRatio,
    lngLat: layer.unproject(pixel)
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZHJhdy1hbmQtcGljay5qcyJdLCJuYW1lcyI6WyJkcmF3TGF5ZXJzIiwicGlja0xheWVycyIsInJlbmRlckNvdW50IiwibGF5ZXJzIiwicGFzcyIsImxvZyIsImxlbmd0aCIsImxheWVySW5kZXgiLCJsYXllciIsInByb3BzIiwidmlzaWJsZSIsImRyYXdMYXllciIsInVuaWZvcm1zIiwiT2JqZWN0IiwiYXNzaWduIiwiY29udGV4dCIsInZpZXdwb3J0IiwiZ2wiLCJwaWNraW5nRkJPIiwieCIsInkiLCJtb2RlIiwicGl4ZWxSYXRpbyIsIndpbmRvdyIsImRldmljZVBpeGVsUmF0aW8iLCJkZXZpY2VYIiwiZGV2aWNlWSIsImNhbnZhcyIsImhlaWdodCIsInBpY2tlZEluZm9zIiwiZnJhbWVCdWZmZXIiLCJmcmFtZWJ1ZmZlciIsInNjaXNzb3JUZXN0IiwidyIsImgiLCJ6T3JkZXIiLCJpIiwicGlja2FibGUiLCJjbGVhciIsIkNPTE9SX0JVRkZFUl9CSVQiLCJERVBUSF9CVUZGRVJfQklUIiwiaW5mbyIsImNyZWF0ZUluZm8iLCJwaXhlbCIsImRldmljZVBpeGVsIiwicGlja0xheWVyIiwicGlja0VuYWJsZVVuaWZvcm1zIiwicmVuZGVyUGlja2luZ0J1ZmZlciIsInBpY2tpbmdFbmFibGVkIiwicGlja0Rpc2FibGVVbmlmb3JtcyIsImluZGV4IiwicGlja2VkIiwiQXJyYXkiLCJpc0FycmF5IiwiZGF0YSIsIm9iamVjdCIsInB1c2giLCJ1bmhhbmRsZWRQaWNrSW5mb3MiLCJoYW5kbGVkIiwib25DbGljayIsIm9uSG92ZXIiLCJFcnJvciIsImxuZ0xhdCIsInVucHJvamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFPZ0JBLFUsR0FBQUEsVTtRQXNCQUMsVSxHQUFBQSxVOztBQTVCaEI7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBSUMsY0FBYyxDQUFsQixDLENBTEE7QUFPTyxTQUFTRixVQUFULE9BQW9DO0FBQUEsTUFBZkcsTUFBZSxR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QUhUOztBQU1BLFVBQUksQ0FBQ0gsT0FBTCxFQUFjO0FBQ1pELDJCQUFtQkQsSUFBbkIsQ0FBd0JmLElBQXhCO0FBQ0Q7QUFDRjtBQWpGQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQW1GRCxTQUFPZ0Isa0JBQVA7QUFDRDtBQUNEOztBQUVBLFNBQVNmLFVBQVQsUUFNRztBQUFBLE1BTERELElBS0MsU0FMREEsSUFLQztBQUFBLE1BSkRqQyxLQUlDLFNBSkRBLEtBSUM7QUFBQSxNQUhEbUMsS0FHQyxTQUhEQSxLQUdDO0FBQUEsTUFGREMsV0FFQyxTQUZEQSxXQUVDO0FBQUEsTUFERHRCLFVBQ0MsU0FEREEsVUFDQzs7QUFDRDtBQUNBLFNBQU87QUFDTGQsZ0JBREs7QUFFTDBDLFdBQU8sQ0FBQyxDQUZIO0FBR0xDLFlBQVEsS0FISDtBQUlMaEMsT0FBR3dCLE1BQU0sQ0FBTixDQUpFO0FBS0x2QixPQUFHdUIsTUFBTSxDQUFOLENBTEU7QUFNTEEsZ0JBTks7QUFPTEMsNEJBUEs7QUFRTHRCLDBCQVJLO0FBU0x3QyxZQUFRdEQsTUFBTXVELFNBQU4sQ0FBZ0JwQixLQUFoQjtBQVRILEdBQVA7QUFXRCIsImZpbGUiOiJkcmF3LWFuZC1waWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIHdpbmRvdyAqL1xuaW1wb3J0IHtHTCwgZ2xDb250ZXh0V2l0aFN0YXRlfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7Z2V0VW5pZm9ybXNGcm9tVmlld3BvcnR9IGZyb20gJy4vdmlld3BvcnQtdW5pZm9ybXMnO1xuaW1wb3J0IHtsb2d9IGZyb20gJy4vdXRpbHMnO1xuXG5sZXQgcmVuZGVyQ291bnQgPSAwO1xuXG5leHBvcnQgZnVuY3Rpb24gZHJhd0xheWVycyh7bGF5ZXJzLCBwYXNzfSkge1xuICBsb2cubG9nKDIsIGBEUkFXSU5HICR7bGF5ZXJzLmxlbmd0aH0gbGF5ZXJzYCk7XG5cbiAgbGV0IGxheWVySW5kZXggPSAwO1xuICBmb3IgKGNvbnN0IGxheWVyIG9mIGxheWVycykge1xuICAgIGlmIChsYXllci5wcm9wcy52aXNpYmxlKSB7XG4gICAgICBsYXllci5kcmF3TGF5ZXIoe1xuICAgICAgICB1bmlmb3JtczogT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICB7fSxcbiAgICAgICAgICBsYXllci5jb250ZXh0LnVuaWZvcm1zLFxuICAgICAgICAgIGdldFVuaWZvcm1zRnJvbVZpZXdwb3J0KGxheWVyLmNvbnRleHQudmlld3BvcnQsIGxheWVyLnByb3BzKSxcbiAgICAgICAgICB7bGF5ZXJJbmRleH1cbiAgICAgICAgKVxuICAgICAgfSk7XG4gICAgICBsYXllckluZGV4Kys7XG4gICAgfVxuICB9XG5cbiAgbG9nLmxvZygxLCBgUkVOREVSIFBBU1MgJHtwYXNzfTogJHtyZW5kZXJDb3VudCsrfSAke2xheWVySW5kZXh9IHZpc2libGUsICR7bGF5ZXJzLmxlbmd0aH0gdG90YWxgKTtcbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWRlcHRoLCBtYXgtc3RhdGVtZW50cyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBpY2tMYXllcnMoZ2wsIHtcbiAgbGF5ZXJzLFxuICBwaWNraW5nRkJPLFxuICB1bmlmb3JtcyA9IHt9LFxuICB4LFxuICB5LFxuICBtb2RlXG59KSB7XG4gIC8vIENvbnZlcnQgZnJvbSBjYW52YXMgdG9wLWxlZnQgdG8gV2ViR0wgYm90dG9tLWxlZnQgY29vcmRpbmF0ZXNcbiAgLy8gQW5kIGNvbXBlbnNhdGUgZm9yIHBpeGVsUmF0aW9cbiAgY29uc3QgcGl4ZWxSYXRpbyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID9cbiAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA6IDE7XG4gIGNvbnN0IGRldmljZVggPSB4ICogcGl4ZWxSYXRpbztcbiAgY29uc3QgZGV2aWNlWSA9IGdsLmNhbnZhcy5oZWlnaHQgLSB5ICogcGl4ZWxSYXRpbztcblxuICAvLyBUT0RPIC0ganVzdCByZXR1cm4gZ2xDb250ZXh0V2l0aFN0YXRlIG9uY2UgbHVtYSB1cGRhdGVzXG4gIGNvbnN0IHBpY2tlZEluZm9zID0gW107XG5cbiAgLy8gTWFrZSBzdXJlIHdlIGNsZWFyIHNjaXNzb3IgdGVzdCBhbmQgZmJvIGJpbmRpbmdzIGluIGNhc2Ugb2YgZXhjZXB0aW9uc1xuICAvLyBXZSBhcmUgb25seSBpbnRlcmVzdGVkIGluIG9uZSBwaXhlbCwgbm8gbmVlZCB0byByZW5kZXIgYW55dGhpbmcgZWxzZVxuICBnbENvbnRleHRXaXRoU3RhdGUoZ2wsIHtcbiAgICBmcmFtZUJ1ZmZlcjogcGlja2luZ0ZCTyxcbiAgICBmcmFtZWJ1ZmZlcjogcGlja2luZ0ZCTyxcbiAgICBzY2lzc29yVGVzdDoge3g6IGRldmljZVgsIHk6IGRldmljZVksIHc6IDEsIGg6IDF9XG4gIH0sICgpID0+IHtcblxuICAgIGxldCBsYXllckluZGV4ID0gMDtcbiAgICBsZXQgek9yZGVyID0gMDtcblxuICAgIGZvciAobGV0IGkgPSBsYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIGNvbnN0IGxheWVyID0gbGF5ZXJzW2ldO1xuXG4gICAgICBpZiAobGF5ZXIucHJvcHMudmlzaWJsZSkge1xuICAgICAgICBsYXllckluZGV4Kys7XG4gICAgICB9XG5cbiAgICAgIGlmIChsYXllci5wcm9wcy52aXNpYmxlICYmIGxheWVyLnByb3BzLnBpY2thYmxlKSB7XG5cbiAgICAgICAgLy8gQ2xlYXIgdGhlIGZyYW1lIGJ1ZmZlciwgcmVuZGVyIGFuZCBzYW1wbGVcbiAgICAgICAgZ2wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgICAgICBjb25zdCBpbmZvID0gY3JlYXRlSW5mbyh7XG4gICAgICAgICAgbGF5ZXIsXG4gICAgICAgICAgcGl4ZWw6IFt4LCB5XSxcbiAgICAgICAgICBkZXZpY2VQaXhlbDogW2RldmljZVgsIGRldmljZVldLFxuICAgICAgICAgIHBpeGVsUmF0aW9cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGF5ZXIucGlja0xheWVyKHtcbiAgICAgICAgICBpbmZvLFxuICAgICAgICAgIHVuaWZvcm1zOiBPYmplY3QuYXNzaWduKHt9LFxuICAgICAgICAgICAgbGF5ZXIuY29udGV4dC51bmlmb3JtcyxcbiAgICAgICAgICAgIGdldFVuaWZvcm1zRnJvbVZpZXdwb3J0KGxheWVyLmNvbnRleHQudmlld3BvcnQsIGxheWVyLnByb3BzKSxcbiAgICAgICAgICAgIHtsYXllckluZGV4fVxuICAgICAgICAgICksXG4gICAgICAgICAgcGlja0VuYWJsZVVuaWZvcm1zOiB7cmVuZGVyUGlja2luZ0J1ZmZlcjogMSwgcGlja2luZ0VuYWJsZWQ6IDF9LFxuICAgICAgICAgIHBpY2tEaXNhYmxlVW5pZm9ybXM6IHtyZW5kZXJQaWNraW5nQnVmZmVyOiAwLCBwaWNraW5nRW5hYmxlZDogMH0sXG4gICAgICAgICAgZGV2aWNlWCwgZGV2aWNlWSxcbiAgICAgICAgICBtb2RlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChpbmZvLmluZGV4ID49IDApIHtcbiAgICAgICAgICBpbmZvLnBpY2tlZCA9IHRydWU7XG4gICAgICAgICAgaW5mby56T3JkZXIgPSB6T3JkZXIrKztcbiAgICAgICAgICAvLyBJZiBwcm9wcy5kYXRhIGlzIGFuIGluZGV4YWJsZSBhcnJheSwgZ2V0IHRoZSBvYmplY3RcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShsYXllci5wcm9wcy5kYXRhKSkge1xuICAgICAgICAgICAgaW5mby5vYmplY3QgPSBsYXllci5wcm9wcy5kYXRhW2luZm8uaW5kZXhdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHBpY2tlZEluZm9zLnB1c2goaW5mbyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBDYWxsaW5nIGNhbGxiYWNrcyBjYW4gaGF2ZSBhc3luYyBpbnRlcmFjdGlvbnMgd2l0aCBSZWFjdFxuICAvLyB3aGljaCBudWxsaWZpZXMgbGF5ZXIuc3RhdGUuXG4gIGNvbnN0IHVuaGFuZGxlZFBpY2tJbmZvcyA9IFtdO1xuICBmb3IgKGNvbnN0IGluZm8gb2YgcGlja2VkSW5mb3MpIHtcbiAgICBsZXQgaGFuZGxlZCA9IG51bGw7XG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgY2FzZSAnY2xpY2snOiBoYW5kbGVkID0gaW5mby5sYXllci5wcm9wcy5vbkNsaWNrKGluZm8pOyBicmVhaztcbiAgICBjYXNlICdob3Zlcic6IGhhbmRsZWQgPSBpbmZvLmxheWVyLnByb3BzLm9uSG92ZXIoaW5mbyk7IGJyZWFrO1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcigndW5rbm93biBwaWNrIHR5cGUnKTtcbiAgICB9XG5cbiAgICBpZiAoIWhhbmRsZWQpIHtcbiAgICAgIHVuaGFuZGxlZFBpY2tJbmZvcy5wdXNoKGluZm8pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmhhbmRsZWRQaWNrSW5mb3M7XG59XG4vKiBlc2xpbnQtZW5hYmxlIG1heC1kZXB0aCwgbWF4LXN0YXRlbWVudHMgKi9cblxuZnVuY3Rpb24gY3JlYXRlSW5mbyh7XG4gIGluZm8sXG4gIGxheWVyLFxuICBwaXhlbCxcbiAgZGV2aWNlUGl4ZWwsXG4gIHBpeGVsUmF0aW9cbn0pIHtcbiAgLy8gQXNzaWduIGEgbnVtYmVyIG9mIHBvdGVudGlhbGx5IHVzZWZ1bCBwcm9wcyB0byB0aGUgXCJpbmZvXCIgb2JqZWN0XG4gIHJldHVybiB7XG4gICAgbGF5ZXIsXG4gICAgaW5kZXg6IC0xLFxuICAgIHBpY2tlZDogZmFsc2UsXG4gICAgeDogcGl4ZWxbMF0sXG4gICAgeTogcGl4ZWxbMV0sXG4gICAgcGl4ZWwsXG4gICAgZGV2aWNlUGl4ZWwsXG4gICAgcGl4ZWxSYXRpbyxcbiAgICBsbmdMYXQ6IGxheWVyLnVucHJvamVjdChwaXhlbClcbiAgfTtcbn1cbiJdfQ==
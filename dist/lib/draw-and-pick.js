'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.drawLayers = drawLayers;
exports.pickLayers = pickLayers;

var _luma = require('luma.gl');

var _viewportUniforms = require('./viewport-uniforms');

var _utils = require('./utils');

var EMPTY_PIXEL = new Uint8Array(4); /* global window */

var renderCount = 0;

function drawLayers(_ref) {
  var layers = _ref.layers,
      pass = _ref.pass;

  _utils.log.log(2, 'DRAWING ' + layers.length + ' layers');

  // render layers in normal colors
  var visibleCount = 0;
  // render layers in normal colors
  layers.forEach(function (layer, layerIndex) {
    if (layer.props.visible) {
      layer.drawLayer({
        uniforms: Object.assign({ renderPickingBuffer: 0, pickingEnabled: 0 }, layer.context.uniforms, (0, _viewportUniforms.getUniformsFromViewport)(layer.context.viewport, layer.props), { layerIndex: layerIndex })
      });
      visibleCount++;
    }
  });

  _utils.log.log(1, 'RENDER PASS ' + pass + ': ' + renderCount++ + '\n    ' + visibleCount + ' visible, ' + layers.length + ' total');
}

/* eslint-disable max-depth, max-statements */
function pickLayers(gl, _ref2) {
  var layers = _ref2.layers,
      pickingFBO = _ref2.pickingFBO,
      _ref2$uniforms = _ref2.uniforms,
      uniforms = _ref2$uniforms === undefined ? {} : _ref2$uniforms,
      x = _ref2.x,
      y = _ref2.y,
      viewport = _ref2.viewport,
      mode = _ref2.mode,
      lastPickedInfo = _ref2.lastPickedInfo;

  // Convert from canvas top-left to WebGL bottom-left coordinates
  // And compensate for pixelRatio
  var pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  var deviceX = x * pixelRatio;
  var deviceY = gl.canvas.height - y * pixelRatio;

  // TODO - just return glContextWithState once luma updates
  var unhandledPickInfos = [];

  // Make sure we clear scissor test and fbo bindings in case of exceptions
  // We are only interested in one pixel, no need to render anything else
  (0, _luma.glContextWithState)(gl, {
    frameBuffer: pickingFBO,
    framebuffer: pickingFBO,
    scissorTest: { x: deviceX, y: deviceY, w: 1, h: 1 }
  }, function () {

    // Picking process start
    // Clear the frame buffer
    gl.clear(_luma.GL.COLOR_BUFFER_BIT | _luma.GL.DEPTH_BUFFER_BIT);
    // Save current blend settings
    var oldBlendMode = (0, _utils.getBlendMode)(gl);
    // Set blend mode for picking
    // always overwrite existing pixel with [r,g,b,layerIndex]
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.CONSTANT_ALPHA, gl.ZERO);
    gl.blendEquation(gl.FUNC_ADD);

    // Render all pickable layers in picking colors
    layers.forEach(function (layer, layerIndex) {
      if (layer.props.visible && layer.props.pickable) {

        // Encode layerIndex with alpha
        gl.blendColor(0, 0, 0, (layerIndex + 1) / 255);

        layer.drawLayer({
          uniforms: Object.assign({ renderPickingBuffer: 1, pickingEnabled: 1 }, layer.context.uniforms, (0, _viewportUniforms.getUniformsFromViewport)(layer.context.viewport, layer.props), { layerIndex: layerIndex })
        });
      }
    });

    // Read color in the central pixel, to be mapped with picking colors
    var pickedColor = new Uint8Array(4);
    gl.readPixels(deviceX, deviceY, 1, 1, _luma.GL.RGBA, _luma.GL.UNSIGNED_BYTE, pickedColor);

    // restore blend mode
    (0, _utils.setBlendMode)(gl, oldBlendMode);
    // Picking process end

    // Process picked info start
    // Decode picked color
    var pickedLayerIndex = pickedColor[3] - 1;
    var pickedLayer = pickedLayerIndex >= 0 ? layers[pickedLayerIndex] : null;
    var pickedObjectIndex = pickedLayer ? pickedLayer.decodePickingColor(pickedColor) : -1;
    var pickedLayerId = pickedLayer && pickedLayer.props.id;
    var affectedLayers = pickedLayer ? [pickedLayer] : [];

    if (mode === 'hover') {
      // only invoke onHover events if picked object has changed
      var lastPickedObjectIndex = lastPickedInfo.index;
      var lastPickedLayerId = lastPickedInfo.layerId;

      if (pickedLayerId === lastPickedLayerId && pickedObjectIndex === lastPickedObjectIndex) {
        // picked object did not change, no need to proceed
        return;
      }

      if (pickedLayerId !== lastPickedLayerId) {
        // We cannot store a ref to lastPickedLayer in the context because
        // the state of an outdated layer is no longer valid
        // and the props may have changed
        var lastPickedLayer = layers.find(function (l) {
          return l.props.id === lastPickedLayerId;
        });
        if (lastPickedLayer) {
          // Let leave event fire before enter event
          affectedLayers.unshift(lastPickedLayer);
        }
      }

      // Update layer manager context
      lastPickedInfo.layerId = pickedLayerId;
      lastPickedInfo.index = pickedObjectIndex;
    }

    var baseInfo = createInfo([x, y], viewport);
    baseInfo.devicePixel = [deviceX, deviceY];
    baseInfo.pixelRatio = pixelRatio;

    affectedLayers.forEach(function (layer) {
      var info = Object.assign({}, baseInfo);
      info.layer = layer;

      if (layer === pickedLayer) {
        info.color = pickedColor;
        info.index = pickedObjectIndex;
        info.picked = true;
      }

      // Let layers populate its own info object
      info = layer.pickLayer({ info: info, mode: mode });

      // If layer.getPickingInfo() returns null, do not proceed
      if (info) {
        var handled = false;

        // Calling callbacks can have async interactions with React
        // which nullifies layer.state.
        switch (mode) {
          case 'click':
            handled = layer.props.onClick(info);break;
          case 'hover':
            handled = layer.props.onHover(info);break;
          default:
            throw new Error('unknown pick type');
        }

        if (!handled) {
          unhandledPickInfos.push(info);
        }
      }
    });
  });

  return unhandledPickInfos;
}
/* eslint-enable max-depth, max-statements */

function createInfo(pixel, viewport) {
  // Assign a number of potentially useful props to the "info" object
  return {
    color: EMPTY_PIXEL,
    index: -1,
    picked: false,
    x: pixel[0],
    y: pixel[1],
    pixel: pixel,
    lngLat: viewport.unproject(pixel)
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZHJhdy1hbmQtcGljay5qcyJdLCJuYW1lcyI6WyJkcmF3TGF5ZXJzIiwicGlja0xheWVycyIsIkVNUFRZX1BJWEVMIiwiVWludDhBcnJheSIsInJlbmRlckNvdW50IiwibGF5ZXJzIiwicGFzcyIsImxvZyIsImxlbmd0aCIsInZpc2libGVDb3VudCIsImZvckVhY2giLCJsYXllciIsImxheWVySW5kZXgiLCJwcm9wcyIsInZpc2libGUiLCJkcmF3TGF5ZXIiLCJ1bmlmb3JtcyIsIk9iamVjdCIsImFzc2lnbiIsInJlbmRlclBpY2tpbmdCdWZmZXIiLCJwaWNraW5nRW5hYmxlZCIsImNvbnRleHQiLCJ2aWV3cG9ydCIsImdsIiwicGlja2luZ0ZCTyIsIngiLCJ5IiwibW9kZSIsImxhc3RQaWNrZWRJbmZvIiwicGl4ZWxSYXRpbyIsIndpbmRvdyIsImRldmljZVBpeGVsUmF0aW8iLCJkZXZpY2VYIiwiZGV2aWNlWSIsImNhbnZhcyIsImhlaWdodCIsInVuaGFuZGxlZFBpY2tJbmZvcyIsImZyYW1lQnVmZmVyIiwiZnJhbWVidWZmZXIiLCJzY2lzc29yVGVzdCIsInciLCJoIiwiY2xlYXIiLCJDT0xPUl9CVUZGRVJfQklUIiwiREVQVEhfQlVGRkVSX0JJVCIsIm9sZEJsZW5kTW9kZSIsImVuYWJsZSIsIkJMRU5EIiwiYmxlbmRGdW5jU2VwYXJhdGUiLCJPTkUiLCJaRVJPIiwiQ09OU1RBTlRfQUxQSEEiLCJibGVuZEVxdWF0aW9uIiwiRlVOQ19BREQiLCJwaWNrYWJsZSIsImJsZW5kQ29sb3IiLCJwaWNrZWRDb2xvciIsInJlYWRQaXhlbHMiLCJSR0JBIiwiVU5TSUdORURfQllURSIsInBpY2tlZExheWVySW5kZXgiLCJwaWNrZWRMYXllciIsInBpY2tlZE9iamVjdEluZGV4IiwiZGVjb2RlUGlja2luZ0NvbG9yIiwicGlja2VkTGF5ZXJJZCIsImlkIiwiYWZmZWN0ZWRMYXllcnMiLCJsYXN0UGlja2VkT2JqZWN0SW5kZXgiLCJpbmRleCIsImxhc3RQaWNrZWRMYXllcklkIiwibGF5ZXJJZCIsImxhc3RQaWNrZWRMYXllciIsImZpbmQiLCJsIiwidW5zaGlmdCIsImJhc2VJbmZvIiwiY3JlYXRlSW5mbyIsImRldmljZVBpeGVsIiwiaW5mbyIsImNvbG9yIiwicGlja2VkIiwicGlja0xheWVyIiwiaGFuZGxlZCIsIm9uQ2xpY2siLCJvbkhvdmVyIiwiRXJyb3IiLCJwdXNoIiwicGl4ZWwiLCJsbmdMYXQiLCJ1bnByb2plY3QiXSwibWFwcGluZ3MiOiI7Ozs7O1FBUWdCQSxVLEdBQUFBLFU7UUF5QkFDLFUsR0FBQUEsVTs7QUFoQ2hCOztBQUNBOztBQUNBOztBQUVBLElBQU1DLGNBQWMsSUFBSUMsVUFBSixDQUFlLENBQWYsQ0FBcEIsQyxDQUxBOztBQU1BLElBQUlDLGNBQWMsQ0FBbEI7O0FBRU8sU0FBU0osVUFBVCxPQUFvQztBQUFBLE1BQWZLLE1BQWUsUUFBZkEsTUFBZTtBQUFBLE1BQVBDLElBQU8sUUFBUEEsSUFBTzs7QUFDekMsYUFBSUMsR0FBSixDQUFRLENBQVIsZUFBc0JGLE9BQU9HLE1BQTdCOztBQUVBO0FBQ0EsTUFBSUMsZUFBZSxDQUFuQjtBQUNBO0FBQ0FKLFNBQU9LLE9BQVAsQ0FBZSxVQUFDQyxLQUFELEVBQVFDLFVBQVIsRUFBdUI7QUFDcEMsUUFBSUQsTUFBTUUsS0FBTixDQUFZQyxPQUFoQixFQUF5QjtBQUN2QkgsWUFBTUksU0FBTixDQUFnQjtBQUNkQyxrQkFBVUMsT0FBT0MsTUFBUCxDQUNSLEVBQUNDLHFCQUFxQixDQUF0QixFQUF5QkMsZ0JBQWdCLENBQXpDLEVBRFEsRUFFUlQsTUFBTVUsT0FBTixDQUFjTCxRQUZOLEVBR1IsK0NBQXdCTCxNQUFNVSxPQUFOLENBQWNDLFFBQXRDLEVBQWdEWCxNQUFNRSxLQUF0RCxDQUhRLEVBSVIsRUFBQ0Qsc0JBQUQsRUFKUTtBQURJLE9BQWhCO0FBUUFIO0FBQ0Q7QUFDRixHQVpEOztBQWNBLGFBQUlGLEdBQUosQ0FBUSxDQUFSLG1CQUEwQkQsSUFBMUIsVUFBbUNG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KiBnbG9iYWwgd2luZG93ICovXG5pbXBvcnQge0dMLCBnbENvbnRleHRXaXRoU3RhdGV9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtnZXRVbmlmb3Jtc0Zyb21WaWV3cG9ydH0gZnJvbSAnLi92aWV3cG9ydC11bmlmb3Jtcyc7XG5pbXBvcnQge2xvZywgZ2V0QmxlbmRNb2RlLCBzZXRCbGVuZE1vZGV9IGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBFTVBUWV9QSVhFTCA9IG5ldyBVaW50OEFycmF5KDQpO1xubGV0IHJlbmRlckNvdW50ID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGRyYXdMYXllcnMoe2xheWVycywgcGFzc30pIHtcbiAgbG9nLmxvZygyLCBgRFJBV0lORyAke2xheWVycy5sZW5ndGh9IGxheWVyc2ApO1xuXG4gIC8vIHJlbmRlciBsYXllcnMgaW4gbm9ybWFsIGNvbG9yc1xuICBsZXQgdmlzaWJsZUNvdW50ID0gMDtcbiAgLy8gcmVuZGVyIGxheWVycyBpbiBub3JtYWwgY29sb3JzXG4gIGxheWVycy5mb3JFYWNoKChsYXllciwgbGF5ZXJJbmRleCkgPT4ge1xuICAgIGlmIChsYXllci5wcm9wcy52aXNpYmxlKSB7XG4gICAgICBsYXllci5kcmF3TGF5ZXIoe1xuICAgICAgICB1bmlmb3JtczogT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICB7cmVuZGVyUGlja2luZ0J1ZmZlcjogMCwgcGlja2luZ0VuYWJsZWQ6IDB9LFxuICAgICAgICAgIGxheWVyLmNvbnRleHQudW5pZm9ybXMsXG4gICAgICAgICAgZ2V0VW5pZm9ybXNGcm9tVmlld3BvcnQobGF5ZXIuY29udGV4dC52aWV3cG9ydCwgbGF5ZXIucHJvcHMpLFxuICAgICAgICAgIHtsYXllckluZGV4fVxuICAgICAgICApXG4gICAgICB9KTtcbiAgICAgIHZpc2libGVDb3VudCsrO1xuICAgIH1cbiAgfSk7XG5cbiAgbG9nLmxvZygxLCBgUkVOREVSIFBBU1MgJHtwYXNzfTogJHtyZW5kZXJDb3VudCsrfVxuICAgICR7dmlzaWJsZUNvdW50fSB2aXNpYmxlLCAke2xheWVycy5sZW5ndGh9IHRvdGFsYCk7XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1kZXB0aCwgbWF4LXN0YXRlbWVudHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBwaWNrTGF5ZXJzKGdsLCB7XG4gIGxheWVycyxcbiAgcGlja2luZ0ZCTyxcbiAgdW5pZm9ybXMgPSB7fSxcbiAgeCxcbiAgeSxcbiAgdmlld3BvcnQsXG4gIG1vZGUsXG4gIGxhc3RQaWNrZWRJbmZvXG59KSB7XG4gIC8vIENvbnZlcnQgZnJvbSBjYW52YXMgdG9wLWxlZnQgdG8gV2ViR0wgYm90dG9tLWxlZnQgY29vcmRpbmF0ZXNcbiAgLy8gQW5kIGNvbXBlbnNhdGUgZm9yIHBpeGVsUmF0aW9cbiAgY29uc3QgcGl4ZWxSYXRpbyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID9cbiAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA6IDE7XG4gIGNvbnN0IGRldmljZVggPSB4ICogcGl4ZWxSYXRpbztcbiAgY29uc3QgZGV2aWNlWSA9IGdsLmNhbnZhcy5oZWlnaHQgLSB5ICogcGl4ZWxSYXRpbztcblxuICAvLyBUT0RPIC0ganVzdCByZXR1cm4gZ2xDb250ZXh0V2l0aFN0YXRlIG9uY2UgbHVtYSB1cGRhdGVzXG4gIGNvbnN0IHVuaGFuZGxlZFBpY2tJbmZvcyA9IFtdO1xuXG4gIC8vIE1ha2Ugc3VyZSB3ZSBjbGVhciBzY2lzc29yIHRlc3QgYW5kIGZibyBiaW5kaW5ncyBpbiBjYXNlIG9mIGV4Y2VwdGlvbnNcbiAgLy8gV2UgYXJlIG9ubHkgaW50ZXJlc3RlZCBpbiBvbmUgcGl4ZWwsIG5vIG5lZWQgdG8gcmVuZGVyIGFueXRoaW5nIGVsc2VcbiAgZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7XG4gICAgZnJhbWVCdWZmZXI6IHBpY2tpbmdGQk8sXG4gICAgZnJhbWVidWZmZXI6IHBpY2tpbmdGQk8sXG4gICAgc2Npc3NvclRlc3Q6IHt4OiBkZXZpY2VYLCB5OiBkZXZpY2VZLCB3OiAxLCBoOiAxfVxuICB9LCAoKSA9PiB7XG5cbiAgICAvLyBQaWNraW5nIHByb2Nlc3Mgc3RhcnRcbiAgICAvLyBDbGVhciB0aGUgZnJhbWUgYnVmZmVyXG4gICAgZ2wuY2xlYXIoR0wuQ09MT1JfQlVGRkVSX0JJVCB8IEdMLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIC8vIFNhdmUgY3VycmVudCBibGVuZCBzZXR0aW5nc1xuICAgIGNvbnN0IG9sZEJsZW5kTW9kZSA9IGdldEJsZW5kTW9kZShnbCk7XG4gICAgLy8gU2V0IGJsZW5kIG1vZGUgZm9yIHBpY2tpbmdcbiAgICAvLyBhbHdheXMgb3ZlcndyaXRlIGV4aXN0aW5nIHBpeGVsIHdpdGggW3IsZyxiLGxheWVySW5kZXhdXG4gICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShnbC5PTkUsIGdsLlpFUk8sIGdsLkNPTlNUQU5UX0FMUEhBLCBnbC5aRVJPKTtcbiAgICBnbC5ibGVuZEVxdWF0aW9uKGdsLkZVTkNfQUREKTtcblxuICAgIC8vIFJlbmRlciBhbGwgcGlja2FibGUgbGF5ZXJzIGluIHBpY2tpbmcgY29sb3JzXG4gICAgbGF5ZXJzLmZvckVhY2goKGxheWVyLCBsYXllckluZGV4KSA9PiB7XG4gICAgICBpZiAobGF5ZXIucHJvcHMudmlzaWJsZSAmJiBsYXllci5wcm9wcy5waWNrYWJsZSkge1xuXG4gICAgICAgIC8vIEVuY29kZSBsYXllckluZGV4IHdpdGggYWxwaGFcbiAgICAgICAgZ2wuYmxlbmRDb2xvcigwLCAwLCAwLCAobGF5ZXJJbmRleCArIDEpIC8gMjU1KTtcblxuICAgICAgICBsYXllci5kcmF3TGF5ZXIoe1xuICAgICAgICAgIHVuaWZvcm1zOiBPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAge3JlbmRlclBpY2tpbmdCdWZmZXI6IDEsIHBpY2tpbmdFbmFibGVkOiAxfSxcbiAgICAgICAgICAgIGxheWVyLmNvbnRleHQudW5pZm9ybXMsXG4gICAgICAgICAgICBnZXRVbmlmb3Jtc0Zyb21WaWV3cG9ydChsYXllci5jb250ZXh0LnZpZXdwb3J0LCBsYXllci5wcm9wcyksXG4gICAgICAgICAgICB7bGF5ZXJJbmRleH1cbiAgICAgICAgICApXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gUmVhZCBjb2xvciBpbiB0aGUgY2VudHJhbCBwaXhlbCwgdG8gYmUgbWFwcGVkIHdpdGggcGlja2luZyBjb2xvcnNcbiAgICBjb25zdCBwaWNrZWRDb2xvciA9IG5ldyBVaW50OEFycmF5KDQpO1xuICAgIGdsLnJlYWRQaXhlbHMoZGV2aWNlWCwgZGV2aWNlWSwgMSwgMSwgR0wuUkdCQSwgR0wuVU5TSUdORURfQllURSwgcGlja2VkQ29sb3IpO1xuXG4gICAgLy8gcmVzdG9yZSBibGVuZCBtb2RlXG4gICAgc2V0QmxlbmRNb2RlKGdsLCBvbGRCbGVuZE1vZGUpO1xuICAgIC8vIFBpY2tpbmcgcHJvY2VzcyBlbmRcblxuICAgIC8vIFByb2Nlc3MgcGlja2VkIGluZm8gc3RhcnRcbiAgICAvLyBEZWNvZGUgcGlja2VkIGNvbG9yXG4gICAgY29uc3QgcGlja2VkTGF5ZXJJbmRleCA9IHBpY2tlZENvbG9yWzNdIC0gMTtcbiAgICBjb25zdCBwaWNrZWRMYXllciA9IHBpY2tlZExheWVySW5kZXggPj0gMCA/IGxheWVyc1twaWNrZWRMYXllckluZGV4XSA6IG51bGw7XG4gICAgY29uc3QgcGlja2VkT2JqZWN0SW5kZXggPSBwaWNrZWRMYXllciA/IHBpY2tlZExheWVyLmRlY29kZVBpY2tpbmdDb2xvcihwaWNrZWRDb2xvcikgOiAtMTtcbiAgICBjb25zdCBwaWNrZWRMYXllcklkID0gcGlja2VkTGF5ZXIgJiYgcGlja2VkTGF5ZXIucHJvcHMuaWQ7XG4gICAgY29uc3QgYWZmZWN0ZWRMYXllcnMgPSBwaWNrZWRMYXllciA/IFtwaWNrZWRMYXllcl0gOiBbXTtcblxuICAgIGlmIChtb2RlID09PSAnaG92ZXInKSB7XG4gICAgICAvLyBvbmx5IGludm9rZSBvbkhvdmVyIGV2ZW50cyBpZiBwaWNrZWQgb2JqZWN0IGhhcyBjaGFuZ2VkXG4gICAgICBjb25zdCBsYXN0UGlja2VkT2JqZWN0SW5kZXggPSBsYXN0UGlja2VkSW5mby5pbmRleDtcbiAgICAgIGNvbnN0IGxhc3RQaWNrZWRMYXllcklkID0gbGFzdFBpY2tlZEluZm8ubGF5ZXJJZDtcblxuICAgICAgaWYgKHBpY2tlZExheWVySWQgPT09IGxhc3RQaWNrZWRMYXllcklkICYmIHBpY2tlZE9iamVjdEluZGV4ID09PSBsYXN0UGlja2VkT2JqZWN0SW5kZXgpIHtcbiAgICAgICAgLy8gcGlja2VkIG9iamVjdCBkaWQgbm90IGNoYW5nZSwgbm8gbmVlZCB0byBwcm9jZWVkXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHBpY2tlZExheWVySWQgIT09IGxhc3RQaWNrZWRMYXllcklkKSB7XG4gICAgICAgIC8vIFdlIGNhbm5vdCBzdG9yZSBhIHJlZiB0byBsYXN0UGlja2VkTGF5ZXIgaW4gdGhlIGNvbnRleHQgYmVjYXVzZVxuICAgICAgICAvLyB0aGUgc3RhdGUgb2YgYW4gb3V0ZGF0ZWQgbGF5ZXIgaXMgbm8gbG9uZ2VyIHZhbGlkXG4gICAgICAgIC8vIGFuZCB0aGUgcHJvcHMgbWF5IGhhdmUgY2hhbmdlZFxuICAgICAgICBjb25zdCBsYXN0UGlja2VkTGF5ZXIgPSBsYXllcnMuZmluZChsID0+IGwucHJvcHMuaWQgPT09IGxhc3RQaWNrZWRMYXllcklkKTtcbiAgICAgICAgaWYgKGxhc3RQaWNrZWRMYXllcikge1xuICAgICAgICAgIC8vIExldCBsZWF2ZSBldmVudCBmaXJlIGJlZm9yZSBlbnRlciBldmVudFxuICAgICAgICAgIGFmZmVjdGVkTGF5ZXJzLnVuc2hpZnQobGFzdFBpY2tlZExheWVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgbGF5ZXIgbWFuYWdlciBjb250ZXh0XG4gICAgICBsYXN0UGlja2VkSW5mby5sYXllcklkID0gcGlja2VkTGF5ZXJJZDtcbiAgICAgIGxhc3RQaWNrZWRJbmZvLmluZGV4ID0gcGlja2VkT2JqZWN0SW5kZXg7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZUluZm8gPSBjcmVhdGVJbmZvKFt4LCB5XSwgdmlld3BvcnQpO1xuICAgIGJhc2VJbmZvLmRldmljZVBpeGVsID0gW2RldmljZVgsIGRldmljZVldO1xuICAgIGJhc2VJbmZvLnBpeGVsUmF0aW8gPSBwaXhlbFJhdGlvO1xuXG4gICAgYWZmZWN0ZWRMYXllcnMuZm9yRWFjaChsYXllciA9PiB7XG4gICAgICBsZXQgaW5mbyA9IE9iamVjdC5hc3NpZ24oe30sIGJhc2VJbmZvKTtcbiAgICAgIGluZm8ubGF5ZXIgPSBsYXllcjtcblxuICAgICAgaWYgKGxheWVyID09PSBwaWNrZWRMYXllcikge1xuICAgICAgICBpbmZvLmNvbG9yID0gcGlja2VkQ29sb3I7XG4gICAgICAgIGluZm8uaW5kZXggPSBwaWNrZWRPYmplY3RJbmRleDtcbiAgICAgICAgaW5mby5waWNrZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBMZXQgbGF5ZXJzIHBvcHVsYXRlIGl0cyBvd24gaW5mbyBvYmplY3RcbiAgICAgIGluZm8gPSBsYXllci5waWNrTGF5ZXIoe2luZm8sIG1vZGV9KTtcblxuICAgICAgLy8gSWYgbGF5ZXIuZ2V0UGlja2luZ0luZm8oKSByZXR1cm5zIG51bGwsIGRvIG5vdCBwcm9jZWVkXG4gICAgICBpZiAoaW5mbykge1xuICAgICAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIENhbGxpbmcgY2FsbGJhY2tzIGNhbiBoYXZlIGFzeW5jIGludGVyYWN0aW9ucyB3aXRoIFJlYWN0XG4gICAgICAgIC8vIHdoaWNoIG51bGxpZmllcyBsYXllci5zdGF0ZS5cbiAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgIGNhc2UgJ2NsaWNrJzogaGFuZGxlZCA9IGxheWVyLnByb3BzLm9uQ2xpY2soaW5mbyk7IGJyZWFrO1xuICAgICAgICBjYXNlICdob3Zlcic6IGhhbmRsZWQgPSBsYXllci5wcm9wcy5vbkhvdmVyKGluZm8pOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIHBpY2sgdHlwZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFoYW5kbGVkKSB7XG4gICAgICAgICAgdW5oYW5kbGVkUGlja0luZm9zLnB1c2goaW5mbyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHVuaGFuZGxlZFBpY2tJbmZvcztcbn1cbi8qIGVzbGludC1lbmFibGUgbWF4LWRlcHRoLCBtYXgtc3RhdGVtZW50cyAqL1xuXG5mdW5jdGlvbiBjcmVhdGVJbmZvKHBpeGVsLCB2aWV3cG9ydCkge1xuICAvLyBBc3NpZ24gYSBudW1iZXIgb2YgcG90ZW50aWFsbHkgdXNlZnVsIHByb3BzIHRvIHRoZSBcImluZm9cIiBvYmplY3RcbiAgcmV0dXJuIHtcbiAgICBjb2xvcjogRU1QVFlfUElYRUwsXG4gICAgaW5kZXg6IC0xLFxuICAgIHBpY2tlZDogZmFsc2UsXG4gICAgeDogcGl4ZWxbMF0sXG4gICAgeTogcGl4ZWxbMV0sXG4gICAgcGl4ZWwsXG4gICAgbG5nTGF0OiB2aWV3cG9ydC51bnByb2plY3QocGl4ZWwpXG4gIH07XG59XG4iXX0=
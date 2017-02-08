'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
// IMLEMENTATION NOTES: Why new layers are created on every render
//
// The key here is to understand the declarative / functional
// programming nature of "reactive" applications.
//
// - In a reactive application, the entire "UI tree"
//   is re-rendered every time something in the application changes.
//
// - The UI framework (such as React or deck.gl) then diffs the rendered
//   tree of UI elements (React Elements or deck.gl Layers) against the
//   previously tree and makes optimized changes (to the DOM or to WebGL state).
//
// - Deck.gl layers are not based on React.
//   But it should be possible to wrap deck.gl layers in React components to
//   enable use of JSX.
//
// The deck.gl model that for the app creates a new set of on layers on every
// render.
// Internally, the new layers are efficiently matched against existing layers
// using layer ids.
//
// All calculated state (programs, attributes etc) are stored in a state object
// and this state object is moved forward to the match layer on every render
// cycle.  The new layer ends up with the state of the old layer (and the
// props of the new layer), while the old layer is simply discarded for
// garbage collecion.
//
/* eslint-disable no-try-catch */

// import {Viewport} from 'viewport-mercator-project';


var _layer = require('./layer');

var _layer2 = _interopRequireDefault(_layer);

var _utils = require('./utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _drawAndPick = require('./draw-and-pick');

var _viewports = require('./viewports');

var _luma = require('luma.gl');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LayerManager = function () {
  function LayerManager(_ref) {
    var gl = _ref.gl;

    _classCallCheck(this, LayerManager);

    this.prevLayers = [];
    this.layers = [];
    // Tracks if any layers were drawn last update
    // Needed to ensure that screen is cleared when no layers are shown
    this.screenCleared = false;
    this.oldContext = {};
    this.context = {
      gl: gl,
      uniforms: {},
      viewport: null,
      viewportChanged: true,
      pickingFBO: null
    };
    Object.seal(this.context);
  }

  _createClass(LayerManager, [{
    key: 'setViewport',
    value: function setViewport(viewport) {
      (0, _assert2.default)(viewport instanceof _viewports.Viewport, 'Invalid viewport');

      // TODO - viewport change detection breaks METER_OFFSETS mode
      // const oldViewport = this.context.viewport;
      // const viewportChanged = !oldViewport || !viewport.equals(oldViewport);

      var viewportChanged = true;

      if (viewportChanged) {
        Object.assign(this.oldContext, this.context);
        this.context.viewport = viewport;
        this.context.viewportChanged = true;
        this.context.uniforms = {};
        (0, _utils.log)(4, viewport);
      }

      return this;
    }
  }, {
    key: 'updateLayers',
    value: function updateLayers(_ref2) {
      var newLayers = _ref2.newLayers;

      /* eslint-disable */
      (0, _assert2.default)(this.context.viewport, 'LayerManager.updateLayers: viewport not set');

      // Filter out any null layers
      newLayers = newLayers.filter(function (newLayer) {
        return newLayer !== null;
      });

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = newLayers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var layer = _step.value;

          layer.context = this.context;
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

      this.prevLayers = this.layers;

      var _updateLayers2 = this._updateLayers({
        oldLayers: this.prevLayers,
        newLayers: newLayers
      }),
          error = _updateLayers2.error,
          generatedLayers = _updateLayers2.generatedLayers;

      this.layers = generatedLayers;
      // Throw first error found, if any
      if (error) {
        throw error;
      }
      return this;
    }
  }, {
    key: 'drawLayers',
    value: function drawLayers(_ref3) {
      var pass = _ref3.pass;

      (0, _assert2.default)(this.context.viewport, 'LayerManager.drawLayers: viewport not set');

      (0, _drawAndPick.drawLayers)({ layers: this.layers, pass: pass });

      return this;
    }
  }, {
    key: 'pickLayer',
    value: function pickLayer(_ref4) {
      var x = _ref4.x,
          y = _ref4.y,
          mode = _ref4.mode;
      var _context = this.context,
          gl = _context.gl,
          uniforms = _context.uniforms;

      // Set up a frame buffer if needed

      if (this.context.pickingFBO === null || gl.canvas.width !== this.context.pickingFBO.width || gl.canvas.height !== this.context.pickingFBO.height) {
        this.context.pickingFBO = new _luma.FramebufferObject(gl, {
          width: gl.canvas.width,
          height: gl.canvas.height
        });
      }
      return (0, _drawAndPick.pickLayers)(gl, {
        x: x,
        y: y,
        uniforms: {
          renderPickingBuffer: true,
          picking_uEnable: true
        },
        layers: this.layers,
        mode: mode,
        pickingFBO: this.context.pickingFBO
      });
    }
  }, {
    key: 'needsRedraw',
    value: function needsRedraw() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref5$clearRedrawFlag = _ref5.clearRedrawFlags,
          clearRedrawFlags = _ref5$clearRedrawFlag === undefined ? false : _ref5$clearRedrawFlag;

      if (!this.context.viewport) {
        return false;
      }

      var redraw = false;

      // Make sure that buffer is cleared once when layer list becomes empty
      if (this.layers.length === 0) {
        if (this.screenCleared === false) {
          redraw = true;
          this.screenCleared = true;
          return true;
        }
      } else {
        if (this.screenCleared === true) {
          this.screenCleared = false;
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.layers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var layer = _step2.value;

          redraw = redraw || layer.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
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

      return redraw;
    }

    // PRIVATE METHODS

    // Match all layers, checking for caught errors
    // To avoid having an exception in one layer disrupt other layers

  }, {
    key: '_updateLayers',
    value: function _updateLayers(_ref6) {
      var oldLayers = _ref6.oldLayers,
          newLayers = _ref6.newLayers;

      // Create old layer map
      var oldLayerMap = {};
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = oldLayers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var oldLayer = _step3.value;

          if (oldLayerMap[oldLayer.id]) {
            _utils.log.once(0, 'Multipe old layers with same id ' + layerName(oldLayer));
          } else {
            oldLayerMap[oldLayer.id] = oldLayer;
          }
        }

        // Allocate array for generated layers
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

      var generatedLayers = [];

      // Match sublayers
      var error = this._matchSublayers({
        newLayers: newLayers, oldLayerMap: oldLayerMap, generatedLayers: generatedLayers
      });

      var error2 = this._finalizeOldLayers(oldLayers);
      var firstError = error || error2;
      return { error: firstError, generatedLayers: generatedLayers };
    }

    /* eslint-disable max-statements */

  }, {
    key: '_matchSublayers',
    value: function _matchSublayers(_ref7) {
      var newLayers = _ref7.newLayers,
          oldLayerMap = _ref7.oldLayerMap,
          generatedLayers = _ref7.generatedLayers;

      // Filter out any null layers
      newLayers = newLayers.filter(function (newLayer) {
        return newLayer !== null;
      });

      var error = null;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = newLayers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var newLayer = _step4.value;

          newLayer.context = this.context;

          try {
            // 1. given a new coming layer, find its matching layer
            var oldLayer = oldLayerMap[newLayer.id];
            oldLayerMap[newLayer.id] = null;

            if (oldLayer === null) {
              _utils.log.once(0, 'Multipe new layers with same id ' + layerName(newLayer));
            }

            // Only transfer state at this stage. We must not generate exceptions
            // until all layers' state have been transferred
            if (oldLayer) {
              (0, _utils.log)(3, 'matched ' + layerName(newLayer), oldLayer, '=>', newLayer);
              this._transferLayerState(oldLayer, newLayer);
              this._updateLayer(newLayer);
            } else {
              this._initializeNewLayer(newLayer);
            }
            generatedLayers.push(newLayer);

            // Call layer lifecycle method: render sublayers
            var sublayers = newLayer.renderLayers();
            // End layer lifecycle method: render sublayers

            if (sublayers) {
              sublayers = Array.isArray(sublayers) ? sublayers : [sublayers];
              this._matchSublayers({
                newLayers: sublayers,
                oldLayerMap: oldLayerMap,
                generatedLayers: generatedLayers
              });
            }
          } catch (err) {
            _utils.log.once(0, 'deck.gl error during matching of ' + layerName(newLayer) + ' ' + err, err);
            // Save first error
            error = error || err;
          }
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

      return error;
    }
  }, {
    key: '_transferLayerState',
    value: function _transferLayerState(oldLayer, newLayer) {
      var state = oldLayer.state,
          props = oldLayer.props;

      // sanity check

      (0, _assert2.default)(state, 'deck.gl sanity check - Matching layer has no state');
      (0, _assert2.default)(oldLayer !== newLayer, 'deck.gl sanity check - Matching layer is same');

      // Move state
      newLayer.state = state;
      state.layer = newLayer;

      // Update model layer reference
      if (state.model) {
        state.model.userData.layer = newLayer;
      }
      // Keep a temporary ref to the old props, for prop comparison
      newLayer.oldProps = props;
      oldLayer.state = null;
    }

    // Update the old layers that were not matched

  }, {
    key: '_finalizeOldLayers',
    value: function _finalizeOldLayers(oldLayers) {
      var error = null;
      // Unmatched layers still have state, it will be discarded
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = oldLayers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var layer = _step5.value;

          if (layer.state) {
            error = error || this._finalizeLayer(layer);
          }
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

      return error;
    }

    // Initializes a single layer, calling layer methods

  }, {
    key: '_initializeNewLayer',
    value: function _initializeNewLayer(layer) {
      var error = null;
      // Check if new layer, and initialize it's state
      if (!layer.state) {
        (0, _utils.log)(1, 'initializing ' + layerName(layer));
        try {
          layer.initializeLayer({
            oldProps: {},
            props: layer.props,
            oldContext: this.oldContext,
            context: this.context,
            changeFlags: layer.diffProps({}, layer.props, this.context)
          });
        } catch (err) {
          _utils.log.once(0, 'deck.gl error during initialization of ' + layerName(layer) + ' ' + err, err);
          // Save first error
          error = error || err;
        }
        // Set back pointer (used in picking)
        if (layer.state) {
          layer.state.layer = layer;
          // Save layer on model for picking purposes
          // TODO - store on model.userData rather than directly on model
        }
        if (layer.state && layer.state.model) {
          layer.state.model.userData.layer = layer;
        }
      }
      return error;
    }

    // Updates a single layer, calling layer methods

  }, {
    key: '_updateLayer',
    value: function _updateLayer(layer) {
      var oldProps = layer.oldProps,
          props = layer.props;

      var error = null;
      if (oldProps) {
        try {
          layer.updateLayer({
            oldProps: oldProps,
            props: props,
            context: this.context,
            oldContext: this.oldContext,
            changeFlags: layer.diffProps(oldProps, layer.props, this.context)
          });
        } catch (err) {
          _utils.log.once(0, 'deck.gl error during update of ' + layerName(layer), err);
          // Save first error
          error = err;
        }
        (0, _utils.log)(2, 'updating ' + layerName(layer));
      }
      return error;
    }

    // Finalizes a single layer

  }, {
    key: '_finalizeLayer',
    value: function _finalizeLayer(layer) {
      var error = null;
      var state = layer.state;

      if (state) {
        try {
          layer.finalizeLayer();
        } catch (err) {
          _utils.log.once(0, 'deck.gl error during finalization of ' + layerName(layer), err);
          // Save first error
          error = err;
        }
        layer.state = null;
        (0, _utils.log)(1, 'finalizing ' + layerName(layer));
      }
      return error;
    }
  }]);

  return LayerManager;
}();

exports.default = LayerManager;


function layerName(layer) {
  if (layer instanceof _layer2.default) {
    return '' + layer;
  }
  return !layer ? 'null layer' : 'invalid layer';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvbGF5ZXItbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJMYXllck1hbmFnZXIiLCJnbCIsInByZXZMYXllcnMiLCJsYXllcnMiLCJzY3JlZW5DbGVhcmVkIiwib2xkQ29udGV4dCIsImNvbnRleHQiLCJ1bmlmb3JtcyIsInZpZXdwb3J0Iiwidmlld3BvcnRDaGFuZ2VkIiwicGlja2luZ0ZCTyIsIk9iamVjdCIsInNlYWwiLCJhc3NpZ24iLCJuZXdMYXllcnMiLCJmaWx0ZXIiLCJuZXdMYXllciIsImxheWVyIiwiX3VwZGF0ZUxheWVycyIsIm9sZExheWVycyIsImVycm9yIiwiZ2VuZXJhdGVkTGF5ZXJzIiwicGFzcyIsIngiLCJ5IiwibW9kZSIsImNhbnZhcyIsIndpZHRoIiwiaGVpZ2h0IiwicmVuZGVyUGlja2luZ0J1ZmZlciIsInBpY2tpbmdfdUVuYWJsZSIsImNsZWFyUmVkcmF3RmxhZ3MiLCJyZWRyYXciLCJsZW5ndGgiLCJnZXROZWVkc1JlZHJhdyIsIm9sZExheWVyTWFwIiwib2xkTGF5ZXIiLCJpZCIsIm9uY2UiLCJsYXllck5hbWUiLCJfbWF0Y2hTdWJsYXllcnMiLCJlcnJvcjIiLCJfZmluYWxpemVPbGRMYXllcnMiLCJmaXJzdEVycm9yIiwiX3RyYW5zZmVyTGF5ZXJTdGF0ZSIsIl91cGRhdGVMYXllciIsIl9pbml0aWFsaXplTmV3TGF5ZXIiLCJwdXNoIiwic3VibGF5ZXJzIiwicmVuZGVyTGF5ZXJzIiwiQXJyYXkiLCJpc0FycmF5IiwiZXJyIiwic3RhdGUiLCJwcm9wcyIsIm1vZGVsIiwidXNlckRhdGEiLCJvbGRQcm9wcyIsIl9maW5hbGl6ZUxheWVyIiwiaW5pdGlhbGl6ZUxheWVyIiwiY2hhbmdlRmxhZ3MiLCJkaWZmUHJvcHMiLCJ1cGRhdGVMYXllciIsImZpbmFsaXplTGF5ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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O0FBQ0RuQyxjQUFNb0MsS0FBTixHQUFjLElBQWQ7QUFDQSx3QkFBSSxDQUFKLGtCQUFxQmQsVUFBVXRCLEtBQVYsQ0FBckI7QUFDRDtBQUNELGFBQU9HLEtBQVA7QUFDRDs7Ozs7O2tCQW5Ua0JwQixZOzs7QUFzVHJCLFNBQVN1QyxTQUFULENBQW1CdEIsS0FBbkIsRUFBMEI7QUFDeEIsTUFBSUEsZ0NBQUosRUFBNEI7QUFDMUIsZ0JBQVVBLEtBQVY7QUFDRDtBQUNELFNBQU8sQ0FBQ0EsS0FBRCxHQUFTLFlBQVQsR0FBd0IsZUFBL0I7QUFDRCIsImZpbGUiOiJsYXllci1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBJTUxFTUVOVEFUSU9OIE5PVEVTOiBXaHkgbmV3IGxheWVycyBhcmUgY3JlYXRlZCBvbiBldmVyeSByZW5kZXJcbi8vXG4vLyBUaGUga2V5IGhlcmUgaXMgdG8gdW5kZXJzdGFuZCB0aGUgZGVjbGFyYXRpdmUgLyBmdW5jdGlvbmFsXG4vLyBwcm9ncmFtbWluZyBuYXR1cmUgb2YgXCJyZWFjdGl2ZVwiIGFwcGxpY2F0aW9ucy5cbi8vXG4vLyAtIEluIGEgcmVhY3RpdmUgYXBwbGljYXRpb24sIHRoZSBlbnRpcmUgXCJVSSB0cmVlXCJcbi8vICAgaXMgcmUtcmVuZGVyZWQgZXZlcnkgdGltZSBzb21ldGhpbmcgaW4gdGhlIGFwcGxpY2F0aW9uIGNoYW5nZXMuXG4vL1xuLy8gLSBUaGUgVUkgZnJhbWV3b3JrIChzdWNoIGFzIFJlYWN0IG9yIGRlY2suZ2wpIHRoZW4gZGlmZnMgdGhlIHJlbmRlcmVkXG4vLyAgIHRyZWUgb2YgVUkgZWxlbWVudHMgKFJlYWN0IEVsZW1lbnRzIG9yIGRlY2suZ2wgTGF5ZXJzKSBhZ2FpbnN0IHRoZVxuLy8gICBwcmV2aW91c2x5IHRyZWUgYW5kIG1ha2VzIG9wdGltaXplZCBjaGFuZ2VzICh0byB0aGUgRE9NIG9yIHRvIFdlYkdMIHN0YXRlKS5cbi8vXG4vLyAtIERlY2suZ2wgbGF5ZXJzIGFyZSBub3QgYmFzZWQgb24gUmVhY3QuXG4vLyAgIEJ1dCBpdCBzaG91bGQgYmUgcG9zc2libGUgdG8gd3JhcCBkZWNrLmdsIGxheWVycyBpbiBSZWFjdCBjb21wb25lbnRzIHRvXG4vLyAgIGVuYWJsZSB1c2Ugb2YgSlNYLlxuLy9cbi8vIFRoZSBkZWNrLmdsIG1vZGVsIHRoYXQgZm9yIHRoZSBhcHAgY3JlYXRlcyBhIG5ldyBzZXQgb2Ygb24gbGF5ZXJzIG9uIGV2ZXJ5XG4vLyByZW5kZXIuXG4vLyBJbnRlcm5hbGx5LCB0aGUgbmV3IGxheWVycyBhcmUgZWZmaWNpZW50bHkgbWF0Y2hlZCBhZ2FpbnN0IGV4aXN0aW5nIGxheWVyc1xuLy8gdXNpbmcgbGF5ZXIgaWRzLlxuLy9cbi8vIEFsbCBjYWxjdWxhdGVkIHN0YXRlIChwcm9ncmFtcywgYXR0cmlidXRlcyBldGMpIGFyZSBzdG9yZWQgaW4gYSBzdGF0ZSBvYmplY3Rcbi8vIGFuZCB0aGlzIHN0YXRlIG9iamVjdCBpcyBtb3ZlZCBmb3J3YXJkIHRvIHRoZSBtYXRjaCBsYXllciBvbiBldmVyeSByZW5kZXJcbi8vIGN5Y2xlLiAgVGhlIG5ldyBsYXllciBlbmRzIHVwIHdpdGggdGhlIHN0YXRlIG9mIHRoZSBvbGQgbGF5ZXIgKGFuZCB0aGVcbi8vIHByb3BzIG9mIHRoZSBuZXcgbGF5ZXIpLCB3aGlsZSB0aGUgb2xkIGxheWVyIGlzIHNpbXBseSBkaXNjYXJkZWQgZm9yXG4vLyBnYXJiYWdlIGNvbGxlY2lvbi5cbi8vXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2ggKi9cbmltcG9ydCBMYXllciBmcm9tICcuL2xheWVyJztcbmltcG9ydCB7bG9nfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7ZHJhd0xheWVycywgcGlja0xheWVyc30gZnJvbSAnLi9kcmF3LWFuZC1waWNrJztcbi8vIGltcG9ydCB7Vmlld3BvcnR9IGZyb20gJ3ZpZXdwb3J0LW1lcmNhdG9yLXByb2plY3QnO1xuaW1wb3J0IHtWaWV3cG9ydH0gZnJvbSAnLi92aWV3cG9ydHMnO1xuXG5pbXBvcnQge0ZyYW1lYnVmZmVyT2JqZWN0fSBmcm9tICdsdW1hLmdsJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGF5ZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3Ioe2dsfSkge1xuICAgIHRoaXMucHJldkxheWVycyA9IFtdO1xuICAgIHRoaXMubGF5ZXJzID0gW107XG4gICAgLy8gVHJhY2tzIGlmIGFueSBsYXllcnMgd2VyZSBkcmF3biBsYXN0IHVwZGF0ZVxuICAgIC8vIE5lZWRlZCB0byBlbnN1cmUgdGhhdCBzY3JlZW4gaXMgY2xlYXJlZCB3aGVuIG5vIGxheWVycyBhcmUgc2hvd25cbiAgICB0aGlzLnNjcmVlbkNsZWFyZWQgPSBmYWxzZTtcbiAgICB0aGlzLm9sZENvbnRleHQgPSB7fTtcbiAgICB0aGlzLmNvbnRleHQgPSB7XG4gICAgICBnbCxcbiAgICAgIHVuaWZvcm1zOiB7fSxcbiAgICAgIHZpZXdwb3J0OiBudWxsLFxuICAgICAgdmlld3BvcnRDaGFuZ2VkOiB0cnVlLFxuICAgICAgcGlja2luZ0ZCTzogbnVsbFxuICAgIH07XG4gICAgT2JqZWN0LnNlYWwodGhpcy5jb250ZXh0KTtcbiAgfVxuXG4gIHNldFZpZXdwb3J0KHZpZXdwb3J0KSB7XG4gICAgYXNzZXJ0KHZpZXdwb3J0IGluc3RhbmNlb2YgVmlld3BvcnQsICdJbnZhbGlkIHZpZXdwb3J0Jyk7XG5cbiAgICAvLyBUT0RPIC0gdmlld3BvcnQgY2hhbmdlIGRldGVjdGlvbiBicmVha3MgTUVURVJfT0ZGU0VUUyBtb2RlXG4gICAgLy8gY29uc3Qgb2xkVmlld3BvcnQgPSB0aGlzLmNvbnRleHQudmlld3BvcnQ7XG4gICAgLy8gY29uc3Qgdmlld3BvcnRDaGFuZ2VkID0gIW9sZFZpZXdwb3J0IHx8ICF2aWV3cG9ydC5lcXVhbHMob2xkVmlld3BvcnQpO1xuXG4gICAgY29uc3Qgdmlld3BvcnRDaGFuZ2VkID0gdHJ1ZTtcblxuICAgIGlmICh2aWV3cG9ydENoYW5nZWQpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5vbGRDb250ZXh0LCB0aGlzLmNvbnRleHQpO1xuICAgICAgdGhpcy5jb250ZXh0LnZpZXdwb3J0ID0gdmlld3BvcnQ7XG4gICAgICB0aGlzLmNvbnRleHQudmlld3BvcnRDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29udGV4dC51bmlmb3JtcyA9IHt9O1xuICAgICAgbG9nKDQsIHZpZXdwb3J0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVwZGF0ZUxheWVycyh7bmV3TGF5ZXJzfSkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlICovXG4gICAgYXNzZXJ0KHRoaXMuY29udGV4dC52aWV3cG9ydCxcbiAgICAgICdMYXllck1hbmFnZXIudXBkYXRlTGF5ZXJzOiB2aWV3cG9ydCBub3Qgc2V0Jyk7XG5cbiAgICAvLyBGaWx0ZXIgb3V0IGFueSBudWxsIGxheWVyc1xuICAgIG5ld0xheWVycyA9IG5ld0xheWVycy5maWx0ZXIobmV3TGF5ZXIgPT4gbmV3TGF5ZXIgIT09IG51bGwpO1xuXG4gICAgZm9yIChjb25zdCBsYXllciBvZiBuZXdMYXllcnMpIHtcbiAgICAgIGxheWVyLmNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgfVxuXG4gICAgdGhpcy5wcmV2TGF5ZXJzID0gdGhpcy5sYXllcnM7XG4gICAgY29uc3Qge2Vycm9yLCBnZW5lcmF0ZWRMYXllcnN9ID0gdGhpcy5fdXBkYXRlTGF5ZXJzKHtcbiAgICAgIG9sZExheWVyczogdGhpcy5wcmV2TGF5ZXJzLFxuICAgICAgbmV3TGF5ZXJzXG4gICAgfSk7XG5cbiAgICB0aGlzLmxheWVycyA9IGdlbmVyYXRlZExheWVycztcbiAgICAvLyBUaHJvdyBmaXJzdCBlcnJvciBmb3VuZCwgaWYgYW55XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkcmF3TGF5ZXJzKHtwYXNzfSkge1xuICAgIGFzc2VydCh0aGlzLmNvbnRleHQudmlld3BvcnQsICdMYXllck1hbmFnZXIuZHJhd0xheWVyczogdmlld3BvcnQgbm90IHNldCcpO1xuXG4gICAgZHJhd0xheWVycyh7bGF5ZXJzOiB0aGlzLmxheWVycywgcGFzc30pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwaWNrTGF5ZXIoe3gsIHksIG1vZGV9KSB7XG4gICAgY29uc3Qge2dsLCB1bmlmb3Jtc30gPSB0aGlzLmNvbnRleHQ7XG5cbiAgICAvLyBTZXQgdXAgYSBmcmFtZSBidWZmZXIgaWYgbmVlZGVkXG4gICAgaWYgKHRoaXMuY29udGV4dC5waWNraW5nRkJPID09PSBudWxsIHx8XG4gICAgICBnbC5jYW52YXMud2lkdGggIT09IHRoaXMuY29udGV4dC5waWNraW5nRkJPLndpZHRoIHx8XG4gICAgICBnbC5jYW52YXMuaGVpZ2h0ICE9PSB0aGlzLmNvbnRleHQucGlja2luZ0ZCTy5oZWlnaHQpIHtcbiAgICAgIHRoaXMuY29udGV4dC5waWNraW5nRkJPID0gbmV3IEZyYW1lYnVmZmVyT2JqZWN0KGdsLCB7XG4gICAgICAgIHdpZHRoOiBnbC5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogZ2wuY2FudmFzLmhlaWdodFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwaWNrTGF5ZXJzKGdsLCB7XG4gICAgICB4LFxuICAgICAgeSxcbiAgICAgIHVuaWZvcm1zOiB7XG4gICAgICAgIHJlbmRlclBpY2tpbmdCdWZmZXI6IHRydWUsXG4gICAgICAgIHBpY2tpbmdfdUVuYWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGxheWVyczogdGhpcy5sYXllcnMsXG4gICAgICBtb2RlLFxuICAgICAgcGlja2luZ0ZCTzogdGhpcy5jb250ZXh0LnBpY2tpbmdGQk9cbiAgICB9KTtcbiAgfVxuXG4gIG5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICBpZiAoIXRoaXMuY29udGV4dC52aWV3cG9ydCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCByZWRyYXcgPSBmYWxzZTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpcyBjbGVhcmVkIG9uY2Ugd2hlbiBsYXllciBsaXN0IGJlY29tZXMgZW1wdHlcbiAgICBpZiAodGhpcy5sYXllcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAodGhpcy5zY3JlZW5DbGVhcmVkID09PSBmYWxzZSkge1xuICAgICAgICByZWRyYXcgPSB0cnVlO1xuICAgICAgICB0aGlzLnNjcmVlbkNsZWFyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuc2NyZWVuQ2xlYXJlZCA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnNjcmVlbkNsZWFyZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGxheWVyIG9mIHRoaXMubGF5ZXJzKSB7XG4gICAgICByZWRyYXcgPSByZWRyYXcgfHwgbGF5ZXIuZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3N9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlZHJhdztcbiAgfVxuXG4gIC8vIFBSSVZBVEUgTUVUSE9EU1xuXG4gIC8vIE1hdGNoIGFsbCBsYXllcnMsIGNoZWNraW5nIGZvciBjYXVnaHQgZXJyb3JzXG4gIC8vIFRvIGF2b2lkIGhhdmluZyBhbiBleGNlcHRpb24gaW4gb25lIGxheWVyIGRpc3J1cHQgb3RoZXIgbGF5ZXJzXG4gIF91cGRhdGVMYXllcnMoe29sZExheWVycywgbmV3TGF5ZXJzfSkge1xuICAgIC8vIENyZWF0ZSBvbGQgbGF5ZXIgbWFwXG4gICAgY29uc3Qgb2xkTGF5ZXJNYXAgPSB7fTtcbiAgICBmb3IgKGNvbnN0IG9sZExheWVyIG9mIG9sZExheWVycykge1xuICAgICAgaWYgKG9sZExheWVyTWFwW29sZExheWVyLmlkXSkge1xuICAgICAgICBsb2cub25jZSgwLCBgTXVsdGlwZSBvbGQgbGF5ZXJzIHdpdGggc2FtZSBpZCAke2xheWVyTmFtZShvbGRMYXllcil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvbGRMYXllck1hcFtvbGRMYXllci5pZF0gPSBvbGRMYXllcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbGxvY2F0ZSBhcnJheSBmb3IgZ2VuZXJhdGVkIGxheWVyc1xuICAgIGNvbnN0IGdlbmVyYXRlZExheWVycyA9IFtdO1xuXG4gICAgLy8gTWF0Y2ggc3VibGF5ZXJzXG4gICAgY29uc3QgZXJyb3IgPSB0aGlzLl9tYXRjaFN1YmxheWVycyh7XG4gICAgICBuZXdMYXllcnMsIG9sZExheWVyTWFwLCBnZW5lcmF0ZWRMYXllcnNcbiAgICB9KTtcblxuICAgIGNvbnN0IGVycm9yMiA9IHRoaXMuX2ZpbmFsaXplT2xkTGF5ZXJzKG9sZExheWVycyk7XG4gICAgY29uc3QgZmlyc3RFcnJvciA9IGVycm9yIHx8IGVycm9yMjtcbiAgICByZXR1cm4ge2Vycm9yOiBmaXJzdEVycm9yLCBnZW5lcmF0ZWRMYXllcnN9O1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgX21hdGNoU3VibGF5ZXJzKHtuZXdMYXllcnMsIG9sZExheWVyTWFwLCBnZW5lcmF0ZWRMYXllcnN9KSB7XG4gICAgLy8gRmlsdGVyIG91dCBhbnkgbnVsbCBsYXllcnNcbiAgICBuZXdMYXllcnMgPSBuZXdMYXllcnMuZmlsdGVyKG5ld0xheWVyID0+IG5ld0xheWVyICE9PSBudWxsKTtcblxuICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgZm9yIChjb25zdCBuZXdMYXllciBvZiBuZXdMYXllcnMpIHtcbiAgICAgIG5ld0xheWVyLmNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIDEuIGdpdmVuIGEgbmV3IGNvbWluZyBsYXllciwgZmluZCBpdHMgbWF0Y2hpbmcgbGF5ZXJcbiAgICAgICAgY29uc3Qgb2xkTGF5ZXIgPSBvbGRMYXllck1hcFtuZXdMYXllci5pZF07XG4gICAgICAgIG9sZExheWVyTWFwW25ld0xheWVyLmlkXSA9IG51bGw7XG5cbiAgICAgICAgaWYgKG9sZExheWVyID09PSBudWxsKSB7XG4gICAgICAgICAgbG9nLm9uY2UoMCwgYE11bHRpcGUgbmV3IGxheWVycyB3aXRoIHNhbWUgaWQgJHtsYXllck5hbWUobmV3TGF5ZXIpfWApO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBPbmx5IHRyYW5zZmVyIHN0YXRlIGF0IHRoaXMgc3RhZ2UuIFdlIG11c3Qgbm90IGdlbmVyYXRlIGV4Y2VwdGlvbnNcbiAgICAgICAgLy8gdW50aWwgYWxsIGxheWVycycgc3RhdGUgaGF2ZSBiZWVuIHRyYW5zZmVycmVkXG4gICAgICAgIGlmIChvbGRMYXllcikge1xuICAgICAgICAgIGxvZygzLCBgbWF0Y2hlZCAke2xheWVyTmFtZShuZXdMYXllcil9YCwgb2xkTGF5ZXIsICc9PicsIG5ld0xheWVyKTtcbiAgICAgICAgICB0aGlzLl90cmFuc2ZlckxheWVyU3RhdGUob2xkTGF5ZXIsIG5ld0xheWVyKTtcbiAgICAgICAgICB0aGlzLl91cGRhdGVMYXllcihuZXdMYXllcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZU5ld0xheWVyKG5ld0xheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5lcmF0ZWRMYXllcnMucHVzaChuZXdMYXllcik7XG5cbiAgICAgICAgLy8gQ2FsbCBsYXllciBsaWZlY3ljbGUgbWV0aG9kOiByZW5kZXIgc3VibGF5ZXJzXG4gICAgICAgIGxldCBzdWJsYXllcnMgPSBuZXdMYXllci5yZW5kZXJMYXllcnMoKTtcbiAgICAgICAgLy8gRW5kIGxheWVyIGxpZmVjeWNsZSBtZXRob2Q6IHJlbmRlciBzdWJsYXllcnNcblxuICAgICAgICBpZiAoc3VibGF5ZXJzKSB7XG4gICAgICAgICAgc3VibGF5ZXJzID0gQXJyYXkuaXNBcnJheShzdWJsYXllcnMpID8gc3VibGF5ZXJzIDogW3N1YmxheWVyc107XG4gICAgICAgICAgdGhpcy5fbWF0Y2hTdWJsYXllcnMoe1xuICAgICAgICAgICAgbmV3TGF5ZXJzOiBzdWJsYXllcnMsXG4gICAgICAgICAgICBvbGRMYXllck1hcCxcbiAgICAgICAgICAgIGdlbmVyYXRlZExheWVyc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLm9uY2UoMCxcbiAgICAgICAgICBgZGVjay5nbCBlcnJvciBkdXJpbmcgbWF0Y2hpbmcgb2YgJHtsYXllck5hbWUobmV3TGF5ZXIpfSAke2Vycn1gLCBlcnIpO1xuICAgICAgICAvLyBTYXZlIGZpcnN0IGVycm9yXG4gICAgICAgIGVycm9yID0gZXJyb3IgfHwgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICBfdHJhbnNmZXJMYXllclN0YXRlKG9sZExheWVyLCBuZXdMYXllcikge1xuICAgIGNvbnN0IHtzdGF0ZSwgcHJvcHN9ID0gb2xkTGF5ZXI7XG5cbiAgICAvLyBzYW5pdHkgY2hlY2tcbiAgICBhc3NlcnQoc3RhdGUsICdkZWNrLmdsIHNhbml0eSBjaGVjayAtIE1hdGNoaW5nIGxheWVyIGhhcyBubyBzdGF0ZScpO1xuICAgIGFzc2VydChvbGRMYXllciAhPT0gbmV3TGF5ZXIsICdkZWNrLmdsIHNhbml0eSBjaGVjayAtIE1hdGNoaW5nIGxheWVyIGlzIHNhbWUnKTtcblxuICAgIC8vIE1vdmUgc3RhdGVcbiAgICBuZXdMYXllci5zdGF0ZSA9IHN0YXRlO1xuICAgIHN0YXRlLmxheWVyID0gbmV3TGF5ZXI7XG5cbiAgICAvLyBVcGRhdGUgbW9kZWwgbGF5ZXIgcmVmZXJlbmNlXG4gICAgaWYgKHN0YXRlLm1vZGVsKSB7XG4gICAgICBzdGF0ZS5tb2RlbC51c2VyRGF0YS5sYXllciA9IG5ld0xheWVyO1xuICAgIH1cbiAgICAvLyBLZWVwIGEgdGVtcG9yYXJ5IHJlZiB0byB0aGUgb2xkIHByb3BzLCBmb3IgcHJvcCBjb21wYXJpc29uXG4gICAgbmV3TGF5ZXIub2xkUHJvcHMgPSBwcm9wcztcbiAgICBvbGRMYXllci5zdGF0ZSA9IG51bGw7XG4gIH1cblxuICAvLyBVcGRhdGUgdGhlIG9sZCBsYXllcnMgdGhhdCB3ZXJlIG5vdCBtYXRjaGVkXG4gIF9maW5hbGl6ZU9sZExheWVycyhvbGRMYXllcnMpIHtcbiAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgIC8vIFVubWF0Y2hlZCBsYXllcnMgc3RpbGwgaGF2ZSBzdGF0ZSwgaXQgd2lsbCBiZSBkaXNjYXJkZWRcbiAgICBmb3IgKGNvbnN0IGxheWVyIG9mIG9sZExheWVycykge1xuICAgICAgaWYgKGxheWVyLnN0YXRlKSB7XG4gICAgICAgIGVycm9yID0gZXJyb3IgfHwgdGhpcy5fZmluYWxpemVMYXllcihsYXllcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemVzIGEgc2luZ2xlIGxheWVyLCBjYWxsaW5nIGxheWVyIG1ldGhvZHNcbiAgX2luaXRpYWxpemVOZXdMYXllcihsYXllcikge1xuICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgLy8gQ2hlY2sgaWYgbmV3IGxheWVyLCBhbmQgaW5pdGlhbGl6ZSBpdCdzIHN0YXRlXG4gICAgaWYgKCFsYXllci5zdGF0ZSkge1xuICAgICAgbG9nKDEsIGBpbml0aWFsaXppbmcgJHtsYXllck5hbWUobGF5ZXIpfWApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGF5ZXIuaW5pdGlhbGl6ZUxheWVyKHtcbiAgICAgICAgICBvbGRQcm9wczoge30sXG4gICAgICAgICAgcHJvcHM6IGxheWVyLnByb3BzLFxuICAgICAgICAgIG9sZENvbnRleHQ6IHRoaXMub2xkQ29udGV4dCxcbiAgICAgICAgICBjb250ZXh0OiB0aGlzLmNvbnRleHQsXG4gICAgICAgICAgY2hhbmdlRmxhZ3M6IGxheWVyLmRpZmZQcm9wcyh7fSwgbGF5ZXIucHJvcHMsIHRoaXMuY29udGV4dClcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLm9uY2UoMCwgYGRlY2suZ2wgZXJyb3IgZHVyaW5nIGluaXRpYWxpemF0aW9uIG9mICR7bGF5ZXJOYW1lKGxheWVyKX0gJHtlcnJ9YCwgZXJyKTtcbiAgICAgICAgLy8gU2F2ZSBmaXJzdCBlcnJvclxuICAgICAgICBlcnJvciA9IGVycm9yIHx8IGVycjtcbiAgICAgIH1cbiAgICAgIC8vIFNldCBiYWNrIHBvaW50ZXIgKHVzZWQgaW4gcGlja2luZylcbiAgICAgIGlmIChsYXllci5zdGF0ZSkge1xuICAgICAgICBsYXllci5zdGF0ZS5sYXllciA9IGxheWVyO1xuICAgICAgICAvLyBTYXZlIGxheWVyIG9uIG1vZGVsIGZvciBwaWNraW5nIHB1cnBvc2VzXG4gICAgICAgIC8vIFRPRE8gLSBzdG9yZSBvbiBtb2RlbC51c2VyRGF0YSByYXRoZXIgdGhhbiBkaXJlY3RseSBvbiBtb2RlbFxuICAgICAgfVxuICAgICAgaWYgKGxheWVyLnN0YXRlICYmIGxheWVyLnN0YXRlLm1vZGVsKSB7XG4gICAgICAgIGxheWVyLnN0YXRlLm1vZGVsLnVzZXJEYXRhLmxheWVyID0gbGF5ZXI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIC8vIFVwZGF0ZXMgYSBzaW5nbGUgbGF5ZXIsIGNhbGxpbmcgbGF5ZXIgbWV0aG9kc1xuICBfdXBkYXRlTGF5ZXIobGF5ZXIpIHtcbiAgICBjb25zdCB7b2xkUHJvcHMsIHByb3BzfSA9IGxheWVyO1xuICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgaWYgKG9sZFByb3BzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsYXllci51cGRhdGVMYXllcih7XG4gICAgICAgICAgb2xkUHJvcHMsXG4gICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgY29udGV4dDogdGhpcy5jb250ZXh0LFxuICAgICAgICAgIG9sZENvbnRleHQ6IHRoaXMub2xkQ29udGV4dCxcbiAgICAgICAgICBjaGFuZ2VGbGFnczogbGF5ZXIuZGlmZlByb3BzKG9sZFByb3BzLCBsYXllci5wcm9wcywgdGhpcy5jb250ZXh0KVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2cub25jZSgwLCBgZGVjay5nbCBlcnJvciBkdXJpbmcgdXBkYXRlIG9mICR7bGF5ZXJOYW1lKGxheWVyKX1gLCBlcnIpO1xuICAgICAgICAvLyBTYXZlIGZpcnN0IGVycm9yXG4gICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgfVxuICAgICAgbG9nKDIsIGB1cGRhdGluZyAke2xheWVyTmFtZShsYXllcil9YCk7XG4gICAgfVxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIC8vIEZpbmFsaXplcyBhIHNpbmdsZSBsYXllclxuICBfZmluYWxpemVMYXllcihsYXllcikge1xuICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgY29uc3Qge3N0YXRlfSA9IGxheWVyO1xuICAgIGlmIChzdGF0ZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGF5ZXIuZmluYWxpemVMYXllcigpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZy5vbmNlKDAsXG4gICAgICAgICAgYGRlY2suZ2wgZXJyb3IgZHVyaW5nIGZpbmFsaXphdGlvbiBvZiAke2xheWVyTmFtZShsYXllcil9YCwgZXJyKTtcbiAgICAgICAgLy8gU2F2ZSBmaXJzdCBlcnJvclxuICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgIH1cbiAgICAgIGxheWVyLnN0YXRlID0gbnVsbDtcbiAgICAgIGxvZygxLCBgZmluYWxpemluZyAke2xheWVyTmFtZShsYXllcil9YCk7XG4gICAgfVxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBsYXllck5hbWUobGF5ZXIpIHtcbiAgaWYgKGxheWVyIGluc3RhbmNlb2YgTGF5ZXIpIHtcbiAgICByZXR1cm4gYCR7bGF5ZXJ9YDtcbiAgfVxuICByZXR1cm4gIWxheWVyID8gJ251bGwgbGF5ZXInIDogJ2ludmFsaWQgbGF5ZXInO1xufVxuIl19
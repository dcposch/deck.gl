'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TEST_EXPORTS = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Copyright (c) 2015 Uber Technologies, Inc.
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
/* global window */


var _constants = require('./constants');

var _attributeManager = require('./attribute-manager');

var _attributeManager2 = _interopRequireDefault(_attributeManager);

var _utils = require('./utils');

var _luma = require('luma.gl');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * @param {string} props.id - layer name
 * @param {array}  props.data - array of data instances
 * @param {bool} props.opacity - opacity of the layer
 */
var defaultProps = {
  dataComparator: null,
  numInstances: undefined,
  visible: true,
  pickable: false,
  opacity: 0.8,
  onHover: function onHover() {},
  onClick: function onClick() {},
  // Update triggers: a key change detection mechanism in deck.gl
  // See layer documentation
  updateTriggers: {},
  projectionMode: _constants.COORDINATE_SYSTEM.LNG_LAT
};

var counter = 0;

var Layer = function () {
  /**
   * @class
   * @param {object} props - See docs and defaults above
   */
  function Layer(props) {
    _classCallCheck(this, Layer);

    // If sublayer has static defaultProps member, getDefaultProps will return it
    var mergedDefaultProps = getDefaultProps(this);
    // Merge supplied props with pre-merged default props
    props = Object.assign({}, mergedDefaultProps, props);
    // Accept null as data - otherwise apps and layers need to add ugly checks
    props.data = props.data || [];
    // Props are immutable
    Object.freeze(props);

    // Define all members and freeze layer
    this.id = props.id;
    this.props = props;
    this.oldProps = null;
    this.state = null;
    this.context = null;
    this.count = counter++;
    Object.seal(this);
  }

  _createClass(Layer, [{
    key: 'toString',
    value: function toString() {
      var className = this.constructor.layerName || this.constructor.name;
      return className !== this.props.id ? '<' + className + ':\'' + this.props.id + '\'>' : '<' + className + '>';
    }

    // //////////////////////////////////////////////////
    // LIFECYCLE METHODS, overridden by the layer subclasses

    // Called once to set up the initial state
    // App can create WebGL resources

  }, {
    key: 'initializeState',
    value: function initializeState() {
      throw new Error('Layer ' + this + ' has not defined initializeState');
    }

    // Let's layer control if updateState should be called

  }, {
    key: 'shouldUpdateState',
    value: function shouldUpdateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          oldContext = _ref.oldContext,
          context = _ref.context,
          changeFlags = _ref.changeFlags;

      return changeFlags.somethingChanged;
    }

    // Default implementation, all attributes will be invalidated and updated
    // when data changes

  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          oldContext = _ref2.oldContext,
          context = _ref2.context,
          changeFlags = _ref2.changeFlags;

      if (changeFlags.dataChanged) {
        this.invalidateAttribute('all');
      }
    }

    // Called once when layer is no longer matched and state will be discarded
    // App can destroy WebGL resources here

  }, {
    key: 'finalizeState',
    value: function finalizeState() {}

    // Implement to generate sublayers

  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      return null;
    }

    // If state has a model, draw it with supplied uniforms

  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var _ref3$uniforms = _ref3.uniforms,
          uniforms = _ref3$uniforms === undefined ? {} : _ref3$uniforms;

      if (this.state.model) {
        this.state.model.render(uniforms);
      }
    }

    // called to populate the info object that is passed to the event handler
    // @return null to cancel event

  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref4) {
      var info = _ref4.info,
          mode = _ref4.mode;
      var color = info.color,
          index = info.index;


      if (index >= 0) {
        // If props.data is an indexable array, get the object
        if (Array.isArray(this.props.data)) {
          info.object = this.props.data[index];
        }
      }

      // TODO - move to the JS part of a shader picking shader package
      if (mode === 'hover') {
        var selectedPickingColor = new Float32Array(3);
        selectedPickingColor[0] = color[0];
        selectedPickingColor[1] = color[1];
        selectedPickingColor[2] = color[2];
        this.setUniforms({ selectedPickingColor: selectedPickingColor });
      }

      return info;
    }

    // END LIFECYCLE METHODS
    // //////////////////////////////////////////////////

    // Default implementation of attribute invalidation, can be redefine

  }, {
    key: 'invalidateAttribute',
    value: function invalidateAttribute() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'all';

      if (name === 'all') {
        this.state.attributeManager.invalidateAll();
      } else {
        this.state.attributeManager.invalidate(name);
      }
    }

    // Calls attribute manager to update any WebGL attributes, can be redefined

  }, {
    key: 'updateAttributes',
    value: function updateAttributes(props) {
      var _state = this.state,
          attributeManager = _state.attributeManager,
          model = _state.model;

      if (!attributeManager) {
        return;
      }

      var numInstances = this.getNumInstances(props);
      // Figure out data length
      attributeManager.update({
        data: props.data,
        numInstances: numInstances,
        props: props,
        buffers: props,
        context: this,
        // Don't worry about non-attribute props
        ignoreUnknownAttributes: true
      });
      if (model) {
        var changedAttributes = attributeManager.getChangedAttributes({ clearChangedFlags: true });
        model.setAttributes(changedAttributes);
      }
    }

    // Public API

    // Updates selected state members and marks the object for redraw

  }, {
    key: 'setState',
    value: function setState(updateObject) {
      Object.assign(this.state, updateObject);
      this.state.needsRedraw = true;
    }
  }, {
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (this.state) {
        this.state.needsRedraw = redraw;
      }
    }

    // PROJECTION METHODS

    /**
     * Projects a point with current map state (lat, lon, zoom, pitch, bearing)
     *
     * Note: Position conversion is done in shader, so in many cases there is no need
     * for this function
     * @param {Array|TypedArray} lngLat - long and lat values
     * @return {Array|TypedArray} - x, y coordinates
     */

  }, {
    key: 'project',
    value: function project(lngLat) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(lngLat), 'Layer.project needs [lng,lat]');
      return viewport.project(lngLat);
    }
  }, {
    key: 'unproject',
    value: function unproject(xy) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(xy), 'Layer.unproject needs [x,y]');
      return viewport.unproject(xy);
    }
  }, {
    key: 'projectFlat',
    value: function projectFlat(lngLat) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(lngLat), 'Layer.project needs [lng,lat]');
      return viewport.projectFlat(lngLat);
    }
  }, {
    key: 'unprojectFlat',
    value: function unprojectFlat(xy) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(xy), 'Layer.unproject needs [x,y]');
      return viewport.unprojectFlat(xy);
    }
  }, {
    key: 'screenToDevicePixels',
    value: function screenToDevicePixels(screenPixels) {
      var devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      return screenPixels * devicePixelRatio;
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @return {Array} - a black color
     */

  }, {
    key: 'nullPickingColor',
    value: function nullPickingColor() {
      return [0, 0, 0];
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @param {int} i - index to be decoded
     * @return {Array} - the decoded color
     */

  }, {
    key: 'encodePickingColor',
    value: function encodePickingColor(i) {
      return [(i + 1) % 256, Math.floor((i + 1) / 256) % 256, Math.floor((i + 1) / 256 / 256) % 256];
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @param {Uint8Array} color - color array to be decoded
     * @return {Array} - the decoded picking color
     */

  }, {
    key: 'decodePickingColor',
    value: function decodePickingColor(color) {
      (0, _assert2.default)(color instanceof Uint8Array);

      var _color = _slicedToArray(color, 3),
          i1 = _color[0],
          i2 = _color[1],
          i3 = _color[2];
      // 1 was added to seperate from no selection


      var index = i1 + i2 * 256 + i3 * 65536 - 1;
      return index;
    }
  }, {
    key: 'calculateInstancePickingColors',
    value: function calculateInstancePickingColors(attribute, _ref5) {
      var numInstances = _ref5.numInstances;
      var value = attribute.value,
          size = attribute.size;
      // add 1 to index to seperate from no selection

      for (var i = 0; i < numInstances; i++) {
        var pickingColor = this.encodePickingColor(i);
        value[i * size + 0] = pickingColor[0];
        value[i * size + 1] = pickingColor[1];
        value[i * size + 2] = pickingColor[2];
      }
    }

    // DATA ACCESS API
    // Data can use iterators and may not be random access

    // Use iteration (the only required capability on data) to get first element

  }, {
    key: 'getFirstObject',
    value: function getFirstObject() {
      var data = this.props.data;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          return object;
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

      return null;
    }

    // INTERNAL METHODS

    // Deduces numer of instances. Intention is to support:
    // - Explicit setting of numInstances
    // - Auto-deduction for ES6 containers that define a size member
    // - Auto-deduction for Classic Arrays via the built-in length attribute
    // - Auto-deduction via arrays

  }, {
    key: 'getNumInstances',
    value: function getNumInstances(props) {
      props = props || this.props;

      // First check if the layer has set its own value
      if (this.state && this.state.numInstances !== undefined) {
        return this.state.numInstances;
      }

      // Check if app has provided an explicit value
      if (props.numInstances !== undefined) {
        return props.numInstances;
      }

      // Use container library to get a count for any ES6 container or object
      var _props = props,
          data = _props.data;

      return (0, _utils.count)(data);
    }

    // LAYER MANAGER API
    // Should only be called by the deck.gl LayerManager class

    // Called by layer manager when a new layer is found
    /* eslint-disable max-statements */

  }, {
    key: 'initializeLayer',
    value: function initializeLayer(updateParams) {
      (0, _assert2.default)(this.context.gl, 'Layer context missing gl');
      (0, _assert2.default)(!this.state, 'Layer missing state');

      this.state = {};

      // Initialize state only once
      this.setState({
        attributeManager: new _attributeManager2.default({ id: this.props.id }),
        model: null,
        needsRedraw: true,
        dataChanged: true
      });

      // Add attribute manager loggers if provided
      this.state.attributeManager.setLogFunctions(this.props);

      var attributeManager = this.state.attributeManager;
      // All instanced layers get instancePickingColors attribute by default
      // Their shaders can use it to render a picking scene
      // TODO - this slows down non instanced layers

      attributeManager.addInstanced({
        instancePickingColors: {
          type: _luma.GL.UNSIGNED_BYTE,
          size: 3,
          update: this.calculateInstancePickingColors
        }
      });

      // Call subclass lifecycle methods
      this.initializeState();
      this.updateState(updateParams);
      // End subclass lifecycle methods

      // Add any subclass attributes
      this.updateAttributes(this.props);
      this._updateBaseUniforms();

      var model = this.state.model;

      if (model) {
        model.setInstanceCount(this.getNumInstances());
        model.id = this.props.id;
        model.program.id = this.props.id + '-program';
        model.geometry.id = this.props.id + '-geometry';
        model.setAttributes(attributeManager.getAttributes());
      }
    }

    // Called by layer manager when existing layer is getting new props

  }, {
    key: 'updateLayer',
    value: function updateLayer(updateParams) {
      // Check for deprecated method
      if (this.shouldUpdate) {
        _utils.log.once(0, 'deck.gl v3 ' + this + ': "shouldUpdate" deprecated, renamed to "shouldUpdateState"');
      }

      // Call subclass lifecycle method
      var stateNeedsUpdate = this.shouldUpdateState(updateParams);
      // End lifecycle method

      if (stateNeedsUpdate) {

        // Call deprecated lifecycle method if defined
        var hasRedefinedMethod = this.willReceiveProps && this.willReceiveProps !== Layer.prototype.willReceiveProps;
        if (hasRedefinedMethod) {
          _utils.log.once(0, 'deck.gl v3 willReceiveProps deprecated. Use updateState in ' + this);
          var oldProps = updateParams.oldProps,
              props = updateParams.props,
              changeFlags = updateParams.changeFlags;

          this.setState(changeFlags);
          this.willReceiveProps(oldProps, props, changeFlags);
          this.setState({
            dataChanged: false,
            viewportChanged: false
          });
        }
        // End lifecycle method

        // Call subclass lifecycle method
        this.updateState(updateParams);
        // End lifecycle method

        // Run the attribute updaters
        this.updateAttributes(updateParams.props);
        this._updateBaseUniforms();

        if (this.state.model) {
          this.state.model.setInstanceCount(this.getNumInstances());
        }
      }
    }
    /* eslint-enable max-statements */

    // Called by manager when layer is about to be disposed
    // Note: not guaranteed to be called on application shutdown

  }, {
    key: 'finalizeLayer',
    value: function finalizeLayer() {
      // Call subclass lifecycle method
      this.finalizeState();
      // End lifecycle method
    }

    // Calculates uniforms

  }, {
    key: 'drawLayer',
    value: function drawLayer(_ref6) {
      var _ref6$uniforms = _ref6.uniforms,
          uniforms = _ref6$uniforms === undefined ? {} : _ref6$uniforms;

      // Call subclass lifecycle method
      this.draw({ uniforms: uniforms });
      // End lifecycle method
    }

    // {uniforms = {}, ...opts}

  }, {
    key: 'pickLayer',
    value: function pickLayer(opts) {
      // Call subclass lifecycle method
      return this.getPickingInfo(opts);
      // End lifecycle method
    }
  }, {
    key: 'diffProps',
    value: function diffProps(oldProps, newProps, context) {
      // First check if any props have changed (ignore props that will be examined separately)
      var propsChangedReason = (0, _utils.compareProps)({
        newProps: newProps,
        oldProps: oldProps,
        ignoreProps: { data: null, updateTriggers: null }
      });

      // Now check if any data related props have changed
      var dataChangedReason = this._diffDataProps(oldProps, newProps);

      var propsChanged = Boolean(propsChangedReason);
      var dataChanged = Boolean(dataChangedReason);
      var viewportChanged = context.viewportChanged;
      var somethingChanged = propsChanged || dataChanged || viewportChanged;

      // Check update triggers to determine if any attributes need regeneration
      // Note - if data has changed, all attributes will need regeneration, so skip this step
      if (!dataChanged) {
        this._diffUpdateTriggers(oldProps, newProps);
      } else {
        _utils.log.log(1, 'dataChanged: ' + dataChanged);
      }

      return {
        propsChanged: propsChanged,
        dataChanged: dataChanged,
        viewportChanged: viewportChanged,
        somethingChanged: somethingChanged,
        reason: dataChangedReason || propsChangedReason
      };
    }

    // Checks state of attributes and model
    // TODO - is attribute manager needed? - Model should be enough.

  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref7$clearRedrawFlag = _ref7.clearRedrawFlags,
          clearRedrawFlags = _ref7$clearRedrawFlag === undefined ? false : _ref7$clearRedrawFlag;

      // this method may be called by the render loop as soon a the layer
      // has been created, so guard against uninitialized state
      if (!this.state) {
        return false;
      }

      var redraw = false;
      redraw = redraw || this.state.needsRedraw;
      this.state.needsRedraw = this.state.needsRedraw && !clearRedrawFlags;

      var _state2 = this.state,
          attributeManager = _state2.attributeManager,
          model = _state2.model;

      redraw = redraw || attributeManager && attributeManager.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
      redraw = redraw || model && model.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });

      return redraw;
    }

    // PRIVATE METHODS

    // The comparison of the data prop requires special handling
    // the dataComparator should be used if supplied

  }, {
    key: '_diffDataProps',
    value: function _diffDataProps(oldProps, newProps) {
      // Support optional app defined comparison of data
      var dataComparator = newProps.dataComparator;

      if (dataComparator) {
        if (!dataComparator(newProps.data, oldProps.data)) {
          return 'Data comparator detected a change';
        }
        // Otherwise, do a shallow equal on props
      } else if (newProps.data !== oldProps.data) {
        return 'A new data container was supplied';
      }

      return null;
    }

    // Checks if any update triggers have changed, and invalidate
    // attributes accordingly.
    /* eslint-disable max-statements */

  }, {
    key: '_diffUpdateTriggers',
    value: function _diffUpdateTriggers(oldProps, newProps) {
      // const {attributeManager} = this.state;
      // const updateTriggerMap = attributeManager.getUpdateTriggerMap();

      var change = false;

      for (var propName in newProps.updateTriggers) {
        var oldTriggers = oldProps.updateTriggers[propName] || {};
        var newTriggers = newProps.updateTriggers[propName] || {};
        var diffReason = (0, _utils.compareProps)({
          oldProps: oldTriggers,
          newProps: newTriggers
        });
        if (diffReason) {
          if (propName === 'all') {
            _utils.log.log(1, 'updateTriggers invalidating all attributes: ' + diffReason);
            this.invalidateAttribute('all');
            change = true;
          } else {
            _utils.log.log(1, 'updateTriggers invalidating attribute ' + propName + ': ' + diffReason);
            this.invalidateAttribute(propName);
            change = true;
          }
        }
      }

      return change;
    }
    /* eslint-enable max-statements */

  }, {
    key: '_checkRequiredProp',
    value: function _checkRequiredProp(propertyName, condition) {
      var value = this.props[propertyName];
      if (value === undefined) {
        throw new Error('Property ' + propertyName + ' undefined in layer ' + this);
      }
      if (condition && !condition(value)) {
        throw new Error('Bad property ' + propertyName + ' in layer ' + this);
      }
    }

    // Emits a warning if an old prop is used, optionally suggesting a replacement

  }, {
    key: '_checkRemovedProp',
    value: function _checkRemovedProp(oldProp) {
      var newProp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      if (this.props[oldProp] !== undefined) {
        var layerName = this.constructor;
        var message = layerName + ' no longer accepts props.' + oldProp + ' in this version of deck.gl.';
        if (newProp) {
          message += '\nPlease use props.' + newProp + ' instead.';
        }
        _utils.log.once(0, message);
      }
    }
  }, {
    key: '_updateBaseUniforms',
    value: function _updateBaseUniforms() {
      this.setUniforms({
        // apply gamma to opacity to make it visually "linear"
        opacity: Math.pow(this.props.opacity, 1 / 2.2),
        ONE: 1.0
      });
    }

    // DEPRECATED METHODS
    // shouldUpdate() {}

  }, {
    key: 'willReceiveProps',
    value: function willReceiveProps() {}

    // Updates selected state members and marks the object for redraw

  }, {
    key: 'setUniforms',
    value: function setUniforms(uniformMap) {
      if (this.state.model) {
        this.state.model.setUniforms(uniformMap);
      }
      // TODO - set needsRedraw on the model?
      this.state.needsRedraw = true;
      (0, _utils.log)(3, 'layer.setUniforms', uniformMap);
    }
  }]);

  return Layer;
}();

exports.default = Layer;


Layer.layerName = 'Layer';
Layer.defaultProps = defaultProps;

// HELPERS

// Constructors have their super class constructors as prototypes
function getOwnProperty(object, prop) {
  return object.hasOwnProperty(prop) && object[prop];
}
/*
 * Return merged default props stored on layers constructor, create them if needed
 */
function getDefaultProps(layer) {
  var mergedDefaultProps = getOwnProperty(layer.constructor, 'mergedDefaultProps');
  if (mergedDefaultProps) {
    return mergedDefaultProps;
  }
  return mergeDefaultProps(layer);
}

/*
 * Walk the prototype chain and merge all default props
 */
function mergeDefaultProps(layer) {
  var subClassConstructor = layer.constructor;
  var layerName = getOwnProperty(subClassConstructor, 'layerName');
  if (!layerName) {
    _utils.log.once(0, 'layer ' + layer.constructor.name + ' does not specify a "layerName"');
  }
  var mergedDefaultProps = {
    id: layerName || layer.constructor.name
  };

  while (layer) {
    var layerDefaultProps = getOwnProperty(layer.constructor, 'defaultProps');
    Object.freeze(layerDefaultProps);
    if (layerDefaultProps) {
      mergedDefaultProps = Object.assign({}, layerDefaultProps, mergedDefaultProps);
    }
    layer = Object.getPrototypeOf(layer);
  }
  // Store for quick lookup
  subClassConstructor.mergedDefaultProps = mergedDefaultProps;
  return mergedDefaultProps;
}

var TEST_EXPORTS = exports.TEST_EXPORTS = {
  mergeDefaultProps: mergeDefaultProps
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdFByb3BzIiwiZGF0YUNvbXBhcmF0b3IiLCJudW1JbnN0YW5jZXMiLCJ1bmRlZmluZWQiLCJ2aXNpYmxlIiwicGlja2FibGUiLCJvcGFjaXR5Iiwib25Ib3ZlciIsIm9uQ2xpY2siLCJ1cGRhdGVUcmlnZ2VycyIsInByb2plY3Rpb25Nb2RlIiwiTE5HX0xBVCIsImNvdW50ZXIiLCJMYXllciIsInByb3BzIiwibWVyZ2VkRGVmYXVsdFByb3BzIiwiZ2V0RGVmYXVsdFByb3BzIiwiT2JqZWN0IiwiYXNzaWduIiwiZGF0YSIsImZyZWV6ZSIsImlkIiwib2xkUHJvcHMiLCJzdGF0ZSIsImNvbnRleHQiLCJjb3VudCIsInNlYWwiLCJjbGFzc05hbWUiLCJjb25zdHJ1Y3RvciIsImxheWVyTmFtZSIsIm5hbWUiLCJFcnJvciIsIm9sZENvbnRleHQiLCJjaGFuZ2VGbGFncyIsInNvbWV0aGluZ0NoYW5nZWQiLCJkYXRhQ2hhbmdlZCIsImludmFsaWRhdGVBdHRyaWJ1dGUiLCJ1bmlmb3JtcyIsIm1vZGVsIiwicmVuZGVyIiwiaW5mbyIsIm1vZGUiLCJjb2xvciIsImluZGV4IiwiQXJyYXkiLCJpc0FycmF5Iiwib2JqZWN0Iiwic2VsZWN0ZWRQaWNraW5nQ29sb3IiLCJGbG9hdDMyQXJyYXkiLCJzZXRVbmlmb3JtcyIsImF0dHJpYnV0ZU1hbmFnZXIiLCJpbnZhbGlkYXRlQWxsIiwiaW52YWxpZGF0ZSIsImdldE51bUluc3RhbmNlcyIsInVwZGF0ZSIsImJ1ZmZlcnMiLCJpZ25vcmVVbmtub3duQXR0cmlidXRlcyIsImNoYW5nZWRBdHRyaWJ1dGVzIiwiZ2V0Q2hhbmdlZEF0dHJpYnV0ZXMiLCJjbGVhckNoYW5nZWRGbGFncyIsInNldEF0dHJpYnV0ZXMiLCJ1cGRhdGVPYmplY3QiLCJuZWVkc1JlZHJhdyIsInJlZHJhdyIsImxuZ0xhdCIsInZpZXdwb3J0IiwicHJvamVjdCIsInh5IiwidW5wcm9qZWN0IiwicHJvamVjdEZsYXQiLCJ1bnByb2plY3RGbGF0Iiwic2NyZWVuUGl4ZWxzIiwiZGV2aWNlUGl4ZWxSYXRpbyIsIndpbmRvdyIsImkiLCJNYXRoIiwiZmxvb3IiLCJVaW50OEFycmF5IiwiaTEiLCJpMiIsImkzIiwiYXR0cmlidXRlIiwidmFsdWUiLCJzaXplIiwicGlja2luZ0NvbG9yIiwiZW5jb2RlUGlja2luZ0NvbG9yIiwidXBkYXRlUGFyYW1zIiwiZ2wiLCJzZXRTdGF0ZSIsInNldExvZ0Z1bmN0aW9ucyIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUGlja2luZ0NvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzIiwiaW5pdGlhbGl6ZVN0YXRlIiwidXBkYXRlU3RhdGUiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiX3VwZGF0ZUJhc2VVbmlmb3JtcyIsInNldEluc3RhbmNlQ291bnQiLCJwcm9ncmFtIiwiZ2VvbWV0cnkiLCJnZXRBdHRyaWJ1dGVzIiwic2hvdWxkVXBkYXRlIiwib25jZSIsInN0YXRlTmVlZHNVcGRhdGUiLCJzaG91bGRVcGRhdGVTdGF0ZSIsImhhc1JlZGVmaW5lZE1ldGhvZCIsIndpbGxSZWNlaXZlUHJvcHMiLCJwcm90b3R5cGUiLCJ2aWV3cG9ydENoYW5nZWQiLCJmaW5hbGl6ZVN0YXRlIiwiZHJhdyIsIm9wdHMiLCJnZXRQaWNraW5nSW5mbyIsIm5ld1Byb3BzIiwicHJvcHNDaGFuZ2VkUmVhc29uIiwiaWdub3JlUHJvcHMiLCJkYXRhQ2hhbmdlZFJlYXNvbiIsIl9kaWZmRGF0YVByb3BzIiwicHJvcHNDaGFuZ2VkIiwiQm9vbGVhbiIsIl9kaWZmVXBkYXRlVHJpZ2dlcnMiLCJsb2ciLCJyZWFzb24iLCJjbGVhclJlZHJhd0ZsYWdzIiwiZ2V0TmVlZHNSZWRyYXciLCJjaGFuZ2UiLCJwcm9wTmFtZSIsIm9sZFRyaWdnZXJzIiwibmV3VHJpZ2dlcnMiLCJkaWZmUmVhc29uIiwicHJvcGVydHlOYW1lIiwiY29uZGl0aW9uIiwib2xkUHJvcCIsIm5ld1Byb3AiLCJtZXNzYWdlIiwicG93IiwiT05FIiwidW5pZm9ybU1hcCIsImdldE93blByb3BlcnR5IiwicHJvcCIsImhhc093blByb3BlcnR5IiwibGF5ZXIiLCJtZXJnZURlZmF1bHRQcm9wcyIsInN1YkNsYXNzQ29uc3RydWN0b3IiLCJsYXllckRlZmF1bHRQcm9wcyIsImdldFByb3RvdHlwZU9mIiwiVEVTVF9FWFBPUlRTIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7cWpCQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBRUE7Ozs7O0FBS0EsSUFBTUEsZUFBZTtBQUNuQkMsa0JBQWdCLElBREc7QUFFbkJDLGdCQUFjQyxTQUZLO0FBR25CQyxXQUFTLElBSFU7QUFJbkJDLFlBQVUsS0FKUztBQUtuQkMsV0FBUyxHQUxVO0FBTW5CQyxXQUFTLG1CQUFNLENBQUUsQ0FORTtBQU9uQkMsV0FBUyxtQkFBTSxDQUFFLENBUEU7QUFRbkI7QUFDQTtBQUNBQyxrQkFBZ0IsRUFWRztBQVduQkMsa0JBQWdCLDZCQUFrQkM7QUFYZixDQUFyQjs7QUFjQSxJQUFJQyxVQUFVLENBQWQ7O0lBRXFCQyxLO0FBQ25COzs7O0FBSUEsaUJBQVlDLEtBQVosRUFBbUI7QUFBQTs7QUFDakI7QUFDQSxRQUFNQyxxQkFBcUJDLGdCQUFnQixJQUFoQixDQUEzQjtBQUNBO0FBQ0FGLFlBQVFHLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCSCxrQkFBbEIsRUFBc0NELEtBQXRDLENBQVI7QUFDQTtBQUNBQSxVQUFNSyxJQUFOLEdBQWFMLE1BQU1LLElBQU4sSUFBYyxFQUEzQjtBQUNBO0FBQ0FGLFdBQU9HLE1BQVAsQ0FBY04sS0FBZDs7QUFFQTtBQUNBLFNBQUtPLEVBQUwsR0FBVVAs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TUFBTW5ILFdBQU4sQ0FBa0JFLElBQXZDO0FBQ0Q7QUFDRCxNQUFJZixxQkFBcUI7QUFDdkJNLFFBQUlRLGFBQWFrSCxNQUFNbkgsV0FBTixDQUFrQkU7QUFEWixHQUF6Qjs7QUFJQSxTQUFPaUgsS0FBUCxFQUFjO0FBQ1osUUFBTUcsb0JBQW9CTixlQUFlRyxNQUFNbkgsV0FBckIsRUFBa0MsY0FBbEMsQ0FBMUI7QUFDQVgsV0FBT0csTUFBUCxDQUFjOEgsaUJBQWQ7QUFDQSxRQUFJQSxpQkFBSixFQUF1QjtBQUNyQm5JLDJCQUFxQkUsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JnSSxpQkFBbEIsRUFBcUNuSSxrQkFBckMsQ0FBckI7QUFDRDtBQUNEZ0ksWUFBUTlILE9BQU9rSSxjQUFQLENBQXNCSixLQUF0QixDQUFSO0FBQ0Q7QUFDRDtBQUNBRSxzQkFBb0JsSSxrQkFBcEIsR0FBeUNBLGtCQUF6QztBQUNBLFNBQU9BLGtCQUFQO0FBQ0Q7O0FBRU0sSUFBTXFJLHNDQUFlO0FBQzFCSjtBQUQwQixDQUFyQiIsImZpbGUiOiJsYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgQXR0cmlidXRlTWFuYWdlciBmcm9tICcuL2F0dHJpYnV0ZS1tYW5hZ2VyJztcbmltcG9ydCB7bG9nLCBjb21wYXJlUHJvcHMsIGNvdW50fSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7R0x9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vKlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BzLmlkIC0gbGF5ZXIgbmFtZVxuICogQHBhcmFtIHthcnJheX0gIHByb3BzLmRhdGEgLSBhcnJheSBvZiBkYXRhIGluc3RhbmNlc1xuICogQHBhcmFtIHtib29sfSBwcm9wcy5vcGFjaXR5IC0gb3BhY2l0eSBvZiB0aGUgbGF5ZXJcbiAqL1xuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBkYXRhQ29tcGFyYXRvcjogbnVsbCxcbiAgbnVtSW5zdGFuY2VzOiB1bmRlZmluZWQsXG4gIHZpc2libGU6IHRydWUsXG4gIHBpY2thYmxlOiBmYWxzZSxcbiAgb3BhY2l0eTogMC44LFxuICBvbkhvdmVyOiAoKSA9PiB7fSxcbiAgb25DbGljazogKCkgPT4ge30sXG4gIC8vIFVwZGF0ZSB0cmlnZ2VyczogYSBrZXkgY2hhbmdlIGRldGVjdGlvbiBtZWNoYW5pc20gaW4gZGVjay5nbFxuICAvLyBTZWUgbGF5ZXIgZG9jdW1lbnRhdGlvblxuICB1cGRhdGVUcmlnZ2Vyczoge30sXG4gIHByb2plY3Rpb25Nb2RlOiBDT09SRElOQVRFX1NZU1RFTS5MTkdfTEFUXG59O1xuXG5sZXQgY291bnRlciA9IDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExheWVyIHtcbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgLSBTZWUgZG9jcyBhbmQgZGVmYXVsdHMgYWJvdmVcbiAgICovXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgLy8gSWYgc3VibGF5ZXIgaGFzIHN0YXRpYyBkZWZhdWx0UHJvcHMgbWVtYmVyLCBnZXREZWZhdWx0UHJvcHMgd2lsbCByZXR1cm4gaXRcbiAgICBjb25zdCBtZXJnZWREZWZhdWx0UHJvcHMgPSBnZXREZWZhdWx0UHJvcHModGhpcyk7XG4gICAgLy8gTWVyZ2Ugc3VwcGxpZWQgcHJvcHMgd2l0aCBwcmUtbWVyZ2VkIGRlZmF1bHQgcHJvcHNcbiAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIG1lcmdlZERlZmF1bHRQcm9wcywgcHJvcHMpO1xuICAgIC8vIEFjY2VwdCBudWxsIGFzIGRhdGEgLSBvdGhlcndpc2UgYXBwcyBhbmQgbGF5ZXJzIG5lZWQgdG8gYWRkIHVnbHkgY2hlY2tzXG4gICAgcHJvcHMuZGF0YSA9IHByb3BzLmRhdGEgfHwgW107XG4gICAgLy8gUHJvcHMgYXJlIGltbXV0YWJsZVxuICAgIE9iamVjdC5mcmVlemUocHJvcHMpO1xuXG4gICAgLy8gRGVmaW5lIGFsbCBtZW1iZXJzIGFuZCBmcmVlemUgbGF5ZXJcbiAgICB0aGlzLmlkID0gcHJvcHMuaWQ7XG4gICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgIHRoaXMub2xkUHJvcHMgPSBudWxsO1xuICAgIHRoaXMuc3RhdGUgPSBudWxsO1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgdGhpcy5jb3VudCA9IGNvdW50ZXIrKztcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IHRoaXMuY29uc3RydWN0b3IubGF5ZXJOYW1lIHx8IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICByZXR1cm4gY2xhc3NOYW1lICE9PSB0aGlzLnByb3BzLmlkID8gYDwke2NsYXNzTmFtZX06JyR7dGhpcy5wcm9wcy5pZH0nPmAgOiBgPCR7Y2xhc3NOYW1lfT5gO1xuICB9XG5cbiAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gTElGRUNZQ0xFIE1FVEhPRFMsIG92ZXJyaWRkZW4gYnkgdGhlIGxheWVyIHN1YmNsYXNzZXNcblxuICAvLyBDYWxsZWQgb25jZSB0byBzZXQgdXAgdGhlIGluaXRpYWwgc3RhdGVcbiAgLy8gQXBwIGNhbiBjcmVhdGUgV2ViR0wgcmVzb3VyY2VzXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYExheWVyICR7dGhpc30gaGFzIG5vdCBkZWZpbmVkIGluaXRpYWxpemVTdGF0ZWApO1xuICB9XG5cbiAgLy8gTGV0J3MgbGF5ZXIgY29udHJvbCBpZiB1cGRhdGVTdGF0ZSBzaG91bGQgYmUgY2FsbGVkXG4gIHNob3VsZFVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIG9sZENvbnRleHQsIGNvbnRleHQsIGNoYW5nZUZsYWdzfSkge1xuICAgIHJldHVybiBjaGFuZ2VGbGFncy5zb21ldGhpbmdDaGFuZ2VkO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiwgYWxsIGF0dHJpYnV0ZXMgd2lsbCBiZSBpbnZhbGlkYXRlZCBhbmQgdXBkYXRlZFxuICAvLyB3aGVuIGRhdGEgY2hhbmdlc1xuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBvbGRDb250ZXh0LCBjb250ZXh0LCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQpIHtcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZSgnYWxsJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbGVkIG9uY2Ugd2hlbiBsYXllciBpcyBubyBsb25nZXIgbWF0Y2hlZCBhbmQgc3RhdGUgd2lsbCBiZSBkaXNjYXJkZWRcbiAgLy8gQXBwIGNhbiBkZXN0cm95IFdlYkdMIHJlc291cmNlcyBoZXJlXG4gIGZpbmFsaXplU3RhdGUoKSB7XG4gIH1cblxuICAvLyBJbXBsZW1lbnQgdG8gZ2VuZXJhdGUgc3VibGF5ZXJzXG4gIHJlbmRlckxheWVycygpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIElmIHN0YXRlIGhhcyBhIG1vZGVsLCBkcmF3IGl0IHdpdGggc3VwcGxpZWQgdW5pZm9ybXNcbiAgZHJhdyh7dW5pZm9ybXMgPSB7fX0pIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5tb2RlbCkge1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIodW5pZm9ybXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNhbGxlZCB0byBwb3B1bGF0ZSB0aGUgaW5mbyBvYmplY3QgdGhhdCBpcyBwYXNzZWQgdG8gdGhlIGV2ZW50IGhhbmRsZXJcbiAgLy8gQHJldHVybiBudWxsIHRvIGNhbmNlbCBldmVudFxuICBnZXRQaWNraW5nSW5mbyh7aW5mbywgbW9kZX0pIHtcbiAgICBjb25zdCB7Y29sb3IsIGluZGV4fSA9IGluZm87XG5cbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgLy8gSWYgcHJvcHMuZGF0YSBpcyBhbiBpbmRleGFibGUgYXJyYXksIGdldCB0aGUgb2JqZWN0XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLnByb3BzLmRhdGEpKSB7XG4gICAgICAgIGluZm8ub2JqZWN0ID0gdGhpcy5wcm9wcy5kYXRhW2luZGV4XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIC0gbW92ZSB0byB0aGUgSlMgcGFydCBvZiBhIHNoYWRlciBwaWNraW5nIHNoYWRlciBwYWNrYWdlXG4gICAgaWYgKG1vZGUgPT09ICdob3ZlcicpIHtcbiAgICAgIGNvbnN0IHNlbGVjdGVkUGlja2luZ0NvbG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgIHNlbGVjdGVkUGlja2luZ0NvbG9yWzBdID0gY29sb3JbMF07XG4gICAgICBzZWxlY3RlZFBpY2tpbmdDb2xvclsxXSA9IGNvbG9yWzFdO1xuICAgICAgc2VsZWN0ZWRQaWNraW5nQ29sb3JbMl0gPSBjb2xvclsyXTtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXMoe3NlbGVjdGVkUGlja2luZ0NvbG9yfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICAvLyBFTkQgTElGRUNZQ0xFIE1FVEhPRFNcbiAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGF0dHJpYnV0ZSBpbnZhbGlkYXRpb24sIGNhbiBiZSByZWRlZmluZVxuICBpbnZhbGlkYXRlQXR0cmlidXRlKG5hbWUgPSAnYWxsJykge1xuICAgIGlmIChuYW1lID09PSAnYWxsJykge1xuICAgICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGUobmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbHMgYXR0cmlidXRlIG1hbmFnZXIgdG8gdXBkYXRlIGFueSBXZWJHTCBhdHRyaWJ1dGVzLCBjYW4gYmUgcmVkZWZpbmVkXG4gIHVwZGF0ZUF0dHJpYnV0ZXMocHJvcHMpIHtcbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlciwgbW9kZWx9ID0gdGhpcy5zdGF0ZTtcbiAgICBpZiAoIWF0dHJpYnV0ZU1hbmFnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBudW1JbnN0YW5jZXMgPSB0aGlzLmdldE51bUluc3RhbmNlcyhwcm9wcyk7XG4gICAgLy8gRmlndXJlIG91dCBkYXRhIGxlbmd0aFxuICAgIGF0dHJpYnV0ZU1hbmFnZXIudXBkYXRlKHtcbiAgICAgIGRhdGE6IHByb3BzLmRhdGEsXG4gICAgICBudW1JbnN0YW5jZXMsXG4gICAgICBwcm9wcyxcbiAgICAgIGJ1ZmZlcnM6IHByb3BzLFxuICAgICAgY29udGV4dDogdGhpcyxcbiAgICAgIC8vIERvbid0IHdvcnJ5IGFib3V0IG5vbi1hdHRyaWJ1dGUgcHJvcHNcbiAgICAgIGlnbm9yZVVua25vd25BdHRyaWJ1dGVzOiB0cnVlXG4gICAgfSk7XG4gICAgaWYgKG1vZGVsKSB7XG4gICAgICBjb25zdCBjaGFuZ2VkQXR0cmlidXRlcyA9IGF0dHJpYnV0ZU1hbmFnZXIuZ2V0Q2hhbmdlZEF0dHJpYnV0ZXMoe2NsZWFyQ2hhbmdlZEZsYWdzOiB0cnVlfSk7XG4gICAgICBtb2RlbC5zZXRBdHRyaWJ1dGVzKGNoYW5nZWRBdHRyaWJ1dGVzKTtcbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWMgQVBJXG5cbiAgLy8gVXBkYXRlcyBzZWxlY3RlZCBzdGF0ZSBtZW1iZXJzIGFuZCBtYXJrcyB0aGUgb2JqZWN0IGZvciByZWRyYXdcbiAgc2V0U3RhdGUodXBkYXRlT2JqZWN0KSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnN0YXRlLCB1cGRhdGVPYmplY3QpO1xuICAgIHRoaXMuc3RhdGUubmVlZHNSZWRyYXcgPSB0cnVlO1xuICB9XG5cbiAgc2V0TmVlZHNSZWRyYXcocmVkcmF3ID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLnN0YXRlKSB7XG4gICAgICB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ID0gcmVkcmF3O1xuICAgIH1cbiAgfVxuXG4gIC8vIFBST0pFQ1RJT04gTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBQcm9qZWN0cyBhIHBvaW50IHdpdGggY3VycmVudCBtYXAgc3RhdGUgKGxhdCwgbG9uLCB6b29tLCBwaXRjaCwgYmVhcmluZylcbiAgICpcbiAgICogTm90ZTogUG9zaXRpb24gY29udmVyc2lvbiBpcyBkb25lIGluIHNoYWRlciwgc28gaW4gbWFueSBjYXNlcyB0aGVyZSBpcyBubyBuZWVkXG4gICAqIGZvciB0aGlzIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7QXJyYXl8VHlwZWRBcnJheX0gbG5nTGF0IC0gbG9uZyBhbmQgbGF0IHZhbHVlc1xuICAgKiBAcmV0dXJuIHtBcnJheXxUeXBlZEFycmF5fSAtIHgsIHkgY29vcmRpbmF0ZXNcbiAgICovXG4gIHByb2plY3QobG5nTGF0KSB7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShsbmdMYXQpLCAnTGF5ZXIucHJvamVjdCBuZWVkcyBbbG5nLGxhdF0nKTtcbiAgICByZXR1cm4gdmlld3BvcnQucHJvamVjdChsbmdMYXQpO1xuICB9XG5cbiAgdW5wcm9qZWN0KHh5KSB7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh4eSksICdMYXllci51bnByb2plY3QgbmVlZHMgW3gseV0nKTtcbiAgICByZXR1cm4gdmlld3BvcnQudW5wcm9qZWN0KHh5KTtcbiAgfVxuXG4gIHByb2plY3RGbGF0KGxuZ0xhdCkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkobG5nTGF0KSwgJ0xheWVyLnByb2plY3QgbmVlZHMgW2xuZyxsYXRdJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnByb2plY3RGbGF0KGxuZ0xhdCk7XG4gIH1cblxuICB1bnByb2plY3RGbGF0KHh5KSB7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh4eSksICdMYXllci51bnByb2plY3QgbmVlZHMgW3gseV0nKTtcbiAgICByZXR1cm4gdmlld3BvcnQudW5wcm9qZWN0RmxhdCh4eSk7XG4gIH1cblxuICBzY3JlZW5Ub0RldmljZVBpeGVscyhzY3JlZW5QaXhlbHMpIHtcbiAgICBjb25zdCBkZXZpY2VQaXhlbFJhdGlvID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgP1xuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW8gOiAxO1xuICAgIHJldHVybiBzY3JlZW5QaXhlbHMgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBpY2tpbmcgY29sb3IgdGhhdCBkb2Vzbid0IG1hdGNoIGFueSBzdWJmZWF0dXJlXG4gICAqIFVzZSBpZiBzb21lIGdyYXBoaWNzIGRvIG5vdCBiZWxvbmcgdG8gYW55IHBpY2thYmxlIHN1YmZlYXR1cmVcbiAgICogQHJldHVybiB7QXJyYXl9IC0gYSBibGFjayBjb2xvclxuICAgKi9cbiAgbnVsbFBpY2tpbmdDb2xvcigpIHtcbiAgICByZXR1cm4gWzAsIDAsIDBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBpY2tpbmcgY29sb3IgdGhhdCBkb2Vzbid0IG1hdGNoIGFueSBzdWJmZWF0dXJlXG4gICAqIFVzZSBpZiBzb21lIGdyYXBoaWNzIGRvIG5vdCBiZWxvbmcgdG8gYW55IHBpY2thYmxlIHN1YmZlYXR1cmVcbiAgICogQHBhcmFtIHtpbnR9IGkgLSBpbmRleCB0byBiZSBkZWNvZGVkXG4gICAqIEByZXR1cm4ge0FycmF5fSAtIHRoZSBkZWNvZGVkIGNvbG9yXG4gICAqL1xuICBlbmNvZGVQaWNraW5nQ29sb3IoaSkge1xuICAgIHJldHVybiBbXG4gICAgICAoaSArIDEpICUgMjU2LFxuICAgICAgTWF0aC5mbG9vcigoaSArIDEpIC8gMjU2KSAlIDI1NixcbiAgICAgIE1hdGguZmxvb3IoKGkgKyAxKSAvIDI1NiAvIDI1NikgJSAyNTZcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBpY2tpbmcgY29sb3IgdGhhdCBkb2Vzbid0IG1hdGNoIGFueSBzdWJmZWF0dXJlXG4gICAqIFVzZSBpZiBzb21lIGdyYXBoaWNzIGRvIG5vdCBiZWxvbmcgdG8gYW55IHBpY2thYmxlIHN1YmZlYXR1cmVcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSBjb2xvciAtIGNvbG9yIGFycmF5IHRvIGJlIGRlY29kZWRcbiAgICogQHJldHVybiB7QXJyYXl9IC0gdGhlIGRlY29kZWQgcGlja2luZyBjb2xvclxuICAgKi9cbiAgZGVjb2RlUGlja2luZ0NvbG9yKGNvbG9yKSB7XG4gICAgYXNzZXJ0KGNvbG9yIGluc3RhbmNlb2YgVWludDhBcnJheSk7XG4gICAgY29uc3QgW2kxLCBpMiwgaTNdID0gY29sb3I7XG4gICAgLy8gMSB3YXMgYWRkZWQgdG8gc2VwZXJhdGUgZnJvbSBubyBzZWxlY3Rpb25cbiAgICBjb25zdCBpbmRleCA9IGkxICsgaTIgKiAyNTYgKyBpMyAqIDY1NTM2IC0gMTtcbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBpY2tpbmdDb2xvcnMoYXR0cmlidXRlLCB7bnVtSW5zdGFuY2VzfSkge1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgLy8gYWRkIDEgdG8gaW5kZXggdG8gc2VwZXJhdGUgZnJvbSBubyBzZWxlY3Rpb25cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUluc3RhbmNlczsgaSsrKSB7XG4gICAgICBjb25zdCBwaWNraW5nQ29sb3IgPSB0aGlzLmVuY29kZVBpY2tpbmdDb2xvcihpKTtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMF0gPSBwaWNraW5nQ29sb3JbMF07XG4gICAgICB2YWx1ZVtpICogc2l6ZSArIDFdID0gcGlja2luZ0NvbG9yWzFdO1xuICAgICAgdmFsdWVbaSAqIHNpemUgKyAyXSA9IHBpY2tpbmdDb2xvclsyXTtcbiAgICB9XG4gIH1cblxuICAvLyBEQVRBIEFDQ0VTUyBBUElcbiAgLy8gRGF0YSBjYW4gdXNlIGl0ZXJhdG9ycyBhbmQgbWF5IG5vdCBiZSByYW5kb20gYWNjZXNzXG5cbiAgLy8gVXNlIGl0ZXJhdGlvbiAodGhlIG9ubHkgcmVxdWlyZWQgY2FwYWJpbGl0eSBvbiBkYXRhKSB0byBnZXQgZmlyc3QgZWxlbWVudFxuICBnZXRGaXJzdE9iamVjdCgpIHtcbiAgICBjb25zdCB7ZGF0YX0gPSB0aGlzLnByb3BzO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gSU5URVJOQUwgTUVUSE9EU1xuXG4gIC8vIERlZHVjZXMgbnVtZXIgb2YgaW5zdGFuY2VzLiBJbnRlbnRpb24gaXMgdG8gc3VwcG9ydDpcbiAgLy8gLSBFeHBsaWNpdCBzZXR0aW5nIG9mIG51bUluc3RhbmNlc1xuICAvLyAtIEF1dG8tZGVkdWN0aW9uIGZvciBFUzYgY29udGFpbmVycyB0aGF0IGRlZmluZSBhIHNpemUgbWVtYmVyXG4gIC8vIC0gQXV0by1kZWR1Y3Rpb24gZm9yIENsYXNzaWMgQXJyYXlzIHZpYSB0aGUgYnVpbHQtaW4gbGVuZ3RoIGF0dHJpYnV0ZVxuICAvLyAtIEF1dG8tZGVkdWN0aW9uIHZpYSBhcnJheXNcbiAgZ2V0TnVtSW5zdGFuY2VzKHByb3BzKSB7XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB0aGlzLnByb3BzO1xuXG4gICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhlIGxheWVyIGhhcyBzZXQgaXRzIG93biB2YWx1ZVxuICAgIGlmICh0aGlzLnN0YXRlICYmIHRoaXMuc3RhdGUubnVtSW5zdGFuY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXRlLm51bUluc3RhbmNlcztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBhcHAgaGFzIHByb3ZpZGVkIGFuIGV4cGxpY2l0IHZhbHVlXG4gICAgaWYgKHByb3BzLm51bUluc3RhbmNlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gcHJvcHMubnVtSW5zdGFuY2VzO1xuICAgIH1cblxuICAgIC8vIFVzZSBjb250YWluZXIgbGlicmFyeSB0byBnZXQgYSBjb3VudCBmb3IgYW55IEVTNiBjb250YWluZXIgb3Igb2JqZWN0XG4gICAgY29uc3Qge2RhdGF9ID0gcHJvcHM7XG4gICAgcmV0dXJuIGNvdW50KGRhdGEpO1xuICB9XG5cbiAgLy8gTEFZRVIgTUFOQUdFUiBBUElcbiAgLy8gU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGJ5IHRoZSBkZWNrLmdsIExheWVyTWFuYWdlciBjbGFzc1xuXG4gIC8vIENhbGxlZCBieSBsYXllciBtYW5hZ2VyIHdoZW4gYSBuZXcgbGF5ZXIgaXMgZm91bmRcbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgaW5pdGlhbGl6ZUxheWVyKHVwZGF0ZVBhcmFtcykge1xuICAgIGFzc2VydCh0aGlzLmNvbnRleHQuZ2wsICdMYXllciBjb250ZXh0IG1pc3NpbmcgZ2wnKTtcbiAgICBhc3NlcnQoIXRoaXMuc3RhdGUsICdMYXllciBtaXNzaW5nIHN0YXRlJyk7XG5cbiAgICB0aGlzLnN0YXRlID0ge307XG5cbiAgICAvLyBJbml0aWFsaXplIHN0YXRlIG9ubHkgb25jZVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgYXR0cmlidXRlTWFuYWdlcjogbmV3IEF0dHJpYnV0ZU1hbmFnZXIoe2lkOiB0aGlzLnByb3BzLmlkfSksXG4gICAgICBtb2RlbDogbnVsbCxcbiAgICAgIG5lZWRzUmVkcmF3OiB0cnVlLFxuICAgICAgZGF0YUNoYW5nZWQ6IHRydWVcbiAgICB9KTtcblxuICAgIC8vIEFkZCBhdHRyaWJ1dGUgbWFuYWdlciBsb2dnZXJzIGlmIHByb3ZpZGVkXG4gICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLnNldExvZ0Z1bmN0aW9ucyh0aGlzLnByb3BzKTtcblxuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgLy8gQWxsIGluc3RhbmNlZCBsYXllcnMgZ2V0IGluc3RhbmNlUGlja2luZ0NvbG9ycyBhdHRyaWJ1dGUgYnkgZGVmYXVsdFxuICAgIC8vIFRoZWlyIHNoYWRlcnMgY2FuIHVzZSBpdCB0byByZW5kZXIgYSBwaWNraW5nIHNjZW5lXG4gICAgLy8gVE9ETyAtIHRoaXMgc2xvd3MgZG93biBub24gaW5zdGFuY2VkIGxheWVyc1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgIGluc3RhbmNlUGlja2luZ0NvbG9yczoge1xuICAgICAgICB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLFxuICAgICAgICBzaXplOiAzLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RzXG4gICAgdGhpcy5pbml0aWFsaXplU3RhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVN0YXRlKHVwZGF0ZVBhcmFtcyk7XG4gICAgLy8gRW5kIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RzXG5cbiAgICAvLyBBZGQgYW55IHN1YmNsYXNzIGF0dHJpYnV0ZXNcbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZXModGhpcy5wcm9wcyk7XG4gICAgdGhpcy5fdXBkYXRlQmFzZVVuaWZvcm1zKCk7XG5cbiAgICBjb25zdCB7bW9kZWx9ID0gdGhpcy5zdGF0ZTtcbiAgICBpZiAobW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldEluc3RhbmNlQ291bnQodGhpcy5nZXROdW1JbnN0YW5jZXMoKSk7XG4gICAgICBtb2RlbC5pZCA9IHRoaXMucHJvcHMuaWQ7XG4gICAgICBtb2RlbC5wcm9ncmFtLmlkID0gYCR7dGhpcy5wcm9wcy5pZH0tcHJvZ3JhbWA7XG4gICAgICBtb2RlbC5nZW9tZXRyeS5pZCA9IGAke3RoaXMucHJvcHMuaWR9LWdlb21ldHJ5YDtcbiAgICAgIG1vZGVsLnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlTWFuYWdlci5nZXRBdHRyaWJ1dGVzKCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhbGxlZCBieSBsYXllciBtYW5hZ2VyIHdoZW4gZXhpc3RpbmcgbGF5ZXIgaXMgZ2V0dGluZyBuZXcgcHJvcHNcbiAgdXBkYXRlTGF5ZXIodXBkYXRlUGFyYW1zKSB7XG4gICAgLy8gQ2hlY2sgZm9yIGRlcHJlY2F0ZWQgbWV0aG9kXG4gICAgaWYgKHRoaXMuc2hvdWxkVXBkYXRlKSB7XG4gICAgICBsb2cub25jZSgwLCBgZGVjay5nbCB2MyAke3RoaXN9OiBcInNob3VsZFVwZGF0ZVwiIGRlcHJlY2F0ZWQsIHJlbmFtZWQgdG8gXCJzaG91bGRVcGRhdGVTdGF0ZVwiYCk7XG4gICAgfVxuXG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgY29uc3Qgc3RhdGVOZWVkc1VwZGF0ZSA9IHRoaXMuc2hvdWxkVXBkYXRlU3RhdGUodXBkYXRlUGFyYW1zKTtcbiAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuXG4gICAgaWYgKHN0YXRlTmVlZHNVcGRhdGUpIHtcblxuICAgICAgLy8gQ2FsbCBkZXByZWNhdGVkIGxpZmVjeWNsZSBtZXRob2QgaWYgZGVmaW5lZFxuICAgICAgY29uc3QgaGFzUmVkZWZpbmVkTWV0aG9kID0gdGhpcy53aWxsUmVjZWl2ZVByb3BzICYmXG4gICAgICAgIHRoaXMud2lsbFJlY2VpdmVQcm9wcyAhPT0gTGF5ZXIucHJvdG90eXBlLndpbGxSZWNlaXZlUHJvcHM7XG4gICAgICBpZiAoaGFzUmVkZWZpbmVkTWV0aG9kKSB7XG4gICAgICAgIGxvZy5vbmNlKDAsIGBkZWNrLmdsIHYzIHdpbGxSZWNlaXZlUHJvcHMgZGVwcmVjYXRlZC4gVXNlIHVwZGF0ZVN0YXRlIGluICR7dGhpc31gKTtcbiAgICAgICAgY29uc3Qge29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9ID0gdXBkYXRlUGFyYW1zO1xuICAgICAgICB0aGlzLnNldFN0YXRlKGNoYW5nZUZsYWdzKTtcbiAgICAgICAgdGhpcy53aWxsUmVjZWl2ZVByb3BzKG9sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3MpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBkYXRhQ2hhbmdlZDogZmFsc2UsXG4gICAgICAgICAgdmlld3BvcnRDaGFuZ2VkOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8vIEVuZCBsaWZlY3ljbGUgbWV0aG9kXG5cbiAgICAgIC8vIENhbGwgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZFxuICAgICAgdGhpcy51cGRhdGVTdGF0ZSh1cGRhdGVQYXJhbXMpO1xuICAgICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcblxuICAgICAgLy8gUnVuIHRoZSBhdHRyaWJ1dGUgdXBkYXRlcnNcbiAgICAgIHRoaXMudXBkYXRlQXR0cmlidXRlcyh1cGRhdGVQYXJhbXMucHJvcHMpO1xuICAgICAgdGhpcy5fdXBkYXRlQmFzZVVuaWZvcm1zKCk7XG5cbiAgICAgIGlmICh0aGlzLnN0YXRlLm1vZGVsKSB7XG4gICAgICAgIHRoaXMuc3RhdGUubW9kZWwuc2V0SW5zdGFuY2VDb3VudCh0aGlzLmdldE51bUluc3RhbmNlcygpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIC8vIENhbGxlZCBieSBtYW5hZ2VyIHdoZW4gbGF5ZXIgaXMgYWJvdXQgdG8gYmUgZGlzcG9zZWRcbiAgLy8gTm90ZTogbm90IGd1YXJhbnRlZWQgdG8gYmUgY2FsbGVkIG9uIGFwcGxpY2F0aW9uIHNodXRkb3duXG4gIGZpbmFsaXplTGF5ZXIoKSB7XG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgdGhpcy5maW5hbGl6ZVN0YXRlKCk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdW5pZm9ybXNcbiAgZHJhd0xheWVyKHt1bmlmb3JtcyA9IHt9fSkge1xuICAgIC8vIENhbGwgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZFxuICAgIHRoaXMuZHJhdyh7dW5pZm9ybXN9KTtcbiAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuICB9XG5cbiAgLy8ge3VuaWZvcm1zID0ge30sIC4uLm9wdHN9XG4gIHBpY2tMYXllcihvcHRzKSB7XG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGlja2luZ0luZm8ob3B0cyk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgfVxuXG4gIGRpZmZQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMsIGNvbnRleHQpIHtcbiAgICAvLyBGaXJzdCBjaGVjayBpZiBhbnkgcHJvcHMgaGF2ZSBjaGFuZ2VkIChpZ25vcmUgcHJvcHMgdGhhdCB3aWxsIGJlIGV4YW1pbmVkIHNlcGFyYXRlbHkpXG4gICAgY29uc3QgcHJvcHNDaGFuZ2VkUmVhc29uID0gY29tcGFyZVByb3BzKHtcbiAgICAgIG5ld1Byb3BzLFxuICAgICAgb2xkUHJvcHMsXG4gICAgICBpZ25vcmVQcm9wczoge2RhdGE6IG51bGwsIHVwZGF0ZVRyaWdnZXJzOiBudWxsfVxuICAgIH0pO1xuXG4gICAgLy8gTm93IGNoZWNrIGlmIGFueSBkYXRhIHJlbGF0ZWQgcHJvcHMgaGF2ZSBjaGFuZ2VkXG4gICAgY29uc3QgZGF0YUNoYW5nZWRSZWFzb24gPSB0aGlzLl9kaWZmRGF0YVByb3BzKG9sZFByb3BzLCBuZXdQcm9wcyk7XG5cbiAgICBjb25zdCBwcm9wc0NoYW5nZWQgPSBCb29sZWFuKHByb3BzQ2hhbmdlZFJlYXNvbik7XG4gICAgY29uc3QgZGF0YUNoYW5nZWQgPSBCb29sZWFuKGRhdGFDaGFuZ2VkUmVhc29uKTtcbiAgICBjb25zdCB2aWV3cG9ydENoYW5nZWQgPSBjb250ZXh0LnZpZXdwb3J0Q2hhbmdlZDtcbiAgICBjb25zdCBzb21ldGhpbmdDaGFuZ2VkID0gcHJvcHNDaGFuZ2VkIHx8IGRhdGFDaGFuZ2VkIHx8IHZpZXdwb3J0Q2hhbmdlZDtcblxuICAgIC8vIENoZWNrIHVwZGF0ZSB0cmlnZ2VycyB0byBkZXRlcm1pbmUgaWYgYW55IGF0dHJpYnV0ZXMgbmVlZCByZWdlbmVyYXRpb25cbiAgICAvLyBOb3RlIC0gaWYgZGF0YSBoYXMgY2hhbmdlZCwgYWxsIGF0dHJpYnV0ZXMgd2lsbCBuZWVkIHJlZ2VuZXJhdGlvbiwgc28gc2tpcCB0aGlzIHN0ZXBcbiAgICBpZiAoIWRhdGFDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9kaWZmVXBkYXRlVHJpZ2dlcnMob2xkUHJvcHMsIG5ld1Byb3BzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nLmxvZygxLCBgZGF0YUNoYW5nZWQ6ICR7ZGF0YUNoYW5nZWR9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHByb3BzQ2hhbmdlZCxcbiAgICAgIGRhdGFDaGFuZ2VkLFxuICAgICAgdmlld3BvcnRDaGFuZ2VkLFxuICAgICAgc29tZXRoaW5nQ2hhbmdlZCxcbiAgICAgIHJlYXNvbjogZGF0YUNoYW5nZWRSZWFzb24gfHwgcHJvcHNDaGFuZ2VkUmVhc29uXG4gICAgfTtcbiAgfVxuXG4gIC8vIENoZWNrcyBzdGF0ZSBvZiBhdHRyaWJ1dGVzIGFuZCBtb2RlbFxuICAvLyBUT0RPIC0gaXMgYXR0cmlidXRlIG1hbmFnZXIgbmVlZGVkPyAtIE1vZGVsIHNob3VsZCBiZSBlbm91Z2guXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICAvLyB0aGlzIG1ldGhvZCBtYXkgYmUgY2FsbGVkIGJ5IHRoZSByZW5kZXIgbG9vcCBhcyBzb29uIGEgdGhlIGxheWVyXG4gICAgLy8gaGFzIGJlZW4gY3JlYXRlZCwgc28gZ3VhcmQgYWdhaW5zdCB1bmluaXRpYWxpemVkIHN0YXRlXG4gICAgaWYgKCF0aGlzLnN0YXRlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHJlZHJhdyA9IGZhbHNlO1xuICAgIHJlZHJhdyA9IHJlZHJhdyB8fCB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3O1xuICAgIHRoaXMuc3RhdGUubmVlZHNSZWRyYXcgPSB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ICYmICFjbGVhclJlZHJhd0ZsYWdzO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXIsIG1vZGVsfSA9IHRoaXMuc3RhdGU7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IChhdHRyaWJ1dGVNYW5hZ2VyICYmIGF0dHJpYnV0ZU1hbmFnZXIuZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3N9KSk7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IChtb2RlbCAmJiBtb2RlbC5nZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFnc30pKTtcblxuICAgIHJldHVybiByZWRyYXc7XG4gIH1cblxuICAvLyBQUklWQVRFIE1FVEhPRFNcblxuICAvLyBUaGUgY29tcGFyaXNvbiBvZiB0aGUgZGF0YSBwcm9wIHJlcXVpcmVzIHNwZWNpYWwgaGFuZGxpbmdcbiAgLy8gdGhlIGRhdGFDb21wYXJhdG9yIHNob3VsZCBiZSB1c2VkIGlmIHN1cHBsaWVkXG4gIF9kaWZmRGF0YVByb3BzKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICAgIC8vIFN1cHBvcnQgb3B0aW9uYWwgYXBwIGRlZmluZWQgY29tcGFyaXNvbiBvZiBkYXRhXG4gICAgY29uc3Qge2RhdGFDb21wYXJhdG9yfSA9IG5ld1Byb3BzO1xuICAgIGlmIChkYXRhQ29tcGFyYXRvcikge1xuICAgICAgaWYgKCFkYXRhQ29tcGFyYXRvcihuZXdQcm9wcy5kYXRhLCBvbGRQcm9wcy5kYXRhKSkge1xuICAgICAgICByZXR1cm4gJ0RhdGEgY29tcGFyYXRvciBkZXRlY3RlZCBhIGNoYW5nZSc7XG4gICAgICB9XG4gICAgLy8gT3RoZXJ3aXNlLCBkbyBhIHNoYWxsb3cgZXF1YWwgb24gcHJvcHNcbiAgICB9IGVsc2UgaWYgKG5ld1Byb3BzLmRhdGEgIT09IG9sZFByb3BzLmRhdGEpIHtcbiAgICAgIHJldHVybiAnQSBuZXcgZGF0YSBjb250YWluZXIgd2FzIHN1cHBsaWVkJztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIENoZWNrcyBpZiBhbnkgdXBkYXRlIHRyaWdnZXJzIGhhdmUgY2hhbmdlZCwgYW5kIGludmFsaWRhdGVcbiAgLy8gYXR0cmlidXRlcyBhY2NvcmRpbmdseS5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgX2RpZmZVcGRhdGVUcmlnZ2VycyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgICAvLyBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8vIGNvbnN0IHVwZGF0ZVRyaWdnZXJNYXAgPSBhdHRyaWJ1dGVNYW5hZ2VyLmdldFVwZGF0ZVRyaWdnZXJNYXAoKTtcblxuICAgIGxldCBjaGFuZ2UgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcHJvcE5hbWUgaW4gbmV3UHJvcHMudXBkYXRlVHJpZ2dlcnMpIHtcbiAgICAgIGNvbnN0IG9sZFRyaWdnZXJzID0gb2xkUHJvcHMudXBkYXRlVHJpZ2dlcnNbcHJvcE5hbWVdIHx8IHt9O1xuICAgICAgY29uc3QgbmV3VHJpZ2dlcnMgPSBuZXdQcm9wcy51cGRhdGVUcmlnZ2Vyc1twcm9wTmFtZV0gfHwge307XG4gICAgICBjb25zdCBkaWZmUmVhc29uID0gY29tcGFyZVByb3BzKHtcbiAgICAgICAgb2xkUHJvcHM6IG9sZFRyaWdnZXJzLFxuICAgICAgICBuZXdQcm9wczogbmV3VHJpZ2dlcnNcbiAgICAgIH0pO1xuICAgICAgaWYgKGRpZmZSZWFzb24pIHtcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSAnYWxsJykge1xuICAgICAgICAgIGxvZy5sb2coMSwgYHVwZGF0ZVRyaWdnZXJzIGludmFsaWRhdGluZyBhbGwgYXR0cmlidXRlczogJHtkaWZmUmVhc29ufWApO1xuICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZSgnYWxsJyk7XG4gICAgICAgICAgY2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2cubG9nKDEsIGB1cGRhdGVUcmlnZ2VycyBpbnZhbGlkYXRpbmcgYXR0cmlidXRlICR7cHJvcE5hbWV9OiAke2RpZmZSZWFzb259YCk7XG4gICAgICAgICAgdGhpcy5pbnZhbGlkYXRlQXR0cmlidXRlKHByb3BOYW1lKTtcbiAgICAgICAgICBjaGFuZ2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYW5nZTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgX2NoZWNrUmVxdWlyZWRQcm9wKHByb3BlcnR5TmFtZSwgY29uZGl0aW9uKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLnByb3BzW3Byb3BlcnR5TmFtZV07XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUHJvcGVydHkgJHtwcm9wZXJ0eU5hbWV9IHVuZGVmaW5lZCBpbiBsYXllciAke3RoaXN9YCk7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb24gJiYgIWNvbmRpdGlvbih2YWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQmFkIHByb3BlcnR5ICR7cHJvcGVydHlOYW1lfSBpbiBsYXllciAke3RoaXN9YCk7XG4gICAgfVxuICB9XG5cbiAgLy8gRW1pdHMgYSB3YXJuaW5nIGlmIGFuIG9sZCBwcm9wIGlzIHVzZWQsIG9wdGlvbmFsbHkgc3VnZ2VzdGluZyBhIHJlcGxhY2VtZW50XG4gIF9jaGVja1JlbW92ZWRQcm9wKG9sZFByb3AsIG5ld1Byb3AgPSBudWxsKSB7XG4gICAgaWYgKHRoaXMucHJvcHNbb2xkUHJvcF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbGF5ZXJOYW1lID0gdGhpcy5jb25zdHJ1Y3RvcjtcbiAgICAgIGxldCBtZXNzYWdlID0gYCR7bGF5ZXJOYW1lfSBubyBsb25nZXIgYWNjZXB0cyBwcm9wcy4ke29sZFByb3B9IGluIHRoaXMgdmVyc2lvbiBvZiBkZWNrLmdsLmA7XG4gICAgICBpZiAobmV3UHJvcCkge1xuICAgICAgICBtZXNzYWdlICs9IGBcXG5QbGVhc2UgdXNlIHByb3BzLiR7bmV3UHJvcH0gaW5zdGVhZC5gO1xuICAgICAgfVxuICAgICAgbG9nLm9uY2UoMCwgbWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgX3VwZGF0ZUJhc2VVbmlmb3JtcygpIHtcbiAgICB0aGlzLnNldFVuaWZvcm1zKHtcbiAgICAgIC8vIGFwcGx5IGdhbW1hIHRvIG9wYWNpdHkgdG8gbWFrZSBpdCB2aXN1YWxseSBcImxpbmVhclwiXG4gICAgICBvcGFjaXR5OiBNYXRoLnBvdyh0aGlzLnByb3BzLm9wYWNpdHksIDEgLyAyLjIpLFxuICAgICAgT05FOiAxLjBcbiAgICB9KTtcbiAgfVxuXG4gIC8vIERFUFJFQ0FURUQgTUVUSE9EU1xuICAvLyBzaG91bGRVcGRhdGUoKSB7fVxuXG4gIHdpbGxSZWNlaXZlUHJvcHMoKSB7XG4gIH1cblxuICAvLyBVcGRhdGVzIHNlbGVjdGVkIHN0YXRlIG1lbWJlcnMgYW5kIG1hcmtzIHRoZSBvYmplY3QgZm9yIHJlZHJhd1xuICBzZXRVbmlmb3Jtcyh1bmlmb3JtTWFwKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUubW9kZWwpIHtcbiAgICAgIHRoaXMuc3RhdGUubW9kZWwuc2V0VW5pZm9ybXModW5pZm9ybU1hcCk7XG4gICAgfVxuICAgIC8vIFRPRE8gLSBzZXQgbmVlZHNSZWRyYXcgb24gdGhlIG1vZGVsP1xuICAgIHRoaXMuc3RhdGUubmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgIGxvZygzLCAnbGF5ZXIuc2V0VW5pZm9ybXMnLCB1bmlmb3JtTWFwKTtcbiAgfVxufVxuXG5MYXllci5sYXllck5hbWUgPSAnTGF5ZXInO1xuTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuXG4vLyBIRUxQRVJTXG5cbi8vIENvbnN0cnVjdG9ycyBoYXZlIHRoZWlyIHN1cGVyIGNsYXNzIGNvbnN0cnVjdG9ycyBhcyBwcm90b3R5cGVzXG5mdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eShvYmplY3QsIHByb3ApIHtcbiAgcmV0dXJuIG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSAmJiBvYmplY3RbcHJvcF07XG59XG4vKlxuICogUmV0dXJuIG1lcmdlZCBkZWZhdWx0IHByb3BzIHN0b3JlZCBvbiBsYXllcnMgY29uc3RydWN0b3IsIGNyZWF0ZSB0aGVtIGlmIG5lZWRlZFxuICovXG5mdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMobGF5ZXIpIHtcbiAgY29uc3QgbWVyZ2VkRGVmYXVsdFByb3BzID0gZ2V0T3duUHJvcGVydHkobGF5ZXIuY29uc3RydWN0b3IsICdtZXJnZWREZWZhdWx0UHJvcHMnKTtcbiAgaWYgKG1lcmdlZERlZmF1bHRQcm9wcykge1xuICAgIHJldHVybiBtZXJnZWREZWZhdWx0UHJvcHM7XG4gIH1cbiAgcmV0dXJuIG1lcmdlRGVmYXVsdFByb3BzKGxheWVyKTtcbn1cblxuLypcbiAqIFdhbGsgdGhlIHByb3RvdHlwZSBjaGFpbiBhbmQgbWVyZ2UgYWxsIGRlZmF1bHQgcHJvcHNcbiAqL1xuZnVuY3Rpb24gbWVyZ2VEZWZhdWx0UHJvcHMobGF5ZXIpIHtcbiAgY29uc3Qgc3ViQ2xhc3NDb25zdHJ1Y3RvciA9IGxheWVyLmNvbnN0cnVjdG9yO1xuICBjb25zdCBsYXllck5hbWUgPSBnZXRPd25Qcm9wZXJ0eShzdWJDbGFzc0NvbnN0cnVjdG9yLCAnbGF5ZXJOYW1lJyk7XG4gIGlmICghbGF5ZXJOYW1lKSB7XG4gICAgbG9nLm9uY2UoMCwgYGxheWVyICR7bGF5ZXIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3Qgc3BlY2lmeSBhIFwibGF5ZXJOYW1lXCJgKTtcbiAgfVxuICBsZXQgbWVyZ2VkRGVmYXVsdFByb3BzID0ge1xuICAgIGlkOiBsYXllck5hbWUgfHwgbGF5ZXIuY29uc3RydWN0b3IubmFtZVxuICB9O1xuXG4gIHdoaWxlIChsYXllcikge1xuICAgIGNvbnN0IGxheWVyRGVmYXVsdFByb3BzID0gZ2V0T3duUHJvcGVydHkobGF5ZXIuY29uc3RydWN0b3IsICdkZWZhdWx0UHJvcHMnKTtcbiAgICBPYmplY3QuZnJlZXplKGxheWVyRGVmYXVsdFByb3BzKTtcbiAgICBpZiAobGF5ZXJEZWZhdWx0UHJvcHMpIHtcbiAgICAgIG1lcmdlZERlZmF1bHRQcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIGxheWVyRGVmYXVsdFByb3BzLCBtZXJnZWREZWZhdWx0UHJvcHMpO1xuICAgIH1cbiAgICBsYXllciA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihsYXllcik7XG4gIH1cbiAgLy8gU3RvcmUgZm9yIHF1aWNrIGxvb2t1cFxuICBzdWJDbGFzc0NvbnN0cnVjdG9yLm1lcmdlZERlZmF1bHRQcm9wcyA9IG1lcmdlZERlZmF1bHRQcm9wcztcbiAgcmV0dXJuIG1lcmdlZERlZmF1bHRQcm9wcztcbn1cblxuZXhwb3J0IGNvbnN0IFRFU1RfRVhQT1JUUyA9IHtcbiAgbWVyZ2VEZWZhdWx0UHJvcHNcbn07XG4iXX0=
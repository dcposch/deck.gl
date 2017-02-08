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


var _luma = require('luma.gl');

var _attributeManager = require('./attribute-manager');

var _attributeManager2 = _interopRequireDefault(_attributeManager);

var _utils = require('./utils');

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
  dataIterator: null,
  dataComparator: null,
  numInstances: undefined,
  visible: true,
  pickable: false,
  opacity: 0.8,
  onHover: function onHover() {},
  onClick: function onClick() {},
  // Update triggers: a key change detection mechanism in deck.gl
  // See layer documentation
  updateTriggers: {}
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

    this.validateRequiredProp('id', function (x) {
      return typeof x === 'string' && x !== '';
    });
    this.validateRequiredProp('data');
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

    // If state has a model, draw it with supplied uniforms
    /* eslint-disable max-statements */

  }, {
    key: 'pick',
    value: function pick(_ref4) {
      var info = _ref4.info,
          uniforms = _ref4.uniforms,
          pickEnableUniforms = _ref4.pickEnableUniforms,
          pickDisableUniforms = _ref4.pickDisableUniforms,
          mode = _ref4.mode;
      var gl = this.context.gl;
      var model = this.state.model;


      if (model) {
        model.setUniforms(pickEnableUniforms);
        model.render(uniforms);
        model.setUniforms(pickDisableUniforms);

        // Read color in the central pixel, to be mapped with picking colors

        var _info$devicePixel = _slicedToArray(info.devicePixel, 2),
            x = _info$devicePixel[0],
            y = _info$devicePixel[1];

        var color = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, _luma.GL.RGBA, _luma.GL.UNSIGNED_BYTE, color);

        // Index < 0 means nothing selected
        info.index = this.decodePickingColor(color);
        info.color = color;

        // TODO - selectedPickingColor should be removed?
        if (mode === 'hover') {
          var selectedPickingColor = new Float32Array(3);
          selectedPickingColor[0] = color[0];
          selectedPickingColor[1] = color[1];
          selectedPickingColor[2] = color[2];
          this.setUniforms({ selectedPickingColor: selectedPickingColor });
        }
      }
    }
    /* eslint-enable max-statements */

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
      return this.pick(opts);
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
    key: 'validateRequiredProp',
    value: function validateRequiredProp(propertyName, condition) {
      var value = this.props[propertyName];
      if (value === undefined) {
        throw new Error('Property ' + propertyName + ' undefined in layer ' + this);
      }
      if (condition && !condition(value)) {
        throw new Error('Bad property ' + propertyName + ' in layer ' + this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvbGF5ZXIuanMiXSwibmFtZXMiOlsiZGVmYXVsdFByb3BzIiwiZGF0YUl0ZXJhdG9yIiwiZGF0YUNvbXBhcmF0b3IiLCJudW1JbnN0YW5jZXMiLCJ1bmRlZmluZWQiLCJ2aXNpYmxlIiwicGlja2FibGUiLCJvcGFjaXR5Iiwib25Ib3ZlciIsIm9uQ2xpY2siLCJ1cGRhdGVUcmlnZ2VycyIsImNvdW50ZXIiLCJMYXllciIsInByb3BzIiwibWVyZ2VkRGVmYXVsdFByb3BzIiwiZ2V0RGVmYXVsdFByb3BzIiwiT2JqZWN0IiwiYXNzaWduIiwiZGF0YSIsImZyZWV6ZSIsImlkIiwib2xkUHJvcHMiLCJzdGF0ZSIsImNvbnRleHQiLCJjb3VudCIsInNlYWwiLCJ2YWxpZGF0ZVJlcXVpcmVkUHJvcCIsIngiLCJjbGFzc05hbWUiLCJjb25zdHJ1Y3RvciIsImxheWVyTmFtZSIsIm5hbWUiLCJFcnJvciIsIm9sZENvbnRleHQiLCJjaGFuZ2VGbGFncyIsInNvbWV0aGluZ0NoYW5nZWQiLCJkYXRhQ2hhbmdlZCIsImludmFsaWRhdGVBdHRyaWJ1dGUiLCJ1bmlmb3JtcyIsIm1vZGVsIiwicmVuZGVyIiwiaW5mbyIsInBpY2tFbmFibGVVbmlmb3JtcyIsInBpY2tEaXNhYmxlVW5pZm9ybXMiLCJtb2RlIiwiZ2wiLCJzZXRVbmlmb3JtcyIsImRldmljZVBpeGVsIiwieSIsImNvbG9yIiwiVWludDhBcnJheSIsInJlYWRQaXhlbHMiLCJSR0JBIiwiVU5TSUdORURfQllURSIsImluZGV4IiwiZGVjb2RlUGlja2luZ0NvbG9yIiwic2VsZWN0ZWRQaWNraW5nQ29sb3IiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwiaW52YWxpZGF0ZUFsbCIsImludmFsaWRhdGUiLCJnZXROdW1JbnN0YW5jZXMiLCJ1cGRhdGUiLCJidWZmZXJzIiwiaWdub3JlVW5rbm93bkF0dHJpYnV0ZXMiLCJjaGFuZ2VkQXR0cmlidXRlcyIsImdldENoYW5nZWRBdHRyaWJ1dGVzIiwiY2xlYXJDaGFuZ2VkRmxhZ3MiLCJzZXRBdHRyaWJ1dGVzIiwidXBkYXRlT2JqZWN0IiwibmVlZHNSZWRyYXciLCJyZWRyYXciLCJsbmdMYXQiLCJ2aWV3cG9ydCIsIkFycmF5IiwiaXNBcnJheSIsInByb2plY3QiLCJ4eSIsInVucHJvamVjdCIsInByb2plY3RGbGF0IiwidW5wcm9qZWN0RmxhdCIsInNjcmVlblBpeGVscyIsImRldmljZVBpeGVsUmF0aW8iLCJ3aW5kb3ciLCJpIiwiTWF0aCIsImZsb29yIiwiaTEiLCJpMiIsImkzIiwiYXR0cmlidXRlIiwidmFsdWUiLCJzaXplIiwicGlja2luZ0NvbG9yIiwiZW5jb2RlUGlja2luZ0NvbG9yIiwib2JqZWN0IiwidXBkYXRlUGFyYW1zIiwic2V0U3RhdGUiLCJzZXRMb2dGdW5jdGlvbnMiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBpY2tpbmdDb2xvcnMiLCJ0eXBlIiwiY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzIiwiaW5pdGlhbGl6ZVN0YXRlIiwidXBkYXRlU3RhdGUiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiX3VwZGF0ZUJhc2VVbmlmb3JtcyIsInNldEluc3RhbmNlQ291bnQiLCJwcm9ncmFtIiwiZ2VvbWV0cnkiLCJnZXRBdHRyaWJ1dGVzIiwic2hvdWxkVXBkYXRlIiwib25jZSIsInN0YXRlTmVlZHNVcGRhdGUiLCJzaG91bGRVcGRhdGVTdGF0ZSIsImhhc1JlZGVmaW5lZE1ldGhvZCIsIndpbGxSZWNlaXZlUHJvcHMiLCJwcm90b3R5cGUiLCJ2aWV3cG9ydENoYW5nZWQiLCJmaW5hbGl6ZVN0YXRlIiwiZHJhdyIsIm9wdHMiLCJwaWNrIiwibmV3UHJvcHMiLCJwcm9wc0NoYW5nZWRSZWFzb24iLCJpZ25vcmVQcm9wcyIsImRhdGFDaGFuZ2VkUmVhc29uIiwiX2RpZmZEYXRhUHJvcHMiLCJwcm9wc0NoYW5nZWQiLCJCb29sZWFuIiwiX2RpZmZVcGRhdGVUcmlnZ2VycyIsImxvZyIsInJlYXNvbiIsImNsZWFyUmVkcmF3RmxhZ3MiLCJnZXROZWVkc1JlZHJhdyIsImNoYW5nZSIsInByb3BOYW1lIiwib2xkVHJpZ2dlcnMiLCJuZXdUcmlnZ2VycyIsImRpZmZSZWFzb24iLCJwcm9wZXJ0eU5hbWUiLCJjb25kaXRpb24iLCJwb3ciLCJPTkUiLCJ1bmlmb3JtTWFwIiwiZ2V0T3duUHJvcGVydHkiLCJwcm9wIiwiaGFzT3duUHJvcGVydHkiLCJsYXllciIsIm1lcmdlRGVmYXVsdFByb3BzIiwic3ViQ2xhc3NDb25zdHJ1Y3RvciIsImxheWVyRGVmYXVsdFByb3BzIiwiZ2V0UHJvdG90eXBlT2YiLCJURVNUX0VYUE9SVFMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztxakJBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQTs7Ozs7QUFLQSxJQUFNQSxlQUFlO0FBQ25CQyxnQkFBYyxJQURLO0FBRW5CQyxrQkFBZ0IsSUFGRztBQUduQkMsZ0JBQWNDLFNBSEs7QUFJbkJDLFdBQVMsSUFKVTtBQUtuQkMsWUFBVSxLQUxTO0FBTW5CQyxXQUFTLEdBTlU7QUFPbkJDLFdBQVMsbUJBQU0sQ0FBRSxDQVBFO0FBUW5CQyxXQUFTLG1CQUFNLENBQUUsQ0FSRTtBQVNuQjtBQUNBO0FBQ0FDLGtCQUFnQjtBQVhHLENBQXJCOztBQWNBLElBQUlDLFVBQVUsQ0FBZDs7SUFFcUJDLEs7QUFDbkI7Ozs7QUFJQSxpQkFBWUMsS0FBWixFQUFtQjtBQUFBOztBQUNqQjtBQUNBLFFBQU1DLHFCQUFxQkMsZ0JBQWdCLElBQWhCLENBQTNCO0FBQ0E7QUFDQUYsWUFBUUcsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JILGtCQUFsQixFQUFzQ0QsS0FBdEMsQ0FBUjtBQUNBO0FBQ0FBLFVBQU1LLElBQU4sR0FBYUwsTUFBTUssSUFBTixJQUFjLEVBQTNC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Q0FBM0I7QUFDQSxNQUFJZixrQkFBSixFQUF3QjtBQUN0QixXQUFPQSxrQkFBUDtBQUNEO0FBQ0QsU0FBT3VJLGtCQUFrQkQsS0FBbEIsQ0FBUDtBQUNEOztBQUVEOzs7QUFHQSxTQUFTQyxpQkFBVCxDQUEyQkQsS0FBM0IsRUFBa0M7QUFDaEMsTUFBTUUsc0JBQXNCRixNQUFNdkgsV0FBbEM7QUFDQSxNQUFNQyxZQUFZbUgsZUFBZUssbUJBQWYsRUFBb0MsV0FBcEMsQ0FBbEI7QUFDQSxNQUFJLENBQUN4SCxTQUFMLEVBQWdCO0FBQ2QsZUFBSWtGLElBQUosQ0FBUyxDQUFULGFBQXFCb0MsTUFBTXZILFdBQU4sQ0FBa0JFLElBQXZDO0FBQ0Q7QUFDRCxNQUFJakIscUJBQXFCO0FBQ3ZCTSxRQUFJVSxhQUFhc0gsTUFBTXZILFdBQU4sQ0FBa0JFO0FBRFosR0FBekI7O0FBSUEsU0FBT3FILEtBQVAsRUFBYztBQUNaLFFBQU1HLG9CQUFvQk4sZUFBZUcsTUFBTXZILFdBQXJCLEVBQWtDLGNBQWxDLENBQTFCO0FBQ0FiLFdBQU9HLE1BQVAsQ0FBY29JLGlCQUFkO0FBQ0EsUUFBSUEsaUJBQUosRUFBdUI7QUFDckJ6SSwyQkFBcUJFLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCc0ksaUJBQWxCLEVBQXFDekksa0JBQXJDLENBQXJCO0FBQ0Q7QUFDRHNJLFlBQVFwSSxPQUFPd0ksY0FBUCxDQUFzQkosS0FBdEIsQ0FBUjtBQUNEO0FBQ0Q7QUFDQUUsc0JBQW9CeEksa0JBQXBCLEdBQXlDQSxrQkFBekM7QUFDQSxTQUFPQSxrQkFBUDtBQUNEOztBQUVNLElBQU0ySSxzQ0FBZTtBQUMxQko7QUFEMEIsQ0FBckIiLCJmaWxlIjoibGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuLyogZ2xvYmFsIHdpbmRvdyAqL1xuaW1wb3J0IHtHTH0gZnJvbSAnbHVtYS5nbCc7XG5pbXBvcnQgQXR0cmlidXRlTWFuYWdlciBmcm9tICcuL2F0dHJpYnV0ZS1tYW5hZ2VyJztcbmltcG9ydCB7Y29tcGFyZVByb3BzLCBsb2csIGNvdW50fSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLypcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wcy5pZCAtIGxheWVyIG5hbWVcbiAqIEBwYXJhbSB7YXJyYXl9ICBwcm9wcy5kYXRhIC0gYXJyYXkgb2YgZGF0YSBpbnN0YW5jZXNcbiAqIEBwYXJhbSB7Ym9vbH0gcHJvcHMub3BhY2l0eSAtIG9wYWNpdHkgb2YgdGhlIGxheWVyXG4gKi9cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgZGF0YUl0ZXJhdG9yOiBudWxsLFxuICBkYXRhQ29tcGFyYXRvcjogbnVsbCxcbiAgbnVtSW5zdGFuY2VzOiB1bmRlZmluZWQsXG4gIHZpc2libGU6IHRydWUsXG4gIHBpY2thYmxlOiBmYWxzZSxcbiAgb3BhY2l0eTogMC44LFxuICBvbkhvdmVyOiAoKSA9PiB7fSxcbiAgb25DbGljazogKCkgPT4ge30sXG4gIC8vIFVwZGF0ZSB0cmlnZ2VyczogYSBrZXkgY2hhbmdlIGRldGVjdGlvbiBtZWNoYW5pc20gaW4gZGVjay5nbFxuICAvLyBTZWUgbGF5ZXIgZG9jdW1lbnRhdGlvblxuICB1cGRhdGVUcmlnZ2Vyczoge31cbn07XG5cbmxldCBjb3VudGVyID0gMDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGF5ZXIge1xuICAvKipcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyAtIFNlZSBkb2NzIGFuZCBkZWZhdWx0cyBhYm92ZVxuICAgKi9cbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAvLyBJZiBzdWJsYXllciBoYXMgc3RhdGljIGRlZmF1bHRQcm9wcyBtZW1iZXIsIGdldERlZmF1bHRQcm9wcyB3aWxsIHJldHVybiBpdFxuICAgIGNvbnN0IG1lcmdlZERlZmF1bHRQcm9wcyA9IGdldERlZmF1bHRQcm9wcyh0aGlzKTtcbiAgICAvLyBNZXJnZSBzdXBwbGllZCBwcm9wcyB3aXRoIHByZS1tZXJnZWQgZGVmYXVsdCBwcm9wc1xuICAgIHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgbWVyZ2VkRGVmYXVsdFByb3BzLCBwcm9wcyk7XG4gICAgLy8gQWNjZXB0IG51bGwgYXMgZGF0YSAtIG90aGVyd2lzZSBhcHBzIGFuZCBsYXllcnMgbmVlZCB0byBhZGQgdWdseSBjaGVja3NcbiAgICBwcm9wcy5kYXRhID0gcHJvcHMuZGF0YSB8fCBbXTtcbiAgICAvLyBQcm9wcyBhcmUgaW1tdXRhYmxlXG4gICAgT2JqZWN0LmZyZWV6ZShwcm9wcyk7XG5cbiAgICAvLyBEZWZpbmUgYWxsIG1lbWJlcnMgYW5kIGZyZWV6ZSBsYXllclxuICAgIHRoaXMuaWQgPSBwcm9wcy5pZDtcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgdGhpcy5vbGRQcm9wcyA9IG51bGw7XG4gICAgdGhpcy5zdGF0ZSA9IG51bGw7XG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICB0aGlzLmNvdW50ID0gY291bnRlcisrO1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkUHJvcCgnaWQnLCB4ID0+IHR5cGVvZiB4ID09PSAnc3RyaW5nJyAmJiB4ICE9PSAnJyk7XG4gICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkUHJvcCgnZGF0YScpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgY29uc3QgY2xhc3NOYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5sYXllck5hbWUgfHwgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgIHJldHVybiBjbGFzc05hbWUgIT09IHRoaXMucHJvcHMuaWQgPyBgPCR7Y2xhc3NOYW1lfTonJHt0aGlzLnByb3BzLmlkfSc+YCA6IGA8JHtjbGFzc05hbWV9PmA7XG4gIH1cblxuICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBMSUZFQ1lDTEUgTUVUSE9EUywgb3ZlcnJpZGRlbiBieSB0aGUgbGF5ZXIgc3ViY2xhc3Nlc1xuXG4gIC8vIENhbGxlZCBvbmNlIHRvIHNldCB1cCB0aGUgaW5pdGlhbCBzdGF0ZVxuICAvLyBBcHAgY2FuIGNyZWF0ZSBXZWJHTCByZXNvdXJjZXNcbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgTGF5ZXIgJHt0aGlzfSBoYXMgbm90IGRlZmluZWQgaW5pdGlhbGl6ZVN0YXRlYCk7XG4gIH1cblxuICAvLyBMZXQncyBsYXllciBjb250cm9sIGlmIHVwZGF0ZVN0YXRlIHNob3VsZCBiZSBjYWxsZWRcbiAgc2hvdWxkVXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgb2xkQ29udGV4dCwgY29udGV4dCwgY2hhbmdlRmxhZ3N9KSB7XG4gICAgcmV0dXJuIGNoYW5nZUZsYWdzLnNvbWV0aGluZ0NoYW5nZWQ7XG4gIH1cblxuICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uLCBhbGwgYXR0cmlidXRlcyB3aWxsIGJlIGludmFsaWRhdGVkIGFuZCB1cGRhdGVkXG4gIC8vIHdoZW4gZGF0YSBjaGFuZ2VzXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIG9sZENvbnRleHQsIGNvbnRleHQsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCkge1xuICAgICAgdGhpcy5pbnZhbGlkYXRlQXR0cmlidXRlKCdhbGwnKTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxsZWQgb25jZSB3aGVuIGxheWVyIGlzIG5vIGxvbmdlciBtYXRjaGVkIGFuZCBzdGF0ZSB3aWxsIGJlIGRpc2NhcmRlZFxuICAvLyBBcHAgY2FuIGRlc3Ryb3kgV2ViR0wgcmVzb3VyY2VzIGhlcmVcbiAgZmluYWxpemVTdGF0ZSgpIHtcbiAgfVxuXG4gIC8vIEltcGxlbWVudCB0byBnZW5lcmF0ZSBzdWJsYXllcnNcbiAgcmVuZGVyTGF5ZXJzKCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gSWYgc3RhdGUgaGFzIGEgbW9kZWwsIGRyYXcgaXQgd2l0aCBzdXBwbGllZCB1bmlmb3Jtc1xuICBkcmF3KHt1bmlmb3JtcyA9IHt9fSkge1xuICAgIGlmICh0aGlzLnN0YXRlLm1vZGVsKSB7XG4gICAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcih1bmlmb3Jtcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgc3RhdGUgaGFzIGEgbW9kZWwsIGRyYXcgaXQgd2l0aCBzdXBwbGllZCB1bmlmb3Jtc1xuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBwaWNrKHtpbmZvLCB1bmlmb3JtcywgcGlja0VuYWJsZVVuaWZvcm1zLCBwaWNrRGlzYWJsZVVuaWZvcm1zLCBtb2RlfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3Qge21vZGVsfSA9IHRoaXMuc3RhdGU7XG5cbiAgICBpZiAobW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldFVuaWZvcm1zKHBpY2tFbmFibGVVbmlmb3Jtcyk7XG4gICAgICBtb2RlbC5yZW5kZXIodW5pZm9ybXMpO1xuICAgICAgbW9kZWwuc2V0VW5pZm9ybXMocGlja0Rpc2FibGVVbmlmb3Jtcyk7XG5cbiAgICAgIC8vIFJlYWQgY29sb3IgaW4gdGhlIGNlbnRyYWwgcGl4ZWwsIHRvIGJlIG1hcHBlZCB3aXRoIHBpY2tpbmcgY29sb3JzXG4gICAgICBjb25zdCBbeCwgeV0gPSBpbmZvLmRldmljZVBpeGVsO1xuICAgICAgY29uc3QgY29sb3IgPSBuZXcgVWludDhBcnJheSg0KTtcbiAgICAgIGdsLnJlYWRQaXhlbHMoeCwgeSwgMSwgMSwgR0wuUkdCQSwgR0wuVU5TSUdORURfQllURSwgY29sb3IpO1xuXG4gICAgICAvLyBJbmRleCA8IDAgbWVhbnMgbm90aGluZyBzZWxlY3RlZFxuICAgICAgaW5mby5pbmRleCA9IHRoaXMuZGVjb2RlUGlja2luZ0NvbG9yKGNvbG9yKTtcbiAgICAgIGluZm8uY29sb3IgPSBjb2xvcjtcblxuICAgICAgLy8gVE9ETyAtIHNlbGVjdGVkUGlja2luZ0NvbG9yIHNob3VsZCBiZSByZW1vdmVkP1xuICAgICAgaWYgKG1vZGUgPT09ICdob3ZlcicpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRQaWNraW5nQ29sb3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICBzZWxlY3RlZFBpY2tpbmdDb2xvclswXSA9IGNvbG9yWzBdO1xuICAgICAgICBzZWxlY3RlZFBpY2tpbmdDb2xvclsxXSA9IGNvbG9yWzFdO1xuICAgICAgICBzZWxlY3RlZFBpY2tpbmdDb2xvclsyXSA9IGNvbG9yWzJdO1xuICAgICAgICB0aGlzLnNldFVuaWZvcm1zKHtzZWxlY3RlZFBpY2tpbmdDb2xvcn0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgLy8gRU5EIExJRkVDWUNMRSBNRVRIT0RTXG4gIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiBhdHRyaWJ1dGUgaW52YWxpZGF0aW9uLCBjYW4gYmUgcmVkZWZpbmVcbiAgaW52YWxpZGF0ZUF0dHJpYnV0ZShuYW1lID0gJ2FsbCcpIHtcbiAgICBpZiAobmFtZSA9PT0gJ2FsbCcpIHtcbiAgICAgIHRoaXMuc3RhdGUuYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGUuYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlKG5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhbGxzIGF0dHJpYnV0ZSBtYW5hZ2VyIHRvIHVwZGF0ZSBhbnkgV2ViR0wgYXR0cmlidXRlcywgY2FuIGJlIHJlZGVmaW5lZFxuICB1cGRhdGVBdHRyaWJ1dGVzKHByb3BzKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXIsIG1vZGVsfSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKCFhdHRyaWJ1dGVNYW5hZ2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbnVtSW5zdGFuY2VzID0gdGhpcy5nZXROdW1JbnN0YW5jZXMocHJvcHMpO1xuICAgIC8vIEZpZ3VyZSBvdXQgZGF0YSBsZW5ndGhcbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLnVwZGF0ZSh7XG4gICAgICBkYXRhOiBwcm9wcy5kYXRhLFxuICAgICAgbnVtSW5zdGFuY2VzLFxuICAgICAgcHJvcHMsXG4gICAgICBidWZmZXJzOiBwcm9wcyxcbiAgICAgIGNvbnRleHQ6IHRoaXMsXG4gICAgICAvLyBEb24ndCB3b3JyeSBhYm91dCBub24tYXR0cmlidXRlIHByb3BzXG4gICAgICBpZ25vcmVVbmtub3duQXR0cmlidXRlczogdHJ1ZVxuICAgIH0pO1xuICAgIGlmIChtb2RlbCkge1xuICAgICAgY29uc3QgY2hhbmdlZEF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVNYW5hZ2VyLmdldENoYW5nZWRBdHRyaWJ1dGVzKHtjbGVhckNoYW5nZWRGbGFnczogdHJ1ZX0pO1xuICAgICAgbW9kZWwuc2V0QXR0cmlidXRlcyhjaGFuZ2VkQXR0cmlidXRlcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljIEFQSVxuXG4gIC8vIFVwZGF0ZXMgc2VsZWN0ZWQgc3RhdGUgbWVtYmVycyBhbmQgbWFya3MgdGhlIG9iamVjdCBmb3IgcmVkcmF3XG4gIHNldFN0YXRlKHVwZGF0ZU9iamVjdCkge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwgdXBkYXRlT2JqZWN0KTtcbiAgICB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgfVxuXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSkge1xuICAgICAgdGhpcy5zdGF0ZS5uZWVkc1JlZHJhdyA9IHJlZHJhdztcbiAgICB9XG4gIH1cblxuICAvLyBQUk9KRUNUSU9OIE1FVEhPRFNcblxuICAvKipcbiAgICogUHJvamVjdHMgYSBwb2ludCB3aXRoIGN1cnJlbnQgbWFwIHN0YXRlIChsYXQsIGxvbiwgem9vbSwgcGl0Y2gsIGJlYXJpbmcpXG4gICAqXG4gICAqIE5vdGU6IFBvc2l0aW9uIGNvbnZlcnNpb24gaXMgZG9uZSBpbiBzaGFkZXIsIHNvIGluIG1hbnkgY2FzZXMgdGhlcmUgaXMgbm8gbmVlZFxuICAgKiBmb3IgdGhpcyBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0FycmF5fFR5cGVkQXJyYXl9IGxuZ0xhdCAtIGxvbmcgYW5kIGxhdCB2YWx1ZXNcbiAgICogQHJldHVybiB7QXJyYXl8VHlwZWRBcnJheX0gLSB4LCB5IGNvb3JkaW5hdGVzXG4gICAqL1xuICBwcm9qZWN0KGxuZ0xhdCkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkobG5nTGF0KSwgJ0xheWVyLnByb2plY3QgbmVlZHMgW2xuZyxsYXRdJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnByb2plY3QobG5nTGF0KTtcbiAgfVxuXG4gIHVucHJvamVjdCh4eSkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoeHkpLCAnTGF5ZXIudW5wcm9qZWN0IG5lZWRzIFt4LHldJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnVucHJvamVjdCh4eSk7XG4gIH1cblxuICBwcm9qZWN0RmxhdChsbmdMYXQpIHtcbiAgICBjb25zdCB7dmlld3BvcnR9ID0gdGhpcy5jb250ZXh0O1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGxuZ0xhdCksICdMYXllci5wcm9qZWN0IG5lZWRzIFtsbmcsbGF0XScpO1xuICAgIHJldHVybiB2aWV3cG9ydC5wcm9qZWN0RmxhdChsbmdMYXQpO1xuICB9XG5cbiAgdW5wcm9qZWN0RmxhdCh4eSkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoeHkpLCAnTGF5ZXIudW5wcm9qZWN0IG5lZWRzIFt4LHldJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnVucHJvamVjdEZsYXQoeHkpO1xuICB9XG5cbiAgc2NyZWVuVG9EZXZpY2VQaXhlbHMoc2NyZWVuUGl4ZWxzKSB7XG4gICAgY29uc3QgZGV2aWNlUGl4ZWxSYXRpbyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID9cbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIDogMTtcbiAgICByZXR1cm4gc2NyZWVuUGl4ZWxzICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwaWNraW5nIGNvbG9yIHRoYXQgZG9lc24ndCBtYXRjaCBhbnkgc3ViZmVhdHVyZVxuICAgKiBVc2UgaWYgc29tZSBncmFwaGljcyBkbyBub3QgYmVsb25nIHRvIGFueSBwaWNrYWJsZSBzdWJmZWF0dXJlXG4gICAqIEByZXR1cm4ge0FycmF5fSAtIGEgYmxhY2sgY29sb3JcbiAgICovXG4gIG51bGxQaWNraW5nQ29sb3IoKSB7XG4gICAgcmV0dXJuIFswLCAwLCAwXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwaWNraW5nIGNvbG9yIHRoYXQgZG9lc24ndCBtYXRjaCBhbnkgc3ViZmVhdHVyZVxuICAgKiBVc2UgaWYgc29tZSBncmFwaGljcyBkbyBub3QgYmVsb25nIHRvIGFueSBwaWNrYWJsZSBzdWJmZWF0dXJlXG4gICAqIEBwYXJhbSB7aW50fSBpIC0gaW5kZXggdG8gYmUgZGVjb2RlZFxuICAgKiBAcmV0dXJuIHtBcnJheX0gLSB0aGUgZGVjb2RlZCBjb2xvclxuICAgKi9cbiAgZW5jb2RlUGlja2luZ0NvbG9yKGkpIHtcbiAgICByZXR1cm4gW1xuICAgICAgKGkgKyAxKSAlIDI1NixcbiAgICAgIE1hdGguZmxvb3IoKGkgKyAxKSAvIDI1NikgJSAyNTYsXG4gICAgICBNYXRoLmZsb29yKChpICsgMSkgLyAyNTYgLyAyNTYpICUgMjU2XG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwaWNraW5nIGNvbG9yIHRoYXQgZG9lc24ndCBtYXRjaCBhbnkgc3ViZmVhdHVyZVxuICAgKiBVc2UgaWYgc29tZSBncmFwaGljcyBkbyBub3QgYmVsb25nIHRvIGFueSBwaWNrYWJsZSBzdWJmZWF0dXJlXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gY29sb3IgLSBjb2xvciBhcnJheSB0byBiZSBkZWNvZGVkXG4gICAqIEByZXR1cm4ge0FycmF5fSAtIHRoZSBkZWNvZGVkIHBpY2tpbmcgY29sb3JcbiAgICovXG4gIGRlY29kZVBpY2tpbmdDb2xvcihjb2xvcikge1xuICAgIGFzc2VydChjb2xvciBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpO1xuICAgIGNvbnN0IFtpMSwgaTIsIGkzXSA9IGNvbG9yO1xuICAgIC8vIDEgd2FzIGFkZGVkIHRvIHNlcGVyYXRlIGZyb20gbm8gc2VsZWN0aW9uXG4gICAgY29uc3QgaW5kZXggPSBpMSArIGkyICogMjU2ICsgaTMgKiA2NTUzNiAtIDE7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzKGF0dHJpYnV0ZSwge251bUluc3RhbmNlc30pIHtcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIC8vIGFkZCAxIHRvIGluZGV4IHRvIHNlcGVyYXRlIGZyb20gbm8gc2VsZWN0aW9uXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1JbnN0YW5jZXM7IGkrKykge1xuICAgICAgY29uc3QgcGlja2luZ0NvbG9yID0gdGhpcy5lbmNvZGVQaWNraW5nQ29sb3IoaSk7XG4gICAgICB2YWx1ZVtpICogc2l6ZSArIDBdID0gcGlja2luZ0NvbG9yWzBdO1xuICAgICAgdmFsdWVbaSAqIHNpemUgKyAxXSA9IHBpY2tpbmdDb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMl0gPSBwaWNraW5nQ29sb3JbMl07XG4gICAgfVxuICB9XG5cbiAgLy8gREFUQSBBQ0NFU1MgQVBJXG4gIC8vIERhdGEgY2FuIHVzZSBpdGVyYXRvcnMgYW5kIG1heSBub3QgYmUgcmFuZG9tIGFjY2Vzc1xuXG4gIC8vIFVzZSBpdGVyYXRpb24gKHRoZSBvbmx5IHJlcXVpcmVkIGNhcGFiaWxpdHkgb24gZGF0YSkgdG8gZ2V0IGZpcnN0IGVsZW1lbnRcbiAgZ2V0Rmlyc3RPYmplY3QoKSB7XG4gICAgY29uc3Qge2RhdGF9ID0gdGhpcy5wcm9wcztcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIElOVEVSTkFMIE1FVEhPRFNcblxuICAvLyBEZWR1Y2VzIG51bWVyIG9mIGluc3RhbmNlcy4gSW50ZW50aW9uIGlzIHRvIHN1cHBvcnQ6XG4gIC8vIC0gRXhwbGljaXQgc2V0dGluZyBvZiBudW1JbnN0YW5jZXNcbiAgLy8gLSBBdXRvLWRlZHVjdGlvbiBmb3IgRVM2IGNvbnRhaW5lcnMgdGhhdCBkZWZpbmUgYSBzaXplIG1lbWJlclxuICAvLyAtIEF1dG8tZGVkdWN0aW9uIGZvciBDbGFzc2ljIEFycmF5cyB2aWEgdGhlIGJ1aWx0LWluIGxlbmd0aCBhdHRyaWJ1dGVcbiAgLy8gLSBBdXRvLWRlZHVjdGlvbiB2aWEgYXJyYXlzXG4gIGdldE51bUluc3RhbmNlcyhwcm9wcykge1xuICAgIHByb3BzID0gcHJvcHMgfHwgdGhpcy5wcm9wcztcblxuICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoZSBsYXllciBoYXMgc2V0IGl0cyBvd24gdmFsdWVcbiAgICBpZiAodGhpcy5zdGF0ZSAmJiB0aGlzLnN0YXRlLm51bUluc3RhbmNlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0ZS5udW1JbnN0YW5jZXM7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgYXBwIGhhcyBwcm92aWRlZCBhbiBleHBsaWNpdCB2YWx1ZVxuICAgIGlmIChwcm9wcy5udW1JbnN0YW5jZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHByb3BzLm51bUluc3RhbmNlcztcbiAgICB9XG5cbiAgICAvLyBVc2UgY29udGFpbmVyIGxpYnJhcnkgdG8gZ2V0IGEgY291bnQgZm9yIGFueSBFUzYgY29udGFpbmVyIG9yIG9iamVjdFxuICAgIGNvbnN0IHtkYXRhfSA9IHByb3BzO1xuICAgIHJldHVybiBjb3VudChkYXRhKTtcbiAgfVxuXG4gIC8vIExBWUVSIE1BTkFHRVIgQVBJXG4gIC8vIFNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSB0aGUgZGVjay5nbCBMYXllck1hbmFnZXIgY2xhc3NcblxuICAvLyBDYWxsZWQgYnkgbGF5ZXIgbWFuYWdlciB3aGVuIGEgbmV3IGxheWVyIGlzIGZvdW5kXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIGluaXRpYWxpemVMYXllcih1cGRhdGVQYXJhbXMpIHtcbiAgICBhc3NlcnQodGhpcy5jb250ZXh0LmdsLCAnTGF5ZXIgY29udGV4dCBtaXNzaW5nIGdsJyk7XG4gICAgYXNzZXJ0KCF0aGlzLnN0YXRlLCAnTGF5ZXIgbWlzc2luZyBzdGF0ZScpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHt9O1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBzdGF0ZSBvbmx5IG9uY2VcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXI6IG5ldyBBdHRyaWJ1dGVNYW5hZ2VyKHtpZDogdGhpcy5wcm9wcy5pZH0pLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBuZWVkc1JlZHJhdzogdHJ1ZSxcbiAgICAgIGRhdGFDaGFuZ2VkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgYXR0cmlidXRlIG1hbmFnZXIgbG9nZ2VycyBpZiBwcm92aWRlZFxuICAgIHRoaXMuc3RhdGUuYXR0cmlidXRlTWFuYWdlci5zZXRMb2dGdW5jdGlvbnModGhpcy5wcm9wcyk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8vIEFsbCBpbnN0YW5jZWQgbGF5ZXJzIGdldCBpbnN0YW5jZVBpY2tpbmdDb2xvcnMgYXR0cmlidXRlIGJ5IGRlZmF1bHRcbiAgICAvLyBUaGVpciBzaGFkZXJzIGNhbiB1c2UgaXQgdG8gcmVuZGVyIGEgcGlja2luZyBzY2VuZVxuICAgIC8vIFRPRE8gLSB0aGlzIHNsb3dzIGRvd24gbm9uIGluc3RhbmNlZCBsYXllcnNcbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBpY2tpbmdDb2xvcnM6IHtcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgc2l6ZTogMyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUGlja2luZ0NvbG9yc1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kc1xuICAgIHRoaXMuaW5pdGlhbGl6ZVN0YXRlKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0ZSh1cGRhdGVQYXJhbXMpO1xuICAgIC8vIEVuZCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kc1xuXG4gICAgLy8gQWRkIGFueSBzdWJjbGFzcyBhdHRyaWJ1dGVzXG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGVzKHRoaXMucHJvcHMpO1xuICAgIHRoaXMuX3VwZGF0ZUJhc2VVbmlmb3JtcygpO1xuXG4gICAgY29uc3Qge21vZGVsfSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKG1vZGVsKSB7XG4gICAgICBtb2RlbC5zZXRJbnN0YW5jZUNvdW50KHRoaXMuZ2V0TnVtSW5zdGFuY2VzKCkpO1xuICAgICAgbW9kZWwuaWQgPSB0aGlzLnByb3BzLmlkO1xuICAgICAgbW9kZWwucHJvZ3JhbS5pZCA9IGAke3RoaXMucHJvcHMuaWR9LXByb2dyYW1gO1xuICAgICAgbW9kZWwuZ2VvbWV0cnkuaWQgPSBgJHt0aGlzLnByb3BzLmlkfS1nZW9tZXRyeWA7XG4gICAgICBtb2RlbC5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZU1hbmFnZXIuZ2V0QXR0cmlidXRlcygpKTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxsZWQgYnkgbGF5ZXIgbWFuYWdlciB3aGVuIGV4aXN0aW5nIGxheWVyIGlzIGdldHRpbmcgbmV3IHByb3BzXG4gIHVwZGF0ZUxheWVyKHVwZGF0ZVBhcmFtcykge1xuICAgIC8vIENoZWNrIGZvciBkZXByZWNhdGVkIG1ldGhvZFxuICAgIGlmICh0aGlzLnNob3VsZFVwZGF0ZSkge1xuICAgICAgbG9nLm9uY2UoMCwgYGRlY2suZ2wgdjMgJHt0aGlzfTogXCJzaG91bGRVcGRhdGVcIiBkZXByZWNhdGVkLCByZW5hbWVkIHRvIFwic2hvdWxkVXBkYXRlU3RhdGVcImApO1xuICAgIH1cblxuICAgIC8vIENhbGwgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZFxuICAgIGNvbnN0IHN0YXRlTmVlZHNVcGRhdGUgPSB0aGlzLnNob3VsZFVwZGF0ZVN0YXRlKHVwZGF0ZVBhcmFtcyk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcblxuICAgIGlmIChzdGF0ZU5lZWRzVXBkYXRlKSB7XG5cbiAgICAgIC8vIENhbGwgZGVwcmVjYXRlZCBsaWZlY3ljbGUgbWV0aG9kIGlmIGRlZmluZWRcbiAgICAgIGNvbnN0IGhhc1JlZGVmaW5lZE1ldGhvZCA9IHRoaXMud2lsbFJlY2VpdmVQcm9wcyAmJlxuICAgICAgICB0aGlzLndpbGxSZWNlaXZlUHJvcHMgIT09IExheWVyLnByb3RvdHlwZS53aWxsUmVjZWl2ZVByb3BzO1xuICAgICAgaWYgKGhhc1JlZGVmaW5lZE1ldGhvZCkge1xuICAgICAgICBsb2cub25jZSgwLCBgZGVjay5nbCB2MyB3aWxsUmVjZWl2ZVByb3BzIGRlcHJlY2F0ZWQuIFVzZSB1cGRhdGVTdGF0ZSBpbiAke3RoaXN9YCk7XG4gICAgICAgIGNvbnN0IHtvbGRQcm9wcywgcHJvcHMsIGNoYW5nZUZsYWdzfSA9IHVwZGF0ZVBhcmFtcztcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShjaGFuZ2VGbGFncyk7XG4gICAgICAgIHRoaXMud2lsbFJlY2VpdmVQcm9wcyhvbGRQcm9wcywgcHJvcHMsIGNoYW5nZUZsYWdzKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgZGF0YUNoYW5nZWQ6IGZhbHNlLFxuICAgICAgICAgIHZpZXdwb3J0Q2hhbmdlZDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuXG4gICAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RcbiAgICAgIHRoaXMudXBkYXRlU3RhdGUodXBkYXRlUGFyYW1zKTtcbiAgICAgIC8vIEVuZCBsaWZlY3ljbGUgbWV0aG9kXG5cbiAgICAgIC8vIFJ1biB0aGUgYXR0cmlidXRlIHVwZGF0ZXJzXG4gICAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZXModXBkYXRlUGFyYW1zLnByb3BzKTtcbiAgICAgIHRoaXMuX3VwZGF0ZUJhc2VVbmlmb3JtcygpO1xuXG4gICAgICBpZiAodGhpcy5zdGF0ZS5tb2RlbCkge1xuICAgICAgICB0aGlzLnN0YXRlLm1vZGVsLnNldEluc3RhbmNlQ291bnQodGhpcy5nZXROdW1JbnN0YW5jZXMoKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cblxuICAvLyBDYWxsZWQgYnkgbWFuYWdlciB3aGVuIGxheWVyIGlzIGFib3V0IHRvIGJlIGRpc3Bvc2VkXG4gIC8vIE5vdGU6IG5vdCBndWFyYW50ZWVkIHRvIGJlIGNhbGxlZCBvbiBhcHBsaWNhdGlvbiBzaHV0ZG93blxuICBmaW5hbGl6ZUxheWVyKCkge1xuICAgIC8vIENhbGwgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZFxuICAgIHRoaXMuZmluYWxpemVTdGF0ZSgpO1xuICAgIC8vIEVuZCBsaWZlY3ljbGUgbWV0aG9kXG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHVuaWZvcm1zXG4gIGRyYXdMYXllcih7dW5pZm9ybXMgPSB7fX0pIHtcbiAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RcbiAgICB0aGlzLmRyYXcoe3VuaWZvcm1zfSk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgfVxuXG4gIC8vIHt1bmlmb3JtcyA9IHt9LCAuLi5vcHRzfVxuICBwaWNrTGF5ZXIob3B0cykge1xuICAgIC8vIENhbGwgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZFxuICAgIHJldHVybiB0aGlzLnBpY2sob3B0cyk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgfVxuXG4gIGRpZmZQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMsIGNvbnRleHQpIHtcbiAgICAvLyBGaXJzdCBjaGVjayBpZiBhbnkgcHJvcHMgaGF2ZSBjaGFuZ2VkIChpZ25vcmUgcHJvcHMgdGhhdCB3aWxsIGJlIGV4YW1pbmVkIHNlcGFyYXRlbHkpXG4gICAgY29uc3QgcHJvcHNDaGFuZ2VkUmVhc29uID0gY29tcGFyZVByb3BzKHtcbiAgICAgIG5ld1Byb3BzLFxuICAgICAgb2xkUHJvcHMsXG4gICAgICBpZ25vcmVQcm9wczoge2RhdGE6IG51bGwsIHVwZGF0ZVRyaWdnZXJzOiBudWxsfVxuICAgIH0pO1xuXG4gICAgLy8gTm93IGNoZWNrIGlmIGFueSBkYXRhIHJlbGF0ZWQgcHJvcHMgaGF2ZSBjaGFuZ2VkXG4gICAgY29uc3QgZGF0YUNoYW5nZWRSZWFzb24gPSB0aGlzLl9kaWZmRGF0YVByb3BzKG9sZFByb3BzLCBuZXdQcm9wcyk7XG5cbiAgICBjb25zdCBwcm9wc0NoYW5nZWQgPSBCb29sZWFuKHByb3BzQ2hhbmdlZFJlYXNvbik7XG4gICAgY29uc3QgZGF0YUNoYW5nZWQgPSBCb29sZWFuKGRhdGFDaGFuZ2VkUmVhc29uKTtcbiAgICBjb25zdCB2aWV3cG9ydENoYW5nZWQgPSBjb250ZXh0LnZpZXdwb3J0Q2hhbmdlZDtcbiAgICBjb25zdCBzb21ldGhpbmdDaGFuZ2VkID0gcHJvcHNDaGFuZ2VkIHx8IGRhdGFDaGFuZ2VkIHx8IHZpZXdwb3J0Q2hhbmdlZDtcblxuICAgIC8vIENoZWNrIHVwZGF0ZSB0cmlnZ2VycyB0byBkZXRlcm1pbmUgaWYgYW55IGF0dHJpYnV0ZXMgbmVlZCByZWdlbmVyYXRpb25cbiAgICAvLyBOb3RlIC0gaWYgZGF0YSBoYXMgY2hhbmdlZCwgYWxsIGF0dHJpYnV0ZXMgd2lsbCBuZWVkIHJlZ2VuZXJhdGlvbiwgc28gc2tpcCB0aGlzIHN0ZXBcbiAgICBpZiAoIWRhdGFDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9kaWZmVXBkYXRlVHJpZ2dlcnMob2xkUHJvcHMsIG5ld1Byb3BzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nLmxvZygxLCBgZGF0YUNoYW5nZWQ6ICR7ZGF0YUNoYW5nZWR9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHByb3BzQ2hhbmdlZCxcbiAgICAgIGRhdGFDaGFuZ2VkLFxuICAgICAgdmlld3BvcnRDaGFuZ2VkLFxuICAgICAgc29tZXRoaW5nQ2hhbmdlZCxcbiAgICAgIHJlYXNvbjogZGF0YUNoYW5nZWRSZWFzb24gfHwgcHJvcHNDaGFuZ2VkUmVhc29uXG4gICAgfTtcbiAgfVxuXG4gIC8vIENoZWNrcyBzdGF0ZSBvZiBhdHRyaWJ1dGVzIGFuZCBtb2RlbFxuICAvLyBUT0RPIC0gaXMgYXR0cmlidXRlIG1hbmFnZXIgbmVlZGVkPyAtIE1vZGVsIHNob3VsZCBiZSBlbm91Z2guXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICAvLyB0aGlzIG1ldGhvZCBtYXkgYmUgY2FsbGVkIGJ5IHRoZSByZW5kZXIgbG9vcCBhcyBzb29uIGEgdGhlIGxheWVyXG4gICAgLy8gaGFzIGJlZW4gY3JlYXRlZCwgc28gZ3VhcmQgYWdhaW5zdCB1bmluaXRpYWxpemVkIHN0YXRlXG4gICAgaWYgKCF0aGlzLnN0YXRlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHJlZHJhdyA9IGZhbHNlO1xuICAgIHJlZHJhdyA9IHJlZHJhdyB8fCB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3O1xuICAgIHRoaXMuc3RhdGUubmVlZHNSZWRyYXcgPSB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ICYmICFjbGVhclJlZHJhd0ZsYWdzO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXIsIG1vZGVsfSA9IHRoaXMuc3RhdGU7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IChhdHRyaWJ1dGVNYW5hZ2VyICYmIGF0dHJpYnV0ZU1hbmFnZXIuZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3N9KSk7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IChtb2RlbCAmJiBtb2RlbC5nZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFnc30pKTtcblxuICAgIHJldHVybiByZWRyYXc7XG4gIH1cblxuICAvLyBQUklWQVRFIE1FVEhPRFNcblxuICAvLyBUaGUgY29tcGFyaXNvbiBvZiB0aGUgZGF0YSBwcm9wIHJlcXVpcmVzIHNwZWNpYWwgaGFuZGxpbmdcbiAgLy8gdGhlIGRhdGFDb21wYXJhdG9yIHNob3VsZCBiZSB1c2VkIGlmIHN1cHBsaWVkXG4gIF9kaWZmRGF0YVByb3BzKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICAgIC8vIFN1cHBvcnQgb3B0aW9uYWwgYXBwIGRlZmluZWQgY29tcGFyaXNvbiBvZiBkYXRhXG4gICAgY29uc3Qge2RhdGFDb21wYXJhdG9yfSA9IG5ld1Byb3BzO1xuICAgIGlmIChkYXRhQ29tcGFyYXRvcikge1xuICAgICAgaWYgKCFkYXRhQ29tcGFyYXRvcihuZXdQcm9wcy5kYXRhLCBvbGRQcm9wcy5kYXRhKSkge1xuICAgICAgICByZXR1cm4gJ0RhdGEgY29tcGFyYXRvciBkZXRlY3RlZCBhIGNoYW5nZSc7XG4gICAgICB9XG4gICAgLy8gT3RoZXJ3aXNlLCBkbyBhIHNoYWxsb3cgZXF1YWwgb24gcHJvcHNcbiAgICB9IGVsc2UgaWYgKG5ld1Byb3BzLmRhdGEgIT09IG9sZFByb3BzLmRhdGEpIHtcbiAgICAgIHJldHVybiAnQSBuZXcgZGF0YSBjb250YWluZXIgd2FzIHN1cHBsaWVkJztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIENoZWNrcyBpZiBhbnkgdXBkYXRlIHRyaWdnZXJzIGhhdmUgY2hhbmdlZCwgYW5kIGludmFsaWRhdGVcbiAgLy8gYXR0cmlidXRlcyBhY2NvcmRpbmdseS5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgX2RpZmZVcGRhdGVUcmlnZ2VycyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgICAvLyBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8vIGNvbnN0IHVwZGF0ZVRyaWdnZXJNYXAgPSBhdHRyaWJ1dGVNYW5hZ2VyLmdldFVwZGF0ZVRyaWdnZXJNYXAoKTtcblxuICAgIGxldCBjaGFuZ2UgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcHJvcE5hbWUgaW4gbmV3UHJvcHMudXBkYXRlVHJpZ2dlcnMpIHtcbiAgICAgIGNvbnN0IG9sZFRyaWdnZXJzID0gb2xkUHJvcHMudXBkYXRlVHJpZ2dlcnNbcHJvcE5hbWVdIHx8IHt9O1xuICAgICAgY29uc3QgbmV3VHJpZ2dlcnMgPSBuZXdQcm9wcy51cGRhdGVUcmlnZ2Vyc1twcm9wTmFtZV0gfHwge307XG4gICAgICBjb25zdCBkaWZmUmVhc29uID0gY29tcGFyZVByb3BzKHtcbiAgICAgICAgb2xkUHJvcHM6IG9sZFRyaWdnZXJzLFxuICAgICAgICBuZXdQcm9wczogbmV3VHJpZ2dlcnNcbiAgICAgIH0pO1xuICAgICAgaWYgKGRpZmZSZWFzb24pIHtcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSAnYWxsJykge1xuICAgICAgICAgIGxvZy5sb2coMSwgYHVwZGF0ZVRyaWdnZXJzIGludmFsaWRhdGluZyBhbGwgYXR0cmlidXRlczogJHtkaWZmUmVhc29ufWApO1xuICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZSgnYWxsJyk7XG4gICAgICAgICAgY2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2cubG9nKDEsIGB1cGRhdGVUcmlnZ2VycyBpbnZhbGlkYXRpbmcgYXR0cmlidXRlICR7cHJvcE5hbWV9OiAke2RpZmZSZWFzb259YCk7XG4gICAgICAgICAgdGhpcy5pbnZhbGlkYXRlQXR0cmlidXRlKHByb3BOYW1lKTtcbiAgICAgICAgICBjaGFuZ2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYW5nZTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgdmFsaWRhdGVSZXF1aXJlZFByb3AocHJvcGVydHlOYW1lLCBjb25kaXRpb24pIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMucHJvcHNbcHJvcGVydHlOYW1lXTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm9wZXJ0eSAke3Byb3BlcnR5TmFtZX0gdW5kZWZpbmVkIGluIGxheWVyICR7dGhpc31gKTtcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbiAmJiAhY29uZGl0aW9uKHZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYWQgcHJvcGVydHkgJHtwcm9wZXJ0eU5hbWV9IGluIGxheWVyICR7dGhpc31gKTtcbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQmFzZVVuaWZvcm1zKCkge1xuICAgIHRoaXMuc2V0VW5pZm9ybXMoe1xuICAgICAgLy8gYXBwbHkgZ2FtbWEgdG8gb3BhY2l0eSB0byBtYWtlIGl0IHZpc3VhbGx5IFwibGluZWFyXCJcbiAgICAgIG9wYWNpdHk6IE1hdGgucG93KHRoaXMucHJvcHMub3BhY2l0eSwgMSAvIDIuMiksXG4gICAgICBPTkU6IDEuMFxuICAgIH0pO1xuICB9XG5cbiAgLy8gREVQUkVDQVRFRCBNRVRIT0RTXG4gIC8vIHNob3VsZFVwZGF0ZSgpIHt9XG5cbiAgd2lsbFJlY2VpdmVQcm9wcygpIHtcbiAgfVxuXG4gIC8vIFVwZGF0ZXMgc2VsZWN0ZWQgc3RhdGUgbWVtYmVycyBhbmQgbWFya3MgdGhlIG9iamVjdCBmb3IgcmVkcmF3XG4gIHNldFVuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5tb2RlbCkge1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRVbmlmb3Jtcyh1bmlmb3JtTWFwKTtcbiAgICB9XG4gICAgLy8gVE9ETyAtIHNldCBuZWVkc1JlZHJhdyBvbiB0aGUgbW9kZWw/XG4gICAgdGhpcy5zdGF0ZS5uZWVkc1JlZHJhdyA9IHRydWU7XG4gICAgbG9nKDMsICdsYXllci5zZXRVbmlmb3JtcycsIHVuaWZvcm1NYXApO1xuICB9XG59XG5cbkxheWVyLmxheWVyTmFtZSA9ICdMYXllcic7XG5MYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG5cbi8vIEhFTFBFUlNcblxuLy8gQ29uc3RydWN0b3JzIGhhdmUgdGhlaXIgc3VwZXIgY2xhc3MgY29uc3RydWN0b3JzIGFzIHByb3RvdHlwZXNcbmZ1bmN0aW9uIGdldE93blByb3BlcnR5KG9iamVjdCwgcHJvcCkge1xuICByZXR1cm4gb2JqZWN0Lmhhc093blByb3BlcnR5KHByb3ApICYmIG9iamVjdFtwcm9wXTtcbn1cbi8qXG4gKiBSZXR1cm4gbWVyZ2VkIGRlZmF1bHQgcHJvcHMgc3RvcmVkIG9uIGxheWVycyBjb25zdHJ1Y3RvciwgY3JlYXRlIHRoZW0gaWYgbmVlZGVkXG4gKi9cbmZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcyhsYXllcikge1xuICBjb25zdCBtZXJnZWREZWZhdWx0UHJvcHMgPSBnZXRPd25Qcm9wZXJ0eShsYXllci5jb25zdHJ1Y3RvciwgJ21lcmdlZERlZmF1bHRQcm9wcycpO1xuICBpZiAobWVyZ2VkRGVmYXVsdFByb3BzKSB7XG4gICAgcmV0dXJuIG1lcmdlZERlZmF1bHRQcm9wcztcbiAgfVxuICByZXR1cm4gbWVyZ2VEZWZhdWx0UHJvcHMobGF5ZXIpO1xufVxuXG4vKlxuICogV2FsayB0aGUgcHJvdG90eXBlIGNoYWluIGFuZCBtZXJnZSBhbGwgZGVmYXVsdCBwcm9wc1xuICovXG5mdW5jdGlvbiBtZXJnZURlZmF1bHRQcm9wcyhsYXllcikge1xuICBjb25zdCBzdWJDbGFzc0NvbnN0cnVjdG9yID0gbGF5ZXIuY29uc3RydWN0b3I7XG4gIGNvbnN0IGxheWVyTmFtZSA9IGdldE93blByb3BlcnR5KHN1YkNsYXNzQ29uc3RydWN0b3IsICdsYXllck5hbWUnKTtcbiAgaWYgKCFsYXllck5hbWUpIHtcbiAgICBsb2cub25jZSgwLCBgbGF5ZXIgJHtsYXllci5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBzcGVjaWZ5IGEgXCJsYXllck5hbWVcImApO1xuICB9XG4gIGxldCBtZXJnZWREZWZhdWx0UHJvcHMgPSB7XG4gICAgaWQ6IGxheWVyTmFtZSB8fCBsYXllci5jb25zdHJ1Y3Rvci5uYW1lXG4gIH07XG5cbiAgd2hpbGUgKGxheWVyKSB7XG4gICAgY29uc3QgbGF5ZXJEZWZhdWx0UHJvcHMgPSBnZXRPd25Qcm9wZXJ0eShsYXllci5jb25zdHJ1Y3RvciwgJ2RlZmF1bHRQcm9wcycpO1xuICAgIE9iamVjdC5mcmVlemUobGF5ZXJEZWZhdWx0UHJvcHMpO1xuICAgIGlmIChsYXllckRlZmF1bHRQcm9wcykge1xuICAgICAgbWVyZ2VkRGVmYXVsdFByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgbGF5ZXJEZWZhdWx0UHJvcHMsIG1lcmdlZERlZmF1bHRQcm9wcyk7XG4gICAgfVxuICAgIGxheWVyID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGxheWVyKTtcbiAgfVxuICAvLyBTdG9yZSBmb3IgcXVpY2sgbG9va3VwXG4gIHN1YkNsYXNzQ29uc3RydWN0b3IubWVyZ2VkRGVmYXVsdFByb3BzID0gbWVyZ2VkRGVmYXVsdFByb3BzO1xuICByZXR1cm4gbWVyZ2VkRGVmYXVsdFByb3BzO1xufVxuXG5leHBvcnQgY29uc3QgVEVTVF9FWFBPUlRTID0ge1xuICBtZXJnZURlZmF1bHRQcm9wc1xufTtcbiJdfQ==
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable
// View and Projection Matrix management

// gl-matrix is a large dependency for a small module.
// However since it is used by mapbox etc, it should already be present
// in most target application bundles.


exports.createMat4 = createMat4;

var _glMatrix = require('gl-matrix');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IDENTITY = createMat4();

var Viewport = function () {
  /**
   * @classdesc
   * Manages coordinate system transformations for deck.gl.
   *
   * Note: The Viewport is immutable in the sense that it only has accessors.
   * A new viewport instance should be created if any parameters have changed.
   *
   * @class
   * @param {Object} opt - options
   * @param {Boolean} mercator=true - Whether to use mercator projection
   *
   * @param {Number} opt.width=1 - Width of "viewport" or window
   * @param {Number} opt.height=1 - Height of "viewport" or window
   * @param {Array} opt.center=[0, 0] - Center of viewport
   *   [longitude, latitude] or [x, y]
   * @param {Number} opt.scale=1 - Either use scale or zoom
   * @param {Number} opt.pitch=0 - Camera angle in degrees (0 is straight down)
   * @param {Number} opt.bearing=0 - Map rotation in degrees (0 means north is up)
   * @param {Number} opt.altitude= - Altitude of camera in screen units
   *
   * Web mercator projection short-hand parameters
   * @param {Number} opt.latitude - Center of viewport on map (alternative to opt.center)
   * @param {Number} opt.longitude - Center of viewport on map (alternative to opt.center)
   * @param {Number} opt.zoom - Scale = Math.pow(2,zoom) on map (alternative to opt.scale)
   */
  /* eslint-disable complexity */
  function Viewport() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$width = _ref.width,
        width = _ref$width === undefined ? 1 : _ref$width,
        _ref$height = _ref.height,
        height = _ref$height === undefined ? 1 : _ref$height,
        _ref$viewMatrix = _ref.viewMatrix,
        viewMatrix = _ref$viewMatrix === undefined ? IDENTITY : _ref$viewMatrix,
        _ref$projectionMatrix = _ref.projectionMatrix,
        projectionMatrix = _ref$projectionMatrix === undefined ? IDENTITY : _ref$projectionMatrix;

    _classCallCheck(this, Viewport);

    // Silently allow apps to send in 0,0
    this.width = width || 1;
    this.height = height || 1;
    this.scale = 1;

    this.viewMatrix = viewMatrix;
    this.projectionMatrix = projectionMatrix;

    // Note: As usual, matrix operations should be applied in "reverse" order
    // since vectors will be multiplied in from the right during transformation
    var vpm = createMat4();
    _glMatrix.mat4.multiply(vpm, vpm, this.projectionMatrix);
    _glMatrix.mat4.multiply(vpm, vpm, this.viewMatrix);
    this.viewProjectionMatrix = vpm;

    // Calculate matrices and scales needed for projection
    /**
     * Builds matrices that converts preprojected lngLats to screen pixels
     * and vice versa.
     * Note: Currently returns bottom-left coordinates!
     * Note: Starts with the GL projection matrix and adds steps to the
     *       scale and translate that matrix onto the window.
     * Note: WebGL controls clip space to screen projection with gl.viewport
     *       and does not need this step.
     */
    var m = createMat4();

    // Scale with viewport window's width and height in pixels
    _glMatrix.mat4.scale(m, m, [this.width, this.height, 1]);
    // Convert to (0, 1)
    _glMatrix.mat4.translate(m, m, [0.5, 0.5, 0]);
    _glMatrix.mat4.scale(m, m, [0.5, 0.5, 1]);
    // Project to clip space (-1, 1)
    _glMatrix.mat4.multiply(m, m, this.viewProjectionMatrix);

    var mInverse = _glMatrix.mat4.invert(createMat4(), m);
    if (!mInverse) {
      throw new Error('Pixel project matrix not invertible');
    }

    this.pixelProjectionMatrix = m;
    this.pixelUnprojectionMatrix = mInverse;

    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectFlat = this.projectFlat.bind(this);
    this.unprojectFlat = this.unprojectFlat.bind(this);
    this.getMatrices = this.getMatrices.bind(this);
    this.getDistanceScales = this.getDistanceScales.bind(this);
  }
  /* eslint-enable complexity */

  // Two viewports are equal if width and height are identical, and if
  // their view and projection matrices are (approximately) equal.


  _createClass(Viewport, [{
    key: 'equals',
    value: function equals(viewport) {
      if (!(viewport instanceof Viewport)) {
        return false;
      }

      return viewport.width === this.width && viewport.height === this.height && _glMatrix.mat4.equals(viewport.projectionMatrix, this.projectionMatrix) && _glMatrix.mat4.equals(viewport.viewMatrix, this.viewMatrix);
    }

    /**
     * Projects xyz (possibly latitude and longitude) to pixel coordinates in window
     * using viewport projection parameters
     * - [longitude, latitude] to [x, y]
     * - [longitude, latitude, Z] => [x, y, z]
     * Note: By default, returns top-left coordinates for canvas/SVG type render
     *
     * @param {Array} lngLatZ - [lng, lat] or [lng, lat, Z]
     * @param {Object} opts - options
     * @param {Object} opts.topLeft=true - Whether projected coords are top left
     * @return {Array} - [x, y] or [x, y, z] in top left coords
     */

  }, {
    key: 'project',
    value: function project(xyz) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$topLeft = _ref2.topLeft,
          topLeft = _ref2$topLeft === undefined ? true : _ref2$topLeft;

      var Z = xyz[2] || 0;
      // console.error('projecting non-linear', xyz);

      var _projectFlat2 = this.projectFlat(xyz),
          _projectFlat3 = _slicedToArray(_projectFlat2, 2),
          X = _projectFlat3[0],
          Y = _projectFlat3[1];

      var v = [X, Y, Z, 1];
      // console.error('projecting linear', v);
      // vec4.sub(v, v, [this.centerX, this.centerY, 0, 0]);
      _glMatrix.vec4.transformMat4(v, v, this.pixelProjectionMatrix);
      // Divide by w
      var scale = 1 / v[3];
      _glMatrix.vec4.multiply(v, v, [scale, scale, scale, scale]);
      // console.error('projected', v);
      var x = v[0],
          z = v[2];

      var y = topLeft ? this.height - v[1] : v[1];
      return xyz.length === 2 ? [x, y] : [x, y, z];
    }

    /**
     * Unproject pixel coordinates on screen onto world coordinates,
     * (possibly [lon, lat]) on map.
     * - [x, y] => [lng, lat]
     * - [x, y, z] => [lng, lat, Z]
     * @param {Array} xyz -
     * @return {Array} - [lng, lat, Z] or [X, Y, Z]
     */

  }, {
    key: 'unproject',
    value: function unproject(xyz) {
      var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref3$topLeft = _ref3.topLeft,
          topLeft = _ref3$topLeft === undefined ? true : _ref3$topLeft;

      // console.error('unprojecting linear', xyz);
      var _xyz = _slicedToArray(xyz, 3),
          _xyz$ = _xyz[0],
          x = _xyz$ === undefined ? 0 : _xyz$,
          _xyz$2 = _xyz[1],
          y = _xyz$2 === undefined ? 0 : _xyz$2,
          _xyz$3 = _xyz[2],
          z = _xyz$3 === undefined ? 0 : _xyz$3;
      // const y2 = topLeft ? this.height - 1 - y : y;


      var y2 = topLeft ? this.height - y : y;
      var v = [x, y2, z, 1];
      _glMatrix.vec4.transformMat4(v, v, this.pixelUnprojectionMatrix);
      var scale = 1 / v[3];
      _glMatrix.vec4.multiply(v, v, [scale, scale, scale, scale]);
      // console.error('unprojecting non-linear', v);

      var _unprojectFlat2 = this.unprojectFlat(v),
          _unprojectFlat3 = _slicedToArray(_unprojectFlat2, 2),
          x0 = _unprojectFlat3[0],
          y0 = _unprojectFlat3[1];
      // console.error('unprojected', [x0, y0]);


      var z0 = v[2];

      return xyz.length === 2 ? [x0, y0] : [x0, y0, z0];
    }

    // NON_LINEAR PROJECTION HOOKS
    // Used for web meractor projection

    /**
     * Project [lng,lat] on sphere onto [x,y] on 512*512 Mercator Zoom 0 tile.
     * Performs the nonlinear part of the web mercator projection.
     * Remaining projection is done with 4x4 matrices which also handles
     * perspective.
     * @param {Array} lngLat - [lng, lat] coordinates
     *   Specifies a point on the sphere to project onto the map.
     * @return {Array} [x,y] coordinates.
     */

  }, {
    key: 'projectFlat',
    value: function projectFlat(_ref4) {
      var _ref5 = _slicedToArray(_ref4, 2),
          x = _ref5[0],
          y = _ref5[1];

      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return this._projectFlat.apply(this, arguments);
    }

    /**
     * Unproject world point [x,y] on map onto {lat, lon} on sphere
     * @param {object|Vector} xy - object with {x,y} members
     *  representing point on projected map plane
     * @return {GeoCoordinates} - object with {lat,lon} of point on sphere.
     *   Has toArray method if you need a GeoJSON Array.
     *   Per cartographic tradition, lat and lon are specified as degrees.
     */

  }, {
    key: 'unprojectFlat',
    value: function unprojectFlat(xyz) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return this._unprojectFlat.apply(this, arguments);
    }
  }, {
    key: '_projectFlat',
    value: function _projectFlat(xyz) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return xyz;
    }
  }, {
    key: '_unprojectFlat',
    value: function _unprojectFlat(xyz) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return xyz;
    }
  }, {
    key: 'getMatrices',
    value: function getMatrices() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref6$modelMatrix = _ref6.modelMatrix,
          modelMatrix = _ref6$modelMatrix === undefined ? null : _ref6$modelMatrix;

      var modelViewProjectionMatrix = this.viewProjectionMatrix;
      var pixelProjectionMatrix = this.pixelProjectionMatrix;
      var pixelUnprojectionMatrix = this.pixelUnprojectionMatrix;

      if (modelMatrix) {
        modelViewProjectionMatrix = _glMatrix.mat4.multiply([], this.viewProjectionMatrix, modelMatrix);
        pixelProjectionMatrix = _glMatrix.mat4.multiply([], this.pixelProjectionMatrix, modelMatrix);
        pixelUnprojectionMatrix = _glMatrix.mat4.invert([], pixelProjectionMatrix);
      }

      var matrices = Object.assign({
        modelViewProjectionMatrix: modelViewProjectionMatrix,
        viewProjectionMatrix: this.viewProjectionMatrix,
        viewMatrix: this.viewMatrix,
        projectionMatrix: this.projectionMatrix,

        // project/unproject between pixels and world
        pixelProjectionMatrix: pixelProjectionMatrix,
        pixelUnprojectionMatrix: pixelUnprojectionMatrix,

        width: this.width,
        height: this.height,
        scale: this.scale
      },

      // Subclass can add additional params
      // TODO - Fragile: better to make base Viewport class aware of all params
      this._getParams());

      return matrices;
    }
  }, {
    key: 'getDistanceScales',
    value: function getDistanceScales() {
      return {
        pixelsPerMeter: [1, 1, 1],
        metersPerPixel: [1, 1, 1],
        pixelsPerDegree: [1, 1, 1],
        degreesPerPixel: [1, 1, 1]
      };
    }

    // INTERNAL METHODS

    // Can be subclassed to add additional fields to `getMatrices`

  }, {
    key: '_getParams',
    value: function _getParams() {
      return {};
    }
  }]);

  return Viewport;
}();

// Helper, avoids low-precision 32 bit matrices from gl-matrix mat4.create()


exports.default = Viewport;
function createMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdmlld3BvcnRzL3ZpZXdwb3J0LmpzIl0sIm5hbWVzIjpbImNyZWF0ZU1hdDQiLCJJREVOVElUWSIsIlZpZXdwb3J0Iiwid2lkdGgiLCJoZWlnaHQiLCJ2aWV3TWF0cml4IiwicHJvamVjdGlvbk1hdHJpeCIsInNjYWxlIiwidnBtIiwibXVsdGlwbHkiLCJ2aWV3UHJvamVjdGlvbk1hdHJpeCIsIm0iLCJ0cmFuc2xhdGUiLCJtSW52ZXJzZSIsImludmVydCIsIkVycm9yIiwicGl4ZWxQcm9qZWN0aW9uTWF0cml4IiwicGl4ZWxVbnByb2plY3Rpb25NYXRyaXgiLCJwcm9qZWN0IiwiYmluZCIsInVucHJvamVjdCIsInByb2plY3RGbGF0IiwidW5wcm9qZWN0RmxhdCIsImdldE1hdHJpY2VzIiwiZ2V0RGlzdGFuY2VTY2FsZXMiLCJ2aWV3cG9ydCIsImVxdWFscyIsInh5eiIsInRvcExlZnQiLCJaIiwiWCIsIlkiLCJ2IiwidHJhbnNmb3JtTWF0NCIsIngiLCJ6IiwieSIsImxlbmd0aCIsInkyIiwieDAiLCJ5MCIsInowIiwiX3Byb2plY3RGbGF0IiwiYXJndW1lbnRzIiwiX3VucHJvamVjdEZsYXQiLCJtb2RlbE1hdHJpeCIsIm1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgiLCJtYXRyaWNlcyIsIk9iamVjdCIsImFzc2lnbiIsIl9nZXRQYXJhbXMiLCJwaXhlbHNQZXJNZXRlciIsIm1ldGVyc1BlclBpeGVsIiwicGl4ZWxzUGVyRGVncmVlIiwiZGVncmVlc1BlclBpeGVsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztxakJBQUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztRQXNQZ0JBLFUsR0FBQUEsVTs7QUFyUGhCOzs7O0FBRUEsSUFBTUMsV0FBV0QsWUFBakI7O0lBRXFCRSxRO0FBQ25COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBO0FBQ0Esc0JBT1E7QUFBQSxtRkFBSixFQUFJO0FBQUEsMEJBTE5DLEtBS007QUFBQSxR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QUNMSSx3QkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FEWDtBQUVMQyx3QkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FGWDtBQUdMQyx5QkFBaUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FIWjtBQUlMQyx5QkFBaUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVA7QUFKWixPQUFQO0FBTUQ7O0FBRUQ7O0FBRUE7Ozs7aUNBQ2E7QUFDWCxhQUFPLEVBQVA7QUFDRDs7Ozs7O0FBR0g7OztrQkFoUHFCcEQsUTtBQWlQZCxTQUFTRixVQUFULEdBQXNCO0FBQzNCLFNBQU8sQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixFQUErQixDQUEvQixFQUFrQyxDQUFsQyxFQUFxQyxDQUFyQyxFQUF3QyxDQUF4QyxFQUEyQyxDQUEzQyxFQUE4QyxDQUE5QyxDQUFQO0FBQ0QiLCJmaWxlIjoidmlld3BvcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBlc2xpbnQtZGlzYWJsZVxuLy8gVmlldyBhbmQgUHJvamVjdGlvbiBNYXRyaXggbWFuYWdlbWVudFxuXG4vLyBnbC1tYXRyaXggaXMgYSBsYXJnZSBkZXBlbmRlbmN5IGZvciBhIHNtYWxsIG1vZHVsZS5cbi8vIEhvd2V2ZXIgc2luY2UgaXQgaXMgdXNlZCBieSBtYXBib3ggZXRjLCBpdCBzaG91bGQgYWxyZWFkeSBiZSBwcmVzZW50XG4vLyBpbiBtb3N0IHRhcmdldCBhcHBsaWNhdGlvbiBidW5kbGVzLlxuaW1wb3J0IHttYXQ0LCB2ZWM0fSBmcm9tICdnbC1tYXRyaXgnO1xuXG5jb25zdCBJREVOVElUWSA9IGNyZWF0ZU1hdDQoKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmlld3BvcnQge1xuICAvKipcbiAgICogQGNsYXNzZGVzY1xuICAgKiBNYW5hZ2VzIGNvb3JkaW5hdGUgc3lzdGVtIHRyYW5zZm9ybWF0aW9ucyBmb3IgZGVjay5nbC5cbiAgICpcbiAgICogTm90ZTogVGhlIFZpZXdwb3J0IGlzIGltbXV0YWJsZSBpbiB0aGUgc2Vuc2UgdGhhdCBpdCBvbmx5IGhhcyBhY2Nlc3NvcnMuXG4gICAqIEEgbmV3IHZpZXdwb3J0IGluc3RhbmNlIHNob3VsZCBiZSBjcmVhdGVkIGlmIGFueSBwYXJhbWV0ZXJzIGhhdmUgY2hhbmdlZC5cbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHQgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gbWVyY2F0b3I9dHJ1ZSAtIFdoZXRoZXIgdG8gdXNlIG1lcmNhdG9yIHByb2plY3Rpb25cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdC53aWR0aD0xIC0gV2lkdGggb2YgXCJ2aWV3cG9ydFwiIG9yIHdpbmRvd1xuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0LmhlaWdodD0xIC0gSGVpZ2h0IG9mIFwidmlld3BvcnRcIiBvciB3aW5kb3dcbiAgICogQHBhcmFtIHtBcnJheX0gb3B0LmNlbnRlcj1bMCwgMF0gLSBDZW50ZXIgb2Ygdmlld3BvcnRcbiAgICogICBbbG9uZ2l0dWRlLCBsYXRpdHVkZV0gb3IgW3gsIHldXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQuc2NhbGU9MSAtIEVpdGhlciB1c2Ugc2NhbGUgb3Igem9vbVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0LnBpdGNoPTAgLSBDYW1lcmEgYW5nbGUgaW4gZGVncmVlcyAoMCBpcyBzdHJhaWdodCBkb3duKVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0LmJlYXJpbmc9MCAtIE1hcCByb3RhdGlvbiBpbiBkZWdyZWVzICgwIG1lYW5zIG5vcnRoIGlzIHVwKVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0LmFsdGl0dWRlPSAtIEFsdGl0dWRlIG9mIGNhbWVyYSBpbiBzY3JlZW4gdW5pdHNcbiAgICpcbiAgICogV2ViIG1lcmNhdG9yIHByb2plY3Rpb24gc2hvcnQtaGFuZCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQubGF0aXR1ZGUgLSBDZW50ZXIgb2Ygdmlld3BvcnQgb24gbWFwIChhbHRlcm5hdGl2ZSB0byBvcHQuY2VudGVyKVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0LmxvbmdpdHVkZSAtIENlbnRlciBvZiB2aWV3cG9ydCBvbiBtYXAgKGFsdGVybmF0aXZlIHRvIG9wdC5jZW50ZXIpXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQuem9vbSAtIFNjYWxlID0gTWF0aC5wb3coMix6b29tKSBvbiBtYXAgKGFsdGVybmF0aXZlIHRvIG9wdC5zY2FsZSlcbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIC8vIFdpbmRvdyB3aWR0aC9oZWlnaHQgaW4gcGl4ZWxzIChmb3IgcGl4ZWwgcHJvamVjdGlvbilcbiAgICB3aWR0aCA9IDEsXG4gICAgaGVpZ2h0ID0gMSxcbiAgICAvLyBEZXNjXG4gICAgdmlld01hdHJpeCA9IElERU5USVRZLFxuICAgIHByb2plY3Rpb25NYXRyaXggPSBJREVOVElUWVxuICB9ID0ge30pIHtcbiAgICAvLyBTaWxlbnRseSBhbGxvdyBhcHBzIHRvIHNlbmQgaW4gMCwwXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoIHx8IDE7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgfHwgMTtcbiAgICB0aGlzLnNjYWxlID0gMTtcblxuICAgIHRoaXMudmlld01hdHJpeCA9IHZpZXdNYXRyaXg7XG4gICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4ID0gcHJvamVjdGlvbk1hdHJpeDtcblxuICAgIC8vIE5vdGU6IEFzIHVzdWFsLCBtYXRyaXggb3BlcmF0aW9ucyBzaG91bGQgYmUgYXBwbGllZCBpbiBcInJldmVyc2VcIiBvcmRlclxuICAgIC8vIHNpbmNlIHZlY3RvcnMgd2lsbCBiZSBtdWx0aXBsaWVkIGluIGZyb20gdGhlIHJpZ2h0IGR1cmluZyB0cmFuc2Zvcm1hdGlvblxuICAgIGNvbnN0IHZwbSA9IGNyZWF0ZU1hdDQoKTtcbiAgICBtYXQ0Lm11bHRpcGx5KHZwbSwgdnBtLCB0aGlzLnByb2plY3Rpb25NYXRyaXgpO1xuICAgIG1hdDQubXVsdGlwbHkodnBtLCB2cG0sIHRoaXMudmlld01hdHJpeCk7XG4gICAgdGhpcy52aWV3UHJvamVjdGlvbk1hdHJpeCA9IHZwbTtcblxuICAgIC8vIENhbGN1bGF0ZSBtYXRyaWNlcyBhbmQgc2NhbGVzIG5lZWRlZCBmb3IgcHJvamVjdGlvblxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBtYXRyaWNlcyB0aGF0IGNvbnZlcnRzIHByZXByb2plY3RlZCBsbmdMYXRzIHRvIHNjcmVlbiBwaXhlbHNcbiAgICAgKiBhbmQgdmljZSB2ZXJzYS5cbiAgICAgKiBOb3RlOiBDdXJyZW50bHkgcmV0dXJucyBib3R0b20tbGVmdCBjb29yZGluYXRlcyFcbiAgICAgKiBOb3RlOiBTdGFydHMgd2l0aCB0aGUgR0wgcHJvamVjdGlvbiBtYXRyaXggYW5kIGFkZHMgc3RlcHMgdG8gdGhlXG4gICAgICogICAgICAgc2NhbGUgYW5kIHRyYW5zbGF0ZSB0aGF0IG1hdHJpeCBvbnRvIHRoZSB3aW5kb3cuXG4gICAgICogTm90ZTogV2ViR0wgY29udHJvbHMgY2xpcCBzcGFjZSB0byBzY3JlZW4gcHJvamVjdGlvbiB3aXRoIGdsLnZpZXdwb3J0XG4gICAgICogICAgICAgYW5kIGRvZXMgbm90IG5lZWQgdGhpcyBzdGVwLlxuICAgICAqL1xuICAgIGNvbnN0IG0gPSBjcmVhdGVNYXQ0KCk7XG5cbiAgICAvLyBTY2FsZSB3aXRoIHZpZXdwb3J0IHdpbmRvdydzIHdpZHRoIGFuZCBoZWlnaHQgaW4gcGl4ZWxzXG4gICAgbWF0NC5zY2FsZShtLCBtLCBbdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIDFdKTtcbiAgICAvLyBDb252ZXJ0IHRvICgwLCAxKVxuICAgIG1hdDQudHJhbnNsYXRlKG0sIG0sIFswLjUsIDAuNSwgMF0pO1xuICAgIG1hdDQuc2NhbGUobSwgbSwgWzAuNSwgMC41LCAxXSk7XG4gICAgLy8gUHJvamVjdCB0byBjbGlwIHNwYWNlICgtMSwgMSlcbiAgICBtYXQ0Lm11bHRpcGx5KG0sIG0sIHRoaXMudmlld1Byb2plY3Rpb25NYXRyaXgpO1xuXG4gICAgY29uc3QgbUludmVyc2UgPSBtYXQ0LmludmVydChjcmVhdGVNYXQ0KCksIG0pO1xuICAgIGlmICghbUludmVyc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGl4ZWwgcHJvamVjdCBtYXRyaXggbm90IGludmVydGlibGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnBpeGVsUHJvamVjdGlvbk1hdHJpeCA9IG07XG4gICAgdGhpcy5waXhlbFVucHJvamVjdGlvbk1hdHJpeCA9IG1JbnZlcnNlO1xuXG4gICAgdGhpcy5wcm9qZWN0ID0gdGhpcy5wcm9qZWN0LmJpbmQodGhpcyk7XG4gICAgdGhpcy51bnByb2plY3QgPSB0aGlzLnVucHJvamVjdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMucHJvamVjdEZsYXQgPSB0aGlzLnByb2plY3RGbGF0LmJpbmQodGhpcyk7XG4gICAgdGhpcy51bnByb2plY3RGbGF0ID0gdGhpcy51bnByb2plY3RGbGF0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5nZXRNYXRyaWNlcyA9IHRoaXMuZ2V0TWF0cmljZXMuYmluZCh0aGlzKTtcbiAgICB0aGlzLmdldERpc3RhbmNlU2NhbGVzID0gdGhpcy5nZXREaXN0YW5jZVNjYWxlcy5iaW5kKHRoaXMpO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSAqL1xuXG4gIC8vIFR3byB2aWV3cG9ydHMgYXJlIGVxdWFsIGlmIHdpZHRoIGFuZCBoZWlnaHQgYXJlIGlkZW50aWNhbCwgYW5kIGlmXG4gIC8vIHRoZWlyIHZpZXcgYW5kIHByb2plY3Rpb24gbWF0cmljZXMgYXJlIChhcHByb3hpbWF0ZWx5KSBlcXVhbC5cbiAgZXF1YWxzKHZpZXdwb3J0KSB7XG4gICAgaWYgKCEodmlld3BvcnQgaW5zdGFuY2VvZiBWaWV3cG9ydCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmlld3BvcnQud2lkdGggPT09IHRoaXMud2lkdGggJiZcbiAgICAgIHZpZXdwb3J0LmhlaWdodCA9PT0gdGhpcy5oZWlnaHQgJiZcbiAgICAgIG1hdDQuZXF1YWxzKHZpZXdwb3J0LnByb2plY3Rpb25NYXRyaXgsIHRoaXMucHJvamVjdGlvbk1hdHJpeCkgJiZcbiAgICAgIG1hdDQuZXF1YWxzKHZpZXdwb3J0LnZpZXdNYXRyaXgsIHRoaXMudmlld01hdHJpeCk7XG4gIH1cblxuICAvKipcbiAgICogUHJvamVjdHMgeHl6IChwb3NzaWJseSBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlKSB0byBwaXhlbCBjb29yZGluYXRlcyBpbiB3aW5kb3dcbiAgICogdXNpbmcgdmlld3BvcnQgcHJvamVjdGlvbiBwYXJhbWV0ZXJzXG4gICAqIC0gW2xvbmdpdHVkZSwgbGF0aXR1ZGVdIHRvIFt4LCB5XVxuICAgKiAtIFtsb25naXR1ZGUsIGxhdGl0dWRlLCBaXSA9PiBbeCwgeSwgel1cbiAgICogTm90ZTogQnkgZGVmYXVsdCwgcmV0dXJucyB0b3AtbGVmdCBjb29yZGluYXRlcyBmb3IgY2FudmFzL1NWRyB0eXBlIHJlbmRlclxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBsbmdMYXRaIC0gW2xuZywgbGF0XSBvciBbbG5nLCBsYXQsIFpdXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cy50b3BMZWZ0PXRydWUgLSBXaGV0aGVyIHByb2plY3RlZCBjb29yZHMgYXJlIHRvcCBsZWZ0XG4gICAqIEByZXR1cm4ge0FycmF5fSAtIFt4LCB5XSBvciBbeCwgeSwgel0gaW4gdG9wIGxlZnQgY29vcmRzXG4gICAqL1xuICBwcm9qZWN0KHh5eiwge3RvcExlZnQgPSB0cnVlfSA9IHt9KSB7XG4gICAgY29uc3QgWiA9IHh5elsyXSB8fCAwO1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Byb2plY3Rpbmcgbm9uLWxpbmVhcicsIHh5eik7XG4gICAgY29uc3QgW1gsIFldID0gdGhpcy5wcm9qZWN0RmxhdCh4eXopO1xuICAgIGNvbnN0IHYgPSBbWCwgWSwgWiwgMV07XG4gICAgLy8gY29uc29sZS5lcnJvcigncHJvamVjdGluZyBsaW5lYXInLCB2KTtcbiAgICAvLyB2ZWM0LnN1Yih2LCB2LCBbdGhpcy5jZW50ZXJYLCB0aGlzLmNlbnRlclksIDAsIDBdKTtcbiAgICB2ZWM0LnRyYW5zZm9ybU1hdDQodiwgdiwgdGhpcy5waXhlbFByb2plY3Rpb25NYXRyaXgpO1xuICAgIC8vIERpdmlkZSBieSB3XG4gICAgY29uc3Qgc2NhbGUgPSAxIC8gdlszXTtcbiAgICB2ZWM0Lm11bHRpcGx5KHYsIHYsIFtzY2FsZSwgc2NhbGUsIHNjYWxlLCBzY2FsZV0pO1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Byb2plY3RlZCcsIHYpO1xuICAgIGNvbnN0IFt4LCAsIHpdID0gdjtcbiAgICBjb25zdCB5ID0gdG9wTGVmdCA/IHRoaXMuaGVpZ2h0IC0gdlsxXSA6IHZbMV07XG4gICAgcmV0dXJuIHh5ei5sZW5ndGggPT09IDIgPyBbeCwgeV0gOiBbeCwgeSwgel07XG4gIH1cblxuICAvKipcbiAgICogVW5wcm9qZWN0IHBpeGVsIGNvb3JkaW5hdGVzIG9uIHNjcmVlbiBvbnRvIHdvcmxkIGNvb3JkaW5hdGVzLFxuICAgKiAocG9zc2libHkgW2xvbiwgbGF0XSkgb24gbWFwLlxuICAgKiAtIFt4LCB5XSA9PiBbbG5nLCBsYXRdXG4gICAqIC0gW3gsIHksIHpdID0+IFtsbmcsIGxhdCwgWl1cbiAgICogQHBhcmFtIHtBcnJheX0geHl6IC1cbiAgICogQHJldHVybiB7QXJyYXl9IC0gW2xuZywgbGF0LCBaXSBvciBbWCwgWSwgWl1cbiAgICovXG4gIHVucHJvamVjdCh4eXosIHt0b3BMZWZ0ID0gdHJ1ZX0gPSB7fSkge1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3VucHJvamVjdGluZyBsaW5lYXInLCB4eXopO1xuICAgIGNvbnN0IFt4ID0gMCwgeSA9IDAsIHogPSAwXSA9IHh5ejtcbiAgICAvLyBjb25zdCB5MiA9IHRvcExlZnQgPyB0aGlzLmhlaWdodCAtIDEgLSB5IDogeTtcbiAgICBjb25zdCB5MiA9IHRvcExlZnQgPyB0aGlzLmhlaWdodCAtIHkgOiB5O1xuICAgIGNvbnN0IHYgPSBbeCwgeTIsIHosIDFdO1xuICAgIHZlYzQudHJhbnNmb3JtTWF0NCh2LCB2LCB0aGlzLnBpeGVsVW5wcm9qZWN0aW9uTWF0cml4KTtcbiAgICBjb25zdCBzY2FsZSA9IDEgLyB2WzNdO1xuICAgIHZlYzQubXVsdGlwbHkodiwgdiwgW3NjYWxlLCBzY2FsZSwgc2NhbGUsIHNjYWxlXSk7XG4gICAgLy8gY29uc29sZS5lcnJvcigndW5wcm9qZWN0aW5nIG5vbi1saW5lYXInLCB2KTtcbiAgICBjb25zdCBbeDAsIHkwXSA9IHRoaXMudW5wcm9qZWN0RmxhdCh2KTtcbiAgICAvLyBjb25zb2xlLmVycm9yKCd1bnByb2plY3RlZCcsIFt4MCwgeTBdKTtcbiAgICBjb25zdCBbLCAsIHowXSA9IHY7XG4gICAgcmV0dXJuIHh5ei5sZW5ndGggPT09IDIgPyBbeDAsIHkwXSA6IFt4MCwgeTAsIHowXTtcbiAgfVxuXG4gIC8vIE5PTl9MSU5FQVIgUFJPSkVDVElPTiBIT09LU1xuICAvLyBVc2VkIGZvciB3ZWIgbWVyYWN0b3IgcHJvamVjdGlvblxuXG4gIC8qKlxuICAgKiBQcm9qZWN0IFtsbmcsbGF0XSBvbiBzcGhlcmUgb250byBbeCx5XSBvbiA1MTIqNTEyIE1lcmNhdG9yIFpvb20gMCB0aWxlLlxuICAgKiBQZXJmb3JtcyB0aGUgbm9ubGluZWFyIHBhcnQgb2YgdGhlIHdlYiBtZXJjYXRvciBwcm9qZWN0aW9uLlxuICAgKiBSZW1haW5pbmcgcHJvamVjdGlvbiBpcyBkb25lIHdpdGggNHg0IG1hdHJpY2VzIHdoaWNoIGFsc28gaGFuZGxlc1xuICAgKiBwZXJzcGVjdGl2ZS5cbiAgICogQHBhcmFtIHtBcnJheX0gbG5nTGF0IC0gW2xuZywgbGF0XSBjb29yZGluYXRlc1xuICAgKiAgIFNwZWNpZmllcyBhIHBvaW50IG9uIHRoZSBzcGhlcmUgdG8gcHJvamVjdCBvbnRvIHRoZSBtYXAuXG4gICAqIEByZXR1cm4ge0FycmF5fSBbeCx5XSBjb29yZGluYXRlcy5cbiAgICovXG4gIHByb2plY3RGbGF0KFt4LCB5XSwgc2NhbGUgPSB0aGlzLnNjYWxlKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb2plY3RGbGF0KC4uLmFyZ3VtZW50cyk7XG4gIH1cblxuICAvKipcbiAgICogVW5wcm9qZWN0IHdvcmxkIHBvaW50IFt4LHldIG9uIG1hcCBvbnRvIHtsYXQsIGxvbn0gb24gc3BoZXJlXG4gICAqIEBwYXJhbSB7b2JqZWN0fFZlY3Rvcn0geHkgLSBvYmplY3Qgd2l0aCB7eCx5fSBtZW1iZXJzXG4gICAqICByZXByZXNlbnRpbmcgcG9pbnQgb24gcHJvamVjdGVkIG1hcCBwbGFuZVxuICAgKiBAcmV0dXJuIHtHZW9Db29yZGluYXRlc30gLSBvYmplY3Qgd2l0aCB7bGF0LGxvbn0gb2YgcG9pbnQgb24gc3BoZXJlLlxuICAgKiAgIEhhcyB0b0FycmF5IG1ldGhvZCBpZiB5b3UgbmVlZCBhIEdlb0pTT04gQXJyYXkuXG4gICAqICAgUGVyIGNhcnRvZ3JhcGhpYyB0cmFkaXRpb24sIGxhdCBhbmQgbG9uIGFyZSBzcGVjaWZpZWQgYXMgZGVncmVlcy5cbiAgICovXG4gIHVucHJvamVjdEZsYXQoeHl6LCBzY2FsZSA9IHRoaXMuc2NhbGUpIHtcbiAgICByZXR1cm4gdGhpcy5fdW5wcm9qZWN0RmxhdCguLi5hcmd1bWVudHMpO1xuICB9XG5cbiAgX3Byb2plY3RGbGF0KHh5eiwgc2NhbGUgPSB0aGlzLnNjYWxlKSB7XG4gICAgcmV0dXJuIHh5ejtcbiAgfVxuXG4gIF91bnByb2plY3RGbGF0KHh5eiwgc2NhbGUgPSB0aGlzLnNjYWxlKSB7XG4gICAgcmV0dXJuIHh5ejtcbiAgfVxuXG4gIGdldE1hdHJpY2VzKHttb2RlbE1hdHJpeCA9IG51bGx9ID0ge30pIHtcbiAgICBsZXQgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCA9IHRoaXMudmlld1Byb2plY3Rpb25NYXRyaXg7XG4gICAgbGV0IHBpeGVsUHJvamVjdGlvbk1hdHJpeCA9IHRoaXMucGl4ZWxQcm9qZWN0aW9uTWF0cml4O1xuICAgIGxldCBwaXhlbFVucHJvamVjdGlvbk1hdHJpeCA9IHRoaXMucGl4ZWxVbnByb2plY3Rpb25NYXRyaXg7XG5cbiAgICBpZiAobW9kZWxNYXRyaXgpIHtcbiAgICAgIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXggPSBtYXQ0Lm11bHRpcGx5KFtdLCB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4LCBtb2RlbE1hdHJpeCk7XG4gICAgICBwaXhlbFByb2plY3Rpb25NYXRyaXggPSBtYXQ0Lm11bHRpcGx5KFtdLCB0aGlzLnBpeGVsUHJvamVjdGlvbk1hdHJpeCwgbW9kZWxNYXRyaXgpO1xuICAgICAgcGl4ZWxVbnByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmludmVydChbXSwgcGl4ZWxQcm9qZWN0aW9uTWF0cml4KTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRyaWNlcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCxcbiAgICAgIHZpZXdQcm9qZWN0aW9uTWF0cml4OiB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4LFxuICAgICAgdmlld01hdHJpeDogdGhpcy52aWV3TWF0cml4LFxuICAgICAgcHJvamVjdGlvbk1hdHJpeDogdGhpcy5wcm9qZWN0aW9uTWF0cml4LFxuXG4gICAgICAvLyBwcm9qZWN0L3VucHJvamVjdCBiZXR3ZWVuIHBpeGVscyBhbmQgd29ybGRcbiAgICAgIHBpeGVsUHJvamVjdGlvbk1hdHJpeCxcbiAgICAgIHBpeGVsVW5wcm9qZWN0aW9uTWF0cml4LFxuXG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBzY2FsZTogdGhpcy5zY2FsZVxuICAgIH0sXG5cbiAgICAgIC8vIFN1YmNsYXNzIGNhbiBhZGQgYWRkaXRpb25hbCBwYXJhbXNcbiAgICAgIC8vIFRPRE8gLSBGcmFnaWxlOiBiZXR0ZXIgdG8gbWFrZSBiYXNlIFZpZXdwb3J0IGNsYXNzIGF3YXJlIG9mIGFsbCBwYXJhbXNcbiAgICAgIHRoaXMuX2dldFBhcmFtcygpXG4gICAgKTtcblxuICAgIHJldHVybiBtYXRyaWNlcztcbiAgfVxuXG4gIGdldERpc3RhbmNlU2NhbGVzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwaXhlbHNQZXJNZXRlcjogWzEsIDEsIDFdLFxuICAgICAgbWV0ZXJzUGVyUGl4ZWw6IFsxLCAxLCAxXSxcbiAgICAgIHBpeGVsc1BlckRlZ3JlZTogWzEsIDEsIDFdLFxuICAgICAgZGVncmVlc1BlclBpeGVsOiBbMSwgMSwgMV1cbiAgICB9O1xuICB9XG5cbiAgLy8gSU5URVJOQUwgTUVUSE9EU1xuXG4gIC8vIENhbiBiZSBzdWJjbGFzc2VkIHRvIGFkZCBhZGRpdGlvbmFsIGZpZWxkcyB0byBgZ2V0TWF0cmljZXNgXG4gIF9nZXRQYXJhbXMoKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59XG5cbi8vIEhlbHBlciwgYXZvaWRzIGxvdy1wcmVjaXNpb24gMzIgYml0IG1hdHJpY2VzIGZyb20gZ2wtbWF0cml4IG1hdDQuY3JlYXRlKClcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNYXQ0KCkge1xuICByZXR1cm4gWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdO1xufVxuIl19
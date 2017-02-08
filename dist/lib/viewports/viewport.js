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

      var _projectFlat = this.projectFlat(xyz),
          _projectFlat2 = _slicedToArray(_projectFlat, 2),
          X = _projectFlat2[0],
          Y = _projectFlat2[1];

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

      var _unprojectFlat = this.unprojectFlat(v),
          _unprojectFlat2 = _slicedToArray(_unprojectFlat, 2),
          x0 = _unprojectFlat2[0],
          y0 = _unprojectFlat2[1];
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

    // _projectFlat(xyz, scale = this.scale) {
    //   return xyz;
    // }

    // _unprojectFlat(xyz, scale = this.scale) {
    //   return xyz;
    // }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdmlld3BvcnRzL3ZpZXdwb3J0LmpzIl0sIm5hbWVzIjpbImNyZWF0ZU1hdDQiLCJJREVOVElUWSIsIlZpZXdwb3J0Iiwid2lkdGgiLCJoZWlnaHQiLCJ2aWV3TWF0cml4IiwicHJvamVjdGlvbk1hdHJpeCIsInNjYWxlIiwidnBtIiwibXVsdGlwbHkiLCJ2aWV3UHJvamVjdGlvbk1hdHJpeCIsIm0iLCJ0cmFuc2xhdGUiLCJtSW52ZXJzZSIsImludmVydCIsIkVycm9yIiwicGl4ZWxQcm9qZWN0aW9uTWF0cml4IiwicGl4ZWxVbnByb2plY3Rpb25NYXRyaXgiLCJwcm9qZWN0IiwiYmluZCIsInVucHJvamVjdCIsInByb2plY3RGbGF0IiwidW5wcm9qZWN0RmxhdCIsImdldE1hdHJpY2VzIiwidmlld3BvcnQiLCJlcXVhbHMiLCJ4eXoiLCJ0b3BMZWZ0IiwiWiIsIlgiLCJZIiwidiIsInRyYW5zZm9ybU1hdDQiLCJ4IiwieiIsInkiLCJsZW5ndGgiLCJ5MiIsIngwIiwieTAiLCJ6MCIsIl9wcm9qZWN0RmxhdCIsImFyZ3VtZW50cyIsIl91bnByb2plY3RGbGF0IiwibW9kZWxNYXRyaXgiLCJtb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4IiwibWF0cmljZXMiLCJPYmplY3QiLCJhc3NpZ24iLCJfZ2V0UGFyYW1zIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztxakJBQUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztRQTRPZ0JBLFUsR0FBQUEsVTs7QUEzT2hCOzs7O0FBRUEsSUFBTUMsV0FBV0QsWUFBakI7O0lBRXFCRSxRO0FBQ25COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBO0FBQ0Esc0JBT1E7QUFBQSxtRkFBSixFQUFJO0FBQUEsMEJBTE5DLEtBS007QUFBQSxRQUxOQSxLQUtNLDhCQUxFLENBS0Y7QUFBQSwyQkFKTkMsTUFJTTtBQUFBLFFBSk5BLE1BSU0sK0JBSkcsQ0FJSDtBQUFBLCtCQUZOQyxVQUVNO0FBQUEsUUFG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aWV3cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGVzbGludC1kaXNhYmxlXG4vLyBWaWV3IGFuZCBQcm9qZWN0aW9uIE1hdHJpeCBtYW5hZ2VtZW50XG5cbi8vIGdsLW1hdHJpeCBpcyBhIGxhcmdlIGRlcGVuZGVuY3kgZm9yIGEgc21hbGwgbW9kdWxlLlxuLy8gSG93ZXZlciBzaW5jZSBpdCBpcyB1c2VkIGJ5IG1hcGJveCBldGMsIGl0IHNob3VsZCBhbHJlYWR5IGJlIHByZXNlbnRcbi8vIGluIG1vc3QgdGFyZ2V0IGFwcGxpY2F0aW9uIGJ1bmRsZXMuXG5pbXBvcnQge21hdDQsIHZlYzR9IGZyb20gJ2dsLW1hdHJpeCc7XG5cbmNvbnN0IElERU5USVRZID0gY3JlYXRlTWF0NCgpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWaWV3cG9ydCB7XG4gIC8qKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIE1hbmFnZXMgY29vcmRpbmF0ZSBzeXN0ZW0gdHJhbnNmb3JtYXRpb25zIGZvciBkZWNrLmdsLlxuICAgKlxuICAgKiBOb3RlOiBUaGUgVmlld3BvcnQgaXMgaW1tdXRhYmxlIGluIHRoZSBzZW5zZSB0aGF0IGl0IG9ubHkgaGFzIGFjY2Vzc29ycy5cbiAgICogQSBuZXcgdmlld3BvcnQgaW5zdGFuY2Ugc2hvdWxkIGJlIGNyZWF0ZWQgaWYgYW55IHBhcmFtZXRlcnMgaGF2ZSBjaGFuZ2VkLlxuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdCAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtCb29sZWFufSBtZXJjYXRvcj10cnVlIC0gV2hldGhlciB0byB1c2UgbWVyY2F0b3IgcHJvamVjdGlvblxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0LndpZHRoPTEgLSBXaWR0aCBvZiBcInZpZXdwb3J0XCIgb3Igd2luZG93XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQuaGVpZ2h0PTEgLSBIZWlnaHQgb2YgXCJ2aWV3cG9ydFwiIG9yIHdpbmRvd1xuICAgKiBAcGFyYW0ge0FycmF5fSBvcHQuY2VudGVyPVswLCAwXSAtIENlbnRlciBvZiB2aWV3cG9ydFxuICAgKiAgIFtsb25naXR1ZGUsIGxhdGl0dWRlXSBvciBbeCwgeV1cbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdC5zY2FsZT0xIC0gRWl0aGVyIHVzZSBzY2FsZSBvciB6b29tXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQucGl0Y2g9MCAtIENhbWVyYSBhbmdsZSBpbiBkZWdyZWVzICgwIGlzIHN0cmFpZ2h0IGRvd24pXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQuYmVhcmluZz0wIC0gTWFwIHJvdGF0aW9uIGluIGRlZ3JlZXMgKDAgbWVhbnMgbm9ydGggaXMgdXApXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQuYWx0aXR1ZGU9IC0gQWx0aXR1ZGUgb2YgY2FtZXJhIGluIHNjcmVlbiB1bml0c1xuICAgKlxuICAgKiBXZWIgbWVyY2F0b3IgcHJvamVjdGlvbiBzaG9ydC1oYW5kIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdC5sYXRpdHVkZSAtIENlbnRlciBvZiB2aWV3cG9ydCBvbiBtYXAgKGFsdGVybmF0aXZlIHRvIG9wdC5jZW50ZXIpXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHQubG9uZ2l0dWRlIC0gQ2VudGVyIG9mIHZpZXdwb3J0IG9uIG1hcCAoYWx0ZXJuYXRpdmUgdG8gb3B0LmNlbnRlcilcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdC56b29tIC0gU2NhbGUgPSBNYXRoLnBvdygyLHpvb20pIG9uIG1hcCAoYWx0ZXJuYXRpdmUgdG8gb3B0LnNjYWxlKVxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgLy8gV2luZG93IHdpZHRoL2hlaWdodCBpbiBwaXhlbHMgKGZvciBwaXhlbCBwcm9qZWN0aW9uKVxuICAgIHdpZHRoID0gMSxcbiAgICBoZWlnaHQgPSAxLFxuICAgIC8vIERlc2NcbiAgICB2aWV3TWF0cml4ID0gSURFTlRJVFksXG4gICAgcHJvamVjdGlvbk1hdHJpeCA9IElERU5USVRZXG4gIH0gPSB7fSkge1xuICAgIC8vIFNpbGVudGx5IGFsbG93IGFwcHMgdG8gc2VuZCBpbiAwLDBcbiAgICB0aGlzLndpZHRoID0gd2lkdGggfHwgMTtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodCB8fCAxO1xuICAgIHRoaXMuc2NhbGUgPSAxO1xuXG4gICAgdGhpcy52aWV3TWF0cml4ID0gdmlld01hdHJpeDtcbiAgICB0aGlzLnByb2plY3Rpb25NYXRyaXggPSBwcm9qZWN0aW9uTWF0cml4O1xuXG4gICAgLy8gTm90ZTogQXMgdXN1YWwsIG1hdHJpeCBvcGVyYXRpb25zIHNob3VsZCBiZSBhcHBsaWVkIGluIFwicmV2ZXJzZVwiIG9yZGVyXG4gICAgLy8gc2luY2UgdmVjdG9ycyB3aWxsIGJlIG11bHRpcGxpZWQgaW4gZnJvbSB0aGUgcmlnaHQgZHVyaW5nIHRyYW5zZm9ybWF0aW9uXG4gICAgY29uc3QgdnBtID0gY3JlYXRlTWF0NCgpO1xuICAgIG1hdDQubXVsdGlwbHkodnBtLCB2cG0sIHRoaXMucHJvamVjdGlvbk1hdHJpeCk7XG4gICAgbWF0NC5tdWx0aXBseSh2cG0sIHZwbSwgdGhpcy52aWV3TWF0cml4KTtcbiAgICB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4ID0gdnBtO1xuXG4gICAgLy8gQ2FsY3VsYXRlIG1hdHJpY2VzIGFuZCBzY2FsZXMgbmVlZGVkIGZvciBwcm9qZWN0aW9uXG4gICAgLyoqXG4gICAgICogQnVpbGRzIG1hdHJpY2VzIHRoYXQgY29udmVydHMgcHJlcHJvamVjdGVkIGxuZ0xhdHMgdG8gc2NyZWVuIHBpeGVsc1xuICAgICAqIGFuZCB2aWNlIHZlcnNhLlxuICAgICAqIE5vdGU6IEN1cnJlbnRseSByZXR1cm5zIGJvdHRvbS1sZWZ0IGNvb3JkaW5hdGVzIVxuICAgICAqIE5vdGU6IFN0YXJ0cyB3aXRoIHRoZSBHTCBwcm9qZWN0aW9uIG1hdHJpeCBhbmQgYWRkcyBzdGVwcyB0byB0aGVcbiAgICAgKiAgICAgICBzY2FsZSBhbmQgdHJhbnNsYXRlIHRoYXQgbWF0cml4IG9udG8gdGhlIHdpbmRvdy5cbiAgICAgKiBOb3RlOiBXZWJHTCBjb250cm9scyBjbGlwIHNwYWNlIHRvIHNjcmVlbiBwcm9qZWN0aW9uIHdpdGggZ2wudmlld3BvcnRcbiAgICAgKiAgICAgICBhbmQgZG9lcyBub3QgbmVlZCB0aGlzIHN0ZXAuXG4gICAgICovXG4gICAgY29uc3QgbSA9IGNyZWF0ZU1hdDQoKTtcblxuICAgIC8vIFNjYWxlIHdpdGggdmlld3BvcnQgd2luZG93J3Mgd2lkdGggYW5kIGhlaWdodCBpbiBwaXhlbHNcbiAgICBtYXQ0LnNjYWxlKG0sIG0sIFt0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgMV0pO1xuICAgIC8vIENvbnZlcnQgdG8gKDAsIDEpXG4gICAgbWF0NC50cmFuc2xhdGUobSwgbSwgWzAuNSwgMC41LCAwXSk7XG4gICAgbWF0NC5zY2FsZShtLCBtLCBbMC41LCAwLjUsIDFdKTtcbiAgICAvLyBQcm9qZWN0IHRvIGNsaXAgc3BhY2UgKC0xLCAxKVxuICAgIG1hdDQubXVsdGlwbHkobSwgbSwgdGhpcy52aWV3UHJvamVjdGlvbk1hdHJpeCk7XG5cbiAgICBjb25zdCBtSW52ZXJzZSA9IG1hdDQuaW52ZXJ0KGNyZWF0ZU1hdDQoKSwgbSk7XG4gICAgaWYgKCFtSW52ZXJzZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQaXhlbCBwcm9qZWN0IG1hdHJpeCBub3QgaW52ZXJ0aWJsZScpO1xuICAgIH1cblxuICAgIHRoaXMucGl4ZWxQcm9qZWN0aW9uTWF0cml4ID0gbTtcbiAgICB0aGlzLnBpeGVsVW5wcm9qZWN0aW9uTWF0cml4ID0gbUludmVyc2U7XG5cbiAgICB0aGlzLnByb2plY3QgPSB0aGlzLnByb2plY3QuYmluZCh0aGlzKTtcbiAgICB0aGlzLnVucHJvamVjdCA9IHRoaXMudW5wcm9qZWN0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5wcm9qZWN0RmxhdCA9IHRoaXMucHJvamVjdEZsYXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnVucHJvamVjdEZsYXQgPSB0aGlzLnVucHJvamVjdEZsYXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmdldE1hdHJpY2VzID0gdGhpcy5nZXRNYXRyaWNlcy5iaW5kKHRoaXMpO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSAqL1xuXG4gIC8vIFR3byB2aWV3cG9ydHMgYXJlIGVxdWFsIGlmIHdpZHRoIGFuZCBoZWlnaHQgYXJlIGlkZW50aWNhbCwgYW5kIGlmXG4gIC8vIHRoZWlyIHZpZXcgYW5kIHByb2plY3Rpb24gbWF0cmljZXMgYXJlIChhcHByb3hpbWF0ZWx5KSBlcXVhbC5cbiAgZXF1YWxzKHZpZXdwb3J0KSB7XG4gICAgaWYgKCEodmlld3BvcnQgaW5zdGFuY2VvZiBWaWV3cG9ydCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmlld3BvcnQud2lkdGggPT09IHRoaXMud2lkdGggJiZcbiAgICAgIHZpZXdwb3J0LmhlaWdodCA9PT0gdGhpcy5oZWlnaHQgJiZcbiAgICAgIG1hdDQuZXF1YWxzKHZpZXdwb3J0LnByb2plY3Rpb25NYXRyaXgsIHRoaXMucHJvamVjdGlvbk1hdHJpeCkgJiZcbiAgICAgIG1hdDQuZXF1YWxzKHZpZXdwb3J0LnZpZXdNYXRyaXgsIHRoaXMudmlld01hdHJpeCk7XG4gIH1cblxuICAvKipcbiAgICogUHJvamVjdHMgeHl6IChwb3NzaWJseSBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlKSB0byBwaXhlbCBjb29yZGluYXRlcyBpbiB3aW5kb3dcbiAgICogdXNpbmcgdmlld3BvcnQgcHJvamVjdGlvbiBwYXJhbWV0ZXJzXG4gICAqIC0gW2xvbmdpdHVkZSwgbGF0aXR1ZGVdIHRvIFt4LCB5XVxuICAgKiAtIFtsb25naXR1ZGUsIGxhdGl0dWRlLCBaXSA9PiBbeCwgeSwgel1cbiAgICogTm90ZTogQnkgZGVmYXVsdCwgcmV0dXJucyB0b3AtbGVmdCBjb29yZGluYXRlcyBmb3IgY2FudmFzL1NWRyB0eXBlIHJlbmRlclxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBsbmdMYXRaIC0gW2xuZywgbGF0XSBvciBbbG5nLCBsYXQsIFpdXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cy50b3BMZWZ0PXRydWUgLSBXaGV0aGVyIHByb2plY3RlZCBjb29yZHMgYXJlIHRvcCBsZWZ0XG4gICAqIEByZXR1cm4ge0FycmF5fSAtIFt4LCB5XSBvciBbeCwgeSwgel0gaW4gdG9wIGxlZnQgY29vcmRzXG4gICAqL1xuICBwcm9qZWN0KHh5eiwge3RvcExlZnQgPSB0cnVlfSA9IHt9KSB7XG4gICAgY29uc3QgWiA9IHh5elsyXSB8fCAwO1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Byb2plY3Rpbmcgbm9uLWxpbmVhcicsIHh5eik7XG4gICAgY29uc3QgW1gsIFldID0gdGhpcy5wcm9qZWN0RmxhdCh4eXopO1xuICAgIGNvbnN0IHYgPSBbWCwgWSwgWiwgMV07XG4gICAgLy8gY29uc29sZS5lcnJvcigncHJvamVjdGluZyBsaW5lYXInLCB2KTtcbiAgICAvLyB2ZWM0LnN1Yih2LCB2LCBbdGhpcy5jZW50ZXJYLCB0aGlzLmNlbnRlclksIDAsIDBdKTtcbiAgICB2ZWM0LnRyYW5zZm9ybU1hdDQodiwgdiwgdGhpcy5waXhlbFByb2plY3Rpb25NYXRyaXgpO1xuICAgIC8vIERpdmlkZSBieSB3XG4gICAgY29uc3Qgc2NhbGUgPSAxIC8gdlszXTtcbiAgICB2ZWM0Lm11bHRpcGx5KHYsIHYsIFtzY2FsZSwgc2NhbGUsIHNjYWxlLCBzY2FsZV0pO1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3Byb2plY3RlZCcsIHYpO1xuICAgIGNvbnN0IFt4LCAsIHpdID0gdjtcbiAgICBjb25zdCB5ID0gdG9wTGVmdCA/IHRoaXMuaGVpZ2h0IC0gdlsxXSA6IHZbMV07XG4gICAgcmV0dXJuIHh5ei5sZW5ndGggPT09IDIgPyBbeCwgeV0gOiBbeCwgeSwgel07XG4gIH1cblxuICAvKipcbiAgICogVW5wcm9qZWN0IHBpeGVsIGNvb3JkaW5hdGVzIG9uIHNjcmVlbiBvbnRvIHdvcmxkIGNvb3JkaW5hdGVzLFxuICAgKiAocG9zc2libHkgW2xvbiwgbGF0XSkgb24gbWFwLlxuICAgKiAtIFt4LCB5XSA9PiBbbG5nLCBsYXRdXG4gICAqIC0gW3gsIHksIHpdID0+IFtsbmcsIGxhdCwgWl1cbiAgICogQHBhcmFtIHtBcnJheX0geHl6IC1cbiAgICogQHJldHVybiB7QXJyYXl9IC0gW2xuZywgbGF0LCBaXSBvciBbWCwgWSwgWl1cbiAgICovXG4gIHVucHJvamVjdCh4eXosIHt0b3BMZWZ0ID0gdHJ1ZX0gPSB7fSkge1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ3VucHJvamVjdGluZyBsaW5lYXInLCB4eXopO1xuICAgIGNvbnN0IFt4ID0gMCwgeSA9IDAsIHogPSAwXSA9IHh5ejtcbiAgICAvLyBjb25zdCB5MiA9IHRvcExlZnQgPyB0aGlzLmhlaWdodCAtIDEgLSB5IDogeTtcbiAgICBjb25zdCB5MiA9IHRvcExlZnQgPyB0aGlzLmhlaWdodCAtIHkgOiB5O1xuICAgIGNvbnN0IHYgPSBbeCwgeTIsIHosIDFdO1xuICAgIHZlYzQudHJhbnNmb3JtTWF0NCh2LCB2LCB0aGlzLnBpeGVsVW5wcm9qZWN0aW9uTWF0cml4KTtcbiAgICBjb25zdCBzY2FsZSA9IDEgLyB2WzNdO1xuICAgIHZlYzQubXVsdGlwbHkodiwgdiwgW3NjYWxlLCBzY2FsZSwgc2NhbGUsIHNjYWxlXSk7XG4gICAgLy8gY29uc29sZS5lcnJvcigndW5wcm9qZWN0aW5nIG5vbi1saW5lYXInLCB2KTtcbiAgICBjb25zdCBbeDAsIHkwXSA9IHRoaXMudW5wcm9qZWN0RmxhdCh2KTtcbiAgICAvLyBjb25zb2xlLmVycm9yKCd1bnByb2plY3RlZCcsIFt4MCwgeTBdKTtcbiAgICBjb25zdCBbLCAsIHowXSA9IHY7XG4gICAgcmV0dXJuIHh5ei5sZW5ndGggPT09IDIgPyBbeDAsIHkwXSA6IFt4MCwgeTAsIHowXTtcbiAgfVxuXG4gIC8vIE5PTl9MSU5FQVIgUFJPSkVDVElPTiBIT09LU1xuICAvLyBVc2VkIGZvciB3ZWIgbWVyYWN0b3IgcHJvamVjdGlvblxuXG4gIC8qKlxuICAgKiBQcm9qZWN0IFtsbmcsbGF0XSBvbiBzcGhlcmUgb250byBbeCx5XSBvbiA1MTIqNTEyIE1lcmNhdG9yIFpvb20gMCB0aWxlLlxuICAgKiBQZXJmb3JtcyB0aGUgbm9ubGluZWFyIHBhcnQgb2YgdGhlIHdlYiBtZXJjYXRvciBwcm9qZWN0aW9uLlxuICAgKiBSZW1haW5pbmcgcHJvamVjdGlvbiBpcyBkb25lIHdpdGggNHg0IG1hdHJpY2VzIHdoaWNoIGFsc28gaGFuZGxlc1xuICAgKiBwZXJzcGVjdGl2ZS5cbiAgICogQHBhcmFtIHtBcnJheX0gbG5nTGF0IC0gW2xuZywgbGF0XSBjb29yZGluYXRlc1xuICAgKiAgIFNwZWNpZmllcyBhIHBvaW50IG9uIHRoZSBzcGhlcmUgdG8gcHJvamVjdCBvbnRvIHRoZSBtYXAuXG4gICAqIEByZXR1cm4ge0FycmF5fSBbeCx5XSBjb29yZGluYXRlcy5cbiAgICovXG4gIHByb2plY3RGbGF0KFt4LCB5XSwgc2NhbGUgPSB0aGlzLnNjYWxlKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb2plY3RGbGF0KC4uLmFyZ3VtZW50cyk7XG4gIH1cblxuICAvKipcbiAgICogVW5wcm9qZWN0IHdvcmxkIHBvaW50IFt4LHldIG9uIG1hcCBvbnRvIHtsYXQsIGxvbn0gb24gc3BoZXJlXG4gICAqIEBwYXJhbSB7b2JqZWN0fFZlY3Rvcn0geHkgLSBvYmplY3Qgd2l0aCB7eCx5fSBtZW1iZXJzXG4gICAqICByZXByZXNlbnRpbmcgcG9pbnQgb24gcHJvamVjdGVkIG1hcCBwbGFuZVxuICAgKiBAcmV0dXJuIHtHZW9Db29yZGluYXRlc30gLSBvYmplY3Qgd2l0aCB7bGF0LGxvbn0gb2YgcG9pbnQgb24gc3BoZXJlLlxuICAgKiAgIEhhcyB0b0FycmF5IG1ldGhvZCBpZiB5b3UgbmVlZCBhIEdlb0pTT04gQXJyYXkuXG4gICAqICAgUGVyIGNhcnRvZ3JhcGhpYyB0cmFkaXRpb24sIGxhdCBhbmQgbG9uIGFyZSBzcGVjaWZpZWQgYXMgZGVncmVlcy5cbiAgICovXG4gIHVucHJvamVjdEZsYXQoeHl6LCBzY2FsZSA9IHRoaXMuc2NhbGUpIHtcbiAgICByZXR1cm4gdGhpcy5fdW5wcm9qZWN0RmxhdCguLi5hcmd1bWVudHMpO1xuICB9XG5cbiAgLy8gX3Byb2plY3RGbGF0KHh5eiwgc2NhbGUgPSB0aGlzLnNjYWxlKSB7XG4gIC8vICAgcmV0dXJuIHh5ejtcbiAgLy8gfVxuXG4gIC8vIF91bnByb2plY3RGbGF0KHh5eiwgc2NhbGUgPSB0aGlzLnNjYWxlKSB7XG4gIC8vICAgcmV0dXJuIHh5ejtcbiAgLy8gfVxuXG4gIGdldE1hdHJpY2VzKHttb2RlbE1hdHJpeCA9IG51bGx9ID0ge30pIHtcbiAgICBsZXQgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCA9IHRoaXMudmlld1Byb2plY3Rpb25NYXRyaXg7XG4gICAgbGV0IHBpeGVsUHJvamVjdGlvbk1hdHJpeCA9IHRoaXMucGl4ZWxQcm9qZWN0aW9uTWF0cml4O1xuICAgIGxldCBwaXhlbFVucHJvamVjdGlvbk1hdHJpeCA9IHRoaXMucGl4ZWxVbnByb2plY3Rpb25NYXRyaXg7XG5cbiAgICBpZiAobW9kZWxNYXRyaXgpIHtcbiAgICAgIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXggPSBtYXQ0Lm11bHRpcGx5KFtdLCB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4LCBtb2RlbE1hdHJpeCk7XG4gICAgICBwaXhlbFByb2plY3Rpb25NYXRyaXggPSBtYXQ0Lm11bHRpcGx5KFtdLCB0aGlzLnBpeGVsUHJvamVjdGlvbk1hdHJpeCwgbW9kZWxNYXRyaXgpO1xuICAgICAgcGl4ZWxVbnByb2plY3Rpb25NYXRyaXggPSBtYXQ0LmludmVydChbXSwgcGl4ZWxQcm9qZWN0aW9uTWF0cml4KTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRyaWNlcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCxcbiAgICAgIHZpZXdQcm9qZWN0aW9uTWF0cml4OiB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4LFxuICAgICAgdmlld01hdHJpeDogdGhpcy52aWV3TWF0cml4LFxuICAgICAgcHJvamVjdGlvbk1hdHJpeDogdGhpcy5wcm9qZWN0aW9uTWF0cml4LFxuXG4gICAgICAvLyBwcm9qZWN0L3VucHJvamVjdCBiZXR3ZWVuIHBpeGVscyBhbmQgd29ybGRcbiAgICAgIHBpeGVsUHJvamVjdGlvbk1hdHJpeCxcbiAgICAgIHBpeGVsVW5wcm9qZWN0aW9uTWF0cml4LFxuXG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBzY2FsZTogdGhpcy5zY2FsZVxuICAgIH0sXG5cbiAgICAgIC8vIFN1YmNsYXNzIGNhbiBhZGQgYWRkaXRpb25hbCBwYXJhbXNcbiAgICAgIC8vIFRPRE8gLSBGcmFnaWxlOiBiZXR0ZXIgdG8gbWFrZSBiYXNlIFZpZXdwb3J0IGNsYXNzIGF3YXJlIG9mIGFsbCBwYXJhbXNcbiAgICAgIHRoaXMuX2dldFBhcmFtcygpXG4gICAgKTtcblxuICAgIHJldHVybiBtYXRyaWNlcztcbiAgfVxuXG4gIC8vIElOVEVSTkFMIE1FVEhPRFNcblxuICAvLyBDYW4gYmUgc3ViY2xhc3NlZCB0byBhZGQgYWRkaXRpb25hbCBmaWVsZHMgdG8gYGdldE1hdHJpY2VzYFxuICBfZ2V0UGFyYW1zKCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxufVxuXG4vLyBIZWxwZXIsIGF2b2lkcyBsb3ctcHJlY2lzaW9uIDMyIGJpdCBtYXRyaWNlcyBmcm9tIGdsLW1hdHJpeCBtYXQ0LmNyZWF0ZSgpXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWF0NCgpIHtcbiAgcmV0dXJuIFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXTtcbn1cbiJdfQ==
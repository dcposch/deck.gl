'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getUniformsFromViewport = getUniformsFromViewport;

var _luma = require('luma.gl');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fp64ify(a) {
  var hiPart = Math.fround(a);
  var loPart = a - Math.fround(a);
  return [hiPart, loPart];
}

// To quickly set a vector to zero
var ZERO_VECTOR = [0, 0, 0, 0];
// 4x4 matrix that drops 4th component of vector
var VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

function calculateMatrixAndOffset(_ref) {
  var projectionMode = _ref.projectionMode,
      positionOrigin = _ref.positionOrigin,
      viewport = _ref.viewport,
      modelMatrix = _ref.modelMatrix;
  var viewMatrixUncentered = viewport.viewMatrixUncentered,
      viewMatrix = viewport.viewMatrix,
      projectionMatrix = viewport.projectionMatrix;


  var projectionCenter = void 0;
  var modelViewProjectionMatrix = void 0;

  var viewProjectionMatrix = new _luma.Matrix4(projectionMatrix).multiplyRight(viewMatrix);

  switch (projectionMode) {

    case _constants.COORDINATE_SYSTEM.LNGLAT:
      projectionCenter = ZERO_VECTOR;
      modelViewProjectionMatrix = viewProjectionMatrix;
      if (modelMatrix) {
        // Apply model matrix if supplied
        // modelViewProjectionMatrix = modelViewProjectionMatrix.clone();
        modelViewProjectionMatrix.multiplyRight(modelMatrix);
      }
      break;

    case _constants.COORDINATE_SYSTEM.METER_OFFSETS:
      // Calculate transformed projectionCenter (in 64 bit precision)
      // This is the key to offset mode precision (avoids doing this
      // addition in 32 bit precision)
      var positionPixels = viewport.projectFlat(positionOrigin);
      projectionCenter = viewProjectionMatrix.transformVector([positionPixels[0], positionPixels[1], 0.0, 1.0]);

      modelViewProjectionMatrix = new _luma.Matrix4(projectionMatrix)
      // Always apply uncentered projection matrix (shader adds center)
      .multiplyRight(viewMatrixUncentered)
      // Zero out 4th coordinate ("after" model matrix) - avoids further translations
      .multiplyRight(VECTOR_TO_POINT_MATRIX);

      if (modelMatrix) {
        // Apply model matrix if supplied
        modelViewProjectionMatrix.multiplyRight(modelMatrix);
      }
      break;

    default:
      throw new Error('Unknown projection mode');
  }

  return {
    modelViewProjectionMatrix: modelViewProjectionMatrix,
    projectionCenter: projectionCenter
  };
}

/**
 * Returns uniforms for shaders based on current projection
 * includes: projection matrix suitable for shaders
 *
 * TODO - Ensure this works with any viewport, not just WebMercatorViewports
 *
 * @param {WebMercatorViewport} viewport -
 * @return {Float32Array} - 4x4 projection matrix that can be used in shaders
 */
function getUniformsFromViewport(viewport) {
  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref2$modelMatrix = _ref2.modelMatrix,
      modelMatrix = _ref2$modelMatrix === undefined ? null : _ref2$modelMatrix,
      _ref2$projectionMode = _ref2.projectionMode,
      projectionMode = _ref2$projectionMode === undefined ? _constants.COORDINATE_SYSTEM.LNGLAT : _ref2$projectionMode,
      _ref2$positionOrigin = _ref2.positionOrigin,
      positionOrigin = _ref2$positionOrigin === undefined ? [0, 0] : _ref2$positionOrigin;

  (0, _assert2.default)(viewport.scale, 'Viewport scale missing');

  var _calculateMatrixAndOf = calculateMatrixAndOffset({ projectionMode: projectionMode, positionOrigin: positionOrigin, modelMatrix: modelMatrix, viewport: viewport }),
      projectionCenter = _calculateMatrixAndOf.projectionCenter,
      modelViewProjectionMatrix = _calculateMatrixAndOf.modelViewProjectionMatrix;

  (0, _assert2.default)(modelViewProjectionMatrix, 'Viewport missing modelViewProjectionMatrix');

  // Calculate projection pixels per unit
  var projectionPixelsPerUnit = viewport.getDistanceScales().pixelsPerMeter;
  (0, _assert2.default)(projectionPixelsPerUnit, 'Viewport missing pixelsPerMeter');

  // calculate WebGL matrices

  // Convert to Float32
  var glProjectionMatrix = new Float32Array(modelViewProjectionMatrix);

  // "Float64Array"
  // Transpose the projection matrix to column major for GLSL.
  var glProjectionMatrixFP64 = new Float32Array(32);
  for (var i = 0; i < 4; ++i) {
    for (var j = 0; j < 4; ++j) {
      var _fp64ify = fp64ify(modelViewProjectionMatrix[j * 4 + i]);

      var _fp64ify2 = _slicedToArray(_fp64ify, 2);

      glProjectionMatrixFP64[(i * 4 + j) * 2] = _fp64ify2[0];
      glProjectionMatrixFP64[(i * 4 + j) * 2 + 1] = _fp64ify2[1];
    }
  }

  return {
    // Projection mode values
    projectionMode: projectionMode,
    projectionCenter: projectionCenter,

    // modelMatrix: modelMatrix || new Matrix4().identity(),

    // Main projection matrices
    projectionMatrix: glProjectionMatrix,
    projectionMatrixUncentered: glProjectionMatrix,
    projectionFP64: glProjectionMatrixFP64,
    projectionPixelsPerUnit: projectionPixelsPerUnit,

    // This is the mercator scale (2 ** zoom)
    projectionScale: viewport.scale,

    // Deprecated?
    projectionScaleFP64: fp64ify(viewport.scale)
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvdmlld3BvcnQtdW5pZm9ybXMuanMiXSwibmFtZXMiOlsiZ2V0VW5pZm9ybXNGcm9tVmlld3BvcnQiLCJmcDY0aWZ5IiwiYSIsImhpUGFydCIsIk1hdGgiLCJmcm91bmQiLCJsb1BhcnQiLCJaRVJPX1ZFQ1RPUiIsIlZFQ1RPUl9UT19QT0lOVF9NQVRSSVgiLCJjYWxjdWxhdGVNYXRyaXhBbmRPZmZzZXQiLCJwcm9qZWN0aW9uTW9kZSIsInBvc2l0aW9uT3JpZ2luIiwidmlld3BvcnQiLCJtb2RlbE1hdHJpeCIsInZpZXdNYXRyaXhVbmNlbnRlcmVkIiwidmlld01hdHJpeCIsInByb2plY3Rpb25NYXRyaXgiLCJwcm9qZWN0aW9uQ2VudGVyIiwibW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCIsInZpZXdQcm9qZWN0aW9uTWF0cml4IiwibXVsdGlwbHlSaWdodCIsIkxOR0xBVCIsIk1FVEVSX09GRlNFVFMiLCJwb3NpdGlvblBpeGVscyIsInByb2plY3RGbGF0IiwidHJhbnNmb3JtVmVjdG9yIiwiRXJyb3IiLCJzY2FsZSIsInByb2plY3Rpb25QaXhlbHNQZXJVbml0IiwiZ2V0RGlzdGFuY2VTY2FsZXMiLCJwaXhlbHNQZXJNZXRlciIsImdsUHJvamVjdGlvbk1hdHJpeCIsIkZsb2F0MzJBcnJheSIsImdsUHJvamVjdGlvbk1hdHJpeEZQNjQiLCJpIiwiaiIsInByb2plY3Rpb25NYXRyaXhVbmNlbnRlcmVkIiwicHJvamVjdGlvbkZQNjQiLCJwcm9qZWN0aW9uU2NhbGUiLCJwcm9qZWN0aW9uU2NhbGVGUDY0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQWdGZ0JBLHVCLEdBQUFBLHVCOztBQWhGaEI7O0FBRUE7Ozs7QUFDQTs7OztBQUVBLFNBQVNDLE9BQVQsQ0FBaUJDLENBQWpCLEVBQW9CO0FBQ2xCLE1BQU1DLFNBQVNDLEtBQUtDLE1BQUwsQ0FBWUgsQ0FBWixDQUFmO0FBQ0EsTUFBTUksU0FBU0osSUFBSUUsS0FBS0MsTUFBTCxDQUFZSCxDQUFaLENBQW5CO0FBQ0EsU0FBTyxDQUFDQyxNQUFELEVBQVNHLE1BQVQsQ0FBUDtBQUNEOztBQUVEO0FBQ0EsSUFBTUMsY0FBYyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsQ0FBcEI7QUFDQTtBQUNBLElBQU1DLHlCQUF5QixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLEVBQStCLENBQS9CLEVBQWtDLENBQWxDLEVBQXFDLENBQXJDLEVBQXdDLENBQXhDLEVBQTJDLENBQTNDLEVBQThDLENBQTlDLENBQS9COztBQUVBLFNBQVNDLHdCQUFULE9BS0c7QUFBQSxNQUpEQyxjQUlDLFFBSkRBLGNBSUM7QUFBQSxNQUhEQyxjQUdDLFFBSERBLGNBR0M7QUFBQSxNQUZEQyxRQUVDLFFBRkRBLFFBRUM7QUFBQSxNQUREQyxXQUNDLFFBRERBLFdBQ0M7QUFBQSxNQUNNQyxvQkFETixHQUM0REYsUUFENUQsQ0FDTUUsb0JBRE47QUFBQSxNQUM0QkMsVUFENUIsR0FDNERILFFBRDVELENBQzRCRyxVQUQ1QjtBQUFBLE1BQ3dDQyxnQkFEeEMsR0FDNERKLFFBRDVELENBQ3dDSSxnQkFEeEM7OztBQUdELE1BQUlDLHlCQUFKO0FBQ0EsTUFBSUMsa0NBQUo7O0FBRUEsTUFBTUMsdUJBQXVCLGtCQUFZSCxnQkFBWixFQUE4QkksYUFBOUIsQ0FBNENMLFVBQTVDLENBQTdCOztBQUVBLFVBQVFMLGNBQVI7O0FBRUEsU0FBSyw2QkFBa0JXLE1BQXZCO0FBQ0VKLHlCQUFtQlYsV0FBbkI7QUFDQVcsa0NBQTRCQyxvQkFBNUI7QUFDQSxVQUFJTixXQUFKLEVBQWlCO0FBQ2Y7QUFDQTtBQUNBSyxrQ0FBMEJFLGFBQTFCLENBQXdDUCxXQUF4QztBQUNEO0FBQ0Q7O0FBRUYsU0FBSyw2QkFBa0JTLGFBQXZCO0FBQ0U7QUFDQTtBQUNBO0FBQ0EsVUFBTUMsaUJBQWlCWCxTQUFTWSxXQUFULENBQXFCYixjQUFyQixDQUF2QjtBQUNBTSx5QkFBbUJFLHFCQUNoQk0sZUFEZ0IsQ0FDQSxDQUFDRixlQUFlLENBQWYsQ0FBRCxFQUFvQkEsZUFBZSxDQUFmLENBQXBCLEVBQXVDLEdBQXZDLEVBQTRDLEdBQTVDLENBREEsQ0FBbkI7O0FBR0FMLGtDQUE0QixrQkFBWUYsZ0JBQVo7QUFDMUI7QUFEMEIsT0FFekJJLGFBRnlCLENBRVhOLG9CQUZXO0FBRzFCO0FBSDBCLE9BSXpCTSxhQUp5QixDQUlYWixzQkFKVyxDQUE1Qjs7QUFNQSxVQUFJSyxXQUFKLEVBQWlCO0FBQ2Y7QUFDQUssa0NBQTBCRSxhQUExQixDQUF3Q1AsV0FBeEM7QUFDRDtBQUNEOztBQUVGO0FBQ0UsWUFBTSxJQUFJYSxLQUFKLENBQVUseUJBQVYsQ0FBTjtBQWpDRjs7QUFvQ0EsU0FBTztBQUNMUix3REFESztBQUVMRDtBQUZLLEdBQVA7QUFJRDs7QUFFRDs7Ozs7Ozs7O0FBU08sU0FBU2pCLHVCQUFULENBQWlDWSxRQUFqQyxFQUlDO0FBQUEsa0ZBQUosRUFBSTtBQUFBLGdDQUhOQyxXQUdNO0FBQUEsTUFITkEsV0FHTSxxQ0FIUSxJQUdSO0FBQUEsbUNBRk5ILGNBRU07QUFBQSxNQUZOQSxjQUVNLHdDQUZXLDZCQUFrQlcsTUFFN0I7QUFBQSxtQ0FETlYsY0FDTTtBQUFBLE1BRE5BLGNBQ00sd0NBRFcsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUNYOztBQUNOLHdCQUFPQyxTQUFTZSxLQUFoQixFQUF1Qix3QkFBdkI7O0FBRE0sOEJBSUpsQix5QkFBeUIsRUFBQ0MsOEJBQUQsRUFBaUJDLDhCQUFqQixFQUFpQ0Usd0JBQWpDLEVBQThDRCxrQkFBOUMsRUFBekIsQ0FKSTtBQUFBLE1BR0NLLGdCQUhELHlCQUdDQSxnQkFIRDtBQUFBLE1BR21CQyx5QkFIbkIseUJBR21CQSx5QkFIbkI7O0FBTU4sd0JBQU9BLHlCQUFQLEVBQWtDLDRDQUFsQzs7QUFFQTtBQUNBLE1BQU1VLDBCQUEwQmhCLFNBQVNpQixpQkFBVCxHQUE2QkMsY0FBN0Q7QUFDQSx3QkFBT0YsdUJBQVAsRUFBZ0MsaUNBQWhDOztBQUVBOztBQUVBO0FBQ0EsTUFBTUcscUJBQXFCLElBQUlDLFlBQUosQ0FBaUJkLHlCQUFqQixDQUEzQjs7QUFFQTtBQUNBO0FBQ0EsTUFBTWUseUJBQXlCLElBQUlELFlBQUosQ0FBaUIsRUFBakIsQ0FBL0I7QUFDQSxPQUFLLElBQUlFLElBQUksQ0FBYixFQUFnQkEsSUFBSSxDQUFwQixFQUF1QixFQUFFQSxDQUF6QixFQUE0QjtBQUMxQixTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSSxDQUFwQixFQUF1QixFQUFFQSxDQUF6QixFQUE0QjtBQUFBLHFCQUl0QmxDLFFBQVFpQiwwQkFBMEJpQixJQUFJLENBQUosR0FBUUQsQ0FBbEMsQ0FBUixDQUpzQjs7QUFBQTs7QUFFeEJELDZCQUF1QixDQUFDQyxJQUFJLENBQUosR0FBUUMsQ0FBVCxJQUFjLENBQXJDLENBRndCO0FBR3hCRiw2QkFBdUIsQ0FBQ0MsSUFBSSxDQUFKLEdBQVFDLENBQVQsSUFBYyxDQUFkLEdBQWtCLENBQXpDLENBSHdCO0FBSzNCO0FBQ0Y7O0FBRUQsU0FBTztBQUNMO0FBQ0F6QixrQ0FGSztBQUdMTyxzQ0FISzs7QUFLTDs7QUFFQTtBQUNBRCxzQkFBa0JlLGtCQVJiO0FBU0xLLGdDQUE0Qkwsa0JBVHZCO0FBVUxNLG9CQUFnQkosc0JBVlg7QUFXTEwsb0RBWEs7O0FBYUw7QUFDQVUscUJBQWlCMUIsU0FBU2UsS0FkckI7O0FBZ0JMO0FBQ0FZLHlCQUFxQnRDLFFBQVFXLFNBQVNlLEtBQWpCO0FBakJoQixHQUFQO0FBbUJEIiwiZmlsZSI6InZpZXdwb3J0LXVuaWZvcm1zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNYXRyaXg0fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHtDT09SRElOQVRFX1NZU1RFTX0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5mdW5jdGlvbiBmcDY0aWZ5KGEpIHtcbiAgY29uc3QgaGlQYXJ0ID0gTWF0aC5mcm91bmQoYSk7XG4gIGNvbnN0IGxvUGFydCA9IGEgLSBNYXRoLmZyb3VuZChhKTtcbiAgcmV0dXJuIFtoaVBhcnQsIGxvUGFydF07XG59XG5cbi8vIFRvIHF1aWNrbHkgc2V0IGEgdmVjdG9yIHRvIHplcm9cbmNvbnN0IFpFUk9fVkVDVE9SID0gWzAsIDAsIDAsIDBdO1xuLy8gNHg0IG1hdHJpeCB0aGF0IGRyb3BzIDR0aCBjb21wb25lbnQgb2YgdmVjdG9yXG5jb25zdCBWRUNUT1JfVE9fUE9JTlRfTUFUUklYID0gWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDBdO1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVNYXRyaXhBbmRPZmZzZXQoe1xuICBwcm9qZWN0aW9uTW9kZSxcbiAgcG9zaXRpb25PcmlnaW4sXG4gIHZpZXdwb3J0LFxuICBtb2RlbE1hdHJpeFxufSkge1xuICBjb25zdCB7dmlld01hdHJpeFVuY2VudGVyZWQsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXh9ID0gdmlld3BvcnQ7XG5cbiAgbGV0IHByb2plY3Rpb25DZW50ZXI7XG4gIGxldCBtb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4O1xuXG4gIGNvbnN0IHZpZXdQcm9qZWN0aW9uTWF0cml4ID0gbmV3IE1hdHJpeDQocHJvamVjdGlvbk1hdHJpeCkubXVsdGlwbHlSaWdodCh2aWV3TWF0cml4KTtcblxuICBzd2l0Y2ggKHByb2plY3Rpb25Nb2RlKSB7XG5cbiAgY2FzZSBDT09SRElOQVRFX1NZU1RFTS5MTkdMQVQ6XG4gICAgcHJvamVjdGlvbkNlbnRlciA9IFpFUk9fVkVDVE9SO1xuICAgIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXggPSB2aWV3UHJvamVjdGlvbk1hdHJpeDtcbiAgICBpZiAobW9kZWxNYXRyaXgpIHtcbiAgICAgIC8vIEFwcGx5IG1vZGVsIG1hdHJpeCBpZiBzdXBwbGllZFxuICAgICAgLy8gbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCA9IG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXguY2xvbmUoKTtcbiAgICAgIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgubXVsdGlwbHlSaWdodChtb2RlbE1hdHJpeCk7XG4gICAgfVxuICAgIGJyZWFrO1xuXG4gIGNhc2UgQ09PUkRJTkFURV9TWVNURU0uTUVURVJfT0ZGU0VUUzpcbiAgICAvLyBDYWxjdWxhdGUgdHJhbnNmb3JtZWQgcHJvamVjdGlvbkNlbnRlciAoaW4gNjQgYml0IHByZWNpc2lvbilcbiAgICAvLyBUaGlzIGlzIHRoZSBrZXkgdG8gb2Zmc2V0IG1vZGUgcHJlY2lzaW9uIChhdm9pZHMgZG9pbmcgdGhpc1xuICAgIC8vIGFkZGl0aW9uIGluIDMyIGJpdCBwcmVjaXNpb24pXG4gICAgY29uc3QgcG9zaXRpb25QaXhlbHMgPSB2aWV3cG9ydC5wcm9qZWN0RmxhdChwb3NpdGlvbk9yaWdpbik7XG4gICAgcHJvamVjdGlvbkNlbnRlciA9IHZpZXdQcm9qZWN0aW9uTWF0cml4XG4gICAgICAudHJhbnNmb3JtVmVjdG9yKFtwb3NpdGlvblBpeGVsc1swXSwgcG9zaXRpb25QaXhlbHNbMV0sIDAuMCwgMS4wXSk7XG5cbiAgICBtb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4ID0gbmV3IE1hdHJpeDQocHJvamVjdGlvbk1hdHJpeClcbiAgICAgIC8vIEFsd2F5cyBhcHBseSB1bmNlbnRlcmVkIHByb2plY3Rpb24gbWF0cml4IChzaGFkZXIgYWRkcyBjZW50ZXIpXG4gICAgICAubXVsdGlwbHlSaWdodCh2aWV3TWF0cml4VW5jZW50ZXJlZClcbiAgICAgIC8vIFplcm8gb3V0IDR0aCBjb29yZGluYXRlIChcImFmdGVyXCIgbW9kZWwgbWF0cml4KSAtIGF2b2lkcyBmdXJ0aGVyIHRyYW5zbGF0aW9uc1xuICAgICAgLm11bHRpcGx5UmlnaHQoVkVDVE9SX1RPX1BPSU5UX01BVFJJWCk7XG5cbiAgICBpZiAobW9kZWxNYXRyaXgpIHtcbiAgICAgIC8vIEFwcGx5IG1vZGVsIG1hdHJpeCBpZiBzdXBwbGllZFxuICAgICAgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeC5tdWx0aXBseVJpZ2h0KG1vZGVsTWF0cml4KTtcbiAgICB9XG4gICAgYnJlYWs7XG5cbiAgZGVmYXVsdDpcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gcHJvamVjdGlvbiBtb2RlJyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgsXG4gICAgcHJvamVjdGlvbkNlbnRlclxuICB9O1xufVxuXG4vKipcbiAqIFJldHVybnMgdW5pZm9ybXMgZm9yIHNoYWRlcnMgYmFzZWQgb24gY3VycmVudCBwcm9qZWN0aW9uXG4gKiBpbmNsdWRlczogcHJvamVjdGlvbiBtYXRyaXggc3VpdGFibGUgZm9yIHNoYWRlcnNcbiAqXG4gKiBUT0RPIC0gRW5zdXJlIHRoaXMgd29ya3Mgd2l0aCBhbnkgdmlld3BvcnQsIG5vdCBqdXN0IFdlYk1lcmNhdG9yVmlld3BvcnRzXG4gKlxuICogQHBhcmFtIHtXZWJNZXJjYXRvclZpZXdwb3J0fSB2aWV3cG9ydCAtXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IC0gNHg0IHByb2plY3Rpb24gbWF0cml4IHRoYXQgY2FuIGJlIHVzZWQgaW4gc2hhZGVyc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pZm9ybXNGcm9tVmlld3BvcnQodmlld3BvcnQsIHtcbiAgbW9kZWxNYXRyaXggPSBudWxsLFxuICBwcm9qZWN0aW9uTW9kZSA9IENPT1JESU5BVEVfU1lTVEVNLkxOR0xBVCxcbiAgcG9zaXRpb25PcmlnaW4gPSBbMCwgMF1cbn0gPSB7fSkge1xuICBhc3NlcnQodmlld3BvcnQuc2NhbGUsICdWaWV3cG9ydCBzY2FsZSBtaXNzaW5nJyk7XG5cbiAgY29uc3Qge3Byb2plY3Rpb25DZW50ZXIsIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXh9ID1cbiAgICBjYWxjdWxhdGVNYXRyaXhBbmRPZmZzZXQoe3Byb2plY3Rpb25Nb2RlLCBwb3NpdGlvbk9yaWdpbiwgbW9kZWxNYXRyaXgsIHZpZXdwb3J0fSk7XG5cbiAgYXNzZXJ0KG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgsICdWaWV3cG9ydCBtaXNzaW5nIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgnKTtcblxuICAvLyBDYWxjdWxhdGUgcHJvamVjdGlvbiBwaXhlbHMgcGVyIHVuaXRcbiAgY29uc3QgcHJvamVjdGlvblBpeGVsc1BlclVuaXQgPSB2aWV3cG9ydC5nZXREaXN0YW5jZVNjYWxlcygpLnBpeGVsc1Blck1ldGVyO1xuICBhc3NlcnQocHJvamVjdGlvblBpeGVsc1BlclVuaXQsICdWaWV3cG9ydCBtaXNzaW5nIHBpeGVsc1Blck1ldGVyJyk7XG5cbiAgLy8gY2FsY3VsYXRlIFdlYkdMIG1hdHJpY2VzXG5cbiAgLy8gQ29udmVydCB0byBGbG9hdDMyXG4gIGNvbnN0IGdsUHJvamVjdGlvbk1hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkobW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCk7XG5cbiAgLy8gXCJGbG9hdDY0QXJyYXlcIlxuICAvLyBUcmFuc3Bvc2UgdGhlIHByb2plY3Rpb24gbWF0cml4IHRvIGNvbHVtbiBtYWpvciBmb3IgR0xTTC5cbiAgY29uc3QgZ2xQcm9qZWN0aW9uTWF0cml4RlA2NCA9IG5ldyBGbG9hdDMyQXJyYXkoMzIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7ICsraSkge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgNDsgKytqKSB7XG4gICAgICBbXG4gICAgICAgIGdsUHJvamVjdGlvbk1hdHJpeEZQNjRbKGkgKiA0ICsgaikgKiAyXSxcbiAgICAgICAgZ2xQcm9qZWN0aW9uTWF0cml4RlA2NFsoaSAqIDQgKyBqKSAqIDIgKyAxXVxuICAgICAgXSA9IGZwNjRpZnkobW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeFtqICogNCArIGldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8vIFByb2plY3Rpb24gbW9kZSB2YWx1ZXNcbiAgICBwcm9qZWN0aW9uTW9kZSxcbiAgICBwcm9qZWN0aW9uQ2VudGVyLFxuXG4gICAgLy8gbW9kZWxNYXRyaXg6IG1vZGVsTWF0cml4IHx8IG5ldyBNYXRyaXg0KCkuaWRlbnRpdHkoKSxcblxuICAgIC8vIE1haW4gcHJvamVjdGlvbiBtYXRyaWNlc1xuICAgIHByb2plY3Rpb25NYXRyaXg6IGdsUHJvamVjdGlvbk1hdHJpeCxcbiAgICBwcm9qZWN0aW9uTWF0cml4VW5jZW50ZXJlZDogZ2xQcm9qZWN0aW9uTWF0cml4LFxuICAgIHByb2plY3Rpb25GUDY0OiBnbFByb2plY3Rpb25NYXRyaXhGUDY0LFxuICAgIHByb2plY3Rpb25QaXhlbHNQZXJVbml0LFxuXG4gICAgLy8gVGhpcyBpcyB0aGUgbWVyY2F0b3Igc2NhbGUgKDIgKiogem9vbSlcbiAgICBwcm9qZWN0aW9uU2NhbGU6IHZpZXdwb3J0LnNjYWxlLFxuXG4gICAgLy8gRGVwcmVjYXRlZD9cbiAgICBwcm9qZWN0aW9uU2NhbGVGUDY0OiBmcDY0aWZ5KHZpZXdwb3J0LnNjYWxlKVxuICB9O1xufVxuIl19
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /* global window */


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
  var modelViewMatrix = void 0;

  switch (projectionMode) {

    case _constants.COORDINATE_SYSTEM.IDENTITY:
    case _constants.COORDINATE_SYSTEM.LNGLAT:
      projectionCenter = ZERO_VECTOR;
      modelViewMatrix = new _luma.Matrix4(viewMatrix);
      break;

    // TODO: make lighitng work for meter offset mode
    case _constants.COORDINATE_SYSTEM.METER_OFFSETS:
      // Calculate transformed projectionCenter (in 64 bit precision)
      // This is the key to offset mode precision (avoids doing this
      // addition in 32 bit precision)
      var positionPixels = viewport.projectFlat(positionOrigin);
      var viewProjectionMatrix = new _luma.Matrix4(projectionMatrix).multiplyRight(viewMatrix);
      projectionCenter = viewProjectionMatrix.transformVector([positionPixels[0], positionPixels[1], 0.0, 1.0]);

      // Always apply uncentered projection matrix (shader adds center)
      modelViewMatrix = new _luma.Matrix4(viewMatrixUncentered)
      // Zero out 4th coordinate ("after" model matrix) - avoids further translations
      .multiplyRight(VECTOR_TO_POINT_MATRIX);
      break;

    default:
      throw new Error('Unknown projection mode');
  }

  var viewMatrixInv = modelViewMatrix.clone().invert();

  if (modelMatrix) {
    // Apply model matrix if supplied
    modelViewMatrix.multiplyRight(modelMatrix);
  }

  var modelViewProjectionMatrix = new _luma.Matrix4(projectionMatrix).multiplyRight(modelViewMatrix);
  var cameraPos = [viewMatrixInv[12], viewMatrixInv[13], viewMatrixInv[14]];

  return {
    modelViewMatrix: modelViewMatrix,
    modelViewProjectionMatrix: modelViewProjectionMatrix,
    projectionCenter: projectionCenter,
    cameraPos: cameraPos
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
      modelViewMatrix = _calculateMatrixAndOf.modelViewMatrix,
      modelViewProjectionMatrix = _calculateMatrixAndOf.modelViewProjectionMatrix,
      cameraPos = _calculateMatrixAndOf.cameraPos;

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

  var devicePixelRatio = window && window.devicePixelRatio || 1;

  return {
    // Projection mode values
    projectionMode: projectionMode,
    projectionCenter: projectionCenter,

    // modelMatrix: modelMatrix || new Matrix4().identity(),
    modelViewMatrix: modelViewMatrix,

    // Screen size
    viewportSize: [viewport.width * devicePixelRatio, viewport.height * devicePixelRatio],
    devicePixelRatio: devicePixelRatio,

    // Main projection matrices
    projectionMatrix: glProjectionMatrix,
    projectionMatrixUncentered: glProjectionMatrix,
    projectionFP64: glProjectionMatrixFP64,
    projectionPixelsPerUnit: projectionPixelsPerUnit,

    // This is the mercator scale (2 ** zoom)
    projectionScale: viewport.scale,

    // Deprecated?
    projectionScaleFP64: fp64ify(viewport.scale),

    // This is for lighting calculations
    cameraPos: new Float32Array(cameraPos)

  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvdmlld3BvcnQtdW5pZm9ybXMuanMiXSwibmFtZXMiOlsiZ2V0VW5pZm9ybXNGcm9tVmlld3BvcnQiLCJmcDY0aWZ5IiwiYSIsImhpUGFydCIsIk1hdGgiLCJmcm91bmQiLCJsb1BhcnQiLCJaRVJPX1ZFQ1RPUiIsIlZFQ1RPUl9UT19QT0lOVF9NQVRSSVgiLCJjYWxjdWxhdGVNYXRyaXhBbmRPZmZzZXQiLCJwcm9qZWN0aW9uTW9kZSIsInBvc2l0aW9uT3JpZ2luIiwidmlld3BvcnQiLCJtb2RlbE1hdHJpeCIsInZpZXdNYXRyaXhVbmNlbnRlcmVkIiwidmlld01hdHJpeCIsInByb2plY3Rpb25NYXRyaXgiLCJwcm9qZWN0aW9uQ2VudGVyIiwibW9kZWxWaWV3TWF0cml4IiwiSURFTlRJVFkiLCJMTkdMQVQiLCJNRVRFUl9PRkZTRVRTIiwicG9zaXRpb25QaXhlbHMiLCJwcm9qZWN0RmxhdCIsInZpZXdQcm9qZWN0aW9uTWF0cml4IiwibXVsdGlwbHlSaWdodCIsInRyYW5zZm9ybVZlY3RvciIsIkVycm9yIiwidmlld01hdHJpeEludiIsImNsb25lIiwiaW52ZXJ0IiwibW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCIsImNhbWVyYVBvcyIsInNjYWxlIiwicHJvamVjdGlvblBpeGVsc1BlclVuaXQiLCJnZXREaXN0YW5jZVNjYWxlcyIsInBpeGVsc1Blck1ldGVyIiwiZ2xQcm9qZWN0aW9uTWF0cml4IiwiRmxvYXQzMkFycmF5IiwiZ2xQcm9qZWN0aW9uTWF0cml4RlA2NCIsImkiLCJqIiwiZGV2aWNlUGl4ZWxSYXRpbyIsIndpbmRvdyIsInZpZXdwb3J0U2l6ZSIsIndpZHRoIiwiaGVpZ2h0IiwicHJvamVjdGlvbk1hdHJpeFVuY2VudGVyZWQiLCJwcm9qZWN0aW9uRlA2NCIsInByb2plY3Rpb25TY2FsZSIsInByb2plY3Rpb25TY2FsZUZQNjQiXSwibWFwcGluZ3MiOiI7Ozs7Ozt5cEJBQUE7OztRQW1GZ0JBLHVCLEdBQUFBLHVC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QUVELE1BQU1DLG1CQUFvQkMsVUFBVUEsT0FBT0QsZ0JBQWxCLElBQXVDLENBQWhFOztBQUVBLFNBQU87QUFDTDtBQUNBaEMsa0NBRks7QUFHTE8sc0NBSEs7O0FBS0w7QUFDQUMsb0NBTks7O0FBUUw7QUFDQTBCLGtCQUFjLENBQUNoQyxTQUFTaUMsS0FBVCxHQUFpQkgsZ0JBQWxCLEVBQW9DOUIsU0FBU2tDLE1BQVQsR0FBa0JKLGdCQUF0RCxDQVRUO0FBVUxBLHNDQVZLOztBQVlMO0FBQ0ExQixzQkFBa0JxQixrQkFiYjtBQWNMVSxnQ0FBNEJWLGtCQWR2QjtBQWVMVyxvQkFBZ0JULHNCQWZYO0FBZ0JMTCxvREFoQks7O0FBa0JMO0FBQ0FlLHFCQUFpQnJDLFNBQVNxQixLQW5CckI7O0FBcUJMO0FBQ0FpQix5QkFBcUJqRCxRQUFRVyxTQUFTcUIsS0FBakIsQ0F0QmhCOztBQXdCTDtBQUNBRCxlQUFXLElBQUlNLFlBQUosQ0FBaUJOLFNBQWpCOztBQXpCTixHQUFQO0FBNEJEIiwiZmlsZSI6InZpZXdwb3J0LXVuaWZvcm1zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIHdpbmRvdyAqL1xuaW1wb3J0IHtNYXRyaXg0fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHtDT09SRElOQVRFX1NZU1RFTX0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5mdW5jdGlvbiBmcDY0aWZ5KGEpIHtcbiAgY29uc3QgaGlQYXJ0ID0gTWF0aC5mcm91bmQoYSk7XG4gIGNvbnN0IGxvUGFydCA9IGEgLSBNYXRoLmZyb3VuZChhKTtcbiAgcmV0dXJuIFtoaVBhcnQsIGxvUGFydF07XG59XG5cbi8vIFRvIHF1aWNrbHkgc2V0IGEgdmVjdG9yIHRvIHplcm9cbmNvbnN0IFpFUk9fVkVDVE9SID0gWzAsIDAsIDAsIDBdO1xuLy8gNHg0IG1hdHJpeCB0aGF0IGRyb3BzIDR0aCBjb21wb25lbnQgb2YgdmVjdG9yXG5jb25zdCBWRUNUT1JfVE9fUE9JTlRfTUFUUklYID0gWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDBdO1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVNYXRyaXhBbmRPZmZzZXQoe1xuICBwcm9qZWN0aW9uTW9kZSxcbiAgcG9zaXRpb25PcmlnaW4sXG4gIHZpZXdwb3J0LFxuICBtb2RlbE1hdHJpeFxufSkge1xuICBjb25zdCB7dmlld01hdHJpeFVuY2VudGVyZWQsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXh9ID0gdmlld3BvcnQ7XG5cbiAgbGV0IHByb2plY3Rpb25DZW50ZXI7XG4gIGxldCBtb2RlbFZpZXdNYXRyaXg7XG5cbiAgc3dpdGNoIChwcm9qZWN0aW9uTW9kZSkge1xuXG4gIGNhc2UgQ09PUkRJTkFURV9TWVNURU0uSURFTlRJVFk6XG4gIGNhc2UgQ09PUkRJTkFURV9TWVNURU0uTE5HTEFUOlxuICAgIHByb2plY3Rpb25DZW50ZXIgPSBaRVJPX1ZFQ1RPUjtcbiAgICBtb2RlbFZpZXdNYXRyaXggPSBuZXcgTWF0cml4NCh2aWV3TWF0cml4KTtcbiAgICBicmVhaztcblxuICAvLyBUT0RPOiBtYWtlIGxpZ2hpdG5nIHdvcmsgZm9yIG1ldGVyIG9mZnNldCBtb2RlXG4gIGNhc2UgQ09PUkRJTkFURV9TWVNURU0uTUVURVJfT0ZGU0VUUzpcbiAgICAvLyBDYWxjdWxhdGUgdHJhbnNmb3JtZWQgcHJvamVjdGlvbkNlbnRlciAoaW4gNjQgYml0IHByZWNpc2lvbilcbiAgICAvLyBUaGlzIGlzIHRoZSBrZXkgdG8gb2Zmc2V0IG1vZGUgcHJlY2lzaW9uIChhdm9pZHMgZG9pbmcgdGhpc1xuICAgIC8vIGFkZGl0aW9uIGluIDMyIGJpdCBwcmVjaXNpb24pXG4gICAgY29uc3QgcG9zaXRpb25QaXhlbHMgPSB2aWV3cG9ydC5wcm9qZWN0RmxhdChwb3NpdGlvbk9yaWdpbik7XG4gICAgY29uc3Qgdmlld1Byb2plY3Rpb25NYXRyaXggPSBuZXcgTWF0cml4NChwcm9qZWN0aW9uTWF0cml4KS5tdWx0aXBseVJpZ2h0KHZpZXdNYXRyaXgpO1xuICAgIHByb2plY3Rpb25DZW50ZXIgPSB2aWV3UHJvamVjdGlvbk1hdHJpeFxuICAgICAgLnRyYW5zZm9ybVZlY3RvcihbcG9zaXRpb25QaXhlbHNbMF0sIHBvc2l0aW9uUGl4ZWxzWzFdLCAwLjAsIDEuMF0pO1xuXG4gICAgLy8gQWx3YXlzIGFwcGx5IHVuY2VudGVyZWQgcHJvamVjdGlvbiBtYXRyaXggKHNoYWRlciBhZGRzIGNlbnRlcilcbiAgICBtb2RlbFZpZXdNYXRyaXggPSBuZXcgTWF0cml4NCh2aWV3TWF0cml4VW5jZW50ZXJlZClcbiAgICAgIC8vIFplcm8gb3V0IDR0aCBjb29yZGluYXRlIChcImFmdGVyXCIgbW9kZWwgbWF0cml4KSAtIGF2b2lkcyBmdXJ0aGVyIHRyYW5zbGF0aW9uc1xuICAgICAgLm11bHRpcGx5UmlnaHQoVkVDVE9SX1RPX1BPSU5UX01BVFJJWCk7XG4gICAgYnJlYWs7XG5cbiAgZGVmYXVsdDpcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gcHJvamVjdGlvbiBtb2RlJyk7XG4gIH1cblxuICBjb25zdCB2aWV3TWF0cml4SW52ID0gbW9kZWxWaWV3TWF0cml4LmNsb25lKCkuaW52ZXJ0KCk7XG5cbiAgaWYgKG1vZGVsTWF0cml4KSB7XG4gICAgLy8gQXBwbHkgbW9kZWwgbWF0cml4IGlmIHN1cHBsaWVkXG4gICAgbW9kZWxWaWV3TWF0cml4Lm11bHRpcGx5UmlnaHQobW9kZWxNYXRyaXgpO1xuICB9XG5cbiAgY29uc3QgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCA9IG5ldyBNYXRyaXg0KHByb2plY3Rpb25NYXRyaXgpLm11bHRpcGx5UmlnaHQobW9kZWxWaWV3TWF0cml4KTtcbiAgY29uc3QgY2FtZXJhUG9zID0gW3ZpZXdNYXRyaXhJbnZbMTJdLCB2aWV3TWF0cml4SW52WzEzXSwgdmlld01hdHJpeEludlsxNF1dO1xuXG4gIHJldHVybiB7XG4gICAgbW9kZWxWaWV3TWF0cml4LFxuICAgIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgsXG4gICAgcHJvamVjdGlvbkNlbnRlcixcbiAgICBjYW1lcmFQb3NcbiAgfTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHVuaWZvcm1zIGZvciBzaGFkZXJzIGJhc2VkIG9uIGN1cnJlbnQgcHJvamVjdGlvblxuICogaW5jbHVkZXM6IHByb2plY3Rpb24gbWF0cml4IHN1aXRhYmxlIGZvciBzaGFkZXJzXG4gKlxuICogVE9ETyAtIEVuc3VyZSB0aGlzIHdvcmtzIHdpdGggYW55IHZpZXdwb3J0LCBub3QganVzdCBXZWJNZXJjYXRvclZpZXdwb3J0c1xuICpcbiAqIEBwYXJhbSB7V2ViTWVyY2F0b3JWaWV3cG9ydH0gdmlld3BvcnQgLVxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSAtIDR4NCBwcm9qZWN0aW9uIG1hdHJpeCB0aGF0IGNhbiBiZSB1c2VkIGluIHNoYWRlcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaWZvcm1zRnJvbVZpZXdwb3J0KHZpZXdwb3J0LCB7XG4gIG1vZGVsTWF0cml4ID0gbnVsbCxcbiAgcHJvamVjdGlvbk1vZGUgPSBDT09SRElOQVRFX1NZU1RFTS5MTkdMQVQsXG4gIHBvc2l0aW9uT3JpZ2luID0gWzAsIDBdXG59ID0ge30pIHtcbiAgYXNzZXJ0KHZpZXdwb3J0LnNjYWxlLCAnVmlld3BvcnQgc2NhbGUgbWlzc2luZycpO1xuXG4gIGNvbnN0IHtwcm9qZWN0aW9uQ2VudGVyLCBtb2RlbFZpZXdNYXRyaXgsIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXgsIGNhbWVyYVBvc30gPVxuICAgIGNhbGN1bGF0ZU1hdHJpeEFuZE9mZnNldCh7cHJvamVjdGlvbk1vZGUsIHBvc2l0aW9uT3JpZ2luLCBtb2RlbE1hdHJpeCwgdmlld3BvcnR9KTtcblxuICBhc3NlcnQobW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCwgJ1ZpZXdwb3J0IG1pc3NpbmcgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCcpO1xuXG4gIC8vIENhbGN1bGF0ZSBwcm9qZWN0aW9uIHBpeGVscyBwZXIgdW5pdFxuICBjb25zdCBwcm9qZWN0aW9uUGl4ZWxzUGVyVW5pdCA9IHZpZXdwb3J0LmdldERpc3RhbmNlU2NhbGVzKCkucGl4ZWxzUGVyTWV0ZXI7XG4gIGFzc2VydChwcm9qZWN0aW9uUGl4ZWxzUGVyVW5pdCwgJ1ZpZXdwb3J0IG1pc3NpbmcgcGl4ZWxzUGVyTWV0ZXInKTtcblxuICAvLyBjYWxjdWxhdGUgV2ViR0wgbWF0cmljZXNcblxuICAvLyBDb252ZXJ0IHRvIEZsb2F0MzJcbiAgY29uc3QgZ2xQcm9qZWN0aW9uTWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheShtb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4KTtcblxuICAvLyBcIkZsb2F0NjRBcnJheVwiXG4gIC8vIFRyYW5zcG9zZSB0aGUgcHJvamVjdGlvbiBtYXRyaXggdG8gY29sdW1uIG1ham9yIGZvciBHTFNMLlxuICBjb25zdCBnbFByb2plY3Rpb25NYXRyaXhGUDY0ID0gbmV3IEZsb2F0MzJBcnJheSgzMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCA0OyArK2opIHtcbiAgICAgIFtcbiAgICAgICAgZ2xQcm9qZWN0aW9uTWF0cml4RlA2NFsoaSAqIDQgKyBqKSAqIDJdLFxuICAgICAgICBnbFByb2plY3Rpb25NYXRyaXhGUDY0WyhpICogNCArIGopICogMiArIDFdXG4gICAgICBdID0gZnA2NGlmeShtb2RlbFZpZXdQcm9qZWN0aW9uTWF0cml4W2ogKiA0ICsgaV0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRldmljZVBpeGVsUmF0aW8gPSAod2luZG93ICYmIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKSB8fCAxO1xuXG4gIHJldHVybiB7XG4gICAgLy8gUHJvamVjdGlvbiBtb2RlIHZhbHVlc1xuICAgIHByb2plY3Rpb25Nb2RlLFxuICAgIHByb2plY3Rpb25DZW50ZXIsXG5cbiAgICAvLyBtb2RlbE1hdHJpeDogbW9kZWxNYXRyaXggfHwgbmV3IE1hdHJpeDQoKS5pZGVudGl0eSgpLFxuICAgIG1vZGVsVmlld01hdHJpeCxcblxuICAgIC8vIFNjcmVlbiBzaXplXG4gICAgdmlld3BvcnRTaXplOiBbdmlld3BvcnQud2lkdGggKiBkZXZpY2VQaXhlbFJhdGlvLCB2aWV3cG9ydC5oZWlnaHQgKiBkZXZpY2VQaXhlbFJhdGlvXSxcbiAgICBkZXZpY2VQaXhlbFJhdGlvLFxuXG4gICAgLy8gTWFpbiBwcm9qZWN0aW9uIG1hdHJpY2VzXG4gICAgcHJvamVjdGlvbk1hdHJpeDogZ2xQcm9qZWN0aW9uTWF0cml4LFxuICAgIHByb2plY3Rpb25NYXRyaXhVbmNlbnRlcmVkOiBnbFByb2plY3Rpb25NYXRyaXgsXG4gICAgcHJvamVjdGlvbkZQNjQ6IGdsUHJvamVjdGlvbk1hdHJpeEZQNjQsXG4gICAgcHJvamVjdGlvblBpeGVsc1BlclVuaXQsXG5cbiAgICAvLyBUaGlzIGlzIHRoZSBtZXJjYXRvciBzY2FsZSAoMiAqKiB6b29tKVxuICAgIHByb2plY3Rpb25TY2FsZTogdmlld3BvcnQuc2NhbGUsXG5cbiAgICAvLyBEZXByZWNhdGVkP1xuICAgIHByb2plY3Rpb25TY2FsZUZQNjQ6IGZwNjRpZnkodmlld3BvcnQuc2NhbGUpLFxuXG4gICAgLy8gVGhpcyBpcyBmb3IgbGlnaHRpbmcgY2FsY3VsYXRpb25zXG4gICAgY2FtZXJhUG9zOiBuZXcgRmxvYXQzMkFycmF5KGNhbWVyYVBvcylcblxuICB9O1xufVxuIl19
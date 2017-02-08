'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isSimple = isSimple;
exports.normalize = normalize;
exports.getVertexCount = getVertexCount;
exports.getTriangleCount = getTriangleCount;
exports.forEachVertex = forEachVertex;

var _utils = require('../../../lib/utils');

// Basic polygon support
//
// Handles simple and complex polygons
// Simple polygons are arrays of vertices, implicitly "closed"
// Complex polygons are arrays of simple polygons, with the first polygon
// representing the outer hull and other polygons representing holes

/**
 * Check if this is a non-nested polygon (i.e. the first element of the first element is a number)
 * @param {Array} polygon - either a complex or simple polygon
 * @return {Boolean} - true if the polygon is a simple polygon (i.e. not an array of polygons)
 */
function isSimple(polygon) {
  return (0, _utils.count)(polygon) >= 1 && (0, _utils.count)((0, _utils.get)(polygon, 0)) >= 2 && Number.isFinite((0, _utils.get)((0, _utils.get)(polygon, 0), 0));
}

/**
 * Normalize to ensure that all polygons in a list are complex - simplifies processing
 * @param {Array} polygon - either a complex or a simple polygon
 * @param {Object} opts
 * @param {Object} opts.dimensions - if 3, the coords will be padded with 0's if needed
 * @return {Array} - returns a complex polygons
 */
function normalize(polygon) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$dimensions = _ref.dimensions,
      dimensions = _ref$dimensions === undefined ? 3 : _ref$dimensions;

  return isSimple(polygon) ? [polygon] : polygon;
}

/**
 * Check if this is a non-nested polygon (i.e. the first element of the first element is a number)
 * @param {Array} polygon - either a complex or simple polygon
 * @return {Boolean} - true if the polygon is a simple polygon (i.e. not an array of polygons)
 */
function getVertexCount(polygon) {
  return isSimple(polygon) ? (0, _utils.count)(polygon) : polygon.reduce(function (length, simplePolygon) {
    return length + (0, _utils.count)(simplePolygon);
  }, 0);
}

// Return number of triangles needed to tesselate the polygon
function getTriangleCount(polygon) {
  var triangleCount = 0;
  var first = true;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = normalize(polygon)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var simplePolygon = _step.value;

      var size = (0, _utils.count)(simplePolygon);
      if (first) {
        triangleCount += size >= 3 ? size - 2 : 0;
      } else {
        triangleCount += size + 1;
      }
      first = false;
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

  return triangleCount;
}

function forEachVertex(polygon, visitor) {
  if (isSimple(polygon)) {
    polygon.forEach(visitor);
    return;
  }

  var vertexIndex = 0;
  polygon.forEach(function (simplePolygon) {
    simplePolygon.forEach(function (v, i, p) {
      return visitor(v, vertexIndex, polygon);
    });
    vertexIndex++;
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24uanMiXSwibmFtZXMiOlsiaXNTaW1wbGUiLCJub3JtYWxpemUiLCJnZXRWZXJ0ZXhDb3VudCIsImdldFRyaWFuZ2xlQ291bnQiLCJmb3JFYWNoVmVydGV4IiwicG9seWdvbiIsIk51bWJlciIsImlzRmluaXRlIiwiZGltZW5zaW9ucyIsInJlZHVjZSIsImxlbmd0aCIsInNpbXBsZVBvbHlnb24iLCJ0cmlhbmdsZUNvdW50IiwiZmlyc3QiLCJzaXplIiwidmlzaXRvciIsImZvckVhY2giLCJ2ZXJ0ZXhJbmRleCIsInYiLCJpIiwicCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFjZ0JBLFEsR0FBQUEsUTtRQWFBQyxTLEdBQUFBLFM7UUFTQUMsYyxHQUFBQSxjO1FBT0FDLGdCLEdBQUFBLGdCO1FBZUFDLGEsR0FBQUEsYTs7QUExRGhCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7QUFLTyxTQUFTSixRQUFULENBQWtCSyxPQUFsQixFQUEyQjtBQUNoQyxTQUFPLGtCQUFNQSxPQUFOLEtBQWtCLENBQWxCLElBQ0wsa0JBQU0sZ0JBQUlBLE9BQUosRUFBYSxDQUFiLENBQU4sS0FBMEIsQ0FEckIsSUFFTEMsT0FBT0MsUUFBUCxDQUFnQixnQkFBSSxnQkFBSUYsT0FBSixFQUFhLENBQWIsQ0FBSixFQUFxQixDQUFyQixDQUFoQixDQUZGO0FBR0Q7O0FBRUQ7Ozs7Ozs7QUFPTyxTQUFTSixTQUFULENBQW1CSSxPQUFuQixFQUFtRDtBQUFBLGlGQUFKLEVBQUk7QUFBQSw2QkFBdEJHLFVBQXNCO0FBQUEsTUFBdEJBLFVBQXNCLG1DQUFULENBQVM7O0FBQ3hELFNBQU9SLFNBQVNLLE9BQVQsSUFBb0IsQ0FBQ0EsT0FBRCxDQUFwQixHQUFnQ0EsT0FBdkM7QUFDRDs7QUFFRDs7Ozs7QUFLTyxTQUFTSCxjQUFULENBQXdCRyxPQUF4QixFQUFpQztBQUN0QyxTQUFPTCxTQUFTSyxPQUFULElBQ0wsa0JBQU1BLE9BQU4sQ0FESyxHQUVMQSxRQUFRSSxNQUFSLENBQWUsVUFBQ0MsTUFBRCxFQUFTQyxhQUFUO0FBQUEsV0FBMkJELFNBQVMsa0JBQU1DLGFBQU4sQ0FBcEM7QUFBQSxHQUFmLEVBQXlFLENBQXpFLENBRkY7QUFHRDs7QUFFRDtBQUNPLFNBQVNSLGdCQUFULENBQTBCRSxPQUExQixFQUFtQztBQUN4QyxNQUFJTyxnQkFBZ0IsQ0FBcEI7QUFDQSxNQUFJQyxRQUFRLElBQVo7QUFGd0M7QUFBQTtBQUFBOztBQUFBO0FBR3hDLHlCQUE0QlosVUFBVUksT0FBVixDQUE1Qiw4SEFBZ0Q7QUFBQSxVQUFyQ00sYUFBcUM7O0FBQzlDLFVBQU1HLE9BQU8sa0JBQU1ILGFBQU4sQ0FBYjtBQUNBLFVBQUlFLEtBQUosRUFBVztBQUNURCx5QkFBaUJFLFFBQVEsQ0FBUixHQUFZQSxPQUFPLENBQW5CLEdBQXVCLENBQXhDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xGLHlCQUFpQkUsT0FBTyxDQUF4QjtBQUNEO0FBQ0RELGNBQVEsS0FBUjtBQUNEO0FBWHVDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBWXhDLFNBQU9ELGFBQVA7QUFDRDs7QUFFTSxTQUFTUixhQUFULENBQXVCQyxPQUF2QixFQUFnQ1UsT0FBaEMsRUFBeUM7QUFDOUMsTUFBSWYsU0FBU0ssT0FBVCxDQUFKLEVBQXVCO0FBQ3JCQSxZQUFRVyxPQUFSLENBQWdCRCxPQUFoQjtBQUNBO0FBQ0Q7O0FBRUQsTUFBSUUsY0FBYyxDQUFsQjtBQUNBWixVQUFRVyxPQUFSLENBQWdCLHlCQUFpQjtBQUMvQkwsa0JBQWNLLE9BQWQsQ0FBc0IsVUFBQ0UsQ0FBRCxFQUFJQyxDQUFKLEVBQU9DLENBQVA7QUFBQSxhQUFhTCxRQUFRRyxDQUFSLEVBQVdELFdBQVgsRUFBd0JaLE9BQXhCLENBQWI7QUFBQSxLQUF0QjtBQUNBWTtBQUNELEdBSEQ7QUFJRCIsImZpbGUiOiJwb2x5Z29uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtnZXQsIGNvdW50fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuXG4vLyBCYXNpYyBwb2x5Z29uIHN1cHBvcnRcbi8vXG4vLyBIYW5kbGVzIHNpbXBsZSBhbmQgY29tcGxleCBwb2x5Z29uc1xuLy8gU2ltcGxlIHBvbHlnb25zIGFyZSBhcnJheXMgb2YgdmVydGljZXMsIGltcGxpY2l0bHkgXCJjbG9zZWRcIlxuLy8gQ29tcGxleCBwb2x5Z29ucyBhcmUgYXJyYXlzIG9mIHNpbXBsZSBwb2x5Z29ucywgd2l0aCB0aGUgZmlyc3QgcG9seWdvblxuLy8gcmVwcmVzZW50aW5nIHRoZSBvdXRlciBodWxsIGFuZCBvdGhlciBwb2x5Z29ucyByZXByZXNlbnRpbmcgaG9sZXNcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGlzIGEgbm9uLW5lc3RlZCBwb2x5Z29uIChpLmUuIHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBmaXJzdCBlbGVtZW50IGlzIGEgbnVtYmVyKVxuICogQHBhcmFtIHtBcnJheX0gcG9seWdvbiAtIGVpdGhlciBhIGNvbXBsZXggb3Igc2ltcGxlIHBvbHlnb25cbiAqIEByZXR1cm4ge0Jvb2xlYW59IC0gdHJ1ZSBpZiB0aGUgcG9seWdvbiBpcyBhIHNpbXBsZSBwb2x5Z29uIChpLmUuIG5vdCBhbiBhcnJheSBvZiBwb2x5Z29ucylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2ltcGxlKHBvbHlnb24pIHtcbiAgcmV0dXJuIGNvdW50KHBvbHlnb24pID49IDEgJiZcbiAgICBjb3VudChnZXQocG9seWdvbiwgMCkpID49IDIgJiZcbiAgICBOdW1iZXIuaXNGaW5pdGUoZ2V0KGdldChwb2x5Z29uLCAwKSwgMCkpO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0byBlbnN1cmUgdGhhdCBhbGwgcG9seWdvbnMgaW4gYSBsaXN0IGFyZSBjb21wbGV4IC0gc2ltcGxpZmllcyBwcm9jZXNzaW5nXG4gKiBAcGFyYW0ge0FycmF5fSBwb2x5Z29uIC0gZWl0aGVyIGEgY29tcGxleCBvciBhIHNpbXBsZSBwb2x5Z29uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogQHBhcmFtIHtPYmplY3R9IG9wdHMuZGltZW5zaW9ucyAtIGlmIDMsIHRoZSBjb29yZHMgd2lsbCBiZSBwYWRkZWQgd2l0aCAwJ3MgaWYgbmVlZGVkXG4gKiBAcmV0dXJuIHtBcnJheX0gLSByZXR1cm5zIGEgY29tcGxleCBwb2x5Z29uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplKHBvbHlnb24sIHtkaW1lbnNpb25zID0gM30gPSB7fSkge1xuICByZXR1cm4gaXNTaW1wbGUocG9seWdvbikgPyBbcG9seWdvbl0gOiBwb2x5Z29uO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgaXMgYSBub24tbmVzdGVkIHBvbHlnb24gKGkuZS4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGZpcnN0IGVsZW1lbnQgaXMgYSBudW1iZXIpXG4gKiBAcGFyYW0ge0FycmF5fSBwb2x5Z29uIC0gZWl0aGVyIGEgY29tcGxleCBvciBzaW1wbGUgcG9seWdvblxuICogQHJldHVybiB7Qm9vbGVhbn0gLSB0cnVlIGlmIHRoZSBwb2x5Z29uIGlzIGEgc2ltcGxlIHBvbHlnb24gKGkuZS4gbm90IGFuIGFycmF5IG9mIHBvbHlnb25zKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmVydGV4Q291bnQocG9seWdvbikge1xuICByZXR1cm4gaXNTaW1wbGUocG9seWdvbikgP1xuICAgIGNvdW50KHBvbHlnb24pIDpcbiAgICBwb2x5Z29uLnJlZHVjZSgobGVuZ3RoLCBzaW1wbGVQb2x5Z29uKSA9PiBsZW5ndGggKyBjb3VudChzaW1wbGVQb2x5Z29uKSwgMCk7XG59XG5cbi8vIFJldHVybiBudW1iZXIgb2YgdHJpYW5nbGVzIG5lZWRlZCB0byB0ZXNzZWxhdGUgdGhlIHBvbHlnb25cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmlhbmdsZUNvdW50KHBvbHlnb24pIHtcbiAgbGV0IHRyaWFuZ2xlQ291bnQgPSAwO1xuICBsZXQgZmlyc3QgPSB0cnVlO1xuICBmb3IgKGNvbnN0IHNpbXBsZVBvbHlnb24gb2Ygbm9ybWFsaXplKHBvbHlnb24pKSB7XG4gICAgY29uc3Qgc2l6ZSA9IGNvdW50KHNpbXBsZVBvbHlnb24pO1xuICAgIGlmIChmaXJzdCkge1xuICAgICAgdHJpYW5nbGVDb3VudCArPSBzaXplID49IDMgPyBzaXplIC0gMiA6IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyaWFuZ2xlQ291bnQgKz0gc2l6ZSArIDE7XG4gICAgfVxuICAgIGZpcnN0ID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRyaWFuZ2xlQ291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JFYWNoVmVydGV4KHBvbHlnb24sIHZpc2l0b3IpIHtcbiAgaWYgKGlzU2ltcGxlKHBvbHlnb24pKSB7XG4gICAgcG9seWdvbi5mb3JFYWNoKHZpc2l0b3IpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCB2ZXJ0ZXhJbmRleCA9IDA7XG4gIHBvbHlnb24uZm9yRWFjaChzaW1wbGVQb2x5Z29uID0+IHtcbiAgICBzaW1wbGVQb2x5Z29uLmZvckVhY2goKHYsIGksIHApID0+IHZpc2l0b3IodiwgdmVydGV4SW5kZXgsIHBvbHlnb24pKTtcbiAgICB2ZXJ0ZXhJbmRleCsrO1xuICB9KTtcbn1cbiJdfQ==
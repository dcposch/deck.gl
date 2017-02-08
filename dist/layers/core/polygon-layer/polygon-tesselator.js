'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PolygonTesselator = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Handles tesselation of polygons with holes
// - 2D surfaces
// - 2D outlines
// - 3D surfaces (top and sides only)
// - 3D wireframes (not yet)


exports.flattenVertices2 = flattenVertices2;

var _polygon = require('./polygon');

var Polygon = _interopRequireWildcard(_polygon);

var _earcut = require('earcut');

var _earcut2 = _interopRequireDefault(_earcut);

var _utils = require('../../../lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Maybe deck.gl or luma.gl needs to export this
function getPickingColor(index) {
  return [(index + 1) % 256, Math.floor((index + 1) / 256) % 256, Math.floor((index + 1) / 256 / 256) % 256];
}

var DEFAULT_COLOR = [0, 0, 0, 255]; // Black

// This class is set up to allow querying one attribute at a time
// the way the AttributeManager expects it

var PolygonTesselator = exports.PolygonTesselator = function () {
  function PolygonTesselator(_ref) {
    var polygons = _ref.polygons;

    _classCallCheck(this, PolygonTesselator);

    // Normalize all polygons
    this.polygons = _utils.Container.map(polygons, function (polygon) {
      return Polygon.normalize(polygon);
    });
    // Count all polygon vertices
    this.pointCount = getPointCount(this.polygons);
  }

  _createClass(PolygonTesselator, [{
    key: 'indices',
    value: function indices() {
      var polygons = this.polygons,
          indexCount = this.indexCount;

      return calculateIndices({ polygons: polygons, indexCount: indexCount });
    }
  }, {
    key: 'positions',
    value: function positions() {
      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculatePositions({ polygons: polygons, pointCount: pointCount });
    }
  }, {
    key: 'normals',
    value: function normals() {
      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculateNormals({ polygons: polygons, pointCount: pointCount });
    }
  }, {
    key: 'colors',
    value: function colors() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$getColor = _ref2.getColor,
          getColor = _ref2$getColor === undefined ? function (x) {
        return DEFAULT_COLOR;
      } : _ref2$getColor;

      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculateColors({ polygons: polygons, pointCount: pointCount, getColor: getColor });
    }
  }, {
    key: 'pickingColors',
    value: function pickingColors() {
      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculatePickingColors({ polygons: polygons, pointCount: pointCount });
    }

    // getAttribute({size, accessor}) {
    //   const {polygons, pointCount} = this;
    //   return calculateAttribute({polygons, pointCount, size, accessor});
    // }

  }]);

  return PolygonTesselator;
}();

// Count number of points in a list of complex polygons


function getPointCount(polygons) {
  return polygons.reduce(function (sum, polygon) {
    return sum + Polygon.getVertexCount(polygon);
  }, 0);
}

// COunt number of triangles in a list of complex polygons
function getTriangleCount(polygons) {
  return polygons.reduce(function (count, polygon) {
    return count + Polygon.getTriangleCount(polygon);
  }, 0);
}

// Returns the offsets of each complex polygon in the combined array of all polygons
function getPolygonOffsets(polygons) {
  var offsets = new Array(polygons.length + 1);
  offsets[0] = 0;
  var offset = 0;
  polygons.forEach(function (polygon, i) {
    offset += Polygon.getVertexCount(polygon);
    offsets[i + 1] = offset;
  });
  return offsets;
}

// Returns the offset of each hole polygon in the flattened array for that polygon
function getHoleIndices(complexPolygon) {
  var holeIndices = null;
  if (complexPolygon.length > 1) {
    (function () {
      var polygonStartIndex = 0;
      holeIndices = [];
      _utils.Container.forEach(complexPolygon, function (polygon) {
        polygonStartIndex += polygon.length;
        holeIndices.push(polygonStartIndex);
      });
      // Last element points to end of the flat array, remove it
      holeIndices.pop();
    })();
  }
  return holeIndices;
}

function calculateIndices(_ref3) {
  var polygons = _ref3.polygons,
      _ref3$IndexType = _ref3.IndexType,
      IndexType = _ref3$IndexType === undefined ? Uint32Array : _ref3$IndexType;

  // Calculate length of index array (3 * number of triangles)
  var indexCount = 3 * getTriangleCount(polygons);
  var offsets = getPolygonOffsets(polygons);

  // Allocate the attribute
  // TODO it's not the index count but the vertex count that must be checked
  if (IndexType === Uint16Array && indexCount > 65535) {
    throw new Error('Vertex count exceeds browser\'s limit');
  }
  var attribute = new IndexType(indexCount);

  // 1. get triangulated indices for the internal areas
  // 2. offset them by the number of indices in previous polygons
  var i = 0;
  polygons.forEach(function (polygon, polygonIndex) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = calculateSurfaceIndices(polygon)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var index = _step.value;

        attribute[i++] = index + offsets[polygonIndex];
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
  });

  return attribute;
}

/*
 * Get vertex indices for drawing complexPolygon mesh
 * @private
 * @param {[Number,Number,Number][][]} complexPolygon
 * @returns {[Number]} indices
 */
function calculateSurfaceIndices(complexPolygon) {
  // Prepare an array of hole indices as expected by earcut
  var holeIndices = getHoleIndices(complexPolygon);
  // Flatten the polygon as expected by earcut
  var verts = flattenVertices2(complexPolygon);
  // Let earcut triangulate the polygon
  return (0, _earcut2.default)(verts, holeIndices, 3);
}

// Flattens nested array of vertices, padding third coordinate as needed
function flattenVertices2(nestedArray) {
  var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref4$result = _ref4.result,
      result = _ref4$result === undefined ? [] : _ref4$result,
      _ref4$dimensions = _ref4.dimensions,
      dimensions = _ref4$dimensions === undefined ? 3 : _ref4$dimensions;

  var index = -1;
  var vertexLength = 0;
  var length = _utils.Container.count(nestedArray);
  while (++index < length) {
    var value = _utils.Container.get(nestedArray, index);
    if (_utils.Container.isContainer(value)) {
      (0, _utils.flattenVertices)(value, { result: result, dimensions: dimensions });
    } else {
      if (vertexLength < dimensions) {
        // eslint-disable-line
        result.push(value);
        vertexLength++;
      }
    }
  }
  // Add a third coordinate if needed
  if (vertexLength > 0 && vertexLength < dimensions) {
    result.push(0);
  }
  return result;
}

function calculatePositions(_ref5) {
  var polygons = _ref5.polygons,
      pointCount = _ref5.pointCount;

  // Flatten out all the vertices of all the sub subPolygons
  var attribute = new Float32Array(pointCount * 3);
  var i = 0;
  _utils.Container.forEach(polygons, function (polygon) {
    return Polygon.forEachVertex(polygon, function (vertex) {
      attribute[i++] = vertex[0];
      attribute[i++] = vertex[1];
      attribute[i++] = vertex[2] || 0;
    });
  });
  // for (const complexPolygon of polygons) {
  //   for (const simplePolygon of complexPolygon) {
  //     for (const vertex of simplePolygon) {
  //       attribute[i++] = vertex[0];
  //       attribute[i++] = vertex[1];
  //       attribute[i++] = vertex[2] || 0;
  //     }
  //   }
  // }
  return attribute;
}

function calculateNormals(_ref6) {
  var polygons = _ref6.polygons,
      pointCount = _ref6.pointCount;

  // TODO - use generic vertex attribute?
  var attribute = new Float32Array(pointCount * 3);
  (0, _utils.fillArray)({ target: attribute, source: [0, 1, 0], start: 0, pointCount: pointCount });
  return attribute;
}

function calculateColors(_ref7) {
  var polygons = _ref7.polygons,
      pointCount = _ref7.pointCount,
      getColor = _ref7.getColor;

  var attribute = new Uint8Array(pointCount * 4);
  var i = 0;
  polygons.forEach(function (complexPolygon, polygonIndex) {
    // Calculate polygon color
    var color = getColor(polygonIndex);
    color[3] = Number.isFinite(color[3]) ? color[3] : 255;

    var count = Polygon.getVertexCount(complexPolygon);
    (0, _utils.fillArray)({ target: attribute, source: color, start: i, count: count });
    i += color.length * count;
  });
  return attribute;
}

function calculatePickingColors(_ref8) {
  var polygons = _ref8.polygons,
      pointCount = _ref8.pointCount;

  var attribute = new Uint8Array(pointCount * 3);
  var i = 0;
  polygons.forEach(function (complexPolygon, polygonIndex) {
    var color = getPickingColor(polygonIndex);
    var count = Polygon.getVertexCount(complexPolygon);
    (0, _utils.fillArray)({ target: attribute, source: color, start: i, count: count });
    i += color.length * count;
  });
  return attribute;
}

// TODO - extremely slow for some reason - to big for JS compiler?
// return calculateAttribute({
//   polygons,
//   attribute,
//   size: 4,
//   accessor: getColor,
//   defaultValue: [0, 0, 0, 255]
// });

/* eslint-disable complexity
function calculateAttribute4({
  polygons, attribute, size, accessor, defaultValue = [0, 0, 0, 0]
}) {
  let i = 0;
  polygons.forEach((complexPolygon, polygonIndex) => {
    const value = accessor(polygonIndex) || defaultValue;
    value[3] = (Number.isFinite(value[3]) ? value[3] : defaultValue[3]);

    // Copy polygon's value into the flattened vertices of the simple polygons
    // TODO - use version of flatten that can take an offset and a target array?
    for (const simplePolygon of complexPolygon) {
      for (const vertex of simplePolygon) { // eslint-disable-line
        attribute[i++] = value[0];
        attribute[i++] = value[1];
        attribute[i++] = value[2];
        attribute[i++] = value[3];
      }
    }
  });
  return attribute;
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wb2x5Z29uLWxheWVyL3BvbHlnb24tdGVzc2VsYXRvci5qcyJdLCJuYW1lcyI6WyJmbGF0dGVuVmVydGljZXMyIiwiUG9seWdvbiIsImdldFBpY2tpbmdDb2xvciIsImluZGV4IiwiTWF0aCIsImZsb29yIiwiREVGQVVMVF9DT0xPUiIsIlBvbHlnb25UZXNzZWxhdG9yIiwicG9seWdvbnMiLCJtYXAiLCJub3JtYWxpemUiLCJwb2x5Z29uIiwicG9pbnRDb3VudCIsImdldFBvaW50Q291bnQiLCJpbmRleENvdW50IiwiY2FsY3VsYXRlSW5kaWNlcyIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsImNhbGN1bGF0ZU5vcm1hbHMiLCJnZXRDb2xvciIsImNhbGN1bGF0ZUNvbG9ycyIsImNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMiLCJyZWR1Y2UiLCJzdW0iLCJnZXRWZXJ0ZXhDb3VudCIsImdldFRyaWFuZ2xlQ291bnQiLCJjb3VudCIsImdldFBvbHlnb25PZmZzZXRzIiwib2Zmc2V0cyIsIkFycmF5IiwibGVuZ3RoIiwib2Zmc2V0IiwiZm9yRWFjaCIsImkiLCJnZXRIb2xlSW5kaWNlcyIsImNvbXBsZXhQb2x5Z29uIiwiaG9sZUluZGljZXMiLCJwb2x5Z29uU3RhcnRJbmRleCIsInB1c2giLCJwb3AiLCJJbmRleFR5cGUiLCJVaW50MzJBcnJheSIsIlVpbnQxNkFycmF5IiwiRXJyb3IiLCJhdHRyaWJ1dGUiLCJwb2x5Z29uSW5kZXgiLCJjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyIsInZlcnRzIiwibmVzdGVkQXJyYXkiLCJyZXN1bHQiLCJkaW1lbnNpb25zIiwidmVydGV4TGVuZ3RoIiwidmFsdWUiLCJnZXQiLCJpc0NvbnRhaW5lciIsIkZsb2F0MzJBcnJheSIsImZvckVhY2hWZXJ0ZXgiLCJ2ZXJ0ZXgiLCJ0YXJnZXQiLCJzb3VyY2UiLCJzdGFydCIsIlVpbnQ4QXJyYXkiLCJjb2xvciIsIk51bWJlciIsImlzRmlu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c0JBQVQsUUFBd0Q7QUFBQSxNQUF2QlosUUFBdUIsU0FBdkJBLFFBQXVCO0FBQUEsTUFBYkksVUFBYSxTQUFiQSxVQUFhOztBQUN0RCxNQUFNK0IsWUFBWSxJQUFJaUIsVUFBSixDQUFlaEQsYUFBYSxDQUE1QixDQUFsQjtBQUNBLE1BQUlvQixJQUFJLENBQVI7QUFDQXhCLFdBQVN1QixPQUFULENBQWlCLFVBQUNHLGNBQUQsRUFBaUJVLFlBQWpCLEVBQWtDO0FBQ2pELFFBQU1pQixRQUFRM0QsZ0JBQWdCMEMsWUFBaEIsQ0FBZDtBQUNBLFFBQU1uQixRQUFReEIsUUFBUXNCLGNBQVIsQ0FBdUJXLGNBQXZCLENBQWQ7QUFDQSwwQkFBVSxFQUFDdUIsUUFBUWQsU0FBVCxFQUFvQmUsUUFBUUcsS0FBNUIsRUFBbUNGLE9BQU8zQixDQUExQyxFQUE2Q1AsWUFBN0MsRUFBVjtBQUNBTyxTQUFLNkIsTUFBTWhDLE1BQU4sR0FBZUosS0FBcEI7QUFDRCxHQUxEO0FBTUEsU0FBT2tCLFNBQVA7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBIiwiZmlsZSI6InBvbHlnb24tdGVzc2VsYXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEhhbmRsZXMgdGVzc2VsYXRpb24gb2YgcG9seWdvbnMgd2l0aCBob2xlc1xuLy8gLSAyRCBzdXJmYWNlc1xuLy8gLSAyRCBvdXRsaW5lc1xuLy8gLSAzRCBzdXJmYWNlcyAodG9wIGFuZCBzaWRlcyBvbmx5KVxuLy8gLSAzRCB3aXJlZnJhbWVzIChub3QgeWV0KVxuaW1wb3J0ICogYXMgUG9seWdvbiBmcm9tICcuL3BvbHlnb24nO1xuaW1wb3J0IGVhcmN1dCBmcm9tICdlYXJjdXQnO1xuaW1wb3J0IHtDb250YWluZXIsIGZsYXR0ZW5WZXJ0aWNlcywgZmlsbEFycmF5fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuXG4vLyBNYXliZSBkZWNrLmdsIG9yIGx1bWEuZ2wgbmVlZHMgdG8gZXhwb3J0IHRoaXNcbmZ1bmN0aW9uIGdldFBpY2tpbmdDb2xvcihpbmRleCkge1xuICByZXR1cm4gW1xuICAgIChpbmRleCArIDEpICUgMjU2LFxuICAgIE1hdGguZmxvb3IoKGluZGV4ICsgMSkgLyAyNTYpICUgMjU2LFxuICAgIE1hdGguZmxvb3IoKGluZGV4ICsgMSkgLyAyNTYgLyAyNTYpICUgMjU2XG4gIF07XG59XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTsgLy8gQmxhY2tcblxuLy8gVGhpcyBjbGFzcyBpcyBzZXQgdXAgdG8gYWxsb3cgcXVlcnlpbmcgb25lIGF0dHJpYnV0ZSBhdCBhIHRpbWVcbi8vIHRoZSB3YXkgdGhlIEF0dHJpYnV0ZU1hbmFnZXIgZXhwZWN0cyBpdFxuZXhwb3J0IGNsYXNzIFBvbHlnb25UZXNzZWxhdG9yIHtcbiAgY29uc3RydWN0b3Ioe3BvbHlnb25zfSkge1xuICAgIC8vIE5vcm1hbGl6ZSBhbGwgcG9seWdvbnNcbiAgICB0aGlzLnBvbHlnb25zID0gQ29udGFpbmVyLm1hcChwb2x5Z29ucywgcG9seWdvbiA9PiBQb2x5Z29uLm5vcm1hbGl6ZShwb2x5Z29uKSk7XG4gICAgLy8gQ291bnQgYWxsIHBvbHlnb24gdmVydGljZXNcbiAgICB0aGlzLnBvaW50Q291bnQgPSBnZXRQb2ludENvdW50KHRoaXMucG9seWdvbnMpO1xuICB9XG5cbiAgaW5kaWNlcygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIGluZGV4Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlSW5kaWNlcyh7cG9seWdvbnMsIGluZGV4Q291bnR9KTtcbiAgfVxuXG4gIHBvc2l0aW9ucygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlUG9zaXRpb25zKHtwb2x5Z29ucywgcG9pbnRDb3VudH0pO1xuICB9XG5cbiAgbm9ybWFscygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlTm9ybWFscyh7cG9seWdvbnMsIHBvaW50Q291bnR9KTtcbiAgfVxuXG4gIGNvbG9ycyh7Z2V0Q29sb3IgPSB4ID0+IERFRkFVTFRfQ09MT1J9ID0ge30pIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlQ29sb3JzKHtwb2x5Z29ucywgcG9pbnRDb3VudCwgZ2V0Q29sb3J9KTtcbiAgfVxuXG4gIHBpY2tpbmdDb2xvcnMoKSB7XG4gICAgY29uc3Qge3BvbHlnb25zLCBwb2ludENvdW50fSA9IHRoaXM7XG4gICAgcmV0dXJuIGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoe3BvbHlnb25zLCBwb2ludENvdW50fSk7XG4gIH1cblxuICAvLyBnZXRBdHRyaWJ1dGUoe3NpemUsIGFjY2Vzc29yfSkge1xuICAvLyAgIGNvbnN0IHtwb2x5Z29ucywgcG9pbnRDb3VudH0gPSB0aGlzO1xuICAvLyAgIHJldHVybiBjYWxjdWxhdGVBdHRyaWJ1dGUoe3BvbHlnb25zLCBwb2ludENvdW50LCBzaXplLCBhY2Nlc3Nvcn0pO1xuICAvLyB9XG59XG5cbi8vIENvdW50IG51bWJlciBvZiBwb2ludHMgaW4gYSBsaXN0IG9mIGNvbXBsZXggcG9seWdvbnNcbmZ1bmN0aW9uIGdldFBvaW50Q291bnQocG9seWdvbnMpIHtcbiAgcmV0dXJuIHBvbHlnb25zLnJlZHVjZSgoc3VtLCBwb2x5Z29uKSA9PiBzdW0gKyBQb2x5Z29uLmdldFZlcnRleENvdW50KHBvbHlnb24pLCAwKTtcbn1cblxuLy8gQ091bnQgbnVtYmVyIG9mIHRyaWFuZ2xlcyBpbiBhIGxpc3Qgb2YgY29tcGxleCBwb2x5Z29uc1xuZnVuY3Rpb24gZ2V0VHJpYW5nbGVDb3VudChwb2x5Z29ucykge1xuICByZXR1cm4gcG9seWdvbnMucmVkdWNlKChjb3VudCwgcG9seWdvbikgPT4gY291bnQgKyBQb2x5Z29uLmdldFRyaWFuZ2xlQ291bnQocG9seWdvbiksIDApO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBvZmZzZXRzIG9mIGVhY2ggY29tcGxleCBwb2x5Z29uIGluIHRoZSBjb21iaW5lZCBhcnJheSBvZiBhbGwgcG9seWdvbnNcbmZ1bmN0aW9uIGdldFBvbHlnb25PZmZzZXRzKHBvbHlnb25zKSB7XG4gIGNvbnN0IG9mZnNldHMgPSBuZXcgQXJyYXkocG9seWdvbnMubGVuZ3RoICsgMSk7XG4gIG9mZnNldHNbMF0gPSAwO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgocG9seWdvbiwgaSkgPT4ge1xuICAgIG9mZnNldCArPSBQb2x5Z29uLmdldFZlcnRleENvdW50KHBvbHlnb24pO1xuICAgIG9mZnNldHNbaSArIDFdID0gb2Zmc2V0O1xuICB9KTtcbiAgcmV0dXJuIG9mZnNldHM7XG59XG5cbi8vIFJldHVybnMgdGhlIG9mZnNldCBvZiBlYWNoIGhvbGUgcG9seWdvbiBpbiB0aGUgZmxhdHRlbmVkIGFycmF5IGZvciB0aGF0IHBvbHlnb25cbmZ1bmN0aW9uIGdldEhvbGVJbmRpY2VzKGNvbXBsZXhQb2x5Z29uKSB7XG4gIGxldCBob2xlSW5kaWNlcyA9IG51bGw7XG4gIGlmIChjb21wbGV4UG9seWdvbi5sZW5ndGggPiAxKSB7XG4gICAgbGV0IHBvbHlnb25TdGFydEluZGV4ID0gMDtcbiAgICBob2xlSW5kaWNlcyA9IFtdO1xuICAgIENvbnRhaW5lci5mb3JFYWNoKGNvbXBsZXhQb2x5Z29uLCBwb2x5Z29uID0+IHtcbiAgICAgIHBvbHlnb25TdGFydEluZGV4ICs9IHBvbHlnb24ubGVuZ3RoO1xuICAgICAgaG9sZUluZGljZXMucHVzaChwb2x5Z29uU3RhcnRJbmRleCk7XG4gICAgfSk7XG4gICAgLy8gTGFzdCBlbGVtZW50IHBvaW50cyB0byBlbmQgb2YgdGhlIGZsYXQgYXJyYXksIHJlbW92ZSBpdFxuICAgIGhvbGVJbmRpY2VzLnBvcCgpO1xuICB9XG4gIHJldHVybiBob2xlSW5kaWNlcztcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlSW5kaWNlcyh7cG9seWdvbnMsIEluZGV4VHlwZSA9IFVpbnQzMkFycmF5fSkge1xuICAvLyBDYWxjdWxhdGUgbGVuZ3RoIG9mIGluZGV4IGFycmF5ICgzICogbnVtYmVyIG9mIHRyaWFuZ2xlcylcbiAgY29uc3QgaW5kZXhDb3VudCA9IDMgKiBnZXRUcmlhbmdsZUNvdW50KHBvbHlnb25zKTtcbiAgY29uc3Qgb2Zmc2V0cyA9IGdldFBvbHlnb25PZmZzZXRzKHBvbHlnb25zKTtcblxuICAvLyBBbGxvY2F0ZSB0aGUgYXR0cmlidXRlXG4gIC8vIFRPRE8gaXQncyBub3QgdGhlIGluZGV4IGNvdW50IGJ1dCB0aGUgdmVydGV4IGNvdW50IHRoYXQgbXVzdCBiZSBjaGVja2VkXG4gIGlmIChJbmRleFR5cGUgPT09IFVpbnQxNkFycmF5ICYmIGluZGV4Q291bnQgPiA2NTUzNSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVmVydGV4IGNvdW50IGV4Y2VlZHMgYnJvd3NlclxcJ3MgbGltaXQnKTtcbiAgfVxuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgSW5kZXhUeXBlKGluZGV4Q291bnQpO1xuXG4gIC8vIDEuIGdldCB0cmlhbmd1bGF0ZWQgaW5kaWNlcyBmb3IgdGhlIGludGVybmFsIGFyZWFzXG4gIC8vIDIuIG9mZnNldCB0aGVtIGJ5IHRoZSBudW1iZXIgb2YgaW5kaWNlcyBpbiBwcmV2aW91cyBwb2x5Z29uc1xuICBsZXQgaSA9IDA7XG4gIHBvbHlnb25zLmZvckVhY2goKHBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIGZvciAoY29uc3QgaW5kZXggb2YgY2FsY3VsYXRlU3VyZmFjZUluZGljZXMocG9seWdvbikpIHtcbiAgICAgIGF0dHJpYnV0ZVtpKytdID0gaW5kZXggKyBvZmZzZXRzW3BvbHlnb25JbmRleF07XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gYXR0cmlidXRlO1xufVxuXG4vKlxuICogR2V0IHZlcnRleCBpbmRpY2VzIGZvciBkcmF3aW5nIGNvbXBsZXhQb2x5Z29uIG1lc2hcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1tOdW1iZXIsTnVtYmVyLE51bWJlcl1bXVtdfSBjb21wbGV4UG9seWdvblxuICogQHJldHVybnMge1tOdW1iZXJdfSBpbmRpY2VzXG4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKGNvbXBsZXhQb2x5Z29uKSB7XG4gIC8vIFByZXBhcmUgYW4gYXJyYXkgb2YgaG9sZSBpbmRpY2VzIGFzIGV4cGVjdGVkIGJ5IGVhcmN1dFxuICBjb25zdCBob2xlSW5kaWNlcyA9IGdldEhvbGVJbmRpY2VzKGNvbXBsZXhQb2x5Z29uKTtcbiAgLy8gRmxhdHRlbiB0aGUgcG9seWdvbiBhcyBleHBlY3RlZCBieSBlYXJjdXRcbiAgY29uc3QgdmVydHMgPSBmbGF0dGVuVmVydGljZXMyKGNvbXBsZXhQb2x5Z29uKTtcbiAgLy8gTGV0IGVhcmN1dCB0cmlhbmd1bGF0ZSB0aGUgcG9seWdvblxuICByZXR1cm4gZWFyY3V0KHZlcnRzLCBob2xlSW5kaWNlcywgMyk7XG59XG5cbi8vIEZsYXR0ZW5zIG5lc3RlZCBhcnJheSBvZiB2ZXJ0aWNlcywgcGFkZGluZyB0aGlyZCBjb29yZGluYXRlIGFzIG5lZWRlZFxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW5WZXJ0aWNlczIobmVzdGVkQXJyYXksIHtyZXN1bHQgPSBbXSwgZGltZW5zaW9ucyA9IDN9ID0ge30pIHtcbiAgbGV0IGluZGV4ID0gLTE7XG4gIGxldCB2ZXJ0ZXhMZW5ndGggPSAwO1xuICBjb25zdCBsZW5ndGggPSBDb250YWluZXIuY291bnQobmVzdGVkQXJyYXkpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlID0gQ29udGFpbmVyLmdldChuZXN0ZWRBcnJheSwgaW5kZXgpO1xuICAgIGlmIChDb250YWluZXIuaXNDb250YWluZXIodmFsdWUpKSB7XG4gICAgICBmbGF0dGVuVmVydGljZXModmFsdWUsIHtyZXN1bHQsIGRpbWVuc2lvbnN9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZlcnRleExlbmd0aCA8IGRpbWVuc2lvbnMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIHZlcnRleExlbmd0aCsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyBBZGQgYSB0aGlyZCBjb29yZGluYXRlIGlmIG5lZWRlZFxuICBpZiAodmVydGV4TGVuZ3RoID4gMCAmJiB2ZXJ0ZXhMZW5ndGggPCBkaW1lbnNpb25zKSB7XG4gICAgcmVzdWx0LnB1c2goMCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlUG9zaXRpb25zKHtwb2x5Z29ucywgcG9pbnRDb3VudH0pIHtcbiAgLy8gRmxhdHRlbiBvdXQgYWxsIHRoZSB2ZXJ0aWNlcyBvZiBhbGwgdGhlIHN1YiBzdWJQb2x5Z29uc1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQgKiAzKTtcbiAgbGV0IGkgPSAwO1xuICBDb250YWluZXIuZm9yRWFjaChwb2x5Z29ucywgcG9seWdvbiA9PlxuICAgIFBvbHlnb24uZm9yRWFjaFZlcnRleChwb2x5Z29uLCB2ZXJ0ZXggPT4ge1xuICAgICAgYXR0cmlidXRlW2krK10gPSB2ZXJ0ZXhbMF07XG4gICAgICBhdHRyaWJ1dGVbaSsrXSA9IHZlcnRleFsxXTtcbiAgICAgIGF0dHJpYnV0ZVtpKytdID0gdmVydGV4WzJdIHx8IDA7XG4gICAgfSlcbiAgKTtcbiAgLy8gZm9yIChjb25zdCBjb21wbGV4UG9seWdvbiBvZiBwb2x5Z29ucykge1xuICAvLyAgIGZvciAoY29uc3Qgc2ltcGxlUG9seWdvbiBvZiBjb21wbGV4UG9seWdvbikge1xuICAvLyAgICAgZm9yIChjb25zdCB2ZXJ0ZXggb2Ygc2ltcGxlUG9seWdvbikge1xuICAvLyAgICAgICBhdHRyaWJ1dGVbaSsrXSA9IHZlcnRleFswXTtcbiAgLy8gICAgICAgYXR0cmlidXRlW2krK10gPSB2ZXJ0ZXhbMV07XG4gIC8vICAgICAgIGF0dHJpYnV0ZVtpKytdID0gdmVydGV4WzJdIHx8IDA7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9XG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZU5vcm1hbHMoe3BvbHlnb25zLCBwb2ludENvdW50fSkge1xuICAvLyBUT0RPIC0gdXNlIGdlbmVyaWMgdmVydGV4IGF0dHJpYnV0ZT9cbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEZsb2F0MzJBcnJheShwb2ludENvdW50ICogMyk7XG4gIGZpbGxBcnJheSh7dGFyZ2V0OiBhdHRyaWJ1dGUsIHNvdXJjZTogWzAsIDEsIDBdLCBzdGFydDogMCwgcG9pbnRDb3VudH0pO1xuICByZXR1cm4gYXR0cmlidXRlO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVDb2xvcnMoe3BvbHlnb25zLCBwb2ludENvdW50LCBnZXRDb2xvcn0pIHtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IFVpbnQ4QXJyYXkocG9pbnRDb3VudCAqIDQpO1xuICBsZXQgaSA9IDA7XG4gIHBvbHlnb25zLmZvckVhY2goKGNvbXBsZXhQb2x5Z29uLCBwb2x5Z29uSW5kZXgpID0+IHtcbiAgICAvLyBDYWxjdWxhdGUgcG9seWdvbiBjb2xvclxuICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IocG9seWdvbkluZGV4KTtcbiAgICBjb2xvclszXSA9IE51bWJlci5pc0Zpbml0ZShjb2xvclszXSkgPyBjb2xvclszXSA6IDI1NTtcblxuICAgIGNvbnN0IGNvdW50ID0gUG9seWdvbi5nZXRWZXJ0ZXhDb3VudChjb21wbGV4UG9seWdvbik7XG4gICAgZmlsbEFycmF5KHt0YXJnZXQ6IGF0dHJpYnV0ZSwgc291cmNlOiBjb2xvciwgc3RhcnQ6IGksIGNvdW50fSk7XG4gICAgaSArPSBjb2xvci5sZW5ndGggKiBjb3VudDtcbiAgfSk7XG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoe3BvbHlnb25zLCBwb2ludENvdW50fSkge1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50ICogMyk7XG4gIGxldCBpID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgoY29tcGxleFBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIGNvbnN0IGNvbG9yID0gZ2V0UGlja2luZ0NvbG9yKHBvbHlnb25JbmRleCk7XG4gICAgY29uc3QgY291bnQgPSBQb2x5Z29uLmdldFZlcnRleENvdW50KGNvbXBsZXhQb2x5Z29uKTtcbiAgICBmaWxsQXJyYXkoe3RhcmdldDogYXR0cmlidXRlLCBzb3VyY2U6IGNvbG9yLCBzdGFydDogaSwgY291bnR9KTtcbiAgICBpICs9IGNvbG9yLmxlbmd0aCAqIGNvdW50O1xuICB9KTtcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn1cblxuLy8gVE9ETyAtIGV4dHJlbWVseSBzbG93IGZvciBzb21lIHJlYXNvbiAtIHRvIGJpZyBmb3IgSlMgY29tcGlsZXI/XG4vLyByZXR1cm4gY2FsY3VsYXRlQXR0cmlidXRlKHtcbi8vICAgcG9seWdvbnMsXG4vLyAgIGF0dHJpYnV0ZSxcbi8vICAgc2l6ZTogNCxcbi8vICAgYWNjZXNzb3I6IGdldENvbG9yLFxuLy8gICBkZWZhdWx0VmFsdWU6IFswLCAwLCAwLCAyNTVdXG4vLyB9KTtcblxuLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eVxuZnVuY3Rpb24gY2FsY3VsYXRlQXR0cmlidXRlNCh7XG4gIHBvbHlnb25zLCBhdHRyaWJ1dGUsIHNpemUsIGFjY2Vzc29yLCBkZWZhdWx0VmFsdWUgPSBbMCwgMCwgMCwgMF1cbn0pIHtcbiAgbGV0IGkgPSAwO1xuICBwb2x5Z29ucy5mb3JFYWNoKChjb21wbGV4UG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBhY2Nlc3Nvcihwb2x5Z29uSW5kZXgpIHx8IGRlZmF1bHRWYWx1ZTtcbiAgICB2YWx1ZVszXSA9IChOdW1iZXIuaXNGaW5pdGUodmFsdWVbM10pID8gdmFsdWVbM10gOiBkZWZhdWx0VmFsdWVbM10pO1xuXG4gICAgLy8gQ29weSBwb2x5Z29uJ3MgdmFsdWUgaW50byB0aGUgZmxhdHRlbmVkIHZlcnRpY2VzIG9mIHRoZSBzaW1wbGUgcG9seWdvbnNcbiAgICAvLyBUT0RPIC0gdXNlIHZlcnNpb24gb2YgZmxhdHRlbiB0aGF0IGNhbiB0YWtlIGFuIG9mZnNldCBhbmQgYSB0YXJnZXQgYXJyYXk/XG4gICAgZm9yIChjb25zdCBzaW1wbGVQb2x5Z29uIG9mIGNvbXBsZXhQb2x5Z29uKSB7XG4gICAgICBmb3IgKGNvbnN0IHZlcnRleCBvZiBzaW1wbGVQb2x5Z29uKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgYXR0cmlidXRlW2krK10gPSB2YWx1ZVswXTtcbiAgICAgICAgYXR0cmlidXRlW2krK10gPSB2YWx1ZVsxXTtcbiAgICAgICAgYXR0cmlidXRlW2krK10gPSB2YWx1ZVsyXTtcbiAgICAgICAgYXR0cmlidXRlW2krK10gPSB2YWx1ZVszXTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gYXR0cmlidXRlO1xufVxuKi9cbiJdfQ==
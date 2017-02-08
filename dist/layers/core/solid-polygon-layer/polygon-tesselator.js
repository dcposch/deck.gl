'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PolygonTesselator = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

var _fp = require('../../../lib/utils/fp64');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Maybe deck.gl or luma.gl needs to export this
function getPickingColor(index) {
  return [(index + 1) % 256, Math.floor((index + 1) / 256) % 256, Math.floor((index + 1) / 256 / 256) % 256];
}

function parseColor(color) {
  if (!Array.isArray(color)) {
    color = [(0, _utils.get)(color, 0), (0, _utils.get)(color, 1), (0, _utils.get)(color, 2), (0, _utils.get)(color, 3)];
  }
  color[3] = Number.isFinite(color[3]) ? color[3] : 255;
  return color;
}

var DEFAULT_COLOR = [0, 0, 0, 255]; // Black

// This class is set up to allow querying one attribute at a time
// the way the AttributeManager expects it

var PolygonTesselator = exports.PolygonTesselator = function () {
  function PolygonTesselator(_ref) {
    var polygons = _ref.polygons,
        _ref$fp = _ref.fp64,
        fp64 = _ref$fp === undefined ? false : _ref$fp;

    _classCallCheck(this, PolygonTesselator);

    // Normalize all polygons
    this.polygons = polygons.map(function (polygon) {
      return Polygon.normalize(polygon);
    });
    // Count all polygon vertices
    this.pointCount = getPointCount(this.polygons);
    this.fp64 = fp64;
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

      return calculatePositions({ polygons: polygons, pointCount: pointCount, fp64: this.fp64 });
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
  return polygons.reduce(function (points, polygon) {
    return points + Polygon.getVertexCount(polygon);
  }, 0);
}

// COunt number of triangles in a list of complex polygons
function getTriangleCount(polygons) {
  return polygons.reduce(function (triangles, polygon) {
    return triangles + Polygon.getTriangleCount(polygon);
  }, 0);
}

// Returns the offsets of each complex polygon in the combined array of all polygons
function getPolygonOffsets(polygons) {
  var offsets = new Array((0, _utils.count)(polygons) + 1);
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
  if ((0, _utils.count)(complexPolygon) > 1) {
    var polygonStartIndex = 0;
    holeIndices = [];
    complexPolygon.forEach(function (polygon) {
      polygonStartIndex += (0, _utils.count)(polygon);
      holeIndices.push(polygonStartIndex);
    });
    // Last element points to end of the flat array, remove it
    holeIndices.pop();
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

// TODO - refactor
function isContainer(value) {
  return Array.isArray(value) || ArrayBuffer.isView(value) || value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
}

// TODO - refactor, this file should not need a separate flatten func
// Flattens nested array of vertices, padding third coordinate as needed
function flattenVertices2(nestedArray) {
  var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref4$result = _ref4.result,
      result = _ref4$result === undefined ? [] : _ref4$result,
      _ref4$dimensions = _ref4.dimensions,
      dimensions = _ref4$dimensions === undefined ? 3 : _ref4$dimensions;

  var index = -1;
  var vertexLength = 0;
  var length = (0, _utils.count)(nestedArray);
  while (++index < length) {
    var value = (0, _utils.get)(nestedArray, index);
    if (isContainer(value)) {
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
      pointCount = _ref5.pointCount,
      fp64 = _ref5.fp64;

  // Flatten out all the vertices of all the sub subPolygons
  var attribute = new Float32Array(pointCount * 3);
  var attributeLow = void 0;
  if (fp64) {
    // We only need x, y component
    attributeLow = new Float32Array(pointCount * 2);
  }
  var i = 0;
  var j = 0;
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = polygons[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var polygon = _step2.value;

      Polygon.forEachVertex(polygon, function (vertex) {
        // eslint-disable-line
        var x = (0, _utils.get)(vertex, 0);
        var y = (0, _utils.get)(vertex, 1);
        var z = (0, _utils.get)(vertex, 2) || 0;
        attribute[i++] = x;
        attribute[i++] = y;
        attribute[i++] = z;
        if (fp64) {
          attributeLow[j++] = (0, _fp.fp64ify)(x)[1];
          attributeLow[j++] = (0, _fp.fp64ify)(y)[1];
        }
      });
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

  return { positions: attribute, positions64xyLow: attributeLow };
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
    color = parseColor(color);

    var vertexCount = Polygon.getVertexCount(complexPolygon);
    (0, _utils.fillArray)({ target: attribute, source: color, start: i, count: vertexCount });
    i += color.length * vertexCount;
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
    var vertexCount = Polygon.getVertexCount(complexPolygon);
    (0, _utils.fillArray)({ target: attribute, source: color, start: i, count: vertexCount });
    i += color.length * vertexCount;
  });
  return attribute;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24tdGVzc2VsYXRvci5qcyJdLCJuYW1lcyI6WyJmbGF0dGVuVmVydGljZXMyIiwiUG9seWdvbiIsImdldFBpY2tpbmdDb2xvciIsImluZGV4IiwiTWF0aCIsImZsb29yIiwicGFyc2VDb2xvciIsImNvbG9yIiwiQXJyYXkiLCJpc0FycmF5IiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJERUZBVUxUX0NPTE9SIiwiUG9seWdvblRlc3NlbGF0b3IiLCJwb2x5Z29ucyIsImZwNjQiLCJtYXAiLCJub3JtYWxpemUiLCJwb2x5Z29uIiwicG9pbnRDb3VudCIsImdldFBvaW50Q291bnQiLCJpbmRleENvdW50IiwiY2FsY3VsYXRlSW5kaWNlcyIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsImNhbGN1bGF0ZU5vcm1hbHMiLCJnZXRDb2xvciIsImNhbGN1bGF0ZUNvbG9ycyIsImNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMiLCJyZWR1Y2UiLCJwb2ludHMiLCJnZXRWZXJ0ZXhDb3VudCIsImdldFRyaWFuZ2xlQ291bnQiLCJ0cmlhbmdsZXMiLCJnZXRQb2x5Z29uT2Zmc2V0cyIsIm9mZnNldHMiLCJvZmZzZXQiLCJmb3JFYWNoIiwiaSIsImdldEhvbGVJbmRpY2VzIiwiY29tcGxleFBvbHlnb24iLCJob2xlSW5kaWNlcyIsInBvbHlnb25TdGFydEluZGV4IiwicHVzaCIsInBvcCIsIkluZGV4VHlwZSIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJFcnJvciIsImF0dHJpYnV0ZSIsInBvbHlnb25JbmRleCIsImNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzIiwidmVydHMiLCJpc0NvbnRhaW5lciIsInZhbHVlIiwiQXJyYXlCdWZmZXIiLCJpc1ZpZXciLCJuZXN0ZWRBcnJheSIsInJlc3VsdCIsImRpbWVuc2lvbnMiLCJ2ZXJ0ZXhMZW5ndGgiLCJsZW5ndGgiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGVMb3ciLCJqIiwiZm9yRWFjaFZlcnRleCIsIngiLCJ2ZXJ0ZXgiLCJ5IiwieiIsInBvc2l0aW9ucyIsInBvc2l0aW9uczY0eHlMb3ciLCJ0YXJnZXQiLCJzb3VyY2UiLCJzdGFydCIsIlVpbnQ4QXJyYXkiLCJ2ZXJ0ZXhDb3VudCIsImNvdW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7cWpCQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztRQXdKZ0JBLGdCLEdBQUFBLGdCOztBQXZKaEI7O0lBQVlDLE87O0FBQ1o7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQTtBQUNBLFNBQVNDLGVBQVQsQ0FBeUJDLEtBQXpCLEVBQWdDO0FBQzlCLFNBQU8sQ0FDTCxDQUFDQSxRQUFRLENBQVQsSUFBYyxHQURULEVBRUxDLEtBQUtDLEtBQUwsQ0FBVyxDQUFDRixRQUFRLENBQVQsSUFBYyxHQUF6QixJQUFnQyxHQUYzQixFQUdMQyxLQUFLQyxLQUFMLENBQVcsQ0FBQ0YsUUFBUSxDQUFULElBQWMsR0FBZCxHQUFvQixHQUEvQixJQUFzQyxHQUhqQyxDQUFQO0FBS0Q7O0FBRUQsU0FBU0csVUFBVCxDQUFvQkMsS0FBcEIsRUFBMkI7QUFDekIsTUFBSSxDQUFDQyxNQUFNQyxPQUFOLENBQWNGLEtBQWQsQ0FBTCxFQUEyQjtBQUN6QkEsWUFBUSxDQUFDLGdCQUFJQSxLQUFKLEVBQVcsQ0FBWCxDQUFELEVBQWdCLGdCQUFJQSxLQUFKLEVBQVcsQ0FBWCxDQUFoQixFQUErQixnQkFBSUEsS0FBSixFQUFXLENBQVgsQ0FBL0IsRUFBOEMsZ0JBQUlBLEtBQUosRUFBVyxDQUFYLENBQTlDLENBQVI7QUFDRDtBQUNEQSxRQUFNLENBQU4sSUFBV0csT0FBT0MsUUFBUCxDQUFnQkosTUFBTSxDQUFOLENBQWhCLElBQTRCQSxNQUFNLENBQU4sQ0FBNUIsR0FBdUMsR0FBbEQ7QUFDQSxTQUFPQSxLQUFQO0FBQ0Q7O0FBRUQsSUFBTUssZ0JBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsR0FBVixDQUF0QixDLENBQXNDOztBQUV0QztBQUNBOztJQUNhQyxpQixXQUFBQSxpQjtBQUNYLG1DQUFzQztBQUFBLFFBQXpCQyxRQUF5QixRQUF6QkEsUUFBeUI7QUFBQSx1QkFBZkMsSUFBZTtBQUFBLFFBQWZBLElBQWUsMkJBQVIsS0FBUTs7QUFBQTs7QUFDcEM7QUFDQSxTQUFLRCxRQUFMLEdBQWdCQSxTQUFTRSxHQUFULENBQWE7QUFBQSxhQUFXZixRQUFRZ0IsU0FBUixDQUFrQkMsT0FBbEIsQ0FBWDtBQUFBLEtBQWIsQ0FBaEI7QUFDQTtBQUNBLFNBQUtDLFVBQUwsR0FBa0JDLGNBQWMsS0FBS04sUUFBbkIsQ0FBbEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFDRDs7Ozs4QkFFUztBQUFBLFVBQ0RELFFBREMsR0FDdUIsSUFEdkIsQ0FDREEsUUFEQztBQUFBLFVBQ1NPLFVBRFQsR0FDdUIsSUFEdkIsQ0FDU0EsVUFEVDs7QUFFUixhQUFPQyxpQkFBaUIsRUFBQ1Isa0JBQUQsRUFBV08sc0JBQVgsRUFBakIsQ0FBUDtBQUNEOzs7Z0NBRVc7QUFBQSxVQUNIUCxRQURHLEdBQ3FCLElBRHJCLENBQ0hBLFFBREc7QUFBQSxVQUNPSyxVQURQLEdBQ3FCLElBRHJCLENBQ09BLFVBRFA7O0FBRVYsYUFBT0ksbUJBQW1CLEVBQUNULGtCQUFELEVBQVdLLHNCQUFYLEVBQXVCSixNQUFNLEtBQUtBLElBQWxDLEVBQW5CLENBQVA7QUFDRDs7OzhCQUVTO0FBQUEsVUFDREQsUUFEQyxHQUN1QixJQUR2QixDQUNEQSxRQURDO0FBQUEsVUFDU0ssVUFEVCxHQUN1QixJQUR2QixDQUNTQSxVQURUOztBQUVSLGFBQU9LLGlCQUFpQixFQUFDVixrQkFBRCxFQUFXSyxzQkFBWCxFQUFqQixDQUFQO0FBQ0Q7Ozs2QkFFNEM7QUFBQSxzRkFBSixFQUFJO0FBQUEsaUNBQXJDTSxRQUFxQztBQUFBLFVBQXJDQSxRQUFxQyxrQ0FBMUI7QUFBQSxlQUFLYixhQUFMO0FBQUEsT0FBMEI7O0FBQUEsVUFDcENFLFFBRG9DLEdBQ1osSUFEWSxDQUNwQ0EsUUFEb0M7QUFBQSxVQUMxQkssVUFEMEIsR0FDWixJQURZLENBQzFCQSxVQUQwQjs7QUFFM0MsYUFBT08sZ0JBQWdCLEVBQUNaLGtCQUFELEVBQVdLLHNCQUFYLEVBQXVCTSxrQkFBdkIsRUFBaEIsQ0FBUDtBQUNEOzs7b0NBRWU7QUFBQSxVQUNQWCxRQURPLEdBQ2lCLElBRGpCLENBQ1BBLFFBRE87QUFBQSxVQUNHSyxVQURILEdBQ2lCLElBRGpCLENBQ0dBLFVBREg7O0FBRWQsYUFBT1EsdUJBQXVCLEVBQUNiLGtCQUFELEVBQVdLLHNCQUFYLEVBQXZCLENBQVA7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQUdGOzs7QUFDQSxTQUFTQyxhQUFULENBQXVCTixRQUF2QixFQUFpQztBQUMvQixTQUFPQSxTQUFTYyxNQUFULENBQWdCLFVBQUNDLE1BQUQsRUFBU1gsT0FBVDtBQUFBLFdBQXFCVyxTQUFTNUIsUUFBUTZCLGNBQVIsQ0FBdUJaLE9BQXZCLENBQTlCO0FBQUEsR0FBaEIsRUFBK0UsQ0FBL0UsQ0FBUDtBQUNEOztBQUVEO0FBQ0EsU0FBU2EsZ0JBQVQsQ0FBMEJqQixRQUExQixFQUFvQztBQUNsQyxTQUFPQSxTQUFTYyxNQUFULENBQWdCLFVBQUNJLFNBQUQsRUFBWWQsT0FBWjtBQUFBLFdBQXdCYyxZQUFZL0IsUUFBUThCLGdCQUFSLENBQXlCYixPQUF6QixDQUFwQztBQUFBLEdBQWhCLEVBQXVGLENBQXZGLENBQVA7QUFDRDs7QUFFRDtBQUNBLFNBQVNlLGlCQUFULENBQTJCbkIsUUFBM0IsRUFBcUM7QUFDbkMsTUFBTW9CLFVBQVUsSUFBSTFCLEtBQUosQ0FBVSxrQkFBTU0sUUFBTixJQUFrQixDQUE1QixDQUFoQjtBQUNBb0IsVUFBUSxDQUFSLElBQWEsQ0FBYjtBQUNBLE1BQUlDLFNBQVMsQ0FBYjtBQUNBckIsV0FBU3NCLE9BQVQsQ0FBaUIsVUFBQ2xCLE9BQUQsRUFBVW1CLENBQVYsRUFBZ0I7QUFDL0JGLGNBQVVsQyxRQUFRNkIsY0FBUixDQUF1QlosT0FBdkIsQ0FBVjtBQUNBZ0IsWUFBUUcsSUFBSSxDQUFaLElBQWlCRixNQUFqQjtBQUNELEdBSEQ7QUFJQSxTQUFPRCxPQUFQO0FBQ0Q7O0FBRUQ7QUFDQSxTQUFTSSxjQUFULENBQXdCQyxjQUF4QixFQUF3QztBQUN0QyxNQUFJQyxjQUFjLElBQWxCO0FBQ0EsTUFBSSxrQkFBTUQsY0FBTixJQUF3QixDQUE1QixFQUErQjtBQUM3QixRQUFJRSxvQkFBb0IsQ0FBeEI7QUFDQUQsa0JBQWMsRUFBZDtBQUNBRCxtQkFBZUgsT0FBZixDQUF1QixtQkFBVztBQUNoQ0ssMkJBQXFCLGtCQUFNdkIsT0FBTixDQUFyQjtBQUNBc0Isa0JBQVlFLElBQVosQ0FBaUJELGlCQUFqQjtBQUNELEtBSEQ7QUFJQTtBQUNBRCxnQkFBWUcsR0FBWjtBQUNEO0FBQ0QsU0FBT0gsV0FBUDtBQUNEOztBQUVELFNBQVNsQixnQkFBVCxRQUErRDtBQUFBLE1BQXBDUixRQUFvQyxTQUFwQ0EsUUFBb0M7QUFBQSw4QkFBMUI4QixTQUEwQjtBQUFBLE1BQTFCQSxTQUEwQixtQ0FBZEMsV0FBYzs7QUFDN0Q7QUFDQSxNQUFNeEIsYUFBYSxJQUFJVSxpQkFBaUJqQixRQUFqQixDQUF2QjtBQUNBLE1BQU1vQixVQUFVRCxrQkFBa0JuQixRQUFsQixDQUFoQjs7QUFFQTtBQUNBO0FBQ0EsTUFBSThCLGNBQWNFLFdBQWQsSUFBNkJ6QixhQUFhLEtBQTlDLEVBQXFEO0FBQ25ELFVBQU0sSUFBSTBCLEtBQUosQ0FBVSx1Q0FBVixDQUFOO0FBQ0Q7QUFDRCxNQUFNQyxZQUFZLElBQUlKLFNBQUosQ0FBY3ZCLFVBQWQsQ0FBbEI7O0FBRUE7QUFDQTtBQUNBLE1BQUlnQixJQUFJLENBQVI7QUFDQXZCLFdBQVNzQixPQUFULENBQWlCLFVBQUNsQixPQUFELEVBQVUrQixZQUFWLEVBQTJCO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQzFDLDJCQUFvQkMsd0JBQXdCaEMsT0FBeEIsQ0FBcEIsOEhBQXNEO0FBQUEsWUFBM0NmLEtBQTJDOztBQUNwRDZDLGtCQUFVWCxHQUFWLElBQWlCbEMsUUFBUStCLFFBQVFlLFlBQVIsQ0FBekI7QUFDRDtBQUh5QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBSTNDLEdBSkQ7O0FBTUEsU0FBT0QsU0FBUDtBQUNEOztBQUVEOzs7Ozs7QUFNQSxTQUFTRSx1QkFBVCxDQUFpQ1gsY0FBakMsRUFBaUQ7QUFDL0M7QUFDQSxNQUFNQyxjQUFjRixlQUFlQyxjQUFmLENBQXBCO0FBQ0E7QUFDQSxNQUFNWSxRQUFRbkQsaUJBQWlCdUMsY0FBakIsQ0FBZDtBQUNBO0FBQ0EsU0FBTyxzQkFBT1ksS0FBUCxFQUFjWCxXQUFkLEVBQTJCLENBQTNCLENBQVA7QUFDRDs7QUFFRDtBQUNBLFNBQVNZLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCO0FBQzFCLFNBQU83QyxNQUFNQyxPQUFOLENBQWM0QyxLQUFkLEtBQXdCQyxZQUFZQyxNQUFaLENBQW1CRixLQUFuQixDQUF4QixJQUNMQSxVQUFVLElBQVYsSUFBa0IsUUFBT0EsS0FBUCx5Q0FBT0EsS0FBUCxPQUFpQixRQURyQztBQUVEOztBQUVEO0FBQ0E7QUFDTyxTQUFTckQsZ0JBQVQsQ0FBMEJ3RCxXQUExQixFQUEyRTtBQUFBLGtGQUFKLEVBQUk7QUFBQSwyQkFBbkNDLE1BQW1DO0FBQUEsTUFBbkNBLE1BQW1DLGdDQUExQixFQUEwQjtBQUFBLCtCQUF0QkMsVUFBc0I7QUFBQSxNQUF0QkEsVUFBc0Isb0NBQVQsQ0FBUzs7QUFDaEYsTUFBSXZELFFBQVEsQ0FBQyxDQUFiO0FBQ0EsTUFBSXdELGVBQWUsQ0FBbkI7QUFDQSxNQUFNQyxTQUFTLGtCQUFNSixXQUFOLENBQWY7QUFDQSxTQUFPLEVBQUVyRCxLQUFGLEdBQVV5RCxNQUFqQixFQUF5QjtBQUN2QixRQUFNUCxRQUFRLGdCQUFJRyxXQUFKLEVBQWlCckQsS0FBakIsQ0FBZDtBQUNBLFFBQUlpRCxZQUFZQyxLQUFaLENBQUosRUFBd0I7QUFDdEIsa0NBQWdCQSxLQUFoQixFQUF1QixFQUFDSSxjQUFELEVBQVNDLHNCQUFULEVBQXZCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsVUFBSUMsZUFBZUQsVUFBbkIsRUFBK0I7QUFBRTtBQUMvQkQsZUFBT2YsSUFBUCxDQUFZVyxLQUFaO0FBQ0FNO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Q7QUFDQSxNQUFJQSxlQUFlLENBQWYsSUFBb0JBLGVBQWVELFVBQXZDLEVBQW1EO0FBQ2pERCxXQUFPZixJQUFQLENBQVksQ0FBWjtBQUNEO0FBQ0QsU0FBT2UsTUFBUDtBQUNEOztBQUVELFNBQVNsQyxrQkFBVCxRQUEwRDtBQUFBLE1BQTdCVCxRQUE2QixTQUE3QkEsUUFBNkI7QUFBQSxNQUFuQkssVUFBbUIsU0FBbkJBLFVBQW1CO0FBQUEsTUFBUEosSUFBTyxTQUFQQSxJQUFPOztBQUN4RDtBQUNBLE1BQU1pQyxZQUFZLElBQUlhLFlBQUosQ0FBaUIxQyxhQUFhLENBQTlCLENBQWxCO0FBQ0EsTUFBSTJDLHFCQUFKO0FBQ0EsTUFBSS9DLElBQUosRUFBVTtBQUNSO0FBQ0ErQyxtQkFBZSxJQUFJRCxZQUFKLENBQWlCMUMsYUFBYSxDQUE5QixDQUFmO0FBQ0Q7QUFDRCxNQUFJa0IsSUFBSSxDQUFSO0FBQ0EsTUFBSTBCLElBQUksQ0FBUjtBQVR3RDtBQUFBO0FBQUE7O0FBQUE7QUFVeEQsMEJBQXNCakQsUUFBdEIsbUlBQWdDO0FBQUEsVUFBckJJLE9BQXFCOztBQUM5QmpCLGNBQVErRCxhQUFSLENBQXNCOUMsT0FBdEIsRUFBK0Isa0JBQVU7QUFBRTtBQUN6QyxZQUFNK0MsSUFBSSxnQkFBSUMsTUFBSixFQUFZLENBQVosQ0FBVjtBQUNBLFlBQU1DLElBQUksZ0JBQUlELE1BQUosRUFBWSxDQUFaLENBQVY7QUFDQSxZQUFNRSxJQUFJLGdCQUFJRixNQUFKLEVBQVksQ0FBWixLQUFrQixDQUE1QjtBQUNBbEIsa0JBQVVYLEdBQVYsSUFBaUI0QixDQUFqQjtBQUNBakIsa0JBQVVYLEdBQVYsSUFBaUI4QixDQUFqQjtBQUNBbkIsa0JBQVVYLEdBQVYsSUFBaUIrQixDQUFqQjtBQUNBLFlBQUlyRCxJQUFKLEVBQVU7QUFDUitDLHVCQUFhQyxHQUFiLElBQW9CLGlCQUFRRSxDQUFSLEVBQVcsQ0FBWCxDQUFwQjtBQUNBSCx1QkFBYUMsR0FBYixJQUFvQixpQkFBUUksQ0FBUixFQUFXLENBQVgsQ0FBcEI7QUFDRDtBQUNGLE9BWEQ7QUFZRDtBQXZCdUQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUF3QnhELFNBQU8sRUFBQ0UsV0FBV3JCLFNBQVosRUFBdUJzQixrQkFBa0JSLFlBQXpDLEVBQVA7QUFDRDs7QUFFRCxTQUFTdEMsZ0JBQVQsUUFBa0Q7QUFBQSxNQUF2QlYsUUFBdUIsU0FBdkJBLFFBQXVCO0FBQUEsTUFBYkssVUFBYSxTQUFiQSxVQUFhOztBQUNoRDtBQUNBLE1BQU02QixZQUFZLElBQUlhLFlBQUosQ0FBaUIxQyxhQUFhLENBQTlCLENBQWxCO0FBQ0Esd0JBQVUsRUFBQ29ELFFBQVF2QixTQUFULEVBQW9Cd0IsUUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUE1QixFQUF1Q0MsT0FBTyxDQUE5QyxFQUFpRHRELHNCQUFqRCxFQUFWO0FBQ0EsU0FBTzZCLFNBQVA7QUFDRDs7QUFFRCxTQUFTdEIsZUFBVCxRQUEyRDtBQUFBLE1BQWpDWixRQUFpQyxTQUFqQ0EsUUFBaUM7QUFBQSxNQUF2QkssVUFBdUIsU0FBdkJBLFVBQXVCO0FBQUEsTUFBWE0sUUFBVyxTQUFYQSxRQUFXOztBQUN6RCxNQUFNdUIsWUFBWSxJQUFJMEIsVUFBSixDQUFldkQsYUFBYSxDQUE1QixDQUFsQjtBQUNBLE1BQUlrQixJQUFJLENBQVI7QUFDQXZCLFdBQVNzQixPQUFULENBQWlCLFVBQUNHLGNBQUQsRUFBaUJVLFlBQWpCLEVBQWtDO0FBQ2pEO0FBQ0EsUUFBSTFDLFFBQVFrQixTQUFTd0IsWUFBVCxDQUFaO0FBQ0ExQyxZQUFRRCxXQUFXQyxLQUFYLENBQVI7O0FBRUEsUUFBTW9FLGNBQWMxRSxRQUFRNkIsY0FBUixDQUF1QlMsY0FBdkIsQ0FBcEI7QUFDQSwwQkFBVSxFQUFDZ0MsUUFBUXZCLFNBQVQsRUFBb0J3QixRQUFRakUsS0FBNUIsRUFBbUNrRSxPQUFPcEMsQ0FBMUMsRUFBNkN1QyxPQUFPRCxXQUFwRCxFQUFWO0FBQ0F0QyxTQUFLOUIsTUFBTXFELE1BQU4sR0FBZWUsV0FBcEI7QUFDRCxHQVJEO0FBU0EsU0FBTzNCLFNBQVA7QUFDRDs7QUFFRCxTQUFTckIsc0JBQVQsUUFBd0Q7QUFBQSxNQUF2QmIsUUFBdUIsU0FBdkJBLFFBQXVCO0FBQUEsTUFBYkssVUFBYSxTQUFiQSxVQUFhOztBQUN0RCxNQUFNNkIsWUFBWSxJQUFJMEIsVUFBSixDQUFldkQsYUFBYSxDQUE1QixDQUFsQjtBQUNBLE1BQUlrQixJQUFJLENBQVI7QUFDQXZCLFdBQVNzQixPQUFULENBQWlCLFVBQUNHLGNBQUQsRUFBaUJVLFlBQWpCLEVBQWtDO0FBQ2pELFFBQU0xQyxRQUFRTCxnQkFBZ0IrQyxZQUFoQixDQUFkO0FBQ0EsUUFBTTBCLGNBQWMxRSxRQUFRNkIsY0FBUixDQUF1QlMsY0FBdkIsQ0FBcEI7QUFDQSwwQkFBVSxFQUFDZ0MsUUFBUXZCLFNBQVQsRUFBb0J3QixRQUFRakUsS0FBNUIsRUFBbUNrRSxPQUFPcEMsQ0FBMUMsRUFBNkN1QyxPQUFPRCxXQUFwRCxFQUFWO0FBQ0F0QyxTQUFLOUIsTUFBTXFELE1BQU4sR0FBZWUsV0FBcEI7QUFDRCxHQUxEO0FBTUEsU0FBTzNCLFNBQVA7QUFDRCIsImZpbGUiOiJwb2x5Z29uLXRlc3NlbGF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBIYW5kbGVzIHRlc3NlbGF0aW9uIG9mIHBvbHlnb25zIHdpdGggaG9sZXNcbi8vIC0gMkQgc3VyZmFjZXNcbi8vIC0gMkQgb3V0bGluZXNcbi8vIC0gM0Qgc3VyZmFjZXMgKHRvcCBhbmQgc2lkZXMgb25seSlcbi8vIC0gM0Qgd2lyZWZyYW1lcyAobm90IHlldClcbmltcG9ydCAqIGFzIFBvbHlnb24gZnJvbSAnLi9wb2x5Z29uJztcbmltcG9ydCBlYXJjdXQgZnJvbSAnZWFyY3V0JztcbmltcG9ydCB7Z2V0LCBjb3VudCwgZmxhdHRlblZlcnRpY2VzLCBmaWxsQXJyYXl9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscyc7XG5pbXBvcnQge2ZwNjRpZnl9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscy9mcDY0JztcblxuLy8gTWF5YmUgZGVjay5nbCBvciBsdW1hLmdsIG5lZWRzIHRvIGV4cG9ydCB0aGlzXG5mdW5jdGlvbiBnZXRQaWNraW5nQ29sb3IoaW5kZXgpIHtcbiAgcmV0dXJuIFtcbiAgICAoaW5kZXggKyAxKSAlIDI1NixcbiAgICBNYXRoLmZsb29yKChpbmRleCArIDEpIC8gMjU2KSAlIDI1NixcbiAgICBNYXRoLmZsb29yKChpbmRleCArIDEpIC8gMjU2IC8gMjU2KSAlIDI1NlxuICBdO1xufVxuXG5mdW5jdGlvbiBwYXJzZUNvbG9yKGNvbG9yKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShjb2xvcikpIHtcbiAgICBjb2xvciA9IFtnZXQoY29sb3IsIDApLCBnZXQoY29sb3IsIDEpLCBnZXQoY29sb3IsIDIpLCBnZXQoY29sb3IsIDMpXTtcbiAgfVxuICBjb2xvclszXSA9IE51bWJlci5pc0Zpbml0ZShjb2xvclszXSkgPyBjb2xvclszXSA6IDI1NTtcbiAgcmV0dXJuIGNvbG9yO1xufVxuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzAsIDAsIDAsIDI1NV07IC8vIEJsYWNrXG5cbi8vIFRoaXMgY2xhc3MgaXMgc2V0IHVwIHRvIGFsbG93IHF1ZXJ5aW5nIG9uZSBhdHRyaWJ1dGUgYXQgYSB0aW1lXG4vLyB0aGUgd2F5IHRoZSBBdHRyaWJ1dGVNYW5hZ2VyIGV4cGVjdHMgaXRcbmV4cG9ydCBjbGFzcyBQb2x5Z29uVGVzc2VsYXRvciB7XG4gIGNvbnN0cnVjdG9yKHtwb2x5Z29ucywgZnA2NCA9IGZhbHNlfSkge1xuICAgIC8vIE5vcm1hbGl6ZSBhbGwgcG9seWdvbnNcbiAgICB0aGlzLnBvbHlnb25zID0gcG9seWdvbnMubWFwKHBvbHlnb24gPT4gUG9seWdvbi5ub3JtYWxpemUocG9seWdvbikpO1xuICAgIC8vIENvdW50IGFsbCBwb2x5Z29uIHZlcnRpY2VzXG4gICAgdGhpcy5wb2ludENvdW50ID0gZ2V0UG9pbnRDb3VudCh0aGlzLnBvbHlnb25zKTtcbiAgICB0aGlzLmZwNjQgPSBmcDY0O1xuICB9XG5cbiAgaW5kaWNlcygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIGluZGV4Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlSW5kaWNlcyh7cG9seWdvbnMsIGluZGV4Q291bnR9KTtcbiAgfVxuXG4gIHBvc2l0aW9ucygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlUG9zaXRpb25zKHtwb2x5Z29ucywgcG9pbnRDb3VudCwgZnA2NDogdGhpcy5mcDY0fSk7XG4gIH1cblxuICBub3JtYWxzKCkge1xuICAgIGNvbnN0IHtwb2x5Z29ucywgcG9pbnRDb3VudH0gPSB0aGlzO1xuICAgIHJldHVybiBjYWxjdWxhdGVOb3JtYWxzKHtwb2x5Z29ucywgcG9pbnRDb3VudH0pO1xuICB9XG5cbiAgY29sb3JzKHtnZXRDb2xvciA9IHggPT4gREVGQVVMVF9DT0xPUn0gPSB7fSkge1xuICAgIGNvbnN0IHtwb2x5Z29ucywgcG9pbnRDb3VudH0gPSB0aGlzO1xuICAgIHJldHVybiBjYWxjdWxhdGVDb2xvcnMoe3BvbHlnb25zLCBwb2ludENvdW50LCBnZXRDb2xvcn0pO1xuICB9XG5cbiAgcGlja2luZ0NvbG9ycygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlUGlja2luZ0NvbG9ycyh7cG9seWdvbnMsIHBvaW50Q291bnR9KTtcbiAgfVxuXG4gIC8vIGdldEF0dHJpYnV0ZSh7c2l6ZSwgYWNjZXNzb3J9KSB7XG4gIC8vICAgY29uc3Qge3BvbHlnb25zLCBwb2ludENvdW50fSA9IHRoaXM7XG4gIC8vICAgcmV0dXJuIGNhbGN1bGF0ZUF0dHJpYnV0ZSh7cG9seWdvbnMsIHBvaW50Q291bnQsIHNpemUsIGFjY2Vzc29yfSk7XG4gIC8vIH1cbn1cblxuLy8gQ291bnQgbnVtYmVyIG9mIHBvaW50cyBpbiBhIGxpc3Qgb2YgY29tcGxleCBwb2x5Z29uc1xuZnVuY3Rpb24gZ2V0UG9pbnRDb3VudChwb2x5Z29ucykge1xuICByZXR1cm4gcG9seWdvbnMucmVkdWNlKChwb2ludHMsIHBvbHlnb24pID0+IHBvaW50cyArIFBvbHlnb24uZ2V0VmVydGV4Q291bnQocG9seWdvbiksIDApO1xufVxuXG4vLyBDT3VudCBudW1iZXIgb2YgdHJpYW5nbGVzIGluIGEgbGlzdCBvZiBjb21wbGV4IHBvbHlnb25zXG5mdW5jdGlvbiBnZXRUcmlhbmdsZUNvdW50KHBvbHlnb25zKSB7XG4gIHJldHVybiBwb2x5Z29ucy5yZWR1Y2UoKHRyaWFuZ2xlcywgcG9seWdvbikgPT4gdHJpYW5nbGVzICsgUG9seWdvbi5nZXRUcmlhbmdsZUNvdW50KHBvbHlnb24pLCAwKTtcbn1cblxuLy8gUmV0dXJucyB0aGUgb2Zmc2V0cyBvZiBlYWNoIGNvbXBsZXggcG9seWdvbiBpbiB0aGUgY29tYmluZWQgYXJyYXkgb2YgYWxsIHBvbHlnb25zXG5mdW5jdGlvbiBnZXRQb2x5Z29uT2Zmc2V0cyhwb2x5Z29ucykge1xuICBjb25zdCBvZmZzZXRzID0gbmV3IEFycmF5KGNvdW50KHBvbHlnb25zKSArIDEpO1xuICBvZmZzZXRzWzBdID0gMDtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIHBvbHlnb25zLmZvckVhY2goKHBvbHlnb24sIGkpID0+IHtcbiAgICBvZmZzZXQgKz0gUG9seWdvbi5nZXRWZXJ0ZXhDb3VudChwb2x5Z29uKTtcbiAgICBvZmZzZXRzW2kgKyAxXSA9IG9mZnNldDtcbiAgfSk7XG4gIHJldHVybiBvZmZzZXRzO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBvZmZzZXQgb2YgZWFjaCBob2xlIHBvbHlnb24gaW4gdGhlIGZsYXR0ZW5lZCBhcnJheSBmb3IgdGhhdCBwb2x5Z29uXG5mdW5jdGlvbiBnZXRIb2xlSW5kaWNlcyhjb21wbGV4UG9seWdvbikge1xuICBsZXQgaG9sZUluZGljZXMgPSBudWxsO1xuICBpZiAoY291bnQoY29tcGxleFBvbHlnb24pID4gMSkge1xuICAgIGxldCBwb2x5Z29uU3RhcnRJbmRleCA9IDA7XG4gICAgaG9sZUluZGljZXMgPSBbXTtcbiAgICBjb21wbGV4UG9seWdvbi5mb3JFYWNoKHBvbHlnb24gPT4ge1xuICAgICAgcG9seWdvblN0YXJ0SW5kZXggKz0gY291bnQocG9seWdvbik7XG4gICAgICBob2xlSW5kaWNlcy5wdXNoKHBvbHlnb25TdGFydEluZGV4KTtcbiAgICB9KTtcbiAgICAvLyBMYXN0IGVsZW1lbnQgcG9pbnRzIHRvIGVuZCBvZiB0aGUgZmxhdCBhcnJheSwgcmVtb3ZlIGl0XG4gICAgaG9sZUluZGljZXMucG9wKCk7XG4gIH1cbiAgcmV0dXJuIGhvbGVJbmRpY2VzO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVJbmRpY2VzKHtwb2x5Z29ucywgSW5kZXhUeXBlID0gVWludDMyQXJyYXl9KSB7XG4gIC8vIENhbGN1bGF0ZSBsZW5ndGggb2YgaW5kZXggYXJyYXkgKDMgKiBudW1iZXIgb2YgdHJpYW5nbGVzKVxuICBjb25zdCBpbmRleENvdW50ID0gMyAqIGdldFRyaWFuZ2xlQ291bnQocG9seWdvbnMpO1xuICBjb25zdCBvZmZzZXRzID0gZ2V0UG9seWdvbk9mZnNldHMocG9seWdvbnMpO1xuXG4gIC8vIEFsbG9jYXRlIHRoZSBhdHRyaWJ1dGVcbiAgLy8gVE9ETyBpdCdzIG5vdCB0aGUgaW5kZXggY291bnQgYnV0IHRoZSB2ZXJ0ZXggY291bnQgdGhhdCBtdXN0IGJlIGNoZWNrZWRcbiAgaWYgKEluZGV4VHlwZSA9PT0gVWludDE2QXJyYXkgJiYgaW5kZXhDb3VudCA+IDY1NTM1KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdWZXJ0ZXggY291bnQgZXhjZWVkcyBicm93c2VyXFwncyBsaW1pdCcpO1xuICB9XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBJbmRleFR5cGUoaW5kZXhDb3VudCk7XG5cbiAgLy8gMS4gZ2V0IHRyaWFuZ3VsYXRlZCBpbmRpY2VzIGZvciB0aGUgaW50ZXJuYWwgYXJlYXNcbiAgLy8gMi4gb2Zmc2V0IHRoZW0gYnkgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHByZXZpb3VzIHBvbHlnb25zXG4gIGxldCBpID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgocG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgZm9yIChjb25zdCBpbmRleCBvZiBjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyhwb2x5Z29uKSkge1xuICAgICAgYXR0cmlidXRlW2krK10gPSBpbmRleCArIG9mZnNldHNbcG9seWdvbkluZGV4XTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG5cbi8qXG4gKiBHZXQgdmVydGV4IGluZGljZXMgZm9yIGRyYXdpbmcgY29tcGxleFBvbHlnb24gbWVzaFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7W051bWJlcixOdW1iZXIsTnVtYmVyXVtdW119IGNvbXBsZXhQb2x5Z29uXG4gKiBAcmV0dXJucyB7W051bWJlcl19IGluZGljZXNcbiAqL1xuZnVuY3Rpb24gY2FsY3VsYXRlU3VyZmFjZUluZGljZXMoY29tcGxleFBvbHlnb24pIHtcbiAgLy8gUHJlcGFyZSBhbiBhcnJheSBvZiBob2xlIGluZGljZXMgYXMgZXhwZWN0ZWQgYnkgZWFyY3V0XG4gIGNvbnN0IGhvbGVJbmRpY2VzID0gZ2V0SG9sZUluZGljZXMoY29tcGxleFBvbHlnb24pO1xuICAvLyBGbGF0dGVuIHRoZSBwb2x5Z29uIGFzIGV4cGVjdGVkIGJ5IGVhcmN1dFxuICBjb25zdCB2ZXJ0cyA9IGZsYXR0ZW5WZXJ0aWNlczIoY29tcGxleFBvbHlnb24pO1xuICAvLyBMZXQgZWFyY3V0IHRyaWFuZ3VsYXRlIHRoZSBwb2x5Z29uXG4gIHJldHVybiBlYXJjdXQodmVydHMsIGhvbGVJbmRpY2VzLCAzKTtcbn1cblxuLy8gVE9ETyAtIHJlZmFjdG9yXG5mdW5jdGlvbiBpc0NvbnRhaW5lcih2YWx1ZSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSB8fFxuICAgIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59XG5cbi8vIFRPRE8gLSByZWZhY3RvciwgdGhpcyBmaWxlIHNob3VsZCBub3QgbmVlZCBhIHNlcGFyYXRlIGZsYXR0ZW4gZnVuY1xuLy8gRmxhdHRlbnMgbmVzdGVkIGFycmF5IG9mIHZlcnRpY2VzLCBwYWRkaW5nIHRoaXJkIGNvb3JkaW5hdGUgYXMgbmVlZGVkXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlblZlcnRpY2VzMihuZXN0ZWRBcnJheSwge3Jlc3VsdCA9IFtdLCBkaW1lbnNpb25zID0gM30gPSB7fSkge1xuICBsZXQgaW5kZXggPSAtMTtcbiAgbGV0IHZlcnRleExlbmd0aCA9IDA7XG4gIGNvbnN0IGxlbmd0aCA9IGNvdW50KG5lc3RlZEFycmF5KTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGdldChuZXN0ZWRBcnJheSwgaW5kZXgpO1xuICAgIGlmIChpc0NvbnRhaW5lcih2YWx1ZSkpIHtcbiAgICAgIGZsYXR0ZW5WZXJ0aWNlcyh2YWx1ZSwge3Jlc3VsdCwgZGltZW5zaW9uc30pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodmVydGV4TGVuZ3RoIDwgZGltZW5zaW9ucykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgdmVydGV4TGVuZ3RoKys7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIEFkZCBhIHRoaXJkIGNvb3JkaW5hdGUgaWYgbmVlZGVkXG4gIGlmICh2ZXJ0ZXhMZW5ndGggPiAwICYmIHZlcnRleExlbmd0aCA8IGRpbWVuc2lvbnMpIHtcbiAgICByZXN1bHQucHVzaCgwKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVQb3NpdGlvbnMoe3BvbHlnb25zLCBwb2ludENvdW50LCBmcDY0fSkge1xuICAvLyBGbGF0dGVuIG91dCBhbGwgdGhlIHZlcnRpY2VzIG9mIGFsbCB0aGUgc3ViIHN1YlBvbHlnb25zXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRDb3VudCAqIDMpO1xuICBsZXQgYXR0cmlidXRlTG93O1xuICBpZiAoZnA2NCkge1xuICAgIC8vIFdlIG9ubHkgbmVlZCB4LCB5IGNvbXBvbmVudFxuICAgIGF0dHJpYnV0ZUxvdyA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRDb3VudCAqIDIpO1xuICB9XG4gIGxldCBpID0gMDtcbiAgbGV0IGogPSAwO1xuICBmb3IgKGNvbnN0IHBvbHlnb24gb2YgcG9seWdvbnMpIHtcbiAgICBQb2x5Z29uLmZvckVhY2hWZXJ0ZXgocG9seWdvbiwgdmVydGV4ID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgY29uc3QgeCA9IGdldCh2ZXJ0ZXgsIDApO1xuICAgICAgY29uc3QgeSA9IGdldCh2ZXJ0ZXgsIDEpO1xuICAgICAgY29uc3QgeiA9IGdldCh2ZXJ0ZXgsIDIpIHx8IDA7XG4gICAgICBhdHRyaWJ1dGVbaSsrXSA9IHg7XG4gICAgICBhdHRyaWJ1dGVbaSsrXSA9IHk7XG4gICAgICBhdHRyaWJ1dGVbaSsrXSA9IHo7XG4gICAgICBpZiAoZnA2NCkge1xuICAgICAgICBhdHRyaWJ1dGVMb3dbaisrXSA9IGZwNjRpZnkoeClbMV07XG4gICAgICAgIGF0dHJpYnV0ZUxvd1tqKytdID0gZnA2NGlmeSh5KVsxXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4ge3Bvc2l0aW9uczogYXR0cmlidXRlLCBwb3NpdGlvbnM2NHh5TG93OiBhdHRyaWJ1dGVMb3d9O1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVOb3JtYWxzKHtwb2x5Z29ucywgcG9pbnRDb3VudH0pIHtcbiAgLy8gVE9ETyAtIHVzZSBnZW5lcmljIHZlcnRleCBhdHRyaWJ1dGU/XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRDb3VudCAqIDMpO1xuICBmaWxsQXJyYXkoe3RhcmdldDogYXR0cmlidXRlLCBzb3VyY2U6IFswLCAxLCAwXSwgc3RhcnQ6IDAsIHBvaW50Q291bnR9KTtcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlQ29sb3JzKHtwb2x5Z29ucywgcG9pbnRDb3VudCwgZ2V0Q29sb3J9KSB7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBVaW50OEFycmF5KHBvaW50Q291bnQgKiA0KTtcbiAgbGV0IGkgPSAwO1xuICBwb2x5Z29ucy5mb3JFYWNoKChjb21wbGV4UG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgLy8gQ2FsY3VsYXRlIHBvbHlnb24gY29sb3JcbiAgICBsZXQgY29sb3IgPSBnZXRDb2xvcihwb2x5Z29uSW5kZXgpO1xuICAgIGNvbG9yID0gcGFyc2VDb2xvcihjb2xvcik7XG5cbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IFBvbHlnb24uZ2V0VmVydGV4Q291bnQoY29tcGxleFBvbHlnb24pO1xuICAgIGZpbGxBcnJheSh7dGFyZ2V0OiBhdHRyaWJ1dGUsIHNvdXJjZTogY29sb3IsIHN0YXJ0OiBpLCBjb3VudDogdmVydGV4Q291bnR9KTtcbiAgICBpICs9IGNvbG9yLmxlbmd0aCAqIHZlcnRleENvdW50O1xuICB9KTtcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlUGlja2luZ0NvbG9ycyh7cG9seWdvbnMsIHBvaW50Q291bnR9KSB7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBVaW50OEFycmF5KHBvaW50Q291bnQgKiAzKTtcbiAgbGV0IGkgPSAwO1xuICBwb2x5Z29ucy5mb3JFYWNoKChjb21wbGV4UG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgY29uc3QgY29sb3IgPSBnZXRQaWNraW5nQ29sb3IocG9seWdvbkluZGV4KTtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IFBvbHlnb24uZ2V0VmVydGV4Q291bnQoY29tcGxleFBvbHlnb24pO1xuICAgIGZpbGxBcnJheSh7dGFyZ2V0OiBhdHRyaWJ1dGUsIHNvdXJjZTogY29sb3IsIHN0YXJ0OiBpLCBjb3VudDogdmVydGV4Q291bnR9KTtcbiAgICBpICs9IGNvbG9yLmxlbmd0aCAqIHZlcnRleENvdW50O1xuICB9KTtcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn1cbiJdfQ==
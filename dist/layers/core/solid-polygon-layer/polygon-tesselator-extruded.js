'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PolygonTesselatorExtruded = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _polygon = require('./polygon');

var Polygon = _interopRequireWildcard(_polygon);

var _glMatrix = require('gl-matrix');

var _fp = require('../../../lib/utils/fp64');

var _utils = require('../../../lib/utils');

var _earcut = require('earcut');

var _earcut2 = _interopRequireDefault(_earcut);

var _lodash = require('lodash.flattendeep');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var PolygonTesselatorExtruded = exports.PolygonTesselatorExtruded = function () {
  function PolygonTesselatorExtruded(_ref) {
    var polygons = _ref.polygons,
        _ref$getHeight = _ref.getHeight,
        getHeight = _ref$getHeight === undefined ? function (x) {
      return 1000;
    } : _ref$getHeight,
        _ref$getColor = _ref.getColor,
        getColor = _ref$getColor === undefined ? function (x) {
      return [0, 0, 0, 255];
    } : _ref$getColor,
        _ref$wireframe = _ref.wireframe,
        wireframe = _ref$wireframe === undefined ? false : _ref$wireframe,
        _ref$fp = _ref.fp64,
        fp64 = _ref$fp === undefined ? false : _ref$fp;

    _classCallCheck(this, PolygonTesselatorExtruded);

    this.fp64 = fp64;

    // Expensive operation, convert all polygons to arrays
    polygons = polygons.map(function (complexPolygon, polygonIndex) {
      var height = getHeight(polygonIndex) || 0;
      return Polygon.normalize(complexPolygon).map(function (polygon) {
        return polygon.map(function (coord) {
          return [(0, _utils.get)(coord, 0), (0, _utils.get)(coord, 1), height];
        });
      });
    });

    var groupedVertices = polygons;
    this.groupedVertices = polygons;
    this.wireframe = wireframe;

    this.attributes = {};

    var positionsJS = calculatePositionsJS({ groupedVertices: groupedVertices, wireframe: wireframe });
    Object.assign(this.attributes, {
      positions: calculatePositions(positionsJS, this.fp64),
      indices: calculateIndices({ groupedVertices: groupedVertices, wireframe: wireframe }),
      normals: calculateNormals({ groupedVertices: groupedVertices, wireframe: wireframe }),
      // colors: calculateColors({groupedVertices, wireframe, getColor}),
      pickingColors: calculatePickingColors({ groupedVertices: groupedVertices, wireframe: wireframe })
    });
  }

  _createClass(PolygonTesselatorExtruded, [{
    key: 'indices',
    value: function indices() {
      return this.attributes.indices;
    }
  }, {
    key: 'positions',
    value: function positions() {
      return this.attributes.positions;
    }
  }, {
    key: 'normals',
    value: function normals() {
      return this.attributes.normals;
    }
  }, {
    key: 'colors',
    value: function colors() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$getColor = _ref2.getColor,
          getColor = _ref2$getColor === undefined ? function (x) {
        return DEFAULT_COLOR;
      } : _ref2$getColor;

      var groupedVertices = this.groupedVertices,
          wireframe = this.wireframe;

      return calculateColors({ groupedVertices: groupedVertices, wireframe: wireframe, getColor: getColor });
    }
  }, {
    key: 'pickingColors',
    value: function pickingColors() {
      return this.attributes.pickingColors;
    }

    // updateTriggers: {
    //   positions: ['getHeight'],
    //   colors: ['getColors']
    //   pickingColors: 'none'
    // }

  }]);

  return PolygonTesselatorExtruded;
}();

function countVertices(vertices) {
  return vertices.reduce(function (vertexCount, polygon) {
    return vertexCount + (0, _utils.count)(polygon);
  }, 0);
}

function calculateIndices(_ref3) {
  var groupedVertices = _ref3.groupedVertices,
      _ref3$wireframe = _ref3.wireframe,
      wireframe = _ref3$wireframe === undefined ? false : _ref3$wireframe;

  // adjust index offset for multiple polygons
  var multiplier = wireframe ? 2 : 5;
  var offsets = groupedVertices.reduce(function (acc, vertices) {
    return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + countVertices(vertices) * multiplier]);
  }, [0]);

  var indices = groupedVertices.map(function (vertices, polygonIndex) {
    return wireframe ?
    // 1. get sequentially ordered indices of each polygons wireframe
    // 2. offset them by the number of indices in previous polygons
    calculateContourIndices(vertices, offsets[polygonIndex]) :
    // 1. get triangulated indices for the internal areas
    // 2. offset them by the number of indices in previous polygons
    calculateSurfaceIndices(vertices, offsets[polygonIndex]);
  });

  return new Uint32Array((0, _lodash2.default)(indices));
}

// Calculate a flat position array in JS - can be mapped to 32 or 64 bit typed arrays
// Remarks:
// * each top vertex is on 3 surfaces
// * each bottom vertex is on 2 surfaces
function calculatePositionsJS(_ref4) {
  var groupedVertices = _ref4.groupedVertices,
      _ref4$wireframe = _ref4.wireframe,
      wireframe = _ref4$wireframe === undefined ? false : _ref4$wireframe;

  var positions = groupedVertices.map(function (complexPolygon) {
    return complexPolygon.map(function (vertices) {
      var topVertices = [].concat(vertices);
      var baseVertices = topVertices.map(function (v) {
        return [(0, _utils.get)(v, 0), (0, _utils.get)(v, 1), 0];
      });
      return wireframe ? [topVertices, baseVertices] : [topVertices, topVertices, topVertices, baseVertices, baseVertices];
    });
  });
  return (0, _lodash2.default)(positions);
}

function calculatePositions(positionsJS, fp64) {
  var positionLow = void 0;
  if (fp64) {
    // We only need x, y component
    positionLow = new Float32Array(positionsJS.length / 3 * 2);
    for (var i = 0; i < positionsJS.length / 3; i++) {
      positionLow[i * 2 + 0] = (0, _fp.fp64ify)(positionsJS[i * 3 + 0])[1];
      positionLow[i * 2 + 1] = (0, _fp.fp64ify)(positionsJS[i * 3 + 1])[1];
    }
  }
  return { positions: new Float32Array(positionsJS), positions64xyLow: positionLow };
}

function calculateNormals(_ref5) {
  var groupedVertices = _ref5.groupedVertices,
      wireframe = _ref5.wireframe;

  var up = [0, 1, 0];

  var normals = groupedVertices.map(function (vertices, polygonIndex) {
    var topNormals = new Array(countVertices(vertices)).fill(up);
    var sideNormals = vertices.map(function (polygon) {
      return calculateSideNormals(polygon);
    });
    var sideNormalsForward = sideNormals.map(function (n) {
      return n[0];
    });
    var sideNormalsBackward = sideNormals.map(function (n) {
      return n[1];
    });

    return wireframe ? [topNormals, topNormals] : [topNormals, sideNormalsForward, sideNormalsBackward, sideNormalsForward, sideNormalsBackward];
  });

  return new Float32Array((0, _lodash2.default)(normals));
}

function calculateSideNormals(vertices) {
  var normals = [];

  var lastVertice = null;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = vertices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var vertice = _step.value;

      if (lastVertice) {
        // vertex[i-1], vertex[i]
        var n = getNormal(lastVertice, vertice);
        normals.push(n);
      }
      lastVertice = vertice;
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

  return [[].concat(normals, [normals[0]]), [normals[0]].concat(normals)];
}

function calculateColors(_ref6) {
  var groupedVertices = _ref6.groupedVertices,
      getColor = _ref6.getColor,
      _ref6$wireframe = _ref6.wireframe,
      wireframe = _ref6$wireframe === undefined ? false : _ref6$wireframe;

  var colors = groupedVertices.map(function (complexPolygon, polygonIndex) {
    var color = getColor(polygonIndex);
    color = parseColor(color);

    var numVertices = countVertices(complexPolygon);
    var topColors = new Array(numVertices).fill(color);
    var baseColors = new Array(numVertices).fill(color);
    return wireframe ? [topColors, baseColors] : [topColors, topColors, topColors, baseColors, baseColors];
  });
  return new Uint8ClampedArray((0, _lodash2.default)(colors));
}

function calculatePickingColors(_ref7) {
  var groupedVertices = _ref7.groupedVertices,
      _ref7$wireframe = _ref7.wireframe,
      wireframe = _ref7$wireframe === undefined ? false : _ref7$wireframe;

  var colors = groupedVertices.map(function (vertices, polygonIndex) {
    var numVertices = countVertices(vertices);
    var color = getPickingColor(polygonIndex);
    var topColors = new Array(numVertices).fill(color);
    var baseColors = new Array(numVertices).fill(color);
    return wireframe ? [topColors, baseColors] : [topColors, topColors, topColors, baseColors, baseColors];
  });
  return new Uint8ClampedArray((0, _lodash2.default)(colors));
}

function calculateContourIndices(vertices, offset) {
  var stride = countVertices(vertices);

  return vertices.map(function (polygon) {
    var indices = [offset];
    var numVertices = polygon.length;

    // polygon top
    // use vertex pairs for GL.LINES => [0, 1, 1, 2, 2, ..., n-1, n-1, 0]
    for (var i = 1; i < numVertices - 1; i++) {
      indices.push(i + offset, i + offset);
    }
    indices.push(offset);

    // polygon sides
    for (var _i = 0; _i < numVertices - 1; _i++) {
      indices.push(_i + offset, _i + stride + offset);
    }

    offset += numVertices;
    return indices;
  });
}

function calculateSurfaceIndices(vertices, offset) {
  var stride = countVertices(vertices);
  var quad = [[0, 1], [0, 3], [1, 2], [1, 2], [0, 3], [1, 4]];

  function drawRectangle(i) {
    return quad.map(function (v) {
      return i + v[0] + stride * v[1] + offset;
    });
  }

  var holes = null;

  if (vertices.length > 1) {
    holes = vertices.reduce(function (acc, polygon) {
      return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + polygon.length]);
    }, [0]).slice(1, vertices.length);
  }

  var topIndices = (0, _earcut2.default)((0, _lodash2.default)(vertices), holes, 3).map(function (index) {
    return index + offset;
  });

  var sideIndices = vertices.map(function (polygon) {
    var numVertices = polygon.length;
    // polygon top
    var indices = [];

    // polygon sides
    for (var i = 0; i < numVertices - 1; i++) {
      indices.push.apply(indices, _toConsumableArray(drawRectangle(i)));
    }

    offset += numVertices;
    return indices;
  });

  return [topIndices, sideIndices];
}

// helpers

// get normal vector of line segment
function getNormal(p1, p2) {
  var p1x = (0, _utils.get)(p1, 0);
  var p1y = (0, _utils.get)(p1, 1);
  var p2x = (0, _utils.get)(p2, 0);
  var p2y = (0, _utils.get)(p2, 1);

  if (p1x === p2x && p1y === p2y) {
    return [1, 0, 0];
  }

  var degrees2radians = Math.PI / 180;
  var lon1 = degrees2radians * p1x;
  var lon2 = degrees2radians * p2x;
  var lat1 = degrees2radians * p1y;
  var lat2 = degrees2radians * p2y;
  var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
  var b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return _glMatrix.vec3.normalize([], [b, 0, -a]);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24tdGVzc2VsYXRvci1leHRydWRlZC5qcyJdLCJuYW1lcyI6WyJQb2x5Z29uIiwiZ2V0UGlja2luZ0NvbG9yIiwiaW5kZXgiLCJNYXRoIiwiZmxvb3IiLCJwYXJzZUNvbG9yIiwiY29sb3IiLCJBcnJheSIsImlzQXJyYXkiLCJOdW1iZXIiLCJpc0Zpbml0ZSIsIkRFRkFVTFRfQ09MT1IiLCJQb2x5Z29uVGVzc2VsYXRvckV4dHJ1ZGVkIiwicG9seWdvbnMiLCJnZXRIZWlnaHQiLCJnZXRDb2xvciIsIndpcmVmcmFtZSIsImZwNjQiLCJtYXAiLCJjb21wbGV4UG9seWdvbiIsInBvbHlnb25JbmRleCIsImhlaWdodCIsIm5vcm1hbGl6ZSIsInBvbHlnb24iLCJjb29yZCIsImdyb3VwZWRWZXJ0aWNlcyIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbnNKUyIsImNhbGN1bGF0ZVBvc2l0aW9uc0pTIiwiT2JqZWN0IiwiYXNzaWduIiwicG9zaXRpb25zIiwiY2FsY3VsYXRlUG9zaXRpb25zIiwiaW5kaWNlcyIsImNhbGN1bGF0ZUluZGljZXMiLCJub3JtYWxzIiwiY2FsY3VsYXRlTm9ybWFscyIsInBpY2tpbmdDb2xvcnMiLCJjYWxjdWxhdGVQaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlQ29sb3JzIiwiY291bnRWZXJ0aWNlcyIsInZlcnRpY2VzIiwicmVkdWNlIiwidmVydGV4Q291bnQiLCJtdWx0aXBsaWVyIiwib2Zmc2V0cyIsImFjYyIsImxlbmd0aCIsImNhbGN1bGF0ZUNvbnRvdXJJbmRpY2VzIiwiY2FsY3VsYXRlU3VyZmFjZUluZGljZXMiLCJVaW50MzJBcnJheSIsInRvcFZlcnRpY2VzIiwiY29uY2F0IiwiYmFzZVZlcnRpY2VzIiwidiIsInBvc2l0aW9uTG93IiwiRmxvYXQzMkFycmF5IiwiaSIsInBvc2l0aW9uczY0eHlMb3ciLCJ1cCIsInRvcE5vcm1hbHMiLCJmaWxsIiwic2lkZU5vcm1hbHMiLCJjYWxjdWxhdGVTaWRlTm9ybWFscyIsInNpZGVOb3JtYWxzRm9yd2FyZCIsIm4iLCJzaWRlTm9ybWFsc0JhY2t3YXJkIiwibGFzdFZlcnRpY2UiLCJ2ZXJ0aWNlIiwiZ2V0Tm9ybWFsIiwicHVzaCIsImNvbG9ycyIsIm51bVZlcnRpY2VzIiwidG9wQ29sb3JzIiwiYmFzZUNvbG9ycyIsIlVpbnQ4Q2xhbXBlZEFycmF5Iiwib2Zmc2V0Iiwic3RyaWRlIiwicXVhZCIsImRyYXdSZWN0YW5nbGUiLCJob2xlcyIsInNsaWNlIiwidG9wSW5kaWNlcyIsInNpZGVJbmRpY2VzIiwicDEiLCJwMiIsInAxeCIsInAxeSIsInAyeCIsInAyeSIsImRlZ3JlZXMycmFkaWFucyIsIlBJIiwibG9uMSIsImxvbjIiLCJsYXQxIiwibGF0MiIsImEiLCJzaW4iLCJjb3MiLCJiIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7QUFDWjs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxlQUFULENBQXlCQyxLQUF6QixFQUFnQztBQUM5QixTQUFPLENBQ0wsQ0FBQ0EsUUFBUSxDQUFULElBQWMsR0FEVCxFQUVMQyxLQUFLQyxLQUFMLENBQVcsQ0FBQ0YsUUFBUSxDQUFULElBQWMsR0FBekIsSUFBZ0MsR0FGM0IsRUFHTEMsS0FBS0MsS0FBTCxDQUFXLENBQUNGLFFBQVEsQ0FBVCxJQUFjLEdBQWQsR0FBb0IsR0FBL0IsSUFBc0MsR0FIakMsQ0FBUDtBQUtEOztBQUVELFNBQVNHLFVBQVQsQ0FBb0JDLEtBQXBCLEVBQTJCO0FBQ3pCLE1BQUksQ0FBQ0MsTUFBTUMsT0FBTixDQUFjRixLQUFkLENBQUwsRUFBMkI7QUFDekJBLFlBQVEsQ0FBQyxnQkFBSUEsS0FBSixFQUFXLENBQVgsQ0FBRCxFQUFnQixnQkFBSUEsS0FBSixFQUFXLENBQVgsQ0FBaEIsRUFBK0IsZ0JBQUlBLEtBQUosRUFBVyxDQUFYLENBQS9CLEVBQThDLGdCQUFJ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QUFFQSxNQUFJQyxRQUFRRSxHQUFSLElBQWVELFFBQVFFLEdBQTNCLEVBQWdDO0FBQzlCLFdBQU8sQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FBUDtBQUNEOztBQUVELE1BQU1DLGtCQUFrQnZGLEtBQUt3RixFQUFMLEdBQVUsR0FBbEM7QUFDQSxNQUFNQyxPQUFPRixrQkFBa0JKLEdBQS9CO0FBQ0EsTUFBTU8sT0FBT0gsa0JBQWtCRixHQUEvQjtBQUNBLE1BQU1NLE9BQU9KLGtCQUFrQkgsR0FBL0I7QUFDQSxNQUFNUSxPQUFPTCxrQkFBa0JELEdBQS9CO0FBQ0EsTUFBTU8sSUFBSTdGLEtBQUs4RixHQUFMLENBQVNKLE9BQU9ELElBQWhCLElBQXdCekYsS0FBSytGLEdBQUwsQ0FBU0gsSUFBVCxDQUFsQztBQUNBLE1BQU1JLElBQUloRyxLQUFLK0YsR0FBTCxDQUFTSixJQUFULElBQWlCM0YsS0FBSzhGLEdBQUwsQ0FBU0YsSUFBVCxDQUFqQixHQUNSNUYsS0FBSzhGLEdBQUwsQ0FBU0gsSUFBVCxJQUFpQjNGLEtBQUsrRixHQUFMLENBQVNILElBQVQsQ0FBakIsR0FBa0M1RixLQUFLK0YsR0FBTCxDQUFTTCxPQUFPRCxJQUFoQixDQURwQztBQUVBLFNBQU8sZUFBS3RFLFNBQUwsQ0FBZSxFQUFmLEVBQW1CLENBQUM2RSxDQUFELEVBQUksQ0FBSixFQUFPLENBQUNILENBQVIsQ0FBbkIsQ0FBUDtBQUNEIiwiZmlsZSI6InBvbHlnb24tdGVzc2VsYXRvci1leHRydWRlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFBvbHlnb24gZnJvbSAnLi9wb2x5Z29uJztcbmltcG9ydCB7dmVjM30gZnJvbSAnZ2wtbWF0cml4JztcbmltcG9ydCB7ZnA2NGlmeX0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzL2ZwNjQnO1xuaW1wb3J0IHtnZXQsIGNvdW50fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuaW1wb3J0IGVhcmN1dCBmcm9tICdlYXJjdXQnO1xuaW1wb3J0IGZsYXR0ZW5EZWVwIGZyb20gJ2xvZGFzaC5mbGF0dGVuZGVlcCc7XG5cbmZ1bmN0aW9uIGdldFBpY2tpbmdDb2xvcihpbmRleCkge1xuICByZXR1cm4gW1xuICAgIChpbmRleCArIDEpICUgMjU2LFxuICAgIE1hdGguZmxvb3IoKGluZGV4ICsgMSkgLyAyNTYpICUgMjU2LFxuICAgIE1hdGguZmxvb3IoKGluZGV4ICsgMSkgLyAyNTYgLyAyNTYpICUgMjU2XG4gIF07XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ29sb3IoY29sb3IpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNvbG9yKSkge1xuICAgIGNvbG9yID0gW2dldChjb2xvciwgMCksIGdldChjb2xvciwgMSksIGdldChjb2xvciwgMiksIGdldChjb2xvciwgMyldO1xuICB9XG4gIGNvbG9yWzNdID0gTnVtYmVyLmlzRmluaXRlKGNvbG9yWzNdKSA/IGNvbG9yWzNdIDogMjU1O1xuICByZXR1cm4gY29sb3I7XG59XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTsgLy8gQmxhY2tcblxuZXhwb3J0IGNsYXNzIFBvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWQge1xuXG4gIGNvbnN0cnVjdG9yKHtcbiAgICBwb2x5Z29ucyxcbiAgICBnZXRIZWlnaHQgPSB4ID0+IDEwMDAsXG4gICAgZ2V0Q29sb3IgPSB4ID0+IFswLCAwLCAwLCAyNTVdLFxuICAgIHdpcmVmcmFtZSA9IGZhbHNlLFxuICAgIGZwNjQgPSBmYWxzZVxuICB9KSB7XG4gICAgdGhpcy5mcDY0ID0gZnA2NDtcblxuICAgIC8vIEV4cGVuc2l2ZSBvcGVyYXRpb24sIGNvbnZlcnQgYWxsIHBvbHlnb25zIHRvIGFycmF5c1xuICAgIHBvbHlnb25zID0gcG9seWdvbnMubWFwKChjb21wbGV4UG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgICBjb25zdCBoZWlnaHQgPSBnZXRIZWlnaHQocG9seWdvbkluZGV4KSB8fCAwO1xuICAgICAgcmV0dXJuIFBvbHlnb24ubm9ybWFsaXplKGNvbXBsZXhQb2x5Z29uKS5tYXAoXG4gICAgICAgIHBvbHlnb24gPT4gcG9seWdvbi5tYXAoY29vcmQgPT4gW2dldChjb29yZCwgMCksIGdldChjb29yZCwgMSksIGhlaWdodF0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZ3JvdXBlZFZlcnRpY2VzID0gcG9seWdvbnM7XG4gICAgdGhpcy5ncm91cGVkVmVydGljZXMgPSBwb2x5Z29ucztcbiAgICB0aGlzLndpcmVmcmFtZSA9IHdpcmVmcmFtZTtcblxuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgY29uc3QgcG9zaXRpb25zSlMgPSBjYWxjdWxhdGVQb3NpdGlvbnNKUyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWV9KTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywge1xuICAgICAgcG9zaXRpb25zOiBjYWxjdWxhdGVQb3NpdGlvbnMocG9zaXRpb25zSlMsIHRoaXMuZnA2NCksXG4gICAgICBpbmRpY2VzOiBjYWxjdWxhdGVJbmRpY2VzKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZX0pLFxuICAgICAgbm9ybWFsczogY2FsY3VsYXRlTm9ybWFscyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWV9KSxcbiAgICAgIC8vIGNvbG9yczogY2FsY3VsYXRlQ29sb3JzKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZSwgZ2V0Q29sb3J9KSxcbiAgICAgIHBpY2tpbmdDb2xvcnM6IGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoe2dyb3VwZWRWZXJ0aWNlcywgd2lyZWZyYW1lfSlcbiAgICB9KTtcbiAgfVxuXG4gIGluZGljZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5pbmRpY2VzO1xuICB9XG5cbiAgcG9zaXRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMucG9zaXRpb25zO1xuICB9XG5cbiAgbm9ybWFscygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLm5vcm1hbHM7XG4gIH1cblxuICBjb2xvcnMoe2dldENvbG9yID0geCA9PiBERUZBVUxUX0NPTE9SfSA9IHt9KSB7XG4gICAgY29uc3Qge2dyb3VwZWRWZXJ0aWNlcywgd2lyZWZyYW1lfSA9IHRoaXM7XG4gICAgcmV0dXJuIGNhbGN1bGF0ZUNvbG9ycyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWUsIGdldENvbG9yfSk7XG4gIH1cblxuICBwaWNraW5nQ29sb3JzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMucGlja2luZ0NvbG9ycztcbiAgfVxuXG4gIC8vIHVwZGF0ZVRyaWdnZXJzOiB7XG4gIC8vICAgcG9zaXRpb25zOiBbJ2dldEhlaWdodCddLFxuICAvLyAgIGNvbG9yczogWydnZXRDb2xvcnMnXVxuICAvLyAgIHBpY2tpbmdDb2xvcnM6ICdub25lJ1xuICAvLyB9XG59XG5cbmZ1bmN0aW9uIGNvdW50VmVydGljZXModmVydGljZXMpIHtcbiAgcmV0dXJuIHZlcnRpY2VzLnJlZHVjZSgodmVydGV4Q291bnQsIHBvbHlnb24pID0+IHZlcnRleENvdW50ICsgY291bnQocG9seWdvbiksIDApO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVJbmRpY2VzKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZSA9IGZhbHNlfSkge1xuICAvLyBhZGp1c3QgaW5kZXggb2Zmc2V0IGZvciBtdWx0aXBsZSBwb2x5Z29uc1xuICBjb25zdCBtdWx0aXBsaWVyID0gd2lyZWZyYW1lID8gMiA6IDU7XG4gIGNvbnN0IG9mZnNldHMgPSBncm91cGVkVmVydGljZXMucmVkdWNlKFxuICAgIChhY2MsIHZlcnRpY2VzKSA9PlxuICAgICAgWy4uLmFjYywgYWNjW2FjYy5sZW5ndGggLSAxXSArIGNvdW50VmVydGljZXModmVydGljZXMpICogbXVsdGlwbGllcl0sXG4gICAgWzBdXG4gICk7XG5cbiAgY29uc3QgaW5kaWNlcyA9IGdyb3VwZWRWZXJ0aWNlcy5tYXAoKHZlcnRpY2VzLCBwb2x5Z29uSW5kZXgpID0+XG4gICAgd2lyZWZyYW1lID9cbiAgICAgIC8vIDEuIGdldCBzZXF1ZW50aWFsbHkgb3JkZXJlZCBpbmRpY2VzIG9mIGVhY2ggcG9seWdvbnMgd2lyZWZyYW1lXG4gICAgICAvLyAyLiBvZmZzZXQgdGhlbSBieSB0aGUgbnVtYmVyIG9mIGluZGljZXMgaW4gcHJldmlvdXMgcG9seWdvbnNcbiAgICAgIGNhbGN1bGF0ZUNvbnRvdXJJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXRzW3BvbHlnb25JbmRleF0pIDpcbiAgICAgIC8vIDEuIGdldCB0cmlhbmd1bGF0ZWQgaW5kaWNlcyBmb3IgdGhlIGludGVybmFsIGFyZWFzXG4gICAgICAvLyAyLiBvZmZzZXQgdGhlbSBieSB0aGUgbnVtYmVyIG9mIGluZGljZXMgaW4gcHJldmlvdXMgcG9seWdvbnNcbiAgICAgIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXRzW3BvbHlnb25JbmRleF0pXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBVaW50MzJBcnJheShmbGF0dGVuRGVlcChpbmRpY2VzKSk7XG59XG5cbi8vIENhbGN1bGF0ZSBhIGZsYXQgcG9zaXRpb24gYXJyYXkgaW4gSlMgLSBjYW4gYmUgbWFwcGVkIHRvIDMyIG9yIDY0IGJpdCB0eXBlZCBhcnJheXNcbi8vIFJlbWFya3M6XG4vLyAqIGVhY2ggdG9wIHZlcnRleCBpcyBvbiAzIHN1cmZhY2VzXG4vLyAqIGVhY2ggYm90dG9tIHZlcnRleCBpcyBvbiAyIHN1cmZhY2VzXG5mdW5jdGlvbiBjYWxjdWxhdGVQb3NpdGlvbnNKUyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWUgPSBmYWxzZX0pIHtcbiAgY29uc3QgcG9zaXRpb25zID0gZ3JvdXBlZFZlcnRpY2VzLm1hcChjb21wbGV4UG9seWdvbiA9PlxuICAgIGNvbXBsZXhQb2x5Z29uLm1hcCh2ZXJ0aWNlcyA9PiB7XG4gICAgICBjb25zdCB0b3BWZXJ0aWNlcyA9IFtdLmNvbmNhdCh2ZXJ0aWNlcyk7XG4gICAgICBjb25zdCBiYXNlVmVydGljZXMgPSB0b3BWZXJ0aWNlcy5tYXAodiA9PiBbZ2V0KHYsIDApLCBnZXQodiwgMSksIDBdKTtcbiAgICAgIHJldHVybiB3aXJlZnJhbWUgP1xuICAgICAgICBbdG9wVmVydGljZXMsIGJhc2VWZXJ0aWNlc10gOlxuICAgICAgICBbdG9wVmVydGljZXMsIHRvcFZlcnRpY2VzLCB0b3BWZXJ0aWNlcywgYmFzZVZlcnRpY2VzLCBiYXNlVmVydGljZXNdO1xuICAgIH0pXG4gICk7XG4gIHJldHVybiBmbGF0dGVuRGVlcChwb3NpdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVQb3NpdGlvbnMocG9zaXRpb25zSlMsIGZwNjQpIHtcbiAgbGV0IHBvc2l0aW9uTG93O1xuICBpZiAoZnA2NCkge1xuICAgIC8vIFdlIG9ubHkgbmVlZCB4LCB5IGNvbXBvbmVudFxuICAgIHBvc2l0aW9uTG93ID0gbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnNKUy5sZW5ndGggLyAzICogMik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3NpdGlvbnNKUy5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgIHBvc2l0aW9uTG93W2kgKiAyICsgMF0gPSBmcDY0aWZ5KHBvc2l0aW9uc0pTW2kgKiAzICsgMF0pWzFdO1xuICAgICAgcG9zaXRpb25Mb3dbaSAqIDIgKyAxXSA9IGZwNjRpZnkocG9zaXRpb25zSlNbaSAqIDMgKyAxXSlbMV07XG4gICAgfVxuXG4gIH1cbiAgcmV0dXJuIHtwb3NpdGlvbnM6IG5ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zSlMpLCBwb3NpdGlvbnM2NHh5TG93OiBwb3NpdGlvbkxvd307XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZU5vcm1hbHMoe2dyb3VwZWRWZXJ0aWNlcywgd2lyZWZyYW1lfSkge1xuICBjb25zdCB1cCA9IFswLCAxLCAwXTtcblxuICBjb25zdCBub3JtYWxzID0gZ3JvdXBlZFZlcnRpY2VzLm1hcCgodmVydGljZXMsIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIGNvbnN0IHRvcE5vcm1hbHMgPSBuZXcgQXJyYXkoY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcykpLmZpbGwodXApO1xuICAgIGNvbnN0IHNpZGVOb3JtYWxzID0gdmVydGljZXMubWFwKHBvbHlnb24gPT4gY2FsY3VsYXRlU2lkZU5vcm1hbHMocG9seWdvbikpO1xuICAgIGNvbnN0IHNpZGVOb3JtYWxzRm9yd2FyZCA9IHNpZGVOb3JtYWxzLm1hcChuID0+IG5bMF0pO1xuICAgIGNvbnN0IHNpZGVOb3JtYWxzQmFja3dhcmQgPSBzaWRlTm9ybWFscy5tYXAobiA9PiBuWzFdKTtcblxuICAgIHJldHVybiB3aXJlZnJhbWUgP1xuICAgIFt0b3BOb3JtYWxzLCB0b3BOb3JtYWxzXSA6XG4gICAgW3RvcE5vcm1hbHMsIHNpZGVOb3JtYWxzRm9yd2FyZCwgc2lkZU5vcm1hbHNCYWNrd2FyZCwgc2lkZU5vcm1hbHNGb3J3YXJkLCBzaWRlTm9ybWFsc0JhY2t3YXJkXTtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoZmxhdHRlbkRlZXAobm9ybWFscykpO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVTaWRlTm9ybWFscyh2ZXJ0aWNlcykge1xuICBjb25zdCBub3JtYWxzID0gW107XG5cbiAgbGV0IGxhc3RWZXJ0aWNlID0gbnVsbDtcbiAgZm9yIChjb25zdCB2ZXJ0aWNlIG9mIHZlcnRpY2VzKSB7XG4gICAgaWYgKGxhc3RWZXJ0aWNlKSB7XG4gICAgICAvLyB2ZXJ0ZXhbaS0xXSwgdmVydGV4W2ldXG4gICAgICBjb25zdCBuID0gZ2V0Tm9ybWFsKGxhc3RWZXJ0aWNlLCB2ZXJ0aWNlKTtcbiAgICAgIG5vcm1hbHMucHVzaChuKTtcbiAgICB9XG4gICAgbGFzdFZlcnRpY2UgPSB2ZXJ0aWNlO1xuICB9XG5cbiAgcmV0dXJuIFtbLi4ubm9ybWFscywgbm9ybWFsc1swXV0sIFtub3JtYWxzWzBdLCAuLi5ub3JtYWxzXV07XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUNvbG9ycyh7Z3JvdXBlZFZlcnRpY2VzLCBnZXRDb2xvciwgd2lyZWZyYW1lID0gZmFsc2V9KSB7XG4gIGNvbnN0IGNvbG9ycyA9IGdyb3VwZWRWZXJ0aWNlcy5tYXAoKGNvbXBsZXhQb2x5Z29uLCBwb2x5Z29uSW5kZXgpID0+IHtcbiAgICBsZXQgY29sb3IgPSBnZXRDb2xvcihwb2x5Z29uSW5kZXgpO1xuICAgIGNvbG9yID0gcGFyc2VDb2xvcihjb2xvcik7XG5cbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IGNvdW50VmVydGljZXMoY29tcGxleFBvbHlnb24pO1xuICAgIGNvbnN0IHRvcENvbG9ycyA9IG5ldyBBcnJheShudW1WZXJ0aWNlcykuZmlsbChjb2xvcik7XG4gICAgY29uc3QgYmFzZUNvbG9ycyA9IG5ldyBBcnJheShudW1WZXJ0aWNlcykuZmlsbChjb2xvcik7XG4gICAgcmV0dXJuIHdpcmVmcmFtZSA/XG4gICAgICBbdG9wQ29sb3JzLCBiYXNlQ29sb3JzXSA6XG4gICAgICBbdG9wQ29sb3JzLCB0b3BDb2xvcnMsIHRvcENvbG9ycywgYmFzZUNvbG9ycywgYmFzZUNvbG9yc107XG4gIH0pO1xuICByZXR1cm4gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGZsYXR0ZW5EZWVwKGNvbG9ycykpO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVQaWNraW5nQ29sb3JzKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZSA9IGZhbHNlfSkge1xuICBjb25zdCBjb2xvcnMgPSBncm91cGVkVmVydGljZXMubWFwKCh2ZXJ0aWNlcywgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcbiAgICBjb25zdCBjb2xvciA9IGdldFBpY2tpbmdDb2xvcihwb2x5Z29uSW5kZXgpO1xuICAgIGNvbnN0IHRvcENvbG9ycyA9IG5ldyBBcnJheShudW1WZXJ0aWNlcykuZmlsbChjb2xvcik7XG4gICAgY29uc3QgYmFzZUNvbG9ycyA9IG5ldyBBcnJheShudW1WZXJ0aWNlcykuZmlsbChjb2xvcik7XG4gICAgcmV0dXJuIHdpcmVmcmFtZSA/XG4gICAgICBbdG9wQ29sb3JzLCBiYXNlQ29sb3JzXSA6XG4gICAgICBbdG9wQ29sb3JzLCB0b3BDb2xvcnMsIHRvcENvbG9ycywgYmFzZUNvbG9ycywgYmFzZUNvbG9yc107XG4gIH0pO1xuICByZXR1cm4gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGZsYXR0ZW5EZWVwKGNvbG9ycykpO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVDb250b3VySW5kaWNlcyh2ZXJ0aWNlcywgb2Zmc2V0KSB7XG4gIGNvbnN0IHN0cmlkZSA9IGNvdW50VmVydGljZXModmVydGljZXMpO1xuXG4gIHJldHVybiB2ZXJ0aWNlcy5tYXAocG9seWdvbiA9PiB7XG4gICAgY29uc3QgaW5kaWNlcyA9IFtvZmZzZXRdO1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gcG9seWdvbi5sZW5ndGg7XG5cbiAgICAvLyBwb2x5Z29uIHRvcFxuICAgIC8vIHVzZSB2ZXJ0ZXggcGFpcnMgZm9yIEdMLkxJTkVTID0+IFswLCAxLCAxLCAyLCAyLCAuLi4sIG4tMSwgbi0xLCAwXVxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgIGluZGljZXMucHVzaChpICsgb2Zmc2V0LCBpICsgb2Zmc2V0KTtcbiAgICB9XG4gICAgaW5kaWNlcy5wdXNoKG9mZnNldCk7XG5cbiAgICAvLyBwb2x5Z29uIHNpZGVzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1WZXJ0aWNlcyAtIDE7IGkrKykge1xuICAgICAgaW5kaWNlcy5wdXNoKGkgKyBvZmZzZXQsIGkgKyBzdHJpZGUgKyBvZmZzZXQpO1xuICAgIH1cblxuICAgIG9mZnNldCArPSBudW1WZXJ0aWNlcztcbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXQpIHtcbiAgY29uc3Qgc3RyaWRlID0gY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcyk7XG4gIGNvbnN0IHF1YWQgPSBbXG4gICAgWzAsIDFdLCBbMCwgM10sIFsxLCAyXSxcbiAgICBbMSwgMl0sIFswLCAzXSwgWzEsIDRdXG4gIF07XG5cbiAgZnVuY3Rpb24gZHJhd1JlY3RhbmdsZShpKSB7XG4gICAgcmV0dXJuIHF1YWQubWFwKHYgPT4gaSArIHZbMF0gKyBzdHJpZGUgKiB2WzFdICsgb2Zmc2V0KTtcbiAgfVxuXG4gIGxldCBob2xlcyA9IG51bGw7XG5cbiAgaWYgKHZlcnRpY2VzLmxlbmd0aCA+IDEpIHtcbiAgICBob2xlcyA9IHZlcnRpY2VzLnJlZHVjZShcbiAgICAgIChhY2MsIHBvbHlnb24pID0+IFsuLi5hY2MsIGFjY1thY2MubGVuZ3RoIC0gMV0gKyBwb2x5Z29uLmxlbmd0aF0sXG4gICAgICBbMF1cbiAgICApLnNsaWNlKDEsIHZlcnRpY2VzLmxlbmd0aCk7XG4gIH1cblxuICBjb25zdCB0b3BJbmRpY2VzID0gZWFyY3V0KGZsYXR0ZW5EZWVwKHZlcnRpY2VzKSwgaG9sZXMsIDMpLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldCk7XG5cbiAgY29uc3Qgc2lkZUluZGljZXMgPSB2ZXJ0aWNlcy5tYXAocG9seWdvbiA9PiB7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBwb2x5Z29uLmxlbmd0aDtcbiAgICAvLyBwb2x5Z29uIHRvcFxuICAgIGNvbnN0IGluZGljZXMgPSBbXTtcblxuICAgIC8vIHBvbHlnb24gc2lkZXNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVZlcnRpY2VzIC0gMTsgaSsrKSB7XG4gICAgICBpbmRpY2VzLnB1c2goLi4uZHJhd1JlY3RhbmdsZShpKSk7XG4gICAgfVxuXG4gICAgb2Zmc2V0ICs9IG51bVZlcnRpY2VzO1xuICAgIHJldHVybiBpbmRpY2VzO1xuICB9KTtcblxuICByZXR1cm4gW3RvcEluZGljZXMsIHNpZGVJbmRpY2VzXTtcbn1cblxuLy8gaGVscGVyc1xuXG4vLyBnZXQgbm9ybWFsIHZlY3RvciBvZiBsaW5lIHNlZ21lbnRcbmZ1bmN0aW9uIGdldE5vcm1hbChwMSwgcDIpIHtcbiAgY29uc3QgcDF4ID0gZ2V0KHAxLCAwKTtcbiAgY29uc3QgcDF5ID0gZ2V0KHAxLCAxKTtcbiAgY29uc3QgcDJ4ID0gZ2V0KHAyLCAwKTtcbiAgY29uc3QgcDJ5ID0gZ2V0KHAyLCAxKTtcblxuICBpZiAocDF4ID09PSBwMnggJiYgcDF5ID09PSBwMnkpIHtcbiAgICByZXR1cm4gWzEsIDAsIDBdO1xuICB9XG5cbiAgY29uc3QgZGVncmVlczJyYWRpYW5zID0gTWF0aC5QSSAvIDE4MDtcbiAgY29uc3QgbG9uMSA9IGRlZ3JlZXMycmFkaWFucyAqIHAxeDtcbiAgY29uc3QgbG9uMiA9IGRlZ3JlZXMycmFkaWFucyAqIHAyeDtcbiAgY29uc3QgbGF0MSA9IGRlZ3JlZXMycmFkaWFucyAqIHAxeTtcbiAgY29uc3QgbGF0MiA9IGRlZ3JlZXMycmFkaWFucyAqIHAyeTtcbiAgY29uc3QgYSA9IE1hdGguc2luKGxvbjIgLSBsb24xKSAqIE1hdGguY29zKGxhdDIpO1xuICBjb25zdCBiID0gTWF0aC5jb3MobGF0MSkgKiBNYXRoLnNpbihsYXQyKSAtXG4gICAgTWF0aC5zaW4obGF0MSkgKiBNYXRoLmNvcyhsYXQyKSAqIE1hdGguY29zKGxvbjIgLSBsb24xKTtcbiAgcmV0dXJuIHZlYzMubm9ybWFsaXplKFtdLCBbYiwgMCwgLWFdKTtcbn1cbiJdfQ==
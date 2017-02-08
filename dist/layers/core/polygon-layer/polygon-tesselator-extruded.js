'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PolygonTesselatorExtruded = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
// import {getPolygonVertexCount, getPolygonTriangleCount} from './polygon';


var _polygon = require('./polygon');

var Polygon = _interopRequireWildcard(_polygon);

var _earcut = require('earcut');

var _earcut2 = _interopRequireDefault(_earcut);

var _lodash = require('lodash.flattendeep');

var _lodash2 = _interopRequireDefault(_lodash);

var _glMatrix = require('gl-matrix');

var _fp = require('../../../lib/utils/fp64');

var _utils = require('../../../lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import {Container, flattenVertices, fillArray} from '../../../lib/utils';

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

    // Expensive operation, convert all polygons to arrays
    polygons = _utils.Container.map(polygons, function (complexPolygon, polygonIndex) {
      var height = getHeight(polygonIndex) || 0;
      return _utils.Container.map(Polygon.normalize(complexPolygon), function (polygon) {
        return _utils.Container.map(polygon, function (coord) {
          return [coord[0], coord[1], height];
        });
      });
    });

    var groupedVertices = polygons;
    this.groupedVertices = polygons;
    this.wireframe = wireframe;

    var positionsJS = calculatePositionsJS({ groupedVertices: groupedVertices, wireframe: wireframe });

    this.attributes = fp64 ? {
      positions64xy: calculatePositions64xy(positionsJS),
      positions64z: calculatePositions64z(positionsJS)
    } : {
      positions: calculatePositions(positionsJS)
    };

    Object.assign(this.attributes, {
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
    key: 'positions64xy',
    value: function positions64xy() {
      return this.attributes.positions64xy;
    }
  }, {
    key: 'positions64z',
    value: function positions64z() {
      return this.attributes.positions64z;
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
  return vertices.reduce(function (count, polygon) {
    return count + polygon.length;
  }, 0);
}

function calculateIndices(_ref3) {
  var groupedVertices = _ref3.groupedVertices,
      _ref3$wireframe = _ref3.wireframe,
      wireframe = _ref3$wireframe === undefined ? false : _ref3$wireframe;

  // adjust index offset for multiple buildings
  var multiplier = wireframe ? 2 : 5;
  var offsets = groupedVertices.reduce(function (acc, vertices) {
    return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + countVertices(vertices) * multiplier]);
  }, [0]);

  var indices = groupedVertices.map(function (vertices, buildingIndex) {
    return wireframe ?
    // 1. get sequentially ordered indices of each building wireframe
    // 2. offset them by the number of indices in previous buildings
    calculateContourIndices(vertices, offsets[buildingIndex]) :
    // 1. get triangulated indices for the internal areas
    // 2. offset them by the number of indices in previous buildings
    calculateSurfaceIndices(vertices, offsets[buildingIndex]);
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

  var positions = _utils.Container.map(groupedVertices, function (complexPolygon) {
    return _utils.Container.map(complexPolygon, function (vertices) {
      var topVertices = [].concat(vertices);
      var baseVertices = topVertices.map(function (v) {
        return [v[0], v[1], 0];
      });
      return wireframe ? [topVertices, baseVertices] : [topVertices, topVertices, topVertices, baseVertices, baseVertices];
    });
  });
  return (0, _lodash2.default)(positions);
}

function calculatePositions(positionsJS) {
  return new Float32Array(positionsJS);
}

function calculatePositions64xy(positionsJS) {
  var attribute = new Float32Array(positionsJS.length / 3 * 4);
  for (var i = 0; i < positionsJS.length / 3; i++) {
    var _fp64ify = (0, _fp.fp64ify)(positionsJS[i * 3 + 0]);

    var _fp64ify2 = _slicedToArray(_fp64ify, 2);

    attribute[i * 4 + 0] = _fp64ify2[0];
    attribute[i * 4 + 1] = _fp64ify2[1];

    var _fp64ify3 = (0, _fp.fp64ify)(positionsJS[i * 3 + 1]);

    var _fp64ify4 = _slicedToArray(_fp64ify3, 2);

    attribute[i * 4 + 2] = _fp64ify4[0];
    attribute[i * 4 + 3] = _fp64ify4[1];
  }
  return attribute;
}

function calculatePositions64z(positionsJS) {
  var attribute = new Float32Array(positionsJS.length / 3 * 2);
  for (var i = 0; i < positionsJS.length / 3; i++) {
    var _fp64ify5 = (0, _fp.fp64ify)(positionsJS[i * 3 + 2] + 0.1);

    var _fp64ify6 = _slicedToArray(_fp64ify5, 2);

    attribute[i * 2 + 0] = _fp64ify6[0];
    attribute.value[i * 2 + 1] = _fp64ify6[1];
  }
  return attribute;
}

function calculateNormals(_ref5) {
  var groupedVertices = _ref5.groupedVertices,
      wireframe = _ref5.wireframe;

  var up = [0, 1, 0];

  var normals = groupedVertices.map(function (vertices, buildingIndex) {
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
  var numVertices = vertices.length;
  var normals = [];

  for (var i = 0; i < numVertices - 1; i++) {
    var n = getNormal(vertices[i], vertices[i + 1]);
    normals.push(n);
  }

  return [[].concat(normals, [normals[0]]), [normals[0]].concat(normals)];
}

/*
function calculateColors({polygons, pointCount, getColor}) {
  const attribute = new Uint8Array(pointCount * 4);
  let i = 0;
  polygons.forEach((complexPolygon, polygonIndex) => {
    // Calculate polygon color
    const color = getColor(polygonIndex);
    color[3] = Number.isFinite(color[3]) ? color[3] : 255;

    const count = Polygon.getVertexCount(complexPolygon);
    fillArray({target: attribute, source: color, start: i, count});
    i += color.length * count;
  });
  return attribute;
}
*/

function calculateColors(_ref6) {
  var groupedVertices = _ref6.groupedVertices,
      getColor = _ref6.getColor,
      _ref6$wireframe = _ref6.wireframe,
      wireframe = _ref6$wireframe === undefined ? false : _ref6$wireframe;

  var colors = groupedVertices.map(function (complexPolygon, polygonIndex) {
    var color = getColor(polygonIndex);
    color[3] = Number.isFinite(color[3]) ? color[3] : 255;

    // const baseColor = Array.isArray(color) ? color[0] : color;
    // const topColor = Array.isArray(color) ? color[color.length - 1] : color;
    var numVertices = countVertices(complexPolygon);
    var topColors = new Array(numVertices).fill(color);
    var baseColors = new Array(numVertices).fill(color);
    return wireframe ? [topColors, baseColors] : [topColors, topColors, topColors, baseColors, baseColors];
  });
  return new Uint8ClampedArray((0, _lodash2.default)(colors));
}

function calculatePickingColors(_ref7) {
  var groupedVertices = _ref7.groupedVertices,
      _ref7$color = _ref7.color,
      color = _ref7$color === undefined ? [0, 0, 0] : _ref7$color,
      _ref7$wireframe = _ref7.wireframe,
      wireframe = _ref7$wireframe === undefined ? false : _ref7$wireframe;

  var colors = groupedVertices.map(function (vertices, buildingIndex) {
    // const baseColor = Array.isArray(color) ? color[0] : color;
    // const topColor = Array.isArray(color) ? color[color.length - 1] : color;
    var numVertices = countVertices(vertices);
    var topColors = new Array(numVertices).fill([0, 0, 0]);
    var baseColors = new Array(numVertices).fill([0, 0, 0]);
    return wireframe ? [topColors, baseColors] : [topColors, topColors, topColors, baseColors, baseColors];
  });
  return new Uint8ClampedArray((0, _lodash2.default)(colors));
}

function calculateContourIndices(vertices, offset) {
  var stride = countVertices(vertices);

  return vertices.map(function (polygon) {
    var indices = [offset];
    var numVertices = polygon.length;

    // building top
    // use vertex pairs for GL.LINES => [0, 1, 1, 2, 2, ..., n-1, n-1, 0]
    for (var i = 1; i < numVertices - 1; i++) {
      indices.push(i + offset, i + offset);
    }
    indices.push(offset);

    // building sides
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
    // building top
    var indices = [];

    // building sides
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
  if (p1[0] === p2[0] && p1[1] === p2[1]) {
    return [1, 0, 0];
  }

  var degrees2radians = Math.PI / 180;
  var lon1 = degrees2radians * p1[0];
  var lon2 = degrees2radians * p2[0];
  var lat1 = degrees2radians * p1[1];
  var lat2 = degrees2radians * p2[1];
  var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
  var b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return _glMatrix.vec3.normalize([], [b, 0, -a]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wb2x5Z29uLWxheWVyL3BvbHlnb24tdGVzc2VsYXRvci1leHRydWRlZC5qcyJdLCJuYW1lcyI6WyJQb2x5Z29uIiwiREVGQVVMVF9DT0xPUiIsIlBvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWQiLCJwb2x5Z29ucyIsImdldEhlaWdodCIsImdldENvbG9yIiwid2lyZWZyYW1lIiwiZnA2NCIsIm1hcCIsImNvbXBsZXhQb2x5Z29uIiwicG9seWdvbkluZGV4IiwiaGVpZ2h0Iiwibm9ybWFsaXplIiwicG9seWdvbiIsImNvb3JkIiwiZ3JvdXBlZFZlcnRpY2VzIiwicG9zaXRpb25zSlMiLCJjYWxjdWxhdGVQb3NpdGlvbnNKUyIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbnM2NHh5IiwiY2FsY3VsYXRlUG9zaXRpb25zNjR4eSIsInBvc2l0aW9uczY0eiIsImNhbGN1bGF0ZVBvc2l0aW9uczY0eiIsInBvc2l0aW9ucyIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImluZGljZXMiLCJjYWxjdWxhdGVJbmRpY2VzIiwibm9ybWFscyIsImNhbGN1bGF0ZU5vcm1hbHMiLCJwaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsImNhbGN1bGF0ZUNvbG9ycyIsImNvdW50VmVydGljZXMiLCJ2ZXJ0aWNlcyIsInJlZHVjZSIsImNvdW50IiwibGVuZ3RoIiwibXVsdGlwbGllciIsIm9mZnNldHMiLCJhY2MiLCJidWlsZGluZ0luZGV4IiwiY2FsY3VsYXRlQ29udG91ckluZGljZXMiLCJjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyIsIlVpbnQzMkFycmF5IiwidG9wVmVydGljZXMiLCJjb25jYXQiLCJiYXNlVmVydGljZXMiLCJ2IiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlIiwiaSIsInZhbHVlIiwidXAiLCJ0b3BOb3JtYWxzIiwiQXJyYXkiLCJmaWxsIiwic2lkZU5vcm1hbHMiLCJjYWxjdWxhdGVTaWRlTm9ybWFscyIsInNpZGVOb3JtYWxzRm9yd2FyZCIsIm4iLCJzaWRlTm9ybWFsc0JhY2t3YXJkIiwibnVtVmVydGljZXMiLCJnZXROb3JtYWwiLCJwdXNoIiwiY29sb3JzIiwiY29sb3IiLCJOdW1iZXIiLCJpc0Zpbml0ZSIsInRvcENvbG9ycyIsImJhc2VDb2xvcnMiLCJVaW50OENsYW1wZWRBcnJheSIsIm9mZnNldCIsInN0cmlkZSIsInF1YWQiLCJkcmF3UmVjdGFuZ2xlIiwiaG9sZXMiLCJzbGljZSIsInRvcEluZGljZXMiLCJpbmRleCIsInNpZGVJbmRpY2VzIiwicDEiLCJwMiIsImRlZ3JlZXMycmFkaWFucyIsIk1hdGgiLCJQSSIsImxvbjEiLCJsb24yIiwibGF0MSIsImxhdDIiLCJhIiwic2luIiwiY29zIiwiYiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBOzs7QUFEQTs7SUFBWUEsTzs7QUFFWjs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUFDQTs7QUFFQSxJQUFNQyxnQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxHQUFWLENBQXRCLEMsQ0FBc0M7O0lBRXpCQyx5QixXQUFBQSx5QjtBQUVYLDJDQU1HO0FBQUEsUUFMREMsUUFLQyxRQUxEQSxRQUtDO0FBQUEsOEJBSkRDLFNBSUM7QUFBQSxRQUpEQSxTQUlDLGtDQUpXO0FBQUEsYUFBSyxJQUFMO0FBQUEsS0FJWDtBQUFBLDZCQUhEQyxRQUdDO0FBQUEsUUFIREEsUUFHQyxpQ0FIVTtBQUFBLGFBQUssQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxHQUFWLENBQUw7QUFBQSxLQUdWO0FBQUEsOEJBRkRDLFNBRUM7QUFBQSxRQUZEQSxTQUVDLGtDQUZXLEtBRVg7QUFBQSx1QkFEREMsSUFDQztBQUFBLFFBRERBLElBQ0MsMkJBRE0sS0FDTjs7QUFBQTs7QUFDRDtBQUNBSixlQUFXLGlCQUFVSyxHQUFWLENBQWNMLFFBQWQsRUFBd0IsVUFB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QyxFQUF3QztBQUN0QyxXQUFPLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBQVA7QUFDRDs7QUFFRCxNQUFNQyxrQkFBa0JDLEtBQUtDLEVBQUwsR0FBVSxHQUFsQztBQUNBLE1BQU1DLE9BQU9ILGtCQUFrQkYsR0FBRyxDQUFILENBQS9CO0FBQ0EsTUFBTU0sT0FBT0osa0JBQWtCRCxHQUFHLENBQUgsQ0FBL0I7QUFDQSxNQUFNTSxPQUFPTCxrQkFBa0JGLEdBQUcsQ0FBSCxDQUEvQjtBQUNBLE1BQU1RLE9BQU9OLGtCQUFrQkQsR0FBRyxDQUFILENBQS9CO0FBQ0EsTUFBTVEsSUFBSU4sS0FBS08sR0FBTCxDQUFTSixPQUFPRCxJQUFoQixJQUF3QkYsS0FBS1EsR0FBTCxDQUFTSCxJQUFULENBQWxDO0FBQ0EsTUFBTUksSUFBSVQsS0FBS1EsR0FBTCxDQUFTSixJQUFULElBQWlCSixLQUFLTyxHQUFMLENBQVNGLElBQVQsQ0FBakIsR0FDUkwsS0FBS08sR0FBTCxDQUFTSCxJQUFULElBQWlCSixLQUFLUSxHQUFMLENBQVNILElBQVQsQ0FBakIsR0FBa0NMLEtBQUtRLEdBQUwsQ0FBU0wsT0FBT0QsSUFBaEIsQ0FEcEM7QUFFQSxTQUFPLGVBQUszRSxTQUFMLENBQWUsRUFBZixFQUFtQixDQUFDa0YsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFDSCxDQUFSLENBQW5CLENBQVA7QUFDRCIsImZpbGUiOiJwb2x5Z29uLXRlc3NlbGF0b3ItZXh0cnVkZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQb2x5Z29uIGZyb20gJy4vcG9seWdvbic7XG4vLyBpbXBvcnQge2dldFBvbHlnb25WZXJ0ZXhDb3VudCwgZ2V0UG9seWdvblRyaWFuZ2xlQ291bnR9IGZyb20gJy4vcG9seWdvbic7XG5pbXBvcnQgZWFyY3V0IGZyb20gJ2VhcmN1dCc7XG5pbXBvcnQgZmxhdHRlbkRlZXAgZnJvbSAnbG9kYXNoLmZsYXR0ZW5kZWVwJztcbmltcG9ydCB7dmVjM30gZnJvbSAnZ2wtbWF0cml4JztcbmltcG9ydCB7ZnA2NGlmeX0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzL2ZwNjQnO1xuaW1wb3J0IHtDb250YWluZXJ9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscyc7XG4vLyBpbXBvcnQge0NvbnRhaW5lciwgZmxhdHRlblZlcnRpY2VzLCBmaWxsQXJyYXl9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscyc7XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTsgLy8gQmxhY2tcblxuZXhwb3J0IGNsYXNzIFBvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWQge1xuXG4gIGNvbnN0cnVjdG9yKHtcbiAgICBwb2x5Z29ucyxcbiAgICBnZXRIZWlnaHQgPSB4ID0+IDEwMDAsXG4gICAgZ2V0Q29sb3IgPSB4ID0+IFswLCAwLCAwLCAyNTVdLFxuICAgIHdpcmVmcmFtZSA9IGZhbHNlLFxuICAgIGZwNjQgPSBmYWxzZVxuICB9KSB7XG4gICAgLy8gRXhwZW5zaXZlIG9wZXJhdGlvbiwgY29udmVydCBhbGwgcG9seWdvbnMgdG8gYXJyYXlzXG4gICAgcG9seWdvbnMgPSBDb250YWluZXIubWFwKHBvbHlnb25zLCAoY29tcGxleFBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgICAgY29uc3QgaGVpZ2h0ID0gZ2V0SGVpZ2h0KHBvbHlnb25JbmRleCkgfHwgMDtcbiAgICAgIHJldHVybiBDb250YWluZXIubWFwKFBvbHlnb24ubm9ybWFsaXplKGNvbXBsZXhQb2x5Z29uKSxcbiAgICAgICAgcG9seWdvbiA9PiBDb250YWluZXIubWFwKHBvbHlnb24sIGNvb3JkID0+IFtjb29yZFswXSwgY29vcmRbMV0sIGhlaWdodF0pKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGdyb3VwZWRWZXJ0aWNlcyA9IHBvbHlnb25zO1xuICAgIHRoaXMuZ3JvdXBlZFZlcnRpY2VzID0gcG9seWdvbnM7XG4gICAgdGhpcy53aXJlZnJhbWUgPSB3aXJlZnJhbWU7XG5cbiAgICBjb25zdCBwb3NpdGlvbnNKUyA9IGNhbGN1bGF0ZVBvc2l0aW9uc0pTKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZX0pO1xuXG4gICAgdGhpcy5hdHRyaWJ1dGVzID0gZnA2NCA/IHtcbiAgICAgIHBvc2l0aW9uczY0eHk6IGNhbGN1bGF0ZVBvc2l0aW9uczY0eHkocG9zaXRpb25zSlMpLFxuICAgICAgcG9zaXRpb25zNjR6OiBjYWxjdWxhdGVQb3NpdGlvbnM2NHoocG9zaXRpb25zSlMpXG4gICAgfSA6IHtcbiAgICAgIHBvc2l0aW9uczogY2FsY3VsYXRlUG9zaXRpb25zKHBvc2l0aW9uc0pTKVxuICAgIH07XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywge1xuICAgICAgaW5kaWNlczogY2FsY3VsYXRlSW5kaWNlcyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWV9KSxcbiAgICAgIG5vcm1hbHM6IGNhbGN1bGF0ZU5vcm1hbHMoe2dyb3VwZWRWZXJ0aWNlcywgd2lyZWZyYW1lfSksXG4gICAgICAvLyBjb2xvcnM6IGNhbGN1bGF0ZUNvbG9ycyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWUsIGdldENvbG9yfSksXG4gICAgICBwaWNraW5nQ29sb3JzOiBjYWxjdWxhdGVQaWNraW5nQ29sb3JzKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZX0pXG4gICAgfSk7XG5cbiAgfVxuXG4gIGluZGljZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5pbmRpY2VzO1xuICB9XG5cbiAgcG9zaXRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMucG9zaXRpb25zO1xuICB9XG5cbiAgcG9zaXRpb25zNjR4eSgpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnBvc2l0aW9uczY0eHk7XG4gIH1cblxuICBwb3NpdGlvbnM2NHooKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5wb3NpdGlvbnM2NHo7XG4gIH1cblxuICBub3JtYWxzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMubm9ybWFscztcbiAgfVxuXG4gIGNvbG9ycyh7Z2V0Q29sb3IgPSB4ID0+IERFRkFVTFRfQ09MT1J9ID0ge30pIHtcbiAgICBjb25zdCB7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWV9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlQ29sb3JzKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZSwgZ2V0Q29sb3J9KTtcbiAgfVxuXG4gIHBpY2tpbmdDb2xvcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5waWNraW5nQ29sb3JzO1xuICB9XG5cbiAgLy8gdXBkYXRlVHJpZ2dlcnM6IHtcbiAgLy8gICBwb3NpdGlvbnM6IFsnZ2V0SGVpZ2h0J10sXG4gIC8vICAgY29sb3JzOiBbJ2dldENvbG9ycyddXG4gIC8vICAgcGlja2luZ0NvbG9yczogJ25vbmUnXG4gIC8vIH1cbn1cblxuZnVuY3Rpb24gY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcykge1xuICByZXR1cm4gdmVydGljZXMucmVkdWNlKChjb3VudCwgcG9seWdvbikgPT4gY291bnQgKyBwb2x5Z29uLmxlbmd0aCwgMCk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUluZGljZXMoe2dyb3VwZWRWZXJ0aWNlcywgd2lyZWZyYW1lID0gZmFsc2V9KSB7XG4gIC8vIGFkanVzdCBpbmRleCBvZmZzZXQgZm9yIG11bHRpcGxlIGJ1aWxkaW5nc1xuICBjb25zdCBtdWx0aXBsaWVyID0gd2lyZWZyYW1lID8gMiA6IDU7XG4gIGNvbnN0IG9mZnNldHMgPSBncm91cGVkVmVydGljZXMucmVkdWNlKFxuICAgIChhY2MsIHZlcnRpY2VzKSA9PlxuICAgICAgWy4uLmFjYywgYWNjW2FjYy5sZW5ndGggLSAxXSArIGNvdW50VmVydGljZXModmVydGljZXMpICogbXVsdGlwbGllcl0sXG4gICAgWzBdXG4gICk7XG5cbiAgY29uc3QgaW5kaWNlcyA9IGdyb3VwZWRWZXJ0aWNlcy5tYXAoKHZlcnRpY2VzLCBidWlsZGluZ0luZGV4KSA9PlxuICAgIHdpcmVmcmFtZSA/XG4gICAgICAvLyAxLiBnZXQgc2VxdWVudGlhbGx5IG9yZGVyZWQgaW5kaWNlcyBvZiBlYWNoIGJ1aWxkaW5nIHdpcmVmcmFtZVxuICAgICAgLy8gMi4gb2Zmc2V0IHRoZW0gYnkgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHByZXZpb3VzIGJ1aWxkaW5nc1xuICAgICAgY2FsY3VsYXRlQ29udG91ckluZGljZXModmVydGljZXMsIG9mZnNldHNbYnVpbGRpbmdJbmRleF0pIDpcbiAgICAgIC8vIDEuIGdldCB0cmlhbmd1bGF0ZWQgaW5kaWNlcyBmb3IgdGhlIGludGVybmFsIGFyZWFzXG4gICAgICAvLyAyLiBvZmZzZXQgdGhlbSBieSB0aGUgbnVtYmVyIG9mIGluZGljZXMgaW4gcHJldmlvdXMgYnVpbGRpbmdzXG4gICAgICBjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyh2ZXJ0aWNlcywgb2Zmc2V0c1tidWlsZGluZ0luZGV4XSlcbiAgKTtcblxuICByZXR1cm4gbmV3IFVpbnQzMkFycmF5KGZsYXR0ZW5EZWVwKGluZGljZXMpKTtcbn1cblxuLy8gQ2FsY3VsYXRlIGEgZmxhdCBwb3NpdGlvbiBhcnJheSBpbiBKUyAtIGNhbiBiZSBtYXBwZWQgdG8gMzIgb3IgNjQgYml0IHR5cGVkIGFycmF5c1xuLy8gUmVtYXJrczpcbi8vICogZWFjaCB0b3AgdmVydGV4IGlzIG9uIDMgc3VyZmFjZXNcbi8vICogZWFjaCBib3R0b20gdmVydGV4IGlzIG9uIDIgc3VyZmFjZXNcbmZ1bmN0aW9uIGNhbGN1bGF0ZVBvc2l0aW9uc0pTKHtncm91cGVkVmVydGljZXMsIHdpcmVmcmFtZSA9IGZhbHNlfSkge1xuICBjb25zdCBwb3NpdGlvbnMgPSBDb250YWluZXIubWFwKGdyb3VwZWRWZXJ0aWNlcywgY29tcGxleFBvbHlnb24gPT5cbiAgICBDb250YWluZXIubWFwKGNvbXBsZXhQb2x5Z29uLCB2ZXJ0aWNlcyA9PiB7XG4gICAgICBjb25zdCB0b3BWZXJ0aWNlcyA9IFtdLmNvbmNhdCh2ZXJ0aWNlcyk7XG4gICAgICBjb25zdCBiYXNlVmVydGljZXMgPSB0b3BWZXJ0aWNlcy5tYXAodiA9PiBbdlswXSwgdlsxXSwgMF0pO1xuICAgICAgcmV0dXJuIHdpcmVmcmFtZSA/XG4gICAgICAgIFt0b3BWZXJ0aWNlcywgYmFzZVZlcnRpY2VzXSA6XG4gICAgICAgIFt0b3BWZXJ0aWNlcywgdG9wVmVydGljZXMsIHRvcFZlcnRpY2VzLCBiYXNlVmVydGljZXMsIGJhc2VWZXJ0aWNlc107XG4gICAgfSlcbiAgKTtcbiAgcmV0dXJuIGZsYXR0ZW5EZWVwKHBvc2l0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVBvc2l0aW9ucyhwb3NpdGlvbnNKUykge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnNKUyk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVBvc2l0aW9uczY0eHkocG9zaXRpb25zSlMpIHtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnNKUy5sZW5ndGggLyAzICogNCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zSlMubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgW2F0dHJpYnV0ZVtpICogNCArIDBdLCBhdHRyaWJ1dGVbaSAqIDQgKyAxXV0gPSBmcDY0aWZ5KHBvc2l0aW9uc0pTW2kgKiAzICsgMF0pO1xuICAgIFthdHRyaWJ1dGVbaSAqIDQgKyAyXSwgYXR0cmlidXRlW2kgKiA0ICsgM11dID0gZnA2NGlmeShwb3NpdGlvbnNKU1tpICogMyArIDFdKTtcbiAgfVxuICByZXR1cm4gYXR0cmlidXRlO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVQb3NpdGlvbnM2NHoocG9zaXRpb25zSlMpIHtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnNKUy5sZW5ndGggLyAzICogMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zSlMubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgW2F0dHJpYnV0ZVtpICogMiArIDBdLCBhdHRyaWJ1dGUudmFsdWVbaSAqIDIgKyAxXV0gPSBmcDY0aWZ5KHBvc2l0aW9uc0pTW2kgKiAzICsgMl0gKyAwLjEpO1xuICB9XG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZU5vcm1hbHMoe2dyb3VwZWRWZXJ0aWNlcywgd2lyZWZyYW1lfSkge1xuICBjb25zdCB1cCA9IFswLCAxLCAwXTtcblxuICBjb25zdCBub3JtYWxzID0gZ3JvdXBlZFZlcnRpY2VzLm1hcCgodmVydGljZXMsIGJ1aWxkaW5nSW5kZXgpID0+IHtcbiAgICBjb25zdCB0b3BOb3JtYWxzID0gbmV3IEFycmF5KGNvdW50VmVydGljZXModmVydGljZXMpKS5maWxsKHVwKTtcbiAgICBjb25zdCBzaWRlTm9ybWFscyA9IHZlcnRpY2VzLm1hcChwb2x5Z29uID0+IGNhbGN1bGF0ZVNpZGVOb3JtYWxzKHBvbHlnb24pKTtcbiAgICBjb25zdCBzaWRlTm9ybWFsc0ZvcndhcmQgPSBzaWRlTm9ybWFscy5tYXAobiA9PiBuWzBdKTtcbiAgICBjb25zdCBzaWRlTm9ybWFsc0JhY2t3YXJkID0gc2lkZU5vcm1hbHMubWFwKG4gPT4gblsxXSk7XG5cbiAgICByZXR1cm4gd2lyZWZyYW1lID9cbiAgICBbdG9wTm9ybWFscywgdG9wTm9ybWFsc10gOlxuICAgIFt0b3BOb3JtYWxzLCBzaWRlTm9ybWFsc0ZvcndhcmQsIHNpZGVOb3JtYWxzQmFja3dhcmQsIHNpZGVOb3JtYWxzRm9yd2FyZCwgc2lkZU5vcm1hbHNCYWNrd2FyZF07XG4gIH0pO1xuXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGZsYXR0ZW5EZWVwKG5vcm1hbHMpKTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlU2lkZU5vcm1hbHModmVydGljZXMpIHtcbiAgY29uc3QgbnVtVmVydGljZXMgPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gIGNvbnN0IG5vcm1hbHMgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVZlcnRpY2VzIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgbiA9IGdldE5vcm1hbCh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbaSArIDFdKTtcbiAgICBub3JtYWxzLnB1c2gobik7XG4gIH1cblxuICByZXR1cm4gW1suLi5ub3JtYWxzLCBub3JtYWxzWzBdXSwgW25vcm1hbHNbMF0sIC4uLm5vcm1hbHNdXTtcbn1cblxuLypcbmZ1bmN0aW9uIGNhbGN1bGF0ZUNvbG9ycyh7cG9seWdvbnMsIHBvaW50Q291bnQsIGdldENvbG9yfSkge1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50ICogNCk7XG4gIGxldCBpID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgoY29tcGxleFBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIC8vIENhbGN1bGF0ZSBwb2x5Z29uIGNvbG9yXG4gICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihwb2x5Z29uSW5kZXgpO1xuICAgIGNvbG9yWzNdID0gTnVtYmVyLmlzRmluaXRlKGNvbG9yWzNdKSA/IGNvbG9yWzNdIDogMjU1O1xuXG4gICAgY29uc3QgY291bnQgPSBQb2x5Z29uLmdldFZlcnRleENvdW50KGNvbXBsZXhQb2x5Z29uKTtcbiAgICBmaWxsQXJyYXkoe3RhcmdldDogYXR0cmlidXRlLCBzb3VyY2U6IGNvbG9yLCBzdGFydDogaSwgY291bnR9KTtcbiAgICBpICs9IGNvbG9yLmxlbmd0aCAqIGNvdW50O1xuICB9KTtcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn1cbiovXG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUNvbG9ycyh7Z3JvdXBlZFZlcnRpY2VzLCBnZXRDb2xvciwgd2lyZWZyYW1lID0gZmFsc2V9KSB7XG4gIGNvbnN0IGNvbG9ycyA9IGdyb3VwZWRWZXJ0aWNlcy5tYXAoKGNvbXBsZXhQb2x5Z29uLCBwb2x5Z29uSW5kZXgpID0+IHtcbiAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKHBvbHlnb25JbmRleCk7XG4gICAgY29sb3JbM10gPSBOdW1iZXIuaXNGaW5pdGUoY29sb3JbM10pID8gY29sb3JbM10gOiAyNTU7XG5cbiAgICAvLyBjb25zdCBiYXNlQ29sb3IgPSBBcnJheS5pc0FycmF5KGNvbG9yKSA/IGNvbG9yWzBdIDogY29sb3I7XG4gICAgLy8gY29uc3QgdG9wQ29sb3IgPSBBcnJheS5pc0FycmF5KGNvbG9yKSA/IGNvbG9yW2NvbG9yLmxlbmd0aCAtIDFdIDogY29sb3I7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBjb3VudFZlcnRpY2VzKGNvbXBsZXhQb2x5Z29uKTtcbiAgICBjb25zdCB0b3BDb2xvcnMgPSBuZXcgQXJyYXkobnVtVmVydGljZXMpLmZpbGwoY29sb3IpO1xuICAgIGNvbnN0IGJhc2VDb2xvcnMgPSBuZXcgQXJyYXkobnVtVmVydGljZXMpLmZpbGwoY29sb3IpO1xuICAgIHJldHVybiB3aXJlZnJhbWUgP1xuICAgICAgW3RvcENvbG9ycywgYmFzZUNvbG9yc10gOlxuICAgICAgW3RvcENvbG9ycywgdG9wQ29sb3JzLCB0b3BDb2xvcnMsIGJhc2VDb2xvcnMsIGJhc2VDb2xvcnNdO1xuICB9KTtcbiAgcmV0dXJuIG5ldyBVaW50OENsYW1wZWRBcnJheShmbGF0dGVuRGVlcChjb2xvcnMpKTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlUGlja2luZ0NvbG9ycyh7Z3JvdXBlZFZlcnRpY2VzLCBjb2xvciA9IFswLCAwLCAwXSwgd2lyZWZyYW1lID0gZmFsc2V9KSB7XG4gIGNvbnN0IGNvbG9ycyA9IGdyb3VwZWRWZXJ0aWNlcy5tYXAoKHZlcnRpY2VzLCBidWlsZGluZ0luZGV4KSA9PiB7XG4gICAgLy8gY29uc3QgYmFzZUNvbG9yID0gQXJyYXkuaXNBcnJheShjb2xvcikgPyBjb2xvclswXSA6IGNvbG9yO1xuICAgIC8vIGNvbnN0IHRvcENvbG9yID0gQXJyYXkuaXNBcnJheShjb2xvcikgPyBjb2xvcltjb2xvci5sZW5ndGggLSAxXSA6IGNvbG9yO1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcyk7XG4gICAgY29uc3QgdG9wQ29sb3JzID0gbmV3IEFycmF5KG51bVZlcnRpY2VzKS5maWxsKFswLCAwLCAwXSk7XG4gICAgY29uc3QgYmFzZUNvbG9ycyA9IG5ldyBBcnJheShudW1WZXJ0aWNlcykuZmlsbChbMCwgMCwgMF0pO1xuICAgIHJldHVybiB3aXJlZnJhbWUgP1xuICAgICAgW3RvcENvbG9ycywgYmFzZUNvbG9yc10gOlxuICAgICAgW3RvcENvbG9ycywgdG9wQ29sb3JzLCB0b3BDb2xvcnMsIGJhc2VDb2xvcnMsIGJhc2VDb2xvcnNdO1xuICB9KTtcbiAgcmV0dXJuIG5ldyBVaW50OENsYW1wZWRBcnJheShmbGF0dGVuRGVlcChjb2xvcnMpKTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlQ29udG91ckluZGljZXModmVydGljZXMsIG9mZnNldCkge1xuICBjb25zdCBzdHJpZGUgPSBjb3VudFZlcnRpY2VzKHZlcnRpY2VzKTtcblxuICByZXR1cm4gdmVydGljZXMubWFwKHBvbHlnb24gPT4ge1xuICAgIGNvbnN0IGluZGljZXMgPSBbb2Zmc2V0XTtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHBvbHlnb24ubGVuZ3RoO1xuXG4gICAgLy8gYnVpbGRpbmcgdG9wXG4gICAgLy8gdXNlIHZlcnRleCBwYWlycyBmb3IgR0wuTElORVMgPT4gWzAsIDEsIDEsIDIsIDIsIC4uLiwgbi0xLCBuLTEsIDBdXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBudW1WZXJ0aWNlcyAtIDE7IGkrKykge1xuICAgICAgaW5kaWNlcy5wdXNoKGkgKyBvZmZzZXQsIGkgKyBvZmZzZXQpO1xuICAgIH1cbiAgICBpbmRpY2VzLnB1c2gob2Zmc2V0KTtcblxuICAgIC8vIGJ1aWxkaW5nIHNpZGVzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1WZXJ0aWNlcyAtIDE7IGkrKykge1xuICAgICAgaW5kaWNlcy5wdXNoKGkgKyBvZmZzZXQsIGkgKyBzdHJpZGUgKyBvZmZzZXQpO1xuICAgIH1cblxuICAgIG9mZnNldCArPSBudW1WZXJ0aWNlcztcbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXQpIHtcbiAgY29uc3Qgc3RyaWRlID0gY291bnRWZXJ0aWNlcyh2ZXJ0aWNlcyk7XG4gIGNvbnN0IHF1YWQgPSBbXG4gICAgWzAsIDFdLCBbMCwgM10sIFsxLCAyXSxcbiAgICBbMSwgMl0sIFswLCAzXSwgWzEsIDRdXG4gIF07XG5cbiAgZnVuY3Rpb24gZHJhd1JlY3RhbmdsZShpKSB7XG4gICAgcmV0dXJuIHF1YWQubWFwKHYgPT4gaSArIHZbMF0gKyBzdHJpZGUgKiB2WzFdICsgb2Zmc2V0KTtcbiAgfVxuXG4gIGxldCBob2xlcyA9IG51bGw7XG5cbiAgaWYgKHZlcnRpY2VzLmxlbmd0aCA+IDEpIHtcbiAgICBob2xlcyA9IHZlcnRpY2VzLnJlZHVjZShcbiAgICAgIChhY2MsIHBvbHlnb24pID0+IFsuLi5hY2MsIGFjY1thY2MubGVuZ3RoIC0gMV0gKyBwb2x5Z29uLmxlbmd0aF0sXG4gICAgICBbMF1cbiAgICApLnNsaWNlKDEsIHZlcnRpY2VzLmxlbmd0aCk7XG4gIH1cblxuICBjb25zdCB0b3BJbmRpY2VzID0gZWFyY3V0KGZsYXR0ZW5EZWVwKHZlcnRpY2VzKSwgaG9sZXMsIDMpLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldCk7XG5cbiAgY29uc3Qgc2lkZUluZGljZXMgPSB2ZXJ0aWNlcy5tYXAocG9seWdvbiA9PiB7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBwb2x5Z29uLmxlbmd0aDtcbiAgICAvLyBidWlsZGluZyB0b3BcbiAgICBjb25zdCBpbmRpY2VzID0gW107XG5cbiAgICAvLyBidWlsZGluZyBzaWRlc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgIGluZGljZXMucHVzaCguLi5kcmF3UmVjdGFuZ2xlKGkpKTtcbiAgICB9XG5cbiAgICBvZmZzZXQgKz0gbnVtVmVydGljZXM7XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH0pO1xuXG4gIHJldHVybiBbdG9wSW5kaWNlcywgc2lkZUluZGljZXNdO1xufVxuXG4vLyBoZWxwZXJzXG5cbi8vIGdldCBub3JtYWwgdmVjdG9yIG9mIGxpbmUgc2VnbWVudFxuZnVuY3Rpb24gZ2V0Tm9ybWFsKHAxLCBwMikge1xuICBpZiAocDFbMF0gPT09IHAyWzBdICYmIHAxWzFdID09PSBwMlsxXSkge1xuICAgIHJldHVybiBbMSwgMCwgMF07XG4gIH1cblxuICBjb25zdCBkZWdyZWVzMnJhZGlhbnMgPSBNYXRoLlBJIC8gMTgwO1xuICBjb25zdCBsb24xID0gZGVncmVlczJyYWRpYW5zICogcDFbMF07XG4gIGNvbnN0IGxvbjIgPSBkZWdyZWVzMnJhZGlhbnMgKiBwMlswXTtcbiAgY29uc3QgbGF0MSA9IGRlZ3JlZXMycmFkaWFucyAqIHAxWzFdO1xuICBjb25zdCBsYXQyID0gZGVncmVlczJyYWRpYW5zICogcDJbMV07XG4gIGNvbnN0IGEgPSBNYXRoLnNpbihsb24yIC0gbG9uMSkgKiBNYXRoLmNvcyhsYXQyKTtcbiAgY29uc3QgYiA9IE1hdGguY29zKGxhdDEpICogTWF0aC5zaW4obGF0MikgLVxuICAgIE1hdGguc2luKGxhdDEpICogTWF0aC5jb3MobGF0MikgKiBNYXRoLmNvcyhsb24yIC0gbG9uMSk7XG4gIHJldHVybiB2ZWMzLm5vcm1hbGl6ZShbXSwgW2IsIDAsIC1hXSk7XG59XG4iXX0=
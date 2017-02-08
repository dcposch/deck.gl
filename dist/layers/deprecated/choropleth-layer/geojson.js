'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGeojsonFeatures = getGeojsonFeatures;
exports.featureToPolygons = featureToPolygons;
exports.extractPolygons = extractPolygons;
exports.normalizeGeojson = normalizeGeojson;

var _utils = require('../../../lib/utils');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * "Normalizes" complete or partial GeoJSON data into iterable list of features
 * Can accept GeoJSON geometry or "Feature", "FeatureCollection" in addition
 * to plain arrays and iterables.
 * Works by extracting the feature array or wrapping single objects in an array,
 * so that subsequent code can simply iterate over features.
 *
 * @param {object} geojson - geojson data
 * @param {Object|Array} data - geojson object (FeatureCollection, Feature or
 *  Geometry) or array of features
 * @return {Array|"iteratable"} - iterable list of features
 */
function getGeojsonFeatures(geojson) {
  // If array, assume this is a list of features
  if (Array.isArray(geojson)) {
    return geojson;
  }

  var type = (0, _utils.get)(geojson, 'type');
  switch (type) {
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
    case 'Polygon':
    case 'MultiPolygon':
    case 'GeometryCollection':
      // Wrap the geometry object in a 'Feature' object and wrap in an array
      return [{ type: 'Feature', properties: {}, geometry: geojson }];
    case 'Feature':
      // Wrap the feature in a 'Features' array
      return [geojson];
    case 'FeatureCollection':
      // Just return the 'Features' array from the collection
      return (0, _utils.get)(geojson, 'features');
    default:
      throw new Error('Unknown geojson type');
  }
}

/*
 * converts a GeoJSON "Feature" object to a list of GeoJSON polygon-style coordinates
 * @param {Object | Array} data - geojson object or array of feature
 * @returns {[Number,Number,Number][][][]} array of choropleths
 */
function featureToPolygons(feature) {
  var geometry = (0, _utils.get)(feature, 'geometry');
  // If no geometry field, assume that "feature" is the polygon list
  if (geometry === undefined) {
    return feature;
  }

  var type = (0, _utils.get)(geometry, 'type');
  var coordinates = (0, _utils.get)(geometry, 'coordinates');

  var polygons = void 0;
  switch (type) {
    case 'MultiPolygon':
      polygons = coordinates;
      break;
    case 'Polygon':
      polygons = [coordinates];
      break;
    case 'LineString':
      // TODO - should lines really be handled in this switch?
      polygons = [[coordinates]];
      break;
    case 'MultiLineString':
      // TODO - should lines really be handled in this switch?
      polygons = coordinates.map(function (coords) {
        return [coords];
      });
      break;
    default:
      polygons = [];
  }
  return polygons;
}

// DEPRECATED - USED BY OLD CHOROPLETH LAYERS

/*
 * converts list of features from a GeoJSON object to a list of GeoJSON
 * polygon-style coordinates
 * @param {Object} data - geojson object
 * @returns {[Number,Number,Number][][][]} array of choropleths
 */
function extractPolygons(data) {
  var normalizedGeojson = normalizeGeojson(data);
  var features = (0, _utils.get)(normalizedGeojson, 'features');

  var result = [];
  features.forEach(function (feature, featureIndex) {
    var choropleths = featureToPolygons(feature);

    /* eslint-disable max-nested-callbacks */
    choropleths = choropleths.map(function (choropleth) {
      return choropleth.map(function (polygon) {
        return polygon.map(function (coord) {
          return [(0, _utils.get)(coord, 0), (0, _utils.get)(coord, 1), (0, _utils.get)(coord, 2) || 0];
        });
      });
    });
    /* eslint-enable max-nested-callbacks */

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = choropleths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var choropleth = _step.value;

        choropleth.featureIndex = featureIndex;
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

    result.push.apply(result, _toConsumableArray(choropleths));
  });
  return result;
}

/**
 * "Normalizes" a GeoJSON geometry or "Feature" into a "FeatureCollection",
 * by wrapping it in an extra object/array.
 *
 * @param {object} geojson - geojson data
 * @return {object} - normalized geojson data
 */
function normalizeGeojson(geojson) {
  var type = (0, _utils.get)(geojson, 'type');
  switch (type) {
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
    case 'Polygon':
    case 'MultiPolygon':
    case 'GeometryCollection':
      // Wrap the geometry object in a "Feature" and add the feature to a "FeatureCollection"
      return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: geojson }]
      };
    case 'Feature':
      // Add the feature to a "FeatureCollection"
      return {
        type: 'FeatureCollection',
        features: [geojson]
      };
    case 'FeatureCollection':
      // Just return the feature collection
      return geojson;
    default:
      throw new Error('Unknown geojson type');
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9jaG9yb3BsZXRoLWxheWVyL2dlb2pzb24uanMiXSwibmFtZXMiOlsiZ2V0R2VvanNvbkZlYXR1cmVzIiwiZmVhdHVyZVRvUG9seWdvbnMiLCJleHRyYWN0UG9seWdvbnMiLCJub3JtYWxpemVHZW9qc29uIiwiZ2VvanNvbiIsIkFycmF5IiwiaXNBcnJheSIsInR5cGUiLCJwcm9wZXJ0aWVzIiwiZ2VvbWV0cnkiLCJFcnJvciIsImZlYXR1cmUiLCJ1bmRlZmluZWQiLCJjb29yZGluYXRlcyIsInBvbHlnb25zIiwibWFwIiwiY29vcmRzIiwiZGF0YSIsIm5vcm1hbGl6ZWRHZW9qc29uIiwiZmVhdHVyZXMiLCJyZXN1bHQiLCJmb3JFYWNoIiwiZmVhdHVyZUluZGV4IiwiY2hvcm9wbGV0aHMiLCJjaG9yb3BsZXRoIiwicG9seWdvbiIsImNvb3JkIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFjZ0JBLGtCLEdBQUFBLGtCO1FBbUNBQyxpQixHQUFBQSxpQjtRQXdDQUMsZSxHQUFBQSxlO1FBcUNBQyxnQixHQUFBQSxnQjs7QUE5SGhCOzs7O0FBRUE7Ozs7Ozs7Ozs7OztBQVlPLFNBQVNILGtCQUFULENBQTRCSSxPQUE1QixFQUFxQztBQUMxQztBQUNBLE1BQUlDLE1BQU1DLE9BQU4sQ0FBY0YsT0FBZCxDQUFKLEVBQTRCO0FBQzFCLFdBQU9BLE9BQVA7QUFDRDs7QUFFRCxNQUFNRyxPQUFPLGdCQUFJSCxPQUFKLEVBQWEsTUFBYixDQUFiO0FBQ0EsVUFBUUcsSUFBUjtBQUNBLFNBQUssT0FBTDtBQUNBLFNBQUssWUFBTDtBQUNBLFNBQUssWUFBTDtBQUNBLFNBQUssaUJBQUw7QUFDQSxTQUFLLFNBQUw7QUFDQSxTQUFLLGNBQUw7QUFDQSxTQUFLLG9CQUFMO0FBQ0U7QUFDQSxhQUFPLENBQ0wsRUFBQ0EsTUFBTSxTQUFQLEVBQWtCQyxZQUFZLEVBQTlCLEVBQWtDQyxVQUFVTCxPQUE1QyxFQURL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RUFEUTtBQUZMLE9BQVA7QUFNRixTQUFLLFNBQUw7QUFDRTtBQUNBLGFBQU87QUFDTEcsY0FBTSxtQkFERDtBQUVMWSxrQkFBVSxDQUFDZixPQUFEO0FBRkwsT0FBUDtBQUlGLFNBQUssbUJBQUw7QUFDRTtBQUNBLGFBQU9BLE9BQVA7QUFDRjtBQUNFLFlBQU0sSUFBSU0sS0FBSixDQUFVLHNCQUFWLENBQU47QUF6QkY7QUEyQkQiLCJmaWxlIjoiZ2VvanNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Z2V0fSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuXG4vKipcbiAqIFwiTm9ybWFsaXplc1wiIGNvbXBsZXRlIG9yIHBhcnRpYWwgR2VvSlNPTiBkYXRhIGludG8gaXRlcmFibGUgbGlzdCBvZiBmZWF0dXJlc1xuICogQ2FuIGFjY2VwdCBHZW9KU09OIGdlb21ldHJ5IG9yIFwiRmVhdHVyZVwiLCBcIkZlYXR1cmVDb2xsZWN0aW9uXCIgaW4gYWRkaXRpb25cbiAqIHRvIHBsYWluIGFycmF5cyBhbmQgaXRlcmFibGVzLlxuICogV29ya3MgYnkgZXh0cmFjdGluZyB0aGUgZmVhdHVyZSBhcnJheSBvciB3cmFwcGluZyBzaW5nbGUgb2JqZWN0cyBpbiBhbiBhcnJheSxcbiAqIHNvIHRoYXQgc3Vic2VxdWVudCBjb2RlIGNhbiBzaW1wbHkgaXRlcmF0ZSBvdmVyIGZlYXR1cmVzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBnZW9qc29uIC0gZ2VvanNvbiBkYXRhXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheX0gZGF0YSAtIGdlb2pzb24gb2JqZWN0IChGZWF0dXJlQ29sbGVjdGlvbiwgRmVhdHVyZSBvclxuICogIEdlb21ldHJ5KSBvciBhcnJheSBvZiBmZWF0dXJlc1xuICogQHJldHVybiB7QXJyYXl8XCJpdGVyYXRhYmxlXCJ9IC0gaXRlcmFibGUgbGlzdCBvZiBmZWF0dXJlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2VvanNvbkZlYXR1cmVzKGdlb2pzb24pIHtcbiAgLy8gSWYgYXJyYXksIGFzc3VtZSB0aGlzIGlzIGEgbGlzdCBvZiBmZWF0dXJlc1xuICBpZiAoQXJyYXkuaXNBcnJheShnZW9qc29uKSkge1xuICAgIHJldHVybiBnZW9qc29uO1xuICB9XG5cbiAgY29uc3QgdHlwZSA9IGdldChnZW9qc29uLCAndHlwZScpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgY2FzZSAnUG9pbnQnOlxuICBjYXNlICdNdWx0aVBvaW50JzpcbiAgY2FzZSAnTGluZVN0cmluZyc6XG4gIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XG4gIGNhc2UgJ1BvbHlnb24nOlxuICBjYXNlICdNdWx0aVBvbHlnb24nOlxuICBjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOlxuICAgIC8vIFdyYXAgdGhlIGdlb21ldHJ5IG9iamVjdCBpbiBhICdGZWF0dXJlJyBvYmplY3QgYW5kIHdyYXAgaW4gYW4gYXJyYXlcbiAgICByZXR1cm4gW1xuICAgICAge3R5cGU6ICdGZWF0dXJlJywgcHJvcGVydGllczoge30sIGdlb21ldHJ5OiBnZW9qc29ufVxuICAgIF07XG4gIGNhc2UgJ0ZlYXR1cmUnOlxuICAgIC8vIFdyYXAgdGhlIGZlYXR1cmUgaW4gYSAnRmVhdHVyZXMnIGFycmF5XG4gICAgcmV0dXJuIFtnZW9qc29uXTtcbiAgY2FzZSAnRmVhdHVyZUNvbGxlY3Rpb24nOlxuICAgIC8vIEp1c3QgcmV0dXJuIHRoZSAnRmVhdHVyZXMnIGFycmF5IGZyb20gdGhlIGNvbGxlY3Rpb25cbiAgICByZXR1cm4gZ2V0KGdlb2pzb24sICdmZWF0dXJlcycpO1xuICBkZWZhdWx0OlxuICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBnZW9qc29uIHR5cGUnKTtcbiAgfVxufVxuXG4vKlxuICogY29udmVydHMgYSBHZW9KU09OIFwiRmVhdHVyZVwiIG9iamVjdCB0byBhIGxpc3Qgb2YgR2VvSlNPTiBwb2x5Z29uLXN0eWxlIGNvb3JkaW5hdGVzXG4gKiBAcGFyYW0ge09iamVjdCB8IEFycmF5fSBkYXRhIC0gZ2VvanNvbiBvYmplY3Qgb3IgYXJyYXkgb2YgZmVhdHVyZVxuICogQHJldHVybnMge1tOdW1iZXIsTnVtYmVyLE51bWJlcl1bXVtdW119IGFycmF5IG9mIGNob3JvcGxldGhzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmZWF0dXJlVG9Qb2x5Z29ucyhmZWF0dXJlKSB7XG4gIGNvbnN0IGdlb21ldHJ5ID0gZ2V0KGZlYXR1cmUsICdnZW9tZXRyeScpO1xuICAvLyBJZiBubyBnZW9tZXRyeSBmaWVsZCwgYXNzdW1lIHRoYXQgXCJmZWF0dXJlXCIgaXMgdGhlIHBvbHlnb24gbGlzdFxuICBpZiAoZ2VvbWV0cnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmZWF0dXJlO1xuICB9XG5cbiAgY29uc3QgdHlwZSA9IGdldChnZW9tZXRyeSwgJ3R5cGUnKTtcbiAgY29uc3QgY29vcmRpbmF0ZXMgPSBnZXQoZ2VvbWV0cnksICdjb29yZGluYXRlcycpO1xuXG4gIGxldCBwb2x5Z29ucztcbiAgc3dpdGNoICh0eXBlKSB7XG4gIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgcG9seWdvbnMgPSBjb29yZGluYXRlcztcbiAgICBicmVhaztcbiAgY2FzZSAnUG9seWdvbic6XG4gICAgcG9seWdvbnMgPSBbY29vcmRpbmF0ZXNdO1xuICAgIGJyZWFrO1xuICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAvLyBUT0RPIC0gc2hvdWxkIGxpbmVzIHJlYWxseSBiZSBoYW5kbGVkIGluIHRoaXMgc3dpdGNoP1xuICAgIHBvbHlnb25zID0gW1tjb29yZGluYXRlc11dO1xuICAgIGJyZWFrO1xuICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxuICAgIC8vIFRPRE8gLSBzaG91bGQgbGluZXMgcmVhbGx5IGJlIGhhbmRsZWQgaW4gdGhpcyBzd2l0Y2g/XG4gICAgcG9seWdvbnMgPSBjb29yZGluYXRlcy5tYXAoY29vcmRzID0+IFtjb29yZHNdKTtcbiAgICBicmVhaztcbiAgZGVmYXVsdDpcbiAgICBwb2x5Z29ucyA9IFtdO1xuICB9XG4gIHJldHVybiBwb2x5Z29ucztcbn1cblxuLy8gREVQUkVDQVRFRCAtIFVTRUQgQlkgT0xEIENIT1JPUExFVEggTEFZRVJTXG5cbi8qXG4gKiBjb252ZXJ0cyBsaXN0IG9mIGZlYXR1cmVzIGZyb20gYSBHZW9KU09OIG9iamVjdCB0byBhIGxpc3Qgb2YgR2VvSlNPTlxuICogcG9seWdvbi1zdHlsZSBjb29yZGluYXRlc1xuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBnZW9qc29uIG9iamVjdFxuICogQHJldHVybnMge1tOdW1iZXIsTnVtYmVyLE51bWJlcl1bXVtdW119IGFycmF5IG9mIGNob3JvcGxldGhzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UG9seWdvbnMoZGF0YSkge1xuICBjb25zdCBub3JtYWxpemVkR2VvanNvbiA9IG5vcm1hbGl6ZUdlb2pzb24oZGF0YSk7XG4gIGNvbnN0IGZlYXR1cmVzID0gZ2V0KG5vcm1hbGl6ZWRHZW9qc29uLCAnZmVhdHVyZXMnKTtcblxuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgZmVhdHVyZXMuZm9yRWFjaCgoZmVhdHVyZSwgZmVhdHVyZUluZGV4KSA9PiB7XG4gICAgbGV0IGNob3JvcGxldGhzID0gZmVhdHVyZVRvUG9seWdvbnMoZmVhdHVyZSk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbmVzdGVkLWNhbGxiYWNrcyAqL1xuICAgIGNob3JvcGxldGhzID0gY2hvcm9wbGV0aHMubWFwKFxuICAgICAgY2hvcm9wbGV0aCA9PiBjaG9yb3BsZXRoLm1hcChcbiAgICAgICAgcG9seWdvbiA9PiBwb2x5Z29uLm1hcChcbiAgICAgICAgICBjb29yZCA9PiBbXG4gICAgICAgICAgICBnZXQoY29vcmQsIDApLFxuICAgICAgICAgICAgZ2V0KGNvb3JkLCAxKSxcbiAgICAgICAgICAgIGdldChjb29yZCwgMikgfHwgMFxuICAgICAgICAgIF1cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbmVzdGVkLWNhbGxiYWNrcyAqL1xuXG4gICAgZm9yIChjb25zdCBjaG9yb3BsZXRoIG9mIGNob3JvcGxldGhzKSB7XG4gICAgICBjaG9yb3BsZXRoLmZlYXR1cmVJbmRleCA9IGZlYXR1cmVJbmRleDtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goLi4uY2hvcm9wbGV0aHMpO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBcIk5vcm1hbGl6ZXNcIiBhIEdlb0pTT04gZ2VvbWV0cnkgb3IgXCJGZWF0dXJlXCIgaW50byBhIFwiRmVhdHVyZUNvbGxlY3Rpb25cIixcbiAqIGJ5IHdyYXBwaW5nIGl0IGluIGFuIGV4dHJhIG9iamVjdC9hcnJheS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gZ2VvanNvbiAtIGdlb2pzb24gZGF0YVxuICogQHJldHVybiB7b2JqZWN0fSAtIG5vcm1hbGl6ZWQgZ2VvanNvbiBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHZW9qc29uKGdlb2pzb24pIHtcbiAgY29uc3QgdHlwZSA9IGdldChnZW9qc29uLCAndHlwZScpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgY2FzZSAnUG9pbnQnOlxuICBjYXNlICdNdWx0aVBvaW50JzpcbiAgY2FzZSAnTGluZVN0cmluZyc6XG4gIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XG4gIGNhc2UgJ1BvbHlnb24nOlxuICBjYXNlICdNdWx0aVBvbHlnb24nOlxuICBjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOlxuICAgIC8vIFdyYXAgdGhlIGdlb21ldHJ5IG9iamVjdCBpbiBhIFwiRmVhdHVyZVwiIGFuZCBhZGQgdGhlIGZlYXR1cmUgdG8gYSBcIkZlYXR1cmVDb2xsZWN0aW9uXCJcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ0ZlYXR1cmVDb2xsZWN0aW9uJyxcbiAgICAgIGZlYXR1cmVzOiBbXG4gICAgICAgIHt0eXBlOiAnRmVhdHVyZScsIHByb3BlcnRpZXM6IHt9LCBnZW9tZXRyeTogZ2VvanNvbn1cbiAgICAgIF1cbiAgICB9O1xuICBjYXNlICdGZWF0dXJlJzpcbiAgICAvLyBBZGQgdGhlIGZlYXR1cmUgdG8gYSBcIkZlYXR1cmVDb2xsZWN0aW9uXCJcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ0ZlYXR1cmVDb2xsZWN0aW9uJyxcbiAgICAgIGZlYXR1cmVzOiBbZ2VvanNvbl1cbiAgICB9O1xuICBjYXNlICdGZWF0dXJlQ29sbGVjdGlvbic6XG4gICAgLy8gSnVzdCByZXR1cm4gdGhlIGZlYXR1cmUgY29sbGVjdGlvblxuICAgIHJldHVybiBnZW9qc29uO1xuICBkZWZhdWx0OlxuICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBnZW9qc29uIHR5cGUnKTtcbiAgfVxufVxuIl19
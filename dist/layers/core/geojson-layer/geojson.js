'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGeojsonFeatures = getGeojsonFeatures;
exports.separateGeojsonFeatures = separateGeojsonFeatures;

var _lib = require('../../../lib');

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

  var type = (0, _lib.get)(geojson, 'type');
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
      return (0, _lib.get)(geojson, 'features');
    default:
      throw new Error('Unknown geojson type');
  }
}

// Linearize
function separateGeojsonFeatures(features) {
  var pointFeatures = [];
  var lineFeatures = [];
  var polygonFeatures = [];
  var polygonOutlineFeatures = [];

  features.forEach(function (feature) {
    var type = (0, _lib.get)(feature, 'geometry.type');
    var coordinates = (0, _lib.get)(feature, 'geometry.coordinates');
    var properties = (0, _lib.get)(feature, 'properties');
    switch (type) {
      case 'Point':
        pointFeatures.push(feature);
        break;
      case 'MultiPoint':
        // TODO - split multipoints
        coordinates.forEach(function (point) {
          pointFeatures.push({ geometry: { coordinates: point }, properties: properties, feature: feature });
        });
        break;
      case 'LineString':
        lineFeatures.push(feature);
        break;
      case 'MultiLineString':
        // Break multilinestrings into multiple lines with same properties
        coordinates.forEach(function (path) {
          lineFeatures.push({ geometry: { coordinates: path }, properties: properties, feature: feature });
        });
        break;
      case 'Polygon':
        polygonFeatures.push(feature);
        // Break polygon into multiple lines with same properties
        coordinates.forEach(function (path) {
          polygonOutlineFeatures.push({ geometry: { coordinates: path }, properties: properties, feature: feature });
        });
        break;
      case 'MultiPolygon':
        // Break multipolygons into multiple polygons with same properties
        coordinates.forEach(function (polygon) {
          polygonFeatures.push({ geometry: { coordinates: polygon }, properties: properties, feature: feature });
          // Break polygon into multiple lines with same properties
          polygon.forEach(function (path) {
            polygonOutlineFeatures.push({ geometry: { coordinates: path }, properties: properties, feature: feature });
          });
        });
        break;
      // Not yet supported
      case 'GeometryCollection':
      default:
        throw new Error('GeoJsonLayer: ' + type + ' not supported.');
    }
  });

  return {
    pointFeatures: pointFeatures,
    lineFeatures: lineFeatures,
    polygonFeatures: polygonFeatures,
    polygonOutlineFeatures: polygonOutlineFeatures
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9nZW9qc29uLWxheWVyL2dlb2pzb24uanMiXSwibmFtZXMiOlsiZ2V0R2VvanNvbkZlYXR1cmVzIiwic2VwYXJhdGVHZW9qc29uRmVhdHVyZXMiLCJnZW9qc29uIiwiQXJyYXkiLCJpc0FycmF5IiwidHlwZSIsInByb3BlcnRpZXMiLCJnZW9tZXRyeSIsIkVycm9yIiwiZmVhdHVyZXMiLCJwb2ludEZlYXR1cmVzIiwibGluZUZlYXR1cmVzIiwicG9seWdvbkZlYXR1cmVzIiwicG9seWdvbk91dGxpbmVGZWF0dXJlcyIsImZvckVhY2giLCJmZWF0dXJlIiwiY29vcmRpbmF0ZXMiLCJwdXNoIiwicG9pbnQiLCJwYXRoIiwicG9seWdvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFjZ0JBLGtCLEdBQUFBLGtCO1FBK0JBQyx1QixHQUFBQSx1Qjs7QUE3Q2hCOztBQUVBOzs7Ozs7Ozs7Ozs7QUFZTyxTQUFTRCxrQkFBVCxDQUE0QkUsT0FBNUIsRUFBcUM7QUFDMUM7QUFDQSxNQUFJQyxNQUFNQyxPQUFOLENBQWNGLE9BQWQsQ0FBSixFQUE0QjtBQUMxQixXQUFPQSxPQUFQO0FBQ0Q7O0FBRUQsTUFBTUcsT0FBTyxjQUFJSCxPQUFKLEVBQWEsTUFBYixDQUFiO0FBQ0EsVUFBUUcsSUFBUjtBQUNBLFNBQUssT0FBTDtBQUNBLFNBQUssWUFBTDtBQUNBLFNBQUssWUFBTDtBQUNBLFNBQUssaUJBQUw7QUFDQSxTQUFLLFNBQUw7QUFDQSxTQUFLLGNBQUw7QUFDQSxTQUFLLG9CQUFMO0FBQ0U7QUFDQSxhQUFPLENBQ0wsRUFBQ0EsTUFBTSxTQUFQLEVBQWtCQyxZQUFZLEVBQTlCLEVBQWtDQyxVQUFVTCxPQUE1QyxFQURLLENBQVA7QUFHRixTQUFLLFNBQUw7QUFDRTtBQUNBLGFBQU8sQ0FBQ0EsT0FBRCxDQUFQO0FBQ0YsU0FBSyxtQkFBTDtBQUNFO0FBQ0EsYUFBTyxjQUFJQSxPQUFKLEVBQWEsVUFBYixDQUFQO0FBQ0Y7QUFDRSxZQUFNLElBQUlNLEtBQUosQ0FBVSxzQkFBVixDQUFOO0FBbkJGO0FBcUJEOztBQUVEO0FBQ08sU0FBU1AsdUJBQVQsQ0FBaUNRLFFBQWpDLEVBQTJDO0FBQ2hELE1BQU1DLGdCQUFnQixFQUF0QjtBQUNBLE1BQU1DLGVBQWUsRUFBckI7QUFDQSxNQUFNQyxrQkFBa0IsRUFBeEI7QUFDQSxNQUFNQyx5QkFBeUIsRUFBL0I7O0FBRUFKLFdBQVNLLE9BQVQsQ0FBaUIsbUJBQVc7QUFDMUIsUUFBTVQsT0FBTyxjQUFJVSxPQUFKLEVBQWEsZUFBYixDQUFiO0FBQ0EsUUFBTUMsY0FBYyxjQUFJRCxPQUFKLEVBQWEsc0JBQWIsQ0FBcEI7QUFDQSxRQUFNVCxhQUFhLGNBQUlTLE9BQUosRUFBYSxZQUFiLENBQW5CO0FBQ0EsWUFBUVYsSUFBUjtBQUNBLFdBQUssT0FBTDtBQUNFSyxzQkFBY08sSUFBZCxDQUFtQkYsT0FBbkI7QUFDQTtBQUNGLFdBQUssWUFBTDtBQUNFO0FBQ0FDLG9CQUFZRixPQUFaLENBQW9CLGlCQUFTO0FBQzNCSix3QkFBY08sSUFBZCxDQUFtQixFQUFDVixVQUFVLEVBQUNTLGFBQWFFLEtBQWQsRUFBWCxFQUFpQ1osc0JBQWpDLEVBQTZDUyxnQkFBN0MsRUFBbkI7QUFDRCxTQUZEO0FBR0E7QUFDRixXQUFLLFlBQUw7QUFDRUoscUJBQWFNLElBQWIsQ0FBa0JGLE9BQWxCO0FBQ0E7QUFDRixXQUFLLGlCQUFMO0FBQ0U7QUFDQUMsb0JBQVlGLE9BQVosQ0FBb0IsZ0JBQVE7QUFDMUJILHVCQUFhTSxJQUFiLENBQWtCLEVBQUNWLFVBQVUsRUFBQ1MsYUFBYUcsSUFBZCxFQUFYLEVBQWdDYixzQkFBaEMsRUFBNENTLGdCQUE1QyxFQUFsQjtBQUNELFNBRkQ7QUFHQTtBQUNGLFdBQUssU0FBTDtBQUNFSCx3QkFBZ0JLLElBQWhCLENBQXFCRixPQUFyQjtBQUNBO0FBQ0FDLG9CQUFZRixPQUFaLENBQW9CLGdCQUFRO0FBQzFCRCxpQ0FBdUJJLElBQXZCLENBQTRCLEVBQUNWLFVBQVUsRUFBQ1MsYUFBYUcsSUFBZCxFQUFYLEVBQWdDYixzQkFBaEMsRUFBNENTLGdCQUE1QyxFQUE1QjtBQUNELFNBRkQ7QUFHQTtBQUNGLFdBQUssY0FBTDtBQUNFO0FBQ0FDLG9CQUFZRixPQUFaLENBQW9CLG1CQUFXO0FBQzdCRiwwQkFBZ0JLLElBQWhCLENBQXFCLEVBQUNWLFVBQVUsRUFBQ1MsYUFBYUksT0FBZCxFQUFYLEVBQW1DZCxzQkFBbkMsRUFBK0NTLGdCQUEvQyxFQUFyQjtBQUNBO0FBQ0FLLGtCQUFRTixPQUFSLENBQWdCLGdCQUFRO0FBQ3RCRCxtQ0FBdUJJLElBQXZCLENBQTRCLEVBQUNWLFVBQVUsRUFBQ1MsYUFBYUcsSUFBZCxFQUFYLEVBQWdDYixzQkFBaEMsRUFBNENTLGdCQUE1QyxFQUE1QjtBQUNELFdBRkQ7QUFHRCxTQU5EO0FBT0E7QUFDQTtBQUNGLFdBQUssb0JBQUw7QUFDQTtBQUNFLGNBQU0sSUFBSVAsS0FBSixvQkFBMkJILElBQTNCLHFCQUFOO0FBdkNGO0FBeUNELEdBN0NEOztBQStDQSxTQUFPO0FBQ0xLLGdDQURLO0FBRUxDLDhCQUZLO0FBR0xDLG9DQUhLO0FBSUxDO0FBSkssR0FBUDtBQU1EIiwiZmlsZSI6Imdlb2pzb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2dldH0gZnJvbSAnLi4vLi4vLi4vbGliJztcblxuLyoqXG4gKiBcIk5vcm1hbGl6ZXNcIiBjb21wbGV0ZSBvciBwYXJ0aWFsIEdlb0pTT04gZGF0YSBpbnRvIGl0ZXJhYmxlIGxpc3Qgb2YgZmVhdHVyZXNcbiAqIENhbiBhY2NlcHQgR2VvSlNPTiBnZW9tZXRyeSBvciBcIkZlYXR1cmVcIiwgXCJGZWF0dXJlQ29sbGVjdGlvblwiIGluIGFkZGl0aW9uXG4gKiB0byBwbGFpbiBhcnJheXMgYW5kIGl0ZXJhYmxlcy5cbiAqIFdvcmtzIGJ5IGV4dHJhY3RpbmcgdGhlIGZlYXR1cmUgYXJyYXkgb3Igd3JhcHBpbmcgc2luZ2xlIG9iamVjdHMgaW4gYW4gYXJyYXksXG4gKiBzbyB0aGF0IHN1YnNlcXVlbnQgY29kZSBjYW4gc2ltcGx5IGl0ZXJhdGUgb3ZlciBmZWF0dXJlcy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gZ2VvanNvbiAtIGdlb2pzb24gZGF0YVxuICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IGRhdGEgLSBnZW9qc29uIG9iamVjdCAoRmVhdHVyZUNvbGxlY3Rpb24sIEZlYXR1cmUgb3JcbiAqICBHZW9tZXRyeSkgb3IgYXJyYXkgb2YgZmVhdHVyZXNcbiAqIEByZXR1cm4ge0FycmF5fFwiaXRlcmF0YWJsZVwifSAtIGl0ZXJhYmxlIGxpc3Qgb2YgZmVhdHVyZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEdlb2pzb25GZWF0dXJlcyhnZW9qc29uKSB7XG4gIC8vIElmIGFycmF5LCBhc3N1bWUgdGhpcyBpcyBhIGxpc3Qgb2YgZmVhdHVyZXNcbiAgaWYgKEFycmF5LmlzQXJyYXkoZ2VvanNvbikpIHtcbiAgICByZXR1cm4gZ2VvanNvbjtcbiAgfVxuXG4gIGNvbnN0IHR5cGUgPSBnZXQoZ2VvanNvbiwgJ3R5cGUnKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gIGNhc2UgJ1BvaW50JzpcbiAgY2FzZSAnTXVsdGlQb2ludCc6XG4gIGNhc2UgJ0xpbmVTdHJpbmcnOlxuICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxuICBjYXNlICdQb2x5Z29uJzpcbiAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgY2FzZSAnR2VvbWV0cnlDb2xsZWN0aW9uJzpcbiAgICAvLyBXcmFwIHRoZSBnZW9tZXRyeSBvYmplY3QgaW4gYSAnRmVhdHVyZScgb2JqZWN0IGFuZCB3cmFwIGluIGFuIGFycmF5XG4gICAgcmV0dXJuIFtcbiAgICAgIHt0eXBlOiAnRmVhdHVyZScsIHByb3BlcnRpZXM6IHt9LCBnZW9tZXRyeTogZ2VvanNvbn1cbiAgICBdO1xuICBjYXNlICdGZWF0dXJlJzpcbiAgICAvLyBXcmFwIHRoZSBmZWF0dXJlIGluIGEgJ0ZlYXR1cmVzJyBhcnJheVxuICAgIHJldHVybiBbZ2VvanNvbl07XG4gIGNhc2UgJ0ZlYXR1cmVDb2xsZWN0aW9uJzpcbiAgICAvLyBKdXN0IHJldHVybiB0aGUgJ0ZlYXR1cmVzJyBhcnJheSBmcm9tIHRoZSBjb2xsZWN0aW9uXG4gICAgcmV0dXJuIGdldChnZW9qc29uLCAnZmVhdHVyZXMnKTtcbiAgZGVmYXVsdDpcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZ2VvanNvbiB0eXBlJyk7XG4gIH1cbn1cblxuLy8gTGluZWFyaXplXG5leHBvcnQgZnVuY3Rpb24gc2VwYXJhdGVHZW9qc29uRmVhdHVyZXMoZmVhdHVyZXMpIHtcbiAgY29uc3QgcG9pbnRGZWF0dXJlcyA9IFtdO1xuICBjb25zdCBsaW5lRmVhdHVyZXMgPSBbXTtcbiAgY29uc3QgcG9seWdvbkZlYXR1cmVzID0gW107XG4gIGNvbnN0IHBvbHlnb25PdXRsaW5lRmVhdHVyZXMgPSBbXTtcblxuICBmZWF0dXJlcy5mb3JFYWNoKGZlYXR1cmUgPT4ge1xuICAgIGNvbnN0IHR5cGUgPSBnZXQoZmVhdHVyZSwgJ2dlb21ldHJ5LnR5cGUnKTtcbiAgICBjb25zdCBjb29yZGluYXRlcyA9IGdldChmZWF0dXJlLCAnZ2VvbWV0cnkuY29vcmRpbmF0ZXMnKTtcbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gZ2V0KGZlYXR1cmUsICdwcm9wZXJ0aWVzJyk7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnUG9pbnQnOlxuICAgICAgcG9pbnRGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlQb2ludCc6XG4gICAgICAvLyBUT0RPIC0gc3BsaXQgbXVsdGlwb2ludHNcbiAgICAgIGNvb3JkaW5hdGVzLmZvckVhY2gocG9pbnQgPT4ge1xuICAgICAgICBwb2ludEZlYXR1cmVzLnB1c2goe2dlb21ldHJ5OiB7Y29vcmRpbmF0ZXM6IHBvaW50fSwgcHJvcGVydGllcywgZmVhdHVyZX0pO1xuICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgIGxpbmVGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcbiAgICAgIC8vIEJyZWFrIG11bHRpbGluZXN0cmluZ3MgaW50byBtdWx0aXBsZSBsaW5lcyB3aXRoIHNhbWUgcHJvcGVydGllc1xuICAgICAgY29vcmRpbmF0ZXMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgICAgbGluZUZlYXR1cmVzLnB1c2goe2dlb21ldHJ5OiB7Y29vcmRpbmF0ZXM6IHBhdGh9LCBwcm9wZXJ0aWVzLCBmZWF0dXJlfSk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgcG9seWdvbkZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG4gICAgICAvLyBCcmVhayBwb2x5Z29uIGludG8gbXVsdGlwbGUgbGluZXMgd2l0aCBzYW1lIHByb3BlcnRpZXNcbiAgICAgIGNvb3JkaW5hdGVzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICAgIHBvbHlnb25PdXRsaW5lRmVhdHVyZXMucHVzaCh7Z2VvbWV0cnk6IHtjb29yZGluYXRlczogcGF0aH0sIHByb3BlcnRpZXMsIGZlYXR1cmV9KTtcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgICAgIC8vIEJyZWFrIG11bHRpcG9seWdvbnMgaW50byBtdWx0aXBsZSBwb2x5Z29ucyB3aXRoIHNhbWUgcHJvcGVydGllc1xuICAgICAgY29vcmRpbmF0ZXMuZm9yRWFjaChwb2x5Z29uID0+IHtcbiAgICAgICAgcG9seWdvbkZlYXR1cmVzLnB1c2goe2dlb21ldHJ5OiB7Y29vcmRpbmF0ZXM6IHBvbHlnb259LCBwcm9wZXJ0aWVzLCBmZWF0dXJlfSk7XG4gICAgICAgIC8vIEJyZWFrIHBvbHlnb24gaW50byBtdWx0aXBsZSBsaW5lcyB3aXRoIHNhbWUgcHJvcGVydGllc1xuICAgICAgICBwb2x5Z29uLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICAgICAgcG9seWdvbk91dGxpbmVGZWF0dXJlcy5wdXNoKHtnZW9tZXRyeToge2Nvb3JkaW5hdGVzOiBwYXRofSwgcHJvcGVydGllcywgZmVhdHVyZX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICAvLyBOb3QgeWV0IHN1cHBvcnRlZFxuICAgIGNhc2UgJ0dlb21ldHJ5Q29sbGVjdGlvbic6XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgR2VvSnNvbkxheWVyOiAke3R5cGV9IG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHBvaW50RmVhdHVyZXMsXG4gICAgbGluZUZlYXR1cmVzLFxuICAgIHBvbHlnb25GZWF0dXJlcyxcbiAgICBwb2x5Z29uT3V0bGluZUZlYXR1cmVzXG4gIH07XG59XG4iXX0=
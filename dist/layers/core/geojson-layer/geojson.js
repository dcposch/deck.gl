'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGeojsonFeatures = getGeojsonFeatures;
exports.separateGeojsonFeatures = separateGeojsonFeatures;

var _utils = require('../../../lib/utils');

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

  var type = _utils.Container.get(geojson, 'type');
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
      return _utils.Container.get(geojson, 'features');
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

  _utils.Container.forEach(features, function (feature) {
    var type = _utils.Container.get(feature, 'geometry.type');
    var coordinates = _utils.Container.get(feature, 'geometry.coordinates');
    var properties = _utils.Container.get(feature, 'properties');
    switch (type) {
      case 'Point':
        pointFeatures.push(feature);
        break;
      case 'MultiPoint':
        // TODO - split multipoints
        _utils.Container.forEach(coordinates, function (point) {
          pointFeatures.push({ geometry: { coordinates: point }, properties: properties, feature: feature });
        });
        break;
      case 'LineString':
        lineFeatures.push(feature);
        break;
      case 'MultiLineString':
        // Break multilinestrings into multiple lines with same properties
        _utils.Container.forEach(coordinates, function (path) {
          lineFeatures.push({ geometry: { coordinates: path }, properties: properties, feature: feature });
        });
        break;
      case 'Polygon':
        polygonFeatures.push(feature);
        // Break polygon into multiple lines with same properties
        _utils.Container.forEach(coordinates, function (path) {
          polygonOutlineFeatures.push({ geometry: { coordinates: path }, properties: properties, feature: feature });
        });
        break;
      case 'MultiPolygon':
        // Break multipolygons into multiple polygons with same properties
        _utils.Container.forEach(coordinates, function (polygon) {
          polygonFeatures.push({ geometry: { coordinates: polygon }, properties: properties, feature: feature });
          // Break polygon into multiple lines with same properties
          _utils.Container.forEach(polygon, function (path) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9nZW9qc29uLWxheWVyL2dlb2pzb24uanMiXSwibmFtZXMiOlsiZ2V0R2VvanNvbkZlYXR1cmVzIiwic2VwYXJhdGVHZW9qc29uRmVhdHVyZXMiLCJnZW9qc29uIiwiQXJyYXkiLCJpc0FycmF5IiwidHlwZSIsImdldCIsInByb3BlcnRpZXMiLCJnZW9tZXRyeSIsIkVycm9yIiwiZmVhdHVyZXMiLCJwb2ludEZlYXR1cmVzIiwibGluZUZlYXR1cmVzIiwicG9seWdvbkZlYXR1cmVzIiwicG9seWdvbk91dGxpbmVGZWF0dXJlcyIsImZvckVhY2giLCJmZWF0dXJlIiwiY29vcmRpbmF0ZXMiLCJwdXNoIiwicG9pbnQiLCJwYXRoIiwicG9seWdvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFjZ0JBLGtCLEdBQUFBLGtCO1FBK0JBQyx1QixHQUFBQSx1Qjs7QUE3Q2hCOztBQUVBOzs7Ozs7Ozs7Ozs7QUFZTyxTQUFTRCxrQkFBVCxDQUE0QkUsT0FBNUIsRUFBcUM7QUFDMUM7QUFDQSxNQUFJQyxNQUFNQyxPQUFOLENBQWNGLE9BQWQsQ0FBSixFQUE0QjtBQUMxQixXQUFPQSxPQUFQO0FBQ0Q7O0FBRUQsTUFBTUcsT0FBTyxpQkFBVUMsR0FBVixDQUFjSixPQUFkLEVBQXVCLE1BQXZCLENBQWI7QUFDQSxVQUFRRyxJQUFSO0FBQ0EsU0FBSyxPQUFMO0FBQ0EsU0FBSyxZQUFMO0FBQ0EsU0FBSyxZQUFMO0FBQ0EsU0FBSyxpQkFBTDtBQUNBLFNBQUssU0FBTDtBQUNBLFNBQUssY0FBTDtBQUNBLFNBQUssb0JBQUw7QUFDRTtBQUNBLGFBQU8sQ0FDTCxFQUFDQSxNQUFNLFNBQVAsRUFBa0JFLFlBQVksRUFBOUIsRUFBa0NDLFVBQVVOLE9BQTVDLEVBREssQ0FBUDtBQUdGLFNBQUssU0FBTDtBQUNFO0FBQ0EsYUFBTyxDQUFDQSxPQUFELENBQVA7QUFDRixTQUFLLG1CQUFMO0FBQ0U7QUFDQSxhQUFPLGlCQUFVSSxHQUFWLENBQWNKLE9BQWQsRUFBdUIsVUFBdkIsQ0FBUDtBQUNGO0FBQ0UsWUFBTSxJQUFJTyxLQUFKLENBQVUsc0JBQVYsQ0FBTjtBQW5CRjtBQXFCRDs7QUFFRDtBQUNPLFNBQVNSLHVCQUFULENBQWlDUyxRQUFqQyxFQUEyQztBQUNoRCxNQUFNQyxnQkFBZ0IsRUFBdEI7QUFDQSxNQUFNQyxlQUFlLEVBQXJCO0FBQ0EsTUFBTUMsa0JBQWtCLEVBQXhCO0FBQ0EsTUFBTUMseUJBQXlCLEVBQS9COztBQUVBLG1CQUFVQyxPQUFWLENBQWtCTCxRQUFsQixFQUE0QixtQkFBVztBQUNyQyxRQUFNTCxPQUFPLGlCQUFVQyxHQUFWLENBQWNVLE9BQWQsRUFBdUIsZUFBdkIsQ0FBYjtBQUNBLFFBQU1DLGNBQWMsaUJBQVVYLEdBQVYsQ0FBY1UsT0FBZCxFQUF1QixzQkFBdkIsQ0FBcEI7QUFDQSxRQUFNVCxhQUFhLGlCQUFVRCxHQUFWLENBQWNVLE9BQWQsRUFBdUIsWUFBdkIsQ0FBbkI7QUFDQSxZQUFRWCxJQUFSO0FBQ0EsV0FBSyxPQUFMO0FBQ0VNLHNCQUFjTyxJQUFkLENBQW1CRixPQUFuQjtBQUNBO0FBQ0YsV0FBSyxZQUFMO0FBQ0U7QUFDQSx5QkFBVUQsT0FBVixDQUFrQkUsV0FBbEIsRUFBK0IsaUJBQVM7QUFDdENOLHdCQUFjTyxJQUFkLENBQW1CLEVBQUNWLFVBQVUsRUFBQ1MsYUFBYUUsS0FBZCxFQUFYLEVBQWlDWixzQkFBakMsRUFBNkNTLGdCQUE3QyxFQUFuQjtBQUNELFNBRkQ7QUFHQTtBQUNGLFdBQUssWUFBTDtBQUNFSixxQkFBYU0sSUFBYixDQUFrQkYsT0FBbEI7QUFDQTtBQUNGLFdBQUssaUJBQUw7QUFDRTtBQUNBLHlCQUFVRCxPQUFWLENBQWtCRSxXQUFsQixFQUErQixnQkFBUTtBQUNyQ0wsdUJBQWFNLElBQWIsQ0FBa0IsRUFBQ1YsVUFBVSxFQUFDUyxhQUFhRyxJQUFkLEVBQVgsRUFBZ0NiLHNCQUFoQyxFQUE0Q1MsZ0JBQTVDLEVBQWxCO0FBQ0QsU0FGRDtBQUdBO0FBQ0YsV0FBSyxTQUFMO0FBQ0VILHdCQUFnQkssSUFBaEIsQ0FBcUJGLE9BQXJCO0FBQ0E7QUFDQSx5QkFBVUQsT0FBVixDQUFrQkUsV0FBbEIsRUFBK0IsZ0JBQVE7QUFDckNILGlDQUF1QkksSUFBdkIsQ0FBNEIsRUFBQ1YsVUFBVSxFQUFDUyxhQUFhRyxJQUFkLEVBQVgsRUFBZ0NiLHNCQUFoQyxFQUE0Q1MsZ0JBQTVDLEVBQTVCO0FBQ0QsU0FGRDtBQUdBO0FBQ0YsV0FBSyxjQUFMO0FBQ0U7QUFDQSx5QkFBVUQsT0FBVixDQUFrQkUsV0FBbEIsRUFBK0IsbUJBQVc7QUFDeENKLDBCQUFnQkssSUFBaEIsQ0FBcUIsRUFBQ1YsVUFBVSxFQUFDUyxhQUFhSSxPQUFkLEVBQVgsRUFBbUNkLHNCQUFuQyxFQUErQ1MsZ0JBQS9DLEVBQXJCO0FBQ0E7QUFDQSwyQkFBVUQsT0FBVixDQUFrQk0sT0FBbEIsRUFBMkIsZ0JBQVE7QUFDakNQLG1DQUF1QkksSUFBdkIsQ0FBNEIsRUFBQ1YsVUFBVSxFQUFDUyxhQUFhRyxJQUFkLEVBQVgsRUFBZ0NiLHNCQUFoQyxFQUE0Q1MsZ0JBQTVDLEVBQTVCO0FBQ0QsV0FGRDtBQUdELFNBTkQ7QUFPQTtBQUNBO0FBQ0YsV0FBSyxvQkFBTDtBQUNBO0FBQ0UsY0FBTSxJQUFJUCxLQUFKLG9CQUEyQkosSUFBM0IscUJBQU47QUF2Q0Y7QUF5Q0QsR0E3Q0Q7O0FBK0NBLFNBQU87QUFDTE0sZ0NBREs7QUFFTEMsOEJBRks7QUFHTEMsb0NBSEs7QUFJTEM7QUFKSyxHQUFQO0FBTUQiLCJmaWxlIjoiZ2VvanNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29udGFpbmVyfSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuXG4vKipcbiAqIFwiTm9ybWFsaXplc1wiIGNvbXBsZXRlIG9yIHBhcnRpYWwgR2VvSlNPTiBkYXRhIGludG8gaXRlcmFibGUgbGlzdCBvZiBmZWF0dXJlc1xuICogQ2FuIGFjY2VwdCBHZW9KU09OIGdlb21ldHJ5IG9yIFwiRmVhdHVyZVwiLCBcIkZlYXR1cmVDb2xsZWN0aW9uXCIgaW4gYWRkaXRpb25cbiAqIHRvIHBsYWluIGFycmF5cyBhbmQgaXRlcmFibGVzLlxuICogV29ya3MgYnkgZXh0cmFjdGluZyB0aGUgZmVhdHVyZSBhcnJheSBvciB3cmFwcGluZyBzaW5nbGUgb2JqZWN0cyBpbiBhbiBhcnJheSxcbiAqIHNvIHRoYXQgc3Vic2VxdWVudCBjb2RlIGNhbiBzaW1wbHkgaXRlcmF0ZSBvdmVyIGZlYXR1cmVzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBnZW9qc29uIC0gZ2VvanNvbiBkYXRhXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheX0gZGF0YSAtIGdlb2pzb24gb2JqZWN0IChGZWF0dXJlQ29sbGVjdGlvbiwgRmVhdHVyZSBvclxuICogIEdlb21ldHJ5KSBvciBhcnJheSBvZiBmZWF0dXJlc1xuICogQHJldHVybiB7QXJyYXl8XCJpdGVyYXRhYmxlXCJ9IC0gaXRlcmFibGUgbGlzdCBvZiBmZWF0dXJlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2VvanNvbkZlYXR1cmVzKGdlb2pzb24pIHtcbiAgLy8gSWYgYXJyYXksIGFzc3VtZSB0aGlzIGlzIGEgbGlzdCBvZiBmZWF0dXJlc1xuICBpZiAoQXJyYXkuaXNBcnJheShnZW9qc29uKSkge1xuICAgIHJldHVybiBnZW9qc29uO1xuICB9XG5cbiAgY29uc3QgdHlwZSA9IENvbnRhaW5lci5nZXQoZ2VvanNvbiwgJ3R5cGUnKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gIGNhc2UgJ1BvaW50JzpcbiAgY2FzZSAnTXVsdGlQb2ludCc6XG4gIGNhc2UgJ0xpbmVTdHJpbmcnOlxuICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxuICBjYXNlICdQb2x5Z29uJzpcbiAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgY2FzZSAnR2VvbWV0cnlDb2xsZWN0aW9uJzpcbiAgICAvLyBXcmFwIHRoZSBnZW9tZXRyeSBvYmplY3QgaW4gYSAnRmVhdHVyZScgb2JqZWN0IGFuZCB3cmFwIGluIGFuIGFycmF5XG4gICAgcmV0dXJuIFtcbiAgICAgIHt0eXBlOiAnRmVhdHVyZScsIHByb3BlcnRpZXM6IHt9LCBnZW9tZXRyeTogZ2VvanNvbn1cbiAgICBdO1xuICBjYXNlICdGZWF0dXJlJzpcbiAgICAvLyBXcmFwIHRoZSBmZWF0dXJlIGluIGEgJ0ZlYXR1cmVzJyBhcnJheVxuICAgIHJldHVybiBbZ2VvanNvbl07XG4gIGNhc2UgJ0ZlYXR1cmVDb2xsZWN0aW9uJzpcbiAgICAvLyBKdXN0IHJldHVybiB0aGUgJ0ZlYXR1cmVzJyBhcnJheSBmcm9tIHRoZSBjb2xsZWN0aW9uXG4gICAgcmV0dXJuIENvbnRhaW5lci5nZXQoZ2VvanNvbiwgJ2ZlYXR1cmVzJyk7XG4gIGRlZmF1bHQ6XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGdlb2pzb24gdHlwZScpO1xuICB9XG59XG5cbi8vIExpbmVhcml6ZVxuZXhwb3J0IGZ1bmN0aW9uIHNlcGFyYXRlR2VvanNvbkZlYXR1cmVzKGZlYXR1cmVzKSB7XG4gIGNvbnN0IHBvaW50RmVhdHVyZXMgPSBbXTtcbiAgY29uc3QgbGluZUZlYXR1cmVzID0gW107XG4gIGNvbnN0IHBvbHlnb25GZWF0dXJlcyA9IFtdO1xuICBjb25zdCBwb2x5Z29uT3V0bGluZUZlYXR1cmVzID0gW107XG5cbiAgQ29udGFpbmVyLmZvckVhY2goZmVhdHVyZXMsIGZlYXR1cmUgPT4ge1xuICAgIGNvbnN0IHR5cGUgPSBDb250YWluZXIuZ2V0KGZlYXR1cmUsICdnZW9tZXRyeS50eXBlJyk7XG4gICAgY29uc3QgY29vcmRpbmF0ZXMgPSBDb250YWluZXIuZ2V0KGZlYXR1cmUsICdnZW9tZXRyeS5jb29yZGluYXRlcycpO1xuICAgIGNvbnN0IHByb3BlcnRpZXMgPSBDb250YWluZXIuZ2V0KGZlYXR1cmUsICdwcm9wZXJ0aWVzJyk7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnUG9pbnQnOlxuICAgICAgcG9pbnRGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlQb2ludCc6XG4gICAgICAvLyBUT0RPIC0gc3BsaXQgbXVsdGlwb2ludHNcbiAgICAgIENvbnRhaW5lci5mb3JFYWNoKGNvb3JkaW5hdGVzLCBwb2ludCA9PiB7XG4gICAgICAgIHBvaW50RmVhdHVyZXMucHVzaCh7Z2VvbWV0cnk6IHtjb29yZGluYXRlczogcG9pbnR9LCBwcm9wZXJ0aWVzLCBmZWF0dXJlfSk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0xpbmVTdHJpbmcnOlxuICAgICAgbGluZUZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxuICAgICAgLy8gQnJlYWsgbXVsdGlsaW5lc3RyaW5ncyBpbnRvIG11bHRpcGxlIGxpbmVzIHdpdGggc2FtZSBwcm9wZXJ0aWVzXG4gICAgICBDb250YWluZXIuZm9yRWFjaChjb29yZGluYXRlcywgcGF0aCA9PiB7XG4gICAgICAgIGxpbmVGZWF0dXJlcy5wdXNoKHtnZW9tZXRyeToge2Nvb3JkaW5hdGVzOiBwYXRofSwgcHJvcGVydGllcywgZmVhdHVyZX0pO1xuICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdQb2x5Z29uJzpcbiAgICAgIHBvbHlnb25GZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuICAgICAgLy8gQnJlYWsgcG9seWdvbiBpbnRvIG11bHRpcGxlIGxpbmVzIHdpdGggc2FtZSBwcm9wZXJ0aWVzXG4gICAgICBDb250YWluZXIuZm9yRWFjaChjb29yZGluYXRlcywgcGF0aCA9PiB7XG4gICAgICAgIHBvbHlnb25PdXRsaW5lRmVhdHVyZXMucHVzaCh7Z2VvbWV0cnk6IHtjb29yZGluYXRlczogcGF0aH0sIHByb3BlcnRpZXMsIGZlYXR1cmV9KTtcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgICAgIC8vIEJyZWFrIG11bHRpcG9seWdvbnMgaW50byBtdWx0aXBsZSBwb2x5Z29ucyB3aXRoIHNhbWUgcHJvcGVydGllc1xuICAgICAgQ29udGFpbmVyLmZvckVhY2goY29vcmRpbmF0ZXMsIHBvbHlnb24gPT4ge1xuICAgICAgICBwb2x5Z29uRmVhdHVyZXMucHVzaCh7Z2VvbWV0cnk6IHtjb29yZGluYXRlczogcG9seWdvbn0sIHByb3BlcnRpZXMsIGZlYXR1cmV9KTtcbiAgICAgICAgLy8gQnJlYWsgcG9seWdvbiBpbnRvIG11bHRpcGxlIGxpbmVzIHdpdGggc2FtZSBwcm9wZXJ0aWVzXG4gICAgICAgIENvbnRhaW5lci5mb3JFYWNoKHBvbHlnb24sIHBhdGggPT4ge1xuICAgICAgICAgIHBvbHlnb25PdXRsaW5lRmVhdHVyZXMucHVzaCh7Z2VvbWV0cnk6IHtjb29yZGluYXRlczogcGF0aH0sIHByb3BlcnRpZXMsIGZlYXR1cmV9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgLy8gTm90IHlldCBzdXBwb3J0ZWRcbiAgICBjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOlxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEdlb0pzb25MYXllcjogJHt0eXBlfSBub3Qgc3VwcG9ydGVkLmApO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBwb2ludEZlYXR1cmVzLFxuICAgIGxpbmVGZWF0dXJlcyxcbiAgICBwb2x5Z29uRmVhdHVyZXMsXG4gICAgcG9seWdvbk91dGxpbmVGZWF0dXJlc1xuICB9O1xufVxuIl19
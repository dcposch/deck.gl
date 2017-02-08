'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.experimental = exports.default = exports.DeckGL = exports.ExtrudedChoroplethLayer64 = exports.ChoroplethLayer64 = exports.ChoroplethLayer = exports.GeoJsonLayer = exports.PolygonLayer = exports.PathLayer = exports.HexagonCellLayer = exports.HexagonLayer = exports.GridCellLayer = exports.GridLayer = exports.ScreenGridLayer = exports.ScatterplotLayer = exports.PointCloudLayer = exports.LineLayer = exports.IconLayer = exports.ArcLayer = exports.WebMercatorViewport = exports.OrthographicViewport = exports.PerspectiveViewport = exports.Viewport = exports.COORDINATE_SYSTEM = exports.AttributeManager = exports.LayerManager = exports.CompositeLayer = exports.Layer = exports.assembleShaders = undefined;

var _shaderUtils = require('./shader-utils');

Object.defineProperty(exports, 'assembleShaders', {
  enumerable: true,
  get: function get() {
    return _shaderUtils.assembleShaders;
  }
});

var _lib = require('./lib');

Object.defineProperty(exports, 'Layer', {
  enumerable: true,
  get: function get() {
    return _lib.Layer;
  }
});
Object.defineProperty(exports, 'CompositeLayer', {
  enumerable: true,
  get: function get() {
    return _lib.CompositeLayer;
  }
});
Object.defineProperty(exports, 'LayerManager', {
  enumerable: true,
  get: function get() {
    return _lib.LayerManager;
  }
});
Object.defineProperty(exports, 'AttributeManager', {
  enumerable: true,
  get: function get() {
    return _lib.AttributeManager;
  }
});
Object.defineProperty(exports, 'COORDINATE_SYSTEM', {
  enumerable: true,
  get: function get() {
    return _lib.COORDINATE_SYSTEM;
  }
});

var _viewport = require('./lib/viewports/viewport');

Object.defineProperty(exports, 'Viewport', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_viewport).default;
  }
});

var _perspectiveViewport = require('./lib/viewports/perspective-viewport');

Object.defineProperty(exports, 'PerspectiveViewport', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_perspectiveViewport).default;
  }
});

var _orthographicViewport = require('./lib/viewports/orthographic-viewport');

Object.defineProperty(exports, 'OrthographicViewport', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_orthographicViewport).default;
  }
});

var _webMercatorViewport = require('./lib/viewports/web-mercator-viewport');

Object.defineProperty(exports, 'WebMercatorViewport', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_webMercatorViewport).default;
  }
});

var _arcLayer = require('./layers/core/arc-layer/arc-layer');

Object.defineProperty(exports, 'ArcLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_arcLayer).default;
  }
});

var _iconLayer = require('./layers/core/icon-layer/icon-layer');

Object.defineProperty(exports, 'IconLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_iconLayer).default;
  }
});

var _lineLayer = require('./layers/core/line-layer/line-layer');

Object.defineProperty(exports, 'LineLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_lineLayer).default;
  }
});

var _pointCloudLayer = require('./layers/core/point-cloud-layer/point-cloud-layer');

Object.defineProperty(exports, 'PointCloudLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_pointCloudLayer).default;
  }
});

var _scatterplotLayer = require('./layers/core/scatterplot-layer/scatterplot-layer');

Object.defineProperty(exports, 'ScatterplotLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_scatterplotLayer).default;
  }
});

var _screenGridLayer = require('./layers/core/screen-grid-layer/screen-grid-layer');

Object.defineProperty(exports, 'ScreenGridLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_screenGridLayer).default;
  }
});

var _gridLayer = require('./layers/core/grid-layer/grid-layer');

Object.defineProperty(exports, 'GridLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_gridLayer).default;
  }
});

var _gridCellLayer = require('./layers/core/grid-cell-layer/grid-cell-layer');

Object.defineProperty(exports, 'GridCellLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_gridCellLayer).default;
  }
});

var _hexagonLayer = require('./layers/core/hexagon-layer/hexagon-layer');

Object.defineProperty(exports, 'HexagonLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hexagonLayer).default;
  }
});

var _hexagonCellLayer = require('./layers/core/hexagon-cell-layer/hexagon-cell-layer');

Object.defineProperty(exports, 'HexagonCellLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hexagonCellLayer).default;
  }
});

var _pathLayer = require('./layers/core/path-layer/path-layer');

Object.defineProperty(exports, 'PathLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_pathLayer).default;
  }
});

var _polygonLayer = require('./layers/core/polygon-layer/polygon-layer');

Object.defineProperty(exports, 'PolygonLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_polygonLayer).default;
  }
});

var _geojsonLayer = require('./layers/core/geojson-layer/geojson-layer');

Object.defineProperty(exports, 'GeoJsonLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_geojsonLayer).default;
  }
});

var _choroplethLayer = require('./layers/deprecated/choropleth-layer/choropleth-layer');

Object.defineProperty(exports, 'ChoroplethLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_choroplethLayer).default;
  }
});

var _choroplethLayer2 = require('./layers/deprecated/choropleth-layer-64/choropleth-layer-64');

Object.defineProperty(exports, 'ChoroplethLayer64', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_choroplethLayer2).default;
  }
});

var _extrudedChoroplethLayer = require('./layers/deprecated/extruded-choropleth-layer-64/extruded-choropleth-layer-64');

Object.defineProperty(exports, 'ExtrudedChoroplethLayer64', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_extrudedChoroplethLayer).default;
  }
});

var _deckgl = require('./react/deckgl');

Object.defineProperty(exports, 'DeckGL', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_deckgl).default;
  }
});
Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_deckgl).default;
  }
});

var _get = require('./lib/utils/get');

var _count = require('./lib/utils/count');

var _lib2 = require('./experimental/lib');

var _reflectionEffect = require('./experimental/effects/reflection-effect');

var _reflectionEffect2 = _interopRequireDefault(_reflectionEffect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Experimental Features (May change in minor version bumps, use at your own risk)


var experimental = exports.experimental = {
  get: _get.get,
  count: _count.count,
  EffectManager: _lib2.EffectManager,
  Effect: _lib2.Effect,
  ReflectionEffect: _reflectionEffect2.default
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJhc3NlbWJsZVNoYWRlcnMiLCJMYXllciIsIkNvbXBvc2l0ZUxheWVyIiwiTGF5ZXJNYW5hZ2VyIiwiQXR0cmlidXRlTWFuYWdlciIsIkNPT1JESU5BVEVfU1lTVEVNIiwiZGVmYXVsdCIsImV4cGVyaW1lbnRhbCIsImdldCIsImNvdW50IiwiRWZmZWN0TWFuYWdlciIsIkVmZmVjdCIsIlJlZmxlY3Rpb25FZmZlY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozt3QkFzQlFBLGU7Ozs7Ozs7OztnQkFHQUMsSzs7Ozs7O2dCQUFPQyxjOzs7Ozs7Z0JBQWdCQyxZOzs7Ozs7Z0JBQWNDLGdCOzs7Ozs7Z0JBQ3JDQyxpQjs7Ozs7Ozs7OzZDQUVBQyxPOzs7Ozs7Ozs7d0RBQ0FBLE87Ozs7Ozs7Ozt5REFDQUEsTzs7Ozs7Ozs7O3dEQUNBQSxPOzs7Ozs7Ozs7NkNBR0FBLE87Ozs7Ozs7Ozs4Q0FDQUEsTzs7Ozs7Ozs7OzhDQUNBQSxPOzs7Ozs7Ozs7b0RBQ0FBLE87Ozs7Ozs7OztxREFDQUEsTzs7Ozs7Ozs7O29EQUVBQSxPOzs7Ozs7Ozs7OENBQ0FBLE87Ozs7Ozs7OztrREFDQUEsTzs7Ozs7Ozs7O2lEQUVBQSxPOzs7Ozs7Ozs7cURBQ0FBLE87Ozs7Ozs7Ozs4Q0FFQUEsTzs7Ozs7Ozs7O2lEQUNBQSxPOzs7Ozs7Ozs7aURBQ0FBLE87Ozs7Ozs7OztvREFHQUEsTzs7Ozs7Ozs7O3FEQUNBQSxPOzs7Ozs7Ozs7NERBQ0FBLE87Ozs7Ozs7OzsyQ0FHQUEsTzs7Ozs7OzJDQUNBQSxPOzs7O0FBR1I7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUpBOzs7QUFNTyxJQUFNQyxzQ0FBZTtBQUMxQkMsZUFEMEI7QUFFMUJDLHFCQUYwQjtBQUcxQkMsb0NBSDBCO0FBSTFCQyxzQkFKMEI7QUFLMUJDO0FBTDBCLENBQXJCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHQvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG4vLyBVdGlsaXRpZXNcbmV4cG9ydCB7YXNzZW1ibGVTaGFkZXJzfSBmcm9tICcuL3NoYWRlci11dGlscyc7XG5cbi8vIExpYlxuZXhwb3J0IHtMYXllciwgQ29tcG9zaXRlTGF5ZXIsIExheWVyTWFuYWdlciwgQXR0cmlidXRlTWFuYWdlcn0gZnJvbSAnLi9saWInO1xuZXhwb3J0IHtDT09SRElOQVRFX1NZU1RFTX0gZnJvbSAnLi9saWInO1xuLy8gVmlld3BvcnRzXG5leHBvcnQge2RlZmF1bHQgYXMgVmlld3BvcnR9IGZyb20gJy4vbGliL3ZpZXdwb3J0cy92aWV3cG9ydCc7XG5leHBvcnQge2RlZmF1bHQgYXMgUGVyc3BlY3RpdmVWaWV3cG9ydH0gZnJvbSAnLi9saWIvdmlld3BvcnRzL3BlcnNwZWN0aXZlLXZpZXdwb3J0JztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBPcnRob2dyYXBoaWNWaWV3cG9ydH0gZnJvbSAnLi9saWIvdmlld3BvcnRzL29ydGhvZ3JhcGhpYy12aWV3cG9ydCc7XG5leHBvcnQge2RlZmF1bHQgYXMgV2ViTWVyY2F0b3JWaWV3cG9ydH0gZnJvbSAnLi9saWIvdmlld3BvcnRzL3dlYi1tZXJjYXRvci12aWV3cG9ydCc7XG5cbi8vIENvcmUgTGF5ZXJzXG5leHBvcnQge2RlZmF1bHQgYXMgQXJjTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvYXJjLWxheWVyL2FyYy1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgSWNvbkxheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL2ljb24tbGF5ZXIvaWNvbi1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgTGluZUxheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL2xpbmUtbGF5ZXIvbGluZS1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgUG9pbnRDbG91ZExheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL3BvaW50LWNsb3VkLWxheWVyL3BvaW50LWNsb3VkLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBTY2F0dGVycGxvdExheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL3NjYXR0ZXJwbG90LWxheWVyL3NjYXR0ZXJwbG90LWxheWVyJztcblxuZXhwb3J0IHtkZWZhdWx0IGFzIFNjcmVlbkdyaWRMYXllcn0gZnJvbSAnLi9sYXllcnMvY29yZS9zY3JlZW4tZ3JpZC1sYXllci9zY3JlZW4tZ3JpZC1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgR3JpZExheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL2dyaWQtbGF5ZXIvZ3JpZC1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgR3JpZENlbGxMYXllcn0gZnJvbSAnLi9sYXllcnMvY29yZS9ncmlkLWNlbGwtbGF5ZXIvZ3JpZC1jZWxsLWxheWVyJztcblxuZXhwb3J0IHtkZWZhdWx0IGFzIEhleGFnb25MYXllcn0gZnJvbSAnLi9sYXllcnMvY29yZS9oZXhhZ29uLWxheWVyL2hleGFnb24tbGF5ZXInO1xuZXhwb3J0IHtkZWZhdWx0IGFzIEhleGFnb25DZWxsTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvaGV4YWdvbi1jZWxsLWxheWVyL2hleGFnb24tY2VsbC1sYXllcic7XG5cbmV4cG9ydCB7ZGVmYXVsdCBhcyBQYXRoTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvcGF0aC1sYXllci9wYXRoLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBQb2x5Z29uTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvcG9seWdvbi1sYXllci9wb2x5Z29uLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBHZW9Kc29uTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvZ2VvanNvbi1sYXllci9nZW9qc29uLWxheWVyJztcblxuLy8gRGVwcmVjYXRlZCBMYXllcnNcbmV4cG9ydCB7ZGVmYXVsdCBhcyBDaG9yb3BsZXRoTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2RlcHJlY2F0ZWQvY2hvcm9wbGV0aC1sYXllci9jaG9yb3BsZXRoLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBDaG9yb3BsZXRoTGF5ZXI2NH0gZnJvbSAnLi9sYXllcnMvZGVwcmVjYXRlZC9jaG9yb3BsZXRoLWxheWVyLTY0L2Nob3JvcGxldGgtbGF5ZXItNjQnO1xuZXhwb3J0IHtkZWZhdWx0IGFzIEV4dHJ1ZGVkQ2hvcm9wbGV0aExheWVyNjR9IGZyb20gJy4vbGF5ZXJzL2RlcHJlY2F0ZWQvZXh0cnVkZWQtY2hvcm9wbGV0aC1sYXllci02NC9leHRydWRlZC1jaG9yb3BsZXRoLWxheWVyLTY0JztcblxuLy8gUmVhY3QgZXhwb3J0c1xuZXhwb3J0IHtkZWZhdWx0IGFzIERlY2tHTH0gZnJvbSAnLi9yZWFjdC9kZWNrZ2wnO1xuZXhwb3J0IHtkZWZhdWx0IGFzIGRlZmF1bHR9IGZyb20gJy4vcmVhY3QvZGVja2dsJztcblxuLy8gRXhwZXJpbWVudGFsIEZlYXR1cmVzIChNYXkgY2hhbmdlIGluIG1pbm9yIHZlcnNpb24gYnVtcHMsIHVzZSBhdCB5b3VyIG93biByaXNrKVxuaW1wb3J0IHtnZXR9IGZyb20gJy4vbGliL3V0aWxzL2dldCc7XG5pbXBvcnQge2NvdW50fSBmcm9tICcuL2xpYi91dGlscy9jb3VudCc7XG5pbXBvcnQge0VmZmVjdE1hbmFnZXIsIEVmZmVjdH0gZnJvbSAnLi9leHBlcmltZW50YWwvbGliJztcbmltcG9ydCB7ZGVmYXVsdCBhcyBSZWZsZWN0aW9uRWZmZWN0fSBmcm9tICcuL2V4cGVyaW1lbnRhbC9lZmZlY3RzL3JlZmxlY3Rpb24tZWZmZWN0JztcblxuZXhwb3J0IGNvbnN0IGV4cGVyaW1lbnRhbCA9IHtcbiAgZ2V0LFxuICBjb3VudCxcbiAgRWZmZWN0TWFuYWdlcixcbiAgRWZmZWN0LFxuICBSZWZsZWN0aW9uRWZmZWN0XG59O1xuIl19
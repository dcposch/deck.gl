'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.experimental = exports.default = exports.DeckGL = exports.autobind = exports.ExtrudedChoroplethLayer64 = exports.ChoroplethLayer64 = exports.ChoroplethLayer = exports.LineLayer64 = exports.ArcLayer64 = exports.ScatterplotLayer64 = exports.GeoJsonLayer = exports.PolygonLayer = exports.PathLayer = exports.ScreenGridLayer = exports.ScatterplotLayer = exports.LineLayer = exports.IconLayer = exports.HexagonLayer = exports.GridLayer = exports.ArcLayer = exports.AttributeManager = exports.LayerManager = exports.Layer = exports.COORDINATE_SYSTEM = exports.assembleShaders = undefined;

var _shaderUtils = require('./shader-utils');

Object.defineProperty(exports, 'assembleShaders', {
  enumerable: true,
  get: function get() {
    return _shaderUtils.assembleShaders;
  }
});

var _lib = require('./lib');

Object.defineProperty(exports, 'COORDINATE_SYSTEM', {
  enumerable: true,
  get: function get() {
    return _lib.COORDINATE_SYSTEM;
  }
});
Object.defineProperty(exports, 'Layer', {
  enumerable: true,
  get: function get() {
    return _lib.Layer;
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

var _arcLayer = require('./layers/core/arc-layer/arc-layer');

Object.defineProperty(exports, 'ArcLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_arcLayer).default;
  }
});

var _gridLayer = require('./layers/core/grid-layer/grid-layer');

Object.defineProperty(exports, 'GridLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_gridLayer).default;
  }
});

var _hexagonLayer = require('./layers/core/hexagon-layer/hexagon-layer');

Object.defineProperty(exports, 'HexagonLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hexagonLayer).default;
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

var _scatterplotLayer2 = require('./layers/fp64/scatterplot-layer');

Object.defineProperty(exports, 'ScatterplotLayer64', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_scatterplotLayer2).default;
  }
});

var _arcLayer2 = require('./layers/fp64/arc-layer');

Object.defineProperty(exports, 'ArcLayer64', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_arcLayer2).default;
  }
});

var _lineLayer2 = require('./layers/fp64/line-layer');

Object.defineProperty(exports, 'LineLayer64', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_lineLayer2).default;
  }
});

var _choroplethLayer = require('./layers/deprecated/choropleth-layer');

Object.defineProperty(exports, 'ChoroplethLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_choroplethLayer).default;
  }
});

var _choroplethLayer2 = require('./layers/deprecated/choropleth-layer-64');

Object.defineProperty(exports, 'ChoroplethLayer64', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_choroplethLayer2).default;
  }
});

var _extrudedChoroplethLayer = require('./layers/deprecated/extruded-choropleth-layer-64');

Object.defineProperty(exports, 'ExtrudedChoroplethLayer64', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_extrudedChoroplethLayer).default;
  }
});

var _autobind = require('./react/autobind');

Object.defineProperty(exports, 'autobind', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_autobind).default;
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

var _lib2 = require('./experimental/lib');

var _reflectionEffect = require('./experimental/effects/reflection-effect');

var _reflectionEffect2 = _interopRequireDefault(_reflectionEffect);

var _container = require('./lib/utils/container');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Effects


// Experimental


var experimental = exports.experimental = {
  get: _container.get,
  EffectManager: _lib2.EffectManager,
  Effect: _lib2.Effect,
  ReflectionEffect: _reflectionEffect2.default
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJhc3NlbWJsZVNoYWRlcnMiLCJDT09SRElOQVRFX1NZU1RFTSIsIkxheWVyIiwiTGF5ZXJNYW5hZ2VyIiwiQXR0cmlidXRlTWFuYWdlciIsImRlZmF1bHQiLCJleHBlcmltZW50YWwiLCJnZXQiLCJFZmZlY3RNYW5hZ2VyIiwiRWZmZWN0IiwiUmVmbGVjdGlvbkVmZmVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O3dCQXNCUUEsZTs7Ozs7Ozs7O2dCQUdBQyxpQjs7Ozs7O2dCQUFtQkMsSzs7Ozs7O2dCQUFPQyxZOzs7Ozs7Z0JBQWNDLGdCOzs7Ozs7Ozs7NkNBR3hDQyxPOzs7Ozs7Ozs7OENBQ0FBLE87Ozs7Ozs7OztpREFDQUEsTzs7Ozs7Ozs7OzhDQUNBQSxPOzs7Ozs7Ozs7OENBQ0FBLE87Ozs7Ozs7OztxREFDQUEsTzs7Ozs7Ozs7O29EQUNBQSxPOzs7Ozs7Ozs7OENBRUFBLE87Ozs7Ozs7OztpREFDQUEsTzs7Ozs7Ozs7O2lEQUNBQSxPOzs7Ozs7Ozs7c0RBR0FBLE87Ozs7Ozs7Ozs4Q0FDQUEsTzs7Ozs7Ozs7OytDQUNBQSxPOzs7Ozs7Ozs7b0RBR0FBLE87Ozs7Ozs7OztxREFDQUEsTzs7Ozs7Ozs7OzREQUNBQSxPOzs7Ozs7Ozs7NkNBR0FBLE87Ozs7Ozs7OzsyQ0FDQUEsTzs7Ozs7OzJDQUNBQSxPOzs7O0FBR1I7O0FBQ0E7Ozs7QUFHQTs7OztBQUxBOzs7QUFJQTs7O0FBR08sSUFBTUMsc0NBQWU7QUFDMUJDLHFCQUQwQjtBQUUxQkMsb0NBRjBCO0FBRzFCQyxzQkFIMEI7QUFJMUJDO0FBSjBCLENBQXJCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuLy8gVXRpbGl0aWVzXG5leHBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi9zaGFkZXItdXRpbHMnO1xuXG4vLyBMaWJcbmV4cG9ydCB7Q09PUkRJTkFURV9TWVNURU0sIExheWVyLCBMYXllck1hbmFnZXIsIEF0dHJpYnV0ZU1hbmFnZXJ9IGZyb20gJy4vbGliJztcblxuLy8gQ29yZSBMYXllcnNcbmV4cG9ydCB7ZGVmYXVsdCBhcyBBcmNMYXllcn0gZnJvbSAnLi9sYXllcnMvY29yZS9hcmMtbGF5ZXIvYXJjLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBHcmlkTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvZ3JpZC1sYXllci9ncmlkLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBIZXhhZ29uTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvaGV4YWdvbi1sYXllci9oZXhhZ29uLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBJY29uTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvaWNvbi1sYXllci9pY29uLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBMaW5lTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvbGluZS1sYXllci9saW5lLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBTY2F0dGVycGxvdExheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL3NjYXR0ZXJwbG90LWxheWVyL3NjYXR0ZXJwbG90LWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBTY3JlZW5HcmlkTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2NvcmUvc2NyZWVuLWdyaWQtbGF5ZXIvc2NyZWVuLWdyaWQtbGF5ZXInO1xuXG5leHBvcnQge2RlZmF1bHQgYXMgUGF0aExheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL3BhdGgtbGF5ZXIvcGF0aC1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgUG9seWdvbkxheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL3BvbHlnb24tbGF5ZXIvcG9seWdvbi1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgR2VvSnNvbkxheWVyfSBmcm9tICcuL2xheWVycy9jb3JlL2dlb2pzb24tbGF5ZXIvZ2VvanNvbi1sYXllcic7XG5cbi8vIDY0LWJpdCBMYXllcnNcbmV4cG9ydCB7ZGVmYXVsdCBhcyBTY2F0dGVycGxvdExheWVyNjR9IGZyb20gJy4vbGF5ZXJzL2ZwNjQvc2NhdHRlcnBsb3QtbGF5ZXInO1xuZXhwb3J0IHtkZWZhdWx0IGFzIEFyY0xheWVyNjR9IGZyb20gJy4vbGF5ZXJzL2ZwNjQvYXJjLWxheWVyJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBMaW5lTGF5ZXI2NH0gZnJvbSAnLi9sYXllcnMvZnA2NC9saW5lLWxheWVyJztcblxuLy8gRGVwcmVjYXRlZCBMYXllcnNcbmV4cG9ydCB7ZGVmYXVsdCBhcyBDaG9yb3BsZXRoTGF5ZXJ9IGZyb20gJy4vbGF5ZXJzL2RlcHJlY2F0ZWQvY2hvcm9wbGV0aC1sYXllcic7XG5leHBvcnQge2RlZmF1bHQgYXMgQ2hvcm9wbGV0aExheWVyNjR9IGZyb20gJy4vbGF5ZXJzL2RlcHJlY2F0ZWQvY2hvcm9wbGV0aC1sYXllci02NCc7XG5leHBvcnQge2RlZmF1bHQgYXMgRXh0cnVkZWRDaG9yb3BsZXRoTGF5ZXI2NH0gZnJvbSAnLi9sYXllcnMvZGVwcmVjYXRlZC9leHRydWRlZC1jaG9yb3BsZXRoLWxheWVyLTY0JztcblxuLy8gUmVhY3QgZXhwb3J0c1xuZXhwb3J0IHtkZWZhdWx0IGFzIGF1dG9iaW5kfSBmcm9tICcuL3JlYWN0L2F1dG9iaW5kJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBEZWNrR0x9IGZyb20gJy4vcmVhY3QvZGVja2dsJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBkZWZhdWx0fSBmcm9tICcuL3JlYWN0L2RlY2tnbCc7XG5cbi8vIEVmZmVjdHNcbmltcG9ydCB7RWZmZWN0TWFuYWdlciwgRWZmZWN0fSBmcm9tICcuL2V4cGVyaW1lbnRhbC9saWInO1xuaW1wb3J0IHtkZWZhdWx0IGFzIFJlZmxlY3Rpb25FZmZlY3R9IGZyb20gJy4vZXhwZXJpbWVudGFsL2VmZmVjdHMvcmVmbGVjdGlvbi1lZmZlY3QnO1xuXG4vLyBFeHBlcmltZW50YWxcbmltcG9ydCB7Z2V0fSBmcm9tICcuL2xpYi91dGlscy9jb250YWluZXInO1xuXG5leHBvcnQgY29uc3QgZXhwZXJpbWVudGFsID0ge1xuICBnZXQsXG4gIEVmZmVjdE1hbmFnZXIsXG4gIEVmZmVjdCxcbiAgUmVmbGVjdGlvbkVmZmVjdFxufTtcbiJdfQ==
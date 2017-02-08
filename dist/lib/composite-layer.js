'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _layer = require('./layer');

var _layer2 = _interopRequireDefault(_layer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CompositeLayer = function (_Layer) {
  _inherits(CompositeLayer, _Layer);

  function CompositeLayer(props) {
    _classCallCheck(this, CompositeLayer);

    return _possibleConstructorReturn(this, (CompositeLayer.__proto__ || Object.getPrototypeOf(CompositeLayer)).call(this, props));
  }

  // initializeState is usually not needed for composite layers
  // Provide empty definition to disable check for missing definition


  _createClass(CompositeLayer, [{
    key: 'initializeState',
    value: function initializeState() {}

    // No-op for the invalidateAttribute function as the composite
    // layer has no AttributeManager

  }, {
    key: 'invalidateAttribute',
    value: function invalidateAttribute() {}
  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(opts) {
      // do not call onHover/onClick on the container
      return null;
    }
  }]);

  return CompositeLayer;
}(_layer2.default);

exports.default = CompositeLayer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvY29tcG9zaXRlLWxheWVyLmpzIl0sIm5hbWVzIjpbIkNvbXBvc2l0ZUxheWVyIiwicHJvcHMiLCJvcHRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7SUFFcUJBLGM7OztBQUNuQiwwQkFBWUMsS0FBWixFQUFtQjtBQUFBOztBQUFBLDJIQUNYQSxLQURXO0FBRWxCOztBQUVEO0FBQ0E7Ozs7O3NDQUNrQixDQUNqQjs7QUFFRDtBQUNBOzs7OzBDQUNzQixDQUNyQjs7O21DQUVjQyxJLEVBQU07QUFDbkI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQWxCa0JGLGMiLCJmaWxlIjoiY29tcG9zaXRlLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IExheWVyIGZyb20gJy4vbGF5ZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21wb3NpdGVMYXllciBleHRlbmRzIExheWVyIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gIH1cblxuICAvLyBpbml0aWFsaXplU3RhdGUgaXMgdXN1YWxseSBub3QgbmVlZGVkIGZvciBjb21wb3NpdGUgbGF5ZXJzXG4gIC8vIFByb3ZpZGUgZW1wdHkgZGVmaW5pdGlvbiB0byBkaXNhYmxlIGNoZWNrIGZvciBtaXNzaW5nIGRlZmluaXRpb25cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICB9XG5cbiAgLy8gTm8tb3AgZm9yIHRoZSBpbnZhbGlkYXRlQXR0cmlidXRlIGZ1bmN0aW9uIGFzIHRoZSBjb21wb3NpdGVcbiAgLy8gbGF5ZXIgaGFzIG5vIEF0dHJpYnV0ZU1hbmFnZXJcbiAgaW52YWxpZGF0ZUF0dHJpYnV0ZSgpIHtcbiAgfVxuXG4gIGdldFBpY2tpbmdJbmZvKG9wdHMpIHtcbiAgICAvLyBkbyBub3QgY2FsbCBvbkhvdmVyL29uQ2xpY2sgb24gdGhlIGNvbnRhaW5lclxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=
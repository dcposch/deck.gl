'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _viewport = require('./viewport');

var _viewport2 = _interopRequireDefault(_viewport);

var _glMatrix = require('gl-matrix');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OrthographicViewport = function (_Viewport) {
  _inherits(OrthographicViewport, _Viewport);

  function OrthographicViewport(_ref) {
    var width = _ref.width,
        height = _ref.height,
        _ref$eye = _ref.eye,
        eye = _ref$eye === undefined ? [0, 0, 1] : _ref$eye,
        _ref$lookAt = _ref.lookAt,
        lookAt = _ref$lookAt === undefined ? [0, 0, 0] : _ref$lookAt,
        _ref$up = _ref.up,
        up = _ref$up === undefined ? [0, 1, 0] : _ref$up,
        _ref$near = _ref.near,
        near = _ref$near === undefined ? 1 : _ref$near,
        _ref$far = _ref.far,
        far = _ref$far === undefined ? 100 : _ref$far,
        left = _ref.left,
        top = _ref.top,
        _ref$right = _ref.right,
        right = _ref$right === undefined ? null : _ref$right,
        _ref$bottom = _ref.bottom,
        bottom = _ref$bottom === undefined ? null : _ref$bottom;

    _classCallCheck(this, OrthographicViewport);

    right = Number.isFinite(right) ? right : left + width;
    bottom = Number.isFinite(bottom) ? bottom : top + height;
    return _possibleConstructorReturn(this, (OrthographicViewport.__proto__ || Object.getPrototypeOf(OrthographicViewport)).call(this, {
      viewMatrix: _glMatrix.mat4.lookAt([], eye, lookAt, up),
      projectionMatrix: _glMatrix.mat4.ortho([], left, right, bottom, top, near, far),
      width: width,
      height: height
    }));
  }

  return OrthographicViewport;
}(_viewport2.default);

exports.default = OrthographicViewport;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdmlld3BvcnRzL29ydGhvZ3JhcGhpYy12aWV3cG9ydC5qcyJdLCJuYW1lcyI6WyJPcnRob2dyYXBoaWNWaWV3cG9ydCIsIndpZHRoIiwiaGVpZ2h0IiwiZXllIiwibG9va0F0IiwidXAiLCJuZWFyIiwiZmFyIiwibGVmdCIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJ2aWV3TWF0cml4IiwicHJvamVjdGlvbk1hdHJpeCIsIm9ydGhvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7Ozs7O0lBRXFCQSxvQjs7O0FBQ25CLHNDQWdCRztBQUFBLFFBZERDLEtBY0MsUUFkREEsS0FjQztBQUFBLFFBYkRDLE1BYUMsUUFiREEsTUFhQztBQUFBLHdCQVhEQyxHQVdDO0FBQUEsUUFYREEsR0FXQyw0QkFYSyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQVdMO0FBQUEsMkJBVkRDLE1BVUM7QUFBQSxRQVZEQSxNQVVDLCtCQVZRLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBVVI7QUFBQSx1QkFUREMsRUFTQztBQUFBLFFBVERBLEVBU0MsMkJBVEksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FTSjtBQUFBLHlCQVBEQyxJQU9DO0FBQUEsUUFQREEsSUFPQyw2QkFQTSxDQU9OO0FBQUEsd0JBTkRDLEdBTUM7QUFBQSxRQU5EQSxHQU1DLDRCQU5LLEdBTUw7QUFBQSxRQUxEQyxJQUtDLFFBTERBLElBS0M7QUFBQSxRQUpEQyxHQUlDLFFBSkRBLEdBSUM7QUFBQSwwQkFGREMsS0FFQztBQUFBLFFBRkRBLEtBRUMsOEJBRk8sSUFFUDtBQUFBLDJCQUREQyxNQUNDO0FBQUEsUUFEREEsTUFDQywrQkFEUSxJQUNSOztBQUFBOztBQUNERCxZQUFRRSxPQUFPQyxRQUFQLENBQWdCSCxLQUFoQixJQUF5QkEsS0FBekIsR0FBaUNGLE9BQU9QLEtBQWhEO0FBQ0FVLGFBQVNDLE9BQU9DLFFBQVAsQ0FBZ0JGLE1BQWhCLElBQTBCQSxNQUExQixHQUFtQ0YsTUFBTVAsTUFBbEQ7QUFGQyx1SUFHSztBQUNKWSxrQkFBWSxlQUFLVixNQUFMLENBQVksRUFBWixFQUFnQkQsR0FBaEIsRUFBcUJDLE1BQXJCLEVBQTZCQyxFQUE3QixDQURSO0FBRUpVLHdCQUFrQixlQUFLQyxLQUFMLENBQVcsRUFBWCxFQUFlUixJQUFmLEVBQXFCRSxLQUFyQixFQUE0QkMsTUFBNUIsRUFBb0NGLEdBQXBDLEVBQXlDSCxJQUF6QyxFQUErQ0MsR0FBL0MsQ0FGZDtBQUdKTixrQkFISTtBQUlKQztBQUpJLEtBSEw7QUFTRjs7Ozs7a0JBMUJrQkYsb0IiLCJmaWxlIjoib3J0aG9ncmFwaGljLXZpZXdwb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZpZXdwb3J0IGZyb20gJy4vdmlld3BvcnQnO1xuaW1wb3J0IHttYXQ0fSBmcm9tICdnbC1tYXRyaXgnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcnRob2dyYXBoaWNWaWV3cG9ydCBleHRlbmRzIFZpZXdwb3J0IHtcbiAgY29uc3RydWN0b3Ioe1xuICAgIC8vIHZpZXdwb3J0IGFyZ3VtZW50c1xuICAgIHdpZHRoLCAvLyBXaWR0aCBvZiB2aWV3cG9ydFxuICAgIGhlaWdodCwgLy8gSGVpZ2h0IG9mIHZpZXdwb3J0XG4gICAgLy8gdmlldyBtYXRyaXggYXJndW1lbnRzXG4gICAgZXllID0gWzAsIDAsIDFdLCAvLyBEZWZpbmVzIGV5ZSBwb3NpdGlvbiwgZGVmYXVsdCB1bml0IGRpc3RhbmNlIGFsb25nIHogYXhpc1xuICAgIGxvb2tBdCA9IFswLCAwLCAwXSwgLy8gV2hpY2ggcG9pbnQgaXMgY2FtZXJhIGxvb2tpbmcgYXQsIGRlZmF1bHQgb3JpZ2luXG4gICAgdXAgPSBbMCwgMSwgMF0sIC8vIERlZmluZXMgdXAgZGlyZWN0aW9uLCBkZWZhdWx0IHBvc2l0aXZlIHkgYXhpc1xuICAgIC8vIHByb2plY3Rpb24gbWF0cml4IGFyZ3VtZW50c1xuICAgIG5lYXIgPSAxLCAvLyBEaXN0YW5jZSBvZiBuZWFyIGNsaXBwaW5nIHBsYW5lXG4gICAgZmFyID0gMTAwLCAvLyBEaXN0YW5jZSBvZiBmYXIgY2xpcHBpbmcgcGxhbmVcbiAgICBsZWZ0LCAvLyBMZWZ0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gICAgdG9wLCAvLyBUb3AgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAgICAvLyBhdXRvbWF0aWNhbGx5IGNhbGN1bGF0ZWRcbiAgICByaWdodCA9IG51bGwsIC8vIFJpZ2h0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gICAgYm90dG9tID0gbnVsbCAvLyBCb3R0b20gYm91bmQgb2YgdGhlIGZydXN0dW1cbiAgfSkge1xuICAgIHJpZ2h0ID0gTnVtYmVyLmlzRmluaXRlKHJpZ2h0KSA/IHJpZ2h0IDogbGVmdCArIHdpZHRoO1xuICAgIGJvdHRvbSA9IE51bWJlci5pc0Zpbml0ZShib3R0b20pID8gYm90dG9tIDogdG9wICsgaGVpZ2h0O1xuICAgIHN1cGVyKHtcbiAgICAgIHZpZXdNYXRyaXg6IG1hdDQubG9va0F0KFtdLCBleWUsIGxvb2tBdCwgdXApLFxuICAgICAgcHJvamVjdGlvbk1hdHJpeDogbWF0NC5vcnRobyhbXSwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpLFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHRcbiAgICB9KTtcbiAgfVxufVxuIl19
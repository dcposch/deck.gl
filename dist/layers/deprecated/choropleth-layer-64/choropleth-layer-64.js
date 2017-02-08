'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _choroplethLayer = require('../choropleth-layer/choropleth-layer');

var _choroplethLayer2 = _interopRequireDefault(_choroplethLayer);

var _utils = require('../../../lib/utils');

var _lodash = require('lodash.flattendeep');

var _lodash2 = _interopRequireDefault(_lodash);

var _choroplethLayerVertex = require('./choropleth-layer-vertex-64.glsl');

var _choroplethLayerVertex2 = _interopRequireDefault(_choroplethLayerVertex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var ChoroplethLayer64 = function (_ChoroplethLayer) {
  _inherits(ChoroplethLayer64, _ChoroplethLayer);

  function ChoroplethLayer64(props) {
    _classCallCheck(this, ChoroplethLayer64);

    var _this = _possibleConstructorReturn(this, (ChoroplethLayer64.__proto__ || Object.getPrototypeOf(ChoroplethLayer64)).call(this, props));

    _utils.log.once('ChoroplethLayer64 is deprecated. Consider using GeoJsonLayer instead');
    return _this;
  }

  _createClass(ChoroplethLayer64, [{
    key: 'initializeState',
    value: function initializeState() {
      _get(ChoroplethLayer64.prototype.__proto__ || Object.getPrototypeOf(ChoroplethLayer64.prototype), 'initializeState', this).call(this);

      this.state.attributeManager.addDynamic({
        positions64: { size: 4, update: this.calculatePositions64 },
        heights64: { size: 2, update: this.calculateHeights64 }
      });
    }
  }, {
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: _choroplethLayerVertex2.default,
        fs: _get(ChoroplethLayer64.prototype.__proto__ || Object.getPrototypeOf(ChoroplethLayer64.prototype), 'getShaders', this).call(this).fs,
        fp64: true,
        project64: true
      };
    }
  }, {
    key: 'calculatePositions64',
    value: function calculatePositions64(attribute) {
      var vertices = (0, _lodash2.default)(this.state.choropleths);
      attribute.value = new Float32Array(vertices.length / 3 * 4);
      for (var index = 0; index < vertices.length / 3; index++) {
        var _fp64ify = (0, _utils.fp64ify)(vertices[index * 3]);

        var _fp64ify2 = _slicedToArray(_fp64ify, 2);

        attribute.value[index * 4] = _fp64ify2[0];
        attribute.value[index * 4 + 1] = _fp64ify2[1];

        var _fp64ify3 = (0, _utils.fp64ify)(vertices[index * 3 + 1]);

        var _fp64ify4 = _slicedToArray(_fp64ify3, 2);

        attribute.value[index * 4 + 2] = _fp64ify4[0];
        attribute.value[index * 4 + 3] = _fp64ify4[1];
      }
    }
  }, {
    key: 'calculateHeights64',
    value: function calculateHeights64(attribute) {
      var vertices = (0, _lodash2.default)(this.state.choropleths);
      attribute.value = new Float32Array(vertices.length / 3 * 2);
      for (var index = 0; index < vertices.length / 3; index++) {
        var _fp64ify5 = (0, _utils.fp64ify)(vertices[index * 3 + 2]);

        var _fp64ify6 = _slicedToArray(_fp64ify5, 2);

        attribute.value[index * 2] = _fp64ify6[0];
        attribute.value[index * 2 + 1] = _fp64ify6[1];
      }
    }
  }]);

  return ChoroplethLayer64;
}(_choroplethLayer2.default);

exports.default = ChoroplethLayer64;


ChoroplethLayer64.layerName = 'ChoroplethLayer64';
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9jaG9yb3BsZXRoLWxheWVyLTY0L2Nob3JvcGxldGgtbGF5ZXItNjQuanMiXSwibmFtZXMiOlsiQ2hvcm9wbGV0aExheWVyNjQiLCJwcm9wcyIsIm9uY2UiLCJzdGF0ZSIsImF0dHJpYnV0ZU1hbmFnZXIiLCJhZGREeW5hbWljIiwicG9zaXRpb25zNjQiLCJzaXplIiwidXBkYXRlIiwiY2FsY3VsYXRlUG9zaXRpb25zNjQiLCJoZWlnaHRzNjQiLCJjYWxjdWxhdGVIZWlnaHRzNjQiLCJ2cyIsImZzIiwiZnA2NCIsInByb2plY3Q2NCIsImF0dHJpYnV0ZSIsInZlcnRpY2VzIiwiY2hvcm9wbGV0aHMiLCJ2YWx1ZSIsIkZsb2F0MzJBcnJheSIsImxlbmd0aCIsImluZGV4IiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFvQkE7Ozs7QUFDQTs7QUFDQTs7OztBQUVBOzs7Ozs7Ozs7OytlQXhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFRcUJBLGlCOzs7QUFFbkIsNkJBQVlDLEtBQVosRUFBbUI7QUFBQTs7QUFBQSxzSUFDWEEsS0FEVzs7QUFFakIsZUFBSUMsSUFBSixDQUFTLHNFQUFUO0FBRmlCO0FBR2xCOzs7O3NDQUVpQjtBQUNoQjs7QUFFQSxXQUFLQyxLQUFMLENBQVdDLGdCQUFYLENBQTRCQyxVQUE1QixDQUF1QztBQUNyQ0MscUJBQWEsRUFBQ0MsTUFBTSxDQUFQLEVBQVVDLFFBQVEsS0FBS0Msb0JBQXZCLEVBRHdCO0FBRXJDQyxtQkFBVyxFQUFDSCxNQUFNLENBQVAsRUFBVUMsUUFBUSxLQUFLRyxrQkFBdkI7QUFGMEIsT0FBdkM7QUFJRDs7O2lDQUVZO0FBQ1gsYUFBTztBQUNMQywyQ0FESztBQUVMQyxZQUFJLGlJQUFtQkEsRUFGbEI7QUFHTEMsY0FBTSxJQUhEO0FBSUxDLG1CQUFXO0FBSk4sT0FBUDtBQU1EOzs7eUNBRW9CQyxTLEVBQVc7QUFDOUIsVUFBTUMsV0FBVyxzQkFBWSxLQUFLZCxLQUFMLENBQVdlLFdBQXZCLENBQWpCO0FBQ0FGLGdCQUFVRyxLQUFWLEdBQWtCLElBQUlDLFlBQUosQ0FBaUJILFNBQVNJLE1BQVQsR0FBa0IsQ0FBbEIsR0FBc0IsQ0FBdkMsQ0FBbEI7QUFDQSxXQUFLLElBQUlDLFFBQVEsQ0FBakIsRUFBb0JBLFFBQVFMLFNBQVNJLE1BQVQsR0FBa0IsQ0FBOUMsRUFBaURDLE9BQWpELEVBQTBEO0FBQUEsdUJBSXBELG9CQUFRTCxTQUFTSyxRQUFRLENBQWpCLENBQVIsQ0FKb0Q7O0FBQUE7O0FBRXRETixrQkFBVUcsS0FBVixDQUFnQkcsUUFBUSxDQUF4QixDQUZzRDtBQUd0RE4sa0JBQVVHLEtBQVYsQ0FBZ0JHLFFBQVEsQ0FBUixHQUFZLENBQTVCLENBSHNEOztBQUFBLHdCQVFwRCxvQkFBUUwsU0FBU0ssUUFBUSxDQUFSLEdBQVksQ0FBckIsQ0FBUixDQVJvRDs7QUFBQTs7QUFNdEROLGtCQUFVRyxLQUFWLENBQWdCRyxRQUFRLENBQVIsR0FBWSxDQUE1QixDQU5zRDtBQU90RE4sa0JBQVVHLEtBQVYsQ0FBZ0JHLFFBQVEsQ0FBUixHQUFZLENBQTVCLENBUHNEO0FBU3pEO0FBQ0Y7Ozt1Q0FFa0JOLFMsRUFBVztBQUM1QixVQUFNQyxXQUFXLHNCQUFZLEtBQUtkLEtBQUwsQ0FBV2UsV0FBdkIsQ0FBakI7QUFDQUYsZ0JBQVVHLEtBQVYsR0FBa0IsSUFBSUMsWUFBSixDQUFpQkgsU0FBU0ksTUFBVCxHQUFrQixDQUFsQixHQUFzQixDQUF2QyxDQUFsQjtBQUNBLFdBQUssSUFBSUMsUUFBUSxDQUFqQixFQUFvQkEsUUFBUUwsU0FBU0ksTUFBVCxHQUFrQixDQUE5QyxFQUFpREMsT0FBakQsRUFBMEQ7QUFBQSx3QkFJcEQsb0JBQVFMLFNBQVNLLFFBQVEsQ0FBUixHQUFZLENBQXJCLENBQVIsQ0FKb0Q7O0FBQUE7O0FBRXRETixrQkFBVUcsS0FBVixDQUFnQkcsUUFBUSxDQUF4QixDQUZzRDtBQUd0RE4sa0JBQVVHLEtBQVYsQ0FBZ0JHLFFBQVEsQ0FBUixHQUFZLENBQTVCLENBSHNEO0FBS3pEO0FBQ0Y7Ozs7OztrQkFqRGtCdEIsaUI7OztBQW9EckJBLGtCQUFrQnVCLFNBQWxCLEdBQThCLG1CQUE5QiIsImZpbGUiOiJjaG9yb3BsZXRoLWxheWVyLTY0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IENob3JvcGxldGhMYXllciBmcm9tICcuLi9jaG9yb3BsZXRoLWxheWVyL2Nob3JvcGxldGgtbGF5ZXInO1xuaW1wb3J0IHtmcDY0aWZ5LCBsb2d9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscyc7XG5pbXBvcnQgZmxhdHRlbkRlZXAgZnJvbSAnbG9kYXNoLmZsYXR0ZW5kZWVwJztcblxuaW1wb3J0IGNob3JvcGxldGhWZXJ0ZXg2NCBmcm9tICcuL2Nob3JvcGxldGgtbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaG9yb3BsZXRoTGF5ZXI2NCBleHRlbmRzIENob3JvcGxldGhMYXllciB7XG5cbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gICAgbG9nLm9uY2UoJ0Nob3JvcGxldGhMYXllcjY0IGlzIGRlcHJlY2F0ZWQuIENvbnNpZGVyIHVzaW5nIEdlb0pzb25MYXllciBpbnN0ZWFkJyk7XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgc3VwZXIuaW5pdGlhbGl6ZVN0YXRlKCk7XG5cbiAgICB0aGlzLnN0YXRlLmF0dHJpYnV0ZU1hbmFnZXIuYWRkRHluYW1pYyh7XG4gICAgICBwb3NpdGlvbnM2NDoge3NpemU6IDQsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnM2NH0sXG4gICAgICBoZWlnaHRzNjQ6IHtzaXplOiAyLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSGVpZ2h0czY0fVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdnM6IGNob3JvcGxldGhWZXJ0ZXg2NCxcbiAgICAgIGZzOiBzdXBlci5nZXRTaGFkZXJzKCkuZnMsXG4gICAgICBmcDY0OiB0cnVlLFxuICAgICAgcHJvamVjdDY0OiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVBvc2l0aW9uczY0KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHZlcnRpY2VzID0gZmxhdHRlbkRlZXAodGhpcy5zdGF0ZS5jaG9yb3BsZXRocyk7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlcy5sZW5ndGggLyAzICogNCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHZlcnRpY2VzLmxlbmd0aCAvIDM7IGluZGV4KyspIHtcbiAgICAgIFtcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlW2luZGV4ICogNF0sXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZVtpbmRleCAqIDQgKyAxXVxuICAgICAgXSA9IGZwNjRpZnkodmVydGljZXNbaW5kZXggKiAzXSk7XG4gICAgICBbXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZVtpbmRleCAqIDQgKyAyXSxcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlW2luZGV4ICogNCArIDNdXG4gICAgICBdID0gZnA2NGlmeSh2ZXJ0aWNlc1tpbmRleCAqIDMgKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSGVpZ2h0czY0KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHZlcnRpY2VzID0gZmxhdHRlbkRlZXAodGhpcy5zdGF0ZS5jaG9yb3BsZXRocyk7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlcy5sZW5ndGggLyAzICogMik7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHZlcnRpY2VzLmxlbmd0aCAvIDM7IGluZGV4KyspIHtcbiAgICAgIFtcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlW2luZGV4ICogMl0sXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZVtpbmRleCAqIDIgKyAxXVxuICAgICAgXSA9IGZwNjRpZnkodmVydGljZXNbaW5kZXggKiAzICsgMl0pO1xuICAgIH1cbiAgfVxufVxuXG5DaG9yb3BsZXRoTGF5ZXI2NC5sYXllck5hbWUgPSAnQ2hvcm9wbGV0aExheWVyNjQnO1xuIl19
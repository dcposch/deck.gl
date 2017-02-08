'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _screenGridLayerVertex = require('./screen-grid-layer-vertex.glsl');

var _screenGridLayerVertex2 = _interopRequireDefault(_screenGridLayerVertex);

var _screenGridLayerFragment = require('./screen-grid-layer-fragment.glsl');

var _screenGridLayerFragment2 = _interopRequireDefault(_screenGridLayerFragment);

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

var defaultProps = {
  cellSizePixels: 100,

  // Color range?
  minColor: [0, 0, 0, 255],
  maxColor: [0, 255, 0, 255],

  getPosition: function getPosition(d) {
    return d.position;
  },
  getWeight: function getWeight(d) {
    return 1;
  }
};

var ScreenGridLayer = function (_Layer) {
  _inherits(ScreenGridLayer, _Layer);

  _createClass(ScreenGridLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: _screenGridLayerVertex2.default,
        fs: _screenGridLayerFragment2.default
      };
    }
  }]);

  function ScreenGridLayer(props) {
    _classCallCheck(this, ScreenGridLayer);

    var _this = _possibleConstructorReturn(this, (ScreenGridLayer.__proto__ || Object.getPrototypeOf(ScreenGridLayer)).call(this, props));

    _this._checkRemovedProp('unitWidth', 'cellSizePixels');
    _this._checkRemovedProp('unitHeight', 'cellSizePixels');
    return _this;
  }

  _createClass(ScreenGridLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.state.attributeManager;
      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instancePositions: { size: 3, update: this.calculateInstancePositions },
        instanceCount: { size: 1, accessor: ['getPosition', 'getWeight'], update: this.calculateInstanceCount }
      });
      /* eslint-disable max-len */

      var gl = this.context.gl;

      this.setState({ model: this.getModel(gl) });
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      _get(ScreenGridLayer.prototype.__proto__ || Object.getPrototypeOf(ScreenGridLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      var cellSizeChanged = props.cellSizePixels !== oldProps.cellSizePixels;

      if (cellSizeChanged || changeFlags.viewportChanged) {
        this.updateCell();
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
      var _props = this.props,
          minColor = _props.minColor,
          maxColor = _props.maxColor;
      var _state = this.state,
          model = _state.model,
          cellScale = _state.cellScale,
          maxCount = _state.maxCount;
      var gl = this.context.gl;

      gl.depthMask(true);
      uniforms = Object.assign({}, uniforms, { minColor: minColor, maxColor: maxColor, cellScale: cellScale, maxCount: maxCount });
      model.render(uniforms);
    }
  }, {
    key: 'getModel',
    value: function getModel(gl) {
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          vertices: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])
        }),
        isInstanced: true
      });
    }
  }, {
    key: 'updateCell',
    value: function updateCell() {
      var _context$viewport = this.context.viewport,
          width = _context$viewport.width,
          height = _context$viewport.height;
      var cellSizePixels = this.props.cellSizePixels;


      var MARGIN = 2;
      var cellScale = new Float32Array([(cellSizePixels - MARGIN) / width * 2, -(cellSizePixels - MARGIN) / height * 2, 1]);
      var numCol = Math.ceil(width / cellSizePixels);
      var numRow = Math.ceil(height / cellSizePixels);

      this.setState({
        cellScale: cellScale,
        numCol: numCol,
        numRow: numRow,
        numInstances: numCol * numRow
      });

      var attributeManager = this.state.attributeManager;

      attributeManager.invalidateAll();
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute, _ref3) {
      var numInstances = _ref3.numInstances;
      var _context$viewport2 = this.context.viewport,
          width = _context$viewport2.width,
          height = _context$viewport2.height;
      var cellSizePixels = this.props.cellSizePixels;
      var numCol = this.state.numCol;
      var value = attribute.value,
          size = attribute.size;


      for (var i = 0; i < numInstances; i++) {
        var x = i % numCol;
        var y = Math.floor(i / numCol);
        value[i * size + 0] = x * cellSizePixels / width * 2 - 1;
        value[i * size + 1] = 1 - y * cellSizePixels / height * 2;
        value[i * size + 2] = 0;
      }
    }
  }, {
    key: 'calculateInstanceCount',
    value: function calculateInstanceCount(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          cellSizePixels = _props2.cellSizePixels,
          getPosition = _props2.getPosition,
          getWeight = _props2.getWeight;
      var _state2 = this.state,
          numCol = _state2.numCol,
          numRow = _state2.numRow;
      var value = attribute.value;

      var maxCount = 0;

      value.fill(0.0);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var pixel = this.project(getPosition(point));
          var colId = Math.floor(pixel[0] / cellSizePixels);
          var rowId = Math.floor(pixel[1] / cellSizePixels);
          if (colId >= 0 && colId < numCol && rowId >= 0 && rowId < numRow) {
            var i = colId + rowId * numCol;
            value[i] += getWeight(point);
            if (value[i] > maxCount) {
              maxCount = value[i];
            }
          }
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

      this.setState({ maxCount: maxCount });
    }
  }]);

  return ScreenGridLayer;
}(_lib.Layer);

exports.default = ScreenGridLayer;


ScreenGridLayer.layerName = 'ScreenGridLayer';
ScreenGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zY3JlZW4tZ3JpZC1sYXllci9zY3JlZW4tZ3JpZC1sYXllci5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0UHJvcHMiLCJjZWxsU2l6ZVBpeGVscyIsIm1pbkNvbG9yIiwibWF4Q29sb3IiLCJnZXRQb3NpdGlvbiIsImQiLCJwb3NpdGlvbiIsImdldFdlaWdodCIsIlNjcmVlbkdyaWRMYXllciIsInZzIiwiZnMiLCJwcm9wcyIsIl9jaGVja1JlbW92ZWRQcm9wIiwiYXR0cmlidXRlTWFuYWdlciIsInN0YXRlIiwiYWRkSW5zdGFuY2VkIiwiaW5zdGFuY2VQb3NpdGlvbnMiLCJzaXplIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZUNvdW50IiwiYWNjZXNzb3IiLCJjYWxjdWxhdGVJbnN0YW5jZUNvdW50IiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsImdldE1vZGVsIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImNlbGxTaXplQ2hhbmdlZCIsInZpZXdwb3J0Q2hhbmdlZCIsInVwZGF0ZUNlbGwiLCJ1bmlmb3JtcyIsImNlbGxTY2FsZSIsIm1heENvdW50IiwiZGVwdGhNYXNrIiwiT2JqZWN0IiwiYXNzaWduIiwicmVuZGVyIiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJpZCIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJUUklBTkdMRV9GQU4iLCJ2ZXJ0aWNlcyIsIkZsb2F0MzJBcnJheSIsImlzSW5zdGFuY2VkIiwidmlld3BvcnQiLCJ3aWR0aCIsImhlaWdodCIsIk1BUkdJTiIsIm51bUNvbCIsIk1hdGgiLCJjZWlsIiwibnVtUm93IiwibnVtSW5zdGFuY2VzIiwiaW52YWxpZGF0ZUFsbCIsImF0dHJpYnV0ZSIsInZhbHVlIiwiaSIsIngiLCJ5IiwiZmxvb3IiLCJkYXRhIiwiZmlsbCIsInBvaW50IiwicGl4ZWwiLCJwcm9qZWN0IiwiY29sSWQiLCJy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QWdCZ0UsU0FBaEIsR0FBNEIsaUJBQTVCO0FBQ0FoRSxnQkFBZ0JSLFlBQWhCLEdBQStCQSxZQUEvQiIsImZpbGUiOiJzY3JlZW4tZ3JpZC1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7R0wsIE1vZGVsLCBHZW9tZXRyeX0gZnJvbSAnbHVtYS5nbCc7XG5cbmltcG9ydCBzY3JlZW5HcmlkVmVydGV4IGZyb20gJy4vc2NyZWVuLWdyaWQtbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHNjcmVlbkdyaWRGcmFnbWVudCBmcm9tICcuL3NjcmVlbi1ncmlkLWxheWVyLWZyYWdtZW50Lmdsc2wnO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIGNlbGxTaXplUGl4ZWxzOiAxMDAsXG5cbiAgLy8gQ29sb3IgcmFuZ2U/XG4gIG1pbkNvbG9yOiBbMCwgMCwgMCwgMjU1XSxcbiAgbWF4Q29sb3I6IFswLCAyNTUsIDAsIDI1NV0sXG5cbiAgZ2V0UG9zaXRpb246IGQgPT4gZC5wb3NpdGlvbixcbiAgZ2V0V2VpZ2h0OiBkID0+IDFcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjcmVlbkdyaWRMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdnM6IHNjcmVlbkdyaWRWZXJ0ZXgsXG4gICAgICBmczogc2NyZWVuR3JpZEZyYWdtZW50XG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuX2NoZWNrUmVtb3ZlZFByb3AoJ3VuaXRXaWR0aCcsICdjZWxsU2l6ZVBpeGVscycpO1xuICAgIHRoaXMuX2NoZWNrUmVtb3ZlZFByb3AoJ3VuaXRIZWlnaHQnLCAnY2VsbFNpemVQaXhlbHMnKTtcbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uc30sXG4gICAgICBpbnN0YW5jZUNvdW50OiB7c2l6ZTogMSwgYWNjZXNzb3I6IFsnZ2V0UG9zaXRpb24nLCAnZ2V0V2VpZ2h0J10sIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvdW50fVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuZ2V0TW9kZWwoZ2wpfSk7XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIGNvbnN0IGNlbGxTaXplQ2hhbmdlZCA9XG4gICAgICBwcm9wcy5jZWxsU2l6ZVBpeGVscyAhPT0gb2xkUHJvcHMuY2VsbFNpemVQaXhlbHM7XG5cbiAgICBpZiAoY2VsbFNpemVDaGFuZ2VkIHx8IGNoYW5nZUZsYWdzLnZpZXdwb3J0Q2hhbmdlZCkge1xuICAgICAgdGhpcy51cGRhdGVDZWxsKCk7XG4gICAgfVxuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge21pbkNvbG9yLCBtYXhDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHttb2RlbCwgY2VsbFNjYWxlLCBtYXhDb3VudH0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgIHVuaWZvcm1zID0gT2JqZWN0LmFzc2lnbih7fSwgdW5pZm9ybXMsIHttaW5Db2xvciwgbWF4Q29sb3IsIGNlbGxTY2FsZSwgbWF4Q291bnR9KTtcbiAgICBtb2RlbC5yZW5kZXIodW5pZm9ybXMpO1xuICB9XG5cbiAgZ2V0TW9kZWwoZ2wpIHtcbiAgICBjb25zdCBzaGFkZXJzID0gYXNzZW1ibGVTaGFkZXJzKGdsLCB0aGlzLmdldFNoYWRlcnMoKSk7XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKHtcbiAgICAgIGdsLFxuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICB2czogc2hhZGVycy52cyxcbiAgICAgIGZzOiBzaGFkZXJzLmZzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRV9GQU4sXG4gICAgICAgIHZlcnRpY2VzOiBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxLCAwLCAwLCAxLCAxLCAwLCAwLCAxLCAwXSlcbiAgICAgIH0pLFxuICAgICAgaXNJbnN0YW5jZWQ6IHRydWVcbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZUNlbGwoKSB7XG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5jb250ZXh0LnZpZXdwb3J0O1xuICAgIGNvbnN0IHtjZWxsU2l6ZVBpeGVsc30gPSB0aGlzLnByb3BzO1xuXG4gICAgY29uc3QgTUFSR0lOID0gMjtcbiAgICBjb25zdCBjZWxsU2NhbGUgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIChjZWxsU2l6ZVBpeGVscyAtIE1BUkdJTikgLyB3aWR0aCAqIDIsXG4gICAgICAtKGNlbGxTaXplUGl4ZWxzIC0gTUFSR0lOKSAvIGhlaWdodCAqIDIsXG4gICAgICAxXG4gICAgXSk7XG4gICAgY29uc3QgbnVtQ29sID0gTWF0aC5jZWlsKHdpZHRoIC8gY2VsbFNpemVQaXhlbHMpO1xuICAgIGNvbnN0IG51bVJvdyA9IE1hdGguY2VpbChoZWlnaHQgLyBjZWxsU2l6ZVBpeGVscyk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGNlbGxTY2FsZSxcbiAgICAgIG51bUNvbCxcbiAgICAgIG51bVJvdyxcbiAgICAgIG51bUluc3RhbmNlczogbnVtQ29sICogbnVtUm93XG4gICAgfSk7XG5cbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMoYXR0cmlidXRlLCB7bnVtSW5zdGFuY2VzfSkge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuY29udGV4dC52aWV3cG9ydDtcbiAgICBjb25zdCB7Y2VsbFNpemVQaXhlbHN9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7bnVtQ29sfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtSW5zdGFuY2VzOyBpKyspIHtcbiAgICAgIGNvbnN0IHggPSBpICUgbnVtQ29sO1xuICAgICAgY29uc3QgeSA9IE1hdGguZmxvb3IoaSAvIG51bUNvbCk7XG4gICAgICB2YWx1ZVtpICogc2l6ZSArIDBdID0geCAqIGNlbGxTaXplUGl4ZWxzIC8gd2lkdGggKiAyIC0gMTtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMV0gPSAxIC0geSAqIGNlbGxTaXplUGl4ZWxzIC8gaGVpZ2h0ICogMjtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMl0gPSAwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ291bnQoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGNlbGxTaXplUGl4ZWxzLCBnZXRQb3NpdGlvbiwgZ2V0V2VpZ2h0fSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge251bUNvbCwgbnVtUm93fSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgbWF4Q291bnQgPSAwO1xuXG4gICAgdmFsdWUuZmlsbCgwLjApO1xuXG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwaXhlbCA9IHRoaXMucHJvamVjdChnZXRQb3NpdGlvbihwb2ludCkpO1xuICAgICAgY29uc3QgY29sSWQgPSBNYXRoLmZsb29yKHBpeGVsWzBdIC8gY2VsbFNpemVQaXhlbHMpO1xuICAgICAgY29uc3Qgcm93SWQgPSBNYXRoLmZsb29yKHBpeGVsWzFdIC8gY2VsbFNpemVQaXhlbHMpO1xuICAgICAgaWYgKGNvbElkID49IDAgJiYgY29sSWQgPCBudW1Db2wgJiYgcm93SWQgPj0gMCAmJiByb3dJZCA8IG51bVJvdykge1xuICAgICAgICBjb25zdCBpID0gY29sSWQgKyByb3dJZCAqIG51bUNvbDtcbiAgICAgICAgdmFsdWVbaV0gKz0gZ2V0V2VpZ2h0KHBvaW50KTtcbiAgICAgICAgaWYgKHZhbHVlW2ldID4gbWF4Q291bnQpIHtcbiAgICAgICAgICBtYXhDb3VudCA9IHZhbHVlW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7bWF4Q291bnR9KTtcbiAgfVxufVxuXG5TY3JlZW5HcmlkTGF5ZXIubGF5ZXJOYW1lID0gJ1NjcmVlbkdyaWRMYXllcic7XG5TY3JlZW5HcmlkTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
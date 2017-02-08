'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEFAULT_COLOR = [0, 0, 0, 255];

var defaultProps = {
  opacity: 1,
  strokeWidth: 1, // stroke width in meters
  miterLimit: 4,
  strokeMinPixels: 0, //  min stroke width in pixels
  strokeMaxPixels: Number.MAX_SAFE_INTEGER, // max stroke width in pixels
  getPath: function getPath(object) {
    return object.path;
  },
  getColor: function getColor(object) {
    return object.color;
  },
  getWidth: function getWidth(object) {
    return object.width;
  }
};

var isClosed = function isClosed(path) {
  var firstPoint = path[0];
  var lastPoint = path[path.length - 1];
  return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1] && firstPoint[2] === lastPoint[2];
};

var PathLayer = function (_Layer) {
  _inherits(PathLayer, _Layer);

  function PathLayer() {
    _classCallCheck(this, PathLayer);

    return _possibleConstructorReturn(this, (PathLayer.__proto__ || Object.getPrototypeOf(PathLayer)).apply(this, arguments));
  }

  _createClass(PathLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return {
        vs: '#define SHADER_NAME path-layer-vertex-shader\n\nattribute float directions;\nattribute vec3 positions;\nattribute vec3 leftDeltas;\nattribute vec3 rightDeltas;\n\nattribute vec4 colors;\nattribute vec3 pickingColors;\n\nuniform float thickness;\nuniform float strokeMinPixels;\nuniform float strokeMaxPixels;\nuniform float miterLimit;\nuniform float opacity;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\n// calculate line join positions\nvec2 lineJoin(vec3 prevProjected, vec3 currProjected, vec3 nextProjected) {\n  // get 2D screen coordinates\n  vec2 prevScreen = prevProjected.xy;\n  vec2 currScreen = currProjected.xy;\n  vec2 nextScreen = nextProjected.xy;\n\n  float len = clamp(project_scale(thickness),\n    strokeMinPixels, strokeMaxPixels);\n\n  vec2 dir = vec2(0.0);\n  if (currScreen == prevScreen) {\n    // starting point uses (next - current)\n    dir = normalize(nextScreen - currScreen);\n  } else if (currScreen == nextScreen) {\n    // ending point uses (current - previous)\n    dir = normalize(currScreen - prevScreen);\n  } else {\n    // somewhere in middle, needs a join\n    // get directions from (C - B) and (B - A)\n    vec2 dirA = normalize(currScreen - prevScreen);\n    vec2 dirB = normalize(nextScreen - currScreen);\n    // now compute the miter join normal and length\n    vec2 tangent = normalize(dirA + dirB);\n    vec2 perp = vec2(-dirA.y, dirA.x);\n    vec2 miterVec = vec2(-tangent.y, tangent.x);\n    dir = tangent;\n    len *= min(miterLimit, 1.0 / dot(miterVec, perp));\n  }\n  vec2 normal = vec2(-dir.y, dir.x);\n  normal *= len / 2.0;\n\n  return currProjected.xy + normal * directions;\n}\n\nvoid main() {\n  vec4 color = vec4(colors.rgb, colors.a * opacity) / 255.;\n  vec4 pickingColor = vec4(pickingColors.rgb, 255.) / 255.;\n  vColor = mix(color, pickingColor, renderPickingBuffer);\n\n  vec3 prevProjected = project_position(positions - leftDeltas);\n  vec3 currProjected = project_position(positions);\n  vec3 nextProjected = project_position(positions + rightDeltas);\n\n  gl_Position = project_to_clipspace(\n    vec4(\n      lineJoin(prevProjected, currProjected, nextProjected),\n      currProjected.z + 0.1,\n      1.0\n    )\n  );\n}\n',
        fs: '// Copyright (c) 2016 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME path-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n}\n'
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({
        model: this.getModel(gl),
        numInstances: 0,
        IndexType: gl.getExtension('OES_element_index_uint') ? Uint32Array : Uint16Array
      });

      var attributeManager = this.state.attributeManager;

      var noAlloc = true;
      /* eslint-disable max-len */
      attributeManager.addDynamic({
        indices: { size: 1, isIndexed: true, update: this.calculateIndices, noAlloc: noAlloc },
        positions: { size: 3, update: this.calculatePositions, noAlloc: noAlloc },
        leftDeltas: { size: 3, update: this.calculateLeftDeltas, noAlloc: noAlloc },
        rightDeltas: { size: 3, update: this.calculateRightDeltas, noAlloc: noAlloc },
        directions: { size: 1, accessor: 'getWidth', update: this.calculateDirections, noAlloc: noAlloc },
        colors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateColors, noAlloc: noAlloc },
        pickingColors: { size: 3, type: _luma.GL.UNSIGNED_BYTE, update: this.calculatePickingColors, noAlloc: noAlloc }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;
      var getPath = this.props.getPath;
      var _state = this.state,
          attributeManager = _state.attributeManager,
          IndexType = _state.IndexType;


      if (changeFlags.dataChanged) {
        // this.state.paths only stores point positions in each path
        var paths = props.data.map(getPath);
        var pointCount = paths.reduce(function (count, path) {
          return count + path.length;
        }, 0);

        // each point will generate two vertices for outside and inside
        if (IndexType === Uint16Array && pointCount * 2 > 65535) {
          throw new Error('Vertex count exceeds browser\'s limit');
        }

        this.setState({ paths: paths, pointCount: pointCount });
        attributeManager.invalidateAll();
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
      var _props = this.props,
          opacity = _props.opacity,
          strokeWidth = _props.strokeWidth,
          miterLimit = _props.miterLimit,
          strokeMinPixels = _props.strokeMinPixels,
          strokeMaxPixels = _props.strokeMaxPixels;


      this.state.model.render(Object.assign({}, uniforms, {
        opacity: opacity,
        thickness: strokeWidth,
        miterLimit: miterLimit,
        strokeMinPixels: strokeMinPixels,
        strokeMaxPixels: strokeMaxPixels
      }));
    }
  }, {
    key: 'getModel',
    value: function getModel(gl) {
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());
      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        fs: shaders.fs,
        vs: shaders.vs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLES
        }),
        vertexCount: 0,
        isIndexed: true
      });
    }
  }, {
    key: 'calculateIndices',
    value: function calculateIndices(attribute) {
      var _state2 = this.state,
          paths = _state2.paths,
          IndexType = _state2.IndexType,
          model = _state2.model,
          pointCount = _state2.pointCount;

      // each path with length n has n-1 line segments
      // * 2 * 3: each segment is rendered as 2 triangles with 3 vertices

      var indexCount = (pointCount - paths.length) * 2 * 3;
      model.setVertexCount(indexCount);

      var indices = new IndexType(indexCount);

      var i = 0;
      var offset = 0;
      paths.forEach(function (path) {
        // counter-clockwise triangulation
        //                ___
        //             0 |  /| 2  (outside edge)
        //  o---o  =>    o / o
        //             1 |/__| 3  (inside edge)
        //
        for (var ptIndex = 0; ptIndex < path.length - 1; ptIndex++) {
          // triangle A with indices: 0, 1, 2
          indices[i++] = offset + 0;
          indices[i++] = offset + 1;
          indices[i++] = offset + 2;
          // triangle B with indices: 2, 1, 3
          indices[i++] = offset + 2;
          indices[i++] = offset + 1;
          indices[i++] = offset + 3;
          // move to the next segment
          offset += 2;
        }
        // move to the next path
        offset += 2;
      });

      attribute.value = indices;
      attribute.target = _luma.GL.ELEMENT_ARRAY_BUFFER;
    }
  }, {
    key: 'calculatePositions',
    value: function calculatePositions(attribute) {
      var _state3 = this.state,
          paths = _state3.paths,
          pointCount = _state3.pointCount;

      var positions = new Float32Array(pointCount * attribute.size * 2);

      var i = 0;
      paths.forEach(function (path) {
        path.forEach(function (point) {
          // two copies for outside edge and inside edge each
          positions[i++] = point[0];
          positions[i++] = point[1];
          positions[i++] = point[2] || 0;
          positions[i++] = point[0];
          positions[i++] = point[1];
          positions[i++] = point[2] || 0;
        });
      });

      attribute.value = positions;
    }
  }, {
    key: 'calculateLeftDeltas',
    value: function calculateLeftDeltas(attribute) {
      var _state4 = this.state,
          paths = _state4.paths,
          pointCount = _state4.pointCount;
      var size = attribute.size;


      var leftDeltas = new Float32Array(pointCount * size * 2);

      var i = 0;
      paths.forEach(function (path) {
        path.reduce(function (prevPoint, point) {
          if (prevPoint) {
            // two copies for outside edge and inside edge each
            leftDeltas[i++] = point[0] - prevPoint[0];
            leftDeltas[i++] = point[1] - prevPoint[1];
            leftDeltas[i++] = point[2] - prevPoint[2] || 0;
            leftDeltas[i++] = point[0] - prevPoint[0];
            leftDeltas[i++] = point[1] - prevPoint[1];
            leftDeltas[i++] = point[2] - prevPoint[2] || 0;
          }
          return point;
        }, isClosed(path) ? path[path.length - 2] : path[0]);
      });

      attribute.value = leftDeltas;
    }
  }, {
    key: 'calculateRightDeltas',
    value: function calculateRightDeltas(attribute) {
      var _state5 = this.state,
          paths = _state5.paths,
          pointCount = _state5.pointCount;
      var size = attribute.size;


      var rightDeltas = new Float32Array(pointCount * size * 2);

      var i = 0;
      paths.forEach(function (path) {
        path.forEach(function (point, ptIndex) {
          var nextPoint = path[ptIndex + 1];
          if (!nextPoint) {
            nextPoint = isClosed(path) ? path[1] : point;
          }

          // two copies for outside edge and inside edge each
          rightDeltas[i++] = nextPoint[0] - point[0];
          rightDeltas[i++] = nextPoint[1] - point[1];
          rightDeltas[i++] = nextPoint[2] - point[2] || 0;
          rightDeltas[i++] = nextPoint[0] - point[0];
          rightDeltas[i++] = nextPoint[1] - point[1];
          rightDeltas[i++] = nextPoint[2] - point[2] || 0;
        });
      });

      attribute.value = rightDeltas;
    }
  }, {
    key: 'calculateDirections',
    value: function calculateDirections(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getWidth = _props2.getWidth;
      var _state6 = this.state,
          paths = _state6.paths,
          pointCount = _state6.pointCount;

      var directions = new Float32Array(pointCount * 2);

      var i = 0;
      paths.forEach(function (path, index) {
        var w = getWidth(data[index], index);
        if (isNaN(w)) {
          w = 1;
        }
        for (var ptIndex = 0; ptIndex < path.length; ptIndex++) {
          directions[i++] = w;
          directions[i++] = -w;
        }
      });

      attribute.value = directions;
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getColor = _props3.getColor;
      var _state7 = this.state,
          paths = _state7.paths,
          pointCount = _state7.pointCount;
      var size = attribute.size;

      var colors = new Uint8ClampedArray(pointCount * size * 2);

      var i = 0;
      paths.forEach(function (path, index) {
        var color = getColor(data[index], index) || DEFAULT_COLOR;
        if (Array.isArray(color[0])) {
          if (color.length !== path.length) {
            throw new Error('PathLayer getColor() returned a color array, but the number of ' + ('colors returned doesn\'t match the number of points in the path. Index ' + index));
          }
          color.forEach(function (pointColor) {
            var alpha = isNaN(pointColor[3]) ? 255 : pointColor[3];
            // two copies for outside edge and inside edge each
            colors[i++] = pointColor[0];
            colors[i++] = pointColor[1];
            colors[i++] = pointColor[2];
            colors[i++] = alpha;
            colors[i++] = pointColor[0];
            colors[i++] = pointColor[1];
            colors[i++] = pointColor[2];
            colors[i++] = alpha;
          });
        } else {
          var pointColor = color;
          if (isNaN(pointColor[3])) {
            pointColor[3] = 255;
          }
          for (var ptIndex = 0; ptIndex < path.length; ptIndex++) {
            // two copies for outside edge and inside edge each
            colors[i++] = pointColor[0];
            colors[i++] = pointColor[1];
            colors[i++] = pointColor[2];
            colors[i++] = pointColor[3];
            colors[i++] = pointColor[0];
            colors[i++] = pointColor[1];
            colors[i++] = pointColor[2];
            colors[i++] = pointColor[3];
          }
        }
      });

      attribute.value = colors;
    }

    // Override the default picking colors calculation

  }, {
    key: 'calculatePickingColors',
    value: function calculatePickingColors(attribute) {
      var _this2 = this;

      var _state8 = this.state,
          paths = _state8.paths,
          pointCount = _state8.pointCount;
      var size = attribute.size;

      var pickingColors = new Uint8ClampedArray(pointCount * size * 2);

      var i = 0;
      paths.forEach(function (path, index) {
        var pickingColor = _this2.encodePickingColor(index);
        for (var ptIndex = 0; ptIndex < path.length; ptIndex++) {
          // two copies for outside edge and inside edge each
          pickingColors[i++] = pickingColor[0];
          pickingColors[i++] = pickingColor[1];
          pickingColors[i++] = pickingColor[2];
          pickingColors[i++] = pickingColor[0];
          pickingColors[i++] = pickingColor[1];
          pickingColors[i++] = pickingColor[2];
        }
      });

      attribute.value = pickingColors;
    }
  }]);

  return PathLayer;
}(_lib.Layer);

exports.default = PathLayer;


PathLayer.layerName = 'PathLayer';
PathLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wYXRoLWxheWVyL3BhdGgtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsIm9wYWNpdHkiLCJzdHJva2VXaWR0aCIsIm1pdGVyTGltaXQiLCJzdHJva2VNaW5QaXhlbHMiLCJzdHJva2VNYXhQaXhlbHMiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiZ2V0UGF0aCIsIm9iamVjdCIsInBhdGgiLCJnZXRDb2xvciIsImNvbG9yIiwiZ2V0V2lkdGgiLCJ3aWR0aCIsImlzQ2xvc2VkIiwiZmlyc3RQb2ludCIsImxhc3RQb2ludCIsImxlbmd0aCIsIlBhdGhMYXllciIsInZzIiwiZnMiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiZ2V0TW9kZWwiLCJudW1JbnN0YW5jZXMiLCJJbmRleFR5cGUiLCJnZXRFeHRlbnNpb24iLCJVaW50MzJBcnJheSIsIlVpbnQxNkFycmF5IiwiYXR0cmlidXRlTWFuYWdlciIsInN0YXRlIiwibm9BbGxvYyIsImFkZER5bmFtaWMiLCJpbmRpY2VzIiwic2l6ZSIsImlzSW5kZXhlZCIsInVwZGF0ZSIsImNhbGN1bGF0ZUluZGljZXMiLCJwb3NpdGlvbnMiLCJjYWxjdWxhdGVQb3NpdGlvbnMiLCJsZWZ0RGVsdGFzIiwiY2FsY3VsYXRlTGVmdERlbHRhcyIsInJpZ2h0RGVsdGFzIiwiY2FsY3VsYXRlUmlnaHREZWx0YXMiLCJkaXJlY3Rpb25zIiwiYWNjZXNzb3IiLCJjYWxjdWxhdGVEaXJlY3Rpb25zIiwiY29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVDb2xvcnMiLCJwaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsIm9sZFByb3BzIiwicHJvcHMiLCJjaGFuZ2VGbGFncyIsImRhdGFDaGFuZ2VkIiwicGF0aHMiLCJkYXRhIiwibWFwIiwicG9pbnRDb3VudCIsInJlZHVjZSIsImNvdW50IiwiRXJyb3IiLCJpbnZhbGlkYXRlQWxsIiwidW5pZm9ybXMiLCJyZW5kZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJ0aGlja25lc3MiLCJzaGFkZXJzIiwiZ2V0U2hhZGVycyIsImlkIiwiZ2VvbWV0cnkiLCJkcmF3TW9kZSIsIlRSSUFOR0xFUyIsInZlcnRleENvdW50IiwiYXR0cmlidXRlIiwiaW5kZXhDb3VudCIsInNldFZlcnRleENvdW50IiwiaSIsIm9mZnNldCIsImZvckVhY2giLCJwdEluZGV4IiwidmFsdWUiLCJ0YXJnZXQiLCJFTEVNRU5UX0FSUkFZX0JVRkZFUiIsIkZsb2F0MzJBcnJheSIsInBvaW50IiwicHJldlBvaW50IiwibmV4dFBvaW50IiwiaW5kZXgiLCJ3IiwiaXNOYU4iLCJVaW50OENsYW1wZWRBcnJheSIsIkFycmF5IiwiaXNBcnJheSIsInBvaW50Q29sb3IiLCJhbHBoYSIsInBpY2tpbmdDb2xvciIsImVuY29kZVBpY2tpbmdDb2xvciIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7Ozs7Ozs7QUFFQSxJQUFNQSxnQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxHQUFWLENBQXRCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLFdBQVMsQ0FEVTtBQUVuQkMsZUFBYSxDQUZNLEVBRUg7QUFDaEJDLGNBQVksQ0FITztBQUluQkMsbUJBQWlCLENBSkUsRUFJQztBQUNwQkMsbUJBQWlCQyxPQUFPQyxnQkFMTCxFQUt1QjtBQUMxQ0MsV0FBUztBQUFBLFdBQVVDLE9BQU9DLElBQWpCO0FBQUEsR0FOVTtBQU9uQkMsWUFBVTtBQUFBLFdBQVVGLE9BQU9HLEtBQWpCO0FBQUEsR0FQUztBQVFuQkMsWUFBVTtBQUFBLFdBQVVKLE9BQU9LLEtBQWpCO0FBQUE7QUFSUyxDQUFyQjs7QUFXQSxJQUFNQyxXQUFXLFNBQVhBLFFBQVcsT0FBUTtBQUN2QixNQUFNQyxhQUFhTixLQUFLLENBQUws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L0MsS0FERDtBQUFBLFVBQ3pCMkIsS0FEeUIsV0FDekJBLEtBRHlCO0FBQUEsVUFDbEJHLFVBRGtCLFdBQ2xCQSxVQURrQjtBQUFBLFVBRXpCMUIsSUFGeUIsR0FFakIyQyxTQUZpQixDQUV6QjNDLElBRnlCOztBQUdoQyxVQUFNaUIsZ0JBQWdCLElBQUkyQyxpQkFBSixDQUFzQmxDLGFBQWExQixJQUFiLEdBQW9CLENBQTFDLENBQXRCOztBQUVBLFVBQUk4QyxJQUFJLENBQVI7QUFDQXZCLFlBQU15QixPQUFOLENBQWMsVUFBQzNFLElBQUQsRUFBT29GLEtBQVAsRUFBaUI7QUFDN0IsWUFBTVEsZUFBZSxPQUFLQyxrQkFBTCxDQUF3QlQsS0FBeEIsQ0FBckI7QUFDQSxhQUFLLElBQUlSLFVBQVUsQ0FBbkIsRUFBc0JBLFVBQVU1RSxLQUFLUSxNQUFyQyxFQUE2Q29FLFNBQTdDLEVBQXdEO0FBQ3REO0FBQ0FoQyx3QkFBYzZCLEdBQWQsSUFBcUJtQixhQUFhLENBQWIsQ0FBckI7QUFDQWhELHdCQUFjNkIsR0FBZCxJQUFxQm1CLGFBQWEsQ0FBYixDQUFyQjtBQUNBaEQsd0JBQWM2QixHQUFkLElBQXFCbUIsYUFBYSxDQUFiLENBQXJCO0FBQ0FoRCx3QkFBYzZCLEdBQWQsSUFBcUJtQixhQUFhLENBQWIsQ0FBckI7QUFDQWhELHdCQUFjNkIsR0FBZCxJQUFxQm1CLGFBQWEsQ0FBYixDQUFyQjtBQUNBaEQsd0JBQWM2QixHQUFkLElBQXFCbUIsYUFBYSxDQUFiLENBQXJCO0FBQ0Q7QUFDRixPQVhEOztBQWFBdEIsZ0JBQVVPLEtBQVYsR0FBa0JqQyxhQUFsQjtBQUNEOzs7Ozs7a0JBclJrQm5DLFM7OztBQXlSckJBLFVBQVVxRixTQUFWLEdBQXNCLFdBQXRCO0FBQ0FyRixVQUFVbkIsWUFBVixHQUF5QkEsWUFBekIiLCJmaWxlIjoicGF0aC1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7R0wsIE1vZGVsLCBHZW9tZXRyeX0gZnJvbSAnbHVtYS5nbCc7XG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtqb2lufSBmcm9tICdwYXRoJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIG9wYWNpdHk6IDEsXG4gIHN0cm9rZVdpZHRoOiAxLCAvLyBzdHJva2Ugd2lkdGggaW4gbWV0ZXJzXG4gIG1pdGVyTGltaXQ6IDQsXG4gIHN0cm9rZU1pblBpeGVsczogMCwgLy8gIG1pbiBzdHJva2Ugd2lkdGggaW4gcGl4ZWxzXG4gIHN0cm9rZU1heFBpeGVsczogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIC8vIG1heCBzdHJva2Ugd2lkdGggaW4gcGl4ZWxzXG4gIGdldFBhdGg6IG9iamVjdCA9PiBvYmplY3QucGF0aCxcbiAgZ2V0Q29sb3I6IG9iamVjdCA9PiBvYmplY3QuY29sb3IsXG4gIGdldFdpZHRoOiBvYmplY3QgPT4gb2JqZWN0LndpZHRoXG59O1xuXG5jb25zdCBpc0Nsb3NlZCA9IHBhdGggPT4ge1xuICBjb25zdCBmaXJzdFBvaW50ID0gcGF0aFswXTtcbiAgY29uc3QgbGFzdFBvaW50ID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xuICByZXR1cm4gZmlyc3RQb2ludFswXSA9PT0gbGFzdFBvaW50WzBdICYmIGZpcnN0UG9pbnRbMV0gPT09IGxhc3RQb2ludFsxXSAmJlxuICAgIGZpcnN0UG9pbnRbMl0gPT09IGxhc3RQb2ludFsyXTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhdGhMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vcGF0aC1sYXllci12ZXJ0ZXguZ2xzbCcpLCAndXRmOCcpLFxuICAgICAgZnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vcGF0aC1sYXllci1mcmFnbWVudC5nbHNsJyksICd1dGY4JylcbiAgICB9O1xuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBtb2RlbDogdGhpcy5nZXRNb2RlbChnbCksXG4gICAgICBudW1JbnN0YW5jZXM6IDAsXG4gICAgICBJbmRleFR5cGU6IGdsLmdldEV4dGVuc2lvbignT0VTX2VsZW1lbnRfaW5kZXhfdWludCcpID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheVxuICAgIH0pO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCBub0FsbG9jID0gdHJ1ZTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGREeW5hbWljKHtcbiAgICAgIGluZGljZXM6IHtzaXplOiAxLCBpc0luZGV4ZWQ6IHRydWUsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbmRpY2VzLCBub0FsbG9jfSxcbiAgICAgIHBvc2l0aW9uczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnMsIG5vQWxsb2N9LFxuICAgICAgbGVmdERlbHRhczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVMZWZ0RGVsdGFzLCBub0FsbG9jfSxcbiAgICAgIHJpZ2h0RGVsdGFzOiB7c2l6ZTogMywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVJpZ2h0RGVsdGFzLCBub0FsbG9jfSxcbiAgICAgIGRpcmVjdGlvbnM6IHtzaXplOiAxLCBhY2Nlc3NvcjogJ2dldFdpZHRoJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZURpcmVjdGlvbnMsIG5vQWxsb2N9LFxuICAgICAgY29sb3JzOiB7c2l6ZTogNCwgdHlwZTogR0wuVU5TSUdORURfQllURSwgYWNjZXNzb3I6ICdnZXRDb2xvcicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVDb2xvcnMsIG5vQWxsb2N9LFxuICAgICAgcGlja2luZ0NvbG9yczoge3NpemU6IDMsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQaWNraW5nQ29sb3JzLCBub0FsbG9jfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgY29uc3Qge2dldFBhdGh9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlciwgSW5kZXhUeXBlfSA9IHRoaXMuc3RhdGU7XG5cbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQpIHtcbiAgICAgIC8vIHRoaXMuc3RhdGUucGF0aHMgb25seSBzdG9yZXMgcG9pbnQgcG9zaXRpb25zIGluIGVhY2ggcGF0aFxuICAgICAgY29uc3QgcGF0aHMgPSBwcm9wcy5kYXRhLm1hcChnZXRQYXRoKTtcbiAgICAgIGNvbnN0IHBvaW50Q291bnQgPSBwYXRocy5yZWR1Y2UoKGNvdW50LCBwYXRoKSA9PiBjb3VudCArIHBhdGgubGVuZ3RoLCAwKTtcblxuICAgICAgLy8gZWFjaCBwb2ludCB3aWxsIGdlbmVyYXRlIHR3byB2ZXJ0aWNlcyBmb3Igb3V0c2lkZSBhbmQgaW5zaWRlXG4gICAgICBpZiAoSW5kZXhUeXBlID09PSBVaW50MTZBcnJheSAmJiBwb2ludENvdW50ICogMiA+IDY1NTM1KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVmVydGV4IGNvdW50IGV4Y2VlZHMgYnJvd3NlclxcJ3MgbGltaXQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7cGF0aHMsIHBvaW50Q291bnR9KTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtvcGFjaXR5LCBzdHJva2VXaWR0aCwgbWl0ZXJMaW1pdCwgc3Ryb2tlTWluUGl4ZWxzLCBzdHJva2VNYXhQaXhlbHN9ID0gdGhpcy5wcm9wcztcblxuICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKE9iamVjdC5hc3NpZ24oe30sIHVuaWZvcm1zLCB7XG4gICAgICBvcGFjaXR5LFxuICAgICAgdGhpY2tuZXNzOiBzdHJva2VXaWR0aCxcbiAgICAgIG1pdGVyTGltaXQsXG4gICAgICBzdHJva2VNaW5QaXhlbHMsXG4gICAgICBzdHJva2VNYXhQaXhlbHNcbiAgICB9KSk7XG4gIH1cblxuICBnZXRNb2RlbChnbCkge1xuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcbiAgICByZXR1cm4gbmV3IE1vZGVsKHtcbiAgICAgIGdsLFxuICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICBmczogc2hhZGVycy5mcyxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRVNcbiAgICAgIH0pLFxuICAgICAgdmVydGV4Q291bnQ6IDAsXG4gICAgICBpc0luZGV4ZWQ6IHRydWVcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluZGljZXMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge3BhdGhzLCBJbmRleFR5cGUsIG1vZGVsLCBwb2ludENvdW50fSA9IHRoaXMuc3RhdGU7XG5cbiAgICAvLyBlYWNoIHBhdGggd2l0aCBsZW5ndGggbiBoYXMgbi0xIGxpbmUgc2VnbWVudHNcbiAgICAvLyAqIDIgKiAzOiBlYWNoIHNlZ21lbnQgaXMgcmVuZGVyZWQgYXMgMiB0cmlhbmdsZXMgd2l0aCAzIHZlcnRpY2VzXG4gICAgY29uc3QgaW5kZXhDb3VudCA9IChwb2ludENvdW50IC0gcGF0aHMubGVuZ3RoKSAqIDIgKiAzO1xuICAgIG1vZGVsLnNldFZlcnRleENvdW50KGluZGV4Q291bnQpO1xuXG4gICAgY29uc3QgaW5kaWNlcyA9IG5ldyBJbmRleFR5cGUoaW5kZXhDb3VudCk7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIC8vIGNvdW50ZXItY2xvY2t3aXNlIHRyaWFuZ3VsYXRpb25cbiAgICAgIC8vICAgICAgICAgICAgICAgIF9fX1xuICAgICAgLy8gICAgICAgICAgICAgMCB8ICAvfCAyICAob3V0c2lkZSBlZGdlKVxuICAgICAgLy8gIG8tLS1vICA9PiAgICBvIC8gb1xuICAgICAgLy8gICAgICAgICAgICAgMSB8L19ffCAzICAoaW5zaWRlIGVkZ2UpXG4gICAgICAvL1xuICAgICAgZm9yIChsZXQgcHRJbmRleCA9IDA7IHB0SW5kZXggPCBwYXRoLmxlbmd0aCAtIDE7IHB0SW5kZXgrKykge1xuICAgICAgICAvLyB0cmlhbmdsZSBBIHdpdGggaW5kaWNlczogMCwgMSwgMlxuICAgICAgICBpbmRpY2VzW2krK10gPSBvZmZzZXQgKyAwO1xuICAgICAgICBpbmRpY2VzW2krK10gPSBvZmZzZXQgKyAxO1xuICAgICAgICBpbmRpY2VzW2krK10gPSBvZmZzZXQgKyAyO1xuICAgICAgICAvLyB0cmlhbmdsZSBCIHdpdGggaW5kaWNlczogMiwgMSwgM1xuICAgICAgICBpbmRpY2VzW2krK10gPSBvZmZzZXQgKyAyO1xuICAgICAgICBpbmRpY2VzW2krK10gPSBvZmZzZXQgKyAxO1xuICAgICAgICBpbmRpY2VzW2krK10gPSBvZmZzZXQgKyAzO1xuICAgICAgICAvLyBtb3ZlIHRvIHRoZSBuZXh0IHNlZ21lbnRcbiAgICAgICAgb2Zmc2V0ICs9IDI7XG4gICAgICB9XG4gICAgICAvLyBtb3ZlIHRvIHRoZSBuZXh0IHBhdGhcbiAgICAgIG9mZnNldCArPSAyO1xuICAgIH0pO1xuXG4gICAgYXR0cmlidXRlLnZhbHVlID0gaW5kaWNlcztcbiAgICBhdHRyaWJ1dGUudGFyZ2V0ID0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVI7XG4gIH1cblxuICBjYWxjdWxhdGVQb3NpdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge3BhdGhzLCBwb2ludENvdW50fSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3QgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShwb2ludENvdW50ICogYXR0cmlidXRlLnNpemUgKiAyKTtcblxuICAgIGxldCBpID0gMDtcbiAgICBwYXRocy5mb3JFYWNoKHBhdGggPT4ge1xuICAgICAgcGF0aC5mb3JFYWNoKHBvaW50ID0+IHtcbiAgICAgICAgLy8gdHdvIGNvcGllcyBmb3Igb3V0c2lkZSBlZGdlIGFuZCBpbnNpZGUgZWRnZSBlYWNoXG4gICAgICAgIHBvc2l0aW9uc1tpKytdID0gcG9pbnRbMF07XG4gICAgICAgIHBvc2l0aW9uc1tpKytdID0gcG9pbnRbMV07XG4gICAgICAgIHBvc2l0aW9uc1tpKytdID0gcG9pbnRbMl0gfHwgMDtcbiAgICAgICAgcG9zaXRpb25zW2krK10gPSBwb2ludFswXTtcbiAgICAgICAgcG9zaXRpb25zW2krK10gPSBwb2ludFsxXTtcbiAgICAgICAgcG9zaXRpb25zW2krK10gPSBwb2ludFsyXSB8fCAwO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBwb3NpdGlvbnM7XG4gIH1cblxuICBjYWxjdWxhdGVMZWZ0RGVsdGFzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtwYXRocywgcG9pbnRDb3VudH0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHtzaXplfSA9IGF0dHJpYnV0ZTtcblxuICAgIGNvbnN0IGxlZnREZWx0YXMgPSBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQgKiBzaXplICogMik7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIHBhdGgucmVkdWNlKChwcmV2UG9pbnQsIHBvaW50KSA9PiB7XG4gICAgICAgIGlmIChwcmV2UG9pbnQpIHtcbiAgICAgICAgICAvLyB0d28gY29waWVzIGZvciBvdXRzaWRlIGVkZ2UgYW5kIGluc2lkZSBlZGdlIGVhY2hcbiAgICAgICAgICBsZWZ0RGVsdGFzW2krK10gPSBwb2ludFswXSAtIHByZXZQb2ludFswXTtcbiAgICAgICAgICBsZWZ0RGVsdGFzW2krK10gPSBwb2ludFsxXSAtIHByZXZQb2ludFsxXTtcbiAgICAgICAgICBsZWZ0RGVsdGFzW2krK10gPSAocG9pbnRbMl0gLSBwcmV2UG9pbnRbMl0pIHx8IDA7XG4gICAgICAgICAgbGVmdERlbHRhc1tpKytdID0gcG9pbnRbMF0gLSBwcmV2UG9pbnRbMF07XG4gICAgICAgICAgbGVmdERlbHRhc1tpKytdID0gcG9pbnRbMV0gLSBwcmV2UG9pbnRbMV07XG4gICAgICAgICAgbGVmdERlbHRhc1tpKytdID0gKHBvaW50WzJdIC0gcHJldlBvaW50WzJdKSB8fCAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb2ludDtcbiAgICAgIH0sIGlzQ2xvc2VkKHBhdGgpID8gcGF0aFtwYXRoLmxlbmd0aCAtIDJdIDogcGF0aFswXSk7XG4gICAgfSk7XG5cbiAgICBhdHRyaWJ1dGUudmFsdWUgPSBsZWZ0RGVsdGFzO1xuICB9XG5cbiAgY2FsY3VsYXRlUmlnaHREZWx0YXMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge3BhdGhzLCBwb2ludENvdW50fSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3NpemV9ID0gYXR0cmlidXRlO1xuXG4gICAgY29uc3QgcmlnaHREZWx0YXMgPSBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQgKiBzaXplICogMik7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIHBhdGguZm9yRWFjaCgocG9pbnQsIHB0SW5kZXgpID0+IHtcbiAgICAgICAgbGV0IG5leHRQb2ludCA9IHBhdGhbcHRJbmRleCArIDFdO1xuICAgICAgICBpZiAoIW5leHRQb2ludCkge1xuICAgICAgICAgIG5leHRQb2ludCA9IGlzQ2xvc2VkKHBhdGgpID8gcGF0aFsxXSA6IHBvaW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHdvIGNvcGllcyBmb3Igb3V0c2lkZSBlZGdlIGFuZCBpbnNpZGUgZWRnZSBlYWNoXG4gICAgICAgIHJpZ2h0RGVsdGFzW2krK10gPSBuZXh0UG9pbnRbMF0gLSBwb2ludFswXTtcbiAgICAgICAgcmlnaHREZWx0YXNbaSsrXSA9IG5leHRQb2ludFsxXSAtIHBvaW50WzFdO1xuICAgICAgICByaWdodERlbHRhc1tpKytdID0gKG5leHRQb2ludFsyXSAtIHBvaW50WzJdKSB8fCAwO1xuICAgICAgICByaWdodERlbHRhc1tpKytdID0gbmV4dFBvaW50WzBdIC0gcG9pbnRbMF07XG4gICAgICAgIHJpZ2h0RGVsdGFzW2krK10gPSBuZXh0UG9pbnRbMV0gLSBwb2ludFsxXTtcbiAgICAgICAgcmlnaHREZWx0YXNbaSsrXSA9IChuZXh0UG9pbnRbMl0gLSBwb2ludFsyXSkgfHwgMDtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYXR0cmlidXRlLnZhbHVlID0gcmlnaHREZWx0YXM7XG4gIH1cblxuICBjYWxjdWxhdGVEaXJlY3Rpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRXaWR0aH0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtwYXRocywgcG9pbnRDb3VudH0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IGRpcmVjdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQgKiAyKTtcblxuICAgIGxldCBpID0gMDtcbiAgICBwYXRocy5mb3JFYWNoKChwYXRoLCBpbmRleCkgPT4ge1xuICAgICAgbGV0IHcgPSBnZXRXaWR0aChkYXRhW2luZGV4XSwgaW5kZXgpO1xuICAgICAgaWYgKGlzTmFOKHcpKSB7XG4gICAgICAgIHcgPSAxO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgcHRJbmRleCA9IDA7IHB0SW5kZXggPCBwYXRoLmxlbmd0aDsgcHRJbmRleCsrKSB7XG4gICAgICAgIGRpcmVjdGlvbnNbaSsrXSA9IHc7XG4gICAgICAgIGRpcmVjdGlvbnNbaSsrXSA9IC13O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXR0cmlidXRlLnZhbHVlID0gZGlyZWN0aW9ucztcbiAgfVxuXG4gIGNhbGN1bGF0ZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7cGF0aHMsIHBvaW50Q291bnR9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7c2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgY29uc3QgY29sb3JzID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHBvaW50Q291bnQgKiBzaXplICogMik7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IoZGF0YVtpbmRleF0sIGluZGV4KSB8fCBERUZBVUxUX0NPTE9SO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29sb3JbMF0pKSB7XG4gICAgICAgIGlmIChjb2xvci5sZW5ndGggIT09IHBhdGgubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXRoTGF5ZXIgZ2V0Q29sb3IoKSByZXR1cm5lZCBhIGNvbG9yIGFycmF5LCBidXQgdGhlIG51bWJlciBvZiAnICtcbiAgICAgICAgICAgYGNvbG9ycyByZXR1cm5lZCBkb2Vzbid0IG1hdGNoIHRoZSBudW1iZXIgb2YgcG9pbnRzIGluIHRoZSBwYXRoLiBJbmRleCAke2luZGV4fWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbG9yLmZvckVhY2goKHBvaW50Q29sb3IpID0+IHtcbiAgICAgICAgICBjb25zdCBhbHBoYSA9IGlzTmFOKHBvaW50Q29sb3JbM10pID8gMjU1IDogcG9pbnRDb2xvclszXTtcbiAgICAgICAgICAvLyB0d28gY29waWVzIGZvciBvdXRzaWRlIGVkZ2UgYW5kIGluc2lkZSBlZGdlIGVhY2hcbiAgICAgICAgICBjb2xvcnNbaSsrXSA9IHBvaW50Q29sb3JbMF07XG4gICAgICAgICAgY29sb3JzW2krK10gPSBwb2ludENvbG9yWzFdO1xuICAgICAgICAgIGNvbG9yc1tpKytdID0gcG9pbnRDb2xvclsyXTtcbiAgICAgICAgICBjb2xvcnNbaSsrXSA9IGFscGhhO1xuICAgICAgICAgIGNvbG9yc1tpKytdID0gcG9pbnRDb2xvclswXTtcbiAgICAgICAgICBjb2xvcnNbaSsrXSA9IHBvaW50Q29sb3JbMV07XG4gICAgICAgICAgY29sb3JzW2krK10gPSBwb2ludENvbG9yWzJdO1xuICAgICAgICAgIGNvbG9yc1tpKytdID0gYWxwaGE7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcG9pbnRDb2xvciA9IGNvbG9yO1xuICAgICAgICBpZiAoaXNOYU4ocG9pbnRDb2xvclszXSkpIHtcbiAgICAgICAgICBwb2ludENvbG9yWzNdID0gMjU1O1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHB0SW5kZXggPSAwOyBwdEluZGV4IDwgcGF0aC5sZW5ndGg7IHB0SW5kZXgrKykge1xuICAgICAgICAgIC8vIHR3byBjb3BpZXMgZm9yIG91dHNpZGUgZWRnZSBhbmQgaW5zaWRlIGVkZ2UgZWFjaFxuICAgICAgICAgIGNvbG9yc1tpKytdID0gcG9pbnRDb2xvclswXTtcbiAgICAgICAgICBjb2xvcnNbaSsrXSA9IHBvaW50Q29sb3JbMV07XG4gICAgICAgICAgY29sb3JzW2krK10gPSBwb2ludENvbG9yWzJdO1xuICAgICAgICAgIGNvbG9yc1tpKytdID0gcG9pbnRDb2xvclszXTtcbiAgICAgICAgICBjb2xvcnNbaSsrXSA9IHBvaW50Q29sb3JbMF07XG4gICAgICAgICAgY29sb3JzW2krK10gPSBwb2ludENvbG9yWzFdO1xuICAgICAgICAgIGNvbG9yc1tpKytdID0gcG9pbnRDb2xvclsyXTtcbiAgICAgICAgICBjb2xvcnNbaSsrXSA9IHBvaW50Q29sb3JbM107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IGNvbG9ycztcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHBpY2tpbmcgY29sb3JzIGNhbGN1bGF0aW9uXG4gIGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge3BhdGhzLCBwb2ludENvdW50fSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3NpemV9ID0gYXR0cmlidXRlO1xuICAgIGNvbnN0IHBpY2tpbmdDb2xvcnMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkocG9pbnRDb3VudCAqIHNpemUgKiAyKTtcblxuICAgIGxldCBpID0gMDtcbiAgICBwYXRocy5mb3JFYWNoKChwYXRoLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcGlja2luZ0NvbG9yID0gdGhpcy5lbmNvZGVQaWNraW5nQ29sb3IoaW5kZXgpO1xuICAgICAgZm9yIChsZXQgcHRJbmRleCA9IDA7IHB0SW5kZXggPCBwYXRoLmxlbmd0aDsgcHRJbmRleCsrKSB7XG4gICAgICAgIC8vIHR3byBjb3BpZXMgZm9yIG91dHNpZGUgZWRnZSBhbmQgaW5zaWRlIGVkZ2UgZWFjaFxuICAgICAgICBwaWNraW5nQ29sb3JzW2krK10gPSBwaWNraW5nQ29sb3JbMF07XG4gICAgICAgIHBpY2tpbmdDb2xvcnNbaSsrXSA9IHBpY2tpbmdDb2xvclsxXTtcbiAgICAgICAgcGlja2luZ0NvbG9yc1tpKytdID0gcGlja2luZ0NvbG9yWzJdO1xuICAgICAgICBwaWNraW5nQ29sb3JzW2krK10gPSBwaWNraW5nQ29sb3JbMF07XG4gICAgICAgIHBpY2tpbmdDb2xvcnNbaSsrXSA9IHBpY2tpbmdDb2xvclsxXTtcbiAgICAgICAgcGlja2luZ0NvbG9yc1tpKytdID0gcGlja2luZ0NvbG9yWzJdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXR0cmlidXRlLnZhbHVlID0gcGlja2luZ0NvbG9ycztcbiAgfVxuXG59XG5cblBhdGhMYXllci5sYXllck5hbWUgPSAnUGF0aExheWVyJztcblBhdGhMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=
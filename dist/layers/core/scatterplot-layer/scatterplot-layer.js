'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _path = require('path');

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

var DEFAULT_COLOR = [255, 0, 255, 255];

var defaultProps = {
  getPosition: function getPosition(x) {
    return x.position;
  },
  getRadius: function getRadius(x) {
    return x.radius || 30;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  },
  radius: 30, //  point radius in meters
  radiusMinPixels: 0, //  min point radius in pixels
  radiusMaxPixels: Number.MAX_SAFE_INTEGER, // max point radius in pixels
  drawOutline: false,
  strokeWidth: 1
};

var ScatterplotLayer = function (_Layer) {
  _inherits(ScatterplotLayer, _Layer);

  function ScatterplotLayer() {
    _classCallCheck(this, ScatterplotLayer);

    return _possibleConstructorReturn(this, (ScatterplotLayer.__proto__ || Object.getPrototypeOf(ScatterplotLayer)).apply(this, arguments));
  }

  _createClass(ScatterplotLayer, [{
    key: 'getShaders',
    value: function getShaders(id) {
      return {
        vs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME scatterplot-layer-vertex-shader\n\nattribute vec3 positions;\n\nattribute vec3 instancePositions;\nattribute float instanceRadius;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\nuniform float opacity;\nuniform float radius;\nuniform float radiusMinPixels;\nuniform float radiusMaxPixels;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  // Multiply out radius and clamp to limits\n  float radiusPixels = clamp(\n    project_scale(radius * instanceRadius),\n    radiusMinPixels, radiusMaxPixels\n  );\n\n  // Find the center of the point and add the current vertex\n  vec3 center = project_position(instancePositions);\n  vec3 vertex = positions * radiusPixels;\n  gl_Position = project_to_clipspace(vec4(center + vertex, 1.0));\n\n  // Apply opacity to instance color, or return instance picking color\n  vec4 color = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n  vColor = mix(color, pickingColor, renderPickingBuffer);\n}\n',
        fs: '// Copyright (c) 2015 Uber Technologies, Inc.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the "Software"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n//\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n// THE SOFTWARE.\n\n#define SHADER_NAME scatterplot-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n}\n'
      };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({ model: this._getModel(gl) });

      /* eslint-disable max-len */
      this.state.attributeManager.addInstanced({
        instancePositions: { size: 3, accessor: 'getPosition', update: this.calculateInstancePositions },
        instanceRadius: { size: 1, accessor: 'getRadius', defaultValue: 1, update: this.calculateInstanceRadius },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateState',
    value: function updateState(info) {
      var props = info.props,
          oldProps = info.oldProps;

      if (props.drawOutline !== oldProps.drawOutline) {
        this.state.model.geometry.drawMode = props.drawOutline ? _luma.GL.LINE_LOOP : _luma.GL.TRIANGLE_FAN;
      }
      _get(ScatterplotLayer.prototype.__proto__ || Object.getPrototypeOf(ScatterplotLayer.prototype), 'updateState', this).call(this, info);
    }
  }, {
    key: 'draw',
    value: function draw(_ref) {
      var uniforms = _ref.uniforms;
      var gl = this.context.gl;

      var lineWidth = this.screenToDevicePixels(this.props.strokeWidth);
      gl.lineWidth(lineWidth);
      this.state.model.render(Object.assign({}, uniforms, {
        radius: this.props.radius,
        radiusMinPixels: this.props.radiusMinPixels,
        radiusMaxPixels: this.props.radiusMaxPixels
      }));
      // Setting line width back to 1 is here to workaround a Google Chrome bug
      // gl.clear() and gl.isEnabled() will return GL_INVALID_VALUE even with
      // correct parameter
      // This is not happening on Safari and Firefox
      gl.lineWidth(1.0);
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      var NUM_SEGMENTS = 16;
      var positions = [];
      for (var i = 0; i < NUM_SEGMENTS; i++) {
        positions.push(Math.cos(Math.PI * 2 * i / NUM_SEGMENTS), Math.sin(Math.PI * 2 * i / NUM_SEGMENTS), 0);
      }
      /* eslint-disable */

      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          positions: new Float32Array(positions)
        }),
        isInstanced: true
      });
      return model;
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getPosition = _props.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var position = getPosition(point);
          value[i++] = position[0];
          value[i++] = position[1];
          value[i++] = position[2] || 0;
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
    }
  }, {
    key: 'calculateInstanceRadius',
    value: function calculateInstanceRadius(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getRadius = _props2.getRadius;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;

          var radius = getRadius(point);
          value[i++] = isNaN(radius) ? 1 : radius;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getColor = _props3.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var point = _step3.value;

          var color = getColor(point) || DEFAULT_COLOR;
          value[i++] = color[0];
          value[i++] = color[1];
          value[i++] = color[2];
          value[i++] = isNaN(color[3]) ? DEFAULT_COLOR[3] : color[3];
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }]);

  return ScatterplotLayer;
}(_lib.Layer);

exports.default = ScatterplotLayer;


ScatterplotLayer.layerName = 'ScatterplotLayer';
ScatterplotLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zY2F0dGVycGxvdC1sYXllci9zY2F0dGVycGxvdC1sYXllci5qcyJdLCJuYW1lcyI6WyJERUZBVUxUX0NPTE9SIiwiZGVmYXVsdFByb3BzIiwiZ2V0UG9zaXRpb24iLCJ4IiwicG9zaXRpb24iLCJnZXRSYWRpdXMiLCJyYWRpdXMiLCJnZXRDb2xvciIsImNvbG9yIiwicmFkaXVzTWluUGl4ZWxzIiwicmFkaXVzTWF4UGl4ZWxzIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImRyYXdPdXRsaW5lIiwic3Ryb2tlV2lkdGgiLCJTY2F0dGVycGxvdExheWVyIiwiaWQiLCJ2cyIsImZzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsInN0YXRlIiwiYXR0cmlidXRlTWFuYWdlciIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZVJhZGl1cyIsImRlZmF1bHRWYWx1ZSIsImNhbGN1bGF0ZUluc3RhbmNlUmFkaXVzIiwiaW5zdGFuY2VDb2xvcnMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwiaW5mbyIsInByb3BzIiwib2xkUHJvcHMiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiTElORV9MT09QIiwiVFJJQU5HTEVfRkFOIiwidW5pZm9ybXMiLCJsaW5lV2lkdGgiLCJzY3JlZW5Ub0RldmljZVBpeGVscyIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsIk5VTV9TRUdNRU5UUyIsInBvc2l0aW9ucyIsImkiLCJwdXNoIiwiTWF0aCIsImNvcyIsIlBJIiwic2luIiwic2hhZGVycyIsImdldFNoYWRlcnMiLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2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UUQsU0FBUzRELEtBQVQsS0FBbUJuRSxhQUFqQztBQUNBa0UsZ0JBQU1aLEdBQU4sSUFBYTlDLE1BQU0sQ0FBTixDQUFiO0FBQ0EwRCxnQkFBTVosR0FBTixJQUFhOUMsTUFBTSxDQUFOLENBQWI7QUFDQTBELGdCQUFNWixHQUFOLElBQWE5QyxNQUFNLENBQU4sQ0FBYjtBQUNBMEQsZ0JBQU1aLEdBQU4sSUFBYWMsTUFBTTVELE1BQU0sQ0FBTixDQUFOLElBQWtCUixjQUFjLENBQWQsQ0FBbEIsR0FBcUNRLE1BQU0sQ0FBTixDQUFsRDtBQUNEO0FBVmdDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFXbEM7Ozs7OztrQkEzR2tCTyxnQjs7O0FBOEdyQkEsaUJBQWlCc0QsU0FBakIsR0FBNkIsa0JBQTdCO0FBQ0F0RCxpQkFBaUJkLFlBQWpCLEdBQWdDQSxZQUFoQyIsImZpbGUiOiJzY2F0dGVycGxvdC1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQge2Fzc2VtYmxlU2hhZGVyc30gZnJvbSAnLi4vLi4vLi4vc2hhZGVyLXV0aWxzJztcbmltcG9ydCB7R0wsIE1vZGVsLCBHZW9tZXRyeX0gZnJvbSAnbHVtYS5nbCc7XG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtqb2lufSBmcm9tICdwYXRoJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFsyNTUsIDAsIDI1NSwgMjU1XTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBnZXRQb3NpdGlvbjogeCA9PiB4LnBvc2l0aW9uLFxuICBnZXRSYWRpdXM6IHggPT4geC5yYWRpdXMgfHwgMzAsXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUixcbiAgcmFkaXVzOiAzMCwgIC8vICBwb2ludCByYWRpdXMgaW4gbWV0ZXJzXG4gIHJhZGl1c01pblBpeGVsczogMCwgLy8gIG1pbiBwb2ludCByYWRpdXMgaW4gcGl4ZWxzXG4gIHJhZGl1c01heFBpeGVsczogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIC8vIG1heCBwb2ludCByYWRpdXMgaW4gcGl4ZWxzXG4gIGRyYXdPdXRsaW5lOiBmYWxzZSxcbiAgc3Ryb2tlV2lkdGg6IDFcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjYXR0ZXJwbG90TGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoaWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdnM6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vc2NhdHRlcnBsb3QtbGF5ZXItdmVydGV4Lmdsc2wnKSwgJ3V0ZjgnKSxcbiAgICAgIGZzOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuL3NjYXR0ZXJwbG90LWxheWVyLWZyYWdtZW50Lmdsc2wnKSwgJ3V0ZjgnKVxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge3NpemU6IDMsIGFjY2Vzc29yOiAnZ2V0UG9zaXRpb24nLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnN9LFxuICAgICAgaW5zdGFuY2VSYWRpdXM6IHtzaXplOiAxLCBhY2Nlc3NvcjogJ2dldFJhZGl1cycsIGRlZmF1bHRWYWx1ZTogMSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUmFkaXVzfSxcbiAgICAgIGluc3RhbmNlQ29sb3JzOiB7c2l6ZTogNCwgdHlwZTogR0wuVU5TSUdORURfQllURSwgYWNjZXNzb3I6ICdnZXRDb2xvcicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yc31cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKGluZm8pIHtcbiAgICBjb25zdCB7cHJvcHMsIG9sZFByb3BzfSA9IGluZm87XG4gICAgaWYgKHByb3BzLmRyYXdPdXRsaW5lICE9PSBvbGRQcm9wcy5kcmF3T3V0bGluZSkge1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5nZW9tZXRyeS5kcmF3TW9kZSA9IHByb3BzLmRyYXdPdXRsaW5lID8gR0wuTElORV9MT09QIDogR0wuVFJJQU5HTEVfRkFOO1xuICAgIH1cbiAgICBzdXBlci51cGRhdGVTdGF0ZShpbmZvKTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgbGluZVdpZHRoID0gdGhpcy5zY3JlZW5Ub0RldmljZVBpeGVscyh0aGlzLnByb3BzLnN0cm9rZVdpZHRoKTtcbiAgICBnbC5saW5lV2lkdGgobGluZVdpZHRoKTtcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcihPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgcmFkaXVzOiB0aGlzLnByb3BzLnJhZGl1cyxcbiAgICAgIHJhZGl1c01pblBpeGVsczogdGhpcy5wcm9wcy5yYWRpdXNNaW5QaXhlbHMsXG4gICAgICByYWRpdXNNYXhQaXhlbHM6IHRoaXMucHJvcHMucmFkaXVzTWF4UGl4ZWxzXG4gICAgfSkpO1xuICAgIC8vIFNldHRpbmcgbGluZSB3aWR0aCBiYWNrIHRvIDEgaXMgaGVyZSB0byB3b3JrYXJvdW5kIGEgR29vZ2xlIENocm9tZSBidWdcbiAgICAvLyBnbC5jbGVhcigpIGFuZCBnbC5pc0VuYWJsZWQoKSB3aWxsIHJldHVybiBHTF9JTlZBTElEX1ZBTFVFIGV2ZW4gd2l0aFxuICAgIC8vIGNvcnJlY3QgcGFyYW1ldGVyXG4gICAgLy8gVGhpcyBpcyBub3QgaGFwcGVuaW5nIG9uIFNhZmFyaSBhbmQgRmlyZWZveFxuICAgIGdsLmxpbmVXaWR0aCgxLjApO1xuICB9XG5cbiAgX2dldE1vZGVsKGdsKSB7XG4gICAgY29uc3QgTlVNX1NFR01FTlRTID0gMTY7XG4gICAgY29uc3QgcG9zaXRpb25zID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOVU1fU0VHTUVOVFM7IGkrKykge1xuICAgICAgcG9zaXRpb25zLnB1c2goXG4gICAgICAgIE1hdGguY29zKE1hdGguUEkgKiAyICogaSAvIE5VTV9TRUdNRU5UUyksXG4gICAgICAgIE1hdGguc2luKE1hdGguUEkgKiAyICogaSAvIE5VTV9TRUdNRU5UUyksXG4gICAgICAgIDBcbiAgICAgICk7XG4gICAgfVxuICAgIC8qIGVzbGludC1kaXNhYmxlICovXG5cblxuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHJldHVybiBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IEdMLlRSSUFOR0xFX0ZBTixcbiAgICAgICAgcG9zaXRpb25zOiBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucylcbiAgICAgIH0pLFxuICAgICAgaXNJbnN0YW5jZWQ6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gbW9kZWw7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0UG9zaXRpb24ocG9pbnQpO1xuICAgICAgdmFsdWVbaSsrXSA9IHBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSsrXSA9IHBvc2l0aW9uWzFdO1xuICAgICAgdmFsdWVbaSsrXSA9IHBvc2l0aW9uWzJdIHx8IDA7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VSYWRpdXMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFJhZGl1c30gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcmFkaXVzID0gZ2V0UmFkaXVzKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBpc05hTihyYWRpdXMpID8gMSA6IHJhZGl1cztcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IocG9pbnQpIHx8IERFRkFVTFRfQ09MT1I7XG4gICAgICB2YWx1ZVtpKytdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpKytdID0gY29sb3JbMV07XG4gICAgICB2YWx1ZVtpKytdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpKytdID0gaXNOYU4oY29sb3JbM10pID8gREVGQVVMVF9DT0xPUlszXSA6IGNvbG9yWzNdO1xuICAgIH1cbiAgfVxufVxuXG5TY2F0dGVycGxvdExheWVyLmxheWVyTmFtZSA9ICdTY2F0dGVycGxvdExheWVyJztcblNjYXR0ZXJwbG90TGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
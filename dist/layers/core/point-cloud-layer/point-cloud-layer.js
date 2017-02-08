'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lib = require('../../../lib');

var _shaderUtils = require('../../../shader-utils');

var _luma = require('luma.gl');

var _fp = require('../../../lib/utils/fp64');

var _pointCloudLayerVertex = require('./point-cloud-layer-vertex.glsl');

var _pointCloudLayerVertex2 = _interopRequireDefault(_pointCloudLayerVertex);

var _pointCloudLayerVertex3 = require('./point-cloud-layer-vertex-64.glsl');

var _pointCloudLayerVertex4 = _interopRequireDefault(_pointCloudLayerVertex3);

var _pointCloudLayerFragment = require('./point-cloud-layer-fragment.glsl');

var _pointCloudLayerFragment2 = _interopRequireDefault(_pointCloudLayerFragment);

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

var DEFAULT_COLOR = [0, 0, 0, 255];

var defaultProps = {
  radiusPixels: 10, //  point radius in pixels
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getNormal: function getNormal(x) {
    return x.normal;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  },

  lightSettings: {
    lightsPosition: [0, 0, 5000, -1000, 1000, 8000, 5000, -5000, 1000],
    ambientRatio: 0.2,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [1.0, 0.0, 0.8, 0.0, 0.4, 0.0],
    numberOfLights: 3
  }
};

var PointCloudLayer = function (_Layer) {
  _inherits(PointCloudLayer, _Layer);

  function PointCloudLayer() {
    _classCallCheck(this, PointCloudLayer);

    return _possibleConstructorReturn(this, (PointCloudLayer.__proto__ || Object.getPrototypeOf(PointCloudLayer)).apply(this, arguments));
  }

  _createClass(PointCloudLayer, [{
    key: 'getShaders',
    value: function getShaders(id) {
      return (0, _fp.enable64bitSupport)(this.props) ? {
        vs: _pointCloudLayerVertex4.default, fs: _pointCloudLayerFragment2.default, modules: ['fp64', 'project64', 'lighting']
      } : {
        vs: _pointCloudLayerVertex2.default, fs: _pointCloudLayerFragment2.default, modules: ['lighting']
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
        instanceNormals: { size: 3, accessor: 'getNormal', defaultValue: 1, update: this.calculateInstanceNormals },
        instanceColors: { size: 4, type: _luma.GL.UNSIGNED_BYTE, accessor: 'getColor', update: this.calculateInstanceColors }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateAttribute',
    value: function updateAttribute(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (props.fp64 !== oldProps.fp64) {
        var attributeManager = this.state.attributeManager;

        attributeManager.invalidateAll();

        if (props.fp64 && props.projectionMode === _lib.COORDINATE_SYSTEM.LNG_LAT) {
          attributeManager.addInstanced({
            instancePositions64xyLow: {
              size: 2,
              accessor: 'getPosition',
              update: this.calculateInstancePositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instancePositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(PointCloudLayer.prototype.__proto__ || Object.getPrototypeOf(PointCloudLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var _props = this.props,
          radius = _props.radius,
          lightSettings = _props.lightSettings;

      this.state.model.render(Object.assign({}, uniforms, {
        radius: radius
      }, lightSettings));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      // a triangle that minimally cover the unit circle
      var positions = [];
      for (var i = 0; i < 3; i++) {
        var angle = i / 3 * Math.PI * 2;
        positions.push(Math.cos(angle) * 2, Math.sin(angle) * 2, 0);
      }
      var shaders = (0, _shaderUtils.assembleShaders)(gl, this.getShaders());

      return new _luma.Model({
        gl: gl,
        id: this.props.id,
        vs: shaders.vs,
        fs: shaders.fs,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLES,
          positions: new Float32Array(positions)
        }),
        isInstanced: true
      });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition;
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
    key: 'calculateInstancePositions64xyLow',
    value: function calculateInstancePositions64xyLow(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getPosition = _props3.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;

          var position = getPosition(point);
          value[i++] = (0, _fp.fp64ify)(position[0])[1];
          value[i++] = (0, _fp.fp64ify)(position[1])[1];
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
    key: 'calculateInstanceNormals',
    value: function calculateInstanceNormals(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getNormal = _props4.getNormal;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var point = _step3.value;

          var normal = getNormal(point);
          value[i++] = normal[0];
          value[i++] = normal[1];
          value[i++] = normal[2];
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
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props5 = this.props,
          data = _props5.data,
          getColor = _props5.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var point = _step4.value;

          var color = getColor(point);
          value[i++] = color[0];
          value[i++] = color[1];
          value[i++] = color[2];
          value[i++] = isNaN(color[3]) ? 255 : color[3];
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }]);

  return PointCloudLayer;
}(_lib.Layer);

exports.default = PointCloudLayer;


PointCloudLayer.layerName = 'PointCloudLayer';
PointCloudLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wb2ludC1jbG91ZC1sYXllci9wb2ludC1jbG91ZC1sYXllci5qcyJdLCJuYW1lcyI6WyJERUZBVUxUX0NPTE9SIiwiZGVmYXVsdFByb3BzIiwicmFkaXVzUGl4ZWxzIiwiZnA2NCIsImdldFBvc2l0aW9uIiwieCIsInBvc2l0aW9uIiwiZ2V0Tm9ybWFsIiwibm9ybWFsIiwiZ2V0Q29sb3IiLCJjb2xvciIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiUG9pbnRDbG91ZExheWVyIiwiaWQiLCJwcm9wcyIsInZzIiwiZnMiLCJtb2R1bGVzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsInN0YXRlIiwiYXR0cmlidXRlTWFuYWdlciIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZU5vcm1hbHMiLCJkZWZhdWx0VmFsdWUiLCJjYWxjdWxhdGVJbnN0YW5jZU5vcm1hbHMiLCJpbnN0YW5jZUNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMiLCJvbGRQcm9wcyIsImNoYW5nZUZsYWdzIiwiaW52YWxpZGF0ZUFsbCIsInByb2plY3Rpb25Nb2RlIiwiTE5HX0xBVCIsImluc3RhbmNlUG9zaXRpb25zNjR4eUxvdyIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjR4eUxvdyIsInJlbW92ZSIsInVwZGF0ZUF0dHJpYnV0ZSIsInVuaWZvcm1zIiwicmFkaXVzIiwicmVuZGVyIiwiT2JqZWN0IiwiYXNzaWduIiwicG9zaXRpb25zIiwiaSIsImFuZ2xlIiwiTWF0aCIsIlBJIiwicHVzaCIsImNvcyIsInNpbiIsInNoYWRlcnMiLCJnZXRTaGFkZXJzIiwiZ2VvbWV0cnkiLCJkcmF3TW9kZSIsIlRSSUFOR0xFUyIsIkZsb2F0MzJBcnJheSIsImlzSW5zdGFuY2VkIiwiYXR0cmlidXRlIiwiZGF0YSIsInZhbHVlIiwicG9pbnQiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQVlBLElBQU1BLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsZ0JBQWMsRUFESyxFQUNBO0FBQ25CQyxRQUFNLEtBRmE7O0FBSW5CQyxlQUFhO0FBQUEsV0FBS0MsRUFBRUMsUUFBUDtBQUFBLEdBSk07QUFLbkJDLGFBQVc7QUFBQSxXQUFLRixFQUFFRyxNQUFQO0FBQUEsR0FMUTtBQU1uQkMsWUFBVTtBQUFBLFdBQUtKLEVBQUVLLEtBQUYsSUFBV1YsYUFBaEI7QUFBQSxHQU5TOztBQVFuQlcsaUJBQWU7QUFDYkMsb0JBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxJQUFQLEVBQWEsQ0FBQyxJQUFkLEVBQW9CLElBQXBCLEVBQTBCLElBQTFCLEVBQWdDLElBQWhDLEVBQXNDLENBQUMsSUFBdkMsRUFBNkMsSUFBN0MsQ0FESDtBQUViQyxrQkFBYyxHQUZEO0FBR2JDLGtCQUFjLEdBSEQ7QUFJYkMsbUJBQWUsR0FKRjtBQUtiQyxvQkFBZ0IsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsRUFBZ0IsR0FBaEIsRUFBcUIsR0FBckIsRUFBMEIsR0FBMUIsQ0FMSDtB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NEIsaUJBQTVCO0FBQ0E1RCxnQkFBZ0JqQixZQUFoQixHQUErQkEsWUFBL0IiLCJmaWxlIjoicG9pbnQtY2xvdWQtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IHthc3NlbWJsZVNoYWRlcnN9IGZyb20gJy4uLy4uLy4uL3NoYWRlci11dGlscyc7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtmcDY0aWZ5LCBlbmFibGU2NGJpdFN1cHBvcnR9IGZyb20gJy4uLy4uLy4uL2xpYi91dGlscy9mcDY0JztcbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU19IGZyb20gJy4uLy4uLy4uL2xpYic7XG5cbmltcG9ydCBwb2ludENsb3VkVmVydGV4IGZyb20gJy4vcG9pbnQtY2xvdWQtbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHBvaW50Q2xvdWRWZXJ0ZXg2NCBmcm9tICcuL3BvaW50LWNsb3VkLWxheWVyLXZlcnRleC02NC5nbHNsJztcbmltcG9ydCBwb2ludENsb3VkRnJhZ21lbnQgZnJvbSAnLi9wb2ludC1jbG91ZC1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIHJhZGl1c1BpeGVsczogMTAsICAvLyAgcG9pbnQgcmFkaXVzIGluIHBpeGVsc1xuICBmcDY0OiBmYWxzZSxcblxuICBnZXRQb3NpdGlvbjogeCA9PiB4LnBvc2l0aW9uLFxuICBnZXROb3JtYWw6IHggPT4geC5ub3JtYWwsXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUixcblxuICBsaWdodFNldHRpbmdzOiB7XG4gICAgbGlnaHRzUG9zaXRpb246IFswLCAwLCA1MDAwLCAtMTAwMCwgMTAwMCwgODAwMCwgNTAwMCwgLTUwMDAsIDEwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC4yLFxuICAgIGRpZmZ1c2VSYXRpbzogMC42LFxuICAgIHNwZWN1bGFyUmF0aW86IDAuOCxcbiAgICBsaWdodHNTdHJlbmd0aDogWzEuMCwgMC4wLCAwLjgsIDAuMCwgMC40LCAwLjBdLFxuICAgIG51bWJlck9mTGlnaHRzOiAzXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvaW50Q2xvdWRMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycyhpZCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcykgPyB7XG4gICAgICB2czogcG9pbnRDbG91ZFZlcnRleDY0LCBmczogcG9pbnRDbG91ZEZyYWdtZW50LCBtb2R1bGVzOiBbJ2ZwNjQnLCAncHJvamVjdDY0JywgJ2xpZ2h0aW5nJ11cbiAgICB9IDoge1xuICAgICAgdnM6IHBvaW50Q2xvdWRWZXJ0ZXgsIGZzOiBwb2ludENsb3VkRnJhZ21lbnQsIG1vZHVsZXM6IFsnbGlnaHRpbmcnXVxuICAgIH07XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge3NpemU6IDMsIGFjY2Vzc29yOiAnZ2V0UG9zaXRpb24nLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnN9LFxuICAgICAgaW5zdGFuY2VOb3JtYWxzOiB7c2l6ZTogMywgYWNjZXNzb3I6ICdnZXROb3JtYWwnLCBkZWZhdWx0VmFsdWU6IDEsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZU5vcm1hbHN9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtzaXplOiA0LCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCBhY2Nlc3NvcjogJ2dldENvbG9yJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG5cbiAgICAgIGlmIChwcm9wcy5mcDY0ICYmIHByb3BzLnByb2plY3Rpb25Nb2RlID09PSBDT09SRElOQVRFX1NZU1RFTS5MTkdfTEFUKSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgICAgICBpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3c6IHtcbiAgICAgICAgICAgIHNpemU6IDIsXG4gICAgICAgICAgICBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJyxcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3dcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoW1xuICAgICAgICAgICdpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3cnXG4gICAgICAgIF0pO1xuICAgICAgfVxuXG4gICAgfVxuICB9XG5cbiAgdXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgc3VwZXIudXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtyYWRpdXMsIGxpZ2h0U2V0dGluZ3N9ID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcihPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgcmFkaXVzXG4gICAgfSwgbGlnaHRTZXR0aW5ncykpO1xuICB9XG5cbiAgX2dldE1vZGVsKGdsKSB7XG4gICAgLy8gYSB0cmlhbmdsZSB0aGF0IG1pbmltYWxseSBjb3ZlciB0aGUgdW5pdCBjaXJjbGVcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgY29uc3QgYW5nbGUgPSBpIC8gMyAqIE1hdGguUEkgKiAyO1xuICAgICAgcG9zaXRpb25zLnB1c2goXG4gICAgICAgIE1hdGguY29zKGFuZ2xlKSAqIDIsXG4gICAgICAgIE1hdGguc2luKGFuZ2xlKSAqIDIsXG4gICAgICAgIDBcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNoYWRlcnMgPSBhc3NlbWJsZVNoYWRlcnMoZ2wsIHRoaXMuZ2V0U2hhZGVycygpKTtcblxuICAgIHJldHVybiBuZXcgTW9kZWwoe1xuICAgICAgZ2wsXG4gICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgIHZzOiBzaGFkZXJzLnZzLFxuICAgICAgZnM6IHNoYWRlcnMuZnMsXG4gICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgZHJhd01vZGU6IEdMLlRSSUFOR0xFUyxcbiAgICAgICAgcG9zaXRpb25zOiBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucylcbiAgICAgIH0pLFxuICAgICAgaXNJbnN0YW5jZWQ6IHRydWVcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihwb2ludCk7XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMl0gfHwgMDtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3coYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzBdKVsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0aWZ5KHBvc2l0aW9uWzFdKVsxXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZU5vcm1hbHMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldE5vcm1hbH0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3Qgbm9ybWFsID0gZ2V0Tm9ybWFsKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBub3JtYWxbMF07XG4gICAgICB2YWx1ZVtpKytdID0gbm9ybWFsWzFdO1xuICAgICAgdmFsdWVbaSsrXSA9IG5vcm1hbFsyXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IocG9pbnQpO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yWzBdO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSsrXSA9IGlzTmFOKGNvbG9yWzNdKSA/IDI1NSA6IGNvbG9yWzNdO1xuICAgIH1cbiAgfVxufVxuXG5Qb2ludENsb3VkTGF5ZXIubGF5ZXJOYW1lID0gJ1BvaW50Q2xvdWRMYXllcic7XG5Qb2ludENsb3VkTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19
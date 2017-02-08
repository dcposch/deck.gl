"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Copyright (c) 2015 Uber Technologies, Inc.
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

exports.default = "#define SHADER_NAME line-layer-vertex-shader\n\nattribute vec3 positions;\nattribute vec3 instanceSourcePositions;\nattribute vec3 instanceTargetPositions;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\nuniform vec2 viewportSize;\nuniform float strokeWidth;\nuniform float opacity;\nuniform float renderPickingBuffer;\n\nvarying vec4 vColor;\n\n// offset vector by strokeWidth pixels\n// offset_direction is -1 (left) or 1 (right)\nvec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction) {\n  // normalized direction of the line\n  vec2 dir_screenspace = normalize(line_clipspace * viewportSize);\n  // rotate by 90 degrees\n  dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);\n\n  vec2 offset_screenspace = dir_screenspace * offset_direction * strokeWidth / 2.0;\n  vec2 offset_clipspace = offset_screenspace / viewportSize * 2.0;\n\n  return offset_clipspace;\n}\n\nvoid main(void) {\n  // Position\n  vec3 sourcePos = project_position(instanceSourcePositions);\n  vec3 targetPos = project_position(instanceTargetPositions);\n  vec4 source = project_to_clipspace(vec4(sourcePos, 1.0));\n  vec4 target = project_to_clipspace(vec4(targetPos, 1.0));\n\n  // linear interpolation of source & target to pick right coord\n  float segmentIndex = positions.x;\n  vec4 p = mix(source, target, segmentIndex);\n\n  // extrude\n  vec2 offset = getExtrusionOffset(target.xy - source.xy, positions.y);\n  gl_Position = p + vec4(offset, 0.0, 0.0);\n\n  // Color\n  vec4 color = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n  vColor = mix(\n    color,\n    pickingColor,\n    renderPickingBuffer\n  );\n}\n";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9saW5lLWxheWVyL2xpbmUtbGF5ZXItdmVydGV4Lmdsc2wuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJsaW5lLWxheWVyLXZlcnRleC5nbHNsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuZXhwb3J0IGRlZmF1bHQgYFxcXG4jZGVmaW5lIFNIQURFUl9OQU1FIGxpbmUtbGF5ZXItdmVydGV4LXNoYWRlclxuXG5hdHRyaWJ1dGUgdmVjMyBwb3NpdGlvbnM7XG5hdHRyaWJ1dGUgdmVjMyBpbnN0YW5jZVNvdXJjZVBvc2l0aW9ucztcbmF0dHJpYnV0ZSB2ZWMzIGluc3RhbmNlVGFyZ2V0UG9zaXRpb25zO1xuYXR0cmlidXRlIHZlYzQgaW5zdGFuY2VDb2xvcnM7XG5hdHRyaWJ1dGUgdmVjMyBpbnN0YW5jZVBpY2tpbmdDb2xvcnM7XG5cbnVuaWZvcm0gdmVjMiB2aWV3cG9ydFNpemU7XG51bmlmb3JtIGZsb2F0IHN0cm9rZVdpZHRoO1xudW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xudW5pZm9ybSBmbG9hdCByZW5kZXJQaWNraW5nQnVmZmVyO1xuXG52YXJ5aW5nIHZlYzQgdkNvbG9yO1xuXG4vLyBvZmZzZXQgdmVjdG9yIGJ5IHN0cm9rZVdpZHRoIHBpeGVsc1xuLy8gb2Zmc2V0X2RpcmVjdGlvbiBpcyAtMSAobGVmdCkgb3IgMSAocmlnaHQpXG52ZWMyIGdldEV4dHJ1c2lvbk9mZnNldCh2ZWMyIGxpbmVfY2xpcHNwYWNlLCBmbG9hdCBvZmZzZXRfZGlyZWN0aW9uKSB7XG4gIC8vIG5vcm1hbGl6ZWQgZGlyZWN0aW9uIG9mIHRoZSBsaW5lXG4gIHZlYzIgZGlyX3NjcmVlbnNwYWNlID0gbm9ybWFsaXplKGxpbmVfY2xpcHNwYWNlICogdmlld3BvcnRTaXplKTtcbiAgLy8gcm90YXRlIGJ5IDkwIGRlZ3JlZXNcbiAgZGlyX3NjcmVlbnNwYWNlID0gdmVjMigtZGlyX3NjcmVlbnNwYWNlLnksIGRpcl9zY3JlZW5zcGFjZS54KTtcblxuICB2ZWMyIG9mZnNldF9zY3JlZW5zcGFjZSA9IGRpcl9zY3JlZW5zcGFjZSAqIG9mZnNldF9kaXJlY3Rpb24gKiBzdHJva2VXaWR0aCAvIDIuMDtcbiAgdmVjMiBvZmZzZXRfY2xpcHNwYWNlID0gb2Zmc2V0X3NjcmVlbnNwYWNlIC8gdmlld3BvcnRTaXplICogMi4wO1xuXG4gIHJldHVybiBvZmZzZXRfY2xpcHNwYWNlO1xufVxuXG52b2lkIG1haW4odm9pZCkge1xuICAvLyBQb3NpdGlvblxuICB2ZWMzIHNvdXJjZVBvcyA9IHByb2plY3RfcG9zaXRpb24oaW5zdGFuY2VTb3VyY2VQb3NpdGlvbnMpO1xuICB2ZWMzIHRhcmdldFBvcyA9IHByb2plY3RfcG9zaXRpb24oaW5zdGFuY2VUYXJnZXRQb3NpdGlvbnMpO1xuICB2ZWM0IHNvdXJjZSA9IHByb2plY3RfdG9fY2xpcHNwYWNlKHZlYzQoc291cmNlUG9zLCAxLjApKTtcbiAgdmVjNCB0YXJnZXQgPSBwcm9qZWN0X3RvX2NsaXBzcGFjZSh2ZWM0KHRhcmdldFBvcywgMS4wKSk7XG5cbiAgLy8gbGluZWFyIGludGVycG9sYXRpb24gb2Ygc291cmNlICYgdGFyZ2V0IHRvIHBpY2sgcmlnaHQgY29vcmRcbiAgZmxvYXQgc2VnbWVudEluZGV4ID0gcG9zaXRpb25zLng7XG4gIHZlYzQgcCA9IG1peChzb3VyY2UsIHRhcmdldCwgc2VnbWVudEluZGV4KTtcblxuICAvLyBleHRydWRlXG4gIHZlYzIgb2Zmc2V0ID0gZ2V0RXh0cnVzaW9uT2Zmc2V0KHRhcmdldC54eSAtIHNvdXJjZS54eSwgcG9zaXRpb25zLnkpO1xuICBnbF9Qb3NpdGlvbiA9IHAgKyB2ZWM0KG9mZnNldCwgMC4wLCAwLjApO1xuXG4gIC8vIENvbG9yXG4gIHZlYzQgY29sb3IgPSB2ZWM0KGluc3RhbmNlQ29sb3JzLnJnYiwgaW5zdGFuY2VDb2xvcnMuYSAqIG9wYWNpdHkpIC8gMjU1LjtcbiAgdmVjNCBwaWNraW5nQ29sb3IgPSB2ZWM0KGluc3RhbmNlUGlja2luZ0NvbG9ycyAvIDI1NS4sIDEuKTtcbiAgdkNvbG9yID0gbWl4KFxuICAgIGNvbG9yLFxuICAgIHBpY2tpbmdDb2xvcixcbiAgICByZW5kZXJQaWNraW5nQnVmZmVyXG4gICk7XG59XG5gO1xuIl19
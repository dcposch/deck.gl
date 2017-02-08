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

exports.default = "#define SHADER_NAME point-cloud-layer-vertex-shader\n\nattribute vec3 positions;\n\nattribute vec3 instancePositions;\nattribute vec3 instanceNormals;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\nuniform float renderPickingBuffer;\nuniform float opacity;\nuniform float radius;\nuniform vec2 viewportSize;\n\nvarying vec4 vColor;\nvarying vec2 unitPosition;\n\nvoid main(void) {\n  // position on the containing square in [-1, 1] space\n  unitPosition = positions.xy;\n\n  // Find the center of the point and add the current vertex\n  vec4 position_worldspace = vec4(project_position(instancePositions), 1.0);\n  vec2 vertex = positions.xy * radius / viewportSize * 2.0;\n  gl_Position = project_to_clipspace(position_worldspace) + vec4(vertex, 0.0, 0.0);\n\n  // Apply lighting\n  float lightWeight = getLightWeight(position_worldspace, instanceNormals);\n\n  // Apply opacity to instance color, or return instance picking color\n  vec4 color = vec4(lightWeight * instanceColors.rgb, instanceColors.a * opacity) / 255.;\n  vec4 pickingColor = vec4(instancePickingColors / 255., 1.);\n  vColor = mix(color, pickingColor, renderPickingBuffer);\n}\n";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wb2ludC1jbG91ZC1sYXllci9wb2ludC1jbG91ZC1sYXllci12ZXJ0ZXguZ2xzbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBvaW50LWNsb3VkLWxheWVyLXZlcnRleC5nbHNsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuZXhwb3J0IGRlZmF1bHQgYFxcXG4jZGVmaW5lIFNIQURFUl9OQU1FIHBvaW50LWNsb3VkLWxheWVyLXZlcnRleC1zaGFkZXJcblxuYXR0cmlidXRlIHZlYzMgcG9zaXRpb25zO1xuXG5hdHRyaWJ1dGUgdmVjMyBpbnN0YW5jZVBvc2l0aW9ucztcbmF0dHJpYnV0ZSB2ZWMzIGluc3RhbmNlTm9ybWFscztcbmF0dHJpYnV0ZSB2ZWM0IGluc3RhbmNlQ29sb3JzO1xuYXR0cmlidXRlIHZlYzMgaW5zdGFuY2VQaWNraW5nQ29sb3JzO1xuXG51bmlmb3JtIGZsb2F0IHJlbmRlclBpY2tpbmdCdWZmZXI7XG51bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG51bmlmb3JtIGZsb2F0IHJhZGl1cztcbnVuaWZvcm0gdmVjMiB2aWV3cG9ydFNpemU7XG5cbnZhcnlpbmcgdmVjNCB2Q29sb3I7XG52YXJ5aW5nIHZlYzIgdW5pdFBvc2l0aW9uO1xuXG52b2lkIG1haW4odm9pZCkge1xuICAvLyBwb3NpdGlvbiBvbiB0aGUgY29udGFpbmluZyBzcXVhcmUgaW4gWy0xLCAxXSBzcGFjZVxuICB1bml0UG9zaXRpb24gPSBwb3NpdGlvbnMueHk7XG5cbiAgLy8gRmluZCB0aGUgY2VudGVyIG9mIHRoZSBwb2ludCBhbmQgYWRkIHRoZSBjdXJyZW50IHZlcnRleFxuICB2ZWM0IHBvc2l0aW9uX3dvcmxkc3BhY2UgPSB2ZWM0KHByb2plY3RfcG9zaXRpb24oaW5zdGFuY2VQb3NpdGlvbnMpLCAxLjApO1xuICB2ZWMyIHZlcnRleCA9IHBvc2l0aW9ucy54eSAqIHJhZGl1cyAvIHZpZXdwb3J0U2l6ZSAqIDIuMDtcbiAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0X3RvX2NsaXBzcGFjZShwb3NpdGlvbl93b3JsZHNwYWNlKSArIHZlYzQodmVydGV4LCAwLjAsIDAuMCk7XG5cbiAgLy8gQXBwbHkgbGlnaHRpbmdcbiAgZmxvYXQgbGlnaHRXZWlnaHQgPSBnZXRMaWdodFdlaWdodChwb3NpdGlvbl93b3JsZHNwYWNlLCBpbnN0YW5jZU5vcm1hbHMpO1xuXG4gIC8vIEFwcGx5IG9wYWNpdHkgdG8gaW5zdGFuY2UgY29sb3IsIG9yIHJldHVybiBpbnN0YW5jZSBwaWNraW5nIGNvbG9yXG4gIHZlYzQgY29sb3IgPSB2ZWM0KGxpZ2h0V2VpZ2h0ICogaW5zdGFuY2VDb2xvcnMucmdiLCBpbnN0YW5jZUNvbG9ycy5hICogb3BhY2l0eSkgLyAyNTUuO1xuICB2ZWM0IHBpY2tpbmdDb2xvciA9IHZlYzQoaW5zdGFuY2VQaWNraW5nQ29sb3JzIC8gMjU1LiwgMS4pO1xuICB2Q29sb3IgPSBtaXgoY29sb3IsIHBpY2tpbmdDb2xvciwgcmVuZGVyUGlja2luZ0J1ZmZlcik7XG59XG5gO1xuIl19
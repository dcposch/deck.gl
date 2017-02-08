"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Copyright (c) 2017 Uber Technologies, Inc.
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

// Inspired by screen-grid-layer vertex shader in deck.gl

exports.default = "#define SHADER_NAME grid-layer-vs\n\nattribute vec3 positions;\nattribute vec3 normals;\n\nattribute vec4 instancePositions;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\n// Picking uniforms\n// Set to 1.0 if rendering picking buffer, 0.0 if rendering for display\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\n// Custom uniforms\nuniform float extruded;\nuniform float lonOffset;\nuniform float latOffset;\nuniform float opacity;\nuniform float elevationScale;\n\n// A magic number to scale elevation so that 1 unit approximate to 1 meter\n#define ELEVATION_SCALE 0.8\n\n// Result\nvarying vec4 vColor;\n\n// whether is point picked\nfloat isPicked(vec3 pickingColors, vec3 selectedColor) {\n return float(pickingColors.x == selectedColor.x\n && pickingColors.y == selectedColor.y\n && pickingColors.z == selectedColor.z);\n}\n\nvoid main(void) {\n\n  // cube gemoetry vertics are between -1 to 1, scale and transform it to between 0, 1\n  vec2 ptPosition = instancePositions.xy + vec2((positions.x + 1.0 ) *\n    lonOffset / 2.0, (positions.y + 1.0) * latOffset / 2.0);\n\n  vec2 pos = project_position(ptPosition);\n\n  float elevation = 0.0;\n\n  if (extruded > 0.5) {\n    elevation = project_scale(instancePositions.w  * (positions.z + 1.0) *\n      ELEVATION_SCALE * elevationScale);\n  }\n\n  // extrude positions\n  vec3 extrudedPosition = vec3(pos.xy, elevation + 1.0);\n  vec4 position_worldspace = vec4(extrudedPosition, 1.0);\n  gl_Position = project_to_clipspace(position_worldspace);\n\n  if (renderPickingBuffer < 0.5) {\n\n    // TODO: we should allow the user to specify the color for \"selected element\"\n    // check whether a bar is currently picked.\n    float selected = isPicked(instancePickingColors, selectedPickingColor);\n\n    float lightWeight = 1.0;\n\n    if (extruded > 0.5) {\n      lightWeight = getLightWeight(\n        position_worldspace,\n        normals\n      );\n    }\n\n    vec3 lightWeightedColor = lightWeight * instanceColors.rgb;\n    vec4 color = vec4(lightWeightedColor, instanceColors.a * opacity) / 255.0;\n    vColor = color;\n\n  } else {\n\n    vec4 pickingColor = vec4(instancePickingColors / 255.0, 1.0);\n     vColor = pickingColor;\n\n  }\n}\n";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9ncmlkLWNlbGwtbGF5ZXIvZ3JpZC1jZWxsLWxheWVyLXZlcnRleC5nbHNsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJmaWxlIjoiZ3JpZC1jZWxsLWxheWVyLXZlcnRleC5nbHNsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuLy8gSW5zcGlyZWQgYnkgc2NyZWVuLWdyaWQtbGF5ZXIgdmVydGV4IHNoYWRlciBpbiBkZWNrLmdsXG5cbmV4cG9ydCBkZWZhdWx0IGBcXFxuI2RlZmluZSBTSEFERVJfTkFNRSBncmlkLWxheWVyLXZzXG5cbmF0dHJpYnV0ZSB2ZWMzIHBvc2l0aW9ucztcbmF0dHJpYnV0ZSB2ZWMzIG5vcm1hbHM7XG5cbmF0dHJpYnV0ZSB2ZWM0IGluc3RhbmNlUG9zaXRpb25zO1xuYXR0cmlidXRlIHZlYzQgaW5zdGFuY2VDb2xvcnM7XG5hdHRyaWJ1dGUgdmVjMyBpbnN0YW5jZVBpY2tpbmdDb2xvcnM7XG5cbi8vIFBpY2tpbmcgdW5pZm9ybXNcbi8vIFNldCB0byAxLjAgaWYgcmVuZGVyaW5nIHBpY2tpbmcgYnVmZmVyLCAwLjAgaWYgcmVuZGVyaW5nIGZvciBkaXNwbGF5XG51bmlmb3JtIGZsb2F0IHJlbmRlclBpY2tpbmdCdWZmZXI7XG51bmlmb3JtIHZlYzMgc2VsZWN0ZWRQaWNraW5nQ29sb3I7XG5cbi8vIEN1c3RvbSB1bmlmb3Jtc1xudW5pZm9ybSBmbG9hdCBleHRydWRlZDtcbnVuaWZvcm0gZmxvYXQgbG9uT2Zmc2V0O1xudW5pZm9ybSBmbG9hdCBsYXRPZmZzZXQ7XG51bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG51bmlmb3JtIGZsb2F0IGVsZXZhdGlvblNjYWxlO1xuXG4vLyBBIG1hZ2ljIG51bWJlciB0byBzY2FsZSBlbGV2YXRpb24gc28gdGhhdCAxIHVuaXQgYXBwcm94aW1hdGUgdG8gMSBtZXRlclxuI2RlZmluZSBFTEVWQVRJT05fU0NBTEUgMC44XG5cbi8vIFJlc3VsdFxudmFyeWluZyB2ZWM0IHZDb2xvcjtcblxuLy8gd2hldGhlciBpcyBwb2ludCBwaWNrZWRcbmZsb2F0IGlzUGlja2VkKHZlYzMgcGlja2luZ0NvbG9ycywgdmVjMyBzZWxlY3RlZENvbG9yKSB7XG4gcmV0dXJuIGZsb2F0KHBpY2tpbmdDb2xvcnMueCA9PSBzZWxlY3RlZENvbG9yLnhcbiAmJiBwaWNraW5nQ29sb3JzLnkgPT0gc2VsZWN0ZWRDb2xvci55XG4gJiYgcGlja2luZ0NvbG9ycy56ID09IHNlbGVjdGVkQ29sb3Iueik7XG59XG5cbnZvaWQgbWFpbih2b2lkKSB7XG5cbiAgLy8gY3ViZSBnZW1vZXRyeSB2ZXJ0aWNzIGFyZSBiZXR3ZWVuIC0xIHRvIDEsIHNjYWxlIGFuZCB0cmFuc2Zvcm0gaXQgdG8gYmV0d2VlbiAwLCAxXG4gIHZlYzIgcHRQb3NpdGlvbiA9IGluc3RhbmNlUG9zaXRpb25zLnh5ICsgdmVjMigocG9zaXRpb25zLnggKyAxLjAgKSAqXG4gICAgbG9uT2Zmc2V0IC8gMi4wLCAocG9zaXRpb25zLnkgKyAxLjApICogbGF0T2Zmc2V0IC8gMi4wKTtcblxuICB2ZWMyIHBvcyA9IHByb2plY3RfcG9zaXRpb24ocHRQb3NpdGlvbik7XG5cbiAgZmxvYXQgZWxldmF0aW9uID0gMC4wO1xuXG4gIGlmIChleHRydWRlZCA+IDAuNSkge1xuICAgIGVsZXZhdGlvbiA9IHByb2plY3Rfc2NhbGUoaW5zdGFuY2VQb3NpdGlvbnMudyAgKiAocG9zaXRpb25zLnogKyAxLjApICpcbiAgICAgIEVMRVZBVElPTl9TQ0FMRSAqIGVsZXZhdGlvblNjYWxlKTtcbiAgfVxuXG4gIC8vIGV4dHJ1ZGUgcG9zaXRpb25zXG4gIHZlYzMgZXh0cnVkZWRQb3NpdGlvbiA9IHZlYzMocG9zLnh5LCBlbGV2YXRpb24gKyAxLjApO1xuICB2ZWM0IHBvc2l0aW9uX3dvcmxkc3BhY2UgPSB2ZWM0KGV4dHJ1ZGVkUG9zaXRpb24sIDEuMCk7XG4gIGdsX1Bvc2l0aW9uID0gcHJvamVjdF90b19jbGlwc3BhY2UocG9zaXRpb25fd29ybGRzcGFjZSk7XG5cbiAgaWYgKHJlbmRlclBpY2tpbmdCdWZmZXIgPCAwLjUpIHtcblxuICAgIC8vIFRPRE86IHdlIHNob3VsZCBhbGxvdyB0aGUgdXNlciB0byBzcGVjaWZ5IHRoZSBjb2xvciBmb3IgXCJzZWxlY3RlZCBlbGVtZW50XCJcbiAgICAvLyBjaGVjayB3aGV0aGVyIGEgYmFyIGlzIGN1cnJlbnRseSBwaWNrZWQuXG4gICAgZmxvYXQgc2VsZWN0ZWQgPSBpc1BpY2tlZChpbnN0YW5jZVBpY2tpbmdDb2xvcnMsIHNlbGVjdGVkUGlja2luZ0NvbG9yKTtcblxuICAgIGZsb2F0IGxpZ2h0V2VpZ2h0ID0gMS4wO1xuXG4gICAgaWYgKGV4dHJ1ZGVkID4gMC41KSB7XG4gICAgICBsaWdodFdlaWdodCA9IGdldExpZ2h0V2VpZ2h0KFxuICAgICAgICBwb3NpdGlvbl93b3JsZHNwYWNlLFxuICAgICAgICBub3JtYWxzXG4gICAgICApO1xuICAgIH1cblxuICAgIHZlYzMgbGlnaHRXZWlnaHRlZENvbG9yID0gbGlnaHRXZWlnaHQgKiBpbnN0YW5jZUNvbG9ycy5yZ2I7XG4gICAgdmVjNCBjb2xvciA9IHZlYzQobGlnaHRXZWlnaHRlZENvbG9yLCBpbnN0YW5jZUNvbG9ycy5hICogb3BhY2l0eSkgLyAyNTUuMDtcbiAgICB2Q29sb3IgPSBjb2xvcjtcblxuICB9IGVsc2Uge1xuXG4gICAgdmVjNCBwaWNraW5nQ29sb3IgPSB2ZWM0KGluc3RhbmNlUGlja2luZ0NvbG9ycyAvIDI1NS4wLCAxLjApO1xuICAgICB2Q29sb3IgPSBwaWNraW5nQ29sb3I7XG5cbiAgfVxufVxuYDtcbiJdfQ==
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Copyright (c) 2016 Uber Technologies, Inc.
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

exports.default = "#define SHADER_NAME path-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform float jointType;\nuniform float miterLimit;\n\nvarying vec4 vColor;\nvarying vec2 vCornerOffset;\nvarying float vMiterLength;\n\nvoid main(void) {\n  // if joint is rounded, test distance from the corner\n  if (jointType > 0.0 && vMiterLength > 0.0 && length(vCornerOffset) > 1.0) {\n    discard;\n  }\n  if (jointType == 0.0 && vMiterLength > miterLimit) {\n    discard;\n  }\n  gl_FragColor = vColor;\n}\n";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9wYXRoLWxheWVyL3BhdGgtbGF5ZXItZnJhZ21lbnQuZ2xzbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBhdGgtbGF5ZXItZnJhZ21lbnQuZ2xzbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNiBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmV4cG9ydCBkZWZhdWx0IGBcXFxuI2RlZmluZSBTSEFERVJfTkFNRSBwYXRoLWxheWVyLWZyYWdtZW50LXNoYWRlclxuXG4jaWZkZWYgR0xfRVNcbnByZWNpc2lvbiBoaWdocCBmbG9hdDtcbiNlbmRpZlxuXG51bmlmb3JtIGZsb2F0IGpvaW50VHlwZTtcbnVuaWZvcm0gZmxvYXQgbWl0ZXJMaW1pdDtcblxudmFyeWluZyB2ZWM0IHZDb2xvcjtcbnZhcnlpbmcgdmVjMiB2Q29ybmVyT2Zmc2V0O1xudmFyeWluZyBmbG9hdCB2TWl0ZXJMZW5ndGg7XG5cbnZvaWQgbWFpbih2b2lkKSB7XG4gIC8vIGlmIGpvaW50IGlzIHJvdW5kZWQsIHRlc3QgZGlzdGFuY2UgZnJvbSB0aGUgY29ybmVyXG4gIGlmIChqb2ludFR5cGUgPiAwLjAgJiYgdk1pdGVyTGVuZ3RoID4gMC4wICYmIGxlbmd0aCh2Q29ybmVyT2Zmc2V0KSA+IDEuMCkge1xuICAgIGRpc2NhcmQ7XG4gIH1cbiAgaWYgKGpvaW50VHlwZSA9PSAwLjAgJiYgdk1pdGVyTGVuZ3RoID4gbWl0ZXJMaW1pdCkge1xuICAgIGRpc2NhcmQ7XG4gIH1cbiAgZ2xfRnJhZ0NvbG9yID0gdkNvbG9yO1xufVxuYDtcbiJdfQ==
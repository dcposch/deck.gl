"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.linearScale = linearScale;
exports.quantizeScale = quantizeScale;
exports.clamp = clamp;
// Linear scale maps continuous domain to continuous range
function linearScale(domain, range, value) {

  return (value - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]) + range[0];
}

// Quantize scale is similar to linear scales,
// except it uses a discrete rather than continuous range
function quantizeScale(domain, range, value) {
  var step = (domain[1] - domain[0]) / range.length;
  var idx = Math.floor((value - domain[0]) / step);
  var clampIdx = Math.max(Math.min(idx, range.length - 1), 0);

  return range[clampIdx];
}

function clamp(_ref, value) {
  var _ref2 = _slicedToArray(_ref, 2),
      min = _ref2[0],
      max = _ref2[1];

  return Math.min(max, Math.max(min, value));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9zY2FsZS11dGlscy5qcyJdLCJuYW1lcyI6WyJsaW5lYXJTY2FsZSIsInF1YW50aXplU2NhbGUiLCJjbGFtcCIsImRvbWFpbiIsInJhbmdlIiwidmFsdWUiLCJzdGVwIiwibGVuZ3RoIiwiaWR4IiwiTWF0aCIsImZsb29yIiwiY2xhbXBJZHgiLCJtYXgiLCJtaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1FBQ2dCQSxXLEdBQUFBLFc7UUFPQUMsYSxHQUFBQSxhO1FBUUFDLEssR0FBQUEsSztBQWhCaEI7QUFDTyxTQUFTRixXQUFULENBQXFCRyxNQUFyQixFQUE2QkMsS0FBN0IsRUFBb0NDLEtBQXBDLEVBQTJDOztBQUVoRCxTQUFPLENBQUNBLFFBQVFGLE9BQU8sQ0FBUCxDQUFULEtBQXVCQSxPQUFPLENBQVAsSUFBWUEsT0FBTyxDQUFQLENBQW5DLEtBQWlEQyxNQUFNLENBQU4sSUFBV0EsTUFBTSxDQUFOLENBQTVELElBQXdFQSxNQUFNLENBQU4sQ0FBL0U7QUFDRDs7QUFFRDtBQUNBO0FBQ08sU0FBU0gsYUFBVCxDQUF1QkUsTUFBdkIsRUFBK0JDLEtBQS9CLEVBQXNDQyxLQUF0QyxFQUE2QztBQUNsRCxNQUFNQyxPQUFPLENBQUNILE9BQU8sQ0FBUCxJQUFZQSxPQUFPLENBQVAsQ0FBYixJQUEwQkMsTUFBTUcsTUFBN0M7QUFDQSxNQUFNQyxNQUFNQyxLQUFLQyxLQUFMLENBQVcsQ0FBQ0wsUUFBUUYsT0FBTyxDQUFQLENBQVQsSUFBc0JHLElBQWpDLENBQVo7QUFDQSxNQUFNSyxXQUFXRixLQUFLRyxHQUFMLENBQVNILEtBQUtJLEdBQUwsQ0FBU0wsR0FBVCxFQUFjSixNQUFNRyxNQUFOLEdBQWUsQ0FBN0IsQ0FBVCxFQUEwQyxDQUExQyxDQUFqQjs7QUFFQSxTQUFPSCxNQUFNTyxRQUFOLENBQVA7QUFDRDs7QUFFTSxTQUFTVCxLQUFULE9BQTJCRyxLQUEzQixFQUFrQztBQUFBO0FBQUEsTUFBbEJRLEdBQWtCO0FBQUEsTUFBYkQsR0FBYTs7QUFDdkMsU0FBT0gsS0FBS0ksR0FBTCxDQUFTRCxHQUFULEVBQWNILEtBQUtHLEdBQUwsQ0FBU0MsR0FBVCxFQUFjUixLQUFkLENBQWQsQ0FBUDtBQUNEIiwiZmlsZSI6InNjYWxlLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTGluZWFyIHNjYWxlIG1hcHMgY29udGludW91cyBkb21haW4gdG8gY29udGludW91cyByYW5nZVxuZXhwb3J0IGZ1bmN0aW9uIGxpbmVhclNjYWxlKGRvbWFpbiwgcmFuZ2UsIHZhbHVlKSB7XG5cbiAgcmV0dXJuICh2YWx1ZSAtIGRvbWFpblswXSkgLyAoZG9tYWluWzFdIC0gZG9tYWluWzBdKSAqIChyYW5nZVsxXSAtIHJhbmdlWzBdKSArIHJhbmdlWzBdO1xufVxuXG4vLyBRdWFudGl6ZSBzY2FsZSBpcyBzaW1pbGFyIHRvIGxpbmVhciBzY2FsZXMsXG4vLyBleGNlcHQgaXQgdXNlcyBhIGRpc2NyZXRlIHJhdGhlciB0aGFuIGNvbnRpbnVvdXMgcmFuZ2VcbmV4cG9ydCBmdW5jdGlvbiBxdWFudGl6ZVNjYWxlKGRvbWFpbiwgcmFuZ2UsIHZhbHVlKSB7XG4gIGNvbnN0IHN0ZXAgPSAoZG9tYWluWzFdIC0gZG9tYWluWzBdKSAvIHJhbmdlLmxlbmd0aDtcbiAgY29uc3QgaWR4ID0gTWF0aC5mbG9vcigodmFsdWUgLSBkb21haW5bMF0pIC8gc3RlcCk7XG4gIGNvbnN0IGNsYW1wSWR4ID0gTWF0aC5tYXgoTWF0aC5taW4oaWR4LCByYW5nZS5sZW5ndGggLSAxKSwgMCk7XG5cbiAgcmV0dXJuIHJhbmdlW2NsYW1wSWR4XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKFttaW4sIG1heF0sIHZhbHVlKSB7XG4gIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdmFsdWUpKTtcbn1cbiJdfQ==
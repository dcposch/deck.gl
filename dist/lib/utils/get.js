'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.get = get;
/**
 * Access properties of nested containers using dot-path notation
 * - Supports plain objects and arrays, as well as classes with `get` methods
 *   such as ES6 Maps, Immutable.js objects etc
 * - Returns undefined if any container is not valid, instead of throwing
 *
 * @param {Object} container - container that supports get
 * @param {String|*} compositeKey - key to access, can be '.'-separated string
 * @return {*} - value in the final key of the nested container
 */
function get(container, compositeKey) {
  // Split the key into subkeys
  var keyList = getKeys(compositeKey);
  // Recursively get the value of each key;
  var value = container;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = keyList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;

      // If any intermediate subfield is not a container, return undefined
      if (!isObject(value)) {
        return undefined;
      }
      // Get the `getter` for this container
      var getter = getGetter(value);
      // Use the getter to get the value for the key
      value = getter(value, key);
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

  return value;
}

/**
 * Checks if argument is an indexable object (not a primitive value, nor null)
 * @param {*} value - JavaScript value to be tested
 * @return {Boolean} - true if argument is a JavaScript object
 */
function isObject(value) {
  return value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
}

// Default getter is container indexing
var squareBracketGetter = function squareBracketGetter(container, key) {
  return container[key];
};
var getMethodGetter = function getMethodGetter(obj, key) {
  return obj.get(key);
};
// Cache key to key arrays for speed
var keyMap = {};

// Looks for a `get` function on the prototype
// TODO - follow prototype chain?
// @private
// @return {Function} - get function: (container, key) => value
function getGetter(container) {
  // Check if container has a special get method
  var prototype = Object.getPrototypeOf(container);
  return prototype.get ? getMethodGetter : squareBracketGetter;
}

// Takes a string of '.' separated keys and returns an array of keys
// E.g. 'feature.geometry.type' => 'feature', 'geometry', 'type'
// @private
function getKeys(compositeKey) {
  if (typeof compositeKey === 'string') {
    // else assume string and split around dots
    var keyList = keyMap[compositeKey];
    if (!keyList) {
      keyList = compositeKey.split('.');
      keyMap[compositeKey] = keyList;
    }
    return keyList;
  }
  // Wrap in array if needed
  return Array.isArray(compositeKey) ? compositeKey : [compositeKey];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdXRpbHMvZ2V0LmpzIl0sIm5hbWVzIjpbImdldCIsImNvbnRhaW5lciIsImNvbXBvc2l0ZUtleSIsImtleUxpc3QiLCJnZXRLZXlzIiwidmFsdWUiLCJrZXkiLCJpc09iamVjdCIsInVuZGVmaW5lZCIsImdldHRlciIsImdldEdldHRlciIsInNxdWFyZUJyYWNrZXRHZXR0ZXIiLCJnZXRNZXRob2RHZXR0ZXIiLCJvYmoiLCJrZXlNYXAiLCJwcm90b3R5cGUiLCJPYmplY3QiLCJnZXRQcm90b3R5cGVPZiIsInNwbGl0IiwiQXJyYXkiLCJpc0FycmF5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQVVnQkEsRyxHQUFBQSxHO0FBVmhCOzs7Ozs7Ozs7O0FBVU8sU0FBU0EsR0FBVCxDQUFhQyxTQUFiLEVBQXdCQyxZQUF4QixFQUFzQztBQUMzQztBQUNBLE1BQU1DLFVBQVVDLFFBQVFGLFlBQVIsQ0FBaEI7QUFDQTtBQUNBLE1BQUlHLFFBQVFKLFNBQVo7QUFKMkM7QUFBQTtBQUFBOztBQUFBO0FBSzNDLHlCQUFrQkUsT0FBbEIsOEhBQTJCO0FBQUEsVUFBaEJHLEdBQWdCOztBQUN6QjtBQUNBLFVBQUksQ0FBQ0MsU0FBU0YsS0FBVCxDQUFMLEVBQXNCO0FBQ3BCLGVBQU9HLFNBQVA7QUFDRDtBQUNEO0FBQ0EsVUFBTUMsU0FBU0MsVUFBVUwsS0FBVixDQUFmO0FBQ0E7QUFDQUEsY0FBUUksT0FBT0osS0FBUCxFQUFjQyxHQUFkLENBQVI7QUFDRDtBQWQwQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQWUzQyxTQUFPRCxLQUFQO0FBQ0Q7O0FBRUQ7Ozs7O0FBS0EsU0FBU0UsUUFBVCxDQUFrQkYsS0FBbEIsRUFBeUI7QUFDdkIsU0FBT0EsVUFBVSxJQUFWLElBQWtCLFFBQU9BLEtBQVAseUNBQU9BLEtBQVAsT0FBaUIsUUFBMUM7QUFDRDs7QUFFRDtBQUNBLElBQU1NLHNCQUFzQixTQUF0QkEsbUJBQXNCLENBQUNWLFNBQUQsRUFBWUssR0FBWjtBQUFBLFNBQW9CTCxVQUFVSyxHQUFWLENBQXBCO0FBQUEsQ0FBNUI7QUFDQSxJQUFNTSxrQkFBa0IsU0FBbEJBLGVBQWtCLENBQUNDLEdBQUQsRUFBTVAsR0FBTjtBQUFBLFNBQWNPLElBQUliLEdBQUosQ0FBUU0sR0FBUixDQUFkO0FBQUEsQ0FBeEI7QUFDQTtBQUNBLElBQU1RLFNBQVMsRUFBZjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNKLFNBQVQsQ0FBbUJULFNBQW5CLEVBQThCO0FBQzVCO0FBQ0EsTUFBTWMsWUFBWUMsT0FBT0MsY0FBUCxDQUFzQmhCLFNBQXRCLENBQWxCO0FBQ0EsU0FBT2MsVUFBVWYsR0FBVixHQUFnQlksZUFBaEIsR0FBa0NELG1CQUF6QztBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBLFNBQVNQLE9BQVQsQ0FBaUJGLFlBQWpCLEVBQStCO0FBQzdCLE1BQUksT0FBT0EsWUFBUCxLQUF3QixRQUE1QixFQUFzQztBQUNwQztBQUNBLFFBQUlDLFVBQVVXLE9BQU9aLFlBQVAsQ0FBZDtBQUNBLFFBQUksQ0FBQ0MsT0FBTCxFQUFjO0FBQ1pBLGdCQUFVRCxhQUFhZ0IsS0FBYixDQUFtQixHQUFuQixDQUFWO0FBQ0FKLGFBQU9aLFlBQVAsSUFBdUJDLE9BQXZCO0FBQ0Q7QUFDRCxXQUFPQSxPQUFQO0FBQ0Q7QUFDRDtBQUNBLFNBQU9nQixNQUFNQyxPQUFOLENBQWNsQixZQUFkLElBQThCQSxZQUE5QixHQUE2QyxDQUFDQSxZQUFELENBQXBEO0FBQ0QiLCJmaWxlIjoiZ2V0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBY2Nlc3MgcHJvcGVydGllcyBvZiBuZXN0ZWQgY29udGFpbmVycyB1c2luZyBkb3QtcGF0aCBub3RhdGlvblxuICogLSBTdXBwb3J0cyBwbGFpbiBvYmplY3RzIGFuZCBhcnJheXMsIGFzIHdlbGwgYXMgY2xhc3NlcyB3aXRoIGBnZXRgIG1ldGhvZHNcbiAqICAgc3VjaCBhcyBFUzYgTWFwcywgSW1tdXRhYmxlLmpzIG9iamVjdHMgZXRjXG4gKiAtIFJldHVybnMgdW5kZWZpbmVkIGlmIGFueSBjb250YWluZXIgaXMgbm90IHZhbGlkLCBpbnN0ZWFkIG9mIHRocm93aW5nXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRhaW5lciAtIGNvbnRhaW5lciB0aGF0IHN1cHBvcnRzIGdldFxuICogQHBhcmFtIHtTdHJpbmd8Kn0gY29tcG9zaXRlS2V5IC0ga2V5IHRvIGFjY2VzcywgY2FuIGJlICcuJy1zZXBhcmF0ZWQgc3RyaW5nXG4gKiBAcmV0dXJuIHsqfSAtIHZhbHVlIGluIHRoZSBmaW5hbCBrZXkgb2YgdGhlIG5lc3RlZCBjb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldChjb250YWluZXIsIGNvbXBvc2l0ZUtleSkge1xuICAvLyBTcGxpdCB0aGUga2V5IGludG8gc3Via2V5c1xuICBjb25zdCBrZXlMaXN0ID0gZ2V0S2V5cyhjb21wb3NpdGVLZXkpO1xuICAvLyBSZWN1cnNpdmVseSBnZXQgdGhlIHZhbHVlIG9mIGVhY2gga2V5O1xuICBsZXQgdmFsdWUgPSBjb250YWluZXI7XG4gIGZvciAoY29uc3Qga2V5IG9mIGtleUxpc3QpIHtcbiAgICAvLyBJZiBhbnkgaW50ZXJtZWRpYXRlIHN1YmZpZWxkIGlzIG5vdCBhIGNvbnRhaW5lciwgcmV0dXJuIHVuZGVmaW5lZFxuICAgIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBHZXQgdGhlIGBnZXR0ZXJgIGZvciB0aGlzIGNvbnRhaW5lclxuICAgIGNvbnN0IGdldHRlciA9IGdldEdldHRlcih2YWx1ZSk7XG4gICAgLy8gVXNlIHRoZSBnZXR0ZXIgdG8gZ2V0IHRoZSB2YWx1ZSBmb3IgdGhlIGtleVxuICAgIHZhbHVlID0gZ2V0dGVyKHZhbHVlLCBrZXkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYXJndW1lbnQgaXMgYW4gaW5kZXhhYmxlIG9iamVjdCAobm90IGEgcHJpbWl0aXZlIHZhbHVlLCBub3IgbnVsbClcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgLSBKYXZhU2NyaXB0IHZhbHVlIHRvIGJlIHRlc3RlZFxuICogQHJldHVybiB7Qm9vbGVhbn0gLSB0cnVlIGlmIGFyZ3VtZW50IGlzIGEgSmF2YVNjcmlwdCBvYmplY3RcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59XG5cbi8vIERlZmF1bHQgZ2V0dGVyIGlzIGNvbnRhaW5lciBpbmRleGluZ1xuY29uc3Qgc3F1YXJlQnJhY2tldEdldHRlciA9IChjb250YWluZXIsIGtleSkgPT4gY29udGFpbmVyW2tleV07XG5jb25zdCBnZXRNZXRob2RHZXR0ZXIgPSAob2JqLCBrZXkpID0+IG9iai5nZXQoa2V5KTtcbi8vIENhY2hlIGtleSB0byBrZXkgYXJyYXlzIGZvciBzcGVlZFxuY29uc3Qga2V5TWFwID0ge307XG5cbi8vIExvb2tzIGZvciBhIGBnZXRgIGZ1bmN0aW9uIG9uIHRoZSBwcm90b3R5cGVcbi8vIFRPRE8gLSBmb2xsb3cgcHJvdG90eXBlIGNoYWluP1xuLy8gQHByaXZhdGVcbi8vIEByZXR1cm4ge0Z1bmN0aW9ufSAtIGdldCBmdW5jdGlvbjogKGNvbnRhaW5lciwga2V5KSA9PiB2YWx1ZVxuZnVuY3Rpb24gZ2V0R2V0dGVyKGNvbnRhaW5lcikge1xuICAvLyBDaGVjayBpZiBjb250YWluZXIgaGFzIGEgc3BlY2lhbCBnZXQgbWV0aG9kXG4gIGNvbnN0IHByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihjb250YWluZXIpO1xuICByZXR1cm4gcHJvdG90eXBlLmdldCA/IGdldE1ldGhvZEdldHRlciA6IHNxdWFyZUJyYWNrZXRHZXR0ZXI7XG59XG5cbi8vIFRha2VzIGEgc3RyaW5nIG9mICcuJyBzZXBhcmF0ZWQga2V5cyBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBrZXlzXG4vLyBFLmcuICdmZWF0dXJlLmdlb21ldHJ5LnR5cGUnID0+ICdmZWF0dXJlJywgJ2dlb21ldHJ5JywgJ3R5cGUnXG4vLyBAcHJpdmF0ZVxuZnVuY3Rpb24gZ2V0S2V5cyhjb21wb3NpdGVLZXkpIHtcbiAgaWYgKHR5cGVvZiBjb21wb3NpdGVLZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgLy8gZWxzZSBhc3N1bWUgc3RyaW5nIGFuZCBzcGxpdCBhcm91bmQgZG90c1xuICAgIGxldCBrZXlMaXN0ID0ga2V5TWFwW2NvbXBvc2l0ZUtleV07XG4gICAgaWYgKCFrZXlMaXN0KSB7XG4gICAgICBrZXlMaXN0ID0gY29tcG9zaXRlS2V5LnNwbGl0KCcuJyk7XG4gICAgICBrZXlNYXBbY29tcG9zaXRlS2V5XSA9IGtleUxpc3Q7XG4gICAgfVxuICAgIHJldHVybiBrZXlMaXN0O1xuICB9XG4gIC8vIFdyYXAgaW4gYXJyYXkgaWYgbmVlZGVkXG4gIHJldHVybiBBcnJheS5pc0FycmF5KGNvbXBvc2l0ZUtleSkgPyBjb21wb3NpdGVLZXkgOiBbY29tcG9zaXRlS2V5XTtcbn1cbiJdfQ==
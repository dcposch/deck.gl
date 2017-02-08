'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.count = count;
var ERR_NOT_OBJECT = 'count(): argument not an object';
var ERR_NOT_CONTAINER = 'count(): argument not a container';

/**
 * Deduces numer of elements in a JavaScript container.
 * - Auto-deduction for ES6 containers that define a count() method
 * - Auto-deduction for ES6 containers that define a size member
 * - Auto-deduction for Classic Arrays via the built-in length attribute
 * - Also handles objects, although note that this an O(N) operation
 */
function count(container) {
  if (!isObject(container)) {
    throw new Error(ERR_NOT_OBJECT);
  }

  // Check if ES6 collection "count" function is available
  if (typeof container.count === 'function') {
    return container.count();
  }

  // Check if ES6 collection "size" attribute is set
  if (Number.isFinite(container.size)) {
    return container.size;
  }

  // Check if array length attribute is set
  // Note: checking this last since some ES6 collections (Immutable.js)
  // emit profuse warnings when trying to access `length` attribute
  if (Number.isFinite(container.length)) {
    return container.length;
  }

  // Note that getting the count of an object is O(N)
  if (isPlainObject(container)) {
    var counter = 0;
    for (var key in container) {
      // eslint-disable-line
      counter++;
    }
    return counter;
  }

  throw new Error(ERR_NOT_CONTAINER);
}

/**
 * Checks if argument is a plain object (not a class or array etc)
 * @param {*} value - JavaScript value to be tested
 * @return {Boolean} - true if argument is a plain JavaScript object
 */
function isPlainObject(value) {
  return value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Object;
}

/**
 * Checks if argument is an indexable object (not a primitive value, nor null)
 * @param {*} value - JavaScript value to be tested
 * @return {Boolean} - true if argument is a JavaScript object
 */
function isObject(value) {
  return value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdXRpbHMvY291bnQuanMiXSwibmFtZXMiOlsiY291bnQiLCJFUlJfTk9UX09CSkVDVCIsIkVSUl9OT1RfQ09OVEFJTkVSIiwiY29udGFpbmVyIiwiaXNPYmplY3QiLCJFcnJvciIsIk51bWJlciIsImlzRmluaXRlIiwic2l6ZSIsImxlbmd0aCIsImlzUGxhaW5PYmplY3QiLCJjb3VudGVyIiwia2V5IiwidmFsdWUiLCJjb25zdHJ1Y3RvciIsIk9iamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFVZ0JBLEssR0FBQUEsSztBQVZoQixJQUFNQyxpQkFBaUIsaUNBQXZCO0FBQ0EsSUFBTUMsb0JBQW9CLG1DQUExQjs7QUFFQTs7Ozs7OztBQU9PLFNBQVNGLEtBQVQsQ0FBZUcsU0FBZixFQUEwQjtBQUMvQixNQUFJLENBQUNDLFNBQVNELFNBQVQsQ0FBTCxFQUEwQjtBQUN4QixVQUFNLElBQUlFLEtBQUosQ0FBVUosY0FBVixDQUFOO0FBQ0Q7O0FBRUQ7QUFDQSxNQUFJLE9BQU9FLFVBQVVILEtBQWpCLEtBQTJCLFVBQS9CLEVBQTJDO0FBQ3pDLFdBQU9HLFVBQVVILEtBQVYsRUFBUDtBQUNEOztBQUVEO0FBQ0EsTUFBSU0sT0FBT0MsUUFBUCxDQUFnQkosVUFBVUssSUFBMUIsQ0FBSixFQUFxQztBQUNuQyxXQUFPTCxVQUFVSyxJQUFqQjtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBLE1BQUlGLE9BQU9DLFFBQVAsQ0FBZ0JKLFVBQVVNLE1BQTFCLENBQUosRUFBdUM7QUFDckMsV0FBT04sVUFBVU0sTUFBakI7QUFDRDs7QUFFRDtBQUNBLE1BQUlDLGNBQWNQLFNBQWQsQ0FBSixFQUE4QjtBQUM1QixRQUFJUSxVQUFVLENBQWQ7QUFDQSxTQUFLLElBQU1DLEdBQVgsSUFBa0JULFNBQWxCLEVBQTZCO0FBQUU7QUFDN0JRO0FBQ0Q7QUFDRCxXQUFPQSxPQUFQO0FBQ0Q7O0FBRUQsUUFBTSxJQUFJTixLQUFKLENBQVVILGlCQUFWLENBQU47QUFDRDs7QUFFRDs7Ozs7QUFLQSxTQUFTUSxhQUFULENBQXVCRyxLQUF2QixFQUE4QjtBQUM1QixTQUFPQSxVQUFVLElBQVYsSUFBa0IsUUFBT0EsS0FBUCx5Q0FBT0EsS0FBUCxPQUFpQixRQUFuQyxJQUErQ0EsTUFBTUMsV0FBTixLQUFzQkMsTUFBNUU7QUFDRDs7QUFFRDs7Ozs7QUFLQSxTQUFTWCxRQUFULENBQWtCUyxLQUFsQixFQUF5QjtBQUN2QixTQUFPQSxVQUFVLElBQVYsSUFBa0IsUUFBT0EsS0FBUCx5Q0FBT0EsS0FBUCxPQUFpQixRQUExQztBQUNEIiwiZmlsZSI6ImNvdW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRVJSX05PVF9PQkpFQ1QgPSAnY291bnQoKTogYXJndW1lbnQgbm90IGFuIG9iamVjdCc7XG5jb25zdCBFUlJfTk9UX0NPTlRBSU5FUiA9ICdjb3VudCgpOiBhcmd1bWVudCBub3QgYSBjb250YWluZXInO1xuXG4vKipcbiAqIERlZHVjZXMgbnVtZXIgb2YgZWxlbWVudHMgaW4gYSBKYXZhU2NyaXB0IGNvbnRhaW5lci5cbiAqIC0gQXV0by1kZWR1Y3Rpb24gZm9yIEVTNiBjb250YWluZXJzIHRoYXQgZGVmaW5lIGEgY291bnQoKSBtZXRob2RcbiAqIC0gQXV0by1kZWR1Y3Rpb24gZm9yIEVTNiBjb250YWluZXJzIHRoYXQgZGVmaW5lIGEgc2l6ZSBtZW1iZXJcbiAqIC0gQXV0by1kZWR1Y3Rpb24gZm9yIENsYXNzaWMgQXJyYXlzIHZpYSB0aGUgYnVpbHQtaW4gbGVuZ3RoIGF0dHJpYnV0ZVxuICogLSBBbHNvIGhhbmRsZXMgb2JqZWN0cywgYWx0aG91Z2ggbm90ZSB0aGF0IHRoaXMgYW4gTyhOKSBvcGVyYXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvdW50KGNvbnRhaW5lcikge1xuICBpZiAoIWlzT2JqZWN0KGNvbnRhaW5lcikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRVJSX05PVF9PQkpFQ1QpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgRVM2IGNvbGxlY3Rpb24gXCJjb3VudFwiIGZ1bmN0aW9uIGlzIGF2YWlsYWJsZVxuICBpZiAodHlwZW9mIGNvbnRhaW5lci5jb3VudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBjb250YWluZXIuY291bnQoKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIEVTNiBjb2xsZWN0aW9uIFwic2l6ZVwiIGF0dHJpYnV0ZSBpcyBzZXRcbiAgaWYgKE51bWJlci5pc0Zpbml0ZShjb250YWluZXIuc2l6ZSkpIHtcbiAgICByZXR1cm4gY29udGFpbmVyLnNpemU7XG4gIH1cblxuICAvLyBDaGVjayBpZiBhcnJheSBsZW5ndGggYXR0cmlidXRlIGlzIHNldFxuICAvLyBOb3RlOiBjaGVja2luZyB0aGlzIGxhc3Qgc2luY2Ugc29tZSBFUzYgY29sbGVjdGlvbnMgKEltbXV0YWJsZS5qcylcbiAgLy8gZW1pdCBwcm9mdXNlIHdhcm5pbmdzIHdoZW4gdHJ5aW5nIHRvIGFjY2VzcyBgbGVuZ3RoYCBhdHRyaWJ1dGVcbiAgaWYgKE51bWJlci5pc0Zpbml0ZShjb250YWluZXIubGVuZ3RoKSkge1xuICAgIHJldHVybiBjb250YWluZXIubGVuZ3RoO1xuICB9XG5cbiAgLy8gTm90ZSB0aGF0IGdldHRpbmcgdGhlIGNvdW50IG9mIGFuIG9iamVjdCBpcyBPKE4pXG4gIGlmIChpc1BsYWluT2JqZWN0KGNvbnRhaW5lcikpIHtcbiAgICBsZXQgY291bnRlciA9IDA7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29udGFpbmVyKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGNvdW50ZXIrKztcbiAgICB9XG4gICAgcmV0dXJuIGNvdW50ZXI7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoRVJSX05PVF9DT05UQUlORVIpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhcmd1bWVudCBpcyBhIHBsYWluIG9iamVjdCAobm90IGEgY2xhc3Mgb3IgYXJyYXkgZXRjKVxuICogQHBhcmFtIHsqfSB2YWx1ZSAtIEphdmFTY3JpcHQgdmFsdWUgdG8gYmUgdGVzdGVkXG4gKiBAcmV0dXJuIHtCb29sZWFufSAtIHRydWUgaWYgYXJndW1lbnQgaXMgYSBwbGFpbiBKYXZhU2NyaXB0IG9iamVjdFxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBPYmplY3Q7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGFyZ3VtZW50IGlzIGFuIGluZGV4YWJsZSBvYmplY3QgKG5vdCBhIHByaW1pdGl2ZSB2YWx1ZSwgbm9yIG51bGwpXG4gKiBAcGFyYW0geyp9IHZhbHVlIC0gSmF2YVNjcmlwdCB2YWx1ZSB0byBiZSB0ZXN0ZWRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IC0gdHJ1ZSBpZiBhcmd1bWVudCBpcyBhIEphdmFTY3JpcHQgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnO1xufVxuXG4iXX0=
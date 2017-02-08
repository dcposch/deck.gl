'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = log;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function log(priority) {
  (0, _assert2.default)(Number.isFinite(priority), 'log priority must be a number');
  if (priority <= log.priority) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    // Node doesn't have console.debug, but looks better in browser consoles
    if (console.debug) {
      var _console;

      (_console = console).debug.apply(_console, args);
    } else {
      var _console2;

      (_console2 = console).info.apply(_console2, args);
    }
  }
} /* eslint-disable no-console */
/* global console, window */


var cache = {};

function once(priority, arg) {
  if (!cache[arg] && priority <= log.priority) {
    var _console3;

    for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }

    (_console3 = console).warn.apply(_console3, [arg].concat(args));
    cache[arg] = true;
  }
}

log.priority = 0;
log.log = log;
log.once = once;

// Expose to browser
if (typeof window !== 'undefined') {
  window.deck = window.deck || { log: log };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdXRpbHMvbG9nLmpzIl0sIm5hbWVzIjpbImxvZyIsInByaW9yaXR5IiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJhcmdzIiwiY29uc29sZSIsImRlYnVnIiwiaW5mbyIsImNhY2hlIiwib25jZSIsImFyZyIsIndhcm4iLCJ3aW5kb3ciLCJkZWNrIl0sIm1hcHBpbmdzIjoiOzs7OztrQkFJd0JBLEc7O0FBRnhCOzs7Ozs7QUFFZSxTQUFTQSxHQUFULENBQWFDLFFBQWIsRUFBZ0M7QUFDN0Msd0JBQU9DLE9BQU9DLFFBQVAsQ0FBZ0JGLFFBQWhCLENBQVAsRUFBa0MsK0JBQWxDO0FBQ0EsTUFBSUEsWUFBWUQsSUFBSUMsUUFBcEIsRUFBOEI7QUFBQSxzQ0FGU0csSUFFVDtBQUZTQSxVQUVUO0FBQUE7O0FBQzVCO0FBQ0EsUUFBSUMsUUFBUUMsS0FBWixFQUFtQjtBQUFBOztBQUNqQiwyQkFBUUEsS0FBUixpQkFBaUJGLElBQWpCO0FBQ0QsS0FGRCxNQUVPO0FBQUE7O0FBQ0wsNEJBQVFHLElBQVIsa0JBQWdCSCxJQUFoQjtBQUNEO0FBQ0Y7QUFDRixDLENBZEQ7QUFDQTs7O0FBZUEsSUFBTUksUUFBUSxFQUFkOztBQUVBLFNBQVNDLElBQVQsQ0FBY1IsUUFBZCxFQUF3QlMsR0FBeEIsRUFBc0M7QUFDcEMsTUFBSSxDQUFDRixNQUFNRSxHQUFOLENBQUQsSUFBZVQsWUFBWUQsSUFBSUMsUUFBbkMsRUFBNkM7QUFBQTs7QUFBQSx1Q0FEZkcsSUFDZTtBQURmQSxVQUNlO0FBQUE7O0FBQzNDLDBCQUFRTyxJQUFSLG1CQUFpQkQsR0FBakIsU0FBeUJOLElBQXpCO0FBQ0FJLFVBQU1FLEdBQU4sSUFBYSxJQUFiO0FBQ0Q7QUFDRjs7QUFFRFYsSUFBSUMsUUFBSixHQUFlLENBQWY7QUFDQUQsSUFBSUEsR0FBSixHQUFVQSxHQUFWO0FBQ0FBLElBQUlTLElBQUosR0FBV0EsSUFBWDs7QUFFQTtBQUNBLElBQUksT0FBT0csTUFBUCxLQUFrQixXQUF0QixFQUFtQztBQUNqQ0EsU0FBT0MsSUFBUCxHQUFjRCxPQUFPQyxJQUFQLElBQWUsRUFBQ2IsUUFBRCxFQUE3QjtBQUNEIiwiZmlsZSI6ImxvZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbi8qIGdsb2JhbCBjb25zb2xlLCB3aW5kb3cgKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbG9nKHByaW9yaXR5LCAuLi5hcmdzKSB7XG4gIGFzc2VydChOdW1iZXIuaXNGaW5pdGUocHJpb3JpdHkpLCAnbG9nIHByaW9yaXR5IG11c3QgYmUgYSBudW1iZXInKTtcbiAgaWYgKHByaW9yaXR5IDw9IGxvZy5wcmlvcml0eSkge1xuICAgIC8vIE5vZGUgZG9lc24ndCBoYXZlIGNvbnNvbGUuZGVidWcsIGJ1dCBsb29rcyBiZXR0ZXIgaW4gYnJvd3NlciBjb25zb2xlc1xuICAgIGlmIChjb25zb2xlLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmRlYnVnKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmluZm8oLi4uYXJncyk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGNhY2hlID0ge307XG5cbmZ1bmN0aW9uIG9uY2UocHJpb3JpdHksIGFyZywgLi4uYXJncykge1xuICBpZiAoIWNhY2hlW2FyZ10gJiYgcHJpb3JpdHkgPD0gbG9nLnByaW9yaXR5KSB7XG4gICAgY29uc29sZS53YXJuKC4uLlthcmcsIC4uLmFyZ3NdKTtcbiAgICBjYWNoZVthcmddID0gdHJ1ZTtcbiAgfVxufVxuXG5sb2cucHJpb3JpdHkgPSAwO1xubG9nLmxvZyA9IGxvZztcbmxvZy5vbmNlID0gb25jZTtcblxuLy8gRXhwb3NlIHRvIGJyb3dzZXJcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICB3aW5kb3cuZGVjayA9IHdpbmRvdy5kZWNrIHx8IHtsb2d9O1xufVxuIl19
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
/* global console */


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdXRpbHMvbG9nLmpzIl0sIm5hbWVzIjpbImxvZyIsInByaW9yaXR5IiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJhcmdzIiwiY29uc29sZSIsImRlYnVnIiwiaW5mbyIsImNhY2hlIiwib25jZSIsImFyZyIsIndhcm4iXSwibWFwcGluZ3MiOiI7Ozs7O2tCQUl3QkEsRzs7QUFGeEI7Ozs7OztBQUVlLFNBQVNBLEdBQVQsQ0FBYUMsUUFBYixFQUFnQztBQUM3Qyx3QkFBT0MsT0FBT0MsUUFBUCxDQUFnQkYsUUFBaEIsQ0FBUCxFQUFrQywrQkFBbEM7QUFDQSxNQUFJQSxZQUFZRCxJQUFJQyxRQUFwQixFQUE4QjtBQUFBLHNDQUZTRyxJQUVUO0FBRlNBLFVBRVQ7QUFBQTs7QUFDNUI7QUFDQSxRQUFJQyxRQUFRQyxLQUFaLEVBQW1CO0FBQUE7O0FBQ2pCLDJCQUFRQSxLQUFSLGlCQUFpQkYsSUFBakI7QUFDRCxLQUZELE1BRU87QUFBQTs7QUFDTCw0QkFBUUcsSUFBUixrQkFBZ0JILElBQWhCO0FBQ0Q7QUFDRjtBQUNGLEMsQ0FkRDtBQUNBOzs7QUFlQSxJQUFNSSxRQUFRLEVBQWQ7O0FBRUEsU0FBU0MsSUFBVCxDQUFjUixRQUFkLEVBQXdCUyxHQUF4QixFQUFzQztBQUNwQyxNQUFJLENBQUNGLE1BQU1FLEdBQU4sQ0FBRCxJQUFlVCxZQUFZRCxJQUFJQyxRQUFuQyxFQUE2QztBQUFBOztBQUFBLHVDQURmRyxJQUNlO0FBRGZBLFVBQ2U7QUFBQTs7QUFDM0MsMEJBQVFPLElBQVIsbUJBQWlCRCxHQUFqQixTQUF5Qk4sSUFBekI7QUFDQUksVUFBTUUsR0FBTixJQUFhLElBQWI7QUFDRDtBQUNGOztBQUVEVixJQUFJQyxRQUFKLEdBQWUsQ0FBZjtBQUNBRCxJQUFJQSxHQUFKLEdBQVVBLEdBQVY7QUFDQUEsSUFBSVMsSUFBSixHQUFXQSxJQUFYIiwiZmlsZSI6ImxvZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbi8qIGdsb2JhbCBjb25zb2xlICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxvZyhwcmlvcml0eSwgLi4uYXJncykge1xuICBhc3NlcnQoTnVtYmVyLmlzRmluaXRlKHByaW9yaXR5KSwgJ2xvZyBwcmlvcml0eSBtdXN0IGJlIGEgbnVtYmVyJyk7XG4gIGlmIChwcmlvcml0eSA8PSBsb2cucHJpb3JpdHkpIHtcbiAgICAvLyBOb2RlIGRvZXNuJ3QgaGF2ZSBjb25zb2xlLmRlYnVnLCBidXQgbG9va3MgYmV0dGVyIGluIGJyb3dzZXIgY29uc29sZXNcbiAgICBpZiAoY29uc29sZS5kZWJ1Zykge1xuICAgICAgY29uc29sZS5kZWJ1ZyguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5pbmZvKC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBjYWNoZSA9IHt9O1xuXG5mdW5jdGlvbiBvbmNlKHByaW9yaXR5LCBhcmcsIC4uLmFyZ3MpIHtcbiAgaWYgKCFjYWNoZVthcmddICYmIHByaW9yaXR5IDw9IGxvZy5wcmlvcml0eSkge1xuICAgIGNvbnNvbGUud2FybiguLi5bYXJnLCAuLi5hcmdzXSk7XG4gICAgY2FjaGVbYXJnXSA9IHRydWU7XG4gIH1cbn1cblxubG9nLnByaW9yaXR5ID0gMDtcbmxvZy5sb2cgPSBsb2c7XG5sb2cub25jZSA9IG9uY2U7XG4iXX0=
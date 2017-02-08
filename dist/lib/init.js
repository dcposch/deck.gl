'use strict';

var _globals = require('./utils/globals');

var _log = require('./utils/log');

var _log2 = _interopRequireDefault(_log);

var _package = require('../../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var STARTUP_MESSAGE = 'set deck.log.priority=2 to trace attribute updates';

// Version detection
// TODO - this imports a rather large JSON file, we only need one field


if (_globals.global.deck && _globals.global.deck.VERSION !== _package.version) {
  throw new Error('deck.gl - multiple versions detected: ' + _globals.global.deck.VERSION + ' vs ' + _package.version);
}

if (!_globals.global.deck) {
  /* global console */
  /* eslint-disable no-console */
  console.log('deck.gl ' + _package.version + ' - ' + STARTUP_MESSAGE);

  _globals.global.deck = _globals.global.deck || {
    VERSION: _package.version,
    log: _log2.default
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvaW5pdC5qcyJdLCJuYW1lcyI6WyJTVEFSVFVQX01FU1NBR0UiLCJkZWNrIiwiVkVSU0lPTiIsIkVycm9yIiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7OztBQUlBOzs7O0FBRUEsSUFBTUEsa0JBQWtCLG9EQUF4Qjs7QUFKQTtBQUNBOzs7QUFLQSxJQUFJLGdCQUFPQyxJQUFQLElBQWUsZ0JBQU9BLElBQVAsQ0FBWUMsT0FBWixxQkFBbkIsRUFBb0Q7QUFDbEQsUUFBTSxJQUFJQyxLQUFKLDRDQUFtRCxnQkFBT0YsSUFBUCxDQUFZQyxPQUEvRCw2QkFBTjtBQUNEOztBQUVELElBQUksQ0FBQyxnQkFBT0QsSUFBWixFQUFrQjtBQUNoQjtBQUNBO0FBQ0FHLFVBQVFDLEdBQVIseUNBQW9DTCxlQUFwQzs7QUFFQSxrQkFBT0MsSUFBUCxHQUFjLGdCQUFPQSxJQUFQLElBQWU7QUFDM0JDLDZCQUQyQjtBQUUzQkc7QUFGMkIsR0FBN0I7QUFJRCIsImZpbGUiOiJpbml0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4vdXRpbHMvZ2xvYmFscyc7XG5pbXBvcnQgbG9nIGZyb20gJy4vdXRpbHMvbG9nJztcblxuLy8gVmVyc2lvbiBkZXRlY3Rpb25cbi8vIFRPRE8gLSB0aGlzIGltcG9ydHMgYSByYXRoZXIgbGFyZ2UgSlNPTiBmaWxlLCB3ZSBvbmx5IG5lZWQgb25lIGZpZWxkXG5pbXBvcnQge3ZlcnNpb259IGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbic7XG5cbmNvbnN0IFNUQVJUVVBfTUVTU0FHRSA9ICdzZXQgZGVjay5sb2cucHJpb3JpdHk9MiB0byB0cmFjZSBhdHRyaWJ1dGUgdXBkYXRlcyc7XG5cbmlmIChnbG9iYWwuZGVjayAmJiBnbG9iYWwuZGVjay5WRVJTSU9OICE9PSB2ZXJzaW9uKSB7XG4gIHRocm93IG5ldyBFcnJvcihgZGVjay5nbCAtIG11bHRpcGxlIHZlcnNpb25zIGRldGVjdGVkOiAke2dsb2JhbC5kZWNrLlZFUlNJT059IHZzICR7dmVyc2lvbn1gKTtcbn1cblxuaWYgKCFnbG9iYWwuZGVjaykge1xuICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gIGNvbnNvbGUubG9nKGBkZWNrLmdsICR7dmVyc2lvbn0gLSAke1NUQVJUVVBfTUVTU0FHRX1gKTtcblxuICBnbG9iYWwuZGVjayA9IGdsb2JhbC5kZWNrIHx8IHtcbiAgICBWRVJTSU9OOiB2ZXJzaW9uLFxuICAgIGxvZ1xuICB9O1xufVxuIl19
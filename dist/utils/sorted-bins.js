"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SortedBins = function () {
  function SortedBins(bins) {
    _classCallCheck(this, SortedBins);

    this.sortedBins = this.getSortedCounts(bins);
  }

  /**
   * Get an array of object with sorted count and index of bins
   * @param {Array} bins
   * @return {Array} array of count and index lookup
   */


  _createClass(SortedBins, [{
    key: "getSortedCounts",
    value: function getSortedCounts(bins) {
      return bins.map(function (h, i) {
        return { i: i, counts: h.points.length };
      }).sort(function (a, b) {
        return a.counts - b.counts;
      });
    }

    /**
     * Get an array of object with sorted count and index of bins
     * @param {Number} lower
     * @return {Array} array of nuw count range
     */

  }, {
    key: "getCountRange",
    value: function getCountRange(_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          lower = _ref2[0],
          upper = _ref2[1];

      var len = this.sortedBins.length;
      var lowerIdx = Math.ceil(lower / 100 * (len - 1));
      var upperIdx = Math.floor(upper / 100 * (len - 1));

      return [this.sortedBins[lowerIdx].counts, this.sortedBins[upperIdx].counts];
    }

    /**
     * Get ths max count of all bins
     * @return {Number | Boolean} max count
     */

  }, {
    key: "getMaxCount",
    value: function getMaxCount() {
      return this.sortedBins.length && this.sortedBins[this.sortedBins.length - 1].counts;
    }
  }]);

  return SortedBins;
}();

exports.default = SortedBins;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9zb3J0ZWQtYmlucy5qcyJdLCJuYW1lcyI6WyJTb3J0ZWRCaW5zIiwiYmlucyIsInNvcnRlZEJpbnMiLCJnZXRTb3J0ZWRDb3VudHMiLCJtYXAiLCJoIiwiaSIsImNvdW50cyIsInBvaW50cyIsImxlbmd0aCIsInNvcnQiLCJhIiwiYiIsImxvd2VyIiwidXBwZXIiLCJsZW4iLCJsb3dlcklkeCIsIk1hdGgiLCJjZWlsIiwidXBwZXJJZHgiLCJmbG9vciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQ3FCQSxVO0FBQ25CLHNCQUFZQyxJQUFaLEVBQWtCO0FBQUE7O0FBQ2hCLFNBQUtDLFVBQUwsR0FBa0IsS0FBS0MsZUFBTCxDQUFxQkYsSUFBckIsQ0FBbEI7QUFDRDs7QUFFRDs7Ozs7Ozs7O29DQUtnQkEsSSxFQUFNO0FBQ3BCLGFBQU9BLEtBQ0pHLEdBREksQ0FDQSxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxlQUFXLEVBQUNBLElBQUQsRUFBSUMsUUFBUUYsRUFBRUcsTUFBRixDQUFTQyxNQUFyQixFQUFYO0FBQUEsT0FEQSxFQUVKQyxJQUZJLENBRUMsVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsZUFBVUQsRUFBRUosTUFBRixHQUFXSyxFQUFFTCxNQUF2QjtBQUFBLE9BRkQsQ0FBUDtBQUdEOztBQUVEOzs7Ozs7Ozt3Q0FLOEI7QUFBQTtBQUFBLFVBQWZNLEtBQWU7QUFBQSxVQUFSQyxLQUFROztBQUM1QixVQUFNQyxNQUFNLEtBQUtiLFVBQUwsQ0FBZ0JPLE1BQTVCO0FBQ0EsVUFBTU8sV0FBV0MsS0FBS0MsSUFBTCxDQUFVTCxRQUFRLEdBQVIsSUFBZUUsTUFBTSxDQUFyQixDQUFWLENBQWpCO0FBQ0EsVUFBTUksV0FBV0YsS0FBS0csS0FBTCxDQUFXTixRQUFRLEdBQVIsSUFBZUMsTUFBTSxDQUFyQixDQUFYLENBQWpCOztBQUVBLGFBQU8sQ0FBQyxLQUFLYixVQUFMLENBQWdCYyxRQUFoQixFQUEwQlQsTUFBM0IsRUFBbUMsS0FBS0wsVUFBTCxDQUFnQmlCLFFBQWhCLEVBQTBCWixNQUE3RCxDQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7a0NBSWM7QUFDWixhQUFPLEtBQUtMLFVBQUwsQ0FBZ0JPLE1BQWhCLElBQTBCLEtBQUtQLFVBQUwsQ0FBZ0IsS0FBS0EsVUFBTCxDQUFnQk8sTUFBaEIsR0FBeUIsQ0FBekMsRUFBNENGLE1BQTdFO0FBQ0Q7Ozs7OztrQkFuQ2tCUCxVIiwiZmlsZSI6InNvcnRlZC1iaW5zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTb3J0ZWRCaW5zIHtcbiAgY29uc3RydWN0b3IoYmlucykge1xuICAgIHRoaXMuc29ydGVkQmlucyA9IHRoaXMuZ2V0U29ydGVkQ291bnRzKGJpbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBhcnJheSBvZiBvYmplY3Qgd2l0aCBzb3J0ZWQgY291bnQgYW5kIGluZGV4IG9mIGJpbnNcbiAgICogQHBhcmFtIHtBcnJheX0gYmluc1xuICAgKiBAcmV0dXJuIHtBcnJheX0gYXJyYXkgb2YgY291bnQgYW5kIGluZGV4IGxvb2t1cFxuICAgKi9cbiAgZ2V0U29ydGVkQ291bnRzKGJpbnMpIHtcbiAgICByZXR1cm4gYmluc1xuICAgICAgLm1hcCgoaCwgaSkgPT4gKHtpLCBjb3VudHM6IGgucG9pbnRzLmxlbmd0aH0pKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEuY291bnRzIC0gYi5jb3VudHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBhcnJheSBvZiBvYmplY3Qgd2l0aCBzb3J0ZWQgY291bnQgYW5kIGluZGV4IG9mIGJpbnNcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGxvd2VyXG4gICAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiBudXcgY291bnQgcmFuZ2VcbiAgICovXG4gIGdldENvdW50UmFuZ2UoW2xvd2VyLCB1cHBlcl0pIHtcbiAgICBjb25zdCBsZW4gPSB0aGlzLnNvcnRlZEJpbnMubGVuZ3RoO1xuICAgIGNvbnN0IGxvd2VySWR4ID0gTWF0aC5jZWlsKGxvd2VyIC8gMTAwICogKGxlbiAtIDEpKTtcbiAgICBjb25zdCB1cHBlcklkeCA9IE1hdGguZmxvb3IodXBwZXIgLyAxMDAgKiAobGVuIC0gMSkpO1xuXG4gICAgcmV0dXJuIFt0aGlzLnNvcnRlZEJpbnNbbG93ZXJJZHhdLmNvdW50cywgdGhpcy5zb3J0ZWRCaW5zW3VwcGVySWR4XS5jb3VudHNdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aHMgbWF4IGNvdW50IG9mIGFsbCBiaW5zXG4gICAqIEByZXR1cm4ge051bWJlciB8IEJvb2xlYW59IG1heCBjb3VudFxuICAgKi9cbiAgZ2V0TWF4Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc29ydGVkQmlucy5sZW5ndGggJiYgdGhpcy5zb3J0ZWRCaW5zW3RoaXMuc29ydGVkQmlucy5sZW5ndGggLSAxXS5jb3VudHM7XG4gIH1cbn1cbiJdfQ==
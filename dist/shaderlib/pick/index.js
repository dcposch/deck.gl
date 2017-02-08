'use strict';

var _pickingFragment = require('./picking.fragment.glsl');

var _pickingFragment2 = _interopRequireDefault(_pickingFragment);

var _pickingVertex = require('./picking.vertex.glsl');

var _pickingVertex2 = _interopRequireDefault(_pickingVertex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  project: {
    interface: 'project',
    source: _pickingVertex2.default,
    fragmentSource: _pickingFragment2.default
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zaGFkZXJsaWIvcGljay9pbmRleC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwicHJvamVjdCIsImludGVyZmFjZSIsInNvdXJjZSIsImZyYWdtZW50U291cmNlIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7OztBQUVBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFdBQVM7QUFDUEMsZUFBVyxTQURKO0FBRVBDLG1DQUZPO0FBR1BDO0FBSE87QUFETSxDQUFqQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwaWNraW5nRnJhZ21lbnQgZnJvbSAnLi9waWNraW5nLmZyYWdtZW50Lmdsc2wnO1xuaW1wb3J0IHBpY2tpbmdWZXJ0ZXggZnJvbSAnLi9waWNraW5nLnZlcnRleC5nbHNsJztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByb2plY3Q6IHtcbiAgICBpbnRlcmZhY2U6ICdwcm9qZWN0JyxcbiAgICBzb3VyY2U6IHBpY2tpbmdWZXJ0ZXgsXG4gICAgZnJhZ21lbnRTb3VyY2U6IHBpY2tpbmdGcmFnbWVudFxuICB9XG59O1xuIl19
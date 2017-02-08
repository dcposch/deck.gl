'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.project = undefined;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var project = exports.project = {
  interface: 'project',
  source: 'const float TILE_SIZE = 512.0;\nconst float PI = 3.1415926536;\nconst float WORLD_SCALE = TILE_SIZE / (PI * 2.0);\n\nconst float PROJECT_LINEAR = 0.;\nconst float PROJECT_MERCATOR = 1.;\nconst float PROJECT_MERCATOR_OFFSETS = 2.;\n\nuniform float projectionMode;\nuniform float projectionScale;\nuniform vec4 projectionCenter;\nuniform vec3 projectionPixelsPerUnit;\n\nuniform mat4 projectionMatrix;\nuniform mat4 projectionMatrixUncentered;\n\n#ifdef INTEL_TAN_WORKAROUND\n\n// All these functions are for substituting tan() function from Intel GPU only\nconst float TWO_PI = 6.2831854820251465;\nconst float PI_2 = 1.5707963705062866;\nconst float PI_16 = 0.1963495463132858;\n\nconst float SIN_TABLE_0 = 0.19509032368659973;\nconst float SIN_TABLE_1 = 0.3826834261417389;\nconst float SIN_TABLE_2 = 0.5555702447891235;\nconst float SIN_TABLE_3 = 0.7071067690849304;\n\nconst float COS_TABLE_0 = 0.9807852506637573;\nconst float COS_TABLE_1 = 0.9238795042037964;\nconst float COS_TABLE_2 = 0.8314695954322815;\nconst float COS_TABLE_3 = 0.7071067690849304;\n\nconst float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!\nconst float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!\nconst float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!\nconst float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!\n\nfloat sin_taylor_fp32(float a) {\n  float r, s, t, x;\n\n  if (a == 0.0) {\n    return 0.0;\n  }\n\n  x = -a * a;\n  s = a;\n  r = a;\n\n  r = r * x;\n  t = r * INVERSE_FACTORIAL_3;\n  s = s + t;\n\n  r = r * x;\n  t = r * INVERSE_FACTORIAL_5;\n  s = s + t;\n\n  r = r * x;\n  t = r * INVERSE_FACTORIAL_7;\n  s = s + t;\n\n  r = r * x;\n  t = r * INVERSE_FACTORIAL_9;\n  s = s + t;\n\n  return s;\n}\n\nvoid sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {\n  if (a == 0.0) {\n    sin_t = 0.0;\n    cos_t = 1.0;\n  }\n  sin_t = sin_taylor_fp32(a);\n  cos_t = sqrt(1.0 - sin_t * sin_t);\n}\n\nfloat tan_taylor_fp32(float a) {\n    float sin_a;\n    float cos_a;\n\n    if (a == 0.0) {\n        return 0.0;\n    }\n\n    // 2pi range reduction\n    float z = floor(a / TWO_PI);\n    float r = a - TWO_PI * z;\n\n    float t;\n    float q = floor(r / PI_2 + 0.5);\n    int j = int(q);\n\n    if (j < -2 || j > 2) {\n        return 0.0 / 0.0;\n    }\n\n    t = r - PI_2 * q;\n\n    q = floor(t / PI_16 + 0.5);\n    int k = int(q);\n    int abs_k = int(abs(float(k)));\n\n    if (abs_k > 4) {\n        return 0.0 / 0.0;\n    } else {\n        t = t - PI_16 * q;\n    }\n\n    float u = 0.0;\n    float v = 0.0;\n\n    float sin_t, cos_t;\n    float s, c;\n    sincos_taylor_fp32(t, sin_t, cos_t);\n\n    if (k == 0) {\n        s = sin_t;\n        c = cos_t;\n    } else {\n        if (abs(float(abs_k) - 1.0) < 0.5) {\n            u = COS_TABLE_0;\n            v = SIN_TABLE_0;\n        } else if (abs(float(abs_k) - 2.0) < 0.5) {\n            u = COS_TABLE_1;\n            v = SIN_TABLE_1;\n        } else if (abs(float(abs_k) - 3.0) < 0.5) {\n            u = COS_TABLE_2;\n            v = SIN_TABLE_2;\n        } else if (abs(float(abs_k) - 4.0) < 0.5) {\n            u = COS_TABLE_3;\n            v = SIN_TABLE_3;\n        }\n        if (k > 0) {\n            s = u * sin_t + v * cos_t;\n            c = u * cos_t - v * sin_t;\n        } else {\n            s = u * sin_t - v * cos_t;\n            c = u * cos_t + v * sin_t;\n        }\n    }\n\n    if (j == 0) {\n        sin_a = s;\n        cos_a = c;\n    } else if (j == 1) {\n        sin_a = c;\n        cos_a = -s;\n    } else if (j == -1) {\n        sin_a = -c;\n        cos_a = s;\n    } else {\n        sin_a = -s;\n        cos_a = -c;\n    }\n    return sin_a / cos_a;\n}\n#endif\n\nfloat tan_fp32(float a) {\n#ifdef INTEL_TAN_WORKAROUND\n  return tan_taylor_fp32(a);\n#else\n  return tan(a);\n#endif\n}\n\n//\n// Scaling offsets\n//\n\nfloat project_scale(float meters) {\n  if (projectionMode == PROJECT_MERCATOR_OFFSETS) {\n    return meters;\n  } else {\n    return meters * projectionPixelsPerUnit.x;\n  }\n}\n\nvec2 project_scale(vec2 meters) {\n  if (projectionMode == PROJECT_MERCATOR_OFFSETS) {\n    return meters;\n  } else {\n    return vec2(\n      meters.x * projectionPixelsPerUnit.x,\n      meters.y * projectionPixelsPerUnit.x\n    );\n  }\n}\n\nvec3 project_scale(vec3 meters) {\n  if (projectionMode == PROJECT_MERCATOR_OFFSETS) {\n    return meters;\n  } else {\n    return vec3(\n      meters.x * projectionPixelsPerUnit.x,\n      meters.y * projectionPixelsPerUnit.x,\n      meters.z * projectionPixelsPerUnit.x\n    );\n  }\n}\n\nvec4 project_scale(vec4 meters) {\n  if (projectionMode == PROJECT_MERCATOR_OFFSETS) {\n    return meters;\n  } else {\n    return vec4(\n      meters.x * projectionPixelsPerUnit.x,\n      meters.y * projectionPixelsPerUnit.x,\n      meters.z * projectionPixelsPerUnit.x,\n      meters.w\n    );\n  }\n}\n\n//\n// Projecting positions\n//\n\n// non-linear projection: lnglats => unit tile [0-1, 0-1]\nvec2 project_mercator_(vec2 lnglat) {\n  return vec2(\n    radians(lnglat.x) + PI,\n    PI - log(tan_fp32(PI * 0.25 + radians(lnglat.y) * 0.5))\n  );\n}\n\nvec2 project_position(vec2 position) {\n  // if (projectionMode == PROJECT_LINEAR) {\n  //   return (position + vec2(TILE_SIZE / 2.0)) * projectionScale;\n  // }\n  if (projectionMode == PROJECT_MERCATOR_OFFSETS) {\n    return position;\n    return project_scale(position);\n  }\n  // Covers projectionMode == PROJECT_MERCATOR\n  return project_mercator_(position) * WORLD_SCALE * projectionScale;\n}\n\nvec3 project_position(vec3 position) {\n  return vec3(project_position(position.xy), project_scale(position.z));\n}\n\nvec4 project_position(vec4 position) {\n  return vec4(project_position(position.xyz), position.w);\n}\n\n//\n\nvec4 project_to_clipspace(vec4 position) {\n  if (projectionMode == PROJECT_MERCATOR_OFFSETS) {\n    position = position * projectionPixelsPerUnit.x;\n  }\n  return projectionMatrix * position + projectionCenter;\n}\n\n// Backwards compatibility\n\nfloat scale(float position) {\n  return project_scale(position);\n}\n\nvec2 scale(vec2 position) {\n  return project_scale(position);\n}\n\nvec3 scale(vec3 position) {\n  return project_scale(position);\n}\n\nvec4 scale(vec4 position) {\n  return project_scale(position);\n}\n\nvec2 preproject(vec2 position) {\n  return project_position(position);\n}\n\nvec3 preproject(vec3 position) {\n  return project_position(position);\n}\n\nvec4 preproject(vec4 position) {\n  return project_position(position);\n}\n\nvec4 project(vec4 position) {\n  return project_to_clipspace(position);\n}\n'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zaGFkZXJsaWIvcHJvamVjdC9pbmRleC5qcyJdLCJuYW1lcyI6WyJwcm9qZWN0IiwiaW50ZXJmYWNlIiwic291cmNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQ0E7Ozs7OztBQUNPLElBQU1BLDRCQUFVO0FBQ3JCQyxhQUFXLFNBRFU7QUFFckJDO0FBRnFCLENBQWhCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuZXhwb3J0IGNvbnN0IHByb2plY3QgPSB7XG4gIGludGVyZmFjZTogJ3Byb2plY3QnLFxuICBzb3VyY2U6IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAncHJvamVjdC5nbHNsJyksICd1dGY4Jylcbn07XG4iXX0=
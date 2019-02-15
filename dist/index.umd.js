(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('os'), require('tty'), require('net'), require('url'), require('util'), require('events'), require('path'), require('stream'), require('fs'), require('lodash')) :
  typeof define === 'function' && define.amd ? define(['os', 'tty', 'net', 'url', 'util', 'events', 'path', 'stream', 'fs', 'lodash'], factory) :
  (global.index = factory(global.os,global.tty,global.net,global.url,global.util,global.events,global.path,global.stream,global.fs,global.lodash));
}(this, (function (os,tty,net,url,util,events,path,stream,fs,lodash) { 'use strict';

  os = os && os.hasOwnProperty('default') ? os['default'] : os;
  tty = tty && tty.hasOwnProperty('default') ? tty['default'] : tty;
  net = net && net.hasOwnProperty('default') ? net['default'] : net;
  url = url && url.hasOwnProperty('default') ? url['default'] : url;
  util = util && util.hasOwnProperty('default') ? util['default'] : util;
  events = events && events.hasOwnProperty('default') ? events['default'] : events;
  path = path && path.hasOwnProperty('default') ? path['default'] : path;
  stream = stream && stream.hasOwnProperty('default') ? stream['default'] : stream;
  var fs__default = 'default' in fs ? fs['default'] : fs;

  function isNothing(subject) {
    return (typeof subject === 'undefined') || (subject === null);
  }


  function isObject(subject) {
    return (typeof subject === 'object') && (subject !== null);
  }


  function toArray(sequence) {
    if (Array.isArray(sequence)) return sequence;
    else if (isNothing(sequence)) return [];

    return [ sequence ];
  }


  function extend(target, source) {
    var index, length, key, sourceKeys;

    if (source) {
      sourceKeys = Object.keys(source);

      for (index = 0, length = sourceKeys.length; index < length; index += 1) {
        key = sourceKeys[index];
        target[key] = source[key];
      }
    }

    return target;
  }


  function repeat(string, count) {
    var result = '', cycle;

    for (cycle = 0; cycle < count; cycle += 1) {
      result += string;
    }

    return result;
  }


  function isNegativeZero(number) {
    return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
  }


  var isNothing_1      = isNothing;
  var isObject_1       = isObject;
  var toArray_1        = toArray;
  var repeat_1         = repeat;
  var isNegativeZero_1 = isNegativeZero;
  var extend_1         = extend;

  var common = {
  	isNothing: isNothing_1,
  	isObject: isObject_1,
  	toArray: toArray_1,
  	repeat: repeat_1,
  	isNegativeZero: isNegativeZero_1,
  	extend: extend_1
  };

  // YAML error class. http://stackoverflow.com/questions/8458984

  function YAMLException(reason, mark) {
    // Super constructor
    Error.call(this);

    this.name = 'YAMLException';
    this.reason = reason;
    this.mark = mark;
    this.message = (this.reason || '(unknown reason)') + (this.mark ? ' ' + this.mark.toString() : '');

    // Include stack trace in error object
    if (Error.captureStackTrace) {
      // Chrome and NodeJS
      Error.captureStackTrace(this, this.constructor);
    } else {
      // FF, IE 10+ and Safari 6+. Fallback for others
      this.stack = (new Error()).stack || '';
    }
  }


  // Inherit from Error
  YAMLException.prototype = Object.create(Error.prototype);
  YAMLException.prototype.constructor = YAMLException;


  YAMLException.prototype.toString = function toString(compact) {
    var result = this.name + ': ';

    result += this.reason || '(unknown reason)';

    if (!compact && this.mark) {
      result += ' ' + this.mark.toString();
    }

    return result;
  };


  var exception = YAMLException;

  function Mark(name, buffer, position, line, column) {
    this.name     = name;
    this.buffer   = buffer;
    this.position = position;
    this.line     = line;
    this.column   = column;
  }


  Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
    var head, start, tail, end, snippet;

    if (!this.buffer) return null;

    indent = indent || 4;
    maxLength = maxLength || 75;

    head = '';
    start = this.position;

    while (start > 0 && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(start - 1)) === -1) {
      start -= 1;
      if (this.position - start > (maxLength / 2 - 1)) {
        head = ' ... ';
        start += 5;
        break;
      }
    }

    tail = '';
    end = this.position;

    while (end < this.buffer.length && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(end)) === -1) {
      end += 1;
      if (end - this.position > (maxLength / 2 - 1)) {
        tail = ' ... ';
        end -= 5;
        break;
      }
    }

    snippet = this.buffer.slice(start, end);

    return common.repeat(' ', indent) + head + snippet + tail + '\n' +
           common.repeat(' ', indent + this.position - start + head.length) + '^';
  };


  Mark.prototype.toString = function toString(compact) {
    var snippet, where = '';

    if (this.name) {
      where += 'in "' + this.name + '" ';
    }

    where += 'at line ' + (this.line + 1) + ', column ' + (this.column + 1);

    if (!compact) {
      snippet = this.getSnippet();

      if (snippet) {
        where += ':\n' + snippet;
      }
    }

    return where;
  };


  var mark = Mark;

  var TYPE_CONSTRUCTOR_OPTIONS = [
    'kind',
    'resolve',
    'construct',
    'instanceOf',
    'predicate',
    'represent',
    'defaultStyle',
    'styleAliases'
  ];

  var YAML_NODE_KINDS = [
    'scalar',
    'sequence',
    'mapping'
  ];

  function compileStyleAliases(map) {
    var result = {};

    if (map !== null) {
      Object.keys(map).forEach(function (style) {
        map[style].forEach(function (alias) {
          result[String(alias)] = style;
        });
      });
    }

    return result;
  }

  function Type(tag, options) {
    options = options || {};

    Object.keys(options).forEach(function (name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });

    // TODO: Add tag format check.
    this.tag          = tag;
    this.kind         = options['kind']         || null;
    this.resolve      = options['resolve']      || function () { return true; };
    this.construct    = options['construct']    || function (data) { return data; };
    this.instanceOf   = options['instanceOf']   || null;
    this.predicate    = options['predicate']    || null;
    this.represent    = options['represent']    || null;
    this.defaultStyle = options['defaultStyle'] || null;
    this.styleAliases = compileStyleAliases(options['styleAliases'] || null);

    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }

  var type = Type;

  /*eslint-disable max-len*/






  function compileList(schema, name, result) {
    var exclude = [];

    schema.include.forEach(function (includedSchema) {
      result = compileList(includedSchema, name, result);
    });

    schema[name].forEach(function (currentType) {
      result.forEach(function (previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
          exclude.push(previousIndex);
        }
      });

      result.push(currentType);
    });

    return result.filter(function (type$$1, index) {
      return exclude.indexOf(index) === -1;
    });
  }


  function compileMap(/* lists... */) {
    var result = {
          scalar: {},
          sequence: {},
          mapping: {},
          fallback: {}
        }, index, length;

    function collectType(type$$1) {
      result[type$$1.kind][type$$1.tag] = result['fallback'][type$$1.tag] = type$$1;
    }

    for (index = 0, length = arguments.length; index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }


  function Schema(definition) {
    this.include  = definition.include  || [];
    this.implicit = definition.implicit || [];
    this.explicit = definition.explicit || [];

    this.implicit.forEach(function (type$$1) {
      if (type$$1.loadKind && type$$1.loadKind !== 'scalar') {
        throw new exception('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
      }
    });

    this.compiledImplicit = compileList(this, 'implicit', []);
    this.compiledExplicit = compileList(this, 'explicit', []);
    this.compiledTypeMap  = compileMap(this.compiledImplicit, this.compiledExplicit);
  }


  Schema.DEFAULT = null;


  Schema.create = function createSchema() {
    var schemas, types;

    switch (arguments.length) {
      case 1:
        schemas = Schema.DEFAULT;
        types = arguments[0];
        break;

      case 2:
        schemas = arguments[0];
        types = arguments[1];
        break;

      default:
        throw new exception('Wrong number of arguments for Schema.create function');
    }

    schemas = common.toArray(schemas);
    types = common.toArray(types);

    if (!schemas.every(function (schema) { return schema instanceof Schema; })) {
      throw new exception('Specified list of super schemas (or a single Schema object) contains a non-Schema object.');
    }

    if (!types.every(function (type$$1) { return type$$1 instanceof type; })) {
      throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }

    return new Schema({
      include: schemas,
      explicit: types
    });
  };


  var schema = Schema;

  var str = new type('tag:yaml.org,2002:str', {
    kind: 'scalar',
    construct: function (data) { return data !== null ? data : ''; }
  });

  var seq = new type('tag:yaml.org,2002:seq', {
    kind: 'sequence',
    construct: function (data) { return data !== null ? data : []; }
  });

  var map = new type('tag:yaml.org,2002:map', {
    kind: 'mapping',
    construct: function (data) { return data !== null ? data : {}; }
  });

  var failsafe = new schema({
    explicit: [
      str,
      seq,
      map
    ]
  });

  function resolveYamlNull(data) {
    if (data === null) return true;

    var max = data.length;

    return (max === 1 && data === '~') ||
           (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
  }

  function constructYamlNull() {
    return null;
  }

  function isNull(object) {
    return object === null;
  }

  var _null = new type('tag:yaml.org,2002:null', {
    kind: 'scalar',
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function () { return '~';    },
      lowercase: function () { return 'null'; },
      uppercase: function () { return 'NULL'; },
      camelcase: function () { return 'Null'; }
    },
    defaultStyle: 'lowercase'
  });

  function resolveYamlBoolean(data) {
    if (data === null) return false;

    var max = data.length;

    return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
           (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
  }

  function constructYamlBoolean(data) {
    return data === 'true' ||
           data === 'True' ||
           data === 'TRUE';
  }

  function isBoolean(object) {
    return Object.prototype.toString.call(object) === '[object Boolean]';
  }

  var bool = new type('tag:yaml.org,2002:bool', {
    kind: 'scalar',
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function (object) { return object ? 'true' : 'false'; },
      uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
      camelcase: function (object) { return object ? 'True' : 'False'; }
    },
    defaultStyle: 'lowercase'
  });

  function isHexCode(c) {
    return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
           ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
           ((0x61/* a */ <= c) && (c <= 0x66/* f */));
  }

  function isOctCode(c) {
    return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
  }

  function isDecCode(c) {
    return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
  }

  function resolveYamlInteger(data) {
    if (data === null) return false;

    var max = data.length,
        index = 0,
        hasDigits = false,
        ch;

    if (!max) return false;

    ch = data[index];

    // sign
    if (ch === '-' || ch === '+') {
      ch = data[++index];
    }

    if (ch === '0') {
      // 0
      if (index + 1 === max) return true;
      ch = data[++index];

      // base 2, base 8, base 16

      if (ch === 'b') {
        // base 2
        index++;

        for (; index < max; index++) {
          ch = data[index];
          if (ch === '_') continue;
          if (ch !== '0' && ch !== '1') return false;
          hasDigits = true;
        }
        return hasDigits && ch !== '_';
      }


      if (ch === 'x') {
        // base 16
        index++;

        for (; index < max; index++) {
          ch = data[index];
          if (ch === '_') continue;
          if (!isHexCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && ch !== '_';
      }

      // base 8
      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }

    // base 10 (except 0) or base 60

    // value should not start with `_`;
    if (ch === '_') return false;

    for (; index < max; index++) {
      ch = data[index];
      if (ch === '_') continue;
      if (ch === ':') break;
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }

    // Should have digits and should not end with `_`
    if (!hasDigits || ch === '_') return false;

    // if !base60 - done;
    if (ch !== ':') return true;

    // base60 almost not used, no needs to optimize
    return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
  }

  function constructYamlInteger(data) {
    var value = data, sign = 1, ch, base, digits = [];

    if (value.indexOf('_') !== -1) {
      value = value.replace(/_/g, '');
    }

    ch = value[0];

    if (ch === '-' || ch === '+') {
      if (ch === '-') sign = -1;
      value = value.slice(1);
      ch = value[0];
    }

    if (value === '0') return 0;

    if (ch === '0') {
      if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
      if (value[1] === 'x') return sign * parseInt(value, 16);
      return sign * parseInt(value, 8);
    }

    if (value.indexOf(':') !== -1) {
      value.split(':').forEach(function (v) {
        digits.unshift(parseInt(v, 10));
      });

      value = 0;
      base = 1;

      digits.forEach(function (d) {
        value += (d * base);
        base *= 60;
      });

      return sign * value;

    }

    return sign * parseInt(value, 10);
  }

  function isInteger(object) {
    return (Object.prototype.toString.call(object)) === '[object Number]' &&
           (object % 1 === 0 && !common.isNegativeZero(object));
  }

  var int_1 = new type('tag:yaml.org,2002:int', {
    kind: 'scalar',
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
      octal:       function (obj) { return obj >= 0 ? '0'  + obj.toString(8) : '-0'  + obj.toString(8).slice(1); },
      decimal:     function (obj) { return obj.toString(10); },
      /* eslint-disable max-len */
      hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
    },
    defaultStyle: 'decimal',
    styleAliases: {
      binary:      [ 2,  'bin' ],
      octal:       [ 8,  'oct' ],
      decimal:     [ 10, 'dec' ],
      hexadecimal: [ 16, 'hex' ]
    }
  });

  var YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    '^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
    // .2e4, .2
    // special case, seems not from spec
    '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
    // 20:59
    '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
    // .inf
    '|[-+]?\\.(?:inf|Inf|INF)' +
    // .nan
    '|\\.(?:nan|NaN|NAN))$');

  function resolveYamlFloat(data) {
    if (data === null) return false;

    if (!YAML_FLOAT_PATTERN.test(data) ||
        // Quick hack to not allow integers end with `_`
        // Probably should update regexp & check speed
        data[data.length - 1] === '_') {
      return false;
    }

    return true;
  }

  function constructYamlFloat(data) {
    var value, sign, base, digits;

    value  = data.replace(/_/g, '').toLowerCase();
    sign   = value[0] === '-' ? -1 : 1;
    digits = [];

    if ('+-'.indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }

    if (value === '.inf') {
      return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

    } else if (value === '.nan') {
      return NaN;

    } else if (value.indexOf(':') >= 0) {
      value.split(':').forEach(function (v) {
        digits.unshift(parseFloat(v, 10));
      });

      value = 0.0;
      base = 1;

      digits.forEach(function (d) {
        value += d * base;
        base *= 60;
      });

      return sign * value;

    }
    return sign * parseFloat(value, 10);
  }


  var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

  function representYamlFloat(object, style) {
    var res;

    if (isNaN(object)) {
      switch (style) {
        case 'lowercase': return '.nan';
        case 'uppercase': return '.NAN';
        case 'camelcase': return '.NaN';
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case 'lowercase': return '.inf';
        case 'uppercase': return '.INF';
        case 'camelcase': return '.Inf';
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case 'lowercase': return '-.inf';
        case 'uppercase': return '-.INF';
        case 'camelcase': return '-.Inf';
      }
    } else if (common.isNegativeZero(object)) {
      return '-0.0';
    }

    res = object.toString(10);

    // JS stringifier can build scientific format without dots: 5e-100,
    // while YAML requres dot: 5.e-100. Fix it with simple hack

    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
  }

  function isFloat(object) {
    return (Object.prototype.toString.call(object) === '[object Number]') &&
           (object % 1 !== 0 || common.isNegativeZero(object));
  }

  var float_1 = new type('tag:yaml.org,2002:float', {
    kind: 'scalar',
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: 'lowercase'
  });

  var json = new schema({
    include: [
      failsafe
    ],
    implicit: [
      _null,
      bool,
      int_1,
      float_1
    ]
  });

  var core = new schema({
    include: [
      json
    ]
  });

  var YAML_DATE_REGEXP = new RegExp(
    '^([0-9][0-9][0-9][0-9])'          + // [1] year
    '-([0-9][0-9])'                    + // [2] month
    '-([0-9][0-9])$');                   // [3] day

  var YAML_TIMESTAMP_REGEXP = new RegExp(
    '^([0-9][0-9][0-9][0-9])'          + // [1] year
    '-([0-9][0-9]?)'                   + // [2] month
    '-([0-9][0-9]?)'                   + // [3] day
    '(?:[Tt]|[ \\t]+)'                 + // ...
    '([0-9][0-9]?)'                    + // [4] hour
    ':([0-9][0-9])'                    + // [5] minute
    ':([0-9][0-9])'                    + // [6] second
    '(?:\\.([0-9]*))?'                 + // [7] fraction
    '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
    '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

  function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
  }

  function constructYamlTimestamp(data) {
    var match, year, month, day, hour, minute, second, fraction = 0,
        delta = null, tz_hour, tz_minute, date;

    match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

    if (match === null) throw new Error('Date resolve error');

    // match: [1] year [2] month [3] day

    year = +(match[1]);
    month = +(match[2]) - 1; // JS month starts with 0
    day = +(match[3]);

    if (!match[4]) { // no hour
      return new Date(Date.UTC(year, month, day));
    }

    // match: [4] hour [5] minute [6] second [7] fraction

    hour = +(match[4]);
    minute = +(match[5]);
    second = +(match[6]);

    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) { // milli-seconds
        fraction += '0';
      }
      fraction = +fraction;
    }

    // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

    if (match[9]) {
      tz_hour = +(match[10]);
      tz_minute = +(match[11] || 0);
      delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
      if (match[9] === '-') delta = -delta;
    }

    date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

    if (delta) date.setTime(date.getTime() - delta);

    return date;
  }

  function representYamlTimestamp(object /*, style*/) {
    return object.toISOString();
  }

  var timestamp = new type('tag:yaml.org,2002:timestamp', {
    kind: 'scalar',
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });

  function resolveYamlMerge(data) {
    return data === '<<' || data === null;
  }

  var merge = new type('tag:yaml.org,2002:merge', {
    kind: 'scalar',
    resolve: resolveYamlMerge
  });

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
  }

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  /*eslint-disable no-bitwise*/

  var NodeBuffer;

  try {
    // A trick for browserified version, to not include `Buffer` shim
    var _require = commonjsRequire;
    NodeBuffer = _require('buffer').Buffer;
  } catch (__) {}




  // [ 64, 65, 66 ] -> [ padding, CR, LF ]
  var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


  function resolveYamlBinary(data) {
    if (data === null) return false;

    var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

    // Convert one by one.
    for (idx = 0; idx < max; idx++) {
      code = map.indexOf(data.charAt(idx));

      // Skip CR/LF
      if (code > 64) continue;

      // Fail on illegal characters
      if (code < 0) return false;

      bitlen += 6;
    }

    // If there are any bits left, source was corrupted
    return (bitlen % 8) === 0;
  }

  function constructYamlBinary(data) {
    var idx, tailbits,
        input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
        max = input.length,
        map = BASE64_MAP,
        bits = 0,
        result = [];

    // Collect by 6*4 bits (3 bytes)

    for (idx = 0; idx < max; idx++) {
      if ((idx % 4 === 0) && idx) {
        result.push((bits >> 16) & 0xFF);
        result.push((bits >> 8) & 0xFF);
        result.push(bits & 0xFF);
      }

      bits = (bits << 6) | map.indexOf(input.charAt(idx));
    }

    // Dump tail

    tailbits = (max % 4) * 6;

    if (tailbits === 0) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    } else if (tailbits === 18) {
      result.push((bits >> 10) & 0xFF);
      result.push((bits >> 2) & 0xFF);
    } else if (tailbits === 12) {
      result.push((bits >> 4) & 0xFF);
    }

    // Wrap into Buffer for NodeJS and leave Array for browser
    if (NodeBuffer) {
      // Support node 6.+ Buffer API when available
      return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
    }

    return result;
  }

  function representYamlBinary(object /*, style*/) {
    var result = '', bits = 0, idx, tail,
        max = object.length,
        map = BASE64_MAP;

    // Convert every three bytes to 4 ASCII characters.

    for (idx = 0; idx < max; idx++) {
      if ((idx % 3 === 0) && idx) {
        result += map[(bits >> 18) & 0x3F];
        result += map[(bits >> 12) & 0x3F];
        result += map[(bits >> 6) & 0x3F];
        result += map[bits & 0x3F];
      }

      bits = (bits << 8) + object[idx];
    }

    // Dump tail

    tail = max % 3;

    if (tail === 0) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[bits & 0x3F];
    } else if (tail === 2) {
      result += map[(bits >> 10) & 0x3F];
      result += map[(bits >> 4) & 0x3F];
      result += map[(bits << 2) & 0x3F];
      result += map[64];
    } else if (tail === 1) {
      result += map[(bits >> 2) & 0x3F];
      result += map[(bits << 4) & 0x3F];
      result += map[64];
      result += map[64];
    }

    return result;
  }

  function isBinary(object) {
    return NodeBuffer && NodeBuffer.isBuffer(object);
  }

  var binary = new type('tag:yaml.org,2002:binary', {
    kind: 'scalar',
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });

  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  var _toString       = Object.prototype.toString;

  function resolveYamlOmap(data) {
    if (data === null) return true;

    var objectKeys = [], index, length, pair, pairKey, pairHasKey,
        object = data;

    for (index = 0, length = object.length; index < length; index += 1) {
      pair = object[index];
      pairHasKey = false;

      if (_toString.call(pair) !== '[object Object]') return false;

      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey) pairHasKey = true;
          else return false;
        }
      }

      if (!pairHasKey) return false;

      if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
      else return false;
    }

    return true;
  }

  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }

  var omap = new type('tag:yaml.org,2002:omap', {
    kind: 'sequence',
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });

  var _toString$1 = Object.prototype.toString;

  function resolveYamlPairs(data) {
    if (data === null) return true;

    var index, length, pair, keys, result,
        object = data;

    result = new Array(object.length);

    for (index = 0, length = object.length; index < length; index += 1) {
      pair = object[index];

      if (_toString$1.call(pair) !== '[object Object]') return false;

      keys = Object.keys(pair);

      if (keys.length !== 1) return false;

      result[index] = [ keys[0], pair[keys[0]] ];
    }

    return true;
  }

  function constructYamlPairs(data) {
    if (data === null) return [];

    var index, length, pair, keys, result,
        object = data;

    result = new Array(object.length);

    for (index = 0, length = object.length; index < length; index += 1) {
      pair = object[index];

      keys = Object.keys(pair);

      result[index] = [ keys[0], pair[keys[0]] ];
    }

    return result;
  }

  var pairs = new type('tag:yaml.org,2002:pairs', {
    kind: 'sequence',
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });

  var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;

  function resolveYamlSet(data) {
    if (data === null) return true;

    var key, object = data;

    for (key in object) {
      if (_hasOwnProperty$1.call(object, key)) {
        if (object[key] !== null) return false;
      }
    }

    return true;
  }

  function constructYamlSet(data) {
    return data !== null ? data : {};
  }

  var set = new type('tag:yaml.org,2002:set', {
    kind: 'mapping',
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });

  var default_safe = new schema({
    include: [
      core
    ],
    implicit: [
      timestamp,
      merge
    ],
    explicit: [
      binary,
      omap,
      pairs,
      set
    ]
  });

  function resolveJavascriptUndefined() {
    return true;
  }

  function constructJavascriptUndefined() {
    /*eslint-disable no-undefined*/
    return undefined;
  }

  function representJavascriptUndefined() {
    return '';
  }

  function isUndefined(object) {
    return typeof object === 'undefined';
  }

  var _undefined = new type('tag:yaml.org,2002:js/undefined', {
    kind: 'scalar',
    resolve: resolveJavascriptUndefined,
    construct: constructJavascriptUndefined,
    predicate: isUndefined,
    represent: representJavascriptUndefined
  });

  function resolveJavascriptRegExp(data) {
    if (data === null) return false;
    if (data.length === 0) return false;

    var regexp = data,
        tail   = /\/([gim]*)$/.exec(data),
        modifiers = '';

    // if regexp starts with '/' it can have modifiers and must be properly closed
    // `/foo/gim` - modifiers tail can be maximum 3 chars
    if (regexp[0] === '/') {
      if (tail) modifiers = tail[1];

      if (modifiers.length > 3) return false;
      // if expression starts with /, is should be properly terminated
      if (regexp[regexp.length - modifiers.length - 1] !== '/') return false;
    }

    return true;
  }

  function constructJavascriptRegExp(data) {
    var regexp = data,
        tail   = /\/([gim]*)$/.exec(data),
        modifiers = '';

    // `/foo/gim` - tail can be maximum 4 chars
    if (regexp[0] === '/') {
      if (tail) modifiers = tail[1];
      regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
    }

    return new RegExp(regexp, modifiers);
  }

  function representJavascriptRegExp(object /*, style*/) {
    var result = '/' + object.source + '/';

    if (object.global) result += 'g';
    if (object.multiline) result += 'm';
    if (object.ignoreCase) result += 'i';

    return result;
  }

  function isRegExp(object) {
    return Object.prototype.toString.call(object) === '[object RegExp]';
  }

  var regexp = new type('tag:yaml.org,2002:js/regexp', {
    kind: 'scalar',
    resolve: resolveJavascriptRegExp,
    construct: constructJavascriptRegExp,
    predicate: isRegExp,
    represent: representJavascriptRegExp
  });

  var esprima;

  // Browserified version does not have esprima
  //
  // 1. For node.js just require module as deps
  // 2. For browser try to require mudule via external AMD system.
  //    If not found - try to fallback to window.esprima. If not
  //    found too - then fail to parse.
  //
  try {
    // workaround to exclude package from browserify list.
    var _require$1 = commonjsRequire;
    esprima = _require$1('esprima');
  } catch (_) {
    /*global window */
    if (typeof window !== 'undefined') esprima = window.esprima;
  }



  function resolveJavascriptFunction(data) {
    if (data === null) return false;

    try {
      var source = '(' + data + ')',
          ast    = esprima.parse(source, { range: true });

      if (ast.type                    !== 'Program'             ||
          ast.body.length             !== 1                     ||
          ast.body[0].type            !== 'ExpressionStatement' ||
          (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
            ast.body[0].expression.type !== 'FunctionExpression')) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  function constructJavascriptFunction(data) {
    /*jslint evil:true*/

    var source = '(' + data + ')',
        ast    = esprima.parse(source, { range: true }),
        params = [],
        body;

    if (ast.type                    !== 'Program'             ||
        ast.body.length             !== 1                     ||
        ast.body[0].type            !== 'ExpressionStatement' ||
        (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
          ast.body[0].expression.type !== 'FunctionExpression')) {
      throw new Error('Failed to resolve function');
    }

    ast.body[0].expression.params.forEach(function (param) {
      params.push(param.name);
    });

    body = ast.body[0].expression.body.range;

    // Esprima's ranges include the first '{' and the last '}' characters on
    // function expressions. So cut them out.
    if (ast.body[0].expression.body.type === 'BlockStatement') {
      /*eslint-disable no-new-func*/
      return new Function(params, source.slice(body[0] + 1, body[1] - 1));
    }
    // ES6 arrow functions can omit the BlockStatement. In that case, just return
    // the body.
    /*eslint-disable no-new-func*/
    return new Function(params, 'return ' + source.slice(body[0], body[1]));
  }

  function representJavascriptFunction(object /*, style*/) {
    return object.toString();
  }

  function isFunction(object) {
    return Object.prototype.toString.call(object) === '[object Function]';
  }

  var _function = new type('tag:yaml.org,2002:js/function', {
    kind: 'scalar',
    resolve: resolveJavascriptFunction,
    construct: constructJavascriptFunction,
    predicate: isFunction,
    represent: representJavascriptFunction
  });

  var default_full = schema.DEFAULT = new schema({
    include: [
      default_safe
    ],
    explicit: [
      _undefined,
      regexp,
      _function
    ]
  });

  /*eslint-disable max-len,no-use-before-define*/








  var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;


  var CONTEXT_FLOW_IN   = 1;
  var CONTEXT_FLOW_OUT  = 2;
  var CONTEXT_BLOCK_IN  = 3;
  var CONTEXT_BLOCK_OUT = 4;


  var CHOMPING_CLIP  = 1;
  var CHOMPING_STRIP = 2;
  var CHOMPING_KEEP  = 3;


  var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
  var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
  var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


  function is_EOL(c) {
    return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
  }

  function is_WHITE_SPACE(c) {
    return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
  }

  function is_WS_OR_EOL(c) {
    return (c === 0x09/* Tab */) ||
           (c === 0x20/* Space */) ||
           (c === 0x0A/* LF */) ||
           (c === 0x0D/* CR */);
  }

  function is_FLOW_INDICATOR(c) {
    return c === 0x2C/* , */ ||
           c === 0x5B/* [ */ ||
           c === 0x5D/* ] */ ||
           c === 0x7B/* { */ ||
           c === 0x7D/* } */;
  }

  function fromHexCode(c) {
    var lc;

    if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
      return c - 0x30;
    }

    /*eslint-disable no-bitwise*/
    lc = c | 0x20;

    if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
      return lc - 0x61 + 10;
    }

    return -1;
  }

  function escapedHexLen(c) {
    if (c === 0x78/* x */) { return 2; }
    if (c === 0x75/* u */) { return 4; }
    if (c === 0x55/* U */) { return 8; }
    return 0;
  }

  function fromDecimalCode(c) {
    if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
      return c - 0x30;
    }

    return -1;
  }

  function simpleEscapeSequence(c) {
    /* eslint-disable indent */
    return (c === 0x30/* 0 */) ? '\x00' :
          (c === 0x61/* a */) ? '\x07' :
          (c === 0x62/* b */) ? '\x08' :
          (c === 0x74/* t */) ? '\x09' :
          (c === 0x09/* Tab */) ? '\x09' :
          (c === 0x6E/* n */) ? '\x0A' :
          (c === 0x76/* v */) ? '\x0B' :
          (c === 0x66/* f */) ? '\x0C' :
          (c === 0x72/* r */) ? '\x0D' :
          (c === 0x65/* e */) ? '\x1B' :
          (c === 0x20/* Space */) ? ' ' :
          (c === 0x22/* " */) ? '\x22' :
          (c === 0x2F/* / */) ? '/' :
          (c === 0x5C/* \ */) ? '\x5C' :
          (c === 0x4E/* N */) ? '\x85' :
          (c === 0x5F/* _ */) ? '\xA0' :
          (c === 0x4C/* L */) ? '\u2028' :
          (c === 0x50/* P */) ? '\u2029' : '';
  }

  function charFromCodepoint(c) {
    if (c <= 0xFFFF) {
      return String.fromCharCode(c);
    }
    // Encode UTF-16 surrogate pair
    // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
    return String.fromCharCode(
      ((c - 0x010000) >> 10) + 0xD800,
      ((c - 0x010000) & 0x03FF) + 0xDC00
    );
  }

  var simpleEscapeCheck = new Array(256); // integer, for fast access
  var simpleEscapeMap = new Array(256);
  for (var i = 0; i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }


  function State(input, options) {
    this.input = input;

    this.filename  = options['filename']  || null;
    this.schema    = options['schema']    || default_full;
    this.onWarning = options['onWarning'] || null;
    this.legacy    = options['legacy']    || false;
    this.json      = options['json']      || false;
    this.listener  = options['listener']  || null;

    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap       = this.schema.compiledTypeMap;

    this.length     = input.length;
    this.position   = 0;
    this.line       = 0;
    this.lineStart  = 0;
    this.lineIndent = 0;

    this.documents = [];

    /*
    this.version;
    this.checkLineBreaks;
    this.tagMap;
    this.anchorMap;
    this.tag;
    this.anchor;
    this.kind;
    this.result;*/

  }


  function generateError(state, message) {
    return new exception(
      message,
      new mark(state.filename, state.input, state.position, state.line, (state.position - state.lineStart)));
  }

  function throwError(state, message) {
    throw generateError(state, message);
  }

  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }


  var directiveHandlers = {

    YAML: function handleYamlDirective(state, name, args) {

      var match, major, minor;

      if (state.version !== null) {
        throwError(state, 'duplication of %YAML directive');
      }

      if (args.length !== 1) {
        throwError(state, 'YAML directive accepts exactly one argument');
      }

      match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

      if (match === null) {
        throwError(state, 'ill-formed argument of the YAML directive');
      }

      major = parseInt(match[1], 10);
      minor = parseInt(match[2], 10);

      if (major !== 1) {
        throwError(state, 'unacceptable YAML version of the document');
      }

      state.version = args[0];
      state.checkLineBreaks = (minor < 2);

      if (minor !== 1 && minor !== 2) {
        throwWarning(state, 'unsupported YAML version of the document');
      }
    },

    TAG: function handleTagDirective(state, name, args) {

      var handle, prefix;

      if (args.length !== 2) {
        throwError(state, 'TAG directive accepts exactly two arguments');
      }

      handle = args[0];
      prefix = args[1];

      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
      }

      if (_hasOwnProperty$2.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }

      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
      }

      state.tagMap[handle] = prefix;
    }
  };


  function captureSegment(state, start, end, checkJson) {
    var _position, _length, _character, _result;

    if (start < end) {
      _result = state.input.slice(start, end);

      if (checkJson) {
        for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
          _character = _result.charCodeAt(_position);
          if (!(_character === 0x09 ||
                (0x20 <= _character && _character <= 0x10FFFF))) {
            throwError(state, 'expected valid JSON character');
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, 'the stream contains non-printable characters');
      }

      state.result += _result;
    }
  }

  function mergeMappings(state, destination, source, overridableKeys) {
    var sourceKeys, key, index, quantity;

    if (!common.isObject(source)) {
      throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
    }

    sourceKeys = Object.keys(source);

    for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
      key = sourceKeys[index];

      if (!_hasOwnProperty$2.call(destination, key)) {
        destination[key] = source[key];
        overridableKeys[key] = true;
      }
    }
  }

  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
    var index, quantity;

    keyNode = String(keyNode);

    if (_result === null) {
      _result = {};
    }

    if (keyTag === 'tag:yaml.org,2002:merge') {
      if (Array.isArray(valueNode)) {
        for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json &&
          !_hasOwnProperty$2.call(overridableKeys, keyNode) &&
          _hasOwnProperty$2.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.position = startPos || state.position;
        throwError(state, 'duplicated mapping key');
      }
      _result[keyNode] = valueNode;
      delete overridableKeys[keyNode];
    }

    return _result;
  }

  function readLineBreak(state) {
    var ch;

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x0A/* LF */) {
      state.position++;
    } else if (ch === 0x0D/* CR */) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
        state.position++;
      }
    } else {
      throwError(state, 'a line break is expected');
    }

    state.line += 1;
    state.lineStart = state.position;
  }

  function skipSeparationSpace(state, allowComments, checkIndent) {
    var lineBreaks = 0,
        ch = state.input.charCodeAt(state.position);

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (allowComments && ch === 0x23/* # */) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
      }

      if (is_EOL(ch)) {
        readLineBreak(state);

        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;

        while (ch === 0x20/* Space */) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }

    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, 'deficient indentation');
    }

    return lineBreaks;
  }

  function testDocumentSeparator(state) {
    var _position = state.position,
        ch;

    ch = state.input.charCodeAt(_position);

    // Condition state.position === state.lineStart is tested
    // in parent on each call, for efficiency. No needs to test here again.
    if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
        ch === state.input.charCodeAt(_position + 1) &&
        ch === state.input.charCodeAt(_position + 2)) {

      _position += 3;

      ch = state.input.charCodeAt(_position);

      if (ch === 0 || is_WS_OR_EOL(ch)) {
        return true;
      }
    }

    return false;
  }

  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += ' ';
    } else if (count > 1) {
      state.result += common.repeat('\n', count - 1);
    }
  }


  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    var preceding,
        following,
        captureStart,
        captureEnd,
        hasPendingContent,
        _line,
        _lineStart,
        _lineIndent,
        _kind = state.kind,
        _result = state.result,
        ch;

    ch = state.input.charCodeAt(state.position);

    if (is_WS_OR_EOL(ch)      ||
        is_FLOW_INDICATOR(ch) ||
        ch === 0x23/* # */    ||
        ch === 0x26/* & */    ||
        ch === 0x2A/* * */    ||
        ch === 0x21/* ! */    ||
        ch === 0x7C/* | */    ||
        ch === 0x3E/* > */    ||
        ch === 0x27/* ' */    ||
        ch === 0x22/* " */    ||
        ch === 0x25/* % */    ||
        ch === 0x40/* @ */    ||
        ch === 0x60/* ` */) {
      return false;
    }

    if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) ||
          withinFlowCollection && is_FLOW_INDICATOR(following)) {
        return false;
      }
    }

    state.kind = 'scalar';
    state.result = '';
    captureStart = captureEnd = state.position;
    hasPendingContent = false;

    while (ch !== 0) {
      if (ch === 0x3A/* : */) {
        following = state.input.charCodeAt(state.position + 1);

        if (is_WS_OR_EOL(following) ||
            withinFlowCollection && is_FLOW_INDICATOR(following)) {
          break;
        }

      } else if (ch === 0x23/* # */) {
        preceding = state.input.charCodeAt(state.position - 1);

        if (is_WS_OR_EOL(preceding)) {
          break;
        }

      } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
                 withinFlowCollection && is_FLOW_INDICATOR(ch)) {
        break;

      } else if (is_EOL(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);

        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }

      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }

      if (!is_WHITE_SPACE(ch)) {
        captureEnd = state.position + 1;
      }

      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, captureEnd, false);

    if (state.result) {
      return true;
    }

    state.kind = _kind;
    state.result = _result;
    return false;
  }

  function readSingleQuotedScalar(state, nodeIndent) {
    var ch,
        captureStart, captureEnd;

    ch = state.input.charCodeAt(state.position);

    if (ch !== 0x27/* ' */) {
      return false;
    }

    state.kind = 'scalar';
    state.result = '';
    state.position++;
    captureStart = captureEnd = state.position;

    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 0x27/* ' */) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);

        if (ch === 0x27/* ' */) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }

      } else if (is_EOL(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;

      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, 'unexpected end of the document within a single quoted scalar');

      } else {
        state.position++;
        captureEnd = state.position;
      }
    }

    throwError(state, 'unexpected end of the stream within a single quoted scalar');
  }

  function readDoubleQuotedScalar(state, nodeIndent) {
    var captureStart,
        captureEnd,
        hexLength,
        hexResult,
        tmp,
        ch;

    ch = state.input.charCodeAt(state.position);

    if (ch !== 0x22/* " */) {
      return false;
    }

    state.kind = 'scalar';
    state.result = '';
    state.position++;
    captureStart = captureEnd = state.position;

    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 0x22/* " */) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;

      } else if (ch === 0x5C/* \ */) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);

        if (is_EOL(ch)) {
          skipSeparationSpace(state, false, nodeIndent);

          // TODO: rework to inline fn with no type cast?
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;

        } else if ((tmp = escapedHexLen(ch)) > 0) {
          hexLength = tmp;
          hexResult = 0;

          for (; hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);

            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;

            } else {
              throwError(state, 'expected hexadecimal character');
            }
          }

          state.result += charFromCodepoint(hexResult);

          state.position++;

        } else {
          throwError(state, 'unknown escape sequence');
        }

        captureStart = captureEnd = state.position;

      } else if (is_EOL(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;

      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, 'unexpected end of the document within a double quoted scalar');

      } else {
        state.position++;
        captureEnd = state.position;
      }
    }

    throwError(state, 'unexpected end of the stream within a double quoted scalar');
  }

  function readFlowCollection(state, nodeIndent) {
    var readNext = true,
        _line,
        _tag     = state.tag,
        _result,
        _anchor  = state.anchor,
        following,
        terminator,
        isPair,
        isExplicitPair,
        isMapping,
        overridableKeys = {},
        keyNode,
        keyTag,
        valueNode,
        ch;

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x5B/* [ */) {
      terminator = 0x5D;/* ] */
      isMapping = false;
      _result = [];
    } else if (ch === 0x7B/* { */) {
      terminator = 0x7D;/* } */
      isMapping = true;
      _result = {};
    } else {
      return false;
    }

    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }

    ch = state.input.charCodeAt(++state.position);

    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);

      ch = state.input.charCodeAt(state.position);

      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? 'mapping' : 'sequence';
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, 'missed comma between flow collection entries');
      }

      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;

      if (ch === 0x3F/* ? */) {
        following = state.input.charCodeAt(state.position + 1);

        if (is_WS_OR_EOL(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }

      _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);

      ch = state.input.charCodeAt(state.position);

      if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }

      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
      } else {
        _result.push(keyNode);
      }

      skipSeparationSpace(state, true, nodeIndent);

      ch = state.input.charCodeAt(state.position);

      if (ch === 0x2C/* , */) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }

    throwError(state, 'unexpected end of the stream within a flow collection');
  }

  function readBlockScalar(state, nodeIndent) {
    var captureStart,
        folding,
        chomping       = CHOMPING_CLIP,
        didReadContent = false,
        detectedIndent = false,
        textIndent     = nodeIndent,
        emptyLines     = 0,
        atMoreIndented = false,
        tmp,
        ch;

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x7C/* | */) {
      folding = false;
    } else if (ch === 0x3E/* > */) {
      folding = true;
    } else {
      return false;
    }

    state.kind = 'scalar';
    state.result = '';

    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
        if (CHOMPING_CLIP === chomping) {
          chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, 'repeat of a chomping mode identifier');
        }

      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, 'repeat of an indentation width identifier');
        }

      } else {
        break;
      }
    }

    if (is_WHITE_SPACE(ch)) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (is_WHITE_SPACE(ch));

      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (!is_EOL(ch) && (ch !== 0));
      }
    }

    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;

      ch = state.input.charCodeAt(state.position);

      while ((!detectedIndent || state.lineIndent < textIndent) &&
             (ch === 0x20/* Space */)) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }

      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }

      if (is_EOL(ch)) {
        emptyLines++;
        continue;
      }

      // End of the scalar.
      if (state.lineIndent < textIndent) {

        // Perform the chomping.
        if (chomping === CHOMPING_KEEP) {
          state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) { // i.e. only if the scalar is not empty.
            state.result += '\n';
          }
        }

        // Break this `while` cycle and go to the funciton's epilogue.
        break;
      }

      // Folded style: use fancy rules to handle line breaks.
      if (folding) {

        // Lines starting with white space characters (more-indented lines) are not folded.
        if (is_WHITE_SPACE(ch)) {
          atMoreIndented = true;
          // except for the first content line (cf. Example 8.1)
          state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

        // End of more-indented block.
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common.repeat('\n', emptyLines + 1);

        // Just one line break - perceive as the same line.
        } else if (emptyLines === 0) {
          if (didReadContent) { // i.e. only if we have already read some scalar content.
            state.result += ' ';
          }

        // Several line breaks - perceive as different lines.
        } else {
          state.result += common.repeat('\n', emptyLines);
        }

      // Literal style: just add exact number of line breaks between content lines.
      } else {
        // Keep all line breaks except the header line break.
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      }

      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      captureStart = state.position;

      while (!is_EOL(ch) && (ch !== 0)) {
        ch = state.input.charCodeAt(++state.position);
      }

      captureSegment(state, captureStart, state.position, false);
    }

    return true;
  }

  function readBlockSequence(state, nodeIndent) {
    var _line,
        _tag      = state.tag,
        _anchor   = state.anchor,
        _result   = [],
        following,
        detected  = false,
        ch;

    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }

    ch = state.input.charCodeAt(state.position);

    while (ch !== 0) {

      if (ch !== 0x2D/* - */) {
        break;
      }

      following = state.input.charCodeAt(state.position + 1);

      if (!is_WS_OR_EOL(following)) {
        break;
      }

      detected = true;
      state.position++;

      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }

      _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);

      ch = state.input.charCodeAt(state.position);

      if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
        throwError(state, 'bad indentation of a sequence entry');
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }

    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = 'sequence';
      state.result = _result;
      return true;
    }
    return false;
  }

  function readBlockMapping(state, nodeIndent, flowIndent) {
    var following,
        allowCompact,
        _line,
        _pos,
        _tag          = state.tag,
        _anchor       = state.anchor,
        _result       = {},
        overridableKeys = {},
        keyTag        = null,
        keyNode       = null,
        valueNode     = null,
        atExplicitKey = false,
        detected      = false,
        ch;

    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }

    ch = state.input.charCodeAt(state.position);

    while (ch !== 0) {
      following = state.input.charCodeAt(state.position + 1);
      _line = state.line; // Save the current line.
      _pos = state.position;

      //
      // Explicit notation case. There are two separate blocks:
      // first for the key (denoted by "?") and second for the value (denoted by ":")
      //
      if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

        if (ch === 0x3F/* ? */) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = true;
          allowCompact = true;

        } else if (atExplicitKey) {
          // i.e. 0x3A/* : */ === character after the explicit key.
          atExplicitKey = false;
          allowCompact = true;

        } else {
          throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
        }

        state.position += 1;
        ch = following;

      //
      // Implicit notation case. Flow-style node as the key first, then ":", and the value.
      //
      } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {

        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);

          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }

          if (ch === 0x3A/* : */) {
            ch = state.input.charCodeAt(++state.position);

            if (!is_WS_OR_EOL(ch)) {
              throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
            }

            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
              keyTag = keyNode = valueNode = null;
            }

            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;

          } else if (detected) {
            throwError(state, 'can not read an implicit mapping pair; a colon is missed');

          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true; // Keep the result of `composeNode`.
          }

        } else if (detected) {
          throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }

      } else {
        break; // Reading is done. Go to the epilogue.
      }

      //
      // Common reading code for both explicit and implicit notations.
      //
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }

        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
          keyTag = keyNode = valueNode = null;
        }

        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }

      if (state.lineIndent > nodeIndent && (ch !== 0)) {
        throwError(state, 'bad indentation of a mapping entry');
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }

    //
    // Epilogue.
    //

    // Special case: last mapping's node contains only the key in explicit notation.
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
    }

    // Expose the resulting mapping.
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = 'mapping';
      state.result = _result;
    }

    return detected;
  }

  function readTagProperty(state) {
    var _position,
        isVerbatim = false,
        isNamed    = false,
        tagHandle,
        tagName,
        ch;

    ch = state.input.charCodeAt(state.position);

    if (ch !== 0x21/* ! */) return false;

    if (state.tag !== null) {
      throwError(state, 'duplication of a tag property');
    }

    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x3C/* < */) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);

    } else if (ch === 0x21/* ! */) {
      isNamed = true;
      tagHandle = '!!';
      ch = state.input.charCodeAt(++state.position);

    } else {
      tagHandle = '!';
    }

    _position = state.position;

    if (isVerbatim) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (ch !== 0 && ch !== 0x3E/* > */);

      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, 'unexpected end of the stream within a verbatim tag');
      }
    } else {
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {

        if (ch === 0x21/* ! */) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);

            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, 'named tag handle cannot contain such characters');
            }

            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, 'tag suffix cannot contain exclamation marks');
          }
        }

        ch = state.input.charCodeAt(++state.position);
      }

      tagName = state.input.slice(_position, state.position);

      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, 'tag suffix cannot contain flow indicator characters');
      }
    }

    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, 'tag name cannot contain such characters: ' + tagName);
    }

    if (isVerbatim) {
      state.tag = tagName;

    } else if (_hasOwnProperty$2.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;

    } else if (tagHandle === '!') {
      state.tag = '!' + tagName;

    } else if (tagHandle === '!!') {
      state.tag = 'tag:yaml.org,2002:' + tagName;

    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }

    return true;
  }

  function readAnchorProperty(state) {
    var _position,
        ch;

    ch = state.input.charCodeAt(state.position);

    if (ch !== 0x26/* & */) return false;

    if (state.anchor !== null) {
      throwError(state, 'duplication of an anchor property');
    }

    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    if (state.position === _position) {
      throwError(state, 'name of an anchor node must contain at least one character');
    }

    state.anchor = state.input.slice(_position, state.position);
    return true;
  }

  function readAlias(state) {
    var _position, alias,
        ch;

    ch = state.input.charCodeAt(state.position);

    if (ch !== 0x2A/* * */) return false;

    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    if (state.position === _position) {
      throwError(state, 'name of an alias node must contain at least one character');
    }

    alias = state.input.slice(_position, state.position);

    if (!state.anchorMap.hasOwnProperty(alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }

    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }

  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    var allowBlockStyles,
        allowBlockScalars,
        allowBlockCollections,
        indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
        atNewLine  = false,
        hasContent = false,
        typeIndex,
        typeQuantity,
        type,
        flowIndent,
        blockIndent;

    if (state.listener !== null) {
      state.listener('open', state);
    }

    state.tag    = null;
    state.anchor = null;
    state.kind   = null;
    state.result = null;

    allowBlockStyles = allowBlockScalars = allowBlockCollections =
      CONTEXT_BLOCK_OUT === nodeContext ||
      CONTEXT_BLOCK_IN  === nodeContext;

    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }

    if (indentStatus === 1) {
      while (readTagProperty(state) || readAnchorProperty(state)) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;

          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }

    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }

    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }

      blockIndent = state.position - state.lineStart;

      if (indentStatus === 1) {
        if (allowBlockCollections &&
            (readBlockSequence(state, blockIndent) ||
             readBlockMapping(state, blockIndent, flowIndent)) ||
            readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
              readSingleQuotedScalar(state, flowIndent) ||
              readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;

          } else if (readAlias(state)) {
            hasContent = true;

            if (state.tag !== null || state.anchor !== null) {
              throwError(state, 'alias node should not have any properties');
            }

          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;

            if (state.tag === null) {
              state.tag = '?';
            }
          }

          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      } else if (indentStatus === 0) {
        // Special case: block sequences are allowed to have same indentation level as the parent.
        // http://www.yaml.org/spec/1.2/spec.html#id2799784
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }

    if (state.tag !== null && state.tag !== '!') {
      if (state.tag === '?') {
        for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
          type = state.implicitTypes[typeIndex];

          // Implicit resolving is not allowed for non-scalar types, and '?'
          // non-specific tag is only assigned to plain scalars. So, it isn't
          // needed to check for 'kind' conformity.

          if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
            state.result = type.construct(state.result);
            state.tag = type.tag;
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
            break;
          }
        }
      } else if (_hasOwnProperty$2.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
        type = state.typeMap[state.kind || 'fallback'][state.tag];

        if (state.result !== null && type.kind !== state.kind) {
          throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
        }

        if (!type.resolve(state.result)) { // `state.result` updated in resolver if matched
          throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
        } else {
          state.result = type.construct(state.result);
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      } else {
        throwError(state, 'unknown tag !<' + state.tag + '>');
      }
    }

    if (state.listener !== null) {
      state.listener('close', state);
    }
    return state.tag !== null ||  state.anchor !== null || hasContent;
  }

  function readDocument(state) {
    var documentStart = state.position,
        _position,
        directiveName,
        directiveArgs,
        hasDirectives = false,
        ch;

    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = {};
    state.anchorMap = {};

    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);

      ch = state.input.charCodeAt(state.position);

      if (state.lineIndent > 0 || ch !== 0x25/* % */) {
        break;
      }

      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveName = state.input.slice(_position, state.position);
      directiveArgs = [];

      if (directiveName.length < 1) {
        throwError(state, 'directive name must not be less than one character in length');
      }

      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x23/* # */) {
          do { ch = state.input.charCodeAt(++state.position); }
          while (ch !== 0 && !is_EOL(ch));
          break;
        }

        if (is_EOL(ch)) break;

        _position = state.position;

        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        directiveArgs.push(state.input.slice(_position, state.position));
      }

      if (ch !== 0) readLineBreak(state);

      if (_hasOwnProperty$2.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }

    skipSeparationSpace(state, true, -1);

    if (state.lineIndent === 0 &&
        state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
        state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
        state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);

    } else if (hasDirectives) {
      throwError(state, 'directives end mark is expected');
    }

    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);

    if (state.checkLineBreaks &&
        PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, 'non-ASCII line breaks are interpreted as content');
    }

    state.documents.push(state.result);

    if (state.position === state.lineStart && testDocumentSeparator(state)) {

      if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }

    if (state.position < (state.length - 1)) {
      throwError(state, 'end of the stream or a document separator is expected');
    } else {
      return;
    }
  }


  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};

    if (input.length !== 0) {

      // Add tailing `\n` if not exists
      if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
          input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
        input += '\n';
      }

      // Strip BOM
      if (input.charCodeAt(0) === 0xFEFF) {
        input = input.slice(1);
      }
    }

    var state = new State(input, options);

    // Use 0 as string terminator. That significantly simplifies bounds check.
    state.input += '\0';

    while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
      state.lineIndent += 1;
      state.position += 1;
    }

    while (state.position < (state.length - 1)) {
      readDocument(state);
    }

    return state.documents;
  }


  function loadAll(input, iterator, options) {
    var documents = loadDocuments(input, options), index, length;

    if (typeof iterator !== 'function') {
      return documents;
    }

    for (index = 0, length = documents.length; index < length; index += 1) {
      iterator(documents[index]);
    }
  }


  function load(input, options) {
    var documents = loadDocuments(input, options);

    if (documents.length === 0) {
      /*eslint-disable no-undefined*/
      return undefined;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new exception('expected a single document in the stream, but found more');
  }


  function safeLoadAll(input, output, options) {
    if (typeof output === 'function') {
      loadAll(input, output, common.extend({ schema: default_safe }, options));
    } else {
      return loadAll(input, common.extend({ schema: default_safe }, options));
    }
  }


  function safeLoad(input, options) {
    return load(input, common.extend({ schema: default_safe }, options));
  }


  var loadAll_1     = loadAll;
  var load_1        = load;
  var safeLoadAll_1 = safeLoadAll;
  var safeLoad_1    = safeLoad;

  var loader = {
  	loadAll: loadAll_1,
  	load: load_1,
  	safeLoadAll: safeLoadAll_1,
  	safeLoad: safeLoad_1
  };

  /*eslint-disable no-use-before-define*/






  var _toString$2       = Object.prototype.toString;
  var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;

  var CHAR_TAB                  = 0x09; /* Tab */
  var CHAR_LINE_FEED            = 0x0A; /* LF */
  var CHAR_SPACE                = 0x20; /* Space */
  var CHAR_EXCLAMATION          = 0x21; /* ! */
  var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
  var CHAR_SHARP                = 0x23; /* # */
  var CHAR_PERCENT              = 0x25; /* % */
  var CHAR_AMPERSAND            = 0x26; /* & */
  var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
  var CHAR_ASTERISK             = 0x2A; /* * */
  var CHAR_COMMA                = 0x2C; /* , */
  var CHAR_MINUS                = 0x2D; /* - */
  var CHAR_COLON                = 0x3A; /* : */
  var CHAR_GREATER_THAN         = 0x3E; /* > */
  var CHAR_QUESTION             = 0x3F; /* ? */
  var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
  var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
  var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
  var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
  var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
  var CHAR_VERTICAL_LINE        = 0x7C; /* | */
  var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

  var ESCAPE_SEQUENCES = {};

  ESCAPE_SEQUENCES[0x00]   = '\\0';
  ESCAPE_SEQUENCES[0x07]   = '\\a';
  ESCAPE_SEQUENCES[0x08]   = '\\b';
  ESCAPE_SEQUENCES[0x09]   = '\\t';
  ESCAPE_SEQUENCES[0x0A]   = '\\n';
  ESCAPE_SEQUENCES[0x0B]   = '\\v';
  ESCAPE_SEQUENCES[0x0C]   = '\\f';
  ESCAPE_SEQUENCES[0x0D]   = '\\r';
  ESCAPE_SEQUENCES[0x1B]   = '\\e';
  ESCAPE_SEQUENCES[0x22]   = '\\"';
  ESCAPE_SEQUENCES[0x5C]   = '\\\\';
  ESCAPE_SEQUENCES[0x85]   = '\\N';
  ESCAPE_SEQUENCES[0xA0]   = '\\_';
  ESCAPE_SEQUENCES[0x2028] = '\\L';
  ESCAPE_SEQUENCES[0x2029] = '\\P';

  var DEPRECATED_BOOLEANS_SYNTAX = [
    'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
    'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
  ];

  function compileStyleMap(schema, map) {
    var result, keys, index, length, tag, style, type;

    if (map === null) return {};

    result = {};
    keys = Object.keys(map);

    for (index = 0, length = keys.length; index < length; index += 1) {
      tag = keys[index];
      style = String(map[tag]);

      if (tag.slice(0, 2) === '!!') {
        tag = 'tag:yaml.org,2002:' + tag.slice(2);
      }
      type = schema.compiledTypeMap['fallback'][tag];

      if (type && _hasOwnProperty$3.call(type.styleAliases, style)) {
        style = type.styleAliases[style];
      }

      result[tag] = style;
    }

    return result;
  }

  function encodeHex(character) {
    var string, handle, length;

    string = character.toString(16).toUpperCase();

    if (character <= 0xFF) {
      handle = 'x';
      length = 2;
    } else if (character <= 0xFFFF) {
      handle = 'u';
      length = 4;
    } else if (character <= 0xFFFFFFFF) {
      handle = 'U';
      length = 8;
    } else {
      throw new exception('code point within a string may not be greater than 0xFFFFFFFF');
    }

    return '\\' + handle + common.repeat('0', length - string.length) + string;
  }

  function State$1(options) {
    this.schema        = options['schema'] || default_full;
    this.indent        = Math.max(1, (options['indent'] || 2));
    this.noArrayIndent = options['noArrayIndent'] || false;
    this.skipInvalid   = options['skipInvalid'] || false;
    this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
    this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
    this.sortKeys      = options['sortKeys'] || false;
    this.lineWidth     = options['lineWidth'] || 80;
    this.noRefs        = options['noRefs'] || false;
    this.noCompatMode  = options['noCompatMode'] || false;
    this.condenseFlow  = options['condenseFlow'] || false;

    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;

    this.tag = null;
    this.result = '';

    this.duplicates = [];
    this.usedDuplicates = null;
  }

  // Indents every line in a string. Empty lines (\n only) are not indented.
  function indentString(string, spaces) {
    var ind = common.repeat(' ', spaces),
        position = 0,
        next = -1,
        result = '',
        line,
        length = string.length;

    while (position < length) {
      next = string.indexOf('\n', position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }

      if (line.length && line !== '\n') result += ind;

      result += line;
    }

    return result;
  }

  function generateNextLine(state, level) {
    return '\n' + common.repeat(' ', state.indent * level);
  }

  function testImplicitResolving(state, str) {
    var index, length, type;

    for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
      type = state.implicitTypes[index];

      if (type.resolve(str)) {
        return true;
      }
    }

    return false;
  }

  // [33] s-white ::= s-space | s-tab
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }

  // Returns true if the character can be printed without escaping.
  // From YAML 1.2: "any allowed characters known to be non-printable
  // should also be escaped. [However,] This isn’t mandatory"
  // Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
  function isPrintable(c) {
    return  (0x00020 <= c && c <= 0x00007E)
        || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
        || ((0x0E000 <= c && c <= 0x00FFFD) && c !== 0xFEFF /* BOM */)
        ||  (0x10000 <= c && c <= 0x10FFFF);
  }

  // Simplified test for values allowed after the first character in plain style.
  function isPlainSafe(c) {
    // Uses a subset of nb-char - c-flow-indicator - ":" - "#"
    // where nb-char ::= c-printable - b-char - c-byte-order-mark.
    return isPrintable(c) && c !== 0xFEFF
      // - c-flow-indicator
      && c !== CHAR_COMMA
      && c !== CHAR_LEFT_SQUARE_BRACKET
      && c !== CHAR_RIGHT_SQUARE_BRACKET
      && c !== CHAR_LEFT_CURLY_BRACKET
      && c !== CHAR_RIGHT_CURLY_BRACKET
      // - ":" - "#"
      && c !== CHAR_COLON
      && c !== CHAR_SHARP;
  }

  // Simplified test for values allowed as the first character in plain style.
  function isPlainSafeFirst(c) {
    // Uses a subset of ns-char - c-indicator
    // where ns-char = nb-char - s-white.
    return isPrintable(c) && c !== 0xFEFF
      && !isWhitespace(c) // - s-white
      // - (c-indicator ::=
      // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
      && c !== CHAR_MINUS
      && c !== CHAR_QUESTION
      && c !== CHAR_COLON
      && c !== CHAR_COMMA
      && c !== CHAR_LEFT_SQUARE_BRACKET
      && c !== CHAR_RIGHT_SQUARE_BRACKET
      && c !== CHAR_LEFT_CURLY_BRACKET
      && c !== CHAR_RIGHT_CURLY_BRACKET
      // | “#” | “&” | “*” | “!” | “|” | “>” | “'” | “"”
      && c !== CHAR_SHARP
      && c !== CHAR_AMPERSAND
      && c !== CHAR_ASTERISK
      && c !== CHAR_EXCLAMATION
      && c !== CHAR_VERTICAL_LINE
      && c !== CHAR_GREATER_THAN
      && c !== CHAR_SINGLE_QUOTE
      && c !== CHAR_DOUBLE_QUOTE
      // | “%” | “@” | “`”)
      && c !== CHAR_PERCENT
      && c !== CHAR_COMMERCIAL_AT
      && c !== CHAR_GRAVE_ACCENT;
  }

  // Determines whether block indentation indicator is required.
  function needIndentIndicator(string) {
    var leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }

  var STYLE_PLAIN   = 1,
      STYLE_SINGLE  = 2,
      STYLE_LITERAL = 3,
      STYLE_FOLDED  = 4,
      STYLE_DOUBLE  = 5;

  // Determines which scalar styles are possible and returns the preferred style.
  // lineWidth = -1 => no limit.
  // Pre-conditions: str.length > 0.
  // Post-conditions:
  //    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
  //    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
  //    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
    var i;
    var char;
    var hasLineBreak = false;
    var hasFoldableLine = false; // only checked if shouldTrackWidth
    var shouldTrackWidth = lineWidth !== -1;
    var previousLineBreak = -1; // count the first line correctly
    var plain = isPlainSafeFirst(string.charCodeAt(0))
            && !isWhitespace(string.charCodeAt(string.length - 1));

    if (singleLineOnly) {
      // Case: no block styles.
      // Check for disallowed characters to rule out plain and single.
      for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char);
      }
    } else {
      // Case: block styles permitted.
      for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          // Check if any line can be folded.
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine ||
              // Foldable line = too long, and not more-indented.
              (i - previousLineBreak - 1 > lineWidth &&
               string[previousLineBreak + 1] !== ' ');
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char);
      }
      // in case the end is missing a \n
      hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
        (i - previousLineBreak - 1 > lineWidth &&
         string[previousLineBreak + 1] !== ' '));
    }
    // Although every style can represent \n without escaping, prefer block styles
    // for multiline, since they're more readable and they don't add empty lines.
    // Also prefer folding a super-long line.
    if (!hasLineBreak && !hasFoldableLine) {
      // Strings interpretable as another type have to be quoted;
      // e.g. the string 'true' vs. the boolean true.
      return plain && !testAmbiguousType(string)
        ? STYLE_PLAIN : STYLE_SINGLE;
    }
    // Edge case: block indentation indicator can only have one digit.
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    // At this point we know block styles are valid.
    // Prefer literal style unless we want to fold.
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }

  // Note: line breaking/folding is implemented for only the folded style.
  // NB. We drop the last trailing newline (if any) of a returned block scalar
  //  since the dumper adds its own newline. This always works:
  //    • No ending newline => unaffected; already using strip "-" chomping.
  //    • Ending newline    => removed then restored.
  //  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
  function writeScalar(state, string, level, iskey) {
    state.dump = (function () {
      if (string.length === 0) {
        return "''";
      }
      if (!state.noCompatMode &&
          DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
        return "'" + string + "'";
      }

      var indent = state.indent * Math.max(1, level); // no 0-indent scalars
      // As indentation gets deeper, let the width decrease monotonically
      // to the lower bound min(state.lineWidth, 40).
      // Note that this implies
      //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
      //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
      // This behaves better than a constant minimum width which disallows narrower options,
      // or an indent threshold which causes the width to suddenly increase.
      var lineWidth = state.lineWidth === -1
        ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

      // Without knowing if keys are implicit/explicit, assume implicit for safety.
      var singleLineOnly = iskey
        // No block styles in flow mode.
        || (state.flowLevel > -1 && level >= state.flowLevel);
      function testAmbiguity(string) {
        return testImplicitResolving(state, string);
      }

      switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return '|' + blockHeader(string, state.indent)
            + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return '>' + blockHeader(string, state.indent)
            + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string, lineWidth) + '"';
        default:
          throw new exception('impossible error: invalid scalar style');
      }
    }());
  }

  // Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
  function blockHeader(string, indentPerLevel) {
    var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

    // note the special case: the string '\n' counts as a "trailing" empty line.
    var clip =          string[string.length - 1] === '\n';
    var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
    var chomp = keep ? '+' : (clip ? '' : '-');

    return indentIndicator + chomp + '\n';
  }

  // (See the note for writeScalar.)
  function dropEndingNewline(string) {
    return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
  }

  // Note: a long line without a suitable break point will exceed the width limit.
  // Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
  function foldString(string, width) {
    // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
    // unless they're before or after a more-indented line, or at the very
    // beginning or end, in which case $k$ maps to $k$.
    // Therefore, parse each chunk as newline(s) followed by a content line.
    var lineRe = /(\n+)([^\n]*)/g;

    // first line (possibly an empty line)
    var result = (function () {
      var nextLF = string.indexOf('\n');
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }());
    // If we haven't reached the first content line yet, don't add an extra \n.
    var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
    var moreIndented;

    // rest of the lines
    var match;
    while ((match = lineRe.exec(string))) {
      var prefix = match[1], line = match[2];
      moreIndented = (line[0] === ' ');
      result += prefix
        + (!prevMoreIndented && !moreIndented && line !== ''
          ? '\n' : '')
        + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }

    return result;
  }

  // Greedy line breaking.
  // Picks the longest line under the limit each time,
  // otherwise settles for the shortest line over the limit.
  // NB. More-indented lines *cannot* be folded, as that would add an extra \n.
  function foldLine(line, width) {
    if (line === '' || line[0] === ' ') return line;

    // Since a more-indented line adds a \n, breaks can't be followed by a space.
    var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
    var match;
    // start is an inclusive index. end, curr, and next are exclusive.
    var start = 0, end, curr = 0, next = 0;
    var result = '';

    // Invariants: 0 <= start <= length-1.
    //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
    // Inside the loop:
    //   A match implies length >= 2, so curr and next are <= length-2.
    while ((match = breakRe.exec(line))) {
      next = match.index;
      // maintain invariant: curr - start <= width
      if (next - start > width) {
        end = (curr > start) ? curr : next; // derive end <= length-2
        result += '\n' + line.slice(start, end);
        // skip the space that was output as \n
        start = end + 1;                    // derive start <= length-1
      }
      curr = next;
    }

    // By the invariants, start <= length-1, so there is something left over.
    // It is either the whole string or a part starting from non-whitespace.
    result += '\n';
    // Insert a break if the remainder is too long and there is a break available.
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }

    return result.slice(1); // drop extra \n joiner
  }

  // Escapes a double-quoted string.
  function escapeString(string) {
    var result = '';
    var char, nextChar;
    var escapeSeq;

    for (var i = 0; i < string.length; i++) {
      char = string.charCodeAt(i);
      // Check for surrogate pairs (reference Unicode 3.0 section "3.7 Surrogates").
      if (char >= 0xD800 && char <= 0xDBFF/* high surrogate */) {
        nextChar = string.charCodeAt(i + 1);
        if (nextChar >= 0xDC00 && nextChar <= 0xDFFF/* low surrogate */) {
          // Combine the surrogate pair and store it escaped.
          result += encodeHex((char - 0xD800) * 0x400 + nextChar - 0xDC00 + 0x10000);
          // Advance index one extra since we already used that char here.
          i++; continue;
        }
      }
      escapeSeq = ESCAPE_SEQUENCES[char];
      result += !escapeSeq && isPrintable(char)
        ? string[i]
        : escapeSeq || encodeHex(char);
    }

    return result;
  }

  function writeFlowSequence(state, level, object) {
    var _result = '',
        _tag    = state.tag,
        index,
        length;

    for (index = 0, length = object.length; index < length; index += 1) {
      // Write only valid elements.
      if (writeNode(state, level, object[index], false, false)) {
        if (index !== 0) _result += ',' + (!state.condenseFlow ? ' ' : '');
        _result += state.dump;
      }
    }

    state.tag = _tag;
    state.dump = '[' + _result + ']';
  }

  function writeBlockSequence(state, level, object, compact) {
    var _result = '',
        _tag    = state.tag,
        index,
        length;

    for (index = 0, length = object.length; index < length; index += 1) {
      // Write only valid elements.
      if (writeNode(state, level + 1, object[index], true, true)) {
        if (!compact || index !== 0) {
          _result += generateNextLine(state, level);
        }

        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += '-';
        } else {
          _result += '- ';
        }

        _result += state.dump;
      }
    }

    state.tag = _tag;
    state.dump = _result || '[]'; // Empty sequence if no valid values.
  }

  function writeFlowMapping(state, level, object) {
    var _result       = '',
        _tag          = state.tag,
        objectKeyList = Object.keys(object),
        index,
        length,
        objectKey,
        objectValue,
        pairBuffer;

    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = state.condenseFlow ? '"' : '';

      if (index !== 0) pairBuffer += ', ';

      objectKey = objectKeyList[index];
      objectValue = object[objectKey];

      if (!writeNode(state, level, objectKey, false, false)) {
        continue; // Skip this pair because of invalid key;
      }

      if (state.dump.length > 1024) pairBuffer += '? ';

      pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

      if (!writeNode(state, level, objectValue, false, false)) {
        continue; // Skip this pair because of invalid value.
      }

      pairBuffer += state.dump;

      // Both key and value are valid.
      _result += pairBuffer;
    }

    state.tag = _tag;
    state.dump = '{' + _result + '}';
  }

  function writeBlockMapping(state, level, object, compact) {
    var _result       = '',
        _tag          = state.tag,
        objectKeyList = Object.keys(object),
        index,
        length,
        objectKey,
        objectValue,
        explicitPair,
        pairBuffer;

    // Allow sorting keys so that the output file is deterministic
    if (state.sortKeys === true) {
      // Default sorting
      objectKeyList.sort();
    } else if (typeof state.sortKeys === 'function') {
      // Custom sort function
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      // Something is wrong
      throw new exception('sortKeys must be a boolean or a function');
    }

    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = '';

      if (!compact || index !== 0) {
        pairBuffer += generateNextLine(state, level);
      }

      objectKey = objectKeyList[index];
      objectValue = object[objectKey];

      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue; // Skip this pair because of invalid key.
      }

      explicitPair = (state.tag !== null && state.tag !== '?') ||
                     (state.dump && state.dump.length > 1024);

      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += '?';
        } else {
          pairBuffer += '? ';
        }
      }

      pairBuffer += state.dump;

      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }

      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue; // Skip this pair because of invalid value.
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ':';
      } else {
        pairBuffer += ': ';
      }

      pairBuffer += state.dump;

      // Both key and value are valid.
      _result += pairBuffer;
    }

    state.tag = _tag;
    state.dump = _result || '{}'; // Empty mapping if no valid pairs.
  }

  function detectType(state, object, explicit) {
    var _result, typeList, index, length, type, style;

    typeList = explicit ? state.explicitTypes : state.implicitTypes;

    for (index = 0, length = typeList.length; index < length; index += 1) {
      type = typeList[index];

      if ((type.instanceOf  || type.predicate) &&
          (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
          (!type.predicate  || type.predicate(object))) {

        state.tag = explicit ? type.tag : '?';

        if (type.represent) {
          style = state.styleMap[type.tag] || type.defaultStyle;

          if (_toString$2.call(type.represent) === '[object Function]') {
            _result = type.represent(object, style);
          } else if (_hasOwnProperty$3.call(type.represent, style)) {
            _result = type.represent[style](object, style);
          } else {
            throw new exception('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
          }

          state.dump = _result;
        }

        return true;
      }
    }

    return false;
  }

  // Serializes `object` and writes it to global `result`.
  // Returns true on success, or false on invalid object.
  //
  function writeNode(state, level, object, block, compact, iskey) {
    state.tag = null;
    state.dump = object;

    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }

    var type = _toString$2.call(state.dump);

    if (block) {
      block = (state.flowLevel < 0 || state.flowLevel > level);
    }

    var objectOrArray = type === '[object Object]' || type === '[object Array]',
        duplicateIndex,
        duplicate;

    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }

    if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
      compact = false;
    }

    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = '*ref_' + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type === '[object Object]') {
        if (block && (Object.keys(state.dump).length !== 0)) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = '&ref_' + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
          }
        }
      } else if (type === '[object Array]') {
        var arrayLevel = (state.noArrayIndent) ? level - 1 : level;
        if (block && (state.dump.length !== 0)) {
          writeBlockSequence(state, arrayLevel, state.dump, compact);
          if (duplicate) {
            state.dump = '&ref_' + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, arrayLevel, state.dump);
          if (duplicate) {
            state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
          }
        }
      } else if (type === '[object String]') {
        if (state.tag !== '?') {
          writeScalar(state, state.dump, level, iskey);
        }
      } else {
        if (state.skipInvalid) return false;
        throw new exception('unacceptable kind of an object to dump ' + type);
      }

      if (state.tag !== null && state.tag !== '?') {
        state.dump = '!<' + state.tag + '> ' + state.dump;
      }
    }

    return true;
  }

  function getDuplicateReferences(object, state) {
    var objects = [],
        duplicatesIndexes = [],
        index,
        length;

    inspectNode(object, objects, duplicatesIndexes);

    for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }

  function inspectNode(object, objects, duplicatesIndexes) {
    var objectKeyList,
        index,
        length;

    if (object !== null && typeof object === 'object') {
      index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);

        if (Array.isArray(object)) {
          for (index = 0, length = object.length; index < length; index += 1) {
            inspectNode(object[index], objects, duplicatesIndexes);
          }
        } else {
          objectKeyList = Object.keys(object);

          for (index = 0, length = objectKeyList.length; index < length; index += 1) {
            inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }

  function dump(input, options) {
    options = options || {};

    var state = new State$1(options);

    if (!state.noRefs) getDuplicateReferences(input, state);

    if (writeNode(state, 0, input, true, true)) return state.dump + '\n';

    return '';
  }

  function safeDump(input, options) {
    return dump(input, common.extend({ schema: default_safe }, options));
  }

  var dump_1     = dump;
  var safeDump_1 = safeDump;

  var dumper = {
  	dump: dump_1,
  	safeDump: safeDump_1
  };

  function deprecated(name) {
    return function () {
      throw new Error('Function ' + name + ' is deprecated and cannot be used.');
    };
  }


  var Type$1                = type;
  var Schema$1              = schema;
  var FAILSAFE_SCHEMA     = failsafe;
  var JSON_SCHEMA         = json;
  var CORE_SCHEMA         = core;
  var DEFAULT_SAFE_SCHEMA = default_safe;
  var DEFAULT_FULL_SCHEMA = default_full;
  var load$1                = loader.load;
  var loadAll$1             = loader.loadAll;
  var safeLoad$1            = loader.safeLoad;
  var safeLoadAll$1         = loader.safeLoadAll;
  var dump$1                = dumper.dump;
  var safeDump$1            = dumper.safeDump;
  var YAMLException$1       = exception;

  // Deprecated schema names from JS-YAML 2.0.x
  var MINIMAL_SCHEMA = failsafe;
  var SAFE_SCHEMA    = default_safe;
  var DEFAULT_SCHEMA = default_full;

  // Deprecated functions from JS-YAML 1.x.x
  var scan           = deprecated('scan');
  var parse          = deprecated('parse');
  var compose        = deprecated('compose');
  var addConstructor = deprecated('addConstructor');

  var jsYaml = {
  	Type: Type$1,
  	Schema: Schema$1,
  	FAILSAFE_SCHEMA: FAILSAFE_SCHEMA,
  	JSON_SCHEMA: JSON_SCHEMA,
  	CORE_SCHEMA: CORE_SCHEMA,
  	DEFAULT_SAFE_SCHEMA: DEFAULT_SAFE_SCHEMA,
  	DEFAULT_FULL_SCHEMA: DEFAULT_FULL_SCHEMA,
  	load: load$1,
  	loadAll: loadAll$1,
  	safeLoad: safeLoad$1,
  	safeLoadAll: safeLoadAll$1,
  	dump: dump$1,
  	safeDump: safeDump$1,
  	YAMLException: YAMLException$1,
  	MINIMAL_SCHEMA: MINIMAL_SCHEMA,
  	SAFE_SCHEMA: SAFE_SCHEMA,
  	DEFAULT_SCHEMA: DEFAULT_SCHEMA,
  	scan: scan,
  	parse: parse,
  	compose: compose,
  	addConstructor: addConstructor
  };

  var jsYaml$1 = jsYaml;

  var yaml_ = /*#__PURE__*/Object.freeze({
    default: jsYaml$1,
    __moduleExports: jsYaml$1
  });

  var options = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  function prepare(options) {
      var opts = Object.assign({
          cwd: process.cwd(),
          deep: true,
          ignore: [],
          dot: false,
          stats: false,
          onlyFiles: true,
          onlyDirectories: false,
          followSymlinkedDirectories: true,
          unique: true,
          markDirectories: false,
          absolute: false,
          nobrace: false,
          brace: true,
          noglobstar: false,
          globstar: true,
          noext: false,
          extension: true,
          nocase: false,
          case: true,
          matchBase: false,
          transform: null
      }, options);
      if (opts.onlyDirectories) {
          opts.onlyFiles = false;
      }
      opts.brace = !opts.nobrace;
      opts.globstar = !opts.noglobstar;
      opts.extension = !opts.noext;
      opts.case = !opts.nocase;
      if (options) {
          opts.brace = ('brace' in options ? options.brace : opts.brace);
          opts.globstar = ('globstar' in options ? options.globstar : opts.globstar);
          opts.extension = ('extension' in options ? options.extension : opts.extension);
          opts.case = ('case' in options ? options.case : opts.case);
      }
      return opts;
  }
  exports.prepare = prepare;
  });

  unwrapExports(options);
  var options_1 = options.prepare;

  /*!
   * is-extglob <https://github.com/jonschlinkert/is-extglob>
   *
   * Copyright (c) 2014-2016, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtglob = function isExtglob(str) {
    if (typeof str !== 'string' || str === '') {
      return false;
    }

    var match;
    while ((match = /(\\).|([@?!+*]\(.*\))/g.exec(str))) {
      if (match[2]) return true;
      str = str.slice(match.index + match[0].length);
    }

    return false;
  };

  /*!
   * is-glob <https://github.com/jonschlinkert/is-glob>
   *
   * Copyright (c) 2014-2016, Jon Schlinkert.
   * Licensed under the MIT License.
   */



  var isGlob = function isGlob(str) {
    if (typeof str !== 'string' || str === '') {
      return false;
    }

    if (isExtglob(str)) return true;

    var regex = /(\\).|([*?]|\[.*\]|\{.*\}|\(.*\|.*\)|^!)/;
    var match;

    while ((match = regex.exec(str))) {
      if (match[2]) return true;
      str = str.slice(match.index + match[0].length);
    }
    return false;
  };

  var inspect = util.inspect;

  function assertPath(path$$1) {
    if (typeof path$$1 !== 'string') {
      throw new TypeError('Path must be a string. Received ' + inspect(path$$1));
    }
  }

  function posix(path$$1) {
    assertPath(path$$1);
    if (path$$1.length === 0)
      return '.';
    var code = path$$1.charCodeAt(0);
    var hasRoot = (code === 47/*/*/);
    var end = -1;
    var matchedSlash = true;
    for (var i = path$$1.length - 1; i >= 1; --i) {
      code = path$$1.charCodeAt(i);
      if (code === 47/*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1)
      return hasRoot ? '/' : '.';
    if (hasRoot && end === 1)
      return '//';
    return path$$1.slice(0, end);
  }

  function win32(path$$1) {
    assertPath(path$$1);
    var len = path$$1.length;
    if (len === 0)
      return '.';
    var rootEnd = -1;
    var end = -1;
    var matchedSlash = true;
    var offset = 0;
    var code = path$$1.charCodeAt(0);

    // Try to match a root
    if (len > 1) {
      if (code === 47/*/*/ || code === 92/*\*/) {
        // Possible UNC root

        rootEnd = offset = 1;

        code = path$$1.charCodeAt(1);
        if (code === 47/*/*/ || code === 92/*\*/) {
          // Matched double path separator at beginning
          var j = 2;
          var last = j;
          // Match 1 or more non-path separators
          for (; j < len; ++j) {
            code = path$$1.charCodeAt(j);
            if (code === 47/*/*/ || code === 92/*\*/)
              break;
          }
          if (j < len && j !== last) {
            // Matched!
            last = j;
            // Match 1 or more path separators
            for (; j < len; ++j) {
              code = path$$1.charCodeAt(j);
              if (code !== 47/*/*/ && code !== 92/*\*/)
                break;
            }
            if (j < len && j !== last) {
              // Matched!
              last = j;
              // Match 1 or more non-path separators
              for (; j < len; ++j) {
                code = path$$1.charCodeAt(j);
                if (code === 47/*/*/ || code === 92/*\*/)
                  break;
              }
              if (j === len) {
                // We matched a UNC root only
                return path$$1;
              }
              if (j !== last) {
                // We matched a UNC root with leftovers

                // Offset by 1 to include the separator after the UNC root to
                // treat it as a "normal root" on top of a (UNC) root
                rootEnd = offset = j + 1;
              }
            }
          }
        }
      } else if ((code >= 65/*A*/ && code <= 90/*Z*/) ||
                 (code >= 97/*a*/ && code <= 122/*z*/)) {
        // Possible device root

        code = path$$1.charCodeAt(1);
        if (path$$1.charCodeAt(1) === 58/*:*/) {
          rootEnd = offset = 2;
          if (len > 2) {
            code = path$$1.charCodeAt(2);
            if (code === 47/*/*/ || code === 92/*\*/)
              rootEnd = offset = 3;
          }
        }
      }
    } else if (code === 47/*/*/ || code === 92/*\*/) {
      return path$$1[0];
    }

    for (var i = len - 1; i >= offset; --i) {
      code = path$$1.charCodeAt(i);
      if (code === 47/*/*/ || code === 92/*\*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) {
      if (rootEnd === -1)
        return '.';
      else
        end = rootEnd;
    }
    return path$$1.slice(0, end);
  }

  var pathDirname = process.platform === 'win32' ? win32 : posix;
  var posix_1 = posix;
  var win32_1 = win32;
  pathDirname.posix = posix_1;
  pathDirname.win32 = win32_1;

  var isWin32 = os.platform() === 'win32';

  var globParent = function globParent(str) {
  	// flip windows path separators
  	if (isWin32 && str.indexOf('/') < 0) str = str.split('\\').join('/');

  	// special case for strings ending in enclosure containing path separator
  	if (/[\{\[].*[\/]*.*[\}\]]$/.test(str)) str += '/';

  	// preserves full path in case of trailing path separator
  	str += 'a';

  	// remove path parts that are globby
  	do {str = pathDirname.posix(str);}
  	while (isGlob(str) || /(^|[^\\])([\{\[]|\([^\)]+$)/.test(str));

  	// remove escape chars and return result
  	return str.replace(/\\([\*\?\|\[\]\(\)\{\}])/g, '$1');
  };

  /*!
   * is-extglob <https://github.com/jonschlinkert/is-extglob>
   *
   * Copyright (c) 2014-2016, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtglob$1 = function isExtglob(str) {
    if (typeof str !== 'string' || str === '') {
      return false;
    }

    var match;
    while ((match = /(\\).|([@?!+*]\(.*\))/g.exec(str))) {
      if (match[2]) return true;
      str = str.slice(match.index + match[0].length);
    }

    return false;
  };

  /*!
   * is-glob <https://github.com/jonschlinkert/is-glob>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */


  var chars = { '{': '}', '(': ')', '[': ']'};

  var isGlob$1 = function isGlob(str, options) {
    if (typeof str !== 'string' || str === '') {
      return false;
    }

    if (isExtglob$1(str)) {
      return true;
    }

    var regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    var match;

    // optionally relax regex
    if (options && options.strict === false) {
      regex = /\\(.)|(^!|[*?{}()[\]]|\(\?)/;
    }

    while ((match = regex.exec(str))) {
      if (match[2]) return true;
      var idx = match.index + match[0].length;

      // if an open bracket/brace/paren is escaped,
      // set the index to the next closing character
      var open = match[1];
      var close = open ? chars[open] : null;
      if (open && close) {
        var n = str.indexOf(close, idx);
        if (n !== -1) {
          idx = n + 1;
        }
      }

      str = str.slice(idx);
    }
    return false;
  };

  var types = {
    ROOT       : 0,
    GROUP      : 1,
    POSITION   : 2,
    SET        : 3,
    RANGE      : 4,
    REPETITION : 5,
    REFERENCE  : 6,
    CHAR       : 7,
  };

  var INTS = function() {
   return [{ type: types.RANGE , from: 48, to: 57 }];
  };

  var WORDS = function() {
   return [
      { type: types.CHAR, value: 95 },
      { type: types.RANGE, from: 97, to: 122 },
      { type: types.RANGE, from: 65, to: 90 }
    ].concat(INTS());
  };

  var WHITESPACE = function() {
   return [
      { type: types.CHAR, value: 9 },
      { type: types.CHAR, value: 10 },
      { type: types.CHAR, value: 11 },
      { type: types.CHAR, value: 12 },
      { type: types.CHAR, value: 13 },
      { type: types.CHAR, value: 32 },
      { type: types.CHAR, value: 160 },
      { type: types.CHAR, value: 5760 },
      { type: types.CHAR, value: 6158 },
      { type: types.CHAR, value: 8192 },
      { type: types.CHAR, value: 8193 },
      { type: types.CHAR, value: 8194 },
      { type: types.CHAR, value: 8195 },
      { type: types.CHAR, value: 8196 },
      { type: types.CHAR, value: 8197 },
      { type: types.CHAR, value: 8198 },
      { type: types.CHAR, value: 8199 },
      { type: types.CHAR, value: 8200 },
      { type: types.CHAR, value: 8201 },
      { type: types.CHAR, value: 8202 },
      { type: types.CHAR, value: 8232 },
      { type: types.CHAR, value: 8233 },
      { type: types.CHAR, value: 8239 },
      { type: types.CHAR, value: 8287 },
      { type: types.CHAR, value: 12288 },
      { type: types.CHAR, value: 65279 }
    ];
  };

  var NOTANYCHAR = function() {
    return [
      { type: types.CHAR, value: 10 },
      { type: types.CHAR, value: 13 },
      { type: types.CHAR, value: 8232 },
      { type: types.CHAR, value: 8233 },
    ];
  };

  // Predefined class objects.
  var words = function() {
    return { type: types.SET, set: WORDS(), not: false };
  };

  var notWords = function() {
    return { type: types.SET, set: WORDS(), not: true };
  };

  var ints = function() {
    return { type: types.SET, set: INTS(), not: false };
  };

  var notInts = function() {
    return { type: types.SET, set: INTS(), not: true };
  };

  var whitespace = function() {
    return { type: types.SET, set: WHITESPACE(), not: false };
  };

  var notWhitespace = function() {
    return { type: types.SET, set: WHITESPACE(), not: true };
  };

  var anyChar = function() {
    return { type: types.SET, set: NOTANYCHAR(), not: true };
  };

  var sets = {
  	words: words,
  	notWords: notWords,
  	ints: ints,
  	notInts: notInts,
  	whitespace: whitespace,
  	notWhitespace: notWhitespace,
  	anyChar: anyChar
  };

  var util$1 = createCommonjsModule(function (module, exports) {
  // All of these are private and only used by randexp.
  // It's assumed that they will always be called with the correct input.

  var CTRL = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^ ?';
  var SLSH = { '0': 0, 't': 9, 'n': 10, 'v': 11, 'f': 12, 'r': 13 };

  /**
   * Finds character representations in str and convert all to
   * their respective characters
   *
   * @param {String} str
   * @return {String}
   */
  exports.strToChars = function(str) {
    /* jshint maxlen: false */
    var chars_regex = /(\[\\b\])|(\\)?\\(?:u([A-F0-9]{4})|x([A-F0-9]{2})|(0?[0-7]{2})|c([@A-Z\[\\\]\^?])|([0tnvfr]))/g;
    str = str.replace(chars_regex, function(s, b, lbs, a16, b16, c8, dctrl, eslsh) {
      if (lbs) {
        return s;
      }

      var code = b     ? 8 :
                 a16   ? parseInt(a16, 16) :
                 b16   ? parseInt(b16, 16) :
                 c8    ? parseInt(c8,   8) :
                 dctrl ? CTRL.indexOf(dctrl) :
                 SLSH[eslsh];

      var c = String.fromCharCode(code);

      // Escape special regex characters.
      if (/[\[\]{}\^$.|?*+()]/.test(c)) {
        c = '\\' + c;
      }

      return c;
    });

    return str;
  };


  /**
   * turns class into tokens
   * reads str until it encounters a ] not preceeded by a \
   *
   * @param {String} str
   * @param {String} regexpStr
   * @return {Array.<Array.<Object>, Number>}
   */
  exports.tokenizeClass = function(str, regexpStr) {
    /* jshint maxlen: false */
    var tokens = [];
    var regexp = /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(?:\\)?([^\]]))|(\])|(?:\\)?(.)/g;
    var rs, c;


    while ((rs = regexp.exec(str)) != null) {
      if (rs[1]) {
        tokens.push(sets.words());

      } else if (rs[2]) {
        tokens.push(sets.ints());

      } else if (rs[3]) {
        tokens.push(sets.whitespace());

      } else if (rs[4]) {
        tokens.push(sets.notWords());

      } else if (rs[5]) {
        tokens.push(sets.notInts());

      } else if (rs[6]) {
        tokens.push(sets.notWhitespace());

      } else if (rs[7]) {
        tokens.push({
          type: types.RANGE,
          from: (rs[8] || rs[9]).charCodeAt(0),
            to: rs[10].charCodeAt(0),
        });

      } else if (c = rs[12]) {
        tokens.push({
          type: types.CHAR,
          value: c.charCodeAt(0),
        });

      } else {
        return [tokens, regexp.lastIndex];
      }
    }

    exports.error(regexpStr, 'Unterminated character class');
  };


  /**
   * Shortcut to throw errors.
   *
   * @param {String} regexp
   * @param {String} msg
   */
  exports.error = function(regexp, msg) {
    throw new SyntaxError('Invalid regular expression: /' + regexp + '/: ' + msg);
  };
  });
  var util_1 = util$1.strToChars;
  var util_2 = util$1.tokenizeClass;
  var util_3 = util$1.error;

  var wordBoundary = function() {
    return { type: types.POSITION, value: 'b' };
  };

  var nonWordBoundary = function() {
    return { type: types.POSITION, value: 'B' };
  };

  var begin = function() {
    return { type: types.POSITION, value: '^' };
  };

  var end = function() {
    return { type: types.POSITION, value: '$' };
  };

  var positions = {
  	wordBoundary: wordBoundary,
  	nonWordBoundary: nonWordBoundary,
  	begin: begin,
  	end: end
  };

  var lib = function(regexpStr) {
    var i = 0, l, c,
        start = { type: types.ROOT, stack: []},

        // Keep track of last clause/group and stack.
        lastGroup = start,
        last = start.stack,
        groupStack = [];


    var repeatErr = function(i) {
      util$1.error(regexpStr, 'Nothing to repeat at column ' + (i - 1));
    };

    // Decode a few escaped characters.
    var str = util$1.strToChars(regexpStr);
    l = str.length;

    // Iterate through each character in string.
    while (i < l) {
      c = str[i++];

      switch (c) {
        // Handle escaped characters, inclues a few sets.
        case '\\':
          c = str[i++];

          switch (c) {
            case 'b':
              last.push(positions.wordBoundary());
              break;

            case 'B':
              last.push(positions.nonWordBoundary());
              break;

            case 'w':
              last.push(sets.words());
              break;

            case 'W':
              last.push(sets.notWords());
              break;

            case 'd':
              last.push(sets.ints());
              break;

            case 'D':
              last.push(sets.notInts());
              break;

            case 's':
              last.push(sets.whitespace());
              break;

            case 'S':
              last.push(sets.notWhitespace());
              break;

            default:
              // Check if c is integer.
              // In which case it's a reference.
              if (/\d/.test(c)) {
                last.push({ type: types.REFERENCE, value: parseInt(c, 10) });

              // Escaped character.
              } else {
                last.push({ type: types.CHAR, value: c.charCodeAt(0) });
              }
          }

          break;


        // Positionals.
        case '^':
            last.push(positions.begin());
          break;

        case '$':
            last.push(positions.end());
          break;


        // Handle custom sets.
        case '[':
          // Check if this class is 'anti' i.e. [^abc].
          var not;
          if (str[i] === '^') {
            not = true;
            i++;
          } else {
            not = false;
          }

          // Get all the characters in class.
          var classTokens = util$1.tokenizeClass(str.slice(i), regexpStr);

          // Increase index by length of class.
          i += classTokens[1];
          last.push({
            type: types.SET,
            set: classTokens[0],
            not: not,
          });

          break;


        // Class of any character except \n.
        case '.':
          last.push(sets.anyChar());
          break;


        // Push group onto stack.
        case '(':
          // Create group.
          var group = {
            type: types.GROUP,
            stack: [],
            remember: true,
          };

          c = str[i];

          // If if this is a special kind of group.
          if (c === '?') {
            c = str[i + 1];
            i += 2;

            // Match if followed by.
            if (c === '=') {
              group.followedBy = true;

            // Match if not followed by.
            } else if (c === '!') {
              group.notFollowedBy = true;

            } else if (c !== ':') {
              util$1.error(regexpStr,
                'Invalid group, character \'' + c +
                '\' after \'?\' at column ' + (i - 1));
            }

            group.remember = false;
          }

          // Insert subgroup into current group stack.
          last.push(group);

          // Remember the current group for when the group closes.
          groupStack.push(lastGroup);

          // Make this new group the current group.
          lastGroup = group;
          last = group.stack;
          break;


        // Pop group out of stack.
        case ')':
          if (groupStack.length === 0) {
            util$1.error(regexpStr, 'Unmatched ) at column ' + (i - 1));
          }
          lastGroup = groupStack.pop();

          // Check if this group has a PIPE.
          // To get back the correct last stack.
          last = lastGroup.options ?
            lastGroup.options[lastGroup.options.length - 1] : lastGroup.stack;
          break;


        // Use pipe character to give more choices.
        case '|':
          // Create array where options are if this is the first PIPE
          // in this clause.
          if (!lastGroup.options) {
            lastGroup.options = [lastGroup.stack];
            delete lastGroup.stack;
          }

          // Create a new stack and add to options for rest of clause.
          var stack = [];
          lastGroup.options.push(stack);
          last = stack;
          break;


        // Repetition.
        // For every repetition, remove last element from last stack
        // then insert back a RANGE object.
        // This design is chosen because there could be more than
        // one repetition symbols in a regex i.e. `a?+{2,3}`.
        case '{':
          var rs = /^(\d+)(,(\d+)?)?\}/.exec(str.slice(i)), min, max;
          if (rs !== null) {
            if (last.length === 0) {
              repeatErr(i);
            }
            min = parseInt(rs[1], 10);
            max = rs[2] ? rs[3] ? parseInt(rs[3], 10) : Infinity : min;
            i += rs[0].length;

            last.push({
              type: types.REPETITION,
              min: min,
              max: max,
              value: last.pop(),
            });
          } else {
            last.push({
              type: types.CHAR,
              value: 123,
            });
          }
          break;

        case '?':
          if (last.length === 0) {
            repeatErr(i);
          }
          last.push({
            type: types.REPETITION,
            min: 0,
            max: 1,
            value: last.pop(),
          });
          break;

        case '+':
          if (last.length === 0) {
            repeatErr(i);
          }
          last.push({
            type: types.REPETITION,
            min: 1,
            max: Infinity,
            value: last.pop(),
          });
          break;

        case '*':
          if (last.length === 0) {
            repeatErr(i);
          }
          last.push({
            type: types.REPETITION,
            min: 0,
            max: Infinity,
            value: last.pop(),
          });
          break;


        // Default is a character that is not `\[](){}?+*^$`.
        default:
          last.push({
            type: types.CHAR,
            value: c.charCodeAt(0),
          });
      }

    }

    // Check if any groups have not been closed.
    if (groupStack.length !== 0) {
      util$1.error(regexpStr, 'Unterminated group');
    }

    return start;
  };

  var types_1$1 = types;
  lib.types = types_1$1;

  var types$1 = lib.types;

  var safeRegex = function (re, opts) {
      if (!opts) opts = {};
      var replimit = opts.limit === undefined ? 25 : opts.limit;
      
      if (isRegExp$1(re)) re = re.source;
      else if (typeof re !== 'string') re = String(re);
      
      try { re = lib(re); }
      catch (err) { return false }
      
      var reps = 0;
      return (function walk (node, starHeight) {
          if (node.type === types$1.REPETITION) {
              starHeight ++;
              reps ++;
              if (starHeight > 1) return false;
              if (reps > replimit) return false;
          }
          
          if (node.options) {
              for (var i = 0, len = node.options.length; i < len; i++) {
                  var ok = walk({ stack: node.options[i] }, starHeight);
                  if (!ok) return false;
              }
          }
          var stack = node.stack || (node.value && node.value.stack);
          if (!stack) return true;
          
          for (var i = 0; i < stack.length; i++) {
              var ok = walk(stack[i], starHeight);
              if (!ok) return false;
          }
          
          return true;
      })(re, 0);
  };

  function isRegExp$1 (x) {
      return {}.toString.call(x) === '[object RegExp]';
  }

  /*!
   * isobject <https://github.com/jonschlinkert/isobject>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var isobject = function isObject(val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false;
  };

  var toString = Object.prototype.toString;

  var kindOf = function kindOf(val) {
    if (val === void 0) return 'undefined';
    if (val === null) return 'null';

    var type = typeof val;
    if (type === 'boolean') return 'boolean';
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'symbol') return 'symbol';
    if (type === 'function') {
      return isGeneratorFn(val) ? 'generatorfunction' : 'function';
    }

    if (isArray(val)) return 'array';
    if (isBuffer(val)) return 'buffer';
    if (isArguments(val)) return 'arguments';
    if (isDate(val)) return 'date';
    if (isError(val)) return 'error';
    if (isRegexp(val)) return 'regexp';

    switch (ctorName(val)) {
      case 'Symbol': return 'symbol';
      case 'Promise': return 'promise';

      // Set, Map, WeakSet, WeakMap
      case 'WeakMap': return 'weakmap';
      case 'WeakSet': return 'weakset';
      case 'Map': return 'map';
      case 'Set': return 'set';

      // 8-bit typed arrays
      case 'Int8Array': return 'int8array';
      case 'Uint8Array': return 'uint8array';
      case 'Uint8ClampedArray': return 'uint8clampedarray';

      // 16-bit typed arrays
      case 'Int16Array': return 'int16array';
      case 'Uint16Array': return 'uint16array';

      // 32-bit typed arrays
      case 'Int32Array': return 'int32array';
      case 'Uint32Array': return 'uint32array';
      case 'Float32Array': return 'float32array';
      case 'Float64Array': return 'float64array';
    }

    if (isGeneratorObj(val)) {
      return 'generator';
    }

    // Non-plain objects
    type = toString.call(val);
    switch (type) {
      case '[object Object]': return 'object';
      // iterators
      case '[object Map Iterator]': return 'mapiterator';
      case '[object Set Iterator]': return 'setiterator';
      case '[object String Iterator]': return 'stringiterator';
      case '[object Array Iterator]': return 'arrayiterator';
    }

    // other
    return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
  };

  function ctorName(val) {
    return val.constructor ? val.constructor.name : null;
  }

  function isArray(val) {
    if (Array.isArray) return Array.isArray(val);
    return val instanceof Array;
  }

  function isError(val) {
    return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
  }

  function isDate(val) {
    if (val instanceof Date) return true;
    return typeof val.toDateString === 'function'
      && typeof val.getDate === 'function'
      && typeof val.setDate === 'function';
  }

  function isRegexp(val) {
    if (val instanceof RegExp) return true;
    return typeof val.flags === 'string'
      && typeof val.ignoreCase === 'boolean'
      && typeof val.multiline === 'boolean'
      && typeof val.global === 'boolean';
  }

  function isGeneratorFn(name, val) {
    return ctorName(name) === 'GeneratorFunction';
  }

  function isGeneratorObj(val) {
    return typeof val.throw === 'function'
      && typeof val.return === 'function'
      && typeof val.next === 'function';
  }

  function isArguments(val) {
    try {
      if (typeof val.length === 'number' && typeof val.callee === 'function') {
        return true;
      }
    } catch (err) {
      if (err.message.indexOf('callee') !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * If you need to support Safari 5-7 (8-10 yr-old browser),
   * take a look at https://github.com/feross/is-buffer
   */

  function isBuffer(val) {
    if (val.constructor && typeof val.constructor.isBuffer === 'function') {
      return val.constructor.isBuffer(val);
    }
    return false;
  }

  var toString$1 = Object.prototype.toString;

  var kindOf$1 = function kindOf(val) {
    if (val === void 0) return 'undefined';
    if (val === null) return 'null';

    var type = typeof val;
    if (type === 'boolean') return 'boolean';
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'symbol') return 'symbol';
    if (type === 'function') {
      return isGeneratorFn$1(val) ? 'generatorfunction' : 'function';
    }

    if (isArray$1(val)) return 'array';
    if (isBuffer$1(val)) return 'buffer';
    if (isArguments$1(val)) return 'arguments';
    if (isDate$1(val)) return 'date';
    if (isError$1(val)) return 'error';
    if (isRegexp$1(val)) return 'regexp';

    switch (ctorName$1(val)) {
      case 'Symbol': return 'symbol';
      case 'Promise': return 'promise';

      // Set, Map, WeakSet, WeakMap
      case 'WeakMap': return 'weakmap';
      case 'WeakSet': return 'weakset';
      case 'Map': return 'map';
      case 'Set': return 'set';

      // 8-bit typed arrays
      case 'Int8Array': return 'int8array';
      case 'Uint8Array': return 'uint8array';
      case 'Uint8ClampedArray': return 'uint8clampedarray';

      // 16-bit typed arrays
      case 'Int16Array': return 'int16array';
      case 'Uint16Array': return 'uint16array';

      // 32-bit typed arrays
      case 'Int32Array': return 'int32array';
      case 'Uint32Array': return 'uint32array';
      case 'Float32Array': return 'float32array';
      case 'Float64Array': return 'float64array';
    }

    if (isGeneratorObj$1(val)) {
      return 'generator';
    }

    // Non-plain objects
    type = toString$1.call(val);
    switch (type) {
      case '[object Object]': return 'object';
      // iterators
      case '[object Map Iterator]': return 'mapiterator';
      case '[object Set Iterator]': return 'setiterator';
      case '[object String Iterator]': return 'stringiterator';
      case '[object Array Iterator]': return 'arrayiterator';
    }

    // other
    return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
  };

  function ctorName$1(val) {
    return val.constructor ? val.constructor.name : null;
  }

  function isArray$1(val) {
    if (Array.isArray) return Array.isArray(val);
    return val instanceof Array;
  }

  function isError$1(val) {
    return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
  }

  function isDate$1(val) {
    if (val instanceof Date) return true;
    return typeof val.toDateString === 'function'
      && typeof val.getDate === 'function'
      && typeof val.setDate === 'function';
  }

  function isRegexp$1(val) {
    if (val instanceof RegExp) return true;
    return typeof val.flags === 'string'
      && typeof val.ignoreCase === 'boolean'
      && typeof val.multiline === 'boolean'
      && typeof val.global === 'boolean';
  }

  function isGeneratorFn$1(name, val) {
    return ctorName$1(name) === 'GeneratorFunction';
  }

  function isGeneratorObj$1(val) {
    return typeof val.throw === 'function'
      && typeof val.return === 'function'
      && typeof val.next === 'function';
  }

  function isArguments$1(val) {
    try {
      if (typeof val.length === 'number' && typeof val.callee === 'function') {
        return true;
      }
    } catch (err) {
      if (err.message.indexOf('callee') !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * If you need to support Safari 5-7 (8-10 yr-old browser),
   * take a look at https://github.com/feross/is-buffer
   */

  function isBuffer$1(val) {
    if (val.constructor && typeof val.constructor.isBuffer === 'function') {
      return val.constructor.isBuffer(val);
    }
    return false;
  }

  // accessor descriptor properties
  var accessor = {
    get: 'function',
    set: 'function',
    configurable: 'boolean',
    enumerable: 'boolean'
  };

  function isAccessorDescriptor(obj, prop) {
    if (typeof prop === 'string') {
      var val = Object.getOwnPropertyDescriptor(obj, prop);
      return typeof val !== 'undefined';
    }

    if (kindOf$1(obj) !== 'object') {
      return false;
    }

    if (has(obj, 'value') || has(obj, 'writable')) {
      return false;
    }

    if (!has(obj, 'get') || typeof obj.get !== 'function') {
      return false;
    }

    // tldr: it's valid to have "set" be undefined
    // "set" might be undefined if `Object.getOwnPropertyDescriptor`
    // was used to get the value, and only `get` was defined by the user
    if (has(obj, 'set') && typeof obj[key] !== 'function' && typeof obj[key] !== 'undefined') {
      return false;
    }

    for (var key in obj) {
      if (!accessor.hasOwnProperty(key)) {
        continue;
      }

      if (kindOf$1(obj[key]) === accessor[key]) {
        continue;
      }

      if (typeof obj[key] !== 'undefined') {
        return false;
      }
    }
    return true;
  }

  function has(obj, key) {
    return {}.hasOwnProperty.call(obj, key);
  }

  /**
   * Expose `isAccessorDescriptor`
   */

  var isAccessorDescriptor_1 = isAccessorDescriptor;

  var toString$2 = Object.prototype.toString;

  var kindOf$2 = function kindOf(val) {
    if (val === void 0) return 'undefined';
    if (val === null) return 'null';

    var type = typeof val;
    if (type === 'boolean') return 'boolean';
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'symbol') return 'symbol';
    if (type === 'function') {
      return isGeneratorFn$2(val) ? 'generatorfunction' : 'function';
    }

    if (isArray$2(val)) return 'array';
    if (isBuffer$2(val)) return 'buffer';
    if (isArguments$2(val)) return 'arguments';
    if (isDate$2(val)) return 'date';
    if (isError$2(val)) return 'error';
    if (isRegexp$2(val)) return 'regexp';

    switch (ctorName$2(val)) {
      case 'Symbol': return 'symbol';
      case 'Promise': return 'promise';

      // Set, Map, WeakSet, WeakMap
      case 'WeakMap': return 'weakmap';
      case 'WeakSet': return 'weakset';
      case 'Map': return 'map';
      case 'Set': return 'set';

      // 8-bit typed arrays
      case 'Int8Array': return 'int8array';
      case 'Uint8Array': return 'uint8array';
      case 'Uint8ClampedArray': return 'uint8clampedarray';

      // 16-bit typed arrays
      case 'Int16Array': return 'int16array';
      case 'Uint16Array': return 'uint16array';

      // 32-bit typed arrays
      case 'Int32Array': return 'int32array';
      case 'Uint32Array': return 'uint32array';
      case 'Float32Array': return 'float32array';
      case 'Float64Array': return 'float64array';
    }

    if (isGeneratorObj$2(val)) {
      return 'generator';
    }

    // Non-plain objects
    type = toString$2.call(val);
    switch (type) {
      case '[object Object]': return 'object';
      // iterators
      case '[object Map Iterator]': return 'mapiterator';
      case '[object Set Iterator]': return 'setiterator';
      case '[object String Iterator]': return 'stringiterator';
      case '[object Array Iterator]': return 'arrayiterator';
    }

    // other
    return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
  };

  function ctorName$2(val) {
    return val.constructor ? val.constructor.name : null;
  }

  function isArray$2(val) {
    if (Array.isArray) return Array.isArray(val);
    return val instanceof Array;
  }

  function isError$2(val) {
    return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
  }

  function isDate$2(val) {
    if (val instanceof Date) return true;
    return typeof val.toDateString === 'function'
      && typeof val.getDate === 'function'
      && typeof val.setDate === 'function';
  }

  function isRegexp$2(val) {
    if (val instanceof RegExp) return true;
    return typeof val.flags === 'string'
      && typeof val.ignoreCase === 'boolean'
      && typeof val.multiline === 'boolean'
      && typeof val.global === 'boolean';
  }

  function isGeneratorFn$2(name, val) {
    return ctorName$2(name) === 'GeneratorFunction';
  }

  function isGeneratorObj$2(val) {
    return typeof val.throw === 'function'
      && typeof val.return === 'function'
      && typeof val.next === 'function';
  }

  function isArguments$2(val) {
    try {
      if (typeof val.length === 'number' && typeof val.callee === 'function') {
        return true;
      }
    } catch (err) {
      if (err.message.indexOf('callee') !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * If you need to support Safari 5-7 (8-10 yr-old browser),
   * take a look at https://github.com/feross/is-buffer
   */

  function isBuffer$2(val) {
    if (val.constructor && typeof val.constructor.isBuffer === 'function') {
      return val.constructor.isBuffer(val);
    }
    return false;
  }

  var isDataDescriptor = function isDataDescriptor(obj, prop) {
    // data descriptor properties
    var data = {
      configurable: 'boolean',
      enumerable: 'boolean',
      writable: 'boolean'
    };

    if (kindOf$2(obj) !== 'object') {
      return false;
    }

    if (typeof prop === 'string') {
      var val = Object.getOwnPropertyDescriptor(obj, prop);
      return typeof val !== 'undefined';
    }

    if (!('value' in obj) && !('writable' in obj)) {
      return false;
    }

    for (var key in obj) {
      if (key === 'value') continue;

      if (!data.hasOwnProperty(key)) {
        continue;
      }

      if (kindOf$2(obj[key]) === data[key]) {
        continue;
      }

      if (typeof obj[key] !== 'undefined') {
        return false;
      }
    }
    return true;
  };

  var isDescriptor = function isDescriptor(obj, key) {
    if (kindOf(obj) !== 'object') {
      return false;
    }
    if ('get' in obj) {
      return isAccessorDescriptor_1(obj, key);
    }
    return isDataDescriptor(obj, key);
  };

  var define = (typeof Reflect !== 'undefined' && Reflect.defineProperty)
    ? Reflect.defineProperty
    : Object.defineProperty;

  var defineProperty = function defineProperty(obj, key, val) {
    if (!isobject(obj) && typeof obj !== 'function' && !Array.isArray(obj)) {
      throw new TypeError('expected an object, function, or array');
    }

    if (typeof key !== 'string') {
      throw new TypeError('expected "key" to be a string');
    }

    if (isDescriptor(val)) {
      define(obj, key, val);
      return obj;
    }

    define(obj, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });

    return obj;
  };

  function isObjectObject(o) {
    return isobject(o) === true
      && Object.prototype.toString.call(o) === '[object Object]';
  }

  var isPlainObject = function isPlainObject(o) {
    var ctor,prot;

    if (isObjectObject(o) === false) return false;

    // If has modified constructor
    ctor = o.constructor;
    if (typeof ctor !== 'function') return false;

    // If has modified prototype
    prot = ctor.prototype;
    if (isObjectObject(prot) === false) return false;

    // If constructor does not have an Object-specific method
    if (prot.hasOwnProperty('isPrototypeOf') === false) {
      return false;
    }

    // Most likely a plain Object
    return true;
  };

  var isExtendable = function isExtendable(val) {
    return isPlainObject(val) || typeof val === 'function' || Array.isArray(val);
  };

  /*!
   * assign-symbols <https://github.com/jonschlinkert/assign-symbols>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var assignSymbols = function(receiver, objects) {
    if (receiver === null || typeof receiver === 'undefined') {
      throw new TypeError('expected first argument to be an object.');
    }

    if (typeof objects === 'undefined' || typeof Symbol === 'undefined') {
      return receiver;
    }

    if (typeof Object.getOwnPropertySymbols !== 'function') {
      return receiver;
    }

    var isEnumerable = Object.prototype.propertyIsEnumerable;
    var target = Object(receiver);
    var len = arguments.length, i = 0;

    while (++i < len) {
      var provider = Object(arguments[i]);
      var names = Object.getOwnPropertySymbols(provider);

      for (var j = 0; j < names.length; j++) {
        var key = names[j];

        if (isEnumerable.call(provider, key)) {
          target[key] = provider[key];
        }
      }
    }
    return target;
  };

  var extendShallow = Object.assign || function(obj/*, objects*/) {
    if (obj === null || typeof obj === 'undefined') {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    if (!isObject$1(obj)) {
      obj = {};
    }
    for (var i = 1; i < arguments.length; i++) {
      var val = arguments[i];
      if (isString(val)) {
        val = toObject(val);
      }
      if (isObject$1(val)) {
        assign(obj, val);
        assignSymbols(obj, val);
      }
    }
    return obj;
  };

  function assign(a, b) {
    for (var key in b) {
      if (hasOwn(b, key)) {
        a[key] = b[key];
      }
    }
  }

  function isString(val) {
    return (val && typeof val === 'string');
  }

  function toObject(str) {
    var obj = {};
    for (var i in str) {
      obj[i] = str[i];
    }
    return obj;
  }

  function isObject$1(val) {
    return (val && typeof val === 'object') || isExtendable(val);
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  var isExtendable$1 = function isExtendable(val) {
    return isPlainObject(val) || typeof val === 'function' || Array.isArray(val);
  };

  var extendShallow$1 = Object.assign || function(obj/*, objects*/) {
    if (obj === null || typeof obj === 'undefined') {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    if (!isObject$2(obj)) {
      obj = {};
    }
    for (var i = 1; i < arguments.length; i++) {
      var val = arguments[i];
      if (isString$1(val)) {
        val = toObject$1(val);
      }
      if (isObject$2(val)) {
        assign$1(obj, val);
        assignSymbols(obj, val);
      }
    }
    return obj;
  };

  function assign$1(a, b) {
    for (var key in b) {
      if (hasOwn$1(b, key)) {
        a[key] = b[key];
      }
    }
  }

  function isString$1(val) {
    return (val && typeof val === 'string');
  }

  function toObject$1(str) {
    var obj = {};
    for (var i in str) {
      obj[i] = str[i];
    }
    return obj;
  }

  function isObject$2(val) {
    return (val && typeof val === 'object') || isExtendable$1(val);
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$1(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
   * The main export is a function that takes a `pattern` string and an `options` object.
   *
   * ```js
   & var not = require('regex-not');
   & console.log(not('foo'));
   & //=> /^(?:(?!^(?:foo)$).)*$/
   * ```
   *
   * @param {String} `pattern`
   * @param {Object} `options`
   * @return {RegExp} Converts the given `pattern` to a regex using the specified `options`.
   * @api public
   */

  function toRegex(pattern, options) {
    return new RegExp(toRegex.create(pattern, options));
  }

  /**
   * Create a regex-compatible string from the given `pattern` and `options`.
   *
   * ```js
   & var not = require('regex-not');
   & console.log(not.create('foo'));
   & //=> '^(?:(?!^(?:foo)$).)*$'
   * ```
   * @param {String} `pattern`
   * @param {Object} `options`
   * @return {String}
   * @api public
   */

  toRegex.create = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected a string');
    }

    var opts = extendShallow$1({}, options);
    if (opts.contains === true) {
      opts.strictNegate = false;
    }

    var open = opts.strictOpen !== false ? '^' : '';
    var close = opts.strictClose !== false ? '$' : '';
    var endChar = opts.endChar ? opts.endChar : '+';
    var str = pattern;

    if (opts.strictNegate === false) {
      str = '(?:(?!(?:' + pattern + ')).)' + endChar;
    } else {
      str = '(?:(?!^(?:' + pattern + ')$).)' + endChar;
    }

    var res = open + str + close;
    if (opts.safe === true && safeRegex(res) === false) {
      throw new Error('potentially unsafe regular expression: ' + res);
    }

    return res;
  };

  /**
   * Expose `toRegex`
   */

  var regexNot = toRegex;

  var MAX_LENGTH = 1024 * 64;

  /**
   * Session cache
   */

  var cache = {};

  /**
   * Create a regular expression from the given `pattern` string.
   *
   * @param {String|RegExp} `pattern` Pattern can be a string or regular expression.
   * @param {Object} `options`
   * @return {RegExp}
   * @api public
   */

  var toRegex$1 = function(patterns, options) {
    if (!Array.isArray(patterns)) {
      return makeRe(patterns, options);
    }
    return makeRe(patterns.join('|'), options);
  };

  /**
   * Create a regular expression from the given `pattern` string.
   *
   * @param {String|RegExp} `pattern` Pattern can be a string or regular expression.
   * @param {Object} `options`
   * @return {RegExp}
   * @api public
   */

  function makeRe(pattern, options) {
    if (pattern instanceof RegExp) {
      return pattern;
    }

    if (typeof pattern !== 'string') {
      throw new TypeError('expected a string');
    }

    if (pattern.length > MAX_LENGTH) {
      throw new Error('expected pattern to be less than ' + MAX_LENGTH + ' characters');
    }

    var key = pattern;
    // do this before shallow cloning options, it's a lot faster
    if (!options || (options && options.cache !== false)) {
      key = createKey(pattern, options);

      if (cache.hasOwnProperty(key)) {
        return cache[key];
      }
    }

    var opts = extendShallow({}, options);
    if (opts.contains === true) {
      if (opts.negate === true) {
        opts.strictNegate = false;
      } else {
        opts.strict = false;
      }
    }

    if (opts.strict === false) {
      opts.strictOpen = false;
      opts.strictClose = false;
    }

    var open = opts.strictOpen !== false ? '^' : '';
    var close = opts.strictClose !== false ? '$' : '';
    var flags = opts.flags || '';
    var regex;

    if (opts.nocase === true && !/i/.test(flags)) {
      flags += 'i';
    }

    try {
      if (opts.negate || typeof opts.strictNegate === 'boolean') {
        pattern = regexNot.create(pattern, opts);
      }

      var str = open + '(?:' + pattern + ')' + close;
      regex = new RegExp(str, flags);

      if (opts.safe === true && safeRegex(regex) === false) {
        throw new Error('potentially unsafe regular expression: ' + regex.source);
      }

    } catch (err) {
      if (opts.strictErrors === true || opts.safe === true) {
        err.key = key;
        err.pattern = pattern;
        err.originalOptions = options;
        err.createdOptions = opts;
        throw err;
      }

      try {
        regex = new RegExp('^' + pattern.replace(/(\W)/g, '\\$1') + '$');
      } catch (err) {
        regex = /.^/; //<= match nothing
      }
    }

    if (opts.cache !== false) {
      memoize(regex, key, pattern, opts);
    }
    return regex;
  }

  /**
   * Memoize generated regex. This can result in dramatic speed improvements
   * and simplify debugging by adding options and pattern to the regex. It can be
   * disabled by passing setting `options.cache` to false.
   */

  function memoize(regex, key, pattern, options) {
    defineProperty(regex, 'cached', true);
    defineProperty(regex, 'pattern', pattern);
    defineProperty(regex, 'options', options);
    defineProperty(regex, 'key', key);
    cache[key] = regex;
  }

  /**
   * Create the key to use for memoization. The key is generated
   * by iterating over the options and concatenating key-value pairs
   * to the pattern string.
   */

  function createKey(pattern, options) {
    if (!options) return pattern;
    var key = pattern;
    for (var prop in options) {
      if (options.hasOwnProperty(prop)) {
        key += ';' + prop + '=' + String(options[prop]);
      }
    }
    return key;
  }

  /**
   * Expose `makeRe`
   */

  var makeRe_1 = makeRe;
  toRegex$1.makeRe = makeRe_1;

  var arrayUnique = createCommonjsModule(function (module) {

  module.exports = function unique(arr) {
    if (!Array.isArray(arr)) {
      throw new TypeError('array-unique expects an array.');
    }

    var len = arr.length;
    var i = -1;

    while (i++ < len) {
      var j = i + 1;

      for (; j < arr.length; ++j) {
        if (arr[i] === arr[j]) {
          arr.splice(j--, 1);
        }
      }
    }
    return arr;
  };

  module.exports.immutable = function uniqueImmutable(arr) {
    if (!Array.isArray(arr)) {
      throw new TypeError('array-unique expects an array.');
    }

    var arrLen = arr.length;
    var newArr = new Array(arrLen);

    for (var i = 0; i < arrLen; i++) {
      newArr[i] = arr[i];
    }

    return module.exports(newArr);
  };
  });
  var arrayUnique_1 = arrayUnique.immutable;

  /*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtendable$2 = function isExtendable(val) {
    return typeof val !== 'undefined' && val !== null
      && (typeof val === 'object' || typeof val === 'function');
  };

  var extendShallow$2 = function extend(o/*, objects*/) {
    if (!isExtendable$2(o)) { o = {}; }

    var len = arguments.length;
    for (var i = 1; i < len; i++) {
      var obj = arguments[i];

      if (isExtendable$2(obj)) {
        assign$2(o, obj);
      }
    }
    return o;
  };

  function assign$2(a, b) {
    for (var key in b) {
      if (hasOwn$2(b, key)) {
        a[key] = b[key];
      }
    }
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$2(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  var isExtendable$3 = function isExtendable(val) {
    return isPlainObject(val) || typeof val === 'function' || Array.isArray(val);
  };

  var extendShallow$3 = Object.assign || function(obj/*, objects*/) {
    if (obj === null || typeof obj === 'undefined') {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    if (!isObject$3(obj)) {
      obj = {};
    }
    for (var i = 1; i < arguments.length; i++) {
      var val = arguments[i];
      if (isString$2(val)) {
        val = toObject$2(val);
      }
      if (isObject$3(val)) {
        assign$3(obj, val);
        assignSymbols(obj, val);
      }
    }
    return obj;
  };

  function assign$3(a, b) {
    for (var key in b) {
      if (hasOwn$3(b, key)) {
        a[key] = b[key];
      }
    }
  }

  function isString$2(val) {
    return (val && typeof val === 'string');
  }

  function toObject$2(str) {
    var obj = {};
    for (var i in str) {
      obj[i] = str[i];
    }
    return obj;
  }

  function isObject$3(val) {
    return (val && typeof val === 'object') || isExtendable$3(val);
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$3(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  var splitString = function(str, options, fn) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }

    if (typeof options === 'function') {
      fn = options;
      options = null;
    }

    // allow separator to be defined as a string
    if (typeof options === 'string') {
      options = { sep: options };
    }

    var opts = extendShallow$3({sep: '.'}, options);
    var quotes = opts.quotes || ['"', "'", '`'];
    var brackets;

    if (opts.brackets === true) {
      brackets = {
        '<': '>',
        '(': ')',
        '[': ']',
        '{': '}'
      };
    } else if (opts.brackets) {
      brackets = opts.brackets;
    }

    var tokens = [];
    var stack = [];
    var arr = [''];
    var sep = opts.sep;
    var len = str.length;
    var idx = -1;
    var closeIdx;

    function expected() {
      if (brackets && stack.length) {
        return brackets[stack[stack.length - 1]];
      }
    }

    while (++idx < len) {
      var ch = str[idx];
      var next = str[idx + 1];
      var tok = { val: ch, idx: idx, arr: arr, str: str };
      tokens.push(tok);

      if (ch === '\\') {
        tok.val = keepEscaping(opts, str, idx) === true ? (ch + next) : next;
        tok.escaped = true;
        if (typeof fn === 'function') {
          fn(tok);
        }
        arr[arr.length - 1] += tok.val;
        idx++;
        continue;
      }

      if (brackets && brackets[ch]) {
        stack.push(ch);
        var e = expected();
        var i = idx + 1;

        if (str.indexOf(e, i + 1) !== -1) {
          while (stack.length && i < len) {
            var s = str[++i];
            if (s === '\\') {
              s++;
              continue;
            }

            if (quotes.indexOf(s) !== -1) {
              i = getClosingQuote(str, s, i + 1);
              continue;
            }

            e = expected();
            if (stack.length && str.indexOf(e, i + 1) === -1) {
              break;
            }

            if (brackets[s]) {
              stack.push(s);
              continue;
            }

            if (e === s) {
              stack.pop();
            }
          }
        }

        closeIdx = i;
        if (closeIdx === -1) {
          arr[arr.length - 1] += ch;
          continue;
        }

        ch = str.slice(idx, closeIdx + 1);
        tok.val = ch;
        tok.idx = idx = closeIdx;
      }

      if (quotes.indexOf(ch) !== -1) {
        closeIdx = getClosingQuote(str, ch, idx + 1);
        if (closeIdx === -1) {
          arr[arr.length - 1] += ch;
          continue;
        }

        if (keepQuotes(ch, opts) === true) {
          ch = str.slice(idx, closeIdx + 1);
        } else {
          ch = str.slice(idx + 1, closeIdx);
        }

        tok.val = ch;
        tok.idx = idx = closeIdx;
      }

      if (typeof fn === 'function') {
        fn(tok, tokens);
        ch = tok.val;
        idx = tok.idx;
      }

      if (tok.val === sep && tok.split !== false) {
        arr.push('');
        continue;
      }

      arr[arr.length - 1] += tok.val;
    }

    return arr;
  };

  function getClosingQuote(str, ch, i, brackets) {
    var idx = str.indexOf(ch, i);
    if (str.charAt(idx - 1) === '\\') {
      return getClosingQuote(str, ch, idx + 1);
    }
    return idx;
  }

  function keepQuotes(ch, opts) {
    if (opts.keepDoubleQuotes === true && ch === '"') return true;
    if (opts.keepSingleQuotes === true && ch === "'") return true;
    return opts.keepQuotes;
  }

  function keepEscaping(opts, str, idx) {
    if (typeof opts.keepEscaping === 'function') {
      return opts.keepEscaping(str, idx);
    }
    return opts.keepEscaping === true || str[idx + 1] === '\\';
  }

  /*!
   * arr-flatten <https://github.com/jonschlinkert/arr-flatten>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var arrFlatten = function (arr) {
    return flat(arr, []);
  };

  function flat(arr, res) {
    var i = 0, cur;
    var len = arr.length;
    for (; i < len; i++) {
      cur = arr[i];
      Array.isArray(cur) ? flat(cur, res) : res.push(cur);
    }
    return res;
  }

  /*!
   * Determine if an object is a Buffer
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   */

  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually
  var isBuffer_1 = function (obj) {
    return obj != null && (isBuffer$3(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
  };

  function isBuffer$3 (obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  }

  // For Node v0.10 support. Remove this eventually.
  function isSlowBuffer (obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer$3(obj.slice(0, 0))
  }

  var toString$3 = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$3 = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$3.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  var isNumber = function isNumber(num) {
    var type = kindOf$3(num);

    if (type === 'string') {
      if (!num.trim()) return false;
    } else if (type !== 'number') {
      return false;
    }

    return (num - num + 1) >= 0;
  };

  /*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtendable$4 = function isExtendable(val) {
    return typeof val !== 'undefined' && val !== null
      && (typeof val === 'object' || typeof val === 'function');
  };

  var extendShallow$4 = function extend(o/*, objects*/) {
    if (!isExtendable$4(o)) { o = {}; }

    var len = arguments.length;
    for (var i = 1; i < len; i++) {
      var obj = arguments[i];

      if (isExtendable$4(obj)) {
        assign$4(o, obj);
      }
    }
    return o;
  };

  function assign$4(a, b) {
    for (var key in b) {
      if (hasOwn$4(b, key)) {
        a[key] = b[key];
      }
    }
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$4(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /*!
   * repeat-string <https://github.com/jonschlinkert/repeat-string>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  /**
   * Results cache
   */

  var res = '';
  var cache$1;

  /**
   * Expose `repeat`
   */

  var repeatString = repeat$1;

  /**
   * Repeat the given `string` the specified `number`
   * of times.
   *
   * **Example:**
   *
   * ```js
   * var repeat = require('repeat-string');
   * repeat('A', 5);
   * //=> AAAAA
   * ```
   *
   * @param {String} `string` The string to repeat
   * @param {Number} `number` The number of times to repeat the string
   * @return {String} Repeated string
   * @api public
   */

  function repeat$1(str, num) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }

    // cover common, quick use cases
    if (num === 1) return str;
    if (num === 2) return str + str;

    var max = str.length * num;
    if (cache$1 !== str || typeof cache$1 === 'undefined') {
      cache$1 = str;
      res = '';
    } else if (res.length >= max) {
      return res.substr(0, max);
    }

    while (max > res.length && num > 1) {
      if (num & 1) {
        res += str;
      }

      num >>= 1;
      str += str;
    }

    res += str;
    res = res.substr(0, max);
    return res;
  }

  var cache$2 = {};

  function toRegexRange(min, max, options) {
    if (isNumber(min) === false) {
      throw new RangeError('toRegexRange: first argument is invalid.');
    }

    if (typeof max === 'undefined' || min === max) {
      return String(min);
    }

    if (isNumber(max) === false) {
      throw new RangeError('toRegexRange: second argument is invalid.');
    }

    options = options || {};
    var relax = String(options.relaxZeros);
    var shorthand = String(options.shorthand);
    var capture = String(options.capture);
    var key = min + ':' + max + '=' + relax + shorthand + capture;
    if (cache$2.hasOwnProperty(key)) {
      return cache$2[key].result;
    }

    var a = Math.min(min, max);
    var b = Math.max(min, max);

    if (Math.abs(a - b) === 1) {
      var result = min + '|' + max;
      if (options.capture) {
        return '(' + result + ')';
      }
      return result;
    }

    var isPadded = padding(min) || padding(max);
    var positives = [];
    var negatives = [];

    var tok = {min: min, max: max, a: a, b: b};
    if (isPadded) {
      tok.isPadded = isPadded;
      tok.maxLen = String(tok.max).length;
    }

    if (a < 0) {
      var newMin = b < 0 ? Math.abs(b) : 1;
      var newMax = Math.abs(a);
      negatives = splitToPatterns(newMin, newMax, tok, options);
      a = tok.a = 0;
    }

    if (b >= 0) {
      positives = splitToPatterns(a, b, tok, options);
    }

    tok.negatives = negatives;
    tok.positives = positives;
    tok.result = siftPatterns(negatives, positives, options);

    if (options.capture && (positives.length + negatives.length) > 1) {
      tok.result = '(' + tok.result + ')';
    }

    cache$2[key] = tok;
    return tok.result;
  }

  function siftPatterns(neg, pos, options) {
    var onlyNegative = filterPatterns(neg, pos, '-', false, options) || [];
    var onlyPositive = filterPatterns(pos, neg, '', false, options) || [];
    var intersected = filterPatterns(neg, pos, '-?', true, options) || [];
    var subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
    return subpatterns.join('|');
  }

  function splitToRanges(min, max) {
    min = Number(min);
    max = Number(max);

    var nines = 1;
    var stops = [max];
    var stop = +countNines(min, nines);

    while (min <= stop && stop <= max) {
      stops = push(stops, stop);
      nines += 1;
      stop = +countNines(min, nines);
    }

    var zeros = 1;
    stop = countZeros(max + 1, zeros) - 1;

    while (min < stop && stop <= max) {
      stops = push(stops, stop);
      zeros += 1;
      stop = countZeros(max + 1, zeros) - 1;
    }

    stops.sort(compare);
    return stops;
  }

  /**
   * Convert a range to a regex pattern
   * @param {Number} `start`
   * @param {Number} `stop`
   * @return {String}
   */

  function rangeToPattern(start, stop, options) {
    if (start === stop) {
      return {pattern: String(start), digits: []};
    }

    var zipped = zip(String(start), String(stop));
    var len = zipped.length, i = -1;

    var pattern = '';
    var digits = 0;

    while (++i < len) {
      var numbers = zipped[i];
      var startDigit = numbers[0];
      var stopDigit = numbers[1];

      if (startDigit === stopDigit) {
        pattern += startDigit;

      } else if (startDigit !== '0' || stopDigit !== '9') {
        pattern += toCharacterClass(startDigit, stopDigit);

      } else {
        digits += 1;
      }
    }

    if (digits) {
      pattern += options.shorthand ? '\\d' : '[0-9]';
    }

    return { pattern: pattern, digits: [digits] };
  }

  function splitToPatterns(min, max, tok, options) {
    var ranges = splitToRanges(min, max);
    var len = ranges.length;
    var idx = -1;

    var tokens = [];
    var start = min;
    var prev;

    while (++idx < len) {
      var range = ranges[idx];
      var obj = rangeToPattern(start, range, options);
      var zeros = '';

      if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
        if (prev.digits.length > 1) {
          prev.digits.pop();
        }
        prev.digits.push(obj.digits[0]);
        prev.string = prev.pattern + toQuantifier(prev.digits);
        start = range + 1;
        continue;
      }

      if (tok.isPadded) {
        zeros = padZeros(range, tok);
      }

      obj.string = zeros + obj.pattern + toQuantifier(obj.digits);
      tokens.push(obj);
      start = range + 1;
      prev = obj;
    }

    return tokens;
  }

  function filterPatterns(arr, comparison, prefix, intersection, options) {
    var res = [];

    for (var i = 0; i < arr.length; i++) {
      var tok = arr[i];
      var ele = tok.string;

      if (options.relaxZeros !== false) {
        if (prefix === '-' && ele.charAt(0) === '0') {
          if (ele.charAt(1) === '{') {
            ele = '0*' + ele.replace(/^0\{\d+\}/, '');
          } else {
            ele = '0*' + ele.slice(1);
          }
        }
      }

      if (!intersection && !contains(comparison, 'string', ele)) {
        res.push(prefix + ele);
      }

      if (intersection && contains(comparison, 'string', ele)) {
        res.push(prefix + ele);
      }
    }
    return res;
  }

  /**
   * Zip strings (`for in` can be used on string characters)
   */

  function zip(a, b) {
    var arr = [];
    for (var ch in a) arr.push([a[ch], b[ch]]);
    return arr;
  }

  function compare(a, b) {
    return a > b ? 1 : b > a ? -1 : 0;
  }

  function push(arr, ele) {
    if (arr.indexOf(ele) === -1) arr.push(ele);
    return arr;
  }

  function contains(arr, key, val) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i][key] === val) {
        return true;
      }
    }
    return false;
  }

  function countNines(min, len) {
    return String(min).slice(0, -len) + repeatString('9', len);
  }

  function countZeros(integer, zeros) {
    return integer - (integer % Math.pow(10, zeros));
  }

  function toQuantifier(digits) {
    var start = digits[0];
    var stop = digits[1] ? (',' + digits[1]) : '';
    if (!stop && (!start || start === 1)) {
      return '';
    }
    return '{' + start + stop + '}';
  }

  function toCharacterClass(a, b) {
    return '[' + a + ((b - a === 1) ? '' : '-') + b + ']';
  }

  function padding(str) {
    return /^-?(0+)\d/.exec(str);
  }

  function padZeros(val, tok) {
    if (tok.isPadded) {
      var diff = Math.abs(tok.maxLen - String(val).length);
      switch (diff) {
        case 0:
          return '';
        case 1:
          return '0';
        default: {
          return '0{' + diff + '}';
        }
      }
    }
    return val;
  }

  /**
   * Expose `toRegexRange`
   */

  var toRegexRange_1 = toRegexRange;

  /**
   * Return a range of numbers or letters.
   *
   * @param  {String} `start` Start of the range
   * @param  {String} `stop` End of the range
   * @param  {String} `step` Increment or decrement to use.
   * @param  {Function} `fn` Custom function to modify each element in the range.
   * @return {Array}
   */

  function fillRange(start, stop, step, options) {
    if (typeof start === 'undefined') {
      return [];
    }

    if (typeof stop === 'undefined' || start === stop) {
      // special case, for handling negative zero
      var isString = typeof start === 'string';
      if (isNumber(start) && !toNumber(start)) {
        return [isString ? '0' : 0];
      }
      return [start];
    }

    if (typeof step !== 'number' && typeof step !== 'string') {
      options = step;
      step = undefined;
    }

    if (typeof options === 'function') {
      options = { transform: options };
    }

    var opts = extendShallow$4({step: step}, options);
    if (opts.step && !isValidNumber(opts.step)) {
      if (opts.strictRanges === true) {
        throw new TypeError('expected options.step to be a number');
      }
      return [];
    }

    opts.isNumber = isValidNumber(start) && isValidNumber(stop);
    if (!opts.isNumber && !isValid(start, stop)) {
      if (opts.strictRanges === true) {
        throw new RangeError('invalid range arguments: ' + util.inspect([start, stop]));
      }
      return [];
    }

    opts.isPadded = isPadded(start) || isPadded(stop);
    opts.toString = opts.stringify
      || typeof opts.step === 'string'
      || typeof start === 'string'
      || typeof stop === 'string'
      || !opts.isNumber;

    if (opts.isPadded) {
      opts.maxLength = Math.max(String(start).length, String(stop).length);
    }

    // support legacy minimatch/fill-range options
    if (typeof opts.optimize === 'boolean') opts.toRegex = opts.optimize;
    if (typeof opts.makeRe === 'boolean') opts.toRegex = opts.makeRe;
    return expand(start, stop, opts);
  }

  function expand(start, stop, options) {
    var a = options.isNumber ? toNumber(start) : start.charCodeAt(0);
    var b = options.isNumber ? toNumber(stop) : stop.charCodeAt(0);

    var step = Math.abs(toNumber(options.step)) || 1;
    if (options.toRegex && step === 1) {
      return toRange(a, b, start, stop, options);
    }

    var zero = {greater: [], lesser: []};
    var asc = a < b;
    var arr = new Array(Math.round((asc ? b - a : a - b) / step));
    var idx = 0;

    while (asc ? a <= b : a >= b) {
      var val = options.isNumber ? a : String.fromCharCode(a);
      if (options.toRegex && (val >= 0 || !options.isNumber)) {
        zero.greater.push(val);
      } else {
        zero.lesser.push(Math.abs(val));
      }

      if (options.isPadded) {
        val = zeros(val, options);
      }

      if (options.toString) {
        val = String(val);
      }

      if (typeof options.transform === 'function') {
        arr[idx++] = options.transform(val, a, b, step, idx, arr, options);
      } else {
        arr[idx++] = val;
      }

      if (asc) {
        a += step;
      } else {
        a -= step;
      }
    }

    if (options.toRegex === true) {
      return toSequence(arr, zero, options);
    }
    return arr;
  }

  function toRange(a, b, start, stop, options) {
    if (options.isPadded) {
      return toRegexRange_1(start, stop, options);
    }

    if (options.isNumber) {
      return toRegexRange_1(Math.min(a, b), Math.max(a, b), options);
    }

    var start = String.fromCharCode(Math.min(a, b));
    var stop = String.fromCharCode(Math.max(a, b));
    return '[' + start + '-' + stop + ']';
  }

  function toSequence(arr, zeros, options) {
    var greater = '', lesser = '';
    if (zeros.greater.length) {
      greater = zeros.greater.join('|');
    }
    if (zeros.lesser.length) {
      lesser = '-(' + zeros.lesser.join('|') + ')';
    }
    var res = greater && lesser
      ? greater + '|' + lesser
      : greater || lesser;

    if (options.capture) {
      return '(' + res + ')';
    }
    return res;
  }

  function zeros(val, options) {
    if (options.isPadded) {
      var str = String(val);
      var len = str.length;
      var dash = '';
      if (str.charAt(0) === '-') {
        dash = '-';
        str = str.slice(1);
      }
      var diff = options.maxLength - len;
      var pad = repeatString('0', diff);
      val = (dash + pad + str);
    }
    if (options.stringify) {
      return String(val);
    }
    return val;
  }

  function toNumber(val) {
    return Number(val) || 0;
  }

  function isPadded(str) {
    return /^-?0\d/.test(str);
  }

  function isValid(min, max) {
    return (isValidNumber(min) || isValidLetter(min))
        && (isValidNumber(max) || isValidLetter(max));
  }

  function isValidLetter(ch) {
    return typeof ch === 'string' && ch.length === 1 && /^\w+$/.test(ch);
  }

  function isValidNumber(n) {
    return isNumber(n) && !/\./.test(n);
  }

  /**
   * Expose `fillRange`
   * @type {Function}
   */

  var fillRange_1 = fillRange;

  /*!
   * repeat-element <https://github.com/jonschlinkert/repeat-element>
   *
   * Copyright (c) 2015-present, Jon Schlinkert.
   * Licensed under the MIT license.
   */

  var repeatElement = function repeat(ele, num) {
    var arr = new Array(num);

    for (var i = 0; i < num; i++) {
      arr[i] = ele;
    }

    return arr;
  };

  var utils_1 = createCommonjsModule(function (module) {


  var utils = module.exports;

  /**
   * Module dependencies
   */

  utils.extend = extendShallow$2;
  utils.flatten = arrFlatten;
  utils.isObject = isobject;
  utils.fillRange = fillRange_1;
  utils.repeat = repeatElement;
  utils.unique = arrayUnique;

  utils.define = function(obj, key, val) {
    Object.defineProperty(obj, key, {
      writable: true,
      configurable: true,
      enumerable: false,
      value: val
    });
  };

  /**
   * Returns true if the given string contains only empty brace sets.
   */

  utils.isEmptySets = function(str) {
    return /^(?:\{,\})+$/.test(str);
  };

  /**
   * Returns true if the given string contains only empty brace sets.
   */

  utils.isQuotedString = function(str) {
    var open = str.charAt(0);
    if (open === '\'' || open === '"' || open === '`') {
      return str.slice(-1) === open;
    }
    return false;
  };

  /**
   * Create the key to use for memoization. The unique key is generated
   * by iterating over the options and concatenating key-value pairs
   * to the pattern string.
   */

  utils.createKey = function(pattern, options) {
    var id = pattern;
    if (typeof options === 'undefined') {
      return id;
    }
    var keys = Object.keys(options);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      id += ';' + key + '=' + String(options[key]);
    }
    return id;
  };

  /**
   * Normalize options
   */

  utils.createOptions = function(options) {
    var opts = utils.extend.apply(null, arguments);
    if (typeof opts.expand === 'boolean') {
      opts.optimize = !opts.expand;
    }
    if (typeof opts.optimize === 'boolean') {
      opts.expand = !opts.optimize;
    }
    if (opts.optimize === true) {
      opts.makeRe = true;
    }
    return opts;
  };

  /**
   * Join patterns in `a` to patterns in `b`
   */

  utils.join = function(a, b, options) {
    options = options || {};
    a = utils.arrayify(a);
    b = utils.arrayify(b);

    if (!a.length) return b;
    if (!b.length) return a;

    var len = a.length;
    var idx = -1;
    var arr = [];

    while (++idx < len) {
      var val = a[idx];
      if (Array.isArray(val)) {
        for (var i = 0; i < val.length; i++) {
          val[i] = utils.join(val[i], b, options);
        }
        arr.push(val);
        continue;
      }

      for (var j = 0; j < b.length; j++) {
        var bval = b[j];

        if (Array.isArray(bval)) {
          arr.push(utils.join(val, bval, options));
        } else {
          arr.push(val + bval);
        }
      }
    }
    return arr;
  };

  /**
   * Split the given string on `,` if not escaped.
   */

  utils.split = function(str, options) {
    var opts = utils.extend({sep: ','}, options);
    if (typeof opts.keepQuotes !== 'boolean') {
      opts.keepQuotes = true;
    }
    if (opts.unescape === false) {
      opts.keepEscaping = true;
    }
    return splitString(str, opts, utils.escapeBrackets(opts));
  };

  /**
   * Expand ranges or sets in the given `pattern`.
   *
   * @param {String} `str`
   * @param {Object} `options`
   * @return {Object}
   */

  utils.expand = function(str, options) {
    var opts = utils.extend({rangeLimit: 10000}, options);
    var segs = utils.split(str, opts);
    var tok = { segs: segs };

    if (utils.isQuotedString(str)) {
      return tok;
    }

    if (opts.rangeLimit === true) {
      opts.rangeLimit = 10000;
    }

    if (segs.length > 1) {
      if (opts.optimize === false) {
        tok.val = segs[0];
        return tok;
      }

      tok.segs = utils.stringifyArray(tok.segs);
    } else if (segs.length === 1) {
      var arr = str.split('..');

      if (arr.length === 1) {
        tok.val = tok.segs[tok.segs.length - 1] || tok.val || str;
        tok.segs = [];
        return tok;
      }

      if (arr.length === 2 && arr[0] === arr[1]) {
        tok.escaped = true;
        tok.val = arr[0];
        tok.segs = [];
        return tok;
      }

      if (arr.length > 1) {
        if (opts.optimize !== false) {
          opts.optimize = true;
          delete opts.expand;
        }

        if (opts.optimize !== true) {
          var min = Math.min(arr[0], arr[1]);
          var max = Math.max(arr[0], arr[1]);
          var step = arr[2] || 1;

          if (opts.rangeLimit !== false && ((max - min) / step >= opts.rangeLimit)) {
            throw new RangeError('expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.');
          }
        }

        arr.push(opts);
        tok.segs = utils.fillRange.apply(null, arr);

        if (!tok.segs.length) {
          tok.escaped = true;
          tok.val = str;
          return tok;
        }

        if (opts.optimize === true) {
          tok.segs = utils.stringifyArray(tok.segs);
        }

        if (tok.segs === '') {
          tok.val = str;
        } else {
          tok.val = tok.segs[0];
        }
        return tok;
      }
    } else {
      tok.val = str;
    }
    return tok;
  };

  /**
   * Ensure commas inside brackets and parens are not split.
   * @param {Object} `tok` Token from the `split-string` module
   * @return {undefined}
   */

  utils.escapeBrackets = function(options) {
    return function(tok) {
      if (tok.escaped && tok.val === 'b') {
        tok.val = '\\b';
        return;
      }

      if (tok.val !== '(' && tok.val !== '[') return;
      var opts = utils.extend({}, options);
      var stack = [];
      var val = tok.val;
      var str = tok.str;
      var i = tok.idx - 1;

      while (++i < str.length) {
        var ch = str[i];

        if (ch === '\\') {
          val += (opts.keepEscaping === false ? '' : ch) + str[++i];
          continue;
        }

        if (ch === '(') {
          stack.push(ch);
        }

        if (ch === '[') {
          stack.push(ch);
        }

        if (ch === ')') {
          stack.pop();
          if (!stack.length) {
            val += ch;
            break;
          }
        }

        if (ch === ']') {
          stack.pop();
          if (!stack.length) {
            val += ch;
            break;
          }
        }
        val += ch;
      }

      tok.split = false;
      tok.val = val.slice(1);
      tok.idx = i;
    };
  };

  /**
   * Returns true if the given string looks like a regex quantifier
   * @return {Boolean}
   */

  utils.isQuantifier = function(str) {
    return /^(?:[0-9]?,[0-9]|[0-9],)$/.test(str);
  };

  /**
   * Cast `val` to an array.
   * @param {*} `val`
   */

  utils.stringifyArray = function(arr) {
    return [utils.arrayify(arr).join('|')];
  };

  /**
   * Cast `val` to an array.
   * @param {*} `val`
   */

  utils.arrayify = function(arr) {
    if (typeof arr === 'undefined') {
      return [];
    }
    if (typeof arr === 'string') {
      return [arr];
    }
    return arr;
  };

  /**
   * Returns true if the given `str` is a non-empty string
   * @return {Boolean}
   */

  utils.isString = function(str) {
    return str != null && typeof str === 'string';
  };

  /**
   * Get the last element from `array`
   * @param {Array} `array`
   * @return {*}
   */

  utils.last = function(arr, n) {
    return arr[arr.length - (n || 1)];
  };

  utils.escapeRegex = function(str) {
    return str.replace(/\\?([!^*?()[\]{}+?/])/g, '\\$1');
  };
  });

  var compilers = function(braces, options) {
    braces.compiler

      /**
       * bos
       */

      .set('bos', function() {
        if (this.output) return;
        this.ast.queue = isEscaped(this.ast) ? [this.ast.val] : [];
        this.ast.count = 1;
      })

      /**
       * Square brackets
       */

      .set('bracket', function(node) {
        var close = node.close;
        var open = !node.escaped ? '[' : '\\[';
        var negated = node.negated;
        var inner = node.inner;

        inner = inner.replace(/\\(?=[\\\w]|$)/g, '\\\\');
        if (inner === ']-') {
          inner = '\\]\\-';
        }

        if (negated && inner.indexOf('.') === -1) {
          inner += '.';
        }
        if (negated && inner.indexOf('/') === -1) {
          inner += '/';
        }

        var val = open + negated + inner + close;
        var queue = node.parent.queue;
        var last = utils_1.arrayify(queue.pop());

        queue.push(utils_1.join(last, val));
        queue.push.apply(queue, []);
      })

      /**
       * Brace
       */

      .set('brace', function(node) {
        node.queue = isEscaped(node) ? [node.val] : [];
        node.count = 1;
        return this.mapVisit(node.nodes);
      })

      /**
       * Open
       */

      .set('brace.open', function(node) {
        node.parent.open = node.val;
      })

      /**
       * Inner
       */

      .set('text', function(node) {
        var queue = node.parent.queue;
        var escaped = node.escaped;
        var segs = [node.val];

        if (node.optimize === false) {
          options = utils_1.extend({}, options, {optimize: false});
        }

        if (node.multiplier > 1) {
          node.parent.count *= node.multiplier;
        }

        if (options.quantifiers === true && utils_1.isQuantifier(node.val)) {
          escaped = true;

        } else if (node.val.length > 1) {
          if (isType(node.parent, 'brace') && !isEscaped(node)) {
            var expanded = utils_1.expand(node.val, options);
            segs = expanded.segs;

            if (expanded.isOptimized) {
              node.parent.isOptimized = true;
            }

            // if nothing was expanded, we probably have a literal brace
            if (!segs.length) {
              var val = (expanded.val || node.val);
              if (options.unescape !== false) {
                // unescape unexpanded brace sequence/set separators
                val = val.replace(/\\([,.])/g, '$1');
                // strip quotes
                val = val.replace(/["'`]/g, '');
              }

              segs = [val];
              escaped = true;
            }
          }

        } else if (node.val === ',') {
          if (options.expand) {
            node.parent.queue.push(['']);
            segs = [''];
          } else {
            segs = ['|'];
          }
        } else {
          escaped = true;
        }

        if (escaped && isType(node.parent, 'brace')) {
          if (node.parent.nodes.length <= 4 && node.parent.count === 1) {
            node.parent.escaped = true;
          } else if (node.parent.length <= 3) {
            node.parent.escaped = true;
          }
        }

        if (!hasQueue(node.parent)) {
          node.parent.queue = segs;
          return;
        }

        var last = utils_1.arrayify(queue.pop());
        if (node.parent.count > 1 && options.expand) {
          last = multiply(last, node.parent.count);
          node.parent.count = 1;
        }

        queue.push(utils_1.join(utils_1.flatten(last), segs.shift()));
        queue.push.apply(queue, segs);
      })

      /**
       * Close
       */

      .set('brace.close', function(node) {
        var queue = node.parent.queue;
        var prev = node.parent.parent;
        var last = prev.queue.pop();
        var open = node.parent.open;
        var close = node.val;

        if (open && close && isOptimized(node, options)) {
          open = '(';
          close = ')';
        }

        // if a close brace exists, and the previous segment is one character
        // don't wrap the result in braces or parens
        var ele = utils_1.last(queue);
        if (node.parent.count > 1 && options.expand) {
          ele = multiply(queue.pop(), node.parent.count);
          node.parent.count = 1;
          queue.push(ele);
        }

        if (close && typeof ele === 'string' && ele.length === 1) {
          open = '';
          close = '';
        }

        if ((isLiteralBrace(node, options) || noInner(node)) && !node.parent.hasEmpty) {
          queue.push(utils_1.join(open, queue.pop() || ''));
          queue = utils_1.flatten(utils_1.join(queue, close));
        }

        if (typeof last === 'undefined') {
          prev.queue = [queue];
        } else {
          prev.queue.push(utils_1.flatten(utils_1.join(last, queue)));
        }
      })

      /**
       * eos
       */

      .set('eos', function(node) {
        if (this.input) return;

        if (options.optimize !== false) {
          this.output = utils_1.last(utils_1.flatten(this.ast.queue));
        } else if (Array.isArray(utils_1.last(this.ast.queue))) {
          this.output = utils_1.flatten(this.ast.queue.pop());
        } else {
          this.output = utils_1.flatten(this.ast.queue);
        }

        if (node.parent.count > 1 && options.expand) {
          this.output = multiply(this.output, node.parent.count);
        }

        this.output = utils_1.arrayify(this.output);
        this.ast.queue = [];
      });

  };

  /**
   * Multiply the segments in the current brace level
   */

  function multiply(queue, n, options) {
    return utils_1.flatten(utils_1.repeat(utils_1.arrayify(queue), n));
  }

  /**
   * Return true if `node` is escaped
   */

  function isEscaped(node) {
    return node.escaped === true;
  }

  /**
   * Returns true if regex parens should be used for sets. If the parent `type`
   * is not `brace`, then we're on a root node, which means we should never
   * expand segments and open/close braces should be `{}` (since this indicates
   * a brace is missing from the set)
   */

  function isOptimized(node, options) {
    if (node.parent.isOptimized) return true;
    return isType(node.parent, 'brace')
      && !isEscaped(node.parent)
      && options.expand !== true;
  }

  /**
   * Returns true if the value in `node` should be wrapped in a literal brace.
   * @return {Boolean}
   */

  function isLiteralBrace(node, options) {
    return isEscaped(node.parent) || options.optimize !== false;
  }

  /**
   * Returns true if the given `node` does not have an inner value.
   * @return {Boolean}
   */

  function noInner(node, type) {
    if (node.parent.queue.length === 1) {
      return true;
    }
    var nodes = node.parent.nodes;
    return nodes.length === 3
      && isType(nodes[0], 'brace.open')
      && !isType(nodes[1], 'text')
      && isType(nodes[2], 'brace.close');
  }

  /**
   * Returns true if the given `node` is the given `type`
   * @return {Boolean}
   */

  function isType(node, type) {
    return typeof node !== 'undefined' && node.type === type;
  }

  /**
   * Returns true if the given `node` has a non-empty queue.
   * @return {Boolean}
   */

  function hasQueue(node) {
    return Array.isArray(node.queue) && node.queue.length;
  }

  var defineProperty$1 = function defineProperty(obj, prop, val) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      throw new TypeError('expected an object or function.');
    }

    if (typeof prop !== 'string') {
      throw new TypeError('expected `prop` to be a string.');
    }

    if (isDescriptor(val) && ('set' in val || 'get' in val)) {
      return Object.defineProperty(obj, prop, val);
    }

    return Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });
  };

  var snapdragonUtil = createCommonjsModule(function (module) {


  var utils = module.exports;

  /**
   * Returns true if the given value is a node.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var node = new Node({type: 'foo'});
   * console.log(utils.isNode(node)); //=> true
   * console.log(utils.isNode({})); //=> false
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @returns {Boolean}
   * @api public
   */

  utils.isNode = function(node) {
    return kindOf$3(node) === 'object' && node.isNode === true;
  };

  /**
   * Emit an empty string for the given `node`.
   *
   * ```js
   * // do nothing for beginning-of-string
   * snapdragon.compiler.set('bos', utils.noop);
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @returns {undefined}
   * @api public
   */

  utils.noop = function(node) {
    append(this, '', node);
  };

  /**
   * Appdend `node.val` to `compiler.output`, exactly as it was created
   * by the parser.
   *
   * ```js
   * snapdragon.compiler.set('text', utils.identity);
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @returns {undefined}
   * @api public
   */

  utils.identity = function(node) {
    append(this, node.val, node);
  };

  /**
   * Previously named `.emit`, this method appends the given `val`
   * to `compiler.output` for the given node. Useful when you know
   * what value should be appended advance, regardless of the actual
   * value of `node.val`.
   *
   * ```js
   * snapdragon.compiler
   *   .set('i', function(node) {
   *     this.mapVisit(node);
   *   })
   *   .set('i.open', utils.append('<i>'))
   *   .set('i.close', utils.append('</i>'))
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @returns {Function} Returns a compiler middleware function.
   * @api public
   */

  utils.append = function(val) {
    return function(node) {
      append(this, val, node);
    };
  };

  /**
   * Used in compiler middleware, this onverts an AST node into
   * an empty `text` node and deletes `node.nodes` if it exists.
   * The advantage of this method is that, as opposed to completely
   * removing the node, indices will not need to be re-calculated
   * in sibling nodes, and nothing is appended to the output.
   *
   * ```js
   * utils.toNoop(node);
   * // convert `node.nodes` to the given value instead of deleting it
   * utils.toNoop(node, []);
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {Array} `nodes` Optionally pass a new `nodes` value, to replace the existing `node.nodes` array.
   * @api public
   */

  utils.toNoop = function(node, nodes) {
    if (nodes) {
      node.nodes = nodes;
    } else {
      delete node.nodes;
      node.type = 'text';
      node.val = '';
    }
  };

  /**
   * Visit `node` with the given `fn`. The built-in `.visit` method in snapdragon
   * automatically calls registered compilers, this allows you to pass a visitor
   * function.
   *
   * ```js
   * snapdragon.compiler.set('i', function(node) {
   *   utils.visit(node, function(childNode) {
   *     // do stuff with "childNode"
   *     return childNode;
   *   });
   * });
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {Function} `fn`
   * @return {Object} returns the node after recursively visiting all child nodes.
   * @api public
   */

  utils.visit = function(node, fn) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isFunction(fn), 'expected a visitor function');
    fn(node);
    return node.nodes ? utils.mapVisit(node, fn) : node;
  };

  /**
   * Map [visit](#visit) the given `fn` over `node.nodes`. This is called by
   * [visit](#visit), use this method if you do not want `fn` to be called on
   * the first node.
   *
   * ```js
   * snapdragon.compiler.set('i', function(node) {
   *   utils.mapVisit(node, function(childNode) {
   *     // do stuff with "childNode"
   *     return childNode;
   *   });
   * });
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {Object} `options`
   * @param {Function} `fn`
   * @return {Object} returns the node
   * @api public
   */

  utils.mapVisit = function(node, fn) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isArray(node.nodes), 'expected node.nodes to be an array');
    assert(isFunction(fn), 'expected a visitor function');

    for (var i = 0; i < node.nodes.length; i++) {
      utils.visit(node.nodes[i], fn);
    }
    return node;
  };

  /**
   * Unshift an `*.open` node onto `node.nodes`.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * snapdragon.parser.set('brace', function(node) {
   *   var match = this.match(/^{/);
   *   if (match) {
   *     var parent = new Node({type: 'brace'});
   *     utils.addOpen(parent, Node);
   *     console.log(parent.nodes[0]):
   *     // { type: 'brace.open', val: '' };
   *
   *     // push the parent "brace" node onto the stack
   *     this.push(parent);
   *
   *     // return the parent node, so it's also added to the AST
   *     return brace;
   *   }
   * });
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {Function} `Node` (required) Node constructor function from [snapdragon-node][].
   * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
   * @return {Object} Returns the created opening node.
   * @api public
   */

  utils.addOpen = function(node, Node, val, filter) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isFunction(Node), 'expected Node to be a constructor function');

    if (typeof val === 'function') {
      filter = val;
      val = '';
    }

    if (typeof filter === 'function' && !filter(node)) return;
    var open = new Node({ type: node.type + '.open', val: val});
    var unshift = node.unshift || node.unshiftNode;
    if (typeof unshift === 'function') {
      unshift.call(node, open);
    } else {
      utils.unshiftNode(node, open);
    }
    return open;
  };

  /**
   * Push a `*.close` node onto `node.nodes`.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * snapdragon.parser.set('brace', function(node) {
   *   var match = this.match(/^}/);
   *   if (match) {
   *     var parent = this.parent();
   *     if (parent.type !== 'brace') {
   *       throw new Error('missing opening: ' + '}');
   *     }
   *
   *     utils.addClose(parent, Node);
   *     console.log(parent.nodes[parent.nodes.length - 1]):
   *     // { type: 'brace.close', val: '' };
   *
   *     // no need to return a node, since the parent
   *     // was already added to the AST
   *     return;
   *   }
   * });
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {Function} `Node` (required) Node constructor function from [snapdragon-node][].
   * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
   * @return {Object} Returns the created closing node.
   * @api public
   */

  utils.addClose = function(node, Node, val, filter) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isFunction(Node), 'expected Node to be a constructor function');

    if (typeof val === 'function') {
      filter = val;
      val = '';
    }

    if (typeof filter === 'function' && !filter(node)) return;
    var close = new Node({ type: node.type + '.close', val: val});
    var push = node.push || node.pushNode;
    if (typeof push === 'function') {
      push.call(node, close);
    } else {
      utils.pushNode(node, close);
    }
    return close;
  };

  /**
   * Wraps the given `node` with `*.open` and `*.close` nodes.
   *
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {Function} `Node` (required) Node constructor function from [snapdragon-node][].
   * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
   * @return {Object} Returns the node
   * @api public
   */

  utils.wrapNodes = function(node, Node, filter) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isFunction(Node), 'expected Node to be a constructor function');

    utils.addOpen(node, Node, filter);
    utils.addClose(node, Node, filter);
    return node;
  };

  /**
   * Push the given `node` onto `parent.nodes`, and set `parent` as `node.parent.
   *
   * ```js
   * var parent = new Node({type: 'foo'});
   * var node = new Node({type: 'bar'});
   * utils.pushNode(parent, node);
   * console.log(parent.nodes[0].type) // 'bar'
   * console.log(node.parent.type) // 'foo'
   * ```
   * @param {Object} `parent`
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Object} Returns the child node
   * @api public
   */

  utils.pushNode = function(parent, node) {
    assert(utils.isNode(parent), 'expected parent node to be an instance of Node');
    assert(utils.isNode(node), 'expected node to be an instance of Node');

    node.define('parent', parent);
    parent.nodes = parent.nodes || [];
    parent.nodes.push(node);
    return node;
  };

  /**
   * Unshift `node` onto `parent.nodes`, and set `parent` as `node.parent.
   *
   * ```js
   * var parent = new Node({type: 'foo'});
   * var node = new Node({type: 'bar'});
   * utils.unshiftNode(parent, node);
   * console.log(parent.nodes[0].type) // 'bar'
   * console.log(node.parent.type) // 'foo'
   * ```
   * @param {Object} `parent`
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {undefined}
   * @api public
   */

  utils.unshiftNode = function(parent, node) {
    assert(utils.isNode(parent), 'expected parent node to be an instance of Node');
    assert(utils.isNode(node), 'expected node to be an instance of Node');

    node.define('parent', parent);
    parent.nodes = parent.nodes || [];
    parent.nodes.unshift(node);
  };

  /**
   * Pop the last `node` off of `parent.nodes`. The advantage of
   * using this method is that it checks for `node.nodes` and works
   * with any version of `snapdragon-node`.
   *
   * ```js
   * var parent = new Node({type: 'foo'});
   * utils.pushNode(parent, new Node({type: 'foo'}));
   * utils.pushNode(parent, new Node({type: 'bar'}));
   * utils.pushNode(parent, new Node({type: 'baz'}));
   * console.log(parent.nodes.length); //=> 3
   * utils.popNode(parent);
   * console.log(parent.nodes.length); //=> 2
   * ```
   * @param {Object} `parent`
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Number|Undefined} Returns the length of `node.nodes` or undefined.
   * @api public
   */

  utils.popNode = function(node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    if (typeof node.pop === 'function') {
      return node.pop();
    }
    return node.nodes && node.nodes.pop();
  };

  /**
   * Shift the first `node` off of `parent.nodes`. The advantage of
   * using this method is that it checks for `node.nodes` and works
   * with any version of `snapdragon-node`.
   *
   * ```js
   * var parent = new Node({type: 'foo'});
   * utils.pushNode(parent, new Node({type: 'foo'}));
   * utils.pushNode(parent, new Node({type: 'bar'}));
   * utils.pushNode(parent, new Node({type: 'baz'}));
   * console.log(parent.nodes.length); //=> 3
   * utils.shiftNode(parent);
   * console.log(parent.nodes.length); //=> 2
   * ```
   * @param {Object} `parent`
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Number|Undefined} Returns the length of `node.nodes` or undefined.
   * @api public
   */

  utils.shiftNode = function(node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    if (typeof node.shift === 'function') {
      return node.shift();
    }
    return node.nodes && node.nodes.shift();
  };

  /**
   * Remove the specified `node` from `parent.nodes`.
   *
   * ```js
   * var parent = new Node({type: 'abc'});
   * var foo = new Node({type: 'foo'});
   * utils.pushNode(parent, foo);
   * utils.pushNode(parent, new Node({type: 'bar'}));
   * utils.pushNode(parent, new Node({type: 'baz'}));
   * console.log(parent.nodes.length); //=> 3
   * utils.removeNode(parent, foo);
   * console.log(parent.nodes.length); //=> 2
   * ```
   * @param {Object} `parent`
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Object|undefined} Returns the removed node, if successful, or undefined if it does not exist on `parent.nodes`.
   * @api public
   */

  utils.removeNode = function(parent, node) {
    assert(utils.isNode(parent), 'expected parent.node to be an instance of Node');
    assert(utils.isNode(node), 'expected node to be an instance of Node');

    if (!parent.nodes) {
      return null;
    }

    if (typeof parent.remove === 'function') {
      return parent.remove(node);
    }

    var idx = parent.nodes.indexOf(node);
    if (idx !== -1) {
      return parent.nodes.splice(idx, 1);
    }
  };

  /**
   * Returns true if `node.type` matches the given `type`. Throws a
   * `TypeError` if `node` is not an instance of `Node`.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var node = new Node({type: 'foo'});
   * console.log(utils.isType(node, 'foo')); // false
   * console.log(utils.isType(node, 'bar')); // true
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {String} `type`
   * @return {Boolean}
   * @api public
   */

  utils.isType = function(node, type) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    switch (kindOf$3(type)) {
      case 'array':
        var types = type.slice();
        for (var i = 0; i < types.length; i++) {
          if (utils.isType(node, types[i])) {
            return true;
          }
        }
        return false;
      case 'string':
        return node.type === type;
      case 'regexp':
        return type.test(node.type);
      default: {
        throw new TypeError('expected "type" to be an array, string or regexp');
      }
    }
  };

  /**
   * Returns true if the given `node` has the given `type` in `node.nodes`.
   * Throws a `TypeError` if `node` is not an instance of `Node`.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var node = new Node({
   *   type: 'foo',
   *   nodes: [
   *     new Node({type: 'bar'}),
   *     new Node({type: 'baz'})
   *   ]
   * });
   * console.log(utils.hasType(node, 'xyz')); // false
   * console.log(utils.hasType(node, 'baz')); // true
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {String} `type`
   * @return {Boolean}
   * @api public
   */

  utils.hasType = function(node, type) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    if (!Array.isArray(node.nodes)) return false;
    for (var i = 0; i < node.nodes.length; i++) {
      if (utils.isType(node.nodes[i], type)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Returns the first node from `node.nodes` of the given `type`
   *
   * ```js
   * var node = new Node({
   *   type: 'foo',
   *   nodes: [
   *     new Node({type: 'text', val: 'abc'}),
   *     new Node({type: 'text', val: 'xyz'})
   *   ]
   * });
   *
   * var textNode = utils.firstOfType(node.nodes, 'text');
   * console.log(textNode.val);
   * //=> 'abc'
   * ```
   * @param {Array} `nodes`
   * @param {String} `type`
   * @return {Object|undefined} Returns the first matching node or undefined.
   * @api public
   */

  utils.firstOfType = function(nodes, type) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (utils.isType(node, type)) {
        return node;
      }
    }
  };

  /**
   * Returns the node at the specified index, or the first node of the
   * given `type` from `node.nodes`.
   *
   * ```js
   * var node = new Node({
   *   type: 'foo',
   *   nodes: [
   *     new Node({type: 'text', val: 'abc'}),
   *     new Node({type: 'text', val: 'xyz'})
   *   ]
   * });
   *
   * var nodeOne = utils.findNode(node.nodes, 'text');
   * console.log(nodeOne.val);
   * //=> 'abc'
   *
   * var nodeTwo = utils.findNode(node.nodes, 1);
   * console.log(nodeTwo.val);
   * //=> 'xyz'
   * ```
   *
   * @param {Array} `nodes`
   * @param {String|Number} `type` Node type or index.
   * @return {Object} Returns a node or undefined.
   * @api public
   */

  utils.findNode = function(nodes, type) {
    if (!Array.isArray(nodes)) {
      return null;
    }
    if (typeof type === 'number') {
      return nodes[type];
    }
    return utils.firstOfType(nodes, type);
  };

  /**
   * Returns true if the given node is an "*.open" node.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var brace = new Node({type: 'brace'});
   * var open = new Node({type: 'brace.open'});
   * var close = new Node({type: 'brace.close'});
   *
   * console.log(utils.isOpen(brace)); // false
   * console.log(utils.isOpen(open)); // true
   * console.log(utils.isOpen(close)); // false
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Boolean}
   * @api public
   */

  utils.isOpen = function(node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    return node.type.slice(-5) === '.open';
  };

  /**
   * Returns true if the given node is a "*.close" node.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var brace = new Node({type: 'brace'});
   * var open = new Node({type: 'brace.open'});
   * var close = new Node({type: 'brace.close'});
   *
   * console.log(utils.isClose(brace)); // false
   * console.log(utils.isClose(open)); // false
   * console.log(utils.isClose(close)); // true
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Boolean}
   * @api public
   */

  utils.isClose = function(node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    return node.type.slice(-6) === '.close';
  };

  /**
   * Returns true if `node.nodes` **has** an `.open` node
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var brace = new Node({
   *   type: 'brace',
   *   nodes: []
   * });
   *
   * var open = new Node({type: 'brace.open'});
   * console.log(utils.hasOpen(brace)); // false
   *
   * brace.pushNode(open);
   * console.log(utils.hasOpen(brace)); // true
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Boolean}
   * @api public
   */

  utils.hasOpen = function(node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    var first = node.first || node.nodes ? node.nodes[0] : null;
    if (utils.isNode(first)) {
      return first.type === node.type + '.open';
    }
    return false;
  };

  /**
   * Returns true if `node.nodes` **has** a `.close` node
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var brace = new Node({
   *   type: 'brace',
   *   nodes: []
   * });
   *
   * var close = new Node({type: 'brace.close'});
   * console.log(utils.hasClose(brace)); // false
   *
   * brace.pushNode(close);
   * console.log(utils.hasClose(brace)); // true
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Boolean}
   * @api public
   */

  utils.hasClose = function(node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    var last = node.last || node.nodes ? node.nodes[node.nodes.length - 1] : null;
    if (utils.isNode(last)) {
      return last.type === node.type + '.close';
    }
    return false;
  };

  /**
   * Returns true if `node.nodes` has both `.open` and `.close` nodes
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var brace = new Node({
   *   type: 'brace',
   *   nodes: []
   * });
   *
   * var open = new Node({type: 'brace.open'});
   * var close = new Node({type: 'brace.close'});
   * console.log(utils.hasOpen(brace)); // false
   * console.log(utils.hasClose(brace)); // false
   *
   * brace.pushNode(open);
   * brace.pushNode(close);
   * console.log(utils.hasOpen(brace)); // true
   * console.log(utils.hasClose(brace)); // true
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Boolean}
   * @api public
   */

  utils.hasOpenAndClose = function(node) {
    return utils.hasOpen(node) && utils.hasClose(node);
  };

  /**
   * Push the given `node` onto the `state.inside` array for the
   * given type. This array is used as a specialized "stack" for
   * only the given `node.type`.
   *
   * ```js
   * var state = { inside: {}};
   * var node = new Node({type: 'brace'});
   * utils.addType(state, node);
   * console.log(state.inside);
   * //=> { brace: [{type: 'brace'}] }
   * ```
   * @param {Object} `state` The `compiler.state` object or custom state object.
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Array} Returns the `state.inside` stack for the given type.
   * @api public
   */

  utils.addType = function(state, node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isObject(state), 'expected state to be an object');

    var type = node.parent
      ? node.parent.type
      : node.type.replace(/\.open$/, '');

    if (!state.hasOwnProperty('inside')) {
      state.inside = {};
    }
    if (!state.inside.hasOwnProperty(type)) {
      state.inside[type] = [];
    }

    var arr = state.inside[type];
    arr.push(node);
    return arr;
  };

  /**
   * Remove the given `node` from the `state.inside` array for the
   * given type. This array is used as a specialized "stack" for
   * only the given `node.type`.
   *
   * ```js
   * var state = { inside: {}};
   * var node = new Node({type: 'brace'});
   * utils.addType(state, node);
   * console.log(state.inside);
   * //=> { brace: [{type: 'brace'}] }
   * utils.removeType(state, node);
   * //=> { brace: [] }
   * ```
   * @param {Object} `state` The `compiler.state` object or custom state object.
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @return {Array} Returns the `state.inside` stack for the given type.
   * @api public
   */

  utils.removeType = function(state, node) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isObject(state), 'expected state to be an object');

    var type = node.parent
      ? node.parent.type
      : node.type.replace(/\.close$/, '');

    if (state.inside.hasOwnProperty(type)) {
      return state.inside[type].pop();
    }
  };

  /**
   * Returns true if `node.val` is an empty string, or `node.nodes` does
   * not contain any non-empty text nodes.
   *
   * ```js
   * var node = new Node({type: 'text'});
   * utils.isEmpty(node); //=> true
   * node.val = 'foo';
   * utils.isEmpty(node); //=> false
   * ```
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {Function} `fn`
   * @return {Boolean}
   * @api public
   */

  utils.isEmpty = function(node, fn) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');

    if (!Array.isArray(node.nodes)) {
      if (node.type !== 'text') {
        return true;
      }
      if (typeof fn === 'function') {
        return fn(node, node.parent);
      }
      return !utils.trim(node.val);
    }

    for (var i = 0; i < node.nodes.length; i++) {
      var child = node.nodes[i];
      if (utils.isOpen(child) || utils.isClose(child)) {
        continue;
      }
      if (!utils.isEmpty(child, fn)) {
        return false;
      }
    }

    return true;
  };

  /**
   * Returns true if the `state.inside` stack for the given type exists
   * and has one or more nodes on it.
   *
   * ```js
   * var state = { inside: {}};
   * var node = new Node({type: 'brace'});
   * console.log(utils.isInsideType(state, 'brace')); //=> false
   * utils.addType(state, node);
   * console.log(utils.isInsideType(state, 'brace')); //=> true
   * utils.removeType(state, node);
   * console.log(utils.isInsideType(state, 'brace')); //=> false
   * ```
   * @param {Object} `state`
   * @param {String} `type`
   * @return {Boolean}
   * @api public
   */

  utils.isInsideType = function(state, type) {
    assert(isObject(state), 'expected state to be an object');
    assert(isString(type), 'expected type to be a string');

    if (!state.hasOwnProperty('inside')) {
      return false;
    }

    if (!state.inside.hasOwnProperty(type)) {
      return false;
    }

    return state.inside[type].length > 0;
  };

  /**
   * Returns true if `node` is either a child or grand-child of the given `type`,
   * or `state.inside[type]` is a non-empty array.
   *
   * ```js
   * var state = { inside: {}};
   * var node = new Node({type: 'brace'});
   * var open = new Node({type: 'brace.open'});
   * console.log(utils.isInside(state, open, 'brace')); //=> false
   * utils.pushNode(node, open);
   * console.log(utils.isInside(state, open, 'brace')); //=> true
   * ```
   * @param {Object} `state` Either the `compiler.state` object, if it exists, or a user-supplied state object.
   * @param {Object} `node` Instance of [snapdragon-node][]
   * @param {String} `type` The `node.type` to check for.
   * @return {Boolean}
   * @api public
   */

  utils.isInside = function(state, node, type) {
    assert(utils.isNode(node), 'expected node to be an instance of Node');
    assert(isObject(state), 'expected state to be an object');

    if (Array.isArray(type)) {
      for (var i = 0; i < type.length; i++) {
        if (utils.isInside(state, node, type[i])) {
          return true;
        }
      }
      return false;
    }

    var parent = node.parent;
    if (typeof type === 'string') {
      return (parent && parent.type === type) || utils.isInsideType(state, type);
    }

    if (kindOf$3(type) === 'regexp') {
      if (parent && parent.type && type.test(parent.type)) {
        return true;
      }

      var keys = Object.keys(state.inside);
      var len = keys.length;
      var idx = -1;
      while (++idx < len) {
        var key = keys[idx];
        var val = state.inside[key];

        if (Array.isArray(val) && val.length !== 0 && type.test(key)) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Get the last `n` element from the given `array`. Used for getting
   * a node from `node.nodes.`
   *
   * @param {Array} `array`
   * @param {Number} `n`
   * @return {undefined}
   * @api public
   */

  utils.last = function(arr, n) {
    return arr[arr.length - (n || 1)];
  };

  /**
   * Cast the given `val` to an array.
   *
   * ```js
   * console.log(utils.arrayify(''));
   * //=> []
   * console.log(utils.arrayify('foo'));
   * //=> ['foo']
   * console.log(utils.arrayify(['foo']));
   * //=> ['foo']
   * ```
   * @param {any} `val`
   * @return {Array}
   * @api public
   */

  utils.arrayify = function(val) {
    if (typeof val === 'string' && val !== '') {
      return [val];
    }
    if (!Array.isArray(val)) {
      return [];
    }
    return val;
  };

  /**
   * Convert the given `val` to a string by joining with `,`. Useful
   * for creating a cheerio/CSS/DOM-style selector from a list of strings.
   *
   * @param {any} `val`
   * @return {Array}
   * @api public
   */

  utils.stringify = function(val) {
    return utils.arrayify(val).join(',');
  };

  /**
   * Ensure that the given value is a string and call `.trim()` on it,
   * or return an empty string.
   *
   * @param {String} `str`
   * @return {String}
   * @api public
   */

  utils.trim = function(str) {
    return typeof str === 'string' ? str.trim() : '';
  };

  /**
   * Return true if val is an object
   */

  function isObject(val) {
    return kindOf$3(val) === 'object';
  }

  /**
   * Return true if val is a string
   */

  function isString(val) {
    return typeof val === 'string';
  }

  /**
   * Return true if val is a function
   */

  function isFunction(val) {
    return typeof val === 'function';
  }

  /**
   * Return true if val is an array
   */

  function isArray(val) {
    return Array.isArray(val);
  }

  /**
   * Shim to ensure the `.append` methods work with any version of snapdragon
   */

  function append(compiler, val, node) {
    if (typeof compiler.append !== 'function') {
      return compiler.emit(val, node);
    }
    return compiler.append(val, node);
  }

  /**
   * Simplified assertion. Throws an error is `val` is falsey.
   */

  function assert(val, message) {
    if (!val) throw new Error(message);
  }
  });

  var snapdragonNode = createCommonjsModule(function (module, exports) {




  var ownNames;

  /**
   * Create a new AST `Node` with the given `val` and `type`.
   *
   * ```js
   * var node = new Node('*', 'Star');
   * var node = new Node({type: 'star', val: '*'});
   * ```
   * @name Node
   * @param {String|Object} `val` Pass a matched substring, or an object to merge onto the node.
   * @param {String} `type` The node type to use when `val` is a string.
   * @return {Object} node instance
   * @api public
   */

  function Node(val, type, parent) {
    if (typeof type !== 'string') {
      parent = type;
      type = null;
    }

    defineProperty$1(this, 'parent', parent);
    defineProperty$1(this, 'isNode', true);
    defineProperty$1(this, 'expect', null);

    if (typeof type !== 'string' && isobject(val)) {
      lazyKeys();
      var keys = Object.keys(val);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (ownNames.indexOf(key) === -1) {
          this[key] = val[key];
        }
      }
    } else {
      this.type = type;
      this.val = val;
    }
  }

  /**
   * Returns true if the given value is a node.
   *
   * ```js
   * var Node = require('snapdragon-node');
   * var node = new Node({type: 'foo'});
   * console.log(Node.isNode(node)); //=> true
   * console.log(Node.isNode({})); //=> false
   * ```
   * @param {Object} `node`
   * @returns {Boolean}
   * @api public
   */

  Node.isNode = function(node) {
    return snapdragonUtil.isNode(node);
  };

  /**
   * Define a non-enumberable property on the node instance.
   * Useful for adding properties that shouldn't be extended
   * or visible during debugging.
   *
   * ```js
   * var node = new Node();
   * node.define('foo', 'something non-enumerable');
   * ```
   * @param {String} `name`
   * @param {any} `val`
   * @return {Object} returns the node instance
   * @api public
   */

  Node.prototype.define = function(name, val) {
    defineProperty$1(this, name, val);
    return this;
  };

  /**
   * Returns true if `node.val` is an empty string, or `node.nodes` does
   * not contain any non-empty text nodes.
   *
   * ```js
   * var node = new Node({type: 'text'});
   * node.isEmpty(); //=> true
   * node.val = 'foo';
   * node.isEmpty(); //=> false
   * ```
   * @param {Function} `fn` (optional) Filter function that is called on `node` and/or child nodes. `isEmpty` will return false immediately when the filter function returns false on any nodes.
   * @return {Boolean}
   * @api public
   */

  Node.prototype.isEmpty = function(fn) {
    return snapdragonUtil.isEmpty(this, fn);
  };

  /**
   * Given node `foo` and node `bar`, push node `bar` onto `foo.nodes`, and
   * set `foo` as `bar.parent`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * foo.push(bar);
   * ```
   * @param {Object} `node`
   * @return {Number} Returns the length of `node.nodes`
   * @api public
   */

  Node.prototype.push = function(node) {
    assert(Node.isNode(node), 'expected node to be an instance of Node');
    defineProperty$1(node, 'parent', this);

    this.nodes = this.nodes || [];
    return this.nodes.push(node);
  };

  /**
   * Given node `foo` and node `bar`, unshift node `bar` onto `foo.nodes`, and
   * set `foo` as `bar.parent`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * foo.unshift(bar);
   * ```
   * @param {Object} `node`
   * @return {Number} Returns the length of `node.nodes`
   * @api public
   */

  Node.prototype.unshift = function(node) {
    assert(Node.isNode(node), 'expected node to be an instance of Node');
    defineProperty$1(node, 'parent', this);

    this.nodes = this.nodes || [];
    return this.nodes.unshift(node);
  };

  /**
   * Pop a node from `node.nodes`.
   *
   * ```js
   * var node = new Node({type: 'foo'});
   * node.push(new Node({type: 'a'}));
   * node.push(new Node({type: 'b'}));
   * node.push(new Node({type: 'c'}));
   * node.push(new Node({type: 'd'}));
   * console.log(node.nodes.length);
   * //=> 4
   * node.pop();
   * console.log(node.nodes.length);
   * //=> 3
   * ```
   * @return {Number} Returns the popped `node`
   * @api public
   */

  Node.prototype.pop = function() {
    return this.nodes && this.nodes.pop();
  };

  /**
   * Shift a node from `node.nodes`.
   *
   * ```js
   * var node = new Node({type: 'foo'});
   * node.push(new Node({type: 'a'}));
   * node.push(new Node({type: 'b'}));
   * node.push(new Node({type: 'c'}));
   * node.push(new Node({type: 'd'}));
   * console.log(node.nodes.length);
   * //=> 4
   * node.shift();
   * console.log(node.nodes.length);
   * //=> 3
   * ```
   * @return {Object} Returns the shifted `node`
   * @api public
   */

  Node.prototype.shift = function() {
    return this.nodes && this.nodes.shift();
  };

  /**
   * Remove `node` from `node.nodes`.
   *
   * ```js
   * node.remove(childNode);
   * ```
   * @param {Object} `node`
   * @return {Object} Returns the removed node.
   * @api public
   */

  Node.prototype.remove = function(node) {
    assert(Node.isNode(node), 'expected node to be an instance of Node');
    this.nodes = this.nodes || [];
    var idx = node.index;
    if (idx !== -1) {
      node.index = -1;
      return this.nodes.splice(idx, 1);
    }
    return null;
  };

  /**
   * Get the first child node from `node.nodes` that matches the given `type`.
   * If `type` is a number, the child node at that index is returned.
   *
   * ```js
   * var child = node.find(1); //<= index of the node to get
   * var child = node.find('foo'); //<= node.type of a child node
   * var child = node.find(/^(foo|bar)$/); //<= regex to match node.type
   * var child = node.find(['foo', 'bar']); //<= array of node.type(s)
   * ```
   * @param {String} `type`
   * @return {Object} Returns a child node or undefined.
   * @api public
   */

  Node.prototype.find = function(type) {
    return snapdragonUtil.findNode(this.nodes, type);
  };

  /**
   * Return true if the node is the given `type`.
   *
   * ```js
   * var node = new Node({type: 'bar'});
   * cosole.log(node.isType('foo'));          // false
   * cosole.log(node.isType(/^(foo|bar)$/));  // true
   * cosole.log(node.isType(['foo', 'bar'])); // true
   * ```
   * @param {String} `type`
   * @return {Boolean}
   * @api public
   */

  Node.prototype.isType = function(type) {
    return snapdragonUtil.isType(this, type);
  };

  /**
   * Return true if the `node.nodes` has the given `type`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * foo.push(bar);
   *
   * cosole.log(foo.hasType('qux'));          // false
   * cosole.log(foo.hasType(/^(qux|bar)$/));  // true
   * cosole.log(foo.hasType(['qux', 'bar'])); // true
   * ```
   * @param {String} `type`
   * @return {Boolean}
   * @api public
   */

  Node.prototype.hasType = function(type) {
    return snapdragonUtil.hasType(this, type);
  };

  /**
   * Get the siblings array, or `null` if it doesn't exist.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * var baz = new Node({type: 'baz'});
   * foo.push(bar);
   * foo.push(baz);
   *
   * console.log(bar.siblings.length) // 2
   * console.log(baz.siblings.length) // 2
   * ```
   * @return {Array}
   * @api public
   */

  Object.defineProperty(Node.prototype, 'siblings', {
    set: function() {
      throw new Error('node.siblings is a getter and cannot be defined');
    },
    get: function() {
      return this.parent ? this.parent.nodes : null;
    }
  });

  /**
   * Get the node's current index from `node.parent.nodes`.
   * This should always be correct, even when the parent adds nodes.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * var baz = new Node({type: 'baz'});
   * var qux = new Node({type: 'qux'});
   * foo.push(bar);
   * foo.push(baz);
   * foo.unshift(qux);
   *
   * console.log(bar.index) // 1
   * console.log(baz.index) // 2
   * console.log(qux.index) // 0
   * ```
   * @return {Number}
   * @api public
   */

  Object.defineProperty(Node.prototype, 'index', {
    set: function(index) {
      defineProperty$1(this, 'idx', index);
    },
    get: function() {
      if (!Array.isArray(this.siblings)) {
        return -1;
      }
      var tok = this.idx !== -1 ? this.siblings[this.idx] : null;
      if (tok !== this) {
        this.idx = this.siblings.indexOf(this);
      }
      return this.idx;
    }
  });

  /**
   * Get the previous node from the siblings array or `null`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * var baz = new Node({type: 'baz'});
   * foo.push(bar);
   * foo.push(baz);
   *
   * console.log(baz.prev.type) // 'bar'
   * ```
   * @return {Object}
   * @api public
   */

  Object.defineProperty(Node.prototype, 'prev', {
    set: function() {
      throw new Error('node.prev is a getter and cannot be defined');
    },
    get: function() {
      if (Array.isArray(this.siblings)) {
        return this.siblings[this.index - 1] || this.parent.prev;
      }
      return null;
    }
  });

  /**
   * Get the siblings array, or `null` if it doesn't exist.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * var baz = new Node({type: 'baz'});
   * foo.push(bar);
   * foo.push(baz);
   *
   * console.log(bar.siblings.length) // 2
   * console.log(baz.siblings.length) // 2
   * ```
   * @return {Object}
   * @api public
   */

  Object.defineProperty(Node.prototype, 'next', {
    set: function() {
      throw new Error('node.next is a getter and cannot be defined');
    },
    get: function() {
      if (Array.isArray(this.siblings)) {
        return this.siblings[this.index + 1] || this.parent.next;
      }
      return null;
    }
  });

  /**
   * Get the first node from `node.nodes`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * var baz = new Node({type: 'baz'});
   * var qux = new Node({type: 'qux'});
   * foo.push(bar);
   * foo.push(baz);
   * foo.push(qux);
   *
   * console.log(foo.first.type) // 'bar'
   * ```
   * @return {Object} The first node, or undefiend
   * @api public
   */

  Object.defineProperty(Node.prototype, 'first', {
    get: function() {
      return this.nodes ? this.nodes[0] : null;
    }
  });

  /**
   * Get the last node from `node.nodes`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * var baz = new Node({type: 'baz'});
   * var qux = new Node({type: 'qux'});
   * foo.push(bar);
   * foo.push(baz);
   * foo.push(qux);
   *
   * console.log(foo.last.type) // 'qux'
   * ```
   * @return {Object} The last node, or undefiend
   * @api public
   */

  Object.defineProperty(Node.prototype, 'last', {
    get: function() {
      return this.nodes ? snapdragonUtil.last(this.nodes) : null;
    }
  });

  /**
   * Get the last node from `node.nodes`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * var baz = new Node({type: 'baz'});
   * var qux = new Node({type: 'qux'});
   * foo.push(bar);
   * foo.push(baz);
   * foo.push(qux);
   *
   * console.log(foo.last.type) // 'qux'
   * ```
   * @return {Object} The last node, or undefiend
   * @api public
   */

  Object.defineProperty(Node.prototype, 'scope', {
    get: function() {
      if (this.isScope !== true) {
        return this.parent ? this.parent.scope : this;
      }
      return this;
    }
  });

  /**
   * Get own property names from Node prototype, but only the
   * first time `Node` is instantiated
   */

  function lazyKeys() {
    if (!ownNames) {
      ownNames = Object.getOwnPropertyNames(Node.prototype);
    }
  }

  /**
   * Simplified assertion. Throws an error is `val` is falsey.
   */

  function assert(val, message) {
    if (!val) throw new Error(message);
  }

  /**
   * Expose `Node`
   */

  exports = module.exports = Node;
  });

  /**
   * Braces parsers
   */

  var parsers = function(braces, options) {
    braces.parser
      .set('bos', function() {
        if (!this.parsed) {
          this.ast = this.nodes[0] = new snapdragonNode(this.ast);
        }
      })

      /**
       * Character parsers
       */

      .set('escape', function() {
        var pos = this.position();
        var m = this.match(/^(?:\\(.)|\$\{)/);
        if (!m) return;

        var prev = this.prev();
        var last = utils_1.last(prev.nodes);

        var node = pos(new snapdragonNode({
          type: 'text',
          multiplier: 1,
          val: m[0]
        }));

        if (node.val === '\\\\') {
          return node;
        }

        if (node.val === '${') {
          var str = this.input;
          var idx = -1;
          var ch;

          while ((ch = str[++idx])) {
            this.consume(1);
            node.val += ch;
            if (ch === '\\') {
              node.val += str[++idx];
              continue;
            }
            if (ch === '}') {
              break;
            }
          }
        }

        if (this.options.unescape !== false) {
          node.val = node.val.replace(/\\([{}])/g, '$1');
        }

        if (last.val === '"' && this.input.charAt(0) === '"') {
          last.val = node.val;
          this.consume(1);
          return;
        }

        return concatNodes.call(this, pos, node, prev, options);
      })

      /**
       * Brackets: "[...]" (basic, this is overridden by
       * other parsers in more advanced implementations)
       */

      .set('bracket', function() {
        var isInside = this.isInside('brace');
        var pos = this.position();
        var m = this.match(/^(?:\[([!^]?)([^\]]{2,}|\]-)(\]|[^*+?]+)|\[)/);
        if (!m) return;

        var prev = this.prev();
        var val = m[0];
        var negated = m[1] ? '^' : '';
        var inner = m[2] || '';
        var close = m[3] || '';

        if (isInside && prev.type === 'brace') {
          prev.text = prev.text || '';
          prev.text += val;
        }

        var esc = this.input.slice(0, 2);
        if (inner === '' && esc === '\\]') {
          inner += esc;
          this.consume(2);

          var str = this.input;
          var idx = -1;
          var ch;

          while ((ch = str[++idx])) {
            this.consume(1);
            if (ch === ']') {
              close = ch;
              break;
            }
            inner += ch;
          }
        }

        return pos(new snapdragonNode({
          type: 'bracket',
          val: val,
          escaped: close !== ']',
          negated: negated,
          inner: inner,
          close: close
        }));
      })

      /**
       * Empty braces (we capture these early to
       * speed up processing in the compiler)
       */

      .set('multiplier', function() {
        var isInside = this.isInside('brace');
        var pos = this.position();
        var m = this.match(/^\{((?:,|\{,+\})+)\}/);
        if (!m) return;

        this.multiplier = true;
        var prev = this.prev();
        var val = m[0];

        if (isInside && prev.type === 'brace') {
          prev.text = prev.text || '';
          prev.text += val;
        }

        var node = pos(new snapdragonNode({
          type: 'text',
          multiplier: 1,
          match: m,
          val: val
        }));

        return concatNodes.call(this, pos, node, prev, options);
      })

      /**
       * Open
       */

      .set('brace.open', function() {
        var pos = this.position();
        var m = this.match(/^\{(?!(?:[^\\}]?|,+)\})/);
        if (!m) return;

        var prev = this.prev();
        var last = utils_1.last(prev.nodes);

        // if the last parsed character was an extglob character
        // we need to _not optimize_ the brace pattern because
        // it might be mistaken for an extglob by a downstream parser
        if (last && last.val && isExtglobChar(last.val.slice(-1))) {
          last.optimize = false;
        }

        var open = pos(new snapdragonNode({
          type: 'brace.open',
          val: m[0]
        }));

        var node = pos(new snapdragonNode({
          type: 'brace',
          nodes: []
        }));

        node.push(open);
        prev.push(node);
        this.push('brace', node);
      })

      /**
       * Close
       */

      .set('brace.close', function() {
        var pos = this.position();
        var m = this.match(/^\}/);
        if (!m || !m[0]) return;

        var brace = this.pop('brace');
        var node = pos(new snapdragonNode({
          type: 'brace.close',
          val: m[0]
        }));

        if (!this.isType(brace, 'brace')) {
          if (this.options.strict) {
            throw new Error('missing opening "{"');
          }
          node.type = 'text';
          node.multiplier = 0;
          node.escaped = true;
          return node;
        }

        var prev = this.prev();
        var last = utils_1.last(prev.nodes);
        if (last.text) {
          var lastNode = utils_1.last(last.nodes);
          if (lastNode.val === ')' && /[!@*?+]\(/.test(last.text)) {
            var open = last.nodes[0];
            var text = last.nodes[1];
            if (open.type === 'brace.open' && text && text.type === 'text') {
              text.optimize = false;
            }
          }
        }

        if (brace.nodes.length > 2) {
          var first = brace.nodes[1];
          if (first.type === 'text' && first.val === ',') {
            brace.nodes.splice(1, 1);
            brace.nodes.push(first);
          }
        }

        brace.push(node);
      })

      /**
       * Capture boundary characters
       */

      .set('boundary', function() {
        var pos = this.position();
        var m = this.match(/^[$^](?!\{)/);
        if (!m) return;
        return pos(new snapdragonNode({
          type: 'text',
          val: m[0]
        }));
      })

      /**
       * One or zero, non-comma characters wrapped in braces
       */

      .set('nobrace', function() {
        var isInside = this.isInside('brace');
        var pos = this.position();
        var m = this.match(/^\{[^,]?\}/);
        if (!m) return;

        var prev = this.prev();
        var val = m[0];

        if (isInside && prev.type === 'brace') {
          prev.text = prev.text || '';
          prev.text += val;
        }

        return pos(new snapdragonNode({
          type: 'text',
          multiplier: 0,
          val: val
        }));
      })

      /**
       * Text
       */

      .set('text', function() {
        var isInside = this.isInside('brace');
        var pos = this.position();
        var m = this.match(/^((?!\\)[^${}[\]])+/);
        if (!m) return;

        var prev = this.prev();
        var val = m[0];

        if (isInside && prev.type === 'brace') {
          prev.text = prev.text || '';
          prev.text += val;
        }

        var node = pos(new snapdragonNode({
          type: 'text',
          multiplier: 1,
          val: val
        }));

        return concatNodes.call(this, pos, node, prev, options);
      });
  };

  /**
   * Returns true if the character is an extglob character.
   */

  function isExtglobChar(ch) {
    return ch === '!' || ch === '@' || ch === '*' || ch === '?' || ch === '+';
  }

  /**
   * Combine text nodes, and calculate empty sets (`{,,}`)
   * @param {Function} `pos` Function to calculate node position
   * @param {Object} `node` AST node
   * @return {Object}
   */

  function concatNodes(pos, node, parent, options) {
    node.orig = node.val;
    var prev = this.prev();
    var last = utils_1.last(prev.nodes);
    var isEscaped = false;

    if (node.val.length > 1) {
      var a = node.val.charAt(0);
      var b = node.val.slice(-1);

      isEscaped = (a === '"' && b === '"')
        || (a === "'" && b === "'")
        || (a === '`' && b === '`');
    }

    if (isEscaped && options.unescape !== false) {
      node.val = node.val.slice(1, node.val.length - 1);
      node.escaped = true;
    }

    if (node.match) {
      var match = node.match[1];
      if (!match || match.indexOf('}') === -1) {
        match = node.match[0];
      }

      // replace each set with a single ","
      var val = match.replace(/\{/g, ',').replace(/\}/g, '');
      node.multiplier *= val.length;
      node.val = '';
    }

    var simpleText = last.type === 'text'
      && last.multiplier === 1
      && node.multiplier === 1
      && node.val;

    if (simpleText) {
      last.val += node.val;
      return;
    }

    prev.push(node);
  }

  var defineProperty$2 = function defineProperty(obj, prop, val) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      throw new TypeError('expected an object or function.');
    }

    if (typeof prop !== 'string') {
      throw new TypeError('expected `prop` to be a string.');
    }

    if (isDescriptor(val) && ('set' in val || 'get' in val)) {
      return Object.defineProperty(obj, prop, val);
    }

    return Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });
  };

  var componentEmitter = createCommonjsModule(function (module) {
  /**
   * Expose `Emitter`.
   */

  {
    module.exports = Emitter;
  }

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */

  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.on =
  Emitter.prototype.addEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};
    (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
      .push(fn);
    return this;
  };

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.once = function(event, fn){
    function on() {
      this.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };

  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.off =
  Emitter.prototype.removeListener =
  Emitter.prototype.removeAllListeners =
  Emitter.prototype.removeEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};

    // all
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }

    // specific event
    var callbacks = this._callbacks['$' + event];
    if (!callbacks) return this;

    // remove all handlers
    if (1 == arguments.length) {
      delete this._callbacks['$' + event];
      return this;
    }

    // remove specific handler
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    return this;
  };

  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */

  Emitter.prototype.emit = function(event){
    this._callbacks = this._callbacks || {};
    var args = [].slice.call(arguments, 1)
      , callbacks = this._callbacks['$' + event];

    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  };

  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */

  Emitter.prototype.listeners = function(event){
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
  };

  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */

  Emitter.prototype.hasListeners = function(event){
    return !! this.listeners(event).length;
  };
  });

  var objectVisit = function visit(thisArg, method, target, val) {
    if (!isobject(thisArg) && typeof thisArg !== 'function') {
      throw new Error('object-visit expects `thisArg` to be an object.');
    }

    if (typeof method !== 'string') {
      throw new Error('object-visit expects `method` name to be a string');
    }

    if (typeof thisArg[method] !== 'function') {
      return thisArg;
    }

    var args = [].slice.call(arguments, 3);
    target = target || {};

    for (var key in target) {
      var arr = [key, target[key]].concat(args);
      thisArg[method].apply(thisArg, arr);
    }
    return thisArg;
  };

  /**
   * Map `visit` over an array of objects.
   *
   * @param  {Object} `collection` The context in which to invoke `method`
   * @param  {String} `method` Name of the method to call on `collection`
   * @param  {Object} `arr` Array of objects.
   */

  var mapVisit = function mapVisit(collection, method, val) {
    if (isObject$4(val)) {
      return objectVisit.apply(null, arguments);
    }

    if (!Array.isArray(val)) {
      throw new TypeError('expected an array: ' + util.inspect(val));
    }

    var args = [].slice.call(arguments, 3);

    for (var i = 0; i < val.length; i++) {
      var ele = val[i];
      if (isObject$4(ele)) {
        objectVisit.apply(null, [collection, method, ele].concat(args));
      } else {
        collection[method].apply(collection, [ele].concat(args));
      }
    }
  };

  function isObject$4(val) {
    return val && (typeof val === 'function' || (!Array.isArray(val) && typeof val === 'object'));
  }

  var collectionVisit = function(collection, method, val) {
    var result;

    if (typeof val === 'string' && (method in collection)) {
      var args = [].slice.call(arguments, 2);
      result = collection[method].apply(collection, args);
    } else if (Array.isArray(val)) {
      result = mapVisit.apply(null, arguments);
    } else {
      result = objectVisit.apply(null, arguments);
    }

    if (typeof result !== 'undefined') {
      return result;
    }

    return collection;
  };

  var toObjectPath = function toPath(args) {
    if (kindOf$3(args) !== 'arguments') {
      args = arguments;
    }
    return filter(args).join('.');
  };

  function filter(arr) {
    var len = arr.length;
    var idx = -1;
    var res = [];

    while (++idx < len) {
      var ele = arr[idx];
      if (kindOf$3(ele) === 'arguments' || Array.isArray(ele)) {
        res.push.apply(res, filter(ele));
      } else if (typeof ele === 'string') {
        res.push(ele);
      }
    }
    return res;
  }

  /*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtendable$5 = function isExtendable(val) {
    return typeof val !== 'undefined' && val !== null
      && (typeof val === 'object' || typeof val === 'function');
  };

  var arrUnion = function union(init) {
    if (!Array.isArray(init)) {
      throw new TypeError('arr-union expects the first argument to be an array.');
    }

    var len = arguments.length;
    var i = 0;

    while (++i < len) {
      var arg = arguments[i];
      if (!arg) continue;

      if (!Array.isArray(arg)) {
        arg = [arg];
      }

      for (var j = 0; j < arg.length; j++) {
        var ele = arg[j];

        if (init.indexOf(ele) >= 0) {
          continue;
        }
        init.push(ele);
      }
    }
    return init;
  };

  /*!
   * get-value <https://github.com/jonschlinkert/get-value>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var getValue = function(obj, prop, a, b, c) {
    if (!isObject$5(obj) || !prop) {
      return obj;
    }

    prop = toString$4(prop);

    // allowing for multiple properties to be passed as
    // a string or array, but much faster (3-4x) than doing
    // `[].slice.call(arguments)`
    if (a) prop += '.' + toString$4(a);
    if (b) prop += '.' + toString$4(b);
    if (c) prop += '.' + toString$4(c);

    if (prop in obj) {
      return obj[prop];
    }

    var segs = prop.split('.');
    var len = segs.length;
    var i = -1;

    while (obj && (++i < len)) {
      var key = segs[i];
      while (key[key.length - 1] === '\\') {
        key = key.slice(0, -1) + '.' + segs[++i];
      }
      obj = obj[key];
    }
    return obj;
  };

  function isObject$5(val) {
    return val !== null && (typeof val === 'object' || typeof val === 'function');
  }

  function toString$4(val) {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val.join('.');
    }
    return val;
  }

  var extendShallow$5 = function extend(o/*, objects*/) {
    if (!isExtendable$5(o)) { o = {}; }

    var len = arguments.length;
    for (var i = 1; i < len; i++) {
      var obj = arguments[i];

      if (isExtendable$5(obj)) {
        assign$5(o, obj);
      }
    }
    return o;
  };

  function assign$5(a, b) {
    for (var key in b) {
      if (hasOwn$5(b, key)) {
        a[key] = b[key];
      }
    }
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$5(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  var setValue = function(obj, path$$1, val) {
    if (!isExtendable$5(obj)) {
      return obj;
    }

    if (Array.isArray(path$$1)) {
      path$$1 = toObjectPath(path$$1);
    }

    if (typeof path$$1 !== 'string') {
      return obj;
    }

    var segs = path$$1.split('.');
    var len = segs.length, i = -1;
    var res = obj;
    var last;

    while (++i < len) {
      var key = segs[i];

      while (key[key.length - 1] === '\\') {
        key = key.slice(0, -1) + '.' + segs[++i];
      }

      if (i === len - 1) {
        last = key;
        break;
      }

      if (!isExtendable$5(obj[key])) {
        obj[key] = {};
      }
      obj = obj[key];
    }

    if (obj.hasOwnProperty(last) && isExtendable$5(obj[last])) {
      if (isPlainObject(val)) {
        extendShallow$5(obj[last], val);
      } else {
        obj[last] = val;
      }

    } else {
      obj[last] = val;
    }
    return res;
  };

  var unionValue = function unionValue(obj, prop, value) {
    if (!isExtendable$5(obj)) {
      throw new TypeError('union-value expects the first argument to be an object.');
    }

    if (typeof prop !== 'string') {
      throw new TypeError('union-value expects `prop` to be a string.');
    }

    var arr = arrayify(getValue(obj, prop));
    setValue(obj, prop, arrUnion(arr, arrayify(value)));
    return obj;
  };

  function arrayify(val) {
    if (val === null || typeof val === 'undefined') {
      return [];
    }
    if (Array.isArray(val)) {
      return val;
    }
    return [val];
  }

  var toString$5 = {}.toString;

  var isarray = Array.isArray || function (arr) {
    return toString$5.call(arr) == '[object Array]';
  };

  var isobject$1 = function isObject(val) {
    return val != null && typeof val === 'object' && isarray(val) === false;
  };

  /*!
   * has-values <https://github.com/jonschlinkert/has-values>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var hasValues = function hasValue(o, noZero) {
    if (o === null || o === undefined) {
      return false;
    }

    if (typeof o === 'boolean') {
      return true;
    }

    if (typeof o === 'number') {
      if (o === 0 && noZero === true) {
        return false;
      }
      return true;
    }

    if (o.length !== undefined) {
      return o.length !== 0;
    }

    for (var key in o) {
      if (o.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
  };

  var hasValue = function(obj, prop, noZero) {
    if (isobject$1(obj)) {
      return hasValues(getValue(obj, prop), noZero);
    }
    return hasValues(obj, prop);
  };

  var unsetValue = function unset(obj, prop) {
    if (!isobject(obj)) {
      throw new TypeError('expected an object.');
    }
    if (obj.hasOwnProperty(prop)) {
      delete obj[prop];
      return true;
    }

    if (hasValue(obj, prop)) {
      var segs = prop.split('.');
      var last = segs.pop();
      while (segs.length && segs[segs.length - 1].slice(-1) === '\\') {
        last = segs.pop().slice(0, -1) + '.' + last;
      }
      while (segs.length) obj = obj[prop = segs.shift()];
      return (delete obj[last]);
    }
    return true;
  };

  var setValue$1 = function(obj, prop, val) {
    if (!isExtendable$5(obj)) {
      return obj;
    }

    if (Array.isArray(prop)) {
      prop = [].concat.apply([], prop).join('.');
    }

    if (typeof prop !== 'string') {
      return obj;
    }

    var keys = splitString(prop, {sep: '.', brackets: true});
    var len = keys.length;
    var idx = -1;
    var current = obj;

    while (++idx < len) {
      var key = keys[idx];
      if (idx !== len - 1) {
        if (!isExtendable$5(current[key])) {
          current[key] = {};
        }
        current = current[key];
        continue;
      }

      if (isPlainObject(current[key]) && isPlainObject(val)) {
        current[key] = extendShallow$5({}, current[key], val);
      } else {
        current[key] = val;
      }
    }

    return obj;
  };

  /**
   * Create a `Cache` constructor that when instantiated will
   * store values on the given `prop`.
   *
   * ```js
   * var Cache = require('cache-base').namespace('data');
   * var cache = new Cache();
   *
   * cache.set('foo', 'bar');
   * //=> {data: {foo: 'bar'}}
   * ```
   * @param {String} `prop` The property name to use for storing values.
   * @return {Function} Returns a custom `Cache` constructor
   * @api public
   */

  function namespace(prop) {

    /**
     * Create a new `Cache`. Internally the `Cache` constructor is created using
     * the `namespace` function, with `cache` defined as the storage object.
     *
     * ```js
     * var app = new Cache();
     * ```
     * @param {Object} `cache` Optionally pass an object to initialize with.
     * @constructor
     * @api public
     */

    function Cache(cache) {
      if (prop) {
        this[prop] = {};
      }
      if (cache) {
        this.set(cache);
      }
    }

    /**
     * Inherit Emitter
     */

    componentEmitter(Cache.prototype);

    /**
     * Assign `value` to `key`. Also emits `set` with
     * the key and value.
     *
     * ```js
     * app.on('set', function(key, val) {
     *   // do something when `set` is emitted
     * });
     *
     * app.set(key, value);
     *
     * // also takes an object or array
     * app.set({name: 'Halle'});
     * app.set([{foo: 'bar'}, {baz: 'quux'}]);
     * console.log(app);
     * //=> {name: 'Halle', foo: 'bar', baz: 'quux'}
     * ```
     *
     * @name .set
     * @emits `set` with `key` and `value` as arguments.
     * @param {String} `key`
     * @param {any} `value`
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    Cache.prototype.set = function(key, val) {
      if (Array.isArray(key) && arguments.length === 2) {
        key = toObjectPath(key);
      }
      if (isobject(key) || Array.isArray(key)) {
        this.visit('set', key);
      } else {
        setValue$1(prop ? this[prop] : this, key, val);
        this.emit('set', key, val);
      }
      return this;
    };

    /**
     * Union `array` to `key`. Also emits `set` with
     * the key and value.
     *
     * ```js
     * app.union('a.b', ['foo']);
     * app.union('a.b', ['bar']);
     * console.log(app.get('a'));
     * //=> {b: ['foo', 'bar']}
     * ```
     * @name .union
     * @param {String} `key`
     * @param {any} `value`
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    Cache.prototype.union = function(key, val) {
      if (Array.isArray(key) && arguments.length === 2) {
        key = toObjectPath(key);
      }
      var ctx = prop ? this[prop] : this;
      unionValue(ctx, key, arrayify$1(val));
      this.emit('union', val);
      return this;
    };

    /**
     * Return the value of `key`. Dot notation may be used
     * to get [nested property values][get-value].
     *
     * ```js
     * app.set('a.b.c', 'd');
     * app.get('a.b');
     * //=> {c: 'd'}
     *
     * app.get(['a', 'b']);
     * //=> {c: 'd'}
     * ```
     *
     * @name .get
     * @emits `get` with `key` and `value` as arguments.
     * @param {String} `key` The name of the property to get. Dot-notation may be used.
     * @return {any} Returns the value of `key`
     * @api public
     */

    Cache.prototype.get = function(key) {
      key = toObjectPath(arguments);

      var ctx = prop ? this[prop] : this;
      var val = getValue(ctx, key);

      this.emit('get', key, val);
      return val;
    };

    /**
     * Return true if app has a stored value for `key`,
     * false only if value is `undefined`.
     *
     * ```js
     * app.set('foo', 'bar');
     * app.has('foo');
     * //=> true
     * ```
     *
     * @name .has
     * @emits `has` with `key` and true or false as arguments.
     * @param {String} `key`
     * @return {Boolean}
     * @api public
     */

    Cache.prototype.has = function(key) {
      key = toObjectPath(arguments);

      var ctx = prop ? this[prop] : this;
      var val = getValue(ctx, key);

      var has = typeof val !== 'undefined';
      this.emit('has', key, has);
      return has;
    };

    /**
     * Delete one or more properties from the instance.
     *
     * ```js
     * app.del(); // delete all
     * // or
     * app.del('foo');
     * // or
     * app.del(['foo', 'bar']);
     * ```
     * @name .del
     * @emits `del` with the `key` as the only argument.
     * @param {String|Array} `key` Property name or array of property names.
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    Cache.prototype.del = function(key) {
      if (Array.isArray(key)) {
        this.visit('del', key);
      } else {
        unsetValue(prop ? this[prop] : this, key);
        this.emit('del', key);
      }
      return this;
    };

    /**
     * Reset the entire cache to an empty object.
     *
     * ```js
     * app.clear();
     * ```
     * @api public
     */

    Cache.prototype.clear = function() {
      if (prop) {
        this[prop] = {};
      }
    };

    /**
     * Visit `method` over the properties in the given object, or map
     * visit over the object-elements in an array.
     *
     * @name .visit
     * @param {String} `method` The name of the `base` method to call.
     * @param {Object|Array} `val` The object or array to iterate over.
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    Cache.prototype.visit = function(method, val) {
      collectionVisit(this, method, val);
      return this;
    };

    return Cache;
  }

  /**
   * Cast val to an array
   */

  function arrayify$1(val) {
    return val ? (Array.isArray(val) ? val : [val]) : [];
  }

  /**
   * Expose `Cache`
   */

  var cacheBase = namespace();

  /**
   * Expose `Cache.namespace`
   */

  var namespace_1 = namespace;
  cacheBase.namespace = namespace_1;

  var isExtendable$6 = function isExtendable(val) {
    return isPlainObject(val) || typeof val === 'function' || Array.isArray(val);
  };

  /*!
   * for-in <https://github.com/jonschlinkert/for-in>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var forIn = function forIn(obj, fn, thisArg) {
    for (var key in obj) {
      if (fn.call(thisArg, obj[key], key, obj) === false) {
        break;
      }
    }
  };

  function mixinDeep(target, objects) {
    var len = arguments.length, i = 0;
    while (++i < len) {
      var obj = arguments[i];
      if (isObject$6(obj)) {
        forIn(obj, copy, target);
      }
    }
    return target;
  }

  /**
   * Copy properties from the source object to the
   * target object.
   *
   * @param  {*} `val`
   * @param  {String} `key`
   */

  function copy(val, key) {
    if (key === '__proto__') {
      return;
    }

    var obj = this[key];
    if (isObject$6(val) && isObject$6(obj)) {
      mixinDeep(obj, val);
    } else {
      this[key] = val;
    }
  }

  /**
   * Returns true if `val` is an object or function.
   *
   * @param  {any} val
   * @return {Boolean}
   */

  function isObject$6(val) {
    return isExtendable$6(val) && !Array.isArray(val);
  }

  /**
   * Expose `mixinDeep`
   */

  var mixinDeep_1 = mixinDeep;

  /*!
   * pascalcase <https://github.com/jonschlinkert/pascalcase>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  function pascalcase(str) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string.');
    }
    str = str.replace(/([A-Z])/g, ' $1');
    if (str.length === 1) { return str.toUpperCase(); }
    str = str.replace(/^[\W_]+|[\W_]+$/g, '').toLowerCase();
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return str.replace(/[\W_]+(\w|$)/g, function (_, ch) {
      return ch.toUpperCase();
    });
  }

  var pascalcase_1 = pascalcase;

  var toString$7 = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$5 = function kindOf(val) {
    var type = typeof val;

    // primitivies
    if (type === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (type === 'string' || val instanceof String) {
      return 'string';
    }
    if (type === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (type === 'function' || val instanceof Function) {
      if (typeof val.constructor.name !== 'undefined' && val.constructor.name.slice(0, 9) === 'Generator') {
        return 'generatorfunction';
      }
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    type = toString$7.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }
    if (type === '[object Promise]') {
      return 'promise';
    }

    // buffer
    if (isBuffer$4(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }
    
    if (type === '[object Map Iterator]') {
      return 'mapiterator';
    }
    if (type === '[object Set Iterator]') {
      return 'setiterator';
    }
    if (type === '[object String Iterator]') {
      return 'stringiterator';
    }
    if (type === '[object Array Iterator]') {
      return 'arrayiterator';
    }
    
    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  /**
   * If you need to support Safari 5-7 (8-10 yr-old browser),
   * take a look at https://github.com/feross/is-buffer
   */

  function isBuffer$4(val) {
    return val.constructor
      && typeof val.constructor.isBuffer === 'function'
      && val.constructor.isBuffer(val);
  }

  var toString$8 = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$6 = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$8.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  // accessor descriptor properties
  var accessor$1 = {
    get: 'function',
    set: 'function',
    configurable: 'boolean',
    enumerable: 'boolean'
  };

  function isAccessorDescriptor$1(obj, prop) {
    if (typeof prop === 'string') {
      var val = Object.getOwnPropertyDescriptor(obj, prop);
      return typeof val !== 'undefined';
    }

    if (kindOf$6(obj) !== 'object') {
      return false;
    }

    if (has$1(obj, 'value') || has$1(obj, 'writable')) {
      return false;
    }

    if (!has$1(obj, 'get') || typeof obj.get !== 'function') {
      return false;
    }

    // tldr: it's valid to have "set" be undefined
    // "set" might be undefined if `Object.getOwnPropertyDescriptor`
    // was used to get the value, and only `get` was defined by the user
    if (has$1(obj, 'set') && typeof obj[key] !== 'function' && typeof obj[key] !== 'undefined') {
      return false;
    }

    for (var key in obj) {
      if (!accessor$1.hasOwnProperty(key)) {
        continue;
      }

      if (kindOf$6(obj[key]) === accessor$1[key]) {
        continue;
      }

      if (typeof obj[key] !== 'undefined') {
        return false;
      }
    }
    return true;
  }

  function has$1(obj, key) {
    return {}.hasOwnProperty.call(obj, key);
  }

  /**
   * Expose `isAccessorDescriptor`
   */

  var isAccessorDescriptor_1$1 = isAccessorDescriptor$1;

  var toString$9 = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$7 = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$9.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  // data descriptor properties
  var data = {
    configurable: 'boolean',
    enumerable: 'boolean',
    writable: 'boolean'
  };

  function isDataDescriptor$1(obj, prop) {
    if (kindOf$7(obj) !== 'object') {
      return false;
    }

    if (typeof prop === 'string') {
      var val = Object.getOwnPropertyDescriptor(obj, prop);
      return typeof val !== 'undefined';
    }

    if (!('value' in obj) && !('writable' in obj)) {
      return false;
    }

    for (var key in obj) {
      if (key === 'value') continue;

      if (!data.hasOwnProperty(key)) {
        continue;
      }

      if (kindOf$7(obj[key]) === data[key]) {
        continue;
      }

      if (typeof obj[key] !== 'undefined') {
        return false;
      }
    }
    return true;
  }

  /**
   * Expose `isDataDescriptor`
   */

  var isDataDescriptor_1 = isDataDescriptor$1;

  var isDescriptor$1 = function isDescriptor(obj, key) {
    if (kindOf$5(obj) !== 'object') {
      return false;
    }
    if ('get' in obj) {
      return isAccessorDescriptor_1$1(obj, key);
    }
    return isDataDescriptor_1(obj, key);
  };

  var defineProperty$3 = function defineProperty(obj, prop, val) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      throw new TypeError('expected an object or function.');
    }

    if (typeof prop !== 'string') {
      throw new TypeError('expected `prop` to be a string.');
    }

    if (isDescriptor$1(val) && ('set' in val || 'get' in val)) {
      return Object.defineProperty(obj, prop, val);
    }

    return Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });
  };

  /*!
   * copy-descriptor <https://github.com/jonschlinkert/copy-descriptor>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  /**
   * Copy a descriptor from one object to another.
   *
   * ```js
   * function App() {
   *   this.cache = {};
   * }
   * App.prototype.set = function(key, val) {
   *   this.cache[key] = val;
   *   return this;
   * };
   * Object.defineProperty(App.prototype, 'count', {
   *   get: function() {
   *     return Object.keys(this.cache).length;
   *   }
   * });
   *
   * copy(App.prototype, 'count', 'len');
   *
   * // create an instance
   * var app = new App();
   *
   * app.set('a', true);
   * app.set('b', true);
   * app.set('c', true);
   *
   * console.log(app.count);
   * //=> 3
   * console.log(app.len);
   * //=> 3
   * ```
   * @name copy
   * @param {Object} `receiver` The target object
   * @param {Object} `provider` The provider object
   * @param {String} `from` The key to copy on provider.
   * @param {String} `to` Optionally specify a new key name to use.
   * @return {Object}
   * @api public
   */

  var copyDescriptor = function copyDescriptor(receiver, provider, from, to) {
    if (!isObject$7(provider) && typeof provider !== 'function') {
      to = from;
      from = provider;
      provider = receiver;
    }
    if (!isObject$7(receiver) && typeof receiver !== 'function') {
      throw new TypeError('expected the first argument to be an object');
    }
    if (!isObject$7(provider) && typeof provider !== 'function') {
      throw new TypeError('expected provider to be an object');
    }

    if (typeof to !== 'string') {
      to = from;
    }
    if (typeof from !== 'string') {
      throw new TypeError('expected key to be a string');
    }

    if (!(from in provider)) {
      throw new Error('property "' + from + '" does not exist');
    }

    var val = Object.getOwnPropertyDescriptor(provider, from);
    if (val) Object.defineProperty(receiver, to, val);
  };

  function isObject$7(val) {
    return {}.toString.call(val) === '[object Object]';
  }

  /**
   * Copy static properties, prototype properties, and descriptors from one object to another.
   *
   * ```js
   * function App() {}
   * var proto = App.prototype;
   * App.prototype.set = function() {};
   * App.prototype.get = function() {};
   *
   * var obj = {};
   * copy(obj, proto);
   * ```
   * @param {Object} `receiver`
   * @param {Object} `provider`
   * @param {String|Array} `omit` One or more properties to omit
   * @return {Object}
   * @api public
   */

  function copy$1(receiver, provider, omit) {
    if (!isObject$8(receiver)) {
      throw new TypeError('expected receiving object to be an object.');
    }
    if (!isObject$8(provider)) {
      throw new TypeError('expected providing object to be an object.');
    }

    var props = nativeKeys(provider);
    var keys = Object.keys(provider);
    var len = props.length;
    omit = arrayify$2(omit);

    while (len--) {
      var key = props[len];

      if (has$2(keys, key)) {
        defineProperty$3(receiver, key, provider[key]);
      } else if (!(key in receiver) && !has$2(omit, key)) {
        copyDescriptor(receiver, provider, key);
      }
    }
  }
  /**
   * Return true if the given value is an object or function
   */

  function isObject$8(val) {
    return kindOf$3(val) === 'object' || typeof val === 'function';
  }

  /**
   * Returns true if an array has any of the given elements, or an
   * object has any of the give keys.
   *
   * ```js
   * has(['a', 'b', 'c'], 'c');
   * //=> true
   *
   * has(['a', 'b', 'c'], ['c', 'z']);
   * //=> true
   *
   * has({a: 'b', c: 'd'}, ['c', 'z']);
   * //=> true
   * ```
   * @param {Object} `obj`
   * @param {String|Array} `val`
   * @return {Boolean}
   */

  function has$2(obj, val) {
    val = arrayify$2(val);
    var len = val.length;

    if (isObject$8(obj)) {
      for (var key in obj) {
        if (val.indexOf(key) > -1) {
          return true;
        }
      }

      var keys = nativeKeys(obj);
      return has$2(keys, val);
    }

    if (Array.isArray(obj)) {
      var arr = obj;
      while (len--) {
        if (arr.indexOf(val[len]) > -1) {
          return true;
        }
      }
      return false;
    }

    throw new TypeError('expected an array or object.');
  }

  /**
   * Cast the given value to an array.
   *
   * ```js
   * arrayify('foo');
   * //=> ['foo']
   *
   * arrayify(['foo']);
   * //=> ['foo']
   * ```
   *
   * @param {String|Array} `val`
   * @return {Array}
   */

  function arrayify$2(val) {
    return val ? (Array.isArray(val) ? val : [val]) : [];
  }

  /**
   * Returns true if a value has a `contructor`
   *
   * ```js
   * hasConstructor({});
   * //=> true
   *
   * hasConstructor(Object.create(null));
   * //=> false
   * ```
   * @param  {Object} `value`
   * @return {Boolean}
   */

  function hasConstructor(val) {
    return isObject$8(val) && typeof val.constructor !== 'undefined';
  }

  /**
   * Get the native `ownPropertyNames` from the constructor of the
   * given `object`. An empty array is returned if the object does
   * not have a constructor.
   *
   * ```js
   * nativeKeys({a: 'b', b: 'c', c: 'd'})
   * //=> ['a', 'b', 'c']
   *
   * nativeKeys(function(){})
   * //=> ['length', 'caller']
   * ```
   *
   * @param  {Object} `obj` Object that has a `constructor`.
   * @return {Array} Array of keys.
   */

  function nativeKeys(val) {
    if (!hasConstructor(val)) return [];
    return Object.getOwnPropertyNames(val);
  }

  /**
   * Expose `copy`
   */

  var objectCopy = copy$1;

  /**
   * Expose `copy.has` for tests
   */

  var has_1 = has$2;
  objectCopy.has = has_1;

  /**
   * Returns a function for extending the static properties,
   * prototype properties, and descriptors from the `Parent`
   * constructor onto `Child` constructors.
   *
   * ```js
   * var extend = require('static-extend');
   * Parent.extend = extend(Parent);
   *
   * // optionally pass a custom merge function as the second arg
   * Parent.extend = extend(Parent, function(Child) {
   *   Child.prototype.mixin = function(key, val) {
   *     Child.prototype[key] = val;
   *   };
   * });
   *
   * // extend "child" constructors
   * Parent.extend(Child);
   *
   * // optionally define prototype methods as the second arg
   * Parent.extend(Child, {
   *   foo: function() {},
   *   bar: function() {}
   * });
   * ```
   * @param {Function} `Parent` Parent ctor
   * @param {Function} `extendFn` Optional extend function for handling any necessary custom merging. Useful when updating methods that require a specific prototype.
   *   @param {Function} `Child` Child ctor
   *   @param {Object} `proto` Optionally pass additional prototype properties to inherit.
   *   @return {Object}
   * @api public
   */

  function extend$1(Parent, extendFn) {
    if (typeof Parent !== 'function') {
      throw new TypeError('expected Parent to be a function.');
    }

    return function(Ctor, proto) {
      if (typeof Ctor !== 'function') {
        throw new TypeError('expected Ctor to be a function.');
      }

      util.inherits(Ctor, Parent);
      objectCopy(Ctor, Parent);

      // proto can be null or a plain object
      if (typeof proto === 'object') {
        var obj = Object.create(proto);

        for (var k in obj) {
          Ctor.prototype[k] = obj[k];
        }
      }

      // keep a reference to the parent prototype
      defineProperty$3(Ctor.prototype, '_parent_', {
        configurable: true,
        set: function() {},
        get: function() {
          return Parent.prototype;
        }
      });

      if (typeof extendFn === 'function') {
        extendFn(Ctor, Parent);
      }

      Ctor.extend = extend$1(Ctor, extendFn);
    };
  }
  /**
   * Expose `extend`
   */

  var staticExtend = extend$1;

  var classUtils = createCommonjsModule(function (module) {







  /**
   * Expose class utils
   */

  var cu = module.exports;

  /**
   * Expose class utils: `cu`
   */

  cu.isObject = function isObject(val) {
    return isobject(val) || typeof val === 'function';
  };

  /**
   * Returns true if an array has any of the given elements, or an
   * object has any of the give keys.
   *
   * ```js
   * cu.has(['a', 'b', 'c'], 'c');
   * //=> true
   *
   * cu.has(['a', 'b', 'c'], ['c', 'z']);
   * //=> true
   *
   * cu.has({a: 'b', c: 'd'}, ['c', 'z']);
   * //=> true
   * ```
   * @param {Object} `obj`
   * @param {String|Array} `val`
   * @return {Boolean}
   * @api public
   */

  cu.has = function has(obj, val) {
    val = cu.arrayify(val);
    var len = val.length;

    if (cu.isObject(obj)) {
      for (var key in obj) {
        if (val.indexOf(key) > -1) {
          return true;
        }
      }

      var keys = cu.nativeKeys(obj);
      return cu.has(keys, val);
    }

    if (Array.isArray(obj)) {
      var arr = obj;
      while (len--) {
        if (arr.indexOf(val[len]) > -1) {
          return true;
        }
      }
      return false;
    }

    throw new TypeError('expected an array or object.');
  };

  /**
   * Returns true if an array or object has all of the given values.
   *
   * ```js
   * cu.hasAll(['a', 'b', 'c'], 'c');
   * //=> true
   *
   * cu.hasAll(['a', 'b', 'c'], ['c', 'z']);
   * //=> false
   *
   * cu.hasAll({a: 'b', c: 'd'}, ['c', 'z']);
   * //=> false
   * ```
   * @param {Object|Array} `val`
   * @param {String|Array} `values`
   * @return {Boolean}
   * @api public
   */

  cu.hasAll = function hasAll(val, values) {
    values = cu.arrayify(values);
    var len = values.length;
    while (len--) {
      if (!cu.has(val, values[len])) {
        return false;
      }
    }
    return true;
  };

  /**
   * Cast the given value to an array.
   *
   * ```js
   * cu.arrayify('foo');
   * //=> ['foo']
   *
   * cu.arrayify(['foo']);
   * //=> ['foo']
   * ```
   *
   * @param {String|Array} `val`
   * @return {Array}
   * @api public
   */

  cu.arrayify = function arrayify(val) {
    return val ? (Array.isArray(val) ? val : [val]) : [];
  };

  /**
   * Noop
   */

  cu.noop = function noop() {
    return;
  };

  /**
   * Returns the first argument passed to the function.
   */

  cu.identity = function identity(val) {
    return val;
  };

  /**
   * Returns true if a value has a `contructor`
   *
   * ```js
   * cu.hasConstructor({});
   * //=> true
   *
   * cu.hasConstructor(Object.create(null));
   * //=> false
   * ```
   * @param  {Object} `value`
   * @return {Boolean}
   * @api public
   */

  cu.hasConstructor = function hasConstructor(val) {
    return cu.isObject(val) && typeof val.constructor !== 'undefined';
  };

  /**
   * Get the native `ownPropertyNames` from the constructor of the
   * given `object`. An empty array is returned if the object does
   * not have a constructor.
   *
   * ```js
   * cu.nativeKeys({a: 'b', b: 'c', c: 'd'})
   * //=> ['a', 'b', 'c']
   *
   * cu.nativeKeys(function(){})
   * //=> ['length', 'caller']
   * ```
   *
   * @param  {Object} `obj` Object that has a `constructor`.
   * @return {Array} Array of keys.
   * @api public
   */

  cu.nativeKeys = function nativeKeys(val) {
    if (!cu.hasConstructor(val)) return [];
    var keys = Object.getOwnPropertyNames(val);
    if ('caller' in val) keys.push('caller');
    return keys;
  };

  /**
   * Returns property descriptor `key` if it's an "own" property
   * of the given object.
   *
   * ```js
   * function App() {}
   * Object.defineProperty(App.prototype, 'count', {
   *   get: function() {
   *     return Object.keys(this).length;
   *   }
   * });
   * cu.getDescriptor(App.prototype, 'count');
   * // returns:
   * // {
   * //   get: [Function],
   * //   set: undefined,
   * //   enumerable: false,
   * //   configurable: false
   * // }
   * ```
   *
   * @param {Object} `obj`
   * @param {String} `key`
   * @return {Object} Returns descriptor `key`
   * @api public
   */

  cu.getDescriptor = function getDescriptor(obj, key) {
    if (!cu.isObject(obj)) {
      throw new TypeError('expected an object.');
    }
    if (typeof key !== 'string') {
      throw new TypeError('expected key to be a string.');
    }
    return Object.getOwnPropertyDescriptor(obj, key);
  };

  /**
   * Copy a descriptor from one object to another.
   *
   * ```js
   * function App() {}
   * Object.defineProperty(App.prototype, 'count', {
   *   get: function() {
   *     return Object.keys(this).length;
   *   }
   * });
   * var obj = {};
   * cu.copyDescriptor(obj, App.prototype, 'count');
   * ```
   * @param {Object} `receiver`
   * @param {Object} `provider`
   * @param {String} `name`
   * @return {Object}
   * @api public
   */

  cu.copyDescriptor = function copyDescriptor(receiver, provider, name) {
    if (!cu.isObject(receiver)) {
      throw new TypeError('expected receiving object to be an object.');
    }
    if (!cu.isObject(provider)) {
      throw new TypeError('expected providing object to be an object.');
    }
    if (typeof name !== 'string') {
      throw new TypeError('expected name to be a string.');
    }

    var val = cu.getDescriptor(provider, name);
    if (val) Object.defineProperty(receiver, name, val);
  };

  /**
   * Copy static properties, prototype properties, and descriptors
   * from one object to another.
   *
   * @param {Object} `receiver`
   * @param {Object} `provider`
   * @param {String|Array} `omit` One or more properties to omit
   * @return {Object}
   * @api public
   */

  cu.copy = function copy(receiver, provider, omit) {
    if (!cu.isObject(receiver)) {
      throw new TypeError('expected receiving object to be an object.');
    }
    if (!cu.isObject(provider)) {
      throw new TypeError('expected providing object to be an object.');
    }
    var props = Object.getOwnPropertyNames(provider);
    var keys = Object.keys(provider);
    var len = props.length,
      key;
    omit = cu.arrayify(omit);

    while (len--) {
      key = props[len];

      if (cu.has(keys, key)) {
        defineProperty$3(receiver, key, provider[key]);
      } else if (!(key in receiver) && !cu.has(omit, key)) {
        cu.copyDescriptor(receiver, provider, key);
      }
    }
  };

  /**
   * Inherit the static properties, prototype properties, and descriptors
   * from of an object.
   *
   * @param {Object} `receiver`
   * @param {Object} `provider`
   * @param {String|Array} `omit` One or more properties to omit
   * @return {Object}
   * @api public
   */

  cu.inherit = function inherit(receiver, provider, omit) {
    if (!cu.isObject(receiver)) {
      throw new TypeError('expected receiving object to be an object.');
    }
    if (!cu.isObject(provider)) {
      throw new TypeError('expected providing object to be an object.');
    }

    var keys = [];
    for (var key in provider) {
      keys.push(key);
      receiver[key] = provider[key];
    }

    keys = keys.concat(cu.arrayify(omit));

    var a = provider.prototype || provider;
    var b = receiver.prototype || receiver;
    cu.copy(b, a, keys);
  };

  /**
   * Returns a function for extending the static properties,
   * prototype properties, and descriptors from the `Parent`
   * constructor onto `Child` constructors.
   *
   * ```js
   * var extend = cu.extend(Parent);
   * Parent.extend(Child);
   *
   * // optional methods
   * Parent.extend(Child, {
   *   foo: function() {},
   *   bar: function() {}
   * });
   * ```
   * @param {Function} `Parent` Parent ctor
   * @param {Function} `extend` Optional extend function to handle custom extensions. Useful when updating methods that require a specific prototype.
   *   @param {Function} `Child` Child ctor
   *   @param {Object} `proto` Optionally pass additional prototype properties to inherit.
   *   @return {Object}
   * @api public
   */

  cu.extend = function() {
    // keep it lazy, instead of assigning to `cu.extend`
    return staticExtend.apply(null, arguments);
  };

  /**
   * Bubble up events emitted from static methods on the Parent ctor.
   *
   * @param {Object} `Parent`
   * @param {Array} `events` Event names to bubble up
   * @api public
   */

  cu.bubble = function(Parent, events$$1) {
    events$$1 = events$$1 || [];
    Parent.bubble = function(Child, arr) {
      if (Array.isArray(arr)) {
        events$$1 = arrUnion([], events$$1, arr);
      }
      var len = events$$1.length;
      var idx = -1;
      while (++idx < len) {
        var name = events$$1[idx];
        Parent.on(name, Child.emit.bind(Child, name));
      }
      cu.bubble(Child, events$$1);
    };
  };
  });

  /**
   * Optionally define a custom `cache` namespace to use.
   */

  function namespace$1(name) {
    var Cache = name ? cacheBase.namespace(name) : cacheBase;
    var fns = [];

    /**
     * Create an instance of `Base` with the given `config` and `options`.
     *
     * ```js
     * // initialize with `config` and `options`
     * var app = new Base({isApp: true}, {abc: true});
     * app.set('foo', 'bar');
     *
     * // values defined with the given `config` object will be on the root of the instance
     * console.log(app.baz); //=> undefined
     * console.log(app.foo); //=> 'bar'
     * // or use `.get`
     * console.log(app.get('isApp')); //=> true
     * console.log(app.get('foo')); //=> 'bar'
     *
     * // values defined with the given `options` object will be on `app.options
     * console.log(app.options.abc); //=> true
     * ```
     *
     * @param {Object} `config` If supplied, this object is passed to [cache-base][] to merge onto the the instance upon instantiation.
     * @param {Object} `options` If supplied, this object is used to initialize the `base.options` object.
     * @api public
     */

    function Base(config, options) {
      if (!(this instanceof Base)) {
        return new Base(config, options);
      }
      Cache.call(this, config);
      this.is('base');
      this.initBase(config, options);
    }

    /**
     * Inherit cache-base
     */

    util.inherits(Base, Cache);

    /**
     * Add static emitter methods
     */

    componentEmitter(Base);

    /**
     * Initialize `Base` defaults with the given `config` object
     */

    Base.prototype.initBase = function(config, options) {
      this.options = mixinDeep_1({}, this.options, options);
      this.cache = this.cache || {};
      this.define('registered', {});
      if (name) this[name] = {};

      // make `app._callbacks` non-enumerable
      this.define('_callbacks', this._callbacks);
      if (isobject(config)) {
        this.visit('set', config);
      }
      Base.run(this, 'use', fns);
    };

    /**
     * Set the given `name` on `app._name` and `app.is*` properties. Used for doing
     * lookups in plugins.
     *
     * ```js
     * app.is('foo');
     * console.log(app._name);
     * //=> 'foo'
     * console.log(app.isFoo);
     * //=> true
     * app.is('bar');
     * console.log(app.isFoo);
     * //=> true
     * console.log(app.isBar);
     * //=> true
     * console.log(app._name);
     * //=> 'bar'
     * ```
     * @name .is
     * @param {String} `name`
     * @return {Boolean}
     * @api public
     */

    Base.prototype.is = function(name) {
      if (typeof name !== 'string') {
        throw new TypeError('expected name to be a string');
      }
      this.define('is' + pascalcase_1(name), true);
      this.define('_name', name);
      this.define('_appname', name);
      return this;
    };

    /**
     * Returns true if a plugin has already been registered on an instance.
     *
     * Plugin implementors are encouraged to use this first thing in a plugin
     * to prevent the plugin from being called more than once on the same
     * instance.
     *
     * ```js
     * var base = new Base();
     * base.use(function(app) {
     *   if (app.isRegistered('myPlugin')) return;
     *   // do stuff to `app`
     * });
     *
     * // to also record the plugin as being registered
     * base.use(function(app) {
     *   if (app.isRegistered('myPlugin', true)) return;
     *   // do stuff to `app`
     * });
     * ```
     * @name .isRegistered
     * @emits `plugin` Emits the name of the plugin being registered. Useful for unit tests, to ensure plugins are only registered once.
     * @param {String} `name` The plugin name.
     * @param {Boolean} `register` If the plugin if not already registered, to record it as being registered pass `true` as the second argument.
     * @return {Boolean} Returns true if a plugin is already registered.
     * @api public
     */

    Base.prototype.isRegistered = function(name, register) {
      if (this.registered.hasOwnProperty(name)) {
        return true;
      }
      if (register !== false) {
        this.registered[name] = true;
        this.emit('plugin', name);
      }
      return false;
    };

    /**
     * Define a plugin function to be called immediately upon init. Plugins are chainable
     * and expose the following arguments to the plugin function:
     *
     * - `app`: the current instance of `Base`
     * - `base`: the [first ancestor instance](#base) of `Base`
     *
     * ```js
     * var app = new Base()
     *   .use(foo)
     *   .use(bar)
     *   .use(baz)
     * ```
     * @name .use
     * @param {Function} `fn` plugin function to call
     * @return {Object} Returns the item instance for chaining.
     * @api public
     */

    Base.prototype.use = function(fn) {
      fn.call(this, this);
      return this;
    };

    /**
     * The `.define` method is used for adding non-enumerable property on the instance.
     * Dot-notation is **not supported** with `define`.
     *
     * ```js
     * // arbitrary `render` function using lodash `template`
     * app.define('render', function(str, locals) {
     *   return _.template(str)(locals);
     * });
     * ```
     * @name .define
     * @param {String} `key` The name of the property to define.
     * @param {any} `value`
     * @return {Object} Returns the instance for chaining.
     * @api public
     */

    Base.prototype.define = function(key, val) {
      if (isobject(key)) {
        return this.visit('define', key);
      }
      defineProperty$2(this, key, val);
      return this;
    };

    /**
     * Mix property `key` onto the Base prototype. If base is inherited using
     * `Base.extend` this method will be overridden by a new `mixin` method that will
     * only add properties to the prototype of the inheriting application.
     *
     * ```js
     * app.mixin('foo', function() {
     *   // do stuff
     * });
     * ```
     * @name .mixin
     * @param {String} `key`
     * @param {Object|Array} `val`
     * @return {Object} Returns the `base` instance for chaining.
     * @api public
     */

    Base.prototype.mixin = function(key, val) {
      Base.prototype[key] = val;
      return this;
    };

    /**
     * Non-enumberable mixin array, used by the static [Base.mixin]() method.
     */

    Base.prototype.mixins = Base.prototype.mixins || [];

    /**
     * Getter/setter used when creating nested instances of `Base`, for storing a reference
     * to the first ancestor instance. This works by setting an instance of `Base` on the `parent`
     * property of a "child" instance. The `base` property defaults to the current instance if
     * no `parent` property is defined.
     *
     * ```js
     * // create an instance of `Base`, this is our first ("base") instance
     * var first = new Base();
     * first.foo = 'bar'; // arbitrary property, to make it easier to see what's happening later
     *
     * // create another instance
     * var second = new Base();
     * // create a reference to the first instance (`first`)
     * second.parent = first;
     *
     * // create another instance
     * var third = new Base();
     * // create a reference to the previous instance (`second`)
     * // repeat this pattern every time a "child" instance is created
     * third.parent = second;
     *
     * // we can always access the first instance using the `base` property
     * console.log(first.base.foo);
     * //=> 'bar'
     * console.log(second.base.foo);
     * //=> 'bar'
     * console.log(third.base.foo);
     * //=> 'bar'
     * // and now you know how to get to third base ;)
     * ```
     * @name .base
     * @api public
     */

    Object.defineProperty(Base.prototype, 'base', {
      configurable: true,
      get: function() {
        return this.parent ? this.parent.base : this;
      }
    });

    /**
     * Static method for adding global plugin functions that will
     * be added to an instance when created.
     *
     * ```js
     * Base.use(function(app) {
     *   app.foo = 'bar';
     * });
     * var app = new Base();
     * console.log(app.foo);
     * //=> 'bar'
     * ```
     * @name #use
     * @param {Function} `fn` Plugin function to use on each instance.
     * @return {Object} Returns the `Base` constructor for chaining
     * @api public
     */

    defineProperty$2(Base, 'use', function(fn) {
      fns.push(fn);
      return Base;
    });

    /**
     * Run an array of functions by passing each function
     * to a method on the given object specified by the given property.
     *
     * @param  {Object} `obj` Object containing method to use.
     * @param  {String} `prop` Name of the method on the object to use.
     * @param  {Array} `arr` Array of functions to pass to the method.
     */

    defineProperty$2(Base, 'run', function(obj, prop, arr) {
      var len = arr.length, i = 0;
      while (len--) {
        obj[prop](arr[i++]);
      }
      return Base;
    });

    /**
     * Static method for inheriting the prototype and static methods of the `Base` class.
     * This method greatly simplifies the process of creating inheritance-based applications.
     * See [static-extend][] for more details.
     *
     * ```js
     * var extend = cu.extend(Parent);
     * Parent.extend(Child);
     *
     * // optional methods
     * Parent.extend(Child, {
     *   foo: function() {},
     *   bar: function() {}
     * });
     * ```
     * @name #extend
     * @param {Function} `Ctor` constructor to extend
     * @param {Object} `methods` Optional prototype properties to mix in.
     * @return {Object} Returns the `Base` constructor for chaining
     * @api public
     */

    defineProperty$2(Base, 'extend', classUtils.extend(Base, function(Ctor, Parent) {
      Ctor.prototype.mixins = Ctor.prototype.mixins || [];

      defineProperty$2(Ctor, 'mixin', function(fn) {
        var mixin = fn(Ctor.prototype, Ctor);
        if (typeof mixin === 'function') {
          Ctor.prototype.mixins.push(mixin);
        }
        return Ctor;
      });

      defineProperty$2(Ctor, 'mixins', function(Child) {
        Base.run(Child, 'mixin', Ctor.prototype.mixins);
        return Ctor;
      });

      Ctor.prototype.mixin = function(key, value) {
        Ctor.prototype[key] = value;
        return this;
      };
      return Base;
    }));

    /**
     * Used for adding methods to the `Base` prototype, and/or to the prototype of child instances.
     * When a mixin function returns a function, the returned function is pushed onto the `.mixins`
     * array, making it available to be used on inheriting classes whenever `Base.mixins()` is
     * called (e.g. `Base.mixins(Child)`).
     *
     * ```js
     * Base.mixin(function(proto) {
     *   proto.foo = function(msg) {
     *     return 'foo ' + msg;
     *   };
     * });
     * ```
     * @name #mixin
     * @param {Function} `fn` Function to call
     * @return {Object} Returns the `Base` constructor for chaining
     * @api public
     */

    defineProperty$2(Base, 'mixin', function(fn) {
      var mixin = fn(Base.prototype, Base);
      if (typeof mixin === 'function') {
        Base.prototype.mixins.push(mixin);
      }
      return Base;
    });

    /**
     * Static method for running global mixin functions against a child constructor.
     * Mixins must be registered before calling this method.
     *
     * ```js
     * Base.extend(Child);
     * Base.mixins(Child);
     * ```
     * @name #mixins
     * @param {Function} `Child` Constructor function of a child class
     * @return {Object} Returns the `Base` constructor for chaining
     * @api public
     */

    defineProperty$2(Base, 'mixins', function(Child) {
      Base.run(Child, 'mixin', Base.prototype.mixins);
      return Base;
    });

    /**
     * Similar to `util.inherit`, but copies all static properties, prototype properties, and
     * getters/setters from `Provider` to `Receiver`. See [class-utils][]{#inherit} for more details.
     *
     * ```js
     * Base.inherit(Foo, Bar);
     * ```
     * @name #inherit
     * @param {Function} `Receiver` Receiving (child) constructor
     * @param {Function} `Provider` Providing (parent) constructor
     * @return {Object} Returns the `Base` constructor for chaining
     * @api public
     */

    defineProperty$2(Base, 'inherit', classUtils.inherit);
    defineProperty$2(Base, 'bubble', classUtils.bubble);
    return Base;
  }

  /**
   * Expose `Base` with default settings
   */

  var base = namespace$1();

  /**
   * Allow users to define a namespace
   */

  var namespace_1$1 = namespace$1;
  base.namespace = namespace_1$1;

  /*!
   * use <https://github.com/jonschlinkert/use>
   *
   * Copyright (c) 2015-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var use = function base(app, options) {
    if (!isObject$9(app) && typeof app !== 'function') {
      throw new TypeError('expected an object or function');
    }

    var opts = isObject$9(options) ? options : {};
    var prop = typeof opts.prop === 'string' ? opts.prop : 'fns';
    if (!Array.isArray(app[prop])) {
      define$1(app, prop, []);
    }

    /**
     * Define a plugin function to be passed to use. The only
     * parameter exposed to the plugin is `app`, the object or function.
     * passed to `use(app)`. `app` is also exposed as `this` in plugins.
     *
     * Additionally, **if a plugin returns a function, the function will
     * be pushed onto the `fns` array**, allowing the plugin to be
     * called at a later point by the `run` method.
     *
     * ```js
     * var use = require('use');
     *
     * // define a plugin
     * function foo(app) {
     *   // do stuff
     * }
     *
     * var app = function(){};
     * use(app);
     *
     * // register plugins
     * app.use(foo);
     * app.use(bar);
     * app.use(baz);
     * ```
     * @name .use
     * @param {Function} `fn` plugin function to call
     * @api public
     */

    define$1(app, 'use', use);

    /**
     * Run all plugins on `fns`. Any plugin that returns a function
     * when called by `use` is pushed onto the `fns` array.
     *
     * ```js
     * var config = {};
     * app.run(config);
     * ```
     * @name .run
     * @param {Object} `value` Object to be modified by plugins.
     * @return {Object} Returns the object passed to `run`
     * @api public
     */

    define$1(app, 'run', function(val) {
      if (!isObject$9(val)) return;

      if (!val.use || !val.run) {
        define$1(val, prop, val[prop] || []);
        define$1(val, 'use', use);
      }

      if (!val[prop] || val[prop].indexOf(base) === -1) {
        val.use(base);
      }

      var self = this || app;
      var fns = self[prop];
      var len = fns.length;
      var idx = -1;

      while (++idx < len) {
        val.use(fns[idx]);
      }
      return val;
    });

    /**
     * Call plugin `fn`. If a function is returned push it into the
     * `fns` array to be called by the `run` method.
     */

    function use(type, fn, options) {
      var offset = 1;

      if (typeof type === 'string' || Array.isArray(type)) {
        fn = wrap(type, fn);
        offset++;
      } else {
        options = fn;
        fn = type;
      }

      if (typeof fn !== 'function') {
        throw new TypeError('expected a function');
      }

      var self = this || app;
      var fns = self[prop];

      var args = [].slice.call(arguments, offset);
      args.unshift(self);

      if (typeof opts.hook === 'function') {
        opts.hook.apply(self, args);
      }

      var val = fn.apply(self, args);
      if (typeof val === 'function' && fns.indexOf(val) === -1) {
        fns.push(val);
      }
      return self;
    }

    /**
     * Wrap a named plugin function so that it's only called on objects of the
     * given `type`
     *
     * @param {String} `type`
     * @param {Function} `fn` Plugin function
     * @return {Function}
     */

    function wrap(type, fn) {
      return function plugin() {
        return this.type === type ? fn.apply(this, arguments) : plugin;
      };
    }

    return app;
  };

  function isObject$9(val) {
    return val && typeof val === 'object' && !Array.isArray(val);
  }

  function define$1(obj, key, val) {
    Object.defineProperty(obj, key, {
      configurable: true,
      writable: true,
      value: val
    });
  }

  /**
   * Helpers.
   */

  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;

  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  var ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === 'string' && val.length > 0) {
      return parse$1(val);
    } else if (type === 'number' && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      'val is not a non-empty string or a valid number. val=' +
        JSON.stringify(val)
    );
  };

  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */

  function parse$1(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y;
      case 'days':
      case 'day':
      case 'd':
        return n * d;
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h;
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m;
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s;
      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;
      default:
        return undefined;
    }
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtShort(ms) {
    if (ms >= d) {
      return Math.round(ms / d) + 'd';
    }
    if (ms >= h) {
      return Math.round(ms / h) + 'h';
    }
    if (ms >= m) {
      return Math.round(ms / m) + 'm';
    }
    if (ms >= s) {
      return Math.round(ms / s) + 's';
    }
    return ms + 'ms';
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtLong(ms) {
    return plural(ms, d, 'day') ||
      plural(ms, h, 'hour') ||
      plural(ms, m, 'minute') ||
      plural(ms, s, 'second') ||
      ms + ' ms';
  }

  /**
   * Pluralization helper.
   */

  function plural(ms, n, name) {
    if (ms < n) {
      return;
    }
    if (ms < n * 1.5) {
      return Math.floor(ms / n) + ' ' + name;
    }
    return Math.ceil(ms / n) + ' ' + name + 's';
  }

  var debug = createCommonjsModule(function (module, exports) {
  /**
   * This is the common logic for both the Node.js and web browser
   * implementations of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
  exports.coerce = coerce;
  exports.disable = disable;
  exports.enable = enable;
  exports.enabled = enabled;
  exports.humanize = ms;

  /**
   * The currently active debug mode names, and names to skip.
   */

  exports.names = [];
  exports.skips = [];

  /**
   * Map of special "%n" handling functions, for the debug "format" argument.
   *
   * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
   */

  exports.formatters = {};

  /**
   * Previous log timestamp.
   */

  var prevTime;

  /**
   * Select a color.
   * @param {String} namespace
   * @return {Number}
   * @api private
   */

  function selectColor(namespace) {
    var hash = 0, i;

    for (i in namespace) {
      hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    return exports.colors[Math.abs(hash) % exports.colors.length];
  }

  /**
   * Create a debugger with the given `namespace`.
   *
   * @param {String} namespace
   * @return {Function}
   * @api public
   */

  function createDebug(namespace) {

    function debug() {
      // disabled?
      if (!debug.enabled) return;

      var self = debug;

      // set `diff` timestamp
      var curr = +new Date();
      var ms$$1 = curr - (prevTime || curr);
      self.diff = ms$$1;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;

      // turn the `arguments` into a proper Array
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }

      args[0] = exports.coerce(args[0]);

      if ('string' !== typeof args[0]) {
        // anything else let's inspect with %O
        args.unshift('%O');
      }

      // apply any `formatters` transformations
      var index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
        // if we encounter an escaped % then don't increase the array index
        if (match === '%%') return match;
        index++;
        var formatter = exports.formatters[format];
        if ('function' === typeof formatter) {
          var val = args[index];
          match = formatter.call(self, val);

          // now we need to remove `args[index]` since it's inlined in the `format`
          args.splice(index, 1);
          index--;
        }
        return match;
      });

      // apply env-specific formatting (colors, etc.)
      exports.formatArgs.call(self, args);

      var logFn = debug.log || exports.log || console.log.bind(console);
      logFn.apply(self, args);
    }

    debug.namespace = namespace;
    debug.enabled = exports.enabled(namespace);
    debug.useColors = exports.useColors();
    debug.color = selectColor(namespace);

    // env-specific initialization logic for debug instances
    if ('function' === typeof exports.init) {
      exports.init(debug);
    }

    return debug;
  }

  /**
   * Enables a debug mode by namespaces. This can include modes
   * separated by a colon and wildcards.
   *
   * @param {String} namespaces
   * @api public
   */

  function enable(namespaces) {
    exports.save(namespaces);

    exports.names = [];
    exports.skips = [];

    var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    var len = split.length;

    for (var i = 0; i < len; i++) {
      if (!split[i]) continue; // ignore empty strings
      namespaces = split[i].replace(/\*/g, '.*?');
      if (namespaces[0] === '-') {
        exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
      } else {
        exports.names.push(new RegExp('^' + namespaces + '$'));
      }
    }
  }

  /**
   * Disable debug output.
   *
   * @api public
   */

  function disable() {
    exports.enable('');
  }

  /**
   * Returns true if the given mode name is enabled, false otherwise.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */

  function enabled(name) {
    var i, len;
    for (i = 0, len = exports.skips.length; i < len; i++) {
      if (exports.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = exports.names.length; i < len; i++) {
      if (exports.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Coerce `val`.
   *
   * @param {Mixed} val
   * @return {Mixed}
   * @api private
   */

  function coerce(val) {
    if (val instanceof Error) return val.stack || val.message;
    return val;
  }
  });
  var debug_1 = debug.coerce;
  var debug_2 = debug.disable;
  var debug_3 = debug.enable;
  var debug_4 = debug.enabled;
  var debug_5 = debug.humanize;
  var debug_6 = debug.names;
  var debug_7 = debug.skips;
  var debug_8 = debug.formatters;

  var browser = createCommonjsModule(function (module, exports) {
  /**
   * This is the web browser implementation of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = debug;
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = 'undefined' != typeof chrome
                 && 'undefined' != typeof chrome.storage
                    ? chrome.storage.local
                    : localstorage();

  /**
   * Colors.
   */

  exports.colors = [
    'lightseagreen',
    'forestgreen',
    'goldenrod',
    'dodgerblue',
    'darkorchid',
    'crimson'
  ];

  /**
   * Currently only WebKit-based Web Inspectors, Firefox >= v31,
   * and the Firebug extension (any Firefox version) are known
   * to support "%c" CSS customizations.
   *
   * TODO: add a `localStorage` variable to explicitly enable/disable colors
   */

  function useColors() {
    // NB: In an Electron preload script, document will be defined but not fully
    // initialized. Since we know we're in Chrome, we'll just detect this case
    // explicitly
    if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
      return true;
    }

    // is webkit? http://stackoverflow.com/a/16459606/376773
    // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
      // is firebug? http://stackoverflow.com/a/398120/376773
      (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
      // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
      // double check webkit in userAgent just in case we are in a worker
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
  }

  /**
   * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
   */

  exports.formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (err) {
      return '[UnexpectedJSONParseError]: ' + err.message;
    }
  };


  /**
   * Colorize log arguments if enabled.
   *
   * @api public
   */

  function formatArgs(args) {
    var useColors = this.useColors;

    args[0] = (useColors ? '%c' : '')
      + this.namespace
      + (useColors ? ' %c' : ' ')
      + args[0]
      + (useColors ? '%c ' : ' ')
      + '+' + exports.humanize(this.diff);

    if (!useColors) return;

    var c = 'color: ' + this.color;
    args.splice(1, 0, c, 'color: inherit');

    // the final "%c" is somewhat tricky, because there could be other
    // arguments passed either before or after the %c, so we need to
    // figure out the correct index to insert the CSS into
    var index = 0;
    var lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, function(match) {
      if ('%%' === match) return;
      index++;
      if ('%c' === match) {
        // we only are interested in the *last* %c
        // (the user may have provided their own)
        lastC = index;
      }
    });

    args.splice(lastC, 0, c);
  }

  /**
   * Invokes `console.log()` when available.
   * No-op when `console.log` is not a "function".
   *
   * @api public
   */

  function log() {
    // this hackery is required for IE8/9, where
    // the `console.log` function doesn't have 'apply'
    return 'object' === typeof console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }

  /**
   * Save `namespaces`.
   *
   * @param {String} namespaces
   * @api private
   */

  function save(namespaces) {
    try {
      if (null == namespaces) {
        exports.storage.removeItem('debug');
      } else {
        exports.storage.debug = namespaces;
      }
    } catch(e) {}
  }

  /**
   * Load `namespaces`.
   *
   * @return {String} returns the previously persisted debug modes
   * @api private
   */

  function load() {
    var r;
    try {
      r = exports.storage.debug;
    } catch(e) {}

    // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    if (!r && typeof process !== 'undefined' && 'env' in process) {
      r = process.env.DEBUG;
    }

    return r;
  }

  /**
   * Enable namespaces listed in `localStorage.debug` initially.
   */

  exports.enable(load());

  /**
   * Localstorage attempts to return the localstorage.
   *
   * This is necessary because safari throws
   * when a user disables cookies/localstorage
   * and you attempt to access it.
   *
   * @return {LocalStorage}
   * @api private
   */

  function localstorage() {
    try {
      return window.localStorage;
    } catch (e) {}
  }
  });
  var browser_1 = browser.log;
  var browser_2 = browser.formatArgs;
  var browser_3 = browser.save;
  var browser_4 = browser.load;
  var browser_5 = browser.useColors;
  var browser_6 = browser.storage;
  var browser_7 = browser.colors;

  var node = createCommonjsModule(function (module, exports) {
  /**
   * Module dependencies.
   */




  /**
   * This is the Node.js implementation of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = debug;
  exports.init = init;
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;

  /**
   * Colors.
   */

  exports.colors = [6, 2, 3, 4, 5, 1];

  /**
   * Build up the default `inspectOpts` object from the environment variables.
   *
   *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
   */

  exports.inspectOpts = Object.keys(process.env).filter(function (key) {
    return /^debug_/i.test(key);
  }).reduce(function (obj, key) {
    // camel-case
    var prop = key
      .substring(6)
      .toLowerCase()
      .replace(/_([a-z])/g, function (_, k) { return k.toUpperCase() });

    // coerce string value into JS value
    var val = process.env[key];
    if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
    else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
    else if (val === 'null') val = null;
    else val = Number(val);

    obj[prop] = val;
    return obj;
  }, {});

  /**
   * The file descriptor to write the `debug()` calls to.
   * Set the `DEBUG_FD` env variable to override with another value. i.e.:
   *
   *   $ DEBUG_FD=3 node script.js 3>debug.log
   */

  var fd = parseInt(process.env.DEBUG_FD, 10) || 2;

  if (1 !== fd && 2 !== fd) {
    util.deprecate(function(){}, 'except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)')();
  }

  var stream$$1 = 1 === fd ? process.stdout :
               2 === fd ? process.stderr :
               createWritableStdioStream(fd);

  /**
   * Is stdout a TTY? Colored output is enabled when `true`.
   */

  function useColors() {
    return 'colors' in exports.inspectOpts
      ? Boolean(exports.inspectOpts.colors)
      : tty.isatty(fd);
  }

  /**
   * Map %o to `util.inspect()`, all on a single line.
   */

  exports.formatters.o = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts)
      .split('\n').map(function(str) {
        return str.trim()
      }).join(' ');
  };

  /**
   * Map %o to `util.inspect()`, allowing multiple lines if needed.
   */

  exports.formatters.O = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts);
  };

  /**
   * Adds ANSI color escape codes if enabled.
   *
   * @api public
   */

  function formatArgs(args) {
    var name = this.namespace;
    var useColors = this.useColors;

    if (useColors) {
      var c = this.color;
      var prefix = '  \u001b[3' + c + ';1m' + name + ' ' + '\u001b[0m';

      args[0] = prefix + args[0].split('\n').join('\n' + prefix);
      args.push('\u001b[3' + c + 'm+' + exports.humanize(this.diff) + '\u001b[0m');
    } else {
      args[0] = new Date().toUTCString()
        + ' ' + name + ' ' + args[0];
    }
  }

  /**
   * Invokes `util.format()` with the specified arguments and writes to `stream`.
   */

  function log() {
    return stream$$1.write(util.format.apply(util, arguments) + '\n');
  }

  /**
   * Save `namespaces`.
   *
   * @param {String} namespaces
   * @api private
   */

  function save(namespaces) {
    if (null == namespaces) {
      // If you set a process.env field to null or undefined, it gets cast to the
      // string 'null' or 'undefined'. Just delete instead.
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = namespaces;
    }
  }

  /**
   * Load `namespaces`.
   *
   * @return {String} returns the previously persisted debug modes
   * @api private
   */

  function load() {
    return process.env.DEBUG;
  }

  /**
   * Copied from `node/src/node.js`.
   *
   * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
   * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
   */

  function createWritableStdioStream (fd) {
    var stream$$1;
    var tty_wrap = process.binding('tty_wrap');

    // Note stream._type is used for test-module-load-list.js

    switch (tty_wrap.guessHandleType(fd)) {
      case 'TTY':
        stream$$1 = new tty.WriteStream(fd);
        stream$$1._type = 'tty';

        // Hack to have stream not keep the event loop alive.
        // See https://github.com/joyent/node/issues/1726
        if (stream$$1._handle && stream$$1._handle.unref) {
          stream$$1._handle.unref();
        }
        break;

      case 'FILE':
        var fs$$1 = fs__default;
        stream$$1 = new fs$$1.SyncWriteStream(fd, { autoClose: false });
        stream$$1._type = 'fs';
        break;

      case 'PIPE':
      case 'TCP':
        var net$$1 = net;
        stream$$1 = new net$$1.Socket({
          fd: fd,
          readable: false,
          writable: true
        });

        // FIXME Should probably have an option in net.Socket to create a
        // stream from an existing fd which is writable only. But for now
        // we'll just add this hack and set the `readable` member to false.
        // Test: ./node test/fixtures/echo.js < /etc/passwd
        stream$$1.readable = false;
        stream$$1.read = null;
        stream$$1._type = 'pipe';

        // FIXME Hack to have stream not keep the event loop alive.
        // See https://github.com/joyent/node/issues/1726
        if (stream$$1._handle && stream$$1._handle.unref) {
          stream$$1._handle.unref();
        }
        break;

      default:
        // Probably an error on in uv_guess_handle()
        throw new Error('Implement me. Unknown stream file type!');
    }

    // For supporting legacy API we put the FD here.
    stream$$1.fd = fd;

    stream$$1._isStdio = true;

    return stream$$1;
  }

  /**
   * Init logic for `debug` instances.
   *
   * Create a new `inspectOpts` object in case `useColors` is set
   * differently for a particular `debug` instance.
   */

  function init (debug$$1) {
    debug$$1.inspectOpts = {};

    var keys = Object.keys(exports.inspectOpts);
    for (var i = 0; i < keys.length; i++) {
      debug$$1.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
    }
  }

  /**
   * Enable namespaces listed in `process.env.DEBUG` initially.
   */

  exports.enable(load());
  });
  var node_1 = node.init;
  var node_2 = node.log;
  var node_3 = node.formatArgs;
  var node_4 = node.save;
  var node_5 = node.load;
  var node_6 = node.useColors;
  var node_7 = node.colors;
  var node_8 = node.inspectOpts;

  var src = createCommonjsModule(function (module) {
  /**
   * Detect Electron renderer process, which is node, but we should
   * treat as a browser.
   */

  if (typeof process !== 'undefined' && process.type === 'renderer') {
    module.exports = browser;
  } else {
    module.exports = node;
  }
  });

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */

  var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

  /**
   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
   */
  var encode = function (number) {
    if (0 <= number && number < intToCharMap.length) {
      return intToCharMap[number];
    }
    throw new TypeError("Must be between 0 and 63: " + number);
  };

  /**
   * Decode a single base 64 character code digit to an integer. Returns -1 on
   * failure.
   */
  var decode = function (charCode) {
    var bigA = 65;     // 'A'
    var bigZ = 90;     // 'Z'

    var littleA = 97;  // 'a'
    var littleZ = 122; // 'z'

    var zero = 48;     // '0'
    var nine = 57;     // '9'

    var plus = 43;     // '+'
    var slash = 47;    // '/'

    var littleOffset = 26;
    var numberOffset = 52;

    // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
    if (bigA <= charCode && charCode <= bigZ) {
      return (charCode - bigA);
    }

    // 26 - 51: abcdefghijklmnopqrstuvwxyz
    if (littleA <= charCode && charCode <= littleZ) {
      return (charCode - littleA + littleOffset);
    }

    // 52 - 61: 0123456789
    if (zero <= charCode && charCode <= nine) {
      return (charCode - zero + numberOffset);
    }

    // 62: +
    if (charCode == plus) {
      return 62;
    }

    // 63: /
    if (charCode == slash) {
      return 63;
    }

    // Invalid base64 digit.
    return -1;
  };

  var base64 = {
  	encode: encode,
  	decode: decode
  };

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   *
   * Based on the Base 64 VLQ implementation in Closure Compiler:
   * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
   *
   * Copyright 2011 The Closure Compiler Authors. All rights reserved.
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are
   * met:
   *
   *  * Redistributions of source code must retain the above copyright
   *    notice, this list of conditions and the following disclaimer.
   *  * Redistributions in binary form must reproduce the above
   *    copyright notice, this list of conditions and the following
   *    disclaimer in the documentation and/or other materials provided
   *    with the distribution.
   *  * Neither the name of Google Inc. nor the names of its
   *    contributors may be used to endorse or promote products derived
   *    from this software without specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
   * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
   * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
   * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
   * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
   * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */



  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
  // length quantities we use in the source map spec, the first bit is the sign,
  // the next four bits are the actual value, and the 6th bit is the
  // continuation bit. The continuation bit tells us whether there are more
  // digits in this value following this digit.
  //
  //   Continuation
  //   |    Sign
  //   |    |
  //   V    V
  //   101011

  var VLQ_BASE_SHIFT = 5;

  // binary: 100000
  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

  // binary: 011111
  var VLQ_BASE_MASK = VLQ_BASE - 1;

  // binary: 100000
  var VLQ_CONTINUATION_BIT = VLQ_BASE;

  /**
   * Converts from a two-complement value to a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
   */
  function toVLQSigned(aValue) {
    return aValue < 0
      ? ((-aValue) << 1) + 1
      : (aValue << 1) + 0;
  }

  /**
   * Converts to a two-complement value from a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
   */
  function fromVLQSigned(aValue) {
    var isNegative = (aValue & 1) === 1;
    var shifted = aValue >> 1;
    return isNegative
      ? -shifted
      : shifted;
  }

  /**
   * Returns the base 64 VLQ encoded value.
   */
  var encode$1 = function base64VLQ_encode(aValue) {
    var encoded = "";
    var digit;

    var vlq = toVLQSigned(aValue);

    do {
      digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        // There are still more digits in this value, so we must make sure the
        // continuation bit is marked.
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += base64.encode(digit);
    } while (vlq > 0);

    return encoded;
  };

  /**
   * Decodes the next base 64 VLQ value from the given string and returns the
   * value and the rest of the string via the out parameter.
   */
  var decode$1 = function base64VLQ_decode(aStr, aIndex, aOutParam) {
    var strLen = aStr.length;
    var result = 0;
    var shift = 0;
    var continuation, digit;

    do {
      if (aIndex >= strLen) {
        throw new Error("Expected more digits in base 64 VLQ value.");
      }

      digit = base64.decode(aStr.charCodeAt(aIndex++));
      if (digit === -1) {
        throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
      }

      continuation = !!(digit & VLQ_CONTINUATION_BIT);
      digit &= VLQ_BASE_MASK;
      result = result + (digit << shift);
      shift += VLQ_BASE_SHIFT;
    } while (continuation);

    aOutParam.value = fromVLQSigned(result);
    aOutParam.rest = aIndex;
  };

  var base64Vlq = {
  	encode: encode$1,
  	decode: decode$1
  };

  var util$2 = createCommonjsModule(function (module, exports) {
  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */

  /**
   * This is a helper function for getting values from parameter/options
   * objects.
   *
   * @param args The object we are extracting values from
   * @param name The name of the property we are getting.
   * @param defaultValue An optional value to return if the property is missing
   * from the object. If this is not specified and the property is missing, an
   * error will be thrown.
   */
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;

  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
  var dataUrlRegexp = /^data:.+\,.+$/;

  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[2],
      host: match[3],
      port: match[4],
      path: match[5]
    };
  }
  exports.urlParse = urlParse;

  function urlGenerate(aParsedUrl) {
    var url$$1 = '';
    if (aParsedUrl.scheme) {
      url$$1 += aParsedUrl.scheme + ':';
    }
    url$$1 += '//';
    if (aParsedUrl.auth) {
      url$$1 += aParsedUrl.auth + '@';
    }
    if (aParsedUrl.host) {
      url$$1 += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url$$1 += ":" + aParsedUrl.port;
    }
    if (aParsedUrl.path) {
      url$$1 += aParsedUrl.path;
    }
    return url$$1;
  }
  exports.urlGenerate = urlGenerate;

  /**
   * Normalizes a path, or the path portion of a URL:
   *
   * - Replaces consecutive slashes with one slash.
   * - Removes unnecessary '.' parts.
   * - Removes unnecessary '<dir>/..' parts.
   *
   * Based on code in the Node.js 'path' core module.
   *
   * @param aPath The path or url to normalize.
   */
  function normalize(aPath) {
    var path$$1 = aPath;
    var url$$1 = urlParse(aPath);
    if (url$$1) {
      if (!url$$1.path) {
        return aPath;
      }
      path$$1 = url$$1.path;
    }
    var isAbsolute = exports.isAbsolute(path$$1);

    var parts = path$$1.split(/\/+/);
    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
      part = parts[i];
      if (part === '.') {
        parts.splice(i, 1);
      } else if (part === '..') {
        up++;
      } else if (up > 0) {
        if (part === '') {
          // The first part is blank if the path is absolute. Trying to go
          // above the root is a no-op. Therefore we can remove all '..' parts
          // directly after the root.
          parts.splice(i + 1, up);
          up = 0;
        } else {
          parts.splice(i, 2);
          up--;
        }
      }
    }
    path$$1 = parts.join('/');

    if (path$$1 === '') {
      path$$1 = isAbsolute ? '/' : '.';
    }

    if (url$$1) {
      url$$1.path = path$$1;
      return urlGenerate(url$$1);
    }
    return path$$1;
  }
  exports.normalize = normalize;

  /**
   * Joins two paths/URLs.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be joined with the root.
   *
   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
   *   first.
   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
   *   is updated with the result and aRoot is returned. Otherwise the result
   *   is returned.
   *   - If aPath is absolute, the result is aPath.
   *   - Otherwise the two paths are joined with a slash.
   * - Joining for example 'http://' and 'www.example.com' is also supported.
   */
  function join(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    if (aPath === "") {
      aPath = ".";
    }
    var aPathUrl = urlParse(aPath);
    var aRootUrl = urlParse(aRoot);
    if (aRootUrl) {
      aRoot = aRootUrl.path || '/';
    }

    // `join(foo, '//www.example.org')`
    if (aPathUrl && !aPathUrl.scheme) {
      if (aRootUrl) {
        aPathUrl.scheme = aRootUrl.scheme;
      }
      return urlGenerate(aPathUrl);
    }

    if (aPathUrl || aPath.match(dataUrlRegexp)) {
      return aPath;
    }

    // `join('http://', 'www.example.com')`
    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
      aRootUrl.host = aPath;
      return urlGenerate(aRootUrl);
    }

    var joined = aPath.charAt(0) === '/'
      ? aPath
      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

    if (aRootUrl) {
      aRootUrl.path = joined;
      return urlGenerate(aRootUrl);
    }
    return joined;
  }
  exports.join = join;

  exports.isAbsolute = function (aPath) {
    return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
  };

  /**
   * Make a path relative to a URL or another path.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be made relative to aRoot.
   */
  function relative(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }

    aRoot = aRoot.replace(/\/$/, '');

    // It is possible for the path to be above the root. In this case, simply
    // checking whether the root is a prefix of the path won't work. Instead, we
    // need to remove components from the root one by one, until either we find
    // a prefix that fits, or we run out of components to remove.
    var level = 0;
    while (aPath.indexOf(aRoot + '/') !== 0) {
      var index = aRoot.lastIndexOf("/");
      if (index < 0) {
        return aPath;
      }

      // If the only part of the root that is left is the scheme (i.e. http://,
      // file:///, etc.), one or more slashes (/), or simply nothing at all, we
      // have exhausted all components, so the path is not relative to the root.
      aRoot = aRoot.slice(0, index);
      if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
        return aPath;
      }

      ++level;
    }

    // Make sure we add a "../" for each component we removed from the root.
    return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
  }
  exports.relative = relative;

  var supportsNullProto = (function () {
    var obj = Object.create(null);
    return !('__proto__' in obj);
  }());

  function identity (s) {
    return s;
  }

  /**
   * Because behavior goes wacky when you set `__proto__` on objects, we
   * have to prefix all the strings in our set with an arbitrary character.
   *
   * See https://github.com/mozilla/source-map/pull/31 and
   * https://github.com/mozilla/source-map/issues/30
   *
   * @param String aStr
   */
  function toSetString(aStr) {
    if (isProtoString(aStr)) {
      return '$' + aStr;
    }

    return aStr;
  }
  exports.toSetString = supportsNullProto ? identity : toSetString;

  function fromSetString(aStr) {
    if (isProtoString(aStr)) {
      return aStr.slice(1);
    }

    return aStr;
  }
  exports.fromSetString = supportsNullProto ? identity : fromSetString;

  function isProtoString(s) {
    if (!s) {
      return false;
    }

    var length = s.length;

    if (length < 9 /* "__proto__".length */) {
      return false;
    }

    if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
        s.charCodeAt(length - 2) !== 95  /* '_' */ ||
        s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
        s.charCodeAt(length - 4) !== 116 /* 't' */ ||
        s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
        s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
        s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
        s.charCodeAt(length - 8) !== 95  /* '_' */ ||
        s.charCodeAt(length - 9) !== 95  /* '_' */) {
      return false;
    }

    for (var i = length - 10; i >= 0; i--) {
      if (s.charCodeAt(i) !== 36 /* '$' */) {
        return false;
      }
    }

    return true;
  }

  /**
   * Comparator between two mappings where the original positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same original source/line/column, but different generated
   * line and column the same. Useful when searching for a mapping with a
   * stubbed out mapping.
   */
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp = mappingA.source - mappingB.source;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0 || onlyCompareOriginal) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }

    return mappingA.name - mappingB.name;
  }
  exports.compareByOriginalPositions = compareByOriginalPositions;

  /**
   * Comparator between two mappings with deflated source and name indices where
   * the generated positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same generated line and column, but different
   * source/name/original line and column the same. Useful when searching for a
   * mapping with a stubbed out mapping.
   */
  function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0 || onlyCompareGenerated) {
      return cmp;
    }

    cmp = mappingA.source - mappingB.source;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }

    return mappingA.name - mappingB.name;
  }
  exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

  function strcmp(aStr1, aStr2) {
    if (aStr1 === aStr2) {
      return 0;
    }

    if (aStr1 > aStr2) {
      return 1;
    }

    return -1;
  }

  /**
   * Comparator between two mappings with inflated source and name strings where
   * the generated positions are compared.
   */
  function compareByGeneratedPositionsInflated(mappingA, mappingB) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }

    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
  });
  var util_1$1 = util$2.getArg;
  var util_2$1 = util$2.urlParse;
  var util_3$1 = util$2.urlGenerate;
  var util_4 = util$2.normalize;
  var util_5 = util$2.join;
  var util_6 = util$2.isAbsolute;
  var util_7 = util$2.relative;
  var util_8 = util$2.toSetString;
  var util_9 = util$2.fromSetString;
  var util_10 = util$2.compareByOriginalPositions;
  var util_11 = util$2.compareByGeneratedPositionsDeflated;
  var util_12 = util$2.compareByGeneratedPositionsInflated;

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */


  var has$3 = Object.prototype.hasOwnProperty;
  var hasNativeMap = typeof Map !== "undefined";

  /**
   * A data structure which is a combination of an array and a set. Adding a new
   * member is O(1), testing for membership is O(1), and finding the index of an
   * element is O(1). Removing elements from the set is not supported. Only
   * strings are supported for membership.
   */
  function ArraySet() {
    this._array = [];
    this._set = hasNativeMap ? new Map() : Object.create(null);
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
    var set = new ArraySet();
    for (var i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  };

  /**
   * Return how many unique items are in this ArraySet. If duplicates have been
   * added, than those do not count towards the size.
   *
   * @returns Number
   */
  ArraySet.prototype.size = function ArraySet_size() {
    return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
  };

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
    var sStr = hasNativeMap ? aStr : util$2.toSetString(aStr);
    var isDuplicate = hasNativeMap ? this.has(aStr) : has$3.call(this._set, sStr);
    var idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      if (hasNativeMap) {
        this._set.set(aStr, idx);
      } else {
        this._set[sStr] = idx;
      }
    }
  };

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  ArraySet.prototype.has = function ArraySet_has(aStr) {
    if (hasNativeMap) {
      return this._set.has(aStr);
    } else {
      var sStr = util$2.toSetString(aStr);
      return has$3.call(this._set, sStr);
    }
  };

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
    if (hasNativeMap) {
      var idx = this._set.get(aStr);
      if (idx >= 0) {
          return idx;
      }
    } else {
      var sStr = util$2.toSetString(aStr);
      if (has$3.call(this._set, sStr)) {
        return this._set[sStr];
      }
    }

    throw new Error('"' + aStr + '" is not in the set.');
  };

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  ArraySet.prototype.at = function ArraySet_at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error('No element indexed by ' + aIdx);
  };

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  ArraySet.prototype.toArray = function ArraySet_toArray() {
    return this._array.slice();
  };

  var ArraySet_1 = ArraySet;

  var arraySet = {
  	ArraySet: ArraySet_1
  };

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2014 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */



  /**
   * Determine whether mappingB is after mappingA with respect to generated
   * position.
   */
  function generatedPositionAfter(mappingA, mappingB) {
    // Optimized for most common case
    var lineA = mappingA.generatedLine;
    var lineB = mappingB.generatedLine;
    var columnA = mappingA.generatedColumn;
    var columnB = mappingB.generatedColumn;
    return lineB > lineA || lineB == lineA && columnB >= columnA ||
           util$2.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
  }

  /**
   * A data structure to provide a sorted view of accumulated mappings in a
   * performance conscious manner. It trades a neglibable overhead in general
   * case for a large speedup in case of mappings being added in order.
   */
  function MappingList() {
    this._array = [];
    this._sorted = true;
    // Serves as infimum
    this._last = {generatedLine: -1, generatedColumn: 0};
  }

  /**
   * Iterate through internal items. This method takes the same arguments that
   * `Array.prototype.forEach` takes.
   *
   * NOTE: The order of the mappings is NOT guaranteed.
   */
  MappingList.prototype.unsortedForEach =
    function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };

  /**
   * Add the given source mapping.
   *
   * @param Object aMapping
   */
  MappingList.prototype.add = function MappingList_add(aMapping) {
    if (generatedPositionAfter(this._last, aMapping)) {
      this._last = aMapping;
      this._array.push(aMapping);
    } else {
      this._sorted = false;
      this._array.push(aMapping);
    }
  };

  /**
   * Returns the flat, sorted array of mappings. The mappings are sorted by
   * generated position.
   *
   * WARNING: This method returns internal data without copying, for
   * performance. The return value must NOT be mutated, and should be treated as
   * an immutable borrow. If you want to take ownership, you must make your own
   * copy.
   */
  MappingList.prototype.toArray = function MappingList_toArray() {
    if (!this._sorted) {
      this._array.sort(util$2.compareByGeneratedPositionsInflated);
      this._sorted = true;
    }
    return this._array;
  };

  var MappingList_1 = MappingList;

  var mappingList = {
  	MappingList: MappingList_1
  };

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */



  var ArraySet$1 = arraySet.ArraySet;
  var MappingList$1 = mappingList.MappingList;

  /**
   * An instance of the SourceMapGenerator represents a source map which is
   * being built incrementally. You may pass an object with the following
   * properties:
   *
   *   - file: The filename of the generated source.
   *   - sourceRoot: A root for all relative URLs in this source map.
   */
  function SourceMapGenerator(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util$2.getArg(aArgs, 'file', null);
    this._sourceRoot = util$2.getArg(aArgs, 'sourceRoot', null);
    this._skipValidation = util$2.getArg(aArgs, 'skipValidation', false);
    this._sources = new ArraySet$1();
    this._names = new ArraySet$1();
    this._mappings = new MappingList$1();
    this._sourcesContents = null;
  }

  SourceMapGenerator.prototype._version = 3;

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  SourceMapGenerator.fromSourceMap =
    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot: sourceRoot
      });
      aSourceMapConsumer.eachMapping(function (mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };

        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util$2.relative(sourceRoot, newMapping.source);
          }

          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };

          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }

        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  SourceMapGenerator.prototype.addMapping =
    function SourceMapGenerator_addMapping(aArgs) {
      var generated = util$2.getArg(aArgs, 'generated');
      var original = util$2.getArg(aArgs, 'original', null);
      var source = util$2.getArg(aArgs, 'source', null);
      var name = util$2.getArg(aArgs, 'name', null);

      if (!this._skipValidation) {
        this._validateMapping(generated, original, source, name);
      }

      if (source != null) {
        source = String(source);
        if (!this._sources.has(source)) {
          this._sources.add(source);
        }
      }

      if (name != null) {
        name = String(name);
        if (!this._names.has(name)) {
          this._names.add(name);
        }
      }

      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source: source,
        name: name
      });
    };

  /**
   * Set the source content for a source file.
   */
  SourceMapGenerator.prototype.setSourceContent =
    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util$2.relative(this._sourceRoot, source);
      }

      if (aSourceContent != null) {
        // Add the source content to the _sourcesContents map.
        // Create a new _sourcesContents map if the property is null.
        if (!this._sourcesContents) {
          this._sourcesContents = Object.create(null);
        }
        this._sourcesContents[util$2.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        // Remove the source file from the _sourcesContents map.
        // If the _sourcesContents map is empty, set the property to null.
        delete this._sourcesContents[util$2.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   * @param aSourceMapPath Optional. The dirname of the path to the source map
   *        to be applied. If relative, it is relative to the SourceMapConsumer.
   *        This parameter is needed when the two source maps aren't in the same
   *        directory, and the source map to be applied contains relative source
   *        paths. If so, those relative source paths need to be rewritten
   *        relative to the SourceMapGenerator.
   */
  SourceMapGenerator.prototype.applySourceMap =
    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      // If aSourceFile is omitted, we will use the file property of the SourceMap
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
            'or the source map\'s "file" property. Both were omitted.'
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      // Make "sourceFile" relative if an absolute Url is passed.
      if (sourceRoot != null) {
        sourceFile = util$2.relative(sourceRoot, sourceFile);
      }
      // Applying the SourceMap can add and remove items from the sources and
      // the names array.
      var newSources = new ArraySet$1();
      var newNames = new ArraySet$1();

      // Find mappings for the "sourceFile"
      this._mappings.unsortedForEach(function (mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          // Check if it can be mapped by the source map, then update the mapping.
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            // Copy mapping
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util$2.join(aSourceMapPath, mapping.source);
            }
            if (sourceRoot != null) {
              mapping.source = util$2.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }

        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }

        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }

      }, this);
      this._sources = newSources;
      this._names = newNames;

      // Copy sourcesContents of applied map.
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile = util$2.join(aSourceMapPath, sourceFile);
          }
          if (sourceRoot != null) {
            sourceFile = util$2.relative(sourceRoot, sourceFile);
          }
          this.setSourceContent(sourceFile, content);
        }
      }, this);
    };

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  SourceMapGenerator.prototype._validateMapping =
    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                aName) {
      // When aOriginal is truthy but has empty values for .line and .column,
      // it is most likely a programmer error. In this case we throw a very
      // specific error message to try to guide them the right way.
      // For example: https://github.com/Polymer/polymer-bundler/pull/519
      if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
          throw new Error(
              'original.line and original.column are not numbers -- you probably meant to omit ' +
              'the original mapping entirely and only map the generated position. If so, pass ' +
              'null for the original mapping instead of an object with empty or null values.'
          );
      }

      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
          && aGenerated.line > 0 && aGenerated.column >= 0
          && !aOriginal && !aSource && !aName) {
        // Case 1.
        return;
      }
      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
               && aGenerated.line > 0 && aGenerated.column >= 0
               && aOriginal.line > 0 && aOriginal.column >= 0
               && aSource) {
        // Cases 2 and 3.
        return;
      }
      else {
        throw new Error('Invalid mapping: ' + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    };

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  SourceMapGenerator.prototype._serializeMappings =
    function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = '';
      var next;
      var mapping;
      var nameIdx;
      var sourceIdx;

      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];
        next = '';

        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            next += ';';
            previousGeneratedLine++;
          }
        }
        else {
          if (i > 0) {
            if (!util$2.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            next += ',';
          }
        }

        next += base64Vlq.encode(mapping.generatedColumn
                                   - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;

        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          next += base64Vlq.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;

          // lines are stored 0-based in SourceMap spec version 3
          next += base64Vlq.encode(mapping.originalLine - 1
                                     - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;

          next += base64Vlq.encode(mapping.originalColumn
                                     - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;

          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            next += base64Vlq.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }

        result += next;
      }

      return result;
    };

  SourceMapGenerator.prototype._generateSourcesContent =
    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function (source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util$2.relative(aSourceRoot, source);
        }
        var key = util$2.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
          ? this._sourcesContents[key]
          : null;
      }, this);
    };

  /**
   * Externalize the source map.
   */
  SourceMapGenerator.prototype.toJSON =
    function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }

      return map;
    };

  /**
   * Render the source map being generated to a string.
   */
  SourceMapGenerator.prototype.toString =
    function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    };

  var SourceMapGenerator_1 = SourceMapGenerator;

  var sourceMapGenerator = {
  	SourceMapGenerator: SourceMapGenerator_1
  };

  var binarySearch = createCommonjsModule(function (module, exports) {
  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */

  exports.GREATEST_LOWER_BOUND = 1;
  exports.LEAST_UPPER_BOUND = 2;

  /**
   * Recursive implementation of binary search.
   *
   * @param aLow Indices here and lower do not contain the needle.
   * @param aHigh Indices here and higher do not contain the needle.
   * @param aNeedle The element being searched for.
   * @param aHaystack The non-empty array being searched.
   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
   * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
   *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   */
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
    // This function terminates when one of the following is true:
    //
    //   1. We find the exact element we are looking for.
    //
    //   2. We did not find the exact element, but we can return the index of
    //      the next-closest element.
    //
    //   3. We did not find the exact element, and there is no next-closest
    //      element than the one we are searching for, so we return -1.
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      // Found the element we are looking for.
      return mid;
    }
    else if (cmp > 0) {
      // Our needle is greater than aHaystack[mid].
      if (aHigh - mid > 1) {
        // The element is in the upper half.
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
      }

      // The exact needle element was not found in this haystack. Determine if
      // we are in termination case (3) or (2) and return the appropriate thing.
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return aHigh < aHaystack.length ? aHigh : -1;
      } else {
        return mid;
      }
    }
    else {
      // Our needle is less than aHaystack[mid].
      if (mid - aLow > 1) {
        // The element is in the lower half.
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
      }

      // we are in termination case (3) or (2) and return the appropriate thing.
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return mid;
      } else {
        return aLow < 0 ? -1 : aLow;
      }
    }
  }

  /**
   * This is an implementation of binary search which will always try and return
   * the index of the closest element if there is no exact hit. This is because
   * mappings between original and generated line/col pairs are single points,
   * and there is an implicit region between each of them, so a miss just means
   * that you aren't on the very start of a region.
   *
   * @param aNeedle The element you are looking for.
   * @param aHaystack The array that is being searched.
   * @param aCompare A function which takes the needle and an element in the
   *     array and returns -1, 0, or 1 depending on whether the needle is less
   *     than, equal to, or greater than the element, respectively.
   * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
   *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
   */
  exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
    if (aHaystack.length === 0) {
      return -1;
    }

    var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                                aCompare, aBias || exports.GREATEST_LOWER_BOUND);
    if (index < 0) {
      return -1;
    }

    // We have found either the exact element, or the next-closest element than
    // the one we are searching for. However, there may be more than one such
    // element. Make sure we always return the smallest of these.
    while (index - 1 >= 0) {
      if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
        break;
      }
      --index;
    }

    return index;
  };
  });
  var binarySearch_1 = binarySearch.GREATEST_LOWER_BOUND;
  var binarySearch_2 = binarySearch.LEAST_UPPER_BOUND;
  var binarySearch_3 = binarySearch.search;

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */

  // It turns out that some (most?) JavaScript engines don't self-host
  // `Array.prototype.sort`. This makes sense because C++ will likely remain
  // faster than JS when doing raw CPU-intensive sorting. However, when using a
  // custom comparator function, calling back and forth between the VM's C++ and
  // JIT'd JS is rather slow *and* loses JIT type information, resulting in
  // worse generated code for the comparator function than would be optimal. In
  // fact, when sorting with a comparator, these costs outweigh the benefits of
  // sorting in C++. By using our own JS-implemented Quick Sort (below), we get
  // a ~3500ms mean speed-up in `bench/bench.html`.

  /**
   * Swap the elements indexed by `x` and `y` in the array `ary`.
   *
   * @param {Array} ary
   *        The array.
   * @param {Number} x
   *        The index of the first item.
   * @param {Number} y
   *        The index of the second item.
   */
  function swap(ary, x, y) {
    var temp = ary[x];
    ary[x] = ary[y];
    ary[y] = temp;
  }

  /**
   * Returns a random integer within the range `low .. high` inclusive.
   *
   * @param {Number} low
   *        The lower bound on the range.
   * @param {Number} high
   *        The upper bound on the range.
   */
  function randomIntInRange(low, high) {
    return Math.round(low + (Math.random() * (high - low)));
  }

  /**
   * The Quick Sort algorithm.
   *
   * @param {Array} ary
   *        An array to sort.
   * @param {function} comparator
   *        Function to use to compare two items.
   * @param {Number} p
   *        Start index of the array
   * @param {Number} r
   *        End index of the array
   */
  function doQuickSort(ary, comparator, p, r) {
    // If our lower bound is less than our upper bound, we (1) partition the
    // array into two pieces and (2) recurse on each half. If it is not, this is
    // the empty array and our base case.

    if (p < r) {
      // (1) Partitioning.
      //
      // The partitioning chooses a pivot between `p` and `r` and moves all
      // elements that are less than or equal to the pivot to the before it, and
      // all the elements that are greater than it after it. The effect is that
      // once partition is done, the pivot is in the exact place it will be when
      // the array is put in sorted order, and it will not need to be moved
      // again. This runs in O(n) time.

      // Always choose a random pivot so that an input array which is reverse
      // sorted does not cause O(n^2) running time.
      var pivotIndex = randomIntInRange(p, r);
      var i = p - 1;

      swap(ary, pivotIndex, r);
      var pivot = ary[r];

      // Immediately after `j` is incremented in this loop, the following hold
      // true:
      //
      //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
      //
      //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
      for (var j = p; j < r; j++) {
        if (comparator(ary[j], pivot) <= 0) {
          i += 1;
          swap(ary, i, j);
        }
      }

      swap(ary, i + 1, j);
      var q = i + 1;

      // (2) Recurse on each half.

      doQuickSort(ary, comparator, p, q - 1);
      doQuickSort(ary, comparator, q + 1, r);
    }
  }

  /**
   * Sort the given array in-place with the given comparator function.
   *
   * @param {Array} ary
   *        An array to sort.
   * @param {function} comparator
   *        Function to use to compare two items.
   */
  var quickSort_1 = function (ary, comparator) {
    doQuickSort(ary, comparator, 0, ary.length - 1);
  };

  var quickSort = {
  	quickSort: quickSort_1
  };

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */



  var ArraySet$2 = arraySet.ArraySet;

  var quickSort$1 = quickSort.quickSort;

  function SourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    return sourceMap.sections != null
      ? new IndexedSourceMapConsumer(sourceMap)
      : new BasicSourceMapConsumer(sourceMap);
  }

  SourceMapConsumer.fromSourceMap = function(aSourceMap) {
    return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
  };

  /**
   * The version of the source mapping spec that we are consuming.
   */
  SourceMapConsumer.prototype._version = 3;

  // `__generatedMappings` and `__originalMappings` are arrays that hold the
  // parsed mapping coordinates from the source map's "mappings" attribute. They
  // are lazily instantiated, accessed via the `_generatedMappings` and
  // `_originalMappings` getters respectively, and we only parse the mappings
  // and create these arrays once queried for a source location. We jump through
  // these hoops because there can be many thousands of mappings, and parsing
  // them is expensive, so we only want to do it if we must.
  //
  // Each object in the arrays is of the form:
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `_generatedMappings` is ordered by the generated positions.
  //
  // `_originalMappings` is ordered by the original positions.

  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
    get: function () {
      if (!this.__generatedMappings) {
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__generatedMappings;
    }
  });

  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
    get: function () {
      if (!this.__originalMappings) {
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__originalMappings;
    }
  });

  SourceMapConsumer.prototype._charIsMappingSeparator =
    function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
      var c = aStr.charAt(index);
      return c === ";" || c === ",";
    };

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  SourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      throw new Error("Subclasses must implement _parseMappings");
    };

  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;

  SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
  SourceMapConsumer.LEAST_UPPER_BOUND = 2;

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  SourceMapConsumer.prototype.eachMapping =
    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

      var mappings;
      switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
      }

      var sourceRoot = this.sourceRoot;
      mappings.map(function (mapping) {
        var source = mapping.source === null ? null : this._sources.at(mapping.source);
        if (source != null && sourceRoot != null) {
          source = util$2.join(sourceRoot, source);
        }
        return {
          source: source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name === null ? null : this._names.at(mapping.name)
        };
      }, this).forEach(aCallback, context);
    };

  /**
   * Returns all generated line and column information for the original source,
   * line, and column provided. If no column is provided, returns all mappings
   * corresponding to a either the line we are searching for or the next
   * closest line that has any mappings. Otherwise, returns all mappings
   * corresponding to the given line and either the column we are searching for
   * or the next closest column that has any offsets.
   *
   * The only argument is an object with the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: Optional. the column number in the original source.
   *
   * and an array of objects is returned, each with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.allGeneratedPositionsFor =
    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      var line = util$2.getArg(aArgs, 'line');

      // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
      // returns the index of the closest mapping less than the needle. By
      // setting needle.originalColumn to 0, we thus find the last mapping for
      // the given line, provided such a mapping exists.
      var needle = {
        source: util$2.getArg(aArgs, 'source'),
        originalLine: line,
        originalColumn: util$2.getArg(aArgs, 'column', 0)
      };

      if (this.sourceRoot != null) {
        needle.source = util$2.relative(this.sourceRoot, needle.source);
      }
      if (!this._sources.has(needle.source)) {
        return [];
      }
      needle.source = this._sources.indexOf(needle.source);

      var mappings = [];

      var index = this._findMapping(needle,
                                    this._originalMappings,
                                    "originalLine",
                                    "originalColumn",
                                    util$2.compareByOriginalPositions,
                                    binarySearch.LEAST_UPPER_BOUND);
      if (index >= 0) {
        var mapping = this._originalMappings[index];

        if (aArgs.column === undefined) {
          var originalLine = mapping.originalLine;

          // Iterate until either we run out of mappings, or we run into
          // a mapping for a different line than the one we found. Since
          // mappings are sorted, this is guaranteed to find all mappings for
          // the line we found.
          while (mapping && mapping.originalLine === originalLine) {
            mappings.push({
              line: util$2.getArg(mapping, 'generatedLine', null),
              column: util$2.getArg(mapping, 'generatedColumn', null),
              lastColumn: util$2.getArg(mapping, 'lastGeneratedColumn', null)
            });

            mapping = this._originalMappings[++index];
          }
        } else {
          var originalColumn = mapping.originalColumn;

          // Iterate until either we run out of mappings, or we run into
          // a mapping for a different line than the one we were searching for.
          // Since mappings are sorted, this is guaranteed to find all mappings for
          // the line we are searching for.
          while (mapping &&
                 mapping.originalLine === line &&
                 mapping.originalColumn == originalColumn) {
            mappings.push({
              line: util$2.getArg(mapping, 'generatedLine', null),
              column: util$2.getArg(mapping, 'generatedColumn', null),
              lastColumn: util$2.getArg(mapping, 'lastGeneratedColumn', null)
            });

            mapping = this._originalMappings[++index];
          }
        }
      }

      return mappings;
    };

  var SourceMapConsumer_1 = SourceMapConsumer;

  /**
   * A BasicSourceMapConsumer instance represents a parsed source map which we can
   * query for information about the original file positions by giving it a file
   * position in the generated source.
   *
   * The only parameter is the raw source map (either as a JSON string, or
   * already parsed to an object). According to the spec, source maps have the
   * following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - sources: An array of URLs to the original source files.
   *   - names: An array of identifiers which can be referrenced by individual mappings.
   *   - sourceRoot: Optional. The URL root from which all sources are relative.
   *   - sourcesContent: Optional. An array of contents of the original source files.
   *   - mappings: A string of base64 VLQs which contain the actual mappings.
   *   - file: Optional. The generated file this source map is associated with.
   *
   * Here is an example source map, taken from the source map spec[0]:
   *
   *     {
   *       version : 3,
   *       file: "out.js",
   *       sourceRoot : "",
   *       sources: ["foo.js", "bar.js"],
   *       names: ["src", "maps", "are", "fun"],
   *       mappings: "AA,AB;;ABCDE;"
   *     }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
   */
  function BasicSourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util$2.getArg(sourceMap, 'version');
    var sources = util$2.getArg(sourceMap, 'sources');
    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
    // requires the array) to play nice here.
    var names = util$2.getArg(sourceMap, 'names', []);
    var sourceRoot = util$2.getArg(sourceMap, 'sourceRoot', null);
    var sourcesContent = util$2.getArg(sourceMap, 'sourcesContent', null);
    var mappings = util$2.getArg(sourceMap, 'mappings');
    var file = util$2.getArg(sourceMap, 'file', null);

    // Once again, Sass deviates from the spec and supplies the version as a
    // string rather than a number, so we use loose equality checking here.
    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    sources = sources
      .map(String)
      // Some source maps produce relative source paths like "./foo.js" instead of
      // "foo.js".  Normalize these first so that future comparisons will succeed.
      // See bugzil.la/1090768.
      .map(util$2.normalize)
      // Always ensure that absolute sources are internally stored relative to
      // the source root, if the source root is absolute. Not doing this would
      // be particularly problematic when the source root is a prefix of the
      // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
      .map(function (source) {
        return sourceRoot && util$2.isAbsolute(sourceRoot) && util$2.isAbsolute(source)
          ? util$2.relative(sourceRoot, source)
          : source;
      });

    // Pass `true` below to allow duplicate names and sources. While source maps
    // are intended to be compressed and deduplicated, the TypeScript compiler
    // sometimes generates source maps with duplicates in them. See Github issue
    // #72 and bugzil.la/889492.
    this._names = ArraySet$2.fromArray(names.map(String), true);
    this._sources = ArraySet$2.fromArray(sources, true);

    this.sourceRoot = sourceRoot;
    this.sourcesContent = sourcesContent;
    this._mappings = mappings;
    this.file = file;
  }

  BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
  BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

  /**
   * Create a BasicSourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @returns BasicSourceMapConsumer
   */
  BasicSourceMapConsumer.fromSourceMap =
    function SourceMapConsumer_fromSourceMap(aSourceMap) {
      var smc = Object.create(BasicSourceMapConsumer.prototype);

      var names = smc._names = ArraySet$2.fromArray(aSourceMap._names.toArray(), true);
      var sources = smc._sources = ArraySet$2.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                              smc.sourceRoot);
      smc.file = aSourceMap._file;

      // Because we are modifying the entries (by converting string sources and
      // names to indices into the sources and names ArraySets), we have to make
      // a copy of the entry or else bad things happen. Shared mutable state
      // strikes again! See github issue #191.

      var generatedMappings = aSourceMap._mappings.toArray().slice();
      var destGeneratedMappings = smc.__generatedMappings = [];
      var destOriginalMappings = smc.__originalMappings = [];

      for (var i = 0, length = generatedMappings.length; i < length; i++) {
        var srcMapping = generatedMappings[i];
        var destMapping = new Mapping;
        destMapping.generatedLine = srcMapping.generatedLine;
        destMapping.generatedColumn = srcMapping.generatedColumn;

        if (srcMapping.source) {
          destMapping.source = sources.indexOf(srcMapping.source);
          destMapping.originalLine = srcMapping.originalLine;
          destMapping.originalColumn = srcMapping.originalColumn;

          if (srcMapping.name) {
            destMapping.name = names.indexOf(srcMapping.name);
          }

          destOriginalMappings.push(destMapping);
        }

        destGeneratedMappings.push(destMapping);
      }

      quickSort$1(smc.__originalMappings, util$2.compareByOriginalPositions);

      return smc;
    };

  /**
   * The version of the source mapping spec that we are consuming.
   */
  BasicSourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
    get: function () {
      return this._sources.toArray().map(function (s) {
        return this.sourceRoot != null ? util$2.join(this.sourceRoot, s) : s;
      }, this);
    }
  });

  /**
   * Provide the JIT with a nice shape / hidden class.
   */
  function Mapping() {
    this.generatedLine = 0;
    this.generatedColumn = 0;
    this.source = null;
    this.originalLine = null;
    this.originalColumn = null;
    this.name = null;
  }

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  BasicSourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var length = aStr.length;
      var index = 0;
      var cachedSegments = {};
      var temp = {};
      var originalMappings = [];
      var generatedMappings = [];
      var mapping, str, segment, end, value;

      while (index < length) {
        if (aStr.charAt(index) === ';') {
          generatedLine++;
          index++;
          previousGeneratedColumn = 0;
        }
        else if (aStr.charAt(index) === ',') {
          index++;
        }
        else {
          mapping = new Mapping();
          mapping.generatedLine = generatedLine;

          // Because each offset is encoded relative to the previous one,
          // many segments often have the same encoding. We can exploit this
          // fact by caching the parsed variable length fields of each segment,
          // allowing us to avoid a second parse if we encounter the same
          // segment again.
          for (end = index; end < length; end++) {
            if (this._charIsMappingSeparator(aStr, end)) {
              break;
            }
          }
          str = aStr.slice(index, end);

          segment = cachedSegments[str];
          if (segment) {
            index += str.length;
          } else {
            segment = [];
            while (index < end) {
              base64Vlq.decode(aStr, index, temp);
              value = temp.value;
              index = temp.rest;
              segment.push(value);
            }

            if (segment.length === 2) {
              throw new Error('Found a source, but no line and column');
            }

            if (segment.length === 3) {
              throw new Error('Found a source and line, but no column');
            }

            cachedSegments[str] = segment;
          }

          // Generated column.
          mapping.generatedColumn = previousGeneratedColumn + segment[0];
          previousGeneratedColumn = mapping.generatedColumn;

          if (segment.length > 1) {
            // Original source.
            mapping.source = previousSource + segment[1];
            previousSource += segment[1];

            // Original line.
            mapping.originalLine = previousOriginalLine + segment[2];
            previousOriginalLine = mapping.originalLine;
            // Lines are stored 0-based
            mapping.originalLine += 1;

            // Original column.
            mapping.originalColumn = previousOriginalColumn + segment[3];
            previousOriginalColumn = mapping.originalColumn;

            if (segment.length > 4) {
              // Original name.
              mapping.name = previousName + segment[4];
              previousName += segment[4];
            }
          }

          generatedMappings.push(mapping);
          if (typeof mapping.originalLine === 'number') {
            originalMappings.push(mapping);
          }
        }
      }

      quickSort$1(generatedMappings, util$2.compareByGeneratedPositionsDeflated);
      this.__generatedMappings = generatedMappings;

      quickSort$1(originalMappings, util$2.compareByOriginalPositions);
      this.__originalMappings = originalMappings;
    };

  /**
   * Find the mapping that best matches the hypothetical "needle" mapping that
   * we are searching for in the given "haystack" of mappings.
   */
  BasicSourceMapConsumer.prototype._findMapping =
    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                           aColumnName, aComparator, aBias) {
      // To return the position we are searching for, we must first find the
      // mapping for the given position and then return the opposite position it
      // points to. Because the mappings are sorted, we can use binary search to
      // find the best mapping.

      if (aNeedle[aLineName] <= 0) {
        throw new TypeError('Line must be greater than or equal to 1, got '
                            + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError('Column must be greater than or equal to 0, got '
                            + aNeedle[aColumnName]);
      }

      return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
    };

  /**
   * Compute the last column for each generated mapping. The last column is
   * inclusive.
   */
  BasicSourceMapConsumer.prototype.computeColumnSpans =
    function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];

        // Mappings do not contain a field for the last generated columnt. We
        // can come up with an optimistic estimate, however, by assuming that
        // mappings are contiguous (i.e. given two consecutive mappings, the
        // first mapping ends where the second one starts).
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];

          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }

        // The last mapping for each line spans the entire line.
        mapping.lastGeneratedColumn = Infinity;
      }
    };

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  BasicSourceMapConsumer.prototype.originalPositionFor =
    function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util$2.getArg(aArgs, 'line'),
        generatedColumn: util$2.getArg(aArgs, 'column')
      };

      var index = this._findMapping(
        needle,
        this._generatedMappings,
        "generatedLine",
        "generatedColumn",
        util$2.compareByGeneratedPositionsDeflated,
        util$2.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
      );

      if (index >= 0) {
        var mapping = this._generatedMappings[index];

        if (mapping.generatedLine === needle.generatedLine) {
          var source = util$2.getArg(mapping, 'source', null);
          if (source !== null) {
            source = this._sources.at(source);
            if (this.sourceRoot != null) {
              source = util$2.join(this.sourceRoot, source);
            }
          }
          var name = util$2.getArg(mapping, 'name', null);
          if (name !== null) {
            name = this._names.at(name);
          }
          return {
            source: source,
            line: util$2.getArg(mapping, 'originalLine', null),
            column: util$2.getArg(mapping, 'originalColumn', null),
            name: name
          };
        }
      }

      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
    function BasicSourceMapConsumer_hasContentsOfAllSources() {
      if (!this.sourcesContent) {
        return false;
      }
      return this.sourcesContent.length >= this._sources.size() &&
        !this.sourcesContent.some(function (sc) { return sc == null; });
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  BasicSourceMapConsumer.prototype.sourceContentFor =
    function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      if (!this.sourcesContent) {
        return null;
      }

      if (this.sourceRoot != null) {
        aSource = util$2.relative(this.sourceRoot, aSource);
      }

      if (this._sources.has(aSource)) {
        return this.sourcesContent[this._sources.indexOf(aSource)];
      }

      var url$$1;
      if (this.sourceRoot != null
          && (url$$1 = util$2.urlParse(this.sourceRoot))) {
        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
        // many users. We can help them out when they expect file:// URIs to
        // behave like it would if they were running a local HTTP server. See
        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
        if (url$$1.scheme == "file"
            && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
        }

        if ((!url$$1.path || url$$1.path == "/")
            && this._sources.has("/" + aSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
        }
      }

      // This function is used recursively from
      // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
      // don't want to throw if we can't find the source - we just want to
      // return null, so we provide a flag to exit gracefully.
      if (nullOnMissing) {
        return null;
      }
      else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  BasicSourceMapConsumer.prototype.generatedPositionFor =
    function SourceMapConsumer_generatedPositionFor(aArgs) {
      var source = util$2.getArg(aArgs, 'source');
      if (this.sourceRoot != null) {
        source = util$2.relative(this.sourceRoot, source);
      }
      if (!this._sources.has(source)) {
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      }
      source = this._sources.indexOf(source);

      var needle = {
        source: source,
        originalLine: util$2.getArg(aArgs, 'line'),
        originalColumn: util$2.getArg(aArgs, 'column')
      };

      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util$2.compareByOriginalPositions,
        util$2.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
      );

      if (index >= 0) {
        var mapping = this._originalMappings[index];

        if (mapping.source === needle.source) {
          return {
            line: util$2.getArg(mapping, 'generatedLine', null),
            column: util$2.getArg(mapping, 'generatedColumn', null),
            lastColumn: util$2.getArg(mapping, 'lastGeneratedColumn', null)
          };
        }
      }

      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };

  var BasicSourceMapConsumer_1 = BasicSourceMapConsumer;

  /**
   * An IndexedSourceMapConsumer instance represents a parsed source map which
   * we can query for information. It differs from BasicSourceMapConsumer in
   * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
   * input.
   *
   * The only parameter is a raw source map (either as a JSON string, or already
   * parsed to an object). According to the spec for indexed source maps, they
   * have the following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - file: Optional. The generated file this source map is associated with.
   *   - sections: A list of section definitions.
   *
   * Each value under the "sections" field has two fields:
   *   - offset: The offset into the original specified at which this section
   *       begins to apply, defined as an object with a "line" and "column"
   *       field.
   *   - map: A source map definition. This source map could also be indexed,
   *       but doesn't have to be.
   *
   * Instead of the "map" field, it's also possible to have a "url" field
   * specifying a URL to retrieve a source map from, but that's currently
   * unsupported.
   *
   * Here's an example source map, taken from the source map spec[0], but
   * modified to omit a section which uses the "url" field.
   *
   *  {
   *    version : 3,
   *    file: "app.js",
   *    sections: [{
   *      offset: {line:100, column:10},
   *      map: {
   *        version : 3,
   *        file: "section.js",
   *        sources: ["foo.js", "bar.js"],
   *        names: ["src", "maps", "are", "fun"],
   *        mappings: "AAAA,E;;ABCDE;"
   *      }
   *    }],
   *  }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
   */
  function IndexedSourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util$2.getArg(sourceMap, 'version');
    var sections = util$2.getArg(sourceMap, 'sections');

    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    this._sources = new ArraySet$2();
    this._names = new ArraySet$2();

    var lastOffset = {
      line: -1,
      column: 0
    };
    this._sections = sections.map(function (s) {
      if (s.url) {
        // The url field will require support for asynchronicity.
        // See https://github.com/mozilla/source-map/issues/16
        throw new Error('Support for url field in sections not implemented.');
      }
      var offset = util$2.getArg(s, 'offset');
      var offsetLine = util$2.getArg(offset, 'line');
      var offsetColumn = util$2.getArg(offset, 'column');

      if (offsetLine < lastOffset.line ||
          (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
        throw new Error('Section offsets must be ordered and non-overlapping.');
      }
      lastOffset = offset;

      return {
        generatedOffset: {
          // The offset fields are 0-based, but we use 1-based indices when
          // encoding/decoding from VLQ.
          generatedLine: offsetLine + 1,
          generatedColumn: offsetColumn + 1
        },
        consumer: new SourceMapConsumer(util$2.getArg(s, 'map'))
      }
    });
  }

  IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
  IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

  /**
   * The version of the source mapping spec that we are consuming.
   */
  IndexedSourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
    get: function () {
      var sources = [];
      for (var i = 0; i < this._sections.length; i++) {
        for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
          sources.push(this._sections[i].consumer.sources[j]);
        }
      }
      return sources;
    }
  });

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  IndexedSourceMapConsumer.prototype.originalPositionFor =
    function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util$2.getArg(aArgs, 'line'),
        generatedColumn: util$2.getArg(aArgs, 'column')
      };

      // Find the section containing the generated position we're trying to map
      // to an original position.
      var sectionIndex = binarySearch.search(needle, this._sections,
        function(needle, section) {
          var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
          if (cmp) {
            return cmp;
          }

          return (needle.generatedColumn -
                  section.generatedOffset.generatedColumn);
        });
      var section = this._sections[sectionIndex];

      if (!section) {
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      }

      return section.consumer.originalPositionFor({
        line: needle.generatedLine -
          (section.generatedOffset.generatedLine - 1),
        column: needle.generatedColumn -
          (section.generatedOffset.generatedLine === needle.generatedLine
           ? section.generatedOffset.generatedColumn - 1
           : 0),
        bias: aArgs.bias
      });
    };

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
    function IndexedSourceMapConsumer_hasContentsOfAllSources() {
      return this._sections.every(function (s) {
        return s.consumer.hasContentsOfAllSources();
      });
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  IndexedSourceMapConsumer.prototype.sourceContentFor =
    function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];

        var content = section.consumer.sourceContentFor(aSource, true);
        if (content) {
          return content;
        }
      }
      if (nullOnMissing) {
        return null;
      }
      else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  IndexedSourceMapConsumer.prototype.generatedPositionFor =
    function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];

        // Only consider this section if the requested source is in the list of
        // sources of the consumer.
        if (section.consumer.sources.indexOf(util$2.getArg(aArgs, 'source')) === -1) {
          continue;
        }
        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
        if (generatedPosition) {
          var ret = {
            line: generatedPosition.line +
              (section.generatedOffset.generatedLine - 1),
            column: generatedPosition.column +
              (section.generatedOffset.generatedLine === generatedPosition.line
               ? section.generatedOffset.generatedColumn - 1
               : 0)
          };
          return ret;
        }
      }

      return {
        line: null,
        column: null
      };
    };

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  IndexedSourceMapConsumer.prototype._parseMappings =
    function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      this.__generatedMappings = [];
      this.__originalMappings = [];
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var sectionMappings = section.consumer._generatedMappings;
        for (var j = 0; j < sectionMappings.length; j++) {
          var mapping = sectionMappings[j];

          var source = section.consumer._sources.at(mapping.source);
          if (section.consumer.sourceRoot !== null) {
            source = util$2.join(section.consumer.sourceRoot, source);
          }
          this._sources.add(source);
          source = this._sources.indexOf(source);

          var name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);

          // The mappings coming from the consumer for the section have
          // generated positions relative to the start of the section, so we
          // need to offset them to be relative to the start of the concatenated
          // generated file.
          var adjustedMapping = {
            source: source,
            generatedLine: mapping.generatedLine +
              (section.generatedOffset.generatedLine - 1),
            generatedColumn: mapping.generatedColumn +
              (section.generatedOffset.generatedLine === mapping.generatedLine
              ? section.generatedOffset.generatedColumn - 1
              : 0),
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name: name
          };

          this.__generatedMappings.push(adjustedMapping);
          if (typeof adjustedMapping.originalLine === 'number') {
            this.__originalMappings.push(adjustedMapping);
          }
        }
      }

      quickSort$1(this.__generatedMappings, util$2.compareByGeneratedPositionsDeflated);
      quickSort$1(this.__originalMappings, util$2.compareByOriginalPositions);
    };

  var IndexedSourceMapConsumer_1 = IndexedSourceMapConsumer;

  var sourceMapConsumer = {
  	SourceMapConsumer: SourceMapConsumer_1,
  	BasicSourceMapConsumer: BasicSourceMapConsumer_1,
  	IndexedSourceMapConsumer: IndexedSourceMapConsumer_1
  };

  /* -*- Mode: js; js-indent-level: 2; -*- */
  /*
   * Copyright 2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE or:
   * http://opensource.org/licenses/BSD-3-Clause
   */

  var SourceMapGenerator$1 = sourceMapGenerator.SourceMapGenerator;


  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
  // operating systems these days (capturing the result).
  var REGEX_NEWLINE = /(\r?\n)/;

  // Newline character code for charCodeAt() comparisons
  var NEWLINE_CODE = 10;

  // Private symbol for identifying `SourceNode`s when multiple versions of
  // the source-map library are loaded. This MUST NOT CHANGE across
  // versions!
  var isSourceNode = "$$$isSourceNode$$$";

  /**
   * SourceNodes provide a way to abstract over interpolating/concatenating
   * snippets of generated JavaScript source code while maintaining the line and
   * column information associated with the original source code.
   *
   * @param aLine The original line number.
   * @param aColumn The original column number.
   * @param aSource The original source's filename.
   * @param aChunks Optional. An array of strings which are snippets of
   *        generated JS, or other SourceNodes.
   * @param aName The original identifier.
   */
  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine == null ? null : aLine;
    this.column = aColumn == null ? null : aColumn;
    this.source = aSource == null ? null : aSource;
    this.name = aName == null ? null : aName;
    this[isSourceNode] = true;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   * @param aRelativePath Optional. The path that relative sources in the
   *        SourceMapConsumer should be relative to.
   */
  SourceNode.fromStringWithSourceMap =
    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      // The SourceNode we want to fill with the generated code
      // and the SourceMap
      var node = new SourceNode();

      // All even indices of this array are one line of the generated code,
      // while all odd indices are the newlines between two adjacent lines
      // (since `REGEX_NEWLINE` captures its match).
      // Processed fragments are accessed by calling `shiftNextLine`.
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var remainingLinesIndex = 0;
      var shiftNextLine = function() {
        var lineContents = getNextLine();
        // The last line of a file might not have a newline.
        var newLine = getNextLine() || "";
        return lineContents + newLine;

        function getNextLine() {
          return remainingLinesIndex < remainingLines.length ?
              remainingLines[remainingLinesIndex++] : undefined;
        }
      };

      // We need to remember the position of "remainingLines"
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

      // The generate SourceNodes we need a code range.
      // To extract it current and last mapping is used.
      // Here we store the last mapping.
      var lastMapping = null;

      aSourceMapConsumer.eachMapping(function (mapping) {
        if (lastMapping !== null) {
          // We add the code from "lastMapping" to "mapping":
          // First check if there is a new line in between.
          if (lastGeneratedLine < mapping.generatedLine) {
            // Associate first line with "lastMapping"
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
            // The remaining code is added without mapping
          } else {
            // There is no new line in between.
            // Associate the code between "lastGeneratedColumn" and
            // "mapping.generatedColumn" with "lastMapping"
            var nextLine = remainingLines[remainingLinesIndex];
            var code = nextLine.substr(0, mapping.generatedColumn -
                                          lastGeneratedColumn);
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                                lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            // No more remaining code, continue
            lastMapping = mapping;
            return;
          }
        }
        // We add the generated code until the first mapping
        // to the SourceNode without any mapping.
        // Each line is added as separate string.
        while (lastGeneratedLine < mapping.generatedLine) {
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[remainingLinesIndex];
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      // We have processed all mappings.
      if (remainingLinesIndex < remainingLines.length) {
        if (lastMapping) {
          // Associate the remaining code in the current line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        // and add the remaining lines without any mapping
        node.add(remainingLines.splice(remainingLinesIndex).join(""));
      }

      // Copy sourcesContent into SourceNode
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util$2.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });

      return node;

      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === undefined) {
          node.add(code);
        } else {
          var source = aRelativePath
            ? util$2.join(aRelativePath, mapping.source)
            : mapping.source;
          node.add(new SourceNode(mapping.originalLine,
                                  mapping.originalColumn,
                                  source,
                                  code,
                                  mapping.name));
        }
      }
    };

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.add = function SourceNode_add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function (chunk) {
        this.add(chunk);
      }, this);
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (var i = aChunk.length-1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
    var chunk;
    for (var i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk[isSourceNode]) {
        chunk.walk(aFn);
      }
      else {
        if (chunk !== '') {
          aFn(chunk, { source: this.source,
                       line: this.line,
                       column: this.column,
                       name: this.name });
        }
      }
    }
  };

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  SourceNode.prototype.join = function SourceNode_join(aSep) {
    var newChildren;
    var i;
    var len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len-1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  };

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
    var lastChild = this.children[this.children.length - 1];
    if (lastChild[isSourceNode]) {
      lastChild.replaceRight(aPattern, aReplacement);
    }
    else if (typeof lastChild === 'string') {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    }
    else {
      this.children.push(''.replace(aPattern, aReplacement));
    }
    return this;
  };

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  SourceNode.prototype.setSourceContent =
    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util$2.toSetString(aSourceFile)] = aSourceContent;
    };

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walkSourceContents =
    function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }

      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util$2.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  SourceNode.prototype.toString = function SourceNode_toString() {
    var str = "";
    this.walk(function (chunk) {
      str += chunk;
    });
    return str;
  };

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
    var generated = {
      code: "",
      line: 1,
      column: 0
    };
    var map = new SourceMapGenerator$1(aArgs);
    var sourceMappingActive = false;
    var lastOriginalSource = null;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastOriginalName = null;
    this.walk(function (chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if(lastOriginalSource !== original.source
           || lastOriginalLine !== original.line
           || lastOriginalColumn !== original.column
           || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      for (var idx = 0, length = chunk.length; idx < length; idx++) {
        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
          generated.line++;
          generated.column = 0;
          // Mappings end at eol
          if (idx + 1 === length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      }
    });
    this.walkSourceContents(function (sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map: map };
  };

  var SourceNode_1 = SourceNode;

  var sourceNode = {
  	SourceNode: SourceNode_1
  };

  /*
   * Copyright 2009-2011 Mozilla Foundation and contributors
   * Licensed under the New BSD license. See LICENSE.txt or:
   * http://opensource.org/licenses/BSD-3-Clause
   */
  var SourceMapGenerator$2 = sourceMapGenerator.SourceMapGenerator;
  var SourceMapConsumer$1 = sourceMapConsumer.SourceMapConsumer;
  var SourceNode$1 = sourceNode.SourceNode;

  var sourceMap = {
  	SourceMapGenerator: SourceMapGenerator$2,
  	SourceMapConsumer: SourceMapConsumer$1,
  	SourceNode: SourceNode$1
  };

  var sourceMapUrl = createCommonjsModule(function (module, exports) {
  // Copyright 2014 Simon Lydell
  // X11 (“MIT”) Licensed. (See LICENSE.)

  void (function(root, factory) {
    {
      module.exports = factory();
    }
  }(commonjsGlobal, function() {

    var innerRegex = /[#@] sourceMappingURL=([^\s'"]*)/;

    var regex = RegExp(
      "(?:" +
        "/\\*" +
        "(?:\\s*\r?\n(?://)?)?" +
        "(?:" + innerRegex.source + ")" +
        "\\s*" +
        "\\*/" +
        "|" +
        "//(?:" + innerRegex.source + ")" +
      ")" +
      "\\s*"
    );

    return {

      regex: regex,
      _innerRegex: innerRegex,

      getFrom: function(code) {
        var match = code.match(regex);
        return (match ? match[1] || match[2] || "" : null)
      },

      existsIn: function(code) {
        return regex.test(code)
      },

      removeFrom: function(code) {
        return code.replace(regex, "")
      },

      insertBefore: function(code, string) {
        var match = code.match(regex);
        if (match) {
          return code.slice(0, match.index) + string + code.slice(match.index)
        } else {
          return code + string
        }
      }
    }

  }));
  });

  // Copyright 2014 Simon Lydell
  // X11 (“MIT”) Licensed. (See LICENSE.)



  function resolveUrl(/* ...urls */) {
    return Array.prototype.reduce.call(arguments, function(resolved, nextUrl) {
      return url.resolve(resolved, nextUrl)
    })
  }

  var resolveUrl_1 = resolveUrl;

  var token = '%[a-f0-9]{2}';
  var singleMatcher = new RegExp(token, 'gi');
  var multiMatcher = new RegExp('(' + token + ')+', 'gi');

  function decodeComponents(components, split) {
  	try {
  		// Try to decode the entire string first
  		return decodeURIComponent(components.join(''));
  	} catch (err) {
  		// Do nothing
  	}

  	if (components.length === 1) {
  		return components;
  	}

  	split = split || 1;

  	// Split the array in 2 parts
  	var left = components.slice(0, split);
  	var right = components.slice(split);

  	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
  }

  function decode$2(input) {
  	try {
  		return decodeURIComponent(input);
  	} catch (err) {
  		var tokens = input.match(singleMatcher);

  		for (var i = 1; i < tokens.length; i++) {
  			input = decodeComponents(tokens, i).join('');

  			tokens = input.match(singleMatcher);
  		}

  		return input;
  	}
  }

  function customDecodeURIComponent(input) {
  	// Keep track of all the replacements and prefill the map with the `BOM`
  	var replaceMap = {
  		'%FE%FF': '\uFFFD\uFFFD',
  		'%FF%FE': '\uFFFD\uFFFD'
  	};

  	var match = multiMatcher.exec(input);
  	while (match) {
  		try {
  			// Decode as big chunks as possible
  			replaceMap[match[0]] = decodeURIComponent(match[0]);
  		} catch (err) {
  			var result = decode$2(match[0]);

  			if (result !== match[0]) {
  				replaceMap[match[0]] = result;
  			}
  		}

  		match = multiMatcher.exec(input);
  	}

  	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
  	replaceMap['%C2'] = '\uFFFD';

  	var entries = Object.keys(replaceMap);

  	for (var i = 0; i < entries.length; i++) {
  		// Replace all decoded components
  		var key = entries[i];
  		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
  	}

  	return input;
  }

  var decodeUriComponent = function (encodedURI) {
  	if (typeof encodedURI !== 'string') {
  		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
  	}

  	try {
  		encodedURI = encodedURI.replace(/\+/g, ' ');

  		// Try the built in decoder first
  		return decodeURIComponent(encodedURI);
  	} catch (err) {
  		// Fallback to a more advanced decoder
  		return customDecodeURIComponent(encodedURI);
  	}
  };

  // Copyright 2017 Simon Lydell
  // X11 (“MIT”) Licensed. (See LICENSE.)



  function customDecodeUriComponent(string) {
    // `decodeUriComponent` turns `+` into ` `, but that's not wanted.
    return decodeUriComponent(string.replace(/\+/g, "%2B"))
  }

  var decodeUriComponent_1 = customDecodeUriComponent;

  function urix(aPath) {
    if (path.sep === "\\") {
      return aPath
        .replace(/\\/g, "/")
        .replace(/^[a-z]:\/?/i, "/")
    }
    return aPath
  }

  var urix_1 = urix;

  function atob(str) {
    return Buffer.from(str, 'base64').toString('binary');
  }

  var nodeAtob = atob.atob = atob;

  // Copyright 2014, 2015, 2016, 2017 Simon Lydell
  // X11 (“MIT”) Licensed. (See LICENSE.)









  function callbackAsync(callback, error, result) {
    setImmediate(function() { callback(error, result); });
  }

  function parseMapToJSON(string, data) {
    try {
      return JSON.parse(string.replace(/^\)\]\}'/, ""))
    } catch (error) {
      error.sourceMapData = data;
      throw error
    }
  }

  function readSync(read, url$$1, data) {
    var readUrl = decodeUriComponent_1(url$$1);
    try {
      return String(read(readUrl))
    } catch (error) {
      error.sourceMapData = data;
      throw error
    }
  }



  function resolveSourceMap(code, codeUrl, read, callback) {
    var mapData;
    try {
      mapData = resolveSourceMapHelper(code, codeUrl);
    } catch (error) {
      return callbackAsync(callback, error)
    }
    if (!mapData || mapData.map) {
      return callbackAsync(callback, null, mapData)
    }
    var readUrl = decodeUriComponent_1(mapData.url);
    read(readUrl, function(error, result) {
      if (error) {
        error.sourceMapData = mapData;
        return callback(error)
      }
      mapData.map = String(result);
      try {
        mapData.map = parseMapToJSON(mapData.map, mapData);
      } catch (error) {
        return callback(error)
      }
      callback(null, mapData);
    });
  }

  function resolveSourceMapSync(code, codeUrl, read) {
    var mapData = resolveSourceMapHelper(code, codeUrl);
    if (!mapData || mapData.map) {
      return mapData
    }
    mapData.map = readSync(read, mapData.url, mapData);
    mapData.map = parseMapToJSON(mapData.map, mapData);
    return mapData
  }

  var dataUriRegex = /^data:([^,;]*)(;[^,;]*)*(?:,(.*))?$/;
  var jsonMimeTypeRegex = /^(?:application|text)\/json$/;

  function resolveSourceMapHelper(code, codeUrl) {
    codeUrl = urix_1(codeUrl);

    var url$$1 = sourceMapUrl.getFrom(code);
    if (!url$$1) {
      return null
    }

    var dataUri = url$$1.match(dataUriRegex);
    if (dataUri) {
      var mimeType = dataUri[1];
      var lastParameter = dataUri[2] || "";
      var encoded = dataUri[3] || "";
      var data = {
        sourceMappingURL: url$$1,
        url: null,
        sourcesRelativeTo: codeUrl,
        map: encoded
      };
      if (!jsonMimeTypeRegex.test(mimeType)) {
        var error = new Error("Unuseful data uri mime type: " + (mimeType || "text/plain"));
        error.sourceMapData = data;
        throw error
      }
      data.map = parseMapToJSON(
        lastParameter === ";base64" ? nodeAtob(encoded) : decodeURIComponent(encoded),
        data
      );
      return data
    }

    var mapUrl = resolveUrl_1(codeUrl, url$$1);
    return {
      sourceMappingURL: url$$1,
      url: mapUrl,
      sourcesRelativeTo: mapUrl,
      map: null
    }
  }



  function resolveSources(map, mapUrl, read, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    var pending = map.sources ? map.sources.length : 0;
    var result = {
      sourcesResolved: [],
      sourcesContent:  []
    };

    if (pending === 0) {
      callbackAsync(callback, null, result);
      return
    }

    var done = function() {
      pending--;
      if (pending === 0) {
        callback(null, result);
      }
    };

    resolveSourcesHelper(map, mapUrl, options, function(fullUrl, sourceContent, index) {
      result.sourcesResolved[index] = fullUrl;
      if (typeof sourceContent === "string") {
        result.sourcesContent[index] = sourceContent;
        callbackAsync(done, null);
      } else {
        var readUrl = decodeUriComponent_1(fullUrl);
        read(readUrl, function(error, source) {
          result.sourcesContent[index] = error ? error : String(source);
          done();
        });
      }
    });
  }

  function resolveSourcesSync(map, mapUrl, read, options) {
    var result = {
      sourcesResolved: [],
      sourcesContent:  []
    };

    if (!map.sources || map.sources.length === 0) {
      return result
    }

    resolveSourcesHelper(map, mapUrl, options, function(fullUrl, sourceContent, index) {
      result.sourcesResolved[index] = fullUrl;
      if (read !== null) {
        if (typeof sourceContent === "string") {
          result.sourcesContent[index] = sourceContent;
        } else {
          var readUrl = decodeUriComponent_1(fullUrl);
          try {
            result.sourcesContent[index] = String(read(readUrl));
          } catch (error) {
            result.sourcesContent[index] = error;
          }
        }
      }
    });

    return result
  }

  var endingSlash = /\/?$/;

  function resolveSourcesHelper(map, mapUrl, options, fn) {
    options = options || {};
    mapUrl = urix_1(mapUrl);
    var fullUrl;
    var sourceContent;
    var sourceRoot;
    for (var index = 0, len = map.sources.length; index < len; index++) {
      sourceRoot = null;
      if (typeof options.sourceRoot === "string") {
        sourceRoot = options.sourceRoot;
      } else if (typeof map.sourceRoot === "string" && options.sourceRoot !== false) {
        sourceRoot = map.sourceRoot;
      }
      // If the sourceRoot is the empty string, it is equivalent to not setting
      // the property at all.
      if (sourceRoot === null || sourceRoot === '') {
        fullUrl = resolveUrl_1(mapUrl, map.sources[index]);
      } else {
        // Make sure that the sourceRoot ends with a slash, so that `/scripts/subdir` becomes
        // `/scripts/subdir/<source>`, not `/scripts/<source>`. Pointing to a file as source root
        // does not make sense.
        fullUrl = resolveUrl_1(mapUrl, sourceRoot.replace(endingSlash, "/"), map.sources[index]);
      }
      sourceContent = (map.sourcesContent || [])[index];
      fn(fullUrl, sourceContent, index);
    }
  }



  function resolve(code, codeUrl, read, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (code === null) {
      var mapUrl = codeUrl;
      var data = {
        sourceMappingURL: null,
        url: mapUrl,
        sourcesRelativeTo: mapUrl,
        map: null
      };
      var readUrl = decodeUriComponent_1(mapUrl);
      read(readUrl, function(error, result) {
        if (error) {
          error.sourceMapData = data;
          return callback(error)
        }
        data.map = String(result);
        try {
          data.map = parseMapToJSON(data.map, data);
        } catch (error) {
          return callback(error)
        }
        _resolveSources(data);
      });
    } else {
      resolveSourceMap(code, codeUrl, read, function(error, mapData) {
        if (error) {
          return callback(error)
        }
        if (!mapData) {
          return callback(null, null)
        }
        _resolveSources(mapData);
      });
    }

    function _resolveSources(mapData) {
      resolveSources(mapData.map, mapData.sourcesRelativeTo, read, options, function(error, result) {
        if (error) {
          return callback(error)
        }
        mapData.sourcesResolved = result.sourcesResolved;
        mapData.sourcesContent  = result.sourcesContent;
        callback(null, mapData);
      });
    }
  }

  function resolveSync(code, codeUrl, read, options) {
    var mapData;
    if (code === null) {
      var mapUrl = codeUrl;
      mapData = {
        sourceMappingURL: null,
        url: mapUrl,
        sourcesRelativeTo: mapUrl,
        map: null
      };
      mapData.map = readSync(read, mapUrl, mapData);
      mapData.map = parseMapToJSON(mapData.map, mapData);
    } else {
      mapData = resolveSourceMapSync(code, codeUrl, read);
      if (!mapData) {
        return null
      }
    }
    var result = resolveSourcesSync(mapData.map, mapData.sourcesRelativeTo, read, options);
    mapData.sourcesResolved = result.sourcesResolved;
    mapData.sourcesContent  = result.sourcesContent;
    return mapData
  }



  var sourceMapResolveNode = {
    resolveSourceMap:     resolveSourceMap,
    resolveSourceMapSync: resolveSourceMapSync,
    resolveSources:       resolveSources,
    resolveSourcesSync:   resolveSourcesSync,
    resolve:              resolve,
    resolveSync:          resolveSync,
    parseMapToJSON:       parseMapToJSON
  };

  /**
   * Module dependencies
   */

  var extend$2 = extendShallow$5;
  var SourceMap = sourceMap;
  var sourceMapResolve = sourceMapResolveNode;

  /**
   * Convert backslash in the given string to forward slashes
   */

  var unixify = function(fp) {
    return fp.split(/\\+/).join('/');
  };

  /**
   * Return true if `val` is a non-empty string
   *
   * @param {String} `str`
   * @return {Boolean}
   */

  var isString$3 = function(str) {
    return str && typeof str === 'string';
  };

  /**
   * Cast `val` to an array
   * @return {Array}
   */

  var arrayify$3 = function(val) {
    if (typeof val === 'string') return [val];
    return val ? (Array.isArray(val) ? val : [val]) : [];
  };

  /**
   * Get the last `n` element from the given `array`
   * @param {Array} `array`
   * @return {*}
   */

  var last = function(arr, n) {
    return arr[arr.length - (n || 1)];
  };

  var utils = {
  	extend: extend$2,
  	SourceMap: SourceMap,
  	sourceMapResolve: sourceMapResolve,
  	unixify: unixify,
  	isString: isString$3,
  	arrayify: arrayify$3,
  	last: last
  };

  var sourceMaps = createCommonjsModule(function (module, exports) {






  /**
   * Expose `mixin()`.
   * This code is based on `source-maps-support.js` in reworkcss/css
   * https://github.com/reworkcss/css/blob/master/lib/stringify/source-map-support.js
   * Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
   */

  module.exports = mixin;

  /**
   * Mixin source map support into `compiler`.
   *
   * @param {Object} `compiler`
   * @api public
   */

  function mixin(compiler) {
    defineProperty$3(compiler, '_comment', compiler.comment);
    compiler.map = new utils.SourceMap.SourceMapGenerator();
    compiler.position = { line: 1, column: 1 };
    compiler.content = {};
    compiler.files = {};

    for (var key in exports) {
      defineProperty$3(compiler, key, exports[key]);
    }
  }

  /**
   * Update position.
   *
   * @param {String} str
   */

  exports.updatePosition = function(str) {
    var lines = str.match(/\n/g);
    if (lines) this.position.line += lines.length;
    var i = str.lastIndexOf('\n');
    this.position.column = ~i ? str.length - i : this.position.column + str.length;
  };

  /**
   * Emit `str` with `position`.
   *
   * @param {String} str
   * @param {Object} [pos]
   * @return {String}
   */

  exports.emit = function(str, node) {
    var position = node.position || {};
    var source = position.source;
    if (source) {
      if (position.filepath) {
        source = utils.unixify(position.filepath);
      }

      this.map.addMapping({
        source: source,
        generated: {
          line: this.position.line,
          column: Math.max(this.position.column - 1, 0)
        },
        original: {
          line: position.start.line,
          column: position.start.column - 1
        }
      });

      if (position.content) {
        this.addContent(source, position);
      }
      if (position.filepath) {
        this.addFile(source, position);
      }

      this.updatePosition(str);
      this.output += str;
    }
    return str;
  };

  /**
   * Adds a file to the source map output if it has not already been added
   * @param {String} `file`
   * @param {Object} `pos`
   */

  exports.addFile = function(file, position) {
    if (typeof position.content !== 'string') return;
    if (Object.prototype.hasOwnProperty.call(this.files, file)) return;
    this.files[file] = position.content;
  };

  /**
   * Adds a content source to the source map output if it has not already been added
   * @param {String} `source`
   * @param {Object} `position`
   */

  exports.addContent = function(source, position) {
    if (typeof position.content !== 'string') return;
    if (Object.prototype.hasOwnProperty.call(this.content, source)) return;
    this.map.setSourceContent(source, position.content);
  };

  /**
   * Applies any original source maps to the output and embeds the source file
   * contents in the source map.
   */

  exports.applySourceMaps = function() {
    Object.keys(this.files).forEach(function(file) {
      var content = this.files[file];
      this.map.setSourceContent(file, content);

      if (this.options.inputSourcemaps === true) {
        var originalMap = utils.sourceMapResolve.resolveSync(content, file, fs__default.readFileSync);
        if (originalMap) {
          var map = new utils.SourceMap.SourceMapConsumer(originalMap.map);
          var relativeTo = originalMap.sourcesRelativeTo;
          this.map.applySourceMap(map, file, utils.unixify(path.dirname(relativeTo)));
        }
      }
    }, this);
  };

  /**
   * Process comments, drops sourceMap comments.
   * @param {Object} node
   */

  exports.comment = function(node) {
    if (/^# sourceMappingURL=/.test(node.comment)) {
      return this.emit('', node.position);
    }
    return this._comment(node);
  };
  });
  var sourceMaps_1 = sourceMaps.updatePosition;
  var sourceMaps_2 = sourceMaps.emit;
  var sourceMaps_3 = sourceMaps.addFile;
  var sourceMaps_4 = sourceMaps.addContent;
  var sourceMaps_5 = sourceMaps.applySourceMaps;
  var sourceMaps_6 = sourceMaps.comment;

  var debug$1 = src('snapdragon:compiler');


  /**
   * Create a new `Compiler` with the given `options`.
   * @param {Object} `options`
   */

  function Compiler(options, state) {
    debug$1('initializing', __filename);
    this.options = utils.extend({source: 'string'}, options);
    this.state = state || {};
    this.compilers = {};
    this.output = '';
    this.set('eos', function(node) {
      return this.emit(node.val, node);
    });
    this.set('noop', function(node) {
      return this.emit(node.val, node);
    });
    this.set('bos', function(node) {
      return this.emit(node.val, node);
    });
    use(this);
  }

  /**
   * Prototype methods
   */

  Compiler.prototype = {

    /**
     * Throw an error message with details including the cursor position.
     * @param {String} `msg` Message to use in the Error.
     */

    error: function(msg, node) {
      var pos = node.position || {start: {column: 0}};
      var message = this.options.source + ' column:' + pos.start.column + ': ' + msg;

      var err = new Error(message);
      err.reason = msg;
      err.column = pos.start.column;
      err.source = this.pattern;

      if (this.options.silent) {
        this.errors.push(err);
      } else {
        throw err;
      }
    },

    /**
     * Define a non-enumberable property on the `Compiler` instance.
     *
     * ```js
     * compiler.define('foo', 'bar');
     * ```
     * @name .define
     * @param {String} `key` propery name
     * @param {any} `val` property value
     * @return {Object} Returns the Compiler instance for chaining.
     * @api public
     */

    define: function(key, val) {
      defineProperty$3(this, key, val);
      return this;
    },

    /**
     * Emit `node.val`
     */

    emit: function(str, node) {
      this.output += str;
      return str;
    },

    /**
     * Add a compiler `fn` with the given `name`
     */

    set: function(name, fn) {
      this.compilers[name] = fn;
      return this;
    },

    /**
     * Get compiler `name`.
     */

    get: function(name) {
      return this.compilers[name];
    },

    /**
     * Get the previous AST node.
     */

    prev: function(n) {
      return this.ast.nodes[this.idx - (n || 1)] || { type: 'bos', val: '' };
    },

    /**
     * Get the next AST node.
     */

    next: function(n) {
      return this.ast.nodes[this.idx + (n || 1)] || { type: 'eos', val: '' };
    },

    /**
     * Visit `node`.
     */

    visit: function(node, nodes, i) {
      var fn = this.compilers[node.type];
      this.idx = i;

      if (typeof fn !== 'function') {
        throw this.error('compiler "' + node.type + '" is not registered', node);
      }
      return fn.call(this, node, nodes, i);
    },

    /**
     * Map visit over array of `nodes`.
     */

    mapVisit: function(nodes) {
      if (!Array.isArray(nodes)) {
        throw new TypeError('expected an array');
      }
      var len = nodes.length;
      var idx = -1;
      while (++idx < len) {
        this.visit(nodes[idx], nodes, idx);
      }
      return this;
    },

    /**
     * Compile `ast`.
     */

    compile: function(ast, options) {
      var opts = utils.extend({}, this.options, options);
      this.ast = ast;
      this.parsingErrors = this.ast.errors;
      this.output = '';

      // source map support
      if (opts.sourcemap) {
        var sourcemaps = sourceMaps;
        sourcemaps(this);
        this.mapVisit(this.ast.nodes);
        this.applySourceMaps();
        this.map = opts.sourcemap === 'generator' ? this.map : this.map.toJSON();
        return this;
      }

      this.mapVisit(this.ast.nodes);
      return this;
    }
  };

  /**
   * Expose `Compiler`
   */

  var compiler = Compiler;

  /*!
   * map-cache <https://github.com/jonschlinkert/map-cache>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var hasOwn$6 = Object.prototype.hasOwnProperty;

  /**
   * Expose `MapCache`
   */

  var mapCache = MapCache;

  /**
   * Creates a cache object to store key/value pairs.
   *
   * ```js
   * var cache = new MapCache();
   * ```
   *
   * @api public
   */

  function MapCache(data) {
    this.__data__ = data || {};
  }

  /**
   * Adds `value` to `key` on the cache.
   *
   * ```js
   * cache.set('foo', 'bar');
   * ```
   *
   * @param {String} `key` The key of the value to cache.
   * @param {*} `value` The value to cache.
   * @returns {Object} Returns the `Cache` object for chaining.
   * @api public
   */

  MapCache.prototype.set = function mapSet(key, value) {
    if (key !== '__proto__') {
      this.__data__[key] = value;
    }
    return this;
  };

  /**
   * Gets the cached value for `key`.
   *
   * ```js
   * cache.get('foo');
   * //=> 'bar'
   * ```
   *
   * @param {String} `key` The key of the value to get.
   * @returns {*} Returns the cached value.
   * @api public
   */

  MapCache.prototype.get = function mapGet(key) {
    return key === '__proto__' ? undefined : this.__data__[key];
  };

  /**
   * Checks if a cached value for `key` exists.
   *
   * ```js
   * cache.has('foo');
   * //=> true
   * ```
   *
   * @param {String} `key` The key of the entry to check.
   * @returns {Boolean} Returns `true` if an entry for `key` exists, else `false`.
   * @api public
   */

  MapCache.prototype.has = function mapHas(key) {
    return key !== '__proto__' && hasOwn$6.call(this.__data__, key);
  };

  /**
   * Removes `key` and its value from the cache.
   *
   * ```js
   * cache.del('foo');
   * ```
   * @title .del
   * @param {String} `key` The key of the value to remove.
   * @returns {Boolean} Returns `true` if the entry was removed successfully, else `false`.
   * @api public
   */

  MapCache.prototype.del = function mapDelete(key) {
    return this.has(key) && delete this.__data__[key];
  };

  /**
   * Store position for a node
   */

  var position = function Position(start, parser) {
    this.start = start;
    this.end = { line: parser.line, column: parser.column };
    defineProperty$3(this, 'content', parser.orig);
    defineProperty$3(this, 'source', parser.options.source);
  };

  var debug$2 = src('snapdragon:parser');



  /**
   * Create a new `Parser` with the given `input` and `options`.
   * @param {String} `input`
   * @param {Object} `options`
   * @api public
   */

  function Parser(options) {
    debug$2('initializing', __filename);
    this.options = utils.extend({source: 'string'}, options);
    this.init(this.options);
    use(this);
  }

  /**
   * Prototype methods
   */

  Parser.prototype = {
    constructor: Parser,

    init: function(options) {
      this.orig = '';
      this.input = '';
      this.parsed = '';

      this.column = 1;
      this.line = 1;

      this.regex = new mapCache();
      this.errors = this.errors || [];
      this.parsers = this.parsers || {};
      this.types = this.types || [];
      this.sets = this.sets || {};
      this.fns = this.fns || [];
      this.currentType = 'root';

      var pos = this.position();
      this.bos = pos({type: 'bos', val: ''});

      this.ast = {
        type: 'root',
        errors: this.errors,
        nodes: [this.bos]
      };

      defineProperty$3(this.bos, 'parent', this.ast);
      this.nodes = [this.ast];

      this.count = 0;
      this.setCount = 0;
      this.stack = [];
    },

    /**
     * Throw a formatted error with the cursor column and `msg`.
     * @param {String} `msg` Message to use in the Error.
     */

    error: function(msg, node) {
      var pos = node.position || {start: {column: 0, line: 0}};
      var line = pos.start.line;
      var column = pos.start.column;
      var source = this.options.source;

      var message = source + ' <line:' + line + ' column:' + column + '>: ' + msg;
      var err = new Error(message);
      err.source = source;
      err.reason = msg;
      err.pos = pos;

      if (this.options.silent) {
        this.errors.push(err);
      } else {
        throw err;
      }
    },

    /**
     * Define a non-enumberable property on the `Parser` instance.
     *
     * ```js
     * parser.define('foo', 'bar');
     * ```
     * @name .define
     * @param {String} `key` propery name
     * @param {any} `val` property value
     * @return {Object} Returns the Parser instance for chaining.
     * @api public
     */

    define: function(key, val) {
      defineProperty$3(this, key, val);
      return this;
    },

    /**
     * Mark position and patch `node.position`.
     */

    position: function() {
      var start = { line: this.line, column: this.column };
      var self = this;

      return function(node) {
        defineProperty$3(node, 'position', new position(start, self));
        return node;
      };
    },

    /**
     * Set parser `name` with the given `fn`
     * @param {String} `name`
     * @param {Function} `fn`
     * @api public
     */

    set: function(type, fn) {
      if (this.types.indexOf(type) === -1) {
        this.types.push(type);
      }
      this.parsers[type] = fn.bind(this);
      return this;
    },

    /**
     * Get parser `name`
     * @param {String} `name`
     * @api public
     */

    get: function(name) {
      return this.parsers[name];
    },

    /**
     * Push a `token` onto the `type` stack.
     *
     * @param {String} `type`
     * @return {Object} `token`
     * @api public
     */

    push: function(type, token) {
      this.sets[type] = this.sets[type] || [];
      this.count++;
      this.stack.push(token);
      return this.sets[type].push(token);
    },

    /**
     * Pop a token off of the `type` stack
     * @param {String} `type`
     * @returns {Object} Returns a token
     * @api public
     */

    pop: function(type) {
      this.sets[type] = this.sets[type] || [];
      this.count--;
      this.stack.pop();
      return this.sets[type].pop();
    },

    /**
     * Return true if inside a `stack` node. Types are `braces`, `parens` or `brackets`.
     *
     * @param {String} `type`
     * @return {Boolean}
     * @api public
     */

    isInside: function(type) {
      this.sets[type] = this.sets[type] || [];
      return this.sets[type].length > 0;
    },

    /**
     * Return true if `node` is the given `type`.
     *
     * ```js
     * parser.isType(node, 'brace');
     * ```
     * @param {Object} `node`
     * @param {String} `type`
     * @return {Boolean}
     * @api public
     */

    isType: function(node, type) {
      return node && node.type === type;
    },

    /**
     * Get the previous AST node
     * @return {Object}
     */

    prev: function(n) {
      return this.stack.length > 0
        ? utils.last(this.stack, n)
        : utils.last(this.nodes, n);
    },

    /**
     * Update line and column based on `str`.
     */

    consume: function(len) {
      this.input = this.input.substr(len);
    },

    /**
     * Update column based on `str`.
     */

    updatePosition: function(str, len) {
      var lines = str.match(/\n/g);
      if (lines) this.line += lines.length;
      var i = str.lastIndexOf('\n');
      this.column = ~i ? len - i : this.column + len;
      this.parsed += str;
      this.consume(len);
    },

    /**
     * Match `regex`, return captures, and update the cursor position by `match[0]` length.
     * @param {RegExp} `regex`
     * @return {Object}
     */

    match: function(regex) {
      var m = regex.exec(this.input);
      if (m) {
        this.updatePosition(m[0], m[0].length);
        return m;
      }
    },

    /**
     * Capture `type` with the given regex.
     * @param {String} `type`
     * @param {RegExp} `regex`
     * @return {Function}
     */

    capture: function(type, regex) {
      if (typeof regex === 'function') {
        return this.set.apply(this, arguments);
      }

      this.regex.set(type, regex);
      this.set(type, function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(regex);
        if (!m || !m[0]) return;

        var prev = this.prev();
        var node = pos({
          type: type,
          val: m[0],
          parsed: parsed,
          rest: this.input
        });

        if (m[1]) {
          node.inner = m[1];
        }

        defineProperty$3(node, 'inside', this.stack.length > 0);
        defineProperty$3(node, 'parent', prev);
        prev.nodes.push(node);
      }.bind(this));
      return this;
    },

    /**
     * Create a parser with open and close for parens,
     * brackets or braces
     */

    capturePair: function(type, openRegex, closeRegex, fn) {
      this.sets[type] = this.sets[type] || [];

      /**
       * Open
       */

      this.set(type + '.open', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(openRegex);
        if (!m || !m[0]) return;

        var val = m[0];
        this.setCount++;
        this.specialChars = true;
        var open = pos({
          type: type + '.open',
          val: val,
          rest: this.input
        });

        if (typeof m[1] !== 'undefined') {
          open.inner = m[1];
        }

        var prev = this.prev();
        var node = pos({
          type: type,
          nodes: [open]
        });

        defineProperty$3(node, 'rest', this.input);
        defineProperty$3(node, 'parsed', parsed);
        defineProperty$3(node, 'prefix', m[1]);
        defineProperty$3(node, 'parent', prev);
        defineProperty$3(open, 'parent', node);

        if (typeof fn === 'function') {
          fn.call(this, open, node);
        }

        this.push(type, node);
        prev.nodes.push(node);
      });

      /**
       * Close
       */

      this.set(type + '.close', function() {
        var pos = this.position();
        var m = this.match(closeRegex);
        if (!m || !m[0]) return;

        var parent = this.pop(type);
        var node = pos({
          type: type + '.close',
          rest: this.input,
          suffix: m[1],
          val: m[0]
        });

        if (!this.isType(parent, type)) {
          if (this.options.strict) {
            throw new Error('missing opening "' + type + '"');
          }

          this.setCount--;
          node.escaped = true;
          return node;
        }

        if (node.suffix === '\\') {
          parent.escaped = true;
          node.escaped = true;
        }

        parent.nodes.push(node);
        defineProperty$3(node, 'parent', parent);
      });

      return this;
    },

    /**
     * Capture end-of-string
     */

    eos: function() {
      var pos = this.position();
      if (this.input) return;
      var prev = this.prev();

      while (prev.type !== 'root' && !prev.visited) {
        if (this.options.strict === true) {
          throw new SyntaxError('invalid syntax:' + util.inspect(prev, null, 2));
        }

        if (!hasDelims(prev)) {
          prev.parent.escaped = true;
          prev.escaped = true;
        }

        visit(prev, function(node) {
          if (!hasDelims(node.parent)) {
            node.parent.escaped = true;
            node.escaped = true;
          }
        });

        prev = prev.parent;
      }

      var tok = pos({
        type: 'eos',
        val: this.append || ''
      });

      defineProperty$3(tok, 'parent', this.ast);
      return tok;
    },

    /**
     * Run parsers to advance the cursor position
     */

    next: function() {
      var parsed = this.parsed;
      var len = this.types.length;
      var idx = -1;
      var tok;

      while (++idx < len) {
        if ((tok = this.parsers[this.types[idx]].call(this))) {
          defineProperty$3(tok, 'rest', this.input);
          defineProperty$3(tok, 'parsed', parsed);
          this.last = tok;
          return tok;
        }
      }
    },

    /**
     * Parse the given string.
     * @return {Array}
     */

    parse: function(input) {
      if (typeof input !== 'string') {
        throw new TypeError('expected a string');
      }

      this.init(this.options);
      this.orig = input;
      this.input = input;
      var self = this;

      function parse() {
        // check input before calling `.next()`
        input = self.input;

        // get the next AST ndoe
        var node = self.next();
        if (node) {
          var prev = self.prev();
          if (prev) {
            defineProperty$3(node, 'parent', prev);
            if (prev.nodes) {
              prev.nodes.push(node);
            }
          }

          if (self.sets.hasOwnProperty(prev.type)) {
            self.currentType = prev.type;
          }
        }

        // if we got here but input is not changed, throw an error
        if (self.input && input === self.input) {
          throw new Error('no parsers registered for: "' + self.input.slice(0, 5) + '"');
        }
      }

      while (this.input) parse();
      if (this.stack.length && this.options.strict) {
        var node = this.stack.pop();
        throw this.error('missing opening ' + node.type + ': "' + this.orig + '"');
      }

      var eos = this.eos();
      var tok = this.prev();
      if (tok.type !== 'eos') {
        this.ast.nodes.push(eos);
      }

      return this.ast;
    }
  };

  /**
   * Visit `node` with the given `fn`
   */

  function visit(node, fn) {
    if (!node.visited) {
      defineProperty$3(node, 'visited', true);
      return node.nodes ? mapVisit$1(node.nodes, fn) : fn(node);
    }
    return node;
  }

  /**
   * Map visit over array of `nodes`.
   */

  function mapVisit$1(nodes, fn) {
    var len = nodes.length;
    var idx = -1;
    while (++idx < len) {
      visit(nodes[idx], fn);
    }
  }

  function hasOpen(node) {
    return node.nodes && node.nodes[0].type === (node.type + '.open');
  }

  function hasClose(node) {
    return node.nodes && utils.last(node.nodes).type === (node.type + '.close');
  }

  function hasDelims(node) {
    return hasOpen(node) && hasClose(node);
  }

  /**
   * Expose `Parser`
   */

  var parser = Parser;

  /**
   * Create a new instance of `Snapdragon` with the given `options`.
   *
   * ```js
   * var snapdragon = new Snapdragon();
   * ```
   *
   * @param {Object} `options`
   * @api public
   */

  function Snapdragon(options) {
    base.call(this, null, options);
    this.options = utils.extend({source: 'string'}, this.options);
    this.compiler = new compiler(this.options);
    this.parser = new parser(this.options);

    Object.defineProperty(this, 'compilers', {
      get: function() {
        return this.compiler.compilers;
      }
    });

    Object.defineProperty(this, 'parsers', {
      get: function() {
        return this.parser.parsers;
      }
    });

    Object.defineProperty(this, 'regex', {
      get: function() {
        return this.parser.regex;
      }
    });
  }

  /**
   * Inherit Base
   */

  base.extend(Snapdragon);

  /**
   * Add a parser to `snapdragon.parsers` for capturing the given `type` using
   * the specified regex or parser function. A function is useful if you need
   * to customize how the token is created and/or have access to the parser
   * instance to check options, etc.
   *
   * ```js
   * snapdragon
   *   .capture('slash', /^\//)
   *   .capture('dot', function() {
   *     var pos = this.position();
   *     var m = this.match(/^\./);
   *     if (!m) return;
   *     return pos({
   *       type: 'dot',
   *       val: m[0]
   *     });
   *   });
   * ```
   * @param {String} `type`
   * @param {RegExp|Function} `regex`
   * @return {Object} Returns the parser instance for chaining
   * @api public
   */

  Snapdragon.prototype.capture = function() {
    return this.parser.capture.apply(this.parser, arguments);
  };

  /**
   * Register a plugin `fn`.
   *
   * ```js
   * var snapdragon = new Snapdgragon([options]);
   * snapdragon.use(function() {
   *   console.log(this);          //<= snapdragon instance
   *   console.log(this.parser);   //<= parser instance
   *   console.log(this.compiler); //<= compiler instance
   * });
   * ```
   * @param {Object} `fn`
   * @api public
   */

  Snapdragon.prototype.use = function(fn) {
    fn.call(this, this);
    return this;
  };

  /**
   * Parse the given `str`.
   *
   * ```js
   * var snapdragon = new Snapdgragon([options]);
   * // register parsers
   * snapdragon.parser.use(function() {});
   *
   * // parse
   * var ast = snapdragon.parse('foo/bar');
   * console.log(ast);
   * ```
   * @param {String} `str`
   * @param {Object} `options` Set `options.sourcemap` to true to enable source maps.
   * @return {Object} Returns an AST.
   * @api public
   */

  Snapdragon.prototype.parse = function(str, options) {
    this.options = utils.extend({}, this.options, options);
    var parsed = this.parser.parse(str, this.options);

    // add non-enumerable parser reference
    defineProperty$3(parsed, 'parser', this.parser);
    return parsed;
  };

  /**
   * Compile the given `AST`.
   *
   * ```js
   * var snapdragon = new Snapdgragon([options]);
   * // register plugins
   * snapdragon.use(function() {});
   * // register parser plugins
   * snapdragon.parser.use(function() {});
   * // register compiler plugins
   * snapdragon.compiler.use(function() {});
   *
   * // parse
   * var ast = snapdragon.parse('foo/bar');
   *
   * // compile
   * var res = snapdragon.compile(ast);
   * console.log(res.output);
   * ```
   * @param {Object} `ast`
   * @param {Object} `options`
   * @return {Object} Returns an object with an `output` property with the rendered string.
   * @api public
   */

  Snapdragon.prototype.compile = function(ast, options) {
    this.options = utils.extend({}, this.options, options);
    var compiled = this.compiler.compile(ast, this.options);

    // add non-enumerable compiler reference
    defineProperty$3(compiled, 'compiler', this.compiler);
    return compiled;
  };

  /**
   * Expose `Snapdragon`
   */

  var snapdragon = Snapdragon;

  /**
   * Expose `Parser` and `Compiler`
   */

  var Compiler_1 = compiler;
  var Parser_1 = parser;
  snapdragon.Compiler = Compiler_1;
  snapdragon.Parser = Parser_1;

  /**
   * Customize Snapdragon parser and renderer
   */

  function Braces(options) {
    this.options = extendShallow$2({}, options);
  }

  /**
   * Initialize braces
   */

  Braces.prototype.init = function(options) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    var opts = utils_1.createOptions({}, this.options, options);
    this.snapdragon = this.options.snapdragon || new snapdragon(opts);
    this.compiler = this.snapdragon.compiler;
    this.parser = this.snapdragon.parser;

    compilers(this.snapdragon, opts);
    parsers(this.snapdragon, opts);

    /**
     * Call Snapdragon `.parse` method. When AST is returned, we check to
     * see if any unclosed braces are left on the stack and, if so, we iterate
     * over the stack and correct the AST so that compilers are called in the correct
     * order and unbalance braces are properly escaped.
     */

    utils_1.define(this.snapdragon, 'parse', function(pattern, options) {
      var parsed = snapdragon.prototype.parse.apply(this, arguments);
      this.parser.ast.input = pattern;

      var stack = this.parser.stack;
      while (stack.length) {
        addParent({type: 'brace.close', val: ''}, stack.pop());
      }

      function addParent(node, parent) {
        utils_1.define(node, 'parent', parent);
        parent.nodes.push(node);
      }

      // add non-enumerable parser reference
      utils_1.define(parsed, 'parser', this.parser);
      return parsed;
    });
  };

  /**
   * Decorate `.parse` method
   */

  Braces.prototype.parse = function(ast, options) {
    if (ast && typeof ast === 'object' && ast.nodes) return ast;
    this.init(options);
    return this.snapdragon.parse(ast, options);
  };

  /**
   * Decorate `.compile` method
   */

  Braces.prototype.compile = function(ast, options) {
    if (typeof ast === 'string') {
      ast = this.parse(ast, options);
    } else {
      this.init(options);
    }
    return this.snapdragon.compile(ast, options);
  };

  /**
   * Expand
   */

  Braces.prototype.expand = function(pattern) {
    var ast = this.parse(pattern, {expand: true});
    return this.compile(ast, {expand: true});
  };

  /**
   * Optimize
   */

  Braces.prototype.optimize = function(pattern) {
    var ast = this.parse(pattern, {optimize: true});
    return this.compile(ast, {optimize: true});
  };

  /**
   * Expose `Braces`
   */

  var braces = Braces;

  /**
   * Module dependencies
   */





  /**
   * Local dependencies
   */





  var MAX_LENGTH$1 = 1024 * 64;
  var cache$4 = {};

  /**
   * Convert the given `braces` pattern into a regex-compatible string. By default, only one string is generated for every input string. Set `options.expand` to true to return an array of patterns (similar to Bash or minimatch. Before using `options.expand`, it's recommended that you read the [performance notes](#performance)).
   *
   * ```js
   * var braces = require('braces');
   * console.log(braces('{a,b,c}'));
   * //=> ['(a|b|c)']
   *
   * console.log(braces('{a,b,c}', {expand: true}));
   * //=> ['a', 'b', 'c']
   * ```
   * @param {String} `str`
   * @param {Object} `options`
   * @return {String}
   * @api public
   */

  function braces$1(pattern, options) {
    var key = utils_1.createKey(String(pattern), options);
    var arr = [];

    var disabled = options && options.cache === false;
    if (!disabled && cache$4.hasOwnProperty(key)) {
      return cache$4[key];
    }

    if (Array.isArray(pattern)) {
      for (var i = 0; i < pattern.length; i++) {
        arr.push.apply(arr, braces$1.create(pattern[i], options));
      }
    } else {
      arr = braces$1.create(pattern, options);
    }

    if (options && options.nodupes === true) {
      arr = arrayUnique(arr);
    }

    if (!disabled) {
      cache$4[key] = arr;
    }
    return arr;
  }

  /**
   * Expands a brace pattern into an array. This method is called by the main [braces](#braces) function when `options.expand` is true. Before using this method it's recommended that you read the [performance notes](#performance)) and advantages of using [.optimize](#optimize) instead.
   *
   * ```js
   * var braces = require('braces');
   * console.log(braces.expand('a/{b,c}/d'));
   * //=> ['a/b/d', 'a/c/d'];
   * ```
   * @param {String} `pattern` Brace pattern
   * @param {Object} `options`
   * @return {Array} Returns an array of expanded values.
   * @api public
   */

  braces$1.expand = function(pattern, options) {
    return braces$1.create(pattern, extendShallow$2({}, options, {expand: true}));
  };

  /**
   * Expands a brace pattern into a regex-compatible, optimized string. This method is called by the main [braces](#braces) function by default.
   *
   * ```js
   * var braces = require('braces');
   * console.log(braces.expand('a/{b,c}/d'));
   * //=> ['a/(b|c)/d']
   * ```
   * @param {String} `pattern` Brace pattern
   * @param {Object} `options`
   * @return {Array} Returns an array of expanded values.
   * @api public
   */

  braces$1.optimize = function(pattern, options) {
    return braces$1.create(pattern, options);
  };

  /**
   * Processes a brace pattern and returns either an expanded array (if `options.expand` is true), a highly optimized regex-compatible string. This method is called by the main [braces](#braces) function.
   *
   * ```js
   * var braces = require('braces');
   * console.log(braces.create('user-{200..300}/project-{a,b,c}-{1..10}'))
   * //=> 'user-(20[0-9]|2[1-9][0-9]|300)/project-(a|b|c)-([1-9]|10)'
   * ```
   * @param {String} `pattern` Brace pattern
   * @param {Object} `options`
   * @return {Array} Returns an array of expanded values.
   * @api public
   */

  braces$1.create = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected a string');
    }

    var maxLength = (options && options.maxLength) || MAX_LENGTH$1;
    if (pattern.length >= maxLength) {
      throw new Error('expected pattern to be less than ' + maxLength + ' characters');
    }

    function create() {
      if (pattern === '' || pattern.length < 3) {
        return [pattern];
      }

      if (utils_1.isEmptySets(pattern)) {
        return [];
      }

      if (utils_1.isQuotedString(pattern)) {
        return [pattern.slice(1, -1)];
      }

      var proto = new braces(options);
      var result = !options || options.expand !== true
        ? proto.optimize(pattern, options)
        : proto.expand(pattern, options);

      // get the generated pattern(s)
      var arr = result.output;

      // filter out empty strings if specified
      if (options && options.noempty === true) {
        arr = arr.filter(Boolean);
      }

      // filter out duplicates if specified
      if (options && options.nodupes === true) {
        arr = arrayUnique(arr);
      }

      Object.defineProperty(arr, 'result', {
        enumerable: false,
        value: result
      });

      return arr;
    }

    return memoize$1('create', pattern, options, create);
  };

  /**
   * Create a regular expression from the given string `pattern`.
   *
   * ```js
   * var braces = require('braces');
   *
   * console.log(braces.makeRe('id-{200..300}'));
   * //=> /^(?:id-(20[0-9]|2[1-9][0-9]|300))$/
   * ```
   * @param {String} `pattern` The pattern to convert to regex.
   * @param {Object} `options`
   * @return {RegExp}
   * @api public
   */

  braces$1.makeRe = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected a string');
    }

    var maxLength = (options && options.maxLength) || MAX_LENGTH$1;
    if (pattern.length >= maxLength) {
      throw new Error('expected pattern to be less than ' + maxLength + ' characters');
    }

    function makeRe() {
      var arr = braces$1(pattern, options);
      var opts = extendShallow$2({strictErrors: false}, options);
      return toRegex$1(arr, opts);
    }

    return memoize$1('makeRe', pattern, options, makeRe);
  };

  /**
   * Parse the given `str` with the given `options`.
   *
   * ```js
   * var braces = require('braces');
   * var ast = braces.parse('a/{b,c}/d');
   * console.log(ast);
   * // { type: 'root',
   * //   errors: [],
   * //   input: 'a/{b,c}/d',
   * //   nodes:
   * //    [ { type: 'bos', val: '' },
   * //      { type: 'text', val: 'a/' },
   * //      { type: 'brace',
   * //        nodes:
   * //         [ { type: 'brace.open', val: '{' },
   * //           { type: 'text', val: 'b,c' },
   * //           { type: 'brace.close', val: '}' } ] },
   * //      { type: 'text', val: '/d' },
   * //      { type: 'eos', val: '' } ] }
   * ```
   * @param {String} `pattern` Brace pattern to parse
   * @param {Object} `options`
   * @return {Object} Returns an AST
   * @api public
   */

  braces$1.parse = function(pattern, options) {
    var proto = new braces(options);
    return proto.parse(pattern, options);
  };

  /**
   * Compile the given `ast` or string with the given `options`.
   *
   * ```js
   * var braces = require('braces');
   * var ast = braces.parse('a/{b,c}/d');
   * console.log(braces.compile(ast));
   * // { options: { source: 'string' },
   * //   state: {},
   * //   compilers:
   * //    { eos: [Function],
   * //      noop: [Function],
   * //      bos: [Function],
   * //      brace: [Function],
   * //      'brace.open': [Function],
   * //      text: [Function],
   * //      'brace.close': [Function] },
   * //   output: [ 'a/(b|c)/d' ],
   * //   ast:
   * //    { ... },
   * //   parsingErrors: [] }
   * ```
   * @param {Object|String} `ast` AST from [.parse](#parse). If a string is passed it will be parsed first.
   * @param {Object} `options`
   * @return {Object} Returns an object that has an `output` property with the compiled string.
   * @api public
   */

  braces$1.compile = function(ast, options) {
    var proto = new braces(options);
    return proto.compile(ast, options);
  };

  /**
   * Clear the regex cache.
   *
   * ```js
   * braces.clearCache();
   * ```
   * @api public
   */

  braces$1.clearCache = function() {
    cache$4 = braces$1.cache = {};
  };

  /**
   * Memoize a generated regex or function. A unique key is generated
   * from the method name, pattern, and user-defined options. Set
   * options.memoize to false to disable.
   */

  function memoize$1(type, pattern, options, fn) {
    var key = utils_1.createKey(type + ':' + pattern, options);
    var disabled = options && options.cache === false;
    if (disabled) {
      braces$1.clearCache();
      return fn(pattern, options);
    }

    if (cache$4.hasOwnProperty(key)) {
      return cache$4[key];
    }

    var res = fn(pattern, options);
    cache$4[key] = res;
    return res;
  }

  /**
   * Expose `Braces` constructor and methods
   * @type {Function}
   */

  braces$1.Braces = braces;
  braces$1.compilers = compilers;
  braces$1.parsers = parsers;
  braces$1.cache = cache$4;

  /**
   * Expose `braces`
   * @type {Function}
   */

  var braces_1 = braces$1;

  var isExtendable$7 = function isExtendable(val) {
    return isPlainObject(val) || typeof val === 'function' || Array.isArray(val);
  };

  var extendShallow$6 = Object.assign || function(obj/*, objects*/) {
    if (obj === null || typeof obj === 'undefined') {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    if (!isObject$a(obj)) {
      obj = {};
    }
    for (var i = 1; i < arguments.length; i++) {
      var val = arguments[i];
      if (isString$4(val)) {
        val = toObject$3(val);
      }
      if (isObject$a(val)) {
        assign$6(obj, val);
        assignSymbols(obj, val);
      }
    }
    return obj;
  };

  function assign$6(a, b) {
    for (var key in b) {
      if (hasOwn$7(b, key)) {
        a[key] = b[key];
      }
    }
  }

  function isString$4(val) {
    return (val && typeof val === 'string');
  }

  function toObject$3(str) {
    var obj = {};
    for (var i in str) {
      obj[i] = str[i];
    }
    return obj;
  }

  function isObject$a(val) {
    return (val && typeof val === 'object') || isExtendable$7(val);
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$7(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  var isExtendable$8 = function isExtendable(val) {
    return isPlainObject(val) || typeof val === 'function' || Array.isArray(val);
  };

  var extendShallow$7 = Object.assign || function(obj/*, objects*/) {
    if (obj === null || typeof obj === 'undefined') {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    if (!isObject$b(obj)) {
      obj = {};
    }
    for (var i = 1; i < arguments.length; i++) {
      var val = arguments[i];
      if (isString$5(val)) {
        val = toObject$4(val);
      }
      if (isObject$b(val)) {
        assign$7(obj, val);
        assignSymbols(obj, val);
      }
    }
    return obj;
  };

  function assign$7(a, b) {
    for (var key in b) {
      if (hasOwn$8(b, key)) {
        a[key] = b[key];
      }
    }
  }

  function isString$5(val) {
    return (val && typeof val === 'string');
  }

  function toObject$4(str) {
    var obj = {};
    for (var i in str) {
      obj[i] = str[i];
    }
    return obj;
  }

  function isObject$b(val) {
    return (val && typeof val === 'object') || isExtendable$8(val);
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$8(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
  * Nanomatch compilers
  */

  var compilers$1 = function(nanomatch, options) {
    function slash() {
      if (options && typeof options.slash === 'string') {
        return options.slash;
      }
      if (options && typeof options.slash === 'function') {
        return options.slash.call(nanomatch);
      }
      return '\\\\/';
    }

    function star() {
      if (options && typeof options.star === 'string') {
        return options.star;
      }
      if (options && typeof options.star === 'function') {
        return options.star.call(nanomatch);
      }
      return '[^' + slash() + ']*?';
    }

    var ast = nanomatch.ast = nanomatch.parser.ast;
    ast.state = nanomatch.parser.state;
    nanomatch.compiler.state = ast.state;
    nanomatch.compiler

      /**
       * Negation / escaping
       */

      .set('not', function(node) {
        var prev = this.prev();
        if (this.options.nonegate === true || prev.type !== 'bos') {
          return this.emit('\\' + node.val, node);
        }
        return this.emit(node.val, node);
      })
      .set('escape', function(node) {
        if (this.options.unescape && /^[-\w_.]/.test(node.val)) {
          return this.emit(node.val, node);
        }
        return this.emit('\\' + node.val, node);
      })
      .set('quoted', function(node) {
        return this.emit(node.val, node);
      })

      /**
       * Regex
       */

      .set('dollar', function(node) {
        if (node.parent.type === 'bracket') {
          return this.emit(node.val, node);
        }
        return this.emit('\\' + node.val, node);
      })

      /**
       * Dot: "."
       */

      .set('dot', function(node) {
        if (node.dotfiles === true) this.dotfiles = true;
        return this.emit('\\' + node.val, node);
      })

      /**
       * Slashes: "/" and "\"
       */

      .set('backslash', function(node) {
        return this.emit(node.val, node);
      })
      .set('slash', function(node, nodes, i) {
        var val = '[' + slash() + ']';
        var parent = node.parent;
        var prev = this.prev();

        // set "node.hasSlash" to true on all ancestor parens nodes
        while (parent.type === 'paren' && !parent.hasSlash) {
          parent.hasSlash = true;
          parent = parent.parent;
        }

        if (prev.addQmark) {
          val += '?';
        }

        // word boundary
        if (node.rest.slice(0, 2) === '\\b') {
          return this.emit(val, node);
        }

        // globstars
        if (node.parsed === '**' || node.parsed === './**') {
          this.output = '(?:' + this.output;
          return this.emit(val + ')?', node);
        }

        // negation
        if (node.parsed === '!**' && this.options.nonegate !== true) {
          return this.emit(val + '?\\b', node);
        }
        return this.emit(val, node);
      })

      /**
       * Square brackets
       */

      .set('bracket', function(node) {
        var close = node.close;
        var open = !node.escaped ? '[' : '\\[';
        var negated = node.negated;
        var inner = node.inner;
        var val = node.val;

        if (node.escaped === true) {
          inner = inner.replace(/\\?(\W)/g, '\\$1');
          negated = '';
        }

        if (inner === ']-') {
          inner = '\\]\\-';
        }

        if (negated && inner.indexOf('.') === -1) {
          inner += '.';
        }
        if (negated && inner.indexOf('/') === -1) {
          inner += '/';
        }

        val = open + negated + inner + close;
        return this.emit(val, node);
      })

      /**
       * Square: "[.]" (only matches a single character in brackets)
       */

      .set('square', function(node) {
        var val = (/^\W/.test(node.val) ? '\\' : '') + node.val;
        return this.emit(val, node);
      })

      /**
       * Question mark: "?"
       */

      .set('qmark', function(node) {
        var prev = this.prev();
        // don't use "slash" variable so that we always avoid
        // matching backslashes and slashes with a qmark
        var val = '[^.\\\\/]';
        if (this.options.dot || (prev.type !== 'bos' && prev.type !== 'slash')) {
          val = '[^\\\\/]';
        }

        if (node.parsed.slice(-1) === '(') {
          var ch = node.rest.charAt(0);
          if (ch === '!' || ch === '=' || ch === ':') {
            return this.emit(node.val, node);
          }
        }

        if (node.val.length > 1) {
          val += '{' + node.val.length + '}';
        }
        return this.emit(val, node);
      })

      /**
       * Plus
       */

      .set('plus', function(node) {
        var prev = node.parsed.slice(-1);
        if (prev === ']' || prev === ')') {
          return this.emit(node.val, node);
        }
        if (!this.output || (/[?*+]/.test(ch) && node.parent.type !== 'bracket')) {
          return this.emit('\\+', node);
        }
        var ch = this.output.slice(-1);
        if (/\w/.test(ch) && !node.inside) {
          return this.emit('+\\+?', node);
        }
        return this.emit('+', node);
      })

      /**
       * globstar: '**'
       */

      .set('globstar', function(node, nodes, i) {
        if (!this.output) {
          this.state.leadingGlobstar = true;
        }

        var prev = this.prev();
        var before = this.prev(2);
        var next = this.next();
        var after = this.next(2);
        var type = prev.type;
        var val = node.val;

        if (prev.type === 'slash' && next.type === 'slash') {
          if (before.type === 'text') {
            this.output += '?';

            if (after.type !== 'text') {
              this.output += '\\b';
            }
          }
        }

        var parsed = node.parsed;
        if (parsed.charAt(0) === '!') {
          parsed = parsed.slice(1);
        }

        var isInside = node.isInside.paren || node.isInside.brace;
        if (parsed && type !== 'slash' && type !== 'bos' && !isInside) {
          val = star();
        } else {
          val = this.options.dot !== true
            ? '(?:(?!(?:[' + slash() + ']|^)\\.).)*?'
            : '(?:(?!(?:[' + slash() + ']|^)(?:\\.{1,2})($|[' + slash() + ']))(?!\\.{2}).)*?';
        }

        if ((type === 'slash' || type === 'bos') && this.options.dot !== true) {
          val = '(?!\\.)' + val;
        }

        if (prev.type === 'slash' && next.type === 'slash' && before.type !== 'text') {
          if (after.type === 'text' || after.type === 'star') {
            node.addQmark = true;
          }
        }

        if (this.options.capture) {
          val = '(' + val + ')';
        }

        return this.emit(val, node);
      })

      /**
       * Star: "*"
       */

      .set('star', function(node, nodes, i) {
        var prior = nodes[i - 2] || {};
        var prev = this.prev();
        var next = this.next();
        var type = prev.type;

        function isStart(n) {
          return n.type === 'bos' || n.type === 'slash';
        }

        if (this.output === '' && this.options.contains !== true) {
          this.output = '(?![' + slash() + '])';
        }

        if (type === 'bracket' && this.options.bash === false) {
          var str = next && next.type === 'bracket' ? star() : '*?';
          if (!prev.nodes || prev.nodes[1].type !== 'posix') {
            return this.emit(str, node);
          }
        }

        var prefix = !this.dotfiles && type !== 'text' && type !== 'escape'
          ? (this.options.dot ? '(?!(?:^|[' + slash() + '])\\.{1,2}(?:$|[' + slash() + ']))' : '(?!\\.)')
          : '';

        if (isStart(prev) || (isStart(prior) && type === 'not')) {
          if (prefix !== '(?!\\.)') {
            prefix += '(?!(\\.{2}|\\.[' + slash() + ']))(?=.)';
          } else {
            prefix += '(?=.)';
          }
        } else if (prefix === '(?!\\.)') {
          prefix = '';
        }

        if (prev.type === 'not' && prior.type === 'bos' && this.options.dot === true) {
          this.output = '(?!\\.)' + this.output;
        }

        var output = prefix + star();
        if (this.options.capture) {
          output = '(' + output + ')';
        }

        return this.emit(output, node);
      })

      /**
       * Text
       */

      .set('text', function(node) {
        return this.emit(node.val, node);
      })

      /**
       * End-of-string
       */

      .set('eos', function(node) {
        var prev = this.prev();
        var val = node.val;

        this.output = '(?:\\.[' + slash() + '](?=.))?' + this.output;
        if (this.state.metachar && prev.type !== 'qmark' && prev.type !== 'slash') {
          val += (this.options.contains ? '[' + slash() + ']?' : '(?:[' + slash() + ']|$)');
        }

        return this.emit(val, node);
      });

    /**
     * Allow custom compilers to be passed on options
     */

    if (options && typeof options.compilers === 'function') {
      options.compilers(nanomatch.compiler);
    }
  };

  /**
   * Characters to use in negation regex (we want to "not" match
   * characters that are matched by other parsers)
   */

  var cached;
  var NOT_REGEX = '[\\[!*+?$^"\'.\\\\/]+';
  var not = createTextRegex(NOT_REGEX);

  /**
   * Nanomatch parsers
   */

  var parsers$1 = function(nanomatch, options) {
    var parser = nanomatch.parser;
    var opts = parser.options;

    parser.state = {
      slashes: 0,
      paths: []
    };

    parser.ast.state = parser.state;
    parser

      /**
       * Beginning-of-string
       */

      .capture('prefix', function() {
        if (this.parsed) return;
        var m = this.match(/^\.[\\/]/);
        if (!m) return;
        this.state.strictOpen = !!this.options.strictOpen;
        this.state.addPrefix = true;
      })

      /**
       * Escape: "\\."
       */

      .capture('escape', function() {
        if (this.isInside('bracket')) return;
        var pos = this.position();
        var m = this.match(/^(?:\\(.)|([$^]))/);
        if (!m) return;

        return pos({
          type: 'escape',
          val: m[2] || m[1]
        });
      })

      /**
       * Quoted strings
       */

      .capture('quoted', function() {
        var pos = this.position();
        var m = this.match(/^["']/);
        if (!m) return;

        var quote = m[0];
        if (this.input.indexOf(quote) === -1) {
          return pos({
            type: 'escape',
            val: quote
          });
        }

        var tok = advanceTo(this.input, quote);
        this.consume(tok.len);

        return pos({
          type: 'quoted',
          val: tok.esc
        });
      })

      /**
       * Negations: "!"
       */

      .capture('not', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(this.notRegex || /^!+/);
        if (!m) return;
        var val = m[0];

        var isNegated = (val.length % 2) === 1;
        if (parsed === '' && !isNegated) {
          val = '';
        }

        // if nothing has been parsed, we know `!` is at the start,
        // so we need to wrap the result in a negation regex
        if (parsed === '' && isNegated && this.options.nonegate !== true) {
          this.bos.val = '(?!^(?:';
          this.append = ')$).*';
          val = '';
        }
        return pos({
          type: 'not',
          val: val
        });
      })

      /**
       * Dot: "."
       */

      .capture('dot', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^\.+/);
        if (!m) return;

        var val = m[0];
        this.state.dot = val === '.' && (parsed === '' || parsed.slice(-1) === '/');

        return pos({
          type: 'dot',
          dotfiles: this.state.dot,
          val: val
        });
      })

      /**
       * Plus: "+"
       */

      .capture('plus', /^\+(?!\()/)

      /**
       * Question mark: "?"
       */

      .capture('qmark', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^\?+(?!\()/);
        if (!m) return;

        this.state.metachar = true;
        this.state.qmark = true;

        return pos({
          type: 'qmark',
          parsed: parsed,
          val: m[0]
        });
      })

      /**
       * Globstar: "**"
       */

      .capture('globstar', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^\*{2}(?![*(])(?=[,)/]|$)/);
        if (!m) return;

        var type = opts.noglobstar !== true ? 'globstar' : 'star';
        var node = pos({type: type, parsed: parsed});
        this.state.metachar = true;

        while (this.input.slice(0, 4) === '/**/') {
          this.input = this.input.slice(3);
        }

        node.isInside = {
          brace: this.isInside('brace'),
          paren: this.isInside('paren')
        };

        if (type === 'globstar') {
          this.state.globstar = true;
          node.val = '**';

        } else {
          this.state.star = true;
          node.val = '*';
        }

        return node;
      })

      /**
       * Star: "*"
       */

      .capture('star', function() {
        var pos = this.position();
        var starRe = /^(?:\*(?![*(])|[*]{3,}(?!\()|[*]{2}(?![(/]|$)|\*(?=\*\())/;
        var m = this.match(starRe);
        if (!m) return;

        this.state.metachar = true;
        this.state.star = true;
        return pos({
          type: 'star',
          val: m[0]
        });
      })

      /**
       * Slash: "/"
       */

      .capture('slash', function() {
        var pos = this.position();
        var m = this.match(/^\//);
        if (!m) return;

        this.state.slashes++;
        return pos({
          type: 'slash',
          val: m[0]
        });
      })

      /**
       * Backslash: "\\"
       */

      .capture('backslash', function() {
        var pos = this.position();
        var m = this.match(/^\\(?![*+?(){}[\]'"])/);
        if (!m) return;

        var val = m[0];

        if (this.isInside('bracket')) {
          val = '\\';
        } else if (val.length > 1) {
          val = '\\\\';
        }

        return pos({
          type: 'backslash',
          val: val
        });
      })

      /**
       * Square: "[.]"
       */

      .capture('square', function() {
        if (this.isInside('bracket')) return;
        var pos = this.position();
        var m = this.match(/^\[([^!^\\])\]/);
        if (!m) return;

        return pos({
          type: 'square',
          val: m[1]
        });
      })

      /**
       * Brackets: "[...]" (basic, this can be overridden by other parsers)
       */

      .capture('bracket', function() {
        var pos = this.position();
        var m = this.match(/^(?:\[([!^]?)([^\]]+|\]-)(\]|[^*+?]+)|\[)/);
        if (!m) return;

        var val = m[0];
        var negated = m[1] ? '^' : '';
        var inner = (m[2] || '').replace(/\\\\+/, '\\\\');
        var close = m[3] || '';

        if (m[2] && inner.length < m[2].length) {
          val = val.replace(/\\\\+/, '\\\\');
        }

        var esc = this.input.slice(0, 2);
        if (inner === '' && esc === '\\]') {
          inner += esc;
          this.consume(2);

          var str = this.input;
          var idx = -1;
          var ch;

          while ((ch = str[++idx])) {
            this.consume(1);
            if (ch === ']') {
              close = ch;
              break;
            }
            inner += ch;
          }
        }

        return pos({
          type: 'bracket',
          val: val,
          escaped: close !== ']',
          negated: negated,
          inner: inner,
          close: close
        });
      })

      /**
       * Text
       */

      .capture('text', function() {
        if (this.isInside('bracket')) return;
        var pos = this.position();
        var m = this.match(not);
        if (!m || !m[0]) return;

        return pos({
          type: 'text',
          val: m[0]
        });
      });

    /**
     * Allow custom parsers to be passed on options
     */

    if (options && typeof options.parsers === 'function') {
      options.parsers(nanomatch.parser);
    }
  };

  /**
   * Advance to the next non-escaped character
   */

  function advanceTo(input, endChar) {
    var ch = input.charAt(0);
    var tok = { len: 1, val: '', esc: '' };
    var idx = 0;

    function advance() {
      if (ch !== '\\') {
        tok.esc += '\\' + ch;
        tok.val += ch;
      }

      ch = input.charAt(++idx);
      tok.len++;

      if (ch === '\\') {
        advance();
        advance();
      }
    }

    while (ch && ch !== endChar) {
      advance();
    }
    return tok;
  }

  /**
   * Create text regex
   */

  function createTextRegex(pattern) {
    if (cached) return cached;
    var opts = {contains: true, strictClose: false};
    var not = regexNot.create(pattern, opts);
    var re = toRegex$1('^(?:[*]\\((?=.)|' + not + ')', opts);
    return (cached = re);
  }

  /**
   * Expose negation string
   */

  var not_1 = NOT_REGEX;
  parsers$1.not = not_1;

  var fragmentCache = createCommonjsModule(function (module, exports) {



  /**
   * Create a new `FragmentCache` with an optional object to use for `caches`.
   *
   * ```js
   * var fragment = new FragmentCache();
   * ```
   * @name FragmentCache
   * @param {String} `cacheName`
   * @return {Object} Returns the [map-cache][] instance.
   * @api public
   */

  function FragmentCache(caches) {
    this.caches = caches || {};
  }

  /**
   * Prototype
   */

  FragmentCache.prototype = {

    /**
     * Get cache `name` from the `fragment.caches` object. Creates a new
     * `MapCache` if it doesn't already exist.
     *
     * ```js
     * var cache = fragment.cache('files');
     * console.log(fragment.caches.hasOwnProperty('files'));
     * //=> true
     * ```
     * @name .cache
     * @param {String} `cacheName`
     * @return {Object} Returns the [map-cache][] instance.
     * @api public
     */

    cache: function(cacheName) {
      return this.caches[cacheName] || (this.caches[cacheName] = new mapCache());
    },

    /**
     * Set a value for property `key` on cache `name`
     *
     * ```js
     * fragment.set('files', 'somefile.js', new File({path: 'somefile.js'}));
     * ```
     * @name .set
     * @param {String} `name`
     * @param {String} `key` Property name to set
     * @param {any} `val` The value of `key`
     * @return {Object} The cache instance for chaining
     * @api public
     */

    set: function(cacheName, key, val) {
      var cache = this.cache(cacheName);
      cache.set(key, val);
      return cache;
    },

    /**
     * Returns true if a non-undefined value is set for `key` on fragment cache `name`.
     *
     * ```js
     * var cache = fragment.cache('files');
     * cache.set('somefile.js');
     *
     * console.log(cache.has('somefile.js'));
     * //=> true
     *
     * console.log(cache.has('some-other-file.js'));
     * //=> false
     * ```
     * @name .has
     * @param {String} `name` Cache name
     * @param {String} `key` Optionally specify a property to check for on cache `name`
     * @return {Boolean}
     * @api public
     */

    has: function(cacheName, key) {
      return typeof this.get(cacheName, key) !== 'undefined';
    },

    /**
     * Get `name`, or if specified, the value of `key`. Invokes the [cache]() method,
     * so that cache `name` will be created it doesn't already exist. If `key` is not passed,
     * the entire cache (`name`) is returned.
     *
     * ```js
     * var Vinyl = require('vinyl');
     * var cache = fragment.cache('files');
     * cache.set('somefile.js', new Vinyl({path: 'somefile.js'}));
     * console.log(cache.get('somefile.js'));
     * //=> <File "somefile.js">
     * ```
     * @name .get
     * @param {String} `name`
     * @return {Object} Returns cache `name`, or the value of `key` if specified
     * @api public
     */

    get: function(name, key) {
      var cache = this.cache(name);
      if (typeof key === 'string') {
        return cache.get(key);
      }
      return cache;
    }
  };

  /**
   * Expose `FragmentCache`
   */

  exports = module.exports = FragmentCache;
  });

  var cache$5 = new (fragmentCache)();

  var isWindows = createCommonjsModule(function (module, exports) {
  /*!
   * is-windows <https://github.com/jonschlinkert/is-windows>
   *
   * Copyright © 2015-2018, Jon Schlinkert.
   * Released under the MIT License.
   */

  (function(factory) {
    if (exports && 'object' === 'object' && 'object' !== 'undefined') {
      module.exports = factory();
    } else if (typeof window !== 'undefined') {
      window.isWindows = factory();
    } else if (typeof commonjsGlobal !== 'undefined') {
      commonjsGlobal.isWindows = factory();
    } else if (typeof self !== 'undefined') {
      self.isWindows = factory();
    } else {
      this.isWindows = factory();
    }
  })(function() {
    return function isWindows() {
      return process && (process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE));
    };
  });
  });

  var define$2 = (typeof Reflect !== 'undefined' && Reflect.defineProperty)
    ? Reflect.defineProperty
    : Object.defineProperty;

  var defineProperty$4 = function defineProperty(obj, key, val) {
    if (!isobject(obj) && typeof obj !== 'function' && !Array.isArray(obj)) {
      throw new TypeError('expected an object, function, or array');
    }

    if (typeof key !== 'string') {
      throw new TypeError('expected "key" to be a string');
    }

    if (isDescriptor(val)) {
      define$2(obj, key, val);
      return obj;
    }

    define$2(obj, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });

    return obj;
  };

  /*!
   * arr-diff <https://github.com/jonschlinkert/arr-diff>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var arrDiff = function diff(arr/*, arrays*/) {
    var len = arguments.length;
    var idx = 0;
    while (++idx < len) {
      arr = diffArray(arr, arguments[idx]);
    }
    return arr;
  };

  function diffArray(one, two) {
    if (!Array.isArray(two)) {
      return one.slice();
    }

    var tlen = two.length;
    var olen = one.length;
    var idx = -1;
    var arr = [];

    while (++idx < olen) {
      var ele = one[idx];

      var hasEle = false;
      for (var i = 0; i < tlen; i++) {
        var val = two[i];

        if (ele === val) {
          hasEle = true;
          break;
        }
      }

      if (hasEle === false) {
        arr.push(ele);
      }
    }
    return arr;
  }

  var object_pick = function pick(obj, keys) {
    if (!isobject(obj) && typeof obj !== 'function') {
      return {};
    }

    var res = {};
    if (typeof keys === 'string') {
      if (keys in obj) {
        res[keys] = obj[keys];
      }
      return res;
    }

    var len = keys.length;
    var idx = -1;

    while (++idx < len) {
      var key = keys[idx];
      if (key in obj) {
        res[key] = obj[key];
      }
    }
    return res;
  };

  var toString$a = Object.prototype.toString;

  var kindOf$8 = function kindOf(val) {
    if (val === void 0) return 'undefined';
    if (val === null) return 'null';

    var type = typeof val;
    if (type === 'boolean') return 'boolean';
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'symbol') return 'symbol';
    if (type === 'function') {
      return isGeneratorFn$3(val) ? 'generatorfunction' : 'function';
    }

    if (isArray$3(val)) return 'array';
    if (isBuffer$5(val)) return 'buffer';
    if (isArguments$3(val)) return 'arguments';
    if (isDate$3(val)) return 'date';
    if (isError$3(val)) return 'error';
    if (isRegexp$3(val)) return 'regexp';

    switch (ctorName$3(val)) {
      case 'Symbol': return 'symbol';
      case 'Promise': return 'promise';

      // Set, Map, WeakSet, WeakMap
      case 'WeakMap': return 'weakmap';
      case 'WeakSet': return 'weakset';
      case 'Map': return 'map';
      case 'Set': return 'set';

      // 8-bit typed arrays
      case 'Int8Array': return 'int8array';
      case 'Uint8Array': return 'uint8array';
      case 'Uint8ClampedArray': return 'uint8clampedarray';

      // 16-bit typed arrays
      case 'Int16Array': return 'int16array';
      case 'Uint16Array': return 'uint16array';

      // 32-bit typed arrays
      case 'Int32Array': return 'int32array';
      case 'Uint32Array': return 'uint32array';
      case 'Float32Array': return 'float32array';
      case 'Float64Array': return 'float64array';
    }

    if (isGeneratorObj$3(val)) {
      return 'generator';
    }

    // Non-plain objects
    type = toString$a.call(val);
    switch (type) {
      case '[object Object]': return 'object';
      // iterators
      case '[object Map Iterator]': return 'mapiterator';
      case '[object Set Iterator]': return 'setiterator';
      case '[object String Iterator]': return 'stringiterator';
      case '[object Array Iterator]': return 'arrayiterator';
    }

    // other
    return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
  };

  function ctorName$3(val) {
    return val.constructor ? val.constructor.name : null;
  }

  function isArray$3(val) {
    if (Array.isArray) return Array.isArray(val);
    return val instanceof Array;
  }

  function isError$3(val) {
    return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
  }

  function isDate$3(val) {
    if (val instanceof Date) return true;
    return typeof val.toDateString === 'function'
      && typeof val.getDate === 'function'
      && typeof val.setDate === 'function';
  }

  function isRegexp$3(val) {
    if (val instanceof RegExp) return true;
    return typeof val.flags === 'string'
      && typeof val.ignoreCase === 'boolean'
      && typeof val.multiline === 'boolean'
      && typeof val.global === 'boolean';
  }

  function isGeneratorFn$3(name, val) {
    return ctorName$3(name) === 'GeneratorFunction';
  }

  function isGeneratorObj$3(val) {
    return typeof val.throw === 'function'
      && typeof val.return === 'function'
      && typeof val.next === 'function';
  }

  function isArguments$3(val) {
    try {
      if (typeof val.length === 'number' && typeof val.callee === 'function') {
        return true;
      }
    } catch (err) {
      if (err.message.indexOf('callee') !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * If you need to support Safari 5-7 (8-10 yr-old browser),
   * take a look at https://github.com/feross/is-buffer
   */

  function isBuffer$5(val) {
    if (val.constructor && typeof val.constructor.isBuffer === 'function') {
      return val.constructor.isBuffer(val);
    }
    return false;
  }

  var utils_1$1 = createCommonjsModule(function (module) {

  var utils = module.exports;


  /**
   * Module dependencies
   */

  var isWindows$$1 = isWindows();

  utils.define = defineProperty$4;
  utils.diff = arrDiff;
  utils.extend = extendShallow$7;
  utils.pick = object_pick;
  utils.typeOf = kindOf$8;
  utils.unique = arrayUnique;

  /**
   * Returns true if the given value is effectively an empty string
   */

  utils.isEmptyString = function(val) {
    return String(val) === '' || String(val) === './';
  };

  /**
   * Returns true if the platform is windows, or `path.sep` is `\\`.
   * This is defined as a function to allow `path.sep` to be set in unit tests,
   * or by the user, if there is a reason to do so.
   * @return {Boolean}
   */

  utils.isWindows = function() {
    return path.sep === '\\' || isWindows$$1 === true;
  };

  /**
   * Return the last element from an array
   */

  utils.last = function(arr, n) {
    return arr[arr.length - (n || 1)];
  };

  /**
   * Get the `Snapdragon` instance to use
   */

  utils.instantiate = function(ast, options) {
    var snapdragon$$1;
    // if an instance was created by `.parse`, use that instance
    if (utils.typeOf(ast) === 'object' && ast.snapdragon) {
      snapdragon$$1 = ast.snapdragon;
    // if the user supplies an instance on options, use that instance
    } else if (utils.typeOf(options) === 'object' && options.snapdragon) {
      snapdragon$$1 = options.snapdragon;
    // create a new instance
    } else {
      snapdragon$$1 = new snapdragon(options);
    }

    utils.define(snapdragon$$1, 'parse', function(str, options) {
      var parsed = snapdragon.prototype.parse.call(this, str, options);
      parsed.input = str;

      // escape unmatched brace/bracket/parens
      var last = this.parser.stack.pop();
      if (last && this.options.strictErrors !== true) {
        var open = last.nodes[0];
        var inner = last.nodes[1];
        if (last.type === 'bracket') {
          if (inner.val.charAt(0) === '[') {
            inner.val = '\\' + inner.val;
          }

        } else {
          open.val = '\\' + open.val;
          var sibling = open.parent.nodes[1];
          if (sibling.type === 'star') {
            sibling.loose = true;
          }
        }
      }

      // add non-enumerable parser reference
      utils.define(parsed, 'parser', this.parser);
      return parsed;
    });

    return snapdragon$$1;
  };

  /**
   * Create the key to use for memoization. The key is generated
   * by iterating over the options and concatenating key-value pairs
   * to the pattern string.
   */

  utils.createKey = function(pattern, options) {
    if (typeof options === 'undefined') {
      return pattern;
    }
    var key = pattern;
    for (var prop in options) {
      if (options.hasOwnProperty(prop)) {
        key += ';' + prop + '=' + String(options[prop]);
      }
    }
    return key;
  };

  /**
   * Cast `val` to an array
   * @return {Array}
   */

  utils.arrayify = function(val) {
    if (typeof val === 'string') return [val];
    return val ? (Array.isArray(val) ? val : [val]) : [];
  };

  /**
   * Return true if `val` is a non-empty string
   */

  utils.isString = function(val) {
    return typeof val === 'string';
  };

  /**
   * Return true if `val` is a non-empty string
   */

  utils.isRegex = function(val) {
    return utils.typeOf(val) === 'regexp';
  };

  /**
   * Return true if `val` is a non-empty string
   */

  utils.isObject = function(val) {
    return utils.typeOf(val) === 'object';
  };

  /**
   * Escape regex characters in the given string
   */

  utils.escapeRegex = function(str) {
    return str.replace(/[-[\]{}()^$|*+?.\\/\s]/g, '\\$&');
  };

  /**
   * Combines duplicate characters in the provided `input` string.
   * @param {String} `input`
   * @returns {String}
   */

  utils.combineDupes = function(input, patterns) {
    patterns = utils.arrayify(patterns).join('|').split('|');
    patterns = patterns.map(function(s) {
      return s.replace(/\\?([+*\\/])/g, '\\$1');
    });
    var substr = patterns.join('|');
    var regex = new RegExp('(' + substr + ')(?=\\1)', 'g');
    return input.replace(regex, '');
  };

  /**
   * Returns true if the given `str` has special characters
   */

  utils.hasSpecialChars = function(str) {
    return /(?:(?:(^|\/)[!.])|[*?+()|[\]{}]|[+@]\()/.test(str);
  };

  /**
   * Normalize slashes in the given filepath.
   *
   * @param {String} `filepath`
   * @return {String}
   */

  utils.toPosixPath = function(str) {
    return str.replace(/\\+/g, '/');
  };

  /**
   * Strip backslashes before special characters in a string.
   *
   * @param {String} `str`
   * @return {String}
   */

  utils.unescape = function(str) {
    return utils.toPosixPath(str.replace(/\\(?=[*+?!.])/g, ''));
  };

  /**
   * Strip the drive letter from a windows filepath
   * @param {String} `fp`
   * @return {String}
   */

  utils.stripDrive = function(fp) {
    return utils.isWindows() ? fp.replace(/^[a-z]:[\\/]+?/i, '/') : fp;
  };

  /**
   * Strip the prefix from a filepath
   * @param {String} `fp`
   * @return {String}
   */

  utils.stripPrefix = function(str) {
    if (str.charAt(0) === '.' && (str.charAt(1) === '/' || str.charAt(1) === '\\')) {
      return str.slice(2);
    }
    return str;
  };

  /**
   * Returns true if `str` is a common character that doesn't need
   * to be processed to be used for matching.
   * @param {String} `str`
   * @return {Boolean}
   */

  utils.isSimpleChar = function(str) {
    return str.trim() === '' || str === '.';
  };

  /**
   * Returns true if the given str is an escaped or
   * unescaped path character
   */

  utils.isSlash = function(str) {
    return str === '/' || str === '\\/' || str === '\\' || str === '\\\\';
  };

  /**
   * Returns a function that returns true if the given
   * pattern matches or contains a `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.matchPath = function(pattern, options) {
    return (options && options.contains)
      ? utils.containsPattern(pattern, options)
      : utils.equalsPattern(pattern, options);
  };

  /**
   * Returns true if the given (original) filepath or unixified path are equal
   * to the given pattern.
   */

  utils._equals = function(filepath, unixPath, pattern) {
    return pattern === filepath || pattern === unixPath;
  };

  /**
   * Returns true if the given (original) filepath or unixified path contain
   * the given pattern.
   */

  utils._contains = function(filepath, unixPath, pattern) {
    return filepath.indexOf(pattern) !== -1 || unixPath.indexOf(pattern) !== -1;
  };

  /**
   * Returns a function that returns true if the given
   * pattern is the same as a given `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.equalsPattern = function(pattern, options) {
    var unixify = utils.unixify(options);
    options = options || {};

    return function fn(filepath) {
      var equal = utils._equals(filepath, unixify(filepath), pattern);
      if (equal === true || options.nocase !== true) {
        return equal;
      }
      var lower = filepath.toLowerCase();
      return utils._equals(lower, unixify(lower), pattern);
    };
  };

  /**
   * Returns a function that returns true if the given
   * pattern contains a `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.containsPattern = function(pattern, options) {
    var unixify = utils.unixify(options);
    options = options || {};

    return function(filepath) {
      var contains = utils._contains(filepath, unixify(filepath), pattern);
      if (contains === true || options.nocase !== true) {
        return contains;
      }
      var lower = filepath.toLowerCase();
      return utils._contains(lower, unixify(lower), pattern);
    };
  };

  /**
   * Returns a function that returns true if the given
   * regex matches the `filename` of a file path.
   *
   * @param {RegExp} `re` Matching regex
   * @return {Function}
   */

  utils.matchBasename = function(re) {
    return function(filepath) {
      return re.test(filepath) || re.test(path.basename(filepath));
    };
  };

  /**
   * Returns the given value unchanced.
   * @return {any}
   */

  utils.identity = function(val) {
    return val;
  };

  /**
   * Determines the filepath to return based on the provided options.
   * @return {any}
   */

  utils.value = function(str, unixify, options) {
    if (options && options.unixify === false) {
      return str;
    }
    if (options && typeof options.unixify === 'function') {
      return options.unixify(str);
    }
    return unixify(str);
  };

  /**
   * Returns a function that normalizes slashes in a string to forward
   * slashes, strips `./` from beginning of paths, and optionally unescapes
   * special characters.
   * @return {Function}
   */

  utils.unixify = function(options) {
    var opts = options || {};
    return function(filepath) {
      if (opts.stripPrefix !== false) {
        filepath = utils.stripPrefix(filepath);
      }
      if (opts.unescape === true) {
        filepath = utils.unescape(filepath);
      }
      if (opts.unixify === true || utils.isWindows()) {
        filepath = utils.toPosixPath(filepath);
      }
      return filepath;
    };
  };
  });

  /**
   * Module dependencies
   */





  /**
   * Local dependencies
   */





  var MAX_LENGTH$2 = 1024 * 64;

  /**
   * The main function takes a list of strings and one or more
   * glob patterns to use for matching.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm(list, patterns[, options]);
   *
   * console.log(nm(['a.js', 'a.txt'], ['*.js']));
   * //=> [ 'a.js' ]
   * ```
   * @param {Array} `list` A list of strings to match
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Array} Returns an array of matches
   * @summary false
   * @api public
   */

  function nanomatch(list, patterns, options) {
    patterns = utils_1$1.arrayify(patterns);
    list = utils_1$1.arrayify(list);

    var len = patterns.length;
    if (list.length === 0 || len === 0) {
      return [];
    }

    if (len === 1) {
      return nanomatch.match(list, patterns[0], options);
    }

    var negated = false;
    var omit = [];
    var keep = [];
    var idx = -1;

    while (++idx < len) {
      var pattern = patterns[idx];

      if (typeof pattern === 'string' && pattern.charCodeAt(0) === 33 /* ! */) {
        omit.push.apply(omit, nanomatch.match(list, pattern.slice(1), options));
        negated = true;
      } else {
        keep.push.apply(keep, nanomatch.match(list, pattern, options));
      }
    }

    // minimatch.match parity
    if (negated && keep.length === 0) {
      if (options && options.unixify === false) {
        keep = list.slice();
      } else {
        var unixify = utils_1$1.unixify(options);
        for (var i = 0; i < list.length; i++) {
          keep.push(unixify(list[i]));
        }
      }
    }

    var matches = utils_1$1.diff(keep, omit);
    if (!options || options.nodupes !== false) {
      return utils_1$1.unique(matches);
    }

    return matches;
  }

  /**
   * Similar to the main function, but `pattern` must be a string.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.match(list, pattern[, options]);
   *
   * console.log(nm.match(['a.a', 'a.aa', 'a.b', 'a.c'], '*.a'));
   * //=> ['a.a', 'a.aa']
   * ```
   * @param {Array} `list` Array of strings to match
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Array} Returns an array of matches
   * @api public
   */

  nanomatch.match = function(list, pattern, options) {
    if (Array.isArray(pattern)) {
      throw new TypeError('expected pattern to be a string');
    }

    var unixify = utils_1$1.unixify(options);
    var isMatch = memoize$2('match', pattern, options, nanomatch.matcher);
    var matches = [];

    list = utils_1$1.arrayify(list);
    var len = list.length;
    var idx = -1;

    while (++idx < len) {
      var ele = list[idx];
      if (ele === pattern || isMatch(ele)) {
        matches.push(utils_1$1.value(ele, unixify, options));
      }
    }

    // if no options were passed, uniquify results and return
    if (typeof options === 'undefined') {
      return utils_1$1.unique(matches);
    }

    if (matches.length === 0) {
      if (options.failglob === true) {
        throw new Error('no matches found for "' + pattern + '"');
      }
      if (options.nonull === true || options.nullglob === true) {
        return [options.unescape ? utils_1$1.unescape(pattern) : pattern];
      }
    }

    // if `opts.ignore` was defined, diff ignored list
    if (options.ignore) {
      matches = nanomatch.not(matches, options.ignore, options);
    }

    return options.nodupes !== false ? utils_1$1.unique(matches) : matches;
  };

  /**
   * Returns true if the specified `string` matches the given glob `pattern`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.isMatch(string, pattern[, options]);
   *
   * console.log(nm.isMatch('a.a', '*.a'));
   * //=> true
   * console.log(nm.isMatch('a.b', '*.a'));
   * //=> false
   * ```
   * @param {String} `string` String to match
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if the string matches the glob pattern.
   * @api public
   */

  nanomatch.isMatch = function(str, pattern, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }

    if (utils_1$1.isEmptyString(str) || utils_1$1.isEmptyString(pattern)) {
      return false;
    }

    var equals = utils_1$1.equalsPattern(options);
    if (equals(str)) {
      return true;
    }

    var isMatch = memoize$2('isMatch', pattern, options, nanomatch.matcher);
    return isMatch(str);
  };

  /**
   * Returns true if some of the elements in the given `list` match any of the
   * given glob `patterns`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.some(list, patterns[, options]);
   *
   * console.log(nm.some(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
   * // true
   * console.log(nm.some(['foo.js'], ['*.js', '!foo.js']));
   * // false
   * ```
   * @param  {String|Array} `list` The string or array of strings to test. Returns as soon as the first match is found.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  nanomatch.some = function(list, patterns, options) {
    if (typeof list === 'string') {
      list = [list];
    }

    for (var i = 0; i < list.length; i++) {
      if (nanomatch(list[i], patterns, options).length === 1) {
        return true;
      }
    }

    return false;
  };

  /**
   * Returns true if every element in the given `list` matches
   * at least one of the given glob `patterns`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.every(list, patterns[, options]);
   *
   * console.log(nm.every('foo.js', ['foo.js']));
   * // true
   * console.log(nm.every(['foo.js', 'bar.js'], ['*.js']));
   * // true
   * console.log(nm.every(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
   * // false
   * console.log(nm.every(['foo.js'], ['*.js', '!foo.js']));
   * // false
   * ```
   * @param  {String|Array} `list` The string or array of strings to test.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  nanomatch.every = function(list, patterns, options) {
    if (typeof list === 'string') {
      list = [list];
    }

    for (var i = 0; i < list.length; i++) {
      if (nanomatch(list[i], patterns, options).length !== 1) {
        return false;
      }
    }

    return true;
  };

  /**
   * Returns true if **any** of the given glob `patterns`
   * match the specified `string`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.any(string, patterns[, options]);
   *
   * console.log(nm.any('a.a', ['b.*', '*.a']));
   * //=> true
   * console.log(nm.any('a.a', 'b.*'));
   * //=> false
   * ```
   * @param  {String|Array} `str` The string to test.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  nanomatch.any = function(str, patterns, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }

    if (utils_1$1.isEmptyString(str) || utils_1$1.isEmptyString(patterns)) {
      return false;
    }

    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    for (var i = 0; i < patterns.length; i++) {
      if (nanomatch.isMatch(str, patterns[i], options)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Returns true if **all** of the given `patterns`
   * match the specified string.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.all(string, patterns[, options]);
   *
   * console.log(nm.all('foo.js', ['foo.js']));
   * // true
   *
   * console.log(nm.all('foo.js', ['*.js', '!foo.js']));
   * // false
   *
   * console.log(nm.all('foo.js', ['*.js', 'foo.js']));
   * // true
   *
   * console.log(nm.all('foo.js', ['*.js', 'f*', '*o*', '*o.js']));
   * // true
   * ```
   * @param  {String|Array} `str` The string to test.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  nanomatch.all = function(str, patterns, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }

    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    for (var i = 0; i < patterns.length; i++) {
      if (!nanomatch.isMatch(str, patterns[i], options)) {
        return false;
      }
    }
    return true;
  };

  /**
   * Returns a list of strings that _**do not match any**_ of the given `patterns`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.not(list, patterns[, options]);
   *
   * console.log(nm.not(['a.a', 'b.b', 'c.c'], '*.a'));
   * //=> ['b.b', 'c.c']
   * ```
   * @param {Array} `list` Array of strings to match.
   * @param {String|Array} `patterns` One or more glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Array} Returns an array of strings that **do not match** the given patterns.
   * @api public
   */

  nanomatch.not = function(list, patterns, options) {
    var opts = extendShallow$7({}, options);
    var ignore = opts.ignore;
    delete opts.ignore;

    list = utils_1$1.arrayify(list);

    var matches = utils_1$1.diff(list, nanomatch(list, patterns, opts));
    if (ignore) {
      matches = utils_1$1.diff(matches, nanomatch(list, ignore));
    }

    return opts.nodupes !== false ? utils_1$1.unique(matches) : matches;
  };

  /**
   * Returns true if the given `string` contains the given pattern. Similar
   * to [.isMatch](#isMatch) but the pattern can match any part of the string.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.contains(string, pattern[, options]);
   *
   * console.log(nm.contains('aa/bb/cc', '*b'));
   * //=> true
   * console.log(nm.contains('aa/bb/cc', '*d'));
   * //=> false
   * ```
   * @param {String} `str` The string to match.
   * @param {String|Array} `patterns` Glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if the patter matches any part of `str`.
   * @api public
   */

  nanomatch.contains = function(str, patterns, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }

    if (typeof patterns === 'string') {
      if (utils_1$1.isEmptyString(str) || utils_1$1.isEmptyString(patterns)) {
        return false;
      }

      var equals = utils_1$1.equalsPattern(patterns, options);
      if (equals(str)) {
        return true;
      }
      var contains = utils_1$1.containsPattern(patterns, options);
      if (contains(str)) {
        return true;
      }
    }

    var opts = extendShallow$7({}, options, {contains: true});
    return nanomatch.any(str, patterns, opts);
  };

  /**
   * Returns true if the given pattern and options should enable
   * the `matchBase` option.
   * @return {Boolean}
   * @api private
   */

  nanomatch.matchBase = function(pattern, options) {
    if (pattern && pattern.indexOf('/') !== -1 || !options) return false;
    return options.basename === true || options.matchBase === true;
  };

  /**
   * Filter the keys of the given object with the given `glob` pattern
   * and `options`. Does not attempt to match nested keys. If you need this feature,
   * use [glob-object][] instead.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.matchKeys(object, patterns[, options]);
   *
   * var obj = { aa: 'a', ab: 'b', ac: 'c' };
   * console.log(nm.matchKeys(obj, '*b'));
   * //=> { ab: 'b' }
   * ```
   * @param {Object} `object` The object with keys to filter.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Object} Returns an object with only keys that match the given patterns.
   * @api public
   */

  nanomatch.matchKeys = function(obj, patterns, options) {
    if (!utils_1$1.isObject(obj)) {
      throw new TypeError('expected the first argument to be an object');
    }
    var keys = nanomatch(Object.keys(obj), patterns, options);
    return utils_1$1.pick(obj, keys);
  };

  /**
   * Returns a memoized matcher function from the given glob `pattern` and `options`.
   * The returned function takes a string to match as its only argument and returns
   * true if the string is a match.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.matcher(pattern[, options]);
   *
   * var isMatch = nm.matcher('*.!(*a)');
   * console.log(isMatch('a.a'));
   * //=> false
   * console.log(isMatch('a.b'));
   * //=> true
   * ```
   * @param {String} `pattern` Glob pattern
   * @param {Object} `options` See available [options](#options) for changing how matches are performed.
   * @return {Function} Returns a matcher function.
   * @api public
   */

  nanomatch.matcher = function matcher(pattern, options) {
    if (utils_1$1.isEmptyString(pattern)) {
      return function() {
        return false;
      };
    }

    if (Array.isArray(pattern)) {
      return compose$1(pattern, options, matcher);
    }

    // if pattern is a regex
    if (pattern instanceof RegExp) {
      return test(pattern);
    }

    // if pattern is invalid
    if (!utils_1$1.isString(pattern)) {
      throw new TypeError('expected pattern to be an array, string or regex');
    }

    // if pattern is a non-glob string
    if (!utils_1$1.hasSpecialChars(pattern)) {
      if (options && options.nocase === true) {
        pattern = pattern.toLowerCase();
      }
      return utils_1$1.matchPath(pattern, options);
    }

    // if pattern is a glob string
    var re = nanomatch.makeRe(pattern, options);

    // if `options.matchBase` or `options.basename` is defined
    if (nanomatch.matchBase(pattern, options)) {
      return utils_1$1.matchBasename(re, options);
    }

    function test(regex) {
      var equals = utils_1$1.equalsPattern(options);
      var unixify = utils_1$1.unixify(options);

      return function(str) {
        if (equals(str)) {
          return true;
        }

        if (regex.test(unixify(str))) {
          return true;
        }
        return false;
      };
    }

    // create matcher function
    var matcherFn = test(re);
    // set result object from compiler on matcher function,
    // as a non-enumerable property. useful for debugging
    utils_1$1.define(matcherFn, 'result', re.result);
    return matcherFn;
  };

  /**
   * Returns an array of matches captured by `pattern` in `string, or
   * `null` if the pattern did not match.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.capture(pattern, string[, options]);
   *
   * console.log(nm.capture('test/*.js', 'test/foo.js'));
   * //=> ['foo']
   * console.log(nm.capture('test/*.js', 'foo/bar.css'));
   * //=> null
   * ```
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {String} `string` String to match
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns an array of captures if the string matches the glob pattern, otherwise `null`.
   * @api public
   */

  nanomatch.capture = function(pattern, str, options) {
    var re = nanomatch.makeRe(pattern, extendShallow$7({capture: true}, options));
    var unixify = utils_1$1.unixify(options);

    function match() {
      return function(string) {
        var match = re.exec(unixify(string));
        if (!match) {
          return null;
        }

        return match.slice(1);
      };
    }

    var capture = memoize$2('capture', pattern, options, match);
    return capture(str);
  };

  /**
   * Create a regular expression from the given glob `pattern`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.makeRe(pattern[, options]);
   *
   * console.log(nm.makeRe('*.js'));
   * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
   * ```
   * @param {String} `pattern` A glob pattern to convert to regex.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed.
   * @return {RegExp} Returns a regex created from the given pattern.
   * @api public
   */

  nanomatch.makeRe = function(pattern, options) {
    if (pattern instanceof RegExp) {
      return pattern;
    }

    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    if (pattern.length > MAX_LENGTH$2) {
      throw new Error('expected pattern to be less than ' + MAX_LENGTH$2 + ' characters');
    }

    function makeRe() {
      var opts = utils_1$1.extend({wrap: false}, options);
      var result = nanomatch.create(pattern, opts);
      var regex = toRegex$1(result.output, opts);
      utils_1$1.define(regex, 'result', result);
      return regex;
    }

    return memoize$2('makeRe', pattern, options, makeRe);
  };

  /**
   * Parses the given glob `pattern` and returns an object with the compiled `output`
   * and optional source `map`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.create(pattern[, options]);
   *
   * console.log(nm.create('abc/*.js'));
   * // { options: { source: 'string', sourcemap: true },
   * //   state: {},
   * //   compilers:
   * //    { ... },
   * //   output: '(\\.[\\\\\\/])?abc\\/(?!\\.)(?=.)[^\\/]*?\\.js',
   * //   ast:
   * //    { type: 'root',
   * //      errors: [],
   * //      nodes:
   * //       [ ... ],
   * //      dot: false,
   * //      input: 'abc/*.js' },
   * //   parsingErrors: [],
   * //   map:
   * //    { version: 3,
   * //      sources: [ 'string' ],
   * //      names: [],
   * //      mappings: 'AAAA,GAAG,EAAC,kBAAC,EAAC,EAAE',
   * //      sourcesContent: [ 'abc/*.js' ] },
   * //   position: { line: 1, column: 28 },
   * //   content: {},
   * //   files: {},
   * //   idx: 6 }
   * ```
   * @param {String} `pattern` Glob pattern to parse and compile.
   * @param {Object} `options` Any [options](#options) to change how parsing and compiling is performed.
   * @return {Object} Returns an object with the parsed AST, compiled string and optional source map.
   * @api public
   */

  nanomatch.create = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected a string');
    }
    function create() {
      return nanomatch.compile(nanomatch.parse(pattern, options), options);
    }
    return memoize$2('create', pattern, options, create);
  };

  /**
   * Parse the given `str` with the given `options`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.parse(pattern[, options]);
   *
   * var ast = nm.parse('a/{b,c}/d');
   * console.log(ast);
   * // { type: 'root',
   * //   errors: [],
   * //   input: 'a/{b,c}/d',
   * //   nodes:
   * //    [ { type: 'bos', val: '' },
   * //      { type: 'text', val: 'a/' },
   * //      { type: 'brace',
   * //        nodes:
   * //         [ { type: 'brace.open', val: '{' },
   * //           { type: 'text', val: 'b,c' },
   * //           { type: 'brace.close', val: '}' } ] },
   * //      { type: 'text', val: '/d' },
   * //      { type: 'eos', val: '' } ] }
   * ```
   * @param {String} `str`
   * @param {Object} `options`
   * @return {Object} Returns an AST
   * @api public
   */

  nanomatch.parse = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected a string');
    }

    function parse() {
      var snapdragon = utils_1$1.instantiate(null, options);
      parsers$1(snapdragon, options);

      var ast = snapdragon.parse(pattern, options);
      utils_1$1.define(ast, 'snapdragon', snapdragon);
      ast.input = pattern;
      return ast;
    }

    return memoize$2('parse', pattern, options, parse);
  };

  /**
   * Compile the given `ast` or string with the given `options`.
   *
   * ```js
   * var nm = require('nanomatch');
   * nm.compile(ast[, options]);
   *
   * var ast = nm.parse('a/{b,c}/d');
   * console.log(nm.compile(ast));
   * // { options: { source: 'string' },
   * //   state: {},
   * //   compilers:
   * //    { eos: [Function],
   * //      noop: [Function],
   * //      bos: [Function],
   * //      brace: [Function],
   * //      'brace.open': [Function],
   * //      text: [Function],
   * //      'brace.close': [Function] },
   * //   output: [ 'a/(b|c)/d' ],
   * //   ast:
   * //    { ... },
   * //   parsingErrors: [] }
   * ```
   * @param {Object|String} `ast`
   * @param {Object} `options`
   * @return {Object} Returns an object that has an `output` property with the compiled string.
   * @api public
   */

  nanomatch.compile = function(ast, options) {
    if (typeof ast === 'string') {
      ast = nanomatch.parse(ast, options);
    }

    function compile() {
      var snapdragon = utils_1$1.instantiate(ast, options);
      compilers$1(snapdragon, options);
      return snapdragon.compile(ast, options);
    }

    return memoize$2('compile', ast.input, options, compile);
  };

  /**
   * Clear the regex cache.
   *
   * ```js
   * nm.clearCache();
   * ```
   * @api public
   */

  nanomatch.clearCache = function() {
    nanomatch.cache.__data__ = {};
  };

  /**
   * Compose a matcher function with the given patterns.
   * This allows matcher functions to be compiled once and
   * called multiple times.
   */

  function compose$1(patterns, options, matcher) {
    var matchers;

    return memoize$2('compose', String(patterns), options, function() {
      return function(file) {
        // delay composition until it's invoked the first time,
        // after that it won't be called again
        if (!matchers) {
          matchers = [];
          for (var i = 0; i < patterns.length; i++) {
            matchers.push(matcher(patterns[i], options));
          }
        }

        var len = matchers.length;
        while (len--) {
          if (matchers[len](file) === true) {
            return true;
          }
        }
        return false;
      };
    });
  }

  /**
   * Memoize a generated regex or function. A unique key is generated
   * from the `type` (usually method name), the `pattern`, and
   * user-defined options.
   */

  function memoize$2(type, pattern, options, fn) {
    var key = utils_1$1.createKey(type + '=' + pattern, options);

    if (options && options.cache === false) {
      return fn(pattern, options);
    }

    if (cache$5.has(type, key)) {
      return cache$5.get(type, key);
    }

    var val = fn(pattern, options);
    cache$5.set(type, key, val);
    return val;
  }

  /**
   * Expose compiler, parser and cache on `nanomatch`
   */

  nanomatch.compilers = compilers$1;
  nanomatch.parsers = parsers$1;
  nanomatch.cache = cache$5;

  /**
   * Expose `nanomatch`
   * @type {Function}
   */

  var nanomatch_1 = nanomatch;

  /*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtendable$9 = function isExtendable(val) {
    return typeof val !== 'undefined' && val !== null
      && (typeof val === 'object' || typeof val === 'function');
  };

  var extendShallow$8 = function extend(o/*, objects*/) {
    if (!isExtendable$9(o)) { o = {}; }

    var len = arguments.length;
    for (var i = 1; i < len; i++) {
      var obj = arguments[i];

      if (isExtendable$9(obj)) {
        assign$8(o, obj);
      }
    }
    return o;
  };

  function assign$8(a, b) {
    for (var key in b) {
      if (hasOwn$9(b, key)) {
        a[key] = b[key];
      }
    }
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$9(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
   * POSIX character classes
   */

  var posixCharacterClasses = {
    alnum: 'a-zA-Z0-9',
    alpha: 'a-zA-Z',
    ascii: '\\x00-\\x7F',
    blank: ' \\t',
    cntrl: '\\x00-\\x1F\\x7F',
    digit: '0-9',
    graph: '\\x21-\\x7E',
    lower: 'a-z',
    print: '\\x20-\\x7E ',
    punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
    space: ' \\t\\r\\n\\v\\f',
    upper: 'A-Z',
    word: 'A-Za-z0-9_',
    xdigit: 'A-Fa-f0-9'
  };

  var compilers$2 = function(brackets) {
    brackets.compiler

      /**
       * Escaped characters
       */

      .set('escape', function(node) {
        return this.emit('\\' + node.val.replace(/^\\/, ''), node);
      })

      /**
       * Text
       */

      .set('text', function(node) {
        return this.emit(node.val.replace(/([{}])/g, '\\$1'), node);
      })

      /**
       * POSIX character classes
       */

      .set('posix', function(node) {
        if (node.val === '[::]') {
          return this.emit('\\[::\\]', node);
        }

        var val = posixCharacterClasses[node.inner];
        if (typeof val === 'undefined') {
          val = '[' + node.inner + ']';
        }
        return this.emit(val, node);
      })

      /**
       * Non-posix brackets
       */

      .set('bracket', function(node) {
        return this.mapVisit(node.nodes);
      })
      .set('bracket.open', function(node) {
        return this.emit(node.val, node);
      })
      .set('bracket.inner', function(node) {
        var inner = node.val;

        if (inner === '[' || inner === ']') {
          return this.emit('\\' + node.val, node);
        }
        if (inner === '^]') {
          return this.emit('^\\]', node);
        }
        if (inner === '^') {
          return this.emit('^', node);
        }

        if (/-/.test(inner) && !/(\d-\d|\w-\w)/.test(inner)) {
          inner = inner.split('-').join('\\-');
        }

        var isNegated = inner.charAt(0) === '^';
        // add slashes to negated brackets, per spec
        if (isNegated && inner.indexOf('/') === -1) {
          inner += '/';
        }
        if (isNegated && inner.indexOf('.') === -1) {
          inner += '.';
        }

        // don't unescape `0` (octal literal)
        inner = inner.replace(/\\([1-9])/g, '$1');
        return this.emit(inner, node);
      })
      .set('bracket.close', function(node) {
        var val = node.val.replace(/^\\/, '');
        if (node.parent.escaped === true) {
          return this.emit('\\' + val, node);
        }
        return this.emit(val, node);
      });
  };

  var cached$1;

  /**
   * Get the last element from `array`
   * @param {Array} `array`
   * @return {*}
   */

  var last$1 = function(arr) {
    return arr[arr.length - 1];
  };

  /**
   * Create and cache regex to use for text nodes
   */

  var createRegex = function(pattern, include) {
    if (cached$1) return cached$1;
    var opts = {contains: true, strictClose: false};
    var not = regexNot.create(pattern, opts);
    var re;

    if (typeof include === 'string') {
      re = toRegex$1('^(?:' + include + '|' + not + ')', opts);
    } else {
      re = toRegex$1(not, opts);
    }

    return (cached$1 = re);
  };

  var utils$1 = {
  	last: last$1,
  	createRegex: createRegex
  };

  var toString$b = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$9 = function kindOf(val) {
    var type = typeof val;

    // primitivies
    if (type === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (type === 'string' || val instanceof String) {
      return 'string';
    }
    if (type === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (type === 'function' || val instanceof Function) {
      if (typeof val.constructor.name !== 'undefined' && val.constructor.name.slice(0, 9) === 'Generator') {
        return 'generatorfunction';
      }
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    type = toString$b.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }
    if (type === '[object Promise]') {
      return 'promise';
    }

    // buffer
    if (isBuffer$6(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }
    
    if (type === '[object Map Iterator]') {
      return 'mapiterator';
    }
    if (type === '[object Set Iterator]') {
      return 'setiterator';
    }
    if (type === '[object String Iterator]') {
      return 'stringiterator';
    }
    if (type === '[object Array Iterator]') {
      return 'arrayiterator';
    }
    
    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  /**
   * If you need to support Safari 5-7 (8-10 yr-old browser),
   * take a look at https://github.com/feross/is-buffer
   */

  function isBuffer$6(val) {
    return val.constructor
      && typeof val.constructor.isBuffer === 'function'
      && val.constructor.isBuffer(val);
  }

  var toString$c = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$a = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$c.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  // accessor descriptor properties
  var accessor$2 = {
    get: 'function',
    set: 'function',
    configurable: 'boolean',
    enumerable: 'boolean'
  };

  function isAccessorDescriptor$2(obj, prop) {
    if (typeof prop === 'string') {
      var val = Object.getOwnPropertyDescriptor(obj, prop);
      return typeof val !== 'undefined';
    }

    if (kindOf$a(obj) !== 'object') {
      return false;
    }

    if (has$4(obj, 'value') || has$4(obj, 'writable')) {
      return false;
    }

    if (!has$4(obj, 'get') || typeof obj.get !== 'function') {
      return false;
    }

    // tldr: it's valid to have "set" be undefined
    // "set" might be undefined if `Object.getOwnPropertyDescriptor`
    // was used to get the value, and only `get` was defined by the user
    if (has$4(obj, 'set') && typeof obj[key] !== 'function' && typeof obj[key] !== 'undefined') {
      return false;
    }

    for (var key in obj) {
      if (!accessor$2.hasOwnProperty(key)) {
        continue;
      }

      if (kindOf$a(obj[key]) === accessor$2[key]) {
        continue;
      }

      if (typeof obj[key] !== 'undefined') {
        return false;
      }
    }
    return true;
  }

  function has$4(obj, key) {
    return {}.hasOwnProperty.call(obj, key);
  }

  /**
   * Expose `isAccessorDescriptor`
   */

  var isAccessorDescriptor_1$2 = isAccessorDescriptor$2;

  var toString$d = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$b = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$d.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  // data descriptor properties
  var data$1 = {
    configurable: 'boolean',
    enumerable: 'boolean',
    writable: 'boolean'
  };

  function isDataDescriptor$2(obj, prop) {
    if (kindOf$b(obj) !== 'object') {
      return false;
    }

    if (typeof prop === 'string') {
      var val = Object.getOwnPropertyDescriptor(obj, prop);
      return typeof val !== 'undefined';
    }

    if (!('value' in obj) && !('writable' in obj)) {
      return false;
    }

    for (var key in obj) {
      if (key === 'value') continue;

      if (!data$1.hasOwnProperty(key)) {
        continue;
      }

      if (kindOf$b(obj[key]) === data$1[key]) {
        continue;
      }

      if (typeof obj[key] !== 'undefined') {
        return false;
      }
    }
    return true;
  }

  /**
   * Expose `isDataDescriptor`
   */

  var isDataDescriptor_1$1 = isDataDescriptor$2;

  var isDescriptor$2 = function isDescriptor(obj, key) {
    if (kindOf$9(obj) !== 'object') {
      return false;
    }
    if ('get' in obj) {
      return isAccessorDescriptor_1$2(obj, key);
    }
    return isDataDescriptor_1$1(obj, key);
  };

  var defineProperty$5 = function defineProperty(obj, prop, val) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      throw new TypeError('expected an object or function.');
    }

    if (typeof prop !== 'string') {
      throw new TypeError('expected `prop` to be a string.');
    }

    if (isDescriptor$2(val) && ('set' in val || 'get' in val)) {
      return Object.defineProperty(obj, prop, val);
    }

    return Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });
  };

  /**
   * Text regex
   */

  var TEXT_REGEX = '(\\[(?=.*\\])|\\])+';
  var not$1 = utils$1.createRegex(TEXT_REGEX);

  /**
   * Brackets parsers
   */

  function parsers$2(brackets) {
    brackets.state = brackets.state || {};
    brackets.parser.sets.bracket = brackets.parser.sets.bracket || [];
    brackets.parser

      .capture('escape', function() {
        if (this.isInside('bracket')) return;
        var pos = this.position();
        var m = this.match(/^\\(.)/);
        if (!m) return;

        return pos({
          type: 'escape',
          val: m[0]
        });
      })

      /**
       * Text parser
       */

      .capture('text', function() {
        if (this.isInside('bracket')) return;
        var pos = this.position();
        var m = this.match(not$1);
        if (!m || !m[0]) return;

        return pos({
          type: 'text',
          val: m[0]
        });
      })

      /**
       * POSIX character classes: "[[:alpha:][:digits:]]"
       */

      .capture('posix', function() {
        var pos = this.position();
        var m = this.match(/^\[:(.*?):\](?=.*\])/);
        if (!m) return;

        var inside = this.isInside('bracket');
        if (inside) {
          brackets.posix++;
        }

        return pos({
          type: 'posix',
          insideBracket: inside,
          inner: m[1],
          val: m[0]
        });
      })

      /**
       * Bracket (noop)
       */

      .capture('bracket', function() {})

      /**
       * Open: '['
       */

      .capture('bracket.open', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^\[(?=.*\])/);
        if (!m) return;

        var prev = this.prev();
        var last = utils$1.last(prev.nodes);

        if (parsed.slice(-1) === '\\' && !this.isInside('bracket')) {
          last.val = last.val.slice(0, last.val.length - 1);
          return pos({
            type: 'escape',
            val: m[0]
          });
        }

        var open = pos({
          type: 'bracket.open',
          val: m[0]
        });

        if (last.type === 'bracket.open' || this.isInside('bracket')) {
          open.val = '\\' + open.val;
          open.type = 'bracket.inner';
          open.escaped = true;
          return open;
        }

        var node = pos({
          type: 'bracket',
          nodes: [open]
        });

        defineProperty$5(node, 'parent', prev);
        defineProperty$5(open, 'parent', node);
        this.push('bracket', node);
        prev.nodes.push(node);
      })

      /**
       * Bracket text
       */

      .capture('bracket.inner', function() {
        if (!this.isInside('bracket')) return;
        var pos = this.position();
        var m = this.match(not$1);
        if (!m || !m[0]) return;

        var next = this.input.charAt(0);
        var val = m[0];

        var node = pos({
          type: 'bracket.inner',
          val: val
        });

        if (val === '\\\\') {
          return node;
        }

        var first = val.charAt(0);
        var last = val.slice(-1);

        if (first === '!') {
          val = '^' + val.slice(1);
        }

        if (last === '\\' || (val === '^' && next === ']')) {
          val += this.input[0];
          this.consume(1);
        }

        node.val = val;
        return node;
      })

      /**
       * Close: ']'
       */

      .capture('bracket.close', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^\]/);
        if (!m) return;

        var prev = this.prev();
        var last = utils$1.last(prev.nodes);

        if (parsed.slice(-1) === '\\' && !this.isInside('bracket')) {
          last.val = last.val.slice(0, last.val.length - 1);

          return pos({
            type: 'escape',
            val: m[0]
          });
        }

        var node = pos({
          type: 'bracket.close',
          rest: this.input,
          val: m[0]
        });

        if (last.type === 'bracket.open') {
          node.type = 'bracket.inner';
          node.escaped = true;
          return node;
        }

        var bracket = this.pop('bracket');
        if (!this.isType(bracket, 'bracket')) {
          if (this.options.strict) {
            throw new Error('missing opening "["');
          }
          node.type = 'bracket.inner';
          node.escaped = true;
          return node;
        }

        bracket.nodes.push(node);
        defineProperty$5(node, 'parent', bracket);
      });
  }

  /**
   * Brackets parsers
   */

  var parsers_1 = parsers$2;

  /**
   * Expose text regex
   */

  var TEXT_REGEX_1 = TEXT_REGEX;
  parsers_1.TEXT_REGEX = TEXT_REGEX_1;

  /*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtendable$a = function isExtendable(val) {
    return typeof val !== 'undefined' && val !== null
      && (typeof val === 'object' || typeof val === 'function');
  };

  var extendShallow$9 = function extend(o/*, objects*/) {
    if (!isExtendable$a(o)) { o = {}; }

    var len = arguments.length;
    for (var i = 1; i < len; i++) {
      var obj = arguments[i];

      if (isExtendable$a(obj)) {
        assign$9(o, obj);
      }
    }
    return o;
  };

  function assign$9(a, b) {
    for (var key in b) {
      if (hasOwn$a(b, key)) {
        a[key] = b[key];
      }
    }
  }

  /**
   * Returns true if the given `key` is an own property of `obj`.
   */

  function hasOwn$a(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
   * Local dependencies
   */




  /**
   * Module dependencies
   */

  var debug$3 = src('expand-brackets');




  /**
   * Parses the given POSIX character class `pattern` and returns a
   * string that can be used for creating regular expressions for matching.
   *
   * @param {String} `pattern`
   * @param {Object} `options`
   * @return {Object}
   * @api public
   */

  function brackets(pattern, options) {
    debug$3('initializing from <%s>', __filename);
    var res = brackets.create(pattern, options);
    return res.output;
  }

  /**
   * Takes an array of strings and a POSIX character class pattern, and returns a new
   * array with only the strings that matched the pattern.
   *
   * ```js
   * var brackets = require('expand-brackets');
   * console.log(brackets.match(['1', 'a', 'ab'], '[[:alpha:]]'));
   * //=> ['a']
   *
   * console.log(brackets.match(['1', 'a', 'ab'], '[[:alpha:]]+'));
   * //=> ['a', 'ab']
   * ```
   * @param {Array} `arr` Array of strings to match
   * @param {String} `pattern` POSIX character class pattern(s)
   * @param {Object} `options`
   * @return {Array}
   * @api public
   */

  brackets.match = function(arr, pattern, options) {
    arr = [].concat(arr);
    var opts = extendShallow$9({}, options);
    var isMatch = brackets.matcher(pattern, opts);
    var len = arr.length;
    var idx = -1;
    var res = [];

    while (++idx < len) {
      var ele = arr[idx];
      if (isMatch(ele)) {
        res.push(ele);
      }
    }

    if (res.length === 0) {
      if (opts.failglob === true) {
        throw new Error('no matches found for "' + pattern + '"');
      }

      if (opts.nonull === true || opts.nullglob === true) {
        return [pattern.split('\\').join('')];
      }
    }
    return res;
  };

  /**
   * Returns true if the specified `string` matches the given
   * brackets `pattern`.
   *
   * ```js
   * var brackets = require('expand-brackets');
   *
   * console.log(brackets.isMatch('a.a', '[[:alpha:]].[[:alpha:]]'));
   * //=> true
   * console.log(brackets.isMatch('1.2', '[[:alpha:]].[[:alpha:]]'));
   * //=> false
   * ```
   * @param {String} `string` String to match
   * @param {String} `pattern` Poxis pattern
   * @param {String} `options`
   * @return {Boolean}
   * @api public
   */

  brackets.isMatch = function(str, pattern, options) {
    return brackets.matcher(pattern, options)(str);
  };

  /**
   * Takes a POSIX character class pattern and returns a matcher function. The returned
   * function takes the string to match as its only argument.
   *
   * ```js
   * var brackets = require('expand-brackets');
   * var isMatch = brackets.matcher('[[:lower:]].[[:upper:]]');
   *
   * console.log(isMatch('a.a'));
   * //=> false
   * console.log(isMatch('a.A'));
   * //=> true
   * ```
   * @param {String} `pattern` Poxis pattern
   * @param {String} `options`
   * @return {Boolean}
   * @api public
   */

  brackets.matcher = function(pattern, options) {
    var re = brackets.makeRe(pattern, options);
    return function(str) {
      return re.test(str);
    };
  };

  /**
   * Create a regular expression from the given `pattern`.
   *
   * ```js
   * var brackets = require('expand-brackets');
   * var re = brackets.makeRe('[[:alpha:]]');
   * console.log(re);
   * //=> /^(?:[a-zA-Z])$/
   * ```
   * @param {String} `pattern` The pattern to convert to regex.
   * @param {Object} `options`
   * @return {RegExp}
   * @api public
   */

  brackets.makeRe = function(pattern, options) {
    var res = brackets.create(pattern, options);
    var opts = extendShallow$9({strictErrors: false}, options);
    return toRegex$1(res.output, opts);
  };

  /**
   * Parses the given POSIX character class `pattern` and returns an object
   * with the compiled `output` and optional source `map`.
   *
   * ```js
   * var brackets = require('expand-brackets');
   * console.log(brackets('[[:alpha:]]'));
   * // { options: { source: 'string' },
   * //   input: '[[:alpha:]]',
   * //   state: {},
   * //   compilers:
   * //    { eos: [Function],
   * //      noop: [Function],
   * //      bos: [Function],
   * //      not: [Function],
   * //      escape: [Function],
   * //      text: [Function],
   * //      posix: [Function],
   * //      bracket: [Function],
   * //      'bracket.open': [Function],
   * //      'bracket.inner': [Function],
   * //      'bracket.literal': [Function],
   * //      'bracket.close': [Function] },
   * //   output: '[a-zA-Z]',
   * //   ast:
   * //    { type: 'root',
   * //      errors: [],
   * //      nodes: [ [Object], [Object], [Object] ] },
   * //   parsingErrors: [] }
   * ```
   * @param {String} `pattern`
   * @param {Object} `options`
   * @return {Object}
   * @api public
   */

  brackets.create = function(pattern, options) {
    var snapdragon$$1 = (options && options.snapdragon) || new snapdragon(options);
    compilers$2(snapdragon$$1);
    parsers_1(snapdragon$$1);

    var ast = snapdragon$$1.parse(pattern, options);
    ast.input = pattern;
    var res = snapdragon$$1.compile(ast, options);
    res.input = pattern;
    return res;
  };

  /**
   * Expose `brackets` constructor, parsers and compilers
   */

  brackets.compilers = compilers$2;
  brackets.parsers = parsers_1;

  /**
   * Expose `brackets`
   * @type {Function}
   */

  var expandBrackets = brackets;

  /**
   * Extglob compilers
   */

  var compilers$3 = function(extglob) {
    function star() {
      if (typeof extglob.options.star === 'function') {
        return extglob.options.star.apply(this, arguments);
      }
      if (typeof extglob.options.star === 'string') {
        return extglob.options.star;
      }
      return '.*?';
    }

    /**
     * Use `expand-brackets` compilers
     */

    extglob.use(expandBrackets.compilers);
    extglob.compiler

      /**
       * Escaped: "\\*"
       */

      .set('escape', function(node) {
        return this.emit(node.val, node);
      })

      /**
       * Dot: "."
       */

      .set('dot', function(node) {
        return this.emit('\\' + node.val, node);
      })

      /**
       * Question mark: "?"
       */

      .set('qmark', function(node) {
        var val = '[^\\\\/.]';
        var prev = this.prev();

        if (node.parsed.slice(-1) === '(') {
          var ch = node.rest.charAt(0);
          if (ch !== '!' && ch !== '=' && ch !== ':') {
            return this.emit(val, node);
          }
          return this.emit(node.val, node);
        }

        if (prev.type === 'text' && prev.val) {
          return this.emit(val, node);
        }

        if (node.val.length > 1) {
          val += '{' + node.val.length + '}';
        }
        return this.emit(val, node);
      })

      /**
       * Plus: "+"
       */

      .set('plus', function(node) {
        var prev = node.parsed.slice(-1);
        if (prev === ']' || prev === ')') {
          return this.emit(node.val, node);
        }
        var ch = this.output.slice(-1);
        if (!this.output || (/[?*+]/.test(ch) && node.parent.type !== 'bracket')) {
          return this.emit('\\+', node);
        }
        if (/\w/.test(ch) && !node.inside) {
          return this.emit('+\\+?', node);
        }
        return this.emit('+', node);
      })

      /**
       * Star: "*"
       */

      .set('star', function(node) {
        var prev = this.prev();
        var prefix = prev.type !== 'text' && prev.type !== 'escape'
          ? '(?!\\.)'
          : '';

        return this.emit(prefix + star.call(this, node), node);
      })

      /**
       * Parens
       */

      .set('paren', function(node) {
        return this.mapVisit(node.nodes);
      })
      .set('paren.open', function(node) {
        var capture = this.options.capture ? '(' : '';

        switch (node.parent.prefix) {
          case '!':
          case '^':
            return this.emit(capture + '(?:(?!(?:', node);
          case '*':
          case '+':
          case '?':
          case '@':
            return this.emit(capture + '(?:', node);
          default: {
            var val = node.val;
            if (this.options.bash === true) {
              val = '\\' + val;
            } else if (!this.options.capture && val === '(' && node.parent.rest[0] !== '?') {
              val += '?:';
            }

            return this.emit(val, node);
          }
        }
      })
      .set('paren.close', function(node) {
        var capture = this.options.capture ? ')' : '';

        switch (node.prefix) {
          case '!':
          case '^':
            var prefix = /^(\)|$)/.test(node.rest) ? '$' : '';
            var str = star.call(this, node);

            // if the extglob has a slash explicitly defined, we know the user wants
            // to match slashes, so we need to ensure the "star" regex allows for it
            if (node.parent.hasSlash && !this.options.star && this.options.slash !== false) {
              str = '.*?';
            }

            return this.emit(prefix + ('))' + str + ')') + capture, node);
          case '*':
          case '+':
          case '?':
            return this.emit(')' + node.prefix + capture, node);
          case '@':
            return this.emit(')' + capture, node);
          default: {
            var val = (this.options.bash === true ? '\\' : '') + ')';
            return this.emit(val, node);
          }
        }
      })

      /**
       * Text
       */

      .set('text', function(node) {
        var val = node.val.replace(/[\[\]]/g, '\\$&');
        return this.emit(val, node);
      });
  };

  var defineProperty$6 = function defineProperty(obj, prop, val) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      throw new TypeError('expected an object or function.');
    }

    if (typeof prop !== 'string') {
      throw new TypeError('expected `prop` to be a string.');
    }

    if (isDescriptor(val) && ('set' in val || 'get' in val)) {
      return Object.defineProperty(obj, prop, val);
    }

    return Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });
  };

  var utils_1$2 = createCommonjsModule(function (module) {




  /**
   * Utils
   */

  var utils = module.exports;
  var cache = utils.cache = new fragmentCache();

  /**
   * Cast `val` to an array
   * @return {Array}
   */

  utils.arrayify = function(val) {
    if (!Array.isArray(val)) {
      return [val];
    }
    return val;
  };

  /**
   * Memoize a generated regex or function
   */

  utils.memoize = function(type, pattern, options, fn) {
    var key = utils.createKey(type + pattern, options);

    if (cache.has(type, key)) {
      return cache.get(type, key);
    }

    var val = fn(pattern, options);
    if (options && options.cache === false) {
      return val;
    }

    cache.set(type, key, val);
    return val;
  };

  /**
   * Create the key to use for memoization. The key is generated
   * by iterating over the options and concatenating key-value pairs
   * to the pattern string.
   */

  utils.createKey = function(pattern, options) {
    var key = pattern;
    if (typeof options === 'undefined') {
      return key;
    }
    for (var prop in options) {
      key += ';' + prop + '=' + String(options[prop]);
    }
    return key;
  };

  /**
   * Create the regex to use for matching text
   */

  utils.createRegex = function(str) {
    var opts = {contains: true, strictClose: false};
    return regexNot(str, opts);
  };
  });

  /**
   * Characters to use in text regex (we want to "not" match
   * characters that are matched by other parsers)
   */

  var TEXT_REGEX$1 = '([!@*?+]?\\(|\\)|[*?.+\\\\]|\\[:?(?=.*\\])|:?\\])+';
  var not$2 = utils_1$2.createRegex(TEXT_REGEX$1);

  /**
   * Extglob parsers
   */

  function parsers$3(extglob) {
    extglob.state = extglob.state || {};

    /**
     * Use `expand-brackets` parsers
     */

    extglob.use(expandBrackets.parsers);
    extglob.parser.sets.paren = extglob.parser.sets.paren || [];
    extglob.parser

      /**
       * Extglob open: "*("
       */

      .capture('paren.open', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^([!@*?+])?\(/);
        if (!m) return;

        var prev = this.prev();
        var prefix = m[1];
        var val = m[0];

        var open = pos({
          type: 'paren.open',
          parsed: parsed,
          val: val
        });

        var node = pos({
          type: 'paren',
          prefix: prefix,
          nodes: [open]
        });

        // if nested negation extglobs, just cancel them out to simplify
        if (prefix === '!' && prev.type === 'paren' && prev.prefix === '!') {
          prev.prefix = '@';
          node.prefix = '@';
        }

        defineProperty$6(node, 'rest', this.input);
        defineProperty$6(node, 'parsed', parsed);
        defineProperty$6(node, 'parent', prev);
        defineProperty$6(open, 'parent', node);

        this.push('paren', node);
        prev.nodes.push(node);
      })

      /**
       * Extglob close: ")"
       */

      .capture('paren.close', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^\)/);
        if (!m) return;

        var parent = this.pop('paren');
        var node = pos({
          type: 'paren.close',
          rest: this.input,
          parsed: parsed,
          val: m[0]
        });

        if (!this.isType(parent, 'paren')) {
          if (this.options.strict) {
            throw new Error('missing opening paren: "("');
          }
          node.escaped = true;
          return node;
        }

        node.prefix = parent.prefix;
        parent.nodes.push(node);
        defineProperty$6(node, 'parent', parent);
      })

      /**
       * Escape: "\\."
       */

      .capture('escape', function() {
        var pos = this.position();
        var m = this.match(/^\\(.)/);
        if (!m) return;

        return pos({
          type: 'escape',
          val: m[0],
          ch: m[1]
        });
      })

      /**
       * Question marks: "?"
       */

      .capture('qmark', function() {
        var parsed = this.parsed;
        var pos = this.position();
        var m = this.match(/^\?+(?!\()/);
        if (!m) return;
        extglob.state.metachar = true;
        return pos({
          type: 'qmark',
          rest: this.input,
          parsed: parsed,
          val: m[0]
        });
      })

      /**
       * Character parsers
       */

      .capture('star', /^\*(?!\()/)
      .capture('plus', /^\+(?!\()/)
      .capture('dot', /^\./)
      .capture('text', not$2);
  }
  /**
   * Expose text regex string
   */

  var TEXT_REGEX_1$1 = TEXT_REGEX$1;

  /**
   * Extglob parsers
   */

  var parsers_1$1 = parsers$3;
  parsers_1$1.TEXT_REGEX = TEXT_REGEX_1$1;

  /**
   * Module dependencies
   */





  /**
   * Local dependencies
   */




  /**
   * Customize Snapdragon parser and renderer
   */

  function Extglob(options) {
    this.options = extendShallow$8({source: 'extglob'}, options);
    this.snapdragon = this.options.snapdragon || new snapdragon(this.options);
    this.snapdragon.patterns = this.snapdragon.patterns || {};
    this.compiler = this.snapdragon.compiler;
    this.parser = this.snapdragon.parser;

    compilers$3(this.snapdragon);
    parsers_1$1(this.snapdragon);

    /**
     * Override Snapdragon `.parse` method
     */

    defineProperty$6(this.snapdragon, 'parse', function(str, options) {
      var parsed = snapdragon.prototype.parse.apply(this, arguments);
      parsed.input = str;

      // escape unmatched brace/bracket/parens
      var last = this.parser.stack.pop();
      if (last && this.options.strict !== true) {
        var node = last.nodes[0];
        node.val = '\\' + node.val;
        var sibling = node.parent.nodes[1];
        if (sibling.type === 'star') {
          sibling.loose = true;
        }
      }

      // add non-enumerable parser reference
      defineProperty$6(parsed, 'parser', this.parser);
      return parsed;
    });

    /**
     * Decorate `.parse` method
     */

    defineProperty$6(this, 'parse', function(ast, options) {
      return this.snapdragon.parse.apply(this.snapdragon, arguments);
    });

    /**
     * Decorate `.compile` method
     */

    defineProperty$6(this, 'compile', function(ast, options) {
      return this.snapdragon.compile.apply(this.snapdragon, arguments);
    });

  }

  /**
   * Expose `Extglob`
   */

  var extglob = Extglob;

  /**
   * Module dependencies
   */





  /**
   * Local dependencies
   */





  var MAX_LENGTH$3 = 1024 * 64;

  /**
   * Convert the given `extglob` pattern into a regex-compatible string. Returns
   * an object with the compiled result and the parsed AST.
   *
   * ```js
   * var extglob = require('extglob');
   * console.log(extglob('*.!(*a)'));
   * //=> '(?!\\.)[^/]*?\\.(?!(?!\\.)[^/]*?a\\b).*?'
   * ```
   * @param {String} `pattern`
   * @param {Object} `options`
   * @return {String}
   * @api public
   */

  function extglob$1(pattern, options) {
    return extglob$1.create(pattern, options).output;
  }

  /**
   * Takes an array of strings and an extglob pattern and returns a new
   * array that contains only the strings that match the pattern.
   *
   * ```js
   * var extglob = require('extglob');
   * console.log(extglob.match(['a.a', 'a.b', 'a.c'], '*.!(*a)'));
   * //=> ['a.b', 'a.c']
   * ```
   * @param {Array} `list` Array of strings to match
   * @param {String} `pattern` Extglob pattern
   * @param {Object} `options`
   * @return {Array} Returns an array of matches
   * @api public
   */

  extglob$1.match = function(list, pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    list = utils_1$2.arrayify(list);
    var isMatch = extglob$1.matcher(pattern, options);
    var len = list.length;
    var idx = -1;
    var matches = [];

    while (++idx < len) {
      var ele = list[idx];

      if (isMatch(ele)) {
        matches.push(ele);
      }
    }

    // if no options were passed, uniquify results and return
    if (typeof options === 'undefined') {
      return arrayUnique(matches);
    }

    if (matches.length === 0) {
      if (options.failglob === true) {
        throw new Error('no matches found for "' + pattern + '"');
      }
      if (options.nonull === true || options.nullglob === true) {
        return [pattern.split('\\').join('')];
      }
    }

    return options.nodupes !== false ? arrayUnique(matches) : matches;
  };

  /**
   * Returns true if the specified `string` matches the given
   * extglob `pattern`.
   *
   * ```js
   * var extglob = require('extglob');
   *
   * console.log(extglob.isMatch('a.a', '*.!(*a)'));
   * //=> false
   * console.log(extglob.isMatch('a.b', '*.!(*a)'));
   * //=> true
   * ```
   * @param {String} `string` String to match
   * @param {String} `pattern` Extglob pattern
   * @param {String} `options`
   * @return {Boolean}
   * @api public
   */

  extglob$1.isMatch = function(str, pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }

    if (pattern === str) {
      return true;
    }

    if (pattern === '' || pattern === ' ' || pattern === '.') {
      return pattern === str;
    }

    var isMatch = utils_1$2.memoize('isMatch', pattern, options, extglob$1.matcher);
    return isMatch(str);
  };

  /**
   * Returns true if the given `string` contains the given pattern. Similar to `.isMatch` but
   * the pattern can match any part of the string.
   *
   * ```js
   * var extglob = require('extglob');
   * console.log(extglob.contains('aa/bb/cc', '*b'));
   * //=> true
   * console.log(extglob.contains('aa/bb/cc', '*d'));
   * //=> false
   * ```
   * @param {String} `str` The string to match.
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {Object} `options`
   * @return {Boolean} Returns true if the patter matches any part of `str`.
   * @api public
   */

  extglob$1.contains = function(str, pattern, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }

    if (pattern === '' || pattern === ' ' || pattern === '.') {
      return pattern === str;
    }

    var opts = extendShallow$8({}, options, {contains: true});
    opts.strictClose = false;
    opts.strictOpen = false;
    return extglob$1.isMatch(str, pattern, opts);
  };

  /**
   * Takes an extglob pattern and returns a matcher function. The returned
   * function takes the string to match as its only argument.
   *
   * ```js
   * var extglob = require('extglob');
   * var isMatch = extglob.matcher('*.!(*a)');
   *
   * console.log(isMatch('a.a'));
   * //=> false
   * console.log(isMatch('a.b'));
   * //=> true
   * ```
   * @param {String} `pattern` Extglob pattern
   * @param {String} `options`
   * @return {Boolean}
   * @api public
   */

  extglob$1.matcher = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    function matcher() {
      var re = extglob$1.makeRe(pattern, options);
      return function(str) {
        return re.test(str);
      };
    }

    return utils_1$2.memoize('matcher', pattern, options, matcher);
  };

  /**
   * Convert the given `extglob` pattern into a regex-compatible string. Returns
   * an object with the compiled result and the parsed AST.
   *
   * ```js
   * var extglob = require('extglob');
   * console.log(extglob.create('*.!(*a)').output);
   * //=> '(?!\\.)[^/]*?\\.(?!(?!\\.)[^/]*?a\\b).*?'
   * ```
   * @param {String} `str`
   * @param {Object} `options`
   * @return {String}
   * @api public
   */

  extglob$1.create = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    function create() {
      var ext = new extglob(options);
      var ast = ext.parse(pattern, options);
      return ext.compile(ast, options);
    }

    return utils_1$2.memoize('create', pattern, options, create);
  };

  /**
   * Returns an array of matches captured by `pattern` in `string`, or `null`
   * if the pattern did not match.
   *
   * ```js
   * var extglob = require('extglob');
   * extglob.capture(pattern, string[, options]);
   *
   * console.log(extglob.capture('test/*.js', 'test/foo.js'));
   * //=> ['foo']
   * console.log(extglob.capture('test/*.js', 'foo/bar.css'));
   * //=> null
   * ```
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {String} `string` String to match
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns an array of captures if the string matches the glob pattern, otherwise `null`.
   * @api public
   */

  extglob$1.capture = function(pattern, str, options) {
    var re = extglob$1.makeRe(pattern, extendShallow$8({capture: true}, options));

    function match() {
      return function(string) {
        var match = re.exec(string);
        if (!match) {
          return null;
        }

        return match.slice(1);
      };
    }

    var capture = utils_1$2.memoize('capture', pattern, options, match);
    return capture(str);
  };

  /**
   * Create a regular expression from the given `pattern` and `options`.
   *
   * ```js
   * var extglob = require('extglob');
   * var re = extglob.makeRe('*.!(*a)');
   * console.log(re);
   * //=> /^[^\/]*?\.(?![^\/]*?a)[^\/]*?$/
   * ```
   * @param {String} `pattern` The pattern to convert to regex.
   * @param {Object} `options`
   * @return {RegExp}
   * @api public
   */

  extglob$1.makeRe = function(pattern, options) {
    if (pattern instanceof RegExp) {
      return pattern;
    }

    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    if (pattern.length > MAX_LENGTH$3) {
      throw new Error('expected pattern to be less than ' + MAX_LENGTH$3 + ' characters');
    }

    function makeRe() {
      var opts = extendShallow$8({strictErrors: false}, options);
      if (opts.strictErrors === true) opts.strict = true;
      var res = extglob$1.create(pattern, opts);
      return toRegex$1(res.output, opts);
    }

    var regex = utils_1$2.memoize('makeRe', pattern, options, makeRe);
    if (regex.source.length > MAX_LENGTH$3) {
      throw new SyntaxError('potentially malicious regex detected');
    }

    return regex;
  };

  /**
   * Cache
   */

  extglob$1.cache = utils_1$2.cache;
  extglob$1.clearCache = function() {
    extglob$1.cache.__data__ = {};
  };

  /**
   * Expose `Extglob` constructor, parsers and compilers
   */

  extglob$1.Extglob = extglob;
  extglob$1.compilers = compilers$3;
  extglob$1.parsers = parsers_1$1;

  /**
   * Expose `extglob`
   * @type {Function}
   */

  var extglob_1 = extglob$1;

  var compilers$4 = function(snapdragon) {
    var compilers = snapdragon.compiler.compilers;
    var opts = snapdragon.options;

    // register nanomatch compilers
    snapdragon.use(nanomatch_1.compilers);

    // get references to some specific nanomatch compilers before they
    // are overridden by the extglob and/or custom compilers
    var escape = compilers.escape;
    var qmark = compilers.qmark;
    var slash = compilers.slash;
    var star = compilers.star;
    var text = compilers.text;
    var plus = compilers.plus;
    var dot = compilers.dot;

    // register extglob compilers or escape exglobs if disabled
    if (opts.extglob === false || opts.noext === true) {
      snapdragon.compiler.use(escapeExtglobs);
    } else {
      snapdragon.use(extglob_1.compilers);
    }

    snapdragon.use(function() {
      this.options.star = this.options.star || function(/*node*/) {
        return '[^\\\\/]*?';
      };
    });

    // custom micromatch compilers
    snapdragon.compiler

      // reset referenced compiler
      .set('dot', dot)
      .set('escape', escape)
      .set('plus', plus)
      .set('slash', slash)
      .set('qmark', qmark)
      .set('star', star)
      .set('text', text);
  };

  function escapeExtglobs(compiler) {
    compiler.set('paren', function(node) {
      var val = '';
      visit(node, function(tok) {
        if (tok.val) val += (/^\W/.test(tok.val) ? '\\' : '') + tok.val;
      });
      return this.emit(val, node);
    });

    /**
     * Visit `node` with the given `fn`
     */

    function visit(node, fn) {
      return node.nodes ? mapVisit(node.nodes, fn) : fn(node);
    }

    /**
     * Map visit over array of `nodes`.
     */

    function mapVisit(nodes, fn) {
      var len = nodes.length;
      var idx = -1;
      while (++idx < len) {
        visit(nodes[idx], fn);
      }
    }
  }

  var not$3;

  /**
   * Characters to use in negation regex (we want to "not" match
   * characters that are matched by other parsers)
   */

  var TEXT = '([!@*?+]?\\(|\\)|\\[:?(?=.*?:?\\])|:?\\]|[*+?!^$.\\\\/])+';
  var createNotRegex = function(opts) {
    return not$3 || (not$3 = textRegex(TEXT));
  };

  /**
   * Parsers
   */

  var parsers$4 = function(snapdragon) {
    var parsers = snapdragon.parser.parsers;

    // register nanomatch parsers
    snapdragon.use(nanomatch_1.parsers);

    // get references to some specific nanomatch parsers before they
    // are overridden by the extglob and/or parsers
    var escape = parsers.escape;
    var slash = parsers.slash;
    var qmark = parsers.qmark;
    var plus = parsers.plus;
    var star = parsers.star;
    var dot = parsers.dot;

    // register extglob parsers
    snapdragon.use(extglob_1.parsers);

    // custom micromatch parsers
    snapdragon.parser
      .use(function() {
        // override "notRegex" created in nanomatch parser
        this.notRegex = /^\!+(?!\()/;
      })
      // reset the referenced parsers
      .capture('escape', escape)
      .capture('slash', slash)
      .capture('qmark', qmark)
      .capture('star', star)
      .capture('plus', plus)
      .capture('dot', dot)

      /**
       * Override `text` parser
       */

      .capture('text', function() {
        if (this.isInside('bracket')) return;
        var pos = this.position();
        var m = this.match(createNotRegex(this.options));
        if (!m || !m[0]) return;

        // escape regex boundary characters and simple brackets
        var val = m[0].replace(/([[\]^$])/g, '\\$1');

        return pos({
          type: 'text',
          val: val
        });
      });
  };

  /**
   * Create text regex
   */

  function textRegex(pattern) {
    var notStr = regexNot.create(pattern, {contains: true, strictClose: false});
    var prefix = '(?:[\\^]|\\\\|';
    return toRegex$1(prefix + notStr + ')', {strictClose: false});
  }

  var cache$6 = new (fragmentCache)();

  var define$3 = (typeof Reflect !== 'undefined' && Reflect.defineProperty)
    ? Reflect.defineProperty
    : Object.defineProperty;

  var defineProperty$7 = function defineProperty(obj, key, val) {
    if (!isobject(obj) && typeof obj !== 'function' && !Array.isArray(obj)) {
      throw new TypeError('expected an object, function, or array');
    }

    if (typeof key !== 'string') {
      throw new TypeError('expected "key" to be a string');
    }

    if (isDescriptor(val)) {
      define$3(obj, key, val);
      return obj;
    }

    define$3(obj, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val
    });

    return obj;
  };

  var toString$e = Object.prototype.toString;

  var kindOf$c = function kindOf(val) {
    if (val === void 0) return 'undefined';
    if (val === null) return 'null';

    var type = typeof val;
    if (type === 'boolean') return 'boolean';
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'symbol') return 'symbol';
    if (type === 'function') {
      return isGeneratorFn$4(val) ? 'generatorfunction' : 'function';
    }

    if (isArray$4(val)) return 'array';
    if (isBuffer$7(val)) return 'buffer';
    if (isArguments$4(val)) return 'arguments';
    if (isDate$4(val)) return 'date';
    if (isError$4(val)) return 'error';
    if (isRegexp$4(val)) return 'regexp';

    switch (ctorName$4(val)) {
      case 'Symbol': return 'symbol';
      case 'Promise': return 'promise';

      // Set, Map, WeakSet, WeakMap
      case 'WeakMap': return 'weakmap';
      case 'WeakSet': return 'weakset';
      case 'Map': return 'map';
      case 'Set': return 'set';

      // 8-bit typed arrays
      case 'Int8Array': return 'int8array';
      case 'Uint8Array': return 'uint8array';
      case 'Uint8ClampedArray': return 'uint8clampedarray';

      // 16-bit typed arrays
      case 'Int16Array': return 'int16array';
      case 'Uint16Array': return 'uint16array';

      // 32-bit typed arrays
      case 'Int32Array': return 'int32array';
      case 'Uint32Array': return 'uint32array';
      case 'Float32Array': return 'float32array';
      case 'Float64Array': return 'float64array';
    }

    if (isGeneratorObj$4(val)) {
      return 'generator';
    }

    // Non-plain objects
    type = toString$e.call(val);
    switch (type) {
      case '[object Object]': return 'object';
      // iterators
      case '[object Map Iterator]': return 'mapiterator';
      case '[object Set Iterator]': return 'setiterator';
      case '[object String Iterator]': return 'stringiterator';
      case '[object Array Iterator]': return 'arrayiterator';
    }

    // other
    return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
  };

  function ctorName$4(val) {
    return val.constructor ? val.constructor.name : null;
  }

  function isArray$4(val) {
    if (Array.isArray) return Array.isArray(val);
    return val instanceof Array;
  }

  function isError$4(val) {
    return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
  }

  function isDate$4(val) {
    if (val instanceof Date) return true;
    return typeof val.toDateString === 'function'
      && typeof val.getDate === 'function'
      && typeof val.setDate === 'function';
  }

  function isRegexp$4(val) {
    if (val instanceof RegExp) return true;
    return typeof val.flags === 'string'
      && typeof val.ignoreCase === 'boolean'
      && typeof val.multiline === 'boolean'
      && typeof val.global === 'boolean';
  }

  function isGeneratorFn$4(name, val) {
    return ctorName$4(name) === 'GeneratorFunction';
  }

  function isGeneratorObj$4(val) {
    return typeof val.throw === 'function'
      && typeof val.return === 'function'
      && typeof val.next === 'function';
  }

  function isArguments$4(val) {
    try {
      if (typeof val.length === 'number' && typeof val.callee === 'function') {
        return true;
      }
    } catch (err) {
      if (err.message.indexOf('callee') !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * If you need to support Safari 5-7 (8-10 yr-old browser),
   * take a look at https://github.com/feross/is-buffer
   */

  function isBuffer$7(val) {
    if (val.constructor && typeof val.constructor.isBuffer === 'function') {
      return val.constructor.isBuffer(val);
    }
    return false;
  }

  var utils_1$3 = createCommonjsModule(function (module) {

  var utils = module.exports;


  /**
   * Module dependencies
   */


  utils.define = defineProperty$7;
  utils.diff = arrDiff;
  utils.extend = extendShallow$6;
  utils.pick = object_pick;
  utils.typeOf = kindOf$c;
  utils.unique = arrayUnique;

  /**
   * Returns true if the platform is windows, or `path.sep` is `\\`.
   * This is defined as a function to allow `path.sep` to be set in unit tests,
   * or by the user, if there is a reason to do so.
   * @return {Boolean}
   */

  utils.isWindows = function() {
    return path.sep === '\\' || process.platform === 'win32';
  };

  /**
   * Get the `Snapdragon` instance to use
   */

  utils.instantiate = function(ast, options) {
    var snapdragon$$1;
    // if an instance was created by `.parse`, use that instance
    if (utils.typeOf(ast) === 'object' && ast.snapdragon) {
      snapdragon$$1 = ast.snapdragon;
    // if the user supplies an instance on options, use that instance
    } else if (utils.typeOf(options) === 'object' && options.snapdragon) {
      snapdragon$$1 = options.snapdragon;
    // create a new instance
    } else {
      snapdragon$$1 = new snapdragon(options);
    }

    utils.define(snapdragon$$1, 'parse', function(str, options) {
      var parsed = snapdragon.prototype.parse.apply(this, arguments);
      parsed.input = str;

      // escape unmatched brace/bracket/parens
      var last = this.parser.stack.pop();
      if (last && this.options.strictErrors !== true) {
        var open = last.nodes[0];
        var inner = last.nodes[1];
        if (last.type === 'bracket') {
          if (inner.val.charAt(0) === '[') {
            inner.val = '\\' + inner.val;
          }

        } else {
          open.val = '\\' + open.val;
          var sibling = open.parent.nodes[1];
          if (sibling.type === 'star') {
            sibling.loose = true;
          }
        }
      }

      // add non-enumerable parser reference
      utils.define(parsed, 'parser', this.parser);
      return parsed;
    });

    return snapdragon$$1;
  };

  /**
   * Create the key to use for memoization. The key is generated
   * by iterating over the options and concatenating key-value pairs
   * to the pattern string.
   */

  utils.createKey = function(pattern, options) {
    if (utils.typeOf(options) !== 'object') {
      return pattern;
    }
    var val = pattern;
    var keys = Object.keys(options);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      val += ';' + key + '=' + String(options[key]);
    }
    return val;
  };

  /**
   * Cast `val` to an array
   * @return {Array}
   */

  utils.arrayify = function(val) {
    if (typeof val === 'string') return [val];
    return val ? (Array.isArray(val) ? val : [val]) : [];
  };

  /**
   * Return true if `val` is a non-empty string
   */

  utils.isString = function(val) {
    return typeof val === 'string';
  };

  /**
   * Return true if `val` is a non-empty string
   */

  utils.isObject = function(val) {
    return utils.typeOf(val) === 'object';
  };

  /**
   * Returns true if the given `str` has special characters
   */

  utils.hasSpecialChars = function(str) {
    return /(?:(?:(^|\/)[!.])|[*?+()|\[\]{}]|[+@]\()/.test(str);
  };

  /**
   * Escape regex characters in the given string
   */

  utils.escapeRegex = function(str) {
    return str.replace(/[-[\]{}()^$|*+?.\\\/\s]/g, '\\$&');
  };

  /**
   * Normalize slashes in the given filepath.
   *
   * @param {String} `filepath`
   * @return {String}
   */

  utils.toPosixPath = function(str) {
    return str.replace(/\\+/g, '/');
  };

  /**
   * Strip backslashes before special characters in a string.
   *
   * @param {String} `str`
   * @return {String}
   */

  utils.unescape = function(str) {
    return utils.toPosixPath(str.replace(/\\(?=[*+?!.])/g, ''));
  };

  /**
   * Strip the prefix from a filepath
   * @param {String} `fp`
   * @return {String}
   */

  utils.stripPrefix = function(str) {
    if (str.charAt(0) !== '.') {
      return str;
    }
    var ch = str.charAt(1);
    if (utils.isSlash(ch)) {
      return str.slice(2);
    }
    return str;
  };

  /**
   * Returns true if the given str is an escaped or
   * unescaped path character
   */

  utils.isSlash = function(str) {
    return str === '/' || str === '\\/' || str === '\\' || str === '\\\\';
  };

  /**
   * Returns a function that returns true if the given
   * pattern matches or contains a `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.matchPath = function(pattern, options) {
    return (options && options.contains)
      ? utils.containsPattern(pattern, options)
      : utils.equalsPattern(pattern, options);
  };

  /**
   * Returns true if the given (original) filepath or unixified path are equal
   * to the given pattern.
   */

  utils._equals = function(filepath, unixPath, pattern) {
    return pattern === filepath || pattern === unixPath;
  };

  /**
   * Returns true if the given (original) filepath or unixified path contain
   * the given pattern.
   */

  utils._contains = function(filepath, unixPath, pattern) {
    return filepath.indexOf(pattern) !== -1 || unixPath.indexOf(pattern) !== -1;
  };

  /**
   * Returns a function that returns true if the given
   * pattern is the same as a given `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.equalsPattern = function(pattern, options) {
    var unixify = utils.unixify(options);
    options = options || {};

    return function fn(filepath) {
      var equal = utils._equals(filepath, unixify(filepath), pattern);
      if (equal === true || options.nocase !== true) {
        return equal;
      }
      var lower = filepath.toLowerCase();
      return utils._equals(lower, unixify(lower), pattern);
    };
  };

  /**
   * Returns a function that returns true if the given
   * pattern contains a `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.containsPattern = function(pattern, options) {
    var unixify = utils.unixify(options);
    options = options || {};

    return function(filepath) {
      var contains = utils._contains(filepath, unixify(filepath), pattern);
      if (contains === true || options.nocase !== true) {
        return contains;
      }
      var lower = filepath.toLowerCase();
      return utils._contains(lower, unixify(lower), pattern);
    };
  };

  /**
   * Returns a function that returns true if the given
   * regex matches the `filename` of a file path.
   *
   * @param {RegExp} `re` Matching regex
   * @return {Function}
   */

  utils.matchBasename = function(re) {
    return function(filepath) {
      return re.test(path.basename(filepath));
    };
  };

  /**
   * Determines the filepath to return based on the provided options.
   * @return {any}
   */

  utils.value = function(str, unixify, options) {
    if (options && options.unixify === false) {
      return str;
    }
    return unixify(str);
  };

  /**
   * Returns a function that normalizes slashes in a string to forward
   * slashes, strips `./` from beginning of paths, and optionally unescapes
   * special characters.
   * @return {Function}
   */

  utils.unixify = function(options) {
    options = options || {};
    return function(filepath) {
      if (utils.isWindows() || options.unixify === true) {
        filepath = utils.toPosixPath(filepath);
      }
      if (options.stripPrefix !== false) {
        filepath = utils.stripPrefix(filepath);
      }
      if (options.unescape === true) {
        filepath = utils.unescape(filepath);
      }
      return filepath;
    };
  };
  });

  /**
   * Module dependencies
   */






  /**
   * Local dependencies
   */





  var MAX_LENGTH$4 = 1024 * 64;

  /**
   * The main function takes a list of strings and one or more
   * glob patterns to use for matching.
   *
   * ```js
   * var mm = require('micromatch');
   * mm(list, patterns[, options]);
   *
   * console.log(mm(['a.js', 'a.txt'], ['*.js']));
   * //=> [ 'a.js' ]
   * ```
   * @param {Array} `list` A list of strings to match
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Array} Returns an array of matches
   * @summary false
   * @api public
   */

  function micromatch(list, patterns, options) {
    patterns = utils_1$3.arrayify(patterns);
    list = utils_1$3.arrayify(list);

    var len = patterns.length;
    if (list.length === 0 || len === 0) {
      return [];
    }

    if (len === 1) {
      return micromatch.match(list, patterns[0], options);
    }

    var omit = [];
    var keep = [];
    var idx = -1;

    while (++idx < len) {
      var pattern = patterns[idx];

      if (typeof pattern === 'string' && pattern.charCodeAt(0) === 33 /* ! */) {
        omit.push.apply(omit, micromatch.match(list, pattern.slice(1), options));
      } else {
        keep.push.apply(keep, micromatch.match(list, pattern, options));
      }
    }

    var matches = utils_1$3.diff(keep, omit);
    if (!options || options.nodupes !== false) {
      return utils_1$3.unique(matches);
    }

    return matches;
  }

  /**
   * Similar to the main function, but `pattern` must be a string.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.match(list, pattern[, options]);
   *
   * console.log(mm.match(['a.a', 'a.aa', 'a.b', 'a.c'], '*.a'));
   * //=> ['a.a', 'a.aa']
   * ```
   * @param {Array} `list` Array of strings to match
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Array} Returns an array of matches
   * @api public
   */

  micromatch.match = function(list, pattern, options) {
    if (Array.isArray(pattern)) {
      throw new TypeError('expected pattern to be a string');
    }

    var unixify = utils_1$3.unixify(options);
    var isMatch = memoize$3('match', pattern, options, micromatch.matcher);
    var matches = [];

    list = utils_1$3.arrayify(list);
    var len = list.length;
    var idx = -1;

    while (++idx < len) {
      var ele = list[idx];
      if (ele === pattern || isMatch(ele)) {
        matches.push(utils_1$3.value(ele, unixify, options));
      }
    }

    // if no options were passed, uniquify results and return
    if (typeof options === 'undefined') {
      return utils_1$3.unique(matches);
    }

    if (matches.length === 0) {
      if (options.failglob === true) {
        throw new Error('no matches found for "' + pattern + '"');
      }
      if (options.nonull === true || options.nullglob === true) {
        return [options.unescape ? utils_1$3.unescape(pattern) : pattern];
      }
    }

    // if `opts.ignore` was defined, diff ignored list
    if (options.ignore) {
      matches = micromatch.not(matches, options.ignore, options);
    }

    return options.nodupes !== false ? utils_1$3.unique(matches) : matches;
  };

  /**
   * Returns true if the specified `string` matches the given glob `pattern`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.isMatch(string, pattern[, options]);
   *
   * console.log(mm.isMatch('a.a', '*.a'));
   * //=> true
   * console.log(mm.isMatch('a.b', '*.a'));
   * //=> false
   * ```
   * @param {String} `string` String to match
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if the string matches the glob pattern.
   * @api public
   */

  micromatch.isMatch = function(str, pattern, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }

    if (isEmptyString(str) || isEmptyString(pattern)) {
      return false;
    }

    var equals = utils_1$3.equalsPattern(options);
    if (equals(str)) {
      return true;
    }

    var isMatch = memoize$3('isMatch', pattern, options, micromatch.matcher);
    return isMatch(str);
  };

  /**
   * Returns true if some of the strings in the given `list` match any of the
   * given glob `patterns`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.some(list, patterns[, options]);
   *
   * console.log(mm.some(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
   * // true
   * console.log(mm.some(['foo.js'], ['*.js', '!foo.js']));
   * // false
   * ```
   * @param  {String|Array} `list` The string or array of strings to test. Returns as soon as the first match is found.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  micromatch.some = function(list, patterns, options) {
    if (typeof list === 'string') {
      list = [list];
    }
    for (var i = 0; i < list.length; i++) {
      if (micromatch(list[i], patterns, options).length === 1) {
        return true;
      }
    }
    return false;
  };

  /**
   * Returns true if every string in the given `list` matches
   * any of the given glob `patterns`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.every(list, patterns[, options]);
   *
   * console.log(mm.every('foo.js', ['foo.js']));
   * // true
   * console.log(mm.every(['foo.js', 'bar.js'], ['*.js']));
   * // true
   * console.log(mm.every(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
   * // false
   * console.log(mm.every(['foo.js'], ['*.js', '!foo.js']));
   * // false
   * ```
   * @param  {String|Array} `list` The string or array of strings to test.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  micromatch.every = function(list, patterns, options) {
    if (typeof list === 'string') {
      list = [list];
    }
    for (var i = 0; i < list.length; i++) {
      if (micromatch(list[i], patterns, options).length !== 1) {
        return false;
      }
    }
    return true;
  };

  /**
   * Returns true if **any** of the given glob `patterns`
   * match the specified `string`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.any(string, patterns[, options]);
   *
   * console.log(mm.any('a.a', ['b.*', '*.a']));
   * //=> true
   * console.log(mm.any('a.a', 'b.*'));
   * //=> false
   * ```
   * @param  {String|Array} `str` The string to test.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  micromatch.any = function(str, patterns, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }

    if (isEmptyString(str) || isEmptyString(patterns)) {
      return false;
    }

    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    for (var i = 0; i < patterns.length; i++) {
      if (micromatch.isMatch(str, patterns[i], options)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Returns true if **all** of the given `patterns` match
   * the specified string.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.all(string, patterns[, options]);
   *
   * console.log(mm.all('foo.js', ['foo.js']));
   * // true
   *
   * console.log(mm.all('foo.js', ['*.js', '!foo.js']));
   * // false
   *
   * console.log(mm.all('foo.js', ['*.js', 'foo.js']));
   * // true
   *
   * console.log(mm.all('foo.js', ['*.js', 'f*', '*o*', '*o.js']));
   * // true
   * ```
   * @param  {String|Array} `str` The string to test.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if any patterns match `str`
   * @api public
   */

  micromatch.all = function(str, patterns, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }
    if (typeof patterns === 'string') {
      patterns = [patterns];
    }
    for (var i = 0; i < patterns.length; i++) {
      if (!micromatch.isMatch(str, patterns[i], options)) {
        return false;
      }
    }
    return true;
  };

  /**
   * Returns a list of strings that _**do not match any**_ of the given `patterns`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.not(list, patterns[, options]);
   *
   * console.log(mm.not(['a.a', 'b.b', 'c.c'], '*.a'));
   * //=> ['b.b', 'c.c']
   * ```
   * @param {Array} `list` Array of strings to match.
   * @param {String|Array} `patterns` One or more glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Array} Returns an array of strings that **do not match** the given patterns.
   * @api public
   */

  micromatch.not = function(list, patterns, options) {
    var opts = extendShallow$6({}, options);
    var ignore = opts.ignore;
    delete opts.ignore;

    var unixify = utils_1$3.unixify(opts);
    list = utils_1$3.arrayify(list).map(unixify);

    var matches = utils_1$3.diff(list, micromatch(list, patterns, opts));
    if (ignore) {
      matches = utils_1$3.diff(matches, micromatch(list, ignore));
    }

    return opts.nodupes !== false ? utils_1$3.unique(matches) : matches;
  };

  /**
   * Returns true if the given `string` contains the given pattern. Similar
   * to [.isMatch](#isMatch) but the pattern can match any part of the string.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.contains(string, pattern[, options]);
   *
   * console.log(mm.contains('aa/bb/cc', '*b'));
   * //=> true
   * console.log(mm.contains('aa/bb/cc', '*d'));
   * //=> false
   * ```
   * @param {String} `str` The string to match.
   * @param {String|Array} `patterns` Glob pattern to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns true if the patter matches any part of `str`.
   * @api public
   */

  micromatch.contains = function(str, patterns, options) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string: "' + util.inspect(str) + '"');
    }

    if (typeof patterns === 'string') {
      if (isEmptyString(str) || isEmptyString(patterns)) {
        return false;
      }

      var equals = utils_1$3.equalsPattern(patterns, options);
      if (equals(str)) {
        return true;
      }
      var contains = utils_1$3.containsPattern(patterns, options);
      if (contains(str)) {
        return true;
      }
    }

    var opts = extendShallow$6({}, options, {contains: true});
    return micromatch.any(str, patterns, opts);
  };

  /**
   * Returns true if the given pattern and options should enable
   * the `matchBase` option.
   * @return {Boolean}
   * @api private
   */

  micromatch.matchBase = function(pattern, options) {
    if (pattern && pattern.indexOf('/') !== -1 || !options) return false;
    return options.basename === true || options.matchBase === true;
  };

  /**
   * Filter the keys of the given object with the given `glob` pattern
   * and `options`. Does not attempt to match nested keys. If you need this feature,
   * use [glob-object][] instead.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.matchKeys(object, patterns[, options]);
   *
   * var obj = { aa: 'a', ab: 'b', ac: 'c' };
   * console.log(mm.matchKeys(obj, '*b'));
   * //=> { ab: 'b' }
   * ```
   * @param {Object} `object` The object with keys to filter.
   * @param {String|Array} `patterns` One or more glob patterns to use for matching.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Object} Returns an object with only keys that match the given patterns.
   * @api public
   */

  micromatch.matchKeys = function(obj, patterns, options) {
    if (!utils_1$3.isObject(obj)) {
      throw new TypeError('expected the first argument to be an object');
    }
    var keys = micromatch(Object.keys(obj), patterns, options);
    return utils_1$3.pick(obj, keys);
  };

  /**
   * Returns a memoized matcher function from the given glob `pattern` and `options`.
   * The returned function takes a string to match as its only argument and returns
   * true if the string is a match.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.matcher(pattern[, options]);
   *
   * var isMatch = mm.matcher('*.!(*a)');
   * console.log(isMatch('a.a'));
   * //=> false
   * console.log(isMatch('a.b'));
   * //=> true
   * ```
   * @param {String} `pattern` Glob pattern
   * @param {Object} `options` See available [options](#options) for changing how matches are performed.
   * @return {Function} Returns a matcher function.
   * @api public
   */

  micromatch.matcher = function matcher(pattern, options) {
    if (Array.isArray(pattern)) {
      return compose$2(pattern, options, matcher);
    }

    // if pattern is a regex
    if (pattern instanceof RegExp) {
      return test(pattern);
    }

    // if pattern is invalid
    if (!utils_1$3.isString(pattern)) {
      throw new TypeError('expected pattern to be an array, string or regex');
    }

    // if pattern is a non-glob string
    if (!utils_1$3.hasSpecialChars(pattern)) {
      if (options && options.nocase === true) {
        pattern = pattern.toLowerCase();
      }
      return utils_1$3.matchPath(pattern, options);
    }

    // if pattern is a glob string
    var re = micromatch.makeRe(pattern, options);

    // if `options.matchBase` or `options.basename` is defined
    if (micromatch.matchBase(pattern, options)) {
      return utils_1$3.matchBasename(re, options);
    }

    function test(regex) {
      var equals = utils_1$3.equalsPattern(options);
      var unixify = utils_1$3.unixify(options);

      return function(str) {
        if (equals(str)) {
          return true;
        }

        if (regex.test(unixify(str))) {
          return true;
        }
        return false;
      };
    }

    var fn = test(re);
    Object.defineProperty(fn, 'result', {
      configurable: true,
      enumerable: false,
      value: re.result
    });
    return fn;
  };

  /**
   * Returns an array of matches captured by `pattern` in `string, or `null` if the pattern did not match.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.capture(pattern, string[, options]);
   *
   * console.log(mm.capture('test/*.js', 'test/foo.js'));
   * //=> ['foo']
   * console.log(mm.capture('test/*.js', 'foo/bar.css'));
   * //=> null
   * ```
   * @param {String} `pattern` Glob pattern to use for matching.
   * @param {String} `string` String to match
   * @param {Object} `options` See available [options](#options) for changing how matches are performed
   * @return {Boolean} Returns an array of captures if the string matches the glob pattern, otherwise `null`.
   * @api public
   */

  micromatch.capture = function(pattern, str, options) {
    var re = micromatch.makeRe(pattern, extendShallow$6({capture: true}, options));
    var unixify = utils_1$3.unixify(options);

    function match() {
      return function(string) {
        var match = re.exec(unixify(string));
        if (!match) {
          return null;
        }

        return match.slice(1);
      };
    }

    var capture = memoize$3('capture', pattern, options, match);
    return capture(str);
  };

  /**
   * Create a regular expression from the given glob `pattern`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.makeRe(pattern[, options]);
   *
   * console.log(mm.makeRe('*.js'));
   * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
   * ```
   * @param {String} `pattern` A glob pattern to convert to regex.
   * @param {Object} `options` See available [options](#options) for changing how matches are performed.
   * @return {RegExp} Returns a regex created from the given pattern.
   * @api public
   */

  micromatch.makeRe = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string');
    }

    if (pattern.length > MAX_LENGTH$4) {
      throw new Error('expected pattern to be less than ' + MAX_LENGTH$4 + ' characters');
    }

    function makeRe() {
      var result = micromatch.create(pattern, options);
      var ast_array = [];
      var output = result.map(function(obj) {
        obj.ast.state = obj.state;
        ast_array.push(obj.ast);
        return obj.output;
      });

      var regex = toRegex$1(output.join('|'), options);
      Object.defineProperty(regex, 'result', {
        configurable: true,
        enumerable: false,
        value: ast_array
      });
      return regex;
    }

    return memoize$3('makeRe', pattern, options, makeRe);
  };

  /**
   * Expand the given brace `pattern`.
   *
   * ```js
   * var mm = require('micromatch');
   * console.log(mm.braces('foo/{a,b}/bar'));
   * //=> ['foo/(a|b)/bar']
   *
   * console.log(mm.braces('foo/{a,b}/bar', {expand: true}));
   * //=> ['foo/(a|b)/bar']
   * ```
   * @param {String} `pattern` String with brace pattern to expand.
   * @param {Object} `options` Any [options](#options) to change how expansion is performed. See the [braces][] library for all available options.
   * @return {Array}
   * @api public
   */

  micromatch.braces = function(pattern, options) {
    if (typeof pattern !== 'string' && !Array.isArray(pattern)) {
      throw new TypeError('expected pattern to be an array or string');
    }

    function expand() {
      if (options && options.nobrace === true || !/\{.*\}/.test(pattern)) {
        return utils_1$3.arrayify(pattern);
      }
      return braces_1(pattern, options);
    }

    return memoize$3('braces', pattern, options, expand);
  };

  /**
   * Proxy to the [micromatch.braces](#method), for parity with
   * minimatch.
   */

  micromatch.braceExpand = function(pattern, options) {
    var opts = extendShallow$6({}, options, {expand: true});
    return micromatch.braces(pattern, opts);
  };

  /**
   * Parses the given glob `pattern` and returns an array of abstract syntax
   * trees (ASTs), with the compiled `output` and optional source `map` on
   * each AST.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.create(pattern[, options]);
   *
   * console.log(mm.create('abc/*.js'));
   * // [{ options: { source: 'string', sourcemap: true },
   * //   state: {},
   * //   compilers:
   * //    { ... },
   * //   output: '(\\.[\\\\\\/])?abc\\/(?!\\.)(?=.)[^\\/]*?\\.js',
   * //   ast:
   * //    { type: 'root',
   * //      errors: [],
   * //      nodes:
   * //       [ ... ],
   * //      dot: false,
   * //      input: 'abc/*.js' },
   * //   parsingErrors: [],
   * //   map:
   * //    { version: 3,
   * //      sources: [ 'string' ],
   * //      names: [],
   * //      mappings: 'AAAA,GAAG,EAAC,kBAAC,EAAC,EAAE',
   * //      sourcesContent: [ 'abc/*.js' ] },
   * //   position: { line: 1, column: 28 },
   * //   content: {},
   * //   files: {},
   * //   idx: 6 }]
   * ```
   * @param {String} `pattern` Glob pattern to parse and compile.
   * @param {Object} `options` Any [options](#options) to change how parsing and compiling is performed.
   * @return {Object} Returns an object with the parsed AST, compiled string and optional source map.
   * @api public
   */

  micromatch.create = function(pattern, options) {
    return memoize$3('create', pattern, options, function() {
      function create(str, opts) {
        return micromatch.compile(micromatch.parse(str, opts), opts);
      }

      pattern = micromatch.braces(pattern, options);
      var len = pattern.length;
      var idx = -1;
      var res = [];

      while (++idx < len) {
        res.push(create(pattern[idx], options));
      }
      return res;
    });
  };

  /**
   * Parse the given `str` with the given `options`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.parse(pattern[, options]);
   *
   * var ast = mm.parse('a/{b,c}/d');
   * console.log(ast);
   * // { type: 'root',
   * //   errors: [],
   * //   input: 'a/{b,c}/d',
   * //   nodes:
   * //    [ { type: 'bos', val: '' },
   * //      { type: 'text', val: 'a/' },
   * //      { type: 'brace',
   * //        nodes:
   * //         [ { type: 'brace.open', val: '{' },
   * //           { type: 'text', val: 'b,c' },
   * //           { type: 'brace.close', val: '}' } ] },
   * //      { type: 'text', val: '/d' },
   * //      { type: 'eos', val: '' } ] }
   * ```
   * @param {String} `str`
   * @param {Object} `options`
   * @return {Object} Returns an AST
   * @api public
   */

  micromatch.parse = function(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('expected a string');
    }

    function parse() {
      var snapdragon = utils_1$3.instantiate(null, options);
      parsers$4(snapdragon, options);

      var ast = snapdragon.parse(pattern, options);
      utils_1$3.define(ast, 'snapdragon', snapdragon);
      ast.input = pattern;
      return ast;
    }

    return memoize$3('parse', pattern, options, parse);
  };

  /**
   * Compile the given `ast` or string with the given `options`.
   *
   * ```js
   * var mm = require('micromatch');
   * mm.compile(ast[, options]);
   *
   * var ast = mm.parse('a/{b,c}/d');
   * console.log(mm.compile(ast));
   * // { options: { source: 'string' },
   * //   state: {},
   * //   compilers:
   * //    { eos: [Function],
   * //      noop: [Function],
   * //      bos: [Function],
   * //      brace: [Function],
   * //      'brace.open': [Function],
   * //      text: [Function],
   * //      'brace.close': [Function] },
   * //   output: [ 'a/(b|c)/d' ],
   * //   ast:
   * //    { ... },
   * //   parsingErrors: [] }
   * ```
   * @param {Object|String} `ast`
   * @param {Object} `options`
   * @return {Object} Returns an object that has an `output` property with the compiled string.
   * @api public
   */

  micromatch.compile = function(ast, options) {
    if (typeof ast === 'string') {
      ast = micromatch.parse(ast, options);
    }

    return memoize$3('compile', ast.input, options, function() {
      var snapdragon = utils_1$3.instantiate(ast, options);
      compilers$4(snapdragon, options);
      return snapdragon.compile(ast, options);
    });
  };

  /**
   * Clear the regex cache.
   *
   * ```js
   * mm.clearCache();
   * ```
   * @api public
   */

  micromatch.clearCache = function() {
    micromatch.cache.caches = {};
  };

  /**
   * Returns true if the given value is effectively an empty string
   */

  function isEmptyString(val) {
    return String(val) === '' || String(val) === './';
  }

  /**
   * Compose a matcher function with the given patterns.
   * This allows matcher functions to be compiled once and
   * called multiple times.
   */

  function compose$2(patterns, options, matcher) {
    var matchers;

    return memoize$3('compose', String(patterns), options, function() {
      return function(file) {
        // delay composition until it's invoked the first time,
        // after that it won't be called again
        if (!matchers) {
          matchers = [];
          for (var i = 0; i < patterns.length; i++) {
            matchers.push(matcher(patterns[i], options));
          }
        }

        var len = matchers.length;
        while (len--) {
          if (matchers[len](file) === true) {
            return true;
          }
        }
        return false;
      };
    });
  }

  /**
   * Memoize a generated regex or function. A unique key is generated
   * from the `type` (usually method name), the `pattern`, and
   * user-defined options.
   */

  function memoize$3(type, pattern, options, fn) {
    var key = utils_1$3.createKey(type + '=' + pattern, options);

    if (options && options.cache === false) {
      return fn(pattern, options);
    }

    if (cache$6.has(type, key)) {
      return cache$6.get(type, key);
    }

    var val = fn(pattern, options);
    cache$6.set(type, key, val);
    return val;
  }

  /**
   * Expose compiler, parser and cache on `micromatch`
   */

  micromatch.compilers = compilers$4;
  micromatch.parsers = parsers$4;
  micromatch.caches = cache$6.caches;

  /**
   * Expose `micromatch`
   * @type {Function}
   */

  var micromatch_1 = micromatch;

  var pattern = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });




  var GLOBSTAR = '**';
  /**
   * Return true for static pattern.
   */
  function isStaticPattern(pattern) {
      return !isDynamicPattern(pattern);
  }
  exports.isStaticPattern = isStaticPattern;
  /**
   * Return true for pattern that looks like glob.
   */
  function isDynamicPattern(pattern) {
      return isGlob$1(pattern);
  }
  exports.isDynamicPattern = isDynamicPattern;
  /**
   * Convert a windows «path» to a unix-style «path».
   */
  function unixifyPattern(pattern) {
      return pattern.replace(/\\/g, '/');
  }
  exports.unixifyPattern = unixifyPattern;
  /**
   * Returns negative pattern as positive pattern.
   */
  function convertToPositivePattern(pattern) {
      return isNegativePattern(pattern) ? pattern.slice(1) : pattern;
  }
  exports.convertToPositivePattern = convertToPositivePattern;
  /**
   * Returns positive pattern as negative pattern.
   */
  function convertToNegativePattern(pattern) {
      return '!' + pattern;
  }
  exports.convertToNegativePattern = convertToNegativePattern;
  /**
   * Return true if provided pattern is negative pattern.
   */
  function isNegativePattern(pattern) {
      return pattern.startsWith('!') && pattern[1] !== '(';
  }
  exports.isNegativePattern = isNegativePattern;
  /**
   * Return true if provided pattern is positive pattern.
   */
  function isPositivePattern(pattern) {
      return !isNegativePattern(pattern);
  }
  exports.isPositivePattern = isPositivePattern;
  /**
   * Extracts negative patterns from array of patterns.
   */
  function getNegativePatterns(patterns) {
      return patterns.filter(isNegativePattern);
  }
  exports.getNegativePatterns = getNegativePatterns;
  /**
   * Extracts positive patterns from array of patterns.
   */
  function getPositivePatterns(patterns) {
      return patterns.filter(isPositivePattern);
  }
  exports.getPositivePatterns = getPositivePatterns;
  /**
   * Extract base directory from provided pattern.
   */
  function getBaseDirectory(pattern) {
      return globParent(pattern);
  }
  exports.getBaseDirectory = getBaseDirectory;
  /**
   * Return true if provided pattern has globstar.
   */
  function hasGlobStar(pattern) {
      return pattern.indexOf(GLOBSTAR) !== -1;
  }
  exports.hasGlobStar = hasGlobStar;
  /**
   * Return true if provided pattern ends with slash and globstar.
   */
  function endsWithSlashGlobStar(pattern) {
      return pattern.endsWith('/' + GLOBSTAR);
  }
  exports.endsWithSlashGlobStar = endsWithSlashGlobStar;
  /**
   * Returns «true» when pattern ends with a slash and globstar or the last partial of the pattern is static pattern.
   */
  function isAffectDepthOfReadingPattern(pattern) {
      var basename = path.basename(pattern);
      return endsWithSlashGlobStar(pattern) || isStaticPattern(basename);
  }
  exports.isAffectDepthOfReadingPattern = isAffectDepthOfReadingPattern;
  /**
   * Return naive depth of provided pattern without depth of the base directory.
   */
  function getNaiveDepth(pattern) {
      var base = getBaseDirectory(pattern);
      var patternDepth = pattern.split('/').length;
      var patternBaseDepth = base.split('/').length;
      /**
       * This is a hack for pattern that has no base directory.
       *
       * This is related to the `*\something\*` pattern.
       */
      if (base === '.') {
          return patternDepth - patternBaseDepth;
      }
      return patternDepth - patternBaseDepth - 1;
  }
  exports.getNaiveDepth = getNaiveDepth;
  /**
   * Return max naive depth of provided patterns without depth of the base directory.
   */
  function getMaxNaivePatternsDepth(patterns) {
      return patterns.reduce(function (max, pattern) {
          var depth = getNaiveDepth(pattern);
          return depth > max ? depth : max;
      }, 0);
  }
  exports.getMaxNaivePatternsDepth = getMaxNaivePatternsDepth;
  /**
   * Make RegExp for provided pattern.
   */
  function makeRe(pattern, options) {
      return micromatch_1.makeRe(pattern, options);
  }
  exports.makeRe = makeRe;
  /**
   * Convert patterns to regexps.
   */
  function convertPatternsToRe(patterns, options) {
      return patterns.map(function (pattern) { return makeRe(pattern, options); });
  }
  exports.convertPatternsToRe = convertPatternsToRe;
  /**
   * Returns true if the entry match any of the given RegExp's.
   */
  function matchAny(entry, patternsRe) {
      return patternsRe.some(function (patternRe) { return patternRe.test(entry); });
  }
  exports.matchAny = matchAny;
  });

  unwrapExports(pattern);
  var pattern_1 = pattern.isStaticPattern;
  var pattern_2 = pattern.isDynamicPattern;
  var pattern_3 = pattern.unixifyPattern;
  var pattern_4 = pattern.convertToPositivePattern;
  var pattern_5 = pattern.convertToNegativePattern;
  var pattern_6 = pattern.isNegativePattern;
  var pattern_7 = pattern.isPositivePattern;
  var pattern_8 = pattern.getNegativePatterns;
  var pattern_9 = pattern.getPositivePatterns;
  var pattern_10 = pattern.getBaseDirectory;
  var pattern_11 = pattern.hasGlobStar;
  var pattern_12 = pattern.endsWithSlashGlobStar;
  var pattern_13 = pattern.isAffectDepthOfReadingPattern;
  var pattern_14 = pattern.getNaiveDepth;
  var pattern_15 = pattern.getMaxNaivePatternsDepth;
  var pattern_16 = pattern.makeRe;
  var pattern_17 = pattern.convertPatternsToRe;
  var pattern_18 = pattern.matchAny;

  var tasks = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  /**
   * Generate tasks based on parent directory of each pattern.
   */
  function generate(patterns, options) {
      var unixPatterns = patterns.map(pattern.unixifyPattern);
      var unixIgnore = options.ignore.map(pattern.unixifyPattern);
      var positivePatterns = getPositivePatterns(unixPatterns);
      var negativePatterns = getNegativePatternsAsPositive(unixPatterns, unixIgnore);
      var staticPatterns = positivePatterns.filter(pattern.isStaticPattern);
      var dynamicPatterns = positivePatterns.filter(pattern.isDynamicPattern);
      var staticTasks = convertPatternsToTasks(staticPatterns, negativePatterns, /* dynamic */ false);
      var dynamicTasks = convertPatternsToTasks(dynamicPatterns, negativePatterns, /* dynamic */ true);
      return staticTasks.concat(dynamicTasks);
  }
  exports.generate = generate;
  /**
   * Convert patterns to tasks based on parent directory of each pattern.
   */
  function convertPatternsToTasks(positive, negative, dynamic) {
      var positivePatternsGroup = groupPatternsByBaseDirectory(positive);
      // When we have a global group – there is no reason to divide the patterns into independent tasks.
      // In this case, the global task covers the rest.
      if ('.' in positivePatternsGroup) {
          var task = convertPatternGroupToTask('.', positive, negative, dynamic);
          return [task];
      }
      return convertPatternGroupsToTasks(positivePatternsGroup, negative, dynamic);
  }
  exports.convertPatternsToTasks = convertPatternsToTasks;
  /**
   * Return only positive patterns.
   */
  function getPositivePatterns(patterns) {
      return pattern.getPositivePatterns(patterns);
  }
  exports.getPositivePatterns = getPositivePatterns;
  /**
   * Return only negative patterns.
   */
  function getNegativePatternsAsPositive(patterns, ignore) {
      var negative = pattern.getNegativePatterns(patterns).concat(ignore);
      var positive = negative.map(pattern.convertToPositivePattern);
      return positive;
  }
  exports.getNegativePatternsAsPositive = getNegativePatternsAsPositive;
  /**
   * Group patterns by base directory of each pattern.
   */
  function groupPatternsByBaseDirectory(patterns) {
      return patterns.reduce(function (collection, pattern$$1) {
          var base = pattern.getBaseDirectory(pattern$$1);
          if (base in collection) {
              collection[base].push(pattern$$1);
          }
          else {
              collection[base] = [pattern$$1];
          }
          return collection;
      }, {});
  }
  exports.groupPatternsByBaseDirectory = groupPatternsByBaseDirectory;
  /**
   * Convert group of patterns to tasks.
   */
  function convertPatternGroupsToTasks(positive, negative, dynamic) {
      return Object.keys(positive).map(function (base) {
          return convertPatternGroupToTask(base, positive[base], negative, dynamic);
      });
  }
  exports.convertPatternGroupsToTasks = convertPatternGroupsToTasks;
  /**
   * Create a task for positive and negative patterns.
   */
  function convertPatternGroupToTask(base, positive, negative, dynamic) {
      return {
          base: base,
          dynamic: dynamic,
          patterns: [].concat(positive, negative.map(pattern.convertToNegativePattern)),
          positive: positive,
          negative: negative
      };
  }
  exports.convertPatternGroupToTask = convertPatternGroupToTask;
  });

  unwrapExports(tasks);
  var tasks_1 = tasks.generate;
  var tasks_2 = tasks.convertPatternsToTasks;
  var tasks_3 = tasks.getPositivePatterns;
  var tasks_4 = tasks.getNegativePatternsAsPositive;
  var tasks_5 = tasks.groupPatternsByBaseDirectory;
  var tasks_6 = tasks.convertPatternGroupsToTasks;
  var tasks_7 = tasks.convertPatternGroupToTask;

  var globToRegexp = function (glob, opts) {
    if (typeof glob !== 'string') {
      throw new TypeError('Expected a string');
    }

    var str = String(glob);

    // The regexp we are building, as a string.
    var reStr = "";

    // Whether we are matching so called "extended" globs (like bash) and should
    // support single character matching, matching ranges of characters, group
    // matching, etc.
    var extended = opts ? !!opts.extended : false;

    // When globstar is _false_ (default), '/foo/*' is translated a regexp like
    // '^\/foo\/.*$' which will match any string beginning with '/foo/'
    // When globstar is _true_, '/foo/*' is translated to regexp like
    // '^\/foo\/[^/]*$' which will match any string beginning with '/foo/' BUT
    // which does not have a '/' to the right of it.
    // E.g. with '/foo/*' these will match: '/foo/bar', '/foo/bar.txt' but
    // these will not '/foo/bar/baz', '/foo/bar/baz.txt'
    // Lastely, when globstar is _true_, '/foo/**' is equivelant to '/foo/*' when
    // globstar is _false_
    var globstar = opts ? !!opts.globstar : false;

    // If we are doing extended matching, this boolean is true when we are inside
    // a group (eg {*.html,*.js}), and false otherwise.
    var inGroup = false;

    // RegExp flags (eg "i" ) to pass in to RegExp constructor.
    var flags = opts && typeof( opts.flags ) === "string" ? opts.flags : "";

    var c;
    for (var i = 0, len = str.length; i < len; i++) {
      c = str[i];

      switch (c) {
      case "\\":
      case "/":
      case "$":
      case "^":
      case "+":
      case ".":
      case "(":
      case ")":
      case "=":
      case "!":
      case "|":
        reStr += "\\" + c;
        break;

      case "?":
        if (extended) {
          reStr += ".";
  	    break;
        }

      case "[":
      case "]":
        if (extended) {
          reStr += c;
  	    break;
        }

      case "{":
        if (extended) {
          inGroup = true;
  	    reStr += "(";
  	    break;
        }

      case "}":
        if (extended) {
          inGroup = false;
  	    reStr += ")";
  	    break;
        }

      case ",":
        if (inGroup) {
          reStr += "|";
  	    break;
        }
        reStr += "\\" + c;
        break;

      case "*":
        // Move over all consecutive "*"'s.
        // Also store the previous and next characters
        var prevChar = str[i - 1];
        var starCount = 1;
        while(str[i + 1] === "*") {
          starCount++;
          i++;
        }
        var nextChar = str[i + 1];

        if (!globstar) {
          // globstar is disabled, so treat any number of "*" as one
          reStr += ".*";
        } else {
          // globstar is enabled, so determine if this is a globstar segment
          var isGlobstar = starCount > 1                      // multiple "*"'s
            && (prevChar === "/" || prevChar === undefined)   // from the start of the segment
            && (nextChar === "/" || nextChar === undefined);   // to the end of the segment

          if (isGlobstar) {
            // it's a globstar, so match zero or more path segments
            reStr += "(?:[^/]*(?:\/|$))*";
            i++; // move over the "/"
          } else {
            // it's not a globstar, so only match one path segment
            reStr += "[^/]*";
          }
        }
        break;

      default:
        reStr += c;
      }
    }

    // When regexp 'g' flag is specified don't
    // constrain the regular expression with ^ & $
    if (!flags || !~flags.indexOf('g')) {
      reStr = "^" + reStr + "$";
    }

    return new RegExp(reStr, flags);
  };

  var normalizeOptions_1 = normalizeOptions;

  let isWindows$1 = /^win/.test(process.platform);

  /**
   * @typedef {Object} FSFacade
   * @property {fs.readdir} readdir
   * @property {fs.stat} stat
   * @property {fs.lstat} lstat
   */

  /**
   * Validates and normalizes the options argument
   *
   * @param {object} [options] - User-specified options, if any
   * @param {object} internalOptions - Internal options that aren't part of the public API
   *
   * @param {number|boolean|function} [options.deep]
   * The number of directories to recursively traverse. Any falsy value or negative number will
   * default to zero, so only the top-level contents will be returned. Set to `true` or `Infinity`
   * to traverse all subdirectories.  Or provide a function that accepts a {@link fs.Stats} object
   * and returns a truthy value if the directory's contents should be crawled.
   *
   * @param {function|string|RegExp} [options.filter]
   * A function that accepts a {@link fs.Stats} object and returns a truthy value if the data should
   * be returned.  Or a RegExp or glob string pattern, to filter by file name.
   *
   * @param {string} [options.sep]
   * The path separator to use. By default, the OS-specific separator will be used, but this can be
   * set to a specific value to ensure consistency across platforms.
   *
   * @param {string} [options.basePath]
   * The base path to prepend to each result. If empty, then all results will be relative to `dir`.
   *
   * @param {FSFacade} [options.fs]
   * Synchronous or asynchronous facades for Node.js File System module
   *
   * @param {object} [internalOptions.facade]
   * Synchronous or asynchronous facades for various methods, including for the Node.js File System module
   *
   * @param {boolean} [internalOptions.emit]
   * Indicates whether the reader should emit "file", "directory", and "symlink" events
   *
   * @param {boolean} [internalOptions.stats]
   * Indicates whether the reader should emit {@link fs.Stats} objects instead of path strings
   *
   * @returns {object}
   */
  function normalizeOptions (options, internalOptions) {
    if (options === null || options === undefined) {
      options = {};
    }
    else if (typeof options !== 'object') {
      throw new TypeError('options must be an object');
    }

    let recurseDepth, recurseFn, recurseRegExp, recurseGlob, deep = options.deep;
    if (deep === null || deep === undefined) {
      recurseDepth = 0;
    }
    else if (typeof deep === 'boolean') {
      recurseDepth = deep ? Infinity : 0;
    }
    else if (typeof deep === 'number') {
      if (deep < 0 || isNaN(deep)) {
        throw new Error('options.deep must be a positive number');
      }
      else if (Math.floor(deep) !== deep) {
        throw new Error('options.deep must be an integer');
      }
      else {
        recurseDepth = deep;
      }
    }
    else if (typeof deep === 'function') {
      recurseDepth = Infinity;
      recurseFn = deep;
    }
    else if (deep instanceof RegExp) {
      recurseDepth = Infinity;
      recurseRegExp = deep;
    }
    else if (typeof deep === 'string' && deep.length > 0) {
      recurseDepth = Infinity;
      recurseGlob = globToRegexp(deep, { extended: true, globstar: true });
    }
    else {
      throw new TypeError('options.deep must be a boolean, number, function, regular expression, or glob pattern');
    }

    let filterFn, filterRegExp, filterGlob, filter = options.filter;
    if (filter !== null && filter !== undefined) {
      if (typeof filter === 'function') {
        filterFn = filter;
      }
      else if (filter instanceof RegExp) {
        filterRegExp = filter;
      }
      else if (typeof filter === 'string' && filter.length > 0) {
        filterGlob = globToRegexp(filter, { extended: true, globstar: true });
      }
      else {
        throw new TypeError('options.filter must be a function, regular expression, or glob pattern');
      }
    }

    let sep = options.sep;
    if (sep === null || sep === undefined) {
      sep = path.sep;
    }
    else if (typeof sep !== 'string') {
      throw new TypeError('options.sep must be a string');
    }

    let basePath = options.basePath;
    if (basePath === null || basePath === undefined) {
      basePath = '';
    }
    else if (typeof basePath === 'string') {
      // Append a path separator to the basePath, if necessary
      if (basePath && basePath.substr(-1) !== sep) {
        basePath += sep;
      }
    }
    else {
      throw new TypeError('options.basePath must be a string');
    }

    // Convert the basePath to POSIX (forward slashes)
    // so that glob pattern matching works consistently, even on Windows
    let posixBasePath = basePath;
    if (posixBasePath && sep !== '/') {
      posixBasePath = posixBasePath.replace(new RegExp('\\' + sep, 'g'), '/');

      /* istanbul ignore if */
      if (isWindows$1) {
        // Convert Windows root paths (C:\) and UNCs (\\) to POSIX root paths
        posixBasePath = posixBasePath.replace(/^([a-zA-Z]\:\/|\/\/)/, '/');
      }
    }

    // Determine which facade methods to use
    let facade;
    if (options.fs === null || options.fs === undefined) {
      // The user didn't provide their own facades, so use our internal ones
      facade = internalOptions.facade;
    }
    else if (typeof options.fs === 'object') {
      // Merge the internal facade methods with the user-provided `fs` facades
      facade = Object.assign({}, internalOptions.facade);
      facade.fs = Object.assign({}, internalOptions.facade.fs, options.fs);
    }
    else {
      throw new TypeError('options.fs must be an object');
    }

    return {
      recurseDepth,
      recurseFn,
      recurseRegExp,
      recurseGlob,
      filterFn,
      filterRegExp,
      filterGlob,
      sep,
      basePath,
      posixBasePath,
      facade,
      emit: !!internalOptions.emit,
      stats: !!internalOptions.stats,
    };
  }

  var call_1 = createCommonjsModule(function (module) {

  let call = module.exports = {
    safe: safeCall,
    once: callOnce,
  };

  /**
   * Calls a function with the given arguments, and ensures that the error-first callback is _always_
   * invoked exactly once, even if the function throws an error.
   *
   * @param {function} fn - The function to invoke
   * @param {...*} args - The arguments to pass to the function. The final argument must be a callback function.
   */
  function safeCall (fn, args) {
    // Get the function arguments as an array
    args = Array.prototype.slice.call(arguments, 1);

    // Replace the callback function with a wrapper that ensures it will only be called once
    let callback = call.once(args.pop());
    args.push(callback);

    try {
      fn.apply(null, args);
    }
    catch (err) {
      callback(err);
    }
  }

  /**
   * Returns a wrapper function that ensures the given callback function is only called once.
   * Subsequent calls are ignored, unless the first argument is an Error, in which case the
   * error is thrown.
   *
   * @param {function} fn - The function that should only be called once
   * @returns {function}
   */
  function callOnce (fn) {
    let fulfilled = false;

    return function onceWrapper (err) {
      if (!fulfilled) {
        fulfilled = true;
        return fn.apply(this, arguments);
      }
      else if (err) {
        // The callback has already been called, but now an error has occurred
        // (most likely inside the callback function). So re-throw the error,
        // so it gets handled further up the call stack
        throw err;
      }
    };
  }
  });
  var call_2 = call_1.safe;
  var call_3 = call_1.once;

  var stat_1 = stat;

  /**
   * Retrieves the {@link fs.Stats} for the given path. If the path is a symbolic link,
   * then the Stats of the symlink's target are returned instead.  If the symlink is broken,
   * then the Stats of the symlink itself are returned.
   *
   * @param {object} fs - Synchronous or Asynchronouse facade for the "fs" module
   * @param {string} path - The path to return stats for
   * @param {function} callback
   */
  function stat (fs$$1, path$$1, callback) {
    let isSymLink = false;

    call_1.safe(fs$$1.lstat, path$$1, (err, lstats) => {
      if (err) {
        // fs.lstat threw an eror
        return callback(err);
      }

      try {
        isSymLink = lstats.isSymbolicLink();
      }
      catch (err2) {
        // lstats.isSymbolicLink() threw an error
        // (probably because fs.lstat returned an invalid result)
        return callback(err2);
      }

      if (isSymLink) {
        // Try to resolve the symlink
        symlinkStat(fs$$1, path$$1, lstats, callback);
      }
      else {
        // It's not a symlink, so return the stats as-is
        callback(null, lstats);
      }
    });
  }

  /**
   * Retrieves the {@link fs.Stats} for the target of the given symlink.
   * If the symlink is broken, then the Stats of the symlink itself are returned.
   *
   * @param {object} fs - Synchronous or Asynchronouse facade for the "fs" module
   * @param {string} path - The path of the symlink to return stats for
   * @param {object} lstats - The stats of the symlink
   * @param {function} callback
   */
  function symlinkStat (fs$$1, path$$1, lstats, callback) {
    call_1.safe(fs$$1.stat, path$$1, (err, stats) => {
      if (err) {
        // The symlink is broken, so return the stats for the link itself
        return callback(null, lstats);
      }

      try {
        // Return the stats for the resolved symlink target,
        // and override the `isSymbolicLink` method to indicate that it's a symlink
        stats.isSymbolicLink = () => true;
      }
      catch (err2) {
        // Setting stats.isSymbolicLink threw an error
        // (probably because fs.stat returned an invalid result)
        return callback(err2);
      }

      callback(null, stats);
    });
  }

  const Readable = stream.Readable;
  const EventEmitter = events.EventEmitter;





  /**
   * Asynchronously reads the contents of a directory and streams the results
   * via a {@link stream.Readable}.
   */
  class DirectoryReader {
    /**
     * @param {string} dir - The absolute or relative directory path to read
     * @param {object} [options] - User-specified options, if any (see {@link normalizeOptions})
     * @param {object} internalOptions - Internal options that aren't part of the public API
     * @class
     */
    constructor (dir, options, internalOptions) {
      this.options = options = normalizeOptions_1(options, internalOptions);

      // Indicates whether we should keep reading
      // This is set false if stream.Readable.push() returns false.
      this.shouldRead = true;

      // The directories to read
      // (initialized with the top-level directory)
      this.queue = [{
        path: dir,
        basePath: options.basePath,
        posixBasePath: options.posixBasePath,
        depth: 0
      }];

      // The number of directories that are currently being processed
      this.pending = 0;

      // The data that has been read, but not yet emitted
      this.buffer = [];

      this.stream = new Readable({ objectMode: true });
      this.stream._read = () => {
        // Start (or resume) reading
        this.shouldRead = true;

        // If we have data in the buffer, then send the next chunk
        if (this.buffer.length > 0) {
          this.pushFromBuffer();
        }

        // If we have directories queued, then start processing the next one
        if (this.queue.length > 0) {
          if (this.options.facade.sync) {
            while (this.queue.length > 0) {
              this.readNextDirectory();
            }
          }
          else {
            this.readNextDirectory();
          }
        }

        this.checkForEOF();
      };
    }

    /**
     * Reads the next directory in the queue
     */
    readNextDirectory () {
      let facade = this.options.facade;
      let dir = this.queue.shift();
      this.pending++;

      // Read the directory listing
      call_1.safe(facade.fs.readdir, dir.path, (err, items) => {
        if (err) {
          // fs.readdir threw an error
          this.emit('error', err);
          return this.finishedReadingDirectory();
        }

        try {
          // Process each item in the directory (simultaneously, if async)
          facade.forEach(
            items,
            this.processItem.bind(this, dir),
            this.finishedReadingDirectory.bind(this, dir)
          );
        }
        catch (err2) {
          // facade.forEach threw an error
          // (probably because fs.readdir returned an invalid result)
          this.emit('error', err2);
          this.finishedReadingDirectory();
        }
      });
    }

    /**
     * This method is called after all items in a directory have been processed.
     *
     * NOTE: This does not necessarily mean that the reader is finished, since there may still
     * be other directories queued or pending.
     */
    finishedReadingDirectory () {
      this.pending--;

      if (this.shouldRead) {
        // If we have directories queued, then start processing the next one
        if (this.queue.length > 0 && this.options.facade.async) {
          this.readNextDirectory();
        }

        this.checkForEOF();
      }
    }

    /**
     * Determines whether the reader has finished processing all items in all directories.
     * If so, then the "end" event is fired (via {@Readable#push})
     */
    checkForEOF () {
      if (this.buffer.length === 0 &&   // The stuff we've already read
      this.pending === 0 &&             // The stuff we're currently reading
      this.queue.length === 0) {        // The stuff we haven't read yet
        // There's no more stuff!
        this.stream.push(null);
      }
    }

    /**
     * Processes a single item in a directory.
     *
     * If the item is a directory, and `option.deep` is enabled, then the item will be added
     * to the directory queue.
     *
     * If the item meets the filter criteria, then it will be emitted to the reader's stream.
     *
     * @param {object} dir - A directory object from the queue
     * @param {string} item - The name of the item (name only, no path)
     * @param {function} done - A callback function that is called after the item has been processed
     */
    processItem (dir, item, done) {
      let stream$$1 = this.stream;
      let options = this.options;

      let itemPath = dir.basePath + item;
      let posixPath = dir.posixBasePath + item;
      let fullPath = path.join(dir.path, item);

      // If `options.deep` is a number, and we've already recursed to the max depth,
      // then there's no need to check fs.Stats to know if it's a directory.
      // If `options.deep` is a function, then we'll need fs.Stats
      let maxDepthReached = dir.depth >= options.recurseDepth;

      // Do we need to call `fs.stat`?
      let needStats =
        !maxDepthReached ||                                 // we need the fs.Stats to know if it's a directory
        options.stats ||                                    // the user wants fs.Stats objects returned
        options.recurseFn ||                                // we need fs.Stats for the recurse function
        options.filterFn ||                                 // we need fs.Stats for the filter function
        EventEmitter.listenerCount(stream$$1, 'file') ||       // we need the fs.Stats to know if it's a file
        EventEmitter.listenerCount(stream$$1, 'directory') ||  // we need the fs.Stats to know if it's a directory
        EventEmitter.listenerCount(stream$$1, 'symlink');      // we need the fs.Stats to know if it's a symlink

      // If we don't need stats, then exit early
      if (!needStats) {
        if (this.filter(itemPath, posixPath)) {
          this.pushOrBuffer({ data: itemPath });
        }
        return done();
      }

      // Get the fs.Stats object for this path
      stat_1(options.facade.fs, fullPath, (err, stats) => {
        if (err) {
          // fs.stat threw an error
          this.emit('error', err);
          return done();
        }

        try {
          // Add the item's path to the fs.Stats object
          // The base of this path, and its separators are determined by the options
          // (i.e. options.basePath and options.sep)
          stats.path = itemPath;

          // Add depth of the path to the fs.Stats object for use this in the filter function
          stats.depth = dir.depth;

          if (this.shouldRecurse(stats, posixPath, maxDepthReached)) {
            // Add this subdirectory to the queue
            this.queue.push({
              path: fullPath,
              basePath: itemPath + options.sep,
              posixBasePath: posixPath + '/',
              depth: dir.depth + 1,
            });
          }

          // Determine whether this item matches the filter criteria
          if (this.filter(stats, posixPath)) {
            this.pushOrBuffer({
              data: options.stats ? stats : itemPath,
              file: stats.isFile(),
              directory: stats.isDirectory(),
              symlink: stats.isSymbolicLink(),
            });
          }

          done();
        }
        catch (err2) {
          // An error occurred while processing the item
          // (probably during a user-specified function, such as options.deep, options.filter, etc.)
          this.emit('error', err2);
          done();
        }
      });
    }

    /**
     * Pushes the given chunk of data to the stream, or adds it to the buffer,
     * depending on the state of the stream.
     *
     * @param {object} chunk
     */
    pushOrBuffer (chunk) {
      // Add the chunk to the buffer
      this.buffer.push(chunk);

      // If we're still reading, then immediately emit the next chunk in the buffer
      // (which may or may not be the chunk that we just added)
      if (this.shouldRead) {
        this.pushFromBuffer();
      }
    }

    /**
     * Immediately pushes the next chunk in the buffer to the reader's stream.
     * The "data" event will always be fired (via {@link Readable#push}).
     * In addition, the "file", "directory", and/or "symlink" events may be fired,
     * depending on the type of properties of the chunk.
     */
    pushFromBuffer () {
      let stream$$1 = this.stream;
      let chunk = this.buffer.shift();

      // Stream the data
      try {
        this.shouldRead = stream$$1.push(chunk.data);
      }
      catch (err) {
        this.emit('error', err);
      }

      // Also emit specific events, based on the type of chunk
      chunk.file && this.emit('file', chunk.data);
      chunk.symlink && this.emit('symlink', chunk.data);
      chunk.directory && this.emit('directory', chunk.data);
    }

    /**
     * Determines whether the given directory meets the user-specified recursion criteria.
     * If the user didn't specify recursion criteria, then this function will default to true.
     *
     * @param {fs.Stats} stats - The directory's {@link fs.Stats} object
     * @param {string} posixPath - The item's POSIX path (used for glob matching)
     * @param {boolean} maxDepthReached - Whether we've already crawled the user-specified depth
     * @returns {boolean}
     */
    shouldRecurse (stats, posixPath, maxDepthReached) {
      let options = this.options;

      if (maxDepthReached) {
        // We've already crawled to the maximum depth. So no more recursion.
        return false;
      }
      else if (!stats.isDirectory()) {
        // It's not a directory. So don't try to crawl it.
        return false;
      }
      else if (options.recurseGlob) {
        // Glob patterns are always tested against the POSIX path, even on Windows
        // https://github.com/isaacs/node-glob#windows
        return options.recurseGlob.test(posixPath);
      }
      else if (options.recurseRegExp) {
        // Regular expressions are tested against the normal path
        // (based on the OS or options.sep)
        return options.recurseRegExp.test(stats.path);
      }
      else if (options.recurseFn) {
        try {
          // Run the user-specified recursion criteria
          return options.recurseFn.call(null, stats);
        }
        catch (err) {
          // An error occurred in the user's code.
          // In Sync and Async modes, this will return an error.
          // In Streaming mode, we emit an "error" event, but continue processing
          this.emit('error', err);
        }
      }
      else {
        // No recursion function was specified, and we're within the maximum depth.
        // So crawl this directory.
        return true;
      }
    }

    /**
     * Determines whether the given item meets the user-specified filter criteria.
     * If the user didn't specify a filter, then this function will always return true.
     *
     * @param {string|fs.Stats} value - Either the item's path, or the item's {@link fs.Stats} object
     * @param {string} posixPath - The item's POSIX path (used for glob matching)
     * @returns {boolean}
     */
    filter (value, posixPath) {
      let options = this.options;

      if (options.filterGlob) {
        // Glob patterns are always tested against the POSIX path, even on Windows
        // https://github.com/isaacs/node-glob#windows
        return options.filterGlob.test(posixPath);
      }
      else if (options.filterRegExp) {
        // Regular expressions are tested against the normal path
        // (based on the OS or options.sep)
        return options.filterRegExp.test(value.path || value);
      }
      else if (options.filterFn) {
        try {
          // Run the user-specified filter function
          return options.filterFn.call(null, value);
        }
        catch (err) {
          // An error occurred in the user's code.
          // In Sync and Async modes, this will return an error.
          // In Streaming mode, we emit an "error" event, but continue processing
          this.emit('error', err);
        }
      }
      else {
        // No filter was specified, so match everything
        return true;
      }
    }

    /**
     * Emits an event.  If one of the event listeners throws an error,
     * then an "error" event is emitted.
     *
     * @param {string} eventName
     * @param {*} data
     */
    emit (eventName, data) {
      let stream$$1 = this.stream;

      try {
        stream$$1.emit(eventName, data);
      }
      catch (err) {
        if (eventName === 'error') {
          // Don't recursively emit "error" events.
          // If the first one fails, then just throw
          throw err;
        }
        else {
          stream$$1.emit('error', err);
        }
      }
    }
  }

  var directoryReader = DirectoryReader;

  /**
   * A facade around {@link fs.readdirSync} that allows it to be called
   * the same way as {@link fs.readdir}.
   *
   * @param {string} dir
   * @param {function} callback
   */
  var readdir = function (dir, callback) {
    // Make sure the callback is only called once
    callback = call_1.once(callback);

    try {
      let items = fs__default.readdirSync(dir);
      callback(null, items);
    }
    catch (err) {
      callback(err);
    }
  };

  /**
   * A facade around {@link fs.statSync} that allows it to be called
   * the same way as {@link fs.stat}.
   *
   * @param {string} path
   * @param {function} callback
   */
  var stat$1 = function (path$$1, callback) {
    // Make sure the callback is only called once
    callback = call_1.once(callback);

    try {
      let stats = fs__default.statSync(path$$1);
      callback(null, stats);
    }
    catch (err) {
      callback(err);
    }
  };

  /**
   * A facade around {@link fs.lstatSync} that allows it to be called
   * the same way as {@link fs.lstat}.
   *
   * @param {string} path
   * @param {function} callback
   */
  var lstat = function (path$$1, callback) {
    // Make sure the callback is only called once
    callback = call_1.once(callback);

    try {
      let stats = fs__default.lstatSync(path$$1);
      callback(null, stats);
    }
    catch (err) {
      callback(err);
    }
  };

  var fs_1 = {
  	readdir: readdir,
  	stat: stat$1,
  	lstat: lstat
  };

  var forEach = syncForEach;

  /**
   * A facade that allows {@link Array.forEach} to be called as though it were asynchronous.
   *
   * @param {array} array - The array to iterate over
   * @param {function} iterator - The function to call for each item in the array
   * @param {function} done - The function to call when all iterators have completed
   */
  function syncForEach (array, iterator, done) {
    array.forEach(item => {
      iterator(item, () => {
        // Note: No error-handling here because this is currently only ever called
        // by DirectoryReader, which never passes an `error` parameter to the callback.
        // Instead, DirectoryReader emits an "error" event if an error occurs.
      });
    });

    done();
  }

  var sync = readdirSync;



  let syncFacade = {
    fs: fs_1,
    forEach: forEach,
    sync: true
  };

  /**
   * Returns the buffered output from a synchronous {@link DirectoryReader}.
   *
   * @param {string} dir
   * @param {object} [options]
   * @param {object} internalOptions
   */
  function readdirSync (dir, options, internalOptions) {
    internalOptions.facade = syncFacade;

    let reader = new directoryReader(dir, options, internalOptions);
    let stream$$1 = reader.stream;

    let results = [];
    let data = stream$$1.read();
    while (data !== null) {
      results.push(data);
      data = stream$$1.read();
    }

    return results;
  }

  var next = (commonjsGlobal.process && process.nextTick) || commonjsGlobal.setImmediate || function (f) {
    setTimeout(f, 0);
  };

  var callMeMaybe = function maybe (cb, promise) {
    if (cb) {
      promise
        .then(function (result) {
          next(function () { cb(null, result); });
        }, function (err) {
          next(function () { cb(err); });
        });
      return undefined
    }
    else {
      return promise
    }
  };

  var forEach$1 = asyncForEach;

  /**
   * Simultaneously processes all items in the given array.
   *
   * @param {array} array - The array to iterate over
   * @param {function} iterator - The function to call for each item in the array
   * @param {function} done - The function to call when all iterators have completed
   */
  function asyncForEach (array, iterator, done) {
    if (array.length === 0) {
      // NOTE: Normally a bad idea to mix sync and async, but it's safe here because
      // of the way that this method is currently used by DirectoryReader.
      done();
      return;
    }

    // Simultaneously process all items in the array.
    let pending = array.length;
    array.forEach(item => {
      iterator(item, () => {
        if (--pending === 0) {
          done();
        }
      });
    });
  }

  var async = readdirAsync;




  let asyncFacade = {
    fs: fs__default,
    forEach: forEach$1,
    async: true
  };

  /**
   * Returns the buffered output from an asynchronous {@link DirectoryReader},
   * via an error-first callback or a {@link Promise}.
   *
   * @param {string} dir
   * @param {object} [options]
   * @param {function} [callback]
   * @param {object} internalOptions
   */
  function readdirAsync (dir, options, callback, internalOptions) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }

    return callMeMaybe(callback, new Promise(((resolve, reject) => {
      let results = [];

      internalOptions.facade = asyncFacade;

      let reader = new directoryReader(dir, options, internalOptions);
      let stream$$1 = reader.stream;

      stream$$1.on('error', err => {
        reject(err);
        stream$$1.pause();
      });
      stream$$1.on('data', result => {
        results.push(result);
      });
      stream$$1.on('end', () => {
        resolve(results);
      });
    })));
  }

  var stream$1 = readdirStream;



  let streamFacade = {
    fs: fs__default,
    forEach: forEach$1,
    async: true
  };

  /**
   * Returns the {@link stream.Readable} of an asynchronous {@link DirectoryReader}.
   *
   * @param {string} dir
   * @param {object} [options]
   * @param {object} internalOptions
   */
  function readdirStream (dir, options, internalOptions) {
    internalOptions.facade = streamFacade;

    let reader = new directoryReader(dir, options, internalOptions);
    return reader.stream;
  }

  var lib$1 = createCommonjsModule(function (module, exports) {





  module.exports = exports = readdirAsyncPath;
  exports.readdir = exports.readdirAsync = exports.async = readdirAsyncPath;
  exports.readdirAsyncStat = exports.async.stat = readdirAsyncStat;
  exports.readdirStream = exports.stream = readdirStreamPath;
  exports.readdirStreamStat = exports.stream.stat = readdirStreamStat;
  exports.readdirSync = exports.sync = readdirSyncPath;
  exports.readdirSyncStat = exports.sync.stat = readdirSyncStat;

  /**
   * Synchronous readdir that returns an array of string paths.
   *
   * @param {string} dir
   * @param {object} [options]
   * @returns {string[]}
   */
  function readdirSyncPath (dir, options) {
    return sync(dir, options, {});
  }

  /**
   * Synchronous readdir that returns results as an array of {@link fs.Stats} objects
   *
   * @param {string} dir
   * @param {object} [options]
   * @returns {fs.Stats[]}
   */
  function readdirSyncStat (dir, options) {
    return sync(dir, options, { stats: true });
  }

  /**
   * Aynchronous readdir (accepts an error-first callback or returns a {@link Promise}).
   * Results are an array of path strings.
   *
   * @param {string} dir
   * @param {object} [options]
   * @param {function} [callback]
   * @returns {Promise<string[]>}
   */
  function readdirAsyncPath (dir, options, callback) {
    return async(dir, options, callback, {});
  }

  /**
   * Aynchronous readdir (accepts an error-first callback or returns a {@link Promise}).
   * Results are an array of {@link fs.Stats} objects.
   *
   * @param {string} dir
   * @param {object} [options]
   * @param {function} [callback]
   * @returns {Promise<fs.Stats[]>}
   */
  function readdirAsyncStat (dir, options, callback) {
    return async(dir, options, callback, { stats: true });
  }

  /**
   * Aynchronous readdir that returns a {@link stream.Readable} (which is also an {@link EventEmitter}).
   * All stream data events ("data", "file", "directory", "symlink") are passed a path string.
   *
   * @param {string} dir
   * @param {object} [options]
   * @returns {stream.Readable}
   */
  function readdirStreamPath (dir, options) {
    return stream$1(dir, options, {});
  }

  /**
   * Aynchronous readdir that returns a {@link stream.Readable} (which is also an {@link EventEmitter})
   * All stream data events ("data", "file", "directory", "symlink") are passed an {@link fs.Stats} object.
   *
   * @param {string} dir
   * @param {object} [options]
   * @returns {stream.Readable}
   */
  function readdirStreamStat (dir, options) {
    return stream$1(dir, options, { stats: true });
  }
  });
  var lib_1 = lib$1.readdir;
  var lib_2 = lib$1.readdirAsync;
  var lib_3 = lib$1.async;
  var lib_4 = lib$1.readdirAsyncStat;
  var lib_5 = lib$1.readdirStream;
  var lib_6 = lib$1.stream;
  var lib_7 = lib$1.readdirStreamStat;
  var lib_8 = lib$1.readdirSync;
  var lib_9 = lib$1.sync;
  var lib_10 = lib$1.readdirSyncStat;

  var path_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  /**
   * Returns «true» if the last partial of the path starting with a period.
   */
  function isDotDirectory(filepath) {
      return path.basename(filepath).startsWith('.');
  }
  exports.isDotDirectory = isDotDirectory;
  /**
   * Convert a windows-like path to a unix-style path.
   */
  function normalize(filepath) {
      return filepath.replace(/\\/g, '/');
  }
  exports.normalize = normalize;
  /**
   * Returns normalized absolute path of provided filepath.
   */
  function makeAbsolute(cwd, filepath) {
      if (path.isAbsolute(filepath)) {
          return normalize(filepath);
      }
      var fullpath = path.resolve(cwd, filepath);
      return normalize(fullpath);
  }
  exports.makeAbsolute = makeAbsolute;
  });

  unwrapExports(path_1);
  var path_2 = path_1.isDotDirectory;
  var path_3 = path_1.normalize;
  var path_4 = path_1.makeAbsolute;

  var deep = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });


  var DeepFilter = /** @class */ (function () {
      function DeepFilter(options, micromatchOptions) {
          this.options = options;
          this.micromatchOptions = micromatchOptions;
      }
      /**
       * Returns filter for directories.
       */
      DeepFilter.prototype.getFilter = function (positive, negative) {
          var _this = this;
          var maxPatternDepth = this.getMaxPatternDepth(positive);
          var negativeRe = this.getNegativePatternsRe(negative);
          return function (entry) { return _this.filter(entry, negativeRe, maxPatternDepth); };
      };
      /**
       * Returns max depth of the provided patterns.
       */
      DeepFilter.prototype.getMaxPatternDepth = function (patterns) {
          var globstar = patterns.some(pattern.hasGlobStar);
          return globstar ? Infinity : pattern.getMaxNaivePatternsDepth(patterns);
      };
      /**
       * Returns RegExp's for patterns that can affect the depth of reading.
       */
      DeepFilter.prototype.getNegativePatternsRe = function (patterns) {
          var affectDepthOfReadingPatterns = patterns.filter(pattern.isAffectDepthOfReadingPattern);
          return pattern.convertPatternsToRe(affectDepthOfReadingPatterns, this.micromatchOptions);
      };
      /**
       * Returns «true» for directory that should be read.
       */
      DeepFilter.prototype.filter = function (entry, negativeRe, maxPatternDepth) {
          if (this.isSkippedByDeepOption(entry.depth)) {
              return false;
          }
          if (this.isSkippedByMaxPatternDepth(entry.depth, maxPatternDepth)) {
              return false;
          }
          if (this.isSkippedSymlinkedDirectory(entry)) {
              return false;
          }
          if (this.isSkippedDotDirectory(entry)) {
              return false;
          }
          return this.isSkippedByNegativePatterns(entry, negativeRe);
      };
      /**
       * Returns «true» when the «deep» option is disabled or number and depth of the entry is greater that the option value.
       */
      DeepFilter.prototype.isSkippedByDeepOption = function (entryDepth) {
          return !this.options.deep || (typeof this.options.deep === 'number' && entryDepth >= this.options.deep);
      };
      /**
       * Returns «true» when depth parameter is not an Infinity and entry depth greater that the parameter value.
       */
      DeepFilter.prototype.isSkippedByMaxPatternDepth = function (entryDepth, maxPatternDepth) {
          return maxPatternDepth !== Infinity && entryDepth >= maxPatternDepth;
      };
      /**
       * Returns «true» for symlinked directory if the «followSymlinkedDirectories» option is disabled.
       */
      DeepFilter.prototype.isSkippedSymlinkedDirectory = function (entry) {
          return !this.options.followSymlinkedDirectories && entry.isSymbolicLink();
      };
      /**
       * Returns «true» for a directory whose name starts with a period if «dot» option is disabled.
       */
      DeepFilter.prototype.isSkippedDotDirectory = function (entry) {
          return !this.options.dot && path_1.isDotDirectory(entry.path);
      };
      /**
       * Returns «true» for a directory whose path math to any negative pattern.
       */
      DeepFilter.prototype.isSkippedByNegativePatterns = function (entry, negativeRe) {
          return !pattern.matchAny(entry.path, negativeRe);
      };
      return DeepFilter;
  }());
  exports.default = DeepFilter;
  });

  unwrapExports(deep);

  var entry = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });


  var DeepFilter = /** @class */ (function () {
      function DeepFilter(options, micromatchOptions) {
          this.options = options;
          this.micromatchOptions = micromatchOptions;
          this.index = new Map();
      }
      /**
       * Returns filter for directories.
       */
      DeepFilter.prototype.getFilter = function (positive, negative) {
          var _this = this;
          var positiveRe = pattern.convertPatternsToRe(positive, this.micromatchOptions);
          var negativeRe = pattern.convertPatternsToRe(negative, this.micromatchOptions);
          return function (entry) { return _this.filter(entry, positiveRe, negativeRe); };
      };
      /**
       * Returns true if entry must be added to result.
       */
      DeepFilter.prototype.filter = function (entry, positiveRe, negativeRe) {
          // Exclude duplicate results
          if (this.options.unique) {
              if (this.isDuplicateEntry(entry)) {
                  return false;
              }
              this.createIndexRecord(entry);
          }
          // Filter files and directories by options
          if (this.onlyFileFilter(entry) || this.onlyDirectoryFilter(entry)) {
              return false;
          }
          if (this.isSkippedByAbsoluteNegativePatterns(entry, negativeRe)) {
              return false;
          }
          return this.isMatchToPatterns(entry.path, positiveRe) && !this.isMatchToPatterns(entry.path, negativeRe);
      };
      /**
       * Return true if the entry already has in the cross reader index.
       */
      DeepFilter.prototype.isDuplicateEntry = function (entry) {
          return this.index.has(entry.path);
      };
      /**
       * Create record in the cross reader index.
       */
      DeepFilter.prototype.createIndexRecord = function (entry) {
          this.index.set(entry.path, undefined);
      };
      /**
       * Returns true for non-files if the «onlyFiles» option is enabled.
       */
      DeepFilter.prototype.onlyFileFilter = function (entry) {
          return this.options.onlyFiles && !entry.isFile();
      };
      /**
       * Returns true for non-directories if the «onlyDirectories» option is enabled.
       */
      DeepFilter.prototype.onlyDirectoryFilter = function (entry) {
          return this.options.onlyDirectories && !entry.isDirectory();
      };
      /**
       * Return true when `absolute` option is enabled and matched to the negative patterns.
       */
      DeepFilter.prototype.isSkippedByAbsoluteNegativePatterns = function (entry, negativeRe) {
          if (!this.options.absolute) {
              return false;
          }
          var fullpath = path_1.makeAbsolute(this.options.cwd, entry.path);
          return this.isMatchToPatterns(fullpath, negativeRe);
      };
      /**
       * Return true when entry match to provided patterns.
       *
       * First, just trying to apply patterns to the path.
       * Second, trying to apply patterns to the path with final slash (need to micromatch to support «directory/**» patterns).
       */
      DeepFilter.prototype.isMatchToPatterns = function (filepath, patternsRe) {
          return pattern.matchAny(filepath, patternsRe) || pattern.matchAny(filepath + '/', patternsRe);
      };
      return DeepFilter;
  }());
  exports.default = DeepFilter;
  });

  unwrapExports(entry);

  var reader = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });




  var Reader = /** @class */ (function () {
      function Reader(options) {
          this.options = options;
          this.micromatchOptions = this.getMicromatchOptions();
          this.entryFilter = new entry.default(options, this.micromatchOptions);
          this.deepFilter = new deep.default(options, this.micromatchOptions);
      }
      /**
       * Returns root path to scanner.
       */
      Reader.prototype.getRootDirectory = function (task) {
          return path.resolve(this.options.cwd, task.base);
      };
      /**
       * Returns options for reader.
       */
      Reader.prototype.getReaderOptions = function (task) {
          return {
              basePath: task.base === '.' ? '' : task.base,
              filter: this.entryFilter.getFilter(task.positive, task.negative),
              deep: this.deepFilter.getFilter(task.positive, task.negative),
              sep: '/'
          };
      };
      /**
       * Returns options for micromatch.
       */
      Reader.prototype.getMicromatchOptions = function () {
          return {
              dot: this.options.dot,
              nobrace: !this.options.brace,
              noglobstar: !this.options.globstar,
              noext: !this.options.extension,
              nocase: !this.options.case,
              matchBase: this.options.matchBase
          };
      };
      /**
       * Returns transformed entry.
       */
      Reader.prototype.transform = function (entry$$1) {
          if (this.options.absolute && !path.isAbsolute(entry$$1.path)) {
              entry$$1.path = path_1.makeAbsolute(this.options.cwd, entry$$1.path);
          }
          if (this.options.markDirectories && entry$$1.isDirectory()) {
              entry$$1.path += '/';
          }
          var item = this.options.stats ? entry$$1 : entry$$1.path;
          if (this.options.transform === null) {
              return item;
          }
          return this.options.transform(item);
      };
      /**
       * Returns true if error has ENOENT code.
       */
      Reader.prototype.isEnoentCodeError = function (err) {
          return err.code === 'ENOENT';
      };
      return Reader;
  }());
  exports.default = Reader;
  });

  unwrapExports(reader);

  var fs_1$1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  exports.FILE_SYSTEM_ADAPTER = {
      lstat: fs__default.lstat,
      stat: fs__default.stat,
      lstatSync: fs__default.lstatSync,
      statSync: fs__default.statSync
  };
  function getFileSystemAdapter(fsMethods) {
      if (!fsMethods) {
          return exports.FILE_SYSTEM_ADAPTER;
      }
      return Object.assign({}, exports.FILE_SYSTEM_ADAPTER, fsMethods);
  }
  exports.getFileSystemAdapter = getFileSystemAdapter;
  });

  unwrapExports(fs_1$1);
  var fs_2 = fs_1$1.FILE_SYSTEM_ADAPTER;
  var fs_3 = fs_1$1.getFileSystemAdapter;

  var options$2 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  function prepare(opts) {
      const options = Object.assign({
          fs: fs_1$1.getFileSystemAdapter(opts ? opts.fs : undefined),
          throwErrorOnBrokenSymlinks: true,
          followSymlinks: true
      }, opts);
      return options;
  }
  exports.prepare = prepare;
  });

  unwrapExports(options$2);
  var options_1$1 = options$2.prepare;

  var stat$2 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  function sync(path$$1, options) {
      const lstat = options.fs.lstatSync(path$$1);
      if (!isFollowedSymlink(lstat, options)) {
          return lstat;
      }
      try {
          const stat = options.fs.statSync(path$$1);
          stat.isSymbolicLink = () => true;
          return stat;
      }
      catch (err) {
          if (!options.throwErrorOnBrokenSymlinks) {
              return lstat;
          }
          throw err;
      }
  }
  exports.sync = sync;
  function async(path$$1, options, callback) {
      options.fs.lstat(path$$1, (err0, lstat) => {
          if (err0) {
              return callback(err0, undefined);
          }
          if (!isFollowedSymlink(lstat, options)) {
              return callback(null, lstat);
          }
          options.fs.stat(path$$1, (err1, stat) => {
              if (err1) {
                  return options.throwErrorOnBrokenSymlinks ? callback(err1) : callback(null, lstat);
              }
              stat.isSymbolicLink = () => true;
              callback(null, stat);
          });
      });
  }
  exports.async = async;
  /**
   * Returns `true` for followed symlink.
   */
  function isFollowedSymlink(stat, options) {
      return stat.isSymbolicLink() && options.followSymlinks;
  }
  exports.isFollowedSymlink = isFollowedSymlink;
  });

  unwrapExports(stat$2);
  var stat_1$1 = stat$2.sync;
  var stat_2 = stat$2.async;
  var stat_3 = stat$2.isFollowedSymlink;

  var out = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });


  /**
   * Asynchronous API.
   */
  function stat(path$$1, opts) {
      return new Promise((resolve, reject) => {
          stat$2.async(path$$1, options$2.prepare(opts), (err, stats) => err ? reject(err) : resolve(stats));
      });
  }
  exports.stat = stat;
  function statCallback(path$$1, optsOrCallback, callback) {
      if (typeof optsOrCallback === 'function') {
          callback = optsOrCallback; /* tslint:disable-line: no-parameter-reassignment */
          optsOrCallback = undefined; /* tslint:disable-line: no-parameter-reassignment */
      }
      if (typeof callback === 'undefined') {
          throw new TypeError('The "callback" argument must be of type Function.');
      }
      stat$2.async(path$$1, options$2.prepare(optsOrCallback), callback);
  }
  exports.statCallback = statCallback;
  /**
   * Synchronous API.
   */
  function statSync(path$$1, opts) {
      return stat$2.sync(path$$1, options$2.prepare(opts));
  }
  exports.statSync = statSync;
  });

  unwrapExports(out);
  var out_1 = out.stat;
  var out_2 = out.statCallback;
  var out_3 = out.statSync;

  var fs$2 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  var FileSystem = /** @class */ (function () {
      function FileSystem(options) {
          this.options = options;
      }
      /**
       * Return full path to entry.
       */
      FileSystem.prototype.getFullEntryPath = function (filepath) {
          return path.resolve(this.options.cwd, filepath);
      };
      /**
       * Return an implementation of the Entry interface.
       */
      FileSystem.prototype.makeEntry = function (stat, pattern) {
          return Object.assign(stat, {
              path: pattern,
              depth: pattern.split('/').length
          });
      };
      return FileSystem;
  }());
  exports.default = FileSystem;
  });

  unwrapExports(fs$2);

  var fsStream = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  Object.defineProperty(exports, "__esModule", { value: true });



  var FileSystemStream = /** @class */ (function (_super) {
      __extends(FileSystemStream, _super);
      function FileSystemStream() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      /**
       * Use stream API to read entries for Task.
       */
      FileSystemStream.prototype.read = function (patterns, filter) {
          var _this = this;
          var filepaths = patterns.map(this.getFullEntryPath, this);
          var transform = new stream.Transform({ objectMode: true });
          transform._transform = function (index, _enc, done) {
              return _this.getEntry(filepaths[index], patterns[index]).then(function (entry) {
                  if (entry !== null && filter(entry)) {
                      transform.push(entry);
                  }
                  if (index === filepaths.length - 1) {
                      transform.end();
                  }
                  done();
              });
          };
          for (var i = 0; i < filepaths.length; i++) {
              transform.write(i);
          }
          return transform;
      };
      /**
       * Return entry for the provided path.
       */
      FileSystemStream.prototype.getEntry = function (filepath, pattern) {
          var _this = this;
          return this.getStat(filepath)
              .then(function (stat) { return _this.makeEntry(stat, pattern); })
              .catch(function () { return null; });
      };
      /**
       * Return fs.Stats for the provided path.
       */
      FileSystemStream.prototype.getStat = function (filepath) {
          return out.stat(filepath, { throwErrorOnBrokenSymlinks: false });
      };
      return FileSystemStream;
  }(fs$2.default));
  exports.default = FileSystemStream;
  });

  unwrapExports(fsStream);

  var readerAsync = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  Object.defineProperty(exports, "__esModule", { value: true });



  var ReaderAsync = /** @class */ (function (_super) {
      __extends(ReaderAsync, _super);
      function ReaderAsync() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      Object.defineProperty(ReaderAsync.prototype, "fsAdapter", {
          /**
           * Returns FileSystem adapter.
           */
          get: function () {
              return new fsStream.default(this.options);
          },
          enumerable: true,
          configurable: true
      });
      /**
       * Use async API to read entries for Task.
       */
      ReaderAsync.prototype.read = function (task) {
          var _this = this;
          var root = this.getRootDirectory(task);
          var options = this.getReaderOptions(task);
          var entries = [];
          return new Promise(function (resolve, reject) {
              var stream$$1 = _this.api(root, task, options);
              stream$$1.on('error', function (err) {
                  _this.isEnoentCodeError(err) ? resolve([]) : reject(err);
                  stream$$1.pause();
              });
              stream$$1.on('data', function (entry) { return entries.push(_this.transform(entry)); });
              stream$$1.on('end', function () { return resolve(entries); });
          });
      };
      /**
       * Returns founded paths.
       */
      ReaderAsync.prototype.api = function (root, task, options) {
          if (task.dynamic) {
              return this.dynamicApi(root, options);
          }
          return this.staticApi(task, options);
      };
      /**
       * Api for dynamic tasks.
       */
      ReaderAsync.prototype.dynamicApi = function (root, options) {
          return lib$1.readdirStreamStat(root, options);
      };
      /**
       * Api for static tasks.
       */
      ReaderAsync.prototype.staticApi = function (task, options) {
          return this.fsAdapter.read(task.patterns, options.filter);
      };
      return ReaderAsync;
  }(reader.default));
  exports.default = ReaderAsync;
  });

  unwrapExports(readerAsync);

  var readerStream = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  Object.defineProperty(exports, "__esModule", { value: true });




  var TransformStream = /** @class */ (function (_super) {
      __extends(TransformStream, _super);
      function TransformStream(reader$$1) {
          var _this = _super.call(this, { objectMode: true }) || this;
          _this.reader = reader$$1;
          return _this;
      }
      TransformStream.prototype._transform = function (entry, _encoding, callback) {
          callback(null, this.reader.transform(entry));
      };
      return TransformStream;
  }(stream.Transform));
  var ReaderStream = /** @class */ (function (_super) {
      __extends(ReaderStream, _super);
      function ReaderStream() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      Object.defineProperty(ReaderStream.prototype, "fsAdapter", {
          /**
           * Returns FileSystem adapter.
           */
          get: function () {
              return new fsStream.default(this.options);
          },
          enumerable: true,
          configurable: true
      });
      /**
       * Use stream API to read entries for Task.
       */
      ReaderStream.prototype.read = function (task) {
          var _this = this;
          var root = this.getRootDirectory(task);
          var options = this.getReaderOptions(task);
          var transform = new TransformStream(this);
          var readable = this.api(root, task, options);
          return readable
              .on('error', function (err) { return _this.isEnoentCodeError(err) ? null : transform.emit('error', err); })
              .pipe(transform);
      };
      /**
       * Returns founded paths.
       */
      ReaderStream.prototype.api = function (root, task, options) {
          if (task.dynamic) {
              return this.dynamicApi(root, options);
          }
          return this.staticApi(task, options);
      };
      /**
       * Api for dynamic tasks.
       */
      ReaderStream.prototype.dynamicApi = function (root, options) {
          return lib$1.readdirStreamStat(root, options);
      };
      /**
       * Api for static tasks.
       */
      ReaderStream.prototype.staticApi = function (task, options) {
          return this.fsAdapter.read(task.patterns, options.filter);
      };
      return ReaderStream;
  }(reader.default));
  exports.default = ReaderStream;
  });

  unwrapExports(readerStream);

  var fsSync = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  Object.defineProperty(exports, "__esModule", { value: true });


  var FileSystemSync = /** @class */ (function (_super) {
      __extends(FileSystemSync, _super);
      function FileSystemSync() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      /**
       * Use sync API to read entries for Task.
       */
      FileSystemSync.prototype.read = function (patterns, filter) {
          var _this = this;
          var entries = [];
          patterns.forEach(function (pattern) {
              var filepath = _this.getFullEntryPath(pattern);
              var entry = _this.getEntry(filepath, pattern);
              if (entry === null || !filter(entry)) {
                  return;
              }
              entries.push(entry);
          });
          return entries;
      };
      /**
       * Return entry for the provided path.
       */
      FileSystemSync.prototype.getEntry = function (filepath, pattern) {
          try {
              var stat = this.getStat(filepath);
              return this.makeEntry(stat, pattern);
          }
          catch (err) {
              return null;
          }
      };
      /**
       * Return fs.Stats for the provided path.
       */
      FileSystemSync.prototype.getStat = function (filepath) {
          return out.statSync(filepath, { throwErrorOnBrokenSymlinks: false });
      };
      return FileSystemSync;
  }(fs$2.default));
  exports.default = FileSystemSync;
  });

  unwrapExports(fsSync);

  var readerSync = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  Object.defineProperty(exports, "__esModule", { value: true });



  var ReaderSync = /** @class */ (function (_super) {
      __extends(ReaderSync, _super);
      function ReaderSync() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      Object.defineProperty(ReaderSync.prototype, "fsAdapter", {
          /**
           * Returns FileSystem adapter.
           */
          get: function () {
              return new fsSync.default(this.options);
          },
          enumerable: true,
          configurable: true
      });
      /**
       * Use sync API to read entries for Task.
       */
      ReaderSync.prototype.read = function (task) {
          var root = this.getRootDirectory(task);
          var options = this.getReaderOptions(task);
          try {
              var entries = this.api(root, task, options);
              return entries.map(this.transform, this);
          }
          catch (err) {
              if (this.isEnoentCodeError(err)) {
                  return [];
              }
              throw err;
          }
      };
      /**
       * Returns founded paths.
       */
      ReaderSync.prototype.api = function (root, task, options) {
          if (task.dynamic) {
              return this.dynamicApi(root, options);
          }
          return this.staticApi(task, options);
      };
      /**
       * Api for dynamic tasks.
       */
      ReaderSync.prototype.dynamicApi = function (root, options) {
          return lib$1.readdirSyncStat(root, options);
      };
      /**
       * Api for static tasks.
       */
      ReaderSync.prototype.staticApi = function (task, options) {
          return this.fsAdapter.read(task.patterns, options.filter);
      };
      return ReaderSync;
  }(reader.default));
  exports.default = ReaderSync;
  });

  unwrapExports(readerSync);

  var array = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  /**
   * Flatten nested arrays (max depth is 2) into a non-nested array of non-array items.
   */
  function flatten(items) {
      return items.reduce(function (collection, item) { return [].concat(collection, item); }, []);
  }
  exports.flatten = flatten;
  });

  unwrapExports(array);
  var array_1 = array.flatten;

  /*
   * merge2
   * https://github.com/teambition/merge2
   *
   * Copyright (c) 2014-2016 Teambition
   * Licensed under the MIT license.
   */

  const PassThrough = stream.PassThrough;
  const slice = Array.prototype.slice;

  var merge2_1 = merge2;

  function merge2 () {
    const streamsQueue = [];
    let merging = false;
    const args = slice.call(arguments);
    let options = args[args.length - 1];

    if (options && !Array.isArray(options) && options.pipe == null) args.pop();
    else options = {};

    const doEnd = options.end !== false;
    if (options.objectMode == null) options.objectMode = true;
    if (options.highWaterMark == null) options.highWaterMark = 64 * 1024;
    const mergedStream = PassThrough(options);

    function addStream () {
      for (let i = 0, len = arguments.length; i < len; i++) {
        streamsQueue.push(pauseStreams(arguments[i], options));
      }
      mergeStream();
      return this
    }

    function mergeStream () {
      if (merging) return
      merging = true;

      let streams = streamsQueue.shift();
      if (!streams) {
        process.nextTick(endStream);
        return
      }
      if (!Array.isArray(streams)) streams = [streams];

      let pipesCount = streams.length + 1;

      function next () {
        if (--pipesCount > 0) return
        merging = false;
        mergeStream();
      }

      function pipe (stream$$1) {
        function onend () {
          stream$$1.removeListener('merge2UnpipeEnd', onend);
          stream$$1.removeListener('end', onend);
          next();
        }
        // skip ended stream
        if (stream$$1._readableState.endEmitted) return next()

        stream$$1.on('merge2UnpipeEnd', onend);
        stream$$1.on('end', onend);
        stream$$1.pipe(mergedStream, { end: false });
        // compatible for old stream
        stream$$1.resume();
      }

      for (let i = 0; i < streams.length; i++) pipe(streams[i]);

      next();
    }

    function endStream () {
      merging = false;
      // emit 'queueDrain' when all streams merged.
      mergedStream.emit('queueDrain');
      return doEnd && mergedStream.end()
    }

    mergedStream.setMaxListeners(0);
    mergedStream.add = addStream;
    mergedStream.on('unpipe', function (stream$$1) {
      stream$$1.emit('merge2UnpipeEnd');
    });

    if (args.length) addStream.apply(null, args);
    return mergedStream
  }

  // check and pause streams for pipe.
  function pauseStreams (streams, options) {
    if (!Array.isArray(streams)) {
      // Backwards-compat with old-style streams
      if (!streams._readableState && streams.pipe) streams = streams.pipe(PassThrough(options));
      if (!streams._readableState || !streams.pause || !streams.pipe) {
        throw new Error('Only readable stream can be merged.')
      }
      streams.pause();
    } else {
      for (let i = 0, len = streams.length; i < len; i++) streams[i] = pauseStreams(streams[i], options);
    }
    return streams
  }

  var stream$2 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  /**
   * Merge multiple streams and propagate their errors into one stream in parallel.
   */
  function merge(streams) {
      var mergedStream = merge2_1(streams);
      streams.forEach(function (stream$$1) {
          stream$$1.on('error', function (err) { return mergedStream.emit('error', err); });
      });
      return mergedStream;
  }
  exports.merge = merge;
  });

  unwrapExports(stream$2);
  var stream_1 = stream$2.merge;

  var out$1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });







  /**
   * Synchronous API.
   */
  function sync(source, opts) {
      assertPatternsInput(source);
      var works = getWorks(source, readerSync.default, opts);
      return array.flatten(works);
  }
  exports.sync = sync;
  /**
   * Asynchronous API.
   */
  function async(source, opts) {
      try {
          assertPatternsInput(source);
      }
      catch (error) {
          return Promise.reject(error);
      }
      var works = getWorks(source, readerAsync.default, opts);
      return Promise.all(works).then(array.flatten);
  }
  exports.async = async;
  /**
   * Stream API.
   */
  function stream$$1(source, opts) {
      assertPatternsInput(source);
      var works = getWorks(source, readerStream.default, opts);
      return stream$2.merge(works);
  }
  exports.stream = stream$$1;
  /**
   * Return a set of tasks based on provided patterns.
   */
  function generateTasks(source, opts) {
      assertPatternsInput(source);
      var patterns = [].concat(source);
      var options$$1 = options.prepare(opts);
      return tasks.generate(patterns, options$$1);
  }
  exports.generateTasks = generateTasks;
  /**
   * Returns a set of works based on provided tasks and class of the reader.
   */
  function getWorks(source, _Reader, opts) {
      var patterns = [].concat(source);
      var options$$1 = options.prepare(opts);
      var tasks$$1 = tasks.generate(patterns, options$$1);
      var reader = new _Reader(options$$1);
      return tasks$$1.map(reader.read, reader);
  }
  function assertPatternsInput(source) {
      if ([].concat(source).every(isString)) {
          return;
      }
      throw new TypeError('Patterns must be a string or an array of strings');
  }
  function isString(source) {
      /* tslint:disable-next-line strict-type-predicates */
      return typeof source === 'string';
  }
  });

  unwrapExports(out$1);
  var out_1$1 = out$1.sync;
  var out_2$1 = out$1.async;
  var out_3$1 = out$1.stream;
  var out_4 = out$1.generateTasks;

  var fastGlob = out$1.async;
  var default_1 = out$1.async;

  var async$1 = out$1.async;
  var sync$1 = out$1.sync;
  var stream$4 = out$1.stream;

  var generateTasks = out$1.generateTasks;
  fastGlob.default = default_1;
  fastGlob.async = async$1;
  fastGlob.sync = sync$1;
  fastGlob.stream = stream$4;
  fastGlob.generateTasks = generateTasks;

  var umd = createCommonjsModule(function (module, exports) {
  (function (global, factory) {
  	module.exports = factory();
  }(commonjsGlobal, (function () {
  var isMergeableObject = function isMergeableObject(value) {
  	return isNonNullObject(value)
  		&& !isSpecial(value)
  };

  function isNonNullObject(value) {
  	return !!value && typeof value === 'object'
  }

  function isSpecial(value) {
  	var stringValue = Object.prototype.toString.call(value);

  	return stringValue === '[object RegExp]'
  		|| stringValue === '[object Date]'
  		|| isReactElement(value)
  }

  // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
  var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
  var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

  function isReactElement(value) {
  	return value.$$typeof === REACT_ELEMENT_TYPE
  }

  function emptyTarget(val) {
  	return Array.isArray(val) ? [] : {}
  }

  function cloneUnlessOtherwiseSpecified(value, options) {
  	return (options.clone !== false && options.isMergeableObject(value))
  		? deepmerge(emptyTarget(value), value, options)
  		: value
  }

  function defaultArrayMerge(target, source, options) {
  	return target.concat(source).map(function(element) {
  		return cloneUnlessOtherwiseSpecified(element, options)
  	})
  }

  function mergeObject(target, source, options) {
  	var destination = {};
  	if (options.isMergeableObject(target)) {
  		Object.keys(target).forEach(function(key) {
  			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
  		});
  	}
  	Object.keys(source).forEach(function(key) {
  		if (!options.isMergeableObject(source[key]) || !target[key]) {
  			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
  		} else {
  			destination[key] = deepmerge(target[key], source[key], options);
  		}
  	});
  	return destination
  }

  function deepmerge(target, source, options) {
  	options = options || {};
  	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  	options.isMergeableObject = options.isMergeableObject || isMergeableObject;

  	var sourceIsArray = Array.isArray(source);
  	var targetIsArray = Array.isArray(target);
  	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  	if (!sourceAndTargetTypesMatch) {
  		return cloneUnlessOtherwiseSpecified(source, options)
  	} else if (sourceIsArray) {
  		return options.arrayMerge(target, source, options)
  	} else {
  		return mergeObject(target, source, options)
  	}
  }

  deepmerge.all = function deepmergeAll(array, options) {
  	if (!Array.isArray(array)) {
  		throw new Error('first argument should be an array')
  	}

  	return array.reduce(function(prev, next) {
  		return deepmerge(prev, next, options)
  	}, {})
  };

  var deepmerge_1 = deepmerge;

  return deepmerge_1;

  })));
  });

  var deepmerge_ = /*#__PURE__*/Object.freeze({
    default: umd,
    __moduleExports: umd
  });

  var NullLogger = /** @class */ (function () {
      function NullLogger() {
      }
      NullLogger.prototype.debug = function (message, context) {
          if (context === void 0) { context = null; }
          // black-hole
      };
      NullLogger.prototype.info = function (message, context) {
          if (context === void 0) { context = null; }
          // black-hole
      };
      NullLogger.prototype.error = function (message, context) {
          if (context === void 0) { context = null; }
          // black-hole
      };
      return NullLogger;
  }());

  // https://github.com/rollup/rollup/issues/670
  var deepmerge = umd || deepmerge_;
  var yaml = jsYaml$1 || yaml_;
  var Configuration = /** @class */ (function () {
      /**
       * Configuration constructor.
       *
       * @param path
       * @param stage
       */
      function Configuration(path$$1, stage) {
          if (path$$1 === void 0) { path$$1 = null; }
          if (stage === void 0) { stage = null; }
          /**
           * Configuration object.
           */
          this.config = {};
          if (path$$1 === null) {
              this.path = Configuration.getEnvVariable(Configuration.CONFIG_PATH, '/app/configuration');
          }
          else {
              this.path = path$$1;
          }
          if (stage === null) {
              this.stage = Configuration.getEnvVariable(Configuration.STAGE, 'local');
          }
          else {
              this.stage = stage;
          }
          // Set up default black hole logger.
          // If u want to see logs and see how load process working,
          // change it from outside to your default logger object in you application
          this.logger = new NullLogger();
      }
      /**
       * Initialize all the magic down here
       */
      Configuration.prototype.load = function () {
          this.logger.info(Configuration.CONFIG_PATH + ' = ' + this.path);
          this.logger.info(Configuration.STAGE + ' = ' + this.stage);
          try {
              this.config = Configuration.mergeRecursive(this.parseConfiguration(), this.parseConfiguration(this.stage));
          }
          catch (e) {
              this.logger.error(e.message);
              throw e;
          }
          this.logger.info('Configuration module loaded');
          return this;
      };
      /**
       * Get value from config.
       *
       * @param key
       * @param def
       */
      Configuration.prototype.get = function (key, def) {
          if (def === void 0) { def = null; }
          return lodash.get(this.config, key, def);
      };
      /**
       * Return all merged config.
       */
      Configuration.prototype.all = function () {
          return this.config;
      };
      /**
       * Return all merged config converted to json.
       */
      Configuration.prototype.asJson = function (escapeQuotes) {
          if (escapeQuotes === void 0) { escapeQuotes = false; }
          var json = JSON.stringify(this.config);
          return escapeQuotes ? Configuration.escape(json) : json;
      };
      /**
       * Return all merged config converted to escaped json.
       */
      Configuration.prototype.asEscapedJson = function () {
          return this.asJson(true);
      };
      /**
       * Escape json.
       *
       * @param value
       */
      Configuration.escape = function (value) {
          return value
              .replace(/[\\]/g, '\\\\')
              .replace(/[']/g, '\\\'')
              .replace(/["]/g, '\\\"')
              .replace(/[\/]/g, '\\/')
              .replace(/[\b]/g, '\\b')
              .replace(/[\f]/g, '\\f')
              .replace(/[\n]/g, '\\n')
              .replace(/[\r]/g, '\\r')
              .replace(/[\t]/g, '\\t');
      };
      /**
       * Parses configuration and makes a tree of it
       */
      Configuration.prototype.parseConfiguration = function (stage) {
          if (stage === void 0) { stage = 'defaults'; }
          var pattern = this.path + "/" + stage + "/*.yaml";
          this.logger.debug("For load config for stage: " + stage + " used pattern: " + pattern);
          try {
              fs.statSync(this.path);
              this.logger.debug("Directory " + this.path + " is exists.");
          }
          catch (e) {
              throw new Error("Configuration dir not found in the: " + this.path);
          }
          return this.eachReadAndMerge(fastGlob.sync([pattern]));
      };
      /**
       * Read each file and merge.
       *
       * @param files
       */
      Configuration.prototype.eachReadAndMerge = function (files) {
          var config = {};
          this.logger.debug('Following config files found:', files);
          for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
              var file = files_1[_i];
              var content = Configuration.parseYaml(file.toString());
              config = Configuration.mergeRecursive(config, content[Object.keys(content)[0]]);
          }
          return config;
      };
      /**
       * Recursively merge objects with full replace the sequential lists.
       *
       * @param x
       * @param y
       */
      Configuration.mergeRecursive = function (x, y) {
          var overwriteMerge = function (destinationArray, sourceArray) { return sourceArray; };
          return deepmerge(x, y, { arrayMerge: overwriteMerge });
      };
      /**
       * Parse yaml.
       *
       * @param file
       */
      Configuration.parseYaml = function (file) {
          return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
      };
      /**
       * Takes an env variable and returns default if not exist
       *
       * @param variable
       * @param def
       */
      Configuration.getEnvVariable = function (variable, def) {
          return process.env[variable] || def;
      };
      /**
       * Name of CONFIG_PATH variable
       */
      Configuration.CONFIG_PATH = 'CONFIG_PATH';
      /**
       * Name of stage ENV variable
       */
      Configuration.STAGE = 'STAGE';
      return Configuration;
  }());

  var StdoutConsoleLogger = /** @class */ (function () {
      /**
       * StdoutConsoleLogger instance.
       *
       * @param showDebug
       */
      function StdoutConsoleLogger(showDebug) {
          if (showDebug === void 0) { showDebug = false; }
          this.showDebug = showDebug;
      }
      /**
       * Log the debug messages.
       *
       * @param message
       * @param context
       */
      StdoutConsoleLogger.prototype.debug = function (message, context) {
          if (context === void 0) { context = null; }
          if (this.showDebug) {
              StdoutConsoleLogger.log(message, context);
          }
      };
      /**
       * Log the info messages.
       *
       * @param message
       * @param context
       */
      StdoutConsoleLogger.prototype.info = function (message, context) {
          if (context === void 0) { context = null; }
          StdoutConsoleLogger.log(message, context);
      };
      /**
       * Log the error messages.
       *
       * @param message
       * @param context
       */
      StdoutConsoleLogger.prototype.error = function (message, context) {
          if (context === void 0) { context = null; }
          StdoutConsoleLogger.log(message, context);
      };
      /**
       * Lon entry.
       *
       * @param message
       * @param context
       */
      StdoutConsoleLogger.log = function (message, context) {
          if (context === void 0) { context = null; }
          if (context === null) {
              process.stdout.write(message + "\n");
          }
          else {
              process.stdout.write(message + " - " + JSON.stringify(context) + "\n");
          }
      };
      return StdoutConsoleLogger;
  }());

  var WinstonConsoleLogger = /** @class */ (function () {
      /**
       * WinstonConsoleLogger instance.
       *
       * @param logger
       */
      function WinstonConsoleLogger(logger) {
          this.logger = logger;
      }
      /**
       * Log the debug messages.
       *
       * @param message
       * @param context
       */
      WinstonConsoleLogger.prototype.debug = function (message, context) {
          if (context === void 0) { context = null; }
          this.logger.debug(message, context);
      };
      /**
       * Log the info messages.
       *
       * @param message
       * @param context
       */
      WinstonConsoleLogger.prototype.info = function (message, context) {
          if (context === void 0) { context = null; }
          this.logger.info(message, context);
      };
      /**
       * Log the error messages.
       *
       * @param message
       * @param context
       */
      WinstonConsoleLogger.prototype.error = function (message, context) {
          if (context === void 0) { context = null; }
          this.logger.error(message, context);
      };
      return WinstonConsoleLogger;
  }());

  var index$2 = {
      Configuration: Configuration,
      StdoutConsoleLogger: StdoutConsoleLogger,
      WinstonConsoleLogger: WinstonConsoleLogger,
      NullLogger: NullLogger,
  };

  return index$2;

})));
//# sourceMappingURL=index.umd.js.map

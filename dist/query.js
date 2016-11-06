"use strict";

System.register(["lodash", "moment"], function (_export, _context) {
  "use strict";

  var _, moment, _slicedToArray, _createClass, DalmatinerQueryCondition, DalmatinerProjection, DalmatinerFunction, DalmatinerSelector, DalmatinerQuery;

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_moment) {
      moment = _moment.default;
    }],
    execute: function () {
      _slicedToArray = function () {
        function sliceIterator(arr, i) {
          var _arr = [];
          var _n = true;
          var _d = false;
          var _e = undefined;

          try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);

              if (i && _arr.length === i) break;
            }
          } catch (err) {
            _d = true;
            _e = err;
          } finally {
            try {
              if (!_n && _i["return"]) _i["return"]();
            } finally {
              if (_d) throw _e;
            }
          }

          return _arr;
        }

        return function (arr, i) {
          if (Array.isArray(arr)) {
            return arr;
          } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
          } else {
            throw new TypeError("Invalid attempt to destructure non-iterable instance");
          }
        };
      }();

      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      DalmatinerQueryCondition = function () {
        function DalmatinerQueryCondition(op) {
          _classCallCheck(this, DalmatinerQueryCondition);

          this.op = op;

          for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          this.args = args;
        }

        _createClass(DalmatinerQueryCondition, [{
          key: "and",
          value: function and(other) {
            return new DalmatinerQueryCondition('and', this, other);
          }
        }, {
          key: "or",
          value: function or(other) {
            return new DalmatinerQueryCondition('or', this, other);
          }
        }, {
          key: "toString",
          value: function toString() {
            var tag, value, a, b;
            switch (this.op) {
              case 'eq':
                var _args = _slicedToArray(this.args, 2);

                tag = _args[0];
                value = _args[1];

                return this._encodeTag(tag) + " = '" + value + "'";
              case 'neq':
                var _args2 = _slicedToArray(this.args, 2);

                tag = _args2[0];
                value = _args2[1];

                return this._encodeTag(tag) + " != '" + value + "'";
              case 'present':
                var _args3 = _slicedToArray(this.args, 1);

                tag = _args3[0];

                return this._encodeTag(tag);
              case 'and':
                var _args4 = _slicedToArray(this.args, 2);

                a = _args4[0];
                b = _args4[1];

                return a + " AND " + b;
              case 'or':
                var _args5 = _slicedToArray(this.args, 2);

                a = _args5[0];
                b = _args5[1];

                return a + " OR " + b;
            }
            return '';
          }
        }, {
          key: "_encodeTag",
          value: function _encodeTag(_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                ns = _ref2[0],
                key = _ref2[1];

            return ns ? ns + ":'" + key + "'" : "'" + key + "'";
          }
        }]);

        return DalmatinerQueryCondition;
      }();

      DalmatinerProjection = function () {
        function DalmatinerProjection() {
          _classCallCheck(this, DalmatinerProjection);
        }

        _createClass(DalmatinerProjection, [{
          key: "aliasBy",
          value: function aliasBy(alias) {
            this.alias = alias;
            return this;
          }
        }, {
          key: "shiftBy",
          value: function shiftBy(timeshift) {
            this.timeshift = timeshift;
            return this;
          }
        }, {
          key: "encode",
          value: function encode() {
            var str = this.toString();
            if (this.alias) {
              str += " AS " + this.alias;
            }
            if (this.timeshift) {
              str += " SHIFT BY " + this.timeshift;
            }
            return str;
          }
        }]);

        return DalmatinerProjection;
      }();

      DalmatinerFunction = function (_DalmatinerProjection) {
        _inherits(DalmatinerFunction, _DalmatinerProjection);

        function DalmatinerFunction(fun, args, vars) {
          _classCallCheck(this, DalmatinerFunction);

          var _this = _possibleConstructorReturn(this, (DalmatinerFunction.__proto__ || Object.getPrototypeOf(DalmatinerFunction)).call(this));

          _this.fun = fun;
          _this.args = args;
          _this.vars = vars;
          _this._encodeArg = _this._encodeArg.bind(_this);
          return _this;
        }

        _createClass(DalmatinerFunction, [{
          key: "toString",
          value: function toString() {
            var args = this.args.map(this._encodeArg);
            return this.fun + "(" + args.join(', ') + ")";
          }
        }, {
          key: "_encodeArg",
          value: function _encodeArg(arg) {
            if (typeof arg === 'string' && arg[0] === '$') {
              var varname = arg.slice(1);
              arg = this.vars[varname];
              if (_.isUndefined(arg)) {
                throw new Error("Variable " + varname + " was not declared");
              }
            }
            return '' + arg;
          }
        }]);

        return DalmatinerFunction;
      }(DalmatinerProjection);

      DalmatinerSelector = function (_DalmatinerProjection2) {
        _inherits(DalmatinerSelector, _DalmatinerProjection2);

        function DalmatinerSelector(collection, metric, variables) {
          _classCallCheck(this, DalmatinerSelector);

          var _this2 = _possibleConstructorReturn(this, (DalmatinerSelector.__proto__ || Object.getPrototypeOf(DalmatinerSelector)).call(this));

          _this2.collection = collection;
          _this2.metric = _.map(metric, function (mpart) {
            return mpart.value ? mpart.value : mpart.toString();
          });
          _this2.variables = variables;
          return _this2;
        }

        _createClass(DalmatinerSelector, [{
          key: "where",
          value: function where(condition) {
            this.condition = condition;
            return this;
          }
        }, {
          key: "toString",
          value: function toString() {
            var metric = this._encodeMetric(),
                collection = this._encodeCollection(),
                str = metric + " FROM " + collection;
            if (this.condition) {
              str += " WHERE " + this.condition;
            }
            return str;
          }
        }, {
          key: "_encodeCollection",
          value: function _encodeCollection() {
            return "'" + this.collection + "'";
          }
        }, {
          key: "_encodeMetric",
          value: function _encodeMetric() {
            return _.map(this.metric, function (part) {
              if (part === '*') return "" + part;else return "'" + part + "'";
            }).join('.');
          }
        }]);

        return DalmatinerSelector;
      }(DalmatinerProjection);

      _export("DalmatinerQuery", DalmatinerQuery = function () {
        function DalmatinerQuery() {
          _classCallCheck(this, DalmatinerQuery);

          this.variables = {};
          this.parts = [];
          this.selectors = [];
        }

        _createClass(DalmatinerQuery, [{
          key: "from",
          value: function from(c) {
            this.collection = c.value ? c.value : c.toString();
            return this;
          }
        }, {
          key: "select",
          value: function select(m) {
            if (!this.collection) throw new Error("You need to set collection (from statement) before selecting metric");
            var selector = new DalmatinerSelector(this.collection, m);
            this.selectors.push(selector);
            this.parts.push(selector);
            this.active = this.parts.length - 1;
            return this;
          }
        }, {
          key: "beginningAt",
          value: function beginningAt(t) {
            this.beginning = moment(t);
            return this;
          }
        }, {
          key: "endingAt",
          value: function endingAt(t) {
            this.ending = moment(t);
            return this;
          }
        }, {
          key: "with",
          value: function _with(name, value) {
            this.variables[name] = value;
            return this;
          }
        }, {
          key: "where",
          value: function where(condition) {
            if (!condition instanceof DalmatinerQueryCondition) {
              throw new Error("Invalid query condition");
            }
            this.selectors[this.active].where(condition);
            return this;
          }
        }, {
          key: "aliasBy",
          value: function aliasBy(alias) {
            this.parts[this.active].aliasBy(alias);
            return this;
          }
        }, {
          key: "shiftBy",
          value: function shiftBy(timeshift) {
            this.parts[this.active].shiftBy(timeshift);
            return this;
          }
        }, {
          key: "apply",
          value: function apply(fun) {
            var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

            if (_.isUndefined(this.active)) throw new Error("You need to select something before you can apply functions");

            var part = this.parts[this.active],
                fargs = [part].concat(args),
                f = new DalmatinerFunction(fun, fargs, this.variables);

            this.parts[this.active] = f;
            return this;
          }
        }, {
          key: "toString",
          value: function toString() {
            return this.toUserString() + ' ' + this._encodeRange();
          }
        }, {
          key: "toUserString",
          value: function toUserString() {
            return 'SELECT ' + this._encodeProjections().join(', ');
          }
        }, {
          key: "_encodeRange",
          value: function _encodeRange() {
            var ending = this.ending.utc().format("YYYY-MM-DD HH:mm:ss"),
                duration = Math.round((this.ending - this.beginning) / 1000);
            return "BEFORE \"" + ending + "\" FOR " + duration + "s";
          }
        }, {
          key: "_encodeProjections",
          value: function _encodeProjections() {
            return this.parts.map(function (p) {
              return p.encode();
            });
          }
        }], [{
          key: "equals",
          value: function equals(a, b) {
            return new DalmatinerQueryCondition('eq', a, b);
          }
        }, {
          key: "notEquals",
          value: function notEquals(a, b) {
            return new DalmatinerQueryCondition('neq', a, b);
          }
        }, {
          key: "present",
          value: function present(a) {
            return new DalmatinerQueryCondition('present', a);
          }
        }]);

        return DalmatinerQuery;
      }());

      _export("DalmatinerQuery", DalmatinerQuery);

      ;
    }
  };
});
//# sourceMappingURL=query.js.map

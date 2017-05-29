"use strict";

System.register(["lodash", "./query"], function (_export, _context) {
  "use strict";

  var _, DalmatinerQuery, _slicedToArray, _createClass, DalmatinerDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  // Decode data coming from Dalmatiner
  function decode_series(res) {
    var _res$data = res.data,
        start = _res$data.start,
        results = _res$data.results,
        start = start;

    return { data: (results || []).map(function (_ref9) {
        var name = _ref9.name,
            values = _ref9.values,
            resolution = _ref9.resolution;

        return {
          target: name.replace(/'/g, ""),
          datapoints: timestampPoints(values, start, resolution)
        };
      }) };
  }

  function decode_function_table(res) {
    var funTable = res.data.map(function (fun) {
      if (fun.combiner_type !== 'none') {
        return { category: 'Combine', name: fun.name, fun: fun.name, spec: [] };
      } else if (_.isEqual(fun.signature, ['metric'])) {
        return { category: 'Transform', name: fun.name, fun: fun.name, spec: [] };
      } else if (_.isEqual(fun.signature, ['metric', 'time'])) {
        return { category: 'Aggregate', name: fun.name, fun: fun.name, spec: [{ type: 'time', default: '$interval' }] };
      } else {
        return { category: 'Arithmetic', name: fun.name, fun: fun.name, spec: [{ type: 'number', default: '1' }] };
      }
    });

    var comparator = function comparator(x) {
      return x.category + "_" + x.name;
    };

    return _.sortBy(_.uniq(funTable, comparator, this), ['category', 'name']);
  }

  function timestampPoints(values, start, increment) {
    var r = new Array(values.length);
    for (var i = 0; i < values.length; i++) {
      r[i] = [values[i], start + i * increment];
    }
    return r;
  }

  function decodeList(res) {
    return _.map(res.data, function (item) {
      if (item === '') {
        return { value: '--empty--', html: '-- empty --' };
      } else if (typeof item == 'string') return { value: item, html: item };else return { value: item.key, html: item.label };
    });
  }

  function decodeMetrics(res) {
    var root = { children: {} };

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = res.data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _step3$value = _step3.value,
            key = _step3$value.key,
            parts = _step3$value.parts;

        var n = root;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = parts[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var part = _step4.value;

            if (!n.children[part]) {
              n.children[part] = {
                value: part,
                html: part,
                children: {}
              };
            }
            n = n.children[part];
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return root;
  }

  function decodeTags(ns, res) {
    return _.map(res.data, function (tag) {
      return {
        html: ns == '' ? tag : ns + ":" + tag,
        value: JSON.stringify([ns, tag]) };
    });
  }

  function queryFields(q, fields) {
    if (fields.hide) return q;

    q.from(fields.collection).select(fields.metric);

    if (!_.isEmpty(fields.tags)) {
      q.where(buildCondition(fields.tags));
    }
    _.each(fields.functions, function (fn) {
      q.apply(fn.fun || fn.name, fn.args);
    });

    if (!_.isEmpty(fields.alias)) {
      q.aliasBy(fields.alias);
    }

    if (!_.isEmpty(fields.timeshift)) {
      q.shiftBy(fields.timeshift);
    }

    return q;
  }

  function buildCondition(tokens) {
    var stack = [],
        condition;

    // First run is to expand all operators, leaving only condition objects and
    // condition keywords left on stack
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = tokens[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var token = _step5.value;

        if (token.type === 'value') {
          var operator = stack.pop(),
              key = stack.pop(),
              _c = void 0,
              v = void 0;
          assert(operator.type === 'operator', "Expected operator, but got: " + operator.type);
          assert(key.type === 'key', "Expected token key, but got: " + key.type);
          if (token.fake) {
            _c = null;
          } else if (key.value == '["dl","tag"]') {
            _c = DalmatinerQuery.present(['label', token.value]);
          } else if (operator.value === "!=") {
            v = token.value;
            _c = DalmatinerQuery.notEquals(JSON.parse(key.value), v);
          } else {
            v = token.value === '--empty--' ? v = '' : v = token.value;
            _c = DalmatinerQuery.equals(JSON.parse(key.value), v);
          }
          stack.push(_c);
        } else {
          stack.push(token);
        }
      }

      // Now we iterate through stack to combine all conditions joining them by
      // keyword
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    condition = stack.shift();
    while (stack.length) {
      var kwd = stack.shift(),
          c = stack.shift();
      if (condition === null) {
        continue;
      }
      assert(kwd.type === 'condition', "Expected condition keyword, but got: " + JSON.stringify(c));
      if (c === null) continue;
      switch (kwd.value) {
        case 'AND':
          condition = condition.and(c);
          break;
        case 'OR':
          condition = condition.or(c);
          break;
        default:
          throw new Error('Unexpected condition keyword: ' + kwd.value);
      }
    }

    return condition;
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_query) {
      DalmatinerQuery = _query.DalmatinerQuery;
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

      _export("DalmatinerDatasource", DalmatinerDatasource = function () {
        function DalmatinerDatasource(instanceSettings, $q, backendSrv) {
          _classCallCheck(this, DalmatinerDatasource);

          this.$q = $q;
          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.srv = backendSrv;
          if (instanceSettings.jsonData) {
            this.authToken = instanceSettings.jsonData.auth ? instanceSettings.jsonData.authToken : null;
          }
        }

        /*
         * Datasource api methods
         * ---------------------- */

        // used by panels to get data


        _createClass(DalmatinerDatasource, [{
          key: "query",
          value: function query(options) {
            var query = this.getQuery(options);

            if (!query) return this.$q.resolve({ data: [] });

            console.log('Running query: ' + query);
            return this._request('/?q=' + encodeURIComponent(query)).then(decode_series);
          }
        }, {
          key: "testDatasource",
          value: function testDatasource() {
            return this._request('').then(function (res) {
              if (res.status === 200) {
                return { status: "success", message: "Data source is working", title: "Success" };
              }
              return undefined;
            });
          }
        }, {
          key: "getQuery",
          value: function getQuery(options) {
            var range = options.range,
                interval = options.interval,
                targets = options.targets,
                q = new DalmatinerQuery(),
                auto_interval;


            if (targets.length <= 0) return null;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = targets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var fields = _step.value;

                if (fields.collection.value && fields.metric.length > 0) queryFields(q, fields);
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

            auto_interval = interval;
            if (/^[0-9]+s$/.exec(interval) && parseInt(interval) < 30) auto_interval = '30s';

            return q.beginningAt(range.from).endingAt(range.to).with('interval', interval).with('auto', auto_interval).toString();
          }
        }, {
          key: "getSimplifiedQuery",
          value: function getSimplifiedQuery(target) {
            var q = new DalmatinerQuery();
            queryFields(q, target);
            return q.with('interval', '$interval').with('auto', '$auto').toUserString();
          }
        }, {
          key: "getCollections",
          value: function getCollections() {
            return this._request('/collections').then(decodeList);
          }
        }, {
          key: "getTagKeys",
          value: function getTagKeys(_ref) {
            var _this = this;

            var collection = _ref.collection;

            var c = collection.value;
            return this._request("/collections/" + c + "/namespaces").then(function (res) {
              return _this.$q.all(_.reduce(res.data, function (acc, ns) {
                if (ns === 'label') acc.push({ html: 'dl:tag', value: '["dl","tag"]' });else if (ns != 'ddb') acc.push(_this.getTagNamespaceKeys({ collection: collection }, ns));
                return acc;
              }, []));
            }).then(function (keys) {
              return _.chain(keys).flatten().sortBy(function (i) {
                return i.html.replace(/^dl:/, '_');
              }).value();
            });
          }
        }, {
          key: "getTagNamespaceKeys",
          value: function getTagNamespaceKeys(_ref2, namespace) {
            var collection = _ref2.collection;

            var c = collection.value;
            return this._request("/collections/" + c + "/namespaces/" + namespace + "/tags").then(_.partial(decodeTags, namespace));
          }
        }, {
          key: "getTagValues",
          value: function getTagValues(_ref3, tag) {
            var collection = _ref3.collection;

            var _tag = _slicedToArray(tag, 2),
                namespace = _tag[0],
                key = _tag[1];

            if (namespace == 'dl' && key == 'tag') return this.getLabelTagValues({ collection: collection });else return this.getTrueTagValues({ collection: collection }, tag);
          }
        }, {
          key: "getLabelTagValues",
          value: function getLabelTagValues(_ref4) {
            var collection = _ref4.collection;

            var c = collection.value;
            return this._request("/collections/" + c + "/namespaces/label/tags").then(decodeList);
          }
        }, {
          key: "getTrueTagValues",
          value: function getTrueTagValues(_ref5, _ref6) {
            var collection = _ref5.collection;

            var _ref7 = _slicedToArray(_ref6, 2),
                namespace = _ref7[0],
                key = _ref7[1];

            var c = collection.value,
                p = "/collections/" + c + "/namespaces/" + namespace + "/tags/" + key + "/values";
            return this._request(p).then(decodeList);
          }
        }, {
          key: "getMetrics",
          value: function getMetrics(_ref8) {
            var collection = _ref8.collection;
            var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

            return this._request('/collections/' + collection.value + '/metrics').then(decodeMetrics).then(function (root) {
              var n = root;
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                for (var _iterator2 = prefix[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var p = _step2.value;

                  n = n.children[p];
                  if (!n) return [];
                }
              } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                  }
                } finally {
                  if (_didIteratorError2) {
                    throw _iteratorError2;
                  }
                }
              }

              return _.values(n.children);
            });
          }
        }, {
          key: "getFunctions",
          value: function getFunctions() {
            var _this2 = this;

            if (this.functionTable) {
              return this.$q.resolve(this.functionTable);
            } else {
              return this._request('/functions').then(decode_function_table).then(function (ft) {
                _this2.functionTable = ft;
                return ft;
              });
            }
          }
        }, {
          key: "_request",
          value: function _request(path) {
            var headers = { Accept: 'application/json' },
                options = { method: 'GET', url: this.url + path, headers: headers };
            if (this.authToken) {
              var sep = path.indexOf('?') >= 0 ? '&' : '?';
              path += sep + "token=" + this.authToken;
            }
            return this.srv.datasourceRequest({ method: 'GET', url: this.url + path, headers: headers });
          }
        }]);

        return DalmatinerDatasource;
      }());

      _export("DalmatinerDatasource", DalmatinerDatasource);

      ;
    }
  };
});
//# sourceMappingURL=datasource.js.map

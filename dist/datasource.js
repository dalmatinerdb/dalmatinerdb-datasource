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
    var _res$data = res.data;
    var s = _res$data.s;
    var d = _res$data.d;
    var start = s * 1000;
    return { data: (d || []).map(function (_ref7) {
        var n = _ref7.n;
        var v = _ref7.v;
        var r = _ref7.r;

        return {
          target: n,
          datapoints: timestampPoints(v, start, r)
        };
      }) };
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
      if (item == '') return { value: '--null--', html: '-- empty --' };
      return { value: item, html: item };
    });
  }

  function decodeMetrics(res) {
    var root = { children: {} };

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = res.data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var _step2$value = _step2.value;
        var key = _step2$value.key;
        var parts = _step2$value.parts;

        var n = root;
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = parts[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var part = _step3.value;

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

    return root;
  }

  function decodeTags(ns, res) {
    return _.map(res.data, function (tag) {
      return {
        html: ns == '' ? tag : ns + ":" + tag,
        value: JSON.stringify([ns, tag]) };
    });
  }

  function buildQuery(fields) {
    var q = new DalmatinerQuery().from(fields.collection).select(fields.metric);

    if (!_.isEmpty(fields.tags)) {
      q.where(buildCondition(fields.tags));
    }
    _.each(fields.functions, function (fn) {
      q.apply(fn.name, fn.args);
    });

    return q;
  }

  function buildCondition(tags) {
    var stack = [],
        condition;

    // First run is to expand all operators, leaving only condition objects and
    // condition keywords left on stack
    for (var i = 0, tag; i < tags.length; i++) {
      tag = tags[i];
      if (tag.type === 'value') {
        var operator = stack.pop(),
            key = stack.pop(),
            c = void 0;
        assert(operator.type === 'operator', "Expected operator, but got: " + operator.type);
        assert(key.type === 'key', "Expected tag key, but got: " + key.type);
        if (tag.fake) c = null;else if (tag.value === '--null--') c = DalmatinerQuery.present(JSON.parse(key.value));else c = DalmatinerQuery.equals(JSON.parse(key.value), tag.value);
        stack.push(c);
      } else {
        stack.push(tags[i]);
      }
    }

    // Now we iterate through stack to combine all conditions joining them by
    // keyword
    condition = stack.shift();
    while (stack.length) {
      var kwd = stack.shift(),
          _c = stack.shift();
      if (condition === null) {
        continue;
      }
      assert(kwd.type === 'condition', "Expected condition keyword, but got: " + JSON.stringify(_c));
      if (_c === null) continue;
      switch (kwd.value) {
        case 'AND':
          condition = condition.and(_c);
          break;
        case 'OR':
          condition = condition.or(_c);
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
            var range = options.range;
            var interval = options.interval;
            var targets = options.targets;
            var fields = targets[0];

            if (targets.length <= 0 || !fields.collection.value || fields.metric.length <= 0) return null;

            return buildQuery(fields).beginningAt(range.from).endingAt(range.to).with('interval', interval).toString();
          }
        }, {
          key: "getSimplifiedQuery",
          value: function getSimplifiedQuery(target) {
            return buildQuery(target).with('interval', '$interval').toUserString();
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
                if (ns != 'ddb') {
                  acc.push(_this.getTagNamespaceKeys({ collection: collection }, ns));
                }
                return acc;
              }, []));
            }).then(_.flatten);
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
          value: function getTagValues(_ref3, _ref4) {
            var collection = _ref3.collection;

            var _ref5 = _slicedToArray(_ref4, 2);

            var namespace = _ref5[0];
            var key = _ref5[1];

            var c = collection.value,
                p = "/collections/" + c + "/namespaces/" + namespace + "/tags/" + key + "/values";
            return this._request(p).then(decodeList);
          }
        }, {
          key: "getMetrics",
          value: function getMetrics(_ref6) {
            var collection = _ref6.collection;
            var prefix = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

            return this._request('/collections/' + collection.value + '/metrics').then(decodeMetrics).then(function (root) {
              var n = root;
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = prefix[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var p = _step.value;

                  n = n.children[p];
                  if (!n) return [];
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

              return _.values(n.children);
            });
          }
        }, {
          key: "_request",
          value: function _request(path) {
            var headers = arguments.length <= 1 || arguments[1] === undefined ? { Accept: 'application/json' } : arguments[1];

            if (this.authToken) {
              headers['Authorization'] = "Bearer " + this.authToken;
            }
            return this.srv.datasourceRequest({ url: this.url + path, headers: headers });
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

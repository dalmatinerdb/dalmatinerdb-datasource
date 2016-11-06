'use strict';

System.register(['./func_editor', './metric_segment', 'lodash', 'app/plugins/sdk'], function (_export, _context) {
  "use strict";

  var _, QueryCtrl, _createClass, DalmatinerQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

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

  return {
    setters: [function (_func_editor) {}, function (_metric_segment) {}, function (_lodash) {
      _ = _lodash.default;
    }, function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }],
    execute: function () {
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

      _export('DalmatinerQueryCtrl', DalmatinerQueryCtrl = function (_QueryCtrl) {
        _inherits(DalmatinerQueryCtrl, _QueryCtrl);

        function DalmatinerQueryCtrl($scope, $injector, uiSegmentSrv, $q) {
          _classCallCheck(this, DalmatinerQueryCtrl);

          var _this = _possibleConstructorReturn(this, (DalmatinerQueryCtrl.__proto__ || Object.getPrototypeOf(DalmatinerQueryCtrl)).call(this, $scope, $injector));

          _this.$q = $q;
          _this.uiSegmentSrv = uiSegmentSrv;

          _this.target.collection = _this.target.collection || uiSegmentSrv.newFake('select collection');
          _this.target.tags = _this.target.tags || [];
          _this.target.metric = _this.target.metric || [];
          _this.target.functions = _this.target.functions || [];
          _this.new_tag = uiSegmentSrv.newPlusButton();
          _this.new_func = uiSegmentSrv.newPlusButton();
          _this.new_func.cssClass = 'query-part';
          _this.new_metric_part = uiSegmentSrv.newFake('...');
          _this._getAvailableFunctions();
          return _this;
        }

        /**
         * Methods used by view
         * -------------------- */

        _createClass(DalmatinerQueryCtrl, [{
          key: 'getCollapsedText',
          value: function getCollapsedText() {
            return this.datasource.getSimplifiedQuery(this.target);
          }
        }, {
          key: 'getCollections',
          value: function getCollections() {
            return this.datasource.getCollections();
          }
        }, {
          key: 'getTagKeys',
          value: function getTagKeys() {
            return this.datasource.getTagKeys(this.target);
          }
        }, {
          key: 'getTagValues',
          value: function getTagValues(tagKey) {
            return this.datasource.getTagValues(this.target, tagKey);
          }
        }, {
          key: 'getTagConditions',
          value: function getTagConditions() {
            return [this._newCondition('AND'), this._newCondition('OR')];
          }
        }, {
          key: 'getTagOperators',
          value: function getTagOperators() {
            return [this._newOperator('='), this._newOperator('!=')];
          }
        }, {
          key: 'getTagOptionsAt',
          value: function getTagOptionsAt(index) {
            var seg = this.target.tags[index],
                type = seg.type,
                tagKeyValue;


            switch (type) {
              case 'key':
                return this.getTagKeys();
              case 'value':
                tagKeyValue = this.target.tags[index - 2].value;
                return this.getTagValues(JSON.parse(tagKeyValue));
              case 'condition':
                return this.$q.resolve(this.getTagConditions());
              case 'operator':
                return this.$q.resolve(this.getTagOperators());
              default:
                throw new Error('Invalid segment type: ' + type);
            }
          }
        }, {
          key: 'getMetricOptionsAt',
          value: function getMetricOptionsAt(index) {
            var metric = this.target.metric,
                parts = index >= 0 ? metric.slice(0, index) : metric,
                prefix = _.map(parts, 'value');

            return this.datasource.getMetrics(this.target, prefix);
          }
        }, {
          key: 'addTag',
          value: function addTag() {
            var _new_tag = this.new_tag,
                html = _new_tag.html,
                value = _new_tag.value,
                tags = this.target.tags,
                key = this.uiSegmentSrv.newKey(value);


            key.html = html;
            if (tags.length > 0) tags.push(this.getTagConditions()[0]);
            tags.push(key, this.getTagOperators()[0], { html: '...', value: '...', fake: true, type: 'value' });
            this.new_tag.value = null;
            this.new_tag.html = this.uiSegmentSrv.newPlusButton().html;
            this.refresh();
          }
        }, {
          key: 'onTagSegmentChange',
          value: function onTagSegmentChange(index) {
            var seg = this.target.tags[index];
            if (seg.type === 'key') {
              this.target.tags[index + 2] = { html: '...', value: '...', fake: true, type: 'value' };
            }
            this.refresh();
          }
        }, {
          key: 'addFunction',
          value: function addFunction(category, newFunc) {
            var functions = this.target.functions,
                name = this.new_func.value,
                info = this._getFunctionOption(category.text, newFunc.value),
                defaults = _.map(info.spec, function (s) {
              return s.default || '';
            });


            functions.push({
              name: info.name,
              fun: info.fun,
              args: defaults,
              spec: info.spec
            });

            this.new_func.value = null;
            this.new_func.html = this.uiSegmentSrv.newPlusButton().html;
            this.refresh();
          }
        }, {
          key: 'removeFunction',
          value: function removeFunction(index) {
            this.target.functions.splice(index, 1);
          }
        }, {
          key: 'moveFunction',
          value: function moveFunction(from, to) {
            var functions = this.target.functions;

            if (to >= 0 && to < functions.length) {
              _.move(functions, from, to);
            }
          }
        }, {
          key: 'updateFunctionArg',
          value: function updateFunctionArg(funcIndex, argIndex, value) {
            var functions = this.target.functions;

            if (functions[funcIndex] && argIndex < functions[funcIndex].args.length) {
              functions[funcIndex].args[argIndex] = value;
            }
          }
        }, {
          key: 'addMetricPart',
          value: function addMetricPart() {
            var value = this.new_metric_part.value;


            this.target.metric.push({ value: value, html: value });
            this.new_metric_part.value = null;
            this.new_metric_part.html = '...';
            this.refresh();
          }
        }, {
          key: 'onMetricSegmentChange',
          value: function onMetricSegmentChange(index) {
            this.target.metric.splice(index + 1);
            this.refresh();
          }
        }, {
          key: 'removeWhereSegment',
          value: function removeWhereSegment(index) {
            var tags = this.target.tags;

            tags.splice(index, 4);
            if (tags.length === 4) {
              tags.pop();
            }
            this.refresh();
          }
        }, {
          key: '_newCondition',
          value: function _newCondition(value) {
            return this.uiSegmentSrv.newSegment({ value: value, html: value, type: 'condition',
              cssClass: 'query-keyword' });
          }
        }, {
          key: '_newOperator',
          value: function _newOperator(value) {
            return this.uiSegmentSrv.newSegment({ value: value, html: value, type: 'operator',
              cssClass: 'query-segment-operator' });
          }
        }, {
          key: '_getFunctionOption',
          value: function _getFunctionOption(category, name) {
            return _.find(this._availableFunctions, { category: category, name: name });
          }
        }, {
          key: '_getAvailableFunctions',
          value: function _getAvailableFunctions() {
            var _this2 = this;

            this.datasource.getFunctions().then(function (infos) {
              _this2.functionsSubMenu = _this2._buildFunctionsDropdown(infos);
              _this2._availableFunctions = infos;
            });
          }
        }, {
          key: '_buildFunctionsDropdown',
          value: function _buildFunctionsDropdown(infos) {
            var menu = _.reduce(infos, function (memo, info) {
              var newMenuItem = { text: info.fun, value: info.fun };

              if (memo[info.category]) {
                memo[info.category].submenu.push(newMenuItem);
              } else {
                memo[info.category] = { text: info.category, submenu: [newMenuItem] };
              }
              return memo;
            }, []);

            return Object.keys(menu).map(function (key) {
              return menu[key];
            });
          }
        }]);

        return DalmatinerQueryCtrl;
      }(QueryCtrl));

      _export('DalmatinerQueryCtrl', DalmatinerQueryCtrl);

      ;

      DalmatinerQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map

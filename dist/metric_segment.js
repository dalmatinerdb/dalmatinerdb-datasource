'use strict';

System.register(['lodash', 'jquery', 'angular'], function (_export, _context) {
  "use strict";

  var _, $, angular, mod;

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_angular) {
      angular = _angular.default;
    }],
    execute: function () {
      mod = angular.module('grafana.directives');


      mod.filter('to_trusted', ['$sce', function ($sce) {
        return function (values, type) {
          values.forEach(function (v) {
            return v.html = $sce.getTrustedHtml(v.html);
          });
          return values;
        };
      }]);

      mod.directive('dalmatinerMetricSegment', function ($compile, $sce) {
        var inputTemplate = '<input type="text" data-provide="typeahead" ' + ' class="gf-form-input input-medium"' + ' spellcheck="false" style="display:none"></input>';

        var linkTemplate = '<a class="gf-form-label" ng-class="segment.cssClass" ' + 'tabindex="1" give-focus="segment.focus" ng-bind-html="segment.html"></a>';

        var selectTemplate = '<a class="gf-form-input gf-form-input--dropdown" ng-class="segment.cssClass" ' + 'tabindex="1" give-focus="segment.focus" ng-bind-html="segment.html"></a>';

        return {
          restrict: 'E',
          scope: {
            segment: "=",
            getOptions: "&",
            onChange: "&",
            useHtmlLabel: "&"
          },
          link: function link($scope, elem, attrs) {
            var $input = $(inputTemplate);
            var $button = $(attrs.styleMode === 'select' ? selectTemplate : linkTemplate);
            var segment = $scope.segment;
            var options = null;
            var cancelBlur = null;
            var linkMode = true;

            $input.appendTo(elem);
            $button.appendTo(elem);

            $scope.updateVariableValue = function (value) {
              if (value === '' || segment.value === value) {
                return;
              }

              $scope.$apply(function () {
                var selected = _.find($scope.altSegments, { value: value });
                if (selected) {
                  segment.value = selected.value;
                  segment.html = selected.html;
                  segment.fake = false;
                  segment.expandable = selected.expandable;
                } else if (segment.custom !== 'false') {
                  segment.value = value;
                  segment.html = $sce.trustAsHtml(value);
                  segment.expandable = true;
                  segment.fake = false;
                }

                $scope.onChange();
              });
            };

            $scope.switchToLink = function (fromClick) {
              if (linkMode && !fromClick) {
                return;
              }

              clearTimeout(cancelBlur);
              cancelBlur = null;
              linkMode = true;
              $input.hide();
              $button.show();
              $scope.updateVariableValue($input.val());
            };

            $scope.inputBlur = function () {
              // happens long before the click event on the typeahead options
              // need to have long delay because the blur
              cancelBlur = setTimeout($scope.switchToLink, 200);
            };

            $scope.source = function (query, callback) {
              if (options) {
                return options;
              }

              $scope.$apply(function () {
                $scope.getOptions().then(function (altSegments) {
                  $scope.altSegments = altSegments;
                  options = _.map($scope.altSegments, function (alt) {
                    return alt.value;
                  });

                  // add custom values
                  if (segment.custom !== 'false') {
                    if (!segment.fake && _.indexOf(options, segment.value) === -1) {
                      options.unshift(segment.value);
                    }
                  }

                  callback(options);

                  // Change the label options to the html values
                  if ($scope.useHtmlLabel) {

                    $input.data('typeahead').$menu.find('a').each(function () {
                      var $el = $(this);
                      var item = _.find($scope.altSegments, { value: $el.text() });
                      if (item) {
                        $el.text(item.html);
                      }
                    });
                  }
                });
              });
            };

            $scope.updater = function (value) {
              if (value === segment.value) {
                clearTimeout(cancelBlur);
                $input.focus();
                return value;
              }

              $input.val(value);
              $scope.switchToLink(true);

              return value;
            };

            $scope.matcher = function (item) {
              var str = this.query;
              if (str[0] === '/') {
                str = str.substring(1);
              }
              if (str[str.length - 1] === '/') {
                str = str.substring(0, str.length - 1);
              }
              try {
                return item.toLowerCase().match(str);
              } catch (e) {
                return false;
              }
            };

            $input.attr('data-provide', 'typeahead');
            $input.typeahead({ source: $scope.source, minLength: 0, items: 10000, updater: $scope.updater, matcher: $scope.matcher });

            var typeahead = $input.data('typeahead');
            typeahead.lookup = function () {
              this.query = this.$element.val() || '';
              var items = this.source(this.query, $.proxy(this.process, this));
              return items ? this.process(items) : items;
            };

            $button.keydown(function (evt) {
              // trigger typeahead on down arrow or enter key
              if (evt.keyCode === 40 || evt.keyCode === 13) {
                $button.click();
              }
            });

            $button.click(function () {
              options = null;
              $input.css('width', $button.width() + 16 + 'px');

              $button.hide();
              $input.show();
              $input.focus();

              linkMode = false;

              var typeahead = $input.data('typeahead');
              if (typeahead) {
                $input.val('');
                typeahead.lookup();
              }
            });

            $input.blur($scope.inputBlur);

            $compile(elem.contents())($scope);
          }
        };
      });
    }
  };
});
//# sourceMappingURL=metric_segment.js.map

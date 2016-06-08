'use strict';

System.register(['lodash', 'jquery', 'angular'], function (_export, _context) {
  "use strict";

  var _, $, angular, KEY_ESC, KEY_ENTER;

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_angular) {
      angular = _angular.default;
    }],
    execute: function () {
      KEY_ESC = 27;
      KEY_ENTER = 13;


      angular.module('grafana.directives').directive('dalmatinerFuncEditor', function ($compile, templateSrv) {

        var tmplLabel = '<a ng-click="" title="Toggle function options">{{func.name}}</a>';

        var tmplArg = '<input type="text" style="display: none; height: 1em;" ' + 'class="input-mini tight-form-func-param"></input>';

        var tmplTools = '<div class="tight-form-func-controls">' + '<span class="pointer fa fa-arrow-left" ' + 'title="Swap this function with previous function"></span>' + '<span class="pointer fa fa-remove" title="Remove this function" ' + 'style="margin-right: 10px; font-size: 15px;"></span>' + '<span class="pointer fa fa-arrow-right" ' + 'title="Swap this function with next function"></span>' + '</div>';

        return {
          restrict: 'A',
          link: function postLink($scope, el) {

            var $tmplLabel = $(tmplLabel);
            var $tmplTools = $(tmplTools);

            var ctrl = $scope.ctrl;
            var func = $scope.func;

            function addElementsAndCompile() {

              $tmplTools.appendTo(el);
              $tmplLabel.appendTo(el);

              $('<span>(</span>').appendTo(el);

              _.each(func.args, function (arg, argIndex) {

                var argValue = templateSrv.highlightVariablesAsHtml(arg);
                var $argField = $(tmplArg);

                var $argLabel = $('<a ng-click="" class="graphite-func-param-link" ' + ('title="Edit function argument">' + argValue + '</a>'));

                if (argIndex > 0) {
                  $('<span>, </span>').appendTo(el);
                }

                $argLabel.appendTo(el);
                $argField.appendTo(el);

                $argField.blur(_.partial(onArgEditDone, $argLabel, $argField, argIndex));
                $argField.keyup(_.partial(onArgKeyPress, $argLabel, $argField, argIndex));
                $argLabel.click(_.partial(onArgLabelClick, $argLabel, $argField, argIndex));
              });

              $('<span>)</span>').appendTo(el);

              $compile(el.contents())($scope);
            }

            function onArgLabelClick($label, $field, argIndex) {
              $field.val(func.args[argIndex]);
              $field.css('width', $label.width() + 2 * $label.height() + 'px');
              $label.hide();
              $field.show();
              $field.focus();
              $field.select();
            }

            function onArgEditDone($label, $field, argIndex) {

              var newValue = $field.val();

              if (newValue && newValue !== func.args[argIndex]) {
                $label.html(templateSrv.highlightVariablesAsHtml(newValue));
                $scope.$apply(function () {
                  return ctrl.updateFunctionArg($scope.$index, argIndex, newValue);
                });
              }

              $field.hide();
              $label.show();
            }

            function onArgKeyPress($label, $field, argIndex, event) {
              switch (event.which) {
                case KEY_ESC:
                  $field.val(func.args[argIndex]);
                  $field.hide();
                  $label.show();
                  break;
                case KEY_ENTER:
                  onArgEditDone($label, $field, argIndex);
                  break;
              }
            }

            function registerLabelClick() {
              $tmplLabel.click(toggleTools);
            }

            function registerToolsClick() {
              $tmplTools.click(function (event) {
                var $target = $(event.target);
                switch (true) {
                  case $target.hasClass('fa-remove'):
                    $scope.$apply(function () {
                      return ctrl.removeFunction($scope.$index);
                    });
                    break;
                  case $target.hasClass('fa-arrow-left'):
                    $scope.$apply(function () {
                      return ctrl.moveFunction($scope.$index, $scope.$index - 1);
                    });
                    break;
                  case $target.hasClass('fa-arrow-right'):
                    $scope.$apply(function () {
                      return ctrl.moveFunction($scope.$index, $scope.$index + 1);
                    });
                    break;
                }
              });
            }

            function toggleTools() {

              var FLAG = 'is-open';
              var toolBar = el.closest('.tight-form');

              if (el.hasClass(FLAG)) {
                el.removeClass(FLAG);
                $tmplTools.hide();
              } else {
                el.addClass(FLAG);
                $tmplTools.show();
              }
            }

            function relink() {
              el.children().remove();
              addElementsAndCompile();
              registerLabelClick();
              registerToolsClick();
            }

            relink();
          }
        };
      });
    }
  };
});
//# sourceMappingURL=func_editor.js.map

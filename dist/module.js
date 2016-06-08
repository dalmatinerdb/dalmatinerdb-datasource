'use strict';

System.register(['./datasource', './query_ctrl'], function (_export, _context) {
  "use strict";

  var DalmatinerDatasource, DalmatinerQueryCtrl, DalmatinerConfigCtrl, DalmatinerQueryOptionsCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      DalmatinerDatasource = _datasource.DalmatinerDatasource;
    }, function (_query_ctrl) {
      DalmatinerQueryCtrl = _query_ctrl.DalmatinerQueryCtrl;
    }],
    execute: function () {
      _export('ConfigCtrl', DalmatinerConfigCtrl = function DalmatinerConfigCtrl() {
        _classCallCheck(this, DalmatinerConfigCtrl);
      });

      DalmatinerConfigCtrl.templateUrl = 'partials/config.html';

      _export('QueryOptionsCtrl', DalmatinerQueryOptionsCtrl = function DalmatinerQueryOptionsCtrl() {
        _classCallCheck(this, DalmatinerQueryOptionsCtrl);
      });

      DalmatinerQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

      _export('Datasource', DalmatinerDatasource);

      _export('QueryCtrl', DalmatinerQueryCtrl);

      _export('ConfigCtrl', DalmatinerConfigCtrl);

      _export('QueryOptionsCtrl', DalmatinerQueryOptionsCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map

import {DalmatinerDatasource} from './datasource';
import {DalmatinerQueryCtrl} from './query_ctrl';

class DalmatinerConfigCtrl {}
DalmatinerConfigCtrl.templateUrl = 'partials/config.html';

class DalmatinerQueryOptionsCtrl {}
DalmatinerQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

export {
  DalmatinerDatasource as Datasource,
  DalmatinerQueryCtrl as QueryCtrl,
  DalmatinerConfigCtrl as ConfigCtrl,
  DalmatinerQueryOptionsCtrl as QueryOptionsCtrl,
};

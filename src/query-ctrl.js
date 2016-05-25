import {QueryCtrl} from 'app/plugins/sdk';


export class DalmatinerQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv) {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.collection = this.target.collection || 'choose collection';
    this.target.metric = this.target.metric || 'choose metric';
  }

  onChange(Arg) {
    this.panelCtrl.refresh();
  }

  getCollapsedText() {
    return this.datasource.getSimplifiedQuery(this.target);
  }

  getCollections() {
    return this.datasource.getCollections()
      .then(this.uiSegmentSrv.transformToSegments(false));
  }

  getMetrics() {
    return this.datasource.getMetrics(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
  }
};

DalmatinerQueryCtrl.templateUrl = 'partials/query-editor.html';

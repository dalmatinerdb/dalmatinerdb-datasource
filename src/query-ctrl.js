import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';


export class DalmatinerQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv) {
    super($scope, $injector);
    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.collection = this.target.collection || 'select collection';
    this.target.metric = this.target.metric || [];

    this.metricSegments = _.map(this.target.metric, (part) => {
      return this.uiSegmentSrv.newSegment({value: part});
    }).concat([
      this.uiSegmentSrv.newSegment({value: '...'})
    ]);
  }

  onMetricSegmentChange(segment, index) {
    this.metricSegments.splice(index + 1, this.metricSegments.length - 2,
                               this.uiSegmentSrv.newSegment({value: '...'}));
    this.target.metric = _.map(this.metricSegments.slice(0, -1), 'value');
    this.refresh();
  }

  getCollapsedText() {
    return this.datasource.getSimplifiedQuery(this.target);
  }

  getCollections() {
    return this.datasource.getCollections()
      .then(this.uiSegmentSrv.transformToSegments(false));
  }

  getMetrics(index) {
    var prefix = _.map(this.metricSegments.slice(0, index), 'value');
    return this.datasource.getMetrics(this.target, prefix)
      .then(this.uiSegmentSrv.transformToSegments(true));
  }
};

DalmatinerQueryCtrl.templateUrl = 'partials/query-editor.html';

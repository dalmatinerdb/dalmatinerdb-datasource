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
      return this._newTextSegment(part);
    }).concat([
      this._newPlaceholderSegment()
    ]);
  }

  /**
   * Methods used by view
   * -------------------- */

  onMetricSegmentChange(segment, index) {
    this.metricSegments.splice(index + 1, this.metricSegments.length - 2,
                               this._newPlaceholderSegment());
    this.target.metric = _.map(this.metricSegments.slice(0, -1), 'value');
    this.refresh();
  }

  getCollapsedText() {
    return this.datasource.getSimplifiedQuery(this.target);
  }

  getCollections() {
    return this.datasource.getCollections()
      .then(this._convertToSegments());
  }

  getMetrics(index) {
    var prefix = _.map(this.metricSegments.slice(0, index), 'value');
    return this.datasource.getMetrics(this.target, prefix)
      .then(this._convertToSegments());
  }

  /**
   * internal utilities
   * ------------------ */

  _newTextSegment(text) {
    return this.uiSegmentSrv.newSegment({value: text});
  }

  _newPlaceholderSegment() {
    return this.uiSegmentSrv.newSegment({value: '...', fake:true});
  }

  _newSegment({text}) {
    return this._newTextSegment(text);
  }

  _convertToSegments() {
    var fn = this._newSegment.bind(this);
    return function(Objs) {
      return _.map(Objs, fn);
    };
  }
};

DalmatinerQueryCtrl.templateUrl = 'partials/query.editor.html';

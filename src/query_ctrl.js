import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';


export class DalmatinerQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv, $q) {
    super($scope, $injector);
    this.$q = $q;
    this.uiSegmentSrv = uiSegmentSrv;

    this.target.collection = this.target.collection ||
      uiSegmentSrv.newFake('select collection');
    this.target.tags = this.target.tags || [];
    this.target.metric = this.target.metric || [];

    this.new_tag = uiSegmentSrv.newPlusButton();
    this.new_metric_part = uiSegmentSrv.newFake('...');
  }

  /**
   * Methods used by view
   * -------------------- */

  getCollapsedText() {
    return this.datasource.getSimplifiedQuery(this.target);
  }

  getCollections() {
    return this.datasource.getCollections();
  }

  getTagKeys() {
    return this.datasource.getTagKeys(this.target);
  }

  getTagValues(tagKey) {
    return this.datasource.getTagValues(this.target, tagKey);
  }

  // Get list of supported tag join conditions, first will be used as default
  getTagConditions() {
    return [this._newCondition('AND'),
            this._newCondition('OR')];
  }

  // Get list of supported tag matching operators, first will be used as default
  getTagOperators() {
    return [this._newOperator('=')];
  }

  getTagOptionsAt(index) {
    var seg = this.target.tags[index],
        {type} = seg,
        tagKeyValue;

    switch (type) {
    case ('key'):
      return this.getTagKeys();
    case ('value'):
      tagKeyValue = this.target.tags[index - 2].value;
      return this.getTagValues(JSON.parse(tagKeyValue));
    case ('condition'):
      return this.$q.resolve(this.getTagConditions());
    case ('operator'):
      return this.$q.resolve(this.getTagOperators());
    }

    return this.datasource.getScopeOptions(this.target, index);
  }

  getMetricOptionsAt(index) {
    var metric = this.target.metric,
        parts = index >= 0 ? metric.slice(0, index) : metric,
        prefix = _.map(metric, 'value');

    return this.datasource.getMetrics(this.target, prefix);
  }

  addTag() {
    var {html, value} = this.new_tag,
        tags = this.target.tags,
        key = this.uiSegmentSrv.newKey(value);

    key.html = html;
    if (tags.length > 0)
      tags.push(this.getTagConditions()[0]);
    tags.push(key,
              this.getTagOperators()[0],
              this.uiSegmentSrv.newKeyValue('""'));
    this.new_tag.value = null;
    this.new_tag.html = this.uiSegmentSrv.newPlusButton().html;
    this.refresh();
  }

  addMetricPart() {
    var {value} = this.new_metric_part;

    this.target.metric.push({value: value, html: value});
    this.new_metric_part.value = null;
    this.new_metric_part.html = '...';
    this.refresh();
  }

  onMetricSegmentChange(segment, index) {
    this.target.metric.splice(index + 1);
    this.refresh();
  }

  /**
   * Internal function
   */

  _newCondition(value) {
    return this.uiSegmentSrv.newSegment({value, html: value, type: 'condition',
                                         cssClass: 'query-keyword'});
  }

  _newOperator(value) {
    return this.uiSegmentSrv.newSegment({value, html: value, type: 'operator',
                                         cssClass: 'query-segment-operator'});
  }
};

DalmatinerQueryCtrl.templateUrl = 'partials/query.editor.html';

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
    //TODO: switch to live values once service API supports it
    //return this.datasource.getTagKeys(this.target);
    return Promise.resolve([
      {type: 'key', html: 'tag:production', value: '["tag","production"]'},
      {type: 'key', html: 'tag:web', value: '["tag","web"]'},
      {type: 'key', html: 'region', value: '["","region"]'}
    ]);
  }

  getTagValues(tagKey) {
    //TODO: switch to live values once service API supports it
    //return this.datasource.getTagValues(this.target, tagKey);
    return Promise.resolve([
      {type: 'value', value: '""', html: '""'},
      {type: 'value', value: 'EU', html: 'EU'},
      {type: 'value', value: 'US', html: 'US'}
    ]);
  }

  // Get list of supported tag join conditions, first will be used as default
  getTagConditions() {
    return [this.uiSegmentSrv.newCondition('AND'),
            this.uiSegmentSrv.newCondition('OR')];
  }

  // Get list of supported tag matching operators, first will be used as default
  getTagOperators() {
    return [this.uiSegmentSrv.newOperator('=')];
  }

  getTagOptionsAt(index) {
    var seg = this.target.tags[index],
        {type, value} = seg;

    switch (type) {
    case ('key'):
      return this.getTagKeys();
    case ('value'):
      return this.getTagValues(JSON.parse(value));
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
};

DalmatinerQueryCtrl.templateUrl = 'partials/query.editor.html';

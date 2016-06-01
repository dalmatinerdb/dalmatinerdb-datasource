import _ from "lodash";
import moment from "moment";


export class DalmatinerQuery {

  constructor() {}

  /**
   * Chain-able setters
   */
  from(c) {
    this.collection = c.value ? c.value : c.toString();
    return this;
  }
  
  select(m) {
    this.metric = _.map(m, function (mpart) {
      return mpart.value ? mpart.value : mpart.toString();
    });
    return this;
  }

  beginningAt(t) {
    this.beginning = moment(t);
    return this;
  }

  endingAt(t) {
    this.ending = moment(t);
    return this;
  }

  in(i) {
    this.internal = i;
    return this;
  }
  
  /**
   * Reading function
   */

  toString() {
    return this.toUserString() + ' ' + this._encodeRange();
  }
  
  toUserString() {
    var metric = this._encodeMetric(),
        collection = this._encodeCollection();
    return `SELECT ${metric} IN ${collection}`;
  }

  /**
   * Internal methods
   */
  _encodeCollection() {
    return `'${this.collection}'`;
  }

  _encodeMetric() {
    return _.map(this.metric, function(part) {
      return `'${part}'`;
    }).join('.');
  }

  _encodeRange() {
    var ending = this.ending.utc().format("YYYY-MM-DD HH:mm:ss"),
        duration = Math.round((this.ending - this.beginning) / 1000);
    return `BEFORE "${ending}" FOR ${duration}s`;
  }
};

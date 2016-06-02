import _ from "lodash";
import moment from "moment";


class DalmatinerQueryCondition {
  constructor (op, ...args) {
    this.op = op;
    this.args = args;
  }

  and (other) {
    return new DalmatinerQueryCondition('and', this, other);
  }

  or (other) {
    return new DalmatinerQueryCondition('or', this, other);
  }

  toString() {
    var ns, key, value, a, b;
    switch (this.op) {
    case ('eq'):
      [[ns, key], value] = this.args;
      return ns ? `${ns}:'${key}' = '${value}'` :
        `'${key}' = '${value}'`;
    case ('and'):
      [a, b] = this.args;
      return `${a} AND ${b}`;
    case ('or'):
      [a, b] = this.args;
      return `${a} OR ${b}`;
    }
    return '';
  }
}


export class DalmatinerQuery {

  constructor() {
    this.variables = {};
  }

  static equals(a, b) {
    return new DalmatinerQueryCondition('eq', a, b);
  }

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

  with(name, value) {
    this.variables[name] = value;
    return this;
  }

  where(condition) {
    if (! condition instanceof DalmatinerQueryCondition) {
      throw new Error("Invalid query condition");
    }
    this.condition = condition;
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
        collection = this._encodeCollection(),
        str = `SELECT ${metric} IN ${collection}`;
    if (this.condition) {
      str += ` WHERE ${this.condition}`;
    }
    return str;
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

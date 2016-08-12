import _ from "lodash";
import moment from "moment";

function _assert(condition, message) {
  if (! condition) {
    throw new Error(message);
  }
}

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
    var tag, value, a, b;
    switch (this.op) {
    case ('eq'):
      [tag, value] = this.args;
      return `${this._encodeTag(tag)} = '${value}'`;
    case ('neq'):
      [tag, value] = this.args;
      return `${this._encodeTag(tag)} != '${value}'`;
    case ('present'):
      [tag] = this.args;
      return this._encodeTag(tag);
    case ('and'):
      [a, b] = this.args;
      return `${a} AND ${b}`;
    case ('or'):
      [a, b] = this.args;
      return `${a} OR ${b}`;
    }
    return '';
  }

  _encodeTag([ns, key]) {
    return ns ? `${ns}:'${key}'` : `'${key}'`;
  }
}

class DalmatinerProjection {
  constructor(refId) {
    this.refId = refId || '';
  }

  aliasBy(alias) {
    this.alias = alias;
    return this;
  }

  shiftBy(timeshift) {
    this.timeshift = timeshift;
    return this;
  }

  setVisibility(hidden) {
    this.hidden = hidden;
    return this;
  }

  encode() {
    var str = this.toString();
    if (this.alias) {
      str += ` AS ${this.alias}`;
    }
    if (this.timeshift) {
      str += ` SHIFT BY ${this.timeshift}`;
    }
    return str;
  }
}

class DalmatinerFunction extends DalmatinerProjection {
  constructor(fun, args, vars, refId) {
    super(refId);
    this.fun = fun;
    this.args = args;
    this.vars = vars;
    this._encodeArg = this._encodeArg.bind(this);
  }

  toString() {
    var args = this.args.map(this._encodeArg);
    return `${this.fun}(${args.join(', ')})`;
  }

  _encodeArg(arg) {
    if (typeof arg === 'string' && arg[0] === '$') {
      let varname = arg.slice(1);
      arg = this.vars[varname];
      _assert(!(_.isUndefined(arg)), `Variable ${varname} was not declared`);
    }
    return '' + arg;
  }
}

class DalmatinerSelector extends DalmatinerProjection {

  constructor(collection, metric, refId) {
    super(refId);
    this.collection = collection;
    this.metric = _.map(metric, function (mpart) {
      return mpart.value ? mpart.value : mpart.toString();
    });
  }

  where(condition) {
    this.condition = condition;
    return this;
  }

  toString() {
    var metric = this._encodeMetric(),
        collection = this._encodeCollection(),
        str = `${metric} FROM ${collection}`;
    if (this.condition) {
      str += ` WHERE ${this.condition}`;
    }
    return str;
  }

  _encodeCollection() {
    return `'${this.collection}'`;
  }

  _encodeMetric() {
    return _.map(this.metric, function(part) {
      if (part === '*')
        return `${part}`;
      else
        return `'${part}'`;
    }).join('.');
  }
}

export class DalmatinerQuery {

  constructor() {
    this.variables = {};
    this.parts = [];
    this.selectors = [];
  }

  static equals(a, b) {
    return new DalmatinerQueryCondition('eq', a, b);
  }

  static notEquals(a, b) {
    return new DalmatinerQueryCondition('neq', a, b);
  }

  static present(a) {
    return new DalmatinerQueryCondition('present', a);
  }

  /**
   * Chain-able setters
   */
  from(c) {
    this.collection = c.value ? c.value : c.toString();
    return this;
  }

  select(m, refId) {
    _assert(this.collection,
        "You need to set collection (from statement) before selecting metric");
    var selector = new DalmatinerSelector(this.collection, m, refId);
    this.selectors.push(selector);
    this.parts.push(selector);
    this.active = this.parts.length - 1;
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
    _assert(condition instanceof DalmatinerQueryCondition, "Invalid query condition");
    this.selectors[this.active].where(condition);
    return this;
  }

  aliasBy(alias) {
    this.parts[this.active].aliasBy(alias);
    return this;
  }

  shiftBy(timeshift) {
    this.parts[this.active].shiftBy(timeshift);
    return this;
  }

  setVisibility(hidden) {
    this.parts[this.active].setVisibility(hidden);
    return this;
  }

  apply(fun, args = []) {
    _assert(!(_.isUndefined(this.active)),
      "You need to select something before you can apply functions");

    var part = this.parts[this.active],
        fargs = [part].concat(args),
        f = new DalmatinerFunction(fun, fargs, this.variables, part.refId);

    this.parts[this.active] = f;
    return this;
  }

  applyToSeries(fun, args = [], refId) {
    const refIdRegex = /#([A-Z])/;

    _assert(!(_.isUndefined(this.active)),
      "You need to select something before you can apply functions");
    _assert(refIdRegex.test(_.head(args)), "Invalid reference for series");

    var targetRefId = refIdRegex.exec(_.head(args))[1],
        part = this.parts[this.active],
        refPart = _.find(this.parts, p => { return p.refId === targetRefId; }),
        fargs = [],
        f = null;

    _assert(!(_.isUndefined(refPart)), "Invalid reference for series");

    fargs = [part].concat(refPart),
    f = new DalmatinerFunction(fun, fargs, this.variables, part.refId);
    this.parts[this.active] = f;
    return this;
  }

  /**
   * Reading function
   */
  toString() {
    if (!this._visibleParts().length)
      return '';
    else
      return this.toUserString() + ' ' + this._encodeRange();
  }

  toUserString() {
    return 'SELECT ' + this._encodeProjections().join(', ');
  }

  /**
   * Internal methods
   */

  _encodeRange() {
    var ending = this.ending.utc().format("YYYY-MM-DD HH:mm:ss"),
        duration = Math.round((this.ending - this.beginning) / 1000);
    return `BEFORE "${ending}" FOR ${duration}s`;
  }

  _encodeProjections() {
    return this._visibleParts().map(p => { return p.encode(); });
  }

  _visibleParts() {
    return _.filter(this.parts, p => {return !p.hidden});
  }
};

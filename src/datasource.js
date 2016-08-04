import _ from "lodash";
import {DalmatinerQuery} from "./query";


export class DalmatinerDatasource {

  constructor(instanceSettings, $q, backendSrv) {
    this.$q = $q;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.srv = backendSrv;
    if (instanceSettings.jsonData) {
      this.authToken = instanceSettings.jsonData.auth ? instanceSettings.jsonData.authToken : null;
    }
  }

  /*
   * Datasource api methods
   * ---------------------- */

  // used by panels to get data
  query(options) {
    var query = this.getQuery(options);

    if (! query)
      return this.$q.resolve({data: []});

    console.log('Running query: ' + query);
    return this._request('/?q=' + encodeURIComponent(query))
      .then(decode_series);
  }

  // used by datasource configuration page to make sure the connection is working
  testDatasource() {
    return this._request('').then(res => {
      if (res.status === 200) {
        return {status: "success", message: "Data source is working", title: "Success"};
      }
      return undefined;
    });
  }

  // get query string
  getQuery(options) {
    var {range, interval, targets} = options,
        q = new DalmatinerQuery(),
        auto_interval;

    if (targets.length <= 0)
      return null;

    for (let fields of targets) {
      if ((fields.collection.value) &&
          (fields.metric.length > 0))
        queryFields(q, fields);
    }

    auto_interval = interval;
    if (/^[0-9]+s$/.exec(interval) && parseInt(interval) < 30)
      auto_interval = '30s';

    return q
      .beginningAt(range.from)
      .endingAt(range.to)
      .with('interval', interval)
      .with('auto', auto_interval)
      .toString();
  }

  // get simplified query string that will be displayed when form is collapsed
  getSimplifiedQuery(target) {
    var q = new DalmatinerQuery();
    queryFields(q, target);
    return q
      .with('interval', '$interval')
      .with('auto', '$auto')
      .toUserString();
  }

  getCollections() {
    return this._request('/collections')
      .then(decodeList);
  }

  getTagKeys({collection}) {
    var c = collection.value;
    return this._request(`/collections/${c}/namespaces`)
      .then((res) => {
        return this.$q.all(
          _.reduce(res.data, (acc, ns) => {
            if (ns === 'label')
              acc.push({html: 'dl:tag', value: '["dl","tag"]'});
            else if (ns != 'ddb')
              acc.push(this.getTagNamespaceKeys({collection}, ns));
            return acc;
          }, [])
        );
      })
      .then((keys) => {
        return _.chain(keys)
          .flatten()
          .sortBy(function(i) {return i.html.replace(/^dl:/, '_');})
          .value();
      });
  }

  getTagNamespaceKeys({collection}, namespace) {
    var c = collection.value;
    return this._request(`/collections/${c}/namespaces/${namespace}/tags`)
      .then(_.partial(decodeTags, namespace));
  }

  getTagValues({collection}, tag) {
    var [namespace, key] = tag;
    if (namespace == 'dl' && key == 'tag')
      return this.getLabelTagValues({collection});
    else
      return this.getTrueTagValues({collection}, tag);
  }

  getLabelTagValues({collection}) {
    var c = collection.value;
    return this._request(`/collections/${c}/namespaces/label/tags`)
      .then(decodeList);
  }

  getTrueTagValues({collection}, [namespace, key]){
    var c = collection.value,
        p = `/collections/${c}/namespaces/${namespace}/tags/${key}/values`;
    return this._request(p)
      .then(decodeList);
  }

  getMetrics({collection}, prefix = []) {
    return this._request('/collections/' + collection.value + '/metrics')
      .then(decodeMetrics)
      .then(function(root) {
        var n = root;
        for (let p of prefix) {
          n = n.children[p];
          if (!n) return [];
        }
        return _.values(n.children);
      });
  }

  /*
   * Internal methods
   */

  _request(path) {
    var headers = {Accept: 'application/json'},
        options = {method: 'GET', url: this.url + path, headers};
    if (this.authToken) {
      let sep = path.indexOf('?') >= 0 ? '&' : '?';
      path += `${sep}token=${this.authToken}`;
    }
    return this.srv.datasourceRequest({method: 'GET', url: this.url + path, headers});
  }
};


// Decode data coming from Dalmatiner
function decode_series(res) {
  var {s, d} = res.data,
      start = s * 1000;
  return {data: (d || []).map(({n, v, r}) => {
    return {
      target: n,
      datapoints: timestampPoints(v, start, r)
    };
  })};
}

function timestampPoints(values, start, increment) {
  var r = new Array(values.length);
  for (var i = 0; i < values.length; i++) {
    r[i] = [values[i], start + (i * increment)];
  }
  return r;
}

function decodeList(res) {
  return _.map(res.data, function (item) {
    if (item === '') {
      return {value: '--empty--', html: '-- empty --'};
    } else if (typeof item == 'string')
      return {value: item, html: item};
    else
      return {value: item.key, html: item.label};
  });
}

function decodeMetrics(res) {
  var root = {children: {}};

  for (let {key, parts} of res.data) {
    let n = root;
    for (let part of parts) {
      if (! n.children[part]) {
        n.children[part] = {
          value: part,
          html: part,
          children: {}
        };
      }
      n = n.children[part];
    }
  }
  return root;
}

function decodeTags(ns, res) {
  return _.map(res.data, function (tag) {
    return {
      html: (ns == '') ? tag : `${ns}:${tag}`,
      value: JSON.stringify([ns, tag])};
  });
}

function queryFields(q, fields) {
  q.from(fields.collection)
    .select(fields.metric);

  if (! _.isEmpty(fields.tags)) {
    q.where(buildCondition(fields.tags));
  }
  _.each(fields.functions, function (fn) {
    q.apply(fn.fun || fn.name, fn.args);
  });

  if (! _.isEmpty(fields.alias)) {
    q.aliasBy(fields.alias);
  }

  return q;
}

function buildCondition(tokens) {
  var stack = [],
      condition;

  // First run is to expand all operators, leaving only condition objects and
  // condition keywords left on stack
  for (let token of tokens) {
    if (token.type === 'value') {
      let operator = stack.pop(),
          key = stack.pop(),
          c, v;
      assert(operator.type === 'operator', "Expected operator, but got: " + operator.type);
      assert(key.type === 'key', "Expected token key, but got: " + key.type);
      if (token.fake) {
        c = null;
      } else if (key.value == '["dl","tag"]') {
        c = DalmatinerQuery.present(['label', token.value]);
      } else {
        v = token.value === '--empty--' ? v = '' : v = token.value;
        c = DalmatinerQuery.equals(JSON.parse(key.value), v);
      }
      stack.push(c);
    } else {
      stack.push(token);
    }
  }

  // Now we iterate through stack to combine all conditions joining them by
  // keyword
  condition = stack.shift();
  while (stack.length) {
    let kwd = stack.shift(),
        c = stack.shift();
    if (condition === null) {
      continue;
    }
    assert(kwd.type === 'condition', "Expected condition keyword, but got: " + JSON.stringify(c));
    if (c === null)
      continue;
    switch (kwd.value) {
    case('AND'):
      condition = condition.and(c);
      break;
    case('OR'):
      condition = condition.or(c);
      break;
    default:
      throw new Error('Unexpected condition keyword: ' + kwd.value);
    }
  }

  return condition;
}

function assert(condition, message) {
  if (! condition) {
    throw new Error(message);
  }
}

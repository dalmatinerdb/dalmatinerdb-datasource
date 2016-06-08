import _ from "lodash";
import {DalmatinerQuery} from "./query";


export class DalmatinerDatasource {

  constructor(instanceSettings, $q, backendSrv) {
    this.$q = $q;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.srv = backendSrv;
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
        fields = targets[0];

    if (targets.length <= 0 ||
        (! fields.collection.value) ||
        (fields.metric.length <= 0))
      return null;

    return buildQuery(fields)
      .beginningAt(range.from)
      .endingAt(range.to)
      .with('interval', interval)
      .toString();
  }

  // get simplified query string that will be displayed when form is collapsed
  getSimplifiedQuery(target) {
    return buildQuery(target)
      .with('interval', '$interval')
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
            if (ns != 'ddb') {
              acc.push(this.getTagNamespaceKeys({collection}, ns));
            }
            return acc;
          }, [])
        );
      })
      .then(_.flatten);
  }

  getTagNamespaceKeys({collection}, namespace) {
    var c = collection.value;
    return this._request(`/collections/${c}/namespaces/${namespace}/tags`)
      .then(_.partial(decodeTags, namespace));
  }

  getTagValues({collection}, [namespace, key]) {
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

  _request(path, headers = {Accept: 'application/json'}) {
    return this.srv.datasourceRequest({url: this.url + path, headers: headers});
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
    return {value: item, html: item};
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

function buildQuery(fields) {
  var q = new DalmatinerQuery()
        .from(fields.collection)
        .select(fields.metric);

  if (! _.isEmpty(fields.tags)) {
    q.where(buildCondition(fields.tags));
  }
  _.each(fields.functions, function (fn) {
    q.apply(fn.name, fn.args);
  });

  return q;
}

function buildCondition(tags) {
  var stack = [],
      condition;

  // First run is to expand all operators, leaving only condition objects and
  // condition keywords left on stack
  for (let i = 0, tag; i < tags.length; i++) {
    tag = tags[i];
    if (tag.type === 'value') {
      let operator = stack.pop(),
          key = stack.pop();
      assert(operator.type === 'operator', "Expected operator, but got: " + operator.type);
      assert(key.type === 'key', "Expected tag key, but got: " + key.type);
      stack.push(DalmatinerQuery.equals(JSON.parse(key.value), tag.value));
    } else {
      stack.push(tags[i]);
    }
  }

  // Now we iterate through stack to combine all conditions joining them by
  // keyword
  condition = stack.shift();
  while (stack.length) {
    let kwd = stack.shift(),
        c = stack.shift();
    assert(kwd.type === 'condition', "Expected condition keyword, but got: " + c);
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

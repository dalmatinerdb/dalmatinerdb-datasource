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
    return this._request('/?q=' + encodeURIComponent(query),
                         {accept: 'application/json'})
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
        fields = targets[0],
        query = new DalmatinerQuery();

    if (targets.length <= 0 ||
        (! fields.collection.value) ||
        (fields.metric.length <= 0))
      return null;

    query
      .from(fields.collection)
      .select(fields.metric)
      .beginningAt(range.from)
      .endingAt(range.to)
      .in(interval);

    return query.toString();
  }

  // get simplified query string that will be displayed when form is collapsed
  getSimplifiedQuery(target) {
    return new DalmatinerQuery()
      .from(target.collection)
      .select(target.metric)
      .toUserString();
  }

  getCollections() {
    return this._request('/collections')
      .then(decodeList);
  }

  getTagKeys({collection}) {
    return this._request(`/collections/${collection}/namespaces`)
      .then((res) => {
        return this.$q.all(
          _.reduce(res.data, (acc, ns) => {
            if (ns != 'ddb') {
              acc.push(this.getTagNamespaceKeys({collection, namespace: ns}));
            }
            return acc;
          }, [])
        );
      })
      .then(_.flatten);
  }

  getTagNamespaceKeys({collection, namespace}) {
    return this._request(`/collections/${collection}/namespaces/${namespace}/tags`)
      .then(_.partial(decodeTags, namespace));
  }

  getTagValues({collection}, [namespace, key]) {
    var p = `/collections/${collection}/namespaces/${namespace}/tags/${key}/values`;
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

  _request(path, headers = {}) {
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

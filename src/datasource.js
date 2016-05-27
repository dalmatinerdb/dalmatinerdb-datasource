import _ from "lodash";
import moment from "moment";


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
    var query = this.getQuery(options),
        path = '/?q=' + encodeURIComponent(query);
    console.log('Running query: ' + query);
    return this._request(path, {accept: 'application/json'})
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
        ending = range.to.utc().format("YYYY-MM-DD HH:mm:ss"),
        duration = Math.round((range.to - range.from) / 1000),
        fields = targets[0];
    
    if (targets.length <= 0 ||
        fields.collection == 'choose collection' ||
        fields.metric.length <= 0) {
      return this.q.when([]);
    }
    return "SELECT '" + fields.metric.join("'.'") + "'" +
      " IN '" + fields.collection + "'" +
      " BEFORE \"" + ending + "\"" +
      " FOR " + duration + "s";
  }

  getSimplifiedQuery({collection, metric}) {
    if (collection == 'choose collection' ||
        metric == 'choose metric') {
      return 'incomplete';
    }
    return 'SELECT ' + metric + ' IN ' + collection;
  }
                 
  getCollections() {
    return this._request('/collections')
      .then(decodeList);
  }

  getTags({collection}) {
    return this._request(`/collections/${collection}/namespaces`)
      .then((res) => {
        return this.$q.all(
          _.reduce(res.data, (acc, ns) => {
            if (ns != 'ddb') {
              acc.push(this.getNamespaceTags({collection, namespace: ns}));
            }
            return acc;
          }, [])
        );
      })
      .then(_.flatten);
  }

  getNamespaceTags({collection, namespace}) {
    return this._request(`/collections/${collection}/namespaces/${namespace}/tags`)
      .then(_.partial(decodeTags, namespace));
  }

  getMetrics({collection}, prefix = []) {
    return this._request('/collections/' + collection + '/metrics')
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
    return {text: item};
  });
}

function decodeMetrics(res) {
  var root = {children: {}};

  for (let {key, parts} of res.data) {
    let n = root;
    for (let part of parts) {
      if (! n.children[part]) {
        n.children[part] = {
          text: part,
          children: {}
        };
      }
      n = n.children[part];
    }
    n.value = key;
  }
  return root;
}

function decodeTags(ns, res) {
  return _.map(res.data, function (tag) {
    return {
      text: (ns == '') ? tag : `${ns}:${tag}`,
      value: [ns, tag]};
  });
}

import moment from "moment";


export class DalmatinerDatasource {

  constructor(instanceSettings, $q, backendSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.srv = backendSrv;
  }

  /*
   * Datasource api methods
   * ---------------------- */

  // used by panels to get data
  query(options) {
    var query = this.getQuery(options),
        path = '/?q=' + encodeURIComponent(query);
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
        fields.metric == 'choose collection') {
      return this.q.when([]);
    }
    return "SELECT '" + fields.metric.replace(/\./g, "'.'") + "'" +
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
      .then(decode_list);
  }

  getMetrics(target) {
    var {collection} = target;
    return this._request('/collections/' + collection + '/metrics')
      .then(decode_metrics);
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
      datapoints: timestamp_points(v, start, r)
    };
  })};
}

function timestamp_points(values, start, increment) {
  var r = new Array(values.length);
  for (var i = 0; i < values.length; i++) {
    r[i] = [values[i], start + (i * increment)];
  }
  return r;
}

function decode_list(res) {
  return res.data.map((item) => {
    return {text: item, value: item};
  });
}

function decode_metrics(res) {
  return res.data.map(({key, parts}) => {
    return {text: parts.join('.'), value: key};
  });
}

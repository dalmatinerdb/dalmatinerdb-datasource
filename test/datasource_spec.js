/*global describe, it*/

import _ from "lodash";
import moment from "moment";
import chai from 'chai';
import sinon from 'sinon';
import source_map from 'source-map-support';
import {DalmatinerDatasource} from "./datasource";

source_map.install({handleUncaughtExceptions: false});


describe('DalmatinerDatasource', function() {
  var expect = chai.expect;

  describe('#getQuery', function() {
    var ds = new DalmatinerDatasource({}, null, null);

    it('should create a query for simple metric and collection only', function() {
      var q = ds.getQuery({
        range: {
          from: moment("2016-01-10T10:20:00"),
          to: moment("2016-01-10T11:20:00")},
        targets: [{
          collection: 'dataloop_org',
          metric: ['base', 'cpu']}]
      });
      expect(q).to.be.equal("SELECT 'base'.'cpu' IN 'dataloop_org' BEFORE \"2016-01-10 11:20:00\" FOR 3600s");
    }); 
  });
  
  describe('#getMetrics', function(){

    givenDatasource()
      .respondingTo('/collections/dataloop/metrics')
      .with([{parts: ["base", "cpu"], key: "k1"},
             {parts: ["base", "cpu", "user"], key: "k2"},
             {parts: ["base", "cpu", "system"], key: "k2"},
             {parts: ["apache", "status"], key: "k3"}])
      .ensureThat(function(ds) {

        it('should return top level of paths when queried with empty prefix', function(done) {
          ds.getMetrics({collection: 'dataloop'})
            .then(function (metrics) {
              var names = _.map(metrics, 'text');
              expect(names).to.be.deep.equal(["base", "apache"]);
              done();
            }).catch(done);
        });

        it('should return children of node defined in prefix', function(done) {
          ds.getMetrics({collection: 'dataloop'}, ['base', 'cpu'])
            .then(function (metrics) {
              var names = _.map(metrics, 'text');
              expect(names).to.be.deep.equal(['user', 'system']);
              done();
            }).catch(done);
        });
});
  });
});


function givenDatasource() {
  var settings = {url: ''},
      mock = sinon.stub(),
      srv = {datasourceRequest: mock},
      ds = new DalmatinerDatasource(settings, null, srv);
  
  return {
    respondingTo: function (path) {
      mock.withArgs(sinon.match.has('url', path));
      return this;
    },
    with: function (data) {
      var p = Promise.resolve({data: data});
      mock.returns(p);
      return this;
    },
    ensureThat: function (fun) {
      fun(ds);
    }
  };
}

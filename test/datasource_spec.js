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
    var ds = new DalmatinerDatasource({}, Promise, null);

    it('should create a query for requested target fields', function() {
      var q = ds.getQuery({
        range: {
          from: moment("2016-01-10T10:20:00Z"),
          to: moment("2016-01-10T11:20:00Z")},
        targets: [{
          collection: {value: 'dataloop_org'},
          metric: [{value: 'base'}, {value: 'cpu'}]}]
      });
      expect(q).to.be.equal("SELECT 'base'.'cpu' FROM 'dataloop_org' BEFORE \"2016-01-10 11:20:00\" FOR 3600s");
    });
  });

  describe('#getSimplifiedQuery', function() {
    var ds = new DalmatinerDatasource({}, Promise, null);

    it('should create a simplified query for at least collection and metric', function() {
      var q = ds.getSimplifiedQuery({
        collection: {value: 'dataloop_org'},
        metric: [{value: 'base'}, {value: 'cpu'}]
      });
      expect(q).to.be.equal("SELECT 'base'.'cpu' FROM 'dataloop_org'");
    });

    it('should create a query, that includes tags', function() {
      var eq = {type: 'operator', value: '='},
          empty = {type: 'value', value: '', fake: true},
          q = ds.getSimplifiedQuery({
            collection: {value: 'dataloop_org'},
            metric: [{value: 'base'}, {value: 'cpu'}],
            tags: [{type: "key", value: '["dl","tag"]'}, eq, {type: "value", value: "production"},
                   {type: "condition", value: 'AND'},
                   {type: "key", value: '["dl","tag"]'}, eq, {type: "value", value: "web"},
                   {type: "condition", value: 'OR'},
                   {type: "key", value: '["dl","hostname"]'}, eq, {type: "value", value: "dlstagn1"}]
          });
      expect(q).to.be.equal("SELECT 'base'.'cpu' FROM 'dataloop_org' WHERE label:'production' AND label:'web' OR dl:'hostname' = 'dlstagn1'");

    });

    it('should create a query, that includes an alias', function() {
      var eq = {type: 'operator', value: '='},
          empty = {type: 'value', value: '', fake: true},
          q = ds.getSimplifiedQuery({
            collection: {value: 'dataloop_org'},
            metric: [{value: 'base'}, {value: 'cpu'}],
            alias: '$1'
          });
      expect(q).to.be.equal("SELECT 'base'.'cpu' FROM 'dataloop_org' AS $1");

    });
  });

  describe('#getCollections', function() {

    givenDatasource()
      .respondingTo('/collections')
      .with(["org1", "org2"])
      .then(function(ds) {

        it('should return list of collections', function(done) {
          ds.getCollections()
            .then(function (collections) {
              var values = _.map(collections, 'value');
              expect(values).to.be.deep.equal(["org1", "org2"]);
              done();
            }).catch(done);
        });
      });
  });

  describe('#getTagKeys', function() {

    givenDatasource()
      .respondingTo('/collections/myorg/namespaces')
      .with(["tag", "", "custom", "ddb"])
      .respondingTo('/collections/myorg/namespaces/tag/tags')
      .with(["all", "prod", "stag"])
      .respondingTo('/collections/myorg/namespaces//tags')
      .with(["region", "datacenter"])
      .respondingTo('/collections/myorg/namespaces/custom/tags')
      .with(["kernel"])
      .then(function(ds, report) {

        it('should return list of tags with namespaces', function(done) {
          ds.getTagKeys({collection: {value: 'myorg'}})
            .then(function (tags) {
              var names = _.map(tags, 'html');
              expect(names).to.be.deep.equal([
                "custom:kernel", "datacenter", "region", "tag:all", "tag:prod", "tag:stag"
              ]);
              done();
            }).catch(report(done));
        });

        it('should produce object having name-space and tag pair as value', function(done) {
          ds.getTagKeys({collection: {value: 'myorg'}})
            .then(function (tags) {
              var prod = _.find(tags, function(t) { return t.html == 'tag:prod'; });
              expect(prod.value).to.be.deep.equal('["tag","prod"]');
              done();
            }).catch(report(done));
        });

      });
  });

  describe('#getTagValues', function() {

    givenDatasource()
      .respondingTo('/collections/myorg/namespaces/dl/tags/source/values')
      .with(["linload1", "linload2", "linload3"])
      .then(function(ds, report) {

        it('should return list of tag values', function(done) {
          ds.getTagValues({collection: {value: 'myorg'}}, ['dl', 'source'])
            .then(function (list) {
              var values = _.map(list, 'html');
              expect(values).to.be.deep.equal([
                "linload1", "linload2", "linload3"
              ]);
              done();
            }).catch(report(done));
        });
      });
  });

  describe('#getMetrics', function(){

    givenDatasource()
      .respondingTo('/collections/dataloop/metrics')
      .with([{parts: ["base", "cpu"], key: "k1"},
             {parts: ["base", "cpu", "user"], key: "k2"},
             {parts: ["base", "cpu", "system"], key: "k2"},
             {parts: ["apache", "status"], key: "k3"}])
      .then(function(ds) {

        it('should return top level of paths when queried with empty prefix', function(done) {
          ds.getMetrics({collection: {value: 'dataloop'}})
            .then(function (metrics) {
              var names = _.map(metrics, 'value');
              expect(names).to.be.deep.equal(["base", "apache"]);
              done();
            }).catch(done);
        });

        it('should return children of node defined in prefix', function(done) {
          ds.getMetrics({collection: {value: 'dataloop'}}, ['base', 'cpu'])
            .then(function (metrics) {
              var names = _.map(metrics, 'value');
              expect(names).to.be.deep.equal(['user', 'system']);
              done();
            }).catch(done);
        });
      });
  });

  describe('#getFunctions', function(){

    givenDatasource()
      .respondingTo('/functions')
      .with([
          { "name": "quotient", "combiner_type": "metric", "signature": [] },
          { "name": "confidence", "combiner_type": "none", "signature": ["metric"] },
          { "name": "divide", "combiner_type": "none", "signature": ["metric", "integer"] },
          { "name": "avg", "combiner_type": "none", "signature": ["metric", "time"] }
      ])
      .then(function(ds) {

        it('should return functions categorized and sorted', function(done) {
          ds.getFunctions()
            .then(function (funs) {
              expect(funs).to.be.deep.equal([
                  { category: "Aggregate", "name": "avg", "fun": "avg", "spec": [{"default": "$interval", "type": "time"}] },
                  { category: "Arithmetic", "name": "divide", "fun": "divide", "spec": [{"type": "number", "default": "1"}] },
                  { category: "Combine", "name": "quotient", "fun": "quotient", "spec": [] },
                  { category: "Transform", "name": "confidence", "fun": "confidence", "spec": [] }
              ]);
              done();
            }).catch(done);
        });
      });
  });
});

function wrong_call(arg) {
  throw new Error("Unexpected call: arg");
}

function givenDatasource() {
  var stubErr = new Error("Invalid request"),
      stub = sinon.stub().throws(stubErr),
      expectation = null,
      settings = {url: ''},
      srv = {datasourceRequest: stub},
      ds = new DalmatinerDatasource(settings, Promise, srv);

  return {
    respondingTo: function (path) {
      expectation = stub.withArgs(sinon.match.has('url', path));
      return this;
    },
    with: function (data) {
      var p = Promise.resolve({data: data});
      expectation.returns(p);
      return this;
    },
    then: function (fun) {
      function report(done) {
        return function cb(err) {
          console.log('Error reporter triggered');
          if (err === stubErr) {
            err = new Error(stub.lastCall);
          }
          done(err);
        };
      }
      fun(ds, report);
    }
  };
}

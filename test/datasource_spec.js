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

    it('should create a query for simple metric and collection only', function() {
      var q = ds.getQuery({
        range: {
          from: moment("2016-01-10T10:20:00"),
          to: moment("2016-01-10T11:20:00")},
        targets: [{
          collection: {value: 'dataloop_org'},
          metric: [{value: 'base'}, {value: 'cpu'}]}]
      });
      expect(q).to.be.equal("SELECT 'base'.'cpu' IN 'dataloop_org' BEFORE \"2016-01-10 11:20:00\" FOR 3600s");
    }); 
  });

  describe('#getSimplifiedQuery', function() {
    var ds = new DalmatinerDatasource({}, Promise, null);

    it('should create a simplified query at least metric and collection', function() {
      var q = ds.getSimplifiedQuery({
        collection: {value: 'dataloop_org'},
        metric: [{value: 'base'}, {value: 'cpu'}]
      });
      expect(q).to.be.equal("SELECT 'base'.'cpu' IN 'dataloop_org'");
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
          ds.getTagKeys({collection: 'myorg'})
            .then(function (tags) {
              var names = _.map(tags, 'html');
              expect(names).to.be.deep.equal([
                "tag:all", "tag:prod", "tag:stag", "region", "datacenter", "custom:kernel"
              ]);
              done();
            }).catch(report(done));
        });

        it('should produce object having name-space and tag pair as value', function(done) {
          ds.getTagKeys({collection: 'myorg'})
            .then(function (tags) {
              var prod = _.find(tags, function(t) { return t.html == 'tag:prod'; });
              expect(prod.value).to.be.deep.equal('["tag","prod"]');
              done();
            }).catch(report(done));
        });

      });
  });

  describe('#getScopeOptions', function() {

    givenDatasource()
      .respondingTo('/collections/myorg/namespaces')
      .with(["tag", "", "ddb"])
      .respondingTo('/collections/myorg/namespaces/tag/tags')
      .with(["all", "prod", "stag"])
      .respondingTo('/collections/myorg/namespaces//tags')
      .with(["region"])
      .then(function(ds, report) {

        it('should give tags selection when scope is empty', function(done) {
          ds.getTagKeys({collection: 'myorg'})
            .then(function (tags) {
              var names = _.map(tags, 'html');
              expect(names).to.be.deep.equal(["tag:all", "tag:prod", "tag:stag", "region"]);
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

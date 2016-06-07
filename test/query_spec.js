/*global describe, it, beforeEach*/

import _ from "lodash";
import chai from 'chai';
import sinon from 'sinon';
import source_map from 'source-map-support';
import {DalmatinerQuery} from "./query";

source_map.install({handleUncaughtExceptions: false});


describe('DalmatinerQuery', function() {
  var expect = chai.expect,
      query;

  beforeEach(function() {
    query = new DalmatinerQuery();
  });
  
  describe('#equals', function() {

    it('should build a condition with name-space', function() {
      var c = DalmatinerQuery.equals(['dl', 'source'], 'agent1'); 
      expect('' + c).to.be.equal("dl:'source' = 'agent1'");
    });

    it('should build a condition without name-space', function() {
      var c = DalmatinerQuery.equals(['', 'custom'], 'some-value');
      expect('' + c).to.be.equal("'custom' = 'some-value'");
    });

    it('should build a condition that can be and-ed', function() {
      var c = DalmatinerQuery.equals(['tag', 'production'], '')
            .and(DalmatinerQuery.equals(['tag', 'web'], ''));
      expect('' + c).to.be.equal("tag:'production' = '' AND tag:'web' = ''");
    });

    it('should build a condition that can be or-ed', function() {
      var c = DalmatinerQuery.equals(['tag', 'production'], '')
            .or(DalmatinerQuery.equals(['tag', 'web'], ''));
      expect('' + c).to.be.equal("tag:'production' = '' OR tag:'web' = ''");
    });
  });

  describe('#apply', function() {

    it('should apply function on active selection', function() {
      query.from('myorg')
        .select(['base', 'network', 'eth0', 'sent'])
        .apply('derivate');
      expect(query.toUserString()).to.be
        .equal("SELECT derivate('base'.'network'.'eth0'.'sent' IN 'myorg')");
    });

    it('should support function with extra argument', function() {
      query.from('myorg')
        .select(['base', 'cpu'])
        .apply('avg', ['30s']);
      expect(query.toUserString()).to.be
        .equal("SELECT avg('base'.'cpu' IN 'myorg', 30s)");
    });

    it('should expand variables in function arguments', function() {
      query.from('myorg')
        .select(['base', 'cpu'])
        .with('interval', '30s')
        .apply('avg', ['$interval']);
      expect(query.toUserString()).to.be
        .equal("SELECT avg('base'.'cpu' IN 'myorg', 30s)");
    });

    it('should fail when variable is not defined', function() {
      query.from('myorg')
        .select(['base', 'cpu'])
        .apply('avg', ['$interval']);
      expect(query.toUserString).to.throw(Error);
    });
  });
});

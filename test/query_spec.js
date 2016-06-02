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
});

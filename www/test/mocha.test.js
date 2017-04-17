'use strict';

define(["chai"], function (chai) {

  var assert = chai.assert;

  describe('mocha 可用性测试', function () {

    before(function () {});

    after(function () {});

    beforeEach(function () {});

    afterEach(function () {});

    it('测试 mocha 和 chai 的可用性', function () {
      assert.equal(1, 1);
    });
  });
});
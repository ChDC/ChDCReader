"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["mocha._test"] = factory();
})(["chai"], function (chai) {

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
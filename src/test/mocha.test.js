;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["mocha._test"] = factory();
}(["chai"], function(chai){

  /************************************
    测试用例规范：
    * 先写空参数测试
    * 再写异常参数测试
    * 正确参数和正确结果
  ************************************/

  let assert = chai.assert;

  describe('mocha 可用性测试', () => {

    before(() => {
      // 在本区块的所有测试用例之前执行
    });

    after(() => {
      // 在本区块的所有测试用例之后执行
    });

    beforeEach(() => {
      // 在本区块的每个测试用例之前执行
    });

    afterEach(() => {
      // 在本区块的每个测试用例之后执行
    });


    it('测试 mocha 和 chai 的可用性', () => {
      assert.equal(1, 1);
    });

  });
}));


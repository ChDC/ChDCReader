define(["chai"], function(chai){

  let assert = chai.assert;

  describe('加法函数的测试', () => {

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


    it('1 加 1 应该等于 2', () => {
      expect(1 + 1).to.be.equal(3);
    });

    it('任何数加0等于自身', () => {
      // expect(add(1, 0)).to.be.equal(1);
      // expect(add(0, 0)).to.be.equal(0);
    });
  });
});


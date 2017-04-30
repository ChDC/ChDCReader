define(["chai", "Chapter"], function(chai, Chapter){

  let assert = chai.assert;
  let equal = assert.equal;

  describe('Chapter', () => {

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


    it('stripString', () => {
      equal(undefined, Chapter.stripString());
      equal('', Chapter.stripString(''));
      equal('第一章好的啊', Chapter.stripString('第一章 好的啊【啊啊】(test)'));
    });

    it('equal', () => {

      equal(true, Chapter.equalTitle({title: "第58章节 好的【abc】"}, {title: "第58章节    好的【abc】"}));
      equal(true, Chapter.equalTitle({title: "第58章节 好的【abc】"}, {title: "第五十八章节    好的【abc】"}));
      equal(true, Chapter.equalTitle({title: "第58章节 好的【abc】"}, {title: "第五八章节    好的【abc】"}));
      equal(true, Chapter.equalTitle({title: "第584章节 好的【abc】"}, {title: "第五百八十四章节    好的【abc】"}));
      equal(true, Chapter.equalTitle({title: "第504章节 好的【abc】"}, {title: "第五百零四章节    好的【abc】"}));
      equal(true, Chapter.equalTitle({title: "第504章节 好的【abc】"}, {title: "第五百零三章节    好的【abc】"}));
    });


  });
});


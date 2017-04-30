"use strict";

define(["chai", "Chapter"], function (chai, Chapter) {

  var assert = chai.assert;
  var equal = assert.equal;

  describe('Chapter', function () {

    before(function () {});

    after(function () {});

    beforeEach(function () {});

    afterEach(function () {});

    it('stripString', function () {
      equal(undefined, Chapter.stripString());
      equal('', Chapter.stripString(''));
      equal('第一章好的啊', Chapter.stripString('第一章 好的啊【啊啊】(test)'));
    });

    it('equal', function () {

      equal(true, Chapter.equalTitle({ title: "第58章节 好的【abc】" }, { title: "第58章节    好的【abc】" }));
      equal(true, Chapter.equalTitle({ title: "第58章节 好的【abc】" }, { title: "第五十八章节    好的【abc】" }));
      equal(true, Chapter.equalTitle({ title: "第58章节 好的【abc】" }, { title: "第五八章节    好的【abc】" }));
      equal(true, Chapter.equalTitle({ title: "第584章节 好的【abc】" }, { title: "第五百八十四章节    好的【abc】" }));
      equal(true, Chapter.equalTitle({ title: "第504章节 好的【abc】" }, { title: "第五百零四章节    好的【abc】" }));
      equal(true, Chapter.equalTitle({ title: "第504章节 好的【abc】" }, { title: "第五百零三章节    好的【abc】" }));
    });
  });
});
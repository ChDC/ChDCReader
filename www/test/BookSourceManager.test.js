"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["BookSourceManager_test"] = factory(chai, utils, BookSourceManager, customBookSource);
})(["chai", "utils", "BookSourceManager", "CustomBookSource", "Chapter", "../test/testbook"], function (chai, utils, BookSourceManager, customBookSource, Chapter, testbook) {

  var assert = chai.assert;
  var equal = assert.equal;

  describe('BookSourceManager 基础测试', function () {

    var bsm = void 0;

    before(function () {
      bsm = new BookSourceManager(undefined, customBookSource);
      return bsm.loadConfig("data/booksources.json");
    });

    it('全局搜索', function () {
      return bsm.searchBookInAllBookSource("三生三世十里桃花").then(function (books) {
        equal(true, books.length >= 0);
        equal("三生三世十里桃花", books.find(function (b) {
          return b.name == "三生三世十里桃花";
        }).name);
      });
    });
  });

  var bsids = ["omanhua", "2manhua", "57mh", "77mh", "yyls", "qqbook", "sfnovel", "qqac", "u17", "comico", "biquge.tw", "biqulou", "daizhuzai", "dingdian", "qidian"];

<<<<<<< HEAD
  bsm = new BookSourceManager(undefined, customBookSource);
=======
  var bsm = new BookSourceManager(undefined, customBookSource);
>>>>>>> dev
  return Promise.all([bsm.loadConfig("data/booksources.json"), utils.getJSON("test/BookSourceManager.test.data.json").then(function (data) {
    config = data;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = bsids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var bsid = _step.value;

        testbook.testBook(bsid, bsm, config[bsid]);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  })]);
});
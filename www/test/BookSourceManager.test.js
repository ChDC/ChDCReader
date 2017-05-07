"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["BookSourceManager_test"] = factory(chai, utils, BookSourceManager, customBookSource);
})(["chai", "utils", "BookSourceManager", "CustomBookSource"], function (chai, utils, BookSourceManager, customBookSource) {

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

  var bsids = ["qqbook", "sfnovel", "qqac", "u17", "comico", "biquge", "biquge.tw", "biqugezw", "biqulou", "chuangshi", "daizhuzai", "dingdian", "qidian"];

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var bsid = _step.value;


      function equalBook(bsid, book, b) {
        assert.isObject(b);
        assert.isNotNull(b);
        equal(true, !!b);

        var exclude = ['chapters', 'introduce', 'lastestChapter', 'cover', 'catalogLink'];
        for (var key in book) {
          if (exclude.indexOf(key) >= 0) continue;
          if (key in b) equal(book[key], b[key], book.name + "." + key);else if ('sources' in b && key in b.sources[bsid]) equal(book[key], b.sources[bsid][key], book.name + "." + key);
        }

        if ("introduce" in book && "introduce" in b) equal(true, b.introduce.length > 0 && b.introduce.indexOf(book.introduce) >= 0, book.name + ".introduce");

        if ("lastestChapter" in book && "sources" in b && "lastestChapter" in b.sources[bsid]) equal(true, b.sources[bsid].lastestChapter.length > 0, book.name + ".lastestChapter");
        if ("cover" in book && "cover" in b) equal(true, !!b.cover.match(/^http/), book.name + ".cover");
      }

      describe("BookSourceManager \u6D4B\u8BD5\uFF1A" + bsid, function () {
        var bsm = void 0;
        var config = void 0;
        var books = void 0;

        before(function () {
          bsm = new BookSourceManager(undefined, customBookSource);
          return Promise.all([bsm.loadConfig("data/booksources.json"), utils.getJSON("test/BookSourceManager.test.data.json").then(function (data) {
            config = data;
            books = config[bsid];
          })]);
        });

        it('测试搜索', function () {
          return Promise.all(books.map(function (book) {
            return bsm.searchBook(bsid, book.name).then(function (bs) {
              var b = bs[0];
              equalBook(bsid, book, b);
            });
          }));
        });

        it('测试获取书籍', function () {
          return Promise.all(books.map(function (book) {
            return bsm.getBook(bsid, book.name, book.author).then(function (b) {
              equalBook(bsid, book, b);
            });
          }));
        });

        it('测试获取书籍信息', function () {
          return Promise.all(books.map(function (book) {
            return bsm.getBookInfo(bsid, book).then(function (b) {
              equalBook(bsid, book, b);
            });
          }));
        });

        it('测试最新章节', function () {
          return Promise.all(books.map(function (book) {
            return bsm.getLastestChapter(bsid, book).then(function (lc) {
              equal(true, lc.length > 0);
            });
          }));
        });

        it('测试书籍目录', function () {
          return Promise.all(books.map(function (book) {
            return bsm.getBookCatalog(bsid, book).then(function (catalog) {
              assert.isArray(catalog);
              equal(true, catalog.length > 0);
              book.chapters.forEach(function (chapter) {
                equal(true, catalog.findIndex(function (e) {
                  return e.title == chapter.title && e.link == chapter.link && e.cid == chapter.cid;
                }) >= 0);
              });
            });
          }));
        });

        it('测试获取章节', function () {
          return Promise.all(books.map(function (book) {
            return Promise.all(book.chapters.map(function (chapter) {
              return bsm.getChapter(bsid, Object.assign({}, book, chapter)).then(function (c) {
                equal(chapter.title, c.title);
                equal(chapter.link, c.link);
                equal(true, c.content.length > 0 && c.content.indexOf(chapter.content) >= 0);
                assert.notInclude(c.content, "<br");
              });
            }));
          }));
        });
      });
    };

    for (var _iterator = bsids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      _loop();
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
});
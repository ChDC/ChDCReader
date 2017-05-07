"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["BookSource"] = factory(co, utils, Chapter);
})(['co', "utils", 'Chapter'], function (co, utils, Chapter) {
  "use strict";

  var BookSource = function () {
    function BookSource(book, bookSourceManager, id) {
      var weight = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      _classCallCheck(this, BookSource);

      this.bookSourceManager = bookSourceManager;
      this.book = book;

      this.id = id;
      this.detailLink = undefined;
      this.catalogLink = undefined;
      this.bookid = undefined;
      this.catalog = undefined;
      this.lastestChapter = undefined;

      this.weight = weight;
      this.__disable = false;
      this.__searched = false;
      this.__updatedCatalogTime = 0;
      this.__updatedLastestChapterTime = 0;
      this.needSaveCatalog = false;
    }

    _createClass(BookSource, [{
      key: "__assertBookSource",
      value: function __assertBookSource() {
        var _this = this;

        utils.log("BookSource: assert myself");

        if (this.__disable) return Promise.reject(404);

        if (this.__searched) return Promise.resolve();

        return this.bookSourceManager.getBook(this.id, this.book.name, this.book.author).then(function (book) {
          Object.assign(_this, book.sources[_this.id]);
          return _this;
        }).catch(function (error) {
          if (error == 404) {
            _this.__disable = true;
            _this.__searched = true;
          }
          return Promise.reject(error);
        });
      }
    }, {
      key: "getBookInfo",
      value: function getBookInfo() {
        var _this2 = this;

        return this.__assertBookSource().then(function () {
          return _this2.bookSourceManager.getBookInfo(_this2.id, _this2);
        });
      }
    }, {
      key: "__assertBookSourceCatalogLink",
      value: function __assertBookSourceCatalogLink() {
        var _this3 = this;

        if (this.catalogLink === undefined) return this.bookSourceManager.getBookCatalogLink(this.id, this).then(function (cl) {
          return _this3.catalogLink = cl;
        });else return Promise.resolve();
      }
    }, {
      key: "getCatalog",
      value: function getCatalog(_ref) {
        var _ref$forceRefresh = _ref.forceRefresh,
            forceRefresh = _ref$forceRefresh === undefined ? false : _ref$forceRefresh,
            _ref$refresh = _ref.refresh,
            refresh = _ref$refresh === undefined ? false : _ref$refresh;

        if (!forceRefresh && !refresh && this.catalog) return Promise.resolve(this.catalog);

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          var catalog;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return self.__assertBookSource();

                case 2:
                  if (!(!forceRefresh && new Date().getTime() - self.__updatedCatalogTime < BookSource.settings.refreshCatalogInterval * 1000)) {
                    _context.next = 4;
                    break;
                  }

                  return _context.abrupt("return", self.catalog);

                case 4:
                  _context.next = 6;
                  return self.__assertBookSourceCatalogLink();

                case 6:
                  _context.next = 8;
                  return self.bookSourceManager.getBookCatalog(self.id, self);

                case 8:
                  catalog = _context.sent;

                  self.catalog = catalog;
                  self.__updatedCatalogTime = new Date().getTime();
                  self.needSaveCatalog = true;
                  return _context.abrupt("return", catalog);

                case 13:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
      }
    }, {
      key: "refreshLastestChapter",
      value: function refreshLastestChapter() {
        var _this4 = this;

        var forceRefresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


        if (!forceRefresh && new Date().getTime() - this.__updatedLastestChapterTime < BookSource.settings.refreshLastestChapterInterval * 1000) return [this.lastestChapter, false];

        utils.log('Refresh LastestChapter!');

        return this.__assertBookSource().then(function () {
          return _this4.bookSourceManager.getLastestChapter(_this4.id, _this4);
        }).then(function (lastestChapter) {
          _this4.__updatedLastestChapterTime = new Date().getTime();
          var lastestChapterUpdated = false;
          if (_this4.lastestChapter != lastestChapter) {
            _this4.lastestChapter = lastestChapter;
            lastestChapterUpdated = true;
          }
          return [lastestChapter, lastestChapterUpdated];
        });
      }
    }, {
      key: "getChapter",
      value: function getChapter(chapter, onlyCacheNoLoad) {
        var _this5 = this;

        return this.__assertBookSource().then(function () {
          return co(_this5.__getCacheChapter(chapter.title, onlyCacheNoLoad));
        }).then(function (c) {
          return onlyCacheNoLoad ? chapter : c;
        }).catch(function (error) {
          if (error != 207) console.error(error);

          return _this5.bookSourceManager.getChapter(_this5.id, Object.assign({}, _this5, chapter)).then(function (chapter) {
            return _this5.__cacheChapter(chapter);
          });
        });
      }
    }, {
      key: "__getCacheChapterLocation",
      value: function __getCacheChapterLocation(id) {
        return "chapter/" + this.book.name + "_" + this.book.author + "/" + id + "_" + this.id + ".json";
      }
    }, {
      key: "__getCacheChapter",
      value: regeneratorRuntime.mark(function __getCacheChapter(title, onlyCacheNoLoad) {
        var dest, exists, data, chapter;
        return regeneratorRuntime.wrap(function __getCacheChapter$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                dest = this.__getCacheChapterLocation(title);

                if (!onlyCacheNoLoad) {
                  _context2.next = 6;
                  break;
                }

                _context2.next = 4;
                return utils.dataExists(dest, true);

              case 4:
                exists = _context2.sent;
                return _context2.abrupt("return", exists ? null : Promise.reject(207));

              case 6:
                _context2.prev = 6;
                _context2.next = 9;
                return utils.loadData(dest, true);

              case 9:
                data = _context2.sent;

                if (data) {
                  _context2.next = 12;
                  break;
                }

                return _context2.abrupt("return", Promise.reject(207));

              case 12:
                chapter = Object.assign(new Chapter(), data);
                return _context2.abrupt("return", chapter);

              case 16:
                _context2.prev = 16;
                _context2.t0 = _context2["catch"](6);
                return _context2.abrupt("return", Promise.reject(207));

              case 19:
              case "end":
                return _context2.stop();
            }
          }
        }, __getCacheChapter, this, [[6, 16]]);
      })
    }, {
      key: "__cacheChapter",
      value: function __cacheChapter(chapter) {
        var dest = this.__getCacheChapterLocation(chapter.title);
        return utils.saveData(dest, chapter, true).then(function () {
          return chapter;
        });
      }
    }]);

    return BookSource;
  }();

  BookSource.settings = {
    refreshCatalogInterval: 60 * 60 * 1,
    refreshLastestChapterInterval: 60 * 60 * 1 };

  BookSource.persistentInclude = ["id", "__disable", "weight", "__searched", "detailLink", "catalogLink", "bookid", "__updatedCatalogTime", "__updatedLastestChapterTime", "lastestChapter"];

  return BookSource;
});
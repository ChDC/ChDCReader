'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['co', "util", 'Chapter'], function (co, util, Chapter) {
  "use strict";

  var BookSource = function () {
    function BookSource(book, bookSourceManager, id) {
      var weight = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      _classCallCheck(this, BookSource);

      this.bookSourceManager = bookSourceManager;
      this.book = book;

      this.id = id;
      this.detailLink;
      this.catalogLink;
      this.bookid;
      this.catalog;
      this.lastestChapter = undefined;

      this.weight = weight;
      this.__disable = false;
      this.__searched = false;
      this.__updatedCatalogTime = 0;
      this.__updatedLastestChapterTime = 0;
      this.needSaveCatalog = false;
    }

    _createClass(BookSource, [{
      key: '__getBookSource',
      value: function __getBookSource() {
        var _this = this;

        util.log('BookSource: Get book source by searching book');

        if (this.__disable) return Promise.reject(404);

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
      key: '__getBookSourceDetailLink',
      value: function __getBookSourceDetailLink() {

        if (!this.__searched) return this.__getBookSource().then(function (bs) {
          return bs.detailLink;
        });

        if (this.__disable) return Promise.reject(404);

        return Promise.resolve(this.detailLink);
      }
    }, {
      key: '__getBookSourceCatalogLink',
      value: regeneratorRuntime.mark(function __getBookSourceCatalogLink() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function __getBookSourceCatalogLink$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.__searched) {
                  _context.next = 3;
                  break;
                }

                _context.next = 3;
                return this.__getBookSource();

              case 3:
                if (!this.__disable) {
                  _context.next = 5;
                  break;
                }

                return _context.abrupt('return', Promise.reject(404));

              case 5:
                if (!(this.catalogLink != undefined)) {
                  _context.next = 7;
                  break;
                }

                return _context.abrupt('return', Promise.resolve(this.catalogLink));

              case 7:
                return _context.abrupt('return', this.bookSourceManager.getBookCatalogLink(this.id, this).then(function (cl) {
                  _this2.catalogLink = cl;
                  return cl;
                }));

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, __getBookSourceCatalogLink, this);
      })
    }, {
      key: '__refreshCatalog',
      value: regeneratorRuntime.mark(function __refreshCatalog() {
        var catalog;
        return regeneratorRuntime.wrap(function __refreshCatalog$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(new Date().getTime() - this.__updatedCatalogTime < BookSource.settings.refreshCatalogInterval * 1000)) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return', this.catalog);

              case 2:
                _context2.next = 4;
                return this.__getBookSourceCatalogLink();

              case 4:
                _context2.next = 6;
                return this.bookSourceManager.getBookCatalog(this.id, this);

              case 6:
                catalog = _context2.sent;

                this.catalog = catalog;
                this.__updatedCatalogTime = new Date().getTime();
                this.needSaveCatalog = true;
                return _context2.abrupt('return', catalog);

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, __refreshCatalog, this);
      })
    }, {
      key: 'getBookInfo',
      value: function getBookInfo() {
        var _this3 = this;

        return this.__getBookSourceDetailLink().then(function (detailLink) {
          return _this3.bookSourceManager.getBookInfo(_this3.id, _this3);
        });
      }
    }, {
      key: 'getCatalog',
      value: function getCatalog(forceRefresh) {
        if (!forceRefresh && this.catalog) return Promise.resolve(this.catalog);

        return co(this.__refreshCatalog());
      }
    }, {
      key: 'refreshLastestChapter',
      value: function refreshLastestChapter() {
        var _this4 = this;

        if (new Date().getTime() - this.__updatedLastestChapterTime < BookSource.settings.refreshLastestChapterInterval * 1000) return [this.lastestChapter, false];

        util.log('Refresh LastestChapter!');

        return this.__getBookSourceDetailLink().then(function (detailLink) {
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
      key: 'getChapter',
      value: function getChapter(chapter, onlyCacheNoLoad) {
        var _this5 = this;

        return co(this.__getCacheChapter(chapter.title, onlyCacheNoLoad)).then(function (c) {
          return onlyCacheNoLoad ? chapter : c;
        }).catch(function (error) {
          if (error != 207) throw error;

          return _this5.bookSourceManager.getChapter(_this5.id, chapter).then(function (chapter) {
            return _this5.__cacheChapter(chapter);
          });
        });
      }
    }, {
      key: '__getCacheChapterLocation',
      value: function __getCacheChapterLocation(id) {
        return 'chapter_' + this.book.name + '.' + this.book.author + '_' + id + '.' + this.id;
      }
    }, {
      key: '__getCacheChapter',
      value: regeneratorRuntime.mark(function __getCacheChapter(title, onlyCacheNoLoad) {
        var dest, exists, data, chapter;
        return regeneratorRuntime.wrap(function __getCacheChapter$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                dest = this.__getCacheChapterLocation(title);

                if (!onlyCacheNoLoad) {
                  _context3.next = 6;
                  break;
                }

                _context3.next = 4;
                return util.dataExists(dest, true);

              case 4:
                exists = _context3.sent;
                return _context3.abrupt('return', exists ? null : Promise.reject(207));

              case 6:
                _context3.prev = 6;
                _context3.next = 9;
                return util.loadData(dest, true);

              case 9:
                data = _context3.sent;

                if (data) {
                  _context3.next = 12;
                  break;
                }

                return _context3.abrupt('return', Promise.reject(207));

              case 12:
                chapter = Object.assign(new Chapter(), data);
                return _context3.abrupt('return', chapter);

              case 16:
                _context3.prev = 16;
                _context3.t0 = _context3['catch'](6);
                return _context3.abrupt('return', Promise.reject(207));

              case 19:
              case 'end':
                return _context3.stop();
            }
          }
        }, __getCacheChapter, this, [[6, 16]]);
      })
    }, {
      key: '__cacheChapter',
      value: function __cacheChapter(chapter) {
        var dest = this.__getCacheChapterLocation(chapter.title);
        return util.saveData(dest, chapter, true).then(function () {
          return chapter;
        });
      }
    }]);

    return BookSource;
  }();

  BookSource.settings = {
    refreshCatalogInterval: 60 * 60 * 1,
    refreshLastestChapterInterval: 60 * 60 * 1 };

  BookSource.persistentInclude = ["id", "__disable", "weight", "__searched", "detailLink", "catalogLink", "bookid", "__updatedCatalogTime", "__updatedLastestChapterTime", "needSaveCatalog", "lastestChapter"];

  return BookSource;
});
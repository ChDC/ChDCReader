"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['co', "util", "Spider", "Book", "BookSource", "Chapter"], function (co, util, Spider, Book, BookSource, Chapter) {
  "use strict";

  var BookSourceManager = function () {
    function BookSourceManager(configFileOrConfig) {
      _classCallCheck(this, BookSourceManager);

      this.sources;
      this.spider = new Spider();

      this.loadConfig(configFileOrConfig);
      this.addCustomSourceFeature();
    }

    _createClass(BookSourceManager, [{
      key: "init",
      value: function init() {
        return Promise.all(Object.values(this.CustomSourceFunction).map(function (cm) {
          return cm.init && cm.init();
        }));
      }
    }, {
      key: "loadConfig",
      value: function loadConfig(configFileOrConfig) {
        var _this = this;

        if (configFileOrConfig && typeof configFileOrConfig == 'string') {
          return util.getJSON(configFileOrConfig).then(function (data) {
            _this.sources = data;
          }).then(function () {
            return _this.init();
          }).then(function () {
            return _this.sources;
          });
        } else if (configFileOrConfig) {
          this.sources = configFileOrConfig;
        }
        return this.init().then(function () {
          return _this.sources;
        });
      }
    }, {
      key: "addCustomSourceFeature",
      value: function addCustomSourceFeature() {
        var _this2 = this;

        var customFunctionList = ["getBook", "searchBook", "getBookInfo", "getChapter", "getBookCatalog", "getBookCatalogLink", "getLastestChapter"];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          var _loop = function _loop() {
            var cf = _step.value;

            var oldFunction = _this2[cf];
            var self = _this2;
            _this2[cf] = function (bsid) {
              var beforeFunctions = ["before" + cf, "before" + cf[0].toUpperCase() + cf.slice(1)];
              var args = arguments;
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                for (var _iterator2 = beforeFunctions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var bf = _step2.value;

                  if (bsid in self.CustomSourceFunction && bf in self.CustomSourceFunction[bsid]) {
                    args = self.CustomSourceFunction[bsid][bf].apply(self, args);
                    break;
                  }
                }
              } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                  }
                } finally {
                  if (_didIteratorError2) {
                    throw _iteratorError2;
                  }
                }
              }

              var promise = void 0;

              if (bsid in self.CustomSourceFunction && cf in self.CustomSourceFunction[bsid]) promise = self.CustomSourceFunction[bsid][cf].apply(self, args);else promise = oldFunction.apply(self, args);

              var afterFunctions = ["after" + cf, "after" + cf[0].toUpperCase() + cf.slice(1)];

              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                var _loop2 = function _loop2() {
                  var af = _step3.value;

                  if (bsid in self.CustomSourceFunction && af in self.CustomSourceFunction[bsid]) {
                    return {
                      v: promise.then(function (result) {
                        return self.CustomSourceFunction[bsid][af].call(self, result);
                      })
                    };
                  }
                };

                for (var _iterator3 = afterFunctions[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var _ret2 = _loop2();

                  if ((typeof _ret2 === "undefined" ? "undefined" : _typeof(_ret2)) === "object") return _ret2.v;
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }

              return promise;
            };
          };

          for (var _iterator = customFunctionList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
      }
    }, {
      key: "getBook",
      value: function getBook(bsid, bookName, bookAuthor) {
        util.log("BookSourceManager: Get book \"" + bookName + "\" from " + bsid);

        if (!bsid || !bookName || !bookAuthor || !(bsid in this.sources)) return Promise.reject(401);

        return this.searchBook(bsid, bookName).then(function (books) {
          var book = books.find(function (e) {
            return e.name == bookName && e.author == bookAuthor;
          });
          return book ? book : Promise.reject(404);
        });
      }
    }, {
      key: "searchBookInAllBookSource",
      value: function searchBookInAllBookSource(keyword) {
        var _this3 = this;

        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$filterSameResult = _ref.filterSameResult,
            filterSameResult = _ref$filterSameResult === undefined ? true : _ref$filterSameResult;

        util.log("BookSourceManager: Search Book in all booksource \"" + keyword + "\"");

        var result = {};
        var errorList = [];
        var allBsids = this.getSourcesKeysByMainSourceWeight();
        var tasks = [];

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          var _loop4 = function _loop4() {
            var bsid = _step4.value;

            tasks.push(_this3.searchBook(bsid, keyword).then(function (books) {
              result[bsid] = books;
            }).catch(function (error) {
              errorList.push(error);
            }));
          };

          for (var _iterator4 = allBsids[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            _loop4();
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        function handleResult() {
          var finalResult = [];

          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = allBsids[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var bsid = _step5.value;

              var books = result[bsid];
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                var _loop3 = function _loop3() {
                  var b = _step6.value;

                  if (filterSameResult) {
                    if (!finalResult.find(function (e) {
                      return Book.equal(e, b);
                    })) finalResult.push(b);
                  } else finalResult.push(b);
                };

                for (var _iterator6 = books[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                  _loop3();
                }
              } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                  }
                } finally {
                  if (_didIteratorError6) {
                    throw _iteratorError6;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }

          if (finalResult.length === 0 && errorList.length > 0) {
            var re = util.arrayCount(errorList);
            throw re[0][0];
          }

          return finalResult;
        }

        return Promise.all(tasks).then(handleResult);
      }
    }, {
      key: "searchBook",
      value: function searchBook(bsid, keyword) {

        util.log("BookSourceManager: Search Book \"" + keyword + "\" from " + bsid);

        var self = this;
        var bs = this.sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.spider.get(bs.search, { keyword: keyword }).then(getBooks);

        function getBooks(data) {

          var books = [];

          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = data[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var m = _step7.value;

              m.cover = m.coverImg;
              var book = Book.createBook(m, self);
              if (!checkBook(book)) continue;

              book.sources = {};

              var bss = new BookSource(book, self, bsid, bs.contentSourceWeight);

              if (m.bookid) bss.bookid = m.bookid;

              bss.detailLink = m.detailLink;
              if (m.lastestChapter) {
                bss.lastestChapter = m.lastestChapter.replace(/^最新更新\s+/, '');
              }


              bss.searched = true;
              book.sources[bsid] = bss;

              book.mainSourceId = bsid;
              books.push(book);
            }
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }

          return books;
        }

        function checkBook(book) {
          var name = book.name.toLowerCase();
          var author = book.author.toLowerCase();
          var keywords = keyword.toLowerCase().split(/ +/);
          var _iteratorNormalCompletion8 = true;
          var _didIteratorError8 = false;
          var _iteratorError8 = undefined;

          try {
            for (var _iterator8 = keywords[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
              var kw = _step8.value;

              if (kw.indexOf(name) >= 0 || kw.indexOf(author) >= 0 || name.indexOf(kw) >= 0 || author.indexOf(kw) >= 0) return true;
            }
          } catch (err) {
            _didIteratorError8 = true;
            _iteratorError8 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
              }
            } finally {
              if (_didIteratorError8) {
                throw _iteratorError8;
              }
            }
          }

          return false;
        }
      }
    }, {
      key: "getBookInfo",
      value: function getBookInfo(bsid, detailLink) {

        util.log("BookSourceManager: Get Book Info from " + bsid + " with link \"" + detailLink + "\"");

        var bs = this.sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.spider.get(bs.detail, { url: detailLink, detailLink: detailLink }).then(function (data) {
          data.cover = data.coverImg;
          delete data.coverImg;
          return data;
        });
      }
    }, {
      key: "getLastestChapter",
      value: function getLastestChapter(bsid, detailLink) {
        util.log("BookSourceManager: Get Lastest Chapter from " + bsid + " with link \"" + detailLink + "\"");

        var bsm = this.sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.spider.get(bsm.detail, { url: detailLink, detailLink: detailLink }).then(function (data) {
          return data.lastestChapter.replace(/^最新更新\s+/, '');
        });
      }
    }, {
      key: "getBookCatalogLink",
      value: function getBookCatalogLink(bsid, locals) {

        util.log("BookSourceManager: Get Book Catalog Link from " + bsid + "\"");

        var bs = this.sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        if (!bs.catalogLink) return Promise.resolve(null);

        return this.spider.get(bs.catalogLink, locals);
      }
    }, {
      key: "getBookCatalog",
      value: function getBookCatalog(bsid, locals) {

        util.log("BookSourceManager: Refresh Catalog from " + bsid);

        var bsm = this.sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.spider.get(bsm.catalog, locals).then(function (data) {

          var catalog = [];
          var _iteratorNormalCompletion9 = true;
          var _didIteratorError9 = false;
          var _iteratorError9 = undefined;

          try {
            for (var _iterator9 = data[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
              var c = _step9.value;

              var chapter = new Chapter();
              chapter.title = c.title;
              chapter.link = c.link;
              catalog.push(chapter);
            }
          } catch (err) {
            _didIteratorError9 = true;
            _iteratorError9 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion9 && _iterator9.return) {
                _iterator9.return();
              }
            } finally {
              if (_didIteratorError9) {
                throw _iteratorError9;
              }
            }
          }

          return catalog;
        });
      }
    }, {
      key: "getChapter",
      value: function getChapter(bsid, chapterLink) {

        util.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapterLink + "\"");

        if (!chapterLink) return Promise.reject(206);

        var bsm = this.sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.spider.get(bsm.chapter, { url: chapterLink, chapterLink: chapterLink }).then(function (data) {
          var chapter = new Chapter();
          chapter.content = util.html2text(data.contentHTML);

          if (!chapter.content) {
            return Promise.reject(206);
          }
          chapter.link = chapterLink;
          chapter.title = data.title;

          return chapter;
        });
      }
    }, {
      key: "getSourcesKeysByMainSourceWeight",
      value: function getSourcesKeysByMainSourceWeight() {
        var object = this.sources;
        var key = "mainSourceWeight";
        return Object.entries(object).sort(function (e1, e2) {
          return -e1[1][key] + e2[1][key];
        }).map(function (e) {
          return e[0];
        });
      }
    }, {
      key: "getBookSourceName",
      value: function getBookSourceName(bsid) {
        try {
          return this.sources[bsid].name;
        } catch (e) {
          return "";
        }
      }
    }]);

    return BookSourceManager;
  }();

  BookSourceManager.prototype.CustomSourceFunction = {

    qidian: {
      csrfToken: "",
      getCSRToken: function getCSRToken() {
        var url = "http://book.qidian.com/ajax/book/category?_csrfToken=&bookId=2750457";
        if (typeof cordovaHTTP != 'undefined') {
          cordovaHTTP.get(url, {}, {}, function (response) {
            debugger;
          }, function (e) {
            debugger;
          });
        }
      },
      init: function init() {
        return this.getCSRToken();
      }
    }

  };

  return BookSourceManager;
});
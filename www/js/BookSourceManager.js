"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['co', "util", "Spider", "translate", "Book", "BookSource", "Chapter", "CustomBookSource"], function (co, util, Spider, translate, Book, BookSource, Chapter, customBookSource) {
  "use strict";

  var BookSourceManager = function () {
    function BookSourceManager(configFileOrConfig) {
      _classCallCheck(this, BookSourceManager);

      this.__sources;
      this.__spider = new Spider();

      this.loadConfig(configFileOrConfig);
      this.addCustomSourceFeature();
    }

    _createClass(BookSourceManager, [{
      key: "getBookSourcesBySameType",
      value: function getBookSourcesBySameType(bsid) {
        if (!bsid || !(bsid in this.__sources)) return null;
        var result = {};
        var type = this.__sources[bsid].type;
        for (var key in this.__sources) {
          if (this.__sources[key].type == type) result[key] = this.__sources[key];
        }
        return result;
      }
    }, {
      key: "init",
      value: function init() {
        return Promise.all(Object.values(customBookSource).map(function (cm) {
          return cm.init && cm.init();
        }));
      }
    }, {
      key: "loadConfig",
      value: function loadConfig(configFileOrConfig) {
        var _this = this;

        if (configFileOrConfig && typeof configFileOrConfig == 'string') {
          return util.getJSON(configFileOrConfig).then(function (data) {
            _this.__sources = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = data.valid[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var key = _step.value;

                _this.__sources[key] = data.sources[key];
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
          }).then(function () {
            return _this.init();
          }).then(function () {
            return _this.__sources;
          });
        } else if (configFileOrConfig) {
          this.__sources = configFileOrConfig;
        }
        return this.init().then(function () {
          return _this.__sources;
        });
      }
    }, {
      key: "addCustomSourceFeature",
      value: function addCustomSourceFeature() {
        var _this2 = this;

        var customFunctionList = ["getBook", "searchBook", "getBookInfo", "getChapter", "getBookCatalog", "getBookCatalogLink", "getLastestChapter"];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          var _loop = function _loop() {
            var cf = _step2.value;

            var oldFunction = _this2[cf];
            var self = _this2;
            _this2[cf] = function (bsid) {
              var beforeFunctions = ["before" + cf, "before" + cf[0].toUpperCase() + cf.slice(1)];
              var args = arguments;
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = beforeFunctions[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var bf = _step3.value;

                  if (bsid in customBookSource && bf in customBookSource[bsid]) {
                    args = customBookSource[bsid][bf].apply(self, args);
                    break;
                  }
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

              var promise = void 0;

              if (bsid in customBookSource && cf in customBookSource[bsid]) promise = customBookSource[bsid][cf].apply(self, args);else promise = oldFunction.apply(self, args);

              var afterFunctions = ["after" + cf, "after" + cf[0].toUpperCase() + cf.slice(1)];

              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                var _loop2 = function _loop2() {
                  var af = _step4.value;

                  if (bsid in customBookSource && af in customBookSource[bsid]) {
                    return {
                      v: promise.then(function (result) {
                        return customBookSource[bsid][af].call(self, result);
                      })
                    };
                  }
                };

                for (var _iterator4 = afterFunctions[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var _ret2 = _loop2();

                  if ((typeof _ret2 === "undefined" ? "undefined" : _typeof(_ret2)) === "object") return _ret2.v;
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

              return promise;
            };
          };

          for (var _iterator2 = customFunctionList[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            _loop();
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
      }
    }, {
      key: "getBook",
      value: function getBook(bsid, bookName, bookAuthor) {
        util.log("BookSourceManager: Get book \"" + bookName + "\" from " + bsid);

        if (!bsid || !bookName || !bookAuthor || !(bsid in this.__sources)) return Promise.reject(401);

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

        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          var _loop4 = function _loop4() {
            var bsid = _step5.value;

            tasks.push(_this3.searchBook(bsid, keyword).then(function (books) {
              result[bsid] = books;
            }).catch(function (error) {
              errorList.push(error);
            }));
          };

          for (var _iterator5 = allBsids[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            _loop4();
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

        function handleResult() {
          var finalResult = [];

          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = allBsids[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var bsid = _step6.value;

              var books = result[bsid];
              if (!books) break;
              var _iteratorNormalCompletion7 = true;
              var _didIteratorError7 = false;
              var _iteratorError7 = undefined;

              try {
                var _loop3 = function _loop3() {
                  var b = _step7.value;

                  if (filterSameResult) {
                    if (!finalResult.find(function (e) {
                      return Book.equal(e, b);
                    })) finalResult.push(b);
                  } else finalResult.push(b);
                };

                for (var _iterator7 = books[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                  _loop3();
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

          if (finalResult.length === 0 && errorList.length > 0) {
            var re = util.arrayCount(errorList);
            throw re[0][0];
          }

          return finalResult;
        }

        return Promise.all(tasks).then(handleResult);
      }
    }, {
      key: "__createBook",
      value: function __createBook(bs, m) {
        m.cover = m.coverImg;

        var book = Book.createBook(m, this);
        book.sources = {};
        var bss = new BookSource(book, this, bs.id, bs.contentSourceWeight);

        if ("bookid" in m) bss.bookid = m.bookid;
        if ("detailLink" in m) bss.detailLink = m.detailLink;
        if ("catalogLink" in m) bss.catalogLink = m.catalogLink;
        if (m.lastestChapter) {
          bss.lastestChapter = m.lastestChapter.replace(/^最新更新\s+/, '');
        }

        bss.searched = true;
        book.sources[bs.id] = bss;

        book.mainSourceId = bs.id;
        return book;
      }
    }, {
      key: "searchBook",
      value: function searchBook(bsid, keyword) {

        util.log("BookSourceManager: Search Book \"" + keyword + "\" from " + bsid);

        var self = this;
        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bs.search, { keyword: keyword }).then(getBooks);

        function getBooks(data) {

          var books = [];

          var _iteratorNormalCompletion8 = true;
          var _didIteratorError8 = false;
          var _iteratorError8 = undefined;

          try {
            for (var _iterator8 = data[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
              var m = _step8.value;

              if (!checkBook(m)) continue;
              books.push(self.__createBook(bs, m));
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

          return books;
        }

        function checkBook(book) {
          var name = book.name.toLowerCase();
          var author = book.author.toLowerCase();
          var keywords = keyword.toLowerCase().split(/ +/);
          var _iteratorNormalCompletion9 = true;
          var _didIteratorError9 = false;
          var _iteratorError9 = undefined;

          try {
            for (var _iterator9 = keywords[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
              var kw = _step9.value;

              if (kw.includes(name) || kw.includes(author) || name.includes(kw) || author.includes(kw)) return true;
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

          return false;
        }
      }
    }, {
      key: "getBookInfo",
      value: function getBookInfo(bsid, dict) {
        var _this4 = this;

        util.log("BookSourceManager: Get Book Info from " + bsid);

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bs.detail, dict).then(function (m) {
          m.bookid = dict.bookid;
          var book = _this4.__createBook(bs, m);
          return book;
        });
      }
    }, {
      key: "getLastestChapter",
      value: function getLastestChapter(bsid, dict) {
        util.log("BookSourceManager: Get Lastest Chapter from " + bsid + "\"");

        var bsm = this.__sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bsm.detail, dict).then(function (data) {
          return data.lastestChapter.replace(/^最新更新\s+/, '');
        });
      }
    }, {
      key: "getBookCatalogLink",
      value: function getBookCatalogLink(bsid, dict) {

        util.log("BookSourceManager: Get Book Catalog Link from " + bsid + "\"");

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        if (!bs.catalogLink) return Promise.resolve(null);

        return this.__spider.get(bs.catalogLink, dict);
      }
    }, {
      key: "getBookCatalog",
      value: function getBookCatalog(bsid, dict) {

        util.log("BookSourceManager: Refresh Catalog from " + bsid);

        var bsm = this.__sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bsm.catalog, dict).then(function (data) {

          var catalog = [];
          var _iteratorNormalCompletion10 = true;
          var _didIteratorError10 = false;
          var _iteratorError10 = undefined;

          try {
            for (var _iterator10 = data[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
              var c = _step10.value;

              var chapter = new Chapter();
              chapter.title = c.title;
              chapter.link = c.link;
              catalog.push(chapter);
            }
          } catch (err) {
            _didIteratorError10 = true;
            _iteratorError10 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion10 && _iterator10.return) {
                _iterator10.return();
              }
            } finally {
              if (_didIteratorError10) {
                throw _iteratorError10;
              }
            }
          }

          return catalog;
        });
      }
    }, {
      key: "getChapter",
      value: function getChapter(bsid) {
        var _this5 = this;

        var chapter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        util.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapter.link + "\"");

        if (!chapter.link) return Promise.reject(206);

        var bsm = this.__sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bsm.chapter, { url: chapter.link, chapterLink: chapter.link }).then(function (data) {
          var c = new Chapter();
          c.content = _this5.__spider.clearHtml(data.contentHTML);

          if (!c.content) {
            return Promise.reject(206);
          }
          c.link = chapter.link;
          c.title = data.title;

          return c;
        });
      }
    }, {
      key: "getSourcesKeysByMainSourceWeight",
      value: function getSourcesKeysByMainSourceWeight() {
        var object = this.__sources;
        var key = "mainSourceWeight";
        return Object.entries(object).sort(function (e1, e2) {
          return -e1[1][key] + e2[1][key];
        }).map(function (e) {
          return e[0];
        });
      }
    }, {
      key: "getBookSource",
      value: function getBookSource(bsid) {
        try {
          return this.__sources[bsid];
        } catch (e) {
          return {};
        }
      }
    }, {
      key: "getBookSourceTypeName",
      value: function getBookSourceTypeName(bsid) {
        try {
          var typeName = {
            "comics": "漫画",
            "novel": "小说"
          };
          return typeName[this.__sources[bsid].type];
        } catch (e) {
          return "";
        }
      }
    }]);

    return BookSourceManager;
  }();

  return BookSourceManager;
});
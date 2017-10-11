"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["BookSourceManager"] = factory.apply(undefined, deps.map(function (e) {
    return window[e];
  }));
})(['co', "utils", "LittleCrawler", "translate", "Book", "BookSource", "Chapter"], function (co, utils, LittleCrawler, translate, Book, BookSource, Chapter) {
  "use strict";

  var BookSourceManager = function () {
    function BookSourceManager(configFileOrConfig, customBookSource) {
      _classCallCheck(this, BookSourceManager);

      this.__sources;
      this.__customBookSource = customBookSource;
      this.__lc = new LittleCrawler();

      this.loadConfig(configFileOrConfig);
      this.addCustomSourceFeature();
    }

    _createClass(BookSourceManager, [{
      key: "loadConfig",
      value: function loadConfig(configFileOrConfig) {
        var _this = this;

        var loadSources = function loadSources(data) {
          _this.__sources = {};
          data.valid.forEach(function (key) {
            return _this.__sources[key] = data.sources[key];
          });
        };
        if (configFileOrConfig && typeof configFileOrConfig == 'string') {
          return utils.getJSON(configFileOrConfig).then(function (data) {
            loadSources(data);
            return _this.__sources;
          });
        } else if (configFileOrConfig) {
          loadSources(configFileOrConfig);
        }
        return this.__sources;
      }
    }, {
      key: "addCustomSourceFeature",
      value: function addCustomSourceFeature() {
        var _this2 = this;

        if (!this.__customBookSource) return;
        var customFunctionList = ["getBook", "searchBook", "getBookInfo", "getChapterContent", "getBookCatalog", "getBookCatalogLink", "getLastestChapter"];

        customFunctionList.forEach(function (cf) {
          var oldFunction = _this2[cf];
          var self = _this2;
          _this2[cf] = function (bsid) {
            var _this3 = this,
                _arguments = arguments;

            utils.log("BookSourceManager: Call " + cf + " from " + bsid);

            var beforeFunctions = ["before" + cf, "before" + cf[0].toUpperCase() + cf.slice(1)];
            var argsPromise = Promise.resolve(arguments);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = beforeFunctions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var bf = _step.value;

                if (bsid in this.__customBookSource && bf in this.__customBookSource[bsid]) {
                  argsPromise = this.__customBookSource[bsid][bf].apply(self, arguments);
                  break;
                }
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

            var promise = void 0;

            if (bsid in this.__customBookSource && cf in this.__customBookSource[bsid]) promise = argsPromise.then(function (args) {
              return _this3.__customBookSource[bsid][cf].apply(self, args);
            });else promise = argsPromise.then(function (args) {
                return oldFunction.apply(self, args);
              });

            var afterFunctions = ["after" + cf, "after" + cf[0].toUpperCase() + cf.slice(1)];

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              var _loop = function _loop() {
                var af = _step2.value;

                if (bsid in _this3.__customBookSource && af in _this3.__customBookSource[bsid]) {
                  return {
                    v: promise.then(function (result) {
                      return _this3.__customBookSource[bsid][af].call(self, result, _arguments);
                    })
                  };
                }
              };

              for (var _iterator2 = afterFunctions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _ret = _loop();

                if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
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

            return promise;
          };
        });

        return Promise.all(Object.values(this.__customBookSource).map(function (cm) {
          return cm.init && cm.init();
        }));
      }
    }, {
      key: "getBook",
      value: function getBook(bsid, bookName, bookAuthor) {

        if (!bsid || !bookName || !(bsid in this.__sources)) return Promise.reject(401);

        return this.searchBook(bsid, bookName).then(function (books) {
          var book = books.find(function (e) {
            return e.name == bookName && (!e.author || !bookAuthor || e.author == bookAuthor);
          });
          return book ? book : Promise.reject(404);
        });
      }
    }, {
      key: "searchBookInAllBookSource",
      value: function searchBookInAllBookSource(keyword) {
        var _this4 = this;

        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$filterSameResult = _ref.filterSameResult,
            filterSameResult = _ref$filterSameResult === undefined ? true : _ref$filterSameResult,
            _ref$bookType = _ref.bookType,
            bookType = _ref$bookType === undefined ? "" : _ref$bookType;

        var result = {};
        var successBS = [];
        var failBS = [];
        var errorList = [];
        var allBsids = this.getSourcesKeysByMainSourceWeight();
        var bsids = !bookType ? allBsids : allBsids.filter(function (e) {
          return _this4.__sources[e].type == bookType;
        });
        var tasks = bsids.map(function (bsid) {
          return _this4.searchBook(bsid, keyword).then(function (books) {
            result[bsid] = books;
            successBS.push(bsid);
          }).catch(function (error) {
            failBS.push(bsid);
            errorList.push(error);
          });
        });

        function handleResult() {
          var finalResult = [];

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = bsids[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var bsid = _step3.value;

              var books = result[bsid];
              if (!books) break;
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                var _loop2 = function _loop2() {
                  var b = _step4.value;

                  if (filterSameResult) {
                    if (!finalResult.find(function (e) {
                      return Book.equal(e, b);
                    })) finalResult.push(b);
                  } else finalResult.push(b);
                };

                for (var _iterator4 = books[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  _loop2();
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

          if (finalResult.length === 0 && errorList.length > 0) throw utils.findMostError(errorList);

          return {
            books: finalResult,
            successBookSources: successBS,
            failBookSources: failBS
          };
        }

        return Promise.all(tasks).then(handleResult);
      }
    }, {
      key: "__createBook",
      value: function __createBook(bs, m, language) {

        m = translate.toSC(language, m, ['name', 'author', 'catagory', 'introduce', "lastestChapter"]);

        m.cover = m.coverImg;

        var book = LittleCrawler.cloneObjectValues(new Book(this), m);
        var bss = LittleCrawler.cloneObjectValues(new BookSource(book, this, bs.id, bs.contentSourceWeight), m);
        book.sources = {};
        if (bss.lastestChapter) bss.lastestChapter = bss.lastestChapter.replace(/^最新更新\s+/, '');

        bss.__searched = true;
        book.sources[bs.id] = bss;

        book.mainSourceId = bs.id;

        return book;
      }
    }, {
      key: "searchBook",
      value: function searchBook(bsid, keyword) {

        var self = this;
        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        keyword = translate.fromSC(bs.language, keyword, ['keyword']);

        var dict = void 0;
        if ((typeof keyword === "undefined" ? "undefined" : _typeof(keyword)) == "object") {
          dict = keyword;
          keyword = dict.keyword;
        } else dict = { keyword: keyword ? keyword : "" };

        return this.__lc.get(bs.search, dict).then(getBooks);

        function getBooks(data) {

          data = data.filter(function (m) {
            return m.name || m.author;
          });

          var books = [];

          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = data[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var m = _step5.value;

              m.author = m.author || "";
              if (!checkBook(m)) continue;
              books.push(self.__createBook(bs, m, bs.language));
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

          return books;
        }

        function checkBook(book) {
          var name = book.name.toLowerCase();
          var author = book.author.toLowerCase();
          var keywords = keyword.toLowerCase().split(/ +/);
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = keywords[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var kw = _step6.value;

              if (kw.includes(name) || name.includes(kw) || author && kw.includes(author) || author.includes(kw)) return true;
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

          return false;
        }
      }
    }, {
      key: "getBookInfo",
      value: function getBookInfo(bsid, dict) {
        var _this5 = this;

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__lc.get(bs.detail, dict).then(function (m) {
          m.bookid = dict.bookid;
          m.catalogLink = dict.catalogLink;
          m.detailLink = dict.detailLink;
          var book = _this5.__createBook(bs, m, bs.language);
          return book;
        });
      }
    }, {
      key: "getLastestChapter",
      value: function getLastestChapter(bsid, dict) {

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__lc.get(bs.detail, dict).then(function (_ref2) {
          var lastestChapter = _ref2.lastestChapter;

          lastestChapter = translate.toSC(bs.language, lastestChapter);
          return lastestChapter ? lastestChapter.replace(/^最新更新\s+/, '') : lastestChapter;
        });
      }
    }, {
      key: "getBookCatalogLink",
      value: function getBookCatalogLink(bsid, dict) {

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        if (!bs.catalogLink) return Promise.resolve(null);

        return this.__lc.get(bs.catalogLink, dict);
      }
    }, {
      key: "getBookCatalog",
      value: function getBookCatalog(bsid, dict) {

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__lc.get(bs.catalog, dict).then(function (data) {
          if (bs.catalog.hasVolume) data = data.map(function (v) {
            return v.chapters.map(function (c) {
              return c.volume = v.name, c;
            });
          }).reduce(function (s, e) {
            return s.concat(e);
          }, []);
          data = data.map(function (c) {
            return translate.toSC(bs.language, c, ['title']);
          });
          return data.map(function (c) {
            return LittleCrawler.cloneObjectValues(new Chapter(), c);
          });
        });
      }
    }, {
      key: "getChapterContent",
      value: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        if (!dict.link && !dict.cid) return Promise.reject(206);

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__lc.get(bs.chapter, dict).then(function (_ref3) {
          var content = _ref3.contentHTML;

          if (!content.match(/<\/?\w+.*?>/i)) content = LittleCrawler.text2html(content);else content = LittleCrawler.clearHtml(content);
          content = translate.toSC(bs.language, content);
          return content;
        });
      }
    }, {
      key: "hasVolume",
      value: function hasVolume(bsid) {
        var bs = this.__sources[bsid];
        if (!bs) throw new Error("Illegal booksource!");
        return bs.catalog.hasVolume;
      }
    }, {
      key: "getOfficialURLs",
      value: function getOfficialURLs(bsid, dict, key) {

        var bs = this.__sources[bsid];
        if (!bs) throw new Error("Illegal booksource!");

        var config = bs.officialurls;
        if (!config) return null;
        if (key && config[key]) return LittleCrawler.format(config[key], dict);
        if (!key) {
          var result = {};
          for (var _key in config) {
            result[_key] = LittleCrawler.format(config[_key], dict);
          }
        }
        return null;
      }
    }, {
      key: "getBookDetailLink",
      value: function getBookDetailLink(bsid, dict) {

        var bs = this.__sources[bsid];
        if (!bs) throw new Error("Illegal booksource!");

        return this.__lc.getLink(bs.detail.request, dict);
      }
    }, {
      key: "getChapterLink",
      value: function getChapterLink(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        if (!dict.link && !dict.cid) throw new Error(206);

        var bs = this.__sources[bsid];
        if (!bs) throw new Error("Illegal booksource!");

        return this.__lc.getLink(bs.chapter.request, dict);
      }
    }, {
      key: "getSourcesKeysByMainSourceWeight",
      value: function getSourcesKeysByMainSourceWeight(type) {
        var sources = type != undefined ? this.getBookSourcesByBookType(type) : this.__sources;
        var key = "mainSourceWeight";
        return Object.entries(sources).sort(function (e1, e2) {
          return -e1[1][key] + e2[1][key];
        }).map(function (e) {
          return e[0];
        });
      }
    }, {
      key: "getBookSourcesBySameType",
      value: function getBookSourcesBySameType(bsid) {
        if (!bsid || !(bsid in this.__sources)) return null;
        var result = {};
        var type = this.__sources[bsid].type;
        return this.getBookSourcesByBookType(type);
      }
    }, {
      key: "getBookSourcesByBookType",
      value: function getBookSourcesByBookType(type) {
        if (!type) return this.__sources;
        var result = {};
        for (var key in this.__sources) {
          if (this.__sources[key].type == type) result[key] = this.__sources[key];
        }
        return result;
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
    }, {
      key: "getBookSourceType",
      value: function getBookSourceType(bsid) {
        try {
          return this.__sources[bsid].type;
        } catch (e) {
          return null;
        }
      }
    }]);

    return BookSourceManager;
  }();

  return BookSourceManager;
});
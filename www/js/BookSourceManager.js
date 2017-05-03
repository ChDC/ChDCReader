"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["BookSourceManager"] = factory();
})(['co', "utils", "Spider", "translate", "Book", "BookSource", "Chapter"], function (co, utils, Spider, translate, Book, BookSource, Chapter) {
  "use strict";

  var BookSourceManager = function () {
    function BookSourceManager(configFileOrConfig, customBookSource) {
      _classCallCheck(this, BookSourceManager);

      this.__sources;
      this.__customBookSource = customBookSource;
      this.__spider = new Spider({
        "default": utils.ajax.bind(utils),
        "cordova": utils.cordovaAjax.bind(utils)
      });

      this.loadConfig(configFileOrConfig);
      this.addCustomSourceFeature();
    }

    _createClass(BookSourceManager, [{
      key: "loadConfig",
      value: function loadConfig(configFileOrConfig) {
        var _this = this;

        if (configFileOrConfig && typeof configFileOrConfig == 'string') {
          return utils.getJSON(configFileOrConfig).then(function (data) {
            _this.__sources = {};
            data.valid.forEach(function (key) {
              return _this.__sources[key] = data.sources[key];
            });
            return _this.__sources;
          });
        } else if (configFileOrConfig) {
          this.__sources = configFileOrConfig;
        }
        return this.__sources;
      }
    }, {
      key: "addCustomSourceFeature",
      value: function addCustomSourceFeature() {
        var _this2 = this;

        if (!this.__customBookSource) return;
        var customFunctionList = ["getBook", "searchBook", "getBookInfo", "getChapter", "getBookCatalog", "getBookCatalogLink", "getLastestChapter"];

        customFunctionList.forEach(function (cf) {
          var oldFunction = _this2[cf];
          var self = _this2;
          _this2[cf] = function (bsid) {
            var _this3 = this,
                _arguments = arguments;

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
        utils.log("BookSourceManager: Get book \"" + bookName + "\" from " + bsid);

        if (!bsid || !bookName || !(bsid in this.__sources)) return Promise.reject(401);

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
        var _this4 = this;

        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$filterSameResult = _ref.filterSameResult,
            filterSameResult = _ref$filterSameResult === undefined ? true : _ref$filterSameResult;

        utils.log("BookSourceManager: Search Book in all booksource \"" + keyword + "\"");

        var result = {};
        var errorList = [];
        var allBsids = this.getSourcesKeysByMainSourceWeight();
        var tasks = allBsids.map(function (bsid) {
          return _this4.searchBook(bsid, keyword).then(function (books) {
            result[bsid] = books;
          }).catch(function (error) {
            errorList.push(error);
          });
        });

        function handleResult() {
          var finalResult = [];

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = allBsids[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
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

          if (finalResult.length === 0 && errorList.length > 0) {
            var re = utils.arrayCount(errorList);
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

        var book = this.__spider.cloneObjectValues(new Book(this), m);
        var bss = this.__spider.cloneObjectValues(new BookSource(book, this, bs.id, bs.contentSourceWeight), m);
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

        utils.log("BookSourceManager: Search Book \"" + keyword + "\" from " + bsid);

        var self = this;
        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bs.search, { keyword: keyword }).then(getBooks);

        function getBooks(data) {

          var books = [];

          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = data[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var m = _step5.value;

              m.author = m.author || "";
              if (!checkBook(m)) continue;
              books.push(self.__createBook(bs, m));
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

              if (kw.includes(name) || kw.includes(author) || name.includes(kw) || author.includes(kw)) return true;
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

        utils.log("BookSourceManager: Get Book Info from " + bsid);

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bs.detail, dict).then(function (m) {
          m.bookid = dict.bookid;
          m.catalogLink = dict.catalogLink;
          m.detailLink = dict.detailLink;
          var book = _this5.__createBook(bs, m);
          return book;
        });
      }
    }, {
      key: "getLastestChapter",
      value: function getLastestChapter(bsid, dict) {
        utils.log("BookSourceManager: Get Lastest Chapter from " + bsid + "\"");

        var bsm = this.__sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bsm.detail, dict).then(function (data) {
          return data.lastestChapter.replace(/^最新更新\s+/, '');
        });
      }
    }, {
      key: "getBookCatalogLink",
      value: function getBookCatalogLink(bsid, dict) {

        utils.log("BookSourceManager: Get Book Catalog Link from " + bsid + "\"");

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        if (!bs.catalogLink) return Promise.resolve(null);

        return this.__spider.get(bs.catalogLink, dict);
      }
    }, {
      key: "getBookCatalog",
      value: function getBookCatalog(bsid, dict) {
        var _this6 = this;

        utils.log("BookSourceManager: Refresh Catalog from " + bsid);

        var bsm = this.__sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bsm.catalog, dict).then(function (data) {
          if (bsm.catalog.hasVolume) data = data.map(function (v) {
            return v.chapters.map(function (c) {
              return c.volume = v.name, c;
            });
          }).reduce(function (s, e) {
            return s.concat(e);
          }, []);
          return data.map(function (c) {
            return _this6.__spider.cloneObjectValues(new Chapter(), c);
          });
        });
      }
    }, {
      key: "getChapter",
      value: function getChapter(bsid) {
        var _this7 = this;

        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid);

        if (!dict.link && !dict.cid) return Promise.reject(206);

        var bsm = this.__sources[bsid];
        if (!bsm) return Promise.reject("Illegal booksource!");

        return this.__spider.get(bsm.chapter, dict).then(function (data) {
          var c = new Chapter();
          if (!data.contentHTML.match(/<\/?\w+.*?>/i)) c.content = _this7.__spider.text2html(data.contentHTML);else c.content = _this7.__spider.clearHtml(data.contentHTML);
          if (!c.content) return Promise.reject(206);

          c.title = data.title ? data.title : dict.title;
          c.cid = data.cid ? data.cid : dict.cid;
          if (!c.cid && dict.link) c.link = dict.link;

          return c;
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
        utils.log("BookSourceManager: Get Book Detail Link from " + bsid + "\"");

        var bs = this.__sources[bsid];
        if (!bs) throw new Error("Illegal booksource!");

        var config = bs.officialurls;
        if (!config) return null;
        if (key && config[key]) return this.__spider.format(config[key], dict);
        if (!key) {
          var result = {};
          for (var _key in config) {
            result[_key] = this.__spider.format(config[_key], dict);
          }
        }
        return null;
      }
    }, {
      key: "getBookDetailLink",
      value: function getBookDetailLink(bsid, dict) {
        utils.log("BookSourceManager: Get Book Detail Link from " + bsid + "\"");

        var bs = this.__sources[bsid];
        if (!bs) throw new Error("Illegal booksource!");

        return this.__spider.getLink(bs.detail.request, dict);
      }
    }, {
      key: "getChapterLink",
      value: function getChapterLink(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        utils.log("BookSourceManager: Get Chpater link from " + bsid);

        if (!dict.link && !dict.cid) throw new Error(206);

        var bsm = this.__sources[bsid];
        if (!bsm) throw new Error("Illegal booksource!");

        return this.__spider.getLink(bsm.chapter.request, dict);
      }
    }, {
      key: "getSourcesKeysByMainSourceWeight",
      value: function getSourcesKeysByMainSourceWeight(bsid) {
        var sources = bsid ? this.getBookSourcesBySameType(bsid) : this.__sources;
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
    }]);

    return BookSourceManager;
  }();

  return BookSourceManager;
});
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["Book"] = factory.apply(undefined, deps.map(function (e) {
    return window[e];
  }));
})(["co", "utils", "Chapter", "BookSource"], function (co, utils, Chapter, BookSource) {
  "use strict";

  var Book = function () {
    function Book(bookSourceManager) {
      _classCallCheck(this, Book);

      this.bookSourceManager = bookSourceManager;

      this.name = "";
      this.author = "";
      this.catagory = "";
      this.cover = "";
      this.complete = undefined;
      this.introduce = "";

      this.sources = undefined;
      this.mainSourceId = undefined;
    }

    _createClass(Book, [{
      key: "getBookSource",
      value: function getBookSource() {
        var _this = this;

        var bookSourceId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.mainSourceId;


        return new Promise(function (resolve, reject) {
          var bs = _this.sources[bookSourceId];
          if (bs) {
            resolve(bs);
          } else {
            var bsm = _this.bookSourceManager.getBookSource(bookSourceId);
            if (bsm) {
              var bss = new BookSource(_this, _this.bookSourceManager, bookSourceId, bsm.contentSourceWeight);
              _this.sources[bookSourceId] = bss;
              resolve(bss);
            } else {
              reject(302);
            }
          }
        });
      }
    }, {
      key: "getOfficialDetailLink",
      value: function getOfficialDetailLink() {
        var bookSourceId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.mainSourceId;

        try {
          return this.bookSourceManager.getOfficialURLs(bookSourceId, this.sources[bookSourceId], "bookdetail");
        } catch (error) {
          return null;
        }
      }
    }, {
      key: "getSourcesKeysByMainSourceWeight",
      value: function getSourcesKeysByMainSourceWeight() {
        var type = this.bookSourceManager.getBookSourceType(this.mainSourceId);
        return this.bookSourceManager.getSourcesKeysByMainSourceWeight(type);
      }
    }, {
      key: "getSourcesKeysSortedByWeight",
      value: function getSourcesKeysSortedByWeight() {
        var object = this.sources;
        var key = "weight";
        return Object.entries(object).sort(function (e1, e2) {
          return -e1[1][key] + e2[1][key];
        }).map(function (e) {
          return e[0];
        });
      }
    }, {
      key: "checkBookSources",
      value: function checkBookSources() {
        var sources = this.bookSourceManager.getBookSourcesBySameType(this.mainSourceId);

        for (var k in sources) {
          if (!(k in this.sources)) {
            this.sources[k] = new BookSource(this, this.bookSourceManager, k, sources[k].contentSourceWeight);
          }
        }

        for (var _k in this.sources) {
          if (!(_k in sources)) {
            delete this.sources[_k];
          }
        }
      }
    }, {
      key: "setMainSourceId",
      value: function setMainSourceId(bookSourceId) {
        var _this2 = this;

        return new Promise(function (resolve, reject) {
          if (_this2.mainSourceId == bookSourceId) return;

          if (bookSourceId && bookSourceId in _this2.bookSourceManager.getBookSourcesBySameType(_this2.mainSourceId)) {
            _this2.mainSourceId = bookSourceId;
            resolve(_this2);
          } else {
            reject(301);
          }
        });
      }
    }, {
      key: "getType",
      value: function getType() {
        return this.bookSourceManager.getBookSourceType(this.mainSourceId);
      }
    }, {
      key: "getCatalog",
      value: function getCatalog() {
        var _this3 = this;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$forceRefresh = _ref.forceRefresh,
            forceRefresh = _ref$forceRefresh === undefined ? false : _ref$forceRefresh,
            _ref$refresh = _ref.refresh,
            refresh = _ref$refresh === undefined ? false : _ref$refresh,
            _ref$bookSourceId = _ref.bookSourceId,
            bookSourceId = _ref$bookSourceId === undefined ? this.mainSourceId : _ref$bookSourceId,
            _ref$groupByVolume = _ref.groupByVolume,
            groupByVolume = _ref$groupByVolume === undefined ? false : _ref$groupByVolume,
            _ref$countPerGroup = _ref.countPerGroup,
            countPerGroup = _ref$countPerGroup === undefined ? 100 : _ref$countPerGroup;

        return this.getBookSource(bookSourceId).then(function (bs) {
          return bs.getCatalog({ forceRefresh: forceRefresh, refresh: refresh });
        }).then(function (catalog) {
          if (!catalog || catalog.length <= 0) return Promise.reject(501);
          if (!groupByVolume) return catalog;
          return _this3.groupCatalogByVolume(catalog, { bookSourceId: bookSourceId, countPerGroup: countPerGroup });
        });
      }
    }, {
      key: "groupCatalogByVolume",
      value: function groupCatalogByVolume(catalog) {
        var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref2$bookSourceId = _ref2.bookSourceId,
            bookSourceId = _ref2$bookSourceId === undefined ? this.mainSourceId : _ref2$bookSourceId,
            _ref2$countPerGroup = _ref2.countPerGroup,
            countPerGroup = _ref2$countPerGroup === undefined ? 100 : _ref2$countPerGroup;

        if (!catalog) return catalog;
        catalog.forEach(function (c, i) {
          return c.index = i;
        });

        if (this.bookSourceManager.hasVolume(bookSourceId)) {
          var result = [];
          var volumeName = NaN;
          var vi = -1;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = catalog[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var c = _step.value;

              if (volumeName != c.volume) {
                volumeName = c.volume;
                result[++vi] = { name: volumeName, chapters: [] };
              }
              result[vi].chapters.push(c);
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

          result.forEach(function (v) {
            return v.chapters = groupByNumber(v.chapters, countPerGroup);
          });
          if (result.length == 1) return result[0].chapters;
          return result;
        } else return groupByNumber(catalog, countPerGroup);

        function groupByNumber(catalog, countPerGroup) {
          var n = Math.ceil(catalog.length / countPerGroup);
          if (n <= 1) return catalog;
          return new Array(n).fill(0).map(function (e, i) {
            return {
              name: i * countPerGroup + 1 + "-" + (i + 1) * countPerGroup,
              chapters: catalog.slice(i * countPerGroup, (i + 1) * countPerGroup)
            };
          });
        }
      }
    }, {
      key: "refreshBookInfo",
      value: function refreshBookInfo() {
        var _this4 = this;

        var bookSourceId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.mainSourceId;


        return this.getBookSource(bookSourceId).then(function (bs) {
          return bs.getBookInfo();
        }).then(function (book) {
          if (book.catagory) _this4.catagory = book.catagory;
          if (book.cover) _this4.cover = book.cover;
          if (book.complete) _this4.complete = book.complete;
          if (book.introduce) _this4.introduce = book.introduce;
        });
      }
    }, {
      key: "index",
      value: function index(chapterIndex, options) {
        if (typeof chapterIndex != "number") {
          return Promise.reject(205);
        }

        if (chapterIndex < 0) {
          return Promise.reject(203);
        }

        return this.getCatalog(options).then(function (catalog) {
          if (chapterIndex >= 0 && chapterIndex < catalog.length) return catalog[chapterIndex];else if (chapterIndex >= catalog.length) return Promise.reject(202);else return Promise.reject(203);
        });
      }
    }, {
      key: "fuzzySearch",
      value: function fuzzySearch(sourceB, index, options) {

        var opts = Object.assign({}, options, { bookSourceId: sourceB });
        if (options.bookSourceId == sourceB) {
          return this.index(index, opts).then(function (chapter) {
            return { "chapter": chapter, "index": index };
          });
        }

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          var catalog, catalogB, matches, indexB, chapterB;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return self.getCatalog({ bookSourceId: options.bookSourceId });

                case 2:
                  catalog = _context.sent;
                  _context.next = 5;
                  return self.getCatalog(opts);

                case 5:
                  catalogB = _context.sent;
                  matches = [utils.listMatch.bind(utils), utils.listMatchWithNeighbour.bind(utils)];
                  indexB = Chapter.findEqualChapter(catalog, catalogB, index, matches, options.loose);

                  if (!(indexB >= 0)) {
                    _context.next = 13;
                    break;
                  }

                  chapterB = catalogB[indexB];
                  return _context.abrupt("return", Promise.resolve({ chapter: chapterB, index: indexB }));

                case 13:
                  return _context.abrupt("return", Promise.reject(201));

                case 14:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
      }
    }, {
      key: "getChapter",
      value: function getChapter(chapterIndex, options) {
        var _this5 = this;

        if (chapterIndex < 0) {
          return Promise.reject(203);;
        }

        options = Object.assign({}, options);
        options.bookSourceId = options.bookSourceId || this.mainSourceId;

        return this.index(chapterIndex, options).catch(function (error) {
          if (error != 202 || options.refresh || options.forceRefresh) return Promise.reject(error);
          options.refresh = true;
          return _this5.index(chapterIndex, options);
        }).then(function (chapter) {
          return co(_this5.__getChapterFromContentSources(chapter, chapterIndex, options));
        });
      }
    }, {
      key: "__getChapterFromContentSources",
      value: regeneratorRuntime.mark(function __getChapterFromContentSources(chapterA, index) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var _marked, _options$bookSourceId, bookSourceId, _options$count, count, excludes, contentSourceId, contentSourceChapterIndex, onlyCacheNoLoad, _options$noInfluenceW, noInfluenceWeight, _options$searchedSour, searchedSource, result, errorCodeList, remainCount, FOUND_WEIGHT, NOTFOUND_WEIGHT, EXECLUDE_WEIGHT, INCLUDE_WEIGHT, self, addChapterToResult, submitResult, getChapterFromContentSources2, getChapterFromAllContentSources, getChapterFromSelectBookSourceAndSelectSourceChapterIndex;

        return regeneratorRuntime.wrap(function __getChapterFromContentSources$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                getChapterFromSelectBookSourceAndSelectSourceChapterIndex = function getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex) {
                  var opts, chapterB, bs;
                  return regeneratorRuntime.wrap(function getChapterFromSelectBookSourceAndSelectSourceChapterIndex$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:

                          if (!noInfluenceWeight) self.sources[contentSourceId].weight += INCLUDE_WEIGHT;
                          opts = Object.assign({}, options, { bookSourceId: contentSourceId });
                          chapterB = void 0;
                          _context4.prev = 3;
                          _context4.next = 6;
                          return self.index(contentSourceChapterIndex, opts);

                        case 6:
                          chapterB = _context4.sent;
                          _context4.next = 17;
                          break;

                        case 9:
                          _context4.prev = 9;
                          _context4.t0 = _context4["catch"](3);

                          if (!(_context4.t0 != 202 || opts.refresh)) {
                            _context4.next = 13;
                            break;
                          }

                          throw _context4.t0;

                        case 13:
                          opts.refresh = true;
                          _context4.next = 16;
                          return self.index(contentSourceChapterIndex, opts);

                        case 16:
                          chapterB = _context4.sent;

                        case 17:
                          if (Chapter.equalTitle(chapterA, chapterB, true)) {
                            _context4.next = 19;
                            break;
                          }

                          throw 204;

                        case 19:
                          _context4.next = 21;
                          return self.getBookSource(contentSourceId);

                        case 21:
                          bs = _context4.sent;
                          _context4.next = 24;
                          return bs.getChapter(chapterB, onlyCacheNoLoad);

                        case 24:
                          chapterB = _context4.sent;

                          addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                          remainCount--;

                          if (!(remainCount > 0)) {
                            _context4.next = 33;
                            break;
                          }

                          debugger;
                          searchedSource.push(contentSourceId);
                          return _context4.abrupt("return", co(getChapterFromContentSources2()));

                        case 33:
                          return _context4.abrupt("return", submitResult());

                        case 34:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _marked[2], this, [[3, 9]]);
                };

                getChapterFromAllContentSources = function getChapterFromAllContentSources(includeSource, options) {
                  var contentSources, i, sourceB, _result, opts, _result2, chapterBB, indexB, bs, chapterB;

                  return regeneratorRuntime.wrap(function getChapterFromAllContentSources$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          contentSources = self.getSourcesKeysSortedByWeight().reverse();

                          if (excludes) {
                            excludes.forEach(function (exclude) {
                              var i = contentSources.indexOf(exclude);
                              if (i < 0) return;
                              contentSources.splice(i, 1);
                              if (!noInfluenceWeight) self.sources[exclude].weight += EXECLUDE_WEIGHT;
                            });
                          }
                          if (searchedSource) {
                            searchedSource.forEach(function (exclude) {
                              var i = contentSources.indexOf(exclude);
                              if (i < 0) return;
                              contentSources.splice(i, 1);
                            });
                          }

                          if (includeSource) {
                            if (!noInfluenceWeight) self.sources[includeSource].weight += INCLUDE_WEIGHT;
                          } else includeSource = bookSourceId;

                          i = contentSources.indexOf(includeSource);

                          if (i >= 0) contentSources.splice(i, 1);

                          contentSources.push(includeSource);

                        case 7:
                          if (!(contentSources.length > 0 && remainCount > 0)) {
                            _context3.next = 44;
                            break;
                          }

                          sourceB = contentSources.pop();

                          if (sourceB) {
                            _context3.next = 11;
                            break;
                          }

                          return _context3.abrupt("continue", 7);

                        case 11:
                          _context3.prev = 11;
                          _result = void 0;
                          _context3.prev = 13;
                          _context3.next = 16;
                          return self.fuzzySearch(sourceB, index, options);

                        case 16:
                          _result = _context3.sent;
                          _context3.next = 27;
                          break;

                        case 19:
                          _context3.prev = 19;
                          _context3.t0 = _context3["catch"](13);

                          if (!(_context3.t0 != 201 || options.refresh || options.forceRefresh)) {
                            _context3.next = 23;
                            break;
                          }

                          throw _context3.t0;

                        case 23:
                          opts = Object.assign({}, options, { refresh: true });
                          _context3.next = 26;
                          return self.fuzzySearch(sourceB, index, opts);

                        case 26:
                          _result = _context3.sent;

                        case 27:
                          _result2 = _result, chapterBB = _result2.chapter, indexB = _result2.index;
                          _context3.next = 30;
                          return self.getBookSource(sourceB);

                        case 30:
                          bs = _context3.sent;
                          _context3.next = 33;
                          return bs.getChapter(chapterBB, onlyCacheNoLoad);

                        case 33:
                          chapterB = _context3.sent;

                          addChapterToResult(chapterB, indexB, sourceB);
                          remainCount--;
                          _context3.next = 42;
                          break;

                        case 38:
                          _context3.prev = 38;
                          _context3.t1 = _context3["catch"](11);

                          errorCodeList.push(_context3.t1);
                          if (!noInfluenceWeight) self.sources[sourceB].weight += NOTFOUND_WEIGHT;

                        case 42:
                          _context3.next = 7;
                          break;

                        case 44:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _marked[1], this, [[11, 38], [13, 19]]);
                };

                getChapterFromContentSources2 = function getChapterFromContentSources2(includeSource) {
                  var opts;
                  return regeneratorRuntime.wrap(function getChapterFromContentSources2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          _context2.next = 2;
                          return getChapterFromAllContentSources(includeSource, options);

                        case 2:
                          if (!(result.length <= 0)) {
                            _context2.next = 6;
                            break;
                          }

                          opts = Object.assign({}, options, { loose: false });
                          _context2.next = 6;
                          return getChapterFromAllContentSources(includeSource, opts);

                        case 6:
                          return _context2.abrupt("return", submitResult());

                        case 7:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _marked[0], this);
                };

                submitResult = function submitResult() {
                  if (result.length <= 0) {
                    var re = utils.findMostError(errorCodeList);
                    return Promise.reject(re ? re : 201);
                  } else {
                    if (count > 1) return Promise.resolve(result);else {
                      return Promise.resolve(result[0]);
                    }
                  }
                };

                addChapterToResult = function addChapterToResult(chapterB, indexB, source) {
                  if (!noInfluenceWeight) self.sources[source].weight += FOUND_WEIGHT;

                  var chapter = new Chapter();
                  Object.assign(chapter, chapterA);
                  chapter.content = chapterB.content;

                  result.push({
                    chapter: chapter,
                    index: index,
                    options: {
                      contentSourceId: source,
                      contentSourceChapterIndex: indexB
                    }
                  });
                };

                _marked = [getChapterFromContentSources2, getChapterFromAllContentSources, getChapterFromSelectBookSourceAndSelectSourceChapterIndex].map(regeneratorRuntime.mark);
                _options$bookSourceId = options.bookSourceId, bookSourceId = _options$bookSourceId === undefined ? this.mainSourceId : _options$bookSourceId, _options$count = options.count, count = _options$count === undefined ? 1 : _options$count, excludes = options.excludes, contentSourceId = options.contentSourceId, contentSourceChapterIndex = options.contentSourceChapterIndex, onlyCacheNoLoad = options.onlyCacheNoLoad, _options$noInfluenceW = options.noInfluenceWeight, noInfluenceWeight = _options$noInfluenceW === undefined ? false : _options$noInfluenceW, _options$searchedSour = options.searchedSource, searchedSource = _options$searchedSour === undefined ? [] : _options$searchedSour;
                result = [];
                errorCodeList = [];
                remainCount = count;
                FOUND_WEIGHT = 0;
                NOTFOUND_WEIGHT = -2;
                EXECLUDE_WEIGHT = -4;
                INCLUDE_WEIGHT = 0;
                self = this;

                if (excludes && excludes.includes(contentSourceId)) contentSourceId = null;

                if (!(contentSourceId && typeof contentSourceChapterIndex == 'number' && !searchedSource.includes(contentSourceId))) {
                  _context5.next = 20;
                  break;
                }

                return _context5.abrupt("return", co(getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex)).catch(function (error) {
                  return co(getChapterFromContentSources2(contentSourceId));
                }));

              case 20:
                return _context5.abrupt("return", co(getChapterFromContentSources2(contentSourceId)));

              case 21:
              case "end":
                return _context5.stop();
            }
          }
        }, __getChapterFromContentSources, this);
      })
    }, {
      key: "getChapterIndex",
      value: function getChapterIndex(title, index) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        return this.getCatalog(options).then(function (catalog) {
          if (index != undefined) {
            var tc = catalog[index];
            if (Chapter.equalTitle(tc, title, true)) return index;

            var ir = catalog.slice(index + 1).findIndex(function (c) {
              return !!Chapter.equalTitle(c, title);
            });
            var il = catalog.slice(0, index).reverse().findIndex(function (c) {
              return !!Chapter.equalTitle(c, title);
            });

            if (ir >= 0 && (il < 0 || ir < il)) return index + ir + 1;else if (il >= 0 && (ir < 0 || il < ir)) return index - il - 1;else return -1;
          }
          return catalog.findIndex(function (c) {
            return !!Chapter.equalTitle(c, title);
          });
        });
      }
    }, {
      key: "nextChapter",
      value: function nextChapter(chapterIndex, options) {
        var direction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;


        options = Object.assign({}, options);
        chapterIndex += direction >= 0 ? 1 : -1;
        if (options.contentSourceChapterIndex != undefined) options.contentSourceChapterIndex += direction >= 0 ? 1 : -1;

        return this.getChapter(chapterIndex, options).then(function (result) {
          if (options.forceRefresh) options.forceRefresh = false;
          Object.assign(result.options, options, result.options);
          return result;
        }).catch(function (error) {
          if (error == 203 || error == 202) {
            return Promise.resolve({ chapter: null, index: -1, options: null });
          }
          throw error;
        });
      }
    }, {
      key: "cacheChapter",
      value: function cacheChapter(chapterIndex, nextCount, options) {

        options = Object.assign({}, options);
        options.noInfluenceWeight = true;
        options.onlyCacheNoLoad = true;

        var self = this;
        return co(regeneratorRuntime.mark(function _callee2() {
          var _ref3, index, opts, i, _ref4;

          return regeneratorRuntime.wrap(function _callee2$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return self.getChapter(chapterIndex, options);

                case 2:
                  _ref3 = _context6.sent;
                  index = _ref3.index;
                  opts = _ref3.options;
                  i = 0;

                case 6:
                  if (!(i < nextCount)) {
                    _context6.next = 15;
                    break;
                  }

                  _context6.next = 9;
                  return self.nextChapter(index, opts);

                case 9:
                  _ref4 = _context6.sent;
                  index = _ref4.index;
                  opts = _ref4.options;

                case 12:
                  i++;
                  _context6.next = 6;
                  break;

                case 15:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee2, this);
        }));
      }
    }, {
      key: "clearCacheChapters",
      value: function clearCacheChapters() {
        utils.removeData("chapter/" + this.name + "_" + this.author + "/", true);
      }
    }, {
      key: "getLastestChapter",
      value: function getLastestChapter(bookSourceId) {
        return this.getBookSource(bookSourceId).then(function (bs) {
          return bs.refreshLastestChapter();
        });
      }
    }]);

    return Book;
  }();

  Book.persistentInclude = ["name", "author", "catagory", "cover", "complete", "introduce", "sources", "mainSourceId"];

  Book.Cast = function (obj, bookSourceManager) {
    var nb = new Book(bookSourceManager);
    Object.assign(nb, obj);

    for (var bsid in nb.sources) {
      var nbs = new BookSource(nb, nb.bookSourceManager, bsid);
      Object.assign(nbs, nb.sources[bsid]);
      nb.sources[bsid] = nbs;
    }
    return nb;
  };

  Book.equal = function (bookA, bookB) {
    return bookA.name == bookB.name && bookA.author == bookB.author;
  };

  return Book;
});
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["Book"] = factory();
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
        return this.bookSourceManager.getSourcesKeysByMainSourceWeight(this.mainSourceId);
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
          var volumeName = void 0;
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
      value: function index(chapterIndex, refresh) {
        var bookSourceId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.mainSourceId;

        if (typeof chapterIndex != "number") {
          return Promise.reject(205);
        }

        if (chapterIndex < 0) {
          return Promise.reject(203);
        }

        return this.getCatalog({ refresh: refresh, bookSourceId: bookSourceId }).then(function (catalog) {
          if (chapterIndex >= 0 && chapterIndex < catalog.length) return catalog[chapterIndex];else if (chapterIndex >= catalog.length) return Promise.reject(202);else return Promise.reject(203);
        });
      }
    }, {
      key: "fuzzySearch",
      value: function fuzzySearch(sourceB, index, refresh) {
        var bookSourceId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.mainSourceId;


        if (bookSourceId == sourceB) {
          return this.index(index, refresh, sourceB).then(function (chapter) {
            return { "chapter": chapter, "index": index };
          });
        }

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          var catalog, catalogB, matchs, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, match, _match, matchFunc, compareFunc, indexB, chapterB;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return self.getCatalog({ refresh: refresh, bookSourceId: bookSourceId });

                case 2:
                  catalog = _context.sent;
                  _context.next = 5;
                  return self.getCatalog({ refresh: refresh, bookSourceId: sourceB });

                case 5:
                  catalogB = _context.sent;
                  matchs = [[utils.listMatch.bind(utils), Chapter.equalTitle.bind(Chapter)], [utils.listMatchWithNeighbour.bind(utils), Chapter.equalTitle.bind(Chapter)]];
                  _iteratorNormalCompletion2 = true;
                  _didIteratorError2 = false;
                  _iteratorError2 = undefined;
                  _context.prev = 10;
                  _iterator2 = matchs[Symbol.iterator]();

                case 12:
                  if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                    _context.next = 25;
                    break;
                  }

                  match = _step2.value;
                  _match = _slicedToArray(match, 2), matchFunc = _match[0], compareFunc = _match[1];
                  indexB = matchFunc(catalog, catalogB, index, compareFunc);

                  if (!(indexB >= 0)) {
                    _context.next = 21;
                    break;
                  }

                  chapterB = catalogB[indexB];
                  return _context.abrupt("return", Promise.resolve({ chapter: chapterB, index: indexB }));

                case 21:
                  return _context.abrupt("continue", 22);

                case 22:
                  _iteratorNormalCompletion2 = true;
                  _context.next = 12;
                  break;

                case 25:
                  _context.next = 31;
                  break;

                case 27:
                  _context.prev = 27;
                  _context.t0 = _context["catch"](10);
                  _didIteratorError2 = true;
                  _iteratorError2 = _context.t0;

                case 31:
                  _context.prev = 31;
                  _context.prev = 32;

                  if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                  }

                case 34:
                  _context.prev = 34;

                  if (!_didIteratorError2) {
                    _context.next = 37;
                    break;
                  }

                  throw _iteratorError2;

                case 37:
                  return _context.finish(34);

                case 38:
                  return _context.finish(31);

                case 39:
                  return _context.abrupt("return", Promise.reject(201));

                case 40:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[10, 27, 31, 39], [32,, 34, 38]]);
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

        return this.index(chapterIndex, options.refresh, options.bookSourceId).catch(function (error) {
          if (error != 202 || options.refresh) return Promise.reject(error);
          options.refresh = true;

          return _this5.index(chapterIndex, options.refresh, options.bookSourceId);
        }).then(function (chapter) {
          return co(_this5.__getChapterFromContentSources(chapterIndex, options));
        });
      }
    }, {
      key: "__getChapterFromContentSources",
      value: regeneratorRuntime.mark(function __getChapterFromContentSources(index, _ref3) {
        var _ref3$bookSourceId = _ref3.bookSourceId,
            bookSourceId = _ref3$bookSourceId === undefined ? this.mainSourceId : _ref3$bookSourceId,
            _ref3$count = _ref3.count,
            count = _ref3$count === undefined ? 1 : _ref3$count,
            excludes = _ref3.excludes,
            contentSourceId = _ref3.contentSourceId,
            contentSourceChapterIndex = _ref3.contentSourceChapterIndex,
            onlyCacheNoLoad = _ref3.onlyCacheNoLoad,
            _ref3$noInfluenceWeig = _ref3.noInfluenceWeight,
            noInfluenceWeight = _ref3$noInfluenceWeig === undefined ? false : _ref3$noInfluenceWeig,
            refresh = _ref3.refresh;

        var _marked, catalog, chapterA, result, errorCodeList, remainCount, FOUND_WEIGHT, NOTFOUND_WEIGHT, EXECLUDE_WEIGHT, INCLUDE_WEIGHT, self, addChapterToResult, submitResult, getChapterFromContentSources2, handleWithNormalMethod, getChapterFromSelectBookSourceAndSelectSourceChapterIndex;

        return regeneratorRuntime.wrap(function __getChapterFromContentSources$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                getChapterFromSelectBookSourceAndSelectSourceChapterIndex = function getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex) {
                  var chapterB, bs;
                  return regeneratorRuntime.wrap(function getChapterFromSelectBookSourceAndSelectSourceChapterIndex$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:

                          if (!noInfluenceWeight) self.sources[contentSourceId].weight += INCLUDE_WEIGHT;

                          chapterB = void 0;
                          _context3.prev = 2;
                          _context3.next = 5;
                          return self.index(contentSourceChapterIndex, refresh, contentSourceId);

                        case 5:
                          chapterB = _context3.sent;
                          _context3.next = 15;
                          break;

                        case 8:
                          _context3.prev = 8;
                          _context3.t0 = _context3["catch"](2);

                          if (!(_context3.t0 != 202 || refresh)) {
                            _context3.next = 12;
                            break;
                          }

                          throw _context3.t0;

                        case 12:
                          _context3.next = 14;
                          return self.index(contentSourceChapterIndex, true, contentSourceId);

                        case 14:
                          chapterB = _context3.sent;

                        case 15:
                          if (Chapter.equalTitle(chapterA, chapterB)) {
                            _context3.next = 17;
                            break;
                          }

                          throw new Error();

                        case 17:
                          _context3.next = 19;
                          return self.getBookSource(contentSourceId);

                        case 19:
                          bs = _context3.sent;
                          _context3.next = 22;
                          return bs.getChapter(chapterB, onlyCacheNoLoad);

                        case 22:
                          chapterB = _context3.sent;

                          addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                          remainCount--;

                          if (!(remainCount > 0)) {
                            _context3.next = 30;
                            break;
                          }

                          debugger;
                          return _context3.abrupt("return", handleWithNormalMethod());

                        case 30:
                          return _context3.abrupt("return", submitResult());

                        case 31:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _marked[1], this, [[2, 8]]);
                };

                handleWithNormalMethod = function handleWithNormalMethod(error) {
                  errorCodeList.push(error);
                  return co(getChapterFromContentSources2());
                };

                getChapterFromContentSources2 = function getChapterFromContentSources2(includeSource) {
                  var contentSources, i, sourceB, _result, _result2, chapterBB, indexB, bs, chapterB;

                  return regeneratorRuntime.wrap(function getChapterFromContentSources2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          contentSources = self.getSourcesKeysSortedByWeight().reverse();

                          if (excludes) {
                            excludes.forEach(function (exclude) {
                              var i = contentSources.indexOf(exclude);
                              contentSources.splice(i, 1);
                              if (!noInfluenceWeight) self.sources[exclude].weight += EXECLUDE_WEIGHT;
                            });
                          }
                          if (includeSource) {
                            i = contentSources.indexOf(includeSource);

                            contentSources.splice(i, 1);

                            contentSources.push(includeSource);
                            if (!noInfluenceWeight) self.sources[includeSource].weight += INCLUDE_WEIGHT;
                          }

                        case 3:
                          if (!(contentSources.length > 0 && remainCount > 0)) {
                            _context2.next = 39;
                            break;
                          }

                          sourceB = contentSources.pop();

                          if (sourceB) {
                            _context2.next = 7;
                            break;
                          }

                          return _context2.abrupt("continue", 3);

                        case 7:
                          _context2.prev = 7;
                          _result = void 0;
                          _context2.prev = 9;
                          _context2.next = 12;
                          return self.fuzzySearch(sourceB, index, refresh, bookSourceId);

                        case 12:
                          _result = _context2.sent;
                          _context2.next = 22;
                          break;

                        case 15:
                          _context2.prev = 15;
                          _context2.t0 = _context2["catch"](9);

                          if (!(_context2.t0 != 201 || refresh)) {
                            _context2.next = 19;
                            break;
                          }

                          throw _context2.t0;

                        case 19:
                          _context2.next = 21;
                          return self.fuzzySearch(sourceB, index, true, bookSourceId);

                        case 21:
                          _result = _context2.sent;

                        case 22:
                          _result2 = _result, chapterBB = _result2.chapter, indexB = _result2.index;
                          _context2.next = 25;
                          return self.getBookSource(sourceB);

                        case 25:
                          bs = _context2.sent;
                          _context2.next = 28;
                          return bs.getChapter(chapterBB, onlyCacheNoLoad);

                        case 28:
                          chapterB = _context2.sent;

                          addChapterToResult(chapterB, indexB, sourceB);
                          remainCount--;
                          _context2.next = 37;
                          break;

                        case 33:
                          _context2.prev = 33;
                          _context2.t1 = _context2["catch"](7);

                          errorCodeList.push(_context2.t1);
                          if (!noInfluenceWeight) self.sources[sourceB].weight += NOTFOUND_WEIGHT;

                        case 37:
                          _context2.next = 3;
                          break;

                        case 39:
                          return _context2.abrupt("return", submitResult());

                        case 40:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _marked[0], this, [[7, 33], [9, 15]]);
                };

                submitResult = function submitResult() {
                  if (result.length <= 0) {
                    var re = utils.arrayCount(errorCodeList);
                    if (re.length > 0) return Promise.reject(re[0][0]);
                    return Promise.reject(201);
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

                _marked = [getChapterFromContentSources2, getChapterFromSelectBookSourceAndSelectSourceChapterIndex].map(regeneratorRuntime.mark);
                _context4.next = 8;
                return this.getCatalog({ refresh: refresh, bookSourceId: bookSourceId });

              case 8:
                catalog = _context4.sent;
                chapterA = catalog[index];
                result = [];
                errorCodeList = [];
                remainCount = count;
                FOUND_WEIGHT = 0;
                NOTFOUND_WEIGHT = -2;
                EXECLUDE_WEIGHT = -4;
                INCLUDE_WEIGHT = 0;
                self = this;

                if (excludes && excludes.includes(contentSourceId)) contentSourceId = null;

                if (!(contentSourceId && typeof contentSourceChapterIndex == 'number')) {
                  _context4.next = 23;
                  break;
                }

                return _context4.abrupt("return", co(getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex)).catch(handleWithNormalMethod));

              case 23:
                return _context4.abrupt("return", co(getChapterFromContentSources2(contentSourceId)));

              case 24:
              case "end":
                return _context4.stop();
            }
          }
        }, __getChapterFromContentSources, this);
      })
    }, {
      key: "getChapterIndex",
      value: function getChapterIndex(title, index) {
        var _ref4 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            _ref4$bookSourceId = _ref4.bookSourceId,
            bookSourceId = _ref4$bookSourceId === undefined ? this.mainSourceId : _ref4$bookSourceId,
            _ref4$refresh = _ref4.refresh,
            refresh = _ref4$refresh === undefined ? false : _ref4$refresh;

        return this.getCatalog({ bookSourceId: bookSourceId, refresh: refresh }).then(function (catalog) {
          if (index != undefined) {
            var tc = catalog[index];
            if (Chapter.equalTitle(tc, title)) return index;

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
      key: "buildChapterIterator",
      value: function buildChapterIterator(chapterIndex, direction, options) {
        var map = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (e) {
          return e;
        };

        options = Object.assign({}, options);
        var self = this;
        var finished = false;
        return {
          next: function next() {
            if (finished) return Promise.resolve({ done: true });
            return self.getChapter(chapterIndex, options).then(function (result) {
              Object.assign(options, result.options);
              chapterIndex += direction >= 0 ? 1 : -1;
              options.contentSourceChapterIndex += direction >= 0 ? 1 : -1;
              return { value: map(result, direction), done: false };
            }).catch(function (error) {
              if (error == 203 || error == 202) {
                finished = true;
                return Promise.resolve({ value: map(undefined, direction), done: true });
              }
              throw error;
            });
          }
        };
      }
    }, {
      key: "cacheChapter",
      value: function cacheChapter(chapterIndex, nextCount, options) {

        options = Object.assign({}, options);
        options.noInfluenceWeight = true;
        options.onlyCacheNoLoad = true;

        var citer = this.buildChapterIterator(chapterIndex, 1, options);

        return co(regeneratorRuntime.mark(function _callee2() {
          var i;
          return regeneratorRuntime.wrap(function _callee2$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  i = 0;

                case 1:
                  if (!(i < nextCount)) {
                    _context5.next = 7;
                    break;
                  }

                  _context5.next = 4;
                  return citer.next();

                case 4:
                  i++;
                  _context5.next = 1;
                  break;

                case 7:
                case "end":
                  return _context5.stop();
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
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["co", "utils", "Chapter", "BookSource"], function (co, utils, Chapter, BookSource) {
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
      key: "getDetailLink",
      value: function getDetailLink() {
        var bookSourceId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.mainSourceId;

        try {
          return this.sources[bookSourceId].detailLink;
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
      value: function getCatalog(forceRefresh, bookSourceId) {

        return this.getBookSource(bookSourceId).then(function (bs) {
          return bs.getCatalog(forceRefresh);
        }).then(function (catalog) {
          if (!catalog || catalog.length <= 0) return Promise.reject(501);
          return catalog;
        });
      }
    }, {
      key: "refreshBookInfo",
      value: function refreshBookInfo(bookSourceId) {
        var _this3 = this;

        return this.getBookSource(bookSourceId).then(function (bs) {
          return bs.getBookInfo();
        }).then(function (book) {
          if (book.catagory) _this3.catagory = book.catagory;
          if (book.cover) _this3.cover = book.cover;
          if (book.complete) _this3.complete = book.complete;
          if (book.introduce) _this3.introduce = book.introduce;
        });
      }
    }, {
      key: "index",
      value: function index(chapterIndex, forceRefresh, bookSourceId) {
        if (typeof chapterIndex != "number") {
          return Promise.reject(205);
        }

        if (chapterIndex < 0) {
          return Promise.reject(203);
        }

        return this.getCatalog(forceRefresh, bookSourceId).then(function (catalog) {
          if (chapterIndex >= 0 && chapterIndex < catalog.length) return catalog[chapterIndex];else if (chapterIndex >= catalog.length) return Promise.reject(202);else return Promise.reject(203);
        });
      }
    }, {
      key: "fuzzySearch",
      value: function fuzzySearch(sourceB, index, forceRefresh) {
        var bookSourceId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.mainSourceId;


        if (bookSourceId == sourceB) {
          return this.index(index, forceRefresh, sourceB).then(function (chapter) {
            return { "chapter": chapter, "index": index };
          });
        }

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          var catalog, catalogB, matchs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, match, _match, matchFunc, compareFunc, indexB, chapterB;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return self.getCatalog(forceRefresh, bookSourceId);

                case 2:
                  catalog = _context.sent;
                  _context.next = 5;
                  return self.getCatalog(forceRefresh, sourceB);

                case 5:
                  catalogB = _context.sent;
                  matchs = [[utils.listMatch.bind(utils), Chapter.equalTitle.bind(Chapter)], [utils.listMatchWithNeighbour.bind(utils), Chapter.equalTitle.bind(Chapter)]];
                  _iteratorNormalCompletion = true;
                  _didIteratorError = false;
                  _iteratorError = undefined;
                  _context.prev = 10;
                  _iterator = matchs[Symbol.iterator]();

                case 12:
                  if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                    _context.next = 25;
                    break;
                  }

                  match = _step.value;
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
                  _iteratorNormalCompletion = true;
                  _context.next = 12;
                  break;

                case 25:
                  _context.next = 31;
                  break;

                case 27:
                  _context.prev = 27;
                  _context.t0 = _context["catch"](10);
                  _didIteratorError = true;
                  _iteratorError = _context.t0;

                case 31:
                  _context.prev = 31;
                  _context.prev = 32;

                  if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                  }

                case 34:
                  _context.prev = 34;

                  if (!_didIteratorError) {
                    _context.next = 37;
                    break;
                  }

                  throw _iteratorError;

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
        var _this4 = this;

        if (chapterIndex < 0) {
          return Promise.reject(203);;
        }

        options = Object.assign({}, options);
        options.bookSourceId = options.bookSourceId || this.mainSourceId;

        return this.index(chapterIndex, options.forceRefresh, options.bookSourceId).catch(function (error) {
          if (error != 202 || options.forceRefresh) return Promise.reject(error);
          options.forceRefresh = true;

          return _this4.index(chapterIndex, options.forceRefresh, options.bookSourceId);
        }).then(function (chapter) {
          return co(_this4.__getChapterFromContentSources(chapterIndex, options));
        });
      }
    }, {
      key: "__getChapterFromContentSources",
      value: regeneratorRuntime.mark(function __getChapterFromContentSources(index, _ref) {
        var _ref$bookSourceId = _ref.bookSourceId,
            bookSourceId = _ref$bookSourceId === undefined ? this.mainSourceId : _ref$bookSourceId,
            _ref$count = _ref.count,
            count = _ref$count === undefined ? 1 : _ref$count,
            excludes = _ref.excludes,
            contentSourceId = _ref.contentSourceId,
            contentSourceChapterIndex = _ref.contentSourceChapterIndex,
            onlyCacheNoLoad = _ref.onlyCacheNoLoad,
            _ref$noInfluenceWeigh = _ref.noInfluenceWeight,
            noInfluenceWeight = _ref$noInfluenceWeigh === undefined ? false : _ref$noInfluenceWeigh,
            forceRefresh = _ref.forceRefresh;

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
                          return self.index(contentSourceChapterIndex, forceRefresh, contentSourceId);

                        case 5:
                          chapterB = _context3.sent;
                          _context3.next = 15;
                          break;

                        case 8:
                          _context3.prev = 8;
                          _context3.t0 = _context3["catch"](2);

                          if (!(_context3.t0 != 202 || forceRefresh)) {
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
                  var contentSources, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, exclude, i, _i, sourceB, _result, _result2, chapterBB, indexB, bs, chapterB;

                  return regeneratorRuntime.wrap(function getChapterFromContentSources2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          contentSources = self.getSourcesKeysSortedByWeight().reverse();

                          if (!excludes) {
                            _context2.next = 21;
                            break;
                          }

                          _iteratorNormalCompletion2 = true;
                          _didIteratorError2 = false;
                          _iteratorError2 = undefined;
                          _context2.prev = 5;

                          for (_iterator2 = excludes[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            exclude = _step2.value;
                            i = contentSources.indexOf(exclude);

                            contentSources.splice(i, 1);
                            if (!noInfluenceWeight) self.sources[exclude].weight += EXECLUDE_WEIGHT;
                          }
                          _context2.next = 13;
                          break;

                        case 9:
                          _context2.prev = 9;
                          _context2.t0 = _context2["catch"](5);
                          _didIteratorError2 = true;
                          _iteratorError2 = _context2.t0;

                        case 13:
                          _context2.prev = 13;
                          _context2.prev = 14;

                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                          }

                        case 16:
                          _context2.prev = 16;

                          if (!_didIteratorError2) {
                            _context2.next = 19;
                            break;
                          }

                          throw _iteratorError2;

                        case 19:
                          return _context2.finish(16);

                        case 20:
                          return _context2.finish(13);

                        case 21:
                          if (includeSource) {
                            _i = contentSources.indexOf(includeSource);

                            contentSources.splice(_i, 1);

                            contentSources.push(includeSource);
                            if (!noInfluenceWeight) self.sources[includeSource].weight += INCLUDE_WEIGHT;
                          }

                        case 22:
                          if (!(contentSources.length > 0 && remainCount > 0)) {
                            _context2.next = 58;
                            break;
                          }

                          sourceB = contentSources.pop();

                          if (sourceB) {
                            _context2.next = 26;
                            break;
                          }

                          return _context2.abrupt("continue", 22);

                        case 26:
                          _context2.prev = 26;
                          _result = void 0;
                          _context2.prev = 28;
                          _context2.next = 31;
                          return self.fuzzySearch(sourceB, index, forceRefresh, bookSourceId);

                        case 31:
                          _result = _context2.sent;
                          _context2.next = 41;
                          break;

                        case 34:
                          _context2.prev = 34;
                          _context2.t1 = _context2["catch"](28);

                          if (!(_context2.t1 != 201 || forceRefresh)) {
                            _context2.next = 38;
                            break;
                          }

                          throw _context2.t1;

                        case 38:
                          _context2.next = 40;
                          return self.fuzzySearch(sourceB, index, true, bookSourceId);

                        case 40:
                          _result = _context2.sent;

                        case 41:
                          _result2 = _result, chapterBB = _result2.chapter, indexB = _result2.index;
                          _context2.next = 44;
                          return self.getBookSource(sourceB);

                        case 44:
                          bs = _context2.sent;
                          _context2.next = 47;
                          return bs.getChapter(chapterBB, onlyCacheNoLoad);

                        case 47:
                          chapterB = _context2.sent;

                          addChapterToResult(chapterB, indexB, sourceB);
                          remainCount--;
                          _context2.next = 56;
                          break;

                        case 52:
                          _context2.prev = 52;
                          _context2.t2 = _context2["catch"](26);

                          errorCodeList.push(_context2.t2);
                          if (!noInfluenceWeight) self.sources[sourceB].weight += NOTFOUND_WEIGHT;

                        case 56:
                          _context2.next = 22;
                          break;

                        case 58:
                          return _context2.abrupt("return", submitResult());

                        case 59:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _marked[0], this, [[5, 9, 13, 21], [14,, 16, 20], [26, 52], [28, 34]]);
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

                  result.push({
                    chapter: chapterB,
                    title: chapterA.title,
                    index: index,
                    options: {
                      contentSourceId: source,
                      contentSourceChapterIndex: indexB
                    }
                  });
                };

                _marked = [getChapterFromContentSources2, getChapterFromSelectBookSourceAndSelectSourceChapterIndex].map(regeneratorRuntime.mark);
                _context4.next = 8;
                return this.getCatalog(forceRefresh, bookSourceId);

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
              return { value: map(result), done: false };
            }).catch(function (error) {
              if (error == 203 || error == 202) {
                finished = true;
                return Promise.resolve({ value: map(undefined), done: true });
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

  Book.createBook = function (obj, bookSourceManager) {
    if (!obj) return undefined;

    var book = new Book(bookSourceManager);
    book.name = obj.name;
    book.author = obj.author;

    book.catagory = obj.catagory;
    book.cover = obj.cover;
    book.complete = obj.complete;
    book.introduce = obj.introduce;

    return book;
  };

  Book.equal = function (bookA, bookB) {
    return bookA.name == bookB.name && bookA.author == bookB.author;
  };

  return Book;
});
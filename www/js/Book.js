"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["co", "util", "Chapter", "BookSource"], function (co, util, Chapter, BookSource) {
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
      key: "getSourcesKeysByMainSourceWeight",
      value: function getSourcesKeysByMainSourceWeight() {
        return this.bookSourceManager.getSourcesKeysByMainSourceWeight();
      }
    }, {
      key: "getSourcesKeysSortedByWeight",
      value: function getSourcesKeysSortedByWeight(configFileOrConfig) {
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
        });
      }
    }, {
      key: "refreshBookInfo",
      value: function refreshBookInfo(bookSourceId) {
        var _this3 = this;

        return this.getBookSource(bookSourceId).then(function (bs) {
          return bs.getBookInfo();
        }).then(function (book) {
          _this3.catagory = book.catagory;
          _this3.cover = book.cover;
          _this3.complete = book.complete;
          _this3.introduce = book.introduce;
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

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          var i, catalog;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  i = 0;

                case 1:
                  if (!(i < 2)) {
                    _context.next = 19;
                    break;
                  }

                  _context.next = 4;
                  return self.getCatalog(forceRefresh, bookSourceId);

                case 4:
                  catalog = _context.sent;

                  if (!(!catalog || catalog.length <= 0)) {
                    _context.next = 7;
                    break;
                  }

                  return _context.abrupt("return", Promise.reject(501));

                case 7:
                  if (!(chapterIndex >= 0 && chapterIndex < catalog.length)) {
                    _context.next = 11;
                    break;
                  }

                  return _context.abrupt("return", Promise.resolve({ chapter: catalog[chapterIndex], index: chapterIndex, catalog: catalog }));

                case 11:
                  if (!(chapterIndex >= catalog.length)) {
                    _context.next = 15;
                    break;
                  }

                  forceRefresh = true;
                  _context.next = 16;
                  break;

                case 15:
                  return _context.abrupt("return", Promise.reject(203));

                case 16:
                  i++;
                  _context.next = 1;
                  break;

                case 19:
                  return _context.abrupt("return", Promise.reject(202));

                case 20:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
      }
    }, {
      key: "fuzzySearch",
      value: function fuzzySearch(sourceB, index, forceRefresh) {
        var bookSourceId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.mainSourceId;


        if (bookSourceId == sourceB) {
          return this.index(index, forceRefresh, sourceB);
        }

        var self = this;
        return co(regeneratorRuntime.mark(function _callee2() {
          var catalog, i, catalogB, matchs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, match, _match, matchFunc, compareFunc, indexB, chapterB;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return self.getCatalog(forceRefresh, bookSourceId);

                case 2:
                  catalog = _context2.sent;

                  if (!(!catalog || catalog.length <= 0)) {
                    _context2.next = 5;
                    break;
                  }

                  return _context2.abrupt("return", Promise.reject(501));

                case 5:
                  i = 0;

                case 6:
                  if (!(i < 2)) {
                    _context2.next = 49;
                    break;
                  }

                  _context2.next = 9;
                  return self.getCatalog(forceRefresh, sourceB);

                case 9:
                  catalogB = _context2.sent;

                  if (!(!catalogB || catalogB.length <= 0)) {
                    _context2.next = 12;
                    break;
                  }

                  return _context2.abrupt("return", Promise.reject(501));

                case 12:
                  matchs = [[util.listMatch.bind(util), Chapter.equalTitle.bind(Chapter)], [util.listMatchWithNeighbour.bind(util), Chapter.equalTitle.bind(Chapter)], [util.listMatchWithNeighbour.bind(util), Chapter.equalTitleWithoutNum.bind(Chapter)]];
                  _iteratorNormalCompletion = true;
                  _didIteratorError = false;
                  _iteratorError = undefined;
                  _context2.prev = 16;
                  _iterator = matchs[Symbol.iterator]();

                case 18:
                  if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                    _context2.next = 31;
                    break;
                  }

                  match = _step.value;
                  _match = _slicedToArray(match, 2), matchFunc = _match[0], compareFunc = _match[1];
                  indexB = matchFunc(catalog, catalogB, index, compareFunc);

                  if (!(indexB >= 0)) {
                    _context2.next = 27;
                    break;
                  }

                  chapterB = catalogB[indexB];
                  return _context2.abrupt("return", Promise.resolve({ chapter: chapterB, index: indexB, catalog: catalogB }));

                case 27:
                  return _context2.abrupt("continue", 28);

                case 28:
                  _iteratorNormalCompletion = true;
                  _context2.next = 18;
                  break;

                case 31:
                  _context2.next = 37;
                  break;

                case 33:
                  _context2.prev = 33;
                  _context2.t0 = _context2["catch"](16);
                  _didIteratorError = true;
                  _iteratorError = _context2.t0;

                case 37:
                  _context2.prev = 37;
                  _context2.prev = 38;

                  if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                  }

                case 40:
                  _context2.prev = 40;

                  if (!_didIteratorError) {
                    _context2.next = 43;
                    break;
                  }

                  throw _iteratorError;

                case 43:
                  return _context2.finish(40);

                case 44:
                  return _context2.finish(37);

                case 45:
                  forceRefresh = true;

                case 46:
                  i++;
                  _context2.next = 6;
                  break;

                case 49:
                  return _context2.abrupt("return", Promise.reject(201));

                case 50:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this, [[16, 33, 37, 45], [38,, 40, 44]]);
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

        return this.index(chapterIndex, options.forceRefresh, options.bookSourceId).then(function (_ref) {
          var chapter = _ref.chapter,
              index = _ref.index,
              catalog = _ref.catalog;
          return co(_this4.__getChapterFromContentSources(catalog, chapterIndex, options));
        });
      }
    }, {
      key: "__getChapterFromContentSources",
      value: regeneratorRuntime.mark(function __getChapterFromContentSources(catalog, index, _ref2) {
        var _ref2$bookSourceId = _ref2.bookSourceId,
            bookSourceId = _ref2$bookSourceId === undefined ? this.mainSourceId : _ref2$bookSourceId,
            _ref2$count = _ref2.count,
            count = _ref2$count === undefined ? 1 : _ref2$count,
            excludes = _ref2.excludes,
            contentSourceId = _ref2.contentSourceId,
            contentSourceChapterIndex = _ref2.contentSourceChapterIndex,
            onlyCacheNoLoad = _ref2.onlyCacheNoLoad,
            _ref2$noInfluenceWeig = _ref2.noInfluenceWeight,
            noInfluenceWeight = _ref2$noInfluenceWeig === undefined ? false : _ref2$noInfluenceWeig,
            forceRefresh = _ref2.forceRefresh;

        var _marked, chapterA, result, errorCodeList, remainCount, FOUND_WEIGHT, NOTFOUND_WEIGHT, EXECLUDE_WEIGHT, INCLUDE_WEIGHT, self, addChapterToResult, submitResult, getChapterFromContentSources2, handleWithNormalMethod, getChapterFromSelectBookSourceAndSelectSourceChapterIndex;

        return regeneratorRuntime.wrap(function __getChapterFromContentSources$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                getChapterFromSelectBookSourceAndSelectSourceChapterIndex = function getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex) {
                  var _ref4, chapterB, indexB, catalogB, bs;

                  return regeneratorRuntime.wrap(function getChapterFromSelectBookSourceAndSelectSourceChapterIndex$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:

                          if (!noInfluenceWeight) self.sources[contentSourceId].weight += INCLUDE_WEIGHT;

                          _context4.next = 3;
                          return self.index(contentSourceChapterIndex, forceRefresh, contentSourceId);

                        case 3:
                          _ref4 = _context4.sent;
                          chapterB = _ref4.chapter;
                          indexB = _ref4.index;
                          catalogB = _ref4.catalog;

                          if (Chapter.equalTitle(chapterA, chapterB)) {
                            _context4.next = 9;
                            break;
                          }

                          throw new Error();

                        case 9:
                          _context4.next = 11;
                          return self.getBookSource(contentSourceId);

                        case 11:
                          bs = _context4.sent;
                          _context4.next = 14;
                          return bs.getChapter(chapterB, onlyCacheNoLoad);

                        case 14:
                          chapterB = _context4.sent;

                          addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                          remainCount--;

                          if (!(remainCount > 0)) {
                            _context4.next = 22;
                            break;
                          }

                          debugger;
                          return _context4.abrupt("return", handleWithNormalMethod());

                        case 22:
                          return _context4.abrupt("return", submitResult());

                        case 23:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _marked[1], this);
                };

                handleWithNormalMethod = function handleWithNormalMethod(error) {
                  errorCodeList.push(error);
                  return co(getChapterFromContentSources2());
                };

                getChapterFromContentSources2 = function getChapterFromContentSources2(includeSource) {
                  var contentSources, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, exclude, i, _i, sourceB, _ref3, chapterBB, indexB, catalogB, bs, chapterB;

                  return regeneratorRuntime.wrap(function getChapterFromContentSources2$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          contentSources = self.getSourcesKeysSortedByWeight().reverse();

                          if (!excludes) {
                            _context3.next = 21;
                            break;
                          }

                          _iteratorNormalCompletion2 = true;
                          _didIteratorError2 = false;
                          _iteratorError2 = undefined;
                          _context3.prev = 5;

                          for (_iterator2 = excludes[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            exclude = _step2.value;
                            i = contentSources.indexOf(exclude);

                            contentSources.splice(i, 1);
                            if (!noInfluenceWeight) self.sources[exclude].weight += EXECLUDE_WEIGHT;
                          }
                          _context3.next = 13;
                          break;

                        case 9:
                          _context3.prev = 9;
                          _context3.t0 = _context3["catch"](5);
                          _didIteratorError2 = true;
                          _iteratorError2 = _context3.t0;

                        case 13:
                          _context3.prev = 13;
                          _context3.prev = 14;

                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                          }

                        case 16:
                          _context3.prev = 16;

                          if (!_didIteratorError2) {
                            _context3.next = 19;
                            break;
                          }

                          throw _iteratorError2;

                        case 19:
                          return _context3.finish(16);

                        case 20:
                          return _context3.finish(13);

                        case 21:
                          if (includeSource) {
                            _i = contentSources.indexOf(includeSource);

                            contentSources.splice(_i, 1);

                            contentSources.push(includeSource);
                            if (!noInfluenceWeight) self.sources[includeSource].weight += INCLUDE_WEIGHT;
                          }

                        case 22:
                          if (!(contentSources.length > 0 && remainCount > 0)) {
                            _context3.next = 49;
                            break;
                          }

                          sourceB = contentSources.pop();

                          if (sourceB) {
                            _context3.next = 26;
                            break;
                          }

                          return _context3.abrupt("continue", 22);

                        case 26:
                          _context3.prev = 26;
                          _context3.next = 29;
                          return self.fuzzySearch(sourceB, index, forceRefresh, bookSourceId);

                        case 29:
                          _ref3 = _context3.sent;
                          chapterBB = _ref3.chapter;
                          indexB = _ref3.index;
                          catalogB = _ref3.catalog;
                          _context3.next = 35;
                          return self.getBookSource(sourceB);

                        case 35:
                          bs = _context3.sent;
                          _context3.next = 38;
                          return bs.getChapter(chapterBB, onlyCacheNoLoad);

                        case 38:
                          chapterB = _context3.sent;

                          addChapterToResult(chapterB, indexB, sourceB);
                          remainCount--;
                          _context3.next = 47;
                          break;

                        case 43:
                          _context3.prev = 43;
                          _context3.t1 = _context3["catch"](26);

                          errorCodeList.push(_context3.t1);
                          if (!noInfluenceWeight) self.sources[sourceB].weight += NOTFOUND_WEIGHT;

                        case 47:
                          _context3.next = 22;
                          break;

                        case 49:
                          return _context3.abrupt("return", submitResult());

                        case 50:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _marked[0], this, [[5, 9, 13, 21], [14,, 16, 20], [26, 43]]);
                };

                submitResult = function submitResult() {
                  if (result.length <= 0) {
                    var re = util.arrayCount(errorCodeList);
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
                  _context5.next = 20;
                  break;
                }

                return _context5.abrupt("return", co(getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex)).catch(handleWithNormalMethod));

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
      key: "getChapters",
      value: regeneratorRuntime.mark(function getChapters(chapterIndex, nextCount, direction, options) {
        var i;
        return regeneratorRuntime.wrap(function getChapters$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(nextCount < 0)) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt("return");

              case 2:

                options = Object.assign({}, options);

                i = 0;

              case 4:
                if (!(i < nextCount)) {
                  _context6.next = 12;
                  break;
                }

                _context6.next = 7;
                return this.getChapter(chapterIndex, options);

              case 7:
                chapterIndex += direction >= 0 ? 1 : -1;
                options.contentSourceChapterIndex += direction >= 0 ? 1 : -1;

              case 9:
                i++;
                _context6.next = 4;
                break;

              case 12:
              case "end":
                return _context6.stop();
            }
          }
        }, getChapters, this);
      })
    }, {
      key: "cacheChapter",
      value: function cacheChapter(chapterIndex, nextCount, options) {

        options = Object.assign({}, options);
        options.noInfluenceWeight = true;
        options.onlyCacheNoLoad = true;

        return co(this.getChapters(chapterIndex, nextCount, 1, options));
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
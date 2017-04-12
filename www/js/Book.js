"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["co", "util", "Chapter", "BookSource"], function (co, util, Chapter, BookSource) {
    "use strict";

    var Book = function () {
        function Book() {
            _classCallCheck(this, Book);

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
            value: function getBookSource(_ref) {
                var _this = this;

                var bookSourceManager = _ref.bookSourceManager,
                    _ref$bookSourceId = _ref.bookSourceId,
                    bookSourceId = _ref$bookSourceId === undefined ? this.mainSourceId : _ref$bookSourceId;

                return new Promise(function (resolve, reject) {
                    var bs = _this.sources[bookSourceId];
                    if (bs) {
                        resolve(bs);
                    } else {
                        var bsm = bookSourceManager.sources[bookSourceId];
                        if (bsm) {
                            var bss = new BookSource(bookSourceId, bsm.contentSourceWeight);
                            _this.sources[bookSourceId] = bss;
                            resolve(bss);
                        } else {
                            reject(302);
                        }
                    }
                });
            }
        }, {
            key: "checkBookSources",
            value: function checkBookSources(bookSourceManager) {
                var sources = bookSourceManager.sources;
                for (var k in sources) {
                    if (!(k in this.sources)) {
                        this.sources[k] = new BookSource(k, sources[k].contentSourceWeight);
                    }
                }
            }
        }, {
            key: "setMainSourceId",
            value: function setMainSourceId(bookSourceId, _ref2) {
                var _this2 = this;

                var bookSourceManager = _ref2.bookSourceManager;


                return new Promise(function (resolve, reject) {
                    if (_this2.mainSourceId == bookSourceId) return;

                    if (bookSourceId && bookSourceId in bookSourceManager.sources) {
                        _this2.mainSourceId = bookSourceId;
                        resolve(_this2);
                    } else {
                        reject(301);
                    }
                });
            }
        }, {
            key: "getCatalog",
            value: function getCatalog(options) {
                var _this3 = this;

                options = Object.assign({}, options);
                options.bookSourceId = options.bookSourceId || this.mainSourceId;

                return this.getBookSource(options).then(function (bs) {
                    return bs.getCatalog(options.bookSourceManager, _this3, options.forceRefresh);
                });
            }
        }, {
            key: "refreshBookInfo",
            value: function refreshBookInfo(options) {
                var _this4 = this;

                options = Object.assign({}, options);
                options.bookSourceId = options.bookSourceId || this.mainSourceId;

                return this.getBookSource(options).then(function (bs) {
                    return bs.getBookInfo(options.bookSourceManager, _this4);
                }).then(function (book) {
                    _this4.catagory = book.catagory;
                    _this4.cover = book.cover;
                    _this4.complete = book.complete;
                    _this4.introduce = book.introduce;
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

                options = Object.assign({}, options);
                options.bookSourceId = options.bookSourceId || this.mainSourceId;

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
                                    return self.getCatalog(options);

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

                                    options.forceRefresh = true;
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
            value: function fuzzySearch(sourceB, index, options) {

                options = Object.assign({}, options);
                options.bookSourceId = options.bookSourceId || this.mainSourceId;

                if (options.bookSourceId == sourceB) {
                    return this.index(index, options);
                }

                var self = this;
                return co(regeneratorRuntime.mark(function _callee2() {
                    var catalog, i, catalogB, matchs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, match, _match, matchFunc, compareFunc, indexB, chapterB;

                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                        while (1) {
                            switch (_context2.prev = _context2.next) {
                                case 0:
                                    _context2.next = 2;
                                    return self.getCatalog(options);

                                case 2:
                                    catalog = _context2.sent;

                                    if (!(!catalog || catalog.length <= 0)) {
                                        _context2.next = 5;
                                        break;
                                    }

                                    return _context2.abrupt("return", Promise.reject(501));

                                case 5:
                                    options.bookSourceId = sourceB;
                                    i = 0;

                                case 7:
                                    if (!(i < 2)) {
                                        _context2.next = 50;
                                        break;
                                    }

                                    _context2.next = 10;
                                    return self.getCatalog(options);

                                case 10:
                                    catalogB = _context2.sent;

                                    if (!(!catalogB || catalogB.length <= 0)) {
                                        _context2.next = 13;
                                        break;
                                    }

                                    return _context2.abrupt("return", Promise.reject(501));

                                case 13:
                                    matchs = [[util.listMatch.bind(util), Chapter.equalTitle.bind(Chapter)], [util.listMatchWithNeighbour.bind(util), Chapter.equalTitle.bind(Chapter)], [util.listMatchWithNeighbour.bind(util), Chapter.equalTitleWithoutNum.bind(Chapter)]];
                                    _iteratorNormalCompletion = true;
                                    _didIteratorError = false;
                                    _iteratorError = undefined;
                                    _context2.prev = 17;
                                    _iterator = matchs[Symbol.iterator]();

                                case 19:
                                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                        _context2.next = 32;
                                        break;
                                    }

                                    match = _step.value;
                                    _match = _slicedToArray(match, 2), matchFunc = _match[0], compareFunc = _match[1];
                                    indexB = matchFunc(catalog, catalogB, index, compareFunc);

                                    if (!(indexB >= 0)) {
                                        _context2.next = 28;
                                        break;
                                    }

                                    chapterB = catalogB[indexB];
                                    return _context2.abrupt("return", Promise.resolve({ chapter: chapterB, index: indexB, catalog: catalogB }));

                                case 28:
                                    return _context2.abrupt("continue", 29);

                                case 29:
                                    _iteratorNormalCompletion = true;
                                    _context2.next = 19;
                                    break;

                                case 32:
                                    _context2.next = 38;
                                    break;

                                case 34:
                                    _context2.prev = 34;
                                    _context2.t0 = _context2["catch"](17);
                                    _didIteratorError = true;
                                    _iteratorError = _context2.t0;

                                case 38:
                                    _context2.prev = 38;
                                    _context2.prev = 39;

                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                        _iterator.return();
                                    }

                                case 41:
                                    _context2.prev = 41;

                                    if (!_didIteratorError) {
                                        _context2.next = 44;
                                        break;
                                    }

                                    throw _iteratorError;

                                case 44:
                                    return _context2.finish(41);

                                case 45:
                                    return _context2.finish(38);

                                case 46:
                                    options.forceRefresh = true;

                                case 47:
                                    i++;
                                    _context2.next = 7;
                                    break;

                                case 50:
                                    return _context2.abrupt("return", Promise.reject(201));

                                case 51:
                                case "end":
                                    return _context2.stop();
                            }
                        }
                    }, _callee2, this, [[17, 34, 38, 46], [39,, 41, 45]]);
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

                return this.index(chapterIndex, options).then(function (_ref3) {
                    var chapter = _ref3.chapter,
                        index = _ref3.index,
                        catalog = _ref3.catalog;
                    return co(_this5.__getChapterFromContentSources(catalog, chapterIndex, options));
                });
            }
        }, {
            key: "__getChapterFromContentSources",
            value: regeneratorRuntime.mark(function __getChapterFromContentSources(catalog, index, options) {
                var _marked, chapterA, result, count, FOUND_WEIGHT, NOTFOUND_WEIGHT, EXECLUDE_WEIGHT, INCLUDE_WEIGHT, self, addChapterToResult, submitResult, getChapterFromContentSources2, handleWithNormalMethod, getChapterFromSelectBookSourceAndSelectSourceChapterIndex;

                return regeneratorRuntime.wrap(function __getChapterFromContentSources$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                getChapterFromSelectBookSourceAndSelectSourceChapterIndex = function getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex) {
                                    var opts, _ref5, chapterB, indexB, catalogB, bs;

                                    return regeneratorRuntime.wrap(function getChapterFromSelectBookSourceAndSelectSourceChapterIndex$(_context4) {
                                        while (1) {
                                            switch (_context4.prev = _context4.next) {
                                                case 0:
                                                    opts = Object.assign({}, options);

                                                    opts.bookSourceId = contentSourceId;
                                                    if (!options.noInfluenceWeight) self.sources[contentSourceId].weight += INCLUDE_WEIGHT;

                                                    _context4.next = 5;
                                                    return self.index(contentSourceChapterIndex, opts);

                                                case 5:
                                                    _ref5 = _context4.sent;
                                                    chapterB = _ref5.chapter;
                                                    indexB = _ref5.index;
                                                    catalogB = _ref5.catalog;

                                                    if (Chapter.equalTitle(chapterA, chapterB)) {
                                                        _context4.next = 11;
                                                        break;
                                                    }

                                                    throw new Error();

                                                case 11:
                                                    _context4.next = 13;
                                                    return self.getBookSource(opts);

                                                case 13:
                                                    bs = _context4.sent;
                                                    _context4.next = 16;
                                                    return bs.getChapter(opts.bookSourceManager, self, chapterB, opts.onlyCacheNoLoad);

                                                case 16:
                                                    chapterB = _context4.sent;

                                                    addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                                                    count--;

                                                    if (!(count > 0)) {
                                                        _context4.next = 24;
                                                        break;
                                                    }

                                                    debugger;
                                                    return _context4.abrupt("return", handleWithNormalMethod());

                                                case 24:
                                                    return _context4.abrupt("return", submitResult());

                                                case 25:
                                                case "end":
                                                    return _context4.stop();
                                            }
                                        }
                                    }, _marked[1], this);
                                };

                                handleWithNormalMethod = function handleWithNormalMethod(error) {
                                    return co(getChapterFromContentSources2());
                                };

                                getChapterFromContentSources2 = function getChapterFromContentSources2(includeSource) {
                                    var opts, contentSources, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, exclude, i, _i, sourceB, _ref4, chapterBB, indexB, catalogB, bs, chapterB;

                                    return regeneratorRuntime.wrap(function getChapterFromContentSources2$(_context3) {
                                        while (1) {
                                            switch (_context3.prev = _context3.next) {
                                                case 0:
                                                    opts = Object.assign({}, options);
                                                    contentSources = util.objectSortedKey(self.sources, 'weight');

                                                    if (!options.excludes) {
                                                        _context3.next = 22;
                                                        break;
                                                    }

                                                    _iteratorNormalCompletion2 = true;
                                                    _didIteratorError2 = false;
                                                    _iteratorError2 = undefined;
                                                    _context3.prev = 6;

                                                    for (_iterator2 = options.excludes[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                                        exclude = _step2.value;
                                                        i = contentSources.indexOf(exclude);

                                                        delete contentSources[i];
                                                        if (!options.noInfluenceWeight) self.sources[exclude].weight += EXECLUDE_WEIGHT;
                                                    }
                                                    _context3.next = 14;
                                                    break;

                                                case 10:
                                                    _context3.prev = 10;
                                                    _context3.t0 = _context3["catch"](6);
                                                    _didIteratorError2 = true;
                                                    _iteratorError2 = _context3.t0;

                                                case 14:
                                                    _context3.prev = 14;
                                                    _context3.prev = 15;

                                                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                                        _iterator2.return();
                                                    }

                                                case 17:
                                                    _context3.prev = 17;

                                                    if (!_didIteratorError2) {
                                                        _context3.next = 20;
                                                        break;
                                                    }

                                                    throw _iteratorError2;

                                                case 20:
                                                    return _context3.finish(17);

                                                case 21:
                                                    return _context3.finish(14);

                                                case 22:
                                                    if (includeSource) {
                                                        _i = contentSources.indexOf(includeSource);

                                                        delete contentSources[_i];

                                                        contentSources.push(includeSource);
                                                        if (!options.noInfluenceWeight) self.sources[includeSource].weight += INCLUDE_WEIGHT;
                                                    }

                                                case 23:
                                                    if (!(contentSources.length > 0 && count > 0)) {
                                                        _context3.next = 50;
                                                        break;
                                                    }

                                                    opts.bookSourceId = contentSources.pop();

                                                    if (opts.bookSourceId) {
                                                        _context3.next = 27;
                                                        break;
                                                    }

                                                    return _context3.abrupt("continue", 23);

                                                case 27:
                                                    _context3.prev = 27;
                                                    sourceB = opts.bookSourceId;
                                                    _context3.next = 31;
                                                    return self.fuzzySearch(sourceB, index, options);

                                                case 31:
                                                    _ref4 = _context3.sent;
                                                    chapterBB = _ref4.chapter;
                                                    indexB = _ref4.index;
                                                    catalogB = _ref4.catalog;
                                                    _context3.next = 37;
                                                    return self.getBookSource(opts);

                                                case 37:
                                                    bs = _context3.sent;
                                                    _context3.next = 40;
                                                    return bs.getChapter(opts.bookSourceManager, self, chapterBB, opts.onlyCacheNoLoad);

                                                case 40:
                                                    chapterB = _context3.sent;

                                                    addChapterToResult(chapterB, indexB, sourceB);
                                                    count--;
                                                    _context3.next = 48;
                                                    break;

                                                case 45:
                                                    _context3.prev = 45;
                                                    _context3.t1 = _context3["catch"](27);

                                                    if (!options.noInfluenceWeight) self.sources[opts.bookSourceId].weight += NOTFOUND_WEIGHT;

                                                case 48:
                                                    _context3.next = 23;
                                                    break;

                                                case 50:
                                                    return _context3.abrupt("return", submitResult());

                                                case 51:
                                                case "end":
                                                    return _context3.stop();
                                            }
                                        }
                                    }, _marked[0], this, [[6, 10, 14, 22], [15,, 17, 21], [27, 45]]);
                                };

                                submitResult = function submitResult() {
                                    if (result.length <= 0) {
                                        return Promise.reject(201);
                                    } else {
                                        if (options.count && options.count > 1) return Promise.resolve(result);else {
                                            return Promise.resolve(result[0]);
                                        }
                                    }
                                };

                                addChapterToResult = function addChapterToResult(chapterB, indexB, source) {
                                    if (!options.noInfluenceWeight) self.sources[source].weight += FOUND_WEIGHT;

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

                                options = Object.assign({}, options);
                                options.bookSourceId = options.bookSourceId || this.mainSourceId;

                                chapterA = catalog[index];
                                result = [];
                                count = options.count || 1;
                                FOUND_WEIGHT = 0;
                                NOTFOUND_WEIGHT = -2;
                                EXECLUDE_WEIGHT = -4;
                                INCLUDE_WEIGHT = 0;
                                self = this;

                                if (options.excludes && options.excludes.indexOf(options.contentSourceId) >= 0) options.contentSourceId = null;

                                if (!(options.contentSourceId && typeof options.contentSourceChapterIndex == 'number')) {
                                    _context5.next = 21;
                                    break;
                                }

                                return _context5.abrupt("return", co(getChapterFromSelectBookSourceAndSelectSourceChapterIndex(options.contentSourceId, options.contentSourceChapterIndex)).catch(handleWithNormalMethod));

                            case 21:
                                return _context5.abrupt("return", co(getChapterFromContentSources2(options.contentSourceId)));

                            case 22:
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
                                options.bookSourceId = options.bookSourceId || this.mainSourceId;

                                i = 0;

                            case 5:
                                if (!(i < nextCount)) {
                                    _context6.next = 13;
                                    break;
                                }

                                _context6.next = 8;
                                return this.getChapter(chapterIndex, options);

                            case 8:
                                chapterIndex += direction >= 0 ? 1 : -1;
                                options.contentSourceChapterIndex += direction >= 0 ? 1 : -1;

                            case 10:
                                i++;
                                _context6.next = 5;
                                break;

                            case 13:
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
                options.bookSourceId = options.bookSourceId || this.mainSourceId;
                options.noInfluenceWeight = true;
                options.onlyCacheNoLoad = true;

                return co(this.getChapters(chapterIndex, nextCount, 1, options));
            }
        }, {
            key: "getLastestChapter",
            value: function getLastestChapter(options) {
                var _this6 = this;

                options = Object.assign({}, options);
                options.bookSourceId = options.bookSourceId || this.mainSourceId;
                var bss = null;
                return this.getBookSource(options).then(function (bs) {
                    bss = bs;
                    return bs.refreshLastestChapter(options.bookSourceManager, _this6);
                }).catch(function (error) {
                    if (error == 402) {
                        return [bss.lastestChapter, false];
                    } else {
                        return Promise.reject(error);
                    }
                });
            }
        }]);

        return Book;
    }();

    Book.Cast = function (obj) {
        var nb = new Book();
        Object.assign(nb, obj);

        for (var bsid in nb.sources) {
            var nbs = new BookSource(bsid);
            Object.assign(nbs, nb.sources[bsid]);
            nb.sources[bsid] = nbs;
        }
        return nb;
    };

    return Book;
});
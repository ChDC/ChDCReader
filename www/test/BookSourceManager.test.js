"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["util"], function (util) {
    var BookSourceManagerTest = function () {
        function BookSourceManagerTest(test) {
            _classCallCheck(this, BookSourceManagerTest);

            this.test = test;
        }

        _createClass(BookSourceManagerTest, [{
            key: "doTest",
            value: function doTest() {
                return this.checkBookSources("data/booksources.test.json", this.test.output, this.test.error);
            }
        }, {
            key: "checkBookSources",
            value: function checkBookSources(testFile, log, error) {

                if (!error) {
                    throw new Error("The argument 'error' is not defined!");
                }

                function check(bsid, testBook) {
                    var _marked = [checkBookInfo, checkLastestChapter, checkCatalog].map(regeneratorRuntime.mark);

                    function getInfo() {
                        return self.sources[bsid].name;
                    }

                    function checkBookInfo(bs, book) {
                        var ik, testProperty;
                        return regeneratorRuntime.wrap(function checkBookInfo$(_context) {
                            while (1) {
                                switch (_context.prev = _context.next) {
                                    case 0:
                                        _context.next = 2;
                                        return bs.getBookInfo(self, book).catch(function (e) {
                                            error(getInfo() + " -> 获取书籍信息失败：", e);
                                            throw e;
                                        });

                                    case 2:
                                        book = _context.sent;


                                        for (ik in testBook) {
                                            if (ik.match(/^test_/)) {
                                                testProperty = ik.substring(5);

                                                if (book[testProperty].match(testBook[ik])) {
                                                    log(getInfo() + " -> 测试属性：" + testProperty + " OK");
                                                } else {
                                                    error(getInfo() + " -> 测试属性：" + testProperty + " Wrong!");
                                                }
                                            }
                                        }

                                    case 4:
                                    case "end":
                                        return _context.stop();
                                }
                            }
                        }, _marked[0], this);
                    }

                    function checkLastestChapter(bs, book) {
                        var _ref, _ref2, lastestChapter, lastestChapterUpdated;

                        return regeneratorRuntime.wrap(function checkLastestChapter$(_context2) {
                            while (1) {
                                switch (_context2.prev = _context2.next) {
                                    case 0:
                                        _context2.next = 2;
                                        return bs.refreshLastestChapter(self, book).catch(function (e) {
                                            error(getInfo() + " -> 获取最新章节信息失败：", e);
                                            throw e;
                                        });

                                    case 2:
                                        _ref = _context2.sent;
                                        _ref2 = _slicedToArray(_ref, 2);
                                        lastestChapter = _ref2[0];
                                        lastestChapterUpdated = _ref2[1];

                                        if (lastestChapter.length > 0) {
                                            log(getInfo() + " -> 获取最新章节信息：OK");
                                        } else {
                                            error(getInfo() + " -> 获取最新章节信息：Wrong!");
                                        }

                                    case 7:
                                    case "end":
                                        return _context2.stop();
                                }
                            }
                        }, _marked[1], this);
                    }

                    function checkCatalog(bs, book) {
                        var catalog, chapter;
                        return regeneratorRuntime.wrap(function checkCatalog$(_context3) {
                            while (1) {
                                switch (_context3.prev = _context3.next) {
                                    case 0:
                                        _context3.next = 2;
                                        return bs.getCatalog(self, book, true).catch(function (e) {
                                            error(getInfo() + " -> 测试目录 Wrong!");
                                            throw e;
                                        });

                                    case 2:
                                        catalog = _context3.sent;

                                        if (!(catalog.length <= 0 || !catalog[0].title)) {
                                            _context3.next = 6;
                                            break;
                                        }

                                        error(getInfo() + " -> 测试目录 Wrong!");
                                        return _context3.abrupt("return");

                                    case 6:

                                        log(getInfo() + " -> 测试目录 OK");

                                        _context3.next = 9;
                                        return bs.getChapter(catalog[0], false).catch(function (e) {
                                            error(getInfo() + " -> 测试章节错误：", e);
                                            throw e;
                                        });

                                    case 9:
                                        chapter = _context3.sent;


                                        if (chapter.title == catalog[0].title && chapter.content.length > 0) {
                                            log(getInfo() + " -> 测试章节 OK");
                                        } else {
                                            error(getInfo() + " -> 测试章节 Wrong!");
                                        }

                                    case 11:
                                    case "end":
                                        return _context3.stop();
                                }
                            }
                        }, _marked[2], this);
                    }

                    return co(regeneratorRuntime.mark(function _callee() {
                        var book, bs;
                        return regeneratorRuntime.wrap(function _callee$(_context4) {
                            while (1) {
                                switch (_context4.prev = _context4.next) {
                                    case 0:
                                        log(getInfo() + " -> 测试书籍：" + testBook.name + " by " + testBook.author);
                                        _context4.next = 3;
                                        return self.getBook(bsid, testBook.name, testBook.author).catch(function (e) {
                                            error(getInfo() + " -> 获取书籍失败：", e);throw e;
                                        });

                                    case 3:
                                        book = _context4.sent;


                                        log(getInfo() + " -> 测试项目：获取书籍 OK");
                                        bs = book.sources[bsid];
                                        _context4.next = 8;
                                        return checkBookInfo(bs, book);

                                    case 8:
                                        _context4.next = 10;
                                        return checkLastestChapter(bs, book);

                                    case 10:
                                        _context4.next = 12;
                                        return checkCatalog(bs, book);

                                    case 12:
                                    case "end":
                                        return _context4.stop();
                                }
                            }
                        }, _callee, this);
                    }));
                }

                var self = app.bookSourceManager;
                return co(regeneratorRuntime.mark(function _callee2() {
                    var data, taskQueue, sk, books, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, book, _taskQueue$shift, _taskQueue$shift2, bsid, _book;

                    return regeneratorRuntime.wrap(function _callee2$(_context5) {
                        while (1) {
                            switch (_context5.prev = _context5.next) {
                                case 0:
                                    _context5.next = 2;
                                    return util.getJSON(testFile);

                                case 2:
                                    data = _context5.sent;
                                    taskQueue = [];
                                    _context5.t0 = regeneratorRuntime.keys(data.sources);

                                case 5:
                                    if ((_context5.t1 = _context5.t0()).done) {
                                        _context5.next = 29;
                                        break;
                                    }

                                    sk = _context5.t1.value;
                                    books = data.sources[sk];
                                    _iteratorNormalCompletion = true;
                                    _didIteratorError = false;
                                    _iteratorError = undefined;
                                    _context5.prev = 11;

                                    for (_iterator = books[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                        book = _step.value;

                                        if (!(book in data.books)) {
                                            error("没有在测试配置文件中找到书籍：" + book);
                                        } else taskQueue.push([sk, data.books[book]]);
                                    }
                                    _context5.next = 19;
                                    break;

                                case 15:
                                    _context5.prev = 15;
                                    _context5.t2 = _context5["catch"](11);
                                    _didIteratorError = true;
                                    _iteratorError = _context5.t2;

                                case 19:
                                    _context5.prev = 19;
                                    _context5.prev = 20;

                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                        _iterator.return();
                                    }

                                case 22:
                                    _context5.prev = 22;

                                    if (!_didIteratorError) {
                                        _context5.next = 25;
                                        break;
                                    }

                                    throw _iteratorError;

                                case 25:
                                    return _context5.finish(22);

                                case 26:
                                    return _context5.finish(19);

                                case 27:
                                    _context5.next = 5;
                                    break;

                                case 29:
                                    if (!(taskQueue.length > 0)) {
                                        _context5.next = 41;
                                        break;
                                    }

                                    _taskQueue$shift = taskQueue.shift(), _taskQueue$shift2 = _slicedToArray(_taskQueue$shift, 2), bsid = _taskQueue$shift2[0], _book = _taskQueue$shift2[1];

                                    log("测试书源：" + self.sources[bsid].name);
                                    _context5.prev = 32;
                                    _context5.next = 35;
                                    return check(bsid, _book);

                                case 35:
                                    _context5.next = 39;
                                    break;

                                case 37:
                                    _context5.prev = 37;
                                    _context5.t3 = _context5["catch"](32);

                                case 39:
                                    _context5.next = 29;
                                    break;

                                case 41:
                                case "end":
                                    return _context5.stop();
                            }
                        }
                    }, _callee2, this, [[11, 15, 19, 27], [20,, 22, 26], [32, 37]]);
                })());
            }
        }]);

        return BookSourceManagerTest;
    }();

    return BookSourceManagerTest;
});
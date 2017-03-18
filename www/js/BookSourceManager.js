"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["jquery", 'co', "util", "Book", "BookSource", "Chapter"], function ($, co, util, Book, BookSource, Chapter) {
    "use strict";

    var BookSourceManager = function () {
        function BookSourceManager(configFileOrConfig) {
            var _this = this;

            _classCallCheck(this, BookSourceManager);

            this.sources = undefined;
            this.settings = undefined;

            this.settings = {};
            this.settings.refreshCatalogInterval = 600;
            this.settings.refreshLastestChapterInterval = 600;

            if (typeof configFileOrConfig == 'string') {
                util.getJSON(configFileOrConfig).then(function (data) {
                    return _this.sources = data;
                });
            } else {
                this.sources = configFileOrConfig;
            }
        }

        _createClass(BookSourceManager, [{
            key: "getBook",
            value: function getBook(bsid, bookName, bookAuthor) {
                if (bsid && bookName && bookAuthor && bsid in this.sources) {
                    return this.searchBook(bsid, bookName).then(function (books) {
                        var book = books.find(function (e) {
                            return e.name == bookName && e.author == bookAuthor;
                        });
                        if (book) {
                            return book;
                        } else {
                            return Promise.reject(404);
                        }
                    }).catch(function (error) {
                        return Promise.reject(error == 602 ? 404 : error);
                    });
                } else {
                    return Promise.reject(401);
                }
            }
        }, {
            key: "searchBook",
            value: function searchBook(bsid, keyword) {
                var bs = this.sources[bsid];
                if (!bs) return;
                util.log('Search Book from: ' + bsid);

                var search = bs.search;
                var searchLink = util.format(search.url, { keyword: keyword });
                return util.getDOM(searchLink).then(getBookFromHtml);

                function getBookIdFromHtml(bookElement, bookid, bss) {
                    var bidElement = bookElement.find(bookid.element);
                    if (bookid.attribute) {
                        var bid = bidElement.attr(bookid.attribute);
                        if (bid) {
                            bss.bookid = bid;
                        }
                    }
                }

                function getBookFromHtml(html) {
                    html = $(html);
                    var info = search.info;
                    var detail = info.detail;
                    var books = [];
                    var bookItems = html.find(info.book);
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = Array.from(bookItems)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var element = _step.value;

                            element = $(element);
                            var book = new Book();
                            book.name = BookSourceManager.fixer.fixName(element.find(detail.name).text());
                            book.author = BookSourceManager.fixer.fixAuthor(element.find(detail.author).text());
                            book.catagory = BookSourceManager.fixer.fixCatagory(element.find(detail.catagory).text());
                            book.cover = util.fixurl(element.find(detail.cover).attr("data-src"), searchLink);
                            book.complete = BookSourceManager.fixer.fixComplete(element.find(detail.complete).text());
                            book.introduce = BookSourceManager.fixer.fixIntroduce(element.find(detail.introduce).text());

                            book.sources = {};
                            var bss = new BookSource(bsid, bs.contentSourceWeight);
                            if (info.bookid) {
                                getBookIdFromHtml(element, info.bookid, bss);
                            }
                            bss.detailLink = util.fixurl(element.find(detail.link).attr("href"), searchLink);
                            bss.lastestChapter = BookSourceManager.fixer.fixLastestChapter(element.find(detail.lastestChapter).text());
                            bss.searched = true;
                            book.sources[bsid] = bss;

                            book.mainSourceId = bsid;
                            books.push(book);
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

                    if (books.length <= 0) {
                        return Promise.reject(602);
                    } else {
                        return Promise.resolve(books);
                    }
                };
            }
        }, {
            key: "getBookInfo",
            value: function getBookInfo(bsid, detailLink) {
                var bsm = this.sources[bsid];
                var detail = bsm.detail;
                var info = detail.info;

                return util.getDOM(detailLink).then(function (html) {
                    html = $(html);
                    var book = {};

                    book.catagory = BookSourceManager.fixer.fixCatagory(html.find(info.catagory).text());
                    book.cover = util.fixurl(html.find(info.cover).attr("data-src"), detailLink);
                    book.complete = BookSourceManager.fixer.fixComplete(html.find(info.complete).text());
                    book.introduce = BookSourceManager.fixer.fixIntroduce(html.find(info.introduce).text());

                    return book;
                });
            }
        }, {
            key: "getBookCatalog",
            value: function getBookCatalog(bsid, catalogLink) {
                var bsm = this.sources[bsid];
                if (!bsm) return;
                var info = bsm.catalog.info;
                var type = bsm.catalog.type.toLowerCase();

                var rp = null;
                switch (type) {
                    case 'html':
                        rp = util.getDOM(catalogLink).then(getChaptersFromHTML);
                        break;
                    case 'json':
                        rp = util.get(catalogLink).then(getChaptersFromJSON);
                        break;
                    default:
                        rp = util.getDOM(catalogLink).then(getChaptersFromHTML);
                        break;
                }

                return rp.then(function (catalog) {
                    catalog = catalog.filter(function (e) {
                        return e;
                    });
                    if (catalog.length <= 0) {
                        return Promise.reject(601);
                    } else {
                        return catalog;
                    }
                });

                function getChaptersFromJSON(data) {
                    var catalog = [];
                    try {
                        var json = JSON.parse(data);
                        var chapters = util.getDataFromObject(json, info.chapter);
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = chapters[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var c = _step2.value;

                                var chapter = new Chapter();
                                var name = util.getDataFromObject(c, info.name);
                                var linkid = util.getDataFromObject(c, info.linkid);
                                chapter.title = name;
                                var vip = util.getDataFromObject(c, info.vip);
                                var locals = {
                                    name: name,
                                    linkid: linkid,
                                    vip: vip
                                };

                                var vipLinkPattern = util.format(info.vipLinkPattern, locals);
                                if (eval(vipLinkPattern)) {
                                    chapter.link = null;
                                } else {
                                    chapter.link = util.format(info.link, locals);
                                }
                                catalog.push(chapter);
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
                    } catch (e) {
                        util.error(e);
                    } finally {
                        return catalog;
                    }
                }

                function getChaptersFromHTML(html) {
                    var catalog = [];
                    html = $(html);
                    var chapters = html.find(info.link);
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = Array.from(chapters)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var element = _step3.value;

                            element = $(element);
                            var chapter = new Chapter();
                            chapter.link = util.fixurl(element.attr('href'), catalogLink);
                            if (info.vipLinkPattern && chapter.link.match(info.vipLinkPattern)) {
                                chapter.link = null;
                            }

                            chapter.title = BookSourceManager.fixer.fixChapterTitle(element.text());

                            catalog.push(chapter);
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

                    return catalog;
                }
            }
        }, {
            key: "getChapter",
            value: function getChapter(bsid, chapterLink) {
                if (!chapterLink) {
                    return Promise.reject(206);
                }

                util.log('Load Chpater content from Book Source: ' + chapterLink);

                var bsm = this.sources[bsid];
                var info = bsm.chapter.info;
                return util.getDOM(chapterLink).then(getChapterFromHtml);

                function getChapterFromHtml(html) {
                    html = $(html);
                    var chapter = new Chapter();
                    chapter.content = BookSourceManager.fixer.fixChapterContent(html.find(info.content).html());
                    if (!chapter.content) {
                        return Promise.reject(206);
                    }
                    chapter.link = chapterLink;
                    chapter.title = BookSourceManager.fixer.fixChapterTitle(html.find(info.title).text());

                    return chapter;
                }
            }
        }, {
            key: "getLastestChapter",
            value: function getLastestChapter(bsid, detailLink) {
                var bsm = this.sources[bsid];
                var detail = bsm.detail;
                var info = detail.info;

                return util.getDOM(detailLink).then(getBookDetailFromHtml);

                function getBookDetailFromHtml(html) {
                    html = $(html);
                    var lastestChapter = BookSourceManager.fixer.fixLastestChapter(html.find(info.lastestChapter).text());
                    return lastestChapter;
                };
            }
        }, {
            key: "getSourcesKeysByMainSourceWeight",
            value: function getSourcesKeysByMainSourceWeight() {
                return util.objectSortedKey(this.sources, 'mainSourceWeight');
            }
        }, {
            key: "getSourcesKeysByContentSourceWeight",
            value: function getSourcesKeysByContentSourceWeight(configFileOrConfig) {}
        }, {
            key: "init",
            value: function init() {
                for (var key in this) {
                    var value = this[key];
                    if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == 'object' && 'init' in value) {
                        value.init();
                    }
                }
            }
        }, {
            key: "checkBookSources",
            value: function checkBookSources(testFile) {
                var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (msg) {
                    return console.log(msg);
                };
                var error = arguments[2];


                if (!error) {
                    throw new Error("The argument 'error' is not defined!");
                }

                function check(bsid, testBook) {
                    var _marked = [checkBookInfo, checkCatalog].map(regeneratorRuntime.mark);

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

                    function checkCatalog(bs, book) {
                        var catalog, chapter;
                        return regeneratorRuntime.wrap(function checkCatalog$(_context2) {
                            while (1) {
                                switch (_context2.prev = _context2.next) {
                                    case 0:
                                        _context2.next = 2;
                                        return bs.getCatalog(self, book, true).catch(function (e) {
                                            error(getInfo() + " -> 测试目录 Wrong!");
                                            throw e;
                                        });

                                    case 2:
                                        catalog = _context2.sent;

                                        if (!(catalog.length <= 0 || !catalog[0].title)) {
                                            _context2.next = 6;
                                            break;
                                        }

                                        error(getInfo() + " -> 测试目录 Wrong!");
                                        return _context2.abrupt("return");

                                    case 6:

                                        log(getInfo() + " -> 测试目录 OK");

                                        _context2.next = 9;
                                        return bs.getChapter(self, book, catalog[0], false).catch(function (e) {
                                            error(getInfo() + " -> 测试章节错误：", e);
                                            throw e;
                                        });

                                    case 9:
                                        chapter = _context2.sent;


                                        if (chapter.title == catalog[0].title && chapter.content.length > 0) {
                                            log(getInfo() + " -> 测试章节 OK");
                                        } else {
                                            error(getInfo() + " -> 测试章节 Wrong!");
                                        }

                                    case 11:
                                    case "end":
                                        return _context2.stop();
                                }
                            }
                        }, _marked[1], this);
                    }

                    return co(regeneratorRuntime.mark(function _callee() {
                        var book, bs;
                        return regeneratorRuntime.wrap(function _callee$(_context3) {
                            while (1) {
                                switch (_context3.prev = _context3.next) {
                                    case 0:
                                        log(getInfo() + " -> 测试书籍：" + testBook.name + " by " + testBook.author);
                                        _context3.next = 3;
                                        return self.getBook(bsid, testBook.name, testBook.author).catch(function (e) {
                                            error(getInfo() + " -> 获取书籍失败：", e);throw e;
                                        });

                                    case 3:
                                        book = _context3.sent;


                                        log(getInfo() + " -> 测试项目：获取书籍 OK");
                                        bs = book.sources[bsid];
                                        _context3.next = 8;
                                        return checkBookInfo(bs, book);

                                    case 8:
                                        _context3.next = 10;
                                        return checkCatalog(bs, book);

                                    case 10:
                                    case "end":
                                        return _context3.stop();
                                }
                            }
                        }, _callee, this);
                    }));
                }

                var self = this;
                return co(regeneratorRuntime.mark(function _callee2() {
                    var data, taskQueue, sk, books, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, book, _taskQueue$shift, _taskQueue$shift2, bsid, _book;

                    return regeneratorRuntime.wrap(function _callee2$(_context4) {
                        while (1) {
                            switch (_context4.prev = _context4.next) {
                                case 0:
                                    _context4.next = 2;
                                    return util.getJSON(testFile);

                                case 2:
                                    data = _context4.sent;
                                    taskQueue = [];
                                    _context4.t0 = regeneratorRuntime.keys(data.sources);

                                case 5:
                                    if ((_context4.t1 = _context4.t0()).done) {
                                        _context4.next = 29;
                                        break;
                                    }

                                    sk = _context4.t1.value;
                                    books = data.sources[sk];
                                    _iteratorNormalCompletion4 = true;
                                    _didIteratorError4 = false;
                                    _iteratorError4 = undefined;
                                    _context4.prev = 11;

                                    for (_iterator4 = books[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                        book = _step4.value;

                                        if (!(book in data.books)) {
                                            error("没有在测试配置文件中找到书籍：" + book);
                                        } else taskQueue.push([sk, data.books[book]]);
                                    }
                                    _context4.next = 19;
                                    break;

                                case 15:
                                    _context4.prev = 15;
                                    _context4.t2 = _context4["catch"](11);
                                    _didIteratorError4 = true;
                                    _iteratorError4 = _context4.t2;

                                case 19:
                                    _context4.prev = 19;
                                    _context4.prev = 20;

                                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                        _iterator4.return();
                                    }

                                case 22:
                                    _context4.prev = 22;

                                    if (!_didIteratorError4) {
                                        _context4.next = 25;
                                        break;
                                    }

                                    throw _iteratorError4;

                                case 25:
                                    return _context4.finish(22);

                                case 26:
                                    return _context4.finish(19);

                                case 27:
                                    _context4.next = 5;
                                    break;

                                case 29:
                                    if (!(taskQueue.length > 0)) {
                                        _context4.next = 41;
                                        break;
                                    }

                                    _taskQueue$shift = taskQueue.shift(), _taskQueue$shift2 = _slicedToArray(_taskQueue$shift, 2), bsid = _taskQueue$shift2[0], _book = _taskQueue$shift2[1];

                                    log("测试书源：" + self.sources[bsid].name);
                                    _context4.prev = 32;
                                    _context4.next = 35;
                                    return check(bsid, _book);

                                case 35:
                                    _context4.next = 39;
                                    break;

                                case 37:
                                    _context4.prev = 37;
                                    _context4.t3 = _context4["catch"](32);

                                case 39:
                                    _context4.next = 29;
                                    break;

                                case 41:
                                case "end":
                                    return _context4.stop();
                            }
                        }
                    }, _callee2, this, [[11, 15, 19, 27], [20,, 22, 26], [32, 37]]);
                })());
            }
        }]);

        return BookSourceManager;
    }();

    BookSourceManager.fixer = {
        fixChapterContent: function fixChapterContent(html) {
            return util.html2text(html);
        },

        fixChapterTitle: function fixChapterTitle(text) {
            return text.trim();
        },

        fixName: function fixName(text) {
            text = text.trim();
            return text;
        },

        fixAuthor: function fixAuthor(text) {
            text = text.trim();
            return text;
        },

        fixCatagory: function fixCatagory(text) {
            text = text.trim();
            return text;
        },

        fixComplete: function fixComplete(text) {
            text = text.trim();
            return !!text.match(/完成|完结|完本/);
        },

        fixIntroduce: function fixIntroduce(text) {
            text = text.trim();
            return text;
        },

        fixLastestChapter: function fixLastestChapter(text) {
            text = text.replace(/^最新更新/, '').trim();
            return text;
        }
    };

    BookSourceManager.prototype.qidian = {
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
            this.getCSRToken();
        }
    };

    return BookSourceManager;
});
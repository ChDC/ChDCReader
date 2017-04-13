"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['co', "util", "Book", "BookSource", "Chapter"], function (co, util, Book, BookSource, Chapter) {
    "use strict";

    var BookSourceManager = function () {
        function BookSourceManager(configFileOrConfig) {
            var _this = this;

            _classCallCheck(this, BookSourceManager);

            this.sources = undefined;

            if (typeof configFileOrConfig == 'string') {
                util.getJSON(configFileOrConfig).then(function (data) {
                    return _this.sources = data;
                });
            } else {
                this.sources = configFileOrConfig;
            }

            this.init();
        }

        _createClass(BookSourceManager, [{
            key: "getBook",
            value: function getBook(bsid, bookName, bookAuthor) {
                util.log("BookSourceManager: Get book \"" + bookName + "\" from " + bsid);

                if (!bsid || !bookName || !bookAuthor || !(bsid in this.sources)) return Promise.reject(401);

                return this.searchBook(bsid, bookName).then(function (books) {
                    var book = books.find(function (e) {
                        return e.name == bookName && e.author == bookAuthor;
                    });
                    return book ? book : Promise.reject(404);
                }).catch(function (error) {
                    return Promise.reject(error == 602 ? 404 : error);
                });
            }
        }, {
            key: "searchBook",
            value: function searchBook(bsid, keyword) {

                util.log("BookSourceManager: Search Book \"" + keyword + "\" from " + bsid);

                var self = this;
                var bs = this.sources[bsid];
                if (!bs) return;

                var search = bs.search;
                var searchLink = util.format(search.url, { keyword: keyword });
                return util.getDOM(searchLink).then(getBookFromHtml);

                function getBookIdFromHtml(bookElement, bookid, bss) {

                    var bidElement = bookElement.querySelector(bookid.element);
                    if (bookid.attribute) {
                        var bid = bidElement.getAttribute(bookid.attribute);
                        if (bid) {
                            bss.bookid = bid;
                        }
                    }
                }

                function getBookFromHtml(htmlContent) {

                    var html = document.createElement("div");
                    html.innerHTML = htmlContent;

                    var info = search.info;
                    var detail = info.detail;
                    var books = [];
                    var fixer = BookSourceManager.fixer;

                    var bookItems = html.querySelectorAll(info.book);
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = Array.from(bookItems)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var element = _step.value;

                            var book = new Book(self);

                            book.name = fixer.fixName(element.querySelector(detail.name).textContent);
                            book.author = fixer.fixAuthor(element.querySelector(detail.author).textContent);
                            book.catagory = fixer.fixCatagory(util.elementFind(element, detail.catagory).textContent);
                            book.cover = util.fixurl(util.elementFind(element, detail.cover).getAttribute("data-src"), searchLink);
                            book.complete = fixer.fixComplete(util.elementFind(element, detail.complete).textContent);
                            book.introduce = fixer.fixIntroduce(util.elementFind(element, detail.introduce).textContent);

                            book.sources = {};
                            var bss = new BookSource(book, self, bsid, bs.contentSourceWeight);
                            if (info.bookid) {
                                getBookIdFromHtml(element, info.bookid, bss);
                            }
                            bss.detailLink = util.fixurl(util.elementFind(element, detail.link).getAttribute("href"), searchLink);
                            bss.lastestChapter = fixer.fixLastestChapter(util.elementFind(element, detail.lastestChapter).textContent);

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

                    return books.length <= 0 ? Promise.reject(602) : Promise.resolve(books);
                };
            }
        }, {
            key: "getBookInfo",
            value: function getBookInfo(bsid, detailLink) {

                util.log("BookSourceManager: Get Book Info from " + bsid + " with link \"" + detailLink + "\"");

                var bsm = this.sources[bsid];
                var detail = bsm.detail;
                var info = detail.info;
                var fixer = BookSourceManager.fixer;

                return util.getDOM(detailLink).then(function (htmlContent) {
                    var html = document.createElement("div");
                    html.innerHTML = htmlContent;

                    var book = {};

                    book.catagory = fixer.fixCatagory(util.elementFind(html, info.catagory).textContent);
                    book.cover = util.fixurl(util.elementFind(html, info.cover).getAttribute("data-src"), detailLink);
                    book.complete = fixer.fixComplete(util.elementFind(html, info.complete).textContent);
                    book.introduce = fixer.fixIntroduce(util.elementFind(html, info.introduce).textContent);

                    return book;
                });
            }
        }, {
            key: "getBookCatalogLink",
            value: function getBookCatalogLink(bsid) {
                var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


                util.log("BookSourceManager: Get BookCatalogLink from " + bsid + " with options \"" + options + "\"");

                var self = this;
                var bsm = this.sources[bsid];
                if (!bsm) return Promise.reject();

                return co(regeneratorRuntime.mark(function _callee() {
                    var html, container, link, catalogLink, o, _link;

                    return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    if (!bsm.detail.info.catalogLink) {
                                        _context.next = 10;
                                        break;
                                    }

                                    _context.next = 3;
                                    return util.getDOM(options.detailLink);

                                case 3:
                                    html = _context.sent;
                                    container = document.createElement('div');

                                    container.innerHTML = html;
                                    link = util.elementFind(container, bsm.detail.info.catalogLink).getAttribute("href");
                                    return _context.abrupt("return", Promise.resolve(link));

                                case 10:
                                    catalogLink = bsm.catalog.link;
                                    o = Object.assign({}, options, this[bsid]);
                                    _link = util.format(catalogLink, o);
                                    return _context.abrupt("return", Promise.resolve(_link));

                                case 14:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    }, _callee, this);
                }));
            }
        }, {
            key: "getBookCatalog",
            value: function getBookCatalog(bsid, catalogLink) {

                util.log("BookSourceManager: Refresh Catalog from " + bsid + " with link \"" + catalogLink + "\"");

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

                function getChaptersFromHTML(htmlContent) {
                    var catalog = [];

                    var html = document.createElement("div");
                    html.innerHTML = htmlContent;

                    var chapters = html.querySelectorAll(info.link);
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = Array.from(chapters)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var element = _step3.value;

                            var chapter = new Chapter();
                            chapter.link = util.fixurl(element.getAttribute("href"), catalogLink);
                            if (info.vipLinkPattern && chapter.link.match(info.vipLinkPattern)) {
                                chapter.link = null;
                            }

                            chapter.title = BookSourceManager.fixer.fixChapterTitle(element.textContent);

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

                util.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapterLink + "\"");

                if (!chapterLink) return Promise.reject(206);

                var bsm = this.sources[bsid];
                var info = bsm.chapter.info;
                return util.getDOM(chapterLink).then(getChapterFromHtml);

                function getChapterFromHtml(htmlContent) {
                    var html = document.createElement("div");
                    html.innerHTML = htmlContent;

                    var chapter = new Chapter();
                    chapter.content = BookSourceManager.fixer.fixChapterContent(html.querySelector(info.content).innerHTML);
                    if (!chapter.content) {
                        return Promise.reject(206);
                    }
                    chapter.link = chapterLink;
                    chapter.title = BookSourceManager.fixer.fixChapterTitle(html.querySelector(info.title).textContent);

                    return chapter;
                }
            }
        }, {
            key: "getLastestChapter",
            value: function getLastestChapter(bsid, detailLink) {

                util.log("BookSourceManager: Get Lastest Chapter from " + bsid + " with link \"" + detailLink + "\"");

                var bsm = this.sources[bsid];
                var detail = bsm.detail;
                var info = detail.info;

                return util.getDOM(detailLink).then(getBookDetailFromHtml);

                function getBookDetailFromHtml(htmlContent) {

                    var html = document.createElement("div");
                    html.innerHTML = htmlContent;

                    var lastestChapter = BookSourceManager.fixer.fixLastestChapter(html.querySelector(info.lastestChapter).textContent);
                    return lastestChapter;
                };
            }
        }, {
            key: "getSourcesKeysByMainSourceWeight",
            value: function getSourcesKeysByMainSourceWeight() {
                return util.objectSortedKey(this.sources, 'mainSourceWeight');
            }
        }, {
            key: "getBookSourceName",
            value: function getBookSourceName(bsid) {
                try {
                    return this.sources[bsid].name;
                } catch (e) {
                    return "";
                }
            }
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
                    var _marked = [checkBookInfo, checkLastestChapter, checkCatalog].map(regeneratorRuntime.mark);

                    function getInfo() {
                        return self.sources[bsid].name;
                    }

                    function checkBookInfo(bs, book) {
                        var ik, testProperty;
                        return regeneratorRuntime.wrap(function checkBookInfo$(_context2) {
                            while (1) {
                                switch (_context2.prev = _context2.next) {
                                    case 0:
                                        _context2.next = 2;
                                        return bs.getBookInfo(self, book).catch(function (e) {
                                            error(getInfo() + " -> 获取书籍信息失败：", e);
                                            throw e;
                                        });

                                    case 2:
                                        book = _context2.sent;


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
                                        return _context2.stop();
                                }
                            }
                        }, _marked[0], this);
                    }

                    function checkLastestChapter(bs, book) {
                        var _ref, _ref2, lastestChapter, lastestChapterUpdated;

                        return regeneratorRuntime.wrap(function checkLastestChapter$(_context3) {
                            while (1) {
                                switch (_context3.prev = _context3.next) {
                                    case 0:
                                        _context3.next = 2;
                                        return bs.refreshLastestChapter(self, book).catch(function (e) {
                                            error(getInfo() + " -> 获取最新章节信息失败：", e);
                                            throw e;
                                        });

                                    case 2:
                                        _ref = _context3.sent;
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
                                        return _context3.stop();
                                }
                            }
                        }, _marked[1], this);
                    }

                    function checkCatalog(bs, book) {
                        var catalog, chapter;
                        return regeneratorRuntime.wrap(function checkCatalog$(_context4) {
                            while (1) {
                                switch (_context4.prev = _context4.next) {
                                    case 0:
                                        _context4.next = 2;
                                        return bs.getCatalog(self, book, true).catch(function (e) {
                                            error(getInfo() + " -> 测试目录 Wrong!");
                                            throw e;
                                        });

                                    case 2:
                                        catalog = _context4.sent;

                                        if (!(catalog.length <= 0 || !catalog[0].title)) {
                                            _context4.next = 6;
                                            break;
                                        }

                                        error(getInfo() + " -> 测试目录 Wrong!");
                                        return _context4.abrupt("return");

                                    case 6:

                                        log(getInfo() + " -> 测试目录 OK");

                                        _context4.next = 9;
                                        return bs.getChapter(catalog[0], false).catch(function (e) {
                                            error(getInfo() + " -> 测试章节错误：", e);
                                            throw e;
                                        });

                                    case 9:
                                        chapter = _context4.sent;


                                        if (chapter.title == catalog[0].title && chapter.content.length > 0) {
                                            log(getInfo() + " -> 测试章节 OK");
                                        } else {
                                            error(getInfo() + " -> 测试章节 Wrong!");
                                        }

                                    case 11:
                                    case "end":
                                        return _context4.stop();
                                }
                            }
                        }, _marked[2], this);
                    }

                    return co(regeneratorRuntime.mark(function _callee2() {
                        var book, bs;
                        return regeneratorRuntime.wrap(function _callee2$(_context5) {
                            while (1) {
                                switch (_context5.prev = _context5.next) {
                                    case 0:
                                        log(getInfo() + " -> 测试书籍：" + testBook.name + " by " + testBook.author);
                                        _context5.next = 3;
                                        return self.getBook(bsid, testBook.name, testBook.author).catch(function (e) {
                                            error(getInfo() + " -> 获取书籍失败：", e);throw e;
                                        });

                                    case 3:
                                        book = _context5.sent;


                                        log(getInfo() + " -> 测试项目：获取书籍 OK");
                                        bs = book.sources[bsid];
                                        _context5.next = 8;
                                        return checkBookInfo(bs, book);

                                    case 8:
                                        _context5.next = 10;
                                        return checkLastestChapter(bs, book);

                                    case 10:
                                        _context5.next = 12;
                                        return checkCatalog(bs, book);

                                    case 12:
                                    case "end":
                                        return _context5.stop();
                                }
                            }
                        }, _callee2, this);
                    }));
                }

                var self = this;
                return co(regeneratorRuntime.mark(function _callee3() {
                    var data, taskQueue, sk, books, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, book, _taskQueue$shift, _taskQueue$shift2, bsid, _book;

                    return regeneratorRuntime.wrap(function _callee3$(_context6) {
                        while (1) {
                            switch (_context6.prev = _context6.next) {
                                case 0:
                                    _context6.next = 2;
                                    return util.getJSON(testFile);

                                case 2:
                                    data = _context6.sent;
                                    taskQueue = [];
                                    _context6.t0 = regeneratorRuntime.keys(data.sources);

                                case 5:
                                    if ((_context6.t1 = _context6.t0()).done) {
                                        _context6.next = 29;
                                        break;
                                    }

                                    sk = _context6.t1.value;
                                    books = data.sources[sk];
                                    _iteratorNormalCompletion4 = true;
                                    _didIteratorError4 = false;
                                    _iteratorError4 = undefined;
                                    _context6.prev = 11;

                                    for (_iterator4 = books[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                        book = _step4.value;

                                        if (!(book in data.books)) {
                                            error("没有在测试配置文件中找到书籍：" + book);
                                        } else taskQueue.push([sk, data.books[book]]);
                                    }
                                    _context6.next = 19;
                                    break;

                                case 15:
                                    _context6.prev = 15;
                                    _context6.t2 = _context6["catch"](11);
                                    _didIteratorError4 = true;
                                    _iteratorError4 = _context6.t2;

                                case 19:
                                    _context6.prev = 19;
                                    _context6.prev = 20;

                                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                        _iterator4.return();
                                    }

                                case 22:
                                    _context6.prev = 22;

                                    if (!_didIteratorError4) {
                                        _context6.next = 25;
                                        break;
                                    }

                                    throw _iteratorError4;

                                case 25:
                                    return _context6.finish(22);

                                case 26:
                                    return _context6.finish(19);

                                case 27:
                                    _context6.next = 5;
                                    break;

                                case 29:
                                    if (!(taskQueue.length > 0)) {
                                        _context6.next = 41;
                                        break;
                                    }

                                    _taskQueue$shift = taskQueue.shift(), _taskQueue$shift2 = _slicedToArray(_taskQueue$shift, 2), bsid = _taskQueue$shift2[0], _book = _taskQueue$shift2[1];

                                    log("测试书源：" + self.sources[bsid].name);
                                    _context6.prev = 32;
                                    _context6.next = 35;
                                    return check(bsid, _book);

                                case 35:
                                    _context6.next = 39;
                                    break;

                                case 37:
                                    _context6.prev = 37;
                                    _context6.t3 = _context6["catch"](32);

                                case 39:
                                    _context6.next = 29;
                                    break;

                                case 41:
                                case "end":
                                    return _context6.stop();
                            }
                        }
                    }, _callee3, this, [[11, 15, 19, 27], [20,, 22, 26], [32, 37]]);
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
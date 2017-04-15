"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['co', "util", "Spider", "Book", "BookSource", "Chapter"], function (co, util, Spider, Book, BookSource, Chapter) {
    "use strict";

    var BookSourceManager = function () {
        function BookSourceManager(configFileOrConfig) {
            var _this = this;

            _classCallCheck(this, BookSourceManager);

            this.sources = undefined;
            this.spider = new Spider();

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
                });
            }
        }, {
            key: "searchBookInAllBookSource",
            value: function searchBookInAllBookSource(keyword) {
                var _this2 = this;

                var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                    _ref$filterSameResult = _ref.filterSameResult,
                    filterSameResult = _ref$filterSameResult === undefined ? true : _ref$filterSameResult;

                util.log("BookSourceManager: Search Book in all booksource \"" + keyword + "\"");

                var result = {};
                var errorList = [];
                var allBsids = this.getSourcesKeysByMainSourceWeight();
                var tasks = [];

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    var _loop2 = function _loop2() {
                        var bsid = _step.value;

                        tasks.push(_this2.searchBook(bsid, keyword).then(function (books) {
                            result[bsid] = books;
                        }).catch(function (error) {
                            errorList.push(error);
                        }));
                    };

                    for (var _iterator = allBsids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        _loop2();
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

                function handleResult() {
                    var finalResult = [];

                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = allBsids[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var bsid = _step2.value;

                            var books = result[bsid];
                            var _iteratorNormalCompletion3 = true;
                            var _didIteratorError3 = false;
                            var _iteratorError3 = undefined;

                            try {
                                var _loop = function _loop() {
                                    var b = _step3.value;

                                    if (filterSameResult) {
                                        if (!finalResult.find(function (e) {
                                            return Book.equal(e, b);
                                        })) finalResult.push(b);
                                    } else finalResult.push(b);
                                };

                                for (var _iterator3 = books[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                    _loop();
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

                    if (finalResult.length === 0 && errorList.length > 0) {
                        var re = util.arrayCount(errorList);
                        throw re[0][0];
                    }

                    return finalResult;
                }

                return Promise.all(tasks).then(handleResult);
            }
        }, {
            key: "searchBook",
            value: function searchBook(bsid, keyword) {

                util.log("BookSourceManager: Search Book \"" + keyword + "\" from " + bsid);

                var self = this;
                var bs = this.sources[bsid];
                if (!bs) return Promise.reject("Illegal booksource!");

                return this.spider.get(bs.search, { keyword: keyword }).then(getBooks);

                function getBooks(data) {

                    var books = [];

                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var m = _step4.value;

                            m.cover = m.coverImg;
                            var book = Book.createBook(m, self);
                            if (!checkBook(book)) continue;

                            book.sources = {};

                            var bss = new BookSource(book, self, bsid, bs.contentSourceWeight);

                            if (m.bookid) bss.bookid = m.bookid;

                            bss.detailLink = m.detailLink;
                            if (m.lastestChapter) {
                                bss.lastestChapter = m.lastestChapter.replace(/^最新更新\s+/, '');
                            }


                            bss.searched = true;
                            book.sources[bsid] = bss;

                            book.mainSourceId = bsid;
                            books.push(book);
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

                    return books;
                }

                function checkBook(book) {
                    var name = book.name;
                    var author = book.author;
                    var keywords = keyword.split(/ +/);
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = keywords[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var kw = _step5.value;

                            if (kw.indexOf(name) >= 0 || kw.indexOf(author) >= 0 || name.indexOf(kw) >= 0 || author.indexOf(kw) >= 0) return true;
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

                    return false;
                }
            }
        }, {
            key: "getBookInfo",
            value: function getBookInfo(bsid, detailLink) {

                util.log("BookSourceManager: Get Book Info from " + bsid + " with link \"" + detailLink + "\"");

                var bs = this.sources[bsid];
                if (!bs) return Promise.reject("Illegal booksource!");

                return this.spider.get(bs.detail, { url: detailLink, detailLink: detailLink }).then(function (data) {
                    data.cover = data.coverImg;
                    delete data.coverImg;
                    return data;
                });
            }
        }, {
            key: "getBookCatalogLink",
            value: function getBookCatalogLink(bsid, locals) {

                util.log("BookSourceManager: Get Book Catalog Link from " + bsid + "\"");

                var bs = this.sources[bsid];
                if (!bs) return Promise.reject("Illegal booksource!");

                if (!bs.catalogLink) return Promise.resolve(null);

                return this.spider.get(bs.catalogLink, locals);
            }
        }, {
            key: "getBookCatalog",
            value: function getBookCatalog(bsid, locals) {

                util.log("BookSourceManager: Refresh Catalog from " + bsid);

                var bsm = this.sources[bsid];
                if (!bsm) return Promise.reject("Illegal booksource!");

                return this.spider.get(bsm.catalog, locals).then(function (data) {

                    var catalog = [];
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                        for (var _iterator6 = data[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var c = _step6.value;

                            var chapter = new Chapter();
                            chapter.title = c.name;
                            chapter.link = c.link;
                            catalog.push(chapter);
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

                    return catalog;
                });
            }
        }, {
            key: "getChapter",
            value: function getChapter(bsid, chapterLink) {

                util.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapterLink + "\"");

                if (!chapterLink) return Promise.reject(206);

                var bsm = this.sources[bsid];
                if (!bsm) return Promise.reject("Illegal booksource!");

                return this.spider.get(bsm.chapter, { url: chapterLink, chapterLink: chapterLink }).then(function (data) {
                    var chapter = new Chapter();
                    chapter.content = util.html2text(data.contentHTML);

                    if (!chapter.content) {
                        return Promise.reject(206);
                    }
                    chapter.link = chapterLink;
                    chapter.title = data.title;

                    return chapter;
                });
            }
        }, {
            key: "getLastestChapter",
            value: function getLastestChapter(bsid, detailLink) {
                util.log("BookSourceManager: Get Lastest Chapter from " + bsid + " with link \"" + detailLink + "\"");

                var bsm = this.sources[bsid];
                if (!bsm) return Promise.reject("Illegal booksource!");

                return this.spider.get(bsm.detail, { url: detailLink, detailLink: detailLink }).then(function (data) {
                    return data.lastestChapter.replace(/^最新更新\s+/, '');
                });
            }
        }, {
            key: "getSourcesKeysByMainSourceWeight",
            value: function getSourcesKeysByMainSourceWeight() {
                return util.objectSortedKey(this.sources, 'mainSourceWeight').reverse();
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
        }]);

        return BookSourceManager;
    }();

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
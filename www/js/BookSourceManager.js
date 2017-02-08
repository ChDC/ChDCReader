"use strict";

define(["jquery", "util", "Book", "BookSource", "Chapter"], function ($, util, Book, BookSource, Chapter) {
    "use strict";

    BookSourceManager.getError = function (errorCode) {
        var bookErrorCode = {
            206: "章节内容错误",
            401: "源配置不正确！",
            404: "未在当前的源中找到该书！",
            601: "获取目录失败，请检查书源是否正常",
            602: "搜索结果为空，请检查书源是否正常"
        };
        return {
            id: errorCode,
            message: bookErrorCode[errorCode]
        };
    };

    function BookSourceManager(configFileOrConfig) {
        var self = this;
        if ($.type(configFileOrConfig) == 'string') {
            $.getJSON(configFileOrConfig, function (data) {
                self.sources = data;
            });
        } else {
            var data = configFileOrConfig;
            self.sources = data;
        }
        self.settings = {};
        self.settings.refreshCatalogInterval = 600;
        self.settings.refreshLastestChapterInterval = 600;
    };
    BookSourceManager.prototype.sources = undefined;
    BookSourceManager.prototype.settings = undefined;

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

    BookSourceManager.prototype.getBook = function (bsid, bookName, bookAuthor, success, fail) {
        var self = this;
        if (bsid && bookName && bookAuthor && bsid in self.sources) {
            self.searchBook(bsid, bookName, function (books, keyword, bsid) {
                var i = util.arrayIndex(books, null, function (e) {
                    return e.name == bookName && e.author == bookAuthor;
                });
                if (i >= 0) {
                    var book = books[i];
                    success(book, bsid);
                } else {
                    if (fail) fail(BookSourceManager.getError(404));
                }
            }, function (error) {
                if (error.id == 602) {
                    if (fail) fail(BookSourceManager.getError(404));
                } else {
                    if (fail) fail(error);
                }
            });
        } else {
            if (fail) fail(BookSourceManager.getError(401));
        }
    };

    BookSourceManager.prototype.searchBook = function (bsid, keyword, success, fail) {
        var self = this;
        var bs = self.sources[bsid];
        if (!bs) return;
        util.log('Search Book from: ' + bsid);

        var search = bs.search;
        var searchLink = util.format(search.url, { keyword: keyword });
        util.getDOM(searchLink, {}, getBookFromHtml, fail);

        function getBookIdFromHtml(bookElement, bookid, bss) {
            var bidElement = bookElement.find(bookid.element);
            if (bookid.attribute) {
                var bid = bidElement.attr(bookid.attribute);
                if (bid) {
                    bss.bookid = bid;
                }
                return;
            }
        }

        function getBookFromHtml(html) {
            html = $(html);
            var info = search.info;
            var detail = info.detail;
            var books = [];
            var bookItems = html.find(info.book);
            bookItems.each(function () {
                var element = $(this);
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
                return books.push(book);
            });
            if (books.length <= 0) {
                if (fail) fail(BookSourceManager.getError(602));
            } else {
                if (success) success(books, keyword, bsid);
            }
        };
    };

    BookSourceManager.prototype.getBookInfo = function (bsid, detailLink, success, fail) {
        var self = this;
        var bsm = self.sources[bsid];
        var detail = bsm.detail;
        var info = detail.info;

        util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

        function getBookDetailFromHtml(html) {
            html = $(html);
            var book = {};

            book.catagory = BookSourceManager.fixer.fixCatagory(html.find(info.catagory).text());
            book.cover = util.fixurl(html.find(info.cover).attr("data-src"), detailLink);
            book.complete = BookSourceManager.fixer.fixComplete(html.find(info.complete).text());
            book.introduce = BookSourceManager.fixer.fixIntroduce(html.find(info.introduce).text());

            if (success) success(book);
        };
    };

    BookSourceManager.prototype.getBookCatalog = function (bsid, catalogLink, success, fail) {
        var self = this;
        var bsm = self.sources[bsid];
        if (!bsm) return;
        var info = bsm.catalog.info;
        var type = bsm.catalog.type.toLowerCase();
        var catalog = [];

        switch (type) {
            case 'html':
                util.getDOM(catalogLink, {}, getChaptersFromHTML, fail);
                break;
            case 'json':
                util.get(catalogLink, {}, getChaptersFromJSON, fail);
                break;
            default:
                util.getDOM(catalogLink, {}, getChaptersFromHTML, fail);
                break;
        }

        function finish() {
            catalog = catalog.filter(function (e) {
                return e;
            });
            if (catalog.length <= 0) {
                if (fail) fail(BookSourceManager.getError(601));
            } else {
                if (success) success(catalog);
            }
        };

        function getChaptersFromJSON(data) {
            try {
                var json = JSON.parse(data);
                var chapters = util.getDataFromObject(json, info.chapter);
                $(chapters).each(function () {
                    var chapter = new Chapter();
                    var name = util.getDataFromObject(this, info.name);
                    var linkid = util.getDataFromObject(this, info.linkid);
                    chapter.title = name;
                    var vip = util.getDataFromObject(this, info.vip);
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
                });
                finish();
            } catch (e) {
                util.error(e);
                finish();
            }
        }

        function getChaptersFromHTML(html) {
            html = $(html);
            var chapters = html.find(info.link);
            chapters.each(function () {
                var element = $(this);
                var chapter = new Chapter();
                chapter.link = util.fixurl(element.attr('href'), catalogLink);
                if (info.vipLinkPattern && chapter.link.match(info.vipLinkPattern)) {
                    chapter.link = null;
                }

                chapter.title = BookSourceManager.fixer.fixChapterTitle(element.text());

                catalog.push(chapter);
            });
            finish();
        }
    };

    BookSourceManager.prototype.getChapter = function (bsid, chapterLink, success, fail) {
        if (!chapterLink) {
            if (fail) fail(BookSourceManager.getError(206));
            return;
        }

        util.log('Load Chpater content from Book Source: ' + chapterLink);

        var self = this;
        var bsm = self.sources[bsid];
        var info = bsm.chapter.info;
        util.getDOM(chapterLink, {}, getChapterFromHtml, fail);

        function getChapterFromHtml(html) {
            html = $(html);
            var chapter = new Chapter();
            chapter.content = BookSourceManager.fixer.fixChapterContent(html.find(info.content).html());
            if (!chapter.content) {
                if (fail) fail(BookSourceManager.getError(206));
                return;
            }
            chapter.link = chapterLink;
            chapter.title = BookSourceManager.fixer.fixChapterTitle(html.find(info.title).text());

            if (success) success(chapter);
        }
    };

    BookSourceManager.prototype.getLastestChapter = function (bsid, detailLink, success, fail) {
        var self = this;
        var bsm = this.sources[bsid];
        var detail = bsm.detail;
        var info = detail.info;

        util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

        function getBookDetailFromHtml(html) {
            html = $(html);
            var lastestChapter = BookSourceManager.fixer.fixLastestChapter(html.find(info.lastestChapter).text());
            if (success) success(lastestChapter);
        };
    };

    BookSourceManager.prototype.getSourcesKeysByMainSourceWeight = function () {
        return util.objectSortedKey(this.sources, 'mainSourceWeight');
    };

    BookSourceManager.prototype.getSourcesKeysByContentSourceWeight = function (configFileOrConfig) {};

    BookSourceManager.prototype.init = function () {
        for (var key in this) {
            var value = this[key];
            if ($.type(value) == 'object' && 'init' in value) {
                value.init();
            }
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

    BookSourceManager.prototype.checkBookSources = function (testFile, log, error, finish) {

        log = log || function (msg) {
            console.log(msg);
        };

        error = error || function (msg, error) {
            msg += "(" + error.id + ", " + error.message + ')';
            console.error(msg);
        };

        function check(bsid, testBook, done) {
            function getInfo() {
                return self.sources[bsid].name;
            }

            function checkBookInfo(bs, book, done) {
                bs.getBookInfo(self, book, function (book) {

                    for (var ik in testBook) {
                        if (ik.match(/^test_/)) {
                            var testProperty = ik.substring(5);
                            if (book[testProperty].match(testBook[ik])) {
                                log(getInfo() + " -> 测试属性：" + testProperty + " OK");
                            } else {
                                error(getInfo() + " -> 测试属性：" + testProperty + " Wrong!");
                            }
                        }
                    }
                    if (done) done();
                }, function (e) {
                    error(getInfo() + " -> 获取书籍信息失败：", e);
                    if (done) done();
                });
            }

            function checkCatalog(bs, book, done) {
                bs.getCatalog(self, book, true, function (catalog) {
                    if (catalog.length > 0 && catalog[0].title) {
                        log(getInfo() + " -> 测试目录 OK");

                        bs.getChapter(self, book, catalog[0], false, function (chapter) {
                            if (chapter.title == catalog[0].title && chapter.content.length > 0) {
                                log(getInfo() + " -> 测试章节 OK");
                            } else {
                                error(getInfo() + " -> 测试章节 Wrong!");
                            }
                            if (done) done();
                        }, function (e) {
                            error(getInfo() + " -> 测试章节错误：", e);
                            if (done) done();
                        });
                    } else {
                        error(getInfo() + " -> 测试目录 Wrong!");
                        if (done) done();
                    }
                }, function (e) {
                    error(getInfo() + " -> 测试目录 Wrong!", e);
                    if (done) done();
                });
            }

            log(getInfo() + " -> 测试书籍：" + testBook.name + " by " + testBook.author);
            self.getBook(bsid, testBook.name, testBook.author, function (book) {
                log(getInfo() + " -> 测试项目：获取书籍 OK");
                var bs = book.sources[bsid];

                checkBookInfo(bs, book, function () {
                    checkCatalog(bs, book, done);
                });
            }, function (e) {
                error(getInfo() + " -> 获取书籍失败：", e);
                if (done) done();
            });
        }

        var self = this;
        $.getJSON(testFile, function (data) {
            var taskQueue = [];

            var _loop = function _loop(sk) {
                var bs = data.sources[sk];
                $(bs).each(function () {
                    if (!(this in data.books)) {
                        error("没有在测试配置文件中找到书籍：" + this);
                        return;
                    }
                    taskQueue.push([sk, data.books[this]]);
                });
            };

            for (var sk in data.sources) {
                _loop(sk);
            }

            next();
            function next() {
                var d = taskQueue.shift();
                if (!d) {
                    if (finish) finish();
                    return;
                }
                log("测试书源：" + self.sources[d[0]].name);
                check(d[0], d[1], function () {
                    next();
                });
            }
        });
    };

    return BookSourceManager;
});
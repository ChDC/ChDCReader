"use strict";

define(["jquery", "util", 'Book', 'Chapter'], function ($, util, Book, Chapter) {
    "use strict";

    function BookSource(id, weight) {
        this.id = id;
        this.needSaveCatalog = false;
        this.updatedCatalogTime = 0;
        this.updatedLastestChapterTime = 0;
        this.disable = false;
        this.weight = weight || 0;
        this.searched = false;
    };

    BookSource.getError = function (errorCode) {
        var bookErrorCode = {
            207: "未从缓存中发现该章节",

            400: "不能频繁更新书籍目录",
            402: "不能频繁更新最新章节",

            404: "未在当前的源中找到该书！"

        };
        return {
            id: errorCode,
            message: bookErrorCode[errorCode]
        };
    };

    BookSource.prototype.id = null;
    BookSource.prototype.detailLink = null;
    BookSource.prototype.catalogLink = null;
    BookSource.prototype.bookid = null;
    BookSource.prototype.catalog = null;
    BookSource.prototype.weight = 0;
    BookSource.prototype.updatedCatalogTime = 0;
    BookSource.prototype.updatedLastestChapterTime = 0;
    BookSource.prototype.needSaveCatalog = false;
    BookSource.prototype.disable = false;
    BookSource.prototype.lastestChapter = undefined;
    BookSource.prototype.searched = false;
    BookSource.prototype.getBook = function (bookSourceManager, book, success, fail) {
        var self = this;

        if (self.disable) {
            if (fail) fail(BookSource.getError(404));
            return;
        }
        bookSourceManager.getBook(self.id, book.name, book.author, function (book, bsid) {
            $.extend(self, book.sources[bsid]);
            if (success) success(bsid, self);
        }, function (error) {
            if (error.id == 404) {
                self.disable = true;
                self.searched = true;
            }
            if (fail) fail(error);
        });
    };

    BookSource.prototype.__getBookSourceDetailLink = function (bookSourceManager, book, success, fail) {
        var self = this;
        if (!self.searched) {
            self.getBook(bookSourceManager, book, function (bsid, bs) {
                success(bs.detailLink, bsid, bs);
            }, fail);
        } else {
            if (self.disable) {
                if (fail) fail(BookSource.getError(404));
            } else {
                success(self.detailLink, self.id, self);
            }
        }
    };

    BookSource.prototype.__getBookSourceCatalogLink = function (bookSourceManager, book, success, fail) {
        var self = this;
        function computeCatalogLink(bss, success) {
            var bsm = bookSourceManager.sources[self.id];
            if (!bsm) return;
            if (bsm.detail.info.catalogLink) {
                self.__getBookSourceDetailLink(bookSourceManager, book, function (detailLink) {
                    util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

                    function getBookDetailFromHtml(html) {
                        html = $(html);
                        var link = html.find(bsm.detail.info.catalogLink).attr('href');
                        if (success) success(link);
                    };
                }, fail);

                return;
            }

            var catalogLink = bsm.catalog.link;
            var o = $.extend({}, bss, bookSourceManager[self.id]);
            var link = util.format(catalogLink, o);
            if (success) success(link);
        }

        if (!self.searched) {
            self.getBook(bookSourceManager, book, function (bsid, bs) {
                computeCatalogLink(self, function (link) {
                    self.catalogLink = link;
                    success(self.catalogLink, self.id, self);
                });
            }, fail);
        } else {
            if (self.disable) {
                if (fail) fail(BookSource.getError(404));
            } else {
                if (!self.catalogLink) {
                    computeCatalogLink(self, function (link) {
                        self.catalogLink = link;
                        success(self.catalogLink, self.id, self);
                    });
                } else {
                    success(self.catalogLink, self.id, self);
                }
            }
        }
    };

    BookSource.prototype.__refreshCatalog = function (bookSourceManager, book, success, fail) {

        var self = this;
        if (new Date().getTime() - self.updatedCatalogTime < bookSourceManager.settings.refreshCatalogInterval * 1000) {
            if (fail) fail(BookSource.getError(400));
        } else {
            util.log('Refresh Catalog!');
            self.__getBookSourceCatalogLink(bookSourceManager, book, function (catalogLink, bsid, bs) {
                bookSourceManager.getBookCatalog(self.id, catalogLink, function (catalog) {
                    self.catalog = catalog;
                    self.updatedCatalogTime = new Date().getTime();
                    self.needSaveCatalog = true;
                    if (success) success(catalog);
                }, fail);
            }, fail);
        }
    };

    BookSource.prototype.getBookInfo = function (bookSourceManager, book, success, fail) {
        var self = this;
        self.__getBookSourceDetailLink(bookSourceManager, book, function (detailLink, bsid, bs) {
            bookSourceManager.getBookInfo(bsid, detailLink, success, fail);
        }, fail);
    };

    BookSource.prototype.getCatalog = function (bookSourceManager, book, forceRefresh, success, fail) {
        var self = this;
        if (!forceRefresh && self.catalog) {
            if (success) success(self.catalog);
        } else {
            self.__refreshCatalog(bookSourceManager, book, success, function (error) {
                if (error.id == 400) {
                    if (success) success(self.catalog);
                } else {
                    if (fail) fail(error);
                }
            });
        }
    };

    BookSource.prototype.refreshLastestChapter = function (bookSourceManager, book, success, fail) {
        var self = this;
        if (new Date().getTime() - self.updatedLastestChapterTime < bookSourceManager.settings.refreshLastestChapterInterval * 1000) {
            if (fail) fail(BookSource.getError(402));
        } else {
            util.log('Refresh LastestChapter!');

            self.__getBookSourceDetailLink(bookSourceManager, book, function (detailLink, bsid, bs) {

                bookSourceManager.getLastestChapter(bsid, detailLink, function (lastestChapter) {
                    bs.updatedLastestChapterTime = new Date().getTime();
                    var lastestChapterUpdated = false;
                    if (bs.lastestChapter != lastestChapter) {
                        bs.lastestChapter = lastestChapter;
                        lastestChapterUpdated = true;
                    }
                    if (success) success(lastestChapter, lastestChapterUpdated);
                }, fail);
            }, fail);
        }
    };

    BookSource.prototype.getChapter = function (bookSourceManager, book, chapter, onlyCacheNoLoad, success, fail) {
        var self = this;

        self.__getCacheChapter(book, chapter.title, onlyCacheNoLoad, function (c) {
            if (success) success(onlyCacheNoLoad ? chapter : c);
        }, function (error) {
            if (error.id == 207) {
                bookSourceManager.getChapter(self.id, chapter.link, function (chapter) {
                    if (success) success(chapter);

                    self.__cacheChapter(book, chapter, null, null);
                }, fail);
            } else {
                if (fail) fail(error);
            }
        });
    };

    BookSource.prototype.__getCacheChapterLocation = function (book, id) {
        var self = this;
        var bid = book.name + '.' + book.author;
        var chapterFileName = id + '.' + self.id;
        var dest = "chapter_" + bid + "_" + chapterFileName;
        return dest;
    };

    BookSource.prototype.__getCacheChapter = function (book, title, onlyCacheNoLoad, success, fail) {

        var self = this;
        var dest = self.__getCacheChapterLocation(book, title);

        if (onlyCacheNoLoad) {
            util.dataExists(dest, function () {
                if (success) success(null);
            }, function () {
                if (fail) fail(BookSource.getError(207));
            }, true);
            return;
        } else {
            util.loadData(dest, function (data) {
                if (data != null) {
                    if (success) {
                        var chapter = new Chapter();

                        chapter = $.extend(true, chapter, data);
                        success(chapter);
                    }
                } else {
                    if (fail) fail(BookSource.getError(207));
                }
            }, function () {
                if (fail) fail(BookSource.getError(207));
            }, true);
        }
    };

    BookSource.prototype.__cacheChapter = function (book, chapter, success, fail) {

        var self = this;

        var dest = self.__getCacheChapterLocation(book, chapter.title);
        util.saveData(dest, chapter, success, fail, true);
    };

    return BookSource;
});
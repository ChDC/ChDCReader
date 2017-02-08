"use strict";

define(["jquery", "util", 'Book', "BookSource", "ReadingRecord"], function ($, util, Book, BookSource, ReadingRecord) {
    "use strict";

    function BookShelf() {
        this.loaded = false;
        this.books = [];
    };
    BookShelf.prototype.books = undefined;

    BookShelf.prototype.__getSaveCatalogLocation = function (bookName, bookAuthor, sourceId) {
        var bid = bookName + '.' + bookAuthor;
        var dest = "catalog_" + bid + "_" + sourceId;
        return dest;
    };

    BookShelf.prototype.load = function (success, fail) {
        function s() {
            self.loaded = true;
            if (success) success();
        }
        function loadCatalogs() {
            var unfinished = [];
            function checkAllFinished() {
                for (var bk in self.books) {
                    var b = self.books[bk].book;
                    for (var bsk in b.sources) {
                        if (unfinished[bk][bsk]) {
                            return false;
                        }
                    }
                }
                return true;
            }
            function setFinished(bk, bsk) {
                unfinished[bk][bsk] = false;
            }
            function initUnfinished() {
                for (var bk in self.books) {
                    unfinished[bk] = {};
                    var b = self.books[bk].book;
                    for (var bsk in b.sources) {
                        unfinished[bk][bsk] = true;
                    }
                }
            }
            initUnfinished();

            function loadCatalog(bk, bsk) {
                var b = self.books[bk].book;
                var bs = b.sources[bsk];

                util.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk), function (data) {
                    bs.catalog = data;
                    setFinished(bk, bsk);
                    if (checkAllFinished()) s();
                }, function () {
                    setFinished(bk, bsk);
                    if (checkAllFinished()) s();
                });
            }

            for (var bk in self.books) {
                var b = self.books[bk].book;
                for (var bsk in b.sources) {
                    loadCatalog(bk, bsk);
                }
            }
        }

        var self = this;
        util.loadData("bookshelf", function (data) {
            var bookShelf = data;
            $.extend(true, self, bookShelf);
            $(self.books).each(function () {
                this.book = Book.Cast(this.book);
                this.readingRecord = util.objectCast(this.readingRecord, ReadingRecord);
            });
            loadCatalogs();
        }, fail);
    };

    BookShelf.prototype.save = function (success, fail) {
        var self = this;

        var catalogs = [];
        for (var bk in self.books) {
            catalogs[bk] = {};
            var b = self.books[bk].book;
            for (var bsk in b.sources) {
                var bs = b.sources[bsk];
                if (bs.needSaveCatalog) {
                    bs.needSaveCatalog = false;

                    util.saveData(self.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
                }
                catalogs[bk][bsk] = bs.catalog;
                bs.catalog = null;
            }
        }
        util.saveData("bookshelf", self, success, fail);

        for (var _bk in self.books) {
            var _b = self.books[_bk].book;
            for (var _bsk in _b.sources) {
                var _bs = _b.sources[_bsk];
                _bs.catalog = catalogs[_bk][_bsk];
            }
        }
    };

    BookShelf.prototype.addBook = function (book, success, fail) {
        if (!this.hasBook(book)) {
            this.books.push({
                book: book,
                readingRecord: new ReadingRecord()
            });
            this.save(success);
        }
    };

    BookShelf.prototype.hasBook = function (book) {
        var i = util.arrayIndex(this.books, book, function (e1, e2) {
            var b = e1.book;
            return b.name == e2.name && b.author == e2.author && b.mainSourceId == e2.mainSourceId;
        });
        if (i >= 0) return this.books[i];else return null;
    };

    BookShelf.prototype.removeBook = function (index, success, fail) {
        var self = this;

        var b = self.books[index].book;
        for (var bsk in b.sources) {
            var bs = b.sources[bsk];
            util.removeData(self.__getSaveCatalogLocation(b.name, b.author, bsk));
        }

        util.arrayRemove(self.books, index);

        self.save(success);
    };

    return BookShelf;
});
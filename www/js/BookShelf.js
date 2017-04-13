'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['co', "util", 'Book', "ReadingRecord"], function (co, util, Book, ReadingRecord) {
    "use strict";

    var BookShelf = function () {
        function BookShelf() {
            _classCallCheck(this, BookShelf);

            this.loaded = false;
            this.books = [];
        }

        _createClass(BookShelf, [{
            key: '__getSaveCatalogLocation',
            value: function __getSaveCatalogLocation(bookName, bookAuthor, sourceId) {
                return 'catalog_' + bookName + '.' + bookAuthor + '_' + sourceId;
            }
        }, {
            key: 'load',
            value: function load(bookSourceManager) {
                var _this = this;

                var self = this;

                function loadCatalog(bk, bsk) {

                    var b = self.books[bk].book;
                    var bs = b.sources[bsk];

                    util.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk)).then(function (data) {
                        bs.catalog = data;
                    }).catch(function (error) {
                        return error;
                    });
                }

                function loadCatalogs() {
                    var tasks = [];
                    for (var bk in self.books) {
                        var b = self.books[bk].book;
                        for (var bsk in b.sources) {
                            tasks.push(loadCatalog(bk, bsk));
                        }
                    }
                    return Promise.all(tasks);
                }

                return util.loadData("bookshelf").then(function (data) {
                    var bookShelf = data;
                    Object.assign(_this, bookShelf);
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = _this.books[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var b = _step.value;

                            b.book = Book.Cast(b.book, bookSourceManager);
                            b.readingRecord = util.objectCast(b.readingRecord, ReadingRecord);
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

                    return loadCatalogs();
                });
            }
        }, {
            key: 'save',
            value: function save() {
                for (var bk in this.books) {
                    var b = this.books[bk].book;
                    for (var bsk in b.sources) {
                        var bs = b.sources[bsk];
                        if (bs.needSaveCatalog) {
                            bs.needSaveCatalog = false;

                            util.saveData(this.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
                        }
                    }
                }

                return util.saveData("bookshelf", util.persistent(this));
            }
        }, {
            key: 'addBook',
            value: function addBook(book) {
                if (!this.hasBook(book)) {
                    this.books.push({
                        book: book,
                        readingRecord: new ReadingRecord()
                    });
                }
            }
        }, {
            key: 'hasBook',
            value: function hasBook(book) {
                return this.books.find(function (e) {
                    var b = e.book;
                    return b.name == book.name && b.author == book.author && b.mainSourceId == book.mainSourceId;
                });
            }
        }, {
            key: 'removeBook',
            value: function removeBook(index) {
                var b = this.books[index].book;
                for (var bsk in b.sources) {
                    var bs = b.sources[bsk];
                    util.removeData(this.__getSaveCatalogLocation(b.name, b.author, bsk));
                }

                util.arrayRemove(this.books, index);
            }
        }]);

        return BookShelf;
    }();

    BookShelf.persistentInclude = ["books"];

    return BookShelf;
});
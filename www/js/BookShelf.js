'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['co', "utils", 'Book', "Chapter", "ReadingRecord"], function (co, utils, Book, Chapter, ReadingRecord) {
  "use strict";

  var BookShelf = function () {
    function BookShelf() {
      _classCallCheck(this, BookShelf);

      this.__loaded = false;
      this.books = [];
    }

    _createClass(BookShelf, [{
      key: 'isLoaded',
      value: function isLoaded() {
        return this.__loaded;
      }
    }, {
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

          utils.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk)).then(function (data) {
            bs.catalog = utils.arrayCast(data, Chapter);
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
          return Promise.all(tasks).then(function () {
            self.__loaded = true;
          });
        }

        return utils.loadData("bookshelf").then(function (data) {
          var bookShelf = data;
          Object.assign(_this, bookShelf);
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = _this.books[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var b = _step.value;

              b.book = Book.Cast(b.book, bookSourceManager);
              b.readingRecord = utils.objectCast(b.readingRecord, ReadingRecord);
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

              utils.saveData(this.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
            }
          }
        }
        return utils.saveTextData("bookshelf", utils.persistent(this));
      }
    }, {
      key: 'addBook',
      value: function addBook(book, readingRecord) {
        if (!this.hasBook(book)) {
          this.books.unshift({
            book: book,
            readingRecord: readingRecord || new ReadingRecord(),
            lockLocation: -1 });
          this.sortBooks();
        }
      }
    }, {
      key: 'toggleLockBook',
      value: function toggleLockBook(bookshelfitem) {
        if (this.isLockedBook(bookshelfitem)) bookshelfitem.lockLocation = -1;else bookshelfitem.lockLocation = this.books.indexOf(bookshelfitem);
      }
    }, {
      key: 'isLockedBook',
      value: function isLockedBook(bookshelfitem) {
        return bookshelfitem.lockLocation >= 0;
      }
    }, {
      key: 'sortBooks',
      value: function sortBooks(functionOrArray) {
        var _this2 = this;

        var newOrder = void 0;
        switch (utils.type(functionOrArray)) {
          case "function":
            newOrder = Object.assign([], this.books);
            newOrder.sort(functionOrArray);
            break;

          case "array":
            if (!functionOrArray.every(function (e) {
              return _this2.books.indexOf(e) >= 0;
            })) return false;
            newOrder = functionOrArray;
            break;

          default:
            newOrder = this.books;
            break;
        }

        var lockedItems = this.books.filter(function (e) {
          return _this2.isLockedBook(e);
        });
        var result = newOrder.filter(function (e) {
          return !_this2.isLockedBook(e);
        });
        lockedItems.forEach(function (e) {
          if (e.lockLocation >= _this2.books.length) e.lockLocation = _this2.books.length - 1;
          result.splice(e.lockLocation, 0, e);
        });
        this.books = result;
        return true;
      }
    }, {
      key: 'hasBook',
      value: function hasBook(book) {
        if (!book) return book;
        return this.books.find(function (e) {
          var b = e.book;
          return b.name == book.name && b.author == book.author && b.mainSourceId == book.mainSourceId;
        });
      }
    }, {
      key: 'removeBook',
      value: function removeBook(book) {
        var index = this.books.findIndex(function (e) {
          return e.book == book;
        });
        if (index < 0) return;

        for (var bsk in book.sources) {
          var bs = book.sources[bsk];
          utils.removeData(this.__getSaveCatalogLocation(book.name, book.author, bsk));
        }
        this.books.splice(index, 1);
        this.sortBooks();
      }
    }]);

    return BookShelf;
  }();

  BookShelf.persistentInclude = ["books"];

  return BookShelf;
});
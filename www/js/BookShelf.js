"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["BookShelf"] = factory();
})(['co', "utils", 'Book', "Chapter", "ReadingRecord"], function (co, utils, Book, Chapter, ReadingRecord) {
  "use strict";

  var BookShelf = function () {
    function BookShelf() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "bookshelf";

      _classCallCheck(this, BookShelf);

      this.name = name;
      this.books = [];


      utils.addEventSupport(this);
    }

    _createClass(BookShelf, [{
      key: "__getSaveCatalogLocation",
      value: function __getSaveCatalogLocation(bookName, bookAuthor, sourceId) {
        return "catalog_" + bookName + "." + bookAuthor + "_" + sourceId;
      }
    }, {
      key: "load",
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
          return Promise.all(tasks);
        }

        return utils.loadData(this.name).then(function (data) {
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
        }).then(function () {
          return _this.fireEvent("loadedData");
        });
      }
    }, {
      key: "save",
      value: function save() {
        var _this2 = this;

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
        return utils.saveTextData(this.name, utils.persistent(this)).then(function () {
          return _this2.fireEvent("savedData");
        });
      }
    }, {
      key: "newBookShelfItem",
      value: function newBookShelfItem(book, readingRecord) {
        return {
          book: book,
          readingRecord: readingRecord || new ReadingRecord(),
          lockLocation: -1 };
      }
    }, {
      key: "addBook",
      value: function addBook(book, readingRecord) {
        if (!this.hasBook(book)) {
          var newItem = this.newBookShelfItem(book, readingRecord);
          this.books.unshift(newItem);
          this.sortBooks();
          this.fireEvent("addedBook", { bookShelfItem: newItem });
        }
      }
    }, {
      key: "toggleLockBook",
      value: function toggleLockBook(bookshelfitem) {
        if (this.isLockedBook(bookshelfitem)) bookshelfitem.lockLocation = -1;else bookshelfitem.lockLocation = this.books.indexOf(bookshelfitem);
      }
    }, {
      key: "isLockedBook",
      value: function isLockedBook(bookshelfitem) {
        return bookshelfitem.lockLocation >= 0;
      }
    }, {
      key: "sortBooks",
      value: function sortBooks(functionOrArray) {
        var _this3 = this;

        var newOrder = void 0;
        switch (utils.type(functionOrArray)) {
          case "function":
            newOrder = Object.assign([], this.books);
            newOrder.sort(functionOrArray);
            break;

          case "array":
            if (!functionOrArray.every(function (e) {
              return _this3.books.indexOf(e) >= 0;
            })) return false;
            newOrder = functionOrArray;
            break;

          default:
            newOrder = this.books;
            break;
        }

        var lockedItems = this.books.filter(function (e) {
          return _this3.isLockedBook(e);
        });
        var result = newOrder.filter(function (e) {
          return !_this3.isLockedBook(e);
        });
        lockedItems.forEach(function (e) {
          if (e.lockLocation >= _this3.books.length) e.lockLocation = _this3.books.length - 1;
          result.splice(e.lockLocation, 0, e);
        });
        this.books = result;
        this.fireEvent("sortedBook");
        return true;
      }
    }, {
      key: "hasBook",
      value: function hasBook(book) {
        if (!book) return book;
        return this.books.find(function (e) {
          var b = e.book;
          return b.name == book.name && b.author == book.author && b.mainSourceId == book.mainSourceId;
        });
      }
    }, {
      key: "removeBook",
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

        this.fireEvent("removedBook", { book: book });
      }
    }]);

    return BookShelf;
  }();

  BookShelf.persistentInclude = ["books"];

  return BookShelf;
});
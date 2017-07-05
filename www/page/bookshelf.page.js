"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "utils", "uiutils", 'Chapter', 'sortablejs'], function ($, app, Page, utils, uiutils, Chapter, sortablejs) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      return _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).apply(this, arguments));
    }

    _createClass(MyPage, [{
      key: "onLoad",
      value: function onLoad(_ref) {
        var _this2 = this;

        var params = _ref.params;

        this.loadView();
        this.loaded = false;

        this.bookShelf = app.bookShelf;
        this.bookTemplateElement;
        this.bookShelfElement;
        this.modalFinishedBooks;
        this.finishedBookShelfElement;
        this.bookShelf.addEventListener("addedBook", function (e) {
          _this2.addBook(e.bookShelfItem);
          _this2.refreshBooksOrder(_this2.bookShelf);
        });

        this.container = $('.container');
      }
    }, {
      key: "onPause",
      value: function onPause() {
        this.modalFinishedBooks.modal('hide');
        app.settings.settings.scrollTop.bookshelf = this.container.scrollTop();
        app.settings.save();
      }
    }, {
      key: "onResume",
      value: function onResume() {
        var _this3 = this;

        if (!this.loaded) this.bookShelf.load(app.bookSourceManager).then(function () {
          _this3.loaded = true;
          _this3.loadBooks(_this3.bookShelf);
          _this3.container.scrollTop(app.settings.settings.scrollTop.bookshelf || 0);
        });else {
          this.refreshBooksOwner();
          this.refreshAllReadingRecord();
          this.container.scrollTop(app.settings.settings.scrollTop.bookshelf || 0);
        }
      }
    }, {
      key: "removeBook",
      value: function removeBook(book) {
        var _this4 = this;

        uiutils.showMessageDialog("确定", "确定要删除该书？", function () {
          _this4.bookShelf.removeBook(book);
          _this4.refreshBooksOrder(_this4.bookShelf);
          _this4.bookShelf.save().then(function () {
            uiutils.showMessage("删除成功！");
          }).catch(function (error) {
            uiutils.showError("删除失败！");
          });
        });
        return false;
      }
    }, {
      key: "refreshBooksOrder",
      value: function refreshBooksOrder(bookShelf) {
        var books = bookShelf.books;

        [this.bookShelfElement, this.finishedBookShelfElement].forEach(function (bookShelfElement) {
          var newOrders = [];
          Array.from(bookShelfElement.children()).forEach(function (e) {
            var i = books.indexOf($(e).data("bookshelfitem"));
            if (i < 0) e.remove();else newOrders.push(e);
          });
          newOrders.sort(function (e1, e2) {
            return books.indexOf($(e1).data("bookshelfitem")) - books.indexOf($(e2).data("bookshelfitem"));
          });
          bookShelfElement.append(newOrders);
        });
      }
    }, {
      key: "addBook",
      value: function addBook(bookshelfitem) {
        var _this5 = this;

        var readingRecord = bookshelfitem.readingRecord;
        var book = bookshelfitem.book;
        var nb = this.bookTemplateElement.clone();

        nb.data("bookshelfitem", bookshelfitem);

        if (book.cover) {
          var img = new Image();
          img.src = book.cover;
          img.onload = function (e) {
            nb.find(".book-cover").attr("src", book.cover);
          };
        }
        nb.find(".book-name").text(book.name).addClass("type-" + app.bookSourceManager.getBookSourceType(book.mainSourceId));

        uiutils.onLongPress(nb.find(".book-cover"), function (e) {
          var bm = $("#modalBookMenu");
          bm.modal("show");
          bm.find(".modal-title").text(book.name);
          bm.find(".btnDetail")[0].onclick = function (e) {
            bm.modal("hide");
            app.page.showPage("bookdetail", { book: book });
          };
          bm.find(".btnRemoveBook")[0].onclick = function (e) {
            bm.modal("hide");
            _this5.removeBook(book);
          };
        }).on("click", function (e) {
          app.page.showPage("readbook", { book: bookshelfitem.book, readingRecord: bookshelfitem.readingRecord });
        });

        if (readingRecord.isFinished) this.addBookElementToFinishedBookShelf(nb, true);else this.addBookElementToBookShelf(nb, true);
      }
    }, {
      key: "refreshAllReadingRecord",
      value: function refreshAllReadingRecord() {
        var _this6 = this;

        Array.from(this.finishedBookShelfElement.children()).forEach(function (e) {
          return _this6.refreshReadingRecord($(e));
        });
      }
    }, {
      key: "refreshReadingRecord",
      value: function refreshReadingRecord(bookElement) {
        var _this7 = this;

        var bookshelfitem = bookElement.data("bookshelfitem");
        if (!bookshelfitem) throw new Error("empty illegal bookshelfitem");

        var readingRecord = bookshelfitem.readingRecord;

        var book = bookshelfitem.book;

        book.getLastestChapter().then(function (_ref2) {
          var _ref3 = _slicedToArray(_ref2, 1),
              lastestChapter = _ref3[0];

          var isNewChapter = lastestChapter && !readingRecord.equalChapterTitle(lastestChapter);

          if (readingRecord.isFinished && isNewChapter) {
            _this7.addBookElementToBookShelf(bookElement);

            book.getChapterIndex(lastestChapter).then(function (index) {
              return index < 0;
            }).then(function (forceRefresh) {
              readingRecord.setNextChapter(book, forceRefresh);

              book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount, { forceRefresh: forceRefresh });
            });
          }
        });
      }
    }, {
      key: "addBookElementToFinishedBookShelf",
      value: function addBookElementToFinishedBookShelf(bookElement) {
        var append = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        bookElement = $(bookElement);

        bookElement.detach();

        if (append) this.finishedBookShelfElement.append(bookElement);else this.finishedBookShelfElement.prepend(bookElement);
      }
    }, {
      key: "addBookElementToBookShelf",
      value: function addBookElementToBookShelf(bookElement) {
        var append = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        bookElement = $(bookElement);

        bookElement.detach();

        if (append) this.bookShelfElement.append(bookElement);else this.bookShelfElement.prepend(bookElement);
      }
    }, {
      key: "refreshBooksOwner",
      value: function refreshBooksOwner() {
        var _this8 = this;

        Array.from(this.bookShelfElement.children()).forEach(function (bookElement) {
          return $(bookElement).data("bookshelfitem").readingRecord.isFinished && _this8.addBookElementToFinishedBookShelf(bookElement);
        });
        Array.from(this.finishedBookShelfElement.children()).forEach(function (bookElement) {
          return !$(bookElement).data("bookshelfitem").readingRecord.isFinished && _this8.addBookElementToBookShelf(bookElement);
        });
      }
    }, {
      key: "loadBooks",
      value: function loadBooks(bookShelf) {
        var books = bookShelf.books;

        books.forEach(this.addBook.bind(this));
        this.refreshBooksOwner();
        this.refreshAllReadingRecord();
      }
    }, {
      key: "sortBooksByElementOrder",
      value: function sortBooksByElementOrder() {
        var elements = this.bookShelfElement.children();
        var newBooks = Array.from(elements).map(function (e) {
          return $(e).data('bookshelfitem');
        });
        this.bookShelf.sortBooks(newBooks);
        this.bookShelf.save();
        this.refreshBooksOrder(this.bookShelf);
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this9 = this;

        this.modalFinishedBooks = $("#modalFinishedBooks");
        this.bookTemplateElement = $(".template .book");
        this.bookShelfElement = $("#bookshelf");
        this.finishedBookShelfElement = $("#finishedBookshelf");

        sortablejs.create(this.bookShelfElement[0], {
          animation: 150,
          handle: ".book-name",
          draggable: ".book",
          onUpdate: function onUpdate(event) {
            _this9.sortBooksByElementOrder();
          }
        });

        $("#btnCheckUpdate").click(function (e) {
          return app.chekcUpdate(true, true);
        });
        $("#btnSearch").click(function (e) {
          return app.page.showPage("search");
        });
        $("#btnExplore").click(function (e) {
          return app.page.showPage("explorebook");
        });
        $("#btnToggleNightMode > a").text(app.theme.isNight() ? "白天模式" : "夜间模式");
        $("#btnToggleNightMode").click(function (e) {
          app.theme.toggleNight();
          $("#btnToggleNightMode > a").text(app.theme.isNight() ? "白天模式" : "夜间模式");
        });
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
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
        this.bookShelf.addEventListener("addedBook", function (e) {
          _this2.addBook(e.bookShelfItem);
          _this2.refreshBooksOrder(_this2.bookShelf);
        });
      }
    }, {
      key: "onResume",
      value: function onResume() {
        var _this3 = this;

        if (!this.loaded) this.bookShelf.load(app.bookSourceManager).then(function () {
          _this3.loaded = true;
          _this3.loadBooks(_this3.bookShelf);
        });else this.refreshAllReadingRecord();
      }
    }, {
      key: "onDeviceResume",
      value: function onDeviceResume() {
        this.onResume();
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
        var newOrders = [];
        var children = this.bookShelfElement.children();
        Array.from(children).forEach(function (e) {
          var i = books.indexOf($(e).data("bookshelfitem"));
          newOrders[i] = e;
        });
        children.detach();
        this.bookShelfElement.append(newOrders);
      }
    }, {
      key: "addBook",
      value: function addBook(bookshelfitem) {
        var _this5 = this;

        var readingRecord = bookshelfitem.readingRecord;
        var book = bookshelfitem.book;
        var nb = this.bookTemplateElement.clone();

        nb.data("bookshelfitem", bookshelfitem);

        if (book.cover) nb.find(".book-cover").attr("src", book.cover);
        nb.find(".book-name").text(book.name).addClass("type-" + app.bookSourceManager.getBookSource(book.mainSourceId).type);

        nb.find('.book-cover, .book-info').click(function () {
          return app.page.showPage("readbook", { book: bookshelfitem.book, readingRecord: bookshelfitem.readingRecord });
        });

        nb.find('.btnBookMenu').click(function (event) {
          $(event.currentTarget).dropdown();
          return false;
        }).dropdown();

        nb.find('.btnDetail').click(function (e) {
          return app.page.showPage("bookdetail", { book: bookshelfitem.book });
        });
        nb.find('.btnRemoveBook').click(function (e) {
          return _this5.removeBook(book);
        });
        nb.find('.btnLockLocation').click(function (e) {
          _this5.bookShelf.toggleLockBook(bookshelfitem);
          $(e.currentTarget).find('a').text(_this5.bookShelf.isLockedBook(bookshelfitem) ? "解锁位置" : "锁定位置");
          _this5.bookShelf.save();
        });
        nb.find('.btnLockLocation > a').text(this.bookShelf.isLockedBook(bookshelfitem) ? "解锁位置" : "锁定位置");
        this.bookShelfElement.append(nb);
      }
    }, {
      key: "refreshAllReadingRecord",
      value: function refreshAllReadingRecord() {
        var _this6 = this;

        Array.from(this.bookShelfElement.children()).forEach(function (e) {
          return _this6.refreshReadingRecord($(e));
        });
      }
    }, {
      key: "refreshReadingRecord",
      value: function refreshReadingRecord(bookElement) {
        var bookshelfitem = bookElement.data("bookshelfitem");
        if (!bookshelfitem) throw new Error("empty illegal bookshelfitem");

        var readingRecord = bookshelfitem.readingRecord;
        var book = bookshelfitem.book;
        bookElement.find(".book-readingchapter").text(readingRecord.getReadingRecordStatus());

        book.getLastestChapter().then(function (_ref2) {
          var _ref3 = _slicedToArray(_ref2, 1),
              lastestChapter = _ref3[0];

          var isNewChapter = !readingRecord.equalChapterTitle(lastestChapter);
          var lce = bookElement.find(".book-lastestchapter").text("最新：" + (lastestChapter ? lastestChapter : "无"));
          if (isNewChapter) lce.addClass('unread-chapter');else lce.removeClass('unread-chapter');

          if (readingRecord.isFinished && isNewChapter) {
            book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount);
          }
        });
      }
    }, {
      key: "loadBooks",
      value: function loadBooks(bookShelf) {
        var books = bookShelf.books;
        this.bookShelfElement.empty();
        books.forEach(this.addBook.bind(this));
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
        var _this7 = this;

        this.bookTemplateElement = $(".template .book");
        this.bookShelfElement = $("#bookshelf");
        sortablejs.create(this.bookShelfElement[0], {
          handle: ".btnBookMenu",
          animation: 150,

          onUpdate: function onUpdate(event) {
            _this7.sortBooksByElementOrder();
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
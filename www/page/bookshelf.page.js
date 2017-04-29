"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "util", "uiutil", 'Chapter', 'sortablejs'], function ($, app, Page, util, uiutil, Chapter, sortablejs) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      return _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).apply(this, arguments));
    }

    _createClass(MyPage, [{
      key: "onLoad",
      value: function onLoad(params) {
        this.loadView();
      }
    }, {
      key: "onResume",
      value: function onResume() {
        var _this2 = this;

        if (app.bookShelf.isLoaded()) this.loadBooks(".bookshelf", app.bookShelf);else app.bookShelf.load(app.bookSourceManager).then(function () {
          return _this2.loadBooks(".bookshelf", app.bookShelf);
        });
      }
    }, {
      key: "onDeviceResume",
      value: function onDeviceResume() {
        this.onResume();
      }
    }, {
      key: "removeBook",
      value: function removeBook(book) {
        var _this3 = this;

        uiutil.showMessageDialog("确定", "确定要删除该书？", function () {
          var target = $(event.currentTarget);
          app.bookShelf.removeBook(book);
          _this3.refreshBooksOrder(".bookshelf", app.bookShelf);
          app.bookShelf.save().then(function () {
            uiutil.showMessage("删除成功！");
          }).catch(function (error) {
            uiutil.showError("删除失败！");
          });
        });
        return false;
      }
    }, {
      key: "refreshBooksOrder",
      value: function refreshBooksOrder(id, bookShelf) {
        var books = bookShelf.books;
        var bs = $(id);
        var newOrders = [];
        var children = bs.children();
        Array.from(children).forEach(function (e) {
          var i = books.indexOf($(e).data("bookshelfitem"));
          newOrders[i] = e;
        });
        children.detach();
        bs.append(newOrders);
      }
    }, {
      key: "loadBooks",
      value: function loadBooks(id, bookShelf) {
        var _this4 = this;

        var books = bookShelf.books;
        var bs = $(id);
        bs.empty();
        var b = $(".template .book");

        books.forEach(function (value) {
          var readingRecord = value.readingRecord;
          var book = value.book;

          var nb = b.clone();
          nb.data("bookshelfitem", value);
          if (book.cover) nb.find(".book-cover").attr("src", book.cover);
          nb.find(".book-name").text(book.name).addClass("type-" + app.bookSourceManager.getBookSource(book.mainSourceId).type);
          nb.find(".book-readingchapter").text(readingRecord.getReadingRecordStatus());

          book.getLastestChapter().then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 1),
                lastestChapter = _ref2[0];

            nb.find(".book-lastestchapter").text("最新：" + (lastestChapter ? lastestChapter : "无")).addClass(readingRecord.equalChapterTitle(lastestChapter) ? "" : 'unread-chapter');

            book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount);
          });

          nb.find('.book-cover, .book-info').click(function () {
            return app.page.showPage("readbook", { book: value.book, readingRecord: value.readingRecord });
          });

          nb.find('.btnBookMenu').click(function (event) {
            $(event.currentTarget).dropdown();
            return false;
          }).dropdown();

          nb.find('.btnDetail').click(function (e) {
            return app.page.showPage("bookdetail", { book: value.book });
          });
          nb.find('.btnRemoveBook').click(function (e) {
            return _this4.removeBook(book);
          });
          nb.find('.btnLockLocation').click(function (e) {
            app.bookShelf.toggleLockBook(value);
            nb.find('.btnLockLocation > a').text(app.bookShelf.isLockedBook(value) ? "解锁位置" : "锁定位置");
            app.bookShelf.save();
          });
          nb.find('.btnLockLocation > a').text(app.bookShelf.isLockedBook(value) ? "解锁位置" : "锁定位置");
          bs.append(nb);
        });
      }
    }, {
      key: "sortBooksByElementOrder",
      value: function sortBooksByElementOrder() {
        var elements = $(".bookshelf").children();
        var newBooks = Array.from(elements).map(function (e) {
          return $(e).data('bookshelfitem');
        });
        app.bookShelf.sortBooks(newBooks);
        app.bookShelf.save();
        this.refreshBooksOrder(".bookshelf", app.bookShelf);
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this5 = this;

        sortablejs.create($(".bookshelf")[0], {
          handle: ".btnBookMenu",
          animation: 150,

          onUpdate: function onUpdate(event) {
            _this5.sortBooksByElementOrder();
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
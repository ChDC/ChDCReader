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

        if (app.bookShelf.loaded) {
          this.loadBooks(".bookshelf", app.bookShelf);
        } else {
          app.bookShelf.load(app.bookSourceManager).then(function () {
            return _this2.loadBooks(".bookshelf", app.bookShelf);
          });
        }
      }
    }, {
      key: "onDeviceResume",
      value: function onDeviceResume() {
        console.log("Refresh bookshelf on DeviceResume");
        this.onResume();
      }
    }, {
      key: "isReadingLastestChapter",
      value: function isReadingLastestChapter(lastestChapter, readingRecord) {
        return Chapter.equalTitle2(lastestChapter, readingRecord.chapterTitle);
      }
    }, {
      key: "removeBook",
      value: function removeBook(event) {
        var _this3 = this;

        var target = $(event.currentTarget);
        var i = target.data('book-index');
        app.bookShelf.removeBook(i);
        app.bookShelf.save().then(function () {
          uiutil.showMessage("删除成功！");
          _this3.loadBooks(".bookshelf", app.bookShelf);
        }).catch(function (error) {
          uiutil.showError("删除失败！");
          _this3.loadBooks(".bookshelf", app.bookShelf);
        });
        return false;
      }
    }, {
      key: "loadBooks",
      value: function loadBooks(id, bookShelf) {
        var _this4 = this;

        var books = bookShelf.books;
        var bs = $(id);
        bs.empty();
        var b = $(".template .book");

        books.forEach(function (value, i) {
          var readingRecord = value.readingRecord;
          var book = value.book;

          var nb = b.clone();
          if (book.cover) nb.find(".book-cover").attr("src", book.cover);
          nb.find(".book-name").text(book.name);
          nb.find(".book-readingchapter").text('读到：' + readingRecord.chapterTitle);

          book.getLastestChapter().then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 1),
                lastestChapter = _ref2[0];

            nb.find(".book-lastestchapter").text("最新：" + (lastestChapter ? lastestChapter : "无")).css('color', _this4.isReadingLastestChapter(lastestChapter, readingRecord) ? null : 'red');

            book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount);
          });

          nb.find('.book-cover, .book-info').click(function () {
            return app.page.showPage("readbook", value);
          });

          nb.find('.btnBookMenu').click(function (event) {
            $(event.currentTarget).dropdown();
            return false;
          }).dropdown();

          nb.data('book-index', i);

          nb.find('.btnRemoveBook').click(_this4.removeBook.bind(_this4)).data('book-index', i);
          bs.append(nb);
        });
      }
    }, {
      key: "sortBooksByElementOrde",
      value: function sortBooksByElementOrde() {
        var newBooks = [];
        var elements = $(".bookshelf").children();
        var length = elements.length;

        for (var i = 0; i < length; i++) {
          newBooks[i] = app.bookShelf.books[$(elements[i]).data('book-index')];
        }
        if (newBooks.length == app.bookShelf.books.length) app.bookShelf.books = newBooks;
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this5 = this;

        sortablejs.create($(".bookshelf")[0], {
          handle: ".btnBookMenu",
          animation: 150,

          onUpdate: function onUpdate(event) {
            _this5.sortBooksByElementOrde();
          }
        });
        $("#btnCheckUpdate").click(function (e) {
          return app.chekcUpdate(true, true);
        });
        $(".btnSearch").click(function (e) {
          return app.page.showPage("search");
        });
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
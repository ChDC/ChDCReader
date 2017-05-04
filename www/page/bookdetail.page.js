"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "utils", "uiutils", "ReadingRecord", "uifactory"], function ($, app, Page, utils, uiutils, ReadingRecord, uifactory) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      var _this = _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).call(this));

      _this.buildCatalogView = uifactory.buildCatalogView.bind(_this);
      return _this;
    }

    _createClass(MyPage, [{
      key: "onLoad",
      value: function onLoad(_ref) {
        var params = _ref.params;

        this.book = params.book;
        this.loadView();
      }
    }, {
      key: "readbookpageclose",
      value: function readbookpageclose(_ref2) {
        var params = _ref2.params;

        if (app.bookShelf.hasBook(this.book)) app.page.showPage("bookshelf");
      }
    }, {
      key: "loadBookDetail",
      value: function loadBookDetail() {
        var _this2 = this;

        var book = this.book;
        if (book.cover) $("#book-cover").attr("src", book.cover);
        $("#book-name").text(book.name).click(function (e) {
          return window.open(_this2.book.getOfficialDetailLink(), '_system');
        });
        $("#book-author").text(book.author);
        $("#book-catagory").text(book.catagory);
        $("#book-complete").text(book.complete ? "完结" : "连载中");
        $("#book-introduce").text(book.introduce);

        $("#btnRead").click(function (e) {
          return app.page.showPage("readbook", { book: book }).then(function (page) {
            page.addEventListener('myclose', _this2.readbookpageclose.bind(_this2));
          });
        });

        if (app.bookShelf.hasBook(book)) $("#btnAddToBookshelf").hide();else {
          $("#btnAddToBookshelf").click(function (e) {
            app.bookShelf.addBook(book);

            $(event.currentTarget).attr("disabled", "disabled");
            app.bookShelf.save().then(function () {
              uiutils.showMessage("添加成功！");
              book.checkBookSources();

              book.cacheChapter(0, app.settings.settings.cacheChapterCount);
            }).catch(function (error) {
              $(event.currentTarget).removeAttr("disabled");
            });
          });
        }
      }
    }, {
      key: "loadBookChapters",
      value: function loadBookChapters(id) {
        var _this3 = this;

        this.bookChapterList.empty();
        this.book.getCatalog({ groupByVolume: true }).then(function (catalog) {
          _this3.bookChapterList.append(_this3.buildCatalogView(catalog, function (e) {
            var chapter = $(e.currentTarget).data("chapter");
            app.page.showPage("readbook", {
              book: _this3.book,
              readingRecord: new ReadingRecord({ chapterIndex: chapter.index, chapterTitle: chapter.title })
            }).then(function (page) {
              page.addEventListener('myclose', _this3.readbookpageclose.bind(_this3));
            });
          }, "#book-chapters"));
        }).catch(function (error) {
          return uiutils.showError(app.error.getMessage(error));
        });
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this4 = this;

        this.bookChapterList = $('#book-chapters');
        this.loadBookDetail();
        this.loadBookChapters();
        $('#btnClose').click(function (e) {
          return _this4.close();
        });
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "utils", "uiutils", 'mylib/infinitelist', "ReadingRecord"], function ($, app, Page, utils, uiutils, Infinitelist, ReadingRecord) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      var _this = _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).call(this));

      _this.book = null;
      _this.readingRecord = null;
      _this.chapterList = null;
      _this.isNewBook = true;return _this;
    }

    _createClass(MyPage, [{
      key: "onClose",
      value: function onClose() {
        var _this2 = this;

        this.chapterList.close();

        if (this.isNewBook) {
          if (!app.bookShelf.hasBook(this.book)) {
            uiutils.showMessageDialog("加入书架", "\u662F\u5426\u5C06 " + this.book.name + " \u52A0\u5165\u4E66\u67B6\uFF1F", function () {
              app.bookShelf.addBook(_this2.book, _this2.readingRecord);
              app.bookShelf.save().then(function () {
                uiutils.showMessage("添加成功！");
                _this2.fireEvent("myclose");
              });
            }, function () {
              _this2.fireEvent("myclose");
            });
          } else {
            this.fireEvent("myclose");
          }
        }
      }
    }, {
      key: "onLoad",
      value: function onLoad(params) {
        var bookAndReadRecordInBookShelf = app.bookShelf.hasBook(params.book);
        if (bookAndReadRecordInBookShelf) {
          this.book = bookAndReadRecordInBookShelf.book;
          this.readingRecord = bookAndReadRecordInBookShelf.readingRecord;
          this.isNewBook = false;
        } else {
          this.book = params.book;
          this.readingRecord = params.readingRecord || new ReadingRecord();
        }

        this.book.checkBookSources();
        this.loadView();
        this.refreshChapterList();
      }
    }, {
      key: "onPause",
      value: function onPause() {
        this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
        app.bookShelf.save();
      }
    }, {
      key: "onDevicePause",
      value: function onDevicePause() {
        this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this3 = this;

        $("#chapterContainer").on("click", function (event) {
          $('.toolbar').toggle();
        });
        $(".toolbar").blur(function (e) {
          return $('.toolbar').hide();
        });
        $(".toolbar").click(function (e) {
          return $('.toolbar').hide();
        });

        $("#btnNext").click(this.nextChapter.bind(this));
        $("#btnLast").click(this.previousChapter.bind(this));

        $("#btnClose").click(function (e) {
          return app.page.closePage();
        });

        $("#btnCatalog").click(function (e) {
          return _this3.loadCatalog();
        });
        $("#labelNight").text(app.theme.isNight() ? "白天" : "夜间");

        $("#btnToggleNight").click(function (e) {

          app.theme.toggleNight();
          $("#labelNight").text(app.theme.isNight() ? "白天" : "夜间");
        });
        $("#btnBadChapter").click(function (e) {
          _this3.refreshChapterList({
            excludes: [_this3.readingRecord.options.contentSourceId]
          });
        });
        $("#btnRefresh").click(function (e) {
          _this3.refreshChapterList();
        });
        $("#btnSortReversed").click(function (e) {
          var list = $('#listCatalog');
          list.append(list.children().toArray().reverse());
        });

        $("#btnChangeMainSource").click(function () {
          $("#modalBookSource").modal('show');
          _this3.loadBookSource();
        });
        $("#btnChangeContentSource").click(function () {
          $("#modalBookSource").modal('show');
          _this3.loadBookSource(true);
        });
        $('#modalCatalog').on('shown.bs.modal', function (e) {
          var targetChapter = $('#listCatalog > [data-index=' + _this3.readingRecord.chapterIndex + ']');
          if (targetChapter && targetChapter.length > 0) {
            var top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
            $('#listCatalogContainer').scrollTop(top);
          }
        });
        $('#btnBookDetail').click(function (e) {
          return app.page.showPage("bookdetail", { book: _this3.book });
        });
        $(".labelMainSource").text(app.bookSourceManager.getBookSource(this.book.mainSourceId).name).click(function (e) {
          return window.open(_this3.book.getOfficialDetailLink(), '_system');
        });
        $("#btnRefreshCatalog").click(function () {
          return _this3.loadCatalog(true);
        });
        if (this.isNewBook) {
          $("#btnAddtoBookShelf").show().click(function (e) {
            app.bookShelf.addBook(_this3.book, _this3.readingRecord);
            $(event.currentTarget).css("display", "none");
            app.bookShelf.save().then(function () {
              uiutils.showMessage("添加成功！");
            }).catch(function (error) {
              $(event.currentTarget).css("display", "block");
            });
          });
        }
        $('#chapterContainer').on("scroll", function (e) {
          $(".labelChatperPercent").text(parseInt(_this3.chapterList.getScrollRate() * 100) + " %");
        });
      }
    }, {
      key: "loadBookSource",
      value: function loadBookSource() {
        var _this4 = this;

        var changeContentSource = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


        var sources = !changeContentSource ? this.book.getSourcesKeysByMainSourceWeight() : this.book.getSourcesKeysSortedByWeight();
        var currentSourceId = changeContentSource ? this.readingRecord.options.contentSourceId : this.book.mainSourceId;
        $('#modalBookSourceLabel').text(changeContentSource ? "更换内容源" : "更换目录源");
        var changeContentSourceClickEvent = function changeContentSourceClickEvent(event) {
          var target = event.currentTarget;
          if (!target) return;
          var bid = $(target).data('bsid');

          _this4.readingRecord.options.contentSourceId = bid;
          _this4.readingRecord.options.contentSourceChapterIndex = null;

          _this4.refreshChapterList();
        };

        var changeCatalogSourceClickEvent = function changeCatalogSourceClickEvent(event) {
          var target = event.currentTarget;
          if (!target) return;
          var bid = $(target).data('bsid');
          var oldMainSource = currentSourceId;

          _this4.book.setMainSourceId(bid).then(function (book) {
            return app.bookShelf.save();
          }).catch(function (error) {
            return uiutils.showError(app.error.getMessage(error));
          });

          $("#modalCatalog").modal('hide');

          $(".labelMainSource").text(app.bookSourceManager.getBookSource(_this4.book.mainSourceId).name);

          if (_this4.readingRecord.chapterIndex) {
            _this4.book.fuzzySearch(_this4.book.mainSourceId, _this4.readingRecord.getChapterIndex(), undefined, oldMainSource).then(function (_ref) {
              var chapter = _ref.chapter,
                  index = _ref.index;

              _this4.readingRecord.setReadingRecord(index, chapter.title, {});
              _this4.refreshChapterList();
            }).catch(function (error) {
              _this4.readingRecord.reset();
              _this4.refreshChapterList();
            });
          } else {
            _this4.refreshChapterList();
          }

          _this4.book.refreshBookInfo();
        };

        var nlbseClickEvent = changeContentSource ? changeContentSourceClickEvent : changeCatalogSourceClickEvent;

        var listBookSource = $("#listBookSource");
        listBookSource.empty();
        var listBookSourceEntry = $(".template .listBookSourceEntry");
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = sources[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var bsk = _step.value;

            if (bsk == currentSourceId) continue;
            var nlbse = listBookSourceEntry.clone();
            nlbse.text(app.bookSourceManager.getBookSource(bsk).name);
            nlbse.data("bsid", bsk);
            nlbse.click(nlbseClickEvent.bind(this));
            listBookSource.append(nlbse);
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

        ;
      }
    }, {
      key: "loadCatalog",
      value: function loadCatalog(forceRefresh) {
        var _this5 = this;

        var listCatalogEntryClick = function listCatalogEntryClick(event) {
          var target = event.currentTarget;
          if (!target) return;

          target = $(target);
          var chapterIndex = parseInt(target.attr('data-index'));
          _this5.readingRecord.setReadingRecord(chapterIndex, "", {});
          _this5.refreshChapterList();
        };

        app.showLoading();
        $('#listCatalogContainer').height($(window).height() * 0.5);

        return this.book.getCatalog(forceRefresh).then(function (catalog) {
          var listCatalog = $("#listCatalog");
          var listCatalogEntry = $(".template .listCatalogEntry");
          listCatalog.empty();
          catalog.forEach(function (value, i) {
            var lce = listCatalogEntry.clone();
            lce.text(value.title);

            lce.attr("data-index", i);
            lce.click(listCatalogEntryClick.bind(_this5));
            listCatalog.append(lce);
            if (i == _this5.readingRecord.chapterIndex) lce.addClass("current-chapter");else if (value.isVIP()) lce.addClass("vip-chapter");
          });
          app.hideLoading();
        }).catch(function (error) {
          uiutils.showError(app.error.getMessage(error));
          app.hideLoading();
        });
      }
    }, {
      key: "refreshChapterList",
      value: function refreshChapterList(options) {
        var _this6 = this;

        app.showLoading();
        var opts = Object.assign({}, this.readingRecord.getOptions(), options);
        if (this.chapterList) this.chapterList.close();
        this.chapterList = new Infinitelist($('#chapterContainer')[0], $('#chapters')[0], this.book.buildChapterIterator(this.readingRecord.getChapterIndex(), 1, opts, this.buildChapter.bind(this)), this.book.buildChapterIterator(this.readingRecord.getChapterIndex() - 1, -1, opts, this.buildChapter.bind(this)));
        this.chapterList.onError = function (o, e) {
          return uiutils.showError(app.error.getMessage(e));
        };

        this.chapterList.onCurrentElementChanged = function (event, newValue, oldValue) {
          newValue = $(newValue);
          if (!oldValue) {
            app.hideLoading();
            if (_this6.readingRecord.getPageScrollTop()) {
              var cs = $('#chapterContainer').scrollTop();
              $('#chapterContainer').scrollTop(cs + _this6.readingRecord.getPageScrollTop());
            }
          }
          var index = newValue.data('chapterIndex');
          var title = newValue.data('chapterTitle');
          var options = newValue.data('options');
          if (index >= 0) {
            _this6.readingRecord.setReadingRecord(index, title, options);
            $(".labelContentSource").text(app.bookSourceManager.getBookSource(options.contentSourceId).name).click(function (e) {
              return window.open(_this6.book.getOfficialDetailLink(options.contentSourceId), '_system');
            });
          } else {
            _this6.readingRecord.setFinished(true);
          }
          $(".labelChapterTitle").text(title);
          app.hideLoading();
        };

        this.chapterList.loadList();
      }
    }, {
      key: "buildLastPage",
      value: function buildLastPage() {
        var _this7 = this;

        var nc = $('.template .readFinished').clone();
        if (!nc || nc.length <= 0) return null;

        nc.height($('#chapterContainer').height());

        nc.find(".offical-site").click(function (e) {
          return window.open(_this7.book.getOfficialDetailLink(), '_system');
        });
        nc.find("img.offical-site").attr('src', "img/logo/" + this.book.mainSourceId + ".png");

        nc.data('chapterIndex', -1);
        nc.data('chapterTitle', '读完啦');

        this.loadElseBooks(nc.find(".elseBooks"));
        return nc[0];
      }
    }, {
      key: "loadElseBooks",
      value: function loadElseBooks(list) {
        var _this8 = this;

        function addBook(bookshelfitem) {
          var prepend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          var nb = $('.template .book').clone();
          if (bookshelfitem.book.cover) nb.find('.book-cover').attr('src', bookshelfitem.book.cover);
          nb.find('.book-name').text(bookshelfitem.book.name);
          nb.click(function () {
            app.page.closeCurrentPagetAndShow("readbook", { book: bookshelfitem.book, readingRecord: bookshelfitem.readingRecord });
          });
          if (prepend) list.prepend(nb);else list.append(nb);
        }

        var unFinishedBooks = app.bookShelf.books.filter(function (e) {
          return !e.readingRecord.isFinished && e.book != _this8.book;
        }).reverse();
        unFinishedBooks.forEach(addBook);

        var finishedBooks = app.bookShelf.books.filter(function (e) {
          return e.readingRecord.isFinished && e.book != _this8.book;
        });
        finishedBooks.forEach(function (e) {
          e.book.getLastestChapter().then(function (_ref2) {
            var _ref3 = _slicedToArray(_ref2, 1),
                lastestChapter = _ref3[0];

            if (!e.readingRecord.equalChapterTitle(lastestChapter)) addBook(e, true);
          });
        });
      }
    }, {
      key: "buildChapter",
      value: function buildChapter() {
        var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            chapter = _ref4.chapter,
            index = _ref4.index,
            options = _ref4.options;

        if (!chapter) return this.buildLastPage();

        this.book.getCatalog().then(function (catalog) {
          return $(".labelBookPercent").text(parseInt(index / catalog.length * 100) + " %");
        });

        var nc = $('.template .chapter').clone();
        if (!nc || nc.length <= 0) return null;
        nc.find(".chapter-title").text(chapter.title);

        var content = $("<div>" + chapter.content + "</div>");
        content.find('p').addClass('chapter-p');
        content.find('img').addClass('content-img').on('error', uiutils.imgonerror);

        nc.find(".chapter-content").html(content);

        nc.data('chapterIndex', index);
        nc.data('chapterTitle', chapter.title);
        nc.data('options', options);
        return nc[0];
      }
    }, {
      key: "nextChapter",
      value: function nextChapter() {
        this.chapterList.nextElement();
      }
    }, {
      key: "previousChapter",
      value: function previousChapter() {
        this.chapterList.previousElement();
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
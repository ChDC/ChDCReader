"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "util", "uiutil", 'mylib/infinitelist', "ReadingRecord"], function ($, app, Page, util, uiutil, Infinitelist, ReadingRecord) {
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
            uiutil.showMessageDialog("加入书架", "\u662F\u5426\u5C06" + this.book.name + " \u52A0\u5165\u4E66\u67B6\uFF1F", function () {
              app.bookShelf.addBook(_this2.book, _this2.readingRecord);
              app.bookShelf.save().then(function () {
                uiutil.showMessage("添加成功！");
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
          return window.open(_this3.book.getDetailLink(), '_system');
        });
        $("#btnRefreshCatalog").click(function () {
          return _this3.loadCatalog(true);
        });
        if (this.isNewBook) {
          $("#btnAddtoBookShelf").show().click(function (e) {
            app.bookShelf.addBook(_this3.book, _this3.readingRecord);
            $(event.currentTarget).css("display", "none");
            app.bookShelf.save().then(function () {
              uiutil.showMessage("添加成功！");
            }).catch(function (error) {
              $(event.currentTarget).css("display", "block");
            });
          });
        }
        $('#chapterContainer').on("scroll", function (e) {
<<<<<<< HEAD
<<<<<<< HEAD
          var percent = _this3.chapterList.getPageScorllTop() / _this3.chapterList.getCurrentItem().height() * 100;
          $(".labelChatperPercent").text(parseInt(percent) + " %");
=======
          $(".labelChatperPercent").text(parseInt(_this3.chapterList.getScrollRate() * 100) + " %");
>>>>>>> dev
=======
          $(".labelChatperPercent").text(parseInt(_this3.chapterList.getScrollRate() * 100) + " %");
>>>>>>> dev
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
            return uiutil.showError(app.error.getMessage(error));
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
            if (i == _this5.readingRecord.chapterIndex) lce.addClass("current-chapter");else if (!value.link) lce.addClass("vip-chapter");
          });
          app.hideLoading();
        }).catch(function (error) {
          uiutil.showError(app.error.getMessage(error));
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
          return uiutil.showError(app.error.getMessage(e));
        };

        this.chapterList.onCurrentItemChanged = function (event, newValue, oldValue) {
          newValue = $(newValue);
          if (!oldValue) {
            app.hideLoading();
            if (_this6.readingRecord.pageScrollTop) {
              var cs = $('#chapterContainer').scrollTop();
              $('#chapterContainer').scrollTop(cs + _this6.readingRecord.pageScrollTop);
            }
          }
          var index = newValue.data('chapterIndex');
          var title = newValue.data('chapterTitle');
          var options = newValue.data('options');
          if (index >= 0) {
            _this6.readingRecord.setReadingRecord(index, title, options);
            $(".labelContentSource").text(app.bookSourceManager.getBookSource(options.contentSourceId).name).click(function (e) {
              return window.open(_this6.book.getDetailLink(options.contentSourceId), '_system');
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
        var nc = $('.template .chapter').clone();
        if (!nc || nc.length <= 0) return null;
<<<<<<< HEAD

<<<<<<< HEAD
        this.book.getCatalog().then(function (catalog) {
          return $(".labelBookPercent").text(parseInt(chapterIndex / catalog.length * 100) + " %");
        });

        return this.book.getChapter(chapterIndex, opts).then(function (_ref2) {
          var chapter = _ref2.chapter,
              title = _ref2.title,
              index = _ref2.index,
              options = _ref2.options;
=======
=======

>>>>>>> dev
        var title = '读完啦';
        var content = "\n        <h2>\u60A8\u5DF2\u7ECF\u8BFB\u5B8C\u4E86\u672C\u4E66\u7684\u6240\u6709\u66F4\u65B0\uFF01</h2>\n        <h2>\u60F3\u8981\u66F4\u5FEB\u7684\u8BFB\u5230\u672C\u4E66\u7684\u66F4\u65B0\uFF0C\u8BF7\u53BB\u672C\u4E66\u7684\u5B98\u65B9\u7F51\u7AD9\uFF1A</h2>\n        <h2><a href=\"" + this.book.getDetailLink() + "\">\u5B98\u65B9\u7F51\u7AD9</a></h2>\n        <hr/>\n        <h2>\u60A8\u5DF2\u7ECF\u8BFB\u5B8C\u4E86\u672C\u4E66\u7684\u6240\u6709\u66F4\u65B0\uFF01</h2>\n        <h2>\u60F3\u8981\u66F4\u5FEB\u7684\u8BFB\u5230\u672C\u4E66\u7684\u66F4\u65B0\uFF0C\u8BF7\u53BB\u672C\u4E66\u7684\u5B98\u65B9\u7F51\u7AD9\uFF1A</h2>\n        <h2><a href=\"" + this.book.getDetailLink() + "\">\u5B98\u65B9\u7F51\u7AD9</a></h2>\n        <hr/>\n        <h2>\u60A8\u5DF2\u7ECF\u8BFB\u5B8C\u4E86\u672C\u4E66\u7684\u6240\u6709\u66F4\u65B0\uFF01</h2>\n        <h2>\u60F3\u8981\u66F4\u5FEB\u7684\u8BFB\u5230\u672C\u4E66\u7684\u66F4\u65B0\uFF0C\u8BF7\u53BB\u672C\u4E66\u7684\u5B98\u65B9\u7F51\u7AD9\uFF1A</h2>\n        <h2><a href=\"" + this.book.getDetailLink() + "\">\u5B98\u65B9\u7F51\u7AD9</a></h2>\n        <hr/>\n      ";
        nc.find(".chapter-title").text(title);
        nc.find(".chapter-content").html(content);
<<<<<<< HEAD
>>>>>>> dev
=======
>>>>>>> dev

        nc.data('chapterIndex', -1);
        nc.data('chapterTitle', title);
        return nc[0];
      }
    }, {
      key: "buildChapter",
      value: function buildChapter() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            chapter = _ref2.chapter,
            index = _ref2.index,
            options = _ref2.options;

        if (!chapter) return this.buildLastPage();

        this.book.getCatalog().then(function (catalog) {
          return $(".labelBookPercent").text(parseInt(index / catalog.length * 100) + " %");
        });

        var nc = $('.template .chapter').clone();
        if (!nc || nc.length <= 0) return null;
        nc.find(".chapter-title").text(chapter.title);

        var content = $("<div>" + chapter.content + "</div>");
        content.find('p').addClass('chapter-p');
        content.find('img').addClass('content-img').on('error', uiutil.imgonerror);

        nc.find(".chapter-content").html(content);

        nc.data('chapterIndex', index);
        nc.data('chapterTitle', chapter.title);
        nc.data('options', options);
        return nc[0];
      }
    }, {
      key: "nextChapter",
      value: function nextChapter() {
        this.chapterList.nextItem();
      }
    }, {
      key: "previousChapter",
      value: function previousChapter() {
        this.chapterList.previousItem();
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
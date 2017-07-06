"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "utils", "uiutils", 'mylib/infinitelist', "ReadingRecord", "uifactory", "LittleCrawler"], function ($, app, Page, utils, uiutils, Infinitelist, ReadingRecord, uifactory, LittleCrawler) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      var _this = _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).call(this));

      _this.book = null;
      _this.readingRecord = null;
      _this.chapterList = null;
      _this.isNewBook = true;
      _this.buildCatalogView = uifactory.buildCatalogView.bind(_this);
      _this.lastReadingScrollTop = 0;
      _this.chapterContainer;
      _this.isFullScreen = false;
      _this.screenOrientation = null;
      return _this;
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
              _this2.book.clearCacheChapters();
              _this2.fireEvent("myclose");
            });
          } else {
            this.fireEvent("myclose");
          }
        }
      }
    }, {
      key: "onLoad",
      value: function onLoad(_ref) {
        var _this3 = this;

        var params = _ref.params;

        this.chapterContainer = $("#chapterContainer");
        var bookAndReadRecordInBookShelf = app.bookShelf.hasBook(params.book);

        if (bookAndReadRecordInBookShelf) {
          this.book = bookAndReadRecordInBookShelf.book;
          this.readingRecord = bookAndReadRecordInBookShelf.readingRecord;
          this.isNewBook = false;
        } else {
          this.book = params.book;
          this.readingRecord = params.readingRecord || new ReadingRecord();
        }
        this.lastReadingScrollTop = this.readingRecord.getPageScrollTop();
        this.book.checkBookSources();
        this.loadView();
        this.screenOrientation = app.bookShelf.getBookSettings(this.book).screenOrientation;

        this.book.getChapterIndex(this.readingRecord.chapterTitle, this.readingRecord.chapterIndex).then(function (index) {
          if (index >= 0) _this3.readingRecord.chapterIndex = index;
          _this3.refreshChapterList();
        });
      }
    }, {
      key: "onResume",
      value: function onResume() {
        this.rotateScreen(this.screenOrientation);
      }
    }, {
      key: "onPause",
      value: function onPause() {
        var _this4 = this;

        if (typeof StatusBar != "undefined") StatusBar.show();
        app.ScreenOrientation.unlock();

        this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
        app.bookShelf.save();

        this.scrollTop = this.chapterContainer.scrollTop();
        this.addEventListener("resume", function (e) {
          return _this4.chapterContainer.scrollTop(_this4.scrollTop);
        }, true);
      }
    }, {
      key: "rotateScreen",
      value: function rotateScreen(screenOrientation) {
        if (!screenOrientation) {
          $("#btnRotateScreen > button > i").removeClass().addClass("glyphicon glyphicon-retweet");
          app.ScreenOrientation.unlock();
        } else {
          $("#btnRotateScreen > button > i").removeClass().addClass("glyphicon glyphicon-transfer");
          app.ScreenOrientation.lock();
        }
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this5 = this;

        $("#chapterContainer").on("click", function (event) {
          $('.toolbar').toggle();
          var excludes = ["btnNext", "btnLast"];
          var x = event.clientX,
              y = event.clientY;

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = excludes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var e = _step.value;

              var rect = document.getElementById(e).getBoundingClientRect();
              if (utils.isPointInRect(rect, { x: x, y: y })) return $('.toolbar').toggle();
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
          return _this5.loadCatalog();
        });
        $("#labelNight").text(app.theme.isNight() ? "白天" : "夜间");

        $("#btnToggleNight").click(function (e) {

          app.theme.toggleNight();
          $("#labelNight").text(app.theme.isNight() ? "白天" : "夜间");
        });
        $("#btnBadChapter").click(function (e) {
          _this5.tmpOptions = {
            excludes: [_this5.readingRecord.options.contentSourceId]
          };
          _this5.refreshChapterList();
        });
        $("#btnRefresh").click(function (e) {
          _this5.refreshChapterList();
        });
        $("#btnSortReversed").click(function (e) {
          var list = $('#listCatalog');
          list.append(list.children().toArray().reverse());
        });
        $("#btnRotateScreen").click(function () {
          if (_this5.screenOrientation) _this5.screenOrientation = null;else _this5.screenOrientation = "landscape";
          app.bookShelf.setBookSettingsValue(_this5.book, "screenOrientation", _this5.screenOrientation);
          _this5.rotateScreen(_this5.screenOrientation);
        });
        $("#btnChangeMainSource").click(function () {
          $("#modalBookSource").modal('show');
          _this5.loadBookSource();
        });
        $("#btnChangeContentSource").click(function () {
          $("#modalBookSource").modal('show');
          _this5.loadBookSource(true);
        });
        $('#modalCatalog').on('shown.bs.modal', function (e) {
          var targetChapter = $('#current-catalog-chapter');
          if (targetChapter && targetChapter.length > 0) {
            if (targetChapter.parent().attr('id') == "listCatalog") targetChapter[0].scrollIntoView();else for (var _e = targetChapter.parent(); _e.attr('id') != "listCatalog"; _e = _e.parent()) {
              if (_e.hasClass("collapse")) _e.collapse('show').on("shown.bs.collapse", function (e) {
                targetChapter[0].scrollIntoView();
              });
            }
          }
        });
        $('#btnBookDetail').click(function (e) {
          return app.page.showPage("bookdetail", { book: _this5.book });
        });
        $(".labelMainSource").text(app.bookSourceManager.getBookSource(this.book.mainSourceId).name).click(function (e) {
          return window.open(_this5.book.getOfficialDetailLink(), '_system');
        });
        $("#btnRefreshCatalog").click(function () {
          return _this5.loadCatalog(true);
        });
        if (this.isNewBook) {
          $("#btnAddtoBookShelf").show().click(function (e) {
            app.bookShelf.addBook(_this5.book, _this5.readingRecord);
            $(event.currentTarget).css("display", "none");
            app.bookShelf.save().then(function () {
              uiutils.showMessage("添加成功！");
            }).catch(function (error) {
              $(event.currentTarget).css("display", "block");
            });
          });
        }
        $('#chapterContainer').on("scroll", function (e) {
          $(".labelChatperPercent").text(parseInt(_this5.chapterList.getScrollRate() * 100) + " %");
        });
      }
    }, {
      key: "loadBookSource",
      value: function loadBookSource() {
        var _this6 = this;

        var changeContentSource = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


        var sources = !changeContentSource ? this.book.getSourcesKeysByMainSourceWeight() : this.book.getSourcesKeysSortedByWeight();
        var currentSourceId = changeContentSource ? this.readingRecord.options.contentSourceId : this.book.mainSourceId;
        $('#modalBookSourceLabel').text(changeContentSource ? "更换内容源" : "更换目录源");
        var changeContentSourceClickEvent = function changeContentSourceClickEvent(event) {
          var target = event.currentTarget;
          if (!target) return;
          var bid = $(target).data('bsid');

          _this6.readingRecord.options.contentSourceId = bid;
          _this6.readingRecord.options.contentSourceChapterIndex = null;

          _this6.refreshChapterList();
        };

        var changeCatalogSourceClickEvent = function changeCatalogSourceClickEvent(event) {
          var target = event.currentTarget;
          if (!target) return;
          var bid = $(target).data('bsid');
          var oldMainSource = currentSourceId;

          _this6.book.setMainSourceId(bid).then(function (book) {
            return app.bookShelf.save();
          }).catch(function (error) {
            return uiutils.showError(app.error.getMessage(error));
          });

          $("#modalCatalog").modal('hide');

          $(".labelMainSource").text(app.bookSourceManager.getBookSource(_this6.book.mainSourceId).name);

          if (_this6.readingRecord.chapterIndex) {
            _this6.book.fuzzySearch(_this6.book.mainSourceId, _this6.readingRecord.chapterIndex, { bookSourceId: oldMainSource }).then(function (_ref2) {
              var chapter = _ref2.chapter,
                  index = _ref2.index;

              _this6.readingRecord.setReadingRecord(chapter.title, index, {});
              _this6.refreshChapterList();
            }).catch(function (error) {
              _this6.readingRecord.reset();
              _this6.refreshChapterList();
            });
          } else {
            _this6.refreshChapterList();
          }

          _this6.book.refreshBookInfo();
        };

        var nlbseClickEvent = changeContentSource ? changeContentSourceClickEvent : changeCatalogSourceClickEvent;

        var listBookSource = $("#listBookSource");
        listBookSource.empty();
        var listBookSourceEntry = $(".template .listBookSourceEntry");
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = sources[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var bsk = _step2.value;

            if (bsk == currentSourceId) continue;
            var nlbse = listBookSourceEntry.clone();
            nlbse.text(app.bookSourceManager.getBookSource(bsk).name);
            nlbse.data("bsid", bsk);
            nlbse.click(nlbseClickEvent.bind(this));
            listBookSource.append(nlbse);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        ;
      }
    }, {
      key: "loadCatalog",
      value: function loadCatalog(forceRefresh) {
        var _this7 = this;

        app.showLoading();
        $('#listCatalogContainer').height($(window).height() * 0.5);

        return this.book.getCatalog({ forceRefresh: forceRefresh, groupByVolume: true }).then(function (catalog) {
          var listCatalog = $("#listCatalog");
          listCatalog.empty();
          listCatalog.append(_this7.buildCatalogView(catalog, function (e) {
            var chapter = $(e.currentTarget).data("chapter");
            _this7.readingRecord.setReadingRecord(chapter.title, chapter.index, { contentSourceId: _this7.readingRecord.options.contentSourceId });
            _this7.refreshChapterList();
          }, "#listCatalog", function (chapter, nc) {
            if (chapter.index == _this7.readingRecord.chapterIndex) nc.attr("id", "current-catalog-chapter");
            if (chapter.isVIP()) nc.addClass("vip-chapter");
          }));
          app.hideLoading();
        }).catch(function (error) {
          uiutils.showError(app.error.getMessage(error));
          app.hideLoading();
        });
      }
    }, {
      key: "refreshChapterList",
      value: function refreshChapterList() {
        var _this8 = this;

        app.showLoading();

        if (this.chapterList) this.chapterList.close();

        this.chapterList = new Infinitelist($('#chapterContainer')[0], $('#chapters')[0], this.buildChapter.bind(this), { disableCheckPrevious: true });
        this.chapterList.onError = function (e) {
          app.hideLoading();
          uiutils.showError(app.error.getMessage(e.error));
        };

        $(".labelContentSource").click(function (e) {
          return window.open(_this8.book.getOfficialDetailLink(_this8.readingRecord.options.contentSourceId), '_system');
        });

        this.chapterList.onCurrentElementChanged = function (_ref3) {
          var newValue = _ref3.new,
              oldValue = _ref3.old;

          newValue = $(newValue);
          var readingRecord = newValue.data('readingRecord');
          if (!readingRecord.done) {
            var contentSourceId = readingRecord.options.contentSourceId;
            _this8.readingRecord.setFinished(false);
            Object.assign(_this8.readingRecord, readingRecord);
            $(".labelContentSource").text(app.bookSourceManager.getBookSource(contentSourceId).name);
          } else {
            _this8.readingRecord.setFinished(true);
          }
          $(".labelChapterTitle").text(readingRecord.chapterTitle);
          app.hideLoading();
        };
        this.chapterList.onNewElementFinished = function (_ref4) {
          var newElement = _ref4.newElement,
              direction = _ref4.direction,
              isFirstElement = _ref4.isFirstElement;

          if (!isFirstElement) return;

          app.hideLoading();
          if (_this8.lastReadingScrollTop) {
            var cs = $('#chapterContainer').scrollTop();
            $('#chapterContainer').scrollTop(cs + _this8.lastReadingScrollTop);
            _this8.lastReadingScrollTop = 0;
          }
        };

        if (this.book.getType() == "comics") {
          this.enableAutoFullScreenMode();
        }

        this.chapterList.loadList();
      }
    }, {
      key: "enableAutoFullScreenMode",
      value: function enableAutoFullScreenMode() {
        var _this9 = this;

        var lastScroll = void 0;
        var threshold = 100;
        this.chapterList.onScrollDown = function (e) {
          if (lastScroll == undefined || e.scrollTop - lastScroll > threshold) {
            _this9.toggleFullScreen(true);
            lastScroll = e.scrollTop;
          }
        };

        this.chapterList.onScrollUp = function (e) {
          if (lastScroll == undefined || lastScroll - e.scrollTop > threshold) {
            _this9.toggleFullScreen(false);
            lastScroll = e.scrollTop;
          }
        };
      }
    }, {
      key: "toggleFullScreen",
      value: function toggleFullScreen(full) {
        var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (full == undefined) full = !this.isFullScreen;

        if (full && (!this.isFullScreen || force)) {
          this.chapterContainer[0].style.top = "0";
          this.chapterContainer[0].style.bottom = "0";
          $("#mainViewHeader, #mainViewFooter").hide();
          if (typeof StatusBar != "undefined" && window.innerHeight < window.innerWidth) StatusBar.hide();
          this.isFullScreen = true;
        } else if (!full && (this.isFullScreen || force)) {
          this.chapterContainer.removeAttr("style");
          $("#mainViewHeader, #mainViewFooter").show();
          if (typeof StatusBar != "undefined") StatusBar.show();
          this.isFullScreen = false;
        }
      }
    }, {
      key: "loadElseBooks",
      value: function loadElseBooks(list) {
        var _this10 = this;

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
          return !e.readingRecord.isFinished && e.book != _this10.book;
        }).reverse();
        unFinishedBooks.forEach(addBook);

        var finishedBooks = app.bookShelf.books.filter(function (e) {
          return e.readingRecord.isFinished && e.book != _this10.book;
        });
        finishedBooks.forEach(function (e) {
          e.book.getLastestChapter().then(function (_ref5) {
            var _ref6 = _slicedToArray(_ref5, 1),
                lastestChapter = _ref6[0];

            if (!e.readingRecord.equalChapterTitle(lastestChapter)) addBook(e, true);
          });
        });
      }
    }, {
      key: "buildLastPage",
      value: function buildLastPage(chapterIndex, options) {
        var _this11 = this;

        var nc = $('.template .readFinished').clone();
        if (!nc || nc.length <= 0) return null;

        nc.height($('#chapterContainer').height());

        nc.find(".offical-site").click(function (e) {
          return window.open(_this11.book.getOfficialDetailLink(), '_system');
        });
        nc.find("img.offical-site").attr('src', "img/logo/" + this.book.mainSourceId + ".png");

        nc.data("readingRecord", { chapterTitle: "读完啦", chapterIndex: chapterIndex, options: options, done: true });
        this.loadElseBooks(nc.find(".elseBooks"));
        return { value: nc[0], done: true };
      }
    }, {
      key: "buildChapterElement",
      value: function buildChapterElement(_ref7, direction) {
        var chapter = _ref7.chapter,
            index = _ref7.index,
            options = _ref7.options;

        this.book.getCatalog().then(function (catalog) {
          return $(".labelBookPercent").text(parseInt(index / catalog.length * 100) + " %");
        });

        var nc = $('.template .chapter').clone();
        if (!nc || nc.length <= 0) return null;
        nc.find(".chapter-title").text(chapter.title);

        var content = $("<div>" + chapter.content + "</div>");
        content.find('p').addClass('chapter-p');
        this.loadImages(content);

        nc.find(".chapter-content").html(content);
        nc.data("readingRecord", { chapterTitle: chapter.title, chapterIndex: index, options: options });

        return { value: nc[0], done: false };
      }
    }, {
      key: "buildChapter",
      value: function buildChapter(boundaryItem, direction) {
        var _this12 = this;

        if (!boundaryItem) {
          var _ret = function () {
            var opts = Object.assign({}, _this12.readingRecord.getOptions(), _this12.tmpOptions);
            _this12.tmpOptions = null;
            return {
              v: _this12.book.getChapter(_this12.readingRecord.getChapterIndex(), opts).then(function (result) {
                return _this12.buildChapterElement(result, direction);
              }).catch(function (error) {
                if (error == 203 || error == 202) {
                  return direction > 0 ? _this12.buildLastPage(_this12.readingRecord.getChapterIndex(), opts) : null;
                }
                throw error;
              })
            };
          }();

          if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
        }

        var _$$data = $(boundaryItem).data("readingRecord"),
            chapterIndex = _$$data.chapterIndex,
            options = _$$data.options;

        return this.book.nextChapter(chapterIndex, options, direction).then(function (result) {
          if (!result.chapter) {
            if (direction > 0) {
              options.contentSourceChapterIndex += 1;
              return _this12.buildLastPage(chapterIndex + 1, options);
            } else return { value: null, done: true };
          }
          return _this12.buildChapterElement(result, direction);
        });
      }
    }, {
      key: "loadImages",
      value: function loadImages(content) {
        var _this13 = this;

        var imgs = content.find('img').addClass('content-img').each(function (i, img) {
          var id = utils.getGUID();

          var loading = $('<p class="content-img-loading">').text(i + 1).css("line-height", _this13.chapterContainer.width() * 2 + "px").attr("id", id);

          $(img).replaceWith(loading);
          img.dataset.id = id;
          loadImg(img);
        });


        function loadError(e) {
          var img = e.currentTarget || e;
          var id = img.dataset.id;
          var btnReload = $('<div class="img-reload"><img src="img/reload.png"><p>加载失败，点击重新加载</p></div>').one("click", function (e) {
            loadImg(img, true);
            e.stopPropagation();
            e.currentTarget.remove();
          });
          var ic = $(document.getElementById(id));
          ic.append(btnReload);
          btnReload.css("top", ic.height() / 2 - btnReload.height() / 2);
        }

        function loadImg(img) {
          var reload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          if (img.dataset.skip) {
            var src = void 0;
            if (!reload) {
              src = img.src;
              img.dataset.src = src;
              img.removeAttribute("src");
            } else {
              src = img.dataset.src;
            }

            LittleCrawler.ajax("GET", src, {}, "blob").then(function (blob) {
              var skipBits = Number.parseInt(img.dataset.skip);
              var url = URL.createObjectURL(blob.slice(skipBits));
              $(img).one("load", loadFinishedImg);
              img.src = url;
            }).catch(function (e) {
              loadError(img);
            });
          } else {
            img.src = img.src;
            var jImg = $(img);
            if (!reload) jImg.one("load", loadFinishedImg);
            jImg.one("error", loadError);
          }
        }

        function loadFinishedImg(e) {
          var img = e.currentTarget;
          var id = img.dataset.id;
          delete img.dataset.id;
          delete img.dataset.skip;
          $(document.getElementById(id)).replaceWith(img);
        }
      }
    }, {
      key: "nextChapter",
      value: function nextChapter() {
        app.showLoading();
        this.chapterList.nextElement(false).then(function () {
          return app.hideLoading();
        }).catch(function (e) {
          return app.hideLoading();
        });
      }
    }, {
      key: "previousChapter",
      value: function previousChapter() {
        app.showLoading();
        this.chapterList.previousElement(true).then(function () {
          return app.hideLoading();
        }).catch(function (e) {
          return app.hideLoading();
        });
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
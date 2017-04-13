"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "util", 'infinitelist'], function ($, app, Page, util, Infinitelist) {
    var MyPage = function (_Page) {
        _inherits(MyPage, _Page);

        function MyPage() {
            _classCallCheck(this, MyPage);

            var _this = _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).call(this));

            _this.options = null;
            _this.tmpOptions = null;
            _this.book = null;
            _this.readingRecord = null;
            _this.chapterList = null;
            _this.lastSavePageScrollTop = 0;
            return _this;
        }

        _createClass(MyPage, [{
            key: "onLoad",
            value: function onLoad(params, p) {
                this.book = params.book;
                this.book.checkBookSources();
                this.readingRecord = params.readingRecord;
                this.options = {};

                this.loadView();
                this.lastSavePageScrollTop = this.readingRecord.pageScrollTop;
                app.showLoading();
                this.chapterList.loadList();
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
                var _this2 = this;

                this.initList();

                $(".chapterContainer").on("click", function (event) {
                    $('.toolbar').toggle();
                });
                $(".toolbar").blur(function (e) {
                    return $('.toolbar').hide();
                });
                $(".toolbar").click(function (e) {
                    return $('.toolbar').hide();
                });

                $(".btnNext").click(this.nextChapter.bind(this));
                $(".btnLast").click(this.lastChapter.bind(this));

                $("#btnClose").click(function (e) {
                    return app.page.closePage();
                });

                $("#btnCatalog").click(function (e) {
                    return _this2.loadCatalog();
                });
                $("#btnToggleNight").click(function (e) {
                    app.settings.settings.night = !app.settings.settings.night;
                    app.settings.save();
                    $("#labelNight").text(app.settings.settings.night ? "白天" : "夜间");
                    app.page.setTheme(app.settings.settings.night ? app.settings.settings.nighttheme : app.settings.settings.daytheme);
                });
                $("#btnBadChapter").click(function (e) {
                    _this2.chapterList.emptyList();
                    app.showLoading();
                    _this2.tmpOptions = {
                        excludes: [_this2.readingRecord.options.contentSourceId]
                    };
                    _this2.chapterList.loadList();
                });
                $("#btnSortReversed").click(function (e) {
                    var list = $('#listCatalog');
                    list.append(list.children().toArray().reverse());
                });

                $("#btnChangeMainSource").click(function () {
                    $("#modalBookSource").modal('show');
                    _this2.loadBookSource();
                });
                $('#modalCatalog').on('shown.bs.modal', function (e) {
                    var targetChapter = $('#listCatalog > [data-index=' + _this2.readingRecord.chapterIndex + ']');
                    var top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
                    $('#listCatalogContainer').scrollTop(top);
                });
                $(".labelMainSource").text(app.bookSourceManager.sources[this.book.mainSourceId].name);
                $("#btnRefreshCatalog").click(function () {
                    return _this2.loadCatalog(true);
                });
            }
        }, {
            key: "loadBookSource",
            value: function loadBookSource() {
                var _this3 = this;

                var changeMainContentSourceClickEvent = function changeMainContentSourceClickEvent(event) {
                    var target = event.currentTarget;
                    if (!target) return;
                    var bid = $(target).data('bsid');
                    var oldMainSource = _this3.book.mainSourceId;
                    _this3.book.setMainSourceId(bid).then(function (book) {
                        app.bookShelf.save();

                        $("#modalCatalog").modal('hide');

                        $(".labelMainSource").text(app.bookSourceManager.sources[_this3.book.mainSourceId].name);
                        if (_this3.readingRecord.chapterIndex) {
                            var opts = Object.assign({}, _this3.options);
                            opts.bookSourceId = oldMainSource;
                            _this3.book.fuzzySearch(_this3.book.mainSourceId, _this3.readingRecord.chapterIndex, opts.forceRefresh, opts.bookSourceId).then(function (_ref) {
                                var chapter = _ref.chapter,
                                    index = _ref.index;

                                _this3.readingRecord.chapterIndex = index;
                                _this3.readingRecord.chapterTitle = chapter.title;

                                loadCurrentChapter(0);
                            }).catch(function (error) {
                                _this3.readingRecord.reset();

                                loadCurrentChapter(0);
                            });
                        } else {
                            _this3.chapterList.loadList();
                        }

                        _this3.book.refreshBookInfo();
                    }).catch(function (error) {
                        return util.showError(app.error.getMessage(error));
                    });
                };

                var listBookSource = $("#listBookSource");
                listBookSource.empty();
                var listBookSourceEntry = $(".template .listBookSourceEntry");
                for (var bsk in app.bookSourceManager.sources) {
                    if (bsk == this.book.mainSourceId) continue;
                    var nlbse = listBookSourceEntry.clone();
                    var bs = app.bookSourceManager.sources[bsk];
                    nlbse.find(".bookSourceTitle").text(bs.name);
                    var lastestChapter = "";

                    nlbse.find(".bookSourceLastestChapter").text(lastestChapter);
                    nlbse.data("bsid", bsk);
                    nlbse.click(changeMainContentSourceClickEvent.bind(this));
                    listBookSource.append(nlbse);
                };
            }
        }, {
            key: "loadCatalog",
            value: function loadCatalog(forceRefresh) {
                var _this4 = this;

                var listCatalogEntryClick = function listCatalogEntryClick(event) {
                    var target = event.currentTarget;
                    if (!target) return;

                    target = $(target);
                    var chapterIndex = parseInt(target.attr('data-index'));
                    _this4.readingRecord.chapterIndex = chapterIndex;
                    _this4.chapterList.emptyList();
                    app.showLoading();
                    _this4.chapterList.loadList();
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
                        lce.click(listCatalogEntryClick.bind(_this4));
                        listCatalog.append(lce);
                        if (i == _this4.readingRecord.chapterIndex) {
                            lce.css("color", 'red');
                        }
                    });
                    app.hideLoading();
                }).catch(function (error) {
                    util.showError(app.error.getMessage(error));
                    app.hideLoading();
                });
            }
        }, {
            key: "initList",
            value: function initList() {
                var _this5 = this;

                this.chapterList = new Infinitelist($('.chapterContainer'), $('.chapters'), this.onNewChapterItem.bind(this), this.onNewChapterItemFinished.bind(this));
                this.chapterList.onCurrentItemChanged = function (event, newValue, oldValue) {
                    var index = newValue.data('chapterIndex');
                    var title = newValue.data('chapterTitle');
                    var options = newValue.data('options');
                    _this5.readingRecord.setReadingRecord(index, title, options);
                    _this5.readingRecord.pageScrollTop = _this5.chapterList.getPageScorllTop();

                    $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
                    $(".labelChapterTitle").text(title);
                    app.hideLoading();
                };
            }
        }, {
            key: "onNewChapterItem",
            value: function onNewChapterItem(event, be, direction) {
                var _this6 = this;

                var opts = Object.assign({}, this.options, this.tmpOptions);
                this.tmpOptions = null;
                var chapterIndex = 0;
                if (be) {
                    Object.assign(opts, be.data('options'));
                    chapterIndex = be.data('chapterIndex') + (direction >= 0 ? 1 : -1);
                    if ('contentSourceChapterIndex' in opts) {
                        opts.contentSourceChapterIndex += direction >= 0 ? 1 : -1;
                    }
                } else {
                    Object.assign(opts, this.readingRecord.options);
                    chapterIndex = this.readingRecord.chapterIndex;
                }

                return this.book.getChapter(chapterIndex, opts).then(function (_ref2) {
                    var chapter = _ref2.chapter,
                        title = _ref2.title,
                        index = _ref2.index,
                        options = _ref2.options;

                    var newItem = _this6.buildChapter(chapter, title, index, options);
                    return { newItem: newItem };
                }).catch(function (error) {
                    app.hideLoading();
                    util.showError(app.error.getMessage(error));
                    if (error == 202 || error == 203 || error == 201) {
                        return { newItem: null, type: 1 };
                    } else {
                        return { newItem: null };
                    }
                });
            }
        }, {
            key: "onNewChapterItemFinished",
            value: function onNewChapterItemFinished(event, be, direction) {
                if (!be && this.lastSavePageScrollTop) {
                    var cs = $('.chapterContainer').scrollTop();
                    $('.chapterContainer').scrollTop(cs + this.lastSavePageScrollTop);
                    this.lastSavePageScrollTop = 0;
                }
            }
        }, {
            key: "buildChapter",
            value: function buildChapter(chapter, title, index, options) {
                var nc = $('.template .chapter').clone();
                nc.find(".chapter-title").text(chapter.title);
                nc.find(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));


                nc.data('chapterIndex', index);
                nc.data('chapterTitle', title);
                nc.data('options', options);
                return nc;
            }
        }, {
            key: "nextChapter",
            value: function nextChapter() {
                this.chapterList.nextItem();
            }
        }, {
            key: "lastChapter",
            value: function lastChapter() {
                this.chapterList.lastItem();
            }
        }]);

        return MyPage;
    }(Page);

    return MyPage;
});
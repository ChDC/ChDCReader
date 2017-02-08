"use strict";

define(["jquery", "main", "page", "util", 'infinitelist'], function ($, app, page, util, Infinitelist) {

    var options = null;
    var tmpOptions = null;

    var book = null;
    var readingRecord = null;
    var chapterList = null;
    var lastSavePageScrollTop = 0;

    function fail(error) {
        app.hideLoading();
        util.showError(error.message);
    }

    function loadView() {
        initList();

        $(".chapterContainer").on("click", function (event) {
            function isClickInRegion(minHeight, maxHeight) {
                var clientHeight = $(window).height();
                var y = event.clientY;
                minHeight *= clientHeight;
                maxHeight *= clientHeight;
                return y >= minHeight && y <= maxHeight;
            }

            if (isClickInRegion(0.33, 0.66)) {
                $('.toolbar').toggle();
            }
        });
        $(".toolbar").blur(function () {
            $('.toolbar').hide();
        });
        $(".toolbar").click(function () {
            $('.toolbar').hide();
        });

        $(".btnNext").click(nextChapter);
        $(".btnLast").click(lastChapter);

        $("#btnClose").click(function () {
            page.closePage();
        });

        $("#btnCatalog").click(function () {
            loadCatalog();
        });
        $("#btnToggleNight").click(function (e) {
            app.settings.night = !app.settings.night;
            app.saveSettings();
            $("#labelNight").text(app.settings.night ? "白天" : "夜间");
            page.setTheme(app.settings.night ? app.settings.nighttheme : app.settings.daytheme);
        });
        $("#btnBadChapter").click(function () {
            chapterList.emptyList();
            app.showLoading();
            tmpOptions = {
                excludes: [readingRecord.options.contentSourceId]
            };
            chapterList.loadList();
        });
        $("#btnSortReversed").click(function () {
            var list = $('#listCatalog');
            list.append(list.children().toArray().reverse());
        });

        $("#btnChangeMainSource").click(function () {
            $("#modalBookSource").modal('show');
            loadBookSource();
        });
        $('#modalCatalog').on('shown.bs.modal', function (e) {
            var targetChapter = $('#listCatalog > [data-index=' + readingRecord.chapterIndex + ']');
            var top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
            $('#listCatalogContainer').scrollTop(top);
        });
        $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSourceId].name);
        $("#btnRefreshCatalog").click(function () {
            loadCatalog(true);
        });
    };

    function loadBookSource() {
        var self = this;
        var listBookSource = $("#listBookSource");
        listBookSource.empty();
        var listBookSourceEntry = $(".template .listBookSourceEntry");
        for (var bsk in app.bookSourceManager.sources) {
            if (bsk == book.mainSourceId) continue;
            var nlbse = listBookSourceEntry.clone();
            var bs = app.bookSourceManager.sources[bsk];
            nlbse.find(".bookSourceTitle").text(bs.name);
            var lastestChapter = "";

            nlbse.find(".bookSourceLastestChapter").text(lastestChapter);
            nlbse.data("bsid", bsk);
            nlbse.click(changeMainContentSourceClickEvent);
            listBookSource.append(nlbse);
        };

        function changeMainContentSourceClickEvent(event) {
            var target = event.currentTarget;
            if (target) {
                var bid = $(target).data('bsid');
                var oldMainSource = book.mainSourceId;
                book.setMainSourceId(bid, function (book) {
                    app.bookShelf.save();

                    $("#modalCatalog").modal('hide');

                    $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSourceId].name);
                    if (readingRecord.chapterIndex) {
                        var opts = $.extend(true, {}, options);
                        opts.bookSourceId = oldMainSource;
                        book.fuzzySearch(book.mainSourceId, readingRecord.chapterIndex, function (chapter, chapterIndex) {
                            readingRecord.chapterIndex = chapterIndex;
                            readingRecord.chapterTitle = chapter.title;

                            loadCurrentChapter(0);
                        }, function () {
                            readingRecord.reset();

                            loadCurrentChapter(0);
                        }, opts);
                    } else {
                        chapterList.loadList();
                    }

                    book.refreshBookInfo(null, null, options);
                }, fail, options);
            }
        }
    }

    function loadCatalog(forceRefresh) {
        app.showLoading();
        $('#listCatalogContainer').height($(window).height() * 0.5);

        function listCatalogEntryClick(event) {
            var target = event.currentTarget;
            if (target) {
                target = $(target);
                var chapterIndex = parseInt(target.attr('data-index'));
                readingRecord.chapterIndex = chapterIndex;
                chapterList.emptyList();
                app.showLoading();
                chapterList.loadList();
            }
        }
        book.getCatalog(function (catalog) {
            var listCatalog = $("#listCatalog");
            var listCatalogEntry = $(".template .listCatalogEntry");
            listCatalog.empty();
            $(catalog).each(function (i) {
                var lce = listCatalogEntry.clone();
                lce.text(this.title);

                lce.attr("data-index", i);
                lce.click(listCatalogEntryClick);
                listCatalog.append(lce);
                if (i == readingRecord.chapterIndex) {
                    lce.css("color", 'red');
                }
            });
            app.hideLoading();
        }, fail, { bookSourceManager: app.bookSourceManager, forceRefresh: forceRefresh });
    }

    function initList() {
        chapterList = new Infinitelist($('.chapterContainer'), $('.chapters'), onNewChapterItem);
        chapterList.onCurrentItemChanged = function (event, newValue, oldValue) {
            var index = newValue.data('chapterIndex');
            var title = newValue.data('chapterTitle');
            var options = newValue.data('options');
            readingRecord.setReadingRecord(index, title, options);
            readingRecord.pageScrollTop = chapterList.getPageScorllTop();
            app.bookShelf.save();
            $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
            $(".labelChapterTitle").text(title);
            app.hideLoading();
        };
    }

    function onNewChapterItem(event, be, direction, success) {
        var opts = $.extend(true, {}, options, tmpOptions);
        tmpOptions = null;
        var chapterIndex = 0;
        if (be) {
            $.extend(opts, be.data('options'));
            chapterIndex = be.data('chapterIndex') + (direction >= 0 ? 1 : -1);
            if ('contentSourceChapterIndex' in opts) {
                opts.contentSourceChapterIndex += direction >= 0 ? 1 : -1;
            }
        } else {
            $.extend(opts, readingRecord.options);
            chapterIndex = readingRecord.chapterIndex;
        }

        book.getChapter(chapterIndex, function (chapter, title, index, options) {
            var newItem = buildChapter(chapter, title, index, options);
            success(newItem);
            if (!be && lastSavePageScrollTop) {
                var cs = $('.chapterContainer').scrollTop();
                $('.chapterContainer').scrollTop(cs + lastSavePageScrollTop);
                lastSavePageScrollTop = 0;
            }
        }, function (error) {
            if (error.id == 202 || error.id == 203 || error.id == 201) {
                success(null, 1);
            } else {
                success(null);
            }
            fail(error);
            app.hideLoading();
        }, opts);
    }

    function buildChapter(chapter, title, index, options) {
        var nc = $('.template .chapter').clone();
        nc.find(".chapter-title").text(chapter.title);
        nc.find(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));


        nc.data('chapterIndex', index);
        nc.data('chapterTitle', title);
        nc.data('options', options);
        return nc;
    }

    function nextChapter() {
        chapterList.nextItem();
    }

    function lastChapter() {
        chapterList.lastItem();
    }

    return {
        onload: function onload(params, p) {
            book = params.book;
            book.checkBookSources(app.bookSourceManager);
            readingRecord = params.readingRecord;
            options = { bookSourceManager: app.bookSourceManager };

            loadView();
            lastSavePageScrollTop = readingRecord.pageScrollTop;
            app.showLoading();
            chapterList.loadList();
        },
        onresume: function onresume() {},
        onpause: function onpause() {
            readingRecord.pageScrollTop = chapterList.getPageScorllTop();
            app.bookShelf.save();
        },
        onclose: function onclose(params) {}
    };
});
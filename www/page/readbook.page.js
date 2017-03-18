"use strict";

define(["jquery", "main", "page", "util", 'infinitelist'], function ($, app, page, util, Infinitelist) {

    var options = null;
    var tmpOptions = null;

    var book = null;
    var readingRecord = null;
    var chapterList = null;
    var lastSavePageScrollTop = 0;

    function loadView() {
        initList();

        $(".chapterContainer").on("click", function (event) {
            $('.toolbar').toggle();
        });
        $(".toolbar").blur(function (e) {
            return $('.toolbar').hide();
        });
        $(".toolbar").click(function (e) {
            return $('.toolbar').hide();
        });

        $(".btnNext").click(nextChapter);
        $(".btnLast").click(lastChapter);

        $("#btnClose").click(function (e) {
            return page.closePage();
        });

        $("#btnCatalog").click(function (e) {
            return loadCatalog();
        });
        $("#btnToggleNight").click(function (e) {
            app.settings.settings.night = !app.settings.settings.night;
            app.settings.save();
            $("#labelNight").text(app.settings.settings.night ? "白天" : "夜间");
            page.setTheme(app.settings.settings.night ? app.settings.settings.nighttheme : app.settings.settings.daytheme);
        });
        $("#btnBadChapter").click(function (e) {
            chapterList.emptyList();
            app.showLoading();
            tmpOptions = {
                excludes: [readingRecord.options.contentSourceId]
            };
            chapterList.loadList();
        });
        $("#btnSortReversed").click(function (e) {
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
            return loadCatalog(true);
        });
    };

    function loadBookSource() {
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
            if (!target) return;
            var bid = $(target).data('bsid');
            var oldMainSource = book.mainSourceId;
            book.setMainSourceId(bid, options).then(function (book) {
                app.bookShelf.save();

                $("#modalCatalog").modal('hide');

                $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSourceId].name);
                if (readingRecord.chapterIndex) {
                    var opts = Object.assign({}, options);
                    opts.bookSourceId = oldMainSource;
                    book.fuzzySearch(book.mainSourceId, readingRecord.chapterIndex, opts).then(function (_ref) {
                        var chapter = _ref.chapter,
                            index = _ref.index;

                        readingRecord.chapterIndex = index;
                        readingRecord.chapterTitle = chapter.title;

                        loadCurrentChapter(0);
                    }).catch(function (error) {
                        readingRecord.reset();

                        loadCurrentChapter(0);
                    });
                } else {
                    chapterList.loadList();
                }

                book.refreshBookInfo(options);
            }).catch(function (error) {
                return util.showError(app.error.getMessage(error));
            });
        }
    }

    function loadCatalog(forceRefresh) {

        function listCatalogEntryClick(event) {
            var target = event.currentTarget;
            if (!target) return;

            target = $(target);
            var chapterIndex = parseInt(target.attr('data-index'));
            readingRecord.chapterIndex = chapterIndex;
            chapterList.emptyList();
            app.showLoading();
            chapterList.loadList();
        }

        app.showLoading();
        $('#listCatalogContainer').height($(window).height() * 0.5);

        return book.getCatalog({ bookSourceManager: app.bookSourceManager, forceRefresh: forceRefresh }).then(function (catalog) {
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
        }).catch(function (error) {
            util.showError(app.error.getMessage(error));
            app.hideLoading();
        });
    }

    function initList() {
        chapterList = new Infinitelist($('.chapterContainer'), $('.chapters'), onNewChapterItem, onNewChapterItemFinished);
        chapterList.onCurrentItemChanged = function (event, newValue, oldValue) {
            var index = newValue.data('chapterIndex');
            var title = newValue.data('chapterTitle');
            var options = newValue.data('options');
            readingRecord.setReadingRecord(index, title, options);
            readingRecord.pageScrollTop = chapterList.getPageScorllTop();

            $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
            $(".labelChapterTitle").text(title);
            app.hideLoading();
        };
    }

    function onNewChapterItem(event, be, direction) {

        var opts = Object.assign({}, options, tmpOptions);
        tmpOptions = null;
        var chapterIndex = 0;
        if (be) {
            Object.assign(opts, be.data('options'));
            chapterIndex = be.data('chapterIndex') + (direction >= 0 ? 1 : -1);
            if ('contentSourceChapterIndex' in opts) {
                opts.contentSourceChapterIndex += direction >= 0 ? 1 : -1;
            }
        } else {
            Object.assign(opts, readingRecord.options);
            chapterIndex = readingRecord.chapterIndex;
        }

        return book.getChapter(chapterIndex, opts).then(function (_ref2) {
            var chapter = _ref2.chapter,
                title = _ref2.title,
                index = _ref2.index,
                options = _ref2.options;

            var newItem = buildChapter(chapter, title, index, options);
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

    function onNewChapterItemFinished(event, be, direction) {
        if (!be && lastSavePageScrollTop) {
            var cs = $('.chapterContainer').scrollTop();
            $('.chapterContainer').scrollTop(cs + lastSavePageScrollTop);
            lastSavePageScrollTop = 0;
        }
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

    function onPause() {
        readingRecord.pageScrollTop = chapterList.getPageScorllTop();
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
        onresume: function onresume() {
            document.addEventListener("pause", onPause, false);
        },
        onpause: function onpause() {
            readingRecord.pageScrollTop = chapterList.getPageScorllTop();
            document.removeEventListener("pause", onPause, false);
            app.bookShelf.save();
        },
        onclose: function onclose(params) {}
    };
});
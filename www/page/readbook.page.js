"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){
    var book = null;
    var readingRecord = null;
    var options = null;
    var chapterScrollY = 0;

    function fail(error){
        util.showError(error.message);
    }

    // 获取当前章节
    var loadCurrentChapter = function(offset){
        var offset = offset || 0;
        if(!readingRecord.chapterIndex)
            readingRecord.chapterIndex = 0;
        loadChapter(readingRecord.chapterIndex + offset, {
            contentSourceId: readingRecord.options.contentSourceId,
            contentSourceChapterIndex: readingRecord.options.contentSourceChapterIndex + offset
        });
    };

    function btnNext(event){
        loadCurrentChapter(1);
    }

    function btnLast(event){
        loadCurrentChapter(-1);
    }

    function loadView(){
        // 将章节滚动位置存储到变量中
        $('.chapter').scroll(function(){
            chapterScrollY = $('.chapter').scrollTop();
        });

        // 弹出工具栏
        $(".chapter").on("click", function(event){
            function isClickInRegion(minHeight, maxHeight)
            {
                var clientHeight = $(window).height();
                var y = event.clientY;
                minHeight *= clientHeight;
                maxHeight *= clientHeight;
                return y >= minHeight && y <= maxHeight;
            }

            if(isClickInRegion(0.3, 0.6))
            {
                $('.toolbar').toggle();
            }
            else if(isClickInRegion(0, 0.3))
            {
                $('.toolbar').hide();
            }
            else if(isClickInRegion(0.6, 0.9))
            {
                $('.toolbar').hide();
            }
        });
        $(".toolbar").blur(function(){
            $('.toolbar').hide();
        });
        $(".toolbar").click(function(){
            $('.toolbar').hide();
        });
        $(".btnNext").click(btnNext);
        $(".btnLast").click(btnLast);

        // 按钮事件
        $("#btnClose").click(function(){page.closePage();});
        $("#btnBookShelf").click(function(){page.showPage("bookshelf", null, {clear: true});});
        $("#btnCatalog").click(function(){
            // $('#modalCatalog').modal('show');
            loadCatalog();
        });
        $("#btnBadChapter").click(function(){
            debugger;
            var opts = $.extend({}, options);
            opts.excludes = [readingRecord.options.contentSourceId];
            loadChapter(readingRecord.chapterIndex, opts);
        });
        // TODO: 修改内容源
        $("#btnChangeMainContentSource").click(function(){
            $("#modalBookSource").modal('show');
            loadBookSource("mainContentSource");
        });
        $("#btnChangeMainSource").click(function(){
            $("#modalBookSource").modal('show');
            loadBookSource("mainSource");
        });
        $('#modalCatalog').on('shown.bs.modal', function (e) {
            var targetChapter = $('#listCatalog > [data-index=' + readingRecord.chapterIndex + ']');
            var top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
            $('#listCatalogContainer').scrollTop(top);
            // $("#modalCatalog .modal-body").css("height", $());
        });
        $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSource].name);
        // TODO:labelContentSource
        $("#btnRefreshCatalog").click(function(){
            loadCatalog(true);
        });
    };

    function loadBookSource(){
        var self = this;
        var listBookSource = $("#listBookSource");
        listBookSource.empty();
        var listBookSourceEntry = $(".template .listBookSourceEntry");
        for(var bsk in app.bookSourceManager.sources){
            var nlbse = listBookSourceEntry.clone();
            var bs = app.bookSourceManager.sources[bsk];
            nlbse.find(".bookSourceTitle").text(bs.name);
            var lastestChapter = "";
            // TODO: 最新章节
            nlbse.find(".bookSourceLastestChapter").text(lastestChapter);
            nlbse.data("bsid", bsk);
            nlbse.click(changeMainContentSourceClickEvent);
            listBookSource.append(nlbse);
        };

        function changeMainContentSourceClickEvent(event){
            var target = event.currentTarget;
            if(target){
                var bid = $(target).data('bsid');
                var oldMainSource = self.mainSource;
                book.setMainSource(bid, function(book){
                    // 更新源之后
                    // 刷新主目录源显示内容
                    $(".labelmainSource").text(app.bookSourceManager.sources[book.mainSource].name);
                    if(readingRecord.chapterIndex)
                    {
                        debugger;
                        book.fuzzySearch(oldMainSource, readingRecord.chapterIndex,
                            function(chapter, chapterIndex){
                                readingRecord.chapterIndex = chapterIndex;
                                readingRecord.chapterTitle = chapter.title;
                                // 刷新当前章节信息
                                loadCurrentChapter(0);
                            },
                            function(){
                                readingRecord.reset();
                                // 刷新当前章节信息
                                loadCurrentChapter(0);
                        }, options);
                    }
                    // 更新书籍信息
                    book.refreshBookInfo(null, null, {bookSourceManager: options.bookSourceManager});
                }, fail, options);
            }
        }
    }

    function loadChapter(chapterIndex, extras){
        var opts = $.extend({}, options);
        $.extend(opts, extras);
        book.getChapter(chapterIndex,
            function(chapter, index, options){
                $(".chapter-title").text(chapter.title);
                $(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));
                $('.chapter').scrollTop(readingRecord.page);
                $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
                // $("#modalCatalog").modal('hide');
                readingRecord.setReadingRecord(chapterIndex, chapter.title, options);
                app.bookShelf.save();
                cacheChapter(chapterIndex, options);
            }, fail, opts);
        if(chapterIndex != readingRecord.chapterIndex)
            readingRecord.page = 0;
    };

    function cacheChapter(chapterIndex, opts){
        // 缓存后面的章节
        opts = $.extend({}, options, opts);
        chapterIndex++;
        opts.contentSourceChapterIndex++;
        opts.count = app.settings.cacheCountEachChapter;
        book.cacheChapter(chapterIndex, app.settings.cacheChapterCount, opts);
    }

    function loadCatalog(forceRefresh){
        $('#listCatalogContainer').height($(window).height() * 0.5);

        function listCatalogEntryClick(event){
            var target = event.currentTarget;
            if(target){
                target = $(target);
                // loadChapter(target.data('index'));
                loadChapter(parseInt(target.attr('data-index')));
            }
        }
        book.getCatalog(function(catalog){
            var listCatalog = $("#listCatalog");
            var listCatalogEntry = $(".template .listCatalogEntry");
            listCatalog.empty();
            $(catalog).each(function(i){
                var lce = listCatalogEntry.clone();
                lce.text(this.title);
                // lce.data("index", i);
                lce.attr("data-index", i);
                lce.click(listCatalogEntryClick);
                listCatalog.append(lce);
                if(i == readingRecord.chapterIndex)
                {
                    lce.css("color", 'red');
                }
            });

        }, fail, {bookSourceManager: app.bookSourceManager, forceRefresh:forceRefresh});
    }

    return {
        onload: function(params, p){
            book = params.book;
            book.checkBookSources(app.bookSourceManager);
            readingRecord = params.readingRecord;
            options = {bookSourceManager: app.bookSourceManager};

            loadView();
            loadCurrentChapter();
        },
        onresume: function(){

        },
        onpause: function(){
            // 执行该事件的时候，界面可能已经被销毁了
            // 保存阅读进度
            readingRecord.page = chapterScrollY;
            app.bookShelf.save();
        },
        onclose: function(params){

        }
    };
});

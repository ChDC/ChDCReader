"use strict"
define(["jquery", "main", "page", "util", 'bookshelf'], function($, app, page, util, bookshelf){
    var book = null;
    var chapters = [];
    var readingRecord = null;
    var options = null;
    var chapterScrollY = 0;

    function fail(error){
        app.hideLoading();
        util.showError(error.message);
    }

    function loadView(){
        // var lock = false;
        // $(".chapterContainer").scroll(function(event){
        //     if(!lock && $(this).children().last().position().top <=0){
        //         lock = true;
        //         console.log('Load next chapter!');
        //     }
        // });
        // pullUpToLastChapter();
        // 将章节滚动位置存储到变量中
        $('.chapterContainer').scroll(function(){
            // TODO
            chapterScrollY = $('.chapterContainer').scrollTop();
        });

        // 弹出工具栏
        $(".chapterContainer").on("click", function(event){
            function isClickInRegion(minHeight, maxHeight)
            {
                var clientHeight = $(window).height();
                var y = event.clientY;
                minHeight *= clientHeight;
                maxHeight *= clientHeight;
                return y >= minHeight && y <= maxHeight;
            }

            if(isClickInRegion(0.33, 0.66))
            {
                // 弹出工具栏
                $('.toolbar').toggle();
            }
            else if(isClickInRegion(0, 0.33))
            {
                // 点击上半部分，向上滚动
                $('.toolbar').hide();
                var chapter = $('.chapterContainer');
                chapter.scrollTop(chapter.scrollTop() - chapter.height() / 2);
            }
            else if(isClickInRegion(0.66, 1))
            {
                // 点击下半部分，向下滚动
                $('.toolbar').hide();
                var chapter = $('.chapterContainer');
                chapter.scrollTop(chapter.scrollTop() + chapter.height() / 2);

            }
        });
        $(".toolbar").blur(function(){
            $('.toolbar').hide();
        });
        $(".toolbar").click(function(){
            $('.toolbar').hide();
        });
        $(".btnNext").click(nextChapter);
        $(".btnLast").click(lastChapter);

        // 按钮事件
        $("#btnClose").click(function(){page.closePage();});
        $("#btnBookShelf").click(function(){page.showPage("bookshelf", null, {clear: true});});
        $("#btnCatalog").click(function(){
            // $('#modalCatalog').modal('show');
            loadCatalog();
        });
        $("#btnBadChapter").click(function(){
            var opts = $.extend(true, {}, options);
            opts.excludes = [readingRecord.options.contentSourceId];
            // TODO 加载章节
            loadChapters(readingRecord.chapterIndex, opts);
        });
        $("#btnSortReversed").click(function(){
            var list = $('#listCatalog');
            list.append(list.children().toArray().reverse());
        });
        // TODO: 修改内容源
        // $("#btnChangeMainContentSource").click(function(){
        //     $("#modalBookSource").modal('show');
        //     loadBookSource("mainContentSource");
        // });
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
            if(bsk == book.mainSource)
                return;
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
                var oldMainSource = book.mainSource;
                book.setMainSource(bid, function(book){
                    // 隐藏目录窗口
                    $("#modalCatalog").modal('hide');
                    // 更新源之后
                    $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSource].name);
                    if(readingRecord.chapterIndex)
                    {
                        var opts = $.extend(true, {}, options);
                        opts.bookSourceId = oldMainSource;
                        book.fuzzySearch(book.mainSource, readingRecord.chapterIndex,
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
                        }, opts);
                    }
                    // 更新书籍信息
                    book.refreshBookInfo(null, null, options);
                }, fail, options);
            }
        }
    }

    // 加载目录
    function loadCatalog(forceRefresh){
        app.showLoading();
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
            app.hideLoading();

        }, fail, {bookSourceManager: app.bookSourceManager, forceRefresh:forceRefresh});
    }

    // 工厂函数，生成新的对象
    function buildChapterAndReadingReord(chapter, index, options){
        var nc = $('.template .chapter').clone();
        nc.find(".chapter-title").text(chapter.title);
        nc.find(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));

        var rr = new bookshelf.ReadingRecord();
        rr.setReadingRecord(index, chapter.title, options);
        return [nc, rr];
    }

    // 加载章节
    // count 是加载的章节数目
    function loadChapters(chapterIndex, count, extras){
        var opts = $.extend(true, {}, options, extras);
        var actived = false;
        book.getChapters(chapterIndex, count,
            function(chapter, index, options){
                var a = buildChapterAndReadingReord(chapter, index, options);
                $('.chapterContainer').append(a[0]);
                chapters.push(a[1]);
                if(!actived){
                    activateCurrentChapter();
                    actived = true;
                }
            },
            function(error){
                if(fail)fail(error);
            },
            function(chapter, index, options){
                cacheChapters(index, options);
            }, opts);

        // // TODO：修改
        // if(chapterIndex != readingRecord.chapterIndex)
        //     readingRecord.page = 0;
    };

    function cacheChapters(chapterIndex, opts){
        debugger;
        // 缓存后面的章节
        opts = $.extend(true, {}, options, opts);
        chapterIndex++;
        opts.contentSourceChapterIndex++;
        opts.count = app.settings.cacheCountEachChapter;
        book.cacheChapter(chapterIndex, app.settings.cacheChapterCount, opts);
    }

    // 激活当前章节，并保存信息
    function activateCurrentChapter(){
        debugger;
        $(".labelContentSource").text(app.bookSourceManager.sources[chapters[0].options.contentSourceId].name);
        var rr = chapters[0];
        $.extend(readingRecord, rr);
        app.bookShelf.save();
    }

    // 使用 ReadingReocrd 加载章节
    var loadChaptersWithReadingRecord = function(rr, count, offset){
        var count = count || 1;
        var offset = offset || 0;
        if(!rr.chapterIndex)
            rr.chapterIndex = 0;
        loadChapters(rr.chapterIndex + offset, count, {
                contentSourceId: rr.contentSourceId,
                contentSourceChapterIndex: rr.contentSourceChapterIndex + offset
            });
    };

    // 下一章节
    function nextChapter(){
        $('.chapterContainer').children().first().remove();
        chapters.shift();
        var theLast = chapters[chapters.length - 1];
        loadChaptersWithReadingRecord(theLast, 1, 1);
    }

    // 上一章节
    function lastChapter(){
        var opts = $.extend(true, {}, options);

        book.getChapter(readingRecord.chapterIndex - 1,
            function(chapter, index, options){
                var a = buildChapterAndReadingReord(chapter, index, options);
                $('.chapterContainer').prepend(a[0]);
                chapters.unshift(a[1]);

                $('.chapterContainer').children().last().remove();
                chapters.pop();

                activateCurrentChapter();
            },
            function(error){
                if(fail)fail(error);
            }, opts);
    }

    // function saveReadingRecord(chapter, index, options){
        // 保存进度
        // TODO：滚动事件需要修改
        // $('.chapterContainer').scrollTop(readingRecord.page);
    // }

    return {
        onload: function(params, p){
            book = params.book;
            book.checkBookSources(app.bookSourceManager);
            readingRecord = params.readingRecord;
            options = {bookSourceManager: app.bookSourceManager};
            loadView();
            loadChaptersWithReadingRecord(readingRecord, 3);
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

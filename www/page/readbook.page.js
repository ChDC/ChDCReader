"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){
    var book = null;
    var readingRecord = null;
    var options = null;
    var chapterScrollY = 0;

    function fail(error){
        app.hideLoading();
        util.showError(error.message);
    }

    function loadView(){
        var lock = false;
        $(".chapterContainer").scroll(function(event){
            if(!lock && $(this).children().last().position().top <=0){
                lock = true;
                console.log('Load next chapter!');
            }
        });
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
            var opts = $.extend(true, {}, options);
            opts.excludes = [readingRecord.options.contentSourceId];
            loadChapter(readingRecord.chapterIndex, opts);
        });
        $("#btnSortReversed").click(function(){
            var list = $('#listCatalog');
            list.append(list.children().toArray().reverse());
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
                    $("#modalCatalog").modal('hide');
                    // 更新源之后
                    // 刷新主目录源显示内容
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
        // loadCurrentChapter(1);
        exchangePages();
        loadSecondPageChapter(chapterIndex, opts,
            function(){
                cacheChapter(chapterIndex, options);
            },
            function(){

            }, opts2);
    }

    function btnLast(event){
        loadCurrentChapter(-1);
    }

    // function pullUpToLastChapter(){

    // }




    function saveReadingRecord(chapter, index, options){
        // 保存进度
        $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
        // TODO：滚动事件需要修改
        // $('.chapterContainer').scrollTop(readingRecord.page);
        readingRecord.setReadingRecord(chapterIndex, chapter.title, options);
        app.bookShelf.save();
    }

    // 加载第二页内容
    function loadSecondPageChapter(chapterIndex, extras, success, fail){
        debugger;
        var opts = $.extend(true, {}, options);
        $.extend(true, opts, extras);
        book.getChapter(chapterIndex,
            function(chapter, index, options){
                $(".chapterContainer > div:nth-child(2) .chapter-title").text(chapter.title);
                $(".chapterContainer > div:nth-child(2) .chapter-content").html(util.text2html(chapter.content, 'chapter-p'));
                if(success)success(chapter, index, options);
            },
            function(error){
                if(fail)fail();
            }, opts);
    }

    // 交换第一页和第二页
    function exchangePages(){
        // TODO
    }

    function loadChapter(chapterIndex, extras){
        var opts = $.extend(true, {}, options);
        $.extend(true, opts, extras);
        opts.onGetRemoteChapterContent = function(){
            app.showLoading();
        };
        opts.onGottenRemoteChapterContent = function(){
            app.hideLoading();
        };

        loadSecondPageChapter(chapterIndex, opts,
            function(){
                // 将第一页换成第二页
                exchangePages();
                // 再次加载第二页
                // 成功后
                saveReadingRecord();
                // TODO
                loadSecondPageChapter(chapterIndex, opts,
                    function(){
                        cacheChapter(chapterIndex, options);
                    },
                    function(){

                    }, opts2);
            },
            function(){

            });

        // TODO：修改
        if(chapterIndex != readingRecord.chapterIndex)
            readingRecord.page = 0;
    };

    function cacheChapter(chapterIndex, opts){
        // 缓存后面的章节
        opts = $.extend(true, {}, options, opts);
        chapterIndex++;
        opts.contentSourceChapterIndex++;
        opts.count = app.settings.cacheCountEachChapter;
        book.cacheChapter(chapterIndex, app.settings.cacheChapterCount, opts);
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

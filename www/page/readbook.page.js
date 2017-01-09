"use strict"
define(["jquery", "main", "page", "util", 'bookshelf', 'infinitelist'], function($, app, page, util, bookshelf, Infinitelist){

    var options = null;  // 默认传递的选项参数
    var book = null;
    var readingRecord = null; // 正在读的记录
    var chapterList = null; // 无限列表
    var pageScrollTop = 0;
    var lastSavePageScrollTop = 0;


    function fail(error){
        app.hideLoading();
        util.showError(error.message);
    }

    function getPageScorllTop(){
        if(chapterList.currentItem)
            return $('.chapterContainer').scrollTop() - chapterList.currentItem.position().top;
        else
            return 0;
    }

    function loadView(){
        initList();

        $('.chapterContainer').on('scroll', function(event){
            // 将章节滚动位置存储到变量中
            pageScrollTop = getPageScorllTop();
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
                var cc = $('.chapterContainer');
                cc.scrollTop(cc.scrollTop() - cc.height() / 2);
            }
            else if(isClickInRegion(0.66, 1))
            {
                // 点击下半部分，向下滚动
                $('.toolbar').hide();
                var cc = $('.chapterContainer');
                cc.scrollTop(cc.scrollTop() + cc.height() / 2);

            }
        });
        $(".toolbar").blur(function(){
            $('.toolbar').hide();
        });
        $(".toolbar.top, .toolbar.bottom").click(function(){
            $('.toolbar').hide();
        });
        $(".toolbar.lastAndNextChapter").click(function(){
            $('.toolbar.top, .toolbar.bottom').hide();
        });
        $(".btnNext").click(nextChapter);
        $(".btnLast").click(lastChapter);

        // 按钮事件
        $("#btnClose").click(function(){page.closePage();});

        $("#btnCatalog").click(function(){
            // $('#modalCatalog').modal('show');
            loadCatalog();
        });
        $("#btnBadChapter").click(function(){
            debugger;
            chapterList.emptyList();
            chapterList.loadList({
                excludes: [readingRecord.options.contentSourceId]
            });
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
                var chapterIndex = parseInt(target.attr('data-index'));
                readingRecord.chapterIndex = chapterIndex;
                chapterList.emptyList();
                chapterList.loadList();
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


    function initList(){
        chapterList = new Infinitelist(
            $('.chapterContainer'),
            $('.chapters'),
            onNewChapterItem
        );
        chapterList.onCurrentItemChanged = function(event, newValue, oldValue){
            var index = newValue.data('chapterIndex');
            var title = newValue.data('chapterTitle');
            var options = newValue.data('options');
            readingRecord.setReadingRecord(index, title, options);
            readingRecord.pageScrollTop = pageScrollTop;
            app.bookShelf.save();

            $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
        }
    }

    function onNewChapterItem(event, be, direction, success){
        var opts = $.extend(true, {}, options);
        var chapterIndex = 0;
        if(be){
            $.extend(opts, be.data('options'));
            chapterIndex = be.data('chapterIndex') + (direction >= 0? 1 : -1);
            if('contentSourceChapterIndex' in opts){
                opts.contentSourceChapterIndex += direction >= 0? 1 : -1;
            }
        }
        else{
            $.extend(opts, readingRecord.options);
            chapterIndex = readingRecord.chapterIndex;
        }

        book.getChapter(chapterIndex,
            function(chapter, index, options){
                var newItem = buildChapter(chapter, index, options);
                success(newItem);
                if(!be && lastSavePageScrollTop){
                    var cs = $('.chapterContainer').scrollTop();
                    $('.chapterContainer').scrollTop(cs + lastSavePageScrollTop);
                    lastSavePageScrollTop = 0;
                }
            },
            function(error){
                success(null);
                // fail(error);
            }, opts);

    }

    function buildChapter(chapter, index, options){
        var nc = $('.template .chapter').clone();
        nc.find(".chapter-title").text(chapter.title);
        nc.find(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));
        nc.data('chapterIndex', index);
        nc.data('chapterTitle', chapter.title);
        nc.data('options', options);
        return nc;
    }

    // 下一章节
    function nextChapter(){
        chapterList.nextItem();
    }

    // 上一章节
    function lastChapter(){
        chapterList.lastItem();
    }

    return {
        onload: function(params, p){
            book = params.book;
            book.checkBookSources(app.bookSourceManager);
            readingRecord = params.readingRecord;
            options = {bookSourceManager: app.bookSourceManager};

            loadView();
            lastSavePageScrollTop = readingRecord.pageScrollTop;
            chapterList.loadList();

        },
        onresume: function(){

        },
        onpause: function(){
            // 执行该事件的时候，界面可能已经被销毁了
            // 保存阅读进度
            readingRecord.pageScrollTop = pageScrollTop;
            app.bookShelf.save();
        },
        onclose: function(params){

        }
    };
});

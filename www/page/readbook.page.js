"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){
    var book = null;
    var readingRecord = null;
    var options = null;
    var chapterScrollY = 0;

    function fail(error){
        util.showError(error.message);
    }

    // 设置正在读的章节
    var setReadingRecord = function(chapterIndex, chapterTitle){
        readingRecord.chapterIndex = chapterIndex;
        readingRecord.chapterTitle = chapterTitle;
    };

    // 获取当前章节
    var loadCurrentChapter = function(offset){
        var offset = offset || 0;
        if(!readingRecord.chapterIndex)
            readingRecord.chapterIndex = 0;
        loadChapter(readingRecord.chapterIndex + offset);
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
                                readingRecord.chapterIndex = 0;
                                readingRecord.chapterTitle = "";

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

    function loadChapter(chapterIndex){
        book.getChapter(chapterIndex,
            function(chapter, index, contentSourceId, contentSourceChapterIndex){
                setReadingRecord(chapterIndex, chapter.title);
                app.bookShelf.save();
                $(".chapter-title").text(chapter.title);
                $(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));
                $('.chapter').scrollTop(readingRecord.page);
                $(".labelContentSource").text(app.bookSourceManager.sources[contentSourceId].name);
                // $("#modalCatalog").modal('hide');
            }, fail, options);
        if(chapterIndex != readingRecord.chapterIndex)
            readingRecord.page = 0;
    };

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

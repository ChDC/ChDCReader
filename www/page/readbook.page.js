"use strict"
define(["jquery", "main", "page", "util", 'bookshelf'], function($, app, page, util, bookshelf){

    var options = null;  // 默认传递的选项参数
    var book = null;
    var readingRecord = null; // 正在读的记录

    var chapters = [];  // 当前加载的章节
    var chapterElements = null;
    var chapterScrollY = 0;  // 当前阅读进度

    var DOWN_THRESHOLD = 3; // 向下加载章节的长度的阈值
    var UP_THRESHOLD = 1; // 向下加载章节的长度的阈值


    function fail(error){
        app.hideLoading();
        util.showError(error.message);
    }

    function loadView(){
        chapterElements = $('.chapters');
        $('.chapterContainer').scroll(function(event){
            // 将章节滚动位置存储到变量中
            chapterScrollY = $('.chapterContainer').scrollTop();

            // TODO
            // var cn = getCurrentChapterElement(1);
            // var cc = getCurrentChapterElement(0);
            // if(cn){
            //     if(chapterScrollY > cn.position().top || cn.offset().top + cn.height() <= $(window).height()){
            //         util.log("Next chapter");
            //         nextChapter();
            //     }
            // }
            // if(cc && chapterScrollY){
            //     if(chapterScrollY + $(window).height()/2 < cc.position().top){
            //         util.log("Last chapter");
            //         lastChapter();
            //     }
            // }
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
        $(".toolbar").click(function(){
            $('.toolbar').hide();
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
            clearChapters();
            loasChapters({
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
                clearChapters();
                loadChapters();
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


    // 向下、上检查
    function checkBoundary(direction){
        function isBoundarySatisfied(){
            var es = chapterElements.children();
            var be = direction >= 0 ? es.last() : es.first();
            var wh = $(window).height();
            var result = false;
            if(direction >= 0)
                result = be.offset().top > (DOWN_THRESHOLD + 1) * wh;
            else
                result = be.offset().top < -UP_THRESHOLD * wh;
            return result;
        }
        if(!isBoundarySatisfied()){

            var bc = direction >= 0 ? chapters[chapters.length - 1] : chapters[0];
            var opts = $.extend(true, {}, options, bc.options);
            opts.contentSourceChapterIndex += (direction >= 0? 1 : -1);
            var chapterIndex = bc.chapterIndex + (direction >= 0? 1 : -1);

            book.getCountlessChapters(chapterIndex, direction,
                function(chapter, index, options){
                    if(!chapter)
                        return;
                    var a = buildChapterAndReadingReord(chapter, index, options);
                    if(direction >= 0){
                        chapterElements.append(a[0]);
                        chapters.push(a[1]);
                        // 当向下获取章节的时候缓存章节
                        // cacheChapters(index, options);
                    }
                    else{
                        chapterElements.prepend(a[0]);
                        chapters.unshift(a[1]);
                        activateCurrentChapter();
                    }
                    return !isBoundarySatisfied();
                },
                function(error){
                    return fail(error);
                },
                function(){
                    // finish
                }, opts);
        }
    }

    function loadChapters(extras){
        var cc = getCurrentChapter();
        if(!cc){
            app.showLoading();

            var opts = $.extend(true, {}, options, readingRecord.options, extras);
            // 加载当前正在读的章节
            book.getChapter(readingRecord.chapterIndex,
                function(chapter, index, options){
                    var a = buildChapterAndReadingReord(chapter, index, options);
                    chapterElements.append(a[0]);
                    chapters.push(a[1]);

                    // 当向下获取章节的时候缓存章节
                    // cacheChapters(index, options);
                    app.hideLoading()
                    $.extend(readingRecord, a[1]);
                    activateCurrentChapter();
                    // app.bookShelf.save();
                    checkBoundary(1);
                    checkBoundary(-1);
                }, fail, opts);
        }
        else{
            checkBoundary(1);
            checkBoundary(-1);
        }
    }

    function clearChapters(){
        // Clear
        chapters.length = 0;
        chapterElements.empty();
    }

    // function cacheChapters(chapterIndex, opts){
    //     // 缓存后面的章节
    //     opts = $.extend(true, {}, options, opts);
    //     chapterIndex++;
    //     opts.contentSourceChapterIndex++;
    //     opts.count = app.settings.cacheCountEachChapter;
    //     book.cacheChapter(chapterIndex, app.settings.cacheChapterCount, opts);
    // }

    // 获取当前的章节元素
    // function getCurrentChapterElement(offset){

    //     var offset = offset || 0;
    //     var i = util.arrayIndex(chapters, readingRecord, function(i1, i2){
    //         return i1.chapterIndex == i2.chapterIndex;
    //     });
    //     i = i + offset;

    //     var cs = $('.chapters').children();
    //     if(i >=0 && i < cs.length)
    //         return cs.eq(i);
    //     return null;
    // }

    // 获取当前章节
    function getCurrentChapter(offset){
        var offset = offset || 0;
        var i = util.arrayIndex(chapters, readingRecord, function(i1, i2){
            return i1.chapterIndex == i2.chapterIndex;
        });
        i = i + offset;
        if(i < 0)
            return null;
        else if(i > chapters.length)
            return null;
        return [chapters[i], chapterElements.children().eq(i)];
    }

    // 激活当前章节，并保存信息
    function activateCurrentChapter(){
        var cc = getCurrentChapter();
        if(cc){
            $('.chapterContainer').scrollTop(cc[1].position().top)
            $(".labelContentSource").text(app.bookSourceManager.sources[cc[0].options.contentSourceId].name);
        }
    }

    function showCurrentChapter(offset){
        // var showed = false;
        // var cc = getCurrentChapter(offset);
        // if(cc){
        //     if(chapters.length >= app.settings.chapterCount){
        //         if(offset > 0){
        //             $('.chapters').children().first().remove();
        //             chapters.shift();
        //         }
        //         else if(offset < 0){
        //             $('.chapters').children().last().remove();
        //             chapters.pop();
        //         }
        //     }
        //     readingRecord.chapterIndex += offset;
        //     showed = true;
        //     activateCurrentChapter();
        // }


        // var opts = $.extend(true, {}, options);
        // var ct = offset > 0 ? chapters[chapters.length - 1] : chapters[0];
        // var ci = ct.chapterIndex + offset;
        // book.getChapter(ci,
        //     function(chapter, index, options){
        //         var a = buildChapterAndReadingReord(chapter, index, options);
        //         if(offset > 0){
        //             $('.chapters').append(a[0]);
        //             chapters.push(a[1]);
        //             // 当向下获取章节的时候缓存章节
        //             cacheChapters(index, options);
        //         }
        //         else if(offset < 0){
        //             $('.chapters').prepend(a[0]);
        //             chapters.unshift(a[1]);
        //             activateCurrentChapter();
        //         }
        //         if(!showed){
        //             readingRecord.chapterIndex += offset;
        //             activateCurrentChapter();
        //         }

        //         if(index == readingRecord.chapterIndex){
        //             app.hideLoading();
        //             $.extend(readingRecord, a[1]);
        //             // activateCurrentChapter();
        //         }
        //         app.bookShelf.save();
        //     },
        //     function(error){
        //         if(fail)fail(error);
        //     }, opts);
    }

    // 下一章节
    function nextChapter(){
        showCurrentChapter(1);
    }

    // 上一章节
    function lastChapter(){
        showCurrentChapter(-1);
    }


    return {
        onload: function(params, p){
            book = params.book;
            book.checkBookSources(app.bookSourceManager);
            readingRecord = params.readingRecord;
            options = {bookSourceManager: app.bookSourceManager};
            loadView();
            loadChapters();

            // var pageLocation = readingRecord.pageScrollTop;
            // loadChapters(readingRecord.chapterIndex, app.settings.chapterCount, -app.settings.chapterIndexOffset,
            //     function(chapter, index, options){
            //         if(index == readingRecord.chapterIndex && pageLocation > 0){
            //             $('.chapterContainer').scrollTop(pageLocation);
            //         }
            //     },
            //     fail, readingRecord.options);
        },
        onresume: function(){

        },
        onpause: function(){
            // 执行该事件的时候，界面可能已经被销毁了
            // 保存阅读进度
            readingRecord.pageScrollTop = chapterScrollY;
            app.bookShelf.save();
        },
        onclose: function(params){

        }
    };
});

"use strict"
define(["jquery", "main", "page", "util", 'infinitelist'], function($, app, page, util, Infinitelist){

    let options = null;  // 默认传递的选项参数
    let tmpOptions = null;  // 默认传递的选项参数

    let book = null;
    let readingRecord = null; // 正在读的记录
    let chapterList = null; // 无限列表
    let lastSavePageScrollTop = 0;

    function loadView(){
        initList();

        // 弹出工具栏
        $(".chapterContainer").on("click", event => {
            // function isClickInRegion(minHeight, maxHeight)
            // {
            //     let clientHeight = $(window).height();
            //     let y = event.clientY;
            //     minHeight *= clientHeight;
            //     maxHeight *= clientHeight;
            //     return y >= minHeight && y <= maxHeight;
            // }

            // if(isClickInRegion(0.33, 0.66))
            // {
                // 弹出工具栏
                $('.toolbar').toggle();
            // }
            // else if(isClickInRegion(0, 0.33))
            // {
            //     // 点击上半部分，向上滚动
            //     $('.toolbar').hide();
            //     let cc = $('.chapterContainer');
            //     cc.scrollTop(cc.scrollTop() - cc.height() / 2);
            // }
            // else if(isClickInRegion(0.66, 1))
            // {
            //     // 点击下半部分，向下滚动
            //     $('.toolbar').hide();
            //     let cc = $('.chapterContainer');
            //     cc.scrollTop(cc.scrollTop() + cc.height() / 2);

            // }
        });
        $(".toolbar").blur((e) => $('.toolbar').hide());
        $(".toolbar").click((e) => $('.toolbar').hide());

        $(".btnNext").click(nextChapter);
        $(".btnLast").click(lastChapter);

        // 按钮事件
        $("#btnClose").click((e) => page.closePage());

        $("#btnCatalog").click((e) => loadCatalog());
        $("#btnToggleNight").click(e => {
            app.settings.settings.night = !app.settings.settings.night;
            app.settings.save();
            $("#labelNight").text(app.settings.settings.night? "白天": "夜间");
            page.setTheme(app.settings.settings.night ? app.settings.settings.nighttheme : app.settings.settings.daytheme);
        });
        $("#btnBadChapter").click(e => {
            chapterList.emptyList();
            app.showLoading();
            tmpOptions = {
                excludes: [readingRecord.options.contentSourceId]
            }
            chapterList.loadList();
        });
        $("#btnSortReversed").click((e) => {
            let list = $('#listCatalog');
            list.append(list.children().toArray().reverse());
        });
        // TODO: 修改内容源
        // $("#btnChangeMainContentSource").click(function(){
        //     $("#modalBookSource").modal('show');
        //     loadBookSource("mainContentSource");
        // });
        $("#btnChangeMainSource").click(() => {
            $("#modalBookSource").modal('show');
            loadBookSource();
        });
        $('#modalCatalog').on('shown.bs.modal', e => {
            let targetChapter = $('#listCatalog > [data-index=' + readingRecord.chapterIndex + ']');
            let top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
            $('#listCatalogContainer').scrollTop(top);
            // $("#modalCatalog .modal-body").css("height", $());
        });
        $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSourceId].name);
        $("#btnRefreshCatalog").click(() => loadCatalog(true));
    };

    // 加载内容源列表
    function loadBookSource(){
        let listBookSource = $("#listBookSource");
        listBookSource.empty();
        let listBookSourceEntry = $(".template .listBookSourceEntry");
        for(let bsk in app.bookSourceManager.sources){
            if(bsk == book.mainSourceId)
                continue;
            let nlbse = listBookSourceEntry.clone();
            let bs = app.bookSourceManager.sources[bsk];
            nlbse.find(".bookSourceTitle").text(bs.name);
            let lastestChapter = "";
            // TODO: 最新章节
            nlbse.find(".bookSourceLastestChapter").text(lastestChapter);
            nlbse.data("bsid", bsk);
            nlbse.click(changeMainContentSourceClickEvent);
            listBookSource.append(nlbse);
        };

        function changeMainContentSourceClickEvent(event){
            let target = event.currentTarget;
            if(!target)
                return;
            let bid = $(target).data('bsid');
            let oldMainSource = book.mainSourceId;
            book.setMainSourceId(bid, options)
                .then(book => {
                    app.bookShelf.save();
                    // 隐藏目录窗口
                    $("#modalCatalog").modal('hide');
                    // 更新源之后
                    $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSourceId].name);
                    if(readingRecord.chapterIndex){
                        let opts = $.extend(true, {}, options);
                        opts.bookSourceId = oldMainSource;
                        book.fuzzySearch(book.mainSourceId, readingRecord.chapterIndex, opts)
                            .then(({chapter, index}) => {
                                readingRecord.chapterIndex = index;
                                readingRecord.chapterTitle = chapter.title;
                                // 刷新当前章节信息
                                loadCurrentChapter(0);
                            })
                            .catch(error => {
                                readingRecord.reset();
                                // 刷新当前章节信息
                                loadCurrentChapter(0);
                            });
                    }
                    else{
                        chapterList.loadList();
                    }
                    // 更新书籍信息
                    book.refreshBookInfo(options);
                })
                .catch(error => util.showError(app.error.getMessage(error)));
        }
    }

    // 加载目录
    function loadCatalog(forceRefresh){

        function listCatalogEntryClick(event){
            let target = event.currentTarget;
            if(!target)
                return;

            target = $(target);
            let chapterIndex = parseInt(target.attr('data-index'));
            readingRecord.chapterIndex = chapterIndex;
            chapterList.emptyList();
            app.showLoading();
            chapterList.loadList();
        }

        app.showLoading();
        $('#listCatalogContainer').height($(window).height() * 0.5);

        return book.getCatalog({bookSourceManager: app.bookSourceManager, forceRefresh:forceRefresh})
            .then(catalog => {
                let listCatalog = $("#listCatalog");
                let listCatalogEntry = $(".template .listCatalogEntry");
                listCatalog.empty();
                $(catalog).each(function(i){
                    let lce = listCatalogEntry.clone();
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
                app.hideLoading()
            })
            .catch(error => {
                util.showError(app.error.getMessage(error));
                app.hideLoading()
            });
    }


    function initList(){
        chapterList = new Infinitelist(
            $('.chapterContainer'),
            $('.chapters'),
            onNewChapterItem,
            onNewChapterItemFinished
        );
        chapterList.onCurrentItemChanged = (event, newValue, oldValue) => {
            let index = newValue.data('chapterIndex');
            let title = newValue.data('chapterTitle');
            let options = newValue.data('options');
            readingRecord.setReadingRecord(index, title, options);
            readingRecord.pageScrollTop = chapterList.getPageScorllTop();
            // app.bookShelf.save();
            $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
            $(".labelChapterTitle").text(title);
            app.hideLoading();
        }
    }

    function onNewChapterItem(event, be, direction){

        let opts = $.extend(true, {}, options, tmpOptions);
        tmpOptions = null;
        let chapterIndex = 0;
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

        return book.getChapter(chapterIndex, opts)
            .then(({chapter, title, index, options}) => {
                let newItem = buildChapter(chapter, title, index, options);
                return {newItem};
            })
            .catch(error => {
                app.hideLoading();
                util.showError(app.error.getMessage(error));
                if(error == 202 || error == 203 || error == 201){
                    return {newItem: null, type: 1};
                }
                else{
                    return ({newItem: null});
                }
            });
    }

    function onNewChapterItemFinished(event, be, direction){
        if(!be && lastSavePageScrollTop){
            let cs = $('.chapterContainer').scrollTop();
            $('.chapterContainer').scrollTop(cs + lastSavePageScrollTop);
            lastSavePageScrollTop = 0;
        }
    }

    function buildChapter(chapter, title, index, options){
        let nc = $('.template .chapter').clone();
        nc.find(".chapter-title").text(chapter.title);
        nc.find(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));
        // nc.find(".chapter-source").text(app.bookSourceManager.sources[options.contentSourceId].name);

        nc.data('chapterIndex', index);
        nc.data('chapterTitle', title);
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

    function onPause(){
        // 保存阅读进度
        readingRecord.pageScrollTop = chapterList.getPageScorllTop();
    }

    return {
        onload(params, p){
            book = params.book;
            book.checkBookSources(app.bookSourceManager);
            readingRecord = params.readingRecord;
            options = {bookSourceManager: app.bookSourceManager};

            loadView();
            lastSavePageScrollTop = readingRecord.pageScrollTop;
            app.showLoading();
            chapterList.loadList();

        },
        onresume(){
            document.addEventListener("pause", onPause, false);
        },
        onpause(){
            readingRecord.pageScrollTop = chapterList.getPageScorllTop();
            document.removeEventListener("pause", onPause, false);
        },
        onclose(params){

        }
    };
});

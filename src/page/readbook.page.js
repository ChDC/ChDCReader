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
            //     const clientHeight = $(window).height();
            //     const y = event.clientY;
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
            //     const cc = $('.chapterContainer');
            //     cc.scrollTop(cc.scrollTop() - cc.height() / 2);
            // }
            // else if(isClickInRegion(0.66, 1))
            // {
            //     // 点击下半部分，向下滚动
            //     $('.toolbar').hide();
            //     const cc = $('.chapterContainer');
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
            const list = $('#listCatalog');
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
            const targetChapter = $('#listCatalog > [data-index=' + readingRecord.chapterIndex + ']');
            const top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
            $('#listCatalogContainer').scrollTop(top);
            // $("#modalCatalog .modal-body").css("height", $());
        });
        $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSourceId].name);
        $("#btnRefreshCatalog").click(() => loadCatalog(true));
    };

    // 加载内容源列表
    function loadBookSource(){
        const listBookSource = $("#listBookSource");
        listBookSource.empty();
        const listBookSourceEntry = $(".template .listBookSourceEntry");
        for(const bsk in app.bookSourceManager.sources){
            if(bsk == book.mainSourceId)
                continue;
            const nlbse = listBookSourceEntry.clone();
            const bs = app.bookSourceManager.sources[bsk];
            nlbse.find(".bookSourceTitle").text(bs.name);
            const lastestChapter = "";
            // TODO: 最新章节
            nlbse.find(".bookSourceLastestChapter").text(lastestChapter);
            nlbse.data("bsid", bsk);
            nlbse.click(changeMainContentSourceClickEvent);
            listBookSource.append(nlbse);
        };

        function changeMainContentSourceClickEvent(event){
            const target = event.currentTarget;
            if(!target)
                return;
            const bid = $(target).data('bsid');
            const oldMainSource = book.mainSourceId;
            book.setMainSourceId(bid, options)
                .then(book => {
                    app.bookShelf.save();
                    // 隐藏目录窗口
                    $("#modalCatalog").modal('hide');
                    // 更新源之后
                    $(".labelMainSource").text(app.bookSourceManager.sources[book.mainSourceId].name);
                    if(readingRecord.chapterIndex){
                        const opts = Object.assign({}, options);
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
            const chapterIndex = parseInt(target.attr('data-index'));
            readingRecord.chapterIndex = chapterIndex;
            chapterList.emptyList();
            app.showLoading();
            chapterList.loadList();
        }

        app.showLoading();
        $('#listCatalogContainer').height($(window).height() * 0.5);

        return book.getCatalog({bookSourceManager: app.bookSourceManager, forceRefresh:forceRefresh})
            .then(catalog => {
                const listCatalog = $("#listCatalog");
                const listCatalogEntry = $(".template .listCatalogEntry");
                listCatalog.empty();
                $(catalog).each(function(i){
                    const lce = listCatalogEntry.clone();
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
            const index = newValue.data('chapterIndex');
            const title = newValue.data('chapterTitle');
            const options = newValue.data('options');
            readingRecord.setReadingRecord(index, title, options);
            readingRecord.pageScrollTop = chapterList.getPageScorllTop();
            // app.bookShelf.save();
            $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
            $(".labelChapterTitle").text(title);
            app.hideLoading();
        }
    }

    function onNewChapterItem(event, be, direction){

        const opts = Object.assign({}, options, tmpOptions);
        tmpOptions = null;
        let chapterIndex = 0;
        if(be){
            Object.assign(opts, be.data('options'));
            chapterIndex = be.data('chapterIndex') + (direction >= 0? 1 : -1);
            if('contentSourceChapterIndex' in opts){
                opts.contentSourceChapterIndex += direction >= 0? 1 : -1;
            }
        }
        else{
            Object.assign(opts, readingRecord.options);
            chapterIndex = readingRecord.chapterIndex;
        }

        return book.getChapter(chapterIndex, opts)
            .then(({chapter, title, index, options}) => {
                const newItem = buildChapter(chapter, title, index, options);
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
            const cs = $('.chapterContainer').scrollTop();
            $('.chapterContainer').scrollTop(cs + lastSavePageScrollTop);
            lastSavePageScrollTop = 0;
        }
    }

    function buildChapter(chapter, title, index, options){
        const nc = $('.template .chapter').clone();
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
            app.bookShelf.save();
        },
        onclose(params){

        }
    };
});

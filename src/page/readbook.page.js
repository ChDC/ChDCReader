"use strict"
define(["jquery", "main", "Page", "util", 'infinitelist'], function($, app, Page, util, Infinitelist){

    class MyPage extends Page{

        constructor(){
            super();

            this.options = null;  // 默认传递的选项参数
            this.tmpOptions = null;  // 默认传递的选项参数
            this.book = null;
            this.readingRecord = null; // 正在读的记录
            this.chapterList = null; // 无限列表
            this.lastSavePageScrollTop = 0;
        }

        onload(params, p){
            this.book = params.book;
            this.book.checkBookSources(app.bookSourceManager);
            this.readingRecord = params.readingRecord;
            this.options = {bookSourceManager: app.bookSourceManager};

            this.loadView();
            this.lastSavePageScrollTop = this.readingRecord.pageScrollTop;
            app.showLoading();
            this.chapterList.loadList();

        }

        onresume(){
            document.addEventListener("pause", this.onDevicePause, false);
        }

        onpause(){
            this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
            document.removeEventListener("pause", this.onDevicePause, false);
            app.bookShelf.save();
        }


        onDevicePause(){
            // 保存阅读进度
            this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
        }

        loadView(){
            this.initList();

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

            $(".btnNext").click(this.nextChapter.bind(this));
            $(".btnLast").click(this.lastChapter.bind(this));

            // 按钮事件
            $("#btnClose").click((e) => app.page.closePage());

            $("#btnCatalog").click((e) => this.loadCatalog());
            $("#btnToggleNight").click(e => {
                app.settings.settings.night = !app.settings.settings.night;
                app.settings.save();
                $("#labelNight").text(app.settings.settings.night? "白天": "夜间");
                app.page.setTheme(app.settings.settings.night ? app.settings.settings.nighttheme : app.settings.settings.daytheme);
            });
            $("#btnBadChapter").click(e => {
                this.chapterList.emptyList();
                app.showLoading();
                this.tmpOptions = {
                    excludes: [this.readingRecord.options.contentSourceId]
                }
                this.chapterList.loadList();
            });
            $("#btnSortReversed").click((e) => {
                const list = $('#listCatalog');
                list.append(list.children().toArray().reverse());
            });
            // TODO: 修改内容源
            // $("#btnChangeMainContentSource").click(function(){
            //     $("#modalBookSource").modal('show');
            //     this.loadBookSource("mainContentSource");
            // });
            $("#btnChangeMainSource").click(() => {
                $("#modalBookSource").modal('show');
                this.loadBookSource();
            });
            $('#modalCatalog').on('shown.bs.modal', e => {
                const targetChapter = $('#listCatalog > [data-index=' + this.readingRecord.chapterIndex + ']');
                const top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
                $('#listCatalogContainer').scrollTop(top);
                // $("#modalCatalog .modal-body").css("height", $());
            });
            $(".labelMainSource").text(app.bookSourceManager.sources[this.book.mainSourceId].name);
            $("#btnRefreshCatalog").click(() => this.loadCatalog(true));
        };

        // 加载内容源列表
        loadBookSource(){
            let changeMainContentSourceClickEvent = (event) => {
                const target = event.currentTarget;
                if(!target)
                    return;
                const bid = $(target).data('bsid');
                const oldMainSource = this.book.mainSourceId;
                this.book.setMainSourceId(bid, this.options)
                    .then(book => {
                        app.bookShelf.save();
                        // 隐藏目录窗口
                        $("#modalCatalog").modal('hide');
                        // 更新源之后
                        $(".labelMainSource").text(app.bookSourceManager.sources[this.book.mainSourceId].name);
                        if(this.readingRecord.chapterIndex){
                            const opts = Object.assign({}, this.options);
                            opts.bookSourceId = oldMainSource;
                            this.book.fuzzySearch(this.book.mainSourceId, this.readingRecord.chapterIndex, opts)
                                .then(({chapter, index}) => {
                                    this.readingRecord.chapterIndex = index;
                                    this.readingRecord.chapterTitle = chapter.title;
                                    // 刷新当前章节信息
                                    loadCurrentChapter(0);
                                })
                                .catch(error => {
                                    this.readingRecord.reset();
                                    // 刷新当前章节信息
                                    loadCurrentChapter(0);
                                });
                        }
                        else{
                            this.chapterList.loadList();
                        }
                        // 更新书籍信息
                        this.book.refreshBookInfo(this.options);
                    })
                    .catch(error => util.showError(app.error.getMessage(error)));
            }

            const listBookSource = $("#listBookSource");
            listBookSource.empty();
            const listBookSourceEntry = $(".template .listBookSourceEntry");
            for(const bsk in app.bookSourceManager.sources){
                if(bsk == this.book.mainSourceId)
                    continue;
                const nlbse = listBookSourceEntry.clone();
                const bs = app.bookSourceManager.sources[bsk];
                nlbse.find(".bookSourceTitle").text(bs.name);
                const lastestChapter = "";
                // TODO: 最新章节
                nlbse.find(".bookSourceLastestChapter").text(lastestChapter);
                nlbse.data("bsid", bsk);
                nlbse.click(changeMainContentSourceClickEvent.bind(this));
                listBookSource.append(nlbse);
            };
        }

        // 加载目录
        loadCatalog(forceRefresh){

            let listCatalogEntryClick = (event) => {
                let target = event.currentTarget;
                if(!target)
                    return;

                target = $(target);
                const chapterIndex = parseInt(target.attr('data-index'));
                this.readingRecord.chapterIndex = chapterIndex;
                this.chapterList.emptyList();
                app.showLoading();
                this.chapterList.loadList();
            }

            app.showLoading();
            $('#listCatalogContainer').height($(window).height() * 0.5);

            return this.book.getCatalog({bookSourceManager: app.bookSourceManager, forceRefresh:forceRefresh})
                .then(catalog => {
                    const listCatalog = $("#listCatalog");
                    const listCatalogEntry = $(".template .listCatalogEntry");
                    listCatalog.empty();
                    catalog.forEach((value, i) => {
                        const lce = listCatalogEntry.clone();
                        lce.text(value.title);
                        // lce.data("index", i);
                        lce.attr("data-index", i);
                        lce.click(listCatalogEntryClick.bind(this));
                        listCatalog.append(lce);
                        if(i == this.readingRecord.chapterIndex)
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


        initList(){
            this.chapterList = new Infinitelist(
                $('.chapterContainer'),
                $('.chapters'),
                this.onNewChapterItem.bind(this),
                this.onNewChapterItemFinished.bind(this)
            );
            this.chapterList.onCurrentItemChanged = (event, newValue, oldValue) => {
                const index = newValue.data('chapterIndex');
                const title = newValue.data('chapterTitle');
                const options = newValue.data('options');
                this.readingRecord.setReadingRecord(index, title, options);
                this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
                // app.bookShelf.save();
                $(".labelContentSource").text(app.bookSourceManager.sources[options.contentSourceId].name);
                $(".labelChapterTitle").text(title);
                app.hideLoading();
            }
        }

        onNewChapterItem(event, be, direction){

            const opts = Object.assign({}, this.options, this.tmpOptions);
            this.tmpOptions = null;
            let chapterIndex = 0;
            if(be){
                Object.assign(opts, be.data('options'));
                chapterIndex = be.data('chapterIndex') + (direction >= 0? 1 : -1);
                if('contentSourceChapterIndex' in opts){
                    opts.contentSourceChapterIndex += direction >= 0? 1 : -1;
                }
            }
            else{
                Object.assign(opts, this.readingRecord.options);
                chapterIndex = this.readingRecord.chapterIndex;
            }

            return this.book.getChapter(chapterIndex, opts)
                .then(({chapter, title, index, options}) => {
                    const newItem = this.buildChapter(chapter, title, index, options);
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

        onNewChapterItemFinished(event, be, direction){
            if(!be && this.lastSavePageScrollTop){
                const cs = $('.chapterContainer').scrollTop();
                $('.chapterContainer').scrollTop(cs + this.lastSavePageScrollTop);
                this.lastSavePageScrollTop = 0;
            }
        }

        buildChapter(chapter, title, index, options){
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
        nextChapter(){
            this.chapterList.nextItem();
        }

        // 上一章节
        lastChapter(){
            this.chapterList.lastItem();
        }

    }

    return MyPage;
});

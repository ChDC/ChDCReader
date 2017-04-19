"use strict"
define(["jquery", "main", "Page", "util", "uiutil", 'mylib/infinitelist'], function($, app, Page, util, uiutil, Infinitelist){

  class MyPage extends Page{

    constructor(){
      super();

      this.tmpOptions = null;  // 默认传递的选项参数
      this.book = null;
      this.readingRecord = null; // 正在读的记录
      this.chapterList = null; // 无限列表
      this.lastSavePageScrollTop = 0;
    }

    onLoad(params, p){
      this.book = params.book;
      this.book.checkBookSources();
      this.readingRecord = params.readingRecord;

      this.loadView();
      this.lastSavePageScrollTop = this.readingRecord.pageScrollTop;
      app.showLoading();
      this.chapterList.loadList();

    }

    onPause(){
      this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
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
          // 弹出工具栏
          $('.toolbar').toggle();
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
      $("#btnRefresh").click(e => {
        // this.readingRecord.chapterIndex = chapterIndex;
        this.chapterList.emptyList();
        app.showLoading();
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
      $(".labelMainSource").text(app.bookSourceManager.getBookSourceName(this.book.mainSourceId));
      $("#btnRefreshCatalog").click(() => this.loadCatalog(true));
    };

    // 加载目录源列表
    loadBookSource(){
      let changeMainContentSourceClickEvent = (event) => {
        const target = event.currentTarget;
        if(!target)
          return;
        const bid = $(target).data('bsid');
        const oldMainSource = this.book.mainSourceId;
        this.book.setMainSourceId(bid)
          .then(book => {
            app.bookShelf.save();
            // 隐藏目录窗口
            $("#modalCatalog").modal('hide');
            // 更新源之后
            $(".labelMainSource").text(app.bookSourceManager.getBookSourceName(this.book.mainSourceId));
            if(this.readingRecord.chapterIndex){
              this.book.fuzzySearch(this.book.mainSourceId, this.readingRecord.chapterIndex, undefined, oldMainSource)
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
            this.book.refreshBookInfo();
          })
          .catch(error => uiutil.showError(app.error.getMessage(error)));
      }

      const listBookSource = $("#listBookSource");
      listBookSource.empty();
      const listBookSourceEntry = $(".template .listBookSourceEntry");
      for(const bsk of this.book.getSourcesKeysByMainSourceWeight()){
        if(bsk == this.book.mainSourceId)
          continue;
        const nlbse = listBookSourceEntry.clone();
        nlbse.find(".bookSourceTitle").text(app.bookSourceManager.getBookSourceName(bsk));
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

      return this.book.getCatalog(forceRefresh)
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
              // 标记当前章节
              lce.addClass("current-chapter");
            else if(!value.link)
              lce.addClass("vip-chapter");
          });
          app.hideLoading()
        })
        .catch(error => {
          uiutil.showError(app.error.getMessage(error));
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
        $(".labelContentSource").text(app.bookSourceManager.getBookSourceName(options.contentSourceId));
        $(".labelChapterTitle").text(title);
        app.hideLoading();
      }
    }

    onNewChapterItem(event, be, direction){

      const opts = Object.assign({}, this.tmpOptions);
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
          uiutil.showError(app.error.getMessage(error));
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

      let content = $(`<div>${chapter.content}</div>`);
      content.find('p').addClass('chapter-p');
      content.find('img').addClass('content-img');
      nc.find(".chapter-content").html(content);
      // nc.find(".chapter-source").text(app.bookSourceManager.getBookSourceName(options.contentSourceId));

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

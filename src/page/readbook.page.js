"use strict"
define(["jquery", "main", "Page", "utils", "uiutils", 'mylib/infinitelist', "ReadingRecord"], function($, app, Page, utils, uiutils, Infinitelist, ReadingRecord){

  class MyPage extends Page{

    constructor(){
      super();

      this.book = null;
      this.readingRecord = null; // 正在读的记录
      this.chapterList = null; // 无限列表
      this.isNewBook = true; // 标记是否是未加入书架的新书
    }

    onClose(){
      this.chapterList.close();
      // 询问是否加入书架
      if(this.isNewBook){
        if(!app.bookShelf.hasBook(this.book)){ // 书架中没有本书
          uiutils.showMessageDialog("加入书架", `是否将${this.book.name} 加入书架？`,
              () => {
                app.bookShelf.addBook(this.book, this.readingRecord);
                app.bookShelf.save()
                  .then(() => {
                    uiutils.showMessage("添加成功！");
                    this.fireEvent("myclose");
                  });

              },
              () => {
                this.fireEvent("myclose");
              });
        }
        else{
          this.fireEvent("myclose");
        }
      }
    }

    onLoad(params){
      let bookAndReadRecordInBookShelf = app.bookShelf.hasBook(params.book);
      if(bookAndReadRecordInBookShelf){
        // 如果书架中有这本书就读取书架的记录
        this.book = bookAndReadRecordInBookShelf.book;
        this.readingRecord = bookAndReadRecordInBookShelf.readingRecord;
        this.isNewBook = false;
      }
      else{
        this.book = params.book;
        this.readingRecord = params.readingRecord || new ReadingRecord();
      }

      this.book.checkBookSources();
      this.loadView();
      this.refreshChapterList();
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
      // 弹出工具栏
      $("#chapterContainer").on("click", event => {
          // 弹出工具栏
          $('.toolbar').toggle();
      });
      $(".toolbar").blur((e) => $('.toolbar').hide());
      $(".toolbar").click((e) => $('.toolbar').hide());

      $("#btnNext").click(this.nextChapter.bind(this));
      $("#btnLast").click(this.previousChapter.bind(this));

      // 按钮事件
      $("#btnClose").click((e) => app.page.closePage());

      $("#btnCatalog").click((e) => this.loadCatalog());
      $("#labelNight").text(app.theme.isNight() ? "白天": "夜间");

      $("#btnToggleNight").click(e => {

        app.theme.toggleNight();
        $("#labelNight").text(app.theme.isNight() ? "白天": "夜间");

      });
      $("#btnBadChapter").click(e => {
        this.refreshChapterList({
          excludes: [this.readingRecord.options.contentSourceId]
        });
      });
      $("#btnRefresh").click(e => {
        this.refreshChapterList();
      });
      $("#btnSortReversed").click((e) => {
        const list = $('#listCatalog');
        list.append(list.children().toArray().reverse());
      });

      $("#btnChangeMainSource").click(() => {
        $("#modalBookSource").modal('show');
        this.loadBookSource();
      });
      $("#btnChangeContentSource").click(() => {
        $("#modalBookSource").modal('show');
        this.loadBookSource(true);
      });
      $('#modalCatalog').on('shown.bs.modal', e => {
        const targetChapter = $('#listCatalog > [data-index=' + this.readingRecord.chapterIndex + ']');
        if(targetChapter && targetChapter.length > 0)
        {
          const top = targetChapter.position().top - $("#listCatalogContainer").height() / 2;
          $('#listCatalogContainer').scrollTop(top);
          // $("#modalCatalog .modal-body").css("height", $());
        }
      });
      $('#btnBookDetail').click(e => app.page.showPage("bookdetail", {book: this.book}));
      $(".labelMainSource").text(app.bookSourceManager.getBookSource(this.book.mainSourceId).name)
          .click(e => window.open(this.book.getDetailLink(), '_system'));
      $("#btnRefreshCatalog").click(() => this.loadCatalog(true));
      if(this.isNewBook){
        $("#btnAddtoBookShelf").show().click(e => {
            app.bookShelf.addBook(this.book, this.readingRecord);
            $(event.currentTarget).css("display", "none");
            app.bookShelf.save()
              .then(() => {
                uiutils.showMessage("添加成功！");
               })
              .catch(error => {
                $(event.currentTarget).css("display", "block");
              });
          });
      }
      $('#chapterContainer').on("scroll", e => {
        $(".labelChatperPercent").text(`${parseInt(this.chapterList.getScrollRate()*100)} %`);
      });
    };

    // 加载目录源列表
    loadBookSource(changeContentSource=false){

      let sources = !changeContentSource ? this.book.getSourcesKeysByMainSourceWeight() : this.book.getSourcesKeysSortedByWeight();
      let currentSourceId = changeContentSource ? this.readingRecord.options.contentSourceId : this.book.mainSourceId;
      $('#modalBookSourceLabel').text(changeContentSource ? "更换内容源" : "更换目录源");
      let changeContentSourceClickEvent = (event) => {
        const target = event.currentTarget;
        if(!target) return;
        const bid = $(target).data('bsid');

        this.readingRecord.options.contentSourceId = bid;
        this.readingRecord.options.contentSourceChapterIndex = null;

        // 刷新当前章节
        this.refreshChapterList();
      };

      let changeCatalogSourceClickEvent = (event) => {
        const target = event.currentTarget;
        if(!target) return;
        const bid = $(target).data('bsid');
        const oldMainSource = currentSourceId;

        // 切换主源
        this.book.setMainSourceId(bid)
          .then(book => app.bookShelf.save())
          .catch(error => uiutils.showError(app.error.getMessage(error)));

        // 隐藏目录窗口
        $("#modalCatalog").modal('hide');
        // 更新源之后
        $(".labelMainSource").text(app.bookSourceManager.getBookSource(this.book.mainSourceId).name);

        // 从新的目录源中搜索之前的阅读记录
        if(this.readingRecord.chapterIndex){
          this.book.fuzzySearch(this.book.mainSourceId, this.readingRecord.getChapterIndex(), undefined, oldMainSource)
            .then(({chapter, index}) => {
              this.readingRecord.setReadingRecord(index, chapter.title, {});
              this.refreshChapterList();
            })
            .catch(error => {
              this.readingRecord.reset();
              this.refreshChapterList();
            });
        }
        else{
          this.refreshChapterList();
        }
        // 更新书籍信息
        this.book.refreshBookInfo();
      }

      let nlbseClickEvent = changeContentSource ? changeContentSourceClickEvent : changeCatalogSourceClickEvent;

      const listBookSource = $("#listBookSource");
      listBookSource.empty();
      const listBookSourceEntry = $(".template .listBookSourceEntry");
      for(const bsk of sources){
        if(bsk == currentSourceId)
          continue;
        const nlbse = listBookSourceEntry.clone();
        nlbse.text(app.bookSourceManager.getBookSource(bsk).name);
        nlbse.data("bsid", bsk);
        nlbse.click(nlbseClickEvent.bind(this));
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
        this.readingRecord.setReadingRecord(chapterIndex, "", {});
        this.refreshChapterList();
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
            else if(value.isVIP())
              lce.addClass("vip-chapter");
          });
          app.hideLoading()
        })
        .catch(error => {
          uiutils.showError(app.error.getMessage(error));
          app.hideLoading()
        });
    }

    refreshChapterList(options){
      app.showLoading();
      let opts = Object.assign({}, this.readingRecord.getOptions(), options);
      if(this.chapterList) this.chapterList.close();
      this.chapterList = new Infinitelist(
        $('#chapterContainer')[0],
        $('#chapters')[0],
        this.book.buildChapterIterator(this.readingRecord.getChapterIndex(), 1, opts, this.buildChapter.bind(this)),
        this.book.buildChapterIterator(this.readingRecord.getChapterIndex() - 1, -1, opts, this.buildChapter.bind(this))
      );
      this.chapterList.onError = (o,e) => uiutils.showError(app.error.getMessage(e));

      this.chapterList.onCurrentItemChanged = (event, newValue, oldValue) => {
        newValue = $(newValue);
        if(!oldValue){
          // 当前是第一个元素
          app.hideLoading();
          if(this.readingRecord.pageScrollTop){
            const cs = $('#chapterContainer').scrollTop();
            $('#chapterContainer').scrollTop(cs + this.readingRecord.pageScrollTop);
          }
        }
        const index = newValue.data('chapterIndex');
        const title = newValue.data('chapterTitle');
        const options = newValue.data('options');
        if(index >= 0){
          this.readingRecord.setReadingRecord(index, title, options);
          $(".labelContentSource").text(app.bookSourceManager.getBookSource(options.contentSourceId).name)
            .click(e => window.open(this.book.getDetailLink(options.contentSourceId), '_system'));
        }
        else{
          // 已经读完了
          this.readingRecord.setFinished(true)
        }
        $(".labelChapterTitle").text(title);
        app.hideLoading();
      }

      this.chapterList.loadList();
    }

    buildLastPage(){
      const nc = $('.template .chapter').clone();
      if(!nc || nc.length <=0)
        return null;

      let title = '读完啦';
      let content = `
        <h2>您已经读完了本书的所有更新！</h2>
        <h2>想要更快的读到本书的更新，请去本书的官方网站：</h2>
        <h2><a href="${this.book.getDetailLink()}">官方网站</a></h2>
        <hr/>
        <h2>您已经读完了本书的所有更新！</h2>
        <h2>想要更快的读到本书的更新，请去本书的官方网站：</h2>
        <h2><a href="${this.book.getDetailLink()}">官方网站</a></h2>
        <hr/>
        <h2>您已经读完了本书的所有更新！</h2>
        <h2>想要更快的读到本书的更新，请去本书的官方网站：</h2>
        <h2><a href="${this.book.getDetailLink()}">官方网站</a></h2>
        <hr/>
      `;
      nc.find(".chapter-title").text(title);
      nc.find(".chapter-content").html(content);

      nc.data('chapterIndex', -1);
      nc.data('chapterTitle', title);
      return nc[0];
    }

    buildChapter({chapter, index, options}={}){
      if(!chapter) // 加载完成页面
        return this.buildLastPage();

      this.book.getCatalog()
        .then(catalog => $(".labelBookPercent").text(`${parseInt(index / catalog.length * 100)} %`));

      const nc = $('.template .chapter').clone();
      if(!nc || nc.length <=0)
        return null;
      nc.find(".chapter-title").text(chapter.title);

      let content = $(`<div>${chapter.content}</div>`);
      content.find('p').addClass('chapter-p');
      content.find('img').addClass('content-img')
        .on('error', uiutils.imgonerror);

      nc.find(".chapter-content").html(content);

      nc.data('chapterIndex', index);
      nc.data('chapterTitle', chapter.title);
      nc.data('options', options);
      return nc[0];
    }

    // 下一章节
    nextChapter(){
      this.chapterList.nextItem();
    }

    // 上一章节
    previousChapter(){
      this.chapterList.previousItem();
    }
  }

  return MyPage;
});

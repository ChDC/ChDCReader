"use strict"
define(["jquery", "main", "Page", "utils", "uiutils",
  'mylib/infinitelist', "ReadingRecord", "uifactory", "LittleCrawler"],

  function($, app, Page, utils, uiutils, Infinitelist, ReadingRecord, uifactory, LittleCrawler){

  class MyPage extends Page{

    constructor(){
      super();

      this.book = null;
      this.readingRecord = null; // 正在读的记录
      this.chapterList = null; // 无限列表
      this.isNewBook = true; // 标记是否是未加入书架的新书
      this.buildCatalogView = uifactory.buildCatalogView.bind(this);
      this.lastReadingScrollTop = 0;
      this.chapterContainer;
      this.isFullScreen = false;
      this.screenOrientation = null;
    }

    onClose(){
      this.chapterList.close();
      // 询问是否加入书架
      if(this.isNewBook){
        if(!app.bookShelf.hasBook(this.book)){ // 书架中没有本书
          uiutils.showMessageDialog("加入书架", `是否将 ${this.book.name} 加入书架？`,
              () => {
                app.bookShelf.addBook(this.book, this.readingRecord);
                app.bookShelf.save()
                  .then(() => {
                    uiutils.showMessage("添加成功！");
                    this.fireEvent("myclose");
                  });

              },
              () => {
                // 不添加，清除缓存章节
                this.book.clearCacheChapters();
                this.fireEvent("myclose");
              });
        }
        else{
          this.fireEvent("myclose");
        }
      }
    }

    onLoad({params}){
      this.chapterContainer = $("#chapterContainer");
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
      this.lastReadingScrollTop = this.readingRecord.getPageScrollTop();
      this.book.checkBookSources();
      this.loadView();
      this.screenOrientation = app.bookShelf.getBookSettings(this.book).screenOrientation;

      this.book.getChapterIndex(this.readingRecord.chapterTitle, this.readingRecord.chapterIndex)
        .then(index => {
          if(index >= 0)
            this.readingRecord.chapterIndex = index;
          this.refreshChapterList();
        });
    }

    onResume(){
      this.rotateScreen(this.screenOrientation);
    }

    onPause(){
      if(typeof StatusBar != "undefined") StatusBar.show();
      app.ScreenOrientation.unlock(); // 解除屏幕锁定

      this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
      app.bookShelf.save();

      this.scrollTop = this.chapterContainer.scrollTop();
      this.addEventListener("resume", e => this.chapterContainer.scrollTop(this.scrollTop), true);
    }

    rotateScreen(screenOrientation){
      if(!screenOrientation){
        $("#btnRotateScreen > button > i").removeClass().addClass("glyphicon glyphicon-retweet");
        app.ScreenOrientation.unlock();
      }
      else{
        $("#btnRotateScreen > button > i").removeClass().addClass("glyphicon glyphicon-transfer");
        app.ScreenOrientation.lock();
      }
    }

    loadView(){
      // 弹出工具栏
      $("#chapterContainer").on("click", event => {
          // 弹出工具栏
          $('.toolbar').toggle();
          let excludes = ["btnNext", "btnLast"];
          let x = event.clientX, y = event.clientY;

          for(let e of excludes){
            let rect = document.getElementById(e).getBoundingClientRect();
            if(utils.isPointInRect(rect, {x:x, y:y}))
              return $('.toolbar').toggle();
          }
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
      $("#btnRotateScreen").click(() => {
        if(this.screenOrientation)
          this.screenOrientation = null;
        else
          this.screenOrientation = "landscape";
        app.bookShelf.setBookSettingsValue(this.book, "screenOrientation", this.screenOrientation);
        this.rotateScreen(this.screenOrientation);
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
        const targetChapter = $('#current-catalog-chapter');
        if(targetChapter && targetChapter.length > 0)
        {
          if(targetChapter.parent().attr('id') == "listCatalog")
            targetChapter[0].scrollIntoView();
          else
            for(let e = targetChapter.parent(); e.attr('id') != "listCatalog"; e = e.parent()){
              if(e.hasClass("collapse"))
                e.collapse('show')
                  .on("shown.bs.collapse", e => {
                    targetChapter[0].scrollIntoView();
                  });
            }
        }
      });
      $('#btnBookDetail').click(e => app.page.showPage("bookdetail", {book: this.book}));
      $(".labelMainSource").text(app.bookSourceManager.getBookSource(this.book.mainSourceId).name)
          .click(e => window.open(this.book.getOfficialDetailLink(), '_system'));
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
          this.book.fuzzySearch(this.book.mainSourceId, this.readingRecord.chapterIndex, {bookSourceId: oldMainSource})
            .then(({chapter, index}) => {
              this.readingRecord.setReadingRecord(chapter.title, index, {});
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

      app.showLoading();
      $('#listCatalogContainer').height($(window).height() * 0.5);

      return this.book.getCatalog({forceRefresh: forceRefresh, groupByVolume: true})
        .then(catalog => {
          const listCatalog = $("#listCatalog");
          listCatalog.empty();
          listCatalog.append(this.buildCatalogView(catalog,
            (e) => {
              let chapter = $(e.currentTarget).data("chapter");
              this.readingRecord.setReadingRecord(chapter.title, chapter.index, {contentSourceId: this.readingRecord.options.contentSourceId});
              this.refreshChapterList();
            }, "#listCatalog",
            (chapter, nc) => {
              if(chapter.index == this.readingRecord.chapterIndex)
                nc.attr("id", "current-catalog-chapter");
              if(chapter.isVIP())
                nc.addClass("vip-chapter");
            }));
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
        this.book.buildChapterIterator(this.readingRecord.getChapterIndex() - 1, -1, opts, this.buildChapter.bind(this)),
        {disableCheckPrevious: true} // 禁止向前加载
      );
      this.chapterList.onError = e => {
        app.hideLoading();
        uiutils.showError(app.error.getMessage(e.error));
      };

      $(".labelContentSource").click(e => window.open(this.book.getOfficialDetailLink(this.readingRecord.options.contentSourceId), '_system'));

      this.chapterList.onCurrentElementChanged = ({new: newValue, old: oldValue}) => {
        newValue = $(newValue);
        const readingRecord = newValue.data('readingRecord');
        if(readingRecord.chapterIndex >= 0){
          const contentSourceId = readingRecord.options.contentSourceId;
          Object.assign(this.readingRecord, readingRecord);
          $(".labelContentSource").text(app.bookSourceManager.getBookSource(contentSourceId).name);
        }
        else{
          // 已经读完了
          this.readingRecord.setFinished(true);
        }
        $(".labelChapterTitle").text(readingRecord.chapterTitle);
        app.hideLoading();
      };
      this.chapterList.onNewElementFinished = ({newElement, direction, isFirstElement}) => {
        if(!isFirstElement) return;
        // 只处理第一个元素
        app.hideLoading();
        if(this.lastReadingScrollTop){
          const cs = $('#chapterContainer').scrollTop();
          $('#chapterContainer').scrollTop(cs + this.lastReadingScrollTop);
          this.lastReadingScrollTop = 0;
        }
      };

      if(this.book.getType() == "comics"){
        this.enableAutoFullScreenMode();
      }

      this.chapterList.loadList();
    }

    enableAutoFullScreenMode(){
      let lastScroll;
      const threshold = 100;
      this.chapterList.onScrollDown = e => {
        if(lastScroll == undefined || e.scrollTop - lastScroll > threshold){
          this.toggleFullScreen(true);
          lastScroll = e.scrollTop;
        }
      };

      this.chapterList.onScrollUp = e => {
        if(lastScroll == undefined || lastScroll - e.scrollTop > threshold){
          this.toggleFullScreen(false);
          lastScroll = e.scrollTop;
        }
      };
    }

    toggleFullScreen(full, force=false){
      if(full == undefined)
        full = !this.isFullScreen;

      if(full && (!this.isFullScreen || force)){
        this.chapterContainer[0].style.top = "0";
        this.chapterContainer[0].style.bottom = "0";
        $("#mainViewHeader, #mainViewFooter").hide();
        if(typeof StatusBar != "undefined" && window.innerHeight < window.innerWidth) StatusBar.hide();
        this.isFullScreen = true;
      }
      else if(!full && (this.isFullScreen || force)){
        this.chapterContainer.removeAttr("style");
        $("#mainViewHeader, #mainViewFooter").show();
        if(typeof StatusBar != "undefined") StatusBar.show();
        this.isFullScreen = false;
      }
    }

    // 构造读完页面
    buildLastPage(){
      const nc = $('.template .readFinished').clone();
      if(!nc || nc.length <=0)
        return null;

      nc.height($('#chapterContainer').height());

      nc.find(".offical-site").click(e => window.open(this.book.getOfficialDetailLink(), '_system'));
      nc.find("img.offical-site").attr('src', `img/logo/${this.book.mainSourceId}.png`);

      nc.data("readingRecord", new ReadingRecord({chapterTitle: "读完啦", chapterIndex: -1}));
      this.loadElseBooks(nc.find(".elseBooks"));
      return nc[0];
    }

    loadElseBooks(list){
      function addBook(bookshelfitem, prepend=false){
        let nb = $('.template .book').clone();
        if(bookshelfitem.book.cover) nb.find('.book-cover').attr('src', bookshelfitem.book.cover);
        nb.find('.book-name').text(bookshelfitem.book.name);
        nb.click(() => {
          app.page.closeCurrentPagetAndShow("readbook", {book: bookshelfitem.book, readingRecord: bookshelfitem.readingRecord})
        });
        if(prepend)
          list.prepend(nb);
        else
          list.append(nb);
      }

      // 添加未读完的书籍
      let unFinishedBooks = app.bookShelf.books.filter(e => !e.readingRecord.isFinished && e.book != this.book).reverse();
      unFinishedBooks.forEach(addBook);

      // 添加读完的书籍
      let finishedBooks = app.bookShelf.books.filter(e => e.readingRecord.isFinished && e.book != this.book);
      finishedBooks.forEach(e => {
        e.book.getLastestChapter()
          .then(([lastestChapter]) => {
            if(!e.readingRecord.equalChapterTitle(lastestChapter)) // 有新章节
              addBook(e, true);
          });
      });

    }

    buildChapter({chapter, index, options}={}, direction){
      if(!chapter){
        // 加载完成页面
        if(direction > 0)
          return this.buildLastPage();
        else
          return null;
      }

      this.book.getCatalog()
        .then(catalog => $(".labelBookPercent").text(`${parseInt(index / catalog.length * 100)} %`));

      const nc = $('.template .chapter').clone();
      if(!nc || nc.length <=0)
        return null;
      nc.find(".chapter-title").text(chapter.title);

      let content = $(`<div>${chapter.content}</div>`);
      content.find('p').addClass('chapter-p');
      this.loadImages(content);

      nc.find(".chapter-content").html(content);
      nc.data("readingRecord", new ReadingRecord({chapterTitle: chapter.title, chapterIndex: index, options: options}));

      return nc[0];
    }

    // 加载所有的图片
    loadImages(content){
      // 异步加载
      // 先用灰色的数字占位，等加载完成之后再替换
      let imgs = content.find('img')
        .addClass('content-img')
        .each((i, img) => {
          let id = utils.getGUID();

          let loading = $('<p class="content-img-loading">')
            .text(i+1).css("line-height", this.chapterContainer.width() * 2 + "px")
            .attr("id", id);

          $(img).replaceWith(loading);
          img.dataset.id = id;
          loadImg(img);
      });
      // 设置图片的格式
      // content.find('img').addClass('content-img')
      //   .one('error', uiutils.imgOnErrorEvent)
      //   .css('min-height', this.chapterContainer.width() * 2 + "px")
      //   .one('load', e => $(e.target).css('min-height', ""));

      function loadError(e){
        let img = e.currentTarget || e;
        let id = img.dataset.id;
        let btnReload = $('<div class="img-reload"><img src="img/reload.png"><p>加载失败，点击重新加载</p></div>')
          .one("click", e => {
            loadImg(img, true);
            e.stopPropagation();
            e.currentTarget.remove();
          });
        let ic = $(document.getElementById(id));
        ic.append(btnReload);
        btnReload.css("top", ic.height() / 2 - btnReload.height() / 2 );
      }

      function loadImg(img, reload=false){
        // 异步加载图片
        if(img.dataset.skip){
          let src;
          if(!reload){
            src = img.src;
            img.dataset.src = src;
            img.removeAttribute("src");
          }
          else{
            src = img.dataset.src;
          }

          LittleCrawler.ajax("GET", src, {}, "blob")
            .then(blob => {
              let skipBits = Number.parseInt(img.dataset.skip);
              let url = URL.createObjectURL(blob.slice(skipBits));
              $(img).one("load", loadFinishedImg);
              img.src = url;
            })
            .catch(e => {
              // 加载失败
              loadError(img);
            });
        }
        else{
          img.src = img.src;
          let jImg = $(img);
          if(!reload)
            jImg.one("load", loadFinishedImg);
          jImg.one("error", loadError);
        }
      }

      function loadFinishedImg(e){
        let img = e.currentTarget;
        let id = img.dataset.id;
        delete img.dataset.id;
        delete img.dataset.skip;
        $(document.getElementById(id)).replaceWith(img);
      }
    }

    // 下一章节
    nextChapter(){
      app.showLoading();
      this.chapterList.nextElement(false)
        .then(() => app.hideLoading())
        .catch(e => app.hideLoading());
    }

    // 上一章节
    previousChapter(){
      app.showLoading();
      this.chapterList.previousElement(true)
        .then(() => app.hideLoading())
        .catch(e => app.hideLoading());
    }
  }

  return MyPage;
});

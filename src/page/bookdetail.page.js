"use strict"
define(["jquery", "main", "Page", "utils", "uiutils", "ReadingRecord"], function($, app, Page, utils, uiutils, ReadingRecord){

  class MyPage extends Page{

    onLoad(params){
      this.book = params.book;
      this.loadView();
    }

    readbookpageclose(){
      if(app.bookShelf.hasBook(this.book))
        app.page.showPage("bookshelf");
    }

    // 加载书籍详情
    loadBookDetail(){
      let book = this.book;
      if(book.cover)
        $("#book-cover").attr("src", book.cover);
      $("#book-name").text(book.name).click(e => window.open(this.book.getOfficialDetailLink(), '_system'));
      $("#book-author").text(book.author);
      $("#book-catagory").text(book.catagory);
      $("#book-complete").text(book.complete ? "完结" : "连载中");
      $("#book-introduce").text(book.introduce);

      $("#btnRead").click( e => app.page.showPage("readbook", {book: book})
        .then(page => {
          page.addEventListener('myclose', this.readbookpageclose.bind(this));
        }));

      if(app.bookShelf.hasBook(book))
        $("#btnAddToBookshelf").hide();
      else{
        $("#btnAddToBookshelf").click(e => {
          app.bookShelf.addBook(book);

          $(event.currentTarget).attr("disabled", "disabled");
          app.bookShelf.save()
            .then(() => {
              uiutils.showMessage("添加成功！");
              book.checkBookSources();
              // 缓存
              book.cacheChapter(0, app.settings.settings.cacheChapterCount);
            })
            .catch(error => {
              $(event.currentTarget).removeAttr("disabled");
            });

        });
      }
    }

    buildCatalogView(catalog, idPrefix=""){
      // let tvv = $(".template .chapter-volume");
      let tv = $(".template .chapter-volume-item");
      let tc = $(".template .chapter-item");

      if(catalog.length > 0 && "chapters" in catalog[0]){
        // volume
        return catalog.map((v, index) => {
          let nv = tv.clone();
          idPrefix = idPrefix + index;
          let headid = `head${idPrefix}`;
          let contentid = `content${idPrefix}`;

          nv.find(".panel-heading").attr("id", headid);
          nv.find(".panel-collapse").attr("id", contentid).attr("aria-labelledby", headid);

          nv.find(".volume-name").text(v.name).attr("data-target", '#' + contentid).attr("aria-controls", contentid);
          // load chapters
          nv.find(".chapter-list").append(
            this.buildCatalogView(v.chapters, idPrefix)
          );
          return nv;
        });
      }
      else
        return catalog.map((chapter, index) => {
          const nc = tc.clone();
          nc.text(chapter.title);
          nc.click(e => {
            app.page.showPage("readbook", {
              book: this.book,
              readingRecord: new ReadingRecord({chapterIndex: chapter.index, chapterTitle: chapter.title})
            })
            .then(page => {
              page.addEventListener('myclose', this.readbookpageclose.bind(this));
            });
          });
          return nc;
        });
    }

    // 加载章节列表
    loadBookChapters(id){

      const c = $(".template .book-chapter");
      this.bookChapterList.empty();
      this.book.getCatalog(false, undefined, true)
        .then(catalog => {
          let tvv = $(".template .chapter-volume");
          this.bookChapterList.append(tvv.clone().append(this.buildCatalogView(catalog)));
        })
        .catch(error => uiutils.showError(app.error.getMessage(error)));
    }

    loadView(){

      this.bookChapterList = $('#book-chapters');
      this.loadBookDetail();
      this.loadBookChapters();
      $('#btnClose').click(e => this.close());
    }

  }

  return MyPage;
});

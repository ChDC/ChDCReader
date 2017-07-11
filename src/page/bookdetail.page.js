"use strict"
define(["jquery", "main", "Page", "utils", "uiutils",
   "ReadingRecord", "uifactory"],
   function($, app, Page, utils, uiutils, ReadingRecord, uifactory){

  class MyPage extends Page{

    constructor(){
      super();
      this.buildCatalogView = uifactory.buildCatalogView.bind(this);
    }

    onLoad({params}){
      this.book = params.book;
      this.loadView();
    }

    onClose({params}){
      this.fireEvent("myclose");
    }

    readbookpageclose({params}){
      if(app.bookShelf.hasBook(this.book))
        app.page.showPage("bookshelf");
    }

    /**
     * 加载书籍详情
     * @return {[type]} [description]
     */
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

    /**
     * 加载章节列表
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    loadBookChapters(id){

      this.bookChapterList.empty();
      this.book.getCatalog({groupByVolume: true})
        .then(catalog => {
          this.bookChapterList.append(this.buildCatalogView(catalog,
            e => {
              let chapter = $(e.currentTarget).data("chapter");
              app.page.showPage("readbook", {
                  book: this.book,
                  readingRecord: new ReadingRecord({chapterIndex: chapter.index, chapterTitle: chapter.title})
                })
                .then(page => {
                  page.addEventListener('myclose', this.readbookpageclose.bind(this));
                });
            }, "#book-chapters",
            (chapter, nc) => {
              if(chapter.isVIP())
                nc.addClass("vip-chapter");
            }));
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

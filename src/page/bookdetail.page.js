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
    loadBookDetail(book){
      if(book.cover)
        $("#book-cover").attr("src", book.cover);
      $("#book-name").text(book.name).click(e => window.open(this.book.getDetailLink(), '_system'));
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

    // 加载章节列表
    loadBookChapters(id, book){

      const bookChapter = $(id);
      const c = $(".template .book-chapter");
      bookChapter.empty();
      book.getCatalog(false, undefined)
        .then(catalog => {
          catalog.forEach((chapter, index) => {
            const nc = c.clone();
            nc.text(chapter.title);
            nc.click(e => {
              app.page.showPage("readbook", {
                book: book,
                readingRecord: new ReadingRecord({chapterIndex: index, chapterTitle: chapter.title})
              })
              .then(page => {
                page.addEventListener('myclose', this.readbookpageclose.bind(this));
              });
            });
            bookChapter.append(nc);
          });
        })
        .catch(error => uiutils.showError(app.error.getMessage(error)));
    }

    loadView(){

      this.loadBookDetail(this.book);
      this.loadBookChapters("#book-chapters", this.book);
      $('#btnClose').click(e => this.close());
    }

  }

  return MyPage;
});

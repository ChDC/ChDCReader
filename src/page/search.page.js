"use strict"
define(["jquery", "main", "Page", "util", "uiutil"], function($, app, Page, util, uiutil){

  class MyPage extends Page{

    onLoad(params){
      this.loadView();
    }

    // 加载结果列表
    loadBooks(id, books){
      const bs = $(id);
      const b = $(".template .book");
      bs.empty();
      for(const book of books){
        const nb = b.clone();
        if(book.cover)
          nb.find(".book-cover").attr("src", book.cover);

        nb.find(".book-type").text(app.bookSourceManager.getBookSourceTypeName(book.mainSourceId));

        nb.find(".book-name").text(book.name);
        nb.find(".book-author").text(book.author);
        nb.find(".book-catagory").text(book.catagory);
        nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
        nb.find(".book-introduce").text(book.introduce);

        if(app.bookShelf.hasBook(book)){
          nb.find(".btnAddToBookshelf").attr('disabled', 'disabled');
        }
        else{
          nb.find(".btnAddToBookshelf").click(event => {
            app.bookShelf.addBook(book);

            $(event.currentTarget).attr("disabled", "disabled");
            app.bookShelf.save()
              .then(()=>{
                uiutil.showMessage("添加成功！");
                book.checkBookSources();
                // 缓存
                book.cacheChapter(0, app.settings.settings.cacheChapterCount);
              })
              .catch(error => {
                $(event.currentTarget).removeAttr("disabled");
              });
          });
        }
        nb.find(".btnDetail").click(e => app.page.showPage("bookdetail", {
              book: book
            }));
        nb.find(".book-booksource").text(app.bookSourceManager.getBookSource(book.mainSourceId).name);
        bs.append(nb);
      }
    }

    search(){
      app.showLoading();
      const keyword = $(".keyword").val();
      const bookSourceId = $(".bookSource").val();
      $('.result').empty();
      if(!keyword || !bookSourceId){
        uiutil.showError("请输入要搜索的关键字");
        return;
      }

      if(bookSourceId == "#all#"){
        // 全网搜索
        app.bookSourceManager.searchBookInAllBookSource(keyword)
          .then(books => {
            app.hideLoading();
            this.loadBooks(".result", books);
          })
          .catch(error => {
            app.hideLoading();
            uiutil.showError(app.error.getMessage(error));
          });
        return;
      }

      // 单书源搜索
      app.bookSourceManager.searchBook(bookSourceId, keyword)
        .then(books => {
          app.hideLoading();
          this.loadBooks(".result", books);
        })
        .catch(error => {
          app.hideLoading();
          uiutil.showError(app.error.getMessage(error));
        });
    }

    loadView(){
      // 添加选项
      const bookSource = $(".bookSource");
      const keys = app.bookSourceManager.getSourcesKeysByMainSourceWeight();

      // 添加特殊搜索
      bookSource.append('<option value ="#all#">[全网搜索]</option>');

      // 添加书源搜索
      for(const bskey of keys)
      {
        const bsName = app.bookSourceManager.getBookSource(bskey).name;
        const newOption = `<option value ="${bskey}">${bsName}</option>`;
        bookSource.append(newOption);
      }


      $("#btnClose").click(e => this.close());
      $(".btnSearch").click(e => this.search());
      $(".keyword").on('keydown', event => !(event.keyCode==13 && this.search()));
      $(".keyword").on('focus', event => event.currentTarget.select());
    }
  }

  return MyPage;
});

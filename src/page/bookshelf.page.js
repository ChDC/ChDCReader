"use strict"
define(["jquery", "main", "Page", "utils", "uiutils", 'Chapter', 'sortablejs'], function($, app, Page, utils, uiutils, Chapter, sortablejs){

  class MyPage extends Page{
    onLoad({params}){
      this.loadView();
      this.loaded = false; // 标记是否已经加载的数据

      this.bookShelf = app.bookShelf;
      this.bookTemplateElement; // 模板元素
      this.bookShelfElement; // 书架的容器元素，用于存放书籍
      this.modalFinishedBooks;
      this.finishedBookShelfElement; // 读完的书的容器元素
      this.bookShelf.addEventListener("addedBook", (e)=>{
        // 添加了书籍
        // 更新UI
        this.addBook(e.bookShelfItem);
        this.refreshBooksOrder(this.bookShelf)
      });

      this.container = $('.container');
    }

    onPause(){
      this.modalFinishedBooks.modal('hide');
      app.settings.settings.scrollTop.bookshelf = this.container.scrollTop();
      app.settings.save();
    }

    onResume(){
      if(!this.loaded)
        this.bookShelf.load(app.bookSourceManager)
          .then(() => {
            this.loaded = true;
            this.loadBooks(this.bookShelf);
            this.container.scrollTop(app.settings.settings.scrollTop.bookshelf || 0);
          });
      else{
        this.refreshBooksOwner();
        this.refreshAllReadingRecord();
        this.container.scrollTop(app.settings.settings.scrollTop.bookshelf || 0);
      }
    }

    removeBook(book){
      uiutils.showMessageDialog("确定", "确定要删除该书？",
        () => {
          // const target = $(event.currentTarget);
          this.bookShelf.removeBook(book);
          this.refreshBooksOrder(this.bookShelf);
          this.bookShelf.save()
            .then(() => {
              uiutils.showMessage("删除成功！");
            })
            .catch(error => {
              uiutils.showError("删除失败！");
            });
          });
      return false;
    }

    // 只更新 UI 不重新加载数据
    refreshBooksOrder(bookShelf){
      const books = bookShelf.books;

      [this.bookShelfElement, this.finishedBookShelfElement].forEach(bookShelfElement => {
        let newOrders = [];
        Array.from(bookShelfElement.children()).forEach(e => {
          let i = books.indexOf($(e).data("bookshelfitem"));
          if(i < 0)
            e.remove();
          else
            newOrders.push(e);
        });
        newOrders.sort((e1, e2) =>
          books.indexOf($(e1).data("bookshelfitem")) - books.indexOf($(e2).data("bookshelfitem")));
        bookShelfElement.append(newOrders);
      });
    }

    addBook(bookshelfitem){
      const readingRecord = bookshelfitem.readingRecord;
      const book = bookshelfitem.book;
      const nb = this.bookTemplateElement.clone();

      nb.data("bookshelfitem", bookshelfitem);

      if(book.cover) {
        let img = new Image();
        img.src = book.cover;
        img.onload = e => {
          nb.find(".book-cover").attr("src", book.cover);
        };
      }
      nb.find(".book-name").text(book.name)
        .addClass(`type-${app.bookSourceManager.getBookSourceType(book.mainSourceId)}`);

      uiutils.onLongPress(nb.find(".book-cover"), e => {
          let bm = $("#modalBookMenu");
          bm.modal("show");
          bm.find(".modal-title").text(book.name);
          bm.find(".btnDetail")[0].onclick = e => {
            bm.modal("hide");
            app.page.showPage("bookdetail", {book: book});
          };
          bm.find(".btnRemoveBook")[0].onclick = e => {
            bm.modal("hide");
            this.removeBook(book);
          };
          // nb.find('.btnBookMenu').dropdown('toggle');
        })
        .on("click", e => {
          app.page.showPage("readbook", {book: bookshelfitem.book, readingRecord: bookshelfitem.readingRecord});
        });

      // nb.find(".btnDetail").click(e => app.page.showPage("bookdetail", {book: book}));
      // nb.find(".btnRemoveBook").click(e => this.removeBook(book));

      if(readingRecord.isFinished)
        this.addBookElementToFinishedBookShelf(nb, true);
      else
        this.addBookElementToBookShelf(nb, true);
    }

    // 刷新所有的阅读记录
    refreshAllReadingRecord(){
      // 只刷新读完的书的最新章节
      Array.from(this.finishedBookShelfElement.children())
        .forEach(e => this.refreshReadingRecord($(e)));
    }

    // 刷新阅读记录
    refreshReadingRecord(bookElement){
      let bookshelfitem = bookElement.data("bookshelfitem");
      if(!bookshelfitem) throw new Error("empty illegal bookshelfitem");

      const readingRecord = bookshelfitem.readingRecord;

      const book = bookshelfitem.book;

      // 刷新最新章节
      book.getLastestChapter()
        .then(([lastestChapter]) => {
          let isNewChapter = lastestChapter && !readingRecord.equalChapterTitle(lastestChapter);

          if(readingRecord.isFinished && isNewChapter){
            // 将书籍移动到主书架列表顶部
            this.addBookElementToBookShelf(bookElement);
            // 更新最新章节
            // 强制刷新目录
            book.getChapterIndex(lastestChapter)
              .then(index => index < 0)
              .then(forceRefresh => {
                // 更新阅读记录
                readingRecord.setNextChapter(book, forceRefresh);
                // TODO: 更新目录之后，用当前阅读记录来判断是否真的有更新，只有再移动到主书架
                // 缓存后面章节内容，使用强制更新模式
                book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount, {forceRefresh: forceRefresh});
              });
          }
        });
    }

    // 移动书籍
    addBookElementToFinishedBookShelf(bookElement, append=false){
      bookElement = $(bookElement);
      // 移动到读完书架
      bookElement.detach();
      // bookElement.removeClass("card");
      if(append)
        this.finishedBookShelfElement.append(bookElement);
      else
        this.finishedBookShelfElement.prepend(bookElement);
    }

    addBookElementToBookShelf(bookElement, append=false){
      bookElement = $(bookElement);
      // 移动到主书架
      bookElement.detach();
      // bookElement.addClass("card");
      if(append)
        this.bookShelfElement.append(bookElement);
      else
        this.bookShelfElement.prepend(bookElement);
    }

    // 刷新每本书所在的书架
    refreshBooksOwner(){
      Array.from(this.bookShelfElement.children()).forEach(bookElement =>
        $(bookElement).data("bookshelfitem").readingRecord.isFinished && this.addBookElementToFinishedBookShelf(bookElement));
      Array.from(this.finishedBookShelfElement.children()).forEach(bookElement =>
        !$(bookElement).data("bookshelfitem").readingRecord.isFinished && this.addBookElementToBookShelf(bookElement));
    }

    // 加载书架列表
    loadBooks(bookShelf){
      const books = bookShelf.books;
      // this.bookShelfElement.empty();
      // this.finishedBookShelfElement.empty();
      books.forEach(this.addBook.bind(this));
      this.refreshBooksOwner();
      this.refreshAllReadingRecord();
    }

    // 重新给所有书籍排序
    sortBooksByElementOrder(){
      const elements = this.bookShelfElement.children();
      let newBooks = Array.from(elements).map(e => $(e).data('bookshelfitem'))
      this.bookShelf.sortBooks(newBooks);
      this.bookShelf.save();
      this.refreshBooksOrder(this.bookShelf);
    }

    loadView(){
      this.modalFinishedBooks = $("#modalFinishedBooks");
      this.bookTemplateElement = $(".template .book");
      this.bookShelfElement = $("#bookshelf");
      this.finishedBookShelfElement = $("#finishedBookshelf");

      sortablejs.create(this.bookShelfElement[0], {
        animation: 150,
        handle: ".book-name",
        draggable: ".book",
        onUpdate: (event) => {
          // 更新并保存顺序
          this.sortBooksByElementOrder();
        },
      });

      $("#btnCheckUpdate").click(e => app.chekcUpdate(true, true));
      $("#btnSearch").click(e => app.page.showPage("search"));
      $("#btnExplore").click(e => app.page.showPage("explorebook"));
      $("#btnToggleNightMode > a").text(app.theme.isNight() ? "白天模式": "夜间模式");
      $("#btnToggleNightMode").click(e => {
        app.theme.toggleNight();
        $("#btnToggleNightMode > a").text(app.theme.isNight() ? "白天模式": "夜间模式");
      });
    }

  }

  return MyPage;
});


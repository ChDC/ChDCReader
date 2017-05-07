"use strict"
define(["jquery", "main", "Page", "utils", "uiutils", 'Chapter', 'sortablejs'], function($, app, Page, utils, uiutils, Chapter, sortablejs){

  class MyPage extends Page{
    onLoad({params}){
      this.loadView();
      this.loaded = false; // 标记是否已经加载的数据

      this.bookShelf = app.bookShelf;
      this.bookTemplateElement; // 模板元素
      this.bookShelfElement; // 书架的容器元素，用于存放书籍
      this.bookShelf.addEventListener("addedBook", (e)=>{
        // 添加了书籍
        // 更新UI
        this.addBook(e.bookShelfItem);
        this.refreshBooksOrder(this.bookShelf)
      });

      this.container = $('.container');
      this.scrollTop = app.settings.settings.scrollTop.bookshelf || 0; // 记住上次的滚动位置
    }

    onPause(){
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
      let newOrders = [];
      let children = this.bookShelfElement.children();
      Array.from(children).forEach(e => {
        let i = books.indexOf($(e).data("bookshelfitem"));
        newOrders[i] = e;
      });
      children.detach();
      this.bookShelfElement.append(newOrders);
    }

    addBook(bookshelfitem){
      const readingRecord = bookshelfitem.readingRecord;
      const book = bookshelfitem.book;
      const nb = this.bookTemplateElement.clone();

      nb.data("bookshelfitem", bookshelfitem);

      if(book.cover) nb.find(".book-cover").attr("src", book.cover);
      nb.find(".book-name").text(book.name)
        .addClass(`type-${app.bookSourceManager.getBookSource(book.mainSourceId).type}`);

      nb.find('.book-cover, .book-info')
        .click(() => app.page.showPage("readbook", {book: bookshelfitem.book, readingRecord: bookshelfitem.readingRecord}));

      nb.find('.btnBookMenu').click(event => {
        $(event.currentTarget).dropdown();
        return false;
      }).dropdown();

      nb.find('.btnDetail').click(e => app.page.showPage("bookdetail", {book: bookshelfitem.book}));
      nb.find('.btnRemoveBook').click((e) => this.removeBook(book));
      nb.find('.btnLockLocation').click((e) => {
        this.bookShelf.toggleLockBook(bookshelfitem);
        $(e.currentTarget).find('a').text(this.bookShelf.isLockedBook(bookshelfitem) ? "解锁位置" : "锁定位置");
        this.bookShelf.save();
      });
      nb.find('.btnLockLocation > a').text(this.bookShelf.isLockedBook(bookshelfitem) ? "解锁位置" : "锁定位置");
      this.bookShelfElement.append(nb);
    }

    // 刷新所有的阅读记录
    refreshAllReadingRecord(){
      Array.from(this.bookShelfElement.children())
          .forEach(e => this.refreshReadingRecord($(e)));
    }

    // 刷新阅读记录
    refreshReadingRecord(bookElement){
      let bookshelfitem = bookElement.data("bookshelfitem");
      if(!bookshelfitem) throw new Error("empty illegal bookshelfitem");

      const readingRecord = bookshelfitem.readingRecord;
      const book = bookshelfitem.book;
      bookElement.find(".book-readingchapter").text(readingRecord.getReadingRecordStatus());

      // 刷新最新章节
      book.getLastestChapter()
        .then(([lastestChapter]) => {
          let isNewChapter = lastestChapter && !readingRecord.equalChapterTitle(lastestChapter);
          let lce = bookElement.find(".book-lastestchapter")
            .text("最新：" + (lastestChapter? lastestChapter : "无"));
          if(isNewChapter)
            lce.addClass('unread-chapter');
          else
            lce.removeClass('unread-chapter');

          if(readingRecord.isFinished && isNewChapter){
            // 更新最新章节
            // 强制刷新目录
            book.getChapterIndex(lastestChapter)
              .then(index => index < 0)
              .then(forceRefresh => {
                // 缓存后面章节内容，使用强制更新模式
                book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount, {forceRefresh: forceRefresh});
              });
          }
        });
    }

    // 加载书架列表
    loadBooks(bookShelf){
      const books = bookShelf.books;
      this.bookShelfElement.empty();
      books.forEach(this.addBook.bind(this));
      this.refreshAllReadingRecord();
    };

    // 重新给所有书籍排序
    sortBooksByElementOrder(){
      const elements = this.bookShelfElement.children();
      let newBooks = Array.from(elements).map(e => $(e).data('bookshelfitem'))
      this.bookShelf.sortBooks(newBooks);
      this.bookShelf.save();
      this.refreshBooksOrder(this.bookShelf);
    }

    loadView(){

      this.bookTemplateElement = $(".template .book");
      this.bookShelfElement = $("#bookshelf");
      sortablejs.create(this.bookShelfElement[0],
              {
                handle: ".btnBookMenu",
                animation: 150,
                // Changed sorting within list
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


"use strict"
define(["jquery", "main", "Page", "util", "uiutil", 'Chapter', 'sortablejs'], function($, app, Page, util, uiutil, Chapter, sortablejs){

  class MyPage extends Page{
    onLoad(params){
      this.loadView();
    }

    onResume(){
      if(app.bookShelf.isLoaded())
        this.loadBooks(".bookshelf", app.bookShelf);
      else
        app.bookShelf.load(app.bookSourceManager)
          .then(() => this.loadBooks(".bookshelf", app.bookShelf));
    }

    onDeviceResume(){
      this.onResume();
    }

    isReadingLastestChapter(lastestChapter, readingRecord){
      return Chapter.equalTitle2(lastestChapter, readingRecord.chapterTitle);
    }

    removeBook(book){
      uiutil.showMessageDialog("确定", "确定要删除该书？",
        () => {
          const target = $(event.currentTarget);
          app.bookShelf.removeBook(book);
          this.refreshBooksOrder(".bookshelf", app.bookShelf);
          app.bookShelf.save()
            .then(() => {
              uiutil.showMessage("删除成功！");
            })
            .catch(error => {
              uiutil.showError("删除失败！");
            });
          });
      return false;
    }

    // 只更新 UI 不重新加载数据
    refreshBooksOrder(id, bookShelf){
      const books = bookShelf.books;
      const bs = $(id);
      let newOrders = [];
      let children = bs.children();
      Array.from(children).forEach(e => {
        let i = books.indexOf($(e).data("bookshelfitem"));
        newOrders[i] = e;
      });
      children.detach();
      bs.append(newOrders);
    }

    // 加载书架列表
    loadBooks(id, bookShelf){
      const books = bookShelf.books;
      const bs = $(id);
      bs.empty();
      const b = $(".template .book");

      books.forEach( value => {
        const readingRecord = value.readingRecord;
        const book = value.book;

        const nb = b.clone();
        nb.data("bookshelfitem", value);
        if(book.cover) nb.find(".book-cover").attr("src", book.cover);
        nb.find(".book-name").text(book.name)
          .addClass(`type-${app.bookSourceManager.getBookSource(book.mainSourceId).type}`);
        nb.find(".book-readingchapter").text('读到：' + readingRecord.chapterTitle);

        // 刷新最新章节
        book.getLastestChapter()
          .then(([lastestChapter]) => {
            nb.find(".book-lastestchapter")
              .text("最新：" + (lastestChapter? lastestChapter : "无"))
              .addClass(this.isReadingLastestChapter(lastestChapter, readingRecord) ? "" : 'unread-chapter');

            // 缓存后面章节内容
            book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount);
          });

        nb.find('.book-cover, .book-info')
          .click(() => app.page.showPage("readbook", {book: value.book, readingRecord: value.readingRecord}));

        nb.find('.btnBookMenu').click(event => {
          $(event.currentTarget).dropdown();
          return false;
        }).dropdown();

        nb.find('.btnDetail').click(e => app.page.showPage("bookdetail", {book: value.book}));
        nb.find('.btnRemoveBook').click((e) => this.removeBook(book));
        nb.find('.btnLockLocation').click((e) => {
          app.bookShelf.toggleLockBook(value);
          nb.find('.btnLockLocation > a').text(app.bookShelf.isLockedBook(value) ? "解锁位置" : "锁定位置");
          app.bookShelf.save();
        });
        nb.find('.btnLockLocation > a').text(app.bookShelf.isLockedBook(value) ? "解锁位置" : "锁定位置");
        bs.append(nb);
      });
    };

    // 重新给所有书籍排序
    sortBooksByElementOrder(){
      const elements = $(".bookshelf").children();
      let newBooks = Array.from(elements).map(e => $(e).data('bookshelfitem'))
      app.bookShelf.sortBooks(newBooks);
      app.bookShelf.save();
      this.refreshBooksOrder(".bookshelf", app.bookShelf);
    }

    loadView(){
      sortablejs.create($(".bookshelf")[0],
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


define(["jquery", "util", "book", "page", "bootstrap", "reactCSS"], function($, util, book, page, reactCSS) {
    "use strict"

    var app = {
        /**************** 全局变量 *******************/
        // 书籍来源管理器
        bookSourceManager: null,

        // 书架
        bookShelf: null,
        util: util,
        init: function(){
            var self = this;

            document.addEventListener("chcp_updateInstalled", function(){
                debugger;
                util.showMessage("更新资源成功！");
                location.reload();
            }, false);

            // reactCSS.init();

            this.bookSourceManager = new book.BookSourceManager("data/booksources.json");
            this.bookShelf = new book.BookShelf();
            page.init();
            // self.page = page;
            page.showPage("bookshelf");
        }
    };
    app.init();
    window.app = app;
    return app;
});

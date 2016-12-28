define(["jquery", "util", "book", "page", "bootstrap"], function($, util, book, page) {
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
            this.chekcUpdate();
        },
        chekcUpdate: function(){
            function fetchUpdateCallback(error, data) {
                if (error) {
                    util.showMessage('加载资源更新失败！错误码：' + error.code);
                    console.error(error.description);
                    return;
                }
                util.showMessage('资源更新已下载，下次启动时生效！');
            },

            function installationCallback(error) {
                if (error) {
                    util.showMessage('安装资源更新失败！错误码：' + error.code);
                    console.error(error.description);
                }
                else {
                    util.showMessage('资源更新安装成功！');
                }
            }
            // check, if update was previously loaded and available for download
            chcp.isUpdateAvailableForInstallation(function(error, data) {
                if (error) {
                    util.showMessage('开始获取资源更新。。。');
                    chcp.fetchUpdate(fetchUpdateCallback);
                    return;
                }

                // update is in cache and can be installed - install it
                console.log('Current version: ' + data.currentVersion);
                console.log('About to install: ' + data.readyToInstallVersion);
                chcp.installUpdate(installationCallback);
            });
        }
    };
    app.init();
    window.app = app;
    return app;
});

define(["jquery", "util", "book", "page", "bookshelf", "bootstrap"], function($, util, book, page, bookshelf) {

    "use strict"

    var settings = {
        cacheChapterCount: 3, // 缓存后面章节的数目
        cacheCountEachChapter: 1, // 默认情况下每章缓存的源章节数目
        cacheCountEachChapterWithWifi: 3 // 在 Wifi 下每章缓存的源章节数目
    };

    var app = {
        /**************** 全局变量 *******************/
        // 书籍来源管理器
        bookSourceManager: null,

        // 书架
        bookShelf: null,
        util: util,
        init: function(){
            if(typeof cordova != 'undefined'){
                document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
                document.addEventListener("chcp_updateInstalled", this.onUpdateInstalled.bind(this), false);
            }
            else{
                $(this.onDeviceReady.bind(this));
            }
        },
        chekcUpdate: function(){
            debugger;
            function fetchUpdateCallback(error, data) {
                if (error) {
                    util.showMessage('加载资源更新失败！\n' + error.description);
                    return;
                }
                util.showMessage('资源更新已下载，下次启动时生效！');
            }
            function installationCallback(error) {
                if (error) {
                    util.showMessage('安装资源更新失败！\n' + error.description);
                }
                else {
                    util.showMessage('资源更新安装成功！');
                }
            }

            if(chcp)chcp.isUpdateAvailableForInstallation(function(error, data) {
                if (error) {
                    util.showMessage('开始获取资源更新。。。');
                    if(chcp)chcp.fetchUpdate(fetchUpdateCallback);
                    return;
                }

                // update is in cache and can be installed - install it
                console.log('Current version: ' + data.currentVersion);
                console.log('About to install: ' + data.readyToInstallVersion);
                if(chcp)chcp.installUpdate(installationCallback);
            });
        },

        showLoading: function(){
            $("#dialogLoading").modal('show');
        },
        hideLoading: function(){
            $("#dialogLoading").modal('hide');
        },

        onDeviceReady: function() {
            var self = this;
            this.bookSourceManager = new book.BookSourceManager("data/booksources.json");

            this.bookShelf = new bookshelf.BookShelf();
            this.settings = settings;
            page.init();
            page.showPage("bookshelf");
            // this.chekcUpdate();
        },
        onUpdateInstalled: function(){
            util.showMessage("更新资源成功！");
            location.reload();
        }
    };

    window.app = app;
    app.init();
    return app;
});

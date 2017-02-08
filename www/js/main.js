"use strict";

define(["jquery", "util", "Book", "BookSourceManager", "page", "BookShelf", "bootstrap"], function ($, util, Book, BookSourceManager, page, BookShelf) {

    "use strict";

    var settings = {
        cacheChapterCount: 3,
        cacheCountEachChapter: 1,
        cacheCountEachChapterWithWifi: 3,
        nighttheme: "night1",
        daytheme: "",
        night: false
    };

    var app = {
        settings: settings,

        bookSourceManager: null,

        bookShelf: null,
        util: util,
        page: page,
        init: function init() {
            if (typeof cordova != 'undefined') {
                document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
                document.addEventListener("chcp_updateInstalled", this.onUpdateInstalled.bind(this), false);
            } else {
                $(this.onDeviceReady.bind(this));
            }
        },

        chekcUpdate: function chekcUpdate(isInstanceInstall, showMessage) {

            if (!window.chcp) return;
            function fetchUpdateCallback(error, data) {
                if (error) {
                    if (error.code == 2) {
                        if (showMessage) util.showMessage('没有更新');
                    } else {
                        var errMsg = error.description + "(" + error.code + ")";
                        util.error('Fail to download update: ' + errMsg);
                        util.showError('更新下载失败！\n' + errMsg);
                    }
                } else {
                    if (!isInstanceInstall) {
                        util.showMessage('更新已下载，下次启动时生效！');
                    } else {
                        util.log('Start to install update');
                        chcp.installUpdate(installationCallback);
                    }
                }
            }

            function installationCallback(error) {
                if (error) {
                    var errMsg = error.description + "(" + error.code + ")";
                    util.error('Fail to install update: ' + errMsg);
                    util.showError('安装更新失败！\n' + errMsg);
                } else {
                    util.log('Success to install update');
                }
            }

            chcp.isUpdateAvailableForInstallation(function (error, data) {
                if (error) {
                    if (showMessage) util.showMessage('开始检查资源更新。。。');
                    util.log('Start to check update');
                    chcp.fetchUpdate(fetchUpdateCallback);
                } else {
                    util.log('Start to install update');
                    chcp.installUpdate(installationCallback);
                }
            });
        },

        showLoading: function showLoading() {
            $("#dialogLoading").modal('show');
        },
        hideLoading: function hideLoading() {
            $("#dialogLoading").modal('hide');
        },

        onDeviceReady: function onDeviceReady() {
            var self = this;
            self.__loadSettings(function () {
                self.bookSourceManager = new BookSourceManager("data/booksources.json");
                self.bookSourceManager.init();

                self.bookShelf = new BookShelf();
                page.init();

                page.setTheme(self.settings.night ? self.settings.nighttheme : self.settings.daytheme);

                page.showPage("bookshelf");
                self.chekcUpdate(true);
            });
        },
        onUpdateInstalled: function onUpdateInstalled() {
            util.showMessage("资源更新成功！");
        },
        saveSettings: function saveSettings() {
            util.saveData('settings', this.settings);
        },
        __loadSettings: function __loadSettings(success) {
            var self = this;
            util.loadData('settings', function (data) {
                if (data) self.settings = data;
                if (success) success();
            }, function () {
                if (success) success();
            });
        }
    };

    window.app = app;
    app.init();
    return app;
});
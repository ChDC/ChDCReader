"use strict";

define(["jquery", "util", "Book", "BookSourceManager", "page", "BookShelf", "bootstrap"], function ($, util, Book, BookSourceManager, page, BookShelf) {

    "use strict";

    var app = {
        settings: {
            settings: {
                cacheChapterCount: 3,
                cacheCountEachChapter: 1,
                cacheCountEachChapterWithWifi: 3,
                nighttheme: "night1",
                daytheme: "",
                night: false
            },

            load: function load() {
                var _this = this;

                return util.loadData('settings').then(function (data) {
                    if (data) _this.settings = data;
                    return data;
                }).catch(function (e) {
                    return e;
                });
            },
            save: function save() {
                util.saveData('settings', this.settings);
            }
        },

        bookSourceManager: null,

        bookShelf: null,
        util: util,
        page: page,
        error: {
            __error: {},
            load: function load(file) {
                var _this2 = this;

                return util.getJSON(file).then(function (data) {
                    _this2.__error = data;
                });
            },
            getMessage: function getMessage(id) {
                return this.__error[id];
            }
        },
        init: function init() {
            if (typeof cordova != 'undefined') {
                document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
                document.addEventListener("chcp_updateInstalled", this.onUpdateInstalled.bind(this), false);
            } else {
                $(this.onDeviceReady.bind(this));
            }
            this.loadingbar = new util.LoadingBar('./img/loading.gif');
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


        loadingbar: null,
        showLoading: function showLoading() {
            this.loadingbar.show();
        },
        hideLoading: function hideLoading() {
            this.loadingbar.hide();
        },
        onDeviceReady: function onDeviceReady() {
            var _this3 = this;

            this.error.load("data/errorCode.json");
            this.settings.load().then(function () {
                _this3.bookSourceManager = new BookSourceManager("data/booksources.json");
                _this3.bookSourceManager.init();

                _this3.bookShelf = new BookShelf();
                page.init();

                page.setTheme(_this3.settings.settings.night ? _this3.settings.settings.nighttheme : _this3.settings.settings.daytheme);

                page.showPage("bookshelf");
                _this3.chekcUpdate(true);
            });
            document.addEventListener("pause", function () {
                app.bookShelf.save();
            }, false);
        },
        onUpdateInstalled: function onUpdateInstalled() {
            util.showMessage("资源更新成功！");
        }
    };

    window.app = app;
    app.init();
    return app;
});
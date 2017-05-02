"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["main"] = factory();
})(["utils", "uiutils", "Book", "BookSourceManager", "PageManager", "BookShelf", "CustomBookSource", "bootstrap"], function (utils, uiutils, Book, BookSourceManager, PageManager, BookShelf, customBookSource) {

  "use strict";

  var app = {
    settings: {
      settings: {
        cacheChapterCount: 3,
        cacheCountEachChapter: 1,
        cacheCountEachChapterWithWifi: 3,
        theme: {
          nighttheme: "night1",
          daytheme: "",
          night: false
        }
      },

      load: function load() {
        var _this = this;

        return utils.loadData('settings').then(function (data) {
          if (data) _this.settings = data;
          return data;
        }).catch(function (e) {
          return e;
        });
      },
      save: function save() {
        utils.saveData('settings', this.settings);
      }
    },

    bookSourceManager: null,

    bookShelf: null,

    page: null,

    error: {
      __error: {},
      load: function load(file) {
        var _this2 = this;

        return utils.getJSON(file).then(function (data) {
          _this2.__error = data;
        });
      },
      getMessage: function getMessage(errorCode) {
        if (errorCode in this.__error) return this.__error[errorCode];
        return errorCode.message;
      }
    },

    init: function init() {

      if (typeof cordova != 'undefined') {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        document.addEventListener("chcp_updateInstalled", this.onUpdateInstalled.bind(this), false);
      } else {
        $(this.onDeviceReady.bind(this));
      }

      this.loadingbar = new uiutils.LoadingBar('./img/loading.gif');
    },
    chekcUpdate: function chekcUpdate(isInstanceInstall, showMessage) {

      if (!window.chcp) return;
      function fetchUpdateCallback(error, data) {
        if (error) {
          if (error.code == 2) {
            if (showMessage) uiutils.showMessage('没有更新');
          } else {
            var errMsg = error.description + "(" + error.code + ")";
            utils.error('Fail to download update: ' + errMsg);
            uiutils.showError('更新下载失败！\n' + errMsg);
          }
        } else {
          if (!isInstanceInstall) {
            uiutils.showMessage('更新已下载，下次启动时生效！');
          } else {
            utils.log('Start to install update');
            chcp.installUpdate(installationCallback);
          }
        }
      }

      function installationCallback(error) {
        if (error) {
          var errMsg = error.description + "(" + error.code + ")";
          utils.error('Fail to install update: ' + errMsg);
          uiutils.showError('安装更新失败！\n' + errMsg);
        } else {
          utils.log('Success to install update');
        }
      }

      chcp.isUpdateAvailableForInstallation(function (error, data) {
        if (error) {
          if (showMessage) uiutils.showMessage('开始检查资源更新。。。');
          utils.log('Start to check update');
          chcp.fetchUpdate(fetchUpdateCallback);
        } else {
          utils.log('Start to install update');
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

      this.page = new PageManager();
      this.error.load("data/errorCode.json");
      this.settings.load().then(function () {
        _this3.bookSourceManager = new BookSourceManager("data/booksources.json", customBookSource);


        _this3.bookShelf = new BookShelf();

        app.theme.load();

        _this3.page.showPage("bookshelf");
        _this3.chekcUpdate(true);
      });

      var lastPressBackTime = 0;
      document.addEventListener("backbutton", function () {
        var m = Array.from(document.querySelectorAll('.modal')).reverse().find(function (e) {
          return e.style.display == 'block';
        });
        if (m) $(m).modal('hide');else if (app.page.getPageCount() > 1) navigator.app.backHistory();else {
            var now = new Date().getTime();
            if (now - lastPressBackTime < 1000) navigator.app.exitApp();else lastPressBackTime = now;
          }
      }, false);
      if (typeof cordova != "undefined" && cordova.InAppBrowser) window.open = cordova.InAppBrowser.open;
    },
    onUpdateInstalled: function onUpdateInstalled() {
      uiutils.showMessage("资源更新成功！");
    },

    theme: {
      themes: {
        day: {
          "": {
            "statuscolor": "#252526"
          }
        },
        night: {
          "night1": {
            "statuscolor": "#252526"
          }
        }
      },

      get: function get(name) {
        var dayornight = this.isNight() ? "night" : "day";
        name = name || app.settings.settings.theme[dayornight + 'theme'];
        return this.themes[dayornight][name];
      },
      load: function load(name) {
        if (!name) {
          app.page.setTheme(this.isNight() ? app.settings.settings.theme.nighttheme : app.settings.settings.theme.daytheme);
          if (typeof cordova != "undefined" && cordova.platformId == 'android') {
            if (typeof StatusBar != "undefined") {
              var themeConfig = this.get();
              if (themeConfig.statuscolor) StatusBar.backgroundColorByHexString(themeConfig.statuscolor);
            }
          }
        } else app.page.setTheme(name);
      },
      change: function change(name) {
        var dayornight = this.isNight() ? "night" : "day";
        if (name in this.themes[dayornight]) {
          app.settings.settings.theme[dayornight + 'theme'] = name;
          app.settings.save();
          this.load(name);
        }
      },
      isNight: function isNight() {
        return app.settings.settings.theme.night;
      },
      toggleNight: function toggleNight() {
        app.settings.settings.theme.night = !app.settings.settings.theme.night;
        app.settings.save();
        this.load();
      }
    }
  };

  window.app = app;
  app.init();
  return app;
});
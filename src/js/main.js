define(["util", "uiutil", "Book", "BookSourceManager", "PageManager", "BookShelf", "bootstrap"],
  function(util, uiutil, Book, BookSourceManager, PageManager, BookShelf) {

  "use strict"

  const app = {
    /**************** 全局变量 *******************/

    // 全局设置
    settings: {
      settings: {
        cacheChapterCount: 3, // 缓存后面章节的数目
        cacheCountEachChapter: 1, // 默认情况下每章缓存的源章节数目
        cacheCountEachChapterWithWifi: 3, // 在 Wifi 下每章缓存的源章节数目
        // chapterIndexOffset: 1,  // 当前章节的偏移值
        // chapterCount: 3,   // 每次加载的章节数目
        theme: {
          nighttheme: "night1", // 夜间主题
          daytheme: "", // 白天主题
          night: false
        }
      },

      load(){
        return util.loadData('settings')
          .then(data => {
            if(data)
              this.settings = data;
            return data;
          })
          .catch(e => e);
      },

      save(){
        util.saveData('settings', this.settings);
      }
    },
    // 书籍来源管理器
    bookSourceManager: null,

    // 书架
    bookShelf: null,
    // util: util,

    // 页面管理器
    page: null,

    // 全局错误码
    error: {
      __error: {},
      load(file){
        return util.getJSON(file)
          .then(data => {
            this.__error = data;
          });
      },

      getMessage(errorCode){
        if(errorCode in this.__error)
          return this.__error[errorCode];
        if(util.type(errorCode) == "error")
          return errorCode.message;
      }
    },

    // 初始化程序
    init(){

      if(typeof cordova != 'undefined'){
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        document.addEventListener("chcp_updateInstalled", this.onUpdateInstalled.bind(this), false);
      }
      else{
        // debugger;
        $(this.onDeviceReady.bind(this));
        // document.addEventListener("load", this.onDeviceReady.bind(this));
      }

      this.loadingbar = new uiutil.LoadingBar('./img/loading.gif');
    },

    // 检查资源更新
    // * isInstanceInstall 下载好资源后是否立即进行安装
    chekcUpdate(isInstanceInstall, showMessage){

      if(!window.chcp)
        return;
      function fetchUpdateCallback(error, data) {
        if (error) {
          if(error.code == 2){
            if(showMessage)
              uiutil.showMessage('没有更新');
          }
          else{
            const errMsg = error.description + "(" + error.code + ")";
            util.error('Fail to download update: ' + errMsg);
            uiutil.showError('更新下载失败！\n' + errMsg);
          }
        }
        else{
          if(!isInstanceInstall){
            uiutil.showMessage('更新已下载，下次启动时生效！');
          }
          else{
            util.log('Start to install update');
            chcp.installUpdate(installationCallback);
          }
        }
      }

      function installationCallback(error) {
        if (error) {
          const errMsg = error.description + "(" + error.code + ")";
          util.error('Fail to install update: ' + errMsg);
          uiutil.showError('安装更新失败！\n' + errMsg);
        }
        else {
          util.log('Success to install update');
          // uiutil.showMessage('安装更新成功！');
        }
      }

      // 查看本地是否有尚未安装的更新
      chcp.isUpdateAvailableForInstallation((error, data) => {
        if (error) {
          if(showMessage)
            uiutil.showMessage('开始检查资源更新。。。');
          util.log('Start to check update');
          chcp.fetchUpdate(fetchUpdateCallback);
        }
        else{
          util.log('Start to install update');
          chcp.installUpdate(installationCallback);
        }
      });
    },

    // 加载进度条
    loadingbar: null,
    showLoading(){
      this.loadingbar.show();
    },
    hideLoading(){
      this.loadingbar.hide();
    },

    onDeviceReady() {
      this.page = new PageManager();
      this.error.load("data/errorCode.json");
      this.settings.load()
        .then(() => {
          this.bookSourceManager = new BookSourceManager("data/booksources.json");
          // this.bookSourceManager.init();

          this.bookShelf = new BookShelf();
          // 设置主题
          app.theme.load();

          this.page.showPage("bookshelf");
          this.chekcUpdate(true);
        });
      document.addEventListener("pause", () => {
          app.bookShelf.save();
        }, false);
      if(typeof(cordova) != "undefined" && cordova.InAppBrowser)
        window.open = cordova.InAppBrowser.open;
    },
    onUpdateInstalled(){
      uiutil.showMessage("资源更新成功！");
      // location.reload();
    },

    // 主题管理器
    theme: {
      themes: {
        day: {
          "": {
            "statuscolor": "#252526",
          }
        },
        night: {
          "night1": {
            "statuscolor": "#252526",
          }
        },
      },

      // 获取主题配置
      get(name){
        let dayornight = this.isNight() ? "night" : "day";
        name = name || app.settings.settings.theme[ dayornight + 'theme' ];
        return this.themes[dayornight][name];
      },

      load(name){
        if(!name){
          app.page.setTheme(this.isNight() ? app.settings.settings.theme.nighttheme : app.settings.settings.theme.daytheme);
          if (typeof(cordova) != "undefined" && cordova.platformId == 'android') {
            if(typeof(StatusBar) != "undefined"){
              let themeConfig = this.get();
              if(themeConfig.statuscolor)
                StatusBar.backgroundColorByHexString(themeConfig.statuscolor);
            }
          }
        }
        else
          app.page.setTheme(name);
      },

      change(name){
        let dayornight = this.isNight() ? "night" : "day";
        if(name in this.themes[dayornight]){
          app.settings.settings.theme[ dayornight + 'theme' ] = name;
          app.settings.save();
          this.load(name);
        }
      },

      isNight(){
        return app.settings.settings.theme.night;
      },

      // 切换白天模式和夜间模式
      toggleNight(){
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

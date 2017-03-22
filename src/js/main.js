define(["util", "Book", "BookSourceManager", "PageManager", "BookShelf", "bootstrap"], function(util, Book, BookSourceManager, PageManager, BookShelf) {

    "use strict"

    const app = {
        /**************** 全局变量 *******************/
        settings: {
            settings: {
                cacheChapterCount: 3, // 缓存后面章节的数目
                cacheCountEachChapter: 1, // 默认情况下每章缓存的源章节数目
                cacheCountEachChapterWithWifi: 3, // 在 Wifi 下每章缓存的源章节数目
                // chapterIndexOffset: 1,  // 当前章节的偏移值
                // chapterCount: 3,   // 每次加载的章节数目
                nighttheme: "night1", // 夜间主题
                daytheme: "", // 白天主题
                night: false
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
        util: util,
        page: null,
        error: {
            __error: {},
            load(file){
                return util.getJSON(file)
                    .then(data => {
                        this.__error = data;
                    });
            },

            getMessage(id){
                return this.__error[id];
            }
        },
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
            this.loadingbar = new util.LoadingBar('./img/loading.gif');
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
                            util.showMessage('没有更新');
                    }
                    else{
                        const errMsg = error.description + "(" + error.code + ")";
                        util.error('Fail to download update: ' + errMsg);
                        util.showError('更新下载失败！\n' + errMsg);
                    }
                }
                else{
                    if(!isInstanceInstall){
                        util.showMessage('更新已下载，下次启动时生效！');
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
                    util.showError('安装更新失败！\n' + errMsg);
                }
                else {
                    util.log('Success to install update');
                    // util.showMessage('安装更新成功！');
                }
            }

            // 查看本地是否有尚未安装的更新
            chcp.isUpdateAvailableForInstallation((error, data) => {
                if (error) {
                    if(showMessage)
                        util.showMessage('开始检查资源更新。。。');
                    util.log('Start to check update');
                    chcp.fetchUpdate(fetchUpdateCallback);
                }
                else{
                    util.log('Start to install update');
                    chcp.installUpdate(installationCallback);
                }
            });
        },

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
                    this.bookSourceManager.init();

                    this.bookShelf = new BookShelf();
                    // 设置主题
                    this.page.setTheme(this.settings.settings.night ? this.settings.settings.nighttheme : this.settings.settings.daytheme);

                    this.page.showPage("bookshelf");
                    this.chekcUpdate(true);
                });
            document.addEventListener("pause", () => {
                    app.bookShelf.save();
                }, false);
        },
        onUpdateInstalled(){
            util.showMessage("资源更新成功！");
            // location.reload();
        }
    };

    window.app = app;
    app.init();
    return app;
});

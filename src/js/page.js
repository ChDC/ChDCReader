define(["jquery", "util"], function($, util){
    let pageManager = {

        container: "[data-page-container]",  // 页面容器的选择器
        baseurl: "page",    // 页面存储的默认目录名
        pageStack: [],  // 页面存储栈
        currentPage: undefined,  // 当前页面信息
        theme: "", // 页面的 CSS 主题

        // 重载当前页面
        reload(){
            // TODO

        },

        // 设置主题
        setTheme(theme){
            if(this.theme != theme){
                this.theme = theme;

                if(!this.currentPage)
                    return;

                // 刷新当前页面的 CSS
                let urls = this.getURLs(this.currentPage);
                let pageContainer = $(this.container);
                let cssthemeelemnt = pageContainer.find(".page-content-container .csstheme");
                let newcssthemeurl = urls.cssthemeurl;
                cssthemeelemnt.attr('href', newcssthemeurl);
            }
        },

        getURLs(name){
            let baseurl = `${this.baseurl}/${name}.page`;
            return {
                baseurl: baseurl,
                htmlurl: baseurl + ".html",
                cssurl: baseurl + ".css",
                cssthemeurl: this.theme ? `${baseurl}.${this.theme}.css` : "",
                jsurl: baseurl + ".js"
            };
        },

        // 显示指定的页面
        showPage(name, params, options){
            options = options || {};

            // util.log("showPage", baseurl);
            let pageContainer = $(this.container);

            // 如果栈中有该页则从栈中加载
            let i = util.arrayLastIndex(this.pageStack, name, (element, name) =>
                element.page == name);
            if(i>=0){
                debugger;
                pageContainer.children().detach();
                this.__closePage(this.currentPage);
                let popPage = null;
                while((popPage = this.pageStack.pop()) != null && popPage.page != name){
                    this.__closePage(popPage.page);
                }
                this.pageStack.push(popPage);
                this.__popPage();
                return;
            }

            // 拼接 URL
            let urls = this.getURLs(name);

            // 获取页面
            $.get(urls.htmlurl, content => {

                let __showPage = () => {
                    pageContainer.children().detach();
                    pageContainer.append(content);

                    this.currentPage = name;
                    this.__saveState(name, params);

                    // Load page js
                    requirejs([urls.jsurl], page => {
                        if(page.onload)
                            page.onload(params);
                        if(page.onresume)
                            page.onresume();
                    });
                }

                // util.log("Gotten page", name);
                // Load page content
                let contentContainer = '<div class="page-content-container"></div>';
                content = $(contentContainer).wrapInner(content);
                // Load page css
                content.append($('<link rel="stylesheet" type="text/css" href="' + urls.cssurl + '">'));
                // Load page theme css
                content.append($('<link class="csstheme" rel="stylesheet" type="text/css" href="' + urls.cssthemeurl + '">'));

                if(options.clear === true){
                    debugger;
                    pageContainer.children().detach();
                    this.__closePage(this.currentPage);
                    let popPage = null;
                    while((popPage = this.pageStack.pop()) != null){
                        this.__closePage(popPage.page);
                    }
                    this.pageStack.length = 0;
                    __showPage();
                }
                else{
                    // 将之前的页面存储起来
                    let currentContentContainer = pageContainer.children();
                    if(currentContentContainer.length > 0){
                        this.pageStack.push({
                            page: this.currentPage,
                            params: params,
                            content: currentContentContainer
                        });
                        // 触发之前页面的暂停事件
                        requirejs([this.getURLs(this.currentPage).jsurl],
                            page => {
                                if(page.onpause)
                                    page.onpause();
                                __showPage();
                            });
                    }
                    else{
                        __showPage();
                    }
                }
            });
        },

        __closePage(p, params){
            return new Promise((resolve, reject) => {
                // 触发当前页面的关闭事件
                let urls = this.getURLs(p);
                let jsurl = urls.jsurl;
                let executeOnPause = jsurl == this.getURLs(this.currentPage).jsurl;
                requirejs([jsurl], page => {
                    if(executeOnPause && page.onpause)
                        page.onpause();
                    if(page.onclose)
                        page.onclose(params);
                    resolve();
                    requirejs.undef(jsurl);
                });
            });
        },

        // 从页面栈中弹出页面
        __popPage(){
            return new Promise((resolve, reject) => {
                let p = this.pageStack.pop();
                if(p){
                    let pageContainer = $(this.container);
                    this.currentPage = p.page;
                    let urls = this.getURLs(this.currentPage);
                    // Load Theme CSS
                    let cssthemeelemnt = p.content.find(".csstheme");
                    let newcssthemeurl = urls.cssthemeurl;
                    if(cssthemeelemnt.attr('href') != newcssthemeurl){
                        cssthemeelemnt.attr('href', newcssthemeurl);
                    }

                    pageContainer.children().detach();
                    pageContainer.append(p.content);

                    // 触发弹出页面的恢复事件
                    requirejs([urls.jsurl],
                        page => {
                            if(page.onresume)
                                page.onresume();
                            resolve();
                        });
                }
                else{
                    resolve();
                }
            });
        },
        // 关闭当前页面
        closePage(params){
            this.__closePage(this.currentPage, params)
                .then(() => this.__popPage());
        },
        __saveState(name, params){
            // let state = {
            //     page: name,
            //     params: params
            // };
            let hash = "#page=" + name;
            window.history.pushState(true, "", hash);
        },
        __popState(event){
            let state = event.state;
            if(state){
                this.closePage();
            }
        },

        // 初始化页面管理器
        init(){
            window.onpopstate = this.__popState.bind(this);
        }
    };
    return pageManager;
});

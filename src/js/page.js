define(["jquery", "util"], function($, util){
    const pageManager = {

        container: null,  // 页面容器的选择器
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
                const urls = this.getURLs(this.currentPage);
                const cssthemeelemnt = this.container.find(".page-content-container style.csstheme");
                this.__changeThemeContent(cssthemeelemnt, urls.cssthemeurl);
            }
        },
        __changeThemeContent(cssthemeelemnt, cssThemeUrl){
            // Load page theme css

            if(cssThemeUrl){
                cssthemeelemnt.data('url', cssThemeUrl);
                $.get(cssThemeUrl, cssContent => cssthemeelemnt.text(cssContent))
                    .fail(() => cssthemeelemnt.text(""));
            }
            else{
                cssthemeelemnt.text("").data('url', "");
            }
        },

        getURLs(name){
            const baseurl = `${this.baseurl}/${name}.page`;
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
            const pageContainer = this.container;

            // 如果栈中有该页则从栈中加载
            const i = util.arrayLastIndex(this.pageStack, name, (element, name) =>
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
            const urls = this.getURLs(name);

            // 获取页面
            $.get(urls.htmlurl, content => {

                const __showPage = () => {
                    pageContainer.children().detach();
                    pageContainer.append(contentContainer);

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
                const contentContainer = $('<div class="page-content-container"></div>');
                // load page content
                contentContainer.append(content);
                // Load page css
                $.get(urls.cssurl, cssContent => {
                    contentContainer.append($("<style>").text(cssContent));

                    contentContainer.append($('<style class="csstheme">').data('url', urls.cssthemeurl));
                    // Load page theme css
                    if(urls.cssthemeurl){
                        $.get(urls.cssthemeurl, cssContent => {
                            contentContainer.find('style.csstheme').text(cssContent);
                        });
                    }
                });

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
                    const currentContentContainer = pageContainer.children();
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
                const urls = this.getURLs(p);
                const jsurl = urls.jsurl;
                const executeOnPause = jsurl == this.getURLs(this.currentPage).jsurl;
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
                const p = this.pageStack.pop();
                if(p){
                    const pageContainer = this.container;
                    this.currentPage = p.page;
                    const urls = this.getURLs(this.currentPage);
                    // Load Theme CSS
                    const cssthemeelemnt = p.content.find("style.csstheme");
                    const newcssthemeurl = urls.cssthemeurl;
                    if(cssthemeelemnt.data('url') != newcssthemeurl){
                        // cssthemeelemnt.data('url', newcssthemeurl);
                        this.__changeThemeContent(cssthemeelemnt, newcssthemeurl);
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
            // const state = {
            //     page: name,
            //     params: params
            // };
            const hash = "#page=" + name;
            window.history.pushState(true, "", hash);
        },
        __popState(event){
            const state = event.state;
            if(state){
                this.closePage();
            }
        },

        // 初始化页面管理器
        init(){
            window.onpopstate = this.__popState.bind(this);
            this.container = $("[data-page-container]");
        }
    };
    return pageManager;
});

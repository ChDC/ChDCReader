define(["jquery", "util"], function($, util){
    var pageManager = {
        container: "[data-page-container]",  // 页面容器的选择器
        baseurl: "page",    // 页面存储的默认目录名
        pageStack: [],  // 页面存储栈
        currentPage: undefined,  // 当前页面信息
        theme: "", // 页面的 CSS 主题

        // 重载当前页面
        reload: function(){
            // TODO

        },

        // 设置主题
        setTheme: function(theme){
            var self = this;
            if(this.theme != theme){
                this.theme = theme;

                if(!self.currentPage)
                    return;

                // 刷新当前页面的 CSS
                var urls = self.getURLs(self.currentPage);
                var pageContainer = $(self.container);
                var cssthemeelemnt = pageContainer.find(".csstheme");
                var newcssthemeurl = urls.cssthemeurl;
                cssthemeelemnt.attr('href', newcssthemeurl);
            }
        },

        getURLs: function(name){
            var self = this;
            var baseurl = self.baseurl + "/" + name + ".page";
            return {
                baseurl: baseurl,
                htmlurl: baseurl + ".html",
                cssurl: baseurl + ".css",
                cssthemeurl: self.theme ? baseurl + "." + self.theme + ".css" : "",
                jsurl: baseurl + ".js"
            };
        },

        // 显示指定的页面
        showPage: function(name, params, options){
            var self = this;
            options = options || {};

            // util.log("showPage", baseurl);
            var pageContainer = $(self.container);

            // 如果栈中有该页则从栈中加载
            var i = util.arrayLastIndex(self.pageStack, name, function(element, name){
                return element.page == name;
            });
            if(i>=0){
                debugger;
                pageContainer.children().detach();
                self.__closePage(self.currentPage);
                var popPage = null;
                while((popPage = self.pageStack.pop()) != null && popPage.page != name){
                    self.__closePage(popPage.page);
                }
                self.pageStack.push(popPage);
                self.__popPage();
                return;
            }

            // 拼接 URL
            var urls = self.getURLs(name);

            // 获取页面
            $.get(urls.htmlurl, function(content){
                // util.log("Gotten page", name);
                // Load page content
                var contentContainer = '<div class="page-content-container"></div>';
                content = $(contentContainer).wrapInner(content);
                // Load page css
                content.append($('<link rel="stylesheet" type="text/css" href="' + urls.cssurl + '">'));
                // Load page theme css
                content.append($('<link class="csstheme" rel="stylesheet" type="text/css" href="' + urls.cssthemeurl + '">'));

                if(options.clear === true){
                    debugger;
                    pageContainer.children().detach();
                    self.__closePage(self.currentPage);
                    var popPage = null;
                    while((popPage = self.pageStack.pop()) != null){
                        self.__closePage(popPage.page);
                    }
                    self.pageStack.length = 0;
                    __showPage();
                }
                else{
                    // 将之前的页面存储起来
                    var currentContentContainer = pageContainer.children();
                    if(currentContentContainer.length > 0){
                        self.pageStack.push({
                            page: self.currentPage,
                            params: params,
                            content: currentContentContainer
                        });
                        // 触发之前页面的暂停事件
                        require([self.getURLs(self.currentPage).jsurl], function(page){
                            if(page.onpause)
                                page.onpause();
                            __showPage();
                        });
                    }
                    else{
                        __showPage();
                    }
                }

                function __showPage(){
                    pageContainer.children().detach();
                    pageContainer.append(content);

                    self.currentPage = name;
                    self.__saveState(name, params);

                    // Load page js
                    require([urls.jsurl], function(page){
                        if(page.onload)
                            page.onload(params);
                        if(page.onresume)
                            page.onresume();
                    });
                }

            });
        },

        __closePage: function(p, params, success){
            var self = this;
            // 触发当前页面的关闭事件
            var urls = self.getURLs(p);
            var jsurl = urls.jsurl;
            var executeOnPause = jsurl == self.getURLs(self.currentPage).jsurl;
            require([jsurl], function(page){
                if(executeOnPause && page.onpause)
                    page.onpause();
                if(page.onclose)
                    page.onclose(params);
                requirejs.undef(jsurl);
                if(success)success();
            });
        },
        // 从页面栈中弹出页面
        __popPage: function(success){
            var self = this;
            var p = self.pageStack.pop();
            if(p){
                var pageContainer = $(self.container);
                self.currentPage = p.page;
                var urls = self.getURLs(self.currentPage);
                // Load Theme CSS
                var cssthemeelemnt = p.content.find(".csstheme");
                var newcssthemeurl = urls.cssthemeurl;
                if(cssthemeelemnt.attr('href') != newcssthemeurl){
                    cssthemeelemnt.attr('href', newcssthemeurl);
                }

                pageContainer.children().detach();
                pageContainer.append(p.content);

                // 触发弹出页面的恢复事件
                require([urls.jsurl], function(page){
                    if(page.onresume)
                        page.onresume();
                    if(success)success();
                });
            }
            else{
                if(success)success();
            }
        },
        // 关闭当前页面
        closePage: function(params, success){
            var self = this;
            self.__closePage(self.currentPage, params,
                function(){
                    self.__popPage(success);
                });
        },
        __saveState: function(name, params){
            // var state = {
            //     page: name,
            //     params: params
            // };
            var hash = "#page=" + name;
            window.history.pushState(true, "", hash);
        },
        __popState: function(event){
            var state = event.state;
            if(state){
                this.closePage();
            }
        },

        // 初始化页面管理器
        init: function(){
            window.onpopstate = this.__popState.bind(this);
        }
    };
    return pageManager;
});

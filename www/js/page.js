define(["jquery", "util"], function($, util){
    var pageManager = {
        container: "[data-page-container]",  // 页面容器的选择器
        baseurl: "page",    // 页面存储的默认目录名
        pageStack: [],  // 页面存储栈
        currentPage: undefined,  // 当前页面信息

        // 显示指定的页面
        showPage: function(name, params, options){
            var self = this;
            options = options || {};

            util.log("showPage", baseurl);
            var pageContainer = $(self.container);

            // 如果栈中有该页则从栈中加载
            var i = util.arrayLastIndex(self.pageStack, name, function(element, name){
                return element.page.name == name;
            });
            if(i>=0){
                debugger;
                pageContainer.children().detach();
                self.__closePage(self.currentPage);
                var popPage = null;
                while((popPage = self.pageStack.pop()) != null && popPage.page.name != name){
                    self.__closePage(popPage.page);
                }
                self.pageStack.push(popPage);
                self.__popPage();
                return;
            }

            // 拼接 URL
            var baseurl = self.baseurl + "/" + name + ".page";
            var htmlurl = baseurl + ".html";
            var cssurl = baseurl + ".css";
            var jsurl = baseurl + ".js";

            // 获取页面
            $.get(htmlurl, function(content){
                util.log("Gotten page", name);
                // Load page content
                var contentContainer = '<div class="page-content-container"></div>';
                content = $(contentContainer).wrapInner(content);
                // Load page css
                content.append($('<link rel="stylesheet" type="text/css" href="' + cssurl + '">'));

                if(options.clear === true){
                    debugger;
                    pageContainer.children().detach();
                    self.__closePage(self.currentPage);
                    var popPage = null;
                    while((popPage = self.pageStack.pop()) != null){
                        self.__closePage(popPage.page);
                    }
                    self.pageStack.length = 0;
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
                        require([self.currentPage.jsurl], function(page){
                            if(page.onpause)
                                page.onpause();
                        });
                    }
                }

                pageContainer.children().detach();
                pageContainer.append(content);

                self.currentPage = {
                    name: name,
                    htmlurl: htmlurl,
                    cssurl: cssurl,
                    jsurl: jsurl
                };

                self.__saveState(name, params);

                // Load page js
                require([jsurl], function(page){
                    if(page.onload)
                        page.onload(params);
                    if(page.onresume)
                        page.onresume();
                });
            });
        },

        __closePage: function(p, params){
            var self = this;
            // 触发当前页面的关闭事件
            var jsurl = p.jsurl;
            var executeOnPause = jsurl == self.currentPage.jsurl;
            require([jsurl], function(page){
                if(executeOnPause && page.onpause)
                    page.onpause();
                if(page.onclose)
                    page.onclose(params);
                requirejs.undef(jsurl);
            });
        },
        // 从页面栈中弹出页面
        __popPage: function(){
            var self = this;
            var p = self.pageStack.pop();
            if(p){
                var pageContainer = $(self.container);
                self.currentPage = p.page;
                pageContainer.children().detach();
                pageContainer.append(p.content);
                // 触发弹出页面的恢复事件
                require([self.currentPage.jsurl], function(page){
                    if(page.onresume)
                        page.onresume();
                });
            }
        },
        // 关闭当前页面
        closePage: function(params){
            var self = this;
            this.__closePage(self.currentPage, params);
            this.__popPage();
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

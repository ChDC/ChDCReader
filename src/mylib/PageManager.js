;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["PageManager"] = factory.apply(undefined, deps.map(e => window[e]));
}(["jquery"], function($){

  class PageManager{

    // 初始化页面管理器
    constructor(options={
        container: $("[data-page-container]"),
        theme: "",
        baseurl: "page"
      }){

      this.__pageStack = [];  // 页面存储栈，第一个元素为栈顶
      this.__container = options.container;  // 页面容器的选择器
      this.__baseurl = options.baseurl;    // 页面存储的默认目录名
      this.__theme = options.theme; // 页面的 CSS 主题

      window.onpopstate = this.__popState.bind(this);
    }

    // 重载当前页面
    reload(){
      // TODO

    }

    getPageCount(){
      return this.__pageStack.length;
    }

    // 设置主题
    setTheme(theme){
      if(this.__theme != theme){
        this.__theme = theme;

        let curPage = this.getPage();
        if(!curPage) return;

        // 刷新当前页面的 CSS
        const urls = this.getURLs(curPage.name);
        const cssthemeelemnt = this.__container.find(".page-content-container style.csstheme");
        return this.__changeThemeContent(cssthemeelemnt, urls.cssthemeurl);
      }
      return Promise.resolve();
    }

    __changeThemeContent(cssthemeelemnt, cssThemeUrl){
      // Load page theme css

      if(cssThemeUrl){
        cssthemeelemnt.data('url', cssThemeUrl);
        return $.get(cssThemeUrl, cssContent => cssthemeelemnt.text(cssContent))
          .fail(() => cssthemeelemnt.text(""));
      }
      else{
        cssthemeelemnt.text("").data('url', "");
        return Promise.resolve();
      }
    }

    getURLs(name){
      const baseurl = `${this.__baseurl}/${name}.page`;
      return {
        baseurl: baseurl,
        htmlurl: baseurl + ".html",
        cssurl: baseurl + ".css",
        cssthemeurl: this.__theme ? `${baseurl}.${this.__theme}.css` : "",
        jsurl: baseurl + ".js"
      };
    }

    // 获取页面，缺省为当前页面
    getPage(name){
      if(!name)
        // 当前页面
        return this.__pageStack[0];

      return this.__pageStack.find(e => e.name == name);
    }

    // 显示指定的页面
    showPage(name, params, options={}, dontShowTargetPage=false){

      // console.log("showPage", baseurl);

      // 如果栈中有该页则从栈中加载
      const i = this.__pageStack.findIndex(e => e.name == name);
      if(i == 0)
        return Promise.reject(new Error("the current page is the page")); // 当前页面就是要显示的页面，所以退出
      else if(i > 0)
        return this.closePage(this.__pageStack[i-1].name);

      // 如果缓存中没有该页，则新建
      // 拼接 URL
      const urls = this.getURLs(name);

      // 获取页面
      return $.get(urls.htmlurl)
        .then(content => {

          // console.log("Gotten page", name);
          const contentContainer = $('<div class="page-content-container"></div>');
          // load page content
          contentContainer.append(content);
          // Load page css
          $.get(urls.cssurl, cssContent => {
            contentContainer.append($("<style>").text(cssContent));
            contentContainer.append($('<style class="csstheme">').data('url', urls.cssthemeurl));
            // Load page theme css
            if(urls.cssthemeurl)
              $.get(urls.cssthemeurl, cssContent => {
                contentContainer.find('style.csstheme').text(cssContent);
              });
          });

          // 触发之前页面的暂停事件
          let curPage = this.getPage();
          if(curPage && !dontShowTargetPage){
            curPage.jsPage.__onPause();  // 用于管理 onDevicePause 事件
            curPage.jsPage.fireEvent('pause');
          }

          // 将当前的页面存储起来
          this.__pageStack.unshift({
            name: name,
            params: params,
            content: contentContainer,
            jsPage: null
          });

          // 显示当前页面
          this.__container.children().detach();
          this.__container.append(contentContainer);

          this.__saveState(name, params);
        })
        .then(() =>
          // Load page js
          new Promise((resolve, reject) => {
            requirejs([urls.jsurl], Page => {
              let page = this.__newPageFactory(Page, name);
              this.getPage().jsPage = page;
              page.fireEvent('load', {params: params});
              page.__onResume(); // 用于管理 onDeviceResume 事件
              page.fireEvent('resume', {params: params});
              resolve(page);
            });
          })
        );
    }

    __newPageFactory(Page, name){
      let page = new Page();
      page.pageManager = this;
      page.name = name;
      return page;
    }

    // 关闭当前页面并跳转到另一个页面
    closeCurrentPagetAndShow(name, params, options={}){
      return this.closePage(undefined, undefined, true)
        .then(() => this.showPage(name, params, options, true));
    }

    // 关闭当前页面
    closePage(name, params, dontShowTargetPage=false){

      let cp = this.getPage();
      if(!cp)
        return Promise.reject(new Error("empty page stack"));
      if(!name)
        name = cp.name;
      else if(!this.getPage(name))
        return Promise.reject(new Error("don't exist this page"))

      // 关闭当前页面
      // 触发当前页面的暂停事件
      this.getPage().jsPage.__onPause(); // 用于管理 onDevicePause 事件
      this.getPage().jsPage.fireEvent('pause', {params: params}); // 关闭当前页面要触发 pause 事件
      this.__container.children().detach();

      // 当前中间页面
      let popPage;
      while((popPage = this.__pageStack.shift()) && popPage.name != name)
        popPage.jsPage.fireEvent('close', {params: params});
      popPage.jsPage.fireEvent('close', {params: params});

      // 弹出最后一页
      let curPage = this.getPage();
      if(!curPage) return Promise.resolve(null);

      const urls = this.getURLs(curPage.name);

      // Load Theme CSS
      const cssthemeelemnt = curPage.content.find("style.csstheme");
      if(cssthemeelemnt.data('url') != urls.cssthemeurl)
        this.__changeThemeContent(cssthemeelemnt, urls.cssthemeurl);

      this.__container.append(curPage.content);
      if(!dontShowTargetPage){
        curPage.jsPage.__onResume(); // 用于管理 onDeviceResume 事件
        curPage.jsPage.fireEvent('resume');
      }
      return Promise.resolve(curPage.jsPage);
    }

    __saveState(name, params){
      // const state = {
      //     page: name,
      //     params: params
      // };
      const hash = "#page=" + name;
      window.history.pushState(true, "", hash);
    }

    __popState(event){
      const state = event.state;
      if(state){
        this.closePage();
      }
    }
  };

  return PageManager;
}));

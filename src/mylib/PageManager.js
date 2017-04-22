define(["jquery", "util"], function($, util){

  class PageManager{

    // 初始化页面管理器
    constructor(options={
        container: $("[data-page-container]"),
        theme: "",
        currentPage: undefined,
        baseurl: "page"
      }){

      this.__pageStack = [];  // 页面存储栈
      this.__jsStorage = {};
      this.__container = options.container;  // 页面容器的选择器
      this.__baseurl = options.baseurl;    // 页面存储的默认目录名
      this.__currentPage = options.currentPage;  // 当前页面信息
      this.__theme = options.theme; // 页面的 CSS 主题

      window.onpopstate = this.__popState.bind(this);
    }

    // 重载当前页面
    reload(){
      // TODO

    }

    // 设置主题
    setTheme(theme){
      if(this.__theme != theme){
        this.__theme = theme;

        if(!this.__currentPage)
          return;

        // 刷新当前页面的 CSS
        const urls = this.getURLs(this.__currentPage);
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

    // 显示指定的页面
    showPage(name, params, options={}){

      // util.log("showPage", baseurl);

      // 如果栈中有该页则从栈中加载
      const i = this.__pageStack.findIndex(e => e.page == name);

      if(i>=0){
        this.__container.children().detach();
        this.__closePage(this.__currentPage);
        let popPage = null;
        while((popPage = this.__pageStack.pop()) != null && popPage.page != name){
          this.__closePage(popPage.page);
        }
        this.__pageStack.push(popPage);
        return Promise.resolve(this.__popPage());
      }

      // 如果缓存中没有该页，则新建

      // 拼接 URL
      const urls = this.getURLs(name);

      // 获取页面
      return $.get(urls.htmlurl)
        .then(content => {

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
            this.__container.children().detach();
            this.__closePage(this.__currentPage);
            let popPage = null;
            while((popPage = this.__pageStack.pop()) != null){
              this.__closePage(popPage.page);
            }
            this.__pageStack.length = 0;
            // __showPage();
          }
          else{
            // 将之前的页面存储起来
            const currentContentContainer = this.__container.children();
            if(currentContentContainer.length > 0){
              this.__pageStack.push({
                page: this.__currentPage,
                params: params,
                content: currentContentContainer
              });

              // 触发之前页面的暂停事件
              let page = this.__jsStorage[this.__currentPage];
              page.fireEvent('pause');
            }
          }

          // showPage
          this.__container.children().detach();
          this.__container.append(contentContainer);

          this.__currentPage = name;
          this.__saveState(name, params);
        })
        .then(() =>
          // Load page js
          new Promise((resolve, reject) => {
            requirejs([urls.jsurl], Page => {
              let page = this.__newPageFactory(Page, name);
              this.__jsStorage[name] = page;
              page.fireEvent('load', params);
              page.fireEvent('resume', params);
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

    __closePage(p, params){

      // 触发当前页面的关闭事件
      const urls = this.getURLs(p);
      const jsurl = urls.jsurl;
      const executeOnPause = jsurl == this.getURLs(this.__currentPage).jsurl;
      let page = this.__jsStorage[p];

      if(executeOnPause)
        page.fireEvent('pause', params);
      page.fireEvent('close', params);
      delete this.__jsStorage[p];
    }

    // 从页面栈中弹出页面
    __popPage(){
      const p = this.__pageStack.pop();
      if(!p)
        return p;
      this.__currentPage = p.page;
      const urls = this.getURLs(this.__currentPage);
      // Load Theme CSS
      const cssthemeelemnt = p.content.find("style.csstheme");
      const newcssthemeurl = urls.cssthemeurl;
      if(cssthemeelemnt.data('url') != newcssthemeurl){
        // cssthemeelemnt.data('url', newcssthemeurl);
        this.__changeThemeContent(cssthemeelemnt, newcssthemeurl);
      }

      this.__container.children().detach();
      this.__container.append(p.content);

      let page = this.__jsStorage[this.__currentPage];
      // 触发弹出页面的恢复事件
      page.fireEvent('resume');
      return page;
    }
    // 关闭当前页面
    closePage(params){
      this.__closePage(this.__currentPage, params);
      this.__popPage();
      return Promise.resolve();
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
});

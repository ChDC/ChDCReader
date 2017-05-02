"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["PageManager"] = factory();
})(["jquery"], function ($) {
  var PageManager = function () {
    function PageManager() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        container: $("[data-page-container]"),
        theme: "",
        baseurl: "page"
      };

      _classCallCheck(this, PageManager);

      this.__pageStack = [];
      this.__container = options.container;
      this.__baseurl = options.baseurl;
      this.__theme = options.theme;

      window.onpopstate = this.__popState.bind(this);
    }

    _createClass(PageManager, [{
      key: "reload",
      value: function reload() {}
    }, {
      key: "getPageCount",
      value: function getPageCount() {
        return this.__pageStack.length;
      }
    }, {
      key: "setTheme",
      value: function setTheme(theme) {
        if (this.__theme != theme) {
          this.__theme = theme;

          var curpage = this.getPage();
          if (!curpage) return;

          var urls = this.getURLs(curpage.name);
          var cssthemeelemnt = this.__container.find(".page-content-container style.csstheme");
          return this.__changeThemeContent(cssthemeelemnt, urls.cssthemeurl);
        }
        return Promise.resolve();
      }
    }, {
      key: "__changeThemeContent",
      value: function __changeThemeContent(cssthemeelemnt, cssThemeUrl) {

        if (cssThemeUrl) {
          cssthemeelemnt.data('url', cssThemeUrl);
          return $.get(cssThemeUrl, function (cssContent) {
            return cssthemeelemnt.text(cssContent);
          }).fail(function () {
            return cssthemeelemnt.text("");
          });
        } else {
          cssthemeelemnt.text("").data('url', "");
          return Promise.resolve();
        }
      }
    }, {
      key: "getURLs",
      value: function getURLs(name) {
        var baseurl = this.__baseurl + "/" + name + ".page";
        return {
          baseurl: baseurl,
          htmlurl: baseurl + ".html",
          cssurl: baseurl + ".css",
          cssthemeurl: this.__theme ? baseurl + "." + this.__theme + ".css" : "",
          jsurl: baseurl + ".js"
        };
      }
    }, {
      key: "getPage",
      value: function getPage(name) {
        if (!name) return this.__pageStack[0];

        return this.__pageStack.find(function (e) {
          return e.name == name;
        });
      }
    }, {
      key: "showPage",
      value: function showPage(name, params) {
        var _this = this;

        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var dontShowTargetPage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

        var i = this.__pageStack.findIndex(function (e) {
          return e.name == name;
        });
        if (i == 0) return Promise.reject(new Error("the current page is the page"));else if (i > 0) return this.closePage(this.__pageStack[i - 1].name, dontShowTargetPage);

        var urls = this.getURLs(name);

        return $.get(urls.htmlurl).then(function (content) {
          var contentContainer = $('<div class="page-content-container"></div>');

          contentContainer.append(content);

          $.get(urls.cssurl, function (cssContent) {
            contentContainer.append($("<style>").text(cssContent));
            contentContainer.append($('<style class="csstheme">').data('url', urls.cssthemeurl));

            if (urls.cssthemeurl) $.get(urls.cssthemeurl, function (cssContent) {
              contentContainer.find('style.csstheme').text(cssContent);
            });
          });

          var curpage = _this.getPage();
          if (curpage && !dontShowTargetPage) curpage.jsPage.fireEvent('pause');

          _this.__pageStack.unshift({
            name: name,
            params: params,
            content: contentContainer,
            jsPage: null
          });

          _this.__container.children().detach();
          _this.__container.append(contentContainer);

          _this.__saveState(name, params);
        }).then(function () {
          return new Promise(function (resolve, reject) {
            requirejs([urls.jsurl], function (Page) {
              var page = _this.__newPageFactory(Page, name);
              _this.getPage().jsPage = page;
              page.fireEvent('load', params);
              page.fireEvent('resume', params);
              resolve(page);
            });
          });
        });
      }
    }, {
      key: "__newPageFactory",
      value: function __newPageFactory(Page, name) {
        var page = new Page();
        page.pageManager = this;
        page.name = name;
        return page;
      }
    }, {
      key: "closeCurrentPagetAndShow",
      value: function closeCurrentPagetAndShow(name, params) {
        var _this2 = this;

        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        return this.closePage(undefined, undefined, true).then(function () {
          return _this2.showPage(name, params, options, true);
        });
      }
    }, {
      key: "closePage",
      value: function closePage(name, params) {
        var dontShowTargetPage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


        var cp = this.getPage();
        if (!cp) return Promise.reject(new Error("empty page stack"));
        if (!name) name = cp.name;else if (!this.getPage(name)) return Promise.reject(new Error("don't exist this page"));

        this.getPage().jsPage.fireEvent('pause', params);
        this.__container.children().detach();

        var popPage = void 0;
        while ((popPage = this.__pageStack.shift()) && popPage.name != name) {
          popPage.jsPage.fireEvent('close', params);
        }popPage.jsPage.fireEvent('close', params);

        var curPage = this.getPage();
        if (!curPage) return Promise.resolve(null);

        var urls = this.getURLs(curPage.name);

        var cssthemeelemnt = curPage.content.find("style.csstheme");
        if (cssthemeelemnt.data('url') != urls.cssthemeurl) this.__changeThemeContent(cssthemeelemnt, urls.cssthemeurl);

        this.__container.append(curPage.content);
        if (!dontShowTargetPage) curPage.jsPage.fireEvent('resume');
        return Promise.resolve(curPage.jsPage);
      }
    }, {
      key: "__saveState",
      value: function __saveState(name, params) {
        var hash = "#page=" + name;
        window.history.pushState(true, "", hash);
      }
    }, {
      key: "__popState",
      value: function __popState(event) {
        var state = event.state;
        if (state) {
          this.closePage();
        }
      }
    }]);

    return PageManager;
  }();

  ;

  return PageManager;
});
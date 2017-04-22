"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["jquery", "util"], function ($, util) {
  var PageManager = function () {
    function PageManager() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        container: $("[data-page-container]"),
        theme: "",
        currentPage: undefined,
        baseurl: "page"
      };

      _classCallCheck(this, PageManager);

      this.__pageStack = [];
      this.__jsStorage = {};
      this.__container = options.container;
      this.__baseurl = options.baseurl;
      this.__currentPage = options.currentPage;
      this.__theme = options.theme;

      window.onpopstate = this.__popState.bind(this);
    }

    _createClass(PageManager, [{
      key: "reload",
      value: function reload() {}
    }, {
      key: "setTheme",
      value: function setTheme(theme) {
        if (this.__theme != theme) {
          this.__theme = theme;

          if (!this.__currentPage) return;

          var urls = this.getURLs(this.__currentPage);
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
      key: "showPage",
      value: function showPage(name, params) {
        var _this = this;

        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var i = this.__pageStack.findIndex(function (e) {
          return e.page == name;
        });

        if (i >= 0) {
          this.__container.children().detach();
          this.__closePage(this.__currentPage);
          var popPage = null;
          while ((popPage = this.__pageStack.pop()) != null && popPage.page != name) {
            this.__closePage(popPage.page);
          }
          this.__pageStack.push(popPage);
          return Promise.resolve(this.__popPage());
        }

        var urls = this.getURLs(name);

        return $.get(urls.htmlurl).then(function (content) {
          var contentContainer = $('<div class="page-content-container"></div>');

          contentContainer.append(content);

          $.get(urls.cssurl, function (cssContent) {
            contentContainer.append($("<style>").text(cssContent));

            contentContainer.append($('<style class="csstheme">').data('url', urls.cssthemeurl));

            if (urls.cssthemeurl) {
              $.get(urls.cssthemeurl, function (cssContent) {
                contentContainer.find('style.csstheme').text(cssContent);
              });
            }
          });

          if (options.clear === true) {
            debugger;
            _this.__container.children().detach();
            _this.__closePage(_this.__currentPage);
            var _popPage = null;
            while ((_popPage = _this.__pageStack.pop()) != null) {
              _this.__closePage(_popPage.page);
            }
            _this.__pageStack.length = 0;
          } else {
            var currentContentContainer = _this.__container.children();
            if (currentContentContainer.length > 0) {
              _this.__pageStack.push({
                page: _this.__currentPage,
                params: params,
                content: currentContentContainer
              });

              var page = _this.__jsStorage[_this.__currentPage];
              page.fireEvent('pause');
            }
          }

          _this.__container.children().detach();
          _this.__container.append(contentContainer);

          _this.__currentPage = name;
          _this.__saveState(name, params);
        }).then(function () {
          return new Promise(function (resolve, reject) {
            requirejs([urls.jsurl], function (Page) {
              var page = _this.__newPageFactory(Page, name);
              _this.__jsStorage[name] = page;
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
      key: "__closePage",
      value: function __closePage(p, params) {
        var urls = this.getURLs(p);
        var jsurl = urls.jsurl;
        var executeOnPause = jsurl == this.getURLs(this.__currentPage).jsurl;
        var page = this.__jsStorage[p];

        if (executeOnPause) page.fireEvent('pause', params);
        page.fireEvent('close', params);
        delete this.__jsStorage[p];
      }
    }, {
      key: "__popPage",
      value: function __popPage() {
        var p = this.__pageStack.pop();
        if (!p) return p;
        this.__currentPage = p.page;
        var urls = this.getURLs(this.__currentPage);

        var cssthemeelemnt = p.content.find("style.csstheme");
        var newcssthemeurl = urls.cssthemeurl;
        if (cssthemeelemnt.data('url') != newcssthemeurl) {
          this.__changeThemeContent(cssthemeelemnt, newcssthemeurl);
        }

        this.__container.children().detach();
        this.__container.append(p.content);

        var page = this.__jsStorage[this.__currentPage];

        page.fireEvent('resume');
        return page;
      }
    }, {
      key: "closePage",
      value: function closePage(params) {
        this.__closePage(this.__currentPage, params);
        this.__popPage();
        return Promise.resolve();
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
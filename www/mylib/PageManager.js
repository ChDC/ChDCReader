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

            this.pageStack = [];
            this.jsStorage = {};
            this.container = options.container;
            this.baseurl = options.baseurl;
            this.currentPage = options.currentPage;
            this.theme = options.theme;

            window.onpopstate = this.__popState.bind(this);
        }

        _createClass(PageManager, [{
            key: "reload",
            value: function reload() {}
        }, {
            key: "setTheme",
            value: function setTheme(theme) {
                if (this.theme != theme) {
                    this.theme = theme;

                    if (!this.currentPage) return;

                    var urls = this.getURLs(this.currentPage);
                    var cssthemeelemnt = this.container.find(".page-content-container style.csstheme");
                    this.__changeThemeContent(cssthemeelemnt, urls.cssthemeurl);
                }
            }
        }, {
            key: "__changeThemeContent",
            value: function __changeThemeContent(cssthemeelemnt, cssThemeUrl) {

                if (cssThemeUrl) {
                    cssthemeelemnt.data('url', cssThemeUrl);
                    $.get(cssThemeUrl, function (cssContent) {
                        return cssthemeelemnt.text(cssContent);
                    }).fail(function () {
                        return cssthemeelemnt.text("");
                    });
                } else {
                    cssthemeelemnt.text("").data('url', "");
                }
            }
        }, {
            key: "getURLs",
            value: function getURLs(name) {
                var baseurl = this.baseurl + "/" + name + ".page";
                return {
                    baseurl: baseurl,
                    htmlurl: baseurl + ".html",
                    cssurl: baseurl + ".css",
                    cssthemeurl: this.theme ? baseurl + "." + this.theme + ".css" : "",
                    jsurl: baseurl + ".js"
                };
            }
        }, {
            key: "showPage",
            value: function showPage(name, params) {
                var _this = this;

                var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

                var i = util.arrayLastIndex(this.pageStack, name, function (element, name) {
                    return element.page == name;
                });
                if (i >= 0) {
                    debugger;
                    this.container.children().detach();
                    this.__closePage(this.currentPage);
                    var popPage = null;
                    while ((popPage = this.pageStack.pop()) != null && popPage.page != name) {
                        this.__closePage(popPage.page);
                    }
                    this.pageStack.push(popPage);
                    this.__popPage();
                    return;
                }

                var urls = this.getURLs(name);

                $.get(urls.htmlurl, function (content) {
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
                        _this.container.children().detach();
                        _this.__closePage(_this.currentPage);
                        var _popPage = null;
                        while ((_popPage = _this.pageStack.pop()) != null) {
                            _this.__closePage(_popPage.page);
                        }
                        _this.pageStack.length = 0;
                    } else {
                        var currentContentContainer = _this.container.children();
                        if (currentContentContainer.length > 0) {
                            _this.pageStack.push({
                                page: _this.currentPage,
                                params: params,
                                content: currentContentContainer
                            });

                            var page = _this.jsStorage[_this.currentPage];
                            page.__onPause();
                            if (page.onPause) page.onPause();
                        }
                    }

                    _this.container.children().detach();
                    _this.container.append(contentContainer);

                    _this.currentPage = name;
                    _this.__saveState(name, params);

                    requirejs([urls.jsurl], function (Page) {
                        var page = _this.__newPageFactory(Page, name);
                        _this.jsStorage[name] = page;
                        page.__onLoad();
                        if (page.onLoad) page.onLoad(params);
                        page.__onResume();
                        if (page.onResume) page.onResume();
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
                var executeOnPause = jsurl == this.getURLs(this.currentPage).jsurl;
                var page = this.jsStorage[p];

                if (executeOnPause) page.__onPause();
                if (executeOnPause && page.onPause) {
                    page.onPause();
                }
                page.__onClose(params);
                if (page.onClose) page.onClose(params);

                delete this.jsStorage[p];
            }
        }, {
            key: "__popPage",
            value: function __popPage() {
                var p = this.pageStack.pop();
                if (!p) return;
                this.currentPage = p.page;
                var urls = this.getURLs(this.currentPage);

                var cssthemeelemnt = p.content.find("style.csstheme");
                var newcssthemeurl = urls.cssthemeurl;
                if (cssthemeelemnt.data('url') != newcssthemeurl) {
                    this.__changeThemeContent(cssthemeelemnt, newcssthemeurl);
                }

                this.container.children().detach();
                this.container.append(p.content);

                var page = this.jsStorage[this.currentPage];

                page.__onResume();
                if (page.onResume) page.onResume();
            }
        }, {
            key: "closePage",
            value: function closePage(params) {
                this.__closePage(this.currentPage, params);
                this.__popPage();
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
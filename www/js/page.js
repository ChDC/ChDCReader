"use strict";

define(["jquery", "util"], function ($, util) {
    var pageManager = {

        container: "[data-page-container]",
        baseurl: "page",
        pageStack: [],
        currentPage: undefined,
        theme: "", reload: function reload() {},
        setTheme: function setTheme(theme) {
            if (this.theme != theme) {
                this.theme = theme;

                if (!this.currentPage) return;

                var urls = this.getURLs(this.currentPage);
                var pageContainer = $(this.container);
                var cssthemeelemnt = pageContainer.find(".page-content-container .csstheme");
                var newcssthemeurl = urls.cssthemeurl;
                cssthemeelemnt.attr('href', newcssthemeurl);
            }
        },
        getURLs: function getURLs(name) {
            var baseurl = this.baseurl + "/" + name + ".page";
            return {
                baseurl: baseurl,
                htmlurl: baseurl + ".html",
                cssurl: baseurl + ".css",
                cssthemeurl: this.theme ? baseurl + "." + this.theme + ".css" : "",
                jsurl: baseurl + ".js"
            };
        },
        showPage: function showPage(name, params, options) {
            var _this = this;

            options = options || {};

            var pageContainer = $(this.container);

            var i = util.arrayLastIndex(this.pageStack, name, function (element, name) {
                return element.page == name;
            });
            if (i >= 0) {
                debugger;
                pageContainer.children().detach();
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

                var __showPage = function __showPage() {
                    pageContainer.children().detach();
                    pageContainer.append(content);

                    _this.currentPage = name;
                    _this.__saveState(name, params);

                    requirejs([urls.jsurl], function (page) {
                        if (page.onload) page.onload(params);
                        if (page.onresume) page.onresume();
                    });
                };

                var contentContainer = '<div class="page-content-container"></div>';
                content = $(contentContainer).wrapInner(content);

                content.append($('<link rel="stylesheet" type="text/css" href="' + urls.cssurl + '">'));

                content.append($('<link class="csstheme" rel="stylesheet" type="text/css" href="' + urls.cssthemeurl + '">'));

                if (options.clear === true) {
                    debugger;
                    pageContainer.children().detach();
                    _this.__closePage(_this.currentPage);
                    var _popPage = null;
                    while ((_popPage = _this.pageStack.pop()) != null) {
                        _this.__closePage(_popPage.page);
                    }
                    _this.pageStack.length = 0;
                    __showPage();
                } else {
                    var currentContentContainer = pageContainer.children();
                    if (currentContentContainer.length > 0) {
                        _this.pageStack.push({
                            page: _this.currentPage,
                            params: params,
                            content: currentContentContainer
                        });

                        requirejs([_this.getURLs(_this.currentPage).jsurl], function (page) {
                            if (page.onpause) page.onpause();
                            __showPage();
                        });
                    } else {
                        __showPage();
                    }
                }
            });
        },
        __closePage: function __closePage(p, params) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                var urls = _this2.getURLs(p);
                var jsurl = urls.jsurl;
                var executeOnPause = jsurl == _this2.getURLs(_this2.currentPage).jsurl;
                requirejs([jsurl], function (page) {
                    if (executeOnPause && page.onpause) page.onpause();
                    if (page.onclose) page.onclose(params);
                    resolve();
                    requirejs.undef(jsurl);
                });
            });
        },
        __popPage: function __popPage() {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                var p = _this3.pageStack.pop();
                if (p) {
                    var pageContainer = $(_this3.container);
                    _this3.currentPage = p.page;
                    var urls = _this3.getURLs(_this3.currentPage);

                    var cssthemeelemnt = p.content.find(".csstheme");
                    var newcssthemeurl = urls.cssthemeurl;
                    if (cssthemeelemnt.attr('href') != newcssthemeurl) {
                        cssthemeelemnt.attr('href', newcssthemeurl);
                    }

                    pageContainer.children().detach();
                    pageContainer.append(p.content);

                    requirejs([urls.jsurl], function (page) {
                        if (page.onresume) page.onresume();
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        },
        closePage: function closePage(params) {
            var _this4 = this;

            this.__closePage(this.currentPage, params).then(function () {
                return _this4.__popPage();
            });
        },
        __saveState: function __saveState(name, params) {
            var hash = "#page=" + name;
            window.history.pushState(true, "", hash);
        },
        __popState: function __popState(event) {
            var state = event.state;
            if (state) {
                this.closePage();
            }
        },
        init: function init() {
            window.onpopstate = this.__popState.bind(this);
        }
    };
    return pageManager;
});
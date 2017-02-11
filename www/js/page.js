"use strict";

define(["jquery", "util"], function ($, util) {
    var pageManager = {
        container: "[data-page-container]",
        baseurl: "page",
        pageStack: [],
        currentPage: undefined,
        theme: "",
        reload: function reload() {},

        setTheme: function setTheme(theme) {
            var self = this;
            if (this.theme != theme) {
                this.theme = theme;

                if (!self.currentPage) return;

                var urls = self.getURLs(self.currentPage);
                var pageContainer = $(self.container);
                var cssthemeelemnt = pageContainer.find(".page-content-container .csstheme");
                var newcssthemeurl = urls.cssthemeurl;
                cssthemeelemnt.attr('href', newcssthemeurl);
            }
        },

        getURLs: function getURLs(name) {
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

        showPage: function showPage(name, params, options) {
            var self = this;
            options = options || {};

            var pageContainer = $(self.container);

            var i = util.arrayLastIndex(self.pageStack, name, function (element, name) {
                return element.page == name;
            });
            if (i >= 0) {
                debugger;
                pageContainer.children().detach();
                self.__closePage(self.currentPage);
                var popPage = null;
                while ((popPage = self.pageStack.pop()) != null && popPage.page != name) {
                    self.__closePage(popPage.page);
                }
                self.pageStack.push(popPage);
                self.__popPage();
                return;
            }

            var urls = self.getURLs(name);

            $.get(urls.htmlurl, function (content) {
                var contentContainer = '<div class="page-content-container"></div>';
                content = $(contentContainer).wrapInner(content);

                content.append($('<link rel="stylesheet" type="text/css" href="' + urls.cssurl + '">'));

                content.append($('<link class="csstheme" rel="stylesheet" type="text/css" href="' + urls.cssthemeurl + '">'));

                if (options.clear === true) {
                    debugger;
                    pageContainer.children().detach();
                    self.__closePage(self.currentPage);
                    var _popPage = null;
                    while ((_popPage = self.pageStack.pop()) != null) {
                        self.__closePage(_popPage.page);
                    }
                    self.pageStack.length = 0;
                    __showPage();
                } else {
                    var currentContentContainer = pageContainer.children();
                    if (currentContentContainer.length > 0) {
                        self.pageStack.push({
                            page: self.currentPage,
                            params: params,
                            content: currentContentContainer
                        });

                        requirejs([self.getURLs(self.currentPage).jsurl], function (page) {
                            if (page.onpause) page.onpause();
                            __showPage();
                        });
                    } else {
                        __showPage();
                    }
                }

                function __showPage() {
                    pageContainer.children().detach();
                    pageContainer.append(content);

                    self.currentPage = name;
                    self.__saveState(name, params);

                    requirejs([urls.jsurl], function (page) {
                        if (page.onload) page.onload(params);
                        if (page.onresume) page.onresume();
                    });
                }
            });
        },

        __closePage: function __closePage(p, params, success) {
            var self = this;

            var urls = self.getURLs(p);
            var jsurl = urls.jsurl;
            var executeOnPause = jsurl == self.getURLs(self.currentPage).jsurl;
            requirejs([jsurl], function (page) {
                if (executeOnPause && page.onpause) page.onpause();
                if (page.onclose) page.onclose(params);
                if (success) success();
                requirejs.undef(jsurl);
            });
        },

        __popPage: function __popPage(success) {
            var self = this;
            var p = self.pageStack.pop();
            if (p) {
                var pageContainer = $(self.container);
                self.currentPage = p.page;
                var urls = self.getURLs(self.currentPage);

                var cssthemeelemnt = p.content.find(".csstheme");
                var newcssthemeurl = urls.cssthemeurl;
                if (cssthemeelemnt.attr('href') != newcssthemeurl) {
                    cssthemeelemnt.attr('href', newcssthemeurl);
                }

                pageContainer.children().detach();
                pageContainer.append(p.content);

                requirejs([urls.jsurl], function (page) {
                    if (page.onresume) page.onresume();
                    if (success) success();
                });
            } else {
                if (success) success();
            }
        },

        closePage: function closePage(params, success) {
            var self = this;
            self.__closePage(self.currentPage, params, function () {
                self.__popPage(success);
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
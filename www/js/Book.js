"use strict";

define(["jquery", "util", "Chapter", "BookSource"], function ($, util, Chapter, BookSource) {
    "use strict";

    function Book() {};

    Book.getError = function (errorCode) {
        var bookErrorCode = {
            201: "未在书源中发现指定章节！",
            202: "没有更新的章节了！",
            203: "前面没有章节了！",
            205: "索引值应该是数字！",
            206: "章节内容错误",
            207: "未从缓存中发现该章节",

            301: "设置主要内容来源失败！",
            302: "未找到该源",

            400: "不能频繁更新书籍目录",
            402: "不能频繁更新最新章节",
            401: "源配置不正确！",
            404: "未在当前的源中找到该书！",

            501: "目录为空",

            601: "获取目录失败，请检查书源是否正常",
            602: "搜索结果为空，请检查书源是否正常"
        };
        return {
            id: errorCode,
            message: bookErrorCode[errorCode]
        };
    };

    Book.Cast = function (obj) {
        var nb = new Book();
        $.extend(true, nb, obj);

        for (var bsid in nb.sources) {
            var nbs = new BookSource(bsid);
            $.extend(nbs, nb.sources[bsid]);
            nb.sources[bsid] = nbs;
        }
        return nb;
    };

    Book.prototype.name = "";
    Book.prototype.author = "";
    Book.prototype.catagory = "";
    Book.prototype.cover = "";
    Book.prototype.complete = undefined;
    Book.prototype.introduce = "";
    Book.prototype.sources = undefined;
    Book.prototype.mainSourceId = undefined;
    Book.prototype.getBookSource = function (success, fail, options) {
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;
        var bs = self.sources[options.bookSourceId];
        if (bs) {
            if (success) success(bs, options.bookSourceId);
        } else {
            var bsm = options.bookSourceManager.sources[options.bookSourceId];
            if (bsm) {
                var bss = new BookSource(options.bookSourceId, bsm.contentSourceWeight);
                self.sources[options.bookSourceId] = bss;

                if (success) success(bss, options.bookSourceId);
            } else {
                if (fail) fail(Book.getError(302));
            }
        }
    };

    Book.prototype.checkBookSources = function (bookSourceManager) {
        var self = this;
        var sources = bookSourceManager.sources;
        for (var k in sources) {
            if (!(k in self.sources)) {
                var bss = new BookSource(k, sources[k].contentSourceWeight);
                self.sources[k] = bss;
            }
        }
    };

    Book.prototype.setMainSourceId = function (bookSourceId, success, fail, options) {
        var self = this;
        if (self.mainSourceId == bookSourceId) return;

        options = $.extend(true, {}, options);
        if (bookSourceId && bookSourceId in options.bookSourceManager.sources) {
            self.mainSourceId = bookSourceId;
            if (success) success(self);
        } else {
            if (fail) fail(Book.getError(301));
        }
    };

    Book.prototype.getCatalog = function (success, fail, options) {
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.getBookSource(function (bs) {
            bs.getCatalog(options.bookSourceManager, self, options.forceRefresh, success, fail);
        }, fail, options);
    };

    Book.prototype.refreshBookInfo = function (success, fail, options) {
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.getBookSource(function (bs, bsid) {

            bs.getBookInfo(options.bookSourceManager, self, function (book) {
                self.catagory = book.catagory;
                self.cover = book.cover;
                self.complete = book.complete;
                self.introduce = book.introduce;
            }, fail);
        }, fail, options);
    };

    Book.prototype.index = function (chapterIndex, success, fail, options) {
        if ($.type(chapterIndex) != "number") {
            if (fail) fail(Book.getError(205));
            return;
        }

        if (chapterIndex < 0) {
            if (fail) fail(Book.getError(203));
            return;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.getCatalog(function (catalog) {
            if (!catalog || catalog.length <= 0) {
                if (fail) fail(Book.getError(501));
                return;
            }
            if (chapterIndex >= 0 && chapterIndex < catalog.length) {
                if (success) success(catalog[chapterIndex], chapterIndex, catalog);
            } else if (chapterIndex >= catalog.length) {
                options.forceRefresh = true;
                self.getCatalog(function (catalog) {
                    if (!catalog || catalog.length <= 0) {
                        if (fail) fail(Book.getError(501));
                        return;
                    }
                    if (chapterIndex >= 0 && chapterIndex < catalog.length) {
                        if (success) success(catalog[chapterIndex], chapterIndex, catalog);
                    } else {
                        if (fail) fail(Book.getError(202));
                    }
                }, fail, options);
            } else {
                if (fail) fail(Book.getError(203));
            }
        }, fail, options);
    };

    Book.prototype.fuzzySearch = function (sourceB, index, success, fail, options) {

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        if (options.bookSourceId == sourceB) {
            self.index(index, function (chapter, chapterIndex, catalog) {
                if (success) success(chapter, chapterIndex, catalog, sourceB);
            }, fail, options);
        } else {
            self.getCatalog(function (catalog) {
                if (!catalog || catalog.length <= 0) {
                    if (fail) fail(Book.getError(501));
                    return;
                }

                options.bookSourceId = sourceB;
                fuzzySearchWhenNotEqual(catalog);
            }, fail, options);
        }

        function fuzzySearchWhenNotEqual(catalog, stop) {

            self.getCatalog(function (catalogB) {

                if (!catalogB || catalogB.length <= 0) {
                    if (fail) fail(Book.getError(501));
                    return;
                }

                var matchs = [[util.listMatch.bind(util), Chapter.equalTitle.bind(Chapter)], [util.listMatchWithNeighbour.bind(util), Chapter.equalTitle.bind(Chapter)], [util.listMatchWithNeighbour.bind(util), Chapter.equalTitleWithoutNum.bind(Chapter)]];
                for (var i = 0; i < matchs.length; i++) {
                    var match = matchs[i];
                    var indexB = match[0](catalog, catalogB, index, match[1]);
                    if (indexB >= 0) {
                        if (success) {
                            var chapterB = catalogB[indexB];
                            success(chapterB, indexB, catalogB, sourceB);
                            return;
                        }
                    } else {
                        continue;
                    }
                }

                if (stop) {
                    if (fail) fail(Book.getError(201));
                    return;
                }

                options.forceRefresh = true;
                fuzzySearchWhenNotEqual(catalog, true);
            }, fail, options);
        }
    };

    Book.prototype.getChapter = function (chapterIndex, success, fail, options) {

        if (chapterIndex < 0) {
            if (fail) fail(Book.getError(203));
            return;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.index(chapterIndex, function (chapter, index, catalog) {
            self.__getChapterFromContentSources(catalog, index, success, fail, options);
        }, fail, options);
    };

    Book.prototype.__getChapterFromContentSources = function (catalog, index, success, finalFail, options) {
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        var chapterA = catalog[index];
        var result = [];
        var count = options.count || 1;
        var FOUND_WEIGHT = 0;
        var NOTFOUND_WEIGHT = -2;
        var EXECLUDE_WEIGHT = -4;
        var INCLUDE_WEIGHT = 0;
        if (options.excludes && options.excludes.indexOf(options.contentSourceId) >= 0) options.contentSourceId = null;

        if (options.contentSourceId && $.type(options.contentSourceChapterIndex) == 'number') {
            getChapterFromSelectBookSourceAndSelectSourceChapterIndex(options.contentSourceId, options.contentSourceChapterIndex);
        } else if (options.contentSourceId) {
            getChapterFromContentSources2(options.contentSourceId);
        } else {
            getChapterFromContentSources2();
        }

        function addChapterToResult(chapterB, indexB, source) {
            if (!options.noInfluenceWeight) self.sources[source].weight += FOUND_WEIGHT;

            result.push({
                chapter: chapterB,
                title: chapterA.title,
                index: index,
                options: {
                    contentSourceId: source,
                    contentSourceChapterIndex: indexB
                }
            });
        }

        function submitResult() {
            if (result.length <= 0) {
                if (finalFail) finalFail(Book.getError(201));
            } else {
                if (success) {
                    if (options.count && options.count > 1) success(result);else {
                        var r = result[0];
                        success(r.chapter, r.title, r.index, r.options);
                    }
                }
            }
        }

        function getChapterFromContentSources2(includeSource) {

            var opts = $.extend(true, {}, options);

            var contentSources = util.objectSortedKey(self.sources, 'weight');
            if (options.excludes) {
                for (var ei = 0; ei < options.excludes.length; ei++) {
                    var exclude = options.excludes[ei];
                    var i = contentSources.indexOf(exclude);
                    delete contentSources[i];
                    if (!options.noInfluenceWeight) self.sources[exclude].weight += EXECLUDE_WEIGHT;
                }
            }
            if (includeSource) {
                var _i = contentSources.indexOf(includeSource);
                delete contentSources[_i];

                contentSources.push(includeSource);
                if (!options.noInfluenceWeight) self.sources[includeSource].weight += INCLUDE_WEIGHT;
            }

            next();

            function next() {
                if (contentSources.length <= 0 || count <= 0) {
                    submitResult();
                    return;
                }
                opts.bookSourceId = contentSources.pop();

                if (!opts.bookSourceId) next();

                self.fuzzySearch(opts.bookSourceId, index, function (chapterBB, indexB, catalogB, sourceB) {
                    self.getBookSource(function (bs) {
                        bs.getChapter(opts.bookSourceManager, self, chapterBB, opts.onlyCacheNoLoad, function (chapterB) {
                            addChapterToResult(chapterB, indexB, sourceB);
                            count--;
                            next();
                        }, failToNext);
                    }, failToNext, opts);
                }, failToNext, options);
            }

            function failToNext(error) {
                if (!options.noInfluenceWeight) self.sources[opts.bookSourceId].weight += NOTFOUND_WEIGHT;
                next();
            }
        }

        function handleWithNormalMethod(error) {
            getChapterFromContentSources2();
        }

        function getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex) {

            var opts = $.extend(true, {}, options);
            opts.bookSourceId = contentSourceId;
            if (!options.noInfluenceWeight) self.sources[contentSourceId].weight += INCLUDE_WEIGHT;

            self.index(contentSourceChapterIndex, function (chapterB, indexB, catalogB) {
                if (Chapter.equalTitle(chapterA, chapterB)) {
                    self.getBookSource(function (bs) {
                        bs.getChapter(opts.bookSourceManager, self, chapterB, opts.onlyCacheNoLoad, function (chapterB) {
                            addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                            count--;
                            if (count > 0) {
                                debugger;
                                handleWithNormalMethod();
                            } else {
                                submitResult();
                            }
                        }, handleWithNormalMethod);
                    }, handleWithNormalMethod, opts);
                } else {
                    handleWithNormalMethod();
                }
            }, handleWithNormalMethod, opts);
        }
    };

    Book.prototype.getCountlessChapters = function (chapterIndex, direction, success, fail, finish, options) {

        if (!success) return;
        if (chapterIndex < 0 && direction < 0) {
            if (fail) fail(Book.getError(203));
            return;
        }
        if (chapterIndex < 0) {
            chapterIndex = 0;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        chapterIndex += direction >= 0 ? -1 : 1;
        options.contentSourceChapterIndex += direction >= 0 ? -1 : 1;

        next();
        function next() {
            chapterIndex += direction >= 0 ? 1 : -1;
            options.contentSourceChapterIndex += direction >= 0 ? 1 : -1;

            self.getChapter(chapterIndex, function (chapter, index, opts) {
                options = $.extend(true, options, opts);

                if (success(chapter, index, opts)) next();else {
                    if (finish) finish();
                }
            }, function (error) {
                if (error.id == 202 && direction >= 0 || error.id == 203 && direction < 0) {
                    if (fail) fail(error);
                    if (finish) finish();
                    return;
                } else if (error.id == 203 && direction >= 0 || error.id == 202 && direction < 0) {
                    if (success(null, chapterIndex, options)) next();else {
                        if (finish) finish();
                    }
                } else {
                    if (fail && fail(error)) next();else {
                        if (finish) finish();
                    }
                }
            }, options);
        }
    };

    Book.prototype.getChapters = function (chapterIndex, nextCount, direction, success, fail, options) {
        debugger;
        if (nextCount < 0) {
            return;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        for (var i = 0; i < nextCount; i++) {
            self.getChapter(chapterIndex, success, fail, options);
            chapterIndex += direction >= 0 ? 1 : -1;
            options.contentSourceChapterIndex += direction >= 0 ? 1 : -1;
        }
    };

    Book.prototype.cacheChapter = function (chapterIndex, nextCount, options) {

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;
        options.noInfluenceWeight = true;
        options.onlyCacheNoLoad = true;

        self.getChapters(chapterIndex, nextCount, 0, null, null, options);
    };

    Book.prototype.getLastestChapter = function (success, fail, options) {
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.getBookSource(function (bs) {
            bs.refreshLastestChapter(options.bookSourceManager, self, success, function (error) {
                if (error.id == 402) {
                    if (success) success(bs.lastestChapter, false);
                } else {
                    if (fail) fail(error);
                }
            });
        }, fail, options);
    };

    return Book;
});
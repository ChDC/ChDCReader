define(["jquery", "util"], function($, util) {
    "use strict"



    // ****** Book ****
    function Book(){
    };

    // book 全局的错误码定义
    /*
     * 2xx 章节错误
     * 3xx 设置源错误
     * 4xx 书籍错误
     * 5xx 目录错误
     * 6xx 书源错误
     */
    Book.getError = function(errorCode){
        var bookErrorCode = {
            201: "未发现该章节！",
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
        }
    }

    // 通过书名字和目录搜索唯一的书籍
    Book.getBook = function(bookSourceManager, bsid, bookName, bookAuthor, success, fail){
        if(bsid && bookName && bookAuthor && bsid in bookSourceManager.sources){
            // 通过当前书名和作者名搜索添加源
            Book.searchBook(bookSourceManager, bsid, bookName,
                function(books, keyword, bsid){
                    var i = util.arrayIndex(books, null, function(e){
                        return e.name == bookName && e.author == bookAuthor;
                    });
                    if(i >= 0){
                        // 找到书籍了
                        var book = books[i];
                        success(book, bsid);
                    }
                    else{
                        if(fail)fail(Book.getError(404));
                    }
                },
                function(error){
                    if(error.id == 602){
                        if(fail)fail(Book.getError(404));
                    }
                    else{
                        if(fail)fail(error);
                    }
                });
        }
        else{
            if(fail)fail(Book.getError(401));
        }
    }

    // 搜索书籍
    Book.searchBook = function(bookSourceManager, bsid, keyword, success, fail){
        var bs = bookSourceManager.sources[bsid];
        if(!bs)return;
        util.log('Search Book from: ' + bsid);

        var search = bs.search;
        var searchLink = util.format(search.url, {keyword: keyword});
        util.getDOM(searchLink, {}, getBookFromHtml, fail);

        function getBookIdFromHtml(bookElement, bookid, bss){
            var bidElement = bookElement.find(bookid.element);
            if(bookid.attribute){
                var bid = bidElement.attr(bookid.attribute);
                if(bid){
                    bss.bookid = bid;
                }
                return;
            }
        }

        function getBookFromHtml(html){
            html = $(html);
            var info = search.info;
            var detail = info.detail;
            var books = [];
            var bookItems = html.find(info.book);
            bookItems.each(function(){
                    var element = $(this);
                    var book = new Book();
                    book.name = Book.fixer.fixName(element.find(detail.name).text());  // 书名
                    book.author = Book.fixer.fixAuthor(element.find(detail.author).text());  // 作者
                    book.catagory = Book.fixer.fixCatagory(element.find(detail.catagory).text());  // 分类
                    book.cover = util.fixurl(element.find(detail.cover).attr("data-src"), searchLink);  // 封面
                    book.complete = Book.fixer.fixComplete(element.find(detail.complete).text());  // 是否完结
                    book.introduce = Book.fixer.fixIntroduce(element.find(detail.introduce).text());  // 简介

                    book.sources = {}; // 内容来源
                    var bss = new BookSource(bs.contentSourceWeight);
                    if(info.bookid){
                        getBookIdFromHtml(element, info.bookid, bss);
                    }
                    bss.detailLink = util.fixurl(element.find(detail.link).attr("href"), searchLink);
                    bss.lastestChapter = Book.fixer.fixLastestChapter(element.find(detail.lastestChapter).text());  // 最新的章节
                    // bss.catalogLink = computeCatalogLink(bss);
                    bss.searched = true;
                    book.sources[bsid] = bss;

                    book.mainSource = bsid;  // 主要来源
                    return books.push(book);
                });
            if(books.length <= 0){
                if(fail)fail(Book.getError(602));
            }
            else{
                if(success)success(books, keyword, bsid);
            }
        };
    };

    // 属性
    // Book.prototype.id = "";  // 编号
    Book.prototype.name = "";  // 书名
    Book.prototype.author = "";  // 作者
    Book.prototype.catagory = "";  // 分类
    Book.prototype.cover = "";  // 封面
    Book.prototype.complete = undefined;  // 是否完结
    Book.prototype.introduce = "";  // 简介
    Book.prototype.sources = undefined;  // 内容来源
    Book.prototype.mainSource = undefined;  // 当前来源
    // Book.prototype.lastestChapter = undefined;  // 最新的章节

    // 修复属性用的工具函数
    Book.fixer = {
        fixChapterContent: function(html){
            // 从 HTML 文本中获取格式化的正文
            return util.html2text(html);
        },

        fixChapterTitle: function(text){
            // 从 HTML 文本中获取格式化的正文
            return text.trim();
        },

        fixName: function(text)
        {
            //书名
            text = text.trim();
            return text;
        },

        fixAuthor: function(text)
        {
            //作者
            text = text.trim();
            return text;
        },

        fixCatagory: function(text)
        {
            //分类
            text = text.trim();
            return text;
        },

        // fixCover: function(text)
        // {
        //     //封面
        //     text = text.trim();
        //     return text;
        // },

        fixComplete: function(text)
        {
            //是否完结
            text = text.trim();
            return text;
        },

        fixIntroduce: function(text)
        {
            //简介
            text = text.trim();
            return text;
        },

        // fixReadingChapter: function(text)
        // {
        //     //读到的章节
        //     text = text.trim();
        //     return text;
        // },

        fixLastestChapter: function(text)
        {
            //最新的章节
            text = text.replace(/^最新更新/, '').trim()
            return text;
        }
    };

    // 方法
    // 获取当前书籍指定的目录源信息
    Book.prototype.getBookSource = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;
        var bs = self.sources[options.bookSourceId];
        if(bs){
            if(success)success(bs, options.bookSourceId);
        }
        else{
            var bsm = options.bookSourceManager.sources[options.bookSourceId];
            if(bsm)
            {
                var bss = new BookSource(bsm.contentSourceWeight);
                self.sources[options.bookSourceId] = bss;

                if(success)success(bss, options.bookSourceId);
            }
            else{
                if(fail)fail(Book.getError(302));
            }
        }
    }

    // 获取当前书籍指定的目录源的相信信息链接
    Book.prototype.getBook = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;
        self.getBookSource(function(bs, bsid){

            if(bs.disable)
            {
                if(fail)fail(Book.getError(404));
                return;
            }
            Book.getBook(options.bookSourceManager, options.bookSourceId, self.name, self.author,
                function(book, bsid){
                    // 找到书籍了
                    $.extend(bs, book.sources[bsid]);
                    if(success)success(bsid, bs);
                },
                function(error){
                    if(error.id == 404){
                        // 没找到该书就标记一下，下次直接跳过
                        bs.disable = true;
                        bs.searched = true;
                    }
                    if(fail)fail(error);
                });

        },fail, options);
    }

    // 获取当前书籍指定的目录源的相信信息链接
    Book.prototype.__getBookSourceDetailLink = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        self.getBookSource(function(bs, bsid){
            if(!bs.searched){
                self.getBook(function(bsid, bs){
                    success(bs.detailLink, bsid, bs);
                }, fail, options);
            }
            else{
                if(bs.disable){
                    if(fail)fail(Book.getError(404));
                }
                else{
                    success(bs.detailLink, bsid, bs);
                }
            }
        }, fail, options);
    };

    // 获取当前书籍指定的目录页的链接
    Book.prototype.__getBookSourceCatalogLink = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        function computeCatalogLink(bss, success){
            var bsm = options.bookSourceManager.sources[options.bookSourceId];
            if(!bsm)return;
            var catalogLink = bsm.catalog.link;
            var o = $.extend({}, bss, options.bookSourceManager[options.bookSourceId])
            var link = util.format(catalogLink, o);
            if(success)success(link);
        }

        self.getBookSource(function(bs, bsid){
            if(!bs.searched){
                self.getBook(function(bsid, bs){
                    success(bs.catalogLink, bsid, bs);
                }, fail, options);
            }
            else{
                if(bs.disable){
                    if(fail)fail(Book.getError(404));
                }
                else{
                    if(!bs.catalogLink)
                    {
                        computeCatalogLink(bs, function(link){
                            bs.catalogLink = link;
                            success(bs.catalogLink, bsid, bs);
                        });
                    }
                    else{
                        success(bs.catalogLink, bsid, bs);
                    }
                }
            }
        }, fail, options);
    };

    // 检查源是否有缺失
    Book.prototype.checkBookSources = function(bookSourceManager){
        var self = this;
        var sources = bookSourceManager.sources;
        for(var k in sources){
            if(!(k in self.sources)){
                var bss = new BookSource(sources[k].contentSourceWeight);
                self.sources[k] = bss;
            }
        }
    }

    // 设置主源
    Book.prototype.setMainSource = function(bookSourceId, success, fail, options){
        var self = this;
        if(self.mainSource == bookSourceId)
            return;

        options = $.extend(true, {}, options);
        if(bookSourceId && bookSourceId in options.bookSourceManager.sources){
            self.mainSource = bookSourceId;
            if(success)success(self);
        }
        else{
            if(fail)fail(Book.getError(301));
        }
    };

    // 使用详情页链接刷新书籍信息
    // 前提：book.sources 中有详情链接
    Book.prototype.refreshBookInfo = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;
        self.__getBookSourceDetailLink(function(detailLink, bsid, bs){
            var bsm = options.bookSourceManager.sources[bsid];
            var detail = bsm.detail;
            var info = detail.info;

            util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

            function getBookDetailFromHtml(html){
                html = $(html);
                // 更新信息的时候不更新书名和作者，因为换源的时候需要用到
                self.catagory = Book.fixer.fixCatagory(html.find(info.catagory).text());  // 分类
                self.cover = util.fixurl(html.find(info.cover).attr("data-src"), detailLink);  // 封面
                self.complete = Book.fixer.fixComplete(html.find(info.complete).text());  // 是否完结
                self.introduce = Book.fixer.fixIntroduce(html.find(info.introduce).text());  // 简介
                self.sources[options.bookSourceId].lastestChapter = Book.fixer.fixLastestChapter(html.find(info.lastestChapter).text());  // 最新的章节
                if(success)success();
            };
        },
        fail, options);
    };

    // 刷新目录
    Book.prototype.refreshCatalog = function(success, fail, options){

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        self.getBookSource(function(bs){
            if((new Date()).getTime() - bs.updatedCatalogTime < options.bookSourceManager.settings.refreshCatalogInterval * 1000){
                if(fail)fail(Book.getError(400));
            }
            else{
                util.log('Refresh Catalog!');
                self.__getBookSourceCatalogLink(function(catalogLink, bsid, bs){
                    util.getDOM(catalogLink, {}, s, fail);

                    function s(html){
                        var catalog = self.__getBookCatalogFromHTML(html, catalogLink, options);
                        bs.catalog = catalog;
                        bs.updatedCatalogTime = (new Date()).getTime();
                        bs.needSaveCatalog = true;
                        if(catalog.length <= 0){
                            if(fail)fail(Book.getError(601));
                        }
                        else{
                            if(success)success(catalog);
                        }
                    };
                },
                fail, options);
            }
        },
        fail, options);
    };

    // 从 HTML 中获取书籍章节目录
    Book.prototype.__getBookCatalogFromHTML = function(html, htmlLink, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;
        var bsm = options.bookSourceManager.sources[options.bookSourceId];
        if(!bsm)return;

        var info = bsm.catalog.info;
        var type = bsm.catalog.type.toLowerCase();
        var catalog = [];

        switch(type){
            case 'html':
                getChaptersFromHTML();
                break;
            case 'json':
                getChaptersFromJSON();
                break;
            default:
                getChaptersFromHTML();
                break;
        }
        function getChaptersFromJSON(){
            var json = JSON.parse(html);
            var chapters = util.getDataFromObject(json, info.chapter);
            $(chapters).each(function(){
                var chapter = new Chapter();
                var name = util.getDataFromObject(this, info.name);
                var linkid = util.getDataFromObject(this, info.linkid);
                chapter.title = name;
                var vip = util.getDataFromObject(this, info.vip);
                var locals = {
                        name: name,
                        linkid: linkid,
                        vip: vip
                    };

                var vipLinkPattern = util.format(info.vipLinkPattern, locals);
                if(eval(vipLinkPattern)){
                    chapter.link = null;
                }
                else{
                    chapter.link = util.format(info.link, locals);
                }
                catalog.push(chapter);
            })
        }

        function getChaptersFromHTML(){
            html = $(html);
            var chapters = html.find(info.link);
            chapters.each(function(){
                var element = $(this);
                var chapter = new Chapter();
                chapter.link = util.fixurl(element.attr('href'), htmlLink);
                if(info.vipLinkPattern && chapter.link.match(info.vipLinkPattern)){
                   chapter.link = null;
                }

                chapter.title = Book.fixer.fixChapterTitle(element.text());
                // 去重复
                // var i = util.arrayIndex(catalog, null, function(e){
                //     return e && e.title == chapter.title;
                // });
                // if(i >= 0){
                //     catalog[i] = null;
                // }
                catalog.push(chapter);
            });
        }

        return catalog.filter(function(e){return e});
    };

    // 获取目录
    // options:
    // * forceRefresh 强制刷新
    Book.prototype.getCatalog = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        self.getBookSource(function(bs){
            if(!options.forceRefresh && bs.catalog){
                if(success)success(bs.catalog);
            }
            else{
                self.refreshCatalog(success, function(error){
                    if(error.id == 400){
                        if(success)success(bs.catalog);
                    }
                    else{
                        if(fail)fail(error);
                    }
                }, options);
            }
        },
        fail, options);
    }

    // *************************** 章节部分 ****************

    // 获取指定源的指定索引的章节
    Book.prototype.index = function(chapterIndex, success, fail, options){
        if($.type(chapterIndex) != "number"){
            if(fail)
                fail(Book.getError(205));
            return;
        }

        if(chapterIndex < 0){
            if(fail)
                fail(Book.getError(203));
            return;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        self.getCatalog(function(catalog){
            if(!catalog || catalog.length <= 0){
                if(fail)fail(Book.getError(501));
                return;
            }
            if(chapterIndex >= 0 && chapterIndex < catalog.length){
                // 存在于目录中
                if(success)success(catalog[chapterIndex], chapterIndex, catalog);
            }
            else if(chapterIndex >= catalog.length)
            {
                // 超界了
                // 没有下一章节或者目录没有更新
                // 更新一下主目录源，然后再搜索
                options.forceRefresh = true;
                self.getCatalog(function(catalog){
                    if(!catalog || catalog.length <= 0){
                        if(fail)fail(Book.getError(501));
                        return;
                    }
                    if(chapterIndex >=0 && chapterIndex < catalog.length){
                        // 存在于目录中
                        if(success)success(catalog[chapterIndex], chapterIndex, catalog);
                    }
                    else{
                        if(fail)fail(Book.getError(202));
                    }
                }, fail, options);
            }
            else{
                // index < 0
                if(fail)fail(Book.getError(203));
            }
        }, fail, options);
    }

    // 在指定的源 B 中搜索目录源的中某章节的相对应的章节
    Book.prototype.fuzzySearch = function(sourceB, index, success, fail, options){

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        if(options.bookSourceId == sourceB){
        // 两源相同
            self.index(index, function(chapter, chapterIndex, catalog){
                if(success)success(chapter, chapterIndex, catalog, sourceB);
            },
            fail, options);
        }
        else{
            // 获取目录源的目录
            self.getCatalog(function(catalog){
                if(!catalog || catalog.length <= 0){
                    if(fail)fail(Book.getError(501));
                    return;
                }
                // 获取源B 的目录
                options.bookSourceId = sourceB;
                self.getCatalog(function(catalogB){
                    if(!catalogB || catalogB.length <= 0){
                        if(fail)fail(Book.getError(501));
                        return;
                    }
                    var indexB = util.listMatch(catalog, catalogB, index, Chapter.equalTitle);
                    if(indexB >= 0){
                        // 找到了
                        if(success){
                            var chapterB = catalogB[indexB];
                            success(chapterB, indexB, catalogB, sourceB);
                        }
                    }
                    else{
                        // 没找到
                        // 更新章节目录然后重新查找
                        options.forceRefresh = true;
                        self.getCatalog(function(catalogB){
                            if(!catalogB || catalogB.length <= 0){
                                if(fail)fail(Book.getError(501));
                                return;
                            }
                            var indexB = util.listMatch(catalog, catalogB, index, Chapter.equalTitle);
                            if(indexB >= 0){
                                // 找到了
                                if(success){
                                    var chapterB = catalogB[indexB];
                                    success(chapterB, indexB, catalogB, sourceB);
                                }
                            }
                            else{
                                if(fail)fail(Book.getError(201));
                            }
                        },
                        fail, options);
                    }
                },
                fail, options);
            },
            fail, options);
        }

    };

    // 从网上获取指定的章节
    // chapterIndex 是从主要目录源中获取的章节索引
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * cacheDir 缓存章节的目录
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * onlyCacheNoLoad 只缓存章节，不加载章节
    // * count 获取的数目，当 count == 1 时，用于前端获取并显示数据，当 count >= 1 时，用于缓存章节
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    Book.prototype.getChapter = function(chapterIndex, success, fail, options){

        if(chapterIndex < 0){
            if(fail)
                fail(Book.getError(203));
            return;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        self.index(chapterIndex, function(chapter, index, catalog){
            self.__getChapterFromContentSources(catalog, index, success, fail, options);
        }, fail, options);
    };

    // 按一定的算法从所有的源中找到合适的章节内容
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * cacheDir 缓存章节的目录
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * count 获取的数目
    // * onlyCacheNoLoad 只缓存章节，不加载章节
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    Book.prototype.__getChapterFromContentSources = function(catalog, index, success, finalFail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        var chapterA = catalog[index];
        var result = []; // 结果的集合，按权重排序
        var count = options.count || 1; // 想获取的数目

        // ***** 常量 ******
        var FOUND_WEIGHT = 0; // 找到后增加的权重
        var NOTFOUND_WEIGHT = -2; // 没找到的权重
        var EXECLUDE_WEIGHT = -4; // 排除的权重
        var INCLUDE_WEIGHT = 0; // 指定的源
        // *****************

        // 如果指定的源是要排除的源，则清除之
        if(options.excludes && options.excludes.indexOf(options.contentSourceId) >= 0)
            options.contentSourceId = null;
        // 如果选项中有 contentSourceId 和 contentSourceChapterIndex，则比对指定的索引
        if(options.contentSourceId && $.type(options.contentSourceChapterIndex) == 'number'){
            getChapterFromSelectBookSourceAndSelectSourceChapterIndex(options.contentSourceId, options.contentSourceChapterIndex);
        }
        else if(options.contentSourceId){
            // 仅有指定的源
            getChapterFromContentSources2(options.contentSourceId);
        }
        else{
            getChapterFromContentSources2();
        }

        // 把结果添加到 Result
        function addChapterToResult(chapterB, indexB, source){
            if(!options.noInfluenceWeight)
                self.sources[source].weight += FOUND_WEIGHT;
            var chapter = new Chapter();
            chapter.title = chapterA.title;
            chapter.content = chapterB.content;
            result.push({
                chapter: chapter,
                index: index,
                options: {
                    contentSourceId: source,
                    contentSourceChapterIndex: indexB
                }
            });
        }

        // 提交结果
        function submitResult(){
            if(result.length <= 0){
                if(finalFail)
                    finalFail(Book.getError(201));
            }
            else{
                if(success){
                    if(options.count && options.count > 1)
                        success(result);
                    else{
                        var r = result[0];
                        success(r.chapter, r.index, r.options);
                    }
                }
            }
        }

        function getChapterFromContentSources2(includeSource){

            var opts = $.extend(true, {}, options);

            var contentSources = util.objectSortedKey(self.sources, 'weight'); // 按权重从小到大排序的数组
            // 去掉要排除的源
            if(options.excludes){
                for(var ei = 0; ei < options.excludes.length; ei++)
                {
                    var exclude = options.excludes[ei];
                    var i = contentSources.indexOf(exclude);
                    delete contentSources[i];
                    if(!options.noInfluenceWeight)
                        self.sources[exclude].weight += EXECLUDE_WEIGHT;
                }
            }
            if(includeSource){
                var i = contentSources.indexOf(includeSource);
                delete contentSources[i];
                // 放到结尾处
                contentSources.push(includeSource);
                if(!options.noInfluenceWeight)
                    self.sources[includeSource].weight += INCLUDE_WEIGHT;
            }

            next();

            // 失败后换下一个源
            function next(){
                // 注意网络不通的问题
                if(contentSources.length <= 0 || count <= 0){
                    submitResult();
                    return;
                }
                opts.bookSourceId = contentSources.pop();

                if(!opts.bookSourceId)
                    next();

                self.fuzzySearch(opts.bookSourceId, index,
                    function(chapterBB, indexB, catalogB, sourceB){
                        self.__getChapterContent(chapterBB, indexB,
                            function(chapterB){
                                // 找到了章节
                                addChapterToResult(chapterB, indexB, sourceB);
                                count--;
                                next();
                            },
                            failToNext, opts);
                    }
                    , failToNext, options);
            }

            function failToNext(error){
                if(!options.noInfluenceWeight)
                    self.sources[opts.bookSourceId].weight += NOTFOUND_WEIGHT;
                next();
            }
        }


        function handleWithNormalMethod(error){
            // 失败则按正常方式获取
            // 注意网络不通的问题
            getChapterFromContentSources2();
        }

        // 从指定的源和索引中获取章节
        function getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex){

            var opts = $.extend(true, {}, options);
            opts.bookSourceId = contentSourceId;
            if(!options.noInfluenceWeight)
                self.sources[contentSourceId].weight += INCLUDE_WEIGHT;

            self.index(contentSourceChapterIndex,
                function(chapterB, indexB, catalogB){
                if(Chapter.equalTitle(chapterA, chapterB)){
                    self.__getChapterContent(chapterB, contentSourceChapterIndex,
                        function(chapterB){
                            // 找到了章节
                            addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                            count--;
                            if(count > 0){
                                debugger;
                                handleWithNormalMethod();
                            }
                            else{
                                submitResult();
                            }
                        },
                        handleWithNormalMethod, opts);
                }
                else{
                    // 不相等，则按正常方式获取
                    handleWithNormalMethod();
                }
            },
            handleWithNormalMethod, opts);
        }
    }

    // 从网络上获取章节内容
    Book.prototype.__getChapterContentFromBookSource = function(chapterLink, success, fail, options){
        if(!chapterLink){
            if(fail)fail(Book.getError(206));
            return;
        }

        util.log('Load Chpater content from Book Source: ' + chapterLink);

        var self = this;
        options = $.extend(true, {}, options);

        // 默认从主要内容源中获取章节
        options.bookSourceId = options.bookSourceId || self.mainSource;
        var bsm = options.bookSourceManager.sources[options.bookSourceId];
        var info = bsm.chapter.info;
        util.getDOM(chapterLink, {}, getChapterFromHtml, fail);

        function getChapterFromHtml(html){
            html = $(html);
            var chapter = new Chapter();
            chapter.content = Book.fixer.fixChapterContent(html.find(info.content).html());
            if(!chapter.content){
                // 没有章节内容就返回错误
                if(fail)fail(Book.getError(206));
                return;
            }
            chapter.link = chapterLink;
            chapter.title = Book.fixer.fixChapterTitle(html.find(info.title).text());
            // chapter.modifyTime = html.find(info.modifyTime).text().trim();
            if(success)success(chapter);
        }
    };

    // 从本地或网络上获取章节内容
    // * cacheDir 缓存章节的目录
    // * onlyCacheNoLoad 只缓存章节，不加载章节
    // success(chapter)
    Book.prototype.__getChapterContent = function(chapter, index, success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        // 默认从主要内容源中获取章节
        options.bookSourceId = options.bookSourceId || self.mainSource;

        // 从缓存中获取章节内容
        self.__getCacheChapter(index,
            function(c){
                if(success)success(options.onlyCacheNoLoad? chapter: c);
            },
            function(error){
                if(error.id == 207)
                {
                    // 从缓存中获取失败的话，再从网上获取章节，然后缓存到本地
                    self.__getChapterContentFromBookSource(chapter.link,
                        function(chapter){
                            // 获取章节成功
                            if(success)success(chapter);
                            // 缓存该章节
                            self.__cacheChapter(index, chapter, null, null, options);
                        }, fail, options);
                }
                else{
                    if(fail)fail(error);
                }
            }, options);
    }

    // 获取章节的缓存位置
    // * cacheDir 缓存章节的目录
    Book.prototype.__getCacheChapterLocation = function(index, options){

        var self = this;
        var bookSourceId = options.bookSourceId || '';
        var bid = self.name + '.' + self.author;
        var chapterFileName = index + '.' + bookSourceId;
        var cacheDir = options.cacheDir || "chapter";
        var dest = cacheDir + "_" + bid + "_" + chapterFileName;
        return dest;
    }

    // 获取指定的章节
    // * cacheDir 缓存章节的目录
    // * onlyCacheNoLoad 只缓存章节，不加载章节
    Book.prototype.__getCacheChapter = function(index, success, fail, options){

        var self = this;
        var dest = self.__getCacheChapterLocation(index, options);

        if(options.onlyCacheNoLoad){
            util.dataExists(dest,
                function(){
                    if(success)success(null);
                },
                function(){
                    // 章节不存在
                    if(fail)fail(Book.getError(207));
                }, true);
            return;
        }
        else{
            // 获取章节内容
            util.loadData(dest,
                function(data){
                    // 章节存在
                    if(data != null){
                        if(success){
                            var chapter = new Chapter();
                            // 类型转换
                            chapter = $.extend(true, chapter, data);
                            success(chapter);
                        }
                    }
                    else{
                        if(fail)fail(Book.getError(207));
                    }
                },
                function(){
                    if(fail)fail(Book.getError(207));
                }, true);
        }
    };

    // 缓存章节内容
    // * cacheDir 缓存章节的目录
    Book.prototype.__cacheChapter = function(index, chapter, success, fail, options){

        var self = this;
        // 保存到文件中
        var dest = self.__getCacheChapterLocation(index, options);
        util.saveData(dest, chapter, success, fail, true); // 将 JSON 对象序列化到文件中
    };

    // 一次获取多个章节
    // chapterIndex 是从主要目录源中获取的章节索引
    // direction 获取章节的方向，大于等于 0 则向下获取，小于 0 则向上获取
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * cacheDir 缓存章节的目录
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * count 获取的数目
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    Book.prototype.getCountlessChapters = function(chapterIndex, direction, success, fail, finish, options){

        if(!success)
            return;
        if(chapterIndex < 0 && direction < 0){
            if(fail)fail(Book.getError(203));
            return;
        }
        if(chapterIndex < 0){
            chapterIndex = 0;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        chapterIndex += (direction >= 0? -1 : 1);
        options.contentSourceChapterIndex += (direction >= 0? -1 : 1);

        next();
        function next(){
            chapterIndex += (direction >= 0? 1 : -1);
            options.contentSourceChapterIndex += (direction >= 0? 1 : -1);

            self.getChapter(chapterIndex,
                function(chapter, index, opts){
                    options = $.extend(true, options, opts);

                    if(success(chapter, index, opts))
                        next();
                    else{
                        if(finish)finish();
                    }
                },
                function(error){
                    debugger;
                    if(error.id == 202 && direction >= 0 || // 后面没有章节了
                       error.id == 203 && direction < 0){ // 前面没有章节了
                        // 当没有更新的章节时，直接退出
                        if(fail)fail(error);
                        if(finish)finish();
                        return;
                    }
                    else if(error.id == 203 && direction >= 0 ||
                        error.id == 202 && direction < 0){
                        debugger;
                        if(success(null, chapterIndex, options))
                            next();
                        else{
                            if(finish)finish();
                        }
                    }
                    else{
                        if(fail && fail(error))
                            next();
                        else{
                            if(finish)finish();
                        }
                    }
                }, options);
        }
    }


    // 一次获取多个章节
    // chapterIndex 是从主要目录源中获取的章节索引
    // nextCount 获取的章节数目
    // direction 获取章节的方向，大于等于 0 则向下获取，小于 0 则向上获取
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * cacheDir 缓存章节的目录
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * count 获取的数目
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    Book.prototype.getChapters = function(chapterIndex, nextCount, direction, success, fail, options){

        // if(chapterIndex < 0){
        //     nextCount += chapterIndex;
        //     chapterIndex = 0;
        // }
        debugger;
        if(nextCount < 0){
            return;
        }

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        for(var i = 0; i < nextCount; i++){
            self.getChapter(chapterIndex, success, fail, options);
            chapterIndex += (direction >= 0? 1 : -1);
            options.contentSourceChapterIndex += (direction >= 0? 1 : -1);
        }
    }

    // chapterIndex 是从主要目录源中获取的章节索引
    // nextCount 缓存的章节数目
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * cacheDir 缓存章节的目录
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * count 获取的数目，当 count == 1 时，用于前端获取并显示数据，当 count >= 1 时，用于缓存章节
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    Book.prototype.cacheChapter = function(chapterIndex, nextCount, options){

        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;
        options.noInfluenceWeight = true;
        options.onlyCacheNoLoad = true;

        self.getChapters(chapterIndex, nextCount, 0, null, null, options);
    }
    // *************************** 章节部分结束 ****************

    // 获取书籍最新章节
    Book.prototype.refreshLastestChapter = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        self.getBookSource(function(bs){
            if((new Date()).getTime() - bs.updatedLastestChapterTime < options.bookSourceManager.settings.refreshLastestChapterInterval * 1000){
                if(fail)fail(Book.getError(402));
            }
            else{
                util.log('Refresh LastestChapter!');

                self.__getBookSourceDetailLink(function(detailLink, bsid, bs){
                    var bsm = options.bookSourceManager.sources[bsid];
                    var detail = bsm.detail;
                    var info = detail.info;

                    util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

                    function getBookDetailFromHtml(html){
                        html = $(html);
                        var lastestChapter = Book.fixer.fixLastestChapter(html.find(info.lastestChapter).text());  // 最新的章节
                        var lastestChapterUpdated = false;
                        if(bs.lastestChapter != lastestChapter){
                            bs.lastestChapter = lastestChapter;
                            bs.updatedLastestChapterTime = (new Date()).getTime();
                            lastestChapterUpdated = true;
                        }
                        if(success)success(lastestChapter, lastestChapterUpdated);
                    };
                },
                fail, options);
            }
        },
        fail, options);
    };

    // 获取最新章节
    // 缺省强制更新
    Book.prototype.getLastestChapter = function(success, fail, options){
        var self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSource;

        self.getBookSource(function(bs){
            // if(!options.forceRefresh && bs.lastestChapter){
            //     if(success)success(bs.lastestChapter, false);
            // }
            // else{
                self.refreshLastestChapter(success, function(error){
                    if(error.id == 402){
                        if(success)success(bs.lastestChapter, false);
                    }
                    else{
                        if(fail)fail(error);
                    }
                }, options);
            // }
        },
        fail, options);
    }

    // **** Chapter ****
    function Chapter(){

    }

    Chapter.prototype.link = undefined;    // 链接
    Chapter.prototype.title = undefined;    // 标题
    Chapter.prototype.content = undefined;  // 内容
    // Chapter.prototype.modifyTime = undefined;  // 修改时间

    // 判断两个标题是否相等，传入的是章节
    Chapter.equalTitle = function(chapterA, chapterB){
        return Chapter.equalTitle2(chapterA.title, chapterB.title);
    }

    // 判断两个标题是否相等，传入的是章节标题
    Chapter.equalTitle2 = function(chapterTitleA, chapterTitleB){
        if(!chapterTitleA || !chapterTitleB)
            return false;
        // 比较去掉所有空格和标点符号之后的所有符号
        function stripString(str){
            // 去除括号括起来的文字
            str = str.replace(/（.*?）/, '');
            str = str.replace(/\(.*?\)/, '');

            // 去除英文字符串
            str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');
            // 去除中文字符串
            str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

            // 去除空白字符
            str = str.replace(/\s/g, '');
            return str;
        }
        // TODO：模糊判等
        var cA = stripString(chapterTitleA);
        var cB = stripString(chapterTitleB);
        return cA == cB;
    }

    // **** BookSource *****
    function BookSource(weight){
        this.needSaveCatalog = false;
        this.updatedCatalogTime = 0;
        this.updatedLastestChapterTime = 0;
        this.disable = false;
        this.weight = weight || 0;
        this.searched = false;
    };
    BookSource.prototype.detailLink = null; // 详情页链接
    BookSource.prototype.catalogLink = null; // 目录页链接
    BookSource.prototype.bookid = null; // 书籍 ID
    BookSource.prototype.catalog = null; // 目录
    BookSource.prototype.weight = 0;
    BookSource.prototype.updatedCatalogTime = 0;
    BookSource.prototype.updatedLastestChapterTime = 0;
    BookSource.prototype.needSaveCatalog = false; // 目录是否需要存储到本地
    BookSource.prototype.disable = false;
    BookSource.prototype.lastestChapter = undefined;  // 最新的章节
    BookSource.prototype.searched = false;  // 本书是否已经被搜索到了

    // 是否能更新详情内容（包括目录和最新章节）
    // BookSource.prototype.canUpdateDatail = function(){

    // }


    // **** BookSourceManager *****
    function BookSourceManager(configFileOrConfig){
        var self = this;
        if($.type(configFileOrConfig) == 'string'){
            $.getJSON(configFileOrConfig, function(data){
                self.sources = data;
            });
        }
        else{
            var data = configFileOrConfig;
            self.sources = data;
        }
        self.settings = {};
        self.settings.refreshCatalogInterval = 600; // 单位秒
        self.settings.refreshLastestChapterInterval = 600; // 单位秒

    };
    BookSourceManager.prototype.sources = undefined;
    BookSourceManager.prototype.settings = undefined;
    BookSourceManager.prototype.init = function(){
        for(var key in this){
            var value = this[key];
            if($.type(value) == 'object' && 'init' in value){
                value.init();
            }
        }
    };

    BookSourceManager.prototype.qidian = {
        csrfToken: "oJGHcTNcfLfSXs0HFt9kycMrM87i3IL9jy0VJuLu",
        getCSRToken: function(){
            var url = "http://book.qidian.com/ajax/book/category?_csrfToken=&bookId=2750457";
            $.getJSON(url, function(json, status, xhr){
                if(json.code == 0){
                    return;
                }
                var cookies = xhr.getResponseHeader("Cookies");
                debugger;
            });
        },
        init: function(){
            this.getCSRToken();
        }
    };


    // 按主源权重从小到大排序的数组
    BookSourceManager.prototype.getSourcesKeysByMainSourceWeight = function(){
        return util.objectSortedKey(this.sources, 'mainSourceWeight'); // 按主源权重从小到大排序的数组
    }

    // 按内容源权重从小到大排序的数组
    BookSourceManager.prototype.getSourcesKeysByContentSourceWeight = function(configFileOrConfig){

    }

    // 检查源是否正确
    BookSourceManager.prototype.checkBookSources = function(configFile, finish){
        $.getJSON(configFile, function(data){
            // TODO
            self.sources = data;
            if(finish)finish();
        });
    }

    // **** Return package *****
    return {
        Book: Book,
        BookSourceManager: BookSourceManager,
        BookSource: BookSource,
        Chapter: Chapter
    };
});

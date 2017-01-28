define(["jquery", "util", 'Book', 'Chapter'], function($, util, Book, Chapter) {
    "use strict"


    // **** BookSource *****
    function BookSource(id, weight){
        this.id = id;
        this.needSaveCatalog = false;
        this.updatedCatalogTime = 0;
        this.updatedLastestChapterTime = 0;
        this.disable = false;
        this.weight = weight || 0;
        this.searched = false;
    };

    BookSource.getError = function(errorCode){
        var bookErrorCode = {
            // 201: "未在书源中发现指定章节！",
            // 202: "没有更新的章节了！",
            // 203: "前面没有章节了！",
            // 205: "索引值应该是数字！",
            // 206: "章节内容错误",
            207: "未从缓存中发现该章节",

            // 301: "设置主要内容来源失败！",
            // 302: "未找到该源",

            400: "不能频繁更新书籍目录",
            402: "不能频繁更新最新章节",
            // 401: "源配置不正确！",
            404: "未在当前的源中找到该书！",

            // 501: "目录为空",

            // 601: "获取目录失败，请检查书源是否正常",
            // 602: "搜索结果为空，请检查书源是否正常"
        };
        return {
            id: errorCode,
            message: bookErrorCode[errorCode]
        }
    }

    BookSource.prototype.id = null; // 书源 ID
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


    // 获取当前书籍指定的目录源的相同信息链接
    BookSource.prototype.getBook = function(bookSourceManager, book, success, fail){
        var self = this;

        if(self.disable)
        {
            if(fail)fail(BookSource.getError(404));
            return;
        }
        bookSourceManager.getBook(self.id, book.name, book.author,
            function(book, bsid){
                // 找到书籍了
                $.extend(self, book.sources[bsid]);
                if(success)success(bsid, self);
            },
            function(error){
                if(error.id == 404){
                    // 没找到该书就标记一下，下次直接跳过
                    self.disable = true;
                    self.searched = true;
                }
                if(fail)fail(error);
            });
    }


    // 获取当前书籍指定的目录源的相信信息链接
    BookSource.prototype.__getBookSourceDetailLink = function(bookSourceManager, book, success, fail){
        var self = this;
        if(!self.searched){
            self.getBook(bookSourceManager, book,
                function(bsid, bs){
                    success(bs.detailLink, bsid, bs);
                }, fail);
        }
        else{
            if(self.disable){
                if(fail)fail(BookSource.getError(404));
            }
            else{
                success(self.detailLink, self.id, self);
            }
        }
    };

    // 获取当前书籍指定的目录页的链接
    BookSource.prototype.__getBookSourceCatalogLink = function(bookSourceManager, book, success, fail){
        var self = this;
        function computeCatalogLink(bss, success){
            var bsm = bookSourceManager.sources[self.id];
            if(!bsm)return;
            if(bsm.detail.info.catalogLink){
                self.__getBookSourceDetailLink(bookSourceManager, book,
                    function(detailLink){
                        util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

                        function getBookDetailFromHtml(html){
                            html = $(html);
                            var link = html.find(bsm.detail.info.catalogLink).attr('href');
                            if(success)success(link);
                        };
                    }
                    , fail);

                return;
            }

            var catalogLink = bsm.catalog.link;
            var o = $.extend({}, bss, bookSourceManager[self.id]);
            var link = util.format(catalogLink, o);
            if(success)success(link);
        }

        if(!self.searched){
            self.getBook(bookSourceManager, book,
                function(bsid, bs){
                    computeCatalogLink(self, function(link){
                        self.catalogLink = link;
                        success(self.catalogLink, self.id, self);
                    });
                }, fail);
        }
        else{
            if(self.disable){
                if(fail)fail(BookSource.getError(404));
            }
            else{
                if(!self.catalogLink)
                {
                    computeCatalogLink(self, function(link){
                        self.catalogLink = link;
                        success(self.catalogLink, self.id, self);
                    });
                }
                else{
                    success(self.catalogLink, self.id, self);
                }
            }
        }
    };

    // 刷新目录
    BookSource.prototype.__refreshCatalog = function(bookSourceManager, book, success, fail){

        var self = this;
        if((new Date()).getTime() - self.updatedCatalogTime < bookSourceManager.settings.refreshCatalogInterval * 1000){
            if(fail)fail(BookSource.getError(400));
        }
        else{
            util.log('Refresh Catalog!');
            self.__getBookSourceCatalogLink(bookSourceManager, book,
                function(catalogLink, bsid, bs){
                bookSourceManager.getBookCatalog(self.id, catalogLink,
                    function(catalog){
                        self.catalog = catalog;
                        self.updatedCatalogTime = (new Date()).getTime();
                        self.needSaveCatalog = true;
                        if(success)success(catalog);
                    }, fail);
            },
            fail);
        }
    };

    // 获取书籍信息
    BookSource.prototype.getBookInfo = function(bookSourceManager, book, success, fail){
        var self = this;
        self.__getBookSourceDetailLink(bookSourceManager, book, function(detailLink, bsid, bs){
            bookSourceManager.getBookInfo(bsid, detailLink,
                success, fail);
        },
        fail);
    }

    // 获取目录
    // options:
    // * forceRefresh 强制刷新
    BookSource.prototype.getCatalog = function(bookSourceManager, book, forceRefresh, success, fail){
        var self = this;
        if(!forceRefresh && self.catalog){
            if(success)success(self.catalog);
        }
        else{
            self.__refreshCatalog(bookSourceManager, book, success, function(error){
                if(error.id == 400){
                    if(success)success(self.catalog);
                }
                else{
                    if(fail)fail(error);
                }
            });
        }
    }

    // 获取书籍最新章节
    BookSource.prototype.refreshLastestChapter = function(bookSourceManager, book, success, fail){
        var self = this;
        if((new Date()).getTime() - self.updatedLastestChapterTime < bookSourceManager.settings.refreshLastestChapterInterval * 1000){
            if(fail)fail(BookSource.getError(402));
        }
        else{
            util.log('Refresh LastestChapter!');

            self.__getBookSourceDetailLink(bookSourceManager, book,
                function(detailLink, bsid, bs){

                bookSourceManager.getLastestChapter(bsid, detailLink,
                    function(lastestChapter){
                        bs.updatedLastestChapterTime = (new Date()).getTime();
                        var lastestChapterUpdated = false;
                        if(bs.lastestChapter != lastestChapter){
                            bs.lastestChapter = lastestChapter;
                            lastestChapterUpdated = true;
                        }
                        if(success)success(lastestChapter, lastestChapterUpdated);
                    }, fail);
            },
            fail);
        }
    };


    // 从本地或网络上获取章节内容
    // * cacheDir 缓存章节的目录
    // * onlyCacheNoLoad 只缓存章节，不加载章节
    // success(chapter)
    BookSource.prototype.getChapter = function(bookSourceManager, book, chapter, onlyCacheNoLoad, success, fail){
        var self = this;
        // 从缓存中获取章节内容
        self.__getCacheChapter(book, chapter.title, onlyCacheNoLoad,
            function(c){
                if(success)success(onlyCacheNoLoad? chapter: c);
            },
            function(error){
                if(error.id == 207)
                {
                    // 从缓存中获取失败的话，再从网上获取章节，然后缓存到本地
                    bookSourceManager.getChapter(self.id, chapter.link,
                        function(chapter){
                            // 获取章节成功
                            if(success)success(chapter);
                            // 缓存该章节
                            self.__cacheChapter(book, chapter, null, null);
                        }, fail);
                }
                else{
                    if(fail)fail(error);
                }
            });
    }

    // 获取章节的缓存位置
    // * cacheDir 缓存章节的目录
    BookSource.prototype.__getCacheChapterLocation = function(book, id){
        var self = this;
        var bid = book.name + '.' + book.author;
        var chapterFileName = id + '.' + self.id;
        var dest = "chapter_" + bid + "_" + chapterFileName;
        return dest;
    }

    // 获取指定的章节
    // * cacheDir 缓存章节的目录
    // * onlyCacheNoLoad 只缓存章节，不加载章节
    BookSource.prototype.__getCacheChapter = function(book, title, onlyCacheNoLoad, success, fail){

        var self = this;
        var dest = self.__getCacheChapterLocation(book, title);

        if(onlyCacheNoLoad){
            util.dataExists(dest,
                function(){
                    if(success)success(null);
                },
                function(){
                    // 章节不存在
                    if(fail)fail(BookSource.getError(207));
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
                        if(fail)fail(BookSource.getError(207));
                    }
                },
                function(){
                    if(fail)fail(BookSource.getError(207));
                }, true);
        }
    };

    // 缓存章节内容
    // * cacheDir 缓存章节的目录
    BookSource.prototype.__cacheChapter = function(book, chapter, success, fail){

        var self = this;
        // 保存到文件中
        var dest = self.__getCacheChapterLocation(book, chapter.title);
        util.saveData(dest, chapter, success, fail, true); // 将 JSON 对象序列化到文件中
    };

    return BookSource;
});

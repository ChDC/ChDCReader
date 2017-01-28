define(["jquery", "util", "Book", "BookSource", "Chapter"], function($, util, Book, BookSource, Chapter) {
    "use strict"

    // book 全局的错误码定义
    /*
     * 2xx 章节错误
     * 3xx 设置源错误
     * 4xx 书籍错误
     * 5xx 目录错误
     * 6xx 书源错误
     */
    BookSourceManager.getError = function(errorCode){
        var bookErrorCode = {
            206: "章节内容错误",
            401: "源配置不正确！",
            404: "未在当前的源中找到该书！",
            601: "获取目录失败，请检查书源是否正常",
            602: "搜索结果为空，请检查书源是否正常"
        };
        return {
            id: errorCode,
            message: bookErrorCode[errorCode]
        }
    }

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

    // 修复属性用的工具函数
    BookSourceManager.fixer = {
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


    // 通过书名字和目录搜索唯一的书籍
    BookSourceManager.prototype.getBook = function(bsid, bookName, bookAuthor, success, fail){
        var self = this;
        if(bsid && bookName && bookAuthor && bsid in self.sources){
            // 通过当前书名和作者名搜索添加源
            self.searchBook(bsid, bookName,
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
                        if(fail)fail(BookSourceManager.getError(404));
                    }
                },
                function(error){
                    if(error.id == 602){
                        if(fail)fail(BookSourceManager.getError(404));
                    }
                    else{
                        if(fail)fail(error);
                    }
                });
        }
        else{
            if(fail)fail(BookSourceManager.getError(401));
        }
    }

    // 搜索书籍
    BookSourceManager.prototype.searchBook = function(bsid, keyword, success, fail){
        var self = this;
        var bs = self.sources[bsid];
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
                    book.name = BookSourceManager.fixer.fixName(element.find(detail.name).text());  // 书名
                    book.author = BookSourceManager.fixer.fixAuthor(element.find(detail.author).text());  // 作者
                    book.catagory = BookSourceManager.fixer.fixCatagory(element.find(detail.catagory).text());  // 分类
                    book.cover = util.fixurl(element.find(detail.cover).attr("data-src"), searchLink);  // 封面
                    book.complete = BookSourceManager.fixer.fixComplete(element.find(detail.complete).text());  // 是否完结
                    book.introduce = BookSourceManager.fixer.fixIntroduce(element.find(detail.introduce).text());  // 简介

                    book.sources = {}; // 内容来源
                    var bss = new BookSource(bsid, bs.contentSourceWeight);
                    if(info.bookid){
                        getBookIdFromHtml(element, info.bookid, bss);
                    }
                    bss.detailLink = util.fixurl(element.find(detail.link).attr("href"), searchLink);
                    bss.lastestChapter = BookSourceManager.fixer.fixLastestChapter(element.find(detail.lastestChapter).text());  // 最新的章节
                    // bss.catalogLink = computeCatalogLink(bss);
                    bss.searched = true;
                    book.sources[bsid] = bss;

                    book.mainSourceId = bsid;  // 主要来源
                    return books.push(book);
                });
            if(books.length <= 0){
                if(fail)fail(BookSourceManager.getError(602));
            }
            else{
                if(success)success(books, keyword, bsid);
            }
        };
    };

    // 使用详情页链接刷新书籍信息
    // 前提：book.sources 中有详情链接
    BookSourceManager.prototype.getBookInfo = function(bsid, detailLink, success, fail){
        var self = this;
        var bsm = self.sources[bsid];
        var detail = bsm.detail;
        var info = detail.info;

        util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

        function getBookDetailFromHtml(html){
            html = $(html);
            var book = {};
            // 更新信息的时候不更新书名和作者，因为换源的时候需要用到
            book.catagory = BookSourceManager.fixer.fixCatagory(html.find(info.catagory).text());  // 分类
            book.cover = util.fixurl(html.find(info.cover).attr("data-src"), detailLink);  // 封面
            book.complete = BookSourceManager.fixer.fixComplete(html.find(info.complete).text());  // 是否完结
            book.introduce = BookSourceManager.fixer.fixIntroduce(html.find(info.introduce).text());  // 简介

            if(success)success(book);
        };
    };

    // 获取书籍目录
    BookSourceManager.prototype.getBookCatalog = function(bsid, catalogLink, success, fail){
        var self = this;
        var bsm = self.sources[bsid];
        if(!bsm)return;
        var info = bsm.catalog.info;
        var type = bsm.catalog.type.toLowerCase();
        var catalog = [];

        switch(type){
            case 'html':
                util.getDOM(catalogLink, {}, getChaptersFromHTML, fail);
                break;
            case 'json':
                util.get(catalogLink, {}, getChaptersFromJSON, fail);
                break;
            default:
                util.getDOM(catalogLink, {}, getChaptersFromHTML, fail);
                break;
        }

        function finish(){
            catalog = catalog.filter(function(e){return e});
            if(catalog.length <= 0){
                if(fail)fail(BookSourceManager.getError(601));
            }
            else{
                if(success)success(catalog);
            }
        };

        function getChaptersFromJSON(data){
            try{
                var json = JSON.parse(data);
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
                finish();
            }
            catch(e){
                util.error(e);
                finish();
            }
        }

        function getChaptersFromHTML(html){
            html = $(html);
            var chapters = html.find(info.link);
            chapters.each(function(){
                var element = $(this);
                var chapter = new Chapter();
                chapter.link = util.fixurl(element.attr('href'), catalogLink);
                if(info.vipLinkPattern && chapter.link.match(info.vipLinkPattern)){
                   chapter.link = null;
                }

                chapter.title = BookSourceManager.fixer.fixChapterTitle(element.text());
                // 去重复
                // var i = util.arrayIndex(catalog, null, function(e){
                //     return e && e.title == chapter.title;
                // });
                // if(i >= 0){
                //     catalog[i] = null;
                // }
                catalog.push(chapter);
            });
            finish();
        }

    };

    // 从网络上获取章节内容
    BookSourceManager.prototype.getChapter = function(bsid, chapterLink, success, fail){
        if(!chapterLink){
            if(fail)fail(BookSourceManager.getError(206));
            return;
        }

        util.log('Load Chpater content from Book Source: ' + chapterLink);

        var self = this;
        var bsm = self.sources[bsid];
        var info = bsm.chapter.info;
        util.getDOM(chapterLink, {}, getChapterFromHtml, fail);

        function getChapterFromHtml(html){
            html = $(html);
            var chapter = new Chapter();
            chapter.content = BookSourceManager.fixer.fixChapterContent(html.find(info.content).html());
            if(!chapter.content){
                // 没有章节内容就返回错误
                if(fail)fail(BookSourceManager.getError(206));
                return;
            }
            chapter.link = chapterLink;
            chapter.title = BookSourceManager.fixer.fixChapterTitle(html.find(info.title).text());
            // chapter.modifyTime = html.find(info.modifyTime).text().trim();
            if(success)success(chapter);
        }
    };

    // 获取最新章节
    BookSourceManager.prototype.getLastestChapter = function(bsid, detailLink, success, fail){
        var self = this;
        var bsm = this.sources[bsid];
        var detail = bsm.detail;
        var info = detail.info;

        util.getDOM(detailLink, {}, getBookDetailFromHtml, fail);

        function getBookDetailFromHtml(html){
            html = $(html);
            var lastestChapter = BookSourceManager.fixer.fixLastestChapter(html.find(info.lastestChapter).text());  // 最新的章节
            if(success)success(lastestChapter);
        };
    }

    // 按主源权重从小到大排序的数组
    BookSourceManager.prototype.getSourcesKeysByMainSourceWeight = function(){
        return util.objectSortedKey(this.sources, 'mainSourceWeight'); // 按主源权重从小到大排序的数组
    }

    // 按内容源权重从小到大排序的数组
    BookSourceManager.prototype.getSourcesKeysByContentSourceWeight = function(configFileOrConfig){

    }

    BookSourceManager.prototype.init = function(){
        for(var key in this){
            var value = this[key];
            if($.type(value) == 'object' && 'init' in value){
                value.init();
            }
        }
    };

    BookSourceManager.prototype.qidian = {
        csrfToken: "",
        getCSRToken: function(){
            var url = "http://book.qidian.com/ajax/book/category?_csrfToken=&bookId=2750457";
            if(typeof cordovaHTTP != 'undefined'){
                cordovaHTTP.get(url, {}, {},
                    function(response){
                        debugger;
                    },
                    function(e){
                        debugger;
                    });
            }

            // $.getJSON(url, function(json, status, xhr){
            //     if(json.code == 0){
            //         return;
            //     }
            //     var cookies = xhr.getResponseHeader("Cookies");
            //     debugger;
            // });
        },
        init: function(){
            this.getCSRToken();
        }
    };


    // 检查源是否正确
    BookSourceManager.prototype.checkBookSources = function(testFile, log, error, finish){

        var log = log || function(msg){
            console.log(msg);
        }

        var error = error || function(msg, error){
            msg += "(" + error.id + ", " + error.message + ')';
            console.error(msg);
        }

        function check(bsid, testBook, done){
            function getInfo(){
                return self.sources[bsid].name;
            }

            function checkBookInfo(bs, book, done){
                // 测试获取书籍信息
                bs.getBookInfo(self, book,
                    function(book){
                        // self.catagory = book.catagory;  // 分类
                        // self.cover = book.cover;  // 封面
                        // self.complete = book.complete;  // 是否完结

                        for(var ik in testBook){
                            if(ik.match(/^test_/)){
                                var testProperty = ik.substring(5);
                                if(book[testProperty].match(testBook[ik])){
                                    log(getInfo() + " -> 测试属性：" + testProperty + " OK")
                                }
                                else{
                                    error(getInfo() + " -> 测试属性：" + testProperty + " Wrong!")
                                }
                            }
                        }
                        if(done)done();
                    },
                    function(e){
                        error(getInfo() + " -> 获取书籍信息失败：", e);
                        if(done)done();
                    });
            }

            function checkCatalog(bs, book, done){
                bs.getCatalog(self, book, true,
                    function(catalog){
                        if(catalog.length > 0 && catalog[0].title){
                            log(getInfo() + " -> 测试目录 OK");

                            // 测试获取章节
                            bs.getChapter(self, catalog[0], false,
                                function(chapter){
                                    if(chapter.title == catalog[0].title && chapter.content.length > 0)
                                    {
                                        log(getInfo() + " -> 测试章节 OK");
                                    }
                                    else{
                                        error(getInfo() + " -> 测试章节 Wrong!");
                                    }
                                    if(done)done();
                                },
                                function(e){
                                    error(getInfo() + " -> 测试章节错误：", e);
                                    if(done)done();
                                });
                        }
                        else{
                            error(getInfo() + " -> 测试目录 Wrong!");
                            if(done)done();
                        }
                    },
                    function(e){
                        error(getInfo() + " -> 测试目录 Wrong!", e);
                        if(done)done();
                    });
            }


            log(getInfo() + " -> 测试书籍：" + testBook.name + " by " + testBook.author);
            self.getBook(bsid, testBook.name, testBook.author,
                function(book){
                    log(getInfo() + " -> 测试项目：获取书籍 OK");
                    var bs = book.sources[bsid];

                    // 测试获取书籍信息
                    checkBookInfo(bs, book, function(){
                        // 测试获取目录
                        checkCatalog(bs, book, done);
                    });
                },
                function(e){
                    error(getInfo() + " -> 获取书籍失败：", e);
                    if(done)done();
                });
        }

        var self = this;
        $.getJSON(testFile, function(data){
            var taskQueue = [];
            for(var sk in data.sources){
                var bs = data.sources[sk];
                $(bs).each(function(){
                    if(!(this in data.books)){
                        error("没有在测试配置文件中找到书籍：" + this);
                        return;
                    }
                    taskQueue.push([sk, data.books[this]]);
                });
            }
            // start to work
            next();
            function next(){
                var d = taskQueue.shift();
                if(!d){
                    if(finish)finish();
                    return;
                }
                log("测试书源：" + self.sources[d[0]].name);
                check(d[0], d[1],
                    function(){
                        next();
                    });
            }
        });
    };

    return BookSourceManager;
});

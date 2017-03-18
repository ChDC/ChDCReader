define(["jquery", 'co', "util", "Book", "BookSource", "Chapter"], function($, co, util, Book, BookSource, Chapter) {
    "use strict"

    // **** BookSourceManager *****
    class BookSourceManager{

        constructor(configFileOrConfig){

            this.sources = undefined;
            this.settings = undefined;

            this.settings = {};
            this.settings.refreshCatalogInterval = 600; // 单位秒
            this.settings.refreshLastestChapterInterval = 600; // 单位秒

            if(typeof configFileOrConfig == 'string'){
                util.getJSON(configFileOrConfig)
                    .then(data => this.sources = data);
            }
            else{
                this.sources = configFileOrConfig;
            }
        }


        // 通过书名字和目录搜索唯一的书籍
        getBook(bsid, bookName, bookAuthor){
            if(bsid && bookName && bookAuthor && bsid in this.sources){
                // 通过当前书名和作者名搜索添加源
                return this.searchBook(bsid, bookName)
                    .then(books => {
                        let book = books.find(e => e.name == bookName && e.author == bookAuthor );
                        if(book){
                            // 找到书籍了
                            return book;
                        }
                        else{
                            return Promise.reject(404);
                        }
                    })
                    .catch(error => {
                        return Promise.reject(error == 602 ? 404 : error);
                    });
            }
            else{
                return Promise.reject(401);
            }
        }

        // 搜索书籍
        searchBook(bsid, keyword){
            let bs = this.sources[bsid];
            if(!bs)
                return;
            util.log('Search Book from: ' + bsid);

            let search = bs.search;
            let searchLink = util.format(search.url, {keyword: keyword});
            return util.getDOM(searchLink)
                .then(getBookFromHtml);

            function getBookIdFromHtml(bookElement, bookid, bss){
                let bidElement = bookElement.find(bookid.element);
                if(bookid.attribute){
                    let bid = bidElement.attr(bookid.attribute);
                    if(bid){
                        bss.bookid = bid;
                    }
                }
            }

            function getBookFromHtml(html){
                html = $(html);
                let info = search.info;
                let detail = info.detail;
                let books = [];
                let bookItems = html.find(info.book);
                for(let element of Array.from(bookItems)){
                    element = $(element);
                    let book = new Book();
                    book.name = BookSourceManager.fixer.fixName(element.find(detail.name).text());  // 书名
                    book.author = BookSourceManager.fixer.fixAuthor(element.find(detail.author).text());  // 作者
                    book.catagory = BookSourceManager.fixer.fixCatagory(element.find(detail.catagory).text());  // 分类
                    book.cover = util.fixurl(element.find(detail.cover).attr("data-src"), searchLink);  // 封面
                    book.complete = BookSourceManager.fixer.fixComplete(element.find(detail.complete).text());  // 是否完结
                    book.introduce = BookSourceManager.fixer.fixIntroduce(element.find(detail.introduce).text());  // 简介

                    book.sources = {}; // 内容来源
                    let bss = new BookSource(bsid, bs.contentSourceWeight);
                    if(info.bookid){
                        getBookIdFromHtml(element, info.bookid, bss);
                    }
                    bss.detailLink = util.fixurl(element.find(detail.link).attr("href"), searchLink);
                    bss.lastestChapter = BookSourceManager.fixer.fixLastestChapter(element.find(detail.lastestChapter).text());  // 最新的章节
                    // bss.catalogLink = computeCatalogLink(bss);
                    bss.searched = true;
                    book.sources[bsid] = bss;

                    book.mainSourceId = bsid;  // 主要来源
                    books.push(book);
                }
                if(books.length <= 0){
                    return Promise.reject(602);
                }
                else{
                    return Promise.resolve(books);
                }
            };
        }

        // 使用详情页链接刷新书籍信息
        // 前提：book.sources 中有详情链接
        getBookInfo(bsid, detailLink){
            let bsm = this.sources[bsid];
            let detail = bsm.detail;
            let info = detail.info;

            return util.getDOM(detailLink)
                .then(html => {
                    html = $(html);
                    let book = {};
                    // 更新信息的时候不更新书名和作者，因为换源的时候需要用到
                    book.catagory = BookSourceManager.fixer.fixCatagory(html.find(info.catagory).text());  // 分类
                    book.cover = util.fixurl(html.find(info.cover).attr("data-src"), detailLink);  // 封面
                    book.complete = BookSourceManager.fixer.fixComplete(html.find(info.complete).text());  // 是否完结
                    book.introduce = BookSourceManager.fixer.fixIntroduce(html.find(info.introduce).text());  // 简介

                    return book;
                });
        }

        // 获取书籍目录
        getBookCatalog(bsid, catalogLink){
            let bsm = this.sources[bsid];
            if(!bsm)
                return;
            let info = bsm.catalog.info;
            let type = bsm.catalog.type.toLowerCase();

            let rp = null;
            switch(type){
                case 'html':
                    rp = util.getDOM(catalogLink)
                        .then(getChaptersFromHTML);
                    break;
                case 'json':
                    rp =  util.get(catalogLink)
                        .then(getChaptersFromJSON);
                    break;
                default:
                    rp =  util.getDOM(catalogLink)
                        .then(getChaptersFromHTML);
                    break;
            }

            return rp.then(catalog => {
                catalog = catalog.filter(e => e);
                if(catalog.length <= 0){
                    return Promise.reject(601);
                }
                else{
                    return catalog;
                }
            });

            function getChaptersFromJSON(data){
                let catalog = [];
                try{
                    let json = JSON.parse(data);
                    let chapters = util.getDataFromObject(json, info.chapter);
                    for(let c of chapters){
                        let chapter = new Chapter();
                        let name = util.getDataFromObject(c, info.name);
                        let linkid = util.getDataFromObject(c, info.linkid);
                        chapter.title = name;
                        let vip = util.getDataFromObject(c, info.vip);
                        let locals = {
                                name: name,
                                linkid: linkid,
                                vip: vip
                            };

                        let vipLinkPattern = util.format(info.vipLinkPattern, locals);
                        if(eval(vipLinkPattern)){
                            chapter.link = null;
                        }
                        else{
                            chapter.link = util.format(info.link, locals);
                        }
                        catalog.push(chapter);
                    }
                }
                catch(e){
                    util.error(e);
                }
                finally{
                    return catalog;
                }
            }

            function getChaptersFromHTML(html){
                let catalog = [];
                html = $(html);
                let chapters = html.find(info.link);
                for(let element of Array.from(chapters)){
                    element = $(element);
                    let chapter = new Chapter();
                    chapter.link = util.fixurl(element.attr('href'), catalogLink);
                    if(info.vipLinkPattern && chapter.link.match(info.vipLinkPattern)){
                       chapter.link = null;
                    }

                    chapter.title = BookSourceManager.fixer.fixChapterTitle(element.text());
                    // 去重复
                    // let i = util.arrayIndex(catalog, null, function(e){
                    //     return e && e.title == chapter.title;
                    // });
                    // if(i >= 0){
                    //     catalog[i] = null;
                    // }
                    catalog.push(chapter);
                }
                return catalog;
            }

        }

        // 从网络上获取章节内容
        getChapter(bsid, chapterLink){
            if(!chapterLink){
                return Promise.reject(206);
            }

            util.log('Load Chpater content from Book Source: ' + chapterLink);

            let bsm = this.sources[bsid];
            let info = bsm.chapter.info;
            return util.getDOM(chapterLink)
                .then(getChapterFromHtml);

            function getChapterFromHtml(html){
                html = $(html);
                let chapter = new Chapter();
                chapter.content = BookSourceManager.fixer.fixChapterContent(html.find(info.content).html());
                if(!chapter.content){
                    // 没有章节内容就返回错误
                    return Promise.reject(206);
                }
                chapter.link = chapterLink;
                chapter.title = BookSourceManager.fixer.fixChapterTitle(html.find(info.title).text());
                // chapter.modifyTime = html.find(info.modifyTime).text().trim();
                return chapter;
            }
        }

        // 获取最新章节
        getLastestChapter(bsid, detailLink){
            let bsm = this.sources[bsid];
            let detail = bsm.detail;
            let info = detail.info;

            return util.getDOM(detailLink)
                .then(getBookDetailFromHtml);

            function getBookDetailFromHtml(html){
                html = $(html);
                let lastestChapter = BookSourceManager.fixer.fixLastestChapter(html.find(info.lastestChapter).text());  // 最新的章节
                return lastestChapter;
            };
        }

        // 按主源权重从小到大排序的数组
        getSourcesKeysByMainSourceWeight(){
            return util.objectSortedKey(this.sources, 'mainSourceWeight'); // 按主源权重从小到大排序的数组
        }

        // 按内容源权重从小到大排序的数组
        getSourcesKeysByContentSourceWeight(configFileOrConfig){
            // TODO:
        }

        init(){
            for(let key in this){
                let value = this[key];
                if(typeof value == 'object' && 'init' in value){
                    value.init();
                }
            }
        }

        // 检查源是否正确
        checkBookSources(testFile, log=msg=>console.log(msg), error){

            if(!error){
                throw new Error("The argument 'error' is not defined!");
            }

            function check(bsid, testBook){

                function getInfo(){
                    return self.sources[bsid].name;
                }

                function* checkBookInfo(bs, book){
                    // 测试获取书籍信息
                    book = yield bs.getBookInfo(self, book)
                        .catch(e => {
                            error(getInfo() + " -> 获取书籍信息失败：", e);
                            throw e;
                        });

                    for(let ik in testBook){
                        if(ik.match(/^test_/)){
                            let testProperty = ik.substring(5);
                            if(book[testProperty].match(testBook[ik])){
                                log(getInfo() + " -> 测试属性：" + testProperty + " OK")
                            }
                            else{
                                error(getInfo() + " -> 测试属性：" + testProperty + " Wrong!")
                            }
                        }
                    }
                }

                function* checkCatalog(bs, book){
                    let catalog = yield bs.getCatalog(self, book, true)
                        .catch(e => {
                            error(getInfo() + " -> 测试目录 Wrong!");
                            throw e;
                        });

                    if(catalog.length <= 0 || !catalog[0].title){
                        error(getInfo() + " -> 测试目录 Wrong!");
                        return;
                    }

                    log(getInfo() + " -> 测试目录 OK");

                    // 测试获取章节
                    let chapter = yield bs.getChapter(self, book, catalog[0], false)
                        .catch(e => {
                            error(getInfo() + " -> 测试章节错误：", e);
                            throw e;
                        });

                    if(chapter.title == catalog[0].title && chapter.content.length > 0)
                    {
                        log(getInfo() + " -> 测试章节 OK");
                    }
                    else{
                        error(getInfo() + " -> 测试章节 Wrong!");
                    }
                }

                return co(function*(){
                    log(getInfo() + " -> 测试书籍：" + testBook.name + " by " + testBook.author);
                    let book = yield self.getBook(bsid, testBook.name, testBook.author)
                        .catch(e => {error(getInfo() + " -> 获取书籍失败：", e); throw e;});

                    log(getInfo() + " -> 测试项目：获取书籍 OK");
                    let bs = book.sources[bsid];

                    // 测试获取书籍信息
                    yield checkBookInfo(bs, book);
                    // 测试获取目录
                    yield checkCatalog(bs, book);
                });

            }

            let self = this;
            return co(function*(){
                let data = yield util.getJSON(testFile);
                let taskQueue = [];
                for(let sk in data.sources){
                    let books = data.sources[sk];
                    for(let book of books){
                        if(!(book in data.books)){
                            error("没有在测试配置文件中找到书籍：" + book);
                        }
                        else
                            taskQueue.push([sk, data.books[book]]);
                    }
                }
                // start to work

                while(taskQueue.length > 0){
                    let [bsid, book] = taskQueue.shift();
                    log("测试书源：" + self.sources[bsid].name);
                    try{
                        yield check(bsid, book);
                    }
                    catch(e)
                    {

                    }
                }
            }());

        }
    }

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
            return !!text.match(/完成|完结|完本/);
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


    BookSourceManager.prototype.qidian = {
        csrfToken: "",
        getCSRToken(){
            let url = "http://book.qidian.com/ajax/book/category?_csrfToken=&bookId=2750457";
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
            //     let cookies = xhr.getResponseHeader("Cookies");
            //     debugger;
            // });
        },
        init(){
            this.getCSRToken();
        }
    };

    return BookSourceManager;
});

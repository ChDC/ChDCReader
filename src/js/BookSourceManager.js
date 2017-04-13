define(['co', "util", "Book", "BookSource", "Chapter"], function(co, util, Book, BookSource, Chapter) {
    "use strict"

    // **** BookSourceManager *****
    class BookSourceManager{

        constructor(configFileOrConfig){

            this.sources = undefined;

            if(typeof configFileOrConfig == 'string'){
                util.getJSON(configFileOrConfig)
                    .then(data => this.sources = data);
            }
            else{
                this.sources = configFileOrConfig;
            }

            this.init();
        }


        // 通过书名字和目录搜索唯一的书籍
        getBook(bsid, bookName, bookAuthor){
            util.log(`BookSourceManager: Get book "${bookName}" from ${bsid}`);

            if(!bsid || !bookName || !bookAuthor || !(bsid in this.sources))
                return Promise.reject(401);

            // 通过当前书名和作者名搜索添加源
            return this.searchBook(bsid, bookName)
                .then(books => {
                    const book = books.find(e => e.name == bookName && e.author == bookAuthor );
                    return book ? book : Promise.reject(404);
                })
                .catch(error => {
                    return Promise.reject(error == 602 ? 404 : error);
                });
        }

        // 搜索书籍
        searchBook(bsid, keyword){

            util.log(`BookSourceManager: Search Book "${keyword}" from ${bsid}`);

            const self = this;
            const bs = this.sources[bsid];
            if(!bs) return;

            const search = bs.search;
            const searchLink = util.format(search.url, {keyword: keyword});
            return util.getDOM(searchLink)
                .then(getBookFromHtml);

            function getBookIdFromHtml(bookElement, bookid, bss){

                const bidElement = bookElement.querySelector(bookid.element);
                if(bookid.attribute){
                    const bid = bidElement.getAttribute(bookid.attribute);
                    if(bid){
                        bss.bookid = bid;
                    }
                }
            }

            function getBookFromHtml(htmlContent){

                let html = document.createElement("div");
                html.innerHTML = htmlContent;

                const info = search.info;
                const detail = info.detail;
                const books = [];
                const fixer = BookSourceManager.fixer;

                // const bookItems = html.find(info.book);
                const bookItems = html.querySelectorAll(info.book);
                for(let element of Array.from(bookItems)){
                    const book = new Book(self);

                    book.name = fixer.fixName(element.querySelector(detail.name).textContent);  // 书名
                    book.author = fixer.fixAuthor(element.querySelector(detail.author).textContent);  // 作者
                    book.catagory = fixer.fixCatagory(util.elementFind(element, detail.catagory).textContent);  // 分类
                    book.cover = util.fixurl(util.elementFind(element, detail.cover).getAttribute("data-src"), searchLink);  // 封面
                    book.complete = fixer.fixComplete(util.elementFind(element, detail.complete).textContent);  // 是否完结
                    book.introduce = fixer.fixIntroduce(util.elementFind(element, detail.introduce).textContent);  // 简介

                    book.sources = {}; // 内容来源
                    const bss = new BookSource(book, self, bsid, bs.contentSourceWeight);
                    if(info.bookid){
                        getBookIdFromHtml(element, info.bookid, bss);
                    }
                    bss.detailLink = util.fixurl(util.elementFind(element, detail.link).getAttribute("href"), searchLink);
                    bss.lastestChapter = fixer.fixLastestChapter(util.elementFind(element, detail.lastestChapter).textContent);  // 最新的章节
                    // bss.catalogLink = computeCatalogLink(bss);

                    bss.searched = true;
                    book.sources[bsid] = bss;

                    book.mainSourceId = bsid;  // 主要来源
                    books.push(book);
                }

                return books.length <= 0 ? Promise.reject(602) : Promise.resolve(books);
            };
        }

        // 使用详情页链接刷新书籍信息
        getBookInfo(bsid, detailLink){

            util.log(`BookSourceManager: Get Book Info from ${bsid} with link "${detailLink}"`);

            const bsm = this.sources[bsid];
            const detail = bsm.detail;
            const info = detail.info;
            const fixer = BookSourceManager.fixer;

            return util.getDOM(detailLink)
                .then(htmlContent => {
                    let html = document.createElement("div");
                    html.innerHTML = htmlContent;

                    const book = {};
                    // 更新信息的时候不更新书名和作者，因为换源的时候需要用到
                    book.catagory = fixer.fixCatagory(util.elementFind(html, info.catagory).textContent);  // 分类
                    book.cover = util.fixurl(util.elementFind(html, info.cover).getAttribute("data-src"), detailLink);  // 封面
                    book.complete = fixer.fixComplete(util.elementFind(html, info.complete).textContent);  // 是否完结
                    book.introduce = fixer.fixIntroduce(util.elementFind(html, info.introduce).textContent);  // 简介

                    return book;
                });
        }



        // 获取目录链接
        // {detailLink, bookid, catalogLink}
        getBookCatalogLink(bsid, options={}){

            util.log(`BookSourceManager: Get BookCatalogLink from ${bsid} with options "${options}"`);

            const self = this;
            const bsm = this.sources[bsid];
            if(!bsm) return Promise.reject();

            return co(function*(){
                if(bsm.detail.info.catalogLink){
                    // 从详细页获取目录链接
                    // const detailLink = yield this.__getBookSourceDetailLink();

                    let html = yield util.getDOM(options.detailLink);

                    let container = document.createElement('div');
                    container.innerHTML = html;
                    // html = $(html);
                    // const link = container.find(bsm.detail.info.catalogLink).attr('href');
                    const link = util.elementFind(container, bsm.detail.info.catalogLink).getAttribute("href");
                    return Promise.resolve(link);
                }
                else{
                    const catalogLink = bsm.catalog.link;
                    const o = Object.assign({}, options, this[bsid]);
                    const link = util.format(catalogLink, o);
                    return Promise.resolve(link);
                }
            });
        }

        // 获取书籍目录
        getBookCatalog(bsid, catalogLink){

            util.log(`BookSourceManager: Refresh Catalog from ${bsid} with link "${catalogLink}"`);

            const bsm = this.sources[bsid];
            if(!bsm) return;

            const info = bsm.catalog.info;
            const type = bsm.catalog.type.toLowerCase();

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
                const catalog = [];
                try{
                    const json = JSON.parse(data);
                    const chapters = util.getDataFromObject(json, info.chapter);
                    for(const c of chapters){
                        const chapter = new Chapter();
                        const name = util.getDataFromObject(c, info.name);
                        const linkid = util.getDataFromObject(c, info.linkid);
                        chapter.title = name;
                        const vip = util.getDataFromObject(c, info.vip);
                        const locals = {
                                name: name,
                                linkid: linkid,
                                vip: vip
                            };

                        const vipLinkPattern = util.format(info.vipLinkPattern, locals);
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

            function getChaptersFromHTML(htmlContent){
                const catalog = [];

                let html = document.createElement("div");
                html.innerHTML = htmlContent;

                // html = $(html);
                const chapters = html.querySelectorAll(info.link);
                for(let element of Array.from(chapters)){
                    // element = $(element);
                    const chapter = new Chapter();
                    chapter.link = util.fixurl(element.getAttribute("href"), catalogLink);
                    if(info.vipLinkPattern && chapter.link.match(info.vipLinkPattern)){
                       chapter.link = null;
                    }

                    chapter.title = BookSourceManager.fixer.fixChapterTitle(element.textContent);
                    // 去重复
                    // const i = util.arrayIndex(catalog, null, function(e){
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

            util.log(`BookSourceManager: Load Chpater content from ${bsid} with link "${chapterLink}"`);

            if(!chapterLink) return Promise.reject(206);

            const bsm = this.sources[bsid];
            const info = bsm.chapter.info;
            return util.getDOM(chapterLink)
                .then(getChapterFromHtml);

            function getChapterFromHtml(htmlContent){
                let html = document.createElement("div");
                html.innerHTML = htmlContent;

                const chapter = new Chapter();
                chapter.content = BookSourceManager.fixer.fixChapterContent(html.querySelector(info.content).innerHTML);
                if(!chapter.content){
                    // 没有章节内容就返回错误
                    return Promise.reject(206);
                }
                chapter.link = chapterLink;
                chapter.title = BookSourceManager.fixer.fixChapterTitle(html.querySelector(info.title).textContent);

                return chapter;
            }
        }

        // 获取最新章节
        getLastestChapter(bsid, detailLink){

            util.log(`BookSourceManager: Get Lastest Chapter from ${bsid} with link "${detailLink}"`);

            const bsm = this.sources[bsid];
            const detail = bsm.detail;
            const info = detail.info;

            return util.getDOM(detailLink)
                .then(getBookDetailFromHtml);

            function getBookDetailFromHtml(htmlContent){

                let html = document.createElement("div");
                html.innerHTML = htmlContent;

                const lastestChapter = BookSourceManager.fixer.fixLastestChapter(html.querySelector(info.lastestChapter).textContent);  // 最新的章节
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
            for(const key in this){
                const value = this[key];
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

                    for(const ik in testBook){
                        if(ik.match(/^test_/)){
                            const testProperty = ik.substring(5);
                            if(book[testProperty].match(testBook[ik])){
                                log(getInfo() + " -> 测试属性：" + testProperty + " OK")
                            }
                            else{
                                error(getInfo() + " -> 测试属性：" + testProperty + " Wrong!")
                            }
                        }
                    }
                }

                function* checkLastestChapter(bs, book){
                    // 测试获取书籍信息
                    let [lastestChapter, lastestChapterUpdated] = yield bs.refreshLastestChapter(self, book)
                        .catch(e => {
                            error(getInfo() + " -> 获取最新章节信息失败：", e);
                            throw e;
                        });
                    if(lastestChapter.length > 0){
                        log(getInfo() + " -> 获取最新章节信息：OK")
                    }
                    else{
                        error(getInfo() + " -> 获取最新章节信息：Wrong!")
                    }
                }

                function* checkCatalog(bs, book){
                    const catalog = yield bs.getCatalog(self, book, true)
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
                    const chapter = yield bs.getChapter(catalog[0], false)
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
                    const book = yield self.getBook(bsid, testBook.name, testBook.author)
                        .catch(e => {error(getInfo() + " -> 获取书籍失败：", e); throw e;});

                    log(getInfo() + " -> 测试项目：获取书籍 OK");
                    const bs = book.sources[bsid];

                    // 测试获取书籍信息
                    yield checkBookInfo(bs, book);
                    // 测试最新章节信息
                    yield checkLastestChapter(bs, book);
                    // 测试获取目录
                    yield checkCatalog(bs, book);
                });

            }

            const self = this;
            return co(function*(){
                const data = yield util.getJSON(testFile);
                const taskQueue = [];
                for(const sk in data.sources){
                    const books = data.sources[sk];
                    for(const book of books){
                        if(!(book in data.books)){
                            error("没有在测试配置文件中找到书籍：" + book);
                        }
                        else
                            taskQueue.push([sk, data.books[book]]);
                    }
                }
                // start to work

                while(taskQueue.length > 0){
                    const [bsid, book] = taskQueue.shift();
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
            const url = "http://book.qidian.com/ajax/book/category?_csrfToken=&bookId=2750457";
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
            //     const cookies = xhr.getResponseHeader("Cookies");
            //     debugger;
            // });
        },
        init(){
            this.getCSRToken();
        }
    };

    return BookSourceManager;
});

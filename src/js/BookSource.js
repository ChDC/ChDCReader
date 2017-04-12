define(['co', "util", 'Chapter'], function(co, util, Chapter) {
    "use strict"


    // **** BookSource *****
    class BookSource{

        constructor(book, bookSourceManager, id, weight=0){

            this.bookSourceManager = bookSourceManager; // 不持久化
            this.book = book; // 不持久化

            this.id = id; // 书源 ID
            this.disable = false; // 表示当前书源是否可用
            this.weight = weight; // 书源的权重
            this.searched = false; // 本书是否已经被搜索到了

            this.detailLink = null; // 详情页链接
            this.catalogLink = null; // 目录页链接
            this.bookid = null; // 书籍 ID
            this.catalog = null; // 目录

            this.updatedCatalogTime = 0; // 上次更新目录时间
            this.updatedLastestChapterTime = 0; // 上次更新最新章节时间
            this.needSaveCatalog = false; // 目录是否需要存储到本地
            this.lastestChapter = undefined;  // 最新的章节
        }


        // 获取当前书籍的源
        __getBookSource(){

            util.log(`BookSource: Get book source by searching book`);

            if(this.disable)
                return Promise.reject(404);

            return this.bookSourceManager.getBook(this.id, this.book.name, this.book.author)
                .then(book => {
                    // 找到书籍了
                    Object.assign(this, book.sources[this.id]);
                    return this;
                })
                .catch(error => {
                    if(error == 404){
                        // 没找到该书就标记一下，下次直接跳过
                        this.disable = true;
                        this.searched = true;
                    }
                    return Promise.reject(error);
                });
        }


        // 获取当前书籍指定的目录源的相信信息链接
        __getBookSourceDetailLink(){

            if(!this.searched)
                return this.__getBookSource()
                    .then(bs => bs.detailLink);

            if(this.disable)
                return Promise.reject(404);

            return Promise.resolve(this.detailLink);
        }

        // 获取当前书籍指定的目录页的链接
        *__getBookSourceCatalogLink(){
            if(!this.searched)
                yield this.__getBookSource()
            if(this.disable)
                return Promise.reject(404);

            return this.bookSourceManager.getBookCatalogLink(this.id, this);

            // if(!this.catalogLink){

            //     // computeCatalogLink
            //     const bsm = this.bookSourceManager.sources[this.id];
            //     if(!bsm)
            //         return;
            //     if(bsm.detail.info.catalogLink){
            //         // 从详细页获取目录链接
            //         const detailLink = yield this.__getBookSourceDetailLink();

            //         let html = yield util.getDOM(detailLink);

            //         let container = document.createElement('div');
            //         container.innerHTML = html;
            //         // html = $(html);
            //         // const link = container.find(bsm.detail.info.catalogLink).attr('href');
            //         const link = util.elementFind(container, bsm.detail.info.catalogLink).getAttribute("href");
            //         this.catalogLink = link;
            //     }
            //     else{
            //         const catalogLink = bsm.catalog.link;
            //         const o = Object.assign({}, this, this.bookSourceManager[this.id]);
            //         const link = util.format(catalogLink, o);
            //         this.catalogLink = link;
            //     }
            // }
            // return this.catalogLink;
        }

        // 刷新目录
        *__refreshCatalog(){

            if((new Date()).getTime() - this.updatedCatalogTime < BookSource.settings.refreshCatalogInterval * 1000)
                return this.catalog;

            const catalogLink = yield this.__getBookSourceCatalogLink();

            const catalog = yield this.bookSourceManager.getBookCatalog(this.id, catalogLink);
            this.catalog = catalog;
            this.updatedCatalogTime = (new Date()).getTime();
            this.needSaveCatalog = true;
            return catalog;
        }

        // 获取书籍信息
        getBookInfo(){
            return this.__getBookSourceDetailLink()
                .then(detailLink =>
                this.bookSourceManager.getBookInfo(this.id, detailLink));
        }

        // 获取目录
        // options:
        // * forceRefresh 强制刷新
        getCatalog(forceRefresh){
            if(!forceRefresh && this.catalog)
                return Promise.resolve(this.catalog);

            return co(this.__refreshCatalog());
        }

        // 获取书籍最新章节
        refreshLastestChapter(){

            if((new Date()).getTime() - this.updatedLastestChapterTime < BookSource.settings.refreshLastestChapterInterval * 1000)
                return [this.lastestChapter, false];

            util.log('Refresh LastestChapter!');

            return this.__getBookSourceDetailLink()
                .then(detailLink =>
                    this.bookSourceManager.getLastestChapter(this.id, detailLink))
                .then(lastestChapter => {
                    this.updatedLastestChapterTime = (new Date()).getTime();
                    let lastestChapterUpdated = false;
                    if(this.lastestChapter != lastestChapter){
                        this.lastestChapter = lastestChapter;
                        lastestChapterUpdated = true;
                    }
                    return [lastestChapter, lastestChapterUpdated];
                });
        }


        // 从本地或网络上获取章节内容
        // * cacheDir 缓存章节的目录
        // * onlyCacheNoLoad 只缓存章节，不加载章节
        getChapter(chapter, onlyCacheNoLoad){
            // 从缓存中获取章节内容
            return co(this.__getCacheChapter(chapter.title, onlyCacheNoLoad))
                .then(c => onlyCacheNoLoad? chapter: c)
                .catch(error => {
                    if(error != 207)
                        throw error;
                    // 从缓存中获取失败的话，再从网上获取章节，然后缓存到本地
                    return this.bookSourceManager.getChapter(this.id, chapter.link)
                        .then(chapter => // 缓存该章节
                            this.__cacheChapter(chapter));
                });
        }

        // 获取章节的缓存位置
        // * cacheDir 缓存章节的目录
        __getCacheChapterLocation(id){
            return `chapter_${this.book.name}.${this.book.author}_${id}.${this.id}`;
        }

        // 获取指定的章节
        // * cacheDir 缓存章节的目录
        // * onlyCacheNoLoad 只缓存章节，不加载章节
        *__getCacheChapter(title, onlyCacheNoLoad){

            const dest = this.__getCacheChapterLocation(title);

            if(onlyCacheNoLoad){
                const exists = yield util.dataExists(dest, true);
                return exists ? null : Promise.reject(207);
            }

            // 获取章节内容
            try{
                const data = yield util.loadData(dest, true);
                // 章节存在
                if(!data)
                    return Promise.reject(207);

                // 类型转换
                const chapter = Object.assign(new Chapter(), data);
                return chapter;
            }
            catch(e){
                return Promise.reject(207);
            }
        }

        // 缓存章节内容
        // * cacheDir 缓存章节的目录
        __cacheChapter(chapter){

            // 保存到文件中
            const dest = this.__getCacheChapterLocation(chapter.title);
            return util.saveData(dest, chapter, true).then(() => chapter); // 将 JSON 对象序列化到文件中
        }

    }

    BookSource.settings = {
        refreshCatalogInterval: 600, // 单位秒
        refreshLastestChapterInterval: 600 // 单位秒
    };

    // 用于标记持久化的属性
    BookSource.persistentInclude = ["id", "disable", "weight", "searched", "detailLink",
                            "catalogLink", "bookid", // 不持久化目录 "catalog",
                            "updatedCatalogTime", "updatedLastestChapterTime",
                            "needSaveCatalog", "lastestChapter"];

    return BookSource;
});

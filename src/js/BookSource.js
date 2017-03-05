define(["jquery", 'co', "util", 'Chapter'], function($, co, util, Chapter) {
    "use strict"


    // **** BookSource *****
    class BookSource{

        constructor(id, weight=0){
            this.id = id; // 书源 ID
            this.disable = false;
            this.weight = weight;
            this.searched = false; // 本书是否已经被搜索到了

            this.detailLink = null; // 详情页链接
            this.catalogLink = null; // 目录页链接
            this.bookid = null; // 书籍 ID
            this.catalog = null; // 目录
            this.updatedCatalogTime = 0;
            this.updatedLastestChapterTime = 0;
            this.needSaveCatalog = false; // 目录是否需要存储到本地
            this.lastestChapter = undefined;  // 最新的章节
        }


        // 获取当前书籍指定的目录源
        getBookSource(bookSourceManager, book){

            if(this.disable)
                return Promise.reject(404);

            return bookSourceManager.getBook(this.id, book.name, book.author)
                .then(book => {
                    // 找到书籍了
                    $.extend(this, book.sources[this.id]);
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
        __getBookSourceDetailLink(bookSourceManager, book){
            if(!this.searched){
                return this.getBookSource(bookSourceManager, book)
                    .then(bs => bs.detailLink);
            }

            if(this.disable){
                return Promise.reject(404);
            }

            return Promise.resolve(this.detailLink);
        }

        // 获取当前书籍指定的目录页的链接
        *__getBookSourceCatalogLink(bookSourceManager, book){
            if(!this.searched)
                yield this.getBookSource(bookSourceManager, book)
            if(this.disable){
                return Promise.reject(404);
            }
            if(!this.catalogLink){

                // computeCatalogLink
                let bsm = bookSourceManager.sources[this.id];
                if(!bsm)
                    return;
                if(bsm.detail.info.catalogLink){
                    // 从详细页获取目录链接
                    let detailLink = yield this.__getBookSourceDetailLink(bookSourceManager, book);

                    let html = yield util.getDOM(detailLink);
                    html = $(html);
                    let link = html.find(bsm.detail.info.catalogLink).attr('href');
                    this.catalogLink = link;
                }
                else{
                    let catalogLink = bsm.catalog.link;
                    let o = $.extend({}, this, bookSourceManager[this.id]);
                    let link = util.format(catalogLink, o);
                    this.catalogLink = link;
                }
            }
            return this.catalogLink;
        }

        // 刷新目录
        *__refreshCatalog(bookSourceManager, book){

            if((new Date()).getTime() - this.updatedCatalogTime < bookSourceManager.settings.refreshCatalogInterval * 1000){
                return Promise.reject(400);
            }

            util.log('Refresh Catalog!');
            let catalogLink = yield this.__getBookSourceCatalogLink(bookSourceManager, book);
            let catalog = yield bookSourceManager.getBookCatalog(this.id, catalogLink);
            this.catalog = catalog;
            this.updatedCatalogTime = (new Date()).getTime();
            this.needSaveCatalog = true;
            return catalog;
        }

        // 获取书籍信息
        getBookInfo(bookSourceManager, book){
            return this.__getBookSourceDetailLink(bookSourceManager, book)
                .then(detailLink =>
                bookSourceManager.getBookInfo(this.id, detailLink));
        }

        // 获取目录
        // options:
        // * forceRefresh 强制刷新
        getCatalog(bookSourceManager, book, forceRefresh){
            if(!forceRefresh && this.catalog){
                return Promise.resolve(this.catalog);
            }
            return co(this.__refreshCatalog(bookSourceManager, book))
                .catch(error => {
                    if(error == 400){
                        return this.catalog;
                    }
                    else{
                        throw error;
                    }
                });
        }

        // 获取书籍最新章节
        refreshLastestChapter(bookSourceManager, book){

            if((new Date()).getTime() - this.updatedLastestChapterTime < bookSourceManager.settings.refreshLastestChapterInterval * 1000){
                return Promise.reject(402);
            }

            util.log('Refresh LastestChapter!');

            return this.__getBookSourceDetailLink(bookSourceManager, book)
                .then(detailLink =>
                    bookSourceManager.getLastestChapter(this.id, detailLink))
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
        getChapter(bookSourceManager, book, chapter, onlyCacheNoLoad){
            // 从缓存中获取章节内容
            return co(this.__getCacheChapter(book, chapter.title, onlyCacheNoLoad))
                .then(c => onlyCacheNoLoad? chapter: c)
                .catch(error => {
                    if(error != 207)
                        throw error;
                    // 从缓存中获取失败的话，再从网上获取章节，然后缓存到本地
                    return bookSourceManager.getChapter(this.id, chapter.link)
                        .then(chapter => // 缓存该章节
                            this.__cacheChapter(book, chapter));
                });
        }

        // 获取章节的缓存位置
        // * cacheDir 缓存章节的目录
        __getCacheChapterLocation(book, id){
            return `chapter_${book.name}.${book.author}_${id}.${this.id}`;
        }

        // 获取指定的章节
        // * cacheDir 缓存章节的目录
        // * onlyCacheNoLoad 只缓存章节，不加载章节
        *__getCacheChapter(book, title, onlyCacheNoLoad){

            let dest = this.__getCacheChapterLocation(book, title);

            if(onlyCacheNoLoad){
                let exists = yield util.dataExists(dest, true);
                return exists ? null : Promise.reject(207);
            }

            // 获取章节内容
            try{
                let data = yield util.loadData(dest, true);
                // 章节存在
                if(!data)
                    return Promise.reject(207);

                let chapter = new Chapter();
                // 类型转换
                chapter = $.extend(true, chapter, data);
                return chapter;
            }
            catch(e){
                return Promise.reject(207);
            }
        }

        // 缓存章节内容
        // * cacheDir 缓存章节的目录
        __cacheChapter(book, chapter){

            // 保存到文件中
            let dest = this.__getCacheChapterLocation(book, chapter.title);
            return util.saveData(dest, chapter, true).then(() => chapter); // 将 JSON 对象序列化到文件中
        }

    }

    return BookSource;
});

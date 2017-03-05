define(["jquery", "co", "util", "Chapter", "BookSource"], function($, co, util, Chapter, BookSource) {
    "use strict"

    // ****** Book ****
    class Book{

        constructor(){
            // this.id = "";  // 编号
            this.name = "";  // 书名
            this.author = "";  // 作者
            this.catagory = "";  // 分类
            this.cover = "";  // 封面
            this.complete = undefined;  // 是否完结
            this.introduce = "";  // 简介
            this.sources = undefined;  // 内容来源
            this.mainSourceId = undefined;  // 当前来源
        }

        // 获取当前书籍指定的目录源信息
        getBookSource({bookSourceManager, bookSourceId=this.mainSourceId}){
            return new Promise((resolve, reject) => {
                let bs = this.sources[bookSourceId];
                if(bs){
                    resolve(bs);
                }
                else{
                    let bsm = bookSourceManager.sources[bookSourceId];
                    if(bsm)
                    {
                        let bss = new BookSource(bookSourceId, bsm.contentSourceWeight);
                        this.sources[bookSourceId] = bss;
                        resolve(bss);
                    }
                    else{
                        reject(302);
                    }
                }
            });
        }

        // 检查源是否有缺失
        checkBookSources(bookSourceManager){
            let sources = bookSourceManager.sources;
            for(let k in sources){
                if(!(k in this.sources)){
                    this.sources[k] = new BookSource(k, sources[k].contentSourceWeight);
                }
            }
        }

        // 设置主源
        setMainSourceId(bookSourceId, {bookSourceManager}){

            return new Promise((resolve, reject) => {
                if(this.mainSourceId == bookSourceId)
                    return;

                if(bookSourceId && bookSourceId in bookSourceManager.sources){
                    this.mainSourceId = bookSourceId;
                    resolve(this);
                }
                else{
                    reject(301);
                }
            })
        }

        // 获取目录
        // options:
        // * forceRefresh 强制刷新
        getCatalog(options){
            options = Object.assign({}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;

            return this.getBookSource(options)
                .then(bs => bs.getCatalog(options.bookSourceManager, this, options.forceRefresh));
        }

        // 使用详情页链接刷新书籍信息
        // 前提：book.sources 中有详情链接
        refreshBookInfo(options){
            options = Object.assign({}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;

            return this.getBookSource(options)
                .then(bs => bs.getBookInfo(options.bookSourceManager, this))
                .then(book => {
                        this.catagory = book.catagory;  // 分类
                        this.cover = book.cover;  // 封面
                        this.complete = book.complete;  // 是否完结
                        this.introduce = book.introduce;  // 简介
                    });
        }

        // *************************** 章节部分 ****************

        // 获取指定源的指定索引的章节
        index(chapterIndex, options){
            if($.type(chapterIndex) != "number"){
                return Promise.reject(205);
            }

            if(chapterIndex < 0){
                return Promise.reject(203);
            }

            options = Object.assign({}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;

            let self = this;
            return co(function*(){

                for(let i = 0; i < 2; i++){
                    let catalog = yield self.getCatalog(options);

                    if(!catalog || catalog.length <= 0){
                        return Promise.reject(501);
                    }

                    if(chapterIndex >= 0 && chapterIndex < catalog.length){
                        // 存在于目录中
                        return Promise.resolve({chapter: catalog[chapterIndex], index: chapterIndex, catalog});
                    }
                    else if(chapterIndex >= catalog.length)
                    {
                        // 超界了
                        // 没有下一章节或者目录没有更新
                        // 更新一下主目录源，然后再搜索
                        options.forceRefresh = true;
                    }
                    else{
                        // index < 0
                        return Promise.reject(203);
                    }
                }
                return Promise.reject(202);

            });

        }

        // 在指定的源 B 中搜索目录源的中某章节的相对应的章节
        // TODO: 参数修复
        fuzzySearch(sourceB, index, options){

            options = $.extend(true, {}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;


            if(options.bookSourceId == sourceB){
            // 两源相同
                return this.index(index, options);
            }

            let self = this;
            return co(function*(){
                // 获取目录源的目录
                let catalog = yield self.getCatalog(options);

                if(!catalog || catalog.length <= 0){
                    return Promise.reject(501);
                }
                // 获取源B 的目录
                options.bookSourceId = sourceB;
                for(let i = 0; i < 2; i++){

                    let catalogB = yield self.getCatalog(options);

                    if(!catalogB || catalogB.length <= 0){
                        return Promise.reject(501);
                    }

                    let matchs = [
                        [util.listMatch.bind(util), Chapter.equalTitle.bind(Chapter)],
                        [util.listMatchWithNeighbour.bind(util), Chapter.equalTitle.bind(Chapter)],
                        [util.listMatchWithNeighbour.bind(util), Chapter.equalTitleWithoutNum.bind(Chapter)],
                    ];

                    for(let match of matchs){
                        let [matchFunc, compareFunc] = match;
                        let indexB = matchFunc(catalog, catalogB, index, compareFunc);
                        if(indexB >= 0){
                            // 找到了
                            let chapterB = catalogB[indexB];
                            return Promise.resolve({chapter: chapterB, index: indexB, catalog: catalogB});
                        }
                        else{
                            continue;
                        }
                    }

                    // 一个也没找到
                    // 更新章节目录然后重新查找
                    options.forceRefresh = true;
                }
                return Promise.reject(201);
            });
        }

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
        getChapter(chapterIndex, options){

            if(chapterIndex < 0){
                return Promise.reject(203);;
            }

            options = $.extend(true, {}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;

            return this.index(chapterIndex, options)
                .then(({chapter, index, catalog}) =>
                    co(this.__getChapterFromContentSources(catalog, chapterIndex, options)));
        }

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
        *__getChapterFromContentSources(catalog, index, options){
            options = $.extend(true, {}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;

            let chapterA = catalog[index];
            let result = []; // 结果的集合，按权重排序
            let count = options.count || 1; // 想获取的数目

            // ***** 常量 ******
            const FOUND_WEIGHT = 0; // 找到后增加的权重
            const NOTFOUND_WEIGHT = -2; // 没找到的权重
            const EXECLUDE_WEIGHT = -4; // 排除的权重
            const INCLUDE_WEIGHT = 0; // 指定的源
            // *****************

            let self = this;

            // 如果指定的源是要排除的源，则清除之
            if(options.excludes && options.excludes.indexOf(options.contentSourceId) >= 0)
                options.contentSourceId = null;

            // 如果选项中有 contentSourceId 和 contentSourceChapterIndex，则比对指定的索引
            if(options.contentSourceId && $.type(options.contentSourceChapterIndex) == 'number'){
                return co(getChapterFromSelectBookSourceAndSelectSourceChapterIndex(options.contentSourceId, options.contentSourceChapterIndex))
                    .catch(handleWithNormalMethod);
            }
            else{
                return co(getChapterFromContentSources2(options.contentSourceId));
            }

            // 把结果添加到 Result
            function addChapterToResult(chapterB, indexB, source){
                if(!options.noInfluenceWeight)
                    self.sources[source].weight += FOUND_WEIGHT;
                // let chapter = new Chapter();
                // chapter.title = chapterA.title;
                // chapter.content = chapterB.content;
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

            // 提交结果
            function submitResult(){
                if(result.length <= 0){
                    return Promise.reject(201);
                }
                else{
                    if(options.count && options.count > 1)
                        return Promise.resolve(result);
                    else{
                        return Promise.resolve(result[0]);
                    }
                }
            }

            function* getChapterFromContentSources2(includeSource){

                let opts = $.extend(true, {}, options);

                let contentSources = util.objectSortedKey(self.sources, 'weight'); // 按权重从小到大排序的数组
                // 去掉要排除的源
                if(options.excludes){
                    for(let exclude of options.excludes)
                    {
                        let i = contentSources.indexOf(exclude);
                        delete contentSources[i];
                        if(!options.noInfluenceWeight)
                            self.sources[exclude].weight += EXECLUDE_WEIGHT;
                    }
                }
                if(includeSource){
                    let i = contentSources.indexOf(includeSource);
                    delete contentSources[i];
                    // 放到结尾处
                    contentSources.push(includeSource);
                    if(!options.noInfluenceWeight)
                        self.sources[includeSource].weight += INCLUDE_WEIGHT;
                }

                while(contentSources.length > 0 && count > 0){
                    opts.bookSourceId = contentSources.pop();

                    if(!opts.bookSourceId)
                        continue;
                    try{

                        let sourceB = opts.bookSourceId;
                        let {chapter: chapterBB, index: indexB, catalog: catalogB} = yield self.fuzzySearch(sourceB, index, options);
                        let bs = yield self.getBookSource(opts);
                        let chapterB = yield bs.getChapter(opts.bookSourceManager, self, chapterBB, opts.onlyCacheNoLoad);

                        // 找到了章节
                        addChapterToResult(chapterB, indexB, sourceB);
                        count--;
                    }
                    catch(e){
                        if(!options.noInfluenceWeight)
                            self.sources[opts.bookSourceId].weight += NOTFOUND_WEIGHT;
                    }
                }
                return submitResult();
            }


            function handleWithNormalMethod(error){
                // 失败则按正常方式获取
                // 注意网络不通的问题
                return co(getChapterFromContentSources2());
            }

            // 从指定的源和索引中获取章节
            function* getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex){

                let opts = $.extend(true, {}, options);
                opts.bookSourceId = contentSourceId;
                if(!options.noInfluenceWeight)
                    self.sources[contentSourceId].weight += INCLUDE_WEIGHT;

                let {chapter: chapterB, index:indexB, catalog: catalogB} = yield self.index(contentSourceChapterIndex, opts);

                if(!Chapter.equalTitle(chapterA, chapterB)){
                    throw new Error();
                }

                let bs = yield self.getBookSource(opts);

                chapterB = yield bs.getChapter(opts.bookSourceManager, self, chapterB, opts.onlyCacheNoLoad);

                // 找到了章节
                addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                count--;
                if(count > 0){
                    debugger;
                    return handleWithNormalMethod();
                }
                else{
                    return submitResult();
                }
            }
        }

        // // 一次获取多个章节
        // // chapterIndex 是从主要目录源中获取的章节索引
        // // direction 获取章节的方向，大于等于 0 则向下获取，小于 0 则向上获取
        // // options
        // // * noInfluenceWeight false 是否要改变内容源的权重
        // // * cacheDir 缓存章节的目录
        // // * excludes 要排除的内容源
        // // * contentSourceId 希望使用的内容源
        // // * contentSourceChapterIndex 希望匹配的索引
        // // * count 获取的数目
        // // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
        // getCountlessChapters(chapterIndex, direction, success, fail, finish, options){

        //     if(!success)
        //         return;
        //     if(chapterIndex < 0 && direction < 0){
        //         if(fail)fail(203);
        //         return;
        //     }
        //     if(chapterIndex < 0){
        //         chapterIndex = 0;
        //     }

        //     let self = this;
        //     options = $.extend(true, {}, options);
        //     options.bookSourceId = options.bookSourceId || self.mainSourceId;

        //     chapterIndex += (direction >= 0? -1 : 1);
        //     options.contentSourceChapterIndex += (direction >= 0? -1 : 1);

        //     next();
        //     function next(){
        //         chapterIndex += (direction >= 0? 1 : -1);
        //         options.contentSourceChapterIndex += (direction >= 0? 1 : -1);

        //         self.getChapter(chapterIndex,
        //             function(chapter, index, opts){
        //                 options = $.extend(true, options, opts);

        //                 if(success(chapter, index, opts))
        //                     next();
        //                 else{
        //                     if(finish)finish();
        //                 }
        //             },
        //             function(error){
        //                 if(error == 202 && direction >= 0 || // 后面没有章节了
        //                    error == 203 && direction < 0){ // 前面没有章节了
        //                     // 当没有更新的章节时，直接退出
        //                     if(fail)fail(error);
        //                     if(finish)finish();
        //                     return;
        //                 }
        //                 else if(error == 203 && direction >= 0 ||
        //                     error == 202 && direction < 0){
        //                     if(success(null, chapterIndex, options))
        //                         next();
        //                     else{
        //                         if(finish)finish();
        //                     }
        //                 }
        //                 else{
        //                     if(fail && fail(error))
        //                         next();
        //                     else{
        //                         if(finish)finish();
        //                     }
        //                 }
        //             }, options);
        //     }
        // }


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
        *getChapters(chapterIndex, nextCount, direction, options){

            // if(chapterIndex < 0){
            //     nextCount += chapterIndex;
            //     chapterIndex = 0;
            // }
            if(nextCount < 0){
                return;
            }

            options = $.extend(true, {}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;

            for(let i = 0; i < nextCount; i++){
                yield this.getChapter(chapterIndex, options);
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
        cacheChapter(chapterIndex, nextCount, options){

            options = $.extend(true, {}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;
            options.noInfluenceWeight = true;
            options.onlyCacheNoLoad = true;

            return co(this.getChapters(chapterIndex, nextCount, 1, options));
        }
        // *************************** 章节部分结束 ****************

        // 获取最新章节
        // 缺省强制更新
        getLastestChapter(options){
            options = $.extend(true, {}, options);
            options.bookSourceId = options.bookSourceId || this.mainSourceId;
            let bss = null;
            return this.getBookSource(options)
                .then(bs => {
                    bss = bs;
                    return bs.refreshLastestChapter(options.bookSourceManager, this);
                })
                .catch(error => {
                    if(error == 402){
                        return [bss.lastestChapter, false];
                    }
                    else{
                        return Promise.reject(error);
                    }
                });
        }

    }

    Book.Cast = function(obj){
        let nb = new Book();
        $.extend(true, nb, obj);

        for(let bsid in nb.sources){
            let nbs = new BookSource(bsid);
            $.extend(nbs, nb.sources[bsid]);
            nb.sources[bsid] = nbs;
        }
        return nb;
    }

    return Book;
});

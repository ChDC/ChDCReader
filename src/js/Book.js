define(["jquery", "util", "Chapter", "BookSource"], function($, util, Chapter, BookSource) {
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
        let bookErrorCode = {
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

    // 属性
    // Book.prototype.id = "";  // 编号
    Book.prototype.name = "";  // 书名
    Book.prototype.author = "";  // 作者
    Book.prototype.catagory = "";  // 分类
    Book.prototype.cover = "";  // 封面
    Book.prototype.complete = undefined;  // 是否完结
    Book.prototype.introduce = "";  // 简介
    Book.prototype.sources = undefined;  // 内容来源
    Book.prototype.mainSourceId = undefined;  // 当前来源
    // Book.prototype.lastestChapter = undefined;  // 最新的章节

    // 方法
    // 获取当前书籍指定的目录源信息
    Book.prototype.getBookSource = function(success, fail, options){
        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;
        let bs = self.sources[options.bookSourceId];
        if(bs){
            if(success)success(bs, options.bookSourceId);
        }
        else{
            let bsm = options.bookSourceManager.sources[options.bookSourceId];
            if(bsm)
            {
                let bss = new BookSource(options.bookSourceId, bsm.contentSourceWeight);
                self.sources[options.bookSourceId] = bss;

                if(success)success(bss, options.bookSourceId);
            }
            else{
                if(fail)fail(Book.getError(302));
            }
        }
    }

    // 检查源是否有缺失
    Book.prototype.checkBookSources = function(bookSourceManager){
        let self = this;
        let sources = bookSourceManager.sources;
        for(let k in sources){
            if(!(k in self.sources)){
                let bss = new BookSource(k, sources[k].contentSourceWeight);
                self.sources[k] = bss;
            }
        }
    }

    // 设置主源
    Book.prototype.setMainSourceId = function(bookSourceId, success, fail, options){
        let self = this;
        if(self.mainSourceId == bookSourceId)
            return;

        options = $.extend(true, {}, options);
        if(bookSourceId && bookSourceId in options.bookSourceManager.sources){
            self.mainSourceId = bookSourceId;
            if(success)success(self);
        }
        else{
            if(fail)fail(Book.getError(301));
        }
    };

    // 获取目录
    // options:
    // * forceRefresh 强制刷新
    Book.prototype.getCatalog = function(success, fail, options){
        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.getBookSource(function(bs){
            bs.getCatalog(options.bookSourceManager, self, options.forceRefresh, success, fail);
        },
        fail, options);
    }

    // 使用详情页链接刷新书籍信息
    // 前提：book.sources 中有详情链接
    Book.prototype.refreshBookInfo = function(success, fail, options){
        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.getBookSource(function(bs, bsid){

            bs.getBookInfo(options.bookSourceManager, self,
               function(book){
                self.catagory = book.catagory;  // 分类
                self.cover = book.cover;  // 封面
                self.complete = book.complete;  // 是否完结
                self.introduce = book.introduce;  // 简介
            },
            fail);

        }, fail, options);

    };

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

        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

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

        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;


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
                fuzzySearchWhenNotEqual(catalog);
            },
            fail, options);
        }

        function fuzzySearchWhenNotEqual(catalog, stop){

            self.getCatalog(function(catalogB){

                if(!catalogB || catalogB.length <= 0){
                    if(fail)fail(Book.getError(501));
                    return;
                }

                let matchs = [
                    [util.listMatch.bind(util), Chapter.equalTitle.bind(Chapter)],
                    [util.listMatchWithNeighbour.bind(util), Chapter.equalTitle.bind(Chapter)],
                    [util.listMatchWithNeighbour.bind(util), Chapter.equalTitleWithoutNum.bind(Chapter)],
                ];
                for(let i = 0; i < matchs.length; i++){
                    let match = matchs[i];
                    let indexB = match[0](catalog, catalogB, index, match[1]);
                    if(indexB >= 0){
                        // 找到了
                        if(success){
                            let chapterB = catalogB[indexB];
                            success(chapterB, indexB, catalogB, sourceB);
                            return;
                        }
                    }
                    else{
                        continue;
                    }
                }
                // 一个也没找到
                if(stop){
                    if(fail)fail(Book.getError(201));
                    return;
                }
                // 更新章节目录然后重新查找
                options.forceRefresh = true;
                fuzzySearchWhenNotEqual(catalog, true);
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

        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

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
        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        let chapterA = catalog[index];
        let result = []; // 结果的集合，按权重排序
        let count = options.count || 1; // 想获取的数目

        // ***** 常量 ******
        const FOUND_WEIGHT = 0; // 找到后增加的权重
        const NOTFOUND_WEIGHT = -2; // 没找到的权重
        const EXECLUDE_WEIGHT = -4; // 排除的权重
        const INCLUDE_WEIGHT = 0; // 指定的源
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
                if(finalFail)
                    finalFail(Book.getError(201));
            }
            else{
                if(success){
                    if(options.count && options.count > 1)
                        success(result);
                    else{
                        let r = result[0];
                        success(r.chapter, r.title, r.index, r.options);
                    }
                }
            }
        }

        function getChapterFromContentSources2(includeSource){

            let opts = $.extend(true, {}, options);

            let contentSources = util.objectSortedKey(self.sources, 'weight'); // 按权重从小到大排序的数组
            // 去掉要排除的源
            if(options.excludes){
                for(let ei = 0; ei < options.excludes.length; ei++)
                {
                    let exclude = options.excludes[ei];
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
                        self.getBookSource(function(bs){
                            bs.getChapter(opts.bookSourceManager, self, chapterBB, opts.onlyCacheNoLoad,
                                function(chapterB){
                                    // 找到了章节
                                    addChapterToResult(chapterB, indexB, sourceB);
                                    count--;
                                    next();
                                },
                                failToNext);
                            },
                            failToNext, opts);
                        // self.__getChapter(chapterBB, indexB,
                        //     function(chapterB){
                        //         // 找到了章节
                        //         addChapterToResult(chapterB, indexB, sourceB);
                        //         count--;
                        //         next();
                        //     },
                        //     failToNext, opts);
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

            let opts = $.extend(true, {}, options);
            opts.bookSourceId = contentSourceId;
            if(!options.noInfluenceWeight)
                self.sources[contentSourceId].weight += INCLUDE_WEIGHT;

            self.index(contentSourceChapterIndex,
                function(chapterB, indexB, catalogB){
                if(Chapter.equalTitle(chapterA, chapterB)){
                    self.getBookSource(function(bs){
                        bs.getChapter(opts.bookSourceManager, self, chapterB, opts.onlyCacheNoLoad,
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
                            handleWithNormalMethod);
                        },
                        handleWithNormalMethod, opts);
                    // self.__getChapter(chapterB, contentSourceChapterIndex,
                    //     function(chapterB){
                    //         // 找到了章节
                    //         addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
                    //         count--;
                    //         if(count > 0){
                    //             debugger;
                    //             handleWithNormalMethod();
                    //         }
                    //         else{
                    //             submitResult();
                    //         }
                    //     },
                    //     handleWithNormalMethod, opts);
                }
                else{
                    // 不相等，则按正常方式获取
                    handleWithNormalMethod();
                }
            },
            handleWithNormalMethod, opts);
        }
    }

    // // 从本地或网络上获取章节内容
    // // * cacheDir 缓存章节的目录
    // // * onlyCacheNoLoad 只缓存章节，不加载章节
    // // success(chapter)
    // Book.prototype.__getChapter = function(chapter, index, success, fail, options){
    //     let self = this;
    //     options = $.extend(true, {}, options);
    //     // 默认从主要内容源中获取章节
    //     options.bookSourceId = options.bookSourceId || self.mainSourceId;

    //     // 从缓存中获取章节内容
    //     self.__getCacheChapter(index,
    //         function(c){
    //             if(success)success(options.onlyCacheNoLoad? chapter: c);
    //         },
    //         function(error){
    //             if(error.id == 207)
    //             {
    //                 // 从缓存中获取失败的话，再从网上获取章节，然后缓存到本地
    //                 options.bookSourceManager.getChapter(options.bookSourceId, chapter.link,
    //                     function(chapter){
    //                         // 获取章节成功
    //                         if(success)success(chapter);
    //                         // 缓存该章节
    //                         self.__cacheChapter(index, chapter, null, null, options);
    //                     }, fail);
    //             }
    //             else{
    //                 if(fail)fail(error);
    //             }
    //         }, options);
    // }

    // // 获取章节的缓存位置
    // // * cacheDir 缓存章节的目录
    // Book.prototype.__getCacheChapterLocation = function(index, options){

    //     let self = this;
    //     let bookSourceId = options.bookSourceId || '';
    //     let bid = self.name + '.' + self.author;
    //     let chapterFileName = index + '.' + bookSourceId;
    //     let cacheDir = options.cacheDir || "chapter";
    //     let dest = cacheDir + "_" + bid + "_" + chapterFileName;
    //     return dest;
    // }

    // // 获取指定的章节
    // // * cacheDir 缓存章节的目录
    // // * onlyCacheNoLoad 只缓存章节，不加载章节
    // Book.prototype.__getCacheChapter = function(index, success, fail, options){

    //     let self = this;
    //     let dest = self.__getCacheChapterLocation(index, options);

    //     if(options.onlyCacheNoLoad){
    //         util.dataExists(dest,
    //             function(){
    //                 if(success)success(null);
    //             },
    //             function(){
    //                 // 章节不存在
    //                 if(fail)fail(Book.getError(207));
    //             }, true);
    //         return;
    //     }
    //     else{
    //         // 获取章节内容
    //         util.loadData(dest,
    //             function(data){
    //                 // 章节存在
    //                 if(data != null){
    //                     if(success){
    //                         let chapter = new Chapter();
    //                         // 类型转换
    //                         chapter = $.extend(true, chapter, data);
    //                         success(chapter);
    //                     }
    //                 }
    //                 else{
    //                     if(fail)fail(Book.getError(207));
    //                 }
    //             },
    //             function(){
    //                 if(fail)fail(Book.getError(207));
    //             }, true);
    //     }
    // };

    // // 缓存章节内容
    // // * cacheDir 缓存章节的目录
    // Book.prototype.__cacheChapter = function(index, chapter, success, fail, options){

    //     let self = this;
    //     // 保存到文件中
    //     let dest = self.__getCacheChapterLocation(index, options);
    //     util.saveData(dest, chapter, success, fail, true); // 将 JSON 对象序列化到文件中
    // };

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

        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

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
                    if(error.id == 202 && direction >= 0 || // 后面没有章节了
                       error.id == 203 && direction < 0){ // 前面没有章节了
                        // 当没有更新的章节时，直接退出
                        if(fail)fail(error);
                        if(finish)finish();
                        return;
                    }
                    else if(error.id == 203 && direction >= 0 ||
                        error.id == 202 && direction < 0){
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

        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        for(let i = 0; i < nextCount; i++){
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

        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;
        options.noInfluenceWeight = true;
        options.onlyCacheNoLoad = true;

        self.getChapters(chapterIndex, nextCount, 0, null, null, options);
    }
    // *************************** 章节部分结束 ****************

    // 获取最新章节
    // 缺省强制更新
    Book.prototype.getLastestChapter = function(success, fail, options){
        let self = this;
        options = $.extend(true, {}, options);
        options.bookSourceId = options.bookSourceId || self.mainSourceId;

        self.getBookSource(function(bs){
            bs.refreshLastestChapter(options.bookSourceManager, self, success,
                function(error){
                    if(error.id == 402){
                        if(success)success(bs.lastestChapter, false);
                    }
                    else{
                        if(fail)fail(error);
                    }
                });
        },
        fail, options);
    }

    return Book;
});

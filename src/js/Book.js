;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["Book"] = factory.apply(undefined, deps.map(e => window[e]));
}(["co", "utils", "Chapter", "BookSource"], function(co, utils, Chapter, BookSource) {
  "use strict"

  // ****** Book ****
  class Book{

    constructor(bookSourceManager){

      this.bookSourceManager = bookSourceManager;

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
    getBookSource(bookSourceId=this.mainSourceId){

      return new Promise((resolve, reject) => {
        const bs = this.sources[bookSourceId];
        if(bs){
          resolve(bs);
        }
        else{
          const bsm = this.bookSourceManager.getBookSource(bookSourceId);
          if(bsm)
          {
            const bss = new BookSource(this, this.bookSourceManager, bookSourceId, bsm.contentSourceWeight);
            this.sources[bookSourceId] = bss;
            resolve(bss);
          }
          else{
            reject(302);
          }
        }
      });
    }

    getOfficialDetailLink(bookSourceId=this.mainSourceId){
      try{
        return this.bookSourceManager.getOfficialURLs(bookSourceId, this.sources[bookSourceId], "bookdetail");
      }
      catch(error){
        return null;
      }
    }

    // 按主源权重从大到小排序的数组
    getSourcesKeysByMainSourceWeight(){
      let type = this.bookSourceManager.getBookSourceType(this.mainSourceId);
      return this.bookSourceManager.getSourcesKeysByMainSourceWeight(type);
    }

    // 按内容源权重从大到小排序的数组
    getSourcesKeysSortedByWeight(){
      let object = this.sources;
      let key = "weight";
      return Object.entries(object).sort((e1, e2) => - e1[1][key] + e2[1][key]).map(e => e[0]); // 按主源权重从大到小排序的数组
    }

    // 检查源是否有缺失或多余
    checkBookSources(){
      const sources = this.bookSourceManager.getBookSourcesBySameType(this.mainSourceId);

      // 添加缺失
      for(const k in sources){
        if(!(k in this.sources)){
          this.sources[k] = new BookSource(this, this.bookSourceManager, k, sources[k].contentSourceWeight);
        }
      }

      // 删除多余
      for(const k in this.sources){
        if(!(k in sources)){
          delete this.sources[k];
        }
      }
    }

    // 设置主源
    setMainSourceId(bookSourceId){

      return new Promise((resolve, reject) => {
        if(this.mainSourceId == bookSourceId)
          return;

        if(bookSourceId && bookSourceId in this.bookSourceManager.getBookSourcesBySameType(this.mainSourceId)){
          this.mainSourceId = bookSourceId;
          resolve(this);
        }
        else{
          reject(301);
        }
      })
    }

    getType(){
      return this.bookSourceManager.getBookSourceType(this.mainSourceId);
    }

    // 获取目录
    // options:
    // * forceRefresh 强制刷新
    getCatalog({forceRefresh=false, refresh=false, bookSourceId=this.mainSourceId, groupByVolume=false, countPerGroup=100}={}){

      return this.getBookSource(bookSourceId)
        .then(bs => bs.getCatalog({forceRefresh: forceRefresh, refresh: refresh}))
        .then(catalog => {
          if(!catalog || catalog.length <= 0)
            return Promise.reject(501);
          if(!groupByVolume)
            return catalog;
          return this.groupCatalogByVolume(catalog, {bookSourceId: bookSourceId, countPerGroup: countPerGroup});
        });
    }

    // 按卷或者数量对章节进行分组
    groupCatalogByVolume(catalog, {bookSourceId=this.mainSourceId, countPerGroup=100}={}){

      if(!catalog) return catalog;
      catalog.forEach((c, i) => c.index = i); // NOTE: 此处对原始数据进行了修改

      if(this.bookSourceManager.hasVolume(bookSourceId)){
        let result = [];
        let volumeName = NaN;
        let vi = -1;
        for(let c of catalog){
          if(volumeName != c.volume){
            volumeName = c.volume;
            result[++vi] = {name: volumeName, chapters: []}
          }
          result[vi].chapters.push(c);
        }
        result.forEach(v => v.chapters = groupByNumber(v.chapters, countPerGroup));
        if(result.length == 1)
          return result[0].chapters;
        return result;
      }
      else
        return groupByNumber(catalog, countPerGroup);

      function groupByNumber(catalog, countPerGroup){
        let n = Math.ceil(catalog.length / countPerGroup);
        if(n <= 1) return catalog;
        return new Array(n).fill(0).map((e, i) => ({
            name: `${i*countPerGroup+1}-${(i+1)*countPerGroup}`,
            chapters: catalog.slice(i*countPerGroup, (i+1)*countPerGroup)
          }));
      }
    }

    // 使用详情页链接刷新书籍信息
    // 前提：book.sources 中有详情链接
    refreshBookInfo(bookSourceId=this.mainSourceId){

      return this.getBookSource(bookSourceId)
        .then(bs => bs.getBookInfo())
        .then(book => {
            if(book.catagory) this.catagory = book.catagory;  // 分类
            if(book.cover) this.cover = book.cover;  // 封面
            if(book.complete) this.complete = book.complete;  // 是否完结
            if(book.introduce) this.introduce = book.introduce;  // 简介
          });
    }

    // *************************** 章节部分 ****************

    // 获取指定源的指定索引的章节
    index(chapterIndex, options){
      if(typeof chapterIndex != "number"){
        return Promise.reject(205);
      }

      if(chapterIndex < 0){
        return Promise.reject(203);
      }

      return this.getCatalog(options)
        .then(catalog => {
          if(chapterIndex >= 0 && chapterIndex < catalog.length)
            // 存在于目录中
            return catalog[chapterIndex];
          else if(chapterIndex >= catalog.length)
            // 超界了
            return Promise.reject(202);
          else
            // index < 0
            return Promise.reject(203);
        });
    }

    // 在指定的源 B 中搜索目录源的中某章节的相对应的章节
    // options.loose 宽松匹配模式
    fuzzySearch(sourceB, index, options){

      let opts = Object.assign({}, options, {bookSourceId: sourceB});
      if(options.bookSourceId == sourceB){
        // 两源相同
        return this.index(index, opts)
          .then(chapter => {
            return {"chapter": chapter, "index": index}
          });
      }

      const self = this;
      return co(function*(){
        // 获取目录源的目录
        const catalog = yield self.getCatalog({bookSourceId: options.bookSourceId}); // NOTE: 此处默认不更新目录

        // 获取源B 的目录
        const catalogB = yield self.getCatalog(opts);

        const matches = [utils.listMatch.bind(utils), utils.listMatchWithNeighbour.bind(utils)];

        let indexB = Chapter.findEqualChapter(catalog, catalogB, index, matches, options.loose);
        if(indexB >= 0){
          // 找到了
          const chapterB = catalogB[indexB];
          return Promise.resolve({chapter: chapterB, index: indexB});
        }
        else
          return Promise.reject(201);

        // const matches = [
        //   [utils.listMatch.bind(utils), Chapter.equalTitle.bind(Chapter)],
        //   [utils.listMatchWithNeighbour.bind(utils), Chapter.equalTitle.bind(Chapter)]
        // ];

        // for(const match of matches){
        //   const [matchFunc, compareFunc] = match;
        //   const indexB = matchFunc(catalog, catalogB, index, compareFunc);
        //   if(indexB >= 0){
        //     // 找到了
        //     const chapterB = catalogB[indexB];
        //     return Promise.resolve({chapter: chapterB, index: indexB});
        //   }
        //   else{
        //     continue;
        //   }
        // }

        // // 一个也没找到
        // return Promise.reject(201);
      });
    }

    // 从网上获取指定的章节
    // chapterIndex 是从主要目录源中获取的章节索引
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
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

      options = Object.assign({}, options);
      options.bookSourceId = options.bookSourceId || this.mainSourceId;

      return this.index(chapterIndex, options)
        .catch(error => {
          if(error != 202 || options.refresh || options.forceRefresh)
            return Promise.reject(error);
          options.refresh = true; // NOTE: 此处设置了 refresh 为 true，也就是当主目录没有找到制定的索引，比如最新章节索引的时候，会更新主目录，然后 refresh 向下传递会自动更新内容目录
          // 强制更新目录
          return this.index(chapterIndex, options);
        })
        .then(chapter =>
          co(this.__getChapterFromContentSources(chapter, chapterIndex, options)));

    }

    // 按一定的算法从所有的源中找到合适的章节内容
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * count 获取的数目
    // * onlyCacheNoLoad 只缓存章节，不加载章节
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    *__getChapterFromContentSources(chapterA, index, options={}){

      let {
        bookSourceId = this.mainSourceId,
        count = 1,
        excludes,
        contentSourceId,
        contentSourceChapterIndex,
        onlyCacheNoLoad,
        noInfluenceWeight = false,
        searchedSource = [] // 已经搜索过的源
      } = options;

      // const catalog = yield this.getCatalog(options);
      // const chapterA = catalog[index];
      const result = []; // 结果的集合，按权重排序
      const errorCodeList = []; // 用于存放每次获取章节失败的原因
      let remainCount = count;// 想获取的数目

      // ***** 常量 ******
      const FOUND_WEIGHT = 0; // 找到后增加的权重
      const NOTFOUND_WEIGHT = -2; // 没找到的权重
      const EXECLUDE_WEIGHT = -4; // 排除的权重
      const INCLUDE_WEIGHT = 0; // 指定的源
      // *****************

      const self = this;

      // 如果指定的源是要排除的源，则清除之
      if(excludes && excludes.includes(contentSourceId))
        contentSourceId = null;

      // 如果选项中有 contentSourceId 和 contentSourceChapterIndex，则比对指定的索引
      if(contentSourceId && typeof contentSourceChapterIndex == 'number' && !searchedSource.includes(contentSourceId)){
        return co(getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex))
          .catch(error => {
            return co(getChapterFromContentSources2(contentSourceId));
            // if(error == 204)
            //   return handleWithNormalMethod(error, contentSourceId);
            // else{
            //   searchedSource.push(contentSourceId);
            //   return handleWithNormalMethod(error);
            // };
          });
      }
      else{
        return co(getChapterFromContentSources2(contentSourceId));
      }

      // 把结果添加到 Result
      function addChapterToResult(chapterB, indexB, source){
        if(!noInfluenceWeight)
          self.sources[source].weight += FOUND_WEIGHT;

        const chapter = new Chapter();
        Object.assign(chapter, chapterA);
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
          // 返回错误数最多的错误
          let re = utils.findMostError(errorCodeList);
          return Promise.reject(re ? re : 201);
        }
        else{
          if(count > 1)
            return Promise.resolve(result);
          else{
            return Promise.resolve(result[0]);
          }
        }
      }

      function* getChapterFromContentSources2(includeSource){
        yield getChapterFromAllContentSources(includeSource, options);
        if(result.length <= 0){
          // 宽松匹配模式
          let opts = Object.assign({}, options, {loose: true});
          yield getChapterFromAllContentSources(includeSource, opts);
        }
        return submitResult();
      }

      function* getChapterFromAllContentSources(includeSource, options){

        // 按权重从小到大排序的数组
        const contentSources = self.getSourcesKeysSortedByWeight().reverse();
        // 去掉要排除的源
        if(excludes){
          excludes.forEach(exclude => {
            const i = contentSources.indexOf(exclude);
            if(i < 0) return;
            contentSources.splice(i, 1);
            if(!noInfluenceWeight)
              self.sources[exclude].weight += EXECLUDE_WEIGHT;
          });
        }
        if(searchedSource){
          searchedSource.forEach(exclude => {
            const i = contentSources.indexOf(exclude);
            if(i < 0) return;
            contentSources.splice(i, 1);
          });
        }

        if(includeSource){
          if(!noInfluenceWeight)
            self.sources[includeSource].weight += INCLUDE_WEIGHT;
        }
        else
          includeSource = bookSourceId;

        const i = contentSources.indexOf(includeSource);
        if(i >= 0) contentSources.splice(i, 1);
        // 放到结尾处
        contentSources.push(includeSource);

        while(contentSources.length > 0 && remainCount > 0){
          let sourceB = contentSources.pop();

          if(!sourceB)
            continue;
          try{
            let result;
            try {
              result = yield self.fuzzySearch(sourceB, index, options);
            }
            catch(error){
              if(error != 201 || options.refresh || options.forceRefresh)
                throw error;
              let opts = Object.assign({}, options, {refresh: true});
              result = yield self.fuzzySearch(sourceB, index, opts);
            }
            const {chapter: chapterBB, index: indexB} = result;
            const bs = yield self.getBookSource(sourceB);
            const chapterB = yield bs.getChapter(chapterBB, onlyCacheNoLoad);

            // 找到了章节
            addChapterToResult(chapterB, indexB, sourceB);
            remainCount--;
          }
          catch(e){
            errorCodeList.push(e);
            if(!noInfluenceWeight)
              self.sources[sourceB].weight += NOTFOUND_WEIGHT;
          }
        }
        // return submitResult();
      }

      // function handleWithNormalMethod(error, contentSourceId){
      //   // 失败则按正常方式获取
      //   // 注意网络不通的问题
      //   if(error != 204 && typeof(error) == "string" && !error.includes('AjaxError')){
      //     debugger;
      //     errorCodeList.push(error);
      //   }
      //   return co(getChapterFromContentSources2(contentSourceId));
      // }

      // 从指定的源和索引中获取章节
      function* getChapterFromSelectBookSourceAndSelectSourceChapterIndex(contentSourceId, contentSourceChapterIndex){

        if(!noInfluenceWeight)
          self.sources[contentSourceId].weight += INCLUDE_WEIGHT;
        let opts = Object.assign({}, options, {bookSourceId: contentSourceId});
        let chapterB;
        try{
          chapterB = yield self.index(contentSourceChapterIndex, opts);
        }
        catch(error){
          if(error != 202 || opts.refresh)
            throw error;
          opts.refresh = true;
          // 强制更新目录
          chapterB = yield self.index(contentSourceChapterIndex, opts);
        }

        // 放宽对比范围
        if(!Chapter.equalTitle(chapterA, chapterB, true)){
          throw 204;
        }

        const bs = yield self.getBookSource(contentSourceId);
        chapterB = yield bs.getChapter(chapterB, onlyCacheNoLoad);

        // 找到了章节
        addChapterToResult(chapterB, contentSourceChapterIndex, contentSourceId);
        remainCount--;
        if(remainCount > 0){
          debugger;
          searchedSource.push(contentSourceId);
          return co(getChapterFromContentSources2());
        }
        else{
          return submitResult();
        }
      }
    }

    // 根据标题获取章节在目录中的索引值
    getChapterIndex(title, index, options={}){
      return this.getCatalog(options)
        .then(catalog => {
          if(index != undefined){
            let tc = catalog[index];
            if(Chapter.equalTitle(tc, title, true))
              return index;

            // right
            let ir = catalog.slice(index+1).findIndex(c => !!Chapter.equalTitle(c, title));
            let il = catalog.slice(0, index).reverse().findIndex(c => !!Chapter.equalTitle(c, title));

            if(ir >= 0 && (il < 0 || ir < il))
              return index + ir + 1;
            else if(il >= 0 && (ir < 0 || il < ir ))
              return index - il - 1;
            else
              return -1;
          }
          return catalog.findIndex(c => !!Chapter.equalTitle(c, title));
        });
    }

    // 一次获取多个章节
    // chapterIndex 是从主要目录源中获取的章节索引
    // nextCount 获取的章节数目
    // direction 获取章节的方向，大于等于 0 则向下获取，小于 0 则向上获取
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * count 获取的数目
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    // * map 对结果进行处理的函数
    buildChapterIterator(chapterIndex, direction, options, map=e=>e){
      options = Object.assign({}, options);
      let self = this;
      let finished = false;
      return {
        next(){
          if(finished) return Promise.resolve({done: true});
          return self.getChapter(chapterIndex, options)
            .then(result => {
                if(options.forceRefresh)
                  options.forceRefresh = false;
                Object.assign(options, result.options);
                chapterIndex += (direction >= 0? 1 : -1);
                options.contentSourceChapterIndex += (direction >= 0? 1 : -1);
                return {value: map(result, direction), done: false};
              })
            .catch(error => {
              if(error == 203|| error == 202){
                finished = true;
                return Promise.resolve({value: map(undefined, direction), done: true});
              }
              throw error;
            });
        }
      };
    }

    // chapterIndex 是从主要目录源中获取的章节索引
    // nextCount 缓存的章节数目
    // options
    // * noInfluenceWeight false 是否要改变内容源的权重
    // * excludes 要排除的内容源
    // * contentSourceId 希望使用的内容源
    // * contentSourceChapterIndex 希望匹配的索引
    // * count 获取的数目，当 count == 1 时，用于前端获取并显示数据，当 count >= 1 时，用于缓存章节
    // 成功返回：章节对象，目录源章节索引，内容源，内容源章节索引
    cacheChapter(chapterIndex, nextCount, options){

      options = Object.assign({}, options);
      options.noInfluenceWeight = true;
      options.onlyCacheNoLoad = true;

      let citer = this.buildChapterIterator(chapterIndex, 1, options);

      return co(function*(){
        for(let i = 0; i < nextCount; i++){
          yield citer.next();
        }
      });

      // return co(this.getChapters(chapterIndex, nextCount, 1, options));
    }

    // 清除缓存章节
    clearCacheChapters(){
      utils.removeData(`chapter/${this.name}_${this.author}/`, true);
    }

    // *************************** 章节部分结束 ****************

    // 获取最新章节
    // 缺省强制更新
    getLastestChapter(bookSourceId){
      return this.getBookSource(bookSourceId)
        .then(bs => bs.refreshLastestChapter());
    }

  }

  // 用于标记持久化的属性
  Book.persistentInclude = ["name", "author", "catagory", "cover", "complete",
              "introduce", "sources", "mainSourceId"];

  Book.Cast = function(obj, bookSourceManager){
    const nb = new Book(bookSourceManager);
    Object.assign(nb, obj);

    for(const bsid in nb.sources){
      const nbs = new BookSource(nb, nb.bookSourceManager, bsid);
      Object.assign(nbs, nb.sources[bsid]);
      nb.sources[bsid] = nbs;
    }
    return nb;
  }

  // 判断两本是书是否相等
  Book.equal = function(bookA, bookB){
    return bookA.name == bookB.name && bookA.author == bookB.author;
  }

  return Book;
}));

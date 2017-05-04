;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["BookSourceManager"] = factory();
}(['co', "utils", "LittleCrawler", "translate", "Book", "BookSource", "Chapter"], function(co, utils, LittleCrawler, translate, Book, BookSource, Chapter) {
  "use strict"

  // **** BookSourceManager *****
  class BookSourceManager{

    constructor(configFileOrConfig, customBookSource){

      this.__sources;
      this.__customBookSource = customBookSource;
      this.__lc = new LittleCrawler();

      this.loadConfig(configFileOrConfig);
      this.addCustomSourceFeature();
    }

    // 加载配置
    loadConfig(configFileOrConfig){
      if(configFileOrConfig && typeof configFileOrConfig == 'string'){
        return utils.getJSON(configFileOrConfig)
          .then(data => {
            this.__sources = {};
            data.valid.forEach(key => this.__sources[key] = data.sources[key]);
            return this.__sources;
          });
      }
      else if(configFileOrConfig){
        this.__sources = configFileOrConfig;
      }
      return this.__sources;
    }

    // 把拦截函数功能添加到类中
    // 可以设置前置拦截器、方法拦截器和后置拦截器
    addCustomSourceFeature(){
      if(!this.__customBookSource) return;
      let customFunctionList = ["getBook", "searchBook",
              "getBookInfo", "getChapter",
              "getBookCatalog", "getBookCatalogLink", "getLastestChapter"];

      customFunctionList.forEach(cf => {
        let oldFunction = this[cf];
        let self = this;
        this[cf] = function(bsid){ // 此处必须用 function，不能用箭头函数

          // 在调用系统函数之前，用自定义的 before* 函数处理参数
          // 如 beforegetBook 或 beforeGetBook 处理 getBook 函数
          let beforeFunctions = [`before${cf}`, `before${cf[0].toUpperCase()}${cf.slice(1)}`];
          let argsPromise = Promise.resolve(arguments);
          for(let bf of beforeFunctions){
            if(bsid in this.__customBookSource && bf in this.__customBookSource[bsid]){
              argsPromise = this.__customBookSource[bsid][bf].apply(self, arguments);
              break;
            }
          }

          let promise;
          // 优先调用自定义的同名函数，如果 getBook
          if(bsid in this.__customBookSource && cf in this.__customBookSource[bsid])
            promise = argsPromise.then(args => this.__customBookSource[bsid][cf].apply(self, args));

          else
            // 调用系统函数
            promise = argsPromise.then(args => oldFunction.apply(self, args));

          // 在调用完系统函数之后，用自定义的 after* 函数处理结果
          // 如 aftergetBook 或 afterGetBook 处理 getBook 函数
          let afterFunctions = [`after${cf}`, `after${cf[0].toUpperCase()}${cf.slice(1)}`];

          for(let af of afterFunctions){
            if(bsid in this.__customBookSource && af in this.__customBookSource[bsid]){
              return promise.then(result => this.__customBookSource[bsid][af].call(self, result, arguments));
            }
          }
          return promise;
        };
      });

      // init
      return Promise.all(Object.values(this.__customBookSource)
        .map(cm => cm.init && cm.init()));
    }

    // 通过书名字和目录搜索唯一的书籍
    getBook(bsid, bookName, bookAuthor){
      utils.log(`BookSourceManager: Get book "${bookName}" from ${bsid}`);

      if(!bsid || !bookName || !(bsid in this.__sources))
        return Promise.reject(401);

      // 通过当前书名和作者名搜索添加源
      return this.searchBook(bsid, bookName)
        .then(books => {
          const book = books.find(e => e.name == bookName && e.author == bookAuthor );
          return book ? book : Promise.reject(404);
        });
    }


    // 全网搜索
    // * options
    // *   filterSameResult
    searchBookInAllBookSource(keyword, {filterSameResult=true}={}){

      utils.log(`BookSourceManager: Search Book in all booksource "${keyword}"`);

      let result = {};
      const errorList = [];
      const allBsids = this.getSourcesKeysByMainSourceWeight();
      const tasks = allBsids.map(bsid =>
        // 单书源搜索
        this.searchBook(bsid, keyword)
          .then(books => {
            result[bsid] = books;
          })
          .catch(error => {
            errorList.push(error);
          })
      );

      function handleResult(){
        // 处理结果
        let finalResult = [];

        for(let bsid of allBsids){
          let books = result[bsid];
          if(!books)break;
          for(let b of books){
            if(filterSameResult){
              // 过滤相同的结果
              if(!finalResult.find(e => Book.equal(e, b)))
                finalResult.push(b);
            }
            else
              finalResult.push(b);
          }
        }

        if(finalResult.length === 0 && errorList.length > 0)
        {
          let re = utils.arrayCount(errorList);
          throw(re[0][0]);
        }

        // 合并结果
        return finalResult;
      }

      return Promise.all(tasks)
        .then(handleResult);
    }

    // 从获取的数据中提取 Book
    __createBook(bs, m){

      m.cover = m.coverImg;

      const book = LittleCrawler.cloneObjectValues(new Book(this), m);
      const bss = LittleCrawler.cloneObjectValues(new BookSource(book, this, bs.id, bs.contentSourceWeight), m);
      book.sources = {}; // 内容来源
      if(bss.lastestChapter)
        bss.lastestChapter = bss.lastestChapter.replace(/^最新更新\s+/, '');  // 最新的章节

      bss.__searched = true;
      book.sources[bs.id] = bss;

      book.mainSourceId = bs.id;  // 主要来源
      return book;
    }

    // 搜索书籍
    searchBook(bsid, keyword){

      utils.log(`BookSourceManager: Search Book "${keyword}" from ${bsid}`);

      const self = this;
      const bs = this.__sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      return this.__lc.get(bs.search, {keyword: keyword})
        .then(getBooks);

      function getBooks(data){

        const books = [];

        for(let m of data){
          m.author = m.author || "";
          if(!checkBook(m))
            continue;
          books.push(self.__createBook(bs, m));
        }
        return books;
      }

      function checkBook(book){
        // 筛选搜索结果
        let name = book.name.toLowerCase();
        let author = book.author.toLowerCase();
        let keywords = keyword.toLowerCase().split(/ +/);
        for(let kw of keywords){
          if(kw.includes(name) || kw.includes(author) ||
             name.includes(kw) || author.includes(kw))
            return true;
        }
        return false;
      }
    }

    // 使用详情页链接刷新书籍信息
    getBookInfo(bsid, dict){

      utils.log(`BookSourceManager: Get Book Info from ${bsid}`);

      const bs = this.__sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      return this.__lc.get(bs.detail, dict)
        .then(m => {
          m.bookid = dict.bookid;
          m.catalogLink = dict.catalogLink;
          m.detailLink = dict.detailLink;
          let book = this.__createBook(bs, m);
          return book;
        });
    }

    // 获取最新章节
    getLastestChapter(bsid, dict){
      utils.log(`BookSourceManager: Get Lastest Chapter from ${bsid}"`);

      const bsm = this.__sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");

      return this.__lc.get(bsm.detail, dict)
        .then(data => {
          return data.lastestChapter.replace(/^最新更新\s+/, '');
        });
    }

    // 从某个网页获取目录链接
    getBookCatalogLink(bsid, dict){

      utils.log(`BookSourceManager: Get Book Catalog Link from ${bsid}"`);

      const bs = this.__sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      if(!bs.catalogLink)
        return Promise.resolve(null);

      return this.__lc.get(bs.catalogLink, dict);
    }


    // 获取书籍目录
    getBookCatalog(bsid, dict){

      utils.log(`BookSourceManager: Refresh Catalog from ${bsid}`);

      const bsm = this.__sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");

      return this.__lc.get(bsm.catalog, dict)
        .then(data => {
          if(bsm.catalog.hasVolume)
            data = data
              .map(v => v.chapters.map(c => (c.volume = v.name, c)))
              .reduce((s,e) => s.concat(e), []);
          return data.map(c => LittleCrawler.cloneObjectValues(new Chapter(), c));
        });
    }

    // 从网络上获取章节内容
    getChapter(bsid, dict={}){

      utils.log(`BookSourceManager: Load Chpater content from ${bsid}`);

      if(!dict.link && !dict.cid) return Promise.reject(206);

      const bsm = this.__sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");

      return this.__lc.get(bsm.chapter, dict)
        .then(data => {
          const c = new Chapter();
          if(!data.contentHTML.match(/<\/?\w+.*?>/i))// 不是 HTML 文本
            c.content = LittleCrawler.text2html(data.contentHTML);
          else
            c.content = LittleCrawler.clearHtml(data.contentHTML);
          if(!c.content) return Promise.reject(206);

          c.title = data.title ? data.title : dict.title;
          c.cid = data.cid ? data.cid : dict.cid;
          if(!c.cid && dict.link) c.link = dict.link;

          return c;
        });
    }



    // 该源的目录是否有卷
    hasVolume(bsid){
      const bs = this.__sources[bsid];
      if(!bs) throw new Error("Illegal booksource!");
      return bs.catalog.hasVolume;
    }

    // 获取原网页
    getOfficialURLs(bsid, dict, key){
      utils.log(`BookSourceManager: Get Book Detail Link from ${bsid}"`);

      const bs = this.__sources[bsid];
      if(!bs) throw new Error("Illegal booksource!");

      let config = bs.officialurls;
      if(!config) return null;
      if(key && config[key])
        return LittleCrawler.format(config[key], dict);
      if(!key){
        let result = {};
        for(let key in config)
          result[key] = LittleCrawler.format(config[key], dict);
      }
      return null;
    }

    // 获取书籍的 DetailLink
    getBookDetailLink(bsid, dict){
      utils.log(`BookSourceManager: Get Book Detail Link from ${bsid}"`);

      const bs = this.__sources[bsid];
      if(!bs) throw new Error("Illegal booksource!");

      return this.__lc.getLink(bs.detail.request, dict);
    }

    // 获取书籍的章节链接
    getChapterLink(bsid, dict={}){
      utils.log(`BookSourceManager: Get Chpater link from ${bsid}`);

      if(!dict.link && !dict.cid) throw new Error(206);

      const bsm = this.__sources[bsid];
      if(!bsm) throw new Error("Illegal booksource!");

      return this.__lc.getLink(bsm.chapter.request, dict);
    }

    // 按主源权重从大到小排序的数组
    getSourcesKeysByMainSourceWeight(bsid){
      let sources = bsid ? this.getBookSourcesBySameType(bsid) : this.__sources;
      let key = "mainSourceWeight";
      return Object.entries(sources).sort((e1, e2) => - e1[1][key] + e2[1][key]).map(e => e[0]); // 按主源权重从大到小排序的数组
    }

    // 获取和指定的 bsid 相同 type 的所有 sources
    getBookSourcesBySameType(bsid){
      if(!bsid || !(bsid in this.__sources)) return null;
      let result = {};
      let type = this.__sources[bsid].type;
      for(let key in this.__sources){
        if(this.__sources[key].type == type)
          result[key] = this.__sources[key];
      }
      return result;
    }

    // 获取指定的 booksource
    getBookSource(bsid){
      try{
        return this.__sources[bsid];
      }
      catch(e){
        return {};
      }
    }

    // 获取内容源的类型
    getBookSourceTypeName(bsid){
      try{
        let typeName = {
          "comics": "漫画",
          "novel": "小说"
        }
        return typeName[this.__sources[bsid].type];
      }
      catch(e){
        return "";
      }
    }

  }

  return BookSourceManager;
}));

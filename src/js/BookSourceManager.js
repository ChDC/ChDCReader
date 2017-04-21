define(['co', "util", "Spider", "translate", "Book", "BookSource", "Chapter", "CustomBookSource"], function(co, util, Spider, translate, Book, BookSource, Chapter, customBookSource) {
  "use strict"

  // **** BookSourceManager *****
  class BookSourceManager{

    constructor(configFileOrConfig){

      this.sources;
      this.spider = new Spider();

      this.loadConfig(configFileOrConfig);
      this.addCustomSourceFeature();
    }

    init(){
      return Promise.all(Object.values(customBookSource)
        .map(cm => cm.init && cm.init()));
    }

    // 加载配置
    loadConfig(configFileOrConfig){
      if(configFileOrConfig && typeof configFileOrConfig == 'string'){
        return util.getJSON(configFileOrConfig)
          .then(data => {
            this.sources = data;
          })
          .then(() => this.init())
          .then(() => this.sources);
      }
      else if(configFileOrConfig){
        this.sources = configFileOrConfig;
      }
      return this.init()
          .then(() => this.sources);
    }

    // 把拦截函数功能添加到类中
    // 可以设置前置拦截器、方法拦截器和后置拦截器
    addCustomSourceFeature(){
      let customFunctionList = ["getBook", "searchBook",
              "getBookInfo", "getChapter",
              "getBookCatalog", "getBookCatalogLink", "getLastestChapter"];
      for(let cf of customFunctionList){
        let oldFunction = this[cf];
        let self = this;
        this[cf] = function(bsid){ // 此处必须用 function，不能用箭头函数

          // 在调用系统函数之前，用自定义的 before* 函数处理参数
          // 如 beforegetBook 或 beforeGetBook 处理 getBook 函数
          let beforeFunctions = [`before${cf}`, `before${cf[0].toUpperCase()}${cf.slice(1)}`];
          let args = arguments;
          for(let bf of beforeFunctions){
            if(bsid in customBookSource && bf in customBookSource[bsid]){
              args = customBookSource[bsid][bf].apply(self, args);
              break;
            }
          }

          let promise;
          // 优先调用自定义的同名函数，如果 getBook
          if(bsid in customBookSource && cf in customBookSource[bsid])
            promise = customBookSource[bsid][cf].apply(self, args);

          else
            // 调用系统函数
            promise = oldFunction.apply(self, args);

          // 在调用完系统函数之后，用自定义的 after* 函数处理结果
          // 如 aftergetBook 或 afterGetBook 处理 getBook 函数
          let afterFunctions = [`after${cf}`, `after${cf[0].toUpperCase()}${cf.slice(1)}`];

          for(let af of afterFunctions){
            if(bsid in customBookSource && af in customBookSource[bsid]){
              return promise.then(result => customBookSource[bsid][af].call(self, result));
            }
          }
          return promise;
        };
      }
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
        });
    }

    // 全网搜索
    // * options
    // *   filterSameResult
    searchBookInAllBookSource(keyword, {filterSameResult=true}={}){

      util.log(`BookSourceManager: Search Book in all booksource "${keyword}"`);

      let result = {};
      const errorList = [];
      const allBsids = this.getSourcesKeysByMainSourceWeight();
      const tasks = [];

      for(const bsid of allBsids)
      {
        // 单书源搜索
        tasks.push(this.searchBook(bsid, keyword)
          .then(books => {
            result[bsid] = books;
          })
          .catch(error => {
            errorList.push(error);
          }));
      }

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
          let re = util.arrayCount(errorList);
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

      const book = Book.createBook(m, this);
      book.sources = {}; // 内容来源
      const bss = new BookSource(book, this, bs.id, bs.contentSourceWeight);

      if("bookid" in m) bss.bookid = m.bookid;
      if("detailLink" in m) bss.detailLink = m.detailLink;
      if("catalogLink" in m) bss.catalogLink = m.catalogLink;
      if(m.lastestChapter){
        bss.lastestChapter = m.lastestChapter.replace(/^最新更新\s+/, '');  // 最新的章节
      }

      bss.searched = true;
      book.sources[bs.id] = bss;

      book.mainSourceId = bs.id;  // 主要来源
      return book;
    }

    // 搜索书籍
    searchBook(bsid, keyword){

      util.log(`BookSourceManager: Search Book "${keyword}" from ${bsid}`);

      const self = this;
      const bs = this.sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      return this.spider.get(bs.search, {keyword: keyword})
        .then(getBooks);

      function getBooks(data){

        const books = [];

        for(let m of data){
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

      util.log(`BookSourceManager: Get Book Info from ${bsid}`);

      const bs = this.sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      return this.spider.get(bs.detail, dict)
        .then(m => {
          m.bookid = dict.bookid;
          let book = this.__createBook(bs, m);
          return book;
        });
    }

    // 获取最新章节
    getLastestChapter(bsid, dict){
      util.log(`BookSourceManager: Get Lastest Chapter from ${bsid}"`);

      const bsm = this.sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");

      return this.spider.get(bsm.detail, dict)
        .then(data => {
          return data.lastestChapter.replace(/^最新更新\s+/, '');
        });
    }

    // 从某个网页获取目录链接
    getBookCatalogLink(bsid, dict){

      util.log(`BookSourceManager: Get Book Catalog Link from ${bsid}"`);

      const bs = this.sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      if(!bs.catalogLink)
        return Promise.resolve(null);

      return this.spider.get(bs.catalogLink, dict);
    }

    // 获取书籍目录
    getBookCatalog(bsid, dict){

      util.log(`BookSourceManager: Refresh Catalog from ${bsid}`);

      const bsm = this.sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");

      return this.spider.get(bsm.catalog, dict)
        .then(data => {

          const catalog = [];
          for(let c of data){
            const chapter = new Chapter();
            chapter.title = c.title;
            chapter.link = c.link;
            catalog.push(chapter);
          }

          return catalog;
        });
    }

    // 从网络上获取章节内容
    getChapter(bsid, chapter={}){

      util.log(`BookSourceManager: Load Chpater content from ${bsid} with link "${chapter.link}"`);

      if(!chapter.link) return Promise.reject(206);

      const bsm = this.sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");


      return this.spider.get(bsm.chapter, {url: chapter.link, chapterLink: chapter.link})
        .then(data => {
          const c = new Chapter();
          c.content = this.spider.clearHtml(data.contentHTML);

          if(!c.content){
            // 没有章节内容就返回错误
            return Promise.reject(206);
          }
          c.link = chapter.link;
          c.title = data.title;

          return c;
        });
    }

    // 按主源权重从大到小排序的数组
    getSourcesKeysByMainSourceWeight(){
      let object = this.sources;
      let key = "mainSourceWeight";
      return Object.entries(object).sort((e1, e2) => - e1[1][key] + e2[1][key]).map(e => e[0]); // 按主源权重从大到小排序的数组
    }

    // 获取内容源的名字
    getBookSourceName(bsid){
      try{
        return this.sources[bsid].name;
      }
      catch(e){
        return "";
      }
    }

    // 获取内容源的类型
    getBookSourceType(bsid){
      try{
        return this.sources[bsid].type;
      }
      catch(e){
        return "";
      }
    }

    // 获取内容源的类型
    getBookSourceTypeName(bsid){
      try{
        let typeName = {
          "comics": "漫画",
          "novel": "小说"
        }
        return typeName[this.sources[bsid].type];
      }
      catch(e){
        return "";
      }
    }

  }

  return BookSourceManager;
});

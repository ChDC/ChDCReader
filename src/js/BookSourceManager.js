define(['co', "util", "Spider", "Book", "BookSource", "Chapter"], function(co, util, Spider, Book, BookSource, Chapter) {
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
      return Promise.all(Object.values(this.CustomSourceFunction)
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
            if(bsid in self.CustomSourceFunction && bf in self.CustomSourceFunction[bsid]){
              args = self.CustomSourceFunction[bsid][bf].apply(self, args);
              break;
            }
          }

          let promise;
          // 优先调用自定义的同名函数，如果 getBook
          if(bsid in self.CustomSourceFunction && cf in self.CustomSourceFunction[bsid])
            promise = self.CustomSourceFunction[bsid][cf].apply(self, args);

          else
            // 调用系统函数
            promise = oldFunction.apply(self, args);

          // 在调用完系统函数之后，用自定义的 after* 函数处理结果
          // 如 aftergetBook 或 afterGetBook 处理 getBook 函数
          let afterFunctions = [`after${cf}`, `after${cf[0].toUpperCase()}${cf.slice(1)}`];

          for(let af of afterFunctions){
            if(bsid in self.CustomSourceFunction && af in self.CustomSourceFunction[bsid]){
              return promise.then(result => self.CustomSourceFunction[bsid][af].call(self, result));
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
          m.cover = m.coverImg;
          const book = Book.createBook(m, self);
          if(!checkBook(book))
            continue;

          book.sources = {}; // 内容来源

          const bss = new BookSource(book, self, bsid, bs.contentSourceWeight);

          if(m.bookid) bss.bookid = m.bookid;

          bss.detailLink = m.detailLink;
          bss.catalogLink = m.catalogLink;
          if(m.lastestChapter){
            bss.lastestChapter = m.lastestChapter.replace(/^最新更新\s+/, '');  // 最新的章节
          }

          bss.searched = true;
          book.sources[bsid] = bss;

          book.mainSourceId = bsid;  // 主要来源
          books.push(book);
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
    getBookInfo(bsid, detailLink){

      util.log(`BookSourceManager: Get Book Info from ${bsid} with link "${detailLink}"`);

      const bs = this.sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      return this.spider.get(bs.detail, {url: detailLink, detailLink: detailLink})
        .then(data => {
          data.cover = data.coverImg;
          delete data.coverImg;
          return data;
        });
    }

    // 获取最新章节
    getLastestChapter(bsid, detailLink){
      util.log(`BookSourceManager: Get Lastest Chapter from ${bsid} with link "${detailLink}"`);

      const bsm = this.sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");

      return this.spider.get(bsm.detail, {url: detailLink, detailLink: detailLink})
        .then(data => {
          return data.lastestChapter.replace(/^最新更新\s+/, '');
        });
    }

    // 从某个网页获取目录链接
    getBookCatalogLink(bsid, locals){

      util.log(`BookSourceManager: Get Book Catalog Link from ${bsid}"`);

      const bs = this.sources[bsid];
      if(!bs) return Promise.reject("Illegal booksource!");

      if(!bs.catalogLink)
        return Promise.resolve(null);

      return this.spider.get(bs.catalogLink, locals);
    }

    // 获取书籍目录
    getBookCatalog(bsid, locals){

      util.log(`BookSourceManager: Refresh Catalog from ${bsid}`);

      const bsm = this.sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");

      return this.spider.get(bsm.catalog, locals)
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

  }

  // 定义一个用于存放自定义获取信息的钩子的集合
  BookSourceManager.prototype.CustomSourceFunction = {

    qidian: {
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
      },
      init(){
        return this.getCSRToken();
      },
      // beforeGetBook(){
      //   return arguments;
      // },
      // getBook(){
      //   debugger;
      // },
      // aftergetBook(book){
      //   return book;
      // }
    },

    // comico: {
    //   getBookCatalog(bsid, locals){

    //     let self = this;

    //     return co(function*(){
    //       let bookid = locals.bookid;

    //       let data = yield self.getBookInfo(bsid, locals.detailLink);
    //       let lc = data.lastestChapterLink;
    //       if(!lc) return null;
    //       // 获取最新章节，然后从序号中获取总章节数目
    //       let maxCount = data.lastestChapterLink.match(/articleNo=(\d+)/)[1];

    //       // 0 10 ...
    //       let n = Math.ceil(maxCount / 10);
    //       let startIndexs = (new Array(n)).fill(0).map((e,i) => i*10)

    //       // 获取所有章节列表
    //       let result = yield Promise.all(startIndexs.map(si => getPartCatalog(si, locals)));
    //       // 将结果按 linkid 排序
    //       result.sort((e1, e2) => e1[0].linkid - e2[0].linkid);
    //       // 合并结果并返回
    //       return result.reduce((s, e) => s.concat(e), []);

    //       // 获取每一部分章节
    //       function getPartCatalog(startIndex, locals){
    //         let catalogLink = `http://www.comico.com.tw/api/article_list.nhn?titleNo=${locals.bookid}&startIndex=${startIndex}`;
    //         let dict = Object.assign({}, locals, {url: catalogLink});
    //         return self.spider.get(self.sources[bsid].catalog, dict);
    //       }
    //     });
    //   }
    // }
    u17: {
      getChapter(bsid, chapter={}){

        util.log(`BookSourceManager: Load Chpater content from ${bsid} with link "${chapter.link}"`);

        if(!chapter.link) return Promise.reject(206);

        return util.get(chapter.link)
          .then(html => {
            if(!html) return null;
            let regex = /<script>[^<]*image_list: \$\.evalJSON\('([^<]*)'\),\s*image_pages:[^<]*<\/script>/i;
            html = html.match(regex);
            if(!html) return null;
            let json = JSON.parse(html[1]);
            let keys = Object.keys(json).sort((e1, e2) => parseInt(e1) - parseInt(e2));
            // 得到所有图片的链接
            let imgs = keys.map(e => atob(json[e].src));
            // 组合成 img 标签
            chapter.content = imgs.map(img => `<img src="${img}">`).join('\n');
            return chapter;
          });
      }
    }
  };

  return BookSourceManager;
});

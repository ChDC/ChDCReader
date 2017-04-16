define(['co', "util", "Spider", "Book", "BookSource", "Chapter"], function(co, util, Spider, Book, BookSource, Chapter) {
  "use strict"

  // **** BookSourceManager *****
  class BookSourceManager{

    constructor(configFileOrConfig){

      this.sources = undefined;
      this.spider = new Spider();

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
          if(m.lastestChapter){
            bss.lastestChapter = m.lastestChapter.replace(/^最新更新\s+/, '');  // 最新的章节
          }
          // bss.catalogLink = computeCatalogLink(bss);

          bss.searched = true;
          book.sources[bsid] = bss;

          book.mainSourceId = bsid;  // 主要来源
          books.push(book);
        }
        return books;
      }

      function checkBook(book){
        // 筛选搜索结果
        let name = book.name;
        let author = book.author;
        let keywords = keyword.split(/ +/);
        for(let kw of keywords){
          if(kw.indexOf(name) >= 0 || kw.indexOf(author) >= 0 ||
             name.indexOf(kw) >= 0 || author.indexOf(kw) >= 0)
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

    // 获取目录链接
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
            chapter.title = c.name;
            chapter.link = c.link;
            catalog.push(chapter);
          }

          return catalog;
        });
    }

    // 从网络上获取章节内容
    getChapter(bsid, chapterLink){

      util.log(`BookSourceManager: Load Chpater content from ${bsid} with link "${chapterLink}"`);

      if(!chapterLink) return Promise.reject(206);

      const bsm = this.sources[bsid];
      if(!bsm) return Promise.reject("Illegal booksource!");


      return this.spider.get(bsm.chapter, {url: chapterLink, chapterLink: chapterLink})
        .then(data => {
          const chapter = new Chapter();
          chapter.content = util.html2text(data.contentHTML);

          if(!chapter.content){
            // 没有章节内容就返回错误
            return Promise.reject(206);
          }
          chapter.link = chapterLink;
          chapter.title = data.title;

          return chapter;
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

    init(){
      for(const key in this){
        const value = this[key];
        if(typeof value == 'object' && 'init' in value){
          value.init();
        }
      }
    }

  }


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

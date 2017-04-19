define(['co', "util", "Spider", "translate", "Book", "BookSource", "Chapter"], function(co, util, Spider, translate, Book, BookSource, Chapter) {
  "use strict"

  // 定义一个用于存放自定义获取信息的钩子的集合
  let customBookSource = {

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
    },

    comico: {

      beforeSearchBook(){
        return Array.from(arguments).map(e => util.type(e) =="string"? translate.toTraditionChinese(e) : e);
      },

      afterSearchBook(books){
        return books.map(book => {
          let needTranslateAttributes = ['name', 'author', 'catagory', 'introduce'];
          needTranslateAttributes.forEach(e => {
            book[e] = translate.toSimpleChinese(book[e]);
          });
          let bss = book.sources[book.mainSourceId];
          bss.lastestChapter = translate.toSimpleChinese(bss.lastestChapter);
          return book;
        });
      },

      afterGetBookInfo(book){
        let needTranslateAttributes = ['name', 'author', 'catagory', 'introduce', 'lastestChapter'];
        needTranslateAttributes.forEach(e => {
          book[e] = translate.toSimpleChinese(book[e]);
        });
        return book;
      },

      afterGetChapter(chapter){
        chapter.title = translate.toSimpleChinese(chapter.title);
        return chapter;
      },

      afterGetBookCatalog(catalog){
        return catalog.map(chapter => {
          chapter.title = translate.toSimpleChinese(chapter.title);
          return chapter;
        });
      },

      afterGetLastestChapter(lc){
        return translate.toSimpleChinese(lc);
      },

      // getBookCatalog(bsid, locals){

      //   let self = this;

      //   return co(function*(){
      //     let bookid = locals.bookid;

      //     let data = yield self.getBookInfo(bsid, locals.detailLink);
      //     let lc = data.lastestChapterLink;
      //     if(!lc) return null;
      //     // 获取最新章节，然后从序号中获取总章节数目
      //     let maxCount = data.lastestChapterLink.match(/articleNo=(\d+)/)[1];

      //     // 0 10 ...
      //     let n = Math.ceil(maxCount / 10);
      //     let startIndexs = (new Array(n)).fill(0).map((e,i) => i*10)

      //     // 获取所有章节列表
      //     let result = yield Promise.all(startIndexs.map(si => getPartCatalog(si, locals)));
      //     // 将结果按 linkid 排序
      //     result.sort((e1, e2) => e1[0].linkid - e2[0].linkid);
      //     // 合并结果并返回
      //     return result.reduce((s, e) => s.concat(e), []);

      //     // 获取每一部分章节
      //     function getPartCatalog(startIndex, locals){
      //       let catalogLink = `http://www.comico.com.tw/api/article_list.nhn?titleNo=${locals.bookid}&startIndex=${startIndex}`;
      //       let dict = Object.assign({}, locals, {url: catalogLink});
      //       return self.spider.get(self.sources[bsid].catalog, dict);
      //     }
      //   });
      // }
    },
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

  return customBookSource;
});

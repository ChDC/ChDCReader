define(['co', "util", "Spider", "translate", "Book", "BookSource", "Chapter"], function(co, util, Spider, translate, Book, BookSource, Chapter) {
  "use strict"

  // 定义一个用于存放自定义获取信息的钩子的集合
  let customBookSource = {

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

      // getBookCatalog(bsid, dict){

      //   let self = this;

      //   return co(function*(){
      //     let bookid = dict.bookid;

      //     let data = yield self.getBookInfo(bsid, dict.detailLink);
      //     let lc = data.lastestChapterLink;
      //     if(!lc) return null;
      //     // 获取最新章节，然后从序号中获取总章节数目
      //     let maxCount = data.lastestChapterLink.match(/articleNo=(\d+)/)[1];

      //     // 0 10 ...
      //     let n = Math.ceil(maxCount / 10);
      //     let startIndexs = (new Array(n)).fill(0).map((e,i) => i*10)

      //     // 获取所有章节列表
      //     let result = yield Promise.all(startIndexs.map(si => getPartCatalog(si, dict)));
      //     // 将结果按 linkid 排序
      //     result.sort((e1, e2) => e1[0].linkid - e2[0].linkid);
      //     // 合并结果并返回
      //     return result.reduce((s, e) => s.concat(e), []);

      //     // 获取每一部分章节
      //     function getPartCatalog(startIndex, dict){
      //       let catalogLink = `http://www.comico.com.tw/api/article_list.nhn?titleNo=${dict.bookid}&startIndex=${startIndex}`;
      //       let gatcherDict = Object.assign({}, dict, {url: catalogLink});
      //       return self.spider.get(self.sources[bsid].catalog, gatcherDict);
      //     }
      //   });
      // }
    },

    qq: {
      getChapter(bsid, chapter={}){

        util.log(`BookSourceManager: Load Chpater content from ${bsid} with link "${chapter.link}"`);

        if(!chapter.link) return Promise.reject(206);

        let link = chapter.link;
        let matcher = link.match(/index\/id\/(\d+)\/cid\/(\d+)/i);
        if(!matcher) return Promise.reject(206);
        link = `http://m.ac.qq.com/chapter/index/id/${matcher[1]}/cid/${matcher[2]}?style=plain`;

        return util.get(link)
          .then(html => {
            if(!html) return null;
            html = String(html)
              .replace(/<\!--.*?--\>/g, "")
              .replace(/(^[ \t\r\n]+|[ \t\r\n]+$)/g, "")
              .substring(1);
            let data = JSON.parse(atob(html));
            // 组合成 img 标签
            chapter.content = data.picture.map(e => `<img src="${e.url}">`).join('\n');
            return chapter;
          });
      }
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
    },

    "chuangshi": {
      getChapter(bsid, chapter={}){

        util.log(`BookSourceManager: Load Chpater content from ${bsid} with link "${chapter.link}"`);

        if(!chapter.link) return Promise.reject(206);

        let url = "http://chuangshi.qq.com/index.php/Bookreader/462523/25?lang=zhs";
        debugger;
        return util.cordovaAjax("get", url, {}, 'json',
              { Referer: "http://chuangshi.qq.com/" })
          .then(data => {
            debugger;
            console.log(data);
            let json = JSON.parse(html);
            let content = decryptByBaseCode(json.Content, 30);
          });

        function decryptByBaseCode(text, base) {
            if (!text) return text;
            var arrStr = [],
            arrText = text.split('\\');
            for (var i = 1,
            len = arrText.length; i < len; i++) {
                arrStr.push(String.fromCharCode(parseInt(arrText[i], base)));
            }
            return arrStr.join('');
        }
      }
    }
  };

  return customBookSource;
});

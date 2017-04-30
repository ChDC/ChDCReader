define(['co', "utils", "Spider", "translate", "Book", "BookSource", "Chapter"], function(co, utils, Spider, translate, Book, BookSource, Chapter) {
  "use strict"

  // 定义一个用于存放自定义获取信息的钩子的集合
  let customBookSource = {

    "comico": {

      beforeSearchBook(){
        return Promise.resolve(Array.from(arguments).map(e => utils.type(e) =="string"? translate.toTraditionChinese(e) : e));
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
    },

    "qqac": {
      getChapter(bsid, dict={}){

        utils.log(`BookSourceManager: Load Chpater content from ${bsid}"`);

        if(!dict.link && !dict.cid) return Promise.reject(206);

        const bsm = this.__sources[bsid];
        if(!bsm) return Promise.reject("Illegal booksource!");

        let link = this.__spider.format(bsm.chapter.request.url, dict);

        return utils.get(link)
          .then(html => {
            if(!html) return null;
            html = String(html)
              .replace(/<\!--.*?--\>/g, "")
              .replace(/(^[ \t\r\n]+|[ \t\r\n]+$)/g, "")
              .substring(1);
            let data = JSON.parse(atob(html));
            let content = data.picture.map(e => `<img src="${e.url}">`).join('\n');

            const c = new Chapter();
            c.content = content;
            if(!c.content) return Promise.reject(206);

            c.cid = dict.cid;
            c.title = dict.title;
            if(!c.cid && link) c.link = link;
            return c;
          });
      }
    },

    "u17": {
      getChapter(bsid, dict={}){


        utils.log(`BookSourceManager: Load Chpater content from ${bsid}"`);

        if(!dict.link && !dict.cid) return Promise.reject(206);

        const bsm = this.__sources[bsid];
        if(!bsm) return Promise.reject("Illegal booksource!");

        let link = this.__spider.format(bsm.chapter.request.url, dict);

        return utils.get(link)
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
            let content = imgs.map(img => `<img src="${img}">`).join('\n');

            const c = new Chapter();
            c.content = content;
            if(!c.content) return Promise.reject(206);

            c.cid = dict.cid;
            c.title = dict.title;
            if(!c.cid && dict.link) c.link = dict.link;
            return c;
          });
      }
    },

    "chuangshi": {
      getChapter(bsid, dict={}){

        utils.log(`BookSourceManager: Load Chpater content from ${bsid}"`);

        if(!dict.link && !dict.cid) return Promise.reject(206);

        const bsm = this.__sources[bsid];
        if(!bsm) return Promise.reject("Illegal booksource!");

        let link = this.__spider.format(bsm.chapter.request.url, dict);

        return utils.cordovaAjax("get", link, {}, 'json',
              {
                "Referer": "http://chuangshi.qq.com/",
                "X-Requested-With": "XMLHttpRequest"
              })
          .then(json => {
            let content = decryptByBaseCode(json.Content, 30);
            const bsm = this.__sources[bsid];
            let data = this.__spider.parse(content, "html", bsm.chapter.response, link, {});
            content = this.__spider.clearHtml(data.contentHTML);

            const c = new Chapter();
            c.content = content;
            if(!c.content) return Promise.reject(206);

            c.cid = dict.cid;
            c.title = dict.title;
            if(!c.cid && link) c.link = link;
            return c;
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
    },

    "sfnovel": {
      afterGetChapter(chapter){
        if(chapter.content)
          chapter.content = chapter.content.replace(/^\s*(.*?)<p/i, "<p>$1</p><p");
        return chapter;
      }
    },

    "qqbook": {
      getBookCatalog(bsid, dict){

        utils.log(`BookSourceManager: Get Book Catalog Link from ${bsid}"`);

        const bs = this.__sources[bsid];
        if(!bs) return Promise.reject("Illegal booksource!");

        let linkTmp = bs.catalog.request.url;

        let self = this;
        return co(function*(){
          let catalog = [];
          // 获取章节总数和免费章节数目
          // maxfreechapter
          let link = self.__spider.format(linkTmp, {bookid: dict.bookid, pageNo: 1});
          let json = yield utils.getJSON(link);

          let total = json.total;
          dict.maxfreechapter = json.book.maxfreechapter;
          catalog[0] = self.__spider.parse(json, "json", bs.catalog.response, link, dict);

          let pageNos = (new Array(Math.ceil(total / 100) - 1)).fill(0).map((e,i) => i+2)

          // 获取所有章节列表
          yield Promise.all(pageNos.map(pageNo => {
            let gatcherDict = Object.assign({pageNo: pageNo}, dict);
            return self.__spider.get(bs.catalog, gatcherDict)
              .then(cs => {
                catalog[pageNo - 1] = cs;
              });
          }));
          // 合并结果并返回
          return catalog.reduce((s, e) => s.concat(e), []);
        });
      }
    },

    "daizhuzai": {
      beforeGetChapter(){
        let args = arguments;
        let link = args[1].link;
        if(link.match(/novelsearch/))
          return Promise.resolve(args);
        return utils.get(link)
          .then(data => {
            let url = data.match(/'(\/novelsearch\/reader\/transcode\/siteid\/\d+\/url\/.*?)'/)[1];
            args[1].link = this.__spider.fixurl(url, link);
            return args;
          });

      },
    }
  };

  return customBookSource;
});

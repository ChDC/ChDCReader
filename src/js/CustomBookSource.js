;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["customBookSource"] = factory(co, utils, LittleCrawler, translate, Book, BookSource, Chapter);
}(['co', "utils", "LittleCrawler", "translate", "Book", "BookSource", "Chapter"], function(co, utils, LittleCrawler, translate, Book, BookSource, Chapter) {
  "use strict"

  // 定义一个用于存放自定义获取信息的钩子的集合
  let CBS = {
    "common": {
      // 用于存放一些公用的方法

      getEncryptedData(html){
        // 获取加密数据
        let evalCode = html.match(/\beval(\(.*return p;?}\(.*?\)\))/i);
        if(!evalCode) return null;
        let data = utils.eval(evalCode[1]);
        data = data.match(/{.*}/);
        if(!data) return null;
        data = JSON.parse(data[0].replace(/'/g, '"'));
        return data;

      },

      getImages(html, key, host){
        let data = CBS.common.getEncryptedData(html);
        data = data[key].map(e => `${host}${e}`);
        if(data.length <= 0) return null;
        return data.map(e => `<img src="${e}">`).join('\n');
      },

      getComicsChapter(bsid, dict={}, getImgs){

        utils.log(`BookSourceManager: Load Chpater content from ${bsid}`);

        let link = this.getChapterLink(bsid, dict);
        const bsm = this.__sources[bsid];

        return utils.get(link)
          .then(html => {
            let content = getImgs(html);

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

    "comico": {
      // 把网站中的繁体中文转换为简体中文
      beforeSearchBook(){
        return Promise.resolve(Array.from(arguments).map(e => utils.type(e) =="string"? translate.toTraditionChinese(e) : e));
      },

      // 把网站中的繁体中文转换为简体中文
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

      // 把网站中的繁体中文转换为简体中文
      afterGetBookInfo(book){
        let needTranslateAttributes = ['name', 'author', 'catagory', 'introduce', 'lastestChapter'];
        needTranslateAttributes.forEach(e => {
          book[e] = translate.toSimpleChinese(book[e]);
        });
        return book;
      },

      // 把网站中的繁体中文转换为简体中文
      afterGetChapter(chapter){
        chapter.title = translate.toSimpleChinese(chapter.title);
        return chapter;
      },

      // 把网站中的繁体中文转换为简体中文
      afterGetBookCatalog(catalog){
        return catalog.map(chapter => {
          chapter.title = translate.toSimpleChinese(chapter.title);
          return chapter;
        });
      },

      // 把网站中的繁体中文转换为简体中文
      afterGetLastestChapter(lc){
        return translate.toSimpleChinese(lc);
      },
    },

    "qqac": {
      // 腾讯动漫的解码规则是把加密的字符串从索引位1开始取
      getChapter(bsid, dict={}){

        utils.log(`BookSourceManager: Load Chpater content from ${bsid}`);

        let link = this.getChapterLink(bsid, dict);
        const bsm = this.__sources[bsid];

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

      // 有妖气的漫画图片数据放在 HTML 中的 script 标签内
      getChapter(bsid, dict={}){

        utils.log(`BookSourceManager: Load Chpater content from ${bsid}`);

        let link = this.getChapterLink(bsid, dict);
        const bsm = this.__sources[bsid];

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

      // 创世中文网的章节内容需要按一定的方式解码
      getChapter(bsid, dict={}){

        utils.log(`BookSourceManager: Load Chpater content from ${bsid}`);

        let link = this.getChapterLink(bsid, dict);
        const bsm = this.__sources[bsid];

        return LittleCrawler.cordovaAjax("get", link, {}, 'json',
              {
                "Referer": "http://chuangshi.qq.com/",
                "X-Requested-With": "XMLHttpRequest"
              })
          .then(json => {
            let content = decryptByBaseCode(json.Content, 30);
            const bsm = this.__sources[bsid];
            let data = this.__lc.parse(content, "html", bsm.chapter.response, link, {});
            content = LittleCrawler.clearHtml(data.contentHTML);

            const c = new Chapter();
            c.content = content;
            if(!c.content) return Promise.reject(206);

            c.cid = dict.cid;
            c.title = dict.title;
            if(!c.cid && link) c.link = link;
            return c;
          });

        // 解码函数
        function decryptByBaseCode(text, base) {
            if (!text) return text;
            let arrStr = [],
            arrText = text.split('\\');
            for (let i = 1,
            len = arrText.length; i < len; i++) {
                arrStr.push(String.fromCharCode(parseInt(arrText[i], base)));
            }
            return arrStr.join('');
        }
      }
    },

    "sfnovel": {

      // 将每个章节的卷中的书名去掉
      afterGetBookCatalog(catalog, args){
        let book = args[1].book;
        if(!book || !book.name) return catalog;
        catalog.forEach(c => c.volume = c.volume.replace(`【${book.name}】`, "").trim());
        return catalog;
      },

      // sfnovel 的章节内容是用换行符换行的
      afterGetChapter(chapter){
        if(chapter.content)
          chapter.content = chapter.content.replace(/^\s*(.*?)<p/i, "<p>$1</p><p");
        return chapter;
      }
    },

    "qqbook": {

      // 由于腾讯图书的章节列表是分页的，所以要把所有页面的数据整合到一起
      getBookCatalog(bsid, dict){

        utils.log(`BookSourceManager: Get Book Catalog Link from ${bsid}"`);

        const bs = this.__sources[bsid];
        if(!bs) return Promise.reject("Illegal booksource!");

        let linkTmp = bs.catalog.request.url;

        let self = this;
        return co(function*(){
          let result = [];
          // 获取章节总数和免费章节数目
          // maxfreechapter
          let link = LittleCrawler.format(linkTmp, {bookid: dict.bookid, pageNo: 1});
          let json = yield utils.getJSON(link);

          let total = json.total;
          dict.maxfreechapter = json.book.maxfreechapter;
          result[0] = self.__lc.parse(json, "json", bs.catalog.response, link, dict);

          let pageNos = (new Array(Math.ceil(total / 100) - 1)).fill(0).map((e,i) => i+2)

          // 获取所有章节列表
          yield Promise.all(pageNos.map(pageNo => {
            let gatcherDict = Object.assign({pageNo: pageNo}, dict);
            return self.__lc.get(bs.catalog, gatcherDict)
              .then(cs => {
                result[pageNo - 1] = cs;
              });
          }));
          // 合并结果并返回
          result = result.reduce((s, e) => s.concat(e), []);
          return result.map(c => LittleCrawler.cloneObjectValues(new Chapter(), c));
        });
      }
    },

    "daizhuzai": {

      // daizhuzai 网是从其他网站中获取数据的，它的链接在 HTML 的 script 中
      beforeGetChapter(){
        let args = arguments;
        let link = args[1].link;
        if(link.match(/novelsearch/))
          return Promise.resolve(args);
        return utils.get(link)
          .then(data => {
            let url = data.match(/'(\/novelsearch\/reader\/transcode\/siteid\/\d+\/url\/.*?)'/)[1];
            args[1].link = LittleCrawler.fixurl(url, link);
            return args;
          });
      },
    },

    // "chuiyao": {

    //   // 章节内容数据在 script 标签中
    //   getChapter(bsid, dict={}, filterBookId=true){

    //     utils.log(`BookSourceManager: Load Chpater content from ${bsid}`);

    //     let link = this.getChapterLink(bsid, dict);
    //     const bsm = this.__sources[bsid];

    //     return utils.get(link)
    //       .then(html => {
    //         let content = getImgs(html);

    //         const c = new Chapter();
    //         c.content = content;
    //         if(!c.content) return Promise.reject(206);

    //         c.cid = dict.cid;
    //         c.title = dict.title;
    //         if(!c.cid && link) c.link = link;
    //         return c;
    //       });

    //     function getImgs(html) {
    //       let data = html.match(/var qTcms_S_m_murl_e = "(.*?)"/i);
    //       if(!data)
    //         return null;
    //       data = atob(data[1]);
    //       if(!data) return null;
    //       data = data.split("$qingtiandy$");
    //       if(filterBookId)
    //         data = data.filter(e => e.includes(dict.bookid));
    //       if(data.length <= 0)
    //         return null;
    //       return data.map(e => `<img src="${e}">`).join('\n');
    //     }
    //   }
    // },

    // "dangniao": {

    //   // 和 吹妖 一样
    //   getChapter(bsid, dict={}){
    //     return CBS["chuiyao"].getChapter.apply(this, ["dangniao", dict, false]);
    //   }
    // },

    "omanhua": {

      beforeSearchBook(){
        let keyword = arguments[1];
        let letter = keyword ? translate.getFirstPY(keyword) : "A";
        arguments[1] = {keyword: keyword, litter: letter};
        return Promise.resolve(arguments);
      },

      getChapter(bsid, dict={}){
        return CBS.common.getComicsChapter.bind(this)(bsid, dict,
         html => {
          if(html.match('为维护版权方权益或违反国家法律法规本站不提供阅读'))
            return null;
          let data = CBS.common.getEncryptedData(html);
          if(!data) return null;

          data = data.files.map(e => `http://pic.fxdm.cc${data.path}${e}`);
          if(data.length <= 0) return null;
          return data.map(e => `<img src="${e}">`).join('\n');
         });
      }
    },

    "2manhua": {
      getChapter(bsid, dict={}){
        return CBS.common.getComicsChapter.bind(this)(bsid, dict,
         html => CBS.common.getImages(html, "fs", "http://tupianku.333dm.com"));
      }
    },

    "57mh": {
      getChapter(bsid, dict={}){
        return CBS.common.getComicsChapter.bind(this)(bsid, dict,
         html => CBS.common.getImages(html, "fs", "http://tupianku.333dm.com"));
      }
    }
  };

  return CBS;
}));

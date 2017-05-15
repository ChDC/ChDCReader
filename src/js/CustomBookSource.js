;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["customBookSource"] = factory.apply(undefined, deps.map(e => window[e]));
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
        return utils.eval(evalCode[1]);
      },

      getImages(html, key, host, filter){
        let data = CBS.common.getEncryptedData(html);

        let matcher = data.match(/{.*}/);
        if(!matcher) return null;
        data = JSON.parse(matcher[0].replace(/'/g, '"'));

        if(key) data = data[key];
        data = data.map(e => `${host}${e}`);
        if(data.length <= 0) return null;
        if(filter){
          let filteredData = data.filter(filter);
          if(filteredData.length > 3)
            data = filteredData;
        }
        return data.map(e => `<img src="${e}">`).join('\n');
      },
    },

    "qqac": {
      // 腾讯动漫的解码规则是把加密的字符串从索引位1开始取
      getChapterContent(bsid, dict={}){

        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => {
            if(!html) return null;
            html = String(html)
              .replace(/<\!--.*?--\>/g, "")
              .replace(/(^[ \t\r\n]+|[ \t\r\n]+$)/g, "")
              .substring(1);
            let data = JSON.parse(atob(html));
            return data.picture.map(e => `<img src="${e.url}">`).join('\n');
          });
      }
    },

    "u17": {

      // 有妖气的漫画图片数据放在 HTML 中的 script 标签内
      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
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
            return imgs.map(img => `<img src="${img}">`).join('\n');
          });
      }
    },

    "chuangshi": {

      // 创世中文网的章节内容需要按一定的方式解码
      getChapterContent(bsid, dict={}){

        let link = this.getChapterLink(bsid, dict);
        return LittleCrawler.cordovaAjax("get", link, {}, 'json',
              {
                "Referer": "http://chuangshi.qq.com/",
                "X-Requested-With": "XMLHttpRequest"
              })
          .then(json => {
            let content = decryptByBaseCode(json.Content, 30);
            const bsm = this.__sources[bsid];
            let data = this.__lc.parse(content, "html", bsm.chapter.response, link, {});
            return LittleCrawler.clearHtml(data.contentHTML);
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
      afterGetChapterContent(content){
        if(content)
          content = content.replace(/^\s*(.*?)<p/i, "<p>$1</p><p");
        return content;
      }
    },

    "qqbook": {

      // 由于腾讯图书的章节列表是分页的，所以要把所有页面的数据整合到一起
      getBookCatalog(bsid, dict){

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
      beforeGetChapterContent(){
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
    //   getChapterContent(bsid, dict={}, filterBookId=true){

    //     let link = this.getChapterLink(bsid, dict);
    //     return utils.get(link)
    //       .then(getImgs);

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
    //   getChapterContent(bsid, dict={}){
    //     return CBS["chuiyao"].getChapterContent.apply(this, ["dangniao", dict, false]);
    //   }
    // },

    "omanhua": {

      beforeSearchBook(){
        let keyword = arguments[1];
        let letter = keyword ? translate.getFirstPY(keyword) : "A";
        arguments[1] = {keyword: keyword, litter: letter};
        return Promise.resolve(arguments);
      },

      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => {
            if(html.match('为维护版权方权益或违反国家法律法规本站不提供阅读'))
              return null;
            let data = CBS.common.getEncryptedData(html);
            if(!data) return null;
            let matcher = data.match(/({.*})\|\|/);
            if(!matcher) return null;
            data = JSON.parse(matcher[1].replace(/'/g, '"'));

            data = data.files.map(e => `http://pic.fxdm.cc${data.path}${e}`);
            if(data.length <= 0) return null;
            return data.map(e => `<img src="${e}">`).join('\n');
          });
      }
    },

    "2manhua": {
      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => CBS.common.getImages(html, "fs", "http://tupianku.333dm.com", (img => img && img.match(/\/\d+\.\w+$/i))));
      }
    },

    "57mh": {
      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => CBS.common.getImages(html, "fs", "http://tupianku.333dm.com"));
      }
    },


    "77mh": {

      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => {
            let link = html.match(/http:\/\/css.177mh.com\/coojs\/.*?\.js/i)[0];
            return utils.get(link);
          })
          .then(html => {
            let data = CBS.common.getEncryptedData(html);
            let msg = data.match(/'(.*?)'/);
            if(!msg) return null;
            let imgs = msg[1].split('|');
            let img_s = Number.parseInt(data.match(/img_s=(\w+);/)[1]);
            if (img_s == 46) // 取自 http://css.177mh.com/img_v1/n17_co.js?v170202
              img_s = 150;

            // 取自 http://css.177mh.com/img_v1/cn_160903a.js
            let img_qianzso = new Array();
            img_qianzso[1] = "http://oo62.177mh.com/h1/";
            img_qianzso[2] = "http://o76.177mh.com/e2/";
            img_qianzso[3] = "http://o59.177mh.com/h3/";
            img_qianzso[4] = "http://o59.177mh.com/h4/";
            img_qianzso[5] = "http://o59.177mh.com/h5/";
            img_qianzso[6] = "http://o16.177mh.com/h6/";
            img_qianzso[7] = "http://o16.177mh.com/h7/";
            img_qianzso[8] = "http://o16.177mh.com/h8/";
            img_qianzso[9] = "http://o16.177mh.com/h9/";
            img_qianzso[10] = "http://o16.177mh.com/h10/";
            img_qianzso[11] = "http://o59.177mh.com/h11/";
            img_qianzso[12] = "http://oo62.177mh.com/h12/";
            img_qianzso[13] = "http://o16.177mh.com/h13/";
            img_qianzso[14] = "http://o16.177mh.com/h14/";
            img_qianzso[15] = "http://o59.177mh.com/h15/";
            img_qianzso[16] = "http://o59.177mh.com/h16/";
            img_qianzso[17] = "http://o16.177mh.com/h17/";
            img_qianzso[18] = "http://oo62.177mh.com/h18/";
            img_qianzso[19] = "http://o16.177mh.com/h19/";
            img_qianzso[20] = "http://oo62.177mh.com/h20/";
            img_qianzso[21] = "http://oo62.177mh.com/h21/";
            img_qianzso[22] = "http://o16.177mh.com/h22/";
            img_qianzso[23] = "http://o16.177mh.com/h23/";
            img_qianzso[24] = "http://o16.177mh.com/h24/";
            img_qianzso[25] = "http://o16.177mh.com/h25/";
            img_qianzso[26] = "http://o16.177mh.com/h26/";
            img_qianzso[27] = "http://o16.177mh.com/h27/";
            img_qianzso[28] = "http://oo62.177mh.com/h28/";
            img_qianzso[29] = "http://o59.177mh.com/h29/";
            img_qianzso[30] = "http://oo62.177mh.com/h30/";
            img_qianzso[31] = "http://oo62.177mh.com/h31/";
            img_qianzso[32] = "http://oo62.177mh.com/h32/";
            img_qianzso[33] = "http://oo62.177mh.com/h33/";
            img_qianzso[34] = "http://oo62.177mh.com/h34/";
            img_qianzso[35] = "http://o59.177mh.com/h35/";
            img_qianzso[36] = "http://o59.177mh.com/h36/";
            img_qianzso[37] = "http://o59.177mh.com/h37/";
            img_qianzso[38] = "http://o70.177mh.com/h38/";
            img_qianzso[39] = "http://o70.177mh.com/h39/";
            img_qianzso[40] = "http://o70.177mh.com/h40/";
            img_qianzso[41] = "http://o70.177mh.com/h41/";
            img_qianzso[42] = "http://o70.177mh.com/h42/";
            img_qianzso[43] = "http://o70.177mh.com/h43/";
            img_qianzso[44] = "http://o70.177mh.com/h44/";
            img_qianzso[45] = "http://oo62.177mh.com/h45/";
            img_qianzso[46] = "http://o59.177mh.com/h46/";
            img_qianzso[47] = "http://o70.177mh.com/h47/";
            img_qianzso[48] = "http://oo62.177mh.com/h48/";
            img_qianzso[49] = "http://o16.177mh.com/h49/";
            img_qianzso[50] = "http://o70.177mh.com/h50/";
            img_qianzso[51] = "http://o16.177mh.com/h51/";
            img_qianzso[52] = "http://o76.177mh.com/h52/";
            img_qianzso[53] = "http://o76.177mh.com/h53/";
            img_qianzso[54] = "http://ofdc.177mh.com/h54/";
            img_qianzso[55] = "http://o76.177mh.com/h55/";
            img_qianzso[56] = "http://o76.177mh.com/h56/";
            img_qianzso[57] = "http://o76.177mh.com/h57/";
            img_qianzso[58] = "http://o70.177mh.com/h58/";
            img_qianzso[59] = "http://o16.177mh.com/h59/";
            img_qianzso[60] = "http://o59.177mh.com/h60/";
            img_qianzso[61] = "http://o59.177mh.com/h61/";
            img_qianzso[150] = "http://o59.177mh.com/h46/";
            let host = img_qianzso[img_s];
            imgs = imgs.map(e => `${host}${e}`);
            if(imgs.length <= 0) return null;
            return imgs.map(e => `<img src="${e}">`).join('\n');
          });
      }
    },

    "yyls": {
      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => {
            let link = html.match(/id="caonima" .*?\bsrc\b="([^"]*)"/i)[1];
            link = link.replace(/\/[^\/]*$/, "");
            if(link[link.length - 1] != "/") link += "/";
            let count = Number.parseInt(html.match(/openimg\('\d+','(\d+)','\d+',\d+\)/i)[1]);
            let imgs = new Array(count).fill(0).map((e, i) =>
              `${link}${(i+1).toString().padLeft(3,"0")}.jpg`);
            return imgs.map(e => `<img src="${e}">`).join('\n');
          });
      }
    },

  };

  return CBS;
}));

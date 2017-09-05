;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["customBookSource"] = factory.apply(undefined, deps.map(e => window[e]));
}(['co', "utils", "LittleCrawler", "translate", "Book", "BookSource", "Chapter", "zip-ext"],
  function(co, utils, LittleCrawler, translate, Book, BookSource, Chapter) {
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

      // getImages(html, key, host, filter){
      //   let data = CBS.common.getEncryptedData(html);

      //   let matcher = data.match(/{.*}/);
      //   if(!matcher) return null;
      //   data = JSON.parse(matcher[0].replace(/'/g, '"'));

      //   if(key) data = data[key];
      //   data = data.map(e => `${host}${e}`);
      //   if(data.length <= 0) return null;
      //   if(filter){
      //     let filteredData = data.filter(filter);
      //     if(filteredData.length > 3)
      //       data = filteredData;
      //   }
      //   return data.map(e => `<img src="${e}">`).join('\n');
      // },
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
            let regex = /<script>[^<]*image_list: ([^<]*),\s*image_pages:[^<]*<\/script>/i;
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

      // 将每个章节的卷中的书名去掉
      afterGetBookCatalog(catalog, args){
        return catalog.filter(c => !c.title || !c.title.includes("暂缺"));
      },

      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => {
            // get host
            let hostMatcher = html.match(/[^"]*config[^"]*/i);
            if(!hostMatcher) return null;
            return utils.get(hostMatcher[0])
              .then(hostHTML => {
                let host = JSON.parse(hostHTML.match(/{[\d\D]*}/)[0].replace(/'/g, '"'));
                host = host.host.auto[0];

                // get data
                let data = CBS.common.getEncryptedData(html);

                let matcher = data.match(/{.*}/);
                if(!matcher) return null;
                data = JSON.parse(matcher[0].replace(/'/g, '"'));
                data = data.fs;
                if(data.length <= 0) return null;

                // 按URL长度筛选广告
                let box = utils.getBoxPlot(data.map(e => e.length));
                data = data.filter(e => e.length >= box.Q0 && e.length <= box.Q4);

                // 如果 URL 以数字结尾，则使用下面的过滤广告算法
                if(data[0].match(/\/\d+\.\w{0,3}$/)){
                  // 按链接顺序过滤广告
                  // 最多三张广告
                  let sortedData = Object.assign([], data).sort();
                  let splitIndex = -1;
                  for(let i = 1; i < data.length; i++){
                    let ni = sortedData.indexOf(data[i-1]);
                    if(sortedData[ni+1] != data[i]){
                      splitIndex = i;
                      break;
                    }
                  }
                  if(splitIndex > 0)
                    data = data.splice(0, splitIndex);
                }

                data = data.map(e => `http://${host}${e}`);
                return data.map(e => `<img src="${e}">`).join('\n');
              });


          });
      }
    },

    "57mh": {
      getChapterContent(bsid, dict={}){
        return CBS["2manhua"].getChapterContent.bind(this)(bsid, dict);

        // let link = this.getChapterLink(bsid, dict);
        // return utils.get(link)
        //   .then(html => {
        //     let data = CBS.common.getEncryptedData(html);

        //     let matcher = data.match(/{.*}/);
        //     if(!matcher) return null;
        //     data = JSON.parse(matcher[0].replace(/'/g, '"'));

        //     data = data.fs;
        //     data = data.map(e => `http://tupianku.333dm.com${e}`);
        //     if(data.length <= 0) return null;
        //     return data.map(e => `<img src="${e}">`).join('\n');
        //   });
      }
    },


    "77mh": {

      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        let img_s;
        let imgs;
        return utils.get(link)
          .then(html => {
            let link = html.match(/http:\/\/css.177mh.com\/coojs\/.*?\.js/i)[0];
            return utils.get(link);
          })
          .then(html => {
            let data = CBS.common.getEncryptedData(html);
            let msg = data.match(/'(.*?)'/);
            if(!msg) return null;
            imgs = msg[1].split('|');
            img_s = Number.parseInt(data.match(/img_s=(\w+);/)[1]);
            if (img_s == 46) // 取自 http://css.177mh.com/img_v1/n17_co.js?v170202
              img_s = 150;

            // 取自 http://css.177mh.com/img_v1/n17_co.js?v170531
            // 获取图片服务器
            let svrss = Array("http://css.177mh.com/img_v1/cn_svr.aspx", "http://css.177mh.com/img_v1/hw2_svr.aspx", "http://css.177mh.com/img_v1/fdc_svr.aspx");
            let coid_num = /\d+\/(\d+)/.exec(link)[1];
            let scriptUrl = `${svrss[0]}?s=${img_s}&cid=${dict.bookid}&coid=${coid_num}`;
            return utils.get(scriptUrl);
          })
          .then(html => {
            let host = utils.eval(html);
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

    "manhuatai": {
      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => {
            let mh_info = html.match(/<script>var mh_info=(.*?);var.*<\/script>/i)[1];
            mh_info = utils.eval(`(${mh_info})`);

            mh_info.imgpath = mh_info.imgpath.replace(/./g, function(a) {
                return String.fromCharCode(a.charCodeAt(0) - mh_info.pageid % 10)
            });

            let startIndex = Number.parseInt(mh_info.startimg);
            let imgUrlHeader = "mhpic." + mh_info.domain;
            if(imgUrlHeader.indexOf("mhpic") == -1) imgUrlHeader += ":82";
            let b = mh_info.comic_size || "";

            // http://mhpic.jjmh.com/comic/Q%2F%E5%85%A8%E8%81%8C%E9%AB%98%E6%89%8B%2F58%E8%AF%9D%2F2.jpg
            let imgs = new Array(mh_info.totalimg).fill(0).map((e, i) =>
              `http://${imgUrlHeader}/comic/${mh_info.imgpath}${startIndex + i + ".jpg" + b}`);
            return imgs.map(e => `<img src="${e}">`).join('\n');
          });
      }
    },

    "99lib": {
      getChapterContent(bsid, dict={}){
        let link = this.getChapterLink(bsid, dict);
        return utils.get(link)
          .then(html => {
            let result = this.__lc.parse(html, "html", {
              type: "string",
              element: "meta[name=client]",
              attribute: "content"
            });

            let pSort = atob(result).split(/[A-Z]+%/);
            let j = 0;
            let childNode = [];

            result = this.__lc.parse(html, "html", {
              type: "array",
              element: "#content > div",
              children: ""
            });

            // remove ad
            result = result.map(m =>
              utils.DBCtoCDB(m)
                .replace(/(www[•\.])?99lib[•\.]net|九.?九.?藏.?书.?网/gi, ""));

            for (let i = 0; i < pSort.length; i++) {
                if (pSort[i] < 5) {
                    childNode[pSort[i]] = result[i];
                    j++;
                } else {
                    childNode[pSort[i] - j] = result[i];
                }
            }
            return LittleCrawler.text2html(childNode.join("\n"));
          });

      }
    },

    "buka": {
      // getBookCatalog(bsid, dict){

      //   const bs = this.__sources[bsid];
      //   if(!bs) return Promise.reject("Illegal booksource!");

      //   return this.__lc.getLink
      //   return this.__lc.get(bs.catalog, dict)
      //     .then(data => {
      //       if(bs.catalog.hasVolume)
      //         data = data
      //           .map(v => v.chapters.map(c => (c.volume = v.name, c)))
      //           .reduce((s,e) => s.concat(e), []);
      //       data = data.map(c => translate.toSC(bs.language, c, ['title']));
      //       return data.map(c => LittleCrawler.cloneObjectValues(new Chapter(), c));
      //     });
      // }
      //

      getChapterContent(bsid, dict={}){
        return new Promise((resolve, reject) => {
          require(["md5", "pako", "zip"], function(MD5, pako, zip){
            if(!dict.link && !dict.cid) return reject(206);

            let mid = dict.bookid;
            let cid = dict.cid;
            let servers = [
              "http://index.bukamanhua.com:8000/req3.php",
              "http://indexbk.sosohaha.com/req3.php",
            ];
            let server = utils.Random.choice(servers);
            let currentAppVersion = "33619988";
            let md5 = MD5(`${mid},${cid},buka index error`);
            let url = `${server}?mid=${mid}&cid=${cid}&c=${md5}&s=ao&v=5&t=-1&restype=2&cv=${currentAppVersion}&tzro=8`;

            // url = "http://c-r7.sosobook.cn/pich/215522/65541/t4305372_0001.bmp.h.bup";
            return resolve(LittleCrawler.ajax("GET", url, {}, "arraybuffer")
              .then(data => {
                data = new Uint8Array(data);
                let dataLength = Number.parseInt(new TextDecoder().decode(data.slice(4, 12)), 16);

                let decoder = new Uint8Array(8);
                decoder[0] = cid;
                decoder[1] = (cid >> 8);
                decoder[2] = (cid >> 16);
                decoder[3] = (cid >> 24);
                decoder[4] = mid;
                decoder[5] = (mid >> 8) ;
                decoder[6] = (mid >> 16);
                decoder[7] = (mid >> 24);

                let indexData = data.slice(12 + 4, 12 + dataLength);

                for(let i = 0; i < indexData.byteLength; i++){
                  indexData[i] = indexData[i] ^ decoder[i % 8];
                }
                let remainData = data.slice(12 + dataLength);
                let headers = JSON.parse(pako.ungzip(remainData, {to: "string"}));

                return utils.getDataFromZipFile(indexData)
                  .then(data => {
                    let json = JSON.parse(new TextDecoder().decode(data));

                    let imgs = Array.from(json.pics).map(e => `${headers.resbk}/${mid}/${cid}/${e}`);
                    return imgs.map(e => `<img data-skip="64" src="${e}">`).join('\n');
                  });
              }));
          });
        });
      }
    },


  };

  return CBS;
}));

"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["customBookSource"] = factory(co, utils, LittleCrawler, translate, Book, BookSource, Chapter);
})(['co', "utils", "LittleCrawler", "translate", "Book", "BookSource", "Chapter"], function (co, utils, LittleCrawler, translate, Book, BookSource, Chapter) {
  "use strict";

  var CBS = {
    "common": {
      getEncryptedData: function getEncryptedData(html) {
        var evalCode = html.match(/\beval(\(.*return p;?}\(.*?\)\))/i);
        if (!evalCode) return null;
        return utils.eval(evalCode[1]);
      },
      getImages: function getImages(html, key, host) {
        var data = CBS.common.getEncryptedData(html);

        var matcher = data.match(/{.*}/);
        if (!matcher) return null;
        data = JSON.parse(matcher[0].replace(/'/g, '"'));

        if (key) data = data[key];
        data = data.map(function (e) {
          return "" + host + e;
        });
        if (data.length <= 0) return null;
        return data.map(function (e) {
          return "<img src=\"" + e + "\">";
        }).join('\n');
      }
    },

    "qqac": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          if (!html) return null;
          html = String(html).replace(/<\!--.*?--\>/g, "").replace(/(^[ \t\r\n]+|[ \t\r\n]+$)/g, "").substring(1);
          var data = JSON.parse(atob(html));
          return data.picture.map(function (e) {
            return "<img src=\"" + e.url + "\">";
          }).join('\n');
        });
      }
    },

    "u17": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          if (!html) return null;
          var regex = /<script>[^<]*image_list: \$\.evalJSON\('([^<]*)'\),\s*image_pages:[^<]*<\/script>/i;
          html = html.match(regex);
          if (!html) return null;
          var json = JSON.parse(html[1]);
          var keys = Object.keys(json).sort(function (e1, e2) {
            return parseInt(e1) - parseInt(e2);
          });

          var imgs = keys.map(function (e) {
            return atob(json[e].src);
          });

          return imgs.map(function (img) {
            return "<img src=\"" + img + "\">";
          }).join('\n');
        });
      }
    },

    "chuangshi": {
      getChapterContent: function getChapterContent(bsid) {
        var _this = this;

        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        var link = this.getChapterLink(bsid, dict);
        return LittleCrawler.cordovaAjax("get", link, {}, 'json', {
          "Referer": "http://chuangshi.qq.com/",
          "X-Requested-With": "XMLHttpRequest"
        }).then(function (json) {
          var content = decryptByBaseCode(json.Content, 30);
          var bsm = _this.__sources[bsid];
          var data = _this.__lc.parse(content, "html", bsm.chapter.response, link, {});
          return LittleCrawler.clearHtml(data.contentHTML);
        });

        function decryptByBaseCode(text, base) {
          if (!text) return text;
          var arrStr = [],
              arrText = text.split('\\');
          for (var i = 1, len = arrText.length; i < len; i++) {
            arrStr.push(String.fromCharCode(parseInt(arrText[i], base)));
          }
          return arrStr.join('');
        }
      }
    },

    "sfnovel": {
      afterGetBookCatalog: function afterGetBookCatalog(catalog, args) {
        var book = args[1].book;
        if (!book || !book.name) return catalog;
        catalog.forEach(function (c) {
          return c.volume = c.volume.replace("\u3010" + book.name + "\u3011", "").trim();
        });
        return catalog;
      },
      afterGetChapterContent: function afterGetChapterContent(content) {
        if (content) content = content.replace(/^\s*(.*?)<p/i, "<p>$1</p><p");
        return content;
      }
    },

    "qqbook": {
      getBookCatalog: function getBookCatalog(bsid, dict) {

        var bs = this.__sources[bsid];
        if (!bs) return Promise.reject("Illegal booksource!");

        var linkTmp = bs.catalog.request.url;

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          var result, link, json, total, pageNos;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  result = [];
                  link = LittleCrawler.format(linkTmp, { bookid: dict.bookid, pageNo: 1 });
                  _context.next = 4;
                  return utils.getJSON(link);

                case 4:
                  json = _context.sent;
                  total = json.total;

                  dict.maxfreechapter = json.book.maxfreechapter;
                  result[0] = self.__lc.parse(json, "json", bs.catalog.response, link, dict);

                  pageNos = new Array(Math.ceil(total / 100) - 1).fill(0).map(function (e, i) {
                    return i + 2;
                  });
                  _context.next = 11;
                  return Promise.all(pageNos.map(function (pageNo) {
                    var gatcherDict = Object.assign({ pageNo: pageNo }, dict);
                    return self.__lc.get(bs.catalog, gatcherDict).then(function (cs) {
                      result[pageNo - 1] = cs;
                    });
                  }));

                case 11:
                  result = result.reduce(function (s, e) {
                    return s.concat(e);
                  }, []);
                  return _context.abrupt("return", result.map(function (c) {
                    return LittleCrawler.cloneObjectValues(new Chapter(), c);
                  }));

                case 13:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
      }
    },

    "daizhuzai": {
      beforeGetChapterContent: function beforeGetChapterContent() {
        var args = arguments;
        var link = args[1].link;
        if (link.match(/novelsearch/)) return Promise.resolve(args);
        return utils.get(link).then(function (data) {
          var url = data.match(/'(\/novelsearch\/reader\/transcode\/siteid\/\d+\/url\/.*?)'/)[1];
          args[1].link = LittleCrawler.fixurl(url, link);
          return args;
        });
      }
    },

    "omanhua": {
      beforeSearchBook: function beforeSearchBook() {
        var keyword = arguments[1];
        var letter = keyword ? translate.getFirstPY(keyword) : "A";
        arguments[1] = { keyword: keyword, litter: letter };
        return Promise.resolve(arguments);
      },
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          if (html.match('为维护版权方权益或违反国家法律法规本站不提供阅读')) return null;
          var data = CBS.common.getEncryptedData(html);
          if (!data) return null;

          data = data.files.map(function (e) {
            return "http://pic.fxdm.cc" + data.path + e;
          });
          if (data.length <= 0) return null;
          return data.map(function (e) {
            return "<img src=\"" + e + "\">";
          }).join('\n');
        });
      }
    },

    "2manhua": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          return CBS.common.getImages(html, "fs", "http://tupianku.333dm.com");
        });
      }
    },

    "57mh": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          return CBS.common.getImages(html, "fs", "http://tupianku.333dm.com");
        });
      }
    },

    "77mh": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          var link = html.match(/http:\/\/css.177mh.com\/coojs\/.*?\.js/i)[0];
          return utils.get(link);
        }).then(function (html) {
          var data = CBS.common.getEncryptedData(html);
          var msg = data.match(/'(.*?)'/);
          if (!msg) return null;
          var imgs = msg[1].split('|');
          var img_s = Number.parseInt(data.match(/img_s=(\w+);/)[1]);
          if (img_s == 46) img_s = 150;

          var img_qianzso = new Array();
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
          var host = img_qianzso[img_s];
          imgs = imgs.map(function (e) {
            return "" + host + e;
          });
          if (imgs.length <= 0) return null;
          return imgs.map(function (e) {
            return "<img src=\"" + e + "\">";
          }).join('\n');
        });
      }
    },

    "yyls": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          var link = html.match(/id="caonima" .*?\bsrc\b="([^"]*)"/i)[1];
          link = link.replace(/\/[^\/]*$/, "");
          if (link[link.length - 1] != "/") link += "/";
          var count = Number.parseInt(html.match(/openimg\('\d+','(\d+)','\d+',\d+\)/i)[1]);
          var imgs = new Array(count).fill(0).map(function (e, i) {
            return "" + link + (i + 1).toString().padLeft(3, "0") + ".jpg";
          });
          return imgs.map(function (e) {
            return "<img src=\"" + e + "\">";
          }).join('\n');
        });
      }
    }

  };

  return CBS;
});
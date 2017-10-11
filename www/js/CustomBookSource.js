"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["customBookSource"] = factory.apply(undefined, deps.map(function (e) {
    return window[e];
  }));
})(['co', "utils", "LittleCrawler", "translate", "Book", "BookSource", "Chapter", "zip-ext"], function (co, utils, LittleCrawler, translate, Book, BookSource, Chapter) {
  "use strict";

  var CBS = {
    "common": {
      getEncryptedData: function getEncryptedData(html) {
        var evalCode = html.match(/\beval(\(.*return p;?}\(.*?\)\))/i);
        if (!evalCode) return null;
        return utils.eval(evalCode[1]);
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
          var regex = /<script>[^<]*image_list: ([^<]*),\s*image_pages:[^<]*<\/script>/i;
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
          var matcher = data.match(/({.*})\|\|/);
          if (!matcher) return null;
          data = JSON.parse(matcher[1].replace(/'/g, '"'));

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
      afterGetBookCatalog: function afterGetBookCatalog(catalog, args) {
        return catalog.filter(function (c) {
          return !c.title || !c.title.includes("暂缺");
        });
      },
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          var hostMatcher = html.match(/[^"]*config[^"]*/i);
          if (!hostMatcher) return null;
          return utils.get(hostMatcher[0]).then(function (hostHTML) {
            var host = JSON.parse(hostHTML.match(/{[\d\D]*}/)[0].replace(/'/g, '"'));
            host = host.host.auto[0];

            var data = CBS.common.getEncryptedData(html);

            var matcher = data.match(/{.*}/);
            if (!matcher) return null;
            data = JSON.parse(matcher[0].replace(/'/g, '"'));
            data = data.fs;
            if (data.length <= 0) return null;

            var box = utils.getBoxPlot(data.map(function (e) {
              return e.length;
            }));
            data = data.filter(function (e) {
              return e.length >= box.Q0 && e.length <= box.Q4;
            });

            if (data[0].match(/\/\d+\.\w{0,3}$/)) {
              var sortedData = Object.assign([], data).sort();
              var splitIndex = -1;
              for (var i = 1; i < data.length; i++) {
                var ni = sortedData.indexOf(data[i - 1]);
                if (sortedData[ni + 1] != data[i]) {
                  splitIndex = i;
                  break;
                }
              }
              if (splitIndex > 0) data = data.splice(0, splitIndex);
            }

            data = data.map(function (e) {
              return "http://" + host + e;
            });
            return data.map(function (e) {
              return "<img src=\"" + e + "\">";
            }).join('\n');
          });
        });
      },
      CF: function CF() {
        var url = "http://www.2manhua.com/";
        return utils.get(url).then(function (html) {
          if (html.includes("jschl-answer")) {
            var matcher = html.match(/var s,t,o,p,b,r,e,a,k,i,n,g,f, ((\w+)=.*)/);
            var evalCode = "\n                let t = \"www.2manhua.com\";\n                let a = {};\n                let " + matcher[1] + "\n                " + html.match(";" + matcher[2] + "..*")[0] + "\n                a.value;\n              ";

            var jschl_vc = html.match(/name="jschl_vc" value="([^"]+)"/)[1];
            var pass = html.match(/name="pass" value="([^"]+)"/)[1];
            var jschl_answer = utils.eval(evalCode);
            var link = "http://www.2manhua.com/cdn-cgi/l/chk_jschl?jschl_vc=" + jschl_vc + "&pass=" + pass + "&jschl_answer=" + jschl_answer;

            return utils.get(link, undefined, undefined, {
              "Accept-Language": "en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
              "Referer": "http://www.2manhua.com/"
            });
          } else {
            return true;
          }
        });
      },
      beforeSearchBook: function beforeSearchBook() {
        var _arguments = arguments;

        return CBS["2manhua"].CF().then(function () {
          return _arguments;
        });
      },
      beforeGetBookInfo: function beforeGetBookInfo() {
        var _arguments2 = arguments;

        return CBS["2manhua"].CF().then(function () {
          return _arguments2;
        });
      },
      beforeGetBookCatalog: function beforeGetBookCatalog() {
        var _arguments3 = arguments;

        return CBS["2manhua"].CF().then(function () {
          return _arguments3;
        });
      },
      beforeGetLastestChapter: function beforeGetLastestChapter() {
        var _arguments4 = arguments;

        return CBS["2manhua"].CF().then(function () {
          return _arguments4;
        });
      },
      beforeGetBookCatalogLink: function beforeGetBookCatalogLink() {
        var _arguments5 = arguments;

        return CBS["2manhua"].CF().then(function () {
          return _arguments5;
        });
      }
    },

    "57mh": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return CBS["2manhua"].getChapterContent.bind(this)(bsid, dict);
      }
    },

    "77mh": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        var img_s = void 0;
        var imgs = void 0;
        return utils.get(link).then(function (html) {
          var link = html.match(/https?:\/\/css.177mh.com\/coojs\/.*?\.js/i)[0];
          return utils.get(link);
        }).then(function (html) {
          var data = CBS.common.getEncryptedData(html);
          var msg = data.match(/'(.*?)'/);
          if (!msg) return null;
          imgs = msg[1].split('|');
          img_s = Number.parseInt(data.match(/img_s=(\w+);/)[1]);
          if (img_s == 46) img_s = 150;

          var svrss = Array("http://css.177mh.com/img_v1/cn_svr.aspx", "http://css.177mh.com/img_v1/hw2_svr.aspx", "http://css.177mh.com/img_v1/fdc_svr.aspx");
          var coid_num = /\d+\/(\d+)/.exec(link)[1];
          var scriptUrl = svrss[0] + "?s=" + img_s + "&cid=" + dict.bookid + "&coid=" + coid_num;
          return utils.get(scriptUrl);
        }).then(function (html) {
          var host = utils.eval(html);
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
    },

    "manhuatai": {
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          var mh_info = html.match(/<script>var mh_info=(.*?);var.*<\/script>/i)[1];
          mh_info = utils.eval("(" + mh_info + ")");

          mh_info.imgpath = mh_info.imgpath.replace(/./g, function (a) {
            return String.fromCharCode(a.charCodeAt(0) - mh_info.pageid % 10);
          });

          var startIndex = Number.parseInt(mh_info.startimg);
          var imgUrlHeader = "mhpic." + mh_info.domain;
          if (imgUrlHeader.indexOf("mhpic") == -1) imgUrlHeader += ":82";
          var b = mh_info.comic_size || "";

          var imgs = new Array(mh_info.totalimg).fill(0).map(function (e, i) {
            return "http://" + imgUrlHeader + "/comic/" + mh_info.imgpath + (startIndex + i + ".jpg" + b);
          });
          return imgs.map(function (e) {
            return "<img src=\"" + e + "\">";
          }).join('\n');
        });
      }
    },

    "99lib": {
      getChapterContent: function getChapterContent(bsid) {
        var _this2 = this;

        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var link = this.getChapterLink(bsid, dict);
        return utils.get(link).then(function (html) {
          var result = _this2.__lc.parse(html, "html", {
            type: "string",
            element: "meta[name=client]",
            attribute: "content"
          });

          var pSort = atob(result).split(/[A-Z]+%/);
          var j = 0;
          var childNode = [];

          result = _this2.__lc.parse(html, "html", {
            type: "array",
            element: "#content > div",
            children: ""
          });

          result = result.map(function (m) {
            return utils.DBCtoCDB(m).replace(/(www[•\.])?99lib[•\.]net|九.?九.?藏.?书.?网/gi, "");
          });

          for (var i = 0; i < pSort.length; i++) {
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
      getChapterContent: function getChapterContent(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return new Promise(function (resolve, reject) {
          require(["md5", "pako", "zip"], function (MD5, pako, zip) {
            if (!dict.link && !dict.cid) return reject(206);

            var mid = dict.bookid;
            var cid = dict.cid;
            var servers = ["http://index.bukamanhua.com:8000/req3.php", "http://indexbk.sosohaha.com/req3.php"];
            var server = utils.Random.choice(servers);
            var currentAppVersion = "33619988";
            var md5 = MD5(mid + "," + cid + ",buka index error");
            var url = server + "?mid=" + mid + "&cid=" + cid + "&c=" + md5 + "&s=ao&v=5&t=-1&restype=2&cv=" + currentAppVersion + "&tzro=8";

            return resolve(LittleCrawler.ajax("GET", url, {}, "arraybuffer").then(function (data) {
              data = new Uint8Array(data);
              var dataLength = Number.parseInt(new TextDecoder().decode(data.slice(4, 12)), 16);

              var decoder = new Uint8Array(8);
              decoder[0] = cid;
              decoder[1] = cid >> 8;
              decoder[2] = cid >> 16;
              decoder[3] = cid >> 24;
              decoder[4] = mid;
              decoder[5] = mid >> 8;
              decoder[6] = mid >> 16;
              decoder[7] = mid >> 24;

              var indexData = data.slice(12 + 4, 12 + dataLength);

              for (var i = 0; i < indexData.byteLength; i++) {
                indexData[i] = indexData[i] ^ decoder[i % 8];
              }
              var remainData = data.slice(12 + dataLength);
              var headers = JSON.parse(pako.ungzip(remainData, { to: "string" }));

              return utils.getDataFromZipFile(indexData).then(function (data) {
                var json = JSON.parse(new TextDecoder().decode(data));

                var imgs = Array.from(json.pics).map(function (e) {
                  return headers.resbk + "/" + mid + "/" + cid + "/" + e;
                });
                return imgs.map(function (e) {
                  return "<img data-skip=\"64\" src=\"" + e + "\">";
                }).join('\n');
              });
            }));
          });
        });
      }
    }

  };

  return CBS;
});
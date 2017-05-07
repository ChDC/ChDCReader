"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["customBookSource"] = factory(co, utils, LittleCrawler, translate, Book, BookSource, Chapter);
})(['co', "utils", "LittleCrawler", "translate", "Book", "BookSource", "Chapter"], function (co, utils, LittleCrawler, translate, Book, BookSource, Chapter) {
  "use strict";

  var customBookSource = {

    "comico": {
      beforeSearchBook: function beforeSearchBook() {
        return Promise.resolve(Array.from(arguments).map(function (e) {
          return utils.type(e) == "string" ? translate.toTraditionChinese(e) : e;
        }));
      },
      afterSearchBook: function afterSearchBook(books) {
        return books.map(function (book) {
          var needTranslateAttributes = ['name', 'author', 'catagory', 'introduce'];
          needTranslateAttributes.forEach(function (e) {
            book[e] = translate.toSimpleChinese(book[e]);
          });
          var bss = book.sources[book.mainSourceId];
          bss.lastestChapter = translate.toSimpleChinese(bss.lastestChapter);
          return book;
        });
      },
      afterGetBookInfo: function afterGetBookInfo(book) {
        var needTranslateAttributes = ['name', 'author', 'catagory', 'introduce', 'lastestChapter'];
        needTranslateAttributes.forEach(function (e) {
          book[e] = translate.toSimpleChinese(book[e]);
        });
        return book;
      },
      afterGetChapter: function afterGetChapter(chapter) {
        chapter.title = translate.toSimpleChinese(chapter.title);
        return chapter;
      },
      afterGetBookCatalog: function afterGetBookCatalog(catalog) {
        return catalog.map(function (chapter) {
          chapter.title = translate.toSimpleChinese(chapter.title);
          return chapter;
        });
      },
      afterGetLastestChapter: function afterGetLastestChapter(lc) {
        return translate.toSimpleChinese(lc);
      }
    },

    "qqac": {
      getChapter: function getChapter(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid);

        var link = this.getChapterLink(bsid, dict);
        var bsm = this.__sources[bsid];

        return utils.get(link).then(function (html) {
          if (!html) return null;
          html = String(html).replace(/<\!--.*?--\>/g, "").replace(/(^[ \t\r\n]+|[ \t\r\n]+$)/g, "").substring(1);
          var data = JSON.parse(atob(html));
          var content = data.picture.map(function (e) {
            return "<img src=\"" + e.url + "\">";
          }).join('\n');

          var c = new Chapter();
          c.content = content;
          if (!c.content) return Promise.reject(206);

          c.cid = dict.cid;
          c.title = dict.title;
          if (!c.cid && link) c.link = link;
          return c;
        });
      }
    },

    "u17": {
      getChapter: function getChapter(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid);

        var link = this.getChapterLink(bsid, dict);
        var bsm = this.__sources[bsid];

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

          var content = imgs.map(function (img) {
            return "<img src=\"" + img + "\">";
          }).join('\n');

          var c = new Chapter();
          c.content = content;
          if (!c.content) return Promise.reject(206);

          c.cid = dict.cid;
          c.title = dict.title;
          if (!c.cid && dict.link) c.link = dict.link;
          return c;
        });
      }
    },

    "chuangshi": {
      getChapter: function getChapter(bsid) {
        var _this = this;

        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid);

        var link = this.getChapterLink(bsid, dict);
        var bsm = this.__sources[bsid];

        return LittleCrawler.cordovaAjax("get", link, {}, 'json', {
          "Referer": "http://chuangshi.qq.com/",
          "X-Requested-With": "XMLHttpRequest"
        }).then(function (json) {
          var content = decryptByBaseCode(json.Content, 30);
          var bsm = _this.__sources[bsid];
          var data = _this.__lc.parse(content, "html", bsm.chapter.response, link, {});
          content = LittleCrawler.clearHtml(data.contentHTML);

          var c = new Chapter();
          c.content = content;
          if (!c.content) return Promise.reject(206);

          c.cid = dict.cid;
          c.title = dict.title;
          if (!c.cid && link) c.link = link;
          return c;
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
      afterGetChapter: function afterGetChapter(chapter) {
        if (chapter.content) chapter.content = chapter.content.replace(/^\s*(.*?)<p/i, "<p>$1</p><p");
        return chapter;
      }
    },

    "qqbook": {
      getBookCatalog: function getBookCatalog(bsid, dict) {

        utils.log("BookSourceManager: Get Book Catalog Link from " + bsid + "\"");

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
      beforeGetChapter: function beforeGetChapter() {
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

    "chuiyao": {
      getChapter: function getChapter(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var filterBookId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;


        utils.log("BookSourceManager: Load Chpater content from " + bsid);

        var link = this.getChapterLink(bsid, dict);
        var bsm = this.__sources[bsid];

        return utils.get(link).then(function (html) {
          var content = getImgs(html);

          var c = new Chapter();
          c.content = content;
          if (!c.content) return Promise.reject(206);

          c.cid = dict.cid;
          c.title = dict.title;
          if (!c.cid && link) c.link = link;
          return c;
        });

        function getImgs(html) {
          var data = html.match(/var qTcms_S_m_murl_e = "(.*?)"/i);
          if (!data) return null;
          data = atob(data[1]);
          if (!data) return null;
          data = data.split("$qingtiandy$");
          if (filterBookId) data = data.filter(function (e) {
            return e.includes(dict.bookid);
          });
          if (data.length <= 0) return null;
          return data.map(function (e) {
            return "<img src=\"" + e + "\">";
          }).join('\n');
        }
      }
    },

    "dangniao": {
      getChapter: function getChapter(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return customBookSource["chuiyao"].getChapter.apply(this, ["dangniao", dict, false]);
      }
    },

    "omanhua": {
      beforeSearchBook: function beforeSearchBook() {
        var keyword = arguments[1];
        var letter = translate.getFirstPY(keyword);
        arguments[1] = { keyword: keyword, litter: letter };
        return Promise.resolve(arguments);
      },
      getChapter: function getChapter(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid);

        var link = this.getChapterLink(bsid, dict);
        var bsm = this.__sources[bsid];

        return utils.get(link).then(function (html) {
          var content = getImgs(html);

          var c = new Chapter();
          c.content = content;
          if (!c.content) return Promise.reject(206);

          c.cid = dict.cid;
          c.title = dict.title;
          if (!c.cid && link) c.link = link;
          return c;
        });

        function getImgs(html) {
          var data = html.match(/return p;}\((.*?)\)\)\s*<\/script>/i);
          if (!data) return null;
          var obj = eval("[" + data[1] + "]");
          data = parse.apply(null, obj);
          data = data.match(/({.*})\|\|{}/);
          if (!data) return null;
          data = JSON.parse(data[1]);

          data = data.files.map(function (e) {
            return "http://pic.fxdm.cc" + data.path + e;
          });
          if (data.length <= 0) return null;
          return data.map(function (e) {
            return "<img src=\"" + e + "\">";
          }).join('\n');
        }

        function parse(p, a, c, k, _e, d) {
          _e = function e(c) {
            return (c < a ? "" : _e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36));
          };if (!''.replace(/^/, String)) {
            while (c--) {
              d[_e(c)] = k[c] || _e(c);
            }k = [function (e) {
              return d[e];
            }];_e = function _e() {
              return '\\w+';
            };c = 1;
          };while (c--) {
            if (k[c]) p = p.replace(new RegExp('\\b' + _e(c) + '\\b', 'g'), k[c]);
          }return p;
        }
      }
    },

    "2manhua": {
      getChapter: function getChapter(bsid) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        utils.log("BookSourceManager: Load Chpater content from " + bsid);

        var link = this.getChapterLink(bsid, dict);
        var bsm = this.__sources[bsid];

        return utils.get(link).then(function (html) {
          var content = getImgs(html);

          var c = new Chapter();
          c.content = content;
          if (!c.content) return Promise.reject(206);

          c.cid = dict.cid;
          c.title = dict.title;
          if (!c.cid && link) c.link = link;
          return c;
        });

        function getImgs(html) {
          var data = html.match(/return p}\((.*?)\)\)/i);
          if (!data) return null;
          var obj = eval("[" + data[1] + "]");
          data = parse.apply(null, obj);
          data = data.match(/{.*}/);
          if (!data) return null;
          data = JSON.parse(data[0].replace(/'/g, '"'));

          data = data.fs.map(function (e) {
            return "http://tupianku.333dm.com" + e;
          });
          if (data.length <= 0) return null;
          return data.map(function (e) {
            return "<img src=\"" + e + "\">";
          }).join('\n');
        }

        function parse(p, a, c, k, e, d) {
          e = function e(c) {
            return c.toString(36);
          };if (!''.replace(/^/, String)) {
            while (c--) {
              d[e(c)] = k[c] || e(c);
            }k = [function (e) {
              return d[e];
            }];e = function e() {
              return '\\w+';
            };c = 1;
          };while (c--) {
            if (k[c]) {
              p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
            }
          }return p;
        }
      }
    }
  };

  return customBookSource;
});
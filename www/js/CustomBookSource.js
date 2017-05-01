"use strict";

define(['co', "utils", "Spider", "translate", "Book", "BookSource", "Chapter"], function (co, utils, Spider, translate, Book, BookSource, Chapter) {
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

        return utils.cordovaAjax("get", link, {}, 'json', {
          "Referer": "http://chuangshi.qq.com/",
          "X-Requested-With": "XMLHttpRequest"
        }).then(function (json) {
          var content = decryptByBaseCode(json.Content, 30);
          var bsm = _this.__sources[bsid];
          var data = _this.__spider.parse(content, "html", bsm.chapter.response, link, {});
          content = _this.__spider.clearHtml(data.contentHTML);

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
          var result, link, json, total, pageNos, catalog, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, c, chapter;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  result = [];
                  link = self.__spider.format(linkTmp, { bookid: dict.bookid, pageNo: 1 });
                  _context.next = 4;
                  return utils.getJSON(link);

                case 4:
                  json = _context.sent;
                  total = json.total;

                  dict.maxfreechapter = json.book.maxfreechapter;
                  result[0] = self.__spider.parse(json, "json", bs.catalog.response, link, dict);

                  pageNos = new Array(Math.ceil(total / 100) - 1).fill(0).map(function (e, i) {
                    return i + 2;
                  });
                  _context.next = 11;
                  return Promise.all(pageNos.map(function (pageNo) {
                    var gatcherDict = Object.assign({ pageNo: pageNo }, dict);
                    return self.__spider.get(bs.catalog, gatcherDict).then(function (cs) {
                      result[pageNo - 1] = cs;
                    });
                  }));

                case 11:
                  result = result.reduce(function (s, e) {
                    return s.concat(e);
                  }, []);

                  catalog = [];
                  _iteratorNormalCompletion = true;
                  _didIteratorError = false;
                  _iteratorError = undefined;
                  _context.prev = 16;

                  for (_iterator = result[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    c = _step.value;
                    chapter = new Chapter();

                    chapter.title = c.title;
                    chapter.link = c.link;
                    chapter.cid = c.cid;
                    catalog.push(chapter);
                  }
                  _context.next = 24;
                  break;

                case 20:
                  _context.prev = 20;
                  _context.t0 = _context["catch"](16);
                  _didIteratorError = true;
                  _iteratorError = _context.t0;

                case 24:
                  _context.prev = 24;
                  _context.prev = 25;

                  if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                  }

                case 27:
                  _context.prev = 27;

                  if (!_didIteratorError) {
                    _context.next = 30;
                    break;
                  }

                  throw _iteratorError;

                case 30:
                  return _context.finish(27);

                case 31:
                  return _context.finish(24);

                case 32:
                  return _context.abrupt("return", catalog);

                case 33:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[16, 20, 24, 32], [25,, 27, 31]]);
        }));
      }
    },

    "daizhuzai": {
      beforeGetChapter: function beforeGetChapter() {
        var _this2 = this;

        var args = arguments;
        var link = args[1].link;
        if (link.match(/novelsearch/)) return Promise.resolve(args);
        return utils.get(link).then(function (data) {
          var url = data.match(/'(\/novelsearch\/reader\/transcode\/siteid\/\d+\/url\/.*?)'/)[1];
          args[1].link = _this2.__spider.fixurl(url, link);
          return args;
        });
      }
    }
  };

  return customBookSource;
});
"use strict";

define(['co', "utils", "Spider", "translate", "Book", "BookSource", "Chapter"], function (co, utils, Spider, translate, Book, BookSource, Chapter) {
  "use strict";

  var customBookSource = {

    comico: {
      beforeSearchBook: function beforeSearchBook() {
        return Array.from(arguments).map(function (e) {
          return utils.type(e) == "string" ? translate.toTraditionChinese(e) : e;
        });
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

    qqac: {
      getChapter: function getChapter(bsid) {
        var chapter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapter.link + "\"");

        if (!chapter.link) return Promise.reject(206);

        var link = chapter.link;
        var matcher = link.match(/index\/id\/(\d+)\/cid\/(\d+)/i);
        if (!matcher) return Promise.reject(206);
        link = "http://m.ac.qq.com/chapter/index/id/" + matcher[1] + "/cid/" + matcher[2] + "?style=plain";

        return utils.get(link).then(function (html) {
          if (!html) return null;
          html = String(html).replace(/<\!--.*?--\>/g, "").replace(/(^[ \t\r\n]+|[ \t\r\n]+$)/g, "").substring(1);
          var data = JSON.parse(atob(html));

          chapter.content = data.picture.map(function (e) {
            return "<img src=\"" + e.url + "\">";
          }).join('\n');
          return chapter;
        });
      }
    },

    u17: {
      getChapter: function getChapter(bsid) {
        var chapter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapter.link + "\"");

        if (!chapter.link) return Promise.reject(206);

        return utils.get(chapter.link).then(function (html) {
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

          chapter.content = imgs.map(function (img) {
            return "<img src=\"" + img + "\">";
          }).join('\n');
          return chapter;
        });
      }
    },

    "chuangshi": {
      getChapter: function getChapter(bsid) {
        var _this = this;

        var chapter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        utils.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapter.link + "\"");

        if (!chapter.link) return Promise.reject(206);
        return utils.cordovaAjax("get", chapter.link, {}, 'json', {
          "Referer": "http://chuangshi.qq.com/",
          "X-Requested-With": "XMLHttpRequest"
        }).then(function (json) {
          var content = decryptByBaseCode(json.Content, 30);
          var bsm = _this.__sources[bsid];
          var data = _this.__spider.parse(content, "html", bsm.chapter.response, chapter.link, {});
          var c = new Chapter();
          c.content = _this.__spider.clearHtml(data.contentHTML);

          if (!c.content) return Promise.reject(206);
          c.link = chapter.link;
          c.title = data.title;
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
    }
  };

  return customBookSource;
});
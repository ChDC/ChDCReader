"use strict";

define(['co', "util", "Spider", "translate", "Book", "BookSource", "Chapter"], function (co, util, Spider, translate, Book, BookSource, Chapter) {
  "use strict";

  var customBookSource = {

    comico: {
      beforeSearchBook: function beforeSearchBook() {
        return Array.from(arguments).map(function (e) {
          return util.type(e) == "string" ? translate.toTraditionChinese(e) : e;
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
    u17: {
      getChapter: function getChapter(bsid) {
        var chapter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        util.log("BookSourceManager: Load Chpater content from " + bsid + " with link \"" + chapter.link + "\"");

        if (!chapter.link) return Promise.reject(206);

        return util.get(chapter.link).then(function (html) {
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
    }
  };

  return customBookSource;
});
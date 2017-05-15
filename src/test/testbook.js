;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["testbook"] = factory.apply(undefined, deps.map(e => window[e]));
}(["chai", "utils", "Chapter"], function(chai, utils, Chapter){

  let assert = chai.assert;
  let equal = assert.equal;

  return {

    equalBook(bsid, book, b){
      assert.isObject(b);
      assert.isNotNull(b);
      equal(true, !!b);

      // 除了 chapters 和 introduce 之外的，其他都相等
      let exclude = ['chapters', 'introduce', 'lastestChapter', 'cover', 'catalogLink'];
      for(let key in book){
        if(exclude.indexOf(key) >= 0)
          continue;
        if(key in b)
          equal(book[key], b[key],
                `${book.name}.${key}`);
        else if('sources' in b && key in b.sources[bsid])
          equal(book[key], b.sources[bsid][key],
                `${book.name}.${key}`);
      }

      // introduce
      if("introduce" in book && "introduce" in b)
        equal(true, b.introduce.length > 0 && b.introduce.indexOf(book.introduce) >=0, `${book.name}.introduce`);
      // lastestChapter
      if("lastestChapter" in book && "sources" in b && "lastestChapter" in b.sources[bsid])
        equal(true, b.sources[bsid].lastestChapter.length > 0, `${book.name}.lastestChapter`);
      if("cover" in book && "cover" in b)
        equal(true, !!(b.cover.match(/^http/)), `${book.name}.cover`);

    },

    // 搜索测试回调
    testSearchCaller(bsid, bsm, books){
      return Promise.all(books.map(book => {
        return bsm.searchBook(bsid, book.name)
          .then(bs => {
            // 除了 chapters 和 introduce 之外的，其他都相等
            let b = bs[0];
            this.equalBook(bsid, book, b);
          })
      }));
    },

    // 获取书籍测试回调
    testGetBookCaller(bsid, bsm, books){
      return Promise.all(books.map(book => {
        return bsm.getBook(bsid, book.name, book.author)
          .then(b => {
            this.equalBook(bsid, book, b);
          })
      }));
    },

    // 获取书籍信息测试回调
    testGetBookInfoCaller(bsid, bsm, books){
      return Promise.all(books.map(book => {
        return bsm.getBookInfo(bsid, book)
          .then(b => {
            this.equalBook(bsid, book, b);
          })
      }));
    },

    // 获取最新章节测试回调
    testGetLastestChapterCaller(bsid, bsm, books){
      return Promise.all(books.map(book => {
        return bsm.getLastestChapter(bsid, book)
          .then(lc => {
            equal(true, !!lc, `${book.name}: LastestChapter is null`);
          })
      }));
    },

    // 获取书籍目录测试回调
    testGetBookCatalogCaller(bsid, bsm, books){
      return Promise.all(books.map(book => {
        return bsm.getBookCatalog(bsid, book)
          .then(catalog => {
            assert.isArray(catalog, `${book.name}: catalog is not array`);
            equal(true, catalog.length > 0, `${book.name}: catalog is empty`);
            book.chapters.forEach(chapter => {
              let c = catalog.find(e =>
                Chapter.equalTitle(e, chapter));
              if(!c) throw new Error(`${book.name}: can't find the chapter ${chapter.title} in catalog`);
              equal(chapter.link, c.link, `${book.name}: ${chapter.title} link should be ${c.link}`);
              equal(chapter.cid, c.cid, `${book.name}: ${chapter.title}`);
            });
          })
      }));
    },

    // 获取获取章节内容测试回调
    testGetChapterContentCaller(bsid, bsm, books){
      return Promise.all(books.map(book =>
        Promise.all(book.chapters.map(chapter =>
          bsm.getChapterContent(bsid, Object.assign({}, book, chapter))
            .then(c => {
              equal(true, !!c, `${book.name}: the content of ${chapter.title} is empty`);
              equal(true, c.indexOf(chapter.content) >= 0, `${book.name}: ${chapter.title} doesn't contains ${chapter.content}`);
              assert.notInclude(c, "<br");
            })
        ))
      ))
    },

    // 测试书籍主方法
    testBook(bsid, bsm, books, item){

      let items = {
        search: {
          title: '测试搜索',
          caller: () => this.testSearchCaller(bsid, bsm, books)
        },
        getbook: {
          title: '测试获取书籍',
          caller: () => this.testGetBookCaller(bsid, bsm, books)
        },
        bookinfo: {
          title: '测试获取书籍信息',
          caller: () => this.testGetBookInfoCaller(bsid, bsm, books)
        },
        lastestchapter: {
          title: '测试最新章节',
          caller: () => this.testGetLastestChapterCaller(bsid, bsm, books)
        },
        catalog: {
          title: '测试书籍目录',
          caller: () => this.testGetBookCatalogCaller(bsid, bsm, books)
        },
        chapter: {
          title: '测试获取章节',
          caller: () => this.testGetChapterContentCaller(bsid, bsm, books)
        }
      };

      describe(`BookSource Test: ${bsid}`, () => {
        if(!item)
          for(let k in items){
            let i = items[k];
            it(i.title, i.caller);
          }
        else{
          let i = items[item];
          it(i.title, i.caller);
        }
      });
    },

  };

}));

define(["chai", "util", "BookSourceManager"], function(chai, util, BookSourceManager){

  let assert = chai.assert;
  let equal = assert.equal;


  describe('BookSourceManager 基础测试', () => {

    let bsm;

    before(()=>{
      bsm = new BookSourceManager();
      return bsm.loadConfig("data/booksources.json");
    });

    it('全局搜索', () => {
      return bsm.searchBookInAllBookSource("三生三世十里桃花")
            .then(books => {
              equal(true, books.length >= 0);
              equal("三生三世十里桃花", books.find(b => b.name == "三生三世十里桃花").name);
            })
    });

  });


  // 小说书源测试
  let bsids = ["u17", "comico", "biquge", "biquge.tw", "biqugezw", "biqulou", "chuangshi", "daizhuzai" , "dingdian", "qidian"];

  for(let bsid of bsids){
  // for(let bsid of ['comico']){

    function equalBook(bsid, book, b){
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

    }

    describe(`BookSourceManager 测试：${bsid}`, () => {
      let bsm;
      let config;
      let books;

      before(()=>{
        bsm = new BookSourceManager();
        return Promise.all([bsm.loadConfig("data/booksources.json"),
          util.getJSON("test/BookSourceManager.test.data.json").then(data => {
            config = data;
            books = config[bsid];
          })]);
      });

      it('测试搜索', ()=>{
        return Promise.all(books.map(book => {
          return bsm.searchBook(bsid, book.name)
            .then(bs => {
              // 除了 chapters 和 introduce 之外的，其他都相等
              let b = bs[0];
              equalBook(bsid, book, b);
            })
        }));
      });

      it('测试获取书籍', ()=>{
        return Promise.all(books.map(book => {
          return bsm.getBook(bsid, book.name, book.author)
            .then(b => {
              equalBook(bsid, book, b);
            })
        }));
      });

      it('测试获取书籍信息', ()=>{
        return Promise.all(books.map(book => {
          return bsm.getBookInfo(bsid, book)
            .then(b => {
              equalBook(bsid, book, b);
            })
        }));
      });

      it('测试最新章节', ()=>{
        return Promise.all(books.map(book => {
          return bsm.getLastestChapter(bsid, book)
            .then(lc => {
              equal(true, lc.length > 0);
            })
        }));
      });

      it('测试书籍目录', ()=>{
        return Promise.all(books.map(book => {
          return bsm.getBookCatalog(bsid, book)
            .then(catalog => {
              assert.isArray(catalog);
              equal(true, catalog.length > 0);
              book.chapters.forEach(chapter => {
                equal(true, catalog.findIndex(e => e.title == chapter.title) >= 0);
              });
            })
        }));
      });

      it('测试获取章节', ()=>{
        return Promise.all(books.map(book =>
          Promise.all(book.chapters.map(chapter =>
            bsm.getChapter(bsid, chapter)
              .then(c => {
                equal(chapter.title, c.title);
                equal(chapter.link, c.link);
                equal(true, c.content.length > 0 && c.content.indexOf(chapter.content) >= 0);
                assert.notInclude(c.content, "<br");
              })
          ))
        ))
      });
    });
  }

});

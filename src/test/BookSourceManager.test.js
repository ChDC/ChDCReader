define(["util"], function(util){

  class BookSourceManagerTest{

    constructor(test){
      this.test = test;
    }

    doTest(){
      return this.checkBookSources("data/booksources.test.json", this.test.output, this.test.error);
    }

    // 检查源是否正确
    checkBookSources(testFile, log, error){

      if(!error){
        throw new Error("The argument 'error' is not defined!");
      }

      function check(bsid, testBook){

        function getInfo(){
          return self.sources[bsid].name;
        }

        function* checkBookInfo(bs, book){
          // 测试获取书籍信息
          book = yield bs.getBookInfo(self, book)
            .catch(e => {
              error(getInfo() + " -> 获取书籍信息失败：", e);
              throw e;
            });

          for(const ik in testBook){
            if(ik.match(/^test_/)){
              const testProperty = ik.substring(5);
              if(book[testProperty].match(testBook[ik])){
                log(getInfo() + " -> 测试属性：" + testProperty + " OK")
              }
              else{
                error(getInfo() + " -> 测试属性：" + testProperty + " Wrong!")
              }
            }
          }
        }

        function* checkLastestChapter(bs, book){
          // 测试获取书籍信息
          let [lastestChapter, lastestChapterUpdated] = yield bs.refreshLastestChapter(self, book)
            .catch(e => {
              error(getInfo() + " -> 获取最新章节信息失败：", e);
              throw e;
            });
          if(lastestChapter.length > 0){
            log(getInfo() + " -> 获取最新章节信息：OK")
          }
          else{
            error(getInfo() + " -> 获取最新章节信息：Wrong!")
          }
        }

        function* checkCatalog(bs, book){
          const catalog = yield bs.getCatalog(self, book, true)
            .catch(e => {
              error(getInfo() + " -> 测试目录 Wrong!");
              throw e;
            });

          if(catalog.length <= 0 || !catalog[0].title){
            error(getInfo() + " -> 测试目录 Wrong!");
            return;
          }

          log(getInfo() + " -> 测试目录 OK");

          // 测试获取章节
          const chapter = yield bs.getChapter(catalog[0], false)
            .catch(e => {
              error(getInfo() + " -> 测试章节错误：", e);
              throw e;
            });

          if(chapter.title == catalog[0].title && chapter.content.length > 0)
          {
            log(getInfo() + " -> 测试章节 OK");
          }
          else{
            error(getInfo() + " -> 测试章节 Wrong!");
          }
        }

        return co(function*(){
          log(getInfo() + " -> 测试书籍：" + testBook.name + " by " + testBook.author);
          const book = yield self.getBook(bsid, testBook.name, testBook.author)
            .catch(e => {error(getInfo() + " -> 获取书籍失败：", e); throw e;});

          log(getInfo() + " -> 测试项目：获取书籍 OK");
          const bs = book.sources[bsid];

          // 测试获取书籍信息
          yield checkBookInfo(bs, book);
          // 测试最新章节信息
          yield checkLastestChapter(bs, book);
          // 测试获取目录
          yield checkCatalog(bs, book);
        });

      }

      const self = app.bookSourceManager;
      return co(function*(){
        const data = yield util.getJSON(testFile);
        const taskQueue = [];
        for(const sk in data.sources){
          const books = data.sources[sk];
          for(const book of books){
            if(!(book in data.books)){
              error("没有在测试配置文件中找到书籍：" + book);
            }
            else
              taskQueue.push([sk, data.books[book]]);
          }
        }
        // start to work

        while(taskQueue.length > 0){
          const [bsid, book] = taskQueue.shift();
          log("测试书源：" + self.sources[bsid].name);
          try{
            yield check(bsid, book);
          }
          catch(e)
          {

          }
        }
      }());

    }
  }


  return BookSourceManagerTest;
});


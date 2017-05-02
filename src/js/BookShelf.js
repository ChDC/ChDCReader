;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["BookShelf"] = factory();
}(['co', "utils", 'Book', "Chapter", "ReadingRecord"], function(co, utils, Book, Chapter, ReadingRecord) {
  "use strict"

  // **** BookShelf *****
  class BookShelf{

    constructor(name="bookshelf"){
      this.name = name;
      this.books = [];
      // this.bookmarks = []; // 书签

      utils.addEventSupport(this); // 添加事件机制
    }

    // 获取存储目录的文件路径
    __getSaveCatalogLocation(bookName, bookAuthor, sourceId){
      return `catalog_${bookName}.${bookAuthor}_${sourceId}`;
    }

    // 加载书籍
    load(bookSourceManager){

      const self = this;

      function loadCatalog(bk, bsk){

        const b = self.books[bk].book;
        const bs = b.sources[bsk];
        // 更新目录文件
        utils.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk))
          .then(data => {
            bs.catalog = utils.arrayCast(data, Chapter);
          })
          .catch(error => error); // 忽略错误
      }

      function loadCatalogs(){
        const tasks = [];
        for(const bk in self.books){
          const b = self.books[bk].book;
          for(const bsk in b.sources){
            tasks.push(loadCatalog(bk, bsk));
          }
        }
        return Promise.all(tasks);
      }

      return utils.loadData(this.name)
        .then(data => {
          const bookShelf = data;
          Object.assign(this, bookShelf);
          this.books.forEach(b => {
            b.book = Book.Cast(b.book, bookSourceManager);
            b.readingRecord = utils.objectCast(b.readingRecord, ReadingRecord);
          });
          return loadCatalogs();
        })
        .then(() => this.fireEvent("loadedData"));
    }

    // 保存数据
    save(){
      for(const bk in this.books){
        const b = this.books[bk].book;
        for(const bsk in b.sources){
          const bs = b.sources[bsk];
          if(bs.needSaveCatalog){
            bs.needSaveCatalog = false;
            // 更新目录文件
            utils.saveData(this.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
          }
        }
      }
      return utils.saveTextData(this.name, utils.persistent(this))
        .then(() => this.fireEvent("savedData"));
    }

    newBookShelfItem(book, readingRecord){
      return {
        book: book,
        readingRecord: readingRecord || new ReadingRecord(),
        lockLocation: -1 // 是否锁定了位置
      };
    }

    // 添加书籍到书架中
    addBook(book, readingRecord){
      if(!this.hasBook(book)){
        // 默认添加到开头
        let newItem = this.newBookShelfItem(book, readingRecord);
        this.books.unshift(newItem);
        this.sortBooks();
        this.fireEvent("addedBook", {bookShelfItem: newItem});
        // return this.save();
      }
    }

    toggleLockBook(bookshelfitem){
      if(this.isLockedBook(bookshelfitem))
        bookshelfitem.lockLocation = -1;
      else
        bookshelfitem.lockLocation = this.books.indexOf(bookshelfitem);
    }

    isLockedBook(bookshelfitem){
      return bookshelfitem.lockLocation >= 0;
    }

    // 用特定的排序函数或者新的排序传递进行排序
    sortBooks(functionOrArray){
      let newOrder;
      switch(utils.type(functionOrArray)){
        case "function":
          newOrder = Object.assign([], this.books);
          newOrder.sort(functionOrArray);
          break;

        case "array":
          // 检查是否有效
          if(!functionOrArray.every(e => this.books.indexOf(e) >= 0))
            return false;
          newOrder = functionOrArray;
          break;

        default:
          newOrder = this.books;
          break;
      }

      // 记录锁定的项目
      let lockedItems = this.books.filter(e => this.isLockedBook(e));
      let result = newOrder.filter(e => !this.isLockedBook(e));
      lockedItems.forEach(e => {
        if(e.lockLocation >= this.books.length)
          e.lockLocation = this.books.length - 1;
        result.splice(e.lockLocation, 0, e)
      });
      this.books = result;
      this.fireEvent("sortedBook");
      return true;
    }

    // 判断书架中是否有某书
    hasBook(book){
      if(!book)
        return book;
      return this.books.find(e => {
        const b = e.book;
        return b.name == book.name && b.author == book.author && b.mainSourceId == book.mainSourceId;
      });
    }

    // 删除某书
    removeBook(book){
      let index = this.books.findIndex(e => e.book == book);
      if(index < 0)
        return;

      // 清除目录
      for(const bsk in book.sources){
        const bs = book.sources[bsk];
        utils.removeData(this.__getSaveCatalogLocation(book.name, book.author, bsk));
      }
      this.books.splice(index, 1);
      this.sortBooks();

      // TODO: 清空缓存章节
      this.fireEvent("removedBook", {book: book});
      // return this.save();
    }
  }

  BookShelf.persistentInclude = ["books"];

  return BookShelf;
}));

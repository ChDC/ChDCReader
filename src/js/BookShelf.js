;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["BookShelf"] = factory.apply(undefined, deps.map(e => window[e]));
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

    // 加载书籍
    load(bookSourceManager){

      return utils.loadData(this.name+".json")
        .then(data => {
          const bookShelf = data;
          Object.assign(this, bookShelf);
          this.books.forEach(b => {
            b.book = Book.Cast(b.book, bookSourceManager);
            b.readingRecord = utils.objectCast(b.readingRecord, ReadingRecord);
          });
        })
        .then(() => this.fireEvent("loadedData"));
    }

    // 保存数据
    save(){
      return utils.saveTextData(this.name+".json", utils.persistent(this))
        .then(() => this.fireEvent("savedData"));
    }

    newBookShelfItem(book, readingRecord){
      return {
        book: book,
        readingRecord: readingRecord || new ReadingRecord(),
        settings: {}
        // lockLocation: -1 // 是否锁定了位置
      };
    }

    // 获取 BookShelfItem 的设置
    getBookSettings(book){
      if(!book) return {};
      let bookShelfItem = this.books.find(e => e.book == book);
      if(!bookShelfItem) return {};
      return bookShelfItem.settings || {};
    }

    setBookSettingsValue(book, key, value){
      if(!book) return;
      let bookShelfItem = this.books.find(e => e.book == book);
      if(!bookShelfItem) return;
      if(!bookShelfItem.settings)
        bookShelfItem.settings = {};
      bookShelfItem.settings[key] = value;
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

    // toggleLockBook(bookshelfitem){
    //   if(this.isLockedBook(bookshelfitem))
    //     bookshelfitem.lockLocation = -1;
    //   else
    //     bookshelfitem.lockLocation = this.books.indexOf(bookshelfitem);
    // }

    // isLockedBook(bookshelfitem){
    //   return bookshelfitem.lockLocation >= 0;
    // }

    // 用特定的排序函数或者新的排序传递进行排序
    sortBooks(functionOrArray){
      let newOrder, unIncludedItems;
      switch(utils.type(functionOrArray)){
        case "function":
          newOrder = Object.assign([], this.books);
          newOrder.sort(functionOrArray);
          break;

        case "array":
          // 检查是否每个都是已有的内容
          if(!functionOrArray.every(e => this.books.includes(e)))
            return false;
          newOrder = functionOrArray;
          unIncludedItems = this.books.filter(e => !newOrder.includes(e));
          newOrder = newOrder.concat(unIncludedItems);
          break;

        default:
          newOrder = this.books;
          break;
      }

      // 记录锁定的项目
      // let lockedItems = this.books.filter(e => this.isLockedBook(e));
      // let result = newOrder.filter(e => !this.isLockedBook(e));
      // lockedItems.forEach(e => {
      //   if(e.lockLocation >= this.books.length)
      //     e.lockLocation = this.books.length - 1;
      //   result.splice(e.lockLocation, 0, e)
      // });
      // this.books = result;
      this.books = newOrder;
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
      utils.removeData(`catalog/${book.name}_${book.author}/`, true);
      utils.removeData(`chapter/${book.name}_${book.author}/`, true);
      this.books.splice(index, 1);
      this.sortBooks();
      this.fireEvent("removedBook", {book: book});
      // return this.save();
    }
  }

  BookShelf.persistentInclude = ["books"];

  return BookShelf;
}));

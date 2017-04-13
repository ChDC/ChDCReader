define(['co', "util", 'Book', "ReadingRecord"], function(co, util, Book, ReadingRecord) {
    "use strict"

    // **** BookShelf *****
    class BookShelf{

        constructor(){
            this.loaded = false; // 标记是否已经加载的数据
            this.books = [];
            // this.bookmarks = []; // 书签
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
                util.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk))
                    .then(data => {
                        bs.catalog = data;
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

            return util.loadData("bookshelf")
                .then(data => {
                    const bookShelf = data;
                    Object.assign(this, bookShelf);
                    for(const b of this.books){
                        b.book = Book.Cast(b.book, bookSourceManager);
                        b.readingRecord = util.objectCast(b.readingRecord, ReadingRecord);
                    }
                    return loadCatalogs();
                });
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
                        util.saveData(this.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
                    }
                }
            }

            return util.saveData("bookshelf", util.persistent(this));
        }

        // 添加书籍到书架中
        addBook(book){
            if(!this.hasBook(book)){
                this.books.push({
                    book: book,
                    readingRecord: new ReadingRecord(),
                });
                // return this.save();
            }
        }

        // 判断书架中是否有某书
        hasBook(book){
            return this.books.find(e => {
                const b = e.book;
                return b.name == book.name && b.author == book.author && b.mainSourceId == book.mainSourceId;
            });
        }

        // 判断书架中是否有某书
        removeBook(index){
            // 清除目录
            const b = this.books[index].book;
            for(const bsk in b.sources){
                const bs = b.sources[bsk];
                util.removeData(this.__getSaveCatalogLocation(b.name, b.author, bsk));
            }

            util.arrayRemove(this.books, index);
            // TODO: 清空缓存章节
            // return this.save();
        }
    }

    BookShelf.persistentInclude = ["books"];

    return BookShelf;
});

define(["jquery", "util", 'Book', "BookSource", "ReadingRecord"], function($, util, Book, BookSource, ReadingRecord) {
    "use strict"

    // **** BookShelf *****
    function BookShelf(){
        this.loaded = false; // 标记是否已经加载的数据
        this.books = [];
        // this.bookmarks = []; // 书签
    };
    BookShelf.prototype.books = undefined;


    // 获取存储目录的文件路径
    BookShelf.prototype.__getSaveCatalogLocation = function(bookName, bookAuthor, sourceId){
        let bid = bookName + '.' + bookAuthor;
        let dest = "catalog_" + bid + "_" + sourceId;
        return dest;
    }

    // 加载书籍
    BookShelf.prototype.load = function(success, fail){
        function s(){
            self.loaded = true;
            if(success)success();
        }
        function loadCatalogs(){
            let unfinished = [];
            function checkAllFinished(){
                for(let bk in self.books){
                    let b = self.books[bk].book;
                    for(let bsk in b.sources){
                        if(unfinished[bk][bsk]){
                            return false;
                        }
                    }
                }
                return true;
            }
            function setFinished(bk, bsk){
                unfinished[bk][bsk] = false;
            }
            function initUnfinished(){
                for(let bk in self.books){
                    unfinished[bk] = {};
                    let b = self.books[bk].book;
                    for(let bsk in b.sources){
                        unfinished[bk][bsk] = true;
                    }
                }
            }
            initUnfinished();

            function loadCatalog(bk, bsk){
                let b = self.books[bk].book;
                let bs = b.sources[bsk];
                // 更新目录文件
                util.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk),
                    function(data){
                        bs.catalog = data;
                        setFinished(bk, bsk);
                        if(checkAllFinished())s();
                    },
                    function(){
                        setFinished(bk, bsk);
                        if(checkAllFinished())s();
                    });
            }

            for(let bk in self.books){
                let b = self.books[bk].book;
                for(let bsk in b.sources){
                    loadCatalog(bk, bsk);
                }
            }
        }

        let self = this;
        util.loadData("bookshelf",
            function(data){
                let bookShelf = data;
                $.extend(true, self, bookShelf);
                $(self.books).each(function(){
                    this.book = Book.Cast(this.book);
                    this.readingRecord = util.objectCast(this.readingRecord, ReadingRecord);
                });
                loadCatalogs();
            },
            fail);
    };

    // 保存数据
    BookShelf.prototype.save = function(success, fail){
        let self = this;

        // BUG 原因：没有深拷贝成功
        let catalogs = []; // 用于临时存储移除的 Catalog
        for(let bk in self.books){
            catalogs[bk] = {};
            let b = self.books[bk].book;
            for(let bsk in b.sources){
                let bs = b.sources[bsk];
                if(bs.needSaveCatalog){
                    bs.needSaveCatalog = false;
                    // 更新目录文件
                    util.saveData(self.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
                }
                catalogs[bk][bsk] = bs.catalog;
                bs.catalog = null; // 删除目录用于存储到本地
            }
        }
        util.saveData("bookshelf", self,
            success, fail);

        // 恢复删除的目录
        for(let bk in self.books){
            let b = self.books[bk].book;
            for(let bsk in b.sources){
                let bs = b.sources[bsk];
                bs.catalog = catalogs[bk][bsk];
            }
        }
    };

    // 添加书籍到书架中
    BookShelf.prototype.addBook = function(book, success, fail){
        if(!this.hasBook(book)){
            this.books.push({
                book: book,
                readingRecord: new ReadingRecord(),
            });
            this.save(success);
        }
    };

    // 判断书架中是否有某书
    BookShelf.prototype.hasBook = function(book){
        return this.books.find(e => {
            let b = e.book;
            return b.name == book.name && b.author == book.author && b.mainSourceId == book.mainSourceId;
        });
    };

    // 判断书架中是否有某书
    BookShelf.prototype.removeBook = function(index, success, fail){
        let self = this;
        // 清除目录
        let b = self.books[index].book;
        for(let bsk in b.sources){
            let bs = b.sources[bsk];
            util.removeData(self.__getSaveCatalogLocation(b.name, b.author, bsk));
        }

        util.arrayRemove(self.books, index);
        // TODO: 清空缓存章节
        self.save(success);
    };

    return BookShelf;
});

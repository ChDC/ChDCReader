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
        var bid = bookName + '.' + bookAuthor;
        var dest = "catalog_" + bid + "_" + sourceId;
        return dest;
    }

    // 加载书籍
    BookShelf.prototype.load = function(success, fail){
        function s(){
            self.loaded = true;
            if(success)success();
        }
        function loadCatalogs(){
            var unfinished = [];
            function checkAllFinished(){
                for(var bk in self.books){
                    var b = self.books[bk].book;
                    for(var bsk in b.sources){
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
                for(var bk in self.books){
                    unfinished[bk] = {};
                    var b = self.books[bk].book;
                    for(var bsk in b.sources){
                        unfinished[bk][bsk] = true;
                    }
                }
            }
            initUnfinished();

            function loadCatalog(bk, bsk){
                var b = self.books[bk].book;
                var bs = b.sources[bsk];
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

            for(var bk in self.books){
                var b = self.books[bk].book;
                for(var bsk in b.sources){
                    loadCatalog(bk, bsk);
                }
            }
        }

        var self = this;
        util.loadData("bookshelf",
            function(data){
                var bookShelf = data;
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
        var self = this;

        // BUG 原因：没有深拷贝成功
        var catalogs = []; // 用于临时存储移除的 Catalog
        for(var bk in self.books){
            catalogs[bk] = {};
            var b = self.books[bk].book;
            for(var bsk in b.sources){
                var bs = b.sources[bsk];
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
        for(var bk in self.books){
            var b = self.books[bk].book;
            for(var bsk in b.sources){
                var bs = b.sources[bsk];
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
        var i = util.arrayIndex(this.books, book, function(e1, e2){
            var b = e1.book;
            return b.name == e2.name && b.author == e2.author && b.mainSourceId == e2.mainSourceId;
        });
        if(i >= 0)
            return this.books[i];
        else
            return null;
    };

    // 判断书架中是否有某书
    BookShelf.prototype.removeBook = function(index, success, fail){
        var self = this;
        // 清除目录
        var b = self.books[index].book;
        for(var bsk in b.sources){
            var bs = b.sources[bsk];
            util.removeData(self.__getSaveCatalogLocation(b.name, b.author, bsk));
        }

        util.arrayRemove(self.books, index);
        // TODO: 清空缓存章节
        self.save(success);
    };

    return BookShelf;
});

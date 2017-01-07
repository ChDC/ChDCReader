define(["jquery", "util", 'book'], function($, util, book) {
    "use strict"

    // **** ReadingRecord *****
    function ReadingRecord(){
        this.chapterIndex = 0;
        this.pageScrollTop = 0;
        this.options = {};
    };

    ReadingRecord.prototype.bookName = undefined; // 书名
    ReadingRecord.prototype.bookAuthor = undefined; // 作者
    ReadingRecord.prototype.chapterIndex = undefined; // 章节索引
    ReadingRecord.prototype.chapterTitle = undefined; // 章节标题
    ReadingRecord.prototype.pageScrollTop = undefined; // 章内的页数
    ReadingRecord.prototype.options = undefined; // 附加内容

    // 清除数据
    ReadingRecord.prototype.reset = function(){
        this.chapterIndex = 0;
        this.chapterTitle = "";
        this.pageScrollTop = 0;
        this.options = {};
    }

    // 设置正在读的章节
    ReadingRecord.prototype.setReadingRecord = function(chapterIndex, chapterTitle, options){
        var self = this;
        self.chapterIndex = chapterIndex;
        self.chapterTitle = chapterTitle;
        self.options = options;
    };

    // **** ReadingRecordManager *****
    // 可用于书架的阅读进度，阅读历史，书签
    // function ReadingRecordManager(){
    //     this.records = [];
    // };

    // **** BookShelf *****
    function BookShelf(){
        this.books = [];
        this.sort = [0,1,2,3,4]; // 在书架的显示顺序
        this.readingRecords = []; // 阅读进度
        this.bookmarks = []; // 书签
    };
    BookShelf.prototype.books = undefined;


    // 获取存储目录的文件路径
    BookShelf.prototype.__getSaveCatalogLocation = function(bookName, bookAuthor, sourceId){
        var bid = bookName + '.' + bookAuthor;
        var dest = "catalog_" + bid + "_" + sourceId;
        return dest;
    }

    // 添加书籍到书架中
    BookShelf.prototype.load = function(success, fail){
        function loadCatalogs(){
            var unfinished = [];
            function checkAllFinished(){
                for(var bk in self.books){
                    var b = self.books[bk];
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
                    var b = self.books[bk];
                    for(var bsk in b.sources){
                        unfinished[bk][bsk] = true;
                    }
                }
            }
            initUnfinished();

            for(var bk in self.books){
                var b = self.books[bk];
                for(var bsk in b.sources){
                    var bs = b.sources[bsk];
                    // 更新目录文件
                    util.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk),
                        function(data){
                            bs.catalog = data;
                            setFinished(bk, bsk);
                            if(checkAllFinished() && success)success();
                        },
                        function(){
                            setFinished(bk, bsk);
                            if(checkAllFinished() && success)success();
                        });
                }
            }
        }

        var self = this;
        util.loadData("bookshelf",
            function(data){
                var bookShelf = data;
                $.extend(true, self, bookShelf);
                util.arrayCast(self.books, book.Book);
                util.arrayCast(self.readingRecords, ReadingRecord);
                loadCatalogs();
            },
            fail);
    };

    // 添加书籍到书架中
    BookShelf.prototype.save = function(success, fail){
        var self = this;

        // BUG 原因：没有深拷贝成功
        var catalogs = []; // 用于临时存储移除的 Catalog
        for(var bk in self.books){
            catalogs[bk] = {};
            var b = self.books[bk];
            for(var bsk in b.sources){
                var bs = b.sources[bsk];
                if(bs.updatedCatalog){
                    bs.updatedCatalog = false;
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
            var b = self.books[bk];
            for(var bsk in b.sources){
                var bs = b.sources[bsk];
                bs.catalog = catalogs[bk][bsk];
            }
        }
    };

    // 添加书籍到书架中
    BookShelf.prototype.addBook = function(book, success, fail){
        if(!this.hasBook(book)){
            this.books.push(book);
            this.readingRecords.push(new ReadingRecord());
            this.save(success);
        }
    };

    // 判断书架中是否有某书
    BookShelf.prototype.hasBook = function(book){
        var i = util.arrayIndex(this.books, book, function(e1, e2){
            return e1.name == e2.name && e1.author == e2.author && e1.mainSource == e2.mainSource;
        });
        if(i >= 0)
            return this.books[i];
        else
            return null;
    };

    // **** Return package *****
    return {
        BookShelf: BookShelf,
        ReadingRecord: ReadingRecord
    };
});

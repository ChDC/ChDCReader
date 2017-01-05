define(["jquery", "util", 'book'], function($, util, book) {
    "use strict"

    // **** ReadingRecord *****
    function ReadingRecord(){
        this.chapterIndex = 0;
        this.page = 0;
        this.options = {};
    };

    ReadingRecord.prototype.bookName = undefined; // 书名
    ReadingRecord.prototype.bookAuthor = undefined; // 作者
    ReadingRecord.prototype.chapterIndex = undefined; // 章节索引
    ReadingRecord.prototype.chapterTitle = undefined; // 章节标题
    ReadingRecord.prototype.page = undefined; // 章内的页数
    ReadingRecord.prototype.options = undefined; // 附加内容

    // 清除数据
    ReadingRecord.prototype.reset = function(){
        this.chapterIndex = 0;
        this.chapterTitle = "";
        this.page = 0;
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
        var self = this;
        util.loadJSONFromFile("bookshelf",
            function(data){
                var bookShelf = data;
                $.extend(true, self, bookShelf);
                util.arrayCast(self.books, book.Book);
                for(var bk in self.books){
                    var b = self.books[bk];
                    for(var bsk in b.sources){
                        var bs = b.sources[bsk];
                        // 更新目录文件
                        util.loadJSONFromFile(self.__getSaveCatalogLocation(b.name, b.author, bsk),
                            function(data){
                                bs.catalog = data;
                            });
                    }
                }

                util.arrayCast(self.readingRecords, ReadingRecord);
                if(success)success();
            },
            fail);
    };

    // 添加书籍到书架中
    BookShelf.prototype.save = function(success, fail){
        var self = this;
        var data = $.extend(true, {}, self);
        //TODO: BUG 原因：没有深拷贝成功
        debugger;
        for(var bk in data.books){
            var b = data.books[bk];
            for(var bsk in b.sources){
                var bs = b.sources[bsk];
                if(bs.updatedCatalog){
                    bs.updatedCatalog = false;
                    self.books[bk].sources[bsk].updatedCatalog = false;
                    // 更新目录文件
                    util.saveJSONToFile(self.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
                }
                debugger;
                bs.catalog = null;
            }
        }
        util.saveJSONToFile("bookshelf", data,
            success, fail);
    };

    // 添加书籍到书架中
    BookShelf.prototype.addBook = function(book, success, fail){
        this.books.push(book);
        this.readingRecords.push(new ReadingRecord());
        this.save(success);
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
        BookShelf: BookShelf
    };
});

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
        load(){

            function loadCatalogs(resolve, reject){
                let unfinished = [];
                if(self.books.length <= 0){
                    self.loaded = true;
                    resolve();
                    return;
                }

                // 初始化值
                for(let bk in self.books){
                    unfinished[bk] = {};
                    let b = self.books[bk].book;
                    for(let bsk in b.sources){
                        unfinished[bk][bsk] = true;
                    }
                }

                for(let bk in self.books){
                    let b = self.books[bk].book;
                    for(let bsk in b.sources){
                        loadCatalog(bk, bsk);
                    }
                }

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

                function loadCatalog(bk, bsk){
                    let b = self.books[bk].book;
                    let bs = b.sources[bsk];
                    // 更新目录文件
                    util.loadData(self.__getSaveCatalogLocation(b.name, b.author, bsk))
                        .then(data => {
                            bs.catalog = data;
                            unfinished[bk][bsk] = false;
                            if(checkAllFinished()){
                                self.loaded = true;
                                resolve();
                            }
                        })
                        .catch(error => {
                            unfinished[bk][bsk] = false;
                            if(checkAllFinished()){
                                self.loaded = true;
                                resolve();
                            }
                        });
                }


            }

            let self = this;
            return util.loadData("bookshelf")
                .then(data => {
                    let bookShelf = data;
                    Object.assign(this, bookShelf);
                    for(let b of this.books){
                        b.book = Book.Cast(b.book);
                        b.readingRecord = util.objectCast(b.readingRecord, ReadingRecord);
                    }
                    return new Promise(loadCatalogs);
                })
                .catch(e => e);
        }

        // 保存数据
        save(){

            // BUG 原因：没有深拷贝成功
            let catalogs = []; // 用于临时存储移除的 Catalog
            for(let bk in this.books){
                catalogs[bk] = {};
                let b = this.books[bk].book;
                for(let bsk in b.sources){
                    let bs = b.sources[bsk];
                    if(bs.needSaveCatalog){
                        bs.needSaveCatalog = false;
                        // 更新目录文件
                        util.saveData(this.__getSaveCatalogLocation(b.name, b.author, bsk), bs.catalog);
                    }
                    catalogs[bk][bsk] = bs.catalog;
                    bs.catalog = null; // 删除目录用于存储到本地
                }
            }
            let promise = util.saveData("bookshelf", this);

            // 恢复删除的目录
            for(let bk in this.books){
                let b = this.books[bk].book;
                for(let bsk in b.sources){
                    let bs = b.sources[bsk];
                    bs.catalog = catalogs[bk][bsk];
                }
            }
            return promise;
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
                let b = e.book;
                return b.name == book.name && b.author == book.author && b.mainSourceId == book.mainSourceId;
            });
        }

        // 判断书架中是否有某书
        removeBook(index){
            // 清除目录
            let b = this.books[index].book;
            for(let bsk in b.sources){
                let bs = b.sources[bsk];
                util.removeData(this.__getSaveCatalogLocation(b.name, b.author, bsk));
            }

            util.arrayRemove(this.books, index);
            // TODO: 清空缓存章节
            // return this.save();
        }
    }

    return BookShelf;
});

"use strict"
define(["jquery", "main", "page", "util", 'book'], function($, app, page, util, booklib){

    function isReadingLastestChapter(book, readingRecord){
        return booklib.Chapter.equalTitle2(book.lastestChapter, readingRecord.chapterTitle);
    }

    // 加载书架列表
    function loadBooks(id, bookShelf){
        var books = bookShelf.books;
        var bs = $(id);
        bs.empty();
        var b = $(".template .book");
        $(books).each(function(i){
            var readingRecord = bookShelf.readingRecords[i];
            var book = this;
            var nb = b.clone();
            if(book.cover)
                nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            nb.find(".book-lastestchapter")
                .text("最新章节：" + (book.lastestChapter? book.lastestChapter : "无"))
                .css('color', isReadingLastestChapter(book, readingRecord)? 'black' : 'red');
            // 刷新最新章节
            book.refreshLastestChapter(function(updated){
                if(updated){
                    debugger;
                    nb.find(".book-lastestchapter")
                    .text("最新章节：" + (book.lastestChapter? book.lastestChapter : "无"))
                    .css('color', isReadingLastestChapter(book, readingRecord)? 'black' : 'red');
                }
            }, null, {bookSourceManager: app.bookSourceManager});
            nb.click(function(){
                var params = {
                    book: book,
                    readingRecord: bookShelf.readingRecords[i]
                };
                page.showPage("readbook", params);
            });
            bs.append(nb);
        });
    };

    function loadView(){
        $("#btnCheckUpdate").click(function(){
            app.chekcUpdate();
        });
        $(".btnSearch").click(function(){
            page.showPage("search");
        });
    }

    return {
        onload: function(params){
            loadView();
        },
        onresume: function(){
            app.bookShelf.load(function(){
                loadBooks(".bookshelf", app.bookShelf);
            });
        },
        onpause: function(){

        },
        onclose: function(params){

        }
    };
});


"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){

    // 加载书架列表
    function loadBooks(id, bookShelf){
        var books = bookShelf.books;
        var bs = $(id);
        bs.empty();
        var b = $(".template .book");
        $(books).each(function(i){
            var book = this;
            var nb = b.clone();
            if(book.cover)
                nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            nb.find(".book-lastestchapter").text("最新章节：" + (book.lastestChapter? book.lastestChapter : "无"));
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
    }

    return {
        onload: function(params){
            loadView();
            app.bookShelf.load();
            $(".btnSearch").click(function(){
                page.showPage("search");
            });
        },
        onresume: function(){
            loadBooks(".bookshelf", app.bookShelf);
        },
        onpause: function(){

        },
        onclose: function(params){

        }
    };
});


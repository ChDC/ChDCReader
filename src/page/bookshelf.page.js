"use strict"
define(["jquery", "main", "page", "util", 'Chapter'], function($, app, page, util, Chapter){

    function isReadingLastestChapter(lastestChapter, readingRecord){
        return Chapter.equalTitle2(lastestChapter, readingRecord.chapterTitle);
    }

    function removeBook(event){
        var target = $(event.currentTarget);
        var i = target.data('book-index');
        app.bookShelf.removeBook(i, function(){
            loadBooks(".bookshelf", app.bookShelf);
        });
        return false;
    }

    // 加载书架列表
    function loadBooks(id, bookShelf){
        var books = bookShelf.books;
        var bs = $(id);
        bs.empty();
        var b = $(".template .book");
        $(books).each(function(i){
            var self = this;
            var readingRecord = this.readingRecord;
            var book = this.book;

            var nb = b.clone();
            if(book.cover)
                nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            nb.find(".book-readingchapter").text('读到：' + readingRecord.chapterTitle);

            // 刷新最新章节
            book.getLastestChapter(function(lastestChapter){
                nb.find(".book-lastestchapter")
                    .text("最新章节：" + (lastestChapter? lastestChapter : "无"))
                    .css('color', isReadingLastestChapter(lastestChapter, readingRecord)? 'black' : 'red');
            }, null, {bookSourceManager: app.bookSourceManager});

            nb.click(function(){
                page.showPage("readbook", self);
            });

            nb.find('.btnBookMenu').click(function(event){
                $(event.currentTarget).dropdown();
                return false;
            }).dropdown();

            nb.find('.btnRemoveBook').click(removeBook).data('book-index', i);
            bs.append(nb);
        });
    };

    function loadView(){
        $("#btnCheckUpdate").click(function(){
            app.chekcUpdate(true, true);
        });
        $("#btnCheckBookSources").click(function(){
            $('#output').empty();
            app.bookSourceManager.checkBookSources("data/booksourcesTest.json",
                function(msg){
                    $('#output').append($('<p>').text(msg));
                },
                function(msg, error){
                    if(error)
                        msg += "(" + error.id + ", " + error.message + ')\n';
                    $('#output').append($('<p class="error">').text(msg));
                },
                function(){
                    $('#output').append($('<p>').text("完成！"));
                });
        });
        $(".btnSearch").click(function(){
            page.showPage("search");
        });

        $("#btnTest").click(function(){
            app.bookSourceManager.qidian.init();
        });
    }

    return {
        onload: function(params){
            loadView();
        },
        onresume: function(){
            if(app.bookShelf.loaded){
                loadBooks(".bookshelf", app.bookShelf);
            }
            else{
                app.bookShelf.load(function(){
                    loadBooks(".bookshelf", app.bookShelf);
                });
            }
        },
        onpause: function(){

        },
        onclose: function(params){

        }
    };
});


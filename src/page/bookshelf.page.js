"use strict"
define(["jquery", "main", "page", "util", 'Chapter'], function($, app, page, util, Chapter){

    function isReadingLastestChapter(lastestChapter, readingRecord){
        return Chapter.equalTitle2(lastestChapter, readingRecord.chapterTitle);
    }

    function removeBook(event){
        let target = $(event.currentTarget);
        let i = target.data('book-index');
        app.bookShelf.removeBook(i);
        loadBooks(".bookshelf", app.bookShelf);
        return false;
    }

    // 加载书架列表
    function loadBooks(id, bookShelf){
        let books = bookShelf.books;
        let bs = $(id);
        bs.empty();
        let b = $(".template .book");
        $(books).each(function(i){
            let readingRecord = this.readingRecord;
            let book = this.book;

            let nb = b.clone();
            if(book.cover)
                nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            nb.find(".book-readingchapter").text('读到：' + readingRecord.chapterTitle);

            // 刷新最新章节
            book.getLastestChapter({bookSourceManager: app.bookSourceManager})
                .then(([lastestChapter]) => {
                    nb.find(".book-lastestchapter")
                        .text("最新章节：" + (lastestChapter? lastestChapter : "无"))
                        .css('color', isReadingLastestChapter(lastestChapter, readingRecord)? 'black' : 'red');
                });

            nb.click(() => page.showPage("readbook", this));

            nb.find('.btnBookMenu').click(event => {
                $(event.currentTarget).dropdown();
                return false;
            }).dropdown();

            nb.find('.btnRemoveBook').click(removeBook).data('book-index', i);
            bs.append(nb);
        });
    };

    function loadView(){
        $("#btnCheckUpdate").click(e => app.chekcUpdate(true, true));
        $("#btnCheckBookSources").click(e => {
            $('#output').empty();
            app.bookSourceManager.checkBookSources("data/booksourcesTest.json",
                msg => $('#output').append($('<p>').text(msg)),
                (msg, error) => {
                    if(error)
                        msg += `(${error}, ${app.error.getMessage(error)})\n`;
                    $('#output').append($('<p class="error">').text(msg));
                })
                .then(() => $('#output').append($('<p>').text("完成！")));
        });
        $(".btnSearch").click(e => page.showPage("search"));

        $("#btnTest").click(e => app.bookSourceManager.qidian.init());
    }

    return {
        onload(params){
            loadView();
        },
        onresume(){
            if(app.bookShelf.loaded){
                loadBooks(".bookshelf", app.bookShelf);
            }
            else{
                app.bookShelf.load()
                    .then(() => loadBooks(".bookshelf", app.bookShelf));
            }
        },
        onpause(){

        },
        onclose(params){

        }
    };
});


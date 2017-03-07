"use strict"
define(["jquery", "main", "page", "util", 'Chapter', 'sortablejs'], function($, app, page, util, Chapter, sortablejs){

    function isReadingLastestChapter(lastestChapter, readingRecord){
        return Chapter.equalTitle2(lastestChapter, readingRecord.chapterTitle);
    }

    function removeBook(event){
        let target = $(event.currentTarget);
        let i = target.data('book-index');
        app.bookShelf.removeBook(i);
        app.bookShelf.save()
            .then(() => {
                util.showMessage("删除成功！");
                loadBooks(".bookshelf", app.bookShelf);
            })
            .catch(error => {
                util.showError("删除失败！");
                loadBooks(".bookshelf", app.bookShelf);
            });
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
                        .text("最新：" + (lastestChapter? lastestChapter : "无"))
                        .css('color', isReadingLastestChapter(lastestChapter, readingRecord)? 'black' : 'red');

                    // 缓存后面章节内容
                    book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount, {bookSourceManager: app.bookSourceManager});
                });

            nb.find('.book-cover, .book-info').click(() => page.showPage("readbook", this));

            nb.find('.btnBookMenu').click(event => {
                $(event.currentTarget).dropdown();
                return false;
            }).dropdown();

            nb.data('book-index', i);

            nb.find('.btnRemoveBook').click(removeBook).data('book-index', i);
            bs.append(nb);
        });
    };

    // 重新给所有书籍排序
    function sortBooksByElementOrde(){
        let newBooks = [];
        let elements = $(".bookshelf").children();
        let length = elements.length;

        for(let i = 0; i < length; i++){
            newBooks[i] = app.bookShelf.books[$(elements[i]).data('book-index')];
        }
        if(newBooks.length == app.bookShelf.books.length)
            app.bookShelf.books = newBooks;
    }

    function loadView(){
        sortablejs.create($(".bookshelf")[0],
                        {
                            handle: ".btnBookMenu",
                            animation: 150,
                            // Changed sorting within list
                            onUpdate: function (event) {
                                // 更新并保存顺序
                                sortBooksByElementOrde();
                            },
                        });
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


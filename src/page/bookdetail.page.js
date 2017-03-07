"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){

    // 加载书籍详情
    function loadBookDetail(id, book, bookSourceId){
        let nb = $(id);
        if(book.cover)
            nb.find(".book-cover").attr("src", book.cover);
        nb.find(".book-name").text(book.name);
        // nb.find(".book-lastestchapter").text("最新章节：" + (book.getLastestChapter()? book.getLastestChapter() : "无"));
        nb.find(".book-author").text(book.author);
        nb.find(".book-catagory").text(book.catagory);
        nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
        nb.find(".book-introduce").text(book.introduce);

        nb.find(".btnRead").click( e => page.showPage("readbook", {
                bookSourceId: bookSourceId,
                book: book
            }));

        if(app.bookShelf.hasBook(book)){
            nb.find(".btnAddToBookshelf").hide();
        }
        else{
            nb.find(".btnAddToBookshelf").click(e => {
                app.bookShelf.addBook(book);

                $(event.currentTarget).attr("disabled", "disabled");
                app.bookShelf.save()
                    .then(() => {
                        util.showMessage("添加成功！");
                        book.checkBookSources(app.bookSourceManager);
                        // 缓存
                        book.cacheChapter(0, app.settings.settings.cacheChapterCount, {bookSourceManager: app.bookSourceManager});
                    })
                    .catch(error => {
                        $(event.currentTarget).removeAttr("disabled");
                    });

            });
        }
    };

    // 加载章节列表
    function loadBookChapters(id, book, bookSourceId){

        let bookChapter = $(id);
        let c = $(".template .book-chapter");
        bookChapter.empty();
        book.getCatalog({bookSourceManager: app.bookSourceManager,
                            bookSourceId: bookSourceId
                        })
            .then(catalog => {
                for(let chapter of catalog){
                    let nc = c.clone();
                    nc.text(chapter.title);
                    nc.click(e => {
                        // TODO: 打开阅读页面
                    });
                    bookChapter.append(nc);
                };
            })
            .catch(error => util.showError(app.error.getMessage(error)));
    };

    function loadView(params){

        loadBookDetail(".book", params.book, params.bookSourceId);
        loadBookChapters(".book-chapters", params.book, params.bookSourceId);
    }

    return {
        onload(params, p){
            loadView(params);
        },
        onresume(){

        },
        onpause(){

        },
        onclose(params){

        }
    };
});

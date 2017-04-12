"use strict"
define(["jquery", "main", "Page", "util"], function($, app, Page, util){

    class MyPage extends Page{

        onLoad(params, p){
            this.loadView(params);
        }

        // 加载书籍详情
        loadBookDetail(id, book, bookSourceId){
            const nb = $(id);
            if(book.cover)
                nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            // nb.find(".book-lastestchapter").text("最新章节：" + (book.getLastestChapter()? book.getLastestChapter() : "无"));
            nb.find(".book-author").text(book.author);
            nb.find(".book-catagory").text(book.catagory);
            nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
            nb.find(".book-introduce").text(book.introduce);

            nb.find(".btnRead").click( e => app.page.showPage("readbook", {
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
                            book.checkBookSources();
                            // 缓存
                            book.cacheChapter(0, app.settings.settings.cacheChapterCount);
                        })
                        .catch(error => {
                            $(event.currentTarget).removeAttr("disabled");
                        });

                });
            }
        }

        // 加载章节列表
        loadBookChapters(id, book, bookSourceId){

            const bookChapter = $(id);
            const c = $(".template .book-chapter");
            bookChapter.empty();
            book.getCatalog(false, bookSourceId)
                .then(catalog => {
                    for(const chapter of catalog){
                        const nc = c.clone();
                        nc.text(chapter.title);
                        nc.click(e => {
                            // TODO: 打开阅读页面
                        });
                        bookChapter.append(nc);
                    };
                })
                .catch(error => util.showError(app.error.getMessage(error)));
        }

        loadView(params){

            this.loadBookDetail(".book", params.book, params.bookSourceId);
            this.loadBookChapters(".book-chapters", params.book, params.bookSourceId);
        }

    }

    return MyPage;
});

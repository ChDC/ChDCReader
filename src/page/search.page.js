"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){

    // 加载结果列表
    function loadBooks(id, books, bookSourceId){
        const bs = $(id);
        const b = $(".template .book");
        bs.empty();
        for(const book of books){
            const nb = b.clone();
            if(book.cover)
                nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            // nb.find(".book-lastestchapter").text("最新章节：" + (book.getLastestChapter()? book.getLastestChapter() : "无"));
            nb.find(".book-author").text(book.author);
            nb.find(".book-catagory").text(book.catagory);
            nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
            nb.find(".book-introduce").text(book.introduce);

            if(app.bookShelf.hasBook(book)){
                nb.find(".btnAddToBookshelf").attr('disabled', 'disabled');
            }
            else{
                nb.find(".btnAddToBookshelf").click(event => {
                    app.bookShelf.addBook(book);

                    $(event.currentTarget).attr("disabled", "disabled");
                    app.bookShelf.save()
                        .then(()=>{
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
            nb.find(".btnDetail").click(e => page.showPage("bookdetail", {
                        bookSourceId: bookSourceId,
                        book: book
                    }));
            bs.append(nb);
        }
    };

    function search(){
        app.showLoading();
        const keyword = $(".keyword").val();
        const bookSourceId = $(".bookSource").val();
        $('.result').empty();
        if(!keyword || !bookSourceId){
            util.showError("请输入要搜索的关键字");
            return;
        }

        app.bookSourceManager.searchBook(bookSourceId, keyword)
            .then(books => {
                app.hideLoading();
                loadBooks(".result", books, bookSourceId);
            })
            .catch(error => {
                app.hideLoading();
                util.showError(app.error.getMessage(error));
            });
    }

    function loadView(){
        // 添加选项
        const bookSource = $(".bookSource");
        const keys = app.bookSourceManager.getSourcesKeysByMainSourceWeight().reverse();
        for(const bskey of keys)
        {
            const bs = app.bookSourceManager.sources[bskey];
            const newOption = `<option value ="${bskey}">${bs.name}</option>`;
            bookSource.append(newOption);
        }
        $("#btnClose").click(e => page.closePage());
        $(".btnSearch").click(search);
        $(".keyword").on('keydown', event => event.keyCode==13 && search());
        $(".keyword").on('focus', event => event.currentTarget.select());
    }

    return {
        onload(params, baseurl){
            loadView();
        },
        onresume(){

        },
        onpause(){

        },
        onclose(params){

        }
    };
});

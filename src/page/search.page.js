"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){

    // 加载结果列表
    function loadBooks(id, books, bookSourceId){
        var bs = $(id);
        var b = $(".template .book");
        bs.empty();
        $(books).each(function(){
            var book = this;
            var nb = b.clone();
            if(book.cover)
                nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            // nb.find(".book-lastestchapter").text("最新章节：" + (book.getLastestChapter()? book.getLastestChapter() : "无"));
            nb.find(".book-author").text(book.author);
            nb.find(".book-catagory").text(book.catagory);
            nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
            nb.find(".book-introduce").text(book.introduce);
            var bookDetailEvent = function(book){
                return function(){
                    var params = {
                        bookSourceId: bookSourceId,
                        book: book
                    };
                    page.showPage("bookdetail", params);
                };
            }(book);

            if(app.bookShelf.hasBook(book)){
                nb.find(".btnAddToBookshelf").attr('disabled', 'disabled');
            }
            else{
                nb.find(".btnAddToBookshelf").click(function(event){
                    app.bookShelf.addBook(book, function(){
                        util.showMessage("添加成功！");
                        $(event.currentTarget).attr("disabled", "disabled");
                    });
                });
            }
            nb.find(".btnDetail").click(bookDetailEvent);
            bs.append(nb);
        })
    };

    function search(){
        app.showLoading();
        var keyword = $(".keyword").val();
        var bookSourceId = $(".bookSource").val();
        $('.result').empty();
        if(keyword && bookSourceId){
            app.bookSourceManager.searchBook(bookSourceId, keyword,
                    function(books){
                        loadBooks(".result", books, bookSourceId);
                        app.hideLoading();
                    },
                    function(error){
                        util.showError(error.message);
                        app.hideLoading();
                    });
        }
    }

    function loadView(){
        // 添加选项
        var bookSource = $(".bookSource");
        var keys = app.bookSourceManager.getSourcesKeysByMainSourceWeight().reverse();
        for(var i = 0; i < keys.length; i++)
        {
            var bskey = keys[i];
            var bs = app.bookSourceManager.sources[bskey];
            var newOption = '<option value ="'+ bskey + '">' + bs.name + '</option>';
            bookSource.append(newOption);
        }
        $("#btnClose").click(function(){page.closePage();});
        $(".btnSearch").click(search);
        $(".keyword").on('keydown', function(event){
            if(event.keyCode==13){
                search();
            }
        });
        $(".keyword").on('focus', function(event){
            event.currentTarget.select();
        });
    }

    return {
        onload: function(params, baseurl){
            loadView();
        },
        onresume: function(){

        },
        onpause: function(){

        },
        onclose: function(params){

        }
    };
});

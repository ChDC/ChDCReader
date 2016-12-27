"use strict"
define(["jquery", "main", "page", "util"], function($, app, page, util){
    var book = null;
    var readingRecord = null;
    var options = null;

    function fail(error){
        util.showError(error.message);
    }

    // 设置正在读的章节
    var setReadingRecord = function(chapterIndex, chapterTitle){
        readingRecord.chapterIndex = chapterIndex;
        readingRecord.chapterTitle = chapterTitle;
    };

    // 获取当前章节
    var loadCurrentChapter = function(offset){
        var offset = offset || 0;
        if(!readingRecord.chapterIndex)
            readingRecord.chapterIndex = 0;
        loadChapter(readingRecord.chapterIndex + offset);
    };

    function btnNext(event){
        loadCurrentChapter(1);
    }

    function btnLast(event){
        loadCurrentChapter(-1);
    }

    function loadView(){
        // 弹出工具栏
        $(".chapter").on("click", function(){
            $('.toolbar').toggle();
        });
        $(".toolbar").click(function(){
            $('.toolbar').toggle();
        });
        $(".btnNext").click(btnNext);
        $(".btnLast").click(btnLast);

        // 按钮事件
        $("#btnClose").click(function(){page.closePage();});
        $("#btnBookShelf").click(function(){page.showPage("bookshelf", null, {clear: true});});
       // $("#btnCatalog").click(function(){$('#modalCatalog').modal('show');});
        $("#btnChangeMainContentSource").click(function(){
            $("#modalBookSource").modal('show');
            loadBookSource("mainContentSource");
        });
        $("#btnChangeMainCatalogSource").click(function(){
            $("#modalBookSource").modal('show');
            loadBookSource("mainCatalogSource");
        });
        // $('#modalCatalog').on('show.bs.modal', function (e) {
        //     $("#modalCatalog .modal-body").css("height", $());
        // });
        $(".labelCurrentSource").text(app.bookSourceManager.sources[book.currentSource].name);
        $("#btnRefreshCatalog").click(function(){
            loadCatalog(true);
        });
    };

    function loadBookSource(){
        var self = this;
        var listBookSource = $("#listBookSource");
        listBookSource.empty();
        var listBookSourceEntry = $(".template .listBookSourceEntry");
        for(var bsk in app.bookSourceManager.sources){
            var nlbse = listBookSourceEntry.clone();
            var bs = app.bookSourceManager.sources[bsk];
            nlbse.find(".bookSourceTitle").text(bs.name);
            var lastestChapter = "";
            // TODO: 最新章节
            nlbse.find(".bookSourceLastestChapter").text(lastestChapter);
            nlbse.data("bsid", bsk);
            nlbse.click(changeMainContentSourceClickEvent);
            listBookSource.append(nlbse);
        };

        function changeMainContentSourceClickEvent(event){
            var target = event.currentTarget;
            if(target){
                var bid = $(target).data('bsid');
                book.setCurrentSource(bid, function(book){
                    // 更新源之后
                    // 刷新主目录源显示内容
                    $(".labelCurrentSource").text(app.bookSourceManager.sources[book.currentSource].name);
                    // 刷新目录
                    loadCatalog();
                    if(readingRecord.chapterTitle)
                    {
                        book.fuzzySearch(readingRecord.chapterTitle,
                            function(chapter, chapterIndex){
                                readingRecord.chapterIndex = chapterIndex;
                                readingRecord.chapterTitle = chapter.title;

                                // 刷新当前章节信息
                                loadChapter();
                            },
                            function(){
                                readingRecord.chapterIndex = 0;
                                readingRecord.chapterTitle = "";

                                // 刷新当前章节信息
                                loadChapter();
                        }, options);
                    }
                }, fail, options);
            }
        }
    }

    function loadChapter(chapterIndex){
        book.getChapter(chapterIndex, renderChapter, fail, options);
    };

    function renderChapter(chapter, chapterIndex){
        setReadingRecord(chapterIndex, chapter.title);
        app.bookShelf.save();
        $(".chapter-title").text(chapter.title);
        $(".chapter-content").html(util.text2html(chapter.content, 'chapter-p'));
        window.scrollTo(0, readingRecord.page);
        // $("#modalCatalog").modal('hide');
    };

    function loadCatalog(forceRefresh){
        function listCatalogEntryClick(event){
            var target = event.currentTarget;
            if(target){
                target = $(target);
                loadChapter(target.data('index'));
            }
        }
        book.getCatalog(function(catalog){
            var listCatalog = $("#listCatalog");
            var listCatalogEntry = $(".template .listCatalogEntry");
            listCatalog.empty();
            $(catalog).each(function(i){
                var lce = listCatalogEntry.clone();
                lce.text(this.title);
                lce.data("index", i);
                lce.click(listCatalogEntryClick);
                listCatalog.append(lce);
            });
            if(forceRefresh){
                util.showMessage("目录刷新成功！");
            }
        }, fail, {bookSourceManager: app.bookSourceManager, forceRefresh:forceRefresh});
    }

    return {
        onload: function(params, p){
            debugger;
            book = params.book;
            readingRecord = params.readingRecord;
            options = {bookSourceManager: app.bookSourceManager};

            loadView();
            loadCurrentChapter();
            loadCatalog();
        },
        onresume: function(){

        },
        onpause: function(){

        },
        onclose: function(params){

        }
    };
});

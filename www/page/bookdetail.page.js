"use strict";

define(["jquery", "main", "page", "util"], function ($, app, page, util) {
    function loadBookDetail(id, book, bookSourceId) {
        var nb = $(id);
        if (book.cover) nb.find(".book-cover").attr("src", book.cover);
        nb.find(".book-name").text(book.name);

        nb.find(".book-author").text(book.author);
        nb.find(".book-catagory").text(book.catagory);
        nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
        nb.find(".book-introduce").text(book.introduce);

        nb.find(".btnRead").click(function (e) {
            return page.showPage("readbook", {
                bookSourceId: bookSourceId,
                book: book
            });
        });

        if (app.bookShelf.hasBook(book)) {
            nb.find(".btnAddToBookshelf").hide();
        } else {
            nb.find(".btnAddToBookshelf").click(function (e) {
                app.bookShelf.addBook(book);

                $(event.currentTarget).attr("disabled", "disabled");
                app.bookShelf.save().then(function () {
                    util.showMessage("添加成功！");
                    book.checkBookSources(app.bookSourceManager);

                    book.cacheChapter(0, app.settings.settings.cacheChapterCount, { bookSourceManager: app.bookSourceManager });
                }).catch(function (error) {
                    $(event.currentTarget).removeAttr("disabled");
                });
            });
        }
    };

    function loadBookChapters(id, book, bookSourceId) {

        var bookChapter = $(id);
        var c = $(".template .book-chapter");
        bookChapter.empty();
        book.getCatalog({ bookSourceManager: app.bookSourceManager,
            bookSourceId: bookSourceId
        }).then(function (catalog) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = catalog[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var chapter = _step.value;

                    var nc = c.clone();
                    nc.text(chapter.title);
                    nc.click(function (e) {});
                    bookChapter.append(nc);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            ;
        }).catch(function (error) {
            return util.showError(app.error.getMessage(error));
        });
    };

    function loadView(params) {

        loadBookDetail(".book", params.book, params.bookSourceId);
        loadBookChapters(".book-chapters", params.book, params.bookSourceId);
    }

    return {
        onload: function onload(params, p) {
            loadView(params);
        },
        onresume: function onresume() {},
        onpause: function onpause() {},
        onclose: function onclose(params) {}
    };
});
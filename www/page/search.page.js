"use strict";

define(["jquery", "main", "page", "util"], function ($, app, page, util) {
    function loadBooks(id, books, bookSourceId) {
        var bs = $(id);
        var b = $(".template .book");
        bs.empty();
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            var _loop = function _loop() {
                var book = _step.value;

                var nb = b.clone();
                if (book.cover) nb.find(".book-cover").attr("src", book.cover);
                nb.find(".book-name").text(book.name);

                nb.find(".book-author").text(book.author);
                nb.find(".book-catagory").text(book.catagory);
                nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
                nb.find(".book-introduce").text(book.introduce);

                if (app.bookShelf.hasBook(book)) {
                    nb.find(".btnAddToBookshelf").attr('disabled', 'disabled');
                } else {
                    nb.find(".btnAddToBookshelf").click(function (event) {
                        app.bookShelf.addBook(book);
                        util.showMessage("添加成功！");

                        book.checkBookSources(app.bookSourceManager);

                        book.cacheChapter(0, app.settings.settings.cacheChapterCount, { bookSourceManager: app.bookSourceManager });
                        $(event.currentTarget).attr("disabled", "disabled");
                    });
                }
                nb.find(".btnDetail").click(function (e) {
                    return page.showPage("bookdetail", {
                        bookSourceId: bookSourceId,
                        book: book
                    });
                });
                bs.append(nb);
            };

            for (var _iterator = books[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                _loop();
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
    };

    function search() {
        app.showLoading();
        var keyword = $(".keyword").val();
        var bookSourceId = $(".bookSource").val();
        $('.result').empty();
        if (!keyword || !bookSourceId) {
            util.showError("请输入要搜索的关键字");
            return;
        }

        app.bookSourceManager.searchBook(bookSourceId, keyword).then(function (books) {
            app.hideLoading();
            loadBooks(".result", books, bookSourceId);
        }).catch(function (error) {
            app.hideLoading();
            util.showError(app.error.getMessage(error));
        });
    }

    function loadView() {
        var bookSource = $(".bookSource");
        var keys = app.bookSourceManager.getSourcesKeysByMainSourceWeight().reverse();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var bskey = _step2.value;

                var bs = app.bookSourceManager.sources[bskey];
                var newOption = "<option value =\"" + bskey + "\">" + bs.name + "</option>";
                bookSource.append(newOption);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        $("#btnClose").click(function (e) {
            return page.closePage();
        });
        $(".btnSearch").click(search);
        $(".keyword").on('keydown', function (event) {
            return event.keyCode == 13 && search();
        });
        $(".keyword").on('focus', function (event) {
            return event.currentTarget.select();
        });
    }

    return {
        onload: function onload(params, baseurl) {
            loadView();
        },
        onresume: function onresume() {},
        onpause: function onpause() {},
        onclose: function onclose(params) {}
    };
});
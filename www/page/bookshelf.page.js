"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

define(["jquery", "main", "page", "util", 'Chapter', 'sortablejs'], function ($, app, page, util, Chapter, sortablejs) {

    function isReadingLastestChapter(lastestChapter, readingRecord) {
        return Chapter.equalTitle2(lastestChapter, readingRecord.chapterTitle);
    }

    function removeBook(event) {
        var target = $(event.currentTarget);
        var i = target.data('book-index');
        app.bookShelf.removeBook(i);
        loadBooks(".bookshelf", app.bookShelf);
        return false;
    }

    function loadBooks(id, bookShelf) {
        var books = bookShelf.books;
        var bs = $(id);
        bs.empty();
        var b = $(".template .book");
        $(books).each(function (i) {
            var _this = this;

            var readingRecord = this.readingRecord;
            var book = this.book;

            var nb = b.clone();
            if (book.cover) nb.find(".book-cover").attr("src", book.cover);
            nb.find(".book-name").text(book.name);
            nb.find(".book-readingchapter").text('读到：' + readingRecord.chapterTitle);

            book.getLastestChapter({ bookSourceManager: app.bookSourceManager }).then(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 1),
                    lastestChapter = _ref2[0];

                nb.find(".book-lastestchapter").text("最新：" + (lastestChapter ? lastestChapter : "无")).css('color', isReadingLastestChapter(lastestChapter, readingRecord) ? 'black' : 'red');

                book.cacheChapter(readingRecord.chapterIndex + 1, app.settings.settings.cacheChapterCount, { bookSourceManager: app.bookSourceManager });
            });

            nb.find('.book-cover, .book-info').click(function () {
                return page.showPage("readbook", _this);
            });

            nb.find('.btnBookMenu').click(function (event) {
                $(event.currentTarget).dropdown();
                return false;
            }).dropdown();

            nb.data('book-index', i);

            nb.find('.btnRemoveBook').click(removeBook).data('book-index', i);
            bs.append(nb);
        });
    };

    function sortBooksByElementOrde() {
        var newBooks = [];
        var elements = $(".bookshelf").children();
        var length = elements.length;

        for (var i = 0; i < length; i++) {
            newBooks[i] = app.bookShelf.books[$(elements[i]).data('book-index')];
        }
        if (newBooks.length == app.bookShelf.books.length) app.bookShelf.books = newBooks;
    }

    function loadView() {
        sortablejs.create($(".bookshelf")[0], {
            handle: ".btnBookMenu",
            animation: 150,

            onUpdate: function onUpdate(event) {
                sortBooksByElementOrde();
            }
        });
        $("#btnCheckUpdate").click(function (e) {
            return app.chekcUpdate(true, true);
        });
        $("#btnCheckBookSources").click(function (e) {
            $('#output').empty();
            app.bookSourceManager.checkBookSources("data/booksourcesTest.json", function (msg) {
                return $('#output').append($('<p>').text(msg));
            }, function (msg, error) {
                if (error) msg += "(" + error + ", " + app.error.getMessage(error) + ")\n";
                $('#output').append($('<p class="error">').text(msg));
            }).then(function () {
                return $('#output').append($('<p>').text("完成！"));
            });
        });
        $(".btnSearch").click(function (e) {
            return page.showPage("search");
        });

        $("#btnTest").click(function (e) {
            return app.bookSourceManager.qidian.init();
        });
    }

    return {
        onload: function onload(params) {
            loadView();
        },
        onresume: function onresume() {
            if (app.bookShelf.loaded) {
                loadBooks(".bookshelf", app.bookShelf);
            } else {
                app.bookShelf.load().then(function () {
                    return loadBooks(".bookshelf", app.bookShelf);
                });
            }
        },
        onpause: function onpause() {},
        onclose: function onclose(params) {}
    };
});
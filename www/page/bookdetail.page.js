"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "util"], function ($, app, Page, util) {
    var MyPage = function (_Page) {
        _inherits(MyPage, _Page);

        function MyPage() {
            _classCallCheck(this, MyPage);

            return _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).apply(this, arguments));
        }

        _createClass(MyPage, [{
            key: "onLoad",
            value: function onLoad(params, p) {
                this.loadView(params);
            }
        }, {
            key: "loadBookDetail",
            value: function loadBookDetail(id, book, bookSourceId) {
                var nb = $(id);
                if (book.cover) nb.find(".book-cover").attr("src", book.cover);
                nb.find(".book-name").text(book.name);

                nb.find(".book-author").text(book.author);
                nb.find(".book-catagory").text(book.catagory);
                nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
                nb.find(".book-introduce").text(book.introduce);

                nb.find(".btnRead").click(function (e) {
                    return app.page.showPage("readbook", {
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
            }
        }, {
            key: "loadBookChapters",
            value: function loadBookChapters(id, book, bookSourceId) {

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
            }
        }, {
            key: "loadView",
            value: function loadView(params) {

                this.loadBookDetail(".book", params.book, params.bookSourceId);
                this.loadBookChapters(".book-chapters", params.book, params.bookSourceId);
            }
        }]);

        return MyPage;
    }(Page);

    return MyPage;
});
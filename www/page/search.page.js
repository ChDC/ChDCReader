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
            value: function onLoad(params, baseurl) {
                this.loadView();
            }
        }, {
            key: "loadBooks",
            value: function loadBooks(id, books) {
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

                                $(event.currentTarget).attr("disabled", "disabled");
                                app.bookShelf.save().then(function () {
                                    util.showMessage("添加成功！");
                                    book.checkBookSources();

                                    book.cacheChapter(0, app.settings.settings.cacheChapterCount);
                                }).catch(function (error) {
                                    $(event.currentTarget).removeAttr("disabled");
                                });
                            });
                        }
                        nb.find(".btnDetail").click(function (e) {
                            return app.page.showPage("bookdetail", {
                                book: book
                            });
                        });
                        nb.find(".book-booksource").text(app.bookSourceManager.getBookSourceName(book.mainSourceId));
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
            }
        }, {
            key: "search",
            value: function search() {
                var _this2 = this;

                app.showLoading();
                var keyword = $(".keyword").val();
                var bookSourceId = $(".bookSource").val();
                $('.result').empty();
                if (!keyword || !bookSourceId) {
                    util.showError("请输入要搜索的关键字");
                    return;
                }

                if (bookSourceId == "#all#") {
                    app.bookSourceManager.searchBookInAllBookSource(keyword).then(function (books) {
                        app.hideLoading();
                        _this2.loadBooks(".result", books);
                    }).catch(function (error) {
                        app.hideLoading();
                        util.showError(app.error.getMessage(error));
                    });
                    return;
                }

                app.bookSourceManager.searchBook(bookSourceId, keyword).then(function (books) {
                    app.hideLoading();
                    _this2.loadBooks(".result", books);
                }).catch(function (error) {
                    app.hideLoading();
                    util.showError(app.error.getMessage(error));
                });
            }
        }, {
            key: "loadView",
            value: function loadView() {
                var _this3 = this;

                var bookSource = $(".bookSource");
                var keys = app.bookSourceManager.getSourcesKeysByMainSourceWeight();

                bookSource.append('<option value ="#all#">[全网搜索]</option>');

                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var bskey = _step2.value;

                        var bsName = app.bookSourceManager.getBookSourceName(bskey);
                        var newOption = "<option value =\"" + bskey + "\">" + bsName + "</option>";
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
                    return _this3.close();
                });
                $(".btnSearch").click(function (e) {
                    return _this3.search();
                });
                $(".keyword").on('keydown', function (event) {
                    return !(event.keyCode == 13 && _this3.search());
                });
                $(".keyword").on('focus', function (event) {
                    return event.currentTarget.select();
                });
            }
        }]);

        return MyPage;
    }(Page);

    return MyPage;
});
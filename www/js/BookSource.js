"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["jquery", 'co', "util", 'Chapter'], function ($, co, util, Chapter) {
    "use strict";

    var BookSource = function () {
        function BookSource(id) {
            var weight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            _classCallCheck(this, BookSource);

            this.id = id;
            this.disable = false;
            this.weight = weight;
            this.searched = false;

            this.detailLink = null;
            this.catalogLink = null;
            this.bookid = null;
            this.catalog = null;
            this.updatedCatalogTime = 0;
            this.updatedLastestChapterTime = 0;
            this.needSaveCatalog = false;
            this.lastestChapter = undefined;
        }

        _createClass(BookSource, [{
            key: "getBookSource",
            value: function getBookSource(bookSourceManager, book) {
                var _this = this;

                if (this.disable) return Promise.reject(404);

                return bookSourceManager.getBook(this.id, book.name, book.author).then(function (book) {
                    Object.assign(_this, book.sources[_this.id]);
                    return _this;
                }).catch(function (error) {
                    if (error == 404) {
                        _this.disable = true;
                        _this.searched = true;
                    }
                    return Promise.reject(error);
                });
            }
        }, {
            key: "__getBookSourceDetailLink",
            value: function __getBookSourceDetailLink(bookSourceManager, book) {
                if (!this.searched) {
                    return this.getBookSource(bookSourceManager, book).then(function (bs) {
                        return bs.detailLink;
                    });
                }

                if (this.disable) {
                    return Promise.reject(404);
                }

                return Promise.resolve(this.detailLink);
            }
        }, {
            key: "__getBookSourceCatalogLink",
            value: regeneratorRuntime.mark(function __getBookSourceCatalogLink(bookSourceManager, book) {
                var bsm, detailLink, html, link, catalogLink, o, _link;

                return regeneratorRuntime.wrap(function __getBookSourceCatalogLink$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (this.searched) {
                                    _context.next = 3;
                                    break;
                                }

                                _context.next = 3;
                                return this.getBookSource(bookSourceManager, book);

                            case 3:
                                if (!this.disable) {
                                    _context.next = 5;
                                    break;
                                }

                                return _context.abrupt("return", Promise.reject(404));

                            case 5:
                                if (this.catalogLink) {
                                    _context.next = 25;
                                    break;
                                }

                                bsm = bookSourceManager.sources[this.id];

                                if (bsm) {
                                    _context.next = 9;
                                    break;
                                }

                                return _context.abrupt("return");

                            case 9:
                                if (!bsm.detail.info.catalogLink) {
                                    _context.next = 21;
                                    break;
                                }

                                _context.next = 12;
                                return this.__getBookSourceDetailLink(bookSourceManager, book);

                            case 12:
                                detailLink = _context.sent;
                                _context.next = 15;
                                return util.getDOM(detailLink);

                            case 15:
                                html = _context.sent;

                                html = $(html);
                                link = html.find(bsm.detail.info.catalogLink).attr('href');

                                this.catalogLink = link;
                                _context.next = 25;
                                break;

                            case 21:
                                catalogLink = bsm.catalog.link;
                                o = Object.assign({}, this, bookSourceManager[this.id]);
                                _link = util.format(catalogLink, o);

                                this.catalogLink = _link;

                            case 25:
                                return _context.abrupt("return", this.catalogLink);

                            case 26:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, __getBookSourceCatalogLink, this);
            })
        }, {
            key: "__refreshCatalog",
            value: regeneratorRuntime.mark(function __refreshCatalog(bookSourceManager, book) {
                var catalogLink, catalog;
                return regeneratorRuntime.wrap(function __refreshCatalog$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (!(new Date().getTime() - this.updatedCatalogTime < bookSourceManager.settings.refreshCatalogInterval * 1000)) {
                                    _context2.next = 2;
                                    break;
                                }

                                return _context2.abrupt("return", Promise.reject(400));

                            case 2:

                                util.log('Refresh Catalog!');
                                _context2.next = 5;
                                return this.__getBookSourceCatalogLink(bookSourceManager, book);

                            case 5:
                                catalogLink = _context2.sent;
                                _context2.next = 8;
                                return bookSourceManager.getBookCatalog(this.id, catalogLink);

                            case 8:
                                catalog = _context2.sent;

                                this.catalog = catalog;
                                this.updatedCatalogTime = new Date().getTime();
                                this.needSaveCatalog = true;
                                return _context2.abrupt("return", catalog);

                            case 13:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, __refreshCatalog, this);
            })
        }, {
            key: "getBookInfo",
            value: function getBookInfo(bookSourceManager, book) {
                var _this2 = this;

                return this.__getBookSourceDetailLink(bookSourceManager, book).then(function (detailLink) {
                    return bookSourceManager.getBookInfo(_this2.id, detailLink);
                });
            }
        }, {
            key: "getCatalog",
            value: function getCatalog(bookSourceManager, book, forceRefresh) {
                var _this3 = this;

                if (!forceRefresh && this.catalog) {
                    return Promise.resolve(this.catalog);
                }
                return co(this.__refreshCatalog(bookSourceManager, book)).catch(function (error) {
                    if (error == 400) {
                        return _this3.catalog;
                    } else {
                        throw error;
                    }
                });
            }
        }, {
            key: "refreshLastestChapter",
            value: function refreshLastestChapter(bookSourceManager, book) {
                var _this4 = this;

                if (new Date().getTime() - this.updatedLastestChapterTime < bookSourceManager.settings.refreshLastestChapterInterval * 1000) {
                    return Promise.reject(402);
                }

                util.log('Refresh LastestChapter!');

                return this.__getBookSourceDetailLink(bookSourceManager, book).then(function (detailLink) {
                    return bookSourceManager.getLastestChapter(_this4.id, detailLink);
                }).then(function (lastestChapter) {
                    _this4.updatedLastestChapterTime = new Date().getTime();
                    var lastestChapterUpdated = false;
                    if (_this4.lastestChapter != lastestChapter) {
                        _this4.lastestChapter = lastestChapter;
                        lastestChapterUpdated = true;
                    }
                    return [lastestChapter, lastestChapterUpdated];
                });
            }
        }, {
            key: "getChapter",
            value: function getChapter(bookSourceManager, book, chapter, onlyCacheNoLoad) {
                var _this5 = this;

                return co(this.__getCacheChapter(book, chapter.title, onlyCacheNoLoad)).then(function (c) {
                    return onlyCacheNoLoad ? chapter : c;
                }).catch(function (error) {
                    if (error != 207) throw error;

                    return bookSourceManager.getChapter(_this5.id, chapter.link).then(function (chapter) {
                        return _this5.__cacheChapter(book, chapter);
                    });
                });
            }
        }, {
            key: "__getCacheChapterLocation",
            value: function __getCacheChapterLocation(book, id) {
                return "chapter_" + book.name + "." + book.author + "_" + id + "." + this.id;
            }
        }, {
            key: "__getCacheChapter",
            value: regeneratorRuntime.mark(function __getCacheChapter(book, title, onlyCacheNoLoad) {
                var dest, exists, data, chapter;
                return regeneratorRuntime.wrap(function __getCacheChapter$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                dest = this.__getCacheChapterLocation(book, title);

                                if (!onlyCacheNoLoad) {
                                    _context3.next = 6;
                                    break;
                                }

                                _context3.next = 4;
                                return util.dataExists(dest, true);

                            case 4:
                                exists = _context3.sent;
                                return _context3.abrupt("return", exists ? null : Promise.reject(207));

                            case 6:
                                _context3.prev = 6;
                                _context3.next = 9;
                                return util.loadData(dest, true);

                            case 9:
                                data = _context3.sent;

                                if (data) {
                                    _context3.next = 12;
                                    break;
                                }

                                return _context3.abrupt("return", Promise.reject(207));

                            case 12:
                                chapter = Object.assign(new Chapter(), data);
                                return _context3.abrupt("return", chapter);

                            case 16:
                                _context3.prev = 16;
                                _context3.t0 = _context3["catch"](6);
                                return _context3.abrupt("return", Promise.reject(207));

                            case 19:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, __getCacheChapter, this, [[6, 16]]);
            })
        }, {
            key: "__cacheChapter",
            value: function __cacheChapter(book, chapter) {
                var dest = this.__getCacheChapterLocation(book, chapter.title);
                return util.saveData(dest, chapter, true).then(function () {
                    return chapter;
                });
            }
        }]);

        return BookSource;
    }();

    return BookSource;
});
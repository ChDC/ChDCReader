"use strict";

define(["chai", "BookSourceManager"], function (chai, BookSourceManager) {

    var assert = chai.assert;
    var equal = assert.equal;

    var config = {
        "qidian": [{
            "name": "一念永恒",
            "author": "耳根",
            "complete": false,
            "csrfToken": "",
            "introduce": "一念成沧海，一念化桑田。一念斩千魔",

            "cover": "http://qidian.qpic.cn/qdbimg/349573/1003354631/150",
            "lastestChapter": "",
            "bookid": "1003354631",
            "detailLink": "http://book.qidian.com/info/1003354631",

            "chapters": [{
                "title": "第四章 炼灵",
                "link": "http://read.qidian.com/chapter/rJgN8tJ_cVdRGoWu-UQg7Q2/N7RItTUlse2aGfXRMrUjdw2",
                "content": "众人大喜，看向白小纯时，已是喜欢到了极点，觉得这白小纯不但可爱，肚子里坏水还不少"
            }]
        }, {
            "name": "银狐",
            "author": "孑与2",
            "complete": false,
            "csrfToken": "",
            "introduce": "人的第一要求就是活着，第二要求还是活着，",

            "cover": "http://qidian.qpic.cn/qdbimg/349573/3650892/150",
            "lastestChapter": "",
            "bookid": "3650892",
            "detailLink": "http://book.qidian.com/info/3650892",

            "chapters": [{
                "link": "http://read.qidian.com/chapter/2EOvKFDAVe01/o1CNvVz-KeMex0RJOkJclQ2",
                "title": "第二章铁心源的运气",
                "content": "王柔花远没有铁心源那样自在，她如今正举着那根棒槌和一只雪白的狐狸对峙"
            }]
        }, {
            "name": "大主宰",
            "author": "天蚕土豆",
            "complete": false,
            "csrfToken": "",
            "introduce": "大千世界，位面交汇，万族林立",

            "cover": "http://qidian.qpic.cn/qdbimg/349573/2750457/150",
            "lastestChapter": "",
            "bookid": "2750457",
            "detailLink": "http://book.qidian.com/info/2750457",

            "chapters": [{
                "link": "http://read.qidian.com/chapter/2OZih9MNQLg1/o2rSOd-S_DUex0RJOkJclQ2",
                "title": "第三章 牧域",
                "content": "北灵境分九域，各由一主掌控，"
            }]
        }],

        "biqulou": [{
            "name": "大主宰",
            "author": "天蚕土豆",
            "introduce": "大千世界，位面交汇，万族林立",

            "lastestChapter": "",
            "detailLink": "http://www.biqulou.net/24/24835/",

            "chapters": [{
                "title": "第九十五章 黑色卷轴",
                "link": "http://www.biqulou.net/24/24835/7682020.html",
                "content": "的"
            }]
        }, {
            "name": "银狐",
            "author": "孑与2",
            "introduce": "人的第一要求就是活着，第二要求还是活着",

            "lastestChapter": "",
            "detailLink": "http://www.biqulou.net/94/94905/",

            "chapters": [{
                "title": "第九十二章一人一世界",
                "link": "http://www.biqulou.net/94/94905/5182713.html",
                "content": "的"
            }]
        }, {
            "name": "一念永恒",
            "author": "耳根",
            "introduce": "一念成沧海，一念化桑田。",

            "lastestChapter": "",
            "detailLink": "http://www.biqulou.net/120/120773/",

            "chapters": [{
                "title": "第九十七章 我就是张大胖!",
                "link": "http://www.biqulou.net/120/120773/6351804.html",
                "content": "的"
            }]
        }],
        "daizhuzai": [{
            "name": "一念永恒",
            "author": "耳根",
            "complete": false,
            "introduce": "一念成沧海，一念化桑田。",

            "cover": "http://img.dzz8.com/public/cover/5e/b0/bd/5eb0bd600f38ed89e26bd0dc3d70ff0d.jpg",
            "lastestChapter": "",
            "detailLink": "http://www.daizhuzai.com/351/",

            "chapters": [{
                "title": "第九十八章 龙象化海经",
                "link": "http://www.daizhuzai.com/351/101.html",
                "content": "的"
            }]
        }, {
            "name": "银狐",
            "author": "孑与2",
            "complete": false,
            "introduce": "人的第一要求就是活着，第二要求还是活着",

            "cover": "http://img.dzz8.com/public/cover/20/ef/10/20ef1080b85cd4570cee3718809683cf.jpg",
            "lastestChapter": "",
            "detailLink": "http://www.daizhuzai.com/248/",

            "chapters": [{
                "title": "第九十七章黑了心的铁心源",
                "link": "http://www.daizhuzai.com/248/101.html",
                "content": "的"
            }]
        }, {
            "name": "大主宰",
            "author": "天蚕土豆",
            "complete": false,
            "introduce": "大千世界，位面交汇，万族林立",

            "cover": "http://img.dzz8.com/public/cover/ad/53/d9/ad53d94c9d60c650d7db17bb7d98636a.jpg",
            "lastestChapter": "",
            "detailLink": "http://www.daizhuzai.com/1/",

            "chapters": [{
                "title": "第九十五章 黑色卷轴",
                "link": "http://www.daizhuzai.com/1/101.html",
                "content": "的"
            }]
        }],

        "biqugezw": [{
            "name": "一念永恒",
            "author": "耳根",
            "complete": undefined,
            "introduce": "一念成沧海，一念化桑田",

            "lastestChapter": "",
            "detailLink": "http://www.biqugezw.com/3_3096/",

            "chapters": [{
                "title": "第一百零一章 水泽国度与元磁翅！",
                "link": "http://www.biqugezw.com/3_3096/2806430.html",
                "content": "的"
            }]
        }, {
            "name": "银狐",
            "author": "孑与2",
            "complete": undefined,
            "introduce": "人的第一要求就是活着",

            "lastestChapter": "",
            "detailLink": "http://www.biqugezw.com/modules/article/reader.php?aid=198",

            "chapters": [{
                "title": "第九十六章致命的坏习惯",
                "link": "http://www.biqugezw.com/0_198/916236.html",
                "content": "的"
            }]
        }, {
            "name": "大主宰",
            "author": "天蚕土豆",
            "complete": undefined,
            "introduce": "殿，百战之皇，战威无可敌",

            "lastestChapter": "",
            "detailLink": "http://www.biqugezw.com/modules/article/reader.php?aid=1769",

            "chapters": [{
                "title": "第一百零五章 三级灵阵",
                "link": "http://www.biqugezw.com/1_1769/417408.html",
                "content": "的"
            }]
        }],

        "biquge.tw": [{
            "name": "一念永恒",
            "author": "耳根",
            "complete": undefined,
            "introduce": "一念成沧海，一念化桑田",

            "lastestChapter": "",
            "detailLink": "http://www.biquge.com.tw/0_213/",

            "chapters": [{
                "title": "第一百零一章 水泽国度与元磁翅！",
                "link": "http://www.biquge.com.tw/0_213/7165919.html",
                "content": "的"
            }]
        }, {
            "name": "银狐",
            "author": "孑与2",
            "complete": undefined,
            "introduce": "人的第一要求就是活着",

            "lastestChapter": "",
            "detailLink": "http://www.biquge.com.tw/12_12001/",

            "chapters": [{
                "title": "第九十一章怎么就不响呢？",
                "link": "http://www.biquge.com.tw/12_12001/6505969.html",
                "content": "的"
            }]
        }, {
            "name": "大主宰",
            "author": "天蚕土豆",
            "complete": undefined,
            "introduce": "大千世界，万道争锋，吾为大主宰",

            "lastestChapter": "",
            "detailLink": "http://www.biquge.com.tw/0_757/",

            "chapters": [{
                "title": "第一百零一章 融天境",
                "link": "http://www.biquge.com.tw/0_757/530594.html",
                "content": "的"
            }]
        }],

        "biquge": [{
            "name": "一念永恒",
            "author": "耳根",
            "complete": undefined,
            "introduce": "一念成沧海，一念化桑田",

            "lastestChapter": "",
            "detailLink": "http://www.biquge.com/16_16431/",

            "chapters": [{
                "title": "第九十八章 龙象化海经",
                "link": "http://www.biquge.com/16_16431/9283491.html",
                "content": "的"
            }]
        }, {
            "name": "银狐",
            "author": "孑与2",
            "complete": undefined,
            "introduce": "哲人，我就是神",

            "lastestChapter": "",
            "detailLink": "http://www.biquge.com/11_11997/",

            "chapters": [{
                "title": "第九十四章来自邓八爷的威胁",
                "link": "http://www.biquge.com/11_11997/6883762.html",
                "content": "的"
            }]
        }, {
            "name": "大主宰",
            "author": "天蚕土豆",
            "complete": undefined,
            "introduce": "西天之殿，百战之皇，战威无可敌",

            "lastestChapter": "",
            "detailLink": "http://www.biquge.com/0_176/",

            "chapters": [{
                "title": "第一百零一章 融天境",
                "link": "http://www.biquge.com/0_176/1238877.html",
                "content": "的"
            }]
        }],

        "chuangshi": [{
            "name": "大主宰",
            "author": "天蚕土豆",
            "complete": false,
            "introduce": "大千世界，位面交汇，万族林",

            "cover": "http://img1.write.qq.com/upload/cover/2013-05-01/cm_4d00258637d3464c3ea19f932d58d1d0.jpg",
            "lastestChapter": "",
            "detailLink": "http://chuangshi.qq.com/bk/xh/462523.html?sword=大主宰",
            "catalogLink": "http://chuangshi.qq.com/bk/xh/AGwEMl1iVjIAOFRn-l.html",
            "chapters": [{
                "title": "第八章 柳阳",
                "link": "http://chuangshi.qq.com/bk/xh/AGwEMl1iVjIAOFRn-r-8.html",
                "content": "的"
            }]
        }],

        "dingdian": [{
            "name": "一念永恒",
            "author": "耳根",
            "complete": undefined,
            "introduce": "一念成沧海，一念化桑田",

            "lastestChapter": "",
            "detailLink": "http://www.booktxt.net/1_1137/",

            "chapters": [{
                "title": "第九十八章 龙象化海经",
                "link": "http://www.booktxt.net/1_1137/1012080.html",
                "content": "的"
            }]
        }, {
            "name": "大主宰",
            "author": "天蚕土豆",
            "complete": undefined,
            "introduce": "大千世界，万道争锋，吾为大主宰",

            "lastestChapter": "",
            "detailLink": "http://www.booktxt.net/0_59/",

            "chapters": [{
                "title": "第九十一章 说服",
                "link": "http://www.booktxt.net/0_59/32964.html",
                "content": "的"
            }]
        }, {
            "name": "三生三世十里桃花",
            "author": "唐七公子",
            "complete": undefined,
            "introduce": "那一世，大荒之中一处荒山，成就她与",

            "lastestChapter": "",
            "detailLink": "http://www.booktxt.net/4_4903/",

            "chapters": [{
                "title": "第四章（1）",
                "link": "http://www.booktxt.net/4_4903/1814813.html",
                "content": "的"
            }]
        }]
    };

    var _loop = function _loop(bsid) {
        var books = config[bsid];

        function equalBook(bsid, book, b) {
            assert.isObject(b);
            assert.isNotNull(b);
            equal(true, !!b);

            var exclude = ['chapters', 'introduce', 'lastestChapter', 'cover'];
            for (var key in book) {
                if (exclude.indexOf(key) >= 0) continue;
                if (key in b) equal(book[key], b[key], book.name + "." + key);else if ('sources' in b && key in b.sources[bsid]) equal(book[key], b.sources[bsid][key], book.name + "." + key);
            }

            if ("introduce" in book && "introduce" in b) equal(true, b.introduce.length > 0 && b.introduce.indexOf(book.introduce) >= 0, book.name + ".introduce");

            if ("lastestChapter" in book && "sources" in b && "lastestChapter" in b.sources[bsid]) equal(true, b.sources[bsid].lastestChapter.length > 0, book.name + ".lastestChapter");
            if ("cover" in book && "cover" in b) equal(true, !!b.cover.match(/^http/), book.name + ".cover");
        }

        describe("BookSourceManager \u6D4B\u8BD5\uFF1A" + bsid, function () {
            var bsm = void 0;

            before(function () {
                bsm = new BookSourceManager();
                return bsm.loadConfig("data/booksources.json");
                var bsName = bsm.getBookSourceName(bsid);
            });

            it('测试搜索', function () {
                return Promise.all(books.map(function (book) {
                    return bsm.searchBook(bsid, book.name).then(function (bs) {
                        var b = bs[0];
                        equalBook(bsid, book, b);
                    });
                }));
            });

            it('测试获取书籍', function () {
                return Promise.all(books.map(function (book) {
                    return bsm.getBook(bsid, book.name, book.author).then(function (b) {
                        equalBook(bsid, book, b);
                    });
                }));
            });

            it('测试获取书籍信息', function () {
                return Promise.all(books.map(function (book) {
                    return bsm.getBookInfo(bsid, book.detailLink).then(function (b) {
                        equalBook(bsid, book, b);
                    });
                }));
            });

            it('测试最新章节', function () {
                return Promise.all(books.map(function (book) {
                    return bsm.getLastestChapter(bsid, book.detailLink).then(function (lc) {
                        equal(true, lc.length > 0);
                    });
                }));
            });

            it('测试书籍目录', function () {
                return Promise.all(books.map(function (book) {
                    return bsm.getBookCatalog(bsid, book).then(function (catalog) {
                        assert.isArray(catalog);
                        equal(true, catalog.length > 0);
                        book.chapters.forEach(function (chapter) {
                            equal(true, catalog.findIndex(function (e) {
                                return e.title == chapter.title;
                            }) >= 0);
                        });
                    });
                }));
            });

            it('测试获取章节', function () {
                return Promise.all(books.map(function (book) {
                    return Promise.all(book.chapters.map(function (chapter) {
                        return bsm.getChapter(bsid, chapter.link).then(function (c) {
                            equal(chapter.title, c.title);
                            equal(chapter.link, c.link);
                            equal(true, c.content.length > 0 && c.content.indexOf(chapter.content) >= 0);
                        });
                    }));
                }));
            });
        });
    };

    for (var bsid in config) {
        _loop(bsid);
    }

    describe("BookSourceManager \u5176\u4ED6\u6D4B\u8BD5", function () {

        it('全局搜索', function () {});
    });
});
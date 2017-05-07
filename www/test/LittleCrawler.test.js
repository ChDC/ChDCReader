"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["LittleCrawler_test"] = factory(chai, LittleCrawler);
})(["chai", "LittleCrawler"], function (chai, LittleCrawler) {

  var assert = chai.assert;
  var equal = assert.equal;

  describe('使用说明示例', function () {

    var lc = void 0;
    var html = void 0;
    var json = void 0;

    before(function () {
      lc = new LittleCrawler();
      return LittleCrawler.ajax("get", "test/LittleCrawler.test.data.html").then(function (data) {
        return html = data;
      }).then(function () {
        return LittleCrawler.ajax("get", "test/LittleCrawler.test.data.json");
      }).then(function (data) {
        return json = data;
      });
    });

    it('type 属性为 array', function () {
      var response = {
        "type": "array",
        "element": "#books",
        "children": {
          "name": ".name",
          "author": ".author"
        }
      };
      var result = lc.parse(html, "html", response);

      equal(true, result.every(function (e) {
        return e.author != '李四';
      }));
      equal(true, result.some(function (e) {
        return e.author == '张三';
      }));
    });

    it("type 属性为 string：valid 操作", function () {
      var response = {
        "type": "string",
        "element": "#content",
        "attribute": "data-title",
        "valid": "{value} == '书籍列表'"
      };
      equal('书籍列表', lc.parse(html, "html", response));
      response = {
        "type": "string",
        "element": "#content",
        "attribute": "data-title",
        "valid": "{value} != '书籍列表'"
      };
      equal(undefined, lc.parse(html, "html", response));
    });

    it("type 属性为 string：remove 操作", function () {
      var response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "remove": "\\w+"
      };
      equal('这本书很好', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "remove": {
          "regexp": ".",
          "options": "i"
        }
      };
      equal('本书很好abcdef1234567', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "remove": ["\\w+", "^."]
      };
      equal('本书很好', lc.parse(html, "html", response));
    });

    it("type 属性为 string：extract 操作", function () {
      var response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": "\\d+"
      };
      equal('1234567', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": "[01267]"
      };
      equal('1', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": {
          "regexp": "[01267]",
          "options": "gi"
        }
      };
      equal('1267', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": ["\\d+", { "regexp": ".", "options": "i" }]
      };
      equal('1', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": ["\\d+", { "regexp": "(.).(.)", "options": "i" }]
      };
      equal('13', lc.parse(html, "html", response));
    });

    it("解析 JOSN 格式的数据", function () {
      var response = "data.chapterTotalCnt";
      equal(788, lc.parse(json, "json", response));

      response = "data.vs.cCnt";
      equal("[13,10,10,10]", JSON.stringify(lc.parse(json, "json", response)));

      response = "data.vs.cs#concat.id";
      equal("[2333784,2403463,4325986,20322705,1698931,2393792,2393793,2393794,2393796,2393822,2393823,2393859,2393864,2393869]", JSON.stringify(lc.parse(json, "json", response)));

      response = "data.vs#concat.cs.id";
      equal("[[2333784,2403463,4325986,20322705],[1698931,2393792,2393793,2393794,2393796],[2393822,2393823],[2393859,2393864,2393869]]", JSON.stringify(lc.parse(json, "json", response)));

      response = "data.vs.cs.id";
      equal("[[2333784,2403463,4325986,20322705],[1698931,2393792,2393793,2393794,2393796],[2393822,2393823],[2393859,2393864,2393869]]", JSON.stringify(lc.parse(json, "json", response)));

      response = "data.vs.1.cs.id";
      equal("[1698931,2393792,2393793,2393794,2393796]", JSON.stringify(lc.parse(json, "json", response)));
    });
  });

  describe('LittleCrawler.js 测试', function () {

    var lc = void 0;
    var config = void 0;
    var html = void 0;

    before(function () {
      lc = new LittleCrawler();
      config = {
        "request": "http://se.qidian.com/?kw={keyword}",
        "response": {
          "type": "array",
          "element": "#result-list li[data-rid]",
          "children": {
            "name": ".book-mid-info>h4>a",
            "author": ".book-mid-info .author>a.name",
            "catagory": ".book-mid-info .author a:nth-child(4)",
            "complete": {
              "type": "boolean",
              "element": ".book-mid-info .author span:last-child",
              "true": "完本",
              "false": "连载中"
            },
            "coverImg": ".book-img-box img[src]",
            "introduce": ".book-mid-info .intro",
            "lastestChapter": ".book-mid-info .update>a",
            "detailLink": ".book-mid-info>h4>a",
            "bookid": {
              "type": "string",
              "element": ".book-mid-info>h4>a",
              "attribute": "data-bid"
            }
          }
        }
      };
    });

    it('__urlJoin', function () {
      equal(null, LittleCrawler.__urlJoin(null, null));
      equal('http://www.test.com/abc', LittleCrawler.__urlJoin('http://www.test.com/abc', null));
      equal('http://www.test.com/abc', LittleCrawler.__urlJoin('http://www.test.com/abc', {}));
      equal('http://www.test.com/abc?id=1', LittleCrawler.__urlJoin('http://www.test.com/abc?id=1', {}));
      equal('http://www.test.com/abc?id=1&abc=2', LittleCrawler.__urlJoin('http://www.test.com/abc?id=1', { abc: 2 }));
      equal('http://www.test.com/abc?id=1&abc=2&def=abc', LittleCrawler.__urlJoin('http://www.test.com/abc?id=1', { abc: 2, def: "abc" }));
      equal('http://www.test.com/abc?abc=2&def=abc', LittleCrawler.__urlJoin('http://www.test.com/abc', { abc: 2, def: "abc" }));
    });

    it('cloneObjectValues', function () {
      var src = { abc: 1, def: 2, fff: undefined };
      var dest = { abc: 0, fff: 2 };
      LittleCrawler.cloneObjectValues(dest, src);
      equal(1, dest.abc);
      equal(2, dest.fff);
      equal(false, "def" in dest);
    });

    it('string format', function () {
      equal(null, LittleCrawler.format());
      equal('', LittleCrawler.format(''));
      equal('', LittleCrawler.format('', {}));
      equal('abc123', LittleCrawler.format('abc{def}', { def: 123 }));
      try {
        LittleCrawler.format('abc{def}');
      } catch (error) {
        equal("can't find the key def in object", error.message);
      };
      try {
        LittleCrawler.format('abc{def}', {});
      } catch (error) {
        equal("can't find the key def in object", error.message);
      };
      try {
        LittleCrawler.format('abc{def}', {}, true);
      } catch (error) {
        equal("can't find the key def in object", error.message);
      };

      equal('abc"123"', LittleCrawler.format('abc{def}', { def: "123" }, true));
      equal('abc123', LittleCrawler.format('abc{def}', { def: "123" }, false));
      equal('abc', LittleCrawler.format('abc{def}', { def: undefined }, false));
      equal('abcundefined', LittleCrawler.format('abc{def}', { def: undefined }, true));
      equal('abc', LittleCrawler.format('abc{def}', { def: null }, false));
      equal('abcnull', LittleCrawler.format('abc{def}', { def: null }, true));
    });

    it('fixurl', function () {
      var host1 = "http://www.test.com";
      var host2 = "http://www.test.com/abc/def?test";
      equal(undefined, LittleCrawler.fixurl());
      equal("http://www.abc.com", LittleCrawler.fixurl("http://www.abc.com"));
      equal("http://www.abc.com", LittleCrawler.fixurl("://www.abc.com"));
      equal("http://www.abc.com", LittleCrawler.fixurl("//www.abc.com"));
      equal("http://www.test.com/www.abc.com", LittleCrawler.fixurl("www.abc.com", host1));
      equal("http://www.test.com/def/abc/ddd", LittleCrawler.fixurl("/def/abc/ddd", host1));

      equal("http://www.test.com/abc/www.abc.com", LittleCrawler.fixurl("www.abc.com", host2));
      equal("http://www.test.com/def/abc/ddd", LittleCrawler.fixurl("/def/abc/ddd", host2));
      equal("http://www.test.com/def/abc/ddd", LittleCrawler.fixurl("../def/abc/ddd", host2));
    });

    it('filterTag', function () {
      var html = '<div>abcdef</div><br/><div/><div />';

      assert.equal(null, LittleCrawler.filterTag(null, null));
      assert.equal(html, LittleCrawler.filterTag(html, null));
      assert.equal(html, LittleCrawler.filterTag(html, ""));

      assert.notInclude(LittleCrawler.filterTag(html, 'div'), 'div');
    });

    it('replaceTag', function () {
      var html = '<div>abcdef</div><br/><div/><div />';

      assert.equal(null, LittleCrawler.replaceTag(null, null));
      assert.equal(html, LittleCrawler.replaceTag(html, null));
      assert.equal(html, LittleCrawler.replaceTag(html, ""));

      assert.notInclude(LittleCrawler.replaceTag(html, 'div', 'ab-div'), '<div');
      assert.include(LittleCrawler.replaceTag(html, 'div', 'ab-div'), 'ab-div');
    });

    it('text2html', function () {
      equal(undefined, LittleCrawler.text2html());
      equal('<p>test</p>', LittleCrawler.text2html('test'));
      equal('<p>test</p>', LittleCrawler.text2html('test'));
      equal('<p>test</p>', LittleCrawler.text2html('test'));
      equal('<p>test</p>\n<p>test2</p>', LittleCrawler.text2html('test\ntest2'));
    });

    it('__transformHTML', function () {
      assert.equal("", lc.__transformHTML(""));
      assert.equal(null, lc.__transformHTML());

      var html = "\n        <link rel=\"stylesheet\" href=\"lib/bootstrap-3.3.7/css/bootstrap.min.css\">\n        <meta charset=\"UTF-8\">\n        <style></style>\n        <style>abc</style>\n        <script type=\"text/javascript\" src=\"cordova.js\"></script>\n        <title>ChDCReader</title>\n        <iframe src=\"cordova\"></iframe>\n        <img src=\"test.png\">\n        <img src=\"test.png\" />\n      ";

      var fh = lc.__transformHTML(html);
      assert.include(fh, '<img lc-src="test.png" />');
      assert.notInclude(fh, '<img src="test.png" />');
    });

    it('clearHtml', function () {
      assert.equal("", LittleCrawler.clearHtml(""));
      assert.equal(null, LittleCrawler.clearHtml());

      var html = "\n        <link rel=\"stylesheet\" href=\"lib/bootstrap-3.3.7/css/bootstrap.min.css\">\n        <meta charset=\"UTF-8\">\n        <style></style>\n        <style>abc</style>\n        <script type=\"text/javascript\" src=\"cordova.js\">\n        </script>\n        <title>ChDCReader</title>\n        <iframe src=\"cordova\"></iframe>\n        <img class=\"css\" src=\"test.png\">\n        <img align=\"right\" src=\"test.png\" />\n        <img class=\"css\" src=\"test.png\"></img>\n        <p class\n        =\"css\" style\n        =\"color:red;\">Test1</p>\n\n        Test2<br/>\n        Test3<br/>\n        Test4<br/>\n        Test2<br/>\n        Test2<br/>\n        Test2<br/>\n        <p class=\"css\" style=\"color='red'\">Test10</p>\n      ";

      var fh = LittleCrawler.clearHtml(html);
      assert.notInclude(fh, '<style');
      assert.notInclude(fh, '<meta');
      assert.notInclude(fh, '<link');
      assert.notInclude(fh, '<iframe');
      assert.include(fh, '<img');

      assert.include(fh, 'Test1');
      assert.include(fh, 'test.png');
      assert.notInclude(fh, 'red');
      assert.notInclude(fh, 'css');
      assert.notInclude(fh, 'right');
      assert.notInclude(fh, '<br');
      assert.include(fh, 'Test10');
      assert.include(fh, 'Test4');

      equal('<p>test1</p><p>test2</p><p>test3</p>', LittleCrawler.clearHtml('test1<br>test2<br>test3'));
      equal('<div><p>test1</p><p>test2</p><p>test3</p></div>', LittleCrawler.clearHtml('<div>test1<br>test2<br>test3</div>'));
      equal('<p>test1</p><p>test2</p><p>test3</p><p>test4</p>', LittleCrawler.clearHtml('test1<br>test2<br>test3<p>test4</p>'));
      equal('<p>test1</p><p>test3</p><p>test4</p>', LittleCrawler.clearHtml('test1<br><br>test3<p>test4</p>'));
      equal('<p></p><p>1</p><p>test3</p><p>test4</p>', LittleCrawler.clearHtml('<br>1<br>test3<p>test4</p>'));
      equal('<p>test1</p><p>test2</p><p>test3</p>', LittleCrawler.clearHtml('test1<br><br>test2<br><br>test3'));
    });

    it('filterHtmlContent', function () {
      assert.equal("", LittleCrawler.filterHtmlContent(""));
      assert.equal(null, LittleCrawler.filterHtmlContent());

      var html = "\n        <link rel=\"stylesheet\"\n        href=\"lib/bootstrap-3.3.7/css/bootstrap.min.css\">\n        <meta charset=\"UTF-8\">\n        <style></style>\n        <style>abc\n        </style>\n        <script type=\"text/javascript\" src=\"cordova.js\"></script>\n        <title>ChDCReader</title>\n        <iframe src=\"cordova\"></iframe>\n        <img src=\"test.png\">\n        <img src=\"test.png\" />\n      ";
      var fh = LittleCrawler.filterHtmlContent(html);
      assert.notInclude(fh, '<style');
      assert.notInclude(fh, '<meta');
      assert.notInclude(fh, '<link');
      assert.notInclude(fh, '<iframe');
      assert.include(fh, '<img');
    });

    it('getDataFromObject', function () {
      equal(undefined, LittleCrawler.getDataFromObject());
      assert.isObject(LittleCrawler.getDataFromObject({}));
      equal(1, LittleCrawler.getDataFromObject({ abc: 1 }, "abc"));

      var obj = {
        abc: {
          def: {
            hij: {
              mno: 2
            }
          }
        },
        def: [{
          abc: {
            def: 2,
            ddd: [1, 2, 3]
          }
        }, {
          abc: {
            def: 3,
            ddd: [4, 5, 6]
          }
        }],
        fff: [{
          abc: {
            def: 2,
            ddd: [{ a: 1 }, { a: 2 }, { a: 3 }]
          }
        }, {
          abc: {
            def: 3,
            ddd: [{ a: 4 }, { a: 5 }, { a: 6 }]
          }
        }]
      };
      equal(2, LittleCrawler.getDataFromObject(obj, "abc::def::hij::mno"));
      equal(2, LittleCrawler.getDataFromObject(obj, "abc.def.hij.mno"));
      assert.sameMembers([2, 3], LittleCrawler.getDataFromObject(obj, "def::abc::def"));
      assert.sameMembers([2, 3], LittleCrawler.getDataFromObject(obj, "def.abc.def"));
      equal('[[1,2,3],[4,5,6]]', JSON.stringify(LittleCrawler.getDataFromObject(obj, "def::abc::ddd")));
      equal('[[1,2,3],[4,5,6]]', JSON.stringify(LittleCrawler.getDataFromObject(obj, "def.abc.ddd")));
      assert.sameMembers([1, 2, 3, 4, 5, 6], LittleCrawler.getDataFromObject(obj, "fff::abc#concat::ddd::a"));
      assert.sameMembers([4, 5, 6], LittleCrawler.getDataFromObject(obj, "fff::abc#filter(\"$element.def==3\")#concat::ddd::a"));
      assert.sameMembers([5, 6], LittleCrawler.getDataFromObject(obj, "fff::abc#filter(\"$element.def==3\")#concat::ddd::a#filter(\"$element >=5\")"));
    });

    it('空 Request 和 空 Response', function () {
      return lc.get().catch(function (error) {
        return equal("Empty response", error.message);
      });
    });

    it('空 Request 和 空 url 的 dict', function () {
      var config = {
        "response": {}
      };
      return lc.get(config, { keyword: "神墓" }).catch(function (error) {
        return equal("Empty URL", error.message);
      });
    });

    it('空 Request 2 和 非空 url 的 dict', function () {
      var config = {
        "response": {
          "type": "array",
          "element": "#result-list li[data-rid]",
          "children": {
            "name": ".book-mid-info>h4>a",
            "author": ".book-mid-info .author>a.name",
            "catagory": ".book-mid-info .author a:nth-child(4)",
            "complete": {
              "type": "boolean",
              "element": ".book-mid-info .author span:last-child",
              "true": "完本",
              "false": "连载中"
            },
            "coverImg": ".book-img-box img",
            "introduce": ".book-mid-info .intro",
            "lastestChapter": ".book-mid-info .update>a",
            "detailLink": ".book-mid-info>h4>a",
            "bookid": {
              "type": "string",
              "element": ".book-mid-info>h4>a",
              "attribute": "data-bid"
            }
          }
        }
      };
      return lc.get(config, { keyword: "神墓", url: 'http://se.qidian.com/?kw=神墓' }).then(function (r) {
        equal('神墓', r[0].name);
        equal(true, !!r[0].coverImg);
      });
    });

    it('完整的 Request 类型为 HTML，类型为 Object，type 为 array', function () {
      var config = {
        "request": {
          "url": "http://se.qidian.com/?kw={keyword}",
          "timeout": 5
        },
        "response": {
          "type": "array",
          "element": "#result-list li[data-rid]",
          "children": {
            "name": ".book-mid-info>h4>a",
            "author": ".book-mid-info .author>a.name",
            "catagory": ".book-mid-info .author a:nth-child(4)",
            "complete": {
              "type": "boolean",
              "element": ".book-mid-info .author span:last-child",
              "true": "完本",
              "false": "连载中"
            },
            "coverImg": ".book-img-box img",
            "introduce": ".book-mid-info .intro",
            "lastestChapter": ".book-mid-info .update>a",
            "detailLink": ".book-mid-info>h4>a",
            "bookid": {
              "type": "string",
              "element": ".book-mid-info>h4>a",
              "attribute": "data-bid"
            }
          }
        }
      };
      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        return equal('神墓', r[0].name);
      });
    });

    it('完整的 Request 类型为 JSON，type 为 format', function () {
      var config = {
        "request": {
          "url": "http://book.qidian.com/ajax/book/category?_csrfToken=&bookId=63856",
          "timeout": 15,
          "type": "JSON"
        },
        "response": {
          "type": "array",
          "element": "data::vs::cs#filter(\"$parent.vN.indexOf(\\\"相关\\\") < 0\")#concat",
          "children": {
            "name": "cN",
            "linkid": "cU",
            "link": {
              "type": "format",
              "value": "http://read.qidian.com/chapter/{linkid}"
            }
          }
        }
      };
      return lc.get(config).then(function (r) {
        equal('第一章 远古神墓', r[0].name);
        assert.lengthOf(r[0].link.match(/^http/), 1);
      });
    });

    it('timeout == 0.05', function () {
      var config = {
        "request": {
          "url": "http://se.qidian.com/?kw={keyword}",
          "timeout": 0.05
        },
        "response": {
          "type": "array",
          "element": "#result-list li[data-rid]",
          "children": {
            "name": ".book-mid-info>h4>a",
            "author": ".book-mid-info .author>a.name",
            "catagory": ".book-mid-info .author a:nth-child(4)",
            "complete": {
              "type": "boolean",
              "element": ".book-mid-info .author span:last-child",
              "true": "完本",
              "false": "连载中"
            },
            "coverImg": ".book-img-box img",
            "introduce": ".book-mid-info .intro",
            "lastestChapter": ".book-mid-info .update>a",
            "detailLink": ".book-mid-info>h4>a",
            "bookid": {
              "type": "string",
              "element": ".book-mid-info>h4>a",
              "attribute": "data-bid"
            }
          }
        }
      };
      return lc.get(config, { keyword: "神墓" }).catch(function (error) {
        return equal('AjaxError: Request Timeout', error.message);
      });
    });

    it('string 的 Request', function () {

      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        return equal('神墓', r[0].name);
      });
    });

    it('Response 类型为 Array', function () {
      var config = {
        "request": {
          "url": "http://book.qidian.com/info/63856",
          "timeout": 5
        },
        "response": ["div.book-info > h1 > em", "div.book-info > h1 > span > a"]
      };
      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        equal('神墓', r[0]);
        equal('辰东', r[1]);
      });
    });

    it('Response 类型为 String', function () {
      var config = {
        "request": {
          "url": "http://book.qidian.com/info/63856",
          "timeout": 5
        },
        "response": "div.book-info > h1 > em"
      };
      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        return equal('神墓', r);
      });
    });

    it('Response 类型为 Object，type 为 boolean', function () {
      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        equal(true, r[0].complete);
      });
    });

    it('Response 类型为 Object，type 为 string', function () {
      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        equal('63856', r[0].bookid);
      });
    });

    it('特殊的键名：image, link', function () {
      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        equal('http://qidian.qpic.cn/qdbimg/349573/63856/150', r[0].coverImg);
        equal('http://book.qidian.com/info/63856', r[0].detailLink);
      });
    });

    it('Type 为 array，有 valideach 属性', function () {
      var config = {
        "request": {
          "url": "http://se.qidian.com/?kw={keyword}",
          "timeout": 5
        },
        "response": {
          "type": "array",
          "element": "#result-list li[data-rid]",
          "valideach": "{complete}==false",
          "children": {
            "name": ".book-mid-info>h4>a",
            "author": ".book-mid-info .author>a.name",
            "catagory": ".book-mid-info .author a:nth-child(4)",
            "complete": {
              "type": "boolean",
              "element": ".book-mid-info .author span:last-child",
              "true": "完本",
              "false": "连载中"
            },
            "coverImg": ".book-img-box img",
            "introduce": ".book-mid-info .intro",
            "lastestChapter": ".book-mid-info .update>a",
            "detailLink": ".book-mid-info>h4>a",
            "bookid": {
              "type": "string",
              "element": ".book-mid-info>h4>a",
              "attribute": "data-bid"
            }
          }
        }
      };
      return lc.get(config, { keyword: "神墓" }).then(function (r) {
        return equal('神墓深渊', r[0].name);
      });
    });
  });
});
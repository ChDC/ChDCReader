;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["LittleCrawler_test"] = factory.apply(undefined, deps.map(e => window[e]));
}(["chai", "LittleCrawler"], function(chai, LittleCrawler){

  /************************************
    测试用例规范：
    * 先写空参数测试
    * 再写异常参数测试
    * 正确参数和正确结果
  ************************************/

  let assert = chai.assert;
  let equal = assert.equal;

  describe('使用说明示例', () => {

    let lc;
    let html;
    let json;

    before(() => {
      lc = new LittleCrawler();
      return LittleCrawler.ajax("get", "test/LittleCrawler.test.data.html")
        .then(data => html = data)
        .then(() => LittleCrawler.ajax("get", "test/LittleCrawler.test.data.json"))
        .then(data => json = data);
    });

    it('type 属性为 array', ()=>{
      let response = {
        "type": "array",
        "element": "#books",
        "children": {
          "name": ".name",
          "author": ".author"
        }
      }
      let result = lc.parse(html, "html", response);
      /*
      [
        {
          "name": "从我的全世界走过",
          "author": "张三"
        }
      ]
      */
      equal(true, result.every(e => e.author != '李四'));
      equal(true, result.some(e => e.author == '张三'));
    });

    it("type 属性为 string：valid 操作", ()=>{
      let response = {
        "type": "string",
        "element": "#content",
        "attribute": "data-title",
        "valid": "{value} == '书籍列表'"
      }
      equal('书籍列表', lc.parse(html, "html", response));
      response = {
        "type": "string",
        "element": "#content",
        "attribute": "data-title",
        "valid": "{value} != '书籍列表'"
      }
      equal(undefined, lc.parse(html, "html", response));
    });

    it("type 属性为 string：remove 操作", ()=>{
      let response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "remove": "\\w+"
      }
      equal('这本书很好', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "remove": {
          "regexp": ".",
          "options": "i"
        }
      }
      equal('本书很好abcdef1234567', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "remove": ["\\w+", "^."]
      }
      equal('本书很好', lc.parse(html, "html", response));
    });

    it("type 属性为 string：extract 操作", ()=>{
      let response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": "\\d+"
      }
      equal('1234567', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": "[01267]"
      }
      equal('1', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": {
          "regexp": "[01267]",
          "options": "gi"
        }
      }
      equal('1267', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": ["\\d+", {"regexp": ".", "options": "i"}]
      }
      equal('1', lc.parse(html, "html", response));

      response = {
        "type": "string",
        "element": "#books > li:nth-child(1) > p.desc",
        "extract": ["\\d+", {"regexp": "(.).(.)", "options": "i"}]
      }
      equal('13', lc.parse(html, "html", response));

    });

    it("解析 JOSN 格式的数据", () => {
      let response = "data.chapterTotalCnt";
      equal(788, lc.parse(json, "json", response));

      // 如果中间有属性是数组，自动遍历数组中的每个元素
      response = "data.vs.cCnt";
      equal("[13,10,10,10]", JSON.stringify(lc.parse(json, "json", response)));

      // 在数组中使用 concat 操作把二维数组连接成一维数组
      response = "data.vs.cs#concat.id";
      equal("[2333784,2403463,4325986,20322705,1698931,2393792,2393793,2393794,2393796,2393822,2393823,2393859,2393864,2393869]", JSON.stringify(lc.parse(json, "json", response)));

      // concat 操作要在子数组中使用，不是在父亲数组中
      response = "data.vs#concat.cs.id";
      equal("[[2333784,2403463,4325986,20322705],[1698931,2393792,2393793,2393794,2393796],[2393822,2393823],[2393859,2393864,2393869]]", JSON.stringify(lc.parse(json, "json", response)));

      response = "data.vs.cs.id";
      equal("[[2333784,2403463,4325986,20322705],[1698931,2393792,2393793,2393794,2393796],[2393822,2393823],[2393859,2393864,2393869]]", JSON.stringify(lc.parse(json, "json", response)));

      // 可一对数组使用索引来获取指定索引的元素
      response = "data.vs.1.cs.id"; // 只获取第一卷的数据
      equal("[1698931,2393792,2393793,2393794,2393796]", JSON.stringify(lc.parse(json, "json", response)));

    });

  });


  describe('LittleCrawler.js 测试', () => {

    let lc;
    let config;
    let html;

    before(() => {
      lc = new LittleCrawler();
      config = {
        "request": "https://se.qidian.com/?kw={keyword}",
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

    it('__urlJoin', ()=>{
      equal(null, LittleCrawler.__urlJoin(null, null));
      equal('http://www.test.com/abc', LittleCrawler.__urlJoin('http://www.test.com/abc', null));
      equal('http://www.test.com/abc', LittleCrawler.__urlJoin('http://www.test.com/abc', {}));
      equal('http://www.test.com/abc?id=1', LittleCrawler.__urlJoin('http://www.test.com/abc?id=1', {}));
      equal('http://www.test.com/abc?id=1&abc=2', LittleCrawler.__urlJoin('http://www.test.com/abc?id=1', {abc:2}));
      equal('http://www.test.com/abc?id=1&abc=2&def=abc', LittleCrawler.__urlJoin('http://www.test.com/abc?id=1', {abc:2, def:"abc"}));
      equal('http://www.test.com/abc?abc=2&def=abc', LittleCrawler.__urlJoin('http://www.test.com/abc', {abc:2, def:"abc"}));
    });

    it('cloneObjectValues', () => {
      let src = {abc: 1, def: 2, fff: undefined};
      let dest = {abc: 0, fff: 2};
      LittleCrawler.cloneObjectValues(dest, src);
      equal(1, dest.abc);
      equal(2, dest.fff);
      equal(false, "def" in dest);
    });

    it('string format', ()=> {
      equal(null, LittleCrawler.format());
      equal('', LittleCrawler.format(''));
      equal('', LittleCrawler.format('', {}));
      equal('abc123', LittleCrawler.format('abc{def}', {def: 123}));
      try{LittleCrawler.format('abc{def}')}catch(error){ equal("can't find the key def in object", error.message)};
      try{LittleCrawler.format('abc{def}', {})}catch(error){ equal("can't find the key def in object", error.message)};
      try{LittleCrawler.format('abc{def}', {}, true)}catch(error){ equal("can't find the key def in object", error.message)};

      equal('abc"123"', LittleCrawler.format('abc{def}', {def: "123"}, true));
      equal('abc123', LittleCrawler.format('abc{def}', {def: "123"}, false));
      equal('abc', LittleCrawler.format('abc{def}', {def: undefined}, false));
      equal('abcundefined', LittleCrawler.format('abc{def}', {def: undefined}, true));
      equal('abc', LittleCrawler.format('abc{def}', {def: null}, false));
      equal('abcnull', LittleCrawler.format('abc{def}', {def: null}, true));

    });

    it('fixurl', () => {
      let host1 = "http://www.test.com";
      let host2 = "http://www.test.com/abc/def?test";
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

    it('filterTag', () => {
      let html = '<div>abcdef</div><br/><div/><div />';

      assert.equal(null, LittleCrawler.filterTag(null, null));
      assert.equal(html, LittleCrawler.filterTag(html, null));
      assert.equal(html, LittleCrawler.filterTag(html, ""));

      assert.notInclude(LittleCrawler.filterTag(html, 'div'), 'div');
    });

    it('replaceTag', () => {
      let html = '<div>abcdef</div><br/><div/><div />';

      assert.equal(null, LittleCrawler.replaceTag(null, null));
      assert.equal(html, LittleCrawler.replaceTag(html, null));
      assert.equal(html, LittleCrawler.replaceTag(html, ""));

      assert.notInclude(LittleCrawler.replaceTag(html, 'div', 'ab-div'), '<div');
      assert.include(LittleCrawler.replaceTag(html, 'div', 'ab-div'), 'ab-div');
    });

    it('text2html', () => {
      equal(undefined,     LittleCrawler.text2html());
      equal('<p>test</p>', LittleCrawler.text2html('test'));
      equal('<p>test</p>', LittleCrawler.text2html('test'));
      equal('<p>test</p>', LittleCrawler.text2html('test'));
      equal('<p>test</p>\n<p>test2</p>', LittleCrawler.text2html('test\ntest2'));
    });

    it('__transformHTML', () => {
      assert.equal("", lc.__transformHTML(""));
      assert.equal(null, lc.__transformHTML());

      let html = `
        <link rel="stylesheet" href="lib/bootstrap-3.3.7/css/bootstrap.min.css" />
        <link rel="icon" sizes="any" mask href="//www.baidu.com/img/baidu.svg"/>
        <meta http-equiv="refresh" content="0; url=/baidu.html?from=noscript">
        <meta charset="UTF-8">
        <style id="abc"></style>
        <style>abc</style>
        <script type="text/javascript" src="cordova.js"></script>
        <script type="text/javascript" src="cordova.js">abcdef</script>
        <title>ChDCReader</title>
        <iframe src="cordova"></iframe>
        <img src="test.png">
        <img src="test.png" />
      `;

      let fh = lc.__transformHTML(html);
      assert.include(fh, '<img lc-src="test.png" />');
      assert.notInclude(fh, '<img src="test.png" />');
      equal(html, lc.__reverseHTML(fh));

      // return LittleCrawler.ajax("get", "http://www.baidu.com")
      //   .then(html => {
      //     let fh = lc.__transformHTML(html);
      //     let rhtml = lc.__reverseHTML(fh);
      //     debugger;
      //     equal(html, rhtml);
      //   });
    });

    it('clearHtml', () => {
      assert.equal("", LittleCrawler.clearHtml(""));
      assert.equal(null, LittleCrawler.clearHtml());

      let html = `
        <link rel="stylesheet" href="lib/bootstrap-3.3.7/css/bootstrap.min.css">
        <meta charset="UTF-8">
        <style></style>
        <style>abc</style>
        <script type="text/javascript" src="cordova.js">
        </script>
        <title>ChDCReader</title>
        <iframe src="cordova"></iframe>
        <img class="css" src="test.png">
        <img align="right" src="test.png" />
        <img class="css" src="test.png"></img>
        <p class
        ="css" style
        ="color:red;">Test1</p>

        Test2<br/>
        Test3<br/>
        Test4<br/>
        Test2<br/>
        Test2<br/>
        Test2<br/>
        <p class="css" style="color='red'">Test10</p>
      `;

      let fh = LittleCrawler.clearHtml(html);
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

    it('filterHtmlContent', () => {
      assert.equal("", LittleCrawler.filterHtmlContent(""));
      assert.equal(null, LittleCrawler.filterHtmlContent());

      let html = `
        <link rel="stylesheet"
        href="lib/bootstrap-3.3.7/css/bootstrap.min.css">
        <meta charset="UTF-8">
        <style></style>
        <style>abc
        </style>
        <script type="text/javascript" src="cordova.js"></script>
        <title>ChDCReader</title>
        <iframe src="cordova"></iframe>
        <img src="test.png">
        <img src="test.png" />
      `;
      let fh = LittleCrawler.filterHtmlContent(html);
      assert.notInclude(fh, '<style');
      assert.notInclude(fh, '<meta');
      assert.notInclude(fh, '<link');
      assert.notInclude(fh, '<iframe');
      assert.include(fh, '<img');
    });

    it('getDataFromObject', () => {
      equal(undefined, LittleCrawler.getDataFromObject());
      assert.isObject(LittleCrawler.getDataFromObject({}));
      equal(1, LittleCrawler.getDataFromObject({abc:1}, "abc"));

      let obj = {
        abc:{
          def: {
            hij: {
              mno: 2
            }
          }
        },
        def: [
          {
            abc:{
              def: 2,
              ddd: [1,2,3]
            }
          },
          {
            abc:{
              def: 3,
              ddd: [4,5,6]
            }
          }
        ],
        fff: [
          {
            abc:{
              def: 2,
              ddd: [{a:1},{a:2},{a:3}]
            }
          },
          {
            abc:{
              def: 3,
              ddd: [{a:4},{a:5},{a:6}]
            }
          }
        ]
      };
      equal(2, LittleCrawler.getDataFromObject(obj, "abc::def::hij::mno"));
      equal(2, LittleCrawler.getDataFromObject(obj, "abc.def.hij.mno"));
      assert.sameMembers([2,3], LittleCrawler.getDataFromObject(obj, "def::abc::def"));
      assert.sameMembers([2,3], LittleCrawler.getDataFromObject(obj, "def.abc.def"));
      equal('[[1,2,3],[4,5,6]]', JSON.stringify(LittleCrawler.getDataFromObject(obj, "def::abc::ddd")));
      equal('[[1,2,3],[4,5,6]]', JSON.stringify(LittleCrawler.getDataFromObject(obj, "def.abc.ddd")));
      assert.sameMembers([1,2,3,4,5,6], LittleCrawler.getDataFromObject(obj, "fff::abc#concat::ddd::a"));
      assert.sameMembers([4,5,6], LittleCrawler.getDataFromObject(obj, "fff::abc#filter(\"$element.def==3\")#concat::ddd::a"));
      assert.sameMembers([5,6], LittleCrawler.getDataFromObject(obj, "fff::abc#filter(\"$element.def==3\")#concat::ddd::a#filter(\"$element >=5\")"));
    });

    it('空 Request 和 空 Response', ()=>{
      return lc.get()
        .catch(error => equal("Empty response", error.message));
    });

    it('空 Request 和 空 url 的 dict', ()=>{
      let config = {
        "response": {
        }
      };
      return lc.get(config, {keyword: "神墓"})
        .catch(error => equal("Empty URL", error.message));
    });

    it('完整的 Request 类型为 JSON，type 为 format', ()=>{
      let config = {
        "request": {
            "url": "https://book.qidian.com/ajax/book/category?_csrfToken=&bookId=63856",
            "timeout": 15,
            "type": "JSON",
            "ajax": "cordova"
        },
        "response": {
            "type": "array",
            "element": "data::vs::cs#filter(\"$parent.vN.indexOf(\\\"相关\\\") < 0\")#concat",
            "children": {
                "name": "cN",
                "linkid": "cU",
                "link": {
                    "type": "format",
                    "value": "https://read.qidian.com/chapter/{linkid}"
                }
            }
        }
      }
      return lc.get(config)
        .then(r => {
          equal('第一章 远古神墓', r[0].name);
          assert.lengthOf(r[0].link.match(/^http/), 1);
        });
    });

    it('空 Request 2 和 非空 url 的 dict', ()=>{
      let config = {
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
      return lc.get(config, {keyword: "神墓", url: 'https://se.qidian.com/?kw=神墓'})
        .then(r => {
          equal('神墓', r[0].name);
          equal(true, !!r[0].coverImg)
        });
    });

    it('完整的 Request 类型为 HTML，类型为 Object，type 为 array', ()=>{
      let config = {
        "request": {
          "url": "https://se.qidian.com/?kw={keyword}",
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
      return lc.get(config, {keyword: "神墓"})
        .then(r => equal('神墓', r[0].name));
    });

    it('timeout == 0.05', ()=>{
      let config = {
        "request": {
          "url": "https://se.qidian.com/?kw={keyword}",
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
      return lc.get(config, {keyword: "神墓"})
        .catch(error => equal('AjaxError: Request Timeout', error.message));
    });

    it('string 的 Request', ()=>{

      return lc.get(config, {keyword: "神墓"})
        .then(r => equal('神墓', r[0].name));
    });

    it('Response 类型为 Array', ()=>{
      let config = {
          "request": {
              "url": "https://book.qidian.com/info/63856",
              "timeout": 5
          },
          "response": [
              "div.book-info > h1 > em",
              "div.book-info > h1 > span > a"
          ]
      };
      return lc.get(config, {keyword: "神墓"})
        .then(r => {
          equal('神墓', r[0])
          equal('辰东', r[1])
        });
    });

    it('Response 类型为 String', ()=>{
      let config = {
          "request": {
              "url": "https://book.qidian.com/info/63856",
              "timeout": 5
          },
          "response": "div.book-info > h1 > em"
      };
      return lc.get(config, {keyword: "神墓"})
              .then(r => equal('神墓', r));
    });

    it('Response 类型为 Object，type 为 boolean', ()=>{
      return lc.get(config, {keyword: "神墓"})
        .then(r => {
          equal(true, r[0].complete);
        });
    });

    it('Response 类型为 Object，type 为 string', ()=>{
      return lc.get(config, {keyword: "神墓"})
        .then(r => {
          equal('63856', r[0].bookid);
        });
    });

    it('特殊的键名：image, link', ()=>{
      return lc.get(config, {keyword: "神墓"})
        .then(r => {
          equal('http://qidian.qpic.cn/qdbimg/349573/63856/150', r[0].coverImg);
          equal('http://book.qidian.com/info/63856', r[0].detailLink);
        });
    });



    it('Type 为 array，有 valideach 属性', ()=>{
      let config = {
        "request": {
          "url": "http://se.qidian.com/?kw={keyword}",
          "timeout": 5
        },
        "response": {
          "type": "array",
          "element": "#result-list li[data-rid]",
          "valideach": "{complete}==true",
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
      return lc.get(config, {keyword: "神墓"})
        .then(r => equal('神墓', r[0].name));
    });

  });
}));


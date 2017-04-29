define(["chai", 'util', "Spider"], function(chai, util, Spider){

  /************************************
    测试用例规范：
    * 先写空参数测试
    * 再写异常参数测试
    * 正确参数和正确结果
  ************************************/

  let assert = chai.assert;
  let equal = assert.equal;

  describe('Spider.js 测试', () => {

    let spider;
    let config;

    before(() => {
      spider = new Spider(util.ajax.bind(util));
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
    });


    it('string format', ()=> {
      equal(null, spider.format());
      equal('', spider.format(''));
      equal('', spider.format('', {}));
      equal('abc{def}', spider.format('abc{def}'));
      equal('abc123', spider.format('abc{def}', {def: 123}));
      equal('abc{def}', spider.format('abc{def}', {}));

      equal('abc"123"', spider.format('abc{def}', {def: "123"}, true));
      equal('abc123', spider.format('abc{def}', {def: "123"}, false));

    });

    it('fixurl', () => {
      let host1 = "http://www.test.com";
      let host2 = "http://www.test.com/abc/def?test";
      equal(undefined, spider.fixurl());
      equal("http://www.abc.com", spider.fixurl("http://www.abc.com"));
      equal("http://www.abc.com", spider.fixurl("://www.abc.com"));
      equal("http://www.abc.com", spider.fixurl("//www.abc.com"));
      equal("http://www.test.com/www.abc.com", spider.fixurl("www.abc.com", host1));
      equal("http://www.test.com/def/abc/ddd", spider.fixurl("/def/abc/ddd", host1));

      equal("http://www.test.com/abc/www.abc.com", spider.fixurl("www.abc.com", host2));
      equal("http://www.test.com/def/abc/ddd", spider.fixurl("/def/abc/ddd", host2));
      equal("http://www.test.com/def/abc/ddd", spider.fixurl("../def/abc/ddd", host2));
    });

    it('__filterElement', () => {
      let html = '<div>abcdef</div><br/><div/><div />';

      assert.equal(null, spider.__filterElement(null, null));
      assert.equal(html, spider.__filterElement(html, null));
      assert.equal(html, spider.__filterElement(html, ""));

      assert.notInclude(spider.__filterElement(html, 'div'), 'div');
    });

    it('__transformHTMLTagProperty', () => {
      assert.equal("", spider.__transformHTMLTagProperty(""));
      assert.equal(null, spider.__transformHTMLTagProperty());

      let html = `
        <link rel="stylesheet" href="lib/bootstrap-3.3.7/css/bootstrap.min.css">
        <meta charset="UTF-8">
        <style></style>
        <style>abc</style>
        <script type="text/javascript" src="cordova.js"></script>
        <title>ChDCReader</title>
        <iframe src="cordova"></iframe>
        <img src="test.png" />
        <img src="test.png" />
      `;

      let fh = spider.__transformHTMLTagProperty(html);
      assert.include(fh, '<img data-src="test.png" />');
      assert.notInclude(fh, '<img src="test.png" />');
    });

    it('clearHtml', () => {
      assert.equal("", spider.clearHtml(""));
      assert.equal(null, spider.clearHtml());

      let html = `
        <link rel="stylesheet" href="lib/bootstrap-3.3.7/css/bootstrap.min.css">
        <meta charset="UTF-8">
        <style></style>
        <style>abc</style>
        <script type="text/javascript" src="cordova.js">
        </script>
        <title>ChDCReader</title>
        <iframe src="cordova"></iframe>
        <img class="css" src="test.png" />
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

      let fh = spider.clearHtml(html);
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

      equal('<p>test1</p><p>test2</p><p>test3</p>', spider.clearHtml('test1<br>test2<br>test3'));
      equal('<div><p>test1</p><p>test2</p><p>test3</p></div>', spider.clearHtml('<div>test1<br>test2<br>test3</div>'));
      equal('<p>test1</p><p>test2</p><p>test3</p><p>test4</p>', spider.clearHtml('test1<br>test2<br>test3<p>test4</p>'));
      equal('<p>test1</p><p>test3</p><p>test4</p>', spider.clearHtml('test1<br><br>test3<p>test4</p>'));
      equal('<p></p><p>1</p><p>test3</p><p>test4</p>', spider.clearHtml('<br>1<br>test3<p>test4</p>'));
      equal('<p>test1</p><p>test2</p><p>test3</p>', spider.clearHtml('test1<br><br>test2<br><br>test3'));
    });

    it('filterHtmlContent', () => {
      assert.equal("", spider.filterHtmlContent(""));
      assert.equal(null, spider.filterHtmlContent());

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
        <img src="test.png" />
        <img src="test.png" />
      `;
      let fh = spider.filterHtmlContent(html);
      assert.notInclude(fh, '<style');
      assert.notInclude(fh, '<meta');
      assert.notInclude(fh, '<link');
      assert.notInclude(fh, '<iframe');
      assert.include(fh, '<img');
    });

    it('getDataFromObject', () => {
      equal(undefined, spider.__getDataFromObject());
      assert.isObject(spider.__getDataFromObject({}));
      equal(1, spider.__getDataFromObject({abc:1}, "abc"));

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
      equal(2, spider.__getDataFromObject(obj, "abc::def::hij::mno"));
      assert.sameMembers([2,3], spider.__getDataFromObject(obj, "def::abc::def"));
      equal('[[1,2,3],[4,5,6]]', JSON.stringify(spider.__getDataFromObject(obj, "def::abc::ddd")));
      assert.sameMembers([1,2,3,4,5,6], spider.__getDataFromObject(obj, "fff::abc::ddd#concat::a"));
      assert.sameMembers([4,5,6], spider.__getDataFromObject(obj, "fff::abc#filter(\"$element.def==3\")::ddd#concat::a"));
      assert.sameMembers([5,6], spider.__getDataFromObject(obj, "fff::abc#filter(\"$element.def==3\")::ddd#concat::a#filter(\"$element >=5\")"));
    });

    it('空 Request 和 空 Response', ()=>{
      return spider.get()
        .catch(error => equal("Empty response", error.message));
    });

    it('空 Request 和 空 url 的 dict', ()=>{
      let config = {
        "response": {
        }
      };
      return spider.get(config, {keyword: "神墓"})
        .catch(error => equal("Empty URL", error.message));
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
      return spider.get(config, {keyword: "神墓", url: 'http://se.qidian.com/?kw=神墓'})
        .then(r => equal('神墓', r[0].name));
    });

    it('完整的 Request 类型为 HTML，类型为 Object，type 为 array', ()=>{
      let config = {
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
      return spider.get(config, {keyword: "神墓"})
        .then(r => equal('神墓', r[0].name));
    });

    it('完整的 Request 类型为 JSON，type 为 format', ()=>{
      let config = {
        "request": {
            "url": "http://book.qidian.com/ajax/book/category?_csrfToken=&bookId=63856",
            "timeout": 15,
            "type": "JSON"
        },
        "response": {
            "type": "array",
            "element": "data::vs#filter(\"$element.vN.indexOf(\\\"相关\\\") < 0\")::cs#concat",
            "children": {
                "name": "cN",
                "linkid": "cU",
                "vip": "sS",
                "link": {
                    "type": "format",
                    "value": "http://read.qidian.com/chapter/{linkid}",
                    "valid": "{vip}==1"
                }
            }
        }
      }
      return spider.get(config, {keyword: "神墓"})
        .then(r => {
          equal('第一章 远古神墓', r[0].name);
          assert.lengthOf(r[0].link.match(/^http/), 1);
        });
    });

    it('timeout == 0.05', ()=>{
      let config = {
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
      return spider.get(config, {keyword: "神墓"})
        .catch(error => equal('Request Timeout', error.message));
    });

    it('string 的 Request', ()=>{

      return spider.get(config, {keyword: "神墓"})
        .then(r => equal('神墓', r[0].name));
    });

    it('Response 类型为 Array', ()=>{
      let config = {
          "request": {
              "url": "http://book.qidian.com/info/63856",
              "timeout": 5
          },
          "response": [
              "div.book-info > h1 > em",
              "div.book-info > h1 > span > a"
          ]
      };
      return spider.get(config, {keyword: "神墓"})
        .then(r => {
          equal('神墓', r[0])
          equal('辰东', r[1])
        });
    });

    it('Response 类型为 String', ()=>{
      let config = {
          "request": {
              "url": "http://book.qidian.com/info/63856",
              "timeout": 5
          },
          "response": "div.book-info > h1 > em"
      };
      return spider.get(config, {keyword: "神墓"})
              .then(r => equal('神墓', r));
    });

    it('Response 类型为 Object，type 为 boolean', ()=>{
      return spider.get(config, {keyword: "神墓"})
        .then(r => {
          equal(true, r[0].complete);
        });
    });

    it('Response 类型为 Object，type 为 string', ()=>{
      return spider.get(config, {keyword: "神墓"})
        .then(r => {
          equal('63856', r[0].bookid);
        });
    });

    it('特殊的键名：image, link', ()=>{
      return spider.get(config, {keyword: "神墓"})
        .then(r => {
          equal('http://qidian.qpic.cn/qdbimg/349573/63856/150', r[0].coverImg);
          equal('http://book.qidian.com/info/3068557', r[1].detailLink);
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
      return spider.get(config, {keyword: "神墓"})
        .then(r => equal('神墓深渊', r[0].name));
    });

  });
});


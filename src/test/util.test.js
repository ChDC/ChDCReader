define(["chai", "util"], function(chai, util){

  /************************************
    测试用例规范：
    * 先写空参数测试
    * 再写异常参数测试
    * 正确参数和正确结果
  ************************************/

  let assert = chai.assert;
  let equal = assert.equal;

  describe('Util.js 测试', () => {

    // it('__urlJoin', ()=>{
    //   equal(null, util.__urlJoin(null, null));
    //   equal('http://www.test.com/abc', util.__urlJoin('http://www.test.com/abc', null));
    //   equal('http://www.test.com/abc', util.__urlJoin('http://www.test.com/abc', {}));
    //   equal('http://www.test.com/abc?id=1', util.__urlJoin('http://www.test.com/abc?id=1', {}));
    //   equal('http://www.test.com/abc?id=1&abc=2', util.__urlJoin('http://www.test.com/abc?id=1', {abc:2}));
    //   equal('http://www.test.com/abc?id=1&abc=2&def=abc', util.__urlJoin('http://www.test.com/abc?id=1', {abc:2, def:"abc"}));
    //   equal('http://www.test.com/abc?abc=2&def=abc', util.__urlJoin('http://www.test.com/abc', {abc:2, def:"abc"}));
    // });

    // it("get", () => {
    //   let p1 = util.get().catch(error => {
    //       assert.equal("url is null", error.message);
    //     });

    //   let p2 = util.get("http://httpbin.org/get")
    //     .then(data => {
    //       assert.typeOf(data, "string");
    //     });
    //   return Promise.all([p1]);
    // });

    // it("getJSON", () => {

    //   return util.getJSON("http://httpbin.org/get", {abc: "test", def: "ddd"})
    //     .then(data => {
    //       assert.typeOf(data, "object");
    //       assert.equal("test", data.args.abc);
    //       assert.equal("ddd", data.args.def);
    //     })
    // });

    // it("getDOM", () => {
    //   return util.getDOM("http://httpbin.org/get", {abc: "test", def: "ddd"})
    //     .then(data => {
    //       assert.typeOf(data, "string");
    //       assert.include(data, '<div>');
    //     })
    // });

    // it('__filterElement', () => {
    //   let html = '<div>abcdef</div><br/><div/><div />';

    //   assert.equal(null, util.__filterElement(null, null));
    //   assert.equal(html, util.__filterElement(html, null));
    //   assert.equal(html, util.__filterElement(html, ""));

    //   assert.notInclude(util.__filterElement(html, 'div'), 'div');
    // });

    // it('filterHtmlContent', () => {
    //   assert.equal("", util.filterHtmlContent(""));
    //   assert.equal(null, util.filterHtmlContent());

    //   let html = `
    //     <link rel="stylesheet" href="lib/bootstrap-3.3.7/css/bootstrap.min.css">
    //     <meta charset="UTF-8">
    //     <style></style>
    //     <style>abc</style>
    //     <script type="text/javascript" src="cordova.js"></script>
    //     <title>ChDCNovelReader</title>
    //     <iframe src="cordova"></iframe>
    //     <img src="test.png" />
    //     <img src="test.png" />
    //   `;
    //   let fh = util.filterHtmlContent(html);
    //   assert.notInclude(fh, 'style');
    //   assert.notInclude(fh, 'meta');
    //   assert.notInclude(fh, 'link');
    //   assert.notInclude(fh, 'iframe');
    //   assert.include(fh, 'img');
    //   assert.include(fh, '<img data-src="test.png" />');
    //   assert.notInclude(fh, '<img src="test.png" />');

    // });

    // it('getParamsFromURL', ()=> {
    //   assert.isObject(util.getParamsFromURL(""));
    //   let o1 = util.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546&");
    //   let o2 = util.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546");
    //   let o3 = util.getParamsFromURL("http://www.baidu.com/abc");
    //   let o4 = util.getParamsFromURL("http://www.baidu.com/abc?test");
    //   equal('123', o1.def);
    //   equal('4546', o1.ttt);
    //   equal('123', o2.def);
    //   assert.isObject(o3);
    //   assert.isTrue('test' in o4);
    // });

    // it('string format', ()=> {
    //   equal(null, util.format());
    //   equal('', util.format(''));
    //   equal('', util.format('', {}));
    //   equal('abc{def}', util.format('abc{def}'));
    //   equal('abc123', util.format('abc{def}', {def: 123}));
    //   equal('abc{def}', util.format('abc{def}', {}));
    // });



    it('getDataFromObject', () => {
      equal(undefined, util.getDataFromObject());
      assert.isObject(util.getDataFromObject({}));
      equal(1, util.getDataFromObject({abc:1}, "abc"));

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
      equal(2, util.getDataFromObject(obj, "abc.def.hij.mno"));
      assert.sameMembers([2,3], util.getDataFromObject(obj, "def.abc.def"));
      equal('[[1,2,3],[4,5,6]]', JSON.stringify(util.getDataFromObject(obj, "def.abc.ddd")));
      assert.sameMembers([1,2,3,4,5,6], util.getDataFromObject(obj, "fff.abc.ddd:concat.a"));

    });

    it('fixurl', () => {
      let host1 = "http://www.test.com";
      let host2 = "http://www.test.com/abc/def?test";
      equal(undefined, util.fixurl());
      equal("http://www.abc.com", util.fixurl("http://www.abc.com"));
      equal("http://www.abc.com", util.fixurl("://www.abc.com"));
      equal("http://www.abc.com", util.fixurl("//www.abc.com"));
      equal("http://www.test.com/www.abc.com", util.fixurl("www.abc.com", host1));
      equal("http://www.test.com/def/abc/ddd", util.fixurl("/def/abc/ddd", host1));

      equal("http://www.test.com/abc/www.abc.com", util.fixurl("www.abc.com", host2));
      equal("http://www.test.com/def/abc/ddd", util.fixurl("/def/abc/ddd", host2));
      equal("http://www.test.com/def/abc/ddd", util.fixurl("../def/abc/ddd", host2));
    });

    it('html2text', () => {
      equal(undefined, util.html2text());
      equal("test1", util.html2text('<p class="test">test1</p>'));
      equal("test1", util.html2text('t<span>es</span>t<b>1</b><br/>'));
      equal("test1\ntest2", util.html2text('test1<br/>test2'));
      equal("test1", util.html2text('<p class="test">test1</p>'));
    });

    it('text2html', () => {
      equal(undefined, util.text2html());
      equal('<p>test</p>', util.text2html('test'));
      equal('<p class="abc">test</p>', util.text2html('test', 'abc'));
      equal('<p class="abc def">test</p>', util.text2html('test', "abc def"));
      equal('<p>test</p>\n<p>test2</p>', util.text2html('test\ntest2'));
    });

    it('objectCast', () => {
      equal(undefined, util.objectCast());
      equal('{}', JSON.stringify(util.objectCast({})));
      let A = function(){};
      equal("A", util.objectCast({}, A).constructor.name);
    });

    it('arrayCast', () => {
      equal(undefined, util.arrayCast());
      equal('[]', JSON.stringify(util.arrayCast([])));
      let A = function(){};
      equal("A", util.arrayCast([{},{}], A)[1].constructor.name);
    });

    it('listMatch', () => {
      equal(-1, util.listMatch());
      let listA = ["A", "B", "C", "D", "E"];
      let listB = ["B", "C", "D", "E", "B"];
      equal(0, util.listMatch(listA, listB, 1));
      equal(3, util.listMatch([3,2,1,4,5,6], [2,2,3,2,1,4,5,6], 1));
      equal(-1, util.listMatch([3,2,1,4,5,6], [3,4,1,4,5,6], 1));
      equal(3, util.listMatch([3,2,1,4,5,6], [3,4,1,2,4,5,6], 1));
      equal(6, util.listMatch([3,2,1,4,5,6], [3,4,1,2,4,5,6,6], 5));
      equal(8, util.listMatch([3,2,1,4,5,6], [3,4,6,3,2,1,4,5,6], 5));
    });

    it('listMatchWithNeighbour', () => {
      equal(-1, util.listMatchWithNeighbour());
      let listA = ["A", "B", "C", "D", "E"];
      let listB = ["B", "C", "D", "E", "B"];
      equal(0, util.listMatchWithNeighbour(listA, listB, 1));
      equal(3, util.listMatchWithNeighbour([3,2,1,4,5,6], [2,2,3,2,1,4,5,6], 1));
      equal(1, util.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,1,4,5,6], 1));
      equal(1, util.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,1,2,4,5,6], 1));
      equal(-1, util.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,1,2,4,5,6,6], 5));
      equal(8, util.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,6,3,2,1,4,5,6], 5));
    });

    it('storage', () => {
      let p1 = util.saveData()
        .catch(error => {
          equal("Illegal args", error.message);
        });
      let p2 = util.saveData("abc", {abc: "test", def: "fff"})
        .then(() =>
          util.loadData("abc"))
        .then(data => {
              equal("test", data.abc);
              equal("fff", data.def);
            })
        .then(() => util.dataExists("abc"))

        .then(r => equal(true, r))
        .then(() => util.removeData("abc"))

        .then(() => util.dataExists("abc"))
        .then(r => equal(false, r))

        .then(() =>
          util.loadData("abc"))
        .then(data => {
          equal(null, data);
        })
        ;

      return Promise.all([p1, p2]);
    });

    it('stripString', () => {
      equal(undefined, util.stripString());
      equal('', util.stripString(''));
      equal('第一章好的啊', util.stripString('第一章 好的啊【啊啊】(test)'));

    });

    it('arrayCount', () => {
      equal(null, util.arrayCount());
      assert.lengthOf(util.arrayCount([]), 0);
      equal(1, util.arrayCount([2])[0][1]);
      equal(3, util.arrayCount([1,2,4,3,4,4,5])[0][1]);
    });

    it('persistent', () => {
      let data = [
        undefined,
        null,
        "test",
        {
          def: "test",
          1:2,
          test: true,
        },
        "",
        [1,2,3]
      ];
      for(let a of data){
        equal(JSON.stringify(a), util.persistent(a));
      }
      equal('[1,2,3]', util.persistent([1,2,,,,,3]));

      let A = function() {
        this.def = "test";
        this.abc = "ddd";
        this.ddd = "fff";
      };

      A.persistentInclude = ['def', "ddd", "fff"];
      let a = new A();
      a.fff = 'eee';
      equal('{"def":"test","ddd":"fff","fff":"eee"}', util.persistent(a));
    });
  });
});

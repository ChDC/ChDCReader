define(["chai", "util"], function(chai, util){

  let assert = chai.assert;
  let equal = assert.equal;

  describe('Util.js 测试', () => {

    it('__urlJoin', ()=>{
      equal(null, util.__urlJoin(null, null));
      equal('http://www.test.com/abc', util.__urlJoin('http://www.test.com/abc', null));
      equal('http://www.test.com/abc', util.__urlJoin('http://www.test.com/abc', {}));
      equal('http://www.test.com/abc?id=1', util.__urlJoin('http://www.test.com/abc?id=1', {}));
      equal('http://www.test.com/abc?id=1&abc=2', util.__urlJoin('http://www.test.com/abc?id=1', {abc:2}));
      equal('http://www.test.com/abc?id=1&abc=2&def=abc', util.__urlJoin('http://www.test.com/abc?id=1', {abc:2, def:"abc"}));
      equal('http://www.test.com/abc?abc=2&def=abc', util.__urlJoin('http://www.test.com/abc', {abc:2, def:"abc"}));
    });

    it("get", () => {
      let p1 = util.get().catch(error => {
          assert.equal("url is null", error.message);
        });

      let p2 = util.get("http://httpbin.org/get")
        .then(data => {
          assert.typeOf(data, "string");
        });
      return Promise.all([p1]);
    });

    it("getJSON", () => {

      return util.getJSON("http://httpbin.org/get", {abc: "test", def: "ddd"})
        .then(data => {
          assert.typeOf(data, "object");
          assert.equal("test", data.args.abc);
          assert.equal("ddd", data.args.def);
        })
    });

    // it("getDOM", () => {
    //   return util.getDOM("http://httpbin.org/get", {abc: "test", def: "ddd"})
    //     .then(data => {
    //       assert.typeOf(data, "string");
    //       assert.include(data, '<div>');
    //     })
    // });

    it('getParamsFromURL', ()=> {
      assert.isObject(util.getParamsFromURL(""));
      let o1 = util.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546&");
      let o2 = util.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546");
      let o3 = util.getParamsFromURL("http://www.baidu.com/abc");
      let o4 = util.getParamsFromURL("http://www.baidu.com/abc?test");
      equal('123', o1.def);
      equal('4546', o1.ttt);
      equal('123', o2.def);
      assert.isObject(o3);
      assert.isTrue('test' in o4);
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

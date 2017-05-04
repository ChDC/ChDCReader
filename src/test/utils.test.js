define(["chai", "utils"], function(chai, utils){

  let assert = chai.assert;
  let equal = assert.equal;

  describe('utils.js 测试', () => {

    it("get", () => {
      let p1 = utils.get().catch(error => {
          assert.equal("url is null", error.message);
        });

      let p2 = utils.get("http://httpbin.org/get")
        .then(data => {
          assert.typeOf(data, "string");
        });
      return Promise.all([p1]);
    });

    it("getJSON", () => {

      return utils.getJSON("http://httpbin.org/get", {abc: "test", def: "ddd"})
        .then(data => {
          assert.typeOf(data, "object");
          assert.equal("test", data.args.abc);
          assert.equal("ddd", data.args.def);
        })
    });

    // it("getDOM", () => {
    //   return utils.getDOM("http://httpbin.org/get", {abc: "test", def: "ddd"})
    //     .then(data => {
    //       assert.typeOf(data, "string");
    //       assert.include(data, '<div>');
    //     })
    // });

    it('getParamsFromURL', ()=> {
      assert.isObject(utils.getParamsFromURL(""));
      let o1 = utils.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546&");
      let o2 = utils.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546");
      let o3 = utils.getParamsFromURL("http://www.baidu.com/abc");
      let o4 = utils.getParamsFromURL("http://www.baidu.com/abc?test");
      equal('123', o1.def);
      equal('4546', o1.ttt);
      equal('123', o2.def);
      assert.isObject(o3);
      assert.isTrue('test' in o4);
    });


    // it('html2text', () => {
    //   equal(undefined, utils.html2text());
    //   equal("test1", utils.html2text('<p class="test">test1</p>'));
    //   equal("test1", utils.html2text('t<span>es</span>t<b>1</b><br/>'));
    //   equal("test1\ntest2", utils.html2text('test1<br/>test2'));
    //   equal("test1", utils.html2text('<p class="test">test1</p>'));
    // });

    it('objectCast', () => {
      equal(undefined, utils.objectCast());
      equal('{}', JSON.stringify(utils.objectCast({})));
      let A = function(){};
      equal("A", utils.objectCast({}, A).constructor.name);
    });

    it('arrayCast', () => {
      equal(undefined, utils.arrayCast());
      equal('[]', JSON.stringify(utils.arrayCast([])));
      let A = function(){};
      equal("A", utils.arrayCast([{},{}], A)[1].constructor.name);
    });

    it('listMatch', () => {
      equal(-1, utils.listMatch());
      let listA = ["A", "B", "C", "D", "E"];
      let listB = ["B", "C", "D", "E", "B"];
      equal(0, utils.listMatch(listA, listB, 1));
      equal(3, utils.listMatch([3,2,1,4,5,6], [2,2,3,2,1,4,5,6], 1));
      equal(-1, utils.listMatch([3,2,1,4,5,6], [3,4,1,4,5,6], 1));
      equal(3, utils.listMatch([3,2,1,4,5,6], [3,4,1,2,4,5,6], 1));
      equal(6, utils.listMatch([3,2,1,4,5,6], [3,4,1,2,4,5,6,6], 5));
      equal(8, utils.listMatch([3,2,1,4,5,6], [3,4,6,3,2,1,4,5,6], 5));
    });

    it('listMatchWithNeighbour', () => {
      equal(-1, utils.listMatchWithNeighbour());
      let listA = ["A", "B", "C", "D", "E"];
      let listB = ["B", "C", "D", "E", "B"];
      equal(0, utils.listMatchWithNeighbour(listA, listB, 1));
      equal(3, utils.listMatchWithNeighbour([3,2,1,4,5,6], [2,2,3,2,1,4,5,6], 1));
      equal(1, utils.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,1,4,5,6], 1));
      equal(1, utils.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,1,2,4,5,6], 1));
      equal(-1, utils.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,1,2,4,5,6,6], 5));
      equal(8, utils.listMatchWithNeighbour([3,2,1,4,5,6], [3,4,6,3,2,1,4,5,6], 5));
    });

    it('storage', () => {
      let p1 = utils.saveData()
        .catch(error => {
          equal("Illegal args", error.message);
        });
      let p2 = utils.saveData("abc/def/fff.json", {abc: "test", def: "fff"})
        .then(() =>
          utils.loadData("abc/def/fff.json"))
        .then(data => {
              equal("test", data.abc);
              equal("fff", data.def);
            })
        .then(() => utils.dataExists("abc/def/fff.json"))

        .then(r => equal(true, r))
        .then(() => utils.removeData("abc/def/fff.json"))

        .then(() => utils.dataExists("abc/def/fff.json"))
        .then(r => equal(false, r))
        .then(() => utils.loadData("abc/def/fff.json"))
        .then(data => equal(null, data))
        .then(() => utils.removeData("abc/"))
        .then(()=> utils.dataExists("abc/"))
        .then(r => equal(false, r))

      return Promise.all([p1, p2]);
    });


    it('arrayCount', () => {
      equal(null, utils.arrayCount());
      assert.lengthOf(utils.arrayCount([]), 0);
      equal(1, utils.arrayCount([2])[0][1]);
      equal(3, utils.arrayCount([1,2,4,3,4,4,5])[0][1]);
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
        equal(JSON.stringify(a), utils.persistent(a));
      }
      equal('[1,2,3]', utils.persistent([1,2,,,,,3]));

      let A = function() {
        this.def = "test";
        this.abc = "ddd";
        this.ddd = "fff";
      };

      A.persistentInclude = ['def', "ddd", "fff"];
      let a = new A();
      a.fff = 'eee';
      equal('{"def":"test","ddd":"fff","fff":"eee"}', utils.persistent(a));
    });
  });
});

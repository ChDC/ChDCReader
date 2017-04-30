"use strict";

define(["chai", "utils"], function (chai, utils) {

  var assert = chai.assert;
  var equal = assert.equal;

  describe('utils.js 测试', function () {

    it('__urlJoin', function () {
      equal(null, utils.__urlJoin(null, null));
      equal('http://www.test.com/abc', utils.__urlJoin('http://www.test.com/abc', null));
      equal('http://www.test.com/abc', utils.__urlJoin('http://www.test.com/abc', {}));
      equal('http://www.test.com/abc?id=1', utils.__urlJoin('http://www.test.com/abc?id=1', {}));
      equal('http://www.test.com/abc?id=1&abc=2', utils.__urlJoin('http://www.test.com/abc?id=1', { abc: 2 }));
      equal('http://www.test.com/abc?id=1&abc=2&def=abc', utils.__urlJoin('http://www.test.com/abc?id=1', { abc: 2, def: "abc" }));
      equal('http://www.test.com/abc?abc=2&def=abc', utils.__urlJoin('http://www.test.com/abc', { abc: 2, def: "abc" }));
    });

    it("get", function () {
      var p1 = utils.get().catch(function (error) {
        assert.equal("url is null", error.message);
      });

      var p2 = utils.get("http://httpbin.org/get").then(function (data) {
        assert.typeOf(data, "string");
      });
      return Promise.all([p1]);
    });

    it("getJSON", function () {

      return utils.getJSON("http://httpbin.org/get", { abc: "test", def: "ddd" }).then(function (data) {
        assert.typeOf(data, "object");
        assert.equal("test", data.args.abc);
        assert.equal("ddd", data.args.def);
      });
    });

    it('getParamsFromURL', function () {
      assert.isObject(utils.getParamsFromURL(""));
      var o1 = utils.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546&");
      var o2 = utils.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546");
      var o3 = utils.getParamsFromURL("http://www.baidu.com/abc");
      var o4 = utils.getParamsFromURL("http://www.baidu.com/abc?test");
      equal('123', o1.def);
      equal('4546', o1.ttt);
      equal('123', o2.def);
      assert.isObject(o3);
      assert.isTrue('test' in o4);
    });

    it('html2text', function () {
      equal(undefined, utils.html2text());
      equal("test1", utils.html2text('<p class="test">test1</p>'));
      equal("test1", utils.html2text('t<span>es</span>t<b>1</b><br/>'));
      equal("test1\ntest2", utils.html2text('test1<br/>test2'));
      equal("test1", utils.html2text('<p class="test">test1</p>'));
    });

    it('text2html', function () {
      equal(undefined, utils.text2html());
      equal('<p>test</p>', utils.text2html('test'));
      equal('<p class="abc">test</p>', utils.text2html('test', 'abc'));
      equal('<p class="abc def">test</p>', utils.text2html('test', "abc def"));
      equal('<p>test</p>\n<p>test2</p>', utils.text2html('test\ntest2'));
    });

    it('objectCast', function () {
      equal(undefined, utils.objectCast());
      equal('{}', JSON.stringify(utils.objectCast({})));
      var A = function A() {};
      equal("A", utils.objectCast({}, A).constructor.name);
    });

    it('arrayCast', function () {
      equal(undefined, utils.arrayCast());
      equal('[]', JSON.stringify(utils.arrayCast([])));
      var A = function A() {};
      equal("A", utils.arrayCast([{}, {}], A)[1].constructor.name);
    });

    it('listMatch', function () {
      equal(-1, utils.listMatch());
      var listA = ["A", "B", "C", "D", "E"];
      var listB = ["B", "C", "D", "E", "B"];
      equal(0, utils.listMatch(listA, listB, 1));
      equal(3, utils.listMatch([3, 2, 1, 4, 5, 6], [2, 2, 3, 2, 1, 4, 5, 6], 1));
      equal(-1, utils.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 1, 4, 5, 6], 1));
      equal(3, utils.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6], 1));
      equal(6, utils.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6, 6], 5));
      equal(8, utils.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 6, 3, 2, 1, 4, 5, 6], 5));
    });

    it('listMatchWithNeighbour', function () {
      equal(-1, utils.listMatchWithNeighbour());
      var listA = ["A", "B", "C", "D", "E"];
      var listB = ["B", "C", "D", "E", "B"];
      equal(0, utils.listMatchWithNeighbour(listA, listB, 1));
      equal(3, utils.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [2, 2, 3, 2, 1, 4, 5, 6], 1));
      equal(1, utils.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 1, 4, 5, 6], 1));
      equal(1, utils.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6], 1));
      equal(-1, utils.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6, 6], 5));
      equal(8, utils.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 6, 3, 2, 1, 4, 5, 6], 5));
    });

    it('storage', function () {
      var p1 = utils.saveData().catch(function (error) {
        equal("Illegal args", error.message);
      });
      var p2 = utils.saveData("abc", { abc: "test", def: "fff" }).then(function () {
        return utils.loadData("abc");
      }).then(function (data) {
        equal("test", data.abc);
        equal("fff", data.def);
      }).then(function () {
        return utils.dataExists("abc");
      }).then(function (r) {
        return equal(true, r);
      }).then(function () {
        return utils.removeData("abc");
      }).then(function () {
        return utils.dataExists("abc");
      }).then(function (r) {
        return equal(false, r);
      }).then(function () {
        return utils.loadData("abc");
      }).then(function (data) {
        equal(null, data);
      });

      return Promise.all([p1, p2]);
    });

    it('stripString', function () {
      equal(undefined, utils.stripString());
      equal('', utils.stripString(''));
      equal('第一章好的啊', utils.stripString('第一章 好的啊【啊啊】(test)'));
    });

    it('arrayCount', function () {
      equal(null, utils.arrayCount());
      assert.lengthOf(utils.arrayCount([]), 0);
      equal(1, utils.arrayCount([2])[0][1]);
      equal(3, utils.arrayCount([1, 2, 4, 3, 4, 4, 5])[0][1]);
    });

    it('persistent', function () {
      var data = [undefined, null, "test", {
        def: "test",
        1: 2,
        test: true
      }, "", [1, 2, 3]];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _a = _step.value;

          equal(JSON.stringify(_a), utils.persistent(_a));
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

      equal('[1,2,3]', utils.persistent([1, 2,,,,, 3]));

      var A = function A() {
        this.def = "test";
        this.abc = "ddd";
        this.ddd = "fff";
      };

      A.persistentInclude = ['def', "ddd", "fff"];
      var a = new A();
      a.fff = 'eee';
      equal('{"def":"test","ddd":"fff","fff":"eee"}', utils.persistent(a));
    });
  });
});
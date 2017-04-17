"use strict";

define(["chai", "util"], function (chai, util) {

  var assert = chai.assert;
  var equal = assert.equal;

  describe('Util.js 测试', function () {

    it('__urlJoin', function () {
      equal(null, util.__urlJoin(null, null));
      equal('http://www.test.com/abc', util.__urlJoin('http://www.test.com/abc', null));
      equal('http://www.test.com/abc', util.__urlJoin('http://www.test.com/abc', {}));
      equal('http://www.test.com/abc?id=1', util.__urlJoin('http://www.test.com/abc?id=1', {}));
      equal('http://www.test.com/abc?id=1&abc=2', util.__urlJoin('http://www.test.com/abc?id=1', { abc: 2 }));
      equal('http://www.test.com/abc?id=1&abc=2&def=abc', util.__urlJoin('http://www.test.com/abc?id=1', { abc: 2, def: "abc" }));
      equal('http://www.test.com/abc?abc=2&def=abc', util.__urlJoin('http://www.test.com/abc', { abc: 2, def: "abc" }));
    });

    it("get", function () {
      var p1 = util.get().catch(function (error) {
        assert.equal("url is null", error.message);
      });

      var p2 = util.get("http://httpbin.org/get").then(function (data) {
        assert.typeOf(data, "string");
      });
      return Promise.all([p1]);
    });

    it("getJSON", function () {

      return util.getJSON("http://httpbin.org/get", { abc: "test", def: "ddd" }).then(function (data) {
        assert.typeOf(data, "object");
        assert.equal("test", data.args.abc);
        assert.equal("ddd", data.args.def);
      });
    });

    it('getParamsFromURL', function () {
      assert.isObject(util.getParamsFromURL(""));
      var o1 = util.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546&");
      var o2 = util.getParamsFromURL("http://www.baidu.com/abc?def=123&ttt=4546");
      var o3 = util.getParamsFromURL("http://www.baidu.com/abc");
      var o4 = util.getParamsFromURL("http://www.baidu.com/abc?test");
      equal('123', o1.def);
      equal('4546', o1.ttt);
      equal('123', o2.def);
      assert.isObject(o3);
      assert.isTrue('test' in o4);
    });

    it('html2text', function () {
      equal(undefined, util.html2text());
      equal("test1", util.html2text('<p class="test">test1</p>'));
      equal("test1", util.html2text('t<span>es</span>t<b>1</b><br/>'));
      equal("test1\ntest2", util.html2text('test1<br/>test2'));
      equal("test1", util.html2text('<p class="test">test1</p>'));
    });

    it('text2html', function () {
      equal(undefined, util.text2html());
      equal('<p>test</p>', util.text2html('test'));
      equal('<p class="abc">test</p>', util.text2html('test', 'abc'));
      equal('<p class="abc def">test</p>', util.text2html('test', "abc def"));
      equal('<p>test</p>\n<p>test2</p>', util.text2html('test\ntest2'));
    });

    it('objectCast', function () {
      equal(undefined, util.objectCast());
      equal('{}', JSON.stringify(util.objectCast({})));
      var A = function A() {};
      equal("A", util.objectCast({}, A).constructor.name);
    });

    it('arrayCast', function () {
      equal(undefined, util.arrayCast());
      equal('[]', JSON.stringify(util.arrayCast([])));
      var A = function A() {};
      equal("A", util.arrayCast([{}, {}], A)[1].constructor.name);
    });

    it('listMatch', function () {
      equal(-1, util.listMatch());
      var listA = ["A", "B", "C", "D", "E"];
      var listB = ["B", "C", "D", "E", "B"];
      equal(0, util.listMatch(listA, listB, 1));
      equal(3, util.listMatch([3, 2, 1, 4, 5, 6], [2, 2, 3, 2, 1, 4, 5, 6], 1));
      equal(-1, util.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 1, 4, 5, 6], 1));
      equal(3, util.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6], 1));
      equal(6, util.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6, 6], 5));
      equal(8, util.listMatch([3, 2, 1, 4, 5, 6], [3, 4, 6, 3, 2, 1, 4, 5, 6], 5));
    });

    it('listMatchWithNeighbour', function () {
      equal(-1, util.listMatchWithNeighbour());
      var listA = ["A", "B", "C", "D", "E"];
      var listB = ["B", "C", "D", "E", "B"];
      equal(0, util.listMatchWithNeighbour(listA, listB, 1));
      equal(3, util.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [2, 2, 3, 2, 1, 4, 5, 6], 1));
      equal(1, util.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 1, 4, 5, 6], 1));
      equal(1, util.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6], 1));
      equal(-1, util.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 1, 2, 4, 5, 6, 6], 5));
      equal(8, util.listMatchWithNeighbour([3, 2, 1, 4, 5, 6], [3, 4, 6, 3, 2, 1, 4, 5, 6], 5));
    });

    it('storage', function () {
      var p1 = util.saveData().catch(function (error) {
        equal("Illegal args", error.message);
      });
      var p2 = util.saveData("abc", { abc: "test", def: "fff" }).then(function () {
        return util.loadData("abc");
      }).then(function (data) {
        equal("test", data.abc);
        equal("fff", data.def);
      }).then(function () {
        return util.dataExists("abc");
      }).then(function (r) {
        return equal(true, r);
      }).then(function () {
        return util.removeData("abc");
      }).then(function () {
        return util.dataExists("abc");
      }).then(function (r) {
        return equal(false, r);
      }).then(function () {
        return util.loadData("abc");
      }).then(function (data) {
        equal(null, data);
      });

      return Promise.all([p1, p2]);
    });

    it('stripString', function () {
      equal(undefined, util.stripString());
      equal('', util.stripString(''));
      equal('第一章好的啊', util.stripString('第一章 好的啊【啊啊】(test)'));
    });

    it('arrayCount', function () {
      equal(null, util.arrayCount());
      assert.lengthOf(util.arrayCount([]), 0);
      equal(1, util.arrayCount([2])[0][1]);
      equal(3, util.arrayCount([1, 2, 4, 3, 4, 4, 5])[0][1]);
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

          equal(JSON.stringify(_a), util.persistent(_a));
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

      equal('[1,2,3]', util.persistent([1, 2,,,,, 3]));

      var A = function A() {
        this.def = "test";
        this.abc = "ddd";
        this.ddd = "fff";
      };

      A.persistentInclude = ['def', "ddd", "fff"];
      var a = new A();
      a.fff = 'eee';
      equal('{"def":"test","ddd":"fff","fff":"eee"}', util.persistent(a));
    });
  });
});
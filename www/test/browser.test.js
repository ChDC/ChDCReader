"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["browser_test"] = factory.apply(undefined, deps.map(function (e) {
    return window[e];
  }));
})(["chai"], function (chai) {

  var assert = chai.assert;
  var equal = assert.equal;
  var p = assert.property;

  describe('浏览器基础测试', function () {

    it('Array', function () {
      ["every", "slice", "splice", "fill", "filter", "find", "findIndex", "forEach", "includes", "reduce", "sort", "some", "reverse"].forEach(function (e) {
        return p([], e);
      });
    });

    it('String', function () {
      ["includes", "slice", "startsWith", "endsWith"].forEach(function (e) {
        return p("", e);
      });
    });

    it('Object', function () {
      ["assign", "keys", "values"].forEach(function (e) {
        return p(Object, e);
      });
      ["name"].forEach(function (e) {
        return p({}.constructor, e);
      });
    });

    it('document', function () {
      ["addEventListener", "removeEventListener"].forEach(function (e) {
        return p(document, e);
      });
    });

    it('DOM Element', function () {
      ["remove", "appendChild", "innerHTML", "getAttribute", "textContent", "querySelector", "querySelectorAll", "offsetTop", "offsetHeight", "getBoundingClientRect", "insertBefore", "children"].forEach(function (e) {
        return p(document.createElement("div"), e);
      });
    });
  });
});
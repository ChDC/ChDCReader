"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory();else window["Chapter"] = factory();
})(function () {
  "use strict";

  var Chapter = function () {
    function Chapter() {
      _classCallCheck(this, Chapter);

      this.cid = undefined;
      this.link = undefined;
      this.title = undefined;
      this.content = undefined;
      this.volume = undefined;
    }

    _createClass(Chapter, [{
      key: "isVIP",
      value: function isVIP() {
        return !this.cid && !this.link && this.title;
      }
    }]);

    return Chapter;
  }();

  Chapter.equalTitle = function (ca, cb) {

    if (ca == cb) return 4;
    if (!ca || !cb) return 0;

    var cs = [ca, cb].map(function (c) {
      return typeof c != "string" ? c.title : c;
    });
    if (cs[0] == cs[1]) return 4;

    cs = cs.map(Chapter.stripString);
    if (cs[0] == cs[1]) return 3;

    var nums = '零一二两三四五六七八九';
    cs = cs.map(function (c) {
      return c.replace(/[十百千万亿]/gi, '').replace(new RegExp("[" + nums + "]", 'gi'), function (m) {
        var i = nums.indexOf(m);
        return i <= 2 ? i : i - 1;
      });
    });
    if (cs[0] == cs[1]) return 2;

    var numPattern = /第[0123456789零一二两三四五六七八九十百千万亿\d]+[章节卷]/g;
    cs = cs.map(function (c) {
      return c.replace(numPattern, '');
    });
    if (cs[0] == cs[1]) return 1;

    return 0;
  };

  Chapter.stripString = function (str) {
    if (!str) return str;

    str = str.replace(/（.*?）/g, '');
    str = str.replace(/\(.*?\)/g, '');
    str = str.replace(/【.*?】/g, '');

    str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');

    str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

    str = str.replace(/\s/g, '');
    return str;
  };

  return Chapter;
});
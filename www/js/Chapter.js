"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["Chapter"] = factory.apply(undefined, deps.map(function (e) {
    return window[e];
  }));
})(["utils"], function (utils) {
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
    var loose = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var threshold = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;


    var weight = 8;

    if (ca == cb) return weight;
    if (!ca || !cb) return 0;

    var cs = [ca, cb].map(function (c) {
      return typeof c != "string" ? c.title : c;
    });
    if (cs[0] == cs[1]) return weight;
    if (threshold >= weight) return 0;

    cs = cs.map(function (s) {
      return Chapter.stripString(s, loose);
    });
    if (cs[0] == cs[1]) return --weight;
    if (threshold >= weight) return 0;

    cs = cs.map(utils.lowerCaseNumbers);
    if (cs[0] == cs[1]) return --weight;
    if (threshold >= weight) return 0;

    cs = cs.map(function (e) {
      return e.replace(/[第总]?0*(\d+)[弹话章节卷集]?/gi, '$1');
    });
    if (cs[0] == cs[1]) return --weight;
    if (threshold >= weight) return 0;

    if (!loose) return 0;

    if (cs[0].includes(cs[1]) || cs[1].includes(cs[0])) return --weight;
    if (threshold >= weight) return 0;

    cs = cs.map(function (c) {
      return c.replace(/\d/g, '');
    });
    if (cs[0].includes(cs[1]) || cs[1].includes(cs[0])) return --weight;
    if (threshold >= weight) return 0;

    return 0;
  };

  Chapter.stripString = function (str) {
    var removeNumbers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (!str) return str;

    str = ["()", "【】", "（）", "《》", "<>"].reduce(function (s, e) {
      var il = s.indexOf(e[0]);
      if (il < 0) return s;
      var ir = s.indexOf(e[1], il + 1);
      if (ir < 0) return s;
      var lstr = s.substring(0, il),
          rstr = s.substring(ir + 1);
      if (removeNumbers) return lstr + rstr;
      var mstr = s.substring(il + 1, ir);
      return lstr + mstr.replace(/[^\d零一二两三四五六七八九十百千万亿]/gi, '') + rstr;
    }, str);

    str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');

    str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

    str = str.replace(/\s/g, '');
    return str;
  };

  return Chapter;
});
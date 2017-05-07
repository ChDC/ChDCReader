"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["Chapter"] = factory(utils);
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
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


    if (ca == cb) return 4;
    if (!ca || !cb) return 0;

    var cs = [ca, cb].map(function (c) {
      return typeof c != "string" ? c.title : c;
    });
    if (cs[0] == cs[1]) return 4;

    var _options$removeNumber = options.removeNumbers,
        removeNumbers = _options$removeNumber === undefined ? false : _options$removeNumber;

    cs = cs.map(function (s) {
      return Chapter.stripString(s, options);
    });
    if (cs[0] == cs[1]) return 3;

    cs = cs.map(utils.lowerCaseNumbers);
    if (cs[0] == cs[1]) return 2;

    cs = cs.map(function (e) {
      return e.replace(/^.*?[第总]?(\d+)[弹话章节卷集]?/i, '$1');
    });
    if (cs[0] == cs[1]) return 1;

    return 0;
  };

  Chapter.stripString = function (str) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$removeNumbers = _ref.removeNumbers,
        removeNumbers = _ref$removeNumbers === undefined ? false : _ref$removeNumbers;

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
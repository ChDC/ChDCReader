"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["utils"], function (utils) {
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

  Chapter.equalTitle = function (chapterA, chapterB) {
    return Chapter.equalTitle2(chapterA.title, chapterB.title);
  };

  Chapter.equalTitle2 = function (chapterTitleA, chapterTitleB) {
    if (!chapterTitleA || !chapterTitleB) return false;

    var cA = utils.stripString(chapterTitleA);
    var cB = utils.stripString(chapterTitleB);
    return cA == cB;
  };

  Chapter.equalTitleWithoutNum = function (chapterA, chapterB) {
    var chapterTitleA = chapterA.title;
    var chapterTitleB = chapterB.title;

    if (!chapterTitleA || !chapterTitleB) return false;

    var numPattern = /第[零一二两三四五六七八九十百千万亿\d]+章/g;
    chapterTitleA = chapterTitleA.replace(numPattern, '');
    chapterTitleB = chapterTitleB.replace(numPattern, '');
    var cA = utils.stripString(chapterTitleA);
    var cB = utils.stripString(chapterTitleB);
    return cA == cB;
  };

  return Chapter;
});
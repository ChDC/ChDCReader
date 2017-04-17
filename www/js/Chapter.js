"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["util"], function (util) {
  "use strict";

  var Chapter = function Chapter() {
    _classCallCheck(this, Chapter);

    this.link = undefined;
    this.title = undefined;
    this.content = undefined;
  };

  Chapter.equalTitle = function (chapterA, chapterB) {
    return Chapter.equalTitle2(chapterA.title, chapterB.title);
  };

  Chapter.equalTitle2 = function (chapterTitleA, chapterTitleB) {
    if (!chapterTitleA || !chapterTitleB) return false;

    var cA = util.stripString(chapterTitleA);
    var cB = util.stripString(chapterTitleB);
    return cA == cB;
  };

  Chapter.equalTitleWithoutNum = function (chapterA, chapterB) {
    var chapterTitleA = chapterA.title;
    var chapterTitleB = chapterB.title;

    if (!chapterTitleA || !chapterTitleB) return false;

    var numPattern = /第[零一二两三四五六七八九十百千万亿\d]+章/g;
    chapterTitleA = chapterTitleA.replace(numPattern, '');
    chapterTitleB = chapterTitleB.replace(numPattern, '');
    var cA = util.stripString(chapterTitleA);
    var cB = util.stripString(chapterTitleB);
    return cA == cB;
  };

  return Chapter;
});
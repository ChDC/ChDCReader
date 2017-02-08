"use strict";

define(["jquery", "util"], function ($, util) {
    "use strict";

    function Chapter() {}

    Chapter.prototype.link = undefined;
    Chapter.prototype.title = undefined;
    Chapter.prototype.content = undefined;
    Chapter.equalTitle = function (chapterA, chapterB) {
        return Chapter.equalTitle2(chapterA.title, chapterB.title);
    };

    function stripString(str) {
        str = str.replace(/（.*?）/g, '');
        str = str.replace(/\(.*?\)/g, '');
        str = str.replace(/【.*?】/g, '');

        str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');

        str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

        str = str.replace(/\s/g, '');
        return str;
    }

    Chapter.equalTitle2 = function (chapterTitleA, chapterTitleB) {
        if (!chapterTitleA || !chapterTitleB) return false;

        var cA = stripString(chapterTitleA);
        var cB = stripString(chapterTitleB);
        return cA == cB;
    };

    Chapter.equalTitleWithoutNum = function (chapterA, chapterB) {
        var chapterTitleA = chapterA.title;
        var chapterTitleB = chapterB.title;

        if (!chapterTitleA || !chapterTitleB) return false;

        var numPattern = /第[零一二两三四五六七八九十百千万亿\d]+章/g;
        chapterTitleA = chapterTitleA.replace(numPattern, '');
        chapterTitleB = chapterTitleB.replace(numPattern, '');
        var cA = stripString(chapterTitleA);
        var cB = stripString(chapterTitleB);
        return cA == cB;
    };

    return Chapter;
});
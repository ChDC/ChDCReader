"use strict";

define(["jquery", "util", 'Book'], function ($, util, Book) {
    "use strict";

    function ReadingRecord() {
        this.chapterIndex = 0;
        this.pageScrollTop = 0;
        this.chapterTitle = "";
        this.options = {};
    };

    ReadingRecord.prototype.chapterIndex = undefined;
    ReadingRecord.prototype.chapterTitle = undefined;
    ReadingRecord.prototype.pageScrollTop = undefined;
    ReadingRecord.prototype.options = undefined;
    ReadingRecord.prototype.reset = function () {
        this.chapterIndex = 0;
        this.chapterTitle = "";
        this.pageScrollTop = 0;
        this.options = {};
    };

    ReadingRecord.prototype.setReadingRecord = function (chapterIndex, chapterTitle, options) {
        var self = this;
        self.chapterIndex = chapterIndex;
        self.chapterTitle = chapterTitle;
        self.options = options;
    };

    return ReadingRecord;
});
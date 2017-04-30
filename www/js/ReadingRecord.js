"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['Chapter'], function (Chapter) {
  "use strict";

  var ReadingRecord = function () {
    function ReadingRecord() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$chapterIndex = _ref.chapterIndex,
          chapterIndex = _ref$chapterIndex === undefined ? 0 : _ref$chapterIndex,
          _ref$chapterTitle = _ref.chapterTitle,
          chapterTitle = _ref$chapterTitle === undefined ? "" : _ref$chapterTitle,
          _ref$pageScrollTop = _ref.pageScrollTop,
          pageScrollTop = _ref$pageScrollTop === undefined ? 0 : _ref$pageScrollTop,
          _ref$options = _ref.options,
          options = _ref$options === undefined ? {} : _ref$options;

      _classCallCheck(this, ReadingRecord);

      this.chapterIndex = chapterIndex;
      this.chapterTitle = chapterTitle;
      this.isFinished = false;
      this.pageScrollTop = pageScrollTop;
      this.options = options;
    }

    _createClass(ReadingRecord, [{
      key: "getChapterIndex",
      value: function getChapterIndex() {
        return this.isFinished ? this.chapterIndex + 1 : this.chapterIndex;
      }
    }, {
      key: "getPageScrollTop",
      value: function getPageScrollTop() {
        return this.isFinished ? 0 : this.pageScrollTop;
      }
    }, {
      key: "getOptions",
      value: function getOptions() {
        if (!this.isFinished) return this.options;
        var opts = Object.assign({}, this.options);
        opts.contentSourceChapterIndex += 1;
        return opts;
      }
    }, {
      key: "reset",
      value: function reset() {
        this.chapterTitle = "";
        this.chapterIndex = 0;
        this.pageScrollTop = 0;
        this.options = {};
      }
    }, {
      key: "setReadingRecord",
      value: function setReadingRecord(chapterIndex, chapterTitle, options) {
        this.chapterIndex = chapterIndex;
        this.chapterTitle = chapterTitle;
        this.options = options;
        this.pageScrollTop = 0;
        this.isFinished = false;
      }
    }, {
      key: "setFinished",
      value: function setFinished(isFinished) {
        this.isFinished = isFinished;
        if (isFinished) {
          this.pageScrollTop = 0;
        }
      }
    }, {
      key: "equalChapter",
      value: function equalChapter(chapter) {
        return this.equalChapterTitle(chapter.title);
      }
    }, {
      key: "equalChapterTitle",
      value: function equalChapterTitle(chapterTitle) {
        return Chapter.equalTitle2(chapterTitle, this.chapterTitle);
      }
    }, {
      key: "getReadingRecordStatus",
      value: function getReadingRecordStatus() {
        var s = this.isFinished ? "读完" : "读到";
        return s + "\uFF1A" + this.chapterTitle;
      }
    }]);

    return ReadingRecord;
  }();

  return ReadingRecord;
});
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {
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
      this.pageScrollTop = pageScrollTop;
      this.options = options;
    }

    _createClass(ReadingRecord, [{
      key: "reset",
      value: function reset() {
        this.chapterIndex = 0;
        this.chapterTitle = "";
        this.pageScrollTop = 0;
        this.options = {};
      }
    }, {
      key: "setReadingRecord",
      value: function setReadingRecord(chapterIndex, chapterTitle, options) {
        this.chapterIndex = chapterIndex;
        this.chapterTitle = chapterTitle;
        this.options = options;
      }
    }]);

    return ReadingRecord;
  }();

  return ReadingRecord;
});
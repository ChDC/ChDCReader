"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {
  "use strict";

  var ReadingRecord = function () {
    function ReadingRecord() {
      _classCallCheck(this, ReadingRecord);

      this.chapterIndex = 0;
      this.pageScrollTop = 0;
      this.chapterTitle = "";
      this.options = {};
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
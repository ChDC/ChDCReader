"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["util", "Spider"], function (util, Spider) {
    var SpiderTest = function () {
        function SpiderTest(test) {
            _classCallCheck(this, SpiderTest);

            this.test = test;
        }

        _createClass(SpiderTest, [{
            key: "doTest",
            value: function doTest() {
                this.htmlTest();
            }
        }, {
            key: "htmlTest",
            value: function htmlTest() {
                var _this = this;

                var config = {
                    "request": {
                        "url": "http://se.qidian.com/?kw={keyword}",
                        "timeout": 5
                    },
                    "response": {
                        "type": "array",
                        "element": "#result-list li[data-rid]",
                        "children": {
                            "name": ".book-mid-info>h4>a",
                            "author": ".book-mid-info .author>a.name",
                            "catagory": ".book-mid-info .author a:nth-child(4)",
                            "complete": {
                                "type": "boolean",
                                "element": ".book-mid-info .author span:last-child",
                                "true": "完本",
                                "false": "连载中"
                            },
                            "coverImg": ".book-img-box img",
                            "introduce": ".book-mid-info .intro",
                            "lastestChapter": ".book-mid-info .update>a",
                            "detailLink": ".book-mid-info>h4>a",
                            "bookid": {
                                "type": "string",
                                "element": ".book-mid-info>h4>a",
                                "attribute": "data-bid"
                            }
                        }
                    }
                };
                var s = new Spider();
                var result = s.get(config, { keyword: "神墓" });
                result.then(function (r) {
                    return _this.test.log(r);
                });
            }
        }]);

        return SpiderTest;
    }();

    return SpiderTest;
});
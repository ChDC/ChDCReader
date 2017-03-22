"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["util"], function (util) {
    var Page = function () {
        function Page() {
            _classCallCheck(this, Page);
        }

        _createClass(Page, [{
            key: "onload",
            value: function onload(params) {}
        }, {
            key: "onresume",
            value: function onresume() {}
        }, {
            key: "onpause",
            value: function onpause() {}
        }, {
            key: "onclose",
            value: function onclose(params) {}
        }, {
            key: "close",
            value: function close(params) {
                return this.pageManager.closePage(params);
            }
        }, {
            key: "showPage",
            value: function showPage(name, params) {
                var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

                return this.pageManager.showPage(name, params, options);
            }
        }]);

        return Page;
    }();

    Page.prototype.pageManager = null;

    return Page;
});
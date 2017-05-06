"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
    "use strict";

    if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
        return require(e);
    }));else window["Page"] = factory();
})(['utils'], function (utils) {
    var Page = function () {
        function Page() {
            var _this = this;

            _classCallCheck(this, Page);

            utils.addEventSupport(this);

            this.__onDevicePauseHandler = function (e) {
                _this.fireEvent("devicePause", e);
                _this.fireEvent("pause", e);
            };
            this.__onDeviceResumeHandler = function (e) {
                _this.fireEvent("deviceResume", e);
                _this.fireEvent("resume", e);
            };
        }

        _createClass(Page, [{
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
        }, {
            key: "__onResume",
            value: function __onResume() {
                document.addEventListener("pause", this.__onDevicePauseHandler, false);
                document.addEventListener("resume", this.__onDeviceResumeHandler, false);
            }
        }, {
            key: "__onPause",
            value: function __onPause() {
                document.removeEventListener("pause", this.__onDevicePauseHandler, false);
                document.removeEventListener("resume", this.__onDeviceResumeHandler, false);
            }
        }]);

        return Page;
    }();

    Page.prototype.pageManager = null;
    Page.prototype.name = null;

    return Page;
});
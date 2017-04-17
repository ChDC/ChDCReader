"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {
    var Page = function () {
        function Page() {
            _classCallCheck(this, Page);
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
            key: "__onLoad",
            value: function __onLoad(params) {}
        }, {
            key: "__onResume",
            value: function __onResume() {
                if (this.onDevicePause) {
                    this.__onDevicePause = this.onDevicePause.bind(this);
                    document.addEventListener("pause", this.__onDevicePause, false);
                }

                if (this.onDeviceResume) {
                    this.__onDeviceResume = this.onDeviceResume.bind(this);
                    document.addEventListener("resume", this.__onDeviceResume, false);
                }
            }
        }, {
            key: "__onPause",
            value: function __onPause() {

                if (this.__onDevicePause) document.removeEventListener("pause", this.__onDevicePause, false);

                if (this.__onDeviceResume) document.removeEventListener("resume", this.__onDeviceResume, false);
            }
        }, {
            key: "__onClose",
            value: function __onClose(params) {}
        }]);

        return Page;
    }();

    Page.prototype.pageManager = null;
    Page.prototype.name = null;

    return Page;
});
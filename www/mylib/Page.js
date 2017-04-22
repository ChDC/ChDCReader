"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {
    var Page = function () {
        function Page() {
            var _this = this;

            _classCallCheck(this, Page);

            this.__events = {};

            this.__onDevicePauseHandler = function (e) {
                _this.fireEvent("devicePause", e);
            };
            this.__onDeviceResumeHandler = function (e) {
                _this.fireEvent("deviceResume", e);
            };
        }

        _createClass(Page, [{
            key: "addEventListener",
            value: function addEventListener(eventName, handler) {
                if (!eventName || !handler) return;
                if (!(eventName in this.__events)) this.__events[eventName] = [];
                this.__events[eventName].push(handler);
            }
        }, {
            key: "fireEvent",
            value: function fireEvent(eventName) {
                var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                if (!eventName) return;
                e.currentTarget = this;
                e.target = this;

                var __onevent = "__on" + eventName[0].toUpperCase() + eventName.substring(1);
                if (__onevent in this) this[__onevent](e);

                if (eventName in this.__events) {
                    this.__events[eventName].forEach(function (eh) {
                        try {
                            eh(e);
                        } catch (error) {}
                    });
                }

                var onevent = "on" + eventName[0].toUpperCase() + eventName.substring(1);
                if (onevent in this) this[onevent](e);
            }
        }, {
            key: "removeEventListener",
            value: function removeEventListener(eventName, handler) {
                if (!eventName || !handler) return;
                if (eventName in this.__events) {
                    var i = this.__events[eventName].findIndex(function (m) {
                        return m == handler;
                    });
                    if (i >= 0) this.__events[eventName].splice(i, 1);
                }
            }
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
        }, {
            key: "onDevicePause",
            value: function onDevicePause() {
                console.error(this.name, "DevicePause");
            }
        }, {
            key: "onDeviceResume",
            value: function onDeviceResume() {
                console.error(this.name, "DeviceResume");
            }
        }]);

        return Page;
    }();

    Page.prototype.pageManager = null;
    Page.prototype.name = null;

    return Page;
});
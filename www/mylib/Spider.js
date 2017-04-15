"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["util"], function (util) {
    var Spider = function () {
        function Spider() {
            _classCallCheck(this, Spider);
        }

        _createClass(Spider, [{
            key: "get",
            value: function get(_ref) {
                var _this = this;

                var request = _ref.request,
                    response = _ref.response;
                var locals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                if (!response) throw new Error("Empty response");

                if (!request) request = {
                    "url": locals.url
                };

                if (util.type(request) == "string") {
                    request = {
                        "url": request
                    };
                }

                if (!request.url) throw new Error("Illegal URL");

                var method = (request.method || "GET").toLowerCase();
                var type = (request.type || "HTML").toLowerCase();

                var url = util.format(request.url, locals);
                locals.host = url;

                var requestPromise = void 0;

                switch (method) {
                    case "post":
                        break;
                    case "get":
                        requestPromise = util.get(url, request.params, null, { timeout: request.timeout });
                        break;
                    default:
                        throw new Error("Illegal type");
                }

                switch (type) {
                    case "html":
                        return requestPromise.then(function (data) {
                            data = util.filterHtmlContent(data);
                            var html = document.createElement("div");
                            html.innerHTML = data;

                            return _this.__handleResponse(html, response, null, locals);
                        });
                    case "json":
                        return requestPromise.then(function (data) {
                            var json = JSON.parse(data);
                            return _this.__handleResponse(json, response, null, locals);
                        });
                    default:
                        throw new Error("Illegal type");
                }
            }
        }, {
            key: "__handleResponse",
            value: function __handleResponse(data, response, keyName) {
                var topLocals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
                var locals = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};


                if (!response) return undefined;

                switch (util.type(response)) {
                    case "array":
                        return this.__handleArray(data, response, keyName, topLocals, locals);
                    case "object":
                        return this.__handleObject(data, response, keyName, topLocals, locals);
                    case "string":
                        return this.__handleString(data, response, keyName, topLocals, locals);
                    default:
                        throw new Error("Illegal type");
                }
            }
        }, {
            key: "__handleArray",
            value: function __handleArray(data, response, keyName) {
                var topLocals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
                var locals = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

                debugger;
                var result = [];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = response[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var m = _step.value;

                        result.push(this.__handleResponse(data, m, keyName, topLocals, locals));
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return result;
            }
        }, {
            key: "__handleObject",
            value: function __handleObject(data, response, keyName) {
                var _this2 = this;

                var topLocals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
                var locals = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};


                var __privateHandleObject = function __privateHandleObject() {
                    var result = {};

                    for (var key in response) {
                        result[key] = _this2.__handleResponse(data, response[key], key, topLocals, result);
                    }
                    return result;
                };

                if (!response.type) {
                    return __privateHandleObject();
                }

                if ("valid" in response) {
                    var dict = Object.assign({}, topLocals, locals);
                    var vaildCode = util.format(response.valid, dict);
                    if (!eval(vaildCode)) return undefined;
                }

                var type = response.type.toLowerCase();
                switch (type) {

                    case "array":
                        if (!response.element || !response.children) return undefined;
                        var result = [];
                        var list = this.__getAllElements(data, response.element);
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var m = _step2.value;

                                result.push(this.__handleResponse(m, response.children, keyName, topLocals, locals));
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
                                }
                            } finally {
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }

                        return result;

                    case "string":

                        if (!response.element) return undefined;

                        var e = this.__getElement(data, response.element);
                        if (!e) return undefined;
                        if (response.attribute) return e.getAttribute(response.attribute);
                        break;
                    case "boolean":
                        if (!response.element) return undefined;
                        var v = this.__getValue(data, response.element, keyName, topLocals, locals);
                        if (v && response.true == v) return true;
                        if (!v || response.false == v) return false;
                        return undefined;

                    case "format":
                        if (!response.value) return undefined;
                        var _dict = Object.assign({}, topLocals, locals);
                        return util.format(response.value, _dict);

                    default:
                        return __privateHandleObject();
                }
            }
        }, {
            key: "__handleString",
            value: function __handleString(data, response, keyName) {
                var topLocals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
                var locals = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

                return this.__getValue(data, response, keyName, topLocals, locals);
            }
        }, {
            key: "__getElement",
            value: function __getElement(element, selector) {
                if (!element || !selector) return undefined;

                if ("querySelector" in element) {
                    return element.querySelector(selector);
                } else {
                    return util.getDataFromObject(element, selector);
                }
            }
        }, {
            key: "__getAllElements",
            value: function __getAllElements(element, selector) {
                if (!element || !selector) return undefined;

                if ("querySelectorAll" in element) {
                    return element.querySelectorAll(selector);
                } else {
                    return util.getDataFromObject(element, selector);
                }
            }
        }, {
            key: "__getValue",
            value: function __getValue(element, selector, keyName) {
                var topLocals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
                var locals = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

                var e = this.__getElement(element, selector);
                if (!e) return undefined;
                if ("querySelector" in element) {
                    if (!keyName) return e.textContent;else if (keyName.match(/link$/i)) return util.fixurl(e.getAttribute("href"), topLocals.host);else if (keyName.match(/img$|image$/i)) return util.fixurl(e.getAttribute("data-src"), topLocals.host);else if (keyName.match(/html$/i)) return e.innerHTML;else return e.textContent.trim();
                } else {
                    return e;
                }
            }
        }]);

        return Spider;
    }();

    return Spider;
});
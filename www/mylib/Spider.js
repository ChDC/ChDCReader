"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["util"], function (util) {
  var Spider = function () {
    function Spider() {
      _classCallCheck(this, Spider);
    }

    _createClass(Spider, [{
      key: "get",
      value: function get() {
        var _this = this;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            request = _ref.request,
            response = _ref.response;

        var locals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (!response) return Promise.reject(new Error("Empty response"));

        if (!request) request = {
          "url": locals.url
        };

        if (util.type(request) == "string") {
          request = {
            "url": request
          };
        }

        if (!request.url) return Promise.reject(new Error("Empty URL"));

        var method = (request.method || "GET").toLowerCase();
        var type = (request.type || "HTML").toLowerCase();

        var url = this.format(request.url, locals);
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
              data = _this.filterHtmlContent(data);
              data = _this.__transformHTMLTagProperty(data);
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


        var __privateHandleObject = function __privateHandleObject(response) {
          var result = {};

          for (var key in response) {
            result[key] = _this2.__handleResponse(data, response[key], key, topLocals, result);
          }
          return result;
        };

        if (!response.type) {
          return __privateHandleObject(response);
        }

        var result = void 0;

        var type = response.type.toLowerCase();

        switch (type) {

          case "array":
            {
              if (!response.element || !response.children) return undefined;
              result = [];
              var list = this.__getAllElements(data, response.element);
              result = list.map(function (m) {
                return _this2.__handleResponse(m, response.children, keyName, topLocals, locals);
              });
              if (response.valideach) result = result.filter(function (m) {
                var dict = Object.assign({}, topLocals, util.type(m) == "object" ? m : {});
                var validCode = '"use strict"\n' + _this2.format(response.valideach, dict);
                return eval(validCode);
              });
            }
            break;
          case "object":
            {
              if (!response.children) return undefined;
              result = __privateHandleObject(response.children);
            }
            break;
          case "string":
            {
              if (!response.element) return undefined;

              var e = this.__getElement(data, response.element);
              if (!e) return undefined;
              if (response.attribute) {
                var attr = void 0;
                if (response.attribute == 'src') attr = 'src';else attr = response.attribute;
                result = e.getAttribute(attr);
                if (attr == 'innerHTML') result = result.replace(/\bdata-src=(?=["'])/gi, "src=");
              } else result = this.__getValue(e, keyName, topLocals, locals);

              if (response.remove) {
                var regex = new RegExp(response.remove, 'gi');
                result = result.replace(regex, '');
              }
            }
            break;
          case "boolean":
            {
              if (!response.element) return response.default;
              var _e = this.__getElement(data, response.element);
              if (!_e) return response.default;
              var v = this.__getValue(_e, keyName, topLocals, locals);
              if (v && response.true == v) result = true;else if (!v || response.false == v) result = false;else result = response.default;
            }
            break;
          case "format":
            {
              if (!response.value) return undefined;
              var dict = Object.assign({}, topLocals, locals);
              result = this.format(response.value, dict);
            }
            break;
          default:
            {
              result = __privateHandleObject(response);
            }
        }

        if ("valid" in response) {
          var _dict = Object.assign({}, topLocals, locals);
          var validCode = '"use strict"\n' + this.format(response.valid, _dict);
          if (!eval(validCode)) return undefined;
        }
        return result;
      }
    }, {
      key: "__handleString",
      value: function __handleString(data, response, keyName) {
        var topLocals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var locals = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        var e = this.__getElement(data, response);
        if (!e) return undefined;
        return this.__getValue(e, keyName, topLocals, locals);
      }
    }, {
      key: "__getValue",
      value: function __getValue(element, keyName) {
        var topLocals = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var locals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        if (util.type(element) == 'object' && "querySelector" in element) {
          if (!keyName) return element.textContent;else if (keyName.match(/link$/i)) return this.fixurl(element.getAttribute("href"), topLocals.host);else if (keyName.match(/img$|image$/i)) return this.fixurl(element.getAttribute("data-src"), topLocals.host);else if (keyName.match(/html$/i)) return element.innerHTML.replace(/\bdata-src=(?=["'])/gi, "src=");else return element.textContent.trim();
        } else {
          return element;
        }
      }
    }, {
      key: "__getElement",
      value: function __getElement(element, selector) {
        if (!element || !selector) return undefined;

        if ("querySelector" in element) {
          return element.querySelector(selector);
        } else {
          return this.__getDataFromObject(element, selector);
        }
      }
    }, {
      key: "__getAllElements",
      value: function __getAllElements(element, selector) {
        if (!element || !selector) return undefined;

        if ("querySelectorAll" in element) {
          return Array.from(element.querySelectorAll(selector));
        } else {
          return this.__getDataFromObject(element, selector);
        }
      }
    }, {
      key: "__getDataFromObject",
      value: function __getDataFromObject(obj, key) {

        function operatorFilter(element, args) {
          var codeStart = '"use strict"\n';
          var env = "var $element=" + JSON.stringify(element) + ";\n";
          var code = codeStart + env + args[0];
          return eval(code);
        }

        function splitKeyAndOperatorAndArgs(operatorAndArgs) {
          if (!operatorAndArgs) return [];
          var i = operatorAndArgs.indexOf('#');
          if (i < 0) return [operatorAndArgs];
          var key = operatorAndArgs.substring(0, i);
          operatorAndArgs = operatorAndArgs.substring(i + 1);

          i = operatorAndArgs.indexOf('(');
          if (i < 0) return [key, operatorAndArgs, undefined];
          var opertaor = operatorAndArgs.substring(0, i);
          var args = operatorAndArgs.substring(i);
          if (args.length > 2) args = args.substring(1, args.length - 1).split('#').map(function (e) {
            return JSON.parse(e);
          });else args = [];
          return [key, opertaor, args];
        }

        if (!obj || !key) return obj;
        var keys = key.split('::');
        var result = obj;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          var _loop = function _loop() {
            var key = _step2.value;

            var _splitKeyAndOperatorA = splitKeyAndOperatorAndArgs(key),
                _splitKeyAndOperatorA2 = _slicedToArray(_splitKeyAndOperatorA, 3),
                k = _splitKeyAndOperatorA2[0],
                operator = _splitKeyAndOperatorA2[1],
                args = _splitKeyAndOperatorA2[2];

            if (!result) return {
                v: undefined
              };

            if (util.type(result) == 'array') {
              if (operator == 'concat') result = result.reduce(function (s, m) {
                return s.concat(m[k]);
              }, []);else if (operator == "filter") result = result.map(function (m) {
                return m[k];
              }).filter(function (e) {
                return operatorFilter(e, args);
              });else result = result.map(function (m) {
                return m[k];
              });
            } else {
              if (operator == "filter") {
                result = result[k];
                if (util.type(result) == 'array') result = result.filter(function (e) {
                  return operatorFilter(e, args);
                });
              } else result = result[k];
            }
          };

          for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _ret = _loop();

            if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
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
      }
    }, {
      key: "fixurl",
      value: function fixurl(url, host) {
        if (!url || url.match("^https?://")) return url;

        if (url.match("^//")) url = "http:" + url;else if (url.match("^://")) url = "http" + url;else if (url.match("^javascript:")) url = "";else {
          var matcher = host.match(/^(.*):\/\//);
          var scheme = matcher ? matcher[0] : "";
          host = host.substring(scheme.length);

          if (url.match("^/")) {
            host = host.replace(/\/.*$/, "");
            url = "" + scheme + host + url;
          } else {
            host = host.replace(/\/[^\/]*$/, "");
            var m2 = url.match(/^\.\.\//g);
            url = url.replace(/^\.\.\//g, '');
            if (m2) {
              for (var i = 0; i < m2.length; i++) {
                host = host.replace(/\/[^\/]*$/, "");
              }
            }
            url = "" + scheme + host + "/" + url;
          }
        }
        return url;
      }
    }, {
      key: "format",
      value: function format(string) {
        var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (!string) return string;

        var result = string.replace(/{(\w+)}/g, function (p0, p1) {
          return p1 in object ? object[p1] : "{" + p1 + "}";
        });
        return result;
      }
    }, {
      key: "clearHtml",
      value: function clearHtml(html) {
        if (!html) return html;

        html = this.filterHtmlContent(html);

        var whitePropertyList = ['src'];
        html = html.replace(/[\s\r\n]*([\w-]+)[\s\r\n]*=[\s\r\n]*"[^"]*" */gi, function (p0, p1) {
          return whitePropertyList.includes(p1) ? p0 : "";
        });

        html = html.replace(/([^>]*)<br *\/>/gi, '<p>$1</p>');

        html = html.replace(/>[　 \n\r]+/gi, '>');
        html = html.replace(/[　 \n\r]+</gi, '<');

        return html;
      }
    }, {
      key: "filterHtmlContent",
      value: function filterHtmlContent(html) {
        var _this3 = this;

        if (!html) return html;

        var m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
        if (m && m.length >= 2) html = m[1];

        var blackList = ['script', 'style', 'link', 'meta', 'iframe'];
        html = blackList.reduce(function (html, be) {
          return _this3.__filterElement(html, be);
        }, html);
        return html;
      }
    }, {
      key: "__transformHTMLTagProperty",
      value: function __transformHTMLTagProperty(html) {
        if (!html) return html;

        html = html.replace(/\bsrc=(?=["'])/gi, "data-src=");
        return html;
      }
    }, {
      key: "__filterElement",
      value: function __filterElement(html, element) {
        var endElement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : element;


        if (!html || !element) return html;

        var pattern = "<" + element + "( [^>]*?)?>[\\s\\S]*?</" + endElement + ">";
        html = html.replace(new RegExp(pattern, 'gi'), '');

        pattern = "<" + element + "([^>]*?)?>";
        html = html.replace(new RegExp(pattern, 'gi'), '');
        return html;
      }
    }]);

    return Spider;
  }();

  return Spider;
});
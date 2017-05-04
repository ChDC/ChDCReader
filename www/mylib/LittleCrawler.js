"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory();else window["LittleCrawler"] = factory();
})(function () {
  var LittleCrawler = function () {
    function LittleCrawler(ajax) {
      var _this = this;

      _classCallCheck(this, LittleCrawler);

      this.ajax = ajax || {
        "default": LittleCrawler.ajax,
        "cordova": LittleCrawler.cordovaAjax
      };

      this.insecurityAttributeList = ['src'];
      this.insecurityTagList = ['body', 'head', 'title', 'script', 'style', 'link', 'meta', 'iframe'];
      this.singleTagList = ['meta', 'link'];

      this.fixurlAttributeList = ['href', "lc-src"];
      this.specialKey2AttributeList = [[/link$/i, "href"], [/img$|image$/i, "lc-src"], [/html$/i, function (element) {
        return _this.__reverseHTML(element.innerHTML);
      }]];
    }

    _createClass(LittleCrawler, [{
      key: "get",
      value: function get() {
        var _this2 = this;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            request = _ref.request,
            response = _ref.response;

        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (!response) return Promise.reject(new Error("Empty response"));

        var url = void 0;
        try {
          url = this.getLink(request, dict);
        } catch (error) {
          return Promise.reject(error);
        }

        request = request || {};
        var method = (request.method || "GET").toLowerCase();
        var type = (request.type || "HTML").toLowerCase();
        var headers = request.headers || {};

        var ajax = void 0;
        switch (LittleCrawler.type(this.ajax)) {
          case "function":
            ajax = this.ajax;
            break;
          case "object":
            if (request.ajax && request.ajax in this.ajax) ajax = this.ajax[request.ajax];else if ('default' in this.ajax) ajax = this.ajax['default'];else if ('' in this.ajax) ajax = this.ajax[''];else throw new Error("cat't find the ajax");
            break;
          case "array":
            if (request.ajax && request.ajax in this.ajax) ajax = this.ajax[request.ajax];else ajax = this.ajax[0];
            break;
          default:
            throw new Error("illegal ajax");
            break;
        }

        return ajax(method, url, request.params, undefined, headers, { timeout: request.timeout }).then(function (data) {
          return _this2.parse(data, type, response, url, dict);
        });
      }
    }, {
      key: "getLink",
      value: function getLink(request) {
        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (!request) request = {
          "url": dict.url
        };

        if (LittleCrawler.type(request) == "string") {
          request = {
            "url": request
          };
        }

        if (!request.url) throw new Error("Empty URL");

        return LittleCrawler.format(request.url, dict);
      }
    }, {
      key: "parse",
      value: function parse(data, type, response, host) {
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        dict = Object.assign({}, dict, { host: host });

        switch (type) {
          case "html":
            data = this.__transformHTML(data);
            var html = document.createElement("container-html");
            html.innerHTML = data;
            return this.__handleResponse(html, response, null, dict);
          case "json":
            var json = void 0;
            if (LittleCrawler.type(data) != 'object') json = JSON.parse(data);else json = data;
            return this.__handleResponse(json, response, null, dict);
          default:
            throw new Error("Illegal type");
        }
      }
    }, {
      key: "__handleResponse",
      value: function __handleResponse(data, response, keyName) {
        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};


        if (!response) return undefined;

        switch (LittleCrawler.type(response)) {
          case "array":
            return this.__handleArray(data, response, keyName, globalDict, dict);
          case "object":
            return this.__handleObject(data, response, keyName, globalDict, dict);
          case "string":
            return this.__handleString(data, response, keyName, globalDict, dict);
          default:
            throw new Error("Illegal type");
        }
      }
    }, {
      key: "__handleArray",
      value: function __handleArray(data, response, keyName) {
        var _this3 = this;

        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        return response.map(function (m) {
          return _this3.__handleResponse(data, m, keyName, globalDict, dict);
        });
      }
    }, {
      key: "__handleObject",
      value: function __handleObject(data, response, keyName) {
        var _this4 = this;

        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};


        var __privateHandleObject = function __privateHandleObject(response) {
          var result = {};

          for (var key in response) {
            result[key] = _this4.__handleResponse(data, response[key], key, globalDict, result);
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
                return _this4.__handleResponse(m, response.children, keyName, globalDict, dict);
              });
              if (response.valideach) result = result.filter(function (m) {
                  var gatherDict = Object.assign({}, globalDict, LittleCrawler.type(data) == "object" ? data : {}, LittleCrawler.type(m) == "object" ? m : {});
                  var validCode = '"use strict"\n' + LittleCrawler.format(response.valideach, gatherDict, true);
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
              if (e == undefined) return undefined;

              if (response.attribute) {
                var attr = void 0;
                if (this.insecurityAttributeList.includes(response.attribute)) attr = "lc-" + attr;else attr = response.attribute;
                result = e.getAttribute(attr);
                if (this.fixurlAttributeList.indexOf(attr) >= 0) result = LittleCrawler.fixurl(result, globalDict.host);
                if (attr == 'innerHTML') result = this.__reverseHTML(result);
              } else result = this.__getValue(e, keyName, globalDict, dict);

              if (result == undefined) return result;

              if (response.remove) {
                var regex = new RegExp(response.remove, 'gi');
                result = result.replace(regex, '');
              }

              if (response.extract) {
                var _regex = new RegExp(response.extract, 'i');
                var matcher = result.match(_regex);
                if (!matcher) return undefined;
                result = matcher[1];
              }
            }
            break;
          case "boolean":
            {
              if (!response.element) return response.default;
              var _e = this.__getElement(data, response.element);
              if (_e == undefined) return response.default;
              var v = this.__getValue(_e, keyName, globalDict, dict);
              if (v != undefined) v = v.toString();

              if (v != undefined && response.true && v.match(response.true)) result = true;else if (v != undefined && response.false && v.match(response.false)) result = false;else result = response.default;
            }
            break;
          case "format":
            {
              if (!response.value) return undefined;
              var gatherDict = Object.assign({}, globalDict, LittleCrawler.type(data) == "object" ? data : {}, dict);
              result = LittleCrawler.format(response.value, gatherDict);
            }
            break;
          default:
            {
              result = __privateHandleObject(response);
            }
        }

        if ("valid" in response) {
          var _gatherDict = Object.assign({}, globalDict, LittleCrawler.type(data) == "object" ? data : {}, dict);
          var validCode = '"use strict"\n' + LittleCrawler.format(response.valid, _gatherDict, true);
          if (!eval(validCode)) return undefined;
        }
        return result;
      }
    }, {
      key: "__handleString",
      value: function __handleString(data, response, keyName) {
        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        var e = this.__getElement(data, response);
        if (e == undefined) return undefined;
        return this.__getValue(e, keyName, globalDict, dict);
      }
    }, {
      key: "__getValue",
      value: function __getValue(element, keyName) {
        var globalDict = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var dict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        if (element && element.querySelector) {
          var result = void 0;
          if (!keyName) return element.textContent.trim();

          var matched = false;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = this.specialKey2AttributeList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var _step$value = _slicedToArray(_step.value, 2),
                  pattern = _step$value[0],
                  attr = _step$value[1];

              if (keyName.match(pattern)) {
                matched = true;
                if (LittleCrawler.type(attr) == "string") {
                  result = element.getAttribute(attr);

                  if (this.fixurlAttributeList.indexOf(attr) >= 0) result = LittleCrawler.fixurl(result, globalDict.host);
                } else if (LittleCrawler.type(attr) == "function") result = attr(element);
                break;
              }
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

          if (!matched) result = element.textContent.trim();
          return result;
        } else {
          return element;
        }
      }
    }, {
      key: "__transformSelector",
      value: function __transformSelector(selector) {
        if (!selector) return selector;
        selector = this.insecurityTagList.reduce(function (s, tag) {
          return s.replace(new RegExp("([^#._-]|^)\\b" + tag + "\\b", "gi"), "$1lc-" + tag);
        }, selector);

        selector = this.insecurityAttributeList.reduce(function (s, attr) {
          return s.replace(new RegExp("\\[\\b" + attr + "\\b", "gi"), "[lc-" + attr);
        }, selector);
        return selector;
      }
    }, {
      key: "__getElement",
      value: function __getElement(element, selector) {
        if (!element || !selector) return undefined;

        if ("querySelector" in element) {
          return element.querySelector(this.__transformSelector(selector));
        } else {
          return LittleCrawler.getDataFromObject(element, selector);
        }
      }
    }, {
      key: "__getAllElements",
      value: function __getAllElements(element, selector) {
        if (!element || !selector) return undefined;

        if ("querySelectorAll" in element) {
          return Array.from(element.querySelectorAll(this.__transformSelector(selector)));
        } else {
          return LittleCrawler.getDataFromObject(element, selector) || [];
        }
      }
    }, {
      key: "__transformHTML",
      value: function __transformHTML(html) {
        if (!html) return html;

        html = this.singleTagList.reduce(function (h, tag) {
          return h.replace(new RegExp("(<" + tag + "\\b(?: [^>]*?)?)/?>", "gi"), "$1></" + tag + ">");
        }, html);

        html = this.insecurityTagList.reduce(function (h, tag) {
          return LittleCrawler.replaceTag(h, tag, "lc-" + tag);
        }, html);

        html = this.insecurityAttributeList.reduce(function (h, attr) {
          return LittleCrawler.replaceAttribute(h, attr, "lc-" + attr);
        }, html);
        return html;
      }
    }, {
      key: "__reverseHTML",
      value: function __reverseHTML(html) {
        if (!html) return html;
        html = this.insecurityTagList.reduce(function (h, tag) {
          return LittleCrawler.replaceTag(h, "lc-" + tag, tag);
        }, html);

        html = this.insecurityAttributeList.reduce(function (h, attr) {
          return LittleCrawler.replaceAttribute(h, "lc-" + attr, attr);
        }, html);
        return html;
      }
    }]);

    return LittleCrawler;
  }();

  LittleCrawler.cordovaAjax = function () {
    var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'get';
    var url = arguments[1];
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var dataType = arguments[3];
    var headers = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    var options = arguments[5];

    if (typeof cordovaHTTP == 'undefined') return LittleCrawler.ajax(method, url, params, dataType, headers, options);
    return new Promise(function (resolve, reject) {
      if (!url) return reject(new Error("url is null"));

      var func = void 0;
      switch (method.toLowerCase()) {
        case "get":
          func = cordovaHTTP.get.bind(cordovaHTTP);
          break;

        case "post":
          func = cordovaHTTP.post.bind(cordovaHTTP);
          break;
        default:
          return reject(new Error("method is illegal"));
      }

      if (!('User-Agent' in headers)) headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';

      func(url, params, headers, function (response) {
        switch (dataType) {
          case "json":
            resolve(JSON.parse(response.data));
            break;
          default:
            resolve(response.data);
            break;
        }
      }, function (response) {
        reject(response.error);
      });
    });
  }, LittleCrawler.__urlJoin = function (url, params) {

    if (!params) return url;
    params = Object.keys(params).map(function (k) {
      return k + "=" + params[k];
    }).join("&");
    if (!params) return url;

    var i = url.indexOf("?");
    if (i == -1) return url + "?" + params;else if (i < url.length - 1) return url + "&" + params;else return "" + url + params;
  };

  LittleCrawler.ajax = function () {
    var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "GET";
    var url = arguments[1];
    var params = arguments[2];
    var dataType = arguments[3];
    var headers = arguments[4];

    var _ref2 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {},
        _ref2$timeout = _ref2.timeout,
        timeout = _ref2$timeout === undefined ? 5 : _ref2$timeout,
        _ref2$retry = _ref2.retry,
        retry = _ref2$retry === undefined ? 1 : _ref2$retry;

    return new Promise(function (resolve, reject) {
      if (!url) return reject(new Error("url is null"));
      url = LittleCrawler.__urlJoin(url, params);
      console.log("Get: " + url);
      url = encodeURI(url);
      retry = retry || 0;

      var request = new XMLHttpRequest();
      request.open(method, url);
      request.timeout = timeout * 1000;

      dataType = (dataType || "").toLowerCase();
      switch (dataType) {
        case "json":
          request.setRequestHeader("Content-Type", "application/json");
          break;
      }

      request.onload = function () {
        switch (dataType) {
          case "json":
            resolve(JSON.parse(request.responseText));
            break;
          default:
            resolve(request.responseText);
            break;
        }
      };

      request.ontimeout = function () {
        if (retry > 0) {
          request.open(method, url);
          request.send(null);
          retry -= 1;
        } else {
          console.error("Fail to get: " + url + ", \u7F51\u7EDC\u8D85\u65F6");
          reject(new Error("Request Timeout"));
        }
      };

      request.onabort = function () {
        console.error("Fail to get: " + url + ", \u4F20\u8F93\u4E2D\u65AD");
        reject(new Error("Request Abort"));
      };

      request.onerror = function () {
        console.error("Fail to get: " + url + ", 网络错误");
        reject(new Error("Request Error"));
      };

      request.send(null);
    });
  }, LittleCrawler.getDataFromObject = function (obj, key) {

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

        if (!result) return {
            v: undefined
          };

        var _splitKeyAndOperatorA = splitKeyAndOperatorAndArgs(key),
            _splitKeyAndOperatorA2 = _slicedToArray(_splitKeyAndOperatorA, 3),
            k = _splitKeyAndOperatorA2[0],
            operator = _splitKeyAndOperatorA2[1],
            args = _splitKeyAndOperatorA2[2];

        if (LittleCrawler.type(result) == 'array') {
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
            if (LittleCrawler.type(result) == 'array') result = result.filter(function (e) {
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
  };

  LittleCrawler.fixurl = function (url, host) {
    if (!url || url.match("^https?://")) return url;

    if (url.match("^//")) url = "http:" + url;else if (url.match("^://")) url = "http" + url;else if (url.match("^javascript:")) url = "";else {
      var matcher = host.match(/^(.*?):\/\//);
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
  };

  LittleCrawler.format = function (string) {
    var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var stringify = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (!string) return string;

    var result = string.replace(/{(\w+)}/g, function (p0, p1) {

      if (!(p1 in object)) throw new Error("can't find the key " + p1 + " in object");

      if (object[p1] == undefined && !stringify) return '';
      if (stringify) return JSON.stringify(object[p1]);else return object[p1];
    });
    return result;
  };

  LittleCrawler.clearHtml = function (html) {
    if (!html) return html;

    html = LittleCrawler.filterHtmlContent(html);

    var whitePropertyList = ['src'];
    html = html.replace(/\s*([\w-]+)\s*=\s*"[^"]*"/gi, function (p0, p1) {
      return whitePropertyList.includes(p1) ? p0 : "";
    });

    if (html.match(/<br\s*\/?>/gi)) {
      var dbrhtml = html.replace(/([^>]*)<br\s*\/?>\s*<br\s*\/?>/gi, '<p>$1</pchange>');
      if (dbrhtml.match(/<br\s*\/?>\s*/i)) html = html.replace(/([^>]*)<br\s*\/?>/gi, '<p>$1</pchange>');else html = dbrhtml;

      html = html.replace(/<\/pchange>([^<]+)($|<)/gi, '</p><p>$1</p>$2');
      html = html.replace(/<\/pchange>/gi, '</p>');
    }

    html = html.replace(/>(　|\s|&nbsp;)+/gi, '>');
    html = html.replace(/(　|\s|&nbsp;)+</gi, '<');

    return html;
  };

  LittleCrawler.filterHtmlContent = function (html) {
    if (!html) return html;

    var m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
    if (m && m.length >= 2) html = m[1];

    var blackList = ['script', 'style', 'link', 'meta', 'iframe'];
    html = blackList.reduce(function (html, be) {
      return LittleCrawler.filterTag(html, be);
    }, html);
    return html;
  };

  LittleCrawler.filterTag = function (html, tag) {

    if (!html || !tag) return html;

    var pattern = "<" + tag + "\\b( [^>]*?)?>[\\s\\S]*?</" + tag + ">";
    html = html.replace(new RegExp(pattern, 'gi'), '');

    pattern = "<" + tag + "\\b([^>]*?)?>";
    html = html.replace(new RegExp(pattern, 'gi'), '');
    return html;
  };

  LittleCrawler.replaceTag = function (html, tag, retag) {
    if (!html || !tag || !retag || tag == retag) return html;

    var pattern = "<" + tag + "\\b(?=[ >/])";
    html = html.replace(new RegExp(pattern, 'gi'), "<" + retag);

    pattern = "</" + tag + ">";
    html = html.replace(new RegExp(pattern, 'gi'), "</" + retag + ">");
    return html;
  };

  LittleCrawler.replaceAttribute = function (html, attr, reattr) {
    if (!html || !attr || !reattr || attr == reattr) return html;

    return html.replace(new RegExp("\\b" + attr + "=(?=[\"'])", 'gi'), reattr + "=");
  };

  LittleCrawler.type = function (obj) {
    var type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
    if (type != 'object') return type;
    return obj.constructor.name.toLowerCase();
  };

  LittleCrawler.text2html = function (text) {
    if (!text) return text;

    var lines = text.split("\n").map(function (line) {
      return "<p>" + escapeHTML(line.trim()) + "</p>";
    });
    return lines.join('\n');

    function escapeHTML(t) {
      return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;").replace(/"/g, "&#34;").replace(/'/g, "&#39;");
    }
  };

  LittleCrawler.cloneObjectValues = function (dest, src) {
    if (!dest || !src) return dest;

    for (var key in dest) {
      if (src[key] != undefined) dest[key] = src[key];
    }
    return dest;
  };

  return LittleCrawler;
});
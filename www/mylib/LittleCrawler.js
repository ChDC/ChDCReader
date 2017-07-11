"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory();else window["LittleCrawler"] = factory();
})(function () {
  var LittleCrawler = function () {
    function LittleCrawler(ajax) {
      var _this = this;

      _classCallCheck(this, LittleCrawler);

      var a = {
        "default": LittleCrawler.ajax,
        "cordova": LittleCrawler.cordovaAjax
      };
      if (!ajax) this.ajax = a;else if (LittleCrawler.type(ajax) == "object") this.ajax = Object.assign(a, ajax);else this.ajax = ajax;

      this.insecurityAttributeList = ['src'];
      this.insecurityTagList = ['body', 'head', 'title', 'link', 'meta', 'iframe'];
      this.abnormalSingleTagList = ['meta'];
      this.normalSingleTagList = ['link'];

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
        var params = request.params || {};
        for (var k in params) {
          params[k] = LittleCrawler.format(params[k], dict);
        }
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
        }

        return ajax(method, url, params, undefined, headers, { timeout: request.timeout }).then(function (data) {
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


        if (response == "") return this.__getValue(data, keyName, globalDict, dict);

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
              if (!("element" in response) || !("children" in response)) return undefined;
              result = [];
              var list = this.__getAllElements(data, response.element);
              result = list.map(function (m) {
                return _this4.__handleResponse(m, response.children, keyName, globalDict, dict);
              });
              if (response.valideach) result = result.filter(function (m) {
                  var gatherDict = Object.assign({}, globalDict, LittleCrawler.type(data) == "object" ? data : {}, LittleCrawler.type(m) == "object" ? m : { value: m });
                  var validCode = '"use strict"\n' + LittleCrawler.format(response.valideach, gatherDict, true);
                  return eval(validCode);
                });
              if (response.reverse) result = result.reverse();
            }
            break;
          case "object":
            {
              if (!("children" in response)) return undefined;
              result = __privateHandleObject(response.children);
            }
            break;
          case "string":
            {
              if (!("element" in response)) return undefined;

              var e = void 0;
              if ("index" in response) {
                var es = this.__getAllElements(data, response.element);
                e = LittleCrawler.index(es, response.index);
              } else e = this.__getElement(data, response.element);
              if (e == undefined) return undefined;

              if (response.attribute) {
                var attr = void 0;
                if (this.insecurityAttributeList.includes(response.attribute)) attr = "lc-" + response.attribute;else attr = response.attribute;
                result = e.getAttribute(attr);
                if (this.fixurlAttributeList.indexOf(attr) >= 0) result = LittleCrawler.fixurl(result, globalDict.host);
                if (attr == 'innerHTML') result = this.__reverseHTML(result);
              } else result = this.__getValue(e, keyName, globalDict, dict);

              if (result == undefined) return result;

              if (response.remove) {
                result = result.toString();
                switch (LittleCrawler.type(response.remove)) {
                  case "array":
                    result = response.remove.reduce(function (r, e) {
                      return LittleCrawler.type(e) == "object" ? r.replace(new RegExp(e.regexp, e.options), '') : r.replace(new RegExp(e, "gi"), '');
                    }, result);
                    break;

                  case "object":
                    result = result.replace(new RegExp(response.remove.regexp, response.remove.options), '');
                    break;

                  case "string":
                    result = result.replace(new RegExp(response.remove, 'gi'), '');
                    break;
                }
              }

              if (response.extract) {
                (function () {
                  result = result.toString();
                  var doExtract = function doExtract(regex, str) {
                    var matcher = str.match(regex);
                    if (!matcher) return undefined;
                    if (regex.global) return matcher.join('');else {
                      var r = matcher.slice(1).join('');
                      return r ? r : matcher[0];
                    }
                  };
                  switch (LittleCrawler.type(response.extract)) {
                    case "array":
                      result = response.extract.reduce(function (r, e) {
                        return LittleCrawler.type(e) == "object" ? doExtract(new RegExp(e.regexp, e.options), r) : doExtract(new RegExp(e, "i"), r);
                      }, result);
                      break;

                    case "object":
                      result = doExtract(new RegExp(response.extract.regexp, response.extract.options), result);
                      break;

                    case "string":
                      result = doExtract(new RegExp(response.extract, 'i'), result);
                      break;
                  }
                })();
              }
              if (result == undefined) return result;
              if (typeof result == "string") result = result.trim();
            }
            break;
          case "boolean":
            {
              if (!("element" in response)) return response.default;
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
          var _gatherDict = Object.assign({}, globalDict, LittleCrawler.type(data) == "object" ? data : {}, dict, { value: result });
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

          if (!matched) result = element.textContent;
          return result.trim();
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
        if (!element) return undefined;
        if (selector == "") return element;
        if (!selector) return undefined;

        if ("querySelector" in element) {
          return element.querySelector(this.__transformSelector(selector));
        } else {
          return LittleCrawler.getDataFromObject(element, selector);
        }
      }
    }, {
      key: "__getAllElements",
      value: function __getAllElements(element, selector) {
        if (!element) return element;
        if (selector == "") return element;
        if (!selector) return undefined;

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

        var singleTagList = [].concat(_toConsumableArray(this.abnormalSingleTagList), _toConsumableArray(this.normalSingleTagList));
        html = singleTagList.reduce(function (h, tag) {
          return h.replace(new RegExp("(<" + tag + "\\b(?: [^>]*?)?)/?>", "gi"), "$1></" + tag + ">");
        }, html);

        html = html.replace(/<script\b([^>]*)/gi, function (p0, p1) {
          return "<script type=\"text/plain\"" + (p1 ? p1.replace(/\btype\b/gi, 'lc-type') : "");
        });

        html = html.replace(/<style\b(.*?)<\/style>/gi, '<script type="text/style"$1</script>');

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

        html = this.insecurityAttributeList.reduce(function (h, attr) {
          return LittleCrawler.replaceAttribute(h, "lc-" + attr, attr);
        }, html);

        html = this.insecurityTagList.reduce(function (h, tag) {
          return LittleCrawler.replaceTag(h, "lc-" + tag, tag);
        }, html);

        html = html.replace(/<script type="text\/plain"([^>]*)/gi, function (p0, p1) {
          return "<script" + (p1 ? p1.replace(/\blc-type\b/gi, 'type') : "");
        });

        html = html.replace(/<script\b([^>]*) type="text\/style"(.*?)<\/script>/gi, '<style$1$2</style>');

        html = this.abnormalSingleTagList.reduce(function (h, tag) {
          return h.replace(new RegExp("<" + tag + "\\b([^>]*)><\\/" + tag + ">", "gi"), "<" + tag + "$1>");
        }, html);

        html = this.normalSingleTagList.reduce(function (h, tag) {
          return h.replace(new RegExp("<" + tag + "\\b([^>]*)><\\/" + tag + ">", "gi"), "<" + tag + "$1/>");
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
  }, LittleCrawler.ajax = function () {
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

      method = method.toLowerCase();

      var sendData = null;
      switch (method) {
        case "get":
          url = LittleCrawler.__urlJoin(url, params);
          break;
        case "post":
          sendData = Object.keys(params).map(function (k) {
            return k + "=" + params[k];
          }).join("&");
          break;
      }

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
        case "blob":
          request.responseType = 'blob';
          break;
        case "arraybuffer":
          request.responseType = "arraybuffer";
          break;
      }

      request.onload = function () {
        switch (dataType) {
          case "json":
            resolve(JSON.parse(request.responseText));
            break;
          case "blob":
            resolve(request.response);
            break;
          case "arraybuffer":
            resolve(request.response);
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
          console.error("AjaxError: Fail to get: " + url + ", \u7F51\u7EDC\u8D85\u65F6");
          reject(new Error("AjaxError: Request Timeout"));
        }
      };

      request.onabort = function () {
        console.error("Fail to get: " + url + ", \u4F20\u8F93\u4E2D\u65AD");
        reject(new Error("AjaxError: Request Abort"));
      };

      request.onerror = function () {
        console.error("Fail to get: " + url + ", 网络错误");
        reject(new Error("AjaxError: Request Error"));
      };

      request.send(sendData);
    });
  }, LittleCrawler.getDataFromObject = function (json, key) {
    function operatorFilter(element, parent, args) {
      var codeStart = '"use strict"\n';
      var env = "var $element=" + JSON.stringify(element) + ";\nvar $parent=" + JSON.stringify(parent) + ";\n";
      var code = codeStart + env + args[0];
      return eval(code);
    }

    function splitKeyAndOperatorAndArgs(str) {
      if (!str) return [];
      var i = str.indexOf('#');
      if (i < 0) return [str];
      var key = str.substring(0, i);
      str = str.substring(i + 1);
      var oas = str.split("#").map(function (d) {
        i = d.indexOf('(');
        if (i < 0) return [d, undefined];
        var operator = d.substring(0, i);
        var args = d.substring(i + 1, d.length - 1);
        if (!args) args = [];else args = eval("[" + args + "]");
        return [operator, args];
      });

      return [key, oas];
    }

    function getValue(obj, keys, i) {
      while (i < keys.length && (LittleCrawler.type(obj) == "object" || LittleCrawler.type(obj) == "array" && keys[i][0].match(/^[0-9]+$/))) {
        obj = obj[keys[i++][0]];
      }if (i >= keys.length) return obj;
      if (LittleCrawler.type(obj) != "array") return undefined;

      var result = obj;

      var _keys$i = _slicedToArray(keys[i], 2),
          key = _keys$i[0],
          oas = _keys$i[1];

      if (!oas || oas.length <= 0) return result.map(function (m) {
        return getValue(m, keys, i);
      });else {
        (function () {
          var oa = oas.find(function (e) {
            return e[0] == "filter";
          });
          if (oa) result = result.filter(function (e) {
            return operatorFilter(e[key], e, oa[1]);
          });

          result = result.map(function (m) {
            return getValue(m, keys, i);
          });

          oa = oas.find(function (e) {
            return e[0] == "concat";
          });
          if (oa) result = result.reduce(function (s, m) {
            return s.concat(m);
          }, []);
        })();
      }

      return result;
    }

    if (!json || !key) return json;
    var keys = key.split(key.includes("::") ? '::' : '.');
    keys = keys.map(function (k) {
      return splitKeyAndOperatorAndArgs(k);
    });
    var result = getValue(json, keys, 0);
    return result;
  }, LittleCrawler.fixurl = function (url, host) {
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
  }, LittleCrawler.format = function (string) {
    var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var stringify = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (!string) return string;

    var result = string.replace(/{(\w+)}/g, function (p0, p1) {

      if (!(p1 in object)) throw new Error("can't find the key " + p1 + " in object");

      if (object[p1] == undefined && !stringify) return '';
      if (stringify) return JSON.stringify(object[p1]);else return object[p1];
    });
    return result;
  }, LittleCrawler.clearHtml = function (html) {
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
  }, LittleCrawler.filterHtmlContent = function (html) {
    if (!html) return html;

    var m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
    if (m && m.length >= 2) html = m[1];

    var blackList = ['script', 'style', 'link', 'meta', 'iframe'];
    html = blackList.reduce(function (html, be) {
      return LittleCrawler.filterTag(html, be);
    }, html);
    return html;
  }, LittleCrawler.filterTag = function (html, tag) {

    if (!html || !tag) return html;

    var pattern = "<" + tag + "\\b( [^>]*?)?>[\\s\\S]*?</" + tag + ">";
    html = html.replace(new RegExp(pattern, 'gi'), '');

    pattern = "<" + tag + "\\b([^>]*?)?>";
    html = html.replace(new RegExp(pattern, 'gi'), '');
    return html;
  }, LittleCrawler.replaceTag = function (html, tag, retag) {
    if (!html || !tag || !retag || tag == retag) return html;

    var pattern = "<" + tag + "\\b(?=[ >/])";
    html = html.replace(new RegExp(pattern, 'gi'), "<" + retag);

    pattern = "</" + tag + ">";
    html = html.replace(new RegExp(pattern, 'gi'), "</" + retag + ">");
    return html;
  }, LittleCrawler.replaceAttribute = function (html, attr, reattr) {
    if (!html || !attr || !reattr || attr == reattr) return html;

    return html.replace(new RegExp("\\b" + attr + "=(?=[\"'])", 'gi'), reattr + "=");
  }, LittleCrawler.type = function (obj) {
    var type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
    if (type != 'object') return type;
    return obj.constructor.name.toLowerCase();
  }, LittleCrawler.index = function (array, index) {
    if (index >= 0) return array[index];else return array[array.length + index];
  }, LittleCrawler.text2html = function (text) {
    if (!text) return text;

    var lines = text.split("\n").map(function (line) {
      return "<p>" + escapeHTML(line.trim()) + "</p>";
    });
    return lines.join('\n');

    function escapeHTML(t) {
      return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;").replace(/"/g, "&#34;").replace(/'/g, "&#39;");
    }
  }, LittleCrawler.cloneObjectValues = function (dest, src) {
    if (!dest || !src) return dest;

    for (var key in dest) {
      if (src[key] != undefined) dest[key] = src[key];
    }
    return dest;
  };

  return LittleCrawler;
});
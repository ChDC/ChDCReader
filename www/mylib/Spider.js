'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {
  var Spider = function () {
    function Spider(ajax) {
      var _this = this;

      _classCallCheck(this, Spider);

      this.ajax = ajax;

      this.secureAttributeList = [['src', 'data-src']];

      this.fixurlAttributeList = ['href', "data-src"];
      this.specialKey2AttributeList = [[/link$/i, "href"], [/img$|image$/i, "data-src"], [/html$/i, function (element) {
        return _this.__reverseTransformHTMLTagProperty(element.innerHTML);
      }]];
    }

    _createClass(Spider, [{
      key: 'get',
      value: function get() {
        var _this2 = this;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            request = _ref.request,
            response = _ref.response;

        var dict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (!response) return Promise.reject(new Error("Empty response"));

        if (!request) request = {
          "url": dict.url
        };

        if (this.type(request) == "string") {
          request = {
            "url": request
          };
        }

        if (!request.url) return Promise.reject(new Error("Empty URL"));

        var method = (request.method || "GET").toLowerCase();
        var type = (request.type || "HTML").toLowerCase();
        var headers = request.headers || {};

        var url = this.format(request.url, dict);

        var ajax = void 0;
        switch (this.type(this.ajax)) {
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
      key: 'parse',
      value: function parse(data, type, response, host) {
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        dict.host = host;

        switch (type) {
          case "html":
            data = this.filterHtmlContent(data);
            data = this.__transformHTMLTagProperty(data);
            var html = document.createElement("div");
            html.innerHTML = data;
            return this.__handleResponse(html, response, null, dict);
          case "json":
            var json = JSON.parse(data);
            return this.__handleResponse(json, response, null, dict);
          default:
            throw new Error("Illegal type");
        }
      }
    }, {
      key: '__handleResponse',
      value: function __handleResponse(data, response, keyName) {
        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};


        if (!response) return undefined;

        switch (this.type(response)) {
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
      key: '__handleArray',
      value: function __handleArray(data, response, keyName) {
        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        var result = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = response[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var m = _step.value;

            result.push(this.__handleResponse(data, m, keyName, globalDict, dict));
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
      key: '__handleObject',
      value: function __handleObject(data, response, keyName) {
        var _this3 = this;

        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};


        var __privateHandleObject = function __privateHandleObject(response) {
          var result = {};

          for (var key in response) {
            result[key] = _this3.__handleResponse(data, response[key], key, globalDict, result);
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
                return _this3.__handleResponse(m, response.children, keyName, globalDict, dict);
              });
              if (response.valideach) result = result.filter(function (m) {
                var gatherDict = Object.assign({}, globalDict, _this3.type(m) == "object" ? m : {});
                var validCode = '"use strict"\n' + _this3.format(response.valideach, gatherDict, true);
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
                var transAttrbite = this.secureAttributeList.find(function (e) {
                  return e[0] == response.attribute;
                });
                if (transAttrbite) attr = transAttrbite[1];else attr = response.attribute;
                result = e.getAttribute(attr);

                if (this.fixurlAttributeList.indexOf(attr) >= 0) result = this.fixurl(result, globalDict.host);
                if (attr == 'innerHTML') result = this.__reverseTransformHTMLTagProperty(result);
              } else result = this.__getValue(e, keyName, globalDict, dict);

              if (!result) return result;

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
              if (!_e) return response.default;
              var v = this.__getValue(_e, keyName, globalDict, dict);

              if (v && response.true && v.match(response.true)) result = true;else if (v && response.false && v.match(response.false)) result = false;else result = response.default;
            }
            break;
          case "format":
            {
              if (!response.value) return undefined;
              var gatherDict = Object.assign({}, globalDict, dict);
              result = this.format(response.value, gatherDict);
            }
            break;
          default:
            {
              result = __privateHandleObject(response);
            }
        }

        if ("valid" in response) {
          var _gatherDict = Object.assign({}, globalDict, dict);
          var validCode = '"use strict"\n' + this.format(response.valid, _gatherDict, true);
          if (!eval(validCode)) return undefined;
        }
        return result;
      }
    }, {
      key: '__handleString',
      value: function __handleString(data, response, keyName) {
        var globalDict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var dict = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        var e = this.__getElement(data, response);
        if (!e) return undefined;
        return this.__getValue(e, keyName, globalDict, dict);
      }
    }, {
      key: '__getValue',
      value: function __getValue(element, keyName) {
        var globalDict = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var dict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        if (element && element.querySelector) {
          var result = void 0;
          if (!keyName) return element.textContent.trim();

          var matched = false;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = this.specialKey2AttributeList[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var _step2$value = _slicedToArray(_step2.value, 2),
                  pattern = _step2$value[0],
                  attr = _step2$value[1];

              if (keyName.match(pattern)) {
                matched = true;
                if (this.type(attr) == "string") {
                  result = element.getAttribute(attr);

                  if (this.fixurlAttributeList.indexOf(attr) >= 0) result = this.fixurl(result, globalDict.host);
                } else if (this.type(attr) == "function") result = attr(element);
              }
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

          if (!matched) result = element.textContent.trim();
          return result;
        } else {
          return element;
        }
      }
    }, {
      key: '__getElement',
      value: function __getElement(element, selector) {
        if (!element || !selector) return undefined;

        if ("querySelector" in element) {
          return element.querySelector(selector);
        } else {
          return this.__getDataFromObject(element, selector);
        }
      }
    }, {
      key: '__getAllElements',
      value: function __getAllElements(element, selector) {
        if (!element || !selector) return undefined;

        if ("querySelectorAll" in element) {
          return Array.from(element.querySelectorAll(selector));
        } else {
          return this.__getDataFromObject(element, selector) || [];
        }
      }
    }, {
      key: '__getDataFromObject',
      value: function __getDataFromObject(obj, key) {
        var _this4 = this;

        function operatorFilter(element, args) {
          var codeStart = '"use strict"\n';
          var env = 'var $element=' + JSON.stringify(element) + ';\n';
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
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          var _loop = function _loop() {
            var key = _step3.value;

            var _splitKeyAndOperatorA = splitKeyAndOperatorAndArgs(key),
                _splitKeyAndOperatorA2 = _slicedToArray(_splitKeyAndOperatorA, 3),
                k = _splitKeyAndOperatorA2[0],
                operator = _splitKeyAndOperatorA2[1],
                args = _splitKeyAndOperatorA2[2];

            if (!result) return {
                v: undefined
              };

            if (_this4.type(result) == 'array') {
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
                if (_this4.type(result) == 'array') result = result.filter(function (e) {
                  return operatorFilter(e, args);
                });
              } else result = result[k];
            }
          };

          for (var _iterator3 = keys[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _ret = _loop();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        return result;
      }
    }, {
      key: 'fixurl',
      value: function fixurl(url, host) {
        if (!url || url.match("^https?://")) return url;

        if (url.match("^//")) url = "http:" + url;else if (url.match("^://")) url = "http" + url;else if (url.match("^javascript:")) url = "";else {
          var matcher = host.match(/^(.*?):\/\//);
          var scheme = matcher ? matcher[0] : "";
          host = host.substring(scheme.length);

          if (url.match("^/")) {
            host = host.replace(/\/.*$/, "");
            url = '' + scheme + host + url;
          } else {
            host = host.replace(/\/[^\/]*$/, "");
            var m2 = url.match(/^\.\.\//g);
            url = url.replace(/^\.\.\//g, '');
            if (m2) {
              for (var i = 0; i < m2.length; i++) {
                host = host.replace(/\/[^\/]*$/, "");
              }
            }
            url = '' + scheme + host + '/' + url;
          }
        }
        return url;
      }
    }, {
      key: 'format',
      value: function format(string) {
        var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var stringify = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (!string) return string;

        var result = string.replace(/{(\w+)}/g, function (p0, p1) {

          if (!(p1 in object)) throw new Error('can\'t find the key ' + p1 + ' in object');

          if (object[p1] == undefined && !stringify) return '';
          if (stringify) return JSON.stringify(object[p1]);else return object[p1];
        });
        return result;
      }
    }, {
      key: 'clearHtml',
      value: function clearHtml(html) {
        if (!html) return html;

        html = this.filterHtmlContent(html);

        var whitePropertyList = ['src'];
        html = html.replace(/[\s\r\n]*([\w-]+)[\s\r\n]*=[\s\r\n]*"[^"]*"/gi, function (p0, p1) {
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
      }
    }, {
      key: 'filterHtmlContent',
      value: function filterHtmlContent(html) {
        var _this5 = this;

        if (!html) return html;

        var m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
        if (m && m.length >= 2) html = m[1];

        var blackList = ['script', 'style', 'link', 'meta', 'iframe'];
        html = blackList.reduce(function (html, be) {
          return _this5.__filterElement(html, be);
        }, html);
        return html;
      }
    }, {
      key: '__transformHTMLTagProperty',
      value: function __transformHTMLTagProperty(html) {
        if (!html) return html;

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this.secureAttributeList[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _step4$value = _slicedToArray(_step4.value, 2),
                src = _step4$value[0],
                dest = _step4$value[1];

            html = html.replace(new RegExp('\\b' + src + '=(?=["\'])', 'gi'), dest + '=');
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        return html;
      }
    }, {
      key: '__reverseTransformHTMLTagProperty',
      value: function __reverseTransformHTMLTagProperty(html) {
        if (!html) return html;

        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = this.secureAttributeList[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _step5$value = _slicedToArray(_step5.value, 2),
                src = _step5$value[0],
                dest = _step5$value[1];

            html = html.replace(new RegExp('\\b' + dest + '=(?=["\'])', 'gi'), src + '=');
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        return html;
      }
    }, {
      key: '__filterElement',
      value: function __filterElement(html, element) {
        var endElement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : element;


        if (!html || !element) return html;

        var pattern = '<' + element + '( [^>]*?)?>[\\s\\S]*?</' + endElement + '>';
        html = html.replace(new RegExp(pattern, 'gi'), '');

        pattern = '<' + element + '([^>]*?)?>';
        html = html.replace(new RegExp(pattern, 'gi'), '');
        return html;
      }
    }, {
      key: 'type',
      value: function type(obj) {
        var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
        if (type != 'object') return type;
        return obj.constructor.name.toLowerCase();
      }
    }]);

    return Spider;
  }();

  return Spider;
});
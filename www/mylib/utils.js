"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["utils"] = factory();
})(["fileSystem"], function (fileSystem) {
  "use strict";

  return {
    DEBUG: true,

    type: function type(obj) {
      var type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
      if (type != 'object') return type;
      return obj.constructor.name.toLowerCase();
    },
    log: function log(content, detailContent) {
      var msg = "[" + new Date().toLocaleString() + "] " + content + (detailContent ? ": " + detailContent : '');
      console.log(msg);
    },
    error: function error(content, detailContent) {
      var msg = "[" + new Date().toLocaleString() + "] " + content + (detailContent ? ": " + detailContent : '');
      console.error(msg);
    },
    __urlJoin: function __urlJoin(url, params) {

      if (!params) return url;

      var r = [];
      for (var k in params) {
        r.push(k + "=" + params[k]);
      };

      if (r.length <= 0) return url;

      params = r.join("&");

      var i = url.indexOf("?");
      if (i == -1) return url + "?" + params;else if (i < url.length - 1) return url + "&" + params;else return "" + url + params;
    },
    cordovaAjax: function cordovaAjax() {
      var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'get';
      var url = arguments[1];
      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var dataType = arguments[3];
      var headers = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
      var options = arguments[5];

      if (typeof cordovaHTTP == 'undefined') return this.ajax(method, url, params, dataType, headers, options);
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
    },
    ajax: function ajax() {
      var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "GET";
      var url = arguments[1];
      var params = arguments[2];
      var dataType = arguments[3];

      var _this = this;

      var headers = arguments[4];

      var _ref = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {},
          _ref$timeout = _ref.timeout,
          timeout = _ref$timeout === undefined ? 5 : _ref$timeout,
          _ref$retry = _ref.retry,
          retry = _ref$retry === undefined ? 1 : _ref$retry;

      return new Promise(function (resolve, reject) {
        if (!url) return reject(new Error("url is null"));
        url = _this.__urlJoin(url, params);
        _this.log("Get: " + url);
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
            _this.error("Fail to get: " + url + ", \u7F51\u7EDC\u8D85\u65F6");
            reject(new Error("Request Timeout"));
          }
        };

        request.onabort = function () {
          _this.error("Fail to get: " + url + ", \u4F20\u8F93\u4E2D\u65AD");
          reject(new Error("Request Abort"));
        };

        request.onerror = function () {
          _this.error("Fail to get: " + url + ", 网络错误");
          reject(new Error("Request Error"));
        };

        request.send(null);
      });
    },
    get: function get(url, params, dataType, options) {
      return this.ajax("GET", url, params, dataType, {}, options);
    },
    getJSON: function getJSON(url, params) {
      return this.get(url, params, "json");
    },
    getParamsFromURL: function getParamsFromURL(url) {
      if (!url) return {};
      var i = url.indexOf("?");
      if (i < 0) return {};
      url = url.slice(i + 1);
      var params = {};
      var pa = url.split("&");
      for (var j = 0; j < pa.length; j++) {
        var p = pa[j];
        i = p.indexOf("=");
        if (i < 0) params[p] = undefined;else {
          var key = p.slice(0, i);
          var value = p.slice(i + 1);
          params[key] = value;
        }
      }
      return params;
    },
    objectCast: function objectCast(obj, ClassFunction) {
      if (!obj || !ClassFunction) return obj;

      var nc = new ClassFunction();
      Object.assign(nc, obj);
      return nc;
    },
    arrayCast: function arrayCast(array, ClassFunction) {
      if (!array || !ClassFunction) return array;

      array.forEach(function (v, i, arr) {
        var nc = new ClassFunction();
        Object.assign(nc, array[i]);
        arr[i] = nc;
      });
      return array;
    },
    listMatch: function listMatch(listA, listB, indexA) {
      var equalFunction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (i1, i2) {
        return i1 == i2;
      };
      var startIndexB = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

      if (!listA || !listB) return -1;

      if (listA == listB) return indexA;

      function compareNeighbor(indexB, offset) {
        var nia = indexA + offset;
        var nib = indexB + offset;
        var equal = void 0;
        if (nia < 0 || nia >= listA.length) equal = 2;else if (nib < 0 || nib >= listB.length) equal = 1;else equal = equalFunction(listA[nia], listB[nib]) ? 3 : 0;
        return equal;
      }

      var itemA = listA[indexA];

      var equalSet = listB.slice(startIndexB).map(function (e, i) {
        return equalFunction(e, itemA) ? i : -1;
      }).filter(function (e) {
        return e >= 0;
      });
      if (equalSet.length <= 0) return -1;

      var result = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = equalSet[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var i = _step.value;

          var leftEqual = compareNeighbor(i, -1) + 0.5;
          var rightEqual = compareNeighbor(i, 1);
          var weight = leftEqual + rightEqual;
          if (weight == 6.5) {
            return i;
          } else {
            result.push({
              index: i,
              weight: weight,
              distance: Math.abs(i - indexA)
            });
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

      var maxWeight = Math.max.apply(Math, _toConsumableArray(result.map(function (e) {
        return e.weight;
      })));
      var maxWeightSet = result.filter(function (e) {
        return e.weight == maxWeight;
      });

      if (maxWeightSet.length <= 1) return maxWeightSet[0].index;else {
        var _ret = function () {
          var minDistance = Math.min.apply(Math, _toConsumableArray(result.map(function (e) {
            return e.distance;
          })));
          return {
            v: maxWeightSet.find(function (e) {
              return e.distance == minDistance;
            }).index
          };
        }();

        if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
      }
    },
    listMatchWithNeighbour: function listMatchWithNeighbour(listA, listB, indexA) {
      var equalFunction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (i1, i2) {
        return i1 == i2;
      };
      var indexB = arguments[4];


      if (!listA || !listB) return -1;

      if (listA == listB) return indexA;

      if (indexA < 0 || indexA >= listA.length || listB.length < 2 || listA.length < 2) return -1;

      var indexBLeft = void 0,
          indexBRight = void 0,
          itemBLeft = void 0,
          itemBRight = void 0;
      var indexALeft = void 0,
          indexARight = void 0,
          itemALeft = void 0,
          itemARight = void 0;

      indexALeft = indexA - 1;
      indexARight = indexA + 1;

      if (indexALeft < 0) {
        indexBRight = 1;
        itemARight = listA[indexARight];
        itemBRight = listB[indexBRight];
        return equalFunction(itemARight, itemBRight) ? indexBRight - 1 : -1;
      }

      if (indexARight >= listA.length) {
        indexBLeft = listB.length - 2;
        itemALeft = listA[indexALeft];
        itemBLeft = listB[indexBLeft];
        return equalFunction(itemALeft, itemBLeft) ? indexBLeft + 1 : -1;
      }

      itemALeft = listA[indexALeft];
      itemARight = listA[indexARight];

      var i = -1;
      while (true) {
        i = listB.slice(i + 1).findIndex(function (e) {
          return equalFunction(e, itemALeft);
        });

        if (i < 0) {
          indexBRight = 1;
          itemBRight = listB[indexBRight];
          return equalFunction(itemARight, itemBRight) ? indexBRight - 1 : -1;
        }

        indexBRight = i + 2;

        if (indexBRight >= listB.length) {
          return i + 1 < listB.length ? i + 1 : -1;
        }

        itemBRight = listB[indexBRight];
        if (equalFunction(itemARight, itemBRight)) {
          return i + 1;
        }
      }
    },
    saveTextData: function saveTextData(key, data) {
      var onlyCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (!key || !data) return Promise.reject(new Error("Illegal args"));
      if (window.requestFileSystem) {
        return fileSystem.saveTextToFile(key, data, onlyCache);
      } else {
        var s = onlyCache ? sessionStorage : localStorage;
        s.setItem(key, data);
        return Promise.resolve();
      }
    },
    saveData: function saveData(key, data) {
      var onlyCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (!key || !data) return Promise.reject(new Error("Illegal args"));

      data = JSON.stringify(data);
      return this.saveTextData(key, data, onlyCache);
    },
    loadData: function loadData(key) {
      var onlyCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!key) return Promise.reject(new Error("Illegal args"));

      if (window.requestFileSystem) return fileSystem.loadTextFromFile(key, onlyCache).then(function (data) {
        return JSON.parse(data);
      });else {
        var s = onlyCache ? sessionStorage : localStorage;
        var data = s.getItem(key);
        data = JSON.parse(data);
        return Promise.resolve(data);
      }
    },
    removeData: function removeData(key) {
      var onlyCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!key) return Promise.reject(new Error("Illegal args"));

      if (window.requestFileSystem) {
        return fileSystem.removePath(key, onlyCache);
      } else {
        var s = onlyCache ? sessionStorage : localStorage;
        if (key[key.length - 1] == "/") {
          var pattern = new RegExp("^" + key);
          for (var key in s) {
            if (key.match(pattern)) delete s[key];
          }
        } else s.removeItem(key);
        return Promise.resolve();
      }
    },
    dataExists: function dataExists(key) {
      var onlyCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (window.requestFileSystem) {
        return fileSystem.fileExists(key, onlyCache);
      } else {
        var s = onlyCache ? sessionStorage : localStorage;
        return Promise.resolve(key in s);
      }
    },
    arrayCount: function arrayCount(array) {
      if (!array) return array;
      var counter = {};
      array.forEach(function (m) {
        if (!(m in counter)) counter[m] = 1;else counter[m] += 1;
      });
      var result = [];
      for (var k in counter) {
        result.push([k, counter[k]]);
      }
      result.sort(function (e1, e2) {
        return e2[1] - e1[1];
      });
      return result;
    },
    addEventSupport: function addEventSupport(obj) {
      obj.__events = {};
      obj.addEventListener = addEventListener.bind(obj);
      obj.fireEvent = fireEvent.bind(obj);
      obj.removeEventListener = removeEventListener.bind(obj);

      function addEventListener(eventName, handler) {
        var runonce = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (!eventName || !handler) return;
        if (!(eventName in this.__events)) this.__events[eventName] = [];
        this.__events[eventName].push({ handler: handler, runonce: runonce });
      }

      function fireEvent(eventName) {
        var _this2 = this;

        var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (!eventName) return;

        if (!("currentTarget" in e)) e.currentTarget = this;
        if (!("target" in e)) e.target = this;
        e.stopPropagation = function () {
          e.__stopPropagation = true;
        };

        var __onevent = "__on" + eventName[0].toUpperCase() + eventName.substring(1);
        if (__onevent in this) this[__onevent](e);

        if (eventName in this.__events) {
          (function () {
            var removeList = [];
            var handlers = _this2.__events[eventName];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = handlers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var eh = _step2.value;

                if (!eh) continue;
                try {
                  if (e.__stopPropagation) break;
                  if (eh.runonce) removeList.push(eh);
                  eh.handler(e);
                } catch (error) {
                  console.error(error);
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

            removeList.forEach(function (e) {
              return handlers.splice(handlers.indexOf(e), 1);
            });
          })();
        }

        var onevent = "on" + eventName[0].toUpperCase() + eventName.substring(1);
        if (onevent in this) this[onevent](e);
      }

      function removeEventListener(eventName, handler) {
        if (!eventName || !handler) return;
        if (eventName in this.__events) {
          var i = this.__events[eventName].findIndex(function (m) {
            return m.handler == handler;
          });
          if (i >= 0) this.__events[eventName].splice(i, 1);
        }
      }
    },
    persistent: function persistent(o) {
      function __persistent(obj) {
        switch (typeof obj === "undefined" ? "undefined" : _typeof(obj)) {
          case "object":
            if (Array.prototype.isPrototypeOf(obj)) {
              var children = [];
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = obj[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var v = _step3.value;

                  var value = __persistent(v);
                  if (value !== undefined) children.push(value);
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

              return '[' + children.join(",") + ']';
            } else if (obj == null) {
              return "null";
            } else {

              var persistentInclude = obj.constructor.persistentInclude;
              var keys = null;
              if (persistentInclude != undefined && Array.prototype.isPrototypeOf(persistentInclude)) {
                keys = persistentInclude;
              } else keys = Object.getOwnPropertyNames(obj);

              var _children = [];
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                for (var _iterator4 = keys[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var k = _step4.value;

                  var _value = __persistent(obj[k]);
                  if (_value !== undefined) _children.push("\"" + k + "\":" + _value);
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

              return '{' + _children.join(",") + '}';
            }
            break;

          case "function":
            return undefined;
          case "number":
            return obj;
          case "undefined":
            return undefined;
          case "boolean":
            return obj;
          default:
            return JSON.stringify(obj);
        }
      }
      return __persistent(o);
    },
    isPointInRect: function isPointInRect(rect, point) {
      if (!point || !rect) return false;
      var x = point.x || point.X;
      var y = point.y || point.Y;

      if (y > rect.top && y < rect.bottom && x > rect.left && x < rect.right) return true;
      return false;
    }
  };
});
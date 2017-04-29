'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

define(function () {
  "use strict";

  return {
    DEBUG: true,

    type: function type(obj) {
      var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
      if (type != 'object') return type;
      return obj.constructor.name.toLowerCase();
    },
    log: function log(content, detailContent) {
      var msg = '[' + new Date().toLocaleString() + '] ' + content + (detailContent ? ': ' + detailContent : '');
      console.log(msg);
    },
    error: function error(content, detailContent) {
      var msg = '[' + new Date().toLocaleString() + '] ' + content + (detailContent ? ': ' + detailContent : '');
      console.error(msg);
    },
    __urlJoin: function __urlJoin(url, params) {

      if (!params) return url;

      var r = [];
      for (var k in params) {
        r.push(k + '=' + params[k]);
      };

      if (r.length <= 0) return url;

      params = r.join("&");

      var i = url.indexOf("?");
      if (i == -1) return url + '?' + params;else if (i < url.length - 1) return url + '&' + params;else return '' + url + params;
    },
    get: function get(url, params, dataType) {
      var _this = this;

      var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
          _ref$timeout = _ref.timeout,
          timeout = _ref$timeout === undefined ? 5 : _ref$timeout;

      return new Promise(function (resolve, reject) {
        if (!url) return reject(new Error("url is null"));

        url = _this.__urlJoin(url, params);

        _this.log('Get: ' + url);

        url = encodeURI(url);

        var request = new XMLHttpRequest();
        request.open("GET", url);

        request.timeout = timeout * 1000;

        switch (dataType) {
          case "json":
          case "JSON":
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
          _this.error('Fail to get: ' + url + ', \u7F51\u7EDC\u8D85\u65F6');
          reject(new Error("Request Timeout"));
        };

        request.onabort = function () {
          _this.error('Fail to get: ' + url + ', \u4F20\u8F93\u4E2D\u65AD');
          reject(new Error("Request Abort"));
        };

        request.onerror = function () {
          _this.error("Fail to get: " + url + ", 网络错误");
          reject(new Error("Request Error"));
        };

        request.send(null);
      });
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
    html2text: function html2text(html) {

      function replaceElement(html, element, replaceString) {
        var pattern = '<' + element + '(?: [^>]*?)?>[\\s\u3000]*([\\s\\S]*?)[\\s\u3000]*</' + element + '>';
        html = html.replace(new RegExp(pattern, 'gi'), replaceString);
        return html;
      };

      if (!html) return html;

      html = html.replace(/&nbsp;/gi, ' ');

      var temp = html.replace(/\s*(<br ?\/?>\s*){2,}/gi, '\n');
      if (temp.search(/\s*<br ?\/?>\s*/) >= 0) html = html.replace(/\s*<br ?\/?>\s*/gi, '\n');else html = temp;

      html = replaceElement(html, 'p', '$1\n');
      html = replaceElement(html, 'span', '$1');
      html = replaceElement(html, 'b', '$1');
      html = replaceElement(html, 'i', '$1');

      html = html.replace(/<(\\w+)( [^>]*?)?>[\\s\\S]*?<\/$1>/gi, '');
      html = html.replace(/<\\w+([^>]*?)?>/gi, '');
      return html.trim();
    },
    text2html: function text2html(text, className) {
      if (!text) return text;

      var pStart = className ? '<p class="' + className + '">' : '<p>';
      var lines = text.split("\n").map(function (line) {
        return '' + pStart + line.replace(/ /g, '&nbsp;') + '</p>';
      });
      return lines.join('\n');
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

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
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
    __convertFileName: function __convertFileName(file) {
      return file.replace(/[\\:*?"<>|/]/g, "");
    },
    __saveTextToFile: function __saveTextToFile(file, data) {
      var isCacheDir = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      file = this.__convertFileName(file);

      return new Promise(function (resolve, reject) {
        function createAndWriteFile() {
          var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;

          window.requestFileSystem(fileSystem, 0, function (fs) {
            fs.root.getFile(file + ".json", { create: true, exclusive: false }, function (fileEntry) {
              var dataObj = new Blob([data], { type: 'text/plain' });

              writeFile(fileEntry, dataObj);
            }, reject);
          }, reject);
        }

        function writeFile(fileEntry, dataObj) {
          fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function () {};

            fileWriter.onerror = function (e) {};

            fileWriter.write(dataObj);
            resolve();
          });
        }
        createAndWriteFile();
      });
    },
    __loadTextFromFile: function __loadTextFromFile(file) {
      var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      file = this.__convertFileName(file);

      return new Promise(function (resolve, reject) {
        function handleError() {
          resolve(null);
        }
        function readFile() {
          var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;

          window.requestFileSystem(fileSystem, 0, function (fs) {
            fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
              fileEntry.file(function (file) {
                var reader = new FileReader();

                reader.onloadend = function () {
                  resolve(this.result);
                };

                reader.readAsText(file);
              }, handleError);
            }, handleError);
          }, reject);
        }

        readFile();
      });
    },
    __fileExists: function __fileExists(file) {
      var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      file = this.__convertFileName(file);

      return new Promise(function (resolve, reject) {
        var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;
        window.requestFileSystem(fileSystem, 0, function (fs) {

          fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
            resolve(fileEntry.isFile ? true : false);
          }, function () {
            return resolve(false);
          });
        }, function () {
          return resolve(false);
        });
      });
    },
    __removeFile: function __removeFile(file) {
      var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return new Promise(function (resolve, reject) {
        var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;
        window.requestFileSystem(fileSystem, 0, function (fs) {

          fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
            return fileEntry.remove(resolve, reject);
          }, reject);
        }, reject);
      });
    },
    saveTextData: function saveTextData(key, data) {
      var onlyCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (!key || !data) return Promise.reject(new Error("Illegal args"));
      if (window.requestFileSystem) {
        return this.__saveTextToFile(key, data, onlyCache);
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

      if (window.requestFileSystem) return this.__loadTextFromFile(key, onlyCache).then(function (data) {
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
        return this.__removeFile(key, onlyCache);
      } else {
        var s = onlyCache ? sessionStorage : localStorage;
        var data = s.removeItem(key);
        return Promise.resolve();
      }
    },
    dataExists: function dataExists(key) {
      var onlyCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (window.requestFileSystem) {
        return this.__fileExists(key, onlyCache);
      } else {
        var s = onlyCache ? sessionStorage : localStorage;
        return Promise.resolve(key in s);
      }
    },
    stripString: function stripString(str) {
      if (!str) return str;

      str = str.replace(/（.*?）/g, '');
      str = str.replace(/\(.*?\)/g, '');
      str = str.replace(/【.*?】/g, '');

      str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');

      str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

      str = str.replace(/\s/g, '');
      return str;
    },
    arrayCount: function arrayCount(array) {
      if (!array) return array;
      var counter = {};
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = array[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var m = _step2.value;

          if (!(m in counter)) counter[m] = 1;else counter[m] += 1;
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

      var result = [];
      for (var k in counter) {
        result.push([k, counter[k]]);
      }
      result.sort(function (e1, e2) {
        return e2[1] - e1[1];
      });
      return result;
    },
    persistent: function persistent(o) {
      function __persistent(obj) {
        switch (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) {
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
                  if (value != undefined) children.push(value);
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
                  if (_value != undefined) _children.push('"' + k + '":' + _value);
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
    }
  };
});
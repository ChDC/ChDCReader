"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

define(["jquery"], function ($) {
    "use strict";

    return {
        DEBUG: true,

        storage: {
            getItem: function getItem(keyName) {
                return JSON.parse(localStorage.getItem(keyName));
            },
            setItem: function setItem(keyName, keyValue) {
                return localStorage.setItem(keyName, typeof keyValue == "string" ? keyValue : JSON.stringify(keyValue));
            },
            hasItem: function hasItem(keyName) {
                return keyName in localStorage;
            },
            removeItem: function removeItem(keyName) {
                return localStorage.removeItem(keyName);
            }
        },

        cacheStorage: {
            getItem: function getItem(keyName) {
                return JSON.parse(sessionStorage.getItem(keyName));
            },
            setItem: function setItem(keyName, keyValue) {
                return sessionStorage.setItem(keyName, JSON.stringify(keyValue));
            },
            hasItem: function hasItem(keyName) {
                return keyName in sessionStorage;
            },
            removeItem: function removeItem(keyName) {
                return localStorage.removeItem(keyName);
            }
        },
        log: function log(content, detailContent) {
            var msg = "[" + new Date().toLocaleString() + "] " + content + (detailContent ? ": " + detailContent : '');
            console.log(msg);
        },
        error: function error(content, detailContent) {
            var msg = "[" + new Date().toLocaleString() + "] " + content + (detailContent ? ": " + detailContent : '');
            console.error(msg);
        },
        __getParamsString: function __getParamsString(params) {
            if (!params) return "";
            var r = "";
            for (var k in params) {
                r += k + "=" + params[k] + "&";
            };
            return r.substring(0, r.length - 1);
        },
        showMessage: function showMessage(msg) {
            var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
            var level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            if (!msg) return;

            var msgBoxContainer = $('<div class="message-box-container"></div>');
            var msgBox = $('<div class="message-box"></div>');
            switch (level) {
                case "error":
                    msgBox.css("color", "red");
                    break;
                case "info":
                    break;
                case "debug":
                    break;
                default:
                    break;
            }
            msgBox.text(msg);
            msgBoxContainer.append(msgBox);
            $(document.body).append(msgBoxContainer);
            msgBoxContainer.fadeIn().delay(delay).fadeOut("", function () {
                return msgBoxContainer.remove();
            });
        },
        showError: function showError(msg, delay) {
            if (msg) this.showMessage(msg, delay, 'error');
        },
        showMessageDialog: function showMessageDialog(title, msg, ok, cancel) {
            var dialog = $('<div class="modal fade" id="modalMessage">' + '    <div class="modal-dialog">' + '      <div class="modal-content">' + '        <div class="modal-header">' + '          <h4 class="modal-title">' + '          </h4>' + '        </div>' + '        <div class="modal-body">' + '          <p class="modal-message"></p>' + '        </div>' + '        <div class="modal-footer">' + '          <button type="button" class="btn btn-default" btnCancel data-dismiss="modal">' + '            取消' + '          </button>' + '          <button type="button" class="btn btn-primary btnOK" data-dismiss="modal">' + '          确定' + '          </button>' + '        </div>' + '      </div>' + '    </div>' + '  </div>');
            debugger;

            $(document.body).append(dialog);
            dialog.find('.btnOk').click(ok);
            dialog.find('.btnCancel').click(cancel);
            dialog.find('.modal-title').text(title);
            dialog.find('.modal-message').text(msg);
            dialog.modal('show');
        },
        get: function get(url, params, dataType) {
            var _this = this;

            var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
                _ref$timeout = _ref.timeout,
                timeout = _ref$timeout === undefined ? 5 : _ref$timeout;

            if (url == null) {
                return Promise.reject();
            }

            this.log("Get:" + url + "&" + this.__getParamsString(params));

            var getPromise = new Promise(function (resolve, reject) {
                url = encodeURI(url);
                $.get(url, params, resolve, dataType).fail(function (data) {
                    return reject(data);
                });
            });

            if (timeout <= 0) return getPromise;

            var timeoutPromise = new Promise(function (resolve, reject) {
                setTimeout(reject, timeout * 1000);
            });

            return Promise.race([getPromise, timeoutPromise]).catch(function (error) {
                _this.error("Fail to get: " + url + ", 网络错误");
                throw error;
            });
        },
        getJSON: function getJSON(url, params) {
            return this.get(url, params, "json");
        },
        __filterElement: function __filterElement(html, element) {
            var endElement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : element;

            var pattern = "<" + element + "( [^>]*?)?>[\\s\\S]*?</" + endElement + ">";
            html = html.replace(new RegExp(pattern, 'gi'), '');

            pattern = "<" + element + "( [^>]*?)?>";
            html = html.replace(new RegExp(pattern, 'gi'), '');
            return html;
        },
        getDOM: function getDOM(url, params) {
            var _this2 = this;

            var filterHtmlContent = function filterHtmlContent(html) {
                var m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
                if (m && m.length >= 2) html = m[1];

                html = _this2.__filterElement(html, "script");
                html = _this2.__filterElement(html, "iframe");
                html = _this2.__filterElement(html, "link");
                html = _this2.__filterElement(html, "meta");

                html = html.replace(/\bsrc=(?=["'])/gi, "data-src=");
                return html;
            };

            return this.get(url, params).then(function (data) {
                return "<div>" + filterHtmlContent(data) + "</div>";
            });
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
        format: function format(string, object) {
            var result = string.replace(/{(\w+)}/g, function (p0, p1) {
                return p1 in object ? object[p1] : "";
            });
            return result;
        },
        getDataFromObject: function getDataFromObject(obj, key) {
            var keys = key.split(/\./);
            var result = obj;
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if ($.type(result) == 'array') {
                    var tmp = [];
                    for (var j = 0; j < result.length; j++) {
                        var tt = result[j][k];
                        if ($.type(tt) == 'array') {
                            tmp = tmp.concat(tt);
                        } else {
                            tmp.push(tt);
                        }
                    }
                    result = tmp;
                } else {
                    result = result[k];
                }
            }
            return result;
        },
        fixurl: function fixurl(url, host) {
            if (!url || url.match("^https?://")) return url;
            if (url.match("^//")) {
                url = "http:" + url;
            } else if (url.match("^javascript:")) {
                url = "";
            } else if (url.match("^/")) {
                var i = host.search(/[^\/]\/[^\/]/);
                if (i >= 0) {
                    url = host.substring(0, i + 1) + url;
                }
            } else {
                var _i = host.lastIndexOf("?");
                if (_i >= 0) {
                    host = host.substring(0, _i);
                }
                _i = host.lastIndexOf("/");
                if (_i >= 0) {
                    host = host.substring(0, _i + 1);
                }
                url = host + url;
            }
            return url;
        },
        html2text: function html2text(html) {
            function replaceElement(html, element, replaceString) {
                var pattern = "<" + element + "(?: [^>]*?)?>[s\u3000]*([\\s\\S]*?)[s\u3000]*</" + element + ">";
                html = html.replace(new RegExp(pattern, 'gi'), replaceString);
                return html;
            };
            if (!html) return '';

            html = html.replace(/&nbsp;/gi, ' ');

            var temp = html.replace(/\s*(<br ?\/?>\s*){2,}/gi, '\n');
            if (temp.search(/\s*<br ?\/?>\s*/) >= 0) html = html.replace(/\s*<br ?\/?>\s*/gi, '\n');else html = temp;

            html = replaceElement(html, 'p', '$1\n');
            html = replaceElement(html, 'span', '$1');

            html = this.__filterElement(html, "(\\w+)", "$1");
            return html.trim();
        },
        text2html: function text2html(text, className) {
            var html = "";
            var pStart = className ? "<p class=\"" + className + "\">" : '<p>';
            var lines = text.split("\n");

            lines.forEach(function (line) {
                line = line.replace(/ /g, '&nbsp;');
                html += pStart + line + '</p>';
            });
            return html;
        },
        objectCast: function objectCast(obj, ClassFunction) {
            var nc = new ClassFunction();
            Object.assign(nc, obj);
            return nc;
        },
        __arrayIndex: function __arrayIndex(array, item) {
            var compareFuntion = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (i1, i2) {
                return i1 == i2;
            };
            var startIndex = arguments[3];

            startIndex = startIndex || 0;

            for (var i = startIndex; i < array.length; i++) {
                if (compareFuntion(array[i], item)) return i;
            }
            return -1;
        },
        arrayLastIndex: function arrayLastIndex(array, item) {
            var compareFuntion = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (i1, i2) {
                return i1 == i2;
            };
            var startIndex = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : array.length - 1;


            for (var i = startIndex; i >= 0; i--) {
                if (compareFuntion(array[i], item)) return i;
            }
            return -1;
        },
        arrayCast: function arrayCast(array, ClassFunction) {
            array.forEach(function (v, i, arr) {
                var nc = new ClassFunction();
                Object.assign(nc, array[i]);
                arr[i] = nc;
            });
        },
        arrayMaxIndex: function arrayMaxIndex(array) {
            var compareFuntion = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (i1, i2) {
                return i1 - i2;
            };

            var result = [0];
            if (!array || array.length <= 0) return result;
            var max = array[0];
            for (var i = 1; i < array.length; i++) {
                var r = compareFuntion(array[i], max);
                if (r > 0) {
                    result.length = 0;
                    result.push(i);
                    max = array[i];
                } else if (r == 0) {
                    result.push(i);
                }
            }
            return result;
        },
        arrayMinIndex: function arrayMinIndex(array) {
            var compareFuntion = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (a, b) {
                return b - a;
            };


            var result = [0];
            if (!array || array.length <= 0) return result;
            var min = array[0];
            for (var i = 1; i < array.length; i++) {
                var r = compareFuntion(array[i], min);
                if (r < 0) {
                    result.length = 0;
                    result.push(i);
                    min = array[i];
                } else if (r == 0) {
                    result.push(i);
                }
            }
            return result;
        },
        arrayRemove: function arrayRemove(array, index) {
            if (index < 0) return array;
            for (var i = index; i < array.length - 1; i++) {
                array[i] = array[i + 1];
            }
            array.length--;
            return array;
        },
        listMatch: function listMatch(listA, listB, indexA) {
            var equalFunction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (i1, i2) {
                return i1 - i2;
            };
            var startIndexB = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;


            if (listA == listB) return indexA;

            function compareNeighbor(indexB, offset) {
                var nia = indexA + offset;
                var nib = indexB + offset;
                var equal = 0;
                if (nia < 0 || nia >= listA.length) equal = 2;else if (nib < 0 || nib >= listB.length) equal = 1;else equal = equalFunction(listA[nia], listB[nib]) ? 3 : 0;
                return equal;
            }

            var result = [];
            var i = startIndexB - 1;

            var itemA = listA[indexA];

            while (true) {
                i = this.__arrayIndex(listB, itemA, equalFunction, i + 1);
                if (i < 0) {
                    if (result.length == 0) {
                        return -1;
                    }
                    var rr = this.arrayMaxIndex(result, function (a, b) {
                        return a.weight - b.weight;
                    });
                    if (rr.length <= 1) {
                        return result[rr[0]].index;
                    } else {
                        return result[this.arrayMinIndex(rr, function (a, b) {
                            var ia = result[a].index;
                            var ib = result[b].index;
                            return Math.abs(ia - indexA) - Math.abs(ib - indexA);
                        })[0]].index;
                    }
                    return -1;
                }

                var leftEqual = compareNeighbor(i, -1) + 0.5;
                var rightEqual = compareNeighbor(i, 1);
                var weight = leftEqual + rightEqual;
                if (weight == 6.5) {
                    return i;
                } else {
                    result.push({
                        index: i,
                        weight: weight
                    });
                }
            }
        },
        listMatchWithNeighbour: function listMatchWithNeighbour(listA, listB, indexA) {
            var equalFunction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (i1, i2) {
                return i1 == i2;
            };
            var indexB = arguments[4];

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
                i = this.__arrayIndex(listB, itemALeft, equalFunction, i + 1);
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
        objectSortedKey: function objectSortedKey(object) {
            var getFunctionOrObjectKeyName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (i) {
                return i;
            };

            if (typeof getFunctionOrObjectKeyName == 'string') {
                (function () {
                    var objectKeyName = getFunctionOrObjectKeyName;
                    getFunctionOrObjectKeyName = function getFunctionOrObjectKeyName(item) {
                        return item[objectKeyName];
                    };
                })();
            }

            var arr = [];
            for (var k in object) {
                arr.push([k, getFunctionOrObjectKeyName(object[k])]);
            }
            arr.sort(function (e1, e2) {
                return e1[1] - e2[1];
            });
            var result = [];
            for (var i = 0; i < arr.length; i++) {
                result[i] = arr[i][0];
            }
            return result;
        },
        __saveJSONToFile: function __saveJSONToFile(file, data) {
            var isCacheDir = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

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

                if (typeof data != "string") data = JSON.stringify(data);
                createAndWriteFile();
            });
        },
        __loadJSONFromFile: function __loadJSONFromFile(file) {
            var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return new Promise(function (resolve, reject) {
                function readFile() {
                    var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;

                    window.requestFileSystem(fileSystem, 0, function (fs) {
                        fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var reader = new FileReader();

                                reader.onloadend = function () {
                                    var data = JSON.parse(this.result);
                                    resolve(data);
                                };

                                reader.readAsText(file);
                            }, reject);
                        }, reject);
                    }, reject);
                }

                readFile();
            });
        },
        __fileExists: function __fileExists(file) {
            var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
        saveData: function saveData(key, data) {
            var onlyCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            if (window.requestFileSystem) {
                return this.__saveJSONToFile(key, data, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                s.setItem(key, data);
                return Promise.resolve();
            }
        },
        loadData: function loadData(key) {
            var onlyCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (window.requestFileSystem) {
                return this.__loadJSONFromFile(key, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                var data = s.getItem(key);
                return Promise.resolve(data);
            }
        },
        removeData: function removeData(key) {
            var onlyCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (window.requestFileSystem) {
                return this.__removeFile(key, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                var data = s.removeItem(key);
                return Promise.resolve();
            }
        },
        dataExists: function dataExists(key) {
            var onlyCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (window.requestFileSystem) {
                return this.__fileExists(key, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                return Promise.resolve(s.hasItem(key) ? true : false);
            }
        },
        stripString: function stripString(str) {
            str = str.replace(/（.*?）/g, '');
            str = str.replace(/\(.*?\)/g, '');
            str = str.replace(/【.*?】/g, '');

            str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');

            str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

            str = str.replace(/\s/g, '');
            return str;
        },

        LoadingBar: function LoadingBar() {
            var _this3 = this;

            var img = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'img/loadingm.gif';
            var container = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'body';

            this.__loadingbar = null;
            this.__img = img;
            this.container = container;

            this.show = function () {
                var loadingBg = $('<div style=z-index:1000000;position:fixed;width:100%;height:100%;text-align:center;background-color:#808080;opacity:0.5;top:0;"></div>');
                var img = $('<img src="' + _this3.__img + '" style="position:relative;opacity:1;"/>');
                loadingBg.append(img);

                loadingBg.click(function (event) {
                    _this3.hide();
                });
                _this3.__loadingbar = loadingBg;
                $(_this3.container).append(loadingBg);
                img.css('top', ($(window).height() - img.height()) / 2);
            };

            this.hide = function () {
                _this3.__loadingbar.remove();
            };
        },

        elementFind: function elementFind(element, selector) {
            return selector && element.querySelector(selector) || { getAttribute: function getAttribute(e) {
                    return "";
                }, textContent: "", html: "" };
        },
        persistent: function persistent(o) {
            function __persistent(obj) {
                switch (typeof obj === "undefined" ? "undefined" : _typeof(obj)) {
                    case "object":
                        if (Array.prototype.isPrototypeOf(obj)) {
                            var children = [];
                            var _iteratorNormalCompletion = true;
                            var _didIteratorError = false;
                            var _iteratorError = undefined;

                            try {
                                for (var _iterator = obj[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                    var v = _step.value;

                                    var value = __persistent(v);
                                    if (value != undefined) children.push(value);
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
                            var _iteratorNormalCompletion2 = true;
                            var _didIteratorError2 = false;
                            var _iteratorError2 = undefined;

                            try {
                                for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                    var k = _step2.value;

                                    var _value = __persistent(obj[k]);
                                    if (_value != undefined) _children.push("\"" + k + "\":" + _value);
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
                        return "\"" + obj + "\"";
                }
            }
            return __persistent(o);
        }
    };
});
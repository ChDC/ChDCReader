"use strict";

define(["jquery"], function ($) {
    "use strict";

    return {
        DEBUG: true,

        storage: {
            getItem: function getItem(keyName) {
                return JSON.parse(localStorage.getItem(keyName));
            },
            setItem: function setItem(keyName, keyValue) {
                return localStorage.setItem(keyName, JSON.stringify(keyValue));
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

        log: function log(content, content2) {
            var msg = "[" + new Date().toLocaleString() + "] " + content;
            if (content2) msg += ": " + content2;
            console.log(msg);
        },
        error: function error(content) {
            console.error("[" + new Date().toLocaleString() + "] " + content);
        },
        __getParamsString: function __getParamsString(params) {
            if (!params) return "";
            var r = "";
            for (var k in params) {
                r += k + "=" + params[k] + "&";
            };
            return r.substring(0, r.length - 1);
        },
        showMessage: function showMessage(msg, delay, level) {
            if (!msg) return;
            delay = delay || 1000;
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
            $('body').append(msgBoxContainer);
            msgBoxContainer.fadeIn().delay(delay).fadeOut("", function () {
                $(this).remove();
            });
        },
        showError: function showError(msg, delay) {
            if (msg) this.showMessage(msg, delay, 'error');
        },

        showMessageDialog: function showMessageDialog(title, msg, ok, cancel) {
            var dialog = $('<div class="modal fade" id="modalMessage">' + '    <div class="modal-dialog">' + '      <div class="modal-content">' + '        <div class="modal-header">' + '          <h4 class="modal-title">' + '          </h4>' + '        </div>' + '        <div class="modal-body">' + '          <p class="modal-message"></p>' + '        </div>' + '        <div class="modal-footer">' + '          <button type="button" class="btn btn-default" btnCancel data-dismiss="modal">' + '            取消' + '          </button>' + '          <button type="button" class="btn btn-primary btnOK" data-dismiss="modal">' + '          确定' + '          </button>' + '        </div>' + '      </div>' + '    </div>' + '  </div>');
            debugger;

            $('body').append(dialog);
            dialog.find('.btnOk').click(ok);
            dialog.find('.btnCancel').click(cancel);
            dialog.find('.modal-title').text(title);
            dialog.find('.modal-message').text(msg);
            dialog.modal('show');
        },

        get: function get(url, params, success, failure) {
            if (url == null) {
                if (failure) failure('null');
                return;
            }
            this.log("Get:" + url + "&" + this.__getParamsString(params));
            url = encodeURI(url);
            var self = this;
            function handleNetworkError(data) {
                self.error("Fail to get: " + url + ", 网络错误");

                if (failure) failure(data);
            }

            return $.get(url, params, success).fail(handleNetworkError);
        },

        __filterElement: function __filterElement(html, element, endElement) {
            endElement = endElement || element;
            var pattern = '<' + element + '( [^>]*?)?>[\\s\\S]*?</' + endElement + '>';
            html = html.replace(new RegExp(pattern, 'gi'), '');

            pattern = '<' + element + '( [^>]*?)?>';
            html = html.replace(new RegExp(pattern, 'gi'), '');
            return html;
        },
        getDOM: function getDOM(url, params, success, failure) {
            var self = this;
            function filterHtmlContent(html) {
                var m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
                if (m && m.length >= 2) html = m[1];

                html = self.__filterElement(html, "script");
                html = self.__filterElement(html, "iframe");
                html = self.__filterElement(html, "link");
                html = self.__filterElement(html, "meta");

                html = html.replace(/\bsrc=(?=["'])/gi, "data-src=");
                return html;
            };
            var s = function s(data) {
                var html = filterHtmlContent(data);
                success("<div>" + html + "</div>");
            };
            this.get(url, params, s, failure);
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
                if (p1 in object) return object[p1];
            });
            return result;
        },

        getDataFromObject: function getDataFromObject(obj, key) {
            var keys = key.split(/\./);
            var result = obj;
            for (var _i = 0; _i < keys.length; _i++) {
                var k = keys[_i];
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
                var _i2 = host.search(/[^\/]\/[^\/]/);
                if (_i2 >= 0) {
                    url = host.substring(0, _i2 + 1) + url;
                }
            } else {
                var _i3 = host.lastIndexOf("?");
                if (_i3 >= 0) {
                    host = host.substring(0, _i3);
                }
                _i3 = host.lastIndexOf("/");
                if (_i3 >= 0) {
                    host = host.substring(0, _i3 + 1);
                }
                url = host + url;
            }
            return url;
        },

        html2text: function html2text(html) {
            function replaceElement(html, element, replaceString) {
                var pattern = '<' + element + '(?: [^>]*?)?>[\s　]*([\\s\\S]*?)[\s　]*</' + element + '>';
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
            var pStart = className ? '<p class="' + className + '">' : '<p>';
            var lines = text.split("\n");

            for (var _i4 = 0; _i4 < lines.length; _i4++) {
                var line = lines[_i4];
                line = line.replace(/ /g, '&nbsp;');

                html += pStart + line + '</p>';
            }
            return html;
        },

        objectCast: function objectCast(obj, ClassFunction) {
            var nc = new ClassFunction();
            $.extend(true, nc, obj);
            return nc;
        },
        arrayIndex: function arrayIndex(array, item, compareFuntion, startIndex) {
            startIndex = startIndex || 0;
            compareFuntion = compareFuntion || function (i1, i2) {
                return i1 == i2;
            };

            for (var _i5 = startIndex; _i5 < array.length; _i5++) {
                if (compareFuntion(array[_i5], item)) return _i5;
            }
            return -1;
        },
        arrayLastIndex: function arrayLastIndex(array, item, compareFuntion, startIndex) {
            startIndex = startIndex || array.length - 1;
            compareFuntion = compareFuntion || function (i1, i2) {
                return i1 == i2;
            };
            for (var _i6 = startIndex; _i6 >= 0; _i6--) {
                if (compareFuntion(array[_i6], item)) return _i6;
            }
            return -1;
        },

        arrayCast: function arrayCast(array, ClassFunction) {
            for (var _i7 = 0; _i7 < array.length; _i7++) {
                var nc = new ClassFunction();
                $.extend(true, nc, array[_i7]);
                array[_i7] = nc;
            }
        },

        arrayMaxIndex: function arrayMaxIndex(array, compareFuntion) {
            compareFuntion = compareFuntion || function (a, b) {
                return a - b;
            };

            var result = [0];
            if (!array || array.length <= 0) return result;
            var max = array[0];
            for (var _i8 = 1; _i8 < array.length; _i8++) {
                var r = compareFuntion(array[_i8], max);
                if (r > 0) {
                    result.length = 0;
                    result.push(_i8);
                    max = array[_i8];
                } else if (r == 0) {
                    result.push(_i8);
                }
            }
            return result;
        },

        arrayMinIndex: function arrayMinIndex(array, compareFuntion) {
            compareFuntion = compareFuntion || function (a, b) {
                return b - a;
            };

            var result = [0];
            if (!array || array.length <= 0) return result;
            var min = array[0];
            for (var _i9 = 1; _i9 < array.length; _i9++) {
                var r = compareFuntion(array[_i9], min);
                if (r < 0) {
                    result.length = 0;
                    result.push(_i9);
                    min = array[_i9];
                } else if (r == 0) {
                    result.push(_i9);
                }
            }
            return result;
        },
        arrayRemove: function arrayRemove(array, index) {
            if (i < 0) return array;
            for (var _i10 = index; _i10 < array.length - 1; _i10++) {
                array[_i10] = array[_i10 + 1];
            }
            array.length--;
            return array;
        },

        listMatch: function listMatch(listA, listB, indexA, equalFunction, startIndexB) {
            equalFunction = equalFunction || function (i1, i2) {
                return i1 == i2;
            };

            if (listA == listB) return indexA;
            startIndexB = startIndexB || 0;

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
                i = this.arrayIndex(listB, itemA, equalFunction, i + 1);
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

        listMatchWithNeighbour: function listMatchWithNeighbour(listA, listB, indexA, equalFunction, indexB) {
            if (listA == listB) return indexA;
            equalFunction = equalFunction || function (i1, i2) {
                return i1 == i2;
            };

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
                i = this.arrayIndex(listB, itemALeft, equalFunction, i + 1);
                if (i < 0) {
                    _indexBRight = 1;
                    itemBRight = listB[_indexBRight];
                    return equalFunction(itemARight, itemBRight) ? _indexBRight - 1 : -1;
                }

                var _indexBRight = i + 2;

                if (_indexBRight >= listB.length) {
                    return i + 1 < listB.length ? i + 1 : -1;
                }

                itemBRight = listB[_indexBRight];
                if (equalFunction(itemARight, itemBRight)) {
                    return i + 1;
                }
            }
        },

        objectSortedKey: function objectSortedKey(object, getFunctionOrObjectKeyName) {
            if ($.type(getFunctionOrObjectKeyName) == 'string') {
                (function () {
                    var objectKeyName = getFunctionOrObjectKeyName;
                    getFunctionOrObjectKeyName = function getFunctionOrObjectKeyName(item) {
                        return item[objectKeyName];
                    };
                })();
            }
            getFunctionOrObjectKeyName = getFunctionOrObjectKeyName || function (item) {
                return item;
            };
            var arr = [];
            for (var k in object) {
                arr.push([k, getFunctionOrObjectKeyName(object[k])]);
            }
            arr.sort(function (e1, e2) {
                return e1[1] - e2[1];
            });
            var result = [];
            for (var _i11 = 0; _i11 < arr.length; _i11++) {
                result[_i11] = arr[_i11][0];
            }
            return result;
        },

        __saveJSONToFile: function __saveJSONToFile(file, data, success, fail, isCacheDir) {
            function createAndWriteFile() {
                var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;

                window.requestFileSystem(fileSystem, 0, function (fs) {
                    fs.root.getFile(file + ".json", { create: true, exclusive: false }, function (fileEntry) {
                        var dataObj = new Blob([data], { type: 'text/plain' });

                        writeFile(fileEntry, dataObj);
                    }, fail);
                }, fail);
            }

            function writeFile(fileEntry, dataObj) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function () {};

                    fileWriter.onerror = function (e) {};

                    fileWriter.write(dataObj);
                    if (success) success();
                });
            }

            data = JSON.stringify(data);
            createAndWriteFile();
        },

        __loadJSONFromFile: function __loadJSONFromFile(file, success, fail, isCacheDir) {
            function readFile() {
                var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;

                window.requestFileSystem(fileSystem, 0, function (fs) {
                    fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
                        fileEntry.file(function (file) {
                            var reader = new FileReader();

                            reader.onloadend = function () {
                                var data = JSON.parse(this.result);
                                if (success) success(data);
                            };

                            reader.readAsText(file);
                        }, fail);
                    }, fail);
                }, fail);
            }

            readFile();
        },

        __fileExists: function __fileExists(file, exist, notExist, isCacheDir) {
            var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;
            window.requestFileSystem(fileSystem, 0, function (fs) {

                fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
                    if (fileEntry.isFile) {
                        if (exist) exist();
                    } else {
                        if (notExist) notExist();
                    }
                }, notExist);
            }, notExist);
        },

        __removeFile: function __removeFile(file, success, fail, isCacheDir) {
            var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;
            window.requestFileSystem(fileSystem, 0, function (fs) {

                fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
                    fileEntry.remove(success, fail);
                }, fail);
            }, fail);
        },

        saveData: function saveData(key, data, success, fail, onlyCache) {
            if (window.requestFileSystem) {
                this.__saveJSONToFile(key, data, success, fail, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                s.setItem(key, data);
                if (success) success();
            }
        },

        loadData: function loadData(key, success, fail, onlyCache) {
            if (window.requestFileSystem) {
                this.__loadJSONFromFile(key, success, fail, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                var data = s.getItem(key);
                if (success) success(data);
            }
        },

        removeData: function removeData(key, success, fail, onlyCache) {
            if (window.requestFileSystem) {
                this.__removeFile(key, success, fail, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                var data = s.removeItem(key);
                if (success) success();
            }
        },

        dataExists: function dataExists(key, exist, notExist, onlyCache) {
            if (window.requestFileSystem) {
                this.__fileExists(key, exist, notExist, onlyCache);
            } else {
                var s = onlyCache ? this.cacheStorage : this.storage;
                if (s.hasItem(key)) {
                    if (exist) exist();
                } else {
                    if (notExist) notExist();
                }
            }
        }
    };
});
define(["jquery"], function($){
    "use strict"

    // init
    $.ajaxSetup({
        timeout : 3000 //超时时间设置，单位毫秒
    });

    // if (typeof cordovaHTTP != "undefined") {
    //     console.log("Set HTTP Header!");
    //     cordovaHTTP.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.4 Safari/537.36");
    // }

    return {
        /*
        * 开启调试模式
        */
        DEBUG: true,
        /**
         * 存储
         */
        storage: {
            getItem: function(keyName) {
                return JSON.parse(localStorage.getItem(keyName));
            },
            setItem: function(keyName, keyValue) {
                return localStorage.setItem(keyName, JSON.stringify(keyValue));
            },
            hasItem: function(keyName) {
                return keyName in localStorage;
            },
            removeItem: function(keyName) {
                return localStorage.removeItem(keyName);
            }
        },
        /**
         * 临时存储
         */
        cacheStorage: {
            getItem: function(keyName) {
                return JSON.parse(sessionStorage.getItem(keyName));
            },
            setItem: function(keyName, keyValue) {
                return sessionStorage.setItem(keyName, JSON.stringify(keyValue));
            },
            hasItem: function(keyName) {
                return keyName in sessionStorage;
            },
            removeItem: function(keyName) {
                return localStorage.removeItem(keyName);
            }
        },
        /*
        * 输出log 信息
        */
        log: function(content, content2) {
            var msg = "[" + (new Date()).toLocaleString() + "] " + content;
            if(content2)
                msg += ": " + content2;
            console.log(msg);
        },
        error: function(content) {
            console.error("[" + (new Date()).toLocaleString() + "] " + content);
        },
        __getParamsString: function(params){
          if(!params)
            return "";
          var r = "";
          for(var k in params){r+= k + "=" + params[k] + "&"};
          return r.substring(0, r.length-1);
        },
        showMessage: function(msg, delay, level){
            if(!msg)
                return;
            delay = delay || 1000;
            var msgBoxContainer = $('<div class="message-box-container"></div>')
            var msgBox = $('<div class="message-box"></div>');
            switch(level){
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
            msgBoxContainer.fadeIn().delay(delay).fadeOut("", function(){$(this).remove();});
        },
        showError: function(msg, delay){
            if(msg)
                this.showMessage(msg, delay, 'error');
        },

        showMessageDialog: function(title, msg, ok, cancel){
            var dialog = $(
    '<div class="modal fade" id="modalMessage">'
+ '    <div class="modal-dialog">'
+ '      <div class="modal-content">'
+ '        <div class="modal-header">'
+ '          <h4 class="modal-title">'
+ '          </h4>'
+ '        </div>'
+ '        <div class="modal-body">'
+ '          <p class="modal-message"></p>'
+ '        </div>'
+ '        <div class="modal-footer">'
+ '          <button type="button" class="btn btn-default" btnCancel data-dismiss="modal">'
+ '            取消'
+ '          </button>'
+ '          <button type="button" class="btn btn-primary btnOK" data-dismiss="modal">'
+ '          确定'
+ '          </button>'
+ '        </div>'
+ '      </div>'
+ '    </div>'
+ '  </div>');
            debugger;
            // TODO 失效后销毁
            // dialog.remove();
            $('body').append(dialog);
            dialog.find('.btnOk').click(ok);
            dialog.find('.btnCancel').click(cancel);
            dialog.find('.modal-title').text(title);
            dialog.find('.modal-message').text(msg);
            dialog.modal('show');
        },

        /*
        * 原始的获取 JSON url: 完整的 URL params: 参数 success: 成功调用的函数，第一个参数为 data 参数
        * failure: 失败调用的函数
        */
        get: function(url, params, success, failure) {
            if(url == null){
                if(failure)
                    failure('null');
                return;
            }
            this.log("Get:" + url + "&" + this.__getParamsString(params));
            url = encodeURI(url);
            var self = this;
            // TODO: 设置重试的次数
            function handleNetworkError(data) {
                self.error("Fail to get: " + url + ", 网络错误");
                // self.showError("网络错误！");
                if (failure) failure(data);
            }
            // if (typeof cordovaHTTP != "undefined") {
            //     this.log("HTTP with Cordova");
            //     var s = function(data) {
            //         if (data.status != 200) {
            //             handleNetworkError(data);
            //         } else {
            //             success(data.data);
            //         }
            //     };
            //     return cordovaHTTP.get(url, params, {},
            //     s, handleNetworkError);
            // } else {
                // this.log("HTTP with jQuery");
                return $.get(url, params, success).fail(handleNetworkError);
            // }
        },

        // 过滤某些标签
        __filterElement: function(html, element, endElement){
            endElement = endElement || element;
            var pattern = '<' + element + '( [^>]*?)?>[\\s\\S]*?</' + endElement  + '>';
            html = html.replace(new RegExp(pattern, 'gi'), '');
            // 去除单标签
            var pattern = '<' + element + '( [^>]*?)?>';
            html = html.replace(new RegExp(pattern, 'gi'), '');
            return html;
        },
        getDOM: function(url, params, success, failure){
            var self = this;
            function filterHtmlContent(html){
                // 只要 body
                var m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
                if(m && m.length >= 2)
                    html = m[1];
                // 去掉 script 标签
                html = self.__filterElement(html, "script");
                html = self.__filterElement(html, "iframe");
                html = self.__filterElement(html, "link");
                html = self.__filterElement(html, "meta");

                // 图片的 src 属性转换成 data-src 属性
                html = html.replace(/\bsrc=(?=["'])/gi, "data-src=");
                return html;
            };
            var s = function(data){
                var html = filterHtmlContent(data);
                success(html);
            }
            this.get(url, params, s, failure);
        },
        // 从 URL 字符串中获取参数对象
        getParamsFromURL: function(url){
            if(!url)return {};
            var i = url.indexOf("?");
            if(i < 0)return {};
            url = url.slice(i+1);
            var params = {};
            var pa = url.split("&");
            for(var j=0; j < pa.length; j++){
                var p = pa[j];
                i = p.indexOf("=");
                if(i < 0)
                    params[p] = undefined;
                else{
                    var key = p.slice(0, i);
                    var value = p.slice(i+1);
                    params[key] = value;
                }
            }
            return params;
        },
        // 字符串格式化，类似于 Python 的 string.format
        format: function(string, object){
            var result = string.replace(/{(\w+)}/g, function(p0, p1){
                if(p1 in object)
                    return object[p1];
            })
            return result;
        },
        // 从 Object 中获取数据
        getDataFromObject: function(obj, key){
            var keys = key.split(/\./);
            var result = obj;
            for(var i = 0; i < keys.length; i++){
                var k = keys[i];
                if($.type(result) == 'array'){
                    var tmp = [];
                    for(var j = 0; j < result.length; j++){
                        var tt = result[j][k];
                        if($.type(tt) == 'array'){
                            tmp = tmp.concat(tt);
                        }
                        else{
                            tmp.push(tt);
                        }
                    }
                    result = tmp;
                }
                else{
                    result = result[k];
                }
            }
            return result
        },
        // 修复抓取的 URL
        fixurl: function(url, host){
            if(!url)return url;
            if(url.match("^//")){
                url = "http:" + url;
            }
            else if(url.match("^javascript:")){
                url = "";
            }
            else if(url.match("^/")){
                var i = host.search(/[^\/]\/[^\/]/);
                if(i >= 0){
                    url = host.substring(0, i + 1) + url;
                }
            }
            return url;
        },

        html2text: function(html){
            function replaceElement(html, element, replaceString){
                var pattern = '<' + element + '(?: [^>]*?)?>[\s　]*([\\s\\S]*?)[\s　]*</' + element + '>';
                html = html.replace(new RegExp(pattern, 'gi'), replaceString);
                return html;
            };
            // 替换转义字符
            html = html.replace(/&nbsp;/gi, ' ');

            // 解决用双 <br> 标签换行的问题
            var temp = html.replace(/\s*(<br ?\/?>\s*){2,}/gi, '\n');
            if(temp.search(/\s*<br ?\/?>\s*/) >= 0)
                html = html.replace(/\s*<br ?\/?>\s*/gi, '\n');
            else
                html = temp;
            // 替换标签
            html = replaceElement(html, 'p', '$1\n');
            html = replaceElement(html, 'span', '$1');

            // 去掉所有标签
            html = this.__filterElement(html, "(\\w+)", "$1");
            return html.trim();
        },
        text2html: function(text, className){
            // 将每一行都加上 p 标签
            var html = "";
            var pStart = className? '<p class="' + className + '">' : '<p>';
            var lines = text.split("\n");

            for(var i = 0; i < lines.length; i++){
                var line = lines[i];
                line = line.replace(/ /g, '&nbsp;');

                html += pStart + line + '</p>';
            }
            return html;
        },
        // 将数组中的每个成员的类型都转换为执行的类
        objectCast: function(obj, ClassFunction){
            var nc = new ClassFunction();
            $.extend(true, nc, obj);
            return nc;
        },
        arrayIndex: function(array, item, compareFuntion, startIndex){
            startIndex = startIndex || 0;
            var compareFuntion = compareFuntion || function(i1, i2){
                return i1 == i2;
            }

            for(var i = startIndex; i < array.length; i++){
                if(compareFuntion(array[i], item))
                    return i;
            }
            return -1;
        },
        arrayLastIndex: function(array, item, compareFuntion, startIndex){
            startIndex = startIndex || array.length - 1;
            var compareFuntion = compareFuntion || function(i1, i2){
                return i1 == i2;
            }
            for(var i = startIndex; i >= 0; i--){
                if(compareFuntion(array[i], item))
                    return i;
            }
            return -1;
        },
        // 将数组中的每个成员的类型都转换为执行的类
        arrayCast: function(array, ClassFunction){
            for(var i = 0; i < array.length; i++){
                var nc = new ClassFunction();
                $.extend(true, nc, array[i]);
                array[i] = nc;
            }
        },
        // 返回数组中值最大的索引的集合
        arrayMaxIndex: function(array, compareFuntion){
            compareFuntion = compareFuntion || function(a, b){
                return a - b;
            }

            var result = [0];
            if(!array || array.length <= 0)
                return result;
            var max = array[0];
            for(var i = 1; i < array.length; i++){
                var r = compareFuntion(array[i], max);
                if(r > 0){
                    result.length = 0;
                    result.push(i);
                    max = array[i];
                }
                else if(r == 0){
                    result.push(i);
                }
            }
            return result;
        },
        // 返回数组中值最小的索引的集合
        arrayMinIndex: function(array, compareFuntion){
            compareFuntion = compareFuntion || function(a, b){
                return b - a;
            }

            var result = [0];
            if(!array || array.length <= 0)
                return result;
            var min = array[0];
            for(var i = 1; i < array.length; i++){
                var r = compareFuntion(array[i], min);
                if(r < 0){
                    result.length = 0;
                    result.push(i);
                    min = array[i];
                }
                else if(r == 0){
                    result.push(i);
                }
            }
            return result;
        },
        arrayRemove: function(array, index){
            if(i < 0)
                return array;
            for(var i = index; i < array.length - 1; i++){
                array[i] = array[i+1];
            }
            array.length--;
            return array;
        },
        // 从副列表中匹配查询主列表的元素的索引
        listMatch: function(listA, listB, indexA, equalFunction, startIndexB){
            equalFunction = equalFunction || function(i1, i2){return i1==i2;};

            if(listA == listB)
                return indexA;
            startIndexB = startIndexB || 0;

            // 比较前、后 n 个邻居
            function compareNeighbor(indexB, offset){
                var nia = indexA + offset;
                var nib = indexB + offset;
                var equal = 0;
                if(nia < 0 || nia >= listA.length)
                    // 如果 indexA 越界，则返回 2
                    equal = 2;
                else if(nib < 0 || nib >= listB.length)
                    // 如果 indexA 越界，则返回 1
                    equal = 1;
                else
                    // 如果两者相等，则返回 3
                    // 如果不相等则返回 0
                    equal = equalFunction(listA[nia], listB[nib]) ? 3 : 0;
                return equal;
            }

            // 提供最优结果
            // 最终从所有结果中选出一个最好的
            var result = [];
            var i = startIndexB - 1; //, j, r;

            var itemA = listA[indexA];

            while(true)
            {
                i = this.arrayIndex(listB, itemA, equalFunction, i+1);
                if(i < 0){
                    // 没找到结果
                    // 返回结果集合中的一个最优结果

                    // 最优结果：权值最大，并且索引值最靠近 indexA
                    if(result.length == 0){
                        // 一个结果也没有
                        return -1;
                    }
                    var rr = this.arrayMaxIndex(result, function(a, b){
                        return a.weight - b.weight;
                    });
                    if(rr.length <= 1){
                        return result[rr[0]].index;
                    }
                    else{
                        return result[this.arrayMinIndex(rr, function(a, b){
                            var ia = result[a].index;
                            var ib = result[b].index;
                            return Math.abs(ia-indexA) - Math.abs(ib-indexA);
                        })[0]].index;
                    }
                    return -1;
                }
                // 找到结果，开始分析
                // 比对前邻和后邻是否相同
                var leftEqual = compareNeighbor(i, -1) + 0.5; // 前面的权重大
                var rightEqual = compareNeighbor(i, 1);
                var weight = leftEqual + rightEqual;
                if(weight == 6.5){
                    // 前后两个邻居都相等
                    return i;
                }
                else{
                    result.push({
                        index: i,
                        weight: weight
                    });
                }
            }
        },
        // 通过判断章节上下两个邻居是否相同来判断当前章节是否相等
        listMatchWithNeighbour: function(listA, listB, indexA, equalFunction, indexB){
            if(listA == listB)
                return indexA;
            equalFunction = equalFunction || function(i1, i2){return i1==i2;};

            if(indexA < 0 || indexA >= listA.length || listB.length < 2 || listA.length < 2)
                return -1;

            var indexBLeft, indexBRight, itemBLeft, itemBRight;
            var indexALeft, indexARight, itemALeft, itemARight;

            indexALeft = indexA - 1;
            indexARight = indexA + 1;

            if(indexALeft < 0){
                // A 前面没有元素
                // 那就搜索后面的是否和头部匹配
                indexBRight = 1;
                itemARight = listA[indexARight];
                itemBRight = listB[indexBRight];
                return equalFunction(itemARight, itemBRight) ? indexBRight - 1 : -1;
            }

            if(indexARight >= listA.length){
                // A 到底部了
                // 那就搜索前面的是否和尾部匹配
                indexBLeft = listB.length - 2;
                itemALeft = listA[indexALeft];
                itemBLeft = listB[indexBLeft];
                return equalFunction(itemALeft, itemBLeft) ? indexBLeft + 1 : -1;
            }

            itemALeft = listA[indexALeft];
            itemARight = listA[indexARight]


            var i = -1; // startIndexB

            // 如果提供了 indexB 则使用
            while(true)
            {
                i = this.arrayIndex(listB, itemALeft, equalFunction, i+1);
                if(i < 0){
                    // 没找到结果
                    // 从前一个匹配不成功，表示listB 中没有匹配的前一个对象
                    // 则只检查开头
                    indexBRight = 1;
                    itemBRight = listB[indexBRight];
                    return equalFunction(itemARight, itemBRight) ? indexBRight - 1 : -1;
                }

                // 找到结果，开始分析
                // 比较后面第二个是否相同
                var indexBRight = i + 2;

                if(indexBRight >= listB.length){
                    // B 到底部了，直接返回
                    return (i + 1 < listB.length) ?  i + 1 : -1;
                }

                itemBRight = listB[indexBRight];
                if(equalFunction(itemARight, itemBRight)){
                    return i + 1;
                }
            }
        },

        // 适用于数组和对象的，返回按照指定数字降序排序的键值的数组
        objectSortedKey: function(object, getFunctionOrObjectKeyName){
            if($.type(getFunctionOrObjectKeyName) == 'string'){
                var objectKeyName = getFunctionOrObjectKeyName;
                getFunctionOrObjectKeyName = function(item){
                    return item[objectKeyName];
                }
            }
            getFunctionOrObjectKeyName = getFunctionOrObjectKeyName || function(item){
                return item;
            }
            var arr = [];
            for(var k in object){
                arr.push([k, getFunctionOrObjectKeyName(object[k])]);
            }
            arr.sort(function(e1, e2){return e1[1] - e2[1]});
            var result = [];
            for(var i = 0; i < arr.length; i++){
                result[i] = arr[i][0];
            }
            return result;
        },

        // 保存 JSON 对象到文件中
        __saveJSONToFile: function(file, data, success, fail, isCacheDir){
            //创建并写入文件
            function createAndWriteFile(){
                var fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
                //持久化数据保存
                window.requestFileSystem(fileSystem, 0,
                    function (fs) {
                        fs.root.getFile(file + ".json", { create: true, exclusive: false },
                            function (fileEntry) {
                                //文件内容
                                var dataObj = new Blob([data], { type: 'text/plain' });
                                //写入文件
                                writeFile(fileEntry, dataObj);

                            }, fail);

                    }, fail);
            }

            //将内容数据写入到文件中
            function writeFile(fileEntry, dataObj) {
                //创建一个写入对象
                fileEntry.createWriter(function (fileWriter) {

                    //文件写入成功
                    fileWriter.onwriteend = function() {
                    };

                    //文件写入失败
                    fileWriter.onerror = function (e) {
                    };

                    //写入文件
                    fileWriter.write(dataObj);
                    if(success)success();
                });
            }

            data = JSON.stringify(data);
            createAndWriteFile();
        },

        // 从文件中获取 JSON 对象
        __loadJSONFromFile: function(file, success, fail, isCacheDir){
            function readFile(){
                var fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
                //持久化数据保存
                window.requestFileSystem(fileSystem, 0,
                    function (fs) {
                        fs.root.getFile(file + ".json", { create: false, exclusive: false },
                            function (fileEntry) {
                                fileEntry.file(function (file) {
                                    var reader = new FileReader();

                                    reader.onloadend = function() {
                                        var data = JSON.parse(this.result);
                                        if(success)success(data);
                                    };

                                    reader.readAsText(file);

                                }, fail);
                            }, fail);

                    }, fail);
            }

            readFile();
        },

        // 检查文件是否存在
        __fileExists: function(file, exist, notExist, isCacheDir){
            var fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
            window.requestFileSystem(fileSystem, 0, function (fs) {

                fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
                        if(fileEntry.isFile){
                            if(exist)exist();
                        }
                        else{
                            if(notExist)notExist();
                        }
                    }, notExist);

            }, notExist);
        },
        // 删除文件
        __removeFile: function(file, success, fail, isCacheDir){
            // TODO
            var fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
            window.requestFileSystem(fileSystem, 0, function (fs) {

                fs.root.getFile(file + ".json", { create: false, exclusive: false }, function (fileEntry) {
                        debugger;
                        fileEntry.remove(success, fail);
                    }, fail);

            }, fail);
        },
        // 保存数据
        saveData: function(key, data, success, fail, onlyCache){
            if(window.requestFileSystem){
                this.__saveJSONToFile(key, data, success, fail, onlyCache);
            }
            else{
                var s = onlyCache? this.cacheStorage : this.storage;
                s.setItem(key, data);
                if(success)success();
            }
        },

        // 加载数据
        loadData: function(key, success, fail, onlyCache){
            if(window.requestFileSystem){
                this.__loadJSONFromFile(key, success, fail, onlyCache);
            }
            else{
                var s = onlyCache? this.cacheStorage : this.storage;
                var data = s.getItem(key);
                if(success)success(data);
            }
        },
        // 删除数据
        removeData: function(key, success, fail, onlyCache){
            if(window.requestFileSystem){
                this.__removeFile(key, success, fail, onlyCache);
            }
            else{
                var s = onlyCache? this.cacheStorage : this.storage;
                var data = s.removeItem(key);
                if(success)success();
            }
        },
        // 数据是否存在
        dataExists: function(key, exist, notExist, onlyCache){
            if(window.requestFileSystem){
                this.__fileExists(key, exist, notExist, onlyCache);
            }
            else{
                var s = onlyCache? this.cacheStorage : this.storage;
                if(s.hasItem(key)){
                    if(exist)exist();
                }
                else{
                    if(notExist)notExist();
                }
            }
        }
    };

});











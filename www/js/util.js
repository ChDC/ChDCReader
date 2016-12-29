define(["jquery"], function($){
    "use strict"

    // init
    // $.ajaxSetup({
    //     beforeSend: function(request) {
    //     request.setRequestHeader("User-Agent","Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.4 Safari/537.36");
    //     }
    // });

    if (typeof cordovaHTTP != "undefined") {
        cordovaHTTP.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.4 Safari/537.36");
    }

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
            this.showMessage(msg, delay, 'error');
        },
        /*
        * 原始的获取 JSON url: 完整的 URL params: 参数 success: 成功调用的函数，第一个参数为 data 参数
        * failure: 失败调用的函数
        */
        get: function(url, params, success, failure) {
            this.log("Get:" + url + "&" + this.__getParamsString(params));
            url = encodeURI(url);
            var self = this;
            function handleNetworkError(data) {
                self.error("Fail to getJSON: " + url + ", 网络错误");
                self.showMessage("网络错误！");
                if (failure) failure(data);
            }
            if (typeof cordovaHTTP != "undefined") {
                this.log("HTTP with Cordova");
                var s = function(data) {
                    self.log("Success" + data);
                    if (data.status != 200) {
                        handleNetworkError(data);
                    } else {
                        success(data.data);
                    }
                };
                return cordovaHTTP.get(url, params, {},
                s, handleNetworkError);
            } else {
                this.log("HTTP with jQuery");
                return $.get(url, params, success).fail(handleNetworkError);
            }
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
                var html = $(filterHtmlContent(data));
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

                line = "　　" + line;
                line = line.replace(/ /g, '&nbsp;');

                html += pStart + line + '</p>';
            }
            return html;
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
                $.extend(nc, array[i]);
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

        // 从副列表中匹配查询主列表的元素
        listMatch: function(listA, listB, indexA, equalFunction){
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
            var i, j, r;

            var itemA = listA[indexA];
            i = -1;

            while(true)
            {
                i = this.arrayIndex(listB, itemA, equalFunction, i+1);
                if(i < 0){
                    // 没找到结果
                    // 返回结果集合中的一个最优结果

                    // 最优结果：权值最大，并且索引值最靠近 indexA
                    if(result.length == 0)
                        return -1;
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
        }
    };

});











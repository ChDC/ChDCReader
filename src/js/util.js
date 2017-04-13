define(["jquery"], function($){
    "use strict"

    // init
    // $.ajaxSetup({
    //     timeout : 8000 //超时时间设置，单位毫秒
    // });

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
            getItem(keyName) {
                return JSON.parse(localStorage.getItem(keyName));
            },
            setItem(keyName, keyValue) {
                return localStorage.setItem(keyName,
                    typeof(keyValue) == "string" ? keyValue : JSON.stringify(keyValue));
            },
            hasItem(keyName) {
                return keyName in localStorage;
            },
            removeItem(keyName) {
                return localStorage.removeItem(keyName);
            }
        },
        /**
         * 临时存储
         */
        cacheStorage: {
            getItem(keyName) {
                return JSON.parse(sessionStorage.getItem(keyName));
            },
            setItem(keyName, keyValue) {
                return sessionStorage.setItem(keyName, JSON.stringify(keyValue));
            },
            hasItem(keyName) {
                return keyName in sessionStorage;
            },
            removeItem(keyName) {
                return localStorage.removeItem(keyName);
            }
        },
        /*
        * 输出log 信息
        */
        log(content, detailContent) {
            const msg = `[${(new Date()).toLocaleString()}] ${content}${detailContent ? `: ${detailContent}` : '' }`;
            console.log(msg);
        },
        error(content, detailContent) {
            const msg = `[${(new Date()).toLocaleString()}] ${content}${detailContent ? `: ${detailContent}` : '' }`;
            console.error(msg);
        },
        /*
        * 获取 URL 的参数字符串
        */
        __urlJoin(url, params){
            if(!params || params == {})
                return url;

            debugger;
            let r = []
            for(const k in params){
                r.push(`${k}=${params[k]}`)
            };
            params = r.join("&");

            let i = url.indexOf("?");
            if(i == -1)
                return `${url}?${params}`;
            else if(i < url.length - 1)
                return `${url}&${params}`;
            else
                return `${url}${params}`;
        },

        showMessage(msg, delay=1000, level=null){
            if(!msg)
                return;

            const msgBoxContainer = $('<div class="message-box-container"></div>')
            const msgBox = $('<div class="message-box"></div>');
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
            $(document.body).append(msgBoxContainer);
            msgBoxContainer.fadeIn().delay(delay).fadeOut("", () => msgBoxContainer.remove());
        },
        showError(msg, delay){
            if(msg)
                this.showMessage(msg, delay, 'error');
        },

        showMessageDialog(title, msg, ok, cancel){
            const dialog = $(
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
            $(document.body).append(dialog);
            dialog.find('.btnOk').click(ok);
            dialog.find('.btnCancel').click(cancel);
            dialog.find('.modal-title').text(title);
            dialog.find('.modal-message').text(msg);
            dialog.modal('show');
        },

        /*
        * 原始的获取 JSON
        * url: 完整的 URL
        * params: 参数
        */
        get(url, params, dataType, {timeout=5}={}) {
            if(url == null){
                return Promise.reject();
            }

            this.log(`Get: ${this.__urlJoin(url, params)}`);

            const getPromise = new Promise((resolve, reject) => {
                url = encodeURI(url);
                $.get(url, params, resolve, dataType)
                    .fail(data => reject(data));
            });

            if(timeout <= 0)
                return getPromise;

            const timeoutPromise = new Promise((resolve, reject) => {
                setTimeout(reject, timeout*1000);
            });

            return Promise.race([getPromise, timeoutPromise])
                .catch(error => {
                    this.error("Fail to get: " + url + ", 网络错误");
                    throw error;
                });

            // if (typeof cordovaHTTP != "undefined") {
            //     this.log("HTTP with Cordova");
            //     const s = function(data) {
            //         if (data.status != 200) {
            //             handleNetworkError(data);
            //         } else {
            //             success(data.data);
            //         }
            //     };
            //     return cordovaHTTP.get(url, params, {},
            //     s, handleNetworkError);
            // }
        },

        // 获取 JSON 格式
        getJSON(url, params){
            return this.get(url, params, "json");
        },

        // 过滤某些标签
        __filterElement(html, element, endElement=element){
            let pattern = `<${element}( [^>]*?)?>[\\s\\S]*?</${endElement}>`;
            html = html.replace(new RegExp(pattern, 'gi'), '');
            // 去除单标签
            pattern = `<${element}( [^>]*?)?>`;
            html = html.replace(new RegExp(pattern, 'gi'), '');
            return html;
        },

        getDOM(url, params){
            const filterHtmlContent = html => {
                // 只要 body
                const m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
                if(m && m.length >= 2)
                    html = m[1];
                // 去掉 script 标签
                html = this.__filterElement(html, "script");
                html = this.__filterElement(html, "iframe");
                html = this.__filterElement(html, "link");
                html = this.__filterElement(html, "meta");
                html = this.__filterElement(html, "style");

                // 图片的 src 属性转换成 data-src 属性
                html = html.replace(/\bsrc=(?=["'])/gi, "data-src=");
                return html;
            };


            return this.get(url, params)
                    .then(data => `<div>${filterHtmlContent(data)}</div>`);

        },

        // 从 URL 字符串中获取参数对象
        getParamsFromURL(url){
            if(!url)return {};
            let i = url.indexOf("?");
            if(i < 0)return {};
            url = url.slice(i+1);
            const params = {};
            const pa = url.split("&");
            for(let j=0; j < pa.length; j++){
                const p = pa[j];
                i = p.indexOf("=");
                if(i < 0)
                    params[p] = undefined;
                else{
                    const key = p.slice(0, i);
                    const value = p.slice(i+1);
                    params[key] = value;
                }
            }
            return params;
        },

        // 字符串格式化，类似于 Python 的 string.format
        format(string, object){
            const result = string.replace(/{(\w+)}/g, (p0, p1) =>
                    p1 in object ? object[p1] : ""
                )
            return result;
        },

        // 从 Object 中获取数据
        getDataFromObject(obj, key){
            const keys = key.split(/\./);
            let result = obj;
            for(let i = 0; i < keys.length; i++){
                const k = keys[i];
                if($.type(result) == 'array'){
                    let tmp = [];
                    for(let j = 0; j < result.length; j++){
                        const tt = result[j][k];
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
        fixurl(url, host){
            if(!url || url.match("^https?://"))
                return url;
            if(url.match("^//")){
                url = "http:" + url;
            }
            else if(url.match("^javascript:")){
                url = "";
            }
            else if(url.match("^/")){
                const i = host.search(/[^\/]\/[^\/]/);
                if(i >= 0){
                    url = host.substring(0, i + 1) + url;
                }
            }
            else{
                let i = host.lastIndexOf("?");
                if(i >= 0){
                    host = host.substring(0, i);
                }
                i = host.lastIndexOf("/");
                if(i >= 0){
                    host = host.substring(0, i+1);
                }
                url = host + url;
            }
            return url;
        },

        html2text(html){
            function replaceElement(html, element, replaceString){
                const pattern = `<${element}(?: [^>]*?)?>[\s　]*([\\s\\S]*?)[\s　]*</${element}>`;
                html = html.replace(new RegExp(pattern, 'gi'), replaceString);
                return html;
            };
            if(!html)
                return '';

            // 替换转义字符
            html = html.replace(/&nbsp;/gi, ' ');

            // 解决用双 <br> 标签换行的问题
            const temp = html.replace(/\s*(<br ?\/?>\s*){2,}/gi, '\n');
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

        text2html(text, className){
            // 将每一行都加上 p 标签
            let html = "";
            const pStart = className? `<p class="${className}">` : '<p>';
            const lines = text.split("\n");

            lines.forEach((line)=>{
                line = line.replace(/ /g, '&nbsp;');
                html += pStart + line + '</p>';
            });
            return html;
        },

        // 将数组中的每个成员的类型都转换为执行的类
        objectCast(obj, ClassFunction){
            const nc = new ClassFunction();
            Object.assign(nc, obj);
            return nc;
        },

        __arrayIndex(array, item, compareFuntion=(i1, i2) => i1 == i2, startIndex){
            startIndex = startIndex || 0;

            for(let i = startIndex; i < array.length; i++){
                if(compareFuntion(array[i], item))
                    return i;
            }
            return -1;
        },

        arrayLastIndex(array, item,
            compareFuntion = (i1, i2) => i1 == i2,
            startIndex = array.length - 1){

            for(let i = startIndex; i >= 0; i--){
                if(compareFuntion(array[i], item))
                    return i;
            }
            return -1;
        },

        // 将数组中的每个成员的类型都转换为执行的类
        arrayCast(array, ClassFunction){
            array.forEach((v, i, arr) => {
                const nc = new ClassFunction();
                Object.assign(nc, array[i]);
                arr[i] = nc;
            });
        },

        // 返回数组中值最大的索引的集合
        arrayMaxIndex(array, compareFuntion=(i1, i2) => i1 - i2){
            const result = [0];
            if(!array || array.length <= 0)
                return result;
            let max = array[0];
            for(let i = 1; i < array.length; i++){
                const r = compareFuntion(array[i], max);
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
        arrayMinIndex(array, compareFuntion=(a,b)=>b-a){

            const result = [0];
            if(!array || array.length <= 0)
                return result;
            let min = array[0];
            for(let i = 1; i < array.length; i++){
                const r = compareFuntion(array[i], min);
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

        arrayRemove(array, index){
            if(index < 0)
                return array;
            for(let i = index; i < array.length - 1; i++){
                array[i] = array[i+1];
            }
            array.length--;
            return array;
        },

        // 从副列表中匹配查询主列表的元素的索引
        listMatch(listA, listB, indexA,
            equalFunction=(i1,i2)=>i1-i2, startIndexB=0){

            if(listA == listB)
                return indexA;

            // 比较前、后 n 个邻居
            function compareNeighbor(indexB, offset){
                const nia = indexA + offset;
                const nib = indexB + offset;
                let equal = 0;
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
            const result = [];
            let i = startIndexB - 1; //, j, r;

            const itemA = listA[indexA];

            while(true)
            {
                i = this.__arrayIndex(listB, itemA, equalFunction, i+1);
                if(i < 0){
                    // 没找到结果
                    // 返回结果集合中的一个最优结果

                    // 最优结果：权值最大，并且索引值最靠近 indexA
                    if(result.length == 0){
                        // 一个结果也没有
                        return -1;
                    }
                    const rr = this.arrayMaxIndex(result, (a, b) => a.weight - b.weight);
                    if(rr.length <= 1){
                        return result[rr[0]].index;
                    }
                    else{
                        return result[this.arrayMinIndex(rr, (a, b) => {
                            const ia = result[a].index;
                            const ib = result[b].index;
                            return Math.abs(ia-indexA) - Math.abs(ib-indexA);
                        })[0]].index;
                    }
                    return -1;
                }
                // 找到结果，开始分析
                // 比对前邻和后邻是否相同
                const leftEqual = compareNeighbor(i, -1) + 0.5; // 前面的权重大
                const rightEqual = compareNeighbor(i, 1);
                const weight = leftEqual + rightEqual;
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
        listMatchWithNeighbour(listA, listB, indexA, equalFunction=(i1, i2)=>i1==i2, indexB){
            if(listA == listB)
                return indexA;

            if(indexA < 0 || indexA >= listA.length || listB.length < 2 || listA.length < 2)
                return -1;

            let indexBLeft, indexBRight, itemBLeft, itemBRight;
            let indexALeft, indexARight, itemALeft, itemARight;

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


            let i = -1; // startIndexB

            // 如果提供了 indexB 则使用
            while(true)
            {
                i = this.__arrayIndex(listB, itemALeft, equalFunction, i+1);
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
                indexBRight = i + 2;

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
        objectSortedKey(object, getFunctionOrObjectKeyName=i=>i){
            if(typeof getFunctionOrObjectKeyName == 'string'){
                const objectKeyName = getFunctionOrObjectKeyName;
                getFunctionOrObjectKeyName = item => item[objectKeyName];
            }

            const arr = [];
            for(const k in object){
                arr.push([k, getFunctionOrObjectKeyName(object[k])]);
            }
            arr.sort((e1, e2) => e1[1] - e2[1]);
            const result = [];
            for(let i = 0; i < arr.length; i++){
                result[i] = arr[i][0];
            }
            return result;
        },

        // 保存 JSON 对象到文件中
        __saveJSONToFile(file, data, isCacheDir=false){
            return new Promise((resolve, reject) => {
                // 创建并写入文件
                function createAndWriteFile(){
                    const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
                    //持久化数据保存
                    window.requestFileSystem(fileSystem, 0,
                        fs => {
                            fs.root.getFile(file + ".json", { create: true, exclusive: false },
                                fileEntry => {
                                    //文件内容
                                    const dataObj = new Blob([data], { type: 'text/plain' });
                                    //写入文件
                                    writeFile(fileEntry, dataObj);

                                }, reject);

                        }, reject);
                }

                //将内容数据写入到文件中
                function writeFile(fileEntry, dataObj) {
                    //创建一个写入对象
                    fileEntry.createWriter(fileWriter => {

                        //文件写入成功
                        fileWriter.onwriteend = () => { };

                        //文件写入失败
                        fileWriter.onerror = e => {};

                        //写入文件
                        fileWriter.write(dataObj);
                        resolve();
                    });
                }

                if(typeof(data) != "string")
                    data = JSON.stringify(data);
                createAndWriteFile();
            });
        },

        // 从文件中获取 JSON 对象
        __loadJSONFromFile(file, isCacheDir=false){
            return new Promise((resolve, reject) => {
                function readFile(){
                    const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
                    //持久化数据保存
                    window.requestFileSystem(fileSystem, 0,
                        fs => {
                            fs.root.getFile(file + ".json", { create: false, exclusive: false },
                                fileEntry => {
                                    fileEntry.file(file => {
                                        const reader = new FileReader();

                                        reader.onloadend = function(){
                                            const data = JSON.parse(this.result);
                                            resolve(data);
                                        };

                                        reader.readAsText(file);

                                    }, reject);
                                }, reject);

                        }, reject);
                }

                readFile();
            })
        },

        // 检查文件是否存在
        __fileExists(file, isCacheDir=false){
            return new Promise((resolve, reject) => {
                const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
                window.requestFileSystem(fileSystem, 0, fs => {

                    fs.root.getFile(file + ".json", { create: false, exclusive: false },
                        fileEntry => {
                            resolve(fileEntry.isFile ? true : false);
                        }, () => resolve(false));

                }, () => resolve(false));
            })
        },

        // 删除文件
        __removeFile(file, isCacheDir=false){
            return new Promise((resolve, reject) => {
                // TODO
                const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
                window.requestFileSystem(fileSystem, 0, fs => {

                    fs.root.getFile(file + ".json", { create: false, exclusive: false },
                            fileEntry => fileEntry.remove(resolve, reject)
                            , reject);
                }, reject);
            })
        },

        // 保存数据
        saveData(key, data, onlyCache=false){
            if(window.requestFileSystem){
                return this.__saveJSONToFile(key, data, onlyCache);
            }
            else{
                const s = onlyCache? this.cacheStorage : this.storage;
                s.setItem(key, data);
                return Promise.resolve();
            }
        },

        // 加载数据
        loadData(key, onlyCache=false){
            if(window.requestFileSystem){
                return this.__loadJSONFromFile(key, onlyCache);
            }
            else{
                const s = onlyCache? this.cacheStorage : this.storage;
                const data = s.getItem(key);
                return Promise.resolve(data);
            }
        },

        // 删除数据
        removeData(key, onlyCache=false){
            if(window.requestFileSystem){
                return this.__removeFile(key, onlyCache);
            }
            else{
                const s = onlyCache? this.cacheStorage : this.storage;
                const data = s.removeItem(key);
                return Promise.resolve();
            }
        },

        // 数据是否存在
        dataExists(key, onlyCache=false){
            if(window.requestFileSystem){
                return this.__fileExists(key, onlyCache);
            }
            else{
                const s = onlyCache? this.cacheStorage : this.storage;
                return Promise.resolve(s.hasItem(key) ? true : false);
            }
        },

        // 比较去掉所有空格和标点符号之后的所有符号
        stripString(str){
            // 去除括号括起来的文字
            str = str.replace(/（.*?）/g, '');
            str = str.replace(/\(.*?\)/g, '');
            str = str.replace(/【.*?】/g, '');

            // 去除英文字符串
            str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');
            // 去除中文字符串
            str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

            // 去除空白字符
            str = str.replace(/\s/g, '');
            return str;
        },

        // 加载进度条
        LoadingBar: function(img='img/loadingm.gif', container='body'){
            this.__loadingbar = null;
            this.__img = img;
            this.container = container;

            // 显示加载进度条
            this.show = () => {
                const loadingBg = $('<div style=z-index:1000000;position:fixed;width:100%;height:100%;text-align:center;background-color:#808080;opacity:0.5;top:0;"></div>')
                const img = $('<img src="' + this.__img + '" style="position:relative;opacity:1;"/>');
                loadingBg.append(img);

                loadingBg.click((event) => {
                    this.hide();
                });
                this.__loadingbar = loadingBg;
                $(this.container).append(loadingBg);
                img.css('top', ($(window).height() - img.height()) / 2);
            };

            // 隐藏加载进度条
            this.hide = () => {
                this.__loadingbar.remove();
            };
        },

        // 模拟 $.find 方法
        elementFind(element, selector){
            return selector && element.querySelector(selector) ||
                { getAttribute: e=> "", textContent: "", html: ""};
        },

        // 持久化数据
        persistent(o){
            function __persistent(obj){
                switch(typeof(obj)){
                    case "object":
                        if(Array.prototype.isPrototypeOf(obj))
                        {
                            let children = [];
                            for(let v of obj){
                                let value = __persistent(v);
                                if(value != undefined)
                                    children.push(value);
                            }
                            return '[' + children.join(",") + ']';
                        }
                        else if(obj == null){
                            return "null";
                        }
                        else{

                            let persistentInclude = obj.constructor.persistentInclude;
                            let keys = null;
                            if(persistentInclude != undefined && Array.prototype.isPrototypeOf(persistentInclude)){
                                keys = persistentInclude;
                            }
                            else
                                keys = Object.getOwnPropertyNames(obj);

                            let children = [];
                            for(let k of keys){
                                let value = __persistent(obj[k]);
                                if(value != undefined)
                                    children.push(`"${k}":${value}`);
                            }
                            return '{' + children.join(",") + '}';
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

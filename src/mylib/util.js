define(["jquery"], function($){
  "use strict"

  return {
    /*
    * 开启调试模式
    */
    DEBUG: true,

    type(obj){
      return $.type(obj);
    },

    /**
     * 存储
     */
    // storage: {
    //   getItem(keyName) {
    //     return localStorage.getItem(keyName);
    //   },
    //   setItem(keyName, keyValue) {
    //     return localStorage.setItem(keyName, keyValue);
    //   },
    //   hasItem(keyName) {
    //     return keyName in localStorage;
    //   },
    //   removeItem(keyName) {
    //     return localStorage.removeItem(keyName);
    //   }
    // },
    /**
     * 临时存储
     */
    // cacheStorage: {
    //   getItem(keyName) {
    //     return sessionStorage.getItem(keyName);
    //   },
    //   setItem(keyName, keyValue) {
    //     return sessionStorage.setItem(keyName, keyValue);
    //   },
    //   hasItem(keyName) {
    //     return keyName in sessionStorage;
    //   },
    //   removeItem(keyName) {
    //     return localStorage.removeItem(keyName);
    //   }
    // },
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

      if(!params)
        return url;

      let r = []
      for(const k in params){
        r.push(`${k}=${params[k]}`)
      };

      if(r.length <= 0)
        return url;

      params = r.join("&");

      let i = url.indexOf("?");
      if(i == -1)
        return `${url}?${params}`;
      else if(i < url.length - 1)
        return `${url}&${params}`;
      else
        return `${url}${params}`;
    },

    /*
    * 原始的 HTTP Get
    * url: 完整的 URL
    * params: 参数
    */
    // get(url, params, dataType, {timeout=5}={}) {
    //     if(url == null)return Promise.reject();

    //     this.log(`Get: ${this.__urlJoin(url, params)}`);

    //     const getPromise = new Promise((resolve, reject) => {
    //         url = encodeURI(url);
    //         $.get(url, params, resolve, dataType)
    //             .fail(data => reject(data));
    //     });

    //     if(timeout <= 0)
    //         return getPromise;

    //     const timeoutPromise = new Promise((resolve, reject) => {
    //         setTimeout(reject, timeout*1000);
    //     });

    //     return Promise.race([getPromise, timeoutPromise])
    //         .catch(error => {
    //             this.error("Fail to get: " + url + ", 网络错误");
    //             throw error;
    //         });
    // },

    /*
    * 原始的 HTTP Get
    * url: 完整的 URL
    * params: 参数
    */
    get(url, params, dataType, {timeout=5}={}) {
      return new Promise((resolve, reject) => {
        if(!url) return reject(new Error("url is null"));

        url = this.__urlJoin(url, params);

        this.log(`Get: ${url}`);

        url = encodeURI(url);

        let request = new XMLHttpRequest();
        request.open("GET", url);

        request.timeout = timeout * 1000;

        switch(dataType){
          // case null:
          // case "":
          // case undefined:
          //     request.setRequestHeader("Content-Type", "text/plain");
          //     break;
          case "json":
          case "JSON":
            request.setRequestHeader("Content-Type", "application/json");
            break;
        }

        request.onload = () => {
          // success
          switch(dataType){
            case "json":
              resolve(JSON.parse(request.responseText));
              break;
            default:
              resolve(request.responseText);
              break;
          }
        };

        request.ontimeout = () => {
          this.error(`Fail to get: ${url}, 网络超时`);
          reject(701);
        };

        request.onabort = () => {
          this.error(`Fail to get: ${url}, 传输中断`);
          reject(702);
        }

        request.onerror = () => {
          this.error("Fail to get: " + url + ", 网络错误");
          reject(703);
        }

        request.send(null);
      });
    },

    // 获取 JSON 格式
    getJSON(url, params){
      return this.get(url, params, "json");
    },

    // 过滤某些标签
    __filterElement(html, element, endElement=element){

      if(!html || !element) return html;

      let pattern = `<${element}( [^>]*?)?>[\\s\\S]*?</${endElement}>`;
      html = html.replace(new RegExp(pattern, 'gi'), '');
      // 去除单标签
      pattern = `<${element}([^>]*?)?>`;
      html = html.replace(new RegExp(pattern, 'gi'), '');
      return html;
    },

    getDOM(url, params){
      return this.get(url, params)
          .then(data => `<div>${this.filterHtmlContent(data)}</div>`);

    },

    // 过滤 HTML 中的内容，用于爬虫
    filterHtmlContent(html){
      if(!html) return html;

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
    format(string, object={}){
      if(!string) return string;

      const result = string.replace(/{(\w+)}/g, (p0, p1) =>
          p1 in object ? object[p1] : `{${p1}}`
        )
      return result;
    },

    // 从 Object 中获取数据
    getDataFromObject(obj, key){
      if(!obj || !key) return obj;
      const keys = key.split('.');
      let result = obj;
      for(let key of keys){
        let [k, operator] = key.split(':');

        if(!result) return undefined;

        if(this.type(result) == 'array'){
          if(!operator)
            result = result.map(m => m[k]);
          else if(operator == 'concat')
            result = result.reduce((s, m) => s.concat(m[k]), []);
        }
        else
          result = result[k];
      }
      return result
    },

    // 修复抓取的 URL
    fixurl(url, host){
      if(!url || url.match("^https?://"))
        return url;

      if(url.match("^//"))
        url = "http:" + url;
      else if(url.match("^://"))
        url = "http" + url;
      else if(url.match("^javascript:"))
        url = "";
      else {

        // 需要用到 host 了
        let matcher = host.match(/^(.*):\/\//);
        let scheme = matcher ? matcher[0] : "";
        host = host.substring(scheme.length);

        if(url.match("^/")){
          host = host.replace(/\/.*$/, ""); // 去掉第一个 / 后面的内容
          url = `${scheme}${host}${url}`;
        }
        else{
          // host = host.replace(/\?.*$/, ""); // 去掉?后面的内容
          host = host.replace(/\/[^\/]*$/, "") // 去掉最后一个 / 后面的内容
          url = `${scheme}${host}/${url}`;
        }
      }
      return url;
    },

    // HTML 内容转换为 Text
    html2text(html){
      function replaceElement(html, element, replaceString){
        const pattern = `<${element}(?: [^>]*?)?>[\s　]*([\\s\\S]*?)[\s　]*</${element}>`;
        html = html.replace(new RegExp(pattern, 'gi'), replaceString);
        return html;
      };

      if(!html) return html;

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
        if(!obj || !ClassFunction) return array;

      const nc = new ClassFunction();
      Object.assign(nc, obj);
      return nc;
    },

    // 将数组中的每个成员的类型都转换为执行的类
    arrayCast(array, ClassFunction){
      if(!array || !ClassFunction) return array;

      array.forEach((v, i, arr) => {
        const nc = new ClassFunction();
        Object.assign(nc, array[i]);
        arr[i] = nc;
      });
    },

    // 返回数组中值最大的索引的集合
    __arrayMaxIndex(array, compareFuntion=(i1, i2) => i1 - i2){
      if(!array) return array;

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
    __arrayMinIndex(array, compareFuntion=(a,b)=>b-a){
      if(!array) return array;

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
        i = listB.slice(i+1).findIndex(e => equalFunction(e, itemA));


        if(i < 0){
          // 没找到结果
          // 返回结果集合中的一个最优结果

          // 最优结果：权值最大，并且索引值最靠近 indexA
          if(result.length == 0){
            // 一个结果也没有
            return -1;
          }
          const rr = this.__arrayMaxIndex(result, (a, b) => a.weight - b.weight);
          if(rr.length <= 1){
            return result[rr[0]].index;
          }
          else{
            return result[this.__arrayMinIndex(rr, (a, b) => {
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
        i = listB.slice(i+1).findIndex(e => equalFunction(e, itemALeft));

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
    // objectSortedKey(object, getFunctionOrObjectKeyName=i=>i){
    //   if(!object) return object;

    //   if(typeof getFunctionOrObjectKeyName == 'string'){
    //     const objectKeyName = getFunctionOrObjectKeyName;
    //     getFunctionOrObjectKeyName = item => item[objectKeyName];
    //   }

    //   const arr = [];
    //   for(const k in object){
    //     arr.push([k, getFunctionOrObjectKeyName(object[k])]);
    //   }
    //   arr.sort((e1, e2) => e1[1] - e2[1]);
    //   const result = [];
    //   for(let i = 0; i < arr.length; i++){
    //     result[i] = arr[i][0];
    //   }
    //   return result;
    // },

    // 确保文件名正确
    __convertFileName(file){
      return file.replace(/[\\:*?"<>|/]/g, "");
    },

    // 保存 JSON 对象到文件中
    __saveJSONToFile(file, data, isCacheDir=false){
      file = this.__convertFileName(file);

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
        createAndWriteFile();
      });
    },

    // 从文件中获取 JSON 对象
    __loadJSONFromFile(file, isCacheDir=false){
      file = this.__convertFileName(file);

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
                      resolve(this.result);
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
      file = this.__convertFileName(file);

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

    // 保存已经被 JSON.stringify 格式化后的字符串
    saveTextData(key, data, onlyCache=false){
      if(!key || !data)
        return Promise.reject(new Error("Illegal args"));
      if(window.requestFileSystem){
        return this.__saveJSONToFile(key, data, onlyCache);
      }
      else{
        const s = onlyCache? sessionStorage : localStorage;
        s.setItem(key, data);
        return Promise.resolve();
      }
    },

    // 保存数据
    saveData(key, data, onlyCache=false){
      if(!key || !data)
        return Promise.reject(new Error("Illegal args"));

      data = JSON.stringify(data);
      return this.saveTextData(key, data, onlyCache);
    },

    // 加载数据
    loadData(key, onlyCache=false){
      if(!key) return Promise.reject(new Error("Illegal args"));

      if(window.requestFileSystem){
        return this.__loadJSONFromFile(key, onlyCache);
      }
      else{
        const s = onlyCache? sessionStorage : localStorage;
        let data = s.getItem(key);
        data = JSON.parse(data);
        return Promise.resolve(data);
      }
    },

    // 删除数据
    removeData(key, onlyCache=false){
      if(!key) return Promise.reject(new Error("Illegal args"));

      if(window.requestFileSystem){
        return this.__removeFile(key, onlyCache);
      }
      else{
        const s = onlyCache? sessionStorage : localStorage;
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
        const s = onlyCache? sessionStorage : localStorage;
        return Promise.resolve(key in s);
      }
    },

    // 比较去掉所有空格和标点符号之后的所有符号
    stripString(str){
      if(!str) return str;

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

    // 模拟 $.find 方法
    // elementFind(element, selector){
    //   return selector && element.querySelector(selector) ||
    //     { getAttribute: e=> "", textContent: "", html: ""};
    // },

    // 给数组计数
    arrayCount(array){
      if(!array) return array;
      const counter = {};
      for(let m of array){
        if(!(m in counter))
          counter[m] = 1;
        else
          counter[m] += 1;
      }
      const result = [];
      for(let k in counter){
        result.push([k, counter[k]])
      }
      result.sort((e1,e2) => e2[1] - e1[1]);
      return result;
    },

    // 持久化数据
    persistent(o){
      function __persistent(obj){
        // undefined
        // null
        // boolean
        // string
        // number
        // object: array
        // symbol
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

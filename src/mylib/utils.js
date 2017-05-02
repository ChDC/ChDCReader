;(function(factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory();
  else
    window["utils"] = factory();
}(function(){
  "use strict"

  return {
    /*
    * 开启调试模式
    */
    DEBUG: true,

    /*
    * 判断对象的类型
    * null -> null
    * undefined -> undefined
    * [] -> array
    * {} -> object
    * '' -> string
    * 0.1 -> number
    * new Error() -> error
    * ()->{} -> function
    */
    type(obj){
      // return $.type(obj); // 只有这里用了 jquery
      let type = typeof(obj);
      if(type != 'object')
        return type;
      return obj.constructor.name.toLowerCase();
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

    cordovaAjax(method='get', url, params={}, dataType, headers={},
                  options){
      if(typeof cordovaHTTP == 'undefined')
        return this.ajax(method, url, params, dataType, headers, options);
      return new Promise((resolve, reject) => {
        if(!url) return reject(new Error("url is null"));

        let func;
        switch(method.toLowerCase()){
          case "get":
            func = cordovaHTTP.get.bind(cordovaHTTP);
            break;

          case "post":
            func = cordovaHTTP.post.bind(cordovaHTTP);
            break;
          default:
            return reject(new Error("method is illegal"));
        }

        if(!('User-Agent' in headers))
          headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';

        func(url, params, headers,
          function(response) {
            switch(dataType){
              case "json":
                resolve(JSON.parse(response.data));
                break;
              default:
                resolve(response.data);
                break;
            }
          },
          function(response) {
            reject(response.error);
          });
      });
    },

    /*
    * 原始的 HTTP XHR
    * url: 完整的 URL
    * params: 参数
    */
    ajax(method="GET", url, params, dataType, headers, {timeout=5, retry=1}={}) {

      return new Promise((resolve, reject) => {
        if(!url) return reject(new Error("url is null"));
        url = this.__urlJoin(url, params);
        this.log(`Get: ${url}`);
        url = encodeURI(url);
        retry = retry || 0;

        let request = new XMLHttpRequest();
        request.open(method, url);
        request.timeout = timeout * 1000;

        dataType = (dataType || "").toLowerCase();
        switch(dataType){
          case "json":
            request.setRequestHeader("Content-Type", "application/json");
            break;
          // default undefined:
          //     request.setRequestHeader("Content-Type", "text/plain");
          //     break;
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
          if(retry > 0){
            // 超时重传
            // request.abort();
            request.open(method, url);
            request.send(null);
            retry -= 1;
          }
          else{
            this.error(`Fail to get: ${url}, 网络超时`);
            reject(new Error("Request Timeout"));
          }
        };

        request.onabort = () => {
          this.error(`Fail to get: ${url}, 传输中断`);
          reject(new Error("Request Abort"));
        }

        request.onerror = () => {
          this.error("Fail to get: " + url + ", 网络错误");
          reject(new Error("Request Error"));
        }

        request.send(null);
      });
    },

    get(url, params, dataType, options){
      return this.ajax("GET", url, params, dataType, {}, options);
    },

    // 获取 JSON 格式
    getJSON(url, params){
      return this.get(url, params, "json");
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

    // HTML 内容转换为 Text
    // html2text(html){

    //   function replaceElement(html, element, replaceString){
    //     const pattern = `<${element}(?: [^>]*?)?>[\\s　]*([\\s\\S]*?)[\\s　]*</${element}>`;
    //     html = html.replace(new RegExp(pattern, 'gi'), replaceString);
    //     return html;
    //   };

    //   if(!html) return html;

    //   // 替换转义字符
    //   html = html.replace(/&nbsp;/gi, ' ');

    //   // 解决用双 <br> 标签换行的问题
    //   const temp = html.replace(/\s*(<br ?\/?>\s*){2,}/gi, '\n');
    //   if(temp.search(/\s*<br ?\/?>\s*/) >= 0)
    //     html = html.replace(/\s*<br ?\/?>\s*/gi, '\n');
    //   else
    //     html = temp;
    //   // 替换标签
    //   html = replaceElement(html, 'p', '$1\n');
    //   html = replaceElement(html, 'span', '$1');
    //   html = replaceElement(html, 'b', '$1');
    //   html = replaceElement(html, 'i', '$1');

    //   // 去掉所有标签
    //   html = html.replace(/<(\\w+)( [^>]*?)?>[\\s\\S]*?<\/$1>/gi, ''); // 双标签
    //   html = html.replace(/<\\w+([^>]*?)?>/gi, ''); // 单标签
    //   return html.trim();
    // },

    // 将 Object 类型转换为指定的类
    objectCast(obj, ClassFunction){
      if(!obj || !ClassFunction) return obj;

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
      return array;
    },

    // 从副列表中匹配（必须相等）查询主列表的元素的索引
    listMatch(listA, listB, indexA,
      equalFunction=(i1,i2)=>i1==i2, startIndexB=0){
      if(!listA || !listB) return -1;

      if(listA == listB) return indexA;

      // 比较前、后 n 个邻居
      function compareNeighbor(indexB, offset){
        const nia = indexA + offset;
        const nib = indexB + offset;
        let equal;
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
      const itemA = listA[indexA];
      // 所有匹配的结果的索引集合
      const equalSet = listB.slice(startIndexB)
          .map((e,i) => equalFunction(e, itemA) ? i : -1).filter(e => e>=0);
      if(equalSet.length <= 0)
        return -1;

      const result = [];
      for(let i of equalSet){
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
            weight: weight,
            distance: Math.abs(i-indexA)
          });
        }
      }

      // 没找到结果
      // 返回结果集合中的一个最优结果

      // 最优结果：权值最大，并且索引值最靠近 indexA

      // 返回权值最大的值的集合
      const maxWeight = Math.max(...result.map(e => e.weight));
      const maxWeightSet = result.filter(e => e.weight == maxWeight);

      if(maxWeightSet.length <= 1)
        return maxWeightSet[0].index;
      else{
        // 在最大权重中搜索离 indexA 最近的值
        const minDistance = Math.min(...result.map(e => e.distance));
        return maxWeightSet.find(e => e.distance == minDistance).index;
      }
    },

    // 通过判断章节上下两个邻居是否相同来判断当前章节是否相等
    listMatchWithNeighbour(listA, listB, indexA, equalFunction=(i1, i2)=>i1==i2, indexB){

      if(!listA || !listB) return -1;

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

    // 确保文件名正确
    __convertFileName(file){
      return file.replace(/[\\:*?"<>|/]/g, "");
    },

    // 保存 JSON 对象到文件中
    __saveTextToFile(file, data, isCacheDir=false){
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
    __loadTextFromFile(file, isCacheDir=false){
      file = this.__convertFileName(file);

      return new Promise((resolve, reject) => {
        function handleError(){
          resolve(null);
        }
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

                  }, handleError);
                }, handleError);

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
        return this.__saveTextToFile(key, data, onlyCache);
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

      if(window.requestFileSystem)
        return this.__loadTextFromFile(key, onlyCache)
          .then(data => JSON.parse(data));
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

    // 添加事件监听机制
    addEventSupport(obj){
      obj.__events = {};
      obj.addEventListener = addEventListener.bind(obj);
      obj.fireEvent = fireEvent.bind(obj);
      obj.removeEventListener = removeEventListener.bind(obj);

      function addEventListener(eventName, handler){
        if(!eventName || !handler) return;
        if(!(eventName in this.__events))
          this.__events[eventName] = [];
        this.__events[eventName].push(handler);
      }

      function fireEvent(eventName, e={}){
        if(!eventName) return;

        // init e

        if(!("currentTarget" in e)) e.currentTarget = this;
        if(!("target" in e)) e.target = this;
        e.stopPropagation = () => { e.__stopPropagation = true;};

        // __onEvent
        let __onevent = `__on${eventName[0].toUpperCase()}${eventName.substring(1)}`;
        if(__onevent in this)
          this[__onevent](e);

        // addEventListener
        if(eventName in this.__events){
          for(let eh of this.__events[eventName]){
            try{
              if(e.__stopPropagation) break;
              eh(e)
            }
            catch(error){
              console.error(error);
            }
          }
        }

        // onEvent
        let onevent = `on${eventName[0].toUpperCase()}${eventName.substring(1)}`;
        if(onevent in this)
          this[onevent](e);
      }

      function removeEventListener(eventName, handler){
        if(!eventName || !handler) return;
        if(eventName in this.__events){
          let i = this.__events[eventName].findIndex(m => m == handler);
          if(i >= 0)
            this.__events[eventName].splice(i, 1);
        }
      }
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
                if(value !== undefined)
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
                if(value !== undefined)
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

}));

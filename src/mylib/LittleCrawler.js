/*!
 * JavaScript LittleCrawler v1.0.0
 * https://github.com/ChDC/LittleCrawlerJS
 *
 * Copyright 2016, 2017 Chen Dacai
 * Released under the MIT license
 */
;(function(factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory();
  else
    window["LittleCrawler"] = factory();
}(function(){
  /******* 格式说明 ************

    request 设置请求
    * url: 请求的 URL
    * method: 请求方法，缺省为 GET
    * params: 请求参数
    * type: 响应类型，可为 JSON 或 HTML，缺省为 HTML
    * cookies:
    request 也可为单一字符串，只指定 url，
    若 request 缺省，则在 dict 的 url 属性中读取 url

    response 设置响应对象
    * 可以为三种 JSON 类型
      * array 返回对象为数组
      * object 返回对象为 list 数组或者 object
        * 如果有 type 属性，则 type 取值可为
          * array
          * string
          * boolean
          * format: 从当前已经获取的结果中合成该结果
          * 缺省为 object
      * string 返回对象为字符串

    * 特殊属性说明：
      * 以 Link 结尾的会自动获取 a 标签的 href 属性值
      * 以 Img 或 Image 结尾的会自动获取 img 标签的 src 属性值


  ****************************/

  /******* 例子 ***************

  {
    "request": {
      "url": "http://se.qidian.com/?kw={keyword}",
      "method": "GET",
      "params": "",
      "type": "html",
      "timeout": 15
    },
    "response": {
      "type": "array",
      "element": "#result-list li[data-rid]",
      "children": {
          "author": ".book-mid-info .author>a.name",
          "catagory": ".book-mid-info .author a:nth-child(4)",
          "complete": ".book-mid-info .author span:last-child",
          "coverImg": ".book-img-box img",
          "introduce": ".book-mid-info .intro",
          "lastestChapter": ".book-mid-info .update>a",
          "detailLink": {
            "type": "string",
            "element": ".book-mid-info>h4>a",
            "attribute": "href"
          },
          "name": ".book-mid-info>h4>a"
        }
    }
  }

  *****************************/

  class LittleCrawler{

    // ajax：用于发送 HTTP 请求的对象
    // 可以设置为 map，在 request 中用 ajax 来指定使用哪个 ajax，默认使用 default 键指定的 ajax
    // * method: "POST", "GET"
    // * url
    // * data
    // * dataType -> String: json
    // * headers -> Object
    // * options -> Object
    //    * timeout
    constructor(ajax){

      let a = {
        "default": LittleCrawler.ajax,
        "cordova": LittleCrawler.cordovaAjax,
      };
      if(!ajax)
        this.ajax = a;
      else if(LittleCrawler.type(ajax) == "object")
        this.ajax = Object.assign(a, ajax);
      else
        this.ajax = ajax;

      // 为了防止浏览器自动获取资源而进行的属性转换列表
      this.insecurityAttributeList = ['src'];
      this.insecurityTagList = ['body', 'head', 'title', 'script', 'style', 'link', 'meta', 'iframe'];
      this.singleTagList = ['meta', 'link']; // 用于转换单标签

      this.fixurlAttributeList = ['href', "lc-src"]; // 需要修复 url 的属性

      // 如果给定的键名匹配下面的规则，就自动获取指定的属性
      this.specialKey2AttributeList = [
        [/link$/i, "href"],
        [/img$|image$/i, "lc-src"],
        [/html$/i, (element) => this.__reverseHTML(element.innerHTML)]
      ];
    }


    // 从配置对象中抓取并获得结果
    get({request, response}={}, dict={}){
      if(!response)
        return Promise.reject(new Error("Empty response"));

      let url;
      try{
        url = this.getLink(request, dict);
      }
      catch(error){
        return Promise.reject(error);
      }

      // 补充缺省值
      request = request || {};
      let method = (request.method || "GET").toLowerCase();
      let type = (request.type || "HTML").toLowerCase();
      let headers = request.headers || {};

      // 获取 ajax 操作对象
      let ajax;
      switch(LittleCrawler.type(this.ajax)){
        case "function":
          ajax = this.ajax;
          break;
        case "object":
          if(request.ajax && request.ajax in this.ajax)
            ajax = this.ajax[request.ajax];
          else if('default' in this.ajax)
            ajax = this.ajax['default'];
          else if('' in this.ajax)
            ajax = this.ajax[''];
          else
            throw new Error("cat't find the ajax");
          break;
        case "array":
          if(request.ajax && request.ajax in this.ajax)
            ajax = this.ajax[request.ajax];
          else
            ajax = this.ajax[0];
          break;
        default:
          throw new Error("illegal ajax");
          break;
      }

      // 发出请求并解析响应
      return ajax(method, url, request.params, undefined, headers,
                  {timeout: request.timeout})
        .then(data => this.parse(data, type, response, url, dict));
    }

    // get request url
    // args:
    // * request: the request config object
    // * dict: the data dict to help combine url
    getLink(request, dict={}){

      // if request is empty, get url from dict.url
      if(!request)
        request = {
          "url": dict.url
        };

      // the request arg can be a single string
      if(LittleCrawler.type(request) == "string"){
        request = {
          "url": request
        };
      }

      if(!request.url)
        throw new Error("Empty URL");

      return LittleCrawler.format(request.url, dict);
    }

    // parse the response data
    // * data: the response data
    // * type: assign the type of response, it can be "json" or "html"(default)
    // * response: the config to parse data
    // * host: the host url to fix links, eg: fix /abc/get.php to http://www.abc.com/abc/get.php
    parse(data, type, response, host, dict={}){

      // to make the function noinfluence
      dict = Object.assign({}, dict, {host: host});

      switch(type){
        case "html":
          data = this.__transformHTML(data); // 转换不安全的标签和属性
          let html = document.createElement("container-html");
          html.innerHTML = data;
          return this.__handleResponse(html, response, null,  dict);
        case "json":
          let json;
          if(LittleCrawler.type(data) != 'object')
            json = JSON.parse(data);
          else
            json = data;
          return this.__handleResponse(json, response, null, dict);
        default:
          throw new Error("Illegal type");
      }
    }

    // handle the response
    __handleResponse(data, response, keyName, globalDict={}, dict={}){

      if(!response) return undefined;

      switch(LittleCrawler.type(response)){
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

    __handleArray(data, response, keyName, globalDict={}, dict={}){
      return response.map(m => this.__handleResponse(data, m, keyName, globalDict, dict));
    }

    __handleObject(data, response, keyName, globalDict={}, dict={}){

      const __privateHandleObject = (response) => {
        // object 类型
        let result = {};
        // let delay = [];
        for(let key in response){
          // TODO: 把 format 类型和带有 valid 验证功能的最后处理
          result[key] = this.__handleResponse(data, response[key], key, globalDict, result);
        }
        return result;
      }

      if(!response.type){
        // object 类型，直接解析成员
        return __privateHandleObject(response);
      }

      let result;

      let type = response.type.toLowerCase();

      switch(type){

        case "array": {
          // array
          if(!response.element || !response.children)
            return undefined;
          result = [];
          let list = this.__getAllElements(data, response.element);
          result = list.map(m =>
              this.__handleResponse(m, response.children, keyName, globalDict, dict));
          if(response.valideach)
            // 指定了验证类型，验证每一个值是否有效
            result = result.filter(m => {
              let gatherDict = Object.assign({}, globalDict,
                  LittleCrawler.type(data) == "object" ? data : {},
                  LittleCrawler.type(m) == "object" ? m : {value: m});
              const validCode = '"use strict"\n' + LittleCrawler.format(response.valideach, gatherDict, true);
              return eval(validCode);
            });
        }
        break;
        case "object": {
          // object
          if(!response.children)
            return undefined;
          result = __privateHandleObject(response.children);
        }
        break;
        case "string": {
          if(!response.element)
            return undefined;

          let e = this.__getElement(data, response.element);
          if(e == undefined) return undefined;

          // 从 element 中获取属性值
          if(response.attribute){
            let attr;
            if(this.insecurityAttributeList.includes(response.attribute))
              attr = `lc-${attr}`;
            else
              attr = response.attribute;
            result = e.getAttribute(attr);
            if(this.fixurlAttributeList.indexOf(attr) >= 0)
              result = LittleCrawler.fixurl(result, globalDict.host);
            if(attr == 'innerHTML')
              result = this.__reverseHTML(result);
          }
          else
            // 没有指定属性则按键的名字获取值，缺省获取 textContent
            result = this.__getValue(e, keyName, globalDict, dict);

          if(result == undefined) return result;
          // [operator] 指定 remove 操作来删除一些值
          if(response.remove){
            switch(LittleCrawler.type(response.remove)){
              case "array":
                result = response.remove.reduce((r, e) =>
                  LittleCrawler.type(e) == "object" ?
                  r.replace(new RegExp(e.regexp, e.options), '') :
                  r.replace(new RegExp(e, "gi"), '')
                , result);
                break;

              case "object":
                result = result.replace(new RegExp(response.remove.regexp, response.remove.options), '');
                break;

              case "string":
                result = result.replace(new RegExp(response.remove, 'gi'), '');
                break;
            }
          }

          // [operator] 使用 extract 操作提取最终结果
          if(response.extract){
            let doExtract = (regex, str) => {
              let matcher = str.match(regex);
              if(!matcher) return undefined;
              if(regex.global)
                return matcher.join('');
              else {
                let r = matcher.slice(1).join(''); // 如果正则表达式中使用了分组，则把结果的分组合并为结果
                return r ? r : matcher[0];
              }
            }
            switch(LittleCrawler.type(response.extract)){
              case "array":
                result = response.extract.reduce((r, e) =>
                  LittleCrawler.type(e) == "object" ?
                  doExtract(new RegExp(e.regexp, e.options), r) :
                  doExtract(new RegExp(e, "i"), r)
                , result);
                break;

              case "object":
                result = doExtract(new RegExp(response.extract.regexp, response.extract.options), result);
                break;

              case "string":
                result = doExtract(new RegExp(response.extract, 'i'), result);
                break;
            }
          }
        }
        break;
        case "boolean": {
          // boolean
          if(!response.element)
            return response.default;
          let e = this.__getElement(data, response.element);
          if(e == undefined) return response.default;
          let v = this.__getValue(e, keyName, globalDict, dict);
          if(v != undefined) v = v.toString();

          if(v != undefined && response.true && v.match(response.true))
            result = true;
          else if(v != undefined && response.false && v.match(response.false))
            result = false;
          else
            result = response.default;
        }
        break;
        case "format": {
          // 合成结果
          if(!response.value)
            return undefined;
          let gatherDict = Object.assign({}, globalDict,
              LittleCrawler.type(data) == "object" ? data : {}, dict);
          result = LittleCrawler.format(response.value, gatherDict);
        }
        break;
        default: {
          // 把 type 当前普通值对待
          result = __privateHandleObject(response);
        }
      }

      if("valid" in response){
        // 有验证的类型
        let gatherDict = Object.assign({}, globalDict,
            LittleCrawler.type(data) == "object" ? data : {}, dict,
            {value: result});
        const validCode = '"use strict"\n' + LittleCrawler.format(response.valid, gatherDict, true);
        if(!eval(validCode))
          return undefined; // 验证失败，返回空值
      }
      return result;
    }

    __handleString(data, response, keyName, globalDict={}, dict={}){
      let e = this.__getElement(data, response);
      if(e == undefined) return undefined;
      return this.__getValue(e, keyName, globalDict, dict);
    }

    // 从元素中获取值
    __getValue(element, keyName, globalDict={}, dict={}){
      if(element && element.querySelector){
        // html
        let result;
        if(!keyName)
          return element.textContent.trim();

        let matched = false;
        for(let [pattern, attr] of this.specialKey2AttributeList){
          if(keyName.match(pattern)){
            matched = true;
            if(LittleCrawler.type(attr) == "string"){
              result = element.getAttribute(attr);
              // 修复 url
              if(this.fixurlAttributeList.indexOf(attr) >= 0)
                result = LittleCrawler.fixurl(result, globalDict.host);
            }
            else if(LittleCrawler.type(attr) == "function")
              result = attr(element);
            break;
          }
        }
        if(!matched)
          result = element.textContent.trim();
        return result;
      }
      else{
        // json
        return element;
      }
    }

    // 将选择器也转换为内部的选择器
    __transformSelector(selector){
      if(!selector) return selector;
      selector = this.insecurityTagList.reduce((s, tag) =>
        s.replace(new RegExp(`([^#._-]|^)\\b${tag}\\b`, "gi"), `$1lc-${tag}`), selector);

      // 图片的 src 属性转换成 lc-src 属性
      selector = this.insecurityAttributeList.reduce((s, attr) =>
        s.replace(new RegExp(`\\[\\b${attr}\\b`, "gi"), `[lc-${attr}`), selector);
      return selector;
    }

    // 获取 HTML 元素对象或者 JOSN 对象
    __getElement(element, selector){
      if(!element || !selector) return undefined;

      if("querySelector" in element){
        // html
        // 将特殊属性和特殊标签转化
        return element.querySelector(this.__transformSelector(selector));
      }
      else{
        // json
        return LittleCrawler.getDataFromObject(element, selector);
      }
    }

    // 获取所有匹配值
    __getAllElements(element, selector){
      if(!element || !selector) return undefined;

      if("querySelectorAll" in element){
        // 将特殊属性和特殊标签转化
        return Array.from(element.querySelectorAll(this.__transformSelector(selector)));
      }
      else{
        return LittleCrawler.getDataFromObject(element, selector) || [];
      }
    }

    // 将诸如 img 标签的 src 属性转换为 lc-src 防止浏览器加载图片
    __transformHTML(html){
      if(!html) return html;
      // 将 meta link img 等无结束标签变成单结束标签
      html = this.singleTagList.reduce((h, tag) =>
        h.replace(new RegExp(`(<${tag}\\b(?: [^>]*?)?)/?>`, "gi"), `$1></${tag}>`), html);

      html = this.insecurityTagList.reduce((h, tag) => LittleCrawler.replaceTag(h, tag, `lc-${tag}`), html);

      // 图片的 src 属性转换成 lc-src 属性
      html = this.insecurityAttributeList.reduce((h, attr) => LittleCrawler.replaceAttribute(h, attr, `lc-${attr}`), html);
      return html;
    }

    // 将之前的转换逆转回来
    __reverseHTML(html){
      if(!html) return html;
      html = this.insecurityTagList.reduce((h, tag) => LittleCrawler.replaceTag(h, `lc-${tag}`, tag), html);

      // 图片的 src 属性转换成 lc-src 属性
      html = this.insecurityAttributeList.reduce((h, attr) => LittleCrawler.replaceAttribute(h, `lc-${attr}`, attr), html);
      return html;
    }

  }

  /******************** Class Methods ********************/


  LittleCrawler.cordovaAjax = function(method='get', url, params={}, dataType, headers={},
                options){
    if(typeof cordovaHTTP == 'undefined')
      return LittleCrawler.ajax(method, url, params, dataType, headers, options);
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
  * 获取 URL 的参数字符串
  */
  LittleCrawler.__urlJoin = function(url, params){

    if(!params) return url;
    params = Object.keys(params).map(k => `${k}=${params[k]}`).join("&");
    if(!params) return url;

    let i = url.indexOf("?");
    if(i == -1)
      return `${url}?${params}`;
    else if(i < url.length - 1)
      return `${url}&${params}`;
    else
      return `${url}${params}`;
  }


  /*
  * 原始的 HTTP XHR
  * url: 完整的 URL
  * params: 参数
  */
  LittleCrawler.ajax = function(method="GET", url, params, dataType, headers, {timeout=5, retry=1}={}) {

    return new Promise((resolve, reject) => {
      if(!url) return reject(new Error("url is null"));
      url = LittleCrawler.__urlJoin(url, params);
      console.log(`Get: ${url}`);
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
          console.error(`AjaxError: Fail to get: ${url}, 网络超时`);
          reject(new Error("AjaxError: Request Timeout"));
        }
      };

      request.onabort = () => {
        console.error(`Fail to get: ${url}, 传输中断`);
        reject(new Error("AjaxError: Request Abort"));
      }

      request.onerror = () => {
        console.error("Fail to get: " + url + ", 网络错误");
        reject(new Error("AjaxError: Request Error"));
      }

      request.send(null);
    });
  },

  // 从 Object 中获取数据
  // eg: get "abc.def" from "{abc: {def: 1}}" using "abc::def" or "abc.def"
  LittleCrawler.getDataFromObject = function(json, key){

    // filter 操作的实现函数
    function operatorFilter(element, parent, args){
      let codeStart = '"use strict"\n';
      let env = `var $element=${JSON.stringify(element)};\nvar $parent=${JSON.stringify(parent)};\n`;
      let code = codeStart + env + args[0];
      return eval(code);
    }

    // 分割键、操作符和操作参数
    function splitKeyAndOperatorAndArgs(str){
      if(!str) return [];
      let i = str.indexOf('#');
      if(i < 0) return [str];
      let key = str.substring(0, i);
      str = str.substring(i+1);
      let oas = str.split("#").map(d => {
        i = d.indexOf('(');
        if(i < 0)  return [d, undefined];
        let operator = d.substring(0, i);
        let args = d.substring(i+1, d.length - 1);
        if(!args)
          args = [];
        else
          args = eval(`[${args}]`);
        return [operator, args];
      });

      return [key, oas];
    }

    function getValue(obj, keys, i){
      while(i < keys.length &&
        (LittleCrawler.type(obj) == "object" ||
         LittleCrawler.type(obj) == "array" && keys[i][0].match(/^[0-9]+$/)))
        obj = obj[keys[i++][0]];

      if(i >= keys.length)
        return obj;
      if(LittleCrawler.type(obj) != "array")
        return undefined;

      let result = obj;
      let [key, oas] = keys[i];
      if(!oas || oas.length <= 0)
        return result.map(m => getValue(m, keys, i));
      else{
        // filter
        let oa = oas.find(e => e[0] == "filter");
        if(oa)
          result = result.filter(e => operatorFilter(e[key], e, oa[1]));

        // 上面的是 Before 操作符
        // 下面的是 After 操作符
        result = result.map(m => getValue(m, keys, i));

        oa = oas.find(e => e[0] == "concat");
        if(oa)
          result = result.reduce((s, m) => s.concat(m), []);


        // for(let [operator, args] of oas){
        //   switch(operator){
        //     case "concat":
        //       result = result.map(m => getValue(m, keys, i));
        //       break;

        //     case "filter":
        //       result = result.filter(e => operatorFilter(e[key], args))
        //         .map(m => getValue(m, keys, i));
        //       break;
        //   }
        // }

      }

      return result;
      //       // 单个值的情况
      //       if(operator == "filter"){  // [operator]
      //         result = result[key];
      //         if(LittleCrawler.type(result) == 'array')  // [operator]
      //           result = result.filter(e => operatorFilter(e, args));

      //     case "array":
      //       // 多个值的情况
      //       if(operator == 'concat') // [operator]
      //         result = result.reduce((s, m) => s.concat(m[key]), []);
      //       else if(operator == "filter"){ // [operator]
      //         result = result.map(m => getValue(m, keys.slice(i)))
      //           .filter(e => operatorFilter(e, args));
      //       }
    }

    if(!json || !key) return json;
    let keys = key.split(key.includes("::") ? '::' : '.');
    keys = keys.map(k => splitKeyAndOperatorAndArgs(k));
    let result = getValue(json, keys, 0);
    return result;
  }


  // fix the url
  // args:
  // * url: the url to fix
  // * host: the host url to fix links, eg: fix /abc/get.php to http://www.abc.com/abc/get.php
  LittleCrawler.fixurl = function(url, host){
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
      let matcher = host.match(/^(.*?):\/\//);
      let scheme = matcher ? matcher[0] : "";
      host = host.substring(scheme.length);

      if(url.match("^/")){
        host = host.replace(/\/.*$/, ""); // 去掉第一个 / 后面的内容
        url = `${scheme}${host}${url}`;
      }
      else{
        // host = host.replace(/\?.*$/, ""); // 去掉?后面的内容
        host = host.replace(/\/[^\/]*$/, "") // 去掉最后一个 / 后面的内容
        let m2 = url.match(/^\.\.\//g);
        url = url.replace(/^\.\.\//g, '');
        if(m2){
          for(let i = 0; i < m2.length; i++)
            host = host.replace(/\/[^\/]*$/, "") // 去掉最后一个 / 后面的内容
        }
        url = `${scheme}${host}/${url}`;

      }
    }
    return url;
  }

  // 字符串格式化，类似于 Python 的 string.format
  // stringify 为 true 表示将属性先 用 JSON.stringify() 处理之后再放入
  LittleCrawler.format = function(string, object={}, stringify=false){
    if(!string) return string;

    const result = string.replace(/{(\w+)}/g, (p0, p1) => {

      if(!(p1 in object))
        throw new Error(`can't find the key ${p1} in object`);

      if(object[p1] == undefined && !stringify)
        return '';
      if(stringify)
        return JSON.stringify(object[p1]);
      else
        return object[p1];
    });
    return result;
  }

  // 将复杂的 HTML 内容转换成只有文字和图片的简单的内容
  LittleCrawler.clearHtml = function(html){
    if(!html) return html;

    // 清除黑名单标签
    html = LittleCrawler.filterHtmlContent(html);

    // 清空标签属性，排除白名单属性 src
    let whitePropertyList = ['src'];
    html = html.replace(/\s*([\w-]+)\s*=\s*"[^"]*"/gi, (p0, p1)=>
        whitePropertyList.includes(p1) ? p0 : ""
      );

    // 转换 <br> 为 p 标签
    if(html.match(/<br\s*\/?>/gi)){
      // 替换双 br
      let dbrhtml = html.replace(/([^>]*)<br\s*\/?>\s*<br\s*\/?>/gi, '<p>$1</pchange>');
      if(dbrhtml.match(/<br\s*\/?>\s*/i))
        html = html.replace(/([^>]*)<br\s*\/?>/gi, '<p>$1</pchange>');
      else
        html = dbrhtml;
      // 转换了 br
      // 转换最后一行
      html = html.replace(/<\/pchange>([^<]+)($|<)/gi, '</p><p>$1</p>$2');
      html = html.replace(/<\/pchange>/gi, '</p>');
    }

    // 去掉标签前后的空格 &nbsp;
    html = html.replace(/>(　|\s|&nbsp;)+/gi, '>');
    html = html.replace(/(　|\s|&nbsp;)+</gi, '<');

    return html;
  }

  // 过滤 HTML 中的不需要的内容（如link、meta、script 等标签），用于爬虫
  LittleCrawler.filterHtmlContent = function(html){
    if(!html) return html;

    // 只要 body
    const m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
    if(m && m.length >= 2)
      html = m[1];

    let blackList = ['script', 'style', 'link', 'meta', 'iframe'];
    html = blackList.reduce((html, be) => LittleCrawler.filterTag(html, be), html);
    return html;
  }


  // 过滤某些标签
  LittleCrawler.filterTag = function(html, tag){

    if(!html || !tag) return html;

    let pattern = `<${tag}\\b( [^>]*?)?>[\\s\\S]*?</${tag}>`;
    html = html.replace(new RegExp(pattern, 'gi'), '');
    // 去除单标签
    pattern = `<${tag}\\b([^>]*?)?>`;
    html = html.replace(new RegExp(pattern, 'gi'), '');
    return html;
  }

  // 替换标签
  LittleCrawler.replaceTag = function(html, tag, retag){
    if(!html || !tag || !retag || tag == retag) return html;
    // 替换开头
    let pattern = `<${tag}\\b(?=[ >/])`;
    html = html.replace(new RegExp(pattern, 'gi'), `<${retag}`);
    // 替换结尾
    pattern = `</${tag}>`;
    html = html.replace(new RegExp(pattern, 'gi'), `</${retag}>`);
    return html;
  }

  // 替换标签
  LittleCrawler.replaceAttribute = function(html, attr, reattr){
    if(!html || !attr || !reattr || attr == reattr) return html;
    // 替换开头
    return html.replace(new RegExp(`\\b${attr}=(?=["'])`, 'gi'), `${reattr}=`);
  }

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
  LittleCrawler.type = function(obj){
    // return $.type(obj); // 只有这里用了 jquery
    let type = typeof(obj);
    if(type != 'object')
      return type;
    return obj.constructor.name.toLowerCase();
  }

  // transform text to html
  LittleCrawler.text2html = function(text){
    if(!text) return text;

    // 将每一行都加上 p 标签
    const lines = text.split("\n")
      .map(line => `<p>${escapeHTML(line.trim())}</p>`);
    return lines.join('\n');

    function escapeHTML(t) {
      return t
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/ /g, "&nbsp;")
        .replace(/"/g, "&#34;")
        .replace(/'/g, "&#39;");
    }
  }

  // 将第二个对象中的属性复制到第一个对象中
  // 只复制第一个对象中有的属性
  // 并且只有当第二个对象中对应的键值不为空的时候才复制
  // 该函数用于用 get 或 parse 函数获取到结果后对结果进行筛选
  LittleCrawler.cloneObjectValues = function(dest, src){
    if(!dest || !src) return dest;

    for(let key in dest){
      if(src[key] != undefined)
        dest[key] = src[key];
    }
    return dest;
  }

  return LittleCrawler;
}));

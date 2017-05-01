define(function(){
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

  class Spider{

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
      this.ajax = ajax;
      // 为了防止浏览器自动获取资源而进行的属性转换列表
      this.secureAttributeList = [
        ['src', 'data-src'],
      ];

      this.fixurlAttributeList = ['href', "data-src"]; // 需要修复 url 的属性

      // 如果给定的键名匹配下面的规则，就自动获取指定的属性
      this.specialKey2AttributeList = [
        [/link$/i, "href"],
        [/img$|image$/i, "data-src"],
        [/html$/i, (element) => this.__reverseTransformHTMLTagProperty(element.innerHTML)]
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

      let ajax;
      switch(this.type(this.ajax)){
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
      return ajax(method, url, request.params, undefined, headers,
                  {timeout: request.timeout})
        .then(data => this.parse(data, type, response, url, dict));
    }

    // 从 request 中获取请求的 url
    getLink(request, dict={}){
      if(!request)
        request = {
          "url": dict.url
        };

      if(this.type(request) == "string"){
        request = {
          "url": request
        };
      }

      if(!request.url)
        throw new Error("Empty URL");

      return this.format(request.url, dict);
    }

    // 解析数据
    parse(data, type, response, host, dict={}){
      // 获取 URL
      dict.host = host; // 用于修复获取到的 URL

      switch(type){
        case "html":
          data = this.filterHtmlContent(data);
          data = this.__transformHTMLTagProperty(data);
          let html = document.createElement("div");
          html.innerHTML = data;
          return this.__handleResponse(html, response, null,  dict);
        case "json":
          let json;
          if(this.type(data) != 'object')
            json = JSON.parse(data);
          else
            json = data;
          return this.__handleResponse(json, response, null, dict);
        default:
          throw new Error("Illegal type");
      }
    }

    // 处理响应
    __handleResponse(data, response, keyName, globalDict={}, dict={}){

      if(!response) return undefined;

      switch(this.type(response)){
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
      let result = [];
      for(let m of response){
        result.push(this.__handleResponse(data, m, keyName, globalDict, dict));
      }
      return result;
    }

    // 处理 object
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
            result = result.filter(m => {
              // 有验证的类型
              let gatherDict = Object.assign({}, globalDict,
                  this.type(data) == "object" ? data : {},
                  this.type(m) == "object" ? m : {});
              const validCode = '"use strict"\n' + this.format(response.valideach, gatherDict, true);
              return eval(validCode);
            });
        }
        break;
        case "object": {
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
          if(response.attribute){
            let attr;
            let transAttrbite = this.secureAttributeList.find(e => e[0] == response.attribute)
            if(transAttrbite)
              attr = transAttrbite[1];
            else
              attr = response.attribute;
            result = e.getAttribute(attr);
            // 修复 url
            if(this.fixurlAttributeList.indexOf(attr) >= 0)
              result = this.fixurl(result, globalDict.host);
            if(attr == 'innerHTML')
              result = this.__reverseTransformHTMLTagProperty(result);
          }
          else
            result = this.__getValue(e, keyName, globalDict, dict);

          if(result == undefined) return result;
          // 用 remove 键指定删除一些值
          if(response.remove){
            let regex = new RegExp(response.remove, 'gi');
            result = result.replace(regex, '');
          }

          // 使用 extract 提取最终结果
          if(response.extract){
            let regex = new RegExp(response.extract, 'i'); // 只匹配地址一个结果
            let matcher = result.match(regex);
            if(!matcher) return undefined;
            result = matcher[1];
          }
        }
        break;
        case "boolean": {
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
              this.type(data) == "object" ? data : {}, dict);
          result = this.format(response.value, gatherDict);
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
            this.type(data) == "object" ? data : {}, dict);
        const validCode = '"use strict"\n' + this.format(response.valid, gatherDict, true);
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

    // 获取值
    __getValue(element, keyName, globalDict={}, dict={}){
      if(element && element.querySelector){
        let result;
        if(!keyName)
          return element.textContent.trim();

        let matched = false;
        for(let [pattern, attr] of this.specialKey2AttributeList){
          if(keyName.match(pattern)){
            matched = true;
            if(this.type(attr) == "string"){
              result = element.getAttribute(attr);
              // 修复 url
              if(this.fixurlAttributeList.indexOf(attr) >= 0)
                result = this.fixurl(result, globalDict.host);
            }
            else if(this.type(attr) == "function")
              result = attr(element);
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

    // 获取 HTML 元素对象
    __getElement(element, selector){
      if(!element || !selector) return undefined;

      if("querySelector" in element){
        // html
        return element.querySelector(selector);
      }
      else{
        // json
        return this.__getDataFromObject(element, selector);
      }
    }

    // 获取所有匹配值
    __getAllElements(element, selector){
      if(!element || !selector) return undefined;

      if("querySelectorAll" in element){
        return Array.from(element.querySelectorAll(selector));
      }
      else{
        return this.__getDataFromObject(element, selector) || [];
      }
    }

    // 从 Object 中获取数据
    __getDataFromObject(obj, key){

      function operatorFilter(element, args){
        let codeStart = '"use strict"\n';
        let env = `var $element=${JSON.stringify(element)};\n`;
        let code = codeStart + env + args[0];
        return eval(code);
      }

      function splitKeyAndOperatorAndArgs(operatorAndArgs){
        if(!operatorAndArgs) return [];
        let i = operatorAndArgs.indexOf('#');
        if(i < 0)
          return [operatorAndArgs];
        let key = operatorAndArgs.substring(0, i);
        operatorAndArgs = operatorAndArgs.substring(i+1);

        i = operatorAndArgs.indexOf('(');
        if(i < 0)  return [key, operatorAndArgs, undefined];
        let opertaor = operatorAndArgs.substring(0, i);
        let args = operatorAndArgs.substring(i);
        if(args.length > 2)
          args = args.substring(1, args.length - 1).split('#').map(e => JSON.parse(e));
        else
          args = [];
        return [key, opertaor, args];
      }

      if(!obj || !key) return obj;
      const keys = key.split('::');
      let result = obj;
      for(let key of keys){
        if(!result) return undefined;

        let [k, operator, args] = splitKeyAndOperatorAndArgs(key);

        if(this.type(result) == 'array'){
          // 多个值的情况
          if(operator == 'concat')
            result = result.reduce((s, m) => s.concat(m[k]), []);
          else if(operator == "filter")
            result = result.map(m => m[k])
              .filter(e => operatorFilter(e, args));
          else
            result = result.map(m => m[k]);
        }
        else{
          // 单个值的情况
          if(operator == "filter"){
            result = result[k];
            if(this.type(result) == 'array')
              result = result.filter(e => operatorFilter(e, args));
          }
          else
            result = result[k];
        }
      }
      return result
    }


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
    // stringify 为 true 表示将属性先 stringify 再放入
    format(string, object={}, stringify=false){
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
    clearHtml(html){
      if(!html) return html;

      // 清除黑名单标签
      html = this.filterHtmlContent(html);

      // 清空标签属性，排除白名单属性 src
      let whitePropertyList = ['src'];
      html = html.replace(/[\s\r\n]*([\w-]+)[\s\r\n]*=[\s\r\n]*"[^"]*"/gi, (p0, p1)=>
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

    // 过滤 HTML 中的内容，用于爬虫
    filterHtmlContent(html){
      if(!html) return html;

      // 只要 body
      const m = html.match(/<body(?: [^>]*?)?>([\s\S]*?)<\/body>/);
      if(m && m.length >= 2)
        html = m[1];

      let blackList = ['script', 'style', 'link', 'meta', 'iframe'];
      html = blackList.reduce((html, be) => this.__filterElement(html, be), html);
      return html;
    }

    // 将诸如 img 标签的 src 属性转换为 data-src 防止浏览器加载图片
    __transformHTMLTagProperty(html){
      if(!html) return html;

      // 图片的 src 属性转换成 data-src 属性
      for(let [src, dest] of this.secureAttributeList)
        html = html.replace(new RegExp(`\\b${src}=(?=["'])`, 'gi'), `${dest}=`);
      return html;
    }

    // 将之前的转换逆转回来
    __reverseTransformHTMLTagProperty(html){
      if(!html) return html;

      // 图片的 src 属性转换成 data-src 属性
      for(let [src, dest] of this.secureAttributeList)
        html = html.replace(new RegExp(`\\b${dest}=(?=["'])`, 'gi'), `${src}=`);
      return html;
    }

    // 过滤某些标签
    __filterElement(html, element, endElement=element){

      if(!html || !element) return html;

      let pattern = `<${element}( [^>]*?)?>[\\s\\S]*?</${endElement}>`;
      html = html.replace(new RegExp(pattern, 'gi'), '');
      // 去除单标签
      pattern = `<${element}([^>]*?)?>`;
      html = html.replace(new RegExp(pattern, 'gi'), '');
      return html;
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
    type(obj){
      // return $.type(obj); // 只有这里用了 jquery
      let type = typeof(obj);
      if(type != 'object')
        return type;
      return obj.constructor.name.toLowerCase();
    }

    text2html(text){
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

  }

  return Spider;
});

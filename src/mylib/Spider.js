define(["util"], function(util){
    /******* 格式说明 ************

        request 设置请求
        * url: 请求的 URL
        * method: 请求方法，缺省为 GET
        * params: 请求参数
        * type: 响应类型，可为 JSON 或 HTML，缺省为 HTML
        * cookies:

        response 设置响应对象
        * 可以为三种类型
            * array 返回对象为数组
            * object 返回对象为 list 数组或者 object
                * 如果有 type
                    * 可为 array，
                    * string；
                    * 无则为 object
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

        constructor(){

        }


        // 从配置对象中抓取并获得结果
        get({request, response}, locals={}){
            if(!response)
                throw new Error("Empty response");

            if(!request)
                request = {
                    "url": locals.url
                };

            if(util.type(request) == "string"){
                request = {
                    "url": request
                };
            }

            if(!request.url)
                throw new Error("Illegal URL");

            // 补充缺省值
            let method = (request.method || "GET").toLowerCase();
            let type = (request.type || "HTML").toLowerCase();

            // 获取 URL
            let url = util.format(request.url, locals);
            locals.host = url; // 用于修复获取到的 URL

            let requestPromise;

            switch(method){
                case "post":
                    // TODO: POST
                    break;
                case "get":
                    requestPromise = util.get(url, request.params, null,
                                    {timeout: request.timeout});
                    break;
                default:
                    throw new Error("Illegal type");
            }

            switch(type){
                case "html":
                    return requestPromise
                        .then(data => {
                            data = util.filterHtmlContent(data);
                            let html = document.createElement("div");
                            html.innerHTML = data;

                            return this.__handleResponse(html, response, null,  locals);
                        });
                case "json":
                    return requestPromise.then(data => {
                        let json = JSON.parse(data);
                        return this.__handleResponse(json, response, null, locals);
                    });
                default:
                    throw new Error("Illegal type");
            }
        }

        // 处理响应
        __handleResponse(data, response, keyName, topLocals={}, locals={}){

            if(!response) return undefined;

            switch(util.type(response)){
                case "array":
                    return this.__handleArray(data, response, keyName, topLocals, locals);
                case "object":
                    return this.__handleObject(data, response, keyName, topLocals, locals);
                case "string":
                    return this.__handleString(data, response, keyName, topLocals, locals);
                default:
                    throw new Error("Illegal type");
            }
        }

        __handleArray(data, response, keyName, topLocals={}, locals={}){
            debugger;
            let result = [];
            for(let m of response){
                result.push(this.__handleResponse(data, m, keyName, topLocals, locals));
            }
            return result;
        }

        // 处理 object
        __handleObject(data, response, keyName, topLocals={}, locals={}){

            const __privateHandleObject = () => {
                // object 类型
                let result = {};
                // let delay = [];
                for(let key in response){
                    // TODO: 把 format 类型和带有 vaild 验证功能的最后处理
                    result[key] = this.__handleResponse(data, response[key], key, topLocals, result);
                }
                return result;
            }

            if(!response.type){
                // object 类型，直接解析成员
                return __privateHandleObject();
            }

            if("valid" in response){
                // 有验证的类型
                let dict = Object.assign({}, topLocals, locals);
                const vaildCode = util.format(response.valid, dict);
                if(!eval(vaildCode))
                    return undefined; // 验证失败，返回空值
            }

            let type = response.type.toLowerCase();
            switch(type){

                case "array":
                    // array
                    if(!response.element || !response.children)
                        return undefined;
                    let result = [];
                    let list = this.__getAllElements(data, response.element);
                    for(let m of list){
                        result.push(this.__handleResponse(m, response.children, keyName, topLocals, locals));
                    }
                    return result;

                case "string":

                    if(!response.element)
                        return undefined;

                    let e = this.__getElement(data, response.element);
                    if(!e) return undefined;
                    if(response.attribute)
                        return e.getAttribute(response.attribute);
                    break;
                case "boolean":
                    if(!response.element)
                        return undefined;
                    let v = this.__getValue(data, response.element, keyName, topLocals, locals);
                    if(v && response.true == v)
                        return true;
                    if(!v || response.false == v)
                        return false;
                    return undefined;

                case "format":
                    // 合成结果
                    if(!response.value)
                        return undefined;
                    let dict = Object.assign({}, topLocals, locals);
                    return util.format(response.value, dict);

                default:
                    // 把 type 当前普通值对待
                    return __privateHandleObject();
            }
        }

        __handleString(data, response, keyName, topLocals={}, locals={}){
            return this.__getValue(data, response, keyName, topLocals, locals);
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
                return util.getDataFromObject(element, selector);
            }
        }

        // 获取所有匹配值
        __getAllElements(element, selector){
            if(!element || !selector) return undefined;

            if("querySelectorAll" in element){
                return element.querySelectorAll(selector);
            }
            else{
                return util.getDataFromObject(element, selector);
            }
        }

        // 获取值
        __getValue(element, selector, keyName, topLocals={}, locals={}){
            let e = this.__getElement(element, selector);
            if(!e) return undefined;
            if("querySelector" in element){
                if(!keyName)
                    return e.textContent;
                else if(keyName.match(/link$/i))
                    return util.fixurl(e.getAttribute("href"), topLocals.host);
                else if(keyName.match(/img$|image$/i))
                    return util.fixurl(e.getAttribute("data-src"), topLocals.host);
                else if(keyName.match(/html$/i))
                    return e.innerHTML;
                else
                    return e.textContent.trim();
            }
            else{
                // json
                return e;
            }
        }


    }

    return Spider;
});

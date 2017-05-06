;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["Chapter"] = factory(utils);
}(["utils"], function(utils) {
  "use strict"

  // **** Chapter ****
  class Chapter{

    constructor(){
      this.cid = undefined;  // 章节 id
      this.link = undefined;    // 链接
      this.title = undefined;    // 标题
      this.content = undefined;  // 内容
      this.volume = undefined; // 章节所属的卷
      // this.modifyTime = undefined;  // 修改时间
    }

    // 判断是否是 VIP
    isVIP(){
      return !this.cid && !this.link && this.title;
    }
  }

  // 判断两个标题是否相等，传入的是章节标题
  Chapter.equalTitle = function(ca, cb, options={}){


    if(ca == cb) return 4;
    if(!ca || !cb) return 0;

    let cs = [ca, cb].map(c => typeof(c) != "string" ? c.title : c);
    if(cs[0] == cs[1]) return 4;

    let {removeNumbers=false} = options;

    // 去掉标点符号
    cs = cs.map(s => Chapter.stripString(s, options));
    if(cs[0] == cs[1]) return 3;

    // 将大写数字转换为小写数字
    cs = cs.map(utils.lowerCaseNumbers);
    if(cs[0] == cs[1]) return 2;

    if(!removeNumbers) return 0;

    // 去掉所有的数字
    const numPattern = /第[\d零一二两三四五六七八九十百千万亿]+[章节卷]/g;
    cs = cs.map(c => c.replace(numPattern, ''));
    if(cs[0] == cs[1]) return 1;

    return 0;
  }

  // 比较去掉所有空格和标点符号之后的所有符号
  Chapter.stripString = function(str, {removeNumbers=false}={}){
    if(!str) return str;

    // 去除括号括起来的文字
    str = ["()", "【】", "（）", "《》", "<>"].reduce((s, e) => {
        let il = s.indexOf(e[0]);
        if(il < 0) return s;
        let ir = s.indexOf(e[1], il + 1);
        if(ir < 0) return s;
        let lstr = s.substring(0, il), rstr = s.substring(ir + 1);
        if(removeNumbers)
          return lstr + rstr;
        let mstr = s.substring(il + 1, ir);
        return lstr + mstr.replace(/[^\d零一二两三四五六七八九十百千万亿]/gi, '') + rstr;
      }, str);

    // 去除英文字符串
    str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');
    // 去除中文字符串
    str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

    // 去除空白字符
    str = str.replace(/\s/g, '');
    return str;
  }

  return Chapter;

}));

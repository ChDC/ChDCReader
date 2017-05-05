;(function(factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory();
  else
    window["Chapter"] = factory();
}(function() {
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
    const nums = '零一二两三四五六七八九';
    cs = cs.map(c =>
      c.replace(/[十百千万亿]/gi, '')
       .replace(new RegExp(`[${nums}]`, 'gi'), m => {
        let i = nums.indexOf(m);
        return i <= 2 ? i : i - 1;
      }));
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

    const repl = removeNumbers ? '' : p1 => p1.replace(/[^\d零一二两三四五六七八九十百千万亿]/gi, '');

    // 去除括号括起来的文字
    str = str.replace(/\((.*?)\)/g, repl); // 除了数字
    str = ["【】", "（）", "《》", "<>"].reduce((s, e) =>
      s.replace(new RegExp(`${e[0]}(.*?)${e[1]}`, 'gi'), repl), str);

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

;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["Chapter"] = factory.apply(undefined, deps.map(e => window[e]));
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
  Chapter.equalTitle = function(ca, cb, loose=false){

    if(ca == cb) return true;
    if(!ca || !cb) return 0;

    let cs = [ca, cb].map(c => typeof(c) != "string" ? c.title : c);
    if(cs[0] == cs[1]) return true;

    for(let [applyOnLooseMode, save, map] of Chapter.__handleTitleFuncs){
      if(!applyOnLooseMode || loose) {
        let ncs = cs.map(map);
        if(save) cs = ncs;
        if(ncs[0] == ncs[1]) return true;
      }
    }

    if(loose && (cs[0].includes(cs[1]) || cs[1].includes(cs[0])))
      return true;

    return false;


    // if(ca == cb) return weight;
    // if(!ca || !cb) return 0;

    // let cs = [ca, cb].map(c => typeof(c) != "string" ? c.title : c);
    // if(cs[0] == cs[1]) return weight;

    // // 去掉标点符号
    // cs = cs.map(s => Chapter.stripString(s, loose));
    // if(cs[0] == cs[1]) return --weight;

    // // 将大写数字转换为小写数字
    // cs = cs.map(utils.lowerCaseNumbers);
    // if(cs[0] == cs[1]) return --weight;

    // // 将 章节卷 删除
    // cs = cs.map(e => e.replace(/[第总]?0*(\d+)[弹话章节卷集]?/gi, '$1'));
    // if(cs[0] == cs[1]) return --weight;

    // if(!loose) return 0;

    // 宽松比较模式
    // if(cs[0].includes(cs[1]) || cs[1].includes(cs[0]))
    //   return --weight;

    // // 去掉所有的数字
    // cs = cs.map(c => c.replace(/\d/g, ''));
    // if(cs[0].includes(cs[1]) || cs[1].includes(cs[0]))
    //   return --weight;

    // return 0;
  }

  // 用于处理章节标题的函数
  // 第三个参数为函数，第一个为是否应用于宽松模式
  // 第二个参数表明是否保存处理后的结果
  Chapter.__handleTitleFuncs = [
    [false, true, c => Chapter.stripString(c)], // 去掉标点符号
    [false, true, utils.lowerCaseNumbers], // 将大写数字转换为小写数字
    [false, true, e => e.replace(/[第总]?0*(\d+)[弹话章节卷集]?/gi, '$1')], // 将 章节卷 删除
    [true, false, c => {let m = c.match(/\d+/); return m ? m[0] : c}], // 只比较章节号
    [true, false, c => {let m = c.replace(/\d+/, ""); return m ? m : c}], // 去掉章节号只比较章节标题
  ];

  // 在章节列表中查找相同的章节
  Chapter.findEqualChapter = function(catalog, catalogB, index, matches, loose=false){

    if(!catalog || !catalogB || !matches || !catalog.length || !catalogB.length) return -1;

    let i = -1; // 搜索到的索引

    function handleCatalog(map, save=true, compareFunc=undefined){
      let cs = map ? catalog.map(map) : catalog;
      let csB = map ? catalogB.map(map) : catalogB;
      if(save){
        catalog = cs;
        catalogB = csB;
      }

      for(const match of matches){
        i = match(cs, csB, index);
        if(i >= 0)
          return true; // 表明搜索到了结果
      }
      return false; // 没有搜索到结果
    }

    if(typeof catalog[0] == "object"){
      if(handleCatalog(c => c.title)) return i;
    }
    else{
      if(handleCatalog()) return i;
    }

    for(let [applyOnLooseMode, save, map] of Chapter.__handleTitleFuncs){
      if(!applyOnLooseMode || loose) {
        if(handleCatalog(map, save)) return i;
      }
    }

    if(!loose) return -1;

    // 包含模式
    if(handleCatalog(undefined, false, (c1, c2) => c1.includes(c2) || c2.includes(c1))) return i;

    return -1;
  }

  // 比较去掉所有空格和标点符号之后的所有符号
  Chapter.stripString = function(str, removeNumbers=false){
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

    // 去除英文标点符号
    str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');
    // 去除中文标点符号
    str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

    // 去除空白字符
    str = str.replace(/\s/g, '');
    return str;
  }

  return Chapter;

}));

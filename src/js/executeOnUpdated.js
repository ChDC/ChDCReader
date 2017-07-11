;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["executeOnUpdated"] = factory.apply(undefined, deps.map(e => window[e]));
}(['co', "utils"], function(co, utils) {
  "use strict"

  return {
    run(){
      // 每次更新都清空一次目录和章节
      this.clearCatalog();
      this.clearChapterCache();
    },

    /**
     * 清空书籍目录
     * @return {[type]} [description]
     */
    clearCatalog(){
      console.log("clear catalog");
      utils.removeData("catalog/");
    },

    /**
     * 清空缓存章节
     * @return {[type]} [description]
     */
    clearChapterCache(){
      console.log("clear chapter cache");
      utils.removeData("chapter/", true);
    }
  }

}));

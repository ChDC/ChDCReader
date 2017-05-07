;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["executeOnUpdated"] = factory(co, utils);
}(['co', "utils"], function(co, utils) {
  "use strict"

  return {
    run(){
      // 每次更新都清空一次目录和章节
      this.clearCatalog();
      this.clearChapterCache();
    },

    clearCatalog(){
      console.log("clear catalog");
      utils.removeData("catalog/");
    },

    clearChapterCache(){
      console.log("clear chapter cache");
      utils.removeData("chapter/", true);
    }
  }

}));

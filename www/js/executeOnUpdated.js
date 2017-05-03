"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["executeOnUpdated"] = factory();
})(['co', "utils"], function (co, utils) {
  "use strict";

  return {
    run: function run() {
      this.clearCatalog();
      this.clearChapterCache();
    },
    clearCatalog: function clearCatalog() {
      console.log("clear catalog");
      utils.removeData("catalog/");
    },
    clearChapterCache: function clearChapterCache() {
      console.log("clear chapter cache");
      utils.removeData("chapter/", true);
    }
  };
});
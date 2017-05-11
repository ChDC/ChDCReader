;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["BookSourceManager_test"] = factory(chai, utils, BookSourceManager, customBookSource);
}(["chai", "utils", "BookSourceManager", "CustomBookSource", "Chapter", "../test/testbook"], function(chai, utils, BookSourceManager, customBookSource, Chapter, testbook){

  let assert = chai.assert;
  let equal = assert.equal;


  describe('BookSourceManager 基础测试', () => {

    let bsm;

    before(()=>{
      bsm = new BookSourceManager(undefined, customBookSource);
      return bsm.loadConfig("data/booksources.json");
    });

    it('全局搜索', () => {
      return bsm.searchBookInAllBookSource("三生三世十里桃花")
            .then(books => {
              equal(true, books.length >= 0);
              equal("三生三世十里桃花", books.find(b => b.name == "三生三世十里桃花").name);
            })
    });

  });

  // 小说书源测试
  let bsids = [  "omanhua", "2manhua", "57mh", "77mh", "yyls",
    "qqbook", "sfnovel", "qqac", "u17", "comico", "biquge.tw",
    "biqulou",  "daizhuzai" , "dingdian", "qidian"];

  // let trashBsids = ["733dm", "dangniao", "chuiyao", "biquge", "biqugezw", "chuangshi",];

  let bsm = new BookSourceManager(undefined, customBookSource);
  return Promise.all([bsm.loadConfig("data/booksources.json"),
    utils.getJSON("test/BookSourceManager.test.data.json").then(data => {
      let config = data;
        for(let bsid of bsids)
        // for(let bsid of ["2manhua"])
          testbook.testBook(bsid, bsm, config[bsid]);
    })]);

}));

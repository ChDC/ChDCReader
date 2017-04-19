define(["chai", "util", "translate"], function(chai, util, translate){

  let assert = chai.assert;
  let equal = assert.equal;


  describe("translate", () => {
    let sc = ["ReLIFE 重返17岁", "依照日期", "依照种类", "依照排名", "漫画新手村", "report167. 不纯的愿动机"];
    let tc = ["ReLIFE 重返17歲", "依照日期", "依照種類", "依照排名", "漫畫新手村","report167. 不純的願動機"];

    it('转换为简体中文', () => {
      equal(undefined, translate.toSimpleChinese());
      sc.forEach((e,i) => equal(e, translate.toSimpleChinese(tc[i])));
    });

    it('转换为繁体中文', () => {
      equal(undefined, translate.toTraditionChinese());
      tc.forEach((e,i) => equal(e, translate.toTraditionChinese(sc[i])));
    });
  });

});

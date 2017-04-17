"use strict";

define(["mocha", "Test", "../test/BookSourceManager.test", "../test/Spider.test"], function (mocha, Test, BookSourceManagerTest, SpiderTest) {

  return {
    doTest: function doTest(output, error) {
      var test = new Test(output, error);
      bsmTest = new BookSourceManagerTest(test);
      return bsmTest.doTest();
    },
    doSoleTest: function doSoleTest() {
      debugger;
      mocha.run();
      var test = new Test();
      st = new SpiderTest(test);
      return st.doTest();
    }
  };
});
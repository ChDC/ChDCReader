define(["mocha", "Test", "../test/BookSourceManager.test", "../test/Spider.test"], function(mocha, Test, BookSourceManagerTest, SpiderTest){

  return {
    doTest(output, error){
      let test = new Test(output, error);
      bsmTest = new BookSourceManagerTest(test);
      return bsmTest.doTest();
    },

    doSoleTest(){
      debugger;
      mocha.run();
      let test = new Test();
      st = new SpiderTest(test);
      return st.doTest();
    }
  };
});

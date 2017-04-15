"use strict";

define(["jquery", "util", "Test", "../test/BookSourceManager.test", "../test/Spider.test"], function ($, util, Test, BookSourceManagerTest, SpiderTest) {

    return {
        doTest: function doTest(output, error) {
            test = new Test(output, error);
            bsmTest = new BookSourceManagerTest(test);
            return bsmTest.doTest();
        },
        doSoleTest: function doSoleTest() {

            test = new Test();
            st = new SpiderTest(test);
            return st.doTest();
        }
    };
});
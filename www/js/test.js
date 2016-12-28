define(["../lib/jquery-3.1.1/jquery.min", "util"], function($, util) {
    "use strict"

    console.log('hello');

    // 从副列表中匹配查询主列表的元素
    function listMatch(mainArray, viceArray, index, compareFunction){
        var i, j;
        i = util.arrayIndex(viceArray, item, compareFunction);
        return i;
    }

    var lm = ['A', 'B', 'C', 'D', 'E', 'G'];
    var lv = ['0', 'A', 'B', 'E', 'D', 'F', 'B'];

    function compare(ia, ib){
        return ia == ib;
    }

    console.log(listMatch(lm, lv, 'A', compare));
});

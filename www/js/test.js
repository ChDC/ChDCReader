define(["../lib/jquery-3.1.1/jquery.min", "util"], function($, util) {
    "use strict"

    console.log('hello');


    var lm = ['A', 'B', 'C', 'D', 'E', 'G'];
    var lv = ['0', 'B', 'A', 'B', 'E', 'D', 'F', 'B'];

    function compare(ia, ib){
        return ia == ib;
    }

    function print(title, gi, ri){
        var s = "Compare" + title + ": " + gi + ', ' + ri;
        if(gi == ri)
            console.log(s);
        else
            console.error(s);
    }
    print('A', listMatch(lm, lv, 0, compare), 2);
    print('B', listMatch(lm, lv, 1, compare), 3); // 重复元素
    print('D', listMatch(lm, lv, 3, compare), 5); // 乱序元素
    print('E', listMatch(lm, lv, 4, compare), 4); // 乱序元素
    print('G', listMatch(lm, lv, 5, compare), -1); // 不存在元素


});

define(["../lib/jquery-3.1.1/jquery.min", "util"], function($, util) {
    "use strict"

    console.log('hello');

    // 从副列表中匹配查询主列表的元素
    function listMatch(mainArray, viceArray, index, compareFunction){

        // 比较邻居
        function compareNeighbor(index){

        }

        // 提供最优结果
        // 最终从所有结果中选出一个最好的
        var result = [];
        var i, j;

        var item = mainArray[index];

        i = util.arrayIndex(viceArray, item, compareFunction);
        if(i < 0){
            // 没找到一个结果
            return -1;
        }
        // 找到结果，开始分析
        // 比对前邻和后邻是否相同
        result.append({
            index: i,
        });

        return i;
    }

    var lm = ['A', 'B', 'C', 'D', 'E', 'G'];
    var lv = ['0', 'B', 'A', 'B', 'E', 'D', 'F', 'B'];

    function compare(ia, ib){
        return ia == ib;
    }

    function print(title, gi, ri){
        var s = "Compare" + title + ": " + gi + ', ' + 'ri';
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

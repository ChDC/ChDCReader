define(["../lib/jquery-3.1.1/jquery.min", "util"], function($, util) {
    "use strict"

    console.log('hello');

    // 从副列表中匹配查询主列表的元素
    function listMatch(listA, listB, indexA, compareFunction){

        // 比较前、后 n 个邻居
        function compareNeighbor(indexB, offset){
            var nia = indexA + offset;
            var nib = indexB + offset;
            var equal = -1;
            if(nia < 0 || nia >= listA.length)
                // 如果 indexA 越界，则返回 2
                leftEqual = 2;
            else if(nib < 0 || nib >= listB.length)
                // 如果 indexA 越界，则返回 1
                leftEqual = 1;
            else
                // 如果两者相等，则返回 3
                // 如果不相等则返回 0
                leftEqual = compareFunction(listA[nia], listB[nib]) ? 3 : 0;
        }

        // 提供最优结果
        // 最终从所有结果中选出一个最好的
        var result = [];
        var i, j, r;

        var itemA = listA[indexA];
        i = -1;

        while(true)
        {
            i = util.arrayIndex(listB, itemA, compareFunction, i+1);
            if(i < 0){
                // 没找到结果
                // 返回结果集合中的一个最优结果

                // 最优结果：权值最大，并且索引值最靠近 indexA



                return -1;
            }
            // 找到结果，开始分析
            // 比对前邻和后邻是否相同
            var leftEqual = compareNeighbor(i, -1) + 0.5; // 前面的权重大
            var rightEqual = compareNeighbor(i, 1);

            r = compareNeighbor(i);
            result.append({
                index: i,
                weight: leftEqual + rightEqual
            });
        }

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

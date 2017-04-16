"use strict"

require(["../js/config"], function(){
    requirejs(["mocha"], function(mocha){

        mocha.setup('bdd');
        //---- 配置要测试的模块 ---
        let testList = [
            "mocha",
            "util",
        ];

        //---- 配置结束 ----

        require(testList.map(e => `../test/${e}.test`), function(){
            mocha.run();
        })
    });
});



"use strict";

require(["../js/config"], function () {
    requirejs(["mocha"], function (mocha) {

        mocha.setup('bdd');
        mocha.timeout(10000);

        var testList = ["mocha", "BookSourceManager", "util", "translate", "Spider"];

        require(testList.map(function (e) {
            return "../test/" + e + ".test";
        }), function () {
            mocha.run();
        });
    });
});
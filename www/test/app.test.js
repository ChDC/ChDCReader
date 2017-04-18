"use strict";

require(["../js/config"], function () {
    requirejs(["mocha"], function (mocha) {

        mocha.setup('bdd');
        mocha.timeout(5000);

        var testList = ["util", "Spider", "BookSourceManager"];

        require(testList.map(function (e) {
            return "../test/" + e + ".test";
        }), function () {
            mocha.run();
        });
    });
});
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {
    var Test = function () {
        function Test(output, error) {
            _classCallCheck(this, Test);

            this.output = output || console.log.bind(console);
            this.error = error || console.error.bind(console);
            this.log = this.output;
        }

        _createClass(Test, [{
            key: "areEqual",
            value: function areEqual(expect, actual) {}
        }]);

        return Test;
    }();

    return Test;
});
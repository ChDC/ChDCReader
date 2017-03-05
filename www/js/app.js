"use strict";

requirejs.config({
    "baseUrl": "js",
    "shim": {
        "bootstrap": { "deps": ['jquery'] },
        "co": { deps: [], exports: 'co' }
    },
    "paths": {
        "lib": "../lib",
        "jquery": "../lib/jquery-3.1.1/jquery.min",
        "co": "../lib/co",
        "bootstrap": "../lib/bootstrap-3.3.7/js/bootstrap.min",
        "polyfill": "../lib/polyfill.min",
        "common": "common"
    }
});

requirejs(['polyfill']);
requirejs(["main"]);
"use strict"
requirejs.config({
    "baseUrl": "js",
    "shim" : {
        "bootstrap" : { "deps" :['jquery'] }
    },
    "paths": {
        "lib": "../lib",
        "jquery" : "../lib/jquery-3.1.1/jquery.min",
        "bootstrap" :  "../lib/bootstrap-3.3.7/js/bootstrap.min",
        "common": "common"
    }
});

requirejs(["main"]);

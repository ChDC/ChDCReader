"use strict"

requirejs.config({
  "baseUrl": "js",
  "shim" : {
    "bootstrap" : { "deps" :['jquery'] },
    "co": { deps:[], exports: 'co' },
    "mocha": {deps:[], exports: "mocha"}
  },
  "paths": {
    "lib": "../lib",
    "mylib": "../mylib",
    "jquery" : "../lib/jquery-3.1.1/jquery.min",
    "jqueryui": "../lib/jquery-ui-1.12.1/jquery-ui.min",
    "sortablejs": "../lib/sortablejs-1.5.1/Sortable",
    "co": "../lib/co",
    "bootstrap" :  "../lib/bootstrap-3.3.7/js/bootstrap.min",
    "polyfill" : "../lib/polyfill.min",
    "common": "common",
    "mocha": "../lib/mocha/mocha",
    "chai": "../lib/chai",

    "util": "../mylib/util",
    "uiutil": "../mylib/uiutil",
    "Test": "../mylib/Test",
    "Page": "../mylib/Page",
    "PageManager": "../mylib/PageManager",
    "Spider": "../mylib/Spider"
  }
});

requirejs(['polyfill']);

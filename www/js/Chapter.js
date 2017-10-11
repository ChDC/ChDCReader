"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["Chapter"] = factory.apply(undefined, deps.map(function (e) {
    return window[e];
  }));
})(["utils"], function (utils) {
  "use strict";

  var Chapter = function () {
    function Chapter() {
      _classCallCheck(this, Chapter);

      this.cid = undefined;
      this.link = undefined;
      this.title = undefined;
      this.content = undefined;
      this.volume = undefined;
    }

    _createClass(Chapter, [{
      key: "isVIP",
      value: function isVIP() {
        return !this.cid && !this.link && this.title;
      }
    }]);

    return Chapter;
  }();

  Chapter.equalTitle = function (ca, cb) {
    var loose = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


    if (ca == cb) return true;
    if (!ca || !cb) return 0;

    var cs = [ca, cb].map(function (c) {
      return typeof c != "string" ? c.title : c;
    });
    if (cs[0] == cs[1]) return true;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Chapter.__handleTitleFuncs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 3),
            applyOnLooseMode = _step$value[0],
            save = _step$value[1],
            map = _step$value[2];

        if (!applyOnLooseMode || loose) {
          var ncs = cs.map(map);
          if (save) cs = ncs;
          if (ncs[0] == ncs[1]) return true;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (loose && (cs[0].includes(cs[1]) || cs[1].includes(cs[0]))) return true;

    return false;
  };

  Chapter.__handleTitleFuncs = [[false, true, function (c) {
    return Chapter.stripString(c);
  }], [false, true, utils.lowerCaseNumbers], [false, true, function (e) {
    return e.replace(/[第总]?0*(\d+)[弹话章节卷集]?/gi, '$1');
  }], [true, false, function (c) {
<<<<<<< HEAD
    var m = c.match(/^\d+/);return m ? m[0] : c;
  }], [true, false, function (c) {
    var m = c.replace(/^\d+/, "");return m ? m : c;
=======
    var m = c.replace(/^\d+/, "");return m ? m : c;
  }], [true, false, function (c) {
    var m = c.match(/^\d+/);return m ? m[0] : c;
>>>>>>> dev
  }]];

  Chapter.findEqualChapter = function (catalog, catalogB, index, matches) {
    var loose = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;


    if (!catalog || !catalogB || !matches || !catalog.length || !catalogB.length) return -1;

    var i = -1;

    function handleCatalog(map) {
      var save = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var compareFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

      var cs = map ? catalog.map(map) : catalog;
      var csB = map ? catalogB.map(map) : catalogB;
      if (save) {
        catalog = cs;
        catalogB = csB;
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = matches[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var match = _step2.value;

          i = match(cs, csB, index);
          if (i >= 0) return true;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return false;
    }

    if (_typeof(catalog[0]) == "object") {
      if (handleCatalog(function (c) {
        return c.title;
      })) return i;
    } else {
      if (handleCatalog()) return i;
    }

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = Chapter.__handleTitleFuncs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _step3$value = _slicedToArray(_step3.value, 3),
            applyOnLooseMode = _step3$value[0],
            save = _step3$value[1],
            map = _step3$value[2];

        if (!applyOnLooseMode || loose) {
          if (handleCatalog(map, save)) return i;
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    if (!loose) return -1;

    if (handleCatalog(undefined, false, function (c1, c2) {
      return c1.includes(c2) || c2.includes(c1);
    })) return i;

    return -1;
  }, Chapter.stripString = function (str) {
    var removeNumbers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (!str) return str;

    str = ["()", "【】", "（）", "《》", "<>"].reduce(function (s, e) {
      var il = s.indexOf(e[0]);
      if (il < 0) return s;
      var ir = s.indexOf(e[1], il + 1);
      if (ir < 0) return s;
      var lstr = s.substring(0, il),
          rstr = s.substring(ir + 1);
      if (removeNumbers) return lstr + rstr;
      var mstr = s.substring(il + 1, ir);
      return lstr + mstr.replace(/[^\d零一二两三四五六七八九十百千万亿]/gi, '') + rstr;
    }, str);

    str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');

    str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

    str = str.replace(/\s/g, '');
    return str;
  };

  return Chapter;
});
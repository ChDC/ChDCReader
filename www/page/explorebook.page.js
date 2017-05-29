"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "utils", "uiutils", "cookie"], function ($, app, Page, utils, uiutils, cookie) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      var _this = _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).call(this));

      _this.scrollTop = 0;
      _this.container = $('.container');
      return _this;
    }

    _createClass(MyPage, [{
      key: "onLoad",
      value: function onLoad(_ref) {
        var params = _ref.params;

        this.loadView();
      }
    }, {
      key: "onPause",
      value: function onPause() {
        this.scrollTop = this.container.scrollTop();
      }
    }, {
      key: "onResume",
      value: function onResume() {
        this.container.scrollTop(this.scrollTop);
      }
    }, {
      key: "loadData",
      value: function loadData() {
        var _this2 = this;

        return utils.getJSON('data/exploresource.json').then(function (json) {
          _this2.exploresources = {};
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = json.valid[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var key = _step.value;

              _this2.exploresources[key] = json.sources[key];
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
        });
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this3 = this;

        $('#btnClose').click(function (e) {
          return _this3.close();
        });
        this.loadData().then(function () {
          return _this3.loadList();
        });
      }
    }, {
      key: "loadList",
      value: function loadList() {
        var _this4 = this;

        var list = $('#list').empty();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          var _loop = function _loop() {
            var key = _step2.value;

            var es = _this4.exploresources[key];
            var ese = $('.template > .list-item').clone();
            ese.find("img.booksource-logo").attr('src', es.logo ? es.logo : "img/logo/" + key + ".png").attr('alt', app.bookSourceManager.getBookSource(key).name);

            ese.click(function (e) {
              return _this4.showExplorPage(key, es);
            });
            list.append(ese);
          };

          for (var _iterator2 = Object.keys(this.exploresources)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            _loop();
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
      }
    }, {
      key: "showExplorPage",
      value: function showExplorPage(bsid, es) {
        var ref = window.open(es.url, "_blank", "location=no,clearcache=yes,clearsessioncache=yes,zoom=no");
        this.configBrowser(bsid, ref, es);
      }
    }, {
      key: "configBrowser",
      value: function configBrowser(bsid, ref, es) {
        ref.addEventListener("loadstart", function (e) {
          var url = e.url;
          var executeScriptOnLoadStart = "";
          var insertCSS = es.insertCSS ? es.insertCSS + "\n" : "";

          if (es.remove) insertCSS += es.remove.join(", ") + "{display: none;}";

          if (insertCSS) executeScriptOnLoadStart += "\n            document.addEventListener(\"DOMContentLoaded\", function(){\n              var newStyle = document.createElement(\"style\");\n              newStyle.innerHTML = '" + insertCSS + "';\n              document.head.appendChild(newStyle);\n              " + getRemoveCode(es.remove) + "\n            });\n          ";

          executeScriptOnLoadStart += es.executeScriptOnLoadStart || "";

          if (executeScriptOnLoadStart) ref.executeScript({ code: executeScriptOnLoadStart });

          if (es.interceptor) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              var _loop2 = function _loop2() {
                var config = _step3.value;

                var matcher = url.match(config.match);
                if (!matcher) return "continue";

                ref.executeScript({ code: "window.stop();" });
                var action = void 0,
                    target = void 0;
                if (utils.type(config.goto) == "string") {
                  if (config.goto.match(/^https?:\/\//i) || config.goto.match(/^\//i)) action = urlAction;else action = pageAction;
                  target = config.goto;
                } else {
                  action = config.goto.type == "page" ? pageAction : urlAction;
                  target = config.goto.target;
                }
                if (config.execute) ref.executeScript({ code: config.execute }, function () {
                  return action(matcher, target);
                });else action(matcher, target);
                return "break";
              };

              _loop3: for (var _iterator3 = es.interceptor[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _ret2 = _loop2();

                switch (_ret2) {
                  case "continue":
                    continue;

                  case "break":
                    break _loop3;}
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
          }
        });

        ref.addEventListener('loadstop', function (e) {
          var executeScriptOnLoadStop = es.executeScriptOnLoadStop ? es.executeScriptOnLoadStop + "\n" : "";


          if (executeScriptOnLoadStop) ref.executeScript({ code: executeScriptOnLoadStop });
        });

        function pageAction(matcher, pageName) {
          ref.hide();
          app.showLoading();
          var bookid = matcher[1];
          app.bookSourceManager.getBookInfo(bsid, { bookid: bookid }).then(function (book) {
            app.hideLoading();
            app.page.showPage(pageName, { book: book }).then(function (page) {
              page.addEventListener('myclose', function () {
                ref.show();
              });
            });
          });
        }

        function urlAction(matcher, target) {
          debugger;
          ref.executeScript({ code: "debugger;window.location.href = \"" + target + "\";" });
        };

        function getRemoveCode(remove) {
          if (!remove) return "";
          return "\n          var arr = " + JSON.stringify(remove) + ";\n          for(var i = 0; i < arr.length; i++){\n            var es = document.querySelectorAll(arr[i]);\n            for(var j = 0; j < es.length; j++)\n              es[j].style.display = \"none\";\n          }\n        ";
        }
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
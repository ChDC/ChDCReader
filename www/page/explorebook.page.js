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

      return _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).apply(this, arguments));
    }

    _createClass(MyPage, [{
      key: "onLoad",
      value: function onLoad(_ref) {
        var params = _ref.params;

        this.loadView();
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

        ref.addEventListener("loadstart", function (e) {
          var url = e.url;

          if (es.executeScriptOnLoadStart) ref.executeScript({ code: es.executeScriptOnLoadStart });

          var _arr = ["readbook", "bookdetail"];

          var _loop2 = function _loop2() {
            var pageName = _arr[_i];
            if (!(pageName in es)) return "continue";
            var config = es[pageName];
            var matcher = url.match(config.matcher);
            if (!matcher) return "continue";

            var action = function action() {
              ref.hide();
              app.showLoading();
              var bookid = matcher[1];
              app.bookSourceManager.getBookInfo(bsid, { bookid: bookid }).then(function (book) {
                app.hideLoading();
                app.page.showPage(pageName, { book: book }).then(function (page) {
                  page.addEventListener('myclose', function () {
                    ref.show();
                    ref.executeScript({ code: "history.back()" });
                  });
                });
              });
            };
            if (config.executeScript) ref.executeScript({ code: config.executeScript }, action);else action();
          };

          for (var _i = 0; _i < _arr.length; _i++) {
            var _ret2 = _loop2();

            if (_ret2 === "continue") continue;
          }
        });

        ref.addEventListener('loadstop', function (e) {
          var url = e.url;
          if (es.insertCSS) ref.insertCSS({ code: es.insertCSS });
          if (es.executeScriptOnLoadStop) ref.executeScript({ code: es.executeScriptOnLoadStop });
        });
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
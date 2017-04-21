"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "util", "uiutil"], function ($, app, Page, util, uiutil) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      return _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).apply(this, arguments));
    }

    _createClass(MyPage, [{
      key: "onLoad",
      value: function onLoad(params) {
        this.loadView(params);
      }
    }, {
      key: "loadView",
      value: function loadView(params) {
        var url = "http://m.qidian.com/";
        var ref = window.open(url, "_blank", "location=no");


        ref.addEventListener("exit", function (e) {});
        ref.addEventListener("loadstart", function (e) {
          console.log(e.url);
          var url = e.url;
          var matcher = url.match("^http://m.qidian.com/book/(\\d+)/\\d+.*");
          if (matcher) {
            ref.hide();
            var bookid = matcher[1];
            debugger;
            app.bookSourceManager.getBookInfo("qidian", { bookid: bookid }).then(function (book) {
              app.page.showPage("readbook", { book: book }).then(function (page) {
                page.addEventListener('myclose', function () {
                  ref.show();
                  ref.executeScript({ code: "history.back()" });
                });
              });
            });
          }
        });
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});
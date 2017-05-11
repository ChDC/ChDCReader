"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["jquery", "utils", "uiutils", "mocha", "testbook", "BookSourceManager", "CustomBookSource"], function ($, utils, uiutils, mocha, testbook, BookSourceManager, customBookSource) {
  var MyPage = function () {
    function MyPage() {
      _classCallCheck(this, MyPage);
    }

    _createClass(MyPage, [{
      key: "onLoad",
      value: function onLoad() {
        this.loadView();
      }
    }, {
      key: "loadData",
      value: function loadData() {
        var data = localStorage.getItem("data");
        if (!data) return;
        data = JSON.parse(data);
        Array.from($("input")).forEach(function (e) {
          switch (e.type) {
            case "checkbox":
              e.checked = data.shift() || false;

              break;
            default:
              e.value = data.shift() || "";
              break;
          }
        });
        Array.from($("select")).forEach(function (e) {
          return e.value = data.shift() || "";
        });
        Array.from($("textarea")).forEach(function (e) {
          return e.value = data.shift() || "";
        });
      }
    }, {
      key: "saveData",
      value: function saveData() {
        var data = [];

        Array.from($("input")).forEach(function (e) {
          switch (e.type) {
            case "checkbox":
              data.push(e.checked);
              break;
            default:
              data.push(e.value);
              break;
          }
        });
        Array.from($("select")).forEach(function (e) {
          return data.push(e.value);
        });
        Array.from($("textarea")).forEach(function (e) {
          return data.push(e.value);
        });
        localStorage.setItem("data", JSON.stringify(data));
      }
    }, {
      key: "createStringConfig",
      value: function createStringConfig(element) {
        var objString = "\n      {\n        \"type\": \"string\",\n        \"element\": \"" + element.find(".element").val().trim() + "\",\n        \"attribute\": \"" + element.find(".attribute").val().trim() + "\",\n        \"remove\": \"" + element.find(".remove").val().trim() + "\",\n        \"extract\": \"" + element.find(".extract").val().trim() + "\"\n      }\n      ";
        var obj = JSON.parse(objString);
        obj.attribute = obj.attribute || undefined;
        obj.remove = obj.remove || undefined;
        obj.extract = obj.extract || undefined;

        if (!obj.attribute && !obj.remove && !obj.extract) return "\"" + obj.element + "\"";else return JSON.stringify(obj);
      }
    }, {
      key: "createCatalogConfig",
      value: function createCatalogConfig() {
        var hasVolume = !!$('#catalogConfig .response .volume-selector').val().trim();
        if (hasVolume) {
          return "\n          \"element\": \"" + $('#catalogConfig .response .volume-selector').val().trim() + "\",\n          " + ($('#catalogConfig .response .reverseVolume')[0].checked ? '"reverse": true, ' : "") + "\n          \"children\": {\n            \"name\": " + this.createStringConfig($('#catalogConfig .response .volume-name')) + ",\n            \"chapters\": {\n              \"type\": \"array\",\n              \"element\": \"" + $('#catalogConfig .response .list-selector').val().trim() + "\",\n              " + ($('#catalogConfig .response .reverseCatalog')[0].checked ? '"reverse": true, ' : "") + "\n              \"children\": {\n                \"title\": " + this.createStringConfig($('#catalogConfig .response .title')) + ",\n                \"link\": " + this.createStringConfig($('#catalogConfig .response .link')) + "\n              }\n            }\n          }\n        ";
        } else return "\n          \"element\": \"" + $('#catalogConfig .response .list-selector').val().trim() + "\",\n          " + ($('#catalogConfig .response .reverseCatalog')[0].checked ? '"reverse": true, ' : "") + "\n          \"children\": {\n            \"title\": " + this.createStringConfig($('#catalogConfig .response .title')) + ",\n            \"link\": " + this.createStringConfig($('#catalogConfig .response .link')) + "\n          }\n      ";
      }
    }, {
      key: "makeBookSource",
      value: function makeBookSource() {
        var bookSource = "\n    {\n      \"id\": \"" + $('#basicConfig .id').val().trim() + "\",\n      \"type\": \"" + $('#basicConfig .type').val().trim() + "\",\n      \"name\": \"" + $('#basicConfig .name').val().trim() + "\",\n      \"contentSourceWeight\": " + $('#basicConfig .contentSourceWeight').val().trim() + ",\n      \"mainSourceWeight\": " + $('#basicConfig .mainSourceWeight').val().trim() + ",\n      " + ($('#basicConfig .tc')[0].checked ? '"language": "tc",' : "") + "\n      \"officialurls\": {\n        \"host\": \"" + $('#basicConfig .host').val().trim() + "\",\n        \"bookdetail\": \"\",\n        \"bookchapter\": \"\",\n        \"booksearch\": \"\"\n      },\n      \"search\": {\n        \"request\": {\n          \"type\": \"" + $('#searchConfig .request .datatype').val().trim() + "\",\n          \"url\": \"" + $('#searchConfig .request .url').val().trim() + "\"" + ($('#searchConfig .request .timeout').val().trim() ? ",\n          " : "") + ($('#searchConfig .request .timeout').val().trim() ? "\"timeout\": " + $('#searchConfig .request .timeout').val().trim() : "") + "\n        },\n        \"response\": {\n          \"type\": \"array\",\n          \"element\": \"" + $('#searchConfig .response .list-selector').val().trim() + "\",\n          " + ($('#searchConfig .response .reverse')[0].checked ? '"reverse": true, ' : "") + "\n          \"children\": {\n            \"name\": " + this.createStringConfig($('#searchConfig .response .bookinfo .name')) + ",\n            \"author\": " + this.createStringConfig($('#searchConfig .response .bookinfo .author')) + ",\n            \"catagory\": \"\",\n            \"complete\": {\n              \"type\": \"boolean\",\n              \"default\": false\n            },\n            \"coverImg\": " + this.createStringConfig($('#searchConfig .response .bookinfo .coverImg')) + ",\n            \"introduce\": " + this.createStringConfig($('#searchConfig .response .bookinfo .introduce')) + ",\n            \"bookid\": " + this.createStringConfig($('#searchConfig .response .bookinfo .id')) + "\n          }\n        }\n      },\n      \"detail\": {\n        \"request\": {\n          \"type\": \"" + $('#detailConfig .request .datatype').val().trim() + "\",\n          \"url\": \"" + $('#detailConfig .request .url').val().trim() + "\"" + ($('#detailConfig .request .timeout').val().trim() ? ",\n          " : "") + ($('#detailConfig .request .timeout').val().trim() ? "\"timeout\": " + $('#detailConfig .request .timeout').val().trim() : "") + "\n        },\n        \"response\": {\n          \"name\": " + this.createStringConfig($('#detailConfig .response .bookinfo .name')) + ",\n          \"author\": " + this.createStringConfig($('#detailConfig .response .bookinfo .author')) + ",\n          \"catagory\": \"\",\n          \"complete\": {\n            \"type\": \"boolean\",\n            \"default\": false\n          },\n          \"coverImg\": " + this.createStringConfig($('#detailConfig .response .bookinfo .coverImg')) + ",\n          \"introduce\": " + this.createStringConfig($('#detailConfig .response .bookinfo .introduce')) + ",\n          \"lastestChapter\": " + this.createStringConfig($('#detailConfig .response .bookinfo .lastestChapter')) + "\n        }\n      },\n      \"catalog\": {\n        \"request\": {\n          \"type\": \"" + $('#catalogConfig .request .datatype').val().trim() + "\",\n          \"url\": \"" + $('#catalogConfig .request .url').val().trim() + "\"" + ($('#catalogConfig .request .timeout').val().trim() ? ",\n          " : "") + ($('#catalogConfig .request .timeout').val().trim() ? "\"timeout\": " + $('#catalogConfig .request .timeout').val().trim() : "") + "\n        },\n        " + (!!$('#catalogConfig .response .volume-selector').val().trim() ? '"hasVolume": true,' : "") + "\n        \"response\":{\n          \"type\": \"array\",\n          " + this.createCatalogConfig() + "\n        }\n      },\n      \"chapter\": {\n        \"request\": {\n          \"type\": \"" + $('#chapterConfig .request .datatype').val().trim() + "\",\n          \"url\": \"" + $('#chapterConfig .request .url').val().trim() + "\"" + ($('#chapterConfig .request .timeout').val().trim() ? ",\n          " : "") + ($('#chapterConfig .request .timeout').val().trim() ? "\"timeout\": " + $('#chapterConfig .request .timeout').val().trim() : "") + "\n        },\n        \"response\": {\n          \"contentHTML\": " + this.createStringConfig($('#chapterConfig .response .chapterinfo .contentHTML')) + ",\n          \"title\": " + this.createStringConfig($('#chapterConfig .response .chapterinfo .title')) + "\n        }\n      }\n    }\n      ";
        bookSource = JSON.parse(bookSource);

        $("#booksourceOutput").val(JSON.stringify(bookSource));
        return bookSource;
      }
    }, {
      key: "testBookSource",
      value: function testBookSource(item) {
        $("#mocha").empty();

        var books = this.makeBooks().filter(function (b) {
          return !!b.bookid;
        });
        var booksource = this.makeBookSource();
        var config = { sources: {}, valid: [booksource.id] };
        config.sources[booksource.id] = booksource;

        var bsm = new BookSourceManager(config, customBookSource);

        $("#bookinfo").empty();
        books.forEach(function (book) {
          var list = $('<ul>');
          list.append($("<li>").wrapInner($("<a>").attr("target", "_blank").attr('href', bsm.getBookDetailLink(booksource.id, book)).text(book.name)));
          $("#bookinfo").append(list);
        });

        mocha.setup('bdd');
        mocha.timeout(10000);

        mocha.suite.suites = [];
        testbook.testBook(booksource.id, bsm, books, item);
        mocha.run();
      }
    }, {
      key: "makeBooks",
      value: function makeBooks() {
        var books = Array.from($('#testBooks .book')).map(function (be) {
          var book = {};
          be = $(be);
          book.bookid = be.find(".id").val().trim();
          book.name = be.find(".name").val().trim();
          book.author = be.find(".author").val().trim();
          book.introduce = be.find(".introduce").val().trim();
          book.name = be.find(".name").val().trim();
          book.chapters = [{
            content: be.find(".chapter-content").val().trim(),
            link: be.find(".chapter-link").val().trim(),
            title: be.find(".chapter-title").val().trim()
          }];
          for (var k in book) {
            if (!book[k]) delete book[k];
          }return book;
        });
        $("#booksOutput").val(JSON.stringify(books));

        return books;
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this = this;

        this.loadData();
        $("#saveData").click(function (e) {
          return _this.saveData();
        });
        $("#makeBookSource").click(function (e) {
          return _this.makeBookSource();
        });
        $("#makeBooks").click(function (e) {
          return _this.makeBooks();
        });

        $("#testBookSource").click(function (e) {
          return _this.testBookSource();
        });
        $("#testSearchBook").click(function (e) {
          return _this.testBookSource('getbook');
        });
        $("#testGetBookInfo").click(function (e) {
          return _this.testBookSource('bookinfo');
        });
        $("#testCatalog").click(function (e) {
          return _this.testBookSource('catalog');
        });
        $("#testChapter").click(function (e) {
          return _this.testBookSource('chapter');
        });
        window.addEventListener("keydown", function (e) {
          if (e.keyCode == 0x53 && e.ctrlKey) {
            e.preventDefault();
            _this.saveData();
          } else if (e.keyCode == 0x44 && e.ctrlKey) {
            e.preventDefault();
            $(".tab-pane.active > button[id^=test]").click();
          }
        }, false);
      }
    }]);

    return MyPage;
  }();

  return new MyPage();
});
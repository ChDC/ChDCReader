"use strict"
define(["jquery", "utils", "uiutils", "mocha", "testbook", "BookSourceManager", "CustomBookSource"],
  function($, utils, uiutils, mocha, testbook, BookSourceManager, customBookSource){

  class MyPage{

    onLoad(){
      this.loadView();

      this.bookSource;
      this.books;
    }

    loadData(){
      let data = localStorage.getItem("data");
      if(!data)
        return;
      data = JSON.parse(data);
      Array.from($("input")).forEach(e => {
        switch(e.type){
          case "checkbox":
            e.checked = data.shift() || false;

            break;
          default:
            e.value = data.shift() || ""
            break;
        }
      });
      Array.from($("select")).forEach(e => e.value = data.shift() || "");
      Array.from($("textarea")).forEach(e => e.value = data.shift() || "");
    }

    saveData(){
      let data = [];
      // save input
      Array.from($("input")).forEach(e => {
        switch(e.type){
          case "checkbox":
            data.push(e.checked);
            break;
          default:
            data.push(e.value);
            break;
        }
      });
      Array.from($("select")).forEach(e => data.push(e.value));
      Array.from($("textarea")).forEach(e => data.push(e.value));
      localStorage.setItem("data", JSON.stringify(data));
    }

    createStringConfig(element){
      let objString = `
      {
        "type": "string",
        "element": "${element.find(".element").val()}",
        "attribute": "${element.find(".attribute").val()}",
        "remove": "${element.find(".remove").val()}",
        "extract": "${element.find(".extract").val()}"
      }
      `;
      let obj = JSON.parse(objString);
      obj.attribute = obj.attribute || undefined;
      obj.remove = obj.remove || undefined;
      obj.extract = obj.extract || undefined;

      if(!obj.attribute && !obj.remove && !obj.extract)
        return `"${obj.element}"`;
      else
        return JSON.stringify(obj);
    }

    createCatalogConfig(){
      let hasVolume = !!$('#catalogConfig .response .volume-selector').val();
      if(hasVolume){
        return `
          "element": "${$('#catalogConfig .response .volume-selector').val()}",
          ${$('#catalogConfig .response .reverseVolume')[0].checked ? '"reverse": true, ' : ""}
          "children": {
            "name": ${this.createStringConfig($('#catalogConfig .response .volume-name'))},
            "chapters": {
              "type": "array",
              "element": "${$('#catalogConfig .response .list-selector').val()}",
              ${$('#catalogConfig .response .reverseCatalog')[0].checked ? '"reverse": true, ' : ""}
              "children": {
                "title": ${this.createStringConfig($('#catalogConfig .response .title'))},
                "link": ${this.createStringConfig($('#catalogConfig .response .link'))}
              }
            }
          }
        `;
      }
      else
        return `
          "element": "${$('#catalogConfig .response .list-selector').val()}",
          ${$('#catalogConfig .response .reverseCatalog')[0].checked ? '"reverse": true, ' : ""}
          "children": {
            "title": ${this.createStringConfig($('#catalogConfig .response .title'))},
            "link": ${this.createStringConfig($('#catalogConfig .response .link'))}
          }
      `;
    }

    makeBookSource(){
      this.bookSource = `
    {
      "id": "${$('#basicConfig .id').val()}",
      "type": "${$('#basicConfig .type').val()}",
      "name": "${$('#basicConfig .name').val()}",
      "contentSourceWeight": ${$('#basicConfig .contentSourceWeight').val()},
      "mainSourceWeight": ${$('#basicConfig .mainSourceWeight').val()},
      "officialurls": {
        "host": "${$('#basicConfig .host').val()}",
        "bookdetail": "",
        "bookchapter": "",
        "booksearch": ""
      },
      "search": {
        "request": {
          "type": "${$('#searchConfig .request .datatype').val()}",
          "url": "${$('#searchConfig .request .url').val()}"${$('#searchConfig .request .timeout').val() ? ",\n          " : ""}${$('#searchConfig .request .timeout').val() ? `"timeout": ${$('#searchConfig .request .timeout').val()}` : ""}
        },
        "response": {
          "type": "array",
          "element": "${$('#searchConfig .response .list-selector').val()}",
          "children": {
            "name": ${this.createStringConfig($('#searchConfig .response .bookinfo .name'))},
            "author": ${this.createStringConfig($('#searchConfig .response .bookinfo .author'))},
            "catagory": "",
            "complete": {
              "type": "boolean",
              "default": false
            },
            "coverImg": ${this.createStringConfig($('#searchConfig .response .bookinfo .coverImg'))},
            "introduce": ${this.createStringConfig($('#searchConfig .response .bookinfo .introduce'))},
            "bookid": ${this.createStringConfig($('#searchConfig .response .bookinfo .id'))}
          }
        }
      },
      "detail": {
        "request": {
          "type": "${$('#detailConfig .request .datatype').val()}",
          "url": "${$('#detailConfig .request .url').val()}"${$('#detailConfig .request .timeout').val() ? ",\n          " : ""}${$('#detailConfig .request .timeout').val() ? `"timeout": ${$('#detailConfig .request .timeout').val()}` : ""}
        },
        "response": {
          "name": ${this.createStringConfig($('#detailConfig .response .bookinfo .name'))},
          "author": ${this.createStringConfig($('#detailConfig .response .bookinfo .author'))},
          "catagory": "",
          "complete": {
            "type": "boolean",
            "default": false
          },
          "coverImg": ${this.createStringConfig($('#detailConfig .response .bookinfo .coverImg'))},
          "introduce": ${this.createStringConfig($('#detailConfig .response .bookinfo .introduce'))},
          "lastestChapter": ${this.createStringConfig($('#detailConfig .response .bookinfo .lastestChapter'))}
        }
      },
      "catalog": {
        "request": {
          "type": "${$('#catalogConfig .request .datatype').val()}",
          "url": "${$('#catalogConfig .request .url').val()}"${$('#catalogConfig .request .timeout').val() ? ",\n          " : ""}${$('#catalogConfig .request .timeout').val() ? `"timeout": ${$('#catalogConfig .request .timeout').val()}` : ""}
        },
        ${!!$('#catalogConfig .response .volume-selector').val() ? '"hasVolume": true,' : ""}
        "response":{
          "type": "array",
          ${this.createCatalogConfig()}
        }
      },
      "chapter": {
        "request": {
          "type": "${$('#chapterConfig .request .datatype').val()}",
          "url": "${$('#chapterConfig .request .url').val()}"${$('#chapterConfig .request .timeout').val() ? ",\n          " : ""}${$('#chapterConfig .request .timeout').val() ? `"timeout": ${$('#chapterConfig .request .timeout').val()}` : ""}
        },
        "response": {
          "contentHTML": ${this.createStringConfig($('#chapterConfig .response .chapterinfo .contentHTML'))},
          "title": ${this.createStringConfig($('#chapterConfig .response .chapterinfo .title'))}
        }
      }
    }
      `;

      $("#booksourceOutput").val(this.bookSource);
    }

    testBookSource(item){
      $("#mocha").empty();
      let books = JSON.parse($("#booksOutput").val()).filter(b => !!b.name);
      let booksource = JSON.parse($("#booksourceOutput").val());
      let config = {sources: {}, valid: [booksource.id]};
      config.sources[booksource.id] = booksource;

      let bsm = new BookSourceManager(config, customBookSource);
      mocha.setup('bdd');
      mocha.timeout(10000);

      mocha.suite.suites = [];
      testbook.testBook(booksource.id, bsm, books, item);
      mocha.run();
    }

    makeBooks(){
      this.books = Array.from($('#testBooks .book'))
        .map(be => {
          let book = {};
          be = $(be);
          book.bookid = be.find(".id").val();
          book.name = be.find(".name").val();
          book.author = be.find(".author").val();
          book.introduce = be.find(".introduce").val();
          book.name = be.find(".name").val();
          book.chapters = [{
            content: be.find(".chapter-content").val(),
            link: be.find(".chapter-link").val(),
            title: be.find(".chapter-title").val(),
          }];
          return book;
        });
      $("#booksOutput").val(JSON.stringify(this.books));
    }

    loadView(){
      this.loadData();
      $("#saveData").click(e => this.saveData());
      $("#makeBookSource").click(e => this.makeBookSource());
      $("#makeBooks").click(e => this.makeBooks());

      $("#testBookSource").click(e => this.testBookSource());
      $("#testSearchBook").click(e => this.testBookSource('search'));
      $("#testGetBookInfo").click(e => this.testBookSource('bookinfo'));
      $("#testCatalog").click(e => this.testBookSource('catalog'));
      $("#testChapter").click(e => this.testBookSource('chapter'));
    }

  }

  return new MyPage();
});


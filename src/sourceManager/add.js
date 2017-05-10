"use strict"
define(["jquery", "utils", "uiutils", "mocha", "testbook", "BookSourceManager", "CustomBookSource"],
  function($, utils, uiutils, mocha, testbook, BookSourceManager, customBookSource){

  class MyPage{

    onLoad(){
      this.loadView();

      // this.bookSource;
      // this.books;
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
        "element": "${element.find(".element").val().trim()}",
        "attribute": "${element.find(".attribute").val().trim()}",
        "remove": "${element.find(".remove").val().trim()}",
        "extract": "${element.find(".extract").val().trim()}"
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
      let hasVolume = !!$('#catalogConfig .response .volume-selector').val().trim();
      if(hasVolume){
        return `
          "element": "${$('#catalogConfig .response .volume-selector').val().trim()}",
          ${$('#catalogConfig .response .reverseVolume')[0].checked ? '"reverse": true, ' : ""}
          "children": {
            "name": ${this.createStringConfig($('#catalogConfig .response .volume-name'))},
            "chapters": {
              "type": "array",
              "element": "${$('#catalogConfig .response .list-selector').val().trim()}",
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
          "element": "${$('#catalogConfig .response .list-selector').val().trim()}",
          ${$('#catalogConfig .response .reverseCatalog')[0].checked ? '"reverse": true, ' : ""}
          "children": {
            "title": ${this.createStringConfig($('#catalogConfig .response .title'))},
            "link": ${this.createStringConfig($('#catalogConfig .response .link'))}
          }
      `;
    }

    makeBookSource(){
      let bookSource = `
    {
      "id": "${$('#basicConfig .id').val().trim()}",
      "type": "${$('#basicConfig .type').val().trim()}",
      "name": "${$('#basicConfig .name').val().trim()}",
      "contentSourceWeight": ${$('#basicConfig .contentSourceWeight').val().trim()},
      "mainSourceWeight": ${$('#basicConfig .mainSourceWeight').val().trim()},
      ${$('#basicConfig .tc')[0].checked ? '"language": "tc",' : ""}
      "officialurls": {
        "host": "${$('#basicConfig .host').val().trim()}",
        "bookdetail": "",
        "bookchapter": "",
        "booksearch": ""
      },
      "search": {
        "request": {
          "type": "${$('#searchConfig .request .datatype').val().trim()}",
          "url": "${$('#searchConfig .request .url').val().trim()}"${$('#searchConfig .request .timeout').val().trim() ? ",\n          " : ""}${$('#searchConfig .request .timeout').val().trim() ? `"timeout": ${$('#searchConfig .request .timeout').val().trim()}` : ""}
        },
        "response": {
          "type": "array",
          "element": "${$('#searchConfig .response .list-selector').val().trim()}",
          ${$('#searchConfig .response .reverse')[0].checked ? '"reverse": true, ' : ""}
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
          "type": "${$('#detailConfig .request .datatype').val().trim()}",
          "url": "${$('#detailConfig .request .url').val().trim()}"${$('#detailConfig .request .timeout').val().trim() ? ",\n          " : ""}${$('#detailConfig .request .timeout').val().trim() ? `"timeout": ${$('#detailConfig .request .timeout').val().trim()}` : ""}
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
          "type": "${$('#catalogConfig .request .datatype').val().trim()}",
          "url": "${$('#catalogConfig .request .url').val().trim()}"${$('#catalogConfig .request .timeout').val().trim() ? ",\n          " : ""}${$('#catalogConfig .request .timeout').val().trim() ? `"timeout": ${$('#catalogConfig .request .timeout').val().trim()}` : ""}
        },
        ${!!$('#catalogConfig .response .volume-selector').val().trim() ? '"hasVolume": true,' : ""}
        "response":{
          "type": "array",
          ${this.createCatalogConfig()}
        }
      },
      "chapter": {
        "request": {
          "type": "${$('#chapterConfig .request .datatype').val().trim()}",
          "url": "${$('#chapterConfig .request .url').val().trim()}"${$('#chapterConfig .request .timeout').val().trim() ? ",\n          " : ""}${$('#chapterConfig .request .timeout').val().trim() ? `"timeout": ${$('#chapterConfig .request .timeout').val().trim()}` : ""}
        },
        "response": {
          "contentHTML": ${this.createStringConfig($('#chapterConfig .response .chapterinfo .contentHTML'))},
          "title": ${this.createStringConfig($('#chapterConfig .response .chapterinfo .title'))}
        }
      }
    }
      `;
      bookSource = JSON.parse(bookSource)

      $("#booksourceOutput").val(JSON.stringify(bookSource));
      return bookSource;
    }

    testBookSource(item){
      $("#mocha").empty();

      let books = this.makeBooks().filter(b => !!b.bookid);
      let booksource = this.makeBookSource();
      let config = {sources: {}, valid: [booksource.id]};
      config.sources[booksource.id] = booksource;

      let bsm = new BookSourceManager(config, customBookSource);

      $("#bookinfo").empty();
      books.forEach(book => {
        let list = $('<ul>');
        list.append($("<li>").wrapInner($("<a>").attr("target", "_blank").attr('href', bsm.getBookDetailLink(booksource.id, book)).text(book.name)));
        $("#bookinfo").append(list);
      });

      mocha.setup('bdd');
      mocha.timeout(10000);

      mocha.suite.suites = []; // clear suites
      testbook.testBook(booksource.id, bsm, books, item);
      mocha.run();
    }

    makeBooks(){
      let books = Array.from($('#testBooks .book'))
        .map(be => {
          let book = {};
          be = $(be);
          book.bookid = be.find(".id").val().trim();
          book.name = be.find(".name").val().trim();
          book.author = be.find(".author").val().trim();
          book.introduce = be.find(".introduce").val().trim();
          book.name = be.find(".name").val().trim();
          book.chapters = [{
            content: be.find(".chapter-content").val().trim(),
            link: be.find(".chapter-link").val().trim(),
            title: be.find(".chapter-title").val().trim(),
          }];
          for(let k in book)
            if(!book[k]) delete book[k];
          return book;
        });
      $("#booksOutput").val(JSON.stringify(books));

      return books;
    }

    loadView(){
      this.loadData();
      $("#saveData").click(e => this.saveData());
      $("#makeBookSource").click(e => this.makeBookSource());
      $("#makeBooks").click(e => this.makeBooks());

      $("#testBookSource").click(e => this.testBookSource());
      $("#testSearchBook").click(e => this.testBookSource('getbook'));
      $("#testGetBookInfo").click(e => this.testBookSource('bookinfo'));
      $("#testCatalog").click(e => this.testBookSource('catalog'));
      $("#testChapter").click(e => this.testBookSource('chapter'));
      window.addEventListener("keydown", e=>{
        if(e.keyCode==0x53 && e.ctrlKey){
          e.preventDefault();
          this.saveData();
        }
        else if(e.keyCode==0x44 && e.ctrlKey){
          e.preventDefault();
          $(".tab-pane.active > button[id^=test]").click();
        }
      }, false);

    }

  }

  return new MyPage();
});


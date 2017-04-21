"use strict"
define(["jquery", "main", "Page", "util", "uiutil"], function($, app, Page, util, uiutil){

  class MyPage extends Page{

    onLoad(params){
      this.loadView();
    }

    loadData(){
      return util.getJSON('data/exploresource.json')
        .then(json => {
          this.exploresources = json;
        });
    }

    loadView(){
      this.loadData()
        .then(() => this.loadList());
    }

    loadList(){
      let list = $('#list').empty();
      for(let key of Object.keys(this.exploresources)){
        let es = this.exploresources[key];
        let ese = $('.template > .list-item').clone();
        ese.find("img.booksource-logo").attr('src', es.logo);
        ese.find(".booksource-name").text(app.bookSourceManager.getBookSourceName(key));
        ese.click(e => this.showExplorPage(key, es));
        list.append(ese);
      }
    }

    showExplorPage(bsid, es){
      let ref = window.open(es.url, "_blank", "location=no");

      ref.addEventListener("loadstart", (e) => {
        console.log(e.url);
        let url = e.url;
        let matcher = url.match(es.readbookmatcher);
        if(matcher){
          ref.hide();
          let bookid = matcher[1];
          debugger;
          app.bookSourceManager.getBookInfo(bsid, {bookid: bookid})
            .then(book => {
              app.page.showPage("readbook", {book: book})
                .then(page => {
                  page.addEventListener('myclose', () => {
                    ref.show();
                    ref.executeScript({ code: "history.back()" });
                  });
                });
            });
        }
      });
    }
  }

  return MyPage;
});

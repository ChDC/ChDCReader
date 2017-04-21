"use strict"
define(["jquery", "main", "Page", "util", "uiutil"], function($, app, Page, util, uiutil){

  class MyPage extends Page{

    onLoad(params){
      this.loadView(params);
    }

    loadView(params){
      let url = "http://m.qidian.com/";
      let ref = window.open(url, "_blank", "location=no");
      // app.inAppBrowser = ref;

      ref.addEventListener("exit", (e) => {
        // app.inAppBrowser = null;
      });
      ref.addEventListener("loadstart", (e) => {
        console.log(e.url);
        let url = e.url;
        let matcher = url.match("^http://m.qidian.com/book/(\\d+)/\\d+.*");
        if(matcher){
          ref.hide();
          let bookid = matcher[1];
          debugger;
          app.bookSourceManager.getBookInfo("qidian", {bookid: bookid})
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

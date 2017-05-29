"use strict"
define(["jquery", "main", "Page", "utils", "uiutils", "cookie"], function($, app, Page, utils, uiutils, cookie){

  class MyPage extends Page{

    constructor(){
      super();
      this.scrollTop = 0;
      this.container = $('.container');
    }

    onLoad({params}){
      this.loadView();
    }

    onPause(){
      this.scrollTop = this.container.scrollTop();
    }

    onResume(){
      this.container.scrollTop(this.scrollTop);
    }

    loadData(){
      return utils.getJSON('data/exploresource.json')
        .then(json => {
          this.exploresources = {};
          for(let key of json.valid)
            this.exploresources[key] = json.sources[key];
        });
    }

    loadView(){
      $('#btnClose').click(e => this.close());
      this.loadData()
        .then(() => this.loadList());
    }

    loadList(){
      let list = $('#list').empty();
      for(let key of Object.keys(this.exploresources)){
        let es = this.exploresources[key];
        let ese = $('.template > .list-item').clone();
        ese.find("img.booksource-logo")
          .attr('src', es.logo ? es.logo : `img/logo/${key}.png`)
          .attr('alt', app.bookSourceManager.getBookSource(key).name);
        // ese.find(".booksource-type").text(app.bookSourceManager.getBookSourceTypeName(key));
        ese.click(e => this.showExplorPage(key, es));
        list.append(ese);
      }
    }

    showExplorPage(bsid, es){
      let ref = window.open(es.url, "_blank", "location=no,clearcache=yes,clearsessioncache=yes,zoom=no");
      this.configBrowser(bsid, ref, es);
    }

    configBrowser(bsid, ref, es){
      // loadstart
      ref.addEventListener("loadstart", (e) => {
        let url = e.url;
        let executeScriptOnLoadStart = "";
        let insertCSS = es.insertCSS ? es.insertCSS + "\n" : "";

        if(es.remove)
          insertCSS += `${es.remove.join(", ")}{display: none;}`;

        if(insertCSS)
          executeScriptOnLoadStart += `
            document.addEventListener("DOMContentLoaded", function(){
              var newStyle = document.createElement("style");
              newStyle.innerHTML = '${insertCSS}';
              document.head.appendChild(newStyle);
              ${getRemoveCode(es.remove)}
            });
          `;

        executeScriptOnLoadStart += es.executeScriptOnLoadStart || "";

        if(executeScriptOnLoadStart) ref.executeScript({ code: executeScriptOnLoadStart});

        if(es.interceptor){
          for(let config of es.interceptor){
            let matcher = url.match(config.match);
            if(!matcher) continue;

            // 匹配了
            // 停止加载
            ref.executeScript({ code: "window.stop();" });
            let action, target;
            if(utils.type(config.goto) == "string"){
              if(config.goto.match(/^https?:\/\//i) || config.goto.match(/^\//i))
                action = urlAction;
              else
                action = pageAction;
              target = config.goto;
            }
            else{
              action = config.goto.type == "page" ? pageAction : urlAction;
              target = config.goto.target;
            }
            if(config.execute)
              ref.executeScript({ code: config.execute }, ()=> action(matcher, target));
            else
              action(matcher, target);
            break;
          }
        }
      });

      // loadstop
      ref.addEventListener('loadstop', function(e) {
        // let insertCSS = es.insertCSS ? es.insertCSS + "\n" : "";
        let executeScriptOnLoadStop = es.executeScriptOnLoadStop ? es.executeScriptOnLoadStop + "\n" : "";
        // if(es.remove)
        //   insertCSS += `${es.remove.join(", ")}{display: none;}`;

        // if(insertCSS)
        //   ref.insertCSS({code: insertCSS});

        // executeScriptOnLoadStop += getRemoveCode(es.remove);

        if(executeScriptOnLoadStop)
          ref.executeScript({ code: executeScriptOnLoadStop});
      });

      // exit
      // ref.addEventListener('exit', function(e) {
      //   if(es.executeScriptOnExit)
      //     ref.executeScript({ code: es.executeScriptOnExit});
      // });

      function pageAction(matcher, pageName){
        ref.hide();
        app.showLoading();
        let bookid = matcher[1];
        app.bookSourceManager.getBookInfo(bsid, {bookid: bookid})
          .then(book => {
            app.hideLoading();
            app.page.showPage(pageName, {book: book})
              .then(page => {
                page.addEventListener('myclose', () => {
                  ref.show();
                  // if(!window.stop) ref.executeScript({ code: "history.back()" });
                });
              });
          });
      }

      function urlAction(matcher, target){
        debugger;
        ref.executeScript({ code: `debugger;window.location.href = "${target}";`});
      };

      function getRemoveCode(remove){
        if(!remove) return "";
        return `
          var arr = ${JSON.stringify(remove)};
          for(var i = 0; i < arr.length; i++){
            var es = document.querySelectorAll(arr[i]);
            for(var j = 0; j < es.length; j++)
              es[j].style.display = "none";
          }
        `;
      }
    }
  }

  return MyPage;
});

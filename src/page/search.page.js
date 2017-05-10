"use strict"
define(["jquery", "main", "Page", "utils", "uiutils"], function($, app, Page, utils, uiutils){

  class MyPage extends Page{

    constructor(){
      super();
      this.scrollTop = 0;
      this.container = $('.container');

      this.loadedRemember = false;
      this.remember = {
        bookType: "",
        ifFilterResult: false, // 是否过滤结果
        searchLog: [], // 搜索记录
        bookSourceId: ""
      };
    }

    onLoad({params}){
      this.loadView();
      if(!this.loadedRemember)
        utils.loadData("search.json")
          .then(data => {
            if(data)
              this.remember = data;
            this.loadRemember();
          });
      else
        this.loadRemember();
    }

    onPause(){
      this.scrollTop = this.container.scrollTop();
    }

    onResume(){
      this.container.scrollTop(this.scrollTop);
    }

    saveRememberData(){
      utils.saveData("search.json", this.remember);
      this.loadedRemember = true;
    }

    // 加载结果列表
    loadBooks(id, books){
      const bs = $(id);
      const b = $(".template .book");
      bs.empty();
      for(const book of books){
        const nb = b.clone();
        if(book.cover)
          nb.find(".book-cover").attr("src", book.cover);

        nb.find(".book-type").text(app.bookSourceManager.getBookSourceTypeName(book.mainSourceId));

        nb.find(".book-name").text(book.name).click(e => window.open(book.getOfficialDetailLink(), '_system'));
        nb.find(".book-author").text(book.author);
        nb.find(".book-catagory").text(book.catagory);
        nb.find(".book-complete").text(book.complete ? "完结" : "连载中");
        nb.find(".book-introduce").text(book.introduce);

        if(app.bookShelf.hasBook(book)){
          nb.find(".btnAddToBookshelf").attr('disabled', 'disabled');
        }
        else{
          nb.find(".btnAddToBookshelf").click(event => {
            app.bookShelf.addBook(book);

            $(event.currentTarget).attr("disabled", "disabled");
            app.bookShelf.save()
              .then(()=>{
                uiutils.showMessage("添加成功！");
                book.checkBookSources();
                // 缓存
                book.cacheChapter(0, app.settings.settings.cacheChapterCount);
              })
              .catch(error => {
                $(event.currentTarget).removeAttr("disabled");
              });
          });
        }
        nb.find(".btnDetail").click(e => app.page.showPage("bookdetail", {book: book}));
        nb.find(".book-booksource").text(app.bookSourceManager.getBookSource(book.mainSourceId).name);
        bs.append(nb);
      }
    }

    search(){
      $("#result").show();
      $("#searchLogPanel").hide();
      app.showLoading();
      const keyword = $("#keyword").val().trim();
      const bookSourceId = $("#bookSource").val();
      const bookType = $("#bookType").val();
      const ifFilterResult = $("#chkFilterResult")[0].checked

      // 记住数据
      this.remember.bookType = bookType;
      this.remember.ifFilterResult = ifFilterResult;
      this.remember.bookSourceId = bookSourceId;
      if(!this.remember.searchLog.includes(keyword))
        this.remember.searchLog.unshift(keyword);
      this.saveRememberData();

      $('#result').empty();
      if(!keyword){
        uiutils.showError("请输入要搜索的关键字");
        return;
      }

      if(!bookSourceId){
        // 全网搜索
        app.bookSourceManager.searchBookInAllBookSource(keyword,
              {filterSameResult: ifFilterResult, bookType: bookType})
          .then(books => {
            app.hideLoading();
            this.loadBooks("#result", books);
          })
          .catch(error => {
            app.hideLoading();
            uiutils.showError(app.error.getMessage(error));
          });
        return;
      }

      // 单书源搜索
      app.bookSourceManager.searchBook(bookSourceId, keyword)
        .then(books => {
          app.hideLoading();
          this.loadBooks("#result", books);
        })
        .catch(error => {
          app.hideLoading();
          uiutils.showError(app.error.getMessage(error));
        });
    }

    loadRemember(){
      // $("#keyword").val(this.remember.searchLog[0] || "");
      $("#bookSource").val(this.remember.bookSourceId);
      $("#bookType").val(this.remember.bookType);
      $("#chkFilterResult")[0].checked = this.remember.ifFilterResult;

      let tsl = $(".template .searchLogItem")
      $("#searchLog").empty();
      this.remember.searchLog.forEach(sl => {
        let nsl = tsl.clone();
        nsl.find('.title').text(sl);
        nsl.click(e => {
          $("#keyword").val(sl);
          this.search();
        });
        $("#searchLog").append(nsl);
      });
    }

    loadView(){
      // 添加选项
      const bookSource = $("#bookSource");
      const keys = app.bookSourceManager.getSourcesKeysByMainSourceWeight();

      // 添加书源搜索
      for(const bskey of keys){
        const bsName = app.bookSourceManager.getBookSource(bskey).name;
        const newOption = `<option value ="${bskey}">${bsName}</option>`;
        bookSource.append(newOption);
      }

      $("#btnClose").click(e => this.close());
      $("#btnSearch").click(e => this.search());
      $("#keyword").on('keydown', event => !(event.keyCode==13 && this.search()))
        .on('focus', event => event.currentTarget.select())
        .on('input', event => {
          if(!$("#keyword").val()){
            $("#result").hide();
            $("#searchLogPanel").show();
            this.loadRemember();
          }
        });
      $("#clearSearchLog").click(e=>{
        this.remember.searchLog = [];
        this.saveRememberData();
        this.loadRemember();
      });
    }
  }

  return MyPage;
});

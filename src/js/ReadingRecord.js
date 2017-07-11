;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["ReadingRecord"] = factory.apply(undefined, deps.map(e => window[e]));
}(['Chapter'], function(Chapter) {
  "use strict"


  // **** ReadingRecord *****
  class ReadingRecord{

    constructor({chapterTitle="", chapterIndex=0, options={}, pageScrollTop=0}={}){
      this.chapterIndex = chapterIndex; // 为了避免更新目录后原来的位置后移而考虑的
      this.chapterTitle = chapterTitle;
      this.isFinished = false; // 是否读完了
      this.pageScrollTop = pageScrollTop; // 读到的位置
      this.options = options;
    }

    // getChapterTitle(){
    //   return this.isFinished ? "读完啦" : this.chapterTitle;
    // }

    /**
     * 获取章节索引
     * @return {[type]} [description]
     */
    getChapterIndex(){
      return this.isFinished ? this.chapterIndex + 1 : this.chapterIndex;
    }

    /**
     * 获取阅读位置
     * @return {[type]} [description]
     */
    getPageScrollTop(){
      return this.isFinished ? 0 : this.pageScrollTop;
    }

    getOptions(){
      if(!this.isFinished)
        return this.options;
      let opts = Object.assign({}, this.options);
      opts.contentSourceChapterIndex += 1;
      return opts;
    }

    /**
     * 清除数据
     * @return {[type]} [description]
     */
    reset(){
      this.chapterTitle = "";
      this.chapterIndex = 0;
      this.pageScrollTop = 0;
      this.options = {};
    }

    /**
     * 设置正在读的章节
     * @param {[type]} chapterTitle [description]
     * @param {[type]} chapterIndex [description]
     * @param {[type]} options      [description]
     */
    setReadingRecord(chapterTitle, chapterIndex, options){
      this.chapterIndex = chapterIndex;
      this.chapterTitle = chapterTitle;
      this.options = options;
      this.pageScrollTop = 0;
      this.isFinished = false;
    }

    /**
     * 设置阅读记录为下一章
     * @param {[type]}  book         [description]
     * @param {Boolean} forceRefresh [description]
     */
    setNextChapter(book, forceRefresh=false){
      return book.getChapterIndex(this.chapterTitle, this.chapterIndex, {forceRefresh: forceRefresh})
        .then(index => {
          if(index >= 0)
            return book.index(index + 1)
              .then(chapter => {
                this.options.contentSourceChapterIndex += 1;
                this.setReadingRecord(chapter.title, index + 1, this.options);
              });
          else
            return Promise.reject();
        });
    }

    /**
     * 标记本书读完
     * @param {Boolean} isFinished [description]
     */
    setFinished(isFinished){
      this.isFinished = isFinished;
      if(isFinished){
        this.pageScrollTop = 0;
      }
    }

    equalChapter(chapter){
      return this.equalChapterTitle(chapter.title);
    }

    equalChapterTitle(chapterTitle){
      return Chapter.equalTitle(chapterTitle, this.chapterTitle, true);
    }

    /**
     * 获取阅读记录的状态文本
     * @return {[type]} [description]
     */
    getReadingRecordStatus(){
      let s = this.isFinished ? "读完" : "读到";
      return `${s}：${this.chapterTitle}`;
    }
  }


  // **** ReadingRecordManager *****
  // 可用于书架的阅读进度，阅读历史，书签
  // class ReadingRecordManager{
  //     this.records = [];
  // };

  return ReadingRecord;
}));

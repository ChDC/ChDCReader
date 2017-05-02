;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["ReadingRecord"] = factory();
}(['Chapter'], function(Chapter) {
  "use strict"


  // **** ReadingRecord *****
  class ReadingRecord{

    constructor({chapterIndex=0, chapterTitle="", pageScrollTop=0, options={}}={}){
      this.chapterIndex = chapterIndex; // 为了避免更新目录后原来的位置后移而考虑的
      this.chapterTitle = chapterTitle;
      this.isFinished = false; // 是否读完了
      this.pageScrollTop = pageScrollTop; // 读到的位置
      this.options = options;
    }

    // getChapterTitle(){
    //   return this.isFinished ? "读完啦" : this.chapterTitle;
    // }

    getChapterIndex(){
      return this.isFinished ? this.chapterIndex + 1 : this.chapterIndex;
    }

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

    // 清除数据
    reset(){
      this.chapterTitle = "";
      this.chapterIndex = 0;
      this.pageScrollTop = 0;
      this.options = {};
    }

    // 设置正在读的章节
    setReadingRecord(chapterIndex, chapterTitle, options){
      this.chapterIndex = chapterIndex;
      this.chapterTitle = chapterTitle;
      this.options = options;
      this.pageScrollTop = 0;
      this.isFinished = false;
    }

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
      return Chapter.equalTitle2(chapterTitle, this.chapterTitle);
    }

    // 获取阅读记录的状态文本
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

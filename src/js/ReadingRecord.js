define(["jquery", "util", 'Book'], function($, util, Book) {
    "use strict"


    // **** ReadingRecord *****
    function ReadingRecord(){
        this.chapterIndex = 0;
        this.pageScrollTop = 0;
        this.chapterTitle = "";
        this.options = {};
    };

    // ReadingRecord.prototype.bookName = undefined; // 书名
    // ReadingRecord.prototype.bookAuthor = undefined; // 作者
    ReadingRecord.prototype.chapterIndex = undefined; // 章节索引
    ReadingRecord.prototype.chapterTitle = undefined; // 章节标题
    ReadingRecord.prototype.pageScrollTop = undefined; // 章内的滚动位置
    ReadingRecord.prototype.options = undefined; // 附加内容

    // 清除数据
    ReadingRecord.prototype.reset = function(){
        this.chapterIndex = 0;
        this.chapterTitle = "";
        this.pageScrollTop = 0;
        this.options = {};
    }

    // 设置正在读的章节
    ReadingRecord.prototype.setReadingRecord = function(chapterIndex, chapterTitle, options){
        let self = this;
        self.chapterIndex = chapterIndex;
        self.chapterTitle = chapterTitle;
        self.options = options;
    };

    // **** ReadingRecordManager *****
    // 可用于书架的阅读进度，阅读历史，书签
    // function ReadingRecordManager(){
    //     this.records = [];
    // };

    return ReadingRecord;
});

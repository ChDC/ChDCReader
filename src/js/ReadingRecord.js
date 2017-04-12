define(function() {
    "use strict"


    // **** ReadingRecord *****
    class ReadingRecord{

        constructor(){
            this.chapterIndex = 0;
            this.pageScrollTop = 0;
            this.chapterTitle = "";
            this.options = {};
        }


        // 清除数据
        reset(){
            this.chapterIndex = 0;
            this.chapterTitle = "";
            this.pageScrollTop = 0;
            this.options = {};
        }

        // 设置正在读的章节
        setReadingRecord(chapterIndex, chapterTitle, options){
            this.chapterIndex = chapterIndex;
            this.chapterTitle = chapterTitle;
            this.options = options;
        }

    }


    // **** ReadingRecordManager *****
    // 可用于书架的阅读进度，阅读历史，书签
    // class ReadingRecordManager{
    //     this.records = [];
    // };

    return ReadingRecord;
});

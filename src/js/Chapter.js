define(["util"], function(util) {
    "use strict"

    // **** Chapter ****
    class Chapter{

        constructor(){
            this.link = undefined;    // 链接
            this.title = undefined;    // 标题
            this.content = undefined;  // 内容
            // this.modifyTime = undefined;  // 修改时间
        }

    }


    // 判断两个标题是否相等，传入的是章节
    Chapter.equalTitle = function(chapterA, chapterB){
        return Chapter.equalTitle2(chapterA.title, chapterB.title);
    }

    // 判断两个标题是否相等，传入的是章节标题
    Chapter.equalTitle2 = function(chapterTitleA, chapterTitleB){
        if(!chapterTitleA || !chapterTitleB)
            return false;

        // TODO：模糊判等
        let cA = util.stripString(chapterTitleA);
        let cB = util.stripString(chapterTitleB);
        return cA == cB;
    }

    // 去掉“第**章”字样来判断两个标题是否相等，传入的是章节
    Chapter.equalTitleWithoutNum = function(chapterA, chapterB){
        let chapterTitleA = chapterA.title;
        let chapterTitleB = chapterB.title;

        if(!chapterTitleA || !chapterTitleB)
            return false;

        let numPattern = /第[零一二两三四五六七八九十百千万亿\d]+章/g;
        chapterTitleA = chapterTitleA.replace(numPattern, '');
        chapterTitleB = chapterTitleB.replace(numPattern, '');
        let cA = util.stripString(chapterTitleA);
        let cB = util.stripString(chapterTitleB);
        return cA == cB;
    }

    return Chapter;

});

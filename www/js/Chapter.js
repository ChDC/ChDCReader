define(["jquery", "util"], function($, util) {
    "use strict"

    // **** Chapter ****
    function Chapter(){

    }

    Chapter.prototype.link = undefined;    // 链接
    Chapter.prototype.title = undefined;    // 标题
    Chapter.prototype.content = undefined;  // 内容
    // Chapter.prototype.modifyTime = undefined;  // 修改时间

    // 判断两个标题是否相等，传入的是章节
    Chapter.equalTitle = function(chapterA, chapterB){
        return Chapter.equalTitle2(chapterA.title, chapterB.title);
    }

    // 判断两个标题是否相等，传入的是章节标题
    Chapter.equalTitle2 = function(chapterTitleA, chapterTitleB){
        if(!chapterTitleA || !chapterTitleB)
            return false;
        // 比较去掉所有空格和标点符号之后的所有符号
        function stripString(str){
            // 去除括号括起来的文字
            str = str.replace(/（.*?）/, '');
            str = str.replace(/\(.*?\)/, '');

            // 去除英文字符串
            str = str.replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\-]/g, '');
            // 去除中文字符串
            str = str.replace(/[！@#￥%……&*（）——+=~·《》，。？/：；“{}】【‘|、]/g, '');

            // 去除空白字符
            str = str.replace(/\s/g, '');
            return str;
        }
        // TODO：模糊判等
        var cA = stripString(chapterTitleA);
        var cB = stripString(chapterTitleB);
        return cA == cB;
    }

    return Chapter;

});

define(["jquery", "util"], function($, util) {

    "use strict"

    function Infinitelist(container, itemList, updateItem){
        var self = this;
        self.container = container;
        self.itemList = itemList;
        self.updateItem = updateItem;

        container.scroll(function(event){
            // 将章节滚动位置存储到变量中
            var scrollY = container.scrollTop();
            var wh = $(window).height();
            if(self.lastCheckScrollY == null || Math.abs(self.scrollY - self.lastCheckScrollY) > wh * self.CHECK_SCROLL_THRESHOLD) {
                lastCheckScrollY = scrollY;
                self.checkBoundary();
            }
        });
    }


    Infinitelist.prototype.container = null; // 容器
    Infinitelist.prototype.currentItem = null; // 当前元素
    Infinitelist.prototype.itemList = null; // 元素列表

    Infinitelist.prototype.DOWN_THRESHOLD = 3; // 向下加载章节的长度的阈值
    Infinitelist.prototype.UP_THRESHOLD = 1; // 向下加载章节的长度的阈值
    Infinitelist.prototype.CHECK_SCROLL_THRESHOLD = 0.9; // 当滑动多长的距离检查一次章节
    Infinitelist.prototype.lastScrollY = null; // 上次滑动的位置


    // 滑动到下一个元素
    Infinitelist.prototype.next = function(){

    }

    // 向下、上检查
    Infinitelist.prototype.updateItem = null;
    // function(boundaryItem, direction, success, fail){

    // }

    // 向下、上检查
    Infinitelist.prototype.checkBoundary = function(){
        this.__checkBoundary(1);
        this.__checkBoundary(-1);
    }

    Infinitelist.prototype.__checkBoundary = function(direction){
        function isBoundarySatisfied(){
            var es = self.itemList.children();
            if(es.length < 0)
                return false;
            var be = direction >= 0 ? es.last() : es.first();
            var wh = $(window).height();
            var result = false;
            if(direction >= 0)
                result = be.offset().top > (DOWN_THRESHOLD + 1) * wh;
            else
                result = be.offset().top < -UP_THRESHOLD * wh;
            return result;
        }

        function next(){
            self.updateItem(be, direction,
                function(newItem){
                    if(!nexItem)
                        return;
                    if(direction >= 0){
                        self.itemList.append(newItem);
                    }
                    else{
                        self.itemList.prepend(newItem);
                        activateCurrentChapter();
                    }
                    if(!isBoundarySatisfied())
                        next();
                },
                function(){

                });
        }

        var self = this;

        if(!isBoundarySatisfied()){
            var es = self.itemList.children();
            var be = null;
            if(es.length > 0){
                be = direction >= 0 ? es.last() : es.first();
            }
            next();
        }
    }


    return new Infinitelist();
});

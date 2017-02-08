define(["jquery", "util"], function($, util) {

    "use strict"

    function Infinitelist(container, itemList, onNewListItem){
        let self = this;
        self.container = container;
        self.itemList = itemList;
        self.onNewListItem = onNewListItem;

        // self.container.on('scroll', self.__scrollEvent.bind(self));
    }


    Infinitelist.prototype.container = null; // 容器
    Infinitelist.prototype.currentItem = null; // 当前元素
    Infinitelist.prototype.itemList = null; // 元素列表

    Infinitelist.prototype.DOWN_THRESHOLD = 3; // 向下加载长度的阈值
    Infinitelist.prototype.UP_THRESHOLD = 1; // 向下加载长度的阈值
    Infinitelist.prototype.CHECK_SCROLL_THRESHOLD = 0.9; // 当滑动多长的距离检查一次
    Infinitelist.prototype.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1; // 当滑动多长的距离检查一次当前元素改动


    Infinitelist.prototype.__lastCheckScrollY = null; // 上次检查边界时滑动的位置

    Infinitelist.prototype.__lastCurrentChangeCheckScrollY = null; // 上次检查当前元素改变时滑动的位置

    // 获取列表元素的函数
    Infinitelist.prototype.onNewListItem = null;

    // 当前正在呈现的元素改变的事件
    Infinitelist.prototype.onCurrentItemChanged = null;

    // 是否正在检查边界
    Infinitelist.prototype.isCheckingBoundary = false;

    // 获取页内的滚动位置
    Infinitelist.prototype.getPageScorllTop = function(){
        let self = this;
        if(self.currentItem)
            return self.container.scrollTop() - self.currentItem.position().top;
        else
            return 0;
    }

    // 滑动到下一个元素
    Infinitelist.prototype.nextItem = function(){
        let self = this;
        let i = self.__getCurrentItemIndex();
        if(i < 0)
            return;

        let ics = self.itemList.children();
        i++;
        if(i < ics.length){
            let ni = ics.eq(i);
            self.container.scrollTop(ni.position().top);
        }
    }

    // 滑动到上一个元素
    Infinitelist.prototype.lastItem = function(){
        let self = this;
        let i = self.__getCurrentItemIndex();
        if(i < 0)
            return;

        let ics = self.itemList.children();
        i--;
        if(i >= 0){
            let ni = ics.eq(i);
            self.container.scrollTop(ni.position().top);
        }
    }

    // 加载列表数据
    Infinitelist.prototype.loadList = function(){
        this.checkBoundary();
    }

    // 清空列表数据
    Infinitelist.prototype.emptyList = function(){
        this.currentItem = null;
        this.container.scrollTop(0);
        this.itemList.empty();
        this.__lastCheckScrollY = null;
    }

    // 清空列表数据
    Infinitelist.prototype.computeCurrentItems = function(){
        let self = this;
        let wh = $(window).height();
        let items = self.itemList.children();
        let result = [];
        for(let i = 0; i < items.length; i++)
        {
            let item = items.eq(i);
            let top = item.offset().top;
            let height = item.outerHeight(true);
            if(top + height <= 0.1 * wh){
                continue;
            }
            else if(top > 0.9 * wh)
                break;
            else{
                result.push(item);
            }
        };
        return result;
    }


    // 获取当前元素的索引
    Infinitelist.prototype.__getCurrentItemIndex = function(){
        let self = this;
        if(!self.currentItem)
            return -1;
        let ics = self.itemList.children();
        return Array.prototype.indexOf.bind(ics)(self.currentItem[0]);
    }


    // 容器的滚动事件
    Infinitelist.prototype.__scrollEvent = function(event){
        let self = this;
        let scrollY = self.container.scrollTop();

        if(self.__lastCurrentChangeCheckScrollY == null){
            self.__checkCurrentItemChange();
        }
        else{
            let wh = $(window).height();
            if(Math.abs(scrollY - self.__lastCurrentChangeCheckScrollY) > wh * self.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD) {
                self.__checkCurrentItemChange();
            }
        }

        if(self.__lastCheckScrollY == null){
            self.checkBoundary();
        }
        else{
            let wh = $(window).height();
            if(Math.abs(scrollY - self.__lastCheckScrollY) > wh * self.CHECK_SCROLL_THRESHOLD) {
                self.checkBoundary();
            }
        }
    }

    // 检查当前元素是否改变
    Infinitelist.prototype.__checkCurrentItemChange = function(){
        let self = this;
        self.__lastCurrentChangeCheckScrollY = self.container.scrollTop();
        if(!self.currentItem){
            return;
        }
        let cis = self.computeCurrentItems();
        let i = util.arrayIndex(cis, self.currentItem, Infinitelist.__itemEqual);
        if(i < 0){
            self.setCurrentItem(cis[0]);
        }
    }

    // 元素判等
    Infinitelist.__itemEqual = function(i1, i2){
        if(!i1 && !i2)
            return true;
        else if(!i1 || !i2){
            return false;
        }
        return i1[0] == i2[0];
    }

    // 设置当前元素
    Infinitelist.prototype.setCurrentItem = function(newCurrentItem){
        let self = this;
        let oldValue = self.currentItem;
        if(Infinitelist.__itemEqual(newCurrentItem, oldValue))
            return;

        self.currentItem = newCurrentItem;
        if(self.onCurrentItemChanged){
            self.onCurrentItemChanged(self, newCurrentItem, oldValue);
        }
    }


    // 向下、上检查
    Infinitelist.prototype.checkBoundary = function(success){
        let self = this;
        if(self.isCheckingBoundary)
            return;
        self.isCheckingBoundary = true;
        self.container.off('scroll', self.__scrollEvent.bind(self));

        let curScrollY = self.container.scrollTop();
        let scrollDirection = 1;
        if(self.__lastCheckScrollY){
            scrollDirection = curScrollY > self.__lastCheckScrollY ? 1 : -1;
        }
        self.__lastCheckScrollY = curScrollY;

        self.__checkBoundary(scrollDirection, false,
            function(){
                self.__checkBoundary(-scrollDirection, true,
                    function(){
                        self.container.on('scroll', self.__scrollEvent.bind(self));
                        self.isCheckingBoundary = false;
                        if(success)success();
                    });
            });
    }


    // 检查指定方向的边界
    Infinitelist.prototype.__checkBoundary = function(direction, willClear, success){

        function isOutBoundary(item){
            let wh = $(window).height();
            let result = false;
            if(direction >= 0)
                result = item.offset().top > (self.DOWN_THRESHOLD + 1) * wh;
            else
                result = item.offset().top + item.outerHeight(true) < -self.UP_THRESHOLD * wh;
            return result;
        }

        function getBoundaryItem(){
            let es = self.itemList.children();
            if(es.length <= 0)
                return null;
            return direction >= 0 ? es.last() : es.first();
        }

        function isBoundarySatisfied(){
            function isOnBoundary(item){
                let wh = $(window).height();
                let result = false;
                if(direction >= 0)
                    result = item.offset().top + item.outerHeight(true) > (self.DOWN_THRESHOLD + 1) * wh;
                else
                    result = item.offset().top < -self.UP_THRESHOLD * wh;
                return result;
            }

            let be = getBoundaryItem();
            if(!be)
                return false;
            // 边界元素被标记为端 或者 在边界内
            let result = be.data(direction + 'end') ||
                !Infinitelist.__itemEqual(self.currentItem, be) && isOnBoundary(be);
            return result;
        }

        function clearOutBoundary(){
            let ies = self.itemList.children();
            let cii = self.__getCurrentItemIndex();
            if(direction < 0){
                for(let i = 0; i < ies.length; i++){
                    let item = ies.eq(i);
                    if(!isOutBoundary(item))
                        break;
                    if(i >= cii - 1)
                        break;
                    let itemHeight = item.outerHeight(true);
                    let cs = self.container.scrollTop();
                    item.remove();
                    self.container.scrollTop(cs - itemHeight);
                }
            }
            else{
                for(let i = ies.length - 1; i >= 0; i--){
                    let item = ies.eq(i);
                    if(!isOutBoundary(item))
                        break;
                    if(i <= cii + 1)
                        break;
                    item.remove();
                }
            }
        }

        function next(){
            let es = self.itemList.children();
            let be = null;
            if(es.length > 0){
                be = direction >= 0 ? es.last() : es.first();
            }
            self.onNewListItem(self, be, direction,
                function(newItem, type){
                    if(!newItem){
                        if(type == 1){
                            // 该元素是边界
                            // 标记边界
                            let bbe = getBoundaryItem();
                            if(bbe){
                                bbe.data(direction + 'end', true);
                            }
                        }
                        if(success)success();
                        return;
                    }
                    if(!be){
                        self.setCurrentItem(newItem);
                    }

                    if(direction >= 0){
                        self.itemList.append(newItem);
                    }
                    else{
                        self.itemList.prepend(newItem);
                        let cs = self.container.scrollTop();
                        self.container.scrollTop(cs + newItem.outerHeight(true));
                    }
                    if(!isBoundarySatisfied())
                        next();
                    else{
                        if(success)success();
                    }
                });
        }

        let self = this;
        if(!isBoundarySatisfied()){
            next();
        }
        else{
            // if(willClear){
            //     clearOutBoundary();
            // }
            if(success)success();
        }
    }


    return Infinitelist;
});

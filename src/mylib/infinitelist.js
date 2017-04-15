define(["jquery", "co"], function($, co) {

    "use strict"

    class Infinitelist{

        constructor(container, itemList, onNewListItem, onNewListItemFinished){
            this.container = container; // 容器
            this.itemList = itemList; // 元素列表
            this.onNewListItem = onNewListItem; // 获取列表元素的函数
            this.onNewListItemFinished = onNewListItemFinished; // 获取列表元素完成的函数

            // self.container.on('scroll', self.__scrollEvent.bind(self));

            this.currentItem = null; // 当前元素

            this.DOWN_THRESHOLD = 3; // 向下加载长度的阈值
            this.UP_THRESHOLD = 1; // 向下加载长度的阈值
            this.CHECK_SCROLL_THRESHOLD = 0.9; // 当滑动多长的距离检查一次
            this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1; // 当滑动多长的距离检查一次当前元素改动

            this.__lastCheckScrollY = null; // 上次检查边界时滑动的位置
            this.__lastCurrentChangeCheckScrollY = null; // 上次检查当前元素改变时滑动的位置

            // 当前正在呈现的元素改变的事件
            this.onCurrentItemChanged = null;
            // 是否正在检查边界
            this.isCheckingBoundary = false;

        }


        // 获取页内的滚动位置
        getPageScorllTop(){
            if(this.currentItem)
                return this.container.scrollTop() - this.currentItem.position().top;
            else
                return 0;
        }

        // 滑动到下一个元素
        nextItem(){
            let i = this.__getCurrentItemIndex();
            if(i < 0)
                return;

            const ics = this.itemList.children();
            i++;
            if(i < ics.length){
                const ni = ics.eq(i);
                this.container.scrollTop(ni.position().top);
            }
        }

        // 滑动到上一个元素
        lastItem(){
            let i = this.__getCurrentItemIndex();
            if(i < 0)
                return;

            const ics = this.itemList.children();
            i--;
            if(i >= 0){
                const ni = ics.eq(i);
                this.container.scrollTop(ni.position().top);
            }
        }

        // 加载列表数据
        loadList(){
            return this.checkBoundary();
        }

        // 清空列表数据
        emptyList(){
            this.currentItem = null;
            this.container.scrollTop(0);
            this.itemList.empty();
            this.__lastCheckScrollY = null;
        }

        // 清空列表数据
        computeCurrentItems(){
            const wh = $(window).height();
            const items = this.itemList.children();
            const result = [];
            for(let i = 0; i < items.length; i++)
            {
                const item = items.eq(i);
                const top = item.offset().top;
                const height = item.outerHeight(true);
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
        __getCurrentItemIndex(){
            if(!this.currentItem)
                return -1;
            const ics = this.itemList.children();
            return Array.prototype.indexOf.bind(ics)(this.currentItem[0]);
        }


        // 容器的滚动事件
        __scrollEvent(event){
            const scrollY = this.container.scrollTop();

            if(this.__lastCurrentChangeCheckScrollY == null){
                this.__checkCurrentItemChange();
            }
            else{
                const wh = $(window).height();
                if(Math.abs(scrollY - this.__lastCurrentChangeCheckScrollY) > wh * this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD) {
                    this.__checkCurrentItemChange();
                }
            }

            if(this.__lastCheckScrollY == null){
                this.checkBoundary();
            }
            else{
                const wh = $(window).height();
                if(Math.abs(scrollY - this.__lastCheckScrollY) > wh * this.CHECK_SCROLL_THRESHOLD) {
                    this.checkBoundary();
                }
            }
        }

        // 检查当前元素是否改变
        __checkCurrentItemChange(){
            this.__lastCurrentChangeCheckScrollY = this.container.scrollTop();
            if(!this.currentItem){
                return;
            }
            const cis = this.computeCurrentItems();

            const i = cis.findIndex(e => Infinitelist.__itemEqual(e, this.currentItem));
            if(i < 0){
                this.setCurrentItem(cis[0]);
            }
        }


        // 设置当前元素
        setCurrentItem(newCurrentItem){
            const oldValue = this.currentItem;
            if(Infinitelist.__itemEqual(newCurrentItem, oldValue))
                return;

            this.currentItem = newCurrentItem;
            if(this.onCurrentItemChanged){
                this.onCurrentItemChanged(this, newCurrentItem, oldValue);
            }
        }


        // 向下、上检查
        checkBoundary(){
            if(this.isCheckingBoundary)
                return;
            this.isCheckingBoundary = true;
            this.container.off('scroll', this.__scrollEvent.bind(this));

            const curScrollY = this.container.scrollTop();
            let scrollDirection = 1;
            if(this.__lastCheckScrollY){
                scrollDirection = curScrollY > this.__lastCheckScrollY ? 1 : -1;
            }
            this.__lastCheckScrollY = curScrollY;

            return co(this.__checkBoundary(scrollDirection, false))
                .then(() => co(this.__checkBoundary(-scrollDirection, true)))
                .then(() => {
                    this.container.on('scroll', this.__scrollEvent.bind(this));
                    this.isCheckingBoundary = false;
                });
        }


        // 检查指定方向的边界
        *__checkBoundary(direction, willClear){

            function isOutBoundary(item){
                const wh = $(window).height();
                let result = false;
                if(direction >= 0)
                    result = item.offset().top > (self.DOWN_THRESHOLD + 1) * wh;
                else
                    result = item.offset().top + item.outerHeight(true) < - self.UP_THRESHOLD * wh;
                return result;
            }

            function getBoundaryItem(){
                const es = self.itemList.children();
                if(es.length <= 0)
                    return null;
                return direction >= 0 ? es.last() : es.first();
            }

            function isBoundarySatisfied(){
                function isOnBoundary(item){
                    const wh = $(window).height();
                    let result = false;
                    if(direction >= 0)
                        result = item.offset().top + item.outerHeight(true) > (self.DOWN_THRESHOLD + 1) * wh;
                    else
                        result = item.offset().top < -self.UP_THRESHOLD * wh;
                    return result;
                }

                const be = getBoundaryItem();
                if(!be)
                    return false;
                // 边界元素被标记为端 或者 在边界内
                const result = be.data(direction + 'end') ||
                    !Infinitelist.__itemEqual(self.currentItem, be) && isOnBoundary(be);
                return result;
            }

            function clearOutBoundary(){
                const ies = self.itemList.children();
                const cii = self.__getCurrentItemIndex();
                if(direction < 0){
                    for(let i = 0; i < ies.length; i++){
                        const item = ies.eq(i);
                        if(!isOutBoundary(item))
                            break;
                        if(i >= cii - 1)
                            break;
                        const itemHeight = item.outerHeight(true);
                        const cs = self.container.scrollTop();
                        item.remove();
                        self.container.scrollTop(cs - itemHeight);
                    }
                }
                else{
                    for(let i = ies.length - 1; i >= 0; i--){
                        const item = ies.eq(i);
                        if(!isOutBoundary(item))
                            break;
                        if(i <= cii + 1)
                            break;
                        item.remove();
                    }
                }
            }


            const self = this;
            while(!isBoundarySatisfied()){
                const es = self.itemList.children();
                let be = null;
                if(es.length > 0){
                    be = direction >= 0 ? es.last() : es.first();
                }

                const {newItem, type} = yield self.onNewListItem(self, be, direction);

                if(!newItem){
                    if(type == 1){
                        // 该元素是边界
                        // 标记边界
                        const bbe = getBoundaryItem();
                        if(bbe){
                            bbe.data(direction + 'end', true);
                        }
                    }
                    break;
                }
                if(!be){
                    self.setCurrentItem(newItem);
                }

                if(direction >= 0){
                    self.itemList.append(newItem);
                }
                else{
                    const cs = self.container.scrollTop();
                    self.itemList.prepend(newItem);
                    self.container.scrollTop(cs + newItem.outerHeight(true));
                }
                if(self.onNewListItemFinished)
                    self.onNewListItemFinished(self, be, direction);
            }
            // if(willClear){
            //     clearOutBoundary();
            // }
            return Promise.resolve();
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


    return Infinitelist;
});

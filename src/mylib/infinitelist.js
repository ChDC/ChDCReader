define(["jquery", "co"], function($, co) {

  "use strict"

  class Infinitelist{

    constructor(container, itemList, onNewListItem, onNewListItemFinished){
      this.__container = container; // 容器
      this.__itemList = itemList; // 元素列表
      this.onNewListItem = onNewListItem; // 获取列表元素的函数
      this.onNewListItemFinished = onNewListItemFinished; // 获取列表元素完成的函数

      // self.__container.on('scroll', self.__scrollEventBindThis);

      this.__currentItem = null; // 当前元素

      this.DOWN_THRESHOLD = 3; // 向下加载长度的阈值
      this.UP_THRESHOLD = 1; // 向下加载长度的阈值
      this.CHECK_SCROLL_THRESHOLD = 0.9; // 当滑动多长的距离检查一次
      this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1; // 当滑动多长的距离检查一次当前元素改动

      this.__lastCheckScrollY = null; // 上次检查边界时滑动的位置
      this.__lastCurrentChangeCheckScrollY = null; // 上次检查当前元素改变时滑动的位置

      // 当前正在呈现的元素改变的事件
      this.onCurrentItemChanged = null;
      // 是否正在检查边界
      this.__isCheckingBoundary = false;

      this.__scrollEventBindThis = this.__scrollEvent.bind(this);
    }


    // 获取页内的滚动位置
    getPageScorllTop(){
      if(this.__currentItem)
        return this.__container.scrollTop() - this.__currentItem.position().top;
      else
        return 0;
    }

    // 滑动到下一个元素
    nextItem(){
      let i = this.__getCurrentItemIndex();
      if(i < 0)
        return;

      const ics = this.__itemList.children();
      i++;
      if(i < ics.length){
        const ni = ics.eq(i);
        this.__container.scrollTop(ni.position().top);
      }
    }

    // 滑动到上一个元素
    lastItem(){
      let i = this.__getCurrentItemIndex();
      if(i < 0)
        return;

      const ics = this.__itemList.children();
      i--;
      if(i >= 0){
        const ni = ics.eq(i);
        this.__container.scrollTop(ni.position().top);
      }
    }

    // 加载列表数据
    loadList(){
      return this.checkBoundary();
    }

    // 关闭
    close(){
      this.__container.off('scroll', this.__scrollEventBindThis);
      this.__itemList.empty();

      this.__container = null;
      this.__itemList = null;
      this.__currentItem = null;
      this.onNewListItem = null;
      this.onNewListItemFinished = null;
      this.onCurrentItemChanged = null;
      this.__lastCheckScrollY = null;
    }

    getCurrentItem(){
      return this.__currentItem;
    }

    // 清空列表数据
    computeCurrentItems(){
      const wh = $(window).height();
      const items = this.__itemList.children();
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
      if(!this.__currentItem)
        return -1;
      const ics = this.__itemList.children();
      return Array.prototype.indexOf.bind(ics)(this.__currentItem[0]);
    }


    // 容器的滚动事件
    __scrollEvent(event){
      const scrollY = this.__container.scrollTop();

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
      this.__lastCurrentChangeCheckScrollY = this.__container.scrollTop();
      if(!this.__currentItem){
        return;
      }
      const cis = this.computeCurrentItems();

      const i = cis.findIndex(e => Infinitelist.__itemEqual(e, this.__currentItem));
      if(i < 0){
        this.setCurrentItem(cis[0]);
      }
    }


    // 设置当前元素
    setCurrentItem(newCurrentItem){
      const oldValue = this.__currentItem;
      if(Infinitelist.__itemEqual(newCurrentItem, oldValue))
        return;

      this.__currentItem = newCurrentItem;
      if(this.onCurrentItemChanged){
        this.onCurrentItemChanged(this, newCurrentItem, oldValue);
      }
    }


    // 向下、上检查
    checkBoundary(){
      // 加锁
      if(this.__isCheckingBoundary) return;
      this.__isCheckingBoundary = true;
      this.__container.off('scroll', this.__scrollEventBindThis);

      const curScrollY = this.__container.scrollTop();
      let scrollDirection = 1;
      if(this.__lastCheckScrollY){
        scrollDirection = curScrollY > this.__lastCheckScrollY ? 1 : -1;
      }
      this.__lastCheckScrollY = curScrollY;

      let self = this;
      return co(function*(){
        yield self.__checkBoundary(scrollDirection, false);
        yield self.__checkBoundary(-scrollDirection, true);

        // 解锁
        self.__container.on('scroll', self.__scrollEventBindThis);
        self.__isCheckingBoundary = false;
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
        const es = self.__itemList.children();
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
        if(!self.__container)
          return true;

        const be = getBoundaryItem();
        if(!be)
          return false;
        // 边界元素被标记为端 或者 在边界内
        const result = be.data(direction + 'end') ||
          !Infinitelist.__itemEqual(self.__currentItem, be) && isOnBoundary(be);
        return result;
      }

      function clearOutBoundary(){
        const ies = self.__itemList.children();
        const cii = self.__getCurrentItemIndex();
        if(direction < 0){
          for(let i = 0; i < ies.length; i++){
            const item = ies.eq(i);
            if(!isOutBoundary(item))
              break;
            if(i >= cii - 1)
              break;
            const itemHeight = item.outerHeight(true);
            const cs = self.__container.scrollTop();
            item.remove();
            self.__container.scrollTop(cs - itemHeight);
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
        const es = self.__itemList.children();
        let be = null;
        if(es.length > 0){
          be = direction >= 0 ? es.last() : es.first();
        }

        const {newItem, type} = yield self.onNewListItem(self, be, direction);

        if(!newItem || newItem.length <= 0){
          if(type == 1){
            // 该元素是边界
            // 标记边界
            const bbe = getBoundaryItem();
            if(bbe){
              bbe.data(direction + 'end', true);
            }
          }
          // 没有获取到新元素，应该退出
          // break;
          return Promise.resolve();
        }
        if(!be){
          self.setCurrentItem(newItem);
        }

        if(direction >= 0){
          self.__itemList.append(newItem);
        }
        else{
          const cs = self.__container.scrollTop();
          self.__itemList.prepend(newItem);
          self.__container.scrollTop(cs + newItem.outerHeight(true));
        }

        // 将所有的图片的 onload 事件都设置好
        let imgs = newItem.find('img');
        yield Promise.all(Array.from(imgs).map(img =>
            new Promise((resolve, reject) => {

              function onloadOrError(e){
                img.removeEventListener('load', onloadOrError);
                img.removeEventListener('error', onloadOrError);
                resolve();
              }
              img.addEventListener('load', onloadOrError);
              img.addEventListener('error', onloadOrError);
          })));

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

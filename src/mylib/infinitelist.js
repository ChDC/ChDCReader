define(["co"], function(co) {

  "use strict"

  class Infinitelist{

    // options
    // * ifCheckPrevious 是否检查前面的内容边界
    constructor(container, itemList,
            nextItemGenerator, previousItemGenerator,
            options={}){

      this.__container = container; // 容器
      this.__itemList = itemList; // 元素列表
      this.previousItemGenerator = previousItemGenerator; // 获取列表元素的函数
      this.nextItemGenerator = nextItemGenerator; // 获取列表元素的函数
      this.options = options;

      // 事件
      // this.onFirstNewItemFinished = undefined; // 当获取第一个列表元素完成的函数
      this.onNewItemFinished = undefined; // 获取列表元素完成的函数
      this.onNoNewItemToLoad = undefined; // 当没有元素可以获取到的时候触发
      this.onError = undefined;
      this.onCurrentItemChanged = null;  // 当前正在呈现的元素改变的事件

      // this.__container.on('scroll', this.__scrollEventBindThis);

      // 私有成员
      this.__currentItem = null; // 当前元素
      this.__lastCheckScrollY = null; // 上次检查边界时滑动的位置
      this.__lastCurrentChangeCheckScrollY = null; // 上次检查当前元素改变时滑动的位置
      this.__isCheckingBoundary = false; // 是否正在检查边界
      this.__scrollEventBindThis = this.__scrollEvent.bind(this);

      // 常量
      this.DOWN_THRESHOLD = 3; // 向下加载长度的阈值
      this.UP_THRESHOLD = 1; // 向上加载长度的阈值
      this.CHECK_SCROLL_THRESHOLD = 0.9; // 当滑动多长的距离检查一次
      this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1; // 当滑动多长的距离检查一次当前元素改动
      this.PREVIOUS = 1;
      this.NEXT = -1;
    }

    // 获取页内的滚动位置
    getPageScorllTop(){
      return this.__currentItem ? this.__container.scrollTop - this.__currentItem.offsetTop : 0;
    }

    // 获取当前页面的滚动比
    getScrollRate(){
      if(!this.__currentItem)
        return 0;
      let rate = (this.__container.scrollTop - this.__currentItem.offsetTop + this.__container.offsetHeight) / this.__currentItem.offsetHeight;
      return rate > 1 ? 1 : rate;
    }

    // 滑动到下一个元素
    nextItem(){
      let i = this.__getCurrentItemIndex();
      const ics = this.__itemList.children;
      if(i >= 0 && ++i < ics.length){
        this.__container.scrollTop = ics[i].offsetTop;
        return;
      }

      // 没有元素了
      co(this.__addItem(1))
        .then(newItem => {
          if(newItem){
            this.__checkCurrentItemChange(); // 强制刷新
            this.__container.scrollTop = newItem.offsetTop;
          }
        });
    }

    // 滑动到上一个元素
    previousItem(){
      // 如果当前位置不是本章首位就滚动到本章首位
      let st = this.getPageScorllTop();
      if(st > 0){
        this.__container.scrollTop = this.__currentItem.offsetTop;
        return;
      }

      let i = this.__getCurrentItemIndex();
      if(--i >= 0){
        const ics = this.__itemList.children;
        this.__container.scrollTop = ics[i].offsetTop;
        return;
      }

      // 没有元素了
      co(this.__addItem(-1))
        .then(newItem => {
          if(newItem){
            this.__checkCurrentItemChange(); // 强制刷新
            this.__container.scrollTop = newItem.offsetTop;
          }
        });
    }

    // 加载列表数据
    loadList(){
      return this.checkBoundary();
    }

    // 关闭
    close(){
      this.__container.removeEventListener('scroll', this.__scrollEventBindThis);
      Array.from(this.__itemList.children).forEach(e => e.remove());

      for(let key in this)
        delete this[key];
    }

    getCurrentItem(){
      return this.__currentItem;
    }


    // 获取当前元素的索引
    __getCurrentItemIndex(){
      if(!this.__currentItem) return -1;
      const ics = this.__itemList.children;
      return Array.from(ics).indexOf(this.__currentItem);
    }

    // 容器的滚动事件
    __scrollEvent(event){
      const scrollY = this.__container.scrollTop;

      if(this.__lastCurrentChangeCheckScrollY == null)
        this.__checkCurrentItemChange();
      else {
        const wh = this.__container.offsetHeight;
        if(Math.abs(scrollY - this.__lastCurrentChangeCheckScrollY) > wh * this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD) {
          this.__checkCurrentItemChange();
        }
      }

      if(this.__lastCheckScrollY == null)
        this.checkBoundary();
      else{
        const wh = this.__container.offsetHeight;
        if(Math.abs(scrollY - this.__lastCheckScrollY) > wh * this.CHECK_SCROLL_THRESHOLD) {
          this.checkBoundary();
        }
      }
    }

    // 检查当前元素是否改变
    __checkCurrentItemChange(){
      this.__lastCurrentChangeCheckScrollY = this.__container.scrollTop;
      if(!this.__currentItem) return;

      const cis = this.computeCurrentItems();
      const i = cis.findIndex(e => e == this.__currentItem);
      if(i < 0)
        this.setCurrentItem(cis[0]);
    }


    // 设置当前元素
    setCurrentItem(newCurrentItem){
      const oldValue = this.__currentItem;
      if(newCurrentItem == oldValue)
        return;

      this.__currentItem = newCurrentItem;
      if(this.onCurrentItemChanged)
        this.onCurrentItemChanged(this, newCurrentItem, oldValue);
    }


    // 向下、上检查
    checkBoundary(){
      // 加锁
      if(this.__isCheckingBoundary) return;
      this.__isCheckingBoundary = true;
      this.__container.removeEventListener('scroll', this.__scrollEventBindThis);

      const curScrollY = this.__container.scrollTop;
      let scrollDirection = this.PREVIOUS;
      if(this.__lastCheckScrollY)
        scrollDirection = curScrollY > this.__lastCheckScrollY ? this.PREVIOUS : this.NEXT;
      this.__lastCheckScrollY = curScrollY;


      let self = this;
      return co(function*(){
        yield self.__checkBoundary(scrollDirection, true);
        yield self.__checkBoundary(-scrollDirection, true);

        // 解锁
        self.__container.addEventListener('scroll', self.__scrollEventBindThis);
        self.__isCheckingBoundary = false;
      });
    }

    // 计算当前元素
    computeCurrentItems(){
      const wh = this.__container.offsetHeight;
      const items = this.__itemList.children;
      const result = [];
      for(let item of Array.from(items)){
        const top = item.getBoundingClientRect().top;
        const height = item.offsetHeight;
        if(top + height <= 0.1 * wh)
          continue;
        else if(top > 0.9 * wh)
          break;
        else
          result.push(item);
      }
      return result;
    }

    // 在指定方向上检查指定元素是否超出边界
    __isOutBoundary(item, direction){
      const wh = this.__container.offsetHeight;
      let result = false;
      let top = item.getBoundingClientRect().top;
      if(direction >= 0)
        result = top > (this.DOWN_THRESHOLD + 1) * wh;
      else
        result = top + item.offsetHeight < - this.UP_THRESHOLD * wh;
      return result;
    }

    // 在指定方向上检查指定元素是否在边界上
    __isOnBoundary(item, direction){
      const wh = this.__container.offsetHeight;
      let result = false;
      let top = item.getBoundingClientRect().top;
      if(direction >= 0)
        result = top + item.offsetHeight > (this.DOWN_THRESHOLD + 1) * wh;
      else
        result = top < -this.UP_THRESHOLD * wh;
      return result;
    }

    // 清理超出边界的元素
    clearOutBoundary(){
      const ies = this.__itemList.children;
      const cii = this.__getCurrentItemIndex();

      // 清理后面的元素
      for(let i = ies.length - 1; i >=0; i--){
        let item = ies[i];
        if(!this.__isOutBoundary(item, this.PREVIOUS) || i <= cii + 1)
          break;
        item.remove();
      }

      // 清理前面的元素
      for(let i = 0; i < ies.length; i++){
        let item = ies[i];
        if(!this.__isOutBoundary(item, this.NEXT) || i >= cii - 1)
          break;
        const itemHeight = item.offsetHeight;
        const cs = this.__container.scrollTop;
        item.remove();
        this.__container.scrollTop = cs - itemHeight;
      }
    }

    // 获取边界元素
    __getBoundaryItem(direction){
      const es = this.__itemList.children;
      if(es.length <= 0)
        return null;
      return direction >= 0 ? es[es.length-1] : es[0];
    }

    __isBoundarySatisfied(direction){
      if(!this.__container) return true;

      const be = this.__getBoundaryItem(direction);
      if(!be) return false;
      // 边界元素被标记为端 或者 在边界内
      const result = be.dataset['end'] == direction ||
        this.__currentItem != be && this.__isOnBoundary(be, direction);
      return result;
    }

    // 在指定方向的末端添加新元素
    *__addItem(direction){
      let result;
      let isFirstItem = !this.__getBoundaryItem(direction);
      try{
        if(direction >= 0 && this.nextItemGenerator)
          result = yield this.nextItemGenerator.next();
        else if(direction < 0 && this.previousItemGenerator)
          result = yield this.previousItemGenerator.next();
        else
          return Promise.resolve(null);
      }
      catch(error){
        if(this.onError)
          this.onError(this, error);
        throw error;
      }

      let {value: newItem, done} = result;

      // 把元素添加到 DOM 上
      if(direction >= 0 && newItem)
        this.__itemList.append(newItem);
      else if(direction < 0 && newItem) {
        const cs = this.__container.scrollTop;
        this.__itemList.prepend(newItem);
        this.__container.scrollTop = cs + newItem.offsetHeight;
      }

      if(isFirstItem)
        this.setCurrentItem(newItem); // 设置当前元素为第一个元素

      if(done){
        // 没有获取到新元素
        // 标记最后一个元素为边界
        const be = this.__getBoundaryItem(direction);
        if(be) be.dataset['end'] = direction;
        if(this.onNoNewItemToLoad) this.onNoNewItemToLoad(this, be);
      }

      // 将所有的图片的 onload 事件都设置好
      if(newItem){
        let imgs = newItem.querySelectorAll('img');
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
      }

      // if(isFirstItem && this.onFirstNewItemFinished)
      //   this.onFirstNewItemFinished(this, newItem, direction);
      if(newItem && this.onNewItemFinished)
        this.onNewItemFinished(this, newItem, direction);

      return Promise.resolve(newItem);
    }

    // 检查指定方向的边界
    *__checkBoundary(direction, ifClear){

      // 如果不允许向上检查就退出
      if(!this.options.ifCheckPrevious && direction < 0)
        return Promise.resolve();

      while(!this.__isBoundarySatisfied(direction)){
        yield this.__addItem(direction);
        if(ifClear)
          this.clearOutBoundary();
      }

      return Promise.resolve();
    }
  }

  return Infinitelist;
});

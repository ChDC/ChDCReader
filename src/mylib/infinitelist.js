;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["Infinitelist"] = factory.apply(undefined, deps.map(e => window[e]));
}(["co", "utils"], function(co, utils) {

  "use strict";

  class Infinitelist{

    // buildElement(boundaryElement, direction) 当为 null 时表示加载第一个元素
    // options
    // * disableCheckPrevious 是否检查前面的内容边界
    constructor(container, elementList,
            buildElement,
            options={}){

      this.__container = container; // 容器
      this.__elementList = elementList; // 元素列表
      this.buildElement = buildElement;
      // this.previousElementGenerator = previousElementGenerator; // 获取列表元素的函数
      // this.nextElementGenerator = nextElementGenerator; // 获取列表元素的函数
      this.options = options;

      // 事件
      // newElementFinished // 获取列表元素完成的函数
      // NoNewElementToLoad // 当没有元素可以获取到的时候触发
      // error
      // CurrentElementChanged // 当前正在呈现的元素改变的事件


      // 私有成员
      this.__currentElement = null; // 当前元素
      this.__isCheckingBoundary = false; // 是否正在检查边界，用于加锁

      // 常量
      this.DOWN_THRESHOLD = 3; // 向下加载长度的阈值，单位为容器的高度
      this.UP_THRESHOLD = 1; // 向上加载长度的阈值，单位为容器的高度

      this.PREVIOUS = -1; // 前面，上面
      this.NEXT = 1;// 后面，下面

      this.__enableScrollSupport();
      utils.addEventSupport(this);
    }


    // 获取页内的滚动位置
    getPageScorllTop(){
      return this.__currentElement ? this.__container.scrollTop - this.__currentElement.offsetTop : 0;
    }

    // 获取当前页面的滚动比
    getScrollRate(){
      if(!this.__currentElement)
        return 0;
      let rate = (this.__container.scrollTop - this.__currentElement.offsetTop + this.__container.offsetHeight) / this.__currentElement.offsetHeight;
      return rate > 1 ? 1 : rate;
    }

    // 滑动到下一个元素
    nextElement(){
      let i = this.__getCurrentElementIndex();
      const ics = this.__elementList.children;
      if(i >= 0 && ++i < ics.length){
        this.__container.scrollTop = ics[i].offsetTop;
        return Promise.resolve();
      }

      if(!this.options.disableCheckNext)
        return new Promise((resolve, reject) => {
          this.addEventListener("newElementAddedToDOM", ()=>{
            this.nextElement();
            // resolve();
          }, true);
        });

      // 没有元素了
      return co(this.__addElement(this.NEXT))
        .then(newElement => {
          if(newElement){
            this.__container.scrollTop = newElement.offsetTop;
            this.__checkCurrentElementChange(this.NEXT); // 强制刷新
          }
        });
    }

    // 滑动到上一个元素
    previousElement(){
      // 如果当前位置不是本章首位就滚动到本章首位
      let st = this.getPageScorllTop();
      if(st > 0){
        this.__container.scrollTop = this.__currentElement.offsetTop;
        return Promise.resolve();
      }

      let i = this.__getCurrentElementIndex();
      if(--i >= 0){
        const ics = this.__elementList.children;
        this.__container.scrollTop = ics[i].offsetTop;
        return Promise.resolve();
      }

      // 没有元素了

      // 如果没有禁用了自动添加前一章，则等待加载完成
      if(!this.options.disableCheckPrevious)
        return new Promise((resolve, reject) => {
          this.addEventListener("newElementAddedToDOM", ()=>{
            this.previousElement();
            // resolve();
          }, true);
        });
        // return Promise.reject();

      // 如果禁用了自动添加前一章，则添加一个元素
      return co(this.__addElement(this.PREVIOUS))
        .then(newElement => {
          if(newElement) {
            this.__container.scrollTop = newElement.offsetTop;
            this.__checkCurrentElementChange(this.PREVIOUS); // 强制刷新
          }
        });
    }

    // 加载列表数据
    loadList(){

      return this.checkBoundary(this.NEXT)
        .then(() => {
          // 如果允许向上检查就检查
          if(!this.options.disableCheckPrevious)
            return this.checkBoundary(this.PREVIOUS, true);
        });
    }

    // 关闭
    close(){
      this.__container.removeEventListener('scroll', this.__scrollEventBindThis);
      Array.from(this.__elementList.children).forEach(e => e.remove());
      this.__container.scrollTop = 0;
      for(let key in this)
        delete this[key];
    }

    getCurrentElement(){
      return this.__currentElement;
    }


    // 获取当前元素的索引
    __getCurrentElementIndex(){
      if(!this.__currentElement) return -1;
      const ics = this.__elementList.children;
      return Array.from(ics).indexOf(this.__currentElement);
    }


    __enableScrollSupport(){

      let __lastCheckScrollY = 0; // 上次检查边界时滑动的位置
      let __lastCurrentChangeCheckScrollY = 0; // 上次检查当前元素改变时滑动的位置
      let __lastScrollTop = 0; // 用于确定滚动方向的上次滚动的记录值
      const CHECK_SCROLL_THRESHOLD = 0.9; // 当滑动多长的距离检查一次
      const CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD = 0.1; // 当滑动多长的距离检查一次当前元素改动

      // 容器的滚动事件
      let __scrollEvent = (event) => {
        const target = event.currentTarget;
        let cst = target.scrollTop;
        let offset = cst - __lastScrollTop;
        event.scrollTop = cst;
        let direction = offset >= 0 ? 1 : -1;

        if(offset > 0){
          // 向下滚动
          if(__onScroll(event, direction))
            this.fireEvent("scrollDown", {scrollTop: cst});
        }
        else if(offset < 0){
          // 向上滚动
          if(__onScroll(event, direction))
            this.fireEvent("scrollUp", {scrollTop: cst});
        }
        __lastScrollTop = cst;
      }

      // 处理滚动的业务
      let __onScroll = (event, direction) => {

        const wh = this.__container.offsetHeight;
        if(Math.abs(event.scrollTop - __lastCurrentChangeCheckScrollY) > wh * CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD) {
          __lastCurrentChangeCheckScrollY = this.__container.scrollTop;
          this.__checkCurrentElementChange(direction);
        }

        if(!this.__isCheckingBoundary && Math.abs(event.scrollTop - __lastCheckScrollY) > wh * CHECK_SCROLL_THRESHOLD) {
          if(this.options.disableCheckPrevious && direction == this.PREVIOUS)
            return;
          __lastCheckScrollY = this.__container.scrollTop;
          this.checkBoundary(direction);
        }
        return !this.__isCheckingBoundary;
      };

      this.__scrollEventBindThis = __scrollEvent.bind(this);
      this.__container.addEventListener('scroll', this.__scrollEventBindThis);
    }

    // 检查当前元素是否改变
    __checkCurrentElementChange(direction){
      // if(!this.__currentElement) return;
      const CURRENT_ELEMENT_CHANGED_THRESHOLD = 0.1; // 检查当前元素变化的阈值，单位为容器的高度
      const wh = this.__container.offsetHeight;

      let currentElement;
      const elements = Array.from(this.__elementList.children);
      // 如果正在向下滑动就查找第一个在下边界的元素
      if(direction > 0)
        currentElement = elements.reverse().find(e =>
          e.getBoundingClientRect().top < (1 - CURRENT_ELEMENT_CHANGED_THRESHOLD) * wh);
      // 如果正在向上滑动就查找第一个在上边界的元素
      else if(direction < 0)
        currentElement = elements.find(e =>
          e.getBoundingClientRect().top + e.offsetHeight > CURRENT_ELEMENT_CHANGED_THRESHOLD * wh);

      if(currentElement && currentElement != this.__currentElement)
        this.setCurrentElement(currentElement);
    }

    // 设置当前元素
    setCurrentElement(newCurrentElement){
      const oldValue = this.__currentElement;
      if(newCurrentElement == oldValue)
        return;

      this.__currentElement = newCurrentElement;
      this.fireEvent("currentElementChanged", {new: newCurrentElement, old: oldValue});
    }


    // 向下、上检查
    checkBoundary(direction){
      // 加锁
      if(this.__isCheckingBoundary) return;
      this.__isCheckingBoundary = true;
      // this.__container.removeEventListener('scroll', this.__scrollEventBindThis);

      return co(this.__checkBoundary(direction))
        .then(() => {
          // 解锁
          // this.__container.addEventListener('scroll', this.__scrollEventBindThis);
          this.__isCheckingBoundary = false;
        })
        .catch(error => {
          this.__isCheckingBoundary = false;
          throw error;
        });
    }


    // 在指定方向上检查指定元素是否超出边界
    __isOutBoundary(element, direction){
      const wh = this.__container.offsetHeight;
      let result = false;
      let top = element.getBoundingClientRect().top;
      if(direction >= 0)
        result = top > (this.DOWN_THRESHOLD + 1) * wh;
      else
        result = top + element.offsetHeight < - this.UP_THRESHOLD * wh;
      return result;
    }

    // 在指定方向上检查指定元素是否在边界上
    __isOnBoundary(element, direction){
      const wh = this.__container.offsetHeight;
      let result = false;
      let top = element.getBoundingClientRect().top;
      if(direction >= 0)
        result = top + element.offsetHeight > (this.DOWN_THRESHOLD + 1) * wh;
      else
        result = top < -this.UP_THRESHOLD * wh;
      return result;
    }

    // 清理超出边界的元素
    clearOutBoundary(direction){
      const ies = this.__elementList.children;
      const cii = this.__getCurrentElementIndex();

      let select = !direction ? 3 : direction > 0 ? 1 : 2;

      if(select & 1)
        // 清理后面的元素
        for(let i = ies.length - 1; i >= cii + 3; i--){
          let element = ies[i];
          if(!this.__isOutBoundary(element, this.NEXT))
            break;
          element.remove();
        }

      if(select & 2)
        // 清理前面的元素
        for(let i = 0; i <= cii - 3; i++){
          let element = ies[i];
          if(!this.__isOutBoundary(element, this.PREVIOUS))
            break;
          const elementHeight = element.offsetHeight;
          const cs = this.__container.scrollTop;
          element.remove();
          this.__container.scrollTop = cs - elementHeight;
        }
    }

    // 获取边界元素
    __getBoundaryElement(direction){
      const es = this.__elementList.children;
      if(es.length <= 0)
        return null;
      return direction >= 0 ? es[es.length-1] : es[0];
    }

    __isBoundarySatisfied(direction){
      if(!this.__container) return true;

      const be = this.__getBoundaryElement(direction);
      if(!be) return false;
      // 边界元素被标记为端 或者 在边界内
      const result = be.dataset['end'] == direction ||
        this.__currentElement != be && this.__isOnBoundary(be, direction);
      return result;
    }

    // 在指定方向的末端添加新元素
    *__addElement(direction){
      let result;
      let boundaryElement = this.__getBoundaryElement(direction);
      let isFirstElement = !boundaryElement;
      try{
        if(this.buildElement)
          result = yield this.buildElement(boundaryElement, direction);
        else
          return Promise.resolve(null);
      }
      catch(error){
        this.fireEvent("error", {error: error});
        throw error;
      }

      let {value: newElement, done} = result;

      // 把元素添加到 DOM 上
      if(direction >= 0 && newElement){
        this.__elementList.appendChild(newElement);
        this.clearOutBoundary(-direction);
      }
      else if(direction < 0 && newElement) {
        const cs = this.__container.scrollTop;
        this.__elementList.insertBefore(newElement, this.__elementList.children[0]);
        this.__container.scrollTop = cs + newElement.offsetHeight;
      }

      if(newElement){
        this.fireEvent("newElementAddedToDOM", {newElement: newElement, direction: direction});
      }

      if(isFirstElement)
        this.setCurrentElement(newElement); // 设置当前元素为第一个元素

      if(done){
        // 没有获取到新元素
        // 标记最后一个元素为边界
        const be = this.__getBoundaryElement(direction);
        if(be) be.dataset['end'] = direction;
        this.fireEvent("noNewElementToLoad", {boundaryElement: be});
      }

      if(newElement)
        this.fireEvent("newElementFinished", {newElement: newElement, direction: direction, isFirstElement: isFirstElement});

      return Promise.resolve(newElement);
    }

    // 检查指定方向的边界
    *__checkBoundary(direction, ifClear){

      while(!this.__isBoundarySatisfied(direction)){
        yield this.__addElement(direction);
      }

      return Promise.resolve();
    }
  }

  return Infinitelist;
}));

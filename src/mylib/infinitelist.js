define(["co"], function(co) {

  "use strict"

  class Infinitelist{

    // options
    // * ifCheckPrevious 是否检查前面的内容边界
    constructor(container, elementList,
            nextElementGenerator, previousElementGenerator,
            options={}){

      this.__container = container; // 容器
      this.__elementList = elementList; // 元素列表
      this.previousElementGenerator = previousElementGenerator; // 获取列表元素的函数
      this.nextElementGenerator = nextElementGenerator; // 获取列表元素的函数
      this.options = options;

      // 事件
      // this.onFirstNewElementFinished = undefined; // 当获取第一个列表元素完成的函数
      this.onNewElementFinished = undefined; // 获取列表元素完成的函数
      this.onNoNewElementToLoad = undefined; // 当没有元素可以获取到的时候触发
      this.onError = undefined;
      this.onCurrentElementChanged = null;  // 当前正在呈现的元素改变的事件

      // this.__container.on('scroll', this.__scrollEventBindThis);

      // 私有成员
      this.__currentElement = null; // 当前元素
      this.__lastCheckScrollY = null; // 上次检查边界时滑动的位置
      this.__lastCurrentChangeCheckScrollY = null; // 上次检查当前元素改变时滑动的位置
      this.__isCheckingBoundary = false; // 是否正在检查边界
      this.__scrollEventBindThis = this.__scrollEvent.bind(this);

      // 常量
      this.DOWN_THRESHOLD = 3; // 向下加载长度的阈值
      this.UP_THRESHOLD = 1; // 向上加载长度的阈值
      this.CHECK_SCROLL_THRESHOLD = 0.9; // 当滑动多长的距离检查一次
      this.CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD = 0.1; // 当滑动多长的距离检查一次当前元素改动
      this.PREVIOUS = 1;
      this.NEXT = -1;
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
        return;
      }

      // 没有元素了
      co(this.__addElement(1))
        .then(newElement => {
          if(newElement){
            this.__checkCurrentElementChange(); // 强制刷新
            this.__container.scrollTop = newElement.offsetTop;
          }
        });
    }

    // 滑动到上一个元素
    previousElement(){
      // 如果当前位置不是本章首位就滚动到本章首位
      let st = this.getPageScorllTop();
      if(st > 0){
        this.__container.scrollTop = this.__currentElement.offsetTop;
        return;
      }

      let i = this.__getCurrentElementIndex();
      if(--i >= 0){
        const ics = this.__elementList.children;
        this.__container.scrollTop = ics[i].offsetTop;
        return;
      }

      // 没有元素了
      co(this.__addElement(-1))
        .then(newElement => {
          if(newElement){
            this.__checkCurrentElementChange(); // 强制刷新
            this.__container.scrollTop = newElement.offsetTop;
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
      Array.from(this.__elementList.children).forEach(e => e.remove());

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

    // 容器的滚动事件
    __scrollEvent(event){
      const scrollY = this.__container.scrollTop;

      if(this.__lastCurrentChangeCheckScrollY == null)
        this.__checkCurrentElementChange();
      else {
        const wh = this.__container.offsetHeight;
        if(Math.abs(scrollY - this.__lastCurrentChangeCheckScrollY) > wh * this.CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD) {
          this.__checkCurrentElementChange();
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
    __checkCurrentElementChange(){
      this.__lastCurrentChangeCheckScrollY = this.__container.scrollTop;
      if(!this.__currentElement) return;

      const cis = this.computeCurrentElements();
      const i = cis.findIndex(e => e == this.__currentElement);
      if(i < 0)
        this.setCurrentElement(cis[0]);
    }


    // 设置当前元素
    setCurrentElement(newCurrentElement){
      const oldValue = this.__currentElement;
      if(newCurrentElement == oldValue)
        return;

      this.__currentElement = newCurrentElement;
      if(this.onCurrentElementChanged)
        this.onCurrentElementChanged(this, newCurrentElement, oldValue);
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
    computeCurrentElements(){
      const wh = this.__container.offsetHeight;
      const elements = this.__elementList.children;
      const result = [];
      for(let element of Array.from(elements)){
        const top = element.getBoundingClientRect().top;
        const height = element.offsetHeight;
        if(top + height <= 0.1 * wh)
          continue;
        else if(top > 0.9 * wh)
          break;
        else
          result.push(element);
      }
      return result;
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
    clearOutBoundary(){
      const ies = this.__elementList.children;
      const cii = this.__getCurrentElementIndex();

      // 清理后面的元素
      for(let i = ies.length - 1; i >=0; i--){
        let element = ies[i];
        if(!this.__isOutBoundary(element, this.PREVIOUS) || i <= cii + 1)
          break;
        element.remove();
      }

      // 清理前面的元素
      for(let i = 0; i < ies.length; i++){
        let element = ies[i];
        if(!this.__isOutBoundary(element, this.NEXT) || i >= cii - 1)
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
      let isFirstElement = !this.__getBoundaryElement(direction);
      try{
        if(direction >= 0 && this.nextElementGenerator)
          result = yield this.nextElementGenerator.next();
        else if(direction < 0 && this.previousElementGenerator)
          result = yield this.previousElementGenerator.next();
        else
          return Promise.resolve(null);
      }
      catch(error){
        if(this.onError)
          this.onError(this, error);
        throw error;
      }

      let {value: newElement, done} = result;

      // 把元素添加到 DOM 上
      if(direction >= 0 && newElement)
        this.__elementList.append(newElement);
      else if(direction < 0 && newElement) {
        const cs = this.__container.scrollTop;
        this.__elementList.prepend(newElement);
        this.__container.scrollTop = cs + newElement.offsetHeight;
      }

      if(isFirstElement)
        this.setCurrentElement(newElement); // 设置当前元素为第一个元素

      if(done){
        // 没有获取到新元素
        // 标记最后一个元素为边界
        const be = this.__getBoundaryElement(direction);
        if(be) be.dataset['end'] = direction;
        if(this.onNoNewElementToLoad) this.onNoNewElementToLoad(this, be);
      }

      // 将所有的图片的 onload 事件都设置好
      if(newElement){
        let imgs = newElement.querySelectorAll('img');
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

      // if(isFirstElement && this.onFirstNewElementFinished)
      //   this.onFirstNewElementFinished(this, newElement, direction);
      if(newElement && this.onNewElementFinished)
        this.onNewElementFinished(this, newElement, direction);

      return Promise.resolve(newElement);
    }

    // 检查指定方向的边界
    *__checkBoundary(direction, ifClear){

      // 如果不允许向上检查就退出
      if(!this.options.ifCheckPrevious && direction < 0)
        return Promise.resolve();

      while(!this.__isBoundarySatisfied(direction)){
        yield this.__addElement(direction);
        if(ifClear)
          this.clearOutBoundary();
      }

      return Promise.resolve();
    }
  }

  return Infinitelist;
});

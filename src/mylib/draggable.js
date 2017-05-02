;(function(factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory();
  else
    window["draggable"] = factory();
}(function() {
  "use strict"

  return {
     /**
    * Drag.js:拖动绝对定位的HTML元素
    *
    * 这个模块定义了一个drag()函数，它用干mousedown亊件处理程序的调用
    * 随后的mousemove事件将移动指定元素， mouseup事件将终止拖动
    * 它需要用到本书其他地方介绍的getScrollOffsets()方法
    *
    * 参数：
    *
    * elementToDrag: 接收mousedown事件的元素或某些包含元素
    * 它必须是绝对定位的元素
    * 它的 style.left 和 style.top 值将随着用户的拖动而改变
    *
    * event: mousedown 事件对象
    **/
    drag(elementToDrag, event) {
      switch(event.type){
        case "mousedown":
          // 初始鼠标位置，转换为文档坐标
          var touchX = event.clientX, touchY = event.clientY;
          break;
        case "touchstart":
          // 如果不是单指触摸则退出
          if (event.targetTouches.length != 1)
            return;
          var target = event.targetTouches[0];
          // 把元素放在手指所在的位置
          var touchX = target.pageX, touchY = target.pageY;
          break;
      }

      // 转换为文档坐标
      var startX = touchX + window.pageXOffset;
      var startY = touchY + window.pageYOffset;
      // 在文档坐标下，待拖动元素的初始位置
      // 因为elementToDrag是绝对定位的，
      // 所以我们可以假设它的offsetParent就是文档的body元素
      var origX = elementToDrag.offsetLeft;
      var origY = elementToDrag.offsetTop;
      // 计算mousedown事件和元素左上角之间的距离
      // 我们将它另存为鼠标移动的距离
      var deltaX = startX - origX;
      var deltaY = startY - origY;

      // 注册用于响应接着mousedown事件发生的mousemove和mouseup事件的事件处理程序
      // 在document对象上注册捕获事件处理程序
      switch(event.type){
        case "mousedown":
          document.addEventListener("mousemove", mousemoveHandler, true);
          document.addEventListener("mouseup", upHandler, true);
          break;

        case "touchstart":
          document.addEventListener("touchmove", touchmoveHandler, true);
          document.addEventListener("touchend", upHandler, true);
          break;
      }


      // 我们处理了这个事件，不让任何其他元素看到它
      event.stopPropagation();
      // 现在阻止任何默认操作
      event.preventDefault();

      /**
       * 当元素正在被拖动时，这就是捕获mousemove事件的处理程序
       * 它用于移动这个元素
       **/
      function mousemoveHandler(e) {
        // 移动这个元素到当前鼠标位置，
        // 通过滚动条的位置和初始单击的偏移量来调整
        elementToDrag.style.left = (e.clientX + window.pageXOffset - deltaX) + "px";
        elementToDrag.style.top = (e.clientY + window.pageYOffset - deltaY) + "px";
        // 同时不让任何其他元素看到这个事件
        e.stopPropagation();
      }

      /**
       * 当元素正在被拖动时，这就是捕获touchmove事件的处理程序
       * 它用于移动这个元素
       **/
      function touchmoveHandler(e) {
        if (e.targetTouches.length != 1)
          return;
        var touch = e.targetTouches[0];
        // 把元素放在手指所在的位置
        elementToDrag.style.left = (touch.pageX + window.pageXOffset - deltaX) + "px";
        elementToDrag.style.top = (touch.pageY + window.pageYOffset - deltaY) + "px";
        // 同时不让任何其他元素看到这个事件
        e.stopPropagation();
      }

      /**
      * 这是捕获在拖动结束时发生的最终mouseup事件的处理程序
      **/
      function upHandler(e) {
        // 注销捕获事件处理程序
        switch(event.type){
          case "mousedown":
            document.removeEventListener("mousemove", mousemoveHandler, true);
            document.removeEventListener("mouseup", upHandler, true);
            break;

          case "touchstart":
            document.removeEventListener("touchmove", touchmoveHandler, true);
            document.removeEventListener("touchend", upHandler, true);
            break;
        }
        e.stopPropagation();
      }
    }
  };
}));

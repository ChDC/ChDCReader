"use strict";

define(function (require) {
  "use strict";

  return {
    drag: function drag(elementToDrag, event) {
      switch (event.type) {
        case "mousedown":
          var touchX = event.clientX,
              touchY = event.clientY;
          break;
        case "touchstart":
          if (event.targetTouches.length != 1) return;
          var target = event.targetTouches[0];

          var touchX = target.pageX,
              touchY = target.pageY;
          break;
      }

      var startX = touchX + window.pageXOffset;
      var startY = touchY + window.pageYOffset;

      var origX = elementToDrag.offsetLeft;
      var origY = elementToDrag.offsetTop;

      var deltaX = startX - origX;
      var deltaY = startY - origY;

      switch (event.type) {
        case "mousedown":
          document.addEventListener("mousemove", mousemoveHandler, true);
          document.addEventListener("mouseup", upHandler, true);
          break;

        case "touchstart":
          document.addEventListener("touchmove", touchmoveHandler, true);
          document.addEventListener("touchend", upHandler, true);
          break;
      }

      event.stopPropagation();

      event.preventDefault();

      function mousemoveHandler(e) {
        elementToDrag.style.left = e.clientX + window.pageXOffset - deltaX + "px";
        elementToDrag.style.top = e.clientY + window.pageYOffset - deltaY + "px";

        e.stopPropagation();
      }

      function touchmoveHandler(e) {
        if (e.targetTouches.length != 1) return;
        var touch = e.targetTouches[0];

        elementToDrag.style.left = touch.pageX + window.pageXOffset - deltaX + "px";
        elementToDrag.style.top = touch.pageY + window.pageYOffset - deltaY + "px";

        e.stopPropagation();
      }

      function upHandler(e) {
        switch (event.type) {
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
});
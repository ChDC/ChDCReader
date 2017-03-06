"use strict";

define(function (require) {
    "use strict";

    return {
        enable: function enable(draggableTarget, target) {
            var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                _ref$xenable = _ref.xenable,
                xenable = _ref$xenable === undefined ? true : _ref$xenable,
                _ref$yenable = _ref.yenable,
                yenable = _ref$yenable === undefined ? true : _ref$yenable,
                _ref$touchenable = _ref.touchenable,
                touchenable = _ref$touchenable === undefined ? true : _ref$touchenable;

            draggableTarget.onmousedown = function (e) {
                var diffX = e.clientX - target.offsetLeft;
                var diffY = e.clientY - target.offsetTop;
                var oldPosition = draggableTarget.style.position;
                draggableTarget.style.position = "relative";

                draggableTarget.onmousemove = function (e) {
                    var left = e.clientX - diffX;
                    var top = e.clientY - diffY;

                    if (left < 0) {
                        left = 0;
                    } else if (left > window.innerWidth - draggableTarget.offsetWidth) {
                        left = window.innerWidth - draggableTarget.offsetWidth;
                    }

                    if (top < 0) {
                        top = 0;
                    } else if (top > window.innerHeight - draggableTarget.offsetHeight) {
                        top = window.innerHeight - draggableTarget.offsetHeight;
                    }

                    draggableTarget.style.left = left + 'px';
                    draggableTarget.style.top = top + 'px';
                };

                document.onmouseup = function (e) {
                    draggableTarget.onmousemove = null;
                    draggableTarget.onmouseup = null;
                };
            };
        },
        remove: function remove() {}
    };
});
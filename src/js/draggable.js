define(function(require) {
    "use strict"

    return {

        // 给插件添加拖动
        // * draggableTarget 触发拖动事件的元素
        // * target 被拖动到元素
        enable(draggableTarget, target,
               {xenable=true, yenable=true, touchenable=true}={}){

            // 拖拽功能(主要是触发三个事件：onmousedown\onmousemove\onmouseup)
            //点击某物体时，用drag对象即可，move和up是全局区域，也就是整个文档通用，应该使用document对象而不是drag对象(否则，采用drag对象时物体只能往右方或下方移动)
            draggableTarget.onmousedown = function(e) {
                //鼠标点击物体那一刻相对于物体左侧边框的距离=点击时的位置相对于浏览器最左边的距离-物体左边框相对于浏览器最左边的距离
                const diffX = e.clientX - target.offsetLeft;
                const diffY = e.clientY - target.offsetTop;
                const oldPosition = draggableTarget.style.position;
                draggableTarget.style.position = "relative";

                draggableTarget.onmousemove = function(e) {
                    let left = e.clientX - diffX;
                    let top = e.clientY - diffY;

                    //控制拖拽物体的范围只能在浏览器视窗内，不允许出现滚动条
                    if(left < 0){
                        left = 0;
                    }
                    else if(left > window.innerWidth - draggableTarget.offsetWidth){
                        left = window.innerWidth-draggableTarget.offsetWidth;
                    }

                    if(top<0){
                        top=0;
                    }
                    else if(top > window.innerHeight - draggableTarget.offsetHeight){
                        top = window.innerHeight-draggableTarget.offsetHeight;
                    }

                    //移动时重新得到物体的距离，解决拖动时出现晃动的现象
                    draggableTarget.style.left = left+ 'px';
                    draggableTarget.style.top = top + 'px';
                };

                document.onmouseup = function(e) {
                    draggableTarget.onmousemove = null;
                    draggableTarget.onmouseup = null;
                };
            };
        },

        // 移除拖动
        remove(){

        }
    }
});

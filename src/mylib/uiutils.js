;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["uiutils"] = factory.apply(undefined, deps.map(e => window[e]));
}(["jquery"], function($){
  "use strict"

  return {

    /**
     * 显示消息 Toast
     * @param  {[type]} msg   [description]
     * @param  {Number} delay 指定消失的延迟时间
     * @param  {[type]} level 消息等级，支持 error、info、debug
     * @return {[type]}       [description]
     */
    showMessage(msg, delay=1000, level=null){
      if(!msg) return;

      // const msgBoxContainer = document.createElment("div");
      const msgBoxContainer = $('<div class="message-box-container"></div>')
      // msgBoxContainer.classList.add("message-box-container");

      // const msgBox = document.createElment("div");
      const msgBox = $('<div class="message-box"></div>');
      // msgBox.classList.add("message-box");

      switch(level){
        case "error":
          msgBox.css("color", "red");
          // msgBox.style.color = "red";
          break;
        case "info":
          break;
        case "debug":
          break;
        default:
          break;
      }
      msgBox.html(msg);
      msgBoxContainer.append(msgBox);
      $(document.body).append(msgBoxContainer);
      msgBoxContainer.fadeIn().delay(delay).fadeOut("", () => msgBoxContainer.remove());
    },

    /**
     * 显示错误 Toast
     * @param  {[type]} msg   [description]
     * @param  {[type]} delay [description]
     * @return {[type]}       [description]
     */
    showError(msg, delay){
      if(msg)
        this.showMessage(msg, delay, 'error');
    },

    /**
     * 弹出消息对话框
     * @param  {[type]} title              [description]
     * @param  {[type]} msg                [description]
     * @param  {Function} okEvent            [description]
     * @param  {Function} cancelEvent        取消事件处理器。如果没有 okEvent 和 cancelEvent，则不显示取消按钮
     * @param  {String} options.oktext     [description]
     * @param  {String} options.canceltext [description]
     * @param  {String} options.position   显示的位置，支持 middle 和 top
     * @return {[type]}                    [description]
     */
    showMessageDialog(title, msg, okEvent, cancelEvent,
                      {oktext="确定", canceltext="取消", position="middle"}={}){
      const dialog = $(
        `<div class="modal fade" id="modalMessage">
          <div class="modal-dialog" ${position == "middle" ? 'style="position: absolute; top: 40%; width: 80%; margin: 0 10%;"': ""}>
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title">
                </h4>
              </div>
              <div class="modal-body">
                <div class="modal-message"></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-default btnCancel" data-dismiss="modal">
                  ${canceltext}
                </button>
                <button type="button" class="btn btn-primary btnOK" data-dismiss="modal">
                  ${oktext}
                </button>
              </div>
            </div>
          </div>
        </div>`);

      $(document.body).append(dialog);

      dialog.on('hidden.bs.modal', () => {
        // 销毁自己
        dialog.remove();
      });
      dialog.find('.modal-title').text(title);
      dialog.find('.modal-message').html(msg);
      dialog.find('.btnOK').click(okEvent);
      if(!okEvent && !cancelEvent)
        dialog.find('.btnCancel').remove();
      else
        dialog.find('.btnCancel').click(cancelEvent);
      dialog.modal('show');
    },


    /**
     * 加载进度条
     * @param {String} img       [description]
     * @param {String} container [description]
     */
    LoadingBar: function(img='img/loadingm.gif', container='body'){
      this.__loadingbar = null;
      this.__img = img;
      this.container = container;

      /**
       * 显示加载进度条
       * @return {[type]} [description]
       */
      this.show = () => {
        const loadingBg = $('<div style="z-index:1000000;position:fixed;width:100%;height:100%;text-align:center;background-color:#808080;opacity:0.5;top:0;"></div>');
        const img = $('<img src="' + this.__img + '" style="position:relative;opacity:1;"/>');
        loadingBg.append(img);

        loadingBg.click((event) => {
          this.hide();
        });
        this.__loadingbar = loadingBg;
        $(this.container).append(loadingBg);
        img.css('top', ($(window).height() - img.height()) / 2);
      };

      /**
       * 隐藏加载进度条
       * @return {[type]} [description]
       */
      this.hide = () => {
        if(this.__loadingbar) this.__loadingbar.remove();
      };
    },

    /**
     * 给指定对象绑定长按事件
     * @param  {HTMLElement} obj     [description]
     * @param  {[type]} handler [description]
     * @return {[type]}         [description]
     */
    onLongPress(obj, handler){
      $(obj)
        .on("touchstart", e => { // 此处不能注册 mousedown 事件，会有弹不出菜单的 BUG
          if(e.touches.length != 1) return;
          e.stopImmediatePropagation();
          // e.stopPropagation();
          $(e.target)
            .data("longpress-timestart", new Date().getTime())
            .data("longpress-x", e.touches[0].clientX)
            .data("longpress-y", e.touches[0].clientY);
          // return false;
        })
        .on("touchend", e => {

          e.stopImmediatePropagation();
          e.stopPropagation();

          if(e.changedTouches.length != 1) return;
          let target = $(e.target);
          let t1 = target.data("longpress-timestart");
          let x = target.data("longpress-x"), y = target.data("longpress-y");
          let touch = e.changedTouches[0];
          if(Math.abs(touch.clientX - x) < 50 && Math.abs(touch.clientY - y) < 50
            && t1 && new Date().getTime() - t1 > 100){
            // long press
            handler(e);
            return false;
          }

        });
      return obj;
    }

  };
}));

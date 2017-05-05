;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["uiutils"] = factory();
}(["jquery"], function($){
  "use strict"

  return {

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
    showError(msg, delay){
      if(msg)
        this.showMessage(msg, delay, 'error');
    },

    showMessageDialog(title, msg, okEvent, cancelEvent,
                      {oktext="确定", canceltext="取消"}={}){
      const dialog = $(
        `<div class="modal fade" id="modalMessage">
          <div class="modal-dialog">
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


    // 加载进度条
    LoadingBar: function(img='img/loadingm.gif', container='body'){
      this.__loadingbar = null;
      this.__img = img;
      this.container = container;

      // 显示加载进度条
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

      // 隐藏加载进度条
      this.hide = () => {
        if(this.__loadingbar) this.__loadingbar.remove();
      };
    },


    // 点击重新加载图片的事件
    imgonerror(e){
      let img = e.currentTarget;

      img.alt = "加载失败，点击重新加载";
      img.classList.add("img-errorloaded");

      function imgClick(e){
        e.stopPropagation();
        let img = e.currentTarget;
        img.src = `${img.src.replace(/\?[^\/]*$/i, '')}?${new Date().getTime()}`;
        img.onload = (e) => {
          img.onclick = null;
          img.classList.remove("img-errorloaded");
          img.alt = "";
        };
        return false;
      }
      img.onclick = imgClick;
    }
  };
}));

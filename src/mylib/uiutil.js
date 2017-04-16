define(["jquery"], function($){
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
      msgBox.text(msg);
      msgBoxContainer.append(msgBox);
      $(document.body).append(msgBoxContainer);
      msgBoxContainer.fadeIn().delay(delay).fadeOut("", () => msgBoxContainer.remove());
    },
    showError(msg, delay){
      if(msg)
        this.showMessage(msg, delay, 'error');
    },

    showMessageDialog(title, msg, ok, cancel){
      const dialog = $(
  '<div class="modal fade" id="modalMessage">'
+ '    <div class="modal-dialog">'
+ '      <div class="modal-content">'
+ '        <div class="modal-header">'
+ '          <h4 class="modal-title">'
+ '          </h4>'
+ '        </div>'
+ '        <div class="modal-body">'
+ '          <p class="modal-message"></p>'
+ '        </div>'
+ '        <div class="modal-footer">'
+ '          <button type="button" class="btn btn-default" btnCancel data-dismiss="modal">'
+ '            取消'
+ '          </button>'
+ '          <button type="button" class="btn btn-primary btnOK" data-dismiss="modal">'
+ '          确定'
+ '          </button>'
+ '        </div>'
+ '      </div>'
+ '    </div>'
+ '  </div>');
      debugger;
      // TODO 失效后销毁
      // dialog.remove();
      $(document.body).append(dialog);
      dialog.find('.btnOk').click(ok);
      dialog.find('.btnCancel').click(cancel);
      dialog.find('.modal-title').text(title);
      dialog.find('.modal-message').text(msg);
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
        this.__loadingbar.remove();
      };
    },
  };


});

"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["uiutils"] = factory();
})(["jquery"], function ($) {
  "use strict";

  return {
    showMessage: function showMessage(msg) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
      var level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      if (!msg) return;

      var msgBoxContainer = $('<div class="message-box-container"></div>');

      var msgBox = $('<div class="message-box"></div>');


      switch (level) {
        case "error":
          msgBox.css("color", "red");

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
      msgBoxContainer.fadeIn().delay(delay).fadeOut("", function () {
        return msgBoxContainer.remove();
      });
    },
    showError: function showError(msg, delay) {
      if (msg) this.showMessage(msg, delay, 'error');
    },
    showMessageDialog: function showMessageDialog(title, msg, okEvent, cancelEvent) {
      var _ref = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {},
          _ref$oktext = _ref.oktext,
          oktext = _ref$oktext === undefined ? "确定" : _ref$oktext,
          _ref$canceltext = _ref.canceltext,
          canceltext = _ref$canceltext === undefined ? "取消" : _ref$canceltext;

      var dialog = $("<div class=\"modal fade\" id=\"modalMessage\">\n          <div class=\"modal-dialog\">\n            <div class=\"modal-content\">\n              <div class=\"modal-header\">\n                <h4 class=\"modal-title\">\n                </h4>\n              </div>\n              <div class=\"modal-body\">\n                <p class=\"modal-message\"></p>\n              </div>\n              <div class=\"modal-footer\">\n                <button type=\"button\" class=\"btn btn-default btnCancel\" data-dismiss=\"modal\">\n                  " + canceltext + "\n                </button>\n                <button type=\"button\" class=\"btn btn-primary btnOK\" data-dismiss=\"modal\">\n                  " + oktext + "\n                </button>\n              </div>\n            </div>\n          </div>\n        </div>");

      $(document.body).append(dialog);

      dialog.on('hidden.bs.modal', function () {
        dialog.remove();
      });
      dialog.find('.modal-title').text(title);
      dialog.find('.modal-message').text(msg);
      dialog.find('.btnOK').click(okEvent);
      dialog.find('.btnCancel').click(cancelEvent);
      dialog.modal('show');
    },

    LoadingBar: function LoadingBar() {
      var _this = this;

      var img = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'img/loadingm.gif';
      var container = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'body';

      this.__loadingbar = null;
      this.__img = img;
      this.container = container;

      this.show = function () {
        var loadingBg = $('<div style="z-index:1000000;position:fixed;width:100%;height:100%;text-align:center;background-color:#808080;opacity:0.5;top:0;"></div>');
        var img = $('<img src="' + _this.__img + '" style="position:relative;opacity:1;"/>');
        loadingBg.append(img);

        loadingBg.click(function (event) {
          _this.hide();
        });
        _this.__loadingbar = loadingBg;
        $(_this.container).append(loadingBg);
        img.css('top', ($(window).height() - img.height()) / 2);
      };

      this.hide = function () {
        _this.__loadingbar.remove();
      };
    },

    imgonerror: function imgonerror(e) {
      var img = e.currentTarget;

      img.alt = "加载失败，点击重新加载";
      img.classList.add("img-errorloaded");

      function imgClick(e) {
        e.stopPropagation();
        var img = e.currentTarget;
        img.src = img.src.replace(/\?[^\/]*$/i, '') + "?" + new Date().getTime();
        img.onload = function (e) {
          img.onclick = null;
          img.classList.remove("img-errorloaded");
          img.alt = "";
        };
        return false;
      }
      img.onclick = imgClick;
    }
  };
});
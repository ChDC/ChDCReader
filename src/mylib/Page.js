define(function(){
  class Page{

    constructor(){
      this.__events = {};

      this.__onDevicePauseHandler = (e) => {
        this.fireEvent("devicePause", e);
      };
      this.__onDeviceResumeHandler = (e) => {
        this.fireEvent("deviceResume", e);
      };
    }

    addEventListener(eventName, handler){
      if(!eventName || !handler) return;
      if(!(eventName in this.__events))
        this.__events[eventName] = [];
      this.__events[eventName].push(handler);
    }

    fireEvent(eventName, e={}){
      if(!eventName) return;
      e.currentTarget = this;
      e.target = this;

      // __onEvent
      let __onevent = `__on${eventName[0].toUpperCase()}${eventName.substring(1)}`;
      if(__onevent in this)
        this[__onevent](e);

      // addEventListener
      if(eventName in this.__events){
        this.__events[eventName].forEach(eh => {
          try{ eh(e) } catch(error){ }
        });
      }

      // onEvent
      let onevent = `on${eventName[0].toUpperCase()}${eventName.substring(1)}`;
      if(onevent in this)
        this[onevent](e);
    }

    removeEventListener(eventName, handler){
      if(!eventName || !handler) return;
      if(eventName in this.__events){
        let i = this.__events[eventName].findIndex(m => m == handler);
        if(i >= 0)
          this.__events[eventName].splice(i, 1);
      }
    }

    // 关闭当前页
    close(params){
      return this.pageManager.closePage(params);
    }

    showPage(name, params, options={}){
      return this.pageManager.showPage(name, params, options);
    }

    // __onLoad(params){
      // console.error(this.name, "load");
    // }

    __onResume(){
      // add Device pause
      document.addEventListener("pause", this.__onDevicePauseHandler, false);
      document.addEventListener("resume", this.__onDeviceResumeHandler, false);
    }

    __onPause(){
      // console.error(this.name, "pause");
      document.removeEventListener("pause", this.__onDevicePauseHandler, false);
      document.removeEventListener("resume", this.__onDeviceResumeHandler, false);
    }

    // __onClose(params){
      // console.error(this.name, "close");
    // }


    onDevicePause(){
      console.error(this.name, "DevicePause");
    }

    onDeviceResume(){
      console.error(this.name, "DeviceResume");
    }
    /*
    onLoad(params){

    }

    onResume(){

    }

    onPause(){

    }

    onClose(params){

    }

    onDevicePause(){

    }

    onDeviceResume(){

    }
    */
  }

  Page.prototype.pageManager = null;
  Page.prototype.name = null;


  return Page;
});

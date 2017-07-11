;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["Page"] = factory.apply(undefined, deps.map(e => window[e]));
}(['utils'], function(utils){
  class Page{

    constructor(){
      // this.__events = {};
      utils.addEventSupport(this);

      this.__onDevicePauseHandler = (e) => {
        this.fireEvent("devicePause", e);
        this.fireEvent("pause", e);
      };
      this.__onDeviceResumeHandler = (e) => {
        this.fireEvent("deviceResume", e);
        this.fireEvent("resume", e);
      };

    }

    /**
     * Close Page
     * @param  {[type]} params [description]
     * @return {[type]}        [description]
     */
    close(params){
      return this.pageManager.closePage(params);
    }

    /**
     * show page
     * @param  {[type]} name    [description]
     * @param  {[type]} params  [description]
     * @param  {Object} options [description]
     * @return {[type]}         [description]
     */
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
      // document.addEventListener("backbutton", this.__onBackButtonHandler, false);
    }

    __onPause(){
      // console.error(this.name, "pause");
      document.removeEventListener("pause", this.__onDevicePauseHandler, false);
      document.removeEventListener("resume", this.__onDeviceResumeHandler, false);
      // document.removeEventListener("backbutton", this.__onBackButtonHandler, false);
    }

    // __onClose(params){
      // console.error(this.name, "close");
    // }


    // onDevicePause(){
      // console.error(this.name, "DevicePause");
    // }

    // onDeviceResume(){
      // console.error(this.name, "DeviceResume");
    // }
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
}));

define(["util"], function(util){
    class Page{

        // 关闭当前页
        close(params){
            return this.pageManager.closePage(params);
        }

        showPage(name, params, options={}){
            return this.pageManager.showPage(name, params, options);
        }

        __onLoad(params){
            console.error(this.name, "load");
        }

        __onResume(){
            console.error(this.name, "resume");

            // add Device pause
            if(this.onDevicePause){
                this.__onDevicePause = this.onDevicePause.bind(this);
                document.addEventListener("pause", this.__onDevicePause, false);
            }

            if(this.onDeviceResume){
                this.__onDeviceResume = this.onDeviceResume.bind(this);
                document.addEventListener("resume", this.__onDeviceResume, false);
            }
        }

        __onPause(){
            console.error(this.name, "pause");

            if(this.__onDevicePause)
                document.removeEventListener("pause", this.__onDevicePause, false);

            if(this.__onDeviceResume)
                document.removeEventListener("resume", this.__onDeviceResume, false);
        }

        __onClose(params){
            console.error(this.name, "close");
        }



        /*
        onDevicePause(){
            console.error(this.name, "DevicePause");
        }

        onDeviceResume(){
            console.error(this.name, "DeviceResume");
        }

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

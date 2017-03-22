define(["util"], function(util){
    class Page{

        onload(params){

        }

        onresume(){

        }

        onpause(){

        }

        onclose(params){

        }

        // 关闭当前页
        close(params){
            return this.pageManager.closePage(params);
        }

        showPage(name, params, options={}){
            return this.pageManager.showPage(name, params, options);
        }
    }

    Page.prototype.pageManager = null;

    return Page;
});

;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["fileSystem"] = factory.apply(undefined, deps.map(e => window[e]));
}(["co"], function(co){
  "use strict";

  return {

    /**
     * 获取文件系统对象
     * @param  {Boolean} isCacheDir 指定是否是缓存目录
     * @return {[type]}             [description]
     */
    getFileSystem(isCacheDir=false){
      const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
      return new Promise((resolve, reject) => window.requestFileSystem(fileSystem, 0, resolve, reject));
    },

    /**
     * 获取文件系统根目录
     * @param  {Boolean} isCacheDir [description]
     * @return {[type]}             [description]
     */
    getFileSystemRootDirectory(isCacheDir=false){
      const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
      return new Promise((resolve, reject) => window.requestFileSystem(fileSystem, 0, fs => resolve(fs.root), reject));
    },

    /**
     * 获取文件对象
     * @param  {[type]} dirEntry [description]
     * @param  {[type]} file     [description]
     * @param  {Object} options  [description]
     * @return {[type]}          [description]
     */
    getFileEntry(dirEntry, file, options={}){
      file = this.convertFileName(file);
      return new Promise((resolve, reject) => dirEntry.getFile(file, options, resolve, reject));
    },

    /**
     * 删除目录
     * @param  {[type]}  dirEntry    [description]
     * @param  {Boolean} recursively 是否递归删除目录
     * @return {[type]}              [description]
     */
    removeDirectory(dirEntry, recursively=true){
      if(recursively)
        return new Promise((resolve, reject) => dirEntry.removeRecursively(resolve, reject));
      else
        return new Promise((resolve, reject) => dirEntry.remove(resolve, reject));
    },

    /**
     * 将内容数据写入到文件中
     * @param  {[type]} fileEntry [description]
     * @param  {[type]} data      [description]
     * @return {[type]}           [description]
     */
    writeFile(fileEntry, data) {
      return new Promise((resolve, reject) =>
        fileEntry.createWriter(fileWriter => {
          //文件写入成功
          fileWriter.onwriteend = resolve;
          //文件写入失败
          fileWriter.onerror = reject;
          //写入文件
          fileWriter.write(data);
        })
      );
    },

    /**
     * 从文件中读取数据
     * @param  {[type]} fileEntry [description]
     * @return {[type]}           [description]
     */
    readFile(fileEntry){
      return new Promise((resolve, reject) =>
        fileEntry.file(file => {
          const reader = new FileReader();
          reader.onloadend = function(){
            resolve(this.result);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        }, reject)
      );
    },

    /**
     * 删除文件
     * @param  {[type]} fileEntry [description]
     * @return {[type]}           [description]
     */
    removeFile(fileEntry){
      return new Promise((resolve, reject) => fileEntry.remove(resolve, reject));
    },

    /**
     * 获取目录对象
     * @param  {[type]} dirEntry [description]
     * @param  {[type]} dirName  [description]
     * @param  {[type]} options  [description]
     * @return {[type]}          [description]
     */
    getDirectory(dirEntry, dirName, options){
      dirName = this.convertFileName(dirName);
      return new Promise((resolve, reject) => dirEntry.getDirectory(dirName, options, resolve, reject));
    },

    /**
     * 当前目录
     * @type {String}
     */
    currentPath: "/",

    /**
     * 修改当前工作目录
     * @param  {[type]} path [description]
     * @return {[type]}      [description]
     */
    changeCurrentPath(path){
      if(!path) return path;

      if(path[path.length-1] != "/")
        path += "/";

      this.currentPath = path;
    },

    /**
     * 从路径中获取文件对象或者目录对象
     * 末尾不加 / 的视为是文件，加 / 的视为目录
     * @param  {[type]}  path       [description]
     * @param  {Boolean} isCacheDir 是否从缓存目录中操作
     * @param  {Object}  options    [description]
     * @return {[type]}             [description]
     */
    getFileEntryFromPath(path, isCacheDir=false, options={}){

      if(!path)
        path = this.currentPath;

      if(path == "/")
        return this.getFileSystemRootDirectory(isCacheDir);

      if(path[0] != "/")
        path = this.currentPath + path;

      while(path.includes("../"))
        path = path.replace(/([^\/]+\/)?\.\.\//i, ""); // 清除 dd/../ 或 ../
      path = path.replace("./", ""); // 清除 ./

      if(path[path.length-1] != "/" && !options.create) // 如果不是创建文件则直接获取，不一级目录一级目录的创建
        return this.getFileSystemRootDirectory(isCacheDir)
          .then(dirEntry => this.getFileEntry(dirEntry, path, options));

      let dirs = path.match(/[^\/]+\/?/gi);
      if(!dirs)
        return this.getFileSystemRootDirectory(isCacheDir);

      let self = this;
      return co(function*(){
        let dirEntry = yield self.getFileSystemRootDirectory(isCacheDir);
        while(dirs.length > 0){
          let dir = dirs.shift();
          if(dir[dir.length - 1] == "/")
            dirEntry = yield self.getDirectory(dirEntry, dir.substring(0, dir.length-1), options);
          else{
            dirEntry = yield self.getFileEntry(dirEntry, dir, options);
            break;
          }
        }
        return dirEntry;
      });
    },

    /**
     * 确保文件名正确
     * @param  {[type]} file [description]
     * @return {[type]}      [description]
     */
    convertFileName(file){
      return file.replace(/[\\:*?"<>|]/g, "");
    },

    /**
     * 保存文本数据到文件中
     * @param  {[type]}  file       [description]
     * @param  {[type]}  data       [description]
     * @param  {Boolean} isCacheDir [description]
     * @return {[type]}             [description]
     */
    saveTextToFile(file, data, isCacheDir=false){
      return this.getFileEntryFromPath(file, isCacheDir, {create: true, exclusive: false})
        .then(fe => {
          const dataObj = new Blob([data], { type: 'text/plain' });
          return this.writeFile(fe, dataObj);
        });
    },

    /**
     * 从文件中获取文本数据
     * @param  {[type]}  file       [description]
     * @param  {Boolean} isCacheDir [description]
     * @return {[type]}             [description]
     */
    loadTextFromFile(file, isCacheDir=false){
      return this.getFileEntryFromPath(file, isCacheDir, {create: false, exclusive: false})
        .then(fe => this.readFile(fe))
        .catch(error => null); // 忽略读写错误，如果错误则返回 null
    },

    /**
     * 检查文件是否存在
     * @param  {[type]}  file       [description]
     * @param  {Boolean} isCacheDir [description]
     * @return {[type]}             [description]
     */
    fileExists(file, isCacheDir=false){
      return this.getFileEntryFromPath(file, isCacheDir, {create: false, exclusive: false})
        .then(fe => fe.isFile)
        .catch(error => false);
    },

    /**
     * 删除文件或目录
     * @param  {[type]}  file        [description]
     * @param  {Boolean} isCacheDir  [description]
     * @param  {Boolean} recursively [description]
     * @return {[type]}              [description]
     */
    removePath(file, isCacheDir=false, recursively=true){
      return this.getFileEntryFromPath(file, isCacheDir, {create: false, exclusive: false})
        .then(fe => {
          if(fe.isFile)
            this.removeFile(fe);
          else
            this.removeDirectory(fe, recursively);
        });
    },

  };

}));

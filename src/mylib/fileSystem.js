;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["fileSystem"] = factory();
}(["co"], function(co){
  "use strict"

  return {

    // 获取文件系统对象
    getFileSystem(isCacheDir=false){
      const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
      return new Promise((resolve, reject) => window.requestFileSystem(fileSystem, 0, resolve, reject));
    },

    getFileSystemRootDirectory(isCacheDir=false){
      const fileSystem = !isCacheDir? LocalFileSystem.PERSISTENT: window.TEMPORARY;
      return new Promise((resolve, reject) => window.requestFileSystem(fileSystem, 0, fs => resolve(fs.root), reject));
    },

    // 获取文件对象
    getFileEntry(dirEntry, file, options={}){
      file = this.convertFileName(file);
      return new Promise((resolve, reject) => dirEntry.getFile(file, options, resolve, reject));
    },

    // 删除目录
    removeDirectory(dirEntry, recursively=true){
      debugger;
      if(recursively)
        return new Promise((resolve, reject) => dirEntry.removeRecursively(resolve, reject));
      else
        return new Promise((resolve, reject) => dirEntry.remove(resolve, reject));
    },

    // 将内容数据写入到文件中
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

    // 从文件中读取数据
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

    // 删除文件
    removeFile(fileEntry){
      return new Promise((resolve, reject) => fileEntry.remove(resolve, reject));
    },

    // 获取目录对象
    getDirectory(dirEntry, dirName, options){
      dirName = this.convertFileName(dirName);
      return new Promise((resolve, reject) => dirEntry.getDirectory(dirName, options, resolve, reject));
    },

    // 当前工作目录
    currentPath: "/",

    // 修改当前工作目录
    changeCurrentPath(path){
      if(!path) return path;

      if(path[path.length-1] != "/")
        path += "/";

      this.currentPath = path;
    },

    // 从路径中获取文件对象或者目录对象
    // 末尾不加 / 的视为是文件，加 / 的视为目录
    getFileEntryFromPath(path, isCacheDir=false, options={}){
      if(!path)
        path = this.currentPath;

      if(path == "/")
        return this.getFileSystemRootDirectory(isCacheDir);

      if(path[0] != "/")
        path = this.currentPath + path;

      while(path.indexOf("../") >= 0)
        path = path.replace(/([^\/]+\/)?\.\.\//i, ""); // 清除 dd/../ 或 ../
      path = path.replace("./", ""); // 清除 ./

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

    // 确保文件名正确
    convertFileName(file){
      return file.replace(/[\\:*?"<>|]/g, "");
    },

    // 保存文本到文件中
    saveTextToFile(file, data, isCacheDir=false){
      return this.getFileEntryFromPath(file, isCacheDir, {create: true, exclusive: false})
        .then(fe => {
          const dataObj = new Blob([data], { type: 'text/plain' });
          return this.writeFile(fe, dataObj);
        });
    },

    // 从文件中获取文本
    loadTextFromFile(file, isCacheDir=false){
      return this.getFileEntryFromPath(file, isCacheDir, {create: false, exclusive: false})
        .then(fe => this.readFile(fe))
        .catch(error => null); // 忽略读写错误，如果错误则返回 null
    },

    // 检查文件是否存在
    fileExists(file, isCacheDir=false){
      return this.getFileEntryFromPath(file, isCacheDir, {create: false, exclusive: false})
        .then(fe => fe.isFile)
        .catch(error => false);
    },

    // 删除文件或目录
    removePath(file, isCacheDir=false, recursively=true){
      return this.getFileEntryFromPath(file, isCacheDir, {create: false, exclusive: false})
        .then(fe => {
          debugger;
          if(fe.isFile)
            this.removeFile(fe);
          else
            this.removeDirectory(fe, recursively);
        });
    },

  }

}));

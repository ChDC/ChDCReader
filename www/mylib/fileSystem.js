"use strict";

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["fileSystem"] = factory();
})(["co"], function (co) {
  "use strict";

  return {
    getFileSystem: function getFileSystem() {
      var isCacheDir = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;
      return new Promise(function (resolve, reject) {
        return window.requestFileSystem(fileSystem, 0, resolve, reject);
      });
    },
    getFileSystemRootDirectory: function getFileSystemRootDirectory() {
      var isCacheDir = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var fileSystem = !isCacheDir ? LocalFileSystem.PERSISTENT : window.TEMPORARY;
      return new Promise(function (resolve, reject) {
        return window.requestFileSystem(fileSystem, 0, function (fs) {
          return resolve(fs.root);
        }, reject);
      });
    },
    getFileEntry: function getFileEntry(dirEntry, file) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      file = this.convertFileName(file);
      return new Promise(function (resolve, reject) {
        return dirEntry.getFile(file, options, resolve, reject);
      });
    },
    removeDirectory: function removeDirectory(dirEntry) {
      var recursively = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      debugger;
      if (recursively) return new Promise(function (resolve, reject) {
        return dirEntry.removeRecursively(resolve, reject);
      });else return new Promise(function (resolve, reject) {
        return dirEntry.remove(resolve, reject);
      });
    },
    writeFile: function writeFile(fileEntry, data) {
      return new Promise(function (resolve, reject) {
        return fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = resolve;

          fileWriter.onerror = reject;

          fileWriter.write(data);
        });
      });
    },
    readFile: function readFile(fileEntry) {
      return new Promise(function (resolve, reject) {
        return fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function () {
            resolve(this.result);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        }, reject);
      });
    },
    removeFile: function removeFile(fileEntry) {
      return new Promise(function (resolve, reject) {
        return fileEntry.remove(resolve, reject);
      });
    },
    getDirectory: function getDirectory(dirEntry, dirName, options) {
      dirName = this.convertFileName(dirName);
      return new Promise(function (resolve, reject) {
        return dirEntry.getDirectory(dirName, options, resolve, reject);
      });
    },

    currentPath: "/",

    changeCurrentPath: function changeCurrentPath(path) {
      if (!path) return path;

      if (path[path.length - 1] != "/") path += "/";

      this.currentPath = path;
    },
    getFileEntryFromPath: function getFileEntryFromPath(path) {
      var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (!path) path = this.currentPath;

      if (path == "/") return this.getFileSystemRootDirectory(isCacheDir);

      if (path[0] != "/") path = this.currentPath + path;

      while (path.indexOf("../") >= 0) {
        path = path.replace(/([^\/]+\/)?\.\.\//i, "");
      }
      path = path.replace("./", "");

      var dirs = path.match(/[^\/]+\/?/gi);
      if (!dirs) return this.getFileSystemRootDirectory(isCacheDir);

      var self = this;
      return co(regeneratorRuntime.mark(function _callee() {
        var dirEntry, dir;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return self.getFileSystemRootDirectory(isCacheDir);

              case 2:
                dirEntry = _context.sent;

              case 3:
                if (!(dirs.length > 0)) {
                  _context.next = 17;
                  break;
                }

                dir = dirs.shift();

                if (!(dir[dir.length - 1] == "/")) {
                  _context.next = 11;
                  break;
                }

                _context.next = 8;
                return self.getDirectory(dirEntry, dir.substring(0, dir.length - 1), options);

              case 8:
                dirEntry = _context.sent;
                _context.next = 15;
                break;

              case 11:
                _context.next = 13;
                return self.getFileEntry(dirEntry, dir, options);

              case 13:
                dirEntry = _context.sent;
                return _context.abrupt("break", 17);

              case 15:
                _context.next = 3;
                break;

              case 17:
                return _context.abrupt("return", dirEntry);

              case 18:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
    },
    convertFileName: function convertFileName(file) {
      return file.replace(/[\\:*?"<>|]/g, "");
    },
    saveTextToFile: function saveTextToFile(file, data) {
      var _this = this;

      var isCacheDir = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this.getFileEntryFromPath(file, isCacheDir, { create: true, exclusive: false }).then(function (fe) {
        var dataObj = new Blob([data], { type: 'text/plain' });
        return _this.writeFile(fe, dataObj);
      });
    },
    loadTextFromFile: function loadTextFromFile(file) {
      var _this2 = this;

      var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this.getFileEntryFromPath(file, isCacheDir, { create: false, exclusive: false }).then(function (fe) {
        return _this2.readFile(fe);
      }).catch(function (error) {
        return null;
      });
    },
    fileExists: function fileExists(file) {
      var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this.getFileEntryFromPath(file, isCacheDir, { create: false, exclusive: false }).then(function (fe) {
        return fe.isFile;
      }).catch(function (error) {
        return false;
      });
    },
    removePath: function removePath(file) {
      var _this3 = this;

      var isCacheDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var recursively = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      return this.getFileEntryFromPath(file, isCacheDir, { create: false, exclusive: false }).then(function (fe) {
        debugger;
        if (fe.isFile) _this3.removeFile(fe);else _this3.removeDirectory(fe, recursively);
      });
    }
  };
});
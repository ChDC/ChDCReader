"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["co"], function (co) {

  "use strict";

  var Infinitelist = function () {
    function Infinitelist(container, itemList, nextItemGenerator, previousItemGenerator) {
      var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      _classCallCheck(this, Infinitelist);

      this.__container = container;
      this.__itemList = itemList;
      this.previousItemGenerator = previousItemGenerator;
      this.nextItemGenerator = nextItemGenerator;
      this.options = options;

      this.onNewItemFinished = undefined;
      this.onNoNewItemToLoad = undefined;
      this.onError = undefined;
      this.onCurrentItemChanged = null;
      this.__currentItem = null;
      this.__lastCheckScrollY = null;
      this.__lastCurrentChangeCheckScrollY = null;
      this.__isCheckingBoundary = false;
      this.__scrollEventBindThis = this.__scrollEvent.bind(this);

      this.DOWN_THRESHOLD = 3;
      this.UP_THRESHOLD = 1;
      this.CHECK_SCROLL_THRESHOLD = 0.9;
      this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1;
      this.PREVIOUS = 1;
      this.NEXT = -1;
    }

    _createClass(Infinitelist, [{
      key: "getPageScorllTop",
      value: function getPageScorllTop() {
        return this.__currentItem ? this.__container.scrollTop - this.__currentItem.offsetTop : 0;
      }
    }, {
      key: "getScrollRate",
      value: function getScrollRate() {
        if (!this.__currentItem) return 0;
        var rate = (this.__container.scrollTop - this.__currentItem.offsetTop + this.__container.offsetHeight) / this.__currentItem.offsetHeight;
        return rate > 1 ? 1 : rate;
      }
    }, {
      key: "nextItem",
      value: function nextItem() {
        var _this = this;

        var i = this.__getCurrentItemIndex();
        var ics = this.__itemList.children;
        if (i >= 0 && ++i < ics.length) {
          this.__container.scrollTop = ics[i].offsetTop;
          return;
        }

        co(this.__addItem(1)).then(function (newItem) {
          if (newItem) {
            _this.__checkCurrentItemChange();
            _this.__container.scrollTop = newItem.offsetTop;
          }
        });
      }
    }, {
      key: "previousItem",
      value: function previousItem() {
        var _this2 = this;

        var st = this.getPageScorllTop();
        if (st > 0) {
          this.__container.scrollTop = this.__currentItem.offsetTop;
          return;
<<<<<<< HEAD
        }

        var i = this.__getCurrentItemIndex();
        if (--i >= 0) {
          var ics = this.__itemList.children;
          this.__container.scrollTop = ics[i].offsetTop;
          return;
        }

=======
        }

        var i = this.__getCurrentItemIndex();
        if (--i >= 0) {
          var ics = this.__itemList.children;
          this.__container.scrollTop = ics[i].offsetTop;
          return;
        }

>>>>>>> dev
        co(this.__addItem(-1)).then(function (newItem) {
          if (newItem) {
            _this2.__checkCurrentItemChange();
            _this2.__container.scrollTop = newItem.offsetTop;
          }
        });
      }
    }, {
      key: "loadList",
      value: function loadList() {
        return this.checkBoundary();
      }
    }, {
      key: "close",
      value: function close() {
        this.__container.removeEventListener('scroll', this.__scrollEventBindThis);
        Array.from(this.__itemList.children).forEach(function (e) {
          return e.remove();
        });

        for (var key in this) {
          delete this[key];
        }
<<<<<<< HEAD
      }
    }, {
      key: "getCurrentItem",
      value: function getCurrentItem() {
        return this.__currentItem;
<<<<<<< HEAD
      }
    }, {
      key: "computeCurrentItems",
      value: function computeCurrentItems() {
        var wh = $(window).height();
        var items = this.__itemList.children();
        var result = [];
        for (var i = 0; i < items.length; i++) {
          var item = items.eq(i);
          var top = item.offset().top;
          var height = item.outerHeight(true);
          if (top + height <= 0.1 * wh) {
            continue;
          } else if (top > 0.9 * wh) break;else {
            result.push(item);
          }
        };
        return result;
=======
>>>>>>> dev
=======
      }
    }, {
      key: "getCurrentItem",
      value: function getCurrentItem() {
        return this.__currentItem;
>>>>>>> dev
      }
    }, {
      key: "__getCurrentItemIndex",
      value: function __getCurrentItemIndex() {
        if (!this.__currentItem) return -1;
        var ics = this.__itemList.children;
        return Array.from(ics).indexOf(this.__currentItem);
      }
    }, {
      key: "__scrollEvent",
      value: function __scrollEvent(event) {
        var scrollY = this.__container.scrollTop;

        if (this.__lastCurrentChangeCheckScrollY == null) this.__checkCurrentItemChange();else {
          var wh = this.__container.offsetHeight;
          if (Math.abs(scrollY - this.__lastCurrentChangeCheckScrollY) > wh * this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD) {
            this.__checkCurrentItemChange();
          }
        }

        if (this.__lastCheckScrollY == null) this.checkBoundary();else {
          var _wh = this.__container.offsetHeight;
          if (Math.abs(scrollY - this.__lastCheckScrollY) > _wh * this.CHECK_SCROLL_THRESHOLD) {
            this.checkBoundary();
          }
        }
      }
    }, {
      key: "__checkCurrentItemChange",
      value: function __checkCurrentItemChange() {
        var _this3 = this;

        this.__lastCurrentChangeCheckScrollY = this.__container.scrollTop;
        if (!this.__currentItem) return;

        var cis = this.computeCurrentItems();
        var i = cis.findIndex(function (e) {
          return e == _this3.__currentItem;
        });
        if (i < 0) this.setCurrentItem(cis[0]);
      }
    }, {
      key: "setCurrentItem",
      value: function setCurrentItem(newCurrentItem) {
        var oldValue = this.__currentItem;
        if (newCurrentItem == oldValue) return;

        this.__currentItem = newCurrentItem;
        if (this.onCurrentItemChanged) this.onCurrentItemChanged(this, newCurrentItem, oldValue);
      }
    }, {
      key: "checkBoundary",
      value: function checkBoundary() {
        if (this.__isCheckingBoundary) return;
        this.__isCheckingBoundary = true;
        this.__container.removeEventListener('scroll', this.__scrollEventBindThis);

        var curScrollY = this.__container.scrollTop;
        var scrollDirection = this.PREVIOUS;
        if (this.__lastCheckScrollY) scrollDirection = curScrollY > this.__lastCheckScrollY ? this.PREVIOUS : this.NEXT;
        this.__lastCheckScrollY = curScrollY;

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return self.__checkBoundary(scrollDirection, true);

                case 2:
                  _context.next = 4;
                  return self.__checkBoundary(-scrollDirection, true);

                case 4:
                  self.__container.addEventListener('scroll', self.__scrollEventBindThis);
                  self.__isCheckingBoundary = false;

                case 6:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
      }
    }, {
      key: "computeCurrentItems",
      value: function computeCurrentItems() {
        var wh = this.__container.offsetHeight;
        var items = this.__itemList.children;
        var result = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
<<<<<<< HEAD

        try {
          for (var _iterator = Array.from(items)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;

            var top = item.getBoundingClientRect().top;
            var height = item.offsetHeight;
            if (top + height <= 0.1 * wh) continue;else if (top > 0.9 * wh) break;else result.push(item);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return result;
      }
    }, {
      key: "__isOutBoundary",
      value: function __isOutBoundary(item, direction) {
        var wh = this.__container.offsetHeight;
        var result = false;
        var top = item.getBoundingClientRect().top;
        if (direction >= 0) result = top > (this.DOWN_THRESHOLD + 1) * wh;else result = top + item.offsetHeight < -this.UP_THRESHOLD * wh;
        return result;
      }
    }, {
      key: "__isOnBoundary",
      value: function __isOnBoundary(item, direction) {
        var wh = this.__container.offsetHeight;
        var result = false;
        var top = item.getBoundingClientRect().top;
        if (direction >= 0) result = top + item.offsetHeight > (this.DOWN_THRESHOLD + 1) * wh;else result = top < -this.UP_THRESHOLD * wh;
        return result;
      }
    }, {
      key: "clearOutBoundary",
      value: function clearOutBoundary() {
        var ies = this.__itemList.children;
        var cii = this.__getCurrentItemIndex();

        for (var i = ies.length - 1; i >= 0; i--) {
          var item = ies[i];
          if (!this.__isOutBoundary(item, this.PREVIOUS) || i <= cii + 1) break;
          item.remove();
        }

        for (var _i = 0; _i < ies.length; _i++) {
          var _item = ies[_i];
          if (!this.__isOutBoundary(_item, this.NEXT) || _i >= cii - 1) break;
          var itemHeight = _item.offsetHeight;
          var cs = this.__container.scrollTop;
          _item.remove();
          this.__container.scrollTop = cs - itemHeight;
        }
      }
    }, {
      key: "__getBoundaryItem",
      value: function __getBoundaryItem(direction) {
        var es = this.__itemList.children;
        if (es.length <= 0) return null;
        return direction >= 0 ? es[es.length - 1] : es[0];
      }
    }, {
      key: "__isBoundarySatisfied",
      value: function __isBoundarySatisfied(direction) {
        if (!this.__container) return true;

=======

        try {
          for (var _iterator = Array.from(items)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;

            var top = item.getBoundingClientRect().top;
            var height = item.offsetHeight;
            if (top + height <= 0.1 * wh) continue;else if (top > 0.9 * wh) break;else result.push(item);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return result;
      }
    }, {
      key: "__isOutBoundary",
      value: function __isOutBoundary(item, direction) {
        var wh = this.__container.offsetHeight;
        var result = false;
        var top = item.getBoundingClientRect().top;
        if (direction >= 0) result = top > (this.DOWN_THRESHOLD + 1) * wh;else result = top + item.offsetHeight < -this.UP_THRESHOLD * wh;
        return result;
      }
    }, {
      key: "__isOnBoundary",
      value: function __isOnBoundary(item, direction) {
        var wh = this.__container.offsetHeight;
        var result = false;
        var top = item.getBoundingClientRect().top;
        if (direction >= 0) result = top + item.offsetHeight > (this.DOWN_THRESHOLD + 1) * wh;else result = top < -this.UP_THRESHOLD * wh;
        return result;
      }
    }, {
      key: "clearOutBoundary",
      value: function clearOutBoundary() {
        var ies = this.__itemList.children;
        var cii = this.__getCurrentItemIndex();

        for (var i = ies.length - 1; i >= 0; i--) {
          var item = ies[i];
          if (!this.__isOutBoundary(item, this.PREVIOUS) || i <= cii + 1) break;
          item.remove();
        }

        for (var _i = 0; _i < ies.length; _i++) {
          var _item = ies[_i];
          if (!this.__isOutBoundary(_item, this.NEXT) || _i >= cii - 1) break;
          var itemHeight = _item.offsetHeight;
          var cs = this.__container.scrollTop;
          _item.remove();
          this.__container.scrollTop = cs - itemHeight;
        }
      }
    }, {
      key: "__getBoundaryItem",
      value: function __getBoundaryItem(direction) {
        var es = this.__itemList.children;
        if (es.length <= 0) return null;
        return direction >= 0 ? es[es.length - 1] : es[0];
      }
    }, {
      key: "__isBoundarySatisfied",
      value: function __isBoundarySatisfied(direction) {
        if (!this.__container) return true;

>>>>>>> dev
        var be = this.__getBoundaryItem(direction);
        if (!be) return false;

        var result = be.dataset['end'] == direction || this.__currentItem != be && this.__isOnBoundary(be, direction);
        return result;
      }
    }, {
      key: "__addItem",
      value: regeneratorRuntime.mark(function __addItem(direction) {
        var result, isFirstItem, _result, newItem, done, cs, be, imgs;

        return regeneratorRuntime.wrap(function __addItem$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                result = void 0;
                isFirstItem = !this.__getBoundaryItem(direction);
                _context2.prev = 2;

                if (!(direction >= 0 && this.nextItemGenerator)) {
                  _context2.next = 9;
                  break;
                }

                _context2.next = 6;
                return this.nextItemGenerator.next();
<<<<<<< HEAD

              case 6:
                result = _context2.sent;
                _context2.next = 16;
                break;

=======

              case 6:
                result = _context2.sent;
                _context2.next = 16;
                break;

>>>>>>> dev
              case 9:
                if (!(direction < 0 && this.previousItemGenerator)) {
                  _context2.next = 15;
                  break;
                }

                _context2.next = 12;
                return this.previousItemGenerator.next();

              case 12:
                result = _context2.sent;
                _context2.next = 16;
                break;

              case 15:
                return _context2.abrupt("return", Promise.resolve(null));

              case 16:
                _context2.next = 22;
                break;

              case 18:
                _context2.prev = 18;
                _context2.t0 = _context2["catch"](2);

                if (this.onError) this.onError(this, _context2.t0);
                throw _context2.t0;

              case 22:
                _result = result, newItem = _result.value, done = _result.done;

                if (direction >= 0 && newItem) this.__itemList.append(newItem);else if (direction < 0 && newItem) {
                  cs = this.__container.scrollTop;

                  this.__itemList.prepend(newItem);
                  this.__container.scrollTop = cs + newItem.offsetHeight;
                }

                if (isFirstItem) this.setCurrentItem(newItem);
<<<<<<< HEAD

                if (done) {
                  be = this.__getBoundaryItem(direction);

=======

                if (done) {
                  be = this.__getBoundaryItem(direction);

>>>>>>> dev
                  if (be) be.dataset['end'] = direction;
                  if (this.onNoNewItemToLoad) this.onNoNewItemToLoad(this, be);
                }

                if (!newItem) {
                  _context2.next = 30;
                  break;
                }

                imgs = newItem.querySelectorAll('img');
                _context2.next = 30;
                return Promise.all(Array.from(imgs).map(function (img) {
                  return new Promise(function (resolve, reject) {

                    function onloadOrError(e) {
                      img.removeEventListener('load', onloadOrError);
                      img.removeEventListener('error', onloadOrError);
                      resolve();
                    }
                    img.addEventListener('load', onloadOrError);
                    img.addEventListener('error', onloadOrError);
                  });
                }));

              case 30:
                if (newItem && this.onNewItemFinished) this.onNewItemFinished(this, newItem, direction);

                return _context2.abrupt("return", Promise.resolve(newItem));
<<<<<<< HEAD

              case 32:
              case "end":
                return _context2.stop();
            }
          }
        }, __addItem, this, [[2, 18]]);
      })
    }, {
      key: "__checkBoundary",
      value: regeneratorRuntime.mark(function __checkBoundary(direction, ifClear) {
        return regeneratorRuntime.wrap(function __checkBoundary$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(!this.options.ifCheckPrevious && direction < 0)) {
                  _context3.next = 2;
                  break;
                }

=======

              case 32:
              case "end":
                return _context2.stop();
            }
          }
        }, __addItem, this, [[2, 18]]);
      })
    }, {
      key: "__checkBoundary",
      value: regeneratorRuntime.mark(function __checkBoundary(direction, ifClear) {
        return regeneratorRuntime.wrap(function __checkBoundary$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(!this.options.ifCheckPrevious && direction < 0)) {
                  _context3.next = 2;
                  break;
                }

>>>>>>> dev
                return _context3.abrupt("return", Promise.resolve());

              case 2:
                if (this.__isBoundarySatisfied(direction)) {
                  _context3.next = 8;
                  break;
                }

                _context3.next = 5;
                return this.__addItem(direction);

              case 5:
                if (ifClear) this.clearOutBoundary();
                _context3.next = 2;
                break;

              case 8:
                return _context3.abrupt("return", Promise.resolve());

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, __checkBoundary, this);
      })
    }]);

    return Infinitelist;
  }();

  return Infinitelist;
});
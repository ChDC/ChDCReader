"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["jquery", "co"], function ($, co) {

  "use strict";

  var Infinitelist = function () {
    function Infinitelist(container, itemList, onNewListItem, onNewListItemFinished) {
      _classCallCheck(this, Infinitelist);

      this.__container = container;
      this.__itemList = itemList;
      this.onNewListItem = onNewListItem;
      this.onNewListItemFinished = onNewListItemFinished;

      this.__currentItem = null;

      this.DOWN_THRESHOLD = 3;
      this.UP_THRESHOLD = 1;
      this.CHECK_SCROLL_THRESHOLD = 0.9;
      this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1;

      this.__lastCheckScrollY = null;
      this.__lastCurrentChangeCheckScrollY = null;
      this.onCurrentItemChanged = null;

      this.__isCheckingBoundary = false;

      this.__scrollEventBindThis = this.__scrollEvent.bind(this);
    }

    _createClass(Infinitelist, [{
      key: "getPageScorllTop",
      value: function getPageScorllTop() {
        if (this.__currentItem) return this.__container.scrollTop() - this.__currentItem.position().top;else return 0;
      }
    }, {
      key: "nextItem",
      value: function nextItem() {
        var i = this.__getCurrentItemIndex();
        if (i < 0) return;

        var ics = this.__itemList.children();
        i++;
        if (i < ics.length) {
          var ni = ics.eq(i);
          this.__container.scrollTop(ni.position().top);
        }
      }
    }, {
      key: "lastItem",
      value: function lastItem() {
        var i = this.__getCurrentItemIndex();
        if (i < 0) return;

        var ics = this.__itemList.children();
        i--;
        if (i >= 0) {
          var ni = ics.eq(i);
          this.__container.scrollTop(ni.position().top);
        }
      }
    }, {
      key: "loadList",
      value: function loadList() {
        return this.checkBoundary();
      }
    }, {
      key: "close",
      value: function close() {
        this.__container.off('scroll', this.__scrollEventBindThis);
        this.__itemList.empty();

        this.__container = null;
        this.__itemList = null;
        this.__currentItem = null;
        this.onNewListItem = null;
        this.onNewListItemFinished = null;
        this.onCurrentItemChanged = null;
        this.__lastCheckScrollY = null;
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
      }
    }, {
      key: "__getCurrentItemIndex",
      value: function __getCurrentItemIndex() {
        if (!this.__currentItem) return -1;
        var ics = this.__itemList.children();
        return Array.prototype.indexOf.bind(ics)(this.__currentItem[0]);
      }
    }, {
      key: "__scrollEvent",
      value: function __scrollEvent(event) {
        var scrollY = this.__container.scrollTop();

        if (this.__lastCurrentChangeCheckScrollY == null) {
          this.__checkCurrentItemChange();
        } else {
          var wh = $(window).height();
          if (Math.abs(scrollY - this.__lastCurrentChangeCheckScrollY) > wh * this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD) {
            this.__checkCurrentItemChange();
          }
        }

        if (this.__lastCheckScrollY == null) {
          this.checkBoundary();
        } else {
          var _wh = $(window).height();
          if (Math.abs(scrollY - this.__lastCheckScrollY) > _wh * this.CHECK_SCROLL_THRESHOLD) {
            this.checkBoundary();
          }
        }
      }
    }, {
      key: "__checkCurrentItemChange",
      value: function __checkCurrentItemChange() {
        var _this = this;

        this.__lastCurrentChangeCheckScrollY = this.__container.scrollTop();
        if (!this.__currentItem) {
          return;
        }
        var cis = this.computeCurrentItems();

        var i = cis.findIndex(function (e) {
          return Infinitelist.__itemEqual(e, _this.__currentItem);
        });
        if (i < 0) {
          this.setCurrentItem(cis[0]);
        }
      }
    }, {
      key: "setCurrentItem",
      value: function setCurrentItem(newCurrentItem) {
        var oldValue = this.__currentItem;
        if (Infinitelist.__itemEqual(newCurrentItem, oldValue)) return;

        this.__currentItem = newCurrentItem;
        if (this.onCurrentItemChanged) {
          this.onCurrentItemChanged(this, newCurrentItem, oldValue);
        }
      }
    }, {
      key: "checkBoundary",
      value: function checkBoundary() {
        if (this.__isCheckingBoundary) return;
        this.__isCheckingBoundary = true;
        this.__container.off('scroll', this.__scrollEventBindThis);

        var curScrollY = this.__container.scrollTop();
        var scrollDirection = 1;
        if (this.__lastCheckScrollY) {
          scrollDirection = curScrollY > this.__lastCheckScrollY ? 1 : -1;
        }
        this.__lastCheckScrollY = curScrollY;

        var self = this;
        return co(regeneratorRuntime.mark(function _callee() {
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return self.__checkBoundary(scrollDirection, false);

                case 2:
                  _context.next = 4;
                  return self.__checkBoundary(-scrollDirection, true);

                case 4:
                  self.__container.on('scroll', self.__scrollEventBindThis);
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
      key: "__checkBoundary",
      value: regeneratorRuntime.mark(function __checkBoundary(direction, willClear) {
        var isOutBoundary, getBoundaryItem, isBoundarySatisfied, clearOutBoundary, self, es, be, _ref, newItem, type, bbe, cs, imgs;

        return regeneratorRuntime.wrap(function __checkBoundary$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                clearOutBoundary = function clearOutBoundary() {
                  var ies = self.__itemList.children();
                  var cii = self.__getCurrentItemIndex();
                  if (direction < 0) {
                    for (var i = 0; i < ies.length; i++) {
                      var item = ies.eq(i);
                      if (!isOutBoundary(item)) break;
                      if (i >= cii - 1) break;
                      var itemHeight = item.outerHeight(true);
                      var cs = self.__container.scrollTop();
                      item.remove();
                      self.__container.scrollTop(cs - itemHeight);
                    }
                  } else {
                    for (var _i = ies.length - 1; _i >= 0; _i--) {
                      var _item = ies.eq(_i);
                      if (!isOutBoundary(_item)) break;
                      if (_i <= cii + 1) break;
                      _item.remove();
                    }
                  }
                };

                isBoundarySatisfied = function isBoundarySatisfied() {
                  function isOnBoundary(item) {
                    var wh = $(window).height();
                    var result = false;
                    if (direction >= 0) result = item.offset().top + item.outerHeight(true) > (self.DOWN_THRESHOLD + 1) * wh;else result = item.offset().top < -self.UP_THRESHOLD * wh;
                    return result;
                  }
                  if (!self.__container) return true;

                  var be = getBoundaryItem();
                  if (!be) return false;

                  var result = be.data(direction + 'end') || !Infinitelist.__itemEqual(self.__currentItem, be) && isOnBoundary(be);
                  return result;
                };

                getBoundaryItem = function getBoundaryItem() {
                  var es = self.__itemList.children();
                  if (es.length <= 0) return null;
                  return direction >= 0 ? es.last() : es.first();
                };

                isOutBoundary = function isOutBoundary(item) {
                  var wh = $(window).height();
                  var result = false;
                  if (direction >= 0) result = item.offset().top > (self.DOWN_THRESHOLD + 1) * wh;else result = item.offset().top + item.outerHeight(true) < -self.UP_THRESHOLD * wh;
                  return result;
                };

                self = this;

              case 5:
                if (isBoundarySatisfied()) {
                  _context2.next = 25;
                  break;
                }

                es = self.__itemList.children();
                be = null;

                if (es.length > 0) {
                  be = direction >= 0 ? es.last() : es.first();
                }

                _context2.next = 11;
                return self.onNewListItem(self, be, direction);

              case 11:
                _ref = _context2.sent;
                newItem = _ref.newItem;
                type = _ref.type;

                if (!(!newItem || newItem.length <= 0)) {
                  _context2.next = 17;
                  break;
                }

                if (type == 1) {
                  bbe = getBoundaryItem();

                  if (bbe) {
                    bbe.data(direction + 'end', true);
                  }
                }
                return _context2.abrupt("return", Promise.resolve());

              case 17:
                if (!be) {
                  self.setCurrentItem(newItem);
                }

                if (direction >= 0) {
                  self.__itemList.append(newItem);
                } else {
                  cs = self.__container.scrollTop();

                  self.__itemList.prepend(newItem);
                  self.__container.scrollTop(cs + newItem.outerHeight(true));
                }

                imgs = newItem.find('img');
                _context2.next = 22;
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

              case 22:

                if (self.onNewListItemFinished) self.onNewListItemFinished(self, be, direction);
                _context2.next = 5;
                break;

              case 25:
                return _context2.abrupt("return", Promise.resolve());

              case 26:
              case "end":
                return _context2.stop();
            }
          }
        }, __checkBoundary, this);
      })
    }]);

    return Infinitelist;
  }();

  Infinitelist.__itemEqual = function (i1, i2) {
    if (!i1 && !i2) return true;else if (!i1 || !i2) {
      return false;
    }
    return i1[0] == i2[0];
  };

  return Infinitelist;
});
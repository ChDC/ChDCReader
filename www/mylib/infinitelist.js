"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["jquery", "co"], function ($, co) {

  "use strict";

  var Infinitelist = function () {
    function Infinitelist(container, itemList, onNewListItem, onNewListItemFinished) {
      _classCallCheck(this, Infinitelist);

      this.container = container;
      this.itemList = itemList;
      this.onNewListItem = onNewListItem;
      this.onNewListItemFinished = onNewListItemFinished;

      this.currentItem = null;

      this.DOWN_THRESHOLD = 3;
      this.UP_THRESHOLD = 1;
      this.CHECK_SCROLL_THRESHOLD = 0.9;
      this.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1;

      this.__lastCheckScrollY = null;
      this.__lastCurrentChangeCheckScrollY = null;
      this.onCurrentItemChanged = null;

      this.isCheckingBoundary = false;
    }

    _createClass(Infinitelist, [{
      key: "getPageScorllTop",
      value: function getPageScorllTop() {
        if (this.currentItem) return this.container.scrollTop() - this.currentItem.position().top;else return 0;
      }
    }, {
      key: "nextItem",
      value: function nextItem() {
        var i = this.__getCurrentItemIndex();
        if (i < 0) return;

        var ics = this.itemList.children();
        i++;
        if (i < ics.length) {
          var ni = ics.eq(i);
          this.container.scrollTop(ni.position().top);
        }
      }
    }, {
      key: "lastItem",
      value: function lastItem() {
        var i = this.__getCurrentItemIndex();
        if (i < 0) return;

        var ics = this.itemList.children();
        i--;
        if (i >= 0) {
          var ni = ics.eq(i);
          this.container.scrollTop(ni.position().top);
        }
      }
    }, {
      key: "loadList",
      value: function loadList() {
        return this.checkBoundary();
      }
    }, {
      key: "emptyList",
      value: function emptyList() {
        this.currentItem = null;
        this.container.scrollTop(0);
        this.itemList.empty();
        this.__lastCheckScrollY = null;
      }
    }, {
      key: "computeCurrentItems",
      value: function computeCurrentItems() {
        var wh = $(window).height();
        var items = this.itemList.children();
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
        if (!this.currentItem) return -1;
        var ics = this.itemList.children();
        return Array.prototype.indexOf.bind(ics)(this.currentItem[0]);
      }
    }, {
      key: "__scrollEvent",
      value: function __scrollEvent(event) {
        var scrollY = this.container.scrollTop();

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

        this.__lastCurrentChangeCheckScrollY = this.container.scrollTop();
        if (!this.currentItem) {
          return;
        }
        var cis = this.computeCurrentItems();

        var i = cis.findIndex(function (e) {
          return Infinitelist.__itemEqual(e, _this.currentItem);
        });
        if (i < 0) {
          this.setCurrentItem(cis[0]);
        }
      }
    }, {
      key: "setCurrentItem",
      value: function setCurrentItem(newCurrentItem) {
        var oldValue = this.currentItem;
        if (Infinitelist.__itemEqual(newCurrentItem, oldValue)) return;

        this.currentItem = newCurrentItem;
        if (this.onCurrentItemChanged) {
          this.onCurrentItemChanged(this, newCurrentItem, oldValue);
        }
      }
    }, {
      key: "checkBoundary",
      value: function checkBoundary() {
        var _this2 = this;

        if (this.isCheckingBoundary) return;
        this.isCheckingBoundary = true;
        this.container.off('scroll', this.__scrollEvent.bind(this));

        var curScrollY = this.container.scrollTop();
        var scrollDirection = 1;
        if (this.__lastCheckScrollY) {
          scrollDirection = curScrollY > this.__lastCheckScrollY ? 1 : -1;
        }
        this.__lastCheckScrollY = curScrollY;

        return co(this.__checkBoundary(scrollDirection, false)).then(function () {
          return co(_this2.__checkBoundary(-scrollDirection, true));
        }).then(function () {
          _this2.container.on('scroll', _this2.__scrollEvent.bind(_this2));
          _this2.isCheckingBoundary = false;
        });
      }
    }, {
      key: "__checkBoundary",
      value: regeneratorRuntime.mark(function __checkBoundary(direction, willClear) {
        var isOutBoundary, getBoundaryItem, isBoundarySatisfied, clearOutBoundary, self, es, be, _ref, newItem, type, bbe, cs;

        return regeneratorRuntime.wrap(function __checkBoundary$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                clearOutBoundary = function clearOutBoundary() {
                  var ies = self.itemList.children();
                  var cii = self.__getCurrentItemIndex();
                  if (direction < 0) {
                    for (var i = 0; i < ies.length; i++) {
                      var item = ies.eq(i);
                      if (!isOutBoundary(item)) break;
                      if (i >= cii - 1) break;
                      var itemHeight = item.outerHeight(true);
                      var cs = self.container.scrollTop();
                      item.remove();
                      self.container.scrollTop(cs - itemHeight);
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

                  var be = getBoundaryItem();
                  if (!be) return false;

                  var result = be.data(direction + 'end') || !Infinitelist.__itemEqual(self.currentItem, be) && isOnBoundary(be);
                  return result;
                };

                getBoundaryItem = function getBoundaryItem() {
                  var es = self.itemList.children();
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
                  _context.next = 22;
                  break;
                }

                es = self.itemList.children();
                be = null;

                if (es.length > 0) {
                  be = direction >= 0 ? es.last() : es.first();
                }

                _context.next = 11;
                return self.onNewListItem(self, be, direction);

              case 11:
                _ref = _context.sent;
                newItem = _ref.newItem;
                type = _ref.type;

                if (newItem) {
                  _context.next = 17;
                  break;
                }

                if (type == 1) {
                  bbe = getBoundaryItem();

                  if (bbe) {
                    bbe.data(direction + 'end', true);
                  }
                }
                return _context.abrupt("break", 22);

              case 17:
                if (!be) {
                  self.setCurrentItem(newItem);
                }

                if (direction >= 0) {
                  self.itemList.append(newItem);
                } else {
                  cs = self.container.scrollTop();

                  self.itemList.prepend(newItem);
                  self.container.scrollTop(cs + newItem.outerHeight(true));
                }
                if (self.onNewListItemFinished) self.onNewListItemFinished(self, be, direction);
                _context.next = 5;
                break;

              case 22:
                return _context.abrupt("return", Promise.resolve());

              case 23:
              case "end":
                return _context.stop();
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
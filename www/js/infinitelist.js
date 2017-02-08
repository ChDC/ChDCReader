"use strict";

define(["jquery", "util"], function ($, util) {

    "use strict";

    function Infinitelist(container, itemList, onNewListItem) {
        var self = this;
        self.container = container;
        self.itemList = itemList;
        self.onNewListItem = onNewListItem;
    }

    Infinitelist.prototype.container = null;
    Infinitelist.prototype.currentItem = null;
    Infinitelist.prototype.itemList = null;

    Infinitelist.prototype.DOWN_THRESHOLD = 3;
    Infinitelist.prototype.UP_THRESHOLD = 1;
    Infinitelist.prototype.CHECK_SCROLL_THRESHOLD = 0.9;
    Infinitelist.prototype.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD = 0.1;

    Infinitelist.prototype.__lastCheckScrollY = null;

    Infinitelist.prototype.__lastCurrentChangeCheckScrollY = null;
    Infinitelist.prototype.onNewListItem = null;

    Infinitelist.prototype.onCurrentItemChanged = null;

    Infinitelist.prototype.isCheckingBoundary = false;

    Infinitelist.prototype.getPageScorllTop = function () {
        var self = this;
        if (self.currentItem) return self.container.scrollTop() - self.currentItem.position().top;else return 0;
    };

    Infinitelist.prototype.nextItem = function () {
        var self = this;
        var i = self.__getCurrentItemIndex();
        if (i < 0) return;

        var ics = self.itemList.children();
        i++;
        if (i < ics.length) {
            var ni = ics.eq(i);
            self.container.scrollTop(ni.position().top);
        }
    };

    Infinitelist.prototype.lastItem = function () {
        var self = this;
        var i = self.__getCurrentItemIndex();
        if (i < 0) return;

        var ics = self.itemList.children();
        i--;
        if (i >= 0) {
            var ni = ics.eq(i);
            self.container.scrollTop(ni.position().top);
        }
    };

    Infinitelist.prototype.loadList = function () {
        this.checkBoundary();
    };

    Infinitelist.prototype.emptyList = function () {
        this.currentItem = null;
        this.container.scrollTop(0);
        this.itemList.empty();
        this.__lastCheckScrollY = null;
    };

    Infinitelist.prototype.computeCurrentItems = function () {
        var self = this;
        var wh = $(window).height();
        var items = self.itemList.children();
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
    };

    Infinitelist.prototype.__getCurrentItemIndex = function () {
        var self = this;
        if (!self.currentItem) return -1;
        var ics = self.itemList.children();
        return Array.prototype.indexOf.bind(ics)(self.currentItem[0]);
    };

    Infinitelist.prototype.__scrollEvent = function (event) {
        var self = this;
        var scrollY = self.container.scrollTop();

        if (self.__lastCurrentChangeCheckScrollY == null) {
            self.__checkCurrentItemChange();
        } else {
            var wh = $(window).height();
            if (Math.abs(scrollY - self.__lastCurrentChangeCheckScrollY) > wh * self.CUTTENTITEM_CHECK_CHECK_SCROLL_THRESHOLD) {
                self.__checkCurrentItemChange();
            }
        }

        if (self.__lastCheckScrollY == null) {
            self.checkBoundary();
        } else {
            var _wh = $(window).height();
            if (Math.abs(scrollY - self.__lastCheckScrollY) > _wh * self.CHECK_SCROLL_THRESHOLD) {
                self.checkBoundary();
            }
        }
    };

    Infinitelist.prototype.__checkCurrentItemChange = function () {
        var self = this;
        self.__lastCurrentChangeCheckScrollY = self.container.scrollTop();
        if (!self.currentItem) {
            return;
        }
        var cis = self.computeCurrentItems();
        var i = util.arrayIndex(cis, self.currentItem, Infinitelist.__itemEqual);
        if (i < 0) {
            self.setCurrentItem(cis[0]);
        }
    };

    Infinitelist.__itemEqual = function (i1, i2) {
        if (!i1 && !i2) return true;else if (!i1 || !i2) {
            return false;
        }
        return i1[0] == i2[0];
    };

    Infinitelist.prototype.setCurrentItem = function (newCurrentItem) {
        var self = this;
        var oldValue = self.currentItem;
        if (Infinitelist.__itemEqual(newCurrentItem, oldValue)) return;

        self.currentItem = newCurrentItem;
        if (self.onCurrentItemChanged) {
            self.onCurrentItemChanged(self, newCurrentItem, oldValue);
        }
    };

    Infinitelist.prototype.checkBoundary = function (success) {
        var self = this;
        if (self.isCheckingBoundary) return;
        self.isCheckingBoundary = true;
        self.container.off('scroll', self.__scrollEvent.bind(self));

        var curScrollY = self.container.scrollTop();
        var scrollDirection = 1;
        if (self.__lastCheckScrollY) {
            scrollDirection = curScrollY > self.__lastCheckScrollY ? 1 : -1;
        }
        self.__lastCheckScrollY = curScrollY;

        self.__checkBoundary(scrollDirection, false, function () {
            self.__checkBoundary(-scrollDirection, true, function () {
                self.container.on('scroll', self.__scrollEvent.bind(self));
                self.isCheckingBoundary = false;
                if (success) success();
            });
        });
    };

    Infinitelist.prototype.__checkBoundary = function (direction, willClear, success) {

        function isOutBoundary(item) {
            var wh = $(window).height();
            var result = false;
            if (direction >= 0) result = item.offset().top > (self.DOWN_THRESHOLD + 1) * wh;else result = item.offset().top + item.outerHeight(true) < -self.UP_THRESHOLD * wh;
            return result;
        }

        function getBoundaryItem() {
            var es = self.itemList.children();
            if (es.length <= 0) return null;
            return direction >= 0 ? es.last() : es.first();
        }

        function isBoundarySatisfied() {
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
        }

        function clearOutBoundary() {
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
        }

        function next() {
            var es = self.itemList.children();
            var be = null;
            if (es.length > 0) {
                be = direction >= 0 ? es.last() : es.first();
            }
            self.onNewListItem(self, be, direction, function (newItem, type) {
                if (!newItem) {
                    if (type == 1) {
                        var bbe = getBoundaryItem();
                        if (bbe) {
                            bbe.data(direction + 'end', true);
                        }
                    }
                    if (success) success();
                    return;
                }
                if (!be) {
                    self.setCurrentItem(newItem);
                }

                if (direction >= 0) {
                    self.itemList.append(newItem);
                } else {
                    self.itemList.prepend(newItem);
                    var cs = self.container.scrollTop();
                    self.container.scrollTop(cs + newItem.outerHeight(true));
                }
                if (!isBoundarySatisfied()) next();else {
                    if (success) success();
                }
            });
        }

        var self = this;
        if (!isBoundarySatisfied()) {
            next();
        } else {
            if (success) success();
        }
    };

    return Infinitelist;
});
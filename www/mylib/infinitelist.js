"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (deps, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) define(deps, factory);else if (typeof module != "undefined" && typeof module.exports != "undefined") module.exports = factory.apply(undefined, deps.map(function (e) {
    return require(e);
  }));else window["Infinitelist"] = factory();
})(["co", "utils"], function (co, utils) {

  "use strict";

  var Infinitelist = function () {
    function Infinitelist(container, elementList, nextElementGenerator, previousElementGenerator) {
      var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      _classCallCheck(this, Infinitelist);

      this.__container = container;
      this.__elementList = elementList;
      this.previousElementGenerator = previousElementGenerator;
      this.nextElementGenerator = nextElementGenerator;
      this.options = options;

      this.__currentElement = null;
      this.__isCheckingBoundary = false;
      this.DOWN_THRESHOLD = 3;
      this.UP_THRESHOLD = 1;

      this.PREVIOUS = -1;
      this.NEXT = 1;

      this.__enableScrollSupport();
      utils.addEventSupport(this);
    }

    _createClass(Infinitelist, [{
      key: "getPageScorllTop",
      value: function getPageScorllTop() {
        return this.__currentElement ? this.__container.scrollTop - this.__currentElement.offsetTop : 0;
      }
    }, {
      key: "getScrollRate",
      value: function getScrollRate() {
        if (!this.__currentElement) return 0;
        var rate = (this.__container.scrollTop - this.__currentElement.offsetTop + this.__container.offsetHeight) / this.__currentElement.offsetHeight;
        return rate > 1 ? 1 : rate;
      }
    }, {
      key: "nextElement",
      value: function nextElement() {
        var _this = this;

        var i = this.__getCurrentElementIndex();
        var ics = this.__elementList.children;
        if (i >= 0 && ++i < ics.length) {
          this.__container.scrollTop = ics[i].offsetTop;
          return Promise.resolve();
        }

        if (!this.options.disableCheckNext) return new Promise(function (resolve, reject) {
          _this.addEventListener("newElementAddedToDOM", function () {
            resolve();
          }, true);
        });

        return co(this.__addElement(this.NEXT)).then(function (newElement) {
          if (newElement) {
            _this.__container.scrollTop = newElement.offsetTop;
            _this.__checkCurrentElementChange(_this.NEXT);
          }
        });
      }
    }, {
      key: "previousElement",
      value: function previousElement() {
        var _this2 = this;

        var st = this.getPageScorllTop();
        if (st > 0) {
          this.__container.scrollTop = this.__currentElement.offsetTop;
          return Promise.resolve();
        }

        var i = this.__getCurrentElementIndex();
        if (--i >= 0) {
          var ics = this.__elementList.children;
          this.__container.scrollTop = ics[i].offsetTop;
          return Promise.resolve();
        }

        if (!this.options.disableCheckPrevious) return Promise.reject();
        return co(this.__addElement(this.PREVIOUS)).then(function (newElement) {
          if (newElement) {
            _this2.__container.scrollTop = newElement.offsetTop;
            _this2.__checkCurrentElementChange(_this2.PREVIOUS);
          }
        });
      }
    }, {
      key: "loadList",
      value: function loadList() {
        var _this3 = this;

        return this.checkBoundary(this.NEXT).then(function () {
          if (!_this3.options.disableCheckPrevious) return _this3.checkBoundary(_this3.PREVIOUS, true);
        });
      }
    }, {
      key: "close",
      value: function close() {
        this.__container.removeEventListener('scroll', this.__scrollEventBindThis);
        Array.from(this.__elementList.children).forEach(function (e) {
          return e.remove();
        });
        this.__container.scrollTop = 0;
        for (var key in this) {
          delete this[key];
        }
      }
    }, {
      key: "getCurrentElement",
      value: function getCurrentElement() {
        return this.__currentElement;
      }
    }, {
      key: "__getCurrentElementIndex",
      value: function __getCurrentElementIndex() {
        if (!this.__currentElement) return -1;
        var ics = this.__elementList.children;
        return Array.from(ics).indexOf(this.__currentElement);
      }
    }, {
      key: "__enableScrollSupport",
      value: function __enableScrollSupport() {
        var _this4 = this;

        var __lastCheckScrollY = 0;
        var __lastCurrentChangeCheckScrollY = 0;
        var __lastScrollTop = 0;
        var CHECK_SCROLL_THRESHOLD = 0.9;
        var CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD = 0.1;
        var __scrollEvent = function __scrollEvent(event) {
          var target = event.currentTarget;
          var cst = target.scrollTop;
          var offset = cst - __lastScrollTop;
          event.scrollTop = cst;
          var direction = offset >= 0 ? 1 : -1;

          if (offset > 0) __onScroll(event, direction);else if (offset < 0) __onScroll(event, direction);
          __lastScrollTop = cst;
        };

        var __onScroll = function __onScroll(event, direction) {

          var wh = _this4.__container.offsetHeight;
          if (Math.abs(event.scrollTop - __lastCurrentChangeCheckScrollY) > wh * CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD) {
            __lastCurrentChangeCheckScrollY = _this4.__container.scrollTop;
            _this4.__checkCurrentElementChange(direction);
          }

          if (!_this4.__isCheckingBoundary && Math.abs(event.scrollTop - __lastCheckScrollY) > wh * CHECK_SCROLL_THRESHOLD) {
            if (_this4.options.disableCheckPrevious && direction == _this4.PREVIOUS) return;
            __lastCheckScrollY = _this4.__container.scrollTop;
            _this4.checkBoundary(direction);
          }
        };

        this.__scrollEventBindThis = __scrollEvent.bind(this);
        this.__container.addEventListener('scroll', this.__scrollEventBindThis);
      }
    }, {
      key: "__checkCurrentElementChange",
      value: function __checkCurrentElementChange(direction) {
        var CURRENT_ELEMENT_CHANGED_THRESHOLD = 0.1;
        var wh = this.__container.offsetHeight;

        var currentElement = void 0;
        var elements = Array.from(this.__elementList.children);

        if (direction > 0) currentElement = elements.reverse().find(function (e) {
          return e.getBoundingClientRect().top < (1 - CURRENT_ELEMENT_CHANGED_THRESHOLD) * wh;
        });else if (direction < 0) currentElement = elements.find(function (e) {
            return e.getBoundingClientRect().top + e.offsetHeight > CURRENT_ELEMENT_CHANGED_THRESHOLD * wh;
          });

        if (currentElement != this.__currentElement) this.setCurrentElement(currentElement);
      }
    }, {
      key: "setCurrentElement",
      value: function setCurrentElement(newCurrentElement) {
        var oldValue = this.__currentElement;
        if (newCurrentElement == oldValue) return;

        this.__currentElement = newCurrentElement;
        this.fireEvent("currentElementChanged", { new: newCurrentElement, old: oldValue });
      }
    }, {
      key: "checkBoundary",
      value: function checkBoundary(direction) {
        var _this5 = this;

        if (this.__isCheckingBoundary) return;
        this.__isCheckingBoundary = true;


        return co(this.__checkBoundary(direction, false)).then(function () {
          _this5.__isCheckingBoundary = false;
        }).catch(function (error) {
          _this5.__isCheckingBoundary = false;
          throw error;
        });
      }
    }, {
      key: "__isOutBoundary",
      value: function __isOutBoundary(element, direction) {
        var wh = this.__container.offsetHeight;
        var result = false;
        var top = element.getBoundingClientRect().top;
        if (direction >= 0) result = top > (this.DOWN_THRESHOLD + 1) * wh;else result = top + element.offsetHeight < -this.UP_THRESHOLD * wh;
        return result;
      }
    }, {
      key: "__isOnBoundary",
      value: function __isOnBoundary(element, direction) {
        var wh = this.__container.offsetHeight;
        var result = false;
        var top = element.getBoundingClientRect().top;
        if (direction >= 0) result = top + element.offsetHeight > (this.DOWN_THRESHOLD + 1) * wh;else result = top < -this.UP_THRESHOLD * wh;
        return result;
      }
    }, {
      key: "clearOutBoundary",
      value: function clearOutBoundary(direction) {
        var ies = this.__elementList.children;
        var cii = this.__getCurrentElementIndex();

        var select = !direction ? 3 : direction > 0 ? 1 : 2;

        if (select & 1) for (var i = ies.length - 1; i >= 0; i--) {
            var element = ies[i];
            if (!this.__isOutBoundary(element, this.NEXT) || i <= cii + 1) break;
            element.remove();
          }

        if (select & 2) for (var _i = 0; _i < ies.length; _i++) {
            var _element = ies[_i];
            if (!this.__isOutBoundary(_element, this.PREVIOUS) || _i >= cii - 1) break;
            var elementHeight = _element.offsetHeight;
            var cs = this.__container.scrollTop;
            _element.remove();
            this.__container.scrollTop = cs - elementHeight;
          }
      }
    }, {
      key: "__getBoundaryElement",
      value: function __getBoundaryElement(direction) {
        var es = this.__elementList.children;
        if (es.length <= 0) return null;
        return direction >= 0 ? es[es.length - 1] : es[0];
      }
    }, {
      key: "__isBoundarySatisfied",
      value: function __isBoundarySatisfied(direction) {
        if (!this.__container) return true;

        var be = this.__getBoundaryElement(direction);
        if (!be) return false;

        var result = be.dataset['end'] == direction || this.__currentElement != be && this.__isOnBoundary(be, direction);
        return result;
      }
    }, {
      key: "__addElement",
      value: regeneratorRuntime.mark(function __addElement(direction) {
        var result, isFirstElement, _result, newElement, done, cs, be, imgs;

        return regeneratorRuntime.wrap(function __addElement$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                result = void 0;
                isFirstElement = !this.__getBoundaryElement(direction);
                _context.prev = 2;

                if (!(direction >= 0 && this.nextElementGenerator)) {
                  _context.next = 9;
                  break;
                }

                _context.next = 6;
                return this.nextElementGenerator.next();

              case 6:
                result = _context.sent;
                _context.next = 16;
                break;

              case 9:
                if (!(direction < 0 && this.previousElementGenerator)) {
                  _context.next = 15;
                  break;
                }

                _context.next = 12;
                return this.previousElementGenerator.next();

              case 12:
                result = _context.sent;
                _context.next = 16;
                break;

              case 15:
                return _context.abrupt("return", Promise.resolve(null));

              case 16:
                _context.next = 22;
                break;

              case 18:
                _context.prev = 18;
                _context.t0 = _context["catch"](2);

                this.fireEvent("error", { error: _context.t0 });
                throw _context.t0;

              case 22:
                _result = result, newElement = _result.value, done = _result.done;

                if (direction >= 0 && newElement) this.__elementList.appendChild(newElement);else if (direction < 0 && newElement) {
                  cs = this.__container.scrollTop;

                  this.__elementList.insertBefore(newElement, this.__elementList.children[0]);
                  this.__container.scrollTop = cs + newElement.offsetHeight;
                }

                if (newElement) this.fireEvent("newElementAddedToDOM", { newElement: newElement, direction: direction });

                if (isFirstElement) this.setCurrentElement(newElement);

                if (done) {
                  be = this.__getBoundaryElement(direction);

                  if (be) be.dataset['end'] = direction;
                  this.fireEvent("noNewElementToLoad", { boundaryElement: be });
                }

                if (!newElement) {
                  _context.next = 31;
                  break;
                }

                imgs = newElement.querySelectorAll('img');
                _context.next = 31;
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

              case 31:

                if (isFirstElement) this.fireEvent("firstNewElementFinished", { newElement: newElement, direction: direction });
                if (newElement) this.fireEvent("newElementFinished", { newElement: newElement, direction: direction });

                return _context.abrupt("return", Promise.resolve(newElement));

              case 34:
              case "end":
                return _context.stop();
            }
          }
        }, __addElement, this, [[2, 18]]);
      })
    }, {
      key: "__checkBoundary",
      value: regeneratorRuntime.mark(function __checkBoundary(direction, ifClear) {
        return regeneratorRuntime.wrap(function __checkBoundary$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.__isBoundarySatisfied(direction)) {
                  _context2.next = 6;
                  break;
                }

                _context2.next = 3;
                return this.__addElement(direction);

              case 3:
                if (ifClear) this.clearOutBoundary(-direction);
                _context2.next = 0;
                break;

              case 6:
                return _context2.abrupt("return", Promise.resolve());

              case 7:
              case "end":
                return _context2.stop();
            }
          }
        }, __checkBoundary, this);
      })
    }]);

    return Infinitelist;
  }();

  return Infinitelist;
});
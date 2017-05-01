"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(["co"], function (co) {

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

      this.onNewElementFinished = undefined;
      this.onNoNewElementToLoad = undefined;
      this.onError = undefined;
      this.onCurrentElementChanged = null;
      this.__currentElement = null;
      this.__lastCheckScrollY = null;
      this.__lastCurrentChangeCheckScrollY = null;
      this.__isCheckingBoundary = false;
      this.__scrollEventBindThis = this.__scrollEvent.bind(this);

      this.DOWN_THRESHOLD = 3;
      this.UP_THRESHOLD = 1;
      this.CHECK_SCROLL_THRESHOLD = 0.9;
      this.CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD = 0.1;
      this.PREVIOUS = 1;
      this.NEXT = -1;
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
          return;
        }

        co(this.__addElement(1)).then(function (newElement) {
          if (newElement) {
            _this.__checkCurrentElementChange();
            _this.__container.scrollTop = newElement.offsetTop;
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
          return;
        }

        var i = this.__getCurrentElementIndex();
        if (--i >= 0) {
          var ics = this.__elementList.children;
          this.__container.scrollTop = ics[i].offsetTop;
          return;
        }

        co(this.__addElement(-1)).then(function (newElement) {
          if (newElement) {
            _this2.__checkCurrentElementChange();
            _this2.__container.scrollTop = newElement.offsetTop;
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
        Array.from(this.__elementList.children).forEach(function (e) {
          return e.remove();
        });

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
      key: "__scrollEvent",
      value: function __scrollEvent(event) {
        var scrollY = this.__container.scrollTop;

        if (this.__lastCurrentChangeCheckScrollY == null) this.__checkCurrentElementChange();else {
          var wh = this.__container.offsetHeight;
          if (Math.abs(scrollY - this.__lastCurrentChangeCheckScrollY) > wh * this.CUTTENTELEMENT_CHECK_CHECK_SCROLL_THRESHOLD) {
            this.__checkCurrentElementChange();
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
      key: "__checkCurrentElementChange",
      value: function __checkCurrentElementChange() {
        var _this3 = this;

        this.__lastCurrentChangeCheckScrollY = this.__container.scrollTop;
        if (!this.__currentElement) return;

        var cis = this.computeCurrentElements();
        var i = cis.findIndex(function (e) {
          return e == _this3.__currentElement;
        });
        if (i < 0) this.setCurrentElement(cis[0]);
      }
    }, {
      key: "setCurrentElement",
      value: function setCurrentElement(newCurrentElement) {
        var oldValue = this.__currentElement;
        if (newCurrentElement == oldValue) return;

        this.__currentElement = newCurrentElement;
        if (this.onCurrentElementChanged) this.onCurrentElementChanged(this, newCurrentElement, oldValue);
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
      key: "computeCurrentElements",
      value: function computeCurrentElements() {
        var wh = this.__container.offsetHeight;
        var elements = this.__elementList.children;
        var result = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(elements)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var element = _step.value;

            var top = element.getBoundingClientRect().top;
            var height = element.offsetHeight;
            if (top + height <= 0.1 * wh) continue;else if (top > 0.9 * wh) break;else result.push(element);
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
      value: function clearOutBoundary() {
        var ies = this.__elementList.children;
        var cii = this.__getCurrentElementIndex();

        for (var i = ies.length - 1; i >= 0; i--) {
          var element = ies[i];
          if (!this.__isOutBoundary(element, this.PREVIOUS) || i <= cii + 1) break;
          element.remove();
        }

        for (var _i = 0; _i < ies.length; _i++) {
          var _element = ies[_i];
          if (!this.__isOutBoundary(_element, this.NEXT) || _i >= cii - 1) break;
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

        return regeneratorRuntime.wrap(function __addElement$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                result = void 0;
                isFirstElement = !this.__getBoundaryElement(direction);
                _context2.prev = 2;

                if (!(direction >= 0 && this.nextElementGenerator)) {
                  _context2.next = 9;
                  break;
                }

                _context2.next = 6;
                return this.nextElementGenerator.next();

              case 6:
                result = _context2.sent;
                _context2.next = 16;
                break;

              case 9:
                if (!(direction < 0 && this.previousElementGenerator)) {
                  _context2.next = 15;
                  break;
                }

                _context2.next = 12;
                return this.previousElementGenerator.next();

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
                _result = result, newElement = _result.value, done = _result.done;

                if (direction >= 0 && newElement) this.__elementList.append(newElement);else if (direction < 0 && newElement) {
                  cs = this.__container.scrollTop;

                  this.__elementList.prepend(newElement);
                  this.__container.scrollTop = cs + newElement.offsetHeight;
                }

                if (isFirstElement) this.setCurrentElement(newElement);

                if (done) {
                  be = this.__getBoundaryElement(direction);

                  if (be) be.dataset['end'] = direction;
                  if (this.onNoNewElementToLoad) this.onNoNewElementToLoad(this, be);
                }

                if (!newElement) {
                  _context2.next = 30;
                  break;
                }

                imgs = newElement.querySelectorAll('img');
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
                if (newElement && this.onNewElementFinished) this.onNewElementFinished(this, newElement, direction);

                return _context2.abrupt("return", Promise.resolve(newElement));

              case 32:
              case "end":
                return _context2.stop();
            }
          }
        }, __addElement, this, [[2, 18]]);
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

                return _context3.abrupt("return", Promise.resolve());

              case 2:
                if (this.__isBoundarySatisfied(direction)) {
                  _context3.next = 8;
                  break;
                }

                _context3.next = 5;
                return this.__addElement(direction);

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
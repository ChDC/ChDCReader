!
function(e, i) {
    function t(e) {
        return function(i) {
            return {}.toString.call(i) == "[object " + e + "]"
        }
    }
    function n() {
        return L++
    }
    function r(e, i, t) {
        t = t || this;
        for (var n = 0,
        r = e.length; r > n; n++)"undefined" != typeof e[n] && i.call(t, e[n], n, e)
    }
    function a(e) {
        return e.match(q)[0]
    }
    function o(e) {
        for (e = e.replace(z, "/"), e = e.replace(M, "$1/"); e.match(J);) e = e.replace(J, "/");
        return e
    }
    function l(e) {
        var i = e.length - 1,
        t = e.charAt(i);
        return "#" === t ? e.substring(0, i) : ".css" === e.substring(i - 3) ? e: ".js" === e.substring(i - 2) || e.indexOf("?") > 0 || "/" === t ? e: e + ".js"
    }
    function u(e) {
        var i = k.alias;
        return i && R(i[e]) ? i[e] : e
    }
    function s(e) {
        var i;
        if (e.indexOf(".") > -1 && (i = H.exec(e))) {
            var t; (t = i[1]) && (e = e.substring(0, e.lastIndexOf(t))),
            t = ".js" + (t || ""),
            e = e.split(".").join("/") + t
        }
        return e
    }
    function d(e) {
        var i, t = k.paths;
        return t && (i = e.match(V)) && R(t[i[1]]) && (e = t[i[1]] + i[2]),
        e
    }
    function c(e) {
        var i = k.vars;
        return i && e.indexOf("{") > -1 && (e = e.replace($,
        function(e, t) {
            return R(i[t]) ? i[t] : e
        })),
        e
    }
    function g(e) {
        var i = k.map,
        t = e;
        if (i) for (var n = 0,
        r = i.length; r > n; n++) {
            var a = i[n];
            if (t = O(a) ? a(e) || e: e.replace(a[0], a[1]), t !== e) break
        }
        return t
    }
    function p(e, i) {
        var t, n = e.charAt(0);
        if (X.test(e)) t = e;
        else if ("." === n) t = o((i ? a(i) : k.cwd) + e);
        else if ("/" === n) {
            var r = k.cwd.match(W);
            t = r ? r[0] + e.substring(1) : e
        } else t = k.base + e;
        return 0 === t.indexOf("//") && (t = location.protocol + t),
        t
    }
    function f(e, i) {
        if (!e) return "";
        e = u(e),
        e = s(e),
        e = u(e),
        e = d(e),
        e = c(e),
        e = l(e);
        var t = p(e, i);
        return t = g(t)
    }
    function b(e) {
        return e.hasAttribute ? e.src: e.getAttribute("src", 4)
    }
    function h(e, i, t) {
        var n = oe.test(e),
        r = K.createElement(n ? "link": "script");
        if (t) {
            var a = O(t) ? t(e) : t;
            a && (r.charset = a)
        }
        return v(r, i, n, e),
        n ? (r.rel = "stylesheet", r.href = e) : (r.async = !0, r.src = e),
        te = r,
        ae ? re.insertBefore(r, ae) : re.appendChild(r),
        te = null,
        r
    }
    function v(e, i, t, n) {
        function r() {
            e.onload = e.onerror = e.onreadystatechange = null,
            t || k.debug || re.removeChild(e),
            e = null,
            i()
        }
        var a = "onload" in e;
        return ! t || !le && a ? void(a ? (e.onload = r, e.onerror = function() {
            _("error", {
                uri: n,
                node: e
            }),
            r()
        }) : e.onreadystatechange = function() { / loaded | complete / .test(e.readyState) && r()
        }) : void setTimeout(function() {
            m(e, i)
        },
        1)
    }
    function m(e, i) {
        var t, n = e.sheet;
        if (le) n && (t = !0);
        else if (n) try {
            n.cssRules && (t = !0)
        } catch(r) {
            "NS_ERROR_DOM_SECURITY_ERR" === r.name && (t = !0)
        }
        setTimeout(function() {
            t ? i() : m(e, i)
        },
        20)
    }
    function x() {
        if (te) return te;
        if (ne && "interactive" === ne.readyState) return ne;
        for (var e = re.getElementsByTagName("script"), i = e.length - 1; i >= 0; i--) {
            var t = e[i];
            if ("interactive" === t.readyState) return ne = t
        }
    }
    function y(e) {
        var i = ce.exec(e),
        t = se;
        if (!i) return [];
        "require" !== (i = i[1]) && (t = t.toString().replace(/require/g, i), t = t.slice(1, t.length - 2), t = new RegExp(t, "g"));
        var n = [];
        return e.replace(de, "").replace(t,
        function(e, i, t) {
            t && n.push(t)
        }),
        n
    }
    function N(e, i) {
        this.uri = e,
        this.dependencies = i || [],
        this.exports = null,
        this.status = 0,
        this._waitings = {},
        this._remain = 0
    }
    function w(e) {
        var i = k.combo;
        switch (typeof i) {
        case "string":
            return - 1 === e.indexOf(i) ? !0 : !1;
        default:
            return ! 1
        }
    }
    function S(e) {
        var i = e.length;
        if (! (2 > i) && k.combo) {
            k.comboSyntax && (we = k.comboSyntax),
            k.comboMaxLength && (Se = k.comboMaxLength),
            k.comboSuffix && (xe = k.comboSuffix),
            me = k.comboExcludes;
            for (var t = [], n = 0; i > n; n++) {
                var r = e[n];
                if (!Ne[r] && !w(r)) {
                    var a = N.get(r);
                    a.status < ye && !I(r) && !j(r) && !C(r) && t.push(r)
                }
            }
            t.length > 1 && E(t)
        }
    }
    function P(e) {
        k.combo && (e.requestUri = Ne[e.uri] || e.uri)
    }
    function E(e) {
        var i = [],
        t = Pe.exec(e[0])[1],
        n = t.length;
        r(e,
        function(e) {
            i.push(e.substr(n))
        }),
        T(t, i)
    }
    function T(e, i) {
        for (var t = [], n = 0, r = i.length; r > n; n++) t[n] = i[n].replace(/\?.*$/, "");
        var a = e + we[0] + t.join(we[1]);
        xe && (a += xe);
        var o = i.length > Se;
        if (i.length > 1 && o) {
            var l = U(i, Se);
            T(e, l[0]),
            T(e, l[1])
        } else {
            if (o) throw new Error("The combo url is too long: " + a);
            for (var n = 0,
            r = i.length; r > n; n++) Ne[e + i[n]] = a
        }
    }
    function U(e, i) {
        for (var t = 0,
        n = e.length; n > t; t++) if (t > i - 1) return [e.splice(0, t), e]
    }
    function I(e) {
        return Ee.test(e)
    }
    function j(e) {
        return me ? me.test ? me.test(e) : me(e) : void 0
    }
    function C(e) {
        var i = k.comboSyntax || we,
        t = i[0],
        n = i[1];
        return t && e.indexOf(t) > 0 || n && e.indexOf(n) > 0
    }
    if (e.LBF) var D = e.LBF;
    var exports = e.LBF = {
        version: "1.0.2"
    },
    k = exports.data = {};
    exports.noConflict = function() {
        D && (e.LBF = D)
    };
    var F = t("Object"),
    R = t("String"),
    A = Array.isArray || t("Array"),
    O = t("Function"),
    Q = t("Number"),
    B = t("RegExp"),
    L = 0,
    G = k.events = {};
    exports.on = function(e, i) {
        var t = G[e] || (G[e] = []);
        return t.push(i),
        exports
    },
    exports.off = function(e, i) {
        if (!e && !i) return G = k.events = {},
        exports;
        var t = G[e];
        if (t) if (i) for (var n = t.length - 1; n >= 0; n--) t[n] === i && t.splice(n, 1);
        else delete G[e];
        return exports
    };
    var _ = exports.emit = function(e, i) {
        var t = G[e];
        if (t) {
            t = t.slice();
            for (var n = 0,
            r = t.length; r > n; n++) t[n](i)
        }
        return exports
    },
    q = /[^?#]*\//,
    z = /\/\.\//g,
    J = /\/[^\/]+\/\.\.\//,
    M = /([^:\/])\/+\//g,
    V = /^([^\/:]+)(\/.+)$/,
    $ = /{([^{]+)}/g,
    H = /^[\w-_]*(?:\.[\w-_]+)*(\?[\w-_&=]*)?$/,
    X = /^\/\/.|:\//,
    W = /^.*?\/\/.*?\//,
    K = document,
    Z = location.href && 0 !== location.href.indexOf("about:") ? a(location.href) : "",
    Y = K.scripts,
    ee = K.getElementById("LBFnode") || Y[Y.length - 1],
    ie = a(b(ee) || Z);
    exports.resolve = f;
    var te, ne, re = K.head || K.getElementsByTagName("head")[0] || K.documentElement,
    ae = re.getElementsByTagName("base")[0],
    oe = /\.css(?:\?|$)/i,
    le = +navigator.userAgent.replace(/.*(?:AppleWebKit|AndroidWebKit)\/(\d+).*/, "$1") < 536;
    exports.request = h;
    var ue, se = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g,
    de = /\\\\/g,
    ce = /^function[\s]*\([\s]*([^\s,\)]+)/,
    ge = exports.cache = {},
    pe = {},
    fe = {},
    be = {},
    he = N.STATUS = {
        FETCHING: 1,
        SAVED: 2,
        LOADING: 3,
        LOADED: 4,
        EXECUTING: 5,
        EXECUTED: 6
    };
    N.prototype.resolve = function() {
        for (var e = this,
        i = e.dependencies,
        t = [], n = k.ignoreCss, r = 0, a = i.length; a > r; r++) n && -1 !== i[r].indexOf(".css") && (n === !0 || A(n) && -1 !== inArray(e.id, n)) || t.push(N.resolve(i[r], e.uri));
        return t
    },
    N.prototype.load = function() {
        var e = this;
        if (! (e.status >= he.LOADING)) {
            e.status = he.LOADING;
            var i = e.resolve();
            _("beforeload", i),
            _("load", i);
            for (var t, n = e._remain = i.length,
            r = 0; n > r; r++) t = N.get(i[r]),
            t.status < he.LOADED ? t._waitings[e.uri] = (t._waitings[e.uri] || 0) + 1 : e._remain--;
            if (0 === e._remain) return void e.onload();
            var a = {};
            for (r = 0; n > r; r++) t = ge[i[r]],
            t.status < he.FETCHING ? t.fetch(a) : t.status === he.SAVED && t.load();
            for (var o in a) a.hasOwnProperty(o) && a[o]()
        }
    },
    N.prototype.onload = function() {
        var e = this;
        e.status = he.LOADED,
        e.callback && e.callback();
        var i, t, n = e._waitings;
        for (i in n) n.hasOwnProperty(i) && (t = ge[i], t._remain -= n[i], 0 === t._remain && t.onload());
        delete e._waitings,
        delete e._remain
    },
    N.prototype.fetch = function(e) {
        function i() {
            exports.request(a.requestUri, a.onRequest, a.charset)
        }
        function t() {
            delete pe[o],
            fe[o] = !0,
            ue && (N.save(r, ue), ue = null);
            var e, i = be[o];
            for (delete be[o]; e = i.shift();) e.load()
        }
        var n = this,
        r = n.uri;
        n.status = he.FETCHING;
        var a = {
            uri: r
        };
        _("fetch", a);
        var o = a.requestUri || r;
        return ! o || fe[o] ? void n.load() : pe[o] ? void be[o].push(n) : (pe[o] = !0, be[o] = [n], _("request", a = {
            uri: r,
            requestUri: o,
            onRequest: t,
            charset: k.charset
        }), void(a.requested || (e ? e[a.requestUri] = i: i())))
    },
    N.prototype.exec = function() {
        function require(e) {
            return N.get(require.resolve(e)).exec()
        }
        var e = this;
        if (e.status >= he.EXECUTING) return e.exports;
        e.status = he.EXECUTING;
        var t = e.uri;
        require.resolve = function(e) {
            return N.resolve(e, t)
        },
        require.async = function(e, i) {
            return N.use(e, i, t + "_async_" + n()),
            require
        };
        var r = e.factory,
        exports = O(r) ? r(require, e.exports = {},
        e) : r;
        return exports === i && (exports = e.exports),
        delete e.factory,
        e.exports = exports,
        e.status = he.EXECUTED,
        _("exec", e),
        exports
    },
    N.resolve = function(e, i) {
        var t = {
            id: e,
            refUri: i
        };
        return _("resolve", t),
        t.uri || exports.resolve(t.id, i)
    },
    N.define = function(e, t, n) {
        var r = arguments.length;
        1 === r ? (n = e, e = i) : 2 === r && (n = t, A(e) ? (t = e, e = i) : t = i),
        !A(t) && O(n) && (t = y(n.toString()));
        var a = {
            id: e,
            uri: N.resolve(e),
            deps: t,
            factory: n
        };
        if (!a.uri && K.attachEvent) {
            var o = x();
            o && (a.uri = o.src)
        }
        _("define", a),
        a.uri ? N.save(a.uri, a) : ue = a
    },
    N.save = function(e, i) {
        var t = N.get(e);
        t.status < he.SAVED && (t.id = i.id || e, t.dependencies = i.deps || [], t.factory = i.factory, t.status = he.SAVED, _("save", t))
    },
    N.get = function(e, i) {
        return ge[e] || (ge[e] = new N(e, i))
    },
    N.use = function(i, t, n) {
        function r(e) {
            var e = A(e) ? e: [e],
            i = {},
            t = [],
            n = 0,
            r = k.deps;
            for (n = 0; n < e.length; n++) if (!i[e[n]]) {
                i[e[n]] = !0,
                t.push(e[n]);
                for (var a = r[e[n]] || [], o = 0; o < a.length; o++) e.push(a[o])
            }
            return t
        }
        var i = r(i),
        a = N.get(n, A(i) ? i: [i]);
        a.callback = function() {
            for (var exports = [], i = a.resolve(), n = 0, r = i.length; r > n; n++) exports[n] = ge[i[n]].exec();
            t && t.apply(e, exports),
            delete a.callback
        },
        a.load()
    },
    N.preload = function(e) {
        var i = k.preload,
        t = i.length;
        t ? N.use(i,
        function() {
            i.splice(0, t),
            N.preload(e)
        },
        k.cwd + "_preload_" + n()) : e()
    },
    exports.use = function(e, i) {
        return N.preload(function() {
            N.use(e, i, k.cwd + "_use_" + n())
        }),
        exports
    },
    N.define.cmd = {},
    e.define = exports.define = N.define,
    exports.Module = N,
    k.fetchedList = fe,
    k.cid = n,
    exports.require = function(e) {
        var i = N.get(N.resolve(e));
        return i.status < he.EXECUTING && (i.onload(), i.exec()),
        i.exports
    },
    k.base = ie,
    k.dir = ie,
    k.cwd = Z,
    k.charset = "utf-8",
    k.preload = [],
    k.deps = {},
    exports.config = function(e) {
        for (var i in e) {
            var t = e[i],
            n = k[i];
            if (n && F(n)) for (var r in t) n[r] = t[r];
            else A(n) ? t = n.concat(t) : "base" === i && ("/" !== t.slice( - 1) && (t += "/"), t = p(t)),
            k[i] = t
        }
        return _("config", e),
        exports
    };
    var ve = [["globalSettings", exports.data], ["lang.forEach", r], ["lang.isType", t], ["lang.isObject", F], ["lang.isString", R], ["lang.isArray", A], ["lang.isFunction", O], ["lang.isNumber", Q], ["lang.isRegExp", B], ["util.request", h]];
    e.JSON && ve.push(["lang.JSON", e.JSON]),
    e.jQuery && 0 === (e.jQuery.version || "").indexOf("1.7") && ve.push(["lib.jQuery", e.jQuery]),
    r(ve,
    function(e) {
        exports.define(e[0],
        function(require, exports, module) {
            module.exports = e[1]
        })
    });
    var me, xe, N = LBF.Module,
    ye = N.STATUS.FETCHING,
    k = LBF.data,
    Ne = k.comboHash = {},
    we = ["c/=/", ",/"],
    Se = 20;
    LBF.on("load", S),
    LBF.on("fetch", P);
    var Pe = /^(\S+:\/{2,3}[^\/]+\/)/,
    Ee = /\.css(?:\?.*)?$/;
    if (k.test) {
        var Te = LBF.test || (LBF.test = {});
        Te.uris2paths = E,
        Te.paths2hash = paths2hash
    }
    LBF.config({
        alias: {
            globalSettings: ie + "globalSettings"
        },
        vars: {
            theme: ie + "ui/themes/default"
        },
        paths: {
            app: ie + "app",
            lang: ie + "lang",
            monitor: ie + "monitor",
            lib: ie + "lib",
            ui: ie + "ui",
            util: ie + "util"
        }
    }),
    LBF.config({
        deps: {
            "app.Collection": ["lang.isFunction", "lang.JSON", "app.REST", "util.Promise", "util.Tasks", "lib.Backbone", "lib.underscore", "app.RESTSync"],
            "app.Model": ["lang.isFunction", "lang.JSON", "app.REST", "util.Promise", "util.Tasks", "lib.Backbone", "lib.underscore", "app.RESTSync"],
            "app.REST": ["lang.extend", "lang.forEach", "lang.JSON", "lang.isFunction", "lib.jQuery", "util.Attribute", "util.Event", "app.RESTPlugins.errorLog", "app.RESTPlugins.speedReport", "app.RESTPlugins.CSRFPatch"],
            "app.RESTPlugins.CSRFPatch": ["util.Cookie"],
            "app.RESTPlugins.errorLog": ["monitor.logger", "lang.extend"],
            "app.RESTPlugins.speedReport": ["lang.extend", "monitor.SpeedReport"],
            "app.RESTSync": ["lib.underscore"],
            "app.Router": ["lib.Backbone"],
            "app.View": ["lang.extend", "lib.jQuery", "lib.Backbone", "lib.underscore", "util.template"],
            "lang.Class": ["lang.toArray", "lang.extend"],
            "lang.extend": ["lang.isPlainObject"],
            "lang.Inject": ["lang.each"],
            "lang.isPlainObject": ["lang.isObject"],
            "lib.Backbone": ["lib.underscore", "lib.jQuery", "lang.JSON", "lib.underscore"],
            "lib.Highcharts": ["lib.jQuery"],
            "lib.jQuery": ["globalSettings", "util.Cookie"],
            "monitor.SpeedReport": ["util.report", "lang.Class", "util.serialize", "util.Attribute"],
            "ui.Nodes.Button": ["lang.browser", "ui.Nodes.Node"],
            "ui.Nodes.Checkbox": ["lib.jQuery", "ui.Nodes.Node", "lang.each", "lang.extend"],
            "ui.Nodes.Gotop": ["lib.jQuery", "util.zIndexGenerator", "ui.Nodes.Node"],
            "ui.Nodes.Node": ["lang.each", "util.defaults", "lang.extend", "lang.proxy", "lang.Inject", "util.template", "util.Attribute", "lang.trim", "lang.isString", "lib.jQuery", "lang.Class"],
            "ui.Nodes.Pagination": ["lang.isNumber", "lang.extend", "ui.Nodes.Node"],
            "ui.Nodes.Popup": ["util.Style", "lib.jQuery", "lang.browser", "ui.Nodes.Node", "util.zIndexGenerator", "{theme}/lbfUI/css/Popup.css"],
            "ui.Nodes.Radio": ["lib.jQuery", "ui.Nodes.Node", "lang.each", "lang.extend"],
            "ui.Nodes.Textarea": ["lang.browser", "ui.Nodes.Node"],
            "ui.Nodes.TextInput": ["lang.forEach", "lang.browser", "lang.isArray", "ui.Nodes.Node"],
            "ui.Nodes.Tip": ["lib.jQuery", "lang.extend", "util.zIndexGenerator", "ui.Nodes.Node", "ui.widget.Dropdown.Dropdown", "{theme}/lbfUI/css/Tip.css"],
            "ui.Plugins.Cursor": ["ui.Plugins.Plugin"],
            "ui.Plugins.Drag": ["util.Style", "ui.Plugins.Plugin", "util.zIndexGenerator", "{theme}/lbfUI/css/Drag.css"],
            "ui.Plugins.DragDrop": ["lang.extend", "ui.Plugins.Drag"],
            "ui.Plugins.Overlay": ["lang.proxy", "lang.Inject", "util.Style", "util.zIndexGenerator", "lib.jQuery", "ui.Plugins.Plugin"],
            "ui.Plugins.Pin": ["lib.jQuery", "ui.Plugins.Plugin", "util.zIndexGenerator"],
            "ui.Plugins.Plugin": ["lang.each", "lang.proxy", "ui.Nodes.Node"],
            "ui.widget.CheckboxGroup.CheckboxGroup": ["lib.jQuery", "ui.Nodes.Node", "ui.Nodes.Checkbox"],
            "ui.widget.Clipboard.Clipboard": ["ui.Nodes.Node", "lang.browser"],
            "ui.widget.ComboBox.ComboBox": ["lib.jQuery", "lang.each", "lang.isArray", "lang.isFunction", "lang.isObject", "lang.isNumber", "lang.proxy", "util.template", "lang.extend", "util.zIndexGenerator", "ui.Nodes.Node", "ui.widget.Dropdown.Dropdown", "util.xssFilter"],
            "ui.widget.DatePicker.DatePicker": ["lang.proxy", "lang.forEach", "lang.isNumber", "lang.dateTool", "lang.extend", "util.contains", "ui.widget.Dropdown.Dropdown", "ui.widget.DatePicker.DatePickerTemplate", "{theme}/lbfUI/css/DatePicker.css"],
            "ui.widget.DatePicker.DatePickerRange": ["ui.widget.DatePicker.DatePicker", "lang.extend", "lang.proxy", "ui.Nodes.Popup", "lang.dateTool", "ui.widget.DatePicker.DatePickerRangeTemplate"],
            "ui.widget.Dropdown.Dropdown": ["lang.proxy", "util.template", "util.zIndexGenerator", "ui.Nodes.Popup", "{theme}/lbfUI/css/Dropdown.css"],
            "ui.widget.FileUploader.ajaxUpload.ajaxUpload": ["lang.proxy", "ui.Nodes.Node", "ui.Nodes.Button", "lang.isFunction", "lang.browser", "util.Cookie"],
            "ui.widget.FileUploader.FileUploader": ["lib.jQuery", "ui.Nodes.Node", "{theme}/lbfUI/css/FileUploader.css"],
            "ui.widget.FileUploader.iframeUpload.iframeUpload": ["lang.proxy", "lang.browser", "ui.Nodes.Node", "ui.Nodes.Button", "lang.isFunction", "util.Cookie", "lang.extend"],
            "ui.widget.FileUploader.swfUpload.init": ["lib.jQuery", "lang.proxy", "lang.extend", "ui.Nodes.Node", "ui.Nodes.Button", "lang.isFunction", "util.Cookie", "ui.widget.FileUploader.swfUpload.swfUploadQueue"],
            "ui.widget.FileUploader.swfUpload.swfUploadQueue": ["ui.widget.FileUploader.swfUpload.swfUpload"],
            "ui.widget.ImageCrop.ImageCrop": ["ui.Nodes.Node", "lib.jQuery", "lang.isFunction", "ui.widget.Panel.Panel", "lang.extend", "ui.widget.FileUploader.FileUploader", "util.imageLoader", "{theme}/lbfUI/css/ImageCrop.css", "ui.widget.ImageCrop.mouseWheel"],
            "ui.widget.ImageViewer.ImageViewer": ["lang.proxy", "lang.browser", "ui.Nodes.Tip"],
            "ui.widget.JScrollPane.JScrollPane": ["lib.jQuery", "util.mouseWheel", "{theme}/lbfUI/css/JScrollPane.css"],
            "ui.widget.LightTip.LightTip": ["lib.jQuery", "lang.extend", "ui.Nodes.Node", "ui.Nodes.Popup", "ui.Plugins.Overlay", "util.zIndexGenerator", "{theme}/lbfUI/css/LightTip.css"],
            "ui.widget.Menu.Menu": ["lang.proxy", "lang.extend", "lang.forEach", "lang.isArray", "util.template", "util.zIndexGenerator", "ui.widget.Dropdown.Dropdown", "{theme}/lbfUI/css/Menu.css"],
            "ui.widget.NumberSpinner.NumberSpinner": ["lang.isNumber", "lang.extend", "ui.Nodes.Node", "{theme}/lbfUI/css/NumberSpinner.css"],
            "ui.widget.Panel.Panel": ["lib.jQuery", "lang.forEach", "lang.proxy", "lang.extend", "lang.Inject", "util.zIndexGenerator", "util.Shortcuts", "ui.Nodes.Node", "ui.Nodes.Popup", "ui.Nodes.Button", "ui.Plugins.Drag", "ui.Plugins.Overlay", "{theme}/lbfUI/css/Panel.css"],
            "ui.widget.RegionSelector.RegionSelector": ["ui.Nodes.Node", "ui.widget.ComboBox.ComboBox", "util.regionData", "lang.each", "lang.isArray"],
            "ui.widget.Scrollspy.Scrollspy": ["lib.jQuery", "ui.Nodes.Node", "lang.extend", "{theme}/lbfUI/css/Scrollspy.css"],
            "ui.widget.Slides.Slides": ["lib.jQuery", "ui.Nodes.Node", "{theme}/lbfUI/css/Slides.css"],
            "ui.widget.State.State": ["ui.Nodes.Node", "ui.Nodes.Popup", "lang.proxy", "lang.extend", "lib.jQuery"],
            "ui.widget.Switchable.Switchable": ["lib.jQuery", "ui.Nodes.Node"],
            "ui.widget.TimePicker.TimePicker": ["lib.jQuery", "lang.extend", "ui.widget.Dropdown.Dropdown", "ui.widget.TimePicker.TimePickerTemplate", "{theme}/lbfUI/css/TimePicker.css"],
            "ui.widget.ZTree.ZTree": ["lib.jQuery", "{theme}/lbfUI/css/zTreeStyle.css"],
            "util.Attribute": ["lang.extend"],
            "util.Callbacks": ["lang.Class", "lang.forEach", "lang.extend", "lang.isFunction", "lang.isString", "lang.inArray"],
            "util.Event": ["lang.toArray", "util.Callbacks"],
            "util.eventProxy": ["lang.extend", "lib.Backbone"],
            "util.imageLoader": ["lang.browser"],
            "util.jsonp": ["util.request", "util.serialize"],
            "util.localStorage": ["util.Cookie", "lang.trim"],
            "util.Promise": ["lang.Class", "lang.forEach", "lang.extend", "lang.proxy", "lang.toArray", "lang.isFunction", "util.Callbacks"],
            "util.ptLoginHelper": ["util.RSA", "util.TEA", "util.md5"],
            "util.PubSub": ["lang.extend", "util.Event"],
            "util.Range": ["lang.Class", "lang.isString", "util.contains"],
            "util.requestAnimationFrame": ["lang.proxy"],
            "util.Selection": ["lang.Class", "util.Range"],
            "util.sessionStorage": ["util.localStorage", "util.Cookie", "util.domain"],
            "util.Style": ["lib.jQuery"],
            "util.Tasks": ["lang.proxy"],
            "util.Validform": ["{theme}/lbfUI/css/Validform.css", "ui.Nodes.Node", "lib.jQuery", "lang.extend", "lang.isFunction", "lang.isRegExp"]
        }
    })
} (this);

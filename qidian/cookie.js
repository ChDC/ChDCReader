LBF.define("util.Cookie",
function() {
    var e = document;
    return {
        set: function(n, t, i, o, r) {
            r && (r = new Date( + new Date + r));
            var u = n + "=" + escape(t) + (r ? "; expires=" + r.toGMTString() : "") + (o ? "; path=" + o: "") + (i ? "; domain=" + i: "");
            return u.length < 4096 && (e.cookie = u),
            this
        },
        get: function(n) {
            var t = e.cookie.match(new RegExp("(^| )" + n + "=([^;]*)(;|$)"));
            return null != t ? unescape(t[2]) : null
        },
        del: function(n, t, i) {
            return this.get(n) && (e.cookie = n + "=" + (i ? "; path=" + i: "") + (t ? "; domain=" + t: "") + ";expires=Thu, 01-Jan-1970 00:00:01 GMT"),
            this
        },
        find: function(n) {
            return e.cookie.match(n)
        }
    }
});

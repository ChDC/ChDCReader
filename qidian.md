
注意断点 LBF.config 然后设置 DEbug = true

## 目录链接

http://book.qidian.com/ajax/book/category?_csrfToken=C7X6MekJ76xoI1pQd3DjfM9kYTFI57FKgZxSnjWK&bookId=2750457

## 脚本代码文件

http://qidian.gtimg.com/qd/js/book_details/index.0.66.js

http://qidian.gtimg.com/qd/js/book_details/catalog.0.22.js

http://qidian.gtimg.com/lbf/1.0.2/LBF.js?max_age=31536000

util.Cookie -> http://qidian.gtimg.com/lbf/1.0.2/util/Cookie.js

### 脚本配置

util.Cookie -> http://qidian.gtimg.com/lbf/1.0.2/util/Cookie.js


base:"http://qidian.gtimg.com/lbf/1.0.2/"

```js
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

LBF.config({"paths":{"site":"//qidian.gtimg.com/qd/js","qd":"//qidian.gtimg.com/qd"},"vars":{"theme":"//qidian.gtimg.com/qd/css"},"combo":true,"debug":false});


```


```js


var e = a("lib.jQuery"),

var a = n("util.Cookie");

i.ajaxSetup({
    data: {
        _csrfToken: a.get("_csrfToken") || ""
    },

getCatalogInfo: function(a) {
    var o = {},
    t = e("#bookImg").data("bid");
    a.catalogHasLoaded = !0,
    e.ajax({
        type: "GET",
        url: "/ajax/book/category",
        dataType: "json",
        data: {
            bookId: t
        },
        success: function(n) {
            if (0 === n.code) {
                0 == n.data.hasRead && n.data.firstChapterJumpurl && e(".J-getJumpUrl").attr("href", n.data.firstChapterJumpurl),
                o.catalogInfo = n.data;
                var l = o.catalogInfo.chapterTotalCnt;
                0 != l && e("#J-catalogCount").html("(" + l + "章)");
                var s = a.separateVolumes(o.catalogInfo.vs);
                e.extend(o.catalogInfo, {
                    bId: t,
                    volF: 0,
                    volT: s + 1,
                    hasShownProgress: !1
                });
                var d = new r({
                    url: "/ejs/qd/js/book_details/catalog.0.10.ejs"
                }).render(o),
                i = e(".catalog-content-wrap");
                i.find(".loading").length > 0 && i.children(".loading").remove(),
                i.append(d),
                setTimeout(function() {
                    if (o.catalogInfo.volF = s + 1, o.catalogInfo.volT = o.catalogInfo.vs.length, o.catalogInfo.volF != o.catalogInfo.volT) {
                        o.catalogInfo.hasShownProgress = !0;
                        var a = new r({
                            url: "/ejs/qd/js/book_details/catalog.0.10.ejs"
                        }).render(o);
                        i.append(a),
                        window.readTrackHtml && i.prepend(window.readTrackHtml)
                    }
                },
                0)
            } else e("#j-catalogWrap").children().remove().end().append('<div class="no-data"><div class="null"></div><p>暂无目录数据，请稍后查看</p></div>')
        }
    })
},
```

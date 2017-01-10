LBF.define("qd/js/book_details/index.0.66.js",
function(e, a, t) {
    var o = e("lib.jQuery"),
    n = e("ui.Nodes.Node"),
    s = (e("qd/js/component/ajaxSetting.0.11.js"), e("qidian.report")),
    r = e("ui.Nodes.Pagination"),
    i = e("qd/js/component/pinNav.0.31.js"),
    c = e("util.Cookie"),
    d = (e("qd/js/component/url.0.7.js"), e("ui.widget.Switchable.Switchable")),
    l = e("util.EJS"),
    u = e("ui.widget.Panel.Panel"),
    p = e("ui.Nodes.Textarea"),
    m = e("ui.Plugins.TextCounter"),
    h = e("qd/js/free/addBook.0.33.js"),
    f = (e("ui.Nodes.Checkbox"), e("qd/js/component/login.0.8.js")),
    g = e("ui.widget.LightTip.LightTip"),
    v = e("qd/js/component/votePopup.0.25.js"),
    k = e("qd/js/book_details/catalog.0.22.js"),
    b = e("qd/js/read.qidian.com/ejsChinese.0.1.js"),
    w = (e("lang.dateTool"), e("qd/js/component/loading.0.2.js")),
    j = e("qd/js/component/common.0.10.js");
    a = t.exports = n.inherit({
        el: "body",
        events: {
            "mouseenter #recTip": "showRecTip",
            "mouseleave #recTip": "hideRecTip",
            "click #sortBox a": "getSortCommentList",
            "click .nav-wrap ul li": "switchTab",
            "click #monthBtn, #recBtn, #topVoteBtn, #topRewardBtn": "showVotePopup",
            "click #rewardBtn": "isShowRewardPopup",
            "click #subscribe": "jumpSubscribe",
            "click #download": "downloadPopup",
            "click .add-book": "addToBookShelf",
            "click #goComment, #scoreBtn": "commentIsLogin",
            "click .j_charge": "goCharge",
            "click .j_quickPay": "showQuickPay",
            "click .j_payByQuick": "selectPayMethod",
            "click .j_switchMethod": "backToQuickPay",
            "click .zan": "addPraise",
            "click .j_unfold": "unfoldComment",
            "click .j_infoUnfold": "unfoldAuthorInfo",
            "click #sendComment": "sendComment",
            "click #evaMsgText": "clearEvaText",
            "click .user-commentWrap .comment-head span": "switchDiscussComment",
            "click .j_complete_bind": "continueProcess",
            "click .j_continue": "continueProcess",
            "click .j_retry_payment": "retryReward",
            "click .closeBtn, .close": "closeCurrentPanel",
            "click .top-bg-op-box .close-game-op": "closeTopOp",
            "click .top-bg-box .back-to-op": "showTopOp"
        },
        elements: {
            monthNum: "#monthNum",
            recNum: "#recNum",
            mTicket: "#mTicket",
            recTicket: "#recTicket",
            rewardList: "#rewardList",
            payMode: "#payMode"
        },
        render: function() {
            return this.setElement(this.el),
            this.init(),
            this
        },
        init: function() {
            var e = this,
            a = "pro" == g_data.envType ? "": g_data.envType;
            new j({
                commonUrl: "//" + a + "grey.qidian.com/Grey/Judge"
            });
            this.getBookScoreHasLoaded = !1,
            this.zanComplete = 0;
            var t = o("#bookImg").attr("data-bid");
            e.bookId = t,
            this.loading = new w({}),
            this.lazyLoad();
            var n = (new i({}), new k({}));
            s.init({
                isQD: !0
            }),
            window.getReadStatus = function() {
                e.getReadStatus(e)
            },
            this.switchTicket(),
            this.getUserFansInfo(),
            window.getUserFansInfo = function() {
                e.getUserFansInfo(e)
            },
            this.workSlides(),
            this.showHonorList(),
            this.VotePopup = new v({}),
            this.payment = this.VotePopup.payment,
            setTimeout(function() {
                0 == g_data.hasDirectData && n.showCatalogInfo(),
                c.get("cmfuToken") && e.myCommentData(),
                e.getBookScore(),
                window.getBookScore = function() {
                    e.getBookScore(e)
                },
                e.showFlashOp(),
                e.discussList(),
                e.fansRankList(),
                e.topFansList(),
                e.fansRollList(),
                e.getReadStatus(e),
                window.myCommentData = function() {
                    e.myCommentData(e)
                }
            },
            0)
        },
        backToOld: function() {
            var e = "pro" == g_data.envType ? "": g_data.envType;
            2 != c.get("nb") && (location.href = "//" + e + "www.qidian.com/Book/" + this.bookId + ".aspx")
        },
        lazyLoad: function() {
            e.async("../component/jquery.lazyload.0.1",
            function() {
                o("img.lazy").lazyload({
                    placeholder: "data:image/gif;base64,R0lGODlhCgAKAIAAAP///wAAACH5BAEAAAAALAAAAAAKAAoAAAIIhI+py+0PYysAOw==",
                    threshold: 200
                })
            })
        },
        goCharge: function(e) {
            o(e.currentTarget).attr("href", "//me.qidian.com/account/charge.aspx?amount=" + (amount - balance)),
            o(".lbf-panel .lbf-panel-close").trigger("click")
        },
        showQuickPay: function() {
            var e = this;
            e.payment.getPanel(e.VotePopup.panel),
            e.payment.checkBeforeQuick(amount, balance, "打赏", 4)
        },
        selectPayMethod: function(e) {
            var a = this,
            t = o(e.currentTarget).attr("method");
            this.payment.payByTargetMethod(t, this.VotePopup.requiredData, this.quickPay, this.CheckStatus, a)
        },
        quickPay: function(e, a, t, n, s) {
            var r, i = o(".j_payByQuick");
            if (0 == o(e.agreeRulesCheckbox).is(":checked")) return void o(e.agreeRulesCheckbox).next().removeClass("ui-checkbox-checked");
            e.loading.startLoading(i,
            function() {
                return r
            },
            200),
            a.payMethod = parseInt(t);
            var c = g_data.pageJson,
            d = new l({
                url: "/ejs/qd/js/component/template/rewardTipPopup.0.1.ejs"
            }).render(c);
            o.ajax({
                method: "POST",
                url: "/ajax/reward/quickPay",
                dataType: "json",
                data: a,
                success: function(t) {
                    switch (r = !0, e.loading.clearLoading(i), t.code) {
                    case 0:
                        n(e, t.data, a, s, a.amount - balance, "打赏");
                        break;
                    case 1e3:
                        e.panel.close(),
                        f && f.showLoginPopup && f.showLoginPopup();
                        break;
                    case 2001:
                        console.log("充值金额未到账"),
                        e.panel.setContent(d),
                        e.panel.setWidth(520),
                        o("#payError").show();
                        break;
                    default:
                        e.checkBadPaymentNoCode(t, a, 4, e.thirdPartyMethod || o(".j_payByQuick").attr("method"), "打赏")
                    }
                }
            })
        },
        CheckStatus: function(e, a) {
            var t = g_data.pageJson,
            n = new l({
                url: "/ejs/qd/js/component/template/rewardTipPopup.0.1.ejs"
            }).render(t);
            e.hasSucced = !1;
            var s = 0,
            r = setInterval(function() {
                return s > 450 ? (clearInterval(r), console.log("网络异常"), e.panel.setContent(n), e.panel.setWidth(520), o("#netError").show(), void o(".j_retry_polling").on("click",
                function() {
                    e.CheckStatus(e, a)
                })) : (o.ajax({
                    method: "POST",
                    url: "/ajax/reward/CheckStatus",
                    data: a,
                    success: function(s) {
                        if (!e.hasSucced) switch (e.VotePopup.resetSigns(), s.code) {
                        case 0:
                            e.hasSucced = !0;
                            var i = {
                                balance: 0
                            };
                            e.VotePopup.loadVotePanel(e, i, 3, {
                                monthVisibility: "hidden",
                                recVisibility: "hidden"
                            }),
                            e.VotePopup.renderRewardPopup(e, i, t);
                            var c = o("#rewardPopup").find(".no-limit-wrap");
                            c.hide();
                            var d = c.siblings(".vote-complete");
                            d.show(),
                            d.find(".post-num").text(e.VotePopup.amount),
                            d.find(".fans-value").text(s.data.info),
                            s.data.monthTicketCnt > 0 && d.find(".gift").html("赠投出 " + s.data.monthTicketCnt + " 张月票，"),
                            d.on("click", ".closeBtn",
                            function() {
                                e.addNumAnimate(o(".rewardNum"), e.VotePopup.amount, e.VotePopup.expNum)
                            }),
                            o("#scrollDiv ul").append('<li><em class="money"></em><a href="//me.qidian.com/Index.aspx" target="_blank" title=' + userName + ">" + userName + "</a><span>打赏了</span>" + amount + "起点币</li>"),
                            clearInterval(r),
                            o(".lbf-panel .lbf-icon-close").show();
                            break;
                        case 1052:
                            e.panel.setContent(n),
                            o("#rewardError").show(),
                            o(".lbf-panel .lbf-icon-close").show(),
                            e.panel.setToCenter(),
                            e.panel.setWidth(520),
                            clearInterval(r);
                            break;
                        case 1053:
                            e.panel.setContent(n),
                            e.panel.setWidth(520),
                            o("#loading").show(),
                            e.panel.setToCenter(),
                            o(".lbf-icon-close").on("click",
                            function() {
                                clearInterval(r)
                            }),
                            o(".lbf-panel .lbf-icon-close").show();
                            break;
                        case 1054:
                            e.panel.setContent(n),
                            e.panel.setWidth(520),
                            o("#noBalance").show(),
                            e.panel.setToCenter(),
                            o(".lbf-panel .lbf-icon-close").show(),
                            clearInterval(r);
                            break;
                        case 2009:
                            break;
                        case 1e3:
                            e.panel.close(),
                            f && f.showLoginPopup && f.showLoginPopup(),
                            clearInterval(r);
                            break;
                        default:
                            e.checkBadPaymentNoCode(s, a, 4, "打赏"),
                            o(".lbf-panel .lbf-icon-close").show(),
                            clearInterval(r)
                        }
                    }
                }), void s++)
            },
            2e3);
            e.payAndSubTimer = r
        },
        backToQuickPay: function() {
            this.payment.showQuickPayAlert("支付并打赏", balance, amount, "打赏"),
            clearInterval(this.payment.payAndSubTimer)
        },
        getUserFansInfo: function() {
            var e = this;
            c.get("cmfuToken") && o.ajax({
                type: "GET",
                url: "/ajax/userInfo/GetUserFansInfo",
                data: {
                    bookId: e.bookId
                },
                success: function(e) {
                    if (0 === e.code) {
                        var a = o("#loginIn"),
                        t = e.data,
                        n = (t.userId, t.userLevel),
                        s = t.avatar,
                        r = t.rank,
                        i = t.levelLnterval,
                        c = t.isFans;
                        a.find("img").attr("src", s),
                        a.find(".user-level").addClass("lv" + n).text(n),
                        a.find(".red").html(r),
                        a.find("#Lnterval").html(i);
                        o("#userLevel").text();
                        1 == c ? o("#haveLv").removeClass("hidden") : o("#noLv").removeClass("hidden")
                    }
                }
            })
        },
        myCommentData: function() {
            var e = this,
            a = g_data.pageJson;
            o.ajax({
                type: "GET",
                url: "/ajax/comment/personal",
                data: {
                    bookId: e.bookId
                },
                success: function(e) {
                    if (0 === e.code) {
                        if (o("#myCommentWrap").children().remove(), 0 != e.data.length) {
                            var t = new l({
                                url: "/ejs/qd/js/book_details/myComment.0.5.ejs"
                            }).render(e, a);
                            o("#myCommentWrap").append(t)
                        }
                    } else o("#myCommentWrap").children().remove().end().append('<div class="error-wrap"><p>我的评价加载失败</p></div>')
                }
            })
        },
        getBookScore: function() {
            var a = this,
            t = g_data.pageJson;
            o.ajax({
                type: "GET",
                url: "/ajax/comment/index",
                data: {
                    bookId: a.bookId,
                    pageSize: 15
                },
                success: function(n) {
                    function s() {
                        r = u.split("."),
                        o("#score1").html(r[0]),
                        o("#score2").html(r[1])
                    }
                    o("#commentWrap").find(".load-score").remove().end().children().show();
                    var r, i = n.data,
                    c = o("#j_bookScore"),
                    d = o("#j_userCount");
                    if ("" != i.rate) {
                        var u = i.rate.toString(),
                        p = i.userCount;
                        p >= 10 ? (s(), d.find("span").html(p)) : (c.html("<b>暂无评分</b>"), d.html("少于10人评价"))
                    }
                    if (a.userScore = i.iRateStar, o("#scoreBtn").attr("data-score", a.userScore), 0 != n.code && o("#commentWrap").children().remove().end().append('<div class="error-score"><h3>评分获取失败</h3></div>'), 0 == a.getBookScoreHasLoaded) {
                        var m = {};
                        m = n,
                        a.userComment = m;
                        var h = new l({
                            url: "/ejs/qd/js/book_details/userComment.0.6.ejs"
                        }).render(m, t);
                        o("#userCommentWrap .la-ball-pulse").remove(),
                        o("#userCommentWrap").append(h),
                        a.PagiNation(),
                        e.async("../component/jquery.raty.min.0.1.js",
                        function() {
                            o("#scoreBtn").find("img").remove(),
                            o.fn.raty.defaults.path = g_data.staticPath + "/images/book_details",
                            o("#scoreBtn").raty({
                                width: 116,
                                targetType: "number",
                                click: function(e) {
                                    a.userScore = e
                                },
                                score: function() {
                                    return o(this).attr("data-score")
                                }
                            })
                        }),
                        a.getBookScoreHasLoaded = !0
                    }
                }
            })
        },
        getSortCommentList: function(e, a) {
            function t() {
                o("#userCommentWrap").find(".la-ball-pulse, .comment-list").remove(),
                o("#userCommentWrap").append('<div class="comment-list"><div class="no-data"><span></span><p>还没有评价<i>&#183;</i>快来抢沙发</p></div></div>')
            }
            var n = this,
            s = o(e.currentTarget);
            s.addClass("act").siblings().removeClass("act");
            var r = o("#sortBox a.act").data("order"),
            i = g_data.pageJson;
            o.ajax({
                type: "GET",
                url: "/ajax/comment/info",
                timeout: 5e3,
                data: {
                    pageIndex: a,
                    pageSize: 15,
                    orderBy: r,
                    bookId: n.bookId
                },
                success: function(e) {
                    if (0 === e.code) if ("" != e.data) {
                        n.userComment = e;
                        var a = new l({
                            url: "/ejs/qd/js/book_details/userComment.0.6.ejs"
                        }).render(n.userComment, i);
                        o("#commentList, #userCommentWrap #commentList").remove(),
                        o("#userCommentWrap").append(a),
                        n.PagiNation()
                    } else t();
                    else t()
                },
                error: function(e, a) {
                    t()
                }
            })
        },
        PagiNation: function() {
            var e = this;
            new r({
                container: "#page-container",
                startPage: 1,
                endPage: parseInt(o("#page-container").attr("data-pageMax")),
                page: parseInt(o("#page-container").attr("data-page")),
                isShowJump: !0,
                headDisplay: 1,
                tailDisplay: 1,
                prevText: "&lt;",
                nextText: "&gt;",
                events: {
                    "change:page": function(a, t) {
                        e.getSortCommentList(a, t)
                    }
                }
            })
        },
        unfoldComment: function(e) {
            var a = o(e.currentTarget);
            a.parent().css({
                height: "auto",
                overflow: "auto"
            }).end().hide()
        },
        unfoldAuthorInfo: function(e) {
            var a = o(e.currentTarget);
            a.parent().css({
                maxHeight: "none",
                overflow: "auto"
            }).end().hide()
        },
        discussList: function() {
            var e = this,
            a = g_data.pageJson,
            t = {};
            o.ajax({
                type: "GET",
                url: "/ajax/book/GetBookForum",
                data: {
                    bookId: e.bookId,
                    chanId: g_data.chanId,
                    pageSize: 15
                },
                success: function(e) {
                    if (o("#userDiscuss").find(".la-ball-pulse").remove(), 0 === e.code) {
                        var n = [];
                        t.discuss = e.data,
                        o("#J-discusCount").html("(" + e.data.threadCnt + "条)");
                        for (var s = 0; s < e.data.threadList.length; s++) {
                            n[s] = e.data.threadList[s].content;
                            var r = n[s].replace(/\[fn=(\d+)\]/g, "<img src=//c.pingba.qidian.com/images/newface/f1/$1.png>"),
                            i = r.replace(/\[fn=(\d+)_(\d+)\]/g, "<img src=//c.pingba.qidian.com/images/newface/f$1/$2.gif>");
                            e.data.threadList[s].content = i
                        }
                    }
                    var c = new l({
                        url: "/ejs/qd/js/book_details/userDiscuss.0.10.ejs"
                    }).render(e, a);
                    o("#userDiscuss").append(c)
                }
            })
        },
        fansRankList: function() {
            var e = this,
            a = g_data.pageJson;
            o.ajax({
                type: "GET",
                url: "/ajax/book/GetFansRank",
                data: {
                    bookId: e.bookId
                },
                success: function(e) {
                    var t = new l({
                        url: "/ejs/qd/js/book_details/fansRank.0.6.ejs"
                    }).render(e, a);
                    o("#fansRankWrap").find(".la-ball-pulse").remove().end().append(t)
                }
            })
        },
        topFansList: function() {
            var e = this,
            a = g_data.pageJson;
            o.ajax({
                type: "GET",
                url: "/ajax/book/getFansHall",
                data: {
                    bookId: e.bookId
                },
                success: function(e) {
                    var t = new l({
                        url: "/ejs/qd/js/book_details/fansHall.0.4.ejs"
                    }).render(e, a);
                    o("#topFansWrap").find(".la-ball-pulse").remove().end().append(t)
                }
            })
        },
        switchTicket: function() {
            var e = o("#ticket-Tab a"),
            a = o("#ticket-wrap");
            e.on("click",
            function() {
                o(this).addClass("act").siblings().removeClass("act"),
                a.find(".ticket").eq(e.index(this)).show().siblings().hide()
            })
        },
        workSlides: function() {
            new d({
                selector: "#workSlides .nav a",
                classAdd: "active",
                animation: "translate",
                autoTime: 3e3,
                duration: 300,
                hoverStop: !0,
                container: o("#workSlides .arrows"),
                onSwitch: function(e) {
                    e.each(function() {
                        var e = o(this).find("img")[0];
                        e && !e.src && (e.src = o(e).attr("data-src"))
                    })
                }
            }),
            o("#workSlides .next").click()
        },
        showHonorList: function() {
            var e, a = null;
            o("#honor strong, #moreHonorWrap").mouseenter(function() {
                clearTimeout(a),
                e = setTimeout(function() {
                    o("#moreHonorWrap").fadeIn(200)
                },
                200)
            }),
            o("#honor,#moreHonorWrap").mouseleave(function() {
                clearTimeout(e),
                a = setTimeout(function() {
                    o("#moreHonorWrap").stop().fadeOut(200)
                },
                200)
            })
        },
        showRecTip: function(e) {
            var a = o(e.currentTarget);
            a.next("cite").fadeIn()
        },
        hideRecTip: function(e) {
            var a = o(e.currentTarget);
            a.next("cite").stop().fadeOut()
        },
        switchTab: function(e) {
            var a = o(e.currentTarget),
            t = a.index();
            a.hasClass("j_discussion_block") || (a.addClass("act").siblings().removeClass("act"), 0 == t ? (o(".book-content-wrap").removeClass("hidden"), o(".catalog-content-wrap").addClass("hidden"), history.replaceState ? history.replaceState(null, "", location.pathname + location.search) : location.hash = "info") : (o(".book-content-wrap").addClass("hidden"), o(".catalog-content-wrap").removeClass("hidden"), location.hash = "Catalog"))
        },
        evaluatePopup: function(a) {
            var t = this,
            n = o(a.currentTarget),
            s = new l({
                url: "/ejs/qd/js/book_details/evaluatePopup.0.3.ejs"
            }).render(),
            r = new u({
                drag: !1,
                headerVisible: !1,
                width: 520,
                footerVisible: !1,
                content: s,
                events: {
                    close: function() {
                        e.async("../component/jquery.raty.min.0.1.js",
                        function() {
                            o("#scoreBtn").find("img").remove(),
                            o.fn.raty.defaults.path = g_data.staticPath + "/images/book_details",
                            o("#scoreBtn").raty({
                                width: 116,
                                targetType: "number",
                                click: function(e) {
                                    t.userScore = e
                                },
                                score: function() {
                                    return o("#scoreBtn").data("score", t.iRateStar),
                                    o(this).attr("data-score")
                                }
                            })
                        }),
                        this.close()
                    }
                }
            });
            r.confirm(),
            this.panel = r,
            e.async("../component/jquery.raty.min.0.1.js",
            function() {
                o.fn.raty.defaults.path = g_data.staticPath + "/images/book_details",
                o("#starBig").raty({
                    width: 210,
                    target: "#hint",
                    targetKeep: !0,
                    score: function() {
                        return o(this).attr("data-score", t.userScore),
                        o(this).data("score")
                    }
                })
            }),
            1 == n.data("comment") && 0 == t.userScore && o("#hint").html(""),
            t.switchTextAreaColor()
        },
        sendCommentError: function(e) {
            o(".warning-tip").remove(),
            o("#evaStarWrap").append('<div class="warning-tip">' + e + "</div>"),
            o(".warning-tip").animate({
                top: 0
            },
            500)
        },
        sendComment: function(e) {
            var a, t = this,
            n = o(e.currentTarget),
            s = o("#starBig input").val(),
            r = o("#evaMsgText").val(),
            i = o("#userLevel").html(),
            c = o("#myUserIcon img").attr("src"),
            d = o("#evaMsgText").data("clear");
            "" != s ? (t.loading.startLoading(n,
            function() {
                return a
            },
            200), 0 == d && (r = null), o.ajax({
                type: "POST",
                url: "/ajax/comment/create",
                data: {
                    bookId: t.bookId,
                    fanLevel: i,
                    star: s,
                    comment: r || "",
                    userIcon: c
                },
                success: function(e) {
                    a = !0,
                    t.loading.clearLoading(n);
                    var o = e.code;
                    switch (o) {
                    case 0:
                        t.panel.close(),
                        new g({
                            content: '<div class="simple-tips"><span class="iconfont success">&#xe61d;</span><h3>评价提交成功</h3></div>'
                        }).success();
                        var d = e.data.createTime,
                        l = e.data.rateId,
                        u = {
                            data: {
                                userIcon: c,
                                fanLevel: i,
                                like: 0,
                                rateId: l,
                                nickName: userName,
                                star: s,
                                comment: r,
                                time: d
                            }
                        };
                        t.showMyComment(u);
                        break;
                    case 1016:
                        t.sendCommentError("保存失败，请重新保存");
                        break;
                    default:
                        t.sendCommentError(e.msg)
                    }
                }
            })):
            t.sendCommentError("您还没有输入自己的评价或尚未评分")
        },
        showMyComment: function(e) {
            o("#myCommentWrap").children().remove();
            var a = g_data.pageJson,
            t = new l({
                url: "/ejs/qd/js/book_details/myComment.0.5.ejs"
            }).render(e, a);
            o("#myCommentWrap").append(t)
        },
        clearEvaText: function(e) {
            var a = o(e.currentTarget),
            t = a.data("clear");
            0 == t && (a.val(""), a.text(""), a.data("clear", "1")),
            new p({
                selector: "#evaMsgText"
            }).plug(m, {
                counter: "#evaCounter",
                countDirection: "up",
                strictMax: !0,
                maxCount: 350
            })
        },
        showVotePopup: function(e) {
            var a = o(e.currentTarget);
            this.VotePopup.getVoteData(a.data("showtype"), o("#userLevel").text())
        },
        isShowRewardPopup: function(e) {
            var a = this,
            t = {};
            t = g_data.pageJson;
            var n = t.isSign;
            0 == n ? (new g({
                content: '<div class="simple-tips"><p>非签约作品不能进行打赏</p><p>建议使用推荐票支持本书</p></div>'
            }).success(), o(".lbf-overlay").hide()) : a.showVotePopup(e)
        },
        jumpSubscribe: function(e) {
            var a = this,
            t = o(e.currentTarget);
            if ("pro" == g_data.envType) var n = "";
            else var n = g_data.envType;
            var s = "//" + n + "book.qidian.com/subscribe/" + a.bookId;
            t.attr("href", s),
            t.attr("target", "_blank")
        },
        downloadPopup: function() {
            var e = g_data.pageJson,
            a = b("/ejs/qd/js/book_details/downloadPopup.0.2.ejs", e),
            t = new u({
                drag: !1,
                headerVisible: !1,
                width: 520,
                footerVisible: !1,
                content: a
            });
            t.confirm()
        },
        addToBookShelf: function(e) {
            h.addToBookShelf(e, "blue-btn", "in-shelf")
        },
        commentIsLogin: function(e) {
            var a = this;
            c.get("cmfuToken") ? a.evaluatePopup(e) : f.showLoginPopup()
        },
        fansRollList: function() {
            e.async("../component/jq_scroll.0.1.js",
            function() {
                o("#scrollDiv").Scroll({
                    line: 1,
                    speed: 500,
                    timer: 3e3
                })
            })
        },
        getReadStatus: function(e) {
            var a = o(".J-getJumpUrl"),
            t = o(a).data("firstchapterjumpurl");
            a.attr("href", t),
            o.ajax({
                method: "GET",
                url: "/ajax/book/GetReadStatus",
                data: {
                    bookId: e.bookId
                },
                success: function(e) {
                    if (0 === e.code) {
                        if (t = e.data.jumpurl, isInBookShelf = e.data.isInBookShelf, status = e.data.status, "" != t) {
                            var n = o("#readBtn");
                            e.data.hasRead && (a.attr("href", t), n.text("继续阅读"), n.attr("data-eid", "qd_G04"), n.data("eid", "qd_G04"), window.readTrackHtml = '<div class="reading-track mb40"><a class="read-progress" href="' + e.data.readChapterUrl + '" target="_blank" data-eid="qd_G54"><span>你已读至</span><i class="progress-name">' + e.data.readProgress + '</i><em class="iconfont">&#xe621;</em></a></div>', o(".volume-wrap").length > 0 && (o(".catalog-content-wrap").prepend(window.readTrackHtml), window.readTrackHtml = null))
                        }
                        1 == isInBookShelf && o("#addBookBtn").text("已在书架").addClass("in-shelf")
                    }
                }
            })
        },
        addPraise: function(e) {
            var a = this;
            if (0 != a.zanComplete) return ! 1;
            a.zanComplete = 1;
            var t = o(e.currentTarget),
            n = t.find("b"),
            s = t.data("rateid"),
            r = parseInt(t.find("b").html()),
            i = t.data("islike"),
            c = "";
            c = 0 == i ? 1 : 0,
            o.ajax({
                type: "POST",
                url: "/ajax/comment/star",
                data: {
                    bookId: a.bookId,
                    rateId: s,
                    status: c
                },
                success: function(e) {
                    0 != e.code ? (new g({
                        content: '<div class="simple-tips"><span class="iconfont error">&#xe61e;</span><h3>' + e.msg + "</h3></div>"
                    }).error(), o(".lbf-overlay").hide()) : 0 == i ? (n.html(r + 1), n.parent(".zan").addClass("act"), t.data("islike", 1)) : (n.html(r - 1), n.parent(".zan").removeClass("act"), t.data("islike", 0))
                }
            }),
            setTimeout(function() {
                a.zanComplete = 0
            },
            500)
        },
        switchTextAreaColor: function() {
            o("textarea").focus(function() {
                o(this).css("color", "#111")
            }).blur(function() {
                o(this).css("color", "#666")
            })
        },
        reportPageId: function(e) {
            var a, t = this,
            n = o(e.currentTarget);
            a = "qd_G15" == n.data("eid") ? "qd_P_xiangqing": "qd_P_mulu",
            t.reportBookInfoEvent(e, a)
        },
        reportBookInfoEvent: function(e, a) {
            s.send(e, {
                pid: a
            })
        },
        switchDiscussComment: function(e) {
            var a = o(e.currentTarget),
            t = o("#userDiscuss"),
            n = o("#userCommentWrap");
            a.addClass("act"),
            a.siblings("span").removeClass("act"),
            a.hasClass("j_godiscuss") ? (o(".sort-box").hide(), o(".j_commentBtn").addClass("hidden"), o(".j_forumBtn").removeClass("hidden"), t.show(), n.hide(), o(".user-commentWrap").data("l1", "8")) : (o(".sort-box").show(), o(".j_commentBtn").removeClass("hidden"), o(".j_forumBtn").addClass("hidden"), n.show(), t.hide(), o(".user-commentWrap").data("l1", "7"))
        },
        showFlashOp: function() {
            var e = g_data.gamesFlashOp,
            a = o(".games-op-wrap .left-game"),
            t = o(".games-op-wrap .right-game"),
            n = o(".right-op-wrap");
            2 == e.middleLeft1 && (a.find(".la-ball-pulse").remove(), a.find("embed").addClass("fix"), a.find("a").css("display", "inline")),
            2 == e.middleLeft2 && (t.find(".la-ball-pulse").remove(), t.find("embed").addClass("fix"), t.find("a").css("display", "inline")),
            2 == e.middleRight && (n.find(".la-ball-pulse").remove(), n.find("embed").addClass("fix"), n.find("a").css("display", "inline"))
        },
        showTopBg: function() {},
        closeTopOp: function(e) {
            var a = (o(e.currentTarget), o("#j-topBgBox")),
            t = o("#j-topHeadBox"),
            n = o(".crumbs-nav");
            a.length > 0 && (a.fadeIn(), 1 == g_data.isRecom ? n.removeClass("top-op").addClass("rec-book") : n.removeClass("top-op"), t.stop().stop().fadeOut(), t.find(".close").stop().fadeOut(), t.find(".op-tag").stop().fadeOut());
            var s = (new Date).getTime() % 864e5,
            r = 864e5 - s;
            c.set("hideTopOp", "1", "", ".qidian.com", r)
        },
        showTopOp: function(e) {
            var a = (o(e.currentTarget), o("#j-topBgBox")),
            t = o("#j-topHeadBox"),
            n = o(".crumbs-nav");
            t.stop().fadeIn(),
            t.find(".close").stop().fadeIn(),
            t.find(".op-tag").stop().fadeIn(),
            a.fadeOut(),
            1 == g_data.isRecom ? n.addClass("top-op").removeClass("rec-book") : n.addClass("top-op"),
            c.set("hideTopOp", "", "", ".qidian.com")
        },
        closeCurrentPanel: function() {
            this.VotePopup.closeCurrentPanel()
        }
    })
});

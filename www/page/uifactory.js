"use strict";

define(["jquery", "main", "utils", "ReadingRecord"], function ($, app, utils, ReadingRecord) {

  return {
    buildCatalogView: function buildCatalogView(catalog, chapterItemClickEvent, parent, onBuildChapterElement) {
      var _this = this;

      var idPrefix = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";


      var tv = $(".template .chapter-volume-item");
      var tc = $(".template .chapter-item");

      if (catalog.length > 0 && "chapters" in catalog[0]) {
        return catalog.map(function (v, index) {
          var nv = tv.clone();
          var idp = idPrefix + index;
          var headid = "head" + idp;
          var contentid = "content" + idp;
          nv.find(".chapter-list").attr("id", contentid);
          nv.find(".volume-name").text(v.name).attr("data-target", '#' + contentid).attr("data-parent", parent).attr("id", headid);
          nv.find(".chapter-list").append(_this.buildCatalogView(v.chapters, chapterItemClickEvent, "#" + contentid, onBuildChapterElement, idp)).on("shown.bs.collapse", function (e) {
            e.stopPropagation();
            document.getElementById(headid).scrollIntoView();
          });
          return nv;
        });
      } else return catalog.map(function (chapter) {
        var nc = tc.clone();
        nc.text(chapter.title);
        nc.data("chapter", chapter);
        nc.click(chapterItemClickEvent);
        if (onBuildChapterElement) onBuildChapterElement(chapter, nc);
        return nc;
      });
    }
  };
});
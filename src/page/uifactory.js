"use strict"
define(["jquery", "main", "utils", "ReadingRecord"], function($, app, utils, ReadingRecord){

  return {

    // 构造目录页面
    buildCatalogView(catalog, chapterItemClickEvent, parent, onBuildChapterElement, idPrefix=""){

      let tv = $(".template .chapter-volume-item");
      let tc = $(".template .chapter-item");

      if(catalog.length > 0 && "chapters" in catalog[0]){
        // volume
        return catalog.map((v, index) => {
          let nv = tv.clone();
          let idp = idPrefix + index;
          let headid = `head${idp}`;
          let contentid = `content${idp}`;
          nv.find(".chapter-list")
            .attr("id", contentid)
          nv.find(".volume-name")
            .text(v.name)
            .attr("data-target", '#' + contentid)
            .attr("data-parent", parent)
            .attr("id", headid);
          nv.find(".chapter-list")
            .append(
              this.buildCatalogView(v.chapters, chapterItemClickEvent, "#"+contentid, onBuildChapterElement, idp)
            )
            .on("shown.bs.collapse", e => {
              e.stopPropagation();
              document.getElementById(headid).scrollIntoView();
            });
          return nv;
        });
      }
      else
        return catalog.map(chapter => {
          const nc = tc.clone();
          nc.text(chapter.title);
          nc.data("chapter", chapter);
          nc.click(chapterItemClickEvent);
          if(onBuildChapterElement)
            onBuildChapterElement(chapter, nc);
          return nc;
        });
      }
  };

});

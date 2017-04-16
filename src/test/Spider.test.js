define(["util", "Spider"], function(util, Spider){

  class SpiderTest{

    constructor(test){
      this.test = test;
    }

    doTest(){
      this.htmlTest();
    }

    htmlTest(){
      let config = {
        "request": {
          "url": "http://se.qidian.com/?kw={keyword}",
          "timeout": 5
        },
        "response": {
          "type": "array",
          "element": "#result-list li[data-rid]",
          "children": {
              "name": ".book-mid-info>h4>a",
              "author": ".book-mid-info .author>a.name",
              "catagory": ".book-mid-info .author a:nth-child(4)",
              "complete": {
                "type": "boolean",
                "element": ".book-mid-info .author span:last-child",
                "true": "完本",
                "false": "连载中"
              },
              "coverImg": ".book-img-box img",
              "introduce": ".book-mid-info .intro",
              "lastestChapter": ".book-mid-info .update>a",
              "detailLink": ".book-mid-info>h4>a",
              "bookid": {
                "type": "string",
                "element": ".book-mid-info>h4>a",
                "attribute": "data-bid"
              }
            }
        }
      };
      let s = new Spider();
      let result = s.get(config, {keyword: "神墓"});
      result.then(r => this.test.log(r));
    }
  }

  return SpiderTest;
});

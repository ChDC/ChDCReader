## TODO

* 添加更多书源
* 书源检查
* 缓存封面
* HTTP 超时时间设置
* 全网（在所有书源中）搜索书籍+百度搜索
* 资源更新之后显示更新的内容记录



## BUG

* 弹出框响应 Android 的返回键

* 新添加未看的书籍换源的时候会有死递归调用

  ```
  Uncaught RangeError: Maximum call stack size exceeded
      at RegExp.[Symbol.replace] (native)
      at String.replace (native)
      at Function.camelCase (file:///E:/Project/ChDCNovelReader/App/NovelReader/www/lib/jquery-3.1.1/jquery.min.js:2:2649)
      at U.get (file:///E:/Project/ChDCNovelReader/App/NovelReader/www/lib/jquery-3.1.1/jquery.min.js:3:1068)
      at r.fn.init.<anonymous> (file:///E:/Project/ChDCNovelReader/App/NovelReader/www/lib/jquery-3.1.1/jquery.min.js:3:2589)
      at S (file:///E:/Project/ChDCNovelReader/App/NovelReader/www/lib/jquery-3.1.1/jquery.min.js:3:534)
      at r.fn.init.data (file:///E:/Project/ChDCNovelReader/App/NovelReader/www/lib/jquery-3.1.1/jquery.min.js:3:2539)
      at Infinitelist.onNewChapterItem [as onNewListItem] (file:///E:/Project/ChDCNovelReader/App/NovelReader/www/page/readbook.page.js:227:31)
      at next (file:///E:/Project/ChDCNovelReader/App/NovelReader/www/js/infinitelist.js:269:18)
      at file:///E:/Project/ChDCNovelReader/App/NovelReader/www/js/infinitelist.js:288:25
  ```

  ​

## TEST

* 一分钟之内不能刷新目录
* Book.getChapters
* Book.cacheChapters
* Book.getCountlessChapters

## 章节加载策略

先加载正在读的这一章节，然后加载后面的章节直到长度满足要求，最后加载前面的章节直到长度满足要求；

之后，当滑动的时候，检查当前的长度是否满足要求，不满足则继续加载直到满足要求未知。



## 库修改

### Bootstrap

#### 弹出框垂直居中


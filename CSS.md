## 基础

### CSS 中的优先权（特殊性）

* 在同等条件下， ID 选择器比类选择器具有更大的优先权（特殊性），类选择器比标签选择器有更大的优先权。

  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <style type="text/css">
        p{color: white;}
        #text{color: red;}
        .bule{color: blue;}
      </style>
    </head>

    <body>
      <p id='text' class='blue'>test1</p>
    </body>
  </html>
  ```

  如上，当一个标签同时有 ID  和 class 时，优先使用 ID 定义的样式。所以结果字体颜色为红色。


* 在选择器优先权（特殊性）相同的情况下，有如下优先级：内联样式（style 属性） > 内部样式（style 标签） > CSS 文件

* 不管选择器特殊性或样式的定义位置如何，`!important` 命令都具有最大的优先权。

  ```css
  div{
    	color: red!important; /* 优先于一切 */
  }
  ```

  注意：`!important` 必须位于属性值和分号之间。

### 通用选择器

通用选择器可以和其他选择器一起使用，用来对某个元素的所有后代应用样式。

```css
.news *{
  color: red;
}
```

### 继承和层叠

继承和层叠是两个不同的概念。

继承指的是给某个元素设置了属性之后，其每个后代元素（子孙元素）也会拥有该属性。如给 body 设置 color 为 red 之后，页面的所有字体颜色都变成了红色。

但，并不是所有的元素都具有继承特性。下面的属性不具有继承特性：

* 边框属性 border
* 边界属性 margin
* 补白属性 padding
* 背景属性 background
* 定位属性 position
* 布局属性 left, right, top, bottom
* 尺寸属性 width, height

层叠指的是多个样式应用到同一个元素上。

### 样式表的组织

最好将 CSS 分为三个部分：处理基本布局、处理版式和设计修饰。

可以分为三个或多个文件，这样当布局确定下来之后，就很少需要修改布局样式表了。

不过，多一个文件就意味着多一次额外的请求调用。

## 属性的简写

### 颜色

颜色有下面表现方式：

* RGB 函数


* 十六进制数字

* 颜色名称

  ```css
  p {
    color: RGB(125, 0, 255);
    background-color: RGB(25%, 25%, 25%);
  }

  p {
    color: #121212;
    background-color: red;
  }
  ```

* 用户系统色盘值

  ```css
  p {
    color: background; /* 桌面颜色 */
    background-color: windowtext;
  }
  ```


### 单位值的缩写

当数值为0的时候可以省略单位不写。

### 内外边距的简写

内外边距根据上、右、下、左的顺时针方向可以有下面4种简写形式：

* `property: value1` 所有边都是一个值
* `property: value1 value2` top 和 bottom 是 value1，left 和 right 是 value2
* `property: value1 value2 value3` top 是 value1，left 和 right 是 value2，bottom 是 value3

### CSS 单位

### 绝对单位

* in 英尺
* cm 厘米
* mm 毫米
* pt 磅
* pc pica

### 相对单位

* px 像素
* em 一个单位的 em 等于字体的 font-size 属性设置的单位大小。
* ex 根据字体中小写字母 x 来确定
* 百分比

### URL

相对 URL 的参考物是当前的 CSS 文件所在的位置。

# 字体

## 文本对齐

注意：需要设置定位的父子元素要设置固定的尺寸。

### 文本水平对齐

```css
p {
  text-align: center;
}
```

### 文本垂直对齐

```css
p {
  display: table-cell;
  vertical-align: middle;
}
```

vertical-align 属性不支持块级元素对齐，只有当块级元素显示为单元格的时候才有效。




## 注意

* z-index 仅作用于 position 属性值为 relative 和 absolute 的元素。不作用于 fixed 的元素。


# vscode-stock
vscode 股票插件

### 1. 添加股票代码到自选
> 股票代码要标准, 前面需含有前缀 sh, sz, hk ...内容。

![](https://github.com/yujintang/imageHosting/blob/master/stockAdd.gif?raw=true)

### 2. 添加高低价位预警

![](https://github.com/yujintang/imageHosting/blob/master/stockSetWarn.gif?raw=true)

### 配置文件
* super-stock.favorite: Key 为股票代码, value[0]为低报警价、value[1]为高报警价
* super-stock.interval: 股价刷新率 默认 2s
```json
{
      "super-stock.favorite": {
        "sh000001": ["-","-"], 
    },
    "super-stock.interval": 2,
}
```

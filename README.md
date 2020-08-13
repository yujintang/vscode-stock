# super-stock：vscode股票插件


> GitHub地址: [https://github.com/yujintang/vscode-stock](https://github.com/yujintang/vscode-stock)



- 3月8日，巴菲特：我活了89岁，只见过一次美股熔断。
- 3月9日，巴菲特：我活了89岁，只见过两次美股熔断。
- 3月12日，巴菲特：我活了89岁，只见过三次美股熔断。
- 3月16日，巴菲特：我活了89岁，只见过四次美股熔断，我太年轻了…
- 3月18日，我…


**今年股市这么刺激，咱不能只顾着码代码啊，顺便瞅一眼行情，下面我介绍一款vscode股票插件，来方便我们盯盘。**


### 1. vscode插件商店，找到super-stock，进行安装。
![image.png](https://cdn.nlark.com/yuque/0/2020/png/109900/1593330719892-178d12f5-9799-44a8-86d8-c8a7eb6fda40.png#align=left&display=inline&height=98&margin=%5Bobject%20Object%5D&name=image.png&originHeight=195&originWidth=479&size=18449&status=done&style=none&width=239.5)

### 2. vscode 左侧会自动添加`FAVORITE STOCKS`一栏，用于展示所选股票
![image.png](https://cdn.nlark.com/yuque/0/2020/png/109900/1593330878423-f425d0f9-627e-4663-a48f-1500549c9abc.png#align=left&display=inline&height=116&margin=%5Bobject%20Object%5D&name=image.png&originHeight=232&originWidth=788&size=27429&status=done&style=none&width=394)


### 3. 添加股票代码到自选
> 股票代码需按照新浪财经代码规范，sh, sz, hk gb_ 前缀开头，以下是几个典型股票代码示例

| 上证指数 | sh000001 |
| --- | --- |
| 恒生指数 | hkHSI |
| 道琼斯 | gb_$dji |
| 贵州茅台 | sh600519 |
| 谷歌 | gb_goog |

![Kapture 2020-06-28 at 16.58.11.gif](https://cdn.nlark.com/yuque/0/2020/gif/109900/1593334710160-497ddbd0-496e-43a1-b1b9-b6fa90c86c24.gif#align=left&display=inline&height=249&margin=%5Bobject%20Object%5D&name=Kapture%202020-06-28%20at%2016.58.11.gif&originHeight=458&originWidth=1000&size=590520&status=done&style=none&width=543)


### 4. 高低价位预警
![stockSetWarn.gif](https://cdn.nlark.com/yuque/0/2020/gif/109900/1593335367994-f972fc01-1ca5-4b9c-b5f8-896fc21f356d.gif#align=left&display=inline&height=277&margin=%5Bobject%20Object%5D&name=stockSetWarn.gif&originHeight=404&originWidth=786&size=120854&status=done&style=none&width=538)


### 5. 配置文件


- super-stock.favorite: Key 为股票代码, value[0]为低报警价、value[1]为高报警价
- super-stock.interval: 股价刷新率 默认 2s
- super-stock.emoji: 股价涨跌对应的emoji表情，默认为 ["🍾️", "🍜"], 赢了香槟美女，输了关灯吃面 😂😂😂


```json
{
    "super-stock.favorite":{
        "sh000001":[
            "-",
            "-"
        ],
        "hkHSI":[
            "-",
            "-"
        ],
        "gb_$dji":[
            "-",
            "-"
        ]
    },
    "super-stock.interval":2,
        "super-stock.emoji": [
        "🍾️",
        "🍜"
    ]
}
```

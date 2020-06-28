import { workspace, TreeItem } from 'vscode';
import { sinaApi, fillString, StockInfo } from './utils';

export class StockResource {
  constructor() {
  }

  updateConfig(stocks: object) {
    const config = workspace.getConfiguration();
    const favoriteConfig = Object.assign({}, config.get('super-stock.favorite', {}), stocks);
    config.update('super-stock.favorite', favoriteConfig, true);
  }
  
  /**
   * set warnPrice
   * @param code Symbol Code
   * @param warnPrice Warn Price
   * @param flag  Warn Type that 1 is High Warn, others is low Warn
   */
  setWarnConfig(code: string, warnPrice: number, flag: Number) {
    const config = workspace.getConfiguration();
    const favoriteConfig:StockConfig = Object.assign({}, config.get('super-stock.favorite', {}));
    const updateConfig = {[code]: flag === 1 ? [favoriteConfig[code][0], warnPrice.toFixed(2)] : [warnPrice.toFixed(2), favoriteConfig[code][1]]};
    config.update('super-stock.favorite', Object.assign({}, favoriteConfig, updateConfig), true);
  }

  removeConfig(stockCode: string){
    const config = workspace.getConfiguration();
    const favoriteConfig:StockConfig = Object.assign({}, config.get('super-stock.favorite', {}));
    delete favoriteConfig[`${stockCode}`];
    config.update('super-stock.favorite', favoriteConfig, true);
  }

  async getFavorites(order: number): Promise<Array<Stock>> {
    const config = workspace.getConfiguration().get('super-stock.favorite',{});
    const result = await sinaApi(config);
    if(order !== 0){
      return result.sort(({info:{changeRate:a=0 }}, {info:{changeRate: b=0}})=>{
        return (+a >= +b) ? order * 1: order * -1;
        });
    }
    return result;
  }
}

export interface StockConfig{
  [key: string]:Array<any>;
}

export class Stock extends TreeItem {
  info: StockInfo;
  constructor(info: StockInfo) {
    super(`${+info.changeAmount >= 0 ? '❤️': '🟢'} ${fillString(info.name, 10)} ${fillString(info.changeRate + '%', 8, false)} ${fillString(info.now, 10, false)}`);
    this.info = info;
    this.tooltip = `
 公司:       ${info.name}
 代码:       ${info.code}
 成交量:   ${info.volume}股${info.amount ?  `\n 成交额:   ${info.amount}`: ''}${info.highStop ? `\n 涨停:       ${info.highStop}`: ''}${info.lowStop ? `\n 跌停:       ${info.lowStop}`: ''}
 -------------------------
 现价:       ${info.now}
 涨跌幅:   ${info.changeRate}%
 涨跌额:   ${info.changeAmount}
 今开:       ${info.open}
 昨收:       ${info.lastClose}
 -------------------------
 最高:       ${info.high}   ${info.highRate}%
 最低:       ${info.low}   ${info.lowRate}%
 -------------------------
 低价警报:  ${!isNaN(+info.lowWarn)?info.lowWarn :'-'}
 高价警报:  ${!isNaN(+info.highWarn)?info.highWarn :'-'}
    `;
  }
}


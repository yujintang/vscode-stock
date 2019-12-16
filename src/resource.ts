import * as vscode from 'vscode';
import { sinaApi, fillString, StockInfo } from './utils';

export class Resource {
  constructor() {
  }

  updateConfig(stocks: object) {
    const config = vscode.workspace.getConfiguration();
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
    const config = vscode.workspace.getConfiguration();
    const favoriteConfig:StockConfig = Object.assign({}, config.get('super-stock.favorite', {}));
    const updateConfig = {[code]: flag === 1 ? [favoriteConfig[code][0], warnPrice.toFixed(2)] : [warnPrice.toFixed(2), favoriteConfig[code][1]]};
    config.update('super-stock.favorite', Object.assign({}, favoriteConfig, updateConfig), true);
  }

  removeConfig(stockCode: string){
    const config = vscode.workspace.getConfiguration();
    const favoriteConfig:StockConfig = Object.assign({}, config.get('super-stock.favorite', {}));
    delete favoriteConfig[`${stockCode}`];
    config.update('super-stock.favorite', favoriteConfig, true);
  }

  async getFavorites(order: number): Promise<Array<Stock>> {
    const config = vscode.workspace.getConfiguration().get('super-stock.favorite',{});
    const sinaStock = await sinaApi(config);
    return sinaStock.sort((a, b)=>{
    const bool = +a.info.changeRate >= +b.info.changeRate;
    return bool ? order * 1: order * -1;
    });
  }
}

export interface StockConfig{
  [key: string]:Array<any>;
}

export class Stock extends vscode.TreeItem {
  info: StockInfo;
  constructor(info: StockInfo) {
    super(`${fillString(info.name, 10)} ${fillString(info.changeRate + '%', 10, false)} ${fillString(info.now, 12, false)}`);
    this.info = info;

    this.tooltip = `
 名字:       ${info.name}
 代码:       ${info.code}
 ---------------------
 现价:       ${info.now}
 涨跌幅:   ${info.changeRate}%
 涨跌额:   ${info.changeAmount}
 涨停:       ${info.highStop}
 跌停:       ${info.lowStop}
 今开:       ${info.open}
 最高:       ${info.high}
 最低:       ${info.low}
 昨收:       ${info.lastClose}
---------------------
 低价警报:  ${+ !isNaN(+info.lowWarn)?info.lowWarn :'-'}
 高价警报:  ${!isNaN(+info.highWarn)?info.highWarn :'-'}
    `;
  }
}


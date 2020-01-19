import { workspace, TreeItem } from 'vscode';
import { sinaApi, fillString, DigiccyInfo, huobiApi } from './utils';

export class DigiccyResource {
  constructor() {
  }

  updateConfig(digiccy: object) {
    const config = workspace.getConfiguration();
    const favoriteConfig = Object.assign({}, config.get('super-stock.favorite-digiccy', {}), digiccy);
    config.update('super-stock.favorite-digiccy', favoriteConfig, true);
  }
  
  /**
   * set warnPrice
   * @param code Symbol Code
   * @param warnPrice Warn Price
   * @param flag  Warn Type that 1 is High Warn, others is low Warn
   */
  setWarnConfig(code: string, warnPrice: number, flag: Number) {
    const config = workspace.getConfiguration();
    const favoriteConfig:DigiccyConfig = Object.assign({}, config.get('super-stock.favorite-digiccy', {}));
    const updateConfig = {[code]: flag === 1 ? [favoriteConfig[code][0], warnPrice.toFixed(2)] : [warnPrice.toFixed(2), favoriteConfig[code][1]]};
    config.update('super-stock.favorite-digiccy', Object.assign({}, favoriteConfig, updateConfig), true);
  }

  removeConfig(stockCode: string){
    const config = workspace.getConfiguration();
    const favoriteConfig:DigiccyConfig = Object.assign({}, config.get('super-stock.favorite-digiccy', {}));
    delete favoriteConfig[`${stockCode}`];
    config.update('super-stock.favorite-digiccy', favoriteConfig, true);
  }

  async getFavorites(order: number): Promise<Array<Digiccy>> {
    const config = workspace.getConfiguration().get('super-stock.favorite-digiccy',{});
    const result = await huobiApi(config);
    return result.sort(({info:{changeRate:a=0 }}, {info:{changeRate: b=0}})=>{
    return (+a >= +b) ? order * 1: order * -1;
    });
  }
}

export interface DigiccyConfig{
  [key: string]:Array<any>;
}

export class Digiccy extends TreeItem {
  info: DigiccyInfo;
  constructor(info: DigiccyInfo) {
    super(`${fillString(info.code, 10)} ${fillString(info.changeRate + '%', 8, false)} ${fillString(info.now, 12, false)}`);
    this.info = info;

    this.tooltip = `
 交易对:   ${info.code}
 ---------------------
 现价:       ${info.now}
 成交量:   ${info.amount}
 涨跌幅:   ${info.changeRate}%
 涨跌额:   ${info.changeAmount}
 今开:       ${info.open}
 最高:       ${info.high}
 最低:       ${info.low}
 ---------------------
 最高买:   ${info.ask1}  |  ${info.ask1Vol}
 最低卖:   ${info.bid1}  |  ${info.bid1Vol}
---------------------
 低价警报:  ${!isNaN(+info.lowWarn)?info.lowWarn :'-'}
 高价警报:  ${!isNaN(+info.highWarn)?info.highWarn :'-'}
    `;
  }
}


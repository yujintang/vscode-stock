import { QuickPickItem } from 'vscode';
import * as https from 'https';
import * as iconv from 'iconv-lite';
import * as stringWidth from 'string-width';
import { isArray } from 'util';
import { Stock, StockConfig, StockResource } from './stockResource';
import { DigiccyConfig, Digiccy } from './digiccyResource';
import { promises } from 'dns';

const stockMarket: { [key: string]: QuickPickItem } = {
  '沪股': {
    label: '沪股',
    detail: 'sh'
  },
  '深股': {
    label: '深股',
    detail: 'sz'
  },
  '港股': {
    label: '港股',
    detail: 'hk'
  },
  '美股': {
    label: '美股',
    detail: 'gb_'
  }
};

export { stockMarket };

const httpRequest = async (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let chunks: Array<Buffer> = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        // Sometimes the 'error' event is not fired. Double check here.
        if (res.statusCode === 200) {
          let buff = Buffer.concat(chunks);
          const contentType: String = res.headers['content-type'] || '';
          const matchCharset = contentType.match(/(?:charset=)(\w+)/) || [];
          // 转编码，保持跟响应一致
          let body = iconv.decode(buff, matchCharset[1] || 'utf8');
          resolve(body);
        } else {
          reject('网络请求错误!');
        }
      });
    });
  });
};

export function huobiApi(digiccyConfig: DigiccyConfig): Promise<Array<Digiccy>> {
  const url = 'https://api.huobi.pro/market/detail/merged?symbol=';
  const promiseArr: Array<Promise<object>> = [];
  const symbols = Object.keys(digiccyConfig);

  for (const symbol of symbols) {
    promiseArr.push(httpRequest(`${url}${symbol}`));
  }

  return new Promise(async (resolve, reject) => {
    const promiseResult: Array<any> = await await Promise.all(promiseArr).catch(e => { reject(e.message); }) || [];
    const resultArr: Array<Digiccy> = [];
    for (const i in promiseResult) {
      const { status, tick } = JSON.parse(promiseResult[i]);
      const code = symbols[i];
      let DigiccyConfig = digiccyConfig[code];
      if (!isArray(DigiccyConfig)) { DigiccyConfig = ['-', '-']; }
      if (DigiccyConfig.length < 2) { DigiccyConfig.concat(['-', '-']); }

      if (status === 'ok') {
        const resultDigiccy: DigiccyInfo = {
          code,
          lowWarn: new Number(DigiccyConfig[0]).toFixed(2),
          highWarn: new Number(DigiccyConfig[1]).toFixed(2),
          open: NumberCn(tick.open, 10, false),
          now: NumberCn(tick.close, 10, false),
          lastClose: NumberCn(tick.open, 10, false),
          high: NumberCn(tick.high, 10, false),
          low: NumberCn(tick.low, 10, false),
          amount: NumberCn(tick.amount, 10, false),
          bid1: NumberCn(tick.bid[0], 10, false),
          bid1Vol: NumberCn(tick.bid[1], 5),
          ask1: NumberCn(tick.ask[0], 10, false),
          ask1Vol: NumberCn(tick.ask[1], 5),
        };
        const changeAmount = Math.abs(+tick.close - +tick.open);
        const changeSign = (+tick.close - +tick.open) >= 0 ? '+' : '-';
        resultDigiccy.changeAmount = changeSign + NumberCn(changeAmount, 2, false),
          resultDigiccy.changeRate = changeSign + NumberCn(changeAmount/+tick.open * 100, 2, false),
          resultArr.push(new Digiccy(resultDigiccy));
      }
      resolve(resultArr);
    }
  });
}


export function sinaApi(stockConfig: StockConfig): Promise<Array<Stock>> {

  const url = 'https://hq.sinajs.cn/list=' + Object.keys(stockConfig).join(',');

  return new Promise(async (resolve, reject) => {
    const body = await httpRequest(url).catch(e => { reject(e.message); });
    if (/FAILED/.test(body)) {
      return reject(`fail: error Stock code in ${Object.keys(stockConfig)}, please delete error Stock code`);
    }
    const splitData = body.split(';\n');
    const resultArr: Array<Stock> = [];
    for (let i = 0; i < splitData.length - 1; i++) {
      const code = splitData[i].split('="')[0].split('var hq_str_')[1];
      const params = splitData[i].split('="')[1].split(',');
      if (params.length > 1) {
        let StockConfig = stockConfig[code];
        if (!isArray(StockConfig)) { StockConfig = ['-', '-']; }
        if (StockConfig.length < 2) { StockConfig.concat(['-', '-']); }

        let resultStock: StockInfo | undefined;
        if (/^(sh|sz)/.test(code)) {
          resultStock = {
            name: params[0],
            code,
            unit: 'cny',
            lowWarn: new Number(StockConfig[0]).toFixed(2),
            highWarn: new Number(StockConfig[1]).toFixed(2),
            open: new Number(params[1]).toFixed(2),
            lastClose: new Number(params[2]).toFixed(2),
            highStop: new Number(params[2] * 1.1).toFixed(2),
            lowStop: new Number(params[2] * 0.9).toFixed(2),
            now: new Number(params[3]).toFixed(2),
            high: new Number(params[4]).toFixed(2),
            low: new Number(params[5]).toFixed(2),
            volume: NumberCn(params[8], 2),
            amount: NumberCn(params[9], 2),
          };
        } else if (/^hk/.test(code)) {
          resultStock = {
            name: params[1],
            code,
            unit: 'hkd',
            lowWarn: new Number(StockConfig[0]).toFixed(2),
            highWarn: new Number(StockConfig[1]).toFixed(2),
            open: new Number(params[2]).toFixed(2),
            lastClose: new Number(params[3]).toFixed(2),
            now: new Number(params[6]).toFixed(2),
            high: new Number(params[4]).toFixed(2),
            low: new Number(params[5]).toFixed(2),
            volume: NumberCn(params[12], 2),
            amount: NumberCn(params[11], 2),
          };
        } else if (/^gb_/.test(code)) {
          resultStock = {
            name: params[0],
            code,
            unit: 'usd',
            lowWarn: new Number(StockConfig[0]).toFixed(2),
            highWarn: new Number(StockConfig[1]).toFixed(2),
            open: new Number(params[5]).toFixed(2),
            lastClose: new Number(params[26]).toFixed(2),
            now: new Number(params[1]).toFixed(2),
            high: new Number(params[6]).toFixed(2),
            low: new Number(params[7]).toFixed(2),
            volume: NumberCn(params[10], 2),
          };
        }
        if (resultStock !== undefined) {
          const { lastClose, now } = resultStock;
          const changeAmount = Math.abs(+now - +lastClose);
          const changeSign = (+now - +lastClose) >= 0 ? '+' : '-';
          resultStock.changeAmount = changeSign + new Number(changeAmount).toFixed(2),
            resultStock.changeRate = changeSign + new Number((changeAmount) / +lastClose * 100).toFixed(2),
            resultArr.push(new Stock(resultStock));
        }
      }// valid stock code
    }
    resolve(resultArr);
  });
}


/**
 * 字符串长度拼接
 * @param source 原字符串长度
 * @param length 修改后的字符串长度
 * @param left 原字符串是否靠左边
 */
export function fillString(source: string, length: number, left = true): string {
  while (stringWidth(source) >= length) {
    source = source.slice(0, source.length - 1);
  }
  const addString = '  '.repeat(length - stringWidth(source));
  if (left) {
    return source + addString;
  }
  return addString + source;
}

export interface StockInfo {
  name: string;
  code: string;
  unit: string;
  lowWarn: string;
  highWarn: string;
  open: string;
  lastClose: string;
  now: string;
  high: string;
  low: string;
  volume: string; //成交量
  amount?: string; //成交额
  highStop?: string;
  lowStop?: string;
  changeAmount?: string;
  changeRate?: string;
}

export interface DigiccyInfo {
  code: string;
  lowWarn: string;
  highWarn: string;
  open: string;
  lastClose: string;
  now: string;
  high: string;
  low: string;
  amount: string;
  bid1: string;
  bid1Vol: string;
  ask1: string;
  ask1Vol: string;
  changeAmount?: string;
  changeRate?: string;
}

export function NumberCn(inputNumber: number = 0, fixNumber: number = 2, format = true): string {
  const num = +inputNumber;
  let newFixedNumber = fixNumber;
  if (format) {
    if (num > 1000 * 10000) {
      return +(num / (10000 * 10000)).toFixed(newFixedNumber) + '亿';
    } else if (num > 1000) {
      return +(num / 10000).toFixed(newFixedNumber) + '万';
    }
  }
  return +num.toFixed(newFixedNumber) + '';
}
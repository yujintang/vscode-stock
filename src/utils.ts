import * as https from 'https';
import { workspace } from 'vscode';
import * as iconv from 'iconv-lite';
import * as stringWidth from 'string-width';
import { isArray } from 'util';
import { Stock, StockConfig } from './stockResource';


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


export function sinaApi(stockConfig: StockConfig): Promise<Array<Stock>> {
  const config = workspace.getConfiguration();
  const emojiConfig = config.get('super-stock.emoji', ["🍾️", "🍜"]);

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
            lowWarn: NumberCn(StockConfig[0], 2, false),
            highWarn: NumberCn(StockConfig[1], 2, false),
            open: NumberCn(params[1], 2, false),
            lastClose: NumberCn(params[2], 2, false),
            highStop: NumberCn(params[2]* 1.1, 2, false),
            lowStop: NumberCn(params[2]* 0.9, 2, false),
            now: NumberCn(params[3], 2, false),
            high: NumberCn(params[4], 2, false),
            low: NumberCn(params[5], 2, false),
            volume: NumberCn(params[8], 2),
            amount: NumberCn(params[9], 2),
            changeAmount:'0',
            changeRate: '0',
            emoji: emojiConfig,
          };
        } else if (/^hk/.test(code)) {
          resultStock = {
            name: params[1],
            code,
            lowWarn: NumberCn(StockConfig[0], 2, false),
            highWarn: NumberCn(StockConfig[1], 2, false),
            open: NumberCn(params[2], 2, false),
            lastClose: NumberCn(params[3], 2, false),
            now: NumberCn(params[6], 2, false),
            high: NumberCn(params[4], 2, false),
            low: NumberCn(params[5], 2, false),
            volume: NumberCn(params[12], 2),
            amount: NumberCn(params[11], 2),
            changeAmount:'0',
            changeRate: '0',
            emoji: emojiConfig
          };
        } else if (/^gb_/.test(code)) {
          resultStock = {
            name: params[0],
            code,
            lowWarn: NumberCn(StockConfig[0], 2, false),
            highWarn: NumberCn(StockConfig[1], 2, false),
            open: NumberCn(params[5], 2, false),
            lastClose: NumberCn(params[26], 2, false),
            now: NumberCn(params[1], 2, false),
            high: NumberCn(params[6], 2, false),
            low: NumberCn(params[7], 2, false),
            volume: NumberCn(params[10], 2),
            changeAmount:'0',
            changeRate: '0',
            emoji: emojiConfig
          };
        }
        if (resultStock !== undefined) {
          const { lastClose, now, high, low } = resultStock;
          resultStock.changeAmount = ((+now - +lastClose) >= 0 ? '+' : '-') + NumberCn(Math.abs(+now - +lastClose), 2, false),
          resultStock.changeRate = ((+now - +lastClose) >= 0 ? '+' : '-') + NumberCn((Math.abs(+now - +lastClose)) / +lastClose * 100, 2, false),
          resultStock.highRate = ((+high - +lastClose) >= 0 ? '+' : '-') + NumberCn((Math.abs(+high - +lastClose)) / +lastClose * 100, 2, false),
          resultStock.lowRate = ((+low - +lastClose) >= 0 ? '+' : '-') + NumberCn((Math.abs(+low - +lastClose)) / +lastClose * 100, 2, false),
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
  changeAmount: string;
  changeRate: string;
  highRate?: string;
  lowRate?: string;
  emoji: string[];
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
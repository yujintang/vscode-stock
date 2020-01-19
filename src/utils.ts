import { QuickPickItem } from 'vscode';
import * as https from 'https';
import * as iconv from 'iconv-lite';
import * as stringWidth from 'string-width';
import { isArray } from 'util';
import { Stock, StockConfig, StockResource } from './stockResource';

const stockMarket:{[key:string]:QuickPickItem} = {
  '沪股':{
    label: '沪股',
    detail: 'sh'
  },
  '深股':{
    label: '深股',
    detail: 'sz'
  },
  '港股':{
    label: '港股',
    detail: 'hk'
  },
  '美股':{
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

export function sinaApi(stockConfig: StockConfig): Promise<Array<Stock>> {

  const url = 'https://hq.sinajs.cn/list=' + Object.keys(stockConfig).join(',');

  return new Promise(async (resolve, reject) => {
    const body = await httpRequest(url)
    .catch(e=>{
      reject(e.message);
    });
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

              let resultStock: StockInfo|undefined;
              if(/^(sh|sz)/.test(code)){
                resultStock = {
                  name: params[0],
                  code,
                  unit: 'cny',
                  lowWarn: new Number(StockConfig[0]).toFixed(2),
                  highWarn: new Number(StockConfig[1]).toFixed(2),
                  open: new Number(params[1]).toFixed(2),
                  lastClose: new Number(params[2]).toFixed(2),
                  now: new Number(params[3]).toFixed(2),
                  high: new Number(params[4]).toFixed(2),
                  low: new Number(params[5]).toFixed(2),
                };
              }else if (/^hk/.test(code)){
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
                };
              }else if (/^gb_/.test(code)){
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
                };
              }
              if(resultStock !== undefined){
                const {lastClose, now } = resultStock;
                const changeAmount = Math.abs(+now - +lastClose);
                const changeSign  = (+now - +lastClose) >=0 ? '+': '-';
                resultStock.highStop = new Number(+lastClose * 1.1).toFixed(2);
                resultStock.lowStop = new Number(+lastClose * 0.9).toFixed(2);
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
      while(stringWidth(source) >= length){
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
  highStop?: string;
  lowStop?: string;
  changeAmount?: string;
  changeRate?: string;
}
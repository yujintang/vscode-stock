import * as https from 'https';
import * as iconv from 'iconv-lite';
import * as stringWidth from 'string-width';
import { isArray } from 'util';
import { Stock, StockConfig } from './resource';

export function sinaApi(stockConfig: StockConfig): Promise<Array<Stock>> {

  const url = 'https://hq.sinajs.cn/list=' + Object.keys(stockConfig).join(',');
  
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
              if(!isArray(StockConfig)){StockConfig = ['-', '-']; }
              if(StockConfig.length < 2) {StockConfig.concat(['-', '-']);}
              
              resultArr.push(new Stock({
                name: params[0],
                code,
                lowWarn: new Number(StockConfig[0]).toFixed(2),
                highWarn: new Number(StockConfig[1]).toFixed(2),
                open: new Number(params[1]).toFixed(2),
                lastClose: new Number(params[2]).toFixed(2),
                now: new Number(params[3]).toFixed(2),
                high: new Number(params[4]).toFixed(2),
                low: new Number(params[5]).toFixed(2),
                highStop: new Number(+params[2] * 1.1).toFixed(2),
                lowStop: new Number(+params[2] * 0.9).toFixed(2),
                changeAmount: new Number(+params[3] - +params[2]).toFixed(2),
                changeRate: new Number((+params[3] - +params[2])/+params[2]*100).toFixed(2),
              })
              );
            }
          }
          resolve(resultArr);
        } else {
          reject('fail: ' + res.statusCode);
        }
      });
    });
  });
}


/**
 * 字符串长度拼接
 * @param source 原字符串长度
 * @param length 修改后的字符串长度
 * @param left 原字符串是否靠左边
 */
export function fillString(source: string, length: number, left = true): string {
  const addString = ' '.repeat(length - stringWidth(source));
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
  highStop: string;
  lowStop: string;
  changeAmount: string;
  changeRate: string;
}
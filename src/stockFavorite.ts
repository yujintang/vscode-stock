import {window, EventEmitter, Event, TreeDataProvider, TreeItem } from 'vscode';
import { StockResource, Stock } from './stockResource';
import { sinaApi, StockInfo } from './utils';

export class StockProvider implements TreeDataProvider<Stock>{

  public _onDidChangeTreeData: EventEmitter<Stock | undefined> = new EventEmitter<Stock | undefined>();
  readonly onDidChangeTreeData: Event<Stock | undefined> = this._onDidChangeTreeData.event;
  private resource: StockResource;
  private order: number;


  constructor(resource: StockResource) {
    this.resource = resource;
    this.order = 0;
  }

  getTreeItem(element: Stock): TreeItem {
    const {lowWarn, now, highWarn, code} = element.info;
    // Low Price Warn
    if(!isNaN(+lowWarn) && +lowWarn >= +now){
      window.showWarningMessage(`${code} now price: ${now}`);
      this.resource.setWarnConfig(code, NaN, 0);
    }
    // High Price Warn
    if(!isNaN(+highWarn) && +highWarn <= +now){
      window.showWarningMessage(`${code} now price: ${now}`);
      this.resource.setWarnConfig(code, NaN, 1);
    }
    
    return element;
  }

  getChildren(): Promise<Array<Stock>> {
     return this.resource.getFavorites(this.order);
  }

  changeOrder(): void {
    if(this.order === 1){
      this.order = -1;
    }else{
      this.order = this.order + 1;
    }
    this._onDidChangeTreeData.fire();
  }

  async addFavorite(){
    const res =await window.showInputBox({
      value: '',
      prompt: `添加股票到自选, 使用【,】添加多个！`,
      placeHolder: 'Add Stock To Favorite',
    });

    if (res !== undefined) {
      const codeArray = res.split(/[,|，]/);
      const newStock:{[key:string]: Array<string>} = {};
      for(const stock of codeArray){
        if(stock !== ''){
          newStock[`${stock.trim()}`] =  ['-', '-'];
        }
      }
      const result = await sinaApi(newStock);
      const insertStockObj: { [key: string]: any[] }= {};
      result.forEach(stockInfo=>{
        if (stockInfo) {
          insertStockObj[`${stockInfo.info.code}`] = ['-', '-'];
        }
      });
      this.resource.updateConfig(insertStockObj);
      this._onDidChangeTreeData.fire();
    }
  }

  async setHighWarn(stock: {info: StockInfo}){
    const { info } = stock;
      const res = await window.showInputBox({
        value: isNaN(+info.highWarn) ? info.now : info.highWarn,
        valueSelection: [0, -1],
        prompt: '设置高报警价:',
        placeHolder: '设置高报警价',
        validateInput: (text: string) => {
          return isNaN(+text) || +text <= +info.now ? `高报警价必须大于现价: ${info.now}` : null;
        },
      });
      if (res !== undefined) {
        this.resource.setWarnConfig(info.code, +res, 1);
      }
  }

  async setLowWarn(stock: {info: StockInfo}){
    {
      const { info } = stock;
      const res = await window.showInputBox({
        value: isNaN(+info.lowWarn) ? info.now : info.lowWarn,
        valueSelection: [0, -1],
        prompt: '设置低报警价:',
        placeHolder: '设置低报警价',
        validateInput: (text: string) => {
          return isNaN(+text) || +text >= +info.now ? `低报警价必须小于现价: ${info.now}` : null;
        },
      });
      if (res !== undefined) {
        this.resource.setWarnConfig(info.code, +res, 0);
      }
    }
  }
  remove(stock: {info: StockInfo}){
    const { info } = stock;
    this.resource.removeConfig(info.code);
    this._onDidChangeTreeData.fire();
  }
}
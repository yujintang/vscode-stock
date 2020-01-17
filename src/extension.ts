import { ExtensionContext, commands, window, workspace } from 'vscode';

import { StockProvider } from './favorite';
import { Resource } from './resource';
import { sinaApi, stockMarket } from './utils';

export function activate(context: ExtensionContext) {

  const resource = new Resource();
  let interval = workspace.getConfiguration().get('super-stock.interval', 2);
  if (interval < 2) { interval = 2; }

  const nodeFavoriteProvider = new StockProvider(resource);

  setInterval(() => {
    nodeFavoriteProvider._onDidChangeTreeData.fire();
  }, interval * 1000);

  window.registerTreeDataProvider('super-stock-favorite', nodeFavoriteProvider);

  context.subscriptions.push(
    commands.registerCommand('super-stock-favorite.order', () => {
      nodeFavoriteProvider.changeOrder();
    }),
    commands.registerCommand('super-stock-favorite.add', async () => {
      const quickPick = await window.createQuickPick();
      quickPick.items = Object.keys(stockMarket).map(label => ({ label }));
      quickPick.show();
      quickPick.onDidChangeSelection(async (market) => {

        const {label, detail } = stockMarket[market[0].label];
        
        const res =await window.showInputBox({
          value: detail,
          valueSelection: [5, -1],
          prompt: `添加${label}到自选, 使用【,】添加多个！`,
          placeHolder: 'Add Stock To Favorite',
          validateInput: (stockCode: string) => {
            const codeArray = stockCode.split(/[\W]/);
            for(const stock of codeArray){
              if(stock !== ''){
                if(!(new RegExp(`^${detail}\\w+`)).test(stock)){
                  return `${label}代码输入错误`;
                }
              }
            }
          },
        });

        if (res !== undefined) {
          const codeArray = res.split(/[\W]/);
          const newStock:{[key:string]: Array<string>} = {};
          for(const stock of codeArray){
            if(stock !== ''){
              newStock[`${stock}`] =  ['-', '-'];
            }
          }
          const result = await sinaApi(newStock);
          result.forEach(stockInfo=>{
            if (stockInfo) {
              resource.updateConfig(newStock);
              nodeFavoriteProvider._onDidChangeTreeData.fire();
            }
          });
        }
      });
    }),
    commands.registerCommand('super-stock-favorite.item.setHighWarn', async (stock) => {
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
        resource.setWarnConfig(info.code, +res, 1);
      }
    }),
    commands.registerCommand('super-stock-favorite.item.setLowWarn', async (stock) => {
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
        resource.setWarnConfig(info.code, +res, 0);
      }
    }),
    commands.registerCommand('super-stock-favorite.item.remove', ({ info }) => {
      resource.removeConfig(info.code);
      nodeFavoriteProvider._onDidChangeTreeData.fire();
    }),
  
  ); // subscriptions
}
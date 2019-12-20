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
          prompt: 'Add Stock To Favorite:',
          placeHolder: 'Add Stock To Favorite',
          validateInput: (stockCode: string) => {
            const regExp = new RegExp(`^${detail}`);
            if (regExp.test(stockCode)) {
              return null;
            } else {
              return `${label} Stock Code Input Error, Must Start with【 ${detail} 】!`;
            }
          },
        });

        if (res !== undefined) {
          const newStock = { [`${res}`]: ['-', '-'] };
          
          const [stockInfo] = await sinaApi(newStock);
          if (stockInfo) {
            resource.updateConfig(newStock);
            nodeFavoriteProvider._onDidChangeTreeData.fire();
          }
        }
      });
    }),
    commands.registerCommand('super-stock-favorite.item.setHighWarn', async (stock) => {
      const { info } = stock;
      const res = await window.showInputBox({
        value: isNaN(+info.highWarn) ? info.now : info.highWarn,
        valueSelection: [0, -1],
        prompt: 'Set Stock HighWarn Price:',
        placeHolder: 'Set Stock HighWarn Price',
        validateInput: (text: string) => {
          return isNaN(+text) || +text <= +info.now ? `Stock HighWarn Price Must Greater Than: ${info.now}` : null;
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
        prompt: 'Set Stock LowWarn Price:',
        placeHolder: 'Set Stock LowWarn Price',
        validateInput: (text: string) => {
          return isNaN(+text) || +text >= +info.now ? `Stock LowWarn Price Must Less Than: ${info.now}` : null;
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
import { ExtensionContext, commands, window, workspace } from 'vscode';

import { StockProvider } from './stockFavorite';
import { StockResource } from './stockResource';

export function activate(context: ExtensionContext) {

  let interval = workspace.getConfiguration().get('super-stock.interval', 2);
  if (interval < 2) { interval = 2; }

  const stockResource = new StockResource();
  const nodeFavoriteStockProvider = new StockProvider(stockResource);

  setInterval(() => {
    nodeFavoriteStockProvider._onDidChangeTreeData.fire();
  }, interval * 1000);

  window.registerTreeDataProvider('super-stock-favorite', nodeFavoriteStockProvider);

  context.subscriptions.push(
    
    commands.registerCommand('super-stock-favorite.order', ()=>{nodeFavoriteStockProvider.changeOrder();}),
    commands.registerCommand('super-stock-favorite.add', ()=>{nodeFavoriteStockProvider.addFavorite(); } ),
    commands.registerCommand('super-stock-favorite.item.setHighWarn', (stock)=>{nodeFavoriteStockProvider.setHighWarn(stock);}),
    commands.registerCommand('super-stock-favorite.item.setLowWarn', (stock)=>{nodeFavoriteStockProvider.setLowWarn(stock);}),
    commands.registerCommand('super-stock-favorite.item.remove', (stock)=>{nodeFavoriteStockProvider.remove(stock);}),
  ); // subscriptions
}

export function deactivate() {}
import * as vscode from 'vscode';
import { Resource, Stock } from './resource';

export class StockProvider implements vscode.TreeDataProvider<Stock>{

  public _onDidChangeTreeData: vscode.EventEmitter<Stock | undefined> = new vscode.EventEmitter<Stock | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Stock | undefined> = this._onDidChangeTreeData.event;
  private resource: Resource;
  private order: number;


  constructor(resource: Resource) {
    this.resource = resource;
    this.order = 1;
  }

  getTreeItem(element: Stock): vscode.TreeItem {
    const {lowWarn, now, highWarn, code} = element.info;
    // Low Price Warn
    if(!isNaN(+lowWarn) && +lowWarn >= +now){
      vscode.window.showWarningMessage(`${code} now price: ${now}`);
      this.resource.setWarnConfig(code, NaN, 0);
    }
    // High Price Warn
    if(!isNaN(+highWarn) && +highWarn <= +now){
      vscode.window.showWarningMessage(`${code} now price: ${now}`);
      this.resource.setWarnConfig(code, NaN, 1);
    }
    
    return element;
  }

  getChildren(): Promise<Array<Stock>> {
     return this.resource.getFavorites(this.order);
  }

  changeOrder(): void {
    this.order = this.order * -1;
    this._onDidChangeTreeData.fire();
  }
}
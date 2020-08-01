import * as vscode from 'vscode';
import { TreeItem } from 'vscode';
import { RimeConfigurationTree, ConfigTreeItem } from './RimeConfigurationTree';

export class RimeFileExplorerProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;
    private readonly configurationTree: RimeConfigurationTree;

    constructor(configurationTree: RimeConfigurationTree) {
        this.configurationTree = configurationTree;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: TreeItem): TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
        // Root node.
        if (!element) {
            const defaultFolder: TreeItem = this.configurationTree.defaultConfigTree;
            const userFolder: TreeItem = this.configurationTree.userConfigTree;
            return [defaultFolder, userFolder];
        } else {
            if (element.id === this.configurationTree.defaultConfigTree.id) {
                return Array.from(this.configurationTree.defaultConfigTree.children.values())
                    .map((item: ConfigTreeItem) => { 
                        item.collapsibleState = undefined; 
                        return item;
                    });
            } else if (element.id === this.configurationTree.userConfigTree.id) {
                return Array.from(this.configurationTree.userConfigTree.children.values())
                    .map((item: ConfigTreeItem) => { 
                        item.collapsibleState = undefined; 
                        return item;
                    });
            }
        }
    }
}

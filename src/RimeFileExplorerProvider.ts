import * as vscode from 'vscode';
import { TreeItem } from 'vscode';
import { RimeConfigurationTree } from './RimeConfigurationTree';

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
            const defaultFolder: TreeItem = new TreeItem("Default Configurations", vscode.TreeItemCollapsibleState.Collapsed); 
            defaultFolder.contextValue = 'folder';
            const userFolder: TreeItem = new TreeItem("User Configurations", vscode.TreeItemCollapsibleState.Collapsed);
            userFolder.contextValue = 'folder';
            return [defaultFolder, userFolder];
        } else {
            if (element.label === 'Default Configurations') {
                return this.configurationTree.defaultConfigFiles;
            } else if (element.label === 'User Configurations') {
                return this.configurationTree.userConfigFiles;
            }
        }
    }
}

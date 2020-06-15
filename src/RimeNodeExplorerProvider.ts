import * as vscode from 'vscode';
import { RimeConfigurationTree, ConfigFolderType, ConfigTreeItem } from './RimeConfigurationTree';
import { TreeItem } from 'vscode';

export class RimeNodeExplorerProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined> = new vscode.EventEmitter<ConfigTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined> = this._onDidChangeTreeData.event;
    private readonly configurationTree: RimeConfigurationTree;

    constructor(configurationTree: RimeConfigurationTree) {
        this.configurationTree = configurationTree;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ConfigTreeItem): ConfigTreeItem {
        return element;
    }

    getChildren(element?: ConfigTreeItem): vscode.ProviderResult<ConfigTreeItem[]> {
        // Root node.
        if (!element) {
            // const defaultFolder: TreeItem = new TreeItem("Default Configurations", vscode.TreeItemCollapsibleState.Collapsed); 
            // defaultFolder.contextValue = 'folder';
            // const userFolder: TreeItem = new TreeItem("User Configurations", vscode.TreeItemCollapsibleState.Collapsed);
            // userFolder.contextValue = 'folder';
            // return [defaultFolder, userFolder];
            return this.configurationTree.tree.folders[0].files;
        } else {
            // if (element.label === 'Default Configurations') {
            //     return this.configurationTree.tree.folders[0].files;
            // } else if (element.label === 'User Configurations') {
            //     return this.configurationTree.tree.folders[1].files;
            // if (element.contextValue === 'file' || element.contextValue === 'item') {
            return this.configurationTree.getConfigChildrenTreeItem(element);
            // }
        }
    }
}
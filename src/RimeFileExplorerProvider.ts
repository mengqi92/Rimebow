import * as vscode from 'vscode';
import { TreeItem } from 'vscode';
import { RimeConfigurationTree, RimeConfigNode } from './RimeConfigurationTree';

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
            let sharedConfigFolder: TreeItem = this.configurationTree.sharedConfigFolderNode;
            sharedConfigFolder.id = this.configurationTree.sharedConfigFolderNode.key;
            let userConfigFolder: TreeItem = this.configurationTree.userConfigFolderNode;
            userConfigFolder.id = this.configurationTree.userConfigFolderNode.key;
            return [sharedConfigFolder, userConfigFolder];
        } else {
            if (element.id === this.configurationTree.sharedConfigFolderNode.id) {
                return Array.from(this.configurationTree.sharedConfigFolderNode.children.values());
            } else if (element.id === this.configurationTree.userConfigFolderNode.id) {
                return Array.from(this.configurationTree.userConfigFolderNode.children.values());
            }
        }
    }
}

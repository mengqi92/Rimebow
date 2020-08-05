import * as vscode from 'vscode';
import { RimeConfigurationTree, RimeConfigNode } from './RimeConfigurationTree';

export class RimeNodeExplorerProvider implements vscode.TreeDataProvider<RimeConfigNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<RimeConfigNode | undefined> = new vscode.EventEmitter<RimeConfigNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<RimeConfigNode | undefined> = this._onDidChangeTreeData.event;
    private readonly configurationTree: RimeConfigurationTree;

    constructor(configurationTree: RimeConfigurationTree) {
        this.configurationTree = configurationTree;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: RimeConfigNode): RimeConfigNode {
        return element;
    }

    getChildren(element?: RimeConfigNode | undefined): vscode.ProviderResult<RimeConfigNode[]> {
        // Root node.
        if (!element) {
            return Array.from(this.configurationTree.configTree.children.values());
        } else {
            if (element.hasChildren) {
                return Array.from(element.children.values());
            } else {
                return null;
            }
        }
    }
}
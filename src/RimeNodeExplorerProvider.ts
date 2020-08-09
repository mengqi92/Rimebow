import * as vscode from 'vscode';
import { RimeConfigurationTree, RimeConfigNode, FileKind } from './RimeConfigurationTree';

export class RimeNodeExplorerProvider implements vscode.TreeDataProvider<RimeConfigNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<RimeConfigNode | undefined> = new vscode.EventEmitter<RimeConfigNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<RimeConfigNode | undefined> = this._onDidChangeTreeData.event;
    private readonly configurationTree: RimeConfigurationTree;
    private _showOnlyFileKind: FileKind | undefined = undefined;

    constructor(configurationTree: RimeConfigurationTree) {
        this.configurationTree = configurationTree;
    }

    async refresh(): Promise<void> {
        await this.configurationTree.build();
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: RimeConfigNode): RimeConfigNode {
        return element;
    }

    getChildren(element?: RimeConfigNode | undefined): vscode.ProviderResult<RimeConfigNode[]> {
        // Root node.
        if (!element) {
            return Array.from(this.configurationTree.configTree.children.values())
                .filter((childNode: RimeConfigNode) => {
                    if (this._showOnlyFileKind) {
                        return childNode.fileKind === this._showOnlyFileKind;
                    } else {
                        return true;
                    }
                });
        } else {
            if (element.hasChildren) {
                return Array.from(element.children.values());
            } else {
                return null;
            }
        }
    }

    /**
     * Show only given kind of files on the view.
     * @param {FileKind | undefined} fileKind The kind of files to show. Show all files when given undefined.
     */
	public showOnly(fileKind: FileKind | undefined) {
        this._showOnlyFileKind = fileKind;
        this._onDidChangeTreeData.fire(undefined);
	}
}
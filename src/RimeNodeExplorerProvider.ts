import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreeItem } from 'vscode';
import YAML = require('yaml');

export class RimeNodeExplorerProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;
    private static readonly DEFAULT_CONFIG_PATH: string = path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
    // TODO: private defaultNodeTree

    constructor() {}

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
                return this._getConfigFiles(RimeNodeExplorerProvider.DEFAULT_CONFIG_PATH);
            } else if (element.contextValue === 'file' && element.label !== undefined) {
                return this._getYamlNodeTree(path.join(RimeNodeExplorerProvider.DEFAULT_CONFIG_PATH, element.label));
            }
        }
    }

    private async _getYamlNodeTree(fileName: string): Promise<vscode.TreeItem[]> {
        const fileResult: Promise<Buffer> = new Promise((resolve, reject) => {
            fs.readFile(fileName + '.yaml', {}, (err: NodeJS.ErrnoException | null, data: Buffer) => {
                return resolve(data);
            });
        });
        return fileResult.then((data: Buffer): TreeItem[] => {
            const nodeTree: any = YAML.parse(data.toString());
            return Object.keys(nodeTree).map((key: string) => {
                console.log("key: " + key);
                return new TreeItem(key);
            });
        });
    }

    private async _getConfigFiles(configPath: string): Promise<TreeItem[]> {
        const filesResult: Promise<string[]> = new Promise((resolve, reject) => {
            fs.readdir(configPath, (err: NodeJS.ErrnoException | null, files: string[]) => {
                resolve(files);
            });
        });
        return filesResult.then((fileNames: string[]): TreeItem[] => {
            return fileNames
                .filter((fileName: string) => fileName.endsWith('.yaml'))
                .map((fileName: string): TreeItem => {
                    let fileItem: TreeItem = new TreeItem(fileName.replace('.yaml', ''), vscode.TreeItemCollapsibleState.Collapsed);
                    fileItem.contextValue = 'file';
                    return fileItem;
                });
        });
    }
}

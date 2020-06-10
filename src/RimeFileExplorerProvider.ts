import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreeItem } from 'vscode';

export class RimeFileExplorerProvider implements vscode.TreeDataProvider<TreeItem> {
     private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

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
            return [
                new TreeItem("Default Configurations", vscode.TreeItemCollapsibleState.Collapsed), 
                new TreeItem("User Configurations", vscode.TreeItemCollapsibleState.Collapsed)];
        } else {
            if (element.label === 'Default Configurations') {
                // this.readRimeDefaultConfigurations();
                // 'C:\Program Files (x86)\Rime\weasel-0.14.3'
                let defaultConfigPath: string = path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
                return this._getConfigFiles(defaultConfigPath);
            } else if (element.label === 'User Configurations') {
                // this.readRimeUserConfigurations();
                // C:\Users\mengq\AppData\Roaming\Rime
                let userConfigPath: string = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime');
                return this._getConfigFiles(userConfigPath);
            }
        }
    }

    private async _getConfigFiles(configPath: string) {
        const files: string[] = await new Promise((resolve, reject) => {
            fs.readdir(configPath, (err: NodeJS.ErrnoException | null, files: string[]) => {
                resolve(files);
            });
        });
        return files
            .filter((file: string) => file.endsWith('.yaml'))
            .map((file: string): TreeItem => {
                let fileItem: TreeItem = new TreeItem(file);
                fileItem.command = {
                    command: 'vscode.open',
                    title: 'open',
                    arguments: [vscode.Uri.file(path.join(configPath, file))],
                };
                return fileItem;
            });
    }
}

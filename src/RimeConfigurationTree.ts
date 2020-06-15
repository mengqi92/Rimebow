import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import YAML = require('yaml');
import util = require('util');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { YAMLSemanticError } from 'yaml/util';

export enum ConfigFolderType {
    DEFAULT,
    USER
};
/**
 * @deprecated
 */
interface ConfigTree {
    folders: ConfigFolder[];
}
export interface ConfigFolder {
    readonly path: string,
    readonly type: ConfigFolderType,
    readonly files: ConfigTreeItem[]
}

export class ConfigTreeItem extends TreeItem {
    constructor(
        /**
         * The label of the node.
         */
        public readonly label: string, 
        /**
         * A list of children nodes of current node.
         */
        public readonly children: ConfigTreeItem[],
        /**
         * The path to current node represented as a list of nodes.
         */
        public readonly path: ConfigTreeItem[],
        /**
         * Full path of the config file containing current node, used for navigation.
         */
        public readonly configFilePath: string,
        /**
         * The line number of current node defined in the config file, used for navigation.
         */
        public readonly configLine: number,
        private isFile: boolean = false,
        /**
         * The value of the leaf node.
         */
        public value?: any) {
        super(
            label, 
            children.length > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        this.contextValue = isFile ? 'file' : 'item';
        this.description = path.map((node: ConfigTreeItem) => node.label).join('->');
        this.tooltip = `value: ${value}`;
        // this.iconPath = isPatch ? '' : '';
        // this.command = {
        //     command: 'vscode.open',
        //     title: 'open',
        //     arguments: [vscode.Uri.file(fullPath)],
        // };
    }

    /**
     * Is current node a patch defined by user.
     */
    get isPatch(): boolean {
        if (this.configFilePath) {
            return this.configFilePath.endsWith('.custom.yaml');
        }
        return false;
    }

    get hasChildren(): boolean {
        return this.children.length > 0;
    }
}

interface NodeTreeByFile {
    [fileName: string]: ConfigTreeItem
}

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
export class RimeConfigurationTree {
    private static readonly DEFAULT_CONFIG_PATH: string = path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
    private static readonly USER_CONFIG_PATH: string = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime');
    public tree: ConfigTree = { folders: [] };
    // {file: nodeTree, file: nodeTree}
    private nodeTreeByFile: NodeTreeByFile = {};

    constructor() {}

    public async build() {
        this.tree.folders.push(await this._parseConfigFolder(RimeConfigurationTree.DEFAULT_CONFIG_PATH, ConfigFolderType.DEFAULT));
        this.tree.folders.push(await this._parseConfigFolder(RimeConfigurationTree.USER_CONFIG_PATH, ConfigFolderType.USER));
    }

    getConfigChildrenTreeItem(node: ConfigTreeItem): vscode.ProviderResult<ConfigTreeItem[]> {
        if (node.hasChildren) {
            return node.children;
        } else {
            return null;
        }
    }

    private _parseNodeTree(objectTreeRoot: any, rootNode: ConfigTreeItem, fullPath: string, isPatch: boolean) {
        if (typeof(objectTreeRoot) === 'object') {
            Object.keys(objectTreeRoot).forEach((objectKey: string) => {
                const value: any = objectTreeRoot[objectKey];
                let extendedPath: ConfigTreeItem[] = rootNode.path.slice(0);
                extendedPath.push(rootNode);
                if (typeof(value) === 'object') {
                    // Object tree has children.
                    let childNode: ConfigTreeItem = new ConfigTreeItem(objectKey, [], extendedPath, fullPath, 0);
                    rootNode.children.push(childNode);
                    this._parseNodeTree(value, childNode, fullPath, isPatch);
                } else {
                    // FIXME fill configLine with correct value.
                    rootNode.children.push(new ConfigTreeItem(objectKey, [], extendedPath, fullPath, 0, value));
                    rootNode.collapsibleState = TreeItemCollapsibleState.Collapsed;
                }
            });
        } else if (objectTreeRoot) {
            rootNode.value = objectTreeRoot;
        }
    }

    private async _parseConfigFolder(path: string, type: ConfigFolderType): Promise<ConfigFolder> {
        const configPath: string = type === ConfigFolderType.DEFAULT ? RimeConfigurationTree.DEFAULT_CONFIG_PATH : RimeConfigurationTree.USER_CONFIG_PATH;
        const configFiles: ConfigTreeItem[] = await this._parseConfigFiles(configPath);
        return { path: path, type: type, files: configFiles };
    }

    private async _parseConfigFiles(configPath: string): Promise<ConfigTreeItem[]> {
        const filesResult: Promise<string[]> = readDirAsync(configPath);
        const fileNames = await filesResult;
        const promises: Promise<ConfigTreeItem>[] = fileNames
            .filter((fileName: string) => fileName.endsWith('.yaml') && !fileName.endsWith('.dict.yaml'))
            .map(async (fileName: string): Promise<ConfigTreeItem> => {
                return await this._getYamlNodeTree(configPath, fileName);
            });
        return await Promise.all(promises).catch((error: YAMLSemanticError) => []);
    }

    private async _getYamlNodeTree(filePath: string, fileName: string): Promise<ConfigTreeItem> {
        const fullName: string = path.join(filePath, fileName);
        const data = await readFileAsync(fullName);

        const objectTree: object = YAML.parse(data.toString());

        const fileLabel: string = fileName.replace('.yaml', '');
        const isPatch: boolean = fileName.endsWith('.custom.yaml');
        let rootNode: ConfigTreeItem = new ConfigTreeItem(fileLabel, [], [], fullName, 0);
        // Build ConfigNode tree by traversing the nodeTree object.
        this._parseNodeTree(objectTree, rootNode, fileLabel, isPatch);
        // this.nodeTreeByFile[file.nameWithoutExtension] = rootNode;
        // file
        // FIXME: line number should be -1 or something for file.
        return new ConfigTreeItem(fileLabel, [rootNode], [], fullName, 0, true,);
    }
}
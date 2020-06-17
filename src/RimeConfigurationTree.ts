import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import YAML = require('yaml');
import util = require('util');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { YAMLSemanticError } from 'yaml/util';

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);

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
         * Full path of the config file containing current node, used for navigation.
         */
        public readonly configFilePath: string,
        /**
         * The line number of current node defined in the config file, used for navigation.
         */
        public readonly configLine: number,
        /**
         * Wether current node is representing a configuration file.
         */
        private isFile: boolean = false,
        /**
         * The value of the leaf node.
         */
        public value?: any) {
        super(
            label, 
            children.length > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        this.contextValue = isFile ? 'file' : 'item';
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
     * @returns {boolean} Whether if current node has any child node.
     */
    get isPatch(): boolean {
        if (this.configFilePath) {
            return this.configFilePath.endsWith('.custom.yaml');
        }
        return false;
    }

    /**
     * Does current node has any child nodes.
     * @returns {boolean} Whether if current node has any child node.
     */
    get hasChildren(): boolean {
        return this.children.length > 0;
    }

    /**
     * Add a child node to current node.
     * @param childNode {ConfigTreeItem} The child node to add.
     */
    public addChildNode(childNode: ConfigTreeItem) {
        this.children.push(childNode);
        if (!this.collapsibleState) {
            this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        }
    }
}

export class RimeConfigurationTree {
    private static readonly DEFAULT_CONFIG_PATH: string = path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
    private static readonly USER_CONFIG_PATH: string = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime');
    private static readonly BUILD_CONFIG_PATH: string = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime', 'build');

    /**
     * Configuration tree, including config files, in the default config folder.
     */
    public defaultConfigFiles: ConfigTreeItem[] = [];
    /**
     * Configuration tree, including config files, in the user config folder.
     */
    public userConfigFiles: ConfigTreeItem[] = [];
    /**
     * Configuration tree, including config files, in the build folder.
     */
    public buildConfigFiles: ConfigTreeItem[] = [];

    constructor() {}

    public async build() {
        this.defaultConfigFiles = await this._buildConfigTreeFromFiles(RimeConfigurationTree.DEFAULT_CONFIG_PATH);
        this.userConfigFiles = await this._buildConfigTreeFromFiles(RimeConfigurationTree.USER_CONFIG_PATH);
        this.buildConfigFiles = await this._buildConfigTreeFromFiles(RimeConfigurationTree.BUILD_CONFIG_PATH);
    }

    private async _buildConfigTreeFromFiles(configPath: string): Promise<ConfigTreeItem[]> {
        const filesResult: Promise<string[]> = readDirAsync(configPath);
        const fileNames = await filesResult;
        const promises: Promise<ConfigTreeItem>[] = fileNames
            .filter((fileName: string) => fileName.endsWith('.yaml') && !fileName.endsWith('.dict.yaml'))
            .map(async (fileName: string): Promise<ConfigTreeItem> => {
                return await this._buildConfigTreeFromFile(configPath, fileName);
            });
        return await Promise.all(promises).catch((error: YAMLSemanticError) => []);
    }

    private async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
        const fullName: string = path.join(filePath, fileName);
        const data = await readFileAsync(fullName);

        const objectTree: object = YAML.parse(data.toString());

        const fileLabel: string = fileName.replace('.yaml', '');
        const isCustomConfig: boolean = fileName.endsWith('.custom.yaml');
		// The root node is representing the configuration file.
        // FIXME: line number should be -1 or something for file.
        let rootNode: ConfigTreeItem = new ConfigTreeItem(fileLabel, [], fullName, 0, true);
        // Build ConfigNode tree by traversing the nodeTree object.
        this._buildConfigTree(objectTree, rootNode, fileLabel, isCustomConfig);
        return rootNode;
    }

    /**
     * Build up a configuration tree based on the object tree parsed.
     * @param objectTreeRoot {any} The root node of the object tree parsed from yaml file.
     * @param rootNode {ConfigTreeItem} The current traversed node in the configuration tree we are building.
     * @param fullPath {string} The full path of the configuration file.
     * @param isCustomConfig {boolean} Whether current configuration node is a patch.
     */
    protected _buildConfigTree(objectTreeRoot: any, rootNode: ConfigTreeItem, fullPath: string, isCustomConfig: boolean) {
        if (typeof(objectTreeRoot) === 'object') {
            Object.keys(objectTreeRoot).forEach((objectKey: string) => {
                const value: any = objectTreeRoot[objectKey];
                if (typeof(value) === 'object') {
                    // Current node in the object tree has children.
                    let childNode: ConfigTreeItem = new ConfigTreeItem(objectKey, [], fullPath, 0);
                    rootNode.addChildNode(childNode);
                    this._buildConfigTree(value, childNode, fullPath, isCustomConfig);
                } else {
                    // Current node is a leaf node in the object tree.
                    // FIXME fill configLine with correct value.
                    rootNode.children.push(new ConfigTreeItem(objectKey, [], fullPath, 0, false, value));
                }
            });
        } else if (objectTreeRoot) {
            rootNode.value = objectTreeRoot;
        }
    }
}
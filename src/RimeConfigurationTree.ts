import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import YAML = require('yaml');
import util = require('util');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { YAMLSemanticError, Type } from 'yaml/util';
import { Node, YAMLMap, Pair, Scalar, YAMLSeq } from 'yaml/types';

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);

export interface ConfigTreeItemOptions {
    /**
     * The label of the node.
     */
    readonly label: string;
    /**
     * A list of children nodes of current node.
     */
    readonly children: ConfigTreeItem[];
    /**
     * Full path of the config file containing current node, used for navigation.
     */
    readonly configFilePath: string;
    /**
     * The line number of current node defined in the config file, used for navigation.
     */
    readonly configLine: number;
    /**
     * Whether current node is representing a sequential yaml node (just like a map with only values).
     * Consider as false if no value provided.
     */
    readonly isSequential?: boolean;
    /**
     * Wether current node is representing a configuration file.
     * Consider as false if no value provided.
     */
    readonly isFile?: boolean;
    /**
     * The value of the leaf node.
     * Consider the node as not a leaf node if no value provided.
     */
    readonly value?: any;
}

export class ConfigTreeItem extends TreeItem {
    private configFilePath?: string;
    public children: ConfigTreeItem[];
    public value: any;
    constructor(options: ConfigTreeItemOptions) {
        super(options.label, options.children.length > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        this.configFilePath = options.configFilePath;
        this.children = options.children;
        this.contextValue = options.isFile ? 'file' : 'item';
        this.value = options.value;
        this.tooltip = `value: ${options.value}`;
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

    protected async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
        const fullName: string = path.join(filePath, fileName);
        const data = await readFileAsync(fullName);

        const doc: YAML.Document.Parsed = YAML.parseDocument(data.toString());

        const fileLabel: string = fileName.replace('.yaml', '');
        const isCustomConfig: boolean = fileName.endsWith('.custom.yaml');
		// The root node is representing the configuration file.
        // FIXME: line number should be -1 or something for file.
        let rootNode: ConfigTreeItem = new ConfigTreeItem({label: fileLabel, children: [], configFilePath: fullName, configLine: 0, isFile: true});
        if (doc.contents === null) {
            return rootNode;
        }
        // Build ConfigNode tree by traversing the nodeTree object.
        this._buildConfigTree(doc.contents, rootNode, fileLabel, isCustomConfig);
        return rootNode;
    }

    /**
     * Build up a configuration tree based on the object tree parsed.
     * @param doc {Node} The root node of the object tree parsed from yaml file.
     * @param rootNode {ConfigTreeItem} The current traversed node in the configuration tree we are building.
     * @param fullPath {string} The full path of the configuration file.
     * @param isCustomConfig {boolean} Whether current configuration node is a patch.
     */
    protected _buildConfigTree(doc: Node, rootNode: ConfigTreeItem, fullPath: string, isCustomConfig: boolean) {
        if (doc instanceof YAMLMap || doc instanceof YAMLSeq) {
            doc.items.forEach((pair: Pair) => {
                const key: string = (pair.key as Scalar).value;
                const value: any = pair.value;
                if (value instanceof Scalar) {
                    // Current node is a leaf node in the object tree.
                    // FIXME: fill configLine with correct value.
                    rootNode.addChildNode(new ConfigTreeItem({label: key, children: [], configFilePath: fullPath, configLine: 0, value: value.value}));
                } else if (value instanceof YAMLMap) {
                    // Current node in the object tree has children.
                    let childNode: ConfigTreeItem = new ConfigTreeItem({label: key, children: [], configFilePath: fullPath, configLine: 0});
                    rootNode.addChildNode(childNode);
                    this._buildConfigTree(value, childNode, fullPath, isCustomConfig);
                } else if (value instanceof YAMLSeq) {
                    // Current node in the object tree has children and it's an array.
                    let childNode: ConfigTreeItem = new ConfigTreeItem({label: key, children: [], configFilePath: fullPath, configLine: 0});
                    rootNode.addChildNode(childNode);
                    value.items.forEach((valueItem: Node, itemIndex: number) => {
                        let grandChildNode: ConfigTreeItem = new ConfigTreeItem({label: itemIndex.toString(), children: [], configFilePath: fullPath, configLine: 0, isSequential: true});
                        childNode.addChildNode(grandChildNode);
                        this._buildConfigTree(valueItem, grandChildNode, fullPath, isCustomConfig);
                    });
                }
            });
        } else if (doc instanceof Scalar) {
            rootNode.value = doc.value;
        }
    }
}
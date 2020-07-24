import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import YAML = require('yaml');
import util = require('util');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { YAMLSemanticError, Type } from 'yaml/util';
import { Node, YAMLMap, Pair, Scalar, YAMLSeq } from 'yaml/types';
import { stringify } from 'querystring';

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);

export interface ConfigTreeItemOptions {
    /**
     * The node key.
     */
    readonly key: string;
    /**
     * Child nodes indexed by node key.
     */
    readonly children: Map<string, ConfigTreeItem>;
    /**
     * Full path of the config file containing current node, used for navigation.
     */
    readonly configFilePath: string;
    /**
     * Whether current node is representing a sequential yaml node (just like a map with only values).
     * Consider as false if no value provided.
     */
    readonly isSequenceElement?: boolean;
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
    public key: string;
    public children: Map<string, ConfigTreeItem>;
    public value: any;
    public isSequenceElement: boolean;
    public configFilePath: string;
    constructor(options: ConfigTreeItemOptions) {
        super(
            options.value
                ? (options.isSequenceElement ? options.value : `${options.key}: ${options.value}`)
                : options.key,
            options.children.size > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        this.key = options.key;
        this.configFilePath = options.configFilePath;
        this.children = options.children;
        this.value = options.value;
        this.isSequenceElement = options.isSequenceElement || false;

        this.contextValue = options.isFile ? 'file' : 'item';
        this.tooltip = options.value ? `value: ${options.value}` : undefined;
        // this.iconPath = isPatch ? '' : '';
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
        return this.children.size > 0;
    }

    public updateValue(newValue: any) {
        this.value = newValue;
        if (this.value) {
            this.label = this.isSequenceElement ? this.value : `${this.key}: ${this.value}`;
        }
    }

    /**
     * Add a child node to current node.
     * @param childNode {ConfigTreeItem} The child node to add.
     * @returns {ConfigTreeItem} The child node added. Could be the existing node if there is a same child.
     */
    public addChildNode(childNode: ConfigTreeItem): ConfigTreeItem {
        if (childNode.key === undefined) {
            throw new Error('No key found for given child node.');
        } else if (this.children.has(childNode.key)) {
            return this.children.get(childNode.key)!;
        }

        this.children.set(childNode.key, childNode);
        if (!this.collapsibleState) {
            this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        }
        return childNode;
    }
}

export class RimeConfigurationTree {
    private static readonly DEFAULT_CONFIG_PATH: string = path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
    private static readonly USER_CONFIG_PATH: string = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime');
    private static readonly DEFAULT_CONFIG_LABEL: string = 'Default Config';
    private static readonly USER_CONFIG_LABEL: string = 'User Config';

    public configTree: ConfigTreeItem = new ConfigTreeItem({ key: 'ROOT', children: new Map(), configFilePath: '' });
    /**
     * Configuration tree, including config files, in the default config folder.
     */
    public defaultConfigTree: ConfigTreeItem = new ConfigTreeItem({
        key: 'DEFAULT', 
        children: new Map(), 
        configFilePath: RimeConfigurationTree.DEFAULT_CONFIG_PATH });
    /**
     * Configuration tree, including config files, in the user config folder.
     */
    public userConfigTree: ConfigTreeItem = new ConfigTreeItem({ 
        key: 'USER', 
        children: new Map(), 
        configFilePath: RimeConfigurationTree.USER_CONFIG_PATH });

    constructor() { }

    public async build() {
        this.defaultConfigTree = await this._buildConfigTreeFromFiles(
            RimeConfigurationTree.DEFAULT_CONFIG_PATH, RimeConfigurationTree.DEFAULT_CONFIG_LABEL);
        this.configTree.addChildNode(this.defaultConfigTree);
        this.userConfigTree = await this._buildConfigTreeFromFiles(
            RimeConfigurationTree.USER_CONFIG_PATH, RimeConfigurationTree.USER_CONFIG_LABEL);
        this._applyPatch(this.defaultConfigTree, this.userConfigTree);
    }

    /**
     * Build config tree for all the files in the given directory.
     * @param {string} configDir  The directory path containing config files.
     * @param {string} label The label of the config directory.
     * @returns {Promise<Map<string, ConfigTreeItem>>} A promise result containing a map of config trees indexed by file name.
     */
    private async _buildConfigTreeFromFiles(configDir: string, label: string): Promise<ConfigTreeItem> {
        const filesResult: Promise<string[]> = readDirAsync(configDir);
        const fileNames = await filesResult;
        const promises: Promise<ConfigTreeItem>[] = fileNames
            .filter((fileName: string) => fileName.endsWith('.yaml') && !fileName.endsWith('.dict.yaml'))
            .map(async (fileName: string): Promise<ConfigTreeItem> => {
                return await this._buildConfigTreeFromFile(configDir, fileName);
            });
        const fileItems: ConfigTreeItem[] = await Promise.all(promises).catch((error: YAMLSemanticError) => []);
        let fileMap: Map<string, ConfigTreeItem> = new Map();
        fileItems.forEach((fileItem: ConfigTreeItem) => {
            fileMap.set(fileItem.key, fileItem);
        });
        return new ConfigTreeItem({
            key: label,
            children: fileMap,
            configFilePath: configDir
        });
    }

    protected async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
        const fullName: string = path.join(filePath, fileName);
        const data = await readFileAsync(fullName);

        const doc: YAML.Document.Parsed = YAML.parseDocument(data.toString());

        const fileLabel: string = fileName.replace('.yaml', '');
        const isCustomConfig: boolean = fileName.endsWith('.custom.yaml');
        // The root node is representing the configuration file.
        let rootNode: ConfigTreeItem = new ConfigTreeItem({ key: fileLabel, children: new Map(), configFilePath: fullName, isFile: true });
        if (doc.contents === null) {
            return rootNode;
        }
        // Build ConfigNode tree by traversing the nodeTree object.
        this._buildConfigTree(doc.contents, rootNode, fileLabel, isCustomConfig);
        return rootNode;
    }

    /**
     * Build up a configuration tree based on the object tree parsed.
     * @param {Node} doc The root node of the object tree parsed from yaml file.
     * @param {ConfigTreeItem} rootNode The current traversed node in the configuration tree we are building.
     * @param {string} fullPath The full path of the configuration file.
     * @param {boolean} isCustomConfig Whether current configuration node is a patch.
     */
    protected _buildConfigTree(doc: Node, rootNode: ConfigTreeItem, fullPath: string, isCustomConfig: boolean) {
        if (doc instanceof YAMLMap || doc instanceof YAMLSeq) {
            doc.items.forEach((pair: Pair) => {
                let current: ConfigTreeItem = rootNode;
                let key: string = (pair.key as Scalar).value;
                let value: any = pair.value;
                // If the key has slash, create separate nodes for each part.
                // For instance, "foo/bar/baz: 1" should be created as a four-layer tree.
                if (key.indexOf("/") !== -1) {
                    let leafNode: ConfigTreeItem | undefined = this._buildSlashSeparatedNodes(key, current, fullPath);
                    if (leafNode) {
                        current = leafNode;
                        key = key.substring(key.lastIndexOf("/") + 1);
                    }
                }
                if (value instanceof Scalar) {
                    // Current node is a leaf node in the object tree.
                    current.addChildNode(new ConfigTreeItem({ key: key, children: new Map(), configFilePath: fullPath, value: value.value }));
                } else if (value instanceof YAMLMap) {
                    // Current node in the object tree has children.
                    let childNode: ConfigTreeItem = new ConfigTreeItem({ key: key, children: new Map(), configFilePath: fullPath });
                    current.addChildNode(childNode);
                    this._buildConfigTree(value, childNode, fullPath, isCustomConfig);
                } else if (value instanceof YAMLSeq) {
                    // Current node in the object tree has children and it's an array.
                    let childNode: ConfigTreeItem = new ConfigTreeItem({ key: key, children: new Map(), configFilePath: fullPath });
                    current.addChildNode(childNode);
                    value.items.forEach((valueItem: Node, itemIndex: number) => {
                        if (valueItem instanceof Scalar) {
                            let grandChildNode: ConfigTreeItem = new ConfigTreeItem({ key: itemIndex.toString(), children: new Map(), configFilePath: fullPath, value: valueItem.value, isSequenceElement: true });
                            childNode.addChildNode(grandChildNode);
                        } else {
                            let grandChildNode: ConfigTreeItem = new ConfigTreeItem({ key: itemIndex.toString(), children: new Map(), configFilePath: fullPath, isSequenceElement: true });
                            childNode.addChildNode(grandChildNode);
                            this._buildConfigTree(valueItem, grandChildNode, fullPath, isCustomConfig);
                        }
                    });
                }
            });
        } else if (doc instanceof Scalar) {
            rootNode.value = doc.value;
        }
    }

    /**
     * Recursively build multi-layer nodes according to the keys separated by slash.
     * For instance, given the key "foo/bar/baz", there would be 3 layers of nodes: foo -> bar -> baz.
     * @param {string} key The original key composing multi-layer keys by slashes, such as foo/bar/baz.
     * @param {ConfigTreeItem} rootNode The root node to build from.
     * @param {string} filePath Path to the config file.
     * @returns {ConfigTreeItem} The leaf node built.
     */
    protected _buildSlashSeparatedNodes(key: string, rootNode: ConfigTreeItem, filePath: string): ConfigTreeItem | undefined {
        if (key === undefined || key === null) {
            return;
        }
        // Reached leaf.
        if (key.indexOf("/") === -1) {
            return rootNode;
        }

        const childNode: ConfigTreeItem = new ConfigTreeItem({
            key: key.substring(0, key.indexOf("/")),
            children: new Map(),
            configFilePath: filePath
        });
        // add childNode as a child of rootNode, and then point to the childNode as current.
        rootNode = rootNode.addChildNode(childNode);
        return this._buildSlashSeparatedNodes(key.substring(key.indexOf("/") + 1), rootNode, filePath);
    }

    /**
     * TODO
     */
    protected _applyPatch(defaultTree: ConfigTreeItem, userTree: ConfigTreeItem) {
        defaultTree.children.forEach((defaultFileNode: ConfigTreeItem, key: string) => {
            if (!userTree.children.has(key)) {
                // Didn't find the corresponding custom config file.
                return;
            }
            // Found the custom config file.
            const userConfigTree: ConfigTreeItem = userTree.children.get(key)!;

            if(userConfigTree.children.has('patch')) {
                const PatchNode: ConfigTreeItem = userTree.children.get('patch')!;
                this._mergeTree(defaultFileNode, PatchNode);
            }
        });
    }

    protected _mergeTree(treeA: ConfigTreeItem, treeB: ConfigTreeItem) {
        if (treeA.key !== treeB.key) {
            throw new Error('The trees to be merged have no common ancestor.');
        }
        if (treeA.value && treeB.value && treeA.value !== treeB.value) {
            treeA.updateValue(treeB.value);
            return;
        }
        treeB.children.forEach((childB: ConfigTreeItem, childBKey: string) => {
            if (treeA.children.has(childBKey)) {
                // The childB is also in tree A.
                this._mergeTree(treeA.children.get(childBKey)!, childB);
            } else {
                // The childB is a new node to tree A.
                treeA.addChildNode(childB);
            }
        });
    }
}
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import YAML = require('yaml');
import util = require('util');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { YAMLSemanticError } from 'yaml/util';
import { Node, YAMLMap, Pair, Scalar, YAMLSeq } from 'yaml/types';
import { stringify } from 'yaml';

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
const existsAsync = util.promisify(fs.exists);

export enum ItemKind {
    Root = 'ROOT',
    Folder = 'folder',
    File = 'file',
    Node = 'node'
}

export enum FileKind {
    Program,
    Default,
    Schema,
    Custom,
    Other
}

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
     * The kind of the config file containing this item.
     */
    readonly kind: ItemKind;
    /**
     * Full path of the config file containing current node, used for navigation.
     */
    readonly configFilePath: string;
    /**
     * The kind of the file when the node is a file or node (kind === ItemKind.File || kind === ItemKind.Node). 
     */
    readonly fileKind?: FileKind;
    /**
     * Whether current node is representing a sequential node.
     * Consider as false if no value provided.
     */
    readonly isSequence?: boolean;
    /**
     * Whether current node is an element of a sequential node.
     * Consider as false if no value provided.
     */
    readonly isSequenceElement?: boolean;
    /**
     * The value of the leaf node.
     * Consider the node as not a leaf node if no value provided.
     */
    readonly value?: any;
}

export class ConfigTreeItem extends TreeItem {
    /**
     * Node identifier.
     */
    public key: string;
    /**
     * Children nodes indexed by node identifiers.
     */
    public children: Map<string, ConfigTreeItem>;
    /**
     * Value of the node, if any.
     */
    public value?: any;
    /**
     * The value configured by default.
     * This field is only set for patched items.
     */
    public defaultValue: any;
    /**
     * The kind of the file when the node is a config file.
     */
    public fileKind?: FileKind;
    /**
     * Path to the configuration file that contains the current node.
     */
    public configFilePath: string;
    /**
     * Whether current node is representing a sequential node.
     */
    public isSequence: boolean = false;
    /**
     * Whether if current node is an element in a sequence.
     */
    public isSequenceElement: boolean = false;
    /**
     * Whether if current node is a patched node.
     */
    public isPatched: boolean = false;
    /**
     * Kind of the item.
     */
    public readonly kind: ItemKind;
    constructor(options: ConfigTreeItemOptions) {
        super(
            options.value
                ? (options.isSequenceElement ? options.value : `${options.key}: ${options.value}`)
                : options.key,
            options.children.size > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        this.key = options.key;
        this.children = options.children;
        this.value = options.value;
        this.configFilePath = options.configFilePath;
        this.kind = options.kind;
        this.fileKind = options.fileKind;
        this.isSequence = options.isSequence || false;
        this.isSequenceElement = options.isSequenceElement || false;

        this.contextValue = options.kind.toString();
        this.tooltip = options.value ? `value: ${options.value}` : undefined;
        this.iconPath = this._getIconPath(options.kind, options.fileKind);
    }

    /**
     * Does current node has any child nodes.
     * @returns {boolean} Whether if current node has any child node.
     */
    get hasChildren(): boolean {
        return this.children.size > 0;
    }

    get isCustomFile(): boolean {
        return this.fileKind === FileKind.Custom;
    }

    public update(newItem: ConfigTreeItem) {
        this.defaultValue = this.value;
        this.value = newItem.value;

        this.fileKind = newItem.fileKind;
        this.configFilePath = newItem.configFilePath;
        this.isSequence = newItem.isSequence || false;
        this.isSequenceElement = newItem.isSequenceElement || false;
        this.contextValue = newItem.kind.toString();

        if (newItem.fileKind === FileKind.Custom) {
            this.isPatched = true;
        }
        if (this.value) {
            this.label = this.isSequenceElement ? this.value : `${this.key}: ${this.value}`;
        }
        if (this.defaultValue) {
            this.tooltip = this.value ? `current: ${this.value}\ndefault: ${this.defaultValue}` : undefined;
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

    private _getIconPath(itemKind: ItemKind, fileKind: FileKind | undefined): string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri; } | vscode.ThemeIcon | undefined {
        let iconFullName: string = '';
        switch (itemKind) {
            case ItemKind.Folder:
                iconFullName = 'folder.png';
                break;
            case ItemKind.File:
            case ItemKind.Node:
                switch (fileKind) {
                    case FileKind.Program:
                        iconFullName = 'program.png';
                        break;
                    case FileKind.Default:
                        iconFullName = 'default.png';
                        break;
                    case FileKind.Schema:
                        iconFullName = 'schema.png';
                        break;
                    case FileKind.Custom:
                        iconFullName = 'patch.png';
                        break;
                    case FileKind.Other:
                        iconFullName = 'other.png';
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
        if (iconFullName === '') {
            return undefined;
        }
        return {
            'light': path.join(__filename, '..', '..', 'resources', 'light', 'configKind', iconFullName),
            'dark': path.join(__filename, '..', '..', 'resources', 'dark', 'configKind', iconFullName),
        };
    }
}

export class RimeConfigurationTree {
    public configTree: ConfigTreeItem = new ConfigTreeItem({ key: 'ROOT', children: new Map(), kind: ItemKind.Root, configFilePath: '' });
    /**
     * Configuration tree, including config files, in the program config folder.
     */
    public programConfigTree: ConfigTreeItem = new ConfigTreeItem({
        key: 'PROGRAM',
        children: new Map(),
        configFilePath: '',
        kind: ItemKind.Folder
    });
    /**
     * Configuration tree, including config files, in the user config folder.
     */
    public userConfigTree: ConfigTreeItem = new ConfigTreeItem({
        key: 'USER',
        children: new Map(),
        configFilePath: '',
        kind: ItemKind.Folder
    });

    private static readonly PROGRAM_CONFIG_LABEL: string = 'Program Config';
    private static readonly USER_CONFIG_LABEL: string = 'User Config';
    private userConfigDir: string = "";
    private programConfigDir: string = "";

    constructor() {
    }

    public async build() {
        const programConfigDirConfigKey: string = "programConfigDir";
        const userConfigDirConfigKey: string = "userConfigDir";
        const rimeAssistantConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('rimeAssistant');
        if (rimeAssistantConfiguration.has(programConfigDirConfigKey)
            && await existsAsync(rimeAssistantConfiguration.get(programConfigDirConfigKey) as string)) {
            this.programConfigDir = rimeAssistantConfiguration.get(programConfigDirConfigKey) as string;
        } else {
            // Squirrel: /Library/Input\ Methods/Squirrel.app/Contents/SharedSupport/
            // this.programConfigDir = path.join('Library', 'Input Methods', 'Squirrel.app', 'Contents', 'SharedSupport');
            // 'C:\\Program Files (x86)\\Rime\\weasel-0.14.3\\data'
            this.programConfigDir = path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
        }
        if (rimeAssistantConfiguration.has(userConfigDirConfigKey)
            && await existsAsync(rimeAssistantConfiguration.get(userConfigDirConfigKey) as string)) {
            this.userConfigDir = rimeAssistantConfiguration.get(userConfigDirConfigKey) as string;
        } else {
            // Squirrel: /Users/Mengqi/Library/Rime
            // this.userConfigDir = path.join('Users', 'Mengqi', 'Library', 'Rime');
            // 'C:\\Users\\mengq\\AppData\\Roaming\\Rime'
            this.userConfigDir = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime');
        }
        this.programConfigTree = await this._buildConfigTreeFromFiles(
            this.programConfigDir, RimeConfigurationTree.PROGRAM_CONFIG_LABEL);
        this.userConfigTree = await this._buildConfigTreeFromFiles(
            this.userConfigDir, RimeConfigurationTree.USER_CONFIG_LABEL);
        this.configTree.children = this._applyPatch(this.programConfigTree, this.userConfigTree);
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
        // Files are collected now.
        // Apply custom pactches if needed.
        // For schema config, will also need to override default config.
        // Config priority:
        // - schema config: schema.custom.yaml > schema.yaml > default.custom.yaml > default.yaml
        // - other config: foo.custom > foo
        let fileMap: Map<string, ConfigTreeItem> = this._mergeFilesInSameFolder(fileItems);
        return new ConfigTreeItem({
            key: label,
            children: fileMap,
            configFilePath: configDir,
            kind: ItemKind.Folder
        });
    }

    private _mergeFilesInSameFolder(fileItems: ConfigTreeItem[]) {
        let fileMap: Map<string, ConfigTreeItem> = new Map();
        fileItems.forEach((fileItem: ConfigTreeItem) => {
            if (!fileMap.has(fileItem.key)) {
                fileMap.set(fileItem.key, fileItem);
            }
            else {
                // TODO: merge the similar logic with the one in _applyPatch
                // The file already exists in merged tree. Check if merge is needed.
                let [fileToPatch, patchFile] = this._distinguishFileToPatchWithPatchFile(fileMap.get(fileItem.key)!, fileItem);
                if (fileToPatch === null || patchFile === null || !patchFile.children.has('patch')) {
                    return;
                }

                const patchNode: ConfigTreeItem = patchFile.children.get('patch')!;
                fileMap.set(fileToPatch.key, this._mergeTree(fileToPatch, patchNode));
            }
        });
        return fileMap;
    }

    protected _cloneTree(tree: ConfigTreeItem): ConfigTreeItem {
        return _.cloneDeep(tree);
    }

    protected async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
        const fullName: string = path.join(filePath, fileName);
        const data = await readFileAsync(fullName);

        const doc: YAML.Document.Parsed = YAML.parseDocument(data.toString());

        const fileKind: FileKind = this._categoriseConfigFile(fileName);
        const fileLabel: string = fileName.replace('.yaml', '').replace('.custom', '').replace('.schema', '');
        // The root node is representing the configuration file.
        let rootNode: ConfigTreeItem = new ConfigTreeItem({ 
            key: fileLabel, 
            children: new Map(), 
            configFilePath: fullName, 
            kind: ItemKind.File, 
            fileKind: fileKind });
        if (doc.contents === null) {
            return rootNode;
        }
        // Build ConfigNode tree by traversing the nodeTree object.
        this._buildConfigTree(doc.contents, rootNode, fullName, fileKind);
        if (fileKind === FileKind.Schema
            && rootNode.hasChildren
            && rootNode.children.has('schema')) {
            const schemaMetadata: ConfigTreeItem = rootNode.children.get('schema')!;
            this._setSchemaNameAsLabel(schemaMetadata, rootNode);
            this._setMetadataAsTooltip(schemaMetadata, rootNode);
        }
        return rootNode;
    }

    /**
     * Build up a configuration tree based on the object tree parsed.
     * @param {Node} doc The root node of the object tree parsed from yaml file.
     * @param {ConfigTreeItem} rootNode The current traversed node in the configuration tree we are building.
     * @param {string} fullPath The full path of the configuration file.
     * @param {FileKind} fileKind Kind of the configuration file.
     */
    protected _buildConfigTree(doc: Node, rootNode: ConfigTreeItem, fullPath: string, fileKind: FileKind) {
        if (doc instanceof YAMLMap || doc instanceof YAMLSeq) {
            doc.items.forEach((pair: Pair) => {
                let current: ConfigTreeItem = rootNode;
                let key: string = (pair.key as Scalar).value;
                let value: any = pair.value;
                // If the key has slash, create separate nodes for each part.
                // For instance, "foo/bar/baz: 1" should be created as a four-layer tree.
                if (key.indexOf("/") !== -1) {
                    let leafNode: ConfigTreeItem | undefined = this._buildSlashSeparatedNodes(key, current, fileKind, fullPath);
                    if (leafNode) {
                        current = leafNode;
                        key = key.substring(key.lastIndexOf("/") + 1);
                    }
                }
                if (value instanceof Scalar) {
                    // Current node is a leaf node in the object tree.
                    current.addChildNode(new ConfigTreeItem({ 
                        key: key, 
                        children: new Map(), 
                        configFilePath: fullPath, 
                        value: this._formatScalarValue(value), 
                        kind: ItemKind.Node, 
                        fileKind: fileKind 
                    }));
                } else if (value instanceof YAMLMap) {
                    // Current node in the object tree has children.
                    let childNode: ConfigTreeItem = new ConfigTreeItem({ key: key, children: new Map(), configFilePath: fullPath, kind: ItemKind.Node, fileKind: fileKind });
                    current.addChildNode(childNode);
                    this._buildConfigTree(value, childNode, fullPath, fileKind);
                } else if (value instanceof YAMLSeq) {
                    // Current node in the object tree has children and it's an array.
                    let childNode: ConfigTreeItem = new ConfigTreeItem({ key: key, children: new Map(), configFilePath: fullPath, kind: ItemKind.Node, fileKind: fileKind, isSequence: true });
                    current.addChildNode(childNode);
                    value.items.forEach((valueItem: Node, itemIndex: number) => {
                        if (valueItem instanceof Scalar) {
                            let grandChildNode: ConfigTreeItem = new ConfigTreeItem({ 
                                key: itemIndex.toString(), 
                                children: new Map(), 
                                configFilePath: fullPath, 
                                kind: ItemKind.Node, 
                                fileKind: fileKind, 
                                value: this._formatScalarValue(valueItem), 
                                isSequenceElement: true 
                            });
                            childNode.addChildNode(grandChildNode);
                        } else {
                            let grandChildNode: ConfigTreeItem = new ConfigTreeItem({ 
                                key: itemIndex.toString(), 
                                children: new Map(), 
                                configFilePath: fullPath, 
                                kind: ItemKind.Node, 
                                fileKind: fileKind, 
                                isSequenceElement: true 
                            });
                            childNode.addChildNode(grandChildNode);
                            this._buildConfigTree(valueItem, grandChildNode, fullPath, fileKind);
                        }
                    });
                }
            });
        } else if (doc instanceof Scalar) {
            rootNode.value = this._formatScalarValue(doc);
        }
    }

    /**
     * Recursively build multi-layer nodes according to the keys separated by slash.
     * For instance, given the key "foo/bar/baz", there would be 3 layers of nodes: foo -> bar -> baz.
     * @param {string} key The original key composing multi-layer keys by slashes, such as foo/bar/baz.
     * @param {ConfigTreeItem} rootNode The root node to build from.
     * @param {FileKind} fileKind The kind of the config file.
     * @param {string} filePath Path to the config file.
     * @returns {ConfigTreeItem} The leaf node built.
     */
    protected _buildSlashSeparatedNodes(key: string, rootNode: ConfigTreeItem, fileKind: FileKind, filePath: string): ConfigTreeItem | undefined {
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
            configFilePath: filePath,
            kind: ItemKind.Node,
            fileKind: fileKind
        });
        // add childNode as a child of rootNode, and then point to the childNode as current.
        rootNode = rootNode.addChildNode(childNode);
        return this._buildSlashSeparatedNodes(key.substring(key.indexOf("/") + 1), rootNode, fileKind, filePath);
    }

    /**
     * Apply patches to the file to patch.
     * @param {ConfigTreeItem} programConfigTree The program config tree.
     * @param {ConfigTreeItem} userConfigTree The user config tree.
     * @returns {Map<string, ConfigTreeItem>} The merged children map after applied patches.
     */
    protected _applyPatch(programConfigTree: ConfigTreeItem, userConfigTree: ConfigTreeItem): Map<string, ConfigTreeItem> {
        let mergedMap: Map<string, ConfigTreeItem> = new Map();
        mergedMap = programConfigTree.children;
        userConfigTree.children.forEach((userFileItem: ConfigTreeItem, fileKey: string) => {
            if (!mergedMap.has(fileKey)) {
                mergedMap.set(fileKey, userFileItem);
            } else {
                // The file already exists in merged tree. Check if merge is needed.
                let [fileToPatch, patchFile] 
                    = this._distinguishFileToPatchWithPatchFile(mergedMap.get(fileKey)!, userFileItem);
                if (fileToPatch === null || patchFile === null || !patchFile.children.has('patch')) {
                    return;
                }

                const patchNode: ConfigTreeItem = patchFile.children.get('patch')!;
                mergedMap.set(fileKey, this._mergeTree(fileToPatch, patchNode));
            }
        });
        // The default config node should now be patched.
        if (mergedMap.has('default')) {
            let defaultTree: ConfigTreeItem = mergedMap.get('default')!;
            // Override default config for schema config.
            mergedMap.forEach((fileItem: ConfigTreeItem, fileKey: string) => {
                if (fileItem.fileKind === FileKind.Schema) {
                    let mergedTree: ConfigTreeItem = this._cloneTree(fileItem);
                    mergedTree.children = this._mergeTree(defaultTree, fileItem).children;
                    mergedMap.set(fileKey, mergedTree);
                }
            });
        }
        mergedMap.delete('default');
        return mergedMap;
    }

    /**
     * Merge two trees. The merged result is updated based on a clone of tree A.
     * @param {ConfigTreeItem} treeA The root node of the first tree to be merged.
     * @param {ConfigTreeItem} treeB The root node of the second tree to be merged.
     * @returns {ConfigTreeItem} The root node of the merged tree.
     */
    protected _mergeTree(treeA: ConfigTreeItem, treeB: ConfigTreeItem): ConfigTreeItem {
        if (treeB.key !== 'patch' && treeA.key !== 'default' && treeA.key !== treeB.key) {
            throw new Error('The trees to be merged have no common ancestor.');
        }
        let mergedTree: ConfigTreeItem = this._cloneTree(treeA);
        if (treeA.value && treeB.value && treeA.value !== treeB.value) {
            // TODO: distinguish the override-default one with the custom-patch one.
            mergedTree.update(treeB);
            return mergedTree;
        }
        treeB.children.forEach((childB: ConfigTreeItem, childBKey: string) => {
            if (treeA.children.has(childBKey)) {
                // The childB is also in tree A.
                const childA: ConfigTreeItem = treeA.children.get(childBKey)!;
                if (childA.isSequence && childB.isSequence) {
                    // Override child A when both are arrays.
                    mergedTree.children.set(childBKey, childB);
                } else {
                    const mergedChild: ConfigTreeItem = this._mergeTree(childA, childB);
                    mergedTree.children.set(childBKey, mergedChild);
                }
            } else {
                // The childB is a new node to tree A.
                mergedTree.addChildNode(childB);
            }
        });
        return mergedTree;
    }

    private _categoriseConfigFile(fileNameWithExtensions: string): FileKind {
        const fileName: string = fileNameWithExtensions.replace('.yaml', '');
        if (fileName === 'default') {
            return FileKind.Default;
        } else if (fileName.endsWith('schema')) {
            return FileKind.Schema;
        } else if (fileName.endsWith('custom')) {
            return FileKind.Custom;
        } else if (['weasel', 'squirrel', 'ibus_rime', 'installation', 'user'].indexOf(fileName) !== -1) {
            return FileKind.Program;
        } else {
            return FileKind.Other;
        }
    }

    private _setMetadataAsTooltip(schemaMetadata: ConfigTreeItem, rootNode: ConfigTreeItem) {
        if (!schemaMetadata.hasChildren) {
            return;
        }
        let tooltipLines: string[] = [];
        if (schemaMetadata.children.has('author')) {
            if (schemaMetadata.children.get('author')!.value) {
                tooltipLines.push(`作者：${schemaMetadata.children.get('author')!.value}`);
            } else if (schemaMetadata.children.get('author')!.hasChildren) {
                tooltipLines.push('作者：');
                schemaMetadata.children.get('author')!.children.forEach((authorItem: ConfigTreeItem) => {
                    if (authorItem.isSequenceElement) {
                        tooltipLines.push(`${authorItem.label}`);
                    }
                });
            }
        }
        if (schemaMetadata.children.has('version')
            && schemaMetadata.children.get('version')!.value) {
            tooltipLines.push(`版本：${schemaMetadata.children.get('version')!.value}`);
        }
        if (schemaMetadata.children.has('description')
            && schemaMetadata.children.get('description')!.value) {
            tooltipLines.push(`------\n${schemaMetadata.children.get('description')!.value}`);
        }
        rootNode.tooltip = tooltipLines.join('\n');
    }

    private _setSchemaNameAsLabel(schemaMetadata: ConfigTreeItem, fileNode: ConfigTreeItem) {
        if (schemaMetadata.hasChildren
            && schemaMetadata.children.has('name')
            && schemaMetadata.children.get('name')!.value) {
            fileNode.label = schemaMetadata.children.get('name')!.value;
        }
    }

    private _distinguishFileToPatchWithPatchFile(oneFile: ConfigTreeItem, anotherFile: ConfigTreeItem): [ConfigTreeItem | null, ConfigTreeItem | null] {
        if (!oneFile.isCustomFile && anotherFile.isCustomFile) {
            return [oneFile, anotherFile];
        } else if (oneFile.isCustomFile && !anotherFile.isCustomFile) {
            return [anotherFile, oneFile];
        } else {
            return [null, null];
        }
    }

    private _formatScalarValue(doc: Scalar): any {
        if (doc.format === 'HEX') {
            return stringify(doc);
        }
        return doc.value;
    }
}
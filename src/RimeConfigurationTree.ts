import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import util = require('util');
import * as Yaml from 'yaml-ast-parser';
import { determineScalarType, ScalarType } from 'yaml-ast-parser';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { YAMLNode, YAMLScalar } from 'yaml-ast-parser';

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
const statAsync = util.promisify(fs.stat);
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
    DefaultCustom,
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
    readonly children: Map<string, RimeConfigNode>;
    /**
     * The kind of the config file containing this item.
     */
    readonly kind: ItemKind;
    /**
     * Full path of the config file containing current node, used for navigation.
     */
    readonly configFilePath: string;
    /**
     * Offset of the node in the original config file.
     */
    readonly configOffset?: number;
    /**
     * Length of the node in the original config file.
     */
    readonly configLength?: number;
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

export class RimeConfigNode extends TreeItem {
    /**
     * Node identifier.
     */
    public key: string;
    /**
     * Children nodes indexed by node identifiers.
     */
    public children: Map<string, RimeConfigNode>;
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
     * Offset of the node in the original config file.
     */
    public configOffset: number = 0;
    /**
     * Length of the node in the original config file.
     */
    public configLength: number = 0;
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
        this.configOffset = options.configOffset || 0;
        this.configLength = options.configLength || 0;
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
        return this.fileKind === FileKind.Custom || this.fileKind === FileKind.DefaultCustom;
    }

    /**
     * Update current node.
     * @param {RimeConfigNode} newNode The new node to update to.
     */
    public update(newNode: RimeConfigNode) {
        this.defaultValue = this.value;
        this.value = newNode.value;

        this.fileKind = newNode.fileKind;
        this.configFilePath = newNode.configFilePath;
        this.iconPath = newNode.iconPath;
        this.isSequence = newNode.isSequence || false;
        this.isSequenceElement = newNode.isSequenceElement || false;
        this.contextValue = newNode.kind.toString();

        if (newNode.isCustomFile) {
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
     * @param childNode {RimeConfigNode} The child node to add.
     * @returns {RimeConfigNode} The child node added. Could be the existing node if there is a same child.
     */
    public addChildNode(childNode: RimeConfigNode): RimeConfigNode {
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
                switch (fileKind) {
                    case FileKind.Program:
                        iconFullName = 'program.png';
                        break;
                    case FileKind.Default:
                        iconFullName = 'default.png';
                        break;
                    case FileKind.DefaultCustom:
                        iconFullName = 'default-patch.png';
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
            case ItemKind.Node:
                switch (fileKind) {
                    case FileKind.Program:
                        iconFullName = 'program.png';
                        break;
                    case FileKind.Default:
                        iconFullName = 'default.png';
                        break;
                    case FileKind.DefaultCustom:
                        iconFullName = 'default-patch.png';
                        break;
                    case FileKind.Schema:
                        iconFullName = 'schema-node.png';
                        break;
                    case FileKind.Custom:
                        iconFullName = 'schema-node-patch.png';
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
    public configTree: RimeConfigNode = new RimeConfigNode({ 
        key: 'ROOT', 
        children: new Map(), 
        kind: ItemKind.Root, 
        configFilePath: ''
    });
    /**
     * Configuration tree, including config files, in the program config folder.
     */
    public sharedConfigFolderNode: RimeConfigNode = new RimeConfigNode({
        key: 'PROGRAM',
        children: new Map(),
        configFilePath: '',
        kind: ItemKind.Folder,
    });
    /**
     * Configuration tree, including config files, in the user config folder.
     */
    public userConfigFolderNode: RimeConfigNode = new RimeConfigNode({
        key: 'USER',
        children: new Map(),
        configFilePath: '',
        kind: ItemKind.Folder
    });

    private static readonly SHARED_CONFIG_LABEL: string = 'Shared Config';
    private static readonly USER_CONFIG_LABEL: string = 'User Config';
    private userConfigDir: string = "";
    private sharedConfigDir: string = "";

    constructor() {
    }

    public async build() {
        const sharedConfigDirConfigKey: string = "sharedConfigDir";
        const userConfigDirConfigKey: string = "userConfigDir";
        const rimeAssistantConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('rimebow');
        if (rimeAssistantConfiguration.has(sharedConfigDirConfigKey)
            && await existsAsync(rimeAssistantConfiguration.get(sharedConfigDirConfigKey) as string)) {
            this.sharedConfigDir = rimeAssistantConfiguration.get(sharedConfigDirConfigKey) as string;
        } else {
            this.sharedConfigDir = await this._getDefaultSharedConfigDir();
        }
        if (rimeAssistantConfiguration.has(userConfigDirConfigKey)
            && await existsAsync(rimeAssistantConfiguration.get(userConfigDirConfigKey) as string)) {
            this.userConfigDir = rimeAssistantConfiguration.get(userConfigDirConfigKey) as string;
        } else {
            this.userConfigDir = await this._getUserConfigDir();
        }

        const sharedConfigFiles = await this._buildConfigTreeFromFiles(
            this.sharedConfigDir, RimeConfigurationTree.SHARED_CONFIG_LABEL);
        const userConfigFiles = await this._buildConfigTreeFromFiles(
            this.userConfigDir, RimeConfigurationTree.USER_CONFIG_LABEL);
        this.sharedConfigFolderNode.configFilePath = this.sharedConfigDir;
        this.userConfigFolderNode.configFilePath = this.userConfigDir;

        this._setupNodesForFileExplorer(sharedConfigFiles, this.sharedConfigFolderNode);
        this._setupNodesForFileExplorer(userConfigFiles, this.userConfigFolderNode);

        this.configTree.children = this._applyPatchesToSharedConfig(sharedConfigFiles, userConfigFiles);
    }

    /**
     * Build config tree for all the files in the given directory.
     * @param {string} configDir The directory path containing config files.
     * @param {string} label The label of the config directory.
     * @returns {Promise<RimeConfigNode[]>} A promise result containing a list of config nodes parsed.
     */
    private async _buildConfigTreeFromFiles(configDir: string, label: string): Promise<RimeConfigNode[]> {
        const filesResult: Promise<string[]> = readDirAsync(configDir);
        const fileNames = await filesResult;
        const promises: Promise<RimeConfigNode>[] = fileNames
            .filter((fileName: string) => fileName.endsWith('.yaml') && !fileName.endsWith('.dict.yaml'))
            .map(async (fileName: string): Promise<RimeConfigNode> => {
                return await this._buildConfigTreeFromFile(configDir, fileName);
            });
        const fileItems: RimeConfigNode[] = await Promise.all(promises).catch(() => []);
        return fileItems;
    }

    protected async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<RimeConfigNode> {
        const fullName: string = path.join(filePath, fileName);
        const data = await readFileAsync(fullName);

        const doc: Yaml.YAMLNode = Yaml.load(data.toString());

        const fileKind: FileKind = this._categoriseConfigFile(fileName);
        const fileLabel: string = fileName.replace('.yaml', '').replace('.custom', '').replace('.schema', '');
        // The root node is representing the configuration file.
        let rootNode: RimeConfigNode = new RimeConfigNode({ 
            key: fileLabel, 
            children: new Map(), 
            configFilePath: fullName, 
            kind: ItemKind.File, 
            fileKind: fileKind });
        if (doc === null) {
            return rootNode;
        }
        // Build ConfigNode tree by traversing the nodeTree object.
        this._buildConfigTree(doc, rootNode, fullName, fileKind);
        if (fileKind === FileKind.Schema
            && rootNode.hasChildren
            && rootNode.children.has('schema')) {
            const schemaMetadata: RimeConfigNode = rootNode.children.get('schema')!;
            this._setSchemaNameAsLabel(schemaMetadata, rootNode);
            this._setMetadataAsTooltip(schemaMetadata, rootNode);
        }
        return rootNode;
    }

    /**
     * Build up a configuration tree based on the object tree parsed.
     * @param {YAMLNode} node The root node of the object tree parsed from yaml file.
     * @param {RimeConfigNode} rootNode The current traversed node in the configuration tree we are building.
     * @param {string} fullPath The full path of the configuration file.
     * @param {FileKind} fileKind Kind of the configuration file.
     */
    protected _buildConfigTree(node: YAMLNode, rootNode: RimeConfigNode, fullPath: string, fileKind: FileKind) {
        if (node === undefined || node === null) {
            return;
        }
        switch (node.kind) {
            case Yaml.Kind.MAP:
                let mapNode: Yaml.YamlMap = <Yaml.YamlMap>node;
                mapNode.mappings.forEach((mapping: Yaml.YAMLMapping) => {
                    this._buildASTNode(mapping, rootNode, fullPath, fileKind);
                });
                break;
            case Yaml.Kind.SEQ:
                let sequenceNode: Yaml.YAMLSequence = <Yaml.YAMLSequence>node;
                sequenceNode.items.forEach((itemNode: YAMLNode) => {
                    this._buildASTNode(itemNode, rootNode, fullPath, fileKind);
                });
                break;
            case Yaml.Kind.SCALAR:
                rootNode.value = this._formatScalarValue(<Yaml.YAMLScalar>node);
                break;
            default:
                break;
        }
    }

    private _buildASTNode(mapping: YAMLNode, rootNode: RimeConfigNode, fullPath: string, fileKind: FileKind) {
        if (mapping.key === undefined || mapping.key === null) {
            return;
        }
        let current: RimeConfigNode = rootNode;
        let key: string = mapping.key!.value;
        let mappingStartPos: number = mapping.key!.startPosition;
        let mappingLength: number = mapping.key!.endPosition - mapping.key!.startPosition;
        let value: YAMLNode = mapping.value;
        // If the key has slash, create separate nodes for each part.
        // For instance, "foo/bar/baz: 1" should be created as a four-layer tree.
        if (key.indexOf("/") !== -1) {
            let leafNode: RimeConfigNode | undefined = this._buildSlashSeparatedNodes(key, current, mapping.key.startPosition, fileKind, fullPath);
            if (leafNode) {
                current = leafNode;
                const lastSlashInKeyIdx: number = key.lastIndexOf("/");
                // Update current mapping to the leaf node (the part after the last "/").
                key = key.substring(lastSlashInKeyIdx + 1);
                mappingStartPos = mappingStartPos + lastSlashInKeyIdx + 1;
                mappingLength = mappingLength - (lastSlashInKeyIdx + 1);
            }
        }
        switch (value.kind) {
            case Yaml.Kind.SCALAR:
                // Current node is a leaf node in the object tree.
                current.addChildNode(new RimeConfigNode({ 
                    key: key, 
                    children: new Map(), 
                    configFilePath: fullPath, 
                    configOffset: value.startPosition,
                    configLength: value.endPosition - value.startPosition,
                    value: this._formatScalarValue(<Yaml.YAMLScalar>value), 
                    kind: ItemKind.Node, 
                    fileKind: fileKind 
                }));
                break;
            case Yaml.Kind.MAP:
                // Current node in the object tree has children.
                let childMapNode: RimeConfigNode = new RimeConfigNode({ 
                    key: key, 
                    children: new Map(), 
                    configFilePath: fullPath, 
                    configOffset: mappingStartPos,
                    configLength: mappingLength,
                    kind: ItemKind.Node, 
                    fileKind: fileKind 
                });
                current.addChildNode(childMapNode);
                this._buildConfigTree(value, childMapNode, fullPath, fileKind);
                break;
            case Yaml.Kind.SEQ:
                // Current node in the object tree has children and it's an array.
                let childSeqNode: RimeConfigNode = new RimeConfigNode({ 
                    key: key, 
                    children: new Map(), 
                    configFilePath: fullPath, 
                    configOffset: mappingStartPos,
                    configLength: mappingLength,
                    kind: ItemKind.Node, 
                    fileKind: fileKind, 
                    isSequence: true 
                });
                current.addChildNode(childSeqNode);
                let valueSeq: Yaml.YAMLSequence = <Yaml.YAMLSequence>value;
                valueSeq.items?.forEach((valueItem: YAMLNode, itemIndex: number) => {
                    if (valueItem.kind === Yaml.Kind.SCALAR) {
                        let grandChildNode: RimeConfigNode = new RimeConfigNode({ 
                            key: itemIndex.toString(), 
                            children: new Map(), 
                            configFilePath: fullPath, 
                            configOffset: valueItem.startPosition,
                            configLength: valueItem.endPosition - valueItem.startPosition,
                            kind: ItemKind.Node, 
                            fileKind: fileKind, 
                            value: this._formatScalarValue(<Yaml.YAMLScalar>valueItem), 
                            isSequenceElement: true 
                        });
                        childSeqNode.addChildNode(grandChildNode);
                    } else {
                        let grandChildNode: RimeConfigNode = new RimeConfigNode({ 
                            key: itemIndex.toString(), 
                            children: new Map(), 
                            configFilePath: fullPath, 
                            configOffset: valueItem.startPosition,
                            configLength: valueItem.endPosition - valueItem.startPosition,
                            kind: ItemKind.Node, 
                            fileKind: fileKind, 
                            isSequenceElement: true 
                        });
                        childSeqNode.addChildNode(grandChildNode);
                        this._buildConfigTree(valueItem, grandChildNode, fullPath, fileKind);
                    }
                });
                break;
            default:
                break;
        }
    }

    /**
     * Recursively build multi-layer nodes according to the keys separated by slash.
     * For instance, given the key "foo/bar/baz", there would be 3 layers of nodes: foo -> bar -> baz.
     * @param {string} key The original key composing multi-layer keys by slashes, such as foo/bar/baz.
     * @param {RimeConfigNode} rootNode The root node to build from.
     * @param {number} keyStartPos The start position of the key in the original config file.
     * @param {FileKind} fileKind The kind of the config file.
     * @param {string} filePath Path to the config file.
     * @returns {RimeConfigNode} The leaf node built.
     */
    protected _buildSlashSeparatedNodes(
        key: string, 
        rootNode: RimeConfigNode, 
        keyStartPos: number, 
        fileKind: FileKind, 
        filePath: string): RimeConfigNode | undefined {
        if (key === undefined || key === null) {
            return;
        }
        // Reached leaf.
        if (key.indexOf("/") === -1) {
            return rootNode;
        }

        const firstSlashInKeyIdx: number = key.indexOf("/");
        const childNode: RimeConfigNode = new RimeConfigNode({
            key: key.substring(0, key.indexOf("/")),
            children: new Map(),
            configFilePath: filePath,
            configOffset: keyStartPos,
            configLength: firstSlashInKeyIdx,
            kind: ItemKind.Node,
            fileKind: fileKind
        });
        // add childNode as a child of rootNode, and then point to the childNode as current.
        rootNode = rootNode.addChildNode(childNode);
        return this._buildSlashSeparatedNodes(key.substring(firstSlashInKeyIdx + 1), rootNode, keyStartPos + firstSlashInKeyIdx + 1, fileKind, filePath);
    }

    /**
     * Apply patches from user config files to shared config files.
     * - When a default config file (the non-custom file) exists in both user config folder and shared config folder, use the user config one.
     * - When applying patches, patch nodes in user config will override the one in its default config.
     * For instance, patches in foo.custom.yaml overrides nodes in foo.yaml (the one in user config folder or the one in shared config folder).
     * - When applying schema patches, patch nodes in user config will first override the one in the default schema config (*.schema.yaml),
     * and then override the one in the default config (default.custom.yaml + default.yaml).
     * 
     * Config priority:
     * - schema config: schema.custom.yaml > schema.yaml > default.custom.yaml > default.yaml
     * - other config: foo.custom > foo
     * @param {RimeConfigNode[]} sharedConfigFiles A list of shared config file nodes.
     * @param {RimeConfigNode[]} userConfigFiles A list of user config file nodes.
     * @returns {Map<string, RimeConfigNode>} The merged children map after applied patches.
     */
    protected _applyPatchesToSharedConfig(sharedConfigFiles: RimeConfigNode[], userConfigFiles: RimeConfigNode[]): Map<string, RimeConfigNode> {
        // Collect and override non-custom files.
        let mergedResult: Map<string, RimeConfigNode> = new Map();
        let nonCustomFiles: Map<string, RimeConfigNode> = new Map();
        sharedConfigFiles.forEach((sharedConfigFile: RimeConfigNode) => {
            if (!nonCustomFiles.has(sharedConfigFile.key)) {
                nonCustomFiles.set(sharedConfigFile.key, sharedConfigFile);
                mergedResult.set(sharedConfigFile.key, sharedConfigFile);
            }
        });
        userConfigFiles.filter((userConfigFile: RimeConfigNode) => !userConfigFile.isCustomFile)
            .forEach((userConfigFile: RimeConfigNode) => {
                nonCustomFiles.set(userConfigFile.key, userConfigFile);
                mergedResult.set(userConfigFile.key, userConfigFile);
            });

        userConfigFiles.filter((userConfigFile: RimeConfigNode) => userConfigFile.isCustomFile)
            .forEach((userCustomFile: RimeConfigNode) => {
                if (!nonCustomFiles.has(userCustomFile.key)) {
                    return;
                } 
                const fileToPatch = nonCustomFiles.get(userCustomFile.key)!;
                // The file already exists in merged tree. Check if merge is needed.
                if (!userCustomFile.children.has('patch')) {
                    return;
                }

                const patchNode: RimeConfigNode = userCustomFile.children.get('patch')!;
                mergedResult.set(userCustomFile.key, this._mergeTree(fileToPatch, patchNode));
            });

        // The default config file (default.yaml) now has been merged with the custom default config (default.custom.yaml).
        if (mergedResult.has('default')) {
            let defaultConfig: RimeConfigNode = mergedResult.get('default')!;
            // For each schema config, override default config.
            mergedResult.forEach((configFile: RimeConfigNode, fileKey: string) => {
                if (configFile.fileKind !== FileKind.Schema) {
                    return;
                }
                let mergedTree: RimeConfigNode = this._cloneTree(configFile);
                mergedTree.children = this._mergeTree(defaultConfig, configFile).children;
                mergedResult.set(fileKey, mergedTree);
            });
        }
        return mergedResult;
    }

    protected _cloneTree(tree: RimeConfigNode): RimeConfigNode {
        return _.cloneDeep(tree);
    }

    /**
     * Merge two trees. The merged result is updated based on a clone of tree A.
     * @param {RimeConfigNode} treeA The root node of the first tree to be merged.
     * @param {RimeConfigNode} treeB The root node of the second tree to be merged.
     * @returns {RimeConfigNode} The root node of the merged tree.
     */
    protected _mergeTree(treeA: RimeConfigNode, treeB: RimeConfigNode): RimeConfigNode {
        if (treeB.key !== 'patch' && treeA.key !== 'default' && treeA.key !== treeB.key) {
            throw new Error('The trees to be merged have no common ancestor.');
        }
        let mergedTree: RimeConfigNode = this._cloneTree(treeA);
        if (treeA.value && treeB.value && treeA.value !== treeB.value) {
            mergedTree.update(treeB);
            return mergedTree;
        }
        treeB.children.forEach((childB: RimeConfigNode, childBKey: string) => {
            if (treeA.children.has(childBKey)) {
                // The childB is also in tree A.
                const childA: RimeConfigNode = treeA.children.get(childBKey)!;
                if (childA.isSequence && childB.isSequence) {
                    // Override child A when both are arrays.
                    mergedTree.children.set(childBKey, childB);
                } else {
                    const mergedChild: RimeConfigNode = this._mergeTree(childA, childB);
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
        if (fileName === 'default.custom') {
            return FileKind.DefaultCustom;
        } else if (fileName === 'default') {
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

    private _setMetadataAsTooltip(schemaMetadata: RimeConfigNode, rootNode: RimeConfigNode) {
        if (!schemaMetadata.hasChildren) {
            return;
        }
        let tooltipLines: string[] = [];
        if (schemaMetadata.children.has('name')
            && schemaMetadata.children.get('name')!.value) {
            tooltipLines.push(`方案：${schemaMetadata.children.get('name')!.value}`);
        }
        if (schemaMetadata.children.has('schema_id')) {
            tooltipLines.push(`ID：${schemaMetadata.children.get('schema_id')!.value}`);
        }
        if (schemaMetadata.children.has('author')) {
            if (schemaMetadata.children.get('author')!.value) {
                tooltipLines.push(`作者：${schemaMetadata.children.get('author')!.value}`);
            } else if (schemaMetadata.children.get('author')!.hasChildren) {
                tooltipLines.push('作者：');
                schemaMetadata.children.get('author')!.children.forEach((authorItem: RimeConfigNode) => {
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

    private _setSchemaNameAsLabel(schemaMetadata: RimeConfigNode, fileNode: RimeConfigNode) {
        if (schemaMetadata.hasChildren
            && schemaMetadata.children.has('name')
            && schemaMetadata.children.get('name')!.value) {
            fileNode.label = schemaMetadata.children.get('name')!.value;
        }
    }

    private _formatScalarValue(valueNode: YAMLScalar): any {
        const base16 = /^0x[0-9a-fA-F]+$/;
        if (base16.test(valueNode.value)) {
            return valueNode.rawValue;
        }
        const scalarType = determineScalarType(valueNode);
        switch (scalarType) {
            case ScalarType.bool:
                return valueNode.valueObject;
            case ScalarType.int:
                return valueNode.valueObject;
            case ScalarType.string:
                return valueNode.value;
            case ScalarType.float:
                return valueNode.valueObject;
            default:
                return valueNode.rawValue;
        }
    }

    private async _getDefaultSharedConfigDir(): Promise<string> {
        switch(process.platform) {
            case "win32":
                const programDir: string = path.join('C:', 'Program Files (x86)', 'Rime');
                const entries: string[] = await readDirAsync(programDir);
                const weaselDirs: string[] = entries
                    .filter((fileName: string) => fileName.startsWith('weasel'))
                    .filter(async (entryName: string) => {
                        const entryStat = await statAsync(path.join(programDir, entryName));
                        return entryStat.isDirectory();
                    });
                if (weaselDirs.length === 1) {
                    // Weasel: C:/Program Files (x86)/Rime/weasel-0.14.3/data
                    return path.join('C:', 'Program Files (x86)', 'Rime', weaselDirs[0], 'data');
                } else {
                    // Return the one modified most recently.
                    return await this._mostRecentModifiedDir(weaselDirs, programDir);
                }
            case "darwin":
                // Squirrel: /Library/Input Methods/Squirrel.app/Contents/SharedSupport/
                return path.join('/Library', 'Input Methods', 'Squirrel.app', 'Contents', 'SharedSupport');
            case "linux":
                // ibus-rime, fcitx-rime: /usr/share/rime-data
                return path.join('/usr', 'share', 'rime-data');
            default:
                throw new Error(`Unsupported platform: ${process.platform}`);
        }
    }

    private async _mostRecentModifiedDir(weaselDirs: string[], programDir: string) {
        const stats: fs.Stats[] = await Promise.all(weaselDirs.map(async (dir: string): Promise<fs.Stats> => {
            return await statAsync(path.join(programDir, dir));
        }));
        let maxMtime: Number = 0;
        let mostRecentDir = "";
        stats.forEach((stat: fs.Stats, index: number) => {
            maxMtime = maxMtime > stat.mtimeMs ? maxMtime : stat.mtimeMs;
            mostRecentDir = weaselDirs[index];
        });
        return path.join(programDir, mostRecentDir);
    }

    private async _getUserConfigDir(): Promise<string> {
        switch(process.platform) {
            case "win32":
                // 'C:\\Users\\mengq\\AppData\\Roaming\\Rime'
                // this.userConfigDir = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime');
                return path.join(process.env.APPDATA!, 'Rime');
            case "darwin":
                // Squirrel: /Users//Library/Rime
                return path.join(process.env.HOME!, 'Library', 'Rime');
            case "linux":
                // ibus-rime: ~/.config/ibus/rime
                // fcitx-rime: ~/.config/fcitx/rime
                const ibusPath: string = path.join(process.env.HOME!, '.config', 'ibus', 'rime');
                if (await existsAsync(ibusPath)) {
                    return ibusPath;
                } else {
                    return path.join(process.env.HOME!, '.config', 'fcitx', 'rime');
                }
            default:
                throw new Error(`Unsupported platform: ${process.platform}`);
        }
    }

    private _setupNodesForFileExplorer(configFiles: RimeConfigNode[], folderNode: RimeConfigNode) {
        configFiles.filter((fileNode: RimeConfigNode) => !fileNode.isCustomFile)
            .forEach((fileNode: RimeConfigNode) => {
                const fileKey = `${fileNode.key}.yaml`;
                let clonedNode = this._cloneTree(fileNode);
                clonedNode.collapsibleState = undefined;
                folderNode.children.set(fileKey, clonedNode);
                folderNode.collapsibleState = TreeItemCollapsibleState.Collapsed;
            });
        configFiles.filter((fileNode: RimeConfigNode) => fileNode.isCustomFile)
            .forEach((fileNode: RimeConfigNode) => {
                const customFileKey = `${fileNode.key}.custom.yaml`;
                let clonedNode = this._cloneTree(fileNode);
                clonedNode.collapsibleState = undefined;
                folderNode.children.set(customFileKey, clonedNode);
                folderNode.collapsibleState = TreeItemCollapsibleState.Collapsed;
            });
    }
}
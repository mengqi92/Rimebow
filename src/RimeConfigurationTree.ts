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

    public update(newItem: ConfigTreeItem) {
        this.defaultValue = this.value;
        this.value = newItem.value;

        this.fileKind = newItem.fileKind;
        this.configFilePath = newItem.configFilePath;
        this.isSequence = newItem.isSequence || false;
        this.isSequenceElement = newItem.isSequenceElement || false;
        this.contextValue = newItem.kind.toString();

        if (newItem.fileKind === FileKind.Custom || newItem.fileKind === FileKind.DefaultCustom) {
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
    public configTree: ConfigTreeItem = new ConfigTreeItem({ 
        key: 'ROOT', 
        children: new Map(), 
        kind: ItemKind.Root, 
        configFilePath: ''
    });
    /**
     * Configuration tree, including config files, in the program config folder.
     */
    public sharedConfigTree: ConfigTreeItem = new ConfigTreeItem({
        key: 'PROGRAM',
        children: new Map(),
        configFilePath: '',
        kind: ItemKind.Folder,
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

    private static readonly SHARED_CONFIG_LABEL: string = 'Shared Config';
    private static readonly USER_CONFIG_LABEL: string = 'User Config';
    private userConfigDir: string = "";
    private sharedConfigDir: string = "";

    constructor() {
    }

    public async build() {
        const sharedConfigDirConfigKey: string = "sharedConfigDir";
        const userConfigDirConfigKey: string = "userConfigDir";
        const rimeAssistantConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('rimeAssistant');
        if (rimeAssistantConfiguration.has(sharedConfigDirConfigKey)
            && await existsAsync(rimeAssistantConfiguration.get(sharedConfigDirConfigKey) as string)) {
            this.sharedConfigDir = rimeAssistantConfiguration.get(sharedConfigDirConfigKey) as string;
        } else {
            this.sharedConfigDir = this._getDefaultSharedConfigDir();
        }
        if (rimeAssistantConfiguration.has(userConfigDirConfigKey)
            && await existsAsync(rimeAssistantConfiguration.get(userConfigDirConfigKey) as string)) {
            this.userConfigDir = rimeAssistantConfiguration.get(userConfigDirConfigKey) as string;
        } else {
            this.userConfigDir = this._getUserConfigDir();
        }
        this.sharedConfigTree = await this._buildConfigTreeFromFiles(
            this.sharedConfigDir, RimeConfigurationTree.SHARED_CONFIG_LABEL);
        this.userConfigTree = await this._buildConfigTreeFromFiles(
            this.userConfigDir, RimeConfigurationTree.USER_CONFIG_LABEL);
        this.configTree.children = this._applyPatch(this.sharedConfigTree, this.userConfigTree);
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
        const fileItems: ConfigTreeItem[] = await Promise.all(promises).catch(() => []);
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

        const doc: Yaml.YAMLNode = Yaml.load(data.toString());
        // const doc: YAMLDocument = parseYAML(data.toString());
        // const doc: YAML.Document.Parsed = YAML.parseDocument(data.toString());

        const fileKind: FileKind = this._categoriseConfigFile(fileName);
        const fileLabel: string = fileName.replace('.yaml', '').replace('.custom', '').replace('.schema', '');
        // The root node is representing the configuration file.
        let rootNode: ConfigTreeItem = new ConfigTreeItem({ 
            key: fileLabel, 
            children: new Map(), 
            configFilePath: fullName, 
            kind: ItemKind.File, 
            fileKind: fileKind });
        if (doc === null) {
        // if (doc === null || doc.documents.length === 0 || !doc.documents[0].root) {
            return rootNode;
        }
        // Build ConfigNode tree by traversing the nodeTree object.
        this._buildConfigTree(doc, rootNode, fullName, fileKind);
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
     * @param {YAMLNode} node The root node of the object tree parsed from yaml file.
     * @param {ConfigTreeItem} rootNode The current traversed node in the configuration tree we are building.
     * @param {string} fullPath The full path of the configuration file.
     * @param {FileKind} fileKind Kind of the configuration file.
     */
    protected _buildConfigTree(node: YAMLNode, rootNode: ConfigTreeItem, fullPath: string, fileKind: FileKind) {
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

    private _buildASTNode(mapping: YAMLNode, rootNode: ConfigTreeItem, fullPath: string, fileKind: FileKind) {
        if (mapping.key === undefined || mapping.key === null) {
            return;
        }
        let current: ConfigTreeItem = rootNode;
        let key: string = mapping.key!.value;
        let mappingStartPos: number = mapping.key!.startPosition;
        let mappingLength: number = mapping.key!.endPosition - mapping.key!.startPosition;
        let value: YAMLNode = mapping.value;
        // If the key has slash, create separate nodes for each part.
        // For instance, "foo/bar/baz: 1" should be created as a four-layer tree.
        if (key.indexOf("/") !== -1) {
            let leafNode: ConfigTreeItem | undefined = this._buildSlashSeparatedNodes(key, current, mapping.key.startPosition, fileKind, fullPath);
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
                current.addChildNode(new ConfigTreeItem({ 
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
                let childMapNode: ConfigTreeItem = new ConfigTreeItem({ 
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
                let childSeqNode: ConfigTreeItem = new ConfigTreeItem({ 
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
                        let grandChildNode: ConfigTreeItem = new ConfigTreeItem({ 
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
                        let grandChildNode: ConfigTreeItem = new ConfigTreeItem({ 
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
     * @param {ConfigTreeItem} rootNode The root node to build from.
     * @param {number} keyStartPos The start position of the key in the original config file.
     * @param {FileKind} fileKind The kind of the config file.
     * @param {string} filePath Path to the config file.
     * @returns {ConfigTreeItem} The leaf node built.
     */
    protected _buildSlashSeparatedNodes(
        key: string, 
        rootNode: ConfigTreeItem, 
        keyStartPos: number, 
        fileKind: FileKind, 
        filePath: string): ConfigTreeItem | undefined {
        if (key === undefined || key === null) {
            return;
        }
        // Reached leaf.
        if (key.indexOf("/") === -1) {
            return rootNode;
        }

        const firstSlashInKeyIdx: number = key.indexOf("/");
        const childNode: ConfigTreeItem = new ConfigTreeItem({
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
     * Apply patches to the file to patch.
     * @param {ConfigTreeItem} sharedConfigTree The program config tree.
     * @param {ConfigTreeItem} userConfigTree The user config tree.
     * @returns {Map<string, ConfigTreeItem>} The merged children map after applied patches.
     */
    protected _applyPatch(sharedConfigTree: ConfigTreeItem, userConfigTree: ConfigTreeItem): Map<string, ConfigTreeItem> {
        let mergedMap: Map<string, ConfigTreeItem> = new Map();
        mergedMap = sharedConfigTree.children;
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

    private _getDefaultSharedConfigDir(): string {
        switch(process.platform) {
            case "win32":
                // TODO Use dynamics version number
                // Weasel: C:/Program Files (x86)/Rime/weasel-0.14.3/data
                return path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
            case "darwin":
                // Squirrel: /Library/Input\ Methods/Squirrel.app/Contents/SharedSupport/
                return path.join('Library', 'Input Methods', 'Squirrel.app', 'Contents', 'SharedSupport');
            case "linux":
                // ibus-rime, fcitx-rime: /usr/share/rime-data
                return path.join('usr', 'share', 'rime-data');
            default:
                throw new Error(`Unsupported platform: ${process.platform}`);
        }
    }

    private _getUserConfigDir(): string {
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
                if (fs.existsSync(ibusPath)) {
                    return ibusPath;
                } else {
                    return path.join(process.env.HOME!, '.config', 'fcitx', 'rime')
                }
            default:
                throw new Error(`Unsupported platform: ${process.platform}`);
        }
    }
}
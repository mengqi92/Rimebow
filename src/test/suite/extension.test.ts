import * as assert from 'assert';
import * as vscode from 'vscode';
import { RimeConfigurationTree, ConfigTreeItem, ItemKind, FileKind } from '../../RimeConfigurationTree';
import { YAMLNode } from 'yaml-ast-parser';
import * as Yaml from 'yaml-ast-parser';

class RimeConfigurationTreeForTest extends RimeConfigurationTree {
    public async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
        return super._buildConfigTreeFromFile(filePath, fileName);
    }

    public _buildConfigTree(doc: YAMLNode, rootNode: ConfigTreeItem, fullPath: string, fileKind: FileKind) {
        return super._buildConfigTree(doc, rootNode, fullPath, fileKind);
    }

    public _applyPatch(programConfigTree: ConfigTreeItem, userConfigTree: ConfigTreeItem) {
        return super._applyPatch(programConfigTree, userConfigTree);
    }

    public _mergeTree(treeA: ConfigTreeItem, treeB: ConfigTreeItem) {
        return super._mergeTree(treeA, treeB);
	}
	
	public _cloneTree(tree: ConfigTreeItem) {
		return super._cloneTree(tree);
	}
}

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('buildConfigTree_whenObjectTreeIsEmpty_expectNodeTreeBuiltIsNull', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const doc: Yaml.YAMLNode = Yaml.load('');
        let expectedRootNodeBuilt: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.Root, configFilePath: FILE_FULL_PATH });
        expectedRootNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.None;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert(rootNode);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenObjectTreeIsOnlyOneLayerObject_expectNodeTreeBuilt', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const oneLayerObject: string = "a: '1'\nb: 2";
        const doc: Yaml.YAMLNode = Yaml.load(oneLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'a', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 3, 
            configLength: 3, 
            value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'b', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 10, 
            configLength: 1, 
            value: 2 });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenObjectTreeIsOneLayerObjectWithHexColorValue_expectColorValueStillInHexFormat', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const oneLayerObject: string = "a: '1'\ncolor: 0xFFEE00";
        const doc: Yaml.YAMLNode = Yaml.load(oneLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({
            key: 'a', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 3, 
            configLength: 3, 
            value: '1'
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'color', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 14, 
            configLength: 8, 
            value: '0xFFEE00' });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['color', expectedChildNodeB]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenObjectTreeIsTwoLayerObject_expectNodeTreeBuilt', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: string = "a: 1.5\nb: true\nc:\n  c1: 31\n  c2: '32'";
        const doc: Yaml.YAMLNode = Yaml.load(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'a', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 3, 
            configLength: 3, 
            value: 1.5 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'b', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 10, 
            configLength: 4, 
            value: true 
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'c1',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 24, 
            configLength: 2, 
            value: 31 
        });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'c2',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 33, 
            configLength: 4, 
            value: '32' 
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node,
            configOffset: 15, 
            configLength: 1, 
            fileKind: FILE_KIND
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenObjectTreeHasArray_expectNodeTreeBuilt', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: string = "a: '1'\nb: 2\nc:\n  - c1: 31\n    c2: '32'\n  - c3: 33";
        const doc: Yaml.YAMLNode = Yaml.load(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'a',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 3, 
            configLength: 3, 
            value: '1' 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'b',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 10, 
            configLength: 1, 
            value: 2 
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'c1',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 23, 
            configLength: 2, 
            value: 31 
        });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'c2',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 34, 
            configLength: 4, 
            value: '32' 
        });
        const expectedChildNodeC3: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'c3',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 47, 
            configLength: 2, 
            value: 33 
        });
        const expectedChildNodeCA0: ConfigTreeItem = new ConfigTreeItem({
            key: '0',
            children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
            configFilePath: FILE_FULL_PATH, 
            configOffset: 19, 
            configLength: 19, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            isSequenceElement: true
        });
        const expectedChildNodeCA1: ConfigTreeItem = new ConfigTreeItem({
            key: '1',
            children: new Map([['c3', expectedChildNodeC3]]),
            configFilePath: FILE_FULL_PATH, 
            configOffset: 43, 
            configLength: 6, 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND,
            isSequenceElement: true
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['0', expectedChildNodeCA0], ['1', expectedChildNodeCA1]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 12, 
            configLength: 1, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            isSequence: true
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenObjectTreeHasArrayOfLeaves_expectNodeTreeBuilt', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const oneLayerObject: string = "a: '1'\nb: 2\nc:\n  - 3\n  - 4\n  - '5'";
        const doc: YAMLNode = Yaml.load(oneLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'a', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 3, 
            configLength: 3, 
            value: '1' 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 10, 
            configLength: 1, 
            value: 2 
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: '0',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 19, 
            configLength: 1, 
            value: 3,
            isSequenceElement: true 
        });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: '1',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 25, 
            configLength: 1, 
            value: 4,
            isSequenceElement: true 
        });
        const expectedChildNodeC3: ConfigTreeItem = new ConfigTreeItem({ key: '2',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 31, 
            configLength: 3, 
            value: '5',
            isSequenceElement: true 
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['0', expectedChildNodeC1], ['1', expectedChildNodeC2], ['2', expectedChildNodeC3]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 12, 
            configLength: 1, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            isSequence: true
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenSlashInKeyWithScalarValue_expectNodeSeparatedBySlash', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const objectWithSlashInKey: string = "a: '1'\nb: 2\nc/c1: 3";
        const doc: YAMLNode = Yaml.load(objectWithSlashInKey);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 3, 
            configLength: 3, 
            value: '1' 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 10, 
            configLength: 1, 
            value: 2 
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: 'c1',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 18, 
            configLength: 1, 
            value: 3 
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({ key: 'c',
            children: new Map([['c1',
            expectedChildNodeC1]]),
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 12, 
            configLength: 1, 
            kind: ItemKind.Node 
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenSlashInKey_expectNodeSeparatedBySlash', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const twoLayerObjectWithSlashInKey: string = "a: '1'\nb: 2\nc/c1:\n  c11: 31\n  c12: '32'";
        const doc: YAMLNode = Yaml.load(twoLayerObjectWithSlashInKey);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 3, 
            configLength: 3, 
            value: '1' 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 10, 
            configLength: 1, 
            value: 2 
        });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 25, 
            configLength: 2, 
            value: 31 
        });
        const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 35, 
            configLength: 4, 
            value: '32' 
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 14, 
            configLength: 2, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND, 
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 12, 
            configLength: 1, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenSlashInTwoKeys_expectNodeSeparatedBySlash', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: string = "a: '1'\nb: 2\nc/c1:\n  c11: 31\n  c12: '32'\nd/d1: 4";
        const doc: YAMLNode = Yaml.load(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 3, 
            configLength: 3, 
            value: '1' 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 10, 
            configLength: 1, 
            value: 2 
        });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 25, 
            configLength: 2, 
            value: 31 
        });
        const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 35, 
            configLength: 4, 
            value: '32' 
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 14, 
            configLength: 2, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 12, 
            configLength: 1, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedChildNodeD1: ConfigTreeItem = new ConfigTreeItem({ 
            key: 'd1', 
            children: new Map(), 
            kind: ItemKind.Node, 
            fileKind: FILE_KIND, 
            configFilePath: FILE_FULL_PATH, 
            configOffset: 46, 
            configLength: 1, 
            value: 4 
        });
        const expectedChildNodeD: ConfigTreeItem = new ConfigTreeItem({
            key: 'd',
            children: new Map([['d1', expectedChildNodeD1]]), 
            configFilePath: FILE_FULL_PATH,
            configOffset: 40, 
            configLength: 1, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC], ['d', expectedChildNodeD]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenSlashInTwoKeysWithDuplicatePart_expectNodeSeparatedBySlash', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: string = "a: '1'\nb: 2\nc/c1:\n  c11: 31\n  c12: '32'\nc/c2: 4";
        const doc: YAMLNode = Yaml.load(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 3, 
            configLength: 3, 
            value: '1' 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 10, 
            configLength: 1, 
            value: 2 
        });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 25, 
            configLength: 2, 
            value: 31 
        });
        const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 35, 
            configLength: 4, 
            value: '32' 
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 14, 
            configLength: 2, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: 'c2',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 46, 
            configLength: 1, 
            value: 4 
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 12, 
            configLength: 1, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });

    test('buildConfigTree_whenTwoSlashesInOneKey_expectNodeSeparatedBySlash', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const FILE_KIND: FileKind = FileKind.Default;
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, fileKind: FILE_KIND, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: string = "a: '1'\nb: 2\nc/c1/c11:\n  c111: 31\n  c112: '32'";
        const doc: YAMLNode = Yaml.load(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 3, 
            configLength: 3, 
            value: '1' 
        });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 10, 
            configLength: 1, 
            value: 2 
        });
        const expectedChildNodeC111: ConfigTreeItem = new ConfigTreeItem({ key: 'c111',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 30, 
            configLength: 2, 
            value: 31 
        });
        const expectedChildNodeC112: ConfigTreeItem = new ConfigTreeItem({ key: 'c112',
            children: new Map(),
            kind: ItemKind.Node,
            fileKind: FILE_KIND,
            configFilePath: FILE_FULL_PATH,
            configOffset: 41, 
            configLength: 4, 
            value: '32' 
        });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({
            key: 'c11',
            children: new Map([['c111', expectedChildNodeC111], ['c112', expectedChildNodeC112]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 17, 
            configLength: 3, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 14, 
            configLength: 2, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1]]),
            configFilePath: FILE_FULL_PATH,
            configOffset: 12, 
            configLength: 1, 
            kind: ItemKind.Node,
            fileKind: FILE_KIND
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File,
            fileKind: FILE_KIND
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, FILE_KIND);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });


    test('mergeTree_whenNewNodeInB_expectNewNodeAddedToA', () => {
        // Arrange.
        const treeA: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Default, configFilePath: 'A_FILEPATH'});
        const nodeB1: ConfigTreeItem = new ConfigTreeItem({key: 'b1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Custom, configFilePath: 'B_FILEPATH'});
        const treeB: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map([['b1', nodeB1]]), kind: ItemKind.Node, fileKind: FileKind.Custom, configFilePath: 'B_FILEPATH'});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        // Act.
        const mergedTree: ConfigTreeItem = rimeConfigurationTree._mergeTree(treeA, treeB);

        // Assert.
        assert.equal(mergedTree.key, 'a');
        assert.equal(mergedTree.children.size, 1);
        assert.ok(mergedTree.children.has('b1'));
        assert.equal(mergedTree.children.get('b1')!.key, 'b1');
        assert.equal(mergedTree.children.get('b1')!.configFilePath, treeB.configFilePath);
        assert.equal(mergedTree.children.get('b1')!.fileKind, treeB.fileKind);
    });

    test('mergeTree_whenUpdatedNodeInB_expectNodeOverrideInA', () => {
        // Arrange.
        // treeA: { 1: { 2: 'a' } }
        // treeB: { 1: { 2: 'b' } }
        const nodeA2: ConfigTreeItem = new ConfigTreeItem({key: '2', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Default, configFilePath: 'A_FILEPATH', value: 'a' });
        const treeA: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map([['2', nodeA2]]), configFilePath: 'A_FILEPATH', kind: ItemKind.Node, fileKind: FileKind.Custom });
        const nodeB2: ConfigTreeItem = new ConfigTreeItem({key: '2', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Custom, configFilePath: 'B_FILEPATH', value: 'b' });
        const treeB: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map([['2', nodeB2]]), configFilePath: 'B_FILEPATH', kind: ItemKind.Node, fileKind: FileKind.Custom });
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        // Act.
        const mergedTree: ConfigTreeItem = rimeConfigurationTree._mergeTree(treeA, treeB);

        // Assert.
        assert.equal(mergedTree.key, '1');
        assert.equal(mergedTree.children.size, 1);
        assert.ok(mergedTree.children.has('2'));
        assert.equal(mergedTree.children.get('2')!.value, 'b');
        assert.equal(mergedTree.children.get('2')!.label, '2: b');
        assert.equal(mergedTree.children.get('2')!.configFilePath, nodeB2.configFilePath);
        assert.equal(mergedTree.children.get('2')!.fileKind, nodeB2.fileKind);
	});
	
    test('mergeTree_whenUpdatedArrayInB_expectArrayOverrideInA', () => {
        // Arrange.
        // treeA: { a: [ a1, a2 ] }
		// treeB: { a: [ a2, a3, a4 ] }
		// expected: { a: [ a2, a3, a4 ] }
		const A_FILE_PATH: string = 'A_FILEPATH';
		const B_FILE_PATH: string = 'B_FILEPBTH';
		const nodeA1: ConfigTreeItem = new ConfigTreeItem({ key: '0', children: new Map(), configFilePath: A_FILE_PATH, kind: ItemKind.Node, fileKind: FileKind.Default, value: 'a1' });
		const nodeA2: ConfigTreeItem = new ConfigTreeItem({ key: '1', children: new Map(), configFilePath: A_FILE_PATH, kind: ItemKind.Node, fileKind: FileKind.Default, value: 'a2' });
        const treeA: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map([['0', nodeA1], ['1', nodeA2]]), kind: ItemKind.Node, fileKind: FileKind.Default, configFilePath: A_FILE_PATH});
		const nodeB1: ConfigTreeItem = new ConfigTreeItem({ key: '0', children: new Map(), configFilePath: B_FILE_PATH, kind: ItemKind.Node, fileKind: FileKind.Custom, value: 'a2' });
		const nodeB2: ConfigTreeItem = new ConfigTreeItem({ key: '1', children: new Map(), configFilePath: B_FILE_PATH, kind: ItemKind.Node, fileKind: FileKind.Custom, value: 'a3' });
		const nodeB3: ConfigTreeItem = new ConfigTreeItem({ key: '2', children: new Map(), configFilePath: B_FILE_PATH, kind: ItemKind.Node, fileKind: FileKind.Custom, value: 'a4' });
        const treeB: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map([['0', nodeB1], ['1', nodeB2], ['2', nodeB3]]), configFilePath: B_FILE_PATH, kind: ItemKind.Node, fileKind: FileKind.Custom });
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        // Act.
        const mergedTree: ConfigTreeItem = rimeConfigurationTree._mergeTree(treeA, treeB);

        // Assert.
        assert.equal(mergedTree.key, 'a');
        assert.equal(mergedTree.children.size, 3);
        assert.ok(mergedTree.children.has('0'));
        assert.equal(mergedTree.children.get('0')!.value, 'a2');
        assert.equal(mergedTree.children.get('0')!.configFilePath, nodeB1.configFilePath);
        assert.equal(mergedTree.children.get('0')!.fileKind, nodeB1.fileKind);
        assert.ok(mergedTree.children.has('1'));
        assert.equal(mergedTree.children.get('1')!.value, 'a3');
        assert.equal(mergedTree.children.get('1')!.configFilePath, nodeB2.configFilePath);
        assert.equal(mergedTree.children.get('1')!.fileKind, nodeB2.fileKind);
        assert.ok(mergedTree.children.has('2'));
        assert.equal(mergedTree.children.get('2')!.value, 'a4');
        assert.equal(mergedTree.children.get('2')!.configFilePath, nodeB3.configFilePath);
        assert.equal(mergedTree.children.get('2')!.fileKind, nodeB3.fileKind);
	});

    test('applyPatch_whenUserTreeHasPatch_expectNodeUpdatedInMergedTree', () => {
        // Arrange.
        // programConfigTree: { FileA: { 1: 'a' } }
        // userConfigTree: { FileA.custom: { 'patch': { 1: 'b' } } }
        // expectedMergedTree: { FileA: { 1: 'b' } }
        const nodeProgram1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Schema, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        const nodeFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', nodeProgram1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File, fileKind: FileKind.Schema});
        const programConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', nodeFileA]]), configFilePath: 'ProgramPath', kind: ItemKind.Folder, fileKind: FileKind.Schema});
        const nodeUser1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Custom, configFilePath: 'UserPath/FileA.custom.yaml', value: 'b'});
        const nodeUserPatch: ConfigTreeItem = new ConfigTreeItem({key: 'patch', children: new Map([['1', nodeUser1]]), configFilePath: 'UserPath/FileA.custom.yaml', kind: ItemKind.Node, fileKind: FileKind.Custom});
        const nodeFileACustom: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['patch', nodeUserPatch]]), configFilePath: 'UserPath/FileA.custom.yaml', kind: ItemKind.File, fileKind: FileKind.Custom});
        const userConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'USER', children: new Map([['FileA', nodeFileACustom]]), configFilePath: 'UserPath', kind: ItemKind.Folder, fileKind: FileKind.Custom});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        let expectedFileA1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Schema, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        expectedFileA1.update(nodeUser1);
		const expectedFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', expectedFileA1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File, fileKind: FileKind.Schema});
        const expectedMergedTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', expectedFileA]]), configFilePath: 'UserPath', kind: ItemKind.Folder});

        // Act.
        let actualMergedChildren: Map<string, ConfigTreeItem> = rimeConfigurationTree._applyPatch(programConfigTree, userConfigTree);

        // Assert.
        assert.deepStrictEqual(actualMergedChildren, expectedMergedTree.children);
    });

    test('applyPatch_whenNewFileInUserTree_expectFileAddedInMergedTree', () => {
        // Arrange.
        // programConfigTree: { FileA: { 1: 'a' } }
        // userConfigTree: { FileB: { 1: 'b' } }
        // expectedMergedTree: { FileA: { 1: 'a' }, FileB: { 1: 'b' } }
        const nodeProgram1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Schema, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        const nodeFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', nodeProgram1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File, fileKind: FileKind.Schema});
        const programConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', nodeFileA]]), configFilePath: 'ProgramPath', kind: ItemKind.Folder});
        const nodeUser1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Custom, configFilePath: 'UserPath/FileB.yaml', value: 'b'});
        const nodeFileBCustom: ConfigTreeItem = new ConfigTreeItem({key: 'FileB', children: new Map([['1', nodeUser1]]), configFilePath: 'UserPath/FileB.yaml', kind: ItemKind.File, fileKind: FileKind.Custom});
        const userConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'USER', children: new Map([['FileB', nodeFileBCustom]]), configFilePath: 'UserPath', kind: ItemKind.Folder});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        const expectedFileA1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Schema, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        const expectedFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', expectedFileA1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File, fileKind: FileKind.Schema});
        const expectedFileB1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, fileKind: FileKind.Custom, configFilePath: 'UserPath/FileB.yaml', value: 'b'});
        const expectedFileB: ConfigTreeItem = new ConfigTreeItem({key: 'FileB', children: new Map([['1', expectedFileB1]]), configFilePath: 'UserPath/FileB.yaml', kind: ItemKind.File, fileKind: FileKind.Custom});
        const expectedMergedTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', expectedFileA], ['FileB', expectedFileB]]), configFilePath: 'UserPath', kind: ItemKind.Folder});

        // Act.
        let actualMergedChildren: Map<string, ConfigTreeItem> = rimeConfigurationTree._applyPatch(programConfigTree, userConfigTree);

        // Assert.
        assert.deepStrictEqual(actualMergedChildren, expectedMergedTree.children);
    });
    
    test('cloneTree_whenTreeHasChildren_expectTreeCloned', () => {
        // Arrange.
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const FILE_PATH: string = 'FILE_PATH';
        // { a: '1' }
		// { a: [ 1, 2 ], b: 3 }
		let childNode1: ConfigTreeItem = new ConfigTreeItem({ key: '0', children: new Map(), configFilePath: FILE_PATH, value: 1, kind: ItemKind.Node, fileKind: FileKind.Default });
		let childNode2: ConfigTreeItem = new ConfigTreeItem({ key: '1', children: new Map(), configFilePath: FILE_PATH, value: 2, kind: ItemKind.Node, fileKind: FileKind.Default });
		let childNodeA: ConfigTreeItem = new ConfigTreeItem({ 
			key: 'a', 
			children: new Map([['0', childNode1], ['1', childNode2]]), 
			configFilePath: FILE_PATH, 
            kind: ItemKind.Node,
            fileKind: FileKind.Default
		});
		let childNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_PATH, value: 3, kind: ItemKind.Node, fileKind: FileKind.Default });
        let tree: ConfigTreeItem = new ConfigTreeItem({ key: 'ROOT', children: new Map([['a', childNodeA], ['b', childNodeB]]), configFilePath: FILE_PATH, kind: ItemKind.Node, fileKind: FileKind.Default });

        // Act.
		let clonedTree: ConfigTreeItem = rimeConfigurationTree._cloneTree(tree);
		childNodeB.value = 4;

		// Assert.
		assert.ok(clonedTree.hasChildren);
		assert.equal(clonedTree.children.size, 2);
		assert.ok(clonedTree.children.has('a'));
		assert.equal(clonedTree.children.get('a')!.key, 'a');
		assert.ok(clonedTree.children.get('a')!.hasChildren);
		assert.equal(clonedTree.children.get('a')!.children.size, 2);
		assert.ok(clonedTree.children.get('a')!.children.has('0'));
		assert.equal(clonedTree.children.get('a')!.children.get('0')!.value, 1);
		assert.ok(clonedTree.children.get('a')!.children.has('1'));
		assert.equal(clonedTree.children.get('a')!.children.get('1')!.value, 2);
		assert.ok(clonedTree.children.has('b'));
		assert.ok(!clonedTree.children.get('b')!.hasChildren);
		// The cloned value should not be changed.
		assert.equal(clonedTree.children.get('b')!.value, 3);
    });
});

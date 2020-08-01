import * as assert from 'assert';
import YAML = require('yaml');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { RimeConfigurationTree, ConfigTreeItem, ItemKind, FileKind } from '../../RimeConfigurationTree';
import { Node } from 'yaml/types';

class RimeConfigurationTreeForTest extends RimeConfigurationTree {
    public async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
        return super._buildConfigTreeFromFile(filePath, fileName);
    }

    public _buildConfigTree(doc: Node, rootNode: ConfigTreeItem, fullPath: string) {
        return super._buildConfigTree(doc, rootNode, fullPath);
    }

    public _applyPatch(programConfigTree: ConfigTreeItem, userConfigTree: ConfigTreeItem) {
        return super._applyPatch(programConfigTree, userConfigTree);
    }

    public _mergeTree(treeA: ConfigTreeItem, treeB: ConfigTreeItem) {
        return super._mergeTree(treeA, treeB);
    }
}

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('buildConfigTree_whenObjectTreeIsEmpty_expectNodeTreeBuiltIsNull', () => {
        // Arrange.
        const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
        const FILE_NAME: string = "baz";
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const emptyObject: object = {};
        const doc: Node = YAML.createNode(emptyObject);
        let expectedRootNodeBuilt: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.Root, configFilePath: FILE_FULL_PATH });
        expectedRootNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.None;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const oneLayerObject: object = { a: '1', b: 2 };
        const doc: Node = YAML.createNode(oneLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: object = { a: '1', b: 2, c: { c1: 31, c2: '32' } };
        const doc: Node = YAML.createNode(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: 'c1', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 31 });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: 'c2', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '32' });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: object = { a: '1', b: 2, c: [{ c1: 31, c2: '32' }, { c3: 33 }] };
        const doc: Node = YAML.createNode(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: 'c1', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 31 });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: 'c2', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '32' });
        const expectedChildNodeC3: ConfigTreeItem = new ConfigTreeItem({ key: 'c3', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 33 });
        const expectedChildNodeCA0: ConfigTreeItem = new ConfigTreeItem({
            key: '0',
            children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
            configFilePath: FILE_FULL_PATH, 
            kind: ItemKind.Node,
            isSequenceElement: true
        });
        const expectedChildNodeCA1: ConfigTreeItem = new ConfigTreeItem({
            key: '1',
            children: new Map([['c3', expectedChildNodeC3]]),
            configFilePath: FILE_FULL_PATH, 
            kind: ItemKind.Node, 
            isSequenceElement: true
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['0', expectedChildNodeCA0], ['1', expectedChildNodeCA1]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const oneLayerObject: object = { a: '1', b: 2, c: [3, 4, '5'] };
        const doc: Node = YAML.createNode(oneLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: '0', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 3, isSequenceElement: true });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 4, isSequenceElement: true });
        const expectedChildNodeC3: ConfigTreeItem = new ConfigTreeItem({ key: '2', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '5', isSequenceElement: true });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['0', expectedChildNodeC1], ['1', expectedChildNodeC2], ['2', expectedChildNodeC3]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: object = { a: '1', b: 2, 'c/c1': 3 };
        const doc: Node = YAML.createNode(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: 'c1', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 3 });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({ key: 'c', children: new Map([['c1', expectedChildNodeC1]]), configFilePath: FILE_FULL_PATH, kind: ItemKind.Node });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: object = { a: '1', b: 2, 'c/c1': { c11: 31, c12: '32' } };
        const doc: Node = YAML.createNode(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 31 });
        const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '32' });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: object = { a: '1', b: 2, 'c/c1': { c11: 31, c12: '32' }, 'd/d1': 4 };
        const doc: Node = YAML.createNode(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 31 });
        const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '32' });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedChildNodeD1: ConfigTreeItem = new ConfigTreeItem({ key: 'd1', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 4 });
        const expectedChildNodeD: ConfigTreeItem = new ConfigTreeItem({
            key: 'd',
            children: new Map([['d1', expectedChildNodeD1]]), configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC], ['d', expectedChildNodeD]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: object = { a: '1', b: 2, 'c/c1': { c11: 31, c12: '32' }, 'c/c2': 4 };
        const doc: Node = YAML.createNode(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 31 });
        const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '32' });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: 'c2', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 4 });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

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
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
        const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), kind: ItemKind.File, configFilePath: FILE_FULL_PATH });
        const twoLayerObject: object = { a: '1', b: 2, 'c/c1/c11': { c111: 31, c112: '32' } };
        const doc: Node = YAML.createNode(twoLayerObject);

        const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '1' });
        const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 2 });
        const expectedChildNodeC111: ConfigTreeItem = new ConfigTreeItem({ key: 'c111', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: 31 });
        const expectedChildNodeC112: ConfigTreeItem = new ConfigTreeItem({ key: 'c112', children: new Map(), kind: ItemKind.Node, configFilePath: FILE_FULL_PATH, value: '32' });
        const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({
            key: 'c11',
            children: new Map([['c111', expectedChildNodeC111], ['c112', expectedChildNodeC112]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
            key: 'c1',
            children: new Map([['c11', expectedChildNodeC11]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
            key: 'c',
            children: new Map([['c1', expectedChildNodeC1]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.Node
        });
        const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
            key: FILE_NAME,
            children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
            configFilePath: FILE_FULL_PATH,
            kind: ItemKind.File
        });
        expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Act.
        rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH);

        // Assert.
        try {
            assert.deepStrictEqual(rootNode, expectedNodeBuilt);
        } catch (error) {
            assert.fail(`Error occurred during assertion: ${error.message}`);
        }
    });


    test('mergeTree_whenNewNodeInB_expectNewNodeAddedToA', () => {
        // Arrange.
        const treeA: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map(), kind: ItemKind.Node, configFilePath: 'A_FILEPATH'});
        const nodeB1: ConfigTreeItem = new ConfigTreeItem({key: 'b1', children: new Map(), kind: ItemKind.Node, configFilePath: 'B_FILEPATH'});
        const treeB: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map([['b1', nodeB1]]), kind: ItemKind.Node, configFilePath: ''});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        // Act.
        rimeConfigurationTree._mergeTree(treeA, treeB);

        // Assert.
        assert.equal(treeA.key, 'a');
        assert.equal(treeA.children.size, 1);
        assert.ok(treeA.children.has('b1'));
        assert.equal(treeA.children.get('b1')!.key, 'b1');
    });

    test('mergeTree_whenUpdatedNodeInB_expectNodeOverrideInA', () => {
        // Arrange.
        // treeA: { 1: { 2: 'a' } }
        // treeB: { 1: { 2: 'b' } }
        const nodeA2: ConfigTreeItem = new ConfigTreeItem({key: '2', children: new Map(), kind: ItemKind.Node, configFilePath: 'A_FILEPATH', value: 'a'});
        const treeA: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map([['2', nodeA2]]), configFilePath: 'A_FILEPATH', kind: ItemKind.Node});
        const nodeB2: ConfigTreeItem = new ConfigTreeItem({key: '2', children: new Map(), kind: ItemKind.Node, configFilePath: 'B_FILEPATH', value: 'b'});
        const treeB: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map([['2', nodeB2]]), configFilePath: 'B_FILEPATH', kind: ItemKind.Node});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        // Act.
        rimeConfigurationTree._mergeTree(treeA, treeB);

        // Assert.
        assert.equal(treeA.key, '1');
        assert.equal(treeA.children.size, 1);
        assert.ok(treeA.children.has('2'));
        assert.equal(treeA.children.get('2')!.value, 'b');
        assert.equal(treeA.children.get('2')!.label, '2: b');
	});
	
    test('mergeTree_whenUpdatedArrayInB_expectArrayOverrideInA', () => {
        // Arrange.
        // treeA: { a: [ a1, a2 ] }
		// treeB: { a: [ a2, a3, a4 ] }
		// expected: { a: [ a2, a3, a4 ] }
		const A_FILE_PATH: string = 'A_FILEPATH';
		const B_FILE_PATH: string = 'B_FILEPBTH';
		const nodeA1: ConfigTreeItem = new ConfigTreeItem({ key: '0', children: new Map(), configFilePath: A_FILE_PATH, kind: ItemKind.Node, value: 'a1' });
		const nodeA2: ConfigTreeItem = new ConfigTreeItem({ key: '1', children: new Map(), configFilePath: A_FILE_PATH, kind: ItemKind.Node, value: 'a2' });
        const treeA: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map([['0', nodeA1], ['1', nodeA2]]), kind: ItemKind.Node, configFilePath: A_FILE_PATH});
		const nodeB1: ConfigTreeItem = new ConfigTreeItem({ key: '0', children: new Map(), configFilePath: B_FILE_PATH, kind: ItemKind.Node, value: 'a2' });
		const nodeB2: ConfigTreeItem = new ConfigTreeItem({ key: '1', children: new Map(), configFilePath: B_FILE_PATH, kind: ItemKind.Node, value: 'a3' });
		const nodeB3: ConfigTreeItem = new ConfigTreeItem({ key: '2', children: new Map(), configFilePath: B_FILE_PATH, kind: ItemKind.Node, value: 'a4' });
        const treeB: ConfigTreeItem = new ConfigTreeItem({key: 'a', children: new Map([['0', nodeB1], ['1', nodeB2], ['2', nodeB3]]), configFilePath: B_FILE_PATH, kind: ItemKind.Node});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        // Act.
        rimeConfigurationTree._mergeTree(treeA, treeB);

        // Assert.
        assert.equal(treeA.key, 'a');
        assert.equal(treeA.children.size, 3);
        assert.ok(treeA.children.has('0'));
        assert.equal(treeA.children.get('0')!.value, 'a2');
        assert.ok(treeA.children.has('1'));
        assert.equal(treeA.children.get('1')!.value, 'a3');
        assert.ok(treeA.children.has('2'));
        assert.equal(treeA.children.get('2')!.value, 'a4');
	});

    test('applyPatch_whenUserTreeHasPatch_expectNodeUpdatedInMergedTree', () => {
        // Arrange.
        // programConfigTree: { FileA: { 1: 'a' } }
        // userConfigTree: { FileA.custom: { 'patch': { 1: 'b' } } }
        // expectedMergedTree: { FileA: { 1: 'b' } }
        const nodeProgram1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        const nodeFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', nodeProgram1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File});
        const programConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', nodeFileA]]), configFilePath: 'ProgramPath', kind: ItemKind.Folder});
        const nodeUser1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: 'UserPath/FileA.custom.yaml', value: 'b'});
        const nodeUserPatch: ConfigTreeItem = new ConfigTreeItem({key: 'patch', children: new Map([['1', nodeUser1]]), configFilePath: 'UserPath/FileA.custom.yaml', kind: ItemKind.PatchNode});
        const nodeFileACustom: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['patch', nodeUserPatch]]), configFilePath: 'UserPath/FileA.custom.yaml', kind: ItemKind.File, fileKind: FileKind.Custom});
        const userConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'USER', children: new Map([['FileA', nodeFileACustom]]), configFilePath: 'UserPath', kind: ItemKind.Folder});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        let expectedFileA1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        expectedFileA1.updateValue('b');
		const expectedFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', expectedFileA1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File});
		// TODO: config file path of the merged tree should be the one contains the effective node.
        const expectedMergedTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', expectedFileA]]), configFilePath: 'ProgramPath', kind: ItemKind.Folder});

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
        const nodeProgram1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        const nodeFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', nodeProgram1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File});
        const programConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', nodeFileA]]), configFilePath: 'ProgramPath', kind: ItemKind.Folder});
        const nodeUser1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: 'UserPath/FileB.yaml', value: 'b'});
        const nodeFileBCustom: ConfigTreeItem = new ConfigTreeItem({key: 'FileB', children: new Map([['1', nodeUser1]]), configFilePath: 'UserPath/FileB.yaml', kind: ItemKind.File});
        const userConfigTree: ConfigTreeItem = new ConfigTreeItem({key: 'USER', children: new Map([['FileB', nodeFileBCustom]]), configFilePath: 'UserPath', kind: ItemKind.Folder});
        const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();

        const expectedFileA1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: 'ProgramPath/FileA.yaml', value: 'a'});
        const expectedFileA: ConfigTreeItem = new ConfigTreeItem({key: 'FileA', children: new Map([['1', expectedFileA1]]), configFilePath: 'ProgramPath/FileA.yaml', kind: ItemKind.File});
        const expectedFileB1: ConfigTreeItem = new ConfigTreeItem({key: '1', children: new Map(), kind: ItemKind.Node, configFilePath: 'UserPath/FileB.yaml', value: 'b'});
        const expectedFileB: ConfigTreeItem = new ConfigTreeItem({key: 'FileB', children: new Map([['1', expectedFileB1]]), configFilePath: 'UserPath/FileB.yaml', kind: ItemKind.File});
        const expectedMergedTree: ConfigTreeItem = new ConfigTreeItem({key: 'PROGRAM', children: new Map([['FileA', expectedFileA], ['FileB', expectedFileB]]), configFilePath: 'UserPath', kind: ItemKind.Folder});

        // Act.
        let actualMergedChildren: Map<string, ConfigTreeItem> = rimeConfigurationTree._applyPatch(programConfigTree, userConfigTree);

        // Assert.
        assert.deepStrictEqual(actualMergedChildren, expectedMergedTree.children);
    });
});

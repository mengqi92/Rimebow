import * as assert from 'assert';
import YAML = require('yaml');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { RimeConfigurationTree, ConfigTreeItem } from '../../RimeConfigurationTree';
import { Node } from 'yaml/types';

class RimeConfigurationTreeForTest extends RimeConfigurationTree {
	public async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
		return super._buildConfigTreeFromFile(filePath, fileName);
	}

	public _buildConfigTree(doc: Node, rootNode: ConfigTreeItem, fullPath: string, isCustomConfig: boolean) {
		return super._buildConfigTree(doc, rootNode, fullPath, isCustomConfig);
	}
}

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('buildConfigTree_whenObjectTreeIsEmpty_expectNodeTreeBuiltIsNull', () => {
		// Arrange.
		const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
		const FILE_NAME: string = "baz";
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const emptyObject: object = {};
		const doc: Node = YAML.createNode(emptyObject);
		let expectedRootNodeBuilt: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		expectedRootNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.None;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const oneLayerObject: object = { a: '1', b: 2 };
		const doc: Node = YAML.createNode(oneLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const twoLayerObject: object = { a: '1', b: 2, c: { c1: 31, c2: '32' } };
		const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: 'c1', children: new Map(), configFilePath: FILE_FULL_PATH, value: 31 });
		const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: 'c2', children: new Map(), configFilePath: FILE_FULL_PATH, value: '32' });
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
			key: 'c',
			children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const twoLayerObject: object = { a: '1', b: 2, c: [{ c1: 31, c2: '32' }, { c3: 33 }] };
		const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: 'c1', children: new Map(), configFilePath: FILE_FULL_PATH, value: 31 });
		const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: 'c2', children: new Map(), configFilePath: FILE_FULL_PATH, value: '32' });
		const expectedChildNodeC3: ConfigTreeItem = new ConfigTreeItem({ key: 'c3', children: new Map(), configFilePath: FILE_FULL_PATH, value: 33 });
		const expectedChildNodeCA0: ConfigTreeItem = new ConfigTreeItem({
			key: '0',
			children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
			configFilePath: FILE_FULL_PATH, isSequenceElement: true
		});
		const expectedChildNodeCA1: ConfigTreeItem = new ConfigTreeItem({
			key: '1',
			children: new Map([['c3', expectedChildNodeC3]]),
			configFilePath: FILE_FULL_PATH, isSequenceElement: true
		});
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
			key: 'c',
			children: new Map([['0', expectedChildNodeCA0], ['1', expectedChildNodeCA1]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const oneLayerObject: object = { a: '1', b: 2, c: [3, 4, '5'] };
		const doc: Node = YAML.createNode(oneLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: '0', children: new Map(), configFilePath: FILE_FULL_PATH, value: 3, isSequenceElement: true });
		const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: '1', children: new Map(), configFilePath: FILE_FULL_PATH, value: 4, isSequenceElement: true });
		const expectedChildNodeC3: ConfigTreeItem = new ConfigTreeItem({ key: '2', children: new Map(), configFilePath: FILE_FULL_PATH, value: '5', isSequenceElement: true });
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
			key: 'c',
			children: new Map([['0', expectedChildNodeC1], ['1', expectedChildNodeC2], ['2', expectedChildNodeC3]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const twoLayerObject: object = { a: '1', b: 2, 'c/c1': 3 };
		const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({ key: 'c1', children: new Map(), configFilePath: FILE_FULL_PATH, value: 3 });
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({ key: 'c', children: new Map([['c1', expectedChildNodeC1]]), configFilePath: FILE_FULL_PATH });
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const twoLayerObject: object = { a: '1', b: 2, 'c/c1': { c11: 31, c12: '32' } };
		const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11', children: new Map(), configFilePath: FILE_FULL_PATH, value: 31 });
		const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12', children: new Map(), configFilePath: FILE_FULL_PATH, value: '32' });
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
			key: 'c1',
			children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
			key: 'c',
			children: new Map([['c1', expectedChildNodeC1]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const twoLayerObject: object = { a: '1', b: 2, 'c/c1': { c11: 31, c12: '32' }, 'd/d1': 4 };
		const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11', children: new Map(), configFilePath: FILE_FULL_PATH, value: 31 });
		const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12', children: new Map(), configFilePath: FILE_FULL_PATH, value: '32' });
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
			key: 'c1',
			children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
			key: 'c',
			children: new Map([['c1', expectedChildNodeC1]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedChildNodeD1: ConfigTreeItem = new ConfigTreeItem({ key: 'd1', children: new Map(), configFilePath: FILE_FULL_PATH, value: 4 });
		const expectedChildNodeD: ConfigTreeItem = new ConfigTreeItem({
			key: 'd',
			children: new Map([['d1', expectedChildNodeD1]]), configFilePath: FILE_FULL_PATH
		});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC], ['d', expectedChildNodeD]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const twoLayerObject: object = { a: '1', b: 2, 'c/c1': { c11: 31, c12: '32' }, 'c/c2': 4 };
		const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({ key: 'c11', children: new Map(), configFilePath: FILE_FULL_PATH, value: 31 });
		const expectedChildNodeC12: ConfigTreeItem = new ConfigTreeItem({ key: 'c12', children: new Map(), configFilePath: FILE_FULL_PATH, value: '32' });
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
			key: 'c1',
			children: new Map([['c11', expectedChildNodeC11], ['c12', expectedChildNodeC12]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({ key: 'c2', children: new Map(), configFilePath: FILE_FULL_PATH, value: 4 });
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
			key: 'c',
			children: new Map([['c1', expectedChildNodeC1], ['c2', expectedChildNodeC2]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({ key: FILE_NAME, children: new Map(), configFilePath: FILE_FULL_PATH });
		const twoLayerObject: object = { a: '1', b: 2, 'c/c1/c11': { c111: 31, c112: '32' } };
		const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({ key: 'a', children: new Map(), configFilePath: FILE_FULL_PATH, value: '1' });
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({ key: 'b', children: new Map(), configFilePath: FILE_FULL_PATH, value: 2 });
		const expectedChildNodeC111: ConfigTreeItem = new ConfigTreeItem({ key: 'c111', children: new Map(), configFilePath: FILE_FULL_PATH, value: 31 });
		const expectedChildNodeC112: ConfigTreeItem = new ConfigTreeItem({ key: 'c112', children: new Map(), configFilePath: FILE_FULL_PATH, value: '32' });
		const expectedChildNodeC11: ConfigTreeItem = new ConfigTreeItem({
			key: 'c11',
			children: new Map([['c111', expectedChildNodeC111], ['c112', expectedChildNodeC112]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({
			key: 'c1',
			children: new Map([['c11', expectedChildNodeC11]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({
			key: 'c',
			children: new Map([['c1', expectedChildNodeC1]]),
			configFilePath: FILE_FULL_PATH
		});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({
			key: FILE_NAME,
			children: new Map([['a', expectedChildNodeA], ['b', expectedChildNodeB], ['c', expectedChildNodeC]]),
			configFilePath: FILE_FULL_PATH
		});
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(doc, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

		// Assert.
		try {
			assert.deepStrictEqual(rootNode, expectedNodeBuilt);
		} catch (error) {
			assert.fail(`Error occurred during assertion: ${error.message}`);
		}
	});
});

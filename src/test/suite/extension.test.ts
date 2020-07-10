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
		const rootNode: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [], configFilePath: FILE_FULL_PATH, configLine: 0});
		const emptyObject: object = {};
		const doc: Node = YAML.createNode(emptyObject);
		let expectedRootNodeBuilt: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [], configFilePath: FILE_FULL_PATH, configLine: 0});
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
		const rootNode: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [], configFilePath: FILE_FULL_PATH, configLine: 0});
		const oneLayerObject: object = { a: '1', b: 2 };
        const doc: Node = YAML.createNode(oneLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({label: 'a', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: '1'});
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({label: 'b', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: 2});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [expectedChildNodeA, expectedChildNodeB], configFilePath: FILE_FULL_PATH, configLine: 0});
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
		const rootNode: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [], configFilePath: FILE_FULL_PATH, configLine: 0});
		const twoLayerObject: object = { a: '1', b: 2, c: {c1: 31, c2: '32'} };
        const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({label: 'a', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: '1'});
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({label: 'b', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: 2});
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({label: 'c1', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: 31});
		const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({label: 'c2', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: '32'});
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({label: 'c', children: [expectedChildNodeC1, expectedChildNodeC2], configFilePath: FILE_FULL_PATH, configLine: 0});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [expectedChildNodeA, expectedChildNodeB, expectedChildNodeC], configFilePath: FILE_FULL_PATH, configLine: 0});
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

	// TODO: when Array element is leaf
	test('buildConfigTree_whenObjectTreeHasArray_expectNodeTreeBuilt', () => {
		// Arrange.
		const FILE_FULL_PATH: string = "C:/foo/bar/baz.yaml";
		const FILE_NAME: string = "baz";
		const IS_CUSTOM_CONFIG: boolean = false;
		const rimeConfigurationTree: RimeConfigurationTreeForTest = new RimeConfigurationTreeForTest();
		const rootNode: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [], configFilePath: FILE_FULL_PATH, configLine: 0});
		const twoLayerObject: object = { a: '1', b: 2, c: [{c1: 31, c2: '32'}, {c3: 33}] };
        const doc: Node = YAML.createNode(twoLayerObject);

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem({label: 'a', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: '1'});
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem({label: 'b', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: 2});
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem({label: 'c1', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: 31});
		const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem({label: 'c2', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: '32'});
		const expectedChildNodeC3: ConfigTreeItem = new ConfigTreeItem({label: 'c3', children: [], configFilePath: FILE_FULL_PATH, configLine: 0, value: 33});
		const expectedChildNodeCA0: ConfigTreeItem = new ConfigTreeItem({label: '0', children: [expectedChildNodeC1, expectedChildNodeC2], configFilePath: FILE_FULL_PATH, configLine: 0});
		const expectedChildNodeCA1: ConfigTreeItem = new ConfigTreeItem({label: '1', children: [expectedChildNodeC3], configFilePath: FILE_FULL_PATH, configLine: 0});
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem({label: 'c', children: [expectedChildNodeCA0, expectedChildNodeCA1], configFilePath: FILE_FULL_PATH, configLine: 0, isSequential: true});
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem({label: FILE_NAME, children: [expectedChildNodeA, expectedChildNodeB, expectedChildNodeC] , configFilePath: FILE_FULL_PATH, configLine: 0});
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

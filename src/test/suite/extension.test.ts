import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { RimeConfigurationTree, ConfigTreeItem } from '../../RimeConfigurationTree';

class RimeConfigurationTreeForTest extends RimeConfigurationTree {
    public async _buildConfigTreeFromFile(filePath: string, fileName: string): Promise<ConfigTreeItem> {
		return super._buildConfigTreeFromFile(filePath, fileName);
	}

    public _buildConfigTree(objectTreeRoot: any, rootNode: ConfigTreeItem, fullPath: string, isCustomConfig: boolean) {
		return super._buildConfigTree(objectTreeRoot, rootNode, fullPath, isCustomConfig);
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
		const rootNode: ConfigTreeItem = new ConfigTreeItem(FILE_NAME, [], FILE_FULL_PATH, 0, IS_CUSTOM_CONFIG);
		const emptyObject: object = {};
		let expectedRootNodeBuilt: ConfigTreeItem = new ConfigTreeItem(FILE_NAME, [], FILE_FULL_PATH, 0, IS_CUSTOM_CONFIG);
		expectedRootNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.None;

		// Act.
		rimeConfigurationTree._buildConfigTree(emptyObject, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);

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
		const rootNode: ConfigTreeItem = new ConfigTreeItem(FILE_NAME, [], FILE_FULL_PATH, 0, IS_CUSTOM_CONFIG);
		const oneLayerObject: object = { a: '1', b: 2 };

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem('a', [], FILE_FULL_PATH, 0, false, '1');
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem('b', [], FILE_FULL_PATH, 0, false, 2);
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem(FILE_NAME, [expectedChildNodeA, expectedChildNodeB] , FILE_FULL_PATH, 0, IS_CUSTOM_CONFIG);
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(oneLayerObject, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);
		
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
		const rootNode: ConfigTreeItem = new ConfigTreeItem(FILE_NAME, [], FILE_FULL_PATH, 0, IS_CUSTOM_CONFIG);
		const twoLayerObject: object = { a: '1', b: 2, c: {c1: 31, c2: '32'} };

		const expectedChildNodeA: ConfigTreeItem = new ConfigTreeItem('a', [], FILE_FULL_PATH, 0, false, '1');
		const expectedChildNodeB: ConfigTreeItem = new ConfigTreeItem('b', [], FILE_FULL_PATH, 0, false, 2);
		const expectedChildNodeC1: ConfigTreeItem = new ConfigTreeItem('c1', [], FILE_FULL_PATH, 0, false, 31);
		const expectedChildNodeC2: ConfigTreeItem = new ConfigTreeItem('c2', [], FILE_FULL_PATH, 0, false, '32');
		const expectedChildNodeC: ConfigTreeItem = new ConfigTreeItem('c', [expectedChildNodeC1, expectedChildNodeC2], FILE_FULL_PATH, 0, false);
		const expectedNodeBuilt: ConfigTreeItem = new ConfigTreeItem(FILE_NAME, [expectedChildNodeA, expectedChildNodeB, expectedChildNodeC] , FILE_FULL_PATH, 0, IS_CUSTOM_CONFIG);
		expectedNodeBuilt.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

		// Act.
		rimeConfigurationTree._buildConfigTree(twoLayerObject, rootNode, FILE_FULL_PATH, IS_CUSTOM_CONFIG);
		
		// Assert.
		try {
			assert.deepStrictEqual(rootNode, expectedNodeBuilt);
		} catch (error) {
			assert.fail(`Error occurred during assertion: ${error.message}`);
		}
	});
});

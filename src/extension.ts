'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RimeFileExplorerProvider } from './RimeFileExplorerProvider';
import { RimeNodeExplorerProvider } from './RimeNodeExplorerProvider';
import { RimeConfigurationTree } from './RimeConfigurationTree';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "rime-assistant" is now active!');

	const rimeConfigurationTree: RimeConfigurationTree = new RimeConfigurationTree();
	rimeConfigurationTree.build();

	const rimeFileExplorerProvider: RimeFileExplorerProvider = new RimeFileExplorerProvider(rimeConfigurationTree);
	vscode.commands.registerCommand('rimeFileExplorer.refreshEntry', () => { rimeFileExplorerProvider.refresh(); });
	vscode.window.createTreeView('rimeFileExplorer', { treeDataProvider: rimeFileExplorerProvider });

	const rimeNodeExplorerProvider: RimeNodeExplorerProvider = new RimeNodeExplorerProvider(rimeConfigurationTree);
	vscode.window.createTreeView('rimeNodeExplorer', { treeDataProvider: rimeNodeExplorerProvider });
}

// this method is called when your extension is deactivated
export function deactivate() {}
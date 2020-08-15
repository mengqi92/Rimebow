'use strict';

import * as vscode from 'vscode';
import { RimeFileExplorerProvider } from './RimeFileExplorerProvider';
import { RimeNodeExplorerProvider } from './RimeNodeExplorerProvider';
import { RimeConfigurationTree, RimeConfigNode, FileKind } from './RimeConfigurationTree';
import path = require('path');
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {

	//================================== RIME LANGUAGE CLIENT START ==========================================//
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
	run: { module: serverModule, transport: TransportKind.ipc },
	debug: {
		module: serverModule,
		transport: TransportKind.ipc,
		options: debugOptions
	}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
	// Register the server for plain text documents
	documentSelector: [{ scheme: 'file', language: 'yaml' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.?(e)y?(a)ml')
		}
	};

	// Create the language client and start the client.
	const client = new LanguageClient(
		'rimeLanguagerServer',
		'Rime Language Server',
		serverOptions,
		clientOptions
	);
	// Start the client. This will also launch the server
	client.start();

	//==================================== RIME LANGUAGE CLIENT END -=========================================//


	//======================================= RIME EXPLORER START ============================================//

	const rimeConfigurationTree: RimeConfigurationTree = new RimeConfigurationTree();
	await rimeConfigurationTree.build();

	vscode.commands.registerCommand(
		'rimeAssistant.openConfigFile', 
		(node: RimeConfigNode) => { 
			vscode.window.showTextDocument(vscode.Uri.file(node.configFilePath))
				.then((editor: vscode.TextEditor) => {
					const range: vscode.Range = new vscode.Range(
						editor.document.positionAt(node.configOffset), 
						editor.document.positionAt(node.configOffset + node.configLength));
					editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
				});
		});
	vscode.commands.registerCommand('rimeAssistant.openFolder', (node: RimeConfigNode) => { vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(node.configFilePath)); });
	const rimeFileExplorerProvider: RimeFileExplorerProvider = new RimeFileExplorerProvider(rimeConfigurationTree);
	vscode.commands.registerCommand('rimeFileExplorer.refreshEntry', () => { rimeFileExplorerProvider.refresh(); });
	vscode.window.createTreeView('rimeFileExplorer', { treeDataProvider: rimeFileExplorerProvider });

	const rimeNodeExplorerProvider: RimeNodeExplorerProvider = new RimeNodeExplorerProvider(rimeConfigurationTree);
	vscode.window.createTreeView('rimeNodeExplorer', { treeDataProvider: rimeNodeExplorerProvider });
	vscode.commands.registerCommand('rimeNodeExplorer.refreshEntry', () => { rimeNodeExplorerProvider.refresh(); });
	vscode.commands.registerCommand('rimeNodeExplorer.showOnlySchemaNodes', () => { rimeNodeExplorerProvider.showOnly(FileKind.Schema); });
	vscode.commands.registerCommand('rimeNodeExplorer.showAll', () => { rimeNodeExplorerProvider.showOnly(undefined); });

	//======================================= RIME EXPLORER END ============================================//
}

// this method is called when your extension is deactivated
export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
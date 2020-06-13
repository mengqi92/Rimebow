import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import YAML = require('yaml');
import util = require('util');
import { TreeItem } from 'vscode';
import { YAMLSemanticError } from 'yaml/util';

export enum ConfigFolderType {
    DEFAULT,
    USER
};
interface ConfigFile {
    readonly name: string,
    readonly nameWithoutExtension: string,
    readonly fullName: string,
    readonly nodeTree: object;
}
interface ConfigFolder {
    readonly path: string,
    readonly type: ConfigFolderType,
    readonly files: ConfigFile[]
}
interface ConfigTree {
    folders: ConfigFolder[];
}

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
export class RimeConfigurationTree {
    private static readonly DEFAULT_CONFIG_PATH: string = path.join('C:', 'Program Files (x86)', 'Rime', 'weasel-0.14.3', 'data');
    private static readonly USER_CONFIG_PATH: string = path.join('C:', 'Users', 'mengq', 'AppData', 'Roaming', 'Rime');
    private tree: ConfigTree = { folders: [] };
    // Data structure:
    /* 
    [
        [ConfigFolder] DefaultConfigurations: {
            [ConfigFile] default: {
                ascii_composer: {}
                key_binder: {}
            }, bopomofo: {
                switches: {
                }, engine: {
                }
            }, cangjie: {
                switches: {
                }, engine: {
                }
            }
        }, [ConfigFolder] UserConfigurations: {
            [ConfigFile] default: {
                [ConfigNode(object)] ascii_composer: {}
                [ConfigNode] key_binder: {}
            }, [ConfigFile] bopomofo: {
                switches: {
                }, engine: {
                }
            }, cangjie: {
                switches: {
                }, engine: {
                }
            }
        }
    ]
    */

    constructor() {}

    public async build() {
        this.tree.folders.push(await this._getConfigFolder(RimeConfigurationTree.DEFAULT_CONFIG_PATH, ConfigFolderType.DEFAULT));
        this.tree.folders.push(await this._getConfigFolder(RimeConfigurationTree.USER_CONFIG_PATH, ConfigFolderType.USER));
    }

    /**
     * TODO
     * @param folderType 
     */
    public getFolderFiles(folderType: ConfigFolderType): vscode.TreeItem[] {
        switch (folderType) {
            case ConfigFolderType.DEFAULT:
                // TODO use object instead of array
                return this.tree.folders[0].files
                    .map((configFile: ConfigFile): vscode.TreeItem => {
                        let fileItem: TreeItem = new TreeItem(configFile.name);
                        fileItem.contextValue = 'file';
                        fileItem.command = {
                            command: 'vscode.open',
                            title: 'open',
                            arguments: [vscode.Uri.file(configFile.fullName)],
                        };
                        return fileItem;
                    });
            case ConfigFolderType.USER:
                return this.tree.folders[1].files
                    .map((configFile: ConfigFile): vscode.TreeItem => {
                        let fileItem: TreeItem = new TreeItem(configFile.name);
                        fileItem.contextValue = 'file';
                        fileItem.command = {
                            command: 'vscode.open',
                            title: 'open',
                            arguments: [vscode.Uri.file(configFile.fullName)],
                        };
                        return fileItem;
                    });
            default:
                throw Error('illegal folder type');
        }
    }

    /**
     * getYamlTree
     */
    public getYamlTree(fileName: string): TreeItem[] | undefined {
        const configFileFound: ConfigFile | undefined = this.tree.folders[0].files.find((configFile: ConfigFile): boolean => {
            return configFile.name === fileName;
        });
        if (configFileFound) {
            return Object.keys(configFileFound.nodeTree).map((nodeName: string): TreeItem => {
                return new TreeItem(nodeName);
            });
        }
    }

    private async _getConfigFolder(path: string, type: ConfigFolderType): Promise<ConfigFolder> {
        const configFiles: ConfigFile[] = await this._getConfigFiles(RimeConfigurationTree.USER_CONFIG_PATH);
        return { path: path, type: type, files: configFiles };
    }

    private async _getConfigFiles(configPath: string): Promise<ConfigFile[]> {
        const filesResult: Promise<string[]> = readDirAsync(configPath);
        const fileNames = await filesResult;
        const promises: Promise<ConfigFile>[] = fileNames
            .filter((fileName: string) => fileName.endsWith('.yaml') && !fileName.endsWith('.dict.yaml'))
            .map(async (fileName: string): Promise<ConfigFile> => {
                return await this._getYamlNodeTree(configPath, fileName);
            });
        return await Promise.all(promises).catch((error: YAMLSemanticError) => []);
    }

    private async _getYamlNodeTree(filePath: string, fileName: string): Promise<ConfigFile> {
        const fullName: string = path.join(filePath, fileName);
        const data = await readFileAsync(fullName);
        return { name: fileName, nameWithoutExtension: fileName.replace('yaml', ''), fullName: fullName, nodeTree: YAML.parse(data.toString()) };
    }
}
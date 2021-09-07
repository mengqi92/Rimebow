'use strict';

import { LanguageSettings, WorkspaceContextService } from 'yaml-language-server/out/server/src/languageservice/yamlLanguageService';
import { YAMLValidation } from 'yaml-language-server/out/server/src/languageservice/services/yamlValidation';
import { YAMLHover } from 'yaml-language-server/out/server/src/languageservice/services/yamlHover';
import { YAMLSchemaService } from 'yaml-language-server/out/server/src/languageservice/services/yamlSchemaService';
import { schemaContributions } from 'vscode-json-languageservice/lib/umd/services/configuration';
import { xhr, XHRResponse, configure as configureHttpRequests, getErrorStatusDescription } from 'request-light';
import { IConnection, createConnection, Diagnostic, Hover, Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import util = require('util');
import path = require('path');
import * as fs from 'fs';

const readFileAsync = util.promisify(fs.readFile);

interface ClientSettings {
    enableHovering: boolean;
    enableValidation: boolean;
}

export const VSCODE_CONTENT_TYPE = 'vscode/content';
const CUSTOM_SCHEMA_CONTENT_TYPE = 'custom/schema/content';
export class RimeLanguageService {
    private _connection: IConnection;
    private _yamlValidator: YAMLValidation;
    private _yamlHover: YAMLHover;

    constructor(clientSettings: ClientSettings) {
        this._connection = createConnection();

        const schemaUri = "https://rimebow.blob.core.windows.net/schema/rime-schema-yaml-schema.json";
        let yamlSchemaService = new YAMLSchemaService(this._schemaRequestService, this._workspaceContext);
        yamlSchemaService.registerExternalSchema(schemaUri, ["/*.schema.yaml"]);
        // if (settings.schemas) {
        //         settings.schemas.forEach(settings => {
        //             schemaService.registerExternalSchema(settings.uri, settings.fileMatch, settings.schema);
        //         });
        //     }
        // yamlSchemaService.setSchemaContributions(schemaContributions);
        // yamlSchemaService.loadSchema();

        this._yamlHover = new YAMLHover(yamlSchemaService, Promise);
        this._yamlValidator = new YAMLValidation(yamlSchemaService, Promise);
        let languagesettings: LanguageSettings = {
            validate: clientSettings.enableValidation
        };
        this._yamlValidator.configure(languagesettings);
    }

    public validateTextDocument(document: TextDocument): Promise<Diagnostic[]> {
        return this._yamlValidator.doValidation(document);
    }

    public doHover(document: TextDocument, position: Position): Thenable<Hover> {
        return this._yamlHover.doHover(document, position);
    }

    private async _schemaRequestService(uri: string): Promise<string> {
        if (!uri) {
            return Promise.reject('No schema specified');
        }

        const scheme = URI.parse(uri).scheme.toLowerCase();
        console.log(`schema scheme: ${scheme}\nURI: ${uri}`);

        // If the requested schema is a local file, read and return the file contents
        switch (scheme) {
            case 'file':
                const fsPath = URI.parse(uri).fsPath;
                console.log(`fsPath: ${fsPath}`);
                try {
                    return (await readFileAsync(fsPath, 'UTF-8')).toString();
                } catch (err) {
                    console.error(`error occurred when loading schema file: ${err}`);
                    return '';
                }
            // vscode schema content requests are forwarded to the client through LSP
            // This is a non-standard LSP extension introduced by the JSON language server
            // See https://github.com/microsoft/vscode/blob/master/extensions/json-language-features/server/README.md
            case 'vscode':
                return this._connection.sendRequest(VSCODE_CONTENT_TYPE, uri)
                    .then(responseText => {return responseText;}, error => {return error.message;});
            // HTTP(S) requests are sent and the response result is either the schema content or an error
            case 'http':
            case 'https':
                // Send the HTTP(S) schema content request and return the result
                const headers = { 'Accept-Encoding': 'gzip, deflate' };
                return xhr({ url: uri, followRedirects: 5, headers })
                    .then(response => {return response.responseText;},
                        (error: XHRResponse) => {return Promise.reject(error.responseText || getErrorStatusDescription(error.status) || error.toString());});
            default:
                // Neither local file nor vscode, nor HTTP(S) schema request, so send it off as a custom request
                return this._connection.sendRequest(CUSTOM_SCHEMA_CONTENT_TYPE, uri) as Thenable<string>;
        }
    }

    private _workspaceContext: WorkspaceContextService = {
        resolveRelativePath: (relativePath: string, resource: string) => {
            return path.resolve(resource, relativePath);
        }
    };
}
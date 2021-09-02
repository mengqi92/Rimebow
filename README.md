# Rimebow (元宝)

Rimebow is your RIME assistant lives in VS Code.

## Features

- Configuration file explorer
- Configuration node explorer
- Verify configuration
- RIME configuration language server
- Configuration autocomplete

## Requirements
1. RIME 输入法

## Development
```shell
npm install
npm watch
```

## Extension Settings
This extension contributes the following settings:
* `rimebow.userConfigDir`: The directory containing RIME user configuration.
* `rimebow.defaultConfigDir`: The directory containing RIME default configuration.
* `rimeLanguageServer.maxNumberOfProblems`: The maximum number of problems produced by the language server. Set this number lower if you met too many errors raised by the language server.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 0.1.0

## Contribute

Any contribute is welcomed!

### Install dependencies

Before building the code, make sure you have installed all dependencies using this command:
```sh
npm install
```

### Build and watch

Start with `npm watch` to launch a node process build Rimebow and watching any new code changes. You only need to run this once and then use "Start Debugging" or "Run without debugging" to start a VSCode with extension host, where you can find the Rimebow extension listed on the left panel.

```sh
npm watch
```
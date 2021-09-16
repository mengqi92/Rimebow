# 元宝 Rimebow
元宝（Rimebow），你的一站式 RIME 配置管理助手。

[![version](https://badgen.net/vs-marketplace/v/MengqiPei.rimebow?color=green)](https://marketplace.visualstudio.com/items?itemName=MengqiPei.rimebow)
![CI Status](https://github.com/mengqi92/Rimebow/actions/workflows/main.yml/badge.svg)

## 核心功能

### RIME 文件浏览器；
- 一个界面浏览多处配置：无需来回切换程序配置目录和用户配置目录；
![文件浏览器](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/fileExplorer.gif)
### RIME 结点浏览器；
- 合并显示用户自定义配置与系统配置：哪些配置项打了补丁，打的补丁有没有生效，一目了然；
![结点浏览器](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/nodeExplorer-hiearchy.gif)
- 配置项来源标识：系统设置（default.yaml）、自定义系统设置（default.custom.yaml）、配置方案（foo.schema.yaml）、补丁（foo.custom.yaml）分别由不同图标显示，当前生效的配置项来自哪个文件，一看便知；
- 配置项跳转：任意配置项结点，都可以一键跳转到其在源文件中的位置，方便后续编辑；
![配置结点定向](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/nodeExplorer-navigation.gif)
- 配置方案元信息显示：不用打开文件即可查看作者、版本等元信息；
![配置方案元信息](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/nodeExplorer-schemaTooltip.gif)

### RIME Language server
借助 language server 和 Yaml schema，VS Code 可以对配置方案进行配置项的提示和语法检查。

**注：该特性目前还在开发中，尚未完成，目前仅支持配置方案中的一部分配置项。**

![配置方案语法提示](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/languageServer-syntaxValidation.gif)

## 插件的配置
本插件提供以下 VS Code 配置项，你可以在 VS Code Settings 中搜索以下配置项进行调整：
### `rimebow.userConfigDir`: RIME 用户配置文件所在目录
* Windows 下（小狼毫）默认采用 `C:/Users/Foo/AppData/Roaming/Rime`
* macOS 下（鼠须管）默认采用 `/Users/Library/Rime`
* Linux 下 ibus-rime 默认采用 `~/.config/ibus/rime`，fcitx-rime 默认采用 `~/.config/fcitx/rime`
### `rimebow.defaultConfigDir`: RIME 程序配置文件所在目录
* Windows 下（小狼毫）默认采用 `C:/Program Files (x86)/Rime/weasel-x.xx.x/data`，（当存在多个 weasel-x.xx.x 目录时，取最近修改过的目录作为当前程序目录）
* macOS 下（鼠须管）默认采用 `/Library/Input Methods/Squirrel.app/Contents/SharedSupport/`
* Linux 下（ibus-rime/fcitx-rime）默认采用 `/usr/share/rime-data`

## 开发规划
- [ ] 支持 RIME 自定义编译命令
- [ ] 支持 import_present
- [ ] 繁体中文支持
- [ ] 配置语法校验
- [ ] Rime 配置语法 Language server 以及 schema
- [ ] 在编辑器中显示配色方案颜色
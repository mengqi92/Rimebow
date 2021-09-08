# 元宝 Rimebow
元宝（Rimebow），你的一键式 RIME 配置管理中心。

## 核心功能

### RIME 文件浏览器；
- 在一个界面浏览多处配置：无需来回切换程序配置目录和用户配置目录；
![文件浏览器](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/fileExplorer.gif)
### RIME 结点浏览器；
- 用户自定义配置与配置方案的配置项自动合并显示，当前生效的是自定义配置还是系统配置，一目了然；
![结点浏览器](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/nodeExplorer-hiearchy.gif)

- 配置文件按类别分类：系统设置、配置方案（foo.schema.yaml）、补丁（foo.custom.yaml）由不同图标显示，一眼区分不同来源的配置项；
- 直接定位并编辑每一个配置结点所在的源文件；
![配置结点定向](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/nodeExplorer-navigation.gif)
- 配置方案元信息显示：不用打开文件即可查看作者、版本等元信息；
![配置方案元信息](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/nodeExplorer-schemaTooltip.gif)

### RIME Language server
在 VS Code 中编辑配置方案时，借助 language server，编辑器可以对配置方案进行一些基本的语法检查，并且会对不同配置项的含义进行提示。

![配置方案语法提示](https://raw.githubusercontent.com/mengqi92/Rimebow/master/resources/documentation/screencast/languageServer-syntaxValidation.gif)

**注：该特性目前还在开发中，尚未完善，目前只支持了一部分基础配置项。**

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

## 发布日志 (Release Notes)
### 0.1.0
* 配置文件浏览器
* 配置结点浏览器

### 0.2.0
* RIME language server

## 开发规划
- [ ] 配置语法校验
- [ ] Rime 配置语法 Language server 以及 schema
- [ ] import_present 支持
- [ ] 在编辑器中显示配色方案颜色
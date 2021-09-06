# Rimebow (元宝)
元宝（Rimebow），你的一键式 RIME 方案管理中心。

## 核心功能

### RIME 文件浏览器；
- 在一个界面浏览多处配置：无需来回切换程序配置目录和用户配置目录；
### RIME 结点浏览器；
- 用户自定义配置与配置方案的配置项自动合并显示，当前生效的是自定义配置还是系统配置，一目了然；
- 配置文件按类别分类：系统设置、配置方案（foo.schema.yaml）、补丁（foo.custom.yaml）由不同图标显示，一眼区分不同来源的配置项；
- 直接定位并编辑每一个配置结点所在的源文件
- 配置方案元信息显示：不用打开文件即可查看作者、版本等元信息
### RIME Language server
在 VS Code 中编辑配置方案时，借助 language server，编辑器可以对配置方案进行一些基本的语法检查，并且会对不同配置项的含义进行提示。

**注：该特性目前还在开发中，尚未完善，目前只支持了一部分基础配置项。**

## Extension Settings
This extension contributes the following settings:
* `rimebow.userConfigDir`: The directory containing RIME user configuration.
* `rimebow.defaultConfigDir`: The directory containing RIME default configuration.
* `rimeLanguageServer.maxNumberOfProblems`: The maximum number of problems produced by the language server. Set this number lower if you met too many errors raised by the language server.

## 开发调试
如果你需要对本插件进行调试开发，或者有兴趣了解本插件的实现细节，可以
1. 在源代码根目录执行：
```shell
npm install
npm watch
```
（你也可以直接在 VS Code 中 Ctrl/Command-Shift-P 调出 Command Pallete -> Tasks: Run Task 来执行这两个 npm 命令）
2. 通过 VS Code 打开源代码根目录
3. 修改代码或者添加断点
4. 调用 VS Code 的 Run -> Start Debugging 或 Run without Debugging 命令启动 Extension Development Host（另一个 VS Code 窗口）
5. 在新打开的 Extension Development Host 窗口中，你可以在左边的侧边栏中找到 Rimebow 插件

请阅读[官方文档](https://code.visualstudio.com/api)获取更多 VS Code 插件开发相关知识。

## 发布日志 (Release Notes)

### 0.1.0

## 开发规划
- [ ] 配置语法校验
- [ ] Rime 配置语法 Language server 以及 schema
- [ ] import_present 支持
- [ ] 通过 VS Code task 重新部署 RIME
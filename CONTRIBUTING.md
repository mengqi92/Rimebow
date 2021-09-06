# 参与
Rimebow 还不是一个完善的产品，如果你有兴趣，无论是提 issue、改 bug、加 feature、完善文档，我们都欢迎你来参与到这个项目中来，一起让 RIME 社区变得更好！

需要注意的是，在提 issue 之前，请先打开 Github issues 面板搜索一下，是否已经存在相关讨论，避免重复劳动。同样地，在捋起袖子准备大改一番代码前，也请看看是否已经有人发了相关的 pull request，或是在 issue 进行过讨论，尽量避免付出不必要的劳动。

## 调试和运行
如果你需要对本插件进行调试开发，或者有兴趣了解本插件的实现细节，可以
1. Fork 并 clone 本仓库
2. 在源代码根目录执行：
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

## 单元测试
提交代码前，请确保添加了相关的单元测试用例进行测试覆盖。
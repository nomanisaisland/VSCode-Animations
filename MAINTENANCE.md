# VSCode Animations Plus 维护指南

本文档旨在帮助开发者了解插件的内部机制、目录结构以及开发流程，以便进行后续维护。

## 1. 使用教程
1. **安装 VSIX**: 在 VS Code 扩展面板中点击 `...` -> `Install from VSIX...`，选择生成的 `.vsix` 文件。
2. **初始化注入**: 按 `Ctrl + Shift + P` 运行 `Animations: Install Animations`。这一步会将注入脚本的路径写入到 Loader 扩展（如 Custom CSS and JS Loader）的配置中。
3. **激活 Loader**: 运行 Loader 扩展的安装命令（例如 `Enable Custom CSS and JS`）。
4. **重启窗口**: 完全关闭并重新打开 VS Code。
5. **处理警告**: 如果看到“安装似乎损坏”的提示，点击齿轮图标选择“不再显示”即可。这是注入成功的正常表现。

## 2. 配置教程
所有的配置项都定义在 `package.json` 的 `contributes.configuration` 中。
- **Enabled**: 是否启用全局动画。
- **Install-Method**: 选择注入方式（推荐使用 Custom CSS and JS）。
- **Smooth-Mode**: 是否启用窗口平滑移动动画。
- **Durations**: 各类动画的具体持续时间（毫秒）。
- **CursorAnimation**: 光标跟随动画及其样式设置。

## 3. 文件目录作用
- **`src/`**: 插件的主体代码（运行在扩展主机进程中）。
    - `extension.ts`: 插件生命周期管理与命令注册。
    - `install.ts`: 处理注入逻辑，管理注入路径。
    - `messenger.ts`: 负责将 CSS 和配置数据通过“信使”（状态栏项）传递给注入脚本。
    - `css.ts`: 负责读取 `src/scss` 编译后的 CSS 并进行动态变量替换。
- **`src/custom/`**: 注入脚本的代码（直接运行在 VS Code 的浏览器渲染进程中）。
    - `updateHandler.ts`: 注入脚本的入口，负责接收数据并分发给各处理器。
    - `messenger.ts`: **核心组件**，负责在 DOM 中寻找插件创建的“信使”元素并读取数据。
    - `style.ts`: 负责将接收到的 CSS 插入到页面的 `<style>` 标签中。
    - `handlers/`: 包含具体的 UI 处理逻辑（如标签页、焦点、资源管理器动画）。
- **`src/scss/`**: 动画的样式源文件。
- **`dist/`**: 编译后的产物目录。

## 4. 入口文件
1. **插件入口**: `src/extension.ts`。负责 VS Code API 的交互。
2. **注入脚本入口**: `src/custom/updateHandler.ts`。负责操作 DOM 和实现 CSS 动画逻辑。
3. **样式入口**: `src/scss/Default-Transitions.scss`。定义了基础的过渡效果。

## 5. 启动与开发教程
1. **环境准备**: 确保已安装 Node.js，并在根目录运行 `npm install`。
2. **开发模式**:
   - 运行 `npm run watch`。这会同时启动 Webpack 监控和 Sass 监控。
   - 在 VS Code 中按 `F5` 启动“扩展开发宿主”进行调试。
3. **修改注入代码**: 修改 `src/custom/` 下的代码后，需要重新运行 `Animations: Install Animations` 并重启宿主窗口才能看到变化。

## 6. 打包教程
我们已经配置好了自动化打包脚本：
1. **清理并打包**: 运行 `npm run vsix`。
2. **内部流程**:
   - 自动运行 `vscode:prepublish`。
   - 执行 `webpack --mode production` 进行代码混淆和压缩。
   - 执行 `sass` 编译样式。
   - 调用 `vsce package` 生成 `.vsix` 安装包。
3. **产物**: 根目录下会生成 `vscode-animations-plus-x.x.x.vsix`。

---
**维护提示**: VS Code 更新后如果动画失效，通常是因为 UI 类名改变。请优先检查 `src/custom/handlers/` 下的选择器，并查看 `src/custom/messenger.ts` 是否能正常找到信使元素。
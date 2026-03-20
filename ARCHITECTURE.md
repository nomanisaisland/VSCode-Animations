# VSCode Animations Plus 工作原理详解

本插件的核心挑战在于：**VS Code 的插件 API 官方并不支持直接修改编辑器界面的 DOM 或注入自定义 CSS/JS。** 为了绕过这个限制，我们采用了一种“跨进程通信”的方案。

## 1. 核心架构图
```text
[ VS Code 扩展主机进程 (Node.js) ]          [ VS Code 渲染进程 (浏览器环境) ]
      (插件主体代码)                               (注入的脚本)
            |                                           |
    1. 读取设置 & 编译 SCSS                       4. 扫描 DOM 寻找信使
            |                                           |
    2. 生成包含 CSS 的 JSON                         5. 读取并解析 JSON 数据
            |                                           |
    3. 更新状态栏项 (StatusBarItem)  <---(共享 DOM)--->  6. 注入 <style> 并启动动画
       (充当数据“信使”)
```

## 2. 详细步骤拆解

### 第一步：注入 (Injection)
插件本身无法直接修改界面。我们依赖于第三方的 Loader（如 `Custom CSS and JS Loader`）。
- 在运行 `Install Animations` 命令时，插件会获取 `dist/updateHandler.js` 的绝对路径。
- 插件将此路径写入 Loader 扩展的配置中。
- 当 VS Code 启动时，Loader 会将这个 JS 文件直接插入到 VS Code 的 HTML 主窗口（`workbench.html`）中。

### 第二步：数据准备 (Data Preparation)
插件在 Node.js 环境下运行：
- 监控配置变化（如用户改变了动画速度或禁用了某个动画）。
- 实时读取 `src/scss` 下的样式文件。
- 将最终的 CSS 字符串和配置开关封装成一个大的 JSON 对象。

### 第三步：建立通信桥梁 (Communication Bridge)
由于 Node.js 进程和渲染进程（界面）是隔离的，我们利用了 **状态栏 (Status Bar)** 作为中转站：
- 插件创建一个唯一的状态栏项（`messengerItem`）。
- 插件将加密/封装后的 JSON 数据赋值给状态栏项的 `accessibilityInformation.label`（即 HTML 中的 `aria-label` 属性）。
- **关键点**：状态栏项是 VS Code 界面的一部分，因此它在 DOM 中是可见的。

### 第四步：数据接收与应用 (Data Consumption)
注入到界面的脚本（`updateHandler.js`）在浏览器环境下运行：
- 它会启动一个高频定时器，在 DOM 中扫描所有带有 `aria-label` 且内容符合 JSON 特征的元素。
- 一旦锁定目标（信使），它就会读取 `aria-label` 中的 CSS 字符串。
- 脚本创建一个 ID 为 `VSCode-Animations-custom-css` 的 `<style>` 标签并插入到 `<body>` 中。
- 此时，CSS 动画正式生效。

### 第五步：逻辑监听 (Event Handlers)
有些动画（如标签页切换）不仅靠 CSS，还需要 JS 配合：
- `tabsHandler.ts` 会创建一个 `MutationObserver`。
- 它实时监控标签栏容器的 DOM 变化。
- 当检测到标签页被添加或删除时，它会动态给这些 DOM 节点加上特定的 CSS 类名（如 `deletedTab`），从而触发预设的 CSS 关键帧动画。

## 3. 为什么之前会失效？
1. **类名变更**：VS Code 更新了布局引擎，将 `monaco-split-view` 改为了 `monaco-split-view2`，导致 CSS 选择器失效。
2. **渲染机制改变**：新版 VS Code 只有在状态栏有实际内容时才会渲染 `aria-label`。我们通过强制添加一个带图标的空格，确保了信使元素始终出现在 DOM 中。
3. **注入环境 ESM 化**：VS Code 开始使用 ES Module 加载核心脚本，我们通过增强 `Messenger` 的扫描范围，确保了在模块化环境下依然能定位到数据源。

## 4. 维护要点
如果你发现“配置改了但界面没反应”，请按以下顺序排查：
1. **检查信使**：在开发人员工具中看状态栏是否有那个带有长串 JSON 的元素。
2. **检查注入**：看控制台是否有插件的 `Successfully Installed` 日志。
3. **检查 CSS**：看 `<body>` 下是否生成了我们的 `<style>` 标签，内容是否正确。
```
VSCode Animations Plus: Successfully Installed!
workbench.html:45 VSCode Animations Plus: Loading update handler...
workbench.html:45 VSCode Animations Plus: Found messenger by aria-label content match.
workbench.html:45 VSCode Animations Plus: Messenger found and data received!
```
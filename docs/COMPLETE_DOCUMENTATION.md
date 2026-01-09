# OpenCode HUD 项目完整文档

> 版本：1.0.0  
> 作者：twischen-dot  
> 许可证：MIT  
> GitHub：https://github.com/twischen-dot/opencode-hud

---

## 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [系统架构](#系统架构)
- [技术实现细节](#技术实现细节)
- [API 参考](#api-参考)
- [安装部署指南](#安装部署指南)
- [使用指南](#使用指南)
- [开发指南](#开发指南)
- [故障排除](#故障排除)
- [架构决策记录](#架构决策记录)
- [性能优化](#性能优化)
- [未来规划](#未来规划)
- [常见问题](#常见问题)

---

## 项目概述

### 1.1 项目背景

OpenCode HUD 是一个受 Claude HUD 启发的实时状态显示插件，为 OpenCode AI 编程助手提供可视化的运行状态监控界面。该项目旨在提升开发者在使用 OpenCode 过程中的透明度和控制感，让用户能够实时了解会话状态、工具调用情况和资源使用情况。

在现代 AI 辅助编程环境中，理解 AI 助手的工作状态变得越来越重要。Claude HUD 作为 Claude Code 的一个流行插件，展示了实时状态显示对于提升开发体验的巨大价值。OpenCode HUD 借鉴了这一理念，专门为 OpenCode 平台定制开发，实现了类似的功能集。

### 1.2 核心价值主张

OpenCode HUD 的核心价值体现在以下几个方面：

**实时透明性**：用户可以实时查看 OpenCode 会话的各种状态信息，包括消息计数、工具调用统计、模型信息等。这种透明性帮助用户更好地理解 AI 的工作方式，从而更有效地与之协作。

**性能监控**：通过追踪消息数量和工具调用频率，用户可以了解会话的复杂度和资源使用情况。这对于长时间运行的会话尤其有价值，可以帮助识别潜在的性能问题。

**开发者友好**：项目采用 TypeScript 开发，提供完整的类型定义和清晰的代码结构，便于理解和扩展。同时，支持 ES Module 模块系统，符合现代 JavaScript 开发标准。

**轻量级设计**：项目遵循最小依赖原则，仅依赖 OpenCode 官方插件 SDK，不引入额外的运行时依赖，确保安装包体积小、启动速度快。

### 1.3 版本信息

| 版本号 | 发布日期 | 主要变更 |
|--------|----------|----------|
| 0.1.0 | 2026-01-09 | 初始版本发布，实现核心功能 |

### 1.4 技术栈

- **运行时**：Node.js 18+
- **语言**：TypeScript 5.0+
- **模块系统**：ES Modules (NodeNext)
- **编译目标**：ES2022
- **依赖**：
  - @opencode-ai/plugin (>=1.1.4)
  - @opencode-ai/sdk (>=1.1.4)
  - zod (>=4.1.8)

---

## 核心功能

### 2.1 实时状态监控

OpenCode HUD 提供多维度的实时状态监控功能，帮助用户全面了解当前会话的运行状态。

**会话信息显示**：
- 会话 ID 显示（截取前 8 位用于保护隐私）
- 当前使用的模型信息（包括提供商和模型名称）
- 消息计数统计
- 最后活动时间显示

**状态更新机制**：
- 插件进程在每次状态变化时更新共享文件
- HUD 进程每 300 毫秒刷新一次显示
- 仅在状态实际变化时更新终端输出，减少屏幕闪烁

### 2.2 消息计数追踪

消息计数是衡量会话活跃度的重要指标。OpenCode HUD 提供了完整的消息追踪功能：

- **实时计数**：显示当前会话中已处理的消息总数
- **会话重置**：当检测到新的会话 ID 时，自动重置计数器
- **类型区分**：区分用户消息和 AI 消息（通过事件类型）

**计数触发条件**：
- 接收到新的 chat.message 事件时计数器 +1
- 新会话开始时计数器重置为 0

### 2.3 工具调用统计

OpenCode HUD 详细记录了所有工具调用的情况，包括：

**支持的工具类型**：
- 文件操作工具：read、write、edit、glob
- 系统工具：bash、exec
- 代码分析工具：grep、search
- 任务管理工具：task、agent

**统计信息**：
- 每个工具的调用次数
- 工具调用时间线
- 调用频率分析

**数据展示格式**：
```
Tools:
  bash: 5
  read: 10
  edit: 3
  grep: 7
```

### 2.4 模型信息显示

当 OpenCode 使用特定模型进行推理时，HUD 会显示：

- **提供商名称**：例如 "openai"、"anthropic"、"google" 等
- **模型标识**：例如 "gpt-4"、"claude-3-opus" 等
- **模型切换通知**：当检测到模型变化时，更新显示

### 2.5 活动时间追踪

最后活动时间是一个重要的健康指标，帮助用户了解会话的活跃程度：

- **实时更新**：每次收到新消息或工具调用时更新
- **相对时间显示**：自动转换为易读的格式（秒或分钟）
- **超时检测**：可用于识别长时间无响应的会话

### 2.6 自定义工具

OpenCode HUD 提供了一个内置工具 `hud:status`，允许用户随时查询当前状态：

**使用方法**：
```
/hud:status
```

**返回格式**：
```
[OpenCode HUD]
Session: a1b2c3d4
Messages: 15
Model: openai/gpt-4
Tools: bash: 5, read: 10, edit: 3
Last activity: 2m ago
```

---

## 系统架构

### 3.1 整体架构设计

OpenCode HUD 采用双进程架构设计，将数据收集和状态显示分离，实现高内聚低耦合的系统结构。

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenCode HUD 系统架构                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────┐       │
│  │    插件进程           │         │    HUD 显示进程      │       │
│  │  (Plugin Process)    │         │ (HUD Display Process)│       │
│  ├─────────────────────┤         ├─────────────────────┤       │
│  │                     │         │                     │       │
│  │  ┌───────────────┐  │         │  ┌───────────────┐  │       │
│  │  │  Hooks 处理器  │  │         │  │   状态读取器   │  │       │
│  │  │              │  │         │  │               │  │       │
│  │  │ chat.message │──┼──┐      │  │               │  │       │
│  │  │ tool.before  │  │  │      │  │ 读取状态文件   │  │       │
│  │  │ tool.after   │  │  │      │  │               │  │       │
│  │  └───────────────┘  │  │      │  └───────────────┘  │       │
│  │                     │  │      │         │           │       │
│  │  ┌───────────────┐  │  │      │         ▼           │       │
│  │  │  状态管理器    │  │  │      │  ┌───────────────┐  │       │
│  │  │              │  │  │      │  │   UI 渲染器    │  │       │
│  │  │ 收集并聚合    │──┼──┼──────┼─│               │  │       │
│  │  │ 状态数据      │  │  │      │  │ 终端 UI 渲染   │  │       │
│  │  └───────────────┘  │  │      │  └───────────────┘  │       │
│  └─────────────────────┘  │      └─────────────────────┘       │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │    共享状态文件          │
              │  (Temporary Directory)  │
              │                         │
              │  opencode-hud-state.json│
              └─────────────────────────┘
```

### 3.2 组件详解

#### 3.2.1 插件进程（plugin.ts）

插件进程是整个系统的数据收集核心，运行在 OpenCode 插件环境中。

**核心职责**：
- 注册并处理 OpenCode 提供的各种 hooks
- 维护当前会话的状态信息
- 将状态数据持久化到共享文件
- 提供自定义工具供用户调用

**状态管理**：
- 使用模块级全局变量存储状态（单例模式）
- 支持多会话场景下的状态隔离
- 自动检测会话变化并重置状态

**生命周期**：
1. 初始化：创建空状态对象
2. 注册 hooks：绑定事件处理器
3. 运行时：接收事件并更新状态
4. 持久化：将状态写入共享文件

#### 3.2.2 HUD 显示进程（hud-process.ts）

显示进程负责从共享文件读取数据并在终端中渲染 UI。

**核心职责**：
- 监控状态文件变化
- 解析状态数据
- 渲染终端 UI
- 处理用户中断信号

**渲染策略**：
- 定期轮询状态文件（300ms 间隔）
- 仅在状态变化时重新渲染
- 使用 ANSI 转义序列实现无闪烁更新

**UI 布局**：
- 顶部边框和标题
- 会话信息区域
- 工具统计区域
- 底部边框和版本信息

#### 3.2.3 状态数据结构

状态数据以 JSON 格式存储，包含以下字段：

```typescript
interface HUDState {
  sessionId: string;           // 会话唯一标识
  messages: number;            // 消息计数
  tools: Record<string, number>; // 工具调用统计
  lastActivity: string;        // 最后活动时间（ISO 8601）
  model?: {
    provider: string;         // 模型提供商
    model: string;            // 模型名称
  };
}
```

### 3.3 数据流设计

数据在系统中的流动遵循以下路径：

```
用户操作 → OpenCode Core → 插件 Hook 触发
    │
    ▼
插件进程接收事件并更新状态
    │
    ▼
状态管理器聚合数据
    │
    ▼
写入共享文件（JSON 格式）
    │
    ▼
HUD 进程检测到文件变化
    │
    ▼
读取并解析状态数据
    │
    ▼
渲染终端 UI
```

### 3.4 进程间通信

本项目采用文件共享的方式进行进程间通信，主要考虑以下因素：

**选择文件通信的原因**：
- 简单可靠，无需复杂的 IPC 机制
- 天然支持跨平台
- 便于调试和排查问题
- 适合低频率的状态同步

**替代方案考虑**：
- Unix Domain Socket：性能更好但跨平台性差
- WebSocket：需要额外服务器组件
- 共享内存：实现复杂且易出错

### 3.5 状态文件位置

状态文件存储在系统临时目录中：

- **Linux/macOS**：`/tmp/opencode-hud-state.json`
- **Windows**：`%TEMP%\opencode-hud-state.json`

文件路径通过 `getHUDStatePath()` 函数动态获取，确保跨平台兼容性。

---

## 技术实现细节

### 4.1 OpenCode 插件系统集成

#### 4.1.1 Hooks 实现

OpenCode 提供了丰富的 hooks 机制，允许插件在特定事件发生时执行自定义逻辑。OpenCode HUD 使用了以下 hooks：

**chat.message Hook**：
- 触发时机：收到新消息时
- 处理逻辑：更新消息计数器、检查会话变化、更新模型信息
- 代码位置：`plugin.ts` 第 29-47 行

```typescript
"chat.message": async (input: any) => {
  // 检查是否是新的会话
  if (globalState && input.sessionID !== globalState.sessionId) {
    globalState.sessionId = input.sessionID;
    globalState.messages = 0;
    globalState.tools.clear();
  }

  // 更新状态
  if (globalState) {
    globalState.messages++;
    globalState.lastActivity = new Date();
    if (input.model) {
      globalState.model = {
        provider: input.model.providerID,
        model: input.model.modelID,
      };
    }
    await notifyStateChange();
  }
}
```

**tool.execute.before Hook**：
- 触发时机：工具执行前
- 处理逻辑：更新时间戳，标记活动状态
- 代码位置：`plugin.ts` 第 49-54 行

**tool.execute.after Hook**：
- 触发时机：工具执行后
- 处理逻辑：更新工具调用计数
- 代码位置：`plugin.ts` 第 56-63 行

```typescript
"tool.execute.after": async (input: any, output: any) => {
  if (globalState) {
    const count = globalState.tools.get(input.tool) || 0;
    globalState.tools.set(input.tool, count + 1);
    globalState.lastActivity = new Date();
    await notifyStateChange();
  }
}
```

#### 4.1.2 工具定义

OpenCode HUD 提供了一个自定义工具 `hud:status`，使用 OpenCode 的工具 schema 定义：

```typescript
"hud:status": tool({
  description: "显示当前 HUD 状态",
  args: {},
  async execute(args: any, context: any) {
    return getStatusReport();
  },
})
```

**工具特性**：
- 无参数输入（args: {}）
- 返回格式化字符串报告
- 可在任何时候调用

### 4.2 ES Module 兼容性

#### 4.2.1 动态导入模式

由于项目使用 ES Module（`"type": "module"`），传统的 `require()` 调用不可用。项目采用动态 `import()` 方式加载内置模块：

**Node.js 内置模块导入**：
```typescript
// 文件系统模块
const fs = await import("fs");
fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));

// 操作系统模块
const os = await import("os");
const tmpdir = os.default.tmpdir();

// 路径模块
const path = await import("path");
const filePath = path.default.join(tmpdir, "state.json");
```

**异步路径解析**：
```typescript
export function getHUDStatePath(): Promise<string> {
  return (async () => {
    const os = await import("os");
    const path = await import("path");
    return path.default.join(os.default.tmpdir(), "opencode-hud-state.json");
  })();
}
```

#### 4.2.2 异步状态持久化

状态写入采用异步模式，确保不会阻塞主线程：

```typescript
async function writeStateFile() {
  if (!globalState) return;

  const statePath = await getHUDStatePath();
  const stateData = {
    sessionId: globalState.sessionId,
    messages: globalState.messages,
    tools: Object.fromEntries(globalState.tools),
    lastActivity: globalState.lastActivity.toISOString(),
    model: globalState.model,
  };

  try {
    const fs = await import("fs");
    fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
  } catch (error) {
    console.error("[HUD Plugin] Failed to write state:", error);
  }
}
```

### 4.3 终端 UI 渲染

#### 4.3.1 ANSI 转义序列

HUD 使用 ANSI 转义序列实现终端 UI：

**清屏和光标定位**：
```typescript
private clearScreen() {
  // \x1b[2J - 清屏
  // \x1b[H - 光标移动到左上角
  process.stdout.write("\x1b[2J\x1b[H");
}
```

**颜色和样式**（未来扩展）：
```typescript
// 绿色
const green = "\x1b[32m";
// 黄色
const yellow = "\x1b[33m";
// 红色
const red = "\x1b[31m";
// 重置
const reset = "\x1b[0m";
```

#### 4.3.2 动态布局计算

UI 采用动态布局，确保内容对齐：

```typescript
private renderState(state: HUDState) {
  // 计算会话 ID 后的填充空格
  const sessionPadding = " ".repeat(40);

  // 计算模型信息的填充
  const modelText = state.model
    ? `${state.model.provider}/${state.model.model}`
    : "N/A";
  const modelPadding = " ".repeat(38);

  // 生成工具列表
  const toolLines = Object.entries(state.tools)
    .map(([name, count]) => `  ${name}: ${count}`)
    .join("\n");

  // 构建输出
  const output = `
╔══════════════════════════════════════════════════════════╗
║                    OpenCode HUD v0.1.0                    ║
╠══════════════════════════════════════════════════════════╣
║  Session: ${state.sessionId.substring(0, 8)}${sessionPadding}  ║
║  Model: ${modelText}${modelPadding}  ║
║  Messages: ${state.messages}${" ".repeat(45)}  ║
║  Activity: ${timeStr} ago${" ".repeat(39)}  ║
╚══════════════════════════════════════════════════════════╝
`;
}
```

#### 4.3.3 刷新策略

HUD 采用智能刷新策略，优化性能和用户体验：

```typescript
private async render() {
  const state = await this.readState();
  if (!state) {
    this.renderEmpty();
    return;
  }

  // 仅在状态变化时更新显示
  if (JSON.stringify(state) === JSON.stringify(this.lastState)) {
    return;
  }

  this.lastState = state;
  this.clearScreen();
  this.renderState(state);
}

private watchState() {
  // 300ms 刷新间隔
  this.timer = setInterval(() => {
    this.render();
  }, 300);
}
```

### 4.4 状态管理

#### 4.4.1 单例模式

项目使用模块级单例存储状态：

```typescript
let globalState: HUDState | null = null;

export const HUDPlugin = async (ctx: any): Promise<any> => {
  globalState = {
    sessionId: "",
    messages: 0,
    tools: new Map(),
    lastActivity: new Date(),
    model: undefined,
  };
  // ...
};
```

**优势**：
- 简单直观，无需复杂的依赖注入
- 状态访问速度快
- 内存占用低

**注意事项**：
- 适用于单会话场景
- 多会话时通过会话 ID 隔离

#### 4.4.2 会话隔离

当检测到新会话时，自动重置状态：

```typescript
if (globalState && input.sessionID !== globalState.sessionId) {
  globalState.sessionId = input.sessionID;
  globalState.messages = 0;
  globalState.tools.clear();
}
```

---

## API 参考

### 5.1 插件导出

#### 5.1.1 HUDPlugin

主插件导出函数。

```typescript
export const HUDPlugin: Plugin = async (ctx: any): Promise<any> => {
  // 初始化逻辑
}
```

**参数**：
- `ctx: PluginInput` - OpenCode 提供的插件上下文

**返回值**：
- `Promise<Hooks>` - 包含 hooks 和工具定义的对象

### 5.2 状态接口

#### 5.2.1 HUDState

```typescript
export interface HUDState {
  sessionId: string;
  messages: number;
  tools: Map<string, number>;
  lastActivity: Date;
  model?: {
    provider: string;
    model: string;
  };
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 当前会话的唯一标识 |
| messages | number | 是 | 已处理的消息总数 |
| tools | Map<string, number> | 是 | 工具调用统计 |
| lastActivity | Date | 是 | 最后活动时间 |
| model | object | 否 | 当前使用的模型信息 |

### 5.3 工具定义

#### 5.3.1 hud:status

查询当前 HUD 状态的自定义工具。

**输入参数**：无

**输出**：
```typescript
{
  content: string  // 格式化的状态报告
}
```

**示例返回**：
```
[OpenCode HUD]
Session: a1b2c3d4
Messages: 15
Model: openai/gpt-4
Tools: bash: 5, read: 10, edit: 3
Last activity: 2m ago
```

### 5.4 辅助函数

#### 5.4.1 getHUDStatePath

获取状态文件的路径。

```typescript
export function getHUDStatePath(): Promise<string>
```

**返回值**：Promise<string> - 状态文件的完整路径

---

## 安装部署指南

### 6.1 前置条件

在开始安装之前，请确保满足以下条件：

#### 6.1.1 系统要求

- **操作系统**：macOS、Linux 或 Windows
- **Node.js**：版本 18.0.0 或更高
- **包管理器**：npm（随 Node.js 附带）或 yarn

#### 6.1.2 必需软件

- **OpenCode**：版本 1.0.0 或更高
- **Git**：用于克隆仓库和版本管理

#### 6.1.3 验证命令

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 OpenCode 是否已安装
opencode --version
```

### 6.2 安装步骤

#### 6.2.1 克隆仓库

```bash
# 克隆项目到本地
git clone https://github.com/twischen-dot/opencode-hud.git

# 进入项目目录
cd opencode-hud
```

#### 6.2.2 构建项目

```bash
# 安装项目依赖
npm install

# 构建 TypeScript 代码
npm run build
```

**预期输出**：
```
> opencode-hud@0.1.0 build
> tsc
```

构建完成后，`dist/` 目录将包含编译后的 JavaScript 文件。

#### 6.2.3 安装插件

OpenCode 插件安装有两种方式：

**方式一：通过 npm 安装本地包**

```bash
# 切换到 OpenCode 配置目录
cd ~/.opencode

# 安装插件
npm install /path/to/opencode-hud
```

**方式二：直接链接（开发模式）**

```bash
cd ~/.opencode
npm link /path/to/opencode-hud
```

#### 6.2.4 配置 OpenCode

根据 OpenCode 的插件配置方式，可能需要创建或修改配置文件：

1. 在 OpenCode 配置目录创建插件配置
2. 指定插件入口点
3. 重启 OpenCode 使配置生效

### 6.3 启动 HUD 显示进程

在另一个终端窗口中启动 HUD 显示进程：

```bash
cd opencode-hud
npm run start
```

**预期输出**：
```
╔══════════════════════════════════════════════════════════╗
║                    OpenCode HUD v0.1.0                    ║
╠══════════════════════════════════════════════════════════╣
║  Waiting for OpenCode session...                            ║
║  Start OpenCode to see real-time status.                    ║
╚══════════════════════════════════════════════════════════╝
```

### 6.4 验证安装

#### 6.4.1 检查插件加载

1. 启动 OpenCode：
   ```bash
   opencode
   ```

2. 在 OpenCode 中运行命令：
   ```
   /hud:status
   ```

3. 应看到类似以下输出：
   ```
   [OpenCode HUD]
   Session: a1b2c3d4
   Messages: 0
   Model: N/A
   Tools: None
   Last activity: just now
   ```

#### 6.4.2 检查 HUD 显示

查看 HUD 显示进程终端窗口，应显示实时状态更新。

### 6.5 故障排除

#### 6.5.1 常见安装问题

**问题：npm install 失败**

可能原因：
- 网络连接问题
- 权限不足
- Node.js 版本不兼容

解决方案：
```bash
# 使用淘宝镜像（如果在国内）
npm install --registry=https://registry.npmmirror.com

# 检查 Node.js 版本
node --version

# 确保版本 >= 18
```

**问题：构建失败**

可能原因：
- TypeScript 类型错误
- 依赖缺失
- 编译配置问题

解决方案：
```bash
# 删除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install

# 运行类型检查
npm run typecheck
```

#### 6.5.2 运行时问题

**问题：HUD 显示 "Waiting for OpenCode session"**

可能原因：
- OpenCode 未启动
- 插件未正确加载
- 状态文件路径问题

解决方案：
1. 确保 OpenCode 已启动
2. 检查插件是否正确安装
3. 手动检查状态文件是否存在：
   ```bash
   cat /tmp/opencode-hud-state.json
   ```

---

## 使用指南

### 7.1 基础使用

#### 7.1.1 启动流程

**第一步：启动 HUD 显示进程**

```bash
cd opencode-hud
npm run start
```

**第二步：启动 OpenCode**

```bash
opencode
```

**第三步：开始使用 OpenCode**

随着你使用 OpenCode 进行开发，HUD 会自动显示实时状态。

#### 7.1.2 理解显示内容

HUD 显示界面分为几个区域：

```
╔══════════════════════════════════════════════════════════╗
║                    OpenCode HUD v0.1.0                    ║
╠══════════════════════════════════════════════════════════╣
║  Session: a1b2c3d4     ← 会话标识（截取前 8 位）            ║
║  Model: openai/gpt-4   ← 当前使用的模型                    ║
║  Messages: 15          ← 已处理的消息数                     ║
║  Activity: 2m ago      ← 最后活动距今时间                   ║
║                                                         ║
║  Tools:               ← 工具调用统计                       ║
║    bash: 5                                               ║
║    read: 10                                              ║
║    edit: 3                                               ║
╚══════════════════════════════════════════════════════════╝
```

### 7.2 高级功能

#### 7.2.1 使用 hud:status 工具

在任何 OpenCode 对话中，你都可以使用 `/hud:status` 命令查询当前状态：

**使用方法**：
```
/hud:status
```

**返回示例**：
```
[OpenCode HUD]
Session: a1b2c3d4
Messages: 15
Model: openai/gpt-4
Tools: bash: 5, read: 10, edit: 3
Last activity: 2m ago
```

#### 7.2.2 多会话支持

OpenCode HUD 自动支持多会话场景：

1. 当你开始新会话时，HUD 会自动检测
2. 消息计数器重置为 0
3. 工具统计清零
4. 显示新的会话 ID

### 7.3 状态解读

#### 7.3.1 活动状态指示

| 状态 | 显示 | 含义 |
|------|------|------|
| 活跃 | just now / 5s ago | 正在交互中 |
| 正常 | 1m ago - 5m ago | 最近有活动 |
| 空闲 | > 5m ago | 长时间无操作 |
| 超时 | > 30m ago | 可能需要检查 |

#### 7.3.2 工具统计解读

工具调用频率可以帮助理解会话的复杂度：

- **高 read 调用**：可能涉及大量文件浏览
- **高 edit 调用**：频繁修改代码
- **高 bash 调用**：运行脚本或命令
- **高 grep 调用**：搜索代码库

### 7.4 最佳实践

#### 7.4.1 开发工作流

1. **开发前启动 HUD**：
   ```bash
   # 终端 1
   cd opencode-hud && npm run start
   
   # 终端 2
   opencode
   ```

2. **定期检查状态**：HUD 可以帮助你了解会话是否正常

3. **新会话开始时**：观察 HUD 重置，确保状态干净

#### 7.4.2 性能监控

通过观察工具调用模式，可以识别潜在问题：

- 异常高的工具调用可能表示循环或错误
- 长时间无活动可能需要刷新或重启

---

## 开发指南

### 8.1 项目结构

```
opencode-hud/
├── .git/                    # Git 版本控制
├── .gitignore              # Git 忽略配置
├── docs/                   # 文档目录
│   └── COMPLETE_DOCUMENTATION.md
├── src/                    # 源代码目录
│   ├── index.ts           # 入口文件
│   ├── plugin.ts          # 插件主逻辑
│   └── hud-process.ts     # HUD 显示进程
├── dist/                   # 编译输出目录
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目说明
```

### 8.2 开发环境设置

#### 8.2.1 克隆和安装

```bash
# 克隆仓库
git clone https://github.com/twischen-dot/opencode-hud.git
cd opencode-hud

# 安装依赖
npm install

# 安装到 OpenCode（开发模式）
cd ~/.opencode
npm link /path/to/opencode-hud
```

#### 8.2.2 开发模式

启用 TypeScript 监视模式，自动重新编译：

```bash
npm run dev
```

**效果**：修改源代码后自动编译，无需手动运行 `npm run build`

### 8.3 调试技巧

#### 8.3.1 插件调试

在插件代码中添加日志：

```typescript
export const HUDPlugin = async (ctx: any): Promise<any> => {
  console.log("[HUD Plugin] Initializing...");
  console.log("[HUD Plugin] Context:", JSON.stringify(ctx, null, 2));
  // ...
};
```

查看日志：
```bash
# 启动 OpenCode 并查看输出
opencode --print-logs --log-level DEBUG
```

#### 8.3.2 HUD 进程调试

HUD 进程的标准输出可以直接在终端查看：

```bash
npm run start
```

#### 8.3.3 状态文件检查

手动检查状态文件内容：

```bash
cat /tmp/opencode-hud-state.json
```

格式化输出：
```bash
cat /tmp/opencode-hud-state.json | jq
```

#### 8.3.4 远程调试

使用 Node.js 调试器：

```bash
node --inspect-brk dist/hud-process.js
```

然后在 Chrome DevTools 中访问 `chrome://inspect`

### 8.4 测试

#### 8.4.1 类型检查

运行 TypeScript 编译器进行类型检查：

```bash
npm run typecheck
```

#### 8.4.2 构建测试

确保项目可以成功编译：

```bash
npm run build
```

### 8.5 代码规范

#### 8.5.1 TypeScript 规范

- 使用 TypeScript 严格模式
- 避免使用 `any` 类型
- 为复杂函数添加类型注解
- 使用异步/等待而非回调

#### 8.5.2 代码风格

- 使用 2 空格缩进
- 使用单引号字符串
- 添加必要的注释
- 保持函数短小单一

#### 8.5.3 提交规范

遵循 Conventional Commits 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建或辅助工具更新

### 8.6 贡献指南

#### 8.6.1 贡献流程

1. Fork 项目仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

#### 8.6.2 开发建议

- 先创建 issue 讨论大改动
- 确保代码通过类型检查
- 添加必要的测试
- 更新相关文档

---

## 故障排除

### 9.1 常见问题

#### 9.1.1 HUD 不显示

**症状**：HUD 一直显示 "Waiting for OpenCode session"

**可能原因**：
- OpenCode 未启动
- 插件未正确加载
- 状态文件路径问题

**排查步骤**：
1. 检查 OpenCode 是否正在运行
2. 验证插件是否安装：`ls ~/.opencode/node_modules/ | grep opencode-hud`
3. 检查状态文件是否存在：
   ```bash
   ls -la /tmp/opencode-hud-state.json
   ```

#### 9.1.2 状态不更新

**症状**：HUD 显示的内容与实际不符，长时间无变化

**可能原因**：
- HUD 进程已停止
- 状态文件权限问题
- 插件 hooks 未正确注册

**排查步骤**：
1. 检查 HUD 进程是否运行：
   ```bash
   ps aux | grep hud-process
   ```
2. 手动更新状态文件测试写入权限
3. 检查 OpenCode 日志中是否有插件错误

#### 9.1.3 构建失败

**症状**：`npm run build` 报错

**可能原因**：
- TypeScript 类型错误
- 依赖未安装
- Node.js 版本不兼容

**排查步骤**：
1. 检查 TypeScript 错误信息
2. 重新安装依赖：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. 验证 Node.js 版本：`node --version`

#### 9.1.4 ES Module 错误

**症状**：`require is not defined in ES module scope`

**解决方案**：
项目已使用动态 `import()` 替代 `require()`。如果遇到此错误，请确保：
1. 使用最新版本的代码
2. 使用 Node.js 18+ 运行

### 9.2 错误代码参考

#### 9.2.1 Plugin Errors

| 错误代码 | 描述 | 解决方案 |
|----------|------|----------|
| PLUGIN_INIT_FAILED | 插件初始化失败 | 检查 OpenCode 日志 |
| HOOK_REGISTRATION_FAILED | Hook 注册失败 | 验证插件 SDK 版本 |
| STATE_WRITE_FAILED | 状态写入失败 | 检查文件权限 |

#### 9.2.2 HUD Process Errors

| 错误代码 | 描述 | 解决方案 |
|----------|------|----------|
| STATE_READ_FAILED | 状态读取失败 | 检查状态文件是否存在 |
| RENDER_FAILED | UI 渲染失败 | 检查终端兼容性 |
| SIGNAL_HANDLER_FAILED | 信号处理失败 | 检查操作系统支持 |

### 9.3 日志收集

当遇到问题时，收集以下信息有助于排查：

```bash
# OpenCode 日志
opencode --print-logs --log-level DEBUG > opencode.log 2>&1

# HUD 进程日志
npm run start > hud.log 2>&1

# 状态文件内容
cat /tmp/opencode-hud-state.json > state.json

# 系统信息
uname -a > system.info
node --version >> system.info
npm --version >> system.info
```

### 9.4 获取帮助

如果以上方法无法解决问题：

1. 查看 GitHub Issues 中是否有类似问题
2. 创建新的 Issue，包含：
   - 详细的问题描述
   - 复现步骤
   - 错误日志
   - 系统环境信息

---

## 架构决策记录

### 10.1 双进程架构

**决策**：采用插件进程和 HUD 显示进程分离的双进程架构

**背景**：
- OpenCode 插件运行在沙箱环境中，限制直接访问文件系统
- UI 渲染需要长时间运行，与插件生命周期不同步

**考虑方案**：
1. 单进程：插件内直接渲染 UI → 不可行，受限沙箱
2. WebSocket 通信：需要额外服务器组件 → 过于复杂
3. 文件共享：简单可靠，跨平台兼容 → **选择此方案**

**影响**：
- ✅ 架构清晰，职责分离
- ✅ 易于测试和维护
- ✅ 良好的跨平台兼容性
- ⚠️ 略微增加资源占用

### 10.2 ES Module 迁移

**决策**：使用 ES Module（`"type": "module"`）而非 CommonJS

**背景**：
- 现代 JavaScript 开发标准
- 与 OpenCode 插件系统保持一致

**考虑方案**：
1. CommonJS：传统 Node.js 模式 → 与插件系统不兼容
2. ES Module：现代标准 → **选择此方案**

**影响**：
- ✅ 与插件系统无缝集成
- ✅ 支持动态 `import()`
- ⚠️ 需要使用 `import()` 替代 `require()`

### 10.3 异步状态写入

**决策**：所有文件 I/O 操作采用异步方式

**背景**：
- 避免阻塞主线程
- 提高插件响应性

**实现方式**：
- `await import("fs")` 动态导入
- `writeFileSync` 同步写入（简化实现）
- 状态更新使用 `async/await`

**影响**：
- ✅ 不会阻塞事件循环
- ✅ 更好的错误处理
- ⚠️ 略微增加代码复杂度

### 10.4 300ms 刷新间隔

**决策**：HUD 进程每 300 毫秒刷新一次显示

**背景**：
- 平衡实时性和性能
- 人眼对更新的感知极限

**考虑方案**：
- 100ms：过于频繁，增加 CPU 负载
- 500ms：可能错过快速变化的状态
- 300ms：平衡点 → **选择此方案**

**影响**：
- ✅ 良好的用户体验
- ✅ 低 CPU 占用
- ⚠️ 极快速的状态变化可能略微延迟显示

---

## 性能优化

### 11.1 刷新策略优化

当前实现已采用智能刷新策略：

```typescript
private async render() {
  const state = await this.readState();
  
  // 仅在状态实际变化时更新
  if (JSON.stringify(state) === JSON.stringify(this.lastState)) {
    return;
  }
  
  this.lastState = state;
  this.clearScreen();
  this.renderState(state);
}
```

**优化效果**：
- 减少不必要的屏幕刷新
- 降低终端输出频率
- 节省 CPU 资源

### 11.2 内存使用优化

#### 11.2.1 状态数据

- 使用 `Map` 存储工具统计，自动管理内存
- 定期清理旧的会话数据
- 避免内存泄漏

#### 11.2.2 字符串处理

- 使用模板字符串而非字符串拼接
- 缓存重复计算的字符串
- 及时释放大字符串引用

### 11.3 I/O 优化

#### 11.3.1 文件写入

- 使用同步写入减少开销
- 批量写入减少 I/O 操作
- 错误处理避免重复写入

#### 11.3.2 文件读取

- 缓存状态文件路径
- 使用同步读取（简化实现）
- 错误时快速失败

### 11.4 启动优化

#### 11.4.1 延迟初始化

HUD 显示进程采用延迟初始化：

```typescript
constructor() {
  getHUDStatePath().then((path) => {
    this.statePath = path;
  });
}
```

#### 11.4.2 按需加载

- 动态 `import()` 内置模块
- 仅在需要时加载依赖

---

## 未来规划

### 12.1 短期规划（v0.2.0）

#### 12.1.1 功能增强

- [ ] **Token 使用统计**：显示当前会话的 token 使用量
- [ ] **成本估算**：基于 token 使用估算 API 成本
- [ ] **多会话切换**：支持同时监控多个会话
- [ ] **主题支持**：深色/浅色主题切换

#### 12.1.2 性能改进

- [ ] **状态文件监控**：使用文件监视器替代轮询
- [ ] **增量更新**：只更新变化的部分
- [ ] **内存优化**：减少状态副本

### 12.2 中期规划（v0.3.0）

#### 12.2.1 新功能

- [ ] **历史统计**：显示会话历史数据
- [ ] **导出功能**：导出统计数据为 CSV/JSON
- [ ] **自定义指标**：允许用户添加自定义监控指标
- [ ] **警报系统**：当指标超过阈值时发出警告

#### 12.2.2 集成改进

- [ ] **Web UI**：提供 Web 界面版本
- [ ] **API 暴露**：提供 HTTP API 供其他应用使用
- [ ] **配置界面**：提供交互式配置界面

### 12.3 长期愿景

#### 12.3.1 平台扩展

- [ ] 支持更多 AI 编程助手
- [ ] 提供 VS Code 插件版本
- [ ] 提供 Neovim 插件版本

#### 12.3.2 生态系统

- [ ] 插件市场集成
- [ ] 社区插件模板
- [ ] 文档和教程体系

### 12.4 贡献方向

欢迎社区贡献以下方向：

- UI/UX 改进
- 性能优化
- 文档完善
- Bug 修复
- 新功能提案

---

## 常见问题

### 13.1 一般问题

#### Q1: OpenCode HUD 是什么？

OpenCode HUD 是一个实时状态显示插件，帮助用户监控 OpenCode AI 编程助手的工作状态。它显示会话信息、工具调用统计、模型信息等，让开发者更好地了解 AI 的工作过程。

#### Q2: 为什么需要 HUD？

在使用 AI 编程助手时，了解其工作状态非常重要。HUD 提供了：
- 透明性：看到 AI 在做什么
- 性能监控：了解会话复杂度
- 问题诊断：识别异常行为

#### Q3: 与 Claude HUD 有什么关系？

OpenCode HUD 借鉴了 Claude HUD 的设计理念，但专门为 OpenCode 平台开发。它实现了类似的功能集，但采用了不同的技术实现。

### 13.2 安装问题

#### Q4: 安装需要什么条件？

- Node.js 18+
- OpenCode 1.0+
- Git（用于克隆仓库）

#### Q5: 安装失败怎么办？

1. 检查 Node.js 版本：`node --version`
2. 确保网络连接正常
3. 尝试删除 node_modules 后重新安装
4. 查看错误日志获取详细信息

#### Q6: 可以安装在 Windows 上吗？

可以。项目设计为跨平台，Windows、macOS 和 Linux 都支持。

### 13.3 使用问题

#### Q7: HUD 不显示怎么办？

1. 确保 OpenCode 已启动
2. 检查 HUD 进程是否运行
3. 验证插件是否正确安装
4. 查看错误日志

#### Q8: 如何停止 HUD？

在 HUD 终端窗口按 `Ctrl+C` 或发送 SIGINT 信号。

#### Q9: 可以自定义显示内容吗？

当前版本不支持自定义显示内容。这是 v0.3.0 的计划功能。

### 13.4 技术问题

#### Q10: 为什么使用文件共享而不是内存共享？

文件共享是最简单的跨进程通信方式，具有以下优势：
- 实现简单
- 天然跨平台
- 易于调试
- 支持重启恢复

#### Q11: 状态文件安全吗？

状态文件存储在系统临时目录中，具有以下保护：
- 目录权限限制
- 临时文件自动清理
- 不包含敏感信息

#### Q12: 会影响 OpenCode 性能吗？

影响极小：
- 插件仅在事件触发时更新
- 状态文件写入频率低
- HUD 进程独立运行

### 13.5 开发问题

#### Q13: 如何添加新功能？

1. Fork 项目
2. 创建功能分支
3. 实现功能
4. 添加测试
5. 提交 PR

#### Q14: 如何调试插件？

使用 `console.log` 输出调试信息，并通过 `opencode --print-logs --log-level DEBUG` 查看。

#### Q15: 可以贡献代码吗？

欢迎！请参考贡献指南，遵循代码规范和提交流程。

---

## 附录

### A.1 命令参考

| 命令 | 描述 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run build` | 构建项目 |
| `npm run dev` | 开发模式（自动重新编译） |
| `npm run start` | 启动 HUD 显示进程 |
| `npm run typecheck` | 类型检查 |

### A.2 文件参考

| 文件 | 描述 |
|------|------|
| `src/plugin.ts` | 插件主逻辑 |
| `src/hud-process.ts` | HUD 显示进程 |
| `src/index.ts` | 入口文件 |
| `dist/*.js` | 编译后的 JavaScript 文件 |

### A.3 资源链接

- **GitHub 仓库**：https://github.com/twischen-dot/opencode-hud
- **问题追踪**：https://github.com/twischen-dot/opencode-hud/issues
- **OpenCode 官网**：https://opencode.ai
- **OpenCode 插件文档**：https://docs.opencode.ai/plugins

### A.4 许可证

本项目采用 MIT 许可证开源。

```
MIT License

Copyright (c) 2026 twischen-dot

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 结语

OpenCode HUD 项目的目标是提升开发者在使用 AI 编程助手时的透明度和控制感。通过借鉴 Claude HUD 的成功经验，我们为 OpenCode 平台带来了一套完整的实时状态监控解决方案。

我们相信，良好的工具应该让开发者能够专注于创造，而不是被复杂性所困扰。OpenCode HUD 正是这一理念的体现。

感谢你的关注和使用！如果你有任何问题、建议或想要贡献代码，请访问我们的 GitHub 仓库或创建 Issue。

**让我们一起构建更好的开发工具！**

---

*文档版本：1.0.0*  
*最后更新：2026-01-09*  
*作者：twischen-dot*

# OpenCode HUD

实时显示 OpenCode 会话状态的可视化工具。

## 功能特性

- 实时追踪消息数量
- 显示当前使用的模型
- 统计工具调用次数
- 显示最后活动时间
- 每 300ms 自动刷新

## 安装

### 1. 安装插件

```bash
cd ~/.opencode
npm install /path/to/opencode-hud
```

### 2. 配置 OpenCode

编辑 `~/.opencode/config.json`，添加插件配置：

```json
{
  "plugins": [
    "opencode-hud"
  ]
}
```

### 3. 启动 HUD 显示进程

```bash
npm run start
```

## 使用

启动 OpenCode 后，HUD 会自动显示当前会话的状态信息：

```
╔══════════════════════════════════════════════════════════╗
║                    OpenCode HUD v0.1.0                    ║
╠══════════════════════════════════════════════════════════╣
║  Session: a1b2c3d4                                      ║
║  Model: openai/gpt-4                                    ║
║  Messages: 15                                           ║
║  Activity: 2m ago                                       ║
║                                                         ║
║  Tools:                                                  ║
║    bash: 5                                              ║
║    read: 10                                             ║
║    edit: 3                                              ║
╚══════════════════════════════════════════════════════════╝
```

## 架构

- **插件进程**: 运行在 OpenCode 中，通过 hooks 收集数据并写入共享文件
- **HUD 进程**: 独立运行，读取共享文件并显示状态

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式（自动重新编译）
npm run dev

# 启动 HUD 进程
npm run start
```

## 许可证

MIT

# Cocos MCP Server（CreatorFramework Fork）

**[English](README.EN.md) | [中文](README.md)**

本仓库是 `DaxianLee/cocos-mcp-server` 的维护分支，当前文档已与代码状态对齐到 **v1.5.4**。

## 项目定位

- 面板技术栈：`Vue 3 + Element Plus + Vite`
- 后端构建：`tsc`
- 传输协议：`Streamable HTTP (MCP 2025-03-26)`
- MCP 对外工具：`50`（13 类）
- `sceneAdvanced`：已完全移除，不在工具暴露面

## 快速开始

```bash
cd extensions/cocos-mcp-server
npm install
npm run build
```

只构建面板：

```bash
npm run build:panel
```

只构建后端 TypeScript：

```bash
npm run build:ts
```

## MCP 连接地址

默认地址：

```text
http://127.0.0.1:3000/mcp
```

## AI 客户端配置概览

- 自动写入：`Cursor`、`Windsurf`、`Trea CN`、`Codex CLI`
- 手动命令：`Claude CLI`、`Gemini CLI`
- 面板能力：状态查询、配置片段生成、CLI 命令生成、单客户端/批量写入与移除、配置文件打开

主进程消息（文档可见接口）：

- `get-config-status`
- `generate-cli-commands`
- `generate-client-config`
- `add-to-client` / `remove-from-client`
- `add-to-all-clients` / `remove-from-all-clients`
- `open-config-file`
- `open-tool-manager`

## 工具能力概览（50）

| 类别 | 数量 |
|---|---:|
| scene | 5 |
| node | 8 |
| component | 4 |
| prefab | 4 |
| project | 2 |
| debug | 3 |
| preferences | 3 |
| server | 2 |
| broadcast | 2 |
| sceneView | 5 |
| referenceImage | 4 |
| assetAdvanced | 5 |
| validation | 3 |

调用命名规范：使用 `分类_工具名`（例如 `node_node_query`、`scene_scene_management`）。

## 文档导航

- 安装说明（中文）：[INSTALL.md](INSTALL.md)
- Installation (English): [INSTALL.EN.md](INSTALL.EN.md)
- 功能指南（中文）：[FEATURE_GUIDE_CN.md](FEATURE_GUIDE_CN.md)
- Feature Guide (English): [FEATURE_GUIDE_EN.md](FEATURE_GUIDE_EN.md)

## 变更摘要（相对旧文档）

- 工具数量与分类已按当前实现重新对齐。
- 删除已下线工具分类的对外暴露描述。
- 增加 AI 客户端配置能力说明。
- 保持当前仓库前端与构建事实（`Vue + Element Plus + Vite` + `tsc`）。

## 上游关系

- Upstream: `https://github.com/DaxianLee/cocos-mcp-server`
- 如与上游文档不一致，以本仓库代码与本文档为准。

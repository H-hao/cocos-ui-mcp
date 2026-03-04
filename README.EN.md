# Cocos MCP Server (CreatorFramework Fork)

**[English](README.EN.md) | [中文](README.md)**

This repository is a maintained fork of `DaxianLee/cocos-mcp-server`. Documentation is aligned with the current implementation at **v1.5.4**.

## Project Positioning

- Panel stack: `Vue 3 + Element Plus + Vite`
- Backend build: `tsc`
- Transport: `Streamable HTTP (MCP 2025-03-26)`
- Public MCP tools: `50` across 13 categories
- `sceneAdvanced`: fully removed from public tool surface

## Quick Start

```bash
cd extensions/cocos-mcp-server
npm install
npm run build
```

Build panel only:

```bash
npm run build:panel
```

Build backend TypeScript only:

```bash
npm run build:ts
```

## MCP Endpoint

Default endpoint:

```text
http://127.0.0.1:3000/mcp
```

## AI Client Configuration Overview

- Auto-write: `Cursor`, `Windsurf`, `Trea CN`, `Codex CLI`
- Manual commands: `Claude CLI`, `Gemini CLI`
- Panel features: status query, config snippet generation, CLI command generation, per-client and batch add/remove, open config file

Documented main-process messages:

- `get-config-status`
- `generate-cli-commands`
- `generate-client-config`
- `add-to-client` / `remove-from-client`
- `add-to-all-clients` / `remove-from-all-clients`
- `open-config-file`
- `open-tool-manager`

## Tool Capability Overview (50)

| Category | Count |
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

Naming rule: use `category_tool` format (for example `node_node_query`, `scene_scene_management`).

## Documentation Navigation

- Installation (CN): [INSTALL.md](INSTALL.md)
- Installation (EN): [INSTALL.EN.md](INSTALL.EN.md)
- Feature Guide (CN): [FEATURE_GUIDE_CN.md](FEATURE_GUIDE_CN.md)
- Feature Guide (EN): [FEATURE_GUIDE_EN.md](FEATURE_GUIDE_EN.md)

## Change Summary (vs old docs)

- Tool count and category descriptions are fully aligned with the current implementation.
- Removed exposure descriptions for deprecated tool categories.
- Added AI client adaptation and configuration sections.
- Kept current repository facts (`Vue + Element Plus + Vite` + `tsc`).

## Upstream

- Upstream: `https://github.com/DaxianLee/cocos-mcp-server`
- If docs differ, this repository code and docs are the source of truth.

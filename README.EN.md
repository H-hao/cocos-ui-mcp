# Cocos MCP Server (CreatorFramework Fork)

**[📖 English](README.EN.md)**  **[📖 中文](README.md)**

This repository is a maintained fork of `DaxianLee/cocos-mcp-server`. This README focuses on fork-specific work and avoids repeating most upstream generic documentation.

## UI Preview

### Main Dashboard (Server Control / Tool Management)

![MCP Main Dashboard](docs/images/ui-mcp-panel.png)

### Extension Menu and Server Panel Example

![Extension menu and server panel](docs/images/ui-open-menu-and-server.png)

## Key Changes in This Fork

- Panel frontend refactor to `Vite + Vue 3 + Tailwind CSS + Element Plus`.
- Removed standalone `tool-manager` panel and merged tool controls into the main dashboard tabs.
- Added `restart-server-from-dist` hot-restart flow and improved server recreation after settings updates.
- Improved MCP compatibility with session ID handling, notification processing, and JSON fault-tolerant parsing.
- Added/enhanced tool capability such as batch component property updates via `set_component_properties`.
- Improved UX with categorized tool toggles, tool stats, save-state feedback, polling, and toast notifications.

## Quick Start

```bash
cd extensions/cocos-mcp-server
npm install
npm run build
```

Build panel UI only:

```bash
npm run build:panel
```

Watch mode:

```bash
npm run watch
```

## MCP Endpoint

Default endpoint after server start: `http://127.0.0.1:3000/mcp`

Claude CLI example:

```bash
claude mcp add --transport http cocos-creator http://127.0.0.1:3000/mcp
```

## Project Focus Structure

```text
cocos-mcp-server/
├── source/                    # Extension core and MCP server
├── panel-ui/                  # New Vue + Vite panel frontend
├── dist/                      # Build outputs (including dist/panel-ui)
├── vite.panel.config.ts       # Panel build config
├── tailwind.config.ts         # Tailwind config
└── package.json               # Scripts and extension metadata
```

## Upstream Relationship

- Upstream: `https://github.com/DaxianLee/cocos-mcp-server`
- This fork is maintained for CreatorFramework-specific iteration and stability work.
- If docs differ, treat this fork's code and README as the source of truth.

## License

Follows upstream license and usage constraints.

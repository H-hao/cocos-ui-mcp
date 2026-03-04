# Cocos MCP Server Installation (v1.5.4)

## 1. Install Path

Place the extension directory in your Cocos Creator project:

```text
<project>/extensions/cocos-mcp-server
```

## 2. Build Steps

Run in the extension directory:

```bash
npm install
npm run build
```

Optional commands:

```bash
npm run build:panel
npm run build:ts
```

## 3. Enable and Start in Creator

1. Open the Cocos Creator project.
2. Open the `Cocos MCP Server` panel from extension entry.
3. Click "Start Server" in the panel.
4. Default MCP endpoint: `http://127.0.0.1:3000/mcp`.

## 4. Minimal AI Client Config Examples

### 4.1 Cursor / Trae / Claude CLI (JSON with `url`)

```json
{
  "mcpServers": {
    "cocos-creator": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### 4.2 Windsurf (JSON with `serverUrl`)

```json
{
  "mcpServers": {
    "cocos-creator": {
      "serverUrl": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### 4.3 Gemini CLI (JSON with `httpUrl`)

```json
{
  "mcpServers": {
    "cocos-creator": {
      "httpUrl": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### 4.4 Codex CLI (TOML)

```toml
[mcp_servers.cocos-creator]
url = "http://127.0.0.1:3000/mcp"
```

### 4.5 Claude CLI command

```bash
claude mcp add --scope user --transport http cocos-creator http://127.0.0.1:3000/mcp
```

### 4.6 Gemini CLI command

```bash
gemini mcp add --scope user --transport http cocos-creator http://127.0.0.1:3000/mcp
```

## 5. FAQ

### 5.1 Port already in use

Symptom: server start fails with port conflict error.  
Fix: change port in panel settings and start again.

### 5.2 Panel says frontend not built

Symptom: missing `dist/panel-ui/index.cjs` or `style.css`.  
Fix: run `npm run build:panel`, then reopen the panel.

### 5.3 Unknown config file path

Use the "AI Client Config" tab in the panel to view and open config paths.

### 5.4 Tool not found

Use category-prefixed tool names (for example `node_node_query`).
Legacy scene-advanced prefixed names are removed.

# Cocos MCP Server 安装说明（v1.5.4）

## 1. 安装路径

将扩展目录放到你的 Cocos Creator 项目内：

```text
<project>/extensions/cocos-mcp-server
```

## 2. 构建步骤

在扩展目录执行：

```bash
npm install
npm run build
```

可选：

```bash
npm run build:panel
npm run build:ts
```

## 3. 在 Creator 中启用并启动

1. 打开 Cocos Creator 项目。
2. 通过扩展入口打开 `Cocos MCP Server` 面板。
3. 在面板中点击“启动服务器”。
4. 默认 MCP 地址为：`http://127.0.0.1:3000/mcp`。

## 4. AI 客户端最小配置样例

### 4.1 Cursor / Trae / Claude CLI（JSON: `url` 字段）

```json
{
  "mcpServers": {
    "cocos-creator": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### 4.2 Windsurf（JSON: `serverUrl` 字段）

```json
{
  "mcpServers": {
    "cocos-creator": {
      "serverUrl": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### 4.3 Gemini CLI（JSON: `httpUrl` 字段）

```json
{
  "mcpServers": {
    "cocos-creator": {
      "httpUrl": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### 4.4 Codex CLI（TOML）

```toml
[mcp_servers.cocos-creator]
url = "http://127.0.0.1:3000/mcp"
```

### 4.5 Claude CLI 命令

```bash
claude mcp add --scope user --transport http cocos-creator http://127.0.0.1:3000/mcp
```

### 4.6 Gemini CLI 命令

```bash
gemini mcp add --scope user --transport http cocos-creator http://127.0.0.1:3000/mcp
```

## 5. 常见问题

### 5.1 端口占用

症状：启动失败，日志提示端口已被占用。  
处理：在面板中修改端口后重新启动服务器。

### 5.2 面板提示前端未构建

症状：面板显示缺少 `dist/panel-ui/index.cjs` 或 `style.css`。  
处理：执行 `npm run build:panel` 后重新打开面板。

### 5.3 配置文件路径不确定

可在面板的“AI客户端配置”页查看并直接打开配置文件路径。

### 5.4 工具调用找不到

请确认使用的是分类前缀工具名（例如 `node_node_query`），不要使用已移除的旧场景高级前缀工具名。

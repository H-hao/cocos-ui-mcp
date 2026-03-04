"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const http = __importStar(require("http"));
const url = __importStar(require("url"));
const uuid_1 = require("uuid");
const scene_tools_1 = require("./tools/scene-tools");
const node_tools_1 = require("./tools/node-tools");
const component_tools_1 = require("./tools/component-tools");
const prefab_tools_1 = require("./tools/prefab-tools");
const project_tools_1 = require("./tools/project-tools");
const debug_tools_1 = require("./tools/debug-tools");
const preferences_tools_1 = require("./tools/preferences-tools");
const server_tools_1 = require("./tools/server-tools");
const broadcast_tools_1 = require("./tools/broadcast-tools");
const scene_view_tools_1 = require("./tools/scene-view-tools");
const reference_image_tools_1 = require("./tools/reference-image-tools");
const asset_advanced_tools_1 = require("./tools/asset-advanced-tools");
const validation_tools_1 = require("./tools/validation-tools");
class MCPServer {
    constructor(settings) {
        this.httpServer = null;
        this.clients = new Map();
        this.sseConnections = new Map();
        this.tools = {};
        this.toolsList = [];
        this.enabledTools = []; // 存储启用的工具列表
        this.settings = settings;
        this.initializeTools();
    }
    initializeTools() {
        try {
            console.log('[MCPServer] Initializing tools...');
            this.tools.scene = new scene_tools_1.SceneTools();
            this.tools.node = new node_tools_1.NodeTools();
            this.tools.component = new component_tools_1.ComponentTools();
            this.tools.prefab = new prefab_tools_1.PrefabTools();
            this.tools.project = new project_tools_1.ProjectTools();
            this.tools.debug = new debug_tools_1.DebugTools();
            this.tools.preferences = new preferences_tools_1.PreferencesTools();
            this.tools.server = new server_tools_1.ServerTools();
            this.tools.broadcast = new broadcast_tools_1.BroadcastTools();
            this.tools.sceneView = new scene_view_tools_1.SceneViewTools();
            this.tools.referenceImage = new reference_image_tools_1.ReferenceImageTools();
            this.tools.assetAdvanced = new asset_advanced_tools_1.AssetAdvancedTools();
            this.tools.validation = new validation_tools_1.ValidationTools();
            console.log('[MCPServer] Tools initialized successfully');
        }
        catch (error) {
            console.error('[MCPServer] Error initializing tools:', error);
            throw error;
        }
    }
    async start() {
        if (this.httpServer) {
            console.log('[MCPServer] Server is already running');
            return;
        }
        try {
            console.log(`[MCPServer] Starting HTTP server on port ${this.settings.port}...`);
            this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
            await new Promise((resolve, reject) => {
                this.httpServer.listen(this.settings.port, '127.0.0.1', () => {
                    console.log(`[MCPServer] ✅ HTTP server started successfully on http://127.0.0.1:${this.settings.port}`);
                    console.log(`[MCPServer] Health check: http://127.0.0.1:${this.settings.port}/health`);
                    console.log(`[MCPServer] MCP endpoint: http://127.0.0.1:${this.settings.port}/mcp`);
                    resolve();
                });
                this.httpServer.on('error', (err) => {
                    console.error('[MCPServer] ❌ Failed to start server:', err);
                    if (err.code === 'EADDRINUSE') {
                        console.error(`[MCPServer] Port ${this.settings.port} is already in use. Please change the port in settings.`);
                    }
                    reject(err);
                });
            });
            this.setupTools();
            console.log('[MCPServer] 🚀 MCP Server is ready for connections');
        }
        catch (error) {
            console.error('[MCPServer] ❌ Failed to start server:', error);
            throw error;
        }
    }
    setupTools() {
        this.toolsList = [];
        // 如果没有启用工具配置，返回所有工具
        if (!this.enabledTools || this.enabledTools.length === 0) {
            for (const [category, toolSet] of Object.entries(this.tools)) {
                if (category === 'sceneAdvanced') {
                    continue;
                }
                const tools = toolSet.getTools();
                for (const tool of tools) {
                    this.toolsList.push({
                        name: `${category}_${tool.name}`,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    });
                }
            }
        }
        else {
            // 根据启用的工具配置过滤
            const enabledToolNames = new Set(this.enabledTools.map(tool => `${tool.category}_${tool.name}`));
            for (const [category, toolSet] of Object.entries(this.tools)) {
                if (category === 'sceneAdvanced') {
                    continue;
                }
                const tools = toolSet.getTools();
                for (const tool of tools) {
                    const toolName = `${category}_${tool.name}`;
                    if (enabledToolNames.has(toolName)) {
                        this.toolsList.push({
                            name: toolName,
                            description: tool.description,
                            inputSchema: tool.inputSchema
                        });
                    }
                }
            }
        }
        console.log(`[MCPServer] Setup tools: ${this.toolsList.length} tools available`);
    }
    getFilteredTools(enabledTools) {
        if (!enabledTools || enabledTools.length === 0) {
            return this.toolsList; // 如果没有过滤配置，返回所有工具
        }
        const enabledToolNames = new Set(enabledTools.map(tool => `${tool.category}_${tool.name}`));
        return this.toolsList.filter(tool => enabledToolNames.has(tool.name));
    }
    async executeToolCall(toolName, args) {
        const parts = toolName.split('_');
        const category = parts[0];
        const toolMethodName = parts.slice(1).join('_');
        if (this.tools[category]) {
            return await this.tools[category].execute(toolMethodName, args);
        }
        throw new Error(`Tool ${toolName} not found`);
    }
    getClients() {
        return Array.from(this.clients.values());
    }
    getAvailableTools() {
        return this.toolsList;
    }
    updateEnabledTools(enabledTools) {
        console.log(`[MCPServer] Updating enabled tools: ${enabledTools.length} tools`);
        this.enabledTools = enabledTools;
        this.setupTools(); // 重新设置工具列表
    }
    getSettings() {
        return this.settings;
    }
    async handleHttpRequest(req, res) {
        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname;
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, mcp-session-id, mcp-protocol-version');
        res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        try {
            if (pathname === '/mcp' && req.method === 'GET') {
                await this.handleMCPSSEConnection(req, res);
            }
            else if (pathname === '/mcp' && req.method === 'DELETE') {
                await this.handleMCPSessionDelete(req, res);
            }
            else if (pathname === '/sse' && req.method === 'GET') {
                await this.handleSSEConnection(req, res);
            }
            else if (pathname === '/message' && req.method === 'POST') {
                await this.handleSSEMessage(req, res);
            }
            else if (pathname === '/mcp' && req.method === 'POST') {
                await this.handleMCPRequest(req, res);
            }
            else if (pathname === '/health' && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'ok', tools: this.toolsList.length }));
            }
            else if ((pathname === null || pathname === void 0 ? void 0 : pathname.startsWith('/api/')) && req.method === 'POST') {
                await this.handleSimpleAPIRequest(req, res, pathname);
            }
            else if (pathname === '/api/tools' && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify({ tools: this.getSimplifiedToolsList() }));
            }
            else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        }
        catch (error) {
            console.error('HTTP request error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    async handleMCPRequest(req, res) {
        let body = '';
        const sessionId = this.resolveSessionId(req);
        // Session ID is always returned; for SSE responses it goes in writeHead headers
        res.setHeader('Mcp-Session-Id', sessionId);
        // Streamable HTTP (2025-03-26): clients send Accept: application/json, text/event-stream
        // If the client wants SSE, keep the POST response open as a persistent server-push channel.
        // This is required by rmcp and other Streamable HTTP clients — returning application/json
        // closes the connection and the client's transport channel immediately, causing
        // "Transport channel closed, when send initialized notification" errors.
        const acceptHeader = (req.headers['accept'] || '').toLowerCase();
        const wantsSSE = acceptHeader.includes('text/event-stream');
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                let message;
                try {
                    message = JSON.parse(body);
                }
                catch (parseError) {
                    const fixedBody = this.fixCommonJsonIssues(body);
                    try {
                        message = JSON.parse(fixedBody);
                        console.log('[MCPServer] Fixed JSON parsing issue');
                    }
                    catch (secondError) {
                        throw new Error(`JSON parsing failed: ${parseError.message}. Original body: ${body.substring(0, 500)}...`);
                    }
                }
                if (Array.isArray(message)) {
                    const responses = [];
                    for (const item of message) {
                        const response = await this.handleMessage(item, sessionId);
                        if (response)
                            responses.push(response);
                    }
                    if (responses.length === 0) {
                        this.sendNotificationAccepted(res);
                        return;
                    }
                    if (wantsSSE) {
                        this.sendSSEResponse(req, res, sessionId, responses);
                    }
                    else {
                        res.writeHead(200);
                        res.end(JSON.stringify(responses));
                    }
                    return;
                }
                const response = await this.handleMessage(message, sessionId);
                if (!response) {
                    // Notification or response-only message: 202 Accepted, no body
                    this.sendNotificationAccepted(res);
                    return;
                }
                if (wantsSSE) {
                    // Send response as SSE event and keep connection open as transport channel
                    this.sendSSEResponse(req, res, sessionId, [response]);
                }
                else {
                    res.writeHead(200);
                    res.end(JSON.stringify(response));
                }
            }
            catch (error) {
                console.error('Error handling MCP request:', error);
                if (!res.headersSent) {
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        id: null,
                        error: {
                            code: -32700,
                            message: `Parse error: ${error.message}`
                        }
                    }));
                }
            }
        });
    }
    // Streamable HTTP (2025-03-26): respond with SSE and keep the POST connection open
    // so the rmcp transport worker stays alive for the full session lifetime.
    sendSSEResponse(req, res, sessionId, events) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Mcp-Session-Id': sessionId,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Mcp-Session-Id',
        });
        for (const event of events) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        // Register as the SSE push channel for this session
        this.sseConnections.set(sessionId, res);
        this.touchClient(sessionId);
        const heartbeat = setInterval(() => {
            if (res.writableEnded) {
                clearInterval(heartbeat);
                if (this.sseConnections.get(sessionId) === res) {
                    this.sseConnections.delete(sessionId);
                }
                return;
            }
            res.write(': ping\n\n');
        }, 30000);
        req.on('close', () => {
            clearInterval(heartbeat);
            if (this.sseConnections.get(sessionId) === res) {
                this.sseConnections.delete(sessionId);
                this.clients.delete(sessionId);
            }
            console.log(`[MCPServer] POST SSE channel closed: ${sessionId}`);
        });
        console.log(`[MCPServer] POST SSE channel opened: ${sessionId}`);
    }
    async handleMessage(message, sessionId) {
        const { id, method, params } = message;
        const isNotification = id === undefined || id === null;
        if (!method || typeof method !== 'string') {
            if (isNotification) {
                return null;
            }
            return {
                jsonrpc: '2.0',
                id: id !== null && id !== void 0 ? id : null,
                error: {
                    code: -32600,
                    message: 'Invalid Request: missing method'
                }
            };
        }
        try {
            let result;
            switch (method) {
                case 'notifications/initialized':
                case 'initialized':
                    this.touchClient(sessionId);
                    if (isNotification) {
                        return null;
                    }
                    result = {};
                    break;
                case 'ping':
                    result = {};
                    break;
                case 'resources/list':
                    result = { resources: [] };
                    break;
                case 'resources/templates/list':
                    result = { resourceTemplates: [] };
                    break;
                case 'prompts/list':
                    result = { prompts: [] };
                    break;
                case 'tools/list':
                    result = { tools: this.getAvailableTools() };
                    break;
                case 'tools/call':
                    const { name, arguments: args } = params;
                    const toolResult = await this.executeToolCall(name, args);
                    result = { content: [{ type: 'text', text: JSON.stringify(toolResult) }] };
                    break;
                case 'initialize':
                    // MCP initialization
                    this.touchClient(sessionId);
                    result = {
                        protocolVersion: '2025-03-26',
                        capabilities: {
                            tools: {
                                listChanged: false
                            },
                            resources: {
                                subscribe: false,
                                listChanged: false
                            },
                            prompts: {
                                listChanged: false
                            }
                        },
                        serverInfo: {
                            name: 'cocos-mcp-server',
                            version: '1.0.0'
                        }
                    };
                    break;
                default:
                    if (method.startsWith('notifications/')) {
                        if (isNotification) {
                            return null;
                        }
                        result = {};
                        break;
                    }
                    throw new Error(`Unknown method: ${method}`);
            }
            if (isNotification) {
                return null;
            }
            return {
                jsonrpc: '2.0',
                id,
                result
            };
        }
        catch (error) {
            if (isNotification) {
                return null;
            }
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603,
                    message: error.message
                }
            };
        }
    }
    sendNotificationAccepted(res) {
        // MCP 2025-03-26: notifications/responses that need no reply → 202 Accepted, empty body
        res.writeHead(202);
        res.end();
    }
    // Streamable HTTP Transport (MCP 2025-03-26): GET /mcp opens a persistent SSE stream
    async handleMCPSSEConnection(req, res) {
        const sessionId = this.resolveSessionId(req) || (0, uuid_1.v4)();
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Mcp-Session-Id': sessionId,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Mcp-Session-Id',
        });
        this.sseConnections.set(sessionId, res);
        this.touchClient(sessionId);
        const heartbeat = setInterval(() => {
            if (res.writableEnded) {
                clearInterval(heartbeat);
                return;
            }
            res.write(': ping\n\n');
        }, 30000);
        req.on('close', () => {
            clearInterval(heartbeat);
            this.sseConnections.delete(sessionId);
            this.clients.delete(sessionId);
            console.log(`[MCPServer] Streamable HTTP SSE stream closed: ${sessionId}`);
        });
        console.log(`[MCPServer] Streamable HTTP SSE stream opened: ${sessionId}`);
    }
    // Streamable HTTP Transport (MCP 2025-03-26): DELETE /mcp terminates a session
    async handleMCPSessionDelete(req, res) {
        const sessionId = this.resolveSessionId(req);
        if (sessionId) {
            const sseRes = this.sseConnections.get(sessionId);
            if (sseRes && !sseRes.writableEnded) {
                sseRes.end();
            }
            this.sseConnections.delete(sessionId);
            this.clients.delete(sessionId);
            console.log(`[MCPServer] Session terminated via DELETE: ${sessionId}`);
        }
        res.writeHead(200);
        res.end();
    }
    async handleSSEConnection(req, res) {
        const sessionId = (0, uuid_1.v4)();
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, mcp-session-id',
        });
        this.sseConnections.set(sessionId, res);
        this.touchClient(sessionId);
        const postEndpoint = `/message?sessionId=${sessionId}`;
        res.write(`event: endpoint\ndata: ${postEndpoint}\n\n`);
        const heartbeat = setInterval(() => {
            if (res.writableEnded) {
                clearInterval(heartbeat);
                return;
            }
            res.write(': ping\n\n');
        }, 30000);
        req.on('close', () => {
            clearInterval(heartbeat);
            this.sseConnections.delete(sessionId);
            this.clients.delete(sessionId);
            console.log(`[MCPServer] SSE client disconnected: ${sessionId}`);
        });
        console.log(`[MCPServer] SSE client connected: ${sessionId}, endpoint: ${postEndpoint}`);
    }
    async handleSSEMessage(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        const parsedUrl = url.parse(req.url || '', true);
        const sessionId = parsedUrl.query.sessionId;
        if (!sessionId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing sessionId' }));
            return;
        }
        const sseRes = this.sseConnections.get(sessionId);
        if (!sseRes || sseRes.writableEnded) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'SSE session not found or closed' }));
            return;
        }
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const message = JSON.parse(body);
                this.touchClient(sessionId);
                const response = await this.handleMessage(message, sessionId);
                if (response !== null) {
                    sseRes.write(`data: ${JSON.stringify(response)}\n\n`);
                }
                res.writeHead(202);
                res.end();
            }
            catch (error) {
                console.error('[MCPServer] SSE message error:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    resolveSessionId(req) {
        const raw = req.headers['mcp-session-id'];
        const header = Array.isArray(raw) ? raw[0] : raw;
        if (header && header.trim()) {
            return header.trim();
        }
        return (0, uuid_1.v4)();
    }
    touchClient(sessionId) {
        var _a;
        if (!sessionId) {
            return;
        }
        this.clients.set(sessionId, {
            id: sessionId,
            lastActivity: new Date(),
            userAgent: (_a = this.clients.get(sessionId)) === null || _a === void 0 ? void 0 : _a.userAgent
        });
    }
    fixCommonJsonIssues(jsonStr) {
        let fixed = jsonStr;
        // Fix common escape character issues
        fixed = fixed
            // Fix unescaped quotes in strings
            .replace(/([^\\])"([^"]*[^\\])"([^,}\]:])/g, '$1\\"$2\\"$3')
            // Fix unescaped backslashes
            .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2')
            // Fix trailing commas
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix single quotes (should be double quotes)
            .replace(/'/g, '"')
            // Fix common control characters
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return fixed;
    }
    stop() {
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
            console.log('[MCPServer] HTTP server stopped');
        }
        this.clients.clear();
        this.sseConnections.clear();
    }
    getStatus() {
        return {
            running: !!this.httpServer,
            port: this.settings.port,
            clients: 0 // HTTP is stateless, no persistent clients
        };
    }
    async handleSimpleAPIRequest(req, res, pathname) {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                // Extract tool name from path like /api/node/set_position
                const pathParts = pathname.split('/').filter(p => p);
                if (pathParts.length < 3) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Invalid API path. Use /api/{category}/{tool_name}' }));
                    return;
                }
                const category = pathParts[1];
                const toolName = pathParts[2];
                const fullToolName = `${category}_${toolName}`;
                // Parse parameters with enhanced error handling
                let params;
                try {
                    params = body ? JSON.parse(body) : {};
                }
                catch (parseError) {
                    // Try to fix JSON issues
                    const fixedBody = this.fixCommonJsonIssues(body);
                    try {
                        params = JSON.parse(fixedBody);
                        console.log('[MCPServer] Fixed API JSON parsing issue');
                    }
                    catch (secondError) {
                        res.writeHead(400);
                        res.end(JSON.stringify({
                            error: 'Invalid JSON in request body',
                            details: parseError.message,
                            receivedBody: body.substring(0, 200)
                        }));
                        return;
                    }
                }
                // Execute tool
                const result = await this.executeToolCall(fullToolName, params);
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    tool: fullToolName,
                    result: result
                }));
            }
            catch (error) {
                console.error('Simple API error:', error);
                res.writeHead(500);
                res.end(JSON.stringify({
                    success: false,
                    error: error.message,
                    tool: pathname
                }));
            }
        });
    }
    getSimplifiedToolsList() {
        return this.toolsList.map(tool => {
            const parts = tool.name.split('_');
            const category = parts[0];
            const toolName = parts.slice(1).join('_');
            return {
                name: tool.name,
                category: category,
                toolName: toolName,
                description: tool.description,
                apiPath: `/api/${category}/${toolName}`,
                curlExample: this.generateCurlExample(category, toolName, tool.inputSchema)
            };
        });
    }
    generateCurlExample(category, toolName, schema) {
        // Generate sample parameters based on schema
        const sampleParams = this.generateSampleParams(schema);
        const jsonString = JSON.stringify(sampleParams, null, 2);
        return `curl -X POST http://127.0.0.1:8585/api/${category}/${toolName} \\
  -H "Content-Type: application/json" \\
  -d '${jsonString}'`;
    }
    generateSampleParams(schema) {
        if (!schema || !schema.properties)
            return {};
        const sample = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
            const propSchema = prop;
            switch (propSchema.type) {
                case 'string':
                    sample[key] = propSchema.default || 'example_string';
                    break;
                case 'number':
                    sample[key] = propSchema.default || 42;
                    break;
                case 'boolean':
                    sample[key] = propSchema.default || true;
                    break;
                case 'object':
                    sample[key] = propSchema.default || { x: 0, y: 0, z: 0 };
                    break;
                default:
                    sample[key] = 'example_value';
            }
        }
        return sample;
    }
    updateSettings(settings) {
        this.settings = settings;
        if (this.httpServer) {
            this.stop();
            this.start();
        }
    }
}
exports.MCPServer = MCPServer;
// HTTP transport doesn't need persistent connections
// MCP over HTTP uses request-response pattern
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2QjtBQUM3Qix5Q0FBMkI7QUFDM0IsK0JBQW9DO0FBRXBDLHFEQUFpRDtBQUNqRCxtREFBK0M7QUFDL0MsNkRBQXlEO0FBQ3pELHVEQUFtRDtBQUNuRCx5REFBcUQ7QUFDckQscURBQWlEO0FBQ2pELGlFQUE2RDtBQUM3RCx1REFBbUQ7QUFDbkQsNkRBQXlEO0FBQ3pELCtEQUEwRDtBQUMxRCx5RUFBb0U7QUFDcEUsdUVBQWtFO0FBQ2xFLCtEQUEyRDtBQUUzRCxNQUFhLFNBQVM7SUFTbEIsWUFBWSxRQUEyQjtRQVAvQixlQUFVLEdBQXVCLElBQUksQ0FBQztRQUN0QyxZQUFPLEdBQTJCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDNUMsbUJBQWMsR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUM3RCxVQUFLLEdBQXdCLEVBQUUsQ0FBQztRQUNoQyxjQUFTLEdBQXFCLEVBQUUsQ0FBQztRQUNqQyxpQkFBWSxHQUFVLEVBQUUsQ0FBQyxDQUFDLFlBQVk7UUFHMUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFTyxlQUFlO1FBQ25CLElBQUksQ0FBQztZQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLHdCQUFVLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLHNCQUFTLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLGdDQUFjLEVBQUUsQ0FBQztZ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JztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQgeyBNQ1BTZXJ2ZXJTZXR0aW5ncywgU2VydmVyU3RhdHVzLCBNQ1BDbGllbnQsIFRvb2xEZWZpbml0aW9uIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBTY2VuZVRvb2xzIH0gZnJvbSAnLi90b29scy9zY2VuZS10b29scyc7XG5pbXBvcnQgeyBOb2RlVG9vbHMgfSBmcm9tICcuL3Rvb2xzL25vZGUtdG9vbHMnO1xuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tICcuL3Rvb2xzL2NvbXBvbmVudC10b29scyc7XG5pbXBvcnQgeyBQcmVmYWJUb29scyB9IGZyb20gJy4vdG9vbHMvcHJlZmFiLXRvb2xzJztcbmltcG9ydCB7IFByb2plY3RUb29scyB9IGZyb20gJy4vdG9vbHMvcHJvamVjdC10b29scyc7XG5pbXBvcnQgeyBEZWJ1Z1Rvb2xzIH0gZnJvbSAnLi90b29scy9kZWJ1Zy10b29scyc7XG5pbXBvcnQgeyBQcmVmZXJlbmNlc1Rvb2xzIH0gZnJvbSAnLi90b29scy9wcmVmZXJlbmNlcy10b29scyc7XG5pbXBvcnQgeyBTZXJ2ZXJUb29scyB9IGZyb20gJy4vdG9vbHMvc2VydmVyLXRvb2xzJztcbmltcG9ydCB7IEJyb2FkY2FzdFRvb2xzIH0gZnJvbSAnLi90b29scy9icm9hZGNhc3QtdG9vbHMnO1xuaW1wb3J0IHsgU2NlbmVWaWV3VG9vbHMgfSBmcm9tICcuL3Rvb2xzL3NjZW5lLXZpZXctdG9vbHMnO1xuaW1wb3J0IHsgUmVmZXJlbmNlSW1hZ2VUb29scyB9IGZyb20gJy4vdG9vbHMvcmVmZXJlbmNlLWltYWdlLXRvb2xzJztcbmltcG9ydCB7IEFzc2V0QWR2YW5jZWRUb29scyB9IGZyb20gJy4vdG9vbHMvYXNzZXQtYWR2YW5jZWQtdG9vbHMnO1xuaW1wb3J0IHsgVmFsaWRhdGlvblRvb2xzIH0gZnJvbSAnLi90b29scy92YWxpZGF0aW9uLXRvb2xzJztcblxuZXhwb3J0IGNsYXNzIE1DUFNlcnZlciB7XG4gICAgcHJpdmF0ZSBzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3M7XG4gICAgcHJpdmF0ZSBodHRwU2VydmVyOiBodHRwLlNlcnZlciB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgY2xpZW50czogTWFwPHN0cmluZywgTUNQQ2xpZW50PiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIHNzZUNvbm5lY3Rpb25zOiBNYXA8c3RyaW5nLCBodHRwLlNlcnZlclJlc3BvbnNlPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIHRvb2xzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgcHJpdmF0ZSB0b29sc0xpc3Q6IFRvb2xEZWZpbml0aW9uW10gPSBbXTtcbiAgICBwcml2YXRlIGVuYWJsZWRUb29sczogYW55W10gPSBbXTsgLy8g5a2Y5YKo5ZCv55So55qE5bel5YW35YiX6KGoXG5cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3MpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLmluaXRpYWxpemVUb29scygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZVRvb2xzKCk6IHZvaWQge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1BTZXJ2ZXJdIEluaXRpYWxpemluZyB0b29scy4uLicpO1xuICAgICAgICAgICAgdGhpcy50b29scy5zY2VuZSA9IG5ldyBTY2VuZVRvb2xzKCk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLm5vZGUgPSBuZXcgTm9kZVRvb2xzKCk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLmNvbXBvbmVudCA9IG5ldyBDb21wb25lbnRUb29scygpO1xuICAgICAgICAgICAgdGhpcy50b29scy5wcmVmYWIgPSBuZXcgUHJlZmFiVG9vbHMoKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMucHJvamVjdCA9IG5ldyBQcm9qZWN0VG9vbHMoKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMuZGVidWcgPSBuZXcgRGVidWdUb29scygpO1xuICAgICAgICAgICAgdGhpcy50b29scy5wcmVmZXJlbmNlcyA9IG5ldyBQcmVmZXJlbmNlc1Rvb2xzKCk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLnNlcnZlciA9IG5ldyBTZXJ2ZXJUb29scygpO1xuICAgICAgICAgICAgdGhpcy50b29scy5icm9hZGNhc3QgPSBuZXcgQnJvYWRjYXN0VG9vbHMoKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMuc2NlbmVWaWV3ID0gbmV3IFNjZW5lVmlld1Rvb2xzKCk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLnJlZmVyZW5jZUltYWdlID0gbmV3IFJlZmVyZW5jZUltYWdlVG9vbHMoKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMuYXNzZXRBZHZhbmNlZCA9IG5ldyBBc3NldEFkdmFuY2VkVG9vbHMoKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMudmFsaWRhdGlvbiA9IG5ldyBWYWxpZGF0aW9uVG9vbHMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQU2VydmVyXSBUb29scyBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1BTZXJ2ZXJdIEVycm9yIGluaXRpYWxpemluZyB0b29sczonLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBzdGFydCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuaHR0cFNlcnZlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1BTZXJ2ZXJdIFNlcnZlciBpcyBhbHJlYWR5IHJ1bm5pbmcnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW01DUFNlcnZlcl0gU3RhcnRpbmcgSFRUUCBzZXJ2ZXIgb24gcG9ydCAke3RoaXMuc2V0dGluZ3MucG9ydH0uLi5gKTtcbiAgICAgICAgICAgIHRoaXMuaHR0cFNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKHRoaXMuaGFuZGxlSHR0cFJlcXVlc3QuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0dHBTZXJ2ZXIhLmxpc3Rlbih0aGlzLnNldHRpbmdzLnBvcnQsICcxMjcuMC4wLjEnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTUNQU2VydmVyXSDinIUgSFRUUCBzZXJ2ZXIgc3RhcnRlZCBzdWNjZXNzZnVsbHkgb24gaHR0cDovLzEyNy4wLjAuMToke3RoaXMuc2V0dGluZ3MucG9ydH1gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtNQ1BTZXJ2ZXJdIEhlYWx0aCBjaGVjazogaHR0cDovLzEyNy4wLjAuMToke3RoaXMuc2V0dGluZ3MucG9ydH0vaGVhbHRoYCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTUNQU2VydmVyXSBNQ1AgZW5kcG9pbnQ6IGh0dHA6Ly8xMjcuMC4wLjE6JHt0aGlzLnNldHRpbmdzLnBvcnR9L21jcGApO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5odHRwU2VydmVyIS5vbignZXJyb3InLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUFNlcnZlcl0g4p2MIEZhaWxlZCB0byBzdGFydCBzZXJ2ZXI6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSAnRUFERFJJTlVTRScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtNQ1BTZXJ2ZXJdIFBvcnQgJHt0aGlzLnNldHRpbmdzLnBvcnR9IGlzIGFscmVhZHkgaW4gdXNlLiBQbGVhc2UgY2hhbmdlIHRoZSBwb3J0IGluIHNldHRpbmdzLmApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0dXBUb29scygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1BTZXJ2ZXJdIPCfmoAgTUNQIFNlcnZlciBpcyByZWFkeSBmb3IgY29ubmVjdGlvbnMnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1BTZXJ2ZXJdIOKdjCBGYWlsZWQgdG8gc3RhcnQgc2VydmVyOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXR1cFRvb2xzKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnRvb2xzTGlzdCA9IFtdO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ5ZCv55So5bel5YW36YWN572u77yM6L+U5Zue5omA5pyJ5bel5YW3XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkVG9vbHMgfHwgdGhpcy5lbmFibGVkVG9vbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtjYXRlZ29yeSwgdG9vbFNldF0gb2YgT2JqZWN0LmVudHJpZXModGhpcy50b29scykpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2F0ZWdvcnkgPT09ICdzY2VuZUFkdmFuY2VkJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbHMgPSB0b29sU2V0LmdldFRvb2xzKCk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0b29sIG9mIHRvb2xzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9vbHNMaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYCR7Y2F0ZWdvcnl9XyR7dG9vbC5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdG9vbC5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB0b29sLmlucHV0U2NoZW1hXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOagueaNruWQr+eUqOeahOW3peWFt+mFjee9rui/h+a7pFxuICAgICAgICAgICAgY29uc3QgZW5hYmxlZFRvb2xOYW1lcyA9IG5ldyBTZXQodGhpcy5lbmFibGVkVG9vbHMubWFwKHRvb2wgPT4gYCR7dG9vbC5jYXRlZ29yeX1fJHt0b29sLm5hbWV9YCkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtjYXRlZ29yeSwgdG9vbFNldF0gb2YgT2JqZWN0LmVudHJpZXModGhpcy50b29scykpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2F0ZWdvcnkgPT09ICdzY2VuZUFkdmFuY2VkJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbHMgPSB0b29sU2V0LmdldFRvb2xzKCk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0b29sIG9mIHRvb2xzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xOYW1lID0gYCR7Y2F0ZWdvcnl9XyR7dG9vbC5uYW1lfWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVkVG9vbE5hbWVzLmhhcyh0b29sTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9vbHNMaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRvb2xOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB0b29sLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB0b29sLmlucHV0U2NoZW1hXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coYFtNQ1BTZXJ2ZXJdIFNldHVwIHRvb2xzOiAke3RoaXMudG9vbHNMaXN0Lmxlbmd0aH0gdG9vbHMgYXZhaWxhYmxlYCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEZpbHRlcmVkVG9vbHMoZW5hYmxlZFRvb2xzOiBhbnlbXSk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICBpZiAoIWVuYWJsZWRUb29scyB8fCBlbmFibGVkVG9vbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50b29sc0xpc3Q7IC8vIOWmguaenOayoeaciei/h+a7pOmFjee9ru+8jOi/lOWbnuaJgOacieW3peWFt1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZW5hYmxlZFRvb2xOYW1lcyA9IG5ldyBTZXQoZW5hYmxlZFRvb2xzLm1hcCh0b29sID0+IGAke3Rvb2wuY2F0ZWdvcnl9XyR7dG9vbC5uYW1lfWApKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9vbHNMaXN0LmZpbHRlcih0b29sID0+IGVuYWJsZWRUb29sTmFtZXMuaGFzKHRvb2wubmFtZSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBleGVjdXRlVG9vbENhbGwodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgcGFydHMgPSB0b29sTmFtZS5zcGxpdCgnXycpO1xuICAgICAgICBjb25zdCBjYXRlZ29yeSA9IHBhcnRzWzBdO1xuICAgICAgICBjb25zdCB0b29sTWV0aG9kTmFtZSA9IHBhcnRzLnNsaWNlKDEpLmpvaW4oJ18nKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnRvb2xzW2NhdGVnb3J5XSkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudG9vbHNbY2F0ZWdvcnldLmV4ZWN1dGUodG9vbE1ldGhvZE5hbWUsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVG9vbCAke3Rvb2xOYW1lfSBub3QgZm91bmRgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Q2xpZW50cygpOiBNQ1BDbGllbnRbXSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuY2xpZW50cy52YWx1ZXMoKSk7XG4gICAgfVxuICAgIHB1YmxpYyBnZXRBdmFpbGFibGVUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9vbHNMaXN0O1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgW01DUFNlcnZlcl0gVXBkYXRpbmcgZW5hYmxlZCB0b29sczogJHtlbmFibGVkVG9vbHMubGVuZ3RofSB0b29sc2ApO1xuICAgICAgICB0aGlzLmVuYWJsZWRUb29scyA9IGVuYWJsZWRUb29scztcbiAgICAgICAgdGhpcy5zZXR1cFRvb2xzKCk7IC8vIOmHjeaWsOiuvue9ruW3peWFt+WIl+ihqFxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRTZXR0aW5ncygpOiBNQ1BTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlSHR0cFJlcXVlc3QocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHBhcnNlZFVybCA9IHVybC5wYXJzZShyZXEudXJsIHx8ICcnLCB0cnVlKTtcbiAgICAgICAgY29uc3QgcGF0aG5hbWUgPSBwYXJzZWRVcmwucGF0aG5hbWU7XG4gICAgICAgIFxuICAgICAgICAvLyBTZXQgQ09SUyBoZWFkZXJzXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnR0VULCBQT1NULCBPUFRJT05TJyk7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uLCBNY3AtU2Vzc2lvbi1JZCwgbWNwLXNlc3Npb24taWQsIG1jcC1wcm90b2NvbC12ZXJzaW9uJyk7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUV4cG9zZS1IZWFkZXJzJywgJ01jcC1TZXNzaW9uLUlkJyk7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09ICcvbWNwJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlTUNQU1NFQ29ubmVjdGlvbihyZXEsIHJlcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhdGhuYW1lID09PSAnL21jcCcgJiYgcmVxLm1ldGhvZCA9PT0gJ0RFTEVURScpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZU1DUFNlc3Npb25EZWxldGUocmVxLCByZXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwYXRobmFtZSA9PT0gJy9zc2UnICYmIHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5oYW5kbGVTU0VDb25uZWN0aW9uKHJlcSwgcmVzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGF0aG5hbWUgPT09ICcvbWVzc2FnZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5oYW5kbGVTU0VNZXNzYWdlKHJlcSwgcmVzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGF0aG5hbWUgPT09ICcvbWNwJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZU1DUFJlcXVlc3QocmVxLCByZXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwYXRobmFtZSA9PT0gJy9oZWFsdGgnICYmIHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6ICdvaycsIHRvb2xzOiB0aGlzLnRvb2xzTGlzdC5sZW5ndGggfSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwYXRobmFtZT8uc3RhcnRzV2l0aCgnL2FwaS8nKSAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZVNpbXBsZUFQSVJlcXVlc3QocmVxLCByZXMsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGF0aG5hbWUgPT09ICcvYXBpL3Rvb2xzJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgdG9vbHM6IHRoaXMuZ2V0U2ltcGxpZmllZFRvb2xzTGlzdCgpIH0pKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05vdCBmb3VuZCcgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignSFRUUCByZXF1ZXN0IGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTUNQUmVxdWVzdChyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgbGV0IGJvZHkgPSAnJztcbiAgICAgICAgY29uc3Qgc2Vzc2lvbklkID0gdGhpcy5yZXNvbHZlU2Vzc2lvbklkKHJlcSk7XG4gICAgICAgIC8vIFNlc3Npb24gSUQgaXMgYWx3YXlzIHJldHVybmVkOyBmb3IgU1NFIHJlc3BvbnNlcyBpdCBnb2VzIGluIHdyaXRlSGVhZCBoZWFkZXJzXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ01jcC1TZXNzaW9uLUlkJywgc2Vzc2lvbklkKTtcblxuICAgICAgICAvLyBTdHJlYW1hYmxlIEhUVFAgKDIwMjUtMDMtMjYpOiBjbGllbnRzIHNlbmQgQWNjZXB0OiBhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2V2ZW50LXN0cmVhbVxuICAgICAgICAvLyBJZiB0aGUgY2xpZW50IHdhbnRzIFNTRSwga2VlcCB0aGUgUE9TVCByZXNwb25zZSBvcGVuIGFzIGEgcGVyc2lzdGVudCBzZXJ2ZXItcHVzaCBjaGFubmVsLlxuICAgICAgICAvLyBUaGlzIGlzIHJlcXVpcmVkIGJ5IHJtY3AgYW5kIG90aGVyIFN0cmVhbWFibGUgSFRUUCBjbGllbnRzIOKAlCByZXR1cm5pbmcgYXBwbGljYXRpb24vanNvblxuICAgICAgICAvLyBjbG9zZXMgdGhlIGNvbm5lY3Rpb24gYW5kIHRoZSBjbGllbnQncyB0cmFuc3BvcnQgY2hhbm5lbCBpbW1lZGlhdGVseSwgY2F1c2luZ1xuICAgICAgICAvLyBcIlRyYW5zcG9ydCBjaGFubmVsIGNsb3NlZCwgd2hlbiBzZW5kIGluaXRpYWxpemVkIG5vdGlmaWNhdGlvblwiIGVycm9ycy5cbiAgICAgICAgY29uc3QgYWNjZXB0SGVhZGVyID0gKChyZXEuaGVhZGVyc1snYWNjZXB0J10gfHwgJycpIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3Qgd2FudHNTU0UgPSBhY2NlcHRIZWFkZXIuaW5jbHVkZXMoJ3RleHQvZXZlbnQtc3RyZWFtJyk7XG5cbiAgICAgICAgcmVxLm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XG4gICAgICAgICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZml4ZWRCb2R5ID0gdGhpcy5maXhDb21tb25Kc29uSXNzdWVzKGJvZHkpO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZml4ZWRCb2R5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQU2VydmVyXSBGaXhlZCBKU09OIHBhcnNpbmcgaXNzdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoc2Vjb25kRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSlNPTiBwYXJzaW5nIGZhaWxlZDogJHtwYXJzZUVycm9yLm1lc3NhZ2V9LiBPcmlnaW5hbCBib2R5OiAke2JvZHkuc3Vic3RyaW5nKDAsIDUwMCl9Li4uYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZXM6IGFueVtdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuaGFuZGxlTWVzc2FnZShpdGVtLCBzZXNzaW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlKSByZXNwb25zZXMucHVzaChyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kTm90aWZpY2F0aW9uQWNjZXB0ZWQocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh3YW50c1NTRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kU1NFUmVzcG9uc2UocmVxLCByZXMsIHNlc3Npb25JZCwgcmVzcG9uc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2VzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5oYW5kbGVNZXNzYWdlKG1lc3NhZ2UsIHNlc3Npb25JZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOb3RpZmljYXRpb24gb3IgcmVzcG9uc2Utb25seSBtZXNzYWdlOiAyMDIgQWNjZXB0ZWQsIG5vIGJvZHlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kTm90aWZpY2F0aW9uQWNjZXB0ZWQocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh3YW50c1NTRSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTZW5kIHJlc3BvbnNlIGFzIFNTRSBldmVudCBhbmQga2VlcCBjb25uZWN0aW9uIG9wZW4gYXMgdHJhbnNwb3J0IGNoYW5uZWxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kU1NFUmVzcG9uc2UocmVxLCByZXMsIHNlc3Npb25JZCwgW3Jlc3BvbnNlXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIE1DUCByZXF1ZXN0OicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlcy5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogLTMyNzAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQYXJzZSBlcnJvcjogJHtlcnJvci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU3RyZWFtYWJsZSBIVFRQICgyMDI1LTAzLTI2KTogcmVzcG9uZCB3aXRoIFNTRSBhbmQga2VlcCB0aGUgUE9TVCBjb25uZWN0aW9uIG9wZW5cbiAgICAvLyBzbyB0aGUgcm1jcCB0cmFuc3BvcnQgd29ya2VyIHN0YXlzIGFsaXZlIGZvciB0aGUgZnVsbCBzZXNzaW9uIGxpZmV0aW1lLlxuICAgIHByaXZhdGUgc2VuZFNTRVJlc3BvbnNlKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgc2Vzc2lvbklkOiBzdHJpbmcsIGV2ZW50czogYW55W10pOiB2b2lkIHtcbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9ldmVudC1zdHJlYW0nLFxuICAgICAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLFxuICAgICAgICAgICAgJ0Nvbm5lY3Rpb24nOiAna2VlcC1hbGl2ZScsXG4gICAgICAgICAgICAnTWNwLVNlc3Npb24tSWQnOiBzZXNzaW9uSWQsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUV4cG9zZS1IZWFkZXJzJzogJ01jcC1TZXNzaW9uLUlkJyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBldmVudCBvZiBldmVudHMpIHtcbiAgICAgICAgICAgIHJlcy53cml0ZShgZGF0YTogJHtKU09OLnN0cmluZ2lmeShldmVudCl9XFxuXFxuYCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZWdpc3RlciBhcyB0aGUgU1NFIHB1c2ggY2hhbm5lbCBmb3IgdGhpcyBzZXNzaW9uXG4gICAgICAgIHRoaXMuc3NlQ29ubmVjdGlvbnMuc2V0KHNlc3Npb25JZCwgcmVzKTtcbiAgICAgICAgdGhpcy50b3VjaENsaWVudChzZXNzaW9uSWQpO1xuXG4gICAgICAgIGNvbnN0IGhlYXJ0YmVhdCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXMud3JpdGFibGVFbmRlZCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaGVhcnRiZWF0KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zc2VDb25uZWN0aW9ucy5nZXQoc2Vzc2lvbklkKSA9PT0gcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3NlQ29ubmVjdGlvbnMuZGVsZXRlKHNlc3Npb25JZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy53cml0ZSgnOiBwaW5nXFxuXFxuJyk7XG4gICAgICAgIH0sIDMwMDAwKTtcblxuICAgICAgICByZXEub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChoZWFydGJlYXQpO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3NlQ29ubmVjdGlvbnMuZ2V0KHNlc3Npb25JZCkgPT09IHJlcykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3NlQ29ubmVjdGlvbnMuZGVsZXRlKHNlc3Npb25JZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGllbnRzLmRlbGV0ZShzZXNzaW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNQ1BTZXJ2ZXJdIFBPU1QgU1NFIGNoYW5uZWwgY2xvc2VkOiAke3Nlc3Npb25JZH1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYFtNQ1BTZXJ2ZXJdIFBPU1QgU1NFIGNoYW5uZWwgb3BlbmVkOiAke3Nlc3Npb25JZH1gKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU1lc3NhZ2UobWVzc2FnZTogYW55LCBzZXNzaW9uSWQ/OiBzdHJpbmcpOiBQcm9taXNlPGFueSB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgeyBpZCwgbWV0aG9kLCBwYXJhbXMgfSA9IG1lc3NhZ2U7XG4gICAgICAgIGNvbnN0IGlzTm90aWZpY2F0aW9uID0gaWQgPT09IHVuZGVmaW5lZCB8fCBpZCA9PT0gbnVsbDtcblxuICAgICAgICBpZiAoIW1ldGhvZCB8fCB0eXBlb2YgbWV0aG9kICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKGlzTm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgICAgICAgICAgIGlkOiBpZCA/PyBudWxsLFxuICAgICAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IC0zMjYwMCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgUmVxdWVzdDogbWlzc2luZyBtZXRob2QnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0OiBhbnk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm90aWZpY2F0aW9ucy9pbml0aWFsaXplZCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnaW5pdGlhbGl6ZWQnOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvdWNoQ2xpZW50KHNlc3Npb25JZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc05vdGlmaWNhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3BpbmcnOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncmVzb3VyY2VzL2xpc3QnOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7IHJlc291cmNlczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncmVzb3VyY2VzL3RlbXBsYXRlcy9saXN0JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geyByZXNvdXJjZVRlbXBsYXRlczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncHJvbXB0cy9saXN0JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geyBwcm9tcHRzOiBbXSB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICd0b29scy9saXN0JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geyB0b29sczogdGhpcy5nZXRBdmFpbGFibGVUb29scygpIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Rvb2xzL2NhbGwnOlxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IG5hbWUsIGFyZ3VtZW50czogYXJncyB9ID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b29sUmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlVG9vbENhbGwobmFtZSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHsgY29udGVudDogW3sgdHlwZTogJ3RleHQnLCB0ZXh0OiBKU09OLnN0cmluZ2lmeSh0b29sUmVzdWx0KSB9XSB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdpbml0aWFsaXplJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gTUNQIGluaXRpYWxpemF0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG91Y2hDbGllbnQoc2Vzc2lvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2xWZXJzaW9uOiAnMjAyNS0wMy0yNicsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0Q2hhbmdlZDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0Q2hhbmdlZDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21wdHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdENoYW5nZWQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckluZm86IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogJzEuMC4wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kLnN0YXJ0c1dpdGgoJ25vdGlmaWNhdGlvbnMvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc05vdGlmaWNhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gbWV0aG9kOiAke21ldGhvZH1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzTm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoaXNOb3RpZmljYXRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogLTMyNjAzLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2VuZE5vdGlmaWNhdGlvbkFjY2VwdGVkKHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IHZvaWQge1xuICAgICAgICAvLyBNQ1AgMjAyNS0wMy0yNjogbm90aWZpY2F0aW9ucy9yZXNwb25zZXMgdGhhdCBuZWVkIG5vIHJlcGx5IOKGkiAyMDIgQWNjZXB0ZWQsIGVtcHR5IGJvZHlcbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDIpO1xuICAgICAgICByZXMuZW5kKCk7XG4gICAgfVxuXG4gICAgLy8gU3RyZWFtYWJsZSBIVFRQIFRyYW5zcG9ydCAoTUNQIDIwMjUtMDMtMjYpOiBHRVQgL21jcCBvcGVucyBhIHBlcnNpc3RlbnQgU1NFIHN0cmVhbVxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTUNQU1NFQ29ubmVjdGlvbihyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbklkID0gdGhpcy5yZXNvbHZlU2Vzc2lvbklkKHJlcSkgfHwgdXVpZHY0KCk7XG5cbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9ldmVudC1zdHJlYW0nLFxuICAgICAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLFxuICAgICAgICAgICAgJ0Nvbm5lY3Rpb24nOiAna2VlcC1hbGl2ZScsXG4gICAgICAgICAgICAnTWNwLVNlc3Npb24tSWQnOiBzZXNzaW9uSWQsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUV4cG9zZS1IZWFkZXJzJzogJ01jcC1TZXNzaW9uLUlkJyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5zc2VDb25uZWN0aW9ucy5zZXQoc2Vzc2lvbklkLCByZXMpO1xuICAgICAgICB0aGlzLnRvdWNoQ2xpZW50KHNlc3Npb25JZCk7XG5cbiAgICAgICAgY29uc3QgaGVhcnRiZWF0ID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcy53cml0YWJsZUVuZGVkKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChoZWFydGJlYXQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy53cml0ZSgnOiBwaW5nXFxuXFxuJyk7XG4gICAgICAgIH0sIDMwMDAwKTtcblxuICAgICAgICByZXEub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChoZWFydGJlYXQpO1xuICAgICAgICAgICAgdGhpcy5zc2VDb25uZWN0aW9ucy5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICAgICAgICAgIHRoaXMuY2xpZW50cy5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTUNQU2VydmVyXSBTdHJlYW1hYmxlIEhUVFAgU1NFIHN0cmVhbSBjbG9zZWQ6ICR7c2Vzc2lvbklkfWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgW01DUFNlcnZlcl0gU3RyZWFtYWJsZSBIVFRQIFNTRSBzdHJlYW0gb3BlbmVkOiAke3Nlc3Npb25JZH1gKTtcbiAgICB9XG5cbiAgICAvLyBTdHJlYW1hYmxlIEhUVFAgVHJhbnNwb3J0IChNQ1AgMjAyNS0wMy0yNik6IERFTEVURSAvbWNwIHRlcm1pbmF0ZXMgYSBzZXNzaW9uXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVNQ1BTZXNzaW9uRGVsZXRlKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBzZXNzaW9uSWQgPSB0aGlzLnJlc29sdmVTZXNzaW9uSWQocmVxKTtcbiAgICAgICAgaWYgKHNlc3Npb25JZCkge1xuICAgICAgICAgICAgY29uc3Qgc3NlUmVzID0gdGhpcy5zc2VDb25uZWN0aW9ucy5nZXQoc2Vzc2lvbklkKTtcbiAgICAgICAgICAgIGlmIChzc2VSZXMgJiYgIXNzZVJlcy53cml0YWJsZUVuZGVkKSB7XG4gICAgICAgICAgICAgICAgc3NlUmVzLmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zc2VDb25uZWN0aW9ucy5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICAgICAgICAgIHRoaXMuY2xpZW50cy5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTUNQU2VydmVyXSBTZXNzaW9uIHRlcm1pbmF0ZWQgdmlhIERFTEVURTogJHtzZXNzaW9uSWR9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICByZXMuZW5kKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVTU0VDb25uZWN0aW9uKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBzZXNzaW9uSWQgPSB1dWlkdjQoKTtcblxuICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2V2ZW50LXN0cmVhbScsXG4gICAgICAgICAgICAnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZScsXG4gICAgICAgICAgICAnQ29ubmVjdGlvbic6ICdrZWVwLWFsaXZlJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdDb250ZW50LVR5cGUsIEF1dGhvcml6YXRpb24sIE1jcC1TZXNzaW9uLUlkLCBtY3Atc2Vzc2lvbi1pZCcsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc3NlQ29ubmVjdGlvbnMuc2V0KHNlc3Npb25JZCwgcmVzKTtcbiAgICAgICAgdGhpcy50b3VjaENsaWVudChzZXNzaW9uSWQpO1xuXG4gICAgICAgIGNvbnN0IHBvc3RFbmRwb2ludCA9IGAvbWVzc2FnZT9zZXNzaW9uSWQ9JHtzZXNzaW9uSWR9YDtcbiAgICAgICAgcmVzLndyaXRlKGBldmVudDogZW5kcG9pbnRcXG5kYXRhOiAke3Bvc3RFbmRwb2ludH1cXG5cXG5gKTtcblxuICAgICAgICBjb25zdCBoZWFydGJlYXQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzLndyaXRhYmxlRW5kZWQpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGhlYXJ0YmVhdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLndyaXRlKCc6IHBpbmdcXG5cXG4nKTtcbiAgICAgICAgfSwgMzAwMDApO1xuXG4gICAgICAgIHJlcS5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGhlYXJ0YmVhdCk7XG4gICAgICAgICAgICB0aGlzLnNzZUNvbm5lY3Rpb25zLmRlbGV0ZShzZXNzaW9uSWQpO1xuICAgICAgICAgICAgdGhpcy5jbGllbnRzLmRlbGV0ZShzZXNzaW9uSWQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNQ1BTZXJ2ZXJdIFNTRSBjbGllbnQgZGlzY29ubmVjdGVkOiAke3Nlc3Npb25JZH1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYFtNQ1BTZXJ2ZXJdIFNTRSBjbGllbnQgY29ubmVjdGVkOiAke3Nlc3Npb25JZH0sIGVuZHBvaW50OiAke3Bvc3RFbmRwb2ludH1gKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVNTRU1lc3NhZ2UocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnQ29udGVudC1UeXBlJyk7XG5cbiAgICAgICAgY29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHJlcS51cmwgfHwgJycsIHRydWUpO1xuICAgICAgICBjb25zdCBzZXNzaW9uSWQgPSBwYXJzZWRVcmwucXVlcnkuc2Vzc2lvbklkIGFzIHN0cmluZztcblxuICAgICAgICBpZiAoIXNlc3Npb25JZCkge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDApO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWlzc2luZyBzZXNzaW9uSWQnIH0pKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNzZVJlcyA9IHRoaXMuc3NlQ29ubmVjdGlvbnMuZ2V0KHNlc3Npb25JZCk7XG4gICAgICAgIGlmICghc3NlUmVzIHx8IHNzZVJlcy53cml0YWJsZUVuZGVkKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdTU0Ugc2Vzc2lvbiBub3QgZm91bmQgb3IgY2xvc2VkJyB9KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICByZXEub24oJ2RhdGEnLCAoY2h1bmspID0+IHsgYm9keSArPSBjaHVuay50b1N0cmluZygpOyB9KTtcbiAgICAgICAgcmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hDbGllbnQoc2Vzc2lvbklkKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5oYW5kbGVNZXNzYWdlKG1lc3NhZ2UsIHNlc3Npb25JZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3NlUmVzLndyaXRlKGBkYXRhOiAke0pTT04uc3RyaW5naWZ5KHJlc3BvbnNlKX1cXG5cXG5gKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMik7XG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1BTZXJ2ZXJdIFNTRSBtZXNzYWdlIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNvbHZlU2Vzc2lvbklkKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCByYXcgPSByZXEuaGVhZGVyc1snbWNwLXNlc3Npb24taWQnXTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gQXJyYXkuaXNBcnJheShyYXcpID8gcmF3WzBdIDogcmF3O1xuICAgICAgICBpZiAoaGVhZGVyICYmIGhlYWRlci50cmltKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBoZWFkZXIudHJpbSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1dWlkdjQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRvdWNoQ2xpZW50KHNlc3Npb25JZD86IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpZiAoIXNlc3Npb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xpZW50cy5zZXQoc2Vzc2lvbklkLCB7XG4gICAgICAgICAgICBpZDogc2Vzc2lvbklkLFxuICAgICAgICAgICAgbGFzdEFjdGl2aXR5OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgdXNlckFnZW50OiB0aGlzLmNsaWVudHMuZ2V0KHNlc3Npb25JZCk/LnVzZXJBZ2VudFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZpeENvbW1vbkpzb25Jc3N1ZXMoanNvblN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IGZpeGVkID0ganNvblN0cjtcbiAgICAgICAgXG4gICAgICAgIC8vIEZpeCBjb21tb24gZXNjYXBlIGNoYXJhY3RlciBpc3N1ZXNcbiAgICAgICAgZml4ZWQgPSBmaXhlZFxuICAgICAgICAgICAgLy8gRml4IHVuZXNjYXBlZCBxdW90ZXMgaW4gc3RyaW5nc1xuICAgICAgICAgICAgLnJlcGxhY2UoLyhbXlxcXFxdKVwiKFteXCJdKlteXFxcXF0pXCIoW14sfVxcXTpdKS9nLCAnJDFcXFxcXCIkMlxcXFxcIiQzJylcbiAgICAgICAgICAgIC8vIEZpeCB1bmVzY2FwZWQgYmFja3NsYXNoZXNcbiAgICAgICAgICAgIC5yZXBsYWNlKC8oW15cXFxcXSlcXFxcKFteXCJcXFxcXFwvYmZucnRdKS9nLCAnJDFcXFxcXFxcXCQyJylcbiAgICAgICAgICAgIC8vIEZpeCB0cmFpbGluZyBjb21tYXNcbiAgICAgICAgICAgIC5yZXBsYWNlKC8sKFxccypbfVxcXV0pL2csICckMScpXG4gICAgICAgICAgICAvLyBGaXggc2luZ2xlIHF1b3RlcyAoc2hvdWxkIGJlIGRvdWJsZSBxdW90ZXMpXG4gICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnXCInKVxuICAgICAgICAgICAgLy8gRml4IGNvbW1vbiBjb250cm9sIGNoYXJhY3RlcnNcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4vZywgJ1xcXFxuJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHIvZywgJ1xcXFxyJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHQvZywgJ1xcXFx0Jyk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZml4ZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmh0dHBTZXJ2ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaHR0cFNlcnZlci5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5odHRwU2VydmVyID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQU2VydmVyXSBIVFRQIHNlcnZlciBzdG9wcGVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsaWVudHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5zc2VDb25uZWN0aW9ucy5jbGVhcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRTdGF0dXMoKTogU2VydmVyU3RhdHVzIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJ1bm5pbmc6ICEhdGhpcy5odHRwU2VydmVyLFxuICAgICAgICAgICAgcG9ydDogdGhpcy5zZXR0aW5ncy5wb3J0LFxuICAgICAgICAgICAgY2xpZW50czogMCAvLyBIVFRQIGlzIHN0YXRlbGVzcywgbm8gcGVyc2lzdGVudCBjbGllbnRzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVTaW1wbGVBUElSZXF1ZXN0KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgcGF0aG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICBcbiAgICAgICAgcmVxLm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XG4gICAgICAgICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QgdG9vbCBuYW1lIGZyb20gcGF0aCBsaWtlIC9hcGkvbm9kZS9zZXRfcG9zaXRpb25cbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoUGFydHMgPSBwYXRobmFtZS5zcGxpdCgnLycpLmZpbHRlcihwID0+IHApO1xuICAgICAgICAgICAgICAgIGlmIChwYXRoUGFydHMubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludmFsaWQgQVBJIHBhdGguIFVzZSAvYXBpL3tjYXRlZ29yeX0ve3Rvb2xfbmFtZX0nIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IHBhdGhQYXJ0c1sxXTtcbiAgICAgICAgICAgICAgICBjb25zdCB0b29sTmFtZSA9IHBhdGhQYXJ0c1syXTtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsVG9vbE5hbWUgPSBgJHtjYXRlZ29yeX1fJHt0b29sTmFtZX1gO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIHBhcmFtZXRlcnMgd2l0aCBlbmhhbmNlZCBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgIGxldCBwYXJhbXM7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpeCBKU09OIGlzc3Vlc1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXhlZEJvZHkgPSB0aGlzLmZpeENvbW1vbkpzb25Jc3N1ZXMoYm9keSk7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSBKU09OLnBhcnNlKGZpeGVkQm9keSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUFNlcnZlcl0gRml4ZWQgQVBJIEpTT04gcGFyc2luZyBpc3N1ZScpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChzZWNvbmRFcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ0ludmFsaWQgSlNPTiBpbiByZXF1ZXN0IGJvZHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IHBhcnNlRXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNlaXZlZEJvZHk6IGJvZHkuc3Vic3RyaW5nKDAsIDIwMClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRvb2xcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVUb29sQ2FsbChmdWxsVG9vbE5hbWUsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0b29sOiBmdWxsVG9vbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NpbXBsZSBBUEkgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB0b29sOiBwYXRobmFtZVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRTaW1wbGlmaWVkVG9vbHNMaXN0KCk6IGFueVtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9vbHNMaXN0Lm1hcCh0b29sID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gdG9vbC5uYW1lLnNwbGl0KCdfJyk7XG4gICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IHBhcnRzWzBdO1xuICAgICAgICAgICAgY29uc3QgdG9vbE5hbWUgPSBwYXJ0cy5zbGljZSgxKS5qb2luKCdfJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogdG9vbC5uYW1lLFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcbiAgICAgICAgICAgICAgICB0b29sTmFtZTogdG9vbE5hbWUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRvb2wuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgYXBpUGF0aDogYC9hcGkvJHtjYXRlZ29yeX0vJHt0b29sTmFtZX1gLFxuICAgICAgICAgICAgICAgIGN1cmxFeGFtcGxlOiB0aGlzLmdlbmVyYXRlQ3VybEV4YW1wbGUoY2F0ZWdvcnksIHRvb2xOYW1lLCB0b29sLmlucHV0U2NoZW1hKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUN1cmxFeGFtcGxlKGNhdGVnb3J5OiBzdHJpbmcsIHRvb2xOYW1lOiBzdHJpbmcsIHNjaGVtYTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgLy8gR2VuZXJhdGUgc2FtcGxlIHBhcmFtZXRlcnMgYmFzZWQgb24gc2NoZW1hXG4gICAgICAgIGNvbnN0IHNhbXBsZVBhcmFtcyA9IHRoaXMuZ2VuZXJhdGVTYW1wbGVQYXJhbXMoc2NoZW1hKTtcbiAgICAgICAgY29uc3QganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHNhbXBsZVBhcmFtcywgbnVsbCwgMik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYGN1cmwgLVggUE9TVCBodHRwOi8vMTI3LjAuMC4xOjg1ODUvYXBpLyR7Y2F0ZWdvcnl9LyR7dG9vbE5hbWV9IFxcXFxcbiAgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiBcXFxcXG4gIC1kICcke2pzb25TdHJpbmd9J2A7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVNhbXBsZVBhcmFtcyhzY2hlbWE6IGFueSk6IGFueSB7XG4gICAgICAgIGlmICghc2NoZW1hIHx8ICFzY2hlbWEucHJvcGVydGllcykgcmV0dXJuIHt9O1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgc2FtcGxlOiBhbnkgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBwcm9wXSBvZiBPYmplY3QuZW50cmllcyhzY2hlbWEucHJvcGVydGllcyBhcyBhbnkpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wU2NoZW1hID0gcHJvcCBhcyBhbnk7XG4gICAgICAgICAgICBzd2l0Y2ggKHByb3BTY2hlbWEudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZVtrZXldID0gcHJvcFNjaGVtYS5kZWZhdWx0IHx8ICdleGFtcGxlX3N0cmluZyc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZVtrZXldID0gcHJvcFNjaGVtYS5kZWZhdWx0IHx8IDQyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlW2tleV0gPSBwcm9wU2NoZW1hLmRlZmF1bHQgfHwgdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlW2tleV0gPSBwcm9wU2NoZW1hLmRlZmF1bHQgfHwgeyB4OiAwLCB5OiAwLCB6OiAwIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZVtrZXldID0gJ2V4YW1wbGVfdmFsdWUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzYW1wbGU7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZVNldHRpbmdzKHNldHRpbmdzOiBNQ1BTZXJ2ZXJTZXR0aW5ncykge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIGlmICh0aGlzLmh0dHBTZXJ2ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBIVFRQIHRyYW5zcG9ydCBkb2Vzbid0IG5lZWQgcGVyc2lzdGVudCBjb25uZWN0aW9uc1xuLy8gTUNQIG92ZXIgSFRUUCB1c2VzIHJlcXVlc3QtcmVzcG9uc2UgcGF0dGVyblxuIl19
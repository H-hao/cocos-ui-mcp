"use strict";
/**
 * MCP客户端配置文件管理器
 * 负责读取、合并、添加、删除各个AI编辑器的MCP配置
 */
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
exports.MCPConfigManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const toml = __importStar(require("@iarna/toml"));
const mcp_client_configs_1 = require("./mcp-client-configs");
/**
 * MCP配置管理器
 */
class MCPConfigManager {
    /**
     * 检查配置文件是否存在
     */
    static configFileExists(clientType, scope = 'user') {
        try {
            const configPath = (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope });
            return fs.existsSync(configPath);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 读取现有配置文件
     */
    static readConfig(clientType, scope = 'user') {
        const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
        const configPath = (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope });
        if (!fs.existsSync(configPath)) {
            // 配置文件不存在，返回空配置
            if (client.configFormat === 'json') {
                return { mcpServers: {} };
            }
            else {
                return { mcp_servers: {} };
            }
        }
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            if (client.configFormat === 'json') {
                return JSON.parse(content);
            }
            else {
                return toml.parse(content);
            }
        }
        catch (error) {
            console.error(`[MCPConfigManager] Failed to read config for ${clientType}:`, error);
            throw new Error(`无法读取配置文件: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 备份现有配置文件
     */
    static backupConfig(clientType, scope = 'user') {
        const configPath = (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope });
        if (!fs.existsSync(configPath)) {
            return null;
        }
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${configPath}.backup-${timestamp}`;
            fs.copyFileSync(configPath, backupPath);
            console.log(`[MCPConfigManager] Config backed up to: ${backupPath}`);
            return backupPath;
        }
        catch (error) {
            console.error(`[MCPConfigManager] Failed to backup config:`, error);
            return null;
        }
    }
    /**
     * 确保配置文件目录存在
     */
    static ensureConfigDir(configPath) {
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[MCPConfigManager] Created config directory: ${dir}`);
        }
    }
    /**
     * 写入配置文件
     */
    static writeConfig(clientType, config, scope = 'user') {
        const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
        const configPath = (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope });
        // 确保目录存在
        this.ensureConfigDir(configPath);
        try {
            let content;
            if (client.configFormat === 'json') {
                content = JSON.stringify(config, null, 2);
            }
            else {
                content = toml.stringify(config);
            }
            fs.writeFileSync(configPath, content, 'utf-8');
            console.log(`[MCPConfigManager] Config written to: ${configPath}`);
        }
        catch (error) {
            console.error(`[MCPConfigManager] Failed to write config:`, error);
            throw new Error(`无法写入配置文件: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 添加MCP服务器配置
     */
    static addServer(clientType, serverConfig, scope = 'user') {
        try {
            const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
            console.log(`[MCPConfigManager] Adding server ${serverConfig.serverName} to ${clientType}`);
            // 备份现有配置
            const backupPath = this.backupConfig(clientType, scope);
            // 读取现有配置
            const config = this.readConfig(clientType, scope);
            // 获取服务器配置对象
            const serversKey = client.configFormat === 'json' ? 'mcpServers' : 'mcp_servers';
            if (!config[serversKey]) {
                config[serversKey] = {};
            }
            // 检查服务器是否已存在
            if (config[serversKey][serverConfig.serverName]) {
                return {
                    success: false,
                    message: `服务器 "${serverConfig.serverName}" 已存在于配置文件中`,
                    configPath: (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope })
                };
            }
            // 生成服务器配置项
            const serverEntry = {};
            // 不同客户端使用不同的字段名
            if (clientType === 'windsurf') {
                // Windsurf使用serverUrl
                serverEntry.serverUrl = serverConfig.serverUrl;
            }
            else if (clientType === 'gemini-cli') {
                // Gemini CLI使用httpUrl
                serverEntry.httpUrl = serverConfig.serverUrl;
            }
            else {
                // Cursor, Trae, Claude CLI, Codex CLI都使用url
                serverEntry.url = serverConfig.serverUrl;
            }
            if (serverConfig.headers && Object.keys(serverConfig.headers).length > 0) {
                serverEntry.headers = serverConfig.headers;
            }
            // 添加到配置
            config[serversKey][serverConfig.serverName] = serverEntry;
            // 写入配置文件
            this.writeConfig(clientType, config, scope);
            return {
                success: true,
                message: `成功添加服务器 "${serverConfig.serverName}" 到 ${client.name}`,
                configPath: (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope }),
                backupPath: backupPath || undefined
            };
        }
        catch (error) {
            console.error(`[MCPConfigManager] Failed to add server:`, error);
            return {
                success: false,
                message: `添加失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * 删除MCP服务器配置
     */
    static removeServer(clientType, serverName, scope = 'user') {
        try {
            const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
            console.log(`[MCPConfigManager] Removing server ${serverName} from ${clientType}`);
            const configPath = (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope });
            if (!fs.existsSync(configPath)) {
                return {
                    success: false,
                    message: `配置文件不存在`,
                    configPath: configPath
                };
            }
            // 备份现有配置
            const backupPath = this.backupConfig(clientType, scope);
            // 读取现有配置
            const config = this.readConfig(clientType, scope);
            // 获取服务器配置对象
            const serversKey = client.configFormat === 'json' ? 'mcpServers' : 'mcp_servers';
            if (!config[serversKey] || !config[serversKey][serverName]) {
                return {
                    success: false,
                    message: `服务器 "${serverName}" 不存在于配置文件中`,
                    configPath: configPath
                };
            }
            // 删除服务器
            delete config[serversKey][serverName];
            // 写入配置文件
            this.writeConfig(clientType, config, scope);
            return {
                success: true,
                message: `成功从 ${client.name} 中删除服务器 "${serverName}"`,
                configPath: configPath,
                backupPath: backupPath || undefined
            };
        }
        catch (error) {
            console.error(`[MCPConfigManager] Failed to remove server:`, error);
            return {
                success: false,
                message: `删除失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * 检查服务器是否存在
     */
    static serverExists(clientType, serverName, scope = 'user') {
        try {
            const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
            const config = this.readConfig(clientType, scope);
            const serversKey = client.configFormat === 'json' ? 'mcpServers' : 'mcp_servers';
            return config[serversKey] && config[serversKey][serverName] !== undefined;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 获取配置文件中的所有服务器名称
     */
    static listServers(clientType, scope = 'user') {
        try {
            const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
            const config = this.readConfig(clientType, scope);
            const serversKey = client.configFormat === 'json' ? 'mcpServers' : 'mcp_servers';
            if (!config[serversKey]) {
                return [];
            }
            return Object.keys(config[serversKey]);
        }
        catch (error) {
            console.error(`[MCPConfigManager] Failed to list servers:`, error);
            return [];
        }
    }
    /**
     * 生成当前Cocos MCP服务器的配置
     */
    static generateCocosServerConfig(port = 3000) {
        return {
            serverName: 'cocos-creator',
            serverUrl: `http://127.0.0.1:${port}/mcp`
        };
    }
    /**
     * 一键添加到所有支持的客户端
     */
    static addToAllClients(serverConfig, scope = 'user') {
        const results = new Map();
        // 添加到IDE编辑器和Codex CLI（Codex CLI支持自动配置）
        const autoConfigClients = ['cursor', 'windsurf', 'trae', 'codex-cli'];
        for (const clientType of autoConfigClients) {
            const result = this.addServer(clientType, serverConfig, scope);
            results.set(clientType, result);
        }
        return results;
    }
    /**
     * 从所有客户端删除
     */
    static removeFromAllClients(serverName, scope = 'user') {
        const results = new Map();
        const autoConfigClients = ['cursor', 'windsurf', 'trae', 'codex-cli'];
        for (const clientType of autoConfigClients) {
            if (this.serverExists(clientType, serverName, scope)) {
                const result = this.removeServer(clientType, serverName, scope);
                results.set(clientType, result);
            }
        }
        return results;
    }
    /**
     * 生成CLI命令（用于显示给用户，仅手动配置的CLI）
     */
    static generateCLICommands(serverConfig) {
        const scope = serverConfig.scope || 'user';
        return {
            claude: (0, mcp_client_configs_1.generateCLICommand)({
                clientType: 'claude-cli',
                serverConfig,
                transport: 'streamable-http',
                scope: scope
            }),
            gemini: (0, mcp_client_configs_1.generateCLICommand)({
                clientType: 'gemini-cli',
                serverConfig,
                transport: 'streamable-http',
                scope: scope
            })
        };
    }
    /**
     * 生成指定客户端的配置内容（用于复制）
     */
    static generateConfigContent(clientType, serverConfig) {
        const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
        if (client.configFormat === 'json') {
            return (0, mcp_client_configs_1.generateJSONConfig)(clientType, serverConfig, 'streamable-http');
        }
        else {
            // TOML格式
            return (0, mcp_client_configs_1.generateTOMLConfig)(serverConfig);
        }
    }
    /**
     * 获取配置状态摘要
     */
    static getConfigStatus(serverName, scope = 'user') {
        const allClients = ['cursor', 'windsurf', 'trae', 'codex-cli', 'claude-cli', 'gemini-cli'];
        const results = allClients.map(clientType => {
            try {
                const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
                // 自动配置的客户端: Cursor, Windsurf, Trae, Codex CLI
                const isAutoConfig = clientType === 'cursor' || clientType === 'windsurf' ||
                    clientType === 'trae' || clientType === 'codex-cli';
                const configPath = (0, mcp_client_configs_1.getConfigFilePath)(clientType, { scope });
                const exists = this.serverExists(clientType, serverName, scope);
                return {
                    clientType,
                    clientName: client.name,
                    exists: exists,
                    configPath: configPath,
                    isIDE: client.isIDE,
                    isAutoConfig: isAutoConfig
                };
            }
            catch (error) {
                console.error(`[MCPConfigManager] Failed to get status for ${clientType}:`, error);
                const client = mcp_client_configs_1.MCP_CLIENTS[clientType];
                const isAutoConfig = clientType === 'cursor' || clientType === 'windsurf' ||
                    clientType === 'trae' || clientType === 'codex-cli';
                return {
                    clientType,
                    clientName: client.name,
                    exists: false,
                    configPath: 'Error loading path',
                    isIDE: client.isIDE,
                    isAutoConfig: isAutoConfig
                };
            }
        });
        return results;
    }
}
exports.MCPConfigManager = MCPConfigManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLWNvbmZpZy1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL21jcC1jb25maWctbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLGtEQUFvQztBQUNwQyw2REFTOEI7QUFXOUI7O0dBRUc7QUFDSCxNQUFhLGdCQUFnQjtJQUN6Qjs7T0FFRztJQUNJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFzQixFQUFFLFFBQW9CLE1BQU07UUFDN0UsSUFBSSxDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBQSxzQ0FBaUIsRUFBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQXNCLEVBQUUsUUFBb0IsTUFBTTtRQUN2RSxNQUFNLE1BQU0sR0FBRyxnQ0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sVUFBVSxHQUFHLElBQUEsc0NBQWlCLEVBQUMsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUU1RCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQzdCLGdCQUFnQjtZQUNoQixJQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE9BQU8sRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVyRCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9CLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0RBQWdELFVBQVUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzNGLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQXNCLEVBQUUsUUFBb0IsTUFBTTtRQUN6RSxNQUFNLFVBQVUsR0FBRyxJQUFBLHNDQUFpQixFQUFDLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFNUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUM3QixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sVUFBVSxHQUFHLEdBQUcsVUFBVSxXQUFXLFNBQVMsRUFBRSxDQUFDO1lBQ3ZELEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDckUsT0FBTyxVQUFVLENBQUM7UUFDdEIsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BFLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQWtCO1FBQzdDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN0QixFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0RBQWdELEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBc0IsRUFBRSxNQUFXLEVBQUUsUUFBb0IsTUFBTTtRQUN0RixNQUFNLE1BQU0sR0FBRyxnQ0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sVUFBVSxHQUFHLElBQUEsc0NBQWlCLEVBQUMsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUU1RCxTQUFTO1FBQ1QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVqQyxJQUFJLENBQUM7WUFDRCxJQUFJLE9BQWUsQ0FBQztZQUNwQixJQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQXNCLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBRUQsRUFBRSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25FLE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzNGLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsU0FBUyxDQUNuQixVQUFzQixFQUN0QixZQUE2QixFQUM3QixRQUFvQixNQUFNO1FBRTFCLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLGdDQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsWUFBWSxDQUFDLFVBQVUsT0FBTyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBRTVGLFNBQVM7WUFDVCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV4RCxTQUFTO1lBQ1QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEQsWUFBWTtZQUNaLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztZQUNqRixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDNUIsQ0FBQztZQUVELGFBQWE7WUFDYixJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsT0FBTztvQkFDSCxPQUFPLEVBQUUsS0FBSztvQkFDZCxPQUFPLEVBQUUsUUFBUSxZQUFZLENBQUMsVUFBVSxhQUFhO29CQUNyRCxVQUFVLEVBQUUsSUFBQSxzQ0FBaUIsRUFBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQztpQkFDdkQsQ0FBQztZQUNOLENBQUM7WUFFRCxXQUFXO1lBQ1gsTUFBTSxXQUFXLEdBQVEsRUFBRSxDQUFDO1lBRTVCLGdCQUFnQjtZQUNoQixJQUFJLFVBQVUsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDNUIsc0JBQXNCO2dCQUN0QixXQUFXLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUM7WUFDbkQsQ0FBQztpQkFBTSxJQUFJLFVBQVUsS0FBSyxZQUFZLEVBQUUsQ0FBQztnQkFDckMsc0JBQXNCO2dCQUN0QixXQUFXLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUM7WUFDakQsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLDRDQUE0QztnQkFDNUMsV0FBVyxDQUFDLEdBQUcsR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDO1lBQzdDLENBQUM7WUFFRCxJQUFJLFlBQVksQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN2RSxXQUFXLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUM7WUFDL0MsQ0FBQztZQUVELFFBQVE7WUFDUixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFdBQVcsQ0FBQztZQUUxRCxTQUFTO1lBQ1QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTVDLE9BQU87Z0JBQ0gsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsT0FBTyxFQUFFLFlBQVksWUFBWSxDQUFDLFVBQVUsT0FBTyxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUNoRSxVQUFVLEVBQUUsSUFBQSxzQ0FBaUIsRUFBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDcEQsVUFBVSxFQUFFLFVBQVUsSUFBSSxTQUFTO2FBQ3RDLENBQUM7UUFDTixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsMENBQTBDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakUsT0FBTztnQkFDSCxPQUFPLEVBQUUsS0FBSztnQkFDZCxPQUFPLEVBQUUsU0FBUyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7YUFDN0UsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsWUFBWSxDQUN0QixVQUFzQixFQUN0QixVQUFrQixFQUNsQixRQUFvQixNQUFNO1FBRTFCLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLGdDQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsVUFBVSxTQUFTLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFFbkYsTUFBTSxVQUFVLEdBQUcsSUFBQSxzQ0FBaUIsRUFBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE9BQU87b0JBQ0gsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsT0FBTyxFQUFFLFNBQVM7b0JBQ2xCLFVBQVUsRUFBRSxVQUFVO2lCQUN6QixDQUFDO1lBQ04sQ0FBQztZQUVELFNBQVM7WUFDVCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV4RCxTQUFTO1lBQ1QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEQsWUFBWTtZQUNaLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztZQUNqRixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pELE9BQU87b0JBQ0gsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsT0FBTyxFQUFFLFFBQVEsVUFBVSxhQUFhO29CQUN4QyxVQUFVLEVBQUUsVUFBVTtpQkFDekIsQ0FBQztZQUNOLENBQUM7WUFFRCxRQUFRO1lBQ1IsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFdEMsU0FBUztZQUNULElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUU1QyxPQUFPO2dCQUNILE9BQU8sRUFBRSxJQUFJO2dCQUNiLE9BQU8sRUFBRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLFlBQVksVUFBVSxHQUFHO2dCQUNwRCxVQUFVLEVBQUUsVUFBVTtnQkFDdEIsVUFBVSxFQUFFLFVBQVUsSUFBSSxTQUFTO2FBQ3RDLENBQUM7UUFDTixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUsT0FBTztnQkFDSCxPQUFPLEVBQUUsS0FBSztnQkFDZCxPQUFPLEVBQUUsU0FBUyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7YUFDN0UsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQXNCLEVBQUUsVUFBa0IsRUFBRSxRQUFvQixNQUFNO1FBQzdGLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLGdDQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFlBQVksS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO1lBQ2pGLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxTQUFTLENBQUM7UUFDOUUsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0ksTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFzQixFQUFFLFFBQW9CLE1BQU07UUFDeEUsSUFBSSxDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsZ0NBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsWUFBWSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFFakYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN0QixPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25FLE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxPQUFlLElBQUk7UUFDdkQsT0FBTztZQUNILFVBQVUsRUFBRSxlQUFlO1lBQzNCLFNBQVMsRUFBRSxvQkFBb0IsSUFBSSxNQUFNO1NBQzVDLENBQUM7SUFDTixDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQTZCLEVBQUUsUUFBb0IsTUFBTTtRQUNuRixNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztRQUU3RCx1Q0FBdUM7UUFDdkMsTUFBTSxpQkFBaUIsR0FBaUIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVwRixLQUFLLE1BQU0sVUFBVSxJQUFJLGlCQUFpQixFQUFFLENBQUM7WUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9ELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsVUFBa0IsRUFBRSxRQUFvQixNQUFNO1FBQzdFLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO1FBRTdELE1BQU0saUJBQWlCLEdBQWlCLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFcEYsS0FBSyxNQUFNLFVBQVUsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDaEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsWUFBOEQ7UUFJNUYsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUM7UUFDM0MsT0FBTztZQUNILE1BQU0sRUFBRSxJQUFBLHVDQUFrQixFQUFDO2dCQUN2QixVQUFVLEVBQUUsWUFBWTtnQkFDeEIsWUFBWTtnQkFDWixTQUFTLEVBQUUsaUJBQWlCO2dCQUM1QixLQUFLLEVBQUUsS0FBSzthQUNmLENBQUM7WUFDRixNQUFNLEVBQUUsSUFBQSx1Q0FBa0IsRUFBQztnQkFDdkIsVUFBVSxFQUFFLFlBQVk7Z0JBQ3hCLFlBQVk7Z0JBQ1osU0FBUyxFQUFFLGlCQUFpQjtnQkFDNUIsS0FBSyxFQUFFLEtBQUs7YUFDZixDQUFDO1NBQ0wsQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxVQUFzQixFQUFFLFlBQTZCO1FBQ3JGLE1BQU0sTUFBTSxHQUFHLGdDQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFdkMsSUFBSSxNQUFNLENBQUMsWUFBWSxLQUFLLE1BQU0sRUFBRSxDQUFDO1lBQ2pDLE9BQU8sSUFBQSx1Q0FBa0IsRUFBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDM0UsQ0FBQzthQUFNLENBQUM7WUFDSixTQUFTO1lBQ1QsT0FBTyxJQUFBLHVDQUFrQixFQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzVDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQWtCLEVBQUUsUUFBb0IsTUFBTTtRQVF4RSxNQUFNLFVBQVUsR0FBaUIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXpHLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDeEMsSUFBSSxDQUFDO2dCQUNELE1BQU0sTUFBTSxHQUFHLGdDQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBRXZDLDhDQUE4QztnQkFDOUMsTUFBTSxZQUFZLEdBQUcsVUFBVSxLQUFLLFFBQVEsSUFBSSxVQUFVLEtBQUssVUFBVTtvQkFDcEQsVUFBVSxLQUFLLE1BQU0sSUFBSSxVQUFVLEtBQUssV0FBVyxDQUFDO2dCQUV6RSxNQUFNLFVBQVUsR0FBRyxJQUFBLHNDQUFpQixFQUFDLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQzVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFaEUsT0FBTztvQkFDSCxVQUFVO29CQUNWLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSTtvQkFDdkIsTUFBTSxFQUFFLE1BQU07b0JBQ2QsVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSztvQkFDbkIsWUFBWSxFQUFFLFlBQVk7aUJBQzdCLENBQUM7WUFDTixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLCtDQUErQyxVQUFVLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDbkYsTUFBTSxNQUFNLEdBQUcsZ0NBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxZQUFZLEdBQUcsVUFBVSxLQUFLLFFBQVEsSUFBSSxVQUFVLEtBQUssVUFBVTtvQkFDcEQsVUFBVSxLQUFLLE1BQU0sSUFBSSxVQUFVLEtBQUssV0FBVyxDQUFDO2dCQUN6RSxPQUFPO29CQUNILFVBQVU7b0JBQ1YsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJO29CQUN2QixNQUFNLEVBQUUsS0FBSztvQkFDYixVQUFVLEVBQUUsb0JBQW9CO29CQUNoQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7b0JBQ25CLFlBQVksRUFBRSxZQUFZO2lCQUM3QixDQUFDO1lBQ04sQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztDQUNKO0FBaFpELDRDQWdaQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTUNQ5a6i5oi356uv6YWN572u5paH5Lu2566h55CG5ZmoXG4gKiDotJ/otKPor7vlj5bjgIHlkIjlubbjgIHmt7vliqDjgIHliKDpmaTlkITkuKpBSee8lui+keWZqOeahE1DUOmFjee9rlxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBvcyBmcm9tICdvcyc7XG5pbXBvcnQgKiBhcyB0b21sIGZyb20gJ0BpYXJuYS90b21sJztcbmltcG9ydCB7XG4gICAgQ2xpZW50VHlwZSxcbiAgICBNQ1BTZXJ2ZXJDb25maWcsXG4gICAgTUNQX0NMSUVOVFMsXG4gICAgZ2V0Q29uZmlnRmlsZVBhdGgsXG4gICAgZ2VuZXJhdGVKU09OQ29uZmlnLFxuICAgIGdlbmVyYXRlVE9NTENvbmZpZyxcbiAgICBnZW5lcmF0ZUNMSUNvbW1hbmQsXG4gICAgQ0xJQ29tbWFuZENvbmZpZ1xufSBmcm9tICcuL21jcC1jbGllbnQtY29uZmlncyc7XG5cbnR5cGUgUGFuZWxTY29wZSA9ICd1c2VyJyB8ICdwcm9qZWN0JztcblxuZXhwb3J0IGludGVyZmFjZSBDb25maWdPcGVyYXRpb25SZXN1bHQge1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIGNvbmZpZ1BhdGg/OiBzdHJpbmc7XG4gICAgYmFja3VwUGF0aD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBNQ1DphY3nva7nrqHnkIblmahcbiAqL1xuZXhwb3J0IGNsYXNzIE1DUENvbmZpZ01hbmFnZXIge1xuICAgIC8qKlxuICAgICAqIOajgOafpemFjee9ruaWh+S7tuaYr+WQpuWtmOWcqFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgY29uZmlnRmlsZUV4aXN0cyhjbGllbnRUeXBlOiBDbGllbnRUeXBlLCBzY29wZTogUGFuZWxTY29wZSA9ICd1c2VyJyk6IGJvb2xlYW4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnUGF0aCA9IGdldENvbmZpZ0ZpbGVQYXRoKGNsaWVudFR5cGUsIHsgc2NvcGUgfSk7XG4gICAgICAgICAgICByZXR1cm4gZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOivu+WPlueOsOaciemFjee9ruaWh+S7tlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZENvbmZpZyhjbGllbnRUeXBlOiBDbGllbnRUeXBlLCBzY29wZTogUGFuZWxTY29wZSA9ICd1c2VyJyk6IGFueSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1DUF9DTElFTlRTW2NsaWVudFR5cGVdO1xuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gZ2V0Q29uZmlnRmlsZVBhdGgoY2xpZW50VHlwZSwgeyBzY29wZSB9KTtcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgICAgIC8vIOmFjee9ruaWh+S7tuS4jeWtmOWcqO+8jOi/lOWbnuepuumFjee9rlxuICAgICAgICAgICAgaWYgKGNsaWVudC5jb25maWdGb3JtYXQgPT09ICdqc29uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IG1jcFNlcnZlcnM6IHt9IH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IG1jcF9zZXJ2ZXJzOiB7fSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgICAgIGlmIChjbGllbnQuY29uZmlnRm9ybWF0ID09PSAnanNvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShjb250ZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvbWwucGFyc2UoY29udGVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbTUNQQ29uZmlnTWFuYWdlcl0gRmFpbGVkIHRvIHJlYWQgY29uZmlnIGZvciAke2NsaWVudFR5cGV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5peg5rOV6K+75Y+W6YWN572u5paH5Lu2OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWkh+S7veeOsOaciemFjee9ruaWh+S7tlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYmFja3VwQ29uZmlnKGNsaWVudFR5cGU6IENsaWVudFR5cGUsIHNjb3BlOiBQYW5lbFNjb3BlID0gJ3VzZXInKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBnZXRDb25maWdGaWxlUGF0aChjbGllbnRUeXBlLCB7IHNjb3BlIH0pO1xuXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcbiAgICAgICAgICAgIGNvbnN0IGJhY2t1cFBhdGggPSBgJHtjb25maWdQYXRofS5iYWNrdXAtJHt0aW1lc3RhbXB9YDtcbiAgICAgICAgICAgIGZzLmNvcHlGaWxlU3luYyhjb25maWdQYXRoLCBiYWNrdXBQYXRoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTUNQQ29uZmlnTWFuYWdlcl0gQ29uZmlnIGJhY2tlZCB1cCB0bzogJHtiYWNrdXBQYXRofWApO1xuICAgICAgICAgICAgcmV0dXJuIGJhY2t1cFBhdGg7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbTUNQQ29uZmlnTWFuYWdlcl0gRmFpbGVkIHRvIGJhY2t1cCBjb25maWc6YCwgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnoa7kv53phY3nva7mlofku7bnm67lvZXlrZjlnKhcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBlbnN1cmVDb25maWdEaXIoY29uZmlnUGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShjb25maWdQYXRoKTtcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNQ1BDb25maWdNYW5hZ2VyXSBDcmVhdGVkIGNvbmZpZyBkaXJlY3Rvcnk6ICR7ZGlyfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YaZ5YWl6YWN572u5paH5Lu2XG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgd3JpdGVDb25maWcoY2xpZW50VHlwZTogQ2xpZW50VHlwZSwgY29uZmlnOiBhbnksIHNjb3BlOiBQYW5lbFNjb3BlID0gJ3VzZXInKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1DUF9DTElFTlRTW2NsaWVudFR5cGVdO1xuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gZ2V0Q29uZmlnRmlsZVBhdGgoY2xpZW50VHlwZSwgeyBzY29wZSB9KTtcblxuICAgICAgICAvLyDnoa7kv53nm67lvZXlrZjlnKhcbiAgICAgICAgdGhpcy5lbnN1cmVDb25maWdEaXIoY29uZmlnUGF0aCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBjb250ZW50OiBzdHJpbmc7XG4gICAgICAgICAgICBpZiAoY2xpZW50LmNvbmZpZ0Zvcm1hdCA9PT0gJ2pzb24nKSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0b21sLnN0cmluZ2lmeShjb25maWcgYXMgdG9tbC5Kc29uTWFwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhjb25maWdQYXRoLCBjb250ZW50LCAndXRmLTgnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTUNQQ29uZmlnTWFuYWdlcl0gQ29uZmlnIHdyaXR0ZW4gdG86ICR7Y29uZmlnUGF0aH1gKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtNQ1BDb25maWdNYW5hZ2VyXSBGYWlsZWQgdG8gd3JpdGUgY29uZmlnOmAsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5peg5rOV5YaZ5YWl6YWN572u5paH5Lu2OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa3u+WKoE1DUOacjeWKoeWZqOmFjee9rlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYWRkU2VydmVyKFxuICAgICAgICBjbGllbnRUeXBlOiBDbGllbnRUeXBlLFxuICAgICAgICBzZXJ2ZXJDb25maWc6IE1DUFNlcnZlckNvbmZpZyxcbiAgICAgICAgc2NvcGU6IFBhbmVsU2NvcGUgPSAndXNlcidcbiAgICApOiBDb25maWdPcGVyYXRpb25SZXN1bHQge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY2xpZW50ID0gTUNQX0NMSUVOVFNbY2xpZW50VHlwZV07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW01DUENvbmZpZ01hbmFnZXJdIEFkZGluZyBzZXJ2ZXIgJHtzZXJ2ZXJDb25maWcuc2VydmVyTmFtZX0gdG8gJHtjbGllbnRUeXBlfWApO1xuXG4gICAgICAgICAgICAvLyDlpIfku73njrDmnInphY3nva5cbiAgICAgICAgICAgIGNvbnN0IGJhY2t1cFBhdGggPSB0aGlzLmJhY2t1cENvbmZpZyhjbGllbnRUeXBlLCBzY29wZSk7XG5cbiAgICAgICAgICAgIC8vIOivu+WPlueOsOaciemFjee9rlxuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5yZWFkQ29uZmlnKGNsaWVudFR5cGUsIHNjb3BlKTtcblxuICAgICAgICAgICAgLy8g6I635Y+W5pyN5Yqh5Zmo6YWN572u5a+56LGhXG4gICAgICAgICAgICBjb25zdCBzZXJ2ZXJzS2V5ID0gY2xpZW50LmNvbmZpZ0Zvcm1hdCA9PT0gJ2pzb24nID8gJ21jcFNlcnZlcnMnIDogJ21jcF9zZXJ2ZXJzJztcbiAgICAgICAgICAgIGlmICghY29uZmlnW3NlcnZlcnNLZXldKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnW3NlcnZlcnNLZXldID0ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOajgOafpeacjeWKoeWZqOaYr+WQpuW3suWtmOWcqFxuICAgICAgICAgICAgaWYgKGNvbmZpZ1tzZXJ2ZXJzS2V5XVtzZXJ2ZXJDb25maWcuc2VydmVyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOacjeWKoeWZqCBcIiR7c2VydmVyQ29uZmlnLnNlcnZlck5hbWV9XCIg5bey5a2Y5Zyo5LqO6YWN572u5paH5Lu25LitYCxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnUGF0aDogZ2V0Q29uZmlnRmlsZVBhdGgoY2xpZW50VHlwZSwgeyBzY29wZSB9KVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOeUn+aIkOacjeWKoeWZqOmFjee9rumhuVxuICAgICAgICAgICAgY29uc3Qgc2VydmVyRW50cnk6IGFueSA9IHt9O1xuXG4gICAgICAgICAgICAvLyDkuI3lkIzlrqLmiLfnq6/kvb/nlKjkuI3lkIznmoTlrZfmrrXlkI1cbiAgICAgICAgICAgIGlmIChjbGllbnRUeXBlID09PSAnd2luZHN1cmYnKSB7XG4gICAgICAgICAgICAgICAgLy8gV2luZHN1cmbkvb/nlKhzZXJ2ZXJVcmxcbiAgICAgICAgICAgICAgICBzZXJ2ZXJFbnRyeS5zZXJ2ZXJVcmwgPSBzZXJ2ZXJDb25maWcuc2VydmVyVXJsO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGllbnRUeXBlID09PSAnZ2VtaW5pLWNsaScpIHtcbiAgICAgICAgICAgICAgICAvLyBHZW1pbmkgQ0xJ5L2/55SoaHR0cFVybFxuICAgICAgICAgICAgICAgIHNlcnZlckVudHJ5Lmh0dHBVcmwgPSBzZXJ2ZXJDb25maWcuc2VydmVyVXJsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDdXJzb3IsIFRyYWUsIENsYXVkZSBDTEksIENvZGV4IENMSemDveS9v+eUqHVybFxuICAgICAgICAgICAgICAgIHNlcnZlckVudHJ5LnVybCA9IHNlcnZlckNvbmZpZy5zZXJ2ZXJVcmw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZXJ2ZXJDb25maWcuaGVhZGVycyAmJiBPYmplY3Qua2V5cyhzZXJ2ZXJDb25maWcuaGVhZGVycykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHNlcnZlckVudHJ5LmhlYWRlcnMgPSBzZXJ2ZXJDb25maWcuaGVhZGVycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5re75Yqg5Yiw6YWN572uXG4gICAgICAgICAgICBjb25maWdbc2VydmVyc0tleV1bc2VydmVyQ29uZmlnLnNlcnZlck5hbWVdID0gc2VydmVyRW50cnk7XG5cbiAgICAgICAgICAgIC8vIOWGmeWFpemFjee9ruaWh+S7tlxuICAgICAgICAgICAgdGhpcy53cml0ZUNvbmZpZyhjbGllbnRUeXBlLCBjb25maWcsIHNjb3BlKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDmiJDlip/mt7vliqDmnI3liqHlmaggXCIke3NlcnZlckNvbmZpZy5zZXJ2ZXJOYW1lfVwiIOWIsCAke2NsaWVudC5uYW1lfWAsXG4gICAgICAgICAgICAgICAgY29uZmlnUGF0aDogZ2V0Q29uZmlnRmlsZVBhdGgoY2xpZW50VHlwZSwgeyBzY29wZSB9KSxcbiAgICAgICAgICAgICAgICBiYWNrdXBQYXRoOiBiYWNrdXBQYXRoIHx8IHVuZGVmaW5lZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtNQ1BDb25maWdNYW5hZ2VyXSBGYWlsZWQgdG8gYWRkIHNlcnZlcjpgLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDmt7vliqDlpLHotKU6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliKDpmaRNQ1DmnI3liqHlmajphY3nva5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIHJlbW92ZVNlcnZlcihcbiAgICAgICAgY2xpZW50VHlwZTogQ2xpZW50VHlwZSxcbiAgICAgICAgc2VydmVyTmFtZTogc3RyaW5nLFxuICAgICAgICBzY29wZTogUGFuZWxTY29wZSA9ICd1c2VyJ1xuICAgICk6IENvbmZpZ09wZXJhdGlvblJlc3VsdCB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjbGllbnQgPSBNQ1BfQ0xJRU5UU1tjbGllbnRUeXBlXTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTUNQQ29uZmlnTWFuYWdlcl0gUmVtb3Zpbmcgc2VydmVyICR7c2VydmVyTmFtZX0gZnJvbSAke2NsaWVudFR5cGV9YCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBnZXRDb25maWdGaWxlUGF0aChjbGllbnRUeXBlLCB7IHNjb3BlIH0pO1xuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGNvbmZpZ1BhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDphY3nva7mlofku7bkuI3lrZjlnKhgLFxuICAgICAgICAgICAgICAgICAgICBjb25maWdQYXRoOiBjb25maWdQYXRoXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5aSH5Lu9546w5pyJ6YWN572uXG4gICAgICAgICAgICBjb25zdCBiYWNrdXBQYXRoID0gdGhpcy5iYWNrdXBDb25maWcoY2xpZW50VHlwZSwgc2NvcGUpO1xuXG4gICAgICAgICAgICAvLyDor7vlj5bnjrDmnInphY3nva5cbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMucmVhZENvbmZpZyhjbGllbnRUeXBlLCBzY29wZSk7XG5cbiAgICAgICAgICAgIC8vIOiOt+WPluacjeWKoeWZqOmFjee9ruWvueixoVxuICAgICAgICAgICAgY29uc3Qgc2VydmVyc0tleSA9IGNsaWVudC5jb25maWdGb3JtYXQgPT09ICdqc29uJyA/ICdtY3BTZXJ2ZXJzJyA6ICdtY3Bfc2VydmVycyc7XG4gICAgICAgICAgICBpZiAoIWNvbmZpZ1tzZXJ2ZXJzS2V5XSB8fCAhY29uZmlnW3NlcnZlcnNLZXldW3NlcnZlck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDmnI3liqHlmaggXCIke3NlcnZlck5hbWV9XCIg5LiN5a2Y5Zyo5LqO6YWN572u5paH5Lu25LitYCxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnUGF0aDogY29uZmlnUGF0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWIoOmZpOacjeWKoeWZqFxuICAgICAgICAgICAgZGVsZXRlIGNvbmZpZ1tzZXJ2ZXJzS2V5XVtzZXJ2ZXJOYW1lXTtcblxuICAgICAgICAgICAgLy8g5YaZ5YWl6YWN572u5paH5Lu2XG4gICAgICAgICAgICB0aGlzLndyaXRlQ29uZmlnKGNsaWVudFR5cGUsIGNvbmZpZywgc2NvcGUpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOaIkOWKn+S7jiAke2NsaWVudC5uYW1lfSDkuK3liKDpmaTmnI3liqHlmaggXCIke3NlcnZlck5hbWV9XCJgLFxuICAgICAgICAgICAgICAgIGNvbmZpZ1BhdGg6IGNvbmZpZ1BhdGgsXG4gICAgICAgICAgICAgICAgYmFja3VwUGF0aDogYmFja3VwUGF0aCB8fCB1bmRlZmluZWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbTUNQQ29uZmlnTWFuYWdlcl0gRmFpbGVkIHRvIHJlbW92ZSBzZXJ2ZXI6YCwgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBg5Yig6Zmk5aSx6LSlOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5pyN5Yqh5Zmo5piv5ZCm5a2Y5ZyoXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBzZXJ2ZXJFeGlzdHMoY2xpZW50VHlwZTogQ2xpZW50VHlwZSwgc2VydmVyTmFtZTogc3RyaW5nLCBzY29wZTogUGFuZWxTY29wZSA9ICd1c2VyJyk6IGJvb2xlYW4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY2xpZW50ID0gTUNQX0NMSUVOVFNbY2xpZW50VHlwZV07XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnJlYWRDb25maWcoY2xpZW50VHlwZSwgc2NvcGUpO1xuICAgICAgICAgICAgY29uc3Qgc2VydmVyc0tleSA9IGNsaWVudC5jb25maWdGb3JtYXQgPT09ICdqc29uJyA/ICdtY3BTZXJ2ZXJzJyA6ICdtY3Bfc2VydmVycyc7XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnW3NlcnZlcnNLZXldICYmIGNvbmZpZ1tzZXJ2ZXJzS2V5XVtzZXJ2ZXJOYW1lXSAhPT0gdW5kZWZpbmVkO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W6YWN572u5paH5Lu25Lit55qE5omA5pyJ5pyN5Yqh5Zmo5ZCN56ewXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBsaXN0U2VydmVycyhjbGllbnRUeXBlOiBDbGllbnRUeXBlLCBzY29wZTogUGFuZWxTY29wZSA9ICd1c2VyJyk6IHN0cmluZ1tdIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNsaWVudCA9IE1DUF9DTElFTlRTW2NsaWVudFR5cGVdO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5yZWFkQ29uZmlnKGNsaWVudFR5cGUsIHNjb3BlKTtcbiAgICAgICAgICAgIGNvbnN0IHNlcnZlcnNLZXkgPSBjbGllbnQuY29uZmlnRm9ybWF0ID09PSAnanNvbicgPyAnbWNwU2VydmVycycgOiAnbWNwX3NlcnZlcnMnO1xuXG4gICAgICAgICAgICBpZiAoIWNvbmZpZ1tzZXJ2ZXJzS2V5XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGNvbmZpZ1tzZXJ2ZXJzS2V5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbTUNQQ29uZmlnTWFuYWdlcl0gRmFpbGVkIHRvIGxpc3Qgc2VydmVyczpgLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnlJ/miJDlvZPliY1Db2NvcyBNQ1DmnI3liqHlmajnmoTphY3nva5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGdlbmVyYXRlQ29jb3NTZXJ2ZXJDb25maWcocG9ydDogbnVtYmVyID0gMzAwMCk6IE1DUFNlcnZlckNvbmZpZyB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXJ2ZXJOYW1lOiAnY29jb3MtY3JlYXRvcicsXG4gICAgICAgICAgICBzZXJ2ZXJVcmw6IGBodHRwOi8vMTI3LjAuMC4xOiR7cG9ydH0vbWNwYFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS4gOmUrua3u+WKoOWIsOaJgOacieaUr+aMgeeahOWuouaIt+err1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYWRkVG9BbGxDbGllbnRzKHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnLCBzY29wZTogUGFuZWxTY29wZSA9ICd1c2VyJyk6IE1hcDxDbGllbnRUeXBlLCBDb25maWdPcGVyYXRpb25SZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IG5ldyBNYXA8Q2xpZW50VHlwZSwgQ29uZmlnT3BlcmF0aW9uUmVzdWx0PigpO1xuXG4gICAgICAgIC8vIOa3u+WKoOWIsElERee8lui+keWZqOWSjENvZGV4IENMSe+8iENvZGV4IENMSeaUr+aMgeiHquWKqOmFjee9ru+8iVxuICAgICAgICBjb25zdCBhdXRvQ29uZmlnQ2xpZW50czogQ2xpZW50VHlwZVtdID0gWydjdXJzb3InLCAnd2luZHN1cmYnLCAndHJhZScsICdjb2RleC1jbGknXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNsaWVudFR5cGUgb2YgYXV0b0NvbmZpZ0NsaWVudHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuYWRkU2VydmVyKGNsaWVudFR5cGUsIHNlcnZlckNvbmZpZywgc2NvcGUpO1xuICAgICAgICAgICAgcmVzdWx0cy5zZXQoY2xpZW50VHlwZSwgcmVzdWx0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7juaJgOacieWuouaIt+err+WIoOmZpFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgcmVtb3ZlRnJvbUFsbENsaWVudHMoc2VydmVyTmFtZTogc3RyaW5nLCBzY29wZTogUGFuZWxTY29wZSA9ICd1c2VyJyk6IE1hcDxDbGllbnRUeXBlLCBDb25maWdPcGVyYXRpb25SZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IG5ldyBNYXA8Q2xpZW50VHlwZSwgQ29uZmlnT3BlcmF0aW9uUmVzdWx0PigpO1xuXG4gICAgICAgIGNvbnN0IGF1dG9Db25maWdDbGllbnRzOiBDbGllbnRUeXBlW10gPSBbJ2N1cnNvcicsICd3aW5kc3VyZicsICd0cmFlJywgJ2NvZGV4LWNsaSddO1xuXG4gICAgICAgIGZvciAoY29uc3QgY2xpZW50VHlwZSBvZiBhdXRvQ29uZmlnQ2xpZW50cykge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VydmVyRXhpc3RzKGNsaWVudFR5cGUsIHNlcnZlck5hbWUsIHNjb3BlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVtb3ZlU2VydmVyKGNsaWVudFR5cGUsIHNlcnZlck5hbWUsIHNjb3BlKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnNldChjbGllbnRUeXBlLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog55Sf5oiQQ0xJ5ZG95Luk77yI55So5LqO5pi+56S657uZ55So5oi377yM5LuF5omL5Yqo6YWN572u55qEQ0xJ77yJXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBnZW5lcmF0ZUNMSUNvbW1hbmRzKHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnICYgeyBzY29wZT86ICd1c2VyJyB8ICdwcm9qZWN0JyB9KToge1xuICAgICAgICBjbGF1ZGU6IHN0cmluZztcbiAgICAgICAgZ2VtaW5pOiBzdHJpbmc7XG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHNjb3BlID0gc2VydmVyQ29uZmlnLnNjb3BlIHx8ICd1c2VyJztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNsYXVkZTogZ2VuZXJhdGVDTElDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBjbGllbnRUeXBlOiAnY2xhdWRlLWNsaScsXG4gICAgICAgICAgICAgICAgc2VydmVyQ29uZmlnLFxuICAgICAgICAgICAgICAgIHRyYW5zcG9ydDogJ3N0cmVhbWFibGUtaHR0cCcsXG4gICAgICAgICAgICAgICAgc2NvcGU6IHNjb3BlXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGdlbWluaTogZ2VuZXJhdGVDTElDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBjbGllbnRUeXBlOiAnZ2VtaW5pLWNsaScsXG4gICAgICAgICAgICAgICAgc2VydmVyQ29uZmlnLFxuICAgICAgICAgICAgICAgIHRyYW5zcG9ydDogJ3N0cmVhbWFibGUtaHR0cCcsXG4gICAgICAgICAgICAgICAgc2NvcGU6IHNjb3BlXG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOeUn+aIkOaMh+WumuWuouaIt+err+eahOmFjee9ruWGheWuue+8iOeUqOS6juWkjeWItu+8iVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgZ2VuZXJhdGVDb25maWdDb250ZW50KGNsaWVudFR5cGU6IENsaWVudFR5cGUsIHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgY2xpZW50ID0gTUNQX0NMSUVOVFNbY2xpZW50VHlwZV07XG5cbiAgICAgICAgaWYgKGNsaWVudC5jb25maWdGb3JtYXQgPT09ICdqc29uJykge1xuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlSlNPTkNvbmZpZyhjbGllbnRUeXBlLCBzZXJ2ZXJDb25maWcsICdzdHJlYW1hYmxlLWh0dHAnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPTUzmoLzlvI9cbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZVRPTUxDb25maWcoc2VydmVyQ29uZmlnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPlumFjee9rueKtuaAgeaRmOimgVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgZ2V0Q29uZmlnU3RhdHVzKHNlcnZlck5hbWU6IHN0cmluZywgc2NvcGU6IFBhbmVsU2NvcGUgPSAndXNlcicpOiB7XG4gICAgICAgIGNsaWVudFR5cGU6IENsaWVudFR5cGU7XG4gICAgICAgIGNsaWVudE5hbWU6IHN0cmluZztcbiAgICAgICAgZXhpc3RzOiBib29sZWFuO1xuICAgICAgICBjb25maWdQYXRoOiBzdHJpbmc7XG4gICAgICAgIGlzSURFOiBib29sZWFuO1xuICAgICAgICBpc0F1dG9Db25maWc6IGJvb2xlYW47XG4gICAgfVtdIHtcbiAgICAgICAgY29uc3QgYWxsQ2xpZW50czogQ2xpZW50VHlwZVtdID0gWydjdXJzb3InLCAnd2luZHN1cmYnLCAndHJhZScsICdjb2RleC1jbGknLCAnY2xhdWRlLWNsaScsICdnZW1pbmktY2xpJ107XG5cbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGFsbENsaWVudHMubWFwKGNsaWVudFR5cGUgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGllbnQgPSBNQ1BfQ0xJRU5UU1tjbGllbnRUeXBlXTtcblxuICAgICAgICAgICAgICAgIC8vIOiHquWKqOmFjee9rueahOWuouaIt+errzogQ3Vyc29yLCBXaW5kc3VyZiwgVHJhZSwgQ29kZXggQ0xJXG4gICAgICAgICAgICAgICAgY29uc3QgaXNBdXRvQ29uZmlnID0gY2xpZW50VHlwZSA9PT0gJ2N1cnNvcicgfHwgY2xpZW50VHlwZSA9PT0gJ3dpbmRzdXJmJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFR5cGUgPT09ICd0cmFlJyB8fCBjbGllbnRUeXBlID09PSAnY29kZXgtY2xpJztcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBnZXRDb25maWdGaWxlUGF0aChjbGllbnRUeXBlLCB7IHNjb3BlIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0cyA9IHRoaXMuc2VydmVyRXhpc3RzKGNsaWVudFR5cGUsIHNlcnZlck5hbWUsIHNjb3BlKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGNsaWVudFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudE5hbWU6IGNsaWVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBleGlzdHM6IGV4aXN0cyxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnUGF0aDogY29uZmlnUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgaXNJREU6IGNsaWVudC5pc0lERSxcbiAgICAgICAgICAgICAgICAgICAgaXNBdXRvQ29uZmlnOiBpc0F1dG9Db25maWdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbTUNQQ29uZmlnTWFuYWdlcl0gRmFpbGVkIHRvIGdldCBzdGF0dXMgZm9yICR7Y2xpZW50VHlwZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsaWVudCA9IE1DUF9DTElFTlRTW2NsaWVudFR5cGVdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzQXV0b0NvbmZpZyA9IGNsaWVudFR5cGUgPT09ICdjdXJzb3InIHx8IGNsaWVudFR5cGUgPT09ICd3aW5kc3VyZicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGllbnRUeXBlID09PSAndHJhZScgfHwgY2xpZW50VHlwZSA9PT0gJ2NvZGV4LWNsaSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50TmFtZTogY2xpZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGV4aXN0czogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ1BhdGg6ICdFcnJvciBsb2FkaW5nIHBhdGgnLFxuICAgICAgICAgICAgICAgICAgICBpc0lERTogY2xpZW50LmlzSURFLFxuICAgICAgICAgICAgICAgICAgICBpc0F1dG9Db25maWc6IGlzQXV0b0NvbmZpZ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbn1cbiJdfQ==
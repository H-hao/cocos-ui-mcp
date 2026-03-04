/**
 * MCP客户端配置文件管理器
 * 负责读取、合并、添加、删除各个AI编辑器的MCP配置
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as toml from '@iarna/toml';
import {
    ClientType,
    MCPServerConfig,
    MCP_CLIENTS,
    getConfigFilePath,
    generateJSONConfig,
    generateTOMLConfig,
    generateCLICommand,
    CLICommandConfig
} from './mcp-client-configs';

type PanelScope = 'user' | 'project';

export interface ConfigOperationResult {
    success: boolean;
    message: string;
    configPath?: string;
    backupPath?: string;
}

/**
 * MCP配置管理器
 */
export class MCPConfigManager {
    /**
     * 检查配置文件是否存在
     */
    public static configFileExists(clientType: ClientType, scope: PanelScope = 'user'): boolean {
        try {
            const configPath = getConfigFilePath(clientType, { scope });
            return fs.existsSync(configPath);
        } catch (error) {
            return false;
        }
    }

    /**
     * 读取现有配置文件
     */
    public static readConfig(clientType: ClientType, scope: PanelScope = 'user'): any {
        const client = MCP_CLIENTS[clientType];
        const configPath = getConfigFilePath(clientType, { scope });

        if (!fs.existsSync(configPath)) {
            // 配置文件不存在，返回空配置
            if (client.configFormat === 'json') {
                return { mcpServers: {} };
            } else {
                return { mcp_servers: {} };
            }
        }

        try {
            const content = fs.readFileSync(configPath, 'utf-8');

            if (client.configFormat === 'json') {
                return JSON.parse(content);
            } else {
                return toml.parse(content);
            }
        } catch (error) {
            console.error(`[MCPConfigManager] Failed to read config for ${clientType}:`, error);
            throw new Error(`无法读取配置文件: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 备份现有配置文件
     */
    public static backupConfig(clientType: ClientType, scope: PanelScope = 'user'): string | null {
        const configPath = getConfigFilePath(clientType, { scope });

        if (!fs.existsSync(configPath)) {
            return null;
        }

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${configPath}.backup-${timestamp}`;
            fs.copyFileSync(configPath, backupPath);
            console.log(`[MCPConfigManager] Config backed up to: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error(`[MCPConfigManager] Failed to backup config:`, error);
            return null;
        }
    }

    /**
     * 确保配置文件目录存在
     */
    private static ensureConfigDir(configPath: string): void {
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[MCPConfigManager] Created config directory: ${dir}`);
        }
    }

    /**
     * 写入配置文件
     */
    private static writeConfig(clientType: ClientType, config: any, scope: PanelScope = 'user'): void {
        const client = MCP_CLIENTS[clientType];
        const configPath = getConfigFilePath(clientType, { scope });

        // 确保目录存在
        this.ensureConfigDir(configPath);

        try {
            let content: string;
            if (client.configFormat === 'json') {
                content = JSON.stringify(config, null, 2);
            } else {
                content = toml.stringify(config as toml.JsonMap);
            }

            fs.writeFileSync(configPath, content, 'utf-8');
            console.log(`[MCPConfigManager] Config written to: ${configPath}`);
        } catch (error) {
            console.error(`[MCPConfigManager] Failed to write config:`, error);
            throw new Error(`无法写入配置文件: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 添加MCP服务器配置
     */
    public static addServer(
        clientType: ClientType,
        serverConfig: MCPServerConfig,
        scope: PanelScope = 'user'
    ): ConfigOperationResult {
        try {
            const client = MCP_CLIENTS[clientType];
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
                    configPath: getConfigFilePath(clientType, { scope })
                };
            }

            // 生成服务器配置项
            const serverEntry: any = {};

            // 不同客户端使用不同的字段名
            if (clientType === 'windsurf') {
                // Windsurf使用serverUrl
                serverEntry.serverUrl = serverConfig.serverUrl;
            } else if (clientType === 'gemini-cli') {
                // Gemini CLI使用httpUrl
                serverEntry.httpUrl = serverConfig.serverUrl;
            } else {
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
                configPath: getConfigFilePath(clientType, { scope }),
                backupPath: backupPath || undefined
            };
        } catch (error) {
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
    public static removeServer(
        clientType: ClientType,
        serverName: string,
        scope: PanelScope = 'user'
    ): ConfigOperationResult {
        try {
            const client = MCP_CLIENTS[clientType];
            console.log(`[MCPConfigManager] Removing server ${serverName} from ${clientType}`);

            const configPath = getConfigFilePath(clientType, { scope });
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
        } catch (error) {
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
    public static serverExists(clientType: ClientType, serverName: string, scope: PanelScope = 'user'): boolean {
        try {
            const client = MCP_CLIENTS[clientType];
            const config = this.readConfig(clientType, scope);
            const serversKey = client.configFormat === 'json' ? 'mcpServers' : 'mcp_servers';
            return config[serversKey] && config[serversKey][serverName] !== undefined;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取配置文件中的所有服务器名称
     */
    public static listServers(clientType: ClientType, scope: PanelScope = 'user'): string[] {
        try {
            const client = MCP_CLIENTS[clientType];
            const config = this.readConfig(clientType, scope);
            const serversKey = client.configFormat === 'json' ? 'mcpServers' : 'mcp_servers';

            if (!config[serversKey]) {
                return [];
            }

            return Object.keys(config[serversKey]);
        } catch (error) {
            console.error(`[MCPConfigManager] Failed to list servers:`, error);
            return [];
        }
    }

    /**
     * 生成当前Cocos MCP服务器的配置
     */
    public static generateCocosServerConfig(port: number = 3000): MCPServerConfig {
        return {
            serverName: 'cocos-creator',
            serverUrl: `http://127.0.0.1:${port}/mcp`
        };
    }

    /**
     * 一键添加到所有支持的客户端
     */
    public static addToAllClients(serverConfig: MCPServerConfig, scope: PanelScope = 'user'): Map<ClientType, ConfigOperationResult> {
        const results = new Map<ClientType, ConfigOperationResult>();

        // 添加到IDE编辑器和Codex CLI（Codex CLI支持自动配置）
        const autoConfigClients: ClientType[] = ['cursor', 'windsurf', 'trae', 'codex-cli'];

        for (const clientType of autoConfigClients) {
            const result = this.addServer(clientType, serverConfig, scope);
            results.set(clientType, result);
        }

        return results;
    }

    /**
     * 从所有客户端删除
     */
    public static removeFromAllClients(serverName: string, scope: PanelScope = 'user'): Map<ClientType, ConfigOperationResult> {
        const results = new Map<ClientType, ConfigOperationResult>();

        const autoConfigClients: ClientType[] = ['cursor', 'windsurf', 'trae', 'codex-cli'];

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
    public static generateCLICommands(serverConfig: MCPServerConfig & { scope?: 'user' | 'project' }): {
        claude: string;
        gemini: string;
    } {
        const scope = serverConfig.scope || 'user';
        return {
            claude: generateCLICommand({
                clientType: 'claude-cli',
                serverConfig,
                transport: 'streamable-http',
                scope: scope
            }),
            gemini: generateCLICommand({
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
    public static generateConfigContent(clientType: ClientType, serverConfig: MCPServerConfig): string {
        const client = MCP_CLIENTS[clientType];

        if (client.configFormat === 'json') {
            return generateJSONConfig(clientType, serverConfig, 'streamable-http');
        } else {
            // TOML格式
            return generateTOMLConfig(serverConfig);
        }
    }

    /**
     * 获取配置状态摘要
     */
    public static getConfigStatus(serverName: string, scope: PanelScope = 'user'): {
        clientType: ClientType;
        clientName: string;
        exists: boolean;
        configPath: string;
        isIDE: boolean;
        isAutoConfig: boolean;
    }[] {
        const allClients: ClientType[] = ['cursor', 'windsurf', 'trae', 'codex-cli', 'claude-cli', 'gemini-cli'];

        const results = allClients.map(clientType => {
            try {
                const client = MCP_CLIENTS[clientType];

                // 自动配置的客户端: Cursor, Windsurf, Trae, Codex CLI
                const isAutoConfig = clientType === 'cursor' || clientType === 'windsurf' ||
                                     clientType === 'trae' || clientType === 'codex-cli';

                const configPath = getConfigFilePath(clientType, { scope });
                const exists = this.serverExists(clientType, serverName, scope);

                return {
                    clientType,
                    clientName: client.name,
                    exists: exists,
                    configPath: configPath,
                    isIDE: client.isIDE,
                    isAutoConfig: isAutoConfig
                };
            } catch (error) {
                console.error(`[MCPConfigManager] Failed to get status for ${clientType}:`, error);
                const client = MCP_CLIENTS[clientType];
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

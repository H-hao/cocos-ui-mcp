import { join, sep } from 'path';
import { MCPServer } from './mcp-server';
import { readSettings, saveSettings } from './settings';
import { MCPServerSettings } from './types';
import { ToolManager } from './tools/tool-manager';
import { MCPConfigManager } from './mcp-config-manager';
import { ClientType, MCP_CLIENTS, MCPServerConfig } from './mcp-client-configs';

type IncomingSettings = Partial<MCPServerSettings> & {
    debugLog?: boolean;
};

const SERVER_MODULE_FILENAME = 'mcp-server.js';
const TOOLS_DIRNAME = 'tools';

let MCPServerCtor: typeof MCPServer = MCPServer;
let mcpServer: MCPServer | null = null;
let toolManager: ToolManager;

function normalizeSettings(input: IncomingSettings): MCPServerSettings {
    const baseSettings = readSettings();
    const { debugLog, ...partialSettings } = input || {};
    const enableDebugLog = typeof partialSettings.enableDebugLog === 'boolean'
        ? partialSettings.enableDebugLog
        : typeof debugLog === 'boolean'
            ? debugLog
            : baseSettings.enableDebugLog;

    return {
        ...baseSettings,
        ...partialSettings,
        enableDebugLog,
        allowedOrigins: Array.isArray(partialSettings.allowedOrigins)
            ? partialSettings.allowedOrigins
            : baseSettings.allowedOrigins,
    };
}

function getCurrentSettings(): MCPServerSettings {
    return mcpServer ? mcpServer.getSettings() : readSettings();
}

function syncEnabledTools(server: MCPServer): void {
    if (!toolManager) {
        return;
    }
    const enabledTools = toolManager.getEnabledTools();
    server.updateEnabledTools(enabledTools);
}

function createServerInstance(settings: MCPServerSettings): MCPServer {
    const server = new MCPServerCtor(settings);
    syncEnabledTools(server);
    return server;
}

async function recreateServer(settings: MCPServerSettings, shouldStart: boolean): Promise<void> {
    if (mcpServer) {
        mcpServer.stop();
    }
    mcpServer = createServerInstance(settings);
    if (shouldStart) {
        await mcpServer.start();
    }
}

function clearServerModuleCache(): void {
    const serverModulePath = join(__dirname, SERVER_MODULE_FILENAME);
    const toolsDirPath = join(__dirname, TOOLS_DIRNAME);
    const normalizedToolsDirPath = `${toolsDirPath}${sep}`;

    for (const modulePath of Object.keys(require.cache)) {
        if (modulePath === serverModulePath || modulePath.startsWith(normalizedToolsDirPath)) {
            delete require.cache[modulePath];
        }
    }
}

function reloadServerConstructorFromDist(): void {
    const serverModulePath = join(__dirname, SERVER_MODULE_FILENAME);
    clearServerModuleCache();

    const loadedModule = require(serverModulePath) as { MCPServer?: typeof MCPServer };
    if (!loadedModule || typeof loadedModule.MCPServer !== 'function') {
        throw new Error(`无法从 ${serverModulePath} 加载 MCPServer`);
    }
    MCPServerCtor = loadedModule.MCPServer;
}

/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en Open the MCP server panel
     * @zh 打开 MCP 服务器面板
     */
    openPanel() {
        Editor.Panel.open('ben-cocos-mcp');
    },

    /**
     * @en Open tool manager panel
     * @zh 打开工具管理面板
     */
    openToolManager() {
        // 当前项目仅保留主面板，工具管理在主面板 Tab 内。
        Editor.Panel.open('ben-cocos-mcp');
        return { success: true };
    },



    /**
     * @en Start the MCP server
     * @zh 启动 MCP 服务器
     */
    async startServer() {
        if (!mcpServer) {
            const settings = normalizeSettings(readSettings());
            mcpServer = createServerInstance(settings);
        }
        syncEnabledTools(mcpServer);
        await mcpServer.start();
    },

    /**
     * @en Stop the MCP server
     * @zh 停止 MCP 服务器
     */
    async stopServer() {
        if (mcpServer) {
            mcpServer.stop();
        } else {
            console.warn('[MCP插件] mcpServer 未初始化');
        }
    },

    /**
     * @en Get server status
     * @zh 获取服务器状态
     */
    getServerStatus() {
        const status = mcpServer ? mcpServer.getStatus() : { running: false, port: 0, clients: 0 };
        const settings = getCurrentSettings();
        return {
            ...status,
            settings: settings
        };
    },

    /**
     * @en Update server settings
     * @zh 更新服务器设置
     */
    async updateSettings(settings: IncomingSettings) {
        const normalizedSettings = normalizeSettings(settings);
        const shouldKeepRunning = mcpServer ? mcpServer.getStatus().running : false;
        saveSettings(normalizedSettings);
        await recreateServer(normalizedSettings, shouldKeepRunning);
        return {
            success: true,
            running: shouldKeepRunning,
            settings: normalizedSettings,
        };
    },

    /**
     * @en Restart server with latest dist/mcp-server.js
     * @zh 使用最新 dist/mcp-server.js 热重启服务器
     */
    async restartServerFromDist() {
        const previousCtor = MCPServerCtor;
        const previousSettings = normalizeSettings(getCurrentSettings());
        const previousRunningState = mcpServer ? mcpServer.getStatus().running : false;

        try {
            reloadServerConstructorFromDist();
            await recreateServer(previousSettings, true);
            return {
                success: true,
                running: true,
            };
        } catch (error: any) {
            console.error('[Main] Failed to restart server from dist:', error);
            MCPServerCtor = previousCtor;

            try {
                await recreateServer(previousSettings, previousRunningState);
            } catch (restoreError) {
                console.error('[Main] Failed to restore previous server state:', restoreError);
            }

            throw new Error(`从 dist 热重启失败: ${error.message}`);
        }
    },

    /**
     * @en Get tools list
     * @zh 获取工具列表
     */
    getToolsList() {
        return mcpServer ? mcpServer.getAvailableTools() : [];
    },

    getFilteredToolsList() {
        if (!mcpServer) return [];
        
        // 获取当前启用的工具
        const enabledTools = toolManager.getEnabledTools();
        
        // 更新MCP服务器的启用工具列表
        mcpServer.updateEnabledTools(enabledTools);
        
        return mcpServer.getFilteredTools(enabledTools);
    },
    /**
     * @en Get server settings
     * @zh 获取服务器设置
     */
    async getServerSettings() {
        return getCurrentSettings();
    },

    /**
     * @en Get server settings (alternative method)
     * @zh 获取服务器设置（替代方法）
     */
    async getSettings() {
        return getCurrentSettings();
    },

    // 工具管理器相关方法
    async getToolManagerState() {
        return toolManager.getToolManagerState();
    },

    async createToolConfiguration(name: string, description?: string) {
        try {
            const config = toolManager.createConfiguration(name, description);
            return { success: true, id: config.id, config };
        } catch (error: any) {
            throw new Error(`创建配置失败: ${error.message}`);
        }
    },

    async updateToolConfiguration(configId: string, updates: any) {
        try {
            return toolManager.updateConfiguration(configId, updates);
        } catch (error: any) {
            throw new Error(`更新配置失败: ${error.message}`);
        }
    },

    async deleteToolConfiguration(configId: string) {
        try {
            toolManager.deleteConfiguration(configId);
            return { success: true };
        } catch (error: any) {
            throw new Error(`删除配置失败: ${error.message}`);
        }
    },

    async setCurrentToolConfiguration(configId: string) {
        try {
            toolManager.setCurrentConfiguration(configId);
            return { success: true };
        } catch (error: any) {
            throw new Error(`设置当前配置失败: ${error.message}`);
        }
    },

    async updateToolStatus(category: string, toolName: string, enabled: boolean) {
        try {
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }
            
            toolManager.updateToolStatus(currentConfig.id, category, toolName, enabled);
            
            // 更新MCP服务器的工具列表
            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }
            
            return { success: true };
        } catch (error: any) {
            throw new Error(`更新工具状态失败: ${error.message}`);
        }
    },

    async updateToolStatusBatch(updates: any[]) {
        try {
            console.log(`[Main] updateToolStatusBatch called with updates count:`, updates ? updates.length : 0);
            
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }
            
            toolManager.updateToolStatusBatch(currentConfig.id, updates);
            
            // 更新MCP服务器的工具列表
            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }
            
            return { success: true };
        } catch (error: any) {
            throw new Error(`批量更新工具状态失败: ${error.message}`);
        }
    },

    async exportToolConfiguration(configId: string) {
        try {
            return { configJson: toolManager.exportConfiguration(configId) };
        } catch (error: any) {
            throw new Error(`导出配置失败: ${error.message}`);
        }
    },

    async importToolConfiguration(configJson: string) {
        try {
            return toolManager.importConfiguration(configJson);
        } catch (error: any) {
            throw new Error(`导入配置失败: ${error.message}`);
        }
    },

    async getEnabledTools() {
        return toolManager.getEnabledTools();
    },

    /**
     * @en Get configuration status for all AI clients
     * @zh 获取所有 AI 客户端配置状态
     */
    async getConfigStatus(serverName: string) {
        try {
            return {
                success: true,
                clients: MCPConfigManager.getConfigStatus(serverName),
            };
        } catch (error: any) {
            return {
                success: false,
                message: error?.message || String(error),
                clients: [],
            };
        }
    },

    /**
     * @en Generate CLI commands
     * @zh 生成 CLI 配置命令
     */
    async generateCLICommands(serverConfig: MCPServerConfig & { scope?: 'user' | 'project' }) {
        try {
            return {
                success: true,
                commands: MCPConfigManager.generateCLICommands(serverConfig),
            };
        } catch (error: any) {
            return {
                success: false,
                message: error?.message || String(error),
                commands: { claude: '', gemini: '' },
            };
        }
    },

    /**
     * @en Generate config content for one client
     * @zh 生成单客户端配置内容
     */
    async generateClientConfig(clientType: ClientType, serverConfig: MCPServerConfig) {
        try {
            return {
                success: true,
                content: MCPConfigManager.generateConfigContent(clientType, serverConfig),
            };
        } catch (error: any) {
            return {
                success: false,
                message: error?.message || String(error),
                content: '',
            };
        }
    },

    /**
     * @en Add MCP server to one client config
     * @zh 添加 MCP 服务到指定客户端配置
     */
    async addToClient(clientType: ClientType, serverConfig: MCPServerConfig) {
        return MCPConfigManager.addServer(clientType, serverConfig);
    },

    /**
     * @en Remove MCP server from one client config
     * @zh 从指定客户端移除 MCP 服务
     */
    async removeFromClient(clientType: ClientType, serverName: string) {
        return MCPConfigManager.removeServer(clientType, serverName);
    },

    /**
     * @en Add MCP server to all auto-config clients
     * @zh 添加 MCP 服务到全部可自动配置客户端
     */
    async addToAllClients(serverConfig: MCPServerConfig) {
        try {
            const results = MCPConfigManager.addToAllClients(serverConfig);
            const formattedResults: Record<string, string> = {};
            for (const [clientType, result] of results.entries()) {
                formattedResults[MCP_CLIENTS[clientType].name] = result.message;
            }
            return {
                success: true,
                results: formattedResults,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error?.message || String(error),
                results: {},
            };
        }
    },

    /**
     * @en Remove MCP server from all auto-config clients
     * @zh 从全部可自动配置客户端移除 MCP 服务
     */
    async removeFromAllClients(serverName: string) {
        try {
            const results = MCPConfigManager.removeFromAllClients(serverName);
            const formattedResults: Record<string, string> = {};
            for (const [clientType, result] of results.entries()) {
                formattedResults[MCP_CLIENTS[clientType].name] = result.message;
            }
            return {
                success: true,
                results: formattedResults,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error?.message || String(error),
                results: {},
            };
        }
    },

    /**
     * @en Open client config file in system default app
     * @zh 使用系统默认程序打开客户端配置文件
     */
    async openConfigFile(configPath: string) {
        try {
            let expandedPath = configPath;
            if (expandedPath.startsWith('~')) {
                const home = process.env.HOME || process.env.USERPROFILE;
                if (home) {
                    expandedPath = expandedPath.replace('~', home);
                }
            }

            if (process.platform === 'win32') {
                expandedPath = expandedPath.replace(/%([^%]+)%/g, (_: string, key: string) => process.env[key] || '');
            }

            const { exec } = require('child_process') as { exec: (cmd: string, cb?: (error: any) => void) => void };
            let command: string;
            if (process.platform === 'darwin') {
                command = `open "${expandedPath}"`;
            } else if (process.platform === 'win32') {
                command = `start "" "${expandedPath}"`;
            } else {
                command = `xdg-open "${expandedPath}"`;
            }

            exec(command, (error: any) => {
                if (error) {
                    console.error('[MCP插件] Failed to open config file:', error);
                }
            });

            return {
                success: true,
                message: `已打开配置文件: ${expandedPath}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `打开配置文件失败: ${error?.message || String(error)}`,
            };
        }
    },
};

/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
export function load() {
    console.log('Cocos MCP Server extension loaded');
    
    // 初始化工具管理器
    toolManager = new ToolManager();
    
    // 读取设置并创建服务实例
    const settings = normalizeSettings(readSettings());
    mcpServer = createServerInstance(settings);
    
    // 如果设置了自动启动，则启动服务器
    if (settings.autoStart) {
        mcpServer.start().catch(err => {
            console.error('Failed to auto-start MCP server:', err);
        });
    }
}

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
export function unload() {
    if (mcpServer) {
        mcpServer.stop();
        mcpServer = null;
    }
}

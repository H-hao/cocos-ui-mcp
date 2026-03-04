"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const path_1 = require("path");
const mcp_server_1 = require("./mcp-server");
const settings_1 = require("./settings");
const tool_manager_1 = require("./tools/tool-manager");
const mcp_config_manager_1 = require("./mcp-config-manager");
const mcp_client_configs_1 = require("./mcp-client-configs");
const SERVER_MODULE_FILENAME = 'mcp-server.js';
const TOOLS_DIRNAME = 'tools';
let MCPServerCtor = mcp_server_1.MCPServer;
let mcpServer = null;
let toolManager;
function normalizeSettings(input) {
    const baseSettings = (0, settings_1.readSettings)();
    const _a = input || {}, { debugLog } = _a, partialSettings = __rest(_a, ["debugLog"]);
    const enableDebugLog = typeof partialSettings.enableDebugLog === 'boolean'
        ? partialSettings.enableDebugLog
        : typeof debugLog === 'boolean'
            ? debugLog
            : baseSettings.enableDebugLog;
    return Object.assign(Object.assign(Object.assign({}, baseSettings), partialSettings), { enableDebugLog, allowedOrigins: Array.isArray(partialSettings.allowedOrigins)
            ? partialSettings.allowedOrigins
            : baseSettings.allowedOrigins });
}
function getCurrentSettings() {
    return mcpServer ? mcpServer.getSettings() : (0, settings_1.readSettings)();
}
function syncEnabledTools(server) {
    if (!toolManager) {
        return;
    }
    const enabledTools = toolManager.getEnabledTools();
    server.updateEnabledTools(enabledTools);
}
function createServerInstance(settings) {
    const server = new MCPServerCtor(settings);
    syncEnabledTools(server);
    return server;
}
async function recreateServer(settings, shouldStart) {
    if (mcpServer) {
        mcpServer.stop();
    }
    mcpServer = createServerInstance(settings);
    if (shouldStart) {
        await mcpServer.start();
    }
}
function clearServerModuleCache() {
    const serverModulePath = (0, path_1.join)(__dirname, SERVER_MODULE_FILENAME);
    const toolsDirPath = (0, path_1.join)(__dirname, TOOLS_DIRNAME);
    const normalizedToolsDirPath = `${toolsDirPath}${path_1.sep}`;
    for (const modulePath of Object.keys(require.cache)) {
        if (modulePath === serverModulePath || modulePath.startsWith(normalizedToolsDirPath)) {
            delete require.cache[modulePath];
        }
    }
}
function reloadServerConstructorFromDist() {
    const serverModulePath = (0, path_1.join)(__dirname, SERVER_MODULE_FILENAME);
    clearServerModuleCache();
    const loadedModule = require(serverModulePath);
    if (!loadedModule || typeof loadedModule.MCPServer !== 'function') {
        throw new Error(`无法从 ${serverModulePath} 加载 MCPServer`);
    }
    MCPServerCtor = loadedModule.MCPServer;
}
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
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
            const settings = normalizeSettings((0, settings_1.readSettings)());
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
        }
        else {
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
        return Object.assign(Object.assign({}, status), { settings: settings });
    },
    /**
     * @en Update server settings
     * @zh 更新服务器设置
     */
    async updateSettings(settings) {
        const normalizedSettings = normalizeSettings(settings);
        const shouldKeepRunning = mcpServer ? mcpServer.getStatus().running : false;
        (0, settings_1.saveSettings)(normalizedSettings);
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
        }
        catch (error) {
            console.error('[Main] Failed to restart server from dist:', error);
            MCPServerCtor = previousCtor;
            try {
                await recreateServer(previousSettings, previousRunningState);
            }
            catch (restoreError) {
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
        if (!mcpServer)
            return [];
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
    async createToolConfiguration(name, description) {
        try {
            const config = toolManager.createConfiguration(name, description);
            return { success: true, id: config.id, config };
        }
        catch (error) {
            throw new Error(`创建配置失败: ${error.message}`);
        }
    },
    async updateToolConfiguration(configId, updates) {
        try {
            return toolManager.updateConfiguration(configId, updates);
        }
        catch (error) {
            throw new Error(`更新配置失败: ${error.message}`);
        }
    },
    async deleteToolConfiguration(configId) {
        try {
            toolManager.deleteConfiguration(configId);
            return { success: true };
        }
        catch (error) {
            throw new Error(`删除配置失败: ${error.message}`);
        }
    },
    async setCurrentToolConfiguration(configId) {
        try {
            toolManager.setCurrentConfiguration(configId);
            return { success: true };
        }
        catch (error) {
            throw new Error(`设置当前配置失败: ${error.message}`);
        }
    },
    async updateToolStatus(category, toolName, enabled) {
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
        }
        catch (error) {
            throw new Error(`更新工具状态失败: ${error.message}`);
        }
    },
    async updateToolStatusBatch(updates) {
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
        }
        catch (error) {
            throw new Error(`批量更新工具状态失败: ${error.message}`);
        }
    },
    async exportToolConfiguration(configId) {
        try {
            return { configJson: toolManager.exportConfiguration(configId) };
        }
        catch (error) {
            throw new Error(`导出配置失败: ${error.message}`);
        }
    },
    async importToolConfiguration(configJson) {
        try {
            return toolManager.importConfiguration(configJson);
        }
        catch (error) {
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
    async getConfigStatus(serverName, scope = 'user') {
        try {
            return {
                success: true,
                clients: mcp_config_manager_1.MCPConfigManager.getConfigStatus(serverName, scope),
            };
        }
        catch (error) {
            return {
                success: false,
                message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                clients: [],
            };
        }
    },
    /**
     * @en Generate CLI commands
     * @zh 生成 CLI 配置命令
     */
    async generateCLICommands(serverConfig) {
        try {
            return {
                success: true,
                commands: mcp_config_manager_1.MCPConfigManager.generateCLICommands(serverConfig),
            };
        }
        catch (error) {
            return {
                success: false,
                message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                commands: { claude: '', gemini: '' },
            };
        }
    },
    /**
     * @en Generate config content for one client
     * @zh 生成单客户端配置内容
     */
    async generateClientConfig(clientType, serverConfig) {
        try {
            return {
                success: true,
                content: mcp_config_manager_1.MCPConfigManager.generateConfigContent(clientType, serverConfig),
            };
        }
        catch (error) {
            return {
                success: false,
                message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                content: '',
            };
        }
    },
    /**
     * @en Add MCP server to one client config
     * @zh 添加 MCP 服务到指定客户端配置
     */
    async addToClient(clientType, serverConfig) {
        return mcp_config_manager_1.MCPConfigManager.addServer(clientType, serverConfig, serverConfig.scope || 'user');
    },
    /**
     * @en Remove MCP server from one client config
     * @zh 从指定客户端移除 MCP 服务
     */
    async removeFromClient(clientType, serverName, scope = 'user') {
        return mcp_config_manager_1.MCPConfigManager.removeServer(clientType, serverName, scope);
    },
    /**
     * @en Add MCP server to all auto-config clients
     * @zh 添加 MCP 服务到全部可自动配置客户端
     */
    async addToAllClients(serverConfig) {
        try {
            const results = mcp_config_manager_1.MCPConfigManager.addToAllClients(serverConfig, serverConfig.scope || 'user');
            const formattedResults = {};
            for (const [clientType, result] of results.entries()) {
                formattedResults[mcp_client_configs_1.MCP_CLIENTS[clientType].name] = result.message;
            }
            return {
                success: true,
                results: formattedResults,
            };
        }
        catch (error) {
            return {
                success: false,
                message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                results: {},
            };
        }
    },
    /**
     * @en Remove MCP server from all auto-config clients
     * @zh 从全部可自动配置客户端移除 MCP 服务
     */
    async removeFromAllClients(serverName, scope = 'user') {
        try {
            const results = mcp_config_manager_1.MCPConfigManager.removeFromAllClients(serverName, scope);
            const formattedResults = {};
            for (const [clientType, result] of results.entries()) {
                formattedResults[mcp_client_configs_1.MCP_CLIENTS[clientType].name] = result.message;
            }
            return {
                success: true,
                results: formattedResults,
            };
        }
        catch (error) {
            return {
                success: false,
                message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                results: {},
            };
        }
    },
    /**
     * @en Open client config file in system default app
     * @zh 使用系统默认程序打开客户端配置文件
     */
    async openConfigFile(configPath) {
        try {
            let expandedPath = configPath;
            if (expandedPath.startsWith('~')) {
                const home = process.env.HOME || process.env.USERPROFILE;
                if (home) {
                    expandedPath = expandedPath.replace('~', home);
                }
            }
            if (process.platform === 'win32') {
                expandedPath = expandedPath.replace(/%([^%]+)%/g, (_, key) => process.env[key] || '');
            }
            const { exec } = require('child_process');
            let command;
            if (process.platform === 'darwin') {
                command = `open "${expandedPath}"`;
            }
            else if (process.platform === 'win32') {
                command = `start "" "${expandedPath}"`;
            }
            else {
                command = `xdg-open "${expandedPath}"`;
            }
            exec(command, (error) => {
                if (error) {
                    console.error('[MCP插件] Failed to open config file:', error);
                }
            });
            return {
                success: true,
                message: `已打开配置文件: ${expandedPath}`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `打开配置文件失败: ${(error === null || error === void 0 ? void 0 : error.message) || String(error)}`,
            };
        }
    },
};
/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
function load() {
    console.log('Cocos MCP Server extension loaded');
    // 初始化工具管理器
    toolManager = new tool_manager_1.ToolManager();
    // 读取设置并创建服务实例
    const settings = normalizeSettings((0, settings_1.readSettings)());
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
function unload() {
    if (mcpServer) {
        mcpServer.stop();
        mcpServer = null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBNmZBLG9CQWdCQztBQU1ELHdCQUtDO0FBeGhCRCwrQkFBaUM7QUFDakMsNkNBQXlDO0FBQ3pDLHlDQUF3RDtBQUV4RCx1REFBbUQ7QUFDbkQsNkRBQXdEO0FBQ3hELDZEQUFnRjtBQU1oRixNQUFNLHNCQUFzQixHQUFHLGVBQWUsQ0FBQztBQUMvQyxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUM7QUFFOUIsSUFBSSxhQUFhLEdBQXFCLHNCQUFTLENBQUM7QUFDaEQsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQztBQUN2QyxJQUFJLFdBQXdCLENBQUM7QUFFN0IsU0FBUyxpQkFBaUIsQ0FBQyxLQUF1QjtJQUM5QyxNQUFNLFlBQVksR0FBRyxJQUFBLHVCQUFZLEdBQUUsQ0FBQztJQUNwQyxNQUFNLEtBQW1DLEtBQUssSUFBSSxFQUFFLEVBQTlDLEVBQUUsUUFBUSxPQUFvQyxFQUEvQixlQUFlLGNBQTlCLFlBQWdDLENBQWMsQ0FBQztJQUNyRCxNQUFNLGNBQWMsR0FBRyxPQUFPLGVBQWUsQ0FBQyxjQUFjLEtBQUssU0FBUztRQUN0RSxDQUFDLENBQUMsZUFBZSxDQUFDLGNBQWM7UUFDaEMsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFNBQVM7WUFDM0IsQ0FBQyxDQUFDLFFBQVE7WUFDVixDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQztJQUV0QyxxREFDTyxZQUFZLEdBQ1osZUFBZSxLQUNsQixjQUFjLEVBQ2QsY0FBYyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQztZQUN6RCxDQUFDLENBQUMsZUFBZSxDQUFDLGNBQWM7WUFDaEMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxjQUFjLElBQ25DO0FBQ04sQ0FBQztBQUVELFNBQVMsa0JBQWtCO0lBQ3ZCLE9BQU8s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QyxtQ0FBbUMsQ0FBQyxDQUFDO0lBRWpELFdBQVc7SUFDWCxXQUFXLEdBQUcsSUFBSSwwQkFBVyxFQUFFLENBQUM7SUFFaEMsY0FBYztJQUNkLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLElBQUEsdUJBQVksR0FBRSxDQUFDLENBQUM7SUFDbkQsU0FBUyxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTNDLG1CQUFtQjtJQUNuQixJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQixTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLE1BQU07SUFDbEIsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUNaLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNqQixTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiwgc2VwIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBNQ1BTZXJ2ZXIgfSBmcm9tICcuL21jcC1zZXJ2ZXInO1xuaW1wb3J0IHsgcmVhZFNldHRpbmdzLCBzYXZlU2V0dGluZ3MgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IE1DUFNlcnZlclNldHRpbmdzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBUb29sTWFuYWdlciB9IGZyb20gJy4vdG9vbHMvdG9vbC1tYW5hZ2VyJztcbmltcG9ydCB7IE1DUENvbmZpZ01hbmFnZXIgfSBmcm9tICcuL21jcC1jb25maWctbWFuYWdlcic7XG5pbXBvcnQgeyBDbGllbnRUeXBlLCBNQ1BfQ0xJRU5UUywgTUNQU2VydmVyQ29uZmlnIH0gZnJvbSAnLi9tY3AtY2xpZW50LWNvbmZpZ3MnO1xuXG50eXBlIEluY29taW5nU2V0dGluZ3MgPSBQYXJ0aWFsPE1DUFNlcnZlclNldHRpbmdzPiAmIHtcbiAgICBkZWJ1Z0xvZz86IGJvb2xlYW47XG59O1xuXG5jb25zdCBTRVJWRVJfTU9EVUxFX0ZJTEVOQU1FID0gJ21jcC1zZXJ2ZXIuanMnO1xuY29uc3QgVE9PTFNfRElSTkFNRSA9ICd0b29scyc7XG5cbmxldCBNQ1BTZXJ2ZXJDdG9yOiB0eXBlb2YgTUNQU2VydmVyID0gTUNQU2VydmVyO1xubGV0IG1jcFNlcnZlcjogTUNQU2VydmVyIHwgbnVsbCA9IG51bGw7XG5sZXQgdG9vbE1hbmFnZXI6IFRvb2xNYW5hZ2VyO1xuXG5mdW5jdGlvbiBub3JtYWxpemVTZXR0aW5ncyhpbnB1dDogSW5jb21pbmdTZXR0aW5ncyk6IE1DUFNlcnZlclNldHRpbmdzIHtcbiAgICBjb25zdCBiYXNlU2V0dGluZ3MgPSByZWFkU2V0dGluZ3MoKTtcbiAgICBjb25zdCB7IGRlYnVnTG9nLCAuLi5wYXJ0aWFsU2V0dGluZ3MgfSA9IGlucHV0IHx8IHt9O1xuICAgIGNvbnN0IGVuYWJsZURlYnVnTG9nID0gdHlwZW9mIHBhcnRpYWxTZXR0aW5ncy5lbmFibGVEZWJ1Z0xvZyA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgID8gcGFydGlhbFNldHRpbmdzLmVuYWJsZURlYnVnTG9nXG4gICAgICAgIDogdHlwZW9mIGRlYnVnTG9nID09PSAnYm9vbGVhbidcbiAgICAgICAgICAgID8gZGVidWdMb2dcbiAgICAgICAgICAgIDogYmFzZVNldHRpbmdzLmVuYWJsZURlYnVnTG9nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLi4uYmFzZVNldHRpbmdzLFxuICAgICAgICAuLi5wYXJ0aWFsU2V0dGluZ3MsXG4gICAgICAgIGVuYWJsZURlYnVnTG9nLFxuICAgICAgICBhbGxvd2VkT3JpZ2luczogQXJyYXkuaXNBcnJheShwYXJ0aWFsU2V0dGluZ3MuYWxsb3dlZE9yaWdpbnMpXG4gICAgICAgICAgICA/IHBhcnRpYWxTZXR0aW5ncy5hbGxvd2VkT3JpZ2luc1xuICAgICAgICAgICAgOiBiYXNlU2V0dGluZ3MuYWxsb3dlZE9yaWdpbnMsXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudFNldHRpbmdzKCk6IE1DUFNlcnZlclNldHRpbmdzIHtcbiAgICByZXR1cm4gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldFNldHRpbmdzKCkgOiByZWFkU2V0dGluZ3MoKTtcbn1cblxuZnVuY3Rpb24gc3luY0VuYWJsZWRUb29scyhzZXJ2ZXI6IE1DUFNlcnZlcik6IHZvaWQge1xuICAgIGlmICghdG9vbE1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBlbmFibGVkVG9vbHMgPSB0b29sTWFuYWdlci5nZXRFbmFibGVkVG9vbHMoKTtcbiAgICBzZXJ2ZXIudXBkYXRlRW5hYmxlZFRvb2xzKGVuYWJsZWRUb29scyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlcnZlckluc3RhbmNlKHNldHRpbmdzOiBNQ1BTZXJ2ZXJTZXR0aW5ncyk6IE1DUFNlcnZlciB7XG4gICAgY29uc3Qgc2VydmVyID0gbmV3IE1DUFNlcnZlckN0b3Ioc2V0dGluZ3MpO1xuICAgIHN5bmNFbmFibGVkVG9vbHMoc2VydmVyKTtcbiAgICByZXR1cm4gc2VydmVyO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWNyZWF0ZVNlcnZlcihzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3MsIHNob3VsZFN0YXJ0OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICBtY3BTZXJ2ZXIuc3RvcCgpO1xuICAgIH1cbiAgICBtY3BTZXJ2ZXIgPSBjcmVhdGVTZXJ2ZXJJbnN0YW5jZShzZXR0aW5ncyk7XG4gICAgaWYgKHNob3VsZFN0YXJ0KSB7XG4gICAgICAgIGF3YWl0IG1jcFNlcnZlci5zdGFydCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJTZXJ2ZXJNb2R1bGVDYWNoZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZXJ2ZXJNb2R1bGVQYXRoID0gam9pbihfX2Rpcm5hbWUsIFNFUlZFUl9NT0RVTEVfRklMRU5BTUUpO1xuICAgIGNvbnN0IHRvb2xzRGlyUGF0aCA9IGpvaW4oX19kaXJuYW1lLCBUT09MU19ESVJOQU1FKTtcbiAgICBjb25zdCBub3JtYWxpemVkVG9vbHNEaXJQYXRoID0gYCR7dG9vbHNEaXJQYXRofSR7c2VwfWA7XG5cbiAgICBmb3IgKGNvbnN0IG1vZHVsZVBhdGggb2YgT2JqZWN0LmtleXMocmVxdWlyZS5jYWNoZSkpIHtcbiAgICAgICAgaWYgKG1vZHVsZVBhdGggPT09IHNlcnZlck1vZHVsZVBhdGggfHwgbW9kdWxlUGF0aC5zdGFydHNXaXRoKG5vcm1hbGl6ZWRUb29sc0RpclBhdGgpKSB7XG4gICAgICAgICAgICBkZWxldGUgcmVxdWlyZS5jYWNoZVttb2R1bGVQYXRoXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVsb2FkU2VydmVyQ29uc3RydWN0b3JGcm9tRGlzdCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZXJ2ZXJNb2R1bGVQYXRoID0gam9pbihfX2Rpcm5hbWUsIFNFUlZFUl9NT0RVTEVfRklMRU5BTUUpO1xuICAgIGNsZWFyU2VydmVyTW9kdWxlQ2FjaGUoKTtcblxuICAgIGNvbnN0IGxvYWRlZE1vZHVsZSA9IHJlcXVpcmUoc2VydmVyTW9kdWxlUGF0aCkgYXMgeyBNQ1BTZXJ2ZXI/OiB0eXBlb2YgTUNQU2VydmVyIH07XG4gICAgaWYgKCFsb2FkZWRNb2R1bGUgfHwgdHlwZW9mIGxvYWRlZE1vZHVsZS5NQ1BTZXJ2ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDml6Dms5Xku44gJHtzZXJ2ZXJNb2R1bGVQYXRofSDliqDovb0gTUNQU2VydmVyYCk7XG4gICAgfVxuICAgIE1DUFNlcnZlckN0b3IgPSBsb2FkZWRNb2R1bGUuTUNQU2VydmVyO1xufVxuXG4vKipcbiAqIEBlbiBSZWdpc3RyYXRpb24gbWV0aG9kIGZvciB0aGUgbWFpbiBwcm9jZXNzIG9mIEV4dGVuc2lvblxuICogQHpoIOS4uuaJqeWxleeahOS4u+i/m+eoi+eahOazqOWGjOaWueazlVxuICovXG5leHBvcnQgY29uc3QgbWV0aG9kczogeyBba2V5OiBzdHJpbmddOiAoLi4uYW55OiBhbnkpID0+IGFueSB9ID0ge1xuICAgIC8qKlxuICAgICAqIEBlbiBPcGVuIHRoZSBNQ1Agc2VydmVyIHBhbmVsXG4gICAgICogQHpoIOaJk+W8gCBNQ1Ag5pyN5Yqh5Zmo6Z2i5p2/XG4gICAgICovXG4gICAgb3BlblBhbmVsKCkge1xuICAgICAgICBFZGl0b3IuUGFuZWwub3BlbignYmVuLWNvY29zLW1jcCcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gT3BlbiB0b29sIG1hbmFnZXIgcGFuZWxcbiAgICAgKiBAemgg5omT5byA5bel5YW3566h55CG6Z2i5p2/XG4gICAgICovXG4gICAgb3BlblRvb2xNYW5hZ2VyKCkge1xuICAgICAgICAvLyDlvZPliY3pobnnm67ku4Xkv53nlZnkuLvpnaLmnb/vvIzlt6XlhbfnrqHnkIblnKjkuLvpnaLmnb8gVGFiIOWGheOAglxuICAgICAgICBFZGl0b3IuUGFuZWwub3BlbignYmVuLWNvY29zLW1jcCcpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgfSxcblxuXG5cbiAgICAvKipcbiAgICAgKiBAZW4gU3RhcnQgdGhlIE1DUCBzZXJ2ZXJcbiAgICAgKiBAemgg5ZCv5YqoIE1DUCDmnI3liqHlmahcbiAgICAgKi9cbiAgICBhc3luYyBzdGFydFNlcnZlcigpIHtcbiAgICAgICAgaWYgKCFtY3BTZXJ2ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gbm9ybWFsaXplU2V0dGluZ3MocmVhZFNldHRpbmdzKCkpO1xuICAgICAgICAgICAgbWNwU2VydmVyID0gY3JlYXRlU2VydmVySW5zdGFuY2Uoc2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgICAgIHN5bmNFbmFibGVkVG9vbHMobWNwU2VydmVyKTtcbiAgICAgICAgYXdhaXQgbWNwU2VydmVyLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBTdG9wIHRoZSBNQ1Agc2VydmVyXG4gICAgICogQHpoIOWBnOatoiBNQ1Ag5pyN5Yqh5ZmoXG4gICAgICovXG4gICAgYXN5bmMgc3RvcFNlcnZlcigpIHtcbiAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgbWNwU2VydmVyLnN0b3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW01DUOaPkuS7tl0gbWNwU2VydmVyIOacquWIneWni+WMlicpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBHZXQgc2VydmVyIHN0YXR1c1xuICAgICAqIEB6aCDojrflj5bmnI3liqHlmajnirbmgIFcbiAgICAgKi9cbiAgICBnZXRTZXJ2ZXJTdGF0dXMoKSB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTdGF0dXMoKSA6IHsgcnVubmluZzogZmFsc2UsIHBvcnQ6IDAsIGNsaWVudHM6IDAgfTtcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBnZXRDdXJyZW50U2V0dGluZ3MoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnN0YXR1cyxcbiAgICAgICAgICAgIHNldHRpbmdzOiBzZXR0aW5nc1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gVXBkYXRlIHNlcnZlciBzZXR0aW5nc1xuICAgICAqIEB6aCDmm7TmlrDmnI3liqHlmajorr7nva5cbiAgICAgKi9cbiAgICBhc3luYyB1cGRhdGVTZXR0aW5ncyhzZXR0aW5nczogSW5jb21pbmdTZXR0aW5ncykge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkU2V0dGluZ3MgPSBub3JtYWxpemVTZXR0aW5ncyhzZXR0aW5ncyk7XG4gICAgICAgIGNvbnN0IHNob3VsZEtlZXBSdW5uaW5nID0gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldFN0YXR1cygpLnJ1bm5pbmcgOiBmYWxzZTtcbiAgICAgICAgc2F2ZVNldHRpbmdzKG5vcm1hbGl6ZWRTZXR0aW5ncyk7XG4gICAgICAgIGF3YWl0IHJlY3JlYXRlU2VydmVyKG5vcm1hbGl6ZWRTZXR0aW5ncywgc2hvdWxkS2VlcFJ1bm5pbmcpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IHNob3VsZEtlZXBSdW5uaW5nLFxuICAgICAgICAgICAgc2V0dGluZ3M6IG5vcm1hbGl6ZWRTZXR0aW5ncyxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIFJlc3RhcnQgc2VydmVyIHdpdGggbGF0ZXN0IGRpc3QvbWNwLXNlcnZlci5qc1xuICAgICAqIEB6aCDkvb/nlKjmnIDmlrAgZGlzdC9tY3Atc2VydmVyLmpzIOeDremHjeWQr+acjeWKoeWZqFxuICAgICAqL1xuICAgIGFzeW5jIHJlc3RhcnRTZXJ2ZXJGcm9tRGlzdCgpIHtcbiAgICAgICAgY29uc3QgcHJldmlvdXNDdG9yID0gTUNQU2VydmVyQ3RvcjtcbiAgICAgICAgY29uc3QgcHJldmlvdXNTZXR0aW5ncyA9IG5vcm1hbGl6ZVNldHRpbmdzKGdldEN1cnJlbnRTZXR0aW5ncygpKTtcbiAgICAgICAgY29uc3QgcHJldmlvdXNSdW5uaW5nU3RhdGUgPSBtY3BTZXJ2ZXIgPyBtY3BTZXJ2ZXIuZ2V0U3RhdHVzKCkucnVubmluZyA6IGZhbHNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZWxvYWRTZXJ2ZXJDb25zdHJ1Y3RvckZyb21EaXN0KCk7XG4gICAgICAgICAgICBhd2FpdCByZWNyZWF0ZVNlcnZlcihwcmV2aW91c1NldHRpbmdzLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBydW5uaW5nOiB0cnVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01haW5dIEZhaWxlZCB0byByZXN0YXJ0IHNlcnZlciBmcm9tIGRpc3Q6JywgZXJyb3IpO1xuICAgICAgICAgICAgTUNQU2VydmVyQ3RvciA9IHByZXZpb3VzQ3RvcjtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZWNyZWF0ZVNlcnZlcihwcmV2aW91c1NldHRpbmdzLCBwcmV2aW91c1J1bm5pbmdTdGF0ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChyZXN0b3JlRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTWFpbl0gRmFpbGVkIHRvIHJlc3RvcmUgcHJldmlvdXMgc2VydmVyIHN0YXRlOicsIHJlc3RvcmVFcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5LuOIGRpc3Qg54Ot6YeN5ZCv5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCB0b29scyBsaXN0XG4gICAgICogQHpoIOiOt+WPluW3peWFt+WIl+ihqFxuICAgICAqL1xuICAgIGdldFRvb2xzTGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRBdmFpbGFibGVUb29scygpIDogW107XG4gICAgfSxcblxuICAgIGdldEZpbHRlcmVkVG9vbHNMaXN0KCkge1xuICAgICAgICBpZiAoIW1jcFNlcnZlcikgcmV0dXJuIFtdO1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5b2T5YmN5ZCv55So55qE5bel5YW3XG4gICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICBcbiAgICAgICAgLy8g5pu05pawTUNQ5pyN5Yqh5Zmo55qE5ZCv55So5bel5YW35YiX6KGoXG4gICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBtY3BTZXJ2ZXIuZ2V0RmlsdGVyZWRUb29scyhlbmFibGVkVG9vbHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBzZXJ2ZXIgc2V0dGluZ3NcbiAgICAgKiBAemgg6I635Y+W5pyN5Yqh5Zmo6K6+572uXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U2VydmVyU2V0dGluZ3MoKSB7XG4gICAgICAgIHJldHVybiBnZXRDdXJyZW50U2V0dGluZ3MoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBzZXJ2ZXIgc2V0dGluZ3MgKGFsdGVybmF0aXZlIG1ldGhvZClcbiAgICAgKiBAemgg6I635Y+W5pyN5Yqh5Zmo6K6+572u77yI5pu/5Luj5pa55rOV77yJXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U2V0dGluZ3MoKSB7XG4gICAgICAgIHJldHVybiBnZXRDdXJyZW50U2V0dGluZ3MoKTtcbiAgICB9LFxuXG4gICAgLy8g5bel5YW3566h55CG5Zmo55u45YWz5pa55rOVXG4gICAgYXN5bmMgZ2V0VG9vbE1hbmFnZXJTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRvb2xNYW5hZ2VyLmdldFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlVG9vbENvbmZpZ3VyYXRpb24obmFtZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdG9vbE1hbmFnZXIuY3JlYXRlQ29uZmlndXJhdGlvbihuYW1lLCBkZXNjcmlwdGlvbik7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBpZDogY29uZmlnLmlkLCBjb25maWcgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDliJvlu7rphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nLCB1cGRhdGVzOiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0b29sTWFuYWdlci51cGRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkLCB1cGRhdGVzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmm7TmlrDphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0b29sTWFuYWdlci5kZWxldGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDliKDpmaTphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBzZXRDdXJyZW50VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdG9vbE1hbmFnZXIuc2V0Q3VycmVudENvbmZpZ3VyYXRpb24oY29uZmlnSWQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOiuvue9ruW9k+WJjemFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXMoY2F0ZWdvcnk6IHN0cmluZywgdG9vbE5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRvb2xNYW5hZ2VyLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDb25maWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ayoeacieW9k+WJjemFjee9ricpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0b29sTWFuYWdlci51cGRhdGVUb29sU3RhdHVzKGN1cnJlbnRDb25maWcuaWQsIGNhdGVnb3J5LCB0b29sTmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxuICAgICAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICAgICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOabtOaWsOW3peWFt+eKtuaAgeWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXNCYXRjaCh1cGRhdGVzOiBhbnlbXSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNYWluXSB1cGRhdGVUb29sU3RhdHVzQmF0Y2ggY2FsbGVkIHdpdGggdXBkYXRlcyBjb3VudDpgLCB1cGRhdGVzID8gdXBkYXRlcy5sZW5ndGggOiAwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRvb2xNYW5hZ2VyLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDb25maWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ayoeacieW9k+WJjemFjee9ricpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0b29sTWFuYWdlci51cGRhdGVUb29sU3RhdHVzQmF0Y2goY3VycmVudENvbmZpZy5pZCwgdXBkYXRlcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxuICAgICAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICAgICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaJuemHj+abtOaWsOW3peWFt+eKtuaAgeWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7IGNvbmZpZ0pzb246IHRvb2xNYW5hZ2VyLmV4cG9ydENvbmZpZ3VyYXRpb24oY29uZmlnSWQpIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5a+85Ye66YWN572u5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgaW1wb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSnNvbjogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdG9vbE1hbmFnZXIuaW1wb3J0Q29uZmlndXJhdGlvbihjb25maWdKc29uKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlr7zlhaXphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRFbmFibGVkVG9vbHMoKSB7XG4gICAgICAgIHJldHVybiB0b29sTWFuYWdlci5nZXRFbmFibGVkVG9vbHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBjb25maWd1cmF0aW9uIHN0YXR1cyBmb3IgYWxsIEFJIGNsaWVudHNcbiAgICAgKiBAemgg6I635Y+W5omA5pyJIEFJIOWuouaIt+err+mFjee9rueKtuaAgVxuICAgICAqL1xuICAgIGFzeW5jIGdldENvbmZpZ1N0YXR1cyhzZXJ2ZXJOYW1lOiBzdHJpbmcsIHNjb3BlOiAndXNlcicgfCAncHJvamVjdCcgPSAndXNlcicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjbGllbnRzOiBNQ1BDb25maWdNYW5hZ2VyLmdldENvbmZpZ1N0YXR1cyhzZXJ2ZXJOYW1lLCBzY29wZSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yPy5tZXNzYWdlIHx8IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgY2xpZW50czogW10sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBHZW5lcmF0ZSBDTEkgY29tbWFuZHNcbiAgICAgKiBAemgg55Sf5oiQIENMSSDphY3nva7lkb3ku6RcbiAgICAgKi9cbiAgICBhc3luYyBnZW5lcmF0ZUNMSUNvbW1hbmRzKHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnICYgeyBzY29wZT86ICd1c2VyJyB8ICdwcm9qZWN0JyB9KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IE1DUENvbmZpZ01hbmFnZXIuZ2VuZXJhdGVDTElDb21tYW5kcyhzZXJ2ZXJDb25maWcpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvcj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICAgIGNvbW1hbmRzOiB7IGNsYXVkZTogJycsIGdlbWluaTogJycgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdlbmVyYXRlIGNvbmZpZyBjb250ZW50IGZvciBvbmUgY2xpZW50XG4gICAgICogQHpoIOeUn+aIkOWNleWuouaIt+err+mFjee9ruWGheWuuVxuICAgICAqL1xuICAgIGFzeW5jIGdlbmVyYXRlQ2xpZW50Q29uZmlnKGNsaWVudFR5cGU6IENsaWVudFR5cGUsIHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgY29udGVudDogTUNQQ29uZmlnTWFuYWdlci5nZW5lcmF0ZUNvbmZpZ0NvbnRlbnQoY2xpZW50VHlwZSwgc2VydmVyQ29uZmlnKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3I/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEFkZCBNQ1Agc2VydmVyIHRvIG9uZSBjbGllbnQgY29uZmlnXG4gICAgICogQHpoIOa3u+WKoCBNQ1Ag5pyN5Yqh5Yiw5oyH5a6a5a6i5oi356uv6YWN572uXG4gICAgICovXG4gICAgYXN5bmMgYWRkVG9DbGllbnQoY2xpZW50VHlwZTogQ2xpZW50VHlwZSwgc2VydmVyQ29uZmlnOiBNQ1BTZXJ2ZXJDb25maWcgJiB7IHNjb3BlPzogJ3VzZXInIHwgJ3Byb2plY3QnIH0pIHtcbiAgICAgICAgcmV0dXJuIE1DUENvbmZpZ01hbmFnZXIuYWRkU2VydmVyKGNsaWVudFR5cGUsIHNlcnZlckNvbmZpZywgc2VydmVyQ29uZmlnLnNjb3BlIHx8ICd1c2VyJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBSZW1vdmUgTUNQIHNlcnZlciBmcm9tIG9uZSBjbGllbnQgY29uZmlnXG4gICAgICogQHpoIOS7juaMh+WumuWuouaIt+err+enu+mZpCBNQ1Ag5pyN5YqhXG4gICAgICovXG4gICAgYXN5bmMgcmVtb3ZlRnJvbUNsaWVudChjbGllbnRUeXBlOiBDbGllbnRUeXBlLCBzZXJ2ZXJOYW1lOiBzdHJpbmcsIHNjb3BlOiAndXNlcicgfCAncHJvamVjdCcgPSAndXNlcicpIHtcbiAgICAgICAgcmV0dXJuIE1DUENvbmZpZ01hbmFnZXIucmVtb3ZlU2VydmVyKGNsaWVudFR5cGUsIHNlcnZlck5hbWUsIHNjb3BlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEFkZCBNQ1Agc2VydmVyIHRvIGFsbCBhdXRvLWNvbmZpZyBjbGllbnRzXG4gICAgICogQHpoIOa3u+WKoCBNQ1Ag5pyN5Yqh5Yiw5YWo6YOo5Y+v6Ieq5Yqo6YWN572u5a6i5oi356uvXG4gICAgICovXG4gICAgYXN5bmMgYWRkVG9BbGxDbGllbnRzKHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnICYgeyBzY29wZT86ICd1c2VyJyB8ICdwcm9qZWN0JyB9KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gTUNQQ29uZmlnTWFuYWdlci5hZGRUb0FsbENsaWVudHMoc2VydmVyQ29uZmlnLCBzZXJ2ZXJDb25maWcuc2NvcGUgfHwgJ3VzZXInKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2NsaWVudFR5cGUsIHJlc3VsdF0gb2YgcmVzdWx0cy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZWRSZXN1bHRzW01DUF9DTElFTlRTW2NsaWVudFR5cGVdLm5hbWVdID0gcmVzdWx0Lm1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogZm9ybWF0dGVkUmVzdWx0cyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3I/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICByZXN1bHRzOiB7fSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIFJlbW92ZSBNQ1Agc2VydmVyIGZyb20gYWxsIGF1dG8tY29uZmlnIGNsaWVudHNcbiAgICAgKiBAemgg5LuO5YWo6YOo5Y+v6Ieq5Yqo6YWN572u5a6i5oi356uv56e76ZmkIE1DUCDmnI3liqFcbiAgICAgKi9cbiAgICBhc3luYyByZW1vdmVGcm9tQWxsQ2xpZW50cyhzZXJ2ZXJOYW1lOiBzdHJpbmcsIHNjb3BlOiAndXNlcicgfCAncHJvamVjdCcgPSAndXNlcicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBNQ1BDb25maWdNYW5hZ2VyLnJlbW92ZUZyb21BbGxDbGllbnRzKHNlcnZlck5hbWUsIHNjb3BlKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2NsaWVudFR5cGUsIHJlc3VsdF0gb2YgcmVzdWx0cy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZWRSZXN1bHRzW01DUF9DTElFTlRTW2NsaWVudFR5cGVdLm5hbWVdID0gcmVzdWx0Lm1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogZm9ybWF0dGVkUmVzdWx0cyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3I/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICByZXN1bHRzOiB7fSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIE9wZW4gY2xpZW50IGNvbmZpZyBmaWxlIGluIHN5c3RlbSBkZWZhdWx0IGFwcFxuICAgICAqIEB6aCDkvb/nlKjns7vnu5/pu5jorqTnqIvluo/miZPlvIDlrqLmiLfnq6/phY3nva7mlofku7ZcbiAgICAgKi9cbiAgICBhc3luYyBvcGVuQ29uZmlnRmlsZShjb25maWdQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBleHBhbmRlZFBhdGggPSBjb25maWdQYXRoO1xuICAgICAgICAgICAgaWYgKGV4cGFuZGVkUGF0aC5zdGFydHNXaXRoKCd+JykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBob21lID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcbiAgICAgICAgICAgICAgICBpZiAoaG9tZSkge1xuICAgICAgICAgICAgICAgICAgICBleHBhbmRlZFBhdGggPSBleHBhbmRlZFBhdGgucmVwbGFjZSgnficsIGhvbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgICAgICAgICBleHBhbmRlZFBhdGggPSBleHBhbmRlZFBhdGgucmVwbGFjZSgvJShbXiVdKyklL2csIChfOiBzdHJpbmcsIGtleTogc3RyaW5nKSA9PiBwcm9jZXNzLmVudltrZXldIHx8ICcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBleGVjIH0gPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykgYXMgeyBleGVjOiAoY21kOiBzdHJpbmcsIGNiPzogKGVycm9yOiBhbnkpID0+IHZvaWQpID0+IHZvaWQgfTtcbiAgICAgICAgICAgIGxldCBjb21tYW5kOiBzdHJpbmc7XG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gYG9wZW4gXCIke2V4cGFuZGVkUGF0aH1cImA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gYHN0YXJ0IFwiXCIgXCIke2V4cGFuZGVkUGF0aH1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBgeGRnLW9wZW4gXCIke2V4cGFuZGVkUGF0aH1cImA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV4ZWMoY29tbWFuZCwgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUOaPkuS7tl0gRmFpbGVkIHRvIG9wZW4gY29uZmlnIGZpbGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOW3suaJk+W8gOmFjee9ruaWh+S7tjogJHtleHBhbmRlZFBhdGh9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOaJk+W8gOmFjee9ruaWh+S7tuWksei0pTogJHtlcnJvcj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyb3IpfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbi8qKlxuICogQGVuIE1ldGhvZCBUcmlnZ2VyZWQgb24gRXh0ZW5zaW9uIFN0YXJ0dXBcbiAqIEB6aCDmianlsZXlkK/liqjml7bop6blj5HnmoTmlrnms5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coJ0NvY29zIE1DUCBTZXJ2ZXIgZXh0ZW5zaW9uIGxvYWRlZCcpO1xuICAgIFxuICAgIC8vIOWIneWni+WMluW3peWFt+euoeeQhuWZqFxuICAgIHRvb2xNYW5hZ2VyID0gbmV3IFRvb2xNYW5hZ2VyKCk7XG4gICAgXG4gICAgLy8g6K+75Y+W6K6+572u5bm25Yib5bu65pyN5Yqh5a6e5L6LXG4gICAgY29uc3Qgc2V0dGluZ3MgPSBub3JtYWxpemVTZXR0aW5ncyhyZWFkU2V0dGluZ3MoKSk7XG4gICAgbWNwU2VydmVyID0gY3JlYXRlU2VydmVySW5zdGFuY2Uoc2V0dGluZ3MpO1xuICAgIFxuICAgIC8vIOWmguaenOiuvue9ruS6huiHquWKqOWQr+WKqO+8jOWImeWQr+WKqOacjeWKoeWZqFxuICAgIGlmIChzZXR0aW5ncy5hdXRvU3RhcnQpIHtcbiAgICAgICAgbWNwU2VydmVyLnN0YXJ0KCkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBhdXRvLXN0YXJ0IE1DUCBzZXJ2ZXI6JywgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEBlbiBNZXRob2QgdHJpZ2dlcmVkIHdoZW4gdW5pbnN0YWxsaW5nIHRoZSBleHRlbnNpb25cbiAqIEB6aCDljbjovb3mianlsZXml7bop6blj5HnmoTmlrnms5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHtcbiAgICBpZiAobWNwU2VydmVyKSB7XG4gICAgICAgIG1jcFNlcnZlci5zdG9wKCk7XG4gICAgICAgIG1jcFNlcnZlciA9IG51bGw7XG4gICAgfVxufVxuIl19
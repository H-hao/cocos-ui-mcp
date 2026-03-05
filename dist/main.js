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
     * @en Restart server with latest dist/mcp-server.js, then close and reopen the panel
     * @zh 使用最新 dist/mcp-server.js 热重启服务器，并关闭/重新打开面板以加载最新 UI
     */
    async restartServerFromDist() {
        const previousCtor = MCPServerCtor;
        const previousSettings = normalizeSettings(getCurrentSettings());
        const previousRunningState = mcpServer ? mcpServer.getStatus().running : false;
        try {
            reloadServerConstructorFromDist();
            await recreateServer(previousSettings, true);
            // 关闭面板后短暂延迟再重新打开，确保新 dist 的 UI 被加载
            Editor.Panel.close('ben-cocos-mcp');
            await new Promise(resolve => setTimeout(resolve, 400));
            Editor.Panel.open('ben-cocos-mcp');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBbWdCQSxvQkFnQkM7QUFNRCx3QkFLQztBQTloQkQsK0JBQWlDO0FBQ2pDLDZDQUF5QztBQUN6Qyx5Q0FBd0Q7QUFFeEQsdURBQW1EO0FBQ25ELDZEQUF3RDtBQUN4RCw2REFBZ0Y7QUFNaEYsTUFBTSxzQkFBc0IsR0FBRyxlQUFlLENBQUM7QUFDL0MsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBRTlCLElBQUksYUFBYSxHQUFxQixzQkFBUyxDQUFDO0FBQ2hELElBQUksU0FBUyxHQUFxQixJQUFJLENBQUM7QUFDdkMsSUFBSSxXQUF3QixDQUFDO0FBRTdCLFNBQVMsaUJBQWlCLENBQUMsS0FBdUI7SUFDOUMsTUFBTSxZQUFZLEdBQUcsSUFBQSx1QkFBWSxHQUFFLENBQUM7SUFDcEMsTUFBTSxLQUFtQyxLQUFLLElBQUksRUFBRSxFQUE5QyxFQUFFLFFBQVEsT0FBb0MsRUFBL0IsZUFBZSxjQUE5QixZQUFnQyxDQUFjLENBQUM7SUFDckQsTUFBTSxjQUFjLEdBQUcsT0FBTyxlQUFlLENBQUMsY0FBYyxLQUFLLFNBQVM7UUFDdEUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxjQUFjO1FBQ2hDLENBQUMsQ0FBQyxPQUFPLFFBQVEsS0FBSyxTQUFTO1lBQzNCLENBQUMsQ0FBQyxRQUFRO1lBQ1YsQ0FBQyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7SUFFdEMscURBQ08sWUFBWSxHQUNaLGVBQWUsS0FDbEIsY0FBYyxFQUNkLGNBQWMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUM7WUFDekQsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxjQUFjO1lBQ2hDLENBQUMsQ0FBQyxZQUFZLENBQUMsY0FBYyxJQUNuQztBQUNOLENBQUM7QUFFRCxTQUFTLGtCQUFrQjtJQUN2QixPQUFP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SCxPQUFPLEVBQUUsS0FBSztnQkFDZCxPQUFPLEVBQUUsYUFBYSxDQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxPQUFPLEtBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2FBQzFELENBQUM7UUFDTixDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUM7QUFFRjs7O0dBR0c7QUFDSCxTQUFnQixJQUFJO0lBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztJQUVqRCxXQUFXO0lBQ1gsV0FBVyxHQUFHLElBQUksMEJBQVcsRUFBRSxDQUFDO0lBRWhDLGNBQWM7SUFDZCxNQUFNLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxJQUFBLHVCQUFZLEdBQUUsQ0FBQyxDQUFDO0lBQ25ELFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUUzQyxtQkFBbUI7SUFDbkIsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDckIsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztBQUNMLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixNQUFNO0lBQ2xCLElBQUksU0FBUyxFQUFFLENBQUM7UUFDWixTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakIsU0FBUyxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4sIHNlcCB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgTUNQU2VydmVyIH0gZnJvbSAnLi9tY3Atc2VydmVyJztcbmltcG9ydCB7IHJlYWRTZXR0aW5ncywgc2F2ZVNldHRpbmdzIH0gZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgeyBNQ1BTZXJ2ZXJTZXR0aW5ncyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgVG9vbE1hbmFnZXIgfSBmcm9tICcuL3Rvb2xzL3Rvb2wtbWFuYWdlcic7XG5pbXBvcnQgeyBNQ1BDb25maWdNYW5hZ2VyIH0gZnJvbSAnLi9tY3AtY29uZmlnLW1hbmFnZXInO1xuaW1wb3J0IHsgQ2xpZW50VHlwZSwgTUNQX0NMSUVOVFMsIE1DUFNlcnZlckNvbmZpZyB9IGZyb20gJy4vbWNwLWNsaWVudC1jb25maWdzJztcblxudHlwZSBJbmNvbWluZ1NldHRpbmdzID0gUGFydGlhbDxNQ1BTZXJ2ZXJTZXR0aW5ncz4gJiB7XG4gICAgZGVidWdMb2c/OiBib29sZWFuO1xufTtcblxuY29uc3QgU0VSVkVSX01PRFVMRV9GSUxFTkFNRSA9ICdtY3Atc2VydmVyLmpzJztcbmNvbnN0IFRPT0xTX0RJUk5BTUUgPSAndG9vbHMnO1xuXG5sZXQgTUNQU2VydmVyQ3RvcjogdHlwZW9mIE1DUFNlcnZlciA9IE1DUFNlcnZlcjtcbmxldCBtY3BTZXJ2ZXI6IE1DUFNlcnZlciB8IG51bGwgPSBudWxsO1xubGV0IHRvb2xNYW5hZ2VyOiBUb29sTWFuYWdlcjtcblxuZnVuY3Rpb24gbm9ybWFsaXplU2V0dGluZ3MoaW5wdXQ6IEluY29taW5nU2V0dGluZ3MpOiBNQ1BTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgY29uc3QgYmFzZVNldHRpbmdzID0gcmVhZFNldHRpbmdzKCk7XG4gICAgY29uc3QgeyBkZWJ1Z0xvZywgLi4ucGFydGlhbFNldHRpbmdzIH0gPSBpbnB1dCB8fCB7fTtcbiAgICBjb25zdCBlbmFibGVEZWJ1Z0xvZyA9IHR5cGVvZiBwYXJ0aWFsU2V0dGluZ3MuZW5hYmxlRGVidWdMb2cgPT09ICdib29sZWFuJ1xuICAgICAgICA/IHBhcnRpYWxTZXR0aW5ncy5lbmFibGVEZWJ1Z0xvZ1xuICAgICAgICA6IHR5cGVvZiBkZWJ1Z0xvZyA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICAgICA/IGRlYnVnTG9nXG4gICAgICAgICAgICA6IGJhc2VTZXR0aW5ncy5lbmFibGVEZWJ1Z0xvZztcblxuICAgIHJldHVybiB7XG4gICAgICAgIC4uLmJhc2VTZXR0aW5ncyxcbiAgICAgICAgLi4ucGFydGlhbFNldHRpbmdzLFxuICAgICAgICBlbmFibGVEZWJ1Z0xvZyxcbiAgICAgICAgYWxsb3dlZE9yaWdpbnM6IEFycmF5LmlzQXJyYXkocGFydGlhbFNldHRpbmdzLmFsbG93ZWRPcmlnaW5zKVxuICAgICAgICAgICAgPyBwYXJ0aWFsU2V0dGluZ3MuYWxsb3dlZE9yaWdpbnNcbiAgICAgICAgICAgIDogYmFzZVNldHRpbmdzLmFsbG93ZWRPcmlnaW5zLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldEN1cnJlbnRTZXR0aW5ncygpOiBNQ1BTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgcmV0dXJuIG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTZXR0aW5ncygpIDogcmVhZFNldHRpbmdzKCk7XG59XG5cbmZ1bmN0aW9uIHN5bmNFbmFibGVkVG9vbHMoc2VydmVyOiBNQ1BTZXJ2ZXIpOiB2b2lkIHtcbiAgICBpZiAoIXRvb2xNYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZW5hYmxlZFRvb2xzID0gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XG4gICAgc2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZXJ2ZXJJbnN0YW5jZShzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3MpOiBNQ1BTZXJ2ZXIge1xuICAgIGNvbnN0IHNlcnZlciA9IG5ldyBNQ1BTZXJ2ZXJDdG9yKHNldHRpbmdzKTtcbiAgICBzeW5jRW5hYmxlZFRvb2xzKHNlcnZlcik7XG4gICAgcmV0dXJuIHNlcnZlcjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVjcmVhdGVTZXJ2ZXIoc2V0dGluZ3M6IE1DUFNlcnZlclNldHRpbmdzLCBzaG91bGRTdGFydDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChtY3BTZXJ2ZXIpIHtcbiAgICAgICAgbWNwU2VydmVyLnN0b3AoKTtcbiAgICB9XG4gICAgbWNwU2VydmVyID0gY3JlYXRlU2VydmVySW5zdGFuY2Uoc2V0dGluZ3MpO1xuICAgIGlmIChzaG91bGRTdGFydCkge1xuICAgICAgICBhd2FpdCBtY3BTZXJ2ZXIuc3RhcnQoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFyU2VydmVyTW9kdWxlQ2FjaGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VydmVyTW9kdWxlUGF0aCA9IGpvaW4oX19kaXJuYW1lLCBTRVJWRVJfTU9EVUxFX0ZJTEVOQU1FKTtcbiAgICBjb25zdCB0b29sc0RpclBhdGggPSBqb2luKF9fZGlybmFtZSwgVE9PTFNfRElSTkFNRSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZFRvb2xzRGlyUGF0aCA9IGAke3Rvb2xzRGlyUGF0aH0ke3NlcH1gO1xuXG4gICAgZm9yIChjb25zdCBtb2R1bGVQYXRoIG9mIE9iamVjdC5rZXlzKHJlcXVpcmUuY2FjaGUpKSB7XG4gICAgICAgIGlmIChtb2R1bGVQYXRoID09PSBzZXJ2ZXJNb2R1bGVQYXRoIHx8IG1vZHVsZVBhdGguc3RhcnRzV2l0aChub3JtYWxpemVkVG9vbHNEaXJQYXRoKSkge1xuICAgICAgICAgICAgZGVsZXRlIHJlcXVpcmUuY2FjaGVbbW9kdWxlUGF0aF07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbG9hZFNlcnZlckNvbnN0cnVjdG9yRnJvbURpc3QoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VydmVyTW9kdWxlUGF0aCA9IGpvaW4oX19kaXJuYW1lLCBTRVJWRVJfTU9EVUxFX0ZJTEVOQU1FKTtcbiAgICBjbGVhclNlcnZlck1vZHVsZUNhY2hlKCk7XG5cbiAgICBjb25zdCBsb2FkZWRNb2R1bGUgPSByZXF1aXJlKHNlcnZlck1vZHVsZVBhdGgpIGFzIHsgTUNQU2VydmVyPzogdHlwZW9mIE1DUFNlcnZlciB9O1xuICAgIGlmICghbG9hZGVkTW9kdWxlIHx8IHR5cGVvZiBsb2FkZWRNb2R1bGUuTUNQU2VydmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihg5peg5rOV5LuOICR7c2VydmVyTW9kdWxlUGF0aH0g5Yqg6L29IE1DUFNlcnZlcmApO1xuICAgIH1cbiAgICBNQ1BTZXJ2ZXJDdG9yID0gbG9hZGVkTW9kdWxlLk1DUFNlcnZlcjtcbn1cblxuLyoqXG4gKiBAZW4gUmVnaXN0cmF0aW9uIG1ldGhvZCBmb3IgdGhlIG1haW4gcHJvY2VzcyBvZiBFeHRlbnNpb25cbiAqIEB6aCDkuLrmianlsZXnmoTkuLvov5vnqIvnmoTms6jlhozmlrnms5VcbiAqL1xuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogKC4uLmFueTogYW55KSA9PiBhbnkgfSA9IHtcbiAgICAvKipcbiAgICAgKiBAZW4gT3BlbiB0aGUgTUNQIHNlcnZlciBwYW5lbFxuICAgICAqIEB6aCDmiZPlvIAgTUNQIOacjeWKoeWZqOmdouadv1xuICAgICAqL1xuICAgIG9wZW5QYW5lbCgpIHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ2Jlbi1jb2Nvcy1tY3AnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIE9wZW4gdG9vbCBtYW5hZ2VyIHBhbmVsXG4gICAgICogQHpoIOaJk+W8gOW3peWFt+euoeeQhumdouadv1xuICAgICAqL1xuICAgIG9wZW5Ub29sTWFuYWdlcigpIHtcbiAgICAgICAgLy8g5b2T5YmN6aG555uu5LuF5L+d55WZ5Li76Z2i5p2/77yM5bel5YW3566h55CG5Zyo5Li76Z2i5p2/IFRhYiDlhoXjgIJcbiAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ2Jlbi1jb2Nvcy1tY3AnKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgIH0sXG5cblxuXG4gICAgLyoqXG4gICAgICogQGVuIFN0YXJ0IHRoZSBNQ1Agc2VydmVyXG4gICAgICogQHpoIOWQr+WKqCBNQ1Ag5pyN5Yqh5ZmoXG4gICAgICovXG4gICAgYXN5bmMgc3RhcnRTZXJ2ZXIoKSB7XG4gICAgICAgIGlmICghbWNwU2VydmVyKSB7XG4gICAgICAgICAgICBjb25zdCBzZXR0aW5ncyA9IG5vcm1hbGl6ZVNldHRpbmdzKHJlYWRTZXR0aW5ncygpKTtcbiAgICAgICAgICAgIG1jcFNlcnZlciA9IGNyZWF0ZVNlcnZlckluc3RhbmNlKHNldHRpbmdzKTtcbiAgICAgICAgfVxuICAgICAgICBzeW5jRW5hYmxlZFRvb2xzKG1jcFNlcnZlcik7XG4gICAgICAgIGF3YWl0IG1jcFNlcnZlci5zdGFydCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gU3RvcCB0aGUgTUNQIHNlcnZlclxuICAgICAqIEB6aCDlgZzmraIgTUNQIOacjeWKoeWZqFxuICAgICAqL1xuICAgIGFzeW5jIHN0b3BTZXJ2ZXIoKSB7XG4gICAgICAgIGlmIChtY3BTZXJ2ZXIpIHtcbiAgICAgICAgICAgIG1jcFNlcnZlci5zdG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tNQ1Dmj5Lku7ZdIG1jcFNlcnZlciDmnKrliJ3lp4vljJYnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gR2V0IHNlcnZlciBzdGF0dXNcbiAgICAgKiBAemgg6I635Y+W5pyN5Yqh5Zmo54q25oCBXG4gICAgICovXG4gICAgZ2V0U2VydmVyU3RhdHVzKCkge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBtY3BTZXJ2ZXIgPyBtY3BTZXJ2ZXIuZ2V0U3RhdHVzKCkgOiB7IHJ1bm5pbmc6IGZhbHNlLCBwb3J0OiAwLCBjbGllbnRzOiAwIH07XG4gICAgICAgIGNvbnN0IHNldHRpbmdzID0gZ2V0Q3VycmVudFNldHRpbmdzKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5zdGF0dXMsXG4gICAgICAgICAgICBzZXR0aW5nczogc2V0dGluZ3NcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIFVwZGF0ZSBzZXJ2ZXIgc2V0dGluZ3NcbiAgICAgKiBAemgg5pu05paw5pyN5Yqh5Zmo6K6+572uXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlU2V0dGluZ3Moc2V0dGluZ3M6IEluY29taW5nU2V0dGluZ3MpIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFNldHRpbmdzID0gbm9ybWFsaXplU2V0dGluZ3Moc2V0dGluZ3MpO1xuICAgICAgICBjb25zdCBzaG91bGRLZWVwUnVubmluZyA9IG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTdGF0dXMoKS5ydW5uaW5nIDogZmFsc2U7XG4gICAgICAgIHNhdmVTZXR0aW5ncyhub3JtYWxpemVkU2V0dGluZ3MpO1xuICAgICAgICBhd2FpdCByZWNyZWF0ZVNlcnZlcihub3JtYWxpemVkU2V0dGluZ3MsIHNob3VsZEtlZXBSdW5uaW5nKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBydW5uaW5nOiBzaG91bGRLZWVwUnVubmluZyxcbiAgICAgICAgICAgIHNldHRpbmdzOiBub3JtYWxpemVkU2V0dGluZ3MsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBSZXN0YXJ0IHNlcnZlciB3aXRoIGxhdGVzdCBkaXN0L21jcC1zZXJ2ZXIuanMsIHRoZW4gY2xvc2UgYW5kIHJlb3BlbiB0aGUgcGFuZWxcbiAgICAgKiBAemgg5L2/55So5pyA5pawIGRpc3QvbWNwLXNlcnZlci5qcyDng63ph43lkK/mnI3liqHlmajvvIzlubblhbPpl60v6YeN5paw5omT5byA6Z2i5p2/5Lul5Yqg6L295pyA5pawIFVJXG4gICAgICovXG4gICAgYXN5bmMgcmVzdGFydFNlcnZlckZyb21EaXN0KCkge1xuICAgICAgICBjb25zdCBwcmV2aW91c0N0b3IgPSBNQ1BTZXJ2ZXJDdG9yO1xuICAgICAgICBjb25zdCBwcmV2aW91c1NldHRpbmdzID0gbm9ybWFsaXplU2V0dGluZ3MoZ2V0Q3VycmVudFNldHRpbmdzKCkpO1xuICAgICAgICBjb25zdCBwcmV2aW91c1J1bm5pbmdTdGF0ZSA9IG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTdGF0dXMoKS5ydW5uaW5nIDogZmFsc2U7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlbG9hZFNlcnZlckNvbnN0cnVjdG9yRnJvbURpc3QoKTtcbiAgICAgICAgICAgIGF3YWl0IHJlY3JlYXRlU2VydmVyKHByZXZpb3VzU2V0dGluZ3MsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyDlhbPpl63pnaLmnb/lkI7nn63mmoLlu7bov5/lho3ph43mlrDmiZPlvIDvvIznoa7kv53mlrAgZGlzdCDnmoQgVUkg6KKr5Yqg6L29XG4gICAgICAgICAgICBFZGl0b3IuUGFuZWwuY2xvc2UoJ2Jlbi1jb2Nvcy1tY3AnKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA0MDApKTtcbiAgICAgICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKCdiZW4tY29jb3MtbWNwJyk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBydW5uaW5nOiB0cnVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01haW5dIEZhaWxlZCB0byByZXN0YXJ0IHNlcnZlciBmcm9tIGRpc3Q6JywgZXJyb3IpO1xuICAgICAgICAgICAgTUNQU2VydmVyQ3RvciA9IHByZXZpb3VzQ3RvcjtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZWNyZWF0ZVNlcnZlcihwcmV2aW91c1NldHRpbmdzLCBwcmV2aW91c1J1bm5pbmdTdGF0ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChyZXN0b3JlRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTWFpbl0gRmFpbGVkIHRvIHJlc3RvcmUgcHJldmlvdXMgc2VydmVyIHN0YXRlOicsIHJlc3RvcmVFcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5LuOIGRpc3Qg54Ot6YeN5ZCv5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCB0b29scyBsaXN0XG4gICAgICogQHpoIOiOt+WPluW3peWFt+WIl+ihqFxuICAgICAqL1xuICAgIGdldFRvb2xzTGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRBdmFpbGFibGVUb29scygpIDogW107XG4gICAgfSxcblxuICAgIGdldEZpbHRlcmVkVG9vbHNMaXN0KCkge1xuICAgICAgICBpZiAoIW1jcFNlcnZlcikgcmV0dXJuIFtdO1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5b2T5YmN5ZCv55So55qE5bel5YW3XG4gICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICBcbiAgICAgICAgLy8g5pu05pawTUNQ5pyN5Yqh5Zmo55qE5ZCv55So5bel5YW35YiX6KGoXG4gICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBtY3BTZXJ2ZXIuZ2V0RmlsdGVyZWRUb29scyhlbmFibGVkVG9vbHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBzZXJ2ZXIgc2V0dGluZ3NcbiAgICAgKiBAemgg6I635Y+W5pyN5Yqh5Zmo6K6+572uXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U2VydmVyU2V0dGluZ3MoKSB7XG4gICAgICAgIHJldHVybiBnZXRDdXJyZW50U2V0dGluZ3MoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBzZXJ2ZXIgc2V0dGluZ3MgKGFsdGVybmF0aXZlIG1ldGhvZClcbiAgICAgKiBAemgg6I635Y+W5pyN5Yqh5Zmo6K6+572u77yI5pu/5Luj5pa55rOV77yJXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U2V0dGluZ3MoKSB7XG4gICAgICAgIHJldHVybiBnZXRDdXJyZW50U2V0dGluZ3MoKTtcbiAgICB9LFxuXG4gICAgLy8g5bel5YW3566h55CG5Zmo55u45YWz5pa55rOVXG4gICAgYXN5bmMgZ2V0VG9vbE1hbmFnZXJTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRvb2xNYW5hZ2VyLmdldFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlVG9vbENvbmZpZ3VyYXRpb24obmFtZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdG9vbE1hbmFnZXIuY3JlYXRlQ29uZmlndXJhdGlvbihuYW1lLCBkZXNjcmlwdGlvbik7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBpZDogY29uZmlnLmlkLCBjb25maWcgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDliJvlu7rphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nLCB1cGRhdGVzOiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0b29sTWFuYWdlci51cGRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkLCB1cGRhdGVzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmm7TmlrDphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0b29sTWFuYWdlci5kZWxldGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDliKDpmaTphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBzZXRDdXJyZW50VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdG9vbE1hbmFnZXIuc2V0Q3VycmVudENvbmZpZ3VyYXRpb24oY29uZmlnSWQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOiuvue9ruW9k+WJjemFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXMoY2F0ZWdvcnk6IHN0cmluZywgdG9vbE5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRvb2xNYW5hZ2VyLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDb25maWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ayoeacieW9k+WJjemFjee9ricpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0b29sTWFuYWdlci51cGRhdGVUb29sU3RhdHVzKGN1cnJlbnRDb25maWcuaWQsIGNhdGVnb3J5LCB0b29sTmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxuICAgICAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICAgICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOabtOaWsOW3peWFt+eKtuaAgeWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXNCYXRjaCh1cGRhdGVzOiBhbnlbXSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNYWluXSB1cGRhdGVUb29sU3RhdHVzQmF0Y2ggY2FsbGVkIHdpdGggdXBkYXRlcyBjb3VudDpgLCB1cGRhdGVzID8gdXBkYXRlcy5sZW5ndGggOiAwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRvb2xNYW5hZ2VyLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDb25maWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ayoeacieW9k+WJjemFjee9ricpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0b29sTWFuYWdlci51cGRhdGVUb29sU3RhdHVzQmF0Y2goY3VycmVudENvbmZpZy5pZCwgdXBkYXRlcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxuICAgICAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICAgICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaJuemHj+abtOaWsOW3peWFt+eKtuaAgeWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7IGNvbmZpZ0pzb246IHRvb2xNYW5hZ2VyLmV4cG9ydENvbmZpZ3VyYXRpb24oY29uZmlnSWQpIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5a+85Ye66YWN572u5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgaW1wb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSnNvbjogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdG9vbE1hbmFnZXIuaW1wb3J0Q29uZmlndXJhdGlvbihjb25maWdKc29uKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlr7zlhaXphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRFbmFibGVkVG9vbHMoKSB7XG4gICAgICAgIHJldHVybiB0b29sTWFuYWdlci5nZXRFbmFibGVkVG9vbHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBjb25maWd1cmF0aW9uIHN0YXR1cyBmb3IgYWxsIEFJIGNsaWVudHNcbiAgICAgKiBAemgg6I635Y+W5omA5pyJIEFJIOWuouaIt+err+mFjee9rueKtuaAgVxuICAgICAqL1xuICAgIGFzeW5jIGdldENvbmZpZ1N0YXR1cyhzZXJ2ZXJOYW1lOiBzdHJpbmcsIHNjb3BlOiAndXNlcicgfCAncHJvamVjdCcgPSAndXNlcicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjbGllbnRzOiBNQ1BDb25maWdNYW5hZ2VyLmdldENvbmZpZ1N0YXR1cyhzZXJ2ZXJOYW1lLCBzY29wZSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yPy5tZXNzYWdlIHx8IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgY2xpZW50czogW10sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBHZW5lcmF0ZSBDTEkgY29tbWFuZHNcbiAgICAgKiBAemgg55Sf5oiQIENMSSDphY3nva7lkb3ku6RcbiAgICAgKi9cbiAgICBhc3luYyBnZW5lcmF0ZUNMSUNvbW1hbmRzKHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnICYgeyBzY29wZT86ICd1c2VyJyB8ICdwcm9qZWN0JyB9KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgY29tbWFuZHM6IE1DUENvbmZpZ01hbmFnZXIuZ2VuZXJhdGVDTElDb21tYW5kcyhzZXJ2ZXJDb25maWcpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvcj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICAgIGNvbW1hbmRzOiB7IGNsYXVkZTogJycsIGdlbWluaTogJycgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdlbmVyYXRlIGNvbmZpZyBjb250ZW50IGZvciBvbmUgY2xpZW50XG4gICAgICogQHpoIOeUn+aIkOWNleWuouaIt+err+mFjee9ruWGheWuuVxuICAgICAqL1xuICAgIGFzeW5jIGdlbmVyYXRlQ2xpZW50Q29uZmlnKGNsaWVudFR5cGU6IENsaWVudFR5cGUsIHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgY29udGVudDogTUNQQ29uZmlnTWFuYWdlci5nZW5lcmF0ZUNvbmZpZ0NvbnRlbnQoY2xpZW50VHlwZSwgc2VydmVyQ29uZmlnKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3I/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEFkZCBNQ1Agc2VydmVyIHRvIG9uZSBjbGllbnQgY29uZmlnXG4gICAgICogQHpoIOa3u+WKoCBNQ1Ag5pyN5Yqh5Yiw5oyH5a6a5a6i5oi356uv6YWN572uXG4gICAgICovXG4gICAgYXN5bmMgYWRkVG9DbGllbnQoY2xpZW50VHlwZTogQ2xpZW50VHlwZSwgc2VydmVyQ29uZmlnOiBNQ1BTZXJ2ZXJDb25maWcgJiB7IHNjb3BlPzogJ3VzZXInIHwgJ3Byb2plY3QnIH0pIHtcbiAgICAgICAgcmV0dXJuIE1DUENvbmZpZ01hbmFnZXIuYWRkU2VydmVyKGNsaWVudFR5cGUsIHNlcnZlckNvbmZpZywgc2VydmVyQ29uZmlnLnNjb3BlIHx8ICd1c2VyJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBSZW1vdmUgTUNQIHNlcnZlciBmcm9tIG9uZSBjbGllbnQgY29uZmlnXG4gICAgICogQHpoIOS7juaMh+WumuWuouaIt+err+enu+mZpCBNQ1Ag5pyN5YqhXG4gICAgICovXG4gICAgYXN5bmMgcmVtb3ZlRnJvbUNsaWVudChjbGllbnRUeXBlOiBDbGllbnRUeXBlLCBzZXJ2ZXJOYW1lOiBzdHJpbmcsIHNjb3BlOiAndXNlcicgfCAncHJvamVjdCcgPSAndXNlcicpIHtcbiAgICAgICAgcmV0dXJuIE1DUENvbmZpZ01hbmFnZXIucmVtb3ZlU2VydmVyKGNsaWVudFR5cGUsIHNlcnZlck5hbWUsIHNjb3BlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEFkZCBNQ1Agc2VydmVyIHRvIGFsbCBhdXRvLWNvbmZpZyBjbGllbnRzXG4gICAgICogQHpoIOa3u+WKoCBNQ1Ag5pyN5Yqh5Yiw5YWo6YOo5Y+v6Ieq5Yqo6YWN572u5a6i5oi356uvXG4gICAgICovXG4gICAgYXN5bmMgYWRkVG9BbGxDbGllbnRzKHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnICYgeyBzY29wZT86ICd1c2VyJyB8ICdwcm9qZWN0JyB9KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gTUNQQ29uZmlnTWFuYWdlci5hZGRUb0FsbENsaWVudHMoc2VydmVyQ29uZmlnLCBzZXJ2ZXJDb25maWcuc2NvcGUgfHwgJ3VzZXInKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2NsaWVudFR5cGUsIHJlc3VsdF0gb2YgcmVzdWx0cy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZWRSZXN1bHRzW01DUF9DTElFTlRTW2NsaWVudFR5cGVdLm5hbWVdID0gcmVzdWx0Lm1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogZm9ybWF0dGVkUmVzdWx0cyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3I/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICByZXN1bHRzOiB7fSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIFJlbW92ZSBNQ1Agc2VydmVyIGZyb20gYWxsIGF1dG8tY29uZmlnIGNsaWVudHNcbiAgICAgKiBAemgg5LuO5YWo6YOo5Y+v6Ieq5Yqo6YWN572u5a6i5oi356uv56e76ZmkIE1DUCDmnI3liqFcbiAgICAgKi9cbiAgICBhc3luYyByZW1vdmVGcm9tQWxsQ2xpZW50cyhzZXJ2ZXJOYW1lOiBzdHJpbmcsIHNjb3BlOiAndXNlcicgfCAncHJvamVjdCcgPSAndXNlcicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBNQ1BDb25maWdNYW5hZ2VyLnJlbW92ZUZyb21BbGxDbGllbnRzKHNlcnZlck5hbWUsIHNjb3BlKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2NsaWVudFR5cGUsIHJlc3VsdF0gb2YgcmVzdWx0cy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZWRSZXN1bHRzW01DUF9DTElFTlRTW2NsaWVudFR5cGVdLm5hbWVdID0gcmVzdWx0Lm1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogZm9ybWF0dGVkUmVzdWx0cyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3I/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICByZXN1bHRzOiB7fSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIE9wZW4gY2xpZW50IGNvbmZpZyBmaWxlIGluIHN5c3RlbSBkZWZhdWx0IGFwcFxuICAgICAqIEB6aCDkvb/nlKjns7vnu5/pu5jorqTnqIvluo/miZPlvIDlrqLmiLfnq6/phY3nva7mlofku7ZcbiAgICAgKi9cbiAgICBhc3luYyBvcGVuQ29uZmlnRmlsZShjb25maWdQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBleHBhbmRlZFBhdGggPSBjb25maWdQYXRoO1xuICAgICAgICAgICAgaWYgKGV4cGFuZGVkUGF0aC5zdGFydHNXaXRoKCd+JykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBob21lID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcbiAgICAgICAgICAgICAgICBpZiAoaG9tZSkge1xuICAgICAgICAgICAgICAgICAgICBleHBhbmRlZFBhdGggPSBleHBhbmRlZFBhdGgucmVwbGFjZSgnficsIGhvbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgICAgICAgICBleHBhbmRlZFBhdGggPSBleHBhbmRlZFBhdGgucmVwbGFjZSgvJShbXiVdKyklL2csIChfOiBzdHJpbmcsIGtleTogc3RyaW5nKSA9PiBwcm9jZXNzLmVudltrZXldIHx8ICcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBleGVjIH0gPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykgYXMgeyBleGVjOiAoY21kOiBzdHJpbmcsIGNiPzogKGVycm9yOiBhbnkpID0+IHZvaWQpID0+IHZvaWQgfTtcbiAgICAgICAgICAgIGxldCBjb21tYW5kOiBzdHJpbmc7XG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gYG9wZW4gXCIke2V4cGFuZGVkUGF0aH1cImA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gYHN0YXJ0IFwiXCIgXCIke2V4cGFuZGVkUGF0aH1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBgeGRnLW9wZW4gXCIke2V4cGFuZGVkUGF0aH1cImA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV4ZWMoY29tbWFuZCwgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUOaPkuS7tl0gRmFpbGVkIHRvIG9wZW4gY29uZmlnIGZpbGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOW3suaJk+W8gOmFjee9ruaWh+S7tjogJHtleHBhbmRlZFBhdGh9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOaJk+W8gOmFjee9ruaWh+S7tuWksei0pTogJHtlcnJvcj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyb3IpfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbi8qKlxuICogQGVuIE1ldGhvZCBUcmlnZ2VyZWQgb24gRXh0ZW5zaW9uIFN0YXJ0dXBcbiAqIEB6aCDmianlsZXlkK/liqjml7bop6blj5HnmoTmlrnms5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coJ0NvY29zIE1DUCBTZXJ2ZXIgZXh0ZW5zaW9uIGxvYWRlZCcpO1xuICAgIFxuICAgIC8vIOWIneWni+WMluW3peWFt+euoeeQhuWZqFxuICAgIHRvb2xNYW5hZ2VyID0gbmV3IFRvb2xNYW5hZ2VyKCk7XG4gICAgXG4gICAgLy8g6K+75Y+W6K6+572u5bm25Yib5bu65pyN5Yqh5a6e5L6LXG4gICAgY29uc3Qgc2V0dGluZ3MgPSBub3JtYWxpemVTZXR0aW5ncyhyZWFkU2V0dGluZ3MoKSk7XG4gICAgbWNwU2VydmVyID0gY3JlYXRlU2VydmVySW5zdGFuY2Uoc2V0dGluZ3MpO1xuICAgIFxuICAgIC8vIOWmguaenOiuvue9ruS6huiHquWKqOWQr+WKqO+8jOWImeWQr+WKqOacjeWKoeWZqFxuICAgIGlmIChzZXR0aW5ncy5hdXRvU3RhcnQpIHtcbiAgICAgICAgbWNwU2VydmVyLnN0YXJ0KCkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBhdXRvLXN0YXJ0IE1DUCBzZXJ2ZXI6JywgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEBlbiBNZXRob2QgdHJpZ2dlcmVkIHdoZW4gdW5pbnN0YWxsaW5nIHRoZSBleHRlbnNpb25cbiAqIEB6aCDljbjovb3mianlsZXml7bop6blj5HnmoTmlrnms5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHtcbiAgICBpZiAobWNwU2VydmVyKSB7XG4gICAgICAgIG1jcFNlcnZlci5zdG9wKCk7XG4gICAgICAgIG1jcFNlcnZlciA9IG51bGw7XG4gICAgfVxufVxuIl19
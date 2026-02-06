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
        Editor.Panel.open('cocos-mcp-server');
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
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBMFVBLG9CQWdCQztBQU1ELHdCQUtDO0FBcldELCtCQUFpQztBQUNqQyw2Q0FBeUM7QUFDekMseUNBQXdEO0FBRXhELHVEQUFtRDtBQU1uRCxNQUFNLHNCQUFzQixHQUFHLGVBQWUsQ0FBQztBQUMvQyxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUM7QUFFOUIsSUFBSSxhQUFhLEdBQXFCLHNCQUFTLENBQUM7QUFDaEQsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQztBQUN2QyxJQUFJLFdBQXdCLENBQUM7QUFFN0IsU0FBUyxpQkFBaUIsQ0FBQyxLQUF1QjtJQUM5QyxNQUFNLFlBQVksR0FBRyxJQUFBLHVCQUFZLEdBQUUsQ0FBQztJQUNwQyxNQUFNLEtBQW1DLEtBQUssSUFBSSxFQUFFLEVBQTlDLEVBQUUsUUFBUSxPQUFvQyxFQUEvQixlQUFlLGNBQTlCLFlBQWdDLENBQWMsQ0FBQztJQUNyRCxNQUFNLGNBQWMsR0FBRyxPQUFPLGVBQWUsQ0FBQyxjQUFjLEtBQUssU0FBUztRQUN0RSxDQUFDLENBQUMsZUFBZSxDQUFDLGNBQWM7UUFDaEMsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFNBQVM7WUFDM0IsQ0FBQyxDQUFDLFFBQVE7WUFDVixDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQztJQUV0QyxxREFDTyxZQUFZLEdBQ1osZUFBZSxLQUNsQixjQUFjLEVBQ2QsY0FBYyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQztZQUN6RCxDQUFDLENBQUMsZUFBZSxDQUFDLGNBQWM7WUFDaEMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxjQUFjLElBQ25DO0FBQ04sQ0FBQztBQUVELFNBQVMsa0JBQWtCO0lBQ3ZCLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENB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TCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiwgc2VwIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBNQ1BTZXJ2ZXIgfSBmcm9tICcuL21jcC1zZXJ2ZXInO1xuaW1wb3J0IHsgcmVhZFNldHRpbmdzLCBzYXZlU2V0dGluZ3MgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IE1DUFNlcnZlclNldHRpbmdzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBUb29sTWFuYWdlciB9IGZyb20gJy4vdG9vbHMvdG9vbC1tYW5hZ2VyJztcblxudHlwZSBJbmNvbWluZ1NldHRpbmdzID0gUGFydGlhbDxNQ1BTZXJ2ZXJTZXR0aW5ncz4gJiB7XG4gICAgZGVidWdMb2c/OiBib29sZWFuO1xufTtcblxuY29uc3QgU0VSVkVSX01PRFVMRV9GSUxFTkFNRSA9ICdtY3Atc2VydmVyLmpzJztcbmNvbnN0IFRPT0xTX0RJUk5BTUUgPSAndG9vbHMnO1xuXG5sZXQgTUNQU2VydmVyQ3RvcjogdHlwZW9mIE1DUFNlcnZlciA9IE1DUFNlcnZlcjtcbmxldCBtY3BTZXJ2ZXI6IE1DUFNlcnZlciB8IG51bGwgPSBudWxsO1xubGV0IHRvb2xNYW5hZ2VyOiBUb29sTWFuYWdlcjtcblxuZnVuY3Rpb24gbm9ybWFsaXplU2V0dGluZ3MoaW5wdXQ6IEluY29taW5nU2V0dGluZ3MpOiBNQ1BTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgY29uc3QgYmFzZVNldHRpbmdzID0gcmVhZFNldHRpbmdzKCk7XG4gICAgY29uc3QgeyBkZWJ1Z0xvZywgLi4ucGFydGlhbFNldHRpbmdzIH0gPSBpbnB1dCB8fCB7fTtcbiAgICBjb25zdCBlbmFibGVEZWJ1Z0xvZyA9IHR5cGVvZiBwYXJ0aWFsU2V0dGluZ3MuZW5hYmxlRGVidWdMb2cgPT09ICdib29sZWFuJ1xuICAgICAgICA/IHBhcnRpYWxTZXR0aW5ncy5lbmFibGVEZWJ1Z0xvZ1xuICAgICAgICA6IHR5cGVvZiBkZWJ1Z0xvZyA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICAgICA/IGRlYnVnTG9nXG4gICAgICAgICAgICA6IGJhc2VTZXR0aW5ncy5lbmFibGVEZWJ1Z0xvZztcblxuICAgIHJldHVybiB7XG4gICAgICAgIC4uLmJhc2VTZXR0aW5ncyxcbiAgICAgICAgLi4ucGFydGlhbFNldHRpbmdzLFxuICAgICAgICBlbmFibGVEZWJ1Z0xvZyxcbiAgICAgICAgYWxsb3dlZE9yaWdpbnM6IEFycmF5LmlzQXJyYXkocGFydGlhbFNldHRpbmdzLmFsbG93ZWRPcmlnaW5zKVxuICAgICAgICAgICAgPyBwYXJ0aWFsU2V0dGluZ3MuYWxsb3dlZE9yaWdpbnNcbiAgICAgICAgICAgIDogYmFzZVNldHRpbmdzLmFsbG93ZWRPcmlnaW5zLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldEN1cnJlbnRTZXR0aW5ncygpOiBNQ1BTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgcmV0dXJuIG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTZXR0aW5ncygpIDogcmVhZFNldHRpbmdzKCk7XG59XG5cbmZ1bmN0aW9uIHN5bmNFbmFibGVkVG9vbHMoc2VydmVyOiBNQ1BTZXJ2ZXIpOiB2b2lkIHtcbiAgICBpZiAoIXRvb2xNYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZW5hYmxlZFRvb2xzID0gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XG4gICAgc2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZXJ2ZXJJbnN0YW5jZShzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3MpOiBNQ1BTZXJ2ZXIge1xuICAgIGNvbnN0IHNlcnZlciA9IG5ldyBNQ1BTZXJ2ZXJDdG9yKHNldHRpbmdzKTtcbiAgICBzeW5jRW5hYmxlZFRvb2xzKHNlcnZlcik7XG4gICAgcmV0dXJuIHNlcnZlcjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVjcmVhdGVTZXJ2ZXIoc2V0dGluZ3M6IE1DUFNlcnZlclNldHRpbmdzLCBzaG91bGRTdGFydDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChtY3BTZXJ2ZXIpIHtcbiAgICAgICAgbWNwU2VydmVyLnN0b3AoKTtcbiAgICB9XG4gICAgbWNwU2VydmVyID0gY3JlYXRlU2VydmVySW5zdGFuY2Uoc2V0dGluZ3MpO1xuICAgIGlmIChzaG91bGRTdGFydCkge1xuICAgICAgICBhd2FpdCBtY3BTZXJ2ZXIuc3RhcnQoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFyU2VydmVyTW9kdWxlQ2FjaGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VydmVyTW9kdWxlUGF0aCA9IGpvaW4oX19kaXJuYW1lLCBTRVJWRVJfTU9EVUxFX0ZJTEVOQU1FKTtcbiAgICBjb25zdCB0b29sc0RpclBhdGggPSBqb2luKF9fZGlybmFtZSwgVE9PTFNfRElSTkFNRSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZFRvb2xzRGlyUGF0aCA9IGAke3Rvb2xzRGlyUGF0aH0ke3NlcH1gO1xuXG4gICAgZm9yIChjb25zdCBtb2R1bGVQYXRoIG9mIE9iamVjdC5rZXlzKHJlcXVpcmUuY2FjaGUpKSB7XG4gICAgICAgIGlmIChtb2R1bGVQYXRoID09PSBzZXJ2ZXJNb2R1bGVQYXRoIHx8IG1vZHVsZVBhdGguc3RhcnRzV2l0aChub3JtYWxpemVkVG9vbHNEaXJQYXRoKSkge1xuICAgICAgICAgICAgZGVsZXRlIHJlcXVpcmUuY2FjaGVbbW9kdWxlUGF0aF07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbG9hZFNlcnZlckNvbnN0cnVjdG9yRnJvbURpc3QoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VydmVyTW9kdWxlUGF0aCA9IGpvaW4oX19kaXJuYW1lLCBTRVJWRVJfTU9EVUxFX0ZJTEVOQU1FKTtcbiAgICBjbGVhclNlcnZlck1vZHVsZUNhY2hlKCk7XG5cbiAgICBjb25zdCBsb2FkZWRNb2R1bGUgPSByZXF1aXJlKHNlcnZlck1vZHVsZVBhdGgpIGFzIHsgTUNQU2VydmVyPzogdHlwZW9mIE1DUFNlcnZlciB9O1xuICAgIGlmICghbG9hZGVkTW9kdWxlIHx8IHR5cGVvZiBsb2FkZWRNb2R1bGUuTUNQU2VydmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihg5peg5rOV5LuOICR7c2VydmVyTW9kdWxlUGF0aH0g5Yqg6L29IE1DUFNlcnZlcmApO1xuICAgIH1cbiAgICBNQ1BTZXJ2ZXJDdG9yID0gbG9hZGVkTW9kdWxlLk1DUFNlcnZlcjtcbn1cblxuLyoqXG4gKiBAZW4gUmVnaXN0cmF0aW9uIG1ldGhvZCBmb3IgdGhlIG1haW4gcHJvY2VzcyBvZiBFeHRlbnNpb25cbiAqIEB6aCDkuLrmianlsZXnmoTkuLvov5vnqIvnmoTms6jlhozmlrnms5VcbiAqL1xuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogKC4uLmFueTogYW55KSA9PiBhbnkgfSA9IHtcbiAgICAvKipcbiAgICAgKiBAZW4gT3BlbiB0aGUgTUNQIHNlcnZlciBwYW5lbFxuICAgICAqIEB6aCDmiZPlvIAgTUNQIOacjeWKoeWZqOmdouadv1xuICAgICAqL1xuICAgIG9wZW5QYW5lbCgpIHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ2NvY29zLW1jcC1zZXJ2ZXInKTtcbiAgICB9LFxuXG5cblxuICAgIC8qKlxuICAgICAqIEBlbiBTdGFydCB0aGUgTUNQIHNlcnZlclxuICAgICAqIEB6aCDlkK/liqggTUNQIOacjeWKoeWZqFxuICAgICAqL1xuICAgIGFzeW5jIHN0YXJ0U2VydmVyKCkge1xuICAgICAgICBpZiAoIW1jcFNlcnZlcikge1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBub3JtYWxpemVTZXR0aW5ncyhyZWFkU2V0dGluZ3MoKSk7XG4gICAgICAgICAgICBtY3BTZXJ2ZXIgPSBjcmVhdGVTZXJ2ZXJJbnN0YW5jZShzZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICAgICAgc3luY0VuYWJsZWRUb29scyhtY3BTZXJ2ZXIpO1xuICAgICAgICBhd2FpdCBtY3BTZXJ2ZXIuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIFN0b3AgdGhlIE1DUCBzZXJ2ZXJcbiAgICAgKiBAemgg5YGc5q2iIE1DUCDmnI3liqHlmahcbiAgICAgKi9cbiAgICBhc3luYyBzdG9wU2VydmVyKCkge1xuICAgICAgICBpZiAobWNwU2VydmVyKSB7XG4gICAgICAgICAgICBtY3BTZXJ2ZXIuc3RvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbTUNQ5o+S5Lu2XSBtY3BTZXJ2ZXIg5pyq5Yid5aeL5YyWJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBzZXJ2ZXIgc3RhdHVzXG4gICAgICogQHpoIOiOt+WPluacjeWKoeWZqOeKtuaAgVxuICAgICAqL1xuICAgIGdldFNlcnZlclN0YXR1cygpIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldFN0YXR1cygpIDogeyBydW5uaW5nOiBmYWxzZSwgcG9ydDogMCwgY2xpZW50czogMCB9O1xuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IGdldEN1cnJlbnRTZXR0aW5ncygpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uc3RhdHVzLFxuICAgICAgICAgICAgc2V0dGluZ3M6IHNldHRpbmdzXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBVcGRhdGUgc2VydmVyIHNldHRpbmdzXG4gICAgICogQHpoIOabtOaWsOacjeWKoeWZqOiuvue9rlxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZVNldHRpbmdzKHNldHRpbmdzOiBJbmNvbWluZ1NldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTZXR0aW5ncyA9IG5vcm1hbGl6ZVNldHRpbmdzKHNldHRpbmdzKTtcbiAgICAgICAgY29uc3Qgc2hvdWxkS2VlcFJ1bm5pbmcgPSBtY3BTZXJ2ZXIgPyBtY3BTZXJ2ZXIuZ2V0U3RhdHVzKCkucnVubmluZyA6IGZhbHNlO1xuICAgICAgICBzYXZlU2V0dGluZ3Mobm9ybWFsaXplZFNldHRpbmdzKTtcbiAgICAgICAgYXdhaXQgcmVjcmVhdGVTZXJ2ZXIobm9ybWFsaXplZFNldHRpbmdzLCBzaG91bGRLZWVwUnVubmluZyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgcnVubmluZzogc2hvdWxkS2VlcFJ1bm5pbmcsXG4gICAgICAgICAgICBzZXR0aW5nczogbm9ybWFsaXplZFNldHRpbmdzLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gUmVzdGFydCBzZXJ2ZXIgd2l0aCBsYXRlc3QgZGlzdC9tY3Atc2VydmVyLmpzXG4gICAgICogQHpoIOS9v+eUqOacgOaWsCBkaXN0L21jcC1zZXJ2ZXIuanMg54Ot6YeN5ZCv5pyN5Yqh5ZmoXG4gICAgICovXG4gICAgYXN5bmMgcmVzdGFydFNlcnZlckZyb21EaXN0KCkge1xuICAgICAgICBjb25zdCBwcmV2aW91c0N0b3IgPSBNQ1BTZXJ2ZXJDdG9yO1xuICAgICAgICBjb25zdCBwcmV2aW91c1NldHRpbmdzID0gbm9ybWFsaXplU2V0dGluZ3MoZ2V0Q3VycmVudFNldHRpbmdzKCkpO1xuICAgICAgICBjb25zdCBwcmV2aW91c1J1bm5pbmdTdGF0ZSA9IG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTdGF0dXMoKS5ydW5uaW5nIDogZmFsc2U7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlbG9hZFNlcnZlckNvbnN0cnVjdG9yRnJvbURpc3QoKTtcbiAgICAgICAgICAgIGF3YWl0IHJlY3JlYXRlU2VydmVyKHByZXZpb3VzU2V0dGluZ3MsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJ1bm5pbmc6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTWFpbl0gRmFpbGVkIHRvIHJlc3RhcnQgc2VydmVyIGZyb20gZGlzdDonLCBlcnJvcik7XG4gICAgICAgICAgICBNQ1BTZXJ2ZXJDdG9yID0gcHJldmlvdXNDdG9yO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlY3JlYXRlU2VydmVyKHByZXZpb3VzU2V0dGluZ3MsIHByZXZpb3VzUnVubmluZ1N0YXRlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHJlc3RvcmVFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNYWluXSBGYWlsZWQgdG8gcmVzdG9yZSBwcmV2aW91cyBzZXJ2ZXIgc3RhdGU6JywgcmVzdG9yZUVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDku44gZGlzdCDng63ph43lkK/lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gR2V0IHRvb2xzIGxpc3RcbiAgICAgKiBAemgg6I635Y+W5bel5YW35YiX6KGoXG4gICAgICovXG4gICAgZ2V0VG9vbHNMaXN0KCkge1xuICAgICAgICByZXR1cm4gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldEF2YWlsYWJsZVRvb2xzKCkgOiBbXTtcbiAgICB9LFxuXG4gICAgZ2V0RmlsdGVyZWRUb29sc0xpc3QoKSB7XG4gICAgICAgIGlmICghbWNwU2VydmVyKSByZXR1cm4gW107XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5blvZPliY3lkK/nlKjnmoTlt6XlhbdcbiAgICAgICAgY29uc3QgZW5hYmxlZFRvb2xzID0gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrBNQ1DmnI3liqHlmajnmoTlkK/nlKjlt6XlhbfliJfooahcbiAgICAgICAgbWNwU2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG1jcFNlcnZlci5nZXRGaWx0ZXJlZFRvb2xzKGVuYWJsZWRUb29scyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBAZW4gR2V0IHNlcnZlciBzZXR0aW5nc1xuICAgICAqIEB6aCDojrflj5bmnI3liqHlmajorr7nva5cbiAgICAgKi9cbiAgICBhc3luYyBnZXRTZXJ2ZXJTZXR0aW5ncygpIHtcbiAgICAgICAgcmV0dXJuIGdldEN1cnJlbnRTZXR0aW5ncygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gR2V0IHNlcnZlciBzZXR0aW5ncyAoYWx0ZXJuYXRpdmUgbWV0aG9kKVxuICAgICAqIEB6aCDojrflj5bmnI3liqHlmajorr7nva7vvIjmm7/ku6Pmlrnms5XvvIlcbiAgICAgKi9cbiAgICBhc3luYyBnZXRTZXR0aW5ncygpIHtcbiAgICAgICAgcmV0dXJuIGdldEN1cnJlbnRTZXR0aW5ncygpO1xuICAgIH0sXG5cbiAgICAvLyDlt6XlhbfnrqHnkIblmajnm7jlhbPmlrnms5VcbiAgICBhc3luYyBnZXRUb29sTWFuYWdlclN0YXRlKCkge1xuICAgICAgICByZXR1cm4gdG9vbE1hbmFnZXIuZ2V0VG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICBhc3luYyBjcmVhdGVUb29sQ29uZmlndXJhdGlvbihuYW1lOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSB0b29sTWFuYWdlci5jcmVhdGVDb25maWd1cmF0aW9uKG5hbWUsIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGlkOiBjb25maWcuaWQsIGNvbmZpZyB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOWIm+W7uumFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHVwZGF0ZVRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcsIHVwZGF0ZXM6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHRvb2xNYW5hZ2VyLnVwZGF0ZUNvbmZpZ3VyYXRpb24oY29uZmlnSWQsIHVwZGF0ZXMpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOabtOaWsOmFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGRlbGV0ZVRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRvb2xNYW5hZ2VyLmRlbGV0ZUNvbmZpZ3VyYXRpb24oY29uZmlnSWQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOWIoOmZpOmFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHNldEN1cnJlbnRUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0b29sTWFuYWdlci5zZXRDdXJyZW50Q29uZmlndXJhdGlvbihjb25maWdJZCk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg6K6+572u5b2T5YmN6YWN572u5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q29uZmlnID0gdG9vbE1hbmFnZXIuZ2V0Q3VycmVudENvbmZpZ3VyYXRpb24oKTtcbiAgICAgICAgICAgIGlmICghY3VycmVudENvbmZpZykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5rKh5pyJ5b2T5YmN6YWN572uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRvb2xNYW5hZ2VyLnVwZGF0ZVRvb2xTdGF0dXMoY3VycmVudENvbmZpZy5pZCwgY2F0ZWdvcnksIHRvb2xOYW1lLCBlbmFibGVkKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pu05pawTUNQ5pyN5Yqh5Zmo55qE5bel5YW35YiX6KGoXG4gICAgICAgICAgICBpZiAobWNwU2VydmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5hYmxlZFRvb2xzID0gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XG4gICAgICAgICAgICAgICAgbWNwU2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5pu05paw5bel5YW354q25oCB5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1c0JhdGNoKHVwZGF0ZXM6IGFueVtdKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW01haW5dIHVwZGF0ZVRvb2xTdGF0dXNCYXRjaCBjYWxsZWQgd2l0aCB1cGRhdGVzIGNvdW50OmAsIHVwZGF0ZXMgPyB1cGRhdGVzLmxlbmd0aCA6IDApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q29uZmlnID0gdG9vbE1hbmFnZXIuZ2V0Q3VycmVudENvbmZpZ3VyYXRpb24oKTtcbiAgICAgICAgICAgIGlmICghY3VycmVudENvbmZpZykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5rKh5pyJ5b2T5YmN6YWN572uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRvb2xNYW5hZ2VyLnVwZGF0ZVRvb2xTdGF0dXNCYXRjaChjdXJyZW50Q29uZmlnLmlkLCB1cGRhdGVzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pu05pawTUNQ5pyN5Yqh5Zmo55qE5bel5YW35YiX6KGoXG4gICAgICAgICAgICBpZiAobWNwU2VydmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5hYmxlZFRvb2xzID0gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XG4gICAgICAgICAgICAgICAgbWNwU2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5om56YeP5pu05paw5bel5YW354q25oCB5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgZXhwb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHsgY29uZmlnSnNvbjogdG9vbE1hbmFnZXIuZXhwb3J0Q29uZmlndXJhdGlvbihjb25maWdJZCkgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlr7zlh7rphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBpbXBvcnRUb29sQ29uZmlndXJhdGlvbihjb25maWdKc29uOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0b29sTWFuYWdlci5pbXBvcnRDb25maWd1cmF0aW9uKGNvbmZpZ0pzb24pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOWvvOWFpemFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGdldEVuYWJsZWRUb29scygpIHtcbiAgICAgICAgcmV0dXJuIHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQGVuIE1ldGhvZCBUcmlnZ2VyZWQgb24gRXh0ZW5zaW9uIFN0YXJ0dXBcbiAqIEB6aCDmianlsZXlkK/liqjml7bop6blj5HnmoTmlrnms5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coJ0NvY29zIE1DUCBTZXJ2ZXIgZXh0ZW5zaW9uIGxvYWRlZCcpO1xuICAgIFxuICAgIC8vIOWIneWni+WMluW3peWFt+euoeeQhuWZqFxuICAgIHRvb2xNYW5hZ2VyID0gbmV3IFRvb2xNYW5hZ2VyKCk7XG4gICAgXG4gICAgLy8g6K+75Y+W6K6+572u5bm25Yib5bu65pyN5Yqh5a6e5L6LXG4gICAgY29uc3Qgc2V0dGluZ3MgPSBub3JtYWxpemVTZXR0aW5ncyhyZWFkU2V0dGluZ3MoKSk7XG4gICAgbWNwU2VydmVyID0gY3JlYXRlU2VydmVySW5zdGFuY2Uoc2V0dGluZ3MpO1xuICAgIFxuICAgIC8vIOWmguaenOiuvue9ruS6huiHquWKqOWQr+WKqO+8jOWImeWQr+WKqOacjeWKoeWZqFxuICAgIGlmIChzZXR0aW5ncy5hdXRvU3RhcnQpIHtcbiAgICAgICAgbWNwU2VydmVyLnN0YXJ0KCkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBhdXRvLXN0YXJ0IE1DUCBzZXJ2ZXI6JywgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEBlbiBNZXRob2QgdHJpZ2dlcmVkIHdoZW4gdW5pbnN0YWxsaW5nIHRoZSBleHRlbnNpb25cbiAqIEB6aCDljbjovb3mianlsZXml7bop6blj5HnmoTmlrnms5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHtcbiAgICBpZiAobWNwU2VydmVyKSB7XG4gICAgICAgIG1jcFNlcnZlci5zdG9wKCk7XG4gICAgICAgIG1jcFNlcnZlciA9IG51bGw7XG4gICAgfVxufVxuIl19
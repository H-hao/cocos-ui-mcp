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
exports.ToolManager = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ToolManager {
    constructor() {
        this.availableTools = [];
        this.settings = this.readToolManagerSettings();
        this.initializeAvailableTools();
        this.migrateConfigurationsToAvailableTools();
        // 如果没有配置，自动创建一个默认配置
        if (this.settings.configurations.length === 0) {
            console.log('[ToolManager] No configurations found, creating default configuration...');
            this.createConfiguration('默认配置', '自动创建的默认工具配置');
        }
    }
    getToolManagerSettingsPath() {
        return path.join(Editor.Project.path, 'settings', 'tool-manager.json');
    }
    ensureSettingsDir() {
        const settingsDir = path.dirname(this.getToolManagerSettingsPath());
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
    }
    readToolManagerSettings() {
        const DEFAULT_TOOL_MANAGER_SETTINGS = {
            configurations: [],
            currentConfigId: '',
            maxConfigSlots: 5
        };
        try {
            this.ensureSettingsDir();
            const settingsFile = this.getToolManagerSettingsPath();
            if (fs.existsSync(settingsFile)) {
                const content = fs.readFileSync(settingsFile, 'utf8');
                return Object.assign(Object.assign({}, DEFAULT_TOOL_MANAGER_SETTINGS), JSON.parse(content));
            }
        }
        catch (e) {
            console.error('Failed to read tool manager settings:', e);
        }
        return DEFAULT_TOOL_MANAGER_SETTINGS;
    }
    migrateConfigurationsToAvailableTools() {
        var _a;
        if (!this.settings.configurations.length || !this.availableTools.length) {
            return;
        }
        let changed = false;
        const now = new Date().toISOString();
        this.settings.configurations = this.settings.configurations.map((config) => {
            const enabledMap = new Map();
            (config.tools || []).forEach((tool) => {
                enabledMap.set(`${tool.category}:${tool.name}`, tool.enabled !== false);
            });
            const nextTools = this.availableTools.map((tool) => {
                const key = `${tool.category}:${tool.name}`;
                return Object.assign(Object.assign({}, tool), { enabled: enabledMap.has(key) ? Boolean(enabledMap.get(key)) : true });
            });
            const sameSize = Array.isArray(config.tools) && config.tools.length === nextTools.length;
            const sameKeys = sameSize && config.tools.every((tool, index) => {
                const next = nextTools[index];
                return tool.category === next.category && tool.name === next.name && tool.enabled === next.enabled;
            });
            if (sameKeys) {
                return config;
            }
            changed = true;
            return Object.assign(Object.assign({}, config), { tools: nextTools, updatedAt: now });
        });
        if (this.settings.currentConfigId) {
            const exists = this.settings.configurations.some((config) => config.id === this.settings.currentConfigId);
            if (!exists) {
                this.settings.currentConfigId = ((_a = this.settings.configurations[0]) === null || _a === void 0 ? void 0 : _a.id) || '';
                changed = true;
            }
        }
        if (changed) {
            this.saveToolManagerSettings(this.settings);
            console.log('[ToolManager] Migrated legacy tool configurations to latest tool set');
        }
    }
    saveToolManagerSettings(settings) {
        try {
            this.ensureSettingsDir();
            const settingsFile = this.getToolManagerSettingsPath();
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
        }
        catch (e) {
            console.error('Failed to save tool manager settings:', e);
            throw e;
        }
    }
    exportToolConfiguration(config) {
        return JSON.stringify(config, null, 2);
    }
    importToolConfiguration(configJson) {
        try {
            const config = JSON.parse(configJson);
            // 验证配置格式
            if (!config.id || !config.name || !Array.isArray(config.tools)) {
                throw new Error('Invalid configuration format');
            }
            return config;
        }
        catch (e) {
            console.error('Failed to parse tool configuration:', e);
            throw new Error('Invalid JSON format or configuration structure');
        }
    }
    initializeAvailableTools() {
        // 从MCP服务器获取真实的工具列表
        try {
            // 导入所有工具类
            const { SceneTools } = require('./scene-tools');
            const { NodeTools } = require('./node-tools');
            const { ComponentTools } = require('./component-tools');
            const { PrefabTools } = require('./prefab-tools');
            const { ProjectTools } = require('./project-tools');
            const { DebugTools } = require('./debug-tools');
            const { PreferencesTools } = require('./preferences-tools');
            const { ServerTools } = require('./server-tools');
            const { BroadcastTools } = require('./broadcast-tools');
            // SceneAdvancedTools functionality has been integrated into NodeTools and SceneTools
            const { SceneViewTools } = require('./scene-view-tools');
            const { ReferenceImageTools } = require('./reference-image-tools');
            const { AssetAdvancedTools } = require('./asset-advanced-tools');
            const { ValidationTools } = require('./validation-tools');
            // 初始化工具实例
            const tools = {
                scene: new SceneTools(),
                node: new NodeTools(),
                component: new ComponentTools(),
                prefab: new PrefabTools(),
                project: new ProjectTools(),
                debug: new DebugTools(),
                preferences: new PreferencesTools(),
                server: new ServerTools(),
                broadcast: new BroadcastTools(),
                // sceneAdvanced functionality has been integrated into node and scene tools
                sceneView: new SceneViewTools(),
                referenceImage: new ReferenceImageTools(),
                assetAdvanced: new AssetAdvancedTools(),
                validation: new ValidationTools()
            };
            // 从每个工具类获取工具列表
            this.availableTools = [];
            for (const [category, toolSet] of Object.entries(tools)) {
                const toolDefinitions = toolSet.getTools();
                toolDefinitions.forEach((tool) => {
                    this.availableTools.push({
                        category: category,
                        name: tool.name,
                        enabled: true, // 默认启用
                        description: tool.description
                    });
                });
            }
            console.log(`[ToolManager] Initialized ${this.availableTools.length} tools from MCP server`);
        }
        catch (error) {
            console.error('[ToolManager] Failed to initialize tools from MCP server:', error);
            // 如果获取失败，使用默认工具列表作为后备
            this.initializeDefaultTools();
        }
    }
    initializeDefaultTools() {
        // 默认工具列表作为后备方案
        const toolCategories = [
            { category: 'scene', name: '场景工具', tools: [
                    { name: 'getCurrentSceneInfo', description: '获取当前场景信息' },
                    { name: 'getSceneHierarchy', description: '获取场景层级结构' },
                    { name: 'createNewScene', description: '创建新场景' },
                    { name: 'saveScene', description: '保存场景' },
                    { name: 'loadScene', description: '加载场景' }
                ] },
            { category: 'node', name: '节点工具', tools: [
                    { name: 'getAllNodes', description: '获取所有节点' },
                    { name: 'findNodeByName', description: '根据名称查找节点' },
                    { name: 'createNode', description: '创建节点' },
                    { name: 'deleteNode', description: '删除节点' },
                    { name: 'setNodeProperty', description: '设置节点属性' },
                    { name: 'getNodeInfo', description: '获取节点信息' }
                ] },
            { category: 'component', name: '组件工具', tools: [
                    { name: 'addComponentToNode', description: '添加组件到节点' },
                    { name: 'removeComponentFromNode', description: '从节点移除组件' },
                    { name: 'setComponentProperty', description: '设置组件属性' },
                    { name: 'getComponentInfo', description: '获取组件信息' }
                ] },
            { category: 'prefab', name: '预制体工具', tools: [
                    { name: 'createPrefabFromNode', description: '从节点创建预制体' },
                    { name: 'instantiatePrefab', description: '实例化预制体' },
                    { name: 'getPrefabInfo', description: '获取预制体信息' },
                    { name: 'savePrefab', description: '保存预制体' }
                ] },
            { category: 'project', name: '项目工具', tools: [
                    { name: 'getProjectInfo', description: '获取项目信息' },
                    { name: 'getAssetList', description: '获取资源列表' },
                    { name: 'createAsset', description: '创建资源' },
                    { name: 'deleteAsset', description: '删除资源' }
                ] },
            { category: 'debug', name: '调试工具', tools: [
                    { name: 'getConsoleLogs', description: '获取控制台日志' },
                    { name: 'getPerformanceStats', description: '获取性能统计' },
                    { name: 'validateScene', description: '验证场景' },
                    { name: 'getErrorLogs', description: '获取错误日志' }
                ] },
            { category: 'preferences', name: '偏好设置工具', tools: [
                    { name: 'getPreferences', description: '获取偏好设置' },
                    { name: 'setPreferences', description: '设置偏好设置' },
                    { name: 'resetPreferences', description: '重置偏好设置' }
                ] },
            { category: 'server', name: '服务器工具', tools: [
                    { name: 'getServerStatus', description: '获取服务器状态' },
                    { name: 'getConnectedClients', description: '获取连接的客户端' },
                    { name: 'getServerLogs', description: '获取服务器日志' }
                ] },
            { category: 'broadcast', name: '广播工具', tools: [
                    { name: 'broadcastMessage', description: '广播消息' },
                    { name: 'getBroadcastHistory', description: '获取广播历史' }
                ] },
            { category: 'sceneView', name: '场景视图工具', tools: [
                    { name: 'getViewportInfo', description: '获取视口信息' },
                    { name: 'setViewportCamera', description: '设置视口相机' },
                    { name: 'focusOnNode', description: '聚焦到节点' }
                ] },
            { category: 'referenceImage', name: '参考图片工具', tools: [
                    { name: 'addReferenceImage', description: '添加参考图片' },
                    { name: 'removeReferenceImage', description: '移除参考图片' },
                    { name: 'getReferenceImages', description: '获取参考图片列表' }
                ] },
            { category: 'assetAdvanced', name: '高级资源工具', tools: [
                    { name: 'importAsset', description: '导入资源' },
                    { name: 'exportAsset', description: '导出资源' },
                    { name: 'processAsset', description: '处理资源' }
                ] },
            { category: 'validation', name: '验证工具', tools: [
                    { name: 'validateProject', description: '验证项目' },
                    { name: 'validateAssets', description: '验证资源' },
                    { name: 'generateReport', description: '生成报告' }
                ] }
        ];
        this.availableTools = [];
        toolCategories.forEach(category => {
            category.tools.forEach(tool => {
                this.availableTools.push({
                    category: category.category,
                    name: tool.name,
                    enabled: true, // 默认启用
                    description: tool.description
                });
            });
        });
        console.log(`[ToolManager] Initialized ${this.availableTools.length} default tools`);
    }
    getAvailableTools() {
        return [...this.availableTools];
    }
    getConfigurations() {
        return [...this.settings.configurations];
    }
    getCurrentConfiguration() {
        if (!this.settings.currentConfigId) {
            return null;
        }
        return this.settings.configurations.find(config => config.id === this.settings.currentConfigId) || null;
    }
    createConfiguration(name, description) {
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }
        const config = {
            id: (0, uuid_1.v4)(),
            name,
            description,
            tools: this.availableTools.map(tool => (Object.assign({}, tool))),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.settings.configurations.push(config);
        this.settings.currentConfigId = config.id;
        this.saveSettings();
        return config;
    }
    updateConfiguration(configId, updates) {
        const configIndex = this.settings.configurations.findIndex(config => config.id === configId);
        if (configIndex === -1) {
            throw new Error('配置不存在');
        }
        const config = this.settings.configurations[configIndex];
        const updatedConfig = Object.assign(Object.assign(Object.assign({}, config), updates), { updatedAt: new Date().toISOString() });
        this.settings.configurations[configIndex] = updatedConfig;
        this.saveSettings();
        return updatedConfig;
    }
    deleteConfiguration(configId) {
        const configIndex = this.settings.configurations.findIndex(config => config.id === configId);
        if (configIndex === -1) {
            throw new Error('配置不存在');
        }
        this.settings.configurations.splice(configIndex, 1);
        // 如果删除的是当前配置，清空当前配置ID
        if (this.settings.currentConfigId === configId) {
            this.settings.currentConfigId = this.settings.configurations.length > 0
                ? this.settings.configurations[0].id
                : '';
        }
        this.saveSettings();
    }
    setCurrentConfiguration(configId) {
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            throw new Error('配置不存在');
        }
        this.settings.currentConfigId = configId;
        this.saveSettings();
    }
    updateToolStatus(configId, category, toolName, enabled) {
        console.log(`Backend: Updating tool status - configId: ${configId}, category: ${category}, toolName: ${toolName}, enabled: ${enabled}`);
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            console.error(`Backend: Config not found with ID: ${configId}`);
            throw new Error('配置不存在');
        }
        console.log(`Backend: Found config: ${config.name}`);
        const tool = config.tools.find(t => t.category === category && t.name === toolName);
        if (!tool) {
            console.error(`Backend: Tool not found - category: ${category}, name: ${toolName}`);
            throw new Error('工具不存在');
        }
        console.log(`Backend: Found tool: ${tool.name}, current enabled: ${tool.enabled}, new enabled: ${enabled}`);
        tool.enabled = enabled;
        config.updatedAt = new Date().toISOString();
        console.log(`Backend: Tool updated, saving settings...`);
        this.saveSettings();
        console.log(`Backend: Settings saved successfully`);
    }
    updateToolStatusBatch(configId, updates) {
        console.log(`Backend: updateToolStatusBatch called with configId: ${configId}`);
        console.log(`Backend: Current configurations count: ${this.settings.configurations.length}`);
        console.log(`Backend: Current config IDs:`, this.settings.configurations.map(c => c.id));
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            console.error(`Backend: Config not found with ID: ${configId}`);
            console.error(`Backend: Available config IDs:`, this.settings.configurations.map(c => c.id));
            throw new Error('配置不存在');
        }
        console.log(`Backend: Found config: ${config.name}, updating ${updates.length} tools`);
        updates.forEach(update => {
            const tool = config.tools.find(t => t.category === update.category && t.name === update.name);
            if (tool) {
                tool.enabled = update.enabled;
            }
        });
        config.updatedAt = new Date().toISOString();
        this.saveSettings();
        console.log(`Backend: Batch update completed successfully`);
    }
    exportConfiguration(configId) {
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            throw new Error('配置不存在');
        }
        return this.exportToolConfiguration(config);
    }
    importConfiguration(configJson) {
        const config = this.importToolConfiguration(configJson);
        // 生成新的ID和时间戳
        config.id = (0, uuid_1.v4)();
        config.createdAt = new Date().toISOString();
        config.updatedAt = new Date().toISOString();
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }
        this.settings.configurations.push(config);
        this.saveSettings();
        return config;
    }
    getEnabledTools() {
        const currentConfig = this.getCurrentConfiguration();
        if (!currentConfig) {
            return this.availableTools.filter(tool => tool.enabled);
        }
        return currentConfig.tools.filter(tool => tool.enabled);
    }
    getToolManagerState() {
        const currentConfig = this.getCurrentConfiguration();
        return {
            success: true,
            availableTools: currentConfig ? currentConfig.tools : this.getAvailableTools(),
            selectedConfigId: this.settings.currentConfigId,
            configurations: this.getConfigurations(),
            maxConfigSlots: this.settings.maxConfigSlots
        };
    }
    saveSettings() {
        console.log(`Backend: Saving settings, current configs count: ${this.settings.configurations.length}`);
        this.saveToolManagerSettings(this.settings);
        console.log(`Backend: Settings saved to file`);
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3Rvb2wtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBb0M7QUFFcEMsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFhLFdBQVc7SUFJcEI7UUFGUSxtQkFBYyxHQUFpQixFQUFFLENBQUM7UUFHdEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMvQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMscUNBQXFDLEVBQUUsQ0FBQztRQUU3QyxvQkFBb0I7UUFDcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQywwRUFBMEUsQ0FBQyxDQUFDO1lBQ3hGLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDcEQsQ0FBQztJQUNMLENBQUM7SUFFTywwQkFBMEI7UUFDOUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFTyxpQkFBaUI7UUFDckIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7WUFDOUIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lB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QyxRQUFRLENBQUMsZUFBZTtZQUMvQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQ3hDLGNBQWMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWM7U0FDL0MsQ0FBQztJQUNOLENBQUM7SUFFTyxZQUFZO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0RBQW9ELElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztDQUNKO0FBcmRELGtDQXFkQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuaW1wb3J0IHsgVG9vbENvbmZpZywgVG9vbENvbmZpZ3VyYXRpb24sIFRvb2xNYW5hZ2VyU2V0dGluZ3MsIFRvb2xEZWZpbml0aW9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIFRvb2xNYW5hZ2VyIHtcbiAgICBwcml2YXRlIHNldHRpbmdzOiBUb29sTWFuYWdlclNldHRpbmdzO1xuICAgIHByaXZhdGUgYXZhaWxhYmxlVG9vbHM6IFRvb2xDb25maWdbXSA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB0aGlzLnJlYWRUb29sTWFuYWdlclNldHRpbmdzKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUF2YWlsYWJsZVRvb2xzKCk7XG4gICAgICAgIHRoaXMubWlncmF0ZUNvbmZpZ3VyYXRpb25zVG9BdmFpbGFibGVUb29scygpO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ6YWN572u77yM6Ieq5Yqo5Yib5bu65LiA5Liq6buY6K6k6YWN572uXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tUb29sTWFuYWdlcl0gTm8gY29uZmlndXJhdGlvbnMgZm91bmQsIGNyZWF0aW5nIGRlZmF1bHQgY29uZmlndXJhdGlvbi4uLicpO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25maWd1cmF0aW9uKCfpu5jorqTphY3nva4nLCAn6Ieq5Yqo5Yib5bu655qE6buY6K6k5bel5YW36YWN572uJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ3NldHRpbmdzJywgJ3Rvb2wtbWFuYWdlci5qc29uJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlbnN1cmVTZXR0aW5nc0RpcigpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2V0dGluZ3NEaXIgPSBwYXRoLmRpcm5hbWUodGhpcy5nZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpKTtcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHNldHRpbmdzRGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHNldHRpbmdzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVhZFRvb2xNYW5hZ2VyU2V0dGluZ3MoKTogVG9vbE1hbmFnZXJTZXR0aW5ncyB7XG4gICAgICAgIGNvbnN0IERFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTOiBUb29sTWFuYWdlclNldHRpbmdzID0ge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbnM6IFtdLFxuICAgICAgICAgICAgY3VycmVudENvbmZpZ0lkOiAnJyxcbiAgICAgICAgICAgIG1heENvbmZpZ1Nsb3RzOiA1XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlU2V0dGluZ3NEaXIoKTtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzRmlsZSA9IHRoaXMuZ2V0VG9vbE1hbmFnZXJTZXR0aW5nc1BhdGgoKTtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHNldHRpbmdzRmlsZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNldHRpbmdzRmlsZSwgJ3V0ZjgnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyAuLi5ERUZBVUxUX1RPT0xfTUFOQUdFUl9TRVRUSU5HUywgLi4uSlNPTi5wYXJzZShjb250ZW50KSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVhZCB0b29sIG1hbmFnZXIgc2V0dGluZ3M6JywgZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIERFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTO1xuICAgIH1cblxuICAgIHByaXZhdGUgbWlncmF0ZUNvbmZpZ3VyYXRpb25zVG9BdmFpbGFibGVUb29scygpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aCB8fCAhdGhpcy5hdmFpbGFibGVUb29scy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zID0gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5tYXAoKGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW5hYmxlZE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBib29sZWFuPigpO1xuICAgICAgICAgICAgKGNvbmZpZy50b29scyB8fCBbXSkuZm9yRWFjaCgodG9vbCkgPT4ge1xuICAgICAgICAgICAgICAgIGVuYWJsZWRNYXAuc2V0KGAke3Rvb2wuY2F0ZWdvcnl9OiR7dG9vbC5uYW1lfWAsIHRvb2wuZW5hYmxlZCAhPT0gZmFsc2UpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5leHRUb29scyA9IHRoaXMuYXZhaWxhYmxlVG9vbHMubWFwKCh0b29sKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gYCR7dG9vbC5jYXRlZ29yeX06JHt0b29sLm5hbWV9YDtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAuLi50b29sLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBlbmFibGVkTWFwLmhhcyhrZXkpID8gQm9vbGVhbihlbmFibGVkTWFwLmdldChrZXkpKSA6IHRydWUsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBzYW1lU2l6ZSA9IEFycmF5LmlzQXJyYXkoY29uZmlnLnRvb2xzKSAmJiBjb25maWcudG9vbHMubGVuZ3RoID09PSBuZXh0VG9vbHMubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3Qgc2FtZUtleXMgPSBzYW1lU2l6ZSAmJiBjb25maWcudG9vbHMuZXZlcnkoKHRvb2wsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IG5leHRUb29sc1tpbmRleF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvb2wuY2F0ZWdvcnkgPT09IG5leHQuY2F0ZWdvcnkgJiYgdG9vbC5uYW1lID09PSBuZXh0Lm5hbWUgJiYgdG9vbC5lbmFibGVkID09PSBuZXh0LmVuYWJsZWQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHNhbWVLZXlzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLmNvbmZpZyxcbiAgICAgICAgICAgICAgICB0b29sczogbmV4dFRvb2xzLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogbm93LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdHMgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLnNvbWUoKGNvbmZpZykgPT4gY29uZmlnLmlkID09PSB0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0cykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkID0gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9uc1swXT8uaWQgfHwgJyc7XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy5zYXZlVG9vbE1hbmFnZXJTZXR0aW5ncyh0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVG9vbE1hbmFnZXJdIE1pZ3JhdGVkIGxlZ2FjeSB0b29sIGNvbmZpZ3VyYXRpb25zIHRvIGxhdGVzdCB0b29sIHNldCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzYXZlVG9vbE1hbmFnZXJTZXR0aW5ncyhzZXR0aW5nczogVG9vbE1hbmFnZXJTZXR0aW5ncyk6IHZvaWQge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVTZXR0aW5nc0RpcigpO1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NGaWxlID0gdGhpcy5nZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpO1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhzZXR0aW5nc0ZpbGUsIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHRvb2wgbWFuYWdlciBzZXR0aW5nczonLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZzogVG9vbENvbmZpZ3VyYXRpb24pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGltcG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0pzb246IHN0cmluZyk6IFRvb2xDb25maWd1cmF0aW9uIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnSnNvbik7XG4gICAgICAgICAgICAvLyDpqozor4HphY3nva7moLzlvI9cbiAgICAgICAgICAgIGlmICghY29uZmlnLmlkIHx8ICFjb25maWcubmFtZSB8fCAhQXJyYXkuaXNBcnJheShjb25maWcudG9vbHMpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbmZpZ3VyYXRpb24gZm9ybWF0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgdG9vbCBjb25maWd1cmF0aW9uOicsIGUpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEpTT04gZm9ybWF0IG9yIGNvbmZpZ3VyYXRpb24gc3RydWN0dXJlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRpYWxpemVBdmFpbGFibGVUb29scygpOiB2b2lkIHtcbiAgICAgICAgLy8g5LuOTUNQ5pyN5Yqh5Zmo6I635Y+W55yf5a6e55qE5bel5YW35YiX6KGoXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlr7zlhaXmiYDmnInlt6XlhbfnsbtcbiAgICAgICAgICAgIGNvbnN0IHsgU2NlbmVUb29scyB9ID0gcmVxdWlyZSgnLi9zY2VuZS10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBOb2RlVG9vbHMgfSA9IHJlcXVpcmUoJy4vbm9kZS10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBDb21wb25lbnRUb29scyB9ID0gcmVxdWlyZSgnLi9jb21wb25lbnQtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgUHJlZmFiVG9vbHMgfSA9IHJlcXVpcmUoJy4vcHJlZmFiLXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IFByb2plY3RUb29scyB9ID0gcmVxdWlyZSgnLi9wcm9qZWN0LXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IERlYnVnVG9vbHMgfSA9IHJlcXVpcmUoJy4vZGVidWctdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgUHJlZmVyZW5jZXNUb29scyB9ID0gcmVxdWlyZSgnLi9wcmVmZXJlbmNlcy10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBTZXJ2ZXJUb29scyB9ID0gcmVxdWlyZSgnLi9zZXJ2ZXItdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgQnJvYWRjYXN0VG9vbHMgfSA9IHJlcXVpcmUoJy4vYnJvYWRjYXN0LXRvb2xzJyk7XG4gICAgICAgICAgICAvLyBTY2VuZUFkdmFuY2VkVG9vbHMgZnVuY3Rpb25hbGl0eSBoYXMgYmVlbiBpbnRlZ3JhdGVkIGludG8gTm9kZVRvb2xzIGFuZCBTY2VuZVRvb2xzXG4gICAgICAgICAgICBjb25zdCB7IFNjZW5lVmlld1Rvb2xzIH0gPSByZXF1aXJlKCcuL3NjZW5lLXZpZXctdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgUmVmZXJlbmNlSW1hZ2VUb29scyB9ID0gcmVxdWlyZSgnLi9yZWZlcmVuY2UtaW1hZ2UtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgQXNzZXRBZHZhbmNlZFRvb2xzIH0gPSByZXF1aXJlKCcuL2Fzc2V0LWFkdmFuY2VkLXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IFZhbGlkYXRpb25Ub29scyB9ID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uLXRvb2xzJyk7XG5cbiAgICAgICAgICAgIC8vIOWIneWni+WMluW3peWFt+WunuS+i1xuICAgICAgICAgICAgY29uc3QgdG9vbHMgPSB7XG4gICAgICAgICAgICAgICAgc2NlbmU6IG5ldyBTY2VuZVRvb2xzKCksXG4gICAgICAgICAgICAgICAgbm9kZTogbmV3IE5vZGVUb29scygpLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFRvb2xzKCksXG4gICAgICAgICAgICAgICAgcHJlZmFiOiBuZXcgUHJlZmFiVG9vbHMoKSxcbiAgICAgICAgICAgICAgICBwcm9qZWN0OiBuZXcgUHJvamVjdFRvb2xzKCksXG4gICAgICAgICAgICAgICAgZGVidWc6IG5ldyBEZWJ1Z1Rvb2xzKCksXG4gICAgICAgICAgICAgICAgcHJlZmVyZW5jZXM6IG5ldyBQcmVmZXJlbmNlc1Rvb2xzKCksXG4gICAgICAgICAgICAgICAgc2VydmVyOiBuZXcgU2VydmVyVG9vbHMoKSxcbiAgICAgICAgICAgICAgICBicm9hZGNhc3Q6IG5ldyBCcm9hZGNhc3RUb29scygpLFxuICAgICAgICAgICAgICAgIC8vIHNjZW5lQWR2YW5jZWQgZnVuY3Rpb25hbGl0eSBoYXMgYmVlbiBpbnRlZ3JhdGVkIGludG8gbm9kZSBhbmQgc2NlbmUgdG9vbHNcbiAgICAgICAgICAgICAgICBzY2VuZVZpZXc6IG5ldyBTY2VuZVZpZXdUb29scygpLFxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZUltYWdlOiBuZXcgUmVmZXJlbmNlSW1hZ2VUb29scygpLFxuICAgICAgICAgICAgICAgIGFzc2V0QWR2YW5jZWQ6IG5ldyBBc3NldEFkdmFuY2VkVG9vbHMoKSxcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiBuZXcgVmFsaWRhdGlvblRvb2xzKClcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIOS7juavj+S4quW3peWFt+exu+iOt+WPluW3peWFt+WIl+ihqFxuICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scyA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBbY2F0ZWdvcnksIHRvb2xTZXRdIG9mIE9iamVjdC5lbnRyaWVzKHRvb2xzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xEZWZpbml0aW9ucyA9IHRvb2xTZXQuZ2V0VG9vbHMoKTtcbiAgICAgICAgICAgICAgICB0b29sRGVmaW5pdGlvbnMuZm9yRWFjaCgodG9vbDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlVG9vbHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0b29sLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLCAvLyDpu5jorqTlkK/nlKhcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB0b29sLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1Rvb2xNYW5hZ2VyXSBJbml0aWFsaXplZCAke3RoaXMuYXZhaWxhYmxlVG9vbHMubGVuZ3RofSB0b29scyBmcm9tIE1DUCBzZXJ2ZXJgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tUb29sTWFuYWdlcl0gRmFpbGVkIHRvIGluaXRpYWxpemUgdG9vbHMgZnJvbSBNQ1Agc2VydmVyOicsIGVycm9yKTtcbiAgICAgICAgICAgIC8vIOWmguaenOiOt+WPluWksei0pe+8jOS9v+eUqOm7mOiupOW3peWFt+WIl+ihqOS9nOS4uuWQjuWkh1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplRGVmYXVsdFRvb2xzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRpYWxpemVEZWZhdWx0VG9vbHMoKTogdm9pZCB7XG4gICAgICAgIC8vIOm7mOiupOW3peWFt+WIl+ihqOS9nOS4uuWQjuWkh+aWueahiFxuICAgICAgICBjb25zdCB0b29sQ2F0ZWdvcmllcyA9IFtcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzY2VuZScsIG5hbWU6ICflnLrmma/lt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldEN1cnJlbnRTY2VuZUluZm8nLCBkZXNjcmlwdGlvbjogJ+iOt+WPluW9k+WJjeWcuuaZr+S/oeaBrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRTY2VuZUhpZXJhcmNoeScsIGRlc2NyaXB0aW9uOiAn6I635Y+W5Zy65pmv5bGC57qn57uT5p6EJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NyZWF0ZU5ld1NjZW5lJywgZGVzY3JpcHRpb246ICfliJvlu7rmlrDlnLrmma8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnc2F2ZVNjZW5lJywgZGVzY3JpcHRpb246ICfkv53lrZjlnLrmma8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnbG9hZFNjZW5lJywgZGVzY3JpcHRpb246ICfliqDovb3lnLrmma8nIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ25vZGUnLCBuYW1lOiAn6IqC54K55bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRBbGxOb2RlcycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5omA5pyJ6IqC54K5JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2ZpbmROb2RlQnlOYW1lJywgZGVzY3JpcHRpb246ICfmoLnmja7lkI3np7Dmn6Xmib7oioLngrknIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnY3JlYXRlTm9kZScsIGRlc2NyaXB0aW9uOiAn5Yib5bu66IqC54K5JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2RlbGV0ZU5vZGUnLCBkZXNjcmlwdGlvbjogJ+WIoOmZpOiKgueCuScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdzZXROb2RlUHJvcGVydHknLCBkZXNjcmlwdGlvbjogJ+iuvue9ruiKgueCueWxnuaApycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXROb2RlSW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W6IqC54K55L+h5oGvJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdjb21wb25lbnQnLCBuYW1lOiAn57uE5Lu25bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdhZGRDb21wb25lbnRUb05vZGUnLCBkZXNjcmlwdGlvbjogJ+a3u+WKoOe7hOS7tuWIsOiKgueCuScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdyZW1vdmVDb21wb25lbnRGcm9tTm9kZScsIGRlc2NyaXB0aW9uOiAn5LuO6IqC54K556e76Zmk57uE5Lu2JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NldENvbXBvbmVudFByb3BlcnR5JywgZGVzY3JpcHRpb246ICforr7nva7nu4Tku7blsZ7mgKcnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0Q29tcG9uZW50SW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W57uE5Lu25L+h5oGvJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdwcmVmYWInLCBuYW1lOiAn6aKE5Yi25L2T5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdjcmVhdGVQcmVmYWJGcm9tTm9kZScsIGRlc2NyaXB0aW9uOiAn5LuO6IqC54K55Yib5bu66aKE5Yi25L2TJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2luc3RhbnRpYXRlUHJlZmFiJywgZGVzY3JpcHRpb246ICflrp7kvovljJbpooTliLbkvZMnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0UHJlZmFiSW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W6aKE5Yi25L2T5L+h5oGvJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NhdmVQcmVmYWInLCBkZXNjcmlwdGlvbjogJ+S/neWtmOmihOWItuS9kycgfVxuICAgICAgICAgICAgXX0sXG4gICAgICAgICAgICB7IGNhdGVnb3J5OiAncHJvamVjdCcsIG5hbWU6ICfpobnnm67lt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldFByb2plY3RJbmZvJywgZGVzY3JpcHRpb246ICfojrflj5bpobnnm67kv6Hmga8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0QXNzZXRMaXN0JywgZGVzY3JpcHRpb246ICfojrflj5botYTmupDliJfooagnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnY3JlYXRlQXNzZXQnLCBkZXNjcmlwdGlvbjogJ+WIm+W7uui1hOa6kCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdkZWxldGVBc3NldCcsIGRlc2NyaXB0aW9uOiAn5Yig6Zmk6LWE5rqQJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdkZWJ1ZycsIG5hbWU6ICfosIPor5Xlt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldENvbnNvbGVMb2dzJywgZGVzY3JpcHRpb246ICfojrflj5bmjqfliLblj7Dml6Xlv5cnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0UGVyZm9ybWFuY2VTdGF0cycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5oCn6IO957uf6K6hJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3ZhbGlkYXRlU2NlbmUnLCBkZXNjcmlwdGlvbjogJ+mqjOivgeWcuuaZrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRFcnJvckxvZ3MnLCBkZXNjcmlwdGlvbjogJ+iOt+WPlumUmeivr+aXpeW/lycgfVxuICAgICAgICAgICAgXX0sXG4gICAgICAgICAgICB7IGNhdGVnb3J5OiAncHJlZmVyZW5jZXMnLCBuYW1lOiAn5YGP5aW96K6+572u5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRQcmVmZXJlbmNlcycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5YGP5aW96K6+572uJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NldFByZWZlcmVuY2VzJywgZGVzY3JpcHRpb246ICforr7nva7lgY/lpb3orr7nva4nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAncmVzZXRQcmVmZXJlbmNlcycsIGRlc2NyaXB0aW9uOiAn6YeN572u5YGP5aW96K6+572uJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzZXJ2ZXInLCBuYW1lOiAn5pyN5Yqh5Zmo5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRTZXJ2ZXJTdGF0dXMnLCBkZXNjcmlwdGlvbjogJ+iOt+WPluacjeWKoeWZqOeKtuaAgScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRDb25uZWN0ZWRDbGllbnRzJywgZGVzY3JpcHRpb246ICfojrflj5bov57mjqXnmoTlrqLmiLfnq68nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0U2VydmVyTG9ncycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5pyN5Yqh5Zmo5pel5b+XJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdicm9hZGNhc3QnLCBuYW1lOiAn5bm/5pKt5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdicm9hZGNhc3RNZXNzYWdlJywgZGVzY3JpcHRpb246ICflub/mkq3mtojmga8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0QnJvYWRjYXN0SGlzdG9yeScsIGRlc2NyaXB0aW9uOiAn6I635Y+W5bm/5pKt5Y6G5Y+yJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzY2VuZVZpZXcnLCBuYW1lOiAn5Zy65pmv6KeG5Zu+5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRWaWV3cG9ydEluZm8nLCBkZXNjcmlwdGlvbjogJ+iOt+WPluinhuWPo+S/oeaBrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdzZXRWaWV3cG9ydENhbWVyYScsIGRlc2NyaXB0aW9uOiAn6K6+572u6KeG5Y+j55u45py6JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2ZvY3VzT25Ob2RlJywgZGVzY3JpcHRpb246ICfogZrnhKbliLDoioLngrknIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ3JlZmVyZW5jZUltYWdlJywgbmFtZTogJ+WPguiAg+WbvueJh+W3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnYWRkUmVmZXJlbmNlSW1hZ2UnLCBkZXNjcmlwdGlvbjogJ+a3u+WKoOWPguiAg+WbvueJhycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdyZW1vdmVSZWZlcmVuY2VJbWFnZScsIGRlc2NyaXB0aW9uOiAn56e76Zmk5Y+C6ICD5Zu+54mHJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldFJlZmVyZW5jZUltYWdlcycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5Y+C6ICD5Zu+54mH5YiX6KGoJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdhc3NldEFkdmFuY2VkJywgbmFtZTogJ+mrmOe6p+i1hOa6kOW3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnaW1wb3J0QXNzZXQnLCBkZXNjcmlwdGlvbjogJ+WvvOWFpei1hOa6kCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdleHBvcnRBc3NldCcsIGRlc2NyaXB0aW9uOiAn5a+85Ye66LWE5rqQJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3Byb2Nlc3NBc3NldCcsIGRlc2NyaXB0aW9uOiAn5aSE55CG6LWE5rqQJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICd2YWxpZGF0aW9uJywgbmFtZTogJ+mqjOivgeW3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAndmFsaWRhdGVQcm9qZWN0JywgZGVzY3JpcHRpb246ICfpqozor4Hpobnnm64nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAndmFsaWRhdGVBc3NldHMnLCBkZXNjcmlwdGlvbjogJ+mqjOivgei1hOa6kCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZW5lcmF0ZVJlcG9ydCcsIGRlc2NyaXB0aW9uOiAn55Sf5oiQ5oql5ZGKJyB9XG4gICAgICAgICAgICBdfVxuICAgICAgICBdO1xuXG4gICAgICAgIHRoaXMuYXZhaWxhYmxlVG9vbHMgPSBbXTtcbiAgICAgICAgdG9vbENhdGVnb3JpZXMuZm9yRWFjaChjYXRlZ29yeSA9PiB7XG4gICAgICAgICAgICBjYXRlZ29yeS50b29scy5mb3JFYWNoKHRvb2wgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlVG9vbHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeS5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdG9vbC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLCAvLyDpu5jorqTlkK/nlKhcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRvb2wuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgW1Rvb2xNYW5hZ2VyXSBJbml0aWFsaXplZCAke3RoaXMuYXZhaWxhYmxlVG9vbHMubGVuZ3RofSBkZWZhdWx0IHRvb2xzYCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEF2YWlsYWJsZVRvb2xzKCk6IFRvb2xDb25maWdbXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5hdmFpbGFibGVUb29sc107XG4gICAgfVxuXG4gICAgcHVibGljIGdldENvbmZpZ3VyYXRpb25zKCk6IFRvb2xDb25maWd1cmF0aW9uW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnNdO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDdXJyZW50Q29uZmlndXJhdGlvbigpOiBUb29sQ29uZmlndXJhdGlvbiB8IG51bGwge1xuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5maW5kKGNvbmZpZyA9PiBjb25maWcuaWQgPT09IHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkKSB8fCBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVDb25maWd1cmF0aW9uKG5hbWU6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBUb29sQ29uZmlndXJhdGlvbiB7XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aCA+PSB0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOW3sui+vuWIsOacgOWkp+mFjee9ruanveS9jeaVsOmHjyAoJHt0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzfSlgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbmZpZzogVG9vbENvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgICAgICBpZDogdXVpZHY0KCksXG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICB0b29sczogdGhpcy5hdmFpbGFibGVUb29scy5tYXAodG9vbCA9PiAoeyAuLi50b29sIH0pKSxcbiAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLnB1c2goY29uZmlnKTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQgPSBjb25maWcuaWQ7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nLCB1cGRhdGVzOiBQYXJ0aWFsPFRvb2xDb25maWd1cmF0aW9uPik6IFRvb2xDb25maWd1cmF0aW9uIHtcbiAgICAgICAgY29uc3QgY29uZmlnSW5kZXggPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmRJbmRleChjb25maWcgPT4gY29uZmlnLmlkID09PSBjb25maWdJZCk7XG4gICAgICAgIGlmIChjb25maWdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6YWN572u5LiN5a2Y5ZyoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zW2NvbmZpZ0luZGV4XTtcbiAgICAgICAgY29uc3QgdXBkYXRlZENvbmZpZzogVG9vbENvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgICAgICAuLi5jb25maWcsXG4gICAgICAgICAgICAuLi51cGRhdGVzLFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zW2NvbmZpZ0luZGV4XSA9IHVwZGF0ZWRDb25maWc7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG5cbiAgICAgICAgcmV0dXJuIHVwZGF0ZWRDb25maWc7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZUNvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb25maWdJbmRleCA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZEluZGV4KGNvbmZpZyA9PiBjb25maWcuaWQgPT09IGNvbmZpZ0lkKTtcbiAgICAgICAgaWYgKGNvbmZpZ0luZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuc3BsaWNlKGNvbmZpZ0luZGV4LCAxKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOWIoOmZpOeahOaYr+W9k+WJjemFjee9ru+8jOa4heepuuW9k+WJjemFjee9rklEXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCA9PT0gY29uZmlnSWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkID0gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5sZW5ndGggPiAwIFxuICAgICAgICAgICAgICAgID8gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9uc1swXS5pZCBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Q3VycmVudENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gY29uZmlnSWQpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkID0gY29uZmlnSWQ7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZVRvb2xTdGF0dXMoY29uZmlnSWQ6IHN0cmluZywgY2F0ZWdvcnk6IHN0cmluZywgdG9vbE5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogVXBkYXRpbmcgdG9vbCBzdGF0dXMgLSBjb25maWdJZDogJHtjb25maWdJZH0sIGNhdGVnb3J5OiAke2NhdGVnb3J5fSwgdG9vbE5hbWU6ICR7dG9vbE5hbWV9LCBlbmFibGVkOiAke2VuYWJsZWR9YCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gY29uZmlnSWQpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQmFja2VuZDogQ29uZmlnIG5vdCBmb3VuZCB3aXRoIElEOiAke2NvbmZpZ0lkfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBGb3VuZCBjb25maWc6ICR7Y29uZmlnLm5hbWV9YCk7XG5cbiAgICAgICAgY29uc3QgdG9vbCA9IGNvbmZpZy50b29scy5maW5kKHQgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkgJiYgdC5uYW1lID09PSB0b29sTmFtZSk7XG4gICAgICAgIGlmICghdG9vbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQmFja2VuZDogVG9vbCBub3QgZm91bmQgLSBjYXRlZ29yeTogJHtjYXRlZ29yeX0sIG5hbWU6ICR7dG9vbE5hbWV9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W3peWFt+S4jeWtmOWcqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IEZvdW5kIHRvb2w6ICR7dG9vbC5uYW1lfSwgY3VycmVudCBlbmFibGVkOiAke3Rvb2wuZW5hYmxlZH0sIG5ldyBlbmFibGVkOiAke2VuYWJsZWR9YCk7XG4gICAgICAgIFxuICAgICAgICB0b29sLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICBjb25maWcudXBkYXRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IFRvb2wgdXBkYXRlZCwgc2F2aW5nIHNldHRpbmdzLi4uYCk7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBTZXR0aW5ncyBzYXZlZCBzdWNjZXNzZnVsbHlgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlVG9vbFN0YXR1c0JhdGNoKGNvbmZpZ0lkOiBzdHJpbmcsIHVwZGF0ZXM6IHsgY2F0ZWdvcnk6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBlbmFibGVkOiBib29sZWFuIH1bXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogdXBkYXRlVG9vbFN0YXR1c0JhdGNoIGNhbGxlZCB3aXRoIGNvbmZpZ0lkOiAke2NvbmZpZ0lkfWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogQ3VycmVudCBjb25maWd1cmF0aW9ucyBjb3VudDogJHt0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aH1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IEN1cnJlbnQgY29uZmlnIElEczpgLCB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLm1hcChjID0+IGMuaWQpKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZChjb25maWcgPT4gY29uZmlnLmlkID09PSBjb25maWdJZCk7XG4gICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWNrZW5kOiBDb25maWcgbm90IGZvdW5kIHdpdGggSUQ6ICR7Y29uZmlnSWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWNrZW5kOiBBdmFpbGFibGUgY29uZmlnIElEczpgLCB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLm1hcChjID0+IGMuaWQpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6YWN572u5LiN5a2Y5ZyoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogRm91bmQgY29uZmlnOiAke2NvbmZpZy5uYW1lfSwgdXBkYXRpbmcgJHt1cGRhdGVzLmxlbmd0aH0gdG9vbHNgKTtcblxuICAgICAgICB1cGRhdGVzLmZvckVhY2godXBkYXRlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRvb2wgPSBjb25maWcudG9vbHMuZmluZCh0ID0+IHQuY2F0ZWdvcnkgPT09IHVwZGF0ZS5jYXRlZ29yeSAmJiB0Lm5hbWUgPT09IHVwZGF0ZS5uYW1lKTtcbiAgICAgICAgICAgIGlmICh0b29sKSB7XG4gICAgICAgICAgICAgICAgdG9vbC5lbmFibGVkID0gdXBkYXRlLmVuYWJsZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbmZpZy51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBCYXRjaCB1cGRhdGUgY29tcGxldGVkIHN1Y2Nlc3NmdWxseWApO1xuICAgIH1cblxuICAgIHB1YmxpYyBleHBvcnRDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gY29uZmlnSWQpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgcHVibGljIGltcG9ydENvbmZpZ3VyYXRpb24oY29uZmlnSnNvbjogc3RyaW5nKTogVG9vbENvbmZpZ3VyYXRpb24ge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmltcG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0pzb24pO1xuICAgICAgICBcbiAgICAgICAgLy8g55Sf5oiQ5paw55qESUTlkozml7bpl7TmiLNcbiAgICAgICAgY29uZmlnLmlkID0gdXVpZHY0KCk7XG4gICAgICAgIGNvbmZpZy5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIGNvbmZpZy51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RoID49IHRoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5bey6L6+5Yiw5pyA5aSn6YWN572u5qe95L2N5pWw6YePICgke3RoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHN9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5wdXNoKGNvbmZpZyk7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RW5hYmxlZFRvb2xzKCk6IFRvb2xDb25maWdbXSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRDb25maWcgPSB0aGlzLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgIGlmICghY3VycmVudENvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXZhaWxhYmxlVG9vbHMuZmlsdGVyKHRvb2wgPT4gdG9vbC5lbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudENvbmZpZy50b29scy5maWx0ZXIodG9vbCA9PiB0b29sLmVuYWJsZWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUb29sTWFuYWdlclN0YXRlKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50Q29uZmlnID0gdGhpcy5nZXRDdXJyZW50Q29uZmlndXJhdGlvbigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzOiBjdXJyZW50Q29uZmlnID8gY3VycmVudENvbmZpZy50b29scyA6IHRoaXMuZ2V0QXZhaWxhYmxlVG9vbHMoKSxcbiAgICAgICAgICAgIHNlbGVjdGVkQ29uZmlnSWQ6IHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbnM6IHRoaXMuZ2V0Q29uZmlndXJhdGlvbnMoKSxcbiAgICAgICAgICAgIG1heENvbmZpZ1Nsb3RzOiB0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzYXZlU2V0dGluZ3MoKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBTYXZpbmcgc2V0dGluZ3MsIGN1cnJlbnQgY29uZmlncyBjb3VudDogJHt0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aH1gKTtcbiAgICAgICAgdGhpcy5zYXZlVG9vbE1hbmFnZXJTZXR0aW5ncyh0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IFNldHRpbmdzIHNhdmVkIHRvIGZpbGVgKTtcbiAgICB9XG59IFxuIl19
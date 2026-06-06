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
const schema_hash_1 = require("../ui-graph/schema-hash");
const schema_1 = require("../ui-graph/schema");
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
        return path.join(Editor.Project.path, 'settings', 'ben-cocos-mcp-tool-manager.json');
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
                return Object.assign(Object.assign({}, tool), { enabled: enabledMap.has(key) ? Boolean(enabledMap.get(key)) : tool.category === 'uiGraph' });
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
            const { UiGraphTools } = require('./ui-graph-tools');
            // 初始化工具实例
            const tools = {
                uiGraph: new UiGraphTools(),
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
                        enabled: category === 'uiGraph', // 默认只启用 UI Graph 高层工具，legacy 可手动开启
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
            { category: 'uiGraph', name: 'UI Graph 生产线', tools: [
                    { name: 'get_project_ui_context', description: '查询 UI Graph 项目上下文' },
                    { name: 'inspect_ui_graph', description: '查询 UI 层级摘要' },
                    { name: 'export_ui_graph', description: '导出 UI Graph' },
                    { name: 'validate_ui_graph', description: '校验 Graph/Patch' },
                    { name: 'generate_prefab_from_graph', description: '根据 Graph 生成 Prefab' },
                    { name: 'apply_ui_patch', description: '应用 UI Patch' },
                    { name: 'instantiate_prefab_to_scene', description: '实例化 Prefab 到 Scene' },
                    { name: 'resolve_assets', description: '解析 UI 资源引用' }
                ] },
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
                    enabled: category.category === 'uiGraph', // fallback 同样默认只启用 UI Graph
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
            maxConfigSlots: this.settings.maxConfigSlots,
            uiGraphProtocol: {
                graphSchemaVersion: schema_1.UI_GRAPH_SCHEMA_VERSION,
                patchSchemaVersion: schema_1.UI_PATCH_SCHEMA_VERSION,
                schemaHash: (0, schema_hash_1.getSchemaHash)(),
                supportedSkillVersion: schema_1.UI_GRAPH_SKILL_VERSION,
                pluginVersion: schema_1.UI_GRAPH_PLUGIN_VERSION,
                skillVersionMatched: true
            }
        };
    }
    saveSettings() {
        console.log(`Backend: Saving settings, current configs count: ${this.settings.configurations.length}`);
        this.saveToolManagerSettings(this.settings);
        console.log(`Backend: Settings saved to file`);
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3Rvb2wtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBb0M7QUFFcEMsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3Qix5REFBd0Q7QUFDeEQsK0NBQXVJO0FBRXZJLE1BQWEsV0FBVztJQUlwQjtRQUZRLG1CQUFjLEdBQWlCLEVBQUUsQ0FBQztRQUd0QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQy9DLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDO1FBRTdDLG9CQUFvQjtRQUNwQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLDBFQUEwRSxDQUFDLENBQUM7WUFDeEYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNwRCxDQUFDO0lBQ0wsQ0FBQztJQUVPLDBCQUEwQjtRQUM5QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLGlDQUFpQyxDQUFDLENBQUM7SUFDekYsQ0FBQztJQUVPLGlCQUFpQjtRQUNyQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUM5QixFQUFFLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVB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QXNCO2dCQUM3QyxhQUFhLEVBQUUsZ0NBQXVCO2dCQUN0QyxtQkFBbUIsRUFBRSxJQUFJO2FBQzVCO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFTyxZQUFZO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0RBQW9ELElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztDQUNKO0FBemVELGtDQXllQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuaW1wb3J0IHsgVG9vbENvbmZpZywgVG9vbENvbmZpZ3VyYXRpb24sIFRvb2xNYW5hZ2VyU2V0dGluZ3MsIFRvb2xEZWZpbml0aW9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGdldFNjaGVtYUhhc2ggfSBmcm9tICcuLi91aS1ncmFwaC9zY2hlbWEtaGFzaCc7XG5pbXBvcnQgeyBVSV9HUkFQSF9QTFVHSU5fVkVSU0lPTiwgVUlfR1JBUEhfU0NIRU1BX1ZFUlNJT04sIFVJX0dSQVBIX1NLSUxMX1ZFUlNJT04sIFVJX1BBVENIX1NDSEVNQV9WRVJTSU9OIH0gZnJvbSAnLi4vdWktZ3JhcGgvc2NoZW1hJztcblxuZXhwb3J0IGNsYXNzIFRvb2xNYW5hZ2VyIHtcbiAgICBwcml2YXRlIHNldHRpbmdzOiBUb29sTWFuYWdlclNldHRpbmdzO1xuICAgIHByaXZhdGUgYXZhaWxhYmxlVG9vbHM6IFRvb2xDb25maWdbXSA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB0aGlzLnJlYWRUb29sTWFuYWdlclNldHRpbmdzKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUF2YWlsYWJsZVRvb2xzKCk7XG4gICAgICAgIHRoaXMubWlncmF0ZUNvbmZpZ3VyYXRpb25zVG9BdmFpbGFibGVUb29scygpO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ6YWN572u77yM6Ieq5Yqo5Yib5bu65LiA5Liq6buY6K6k6YWN572uXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tUb29sTWFuYWdlcl0gTm8gY29uZmlndXJhdGlvbnMgZm91bmQsIGNyZWF0aW5nIGRlZmF1bHQgY29uZmlndXJhdGlvbi4uLicpO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25maWd1cmF0aW9uKCfpu5jorqTphY3nva4nLCAn6Ieq5Yqo5Yib5bu655qE6buY6K6k5bel5YW36YWN572uJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ3NldHRpbmdzJywgJ2Jlbi1jb2Nvcy1tY3AtdG9vbC1tYW5hZ2VyLmpzb24nKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGVuc3VyZVNldHRpbmdzRGlyKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzZXR0aW5nc0RpciA9IHBhdGguZGlybmFtZSh0aGlzLmdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCkpO1xuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoc2V0dGluZ3NEaXIpKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoc2V0dGluZ3NEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWFkVG9vbE1hbmFnZXJTZXR0aW5ncygpOiBUb29sTWFuYWdlclNldHRpbmdzIHtcbiAgICAgICAgY29uc3QgREVGQVVMVF9UT09MX01BTkFHRVJfU0VUVElOR1M6IFRvb2xNYW5hZ2VyU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uczogW10sXG4gICAgICAgICAgICBjdXJyZW50Q29uZmlnSWQ6ICcnLFxuICAgICAgICAgICAgbWF4Q29uZmlnU2xvdHM6IDVcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVTZXR0aW5nc0RpcigpO1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NGaWxlID0gdGhpcy5nZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpO1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoc2V0dGluZ3NGaWxlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2V0dGluZ3NGaWxlLCAndXRmOCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLkRFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTLCAuLi5KU09OLnBhcnNlKGNvbnRlbnQpIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWFkIHRvb2wgbWFuYWdlciBzZXR0aW5nczonLCBlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gREVGQVVMVF9UT09MX01BTkFHRVJfU0VUVElOR1M7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBtaWdyYXRlQ29uZmlndXJhdGlvbnNUb0F2YWlsYWJsZVRvb2xzKCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RoIHx8ICF0aGlzLmF2YWlsYWJsZVRvb2xzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLm1hcCgoY29uZmlnKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbmFibGVkTWFwID0gbmV3IE1hcDxzdHJpbmcsIGJvb2xlYW4+KCk7XG4gICAgICAgICAgICAoY29uZmlnLnRvb2xzIHx8IFtdKS5mb3JFYWNoKCh0b29sKSA9PiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZE1hcC5zZXQoYCR7dG9vbC5jYXRlZ29yeX06JHt0b29sLm5hbWV9YCwgdG9vbC5lbmFibGVkICE9PSBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgbmV4dFRvb2xzID0gdGhpcy5hdmFpbGFibGVUb29scy5tYXAoKHRvb2wpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBgJHt0b29sLmNhdGVnb3J5fToke3Rvb2wubmFtZX1gO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIC4uLnRvb2wsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGVuYWJsZWRNYXAuaGFzKGtleSkgPyBCb29sZWFuKGVuYWJsZWRNYXAuZ2V0KGtleSkpIDogdG9vbC5jYXRlZ29yeSA9PT0gJ3VpR3JhcGgnLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3Qgc2FtZVNpemUgPSBBcnJheS5pc0FycmF5KGNvbmZpZy50b29scykgJiYgY29uZmlnLnRvb2xzLmxlbmd0aCA9PT0gbmV4dFRvb2xzLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IHNhbWVLZXlzID0gc2FtZVNpemUgJiYgY29uZmlnLnRvb2xzLmV2ZXJ5KCh0b29sLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBuZXh0VG9vbHNbaW5kZXhdO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b29sLmNhdGVnb3J5ID09PSBuZXh0LmNhdGVnb3J5ICYmIHRvb2wubmFtZSA9PT0gbmV4dC5uYW1lICYmIHRvb2wuZW5hYmxlZCA9PT0gbmV4dC5lbmFibGVkO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChzYW1lS2V5cykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAuLi5jb25maWcsXG4gICAgICAgICAgICAgICAgdG9vbHM6IG5leHRUb29scyxcbiAgICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5vdyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCkge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RzID0gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5zb21lKChjb25maWcpID0+IGNvbmZpZy5pZCA9PT0gdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQpO1xuICAgICAgICAgICAgaWYgKCFleGlzdHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnNbMF0/LmlkIHx8ICcnO1xuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVRvb2xNYW5hZ2VyU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1Rvb2xNYW5hZ2VyXSBNaWdyYXRlZCBsZWdhY3kgdG9vbCBjb25maWd1cmF0aW9ucyB0byBsYXRlc3QgdG9vbCBzZXQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2F2ZVRvb2xNYW5hZ2VyU2V0dGluZ3Moc2V0dGluZ3M6IFRvb2xNYW5hZ2VyU2V0dGluZ3MpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlU2V0dGluZ3NEaXIoKTtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzRmlsZSA9IHRoaXMuZ2V0VG9vbE1hbmFnZXJTZXR0aW5nc1BhdGgoKTtcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2V0dGluZ3NGaWxlLCBKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgMikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2F2ZSB0b29sIG1hbmFnZXIgc2V0dGluZ3M6JywgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBleHBvcnRUb29sQ29uZmlndXJhdGlvbihjb25maWc6IFRvb2xDb25maWd1cmF0aW9uKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbXBvcnRUb29sQ29uZmlndXJhdGlvbihjb25maWdKc29uOiBzdHJpbmcpOiBUb29sQ29uZmlndXJhdGlvbiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKGNvbmZpZ0pzb24pO1xuICAgICAgICAgICAgLy8g6aqM6K+B6YWN572u5qC85byPXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5pZCB8fCAhY29uZmlnLm5hbWUgfHwgIUFycmF5LmlzQXJyYXkoY29uZmlnLnRvb2xzKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb25maWd1cmF0aW9uIGZvcm1hdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHBhcnNlIHRvb2wgY29uZmlndXJhdGlvbjonLCBlKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBKU09OIGZvcm1hdCBvciBjb25maWd1cmF0aW9uIHN0cnVjdHVyZScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplQXZhaWxhYmxlVG9vbHMoKTogdm9pZCB7XG4gICAgICAgIC8vIOS7jk1DUOacjeWKoeWZqOiOt+WPluecn+WunueahOW3peWFt+WIl+ihqFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5a+85YWl5omA5pyJ5bel5YW357G7XG4gICAgICAgICAgICBjb25zdCB7IFNjZW5lVG9vbHMgfSA9IHJlcXVpcmUoJy4vc2NlbmUtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgTm9kZVRvb2xzIH0gPSByZXF1aXJlKCcuL25vZGUtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgQ29tcG9uZW50VG9vbHMgfSA9IHJlcXVpcmUoJy4vY29tcG9uZW50LXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IFByZWZhYlRvb2xzIH0gPSByZXF1aXJlKCcuL3ByZWZhYi10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBQcm9qZWN0VG9vbHMgfSA9IHJlcXVpcmUoJy4vcHJvamVjdC10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBEZWJ1Z1Rvb2xzIH0gPSByZXF1aXJlKCcuL2RlYnVnLXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IFByZWZlcmVuY2VzVG9vbHMgfSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZXMtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgU2VydmVyVG9vbHMgfSA9IHJlcXVpcmUoJy4vc2VydmVyLXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IEJyb2FkY2FzdFRvb2xzIH0gPSByZXF1aXJlKCcuL2Jyb2FkY2FzdC10b29scycpO1xuICAgICAgICAgICAgLy8gU2NlbmVBZHZhbmNlZFRvb2xzIGZ1bmN0aW9uYWxpdHkgaGFzIGJlZW4gaW50ZWdyYXRlZCBpbnRvIE5vZGVUb29scyBhbmQgU2NlbmVUb29sc1xuICAgICAgICAgICAgY29uc3QgeyBTY2VuZVZpZXdUb29scyB9ID0gcmVxdWlyZSgnLi9zY2VuZS12aWV3LXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IFJlZmVyZW5jZUltYWdlVG9vbHMgfSA9IHJlcXVpcmUoJy4vcmVmZXJlbmNlLWltYWdlLXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IEFzc2V0QWR2YW5jZWRUb29scyB9ID0gcmVxdWlyZSgnLi9hc3NldC1hZHZhbmNlZC10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBWYWxpZGF0aW9uVG9vbHMgfSA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbi10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBVaUdyYXBoVG9vbHMgfSA9IHJlcXVpcmUoJy4vdWktZ3JhcGgtdG9vbHMnKTtcblxuICAgICAgICAgICAgLy8g5Yid5aeL5YyW5bel5YW35a6e5L6LXG4gICAgICAgICAgICBjb25zdCB0b29scyA9IHtcbiAgICAgICAgICAgICAgICB1aUdyYXBoOiBuZXcgVWlHcmFwaFRvb2xzKCksXG4gICAgICAgICAgICAgICAgc2NlbmU6IG5ldyBTY2VuZVRvb2xzKCksXG4gICAgICAgICAgICAgICAgbm9kZTogbmV3IE5vZGVUb29scygpLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFRvb2xzKCksXG4gICAgICAgICAgICAgICAgcHJlZmFiOiBuZXcgUHJlZmFiVG9vbHMoKSxcbiAgICAgICAgICAgICAgICBwcm9qZWN0OiBuZXcgUHJvamVjdFRvb2xzKCksXG4gICAgICAgICAgICAgICAgZGVidWc6IG5ldyBEZWJ1Z1Rvb2xzKCksXG4gICAgICAgICAgICAgICAgcHJlZmVyZW5jZXM6IG5ldyBQcmVmZXJlbmNlc1Rvb2xzKCksXG4gICAgICAgICAgICAgICAgc2VydmVyOiBuZXcgU2VydmVyVG9vbHMoKSxcbiAgICAgICAgICAgICAgICBicm9hZGNhc3Q6IG5ldyBCcm9hZGNhc3RUb29scygpLFxuICAgICAgICAgICAgICAgIC8vIHNjZW5lQWR2YW5jZWQgZnVuY3Rpb25hbGl0eSBoYXMgYmVlbiBpbnRlZ3JhdGVkIGludG8gbm9kZSBhbmQgc2NlbmUgdG9vbHNcbiAgICAgICAgICAgICAgICBzY2VuZVZpZXc6IG5ldyBTY2VuZVZpZXdUb29scygpLFxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZUltYWdlOiBuZXcgUmVmZXJlbmNlSW1hZ2VUb29scygpLFxuICAgICAgICAgICAgICAgIGFzc2V0QWR2YW5jZWQ6IG5ldyBBc3NldEFkdmFuY2VkVG9vbHMoKSxcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiBuZXcgVmFsaWRhdGlvblRvb2xzKClcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIOS7juavj+S4quW3peWFt+exu+iOt+WPluW3peWFt+WIl+ihqFxuICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scyA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBbY2F0ZWdvcnksIHRvb2xTZXRdIG9mIE9iamVjdC5lbnRyaWVzKHRvb2xzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xEZWZpbml0aW9ucyA9IHRvb2xTZXQuZ2V0VG9vbHMoKTtcbiAgICAgICAgICAgICAgICB0b29sRGVmaW5pdGlvbnMuZm9yRWFjaCgodG9vbDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlVG9vbHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0b29sLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjYXRlZ29yeSA9PT0gJ3VpR3JhcGgnLCAvLyDpu5jorqTlj6rlkK/nlKggVUkgR3JhcGgg6auY5bGC5bel5YW377yMbGVnYWN5IOWPr+aJi+WKqOW8gOWQr1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRvb2wuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbVG9vbE1hbmFnZXJdIEluaXRpYWxpemVkICR7dGhpcy5hdmFpbGFibGVUb29scy5sZW5ndGh9IHRvb2xzIGZyb20gTUNQIHNlcnZlcmApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Rvb2xNYW5hZ2VyXSBGYWlsZWQgdG8gaW5pdGlhbGl6ZSB0b29scyBmcm9tIE1DUCBzZXJ2ZXI6JywgZXJyb3IpO1xuICAgICAgICAgICAgLy8g5aaC5p6c6I635Y+W5aSx6LSl77yM5L2/55So6buY6K6k5bel5YW35YiX6KGo5L2c5Li65ZCO5aSHXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVEZWZhdWx0VG9vbHMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZURlZmF1bHRUb29scygpOiB2b2lkIHtcbiAgICAgICAgLy8g6buY6K6k5bel5YW35YiX6KGo5L2c5Li65ZCO5aSH5pa55qGIXG4gICAgICAgIGNvbnN0IHRvb2xDYXRlZ29yaWVzID0gW1xuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ3VpR3JhcGgnLCBuYW1lOiAnVUkgR3JhcGgg55Sf5Lqn57q/JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRfcHJvamVjdF91aV9jb250ZXh0JywgZGVzY3JpcHRpb246ICfmn6Xor6IgVUkgR3JhcGgg6aG555uu5LiK5LiL5paHJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2luc3BlY3RfdWlfZ3JhcGgnLCBkZXNjcmlwdGlvbjogJ+afpeivoiBVSSDlsYLnuqfmkZjopoEnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZXhwb3J0X3VpX2dyYXBoJywgZGVzY3JpcHRpb246ICflr7zlh7ogVUkgR3JhcGgnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAndmFsaWRhdGVfdWlfZ3JhcGgnLCBkZXNjcmlwdGlvbjogJ+agoemqjCBHcmFwaC9QYXRjaCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZW5lcmF0ZV9wcmVmYWJfZnJvbV9ncmFwaCcsIGRlc2NyaXB0aW9uOiAn5qC55o2uIEdyYXBoIOeUn+aIkCBQcmVmYWInIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnYXBwbHlfdWlfcGF0Y2gnLCBkZXNjcmlwdGlvbjogJ+W6lOeUqCBVSSBQYXRjaCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdpbnN0YW50aWF0ZV9wcmVmYWJfdG9fc2NlbmUnLCBkZXNjcmlwdGlvbjogJ+WunuS+i+WMliBQcmVmYWIg5YiwIFNjZW5lJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3Jlc29sdmVfYXNzZXRzJywgZGVzY3JpcHRpb246ICfop6PmnpAgVUkg6LWE5rqQ5byV55SoJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzY2VuZScsIG5hbWU6ICflnLrmma/lt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldEN1cnJlbnRTY2VuZUluZm8nLCBkZXNjcmlwdGlvbjogJ+iOt+WPluW9k+WJjeWcuuaZr+S/oeaBrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRTY2VuZUhpZXJhcmNoeScsIGRlc2NyaXB0aW9uOiAn6I635Y+W5Zy65pmv5bGC57qn57uT5p6EJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NyZWF0ZU5ld1NjZW5lJywgZGVzY3JpcHRpb246ICfliJvlu7rmlrDlnLrmma8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnc2F2ZVNjZW5lJywgZGVzY3JpcHRpb246ICfkv53lrZjlnLrmma8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnbG9hZFNjZW5lJywgZGVzY3JpcHRpb246ICfliqDovb3lnLrmma8nIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ25vZGUnLCBuYW1lOiAn6IqC54K55bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRBbGxOb2RlcycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5omA5pyJ6IqC54K5JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2ZpbmROb2RlQnlOYW1lJywgZGVzY3JpcHRpb246ICfmoLnmja7lkI3np7Dmn6Xmib7oioLngrknIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnY3JlYXRlTm9kZScsIGRlc2NyaXB0aW9uOiAn5Yib5bu66IqC54K5JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2RlbGV0ZU5vZGUnLCBkZXNjcmlwdGlvbjogJ+WIoOmZpOiKgueCuScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdzZXROb2RlUHJvcGVydHknLCBkZXNjcmlwdGlvbjogJ+iuvue9ruiKgueCueWxnuaApycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXROb2RlSW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W6IqC54K55L+h5oGvJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdjb21wb25lbnQnLCBuYW1lOiAn57uE5Lu25bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdhZGRDb21wb25lbnRUb05vZGUnLCBkZXNjcmlwdGlvbjogJ+a3u+WKoOe7hOS7tuWIsOiKgueCuScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdyZW1vdmVDb21wb25lbnRGcm9tTm9kZScsIGRlc2NyaXB0aW9uOiAn5LuO6IqC54K556e76Zmk57uE5Lu2JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NldENvbXBvbmVudFByb3BlcnR5JywgZGVzY3JpcHRpb246ICforr7nva7nu4Tku7blsZ7mgKcnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0Q29tcG9uZW50SW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W57uE5Lu25L+h5oGvJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdwcmVmYWInLCBuYW1lOiAn6aKE5Yi25L2T5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdjcmVhdGVQcmVmYWJGcm9tTm9kZScsIGRlc2NyaXB0aW9uOiAn5LuO6IqC54K55Yib5bu66aKE5Yi25L2TJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2luc3RhbnRpYXRlUHJlZmFiJywgZGVzY3JpcHRpb246ICflrp7kvovljJbpooTliLbkvZMnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0UHJlZmFiSW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W6aKE5Yi25L2T5L+h5oGvJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NhdmVQcmVmYWInLCBkZXNjcmlwdGlvbjogJ+S/neWtmOmihOWItuS9kycgfVxuICAgICAgICAgICAgXX0sXG4gICAgICAgICAgICB7IGNhdGVnb3J5OiAncHJvamVjdCcsIG5hbWU6ICfpobnnm67lt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldFByb2plY3RJbmZvJywgZGVzY3JpcHRpb246ICfojrflj5bpobnnm67kv6Hmga8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0QXNzZXRMaXN0JywgZGVzY3JpcHRpb246ICfojrflj5botYTmupDliJfooagnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnY3JlYXRlQXNzZXQnLCBkZXNjcmlwdGlvbjogJ+WIm+W7uui1hOa6kCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdkZWxldGVBc3NldCcsIGRlc2NyaXB0aW9uOiAn5Yig6Zmk6LWE5rqQJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdkZWJ1ZycsIG5hbWU6ICfosIPor5Xlt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldENvbnNvbGVMb2dzJywgZGVzY3JpcHRpb246ICfojrflj5bmjqfliLblj7Dml6Xlv5cnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0UGVyZm9ybWFuY2VTdGF0cycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5oCn6IO957uf6K6hJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3ZhbGlkYXRlU2NlbmUnLCBkZXNjcmlwdGlvbjogJ+mqjOivgeWcuuaZrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRFcnJvckxvZ3MnLCBkZXNjcmlwdGlvbjogJ+iOt+WPlumUmeivr+aXpeW/lycgfVxuICAgICAgICAgICAgXX0sXG4gICAgICAgICAgICB7IGNhdGVnb3J5OiAncHJlZmVyZW5jZXMnLCBuYW1lOiAn5YGP5aW96K6+572u5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRQcmVmZXJlbmNlcycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5YGP5aW96K6+572uJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NldFByZWZlcmVuY2VzJywgZGVzY3JpcHRpb246ICforr7nva7lgY/lpb3orr7nva4nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAncmVzZXRQcmVmZXJlbmNlcycsIGRlc2NyaXB0aW9uOiAn6YeN572u5YGP5aW96K6+572uJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzZXJ2ZXInLCBuYW1lOiAn5pyN5Yqh5Zmo5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRTZXJ2ZXJTdGF0dXMnLCBkZXNjcmlwdGlvbjogJ+iOt+WPluacjeWKoeWZqOeKtuaAgScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRDb25uZWN0ZWRDbGllbnRzJywgZGVzY3JpcHRpb246ICfojrflj5bov57mjqXnmoTlrqLmiLfnq68nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0U2VydmVyTG9ncycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5pyN5Yqh5Zmo5pel5b+XJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdicm9hZGNhc3QnLCBuYW1lOiAn5bm/5pKt5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdicm9hZGNhc3RNZXNzYWdlJywgZGVzY3JpcHRpb246ICflub/mkq3mtojmga8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0QnJvYWRjYXN0SGlzdG9yeScsIGRlc2NyaXB0aW9uOiAn6I635Y+W5bm/5pKt5Y6G5Y+yJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzY2VuZVZpZXcnLCBuYW1lOiAn5Zy65pmv6KeG5Zu+5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRWaWV3cG9ydEluZm8nLCBkZXNjcmlwdGlvbjogJ+iOt+WPluinhuWPo+S/oeaBrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdzZXRWaWV3cG9ydENhbWVyYScsIGRlc2NyaXB0aW9uOiAn6K6+572u6KeG5Y+j55u45py6JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2ZvY3VzT25Ob2RlJywgZGVzY3JpcHRpb246ICfogZrnhKbliLDoioLngrknIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ3JlZmVyZW5jZUltYWdlJywgbmFtZTogJ+WPguiAg+WbvueJh+W3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnYWRkUmVmZXJlbmNlSW1hZ2UnLCBkZXNjcmlwdGlvbjogJ+a3u+WKoOWPguiAg+WbvueJhycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdyZW1vdmVSZWZlcmVuY2VJbWFnZScsIGRlc2NyaXB0aW9uOiAn56e76Zmk5Y+C6ICD5Zu+54mHJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldFJlZmVyZW5jZUltYWdlcycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5Y+C6ICD5Zu+54mH5YiX6KGoJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdhc3NldEFkdmFuY2VkJywgbmFtZTogJ+mrmOe6p+i1hOa6kOW3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnaW1wb3J0QXNzZXQnLCBkZXNjcmlwdGlvbjogJ+WvvOWFpei1hOa6kCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdleHBvcnRBc3NldCcsIGRlc2NyaXB0aW9uOiAn5a+85Ye66LWE5rqQJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3Byb2Nlc3NBc3NldCcsIGRlc2NyaXB0aW9uOiAn5aSE55CG6LWE5rqQJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICd2YWxpZGF0aW9uJywgbmFtZTogJ+mqjOivgeW3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAndmFsaWRhdGVQcm9qZWN0JywgZGVzY3JpcHRpb246ICfpqozor4Hpobnnm64nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAndmFsaWRhdGVBc3NldHMnLCBkZXNjcmlwdGlvbjogJ+mqjOivgei1hOa6kCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZW5lcmF0ZVJlcG9ydCcsIGRlc2NyaXB0aW9uOiAn55Sf5oiQ5oql5ZGKJyB9XG4gICAgICAgICAgICBdfVxuICAgICAgICBdO1xuXG4gICAgICAgIHRoaXMuYXZhaWxhYmxlVG9vbHMgPSBbXTtcbiAgICAgICAgdG9vbENhdGVnb3JpZXMuZm9yRWFjaChjYXRlZ29yeSA9PiB7XG4gICAgICAgICAgICBjYXRlZ29yeS50b29scy5mb3JFYWNoKHRvb2wgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlVG9vbHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeS5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdG9vbC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjYXRlZ29yeS5jYXRlZ29yeSA9PT0gJ3VpR3JhcGgnLCAvLyBmYWxsYmFjayDlkIzmoLfpu5jorqTlj6rlkK/nlKggVUkgR3JhcGhcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRvb2wuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgW1Rvb2xNYW5hZ2VyXSBJbml0aWFsaXplZCAke3RoaXMuYXZhaWxhYmxlVG9vbHMubGVuZ3RofSBkZWZhdWx0IHRvb2xzYCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEF2YWlsYWJsZVRvb2xzKCk6IFRvb2xDb25maWdbXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5hdmFpbGFibGVUb29sc107XG4gICAgfVxuXG4gICAgcHVibGljIGdldENvbmZpZ3VyYXRpb25zKCk6IFRvb2xDb25maWd1cmF0aW9uW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnNdO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDdXJyZW50Q29uZmlndXJhdGlvbigpOiBUb29sQ29uZmlndXJhdGlvbiB8IG51bGwge1xuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5maW5kKGNvbmZpZyA9PiBjb25maWcuaWQgPT09IHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkKSB8fCBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVDb25maWd1cmF0aW9uKG5hbWU6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBUb29sQ29uZmlndXJhdGlvbiB7XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aCA+PSB0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOW3sui+vuWIsOacgOWkp+mFjee9ruanveS9jeaVsOmHjyAoJHt0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzfSlgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbmZpZzogVG9vbENvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgICAgICBpZDogdXVpZHY0KCksXG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICB0b29sczogdGhpcy5hdmFpbGFibGVUb29scy5tYXAodG9vbCA9PiAoeyAuLi50b29sIH0pKSxcbiAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLnB1c2goY29uZmlnKTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQgPSBjb25maWcuaWQ7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nLCB1cGRhdGVzOiBQYXJ0aWFsPFRvb2xDb25maWd1cmF0aW9uPik6IFRvb2xDb25maWd1cmF0aW9uIHtcbiAgICAgICAgY29uc3QgY29uZmlnSW5kZXggPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmRJbmRleChjb25maWcgPT4gY29uZmlnLmlkID09PSBjb25maWdJZCk7XG4gICAgICAgIGlmIChjb25maWdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6YWN572u5LiN5a2Y5ZyoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zW2NvbmZpZ0luZGV4XTtcbiAgICAgICAgY29uc3QgdXBkYXRlZENvbmZpZzogVG9vbENvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgICAgICAuLi5jb25maWcsXG4gICAgICAgICAgICAuLi51cGRhdGVzLFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zW2NvbmZpZ0luZGV4XSA9IHVwZGF0ZWRDb25maWc7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG5cbiAgICAgICAgcmV0dXJuIHVwZGF0ZWRDb25maWc7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZUNvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb25maWdJbmRleCA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZEluZGV4KGNvbmZpZyA9PiBjb25maWcuaWQgPT09IGNvbmZpZ0lkKTtcbiAgICAgICAgaWYgKGNvbmZpZ0luZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuc3BsaWNlKGNvbmZpZ0luZGV4LCAxKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOWIoOmZpOeahOaYr+W9k+WJjemFjee9ru+8jOa4heepuuW9k+WJjemFjee9rklEXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCA9PT0gY29uZmlnSWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkID0gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5sZW5ndGggPiAwIFxuICAgICAgICAgICAgICAgID8gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9uc1swXS5pZCBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Q3VycmVudENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gY29uZmlnSWQpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkID0gY29uZmlnSWQ7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZVRvb2xTdGF0dXMoY29uZmlnSWQ6IHN0cmluZywgY2F0ZWdvcnk6IHN0cmluZywgdG9vbE5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogVXBkYXRpbmcgdG9vbCBzdGF0dXMgLSBjb25maWdJZDogJHtjb25maWdJZH0sIGNhdGVnb3J5OiAke2NhdGVnb3J5fSwgdG9vbE5hbWU6ICR7dG9vbE5hbWV9LCBlbmFibGVkOiAke2VuYWJsZWR9YCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gY29uZmlnSWQpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQmFja2VuZDogQ29uZmlnIG5vdCBmb3VuZCB3aXRoIElEOiAke2NvbmZpZ0lkfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBGb3VuZCBjb25maWc6ICR7Y29uZmlnLm5hbWV9YCk7XG5cbiAgICAgICAgY29uc3QgdG9vbCA9IGNvbmZpZy50b29scy5maW5kKHQgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkgJiYgdC5uYW1lID09PSB0b29sTmFtZSk7XG4gICAgICAgIGlmICghdG9vbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQmFja2VuZDogVG9vbCBub3QgZm91bmQgLSBjYXRlZ29yeTogJHtjYXRlZ29yeX0sIG5hbWU6ICR7dG9vbE5hbWV9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W3peWFt+S4jeWtmOWcqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IEZvdW5kIHRvb2w6ICR7dG9vbC5uYW1lfSwgY3VycmVudCBlbmFibGVkOiAke3Rvb2wuZW5hYmxlZH0sIG5ldyBlbmFibGVkOiAke2VuYWJsZWR9YCk7XG4gICAgICAgIFxuICAgICAgICB0b29sLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICBjb25maWcudXBkYXRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IFRvb2wgdXBkYXRlZCwgc2F2aW5nIHNldHRpbmdzLi4uYCk7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBTZXR0aW5ncyBzYXZlZCBzdWNjZXNzZnVsbHlgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlVG9vbFN0YXR1c0JhdGNoKGNvbmZpZ0lkOiBzdHJpbmcsIHVwZGF0ZXM6IHsgY2F0ZWdvcnk6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBlbmFibGVkOiBib29sZWFuIH1bXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogdXBkYXRlVG9vbFN0YXR1c0JhdGNoIGNhbGxlZCB3aXRoIGNvbmZpZ0lkOiAke2NvbmZpZ0lkfWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogQ3VycmVudCBjb25maWd1cmF0aW9ucyBjb3VudDogJHt0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aH1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IEN1cnJlbnQgY29uZmlnIElEczpgLCB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLm1hcChjID0+IGMuaWQpKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZChjb25maWcgPT4gY29uZmlnLmlkID09PSBjb25maWdJZCk7XG4gICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWNrZW5kOiBDb25maWcgbm90IGZvdW5kIHdpdGggSUQ6ICR7Y29uZmlnSWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWNrZW5kOiBBdmFpbGFibGUgY29uZmlnIElEczpgLCB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLm1hcChjID0+IGMuaWQpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6YWN572u5LiN5a2Y5ZyoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogRm91bmQgY29uZmlnOiAke2NvbmZpZy5uYW1lfSwgdXBkYXRpbmcgJHt1cGRhdGVzLmxlbmd0aH0gdG9vbHNgKTtcblxuICAgICAgICB1cGRhdGVzLmZvckVhY2godXBkYXRlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRvb2wgPSBjb25maWcudG9vbHMuZmluZCh0ID0+IHQuY2F0ZWdvcnkgPT09IHVwZGF0ZS5jYXRlZ29yeSAmJiB0Lm5hbWUgPT09IHVwZGF0ZS5uYW1lKTtcbiAgICAgICAgICAgIGlmICh0b29sKSB7XG4gICAgICAgICAgICAgICAgdG9vbC5lbmFibGVkID0gdXBkYXRlLmVuYWJsZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbmZpZy51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBCYXRjaCB1cGRhdGUgY29tcGxldGVkIHN1Y2Nlc3NmdWxseWApO1xuICAgIH1cblxuICAgIHB1YmxpYyBleHBvcnRDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gY29uZmlnSWQpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgcHVibGljIGltcG9ydENvbmZpZ3VyYXRpb24oY29uZmlnSnNvbjogc3RyaW5nKTogVG9vbENvbmZpZ3VyYXRpb24ge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmltcG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0pzb24pO1xuICAgICAgICBcbiAgICAgICAgLy8g55Sf5oiQ5paw55qESUTlkozml7bpl7TmiLNcbiAgICAgICAgY29uZmlnLmlkID0gdXVpZHY0KCk7XG4gICAgICAgIGNvbmZpZy5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIGNvbmZpZy51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RoID49IHRoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5bey6L6+5Yiw5pyA5aSn6YWN572u5qe95L2N5pWw6YePICgke3RoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHN9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5wdXNoKGNvbmZpZyk7XG4gICAgICAgIHRoaXMuc2F2ZVNldHRpbmdzKCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RW5hYmxlZFRvb2xzKCk6IFRvb2xDb25maWdbXSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRDb25maWcgPSB0aGlzLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgIGlmICghY3VycmVudENvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXZhaWxhYmxlVG9vbHMuZmlsdGVyKHRvb2wgPT4gdG9vbC5lbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudENvbmZpZy50b29scy5maWx0ZXIodG9vbCA9PiB0b29sLmVuYWJsZWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUb29sTWFuYWdlclN0YXRlKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50Q29uZmlnID0gdGhpcy5nZXRDdXJyZW50Q29uZmlndXJhdGlvbigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzOiBjdXJyZW50Q29uZmlnID8gY3VycmVudENvbmZpZy50b29scyA6IHRoaXMuZ2V0QXZhaWxhYmxlVG9vbHMoKSxcbiAgICAgICAgICAgIHNlbGVjdGVkQ29uZmlnSWQ6IHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbnM6IHRoaXMuZ2V0Q29uZmlndXJhdGlvbnMoKSxcbiAgICAgICAgICAgIG1heENvbmZpZ1Nsb3RzOiB0aGlzLnNldHRpbmdzLm1heENvbmZpZ1Nsb3RzLFxuICAgICAgICAgICAgdWlHcmFwaFByb3RvY29sOiB7XG4gICAgICAgICAgICAgICAgZ3JhcGhTY2hlbWFWZXJzaW9uOiBVSV9HUkFQSF9TQ0hFTUFfVkVSU0lPTixcbiAgICAgICAgICAgICAgICBwYXRjaFNjaGVtYVZlcnNpb246IFVJX1BBVENIX1NDSEVNQV9WRVJTSU9OLFxuICAgICAgICAgICAgICAgIHNjaGVtYUhhc2g6IGdldFNjaGVtYUhhc2goKSxcbiAgICAgICAgICAgICAgICBzdXBwb3J0ZWRTa2lsbFZlcnNpb246IFVJX0dSQVBIX1NLSUxMX1ZFUlNJT04sXG4gICAgICAgICAgICAgICAgcGx1Z2luVmVyc2lvbjogVUlfR1JBUEhfUExVR0lOX1ZFUlNJT04sXG4gICAgICAgICAgICAgICAgc2tpbGxWZXJzaW9uTWF0Y2hlZDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgc2F2ZVNldHRpbmdzKCk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogU2F2aW5nIHNldHRpbmdzLCBjdXJyZW50IGNvbmZpZ3MgY291bnQ6ICR7dGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5sZW5ndGh9YCk7XG4gICAgICAgIHRoaXMuc2F2ZVRvb2xNYW5hZ2VyU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBTZXR0aW5ncyBzYXZlZCB0byBmaWxlYCk7XG4gICAgfVxufSBcbiJdfQ==
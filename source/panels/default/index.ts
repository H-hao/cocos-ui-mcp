/* eslint-disable vue/one-component-per-file */

import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent, ref, computed, onMounted, onUnmounted, watch } from 'vue';

const panelDataMap = new WeakMap<any, App>();

// 定义工具配置接口
interface ToolConfig {
    category: string;
    name: string;
    enabled: boolean;
    description: string;
}

// 定义配置接口
interface Configuration {
    id: string;
    name: string;
    description: string;
    tools: ToolConfig[];
    createdAt: string;
    updatedAt: string;
}

// 定义服务器设置接口
interface ServerSettings {
    port: number;
    autoStart: boolean;
    debugLog: boolean;
    maxConnections: number;
}

module.exports = Editor.Panel.define({
    listeners: {
        show() { 
            console.log('[MCP Panel] Panel shown'); 
        },
        hide() { 
            console.log('[MCP Panel] Panel hidden'); 
        },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle',
    },
    ready() {
        if (this.$.app) {
            const app = createApp({});
            
            // 创建主应用组件
            app.component('McpServerApp', defineComponent({
                setup() {
                    // 响应式数据
                    const activeTab = ref('server');
                    const serverRunning = ref(false);
                    const serverStatus = ref('检测中');
                    const serverStatusType = ref<'checking' | 'running' | 'stopped'>('checking');
                    const connectedClients = ref(0);
                    const httpUrl = ref('');
                    const isProcessing = ref(false);
                    let statusPollingTimer: ReturnType<typeof setInterval> | null = null;
                    const isSyncingSettings = ref(false);
                    
                    const settings = ref<ServerSettings>({
                        port: 3000,
                        autoStart: false,
                        debugLog: false,
                        maxConnections: 10
                    });
                    
                    const availableTools = ref<ToolConfig[]>([]);
                    const toolCategories = ref<string[]>([]);
                    

                    
                    // 计算属性
                    const statusClass = computed(() => ({
                        'status-checking': serverStatusType.value === 'checking',
                        'status-running': serverStatusType.value === 'running',
                        'status-stopped': serverStatusType.value === 'stopped'
                    }));
                    
                    const totalTools = computed(() => availableTools.value.length);
                    const enabledTools = computed(() => availableTools.value.filter(t => t.enabled).length);
                    const disabledTools = computed(() => totalTools.value - enabledTools.value);
                    

                    
                    const settingsChanged = ref(false);
                    
                    // 方法
                    const switchTab = (tabName: string) => {
                        activeTab.value = tabName;
                        if (tabName === 'tools') {
                            void loadToolManagerState();
                        }
                    };

                    const clampInteger = (value: unknown, min: number, max: number, fallback: number) => {
                        const numericValue = Number(value);
                        if (!Number.isFinite(numericValue)) {
                            return fallback;
                        }
                        const integerValue = Math.trunc(numericValue);
                        return Math.min(max, Math.max(min, integerValue));
                    };

                    const getNormalizedSettings = (): ServerSettings => ({
                        port: clampInteger(settings.value.port, 1024, 65535, 3000),
                        autoStart: Boolean(settings.value.autoStart),
                        debugLog: Boolean(settings.value.debugLog),
                        maxConnections: clampInteger(settings.value.maxConnections, 1, 100, 10)
                    });

                    const normalizePortInput = () => {
                        settings.value.port = clampInteger(settings.value.port, 1024, 65535, 3000);
                    };

                    const normalizeMaxConnectionsInput = () => {
                        settings.value.maxConnections = clampInteger(settings.value.maxConnections, 1, 100, 10);
                    };

                    const onToolCheckboxChange = (category: string, name: string, event: Event) => {
                        const target = event.target as HTMLInputElement | null;
                        void updateToolStatus(category, name, Boolean(target?.checked));
                    };

                    const applyServerStatus = (statusResult: any) => {
                        const running = Boolean(statusResult?.running);
                        serverRunning.value = running;
                        serverStatusType.value = running ? 'running' : 'stopped';
                        serverStatus.value = running ? '运行中' : '已停止';
                        connectedClients.value = statusResult?.clients || 0;
                        httpUrl.value = running ? `http://localhost:${statusResult?.port}` : '';
                    };

                    const applyServerSettings = (statusResult: any) => {
                        if (!statusResult?.settings) {
                            return;
                        }

                        isSyncingSettings.value = true;
                        const normalizedSettings = {
                            port: clampInteger(statusResult.settings.port, 1024, 65535, 3000),
                            autoStart: Boolean(statusResult.settings.autoStart),
                            debugLog: Boolean(statusResult.settings.enableDebugLog),
                            maxConnections: clampInteger(statusResult.settings.maxConnections, 1, 100, 10)
                        };
                        settings.value = {
                            ...normalizedSettings
                        };
                        settingsChanged.value = false;
                        isSyncingSettings.value = false;
                    };

                    const refreshServerStatus = async () => {
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                            if (result) {
                                applyServerStatus(result);
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to refresh server status:', error);
                        }
                    };

                    const loadServerSettings = async () => {
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                            if (result) {
                                applyServerSettings(result);
                                applyServerStatus(result);
                                console.log('[Vue App] Server settings loaded from status');
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to load server settings:', error);
                            console.log('[Vue App] Using default server settings');
                        }
                    };
                    
                    const toggleServer = async () => {
                        if (isProcessing.value) {
                            return;
                        }

                        isProcessing.value = true;
                        serverStatusType.value = 'checking';
                        serverStatus.value = '检测中';

                        try {
                            if (serverRunning.value) {
                                await Editor.Message.request('cocos-mcp-server', 'stop-server');
                            } else {
                                // 启动服务器时使用当前面板设置
                                const currentSettings = getNormalizedSettings();
                                settings.value = { ...currentSettings };
                                await Editor.Message.request('cocos-mcp-server', 'update-settings', currentSettings);
                                await Editor.Message.request('cocos-mcp-server', 'start-server');
                            }
                            console.log('[Vue App] Server toggled');
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle server:', error);
                        } finally {
                            await refreshServerStatus();
                            isProcessing.value = false;
                        }
                    };
                    
                    const saveSettings = async () => {
                        if (isProcessing.value) {
                            return;
                        }

                        try {
                            // 创建一个简单的对象，避免克隆错误
                            const settingsData = getNormalizedSettings();
                            settings.value = { ...settingsData };
                            
                            const result = await Editor.Message.request('cocos-mcp-server', 'update-settings', settingsData);
                            console.log('[Vue App] Save settings result:', result);
                            settingsChanged.value = false;
                            await refreshServerStatus();
                        } catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    };

                    const restartServerFromDist = async () => {
                        if (isProcessing.value) {
                            return;
                        }

                        isProcessing.value = true;
                        serverStatusType.value = 'checking';
                        serverStatus.value = '检测中';

                        try {
                            const settingsData = getNormalizedSettings();
                            settings.value = { ...settingsData };
                            await Editor.Message.request('cocos-mcp-server', 'update-settings', settingsData);
                            await Editor.Message.request('cocos-mcp-server', 'restart-server-from-dist');
                            settingsChanged.value = false;
                            console.log('[Vue App] Server restarted from dist');
                        } catch (error) {
                            console.error('[Vue App] Failed to restart server from dist:', error);
                        } finally {
                            await refreshServerStatus();
                            isProcessing.value = false;
                        }
                    };
                    
                    const copyUrl = async () => {
                        try {
                            await navigator.clipboard.writeText(httpUrl.value);
                            console.log('[Vue App] URL copied to clipboard');
                        } catch (error) {
                            console.error('[Vue App] Failed to copy URL:', error);
                        }
                    };
                    
                    const loadToolManagerState = async () => {
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'getToolManagerState');
                            if (result && result.success) {
                                // 总是加载后端状态，确保数据是最新的
                                availableTools.value = result.availableTools || [];
                                console.log('[Vue App] Loaded tools:', availableTools.value.length);
                                
                                // 更新工具分类
                                const categories = new Set(availableTools.value.map(tool => tool.category));
                                toolCategories.value = Array.from(categories);
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    };
                    
                    const updateToolStatus = async (category: string, name: string, enabled: boolean) => {
                        try {
                            console.log('[Vue App] updateToolStatus called:', category, name, enabled);
                            
                            // 先更新本地状态
                            const toolIndex = availableTools.value.findIndex(t => t.category === category && t.name === name);
                            if (toolIndex !== -1) {
                                availableTools.value[toolIndex].enabled = enabled;
                                // 强制触发响应式更新
                                availableTools.value = [...availableTools.value];
                                console.log('[Vue App] Local state updated, tool enabled:', availableTools.value[toolIndex].enabled);
                            }
                            
                            // 调用后端更新
                            const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatus', category, name, enabled);
                            if (!result || !result.success) {
                                // 如果后端更新失败，回滚本地状态
                                if (toolIndex !== -1) {
                                    availableTools.value[toolIndex].enabled = !enabled;
                                    availableTools.value = [...availableTools.value];
                                }
                                console.error('[Vue App] Backend update failed, rolled back local state');
                            } else {
                                console.log('[Vue App] Backend update successful');
                            }
                        } catch (error) {
                            // 如果发生错误，回滚本地状态
                            const toolIndex = availableTools.value.findIndex(t => t.category === category && t.name === name);
                            if (toolIndex !== -1) {
                                availableTools.value[toolIndex].enabled = !enabled;
                                availableTools.value = [...availableTools.value];
                            }
                            console.error('[Vue App] Failed to update tool status:', error);
                        }
                    };
                    
                    const selectAllTools = async () => {
                        try {
                            // 直接更新本地状态，然后保存
                            availableTools.value.forEach(tool => tool.enabled = true);
                            await saveChanges();
                        } catch (error) {
                            console.error('[Vue App] Failed to select all tools:', error);
                        }
                    };
                    
                    const deselectAllTools = async () => {
                        try {
                            // 直接更新本地状态，然后保存
                            availableTools.value.forEach(tool => tool.enabled = false);
                            await saveChanges();
                        } catch (error) {
                            console.error('[Vue App] Failed to deselect all tools:', error);
                        }
                    };
                    
                    const saveChanges = async () => {
                        try {
                            // 创建普通对象，避免Vue3响应式对象克隆错误
                            const updates = availableTools.value.map(tool => ({
                                category: String(tool.category),
                                name: String(tool.name),
                                enabled: Boolean(tool.enabled)
                            }));
                            
                            console.log('[Vue App] Sending updates:', updates.length, 'tools');
                            
                            const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', updates);
                            
                            if (result && result.success) {
                                console.log('[Vue App] Tool changes saved successfully');
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to save tool changes:', error);
                        }
                    };
                    const toggleCategoryTools = async (category: string, enabled: boolean) => {
                        try {
                            // 直接更新本地状态，然后保存
                            availableTools.value.forEach(tool => {
                                if (tool.category === category) {
                                    tool.enabled = enabled;
                                }
                            });
                            await saveChanges();
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle category tools:', error);
                        }
                    };
                    
                    const getToolsByCategory = (category: string) => {
                        return availableTools.value.filter(tool => tool.category === category);
                    };
                    
                    const getCategoryDisplayName = (category: string): string => {
                        const categoryNames: { [key: string]: string } = {
                            'scene': '场景工具',
                            'node': '节点工具',
                            'component': '组件工具',
                            'prefab': '预制体工具',
                            'project': '项目工具',
                            'debug': '调试工具',
                            'preferences': '偏好设置工具',
                            'server': '服务器工具',
                            'broadcast': '广播工具',
                            'sceneAdvanced': '高级场景工具',
                            'sceneView': '场景视图工具',
                            'referenceImage': '参考图片工具',
                            'assetAdvanced': '高级资源工具',
                            'validation': '验证工具'
                        };
                        return categoryNames[category] || category;
                    };
                    // 监听设置变化
                    watch(settings, () => {
                        if (isSyncingSettings.value) {
                            return;
                        }
                        settingsChanged.value = true;
                    }, { deep: true });
                    
                    // 组件挂载时加载数据
                    onMounted(async () => {
                        // 加载工具管理器状态
                        await loadToolManagerState();
                        await loadServerSettings();
                        await refreshServerStatus();

                        // 定期更新服务器状态
                        statusPollingTimer = setInterval(() => {
                            void refreshServerStatus();
                        }, 2000);
                    });

                    onUnmounted(() => {
                        if (statusPollingTimer) {
                            clearInterval(statusPollingTimer);
                            statusPollingTimer = null;
                        }
                    });
                    
                    return {
                        // 数据
                        activeTab,
                        serverRunning,
                        serverStatus,
                        connectedClients,
                        httpUrl,
                        isProcessing,
                        settings,
                        availableTools,
                        toolCategories,
                        settingsChanged,
                        
                        // 计算属性
                        statusClass,
                        totalTools,
                        enabledTools,
                        disabledTools,
                        
                        // 方法
                        switchTab,
                        toggleServer,
                        restartServerFromDist,
                        saveSettings,
                        normalizePortInput,
                        normalizeMaxConnectionsInput,
                        copyUrl,
                        refreshServerStatus,
                        loadToolManagerState,
                        updateToolStatus,
                        onToolCheckboxChange,
                        selectAllTools,
                        deselectAllTools,
                        saveChanges,
                        toggleCategoryTools,
                        getToolsByCategory,
                        getCategoryDisplayName
                    };
                },
                template: readFileSync(join(__dirname, '../../../static/template/vue/mcp-server-app.html'), 'utf-8'),
            }));
            
            app.mount(this.$.app);
            panelDataMap.set(this, app);
            
            console.log('[MCP Panel] Vue3 app mounted successfully');
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AiClientConfigPanel from './components/AiClientConfigPanel.vue';
import ConnectionInfoCard from './components/ConnectionInfoCard.vue';
import ServerSettingsForm from './components/ServerSettingsForm.vue';
import ServerStatusCard from './components/ServerStatusCard.vue';
import ToastHost from './components/ToastHost.vue';
import ToolsCategoryList from './components/ToolsCategoryList.vue';
import ToolsOverview from './components/ToolsOverview.vue';
import { useServerState } from './composables/useServerState';
import { useToolManager } from './composables/useToolManager';

const activeTab = ref<'server' | 'tools' | 'ai'>('server');

const {
    settings,
    serverRunning,
    serverStatusType,
    statusText,
    settingsTagType,
    connectedClients,
    httpUrl,
    isProcessing,
    isProcessingLoading,
    settingsChanged,
    normalizedSettings,
    loadServerState,
    toggleServer,
    hotRestartServer,
    copyServerUrl,
    saveSettingsToServer,
    startStatusPolling,
    stopStatusPolling,
} = useServerState();

const {
    isSaving,
    isSavingLoading,
    toolCategories,
    totalTools,
    enabledTools,
    disabledTools,
    getCategoryDisplayName,
    getToolsByCategory,
    loadToolManagerState,
    updateSingleToolStatus,
    saveChanges,
    selectAllTools,
    deselectAllTools,
    toggleCategoryTools,
} = useToolManager();

const toolSections = computed(() => {
    return toolCategories.value.map((category) => ({
        category,
        displayName: getCategoryDisplayName(category),
        tools: getToolsByCategory(category),
    }));
});

const switchTab = (tabName: string | number) => {
    if (tabName === 'tools') {
        activeTab.value = 'tools';
    } else if (tabName === 'ai') {
        activeTab.value = 'ai';
    } else {
        activeTab.value = 'server';
    }

    if (activeTab.value === 'tools') {
        void loadToolManagerState();
    }
};

const normalizePortInput = () => {
    settings.value = {
        ...settings.value,
        port: normalizedSettings.value.port,
    };
};

const normalizeMaxConnectionsInput = () => {
    settings.value = {
        ...settings.value,
        maxConnections: normalizedSettings.value.maxConnections,
    };
};

onMounted(async () => {
    await Promise.all([loadServerState(), loadToolManagerState()]);
    startStatusPolling();
});

onUnmounted(() => {
    stopStatusPolling();
});
</script>

<template>
    <div class="mcp-dashboard min-h-full">
        <header class="dashboard-header">
            <div>
                <h1 class="dashboard-title">MCP 服务器控制台</h1>
                <p class="dashboard-subtitle">统一管理服务状态、连接参数与工具开关</p>
            </div>
            <el-tag :type="settingsTagType" effect="dark">{{ statusText }}</el-tag>
        </header>

        <el-tabs v-model="activeTab" class="dashboard-tabs" @tab-change="switchTab">
            <el-tab-pane label="服务器控制" name="server" class="pt-3">
                <div class="dashboard-grid">
                    <div class="dashboard-main-column">
                        <ServerStatusCard
                            :status-text="statusText"
                            :status-type="serverStatusType"
                            :tag-type="settingsTagType"
                            :running="serverRunning"
                            :connected-clients="connectedClients"
                            :is-processing="isProcessing"
                            :is-loading="isProcessingLoading"
                            @toggle-server="toggleServer"
                            @restart-server="hotRestartServer"
                        />
                        <ConnectionInfoCard
                            :running="serverRunning"
                            :http-url="httpUrl"
                            @copy-url="copyServerUrl"
                        />
                    </div>
                    <div class="dashboard-side-column">
                        <ServerSettingsForm
                            v-model="settings"
                            :server-running="serverRunning"
                            :is-processing="isProcessing"
                            :is-loading="isProcessingLoading"
                            :settings-changed="settingsChanged"
                            @normalize-port="normalizePortInput"
                            @normalize-max-connections="normalizeMaxConnectionsInput"
                            @save-settings="saveSettingsToServer"
                        />
                    </div>
                </div>
            </el-tab-pane>

            <el-tab-pane label="工具管理" name="tools">
                <div class="tools-pane">
                    <ToolsOverview
                        :total="totalTools"
                        :enabled="enabledTools"
                        :disabled="disabledTools"
                        :is-saving="isSaving"
                        :is-saving-loading="isSavingLoading"
                        @select-all="selectAllTools"
                        @deselect-all="deselectAllTools"
                        @save-changes="saveChanges"
                    />
                    <div class="tools-pane-content">
                        <ToolsCategoryList
                            :sections="toolSections"
                            :is-saving="isSaving"
                            :is-saving-loading="isSavingLoading"
                            @toggle-tool="({ category, name, enabled }) => updateSingleToolStatus(category, name, enabled)"
                            @toggle-category="({ category, enabled }) => toggleCategoryTools(category, enabled)"
                        />
                    </div>
                </div>
            </el-tab-pane>

            <el-tab-pane label="AI客户端配置" name="ai">
                <AiClientConfigPanel :server-port="normalizedSettings.port" />
            </el-tab-pane>
        </el-tabs>

        <ToastHost />
    </div>
</template>

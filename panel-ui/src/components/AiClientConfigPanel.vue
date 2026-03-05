<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useAiClientConfig } from '../composables/useAiClientConfig';
import type { AiClientStatus, AiClientType } from '../types/contracts';

interface Props {
    serverPort: number;
}

const props = defineProps<Props>();

const {
    serverName,
    scope,
    authToken,
    serverUrl,
    clients,
    selectedClient,
    generatedClientConfig,
    cliCommandsText,
    batchResults,
    loadingStatus,
    loadingBatch,
    loadingGenerate,
    operatingClient,
    setServerPort,
    copyText,
    refreshStatus,
    generateCommands,
    generateConfigPreview,
    addSingle,
    removeSingle,
    addAll,
    removeAll,
    openClientConfigPath,
} = useAiClientConfig();

watch(
    () => props.serverPort,
    (port) => {
        setServerPort(port);
    },
    { immediate: true },
);

onMounted(() => {
    void refreshStatus();
});

const CLIENT_TYPE_ORDER: AiClientType[] = ['cursor', 'windsurf', 'trae', 'codex-cli', 'claude-cli', 'gemini-cli'];

const clientOptions = computed(() => {
    const clientNameMap = new Map(clients.value.map((item) => [item.clientType, item.clientName]));
    return CLIENT_TYPE_ORDER.map((clientType) => ({
        value: clientType,
        label: clientNameMap.get(clientType) || clientType,
    }));
});

watch(clientOptions, (options) => {
    const hasSelected = options.some((item) => item.value === selectedClient.value);
    if (!hasSelected) {
        selectedClient.value = 'cursor';
    }
}, { immediate: true });

const batchResultEntries = computed(() => Object.entries(batchResults.value || {}));

function statusTagType(client: AiClientStatus) {
    return client.exists ? 'success' : 'info';
}

function clientTypeTag(client: AiClientStatus) {
    return client.isIDE ? 'IDE' : 'CLI';
}

function clientTypeTagStyle(client: AiClientStatus) {
    return client.isIDE ? 'success' : 'warning';
}

function isClientOperating(clientType: AiClientType) {
    return operatingClient.value === clientType;
}
</script>

<template>
    <div class="ai-config-pane pt-4">
        <el-card class="console-card" shadow="never">
            <div class="ai-config-header">
                <div class="ai-config-title">
                    <h3>AI 客户端配置</h3>
                    <p class="panel-subtle">一键写入 Cursor/Windsurf/Trae/Codex CLI，生成 Claude/Gemini CLI 命令</p>
                </div>
                <div class="ai-config-actions">
                    <el-button :loading="loadingStatus" @click="void refreshStatus()">刷新状态</el-button>
                    <el-button type="primary" :loading="loadingBatch" @click="void addAll()">一键写入</el-button>
                    <el-button type="danger" plain :loading="loadingBatch" @click="void removeAll()">一键移除</el-button>
                </div>
            </div>

            <div class="ai-config-form">
                <el-form label-width="110px" class="grid-form">
                    <el-form-item label="服务器名称">
                        <el-input v-model="serverName" placeholder="cocos-creator" />
                    </el-form-item>
                    <el-form-item label="服务器 URL">
                        <el-input :model-value="serverUrl" readonly class="url-readonly-input" />
                    </el-form-item>
                    <el-form-item label="CLI scope">
                        <el-select v-model="scope" class="w-full" :teleported="false">
                            <el-option label="user" value="user" />
                            <el-option label="project" value="project" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Bearer Token">
                        <el-input v-model="authToken" placeholder="可选，用于生成 Authorization 头" show-password />
                    </el-form-item>
                </el-form>
            </div>
        </el-card>

        <el-card class="console-card" shadow="never">
            <el-table :data="clients" stripe size="small">
                <el-table-column label="客户端" min-width="180">
                    <template #default="{ row }">
                        <div class="client-name-cell">
                            <span class="font-medium">{{ row.clientName }}</span>
                            <el-tag size="small" :type="clientTypeTagStyle(row)">{{ clientTypeTag(row) }}</el-tag>
                            <el-tag size="small" effect="plain">{{ row.isAutoConfig ? '自动' : '手动' }}</el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag size="small" :type="statusTagType(row)">{{ row.exists ? '已配置' : '未配置' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="配置路径" min-width="360">
                    <template #default="{ row }">
                        <div class="path-cell">
                            <span class="path-text">{{ row.configPath || '-' }}</span>
                            <el-button text type="primary" :disabled="!row.configPath"
                                @click="void openClientConfigPath(row.configPath)">
                                打开
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="270" align="right">
                    <template #default="{ row }">
                        <div class="operation-cell">
                            <el-button size="small" :loading="isClientOperating(row.clientType)"
                                @click="void addSingle(row.clientType)">
                                写入
                            </el-button>
                            <el-button size="small" :loading="isClientOperating(row.clientType)" type="danger" plain
                                @click="void removeSingle(row.clientType)">
                                移除
                            </el-button>
                            <el-button size="small" text type="primary" :loading="loadingGenerate"
                                @click="void generateConfigPreview(row.clientType)">
                                生成配置
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <div class="ai-output-grid">
            <el-card class="console-card" shadow="never">
                <div class="output-header">
                    <h4>CLI 命令</h4>
                    <div class="output-actions">
                        <el-button size="small" :loading="loadingGenerate" @click="void generateCommands()">生成命令</el-button>
                        <el-button size="small" @click="void copyText(cliCommandsText, 'CLI 命令已复制')">复制</el-button>
                    </div>
                </div>
                <el-input :model-value="cliCommandsText" type="textarea" :rows="10" readonly />
            </el-card>

            <el-card class="console-card" shadow="never">
                <div class="output-header">
                    <h4>客户端配置片段</h4>
                    <div class="output-actions">
                        <el-select v-model="selectedClient" class="!w-[160px]" size="small" :teleported="false">
                            <el-option v-for="item in clientOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                        <el-button size="small" :loading="loadingGenerate"
                            @click="void generateConfigPreview(selectedClient)">
                            生成
                        </el-button>
                        <el-button size="small" @click="void copyText(generatedClientConfig || '', '配置内容已复制')">复制</el-button>
                    </div>
                </div>
                <el-input :model-value="generatedClientConfig" type="textarea" :rows="10" readonly />
            </el-card>
        </div>

        <el-card v-if="batchResultEntries.length > 0" class="console-card" shadow="never">
            <h4 class="mb-2 text-sm font-medium">批量操作结果</h4>
            <div class="result-grid">
                <el-tag v-for="[clientName, message] in batchResultEntries" :key="clientName" effect="plain">
                    {{ clientName }}: {{ message }}
                </el-tag>
            </div>
        </el-card>
    </div>
</template>

<style scoped>
.ai-config-pane {
    display: grid;
    gap: 14px;
    position: relative;
    z-index: 0;
}

/* Keep table stack below sticky tabs/header to avoid overlap while scrolling */
:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
    position: relative;
    z-index: 0;
}

.ai-config-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.ai-config-title h3,
.ai-config-title p {
    margin: 0;
}

.ai-config-title p {
    margin-top: 4px;
    font-size: 12px;
}

.ai-config-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.grid-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
}

.client-name-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.path-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.path-text {
    word-break: break-all;
    color: var(--el-text-color-secondary);
}

.operation-cell {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
}

.ai-output-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.output-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.output-header h4 {
    margin: 0;
    font-size: 14px;
}

.output-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.result-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

@media (max-width: 980px) {
    .grid-form {
        grid-template-columns: 1fr;
    }

    .ai-output-grid {
        grid-template-columns: 1fr;
    }

    .path-cell {
        align-items: flex-start;
        flex-direction: column;
    }
}

.url-readonly-input :deep(.el-input__wrapper) {
    background-color: var(--el-disabled-bg-color, #f5f7fa);
    cursor: not-allowed;
    box-shadow: 0 0 0 1px var(--el-disabled-border-color, #e4e7ed) inset;
}

.url-readonly-input :deep(.el-input__inner) {
    color: var(--el-text-color-secondary);
    cursor: not-allowed;
}
</style>

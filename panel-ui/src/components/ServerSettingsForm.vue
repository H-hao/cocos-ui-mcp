<script setup lang="ts">
import type { ServerSettings } from '../types/contracts';

interface Props {
    modelValue: ServerSettings;
    serverRunning: boolean;
    isProcessing: boolean;
    isLoading: boolean;
    settingsChanged: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: ServerSettings): void;
    (e: 'save-settings'): void;
    (e: 'normalize-port'): void;
    (e: 'normalize-max-connections'): void;
}>();

function updateSettings(patch: Partial<ServerSettings>) {
    emit('update:modelValue', {
        ...props.modelValue,
        ...patch,
    });
}

function toNumber(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function handlePortChange(value: number | undefined) {
    updateSettings({ port: toNumber(value, props.modelValue.port) });
}

function handleAutoStartChange(value: boolean | string | number) {
    updateSettings({ autoStart: Boolean(value) });
}

function handleDebugLogChange(value: boolean | string | number) {
    updateSettings({ debugLog: Boolean(value) });
}

function handleMaxConnectionsChange(value: number | undefined) {
    updateSettings({ maxConnections: toNumber(value, props.modelValue.maxConnections) });
}
</script>

<template>
    <el-card class="console-card" shadow="never">
        <template #header>
            <div class="flex items-center justify-between">
                <span class="text-sm font-semibold tracking-wide">服务器设置</span>
                <span class="text-xs panel-subtle">实时校验端口与并发上限</span>
            </div>
        </template>

        <el-form label-position="top" class="grid gap-4">
            <el-form-item label="端口（1024 - 65535）">
                <el-input-number
                    :model-value="modelValue.port"
                    :min="1024"
                    :max="65535"
                    :step="1"
                    controls-position="right"
                    class="w-full"
                    :disabled="serverRunning"
                    @update:model-value="handlePortChange"
                    @blur="$emit('normalize-port')"
                />
            </el-form-item>

            <el-form-item label="自动启动">
                <el-switch
                    :model-value="modelValue.autoStart"
                    @update:model-value="handleAutoStartChange"
                />
            </el-form-item>

            <el-form-item label="调试日志">
                <el-switch
                    :model-value="modelValue.debugLog"
                    @update:model-value="handleDebugLogChange"
                />
            </el-form-item>

            <el-form-item label="最大连接数（1 - 100）">
                <el-input-number
                    :model-value="modelValue.maxConnections"
                    :min="1"
                    :max="100"
                    :step="1"
                    controls-position="right"
                    class="w-full"
                    @update:model-value="handleMaxConnectionsChange"
                    @blur="$emit('normalize-max-connections')"
                />
            </el-form-item>

            <div class="flex justify-end pt-2">
                <el-button
                    type="primary"
                    :disabled="!settingsChanged || isProcessing"
                    :loading="isLoading"
                    @click="$emit('save-settings')"
                >
                    保存设置
                </el-button>
            </div>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import type { ServerStatusType } from '../types/contracts';

interface Props {
    statusText: string;
    statusType: ServerStatusType;
    tagType: 'success' | 'warning' | 'info' | 'danger';
    running: boolean;
    connectedClients: number;
    isProcessing: boolean;
    isLoading: boolean;
}

defineProps<Props>();

defineEmits<{
    (e: 'toggle-server'): void;
    (e: 'restart-server'): void;
}>();
</script>

<template>
    <el-card class="console-card" shadow="never">
        <template #header>
            <div class="flex items-center justify-between">
                <span class="text-sm font-semibold tracking-wide">服务器状态</span>
                <el-tag :type="tagType" effect="dark" size="small">
                    {{ statusText }}
                </el-tag>
            </div>
        </template>

        <el-descriptions :column="1" border size="small" class="status-descriptions">
            <el-descriptions-item label="运行状态">
                {{ statusText }}
            </el-descriptions-item>
            <el-descriptions-item label="连接数">
                {{ running ? connectedClients : 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="探测模式">
                {{ statusType === 'checking' ? '轮询检测中' : '周期轮询' }}
            </el-descriptions-item>
        </el-descriptions>

        <div class="mt-4 flex flex-wrap gap-3">
            <el-button type="primary" :loading="isLoading" @click="$emit('toggle-server')">
                {{ running ? '停止服务器' : '启动服务器' }}
            </el-button>
            <el-button :disabled="isProcessing" @click="$emit('restart-server')">
                从 dist 热重启
            </el-button>
        </div>
    </el-card>
</template>

<style scoped>
.status-descriptions :deep(.el-descriptions__label) {
    width: 92px;
}
</style>

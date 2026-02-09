<script setup lang="ts">
interface Props {
    running: boolean;
    httpUrl: string;
}

defineProps<Props>();

defineEmits<{
    (e: 'copy-url'): void;
}>();
</script>

<template>
    <el-card class="console-card" shadow="never">
        <template #header>
            <div class="flex items-center justify-between">
                <span class="text-sm font-semibold tracking-wide">连接信息</span>
                <el-tag :type="running ? 'success' : 'info'" effect="plain" size="small">
                    {{ running ? '可连接' : '未运行' }}
                </el-tag>
            </div>
        </template>

        <div class="grid gap-3">
            <label class="text-xs panel-subtle">HTTP URL</label>
            <div class="flex gap-2">
                <el-input :model-value="httpUrl || '服务器未启动'" readonly />
                <el-button :disabled="!httpUrl" @click="$emit('copy-url')">复制</el-button>
            </div>
        </div>
    </el-card>
</template>

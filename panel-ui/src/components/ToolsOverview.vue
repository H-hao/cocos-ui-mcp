<script setup lang="ts">
interface Props {
    total: number;
    enabled: number;
    disabled: number;
    isSaving: boolean;
    isSavingLoading: boolean;
}

defineProps<Props>();

defineEmits<{
    (e: 'select-all'): void;
    (e: 'deselect-all'): void;
    (e: 'save-changes'): void;
}>();
</script>

<template>
    <div class="tools-overview-container">
        <el-card class="console-card" shadow="never">
            <div class="tools-overview-row">
                <div class="tools-overview-title">
                    <h3 class="text-sm font-semibold">工具管理</h3>
                    <p class="text-xs panel-subtle">默认启用 UI Graph 高层工具；legacy 细粒度工具保留为手动兜底。Schema: ui-graph/v0.1 / ui-patch/v0.1，Skill: cocos-ui-graph-skill/v0.1。</p>
                </div>
                <div class="tools-overview-actions">
                    <div class="tools-overview-group tools-overview-tags">
                        <el-tag type="info" effect="plain" size="small">总计 {{ total }}</el-tag>
                        <el-tag type="success" effect="plain" size="small">启用 {{ enabled }}</el-tag>
                        <el-tag type="warning" effect="plain" size="small">禁用 {{ disabled }}</el-tag>
                    </div>
                    <div class="tools-overview-group tools-overview-buttons">
                        <el-button-group>
                            <el-button :disabled="isSaving || total === 0" @click="$emit('select-all')">全选</el-button>
                            <el-button :disabled="isSaving || total === 0" @click="$emit('deselect-all')">取消全选</el-button>
                        </el-button-group>
                        <el-button type="primary" :loading="isSavingLoading" :disabled="isSaving || total === 0"
                            @click="$emit('save-changes')">
                            保存更改
                        </el-button>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

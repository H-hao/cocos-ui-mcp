<script setup lang="ts">
import type { UiGraphProtocolState } from '../types/contracts';

interface Props {
    total: number;
    enabled: number;
    disabled: number;
    isSaving: boolean;
    isSavingLoading: boolean;
    uiGraphProtocol?: UiGraphProtocolState | null;
}

const props = defineProps<Props>();

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
                    <p class="text-xs panel-subtle">默认启用 UI Graph 高层工具；legacy 细粒度工具保留为手动兜底。</p>
                    <div v-if="props.uiGraphProtocol" class="ui-graph-protocol">
                        <el-tag size="small" type="info" effect="plain">Graph {{ props.uiGraphProtocol.graphSchemaVersion }}</el-tag>
                        <el-tag size="small" type="info" effect="plain">Patch {{ props.uiGraphProtocol.patchSchemaVersion }}</el-tag>
                        <el-tag size="small" type="success" effect="plain">Skill {{ props.uiGraphProtocol.supportedSkillVersion }}</el-tag>
                        <el-tag size="small" type="warning" effect="plain">Hash {{ props.uiGraphProtocol.schemaHash }}</el-tag>
                        <el-tag size="small" :type="props.uiGraphProtocol.skillVersionMatched === false ? 'danger' : 'success'" effect="plain">Skill {{ props.uiGraphProtocol.skillVersionMatched === false ? '待同步' : '匹配' }}</el-tag>
                    </div>
                    <p v-else class="text-xs panel-subtle">UI Graph 协议信息暂不可用，请刷新工具状态。</p>
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

<style scoped>
.ui-graph-protocol {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}
</style>

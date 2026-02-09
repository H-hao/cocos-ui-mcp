<script setup lang="ts">
import { computed } from 'vue';
import type { ToolConfig } from '../types/contracts';

interface CategorySection {
    category: string;
    displayName: string;
    tools: ToolConfig[];
}

interface Props {
    sections: CategorySection[];
    isSaving: boolean;
    isSavingLoading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'toggle-category', payload: { category: string; enabled: boolean }): void;
    (e: 'toggle-tool', payload: { category: string; name: string; enabled: boolean }): void;
}>();

const activeSections = computed(() => props.sections.map((section) => section.category));

function handleToolSwitchChange(tool: ToolConfig, value: boolean | string | number) {
    emit('toggle-tool', {
        category: tool.category,
        name: tool.name,
        enabled: Boolean(value),
    });
}
</script>

<template>
    <el-card class="console-card" shadow="never">
        <el-collapse :model-value="activeSections">
            <el-collapse-item v-for="section in sections" :key="section.category" :name="section.category">
                <template #title>
                    <div class="flex w-full items-center justify-between pr-3">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium">{{ section.displayName }}</span>
                            <el-tag size="small" effect="plain">{{ section.tools.length }}</el-tag>
                        </div>
                        <div class="flex items-center gap-2">
                            <el-button
                                size="small"
                                :disabled="isSaving"
                                @click.stop="emit('toggle-category', { category: section.category, enabled: true })"
                            >
                                全选
                            </el-button>
                            <el-button
                                size="small"
                                :disabled="isSaving"
                                @click.stop="emit('toggle-category', { category: section.category, enabled: false })"
                            >
                                取消全选
                            </el-button>
                        </div>
                    </div>
                </template>

                <div class="grid gap-2 pb-2">
                    <div
                        v-for="tool in section.tools"
                        :key="`${tool.category}-${tool.name}`"
                        class="tool-row"
                    >
                        <div class="tool-content">
                            <div class="text-sm font-medium">{{ tool.name }}</div>
                            <div class="mt-1 text-xs panel-subtle">{{ tool.description || '无描述' }}</div>
                        </div>
                        <el-switch
                            :model-value="tool.enabled"
                            :loading="isSavingLoading"
                            @update:model-value="handleToolSwitchChange(tool, $event)"
                        />
                    </div>
                </div>
            </el-collapse-item>
        </el-collapse>

        <el-empty v-if="sections.length === 0" description="暂无可管理工具" />
    </el-card>
</template>

<style scoped>
.tool-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: var(--el-fill-color-light);
}

.tool-content {
    min-width: 0;
}
</style>

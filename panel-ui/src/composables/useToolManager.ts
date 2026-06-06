import { computed, ref } from 'vue';
import {
    getToolManagerState,
    toErrorMessage,
    updateToolStatus,
    updateToolStatusBatch,
} from '../services/editor-api';
import { notifyError, notifySuccess } from '../services/notify';
import type { ToolConfig, ToolStatusUpdate, UiGraphProtocolState } from '../types/contracts';

function cloneTools(tools: ToolConfig[]): ToolConfig[] {
    return tools.map((tool) => ({ ...tool }));
}

const CATEGORY_NAME_MAP: Record<string, string> = {
    uiGraph: 'UI Graph 生产线',
    scene: '场景工具',
    node: '节点工具',
    component: '组件工具',
    prefab: '预制体工具',
    project: '项目工具',
    debug: '调试工具',
    preferences: '偏好设置工具',
    server: '服务器工具',
    broadcast: '广播工具',
    sceneView: '场景视图工具',
    referenceImage: '参考图片工具',
    assetAdvanced: '高级资源工具',
    validation: '验证工具',
};

export function useToolManager() {
    const availableTools = ref<ToolConfig[]>([]);
    const isSaving = ref(false);
    const isSavingLoading = ref(false);
    const lastCommittedTools = ref<ToolConfig[]>([]);
    const uiGraphProtocol = ref<UiGraphProtocolState | null>(null);
    let loadingDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let loadingVisibleSince = 0;

    const LOADING_DELAY_MS = 120;
    const MIN_LOADING_VISIBLE_MS = 280;

    const beginSaving = (): boolean => {
        if (isSaving.value) {
            return false;
        }

        isSaving.value = true;
        isSavingLoading.value = false;
        loadingVisibleSince = 0;

        if (loadingDelayTimer) {
            clearTimeout(loadingDelayTimer);
            loadingDelayTimer = null;
        }

        loadingDelayTimer = setTimeout(() => {
            isSavingLoading.value = true;
            loadingVisibleSince = Date.now();
            loadingDelayTimer = null;
        }, LOADING_DELAY_MS);

        return true;
    };

    const endSaving = async () => {
        if (loadingDelayTimer) {
            clearTimeout(loadingDelayTimer);
            loadingDelayTimer = null;
        }

        if (isSavingLoading.value) {
            const elapsed = Date.now() - loadingVisibleSince;
            const remaining = Math.max(0, MIN_LOADING_VISIBLE_MS - elapsed);
            if (remaining > 0) {
                await new Promise((resolve) => setTimeout(resolve, remaining));
            }
        }

        isSavingLoading.value = false;
        isSaving.value = false;
        loadingVisibleSince = 0;
    };

    const toolCategories = computed(() => {
        const uniqueCategories = new Set(availableTools.value.map((tool) => tool.category));
        return Array.from(uniqueCategories);
    });

    const totalTools = computed(() => availableTools.value.length);
    const enabledTools = computed(() => availableTools.value.filter((tool) => tool.enabled).length);
    const disabledTools = computed(() => totalTools.value - enabledTools.value);

    const getCategoryDisplayName = (category: string): string => CATEGORY_NAME_MAP[category] || category;

    const getToolsByCategory = (category: string): ToolConfig[] => {
        return availableTools.value.filter((tool) => tool.category === category);
    };

    const setAllToolsEnabled = (enabled: boolean) => {
        availableTools.value = availableTools.value.map((tool) => ({
            ...tool,
            enabled,
        }));
    };

    const setCategoryToolsEnabled = (category: string, enabled: boolean) => {
        availableTools.value = availableTools.value.map((tool) => {
            if (tool.category !== category) {
                return tool;
            }
            return {
                ...tool,
                enabled,
            };
        });
    };

    const setToolEnabled = (category: string, name: string, enabled: boolean) => {
        availableTools.value = availableTools.value.map((tool) => {
            if (tool.category === category && tool.name === name) {
                return {
                    ...tool,
                    enabled,
                };
            }
            return tool;
        });
    };

    const loadToolManagerState = async () => {
        try {
            const result = await getToolManagerState();
            if (!result?.success || !Array.isArray(result.availableTools)) {
                throw new Error('工具状态格式异常');
            }

            availableTools.value = cloneTools(result.availableTools);
            lastCommittedTools.value = cloneTools(result.availableTools);
            uiGraphProtocol.value = result.uiGraphProtocol || null;
        } catch (error) {
            notifyError(`加载工具列表失败：${toErrorMessage(error)}`);
        }
    };

    const updateSingleToolStatus = async (category: string, name: string, enabled: boolean) => {
        const snapshot = cloneTools(availableTools.value);
        setToolEnabled(category, name, enabled);

        try {
            const result = await updateToolStatus(category, name, enabled);
            if (!result?.success) {
                throw new Error('后端未返回成功状态');
            }
        } catch (error) {
            availableTools.value = snapshot;
            notifyError(`更新工具状态失败：${toErrorMessage(error)}`);
        }
    };

    const saveChanges = async () => {
        if (totalTools.value === 0 || !beginSaving()) {
            return;
        }

        const previousSnapshot = cloneTools(lastCommittedTools.value);
        const payload: ToolStatusUpdate[] = availableTools.value.map((tool) => ({
            category: String(tool.category),
            name: String(tool.name),
            enabled: Boolean(tool.enabled),
        }));

        try {
            const result = await updateToolStatusBatch(payload);
            if (!result?.success) {
                throw new Error('后端未返回成功状态');
            }

            lastCommittedTools.value = cloneTools(availableTools.value);
            notifySuccess('工具配置已保存');
        } catch (error) {
            availableTools.value = previousSnapshot;
            lastCommittedTools.value = previousSnapshot;
            notifyError(`保存工具配置失败：${toErrorMessage(error)}`);
        } finally {
            await endSaving();
        }
    };

    const selectAllTools = () => {
        setAllToolsEnabled(true);
    };

    const deselectAllTools = () => {
        setAllToolsEnabled(false);
    };

    const toggleCategoryTools = (category: string, enabled: boolean) => {
        setCategoryToolsEnabled(category, enabled);
    };

    return {
        availableTools,
        isSaving,
        isSavingLoading,
        toolCategories,
        totalTools,
        enabledTools,
        disabledTools,
        uiGraphProtocol,
        getCategoryDisplayName,
        getToolsByCategory,
        loadToolManagerState,
        updateSingleToolStatus,
        saveChanges,
        selectAllTools,
        deselectAllTools,
        toggleCategoryTools,
    };
}

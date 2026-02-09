import { computed, ref, watch } from 'vue';
import {
    getServerStatus,
    restartServerFromDist,
    startServer,
    stopServer,
    toErrorMessage,
    updateSettings,
} from '../services/editor-api';
import { notifyError, notifySuccess } from '../services/notify';
import type {
    RawServerSettings,
    ServerSettings,
    ServerStatus,
    ServerStatusType,
} from '../types/contracts';

const DEFAULT_SETTINGS: ServerSettings = {
    port: 3000,
    autoStart: false,
    debugLog: false,
    maxConnections: 10,
};

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return fallback;
    }

    const integerValue = Math.trunc(numericValue);
    return Math.min(max, Math.max(min, integerValue));
}

function normalizeSettings(source: RawServerSettings | ServerSettings | undefined): ServerSettings {
    const debugFlag = source
        ? ('enableDebugLog' in source ? source.enableDebugLog : source.debugLog)
        : undefined;

    return {
        port: clampInteger(source?.port, 1024, 65535, DEFAULT_SETTINGS.port),
        autoStart: Boolean(source?.autoStart),
        debugLog: Boolean(debugFlag),
        maxConnections: clampInteger(source?.maxConnections, 1, 100, DEFAULT_SETTINGS.maxConnections),
    };
}

export function useServerState() {
    const settings = ref<ServerSettings>({ ...DEFAULT_SETTINGS });
    const serverRunning = ref(false);
    const serverStatusType = ref<ServerStatusType>('checking');
    const connectedClients = ref(0);
    const httpUrl = ref('');
    const isProcessing = ref(false);
    const isProcessingLoading = ref(false);
    const settingsChanged = ref(false);

    const isSyncingSettings = ref(false);
    let statusPollingTimer: ReturnType<typeof setInterval> | null = null;
    let loadingDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let loadingVisibleSince = 0;

    const LOADING_DELAY_MS = 120;
    const MIN_LOADING_VISIBLE_MS = 280;

    const beginProcessing = (): boolean => {
        if (isProcessing.value) {
            return false;
        }

        isProcessing.value = true;
        isProcessingLoading.value = false;
        loadingVisibleSince = 0;

        if (loadingDelayTimer) {
            clearTimeout(loadingDelayTimer);
            loadingDelayTimer = null;
        }

        loadingDelayTimer = setTimeout(() => {
            isProcessingLoading.value = true;
            loadingVisibleSince = Date.now();
            loadingDelayTimer = null;
        }, LOADING_DELAY_MS);

        return true;
    };

    const endProcessing = async () => {
        if (loadingDelayTimer) {
            clearTimeout(loadingDelayTimer);
            loadingDelayTimer = null;
        }

        if (isProcessingLoading.value) {
            const elapsed = Date.now() - loadingVisibleSince;
            const remaining = Math.max(0, MIN_LOADING_VISIBLE_MS - elapsed);
            if (remaining > 0) {
                await new Promise((resolve) => setTimeout(resolve, remaining));
            }
        }

        isProcessingLoading.value = false;
        isProcessing.value = false;
        loadingVisibleSince = 0;
    };

    const statusText = computed(() => {
        if (serverStatusType.value === 'running') {
            return '运行中';
        }
        if (serverStatusType.value === 'stopped') {
            return '已停止';
        }
        if (serverStatusType.value === 'unknown') {
            return '状态未知';
        }
        return '检测中';
    });

    const normalizedSettings = computed<ServerSettings>(() => normalizeSettings(settings.value));

    const settingsTagType = computed<'success' | 'warning' | 'info' | 'danger'>(() => {
        if (serverStatusType.value === 'running') {
            return 'success';
        }
        if (serverStatusType.value === 'stopped') {
            return 'warning';
        }
        if (serverStatusType.value === 'unknown') {
            return 'danger';
        }
        return 'info';
    });

    const applyStatus = (status: ServerStatus) => {
        const running = Boolean(status?.running);
        serverRunning.value = running;
        serverStatusType.value = running ? 'running' : 'stopped';
        connectedClients.value = Number(status?.clients || 0);
        httpUrl.value = running ? `http://localhost:${status.port}` : '';
    };

    const applySettings = (rawSettings?: RawServerSettings) => {
        if (!rawSettings) {
            return;
        }

        isSyncingSettings.value = true;
        settings.value = normalizeSettings(rawSettings);
        settingsChanged.value = false;
        isSyncingSettings.value = false;
    };

    const refreshServerStatus = async (silent = false) => {
        try {
            const status = await getServerStatus();
            applyStatus(status);
        } catch (error) {
            serverStatusType.value = 'unknown';
            if (!silent) {
                notifyError(`刷新服务器状态失败：${toErrorMessage(error)}`);
            }
        }
    };

    const loadServerState = async () => {
        try {
            const status = await getServerStatus();
            applyStatus(status);
            applySettings(status.settings);
        } catch (error) {
            serverStatusType.value = 'unknown';
            notifyError(`加载服务器状态失败：${toErrorMessage(error)}`);
        }
    };

    const saveSettingsToServer = async () => {
        if (!beginProcessing()) {
            return;
        }

        try {
            const payload = normalizedSettings.value;
            settings.value = { ...payload };
            await updateSettings(payload);
            settingsChanged.value = false;
            await refreshServerStatus();
            notifySuccess('设置已保存');
        } catch (error) {
            notifyError(`保存设置失败：${toErrorMessage(error)}`);
        } finally {
            await endProcessing();
        }
    };

    const toggleServer = async () => {
        if (!beginProcessing()) {
            return;
        }

        serverStatusType.value = 'checking';

        try {
            if (serverRunning.value) {
                await stopServer();
            } else {
                const payload = normalizedSettings.value;
                settings.value = { ...payload };
                await updateSettings(payload);
                await startServer();
            }

            await refreshServerStatus();
        } catch (error) {
            notifyError(`切换服务器失败：${toErrorMessage(error)}`);
        } finally {
            await endProcessing();
        }
    };

    const hotRestartServer = async () => {
        if (!beginProcessing()) {
            return;
        }

        serverStatusType.value = 'checking';

        try {
            const payload = normalizedSettings.value;
            settings.value = { ...payload };
            await updateSettings(payload);
            await restartServerFromDist();
            settingsChanged.value = false;
            await refreshServerStatus();
            notifySuccess('已从 dist 热重启服务器');
        } catch (error) {
            notifyError(`热重启失败：${toErrorMessage(error)}`);
        } finally {
            await endProcessing();
        }
    };

    const copyServerUrl = async () => {
        if (!httpUrl.value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(httpUrl.value);
            notifySuccess('连接地址已复制');
        } catch (error) {
            notifyError(`复制失败：${toErrorMessage(error)}`);
        }
    };

    const startStatusPolling = () => {
        if (statusPollingTimer) {
            clearInterval(statusPollingTimer);
        }

        statusPollingTimer = setInterval(() => {
            void refreshServerStatus(true);
        }, 2000);
    };

    const stopStatusPolling = () => {
        if (statusPollingTimer) {
            clearInterval(statusPollingTimer);
            statusPollingTimer = null;
        }
    };

    watch(
        settings,
        () => {
            if (isSyncingSettings.value) {
                return;
            }
            settingsChanged.value = true;
        },
        { deep: true },
    );

    return {
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
        refreshServerStatus,
        saveSettingsToServer,
        toggleServer,
        hotRestartServer,
        copyServerUrl,
        startStatusPolling,
        stopStatusPolling,
    };
}

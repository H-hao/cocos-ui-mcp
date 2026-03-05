import { computed, ref, watch } from 'vue';
import {
    addToAllClients,
    addToClient,
    generateCLICommands,
    generateClientConfig,
    getConfigStatus,
    openConfigFile,
    removeFromAllClients,
    removeFromClient,
    toErrorMessage,
} from '../services/editor-api';
import { notifyError, notifyInfo, notifySuccess } from '../services/notify';
import type {
    AiClientStatus,
    AiClientType,
    MCPServerConfigPayload,
    OperationLogEntry,
    OperationLogType,
} from '../types/contracts';

const CLIENT_META: Array<{ type: AiClientType; name: string; isIDE: boolean; isAutoConfig: boolean }> = [
    { type: 'cursor', name: 'Cursor', isIDE: true, isAutoConfig: true },
    { type: 'windsurf', name: 'Windsurf', isIDE: true, isAutoConfig: true },
    { type: 'trae', name: 'Trea CN', isIDE: true, isAutoConfig: true },
    { type: 'codex-cli', name: 'Codex CLI', isIDE: false, isAutoConfig: true },
    { type: 'claude-cli', name: 'Claude CLI', isIDE: false, isAutoConfig: false },
    { type: 'gemini-cli', name: 'Gemini CLI', isIDE: false, isAutoConfig: false },
];

function buildDefaultClients(): AiClientStatus[] {
    return CLIENT_META.map((item) => ({
        clientType: item.type,
        clientName: item.name,
        exists: false,
        configPath: '',
        isIDE: item.isIDE,
        isAutoConfig: item.isAutoConfig,
    }));
}

export function useAiClientConfig() {
    const serverPort = ref(3000);
    const serverName = ref('cocos-creator');
    const scope = ref<'user' | 'project'>('user');
    const authToken = ref('');

    const clients = ref<AiClientStatus[]>(buildDefaultClients());
    const selectedClient = ref<AiClientType>('cursor');
    const generatedClientConfig = ref('');
    const generatedCliCommands = ref({ claude: '', gemini: '' });
    const batchResults = ref<Record<string, string>>({});
    const configLogs = ref<OperationLogEntry[]>([]);

    const loadingStatus = ref(false);
    const loadingBatch = ref(false);
    const loadingGenerate = ref(false);
    const operatingClient = ref<AiClientType | ''>('');

    const serverUrl = computed(() => `http://127.0.0.1:${serverPort.value}/mcp`);

    const payload = computed<MCPServerConfigPayload>(() => {
        const name = serverName.value.trim() || 'cocos-creator';
        const token = authToken.value.trim();
        return {
            serverName: name,
            serverUrl: serverUrl.value,
            scope: scope.value,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
    });

    const cliCommandsText = computed(() => {
        return [
            '# Claude CLI',
            generatedCliCommands.value.claude || '(未生成)',
            '',
            '# Gemini CLI',
            generatedCliCommands.value.gemini || '(未生成)',
        ].join('\n');
    });

    function getLogTime() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }

    function addConfigLog(message: string, type: OperationLogType = 'info') {
        configLogs.value.unshift({
            time: getLogTime(),
            message,
            type,
        });
        if (configLogs.value.length > 50) {
            configLogs.value = configLogs.value.slice(0, 50);
        }
    }

    function setServerPort(port: number) {
        const numericPort = Number(port);
        if (!Number.isFinite(numericPort)) {
            return;
        }
        const nextPort = Math.max(1024, Math.min(65535, Math.trunc(numericPort)));
        serverPort.value = nextPort;
    }

    async function copyText(text: string, successText: string, logText?: string) {
        try {
            await navigator.clipboard.writeText(text);
            notifySuccess(successText);
            addConfigLog(logText || successText, 'success');
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`复制失败：${errorMessage}`);
            addConfigLog(`复制失败：${errorMessage}`, 'error');
        }
    }

    function mergeClients(statusClients: AiClientStatus[]): AiClientStatus[] {
        const map = new Map(statusClients.map((item) => [item.clientType, item]));
        return buildDefaultClients().map((base) => {
            const found = map.get(base.clientType);
            return found ? { ...base, ...found } : base;
        });
    }

    async function refreshStatus() {
        loadingStatus.value = true;
        try {
            const result = await getConfigStatus(payload.value.serverName, payload.value.scope || 'user');
            if (!result.success) {
                throw new Error(result.message || '获取配置状态失败');
            }
            clients.value = mergeClients(result.clients || []);
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`读取 AI 客户端状态失败：${errorMessage}`);
            addConfigLog(`读取 AI 客户端状态失败：${errorMessage}`, 'error');
            clients.value = mergeClients([]);
        } finally {
            loadingStatus.value = false;
        }
    }

    async function generateCommands() {
        loadingGenerate.value = true;
        try {
            const result = await generateCLICommands(payload.value);
            if (!result.success) {
                throw new Error(result.message || '生成命令失败');
            }
            generatedCliCommands.value = result.commands;
            notifySuccess('CLI 命令已生成');
            addConfigLog('CLI 命令已生成', 'success');
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`生成命令失败：${errorMessage}`);
            addConfigLog(`生成命令失败：${errorMessage}`, 'error');
        } finally {
            loadingGenerate.value = false;
        }
    }

    async function generateConfigPreview(clientType: AiClientType = selectedClient.value) {
        loadingGenerate.value = true;
        selectedClient.value = clientType;
        try {
            const result = await generateClientConfig(clientType, payload.value);
            if (!result.success) {
                throw new Error(result.message || '生成配置失败');
            }
            generatedClientConfig.value = result.content;
            notifySuccess(`已生成 ${clientType} 配置内容`);
            addConfigLog(`已生成 ${clientType} 配置内容`, 'success');
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`生成配置失败：${errorMessage}`);
            addConfigLog(`生成配置失败：${errorMessage}`, 'error');
        } finally {
            loadingGenerate.value = false;
        }
    }

    async function addSingle(clientType: AiClientType) {
        operatingClient.value = clientType;
        try {
            const result = await addToClient(clientType, payload.value);
            if (!result.success) {
                throw new Error(result.message);
            }
            notifySuccess(result.message);
            addConfigLog(result.message, 'success');
            await refreshStatus();
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`写入失败：${errorMessage}`);
            addConfigLog(`写入失败：${errorMessage}`, 'error');
        } finally {
            operatingClient.value = '';
        }
    }

    async function removeSingle(clientType: AiClientType) {
        operatingClient.value = clientType;
        try {
            const result = await removeFromClient(clientType, payload.value.serverName, payload.value.scope || 'user');
            if (!result.success) {
                throw new Error(result.message);
            }
            notifySuccess(result.message);
            addConfigLog(result.message, 'success');
            await refreshStatus();
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`移除失败：${errorMessage}`);
            addConfigLog(`移除失败：${errorMessage}`, 'error');
        } finally {
            operatingClient.value = '';
        }
    }

    async function addAll() {
        loadingBatch.value = true;
        try {
            const result = await addToAllClients(payload.value);
            if (!result.success) {
                throw new Error(result.message || '批量写入失败');
            }
            batchResults.value = result.results || {};
            notifySuccess('批量写入完成');
            for (const [clientName, message] of Object.entries(batchResults.value)) {
                addConfigLog(`${clientName}: ${message}`, 'info');
            }
            await refreshStatus();
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`批量写入失败：${errorMessage}`);
            addConfigLog(`批量写入失败：${errorMessage}`, 'error');
        } finally {
            loadingBatch.value = false;
        }
    }

    async function removeAll() {
        loadingBatch.value = true;
        try {
            const result = await removeFromAllClients(payload.value.serverName, payload.value.scope || 'user');
            if (!result.success) {
                throw new Error(result.message || '批量移除失败');
            }
            batchResults.value = result.results || {};
            notifySuccess('批量移除完成');
            for (const [clientName, message] of Object.entries(batchResults.value)) {
                addConfigLog(`${clientName}: ${message}`, 'info');
            }
            await refreshStatus();
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`批量移除失败：${errorMessage}`);
            addConfigLog(`批量移除失败：${errorMessage}`, 'error');
        } finally {
            loadingBatch.value = false;
        }
    }

    async function openClientConfigPath(configPath: string) {
        if (!configPath) {
            notifyInfo('该客户端暂无配置路径');
            return;
        }
        try {
            const result = await openConfigFile(configPath);
            if (!result.success) {
                throw new Error(result.message);
            }
            notifySuccess(result.message);
            addConfigLog(result.message, 'success');
        } catch (error) {
            const errorMessage = toErrorMessage(error);
            notifyError(`打开配置文件失败：${errorMessage}`);
            addConfigLog(`打开配置文件失败：${errorMessage}`, 'error');
        }
    }

    watch(scope, () => {
        void refreshStatus();
    });

    return {
        serverName,
        scope,
        authToken,
        serverUrl,
        clients,
        selectedClient,
        generatedClientConfig,
        generatedCliCommands,
        cliCommandsText,
        batchResults,
        configLogs,
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
    };
}

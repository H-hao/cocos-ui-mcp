import type {
    BatchClientOperationResult,
    CLICommandsResult,
    ClientConfigResult,
    ConfigOperationResult,
    ConfigStatusResult,
    MCPServerConfigPayload,
    OpenConfigFileResult,
    ServerSettings,
    ServerStatus,
    ToolManagerState,
    ToolStatusUpdate,
    AiClientType,
} from '../types/contracts';

const EXTENSION_NAME = 'ben-cocos-mcp';

type EditorBridge = {
    Message: {
        request: (extension: string, method: string, ...args: unknown[]) => Promise<any>;
    };
};

function getEditorBridge(): EditorBridge {
    const bridge = typeof Editor !== 'undefined' ? Editor : window.Editor;
    if (!bridge?.Message?.request) {
        throw new Error('Editor.Message.request 不可用，请在 Cocos Creator 扩展面板环境中运行。');
    }
    return bridge as EditorBridge;
}

export async function requestEditor<T>(method: string, ...args: unknown[]): Promise<T> {
    const editor = getEditorBridge();
    return editor.Message.request(EXTENSION_NAME, method, ...args) as Promise<T>;
}

export function toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return '未知错误';
}

export function getServerStatus(): Promise<ServerStatus> {
    return requestEditor<ServerStatus>('get-server-status');
}

export function startServer(): Promise<void> {
    return requestEditor<void>('start-server');
}

export function stopServer(): Promise<void> {
    return requestEditor<void>('stop-server');
}

export function restartServerFromDist(): Promise<void> {
    return requestEditor<void>('restart-server-from-dist');
}

export function updateSettings(settings: ServerSettings): Promise<{ success: boolean }> {
    return requestEditor<{ success: boolean }>('update-settings', settings);
}

export function getToolManagerState(): Promise<ToolManagerState> {
    return requestEditor<ToolManagerState>('getToolManagerState');
}

export function updateToolStatus(category: string, name: string, enabled: boolean): Promise<{ success: boolean }> {
    return requestEditor<{ success: boolean }>('updateToolStatus', category, name, enabled);
}

export function updateToolStatusBatch(updates: ToolStatusUpdate[]): Promise<{ success: boolean }> {
    return requestEditor<{ success: boolean }>('updateToolStatusBatch', updates);
}

export function getConfigStatus(serverName: string): Promise<ConfigStatusResult> {
    return requestEditor<ConfigStatusResult>('get-config-status', serverName);
}

export function generateCLICommands(payload: MCPServerConfigPayload): Promise<CLICommandsResult> {
    return requestEditor<CLICommandsResult>('generate-cli-commands', payload);
}

export function generateClientConfig(clientType: AiClientType, payload: MCPServerConfigPayload): Promise<ClientConfigResult> {
    return requestEditor<ClientConfigResult>('generate-client-config', clientType, payload);
}

export function addToClient(clientType: AiClientType, payload: MCPServerConfigPayload): Promise<ConfigOperationResult> {
    return requestEditor<ConfigOperationResult>('add-to-client', clientType, payload);
}

export function removeFromClient(clientType: AiClientType, serverName: string): Promise<ConfigOperationResult> {
    return requestEditor<ConfigOperationResult>('remove-from-client', clientType, serverName);
}

export function addToAllClients(payload: MCPServerConfigPayload): Promise<BatchClientOperationResult> {
    return requestEditor<BatchClientOperationResult>('add-to-all-clients', payload);
}

export function removeFromAllClients(serverName: string): Promise<BatchClientOperationResult> {
    return requestEditor<BatchClientOperationResult>('remove-from-all-clients', serverName);
}

export function openConfigFile(configPath: string): Promise<OpenConfigFileResult> {
    return requestEditor<OpenConfigFileResult>('open-config-file', configPath);
}

export function openToolManager(): Promise<{ success: boolean }> {
    return requestEditor<{ success: boolean }>('open-tool-manager');
}

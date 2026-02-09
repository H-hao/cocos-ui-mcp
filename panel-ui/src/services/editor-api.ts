import type {
    ServerSettings,
    ServerStatus,
    ToolManagerState,
    ToolStatusUpdate,
} from '../types/contracts';

const EXTENSION_NAME = 'cocos-mcp-server';

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

export interface ToolConfig {
    category: string;
    name: string;
    enabled: boolean;
    description: string;
}

export interface ServerSettings {
    port: number;
    autoStart: boolean;
    debugLog: boolean;
    maxConnections: number;
}

export interface RawServerSettings {
    port?: number;
    autoStart?: boolean;
    enableDebugLog?: boolean;
    debugLog?: boolean;
    maxConnections?: number;
}

export interface ServerStatus {
    running: boolean;
    port: number;
    clients: number;
    settings?: RawServerSettings;
}

export interface ToolManagerState {
    success: boolean;
    availableTools?: ToolConfig[];
}

export interface ToolStatusUpdate {
    category: string;
    name: string;
    enabled: boolean;
}

export type ServerStatusType = 'checking' | 'running' | 'stopped' | 'unknown';

export type AiClientType = 'cursor' | 'windsurf' | 'trae' | 'codex-cli' | 'claude-cli' | 'gemini-cli';

export interface AiClientStatus {
    clientType: AiClientType;
    clientName: string;
    exists: boolean;
    configPath: string;
    isIDE: boolean;
    isAutoConfig: boolean;
}

export interface MCPServerConfigPayload {
    serverName: string;
    serverUrl: string;
    headers?: Record<string, string>;
    env?: Record<string, string>;
    scope?: 'user' | 'project';
}

export interface ConfigStatusResult {
    success: boolean;
    clients: AiClientStatus[];
    message?: string;
}

export interface CLICommandsResult {
    success: boolean;
    commands: {
        claude: string;
        gemini: string;
    };
    message?: string;
}

export interface ClientConfigResult {
    success: boolean;
    content: string;
    message?: string;
}

export interface ConfigOperationResult {
    success: boolean;
    message: string;
    configPath?: string;
    backupPath?: string;
}

export interface BatchClientOperationResult {
    success: boolean;
    results: Record<string, string>;
    message?: string;
}

export interface OpenConfigFileResult {
    success: boolean;
    message: string;
}

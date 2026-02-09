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

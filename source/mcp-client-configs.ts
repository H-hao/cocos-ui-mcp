/**
 * MCP客户端配置模板
 * 支持主流AI编辑器和CLI工具的一键配置
 */

import * as path from 'path';

export type TransportType = 'streamable-http'; // 当前项目只支持streamable-http
export type ClientType = 'cursor' | 'windsurf' | 'trae' | 'codex-cli' | 'claude-cli' | 'gemini-cli';
export type ConfigScope = 'global' | 'project' | 'user' | 'local';
export type PanelScope = 'user' | 'project';

export interface ConfigFilePathOptions {
    scope?: PanelScope;
    projectRoot?: string;
}

/**
 * MCP客户端配置信息
 */
export interface MCPClientInfo {
    id: ClientType;
    name: string;
    description: string;
    configFileLocation: {
        macOS?: string;
        windows?: string;
        linux?: string;
    };
    supportedTransports: TransportType[];
    isIDE: boolean; // true表示IDE编辑器，false表示CLI工具
    configFormat: 'json' | 'toml';
}

/**
 * MCP服务器配置参数
 */
export interface MCPServerConfig {
    serverName: string;
    serverUrl?: string; // HTTP/SSE/Streamable-HTTP的URL
    command?: string; // STDIO的命令
    args?: string[]; // STDIO的参数
    env?: Record<string, string>; // 环境变量
    headers?: Record<string, string>; // HTTP请求头
    timeout?: number; // 超时时间(毫秒)
}

/**
 * 命令生成配置
 */
export interface CLICommandConfig {
    clientType: 'codex-cli' | 'claude-cli' | 'gemini-cli';
    serverConfig: MCPServerConfig;
    transport: TransportType;
    scope?: ConfigScope;
}

/**
 * 主流AI编辑器和CLI工具配置信息
 */
export const MCP_CLIENTS: Record<ClientType, MCPClientInfo> = {
    // ========== IDE编辑器 ==========
    'cursor': {
        id: 'cursor',
        name: 'Cursor',
        description: 'Cursor IDE - AI代码编辑器',
        configFileLocation: {
            macOS: '~/.cursor/mcp.json',
            windows: '%USERPROFILE%\\.cursor\\mcp.json',
            linux: '~/.cursor/mcp.json'
        },
        supportedTransports: ['streamable-http'],
        isIDE: true,
        configFormat: 'json'
    },
    'windsurf': {
        id: 'windsurf',
        name: 'Windsurf',
        description: 'Windsurf IDE - Codeium的AI编辑器',
        configFileLocation: {
            macOS: '~/.codeium/windsurf/mcp_config.json',
            windows: '%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json',
            linux: '~/.codeium/windsurf/mcp_config.json'
        },
        supportedTransports: ['streamable-http'],
        isIDE: true,
        configFormat: 'json'
    },
    'trae': {
        id: 'trae',
        name: 'Trea CN',
        description: 'Trea CN - AI编辑器中文版',
        configFileLocation: {
            macOS: '~/Library/Application Support/Trea CN/User/mcp.json',
            windows: '%APPDATA%\\Trea CN\\User\\mcp.json',
            linux: '~/.config/Trea CN/User/mcp.json'
        },
        supportedTransports: ['streamable-http'],
        isIDE: true,
        configFormat: 'json'
    },

    // ========== CLI工具 ==========
    'codex-cli': {
        id: 'codex-cli',
        name: 'Codex CLI',
        description: 'OpenAI Codex命令行工具',
        configFileLocation: {
            macOS: '~/.codex/config.toml',
            windows: '%USERPROFILE%\\.codex\\config.toml',
            linux: '~/.codex/config.toml'
        },
        supportedTransports: ['streamable-http'],
        isIDE: false,
        configFormat: 'toml'
    },
    'claude-cli': {
        id: 'claude-cli',
        name: 'Claude CLI',
        description: 'Anthropic Claude命令行工具',
        configFileLocation: {
            macOS: '~/.claude/config.json',
            windows: '%USERPROFILE%\\.claude\\config.json',
            linux: '~/.claude/config.json'
        },
        supportedTransports: ['streamable-http'],
        isIDE: false,
        configFormat: 'json'
    },
    'gemini-cli': {
        id: 'gemini-cli',
        name: 'Gemini CLI',
        description: 'Google Gemini命令行工具',
        configFileLocation: {
            macOS: '~/.gemini/settings.json',
            windows: '%USERPROFILE%\\.gemini\\settings.json',
            linux: '~/.gemini/settings.json'
        },
        supportedTransports: ['streamable-http'],
        isIDE: false,
        configFormat: 'json'
    }
};

/**
 * 生成JSON格式的配置内容
 */
export function generateJSONConfig(
    clientType: ClientType,
    serverConfig: MCPServerConfig,
    transport: TransportType
): string {
    const client = MCP_CLIENTS[clientType];

    if (client.configFormat !== 'json') {
        throw new Error(`Client ${clientType} does not use JSON format`);
    }

    const mcpServers: any = {};
    const serverEntry: any = {};

    // Streamable HTTP配置
    if (!serverConfig.serverUrl) {
        throw new Error('Streamable HTTP transport requires serverUrl');
    }

    // 不同客户端使用不同的字段名
    if (clientType === 'windsurf') {
        // Windsurf使用serverUrl
        serverEntry.serverUrl = serverConfig.serverUrl;
    } else if (clientType === 'gemini-cli') {
        // Gemini CLI使用httpUrl
        serverEntry.httpUrl = serverConfig.serverUrl;
    } else {
        // Cursor, Trae, Claude CLI, Codex CLI都使用url
        serverEntry.url = serverConfig.serverUrl;
    }

    if (serverConfig.headers && Object.keys(serverConfig.headers).length > 0) {
        serverEntry.headers = serverConfig.headers;
    }

    mcpServers[serverConfig.serverName] = serverEntry;

    const config = {
        mcpServers: mcpServers
    };

    return JSON.stringify(config, null, 2);
}

/**
 * 生成TOML格式的配置内容 (用于Codex CLI)
 */
export function generateTOMLConfig(
    serverConfig: MCPServerConfig
): string {
    let toml = `[mcp_servers.${serverConfig.serverName}]\n`;

    // Streamable HTTP配置
    if (!serverConfig.serverUrl) {
        throw new Error('Streamable HTTP transport requires serverUrl');
    }
    toml += `url = "${serverConfig.serverUrl}"\n`;

    if (serverConfig.headers?.['Authorization']) {
        const token = serverConfig.headers['Authorization'].replace('Bearer ', '');
        toml += `bearer_token = "${token}"\n`;
    }

    return toml;
}

/**
 * 生成CLI命令
 */
export function generateCLICommand(config: CLICommandConfig): string {
    const { clientType, serverConfig, transport, scope } = config;

    switch (clientType) {
        case 'codex-cli':
            return generateCodexCLICommand(serverConfig, transport);

        case 'claude-cli':
            return generateClaudeCLICommand(serverConfig, transport, scope);

        case 'gemini-cli':
            return generateGeminiCLICommand(serverConfig, transport, scope);

        default:
            throw new Error(`Unsupported CLI client: ${clientType}`);
    }
}

/**
 * 生成Codex CLI命令 (Streamable HTTP)
 */
function generateCodexCLICommand(serverConfig: MCPServerConfig, transport: TransportType): string {
    // Codex CLI暂不支持通过命令行添加HTTP服务器
    // 需要手动编辑~/.codex/config.toml文件
    return `# Codex CLI需要手动编辑配置文件 ~/.codex/config.toml\n# 请添加以下内容：\n\n${generateTOMLConfig(serverConfig)}`;
}

/**
 * 生成Claude CLI命令 (Streamable HTTP)
 */
function generateClaudeCLICommand(
    serverConfig: MCPServerConfig,
    transport: TransportType,
    scope?: ConfigScope
): string {
    let command = `claude mcp add`;

    // 添加scope
    if (scope) {
        command += ` --scope ${scope}`;
    }

    // 添加transport为http (Streamable HTTP使用http transport)
    command += ` --transport http`;

    // 添加环境变量
    if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
        for (const [key, value] of Object.entries(serverConfig.env)) {
            command += ` --env ${key}="${value}"`;
        }
    }

    // 添加HTTP头
    if (serverConfig.headers && Object.keys(serverConfig.headers).length > 0) {
        for (const [key, value] of Object.entries(serverConfig.headers)) {
            command += ` --header "${key}: ${value}"`;
        }
    }

    command += ` ${serverConfig.serverName}`;
    command += ` ${serverConfig.serverUrl}`;

    return command;
}

/**
 * 生成Gemini CLI命令 (Streamable HTTP)
 */
function generateGeminiCLICommand(
    serverConfig: MCPServerConfig,
    transport: TransportType,
    scope?: ConfigScope
): string {
    let command = `gemini mcp add`;

    // 添加scope
    if (scope) {
        command += ` --scope ${scope}`;
    }

    // 添加transport为http
    command += ` --transport http`;

    // 添加环境变量
    if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
        for (const [key, value] of Object.entries(serverConfig.env)) {
            command += ` --env ${key}="${value}"`;
        }
    }

    // 添加HTTP头
    if (serverConfig.headers && Object.keys(serverConfig.headers).length > 0) {
        for (const [key, value] of Object.entries(serverConfig.headers)) {
            command += ` --header "${key}: ${value}"`;
        }
    }

    command += ` ${serverConfig.serverName}`;
    command += ` ${serverConfig.serverUrl}`;

    return command;
}

/**
 * 获取当前操作系统的配置文件路径
 */
function resolveProjectRoot(projectRoot?: string): string {
    if (projectRoot && projectRoot.trim()) {
        return projectRoot.trim();
    }

    const editorProjectPath = (globalThis as any)?.Editor?.Project?.path;
    if (typeof editorProjectPath === 'string' && editorProjectPath) {
        return editorProjectPath;
    }

    return process.cwd();
}

function getProjectScopedPath(clientType: ClientType, projectRoot: string): string | null {
    switch (clientType) {
        case 'cursor':
            return path.join(projectRoot, '.cursor', 'mcp.json');
        case 'windsurf':
            return path.join(projectRoot, '.windsurf', 'mcp_config.json');
        case 'trae':
            return path.join(projectRoot, '.trae', 'mcp.json');
        case 'codex-cli':
            return path.join(projectRoot, '.codex', 'config.toml');
        case 'claude-cli':
            return path.join(projectRoot, '.mcp.json');
        case 'gemini-cli':
            return path.join(projectRoot, '.gemini', 'settings.json');
        default:
            return null;
    }
}

export function getConfigFilePath(clientType: ClientType, options: ConfigFilePathOptions = {}): string {
    if (options.scope === 'project') {
        const projectRoot = resolveProjectRoot(options.projectRoot);
        const projectPath = getProjectScopedPath(clientType, projectRoot);
        if (projectPath) {
            return projectPath;
        }
    }

    const client = MCP_CLIENTS[clientType];
    const platform = process.platform;

    let configPath: string | undefined;
    if (platform === 'darwin') {
        configPath = client.configFileLocation.macOS;
    } else if (platform === 'win32') {
        configPath = client.configFileLocation.windows;
    } else {
        configPath = client.configFileLocation.linux;
    }

    if (!configPath) {
        throw new Error(`Platform ${platform} is not supported for client ${clientType}`);
    }

    // 展开环境变量
    return expandPath(configPath);
}

/**
 * 展开路径中的环境变量和~
 */
function expandPath(path: string): string {
    // 展开~为home目录
    if (path.startsWith('~')) {
        const home = process.env.HOME || process.env.USERPROFILE;
        if (!home) {
            throw new Error('Cannot determine home directory');
        }
        path = path.replace('~', home);
    }

    // 展开Windows环境变量
    if (process.platform === 'win32') {
        path = path.replace(/%([^%]+)%/g, (_, key) => {
            return process.env[key] || '';
        });
    }

    return path;
}

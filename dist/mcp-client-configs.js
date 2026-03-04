"use strict";
/**
 * MCP客户端配置模板
 * 支持主流AI编辑器和CLI工具的一键配置
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_CLIENTS = void 0;
exports.generateJSONConfig = generateJSONConfig;
exports.generateTOMLConfig = generateTOMLConfig;
exports.generateCLICommand = generateCLICommand;
exports.getConfigFilePath = getConfigFilePath;
const path = __importStar(require("path"));
/**
 * 主流AI编辑器和CLI工具配置信息
 */
exports.MCP_CLIENTS = {
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
function generateJSONConfig(clientType, serverConfig, transport) {
    const client = exports.MCP_CLIENTS[clientType];
    if (client.configFormat !== 'json') {
        throw new Error(`Client ${clientType} does not use JSON format`);
    }
    const mcpServers = {};
    const serverEntry = {};
    // Streamable HTTP配置
    if (!serverConfig.serverUrl) {
        throw new Error('Streamable HTTP transport requires serverUrl');
    }
    // 不同客户端使用不同的字段名
    if (clientType === 'windsurf') {
        // Windsurf使用serverUrl
        serverEntry.serverUrl = serverConfig.serverUrl;
    }
    else if (clientType === 'gemini-cli') {
        // Gemini CLI使用httpUrl
        serverEntry.httpUrl = serverConfig.serverUrl;
    }
    else {
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
function generateTOMLConfig(serverConfig) {
    var _a;
    let toml = `[mcp_servers.${serverConfig.serverName}]\n`;
    // Streamable HTTP配置
    if (!serverConfig.serverUrl) {
        throw new Error('Streamable HTTP transport requires serverUrl');
    }
    toml += `url = "${serverConfig.serverUrl}"\n`;
    if ((_a = serverConfig.headers) === null || _a === void 0 ? void 0 : _a['Authorization']) {
        const token = serverConfig.headers['Authorization'].replace('Bearer ', '');
        toml += `bearer_token = "${token}"\n`;
    }
    return toml;
}
/**
 * 生成CLI命令
 */
function generateCLICommand(config) {
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
function generateCodexCLICommand(serverConfig, transport) {
    // Codex CLI暂不支持通过命令行添加HTTP服务器
    // 需要手动编辑~/.codex/config.toml文件
    return `# Codex CLI需要手动编辑配置文件 ~/.codex/config.toml\n# 请添加以下内容：\n\n${generateTOMLConfig(serverConfig)}`;
}
/**
 * 生成Claude CLI命令 (Streamable HTTP)
 */
function generateClaudeCLICommand(serverConfig, transport, scope) {
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
function generateGeminiCLICommand(serverConfig, transport, scope) {
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
function resolveProjectRoot(projectRoot) {
    var _a, _b;
    if (projectRoot && projectRoot.trim()) {
        return projectRoot.trim();
    }
    const editorProjectPath = (_b = (_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.Editor) === null || _a === void 0 ? void 0 : _a.Project) === null || _b === void 0 ? void 0 : _b.path;
    if (typeof editorProjectPath === 'string' && editorProjectPath) {
        return editorProjectPath;
    }
    return process.cwd();
}
function getProjectScopedPath(clientType, projectRoot) {
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
function getConfigFilePath(clientType, options = {}) {
    if (options.scope === 'project') {
        const projectRoot = resolveProjectRoot(options.projectRoot);
        const projectPath = getProjectScopedPath(clientType, projectRoot);
        if (projectPath) {
            return projectPath;
        }
    }
    const client = exports.MCP_CLIENTS[clientType];
    const platform = process.platform;
    let configPath;
    if (platform === 'darwin') {
        configPath = client.configFileLocation.macOS;
    }
    else if (platform === 'win32') {
        configPath = client.configFileLocation.windows;
    }
    else {
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
function expandPath(path) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLWNsaWVudC1jb25maWdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL21jcC1jbGllbnQtY29uZmlncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnSkgsZ0RBMENDO0FBS0QsZ0RBaUJDO0FBS0QsZ0RBZ0JDO0FBMEhELDhDQTJCQztBQXhYRCwyQ0FBNkI7QUFvRDdCOztHQUVHO0FBQ1UsUUFBQSxXQUFXLEdBQXNDO0lBQzFELCtCQUErQjtJQUMvQixRQUFRLEVBQUU7UUFDTixFQUFFLEVBQUUsUUFBUTtRQUNaLElBQUksRUFBRSxRQUFRO1FBQ2QsV0FBVyxFQUFFLHNCQUFzQjtRQUNuQyxrQkFBa0IsRUFBRTtZQUNoQixLQUFLLEVBQUUsb0JBQW9CO1lBQzNCLE9BQU8sRUFBRSxrQ0FBa0M7WUFDM0MsS0FBSyxFQUFFLG9CQUFvQjtTQUM5QjtRQUNELG1CQUFtQixFQUFFLENBQUMsaUJBQWlCLENBQUM7UUFDeEMsS0FBSyxFQUFFLElBQUk7UUFDWCxZQUFZLEVBQUUsTUFBTTtLQUN2QjtJQUNELFVBQVUsRUFBRTtRQUNSLEVBQUUsRUFBRSxVQUFVO1FBQ2QsSUFBSSxFQUFFLFVBQVU7UUFDaEIsV0FBVyxFQUFFLDhCQUE4QjtRQUMzQyxrQkFBa0IsRUFBRTtZQUNoQixLQUFLLEVBQUUscUNBQXFDO1lBQzVDLE9BQU8sRUFBRSxvREFBb0Q7WUFDN0QsS0FBSyxFQUFFLHFDQUFxQztTQUMvQztRQUNELG1CQUFtQixFQUFFLENBQUMsaUJBQWlCLENBQUM7UUFDeEMsS0FBSyxFQUFFLElBQUk7UUFDWCxZQUFZLEVBQUUsTUFBTTtLQUN2QjtJQUNELE1BQU0sRUFBRTtRQUNKLEVBQUUsRUFBRSxNQUFNO1FBQ1YsSUFBSSxFQUFFLFNBQVM7UUFDZixXQUFXLEVBQUUsb0JBQW9CO1FBQ2pDLGtCQUFrQixFQUFFO1lBQ2hCLEtBQUssRUFB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QUFNLENBQUM7UUFDSixVQUFVLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztJQUNqRCxDQUFDO0lBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLFFBQVEsZ0NBQWdDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUVELFNBQVM7SUFDVCxPQUFPLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxJQUFZO0lBQzVCLGFBQWE7SUFDYixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN2QixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztRQUN6RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDUixNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUNELElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUUsQ0FBQztRQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDekMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNQ1DlrqLmiLfnq6/phY3nva7mqKHmnb9cbiAqIOaUr+aMgeS4u+a1gUFJ57yW6L6R5Zmo5ZKMQ0xJ5bel5YW355qE5LiA6ZSu6YWN572uXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0VHlwZSA9ICdzdHJlYW1hYmxlLWh0dHAnOyAvLyDlvZPliY3pobnnm67lj6rmlK/mjIFzdHJlYW1hYmxlLWh0dHBcbmV4cG9ydCB0eXBlIENsaWVudFR5cGUgPSAnY3Vyc29yJyB8ICd3aW5kc3VyZicgfCAndHJhZScgfCAnY29kZXgtY2xpJyB8ICdjbGF1ZGUtY2xpJyB8ICdnZW1pbmktY2xpJztcbmV4cG9ydCB0eXBlIENvbmZpZ1Njb3BlID0gJ2dsb2JhbCcgfCAncHJvamVjdCcgfCAndXNlcicgfCAnbG9jYWwnO1xuZXhwb3J0IHR5cGUgUGFuZWxTY29wZSA9ICd1c2VyJyB8ICdwcm9qZWN0JztcblxuZXhwb3J0IGludGVyZmFjZSBDb25maWdGaWxlUGF0aE9wdGlvbnMge1xuICAgIHNjb3BlPzogUGFuZWxTY29wZTtcbiAgICBwcm9qZWN0Um9vdD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBNQ1DlrqLmiLfnq6/phY3nva7kv6Hmga9cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNQ1BDbGllbnRJbmZvIHtcbiAgICBpZDogQ2xpZW50VHlwZTtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBjb25maWdGaWxlTG9jYXRpb246IHtcbiAgICAgICAgbWFjT1M/OiBzdHJpbmc7XG4gICAgICAgIHdpbmRvd3M/OiBzdHJpbmc7XG4gICAgICAgIGxpbnV4Pzogc3RyaW5nO1xuICAgIH07XG4gICAgc3VwcG9ydGVkVHJhbnNwb3J0czogVHJhbnNwb3J0VHlwZVtdO1xuICAgIGlzSURFOiBib29sZWFuOyAvLyB0cnVl6KGo56S6SURF57yW6L6R5Zmo77yMZmFsc2XooajnpLpDTEnlt6XlhbdcbiAgICBjb25maWdGb3JtYXQ6ICdqc29uJyB8ICd0b21sJztcbn1cblxuLyoqXG4gKiBNQ1DmnI3liqHlmajphY3nva7lj4LmlbBcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNQ1BTZXJ2ZXJDb25maWcge1xuICAgIHNlcnZlck5hbWU6IHN0cmluZztcbiAgICBzZXJ2ZXJVcmw/OiBzdHJpbmc7IC8vIEhUVFAvU1NFL1N0cmVhbWFibGUtSFRUUOeahFVSTFxuICAgIGNvbW1hbmQ/OiBzdHJpbmc7IC8vIFNURElP55qE5ZG95LukXG4gICAgYXJncz86IHN0cmluZ1tdOyAvLyBTVERJT+eahOWPguaVsFxuICAgIGVudj86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47IC8vIOeOr+Wig+WPmOmHj1xuICAgIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+OyAvLyBIVFRQ6K+35rGC5aS0XG4gICAgdGltZW91dD86IG51bWJlcjsgLy8g6LaF5pe25pe26Ze0KOavq+enkilcbn1cblxuLyoqXG4gKiDlkb3ku6TnlJ/miJDphY3nva5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDTElDb21tYW5kQ29uZmlnIHtcbiAgICBjbGllbnRUeXBlOiAnY29kZXgtY2xpJyB8ICdjbGF1ZGUtY2xpJyB8ICdnZW1pbmktY2xpJztcbiAgICBzZXJ2ZXJDb25maWc6IE1DUFNlcnZlckNvbmZpZztcbiAgICB0cmFuc3BvcnQ6IFRyYW5zcG9ydFR5cGU7XG4gICAgc2NvcGU/OiBDb25maWdTY29wZTtcbn1cblxuLyoqXG4gKiDkuLvmtYFBSee8lui+keWZqOWSjENMSeW3peWFt+mFjee9ruS/oeaBr1xuICovXG5leHBvcnQgY29uc3QgTUNQX0NMSUVOVFM6IFJlY29yZDxDbGllbnRUeXBlLCBNQ1BDbGllbnRJbmZvPiA9IHtcbiAgICAvLyA9PT09PT09PT09IElERee8lui+keWZqCA9PT09PT09PT09XG4gICAgJ2N1cnNvcic6IHtcbiAgICAgICAgaWQ6ICdjdXJzb3InLFxuICAgICAgICBuYW1lOiAnQ3Vyc29yJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDdXJzb3IgSURFIC0gQUnku6PnoIHnvJbovpHlmagnLFxuICAgICAgICBjb25maWdGaWxlTG9jYXRpb246IHtcbiAgICAgICAgICAgIG1hY09TOiAnfi8uY3Vyc29yL21jcC5qc29uJyxcbiAgICAgICAgICAgIHdpbmRvd3M6ICclVVNFUlBST0ZJTEUlXFxcXC5jdXJzb3JcXFxcbWNwLmpzb24nLFxuICAgICAgICAgICAgbGludXg6ICd+Ly5jdXJzb3IvbWNwLmpzb24nXG4gICAgICAgIH0sXG4gICAgICAgIHN1cHBvcnRlZFRyYW5zcG9ydHM6IFsnc3RyZWFtYWJsZS1odHRwJ10sXG4gICAgICAgIGlzSURFOiB0cnVlLFxuICAgICAgICBjb25maWdGb3JtYXQ6ICdqc29uJ1xuICAgIH0sXG4gICAgJ3dpbmRzdXJmJzoge1xuICAgICAgICBpZDogJ3dpbmRzdXJmJyxcbiAgICAgICAgbmFtZTogJ1dpbmRzdXJmJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdXaW5kc3VyZiBJREUgLSBDb2RlaXVt55qEQUnnvJbovpHlmagnLFxuICAgICAgICBjb25maWdGaWxlTG9jYXRpb246IHtcbiAgICAgICAgICAgIG1hY09TOiAnfi8uY29kZWl1bS93aW5kc3VyZi9tY3BfY29uZmlnLmpzb24nLFxuICAgICAgICAgICAgd2luZG93czogJyVVU0VSUFJPRklMRSVcXFxcLmNvZGVpdW1cXFxcd2luZHN1cmZcXFxcbWNwX2NvbmZpZy5qc29uJyxcbiAgICAgICAgICAgIGxpbnV4OiAnfi8uY29kZWl1bS93aW5kc3VyZi9tY3BfY29uZmlnLmpzb24nXG4gICAgICAgIH0sXG4gICAgICAgIHN1cHBvcnRlZFRyYW5zcG9ydHM6IFsnc3RyZWFtYWJsZS1odHRwJ10sXG4gICAgICAgIGlzSURFOiB0cnVlLFxuICAgICAgICBjb25maWdGb3JtYXQ6ICdqc29uJ1xuICAgIH0sXG4gICAgJ3RyYWUnOiB7XG4gICAgICAgIGlkOiAndHJhZScsXG4gICAgICAgIG5hbWU6ICdUcmVhIENOJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUcmVhIENOIC0gQUnnvJbovpHlmajkuK3mlofniYgnLFxuICAgICAgICBjb25maWdGaWxlTG9jYXRpb246IHtcbiAgICAgICAgICAgIG1hY09TOiAnfi9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnQvVHJlYSBDTi9Vc2VyL21jcC5qc29uJyxcbiAgICAgICAgICAgIHdpbmRvd3M6ICclQVBQREFUQSVcXFxcVHJlYSBDTlxcXFxVc2VyXFxcXG1jcC5qc29uJyxcbiAgICAgICAgICAgIGxpbnV4OiAnfi8uY29uZmlnL1RyZWEgQ04vVXNlci9tY3AuanNvbidcbiAgICAgICAgfSxcbiAgICAgICAgc3VwcG9ydGVkVHJhbnNwb3J0czogWydzdHJlYW1hYmxlLWh0dHAnXSxcbiAgICAgICAgaXNJREU6IHRydWUsXG4gICAgICAgIGNvbmZpZ0Zvcm1hdDogJ2pzb24nXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT0gQ0xJ5bel5YW3ID09PT09PT09PT1cbiAgICAnY29kZXgtY2xpJzoge1xuICAgICAgICBpZDogJ2NvZGV4LWNsaScsXG4gICAgICAgIG5hbWU6ICdDb2RleCBDTEknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW5BSSBDb2RleOWRveS7pOihjOW3peWFtycsXG4gICAgICAgIGNvbmZpZ0ZpbGVMb2NhdGlvbjoge1xuICAgICAgICAgICAgbWFjT1M6ICd+Ly5jb2RleC9jb25maWcudG9tbCcsXG4gICAgICAgICAgICB3aW5kb3dzOiAnJVVTRVJQUk9GSUxFJVxcXFwuY29kZXhcXFxcY29uZmlnLnRvbWwnLFxuICAgICAgICAgICAgbGludXg6ICd+Ly5jb2RleC9jb25maWcudG9tbCdcbiAgICAgICAgfSxcbiAgICAgICAgc3VwcG9ydGVkVHJhbnNwb3J0czogWydzdHJlYW1hYmxlLWh0dHAnXSxcbiAgICAgICAgaXNJREU6IGZhbHNlLFxuICAgICAgICBjb25maWdGb3JtYXQ6ICd0b21sJ1xuICAgIH0sXG4gICAgJ2NsYXVkZS1jbGknOiB7XG4gICAgICAgIGlkOiAnY2xhdWRlLWNsaScsXG4gICAgICAgIG5hbWU6ICdDbGF1ZGUgQ0xJJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbnRocm9waWMgQ2xhdWRl5ZG95Luk6KGM5bel5YW3JyxcbiAgICAgICAgY29uZmlnRmlsZUxvY2F0aW9uOiB7XG4gICAgICAgICAgICBtYWNPUzogJ34vLmNsYXVkZS9jb25maWcuanNvbicsXG4gICAgICAgICAgICB3aW5kb3dzOiAnJVVTRVJQUk9GSUxFJVxcXFwuY2xhdWRlXFxcXGNvbmZpZy5qc29uJyxcbiAgICAgICAgICAgIGxpbnV4OiAnfi8uY2xhdWRlL2NvbmZpZy5qc29uJ1xuICAgICAgICB9LFxuICAgICAgICBzdXBwb3J0ZWRUcmFuc3BvcnRzOiBbJ3N0cmVhbWFibGUtaHR0cCddLFxuICAgICAgICBpc0lERTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ0Zvcm1hdDogJ2pzb24nXG4gICAgfSxcbiAgICAnZ2VtaW5pLWNsaSc6IHtcbiAgICAgICAgaWQ6ICdnZW1pbmktY2xpJyxcbiAgICAgICAgbmFtZTogJ0dlbWluaSBDTEknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0dvb2dsZSBHZW1pbmnlkb3ku6TooYzlt6XlhbcnLFxuICAgICAgICBjb25maWdGaWxlTG9jYXRpb246IHtcbiAgICAgICAgICAgIG1hY09TOiAnfi8uZ2VtaW5pL3NldHRpbmdzLmpzb24nLFxuICAgICAgICAgICAgd2luZG93czogJyVVU0VSUFJPRklMRSVcXFxcLmdlbWluaVxcXFxzZXR0aW5ncy5qc29uJyxcbiAgICAgICAgICAgIGxpbnV4OiAnfi8uZ2VtaW5pL3NldHRpbmdzLmpzb24nXG4gICAgICAgIH0sXG4gICAgICAgIHN1cHBvcnRlZFRyYW5zcG9ydHM6IFsnc3RyZWFtYWJsZS1odHRwJ10sXG4gICAgICAgIGlzSURFOiBmYWxzZSxcbiAgICAgICAgY29uZmlnRm9ybWF0OiAnanNvbidcbiAgICB9XG59O1xuXG4vKipcbiAqIOeUn+aIkEpTT07moLzlvI/nmoTphY3nva7lhoXlrrlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlSlNPTkNvbmZpZyhcbiAgICBjbGllbnRUeXBlOiBDbGllbnRUeXBlLFxuICAgIHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnLFxuICAgIHRyYW5zcG9ydDogVHJhbnNwb3J0VHlwZVxuKTogc3RyaW5nIHtcbiAgICBjb25zdCBjbGllbnQgPSBNQ1BfQ0xJRU5UU1tjbGllbnRUeXBlXTtcblxuICAgIGlmIChjbGllbnQuY29uZmlnRm9ybWF0ICE9PSAnanNvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGllbnQgJHtjbGllbnRUeXBlfSBkb2VzIG5vdCB1c2UgSlNPTiBmb3JtYXRgKTtcbiAgICB9XG5cbiAgICBjb25zdCBtY3BTZXJ2ZXJzOiBhbnkgPSB7fTtcbiAgICBjb25zdCBzZXJ2ZXJFbnRyeTogYW55ID0ge307XG5cbiAgICAvLyBTdHJlYW1hYmxlIEhUVFDphY3nva5cbiAgICBpZiAoIXNlcnZlckNvbmZpZy5zZXJ2ZXJVcmwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdHJlYW1hYmxlIEhUVFAgdHJhbnNwb3J0IHJlcXVpcmVzIHNlcnZlclVybCcpO1xuICAgIH1cblxuICAgIC8vIOS4jeWQjOWuouaIt+err+S9v+eUqOS4jeWQjOeahOWtl+auteWQjVxuICAgIGlmIChjbGllbnRUeXBlID09PSAnd2luZHN1cmYnKSB7XG4gICAgICAgIC8vIFdpbmRzdXJm5L2/55Soc2VydmVyVXJsXG4gICAgICAgIHNlcnZlckVudHJ5LnNlcnZlclVybCA9IHNlcnZlckNvbmZpZy5zZXJ2ZXJVcmw7XG4gICAgfSBlbHNlIGlmIChjbGllbnRUeXBlID09PSAnZ2VtaW5pLWNsaScpIHtcbiAgICAgICAgLy8gR2VtaW5pIENMSeS9v+eUqGh0dHBVcmxcbiAgICAgICAgc2VydmVyRW50cnkuaHR0cFVybCA9IHNlcnZlckNvbmZpZy5zZXJ2ZXJVcmw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ3Vyc29yLCBUcmFlLCBDbGF1ZGUgQ0xJLCBDb2RleCBDTEnpg73kvb/nlKh1cmxcbiAgICAgICAgc2VydmVyRW50cnkudXJsID0gc2VydmVyQ29uZmlnLnNlcnZlclVybDtcbiAgICB9XG5cbiAgICBpZiAoc2VydmVyQ29uZmlnLmhlYWRlcnMgJiYgT2JqZWN0LmtleXMoc2VydmVyQ29uZmlnLmhlYWRlcnMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2VydmVyRW50cnkuaGVhZGVycyA9IHNlcnZlckNvbmZpZy5oZWFkZXJzO1xuICAgIH1cblxuICAgIG1jcFNlcnZlcnNbc2VydmVyQ29uZmlnLnNlcnZlck5hbWVdID0gc2VydmVyRW50cnk7XG5cbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICAgIG1jcFNlcnZlcnM6IG1jcFNlcnZlcnNcbiAgICB9O1xuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMik7XG59XG5cbi8qKlxuICog55Sf5oiQVE9NTOagvOW8j+eahOmFjee9ruWGheWuuSAo55So5LqOQ29kZXggQ0xJKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVUT01MQ29uZmlnKFxuICAgIHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnXG4pOiBzdHJpbmcge1xuICAgIGxldCB0b21sID0gYFttY3Bfc2VydmVycy4ke3NlcnZlckNvbmZpZy5zZXJ2ZXJOYW1lfV1cXG5gO1xuXG4gICAgLy8gU3RyZWFtYWJsZSBIVFRQ6YWN572uXG4gICAgaWYgKCFzZXJ2ZXJDb25maWcuc2VydmVyVXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU3RyZWFtYWJsZSBIVFRQIHRyYW5zcG9ydCByZXF1aXJlcyBzZXJ2ZXJVcmwnKTtcbiAgICB9XG4gICAgdG9tbCArPSBgdXJsID0gXCIke3NlcnZlckNvbmZpZy5zZXJ2ZXJVcmx9XCJcXG5gO1xuXG4gICAgaWYgKHNlcnZlckNvbmZpZy5oZWFkZXJzPy5bJ0F1dGhvcml6YXRpb24nXSkge1xuICAgICAgICBjb25zdCB0b2tlbiA9IHNlcnZlckNvbmZpZy5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10ucmVwbGFjZSgnQmVhcmVyICcsICcnKTtcbiAgICAgICAgdG9tbCArPSBgYmVhcmVyX3Rva2VuID0gXCIke3Rva2VufVwiXFxuYDtcbiAgICB9XG5cbiAgICByZXR1cm4gdG9tbDtcbn1cblxuLyoqXG4gKiDnlJ/miJBDTEnlkb3ku6RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ0xJQ29tbWFuZChjb25maWc6IENMSUNvbW1hbmRDb25maWcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHsgY2xpZW50VHlwZSwgc2VydmVyQ29uZmlnLCB0cmFuc3BvcnQsIHNjb3BlIH0gPSBjb25maWc7XG5cbiAgICBzd2l0Y2ggKGNsaWVudFR5cGUpIHtcbiAgICAgICAgY2FzZSAnY29kZXgtY2xpJzpcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvZGV4Q0xJQ29tbWFuZChzZXJ2ZXJDb25maWcsIHRyYW5zcG9ydCk7XG5cbiAgICAgICAgY2FzZSAnY2xhdWRlLWNsaSc6XG4gICAgICAgICAgICByZXR1cm4gZ2VuZXJhdGVDbGF1ZGVDTElDb21tYW5kKHNlcnZlckNvbmZpZywgdHJhbnNwb3J0LCBzY29wZSk7XG5cbiAgICAgICAgY2FzZSAnZ2VtaW5pLWNsaSc6XG4gICAgICAgICAgICByZXR1cm4gZ2VuZXJhdGVHZW1pbmlDTElDb21tYW5kKHNlcnZlckNvbmZpZywgdHJhbnNwb3J0LCBzY29wZSk7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgQ0xJIGNsaWVudDogJHtjbGllbnRUeXBlfWApO1xuICAgIH1cbn1cblxuLyoqXG4gKiDnlJ/miJBDb2RleCBDTEnlkb3ku6QgKFN0cmVhbWFibGUgSFRUUClcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVDb2RleENMSUNvbW1hbmQoc2VydmVyQ29uZmlnOiBNQ1BTZXJ2ZXJDb25maWcsIHRyYW5zcG9ydDogVHJhbnNwb3J0VHlwZSk6IHN0cmluZyB7XG4gICAgLy8gQ29kZXggQ0xJ5pqC5LiN5pSv5oyB6YCa6L+H5ZG95Luk6KGM5re75YqgSFRUUOacjeWKoeWZqFxuICAgIC8vIOmcgOimgeaJi+WKqOe8lui+kX4vLmNvZGV4L2NvbmZpZy50b21s5paH5Lu2XG4gICAgcmV0dXJuIGAjIENvZGV4IENMSemcgOimgeaJi+WKqOe8lui+kemFjee9ruaWh+S7tiB+Ly5jb2RleC9jb25maWcudG9tbFxcbiMg6K+35re75Yqg5Lul5LiL5YaF5a6577yaXFxuXFxuJHtnZW5lcmF0ZVRPTUxDb25maWcoc2VydmVyQ29uZmlnKX1gO1xufVxuXG4vKipcbiAqIOeUn+aIkENsYXVkZSBDTEnlkb3ku6QgKFN0cmVhbWFibGUgSFRUUClcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVDbGF1ZGVDTElDb21tYW5kKFxuICAgIHNlcnZlckNvbmZpZzogTUNQU2VydmVyQ29uZmlnLFxuICAgIHRyYW5zcG9ydDogVHJhbnNwb3J0VHlwZSxcbiAgICBzY29wZT86IENvbmZpZ1Njb3BlXG4pOiBzdHJpbmcge1xuICAgIGxldCBjb21tYW5kID0gYGNsYXVkZSBtY3AgYWRkYDtcblxuICAgIC8vIOa3u+WKoHNjb3BlXG4gICAgaWYgKHNjb3BlKSB7XG4gICAgICAgIGNvbW1hbmQgKz0gYCAtLXNjb3BlICR7c2NvcGV9YDtcbiAgICB9XG5cbiAgICAvLyDmt7vliqB0cmFuc3BvcnTkuLpodHRwIChTdHJlYW1hYmxlIEhUVFDkvb/nlKhodHRwIHRyYW5zcG9ydClcbiAgICBjb21tYW5kICs9IGAgLS10cmFuc3BvcnQgaHR0cGA7XG5cbiAgICAvLyDmt7vliqDnjq/looPlj5jph49cbiAgICBpZiAoc2VydmVyQ29uZmlnLmVudiAmJiBPYmplY3Qua2V5cyhzZXJ2ZXJDb25maWcuZW52KS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNlcnZlckNvbmZpZy5lbnYpKSB7XG4gICAgICAgICAgICBjb21tYW5kICs9IGAgLS1lbnYgJHtrZXl9PVwiJHt2YWx1ZX1cImA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDmt7vliqBIVFRQ5aS0XG4gICAgaWYgKHNlcnZlckNvbmZpZy5oZWFkZXJzICYmIE9iamVjdC5rZXlzKHNlcnZlckNvbmZpZy5oZWFkZXJzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNlcnZlckNvbmZpZy5oZWFkZXJzKSkge1xuICAgICAgICAgICAgY29tbWFuZCArPSBgIC0taGVhZGVyIFwiJHtrZXl9OiAke3ZhbHVlfVwiYDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbW1hbmQgKz0gYCAke3NlcnZlckNvbmZpZy5zZXJ2ZXJOYW1lfWA7XG4gICAgY29tbWFuZCArPSBgICR7c2VydmVyQ29uZmlnLnNlcnZlclVybH1gO1xuXG4gICAgcmV0dXJuIGNvbW1hbmQ7XG59XG5cbi8qKlxuICog55Sf5oiQR2VtaW5pIENMSeWRveS7pCAoU3RyZWFtYWJsZSBIVFRQKVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUdlbWluaUNMSUNvbW1hbmQoXG4gICAgc2VydmVyQ29uZmlnOiBNQ1BTZXJ2ZXJDb25maWcsXG4gICAgdHJhbnNwb3J0OiBUcmFuc3BvcnRUeXBlLFxuICAgIHNjb3BlPzogQ29uZmlnU2NvcGVcbik6IHN0cmluZyB7XG4gICAgbGV0IGNvbW1hbmQgPSBgZ2VtaW5pIG1jcCBhZGRgO1xuXG4gICAgLy8g5re75Yqgc2NvcGVcbiAgICBpZiAoc2NvcGUpIHtcbiAgICAgICAgY29tbWFuZCArPSBgIC0tc2NvcGUgJHtzY29wZX1gO1xuICAgIH1cblxuICAgIC8vIOa3u+WKoHRyYW5zcG9ydOS4umh0dHBcbiAgICBjb21tYW5kICs9IGAgLS10cmFuc3BvcnQgaHR0cGA7XG5cbiAgICAvLyDmt7vliqDnjq/looPlj5jph49cbiAgICBpZiAoc2VydmVyQ29uZmlnLmVudiAmJiBPYmplY3Qua2V5cyhzZXJ2ZXJDb25maWcuZW52KS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNlcnZlckNvbmZpZy5lbnYpKSB7XG4gICAgICAgICAgICBjb21tYW5kICs9IGAgLS1lbnYgJHtrZXl9PVwiJHt2YWx1ZX1cImA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDmt7vliqBIVFRQ5aS0XG4gICAgaWYgKHNlcnZlckNvbmZpZy5oZWFkZXJzICYmIE9iamVjdC5rZXlzKHNlcnZlckNvbmZpZy5oZWFkZXJzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNlcnZlckNvbmZpZy5oZWFkZXJzKSkge1xuICAgICAgICAgICAgY29tbWFuZCArPSBgIC0taGVhZGVyIFwiJHtrZXl9OiAke3ZhbHVlfVwiYDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbW1hbmQgKz0gYCAke3NlcnZlckNvbmZpZy5zZXJ2ZXJOYW1lfWA7XG4gICAgY29tbWFuZCArPSBgICR7c2VydmVyQ29uZmlnLnNlcnZlclVybH1gO1xuXG4gICAgcmV0dXJuIGNvbW1hbmQ7XG59XG5cbi8qKlxuICog6I635Y+W5b2T5YmN5pON5L2c57O757uf55qE6YWN572u5paH5Lu26Lev5b6EXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQcm9qZWN0Um9vdChwcm9qZWN0Um9vdD86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHByb2plY3RSb290ICYmIHByb2plY3RSb290LnRyaW0oKSkge1xuICAgICAgICByZXR1cm4gcHJvamVjdFJvb3QudHJpbSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGVkaXRvclByb2plY3RQYXRoID0gKGdsb2JhbFRoaXMgYXMgYW55KT8uRWRpdG9yPy5Qcm9qZWN0Py5wYXRoO1xuICAgIGlmICh0eXBlb2YgZWRpdG9yUHJvamVjdFBhdGggPT09ICdzdHJpbmcnICYmIGVkaXRvclByb2plY3RQYXRoKSB7XG4gICAgICAgIHJldHVybiBlZGl0b3JQcm9qZWN0UGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzcy5jd2QoKTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvamVjdFNjb3BlZFBhdGgoY2xpZW50VHlwZTogQ2xpZW50VHlwZSwgcHJvamVjdFJvb3Q6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIHN3aXRjaCAoY2xpZW50VHlwZSkge1xuICAgICAgICBjYXNlICdjdXJzb3InOlxuICAgICAgICAgICAgcmV0dXJuIHBhdGguam9pbihwcm9qZWN0Um9vdCwgJy5jdXJzb3InLCAnbWNwLmpzb24nKTtcbiAgICAgICAgY2FzZSAnd2luZHN1cmYnOlxuICAgICAgICAgICAgcmV0dXJuIHBhdGguam9pbihwcm9qZWN0Um9vdCwgJy53aW5kc3VyZicsICdtY3BfY29uZmlnLmpzb24nKTtcbiAgICAgICAgY2FzZSAndHJhZSc6XG4gICAgICAgICAgICByZXR1cm4gcGF0aC5qb2luKHByb2plY3RSb290LCAnLnRyYWUnLCAnbWNwLmpzb24nKTtcbiAgICAgICAgY2FzZSAnY29kZXgtY2xpJzpcbiAgICAgICAgICAgIHJldHVybiBwYXRoLmpvaW4ocHJvamVjdFJvb3QsICcuY29kZXgnLCAnY29uZmlnLnRvbWwnKTtcbiAgICAgICAgY2FzZSAnY2xhdWRlLWNsaSc6XG4gICAgICAgICAgICByZXR1cm4gcGF0aC5qb2luKHByb2plY3RSb290LCAnLm1jcC5qc29uJyk7XG4gICAgICAgIGNhc2UgJ2dlbWluaS1jbGknOlxuICAgICAgICAgICAgcmV0dXJuIHBhdGguam9pbihwcm9qZWN0Um9vdCwgJy5nZW1pbmknLCAnc2V0dGluZ3MuanNvbicpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnRmlsZVBhdGgoY2xpZW50VHlwZTogQ2xpZW50VHlwZSwgb3B0aW9uczogQ29uZmlnRmlsZVBhdGhPcHRpb25zID0ge30pOiBzdHJpbmcge1xuICAgIGlmIChvcHRpb25zLnNjb3BlID09PSAncHJvamVjdCcpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdFJvb3QgPSByZXNvbHZlUHJvamVjdFJvb3Qob3B0aW9ucy5wcm9qZWN0Um9vdCk7XG4gICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gZ2V0UHJvamVjdFNjb3BlZFBhdGgoY2xpZW50VHlwZSwgcHJvamVjdFJvb3QpO1xuICAgICAgICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9qZWN0UGF0aDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNsaWVudCA9IE1DUF9DTElFTlRTW2NsaWVudFR5cGVdO1xuICAgIGNvbnN0IHBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybTtcblxuICAgIGxldCBjb25maWdQYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICBjb25maWdQYXRoID0gY2xpZW50LmNvbmZpZ0ZpbGVMb2NhdGlvbi5tYWNPUztcbiAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIGNvbmZpZ1BhdGggPSBjbGllbnQuY29uZmlnRmlsZUxvY2F0aW9uLndpbmRvd3M7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnUGF0aCA9IGNsaWVudC5jb25maWdGaWxlTG9jYXRpb24ubGludXg7XG4gICAgfVxuXG4gICAgaWYgKCFjb25maWdQYXRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGxhdGZvcm0gJHtwbGF0Zm9ybX0gaXMgbm90IHN1cHBvcnRlZCBmb3IgY2xpZW50ICR7Y2xpZW50VHlwZX1gKTtcbiAgICB9XG5cbiAgICAvLyDlsZXlvIDnjq/looPlj5jph49cbiAgICByZXR1cm4gZXhwYW5kUGF0aChjb25maWdQYXRoKTtcbn1cblxuLyoqXG4gKiDlsZXlvIDot6/lvoTkuK3nmoTnjq/looPlj5jph4/lkox+XG4gKi9cbmZ1bmN0aW9uIGV4cGFuZFBhdGgocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyDlsZXlvIB+5Li6aG9tZeebruW9lVxuICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgoJ34nKSkge1xuICAgICAgICBjb25zdCBob21lID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcbiAgICAgICAgaWYgKCFob21lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBkZXRlcm1pbmUgaG9tZSBkaXJlY3RvcnknKTtcbiAgICAgICAgfVxuICAgICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKCd+JywgaG9tZSk7XG4gICAgfVxuXG4gICAgLy8g5bGV5byAV2luZG93c+eOr+Wig+WPmOmHj1xuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoLyUoW14lXSspJS9nLCAoXywga2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5lbnZba2V5XSB8fCAnJztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGg7XG59XG4iXX0=
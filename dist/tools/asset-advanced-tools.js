"use strict";
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
exports.AssetAdvancedTools = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AssetAdvancedTools {
    getTools() {
        return [
            {
                name: 'asset_manage',
                description: 'ASSET MANAGEMENT: Import, delete, save metadata, or generate URLs for assets. Use this for all asset creation/deletion/modification operations. WORKFLOW: First use asset_query to find assets, then perform operations. Import requires sourcePath+targetUrl, delete needs urls array, save_meta needs urlOrUUID+content, generate_url needs url parameter.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['import', 'delete', 'save_meta', 'generate_url'],
                            description: 'Choose operation: "import" = batch import external files into project (requires assets array) | "delete" = batch remove assets from project (requires urls array) | "save_meta" = update asset metadata (requires urlOrUUID+content) | "generate_url" = create unique URL for asset (requires url)'
                        },
                        // For import action
                        assets: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    sourcePath: { type: 'string', description: 'Source file path' },
                                    targetUrl: { type: 'string', description: 'Target asset URL' }
                                },
                                required: ['sourcePath', 'targetUrl']
                            },
                            description: 'Array of import operations (REQUIRED for import action). Each item must have sourcePath (external file) and targetUrl (destination in project). Example: [{"sourcePath":"/path/to/image.png", "targetUrl":"db://assets/images/hero.png"}]'
                        },
                        overwrite: {
                            type: 'boolean',
                            description: 'Whether to overwrite existing assets (import action only)',
                            default: false
                        },
                        // For delete action
                        urls: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of asset URLs to remove (REQUIRED for delete action). Use Cocos asset URLs like "db://assets/images/hero.png". Get URLs from asset_query tool first. Example: ["db://assets/images/old1.png", "db://assets/scenes/test.scene"]'
                        },
                        // For save_meta action
                        urlOrUUID: {
                            type: 'string',
                            description: 'Asset identifier (REQUIRED for save_meta action). Can be asset URL like "db://assets/image.png" or UUID like "12345678-abcd-1234-5678-123456789abc". Get from asset_query tool.'
                        },
                        content: {
                            type: 'string',
                            description: 'Serialized metadata content (REQUIRED for save_meta action). Must be valid JSON string containing asset metadata. Format depends on asset type. Example: "{\"importer\":\"image\",\"settings\":{\"format\":\"png\"}}"'
                        },
                        // For generate_url action
                        url: {
                            type: 'string',
                            description: 'Asset URL to generate available URL for (generate_url action only)'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'asset_analyze',
                description: 'ASSET ANALYSIS: Analyze asset relationships (dependencies/users) or export manifests. WORKFLOW: Use "dependencies" to find what an asset depends on, "users" to find what references an asset (reverse lookup), "manifest" to export inventory. RETURNS: dependencies/users actions return { urlOrUUID, type, dependencies/users: Array<{ uuid, path, name, type }>, count }. Each item contains resolved asset info (path like "db://assets/...", name like "MyPrefab.prefab", type like "cc.Prefab"/"cc.TypeScript"). LIMITATIONS: Reference validation and unused asset detection are disabled due to API constraints.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['dependencies', 'users', 'manifest'],
                            description: 'Analysis type: "dependencies" = find all assets/scripts this asset depends on (forward lookup, requires urlOrUUID). Returns Array<{ uuid, path, name, type }>. | "users" = find all assets/scripts that directly reference this asset (reverse lookup, requires urlOrUUID). Returns Array<{ uuid, path, name, type }>. | "manifest" = generate complete asset inventory report for a folder (optional folder parameter, outputs JSON/CSV/XML format).'
                        },
                        // Common parameters
                        folder: {
                            type: 'string',
                            description: 'Target folder path to analyze (both actions). Default: "db://assets" analyzes entire project. Examples: "db://assets/scenes" for scenes only, "db://assets/textures" for textures only.',
                            default: 'db://assets'
                        },
                        // For dependencies / users action
                        urlOrUUID: {
                            type: 'string',
                            description: 'Asset URL or UUID (REQUIRED for dependencies/users action). Can be a Cocos asset URL like "db://assets/textures/player.png" or a UUID like "1e6bb546-ec05-4cc4-bb24-68c6cd3ad5a6".'
                        },
                        assetType: {
                            type: 'string',
                            enum: ['asset', 'script', 'all'],
                            description: 'Query asset type filter (dependencies/users action): "asset" = only non-script asset references (default), "script" = only script (.ts) references, "all" = both assets and scripts. Affects which types appear in the returned array.',
                            default: 'asset'
                        },
                        // For unused action
                        includeSubfolders: {
                            type: 'boolean',
                            description: 'Whether to include subfolders (unused action only)',
                            default: true
                        },
                        // For manifest action
                        format: {
                            type: 'string',
                            description: 'Output format for manifest (manifest action only). "json" = structured data for APIs, "csv" = spreadsheet compatible, "xml" = legacy system integration.',
                            enum: ['json', 'csv', 'xml'],
                            default: 'json'
                        },
                        includeMetadata: {
                            type: 'boolean',
                            description: 'Include detailed metadata in manifest (manifest action only). true = full asset information including import settings, false = basic info only (name, path, type, UUID). Note: Currently limited by API availability.',
                            default: false
                        }
                    },
                    required: ['action']
                }
            },
            // COMMENTED OUT: asset_optimize - Texture compression requires image processing APIs not available in Cocos Creator MCP
            /*
            {
                name: 'asset_optimize',
                description: 'ASSET OPTIMIZATION: Compress textures and optimize assets for better performance. DISABLED - No image processing APIs available.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['compress_textures'],
                            description: 'Action: "compress_textures" = batch compress texture assets'
                        }
                    },
                    required: ['action']
                }
            },
            */
            {
                name: 'asset_system',
                description: 'ASSET SYSTEM: Check asset database status, refresh assets, or open assets with external programs. Use this for system-level asset operations.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['check_ready', 'open_external', 'refresh'],
                            description: 'Action: "check_ready" = check if asset database is ready | "open_external" = open asset with external program | "refresh" = refresh asset database'
                        },
                        url: {
                            type: 'string',
                            description: 'Asset URL to open (open_external action only)'
                        },
                        folder: {
                            type: 'string',
                            description: 'Specific folder to refresh (refresh action only)'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'asset_query',
                description: 'ASSET QUERY: Search, get information, and find assets by various criteria. Use this for asset discovery and detailed information retrieval.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_info', 'get_assets', 'find_by_name', 'get_details', 'query_path', 'query_uuid', 'query_url'],
                            description: 'Query action to perform'
                        },
                        // For get_info action
                        assetPath: {
                            type: 'string',
                            description: 'Asset path (get_info/get_details actions only)'
                        },
                        // For get_assets action
                        type: {
                            type: 'string',
                            enum: ['all', 'scene', 'prefab', 'script', 'texture', 'material', 'mesh', 'audio', 'animation', 'effect', 'chunk'],
                            description: 'Asset type filter (get_assets action only). Supports Cocos built-in types like effect and chunk.',
                            default: 'all'
                        },
                        folder: {
                            type: 'string',
                            description: 'Search scope (get_assets/find_by_name actions). Options: "db://assets" = user assets only, "db://internal" = built-in assets only, "all" = both user and built-in assets. Default searches both user and built-in.',
                            default: 'db://assets'
                        },
                        // For find_by_name action
                        name: {
                            type: 'string',
                            description: 'Asset name to search for (find_by_name action only)'
                        },
                        exactMatch: {
                            type: 'boolean',
                            description: 'Whether to use exact name matching (find_by_name action only)',
                            default: false
                        },
                        assetType: {
                            type: 'string',
                            enum: ['all', 'scene', 'prefab', 'script', 'texture', 'material', 'mesh', 'audio', 'animation', 'spriteFrame'],
                            description: 'Filter by asset type (find_by_name action only)',
                            default: 'all'
                        },
                        maxResults: {
                            type: 'number',
                            description: 'Maximum number of results (find_by_name action only)',
                            default: 20
                        },
                        // For get_details action
                        includeSubAssets: {
                            type: 'boolean',
                            description: 'Include sub-assets like spriteFrame (get_details action only)',
                            default: true
                        },
                        // For query actions
                        url: {
                            type: 'string',
                            description: 'Asset URL (query_path/query_uuid actions only)'
                        },
                        uuid: {
                            type: 'string',
                            description: 'Asset UUID (query_url action only)'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'asset_operations',
                description: 'ASSET OPERATIONS: Create, copy, move, delete, save, and import assets. Use this for all asset file operations and modifications.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['create', 'copy', 'move', 'delete', 'save', 'reimport', 'import'],
                            description: 'Asset operation to perform'
                        },
                        // For create action
                        url: {
                            type: 'string',
                            description: 'Asset URL (create/delete/save/reimport actions)'
                        },
                        content: {
                            type: 'string',
                            description: 'File content - null for folder (create/save actions)'
                        },
                        overwrite: {
                            type: 'boolean',
                            description: 'Overwrite existing file (create/copy/move actions)',
                            default: false
                        },
                        // For copy/move actions
                        source: {
                            type: 'string',
                            description: 'Source asset URL (copy/move actions)'
                        },
                        target: {
                            type: 'string',
                            description: 'Target location URL (copy/move actions)'
                        },
                        // For import action
                        sourcePath: {
                            type: 'string',
                            description: 'Source file path (import action only)'
                        },
                        targetFolder: {
                            type: 'string',
                            description: 'Target folder in assets (import action only)'
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'asset_manage':
                return await this.handleAssetManage(args);
            case 'asset_analyze':
                return await this.handleAssetAnalyze(args);
            case 'asset_system':
                return await this.handleAssetSystem(args);
            case 'asset_query':
                return await this.handleAssetQuery(args);
            case 'asset_operations':
                return await this.handleAssetOperations(args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    // 新的整合处理函数
    async handleAssetManage(args) {
        const { action } = args;
        switch (action) {
            case 'import':
                return await this.batchImportAssets(args.assets, args.overwrite);
            case 'delete':
                return await this.batchDeleteAssets(args.urls);
            case 'save_meta':
                return await this.saveAssetMeta(args.urlOrUUID, args.content);
            case 'generate_url':
                return await this.generateAvailableUrl(args.url);
            default:
                return { success: false, error: `Unknown asset manage action: ${action}` };
        }
    }
    async handleAssetAnalyze(args) {
        const { action } = args;
        switch (action) {
            // case 'validate_refs': // COMMENTED OUT - Requires complex project analysis
            //     return await this.validateAssetReferences(args.folder);
            case 'dependencies':
                return await this.getAssetDependencies(args.urlOrUUID || args.url, args.assetType);
            case 'users':
                return await this.getAssetUsers(args.urlOrUUID, args.assetType);
            // case 'unused': // COMMENTED OUT - Requires complex project analysis
            //     return await this.getUnusedAssets(args.folder, args.includeSubfolders);
            case 'manifest':
                return await this.exportAssetManifest(args.folder, args.format, args.includeMetadata);
            default:
                return { success: false, error: `Unknown asset analyze action: ${action}` };
        }
    }
    // COMMENTED OUT - No image processing APIs available in Cocos Creator MCP
    /*
    private async handleAssetOptimize(args: any): Promise<ToolResponse> {
        const { action } = args;
        
        switch (action) {
            case 'compress_textures':
                return await this.compressTextures(args.folder, args.quality, args.format, args.recursive);
            default:
                return { success: false, error: `Unknown asset optimize action: ${action}` };
        }
    }
    */
    async handleAssetSystem(args) {
        const { action } = args;
        switch (action) {
            case 'check_ready':
                return await this.queryAssetDbReady();
            case 'open_external':
                return await this.openAssetExternal(args.url);
            case 'refresh':
                return await this.refreshAssets(args.folder);
            default:
                return { success: false, error: `Unknown asset system action: ${action}` };
        }
    }
    async handleAssetQuery(args) {
        const { action } = args;
        switch (action) {
            case 'get_info':
                return await this.getAssetInfo(args.assetPath);
            case 'get_assets':
                return await this.getAssets(args.type, args.folder);
            case 'find_by_name':
                return await this.findAssetByName(args);
            case 'get_details':
                return await this.getAssetDetails(args.assetPath, args.includeSubAssets);
            case 'query_path':
                return await this.queryAssetPath(args.url);
            case 'query_uuid':
                return await this.queryAssetUuid(args.url);
            case 'query_url':
                return await this.queryAssetUrl(args.uuid);
            default:
                return { success: false, error: `Unknown asset query action: ${action}` };
        }
    }
    async handleAssetOperations(args) {
        const { action } = args;
        switch (action) {
            case 'create':
                return await this.createAsset(args.url, args.content, args.overwrite);
            case 'copy':
                return await this.copyAsset(args.source, args.target, args.overwrite);
            case 'move':
                return await this.moveAsset(args.source, args.target, args.overwrite);
            case 'delete':
                return await this.deleteAsset(args.url);
            case 'save':
                return await this.saveAsset(args.url, args.content);
            case 'reimport':
                return await this.reimportAsset(args.url);
            case 'import':
                return await this.importAsset(args.sourcePath, args.targetFolder);
            default:
                return { success: false, error: `Unknown asset operation action: ${action}` };
        }
    }
    // 原有的实现方法保持不变（从原文件复制）
    async saveAssetMeta(urlOrUUID, content) {
        try {
            const result = await Editor.Message.request('asset-db', 'save-asset-meta', urlOrUUID, content);
            return {
                success: true,
                message: `✅ Asset meta saved successfully`,
                data: { urlOrUUID, result }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to save asset meta: ${error.message}`
            };
        }
    }
    async generateAvailableUrl(url) {
        try {
            const availableUrl = await Editor.Message.request('asset-db', 'generate-available-url', url);
            return {
                success: true,
                message: `✅ Available URL generated`,
                data: { originalUrl: url, availableUrl }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to generate available URL: ${error.message}`
            };
        }
    }
    async queryAssetDbReady() {
        try {
            const isReady = await Editor.Message.request('asset-db', 'query-ready');
            return {
                success: true,
                message: `✅ Asset database status: ${isReady ? 'Ready' : 'Not Ready'}`,
                data: { ready: isReady }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to check asset database status: ${error.message}`
            };
        }
    }
    async openAssetExternal(url) {
        try {
            const result = await Editor.Message.request('asset-db', 'open-asset-external', url);
            return {
                success: true,
                message: `✅ Asset opened externally`,
                data: { url, result }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to open asset externally: ${error.message}`
            };
        }
    }
    async batchImportAssets(assets, overwrite = false) {
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const asset of assets) {
            try {
                const result = await Editor.Message.request('asset-db', 'create-asset', asset.targetUrl, {
                    source: asset.sourcePath,
                    rename: !(overwrite || false)
                });
                results.push({
                    sourcePath: asset.sourcePath,
                    targetUrl: asset.targetUrl,
                    success: true,
                    result
                });
                successCount++;
            }
            catch (error) {
                results.push({
                    sourcePath: asset.sourcePath,
                    targetUrl: asset.targetUrl,
                    success: false,
                    error: error.message
                });
                errorCount++;
            }
        }
        return {
            success: errorCount === 0,
            message: `✅ Imported ${successCount}/${assets.length} assets`,
            data: {
                totalRequested: assets.length,
                successCount,
                errorCount,
                results
            }
        };
    }
    async batchDeleteAssets(urls) {
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const url of urls) {
            try {
                const result = await Editor.Message.request('asset-db', 'delete-asset', url);
                results.push({
                    url,
                    success: true,
                    result
                });
                successCount++;
            }
            catch (error) {
                results.push({
                    url,
                    success: false,
                    error: error.message
                });
                errorCount++;
            }
        }
        return {
            success: errorCount === 0,
            message: `✅ Deleted ${successCount}/${urls.length} assets`,
            data: {
                totalRequested: urls.length,
                successCount,
                errorCount,
                results
            }
        };
    }
    // COMMENTED OUT - Requires complex project analysis not available in current Cocos Creator MCP APIs
    /*
    private async validateAssetReferences(folder: string = 'db://assets'): Promise<ToolResponse> {
        return {
            success: false,
            error: 'Asset reference validation requires complex project analysis not available in current Cocos Creator MCP implementation.'
        };
    }
    */
    /**
     * 批量将 uuid 数组解析为包含 path/name/type 的详细信息
     * 解析失败的 uuid 仍保留原始值，不会丢失
     */
    async resolveUUIDs(uuids) {
        if (!Array.isArray(uuids) || uuids.length === 0)
            return [];
        const results = await Promise.all(uuids.map(async (uuid) => {
            try {
                const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
                if (info) {
                    return { uuid, path: info.url || info.path, name: info.name, type: info.type };
                }
                return { uuid };
            }
            catch (_a) {
                return { uuid };
            }
        }));
        return results;
    }
    /**
     * 查询一个资源依赖的资源或脚本（正向依赖查询）
     * @param urlOrUUID 资源的 url 地址或者 uuid
     * @param type 查询的资源类型，默认 asset，可选值：asset, script, all
     */
    async getAssetDependencies(urlOrUUID, type = 'asset') {
        try {
            if (!urlOrUUID) {
                return { success: false, error: 'url or urlOrUUID parameter is required for dependencies action' };
            }
            const rawUUIDs = await Editor.Message.request('asset-db', 'query-asset-dependencies', urlOrUUID, type);
            const dependencies = await this.resolveUUIDs(rawUUIDs);
            return {
                success: true,
                message: `✅ Asset dependencies retrieved`,
                data: {
                    urlOrUUID,
                    type,
                    dependencies,
                    count: dependencies.length
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get asset dependencies: ${error.message}`
            };
        }
    }
    /**
     * 查询一个资源被哪些资源或脚本直接使用到（反向依赖查询）
     * @param urlOrUUID 资源的 url 地址或者 uuid
     * @param type 查询的资源类型，默认 asset，可选值：asset, script, all
     */
    async getAssetUsers(urlOrUUID, type = 'asset') {
        try {
            if (!urlOrUUID) {
                return { success: false, error: 'urlOrUUID parameter is required for users action' };
            }
            const rawUUIDs = await Editor.Message.request('asset-db', 'query-asset-users', urlOrUUID, type);
            const users = await this.resolveUUIDs(rawUUIDs);
            return {
                success: true,
                message: `✅ Asset users retrieved`,
                data: {
                    urlOrUUID,
                    type,
                    users,
                    count: users.length
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get asset users: ${error.message}`
            };
        }
    }
    // COMMENTED OUT - Requires comprehensive project analysis not available in current Cocos Creator MCP APIs
    /*
    private async getUnusedAssets(folder: string = 'db://assets', includeSubfolders: boolean = true): Promise<ToolResponse> {
        return {
            success: false,
            error: 'Unused asset detection requires comprehensive project analysis not available in current Cocos Creator MCP implementation.'
        };
    }
    */
    // COMMENTED OUT - Texture compression requires image processing APIs not available in Cocos Creator MCP
    /*
    private async compressTextures(folder: string = 'db://assets', quality: number = 80, format: string = 'jpg', recursive: boolean = true): Promise<ToolResponse> {
        return {
            success: false,
            error: 'Texture compression requires image processing capabilities not available in current Cocos Creator MCP implementation.'
        };
    }
    */
    async exportAssetManifest(folder = 'db://assets', format = 'json', _includeMetadata = false) {
        try {
            // 获取实际的资源数据
            const allAssetsResponse = await Editor.Message.request('asset-db', 'query-assets');
            const allAssets = Array.isArray(allAssetsResponse) ? allAssetsResponse : [];
            // 过滤指定文件夹的资源
            const filteredAssets = allAssets.filter(asset => asset.path && asset.path.includes(folder));
            // 构建资源清单 - 只包含基础信息，不包含模拟的元数据
            const assets = filteredAssets.map(asset => {
                return {
                    name: asset.name,
                    path: asset.path,
                    type: asset.type,
                    uuid: asset.uuid
                    // NOTE: includeMetadata parameter ignored - detailed metadata requires APIs not available in current MCP
                };
            });
            const manifest = {
                folder,
                format,
                includeMetadata: false, // Always false - metadata APIs not available
                assets,
                exportDate: new Date().toISOString(),
                totalAssets: assets.length,
                summary: {
                    byType: this.groupAssetsByType(assets)
                    // NOTE: totalSize calculation removed - requires file system APIs not available in MCP
                }
            };
            return {
                success: true,
                message: `✅ Asset manifest exported with ${assets.length} assets`,
                data: manifest
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to export asset manifest: ${error.message}`
            };
        }
    }
    groupAssetsByType(assets) {
        const grouped = {};
        assets.forEach(asset => {
            const type = asset.type || 'Unknown';
            grouped[type] = (grouped[type] || 0) + 1;
        });
        return grouped;
    }
    // New asset operation methods moved from project-tools.ts
    async refreshAssets(folder) {
        return new Promise((resolve) => {
            const targetPath = folder || 'db://assets';
            Editor.Message.request('asset-db', 'refresh-asset', targetPath).then(() => {
                resolve({
                    success: true,
                    message: `✅ Assets refreshed in: ${targetPath}`,
                    data: { folder: targetPath }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async importAsset(sourcePath, targetFolder) {
        return new Promise((resolve) => {
            if (!fs.existsSync(sourcePath)) {
                resolve({ success: false, error: 'Source file not found' });
                return;
            }
            const fileName = path.basename(sourcePath);
            const targetPath = targetFolder.startsWith('db://') ?
                targetFolder : `db://assets/${targetFolder}`;
            Editor.Message.request('asset-db', 'import-asset', sourcePath, `${targetPath}/${fileName}`).then((result) => {
                resolve({
                    success: true,
                    message: `✅ Asset imported: ${fileName}`,
                    data: {
                        uuid: result.uuid,
                        path: result.url,
                        fileName
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getAssetInfo(assetPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', assetPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Asset not found');
                }
                const info = {
                    name: assetInfo.name,
                    uuid: assetInfo.uuid,
                    path: assetInfo.url,
                    type: assetInfo.type,
                    size: assetInfo.size,
                    isDirectory: assetInfo.isDirectory
                };
                if (assetInfo.meta) {
                    info.meta = {
                        ver: assetInfo.meta.ver,
                        importer: assetInfo.meta.importer
                    };
                }
                resolve({
                    success: true,
                    message: `✅ Asset info retrieved: ${info.name}`,
                    data: info
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getAssets(type = 'all', folder = 'db://assets') {
        return new Promise(async (resolve) => {
            try {
                let patterns = [];
                // 决定搜索范围
                if (folder === 'all') {
                    // 搜索用户资源和内置资源
                    patterns = ['db://assets/**/*', 'db://internal/**/*'];
                }
                else if (folder === 'db://internal') {
                    // 只搜索内置资源
                    patterns = ['db://internal/**/*'];
                }
                else if (folder === 'db://assets') {
                    // 只搜索用户资源
                    patterns = ['db://assets/**/*'];
                }
                else {
                    // 指定文件夹
                    patterns = [`${folder}/**/*`];
                }
                // 如果指定了类型，添加扩展名过滤
                if (type !== 'all') {
                    const typeExtensions = {
                        'scene': '.scene',
                        'prefab': '.prefab',
                        'script': '.{ts,js}',
                        'texture': '.{png,jpg,jpeg,gif,tga,bmp,psd}',
                        'material': '.mtl',
                        'mesh': '.{fbx,obj,dae}',
                        'audio': '.{mp3,ogg,wav,m4a}',
                        'animation': '.{anim,clip}',
                        'effect': '.effect',
                        'chunk': '.chunk'
                    };
                    const extension = typeExtensions[type];
                    if (extension) {
                        patterns = patterns.map(pattern => pattern.replace('/**/*', `/**/*${extension}`));
                    }
                }
                console.log(`[DEBUG] Searching assets with patterns:`, patterns);
                // 并行查询所有模式
                const allResults = await Promise.all(patterns.map(pattern => Editor.Message.request('asset-db', 'query-assets', { pattern: pattern })
                    .catch((err) => {
                    console.log(`[DEBUG] Pattern ${pattern} failed:`, err);
                    return [];
                })));
                // 合并结果并去重
                const combinedResults = allResults.flat();
                const uniqueAssets = new Map();
                combinedResults.forEach(asset => {
                    if (asset && asset.uuid && !uniqueAssets.has(asset.uuid)) {
                        uniqueAssets.set(asset.uuid, {
                            name: asset.name,
                            uuid: asset.uuid,
                            path: asset.url,
                            type: asset.type,
                            size: asset.size || 0,
                            isDirectory: asset.isDirectory || false,
                            isBuiltIn: asset.url.startsWith('db://internal')
                        });
                    }
                });
                const assets = Array.from(uniqueAssets.values());
                // 按类型分组统计
                const userAssets = assets.filter(a => !a.isBuiltIn);
                const builtInAssets = assets.filter(a => a.isBuiltIn);
                resolve({
                    success: true,
                    message: `✅ Found ${assets.length} assets (${userAssets.length} user + ${builtInAssets.length} built-in) of type '${type}'`,
                    data: {
                        type: type,
                        folder: folder,
                        count: assets.length,
                        userCount: userAssets.length,
                        builtInCount: builtInAssets.length,
                        assets: assets
                    }
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async createAsset(url, content = null, overwrite = false) {
        return new Promise((resolve) => {
            const options = {
                overwrite: overwrite,
                rename: !overwrite
            };
            Editor.Message.request('asset-db', 'create-asset', url, content, options).then((result) => {
                const assetType = content === null ? 'Folder' : 'File';
                resolve({
                    success: true,
                    message: `✅ ${assetType} created successfully`,
                    data: {
                        uuid: result === null || result === void 0 ? void 0 : result.uuid,
                        url: (result === null || result === void 0 ? void 0 : result.url) || url,
                        type: assetType.toLowerCase()
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async copyAsset(source, target, overwrite = false) {
        return new Promise((resolve) => {
            const options = {
                overwrite: overwrite,
                rename: !overwrite
            };
            Editor.Message.request('asset-db', 'copy-asset', source, target, options).then((result) => {
                resolve({
                    success: true,
                    message: `✅ Asset copied successfully`,
                    data: {
                        uuid: result === null || result === void 0 ? void 0 : result.uuid,
                        source: source,
                        target: (result === null || result === void 0 ? void 0 : result.url) || target
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async moveAsset(source, target, overwrite = false) {
        return new Promise((resolve) => {
            const options = {
                overwrite: overwrite,
                rename: !overwrite
            };
            Editor.Message.request('asset-db', 'move-asset', source, target, options).then((result) => {
                resolve({
                    success: true,
                    message: `✅ Asset moved successfully`,
                    data: {
                        uuid: result === null || result === void 0 ? void 0 : result.uuid,
                        source: source,
                        target: (result === null || result === void 0 ? void 0 : result.url) || target
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async deleteAsset(url) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'delete-asset', url).then(() => {
                resolve({
                    success: true,
                    message: `✅ Asset deleted successfully`,
                    data: { url }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async saveAsset(url, content) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', url, content).then((result) => {
                resolve({
                    success: true,
                    message: `✅ Asset saved successfully`,
                    data: {
                        uuid: result === null || result === void 0 ? void 0 : result.uuid,
                        url: (result === null || result === void 0 ? void 0 : result.url) || url
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async reimportAsset(url) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'reimport-asset', url).then(() => {
                resolve({
                    success: true,
                    message: `✅ Asset reimported successfully`,
                    data: { url }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryAssetPath(url) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-path', url).then((path) => {
                if (path) {
                    resolve({
                        success: true,
                        message: `✅ Asset path retrieved`,
                        data: { url, path }
                    });
                }
                else {
                    resolve({ success: false, error: 'Asset path not found' });
                }
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryAssetUuid(url) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-uuid', url).then((uuid) => {
                if (uuid) {
                    resolve({
                        success: true,
                        message: `✅ Asset UUID retrieved`,
                        data: { url, uuid }
                    });
                }
                else {
                    resolve({ success: false, error: 'Asset UUID not found' });
                }
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryAssetUrl(uuid) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-url', uuid).then((url) => {
                if (url) {
                    resolve({
                        success: true,
                        message: `✅ Asset URL retrieved`,
                        data: { uuid, url }
                    });
                }
                else {
                    resolve({ success: false, error: 'Asset URL not found' });
                }
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async findAssetByName(args) {
        const { name, exactMatch = false, assetType = 'all', folder = 'db://assets', maxResults = 20 } = args;
        return new Promise(async (resolve) => {
            try {
                const allAssetsResponse = await this.getAssets(assetType, folder);
                if (!allAssetsResponse.success || !allAssetsResponse.data) {
                    resolve({
                        success: false,
                        error: `Failed to get assets: ${allAssetsResponse.error}`
                    });
                    return;
                }
                const allAssets = allAssetsResponse.data.assets;
                let matchedAssets = [];
                for (const asset of allAssets) {
                    const assetName = asset.name;
                    let matches = false;
                    if (exactMatch) {
                        matches = assetName === name;
                    }
                    else {
                        matches = assetName.toLowerCase().includes(name.toLowerCase());
                    }
                    if (matches) {
                        try {
                            const detailResponse = await this.getAssetInfo(asset.path);
                            if (detailResponse.success) {
                                matchedAssets.push(Object.assign(Object.assign({}, asset), { details: detailResponse.data }));
                            }
                            else {
                                matchedAssets.push(asset);
                            }
                        }
                        catch (_a) {
                            matchedAssets.push(asset);
                        }
                        if (matchedAssets.length >= maxResults) {
                            break;
                        }
                    }
                }
                resolve({
                    success: true,
                    message: `✅ Found ${matchedAssets.length} assets matching '${name}'`,
                    data: {
                        searchTerm: name,
                        exactMatch,
                        assetType,
                        folder,
                        totalFound: matchedAssets.length,
                        maxResults,
                        assets: matchedAssets
                    }
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Asset search failed: ${error.message}`
                });
            }
        });
    }
    async getAssetDetails(assetPath, includeSubAssets = true) {
        return new Promise(async (resolve) => {
            try {
                const assetInfoResponse = await this.getAssetInfo(assetPath);
                if (!assetInfoResponse.success) {
                    resolve(assetInfoResponse);
                    return;
                }
                const assetInfo = assetInfoResponse.data;
                const detailedInfo = Object.assign(Object.assign({}, assetInfo), { subAssets: [] });
                if (includeSubAssets && assetInfo) {
                    if (assetInfo.type === 'cc.ImageAsset' || assetPath.match(/\.(png|jpg|jpeg|gif|tga|bmp|psd)$/i)) {
                        const baseUuid = assetInfo.uuid;
                        const possibleSubAssets = [
                            { type: 'spriteFrame', uuid: `${baseUuid}@f9941`, suffix: '@f9941' },
                            { type: 'texture', uuid: `${baseUuid}@6c48a`, suffix: '@6c48a' },
                            { type: 'texture2D', uuid: `${baseUuid}@6c48a`, suffix: '@6c48a' }
                        ];
                        for (const subAsset of possibleSubAssets) {
                            try {
                                const subAssetUrl = await Editor.Message.request('asset-db', 'query-url', subAsset.uuid);
                                if (subAssetUrl) {
                                    detailedInfo.subAssets.push({
                                        type: subAsset.type,
                                        uuid: subAsset.uuid,
                                        url: subAssetUrl,
                                        suffix: subAsset.suffix
                                    });
                                }
                            }
                            catch (_a) {
                                // Sub-asset doesn't exist, skip it
                            }
                        }
                    }
                }
                resolve({
                    success: true,
                    message: `✅ Asset details retrieved. Found ${detailedInfo.subAssets.length} sub-assets`,
                    data: Object.assign({ assetPath,
                        includeSubAssets }, detailedInfo)
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Failed to get asset details: ${error.message}`
                });
            }
        });
    }
}
exports.AssetAdvancedTools = AssetAdvancedTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvYXNzZXQtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFhLGtCQUFrQjtJQUMzQixRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxjQUFjO2dCQUNwQixXQUFXLEVBQUUsOFZBQThWO2dCQUMzVyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUM7NEJBQ3ZELFdBQVcsRUFBRSxvU0FBb1M7eUJBQ3BUO3dCQUNELG9CQUFvQjt3QkFDcEIsTUFBTSxFQUFFOzRCQUNKLElBQUksRUFBRSxPQUFPOzRCQUNiLEtBQUssRUFBRTtnQ0FDSCxJQUFJLEVBQUUsUUFBUTtnQ0FDZCxVQUFVLEVBQUU7b0NBQ1IsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUU7b0NBQy9ELFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFO2lDQUNqRTtnQ0FDRCxRQUFRLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDOzZCQUN4Qzs0QkFDRCxXQUFXLEVBQUUsMk9BQTJPO3lCQUMzUDt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFNBQVM7NEJBQ2YsV0FBVyxFQUFFLDJEQUEyRDs0QkFDeEUsT0FBTyxFQUFFLEtBQUs7eUJBQ2pCO3dCQUNELG9CQUFvQjt3QkFDcEIs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QUNsQixPQUFPLENBQUM7b0JBQ0osT0FBTyxFQUFFLEtBQUs7b0JBQ2QsS0FBSyxFQUFFLGdDQUFnQyxLQUFLLENBQUMsT0FBTyxFQUFFO2lCQUN6RCxDQUFDLENBQUM7WUFDUCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUE1cENELGdEQTRwQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IsIEFzc2V0SW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBBc3NldEFkdmFuY2VkVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdhc3NldF9tYW5hZ2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQVNTRVQgTUFOQUdFTUVOVDogSW1wb3J0LCBkZWxldGUsIHNhdmUgbWV0YWRhdGEsIG9yIGdlbmVyYXRlIFVSTHMgZm9yIGFzc2V0cy4gVXNlIHRoaXMgZm9yIGFsbCBhc3NldCBjcmVhdGlvbi9kZWxldGlvbi9tb2RpZmljYXRpb24gb3BlcmF0aW9ucy4gV09SS0ZMT1c6IEZpcnN0IHVzZSBhc3NldF9xdWVyeSB0byBmaW5kIGFzc2V0cywgdGhlbiBwZXJmb3JtIG9wZXJhdGlvbnMuIEltcG9ydCByZXF1aXJlcyBzb3VyY2VQYXRoK3RhcmdldFVybCwgZGVsZXRlIG5lZWRzIHVybHMgYXJyYXksIHNhdmVfbWV0YSBuZWVkcyB1cmxPclVVSUQrY29udGVudCwgZ2VuZXJhdGVfdXJsIG5lZWRzIHVybCBwYXJhbWV0ZXIuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydpbXBvcnQnLCAnZGVsZXRlJywgJ3NhdmVfbWV0YScsICdnZW5lcmF0ZV91cmwnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Nob29zZSBvcGVyYXRpb246IFwiaW1wb3J0XCIgPSBiYXRjaCBpbXBvcnQgZXh0ZXJuYWwgZmlsZXMgaW50byBwcm9qZWN0IChyZXF1aXJlcyBhc3NldHMgYXJyYXkpIHwgXCJkZWxldGVcIiA9IGJhdGNoIHJlbW92ZSBhc3NldHMgZnJvbSBwcm9qZWN0IChyZXF1aXJlcyB1cmxzIGFycmF5KSB8IFwic2F2ZV9tZXRhXCIgPSB1cGRhdGUgYXNzZXQgbWV0YWRhdGEgKHJlcXVpcmVzIHVybE9yVVVJRCtjb250ZW50KSB8IFwiZ2VuZXJhdGVfdXJsXCIgPSBjcmVhdGUgdW5pcXVlIFVSTCBmb3IgYXNzZXQgKHJlcXVpcmVzIHVybCknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGltcG9ydCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVBhdGg6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU291cmNlIGZpbGUgcGF0aCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFVybDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUYXJnZXQgYXNzZXQgVVJMJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NvdXJjZVBhdGgnLCAndGFyZ2V0VXJsJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgb2YgaW1wb3J0IG9wZXJhdGlvbnMgKFJFUVVJUkVEIGZvciBpbXBvcnQgYWN0aW9uKS4gRWFjaCBpdGVtIG11c3QgaGF2ZSBzb3VyY2VQYXRoIChleHRlcm5hbCBmaWxlKSBhbmQgdGFyZ2V0VXJsIChkZXN0aW5hdGlvbiBpbiBwcm9qZWN0KS4gRXhhbXBsZTogW3tcInNvdXJjZVBhdGhcIjpcIi9wYXRoL3RvL2ltYWdlLnBuZ1wiLCBcInRhcmdldFVybFwiOlwiZGI6Ly9hc3NldHMvaW1hZ2VzL2hlcm8ucG5nXCJ9XSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd3JpdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaGV0aGVyIHRvIG92ZXJ3cml0ZSBleGlzdGluZyBhc3NldHMgKGltcG9ydCBhY3Rpb24gb25seSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGRlbGV0ZSBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBcnJheSBvZiBhc3NldCBVUkxzIHRvIHJlbW92ZSAoUkVRVUlSRUQgZm9yIGRlbGV0ZSBhY3Rpb24pLiBVc2UgQ29jb3MgYXNzZXQgVVJMcyBsaWtlIFwiZGI6Ly9hc3NldHMvaW1hZ2VzL2hlcm8ucG5nXCIuIEdldCBVUkxzIGZyb20gYXNzZXRfcXVlcnkgdG9vbCBmaXJzdC4gRXhhbXBsZTogW1wiZGI6Ly9hc3NldHMvaW1hZ2VzL29sZDEucG5nXCIsIFwiZGI6Ly9hc3NldHMvc2NlbmVzL3Rlc3Quc2NlbmVcIl0nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIHNhdmVfbWV0YSBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgaWRlbnRpZmllciAoUkVRVUlSRUQgZm9yIHNhdmVfbWV0YSBhY3Rpb24pLiBDYW4gYmUgYXNzZXQgVVJMIGxpa2UgXCJkYjovL2Fzc2V0cy9pbWFnZS5wbmdcIiBvciBVVUlEIGxpa2UgXCIxMjM0NTY3OC1hYmNkLTEyMzQtNTY3OC0xMjM0NTY3ODlhYmNcIi4gR2V0IGZyb20gYXNzZXRfcXVlcnkgdG9vbC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2VyaWFsaXplZCBtZXRhZGF0YSBjb250ZW50IChSRVFVSVJFRCBmb3Igc2F2ZV9tZXRhIGFjdGlvbikuIE11c3QgYmUgdmFsaWQgSlNPTiBzdHJpbmcgY29udGFpbmluZyBhc3NldCBtZXRhZGF0YS4gRm9ybWF0IGRlcGVuZHMgb24gYXNzZXQgdHlwZS4gRXhhbXBsZTogXCJ7XFxcImltcG9ydGVyXFxcIjpcXFwiaW1hZ2VcXFwiLFxcXCJzZXR0aW5nc1xcXCI6e1xcXCJmb3JtYXRcXFwiOlxcXCJwbmdcXFwifX1cIidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgZ2VuZXJhdGVfdXJsIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVUkwgdG8gZ2VuZXJhdGUgYXZhaWxhYmxlIFVSTCBmb3IgKGdlbmVyYXRlX3VybCBhY3Rpb24gb25seSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnYXNzZXRfYW5hbHl6ZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBU1NFVCBBTkFMWVNJUzogQW5hbHl6ZSBhc3NldCByZWxhdGlvbnNoaXBzIChkZXBlbmRlbmNpZXMvdXNlcnMpIG9yIGV4cG9ydCBtYW5pZmVzdHMuIFdPUktGTE9XOiBVc2UgXCJkZXBlbmRlbmNpZXNcIiB0byBmaW5kIHdoYXQgYW4gYXNzZXQgZGVwZW5kcyBvbiwgXCJ1c2Vyc1wiIHRvIGZpbmQgd2hhdCByZWZlcmVuY2VzIGFuIGFzc2V0IChyZXZlcnNlIGxvb2t1cCksIFwibWFuaWZlc3RcIiB0byBleHBvcnQgaW52ZW50b3J5LiBSRVRVUk5TOiBkZXBlbmRlbmNpZXMvdXNlcnMgYWN0aW9ucyByZXR1cm4geyB1cmxPclVVSUQsIHR5cGUsIGRlcGVuZGVuY2llcy91c2VyczogQXJyYXk8eyB1dWlkLCBwYXRoLCBuYW1lLCB0eXBlIH0+LCBjb3VudCB9LiBFYWNoIGl0ZW0gY29udGFpbnMgcmVzb2x2ZWQgYXNzZXQgaW5mbyAocGF0aCBsaWtlIFwiZGI6Ly9hc3NldHMvLi4uXCIsIG5hbWUgbGlrZSBcIk15UHJlZmFiLnByZWZhYlwiLCB0eXBlIGxpa2UgXCJjYy5QcmVmYWJcIi9cImNjLlR5cGVTY3JpcHRcIikuIExJTUlUQVRJT05TOiBSZWZlcmVuY2UgdmFsaWRhdGlvbiBhbmQgdW51c2VkIGFzc2V0IGRldGVjdGlvbiBhcmUgZGlzYWJsZWQgZHVlIHRvIEFQSSBjb25zdHJhaW50cy4nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2RlcGVuZGVuY2llcycsICd1c2VycycsICdtYW5pZmVzdCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5hbHlzaXMgdHlwZTogXCJkZXBlbmRlbmNpZXNcIiA9IGZpbmQgYWxsIGFzc2V0cy9zY3JpcHRzIHRoaXMgYXNzZXQgZGVwZW5kcyBvbiAoZm9yd2FyZCBsb29rdXAsIHJlcXVpcmVzIHVybE9yVVVJRCkuIFJldHVybnMgQXJyYXk8eyB1dWlkLCBwYXRoLCBuYW1lLCB0eXBlIH0+LiB8IFwidXNlcnNcIiA9IGZpbmQgYWxsIGFzc2V0cy9zY3JpcHRzIHRoYXQgZGlyZWN0bHkgcmVmZXJlbmNlIHRoaXMgYXNzZXQgKHJldmVyc2UgbG9va3VwLCByZXF1aXJlcyB1cmxPclVVSUQpLiBSZXR1cm5zIEFycmF5PHsgdXVpZCwgcGF0aCwgbmFtZSwgdHlwZSB9Pi4gfCBcIm1hbmlmZXN0XCIgPSBnZW5lcmF0ZSBjb21wbGV0ZSBhc3NldCBpbnZlbnRvcnkgcmVwb3J0IGZvciBhIGZvbGRlciAob3B0aW9uYWwgZm9sZGVyIHBhcmFtZXRlciwgb3V0cHV0cyBKU09OL0NTVi9YTUwgZm9ybWF0KS4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tbW9uIHBhcmFtZXRlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbGRlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IGZvbGRlciBwYXRoIHRvIGFuYWx5emUgKGJvdGggYWN0aW9ucykuIERlZmF1bHQ6IFwiZGI6Ly9hc3NldHNcIiBhbmFseXplcyBlbnRpcmUgcHJvamVjdC4gRXhhbXBsZXM6IFwiZGI6Ly9hc3NldHMvc2NlbmVzXCIgZm9yIHNjZW5lcyBvbmx5LCBcImRiOi8vYXNzZXRzL3RleHR1cmVzXCIgZm9yIHRleHR1cmVzIG9ubHkuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZGI6Ly9hc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGRlcGVuZGVuY2llcyAvIHVzZXJzIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsT3JVVUlEOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVUkwgb3IgVVVJRCAoUkVRVUlSRUQgZm9yIGRlcGVuZGVuY2llcy91c2VycyBhY3Rpb24pLiBDYW4gYmUgYSBDb2NvcyBhc3NldCBVUkwgbGlrZSBcImRiOi8vYXNzZXRzL3RleHR1cmVzL3BsYXllci5wbmdcIiBvciBhIFVVSUQgbGlrZSBcIjFlNmJiNTQ2LWVjMDUtNGNjNC1iYjI0LTY4YzZjZDNhZDVhNlwiLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFR5cGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2Fzc2V0JywgJ3NjcmlwdCcsICdhbGwnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1F1ZXJ5IGFzc2V0IHR5cGUgZmlsdGVyIChkZXBlbmRlbmNpZXMvdXNlcnMgYWN0aW9uKTogXCJhc3NldFwiID0gb25seSBub24tc2NyaXB0IGFzc2V0IHJlZmVyZW5jZXMgKGRlZmF1bHQpLCBcInNjcmlwdFwiID0gb25seSBzY3JpcHQgKC50cykgcmVmZXJlbmNlcywgXCJhbGxcIiA9IGJvdGggYXNzZXRzIGFuZCBzY3JpcHRzLiBBZmZlY3RzIHdoaWNoIHR5cGVzIGFwcGVhciBpbiB0aGUgcmV0dXJuZWQgYXJyYXkuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnYXNzZXQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIHVudXNlZCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVTdWJmb2xkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2hldGhlciB0byBpbmNsdWRlIHN1YmZvbGRlcnMgKHVudXNlZCBhY3Rpb24gb25seSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgbWFuaWZlc3QgYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ091dHB1dCBmb3JtYXQgZm9yIG1hbmlmZXN0IChtYW5pZmVzdCBhY3Rpb24gb25seSkuIFwianNvblwiID0gc3RydWN0dXJlZCBkYXRhIGZvciBBUElzLCBcImNzdlwiID0gc3ByZWFkc2hlZXQgY29tcGF0aWJsZSwgXCJ4bWxcIiA9IGxlZ2FjeSBzeXN0ZW0gaW50ZWdyYXRpb24uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2pzb24nLCAnY3N2JywgJ3htbCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdqc29uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVNZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luY2x1ZGUgZGV0YWlsZWQgbWV0YWRhdGEgaW4gbWFuaWZlc3QgKG1hbmlmZXN0IGFjdGlvbiBvbmx5KS4gdHJ1ZSA9IGZ1bGwgYXNzZXQgaW5mb3JtYXRpb24gaW5jbHVkaW5nIGltcG9ydCBzZXR0aW5ncywgZmFsc2UgPSBiYXNpYyBpbmZvIG9ubHkgKG5hbWUsIHBhdGgsIHR5cGUsIFVVSUQpLiBOb3RlOiBDdXJyZW50bHkgbGltaXRlZCBieSBBUEkgYXZhaWxhYmlsaXR5LicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQ09NTUVOVEVEIE9VVDogYXNzZXRfb3B0aW1pemUgLSBUZXh0dXJlIGNvbXByZXNzaW9uIHJlcXVpcmVzIGltYWdlIHByb2Nlc3NpbmcgQVBJcyBub3QgYXZhaWxhYmxlIGluIENvY29zIENyZWF0b3IgTUNQXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdhc3NldF9vcHRpbWl6ZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBU1NFVCBPUFRJTUlaQVRJT046IENvbXByZXNzIHRleHR1cmVzIGFuZCBvcHRpbWl6ZSBhc3NldHMgZm9yIGJldHRlciBwZXJmb3JtYW5jZS4gRElTQUJMRUQgLSBObyBpbWFnZSBwcm9jZXNzaW5nIEFQSXMgYXZhaWxhYmxlLicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnY29tcHJlc3NfdGV4dHVyZXMnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbjogXCJjb21wcmVzc190ZXh0dXJlc1wiID0gYmF0Y2ggY29tcHJlc3MgdGV4dHVyZSBhc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Fzc2V0X3N5c3RlbScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBU1NFVCBTWVNURU06IENoZWNrIGFzc2V0IGRhdGFiYXNlIHN0YXR1cywgcmVmcmVzaCBhc3NldHMsIG9yIG9wZW4gYXNzZXRzIHdpdGggZXh0ZXJuYWwgcHJvZ3JhbXMuIFVzZSB0aGlzIGZvciBzeXN0ZW0tbGV2ZWwgYXNzZXQgb3BlcmF0aW9ucy4nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2NoZWNrX3JlYWR5JywgJ29wZW5fZXh0ZXJuYWwnLCAncmVmcmVzaCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uOiBcImNoZWNrX3JlYWR5XCIgPSBjaGVjayBpZiBhc3NldCBkYXRhYmFzZSBpcyByZWFkeSB8IFwib3Blbl9leHRlcm5hbFwiID0gb3BlbiBhc3NldCB3aXRoIGV4dGVybmFsIHByb2dyYW0gfCBcInJlZnJlc2hcIiA9IHJlZnJlc2ggYXNzZXQgZGF0YWJhc2UnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVUkwgdG8gb3BlbiAob3Blbl9leHRlcm5hbCBhY3Rpb24gb25seSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9sZGVyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTcGVjaWZpYyBmb2xkZXIgdG8gcmVmcmVzaCAocmVmcmVzaCBhY3Rpb24gb25seSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnYXNzZXRfcXVlcnknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQVNTRVQgUVVFUlk6IFNlYXJjaCwgZ2V0IGluZm9ybWF0aW9uLCBhbmQgZmluZCBhc3NldHMgYnkgdmFyaW91cyBjcml0ZXJpYS4gVXNlIHRoaXMgZm9yIGFzc2V0IGRpc2NvdmVyeSBhbmQgZGV0YWlsZWQgaW5mb3JtYXRpb24gcmV0cmlldmFsLicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZ2V0X2luZm8nLCAnZ2V0X2Fzc2V0cycsICdmaW5kX2J5X25hbWUnLCAnZ2V0X2RldGFpbHMnLCAncXVlcnlfcGF0aCcsICdxdWVyeV91dWlkJywgJ3F1ZXJ5X3VybCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgYWN0aW9uIHRvIHBlcmZvcm0nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGdldF9pbmZvIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBwYXRoIChnZXRfaW5mby9nZXRfZGV0YWlscyBhY3Rpb25zIG9ubHkpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBnZXRfYXNzZXRzIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnYWxsJywgJ3NjZW5lJywgJ3ByZWZhYicsICdzY3JpcHQnLCAndGV4dHVyZScsICdtYXRlcmlhbCcsICdtZXNoJywgJ2F1ZGlvJywgJ2FuaW1hdGlvbicsICdlZmZlY3QnLCAnY2h1bmsnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IHR5cGUgZmlsdGVyIChnZXRfYXNzZXRzIGFjdGlvbiBvbmx5KS4gU3VwcG9ydHMgQ29jb3MgYnVpbHQtaW4gdHlwZXMgbGlrZSBlZmZlY3QgYW5kIGNodW5rLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2FsbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBmb2xkZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NlYXJjaCBzY29wZSAoZ2V0X2Fzc2V0cy9maW5kX2J5X25hbWUgYWN0aW9ucykuIE9wdGlvbnM6IFwiZGI6Ly9hc3NldHNcIiA9IHVzZXIgYXNzZXRzIG9ubHksIFwiZGI6Ly9pbnRlcm5hbFwiID0gYnVpbHQtaW4gYXNzZXRzIG9ubHksIFwiYWxsXCIgPSBib3RoIHVzZXIgYW5kIGJ1aWx0LWluIGFzc2V0cy4gRGVmYXVsdCBzZWFyY2hlcyBib3RoIHVzZXIgYW5kIGJ1aWx0LWluLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBmaW5kX2J5X25hbWUgYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBuYW1lIHRvIHNlYXJjaCBmb3IgKGZpbmRfYnlfbmFtZSBhY3Rpb24gb25seSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3RNYXRjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1doZXRoZXIgdG8gdXNlIGV4YWN0IG5hbWUgbWF0Y2hpbmcgKGZpbmRfYnlfbmFtZSBhY3Rpb24gb25seSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRUeXBlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydhbGwnLCAnc2NlbmUnLCAncHJlZmFiJywgJ3NjcmlwdCcsICd0ZXh0dXJlJywgJ21hdGVyaWFsJywgJ21lc2gnLCAnYXVkaW8nLCAnYW5pbWF0aW9uJywgJ3Nwcml0ZUZyYW1lJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaWx0ZXIgYnkgYXNzZXQgdHlwZSAoZmluZF9ieV9uYW1lIGFjdGlvbiBvbmx5KScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2FsbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhSZXN1bHRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIG51bWJlciBvZiByZXN1bHRzIChmaW5kX2J5X25hbWUgYWN0aW9uIG9ubHkpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAyMFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBnZXRfZGV0YWlscyBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVTdWJBc3NldHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIHN1Yi1hc3NldHMgbGlrZSBzcHJpdGVGcmFtZSAoZ2V0X2RldGFpbHMgYWN0aW9uIG9ubHkpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIHF1ZXJ5IGFjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIChxdWVyeV9wYXRoL3F1ZXJ5X3V1aWQgYWN0aW9ucyBvbmx5KSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVVUlEIChxdWVyeV91cmwgYWN0aW9uIG9ubHkpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Fzc2V0X29wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQVNTRVQgT1BFUkFUSU9OUzogQ3JlYXRlLCBjb3B5LCBtb3ZlLCBkZWxldGUsIHNhdmUsIGFuZCBpbXBvcnQgYXNzZXRzLiBVc2UgdGhpcyBmb3IgYWxsIGFzc2V0IGZpbGUgb3BlcmF0aW9ucyBhbmQgbW9kaWZpY2F0aW9ucy4nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2NyZWF0ZScsICdjb3B5JywgJ21vdmUnLCAnZGVsZXRlJywgJ3NhdmUnLCAncmVpbXBvcnQnLCAnaW1wb3J0J10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBvcGVyYXRpb24gdG8gcGVyZm9ybSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgY3JlYXRlIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVUkwgKGNyZWF0ZS9kZWxldGUvc2F2ZS9yZWltcG9ydCBhY3Rpb25zKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaWxlIGNvbnRlbnQgLSBudWxsIGZvciBmb2xkZXIgKGNyZWF0ZS9zYXZlIGFjdGlvbnMpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJ3cml0ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ092ZXJ3cml0ZSBleGlzdGluZyBmaWxlIChjcmVhdGUvY29weS9tb3ZlIGFjdGlvbnMpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBjb3B5L21vdmUgYWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTb3VyY2UgYXNzZXQgVVJMIChjb3B5L21vdmUgYWN0aW9ucyknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgbG9jYXRpb24gVVJMIChjb3B5L21vdmUgYWN0aW9ucyknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGltcG9ydCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NvdXJjZSBmaWxlIHBhdGggKGltcG9ydCBhY3Rpb24gb25seSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Rm9sZGVyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgZm9sZGVyIGluIGFzc2V0cyAoaW1wb3J0IGFjdGlvbiBvbmx5KSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdhc3NldF9tYW5hZ2UnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUFzc2V0TWFuYWdlKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnYXNzZXRfYW5hbHl6ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlQXNzZXRBbmFseXplKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnYXNzZXRfc3lzdGVtJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVBc3NldFN5c3RlbShhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2Fzc2V0X3F1ZXJ5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVBc3NldFF1ZXJ5KGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnYXNzZXRfb3BlcmF0aW9ucyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlQXNzZXRPcGVyYXRpb25zKGFyZ3MpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOaWsOeahOaVtOWQiOWkhOeQhuWHveaVsFxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlQXNzZXRNYW5hZ2UoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgeyBhY3Rpb24gfSA9IGFyZ3M7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnaW1wb3J0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5iYXRjaEltcG9ydEFzc2V0cyhhcmdzLmFzc2V0cywgYXJncy5vdmVyd3JpdGUpO1xuICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5iYXRjaERlbGV0ZUFzc2V0cyhhcmdzLnVybHMpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9tZXRhJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zYXZlQXNzZXRNZXRhKGFyZ3MudXJsT3JVVUlELCBhcmdzLmNvbnRlbnQpO1xuICAgICAgICAgICAgY2FzZSAnZ2VuZXJhdGVfdXJsJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZUF2YWlsYWJsZVVybChhcmdzLnVybCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gYXNzZXQgbWFuYWdlIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBc3NldEFuYWx5emUoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgeyBhY3Rpb24gfSA9IGFyZ3M7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgLy8gY2FzZSAndmFsaWRhdGVfcmVmcyc6IC8vIENPTU1FTlRFRCBPVVQgLSBSZXF1aXJlcyBjb21wbGV4IHByb2plY3QgYW5hbHlzaXNcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gYXdhaXQgdGhpcy52YWxpZGF0ZUFzc2V0UmVmZXJlbmNlcyhhcmdzLmZvbGRlcik7XG4gICAgICAgICAgICBjYXNlICdkZXBlbmRlbmNpZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFzc2V0RGVwZW5kZW5jaWVzKGFyZ3MudXJsT3JVVUlEIHx8IGFyZ3MudXJsLCBhcmdzLmFzc2V0VHlwZSk7XG4gICAgICAgICAgICBjYXNlICd1c2Vycyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QXNzZXRVc2VycyhhcmdzLnVybE9yVVVJRCwgYXJncy5hc3NldFR5cGUpO1xuICAgICAgICAgICAgLy8gY2FzZSAndW51c2VkJzogLy8gQ09NTUVOVEVEIE9VVCAtIFJlcXVpcmVzIGNvbXBsZXggcHJvamVjdCBhbmFseXNpc1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFVudXNlZEFzc2V0cyhhcmdzLmZvbGRlciwgYXJncy5pbmNsdWRlU3ViZm9sZGVycyk7XG4gICAgICAgICAgICBjYXNlICdtYW5pZmVzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhwb3J0QXNzZXRNYW5pZmVzdChhcmdzLmZvbGRlciwgYXJncy5mb3JtYXQsIGFyZ3MuaW5jbHVkZU1ldGFkYXRhKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBhc3NldCBhbmFseXplIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ09NTUVOVEVEIE9VVCAtIE5vIGltYWdlIHByb2Nlc3NpbmcgQVBJcyBhdmFpbGFibGUgaW4gQ29jb3MgQ3JlYXRvciBNQ1BcbiAgICAvKlxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlQXNzZXRPcHRpbWl6ZShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdjb21wcmVzc190ZXh0dXJlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29tcHJlc3NUZXh0dXJlcyhhcmdzLmZvbGRlciwgYXJncy5xdWFsaXR5LCBhcmdzLmZvcm1hdCwgYXJncy5yZWN1cnNpdmUpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFzc2V0IG9wdGltaXplIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuICAgICovXG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZUFzc2V0U3lzdGVtKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHsgYWN0aW9uIH0gPSBhcmdzO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2NoZWNrX3JlYWR5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeUFzc2V0RGJSZWFkeSgpO1xuICAgICAgICAgICAgY2FzZSAnb3Blbl9leHRlcm5hbCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMub3BlbkFzc2V0RXh0ZXJuYWwoYXJncy51cmwpO1xuICAgICAgICAgICAgY2FzZSAncmVmcmVzaCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVmcmVzaEFzc2V0cyhhcmdzLmZvbGRlcik7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gYXNzZXQgc3lzdGVtIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBc3NldFF1ZXJ5KGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHsgYWN0aW9uIH0gPSBhcmdzO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9pbmZvJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBc3NldEluZm8oYXJncy5hc3NldFBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X2Fzc2V0cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QXNzZXRzKGFyZ3MudHlwZSwgYXJncy5mb2xkZXIpO1xuICAgICAgICAgICAgY2FzZSAnZmluZF9ieV9uYW1lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5maW5kQXNzZXRCeU5hbWUoYXJncyk7XG4gICAgICAgICAgICBjYXNlICdnZXRfZGV0YWlscyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QXNzZXREZXRhaWxzKGFyZ3MuYXNzZXRQYXRoLCBhcmdzLmluY2x1ZGVTdWJBc3NldHMpO1xuICAgICAgICAgICAgY2FzZSAncXVlcnlfcGF0aCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlBc3NldFBhdGgoYXJncy51cmwpO1xuICAgICAgICAgICAgY2FzZSAncXVlcnlfdXVpZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlBc3NldFV1aWQoYXJncy51cmwpO1xuICAgICAgICAgICAgY2FzZSAncXVlcnlfdXJsJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeUFzc2V0VXJsKGFyZ3MudXVpZCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gYXNzZXQgcXVlcnkgYWN0aW9uOiAke2FjdGlvbn1gIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZUFzc2V0T3BlcmF0aW9ucyhhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZUFzc2V0KGFyZ3MudXJsLCBhcmdzLmNvbnRlbnQsIGFyZ3Mub3ZlcndyaXRlKTtcbiAgICAgICAgICAgIGNhc2UgJ2NvcHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvcHlBc3NldChhcmdzLnNvdXJjZSwgYXJncy50YXJnZXQsIGFyZ3Mub3ZlcndyaXRlKTtcbiAgICAgICAgICAgIGNhc2UgJ21vdmUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1vdmVBc3NldChhcmdzLnNvdXJjZSwgYXJncy50YXJnZXQsIGFyZ3Mub3ZlcndyaXRlKTtcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVsZXRlQXNzZXQoYXJncy51cmwpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZUFzc2V0KGFyZ3MudXJsLCBhcmdzLmNvbnRlbnQpO1xuICAgICAgICAgICAgY2FzZSAncmVpbXBvcnQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlaW1wb3J0QXNzZXQoYXJncy51cmwpO1xuICAgICAgICAgICAgY2FzZSAnaW1wb3J0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbXBvcnRBc3NldChhcmdzLnNvdXJjZVBhdGgsIGFyZ3MudGFyZ2V0Rm9sZGVyKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBhc3NldCBvcGVyYXRpb24gYWN0aW9uOiAke2FjdGlvbn1gIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDljp/mnInnmoTlrp7njrDmlrnms5Xkv53mjIHkuI3lj5jvvIjku47ljp/mlofku7blpI3liLbvvIlcbiAgICBwcml2YXRlIGFzeW5jIHNhdmVBc3NldE1ldGEodXJsT3JVVUlEOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdzYXZlLWFzc2V0LW1ldGEnLCB1cmxPclVVSUQsIGNvbnRlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDinIUgQXNzZXQgbWV0YSBzYXZlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgIGRhdGE6IHsgdXJsT3JVVUlELCByZXN1bHQgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gc2F2ZSBhc3NldCBtZXRhOiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUF2YWlsYWJsZVVybCh1cmw6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBhdmFpbGFibGVVcmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgdXJsKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEF2YWlsYWJsZSBVUkwgZ2VuZXJhdGVkYCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7IG9yaWdpbmFsVXJsOiB1cmwsIGF2YWlsYWJsZVVybCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBnZW5lcmF0ZSBhdmFpbGFibGUgVVJMOiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUFzc2V0RGJSZWFkeSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaXNSZWFkeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXJlYWR5Jyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBkYXRhYmFzZSBzdGF0dXM6ICR7aXNSZWFkeSA/ICdSZWFkeScgOiAnTm90IFJlYWR5J31gLFxuICAgICAgICAgICAgICAgIGRhdGE6IHsgcmVhZHk6IGlzUmVhZHkgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gY2hlY2sgYXNzZXQgZGF0YWJhc2Ugc3RhdHVzOiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuQXNzZXRFeHRlcm5hbCh1cmw6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdvcGVuLWFzc2V0LWV4dGVybmFsJywgdXJsKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEFzc2V0IG9wZW5lZCBleHRlcm5hbGx5YCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7IHVybCwgcmVzdWx0IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIG9wZW4gYXNzZXQgZXh0ZXJuYWxseTogJHsoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2V9YFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hJbXBvcnRBc3NldHMoYXNzZXRzOiBBcnJheTx7IHNvdXJjZVBhdGg6IHN0cmluZzsgdGFyZ2V0VXJsOiBzdHJpbmcgfT4sIG92ZXJ3cml0ZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcbiAgICAgICAgbGV0IHN1Y2Nlc3NDb3VudCA9IDA7XG4gICAgICAgIGxldCBlcnJvckNvdW50ID0gMDtcblxuICAgICAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIGFzc2V0cykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCBhc3NldC50YXJnZXRVcmwsIHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBhc3NldC5zb3VyY2VQYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5hbWU6ICEob3ZlcndyaXRlIHx8IGZhbHNlKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZVBhdGg6IGFzc2V0LnNvdXJjZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFVybDogYXNzZXQudGFyZ2V0VXJsLFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzdWNjZXNzQ291bnQrKztcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlUGF0aDogYXNzZXQuc291cmNlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0VXJsOiBhc3NldC50YXJnZXRVcmwsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGVycm9yQ291bnQgPT09IDAsXG4gICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEltcG9ydGVkICR7c3VjY2Vzc0NvdW50fS8ke2Fzc2V0cy5sZW5ndGh9IGFzc2V0c2AsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgdG90YWxSZXF1ZXN0ZWQ6IGFzc2V0cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50LFxuICAgICAgICAgICAgICAgIGVycm9yQ291bnQsXG4gICAgICAgICAgICAgICAgcmVzdWx0c1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hEZWxldGVBc3NldHModXJsczogc3RyaW5nW10pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuICAgICAgICBsZXQgc3VjY2Vzc0NvdW50ID0gMDtcbiAgICAgICAgbGV0IGVycm9yQ291bnQgPSAwO1xuXG4gICAgICAgIGZvciAoY29uc3QgdXJsIG9mIHVybHMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZGVsZXRlLWFzc2V0JywgdXJsKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGVycm9yQ291bnQgPT09IDAsXG4gICAgICAgICAgICBtZXNzYWdlOiBg4pyFIERlbGV0ZWQgJHtzdWNjZXNzQ291bnR9LyR7dXJscy5sZW5ndGh9IGFzc2V0c2AsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgdG90YWxSZXF1ZXN0ZWQ6IHVybHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50LFxuICAgICAgICAgICAgICAgIHJlc3VsdHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBDT01NRU5URUQgT1VUIC0gUmVxdWlyZXMgY29tcGxleCBwcm9qZWN0IGFuYWx5c2lzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBDb2NvcyBDcmVhdG9yIE1DUCBBUElzXG4gICAgLypcbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKGZvbGRlcjogc3RyaW5nID0gJ2RiOi8vYXNzZXRzJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAnQXNzZXQgcmVmZXJlbmNlIHZhbGlkYXRpb24gcmVxdWlyZXMgY29tcGxleCBwcm9qZWN0IGFuYWx5c2lzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBDb2NvcyBDcmVhdG9yIE1DUCBpbXBsZW1lbnRhdGlvbi4nXG4gICAgICAgIH07XG4gICAgfVxuICAgICovXG5cbiAgICAvKipcbiAgICAgKiDmibnph4/lsIYgdXVpZCDmlbDnu4Top6PmnpDkuLrljIXlkKsgcGF0aC9uYW1lL3R5cGUg55qE6K+m57uG5L+h5oGvXG4gICAgICog6Kej5p6Q5aSx6LSl55qEIHV1aWQg5LuN5L+d55WZ5Y6f5aeL5YC877yM5LiN5Lya5Lii5aSxXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyByZXNvbHZlVVVJRHModXVpZHM6IHN0cmluZ1tdKTogUHJvbWlzZTxBcnJheTx7IHV1aWQ6IHN0cmluZzsgcGF0aD86IHN0cmluZzsgbmFtZT86IHN0cmluZzsgdHlwZT86IHN0cmluZyB9Pj4ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpIHx8IHV1aWRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgICAgICB1dWlkcy5tYXAoYXN5bmMgKHV1aWQpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KSgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdXVpZCwgcGF0aDogaW5mby51cmwgfHwgaW5mby5wYXRoLCBuYW1lOiBpbmZvLm5hbWUsIHR5cGU6IGluZm8udHlwZSB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHV1aWQgfTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdXVpZCB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouS4gOS4qui1hOa6kOS+nei1lueahOi1hOa6kOaIluiEmuacrO+8iOato+WQkeS+nei1luafpeivou+8iVxuICAgICAqIEBwYXJhbSB1cmxPclVVSUQg6LWE5rqQ55qEIHVybCDlnLDlnYDmiJbogIUgdXVpZFxuICAgICAqIEBwYXJhbSB0eXBlIOafpeivoueahOi1hOa6kOexu+Wei++8jOm7mOiupCBhc3NldO+8jOWPr+mAieWAvO+8mmFzc2V0LCBzY3JpcHQsIGFsbFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZ2V0QXNzZXREZXBlbmRlbmNpZXModXJsT3JVVUlEOiBzdHJpbmcsIHR5cGU6IHN0cmluZyA9ICdhc3NldCcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCF1cmxPclVVSUQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICd1cmwgb3IgdXJsT3JVVUlEIHBhcmFtZXRlciBpcyByZXF1aXJlZCBmb3IgZGVwZW5kZW5jaWVzIGFjdGlvbicgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJhd1VVSURzOiBzdHJpbmdbXSA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWRlcGVuZGVuY2llcycsIHVybE9yVVVJRCwgdHlwZSk7XG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCB0aGlzLnJlc29sdmVVVUlEcyhyYXdVVUlEcyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBkZXBlbmRlbmNpZXMgcmV0cmlldmVkYCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgICAgICBjb3VudDogZGVwZW5kZW5jaWVzLmxlbmd0aFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGdldCBhc3NldCBkZXBlbmRlbmNpZXM6ICR7KGVycm9yIGFzIEVycm9yKS5tZXNzYWdlfWBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LkuIDkuKrotYTmupDooqvlk6rkupvotYTmupDmiJbohJrmnKznm7TmjqXkvb/nlKjliLDvvIjlj43lkJHkvp3otZbmn6Xor6LvvIlcbiAgICAgKiBAcGFyYW0gdXJsT3JVVUlEIOi1hOa6kOeahCB1cmwg5Zyw5Z2A5oiW6ICFIHV1aWRcbiAgICAgKiBAcGFyYW0gdHlwZSDmn6Xor6LnmoTotYTmupDnsbvlnovvvIzpu5jorqQgYXNzZXTvvIzlj6/pgInlgLzvvJphc3NldCwgc2NyaXB0LCBhbGxcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdldEFzc2V0VXNlcnModXJsT3JVVUlEOiBzdHJpbmcsIHR5cGU6IHN0cmluZyA9ICdhc3NldCcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCF1cmxPclVVSUQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICd1cmxPclVVSUQgcGFyYW1ldGVyIGlzIHJlcXVpcmVkIGZvciB1c2VycyBhY3Rpb24nIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByYXdVVUlEczogc3RyaW5nW10gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdhc3NldC1kYicsICdxdWVyeS1hc3NldC11c2VycycsIHVybE9yVVVJRCwgdHlwZSk7XG4gICAgICAgICAgICBjb25zdCB1c2VycyA9IGF3YWl0IHRoaXMucmVzb2x2ZVVVSURzKHJhd1VVSURzKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEFzc2V0IHVzZXJzIHJldHJpZXZlZGAsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICB1cmxPclVVSUQsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJzLFxuICAgICAgICAgICAgICAgICAgICBjb3VudDogdXNlcnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gZ2V0IGFzc2V0IHVzZXJzOiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ09NTUVOVEVEIE9VVCAtIFJlcXVpcmVzIGNvbXByZWhlbnNpdmUgcHJvamVjdCBhbmFseXNpcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgQ29jb3MgQ3JlYXRvciBNQ1AgQVBJc1xuICAgIC8qXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRVbnVzZWRBc3NldHMoZm9sZGVyOiBzdHJpbmcgPSAnZGI6Ly9hc3NldHMnLCBpbmNsdWRlU3ViZm9sZGVyczogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ1VudXNlZCBhc3NldCBkZXRlY3Rpb24gcmVxdWlyZXMgY29tcHJlaGVuc2l2ZSBwcm9qZWN0IGFuYWx5c2lzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBDb2NvcyBDcmVhdG9yIE1DUCBpbXBsZW1lbnRhdGlvbi4nXG4gICAgICAgIH07XG4gICAgfVxuICAgICovXG5cbiAgICAvLyBDT01NRU5URUQgT1VUIC0gVGV4dHVyZSBjb21wcmVzc2lvbiByZXF1aXJlcyBpbWFnZSBwcm9jZXNzaW5nIEFQSXMgbm90IGF2YWlsYWJsZSBpbiBDb2NvcyBDcmVhdG9yIE1DUFxuICAgIC8qXG4gICAgcHJpdmF0ZSBhc3luYyBjb21wcmVzc1RleHR1cmVzKGZvbGRlcjogc3RyaW5nID0gJ2RiOi8vYXNzZXRzJywgcXVhbGl0eTogbnVtYmVyID0gODAsIGZvcm1hdDogc3RyaW5nID0gJ2pwZycsIHJlY3Vyc2l2ZTogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ1RleHR1cmUgY29tcHJlc3Npb24gcmVxdWlyZXMgaW1hZ2UgcHJvY2Vzc2luZyBjYXBhYmlsaXRpZXMgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IENvY29zIENyZWF0b3IgTUNQIGltcGxlbWVudGF0aW9uLidcbiAgICAgICAgfTtcbiAgICB9XG4gICAgKi9cblxuICAgIHByaXZhdGUgYXN5bmMgZXhwb3J0QXNzZXRNYW5pZmVzdChmb2xkZXI6IHN0cmluZyA9ICdkYjovL2Fzc2V0cycsIGZvcm1hdDogc3RyaW5nID0gJ2pzb24nLCBfaW5jbHVkZU1ldGFkYXRhOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g6I635Y+W5a6e6ZmF55qE6LWE5rqQ5pWw5o2uXG4gICAgICAgICAgICBjb25zdCBhbGxBc3NldHNSZXNwb25zZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycpO1xuICAgICAgICAgICAgY29uc3QgYWxsQXNzZXRzID0gQXJyYXkuaXNBcnJheShhbGxBc3NldHNSZXNwb25zZSkgPyBhbGxBc3NldHNSZXNwb25zZSA6IFtdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDov4fmu6TmjIflrprmlofku7blpLnnmoTotYTmupBcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkQXNzZXRzID0gYWxsQXNzZXRzLmZpbHRlcihhc3NldCA9PiBcbiAgICAgICAgICAgICAgICBhc3NldC5wYXRoICYmIGFzc2V0LnBhdGguaW5jbHVkZXMoZm9sZGVyKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5p6E5bu66LWE5rqQ5riF5Y2VIC0g5Y+q5YyF5ZCr5Z+656GA5L+h5oGv77yM5LiN5YyF5ZCr5qih5ouf55qE5YWD5pWw5o2uXG4gICAgICAgICAgICBjb25zdCBhc3NldHMgPSBmaWx0ZXJlZEFzc2V0cy5tYXAoYXNzZXQgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGFzc2V0LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGFzc2V0LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWRcbiAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogaW5jbHVkZU1ldGFkYXRhIHBhcmFtZXRlciBpZ25vcmVkIC0gZGV0YWlsZWQgbWV0YWRhdGEgcmVxdWlyZXMgQVBJcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgTUNQXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBtYW5pZmVzdCA9IHtcbiAgICAgICAgICAgICAgICBmb2xkZXIsXG4gICAgICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgICAgIGluY2x1ZGVNZXRhZGF0YTogZmFsc2UsIC8vIEFsd2F5cyBmYWxzZSAtIG1ldGFkYXRhIEFQSXMgbm90IGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgIGFzc2V0cyxcbiAgICAgICAgICAgICAgICBleHBvcnREYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdG90YWxBc3NldHM6IGFzc2V0cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc3VtbWFyeToge1xuICAgICAgICAgICAgICAgICAgICBieVR5cGU6IHRoaXMuZ3JvdXBBc3NldHNCeVR5cGUoYXNzZXRzKVxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiB0b3RhbFNpemUgY2FsY3VsYXRpb24gcmVtb3ZlZCAtIHJlcXVpcmVzIGZpbGUgc3lzdGVtIEFQSXMgbm90IGF2YWlsYWJsZSBpbiBNQ1BcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBtYW5pZmVzdCBleHBvcnRlZCB3aXRoICR7YXNzZXRzLmxlbmd0aH0gYXNzZXRzYCxcbiAgICAgICAgICAgICAgICBkYXRhOiBtYW5pZmVzdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gZXhwb3J0IGFzc2V0IG1hbmlmZXN0OiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHByaXZhdGUgZ3JvdXBBc3NldHNCeVR5cGUoYXNzZXRzOiBhbnlbXSk6IGFueSB7XG4gICAgICAgIGNvbnN0IGdyb3VwZWQ6IGFueSA9IHt9O1xuICAgICAgICBhc3NldHMuZm9yRWFjaChhc3NldCA9PiB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gYXNzZXQudHlwZSB8fCAnVW5rbm93bic7XG4gICAgICAgICAgICBncm91cGVkW3R5cGVdID0gKGdyb3VwZWRbdHlwZV0gfHwgMCkgKyAxO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGdyb3VwZWQ7XG4gICAgfVxuXG4gICAgLy8gTmV3IGFzc2V0IG9wZXJhdGlvbiBtZXRob2RzIG1vdmVkIGZyb20gcHJvamVjdC10b29scy50c1xuICAgIHByaXZhdGUgYXN5bmMgcmVmcmVzaEFzc2V0cyhmb2xkZXI/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBmb2xkZXIgfHwgJ2RiOi8vYXNzZXRzJztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHRhcmdldFBhdGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEFzc2V0cyByZWZyZXNoZWQgaW46ICR7dGFyZ2V0UGF0aH1gLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IGZvbGRlcjogdGFyZ2V0UGF0aCB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaW1wb3J0QXNzZXQoc291cmNlUGF0aDogc3RyaW5nLCB0YXJnZXRGb2xkZXI6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHNvdXJjZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NvdXJjZSBmaWxlIG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoc291cmNlUGF0aCk7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gdGFyZ2V0Rm9sZGVyLnN0YXJ0c1dpdGgoJ2RiOi8vJykgP1xuICAgICAgICAgICAgICAgIHRhcmdldEZvbGRlciA6IGBkYjovL2Fzc2V0cy8ke3RhcmdldEZvbGRlcn1gO1xuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbXBvcnQtYXNzZXQnLCBzb3VyY2VQYXRoLCBgJHt0YXJnZXRQYXRofS8ke2ZpbGVOYW1lfWApLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDinIUgQXNzZXQgaW1wb3J0ZWQ6ICR7ZmlsZU5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogcmVzdWx0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiByZXN1bHQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldEFzc2V0SW5mbyhhc3NldFBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGFzc2V0UGF0aCkudGhlbigoYXNzZXRJbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Fzc2V0IG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGluZm86IEFzc2V0SW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXRJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0SW5mby51dWlkLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldEluZm8udXJsLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldEluZm8udHlwZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogYXNzZXRJbmZvLnNpemUsXG4gICAgICAgICAgICAgICAgICAgIGlzRGlyZWN0b3J5OiBhc3NldEluZm8uaXNEaXJlY3RvcnlcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0SW5mby5tZXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcjogYXNzZXRJbmZvLm1ldGEudmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0ZXI6IGFzc2V0SW5mby5tZXRhLmltcG9ydGVyXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBpbmZvIHJldHJpZXZlZDogJHtpbmZvLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5mbyBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBc3NldHModHlwZTogc3RyaW5nID0gJ2FsbCcsIGZvbGRlcjogc3RyaW5nID0gJ2RiOi8vYXNzZXRzJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0dGVybnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5Yaz5a6a5pCc57Si6IyD5Zu0XG4gICAgICAgICAgICAgICAgaWYgKGZvbGRlciA9PT0gJ2FsbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pCc57Si55So5oi36LWE5rqQ5ZKM5YaF572u6LWE5rqQXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5zID0gWydkYjovL2Fzc2V0cy8qKi8qJywgJ2RiOi8vaW50ZXJuYWwvKiovKiddO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9sZGVyID09PSAnZGI6Ly9pbnRlcm5hbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y+q5pCc57Si5YaF572u6LWE5rqQXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5zID0gWydkYjovL2ludGVybmFsLyoqLyonXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZvbGRlciA9PT0gJ2RiOi8vYXNzZXRzJykge1xuICAgICAgICAgICAgICAgICAgICAvLyDlj6rmkJzntKLnlKjmiLfotYTmupBcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybnMgPSBbJ2RiOi8vYXNzZXRzLyoqLyonXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDmjIflrprmlofku7blpLlcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybnMgPSBbYCR7Zm9sZGVyfS8qKi8qYF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOaMh+WumuS6huexu+Wei++8jOa3u+WKoOaJqeWxleWQjei/h+a7pFxuICAgICAgICAgICAgICAgIGlmICh0eXBlICE9PSAnYWxsJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlRXh0ZW5zaW9uczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdzY2VuZSc6ICcuc2NlbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3ByZWZhYic6ICcucHJlZmFiJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzY3JpcHQnOiAnLnt0cyxqc30nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3RleHR1cmUnOiAnLntwbmcsanBnLGpwZWcsZ2lmLHRnYSxibXAscHNkfScsXG4gICAgICAgICAgICAgICAgICAgICAgICAnbWF0ZXJpYWwnOiAnLm10bCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVzaCc6ICcue2ZieCxvYmosZGFlfScsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYXVkaW8nOiAnLnttcDMsb2dnLHdhdixtNGF9JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdhbmltYXRpb24nOiAnLnthbmltLGNsaXB9JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdlZmZlY3QnOiAnLmVmZmVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnY2h1bmsnOiAnLmNodW5rJ1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9uID0gdHlwZUV4dGVuc2lvbnNbdHlwZV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChleHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm5zID0gcGF0dGVybnMubWFwKHBhdHRlcm4gPT4gcGF0dGVybi5yZXBsYWNlKCcvKiovKicsIGAvKiovKiR7ZXh0ZW5zaW9ufWApKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbREVCVUddIFNlYXJjaGluZyBhc3NldHMgd2l0aCBwYXR0ZXJuczpgLCBwYXR0ZXJucyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5bm26KGM5p+l6K+i5omA5pyJ5qih5byPXG4gICAgICAgICAgICAgICAgY29uc3QgYWxsUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJucy5tYXAocGF0dGVybiA9PiBcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycsIHsgcGF0dGVybjogcGF0dGVybiB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gUGF0dGVybiAke3BhdHRlcm59IGZhaWxlZDpgLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5ZCI5bm257uT5p6c5bm25Y676YeNXG4gICAgICAgICAgICAgICAgY29uc3QgY29tYmluZWRSZXN1bHRzID0gYWxsUmVzdWx0cy5mbGF0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdW5pcXVlQXNzZXRzID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbWJpbmVkUmVzdWx0cy5mb3JFYWNoKGFzc2V0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0ICYmIGFzc2V0LnV1aWQgJiYgIXVuaXF1ZUFzc2V0cy5oYXMoYXNzZXQudXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXF1ZUFzc2V0cy5zZXQoYXNzZXQudXVpZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAoYXNzZXQgYXMgYW55KS5zaXplIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNEaXJlY3Rvcnk6IChhc3NldCBhcyBhbnkpLmlzRGlyZWN0b3J5IHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogYXNzZXQudXJsLnN0YXJ0c1dpdGgoJ2RiOi8vaW50ZXJuYWwnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldHMgPSBBcnJheS5mcm9tKHVuaXF1ZUFzc2V0cy52YWx1ZXMoKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5oyJ57G75Z6L5YiG57uE57uf6K6hXG4gICAgICAgICAgICAgICAgY29uc3QgdXNlckFzc2V0cyA9IGFzc2V0cy5maWx0ZXIoYSA9PiAhYS5pc0J1aWx0SW4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1aWx0SW5Bc3NldHMgPSBhc3NldHMuZmlsdGVyKGEgPT4gYS5pc0J1aWx0SW4pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBGb3VuZCAke2Fzc2V0cy5sZW5ndGh9IGFzc2V0cyAoJHt1c2VyQXNzZXRzLmxlbmd0aH0gdXNlciArICR7YnVpbHRJbkFzc2V0cy5sZW5ndGh9IGJ1aWx0LWluKSBvZiB0eXBlICcke3R5cGV9J2AsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb2xkZXI6IGZvbGRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBhc3NldHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckNvdW50OiB1c2VyQXNzZXRzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0SW5Db3VudDogYnVpbHRJbkFzc2V0cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldHM6IGFzc2V0c1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZUFzc2V0KHVybDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcgfCBudWxsID0gbnVsbCwgb3ZlcndyaXRlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgb3ZlcndyaXRlOiBvdmVyd3JpdGUsXG4gICAgICAgICAgICAgICAgcmVuYW1lOiAhb3ZlcndyaXRlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCB1cmwsIGNvbnRlbnQsIG9wdGlvbnMpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRUeXBlID0gY29udGVudCA9PT0gbnVsbCA/ICdGb2xkZXInIDogJ0ZpbGUnO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFICR7YXNzZXRUeXBlfSBjcmVhdGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHJlc3VsdD8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogcmVzdWx0Py51cmwgfHwgdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXRUeXBlLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNvcHlBc3NldChzb3VyY2U6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcsIG92ZXJ3cml0ZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIG92ZXJ3cml0ZTogb3ZlcndyaXRlLFxuICAgICAgICAgICAgICAgIHJlbmFtZTogIW92ZXJ3cml0ZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY29weS1hc3NldCcsIHNvdXJjZSwgdGFyZ2V0LCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEFzc2V0IGNvcGllZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiByZXN1bHQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogcmVzdWx0Py51cmwgfHwgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBtb3ZlQXNzZXQoc291cmNlOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nLCBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBvdmVyd3JpdGU6IG92ZXJ3cml0ZSxcbiAgICAgICAgICAgICAgICByZW5hbWU6ICFvdmVyd3JpdGVcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ21vdmUtYXNzZXQnLCBzb3VyY2UsIHRhcmdldCwgb3B0aW9ucykudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBtb3ZlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiByZXN1bHQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogcmVzdWx0Py51cmwgfHwgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBkZWxldGVBc3NldCh1cmw6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZGVsZXRlLWFzc2V0JywgdXJsKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBkZWxldGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgdXJsIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlQXNzZXQodXJsOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnc2F2ZS1hc3NldCcsIHVybCwgY29udGVudCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBzYXZlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiByZXN1bHQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHJlc3VsdD8udXJsIHx8IHVybFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVpbXBvcnRBc3NldCh1cmw6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVpbXBvcnQtYXNzZXQnLCB1cmwpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEFzc2V0IHJlaW1wb3J0ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyB1cmwgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5QXNzZXRQYXRoKHVybDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgdXJsKS50aGVuKChwYXRoOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBwYXRoIHJldHJpZXZlZGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHVybCwgcGF0aCB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBc3NldCBwYXRoIG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5QXNzZXRVdWlkKHVybDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgdXJsKS50aGVuKCh1dWlkOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBc3NldCBVVUlEIHJldHJpZXZlZGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHVybCwgdXVpZCB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBc3NldCBVVUlEIG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5QXNzZXRVcmwodXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11cmwnLCB1dWlkKS50aGVuKCh1cmw6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDinIUgQXNzZXQgVVJMIHJldHJpZXZlZGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHV1aWQsIHVybCB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBc3NldCBVUkwgbm90IGZvdW5kJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZmluZEFzc2V0QnlOYW1lKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgZXhhY3RNYXRjaCA9IGZhbHNlLCBhc3NldFR5cGUgPSAnYWxsJywgZm9sZGVyID0gJ2RiOi8vYXNzZXRzJywgbWF4UmVzdWx0cyA9IDIwIH0gPSBhcmdzO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbEFzc2V0c1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXRBc3NldHMoYXNzZXRUeXBlLCBmb2xkZXIpO1xuICAgICAgICAgICAgICAgIGlmICghYWxsQXNzZXRzUmVzcG9uc2Uuc3VjY2VzcyB8fCAhYWxsQXNzZXRzUmVzcG9uc2UuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gZ2V0IGFzc2V0czogJHthbGxBc3NldHNSZXNwb25zZS5lcnJvcn1gXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IGFsbEFzc2V0cyA9IGFsbEFzc2V0c1Jlc3BvbnNlLmRhdGEuYXNzZXRzIGFzIGFueVtdO1xuICAgICAgICAgICAgICAgIGxldCBtYXRjaGVkQXNzZXRzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYXNzZXQgb2YgYWxsQXNzZXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0TmFtZSA9IGFzc2V0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXRjaGVzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoZXhhY3RNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcyA9IGFzc2V0TmFtZSA9PT0gbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBhc3NldE5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhuYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXRhaWxSZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0QXNzZXRJbmZvKGFzc2V0LnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXRhaWxSZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWRBc3NldHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5hc3NldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IGRldGFpbFJlc3BvbnNlLmRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZEFzc2V0cy5wdXNoKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkQXNzZXRzLnB1c2goYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlZEFzc2V0cy5sZW5ndGggPj0gbWF4UmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIEZvdW5kICR7bWF0Y2hlZEFzc2V0cy5sZW5ndGh9IGFzc2V0cyBtYXRjaGluZyAnJHtuYW1lfSdgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hUZXJtOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3RNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbGRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsRm91bmQ6IG1hdGNoZWRBc3NldHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0czogbWF0Y2hlZEFzc2V0c1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEFzc2V0IHNlYXJjaCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBwcml2YXRlIGFzeW5jIGdldEFzc2V0RGV0YWlscyhhc3NldFBhdGg6IHN0cmluZywgaW5jbHVkZVN1YkFzc2V0czogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldEFzc2V0SW5mbyhhc3NldFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXRJbmZvUmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0SW5mb1Jlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhc3NldEluZm9SZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbGVkSW5mbzogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5hc3NldEluZm8sXG4gICAgICAgICAgICAgICAgICAgIHN1YkFzc2V0czogW11cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlU3ViQXNzZXRzICYmIGFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvLnR5cGUgPT09ICdjYy5JbWFnZUFzc2V0JyB8fCBhc3NldFBhdGgubWF0Y2goL1xcLihwbmd8anBnfGpwZWd8Z2lmfHRnYXxibXB8cHNkKSQvaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2VVdWlkID0gYXNzZXRJbmZvLnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3NzaWJsZVN1YkFzc2V0cyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6ICdzcHJpdGVGcmFtZScsIHV1aWQ6IGAke2Jhc2VVdWlkfUBmOTk0MWAsIHN1ZmZpeDogJ0BmOTk0MScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6ICd0ZXh0dXJlJywgdXVpZDogYCR7YmFzZVV1aWR9QDZjNDhhYCwgc3VmZml4OiAnQDZjNDhhJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ3RleHR1cmUyRCcsIHV1aWQ6IGAke2Jhc2VVdWlkfUA2YzQ4YWAsIHN1ZmZpeDogJ0A2YzQ4YScgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJBc3NldCBvZiBwb3NzaWJsZVN1YkFzc2V0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YkFzc2V0VXJsID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXJsJywgc3ViQXNzZXQudXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJBc3NldFVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsZWRJbmZvLnN1YkFzc2V0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBzdWJBc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHN1YkFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzdWJBc3NldFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXg6IHN1YkFzc2V0LnN1ZmZpeFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3ViLWFzc2V0IGRvZXNuJ3QgZXhpc3QsIHNraXAgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDinIUgQXNzZXQgZGV0YWlscyByZXRyaWV2ZWQuIEZvdW5kICR7ZGV0YWlsZWRJbmZvLnN1YkFzc2V0cy5sZW5ndGh9IHN1Yi1hc3NldHNgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlU3ViQXNzZXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uZGV0YWlsZWRJbmZvXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGdldCBhc3NldCBkZXRhaWxzOiAke2Vycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59Il19
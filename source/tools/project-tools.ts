import { ToolDefinition, ToolResponse, ToolExecutor, ProjectInfo } from '../types';

export class ProjectTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'project_manage',
                description: 'PROJECT MANAGEMENT: Core project operations and configuration. COMMON WORKFLOWS: get_info for project details, run for preview testing, build for deployment preparation, get_settings for configuration inspection. Note: Build operations require manual interaction due to API limitations.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['run', 'build', 'get_info', 'get_settings'],
                            description: 'Project operation: "run" = start preview/testing (requires platform) | "build" = prepare for deployment (requires buildPlatform) | "get_info" = project metadata and paths | "get_settings" = configuration by category (requires category)'
                        },
                        // For run action
                        platform: {
                            type: 'string',
                            enum: ['browser', 'simulator', 'preview'],
                            description: 'Preview platform (run action). "browser" = web preview (most common), "simulator" = device simulation, "preview" = editor preview. Recommended: browser for quick testing.',
                            default: 'browser'
                        },
                        // For build action
                        buildPlatform: {
                            type: 'string',
                            enum: ['web-mobile', 'web-desktop', 'ios', 'android', 'windows', 'mac'],
                            description: 'Target deployment platform (REQUIRED for build action). "web-mobile" = mobile web, "web-desktop" = desktop web, "ios" = iPhone/iPad, "android" = Android devices, "windows" = Windows desktop, "mac" = macOS desktop.'
                        },
                        debug: {
                            type: 'boolean',
                            description: 'Build configuration (build action). true = development build with debug info and source maps (larger size, easier debugging), false = optimized production build (smaller size, harder debugging). Recommended: true for testing.',
                            default: true
                        },
                        // For get_settings action
                        category: {
                            type: 'string',
                            enum: ['general', 'physics', 'render', 'assets'],
                            description: 'Configuration category (get_settings action). "general" = basic project settings, "physics" = physics engine config, "render" = rendering settings, "assets" = asset processing. Default: general for basic info.',
                            default: 'general'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'project_build_system',
                description: 'BUILD SYSTEM: Control build panel, check builder status, and manage preview servers. Use this for build-related operations and preview management.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_build_settings', 'open_build_panel', 'check_builder_status', 'start_preview_server', 'stop_preview_server'],
                            description: 'Build system action to perform'
                        },
                        port: {
                            type: 'number',
                            description: 'Preview server port (start_preview_server action only)',
                            default: 7456
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'project_manage':
                return await this.handleProjectManage(args);
            case 'project_build_system':
                return await this.handleBuildSystem(args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    // New consolidated handlers
    private async handleProjectManage(args: any): Promise<ToolResponse> {
        const { action } = args;
        
        switch (action) {
            case 'run':
                return await this.runProject(args.platform);
            case 'build':
                return await this.buildProject({ platform: args.buildPlatform, debug: args.debug });
            case 'get_info':
                return await this.getProjectInfo();
            case 'get_settings':
                return await this.getProjectSettings(args.category);
            default:
                return { success: false, error: `Unknown project manage action: ${action}` };
        }
    }

    private async handleBuildSystem(args: any): Promise<ToolResponse> {
        const { action } = args;
        
        switch (action) {
            case 'get_build_settings':
                return await this.getBuildSettings();
            case 'open_build_panel':
                return await this.openBuildPanel();
            case 'check_builder_status':
                return await this.checkBuilderStatus();
            case 'start_preview_server':
                return await this.startPreviewServer(args.port);
            case 'stop_preview_server':
                return await this.stopPreviewServer();
            default:
                return { success: false, error: `Unknown build system action: ${action}` };
        }
    }

    // Original implementation methods
    private async runProject(platform: string = 'browser'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // Note: Preview module is not documented in official API
            // Using fallback approach - open build panel as alternative
            Editor.Message.request('builder', 'open').then(() => {
                resolve({
                    success: true,
                    message: `✅ Build panel opened. Preview functionality requires manual setup for ${platform}.`,
                    data: { 
                        platform,
                        instruction: "Use the build panel to configure and start preview manually"
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async buildProject(args: any): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const buildOptions = {
                platform: args.platform,
                debug: args.debug !== false,
                sourceMaps: args.debug !== false,
                buildPath: `build/${args.platform}`
            };

            // Note: Builder module only supports 'open' and 'query-worker-ready'
            // Building requires manual interaction through the build panel
            Editor.Message.request('builder', 'open').then(() => {
                resolve({
                    success: true,
                    message: `✅ Build panel opened for ${args.platform}. Please configure and start build manually.`,
                    data: { 
                        platform: args.platform,
                        debug: args.debug,
                        instruction: "Use the build panel to configure and start the build process",
                        buildOptions
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getProjectInfo(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const info: ProjectInfo = {
                name: Editor.Project.name,
                path: Editor.Project.path,
                uuid: Editor.Project.uuid,
                version: (Editor.Project as any).version || '1.0.0',
                cocosVersion: (Editor as any).versions?.cocos || 'Unknown'
            };

            // Note: 'query-info' API doesn't exist, using 'query-config' instead
            Editor.Message.request('project', 'query-config', 'project').then((additionalInfo: any) => {
                if (additionalInfo) {
                    Object.assign(info, { config: additionalInfo });
                }
                resolve({ 
                    success: true, 
                    message: `✅ Project info retrieved: ${info.name}`,
                    data: info 
                });
            }).catch(() => {
                // Return basic info even if detailed query fails
                resolve({ 
                    success: true, 
                    message: `✅ Basic project info retrieved: ${info.name}`,
                    data: info 
                });
            });
        });
    }

    private async getProjectSettings(category: string = 'general'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const configMap: Record<string, string> = {
                general: 'project',
                physics: 'physics',
                render: 'render',
                assets: 'asset-db'
            };

            const configName = configMap[category] || 'project';

            Editor.Message.request('project', 'query-config', configName).then((settings: any) => {
                resolve({
                    success: true,
                    message: `✅ ${category} settings retrieved successfully`,
                    data: {
                        category: category,
                        config: settings
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getBuildSettings(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'query-worker-ready').then((ready: boolean) => {
                resolve({
                    success: true,
                    message: `✅ Build settings status retrieved`,
                    data: {
                        builderReady: ready,
                        message: 'Build settings are limited in MCP plugin environment',
                        availableActions: [
                            'Open build panel with project_build_system action "open_build_panel"',
                            'Check builder status with project_build_system action "check_builder_status"',
                            'Start preview server with project_build_system action "start_preview_server"',
                            'Stop preview server with project_build_system action "stop_preview_server"'
                        ],
                        limitation: 'Full build configuration requires direct Editor UI access'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async openBuildPanel(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'open').then(() => {
                resolve({
                    success: true,
                    message: '✅ Build panel opened successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async checkBuilderStatus(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'query-worker-ready').then((ready: boolean) => {
                resolve({
                    success: true,
                    message: '✅ Builder status checked successfully',
                    data: {
                        ready: ready,
                        status: ready ? 'Builder worker is ready' : 'Builder worker is not ready'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async startPreviewServer(port: number = 7456): Promise<ToolResponse> {
        return new Promise((resolve) => {
            resolve({
                success: false,
                error: 'Preview server control is not supported through MCP API',
                instruction: 'Please start the preview server manually using the editor menu: Project > Preview, or use the preview panel in the editor',
                data: { requestedPort: port }
            });
        });
    }

    private async stopPreviewServer(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            resolve({
                success: false,
                error: 'Preview server control is not supported through MCP API',
                instruction: 'Please stop the preview server manually using the preview panel in the editor'
            });
        });
    }
}
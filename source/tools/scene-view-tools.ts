import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class SceneViewTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'scene_view_gizmo_management',
                description: 'GIZMO MANAGEMENT: Control scene manipulation tools and transformation handles. USAGE: Change between position/rotation/scale tools, switch coordinate systems (local/global), adjust pivot points. Essential for precise scene editing and object manipulation in the editor.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Gizmo operation to perform. Query actions get current state, change actions modify settings.',
                            enum: ['change_tool', 'query_tool', 'change_pivot', 'query_pivot', 'change_coordinate', 'query_coordinate', 'query_view_mode']
                        },
                        toolName: {
                            type: 'string',
                            description: 'Transformation tool type (REQUIRED for change_tool action). "position" = move objects, "rotation" = rotate objects, "scale" = resize objects, "rect" = 2D rect transform. Choose based on desired editing operation.',
                            enum: ['position', 'rotation', 'scale', 'rect']
                        },
                        pivotName: {
                            type: 'string',
                            description: 'Transform pivot point (REQUIRED for change_pivot action). "pivot" = use object\'s pivot point (local center), "center" = use geometric center (bounding box center). Affects rotation and scaling behavior.',
                            enum: ['pivot', 'center']
                        },
                        coordinateType: {
                            type: 'string',
                            description: 'Coordinate system reference (REQUIRED for change_coordinate action). "local" = relative to object\'s orientation, "global" = relative to world axes. Local useful for object-oriented editing, global for world-aligned operations.',
                            enum: ['local', 'global']
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'scene_view_mode_control',
                description: 'VIEW MODE CONTROL: Switch scene editor between 2D and 3D modes and control visual aids. USAGE: Toggle 2D/3D perspective for different editing contexts, show/hide grid for alignment reference. 2D mode for UI/sprite editing, 3D mode for 3D scene construction.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'View control operation. Change actions modify view state, query actions get current state.',
                            enum: ['change_2d_3d', 'query_2d_3d', 'set_grid', 'query_grid']
                        },
                        is2D: {
                            type: 'boolean',
                            description: 'View mode setting (REQUIRED for change_2d_3d action). true = 2D orthographic view (for UI, sprites, 2D games), false = 3D perspective view (for 3D scenes, spatial editing). Choose based on content type.'
                        },
                        gridVisible: {
                            type: 'boolean',
                            description: 'Grid display state (REQUIRED for set_grid action). true = show alignment grid (helpful for positioning), false = hide grid (cleaner view for final preview). Grid aids in precise object placement and alignment.'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'scene_view_icon_gizmo',
                description: 'ICON GIZMO CONTROL: Configure visual representation of scene nodes and components. USAGE: Adjust icon display mode (2D/3D) and size for better visibility. Useful for managing visual clutter and improving scene navigation when working with many objects.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Icon gizmo operation. Set actions modify appearance, query actions get current settings.',
                            enum: ['set_3d_mode', 'query_3d_mode', 'set_size', 'query_size']
                        },
                        is3D: {
                            type: 'boolean',
                            description: 'Icon display mode (REQUIRED for set_3d_mode action). true = 3D icons (spatial representation), false = 2D icons (flat representation). 3D mode for spatial awareness, 2D mode for reduced visual complexity.'
                        },
                        size: {
                            type: 'number',
                            description: 'Icon size scale (REQUIRED for set_size action). Range: 10-100. Smaller values = less visual noise, larger values = easier selection. Recommended: 20-30 for dense scenes, 40-60 for sparse scenes. Adjust based on scene complexity.',
                            minimum: 10,
                            maximum: 100
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'scene_view_camera_control',
                description: 'CAMERA CONTROL: Navigate and position the scene view camera for better editing workflow. USAGE: Focus on specific objects, align camera angles, and synchronize view positions. Essential for efficient scene navigation and precise editing of complex scenes.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Camera operation: "focus_on_nodes" = center view on specific nodes (requires nodeUuids) | "align_camera_with_view" = sync camera to current view | "align_view_with_node" = position view to match node orientation.',
                            enum: ['focus_on_nodes', 'align_camera_with_view', 'align_view_with_node']
                        },
                        nodeUuids: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Node UUIDs to focus on (REQUIRED for focus_on_nodes action). Array of node UUIDs to center in view. Use node_query to get UUIDs first. Examples: ["node-uuid-1", "node-uuid-2"]. Empty array [] focuses on all scene nodes. Format: array of UUID strings.'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'scene_view_status_management',
                description: 'STATUS MANAGEMENT: Monitor scene view configuration and restore default settings. USAGE: "get_status" for comprehensive view state information, "reset_view" to restore default camera position and settings. Useful for troubleshooting view issues and standardizing editor state.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Status operation: "get_status" = retrieve current scene view configuration and settings | "reset_view" = restore scene view to default camera position and settings (no parameters needed).',
                            enum: ['get_status', 'reset_view']
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'scene_view_gizmo_management':
                return await this.handleGizmoManagement(args);
            case 'scene_view_mode_control':
                return await this.handleViewModeControl(args);
            case 'scene_view_icon_gizmo':
                return await this.handleIconGizmo(args);
            case 'scene_view_camera_control':
                return await this.handleCameraControl(args);
            case 'scene_view_status_management':
                return await this.handleStatusManagement(args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handleGizmoManagement(args: any): Promise<ToolResponse> {
        const { action, toolName, pivotName, coordinateType } = args;

        switch (action) {
            case 'change_tool':
                if (!toolName) {
                    return { success: false, error: 'toolName is required for change_tool action' };
                }
                return await this.changeGizmoTool(toolName);
            case 'query_tool':
                return await this.queryGizmoToolName();
            case 'change_pivot':
                if (!pivotName) {
                    return { success: false, error: 'pivotName is required for change_pivot action' };
                }
                return await this.changeGizmoPivot(pivotName);
            case 'query_pivot':
                return await this.queryGizmoPivot();
            case 'change_coordinate':
                if (!coordinateType) {
                    return { success: false, error: 'coordinateType is required for change_coordinate action' };
                }
                return await this.changeGizmoCoordinate(coordinateType);
            case 'query_coordinate':
                return await this.queryGizmoCoordinate();
            case 'query_view_mode':
                return await this.queryGizmoViewMode();
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleViewModeControl(args: any): Promise<ToolResponse> {
        const { action, is2D, gridVisible } = args;

        switch (action) {
            case 'change_2d_3d':
                if (is2D === undefined) {
                    return { success: false, error: 'is2D is required for change_2d_3d action' };
                }
                return await this.changeViewMode2D3D(is2D);
            case 'query_2d_3d':
                return await this.queryViewMode2D3D();
            case 'set_grid':
                if (gridVisible === undefined) {
                    return { success: false, error: 'gridVisible is required for set_grid action' };
                }
                return await this.setGridVisible(gridVisible);
            case 'query_grid':
                return await this.queryGridVisible();
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleIconGizmo(args: any): Promise<ToolResponse> {
        const { action, is3D, size } = args;

        switch (action) {
            case 'set_3d_mode':
                if (is3D === undefined) {
                    return { success: false, error: 'is3D is required for set_3d_mode action' };
                }
                return await this.setIconGizmo3D(is3D);
            case 'query_3d_mode':
                return await this.queryIconGizmo3D();
            case 'set_size':
                if (size === undefined) {
                    return { success: false, error: 'size is required for set_size action' };
                }
                return await this.setIconGizmoSize(size);
            case 'query_size':
                return await this.queryIconGizmoSize();
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleCameraControl(args: any): Promise<ToolResponse> {
        const { action, nodeUuids } = args;

        switch (action) {
            case 'focus_on_nodes':
                return await this.focusCameraOnNodes(nodeUuids || []);
            case 'align_camera_with_view':
                return await this.alignCameraWithView();
            case 'align_view_with_node':
                return await this.alignViewWithNode();
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleStatusManagement(args: any): Promise<ToolResponse> {
        const { action } = args;

        switch (action) {
            case 'get_status':
                return await this.getSceneViewStatus();
            case 'reset_view':
                return await this.resetSceneView();
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    // Legacy tool support for backward compatibility
    async handleLegacyTools(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'change_gizmo_tool':
                return await this.changeGizmoTool(args.name);
            case 'query_gizmo_tool_name':
                return await this.queryGizmoToolName();
            case 'change_gizmo_pivot':
                return await this.changeGizmoPivot(args.name);
            case 'query_gizmo_pivot':
                return await this.queryGizmoPivot();
            case 'query_gizmo_view_mode':
                return await this.queryGizmoViewMode();
            case 'change_gizmo_coordinate':
                return await this.changeGizmoCoordinate(args.type);
            case 'query_gizmo_coordinate':
                return await this.queryGizmoCoordinate();
            case 'change_view_mode_2d_3d':
                return await this.changeViewMode2D3D(args.is2D);
            case 'query_view_mode_2d_3d':
                return await this.queryViewMode2D3D();
            case 'set_grid_visible':
                return await this.setGridVisible(args.visible);
            case 'query_grid_visible':
                return await this.queryGridVisible();
            case 'set_icon_gizmo_3d':
                return await this.setIconGizmo3D(args.is3D);
            case 'query_icon_gizmo_3d':
                return await this.queryIconGizmo3D();
            case 'set_icon_gizmo_size':
                return await this.setIconGizmoSize(args.size);
            case 'query_icon_gizmo_size':
                return await this.queryIconGizmoSize();
            case 'focus_camera_on_nodes':
                return await this.focusCameraOnNodes(args.uuids);
            case 'align_camera_with_view':
                return await this.alignCameraWithView();
            case 'align_view_with_node':
                return await this.alignViewWithNode();
            case 'get_scene_view_status':
                return await this.getSceneViewStatus();
            case 'reset_scene_view':
                return await this.resetSceneView();
            default:
                throw new Error(`Unknown legacy tool: ${toolName}`);
        }
    }

    // Private implementation methods
    private async changeGizmoTool(name: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'change-gizmo-tool', name).then(() => {
                resolve({
                    success: true,
                    message: `Gizmo tool changed to '${name}'`,
                    data: { toolName: name }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryGizmoToolName(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-gizmo-tool-name').then((toolName: string) => {
                resolve({
                    success: true,
                    data: {
                        currentTool: toolName,
                        message: `Current Gizmo tool: ${toolName}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async changeGizmoPivot(name: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'change-gizmo-pivot', name).then(() => {
                resolve({
                    success: true,
                    message: `Gizmo pivot changed to '${name}'`,
                    data: { pivotName: name }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryGizmoPivot(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-gizmo-pivot').then((pivotName: string) => {
                resolve({
                    success: true,
                    data: {
                        currentPivot: pivotName,
                        message: `Current Gizmo pivot: ${pivotName}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryGizmoViewMode(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-gizmo-view-mode').then((viewMode: string) => {
                resolve({
                    success: true,
                    data: {
                        viewMode: viewMode,
                        message: `Current view mode: ${viewMode}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async changeGizmoCoordinate(type: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'change-gizmo-coordinate', type).then(() => {
                resolve({
                    success: true,
                    message: `Coordinate system changed to '${type}'`,
                    data: { coordinateType: type }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryGizmoCoordinate(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-gizmo-coordinate').then((coordinate: string) => {
                resolve({
                    success: true,
                    data: {
                        coordinate: coordinate,
                        message: `Current coordinate system: ${coordinate}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async changeViewMode2D3D(is2D: boolean): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'change-is2D', is2D).then(() => {
                resolve({
                    success: true,
                    message: `View mode changed to ${is2D ? '2D' : '3D'}`,
                    data: { is2D: is2D, viewMode: is2D ? '2D' : '3D' }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryViewMode2D3D(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-is2D').then((is2D: boolean) => {
                resolve({
                    success: true,
                    data: {
                        is2D: is2D,
                        viewMode: is2D ? '2D' : '3D',
                        message: `Current view mode: ${is2D ? '2D' : '3D'}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setGridVisible(visible: boolean): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'set-grid-visible', visible).then(() => {
                resolve({
                    success: true,
                    message: `Grid ${visible ? 'shown' : 'hidden'}`,
                    data: { gridVisible: visible }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryGridVisible(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-is-grid-visible').then((visible: boolean) => {
                resolve({
                    success: true,
                    data: {
                        visible: visible,
                        message: `Grid is ${visible ? 'visible' : 'hidden'}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setIconGizmo3D(is3D: boolean): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'set-icon-gizmo-3d', is3D).then(() => {
                resolve({
                    success: true,
                    message: `IconGizmo set to ${is3D ? '3D' : '2D'} mode`,
                    data: { is3D: is3D, mode: is3D ? '3D' : '2D' }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryIconGizmo3D(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-is-icon-gizmo-3d').then((is3D: boolean) => {
                resolve({
                    success: true,
                    data: {
                        is3D: is3D,
                        mode: is3D ? '3D' : '2D',
                        message: `IconGizmo is in ${is3D ? '3D' : '2D'} mode`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setIconGizmoSize(size: number): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'set-icon-gizmo-size', size).then(() => {
                resolve({
                    success: true,
                    message: `IconGizmo size set to ${size}`,
                    data: { size: size }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryIconGizmoSize(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-icon-gizmo-size').then((size: number) => {
                resolve({
                    success: true,
                    data: {
                        size: size,
                        message: `IconGizmo size: ${size}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async focusCameraOnNodes(nodeUuids: string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'focus-camera', nodeUuids).then(() => {
                const message = nodeUuids.length === 0 ? 
                    'Camera focused on all nodes' : 
                    `Camera focused on ${nodeUuids.length} node(s)`;
                resolve({
                    success: true,
                    message: message,
                    data: { focusedNodes: nodeUuids }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async alignCameraWithView(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'align-with-view').then(() => {
                resolve({
                    success: true,
                    message: 'Scene camera aligned with current view'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async alignViewWithNode(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'align-view-with-node').then(() => {
                resolve({
                    success: true,
                    message: 'View aligned with selected node successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getSceneViewStatus(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Gather all view status information
                const [
                    gizmoTool,
                    gizmoPivot,
                    gizmoCoordinate,
                    viewMode2D3D,
                    gridVisible,
                    iconGizmo3D,
                    iconGizmoSize
                ] = await Promise.allSettled([
                    this.queryGizmoToolName(),
                    this.queryGizmoPivot(),
                    this.queryGizmoCoordinate(),
                    this.queryViewMode2D3D(),
                    this.queryGridVisible(),
                    this.queryIconGizmo3D(),
                    this.queryIconGizmoSize()
                ]);

                const status: any = {
                    timestamp: new Date().toISOString()
                };

                // Extract data from fulfilled promises
                if (gizmoTool.status === 'fulfilled' && gizmoTool.value.success) {
                    status.gizmoTool = gizmoTool.value.data.currentTool;
                }
                if (gizmoPivot.status === 'fulfilled' && gizmoPivot.value.success) {
                    status.gizmoPivot = gizmoPivot.value.data.currentPivot;
                }
                if (gizmoCoordinate.status === 'fulfilled' && gizmoCoordinate.value.success) {
                    status.coordinate = gizmoCoordinate.value.data.coordinate;
                }
                if (viewMode2D3D.status === 'fulfilled' && viewMode2D3D.value.success) {
                    status.is2D = viewMode2D3D.value.data.is2D;
                    status.viewMode = viewMode2D3D.value.data.viewMode;
                }
                if (gridVisible.status === 'fulfilled' && gridVisible.value.success) {
                    status.gridVisible = gridVisible.value.data.visible;
                }
                if (iconGizmo3D.status === 'fulfilled' && iconGizmo3D.value.success) {
                    status.iconGizmo3D = iconGizmo3D.value.data.is3D;
                }
                if (iconGizmoSize.status === 'fulfilled' && iconGizmoSize.value.success) {
                    status.iconGizmoSize = iconGizmoSize.value.data.size;
                }

                resolve({
                    success: true,
                    data: status,
                    message: 'Scene view status retrieved successfully'
                });

            } catch (err: any) {
                resolve({
                    success: false,
                    error: `Failed to get scene view status: ${err.message}`
                });
            }
        });
    }

    private async resetSceneView(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Reset scene view to default settings
                const resetActions = [
                    this.changeGizmoTool('position'),
                    this.changeGizmoPivot('pivot'),
                    this.changeGizmoCoordinate('local'),
                    this.changeViewMode2D3D(false), // 3D mode
                    this.setGridVisible(true),
                    this.setIconGizmo3D(true),
                    this.setIconGizmoSize(60)
                ];

                await Promise.all(resetActions);

                resolve({
                    success: true,
                    message: 'Scene view reset to default settings',
                    data: {
                        defaultSettings: {
                            gizmoTool: 'position',
                            gizmoPivot: 'pivot',
                            coordinate: 'local',
                            viewMode: '3D',
                            gridVisible: true,
                            iconGizmo3D: true,
                            iconGizmoSize: 60
                        }
                    }
                });

            } catch (err: any) {
                resolve({
                    success: false,
                    error: `Failed to reset scene view: ${err.message}`
                });
            }
        });
    }
}
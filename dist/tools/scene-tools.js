"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneTools = void 0;
class SceneTools {
    getTools() {
        return [
            // 1. Scene Management - Basic operations
            {
                name: 'scene_management',
                description: 'SCENE MANAGEMENT: Core scene operations for project workflow. COMMON TASKS: get_current for active scene info, get_list to see all scenes, open to switch scenes, save to persist changes, create for new scenes. WORKFLOW: Always save before switching scenes to avoid data loss.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_current', 'get_list', 'open', 'save', 'create', 'save_as', 'close'],
                            description: 'Scene operation: "get_current" = active scene details | "get_list" = all project scenes | "open" = switch to scene (requires scenePath) | "save" = save current changes | "create" = new scene file (requires sceneName+savePath) | "save_as" = copy scene (requires path) | "close" = close active scene'
                        },
                        // For open action
                        scenePath: {
                            type: 'string',
                            description: 'Scene file path to open (REQUIRED for open action). Use Cocos asset URLs. Examples: "db://assets/scenes/Game.scene", "db://assets/levels/Level1.scene". Get paths from get_list action first.'
                        },
                        // For create action
                        sceneName: {
                            type: 'string',
                            description: 'New scene name (REQUIRED for create action). Use descriptive names without extension. Examples: "MainMenu", "GameLevel1", "Settings". System adds .scene extension automatically.'
                        },
                        savePath: {
                            type: 'string',
                            description: 'Save location for new scene (REQUIRED for create action). Must include .scene extension. Examples: "db://assets/scenes/Tutorial.scene", "db://assets/levels/BossLevel.scene".'
                        },
                        // For save_as action
                        path: {
                            type: 'string',
                            description: 'Destination path for scene copy (REQUIRED for save_as action). Creates duplicate of current scene. Examples: "db://assets/scenes/GameBackup.scene", "db://assets/versions/v1_Game.scene".'
                        }
                    },
                    required: ['action']
                }
            },
            // 2. Scene Hierarchy - Get scene structure
            {
                name: 'scene_hierarchy',
                description: 'SCENE HIERARCHY: Get the complete hierarchy of current scene with optional component information. Use this to inspect scene structure.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeComponents: {
                            type: 'boolean',
                            description: 'Show component details in hierarchy output. true = full information including component types and properties (detailed but verbose), false = basic structure only (faster, cleaner output). Recommended: false for overview, true for analysis.',
                            default: false
                        }
                    }
                }
            },
            // 3. Scene Execution Control - Execute scripts and methods
            {
                name: 'scene_execution_control',
                description: 'EXECUTION CONTROL: Execute component methods, scene scripts, or restore prefab instances. Use this for running custom logic and managing prefab synchronization.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['execute_component_method', 'execute_scene_script', 'restore_prefab'],
                            description: 'Action: "execute_component_method" = call method on component | "execute_scene_script" = run scene plugin method | "restore_prefab" = sync prefab instance'
                        },
                        // For execute_component_method action
                        uuid: {
                            type: 'string',
                            description: 'Component UUID to execute method on (execute_component_method action only). Get from component tools.'
                        },
                        name: {
                            type: 'string',
                            description: 'Method name to execute. For execute_component_method: component method name. For execute_scene_script: plugin name'
                        },
                        method: {
                            type: 'string',
                            description: 'Script method name to call (execute_scene_script action only)'
                        },
                        args: {
                            type: 'array',
                            items: {},
                            description: 'Arguments to pass to the method. Each element will be passed as a parameter to the method call.',
                            default: []
                        },
                        // For restore_prefab action
                        nodeUuid: {
                            type: 'string',
                            description: 'Prefab instance node UUID (restore_prefab action only). The node that should be synchronized with its prefab.'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Prefab asset UUID (restore_prefab action only). The source prefab to restore from.'
                        }
                    },
                    required: ['action']
                }
            },
            // 4. Scene State Management - Snapshots and undo/redo
            {
                name: 'scene_state_management',
                description: 'STATE MANAGEMENT: Create snapshots, manage undo/redo operations, and control scene reload. Use this for version control and state tracking.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['create_snapshot', 'abort_snapshot', 'begin_undo', 'end_undo', 'cancel_undo', 'soft_reload'],
                            description: 'Action: "create_snapshot" = save scene state | "abort_snapshot" = cancel snapshot | "begin_undo" = start recording | "end_undo" = finish recording | "cancel_undo" = cancel recording | "soft_reload" = reload scene'
                        },
                        // For undo operations
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID to record for undo (begin_undo action only). Changes to this node will be tracked.'
                        },
                        undoId: {
                            type: 'string',
                            description: 'Undo recording ID from begin_undo operation (end_undo/cancel_undo actions only). Used to identify which recording to complete or cancel.'
                        }
                    },
                    required: ['action']
                }
            },
            // 5. Scene Query System - Scene status and information
            {
                name: 'scene_query_system',
                description: 'QUERY SYSTEM: Get scene status, available classes/components, and find nodes by asset usage. Use this for scene inspection and analysis.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['check_ready', 'check_dirty', 'list_classes', 'list_components', 'check_script', 'find_nodes_by_asset'],
                            description: 'Action: "check_ready" = is scene ready | "check_dirty" = has unsaved changes | "list_classes" = get registered classes | "list_components" = get available components | "check_script" = verify script exists | "find_nodes_by_asset" = find nodes using asset'
                        },
                        // For list_classes action
                        extends: {
                            type: 'string',
                            description: 'Filter classes that extend this base class (list_classes action only). Example: "cc.Component" shows all component classes'
                        },
                        // For check_script action
                        className: {
                            type: 'string',
                            description: 'Script class name to verify (check_script action only). Example: "PlayerController"'
                        },
                        // For find_nodes_by_asset action
                        assetUuid: {
                            type: 'string',
                            description: 'Asset UUID to search for usage (find_nodes_by_asset action only). Get UUID from asset tools.'
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'scene_management':
                return await this.handleSceneManagement(args);
            case 'scene_hierarchy':
                return await this.getSceneHierarchy(args.includeComponents);
            case 'scene_execution_control':
                return await this.handleExecutionControl(args);
            case 'scene_state_management':
                return await this.handleStateManagement(args);
            case 'scene_query_system':
                return await this.handleQuerySystem(args);
            default:
                // Handle legacy tool names for backward compatibility
                return await this.handleLegacyTools(toolName, args);
        }
    }
    async getCurrentScene() {
        return new Promise((resolve) => {
            // 直接使用 query-node-tree 来获取场景信息（这个方法已经验证可用）
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                if (tree && tree.uuid) {
                    resolve({
                        success: true,
                        data: {
                            name: tree.name || 'Current Scene',
                            uuid: tree.uuid,
                            type: tree.type || 'cc.Scene',
                            active: tree.active !== undefined ? tree.active : true,
                            nodeCount: tree.children ? tree.children.length : 0
                        }
                    });
                }
                else {
                    resolve({ success: false, error: 'No scene data available' });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'ben-cocos-mcp',
                    method: 'getCurrentSceneInfo',
                    args: []
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    async getSceneList() {
        return new Promise((resolve) => {
            // Note: query-assets API corrected with proper parameters
            Editor.Message.request('asset-db', 'query-assets', {
                pattern: 'db://assets/**/*.scene'
            }).then((results) => {
                const scenes = results.map(asset => ({
                    name: asset.name,
                    path: asset.url,
                    uuid: asset.uuid
                }));
                resolve({ success: true, data: scenes });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async openScene(scenePath) {
        return new Promise((resolve) => {
            // 首先获取场景的UUID
            Editor.Message.request('asset-db', 'query-uuid', scenePath).then((uuid) => {
                if (!uuid) {
                    throw new Error('Scene not found');
                }
                // 使用正确的 scene API 打开场景 (需要UUID)
                return Editor.Message.request('scene', 'open-scene', uuid);
            }).then(() => {
                resolve({ success: true, message: `Scene opened: ${scenePath}` });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async saveScene() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'save-scene').then(() => {
                resolve({ success: true, message: 'Scene saved successfully' });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async createScene(sceneName, savePath) {
        return new Promise((resolve) => {
            // 确保路径以.scene结尾
            const fullPath = savePath.endsWith('.scene') ? savePath : `${savePath}/${sceneName}.scene`;
            // 使用正确的Cocos Creator 3.8场景格式
            const sceneContent = JSON.stringify([
                {
                    "__type__": "cc.SceneAsset",
                    "_name": sceneName,
                    "_objFlags": 0,
                    "__editorExtras__": {},
                    "_native": "",
                    "scene": {
                        "__id__": 1
                    }
                },
                {
                    "__type__": "cc.Scene",
                    "_name": sceneName,
                    "_objFlags": 0,
                    "__editorExtras__": {},
                    "_parent": null,
                    "_children": [],
                    "_active": true,
                    "_components": [],
                    "_prefab": null,
                    "_lpos": {
                        "__type__": "cc.Vec3",
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "_lrot": {
                        "__type__": "cc.Quat",
                        "x": 0,
                        "y": 0,
                        "z": 0,
                        "w": 1
                    },
                    "_lscale": {
                        "__type__": "cc.Vec3",
                        "x": 1,
                        "y": 1,
                        "z": 1
                    },
                    "_mobility": 0,
                    "_layer": 1073741824,
                    "_euler": {
                        "__type__": "cc.Vec3",
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "autoReleaseAssets": false,
                    "_globals": {
                        "__id__": 2
                    },
                    "_id": "scene"
                },
                {
                    "__type__": "cc.SceneGlobals",
                    "ambient": {
                        "__id__": 3
                    },
                    "skybox": {
                        "__id__": 4
                    },
                    "fog": {
                        "__id__": 5
                    },
                    "octree": {
                        "__id__": 6
                    }
                },
                {
                    "__type__": "cc.AmbientInfo",
                    "_skyColorHDR": {
                        "__type__": "cc.Vec4",
                        "x": 0.2,
                        "y": 0.5,
                        "z": 0.8,
                        "w": 0.520833
                    },
                    "_skyColor": {
                        "__type__": "cc.Vec4",
                        "x": 0.2,
                        "y": 0.5,
                        "z": 0.8,
                        "w": 0.520833
                    },
                    "_skyIllumHDR": 20000,
                    "_skyIllum": 20000,
                    "_groundAlbedoHDR": {
                        "__type__": "cc.Vec4",
                        "x": 0.2,
                        "y": 0.2,
                        "z": 0.2,
                        "w": 1
                    },
                    "_groundAlbedo": {
                        "__type__": "cc.Vec4",
                        "x": 0.2,
                        "y": 0.2,
                        "z": 0.2,
                        "w": 1
                    }
                },
                {
                    "__type__": "cc.SkyboxInfo",
                    "_envLightingType": 0,
                    "_envmapHDR": null,
                    "_envmap": null,
                    "_envmapLodCount": 0,
                    "_diffuseMapHDR": null,
                    "_diffuseMap": null,
                    "_enabled": false,
                    "_useHDR": true,
                    "_editableMaterial": null,
                    "_reflectionHDR": null,
                    "_reflectionMap": null,
                    "_rotationAngle": 0
                },
                {
                    "__type__": "cc.FogInfo",
                    "_type": 0,
                    "_fogColor": {
                        "__type__": "cc.Color",
                        "r": 200,
                        "g": 200,
                        "b": 200,
                        "a": 255
                    },
                    "_enabled": false,
                    "_fogDensity": 0.3,
                    "_fogStart": 0.5,
                    "_fogEnd": 300,
                    "_fogAtten": 5,
                    "_fogTop": 1.5,
                    "_fogRange": 1.2,
                    "_accurate": false
                },
                {
                    "__type__": "cc.OctreeInfo",
                    "_enabled": false,
                    "_minPos": {
                        "__type__": "cc.Vec3",
                        "x": -1024,
                        "y": -1024,
                        "z": -1024
                    },
                    "_maxPos": {
                        "__type__": "cc.Vec3",
                        "x": 1024,
                        "y": 1024,
                        "z": 1024
                    },
                    "_depth": 8
                }
            ], null, 2);
            Editor.Message.request('asset-db', 'create-asset', fullPath, sceneContent).then((result) => {
                // Verify scene creation by checking if it exists
                this.getSceneList().then((sceneList) => {
                    var _a;
                    const createdScene = (_a = sceneList.data) === null || _a === void 0 ? void 0 : _a.find((scene) => scene.uuid === result.uuid);
                    resolve({
                        success: true,
                        data: {
                            uuid: result.uuid,
                            url: result.url,
                            name: sceneName,
                            message: `Scene '${sceneName}' created successfully`,
                            sceneVerified: !!createdScene
                        },
                        verificationData: createdScene
                    });
                }).catch(() => {
                    resolve({
                        success: true,
                        data: {
                            uuid: result.uuid,
                            url: result.url,
                            name: sceneName,
                            message: `Scene '${sceneName}' created successfully (verification failed)`
                        }
                    });
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getSceneHierarchy(includeComponents = false) {
        return new Promise((resolve) => {
            // 优先尝试使用 Editor API 查询场景节点树
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                if (tree) {
                    const hierarchy = this.buildHierarchy(tree, includeComponents);
                    resolve({
                        success: true,
                        data: hierarchy
                    });
                }
                else {
                    resolve({ success: false, error: 'No scene hierarchy available' });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'ben-cocos-mcp',
                    method: 'getSceneHierarchy',
                    args: [includeComponents]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    buildHierarchy(node, includeComponents) {
        const nodeInfo = {
            uuid: node.uuid,
            name: node.name,
            type: node.type,
            active: node.active,
            children: []
        };
        if (includeComponents && node.__comps__) {
            nodeInfo.components = node.__comps__.map((comp) => ({
                type: comp.__type__ || 'Unknown',
                enabled: comp.enabled !== undefined ? comp.enabled : true
            }));
        }
        if (node.children) {
            nodeInfo.children = node.children.map((child) => this.buildHierarchy(child, includeComponents));
        }
        return nodeInfo;
    }
    async saveSceneAs(path) {
        return new Promise((resolve) => {
            // save-as-scene API 不接受路径参数，会弹出对话框让用户选择
            Editor.Message.request('scene', 'save-as-scene').then(() => {
                resolve({
                    success: true,
                    data: {
                        path: path,
                        message: `Scene save-as dialog opened`
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async closeScene() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'close-scene').then(() => {
                resolve({
                    success: true,
                    message: 'Scene closed successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async executeComponentMethod(uuid, name, args) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'execute-component-method', {
                uuid: uuid,
                name: name,
                args: args
            }).then((result) => {
                resolve({
                    success: true,
                    data: result,
                    message: `Component method ${name} executed successfully`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async executeSceneScript(name, method, args) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'execute-scene-script', {
                name: name,
                method: method,
                args: args
            }).then((result) => {
                resolve({
                    success: true,
                    data: result,
                    message: `Scene script ${name}.${method} executed successfully`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async restorePrefab(nodeUuid, assetUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'restore-prefab', nodeUuid, assetUuid).then((result) => {
                resolve({ success: true, data: result });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async sceneSnapshot() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'snapshot').then((result) => {
                resolve({
                    success: true,
                    data: result,
                    message: 'Scene snapshot created successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async sceneSnapshotAbort() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'snapshot-abort').then(() => {
                resolve({ success: true, message: 'Scene snapshot aborted' });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async beginUndoRecording(nodeUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'begin-recording', nodeUuid).then((undoId) => {
                resolve({
                    success: true,
                    data: { undoId, nodeUuid },
                    message: `Undo recording started for node ${nodeUuid}`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async endUndoRecording(undoId) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'end-recording', undoId).then(() => {
                resolve({
                    success: true,
                    data: { undoId },
                    message: 'Undo recording ended successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async cancelUndoRecording(undoId) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'cancel-recording', undoId).then(() => {
                resolve({
                    success: true,
                    data: { undoId },
                    message: 'Undo recording cancelled successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async softReloadScene() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'soft-reload').then(() => {
                resolve({ success: true, message: 'Scene soft reloaded successfully' });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async querySceneReady() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-is-ready').then((result) => {
                resolve({ success: true, data: { isReady: result }, message: `Scene ready status: ${result}` });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async querySceneDirty() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-dirty').then((result) => {
                resolve({ success: true, data: { isDirty: result }, message: `Scene dirty status: ${result}` });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async querySceneClasses(extendsClass) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-classes', {}).then((result) => {
                // Filter by extends class if provided
                let classes = result;
                if (extendsClass) {
                    classes = result.filter((cls) => cls.extends === extendsClass);
                }
                resolve({
                    success: true,
                    data: { classes, total: classes.length },
                    message: `Found ${classes.length} classes${extendsClass ? ` extending ${extendsClass}` : ''}`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async querySceneComponents() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-components').then((result) => {
                resolve({
                    success: true,
                    data: { components: result, total: result.length },
                    message: `Found ${result.length} components in scene`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryComponentHasScript(className) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-component-has-script', className).then((result) => {
                resolve({
                    success: true,
                    data: { hasScript: result, className },
                    message: `Script ${className} ${result ? 'exists' : 'does not exist'} in component list`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryNodesByAssetUuid(assetUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-nodes-by-asset-uuid', assetUuid).then((result) => {
                resolve({
                    success: true,
                    data: { nodeUuids: result, assetUuid, count: result.length },
                    message: `Found ${result.length} nodes using asset ${assetUuid}`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    // New handler methods
    async handleSceneManagement(args) {
        const { action } = args;
        switch (action) {
            case 'get_current':
                return await this.getCurrentScene();
            case 'get_list':
                return await this.getSceneList();
            case 'open':
                return await this.openScene(args.scenePath);
            case 'save':
                return await this.saveScene();
            case 'create':
                return await this.createScene(args.sceneName, args.savePath);
            case 'save_as':
                return await this.saveSceneAs(args.path);
            case 'close':
                return await this.closeScene();
            default:
                return { success: false, error: `Unknown scene management action: ${action}` };
        }
    }
    async handleExecutionControl(args) {
        const { action } = args;
        switch (action) {
            case 'execute_component_method':
                return await this.executeComponentMethod(args.uuid, args.name, args.args);
            case 'execute_scene_script':
                return await this.executeSceneScript(args.name, args.method, args.args);
            case 'restore_prefab':
                return await this.restorePrefab(args.nodeUuid, args.assetUuid);
            default:
                return { success: false, error: `Unknown execution control action: ${action}` };
        }
    }
    async handleStateManagement(args) {
        const { action } = args;
        switch (action) {
            case 'create_snapshot':
                return await this.sceneSnapshot();
            case 'abort_snapshot':
                return await this.sceneSnapshotAbort();
            case 'begin_undo':
                return await this.beginUndoRecording(args.nodeUuid);
            case 'end_undo':
                return await this.endUndoRecording(args.undoId);
            case 'cancel_undo':
                return await this.cancelUndoRecording(args.undoId);
            case 'soft_reload':
                return await this.softReloadScene();
            default:
                return { success: false, error: `Unknown state management action: ${action}` };
        }
    }
    async handleQuerySystem(args) {
        const { action } = args;
        switch (action) {
            case 'check_ready':
                return await this.querySceneReady();
            case 'check_dirty':
                return await this.querySceneDirty();
            case 'list_classes':
                return await this.querySceneClasses(args.extends);
            case 'list_components':
                return await this.querySceneComponents();
            case 'check_script':
                return await this.queryComponentHasScript(args.className);
            case 'find_nodes_by_asset':
                return await this.queryNodesByAssetUuid(args.assetUuid);
            default:
                return { success: false, error: `Unknown query system action: ${action}` };
        }
    }
    // Legacy tool support for backward compatibility
    async handleLegacyTools(toolName, args) {
        switch (toolName) {
            case 'get_current_scene':
                return await this.getCurrentScene();
            case 'get_scene_list':
                return await this.getSceneList();
            case 'open_scene':
                return await this.openScene(args.scenePath);
            case 'save_scene':
                return await this.saveScene();
            case 'create_scene':
                return await this.createScene(args.sceneName, args.savePath);
            case 'save_scene_as':
                return await this.saveSceneAs(args.path);
            case 'close_scene':
                return await this.closeScene();
            case 'get_scene_hierarchy':
                return await this.getSceneHierarchy(args.includeComponents);
            case 'scene_execution_control':
                return await this.handleExecutionControl(args);
            case 'scene_state_management':
                return await this.handleStateManagement(args);
            case 'scene_query_system':
                return await this.handleQuerySystem(args);
            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    }
}
exports.SceneTools = SceneTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBYSxVQUFVO0lBQ25CLFFBQVE7UUFDSixPQUFPO1lBQ0gseUNBQXlDO1lBQ3pDO2dCQUNJLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFdBQVcsRUFBRSxxUkFBcVI7Z0JBQ2xTLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsTUFBTSxFQUFFOzRCQUNKLElBQUksRUFBRSxRQUFROzRCQUNkLElBQUksRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQzs0QkFDL0UsV0FBVyxFQUFFLDJTQUEyUzt5QkFDM1Q7d0JBQ0Qsa0JBQWtCO3dCQUNsQixTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLCtMQUErTDt5QkFDL007d0JBQ0Qsb0JBQW9CO3dCQUNwQixTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLG1MQUFtTDt5QkFDbk07d0JBQ0QsUUFBUSxFQUFFOzRCQUNOLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSwrS0FBK0s7eUJBQy9MO3dCQUNELHFCQUFxQjt3QkFDckIsSUFBSSxFQUFFOzRCQUNGLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSwyTEFBMkw7eUJBQzNNO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQztpQkFDdkI7YUFDSjtZQUVELDJDQUEyQztZQUMzQztnQkFDSSxJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixXQUFXLEVBQUUsd0lBQXdJO2dCQUNySixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFB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LE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRSxLQUFLLGVBQWU7Z0JBQ2hCLE9BQU8sTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxLQUFLLGFBQWE7Z0JBQ2QsT0FBTyxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNuQyxLQUFLLHFCQUFxQjtnQkFDdEIsT0FBTyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNoRSxLQUFLLHlCQUF5QjtnQkFDMUIsT0FBTyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRCxLQUFLLHdCQUF3QjtnQkFDekIsT0FBTyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxLQUFLLG9CQUFvQjtnQkFDckIsT0FBTyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QztnQkFDSSxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsaUJBQWlCLFFBQVEsRUFBRSxFQUFFLENBQUM7UUFDdEUsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQWwxQkQsZ0NBazFCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciwgU2NlbmVJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgU2NlbmVUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAvLyAxLiBTY2VuZSBNYW5hZ2VtZW50IC0gQmFzaWMgb3BlcmF0aW9uc1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzY2VuZV9tYW5hZ2VtZW50JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NDRU5FIE1BTkFHRU1FTlQ6IENvcmUgc2NlbmUgb3BlcmF0aW9ucyBmb3IgcHJvamVjdCB3b3JrZmxvdy4gQ09NTU9OIFRBU0tTOiBnZXRfY3VycmVudCBmb3IgYWN0aXZlIHNjZW5lIGluZm8sIGdldF9saXN0IHRvIHNlZSBhbGwgc2NlbmVzLCBvcGVuIHRvIHN3aXRjaCBzY2VuZXMsIHNhdmUgdG8gcGVyc2lzdCBjaGFuZ2VzLCBjcmVhdGUgZm9yIG5ldyBzY2VuZXMuIFdPUktGTE9XOiBBbHdheXMgc2F2ZSBiZWZvcmUgc3dpdGNoaW5nIHNjZW5lcyB0byBhdm9pZCBkYXRhIGxvc3MuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydnZXRfY3VycmVudCcsICdnZXRfbGlzdCcsICdvcGVuJywgJ3NhdmUnLCAnY3JlYXRlJywgJ3NhdmVfYXMnLCAnY2xvc2UnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NjZW5lIG9wZXJhdGlvbjogXCJnZXRfY3VycmVudFwiID0gYWN0aXZlIHNjZW5lIGRldGFpbHMgfCBcImdldF9saXN0XCIgPSBhbGwgcHJvamVjdCBzY2VuZXMgfCBcIm9wZW5cIiA9IHN3aXRjaCB0byBzY2VuZSAocmVxdWlyZXMgc2NlbmVQYXRoKSB8IFwic2F2ZVwiID0gc2F2ZSBjdXJyZW50IGNoYW5nZXMgfCBcImNyZWF0ZVwiID0gbmV3IHNjZW5lIGZpbGUgKHJlcXVpcmVzIHNjZW5lTmFtZStzYXZlUGF0aCkgfCBcInNhdmVfYXNcIiA9IGNvcHkgc2NlbmUgKHJlcXVpcmVzIHBhdGgpIHwgXCJjbG9zZVwiID0gY2xvc2UgYWN0aXZlIHNjZW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBvcGVuIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY2VuZSBmaWxlIHBhdGggdG8gb3BlbiAoUkVRVUlSRUQgZm9yIG9wZW4gYWN0aW9uKS4gVXNlIENvY29zIGFzc2V0IFVSTHMuIEV4YW1wbGVzOiBcImRiOi8vYXNzZXRzL3NjZW5lcy9HYW1lLnNjZW5lXCIsIFwiZGI6Ly9hc3NldHMvbGV2ZWxzL0xldmVsMS5zY2VuZVwiLiBHZXQgcGF0aHMgZnJvbSBnZXRfbGlzdCBhY3Rpb24gZmlyc3QuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBjcmVhdGUgYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2VuZU5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05ldyBzY2VuZSBuYW1lIChSRVFVSVJFRCBmb3IgY3JlYXRlIGFjdGlvbikuIFVzZSBkZXNjcmlwdGl2ZSBuYW1lcyB3aXRob3V0IGV4dGVuc2lvbi4gRXhhbXBsZXM6IFwiTWFpbk1lbnVcIiwgXCJHYW1lTGV2ZWwxXCIsIFwiU2V0dGluZ3NcIi4gU3lzdGVtIGFkZHMgLnNjZW5lIGV4dGVuc2lvbiBhdXRvbWF0aWNhbGx5LidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2F2ZSBsb2NhdGlvbiBmb3IgbmV3IHNjZW5lIChSRVFVSVJFRCBmb3IgY3JlYXRlIGFjdGlvbikuIE11c3QgaW5jbHVkZSAuc2NlbmUgZXh0ZW5zaW9uLiBFeGFtcGxlczogXCJkYjovL2Fzc2V0cy9zY2VuZXMvVHV0b3JpYWwuc2NlbmVcIiwgXCJkYjovL2Fzc2V0cy9sZXZlbHMvQm9zc0xldmVsLnNjZW5lXCIuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBzYXZlX2FzIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVzdGluYXRpb24gcGF0aCBmb3Igc2NlbmUgY29weSAoUkVRVUlSRUQgZm9yIHNhdmVfYXMgYWN0aW9uKS4gQ3JlYXRlcyBkdXBsaWNhdGUgb2YgY3VycmVudCBzY2VuZS4gRXhhbXBsZXM6IFwiZGI6Ly9hc3NldHMvc2NlbmVzL0dhbWVCYWNrdXAuc2NlbmVcIiwgXCJkYjovL2Fzc2V0cy92ZXJzaW9ucy92MV9HYW1lLnNjZW5lXCIuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIDIuIFNjZW5lIEhpZXJhcmNoeSAtIEdldCBzY2VuZSBzdHJ1Y3R1cmVcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2NlbmVfaGllcmFyY2h5JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NDRU5FIEhJRVJBUkNIWTogR2V0IHRoZSBjb21wbGV0ZSBoaWVyYXJjaHkgb2YgY3VycmVudCBzY2VuZSB3aXRoIG9wdGlvbmFsIGNvbXBvbmVudCBpbmZvcm1hdGlvbi4gVXNlIHRoaXMgdG8gaW5zcGVjdCBzY2VuZSBzdHJ1Y3R1cmUuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaG93IGNvbXBvbmVudCBkZXRhaWxzIGluIGhpZXJhcmNoeSBvdXRwdXQuIHRydWUgPSBmdWxsIGluZm9ybWF0aW9uIGluY2x1ZGluZyBjb21wb25lbnQgdHlwZXMgYW5kIHByb3BlcnRpZXMgKGRldGFpbGVkIGJ1dCB2ZXJib3NlKSwgZmFsc2UgPSBiYXNpYyBzdHJ1Y3R1cmUgb25seSAoZmFzdGVyLCBjbGVhbmVyIG91dHB1dCkuIFJlY29tbWVuZGVkOiBmYWxzZSBmb3Igb3ZlcnZpZXcsIHRydWUgZm9yIGFuYWx5c2lzLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIDMuIFNjZW5lIEV4ZWN1dGlvbiBDb250cm9sIC0gRXhlY3V0ZSBzY3JpcHRzIGFuZCBtZXRob2RzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NjZW5lX2V4ZWN1dGlvbl9jb250cm9sJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VYRUNVVElPTiBDT05UUk9MOiBFeGVjdXRlIGNvbXBvbmVudCBtZXRob2RzLCBzY2VuZSBzY3JpcHRzLCBvciByZXN0b3JlIHByZWZhYiBpbnN0YW5jZXMuIFVzZSB0aGlzIGZvciBydW5uaW5nIGN1c3RvbSBsb2dpYyBhbmQgbWFuYWdpbmcgcHJlZmFiIHN5bmNocm9uaXphdGlvbi4nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZCcsICdleGVjdXRlX3NjZW5lX3NjcmlwdCcsICdyZXN0b3JlX3ByZWZhYiddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uOiBcImV4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiID0gY2FsbCBtZXRob2Qgb24gY29tcG9uZW50IHwgXCJleGVjdXRlX3NjZW5lX3NjcmlwdFwiID0gcnVuIHNjZW5lIHBsdWdpbiBtZXRob2QgfCBcInJlc3RvcmVfcHJlZmFiXCIgPSBzeW5jIHByZWZhYiBpbnN0YW5jZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgZXhlY3V0ZV9jb21wb25lbnRfbWV0aG9kIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcG9uZW50IFVVSUQgdG8gZXhlY3V0ZSBtZXRob2Qgb24gKGV4ZWN1dGVfY29tcG9uZW50X21ldGhvZCBhY3Rpb24gb25seSkuIEdldCBmcm9tIGNvbXBvbmVudCB0b29scy4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWV0aG9kIG5hbWUgdG8gZXhlY3V0ZS4gRm9yIGV4ZWN1dGVfY29tcG9uZW50X21ldGhvZDogY29tcG9uZW50IG1ldGhvZCBuYW1lLiBGb3IgZXhlY3V0ZV9zY2VuZV9zY3JpcHQ6IHBsdWdpbiBuYW1lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2NyaXB0IG1ldGhvZCBuYW1lIHRvIGNhbGwgKGV4ZWN1dGVfc2NlbmVfc2NyaXB0IGFjdGlvbiBvbmx5KSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kLiBFYWNoIGVsZW1lbnQgd2lsbCBiZSBwYXNzZWQgYXMgYSBwYXJhbWV0ZXIgdG8gdGhlIG1ldGhvZCBjYWxsLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogW11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgcmVzdG9yZV9wcmVmYWIgYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGluc3RhbmNlIG5vZGUgVVVJRCAocmVzdG9yZV9wcmVmYWIgYWN0aW9uIG9ubHkpLiBUaGUgbm9kZSB0aGF0IHNob3VsZCBiZSBzeW5jaHJvbml6ZWQgd2l0aCBpdHMgcHJlZmFiLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBVVUlEIChyZXN0b3JlX3ByZWZhYiBhY3Rpb24gb25seSkuIFRoZSBzb3VyY2UgcHJlZmFiIHRvIHJlc3RvcmUgZnJvbS4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gNC4gU2NlbmUgU3RhdGUgTWFuYWdlbWVudCAtIFNuYXBzaG90cyBhbmQgdW5kby9yZWRvXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NjZW5lX3N0YXRlX21hbmFnZW1lbnQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU1RBVEUgTUFOQUdFTUVOVDogQ3JlYXRlIHNuYXBzaG90cywgbWFuYWdlIHVuZG8vcmVkbyBvcGVyYXRpb25zLCBhbmQgY29udHJvbCBzY2VuZSByZWxvYWQuIFVzZSB0aGlzIGZvciB2ZXJzaW9uIGNvbnRyb2wgYW5kIHN0YXRlIHRyYWNraW5nLicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnY3JlYXRlX3NuYXBzaG90JywgJ2Fib3J0X3NuYXBzaG90JywgJ2JlZ2luX3VuZG8nLCAnZW5kX3VuZG8nLCAnY2FuY2VsX3VuZG8nLCAnc29mdF9yZWxvYWQnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbjogXCJjcmVhdGVfc25hcHNob3RcIiA9IHNhdmUgc2NlbmUgc3RhdGUgfCBcImFib3J0X3NuYXBzaG90XCIgPSBjYW5jZWwgc25hcHNob3QgfCBcImJlZ2luX3VuZG9cIiA9IHN0YXJ0IHJlY29yZGluZyB8IFwiZW5kX3VuZG9cIiA9IGZpbmlzaCByZWNvcmRpbmcgfCBcImNhbmNlbF91bmRvXCIgPSBjYW5jZWwgcmVjb3JkaW5nIHwgXCJzb2Z0X3JlbG9hZFwiID0gcmVsb2FkIHNjZW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciB1bmRvIG9wZXJhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgdG8gcmVjb3JkIGZvciB1bmRvIChiZWdpbl91bmRvIGFjdGlvbiBvbmx5KS4gQ2hhbmdlcyB0byB0aGlzIG5vZGUgd2lsbCBiZSB0cmFja2VkLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmRvSWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VuZG8gcmVjb3JkaW5nIElEIGZyb20gYmVnaW5fdW5kbyBvcGVyYXRpb24gKGVuZF91bmRvL2NhbmNlbF91bmRvIGFjdGlvbnMgb25seSkuIFVzZWQgdG8gaWRlbnRpZnkgd2hpY2ggcmVjb3JkaW5nIHRvIGNvbXBsZXRlIG9yIGNhbmNlbC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gNS4gU2NlbmUgUXVlcnkgU3lzdGVtIC0gU2NlbmUgc3RhdHVzIGFuZCBpbmZvcm1hdGlvblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzY2VuZV9xdWVyeV9zeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUVVFUlkgU1lTVEVNOiBHZXQgc2NlbmUgc3RhdHVzLCBhdmFpbGFibGUgY2xhc3Nlcy9jb21wb25lbnRzLCBhbmQgZmluZCBub2RlcyBieSBhc3NldCB1c2FnZS4gVXNlIHRoaXMgZm9yIHNjZW5lIGluc3BlY3Rpb24gYW5kIGFuYWx5c2lzLicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnY2hlY2tfcmVhZHknLCAnY2hlY2tfZGlydHknLCAnbGlzdF9jbGFzc2VzJywgJ2xpc3RfY29tcG9uZW50cycsICdjaGVja19zY3JpcHQnLCAnZmluZF9ub2Rlc19ieV9hc3NldCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uOiBcImNoZWNrX3JlYWR5XCIgPSBpcyBzY2VuZSByZWFkeSB8IFwiY2hlY2tfZGlydHlcIiA9IGhhcyB1bnNhdmVkIGNoYW5nZXMgfCBcImxpc3RfY2xhc3Nlc1wiID0gZ2V0IHJlZ2lzdGVyZWQgY2xhc3NlcyB8IFwibGlzdF9jb21wb25lbnRzXCIgPSBnZXQgYXZhaWxhYmxlIGNvbXBvbmVudHMgfCBcImNoZWNrX3NjcmlwdFwiID0gdmVyaWZ5IHNjcmlwdCBleGlzdHMgfCBcImZpbmRfbm9kZXNfYnlfYXNzZXRcIiA9IGZpbmQgbm9kZXMgdXNpbmcgYXNzZXQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGxpc3RfY2xhc3NlcyBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbHRlciBjbGFzc2VzIHRoYXQgZXh0ZW5kIHRoaXMgYmFzZSBjbGFzcyAobGlzdF9jbGFzc2VzIGFjdGlvbiBvbmx5KS4gRXhhbXBsZTogXCJjYy5Db21wb25lbnRcIiBzaG93cyBhbGwgY29tcG9uZW50IGNsYXNzZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGNoZWNrX3NjcmlwdCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2NyaXB0IGNsYXNzIG5hbWUgdG8gdmVyaWZ5IChjaGVja19zY3JpcHQgYWN0aW9uIG9ubHkpLiBFeGFtcGxlOiBcIlBsYXllckNvbnRyb2xsZXJcIidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgZmluZF9ub2Rlc19ieV9hc3NldCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVVJRCB0byBzZWFyY2ggZm9yIHVzYWdlIChmaW5kX25vZGVzX2J5X2Fzc2V0IGFjdGlvbiBvbmx5KS4gR2V0IFVVSUQgZnJvbSBhc3NldCB0b29scy4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnc2NlbmVfbWFuYWdlbWVudCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlU2NlbmVNYW5hZ2VtZW50KGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnc2NlbmVfaGllcmFyY2h5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRTY2VuZUhpZXJhcmNoeShhcmdzLmluY2x1ZGVDb21wb25lbnRzKTtcbiAgICAgICAgICAgIGNhc2UgJ3NjZW5lX2V4ZWN1dGlvbl9jb250cm9sJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVFeGVjdXRpb25Db250cm9sKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnc2NlbmVfc3RhdGVfbWFuYWdlbWVudCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlU3RhdGVNYW5hZ2VtZW50KGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnc2NlbmVfcXVlcnlfc3lzdGVtJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVRdWVyeVN5c3RlbShhcmdzKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIGxlZ2FjeSB0b29sIG5hbWVzIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlTGVnYWN5VG9vbHModG9vbE5hbWUsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRDdXJyZW50U2NlbmUoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAvLyDnm7TmjqXkvb/nlKggcXVlcnktbm9kZS10cmVlIOadpeiOt+WPluWcuuaZr+S/oeaBr++8iOi/meS4quaWueazleW3sue7j+mqjOivgeWPr+eUqO+8iVxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJykudGhlbigodHJlZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWUgJiYgdHJlZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0cmVlLm5hbWUgfHwgJ0N1cnJlbnQgU2NlbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHRyZWUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0cmVlLnR5cGUgfHwgJ2NjLlNjZW5lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IHRyZWUuYWN0aXZlICE9PSB1bmRlZmluZWQgPyB0cmVlLmFjdGl2ZSA6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUNvdW50OiB0cmVlLmNoaWxkcmVuID8gdHJlZS5jaGlsZHJlbi5sZW5ndGggOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBzY2VuZSBkYXRhIGF2YWlsYWJsZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDlpIfnlKjmlrnmoYjvvJrkvb/nlKjlnLrmma/ohJrmnKxcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYmVuLWNvY29zLW1jcCcsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ2dldEN1cnJlbnRTY2VuZUluZm8nLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycjI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBEaXJlY3QgQVBJIGZhaWxlZDogJHtlcnIubWVzc2FnZX0sIFNjZW5lIHNjcmlwdCBmYWlsZWQ6ICR7ZXJyMi5tZXNzYWdlfWAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRTY2VuZUxpc3QoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAvLyBOb3RlOiBxdWVyeS1hc3NldHMgQVBJIGNvcnJlY3RlZCB3aXRoIHByb3BlciBwYXJhbWV0ZXJzXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldHMnLCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogJ2RiOi8vYXNzZXRzLyoqLyouc2NlbmUnXG4gICAgICAgICAgICB9KS50aGVuKChyZXN1bHRzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjZW5lczogU2NlbmVJbmZvW10gPSByZXN1bHRzLm1hcChhc3NldCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWRcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHNjZW5lcyB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuU2NlbmUoc2NlbmVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIOmmluWFiOiOt+WPluWcuuaZr+eahFVVSURcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBzY2VuZVBhdGgpLnRoZW4oKHV1aWQ6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTY2VuZSBub3QgZm91bmQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5L2/55So5q2j56Gu55qEIHNjZW5lIEFQSSDmiZPlvIDlnLrmma8gKOmcgOimgVVVSUQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ29wZW4tc2NlbmUnLCB1dWlkKTtcbiAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgU2NlbmUgb3BlbmVkOiAke3NjZW5lUGF0aH1gIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTY2VuZSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtc2NlbmUnKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ1NjZW5lIHNhdmVkIHN1Y2Nlc3NmdWxseScgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlU2NlbmUoc2NlbmVOYW1lOiBzdHJpbmcsIHNhdmVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIOehruS/nei3r+W+hOS7pS5zY2VuZee7k+WwvlxuICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBzYXZlUGF0aC5lbmRzV2l0aCgnLnNjZW5lJykgPyBzYXZlUGF0aCA6IGAke3NhdmVQYXRofS8ke3NjZW5lTmFtZX0uc2NlbmVgO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDkvb/nlKjmraPnoa7nmoRDb2NvcyBDcmVhdG9yIDMuOOWcuuaZr+agvOW8j1xuICAgICAgICAgICAgY29uc3Qgc2NlbmVDb250ZW50ID0gSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlNjZW5lQXNzZXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJfbmFtZVwiOiBzY2VuZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXG4gICAgICAgICAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgXCJfbmF0aXZlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NlbmVcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfX2lkX19cIjogMVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5TY2VuZVwiLFxuICAgICAgICAgICAgICAgICAgICBcIl9uYW1lXCI6IHNjZW5lTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgICAgICAgICBcIl9wYXJlbnRcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJfY2hpbGRyZW5cIjogW10sXG4gICAgICAgICAgICAgICAgICAgIFwiX2FjdGl2ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBcIl9jb21wb25lbnRzXCI6IFtdLFxuICAgICAgICAgICAgICAgICAgICBcIl9wcmVmYWJcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJfbHBvc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwielwiOiAwXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwiX2xyb3RcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlF1YXRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieFwiOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInpcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwid1wiOiAxXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwiX2xzY2FsZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlcIjogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwielwiOiAxXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwiX21vYmlsaXR5XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgIFwiX2xheWVyXCI6IDEwNzM3NDE4MjQsXG4gICAgICAgICAgICAgICAgICAgIFwiX2V1bGVyXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInhcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieVwiOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IDBcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvUmVsZWFzZUFzc2V0c1wiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJfZ2xvYmFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiAyXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwic2NlbmVcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuU2NlbmVHbG9iYWxzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYW1iaWVudFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiAzXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwic2t5Ym94XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IDRcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJmb2dcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfX2lkX19cIjogNVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcIm9jdHJlZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiA2XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLkFtYmllbnRJbmZvXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiX3NreUNvbG9ySERSXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWM0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInhcIjogMC4yLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IDAuNSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwielwiOiAwLjgsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndcIjogMC41MjA4MzNcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJfc2t5Q29sb3JcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieFwiOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlcIjogMC41LFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IDAuOCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwid1wiOiAwLjUyMDgzM1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcIl9za3lJbGx1bUhEUlwiOiAyMDAwMCxcbiAgICAgICAgICAgICAgICAgICAgXCJfc2t5SWxsdW1cIjogMjAwMDAsXG4gICAgICAgICAgICAgICAgICAgIFwiX2dyb3VuZEFsYmVkb0hEUlwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjNFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDAuMixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieVwiOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInpcIjogMC4yLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ3XCI6IDFcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJfZ3JvdW5kQWxiZWRvXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWM0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInhcIjogMC4yLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IDAuMixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwielwiOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndcIjogMVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Ta3lib3hJbmZvXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiX2VudkxpZ2h0aW5nVHlwZVwiOiAwLFxuICAgICAgICAgICAgICAgICAgICBcIl9lbnZtYXBIRFJcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJfZW52bWFwXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIFwiX2Vudm1hcExvZENvdW50XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgIFwiX2RpZmZ1c2VNYXBIRFJcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJfZGlmZnVzZU1hcFwiOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBcIl9lbmFibGVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcIl91c2VIRFJcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJfZWRpdGFibGVNYXRlcmlhbFwiOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBcIl9yZWZsZWN0aW9uSERSXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIFwiX3JlZmxlY3Rpb25NYXBcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJfcm90YXRpb25BbmdsZVwiOiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Gb2dJbmZvXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiX3R5cGVcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgXCJfZm9nQ29sb3JcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLkNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJcIjogMjAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJnXCI6IDIwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYlwiOiAyMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFcIjogMjU1XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwiX2VuYWJsZWRcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiX2ZvZ0RlbnNpdHlcIjogMC4zLFxuICAgICAgICAgICAgICAgICAgICBcIl9mb2dTdGFydFwiOiAwLjUsXG4gICAgICAgICAgICAgICAgICAgIFwiX2ZvZ0VuZFwiOiAzMDAsXG4gICAgICAgICAgICAgICAgICAgIFwiX2ZvZ0F0dGVuXCI6IDUsXG4gICAgICAgICAgICAgICAgICAgIFwiX2ZvZ1RvcFwiOiAxLjUsXG4gICAgICAgICAgICAgICAgICAgIFwiX2ZvZ1JhbmdlXCI6IDEuMixcbiAgICAgICAgICAgICAgICAgICAgXCJfYWNjdXJhdGVcIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLk9jdHJlZUluZm9cIixcbiAgICAgICAgICAgICAgICAgICAgXCJfZW5hYmxlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJfbWluUG9zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInhcIjogLTEwMjQsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlcIjogLTEwMjQsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInpcIjogLTEwMjRcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJfbWF4UG9zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInhcIjogMTAyNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieVwiOiAxMDI0LFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IDEwMjRcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJfZGVwdGhcIjogOFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sIG51bGwsIDIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCBmdWxsUGF0aCwgc2NlbmVDb250ZW50KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFZlcmlmeSBzY2VuZSBjcmVhdGlvbiBieSBjaGVja2luZyBpZiBpdCBleGlzdHNcbiAgICAgICAgICAgICAgICB0aGlzLmdldFNjZW5lTGlzdCgpLnRoZW4oKHNjZW5lTGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVkU2NlbmUgPSBzY2VuZUxpc3QuZGF0YT8uZmluZCgoc2NlbmU6IGFueSkgPT4gc2NlbmUudXVpZCA9PT0gcmVzdWx0LnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogcmVzdWx0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiByZXN1bHQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHNjZW5lTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU2NlbmUgJyR7c2NlbmVOYW1lfScgY3JlYXRlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lVmVyaWZpZWQ6ICEhY3JlYXRlZFNjZW5lXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uRGF0YTogY3JlYXRlZFNjZW5lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHJlc3VsdC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogcmVzdWx0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzY2VuZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFNjZW5lICcke3NjZW5lTmFtZX0nIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5ICh2ZXJpZmljYXRpb24gZmFpbGVkKWBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0U2NlbmVIaWVyYXJjaHkoaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8g5LyY5YWI5bCd6K+V5L2/55SoIEVkaXRvciBBUEkg5p+l6K+i5Zy65pmv6IqC54K55qCRXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKS50aGVuKCh0cmVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHJlZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSB0aGlzLmJ1aWxkSGllcmFyY2h5KHRyZWUsIGluY2x1ZGVDb21wb25lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogaGllcmFyY2h5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBzY2VuZSBoaWVyYXJjaHkgYXZhaWxhYmxlJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOWkh+eUqOaWueahiO+8muS9v+eUqOWcuuaZr+iEmuacrFxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdiZW4tY29jb3MtbWNwJyxcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnZ2V0U2NlbmVIaWVyYXJjaHknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbaW5jbHVkZUNvbXBvbmVudHNdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLXNjZW5lLXNjcmlwdCcsIG9wdGlvbnMpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyMjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYERpcmVjdCBBUEkgZmFpbGVkOiAke2Vyci5tZXNzYWdlfSwgU2NlbmUgc2NyaXB0IGZhaWxlZDogJHtlcnIyLm1lc3NhZ2V9YCB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGJ1aWxkSGllcmFyY2h5KG5vZGU6IGFueSwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBhbnkge1xuICAgICAgICBjb25zdCBub2RlSW5mbzogYW55ID0ge1xuICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cyAmJiBub2RlLl9fY29tcHNfXykge1xuICAgICAgICAgICAgbm9kZUluZm8uY29tcG9uZW50cyA9IG5vZGUuX19jb21wc19fLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgIHR5cGU6IGNvbXAuX190eXBlX18gfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZCAhPT0gdW5kZWZpbmVkID8gY29tcC5lbmFibGVkIDogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIG5vZGVJbmZvLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IFxuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRIaWVyYXJjaHkoY2hpbGQsIGluY2x1ZGVDb21wb25lbnRzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlSW5mbztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTY2VuZUFzKHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8gc2F2ZS1hcy1zY2VuZSBBUEkg5LiN5o6l5Y+X6Lev5b6E5Y+C5pWw77yM5Lya5by55Ye65a+56K+d5qGG6K6p55So5oi36YCJ5oupXG4gICAgICAgICAgICAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdzY2VuZScsICdzYXZlLWFzLXNjZW5lJykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU2NlbmUgc2F2ZS1hcyBkaWFsb2cgb3BlbmVkYFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY2xvc2VTY2VuZSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nsb3NlLXNjZW5lJykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTY2VuZSBjbG9zZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVDb21wb25lbnRNZXRob2QodXVpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLWNvbXBvbmVudC1tZXRob2QnLCB7XG4gICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgICAgICAgIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogcmVzdWx0LCBcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYENvbXBvbmVudCBtZXRob2QgJHtuYW1lfSBleGVjdXRlZCBzdWNjZXNzZnVsbHlgIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVTY2VuZVNjcmlwdChuYW1lOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICAgICAgICBhcmdzOiBhcmdzXG4gICAgICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHJlc3VsdCwgXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTY2VuZSBzY3JpcHQgJHtuYW1lfS4ke21ldGhvZH0gZXhlY3V0ZWQgc3VjY2Vzc2Z1bGx5YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXN0b3JlUHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcsIGFzc2V0VXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdzY2VuZScsICdyZXN0b3JlLXByZWZhYicsIG5vZGVVdWlkLCBhc3NldFV1aWQpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdCB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNuYXBzaG90KCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc25hcHNob3QnKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHJlc3VsdCwgXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTY2VuZSBzbmFwc2hvdCBjcmVhdGVkIHN1Y2Nlc3NmdWxseScgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2NlbmVTbmFwc2hvdEFib3J0KCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc25hcHNob3QtYWJvcnQnKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ1NjZW5lIHNuYXBzaG90IGFib3J0ZWQnIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGJlZ2luVW5kb1JlY29yZGluZyhub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdiZWdpbi1yZWNvcmRpbmcnLCBub2RlVXVpZCkudGhlbigodW5kb0lkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHVuZG9JZCwgbm9kZVV1aWQgfSwgXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBVbmRvIHJlY29yZGluZyBzdGFydGVkIGZvciBub2RlICR7bm9kZVV1aWR9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBlbmRVbmRvUmVjb3JkaW5nKHVuZG9JZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdlbmQtcmVjb3JkaW5nJywgdW5kb0lkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHVuZG9JZCB9LCBcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1VuZG8gcmVjb3JkaW5nIGVuZGVkIHN1Y2Nlc3NmdWxseScgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY2FuY2VsVW5kb1JlY29yZGluZyh1bmRvSWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2FuY2VsLXJlY29yZGluZycsIHVuZG9JZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyB1bmRvSWQgfSwgXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVbmRvIHJlY29yZGluZyBjYW5jZWxsZWQgc3VjY2Vzc2Z1bGx5JyBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzb2Z0UmVsb2FkU2NlbmUoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzb2Z0LXJlbG9hZCcpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnU2NlbmUgc29mdCByZWxvYWRlZCBzdWNjZXNzZnVsbHknIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5U2NlbmVSZWFkeSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWlzLXJlYWR5JykudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogeyBpc1JlYWR5OiByZXN1bHQgfSwgbWVzc2FnZTogYFNjZW5lIHJlYWR5IHN0YXR1czogJHtyZXN1bHR9YCB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeVNjZW5lRGlydHkoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1kaXJ0eScpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgaXNEaXJ0eTogcmVzdWx0IH0sIG1lc3NhZ2U6IGBTY2VuZSBkaXJ0eSBzdGF0dXM6ICR7cmVzdWx0fWAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlTY2VuZUNsYXNzZXMoZXh0ZW5kc0NsYXNzOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWNsYXNzZXMnLCB7fSkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBGaWx0ZXIgYnkgZXh0ZW5kcyBjbGFzcyBpZiBwcm92aWRlZFxuICAgICAgICAgICAgICAgIGxldCBjbGFzc2VzID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmIChleHRlbmRzQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NlcyA9IHJlc3VsdC5maWx0ZXIoKGNsczogYW55KSA9PiBjbHMuZXh0ZW5kcyA9PT0gZXh0ZW5kc0NsYXNzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBjbGFzc2VzLCB0b3RhbDogY2xhc3Nlcy5sZW5ndGggfSwgXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBGb3VuZCAke2NsYXNzZXMubGVuZ3RofSBjbGFzc2VzJHtleHRlbmRzQ2xhc3MgPyBgIGV4dGVuZGluZyAke2V4dGVuZHNDbGFzc31gIDogJyd9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeVNjZW5lQ29tcG9uZW50cygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWNvbXBvbmVudHMnKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgY29tcG9uZW50czogcmVzdWx0LCB0b3RhbDogcmVzdWx0Lmxlbmd0aCB9LCBcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEZvdW5kICR7cmVzdWx0Lmxlbmd0aH0gY29tcG9uZW50cyBpbiBzY2VuZWAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlDb21wb25lbnRIYXNTY3JpcHQoY2xhc3NOYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWNvbXBvbmVudC1oYXMtc2NyaXB0JywgY2xhc3NOYW1lKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgaGFzU2NyaXB0OiByZXN1bHQsIGNsYXNzTmFtZSB9LCBcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFNjcmlwdCAke2NsYXNzTmFtZX0gJHtyZXN1bHQgPyAnZXhpc3RzJyA6ICdkb2VzIG5vdCBleGlzdCd9IGluIGNvbXBvbmVudCBsaXN0YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeU5vZGVzQnlBc3NldFV1aWQoYXNzZXRVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGVzLWJ5LWFzc2V0LXV1aWQnLCBhc3NldFV1aWQpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBub2RlVXVpZHM6IHJlc3VsdCwgYXNzZXRVdWlkLCBjb3VudDogcmVzdWx0Lmxlbmd0aCB9LCBcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEZvdW5kICR7cmVzdWx0Lmxlbmd0aH0gbm9kZXMgdXNpbmcgYXNzZXQgJHthc3NldFV1aWR9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTmV3IGhhbmRsZXIgbWV0aG9kc1xuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlU2NlbmVNYW5hZ2VtZW50KGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHsgYWN0aW9uIH0gPSBhcmdzO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9jdXJyZW50JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRDdXJyZW50U2NlbmUoKTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9saXN0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRTY2VuZUxpc3QoKTtcbiAgICAgICAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm9wZW5TY2VuZShhcmdzLnNjZW5lUGF0aCk7XG4gICAgICAgICAgICBjYXNlICdzYXZlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zYXZlU2NlbmUoKTtcbiAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlU2NlbmUoYXJncy5zY2VuZU5hbWUsIGFyZ3Muc2F2ZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9hcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZVNjZW5lQXMoYXJncy5wYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jbG9zZVNjZW5lKCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gc2NlbmUgbWFuYWdlbWVudCBhY3Rpb246ICR7YWN0aW9ufWAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlRXhlY3V0aW9uQ29udHJvbChhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdleGVjdXRlX2NvbXBvbmVudF9tZXRob2QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGVDb21wb25lbnRNZXRob2QoYXJncy51dWlkLCBhcmdzLm5hbWUsIGFyZ3MuYXJncyk7XG4gICAgICAgICAgICBjYXNlICdleGVjdXRlX3NjZW5lX3NjcmlwdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZVNjZW5lU2NyaXB0KGFyZ3MubmFtZSwgYXJncy5tZXRob2QsIGFyZ3MuYXJncyk7XG4gICAgICAgICAgICBjYXNlICdyZXN0b3JlX3ByZWZhYic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVzdG9yZVByZWZhYihhcmdzLm5vZGVVdWlkLCBhcmdzLmFzc2V0VXVpZCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gZXhlY3V0aW9uIGNvbnRyb2wgYWN0aW9uOiAke2FjdGlvbn1gIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVN0YXRlTWFuYWdlbWVudChhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdjcmVhdGVfc25hcHNob3QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNjZW5lU25hcHNob3QoKTtcbiAgICAgICAgICAgIGNhc2UgJ2Fib3J0X3NuYXBzaG90JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zY2VuZVNuYXBzaG90QWJvcnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ2JlZ2luX3VuZG8nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmJlZ2luVW5kb1JlY29yZGluZyhhcmdzLm5vZGVVdWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ2VuZF91bmRvJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmRVbmRvUmVjb3JkaW5nKGFyZ3MudW5kb0lkKTtcbiAgICAgICAgICAgIGNhc2UgJ2NhbmNlbF91bmRvJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jYW5jZWxVbmRvUmVjb3JkaW5nKGFyZ3MudW5kb0lkKTtcbiAgICAgICAgICAgIGNhc2UgJ3NvZnRfcmVsb2FkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zb2Z0UmVsb2FkU2NlbmUoKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBzdGF0ZSBtYW5hZ2VtZW50IGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVRdWVyeVN5c3RlbShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdjaGVja19yZWFkeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlTY2VuZVJlYWR5KCk7XG4gICAgICAgICAgICBjYXNlICdjaGVja19kaXJ0eSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlTY2VuZURpcnR5KCk7XG4gICAgICAgICAgICBjYXNlICdsaXN0X2NsYXNzZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5U2NlbmVDbGFzc2VzKGFyZ3MuZXh0ZW5kcyk7XG4gICAgICAgICAgICBjYXNlICdsaXN0X2NvbXBvbmVudHMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5U2NlbmVDb21wb25lbnRzKCk7XG4gICAgICAgICAgICBjYXNlICdjaGVja19zY3JpcHQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5Q29tcG9uZW50SGFzU2NyaXB0KGFyZ3MuY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIGNhc2UgJ2ZpbmRfbm9kZXNfYnlfYXNzZXQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5Tm9kZXNCeUFzc2V0VXVpZChhcmdzLmFzc2V0VXVpZCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gcXVlcnkgc3lzdGVtIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTGVnYWN5IHRvb2wgc3VwcG9ydCBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTGVnYWN5VG9vbHModG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnZ2V0X2N1cnJlbnRfc2NlbmUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEN1cnJlbnRTY2VuZSgpO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X3NjZW5lX2xpc3QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFNjZW5lTGlzdCgpO1xuICAgICAgICAgICAgY2FzZSAnb3Blbl9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMub3BlblNjZW5lKGFyZ3Muc2NlbmVQYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ3NhdmVfc2NlbmUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNhdmVTY2VuZSgpO1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlX3NjZW5lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVTY2VuZShhcmdzLnNjZW5lTmFtZSwgYXJncy5zYXZlUGF0aCk7XG4gICAgICAgICAgICBjYXNlICdzYXZlX3NjZW5lX2FzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zYXZlU2NlbmVBcyhhcmdzLnBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnY2xvc2Vfc2NlbmUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNsb3NlU2NlbmUoKTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9zY2VuZV9oaWVyYXJjaHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFNjZW5lSGllcmFyY2h5KGFyZ3MuaW5jbHVkZUNvbXBvbmVudHMpO1xuICAgICAgICAgICAgY2FzZSAnc2NlbmVfZXhlY3V0aW9uX2NvbnRyb2wnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUV4ZWN1dGlvbkNvbnRyb2woYXJncyk7XG4gICAgICAgICAgICBjYXNlICdzY2VuZV9zdGF0ZV9tYW5hZ2VtZW50JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVTdGF0ZU1hbmFnZW1lbnQoYXJncyk7XG4gICAgICAgICAgICBjYXNlICdzY2VuZV9xdWVyeV9zeXN0ZW0nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZVF1ZXJ5U3lzdGVtKGFyZ3MpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCB9O1xuICAgICAgICB9XG4gICAgfVxufVxuIl19
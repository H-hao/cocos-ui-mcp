"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTools = void 0;
const component_tools_1 = require("./component-tools");
class NodeTools {
    constructor() {
        this.componentTools = new component_tools_1.ComponentTools();
    }
    getTools() {
        return [
            // 1. Node Query - Search and information
            {
                name: 'node_query',
                description: 'NODE SEARCH & INFORMATION: Essential tool for finding and inspecting scene nodes. CRITICAL WORKFLOW: Always use this FIRST to get node UUIDs before any modifications. Use "find" for partial name search, "find_by_name" for exact match, "info" for detailed node data, "list_all" to see entire scene structure.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['info', 'find', 'find_by_name', 'list_all', 'detect_type', 'tree'],
                            description: 'Search/query operation: "info" = get complete node details (requires uuid) | "find" = search by partial name match (requires pattern) | "find_by_name" = find exact name (requires name) | "list_all" = get all scene nodes | "detect_type" = determine 2D/3D type (requires uuid) | "tree" = get hierarchical structure (optional uuid for subtree)'
                        },
                        uuid: {
                            type: 'string',
                            description: 'Target node UUID (REQUIRED for info/detect_type actions). For tree action: root node UUID (optional, defaults to scene root). IMPORTANT: Get UUID from find/find_by_name/list_all first! Format: "12345678-abcd-1234-5678-123456789abc"'
                        },
                        pattern: {
                            type: 'string',
                            description: 'Name search pattern (REQUIRED for find action). Supports partial matching. Examples: "Player" finds "Player", "PlayerController", "EnemyPlayer". Case-insensitive unless exactMatch=true.'
                        },
                        name: {
                            type: 'string',
                            description: 'Exact node name (REQUIRED for find_by_name action). Must match perfectly including case and spaces. Examples: "MainCamera", "UI Root", "Background Image". Use find action for partial matches.'
                        },
                        exactMatch: {
                            type: 'boolean',
                            description: 'Match mode for find action. false (default) = partial matching ("btn" finds "btnClose", "submitBtn"), true = exact matching ("btn" finds only "btn"). Recommended: false for discovery, true for precision.',
                            default: false
                        },
                        maxDepth: {
                            type: 'number',
                            description: 'Maximum tree depth to traverse. Use with action="tree". Controls how deep to traverse the node hierarchy.',
                            default: 10,
                            minimum: 1,
                            maximum: 20
                        }
                    },
                    required: ['action']
                }
            },
            // 2. Node Lifecycle - Create and delete
            {
                name: 'node_lifecycle',
                description: 'NODE CREATION & DELETION: Create new nodes or delete existing ones. CRITICAL WORKFLOW for create: 1) Use node_query to find parent UUID, 2) Provide parentUuid (scene root if omitted), 3) Add components or instantiate from prefab. Delete only needs node UUID.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['create', 'delete'],
                            description: 'Lifecycle operation: "create" = add new node to scene (requires name, optional parentUuid/components/assetPath) | "delete" = remove node from scene (requires uuid from node_query)'
                        },
                        // Create parameters
                        name: {
                            type: 'string',
                            description: 'Node name (REQUIRED for create action). Choose descriptive names. Examples: "PlayerSprite" for game character, "MainMenuButton" for UI element, "BackgroundMusic" for audio node.'
                        },
                        parentUuid: {
                            type: 'string',
                            description: 'Parent node UUID for new node placement (create action). WORKFLOW: Use node_query to find parent UUID first. If omitted, creates under scene root. Examples: Canvas UUID for UI elements, Scene root UUID for game objects.'
                        },
                        nodeType: {
                            type: 'string',
                            enum: ['Node', '2DNode', '3DNode'],
                            description: 'Node type (for create)',
                            default: 'Node'
                        },
                        components: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Component types to attach (create action). Common combinations: ["cc.Sprite"] for images, ["cc.Label"] for text, ["cc.Button", "cc.Sprite"] for clickable images. Format: ["cc.ComponentName"]'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Prefab asset UUID for instantiation (create action). Use asset_query to find prefab UUID first. Creates complete prefab instance with all children and components. Alternative to components parameter.'
                        },
                        assetPath: {
                            type: 'string',
                            description: 'Prefab asset path for instantiation (create action). Alternative to assetUuid. Examples: "db://assets/prefabs/Player.prefab", "db://assets/ui/MenuPanel.prefab". System resolves path to UUID automatically.'
                        },
                        unlinkPrefab: {
                            type: 'boolean',
                            description: 'Unlink from prefab after creation',
                            default: false
                        },
                        initialTransform: {
                            type: 'object',
                            properties: {
                                position: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                },
                                rotation: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                },
                                scale: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                }
                            },
                            description: 'Initial transform (for create)'
                        },
                        // Delete parameters
                        uuid: {
                            type: 'string',
                            description: 'Target node UUID for deletion (REQUIRED for delete action). WORKFLOW: Use node_query to find UUID first. WARNING: Deletes node and all children permanently. Format: "12345678-abcd-1234-5678-123456789abc"'
                        }
                    },
                    required: ['action']
                }
            },
            // 3. Node Transform - Properties and transformation
            {
                name: 'node_transform',
                description: 'MODIFY NODE PROPERTIES: Use this to change node name, visibility, position, rotation, scale, or other properties. Automatically handles 2D/3D differences. ALWAYS provide uuid (get from node_query first).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'REQUIRED: UUID of node to modify. Get this from node_query first! Without UUID, cannot modify node.'
                        },
                        name: {
                            type: 'string',
                            description: 'Change node name. Example: "PlayerSprite" → "EnemySprite"'
                        },
                        active: {
                            type: 'boolean',
                            description: 'Show/hide node. true = visible, false = hidden. Hidden nodes and their children don\'t render'
                        },
                        layer: {
                            type: 'number',
                            description: 'Node layer'
                        },
                        mobility: {
                            type: 'number',
                            description: 'Node mobility setting'
                        },
                        position: {
                            type: 'object',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number', description: 'Z coordinate (ignored for 2D nodes)' }
                            },
                            description: 'Set node position {x, y, z}. For 2D nodes: only x,y matter (z auto-set to 0). Example: {x: 100, y: 200}'
                        },
                        rotation: {
                            type: 'object',
                            properties: {
                                x: { type: 'number', description: 'X rotation (ignored for 2D nodes)' },
                                y: { type: 'number', description: 'Y rotation (ignored for 2D nodes)' },
                                z: { type: 'number', description: 'Z rotation (main axis for 2D nodes)' }
                            },
                            description: 'Set node rotation {x, y, z} in degrees. For 2D nodes: only z matters (x,y ignored). Example 2D: {z: 45}, 3D: {x: 30, y: 45, z: 0}'
                        },
                        scale: {
                            type: 'object',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number', description: 'Z scale (usually 1 for 2D nodes)' }
                            },
                            description: 'Set node scale {x, y, z}. For 2D nodes: z typically stays 1. Example: {x: 2, y: 2} doubles size'
                        },
                        customProperties: {
                            type: 'object',
                            description: 'Other properties as key-value pairs'
                        }
                    },
                    required: ['uuid']
                }
            },
            // 4. Node Hierarchy - Parent-child operations
            {
                name: 'node_hierarchy',
                description: 'MOVE OR COPY NODES: Use this to change node parent (move in hierarchy) or duplicate nodes. For move: changes which node is the parent. For duplicate: creates a copy of the node.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['move', 'duplicate'],
                            description: 'Choose action: "move" = change node\'s parent | "duplicate" = create a copy of node'
                        },
                        // Move parameters
                        nodeUuid: {
                            type: 'string',
                            description: 'UUID of node to move. Use with action="move". Get UUID from node_query first!'
                        },
                        newParentUuid: {
                            type: 'string',
                            description: 'UUID of new parent node. Use with action="move". The node will become a child of this parent'
                        },
                        siblingIndex: {
                            type: 'number',
                            description: 'Sibling index in new parent',
                            default: -1
                        },
                        // Duplicate parameters
                        uuid: {
                            type: 'string',
                            description: 'UUID of node to copy. Use with action="duplicate". Creates an exact copy with new UUID'
                        },
                        includeChildren: {
                            type: 'boolean',
                            description: 'Include children when duplicating',
                            default: true
                        }
                    },
                    required: ['action']
                }
            },
            // 5. Node Clipboard Operations - Copy, paste, cut
            {
                name: 'node_clipboard',
                description: 'CLIPBOARD OPERATIONS: Copy, paste, cut nodes and manage node clipboard operations. Use this for duplicating and moving nodes within the scene hierarchy.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['copy', 'paste', 'cut'],
                            description: 'Action: "copy" = copy nodes to clipboard | "paste" = paste nodes from clipboard to target parent | "cut" = cut nodes (copy + mark for move)'
                        },
                        // For copy and cut actions
                        uuids: {
                            type: ['string', 'array'],
                            items: { type: 'string' },
                            description: 'Node UUID(s) to copy or cut. Can be a single string UUID or array of UUIDs. Get UUIDs from node_query tool first!'
                        },
                        // For paste action
                        target: {
                            type: 'string',
                            description: 'Target parent node UUID for paste operation. The copied/cut nodes will become children of this node.'
                        },
                        keepWorldTransform: {
                            type: 'boolean',
                            description: 'Preserve world coordinates when pasting (paste action only). true = keep world position, false = use local position',
                            default: false
                        }
                    },
                    required: ['action']
                }
            },
            // 6. Node Property Management - Reset properties
            {
                name: 'node_property_management',
                description: 'PROPERTY MANAGEMENT: Reset node properties, transform values, or component settings to defaults. Use this to restore original values and clean up modifications.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['reset_property', 'reset_transform', 'reset_component'],
                            description: 'Action: "reset_property" = reset specific node property | "reset_transform" = reset position/rotation/scale | "reset_component" = reset component to defaults'
                        },
                        // For reset_property and reset_transform actions
                        uuid: {
                            type: 'string',
                            description: 'Node UUID for reset_property/reset_transform actions, or Component UUID for reset_component action. Get UUID from appropriate query tools.'
                        },
                        // For reset_property action only
                        path: {
                            type: 'string',
                            description: 'Property path to reset (reset_property action only). Examples: "position", "rotation", "scale", "active", "layer"'
                        }
                    },
                    required: ['action', 'uuid']
                }
            },
            // 7. Node Array Management - Move or remove array elements
            {
                name: 'node_array_management',
                description: 'ARRAY MANAGEMENT: Move or remove elements in node array properties like component lists. Use this for reordering components or removing array items.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['move_element', 'remove_element'],
                            description: 'Action: "move_element" = change array element position | "remove_element" = delete array element at index'
                        },
                        uuid: {
                            type: 'string',
                            description: 'Node UUID that contains the array property. Get UUID from node_query tool.'
                        },
                        path: {
                            type: 'string',
                            description: 'Array property path. Common examples: "__comps__" (components), "children" (child nodes)'
                        },
                        index: {
                            type: 'number',
                            description: 'Target array index to operate on. 0-based indexing (remove_element action only)'
                        },
                        // For move_element action
                        target: {
                            type: 'number',
                            description: 'Original index of element to move (move_element action only)'
                        },
                        offset: {
                            type: 'number',
                            description: 'Position offset to move by (move_element action only). Positive = move down, negative = move up'
                        }
                    },
                    required: ['action', 'uuid', 'path']
                }
            },
            // 8. Node Script Management - Attach/remove custom scripts
            {
                name: 'node_script_management',
                description: 'NODE SCRIPT MANAGEMENT: Attach or remove custom TypeScript/JavaScript components to/from nodes. WORKFLOW: 1) Use \"attach\" with scriptPath for new scripts, 2) Use component_query from component-tools to see attached scripts, 3) Use \"remove\" with scriptCid to detach. Scripts are node-based components with UUID-format CIDs.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['attach', 'remove'],
                            description: 'Script operation: \"attach\" = add custom script to node (requires nodeUuid+scriptPath) | \"remove\" = detach script from node (requires nodeUuid+scriptCid from component_query)'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Target node UUID (REQUIRED). Get from node_query tool first. Format: \"12345678-abcd-1234-5678-123456789abc\". Script will be attached to/removed from this node.'
                        },
                        scriptPath: {
                            type: 'string',
                            description: 'Script file path (REQUIRED for attach action). Must be valid Cocos asset path. Examples: \"db://assets/scripts/PlayerController.ts\", \"db://assets/game/GameManager.js\". Use asset_query to find script paths.'
                        },
                        scriptCid: {
                            type: 'string',
                            description: 'Script component ID (REQUIRED for remove action). UUID-like format from component_query list. Example: \"9b4a7ueT9xD6aRE+AlOusy1\". Cannot remove script without exact CID - use component_query from component-tools first!'
                        }
                    },
                    required: ['action', 'nodeUuid']
                }
            }
        ];
    }
    async execute(toolName, args) {
        console.log(`[NodeTools] Executing ${toolName} with args:`, args);
        try {
            switch (toolName) {
                case 'node_query':
                    return await this.handleNodeQuery(args);
                case 'node_lifecycle':
                    return await this.handleNodeLifecycle(args);
                case 'node_transform':
                    return await this.handleNodeTransform(args);
                case 'node_hierarchy':
                    return await this.handleNodeHierarchy(args);
                case 'node_clipboard':
                    return await this.handleNodeClipboard(args);
                case 'node_property_management':
                    return await this.handleNodePropertyManagement(args);
                case 'node_array_management':
                    return await this.handleNodeArrayManagement(args);
                case 'node_script_management':
                    return await this.handleNodeScriptManagement(args);
                default:
                    // Handle legacy tool names for backward compatibility
                    return await this.handleLegacyTools(toolName, args);
            }
        }
        catch (error) {
            console.error(`[NodeTools] Error in ${toolName}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async handleNodeQuery(args) {
        const { action } = args;
        switch (action) {
            case 'info':
                if (!args.uuid) {
                    return { success: false, error: 'UUID required for info action' };
                }
                return await this.getNodeInfo(args.uuid);
            case 'find':
                if (!args.pattern) {
                    return { success: false, error: 'Pattern required for find action' };
                }
                return await this.findNodes(args.pattern, args.exactMatch);
            case 'find_by_name':
                if (!args.name) {
                    return { success: false, error: 'Name required for find_by_name action' };
                }
                return await this.findNodeByName(args.name);
            case 'list_all':
                return await this.getAllNodes();
            case 'detect_type':
                if (!args.uuid) {
                    return { success: false, error: 'UUID required for detect_type action' };
                }
                return await this.detectNodeType(args.uuid);
            case 'tree':
                return await this.getNodeTree(args.uuid, args.maxDepth || 10);
            default:
                return { success: false, error: `Unknown query action: ${action}` };
        }
    }
    async handleNodeLifecycle(args) {
        const { action } = args;
        switch (action) {
            case 'create':
                if (!args.name) {
                    return { success: false, error: 'Name required for create action' };
                }
                return await this.createNode(args);
            case 'delete':
                if (!args.uuid) {
                    return { success: false, error: 'UUID required for delete action' };
                }
                return await this.deleteNode(args.uuid);
            default:
                return { success: false, error: `Unknown lifecycle action: ${action}` };
        }
    }
    async handleNodeTransform(args) {
        if (!args.uuid) {
            return { success: false, error: 'UUID required for transform operations' };
        }
        return await this.setNodeProperties(args.uuid, args);
    }
    async handleNodeHierarchy(args) {
        const { action } = args;
        switch (action) {
            case 'move':
                if (!args.nodeUuid || !args.newParentUuid) {
                    return { success: false, error: 'nodeUuid and newParentUuid required for move action' };
                }
                return await this.moveNode(args.nodeUuid, args.newParentUuid, args.siblingIndex);
            case 'duplicate':
                if (!args.uuid) {
                    return { success: false, error: 'UUID required for duplicate action' };
                }
                return await this.duplicateNode(args.uuid, args.includeChildren);
            default:
                return { success: false, error: `Unknown hierarchy action: ${action}` };
        }
    }
    async handleNodeClipboard(args) {
        const { action } = args;
        switch (action) {
            case 'copy':
                return await this.copyNode(args.uuids);
            case 'paste':
                return await this.pasteNode(args.target, args.uuids, args.keepWorldTransform);
            case 'cut':
                return await this.cutNode(args.uuids);
            default:
                return { success: false, error: `Unknown clipboard action: ${action}` };
        }
    }
    async handleNodePropertyManagement(args) {
        const { action } = args;
        switch (action) {
            case 'reset_property':
                return await this.resetNodeProperty(args.uuid, args.path);
            case 'reset_transform':
                return await this.resetNodeTransform(args.uuid);
            case 'reset_component':
                return await this.resetComponent(args.uuid);
            default:
                return { success: false, error: `Unknown property management action: ${action}` };
        }
    }
    async handleNodeArrayManagement(args) {
        const { action } = args;
        switch (action) {
            case 'move_element':
                return await this.moveArrayElement(args.uuid, args.path, args.target, args.offset);
            case 'remove_element':
                return await this.removeArrayElement(args.uuid, args.path, args.index);
            default:
                return { success: false, error: `Unknown array management action: ${action}` };
        }
    }
    // Legacy tool support for backward compatibility
    async handleLegacyTools(toolName, args) {
        switch (toolName) {
            case 'create_node':
                return await this.createNode(args);
            case 'get_node_info':
                return await this.getNodeInfo(args.uuid);
            case 'find_nodes':
                return await this.findNodes(args.pattern, args.exactMatch);
            case 'find_node_by_name':
                return await this.findNodeByName(args.name);
            case 'get_all_nodes':
                return await this.getAllNodes();
            case 'set_node_properties':
                return await this.setNodeProperties(args.uuid, args);
            case 'delete_node':
                return await this.deleteNode(args.uuid);
            case 'move_node':
                return await this.moveNode(args.nodeUuid, args.newParentUuid, args.siblingIndex);
            case 'duplicate_node':
                return await this.duplicateNode(args.uuid, args.includeChildren);
            case 'detect_node_type':
                return await this.detectNodeType(args.uuid);
            case 'scene_node_operations':
                return await this.handleNodeClipboard(args);
            case 'scene_property_management':
                return await this.handleNodePropertyManagement(args);
            case 'scene_array_management':
                return await this.handleNodeArrayManagement(args);
            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    }
    // Implementation methods
    async createNode(args) {
        return new Promise(async (resolve) => {
            try {
                let targetParentUuid = args.parentUuid;
                // If no parent UUID provided, get scene root
                if (!targetParentUuid) {
                    try {
                        const sceneInfo = await Editor.Message.request('scene', 'query-node-tree');
                        if (sceneInfo && typeof sceneInfo === 'object' && !Array.isArray(sceneInfo) && Object.prototype.hasOwnProperty.call(sceneInfo, 'uuid')) {
                            targetParentUuid = sceneInfo.uuid;
                            console.log(`No parent specified, using scene root: ${targetParentUuid}`);
                        }
                        else if (Array.isArray(sceneInfo) && sceneInfo.length > 0 && sceneInfo[0].uuid) {
                            targetParentUuid = sceneInfo[0].uuid;
                            console.log(`No parent specified, using scene root: ${targetParentUuid}`);
                        }
                        else {
                            const currentScene = await Editor.Message.request('scene', 'query-current-scene');
                            if (currentScene && currentScene.uuid) {
                                targetParentUuid = currentScene.uuid;
                            }
                        }
                    }
                    catch (err) {
                        console.warn('Failed to get scene root, will use default behavior');
                    }
                }
                // Resolve asset path to UUID if provided
                let finalAssetUuid = args.assetUuid;
                if (args.assetPath && !finalAssetUuid) {
                    try {
                        const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', args.assetPath);
                        if (assetInfo && assetInfo.uuid) {
                            finalAssetUuid = assetInfo.uuid;
                            console.log(`Asset path '${args.assetPath}' resolved to UUID: ${finalAssetUuid}`);
                        }
                        else {
                            resolve({
                                success: false,
                                error: `Asset not found at path: ${args.assetPath}`
                            });
                            return;
                        }
                    }
                    catch (err) {
                        resolve({
                            success: false,
                            error: `Failed to resolve asset path '${args.assetPath}': ${err}`
                        });
                        return;
                    }
                }
                // Build create-node options
                const createNodeOptions = {
                    name: args.name
                };
                if (targetParentUuid) {
                    createNodeOptions.parent = targetParentUuid;
                }
                if (finalAssetUuid) {
                    createNodeOptions.assetUuid = finalAssetUuid;
                    if (args.unlinkPrefab) {
                        createNodeOptions.unlinkPrefab = true;
                    }
                }
                if (args.components && args.components.length > 0) {
                    createNodeOptions.components = args.components;
                }
                else if (args.nodeType && args.nodeType !== 'Node' && !finalAssetUuid) {
                    createNodeOptions.components = [args.nodeType];
                }
                if (args.keepWorldTransform) {
                    createNodeOptions.keepWorldTransform = true;
                }
                console.log('Creating node with options:', createNodeOptions);
                // Create node
                const nodeUuid = await Editor.Message.request('scene', 'create-node', createNodeOptions);
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                // Handle sibling index
                if (args.siblingIndex !== undefined && args.siblingIndex >= 0 && uuid && targetParentUuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await Editor.Message.request('scene', 'set-parent', {
                            parent: targetParentUuid,
                            uuids: [uuid],
                            keepWorldTransform: args.keepWorldTransform || false
                        });
                    }
                    catch (err) {
                        console.warn('Failed to set sibling index:', err);
                    }
                }
                // Add components if provided
                if (args.components && args.components.length > 0 && uuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        for (const componentType of args.components) {
                            try {
                                const result = await this.componentTools.execute('add_component', {
                                    nodeUuid: uuid,
                                    componentType: componentType
                                });
                                if (result.success) {
                                    console.log(`Component ${componentType} added successfully`);
                                }
                                else {
                                    console.warn(`Failed to add component ${componentType}:`, result.error);
                                }
                            }
                            catch (err) {
                                console.warn(`Failed to add component ${componentType}:`, err);
                            }
                        }
                    }
                    catch (err) {
                        console.warn('Failed to add components:', err);
                    }
                }
                // Set initial transform if provided
                if (args.initialTransform && uuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 150));
                        await this.setNodeTransform({
                            uuid: uuid,
                            position: args.initialTransform.position,
                            rotation: args.initialTransform.rotation,
                            scale: args.initialTransform.scale
                        });
                        console.log('Initial transform applied successfully');
                    }
                    catch (err) {
                        console.warn('Failed to set initial transform:', err);
                    }
                }
                // Get created node info for verification
                let verificationData = null;
                try {
                    const nodeInfo = await this.getNodeInfo(uuid);
                    if (nodeInfo.success) {
                        verificationData = {
                            nodeInfo: nodeInfo.data,
                            creationDetails: {
                                parentUuid: targetParentUuid,
                                nodeType: args.nodeType || 'Node',
                                fromAsset: !!finalAssetUuid,
                                assetUuid: finalAssetUuid,
                                assetPath: args.assetPath,
                                timestamp: new Date().toISOString()
                            }
                        };
                    }
                }
                catch (err) {
                    console.warn('Failed to get verification data:', err);
                }
                const successMessage = finalAssetUuid
                    ? `Node '${args.name}' instantiated from asset successfully`
                    : `Node '${args.name}' created successfully`;
                resolve({
                    success: true,
                    data: {
                        uuid: uuid,
                        name: args.name,
                        parentUuid: targetParentUuid,
                        nodeType: args.nodeType || 'Node',
                        fromAsset: !!finalAssetUuid,
                        assetUuid: finalAssetUuid,
                        message: successMessage
                    },
                    verificationData: verificationData
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to create node: ${err.message}. Args: ${JSON.stringify(args)}`
                });
            }
        });
    }
    async getNodeInfo(uuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node', uuid).then((nodeData) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: 'Node not found or invalid response'
                    });
                    return;
                }
                const info = {
                    uuid: ((_a = nodeData.uuid) === null || _a === void 0 ? void 0 : _a.value) || uuid,
                    name: ((_b = nodeData.name) === null || _b === void 0 ? void 0 : _b.value) || 'Unknown',
                    active: ((_c = nodeData.active) === null || _c === void 0 ? void 0 : _c.value) !== undefined ? nodeData.active.value : true,
                    position: ((_d = nodeData.position) === null || _d === void 0 ? void 0 : _d.value) || { x: 0, y: 0, z: 0 },
                    rotation: ((_e = nodeData.rotation) === null || _e === void 0 ? void 0 : _e.value) || { x: 0, y: 0, z: 0 },
                    scale: ((_f = nodeData.scale) === null || _f === void 0 ? void 0 : _f.value) || { x: 1, y: 1, z: 1 },
                    parent: ((_h = (_g = nodeData.parent) === null || _g === void 0 ? void 0 : _g.value) === null || _h === void 0 ? void 0 : _h.uuid) || null,
                    children: nodeData.children || [],
                    components: (nodeData.__comps__ || []).map((comp) => ({
                        type: comp.__type__ || 'Unknown',
                        enabled: comp.enabled !== undefined ? comp.enabled : true
                    })),
                    layer: ((_j = nodeData.layer) === null || _j === void 0 ? void 0 : _j.value) || 1073741824,
                    mobility: ((_k = nodeData.mobility) === null || _k === void 0 ? void 0 : _k.value) || 0
                };
                resolve({ success: true, data: info });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async findNodes(pattern, exactMatch = false) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                const nodes = [];
                const searchTree = (node, currentPath = '') => {
                    const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
                    const matches = exactMatch ?
                        node.name === pattern :
                        node.name.toLowerCase().includes(pattern.toLowerCase());
                    if (matches) {
                        nodes.push({
                            uuid: node.uuid,
                            name: node.name,
                            path: nodePath
                        });
                    }
                    if (node.children) {
                        for (const child of node.children) {
                            searchTree(child, nodePath);
                        }
                    }
                };
                if (tree) {
                    searchTree(tree);
                }
                resolve({ success: true, data: nodes });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async findNodeByName(name) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                const foundNode = this.searchNodeInTree(tree, name);
                if (foundNode) {
                    resolve({
                        success: true,
                        data: {
                            uuid: foundNode.uuid,
                            name: foundNode.name,
                            path: this.getNodePath(foundNode)
                        }
                    });
                }
                else {
                    resolve({ success: false, error: `Node '${name}' not found` });
                }
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    searchNodeInTree(node, targetName) {
        if (node.name === targetName) {
            return node;
        }
        if (node.children) {
            for (const child of node.children) {
                const found = this.searchNodeInTree(child, targetName);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    async getAllNodes() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                const nodes = [];
                const traverseTree = (node) => {
                    nodes.push({
                        uuid: node.uuid,
                        name: node.name,
                        type: node.type,
                        active: node.active,
                        path: this.getNodePath(node)
                    });
                    if (node.children) {
                        for (const child of node.children) {
                            traverseTree(child);
                        }
                    }
                };
                if (tree && tree.children) {
                    traverseTree(tree);
                }
                resolve({
                    success: true,
                    data: {
                        totalNodes: nodes.length,
                        nodes: nodes
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    getNodePath(node) {
        const path = [node.name];
        let current = node.parent;
        while (current && current.name !== 'Canvas') {
            path.unshift(current.name);
            current = current.parent;
        }
        return path.join('/');
    }
    async setNodeProperties(uuid, args) {
        return new Promise(async (resolve) => {
            const { name, active, layer, mobility, position, rotation, scale, customProperties } = args;
            const updatePromises = [];
            const updates = [];
            const warnings = [];
            try {
                // Get node info to determine 2D/3D
                let is2DNode = false;
                let nodeInfo = null;
                if (position || rotation || scale) {
                    const nodeInfoResponse = await this.getNodeInfo(uuid);
                    if (!nodeInfoResponse.success || !nodeInfoResponse.data) {
                        resolve({ success: false, error: 'Failed to get node information' });
                        return;
                    }
                    nodeInfo = nodeInfoResponse.data;
                    is2DNode = this.is2DNode(nodeInfo);
                }
                // Handle general properties
                if (name !== undefined) {
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'name',
                        dump: { value: name }
                    }));
                    updates.push('name');
                }
                if (active !== undefined) {
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'active',
                        dump: { value: active }
                    }));
                    updates.push('active');
                }
                if (layer !== undefined) {
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'layer',
                        dump: { value: layer }
                    }));
                    updates.push('layer');
                }
                if (mobility !== undefined) {
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'mobility',
                        dump: { value: mobility }
                    }));
                    updates.push('mobility');
                }
                // Handle transform properties
                if (position) {
                    const normalizedPosition = this.normalizeTransformValue(position, 'position', is2DNode);
                    if (normalizedPosition.warning) {
                        warnings.push(normalizedPosition.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'position',
                        dump: { value: normalizedPosition.value }
                    }));
                    updates.push('position');
                }
                if (rotation) {
                    const normalizedRotation = this.normalizeTransformValue(rotation, 'rotation', is2DNode);
                    if (normalizedRotation.warning) {
                        warnings.push(normalizedRotation.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'rotation',
                        dump: { value: normalizedRotation.value }
                    }));
                    updates.push('rotation');
                }
                if (scale) {
                    const normalizedScale = this.normalizeTransformValue(scale, 'scale', is2DNode);
                    if (normalizedScale.warning) {
                        warnings.push(normalizedScale.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'scale',
                        dump: { value: normalizedScale.value }
                    }));
                    updates.push('scale');
                }
                // Handle custom properties
                if (customProperties && typeof customProperties === 'object') {
                    for (const [property, value] of Object.entries(customProperties)) {
                        updatePromises.push(Editor.Message.request('scene', 'set-property', {
                            uuid: uuid,
                            path: property,
                            dump: { value: value }
                        }));
                        updates.push(property);
                    }
                }
                if (updatePromises.length === 0) {
                    resolve({
                        success: false,
                        error: 'No properties provided to update'
                    });
                    return;
                }
                // Execute all updates
                await Promise.all(updatePromises);
                // Get updated node info for verification
                const updatedNodeInfo = await this.getNodeInfo(uuid);
                resolve({
                    success: true,
                    message: `✅ Updated ${updates.length} properties`,
                    data: {
                        nodeUuid: uuid,
                        updatedProperties: updates,
                        warnings: warnings.length > 0 ? warnings : undefined
                    }
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to set node properties: ${err.message}`
                });
            }
        });
    }
    async setNodeTransform(args) {
        return new Promise(async (resolve) => {
            const { uuid, position, rotation, scale } = args;
            const updatePromises = [];
            const updates = [];
            const warnings = [];
            try {
                // Get node info to determine 2D/3D
                const nodeInfoResponse = await this.getNodeInfo(uuid);
                if (!nodeInfoResponse.success || !nodeInfoResponse.data) {
                    resolve({ success: false, error: 'Failed to get node information' });
                    return;
                }
                const nodeInfo = nodeInfoResponse.data;
                const is2DNode = this.is2DNode(nodeInfo);
                if (position) {
                    const normalizedPosition = this.normalizeTransformValue(position, 'position', is2DNode);
                    if (normalizedPosition.warning) {
                        warnings.push(normalizedPosition.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'position',
                        dump: { value: normalizedPosition.value }
                    }));
                    updates.push('position');
                }
                if (rotation) {
                    const normalizedRotation = this.normalizeTransformValue(rotation, 'rotation', is2DNode);
                    if (normalizedRotation.warning) {
                        warnings.push(normalizedRotation.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'rotation',
                        dump: { value: normalizedRotation.value }
                    }));
                    updates.push('rotation');
                }
                if (scale) {
                    const normalizedScale = this.normalizeTransformValue(scale, 'scale', is2DNode);
                    if (normalizedScale.warning) {
                        warnings.push(normalizedScale.warning);
                    }
                    updatePromises.push(Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'scale',
                        dump: { value: normalizedScale.value }
                    }));
                    updates.push('scale');
                }
                if (updatePromises.length === 0) {
                    resolve({ success: false, error: 'No transform properties specified' });
                    return;
                }
                await Promise.all(updatePromises);
                const response = {
                    success: true,
                    message: `✅ Transform updated: ${updates.join(', ')} ${is2DNode ? '(2D)' : '(3D)'}`,
                    data: {
                        nodeUuid: uuid,
                        nodeType: is2DNode ? '2D' : '3D',
                        appliedChanges: updates
                    }
                };
                if (warnings.length > 0) {
                    response.warning = warnings.join('; ');
                }
                resolve(response);
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to update transform: ${err.message}`
                });
            }
        });
    }
    is2DNode(nodeInfo) {
        const components = nodeInfo.components || [];
        // Check for 2D components
        const has2DComponents = components.some((comp) => comp.type && (comp.type.includes('cc.Sprite') ||
            comp.type.includes('cc.Label') ||
            comp.type.includes('cc.Button') ||
            comp.type.includes('cc.Layout') ||
            comp.type.includes('cc.Widget') ||
            comp.type.includes('cc.Mask') ||
            comp.type.includes('cc.Graphics')));
        if (has2DComponents) {
            return true;
        }
        // Check for 3D components  
        const has3DComponents = components.some((comp) => comp.type && (comp.type.includes('cc.MeshRenderer') ||
            comp.type.includes('cc.Camera') ||
            comp.type.includes('cc.Light') ||
            comp.type.includes('cc.DirectionalLight') ||
            comp.type.includes('cc.PointLight') ||
            comp.type.includes('cc.SpotLight')));
        if (has3DComponents) {
            return false;
        }
        // Default heuristic
        const position = nodeInfo.position;
        if (position && Math.abs(position.z) < 0.001) {
            return true;
        }
        return false;
    }
    normalizeTransformValue(value, type, is2D) {
        const result = Object.assign({}, value);
        let warning;
        if (is2D) {
            switch (type) {
                case 'position':
                    if (value.z !== undefined && Math.abs(value.z) > 0.001) {
                        warning = `2D node: z position (${value.z}) ignored, set to 0`;
                        result.z = 0;
                    }
                    else if (value.z === undefined) {
                        result.z = 0;
                    }
                    break;
                case 'rotation':
                    if ((value.x !== undefined && Math.abs(value.x) > 0.001) ||
                        (value.y !== undefined && Math.abs(value.y) > 0.001)) {
                        warning = `2D node: x,y rotations ignored, only z rotation applied`;
                        result.x = 0;
                        result.y = 0;
                    }
                    else {
                        result.x = result.x || 0;
                        result.y = result.y || 0;
                    }
                    result.z = result.z || 0;
                    break;
                case 'scale':
                    if (value.z === undefined) {
                        result.z = 1;
                    }
                    break;
            }
        }
        else {
            // 3D node
            result.x = result.x !== undefined ? result.x : (type === 'scale' ? 1 : 0);
            result.y = result.y !== undefined ? result.y : (type === 'scale' ? 1 : 0);
            result.z = result.z !== undefined ? result.z : (type === 'scale' ? 1 : 0);
        }
        return { value: result, warning };
    }
    async deleteNode(uuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'remove-node', { uuid: uuid }).then(() => {
                resolve({
                    success: true,
                    message: '✅ Node deleted'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async moveNode(nodeUuid, newParentUuid, siblingIndex = -1) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'set-parent', {
                parent: newParentUuid,
                uuids: [nodeUuid],
                keepWorldTransform: false
            }).then(() => {
                resolve({
                    success: true,
                    message: '✅ Node moved'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async duplicateNode(uuid, includeChildren = true) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'duplicate-node', uuid).then((result) => {
                resolve({
                    success: true,
                    data: {
                        newUuid: result.uuid,
                        message: '✅ Node duplicated'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async detectNodeType(uuid) {
        return new Promise(async (resolve) => {
            try {
                const nodeInfoResponse = await this.getNodeInfo(uuid);
                if (!nodeInfoResponse.success || !nodeInfoResponse.data) {
                    resolve({ success: false, error: 'Failed to get node information' });
                    return;
                }
                const nodeInfo = nodeInfoResponse.data;
                const is2D = this.is2DNode(nodeInfo);
                const components = nodeInfo.components || [];
                const detectionReasons = [];
                // Check for 2D components
                const twoDComponents = components.filter((comp) => comp.type && (comp.type.includes('cc.Sprite') ||
                    comp.type.includes('cc.Label') ||
                    comp.type.includes('cc.Button') ||
                    comp.type.includes('cc.Layout') ||
                    comp.type.includes('cc.Widget') ||
                    comp.type.includes('cc.Mask') ||
                    comp.type.includes('cc.Graphics')));
                // Check for 3D components
                const threeDComponents = components.filter((comp) => comp.type && (comp.type.includes('cc.MeshRenderer') ||
                    comp.type.includes('cc.Camera') ||
                    comp.type.includes('cc.Light') ||
                    comp.type.includes('cc.DirectionalLight') ||
                    comp.type.includes('cc.PointLight') ||
                    comp.type.includes('cc.SpotLight')));
                if (twoDComponents.length > 0) {
                    detectionReasons.push(`Has 2D components: ${twoDComponents.map((c) => c.type).join(', ')}`);
                }
                if (threeDComponents.length > 0) {
                    detectionReasons.push(`Has 3D components: ${threeDComponents.map((c) => c.type).join(', ')}`);
                }
                const position = nodeInfo.position;
                if (position && Math.abs(position.z) < 0.001) {
                    detectionReasons.push('Z position is ~0 (likely 2D)');
                }
                else if (position && Math.abs(position.z) > 0.001) {
                    detectionReasons.push(`Z position is ${position.z} (likely 3D)`);
                }
                if (detectionReasons.length === 0) {
                    detectionReasons.push('No specific indicators found, defaulting based on heuristics');
                }
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        nodeName: nodeInfo.name,
                        nodeType: is2D ? '2D' : '3D',
                        detectionReasons: detectionReasons,
                        components: components.map((comp) => ({
                            type: comp.type,
                            category: this.getComponentCategory(comp.type)
                        })),
                        position: nodeInfo.position,
                        transformConstraints: {
                            position: is2D ? 'x, y only (z ignored)' : 'x, y, z all used',
                            rotation: is2D ? 'z only (x, y ignored)' : 'x, y, z all used',
                            scale: is2D ? 'x, y main, z typically 1' : 'x, y, z all used'
                        }
                    }
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to detect node type: ${err.message}`
                });
            }
        });
    }
    getComponentCategory(componentType) {
        if (!componentType)
            return 'unknown';
        if (componentType.includes('cc.Sprite') || componentType.includes('cc.Label') ||
            componentType.includes('cc.Button') || componentType.includes('cc.Layout') ||
            componentType.includes('cc.Widget') || componentType.includes('cc.Mask') ||
            componentType.includes('cc.Graphics')) {
            return '2D';
        }
        if (componentType.includes('cc.MeshRenderer') || componentType.includes('cc.Camera') ||
            componentType.includes('cc.Light') || componentType.includes('cc.DirectionalLight') ||
            componentType.includes('cc.PointLight') || componentType.includes('cc.SpotLight')) {
            return '3D';
        }
        return 'generic';
    }
    async getNodeTree(rootUuid, maxDepth = 10) {
        try {
            // 使用官方的 query-node-tree API
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree', rootUuid);
            // 递归处理节点树，限制深度
            const processNode = (node, currentDepth = 0) => {
                if (currentDepth >= maxDepth) {
                    return {
                        uuid: node.uuid,
                        name: node.name,
                        active: node.active,
                        type: node.type,
                        children: node.children ? [`... ${node.children.length} children (max depth reached)`] : [],
                        truncated: true,
                        childCount: node.children ? node.children.length : 0
                    };
                }
                const processedNode = {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    type: node.type,
                    isScene: node.isScene || false,
                    prefab: node.prefab || 0,
                    components: node.components ? node.components.map((comp) => ({
                        type: comp.type,
                        value: comp.value,
                        extends: comp.extends || []
                    })) : [],
                    childCount: node.children ? node.children.length : 0,
                    children: []
                };
                if (node.children && node.children.length > 0) {
                    processedNode.children = node.children.map((child) => processNode(child, currentDepth + 1));
                }
                return processedNode;
            };
            const processedTree = processNode(nodeTree, 0);
            return {
                success: true,
                message: `✅ Node tree retrieved (root: ${nodeTree.name || 'scene'})`,
                data: {
                    tree: processedTree,
                    rootUuid: rootUuid || 'scene',
                    maxDepth: maxDepth,
                    nodeCount: this.countTreeNodes(processedTree)
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get node tree: ${error.message}`
            };
        }
    }
    countTreeNodes(node) {
        let count = 1; // 当前节点
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                if (typeof child === 'object' && !child.truncated) {
                    count += this.countTreeNodes(child);
                }
            }
        }
        return count;
    }
    // New methods from scene-advanced-tools.ts
    async copyNode(uuids) {
        return new Promise((resolve) => {
            // Validate parameters
            if (!uuids) {
                resolve({
                    success: false,
                    error: 'Node UUID(s) are required'
                });
                return;
            }
            const nodeUuids = Array.isArray(uuids) ? uuids : [uuids];
            // Validate each UUID
            for (const uuid of nodeUuids) {
                if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                    resolve({
                        success: false,
                        error: 'All UUIDs must be non-empty strings'
                    });
                    return;
                }
            }
            const trimmedUuids = nodeUuids.map(uuid => uuid.trim());
            const inputUuids = Array.isArray(uuids) ? trimmedUuids : trimmedUuids[0];
            Editor.Message.request('scene', 'copy-node', inputUuids).then((result) => {
                resolve({
                    success: true,
                    message: `✅ ${Array.isArray(result) ? result.length : 1} node(s) copied to clipboard`,
                    data: {
                        originalUuids: trimmedUuids,
                        copiedUuids: result,
                        action: 'copy',
                        nodeCount: Array.isArray(result) ? result.length : 1
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to copy node(s): ${err.message}`
                });
            });
        });
    }
    async pasteNode(target, uuids, keepWorldTransform = false) {
        return new Promise((resolve) => {
            // Validate parameters
            if (!target || typeof target !== 'string' || target.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Target parent UUID is required and must be a non-empty string'
                });
                return;
            }
            if (!uuids) {
                resolve({
                    success: false,
                    error: 'Node UUID(s) to paste are required'
                });
                return;
            }
            const nodeUuids = Array.isArray(uuids) ? uuids : [uuids];
            // Validate each UUID
            for (const uuid of nodeUuids) {
                if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                    resolve({
                        success: false,
                        error: 'All UUIDs must be non-empty strings'
                    });
                    return;
                }
            }
            const trimmedTarget = target.trim();
            const trimmedUuids = nodeUuids.map(uuid => uuid.trim());
            const inputUuids = Array.isArray(uuids) ? trimmedUuids : trimmedUuids[0];
            Editor.Message.request('scene', 'paste-node', {
                target: trimmedTarget,
                uuids: inputUuids,
                keepWorldTransform
            }).then((result) => {
                resolve({
                    success: true,
                    message: `✅ ${Array.isArray(result) ? result.length : 1} node(s) pasted successfully`,
                    data: {
                        targetParent: trimmedTarget,
                        originalUuids: trimmedUuids,
                        newUuids: result,
                        keepWorldTransform,
                        action: 'paste',
                        nodeCount: Array.isArray(result) ? result.length : 1
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to paste node(s): ${err.message}`
                });
            });
        });
    }
    async cutNode(uuids) {
        return new Promise((resolve) => {
            // Validate parameters
            if (!uuids) {
                resolve({
                    success: false,
                    error: 'Node UUID(s) are required'
                });
                return;
            }
            const nodeUuids = Array.isArray(uuids) ? uuids : [uuids];
            // Validate each UUID
            for (const uuid of nodeUuids) {
                if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                    resolve({
                        success: false,
                        error: 'All UUIDs must be non-empty strings'
                    });
                    return;
                }
            }
            const trimmedUuids = nodeUuids.map(uuid => uuid.trim());
            const inputUuids = Array.isArray(uuids) ? trimmedUuids : trimmedUuids[0];
            Editor.Message.request('scene', 'cut-node', inputUuids).then((result) => {
                resolve({
                    success: true,
                    message: `✅ ${Array.isArray(result) ? result.length : 1} node(s) cut to clipboard`,
                    data: {
                        originalUuids: trimmedUuids,
                        cutUuids: result,
                        action: 'cut',
                        nodeCount: Array.isArray(result) ? result.length : 1,
                        note: 'Nodes are copied to clipboard and marked for move operation'
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to cut node(s): ${err.message}`
                });
            });
        });
    }
    async resetNodeProperty(uuid, path) {
        return new Promise((resolve) => {
            // Validate parameters
            if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Node UUID is required and must be a non-empty string'
                });
                return;
            }
            if (!path || typeof path !== 'string' || path.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Property path is required and must be a non-empty string'
                });
                return;
            }
            const trimmedUuid = uuid.trim();
            const trimmedPath = path.trim();
            Editor.Message.request('scene', 'reset-property', {
                uuid: trimmedUuid,
                path: trimmedPath,
                dump: { value: null }
            }).then(() => {
                resolve({
                    success: true,
                    message: `✅ Property '${trimmedPath}' reset to default value`,
                    data: {
                        uuid: trimmedUuid,
                        path: trimmedPath,
                        action: 'reset_property'
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to reset property '${trimmedPath}': ${err.message}`
                });
            });
        });
    }
    async resetNodeTransform(uuid) {
        return new Promise((resolve) => {
            if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Node UUID is required and must be a non-empty string'
                });
                return;
            }
            const trimmedUuid = uuid.trim();
            Editor.Message.request('scene', 'reset-node', { uuid: trimmedUuid }).then(() => {
                resolve({
                    success: true,
                    message: '✅ Node transform reset to default values',
                    data: {
                        uuid: trimmedUuid,
                        action: 'reset_transform',
                        resetProperties: ['position', 'rotation', 'scale']
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to reset node transform: ${err.message}`
                });
            });
        });
    }
    async resetComponent(uuid) {
        return new Promise((resolve) => {
            if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Component UUID is required and must be a non-empty string'
                });
                return;
            }
            const trimmedUuid = uuid.trim();
            Editor.Message.request('scene', 'reset-component', { uuid: trimmedUuid }).then(() => {
                resolve({
                    success: true,
                    message: '✅ Component reset to default values',
                    data: {
                        uuid: trimmedUuid,
                        action: 'reset_component'
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to reset component: ${err.message}`
                });
            });
        });
    }
    async moveArrayElement(uuid, path, target, offset) {
        return new Promise((resolve) => {
            // Validate parameters
            if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Node UUID is required and must be a non-empty string'
                });
                return;
            }
            if (!path || typeof path !== 'string' || path.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Array path is required and must be a non-empty string'
                });
                return;
            }
            if (typeof target !== 'number' || target < 0 || !Number.isInteger(target)) {
                resolve({
                    success: false,
                    error: 'Target index must be a non-negative integer'
                });
                return;
            }
            if (typeof offset !== 'number' || !Number.isInteger(offset) || offset === 0) {
                resolve({
                    success: false,
                    error: 'Offset must be a non-zero integer'
                });
                return;
            }
            const trimmedUuid = uuid.trim();
            const trimmedPath = path.trim();
            Editor.Message.request('scene', 'move-array-element', {
                uuid: trimmedUuid,
                path: trimmedPath,
                target,
                offset
            }).then(() => {
                resolve({
                    success: true,
                    message: `✅ Array element moved from index ${target} by ${offset} positions`,
                    data: {
                        uuid: trimmedUuid,
                        path: trimmedPath,
                        target,
                        offset,
                        newIndex: target + offset,
                        action: 'move_element'
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to move array element: ${err.message}`
                });
            });
        });
    }
    async removeArrayElement(uuid, path, index) {
        return new Promise((resolve) => {
            // Validate parameters
            if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Node UUID is required and must be a non-empty string'
                });
                return;
            }
            if (!path || typeof path !== 'string' || path.trim().length === 0) {
                resolve({
                    success: false,
                    error: 'Array path is required and must be a non-empty string'
                });
                return;
            }
            if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
                resolve({
                    success: false,
                    error: 'Index must be a non-negative integer'
                });
                return;
            }
            const trimmedUuid = uuid.trim();
            const trimmedPath = path.trim();
            Editor.Message.request('scene', 'remove-array-element', {
                uuid: trimmedUuid,
                path: trimmedPath,
                index
            }).then(() => {
                resolve({
                    success: true,
                    message: `✅ Array element at index ${index} removed successfully`,
                    data: {
                        uuid: trimmedUuid,
                        path: trimmedPath,
                        index,
                        action: 'remove_element'
                    }
                });
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `Failed to remove array element at index ${index}: ${err.message}`
                });
            });
        });
    }
    // New script management handler
    async handleNodeScriptManagement(args) {
        const { action, nodeUuid, scriptPath, scriptCid } = args;
        switch (action) {
            case 'attach':
                if (!scriptPath) {
                    return { success: false, error: 'scriptPath required for attach action' };
                }
                return await this.attachScriptToNode(nodeUuid, scriptPath);
            case 'remove':
                if (!scriptCid) {
                    return { success: false, error: 'scriptCid required for remove action' };
                }
                return await this.removeScriptFromNode(nodeUuid, scriptCid);
            default:
                return { success: false, error: `Unknown script management action: ${action}` };
        }
    }
    // Script attachment implementation (copied and adapted from component-tools)
    async attachScriptToNode(nodeUuid, scriptPath) {
        return new Promise(async (resolve) => {
            var _a, _b, _c, _d, _e;
            try {
                // Extract script component name from path
                const scriptName = (_a = scriptPath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.ts', '').replace('.js', '');
                if (!scriptName) {
                    resolve({ success: false, error: 'Invalid script path: unable to extract script name' });
                    return;
                }
                // Check if script already exists on node using ComponentTools
                const allComponentsInfo = await this.componentTools.execute('component_query', {
                    action: 'list',
                    nodeUuid: nodeUuid
                });
                if (allComponentsInfo.success && ((_b = allComponentsInfo.data) === null || _b === void 0 ? void 0 : _b.components)) {
                    // First, get the script UUID to compare with component __scriptAsset
                    let scriptUuid = null;
                    try {
                        scriptUuid = await Editor.Message.request('asset-db', 'query-uuid', scriptPath);
                        console.log(`[DEBUG] Script UUID for duplicate check: ${scriptUuid}`);
                    }
                    catch (e) {
                        console.log(`[DEBUG] Could not get script UUID for duplicate check: ${e}`);
                    }
                    // Look for existing script in multiple ways:
                    // 1. By script class name (exact match)
                    // 2. By checking if component has __scriptAsset UUID pointing to our script
                    // 3. By checking non-cc.* components that might be our script
                    const existingScript = allComponentsInfo.data.components.find((comp) => {
                        console.log(`[DEBUG] Checking component type: ${comp.type}`);
                        // Method 1: Direct name match
                        if (comp.type === scriptName) {
                            console.log(`[DEBUG] Found exact script name match: ${comp.type}`);
                            return true;
                        }
                        // Method 2: Check __scriptAsset UUID if available
                        if (comp.properties && comp.properties.__scriptAsset && comp.properties.__scriptAsset.value) {
                            const scriptAssetUuid = comp.properties.__scriptAsset.value.uuid;
                            console.log(`[DEBUG] Checking __scriptAsset UUID: ${scriptAssetUuid} vs ${scriptUuid}`);
                            if (scriptAssetUuid === scriptUuid) {
                                console.log(`[DEBUG] Found script by __scriptAsset UUID match!`);
                                return true;
                            }
                        }
                        // Method 3: Check by component name containing our script name
                        if (comp.properties && comp.properties.name && comp.properties.name.value) {
                            const componentName = comp.properties.name.value;
                            console.log(`[DEBUG] Checking component name: ${componentName}`);
                            if (componentName.includes(`<${scriptName}>`)) {
                                console.log(`[DEBUG] Found script by component name match: ${componentName}`);
                                return true;
                            }
                        }
                        return false;
                    });
                    if (existingScript) {
                        console.log(`[DEBUG] Script already exists, component details:`, existingScript);
                        resolve({
                            success: true,
                            message: `✅ Script '${scriptName}' already exists on node`,
                            data: {
                                nodeUuid: nodeUuid,
                                scriptName: scriptName,
                                scriptPath: scriptPath,
                                alreadyExists: true,
                                componentId: existingScript.cid,
                                componentType: existingScript.type
                            }
                        });
                        return;
                    }
                }
                // The create-component API expects the script class name (from @ccclass), not file UUID
                // We use the extracted scriptName which matches the @ccclass name
                try {
                    console.log(`[DEBUG] Attempting to create component with nodeUuid: ${nodeUuid}, scriptName: ${scriptName}`);
                    const createResult = await Editor.Message.request('scene', 'create-component', {
                        uuid: nodeUuid,
                        component: scriptName
                    });
                    console.log(`[DEBUG] Create component result:`, createResult);
                }
                catch (createError) {
                    console.error(`[DEBUG] Create component failed:`, createError);
                    resolve({ success: false, error: `Failed to create component: ${createError}` });
                    return;
                }
                // Wait for editor to complete component addition
                await new Promise(resolve => setTimeout(resolve, 100));
                // Verify script was attached successfully
                const verifyComponentsInfo = await this.componentTools.execute('component_query', {
                    action: 'list',
                    nodeUuid: nodeUuid
                });
                if (verifyComponentsInfo.success && ((_c = verifyComponentsInfo.data) === null || _c === void 0 ? void 0 : _c.components)) {
                    // Check for script component by looking for any component that's not a built-in cc.* type
                    // or specifically matches our script name
                    const beforeComponents = ((_e = (_d = allComponentsInfo.data) === null || _d === void 0 ? void 0 : _d.components) === null || _e === void 0 ? void 0 : _e.map((c) => c.type)) || [];
                    const afterComponents = verifyComponentsInfo.data.components.map((c) => c.type);
                    const newComponents = afterComponents.filter((type) => !beforeComponents.includes(type));
                    console.log(`[DEBUG] Components before: ${beforeComponents.join(', ')}`);
                    console.log(`[DEBUG] Components after: ${afterComponents.join(', ')}`);
                    console.log(`[DEBUG] New components: ${newComponents.join(', ')}`);
                    // Look for the script either by name match or as a new non-cc.* component
                    const addedScript = verifyComponentsInfo.data.components.find((comp) => comp.type === scriptName ||
                        (newComponents.includes(comp.type) && !comp.type.startsWith('cc.')));
                    if (addedScript || newComponents.length > 0) {
                        const finalScript = addedScript || verifyComponentsInfo.data.components.find((comp) => newComponents.includes(comp.type));
                        resolve({
                            success: true,
                            message: `✅ Script '${scriptName}' attached successfully to node`,
                            data: {
                                nodeUuid: nodeUuid,
                                scriptName: scriptName,
                                scriptPath: scriptPath,
                                alreadyExists: false,
                                componentId: finalScript.cid,
                                componentType: finalScript.type
                            }
                        });
                    }
                    else {
                        resolve({
                            success: false,
                            error: `Script '${scriptName}' was not found on node after attachment attempt. Available components: ${afterComponents.join(', ')}`
                        });
                    }
                }
                else {
                    resolve({
                        success: false,
                        error: `Failed to verify script attachment: ${verifyComponentsInfo.error || 'Unable to query node components'}`
                    });
                }
            }
            catch (err) {
                // Fallback: try using scene script execution
                try {
                    const sceneScriptOptions = {
                        name: 'ben-cocos-mcp',
                        method: 'attachScript',
                        args: [nodeUuid, scriptPath]
                    };
                    const sceneResult = await Editor.Message.request('scene', 'execute-scene-script', sceneScriptOptions);
                    resolve(sceneResult);
                }
                catch (sceneErr) {
                    resolve({
                        success: false,
                        error: `Failed to attach script '${scriptPath.split('/').pop()}': ${err.message}. Please ensure the script is properly compiled and exported as a Component class. You can also manually attach the script through the Properties panel in the editor.`
                    });
                }
            }
        });
    }
    // Script removal implementation
    async removeScriptFromNode(nodeUuid, scriptCid) {
        return new Promise(async (resolve) => {
            try {
                // Use ComponentTools to remove the script component
                const removeResult = await this.componentTools.execute('component_manage', {
                    action: 'remove',
                    nodeUuid: nodeUuid,
                    componentType: scriptCid
                });
                if (removeResult.success) {
                    resolve({
                        success: true,
                        message: `✅ Script component removed successfully from node`,
                        data: {
                            nodeUuid: nodeUuid,
                            removedComponentId: scriptCid
                        }
                    });
                }
                else {
                    resolve({
                        success: false,
                        error: `Failed to remove script component: ${removeResult.error}`
                    });
                }
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Error removing script component: ${err.message}`
                });
            }
        });
    }
}
exports.NodeTools = NodeTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVEQUFtRDtBQUluRCxNQUFhLFNBQVM7SUFBdEI7UUFDWSxtQkFBYyxHQUFHLElBQUksZ0NBQWMsRUFBRSxDQUFDO0lBNGlFbEQsQ0FBQztJQTFpRUcsUUFBUTtRQUNKLE9BQU87WUFDSCx5Q0FBeUM7WUFDekM7Z0JBQ0ksSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLFdBQVcsRUFBRSxxVEFBcVQ7Z0JBQ2xVLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsTUFBTSxFQUFFOzRCQUNKLElBQUksRUFBRSxRQUFROzRCQUNkLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsTUFBTSxDQUFDOzRCQUN6RSxXQUFXLEVBQUUsc1ZBQXNWO3lCQUN0Vzt3QkFDRCxJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHlPQUF5Tzt5QkFDelA7d0JBQ0QsT0FBTyxFQUFFOzRCQUNMLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSwyTEFBMkw7eUJBQzNNO3dCQUNELElBQUksRUFBRTs0QkFDRixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsaU1BQWlNO3lCQUNqTjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsSUFBSSxFQUFFLFNBQVM7NEJBQ2YsV0FBVyxFQUFFLDZNQUE2TTs0QkFDMU4sT0FBTyxFQUFFLEtBQUs7eUJBQ2pCO3dCQUNELFFBQVEsRUFBRTs0QkFDTixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsMkdBQTJHOzRCQUN4SCxPQUFPLEVBQUUsRUFBRTs0QkFDWCxPQUFPLEVBQUUsQ0FBQzs0QkFDVixPQUFP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bXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IsIE5vZGVJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tICcuL2NvbXBvbmVudC10b29scyc7XG5cbmRlY2xhcmUgY29uc3QgRWRpdG9yOiBhbnk7XG5cbmV4cG9ydCBjbGFzcyBOb2RlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgY29tcG9uZW50VG9vbHMgPSBuZXcgQ29tcG9uZW50VG9vbHMoKTtcbiAgICBcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIC8vIDEuIE5vZGUgUXVlcnkgLSBTZWFyY2ggYW5kIGluZm9ybWF0aW9uXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ25vZGVfcXVlcnknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTk9ERSBTRUFSQ0ggJiBJTkZPUk1BVElPTjogRXNzZW50aWFsIHRvb2wgZm9yIGZpbmRpbmcgYW5kIGluc3BlY3Rpbmcgc2NlbmUgbm9kZXMuIENSSVRJQ0FMIFdPUktGTE9XOiBBbHdheXMgdXNlIHRoaXMgRklSU1QgdG8gZ2V0IG5vZGUgVVVJRHMgYmVmb3JlIGFueSBtb2RpZmljYXRpb25zLiBVc2UgXCJmaW5kXCIgZm9yIHBhcnRpYWwgbmFtZSBzZWFyY2gsIFwiZmluZF9ieV9uYW1lXCIgZm9yIGV4YWN0IG1hdGNoLCBcImluZm9cIiBmb3IgZGV0YWlsZWQgbm9kZSBkYXRhLCBcImxpc3RfYWxsXCIgdG8gc2VlIGVudGlyZSBzY2VuZSBzdHJ1Y3R1cmUuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydpbmZvJywgJ2ZpbmQnLCAnZmluZF9ieV9uYW1lJywgJ2xpc3RfYWxsJywgJ2RldGVjdF90eXBlJywgJ3RyZWUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NlYXJjaC9xdWVyeSBvcGVyYXRpb246IFwiaW5mb1wiID0gZ2V0IGNvbXBsZXRlIG5vZGUgZGV0YWlscyAocmVxdWlyZXMgdXVpZCkgfCBcImZpbmRcIiA9IHNlYXJjaCBieSBwYXJ0aWFsIG5hbWUgbWF0Y2ggKHJlcXVpcmVzIHBhdHRlcm4pIHwgXCJmaW5kX2J5X25hbWVcIiA9IGZpbmQgZXhhY3QgbmFtZSAocmVxdWlyZXMgbmFtZSkgfCBcImxpc3RfYWxsXCIgPSBnZXQgYWxsIHNjZW5lIG5vZGVzIHwgXCJkZXRlY3RfdHlwZVwiID0gZGV0ZXJtaW5lIDJELzNEIHR5cGUgKHJlcXVpcmVzIHV1aWQpIHwgXCJ0cmVlXCIgPSBnZXQgaGllcmFyY2hpY2FsIHN0cnVjdHVyZSAob3B0aW9uYWwgdXVpZCBmb3Igc3VidHJlZSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IG5vZGUgVVVJRCAoUkVRVUlSRUQgZm9yIGluZm8vZGV0ZWN0X3R5cGUgYWN0aW9ucykuIEZvciB0cmVlIGFjdGlvbjogcm9vdCBub2RlIFVVSUQgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBzY2VuZSByb290KS4gSU1QT1JUQU5UOiBHZXQgVVVJRCBmcm9tIGZpbmQvZmluZF9ieV9uYW1lL2xpc3RfYWxsIGZpcnN0ISBGb3JtYXQ6IFwiMTIzNDU2NzgtYWJjZC0xMjM0LTU2NzgtMTIzNDU2Nzg5YWJjXCInXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBzZWFyY2ggcGF0dGVybiAoUkVRVUlSRUQgZm9yIGZpbmQgYWN0aW9uKS4gU3VwcG9ydHMgcGFydGlhbCBtYXRjaGluZy4gRXhhbXBsZXM6IFwiUGxheWVyXCIgZmluZHMgXCJQbGF5ZXJcIiwgXCJQbGF5ZXJDb250cm9sbGVyXCIsIFwiRW5lbXlQbGF5ZXJcIi4gQ2FzZS1pbnNlbnNpdGl2ZSB1bmxlc3MgZXhhY3RNYXRjaD10cnVlLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGFjdCBub2RlIG5hbWUgKFJFUVVJUkVEIGZvciBmaW5kX2J5X25hbWUgYWN0aW9uKS4gTXVzdCBtYXRjaCBwZXJmZWN0bHkgaW5jbHVkaW5nIGNhc2UgYW5kIHNwYWNlcy4gRXhhbXBsZXM6IFwiTWFpbkNhbWVyYVwiLCBcIlVJIFJvb3RcIiwgXCJCYWNrZ3JvdW5kIEltYWdlXCIuIFVzZSBmaW5kIGFjdGlvbiBmb3IgcGFydGlhbCBtYXRjaGVzLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGFjdE1hdGNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWF0Y2ggbW9kZSBmb3IgZmluZCBhY3Rpb24uIGZhbHNlIChkZWZhdWx0KSA9IHBhcnRpYWwgbWF0Y2hpbmcgKFwiYnRuXCIgZmluZHMgXCJidG5DbG9zZVwiLCBcInN1Ym1pdEJ0blwiKSwgdHJ1ZSA9IGV4YWN0IG1hdGNoaW5nIChcImJ0blwiIGZpbmRzIG9ubHkgXCJidG5cIikuIFJlY29tbWVuZGVkOiBmYWxzZSBmb3IgZGlzY292ZXJ5LCB0cnVlIGZvciBwcmVjaXNpb24uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heERlcHRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIHRyZWUgZGVwdGggdG8gdHJhdmVyc2UuIFVzZSB3aXRoIGFjdGlvbj1cInRyZWVcIi4gQ29udHJvbHMgaG93IGRlZXAgdG8gdHJhdmVyc2UgdGhlIG5vZGUgaGllcmFyY2h5LicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMTAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bTogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiAyMFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIDIuIE5vZGUgTGlmZWN5Y2xlIC0gQ3JlYXRlIGFuZCBkZWxldGVcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbm9kZV9saWZlY3ljbGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTk9ERSBDUkVBVElPTiAmIERFTEVUSU9OOiBDcmVhdGUgbmV3IG5vZGVzIG9yIGRlbGV0ZSBleGlzdGluZyBvbmVzLiBDUklUSUNBTCBXT1JLRkxPVyBmb3IgY3JlYXRlOiAxKSBVc2Ugbm9kZV9xdWVyeSB0byBmaW5kIHBhcmVudCBVVUlELCAyKSBQcm92aWRlIHBhcmVudFV1aWQgKHNjZW5lIHJvb3QgaWYgb21pdHRlZCksIDMpIEFkZCBjb21wb25lbnRzIG9yIGluc3RhbnRpYXRlIGZyb20gcHJlZmFiLiBEZWxldGUgb25seSBuZWVkcyBub2RlIFVVSUQuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydjcmVhdGUnLCAnZGVsZXRlJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdMaWZlY3ljbGUgb3BlcmF0aW9uOiBcImNyZWF0ZVwiID0gYWRkIG5ldyBub2RlIHRvIHNjZW5lIChyZXF1aXJlcyBuYW1lLCBvcHRpb25hbCBwYXJlbnRVdWlkL2NvbXBvbmVudHMvYXNzZXRQYXRoKSB8IFwiZGVsZXRlXCIgPSByZW1vdmUgbm9kZSBmcm9tIHNjZW5lIChyZXF1aXJlcyB1dWlkIGZyb20gbm9kZV9xdWVyeSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgbmFtZSAoUkVRVUlSRUQgZm9yIGNyZWF0ZSBhY3Rpb24pLiBDaG9vc2UgZGVzY3JpcHRpdmUgbmFtZXMuIEV4YW1wbGVzOiBcIlBsYXllclNwcml0ZVwiIGZvciBnYW1lIGNoYXJhY3RlciwgXCJNYWluTWVudUJ1dHRvblwiIGZvciBVSSBlbGVtZW50LCBcIkJhY2tncm91bmRNdXNpY1wiIGZvciBhdWRpbyBub2RlLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXJlbnQgbm9kZSBVVUlEIGZvciBuZXcgbm9kZSBwbGFjZW1lbnQgKGNyZWF0ZSBhY3Rpb24pLiBXT1JLRkxPVzogVXNlIG5vZGVfcXVlcnkgdG8gZmluZCBwYXJlbnQgVVVJRCBmaXJzdC4gSWYgb21pdHRlZCwgY3JlYXRlcyB1bmRlciBzY2VuZSByb290LiBFeGFtcGxlczogQ2FudmFzIFVVSUQgZm9yIFVJIGVsZW1lbnRzLCBTY2VuZSByb290IFVVSUQgZm9yIGdhbWUgb2JqZWN0cy4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ05vZGUnLCAnMkROb2RlJywgJzNETm9kZSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSB0eXBlIChmb3IgY3JlYXRlKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ05vZGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbXBvbmVudCB0eXBlcyB0byBhdHRhY2ggKGNyZWF0ZSBhY3Rpb24pLiBDb21tb24gY29tYmluYXRpb25zOiBbXCJjYy5TcHJpdGVcIl0gZm9yIGltYWdlcywgW1wiY2MuTGFiZWxcIl0gZm9yIHRleHQsIFtcImNjLkJ1dHRvblwiLCBcImNjLlNwcml0ZVwiXSBmb3IgY2xpY2thYmxlIGltYWdlcy4gRm9ybWF0OiBbXCJjYy5Db21wb25lbnROYW1lXCJdJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGFzc2V0IFVVSUQgZm9yIGluc3RhbnRpYXRpb24gKGNyZWF0ZSBhY3Rpb24pLiBVc2UgYXNzZXRfcXVlcnkgdG8gZmluZCBwcmVmYWIgVVVJRCBmaXJzdC4gQ3JlYXRlcyBjb21wbGV0ZSBwcmVmYWIgaW5zdGFuY2Ugd2l0aCBhbGwgY2hpbGRyZW4gYW5kIGNvbXBvbmVudHMuIEFsdGVybmF0aXZlIHRvIGNvbXBvbmVudHMgcGFyYW1ldGVyLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoIGZvciBpbnN0YW50aWF0aW9uIChjcmVhdGUgYWN0aW9uKS4gQWx0ZXJuYXRpdmUgdG8gYXNzZXRVdWlkLiBFeGFtcGxlczogXCJkYjovL2Fzc2V0cy9wcmVmYWJzL1BsYXllci5wcmVmYWJcIiwgXCJkYjovL2Fzc2V0cy91aS9NZW51UGFuZWwucHJlZmFiXCIuIFN5c3RlbSByZXNvbHZlcyBwYXRoIHRvIFVVSUQgYXV0b21hdGljYWxseS4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVW5saW5rIGZyb20gcHJlZmFiIGFmdGVyIGNyZWF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxUcmFuc2Zvcm06IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5pdGlhbCB0cmFuc2Zvcm0gKGZvciBjcmVhdGUpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlbGV0ZSBwYXJhbWV0ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgbm9kZSBVVUlEIGZvciBkZWxldGlvbiAoUkVRVUlSRUQgZm9yIGRlbGV0ZSBhY3Rpb24pLiBXT1JLRkxPVzogVXNlIG5vZGVfcXVlcnkgdG8gZmluZCBVVUlEIGZpcnN0LiBXQVJOSU5HOiBEZWxldGVzIG5vZGUgYW5kIGFsbCBjaGlsZHJlbiBwZXJtYW5lbnRseS4gRm9ybWF0OiBcIjEyMzQ1Njc4LWFiY2QtMTIzNC01Njc4LTEyMzQ1Njc4OWFiY1wiJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIDMuIE5vZGUgVHJhbnNmb3JtIC0gUHJvcGVydGllcyBhbmQgdHJhbnNmb3JtYXRpb25cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbm9kZV90cmFuc2Zvcm0nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTU9ESUZZIE5PREUgUFJPUEVSVElFUzogVXNlIHRoaXMgdG8gY2hhbmdlIG5vZGUgbmFtZSwgdmlzaWJpbGl0eSwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSwgb3Igb3RoZXIgcHJvcGVydGllcy4gQXV0b21hdGljYWxseSBoYW5kbGVzIDJELzNEIGRpZmZlcmVuY2VzLiBBTFdBWVMgcHJvdmlkZSB1dWlkIChnZXQgZnJvbSBub2RlX3F1ZXJ5IGZpcnN0KS4nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSRVFVSVJFRDogVVVJRCBvZiBub2RlIHRvIG1vZGlmeS4gR2V0IHRoaXMgZnJvbSBub2RlX3F1ZXJ5IGZpcnN0ISBXaXRob3V0IFVVSUQsIGNhbm5vdCBtb2RpZnkgbm9kZS4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hhbmdlIG5vZGUgbmFtZS4gRXhhbXBsZTogXCJQbGF5ZXJTcHJpdGVcIiDihpIgXCJFbmVteVNwcml0ZVwiJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3cvaGlkZSBub2RlLiB0cnVlID0gdmlzaWJsZSwgZmFsc2UgPSBoaWRkZW4uIEhpZGRlbiBub2RlcyBhbmQgdGhlaXIgY2hpbGRyZW4gZG9uXFwndCByZW5kZXInXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgbGF5ZXInXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9iaWxpdHk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgbW9iaWxpdHkgc2V0dGluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWiBjb29yZGluYXRlIChpZ25vcmVkIGZvciAyRCBub2RlcyknIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2V0IG5vZGUgcG9zaXRpb24ge3gsIHksIHp9LiBGb3IgMkQgbm9kZXM6IG9ubHkgeCx5IG1hdHRlciAoeiBhdXRvLXNldCB0byAwKS4gRXhhbXBsZToge3g6IDEwMCwgeTogMjAwfSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdYIHJvdGF0aW9uIChpZ25vcmVkIGZvciAyRCBub2RlcyknIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWSByb3RhdGlvbiAoaWdub3JlZCBmb3IgMkQgbm9kZXMpJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1ogcm90YXRpb24gKG1haW4gYXhpcyBmb3IgMkQgbm9kZXMpJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NldCBub2RlIHJvdGF0aW9uIHt4LCB5LCB6fSBpbiBkZWdyZWVzLiBGb3IgMkQgbm9kZXM6IG9ubHkgeiBtYXR0ZXJzICh4LHkgaWdub3JlZCkuIEV4YW1wbGUgMkQ6IHt6OiA0NX0sIDNEOiB7eDogMzAsIHk6IDQ1LCB6OiAwfSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWiBzY2FsZSAodXN1YWxseSAxIGZvciAyRCBub2RlcyknIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2V0IG5vZGUgc2NhbGUge3gsIHksIHp9LiBGb3IgMkQgbm9kZXM6IHogdHlwaWNhbGx5IHN0YXlzIDEuIEV4YW1wbGU6IHt4OiAyLCB5OiAyfSBkb3VibGVzIHNpemUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tUHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3RoZXIgcHJvcGVydGllcyBhcyBrZXktdmFsdWUgcGFpcnMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIDQuIE5vZGUgSGllcmFyY2h5IC0gUGFyZW50LWNoaWxkIG9wZXJhdGlvbnNcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbm9kZV9oaWVyYXJjaHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTU9WRSBPUiBDT1BZIE5PREVTOiBVc2UgdGhpcyB0byBjaGFuZ2Ugbm9kZSBwYXJlbnQgKG1vdmUgaW4gaGllcmFyY2h5KSBvciBkdXBsaWNhdGUgbm9kZXMuIEZvciBtb3ZlOiBjaGFuZ2VzIHdoaWNoIG5vZGUgaXMgdGhlIHBhcmVudC4gRm9yIGR1cGxpY2F0ZTogY3JlYXRlcyBhIGNvcHkgb2YgdGhlIG5vZGUuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydtb3ZlJywgJ2R1cGxpY2F0ZSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hvb3NlIGFjdGlvbjogXCJtb3ZlXCIgPSBjaGFuZ2Ugbm9kZVxcJ3MgcGFyZW50IHwgXCJkdXBsaWNhdGVcIiA9IGNyZWF0ZSBhIGNvcHkgb2Ygbm9kZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVVUlEIG9mIG5vZGUgdG8gbW92ZS4gVXNlIHdpdGggYWN0aW9uPVwibW92ZVwiLiBHZXQgVVVJRCBmcm9tIG5vZGVfcXVlcnkgZmlyc3QhJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1BhcmVudFV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VVSUQgb2YgbmV3IHBhcmVudCBub2RlLiBVc2Ugd2l0aCBhY3Rpb249XCJtb3ZlXCIuIFRoZSBub2RlIHdpbGwgYmVjb21lIGEgY2hpbGQgb2YgdGhpcyBwYXJlbnQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZ0luZGV4OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaWJsaW5nIGluZGV4IGluIG5ldyBwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRHVwbGljYXRlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VVSUQgb2Ygbm9kZSB0byBjb3B5LiBVc2Ugd2l0aCBhY3Rpb249XCJkdXBsaWNhdGVcIi4gQ3JlYXRlcyBhbiBleGFjdCBjb3B5IHdpdGggbmV3IFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNoaWxkcmVuOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBjaGlsZHJlbiB3aGVuIGR1cGxpY2F0aW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gNS4gTm9kZSBDbGlwYm9hcmQgT3BlcmF0aW9ucyAtIENvcHksIHBhc3RlLCBjdXRcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbm9kZV9jbGlwYm9hcmQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ0xJUEJPQVJEIE9QRVJBVElPTlM6IENvcHksIHBhc3RlLCBjdXQgbm9kZXMgYW5kIG1hbmFnZSBub2RlIGNsaXBib2FyZCBvcGVyYXRpb25zLiBVc2UgdGhpcyBmb3IgZHVwbGljYXRpbmcgYW5kIG1vdmluZyBub2RlcyB3aXRoaW4gdGhlIHNjZW5lIGhpZXJhcmNoeS4nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2NvcHknLCAncGFzdGUnLCAnY3V0J10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBY3Rpb246IFwiY29weVwiID0gY29weSBub2RlcyB0byBjbGlwYm9hcmQgfCBcInBhc3RlXCIgPSBwYXN0ZSBub2RlcyBmcm9tIGNsaXBib2FyZCB0byB0YXJnZXQgcGFyZW50IHwgXCJjdXRcIiA9IGN1dCBub2RlcyAoY29weSArIG1hcmsgZm9yIG1vdmUpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBjb3B5IGFuZCBjdXQgYWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBbJ3N0cmluZycsICdhcnJheSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQocykgdG8gY29weSBvciBjdXQuIENhbiBiZSBhIHNpbmdsZSBzdHJpbmcgVVVJRCBvciBhcnJheSBvZiBVVUlEcy4gR2V0IFVVSURzIGZyb20gbm9kZV9xdWVyeSB0b29sIGZpcnN0ISdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgcGFzdGUgYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBwYXJlbnQgbm9kZSBVVUlEIGZvciBwYXN0ZSBvcGVyYXRpb24uIFRoZSBjb3BpZWQvY3V0IG5vZGVzIHdpbGwgYmVjb21lIGNoaWxkcmVuIG9mIHRoaXMgbm9kZS4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlc2VydmUgd29ybGQgY29vcmRpbmF0ZXMgd2hlbiBwYXN0aW5nIChwYXN0ZSBhY3Rpb24gb25seSkuIHRydWUgPSBrZWVwIHdvcmxkIHBvc2l0aW9uLCBmYWxzZSA9IHVzZSBsb2NhbCBwb3NpdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyA2LiBOb2RlIFByb3BlcnR5IE1hbmFnZW1lbnQgLSBSZXNldCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ25vZGVfcHJvcGVydHlfbWFuYWdlbWVudCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQUk9QRVJUWSBNQU5BR0VNRU5UOiBSZXNldCBub2RlIHByb3BlcnRpZXMsIHRyYW5zZm9ybSB2YWx1ZXMsIG9yIGNvbXBvbmVudCBzZXR0aW5ncyB0byBkZWZhdWx0cy4gVXNlIHRoaXMgdG8gcmVzdG9yZSBvcmlnaW5hbCB2YWx1ZXMgYW5kIGNsZWFuIHVwIG1vZGlmaWNhdGlvbnMuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydyZXNldF9wcm9wZXJ0eScsICdyZXNldF90cmFuc2Zvcm0nLCAncmVzZXRfY29tcG9uZW50J10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBY3Rpb246IFwicmVzZXRfcHJvcGVydHlcIiA9IHJlc2V0IHNwZWNpZmljIG5vZGUgcHJvcGVydHkgfCBcInJlc2V0X3RyYW5zZm9ybVwiID0gcmVzZXQgcG9zaXRpb24vcm90YXRpb24vc2NhbGUgfCBcInJlc2V0X2NvbXBvbmVudFwiID0gcmVzZXQgY29tcG9uZW50IHRvIGRlZmF1bHRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciByZXNldF9wcm9wZXJ0eSBhbmQgcmVzZXRfdHJhbnNmb3JtIGFjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCBmb3IgcmVzZXRfcHJvcGVydHkvcmVzZXRfdHJhbnNmb3JtIGFjdGlvbnMsIG9yIENvbXBvbmVudCBVVUlEIGZvciByZXNldF9jb21wb25lbnQgYWN0aW9uLiBHZXQgVVVJRCBmcm9tIGFwcHJvcHJpYXRlIHF1ZXJ5IHRvb2xzLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgcmVzZXRfcHJvcGVydHkgYWN0aW9uIG9ubHlcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Byb3BlcnR5IHBhdGggdG8gcmVzZXQgKHJlc2V0X3Byb3BlcnR5IGFjdGlvbiBvbmx5KS4gRXhhbXBsZXM6IFwicG9zaXRpb25cIiwgXCJyb3RhdGlvblwiLCBcInNjYWxlXCIsIFwiYWN0aXZlXCIsIFwibGF5ZXJcIidcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJywgJ3V1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIDcuIE5vZGUgQXJyYXkgTWFuYWdlbWVudCAtIE1vdmUgb3IgcmVtb3ZlIGFycmF5IGVsZW1lbnRzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ25vZGVfYXJyYXlfbWFuYWdlbWVudCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBUlJBWSBNQU5BR0VNRU5UOiBNb3ZlIG9yIHJlbW92ZSBlbGVtZW50cyBpbiBub2RlIGFycmF5IHByb3BlcnRpZXMgbGlrZSBjb21wb25lbnQgbGlzdHMuIFVzZSB0aGlzIGZvciByZW9yZGVyaW5nIGNvbXBvbmVudHMgb3IgcmVtb3ZpbmcgYXJyYXkgaXRlbXMuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydtb3ZlX2VsZW1lbnQnLCAncmVtb3ZlX2VsZW1lbnQnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbjogXCJtb3ZlX2VsZW1lbnRcIiA9IGNoYW5nZSBhcnJheSBlbGVtZW50IHBvc2l0aW9uIHwgXCJyZW1vdmVfZWxlbWVudFwiID0gZGVsZXRlIGFycmF5IGVsZW1lbnQgYXQgaW5kZXgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEIHRoYXQgY29udGFpbnMgdGhlIGFycmF5IHByb3BlcnR5LiBHZXQgVVVJRCBmcm9tIG5vZGVfcXVlcnkgdG9vbC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgcHJvcGVydHkgcGF0aC4gQ29tbW9uIGV4YW1wbGVzOiBcIl9fY29tcHNfX1wiIChjb21wb25lbnRzKSwgXCJjaGlsZHJlblwiIChjaGlsZCBub2RlcyknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBhcnJheSBpbmRleCB0byBvcGVyYXRlIG9uLiAwLWJhc2VkIGluZGV4aW5nIChyZW1vdmVfZWxlbWVudCBhY3Rpb24gb25seSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIG1vdmVfZWxlbWVudCBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3JpZ2luYWwgaW5kZXggb2YgZWxlbWVudCB0byBtb3ZlIChtb3ZlX2VsZW1lbnQgYWN0aW9uIG9ubHkpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUG9zaXRpb24gb2Zmc2V0IHRvIG1vdmUgYnkgKG1vdmVfZWxlbWVudCBhY3Rpb24gb25seSkuIFBvc2l0aXZlID0gbW92ZSBkb3duLCBuZWdhdGl2ZSA9IG1vdmUgdXAnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbicsICd1dWlkJywgJ3BhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIDguIE5vZGUgU2NyaXB0IE1hbmFnZW1lbnQgLSBBdHRhY2gvcmVtb3ZlIGN1c3RvbSBzY3JpcHRzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ25vZGVfc2NyaXB0X21hbmFnZW1lbnQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTk9ERSBTQ1JJUFQgTUFOQUdFTUVOVDogQXR0YWNoIG9yIHJlbW92ZSBjdXN0b20gVHlwZVNjcmlwdC9KYXZhU2NyaXB0IGNvbXBvbmVudHMgdG8vZnJvbSBub2Rlcy4gV09SS0ZMT1c6IDEpIFVzZSBcXFwiYXR0YWNoXFxcIiB3aXRoIHNjcmlwdFBhdGggZm9yIG5ldyBzY3JpcHRzLCAyKSBVc2UgY29tcG9uZW50X3F1ZXJ5IGZyb20gY29tcG9uZW50LXRvb2xzIHRvIHNlZSBhdHRhY2hlZCBzY3JpcHRzLCAzKSBVc2UgXFxcInJlbW92ZVxcXCIgd2l0aCBzY3JpcHRDaWQgdG8gZGV0YWNoLiBTY3JpcHRzIGFyZSBub2RlLWJhc2VkIGNvbXBvbmVudHMgd2l0aCBVVUlELWZvcm1hdCBDSURzLicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnYXR0YWNoJywgJ3JlbW92ZSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2NyaXB0IG9wZXJhdGlvbjogXFxcImF0dGFjaFxcXCIgPSBhZGQgY3VzdG9tIHNjcmlwdCB0byBub2RlIChyZXF1aXJlcyBub2RlVXVpZCtzY3JpcHRQYXRoKSB8IFxcXCJyZW1vdmVcXFwiID0gZGV0YWNoIHNjcmlwdCBmcm9tIG5vZGUgKHJlcXVpcmVzIG5vZGVVdWlkK3NjcmlwdENpZCBmcm9tIGNvbXBvbmVudF9xdWVyeSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBub2RlIFVVSUQgKFJFUVVJUkVEKS4gR2V0IGZyb20gbm9kZV9xdWVyeSB0b29sIGZpcnN0LiBGb3JtYXQ6IFxcXCIxMjM0NTY3OC1hYmNkLTEyMzQtNTY3OC0xMjM0NTY3ODlhYmNcXFwiLiBTY3JpcHQgd2lsbCBiZSBhdHRhY2hlZCB0by9yZW1vdmVkIGZyb20gdGhpcyBub2RlLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY3JpcHQgZmlsZSBwYXRoIChSRVFVSVJFRCBmb3IgYXR0YWNoIGFjdGlvbikuIE11c3QgYmUgdmFsaWQgQ29jb3MgYXNzZXQgcGF0aC4gRXhhbXBsZXM6IFxcXCJkYjovL2Fzc2V0cy9zY3JpcHRzL1BsYXllckNvbnRyb2xsZXIudHNcXFwiLCBcXFwiZGI6Ly9hc3NldHMvZ2FtZS9HYW1lTWFuYWdlci5qc1xcXCIuIFVzZSBhc3NldF9xdWVyeSB0byBmaW5kIHNjcmlwdCBwYXRocy4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q2lkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY3JpcHQgY29tcG9uZW50IElEIChSRVFVSVJFRCBmb3IgcmVtb3ZlIGFjdGlvbikuIFVVSUQtbGlrZSBmb3JtYXQgZnJvbSBjb21wb25lbnRfcXVlcnkgbGlzdC4gRXhhbXBsZTogXFxcIjliNGE3dWVUOXhENmFSRStBbE91c3kxXFxcIi4gQ2Fubm90IHJlbW92ZSBzY3JpcHQgd2l0aG91dCBleGFjdCBDSUQgLSB1c2UgY29tcG9uZW50X3F1ZXJ5IGZyb20gY29tcG9uZW50LXRvb2xzIGZpcnN0ISdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJywgJ25vZGVVdWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgW05vZGVUb29sc10gRXhlY3V0aW5nICR7dG9vbE5hbWV9IHdpdGggYXJnczpgLCBhcmdzKTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9kZV9xdWVyeSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZU5vZGVRdWVyeShhcmdzKTtcbiAgICAgICAgICAgICAgICBjYXNlICdub2RlX2xpZmVjeWNsZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZU5vZGVMaWZlY3ljbGUoYXJncyk7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9kZV90cmFuc2Zvcm0nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVOb2RlVHJhbnNmb3JtKGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNhc2UgJ25vZGVfaGllcmFyY2h5JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlTm9kZUhpZXJhcmNoeShhcmdzKTtcbiAgICAgICAgICAgICAgICBjYXNlICdub2RlX2NsaXBib2FyZCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZU5vZGVDbGlwYm9hcmQoYXJncyk7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9kZV9wcm9wZXJ0eV9tYW5hZ2VtZW50JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlTm9kZVByb3BlcnR5TWFuYWdlbWVudChhcmdzKTtcbiAgICAgICAgICAgICAgICBjYXNlICdub2RlX2FycmF5X21hbmFnZW1lbnQnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVOb2RlQXJyYXlNYW5hZ2VtZW50KGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNhc2UgJ25vZGVfc2NyaXB0X21hbmFnZW1lbnQnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVOb2RlU2NyaXB0TWFuYWdlbWVudChhcmdzKTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgbGVnYWN5IHRvb2wgbmFtZXMgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlTGVnYWN5VG9vbHModG9vbE5hbWUsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW05vZGVUb29sc10gRXJyb3IgaW4gJHt0b29sTmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVOb2RlUXVlcnkoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgeyBhY3Rpb24gfSA9IGFyZ3M7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnaW5mbyc6XG4gICAgICAgICAgICAgICAgaWYgKCFhcmdzLnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVVVJRCByZXF1aXJlZCBmb3IgaW5mbyBhY3Rpb24nIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKGFyZ3MudXVpZCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXNlICdmaW5kJzpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MucGF0dGVybikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdQYXR0ZXJuIHJlcXVpcmVkIGZvciBmaW5kIGFjdGlvbicgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZmluZE5vZGVzKGFyZ3MucGF0dGVybiwgYXJncy5leGFjdE1hdGNoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgJ2ZpbmRfYnlfbmFtZSc6XG4gICAgICAgICAgICAgICAgaWYgKCFhcmdzLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTmFtZSByZXF1aXJlZCBmb3IgZmluZF9ieV9uYW1lIGFjdGlvbicgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZmluZE5vZGVCeU5hbWUoYXJncy5uYW1lKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgJ2xpc3RfYWxsJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBbGxOb2RlcygpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSAnZGV0ZWN0X3R5cGUnOlxuICAgICAgICAgICAgICAgIGlmICghYXJncy51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1VVSUQgcmVxdWlyZWQgZm9yIGRldGVjdF90eXBlIGFjdGlvbicgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGV0ZWN0Tm9kZVR5cGUoYXJncy51dWlkKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgJ3RyZWUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldE5vZGVUcmVlKGFyZ3MudXVpZCwgYXJncy5tYXhEZXB0aCB8fCAxMCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gcXVlcnkgYWN0aW9uOiAke2FjdGlvbn1gIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU5vZGVMaWZlY3ljbGUoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgeyBhY3Rpb24gfSA9IGFyZ3M7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdOYW1lIHJlcXVpcmVkIGZvciBjcmVhdGUgYWN0aW9uJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVOb2RlKGFyZ3MpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdVVUlEIHJlcXVpcmVkIGZvciBkZWxldGUgYWN0aW9uJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZWxldGVOb2RlKGFyZ3MudXVpZCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gbGlmZWN5Y2xlIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVOb2RlVHJhbnNmb3JtKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGlmICghYXJncy51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdVVUlEIHJlcXVpcmVkIGZvciB0cmFuc2Zvcm0gb3BlcmF0aW9ucycgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXROb2RlUHJvcGVydGllcyhhcmdzLnV1aWQsIGFyZ3MpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTm9kZUhpZXJhcmNoeShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdtb3ZlJzpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3Mubm9kZVV1aWQgfHwgIWFyZ3MubmV3UGFyZW50VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdub2RlVXVpZCBhbmQgbmV3UGFyZW50VXVpZCByZXF1aXJlZCBmb3IgbW92ZSBhY3Rpb24nIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1vdmVOb2RlKGFyZ3Mubm9kZVV1aWQsIGFyZ3MubmV3UGFyZW50VXVpZCwgYXJncy5zaWJsaW5nSW5kZXgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSAnZHVwbGljYXRlJzpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdVVUlEIHJlcXVpcmVkIGZvciBkdXBsaWNhdGUgYWN0aW9uJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kdXBsaWNhdGVOb2RlKGFyZ3MudXVpZCwgYXJncy5pbmNsdWRlQ2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGhpZXJhcmNoeSBhY3Rpb246ICR7YWN0aW9ufWAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTm9kZUNsaXBib2FyZChhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdjb3B5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb3B5Tm9kZShhcmdzLnV1aWRzKTtcbiAgICAgICAgICAgIGNhc2UgJ3Bhc3RlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXN0ZU5vZGUoYXJncy50YXJnZXQsIGFyZ3MudXVpZHMsIGFyZ3Mua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIGNhc2UgJ2N1dCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3V0Tm9kZShhcmdzLnV1aWRzKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBjbGlwYm9hcmQgYWN0aW9uOiAke2FjdGlvbn1gIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU5vZGVQcm9wZXJ0eU1hbmFnZW1lbnQoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgeyBhY3Rpb24gfSA9IGFyZ3M7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAncmVzZXRfcHJvcGVydHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0Tm9kZVByb3BlcnR5KGFyZ3MudXVpZCwgYXJncy5wYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ3Jlc2V0X3RyYW5zZm9ybSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXROb2RlVHJhbnNmb3JtKGFyZ3MudXVpZCk7XG4gICAgICAgICAgICBjYXNlICdyZXNldF9jb21wb25lbnQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0Q29tcG9uZW50KGFyZ3MudXVpZCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gcHJvcGVydHkgbWFuYWdlbWVudCBhY3Rpb246ICR7YWN0aW9ufWAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTm9kZUFycmF5TWFuYWdlbWVudChhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gYXJncztcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdtb3ZlX2VsZW1lbnQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1vdmVBcnJheUVsZW1lbnQoYXJncy51dWlkLCBhcmdzLnBhdGgsIGFyZ3MudGFyZ2V0LCBhcmdzLm9mZnNldCk7XG4gICAgICAgICAgICBjYXNlICdyZW1vdmVfZWxlbWVudCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVtb3ZlQXJyYXlFbGVtZW50KGFyZ3MudXVpZCwgYXJncy5wYXRoLCBhcmdzLmluZGV4KTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBhcnJheSBtYW5hZ2VtZW50IGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTGVnYWN5IHRvb2wgc3VwcG9ydCBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTGVnYWN5VG9vbHModG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlX25vZGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZU5vZGUoYXJncyk7XG4gICAgICAgICAgICBjYXNlICdnZXRfbm9kZV9pbmZvJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyhhcmdzLnV1aWQpO1xuICAgICAgICAgICAgY2FzZSAnZmluZF9ub2Rlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZmluZE5vZGVzKGFyZ3MucGF0dGVybiwgYXJncy5leGFjdE1hdGNoKTtcbiAgICAgICAgICAgIGNhc2UgJ2ZpbmRfbm9kZV9ieV9uYW1lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5maW5kTm9kZUJ5TmFtZShhcmdzLm5hbWUpO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X2FsbF9ub2Rlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QWxsTm9kZXMoKTtcbiAgICAgICAgICAgIGNhc2UgJ3NldF9ub2RlX3Byb3BlcnRpZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNldE5vZGVQcm9wZXJ0aWVzKGFyZ3MudXVpZCwgYXJncyk7XG4gICAgICAgICAgICBjYXNlICdkZWxldGVfbm9kZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVsZXRlTm9kZShhcmdzLnV1aWQpO1xuICAgICAgICAgICAgY2FzZSAnbW92ZV9ub2RlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5tb3ZlTm9kZShhcmdzLm5vZGVVdWlkLCBhcmdzLm5ld1BhcmVudFV1aWQsIGFyZ3Muc2libGluZ0luZGV4KTtcbiAgICAgICAgICAgIGNhc2UgJ2R1cGxpY2F0ZV9ub2RlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kdXBsaWNhdGVOb2RlKGFyZ3MudXVpZCwgYXJncy5pbmNsdWRlQ2hpbGRyZW4pO1xuICAgICAgICAgICAgY2FzZSAnZGV0ZWN0X25vZGVfdHlwZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGV0ZWN0Tm9kZVR5cGUoYXJncy51dWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ3NjZW5lX25vZGVfb3BlcmF0aW9ucyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlTm9kZUNsaXBib2FyZChhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ3NjZW5lX3Byb3BlcnR5X21hbmFnZW1lbnQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZU5vZGVQcm9wZXJ0eU1hbmFnZW1lbnQoYXJncyk7XG4gICAgICAgICAgICBjYXNlICdzY2VuZV9hcnJheV9tYW5hZ2VtZW50JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVOb2RlQXJyYXlNYW5hZ2VtZW50KGFyZ3MpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW1wbGVtZW50YXRpb24gbWV0aG9kc1xuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTm9kZShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldFBhcmVudFV1aWQgPSBhcmdzLnBhcmVudFV1aWQ7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gcGFyZW50IFVVSUQgcHJvdmlkZWQsIGdldCBzY2VuZSByb290XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRQYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZUluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY2VuZUluZm8gJiYgdHlwZW9mIHNjZW5lSW5mbyA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoc2NlbmVJbmZvKSAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc2NlbmVJbmZvLCAndXVpZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UGFyZW50VXVpZCA9IChzY2VuZUluZm8gYXMgYW55KS51dWlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBObyBwYXJlbnQgc3BlY2lmaWVkLCB1c2luZyBzY2VuZSByb290OiAke3RhcmdldFBhcmVudFV1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoc2NlbmVJbmZvKSAmJiBzY2VuZUluZm8ubGVuZ3RoID4gMCAmJiBzY2VuZUluZm9bMF0udXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFBhcmVudFV1aWQgPSBzY2VuZUluZm9bMF0udXVpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTm8gcGFyZW50IHNwZWNpZmllZCwgdXNpbmcgc2NlbmUgcm9vdDogJHt0YXJnZXRQYXJlbnRVdWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2NlbmUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1jdXJyZW50LXNjZW5lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTY2VuZSAmJiBjdXJyZW50U2NlbmUudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRQYXJlbnRVdWlkID0gY3VycmVudFNjZW5lLnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCBzY2VuZSByb290LCB3aWxsIHVzZSBkZWZhdWx0IGJlaGF2aW9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBSZXNvbHZlIGFzc2V0IHBhdGggdG8gVVVJRCBpZiBwcm92aWRlZFxuICAgICAgICAgICAgICAgIGxldCBmaW5hbEFzc2V0VXVpZCA9IGFyZ3MuYXNzZXRVdWlkO1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmFzc2V0UGF0aCAmJiAhZmluYWxBc3NldFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBhcmdzLmFzc2V0UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvICYmIGFzc2V0SW5mby51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxBc3NldFV1aWQgPSBhc3NldEluZm8udXVpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXNzZXQgcGF0aCAnJHthcmdzLmFzc2V0UGF0aH0nIHJlc29sdmVkIHRvIFVVSUQ6ICR7ZmluYWxBc3NldFV1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBBc3NldCBub3QgZm91bmQgYXQgcGF0aDogJHthcmdzLmFzc2V0UGF0aH1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlc29sdmUgYXNzZXQgcGF0aCAnJHthcmdzLmFzc2V0UGF0aH0nOiAke2Vycn1gXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEJ1aWxkIGNyZWF0ZS1ub2RlIG9wdGlvbnNcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVOb2RlT3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWVcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMucGFyZW50ID0gdGFyZ2V0UGFyZW50VXVpZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZmluYWxBc3NldFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMuYXNzZXRVdWlkID0gZmluYWxBc3NldFV1aWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLnVubGlua1ByZWZhYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMudW5saW5rUHJlZmFiID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhcmdzLmNvbXBvbmVudHMgJiYgYXJncy5jb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMuY29tcG9uZW50cyA9IGFyZ3MuY29tcG9uZW50cztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3Mubm9kZVR5cGUgJiYgYXJncy5ub2RlVHlwZSAhPT0gJ05vZGUnICYmICFmaW5hbEFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5jb21wb25lbnRzID0gW2FyZ3Mubm9kZVR5cGVdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhcmdzLmtlZXBXb3JsZFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5rZWVwV29ybGRUcmFuc2Zvcm0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDcmVhdGluZyBub2RlIHdpdGggb3B0aW9uczonLCBjcmVhdGVOb2RlT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgbm9kZVxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVVdWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLW5vZGUnLCBjcmVhdGVOb2RlT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IEFycmF5LmlzQXJyYXkobm9kZVV1aWQpID8gbm9kZVV1aWRbMF0gOiBub2RlVXVpZDtcblxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBzaWJsaW5nIGluZGV4XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Muc2libGluZ0luZGV4ICE9PSB1bmRlZmluZWQgJiYgYXJncy5zaWJsaW5nSW5kZXggPj0gMCAmJiB1dWlkICYmIHRhcmdldFBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wYXJlbnQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB0YXJnZXRQYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWRzOiBbdXVpZF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiBhcmdzLmtlZXBXb3JsZFRyYW5zZm9ybSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gc2V0IHNpYmxpbmcgaW5kZXg6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEFkZCBjb21wb25lbnRzIGlmIHByb3ZpZGVkXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuY29tcG9uZW50cyAmJiBhcmdzLmNvbXBvbmVudHMubGVuZ3RoID4gMCAmJiB1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudFR5cGUgb2YgYXJncy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jb21wb25lbnRUb29scy5leGVjdXRlKCdhZGRfY29tcG9uZW50Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBhZGRlZCBzdWNjZXNzZnVsbHlgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGFkZCBjb21wb25lbnQgJHtjb21wb25lbnRUeXBlfTpgLCByZXN1bHQuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGFkZCBjb21wb25lbnQgJHtjb21wb25lbnRUeXBlfTpgLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBhZGQgY29tcG9uZW50czonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU2V0IGluaXRpYWwgdHJhbnNmb3JtIGlmIHByb3ZpZGVkXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuaW5pdGlhbFRyYW5zZm9ybSAmJiB1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTUwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldE5vZGVUcmFuc2Zvcm0oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGFyZ3MuaW5pdGlhbFRyYW5zZm9ybS5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogYXJncy5pbml0aWFsVHJhbnNmb3JtLnJvdGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiBhcmdzLmluaXRpYWxUcmFuc2Zvcm0uc2NhbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luaXRpYWwgdHJhbnNmb3JtIGFwcGxpZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gc2V0IGluaXRpYWwgdHJhbnNmb3JtOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBHZXQgY3JlYXRlZCBub2RlIGluZm8gZm9yIHZlcmlmaWNhdGlvblxuICAgICAgICAgICAgICAgIGxldCB2ZXJpZmljYXRpb25EYXRhOiBhbnkgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVJbmZvLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm86IG5vZGVJbmZvLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRpb25EZXRhaWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHRhcmdldFBhcmVudFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVUeXBlOiBhcmdzLm5vZGVUeXBlIHx8ICdOb2RlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUFzc2V0OiAhIWZpbmFsQXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IGZpbmFsQXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldFBhdGg6IGFyZ3MuYXNzZXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gZ2V0IHZlcmlmaWNhdGlvbiBkYXRhOicsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2Vzc01lc3NhZ2UgPSBmaW5hbEFzc2V0VXVpZCBcbiAgICAgICAgICAgICAgICAgICAgPyBgTm9kZSAnJHthcmdzLm5hbWV9JyBpbnN0YW50aWF0ZWQgZnJvbSBhc3NldCBzdWNjZXNzZnVsbHlgXG4gICAgICAgICAgICAgICAgICAgIDogYE5vZGUgJyR7YXJncy5uYW1lfScgY3JlYXRlZCBzdWNjZXNzZnVsbHlgO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB0YXJnZXRQYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGU6IGFyZ3Mubm9kZVR5cGUgfHwgJ05vZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUFzc2V0OiAhIWZpbmFsQXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBmaW5hbEFzc2V0VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHN1Y2Nlc3NNZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvbkRhdGE6IHZlcmlmaWNhdGlvbkRhdGFcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gY3JlYXRlIG5vZGU6ICR7ZXJyLm1lc3NhZ2V9LiBBcmdzOiAke0pTT04uc3RyaW5naWZ5KGFyZ3MpfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXROb2RlSW5mbyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCB1dWlkKS50aGVuKChub2RlRGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdOb2RlIG5vdCBmb3VuZCBvciBpbnZhbGlkIHJlc3BvbnNlJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBOb2RlSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZURhdGEudXVpZD8udmFsdWUgfHwgdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZURhdGEubmFtZT8udmFsdWUgfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGVEYXRhLmFjdGl2ZT8udmFsdWUgIT09IHVuZGVmaW5lZCA/IG5vZGVEYXRhLmFjdGl2ZS52YWx1ZSA6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlRGF0YS5wb3NpdGlvbj8udmFsdWUgfHwgeyB4OiAwLCB5OiAwLCB6OiAwIH0sXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBub2RlRGF0YS5yb3RhdGlvbj8udmFsdWUgfHwgeyB4OiAwLCB5OiAwLCB6OiAwIH0sXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlOiBub2RlRGF0YS5zY2FsZT8udmFsdWUgfHwgeyB4OiAxLCB5OiAxLCB6OiAxIH0sXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogbm9kZURhdGEucGFyZW50Py52YWx1ZT8udXVpZCB8fCBudWxsLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbm9kZURhdGEuY2hpbGRyZW4gfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IChub2RlRGF0YS5fX2NvbXBzX18gfHwgW10pLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcC5fX3R5cGVfXyB8fCAnVW5rbm93bicsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjb21wLmVuYWJsZWQgIT09IHVuZGVmaW5lZCA/IGNvbXAuZW5hYmxlZCA6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgICAgICAgICBsYXllcjogbm9kZURhdGEubGF5ZXI/LnZhbHVlIHx8IDEwNzM3NDE4MjQsXG4gICAgICAgICAgICAgICAgICAgIG1vYmlsaXR5OiBub2RlRGF0YS5tb2JpbGl0eT8udmFsdWUgfHwgMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGluZm8gfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZmluZE5vZGVzKHBhdHRlcm46IHN0cmluZywgZXhhY3RNYXRjaDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKS50aGVuKCh0cmVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlczogYW55W10gPSBbXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2hUcmVlID0gKG5vZGU6IGFueSwgY3VycmVudFBhdGg6IHN0cmluZyA9ICcnKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVQYXRoID0gY3VycmVudFBhdGggPyBgJHtjdXJyZW50UGF0aH0vJHtub2RlLm5hbWV9YCA6IG5vZGUubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBleGFjdE1hdGNoID8gXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLm5hbWUgPT09IHBhdHRlcm4gOiBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHBhdHRlcm4udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBub2RlUGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hUcmVlKGNoaWxkLCBub2RlUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0cmVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaFRyZWUodHJlZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBmaW5kTm9kZUJ5TmFtZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpLnRoZW4oKHRyZWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kTm9kZSA9IHRoaXMuc2VhcmNoTm9kZUluVHJlZSh0cmVlLCBuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBmb3VuZE5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBmb3VuZE5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB0aGlzLmdldE5vZGVQYXRoKGZvdW5kTm9kZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJyR7bmFtZX0nIG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNlYXJjaE5vZGVJblRyZWUobm9kZTogYW55LCB0YXJnZXROYW1lOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICBpZiAobm9kZS5uYW1lID09PSB0YXJnZXROYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy5zZWFyY2hOb2RlSW5UcmVlKGNoaWxkLCB0YXJnZXROYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBbGxOb2RlcygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpLnRoZW4oKHRyZWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYXZlcnNlVHJlZSA9IChub2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdGhpcy5nZXROb2RlUGF0aChub2RlKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZVRyZWUoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAodHJlZSAmJiB0cmVlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlVHJlZSh0cmVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsTm9kZXM6IG5vZGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVzOiBub2Rlc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Tm9kZVBhdGgobm9kZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IFtub2RlLm5hbWVdO1xuICAgICAgICBsZXQgY3VycmVudCA9IG5vZGUucGFyZW50O1xuICAgICAgICB3aGlsZSAoY3VycmVudCAmJiBjdXJyZW50Lm5hbWUgIT09ICdDYW52YXMnKSB7XG4gICAgICAgICAgICBwYXRoLnVuc2hpZnQoY3VycmVudC5uYW1lKTtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGF0aC5qb2luKCcvJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzZXROb2RlUHJvcGVydGllcyh1dWlkOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBuYW1lLCBhY3RpdmUsIGxheWVyLCBtb2JpbGl0eSwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSwgY3VzdG9tUHJvcGVydGllcyB9ID0gYXJncztcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVByb21pc2VzOiBQcm9taXNlPGFueT5bXSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEdldCBub2RlIGluZm8gdG8gZGV0ZXJtaW5lIDJELzNEXG4gICAgICAgICAgICAgICAgbGV0IGlzMkROb2RlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGV0IG5vZGVJbmZvOiBhbnkgPSBudWxsO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiB8fCByb3RhdGlvbiB8fCBzY2FsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mb1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlSW5mb1Jlc3BvbnNlLnN1Y2Nlc3MgfHwgIW5vZGVJbmZvUmVzcG9uc2UuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZhaWxlZCB0byBnZXQgbm9kZSBpbmZvcm1hdGlvbicgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm8gPSBub2RlSW5mb1Jlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIGlzMkROb2RlID0gdGhpcy5pczJETm9kZShub2RlSW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBnZW5lcmFsIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpZiAobmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVByb21pc2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAnbmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogbmFtZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goJ25hbWUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGFjdGl2ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVByb21pc2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAnYWN0aXZlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdW1wOiB7IHZhbHVlOiBhY3RpdmUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlcy5wdXNoKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGxheWVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlUHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICdsYXllcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogbGF5ZXIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlcy5wdXNoKCdsYXllcicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobW9iaWxpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVQcm9taXNlcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJ21vYmlsaXR5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdW1wOiB7IHZhbHVlOiBtb2JpbGl0eSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goJ21vYmlsaXR5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSB0cmFuc2Zvcm0gcHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkUG9zaXRpb24gPSB0aGlzLm5vcm1hbGl6ZVRyYW5zZm9ybVZhbHVlKHBvc2l0aW9uLCAncG9zaXRpb24nLCBpczJETm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUG9zaXRpb24ud2FybmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3MucHVzaChub3JtYWxpemVkUG9zaXRpb24ud2FybmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVByb21pc2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAncG9zaXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgdmFsdWU6IG5vcm1hbGl6ZWRQb3NpdGlvbi52YWx1ZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goJ3Bvc2l0aW9uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyb3RhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkUm90YXRpb24gPSB0aGlzLm5vcm1hbGl6ZVRyYW5zZm9ybVZhbHVlKHJvdGF0aW9uLCAncm90YXRpb24nLCBpczJETm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUm90YXRpb24ud2FybmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3MucHVzaChub3JtYWxpemVkUm90YXRpb24ud2FybmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVByb21pc2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAncm90YXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgdmFsdWU6IG5vcm1hbGl6ZWRSb3RhdGlvbi52YWx1ZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goJ3JvdGF0aW9uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChzY2FsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkU2NhbGUgPSB0aGlzLm5vcm1hbGl6ZVRyYW5zZm9ybVZhbHVlKHNjYWxlLCAnc2NhbGUnLCBpczJETm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkU2NhbGUud2FybmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3MucHVzaChub3JtYWxpemVkU2NhbGUud2FybmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVByb21pc2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAnc2NhbGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgdmFsdWU6IG5vcm1hbGl6ZWRTY2FsZS52YWx1ZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goJ3NjYWxlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBjdXN0b20gcHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGlmIChjdXN0b21Qcm9wZXJ0aWVzICYmIHR5cGVvZiBjdXN0b21Qcm9wZXJ0aWVzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtwcm9wZXJ0eSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGN1c3RvbVByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVQcm9taXNlcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgdmFsdWU6IHZhbHVlIGFzIGFueSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2gocHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVQcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnTm8gcHJvcGVydGllcyBwcm92aWRlZCB0byB1cGRhdGUnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgYWxsIHVwZGF0ZXNcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh1cGRhdGVQcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gR2V0IHVwZGF0ZWQgbm9kZSBpbmZvIGZvciB2ZXJpZmljYXRpb25cbiAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkTm9kZUluZm8gPSBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKHV1aWQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIFVwZGF0ZWQgJHt1cGRhdGVzLmxlbmd0aH0gcHJvcGVydGllc2AsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlZFByb3BlcnRpZXM6IHVwZGF0ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nczogd2FybmluZ3MubGVuZ3RoID4gMCA/IHdhcm5pbmdzIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBzZXQgbm9kZSBwcm9wZXJ0aWVzOiAke2Vyci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzZXROb2RlVHJhbnNmb3JtKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyB1dWlkLCBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlIH0gPSBhcmdzO1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlUHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gR2V0IG5vZGUgaW5mbyB0byBkZXRlcm1pbmUgMkQvM0RcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mb1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvUmVzcG9uc2Uuc3VjY2VzcyB8fCAhbm9kZUluZm9SZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdGYWlsZWQgdG8gZ2V0IG5vZGUgaW5mb3JtYXRpb24nIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gbm9kZUluZm9SZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzMkROb2RlID0gdGhpcy5pczJETm9kZShub2RlSW5mbyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQb3NpdGlvbiA9IHRoaXMubm9ybWFsaXplVHJhbnNmb3JtVmFsdWUocG9zaXRpb24sICdwb3NpdGlvbicsIGlzMkROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQb3NpdGlvbi53YXJuaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5ncy5wdXNoKG5vcm1hbGl6ZWRQb3NpdGlvbi53YXJuaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlUHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICdwb3NpdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogbm9ybWFsaXplZFBvc2l0aW9uLnZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMucHVzaCgncG9zaXRpb24nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJvdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRSb3RhdGlvbiA9IHRoaXMubm9ybWFsaXplVHJhbnNmb3JtVmFsdWUocm90YXRpb24sICdyb3RhdGlvbicsIGlzMkROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRSb3RhdGlvbi53YXJuaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5ncy5wdXNoKG5vcm1hbGl6ZWRSb3RhdGlvbi53YXJuaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlUHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICdyb3RhdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogbm9ybWFsaXplZFJvdGF0aW9uLnZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMucHVzaCgncm90YXRpb24nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHNjYWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTY2FsZSA9IHRoaXMubm9ybWFsaXplVHJhbnNmb3JtVmFsdWUoc2NhbGUsICdzY2FsZScsIGlzMkROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRTY2FsZS53YXJuaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5ncy5wdXNoKG5vcm1hbGl6ZWRTY2FsZS53YXJuaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlUHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICdzY2FsZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogbm9ybWFsaXplZFNjYWxlLnZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMucHVzaCgnc2NhbGUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZVByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gdHJhbnNmb3JtIHByb3BlcnRpZXMgc3BlY2lmaWVkJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh1cGRhdGVQcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2U6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBUcmFuc2Zvcm0gdXBkYXRlZDogJHt1cGRhdGVzLmpvaW4oJywgJyl9ICR7aXMyRE5vZGUgPyAnKDJEKScgOiAnKDNEKSd9YCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVHlwZTogaXMyRE5vZGUgPyAnMkQnIDogJzNEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGxpZWRDaGFuZ2VzOiB1cGRhdGVzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh3YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLndhcm5pbmcgPSB3YXJuaW5ncy5qb2luKCc7ICcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHVwZGF0ZSB0cmFuc2Zvcm06ICR7ZXJyLm1lc3NhZ2V9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpczJETm9kZShub2RlSW5mbzogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlSW5mby5jb21wb25lbnRzIHx8IFtdO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2hlY2sgZm9yIDJEIGNvbXBvbmVudHNcbiAgICAgICAgY29uc3QgaGFzMkRDb21wb25lbnRzID0gY29tcG9uZW50cy5zb21lKChjb21wOiBhbnkpID0+IFxuICAgICAgICAgICAgY29tcC50eXBlICYmIChcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLlNwcml0ZScpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYWJlbCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5CdXR0b24nKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTGF5b3V0JykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLldpZGdldCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5NYXNrJykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkdyYXBoaWNzJylcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChoYXMyRENvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBmb3IgM0QgY29tcG9uZW50cyAgXG4gICAgICAgIGNvbnN0IGhhczNEQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuc29tZSgoY29tcDogYW55KSA9PlxuICAgICAgICAgICAgY29tcC50eXBlICYmIChcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1lc2hSZW5kZXJlcicpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5DYW1lcmEnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTGlnaHQnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuRGlyZWN0aW9uYWxMaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5Qb2ludExpZ2h0JykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLlNwb3RMaWdodCcpXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICBpZiAoaGFzM0RDb21wb25lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIERlZmF1bHQgaGV1cmlzdGljXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gbm9kZUluZm8ucG9zaXRpb247XG4gICAgICAgIGlmIChwb3NpdGlvbiAmJiBNYXRoLmFicyhwb3NpdGlvbi56KSA8IDAuMDAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgbm9ybWFsaXplVHJhbnNmb3JtVmFsdWUodmFsdWU6IGFueSwgdHlwZTogJ3Bvc2l0aW9uJyB8ICdyb3RhdGlvbicgfCAnc2NhbGUnLCBpczJEOiBib29sZWFuKTogeyB2YWx1ZTogYW55LCB3YXJuaW5nPzogc3RyaW5nIH0ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB7IC4uLnZhbHVlIH07XG4gICAgICAgIGxldCB3YXJuaW5nOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgIFxuICAgICAgICBpZiAoaXMyRCkge1xuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAncG9zaXRpb24nOlxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUueiAhPT0gdW5kZWZpbmVkICYmIE1hdGguYWJzKHZhbHVlLnopID4gMC4wMDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmcgPSBgMkQgbm9kZTogeiBwb3NpdGlvbiAoJHt2YWx1ZS56fSkgaWdub3JlZCwgc2V0IHRvIDBgO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnogPSAwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLnogPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnogPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYXNlICdyb3RhdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmICgodmFsdWUueCAhPT0gdW5kZWZpbmVkICYmIE1hdGguYWJzKHZhbHVlLngpID4gMC4wMDEpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgKHZhbHVlLnkgIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyh2YWx1ZS55KSA+IDAuMDAxKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZyA9IGAyRCBub2RlOiB4LHkgcm90YXRpb25zIGlnbm9yZWQsIG9ubHkgeiByb3RhdGlvbiBhcHBsaWVkYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gcmVzdWx0LnggfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gcmVzdWx0LnkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQueiA9IHJlc3VsdC56IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYXNlICdzY2FsZSc6XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS56ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIDNEIG5vZGVcbiAgICAgICAgICAgIHJlc3VsdC54ID0gcmVzdWx0LnggIT09IHVuZGVmaW5lZCA/IHJlc3VsdC54IDogKHR5cGUgPT09ICdzY2FsZScgPyAxIDogMCk7XG4gICAgICAgICAgICByZXN1bHQueSA9IHJlc3VsdC55ICE9PSB1bmRlZmluZWQgPyByZXN1bHQueSA6ICh0eXBlID09PSAnc2NhbGUnID8gMSA6IDApO1xuICAgICAgICAgICAgcmVzdWx0LnogPSByZXN1bHQueiAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LnogOiAodHlwZSA9PT0gJ3NjYWxlJyA/IDEgOiAwKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHJlc3VsdCwgd2FybmluZyB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZGVsZXRlTm9kZSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3JlbW92ZS1ub2RlJywgeyB1dWlkOiB1dWlkIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn4pyFIE5vZGUgZGVsZXRlZCdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBtb3ZlTm9kZShub2RlVXVpZDogc3RyaW5nLCBuZXdQYXJlbnRVdWlkOiBzdHJpbmcsIHNpYmxpbmdJbmRleDogbnVtYmVyID0gLTEpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wYXJlbnQnLCB7XG4gICAgICAgICAgICAgICAgcGFyZW50OiBuZXdQYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgIHV1aWRzOiBbbm9kZVV1aWRdLFxuICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogZmFsc2VcbiAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn4pyFIE5vZGUgbW92ZWQnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZHVwbGljYXRlTm9kZSh1dWlkOiBzdHJpbmcsIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2R1cGxpY2F0ZS1ub2RlJywgdXVpZCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3VXVpZDogcmVzdWx0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn4pyFIE5vZGUgZHVwbGljYXRlZCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGRldGVjdE5vZGVUeXBlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mb1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvUmVzcG9uc2Uuc3VjY2VzcyB8fCAhbm9kZUluZm9SZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdGYWlsZWQgdG8gZ2V0IG5vZGUgaW5mb3JtYXRpb24nIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBub2RlSW5mb1Jlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgY29uc3QgaXMyRCA9IHRoaXMuaXMyRE5vZGUobm9kZUluZm8pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlSW5mby5jb21wb25lbnRzIHx8IFtdO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IGRldGVjdGlvblJlYXNvbnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIDJEIGNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICBjb25zdCB0d29EQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuZmlsdGVyKChjb21wOiBhbnkpID0+IFxuICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5TcHJpdGUnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYWJlbCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkJ1dHRvbicpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkxheW91dCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLldpZGdldCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1hc2snKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5HcmFwaGljcycpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciAzRCBjb21wb25lbnRzXG4gICAgICAgICAgICAgICAgY29uc3QgdGhyZWVEQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuZmlsdGVyKChjb21wOiBhbnkpID0+XG4gICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1lc2hSZW5kZXJlcicpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkNhbWVyYScpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkxpZ2h0JykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuRGlyZWN0aW9uYWxMaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLlBvaW50TGlnaHQnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5TcG90TGlnaHQnKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGlmICh0d29EQ29tcG9uZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnMucHVzaChgSGFzIDJEIGNvbXBvbmVudHM6ICR7dHdvRENvbXBvbmVudHMubWFwKChjOiBhbnkpID0+IGMudHlwZSkuam9pbignLCAnKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRocmVlRENvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zLnB1c2goYEhhcyAzRCBjb21wb25lbnRzOiAke3RocmVlRENvbXBvbmVudHMubWFwKChjOiBhbnkpID0+IGMudHlwZSkuam9pbignLCAnKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSBub2RlSW5mby5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gJiYgTWF0aC5hYnMocG9zaXRpb24ueikgPCAwLjAwMSkge1xuICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zLnB1c2goJ1ogcG9zaXRpb24gaXMgfjAgKGxpa2VseSAyRCknKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBvc2l0aW9uICYmIE1hdGguYWJzKHBvc2l0aW9uLnopID4gMC4wMDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29ucy5wdXNoKGBaIHBvc2l0aW9uIGlzICR7cG9zaXRpb24uen0gKGxpa2VseSAzRClgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZGV0ZWN0aW9uUmVhc29ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29ucy5wdXNoKCdObyBzcGVjaWZpYyBpbmRpY2F0b3JzIGZvdW5kLCBkZWZhdWx0aW5nIGJhc2VkIG9uIGhldXJpc3RpY3MnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlTmFtZTogbm9kZUluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVUeXBlOiBpczJEID8gJzJEJyA6ICczRCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zOiBkZXRlY3Rpb25SZWFzb25zLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogY29tcG9uZW50cy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBjb21wLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHRoaXMuZ2V0Q29tcG9uZW50Q2F0ZWdvcnkoY29tcC50eXBlKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGVJbmZvLnBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtQ29uc3RyYWludHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogaXMyRCA/ICd4LCB5IG9ubHkgKHogaWdub3JlZCknIDogJ3gsIHksIHogYWxsIHVzZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBpczJEID8gJ3ogb25seSAoeCwgeSBpZ25vcmVkKScgOiAneCwgeSwgeiBhbGwgdXNlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IGlzMkQgPyAneCwgeSBtYWluLCB6IHR5cGljYWxseSAxJyA6ICd4LCB5LCB6IGFsbCB1c2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBkZXRlY3Qgbm9kZSB0eXBlOiAke2Vyci5tZXNzYWdlfWAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50Q2F0ZWdvcnkoY29tcG9uZW50VHlwZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCFjb21wb25lbnRUeXBlKSByZXR1cm4gJ3Vua25vd24nO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLlNwcml0ZScpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkxhYmVsJykgfHwgXG4gICAgICAgICAgICBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5CdXR0b24nKSB8fCBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5MYXlvdXQnKSB8fFxuICAgICAgICAgICAgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuV2lkZ2V0JykgfHwgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuTWFzaycpIHx8XG4gICAgICAgICAgICBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5HcmFwaGljcycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJzJEJztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLk1lc2hSZW5kZXJlcicpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkNhbWVyYScpIHx8XG4gICAgICAgICAgICBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5MaWdodCcpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkRpcmVjdGlvbmFsTGlnaHQnKSB8fFxuICAgICAgICAgICAgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuUG9pbnRMaWdodCcpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLlNwb3RMaWdodCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJzNEJztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuICdnZW5lcmljJztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldE5vZGVUcmVlKHJvb3RVdWlkPzogc3RyaW5nLCBtYXhEZXB0aDogbnVtYmVyID0gMTApOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5L2/55So5a6Y5pa555qEIHF1ZXJ5LW5vZGUtdHJlZSBBUElcbiAgICAgICAgICAgIGNvbnN0IG5vZGVUcmVlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJywgcm9vdFV1aWQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDpgJLlvZLlpITnkIboioLngrnmoJHvvIzpmZDliLbmt7HluqZcbiAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NOb2RlID0gKG5vZGU6IGFueSwgY3VycmVudERlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudERlcHRoID49IG1heERlcHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG5vZGUuY2hpbGRyZW4gPyBbYC4uLiAke25vZGUuY2hpbGRyZW4ubGVuZ3RofSBjaGlsZHJlbiAobWF4IGRlcHRoIHJlYWNoZWQpYF0gOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRydW5jYXRlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ291bnQ6IG5vZGUuY2hpbGRyZW4gPyBub2RlLmNoaWxkcmVuLmxlbmd0aCA6IDBcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwcm9jZXNzZWROb2RlID0ge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICBpc1NjZW5lOiBub2RlLmlzU2NlbmUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYjogbm9kZS5wcmVmYWIgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogbm9kZS5jb21wb25lbnRzID8gbm9kZS5jb21wb25lbnRzLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNvbXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzOiBjb21wLmV4dGVuZHMgfHwgW11cbiAgICAgICAgICAgICAgICAgICAgfSkpIDogW10sXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkQ291bnQ6IG5vZGUuY2hpbGRyZW4gPyBub2RlLmNoaWxkcmVuLmxlbmd0aCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXSBhcyBhbnlbXVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkTm9kZS5jaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NOb2RlKGNoaWxkLCBjdXJyZW50RGVwdGggKyAxKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzZWROb2RlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkVHJlZSA9IHByb2Nlc3NOb2RlKG5vZGVUcmVlLCAwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDinIUgTm9kZSB0cmVlIHJldHJpZXZlZCAocm9vdDogJHtub2RlVHJlZS5uYW1lIHx8ICdzY2VuZSd9KWAsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICB0cmVlOiBwcm9jZXNzZWRUcmVlLFxuICAgICAgICAgICAgICAgICAgICByb290VXVpZDogcm9vdFV1aWQgfHwgJ3NjZW5lJyxcbiAgICAgICAgICAgICAgICAgICAgbWF4RGVwdGg6IG1heERlcHRoLFxuICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IHRoaXMuY291bnRUcmVlTm9kZXMocHJvY2Vzc2VkVHJlZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGdldCBub2RlIHRyZWU6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb3VudFRyZWVOb2Rlcyhub2RlOiBhbnkpOiBudW1iZXIge1xuICAgICAgICBsZXQgY291bnQgPSAxOyAvLyDlvZPliY3oioLngrlcbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShub2RlLmNoaWxkcmVuKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGlsZCA9PT0gJ29iamVjdCcgJiYgIWNoaWxkLnRydW5jYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb3VudCArPSB0aGlzLmNvdW50VHJlZU5vZGVzKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cblxuICAgIC8vIE5ldyBtZXRob2RzIGZyb20gc2NlbmUtYWR2YW5jZWQtdG9vbHMudHNcbiAgICBwcml2YXRlIGFzeW5jIGNvcHlOb2RlKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8gVmFsaWRhdGUgcGFyYW1ldGVyc1xuICAgICAgICAgICAgaWYgKCF1dWlkcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdOb2RlIFVVSUQocykgYXJlIHJlcXVpcmVkJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWRzID0gQXJyYXkuaXNBcnJheSh1dWlkcykgPyB1dWlkcyA6IFt1dWlkc107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIGVhY2ggVVVJRFxuICAgICAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIG5vZGVVdWlkcykge1xuICAgICAgICAgICAgICAgIGlmICghdXVpZCB8fCB0eXBlb2YgdXVpZCAhPT0gJ3N0cmluZycgfHwgdXVpZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ0FsbCBVVUlEcyBtdXN0IGJlIG5vbi1lbXB0eSBzdHJpbmdzJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdHJpbW1lZFV1aWRzID0gbm9kZVV1aWRzLm1hcCh1dWlkID0+IHV1aWQudHJpbSgpKTtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0VXVpZHMgPSBBcnJheS5pc0FycmF5KHV1aWRzKSA/IHRyaW1tZWRVdWlkcyA6IHRyaW1tZWRVdWlkc1swXTtcblxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY29weS1ub2RlJywgaW5wdXRVdWlkcykudGhlbigocmVzdWx0OiBzdHJpbmcgfCBzdHJpbmdbXSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFICR7QXJyYXkuaXNBcnJheShyZXN1bHQpID8gcmVzdWx0Lmxlbmd0aCA6IDF9IG5vZGUocykgY29waWVkIHRvIGNsaXBib2FyZGAsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsVXVpZHM6IHRyaW1tZWRVdWlkcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcGllZFV1aWRzOiByZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdjb3B5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVDb3VudDogQXJyYXkuaXNBcnJheShyZXN1bHQpID8gcmVzdWx0Lmxlbmd0aCA6IDFcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gY29weSBub2RlKHMpOiAke2Vyci5tZXNzYWdlfWAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBwYXN0ZU5vZGUodGFyZ2V0OiBzdHJpbmcsIHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSwga2VlcFdvcmxkVHJhbnNmb3JtOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgIGlmICghdGFyZ2V0IHx8IHR5cGVvZiB0YXJnZXQgIT09ICdzdHJpbmcnIHx8IHRhcmdldC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ1RhcmdldCBwYXJlbnQgVVVJRCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXV1aWRzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ05vZGUgVVVJRChzKSB0byBwYXN0ZSBhcmUgcmVxdWlyZWQnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlVXVpZHMgPSBBcnJheS5pc0FycmF5KHV1aWRzKSA/IHV1aWRzIDogW3V1aWRzXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgZWFjaCBVVUlEXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2Ygbm9kZVV1aWRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1dWlkIHx8IHR5cGVvZiB1dWlkICE9PSAnc3RyaW5nJyB8fCB1dWlkLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnQWxsIFVVSURzIG11c3QgYmUgbm9uLWVtcHR5IHN0cmluZ3MnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0cmltbWVkVGFyZ2V0ID0gdGFyZ2V0LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWRVdWlkcyA9IG5vZGVVdWlkcy5tYXAodXVpZCA9PiB1dWlkLnRyaW0oKSk7XG4gICAgICAgICAgICBjb25zdCBpbnB1dFV1aWRzID0gQXJyYXkuaXNBcnJheSh1dWlkcykgPyB0cmltbWVkVXVpZHMgOiB0cmltbWVkVXVpZHNbMF07XG5cbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3Bhc3RlLW5vZGUnLCB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0cmltbWVkVGFyZ2V0LFxuICAgICAgICAgICAgICAgIHV1aWRzOiBpbnB1dFV1aWRzLFxuICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybVxuICAgICAgICAgICAgfSkudGhlbigocmVzdWx0OiBzdHJpbmcgfCBzdHJpbmdbXSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFICR7QXJyYXkuaXNBcnJheShyZXN1bHQpID8gcmVzdWx0Lmxlbmd0aCA6IDF9IG5vZGUocykgcGFzdGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFBhcmVudDogdHJpbW1lZFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsVXVpZHM6IHRyaW1tZWRVdWlkcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1V1aWRzOiByZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdwYXN0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IEFycmF5LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdC5sZW5ndGggOiAxXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHBhc3RlIG5vZGUocyk6ICR7ZXJyLm1lc3NhZ2V9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGN1dE5vZGUodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSBwYXJhbWV0ZXJzXG4gICAgICAgICAgICBpZiAoIXV1aWRzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ05vZGUgVVVJRChzKSBhcmUgcmVxdWlyZWQnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlVXVpZHMgPSBBcnJheS5pc0FycmF5KHV1aWRzKSA/IHV1aWRzIDogW3V1aWRzXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgZWFjaCBVVUlEXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2Ygbm9kZVV1aWRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1dWlkIHx8IHR5cGVvZiB1dWlkICE9PSAnc3RyaW5nJyB8fCB1dWlkLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnQWxsIFVVSURzIG11c3QgYmUgbm9uLWVtcHR5IHN0cmluZ3MnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0cmltbWVkVXVpZHMgPSBub2RlVXVpZHMubWFwKHV1aWQgPT4gdXVpZC50cmltKCkpO1xuICAgICAgICAgICAgY29uc3QgaW5wdXRVdWlkcyA9IEFycmF5LmlzQXJyYXkodXVpZHMpID8gdHJpbW1lZFV1aWRzIDogdHJpbW1lZFV1aWRzWzBdO1xuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjdXQtbm9kZScsIGlucHV0VXVpZHMpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDinIUgJHtBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHQubGVuZ3RoIDogMX0gbm9kZShzKSBjdXQgdG8gY2xpcGJvYXJkYCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxVdWlkczogdHJpbW1lZFV1aWRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3V0VXVpZHM6IHJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2N1dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IEFycmF5LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdC5sZW5ndGggOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm90ZTogJ05vZGVzIGFyZSBjb3BpZWQgdG8gY2xpcGJvYXJkIGFuZCBtYXJrZWQgZm9yIG1vdmUgb3BlcmF0aW9uJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBjdXQgbm9kZShzKTogJHtlcnIubWVzc2FnZX1gIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVzZXROb2RlUHJvcGVydHkodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgIGlmICghdXVpZCB8fCB0eXBlb2YgdXVpZCAhPT0gJ3N0cmluZycgfHwgdXVpZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ05vZGUgVVVJRCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXBhdGggfHwgdHlwZW9mIHBhdGggIT09ICdzdHJpbmcnIHx8IHBhdGgudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdQcm9wZXJ0eSBwYXRoIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZydcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWRVdWlkID0gdXVpZC50cmltKCk7XG4gICAgICAgICAgICBjb25zdCB0cmltbWVkUGF0aCA9IHBhdGgudHJpbSgpO1xuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXNldC1wcm9wZXJ0eScsIHsgXG4gICAgICAgICAgICAgICAgdXVpZDogdHJpbW1lZFV1aWQsIFxuICAgICAgICAgICAgICAgIHBhdGg6IHRyaW1tZWRQYXRoLCBcbiAgICAgICAgICAgICAgICBkdW1wOiB7IHZhbHVlOiBudWxsIH0gXG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBQcm9wZXJ0eSAnJHt0cmltbWVkUGF0aH0nIHJlc2V0IHRvIGRlZmF1bHQgdmFsdWVgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB0cmltbWVkVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHRyaW1tZWRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVzZXRfcHJvcGVydHknXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlc2V0IHByb3BlcnR5ICcke3RyaW1tZWRQYXRofSc6ICR7ZXJyLm1lc3NhZ2V9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlc2V0Tm9kZVRyYW5zZm9ybSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICghdXVpZCB8fCB0eXBlb2YgdXVpZCAhPT0gJ3N0cmluZycgfHwgdXVpZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ05vZGUgVVVJRCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0cmltbWVkVXVpZCA9IHV1aWQudHJpbSgpO1xuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXNldC1ub2RlJywgeyB1dWlkOiB0cmltbWVkVXVpZCB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ+KchSBOb2RlIHRyYW5zZm9ybSByZXNldCB0byBkZWZhdWx0IHZhbHVlcycsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHRyaW1tZWRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVzZXRfdHJhbnNmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc2V0UHJvcGVydGllczogWydwb3NpdGlvbicsICdyb3RhdGlvbicsICdzY2FsZSddXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlc2V0IG5vZGUgdHJhbnNmb3JtOiAke2Vyci5tZXNzYWdlfWAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNldENvbXBvbmVudCh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICghdXVpZCB8fCB0eXBlb2YgdXVpZCAhPT0gJ3N0cmluZycgfHwgdXVpZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ0NvbXBvbmVudCBVVUlEIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZydcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWRVdWlkID0gdXVpZC50cmltKCk7XG5cbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3Jlc2V0LWNvbXBvbmVudCcsIHsgdXVpZDogdHJpbW1lZFV1aWQgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfinIUgQ29tcG9uZW50IHJlc2V0IHRvIGRlZmF1bHQgdmFsdWVzJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdHJpbW1lZFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdyZXNldF9jb21wb25lbnQnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlc2V0IGNvbXBvbmVudDogJHtlcnIubWVzc2FnZX1gIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgbW92ZUFycmF5RWxlbWVudCh1dWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgdGFyZ2V0OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSBwYXJhbWV0ZXJzXG4gICAgICAgICAgICBpZiAoIXV1aWQgfHwgdHlwZW9mIHV1aWQgIT09ICdzdHJpbmcnIHx8IHV1aWQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdOb2RlIFVVSUQgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFwYXRoIHx8IHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJyB8fCBwYXRoLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAnQXJyYXkgcGF0aCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ251bWJlcicgfHwgdGFyZ2V0IDwgMCB8fCAhTnVtYmVyLmlzSW50ZWdlcih0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ1RhcmdldCBpbmRleCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9mZnNldCAhPT0gJ251bWJlcicgfHwgIU51bWJlci5pc0ludGVnZXIob2Zmc2V0KSB8fCBvZmZzZXQgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAnT2Zmc2V0IG11c3QgYmUgYSBub24temVybyBpbnRlZ2VyJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdHJpbW1lZFV1aWQgPSB1dWlkLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWRQYXRoID0gcGF0aC50cmltKCk7XG5cbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ21vdmUtYXJyYXktZWxlbWVudCcsIHtcbiAgICAgICAgICAgICAgICB1dWlkOiB0cmltbWVkVXVpZCxcbiAgICAgICAgICAgICAgICBwYXRoOiB0cmltbWVkUGF0aCxcbiAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgb2Zmc2V0XG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBcnJheSBlbGVtZW50IG1vdmVkIGZyb20gaW5kZXggJHt0YXJnZXR9IGJ5ICR7b2Zmc2V0fSBwb3NpdGlvbnNgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB0cmltbWVkVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHRyaW1tZWRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXg6IHRhcmdldCArIG9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ21vdmVfZWxlbWVudCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gbW92ZSBhcnJheSBlbGVtZW50OiAke2Vyci5tZXNzYWdlfWAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZW1vdmVBcnJheUVsZW1lbnQodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgIGlmICghdXVpZCB8fCB0eXBlb2YgdXVpZCAhPT0gJ3N0cmluZycgfHwgdXVpZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ05vZGUgVVVJRCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXBhdGggfHwgdHlwZW9mIHBhdGggIT09ICdzdHJpbmcnIHx8IHBhdGgudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdBcnJheSBwYXRoIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZydcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInIHx8IGluZGV4IDwgMCB8fCAhTnVtYmVyLmlzSW50ZWdlcihpbmRleCkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAnSW5kZXggbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdHJpbW1lZFV1aWQgPSB1dWlkLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWRQYXRoID0gcGF0aC50cmltKCk7XG5cbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3JlbW92ZS1hcnJheS1lbGVtZW50Jywge1xuICAgICAgICAgICAgICAgIHV1aWQ6IHRyaW1tZWRVdWlkLFxuICAgICAgICAgICAgICAgIHBhdGg6IHRyaW1tZWRQYXRoLFxuICAgICAgICAgICAgICAgIGluZGV4XG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYOKchSBBcnJheSBlbGVtZW50IGF0IGluZGV4ICR7aW5kZXh9IHJlbW92ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdHJpbW1lZFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB0cmltbWVkUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVtb3ZlX2VsZW1lbnQnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlbW92ZSBhcnJheSBlbGVtZW50IGF0IGluZGV4ICR7aW5kZXh9OiAke2Vyci5tZXNzYWdlfWAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTmV3IHNjcmlwdCBtYW5hZ2VtZW50IGhhbmRsZXJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU5vZGVTY3JpcHRNYW5hZ2VtZW50KGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHsgYWN0aW9uLCBub2RlVXVpZCwgc2NyaXB0UGF0aCwgc2NyaXB0Q2lkIH0gPSBhcmdzO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2F0dGFjaCc6XG4gICAgICAgICAgICAgICAgaWYgKCFzY3JpcHRQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ3NjcmlwdFBhdGggcmVxdWlyZWQgZm9yIGF0dGFjaCBhY3Rpb24nIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmF0dGFjaFNjcmlwdFRvTm9kZShub2RlVXVpZCwgc2NyaXB0UGF0aCk7XG4gICAgICAgICAgICBjYXNlICdyZW1vdmUnOlxuICAgICAgICAgICAgICAgIGlmICghc2NyaXB0Q2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ3NjcmlwdENpZCByZXF1aXJlZCBmb3IgcmVtb3ZlIGFjdGlvbicgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVtb3ZlU2NyaXB0RnJvbU5vZGUobm9kZVV1aWQsIHNjcmlwdENpZCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gc2NyaXB0IG1hbmFnZW1lbnQgYWN0aW9uOiAke2FjdGlvbn1gIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTY3JpcHQgYXR0YWNobWVudCBpbXBsZW1lbnRhdGlvbiAoY29waWVkIGFuZCBhZGFwdGVkIGZyb20gY29tcG9uZW50LXRvb2xzKVxuICAgIHByaXZhdGUgYXN5bmMgYXR0YWNoU2NyaXB0VG9Ob2RlKG5vZGVVdWlkOiBzdHJpbmcsIHNjcmlwdFBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IHNjcmlwdCBjb21wb25lbnQgbmFtZSBmcm9tIHBhdGhcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHROYW1lID0gc2NyaXB0UGF0aC5zcGxpdCgnLycpLnBvcCgpPy5yZXBsYWNlKCcudHMnLCAnJykucmVwbGFjZSgnLmpzJywgJycpO1xuICAgICAgICAgICAgICAgIGlmICghc2NyaXB0TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnSW52YWxpZCBzY3JpcHQgcGF0aDogdW5hYmxlIHRvIGV4dHJhY3Qgc2NyaXB0IG5hbWUnIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgc2NyaXB0IGFscmVhZHkgZXhpc3RzIG9uIG5vZGUgdXNpbmcgQ29tcG9uZW50VG9vbHNcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxDb21wb25lbnRzSW5mbyA9IGF3YWl0IHRoaXMuY29tcG9uZW50VG9vbHMuZXhlY3V0ZSgnY29tcG9uZW50X3F1ZXJ5Jywge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdsaXN0JyxcbiAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYWxsQ29tcG9uZW50c0luZm8uc3VjY2VzcyAmJiBhbGxDb21wb25lbnRzSW5mby5kYXRhPy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBnZXQgdGhlIHNjcmlwdCBVVUlEIHRvIGNvbXBhcmUgd2l0aCBjb21wb25lbnQgX19zY3JpcHRBc3NldFxuICAgICAgICAgICAgICAgICAgICBsZXQgc2NyaXB0VXVpZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRVdWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIHNjcmlwdFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gU2NyaXB0IFVVSUQgZm9yIGR1cGxpY2F0ZSBjaGVjazogJHtzY3JpcHRVdWlkfWApO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0RFQlVHXSBDb3VsZCBub3QgZ2V0IHNjcmlwdCBVVUlEIGZvciBkdXBsaWNhdGUgY2hlY2s6ICR7ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gTG9vayBmb3IgZXhpc3Rpbmcgc2NyaXB0IGluIG11bHRpcGxlIHdheXM6XG4gICAgICAgICAgICAgICAgICAgIC8vIDEuIEJ5IHNjcmlwdCBjbGFzcyBuYW1lIChleGFjdCBtYXRjaClcbiAgICAgICAgICAgICAgICAgICAgLy8gMi4gQnkgY2hlY2tpbmcgaWYgY29tcG9uZW50IGhhcyBfX3NjcmlwdEFzc2V0IFVVSUQgcG9pbnRpbmcgdG8gb3VyIHNjcmlwdFxuICAgICAgICAgICAgICAgICAgICAvLyAzLiBCeSBjaGVja2luZyBub24tY2MuKiBjb21wb25lbnRzIHRoYXQgbWlnaHQgYmUgb3VyIHNjcmlwdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1NjcmlwdCA9IGFsbENvbXBvbmVudHNJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kKChjb21wOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbREVCVUddIENoZWNraW5nIGNvbXBvbmVudCB0eXBlOiAke2NvbXAudHlwZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWV0aG9kIDE6IERpcmVjdCBuYW1lIG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcC50eXBlID09PSBzY3JpcHROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gRm91bmQgZXhhY3Qgc2NyaXB0IG5hbWUgbWF0Y2g6ICR7Y29tcC50eXBlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNZXRob2QgMjogQ2hlY2sgX19zY3JpcHRBc3NldCBVVUlEIGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXAucHJvcGVydGllcyAmJiBjb21wLnByb3BlcnRpZXMuX19zY3JpcHRBc3NldCAmJiBjb21wLnByb3BlcnRpZXMuX19zY3JpcHRBc3NldC52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdEFzc2V0VXVpZCA9IGNvbXAucHJvcGVydGllcy5fX3NjcmlwdEFzc2V0LnZhbHVlLnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gQ2hlY2tpbmcgX19zY3JpcHRBc3NldCBVVUlEOiAke3NjcmlwdEFzc2V0VXVpZH0gdnMgJHtzY3JpcHRVdWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY3JpcHRBc3NldFV1aWQgPT09IHNjcmlwdFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gRm91bmQgc2NyaXB0IGJ5IF9fc2NyaXB0QXNzZXQgVVVJRCBtYXRjaCFgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNZXRob2QgMzogQ2hlY2sgYnkgY29tcG9uZW50IG5hbWUgY29udGFpbmluZyBvdXIgc2NyaXB0IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wLnByb3BlcnRpZXMgJiYgY29tcC5wcm9wZXJ0aWVzLm5hbWUgJiYgY29tcC5wcm9wZXJ0aWVzLm5hbWUudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gY29tcC5wcm9wZXJ0aWVzLm5hbWUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gQ2hlY2tpbmcgY29tcG9uZW50IG5hbWU6ICR7Y29tcG9uZW50TmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50TmFtZS5pbmNsdWRlcyhgPCR7c2NyaXB0TmFtZX0+YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gRm91bmQgc2NyaXB0IGJ5IGNvbXBvbmVudCBuYW1lIG1hdGNoOiAke2NvbXBvbmVudE5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ1NjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gU2NyaXB0IGFscmVhZHkgZXhpc3RzLCBjb21wb25lbnQgZGV0YWlsczpgLCBleGlzdGluZ1NjcmlwdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDinIUgU2NyaXB0ICcke3NjcmlwdE5hbWV9JyBhbHJlYWR5IGV4aXN0cyBvbiBub2RlYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0TmFtZTogc2NyaXB0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0UGF0aDogc2NyaXB0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxyZWFkeUV4aXN0czogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50SWQ6IGV4aXN0aW5nU2NyaXB0LmNpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZTogZXhpc3RpbmdTY3JpcHQudHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIGNyZWF0ZS1jb21wb25lbnQgQVBJIGV4cGVjdHMgdGhlIHNjcmlwdCBjbGFzcyBuYW1lIChmcm9tIEBjY2NsYXNzKSwgbm90IGZpbGUgVVVJRFxuICAgICAgICAgICAgICAgIC8vIFdlIHVzZSB0aGUgZXh0cmFjdGVkIHNjcmlwdE5hbWUgd2hpY2ggbWF0Y2hlcyB0aGUgQGNjY2xhc3MgbmFtZVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbREVCVUddIEF0dGVtcHRpbmcgdG8gY3JlYXRlIGNvbXBvbmVudCB3aXRoIG5vZGVVdWlkOiAke25vZGVVdWlkfSwgc2NyaXB0TmFtZTogJHtzY3JpcHROYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVSZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtY29tcG9uZW50Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHNjcmlwdE5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbREVCVUddIENyZWF0ZSBjb21wb25lbnQgcmVzdWx0OmAsIGNyZWF0ZVJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoY3JlYXRlRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0RFQlVHXSBDcmVhdGUgY29tcG9uZW50IGZhaWxlZDpgLCBjcmVhdGVFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBGYWlsZWQgdG8gY3JlYXRlIGNvbXBvbmVudDogJHtjcmVhdGVFcnJvcn1gIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gV2FpdCBmb3IgZWRpdG9yIHRvIGNvbXBsZXRlIGNvbXBvbmVudCBhZGRpdGlvblxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcblxuICAgICAgICAgICAgICAgIC8vIFZlcmlmeSBzY3JpcHQgd2FzIGF0dGFjaGVkIHN1Y2Nlc3NmdWxseVxuICAgICAgICAgICAgICAgIGNvbnN0IHZlcmlmeUNvbXBvbmVudHNJbmZvID0gYXdhaXQgdGhpcy5jb21wb25lbnRUb29scy5leGVjdXRlKCdjb21wb25lbnRfcXVlcnknLCB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2xpc3QnLFxuICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogbm9kZVV1aWRcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICh2ZXJpZnlDb21wb25lbnRzSW5mby5zdWNjZXNzICYmIHZlcmlmeUNvbXBvbmVudHNJbmZvLmRhdGE/LmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHNjcmlwdCBjb21wb25lbnQgYnkgbG9va2luZyBmb3IgYW55IGNvbXBvbmVudCB0aGF0J3Mgbm90IGEgYnVpbHQtaW4gY2MuKiB0eXBlXG4gICAgICAgICAgICAgICAgICAgIC8vIG9yIHNwZWNpZmljYWxseSBtYXRjaGVzIG91ciBzY3JpcHQgbmFtZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiZWZvcmVDb21wb25lbnRzID0gYWxsQ29tcG9uZW50c0luZm8uZGF0YT8uY29tcG9uZW50cz8ubWFwKChjOiBhbnkpID0+IGMudHlwZSkgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFmdGVyQ29tcG9uZW50cyA9IHZlcmlmeUNvbXBvbmVudHNJbmZvLmRhdGEuY29tcG9uZW50cy5tYXAoKGM6IGFueSkgPT4gYy50eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Q29tcG9uZW50cyA9IGFmdGVyQ29tcG9uZW50cy5maWx0ZXIoKHR5cGU6IHN0cmluZykgPT4gIWJlZm9yZUNvbXBvbmVudHMuaW5jbHVkZXModHlwZSkpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtERUJVR10gQ29tcG9uZW50cyBiZWZvcmU6ICR7YmVmb3JlQ29tcG9uZW50cy5qb2luKCcsICcpfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0RFQlVHXSBDb21wb25lbnRzIGFmdGVyOiAke2FmdGVyQ29tcG9uZW50cy5qb2luKCcsICcpfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0RFQlVHXSBOZXcgY29tcG9uZW50czogJHtuZXdDb21wb25lbnRzLmpvaW4oJywgJyl9YCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBMb29rIGZvciB0aGUgc2NyaXB0IGVpdGhlciBieSBuYW1lIG1hdGNoIG9yIGFzIGEgbmV3IG5vbi1jYy4qIGNvbXBvbmVudFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGRlZFNjcmlwdCA9IHZlcmlmeUNvbXBvbmVudHNJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kKChjb21wOiBhbnkpID0+IFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlID09PSBzY3JpcHROYW1lIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgKG5ld0NvbXBvbmVudHMuaW5jbHVkZXMoY29tcC50eXBlKSAmJiAhY29tcC50eXBlLnN0YXJ0c1dpdGgoJ2NjLicpKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkU2NyaXB0IHx8IG5ld0NvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmluYWxTY3JpcHQgPSBhZGRlZFNjcmlwdCB8fCB2ZXJpZnlDb21wb25lbnRzSW5mby5kYXRhLmNvbXBvbmVudHMuZmluZCgoY29tcDogYW55KSA9PiBuZXdDb21wb25lbnRzLmluY2x1ZGVzKGNvbXAudHlwZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIFNjcmlwdCAnJHtzY3JpcHROYW1lfScgYXR0YWNoZWQgc3VjY2Vzc2Z1bGx5IHRvIG5vZGVgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHROYW1lOiBzY3JpcHROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRQYXRoOiBzY3JpcHRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHJlYWR5RXhpc3RzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50SWQ6IGZpbmFsU2NyaXB0LmNpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZTogZmluYWxTY3JpcHQudHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBTY3JpcHQgJyR7c2NyaXB0TmFtZX0nIHdhcyBub3QgZm91bmQgb24gbm9kZSBhZnRlciBhdHRhY2htZW50IGF0dGVtcHQuIEF2YWlsYWJsZSBjb21wb25lbnRzOiAke2FmdGVyQ29tcG9uZW50cy5qb2luKCcsICcpfWBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHZlcmlmeSBzY3JpcHQgYXR0YWNobWVudDogJHt2ZXJpZnlDb21wb25lbnRzSW5mby5lcnJvciB8fCAnVW5hYmxlIHRvIHF1ZXJ5IG5vZGUgY29tcG9uZW50cyd9YFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHRyeSB1c2luZyBzY2VuZSBzY3JpcHQgZXhlY3V0aW9uXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVTY3JpcHRPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2Jlbi1jb2Nvcy1tY3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnYXR0YWNoU2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtub2RlVXVpZCwgc2NyaXB0UGF0aF1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVSZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLXNjZW5lLXNjcmlwdCcsIHNjZW5lU2NyaXB0T3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc2NlbmVSZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHNjZW5lRXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGF0dGFjaCBzY3JpcHQgJyR7c2NyaXB0UGF0aC5zcGxpdCgnLycpLnBvcCgpfSc6ICR7ZXJyLm1lc3NhZ2V9LiBQbGVhc2UgZW5zdXJlIHRoZSBzY3JpcHQgaXMgcHJvcGVybHkgY29tcGlsZWQgYW5kIGV4cG9ydGVkIGFzIGEgQ29tcG9uZW50IGNsYXNzLiBZb3UgY2FuIGFsc28gbWFudWFsbHkgYXR0YWNoIHRoZSBzY3JpcHQgdGhyb3VnaCB0aGUgUHJvcGVydGllcyBwYW5lbCBpbiB0aGUgZWRpdG9yLmBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTY3JpcHQgcmVtb3ZhbCBpbXBsZW1lbnRhdGlvblxuICAgIHByaXZhdGUgYXN5bmMgcmVtb3ZlU2NyaXB0RnJvbU5vZGUobm9kZVV1aWQ6IHN0cmluZywgc2NyaXB0Q2lkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIENvbXBvbmVudFRvb2xzIHRvIHJlbW92ZSB0aGUgc2NyaXB0IGNvbXBvbmVudFxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZVJlc3VsdCA9IGF3YWl0IHRoaXMuY29tcG9uZW50VG9vbHMuZXhlY3V0ZSgnY29tcG9uZW50X21hbmFnZScsIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVtb3ZlJyxcbiAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiBzY3JpcHRDaWRcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChyZW1vdmVSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg4pyFIFNjcmlwdCBjb21wb25lbnQgcmVtb3ZlZCBzdWNjZXNzZnVsbHkgZnJvbSBub2RlYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogbm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZENvbXBvbmVudElkOiBzY3JpcHRDaWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlbW92ZSBzY3JpcHQgY29tcG9uZW50OiAke3JlbW92ZVJlc3VsdC5lcnJvcn1gXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRXJyb3IgcmVtb3Zpbmcgc2NyaXB0IGNvbXBvbmVudDogJHtlcnIubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=
export const UI_GRAPH_SCHEMA_VERSION = 'ui-graph/v0.1';
export const UI_PATCH_SCHEMA_VERSION = 'ui-patch/v0.1';
export const UI_GRAPH_SKILL_VERSION = 'cocos-ui-graph-skill/v0.1';
export const UI_GRAPH_PLUGIN_VERSION = 'ui-graph-pipeline/v0.1';

export const SUPPORTED_FACTORIES = [
    'Node', 'Sprite', 'Label', 'Button', 'Toggle', 'Slider', 'ScrollView', 'PageView', 'PageViewIndicator', 'ProgressBar'
] as const;

export const SUPPORTED_OPERATIONS = [
    'addNode', 'removeNode', 'moveNode', 'setNodeProps', 'addComponent', 'removeComponent', 'setComponentProps',
    'setAssetRef', 'setEventBindings', 'instantiatePrefab', 'setPrefabInstanceOverride'
] as const;

export const BUILTIN_COMPONENT_PROPS: Record<string, string[]> = {
    Node: ['active', 'name', 'position', 'scale', 'rotation'],
    UITransform: ['contentSize', 'anchorPoint', 'width', 'height'],
    Sprite: ['spriteFrame', 'color', 'material', 'type', 'fillType', 'fillRange', 'fillStart'],
    Label: ['string', 'fontSize', 'color', 'font', 'horizontalAlign', 'verticalAlign', 'lineHeight', 'overflow', 'enableWrapText'],
    Button: ['interactable', 'transition', 'normalColor', 'pressedColor', 'hoverColor', 'disabledColor', 'clickEvents'],
    Widget: ['isAlignTop', 'isAlignBottom', 'isAlignLeft', 'isAlignRight', 'isAlignHorizontalCenter', 'isAlignVerticalCenter', 'top', 'bottom', 'left', 'right', 'horizontalCenter', 'verticalCenter'],
    Layout: ['type', 'resizeMode', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'spacingX', 'spacingY', 'horizontalDirection', 'verticalDirection'],
    Toggle: ['isChecked', 'checkMark', 'toggleGroup'],
    ToggleGroup: ['allowSwitchOff'],
    Slider: ['progress', 'handle', 'direction'],
    ProgressBar: ['progress', 'barSprite', 'mode', 'totalLength'],
    ScrollView: ['content', 'horizontal', 'vertical', 'scrollEvents'],
    PageView: ['content', 'direction', 'sizeMode', 'indicator'],
    PageViewIndicator: ['spriteFrame', 'direction', 'cellSize', 'spacing'],
    Mask: ['type', 'inverted']
};

export const COMPONENT_ALIASES: Record<string, string> = Object.fromEntries(
    Object.keys(BUILTIN_COMPONENT_PROPS).flatMap((name) => [[`cc.${name}`, name], [name, name]])
);

export const FORBIDDEN_TOP_LEVEL_FIELDS = ['dryRun', 'diff', 'confirmWrite', 'backup', 'rollback', 'id'];
export const NODE_REF_FIELDS = ['uuid', 'path', 'name'];
export const ASSET_TYPES = ['SpriteFrame', 'Prefab', 'Material', 'Script'];

export const uiGraphSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['schemaVersion', 'target', 'root'],
    properties: {
        schemaVersion: { const: UI_GRAPH_SCHEMA_VERSION },
        target: { $ref: '#/$defs/target' },
        metadata: { type: 'object' },
        root: { $ref: '#/$defs/node' }
    },
    $defs: {}
};

export const uiPatchSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['schemaVersion', 'target', 'operations'],
    properties: {
        schemaVersion: { const: UI_PATCH_SCHEMA_VERSION },
        target: { $ref: '#/$defs/target' },
        metadata: { type: 'object' },
        operations: { type: 'array', items: { type: 'object' } }
    },
    $defs: {}
};

export const uiGraphToolInputSchemas = {
    get_project_ui_context: {
        type: 'object',
        properties: {
            detailLevel: { type: 'string', enum: ['summary', 'schema'], default: 'summary' },
            includeTemplates: { type: 'boolean', default: false },
            templateNames: { type: 'array', items: { type: 'string' } },
            includeComponentProps: { type: 'boolean', default: false },
            components: { type: 'array', items: { type: 'string' } }
        },
        additionalProperties: false
    },
    target_query: {
        type: 'object',
        properties: {
            target: { type: 'object' },
            maxDepth: { type: 'number' },
            includeComponents: { type: 'boolean' },
            sparse: { type: 'boolean' }
        },
        required: ['target'],
        additionalProperties: false
    },
    validate_ui_graph: {
        type: 'object',
        properties: {
            graph: { type: 'object' },
            patch: { type: 'object' },
            resolveReferences: { type: 'boolean', default: false }
        },
        additionalProperties: false
    },
    generate_prefab_from_graph: {
        type: 'object',
        properties: { graph: { type: 'object' }, outputPath: { type: 'string' }, overwrite: { type: 'boolean', default: false } },
        required: ['graph', 'outputPath'],
        additionalProperties: false
    },
    apply_ui_patch: { type: 'object', properties: { patch: { type: 'object' } }, required: ['patch'], additionalProperties: false },
    instantiate_prefab_to_scene: {
        type: 'object',
        properties: { scene: { type: 'object' }, prefab: { type: 'object' }, parent: { type: 'object' }, props: { type: 'object' } },
        required: ['prefab', 'parent'],
        additionalProperties: false
    },
    resolve_assets: {
        type: 'object',
        properties: { assets: { type: 'array', items: { type: 'object' } } },
        required: ['assets'],
        additionalProperties: false
    }
};

export const CONTEXT_TEMPLATES: Record<string, any> = {
    'patch.addLabelNode': {
        schemaVersion: UI_PATCH_SCHEMA_VERSION,
        target: { type: 'prefab', path: 'db://assets/ui/MainPanel.prefab' },
        operations: [{ op: 'addNode', parent: { path: 'MainPanel' }, node: { name: 'TitleLabel', factory: 'Node', components: [{ type: 'UITransform', props: { contentSize: { width: 300, height: 80 } } }, { type: 'Label', props: { string: 'Title', fontSize: 55 } }] } }]
    },
    'graph.createLabelPrefab': {
        schemaVersion: UI_GRAPH_SCHEMA_VERSION,
        target: { type: 'prefab', path: 'db://assets/ui/LabelExample.prefab' },
        root: { name: 'LabelExample', factory: 'Node', children: [{ name: 'TitleLabel', factory: 'Node', components: [{ type: 'Label', props: { string: 'Title', fontSize: 55 } }] }] }
    }
};

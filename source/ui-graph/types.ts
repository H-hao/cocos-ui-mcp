export type UIGraphTargetType = 'prefab' | 'scene' | 'node';

export interface UIGraphTarget {
    type: UIGraphTargetType;
    path?: string;
    uuid?: string;
    current?: boolean;
}

export interface NodeRef {
    uuid?: string;
    path?: string;
    name?: string;
}

export interface UIGraphAssetRef {
    path?: string;
    uuid?: string;
    type?: 'SpriteFrame' | 'Prefab' | 'Material' | 'Script' | string;
}

export interface UIGraphComponent {
    type: string;
    props?: Record<string, any>;
    enabled?: boolean;
}

export interface UIGraphDynamicContent {
    containerRole?: string;
    dataSource?: string;
    itemPrefab?: UIGraphAssetRef;
    bindingScript?: UIGraphAssetRef;
    editorPreview?: unknown;
}

export interface UIGraphNode {
    name: string;
    uuid?: string;
    path?: string;
    active?: boolean;
    factory?: string;
    position?: { x?: number; y?: number; z?: number };
    scale?: { x?: number; y?: number; z?: number };
    rotation?: { x?: number; y?: number; z?: number };
    size?: { width?: number; height?: number };
    components?: UIGraphComponent[];
    children?: UIGraphNode[];
    prefab?: UIGraphAssetRef;
    prefabOverrides?: UIPrefabInstanceOverride[];
    dynamicContent?: UIGraphDynamicContent;
}

export interface UIGraph {
    schemaVersion: string;
    target: UIGraphTarget;
    metadata?: Record<string, any>;
    root: UIGraphNode;
}

export type UIPatchOperationName =
    | 'addNode'
    | 'removeNode'
    | 'moveNode'
    | 'setNodeProps'
    | 'addComponent'
    | 'removeComponent'
    | 'setComponentProps'
    | 'setAssetRef'
    | 'setEventBindings'
    | 'instantiatePrefab'
    | 'setPrefabInstanceOverride';

export interface UIPrefabInstanceOverride {
    target?: NodeRef;
    componentType?: string;
    props: Record<string, any>;
}

export interface UIPatchOperation {
    op: UIPatchOperationName | string;
    parent?: NodeRef;
    target?: NodeRef;
    node?: UIGraphNode;
    component?: UIGraphComponent;
    componentType?: string;
    props?: Record<string, any>;
    asset?: UIGraphAssetRef;
    prefab?: UIGraphAssetRef;
    scene?: UIGraphTarget;
    ifMissing?: 'error' | 'ignore';
    required?: boolean;
    [key: string]: any;
}

export interface UIPatch {
    schemaVersion: string;
    target: UIGraphTarget;
    operations: UIPatchOperation[];
    metadata?: Record<string, any>;
}

export interface UIValidationError {
    code: string;
    path: string;
    message: string;
    suggestion?: string;
}

export interface UIValidationWarning {
    code: string;
    path: string;
    message: string;
    suggestion?: string;
}

export interface UIValidationResult<T = any> {
    valid: boolean;
    normalized?: T;
    errors: UIValidationError[];
    warnings: UIValidationWarning[];
}

export interface UIOperationResult {
    index?: number;
    op: string;
    success: boolean;
    target?: any;
    createdNode?: { uuid?: string; path?: string; name?: string };
    warnings?: UIValidationWarning[];
    errors?: UIValidationError[];
}

export interface UIExecutionReport {
    success: boolean;
    target: UIGraphTarget | Record<string, any>;
    summary: Record<string, number>;
    operations: UIOperationResult[];
    usedAssets: UIGraphAssetRef[];
    warnings: UIValidationWarning[];
    errors: UIValidationError[];
    durationMs: number;
}

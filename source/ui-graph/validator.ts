import { BUILTIN_COMPONENT_PROPS, COMPONENT_ALIASES, FORBIDDEN_TOP_LEVEL_FIELDS, NODE_REF_FIELDS, SUPPORTED_FACTORIES, SUPPORTED_OPERATIONS, UI_GRAPH_SCHEMA_VERSION, UI_PATCH_SCHEMA_VERSION } from './schema';
import { UIGraph, UIGraphComponent, UIGraphNode, UIPatch, UIPatchOperation, UIValidationError, UIValidationResult, UIValidationWarning } from './types';

function isObject(value: any): value is Record<string, any> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

function error(code: string, path: string, message: string, suggestion?: string): UIValidationError {
    return { code, path, message, suggestion };
}

function warning(code: string, path: string, message: string, suggestion?: string): UIValidationWarning {
    return { code, path, message, suggestion };
}

const graphKeys = new Set(['schemaVersion', 'target', 'metadata', 'root']);
const patchKeys = new Set(['schemaVersion', 'target', 'metadata', 'operations']);
const targetKeys = new Set(['type', 'path', 'uuid', 'current']);
const nodeKeys = new Set(['name', 'uuid', 'path', 'active', 'factory', 'position', 'scale', 'rotation', 'size', 'components', 'children', 'prefab', 'prefabOverrides', 'dynamicContent']);
const componentKeys = new Set(['type', 'props', 'enabled']);
const operationCommonKeys = new Set(['op', 'parent', 'target', 'node', 'component', 'componentType', 'props', 'asset', 'prefab', 'scene', 'ifMissing', 'required', 'eventBindings', 'overrides', 'newParent']);

export function normalizeComponentType(type: string): string {
    return COMPONENT_ALIASES[type] || type;
}

function isScriptComponent(type: string): boolean {
    return type.startsWith('script:') || type.startsWith('db://') || type.includes('/') || /^[0-9a-fA-F_-]{8,}$/.test(type);
}

function checkUnknownKeys(value: Record<string, any>, allowed: Set<string>, path: string, errors: UIValidationError[]) {
    for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
            errors.push(error('UNKNOWN_FIELD', `${path}.${key}`, `Unknown field "${key}" is not allowed.`, 'Remove this field or update the UI Graph protocol.'));
        }
    }
}

function checkForbiddenTopLevel(value: Record<string, any>, path: string, errors: UIValidationError[]) {
    for (const key of FORBIDDEN_TOP_LEVEL_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            errors.push(error('FORBIDDEN_FIELD', `${path}.${key}`, `Field "${key}" is forbidden in v0.1.`, 'v0.1 executes directly after validation; remove dry-run/diff/confirm/backup/rollback/id fields.'));
        }
    }
}

function validateTarget(target: any, path: string, errors: UIValidationError[]) {
    if (!isObject(target)) {
        errors.push(error('INVALID_TARGET', path, 'target must be an object.'));
        return;
    }
    checkUnknownKeys(target, targetKeys, path, errors);
    if (!['prefab', 'scene', 'node'].includes(target.type)) {
        errors.push(error('INVALID_TARGET_TYPE', `${path}.type`, 'target.type must be prefab, scene, or node.'));
    }
    if (!target.path && !target.uuid && target.current !== true && target.type !== 'node') {
        errors.push(error('TARGET_REF_REQUIRED', path, 'target must include path, uuid, or current=true.', 'Use a db:// path when possible.'));
    }
}

function validateNodeRef(ref: any, path: string, errors: UIValidationError[]) {
    if (!isObject(ref)) {
        errors.push(error('INVALID_NODE_REF', path, 'NodeRef must be an object.'));
        return;
    }
    const allowed = new Set(NODE_REF_FIELDS);
    checkUnknownKeys(ref, allowed, path, errors);
    if (!ref.uuid && !ref.path && !ref.name) {
        errors.push(error('NODE_REF_REQUIRED', path, 'NodeRef must include at least one of uuid, path, or name.', 'Inspect/export the target first, then use uuid or path.'));
    }
}

function validateProps(componentType: string, props: any, path: string, errors: UIValidationError[], warnings: UIValidationWarning[]) {
    if (props === undefined) return;
    if (!isObject(props)) {
        errors.push(error('INVALID_COMPONENT_PROPS', path, 'component.props must be an object.'));
        return;
    }
    const supported = BUILTIN_COMPONENT_PROPS[componentType];
    if (!supported) {
        for (const [key, value] of Object.entries(props)) {
            if (Array.isArray(value)) {
                errors.push(error('UNSUPPORTED_SCRIPT_PROP_TYPE', `${path}.${key}`, 'Custom script array properties are not supported in v0.1.', 'Use scalar/object references only or extend the script schema.'));
            }
        }
        warnings.push(warning('SCRIPT_PROP_SCHEMA_UNKNOWN', path, `Custom script component "${componentType}" is accepted with basic JSON prop validation only.`));
        return;
    }
    const allowed = new Set(supported);
    for (const key of Object.keys(props)) {
        if (!allowed.has(key)) {
            errors.push(error('UNKNOWN_COMPONENT_PROP', `${path}.${key}`, `${componentType}.${key} is not supported or is misspelled.`, `Use one of: ${supported.join(', ')}`));
        }
    }
}

function validateComponent(component: any, path: string, errors: UIValidationError[], warnings: UIValidationWarning[]): UIGraphComponent | undefined {
    if (!isObject(component)) {
        errors.push(error('INVALID_COMPONENT', path, 'component must be an object.'));
        return undefined;
    }
    checkUnknownKeys(component, componentKeys, path, errors);
    if (typeof component.type !== 'string' || !component.type) {
        errors.push(error('COMPONENT_TYPE_REQUIRED', `${path}.type`, 'component.type is required.'));
        return component as UIGraphComponent;
    }
    const normalizedType = normalizeComponentType(component.type);
    if (normalizedType !== component.type) {
        warnings.push(warning('COMPONENT_TYPE_NORMALIZED', `${path}.type`, `Component alias "${component.type}" normalized to "${normalizedType}".`));
        component.type = normalizedType;
    }
    if (!BUILTIN_COMPONENT_PROPS[normalizedType] && !isScriptComponent(normalizedType)) {
        errors.push(error('UNKNOWN_COMPONENT_TYPE', `${path}.type`, `Component type "${normalizedType}" is not supported or recognizable as a script component.`, 'Use a built-in short name such as Label/Sprite/UITransform, or a script: identifier.'));
    }
    validateProps(normalizedType, component.props, `${path}.props`, errors, warnings);
    return component as UIGraphComponent;
}

function validateNode(node: any, path: string, errors: UIValidationError[], warnings: UIValidationWarning[]): UIGraphNode | undefined {
    if (!isObject(node)) {
        errors.push(error('INVALID_NODE', path, 'node must be an object.'));
        return undefined;
    }
    checkUnknownKeys(node, nodeKeys, path, errors);
    if (typeof node.name !== 'string' || !node.name) {
        errors.push(error('NODE_NAME_REQUIRED', `${path}.name`, 'node.name is required.'));
    }
    if (node.factory !== undefined && !SUPPORTED_FACTORIES.includes(node.factory)) {
        errors.push(error('UNKNOWN_FACTORY', `${path}.factory`, `factory "${node.factory}" is not supported.`, `Use one of: ${SUPPORTED_FACTORIES.join(', ')}`));
    }
    if (Array.isArray(node.components)) {
        node.components.forEach((component: any, index: number) => validateComponent(component, `${path}.components[${index}]`, errors, warnings));
    } else if (node.components !== undefined) {
        errors.push(error('INVALID_COMPONENTS', `${path}.components`, 'components must be an array.'));
    }
    if (Array.isArray(node.children)) {
        node.children.forEach((child: any, index: number) => validateNode(child, `${path}.children[${index}]`, errors, warnings));
    } else if (node.children !== undefined) {
        errors.push(error('INVALID_CHILDREN', `${path}.children`, 'children must be an array.'));
    }
    if (isObject(node.dynamicContent) && Object.prototype.hasOwnProperty.call(node.dynamicContent, 'editorPreview')) {
        warnings.push(warning('EDITOR_PREVIEW_NOT_SUPPORTED_IN_V1', `${path}.dynamicContent.editorPreview`, 'editorPreview is accepted but preview nodes are not generated in v0.1.'));
    }
    return node as UIGraphNode;
}

function validateOperation(operation: any, index: number, errors: UIValidationError[], warnings: UIValidationWarning[]) {
    const path = `$.operations[${index}]`;
    if (!isObject(operation)) {
        errors.push(error('INVALID_PATCH_OPERATION', path, 'operation must be an object.'));
        return;
    }
    checkUnknownKeys(operation, operationCommonKeys, path, errors);
    if (!SUPPORTED_OPERATIONS.includes(operation.op)) {
        errors.push(error('UNKNOWN_PATCH_OPERATION', `${path}.op`, `Patch operation "${operation.op}" is not supported.`, `Use one of: ${SUPPORTED_OPERATIONS.join(', ')}`));
    }
    if (operation.parent !== undefined) validateNodeRef(operation.parent, `${path}.parent`, errors);
    if (operation.target !== undefined) validateNodeRef(operation.target, `${path}.target`, errors);
    if (operation.node !== undefined) validateNode(operation.node, `${path}.node`, errors, warnings);
    if (operation.component !== undefined) validateComponent(operation.component, `${path}.component`, errors, warnings);
    if (operation.componentType !== undefined) {
        const normalizedType = normalizeComponentType(String(operation.componentType));
        if (normalizedType !== operation.componentType) {
            warnings.push(warning('COMPONENT_TYPE_NORMALIZED', `${path}.componentType`, `Component alias "${operation.componentType}" normalized to "${normalizedType}".`));
            operation.componentType = normalizedType;
        }
        validateProps(normalizedType, operation.props, `${path}.props`, errors, warnings);
    }
    if (operation.op === 'addNode' && !operation.parent) {
        errors.push(error('PARENT_REQUIRED', `${path}.parent`, 'addNode requires parent NodeRef.'));
    }
    if (operation.op === 'addNode' && !operation.node) {
        errors.push(error('NODE_REQUIRED', `${path}.node`, 'addNode requires node.'));
    }
    if (operation.op === 'addComponent' && !operation.component) {
        errors.push(error('COMPONENT_REQUIRED', `${path}.component`, 'addComponent requires component.'));
    }
    if ((operation.op === 'removeComponent' || operation.op === 'setComponentProps') && !operation.componentType) {
        errors.push(error('COMPONENT_TYPE_REQUIRED', `${path}.componentType`, `${operation.op} requires componentType.`));
    }
    if (operation.op === 'instantiatePrefab' && !operation.prefab) {
        errors.push(error('PREFAB_REQUIRED', `${path}.prefab`, 'instantiatePrefab requires prefab asset reference.'));
    }
    if (operation.op === 'instantiatePrefab' && !operation.parent && !operation.target) {
        errors.push(error('PARENT_REQUIRED', `${path}.parent`, 'instantiatePrefab requires parent or target NodeRef.'));
    }
    if (['removeNode', 'moveNode', 'setNodeProps', 'addComponent', 'removeComponent', 'setComponentProps', 'setAssetRef', 'setEventBindings', 'setPrefabInstanceOverride'].includes(operation.op) && !operation.target) {
        errors.push(error('TARGET_NODE_REQUIRED', `${path}.target`, `${operation.op} requires target NodeRef.`));
    }
}

export function validateUiGraph(graph: any): UIValidationResult<UIGraph> {
    const errors: UIValidationError[] = [];
    const warnings: UIValidationWarning[] = [];
    const normalized = isObject(graph) ? clone(graph) : graph;
    if (!isObject(normalized)) {
        return { valid: false, errors: [error('INVALID_GRAPH', '$', 'Graph must be an object.')], warnings };
    }
    checkForbiddenTopLevel(normalized, '$', errors);
    checkUnknownKeys(normalized, graphKeys, '$', errors);
    if (normalized.schemaVersion !== UI_GRAPH_SCHEMA_VERSION) {
        errors.push(error('INVALID_SCHEMA_VERSION', '$.schemaVersion', `Graph schemaVersion must be ${UI_GRAPH_SCHEMA_VERSION}.`));
    }
    validateTarget(normalized.target, '$.target', errors);
    validateNode(normalized.root, '$.root', errors, warnings);
    return { valid: errors.length === 0, normalized: normalized as UIGraph, errors, warnings };
}

export function validateUiPatch(patch: any): UIValidationResult<UIPatch> {
    const errors: UIValidationError[] = [];
    const warnings: UIValidationWarning[] = [];
    const normalized = isObject(patch) ? clone(patch) : patch;
    if (!isObject(normalized)) {
        return { valid: false, errors: [error('INVALID_PATCH', '$', 'Patch must be an object.')], warnings };
    }
    checkForbiddenTopLevel(normalized, '$', errors);
    checkUnknownKeys(normalized, patchKeys, '$', errors);
    if (normalized.schemaVersion !== UI_PATCH_SCHEMA_VERSION) {
        errors.push(error('INVALID_SCHEMA_VERSION', '$.schemaVersion', `Patch schemaVersion must be ${UI_PATCH_SCHEMA_VERSION}.`));
    }
    validateTarget(normalized.target, '$.target', errors);
    if (!Array.isArray(normalized.operations)) {
        errors.push(error('OPERATIONS_REQUIRED', '$.operations', 'operations must be an array.'));
    } else {
        normalized.operations.forEach((operation: UIPatchOperation, index: number) => validateOperation(operation, index, errors, warnings));
    }
    return { valid: errors.length === 0, normalized: normalized as UIPatch, errors, warnings };
}

export function validateUiPayload(payload: { graph?: any; patch?: any }): UIValidationResult {
    if (payload.graph) return validateUiGraph(payload.graph);
    if (payload.patch) return validateUiPatch(payload.patch);
    return { valid: false, errors: [error('PAYLOAD_REQUIRED', '$', 'Provide either graph or patch.')], warnings: [] };
}

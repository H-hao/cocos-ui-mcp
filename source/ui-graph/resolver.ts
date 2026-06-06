import { ASSET_TYPES } from './schema';
import { UIGraphAssetRef, UIGraphTarget, NodeRef, UIValidationError } from './types';
import { normalizeComponentType } from './validator';
import { componentShortName, isEditorAvailable, loadTarget, queryAssetInfo, readComponents, readNodeName, readNodeUuid, resolveNodeInTree } from './editor-adapter';

function error(code: string, path: string, message: string, suggestion?: string): UIValidationError {
    return { code, path, message, suggestion };
}

export interface ResolvedAsset extends UIGraphAssetRef {
    exists: boolean;
    typeMatched: boolean;
    actualType?: string;
    errors: UIValidationError[];
    warnings: any[];
}

const ASSET_TYPE_ALIASES: Record<string, string[]> = {
    SpriteFrame: ['sprite-frame', 'spriteframe', 'cc.spriteframe', 'texture'],
    Prefab: ['prefab', 'cc.prefab'],
    Material: ['material', 'cc.material'],
    Script: ['typescript', 'javascript', 'script', 'component', 'cc.component']
};

function matchesAssetType(expected: string | undefined, actual: string): boolean {
    if (!expected || !actual) return true;
    const normalizedExpected = expected.toLowerCase();
    const normalizedActual = actual.toLowerCase();
    const aliases = ASSET_TYPE_ALIASES[expected] || [normalizedExpected];
    return aliases.some((alias) => normalizedActual === alias || normalizedActual.includes(alias));
}

export async function resolveAsset(asset: UIGraphAssetRef, path = '$.asset'): Promise<ResolvedAsset> {
    const result: ResolvedAsset = { ...asset, exists: false, typeMatched: true, errors: [], warnings: [] };
    if (!asset?.path && !asset?.uuid) {
        result.errors.push(error('ASSET_REF_REQUIRED', path, 'AssetRef must include path or uuid.'));
        return result;
    }
    if (asset.type && !ASSET_TYPES.includes(asset.type as any)) {
        result.errors.push(error('UNKNOWN_ASSET_TYPE', `${path}.type`, `Asset type ${asset.type} is not supported.`, `Use one of: ${ASSET_TYPES.join(', ')}`));
        return result;
    }
    if (!isEditorAvailable()) {
        result.warnings.push({ code: 'EDITOR_API_UNAVAILABLE', path, message: 'Cocos Editor asset-db API is unavailable in this environment.' });
        return result;
    }
    try {
        const info = await queryAssetInfo(asset);
        if (!info) {
            result.errors.push(error('ASSET_NOT_FOUND', path, `Asset ${asset.path || asset.uuid} was not found.`, 'Use resolve_assets before writing.'));
            return result;
        }
        result.exists = true;
        result.path = info.url || info.path || asset.path;
        result.uuid = info.uuid || asset.uuid;
        const actualType = String(info.type || info.importer || info.extname || '');
        result.actualType = actualType;
        result.type = asset.type || actualType || result.type;
        if (!matchesAssetType(asset.type, actualType)) {
            result.typeMatched = false;
            result.errors.push(error('ASSET_TYPE_MISMATCH', `${path}.type`, `Asset type ${actualType || 'unknown'} does not match expected ${asset.type}.`));
        }
    } catch (e: any) {
        result.errors.push(error('ASSET_NOT_FOUND', path, e?.message || `Asset ${asset.path || asset.uuid} was not found.`));
    }
    return result;
}

export async function resolveAssets(assets: UIGraphAssetRef[]): Promise<ResolvedAsset[]> {
    return Promise.all((assets || []).map((asset, index) => resolveAsset(asset, `$.assets[${index}]`)));
}

export async function resolveTarget(target: UIGraphTarget): Promise<any> {
    const loaded = await loadTarget(target);
    return { ...target, root: loaded.root, mode: loaded.mode, warnings: loaded.warnings, resolved: Boolean(loaded.root) };
}

export function resolveNodeRef(root: any, ref: NodeRef, path = '$.target'): any {
    if (!root) throw error('TARGET_NOT_LOADED', '$.target', 'Target root is not loaded.');
    try {
        const node = resolveNodeInTree(root, ref);
        if (!node) throw error('NODE_NOT_FOUND', path, `Node ${ref.uuid || ref.path || ref.name} was not found.`, 'Inspect/export the target and use uuid or a full path.');
        return { ...node, uuid: readNodeUuid(node), name: readNodeName(node) };
    } catch (e: any) {
        if (e?.code === 'AMBIGUOUS_NODE_NAME') throw error('AMBIGUOUS_NODE_NAME', path, e.message, 'Use uuid or a full path from inspect/export.');
        throw e;
    }
}

export function resolveComponent(node: any, componentType: string, path = '$.componentType'): any {
    const normalized = normalizeComponentType(componentType);
    const components = readComponents(node);
    const matches = components.filter((item) => item.type === normalized || componentShortName(item.rawType) === normalized || item.rawType === componentType);
    if (matches.length === 0) throw error('COMPONENT_NOT_FOUND', path, `Component ${normalized} was not found on node ${readNodeName(node)}.`);
    if (matches.length > 1) throw error('AMBIGUOUS_COMPONENT_TYPE', path, `Component ${normalized} matched multiple components on node ${readNodeName(node)}.`, 'Use a more specific custom script component type.');
    return matches[0];
}

export function collectAssetRefs(value: any, refs: UIGraphAssetRef[] = []): UIGraphAssetRef[] {
    if (!value || typeof value !== 'object') return refs;
    if (Array.isArray(value)) {
        value.forEach((item) => collectAssetRefs(item, refs));
        return refs;
    }
    if (value.asset && typeof value.asset === 'object') refs.push(value.asset);
    else if ((value.path || value.uuid) && value.type && ASSET_TYPES.includes(value.type)) refs.push(value);
    Object.values(value).forEach((item) => collectAssetRefs(item, refs));
    return refs;
}

export async function resolveEditorValue(root: any, value: any, path = '$.props'): Promise<any> {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return Promise.all(value.map((item, index) => resolveEditorValue(root, item, `${path}[${index}]`)));
    if (value.asset) {
        const resolved = await resolveAsset(value.asset, `${path}.asset`);
        if (resolved.errors.length) throw resolved.errors[0];
        return resolved.uuid || resolved.path;
    }
    if (value.node) {
        const node = resolveNodeRef(root, value.node, `${path}.node`);
        if (value.componentType) {
            const component = resolveComponent(node, value.componentType, `${path}.componentType`);
            return component.uuid || { node: readNodeUuid(node), componentType: component.rawType };
        }
        return readNodeUuid(node);
    }
    if ((value.path || value.uuid) && value.type && ASSET_TYPES.includes(value.type)) {
        const resolved = await resolveAsset(value, path);
        if (resolved.errors.length) throw resolved.errors[0];
        return resolved.uuid || resolved.path;
    }
    const resolved: Record<string, any> = {};
    for (const [key, child] of Object.entries(value)) {
        resolved[key] = await resolveEditorValue(root, child, `${path}.${key}`);
    }
    return resolved;
}

export async function resolveEditorProps(root: any, props: Record<string, any> = {}, path = '$.props'): Promise<Record<string, any>> {
    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(props || {})) {
        resolved[key] = await resolveEditorValue(root, value, `${path}.${key}`);
    }
    return resolved;
}

export async function resolveScriptReference(value: any): Promise<any> {
    if (value?.asset) return resolveAsset(value.asset);
    return value;
}

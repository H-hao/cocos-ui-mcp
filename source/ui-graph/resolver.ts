import { UIGraphAssetRef, UIGraphTarget, NodeRef, UIValidationError } from './types';
import { normalizeComponentType } from './validator';
import { componentShortName, isEditorAvailable, loadTarget, queryAssetInfo, readComponents, readNodeName, readNodeUuid, resolveNodeInTree } from './editor-adapter';

function error(code: string, path: string, message: string, suggestion?: string): UIValidationError {
    return { code, path, message, suggestion };
}

export interface ResolvedAsset extends UIGraphAssetRef {
    exists: boolean;
    typeMatched: boolean;
    errors: UIValidationError[];
    warnings: any[];
}

export async function resolveAsset(asset: UIGraphAssetRef): Promise<ResolvedAsset> {
    const result: ResolvedAsset = { ...asset, exists: false, typeMatched: true, errors: [], warnings: [] };
    if (!asset?.path && !asset?.uuid) {
        result.errors.push(error('ASSET_REF_REQUIRED', '$.asset', 'AssetRef must include path or uuid.'));
        return result;
    }
    if (!isEditorAvailable()) {
        result.warnings.push({ code: 'EDITOR_API_UNAVAILABLE', path: '$.asset', message: 'Cocos Editor asset-db API is unavailable in this environment.' });
        return result;
    }
    try {
        const info = await queryAssetInfo(asset);
        if (!info) {
            result.errors.push(error('ASSET_NOT_FOUND', '$.asset', `Asset ${asset.path || asset.uuid} was not found.`, 'Use resolve_assets before writing.'));
            return result;
        }
        result.exists = true;
        result.path = info.url || info.path || asset.path;
        result.uuid = info.uuid || asset.uuid;
        const actualType = String(info.type || info.importer || '');
        result.type = asset.type || actualType || result.type;
        if (asset.type && actualType && !actualType.toLowerCase().includes(String(asset.type).toLowerCase())) {
            result.typeMatched = false;
            result.errors.push(error('ASSET_TYPE_MISMATCH', '$.asset.type', `Asset type ${actualType} does not match expected ${asset.type}.`));
        }
    } catch (e: any) {
        result.errors.push(error('ASSET_NOT_FOUND', '$.asset', e?.message || `Asset ${asset.path || asset.uuid} was not found.`));
    }
    return result;
}

export async function resolveAssets(assets: UIGraphAssetRef[]): Promise<ResolvedAsset[]> {
    return Promise.all((assets || []).map(resolveAsset));
}

export async function resolveTarget(target: UIGraphTarget): Promise<any> {
    const loaded = await loadTarget(target);
    return { ...target, root: loaded.root, mode: loaded.mode, warnings: loaded.warnings, resolved: Boolean(loaded.root) };
}

export function resolveNodeRef(root: any, ref: NodeRef): any {
    if (!root) throw error('TARGET_NOT_LOADED', '$.target', 'Target root is not loaded.');
    try {
        const node = resolveNodeInTree(root, ref);
        if (!node) throw error('NODE_NOT_FOUND', '$.target', `Node ${ref.uuid || ref.path || ref.name} was not found.`);
        return { ...node, uuid: readNodeUuid(node), name: readNodeName(node) };
    } catch (e: any) {
        if (e?.code === 'AMBIGUOUS_NODE_NAME') throw error('AMBIGUOUS_NODE_NAME', '$.target', e.message, 'Use uuid or a full path from inspect/export.');
        throw e;
    }
}

export function resolveComponent(node: any, componentType: string): any {
    const normalized = normalizeComponentType(componentType);
    const components = readComponents(node);
    const component = components.find((item) => item.type === normalized || componentShortName(item.rawType) === normalized);
    if (!component) throw error('COMPONENT_NOT_FOUND', '$.componentType', `Component ${normalized} was not found on node ${readNodeName(node)}.`);
    return component;
}

export async function resolveScriptReference(value: any): Promise<any> {
    if (value?.asset) return resolveAsset(value.asset);
    return value;
}

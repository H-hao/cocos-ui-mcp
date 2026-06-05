import { UIGraphAssetRef, UIGraphTarget, NodeRef, UIValidationError } from './types';
import { normalizeComponentType } from './validator';

function error(code: string, path: string, message: string, suggestion?: string): UIValidationError {
    return { code, path, message, suggestion };
}

function getEditor(): any {
    return (globalThis as any).Editor;
}

export interface ResolvedAsset extends UIGraphAssetRef {
    exists: boolean;
    typeMatched: boolean;
    errors: UIValidationError[];
    warnings: any[];
}

export async function resolveAsset(asset: UIGraphAssetRef): Promise<ResolvedAsset> {
    const editor = getEditor();
    const result: ResolvedAsset = { ...asset, exists: false, typeMatched: true, errors: [], warnings: [] };
    try {
        let info: any = null;
        if (asset.path && editor?.Message?.request) {
            info = await editor.Message.request('asset-db', 'query-asset-info', asset.path);
        } else if (asset.uuid && editor?.Message?.request) {
            info = await editor.Message.request('asset-db', 'query-asset-info', asset.uuid);
        }
        if (info) {
            result.exists = true;
            result.path = info.url || asset.path;
            result.uuid = info.uuid || asset.uuid;
            result.type = asset.type || info.type || info.importer;
            if (asset.type && info.type && String(info.type).toLowerCase().indexOf(String(asset.type).toLowerCase()) === -1) {
                result.typeMatched = false;
                result.errors.push(error('ASSET_TYPE_MISMATCH', '$.asset', `Asset type does not match ${asset.type}.`));
            }
        } else if (!editor?.Message?.request) {
            result.warnings.push({ code: 'EDITOR_API_UNAVAILABLE', path: '$.asset', message: 'Cocos Editor asset-db API is unavailable in this environment.' });
        } else {
            result.errors.push(error('ASSET_NOT_FOUND', '$.asset', `Asset ${asset.path || asset.uuid} was not found.`, 'Use resolve_assets before writing.'));
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
    return { ...target, resolved: Boolean(target?.path || target?.uuid || target?.current) };
}

export function resolveNodeRef(root: any, ref: NodeRef): any {
    if (!root) throw error('TARGET_NOT_LOADED', '$.target', 'Target root is not loaded.');
    const matches: any[] = [];
    const visit = (node: any, path: string) => {
        const nodePath = node.path || path;
        if (ref.uuid && node.uuid === ref.uuid) matches.push(node);
        else if (ref.path && nodePath === ref.path) matches.push(node);
        else if (ref.name && node.name === ref.name) matches.push(node);
        (node.children || []).forEach((child: any) => visit(child, `${nodePath}/${child.name}`));
    };
    visit(root, root.name || 'Root');
    if (matches.length === 0) throw error('NODE_NOT_FOUND', '$.target', `Node ${ref.uuid || ref.path || ref.name} was not found.`);
    if (!ref.uuid && matches.length > 1) throw error('AMBIGUOUS_NODE_NAME', '$.target', `Node ref ${ref.path || ref.name} matched multiple nodes.`, 'Use uuid or a full path from inspect/export.');
    return matches[0];
}

export function resolveComponent(node: any, componentType: string): any {
    const normalized = normalizeComponentType(componentType);
    const component = (node?.components || []).find((item: any) => normalizeComponentType(item.type) === normalized);
    if (!component) throw error('COMPONENT_NOT_FOUND', '$.componentType', `Component ${normalized} was not found on node ${node?.name || ''}.`);
    return component;
}

export async function resolveScriptReference(value: any): Promise<any> {
    if (value?.asset) return resolveAsset(value.asset);
    return value;
}

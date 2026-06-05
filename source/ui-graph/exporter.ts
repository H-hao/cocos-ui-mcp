import { UIGraph, UIGraphNode, UIGraphTarget } from './types';
import { UI_GRAPH_SCHEMA_VERSION } from './schema';

function getEditor(): any {
    return (globalThis as any).Editor;
}

function componentTypeName(component: any): string {
    const name = component?.constructor?.name || component?.type || component?.name || 'Component';
    return String(name).replace(/^cc\./, '');
}

export async function inspectUiGraph(target: UIGraphTarget, maxDepth = 4, includeComponents = true): Promise<any> {
    const root = await loadTargetRoot(target);
    if (!root) {
        return {
            target,
            warnings: [{ code: 'EDITOR_TARGET_UNAVAILABLE', path: '$.target', message: 'Target could not be loaded in this environment; returning target-only summary.' }],
            root: null
        };
    }
    return { target, root: summarizeNode(root, 0, maxDepth, includeComponents) };
}

export async function exportUiGraph(target: UIGraphTarget, sparse = true): Promise<{ graph: UIGraph; warnings: any[]; unsupported: any[] }> {
    const root = await loadTargetRoot(target);
    const warnings: any[] = [];
    let graphRoot: UIGraphNode;
    if (root) {
        graphRoot = exportNode(root, sparse);
    } else {
        graphRoot = { name: target.path?.split('/').pop()?.replace(/\.(prefab|scene)$/, '') || 'UIRoot', factory: 'Node', children: [] };
        warnings.push({ code: 'EDITOR_TARGET_UNAVAILABLE', path: '$.target', message: 'Target could not be loaded; exported a placeholder graph root.' });
    }
    return {
        graph: { schemaVersion: UI_GRAPH_SCHEMA_VERSION, target, root: graphRoot, metadata: { generator: 'cocos-ui-mcp', managedBy: 'ui-graph' } },
        warnings,
        unsupported: []
    };
}

async function loadTargetRoot(target: UIGraphTarget): Promise<any> {
    const editor = getEditor();
    if (!editor?.Message?.request) return null;
    try {
        if (target.type === 'scene' || target.current) {
            const hierarchy = await editor.Message.request('scene', 'query-node-tree');
            return hierarchy?.children?.[0] || hierarchy || null;
        }
        if (target.path) {
            const info = await editor.Message.request('asset-db', 'query-asset-info', target.path);
            return info ? { name: info.name || target.path.split('/').pop(), uuid: info.uuid, path: target.path, children: [] } : null;
        }
    } catch {
        return null;
    }
    return null;
}

function summarizeNode(node: any, depth: number, maxDepth: number, includeComponents: boolean): any {
    const summary: any = {
        name: node.name,
        uuid: node.uuid,
        path: node.path,
        active: node.active,
        position: node.position,
        size: node.size || node.contentSize
    };
    if (includeComponents) summary.components = (node.components || []).map(componentTypeName);
    if (depth < maxDepth) summary.children = (node.children || []).map((child: any) => summarizeNode(child, depth + 1, maxDepth, includeComponents));
    return summary;
}

function exportNode(node: any, sparse: boolean): UIGraphNode {
    const graphNode: UIGraphNode = {
        name: node.name || 'Node',
        uuid: node.uuid,
        path: node.path,
        factory: 'Node'
    };
    if (!sparse || node.active === false) graphNode.active = node.active !== false;
    if (node.position) graphNode.position = node.position;
    if (node.size || node.contentSize) graphNode.size = node.size || node.contentSize;
    const components = (node.components || []).map((component: any) => ({ type: componentTypeName(component), props: {} }));
    if (components.length) graphNode.components = components;
    const children = (node.children || []).map((child: any) => exportNode(child, sparse));
    if (children.length) graphNode.children = children;
    return graphNode;
}

import { UIGraph, UIGraphNode, UIGraphTarget } from './types';
import { UI_GRAPH_SCHEMA_VERSION } from './schema';
import { loadTarget, queryNode, readComponents, readNodeActive, readNodeName, readNodeUuid, unwrapDumpValue } from './editor-adapter';

export async function inspectUiGraph(target: UIGraphTarget, maxDepth = 4, includeComponents = true): Promise<any> {
    const loaded = await loadTarget(target);
    if (!loaded.root) {
        return { target, warnings: loaded.warnings, root: null };
    }
    return { target, mode: loaded.mode, warnings: loaded.warnings, root: await summarizeNode(loaded.root, 0, maxDepth, includeComponents, readNodeName(loaded.root)) };
}

export async function exportUiGraph(target: UIGraphTarget, sparse = true): Promise<{ graph: UIGraph; warnings: any[]; unsupported: any[] }> {
    const loaded = await loadTarget(target);
    const warnings = [...loaded.warnings];
    let graphRoot: UIGraphNode;
    if (loaded.root) {
        graphRoot = await exportNode(loaded.root, sparse, readNodeName(loaded.root));
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

async function summarizeNode(node: any, depth: number, maxDepth: number, includeComponents: boolean, path: string): Promise<any> {
    const uuid = readNodeUuid(node);
    const fullNode = uuid ? await tryQueryNode(uuid) : node;
    const summary: any = {
        name: readNodeName(fullNode || node),
        uuid,
        path,
        active: readNodeActive(fullNode || node),
        position: unwrapDumpValue(fullNode?.position || fullNode?._lpos),
        size: extractSize(fullNode)
    };
    if (includeComponents) summary.components = readComponents(fullNode || node).map((component) => component.type);
    if (depth < maxDepth) {
        summary.children = [];
        for (const child of node.children || []) {
            const childPath = `${path}/${readNodeName(child)}`;
            summary.children.push(await summarizeNode(child, depth + 1, maxDepth, includeComponents, childPath));
        }
    }
    return summary;
}

async function exportNode(node: any, sparse: boolean, path: string): Promise<UIGraphNode> {
    const uuid = readNodeUuid(node);
    const fullNode = uuid ? await tryQueryNode(uuid) : node;
    const source = fullNode || node;
    const graphNode: UIGraphNode = { name: readNodeName(source), uuid, path, factory: inferFactory(source) };
    const active = readNodeActive(source);
    if (!sparse || active === false) graphNode.active = active !== false;
    const position = unwrapDumpValue(source?.position || source?._lpos);
    if (position && (!sparse || hasNonZeroVector(position))) graphNode.position = position;
    const size = extractSize(source);
    if (size && (!sparse || size.width !== 0 || size.height !== 0)) graphNode.size = size;
    const components = readComponents(source).map((component) => ({ type: component.type, props: extractSparseComponentProps(component.raw, component.type, sparse) }));
    if (components.length) graphNode.components = components;
    const children: UIGraphNode[] = [];
    for (const child of node.children || []) {
        children.push(await exportNode(child, sparse, `${path}/${readNodeName(child)}`));
    }
    if (children.length) graphNode.children = children;
    return graphNode;
}

async function tryQueryNode(uuid: string): Promise<any | null> {
    try { return await queryNode(uuid); } catch { return null; }
}

function inferFactory(nodeData: any): string {
    const types = readComponents(nodeData).map((component) => component.type);
    for (const factory of ['Button', 'Label', 'Sprite', 'Toggle', 'Slider', 'ScrollView', 'PageView', 'PageViewIndicator', 'ProgressBar']) {
        if (types.includes(factory)) return factory;
    }
    return 'Node';
}

function extractSize(nodeData: any): any {
    const transform = readComponents(nodeData).find((component) => component.type === 'UITransform')?.raw;
    const width = unwrapDumpValue(transform?.width ?? transform?._contentSize?.width ?? nodeData?.width);
    const height = unwrapDumpValue(transform?.height ?? transform?._contentSize?.height ?? nodeData?.height);
    if (width === undefined && height === undefined) return undefined;
    return { width: Number(width || 0), height: Number(height || 0) };
}

function extractSparseComponentProps(raw: any, type: string, sparse: boolean): Record<string, any> {
    const props: Record<string, any> = {};
    if (type === 'Label') {
        const text = unwrapDumpValue(raw?.string ?? raw?._string);
        const fontSize = unwrapDumpValue(raw?.fontSize ?? raw?._fontSize);
        if (!sparse || text) props.string = text || '';
        if (!sparse || fontSize) props.fontSize = Number(fontSize || 0);
    } else if (type === 'UITransform') {
        const width = unwrapDumpValue(raw?.width);
        const height = unwrapDumpValue(raw?.height);
        if (width !== undefined || height !== undefined) props.contentSize = { width: Number(width || 0), height: Number(height || 0) };
    } else if (type === 'Button') {
        const interactable = unwrapDumpValue(raw?.interactable ?? raw?._interactable);
        if (!sparse || interactable === false) props.interactable = interactable !== false;
    }
    return props;
}

function hasNonZeroVector(value: any): boolean {
    return Boolean(value.x || value.y || value.z);
}

import { UIGraphAssetRef, UIGraphComponent, UIGraphNode, UIGraphTarget, NodeRef } from './types';
import { normalizeComponentType } from './validator';

export interface LoadedTarget {
    target: UIGraphTarget;
    root: any | null;
    mode: 'scene' | 'prefab' | 'node' | 'unavailable';
    warnings: any[];
}

export function getEditor(): any {
    return (globalThis as any).Editor;
}

export function isEditorAvailable(): boolean {
    return Boolean(getEditor()?.Message?.request);
}

export async function editorRequest(channel: string, message: string, ...args: any[]): Promise<any> {
    const editor = getEditor();
    if (!editor?.Message?.request) {
        throw new Error('Cocos Editor Message API is unavailable.');
    }
    return editor.Message.request(channel, message, ...args);
}

export function unwrapDumpValue(value: any): any {
    if (value && typeof value === 'object' && 'value' in value && Object.keys(value).length <= 3) {
        return value.value;
    }
    return value;
}

export function readNodeName(node: any): string {
    return String(unwrapDumpValue(node?.name) || unwrapDumpValue(node?._name) || node?.name || 'Node');
}

export function readNodeUuid(node: any): string | undefined {
    return unwrapDumpValue(node?.uuid) || node?.uuid || node?.value?.uuid;
}

export function readNodeActive(node: any): boolean | undefined {
    const active = unwrapDumpValue(node?.active ?? node?._active);
    return typeof active === 'boolean' ? active : undefined;
}

export function componentShortName(type: string): string {
    return normalizeComponentType(String(type || '').replace(/^cc\./, ''));
}

export function toCocosComponentType(type: string): string {
    const normalized = normalizeComponentType(type);
    if (normalized.startsWith('script:')) return normalized.slice('script:'.length);
    if (normalized.startsWith('cc.')) return normalized;
    const builtins = new Set(['UITransform', 'Sprite', 'Label', 'Button', 'Widget', 'Layout', 'Toggle', 'ToggleGroup', 'Slider', 'ProgressBar', 'ScrollView', 'PageView', 'PageViewIndicator', 'Mask']);
    return builtins.has(normalized) ? `cc.${normalized}` : normalized;
}

export function readComponents(nodeData: any): Array<{ type: string; rawType: string; index: number; uuid?: string; raw: any }> {
    const comps = Array.isArray(nodeData?.__comps__) ? nodeData.__comps__ : Array.isArray(nodeData?.components) ? nodeData.components : [];
    return comps.map((comp: any, index: number) => {
        const rawType = String(comp?.__type__ || comp?.type || comp?.cid || unwrapDumpValue(comp?.type) || 'Component');
        return { type: componentShortName(rawType), rawType, index, uuid: unwrapDumpValue(comp?.uuid) || comp?.uuid?.value, raw: comp };
    });
}

export function findComponentIndex(nodeData: any, componentType: string): number {
    const wanted = componentShortName(toCocosComponentType(componentType));
    return readComponents(nodeData).find((component) => component.type === wanted || component.rawType === componentType || component.rawType === toCocosComponentType(componentType))?.index ?? -1;
}

export async function queryNode(uuid: string): Promise<any> {
    try {
        return await editorRequest('scene', 'query-node', uuid);
    } catch {
        return await editorRequest('scene', 'query-node', { uuid });
    }
}

export async function queryNodeTree(): Promise<any> {
    return editorRequest('scene', 'query-node-tree');
}

export async function queryAssetInfo(ref: string | UIGraphAssetRef): Promise<any> {
    const value = typeof ref === 'string' ? ref : ref.path || ref.uuid;
    if (!value) return null;
    try {
        return await editorRequest('asset-db', 'query-asset-info', value);
    } catch {
        return await editorRequest('asset-db', 'query-asset-info', { uuid: value });
    }
}

export async function loadTarget(target: UIGraphTarget): Promise<LoadedTarget> {
    const warnings: any[] = [];
    if (!isEditorAvailable()) {
        return { target, root: null, mode: 'unavailable', warnings: [{ code: 'EDITOR_API_UNAVAILABLE', path: '$.target', message: 'Cocos Editor API is unavailable.' }] };
    }

    if (target.type === 'prefab' && (target.path || target.uuid)) {
        await enterPrefabEditMode(target.path || target.uuid!);
        const root = await queryNodeTree();
        return { target, root, mode: 'prefab', warnings };
    }

    const tree = await queryNodeTree();
    if (target.type === 'node') {
        const root = resolveNodeInTree(tree, target as NodeRef);
        return { target, root, mode: 'node', warnings };
    }
    return { target, root: tree, mode: 'scene', warnings };
}

export async function enterPrefabEditMode(prefabPathOrUuid: string): Promise<any> {
    const assetInfo = await queryAssetInfo(prefabPathOrUuid);
    if (!assetInfo?.uuid) throw new Error(`Prefab asset not found: ${prefabPathOrUuid}`);
    try { await editorRequest('asset-db', 'open-asset', assetInfo.url || prefabPathOrUuid); } catch {}
    await delay(300);
    try { await editorRequest('scene', 'call-preview-function', ['scene:prefab-preview', 'setPrefab', assetInfo.uuid]); } catch {}
    try { await editorRequest('hierarchy', 'staging', { assetUuid: assetInfo.uuid, animationUuid: '', expandLevels: ['0'] }); } catch {}
    await delay(300);
    return assetInfo;
}

export async function saveCurrentSceneOrPrefab(): Promise<void> {
    await editorRequest('scene', 'save-scene');
}

export async function createEditorNode(node: UIGraphNode, parentUuid?: string): Promise<string> {
    const options: any = { name: node.name, type: 'cc.Node' };
    if (parentUuid) options.parent = parentUuid;
    if (node.position) options.dump = { position: { value: node.position } };
    const result = await editorRequest('scene', 'create-node', options);
    return Array.isArray(result) ? result[0] : (result?.uuid || result);
}

export async function removeEditorNode(uuid: string): Promise<void> {
    try { await editorRequest('scene', 'remove-node', { uuid }); }
    catch { await editorRequest('scene', 'remove-node', uuid); }
}

export async function addEditorComponent(nodeUuid: string, component: UIGraphComponent): Promise<void> {
    const componentType = toCocosComponentType(component.type);
    try {
        await editorRequest('scene', 'create-component', { uuid: nodeUuid, component: componentType });
    } catch {
        await editorRequest('scene', 'add-component', { uuid: nodeUuid, component: componentType });
    }
}

export async function removeEditorComponent(nodeUuid: string, componentType: string): Promise<void> {
    const nodeData = await queryNode(nodeUuid);
    const index = findComponentIndex(nodeData, componentType);
    if (index < 0) throw new Error(`Component ${componentType} not found on node ${nodeUuid}`);
    await editorRequest('scene', 'remove-array-element', { uuid: nodeUuid, path: '__comps__', index });
}

export async function setEditorNodeProps(nodeUuid: string, props: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(props || {})) {
        if (key === 'name') {
            await setEditorProperty(nodeUuid, 'name', value);
        } else if (key === 'active') {
            await setEditorProperty(nodeUuid, 'active', value);
        } else if (key === 'position') {
            await setEditorProperty(nodeUuid, 'position', value);
        } else if (key === 'scale') {
            await setEditorProperty(nodeUuid, 'scale', value);
        } else if (key === 'rotation') {
            await setEditorProperty(nodeUuid, 'eulerAngles', value);
        } else if (key === 'size') {
            await setEditorComponentProps(nodeUuid, 'UITransform', { contentSize: value });
        }
    }
}

export async function setEditorComponentProps(nodeUuid: string, componentType: string, props: Record<string, any>): Promise<void> {
    if (!props || Object.keys(props).length === 0) return;
    const nodeData = await queryNode(nodeUuid);
    const index = findComponentIndex(nodeData, componentType);
    if (index < 0) throw new Error(`Component ${componentType} not found on node ${nodeUuid}`);
    for (const [key, value] of Object.entries(props)) {
        if (componentShortName(componentType) === 'UITransform' && key === 'contentSize') {
            await setEditorProperty(nodeUuid, `__comps__.${index}.width`, Number((value as any).width));
            await setEditorProperty(nodeUuid, `__comps__.${index}.height`, Number((value as any).height));
        } else if (componentShortName(componentType) === 'UITransform' && key === 'anchorPoint') {
            await setEditorProperty(nodeUuid, `__comps__.${index}.anchorX`, Number((value as any).x));
            await setEditorProperty(nodeUuid, `__comps__.${index}.anchorY`, Number((value as any).y));
        } else {
            await setEditorProperty(nodeUuid, `__comps__.${index}.${key}`, normalizeEditorValue(value));
        }
    }
}

export async function setEditorProperty(uuid: string, path: string, value: any): Promise<void> {
    await editorRequest('scene', 'set-property', { uuid, path, dump: { value: normalizeEditorValue(value) } });
}

export async function createPrefabFromNode(nodeUuid: string, outputPath: string): Promise<any> {
    try {
        return await editorRequest('scene', 'create-prefab', { nodeUuid, url: outputPath });
    } catch {
        return await editorRequest('scene', 'create-prefab', { uuid: nodeUuid, path: outputPath });
    }
}

export async function instantiatePrefabAsset(prefab: UIGraphAssetRef, parentUuid: string, props: Record<string, any> = {}): Promise<string> {
    const assetInfo = await queryAssetInfo(prefab);
    if (!assetInfo?.uuid) throw new Error(`Prefab asset not found: ${prefab.path || prefab.uuid}`);
    const options: any = { assetUuid: assetInfo.uuid, parent: parentUuid, name: props.name || assetInfo.name || 'PrefabInstance' };
    if (props.position) options.dump = { position: { value: props.position } };
    const result = await editorRequest('scene', 'create-node', options);
    const uuid = Array.isArray(result) ? result[0] : (result?.uuid || result);
    await setEditorNodeProps(uuid, props);
    return uuid;
}

export function resolveNodeInTree(root: any, ref: NodeRef): any | null {
    const matches: any[] = [];
    visitTree(root, (node, path) => {
        const uuid = readNodeUuid(node);
        const name = readNodeName(node);
        const nodePath = node.path || path;
        if (ref.uuid && uuid === ref.uuid) matches.push({ ...node, path: nodePath });
        else if (!ref.uuid && ref.path && nodePath === ref.path) matches.push({ ...node, path: nodePath });
        else if (!ref.uuid && !ref.path && ref.name && name === ref.name) matches.push({ ...node, path: nodePath });
    });
    if (matches.length === 0) return null;
    if (!ref.uuid && matches.length > 1) {
        const err: any = new Error(`Node ref ${ref.path || ref.name} matched multiple nodes.`);
        err.code = 'AMBIGUOUS_NODE_NAME';
        throw err;
    }
    return matches[0];
}

export async function resolveNodeUuid(root: any, ref: NodeRef): Promise<string> {
    if (ref.uuid) return ref.uuid;
    const node = resolveNodeInTree(root, ref);
    const uuid = node ? readNodeUuid(node) : undefined;
    if (!uuid) throw new Error(`Node not found: ${ref.path || ref.name || ref.uuid}`);
    return uuid;
}

export function visitTree(root: any, visitor: (node: any, path: string) => void, basePath?: string): void {
    if (!root) return;
    const name = readNodeName(root);
    const path = basePath || root.path || name;
    visitor(root, path);
    for (const child of root.children || []) {
        visitTree(child, visitor, `${path}/${readNodeName(child)}`);
    }
}

export function normalizeEditorValue(value: any): any {
    if (value && typeof value === 'object') {
        if ('asset' in value) return value.asset.uuid || value.asset.path;
        if ('node' in value) return value.node.uuid || value.node.path || value.node.name;
        if ('componentType' in value && 'node' in value) return value.node.uuid || value.node.path || value.node.name;
        if ('path' in value && 'type' in value) return value.uuid || value.path;
    }
    return value;
}

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

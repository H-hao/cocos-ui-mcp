"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditor = getEditor;
exports.isEditorAvailable = isEditorAvailable;
exports.editorRequest = editorRequest;
exports.unwrapDumpValue = unwrapDumpValue;
exports.readNodeName = readNodeName;
exports.readNodeUuid = readNodeUuid;
exports.readNodeActive = readNodeActive;
exports.componentShortName = componentShortName;
exports.toCocosComponentType = toCocosComponentType;
exports.readComponents = readComponents;
exports.findComponentIndex = findComponentIndex;
exports.queryNode = queryNode;
exports.queryNodeTree = queryNodeTree;
exports.queryAssetInfo = queryAssetInfo;
exports.loadTarget = loadTarget;
exports.enterPrefabEditMode = enterPrefabEditMode;
exports.saveCurrentSceneOrPrefab = saveCurrentSceneOrPrefab;
exports.createEditorNode = createEditorNode;
exports.removeEditorNode = removeEditorNode;
exports.addEditorComponent = addEditorComponent;
exports.removeEditorComponent = removeEditorComponent;
exports.setEditorNodeProps = setEditorNodeProps;
exports.setEditorComponentProps = setEditorComponentProps;
exports.setEditorProperty = setEditorProperty;
exports.createPrefabFromNode = createPrefabFromNode;
exports.instantiatePrefabAsset = instantiatePrefabAsset;
exports.resolveNodeInTree = resolveNodeInTree;
exports.resolveNodeUuid = resolveNodeUuid;
exports.visitTree = visitTree;
exports.normalizeEditorValue = normalizeEditorValue;
exports.delay = delay;
const validator_1 = require("./validator");
function getEditor() {
    return globalThis.Editor;
}
function isEditorAvailable() {
    var _a, _b;
    return Boolean((_b = (_a = getEditor()) === null || _a === void 0 ? void 0 : _a.Message) === null || _b === void 0 ? void 0 : _b.request);
}
async function editorRequest(channel, message, ...args) {
    var _a;
    const editor = getEditor();
    if (!((_a = editor === null || editor === void 0 ? void 0 : editor.Message) === null || _a === void 0 ? void 0 : _a.request)) {
        throw new Error('Cocos Editor Message API is unavailable.');
    }
    return editor.Message.request(channel, message, ...args);
}
function unwrapDumpValue(value) {
    if (value && typeof value === 'object' && 'value' in value && Object.keys(value).length <= 3) {
        return value.value;
    }
    return value;
}
function readNodeName(node) {
    return String(unwrapDumpValue(node === null || node === void 0 ? void 0 : node.name) || unwrapDumpValue(node === null || node === void 0 ? void 0 : node._name) || (node === null || node === void 0 ? void 0 : node.name) || 'Node');
}
function readNodeUuid(node) {
    var _a;
    return unwrapDumpValue(node === null || node === void 0 ? void 0 : node.uuid) || (node === null || node === void 0 ? void 0 : node.uuid) || ((_a = node === null || node === void 0 ? void 0 : node.value) === null || _a === void 0 ? void 0 : _a.uuid);
}
function readNodeActive(node) {
    var _a;
    const active = unwrapDumpValue((_a = node === null || node === void 0 ? void 0 : node.active) !== null && _a !== void 0 ? _a : node === null || node === void 0 ? void 0 : node._active);
    return typeof active === 'boolean' ? active : undefined;
}
function componentShortName(type) {
    return (0, validator_1.normalizeComponentType)(String(type || '').replace(/^cc\./, ''));
}
function toCocosComponentType(type) {
    const normalized = (0, validator_1.normalizeComponentType)(type);
    if (normalized.startsWith('script:'))
        return normalized.slice('script:'.length);
    if (normalized.startsWith('cc.'))
        return normalized;
    const builtins = new Set(['UITransform', 'Sprite', 'Label', 'Button', 'Widget', 'Layout', 'Toggle', 'ToggleGroup', 'Slider', 'ProgressBar', 'ScrollView', 'PageView', 'PageViewIndicator', 'Mask']);
    return builtins.has(normalized) ? `cc.${normalized}` : normalized;
}
function readComponents(nodeData) {
    const comps = Array.isArray(nodeData === null || nodeData === void 0 ? void 0 : nodeData.__comps__) ? nodeData.__comps__ : Array.isArray(nodeData === null || nodeData === void 0 ? void 0 : nodeData.components) ? nodeData.components : [];
    return comps.map((comp, index) => {
        var _a;
        const rawType = String((comp === null || comp === void 0 ? void 0 : comp.__type__) || (comp === null || comp === void 0 ? void 0 : comp.type) || (comp === null || comp === void 0 ? void 0 : comp.cid) || unwrapDumpValue(comp === null || comp === void 0 ? void 0 : comp.type) || 'Component');
        return { type: componentShortName(rawType), rawType, index, uuid: unwrapDumpValue(comp === null || comp === void 0 ? void 0 : comp.uuid) || ((_a = comp === null || comp === void 0 ? void 0 : comp.uuid) === null || _a === void 0 ? void 0 : _a.value), raw: comp };
    });
}
function findComponentIndex(nodeData, componentType) {
    var _a, _b;
    const wanted = componentShortName(toCocosComponentType(componentType));
    return (_b = (_a = readComponents(nodeData).find((component) => component.type === wanted || component.rawType === componentType || component.rawType === toCocosComponentType(componentType))) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : -1;
}
async function queryNode(uuid) {
    try {
        return await editorRequest('scene', 'query-node', uuid);
    }
    catch (_a) {
        return await editorRequest('scene', 'query-node', { uuid });
    }
}
async function queryNodeTree() {
    return editorRequest('scene', 'query-node-tree');
}
async function queryAssetInfo(ref) {
    const value = typeof ref === 'string' ? ref : ref.path || ref.uuid;
    if (!value)
        return null;
    try {
        return await editorRequest('asset-db', 'query-asset-info', value);
    }
    catch (_a) {
        return await editorRequest('asset-db', 'query-asset-info', { uuid: value });
    }
}
async function loadTarget(target) {
    const warnings = [];
    if (!isEditorAvailable()) {
        return { target, root: null, mode: 'unavailable', warnings: [{ code: 'EDITOR_API_UNAVAILABLE', path: '$.target', message: 'Cocos Editor API is unavailable.' }] };
    }
    if (target.type === 'prefab' && (target.path || target.uuid)) {
        await enterPrefabEditMode(target.path || target.uuid);
        const root = await queryNodeTree();
        return { target, root, mode: 'prefab', warnings };
    }
    const tree = await queryNodeTree();
    if (target.type === 'node') {
        const root = resolveNodeInTree(tree, target);
        return { target, root, mode: 'node', warnings };
    }
    return { target, root: tree, mode: 'scene', warnings };
}
async function enterPrefabEditMode(prefabPathOrUuid) {
    const assetInfo = await queryAssetInfo(prefabPathOrUuid);
    if (!(assetInfo === null || assetInfo === void 0 ? void 0 : assetInfo.uuid))
        throw new Error(`Prefab asset not found: ${prefabPathOrUuid}`);
    try {
        await editorRequest('asset-db', 'open-asset', assetInfo.url || prefabPathOrUuid);
    }
    catch (_a) { }
    await delay(300);
    try {
        await editorRequest('scene', 'call-preview-function', ['scene:prefab-preview', 'setPrefab', assetInfo.uuid]);
    }
    catch (_b) { }
    try {
        await editorRequest('hierarchy', 'staging', { assetUuid: assetInfo.uuid, animationUuid: '', expandLevels: ['0'] });
    }
    catch (_c) { }
    await delay(300);
    return assetInfo;
}
async function saveCurrentSceneOrPrefab() {
    await editorRequest('scene', 'save-scene');
}
async function createEditorNode(node, parentUuid) {
    const options = { name: node.name, type: 'cc.Node' };
    if (parentUuid)
        options.parent = parentUuid;
    if (node.position)
        options.dump = { position: { value: node.position } };
    const result = await editorRequest('scene', 'create-node', options);
    return Array.isArray(result) ? result[0] : ((result === null || result === void 0 ? void 0 : result.uuid) || result);
}
async function removeEditorNode(uuid) {
    try {
        await editorRequest('scene', 'remove-node', { uuid });
    }
    catch (_a) {
        await editorRequest('scene', 'remove-node', uuid);
    }
}
async function addEditorComponent(nodeUuid, component) {
    const componentType = toCocosComponentType(component.type);
    try {
        await editorRequest('scene', 'create-component', { uuid: nodeUuid, component: componentType });
    }
    catch (_a) {
        await editorRequest('scene', 'add-component', { uuid: nodeUuid, component: componentType });
    }
}
async function removeEditorComponent(nodeUuid, componentType) {
    const nodeData = await queryNode(nodeUuid);
    const index = findComponentIndex(nodeData, componentType);
    if (index < 0)
        throw new Error(`Component ${componentType} not found on node ${nodeUuid}`);
    await editorRequest('scene', 'remove-array-element', { uuid: nodeUuid, path: '__comps__', index });
}
async function setEditorNodeProps(nodeUuid, props) {
    for (const [key, value] of Object.entries(props || {})) {
        if (key === 'name') {
            await setEditorProperty(nodeUuid, 'name', value);
        }
        else if (key === 'active') {
            await setEditorProperty(nodeUuid, 'active', value);
        }
        else if (key === 'position') {
            await setEditorProperty(nodeUuid, 'position', value);
        }
        else if (key === 'scale') {
            await setEditorProperty(nodeUuid, 'scale', value);
        }
        else if (key === 'rotation') {
            await setEditorProperty(nodeUuid, 'eulerAngles', value);
        }
        else if (key === 'size') {
            await setEditorComponentProps(nodeUuid, 'UITransform', { contentSize: value });
        }
    }
}
async function setEditorComponentProps(nodeUuid, componentType, props) {
    if (!props || Object.keys(props).length === 0)
        return;
    const nodeData = await queryNode(nodeUuid);
    const index = findComponentIndex(nodeData, componentType);
    if (index < 0)
        throw new Error(`Component ${componentType} not found on node ${nodeUuid}`);
    for (const [key, value] of Object.entries(props)) {
        if (componentShortName(componentType) === 'UITransform' && key === 'contentSize') {
            await setEditorProperty(nodeUuid, `__comps__.${index}.width`, Number(value.width));
            await setEditorProperty(nodeUuid, `__comps__.${index}.height`, Number(value.height));
        }
        else if (componentShortName(componentType) === 'UITransform' && key === 'anchorPoint') {
            await setEditorProperty(nodeUuid, `__comps__.${index}.anchorX`, Number(value.x));
            await setEditorProperty(nodeUuid, `__comps__.${index}.anchorY`, Number(value.y));
        }
        else {
            await setEditorProperty(nodeUuid, `__comps__.${index}.${key}`, normalizeEditorValue(value));
        }
    }
}
async function setEditorProperty(uuid, path, value) {
    await editorRequest('scene', 'set-property', { uuid, path, dump: { value: normalizeEditorValue(value) } });
}
async function createPrefabFromNode(nodeUuid, outputPath) {
    try {
        return await editorRequest('scene', 'create-prefab', { nodeUuid, url: outputPath });
    }
    catch (_a) {
        return await editorRequest('scene', 'create-prefab', { uuid: nodeUuid, path: outputPath });
    }
}
async function instantiatePrefabAsset(prefab, parentUuid, props = {}) {
    const assetInfo = await queryAssetInfo(prefab);
    if (!(assetInfo === null || assetInfo === void 0 ? void 0 : assetInfo.uuid))
        throw new Error(`Prefab asset not found: ${prefab.path || prefab.uuid}`);
    const options = { assetUuid: assetInfo.uuid, parent: parentUuid, name: props.name || assetInfo.name || 'PrefabInstance' };
    if (props.position)
        options.dump = { position: { value: props.position } };
    const result = await editorRequest('scene', 'create-node', options);
    const uuid = Array.isArray(result) ? result[0] : ((result === null || result === void 0 ? void 0 : result.uuid) || result);
    await setEditorNodeProps(uuid, props);
    return uuid;
}
function resolveNodeInTree(root, ref) {
    const matches = [];
    visitTree(root, (node, path) => {
        const uuid = readNodeUuid(node);
        const name = readNodeName(node);
        const nodePath = node.path || path;
        if (ref.uuid && uuid === ref.uuid)
            matches.push(Object.assign(Object.assign({}, node), { path: nodePath }));
        else if (!ref.uuid && ref.path && nodePath === ref.path)
            matches.push(Object.assign(Object.assign({}, node), { path: nodePath }));
        else if (!ref.uuid && !ref.path && ref.name && name === ref.name)
            matches.push(Object.assign(Object.assign({}, node), { path: nodePath }));
    });
    if (matches.length === 0)
        return null;
    if (!ref.uuid && matches.length > 1) {
        const err = new Error(`Node ref ${ref.path || ref.name} matched multiple nodes.`);
        err.code = 'AMBIGUOUS_NODE_NAME';
        throw err;
    }
    return matches[0];
}
async function resolveNodeUuid(root, ref) {
    if (ref.uuid)
        return ref.uuid;
    const node = resolveNodeInTree(root, ref);
    const uuid = node ? readNodeUuid(node) : undefined;
    if (!uuid)
        throw new Error(`Node not found: ${ref.path || ref.name || ref.uuid}`);
    return uuid;
}
function visitTree(root, visitor, basePath) {
    if (!root)
        return;
    const name = readNodeName(root);
    const path = basePath || root.path || name;
    visitor(root, path);
    for (const child of root.children || []) {
        visitTree(child, visitor, `${path}/${readNodeName(child)}`);
    }
}
function normalizeEditorValue(value) {
    if (value && typeof value === 'object') {
        if ('asset' in value)
            return value.asset.uuid || value.asset.path;
        if ('node' in value)
            return value.node.uuid || value.node.path || value.node.name;
        if ('componentType' in value && 'node' in value)
            return value.node.uuid || value.node.path || value.node.name;
        if ('path' in value && 'type' in value)
            return value.uuid || value.path;
    }
    return value;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdWktZ3JhcGgvZWRpdG9yLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSw4QkFFQztBQUVELDhDQUVDO0FBRUQsc0NBTUM7QUFFRCwwQ0FLQztBQUVELG9DQUVDO0FBRUQsb0NBRUM7QUFFRCx3Q0FHQztBQUVELGdEQUVDO0FBRUQsb0RBTUM7QUFFRCx3Q0FNQztBQUVELGdEQUdDO0FBRUQsOEJBTUM7QUFFRCxzQ0FFQztBQUVELHdDQVFDO0FBRUQsZ0NBa0JDO0FBRUQsa0RBU0M7QUFFRCw0REFFQztBQUVELDRDQU1DO0FBRUQsNENBR0M7QUFFRCxnREFPQztBQUVELHNEQUtDO0FBRUQsZ0RBZ0JDO0FBRUQsMERBZ0JDO0FBRUQsOENBRUM7QUFFRCxvREFNQztBQUVELHdEQVNDO0FBRUQsOENBaUJDO0FBRUQsMENBTUM7QUFFRCw4QkFRQztBQUVELG9EQVFDO0FBRUQsc0JBRUM7QUF4UUQsMkNBQXFEO0FBU3JELFNBQWdCLFNBQVM7SUFDckIsT0FBUSxVQUFrQixDQUFDLE1BQU0sQ0FBQztBQUN0QyxDQUFDO0FBRUQsU0FBZ0IsaUJBQWlCOztJQUM3QixPQUFPLE9BQU8sQ0FBQyxNQUFBLE1BQUEsU0FBUyxFQUFFLDBDQUFFLE9BQU8sMENBQUUsT0FBTyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVNLEtBQUssVUFBVSxhQUFhLENBQUMsT0FBZSxFQUFFLE9BQWUsRUFBRSxHQUFHLElBQVc7O0lBQ2hGLE1BQU0sTUFBTSxHQUFHLFNBQVMsRUFBRSxDQUFDO0lBQzNCLElBQUksQ0FBQyxDQUFBLE1BQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLE9BQU8sMENBQUUsT0FBTyxDQUFBLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUNELE9BQU8s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QU8sRUFBRSxHQUFHLElBQUksSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBZ0Isb0JBQW9CLENBQUMsS0FBVTtJQUMzQyxJQUFJLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUNyQyxJQUFJLE9BQU8sSUFBSSxLQUFLO1lBQUUsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUNsRSxJQUFJLE1BQU0sSUFBSSxLQUFLO1lBQUUsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsRixJQUFJLGVBQWUsSUFBSSxLQUFLLElBQUksTUFBTSxJQUFJLEtBQUs7WUFBRSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQzlHLElBQUksTUFBTSxJQUFJLEtBQUssSUFBSSxNQUFNLElBQUksS0FBSztZQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDO0lBQzVFLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBRUQsU0FBZ0IsS0FBSyxDQUFDLEVBQVU7SUFDNUIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVSUdyYXBoQXNzZXRSZWYsIFVJR3JhcGhDb21wb25lbnQsIFVJR3JhcGhOb2RlLCBVSUdyYXBoVGFyZ2V0LCBOb2RlUmVmIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBub3JtYWxpemVDb21wb25lbnRUeXBlIH0gZnJvbSAnLi92YWxpZGF0b3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIExvYWRlZFRhcmdldCB7XG4gICAgdGFyZ2V0OiBVSUdyYXBoVGFyZ2V0O1xuICAgIHJvb3Q6IGFueSB8IG51bGw7XG4gICAgbW9kZTogJ3NjZW5lJyB8ICdwcmVmYWInIHwgJ25vZGUnIHwgJ3VuYXZhaWxhYmxlJztcbiAgICB3YXJuaW5nczogYW55W107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFZGl0b3IoKTogYW55IHtcbiAgICByZXR1cm4gKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0VkaXRvckF2YWlsYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQm9vbGVhbihnZXRFZGl0b3IoKT8uTWVzc2FnZT8ucmVxdWVzdCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlZGl0b3JSZXF1ZXN0KGNoYW5uZWw6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgZWRpdG9yID0gZ2V0RWRpdG9yKCk7XG4gICAgaWYgKCFlZGl0b3I/Lk1lc3NhZ2U/LnJlcXVlc3QpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb2NvcyBFZGl0b3IgTWVzc2FnZSBBUEkgaXMgdW5hdmFpbGFibGUuJyk7XG4gICAgfVxuICAgIHJldHVybiBlZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KGNoYW5uZWwsIG1lc3NhZ2UsIC4uLmFyZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwRHVtcFZhbHVlKHZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICd2YWx1ZScgaW4gdmFsdWUgJiYgT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aCA8PSAzKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZE5vZGVOYW1lKG5vZGU6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFN0cmluZyh1bndyYXBEdW1wVmFsdWUobm9kZT8ubmFtZSkgfHwgdW53cmFwRHVtcFZhbHVlKG5vZGU/Ll9uYW1lKSB8fCBub2RlPy5uYW1lIHx8ICdOb2RlJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkTm9kZVV1aWQobm9kZTogYW55KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdW53cmFwRHVtcFZhbHVlKG5vZGU/LnV1aWQpIHx8IG5vZGU/LnV1aWQgfHwgbm9kZT8udmFsdWU/LnV1aWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkTm9kZUFjdGl2ZShub2RlOiBhbnkpOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBhY3RpdmUgPSB1bndyYXBEdW1wVmFsdWUobm9kZT8uYWN0aXZlID8/IG5vZGU/Ll9hY3RpdmUpO1xuICAgIHJldHVybiB0eXBlb2YgYWN0aXZlID09PSAnYm9vbGVhbicgPyBhY3RpdmUgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRTaG9ydE5hbWUodHlwZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbm9ybWFsaXplQ29tcG9uZW50VHlwZShTdHJpbmcodHlwZSB8fCAnJykucmVwbGFjZSgvXmNjXFwuLywgJycpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ29jb3NDb21wb25lbnRUeXBlKHR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUNvbXBvbmVudFR5cGUodHlwZSk7XG4gICAgaWYgKG5vcm1hbGl6ZWQuc3RhcnRzV2l0aCgnc2NyaXB0OicpKSByZXR1cm4gbm9ybWFsaXplZC5zbGljZSgnc2NyaXB0OicubGVuZ3RoKTtcbiAgICBpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKCdjYy4nKSkgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgY29uc3QgYnVpbHRpbnMgPSBuZXcgU2V0KFsnVUlUcmFuc2Zvcm0nLCAnU3ByaXRlJywgJ0xhYmVsJywgJ0J1dHRvbicsICdXaWRnZXQnLCAnTGF5b3V0JywgJ1RvZ2dsZScsICdUb2dnbGVHcm91cCcsICdTbGlkZXInLCAnUHJvZ3Jlc3NCYXInLCAnU2Nyb2xsVmlldycsICdQYWdlVmlldycsICdQYWdlVmlld0luZGljYXRvcicsICdNYXNrJ10pO1xuICAgIHJldHVybiBidWlsdGlucy5oYXMobm9ybWFsaXplZCkgPyBgY2MuJHtub3JtYWxpemVkfWAgOiBub3JtYWxpemVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZENvbXBvbmVudHMobm9kZURhdGE6IGFueSk6IEFycmF5PHsgdHlwZTogc3RyaW5nOyByYXdUeXBlOiBzdHJpbmc7IGluZGV4OiBudW1iZXI7IHV1aWQ/OiBzdHJpbmc7IHJhdzogYW55IH0+IHtcbiAgICBjb25zdCBjb21wcyA9IEFycmF5LmlzQXJyYXkobm9kZURhdGE/Ll9fY29tcHNfXykgPyBub2RlRGF0YS5fX2NvbXBzX18gOiBBcnJheS5pc0FycmF5KG5vZGVEYXRhPy5jb21wb25lbnRzKSA/IG5vZGVEYXRhLmNvbXBvbmVudHMgOiBbXTtcbiAgICByZXR1cm4gY29tcHMubWFwKChjb21wOiBhbnksIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgcmF3VHlwZSA9IFN0cmluZyhjb21wPy5fX3R5cGVfXyB8fCBjb21wPy50eXBlIHx8IGNvbXA/LmNpZCB8fCB1bndyYXBEdW1wVmFsdWUoY29tcD8udHlwZSkgfHwgJ0NvbXBvbmVudCcpO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBjb21wb25lbnRTaG9ydE5hbWUocmF3VHlwZSksIHJhd1R5cGUsIGluZGV4LCB1dWlkOiB1bndyYXBEdW1wVmFsdWUoY29tcD8udXVpZCkgfHwgY29tcD8udXVpZD8udmFsdWUsIHJhdzogY29tcCB9O1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudEluZGV4KG5vZGVEYXRhOiBhbnksIGNvbXBvbmVudFR5cGU6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3Qgd2FudGVkID0gY29tcG9uZW50U2hvcnROYW1lKHRvQ29jb3NDb21wb25lbnRUeXBlKGNvbXBvbmVudFR5cGUpKTtcbiAgICByZXR1cm4gcmVhZENvbXBvbmVudHMobm9kZURhdGEpLmZpbmQoKGNvbXBvbmVudCkgPT4gY29tcG9uZW50LnR5cGUgPT09IHdhbnRlZCB8fCBjb21wb25lbnQucmF3VHlwZSA9PT0gY29tcG9uZW50VHlwZSB8fCBjb21wb25lbnQucmF3VHlwZSA9PT0gdG9Db2Nvc0NvbXBvbmVudFR5cGUoY29tcG9uZW50VHlwZSkpPy5pbmRleCA/PyAtMTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5Tm9kZSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgdXVpZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgeyB1dWlkIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5Tm9kZVRyZWUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFzc2V0SW5mbyhyZWY6IHN0cmluZyB8IFVJR3JhcGhBc3NldFJlZik6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgdmFsdWUgPSB0eXBlb2YgcmVmID09PSAnc3RyaW5nJyA/IHJlZiA6IHJlZi5wYXRoIHx8IHJlZi51dWlkO1xuICAgIGlmICghdmFsdWUpIHJldHVybiBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgdmFsdWUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gYXdhaXQgZWRpdG9yUmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHsgdXVpZDogdmFsdWUgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFRhcmdldCh0YXJnZXQ6IFVJR3JhcGhUYXJnZXQpOiBQcm9taXNlPExvYWRlZFRhcmdldD4ge1xuICAgIGNvbnN0IHdhcm5pbmdzOiBhbnlbXSA9IFtdO1xuICAgIGlmICghaXNFZGl0b3JBdmFpbGFibGUoKSkge1xuICAgICAgICByZXR1cm4geyB0YXJnZXQsIHJvb3Q6IG51bGwsIG1vZGU6ICd1bmF2YWlsYWJsZScsIHdhcm5pbmdzOiBbeyBjb2RlOiAnRURJVE9SX0FQSV9VTkFWQUlMQUJMRScsIHBhdGg6ICckLnRhcmdldCcsIG1lc3NhZ2U6ICdDb2NvcyBFZGl0b3IgQVBJIGlzIHVuYXZhaWxhYmxlLicgfV0gfTtcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0LnR5cGUgPT09ICdwcmVmYWInICYmICh0YXJnZXQucGF0aCB8fCB0YXJnZXQudXVpZCkpIHtcbiAgICAgICAgYXdhaXQgZW50ZXJQcmVmYWJFZGl0TW9kZSh0YXJnZXQucGF0aCB8fCB0YXJnZXQudXVpZCEpO1xuICAgICAgICBjb25zdCByb290ID0gYXdhaXQgcXVlcnlOb2RlVHJlZSgpO1xuICAgICAgICByZXR1cm4geyB0YXJnZXQsIHJvb3QsIG1vZGU6ICdwcmVmYWInLCB3YXJuaW5ncyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHRyZWUgPSBhd2FpdCBxdWVyeU5vZGVUcmVlKCk7XG4gICAgaWYgKHRhcmdldC50eXBlID09PSAnbm9kZScpIHtcbiAgICAgICAgY29uc3Qgcm9vdCA9IHJlc29sdmVOb2RlSW5UcmVlKHRyZWUsIHRhcmdldCBhcyBOb2RlUmVmKTtcbiAgICAgICAgcmV0dXJuIHsgdGFyZ2V0LCByb290LCBtb2RlOiAnbm9kZScsIHdhcm5pbmdzIH07XG4gICAgfVxuICAgIHJldHVybiB7IHRhcmdldCwgcm9vdDogdHJlZSwgbW9kZTogJ3NjZW5lJywgd2FybmluZ3MgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVudGVyUHJlZmFiRWRpdE1vZGUocHJlZmFiUGF0aE9yVXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCBxdWVyeUFzc2V0SW5mbyhwcmVmYWJQYXRoT3JVdWlkKTtcbiAgICBpZiAoIWFzc2V0SW5mbz8udXVpZCkgdGhyb3cgbmV3IEVycm9yKGBQcmVmYWIgYXNzZXQgbm90IGZvdW5kOiAke3ByZWZhYlBhdGhPclV1aWR9YCk7XG4gICAgdHJ5IHsgYXdhaXQgZWRpdG9yUmVxdWVzdCgnYXNzZXQtZGInLCAnb3Blbi1hc3NldCcsIGFzc2V0SW5mby51cmwgfHwgcHJlZmFiUGF0aE9yVXVpZCk7IH0gY2F0Y2gge31cbiAgICBhd2FpdCBkZWxheSgzMDApO1xuICAgIHRyeSB7IGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ2NhbGwtcHJldmlldy1mdW5jdGlvbicsIFsnc2NlbmU6cHJlZmFiLXByZXZpZXcnLCAnc2V0UHJlZmFiJywgYXNzZXRJbmZvLnV1aWRdKTsgfSBjYXRjaCB7fVxuICAgIHRyeSB7IGF3YWl0IGVkaXRvclJlcXVlc3QoJ2hpZXJhcmNoeScsICdzdGFnaW5nJywgeyBhc3NldFV1aWQ6IGFzc2V0SW5mby51dWlkLCBhbmltYXRpb25VdWlkOiAnJywgZXhwYW5kTGV2ZWxzOiBbJzAnXSB9KTsgfSBjYXRjaCB7fVxuICAgIGF3YWl0IGRlbGF5KDMwMCk7XG4gICAgcmV0dXJuIGFzc2V0SW5mbztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVDdXJyZW50U2NlbmVPclByZWZhYigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdzYXZlLXNjZW5lJyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVFZGl0b3JOb2RlKG5vZGU6IFVJR3JhcGhOb2RlLCBwYXJlbnRVdWlkPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBvcHRpb25zOiBhbnkgPSB7IG5hbWU6IG5vZGUubmFtZSwgdHlwZTogJ2NjLk5vZGUnIH07XG4gICAgaWYgKHBhcmVudFV1aWQpIG9wdGlvbnMucGFyZW50ID0gcGFyZW50VXVpZDtcbiAgICBpZiAobm9kZS5wb3NpdGlvbikgb3B0aW9ucy5kdW1wID0geyBwb3NpdGlvbjogeyB2YWx1ZTogbm9kZS5wb3NpdGlvbiB9IH07XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLW5vZGUnLCBvcHRpb25zKTtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShyZXN1bHQpID8gcmVzdWx0WzBdIDogKHJlc3VsdD8udXVpZCB8fCByZXN1bHQpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlRWRpdG9yTm9kZSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkgeyBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdyZW1vdmUtbm9kZScsIHsgdXVpZCB9KTsgfVxuICAgIGNhdGNoIHsgYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAncmVtb3ZlLW5vZGUnLCB1dWlkKTsgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkRWRpdG9yQ29tcG9uZW50KG5vZGVVdWlkOiBzdHJpbmcsIGNvbXBvbmVudDogVUlHcmFwaENvbXBvbmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNvbXBvbmVudFR5cGUgPSB0b0NvY29zQ29tcG9uZW50VHlwZShjb21wb25lbnQudHlwZSk7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLWNvbXBvbmVudCcsIHsgdXVpZDogbm9kZVV1aWQsIGNvbXBvbmVudDogY29tcG9uZW50VHlwZSB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAnYWRkLWNvbXBvbmVudCcsIHsgdXVpZDogbm9kZVV1aWQsIGNvbXBvbmVudDogY29tcG9uZW50VHlwZSB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVFZGl0b3JDb21wb25lbnQobm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9kZURhdGEgPSBhd2FpdCBxdWVyeU5vZGUobm9kZVV1aWQpO1xuICAgIGNvbnN0IGluZGV4ID0gZmluZENvbXBvbmVudEluZGV4KG5vZGVEYXRhLCBjb21wb25lbnRUeXBlKTtcbiAgICBpZiAoaW5kZXggPCAwKSB0aHJvdyBuZXcgRXJyb3IoYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlICR7bm9kZVV1aWR9YCk7XG4gICAgYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAncmVtb3ZlLWFycmF5LWVsZW1lbnQnLCB7IHV1aWQ6IG5vZGVVdWlkLCBwYXRoOiAnX19jb21wc19fJywgaW5kZXggfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRFZGl0b3JOb2RlUHJvcHMobm9kZVV1aWQ6IHN0cmluZywgcHJvcHM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhwcm9wcyB8fCB7fSkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJ25hbWUnKSB7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JQcm9wZXJ0eShub2RlVXVpZCwgJ25hbWUnLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnYWN0aXZlJykge1xuICAgICAgICAgICAgYXdhaXQgc2V0RWRpdG9yUHJvcGVydHkobm9kZVV1aWQsICdhY3RpdmUnLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAncG9zaXRpb24nKSB7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JQcm9wZXJ0eShub2RlVXVpZCwgJ3Bvc2l0aW9uJywgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3NjYWxlJykge1xuICAgICAgICAgICAgYXdhaXQgc2V0RWRpdG9yUHJvcGVydHkobm9kZVV1aWQsICdzY2FsZScsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdyb3RhdGlvbicpIHtcbiAgICAgICAgICAgIGF3YWl0IHNldEVkaXRvclByb3BlcnR5KG5vZGVVdWlkLCAnZXVsZXJBbmdsZXMnLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnc2l6ZScpIHtcbiAgICAgICAgICAgIGF3YWl0IHNldEVkaXRvckNvbXBvbmVudFByb3BzKG5vZGVVdWlkLCAnVUlUcmFuc2Zvcm0nLCB7IGNvbnRlbnRTaXplOiB2YWx1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldEVkaXRvckNvbXBvbmVudFByb3BzKG5vZGVVdWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZywgcHJvcHM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXByb3BzIHx8IE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBub2RlRGF0YSA9IGF3YWl0IHF1ZXJ5Tm9kZShub2RlVXVpZCk7XG4gICAgY29uc3QgaW5kZXggPSBmaW5kQ29tcG9uZW50SW5kZXgobm9kZURhdGEsIGNvbXBvbmVudFR5cGUpO1xuICAgIGlmIChpbmRleCA8IDApIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGUgJHtub2RlVXVpZH1gKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhwcm9wcykpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudFNob3J0TmFtZShjb21wb25lbnRUeXBlKSA9PT0gJ1VJVHJhbnNmb3JtJyAmJiBrZXkgPT09ICdjb250ZW50U2l6ZScpIHtcbiAgICAgICAgICAgIGF3YWl0IHNldEVkaXRvclByb3BlcnR5KG5vZGVVdWlkLCBgX19jb21wc19fLiR7aW5kZXh9LndpZHRoYCwgTnVtYmVyKCh2YWx1ZSBhcyBhbnkpLndpZHRoKSk7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JQcm9wZXJ0eShub2RlVXVpZCwgYF9fY29tcHNfXy4ke2luZGV4fS5oZWlnaHRgLCBOdW1iZXIoKHZhbHVlIGFzIGFueSkuaGVpZ2h0KSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50U2hvcnROYW1lKGNvbXBvbmVudFR5cGUpID09PSAnVUlUcmFuc2Zvcm0nICYmIGtleSA9PT0gJ2FuY2hvclBvaW50Jykge1xuICAgICAgICAgICAgYXdhaXQgc2V0RWRpdG9yUHJvcGVydHkobm9kZVV1aWQsIGBfX2NvbXBzX18uJHtpbmRleH0uYW5jaG9yWGAsIE51bWJlcigodmFsdWUgYXMgYW55KS54KSk7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JQcm9wZXJ0eShub2RlVXVpZCwgYF9fY29tcHNfXy4ke2luZGV4fS5hbmNob3JZYCwgTnVtYmVyKCh2YWx1ZSBhcyBhbnkpLnkpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IHNldEVkaXRvclByb3BlcnR5KG5vZGVVdWlkLCBgX19jb21wc19fLiR7aW5kZXh9LiR7a2V5fWAsIG5vcm1hbGl6ZUVkaXRvclZhbHVlKHZhbHVlKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRFZGl0b3JQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHsgdXVpZCwgcGF0aCwgZHVtcDogeyB2YWx1ZTogbm9ybWFsaXplRWRpdG9yVmFsdWUodmFsdWUpIH0gfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVQcmVmYWJGcm9tTm9kZShub2RlVXVpZDogc3RyaW5nLCBvdXRwdXRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtcHJlZmFiJywgeyBub2RlVXVpZCwgdXJsOiBvdXRwdXRQYXRoIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLXByZWZhYicsIHsgdXVpZDogbm9kZVV1aWQsIHBhdGg6IG91dHB1dFBhdGggfSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFudGlhdGVQcmVmYWJBc3NldChwcmVmYWI6IFVJR3JhcGhBc3NldFJlZiwgcGFyZW50VXVpZDogc3RyaW5nLCBwcm9wczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCBxdWVyeUFzc2V0SW5mbyhwcmVmYWIpO1xuICAgIGlmICghYXNzZXRJbmZvPy51dWlkKSB0aHJvdyBuZXcgRXJyb3IoYFByZWZhYiBhc3NldCBub3QgZm91bmQ6ICR7cHJlZmFiLnBhdGggfHwgcHJlZmFiLnV1aWR9YCk7XG4gICAgY29uc3Qgb3B0aW9uczogYW55ID0geyBhc3NldFV1aWQ6IGFzc2V0SW5mby51dWlkLCBwYXJlbnQ6IHBhcmVudFV1aWQsIG5hbWU6IHByb3BzLm5hbWUgfHwgYXNzZXRJbmZvLm5hbWUgfHwgJ1ByZWZhYkluc3RhbmNlJyB9O1xuICAgIGlmIChwcm9wcy5wb3NpdGlvbikgb3B0aW9ucy5kdW1wID0geyBwb3NpdGlvbjogeyB2YWx1ZTogcHJvcHMucG9zaXRpb24gfSB9O1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1ub2RlJywgb3B0aW9ucyk7XG4gICAgY29uc3QgdXVpZCA9IEFycmF5LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdFswXSA6IChyZXN1bHQ/LnV1aWQgfHwgcmVzdWx0KTtcbiAgICBhd2FpdCBzZXRFZGl0b3JOb2RlUHJvcHModXVpZCwgcHJvcHMpO1xuICAgIHJldHVybiB1dWlkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZU5vZGVJblRyZWUocm9vdDogYW55LCByZWY6IE5vZGVSZWYpOiBhbnkgfCBudWxsIHtcbiAgICBjb25zdCBtYXRjaGVzOiBhbnlbXSA9IFtdO1xuICAgIHZpc2l0VHJlZShyb290LCAobm9kZSwgcGF0aCkgPT4ge1xuICAgICAgICBjb25zdCB1dWlkID0gcmVhZE5vZGVVdWlkKG5vZGUpO1xuICAgICAgICBjb25zdCBuYW1lID0gcmVhZE5vZGVOYW1lKG5vZGUpO1xuICAgICAgICBjb25zdCBub2RlUGF0aCA9IG5vZGUucGF0aCB8fCBwYXRoO1xuICAgICAgICBpZiAocmVmLnV1aWQgJiYgdXVpZCA9PT0gcmVmLnV1aWQpIG1hdGNoZXMucHVzaCh7IC4uLm5vZGUsIHBhdGg6IG5vZGVQYXRoIH0pO1xuICAgICAgICBlbHNlIGlmICghcmVmLnV1aWQgJiYgcmVmLnBhdGggJiYgbm9kZVBhdGggPT09IHJlZi5wYXRoKSBtYXRjaGVzLnB1c2goeyAuLi5ub2RlLCBwYXRoOiBub2RlUGF0aCB9KTtcbiAgICAgICAgZWxzZSBpZiAoIXJlZi51dWlkICYmICFyZWYucGF0aCAmJiByZWYubmFtZSAmJiBuYW1lID09PSByZWYubmFtZSkgbWF0Y2hlcy5wdXNoKHsgLi4ubm9kZSwgcGF0aDogbm9kZVBhdGggfSk7XG4gICAgfSk7XG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgICBpZiAoIXJlZi51dWlkICYmIG1hdGNoZXMubGVuZ3RoID4gMSkge1xuICAgICAgICBjb25zdCBlcnI6IGFueSA9IG5ldyBFcnJvcihgTm9kZSByZWYgJHtyZWYucGF0aCB8fCByZWYubmFtZX0gbWF0Y2hlZCBtdWx0aXBsZSBub2Rlcy5gKTtcbiAgICAgICAgZXJyLmNvZGUgPSAnQU1CSUdVT1VTX05PREVfTkFNRSc7XG4gICAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXNbMF07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlTm9kZVV1aWQocm9vdDogYW55LCByZWY6IE5vZGVSZWYpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmIChyZWYudXVpZCkgcmV0dXJuIHJlZi51dWlkO1xuICAgIGNvbnN0IG5vZGUgPSByZXNvbHZlTm9kZUluVHJlZShyb290LCByZWYpO1xuICAgIGNvbnN0IHV1aWQgPSBub2RlID8gcmVhZE5vZGVVdWlkKG5vZGUpIDogdW5kZWZpbmVkO1xuICAgIGlmICghdXVpZCkgdGhyb3cgbmV3IEVycm9yKGBOb2RlIG5vdCBmb3VuZDogJHtyZWYucGF0aCB8fCByZWYubmFtZSB8fCByZWYudXVpZH1gKTtcbiAgICByZXR1cm4gdXVpZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZpc2l0VHJlZShyb290OiBhbnksIHZpc2l0b3I6IChub2RlOiBhbnksIHBhdGg6IHN0cmluZykgPT4gdm9pZCwgYmFzZVBhdGg/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXJvb3QpIHJldHVybjtcbiAgICBjb25zdCBuYW1lID0gcmVhZE5vZGVOYW1lKHJvb3QpO1xuICAgIGNvbnN0IHBhdGggPSBiYXNlUGF0aCB8fCByb290LnBhdGggfHwgbmFtZTtcbiAgICB2aXNpdG9yKHJvb3QsIHBhdGgpO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygcm9vdC5jaGlsZHJlbiB8fCBbXSkge1xuICAgICAgICB2aXNpdFRyZWUoY2hpbGQsIHZpc2l0b3IsIGAke3BhdGh9LyR7cmVhZE5vZGVOYW1lKGNoaWxkKX1gKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVFZGl0b3JWYWx1ZSh2YWx1ZTogYW55KTogYW55IHtcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoJ2Fzc2V0JyBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlLmFzc2V0LnV1aWQgfHwgdmFsdWUuYXNzZXQucGF0aDtcbiAgICAgICAgaWYgKCdub2RlJyBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlLm5vZGUudXVpZCB8fCB2YWx1ZS5ub2RlLnBhdGggfHwgdmFsdWUubm9kZS5uYW1lO1xuICAgICAgICBpZiAoJ2NvbXBvbmVudFR5cGUnIGluIHZhbHVlICYmICdub2RlJyBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlLm5vZGUudXVpZCB8fCB2YWx1ZS5ub2RlLnBhdGggfHwgdmFsdWUubm9kZS5uYW1lO1xuICAgICAgICBpZiAoJ3BhdGgnIGluIHZhbHVlICYmICd0eXBlJyBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlLnV1aWQgfHwgdmFsdWUucGF0aDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xufVxuIl19
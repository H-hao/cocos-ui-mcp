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
exports.moveEditorNode = moveEditorNode;
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
async function moveEditorNode(uuid, parentUuid) {
    const attempts = [
        () => editorRequest('scene', 'set-parent', { uuid, parent: parentUuid }),
        () => editorRequest('scene', 'move-node', { uuid, parent: parentUuid }),
        () => editorRequest('scene', 'set-property', { uuid, path: 'parent', dump: { value: parentUuid } }),
    ];
    let lastError;
    for (const attempt of attempts) {
        try {
            await attempt();
            return;
        }
        catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error(`Failed to move node ${uuid} under parent ${parentUuid}`);
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
        else if (!ref.uuid && ref.path && (nodePath === ref.path || nodePath.endsWith(`/${ref.path}`)))
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
        if ('componentType' in value && 'node' in value) {
            return { node: value.node.uuid || value.node.path || value.node.name, componentType: value.componentType };
        }
        if ('node' in value)
            return value.node.uuid || value.node.path || value.node.name;
        if ('path' in value && 'type' in value)
            return value.uuid || value.path;
    }
    return value;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdWktZ3JhcGgvZWRpdG9yLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSw4QkFFQztBQUVELDhDQUVDO0FBRUQsc0NBTUM7QUFFRCwwQ0FLQztBQUVELG9DQUVDO0FBRUQsb0NBRUM7QUFFRCx3Q0FHQztBQUVELGdEQUVDO0FBRUQsb0RBTUM7QUFFRCx3Q0FNQztBQUVELGdEQUdDO0FBRUQsOEJBTUM7QUFFRCxzQ0FFQztBQUVELHdDQVFDO0FBRUQsZ0NBa0JDO0FBRUQsa0RBU0M7QUFFRCw0REFFQztBQUVELDRDQU1DO0FBRUQsNENBR0M7QUFFRCx3Q0FnQkM7QUFFRCxnREFPQztBQUVELHNEQUtDO0FBRUQsZ0RBZ0JDO0FBRUQsMERBZ0JDO0FBRUQsOENBRUM7QUFFRCxvREFNQztBQUVELHdEQVNDO0FBRUQsOENBaUJDO0FBRUQsMENBTUM7QUFFRCw4QkFRQztBQUVELG9EQVVDO0FBRUQsc0JBRUM7QUE1UkQsMkNBQXFEO0FBU3JELFNBQWdCLFNBQVM7SUFDckIsT0FBUSxVQUFrQixDQUFDLE1BQU0sQ0FBQztBQUN0QyxDQUFDO0FBRUQsU0FBZ0IsaUJBQWlCOztJQUM3QixPQUFPLE9BQU8sQ0FBQyxNQUFBLE1BQUEsU0FBUyxFQUFFLDBDQUFFLE9BQU8sMENBQUUsT0FBTyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVNLEtBQUssVUFBVSxhQUFhLENBQUMsT0FBZSxFQUFFLE9BQWUsRUFBRSxHQUFHLElBQVc7O0lBQ2hGLE1BQU0sTUFBTSxHQUFHLFNBQVMsRUFBRSxDQUFDO0lBQzNCLElBQUksQ0FBQyxDQUFBLE1BQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLE9BQU8sMENBQUUsT0FBTyxDQUFBLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7SUFDaEUsQ0FB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QUNyQyxJQUFJLE9BQU8sSUFBSSxLQUFLO1lBQUUsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUNsRSxJQUFJLGVBQWUsSUFBSSxLQUFLLElBQUksTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQzlDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUMvRyxDQUFDO1FBQ0QsSUFBSSxNQUFNLElBQUksS0FBSztZQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEYsSUFBSSxNQUFNLElBQUksS0FBSyxJQUFJLE1BQU0sSUFBSSxLQUFLO1lBQUUsT0FBTyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDNUUsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxTQUFnQixLQUFLLENBQUMsRUFBVTtJQUM1QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFVJR3JhcGhBc3NldFJlZiwgVUlHcmFwaENvbXBvbmVudCwgVUlHcmFwaE5vZGUsIFVJR3JhcGhUYXJnZXQsIE5vZGVSZWYgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IG5vcm1hbGl6ZUNvbXBvbmVudFR5cGUgfSBmcm9tICcuL3ZhbGlkYXRvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZGVkVGFyZ2V0IHtcbiAgICB0YXJnZXQ6IFVJR3JhcGhUYXJnZXQ7XG4gICAgcm9vdDogYW55IHwgbnVsbDtcbiAgICBtb2RlOiAnc2NlbmUnIHwgJ3ByZWZhYicgfCAnbm9kZScgfCAndW5hdmFpbGFibGUnO1xuICAgIHdhcm5pbmdzOiBhbnlbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVkaXRvcigpOiBhbnkge1xuICAgIHJldHVybiAoZ2xvYmFsVGhpcyBhcyBhbnkpLkVkaXRvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRWRpdG9yQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBCb29sZWFuKGdldEVkaXRvcigpPy5NZXNzYWdlPy5yZXF1ZXN0KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVkaXRvclJlcXVlc3QoY2hhbm5lbDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBnZXRFZGl0b3IoKTtcbiAgICBpZiAoIWVkaXRvcj8uTWVzc2FnZT8ucmVxdWVzdCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvY29zIEVkaXRvciBNZXNzYWdlIEFQSSBpcyB1bmF2YWlsYWJsZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGVkaXRvci5NZXNzYWdlLnJlcXVlc3QoY2hhbm5lbCwgbWVzc2FnZSwgLi4uYXJncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBEdW1wVmFsdWUodmFsdWU6IGFueSk6IGFueSB7XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgJ3ZhbHVlJyBpbiB2YWx1ZSAmJiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoIDw9IDMpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkTm9kZU5hbWUobm9kZTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3RyaW5nKHVud3JhcER1bXBWYWx1ZShub2RlPy5uYW1lKSB8fCB1bndyYXBEdW1wVmFsdWUobm9kZT8uX25hbWUpIHx8IG5vZGU/Lm5hbWUgfHwgJ05vZGUnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWROb2RlVXVpZChub2RlOiBhbnkpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB1bndyYXBEdW1wVmFsdWUobm9kZT8udXVpZCkgfHwgbm9kZT8udXVpZCB8fCBub2RlPy52YWx1ZT8udXVpZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWROb2RlQWN0aXZlKG5vZGU6IGFueSk6IGJvb2xlYW4gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGFjdGl2ZSA9IHVud3JhcER1bXBWYWx1ZShub2RlPy5hY3RpdmUgPz8gbm9kZT8uX2FjdGl2ZSk7XG4gICAgcmV0dXJuIHR5cGVvZiBhY3RpdmUgPT09ICdib29sZWFuJyA/IGFjdGl2ZSA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFNob3J0TmFtZSh0eXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBub3JtYWxpemVDb21wb25lbnRUeXBlKFN0cmluZyh0eXBlIHx8ICcnKS5yZXBsYWNlKC9eY2NcXC4vLCAnJykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9Db2Nvc0NvbXBvbmVudFR5cGUodHlwZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQ29tcG9uZW50VHlwZSh0eXBlKTtcbiAgICBpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKCdzY3JpcHQ6JykpIHJldHVybiBub3JtYWxpemVkLnNsaWNlKCdzY3JpcHQ6Jy5sZW5ndGgpO1xuICAgIGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoJ2NjLicpKSByZXR1cm4gbm9ybWFsaXplZDtcbiAgICBjb25zdCBidWlsdGlucyA9IG5ldyBTZXQoWydVSVRyYW5zZm9ybScsICdTcHJpdGUnLCAnTGFiZWwnLCAnQnV0dG9uJywgJ1dpZGdldCcsICdMYXlvdXQnLCAnVG9nZ2xlJywgJ1RvZ2dsZUdyb3VwJywgJ1NsaWRlcicsICdQcm9ncmVzc0JhcicsICdTY3JvbGxWaWV3JywgJ1BhZ2VWaWV3JywgJ1BhZ2VWaWV3SW5kaWNhdG9yJywgJ01hc2snXSk7XG4gICAgcmV0dXJuIGJ1aWx0aW5zLmhhcyhub3JtYWxpemVkKSA/IGBjYy4ke25vcm1hbGl6ZWR9YCA6IG5vcm1hbGl6ZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkQ29tcG9uZW50cyhub2RlRGF0YTogYW55KTogQXJyYXk8eyB0eXBlOiBzdHJpbmc7IHJhd1R5cGU6IHN0cmluZzsgaW5kZXg6IG51bWJlcjsgdXVpZD86IHN0cmluZzsgcmF3OiBhbnkgfT4ge1xuICAgIGNvbnN0IGNvbXBzID0gQXJyYXkuaXNBcnJheShub2RlRGF0YT8uX19jb21wc19fKSA/IG5vZGVEYXRhLl9fY29tcHNfXyA6IEFycmF5LmlzQXJyYXkobm9kZURhdGE/LmNvbXBvbmVudHMpID8gbm9kZURhdGEuY29tcG9uZW50cyA6IFtdO1xuICAgIHJldHVybiBjb21wcy5tYXAoKGNvbXA6IGFueSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCByYXdUeXBlID0gU3RyaW5nKGNvbXA/Ll9fdHlwZV9fIHx8IGNvbXA/LnR5cGUgfHwgY29tcD8uY2lkIHx8IHVud3JhcER1bXBWYWx1ZShjb21wPy50eXBlKSB8fCAnQ29tcG9uZW50Jyk7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IGNvbXBvbmVudFNob3J0TmFtZShyYXdUeXBlKSwgcmF3VHlwZSwgaW5kZXgsIHV1aWQ6IHVud3JhcER1bXBWYWx1ZShjb21wPy51dWlkKSB8fCBjb21wPy51dWlkPy52YWx1ZSwgcmF3OiBjb21wIH07XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50SW5kZXgobm9kZURhdGE6IGFueSwgY29tcG9uZW50VHlwZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCB3YW50ZWQgPSBjb21wb25lbnRTaG9ydE5hbWUodG9Db2Nvc0NvbXBvbmVudFR5cGUoY29tcG9uZW50VHlwZSkpO1xuICAgIHJldHVybiByZWFkQ29tcG9uZW50cyhub2RlRGF0YSkuZmluZCgoY29tcG9uZW50KSA9PiBjb21wb25lbnQudHlwZSA9PT0gd2FudGVkIHx8IGNvbXBvbmVudC5yYXdUeXBlID09PSBjb21wb25lbnRUeXBlIHx8IGNvbXBvbmVudC5yYXdUeXBlID09PSB0b0NvY29zQ29tcG9uZW50VHlwZShjb21wb25lbnRUeXBlKSk/LmluZGV4ID8/IC0xO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlOb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCB1dWlkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCB7IHV1aWQgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlOb2RlVHJlZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5QXNzZXRJbmZvKHJlZjogc3RyaW5nIHwgVUlHcmFwaEFzc2V0UmVmKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCB2YWx1ZSA9IHR5cGVvZiByZWYgPT09ICdzdHJpbmcnID8gcmVmIDogcmVmLnBhdGggfHwgcmVmLnV1aWQ7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGVkaXRvclJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCB2YWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgeyB1dWlkOiB2YWx1ZSB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkVGFyZ2V0KHRhcmdldDogVUlHcmFwaFRhcmdldCk6IFByb21pc2U8TG9hZGVkVGFyZ2V0PiB7XG4gICAgY29uc3Qgd2FybmluZ3M6IGFueVtdID0gW107XG4gICAgaWYgKCFpc0VkaXRvckF2YWlsYWJsZSgpKSB7XG4gICAgICAgIHJldHVybiB7IHRhcmdldCwgcm9vdDogbnVsbCwgbW9kZTogJ3VuYXZhaWxhYmxlJywgd2FybmluZ3M6IFt7IGNvZGU6ICdFRElUT1JfQVBJX1VOQVZBSUxBQkxFJywgcGF0aDogJyQudGFyZ2V0JywgbWVzc2FnZTogJ0NvY29zIEVkaXRvciBBUEkgaXMgdW5hdmFpbGFibGUuJyB9XSB9O1xuICAgIH1cblxuICAgIGlmICh0YXJnZXQudHlwZSA9PT0gJ3ByZWZhYicgJiYgKHRhcmdldC5wYXRoIHx8IHRhcmdldC51dWlkKSkge1xuICAgICAgICBhd2FpdCBlbnRlclByZWZhYkVkaXRNb2RlKHRhcmdldC5wYXRoIHx8IHRhcmdldC51dWlkISk7XG4gICAgICAgIGNvbnN0IHJvb3QgPSBhd2FpdCBxdWVyeU5vZGVUcmVlKCk7XG4gICAgICAgIHJldHVybiB7IHRhcmdldCwgcm9vdCwgbW9kZTogJ3ByZWZhYicsIHdhcm5pbmdzIH07XG4gICAgfVxuXG4gICAgY29uc3QgdHJlZSA9IGF3YWl0IHF1ZXJ5Tm9kZVRyZWUoKTtcbiAgICBpZiAodGFyZ2V0LnR5cGUgPT09ICdub2RlJykge1xuICAgICAgICBjb25zdCByb290ID0gcmVzb2x2ZU5vZGVJblRyZWUodHJlZSwgdGFyZ2V0IGFzIE5vZGVSZWYpO1xuICAgICAgICByZXR1cm4geyB0YXJnZXQsIHJvb3QsIG1vZGU6ICdub2RlJywgd2FybmluZ3MgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgdGFyZ2V0LCByb290OiB0cmVlLCBtb2RlOiAnc2NlbmUnLCB3YXJuaW5ncyB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW50ZXJQcmVmYWJFZGl0TW9kZShwcmVmYWJQYXRoT3JVdWlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IHF1ZXJ5QXNzZXRJbmZvKHByZWZhYlBhdGhPclV1aWQpO1xuICAgIGlmICghYXNzZXRJbmZvPy51dWlkKSB0aHJvdyBuZXcgRXJyb3IoYFByZWZhYiBhc3NldCBub3QgZm91bmQ6ICR7cHJlZmFiUGF0aE9yVXVpZH1gKTtcbiAgICB0cnkgeyBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdhc3NldC1kYicsICdvcGVuLWFzc2V0JywgYXNzZXRJbmZvLnVybCB8fCBwcmVmYWJQYXRoT3JVdWlkKTsgfSBjYXRjaCB7fVxuICAgIGF3YWl0IGRlbGF5KDMwMCk7XG4gICAgdHJ5IHsgYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAnY2FsbC1wcmV2aWV3LWZ1bmN0aW9uJywgWydzY2VuZTpwcmVmYWItcHJldmlldycsICdzZXRQcmVmYWInLCBhc3NldEluZm8udXVpZF0pOyB9IGNhdGNoIHt9XG4gICAgdHJ5IHsgYXdhaXQgZWRpdG9yUmVxdWVzdCgnaGllcmFyY2h5JywgJ3N0YWdpbmcnLCB7IGFzc2V0VXVpZDogYXNzZXRJbmZvLnV1aWQsIGFuaW1hdGlvblV1aWQ6ICcnLCBleHBhbmRMZXZlbHM6IFsnMCddIH0pOyB9IGNhdGNoIHt9XG4gICAgYXdhaXQgZGVsYXkoMzAwKTtcbiAgICByZXR1cm4gYXNzZXRJbmZvO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZUN1cnJlbnRTY2VuZU9yUHJlZmFiKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtc2NlbmUnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUVkaXRvck5vZGUobm9kZTogVUlHcmFwaE5vZGUsIHBhcmVudFV1aWQ/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG9wdGlvbnM6IGFueSA9IHsgbmFtZTogbm9kZS5uYW1lLCB0eXBlOiAnY2MuTm9kZScgfTtcbiAgICBpZiAocGFyZW50VXVpZCkgb3B0aW9ucy5wYXJlbnQgPSBwYXJlbnRVdWlkO1xuICAgIGlmIChub2RlLnBvc2l0aW9uKSBvcHRpb25zLmR1bXAgPSB7IHBvc2l0aW9uOiB7IHZhbHVlOiBub2RlLnBvc2l0aW9uIH0gfTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIG9wdGlvbnMpO1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHRbMF0gOiAocmVzdWx0Py51dWlkIHx8IHJlc3VsdCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVFZGl0b3JOb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7IGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ3JlbW92ZS1ub2RlJywgeyB1dWlkIH0pOyB9XG4gICAgY2F0Y2ggeyBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdyZW1vdmUtbm9kZScsIHV1aWQpOyB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtb3ZlRWRpdG9yTm9kZSh1dWlkOiBzdHJpbmcsIHBhcmVudFV1aWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGF0dGVtcHRzID0gW1xuICAgICAgICAoKSA9PiBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdzZXQtcGFyZW50JywgeyB1dWlkLCBwYXJlbnQ6IHBhcmVudFV1aWQgfSksXG4gICAgICAgICgpID0+IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ21vdmUtbm9kZScsIHsgdXVpZCwgcGFyZW50OiBwYXJlbnRVdWlkIH0pLFxuICAgICAgICAoKSA9PiBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7IHV1aWQsIHBhdGg6ICdwYXJlbnQnLCBkdW1wOiB7IHZhbHVlOiBwYXJlbnRVdWlkIH0gfSksXG4gICAgXTtcbiAgICBsZXQgbGFzdEVycm9yOiBhbnk7XG4gICAgZm9yIChjb25zdCBhdHRlbXB0IG9mIGF0dGVtcHRzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBhdHRlbXB0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsYXN0RXJyb3IgPSBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBsYXN0RXJyb3IgfHwgbmV3IEVycm9yKGBGYWlsZWQgdG8gbW92ZSBub2RlICR7dXVpZH0gdW5kZXIgcGFyZW50ICR7cGFyZW50VXVpZH1gKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZEVkaXRvckNvbXBvbmVudChub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnQ6IFVJR3JhcGhDb21wb25lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb21wb25lbnRUeXBlID0gdG9Db2Nvc0NvbXBvbmVudFR5cGUoY29tcG9uZW50LnR5cGUpO1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1jb21wb25lbnQnLCB7IHV1aWQ6IG5vZGVVdWlkLCBjb21wb25lbnQ6IGNvbXBvbmVudFR5cGUgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ2FkZC1jb21wb25lbnQnLCB7IHV1aWQ6IG5vZGVVdWlkLCBjb21wb25lbnQ6IGNvbXBvbmVudFR5cGUgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlRWRpdG9yQ29tcG9uZW50KG5vZGVVdWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG5vZGVEYXRhID0gYXdhaXQgcXVlcnlOb2RlKG5vZGVVdWlkKTtcbiAgICBjb25zdCBpbmRleCA9IGZpbmRDb21wb25lbnRJbmRleChub2RlRGF0YSwgY29tcG9uZW50VHlwZSk7XG4gICAgaWYgKGluZGV4IDwgMCkgdGhyb3cgbmV3IEVycm9yKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZSAke25vZGVVdWlkfWApO1xuICAgIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ3JlbW92ZS1hcnJheS1lbGVtZW50JywgeyB1dWlkOiBub2RlVXVpZCwgcGF0aDogJ19fY29tcHNfXycsIGluZGV4IH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0RWRpdG9yTm9kZVByb3BzKG5vZGVVdWlkOiBzdHJpbmcsIHByb3BzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMgfHwge30pKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICduYW1lJykge1xuICAgICAgICAgICAgYXdhaXQgc2V0RWRpdG9yUHJvcGVydHkobm9kZVV1aWQsICduYW1lJywgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2FjdGl2ZScpIHtcbiAgICAgICAgICAgIGF3YWl0IHNldEVkaXRvclByb3BlcnR5KG5vZGVVdWlkLCAnYWN0aXZlJywgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3Bvc2l0aW9uJykge1xuICAgICAgICAgICAgYXdhaXQgc2V0RWRpdG9yUHJvcGVydHkobm9kZVV1aWQsICdwb3NpdGlvbicsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdzY2FsZScpIHtcbiAgICAgICAgICAgIGF3YWl0IHNldEVkaXRvclByb3BlcnR5KG5vZGVVdWlkLCAnc2NhbGUnLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAncm90YXRpb24nKSB7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JQcm9wZXJ0eShub2RlVXVpZCwgJ2V1bGVyQW5nbGVzJywgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3NpemUnKSB7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JDb21wb25lbnRQcm9wcyhub2RlVXVpZCwgJ1VJVHJhbnNmb3JtJywgeyBjb250ZW50U2l6ZTogdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRFZGl0b3JDb21wb25lbnRQcm9wcyhub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcsIHByb3BzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCFwcm9wcyB8fCBPYmplY3Qua2V5cyhwcm9wcykubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgY29uc3Qgbm9kZURhdGEgPSBhd2FpdCBxdWVyeU5vZGUobm9kZVV1aWQpO1xuICAgIGNvbnN0IGluZGV4ID0gZmluZENvbXBvbmVudEluZGV4KG5vZGVEYXRhLCBjb21wb25lbnRUeXBlKTtcbiAgICBpZiAoaW5kZXggPCAwKSB0aHJvdyBuZXcgRXJyb3IoYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlICR7bm9kZVV1aWR9YCk7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMpKSB7XG4gICAgICAgIGlmIChjb21wb25lbnRTaG9ydE5hbWUoY29tcG9uZW50VHlwZSkgPT09ICdVSVRyYW5zZm9ybScgJiYga2V5ID09PSAnY29udGVudFNpemUnKSB7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JQcm9wZXJ0eShub2RlVXVpZCwgYF9fY29tcHNfXy4ke2luZGV4fS53aWR0aGAsIE51bWJlcigodmFsdWUgYXMgYW55KS53aWR0aCkpO1xuICAgICAgICAgICAgYXdhaXQgc2V0RWRpdG9yUHJvcGVydHkobm9kZVV1aWQsIGBfX2NvbXBzX18uJHtpbmRleH0uaGVpZ2h0YCwgTnVtYmVyKCh2YWx1ZSBhcyBhbnkpLmhlaWdodCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFNob3J0TmFtZShjb21wb25lbnRUeXBlKSA9PT0gJ1VJVHJhbnNmb3JtJyAmJiBrZXkgPT09ICdhbmNob3JQb2ludCcpIHtcbiAgICAgICAgICAgIGF3YWl0IHNldEVkaXRvclByb3BlcnR5KG5vZGVVdWlkLCBgX19jb21wc19fLiR7aW5kZXh9LmFuY2hvclhgLCBOdW1iZXIoKHZhbHVlIGFzIGFueSkueCkpO1xuICAgICAgICAgICAgYXdhaXQgc2V0RWRpdG9yUHJvcGVydHkobm9kZVV1aWQsIGBfX2NvbXBzX18uJHtpbmRleH0uYW5jaG9yWWAsIE51bWJlcigodmFsdWUgYXMgYW55KS55KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBzZXRFZGl0b3JQcm9wZXJ0eShub2RlVXVpZCwgYF9fY29tcHNfXy4ke2luZGV4fS4ke2tleX1gLCBub3JtYWxpemVFZGl0b3JWYWx1ZSh2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0RWRpdG9yUHJvcGVydHkodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7IHV1aWQsIHBhdGgsIGR1bXA6IHsgdmFsdWU6IG5vcm1hbGl6ZUVkaXRvclZhbHVlKHZhbHVlKSB9IH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlUHJlZmFiRnJvbU5vZGUobm9kZVV1aWQ6IHN0cmluZywgb3V0cHV0UGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZWRpdG9yUmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLXByZWZhYicsIHsgbm9kZVV1aWQsIHVybDogb3V0cHV0UGF0aCB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGVkaXRvclJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1wcmVmYWInLCB7IHV1aWQ6IG5vZGVVdWlkLCBwYXRoOiBvdXRwdXRQYXRoIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbnRpYXRlUHJlZmFiQXNzZXQocHJlZmFiOiBVSUdyYXBoQXNzZXRSZWYsIHBhcmVudFV1aWQ6IHN0cmluZywgcHJvcHM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgcXVlcnlBc3NldEluZm8ocHJlZmFiKTtcbiAgICBpZiAoIWFzc2V0SW5mbz8udXVpZCkgdGhyb3cgbmV3IEVycm9yKGBQcmVmYWIgYXNzZXQgbm90IGZvdW5kOiAke3ByZWZhYi5wYXRoIHx8IHByZWZhYi51dWlkfWApO1xuICAgIGNvbnN0IG9wdGlvbnM6IGFueSA9IHsgYXNzZXRVdWlkOiBhc3NldEluZm8udXVpZCwgcGFyZW50OiBwYXJlbnRVdWlkLCBuYW1lOiBwcm9wcy5uYW1lIHx8IGFzc2V0SW5mby5uYW1lIHx8ICdQcmVmYWJJbnN0YW5jZScgfTtcbiAgICBpZiAocHJvcHMucG9zaXRpb24pIG9wdGlvbnMuZHVtcCA9IHsgcG9zaXRpb246IHsgdmFsdWU6IHByb3BzLnBvc2l0aW9uIH0gfTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBlZGl0b3JSZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIG9wdGlvbnMpO1xuICAgIGNvbnN0IHV1aWQgPSBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHRbMF0gOiAocmVzdWx0Py51dWlkIHx8IHJlc3VsdCk7XG4gICAgYXdhaXQgc2V0RWRpdG9yTm9kZVByb3BzKHV1aWQsIHByb3BzKTtcbiAgICByZXR1cm4gdXVpZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVOb2RlSW5UcmVlKHJvb3Q6IGFueSwgcmVmOiBOb2RlUmVmKTogYW55IHwgbnVsbCB7XG4gICAgY29uc3QgbWF0Y2hlczogYW55W10gPSBbXTtcbiAgICB2aXNpdFRyZWUocm9vdCwgKG5vZGUsIHBhdGgpID0+IHtcbiAgICAgICAgY29uc3QgdXVpZCA9IHJlYWROb2RlVXVpZChub2RlKTtcbiAgICAgICAgY29uc3QgbmFtZSA9IHJlYWROb2RlTmFtZShub2RlKTtcbiAgICAgICAgY29uc3Qgbm9kZVBhdGggPSBub2RlLnBhdGggfHwgcGF0aDtcbiAgICAgICAgaWYgKHJlZi51dWlkICYmIHV1aWQgPT09IHJlZi51dWlkKSBtYXRjaGVzLnB1c2goeyAuLi5ub2RlLCBwYXRoOiBub2RlUGF0aCB9KTtcbiAgICAgICAgZWxzZSBpZiAoIXJlZi51dWlkICYmIHJlZi5wYXRoICYmIChub2RlUGF0aCA9PT0gcmVmLnBhdGggfHwgbm9kZVBhdGguZW5kc1dpdGgoYC8ke3JlZi5wYXRofWApKSkgbWF0Y2hlcy5wdXNoKHsgLi4ubm9kZSwgcGF0aDogbm9kZVBhdGggfSk7XG4gICAgICAgIGVsc2UgaWYgKCFyZWYudXVpZCAmJiAhcmVmLnBhdGggJiYgcmVmLm5hbWUgJiYgbmFtZSA9PT0gcmVmLm5hbWUpIG1hdGNoZXMucHVzaCh7IC4uLm5vZGUsIHBhdGg6IG5vZGVQYXRoIH0pO1xuICAgIH0pO1xuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFyZWYudXVpZCAmJiBtYXRjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29uc3QgZXJyOiBhbnkgPSBuZXcgRXJyb3IoYE5vZGUgcmVmICR7cmVmLnBhdGggfHwgcmVmLm5hbWV9IG1hdGNoZWQgbXVsdGlwbGUgbm9kZXMuYCk7XG4gICAgICAgIGVyci5jb2RlID0gJ0FNQklHVU9VU19OT0RFX05BTUUnO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVzWzBdO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZU5vZGVVdWlkKHJvb3Q6IGFueSwgcmVmOiBOb2RlUmVmKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAocmVmLnV1aWQpIHJldHVybiByZWYudXVpZDtcbiAgICBjb25zdCBub2RlID0gcmVzb2x2ZU5vZGVJblRyZWUocm9vdCwgcmVmKTtcbiAgICBjb25zdCB1dWlkID0gbm9kZSA/IHJlYWROb2RlVXVpZChub2RlKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoIXV1aWQpIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQ6ICR7cmVmLnBhdGggfHwgcmVmLm5hbWUgfHwgcmVmLnV1aWR9YCk7XG4gICAgcmV0dXJuIHV1aWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2aXNpdFRyZWUocm9vdDogYW55LCB2aXNpdG9yOiAobm9kZTogYW55LCBwYXRoOiBzdHJpbmcpID0+IHZvaWQsIGJhc2VQYXRoPzogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCFyb290KSByZXR1cm47XG4gICAgY29uc3QgbmFtZSA9IHJlYWROb2RlTmFtZShyb290KTtcbiAgICBjb25zdCBwYXRoID0gYmFzZVBhdGggfHwgcm9vdC5wYXRoIHx8IG5hbWU7XG4gICAgdmlzaXRvcihyb290LCBwYXRoKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHJvb3QuY2hpbGRyZW4gfHwgW10pIHtcbiAgICAgICAgdmlzaXRUcmVlKGNoaWxkLCB2aXNpdG9yLCBgJHtwYXRofS8ke3JlYWROb2RlTmFtZShjaGlsZCl9YCk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRWRpdG9yVmFsdWUodmFsdWU6IGFueSk6IGFueSB7XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKCdhc3NldCcgaW4gdmFsdWUpIHJldHVybiB2YWx1ZS5hc3NldC51dWlkIHx8IHZhbHVlLmFzc2V0LnBhdGg7XG4gICAgICAgIGlmICgnY29tcG9uZW50VHlwZScgaW4gdmFsdWUgJiYgJ25vZGUnIGluIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBub2RlOiB2YWx1ZS5ub2RlLnV1aWQgfHwgdmFsdWUubm9kZS5wYXRoIHx8IHZhbHVlLm5vZGUubmFtZSwgY29tcG9uZW50VHlwZTogdmFsdWUuY29tcG9uZW50VHlwZSB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICgnbm9kZScgaW4gdmFsdWUpIHJldHVybiB2YWx1ZS5ub2RlLnV1aWQgfHwgdmFsdWUubm9kZS5wYXRoIHx8IHZhbHVlLm5vZGUubmFtZTtcbiAgICAgICAgaWYgKCdwYXRoJyBpbiB2YWx1ZSAmJiAndHlwZScgaW4gdmFsdWUpIHJldHVybiB2YWx1ZS51dWlkIHx8IHZhbHVlLnBhdGg7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlbGF5KG1zOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cbiJdfQ==
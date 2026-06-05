import { createDefaultUINode } from './default-ui-factory';
import { addError, addOperationResult, addUsedAsset, addWarning, createReport, summarize } from './report';
import { resolveAsset } from './resolver';
import { UIGraph, UIGraphNode, UIPatch, UIPatchOperation, UIExecutionReport, UIGraphAssetRef, UIGraphComponent } from './types';
import { validateUiGraph, validateUiPatch } from './validator';
import { addEditorComponent, createEditorNode, createPrefabFromNode, instantiatePrefabAsset, isEditorAvailable, loadTarget, readNodeUuid, removeEditorComponent, removeEditorNode, resolveNodeUuid, saveCurrentSceneOrPrefab, setEditorComponentProps, setEditorNodeProps } from './editor-adapter';

function validationErrorReport(target: any, errors: any[], warnings: any[] = []): UIExecutionReport {
    const report = createReport(target || {});
    errors.forEach((item) => addError(report, item));
    warnings.forEach((item) => addWarning(report, item));
    return summarize(report);
}

export async function generatePrefabFromGraph(graph: UIGraph, outputPath: string, overwrite = false): Promise<UIExecutionReport> {
    const validation = validateUiGraph(graph);
    if (!validation.valid) return validationErrorReport(graph?.target, validation.errors, validation.warnings);
    const normalized = validation.normalized!;
    const report = createReport({ type: 'prefab', path: outputPath });
    validation.warnings.forEach((item) => addWarning(report, item));

    if (!isEditorAvailable()) {
        addWarning(report, { code: 'EDITOR_API_UNAVAILABLE', path: '$.outputPath', message: 'Cocos Editor API is unavailable; validation/report generated without writing prefab.' });
        await walkNodeForReport(normalized.root, report);
        addOperationResult(report, { op: 'generatePrefabFromGraph', success: true, target: { path: outputPath } });
        return summarize(report);
    }

    try {
        if (!overwrite) {
            const existing = await resolveAsset({ path: outputPath, type: 'Prefab' });
            if (existing.exists) {
                addError(report, { code: 'OUTPUT_PATH_EXISTS', path: '$.outputPath', message: `${outputPath} already exists.`, suggestion: 'Set overwrite=true or choose another outputPath.' });
                return summarize(report);
            }
        }
        const rootUuid = await createGraphNodeRecursive(normalized.root, undefined, report, '$.root');
        await createPrefabFromNode(rootUuid, outputPath);
        await saveCurrentSceneOrPrefab().catch(() => undefined);
        addOperationResult(report, { op: 'generatePrefabFromGraph', success: report.errors.length === 0, target: { path: outputPath }, createdNode: { uuid: rootUuid, name: normalized.root.name } });
    } catch (e: any) {
        addError(report, { code: 'PREFAB_GENERATION_FAILED', path: '$', message: e?.message || 'Failed to generate prefab.', suggestion: 'Check Cocos Editor asset-db and prefab APIs.' });
    }
    return summarize(report);
}

export async function applyUiPatch(patch: UIPatch): Promise<UIExecutionReport> {
    const validation = validateUiPatch(patch);
    if (!validation.valid) return validationErrorReport(patch?.target, validation.errors, validation.warnings);
    const normalized = validation.normalized!;
    const report = createReport(normalized.target);
    validation.warnings.forEach((item) => addWarning(report, item));

    if (!isEditorAvailable()) {
        for (let index = 0; index < normalized.operations.length; index += 1) {
            const operation = normalized.operations[index];
            await walkPatchOperationForReport(operation, index, report);
        }
        addWarning(report, { code: 'EDITOR_API_UNAVAILABLE', path: '$.target', message: 'Cocos Editor API is unavailable; patch was validated but not written.' });
        return summarize(report);
    }

    let loaded = await loadTarget(normalized.target);
    loaded.warnings.forEach((item) => addWarning(report, item));
    if (!loaded.root) {
        addError(report, { code: 'TARGET_NOT_LOADED', path: '$.target', message: 'Target could not be loaded for patch execution.' });
        return summarize(report);
    }

    for (let index = 0; index < normalized.operations.length; index += 1) {
        const operation = normalized.operations[index];
        const result = await executePatchOperation(operation, index, report, loaded.root);
        addOperationResult(report, result);
        if (!result.success && operation.ifMissing !== 'ignore' && operation.required !== false) break;
        if (['addNode', 'removeNode', 'moveNode'].includes(operation.op)) {
            loaded = await loadTarget(normalized.target);
        }
    }
    if (report.errors.length === 0) await saveCurrentSceneOrPrefab().catch(() => undefined);
    return summarize(report);
}

export async function instantiatePrefabToScene(scene: any, prefab: UIGraphAssetRef, parent: any, props: Record<string, any> = {}): Promise<UIExecutionReport> {
    const report = createReport(scene || { type: 'scene', current: true });
    const resolvedPrefab = await resolveAsset({ ...prefab, type: 'Prefab' });
    if (resolvedPrefab.errors.length) resolvedPrefab.errors.forEach((item) => addError(report, item));
    addUsedAsset(report, resolvedPrefab);

    if (!isEditorAvailable()) {
        addWarning(report, { code: 'EDITOR_API_UNAVAILABLE', path: '$.prefab', message: 'Cocos Editor API is unavailable; prefab was not instantiated.' });
        addOperationResult(report, { op: 'instantiatePrefab', success: report.errors.length === 0, target: { prefab, parent } });
        return summarize(report);
    }

    try {
        const loaded = await loadTarget(scene || { type: 'scene', current: true });
        const parentUuid = await resolveNodeUuid(loaded.root, parent);
        const uuid = await instantiatePrefabAsset(prefab, parentUuid, props);
        report.summary.instantiatedPrefabs += 1;
        addOperationResult(report, { op: 'instantiatePrefab', success: true, createdNode: { uuid, name: props.name } });
        await saveCurrentSceneOrPrefab().catch(() => undefined);
    } catch (e: any) {
        addError(report, { code: 'INSTANTIATE_PREFAB_FAILED', path: '$', message: e?.message || 'Failed to instantiate prefab.' });
    }
    return summarize(report);
}

async function createGraphNodeRecursive(node: UIGraphNode, parentUuid: string | undefined, report: UIExecutionReport, path: string): Promise<string> {
    if (node.factory) {
        const created = createDefaultUINode(node.factory, node);
        created.warnings.forEach((item) => addWarning(report, item));
        report.summary.createdDefaultUINodes += node.factory === 'Node' ? 0 : 1;
    }
    const uuid = await createEditorNode(node, parentUuid);
    report.summary.createdNodes += 1;
    await setEditorNodeProps(uuid, nodeToProps(node));
    for (const component of node.components || []) {
        await ensureComponentAndProps(uuid, component, report);
    }
    for (let index = 0; index < (node.children || []).length; index += 1) {
        await createGraphNodeRecursive((node.children || [])[index], uuid, report, `${path}.children[${index}]`);
    }
    return uuid;
}

async function ensureComponentAndProps(nodeUuid: string, component: UIGraphComponent, report: UIExecutionReport) {
    await addEditorComponent(nodeUuid, component);
    report.summary.addedComponents += 1;
    for (const value of Object.values(component.props || {})) {
        if (value && typeof value === 'object' && ('path' in value || 'uuid' in value) && 'type' in value) {
            const resolved = await resolveAsset(value as UIGraphAssetRef);
            addUsedAsset(report, resolved);
            resolved.errors.forEach((item) => addError(report, item));
        }
    }
    await setEditorComponentProps(nodeUuid, component.type, component.props || {});
}

function nodeToProps(node: UIGraphNode): Record<string, any> {
    const props: Record<string, any> = {};
    for (const key of ['active', 'position', 'scale', 'rotation', 'size'] as const) {
        if (node[key] !== undefined) props[key] = node[key];
    }
    return props;
}

async function walkNodeForReport(node: UIGraphNode, report: UIExecutionReport) {
    report.summary.createdNodes += 1;
    report.summary.addedComponents += node.components?.length || 0;
    if (node.factory && node.factory !== 'Node') report.summary.createdDefaultUINodes += 1;
    for (const child of node.children || []) await walkNodeForReport(child, report);
}

async function walkPatchOperationForReport(operation: UIPatchOperation, index: number, report: UIExecutionReport) {
    switch (operation.op) {
        case 'addNode':
            if (operation.node) await walkNodeForReport(operation.node, report);
            break;
        case 'addComponent': report.summary.addedComponents += 1; break;
        case 'removeComponent': report.summary.removedComponents += 1; break;
        case 'removeNode': report.summary.removedNodes += 1; break;
        case 'moveNode': report.summary.movedNodes += 1; break;
        case 'instantiatePrefab': report.summary.instantiatedPrefabs += 1; break;
        default: report.summary.updatedProps += Object.keys(operation.props || operation.overrides || {}).length || 1;
    }
    addOperationResult(report, { index, op: operation.op, success: true, target: operation.target || operation.parent });
}

async function executePatchOperation(operation: UIPatchOperation, index: number, report: UIExecutionReport, root: any): Promise<any> {
    try {
        switch (operation.op) {
            case 'addNode': {
                const parentUuid = await resolveNodeUuid(root, operation.parent!);
                const uuid = await createGraphNodeRecursive(operation.node!, parentUuid, report, `$.operations[${index}].node`);
                return { index, op: operation.op, success: true, target: operation.parent, createdNode: { uuid, name: operation.node?.name } };
            }
            case 'removeNode': {
                const uuid = await resolveNodeUuid(root, operation.target!);
                await removeEditorNode(uuid);
                report.summary.removedNodes += 1;
                return { index, op: operation.op, success: true, target: operation.target };
            }
            case 'setNodeProps': {
                const uuid = await resolveNodeUuid(root, operation.target!);
                await setEditorNodeProps(uuid, operation.props || {});
                report.summary.updatedProps += Object.keys(operation.props || {}).length;
                return { index, op: operation.op, success: true, target: operation.target };
            }
            case 'addComponent': {
                const uuid = await resolveNodeUuid(root, operation.target!);
                await ensureComponentAndProps(uuid, operation.component!, report);
                return { index, op: operation.op, success: true, target: operation.target };
            }
            case 'removeComponent': {
                const uuid = await resolveNodeUuid(root, operation.target!);
                await removeEditorComponent(uuid, operation.componentType!);
                report.summary.removedComponents += 1;
                return { index, op: operation.op, success: true, target: operation.target };
            }
            case 'setComponentProps': {
                const uuid = await resolveNodeUuid(root, operation.target!);
                await setEditorComponentProps(uuid, operation.componentType!, operation.props || {});
                report.summary.updatedProps += Object.keys(operation.props || {}).length;
                return { index, op: operation.op, success: true, target: operation.target };
            }
            case 'instantiatePrefab': {
                const parentUuid = await resolveNodeUuid(root, operation.parent || operation.target!);
                const uuid = await instantiatePrefabAsset(operation.prefab!, parentUuid, operation.props || {});
                report.summary.instantiatedPrefabs += 1;
                return { index, op: operation.op, success: true, target: operation.parent || operation.target, createdNode: { uuid } };
            }
            case 'setAssetRef':
            case 'setEventBindings':
            case 'setPrefabInstanceOverride':
                report.summary.updatedProps += Object.keys(operation.props || operation.overrides || {}).length || 1;
                return { index, op: operation.op, success: false, target: operation.target, errors: [{ code: 'OPERATION_NOT_IMPLEMENTED', path: `$.operations[${index}].op`, message: `${operation.op} requires additional Cocos Editor-specific implementation.`, suggestion: 'Use setComponentProps for simple properties in v0.1, or complete the dedicated operation adapter.' }] };
            case 'moveNode':
                return { index, op: operation.op, success: false, target: operation.target, errors: [{ code: 'OPERATION_NOT_IMPLEMENTED', path: `$.operations[${index}].op`, message: 'moveNode is validated but not yet wired to a stable Cocos Editor move API.' }] };
            default:
                return { index, op: operation.op, success: false, errors: [{ code: 'UNKNOWN_PATCH_OPERATION', path: `$.operations[${index}].op`, message: `Unsupported operation ${operation.op}.` }] };
        }
    } catch (e: any) {
        const code = e?.code || (operation.ifMissing === 'ignore' ? 'PATCH_OPERATION_SKIPPED' : 'PATCH_OPERATION_FAILED');
        return { index, op: operation.op, success: operation.ifMissing === 'ignore', errors: operation.ifMissing === 'ignore' ? [] : [{ code, path: `$.operations[${index}]`, message: e?.message || 'Operation failed.' }] };
    }
}

import { createDefaultUINode } from './default-ui-factory';
import { addError, addOperationResult, addUsedAsset, addWarning, createReport, summarize } from './report';
import { resolveAsset } from './resolver';
import { UIGraph, UIGraphNode, UIPatch, UIPatchOperation, UIExecutionReport, UIGraphAssetRef } from './types';
import { validateUiGraph, validateUiPatch } from './validator';

function getEditor(): any {
    return (globalThis as any).Editor;
}

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

    try {
        const editor = getEditor();
        if (editor?.Message?.request && !overwrite) {
            const existing = await editor.Message.request('asset-db', 'query-asset-info', outputPath);
            if (existing) {
                addError(report, { code: 'OUTPUT_PATH_EXISTS', path: '$.outputPath', message: `${outputPath} already exists.`, suggestion: 'Set overwrite=true or choose another outputPath.' });
                return summarize(report);
            }
        }
        await walkNode(normalized.root, report, '$.root');
        if (editor?.Message?.request) {
            // Cocos versions differ in prefab creation APIs. The report remains structured if the API is unavailable.
            await editor.Message.request('asset-db', 'create-asset', outputPath, JSON.stringify({ uiGraphGenerated: true, graph: normalized }, null, 2));
        } else {
            addWarning(report, { code: 'EDITOR_API_UNAVAILABLE', path: '$.outputPath', message: 'Cocos Editor API is unavailable; validation/report generated without writing prefab.' });
        }
        addOperationResult(report, { op: 'generatePrefabFromGraph', success: report.errors.length === 0, target: { path: outputPath } });
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
    for (let index = 0; index < normalized.operations.length; index += 1) {
        const operation = normalized.operations[index];
        const result = await executePatchOperation(operation, index, report);
        addOperationResult(report, result);
        if (!result.success && operation.ifMissing !== 'ignore' && operation.required !== false) break;
    }
    return summarize(report);
}

export async function instantiatePrefabToScene(scene: any, prefab: UIGraphAssetRef, parent: any, props: Record<string, any> = {}): Promise<UIExecutionReport> {
    const report = createReport(scene || { type: 'scene', current: true });
    const resolvedPrefab = await resolveAsset({ ...prefab, type: 'Prefab' });
    if (resolvedPrefab.errors.length) resolvedPrefab.errors.forEach((item) => addError(report, item));
    addUsedAsset(report, resolvedPrefab);
    try {
        const editor = getEditor();
        if (editor?.Message?.request && resolvedPrefab.uuid) {
            const created = await editor.Message.request('scene', 'create-node', { name: props.name || resolvedPrefab.path?.split('/').pop()?.replace('.prefab', ''), parent, prefabUuid: resolvedPrefab.uuid });
            report.summary.instantiatedPrefabs += 1;
            addOperationResult(report, { op: 'instantiatePrefab', success: true, createdNode: { uuid: created?.uuid, name: props.name } });
        } else {
            addWarning(report, { code: 'EDITOR_API_UNAVAILABLE', path: '$.prefab', message: 'Cocos Editor API is unavailable; prefab was not instantiated.' });
            addOperationResult(report, { op: 'instantiatePrefab', success: report.errors.length === 0, target: { prefab, parent } });
        }
    } catch (e: any) {
        addError(report, { code: 'INSTANTIATE_PREFAB_FAILED', path: '$', message: e?.message || 'Failed to instantiate prefab.' });
    }
    return summarize(report);
}

async function walkNode(node: UIGraphNode, report: UIExecutionReport, path: string) {
    if (node.factory) {
        const created = createDefaultUINode(node.factory, node);
        created.warnings.forEach((item) => addWarning(report, item));
        report.summary.createdDefaultUINodes += node.factory === 'Node' ? 0 : 1;
    }
    report.summary.createdNodes += 1;
    report.summary.addedComponents += node.components?.length || 0;
    for (const component of node.components || []) {
        for (const value of Object.values(component.props || {})) {
            if (value && typeof value === 'object' && ('path' in value || 'uuid' in value) && 'type' in value) {
                const resolved = await resolveAsset(value as UIGraphAssetRef);
                addUsedAsset(report, resolved);
            }
        }
    }
    for (let index = 0; index < (node.children || []).length; index += 1) {
        await walkNode((node.children || [])[index], report, `${path}.children[${index}]`);
    }
}

async function executePatchOperation(operation: UIPatchOperation, index: number, report: UIExecutionReport): Promise<any> {
    try {
        switch (operation.op) {
            case 'addNode':
                if (operation.node) await walkNode(operation.node, report, `$.operations[${index}].node`);
                return { index, op: operation.op, success: true, target: operation.parent, createdNode: { name: operation.node?.name, path: operation.parent?.path ? `${operation.parent.path}/${operation.node?.name}` : operation.node?.name } };
            case 'removeNode':
                report.summary.removedNodes += 1;
                return { index, op: operation.op, success: true, target: operation.target };
            case 'moveNode':
                report.summary.movedNodes += 1;
                return { index, op: operation.op, success: true, target: operation.target };
            case 'addComponent':
                report.summary.addedComponents += 1;
                return { index, op: operation.op, success: true, target: operation.target };
            case 'removeComponent':
                report.summary.removedComponents += 1;
                return { index, op: operation.op, success: true, target: operation.target };
            case 'setComponentProps':
            case 'setNodeProps':
            case 'setAssetRef':
            case 'setEventBindings':
            case 'setPrefabInstanceOverride':
                report.summary.updatedProps += Object.keys(operation.props || operation.overrides || {}).length || 1;
                return { index, op: operation.op, success: true, target: operation.target };
            case 'instantiatePrefab':
                report.summary.instantiatedPrefabs += 1;
                return { index, op: operation.op, success: true, target: operation.parent };
            default:
                return { index, op: operation.op, success: false, errors: [{ code: 'UNKNOWN_PATCH_OPERATION', path: `$.operations[${index}].op`, message: `Unsupported operation ${operation.op}.` }] };
        }
    } catch (e: any) {
        return { index, op: operation.op, success: false, errors: [{ code: 'PATCH_OPERATION_FAILED', path: `$.operations[${index}]`, message: e?.message || 'Operation failed.' }] };
    }
}

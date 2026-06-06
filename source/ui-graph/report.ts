import { UIGraphTarget, UIExecutionReport, UIOperationResult, UIValidationError, UIValidationWarning, UIGraphAssetRef } from './types';

export function createReport(target: UIGraphTarget | Record<string, any>): UIExecutionReport & { startedAt: number } {
    return {
        success: true,
        target,
        summary: {
            createdDefaultUINodes: 0,
            createdNodes: 0,
            removedNodes: 0,
            movedNodes: 0,
            addedComponents: 0,
            removedComponents: 0,
            updatedProps: 0,
            instantiatedPrefabs: 0,
            assetRefsResolved: 0
        },
        operations: [],
        usedAssets: [],
        warnings: [],
        errors: [],
        durationMs: 0,
        startedAt: Date.now()
    };
}

export function addOperationResult(report: UIExecutionReport, result: UIOperationResult) {
    report.operations.push(result);
    if (!result.success) report.success = false;
    if (result.errors?.length) result.errors.forEach((item) => addError(report, item));
    if (result.warnings?.length) result.warnings.forEach((item) => addWarning(report, item));
}

export function addWarning(report: UIExecutionReport, item: UIValidationWarning) {
    report.warnings.push(item);
}

export function addError(report: UIExecutionReport, item: UIValidationError) {
    report.errors.push(item);
    report.success = false;
}

export function addUsedAsset(report: UIExecutionReport, asset: UIGraphAssetRef) {
    report.usedAssets.push(asset);
    report.summary.assetRefsResolved = (report.summary.assetRefsResolved || 0) + 1;
}

export function summarize<T extends UIExecutionReport & { startedAt?: number }>(report: T): UIExecutionReport {
    report.durationMs = Date.now() - (report.startedAt || Date.now());
    report.success = report.errors.length === 0 && report.operations.every((operation) => operation.success !== false);
    const { startedAt, ...clean } = report as any;
    return clean as UIExecutionReport;
}

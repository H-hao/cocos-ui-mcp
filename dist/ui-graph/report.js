"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
exports.addOperationResult = addOperationResult;
exports.addWarning = addWarning;
exports.addError = addError;
exports.addUsedAsset = addUsedAsset;
exports.summarize = summarize;
function createReport(target) {
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
function addOperationResult(report, result) {
    var _a, _b;
    report.operations.push(result);
    if (!result.success)
        report.success = false;
    if ((_a = result.errors) === null || _a === void 0 ? void 0 : _a.length)
        result.errors.forEach((item) => addError(report, item));
    if ((_b = result.warnings) === null || _b === void 0 ? void 0 : _b.length)
        result.warnings.forEach((item) => addWarning(report, item));
}
function addWarning(report, item) {
    report.warnings.push(item);
}
function addError(report, item) {
    report.errors.push(item);
    report.success = false;
}
function addUsedAsset(report, asset) {
    report.usedAssets.push(asset);
    report.summary.assetRefsResolved = (report.summary.assetRefsResolved || 0) + 1;
}
function summarize(report) {
    report.durationMs = Date.now() - (report.startedAt || Date.now());
    report.success = report.errors.length === 0 && report.operations.every((operation) => operation.success !== false);
    const _a = report, { startedAt } = _a, clean = __rest(_a, ["startedAt"]);
    return clean;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3VpLWdyYXBoL3JlcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBRUEsb0NBc0JDO0FBRUQsZ0RBS0M7QUFFRCxnQ0FFQztBQUVELDRCQUdDO0FBRUQsb0NBR0M7QUFFRCw4QkFLQztBQWxERCxTQUFnQixZQUFZLENBQUMsTUFBMkM7SUFDcEUsT0FBTztRQUNILE9BQU8sRUFBRSxJQUFJO1FBQ2IsTUFBTTtRQUNOLE9BQU8sRUFBRTtZQUNMLHFCQUFxQixFQUFFLENBQUM7WUFDeEIsWUFBWSxFQUFFLENBQUM7WUFDZixZQUFZLEVBQUUsQ0FBQztZQUNmLFVBQVUsRUFBRSxDQUFDO1lBQ2IsZUFBZSxFQUFFLENBQUM7WUFDbEIsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixZQUFZLEVBQUUsQ0FBQztZQUNmLG1CQUFtQixFQUFFLENBQUM7WUFDdEIsaUJBQWlCLEVBQUUsQ0FBQztTQUN2QjtRQUNELFVBQVUsRUFBRSxFQUFFO1FBQ2QsVUFBVSxFQUFFLEVBQUU7UUFDZCxRQUFRLEVBQUUsRUFBRTtRQUNaLE1BQU0sRUFBRSxFQUFFO1FBQ1YsVUFBVSxFQUFFLENBQUM7UUFDYixTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtLQUN4QixDQUFDO0FBQ04sQ0FBQztBQUVELFNBQWdCLGtCQUFrQixDQUFDLE1BQXlCLEVBQUUsTUFBeUI7O0lBQ25GLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztRQUFFLE1BQU0sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQzVDLElBQUksTUFBQSxNQUFNLENBQUMsTUFBTSwwQ0FBRSxNQUFNO1FBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRixJQUFJLE1BQUEsTUFBTSxDQUFDLFFBQVEsMENBQUUsTUFBTTtRQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUF5QixFQUFFLElBQXlCO0lBQzNFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFFRCxTQUFnQixRQUFRLENBQUMsTUFBeUIsRUFBRSxJQUF1QjtJQUN2RSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QixNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUMzQixDQUFDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE1BQXlCLEVBQUUsS0FBc0I7SUFDMUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25GLENBQUM7QUFFRCxTQUFnQixTQUFTLENBQXVELE1BQVM7SUFDckYsTUFBTSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ2xFLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDO0lBQ25ILE1BQU0sS0FBMEIsTUFBYSxFQUF2QyxFQUFFLFNBQVMsT0FBNEIsRUFBdkIsS0FBSyxjQUFyQixhQUF1QixDQUFnQixDQUFDO0lBQzlDLE9BQU8sS0FBMEIsQ0FBQztBQUN0QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVUlHcmFwaFRhcmdldCwgVUlFeGVjdXRpb25SZXBvcnQsIFVJT3BlcmF0aW9uUmVzdWx0LCBVSVZhbGlkYXRpb25FcnJvciwgVUlWYWxpZGF0aW9uV2FybmluZywgVUlHcmFwaEFzc2V0UmVmIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZXBvcnQodGFyZ2V0OiBVSUdyYXBoVGFyZ2V0IHwgUmVjb3JkPHN0cmluZywgYW55Pik6IFVJRXhlY3V0aW9uUmVwb3J0ICYgeyBzdGFydGVkQXQ6IG51bWJlciB9IHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0YXJnZXQsXG4gICAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgICAgIGNyZWF0ZWREZWZhdWx0VUlOb2RlczogMCxcbiAgICAgICAgICAgIGNyZWF0ZWROb2RlczogMCxcbiAgICAgICAgICAgIHJlbW92ZWROb2RlczogMCxcbiAgICAgICAgICAgIG1vdmVkTm9kZXM6IDAsXG4gICAgICAgICAgICBhZGRlZENvbXBvbmVudHM6IDAsXG4gICAgICAgICAgICByZW1vdmVkQ29tcG9uZW50czogMCxcbiAgICAgICAgICAgIHVwZGF0ZWRQcm9wczogMCxcbiAgICAgICAgICAgIGluc3RhbnRpYXRlZFByZWZhYnM6IDAsXG4gICAgICAgICAgICBhc3NldFJlZnNSZXNvbHZlZDogMFxuICAgICAgICB9LFxuICAgICAgICBvcGVyYXRpb25zOiBbXSxcbiAgICAgICAgdXNlZEFzc2V0czogW10sXG4gICAgICAgIHdhcm5pbmdzOiBbXSxcbiAgICAgICAgZXJyb3JzOiBbXSxcbiAgICAgICAgZHVyYXRpb25NczogMCxcbiAgICAgICAgc3RhcnRlZEF0OiBEYXRlLm5vdygpXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZE9wZXJhdGlvblJlc3VsdChyZXBvcnQ6IFVJRXhlY3V0aW9uUmVwb3J0LCByZXN1bHQ6IFVJT3BlcmF0aW9uUmVzdWx0KSB7XG4gICAgcmVwb3J0Lm9wZXJhdGlvbnMucHVzaChyZXN1bHQpO1xuICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHJlcG9ydC5zdWNjZXNzID0gZmFsc2U7XG4gICAgaWYgKHJlc3VsdC5lcnJvcnM/Lmxlbmd0aCkgcmVzdWx0LmVycm9ycy5mb3JFYWNoKChpdGVtKSA9PiBhZGRFcnJvcihyZXBvcnQsIGl0ZW0pKTtcbiAgICBpZiAocmVzdWx0Lndhcm5pbmdzPy5sZW5ndGgpIHJlc3VsdC53YXJuaW5ncy5mb3JFYWNoKChpdGVtKSA9PiBhZGRXYXJuaW5nKHJlcG9ydCwgaXRlbSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkV2FybmluZyhyZXBvcnQ6IFVJRXhlY3V0aW9uUmVwb3J0LCBpdGVtOiBVSVZhbGlkYXRpb25XYXJuaW5nKSB7XG4gICAgcmVwb3J0Lndhcm5pbmdzLnB1c2goaXRlbSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRFcnJvcihyZXBvcnQ6IFVJRXhlY3V0aW9uUmVwb3J0LCBpdGVtOiBVSVZhbGlkYXRpb25FcnJvcikge1xuICAgIHJlcG9ydC5lcnJvcnMucHVzaChpdGVtKTtcbiAgICByZXBvcnQuc3VjY2VzcyA9IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkVXNlZEFzc2V0KHJlcG9ydDogVUlFeGVjdXRpb25SZXBvcnQsIGFzc2V0OiBVSUdyYXBoQXNzZXRSZWYpIHtcbiAgICByZXBvcnQudXNlZEFzc2V0cy5wdXNoKGFzc2V0KTtcbiAgICByZXBvcnQuc3VtbWFyeS5hc3NldFJlZnNSZXNvbHZlZCA9IChyZXBvcnQuc3VtbWFyeS5hc3NldFJlZnNSZXNvbHZlZCB8fCAwKSArIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdW1tYXJpemU8VCBleHRlbmRzIFVJRXhlY3V0aW9uUmVwb3J0ICYgeyBzdGFydGVkQXQ/OiBudW1iZXIgfT4ocmVwb3J0OiBUKTogVUlFeGVjdXRpb25SZXBvcnQge1xuICAgIHJlcG9ydC5kdXJhdGlvbk1zID0gRGF0ZS5ub3coKSAtIChyZXBvcnQuc3RhcnRlZEF0IHx8IERhdGUubm93KCkpO1xuICAgIHJlcG9ydC5zdWNjZXNzID0gcmVwb3J0LmVycm9ycy5sZW5ndGggPT09IDAgJiYgcmVwb3J0Lm9wZXJhdGlvbnMuZXZlcnkoKG9wZXJhdGlvbikgPT4gb3BlcmF0aW9uLnN1Y2Nlc3MgIT09IGZhbHNlKTtcbiAgICBjb25zdCB7IHN0YXJ0ZWRBdCwgLi4uY2xlYW4gfSA9IHJlcG9ydCBhcyBhbnk7XG4gICAgcmV0dXJuIGNsZWFuIGFzIFVJRXhlY3V0aW9uUmVwb3J0O1xufVxuIl19
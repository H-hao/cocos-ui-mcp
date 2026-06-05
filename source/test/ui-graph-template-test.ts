import { CONTEXT_TEMPLATES } from '../ui-graph/schema';
import { validateUiGraph, validateUiPatch } from '../ui-graph/validator';

export function runUiGraphTemplateSmokeTests() {
    return {
        addLabelNodeValid: validateUiPatch(CONTEXT_TEMPLATES['patch.addLabelNode']).valid,
        createLabelPrefabValid: validateUiGraph(CONTEXT_TEMPLATES['graph.createLabelPrefab']).valid
    };
}

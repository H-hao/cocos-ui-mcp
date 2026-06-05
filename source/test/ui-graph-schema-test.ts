import { SUPPORTED_FACTORIES, SUPPORTED_OPERATIONS, UI_GRAPH_SCHEMA_VERSION, UI_GRAPH_SKILL_VERSION, UI_PATCH_SCHEMA_VERSION } from '../ui-graph/schema';
import { getSchemaHash } from '../ui-graph/schema-hash';

export function runUiGraphSchemaSmokeTests() {
    return {
        graphVersion: UI_GRAPH_SCHEMA_VERSION,
        patchVersion: UI_PATCH_SCHEMA_VERSION,
        skillVersion: UI_GRAPH_SKILL_VERSION,
        schemaHash: getSchemaHash(),
        hasLabelFactory: SUPPORTED_FACTORIES.includes('Label'),
        hasAddNodeOperation: SUPPORTED_OPERATIONS.includes('addNode')
    };
}

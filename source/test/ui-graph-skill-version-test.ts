import { UI_GRAPH_SKILL_VERSION } from '../ui-graph/schema';
import { getSchemaHash } from '../ui-graph/schema-hash';

export function runUiGraphSkillVersionSmokeTests() {
    return {
        supportedSkillVersion: UI_GRAPH_SKILL_VERSION,
        schemaHash: getSchemaHash()
    };
}

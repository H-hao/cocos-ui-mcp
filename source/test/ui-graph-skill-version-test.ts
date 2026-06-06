import * as fs from 'fs';
import * as path from 'path';
import { BUILTIN_COMPONENT_PROPS, SUPPORTED_FACTORIES, SUPPORTED_OPERATIONS, UI_GRAPH_SCHEMA_VERSION, UI_GRAPH_SKILL_VERSION, UI_PATCH_SCHEMA_VERSION } from '../ui-graph/schema';
import { getSchemaHash } from '../ui-graph/schema-hash';

export function runUiGraphSkillVersionSmokeTests() {
    const payloadPath = path.join(process.cwd(), '.agents', 'skills', 'cocos-ui-graph', 'schemas', 'schema-hash-payload.json');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    const expectedPayload = {
        graph: UI_GRAPH_SCHEMA_VERSION,
        patch: UI_PATCH_SCHEMA_VERSION,
        skill: UI_GRAPH_SKILL_VERSION,
        factories: SUPPORTED_FACTORIES,
        operations: SUPPORTED_OPERATIONS,
        components: BUILTIN_COMPONENT_PROPS
    };
    return {
        supportedSkillVersion: UI_GRAPH_SKILL_VERSION,
        schemaHash: getSchemaHash(),
        skillSchemaPayloadInSync: JSON.stringify(payload) === JSON.stringify(expectedPayload)
    };
}

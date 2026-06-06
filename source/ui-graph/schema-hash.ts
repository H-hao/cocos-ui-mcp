import { createHash } from 'crypto';
import { BUILTIN_COMPONENT_PROPS, SUPPORTED_FACTORIES, SUPPORTED_OPERATIONS, UI_GRAPH_SCHEMA_VERSION, UI_GRAPH_SKILL_VERSION, UI_PATCH_SCHEMA_VERSION } from './schema';

export function getSchemaHash(): string {
    const payload = JSON.stringify({
        graph: UI_GRAPH_SCHEMA_VERSION,
        patch: UI_PATCH_SCHEMA_VERSION,
        skill: UI_GRAPH_SKILL_VERSION,
        factories: SUPPORTED_FACTORIES,
        operations: SUPPORTED_OPERATIONS,
        components: BUILTIN_COMPONENT_PROPS
    });
    return `sha256:${createHash('sha256').update(payload).digest('hex')}`;
}

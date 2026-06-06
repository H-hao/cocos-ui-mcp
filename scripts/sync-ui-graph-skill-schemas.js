#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { uiGraphSchema, uiPatchSchema, UI_GRAPH_SCHEMA_VERSION, UI_PATCH_SCHEMA_VERSION, UI_GRAPH_SKILL_VERSION, SUPPORTED_FACTORIES, SUPPORTED_OPERATIONS, BUILTIN_COMPONENT_PROPS } = require('../dist/ui-graph/schema.js');

const root = path.resolve(__dirname, '..');
const schemaDir = path.join(root, '.agents', 'skills', 'cocos-ui-graph', 'schemas');
fs.mkdirSync(schemaDir, { recursive: true });

function toJsonSafe(value) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(value, (key, item) => {
    if (item && typeof item === 'object') {
      if (seen.has(item)) return { type: 'object', description: 'Recursive UI Graph node.' };
      seen.add(item);
    }
    return item;
  }));
}

function writeJson(file, value) {
  fs.writeFileSync(path.join(schemaDir, file), `${JSON.stringify(toJsonSafe(value), null, 2)}\n`);
}

writeJson('ui-graph-v0.1.schema.json', uiGraphSchema);
writeJson('ui-patch-v0.1.schema.json', uiPatchSchema);
writeJson('schema-hash-payload.json', {
  graph: UI_GRAPH_SCHEMA_VERSION,
  patch: UI_PATCH_SCHEMA_VERSION,
  skill: UI_GRAPH_SKILL_VERSION,
  factories: SUPPORTED_FACTORIES,
  operations: SUPPORTED_OPERATIONS,
  components: BUILTIN_COMPONENT_PROPS,
});

console.log(`Synced UI Graph skill schemas into ${path.relative(root, schemaDir)}`);

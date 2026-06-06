import { runUiGraphSchemaSmokeTests } from './ui-graph-schema-test';
import { runUiGraphSkillVersionSmokeTests } from './ui-graph-skill-version-test';
import { runUiGraphTemplateSmokeTests } from './ui-graph-template-test';
import { runUiGraphValidatorSmokeTests } from './ui-graph-validator-test';

function assertTrue(name: string, value: boolean) {
    if (!value) throw new Error(`UI Graph smoke test failed: ${name}`);
}

export function runUiGraphSmokeTestSuite() {
    const validator = runUiGraphValidatorSmokeTests();
    const schema = runUiGraphSchemaSmokeTests();
    const templates = runUiGraphTemplateSmokeTests();
    const skill = runUiGraphSkillVersionSmokeTests();

    assertTrue('valid patch passes', validator.validPatchPasses);
    assertTrue('unknown prop blocked', validator.unknownPropBlocked);
    assertTrue('unknown operation blocked', validator.unknownOperationBlocked);
    assertTrue('forbidden field blocked', validator.forbiddenFieldBlocked);
    assertTrue('Label factory supported', schema.hasLabelFactory);
    assertTrue('addNode operation supported', schema.hasAddNodeOperation);
    assertTrue('add-label-node template valid', templates.addLabelNodeValid);
    assertTrue('create-label-prefab template valid', templates.createLabelPrefabValid);
    assertTrue('skill hash generated', skill.schemaHash.startsWith('sha256:'));
    assertTrue('skill schema hash payload in sync', skill.skillSchemaPayloadInSync);

    return { validator, schema, templates, skill };
}

if (require.main === module) {
    console.log(JSON.stringify(runUiGraphSmokeTestSuite(), null, 2));
}

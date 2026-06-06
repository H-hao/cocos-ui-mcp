import { validateUiGraph, validateUiPatch } from '../ui-graph/validator';
import { UI_GRAPH_SCHEMA_VERSION, UI_PATCH_SCHEMA_VERSION } from '../ui-graph/schema';

export function runUiGraphValidatorSmokeTests() {
    const validPatch = validateUiPatch({
        schemaVersion: UI_PATCH_SCHEMA_VERSION,
        target: { type: 'prefab', path: 'db://assets/ui/MainPanel.prefab' },
        operations: [{ op: 'addNode', parent: { path: 'MainPanel' }, node: { name: 'TitleLabel', factory: 'Node', components: [{ type: 'Label', props: { string: 'Title', fontSize: 55 } }] } }]
    });
    const invalidProp = validateUiPatch({
        schemaVersion: UI_PATCH_SCHEMA_VERSION,
        target: { type: 'prefab', path: 'db://assets/ui/MainPanel.prefab' },
        operations: [{ op: 'setComponentProps', target: { path: 'MainPanel/TitleLabel' }, componentType: 'Label', props: { font_size: 55 } }]
    });
    const invalidOperation = validateUiPatch({
        schemaVersion: UI_PATCH_SCHEMA_VERSION,
        target: { type: 'prefab', path: 'db://assets/ui/MainPanel.prefab' },
        operations: [{ op: 'setFontSize', target: { path: 'MainPanel/TitleLabel' }, componentType: 'Label', props: { fontSize: 55 } }]
    });
    const invalidField = validateUiGraph({
        schemaVersion: UI_GRAPH_SCHEMA_VERSION,
        target: { type: 'prefab', path: 'db://assets/ui/LabelExample.prefab' },
        id: 'forbidden',
        root: { name: 'LabelExample', factory: 'Node' }
    });
    const scriptArrayProp = validateUiPatch({
        schemaVersion: UI_PATCH_SCHEMA_VERSION,
        target: { type: 'prefab', path: 'db://assets/ui/MainPanel.prefab' },
        operations: [{ op: 'addComponent', target: { path: 'MainPanel' }, component: { type: 'script:InventoryPresenter', props: { items: [] } } }]
    });
    const prefabOverrideUnlink = validateUiPatch({
        schemaVersion: UI_PATCH_SCHEMA_VERSION,
        target: { type: 'scene', current: true },
        operations: [{ op: 'setPrefabInstanceOverride', target: { path: 'Canvas/DialogInstance' }, overrides: { unlink: true, nodeProps: { active: true } } }]
    });
    const moveWithoutParent = validateUiPatch({
        schemaVersion: UI_PATCH_SCHEMA_VERSION,
        target: { type: 'scene', current: true },
        operations: [{ op: 'moveNode', target: { path: 'Canvas/A' } }]
    });
    return {
        validPatchPasses: validPatch.valid,
        unknownPropBlocked: invalidProp.errors.some((item) => item.code === 'UNKNOWN_COMPONENT_PROP'),
        unknownOperationBlocked: invalidOperation.errors.some((item) => item.code === 'UNKNOWN_PATCH_OPERATION'),
        forbiddenFieldBlocked: invalidField.errors.some((item) => item.code === 'FORBIDDEN_FIELD' || item.code === 'UNKNOWN_FIELD'),
        scriptArrayPropBlocked: scriptArrayProp.errors.some((item) => item.code === 'UNSUPPORTED_SCRIPT_PROP_TYPE'),
        prefabOverrideUnlinkBlocked: prefabOverrideUnlink.errors.some((item) => item.code === 'FORBIDDEN_PREFAB_OVERRIDE'),
        moveRequiresParent: moveWithoutParent.errors.some((item) => item.code === 'NEW_PARENT_REQUIRED')
    };
}

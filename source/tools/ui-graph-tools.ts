import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { exportUiGraph, inspectUiGraph } from '../ui-graph/exporter';
import { applyUiPatch, generatePrefabFromGraph, instantiatePrefabToScene } from '../ui-graph/executor';
import { resolveAssets } from '../ui-graph/resolver';
import { BUILTIN_COMPONENT_PROPS, CONTEXT_TEMPLATES, SUPPORTED_FACTORIES, SUPPORTED_OPERATIONS, UI_GRAPH_PLUGIN_VERSION, UI_GRAPH_SCHEMA_VERSION, UI_GRAPH_SKILL_VERSION, UI_PATCH_SCHEMA_VERSION, uiGraphSchema, uiGraphToolInputSchemas, uiPatchSchema } from '../ui-graph/schema';
import { getSchemaHash } from '../ui-graph/schema-hash';
import { validateUiGraph, validateUiPatch, validateUiPayload } from '../ui-graph/validator';

function getEditor(): any {
    return (globalThis as any).Editor;
}

export class UiGraphTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            { name: 'get_project_ui_context', description: 'Get lightweight UI Graph project context, schema versions/hash, supported operations, factories, components, and requested templates.', inputSchema: uiGraphToolInputSchemas.get_project_ui_context },
            { name: 'inspect_ui_graph', description: 'Inspect a Prefab or Scene UI hierarchy summary before creating a patch.', inputSchema: uiGraphToolInputSchemas.target_query },
            { name: 'export_ui_graph', description: 'Export a Prefab or Scene UI hierarchy as sparse UI Graph JSON.', inputSchema: uiGraphToolInputSchemas.target_query },
            { name: 'validate_ui_graph', description: 'Validate UI Graph or UI Patch JSON and return structured errors/warnings. Writing tools run this again internally.', inputSchema: uiGraphToolInputSchemas.validate_ui_graph },
            { name: 'generate_prefab_from_graph', description: 'Validate a UI Graph and generate a Cocos UI Prefab at outputPath.', inputSchema: uiGraphToolInputSchemas.generate_prefab_from_graph },
            { name: 'apply_ui_patch', description: 'Validate and apply ordered UI Patch operations to an existing Prefab or Scene target.', inputSchema: uiGraphToolInputSchemas.apply_ui_patch },
            { name: 'instantiate_prefab_to_scene', description: 'Instantiate a Prefab asset into a Scene UI parent and return a structured report.', inputSchema: uiGraphToolInputSchemas.instantiate_prefab_to_scene },
            { name: 'resolve_assets', description: 'Resolve UI asset references by db:// path or uuid and check expected asset types.', inputSchema: uiGraphToolInputSchemas.resolve_assets }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_project_ui_context':
                return { success: true, data: await this.getProjectUiContext(args || {}) };
            case 'inspect_ui_graph':
                return { success: true, data: await inspectUiGraph(args.target, args.maxDepth ?? 4, args.includeComponents !== false) };
            case 'export_ui_graph':
                return { success: true, data: await exportUiGraph(args.target, args.sparse !== false) };
            case 'validate_ui_graph': {
                const result = validateUiPayload({ graph: args.graph, patch: args.patch });
                return { success: result.valid, data: result, error: result.valid ? undefined : result.errors.map((item) => item.message).join('; ') };
            }
            case 'generate_prefab_from_graph': {
                const report = await generatePrefabFromGraph(args.graph, args.outputPath, Boolean(args.overwrite));
                return { success: report.success, data: report, error: report.success ? undefined : report.errors.map((item) => item.message).join('; ') };
            }
            case 'apply_ui_patch': {
                const report = await applyUiPatch(args.patch);
                return { success: report.success, data: report, error: report.success ? undefined : report.errors.map((item) => item.message).join('; ') };
            }
            case 'instantiate_prefab_to_scene': {
                const report = await instantiatePrefabToScene(args.scene || { type: 'scene', current: true }, args.prefab, args.parent, args.props || {});
                return { success: report.success, data: report, error: report.success ? undefined : report.errors.map((item) => item.message).join('; ') };
            }
            case 'resolve_assets':
                return { success: true, data: await resolveAssets(args.assets || []) };
            default:
                throw new Error(`Unknown UI Graph tool: ${toolName}`);
        }
    }

    private async getProjectUiContext(args: any): Promise<any> {
        const editor = getEditor();
        let currentScene: any = null;
        let cocosVersion = 'unknown';
        try {
            if (editor?.Message?.request) {
                currentScene = await editor.Message.request('scene', 'query-current-scene');
                const projectInfo = await editor.Message.request('builder', 'query-project-info').catch(() => null);
                cocosVersion = projectInfo?.engine || projectInfo?.version || 'unknown';
            }
        } catch {
            currentScene = null;
        }

        const componentNames = Array.isArray(args.components) && args.components.length ? args.components : Object.keys(BUILTIN_COMPONENT_PROPS);
        const supportedComponents: any = Object.fromEntries(componentNames
            .filter((name: string) => BUILTIN_COMPONENT_PROPS[name])
            .map((name: string) => [name, args.includeComponentProps ? { props: BUILTIN_COMPONENT_PROPS[name] } : { propCount: BUILTIN_COMPONENT_PROPS[name].length }]));
        const templateNames = Array.isArray(args.templateNames) ? args.templateNames : [];
        const templates = args.includeTemplates
            ? Object.fromEntries(templateNames.filter((name: string) => CONTEXT_TEMPLATES[name]).map((name: string) => [name, CONTEXT_TEMPLATES[name]]))
            : undefined;

        return {
            pluginVersion: UI_GRAPH_PLUGIN_VERSION,
            schemaVersions: { graph: UI_GRAPH_SCHEMA_VERSION, patch: UI_PATCH_SCHEMA_VERSION },
            schemaHash: getSchemaHash(),
            supportedSkillVersion: UI_GRAPH_SKILL_VERSION,
            cocosVersion,
            projectPath: editor?.Project?.path || '',
            currentScene,
            supportedFactories: SUPPORTED_FACTORIES,
            supportedOperations: SUPPORTED_OPERATIONS,
            supportedComponents,
            schemas: args.detailLevel === 'schema' ? { graph: uiGraphSchema, patch: uiPatchSchema } : undefined,
            templates
        };
    }
}

export { validateUiGraph, validateUiPatch };

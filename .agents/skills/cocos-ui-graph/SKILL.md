# cocos-ui-graph

Use this skill when creating or modifying Cocos Creator UI through the UI Graph MCP production line.

## Required workflow

1. Prefer UI Graph high-level MCP tools over legacy scene/node/component/prefab tools.
2. Before modifying existing Prefab or Scene resources, call `uiGraph_inspect_ui_graph` or `uiGraph_export_ui_graph` first.
3. Do not guess node paths, component property names, script fields, or asset paths. Resolve them with inspect/export/context/resolve tools.
4. Call `uiGraph_get_project_ui_context` and compare its `schemaHash` with this skill's schema hash using `scripts/check_version.py`.
5. Generate Graph/Patch JSON with the scripts in `scripts/` whenever possible.
6. Before writing, call `uiGraph_validate_ui_graph`.
7. If validation returns any error, do not call write tools. Fix the JSON and validate again.

## Supported protocol

- Graph: `ui-graph/v0.1`
- Patch: `ui-patch/v0.1`
- Skill: `cocos-ui-graph-skill/v0.1`

首期不使用 `dryRun`、`diff`、`confirmWrite`、`backup`、`rollback` 或 metadata `id` 字段。

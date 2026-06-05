# UI Graph 生产线完整交付开发计划

> 本文基于 `pipeline-goal.md`、`docs/ui-graph-pipeline-implementation-spec.md` 以及前置 10 个需求议题与 JSON 规范讨论结论整理，作为后续完整交付实现的开发计划。本文聚焦“从规范到完整交付”的任务拆解、实现顺序与验收标准。

## 1. 已固化的关键决策

- 首期按 **Cocos Creator 3.8.x** 实现。
- 默认只暴露 UI Graph 高层工具，legacy 工具保留但默认关闭。
- 节点匹配不写 metadata id；修改既有节点只支持 `uuid > path > name`。
- 默认 UI 控件创建优先复用编辑器能力，失败时按 3.8.x 结构 fallback。
- Prefab instance override 支持实例根节点、子节点、子组件属性覆盖。
- 自定义脚本组件支持基础 JSON 属性、节点引用、组件引用、资源引用；数组和自定义类型暂不考虑。
- 动态内容只描述规则，不生成 editor preview 节点。
- 首期不做 dry-run、diff、confirmWrite、backup、rollback。
- AI 交互 JSON 固化为 Graph / Patch / Report。
- 防 AI 乱写采用：官方 Skill + 轻量 `get_project_ui_context` + schema/hash/version + validator + 执行前二次校验。

## 2. 完整交付开发计划

### 2.1 协议与 Schema 基础层

当前需求已经确定 Graph、Patch、Report 的方向，但要进入实现，需要先把文档里的 TypeScript-like 结构落成真正可复用的类型、schema 常量和错误码体系。

#### 任务：落地 UI Graph/Patch/Report 类型与 JSON Schema

新增 `source/ui-graph/types.ts`，定义以下类型：

- `UIGraph`
- `UIGraphTarget`
- `UIGraphNode`
- `UIGraphComponent`
- `UIGraphAssetRef`
- `UIPatch`
- `UIPatchOperation`
- `NodeRef`
- `UIExecutionReport`
- `UIValidationResult`
- `UIValidationError`
- `UIValidationWarning`

新增 `source/ui-graph/schema.ts`，导出 Graph v0.1、Patch v0.1、Tool Input、Report 相关 JSON Schema。

Schema 要体现已确认规则：

- `schemaVersion` 必填。
- Graph 固定 `ui-graph/v0.1`。
- Patch 固定 `ui-patch/v0.1`。
- 禁止 `dryRun`、`diff`、`confirmWrite`、`backup`、`rollback` 字段。
- `NodeRef` 只允许 `uuid`、`path`、`name`。
- 不允许 `id`。
- operation 使用 enum。
- factory 使用 enum。
- 内置组件使用短名，例如 `Label`、`Sprite`、`UITransform`。
- 尽量使用 `additionalProperties: false`，但组件 `props` 内部由组件属性白名单校验器负责。

### 2.2 Validator 强校验层

只靠 Skill 或文档不能阻止 AI 乱写 JSON。插件必须有 validator，并且写入型工具内部也必须强制调用 validator。

#### 任务：实现 UI Graph/Patch 强校验器

新增 `source/ui-graph/validator.ts`。

实现能力：

1. 校验 Graph 顶层结构。
2. 校验 Patch 顶层结构。
3. 校验 `schemaVersion`。
4. 校验 `target`。
5. 校验 `NodeRef` 至少包含 `uuid`、`path`、`name` 之一。
6. 校验 `operation.op` 是否属于白名单。
7. 校验 `factory` 是否属于白名单。
8. 校验组件类型是否属于支持组件或可识别脚本组件。
9. 校验内置组件属性白名单，例如：
   - `Label.string`
   - `Label.fontSize`
   - `UITransform.contentSize`
   - `Sprite.spriteFrame`
   - `Button.interactable`
10. 禁止未知字段。
11. 对 `cc.Label`、`cc.Sprite` 等别名做可解释归一化，但不要静默修复属性拼写错误。
12. 返回结构化错误，包含：
    - `code`
    - `path`
    - `message`
    - `suggestion`

写入工具 `generate_prefab_from_graph`、`apply_ui_patch`、`instantiate_prefab_to_scene` 内部必须再次调用 validator，非法 JSON 不执行。

### 2.3 Context / Schema Summary 层

`get_project_ui_context` 不能每次返回完整大 schema，否则会浪费 token。应做成轻量默认、按需展开。

#### 任务：实现轻量可展开的 UI Graph 项目上下文工具

新增或实现 `source/tools/ui-graph-tools.ts` 中的 `get_project_ui_context`。

默认输入：

```json
{
  "detailLevel": "summary",
  "includeTemplates": false,
  "includeComponentProps": false
}
```

默认返回：

- `pluginVersion`
- `schemaVersions.graph`
- `schemaVersions.patch`
- `schemaHash`
- `supportedSkillVersion`
- `cocosVersion`
- `projectPath`
- `currentScene`
- `supportedFactories`
- `supportedOperations`
- `supportedComponents` 摘要

按需支持：

```json
{
  "includeComponentProps": true,
  "components": ["Label", "UITransform"]
}
```

以及：

```json
{
  "includeTemplates": true,
  "templateNames": ["patch.addLabelNode"]
}
```

返回模板时只返回请求的模板，避免一次性返回所有 schema 和示例导致 token 膨胀。

### 2.4 官方 Skill 与脚本生成器

为了进一步降低 AI 手写 JSON 的概率，本项目应直接提供官方 Skill。Skill 用来指导 AI 工作流、提供模板、生成脚本和本地预校验。

#### 任务：新增官方 cocos-ui-graph Skill 与 JSON 生成脚本

新增 Skill 目录，建议路径：

- `.agents/skills/cocos-ui-graph/`
  或
- `skills/cocos-ui-graph/`

Skill 内容包括：

- `SKILL.md`
- `schemas/ui-graph-v0.1.schema.json`
- `schemas/ui-patch-v0.1.schema.json`
- `templates/add-label-node.patch.json`
- `templates/create-label-prefab.graph.json`
- `templates/instantiate-prefab.json`
- `scripts/make_patch.py`
- `scripts/make_graph.py`
- `scripts/validate_payload.py`
- `scripts/check_version.py`

`SKILL.md` 要明确要求 AI：

1. 优先使用 UI Graph 工具。
2. 修改已有资源前先 inspect/export。
3. 不凭空猜节点 path、组件属性、资源路径。
4. 使用 `get_project_ui_context` 的 schemaHash 与 Skill schemaHash 比对。
5. 使用脚本生成 Graph/Patch。
6. 写入前调用 `uiGraph_validate_ui_graph`。
7. validate 有 error 时禁止调用写入工具。

脚本至少支持生成：

```bash
python scripts/make_patch.py add-label-node \
  --target db://assets/ui/MainPanel.prefab \
  --parent MainPanel \
  --name TitleLabel \
  --text Title \
  --font-size 55
```

并输出符合 `ui-patch/v0.1` 的 JSON。

### 2.5 版本与 Schema Hash 机制

为了避免 Skill 与插件版本不一致，需要引入版本对齐机制。

#### 任务：实现插件协议版本与 Skill 版本对齐机制

在 `source/ui-graph/schema.ts` 中定义：

- `UI_GRAPH_SCHEMA_VERSION = "ui-graph/v0.1"`
- `UI_PATCH_SCHEMA_VERSION = "ui-patch/v0.1"`
- `UI_GRAPH_SKILL_VERSION = "cocos-ui-graph-skill/v0.1"`

实现 schema hash 生成逻辑，可放在：

- `source/ui-graph/schema-hash.ts`

`uiGraph_get_project_ui_context` 返回：

```json
{
  "pluginVersion": "...",
  "supportedSkillVersion": "cocos-ui-graph-skill/v0.1",
  "schemaVersions": {
    "graph": "ui-graph/v0.1",
    "patch": "ui-patch/v0.1"
  },
  "schemaHash": "sha256:..."
}
```

Skill 脚本 `check_version.py` 读取本地 schema hash，并与插件返回的 `schemaHash` 比对。

如果不一致：

1. 提示 AI 调用 `get_project_ui_context` 拉取最新 summary。
2. 提示用户更新 Skill 或插件。
3. 不允许静默继续生成旧协议 JSON。

### 2.6 工具注册与默认暴露策略

需要把 UI Graph 工具接入现有 MCP Server，并调整默认工具暴露策略。

#### 任务：注册 UI Graph 高层工具并默认隐藏 legacy 工具

新增 `source/tools/ui-graph-tools.ts`，实现 `getTools()` 和 `execute()`。

工具列表包括：

- `get_project_ui_context`
- `inspect_ui_graph`
- `export_ui_graph`
- `validate_ui_graph`
- `generate_prefab_from_graph`
- `apply_ui_patch`
- `instantiate_prefab_to_scene`
- `resolve_assets`

修改 `source/mcp-server.ts`：

- 初始化 `uiGraph` 工具分类。
- 允许 MCP 工具名以 `uiGraph_` 前缀暴露。
- 执行工具时路由到 `UiGraphTools.execute()`。

修改 `source/tools/tool-manager.ts`：

- 新项目或无配置时默认启用 `uiGraph` 分类。
- 默认禁用 `scene`、`node`、`component`、`prefab` 等 legacy 细粒度工具。
- 保留面板中手动启用 legacy 工具的能力。

### 2.7 Resolver 层

所有 Patch、资源引用、脚本引用、Prefab instance override 都依赖 resolver。Resolver 是防止 AI 猜 path 后错误执行的核心。

#### 任务：实现目标、节点、组件、资源引用解析器

新增 `source/ui-graph/resolver.ts`。

实现：

1. `resolveTarget(target)`
   - prefab path/uuid
   - scene path/uuid/current
   - node target

2. `resolveNodeRef(root, ref)`
   - 按 `uuid > path > name`
   - `name` 多匹配时报 `AMBIGUOUS_NODE_NAME`
   - 找不到时报 `NODE_NOT_FOUND`

3. `resolveComponent(node, componentType)`
   - 支持短名
   - 兼容 `cc.Label` 等别名并归一化
   - 找不到时报 `COMPONENT_NOT_FOUND`

4. `resolveAsset(assetRef)`
   - 优先 `db://` path
   - 解析 uuid
   - 校验资源类型
   - 缺失时报 `ASSET_NOT_FOUND`
   - 类型不匹配时报 `ASSET_TYPE_MISMATCH`

5. `resolveScriptReference`
   - 节点引用按 `uuid > path > name`
   - 组件引用先解析节点再查组件
   - 资源引用走 asset resolver

### 2.8 Inspect / Export 只读能力

AI 修改既有资源前必须能查询结构。Inspect 返回摘要，Export 返回完整 Graph。

#### 任务：实现 UI 层级 inspect 与 Graph export

新增 `source/ui-graph/exporter.ts`。

实现：

1. `inspect_ui_graph`
   - 输入 target、maxDepth、includeComponents。
   - 返回节点摘要：
     - name
     - uuid
     - path
     - active
     - components
     - UITransform 尺寸
     - position
     - children summary

2. `export_ui_graph`
   - 输入 target、sparse。
   - 返回完整 `UIGraph`。
   - 只导出非默认值。
   - 导出组件短名。
   - 导出资源引用时同时给出 path 和 uuid。
   - 不写 metadata id。
   - 对暂不支持字段写入 `warnings` 或 `unsupported`。

3. Scene 导出只聚焦 UI 相关节点。
   - Canvas
   - UIRoot
   - PageLayer
   - PopupLayer
   - OverlayLayer

### 2.9 默认 UI Factory

默认 UI 控件创建需要区分 “factory 创建默认控件节点” 和 “addComponent 给已有节点加组件”。

#### 任务：实现默认 UI 控件工厂

新增 `source/ui-graph/default-ui-factory.ts`。

实现 `createDefaultUINode(factory, options)`。

支持：

- `Node`
- `Sprite`
- `Label`
- `Button`
- `Toggle`
- `Slider`
- `ScrollView`
- `PageView`
- `PageViewIndicator`
- `ProgressBar`

规则：

1. 优先调用 Cocos 编辑器已有默认 UI 创建能力。
2. 如果不可用，按 Cocos Creator 3.8.x 默认结构手动创建。
3. fallback 时 Report warning：`FALLBACK_DEFAULT_UI_FACTORY`。
4. `factory` 创建的默认组件可以被同节点 `components` 中同类型 props 覆盖。
5. `addComponent` 不得隐式创建默认 UI 子结构。
6. Report 中分别统计：
   - `createdDefaultUINodes`
   - `addedComponents`

### 2.10 Prefab 生成执行器

Graph 到 Prefab 是核心交付能力。首期直接写入，不做 dry-run/diff/confirmWrite/backup/rollback。

#### 任务：实现 Graph 生成 UI Prefab

新增 `source/ui-graph/executor.ts`。

实现 `generatePrefabFromGraph(graph, outputPath, overwrite)`。

执行流程：

1. 内部调用 validator。
2. 检查 outputPath。
3. 如果存在且 `overwrite=false`，返回 validation error。
4. 创建根节点。
5. 递归创建 children。
6. 根据 `factory` 创建节点。
7. 添加/配置组件。
8. 解析并设置资源引用。
9. 绑定事件。
10. 保存为 Prefab。
11. 返回 `UIExecutionReport`。

首期要求支持：

- Node
- UITransform
- Sprite
- Label
- Button
- Widget
- Layout

并至少完成 Label 示例闭环：

- 创建节点
- 添加 Label
- 设置 `fontSize = 55`
- 保存 Prefab
- Report 成功。

### 2.11 Patch 执行器

Patch 用于修改已有 Prefab、Scene 或节点。操作按顺序执行，失败写入 Report。

#### 任务：实现 UI Patch 执行器

在 `source/ui-graph/executor.ts` 中实现 `applyUiPatch(patch)`。

支持 operation：

- `addNode`
- `removeNode`
- `moveNode`
- `setNodeProps`
- `addComponent`
- `removeComponent`
- `setComponentProps`
- `setAssetRef`
- `setEventBindings`
- `instantiatePrefab`
- `setPrefabInstanceOverride`

执行规则：

1. 内部调用 validator。
2. 按 `operations` 顺序执行。
3. 每个 operation 记录到 `report.operations`。
4. 前一个 operation 新增节点后，后续 operation 可以通过 path 引用。
5. 不做事务和回滚。
6. 失败时继续或停止的策略需要固定：
   - 建议默认 required operation 失败则停止。
   - `ifMissing: "ignore"` 的 remove 可跳过。
7. 所有失败必须有 `code/path/message/suggestion`。

### 2.12 Prefab Instance Override

已确认首期要支持实例根节点、子节点、子组件属性覆盖。

#### 任务：实现 Prefab instance override 属性覆盖

在 `source/ui-graph/executor.ts` 和 `source/ui-graph/resolver.ts` 中实现 `setPrefabInstanceOverride`。

支持：

1. 实例根节点属性覆盖：
   - name
   - active
   - position
   - scale
   - size

2. 实例内部子节点属性覆盖：
   - active
   - position
   - size
   - name

3. 实例内部子组件属性覆盖：
   - `Label.string`
   - `Label.fontSize`
   - `Sprite.spriteFrame`
   - `Button.interactable`
   - `Widget` 基础属性
   - `Layout` 基础属性

实现要求：

- 明确 instance root。
- 子节点 path 可以是实例根节点下的相对路径。
- 不能修改源 Prefab。
- 不能 unlink Prefab。
- 不支持新增/删除 Prefab 实例内部原有节点。
- 不支持添加/删除 Prefab 实例内部组件。
- 不支持 apply/revert override。
- 不支持复杂数组 override。

### 2.13 自定义脚本组件支持

首期不完整解析自定义类型和数组，但需要支持基础属性与引用。

#### 任务：实现自定义脚本组件基础属性与引用写入

在 `source/ui-graph/validator.ts`、`source/ui-graph/resolver.ts`、`source/ui-graph/executor.ts` 中支持自定义脚本组件。

支持：

1. 挂载脚本组件。
2. 设置基础 JSON 属性：
   - string
   - number
   - boolean
   - null
   - plain object

3. 设置节点引用：
   - `{ "node": { "path": "MainPanel/Content" } }`

4. 设置组件引用：
   - `{ "node": { "path": "MainPanel/TitleLabel" }, "componentType": "Label" }`

5. 设置资源引用：
   - `{ "asset": { "path": "db://assets/ui/Item.prefab", "type": "Prefab" } }`

暂不支持：

- 数组
- 自定义 class
- 复杂 Cocos 类型
- 自动猜字段类型

遇到不支持字段返回：

- `UNSUPPORTED_SCRIPT_PROP_TYPE`
- `SCRIPT_PROP_SCHEMA_UNKNOWN`

### 2.14 动态内容规则

首期只描述动态内容规则，不生成 editor preview 节点。

#### 任务：实现 dynamicContent 描述但不生成预览节点

在 `source/ui-graph/types.ts` 中定义 `UIGraphDynamicContent`。

支持字段：

- `containerRole`
- `dataSource`
- `itemPrefab`
- `bindingScript`

在 validator 中：

- 接受 `dynamicContent`。
- 如果输入包含 `editorPreview`，返回 warning：
  - `EDITOR_PREVIEW_NOT_SUPPORTED_IN_V1`

在 executor 中：

- 不生成任何预览节点。
- 只设置容器、脚本或资源引用规则。

### 2.15 Report 与错误体系

Report 是 AI 自动修正的基础。必须结构化、稳定、可定位。

#### 任务：实现统一执行报告与错误码体系

新增 `source/ui-graph/report.ts`。

实现：

1. `createReport(target)`
2. `addOperationResult`
3. `addWarning`
4. `addError`
5. `summarize`

Report 包含：

- `success`
- `target`
- `summary`
- `operations`
- `usedAssets`
- `warnings`
- `errors`
- `durationMs`

错误结构包含：

- `code`
- `path`
- `message`
- `suggestion`

首期错误码至少包括：

- `UNSUPPORTED_SCHEMA_VERSION`
- `UNKNOWN_PATCH_OPERATION`
- `UNKNOWN_COMPONENT_TYPE`
- `UNKNOWN_COMPONENT_PROP`
- `INVALID_PROP_TYPE`
- `NODE_NOT_FOUND`
- `AMBIGUOUS_NODE_NAME`
- `COMPONENT_NOT_FOUND`
- `ASSET_NOT_FOUND`
- `ASSET_TYPE_MISMATCH`
- `UNSUPPORTED_SCRIPT_PROP_TYPE`
- `EDITOR_PREVIEW_NOT_SUPPORTED_IN_V1`
- `UNSUPPORTED_PREFAB_OVERRIDE`

### 2.16 Asset Resolver

UI 生产线常用资源引用必须可靠解析。

#### 任务：实现 UI Graph 资源解析工具

在 `source/ui-graph/resolver.ts` 中实现资源解析，并在 `source/tools/ui-graph-tools.ts` 中暴露 `resolve_assets`。

支持资源类型：

- `SpriteFrame`
- `Prefab`
- `Material`
- `Script`

输入支持：

```json
{
  "assets": [
    {
      "path": "db://assets/textures/icon/sword.spriteframe",
      "type": "SpriteFrame"
    }
  ]
}
```

返回：

- `path`
- `uuid`
- `type`
- `exists`
- `typeMatched`
- `errors`
- `warnings`

执行器设置资源前必须调用 resolver。

### 2.17 Scene 实例化

Scene 能力首期主要用于将 Prefab 挂到指定 UI 层级。

#### 任务：实现 Prefab 实例化到 Scene

在 `source/ui-graph/executor.ts` 中实现 `instantiatePrefabToScene(scene, prefab, parent, props)`。

能力：

1. 解析 scene：
   - current
   - path
   - uuid

2. 解析 prefab：
   - path
   - uuid
   - type=Prefab

3. 解析 parent：
   - uuid
   - path
   - name

4. 实例化 Prefab 到 parent 下。

5. 设置实例根节点属性：
   - name
   - active
   - position
   - scale
   - size

6. 返回 Report：
   - 实例节点 uuid
   - 实例节点 path
   - 使用资源
   - warnings
   - errors

### 2.18 面板与工具管理体验

需要让用户能看到 UI Graph 工具被默认启用，legacy 默认关闭。

#### 任务：更新面板工具管理以支持 UI Graph 默认配置

修改 `panel-ui` 相关工具管理展示逻辑，使 UI Graph 工具分类清晰展示。

涉及文件可能包括：

- `panel-ui/src/composables/useToolManager.ts`
- `panel-ui/src/components/ToolsCategoryList.vue`
- `panel-ui/src/components/ToolsOverview.vue`

要求：

1. UI Graph 分类显示为主工具组。
2. legacy 分类默认禁用。
3. 用户可以手动启用 legacy 工具。
4. 面板中展示当前 schemaVersion 和 schemaHash。
5. 面板中展示 Skill 版本匹配状态。

### 2.19 测试与自测

完整交付必须有自动化与 Cocos 编辑器内手工自测。

#### 任务：补充 UI Graph 自动化和编辑器自测用例

新增测试文件，建议：

- `source/test/ui-graph-schema-test.ts`
- `source/test/ui-graph-validator-test.ts`
- `source/test/ui-graph-template-test.ts`
- `source/test/ui-graph-skill-version-test.ts`

自动化检查：

1. `npm run build:ts`
2. `npm run build:panel`
3. `npm run build`
4. Schema snapshot 测试
5. Validator 测试：
   - 正确 Label Patch 通过
   - `font_size` 报 `UNKNOWN_COMPONENT_PROP`
   - `setFontSize` 报 `UNKNOWN_PATCH_OPERATION`
   - `id` 报未知字段
   - `dryRun` / `confirmWrite` 报未知字段
   - name 多匹配报 `AMBIGUOUS_NODE_NAME`

编辑器内自测：

1. 面板打开。
2. MCP Server 启动。
3. MCP Client tools/list 只看到 UI Graph 高层工具。
4. `get_project_ui_context` 返回 schemaHash。
5. Skill 脚本生成 add-label-node patch。
6. `validate_ui_graph` 通过。
7. `generate_prefab_from_graph` 生成 Label Prefab。
8. `apply_ui_patch` 给已有 Prefab 新增 Label 字号 55。
9. `instantiate_prefab_to_scene` 挂载 Prefab 到 Canvas/PageLayer。

## 3. 推荐开发顺序

### 3.1 第一阶段：协议闭环

1. types/schema
2. validator
3. report
4. schemaHash
5. Skill 初版

目标：AI JSON 不再靠猜。

### 3.2 第二阶段：只读闭环

1. get_project_ui_context
2. resolve_assets
3. inspect_ui_graph
4. export_ui_graph

目标：AI 能知道当前项目与目标结构。

### 3.3 第三阶段：写入闭环

1. default-ui-factory
2. generate_prefab_from_graph
3. apply_ui_patch
4. instantiate_prefab_to_scene

目标：能真实创建、修改、实例化。

### 3.4 第四阶段：高级能力

1. Prefab instance override
2. 自定义脚本引用
3. dynamicContent
4. 面板展示
5. Skill 脚本完善

目标：满足完整 UI 生产线需求。

### 3.5 第五阶段：测试与验收

1. 自动化 schema/validator 测试
2. Cocos 编辑器内手工测试
3. Skill 版本匹配测试
4. 典型 UI 生产案例测试

## 4. 最小完整交付验收标准

完整交付应至少满足：

1. AI 默认只看到 UI Graph 高层工具。
2. `get_project_ui_context` 返回 schemaVersion、schemaHash、Skill 版本、组件/operation 摘要。
3. 官方 Skill 可以生成合法 Graph/Patch。
4. `validate_ui_graph` 能拦截 AI 乱写 JSON。
5. 执行工具内部强制 validate。
6. 能导出 Prefab/Scene UI Graph。
7. 能生成基础 UI Prefab。
8. 能 Patch 已有 Prefab。
9. 能将 Prefab 实例化到 Scene。
10. 能支持 Label 字号 55 示例：
    - Graph 生成方式；
    - Patch 紧凑方式；
    - Patch 步骤式方式。
11. Report 可让 AI 根据错误修正 JSON。
12. `npm run build` 通过。
13. Cocos 编辑器内完成端到端自测。

---

## 5. 任务进度跟踪

> 更新时间：2026-06-05（二次更新）。本文节记录当前仓库实现进度，用于区分“已落地代码骨架/脚本”“已通过自动化检查”“已接入 Cocos Editor API 适配层”和“仍需 Cocos 编辑器内真实闭环验证”的范围。

### 5.1 当前总体状态

当前最新实现已在 UI Graph 生产线基础骨架之上继续推进：补齐了更完整的 Graph/Patch JSON Schema 结构，新增 Cocos Editor API adapter，并将 resolver、inspect/export、generate prefab、apply patch、instantiate prefab 的主要路径接到编辑器消息 API。

但该版本仍不能视为完整交付完成，原因是当前容器无法启动 Cocos Creator 编辑器，真实 Prefab/Scene 创建、修改、保存、实例化和层级导出仍需要在 Cocos Creator 3.8.x 环境内端到端验证。

当前状态应标记为：**阶段 1 基本完成，阶段 2/3 已接入实现但待编辑器验证，阶段 4 部分完成，阶段 5 自动化部分完成但编辑器验收未完成**。

### 5.2 分阶段进度

| 阶段 | 计划目标 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| 第一阶段：协议闭环 | types/schema、validator、report、schemaHash、Skill 初版 | 基本完成 | 已新增 TypeScript 类型、协议常量、schemaHash、validator、report、Skill 初版和脚本；Graph/Patch JSON Schema 已补齐 target、node、component、assetRef、dynamicContent、operation 等主要嵌套结构。 |
| 第二阶段：只读闭环 | get_project_ui_context、resolve_assets、inspect_ui_graph、export_ui_graph | 已实现，待编辑器验证 | 已注册工具并返回结构化结果；`get_project_ui_context` 已返回版本/hash/组件/operation 摘要；resolver/exporter 已接入 query-node-tree/query-node/asset-db，但仍缺少真实 Prefab/Scene 层级读取验证。 |
| 第三阶段：写入闭环 | default-ui-factory、generate_prefab_from_graph、apply_ui_patch、instantiate_prefab_to_scene | 已接入主要 API，待编辑器验证 | 已有执行器入口和二次 validate；default factory 有 fallback 结构；节点创建、组件添加、属性设置、Prefab 保存和 Prefab 实例化已接入编辑器消息 API，但仍需在 Cocos Creator 3.8.x 内验证真实效果。 |
| 第四阶段：高级能力 | Prefab override、自定义脚本引用、dynamicContent、面板展示、Skill 脚本完善 | 少量完成 | dynamicContent validation warning、自定义脚本基础校验、面板分类提示和 Skill 脚本初版已存在；Prefab instance override 目前仅有 operation 骨架，尚未实现真实 override 写入。 |
| 第五阶段：测试与验收 | 自动化测试、编辑器内手工测试、Skill 版本匹配测试、典型案例测试 | 部分完成 | 已新增 smoke test 并执行 TypeScript/panel/build 检查；尚未完成 Cocos 编辑器内端到端自测和典型 UI 生产案例验证。 |

### 5.3 已完成事项

1. 已新增 UI Graph/Patch/Report 相关 TypeScript 类型定义。
2. 已新增 UI Graph/Patch 协议版本、Skill 版本、支持 factory、支持 operation、内置组件属性白名单和 schemaHash 机制。
3. 已新增 validator，可拦截：
   - 错误 `schemaVersion`；
   - 未知顶层字段；
   - 禁用字段 `dryRun`、`diff`、`confirmWrite`、`backup`、`rollback`、`id`；
   - 非法 `NodeRef`；
   - 未知 operation；
   - 未知 factory；
   - 未知内置组件属性；
   - 部分不支持的自定义脚本数组属性。
4. 已新增 UI Graph MCP 工具分类并注册以下高层工具：
   - `uiGraph_get_project_ui_context`
   - `uiGraph_inspect_ui_graph`
   - `uiGraph_export_ui_graph`
   - `uiGraph_validate_ui_graph`
   - `uiGraph_generate_prefab_from_graph`
   - `uiGraph_apply_ui_patch`
   - `uiGraph_instantiate_prefab_to_scene`
   - `uiGraph_resolve_assets`
5. 已调整默认工具暴露策略：无显式启用配置时默认只暴露 UI Graph 高层工具；Tool Manager 新配置默认仅启用 `uiGraph` 分类，legacy 工具保留可手动启用。
6. 已新增官方 Skill 初版，包含：
   - `SKILL.md`
   - Graph/Patch schema 文件
   - add-label-node / create-label-prefab / instantiate-prefab 模板
   - `make_patch.py`
   - `make_graph.py`
   - `validate_payload.py`
   - `check_version.py`
7. 已新增基础 smoke test 文件，覆盖 schema/version、validator、template 和 Skill version/hash 基础检查。
8. 已新增 Cocos Editor API adapter，并用于 resolver、inspect/export、generate prefab、apply patch、instantiate prefab 的主要执行路径。
9. 已新增 `npm run test:ui-graph`，用于稳定执行 UI Graph smoke test suite。
10. 已执行并通过以下本地检查：
   - `npm run build:ts`
   - `npm run build:panel`
   - `npm run build`
   - Skill patch 生成与本地 payload 校验
   - `npm run test:ui-graph`
   - UI Graph smoke test runner
   - Skill schemaHash 与 context schemaHash 对齐检查
   - `git diff --check`

### 5.4 未完成 / 待修正事项

以下事项仍是完整交付的关键阻塞，后续实现不得仅停留在 report mock 或骨架逻辑：

1. **Schema/Validator 单源化**
   - Graph/Patch JSON Schema 已补齐主要结构，但仍需要进一步单源化生成插件 schema、Skill schema 和 validator 白名单，避免后续漂移。
   - 组件 props 当前仍由 validator 白名单校验，JSON Schema 内尚未完整枚举每个组件 props 的类型约束。

2. **真实 Cocos Editor API 写入验证**
   - `generate_prefab_from_graph` 已接入节点创建、组件添加、属性设置和 `scene.create-prefab`，但需要在 Cocos Creator 3.8.x 内验证生成 Prefab 文件内容。
   - `apply_ui_patch` 已接入 add/remove node、add/remove component、set node/component props 和 instantiatePrefab 的主要路径，但 moveNode、setAssetRef、setEventBindings、setPrefabInstanceOverride 仍需专门适配。
   - `instantiate_prefab_to_scene` 已接入 asset-db 查询和 scene create-node 实例化路径，但需要真实 Scene 验证。

3. **真实 inspect/export**
   - `inspect_ui_graph` 已接入 Prefab/Scene UI 层级、uuid、path、组件和 UITransform 信息读取路径，但需要真实编辑器数据验证。
   - `export_ui_graph` 已实现稀疏 Graph 导出基础逻辑，但资源引用、unsupported/warnings 和 Scene UI 根节点过滤仍需完善。

4. **Resolver 完整化**
   - 需要完成 target、node、component、asset、script reference 的真实解析。
   - `name` 多匹配必须返回 `AMBIGUOUS_NODE_NAME`，并禁止静默选中。
   - 资源类型校验需要覆盖 SpriteFrame、Prefab、Material、Script。

5. **Prefab Instance Override**
   - 需要实现实例根节点、实例内部子节点和子组件属性覆盖。
   - 不得 unlink Prefab，不得修改源 Prefab，不支持新增/删除实例内部原有节点或组件。

6. **自定义脚本组件写入**
   - 需要真实挂载脚本组件并设置基础 JSON 属性、节点引用、组件引用和资源引用。
   - 数组、自定义 class 和复杂 Cocos 类型继续保持首期不支持，并返回结构化错误。

7. **面板展示完善**
   - 当前面板仅更新分类名称和说明文字。
   - 仍需展示当前 schemaVersion、schemaHash 和 Skill 版本匹配状态。

8. **测试与验收**
   - 需要将 smoke test 转为可由 npm script 或测试框架稳定执行的自动化测试。
   - 需要在 Cocos Creator 编辑器内完成端到端手工自测：tools/list、context、Skill 生成、validate、generate prefab、apply patch、instantiate scene。
   - 需要补充 Label 字号 55 的 Graph 生成、Patch 紧凑写法、Patch 步骤式写法三种验收案例。

### 5.5 下一步执行建议

后续开发应优先解决“真实 Cocos Editor API 闭环”，推荐顺序如下：

1. 补齐并统一插件端 schema 与 Skill schema。
2. 在 Cocos Creator 3.8.x 中验证当前 adapter 使用的节点/组件/Prefab/Scene 编辑器 API。
3. 先实现 Label 示例的真实闭环：
   - Graph 生成 Label Prefab；
   - Patch 给已有 Prefab 新增 Label 并设置 `fontSize = 55`；
   - 将 Prefab 实例化到当前 Scene 的 Canvas/PageLayer。
4. 完成 inspect/export 的真实层级读取，让修改流程严格满足“先查询，再修改”。
5. 完成 resolver 与 asset type 校验。
6. 最后补 Prefab override、自定义脚本引用、dynamicContent、面板版本匹配展示和端到端验收记录。

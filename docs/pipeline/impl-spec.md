# UI Graph 生产线需求讨论与实现规范

> 本文基于仓库根目录 `pipeline-goal.md` 梳理，用于把“UI Graph 生产线”从目标描述落实为可开发、可验收、可自测的实现规范。本文不替代原始目标文档，而是作为开发执行入口。

## 1. 需求讨论结论

### 1.1 已明确的目标

| 议题 | 讨论结论 | 开发影响 |
| --- | --- | --- |
| MCP 形态 | 继续使用当前插件已有的 Streamable HTTP MCP Server，不重写传输层。 | 新能力通过新增工具类接入现有 `MCPServer.initializeTools()`、`setupTools()`、`executeToolCall()`。 |
| 工具暴露策略 | 默认主工具集收敛为 UI Graph 高层工具；legacy 细粒度工具保留为调试/兜底，但默认不作为 AI 主工作流。 | 需要新增 `uiGraph` 工具分类，并增加默认工具配置/过滤策略。 |
| 生产线顺序 | 标准流程简化为 `Inspect -> Export -> Validate -> Generate -> Patch -> Report`。 | 所有写入型工具必须输出统一报告；首期不做 dry-run、diff、confirmWrite、备份和回滚，先以功能闭环为优先。 |
| Prefab 与 Scene 优先级 | Prefab 是核心生成与修改目标；Scene 主要负责查询、挂载 Prefab、少量局部 UI 修改。 | 首期优先完成 Prefab 生命周期，Scene 修改只做安全子集。 |
| JSON 风格 | UI Graph 接近 Cocos Hierarchy/Inspector，保持稀疏，不设计过度业务 DSL。 | Schema 以 node/component/property/resource/event 为中心。 |
| 默认 UI 控件创建 | “创建默认 UI 控件节点”与“给已有节点添加组件”必须明确区分。 | Graph/Patch operation 必须有 `intent` 或 `factory` 字段区分两类行为。 |
| 安全写入 | 首期写入流程直接执行，不做 dry-run、diff、confirmWrite、备份和回滚，先完成功能闭环。 | 写入服务必须先校验、执行、输出报告。 |

### 1.2 仍不清晰但会显著影响开发的内容

| 不清晰点 | 风险 | 规范化决策 | 后续可调整点 |
| --- | --- | --- | --- |
| Cocos Creator 版本范围 | UI 组件默认层级、编辑器消息 API、Prefab 保存行为随版本变化。 | 首期按当前依赖 `@cocos/creator-types` 3.8.x 设计；运行时通过 `get_project_ui_context` 返回实际编辑器版本。 | 如要兼容 3.7/3.9，需要增加版本适配层。 |
| 既有节点匹配方式 | 开发者常规操作不会向节点 metadata 写入额外 id，插件也不应引入 metadata id；只用 name 又可能重名。 | 修改既有节点时仅支持 `uuid`、`path`、`name` 匹配，优先级为 `uuid > path > name`；新增节点不涉及匹配。 | 如 name 匹配多个节点必须报错，不允许静默选中。 |
| 默认控件结构的精确程度 | 手写默认结构可能与编辑器菜单创建结果不一致。 | 首期由插件内部 `DefaultUIFactory` 统一创建，尽量调用 Cocos 编辑器现有创建能力；无法调用时按 3.8 默认结构补齐并在 report 中 warning。 | 后续可以做版本快照测试，固化不同版本结构。 |
| Prefab instance override 表达 | Prefab 实例覆盖常用且必须支持，但需要保证不破坏 Prefab 链接、子节点定位和 override 记录。 | 首期支持实例根节点属性覆盖、子节点属性覆盖、子组件属性覆盖；本质按编辑器人工修改实例的方式触发节点/组件属性设置，不直接拼 Prefab 序列化。 | 暂不支持新增/删除 Prefab 实例内部节点、apply/revert override、复杂数组 override。 |
| 自定义脚本组件属性类型 | 编辑器 Inspector 可见属性与序列化字段存在差异。 | 首期支持脚本组件识别、挂载、基础 JSON 属性设置，并支持节点/组件/资源引用解析；引用解析使用 `uuid > path > name`。 | 数组和自定义类型暂不考虑，后续再扩展脚本 schema 探测。 |
| 动态内容是否生成预览节点 | 生成预览节点可能污染 Prefab，完全不生成会影响编辑器预览。 | 首期只用 `dynamicContent` 描述运行时规则，不生成 editor preview 节点。 | 后续如确有编辑器预览需求，再设计显式 preview 工具。 |
| 资源路径解析优先级 | uuid 稳定但不可读；db:// 可读但可能移动。 | 输入优先接受 `db://`，执行前解析为 uuid；报告同时返回 path 与 uuid。 | 后续加入资源重定位建议。 |
| backup/rollback 粒度 | 备份/回滚会增加首期实现复杂度，可能拖慢功能闭环。 | 首期不做 dry-run、diff、confirmWrite、备份和回滚；依赖 validate 和 report 反馈问题。 | 后续在功能稳定后再评估是否增加备份。 |

## 2. 目标实现范围与开发节奏

当前阶段先补齐需求决策；待用户确认最终决策表后，再进入全流程开发。开发可按阶段推进和自测，但最终交付目标是完整 UI Graph 生产线闭环，而不是仅交付 Phase 0 骨架。

完整闭环必须覆盖：Inspect、Export、Validate、Generate Prefab、Apply Patch、Instantiate Prefab to Scene、Report。

### 2.1 Phase 0：规范与骨架

**目标**：具备开始编码和单元自测条件。

- 新增 UI Graph 类型定义、schema 常量和 validator 框架。
- 新增 `uiGraph` 工具类骨架，注册到 MCP Server 与工具管理器。
- 默认工具配置优先展示 UI Graph 工具。
- 建立执行报告的统一数据结构。

### 2.2 Phase 1：只读能力

**目标**：AI 能可靠理解当前项目 UI 环境。

- `uiGraph_get_project_ui_context`
- `uiGraph_inspect_ui_graph`
- `uiGraph_export_ui_graph`
- `uiGraph_resolve_assets`
- `uiGraph_validate_ui_graph`

### 2.3 Phase 2：Prefab 生成

**目标**：能从 Graph 生成基础 UI Prefab。

- `uiGraph_generate_prefab_from_graph` 直接执行生成。
- 支持 Node、UITransform、Sprite、Label、Button、Widget、Layout。
- 支持默认 UI 控件节点创建：Sprite、Label、Button、Toggle、Slider、ScrollView、PageView、ProgressBar。
- 输出执行报告。

### 2.4 Phase 3：Patch 与实例化

**目标**：能安全修改已有 Prefab，并把 Prefab 挂到 Scene。

- `uiGraph_apply_ui_patch`
- `uiGraph_instantiate_prefab_to_scene`
- Patch 支持 set/add/remove/move/component/event/resource/prefab-instance 安全子集。

## 3. 模块与文件落点

| 模块 | 建议文件 | 职责 |
| --- | --- | --- |
| 工具入口 | `source/tools/ui-graph-tools.ts` | MCP 工具定义、输入 schema、参数分发。 |
| 类型定义 | `source/ui-graph/types.ts` | UI Graph、Patch、Report TypeScript 类型。 |
| Schema | `source/ui-graph/schema.ts` | JSON Schema 常量，用于 MCP input 与内部校验。 |
| 校验器 | `source/ui-graph/validator.ts` | 稀疏 Graph/Patch 校验、错误定位、版本校验。 |
| 导出器 | `source/ui-graph/exporter.ts` | 从 Scene/Prefab 节点树导出 Graph。 |
| 解析器 | `source/ui-graph/resolver.ts` | target、node reference、asset reference、component reference 解析。 |
| 执行器 | `source/ui-graph/executor.ts` | 调用 Cocos Editor 能力执行节点/组件/保存/实例化。 |
| 默认控件工厂 | `source/ui-graph/default-ui-factory.ts` | 统一创建默认 UI 控件节点与默认子结构。 |
| 报告 | `source/ui-graph/report.ts` | 标准报告、计数、operation 结果、warning/error、耗时。 |
| 注册 | `source/mcp-server.ts`、`source/tools/tool-manager.ts` | 将 `uiGraph` 分类加入现有工具初始化和默认配置。 |

## 4. UI Graph v0.1 规范

### 4.1 顶层结构

```json
{
  "schemaVersion": "ui-graph/v0.1",
  "target": {
    "type": "prefab",
    "path": "db://assets/ui/MainPanel.prefab"
  },
  "metadata": {
    "name": "MainPanel",
    "generator": "cocos-ui-mcp",
    "managedBy": "ui-graph",
    "createdAt": "2026-06-03T00:00:00.000Z"
  },
  "root": {
    "name": "MainPanel",
    "factory": "Node",
    "components": [
      { "type": "UITransform", "props": { "contentSize": { "width": 750, "height": 1334 } } }
    ],
    "children": []
  }
}
```

### 4.2 Target

```ts
type UIGraphTarget =
  | { type: 'prefab'; path?: string; uuid?: string }
  | { type: 'scene'; path?: string; uuid?: string; current?: boolean }
  | { type: 'node'; scene?: string; uuid?: string; path?: string; name?: string };
```

规则：

1. `prefab.path` 和 `scene.path` 优先使用 `db://`。
2. `scene.current=true` 表示当前打开场景。
3. Patch 目标可以定位到整个资源，也可以定位到资源内节点。

### 4.3 Node

```ts
interface UIGraphNode {
  uuid?: string;
  path?: string;
  name: string;
  active?: boolean;
  factory?: DefaultUIFactoryType | 'Node';
  transform?: {
    position?: { x?: number; y?: number; z?: number };
    rotation?: { x?: number; y?: number; z?: number };
    scale?: { x?: number; y?: number; z?: number };
  };
  components?: UIGraphComponent[];
  prefabInstance?: UIGraphPrefabInstance;
  dynamicContent?: UIGraphDynamicContent;
  children?: UIGraphNode[];
}
```

规则：

- `factory` 表示“创建默认 UI 控件节点”；省略时默认为普通 Node。
- `components` 表示“在当前节点上存在/追加组件”，不隐式创建子节点。
- `uuid` 和 `path` 主要用于导出既有资源和 Patch 定位；生成新 Prefab 时不强制填写。
- 稀疏规则：未填写字段不导出默认值；Patch 中未填写字段表示不修改。

### 4.4 Component

```ts
interface UIGraphComponent {
  type: string;
  enabled?: boolean;
  props?: Record<string, unknown>;
  events?: UIGraphEventBinding[];
  assets?: Record<string, UIGraphAssetRef>;
}
```

规则：

- 内置组件 `type` 使用 Cocos 类名，如 `UITransform`、`Sprite`、`Label`、`Button`。
- 自定义脚本组件 `type` 使用脚本类名；必要时增加 `script` asset ref。
- `props` 只记录非默认值或用户显式要求的值。
- 事件绑定必须能映射到 Inspector 的事件数组。

### 4.5 AssetRef

```ts
interface UIGraphAssetRef {
  path?: string;
  uuid?: string;
  type?: 'SpriteFrame' | 'Prefab' | 'Material' | 'Script' | string;
  required?: boolean;
}
```

规则：

- 输入允许只给 `path`；执行前必须解析 uuid。
- 类型不匹配时 validation 返回 error。
- `required=false` 的资源缺失返回 warning，执行时跳过该属性写入。

### 4.6 默认 UI 控件工厂

| `factory` | 必需行为 | 首期组件/子节点要求 |
| --- | --- | --- |
| `Node` | 创建普通节点。 | Node，可选 UITransform。 |
| `Sprite` | 创建默认 Sprite 节点。 | Node + UITransform + Sprite。 |
| `Label` | 创建默认 Label 节点。 | Node + UITransform + Label。 |
| `Button` | 创建默认 Button 节点。 | Node + UITransform + Sprite + Button。 |
| `Toggle` | 创建默认 Toggle 结构。 | Node + UITransform + Toggle + CheckMark 子节点。 |
| `Slider` | 创建默认 Slider 结构。 | Background、Fill Area/Fill、Handle Slide Area/Handle。 |
| `ScrollView` | 创建默认 ScrollView 结构。 | Node + UITransform + ScrollView + Mask + View/Content。 |
| `PageView` | 创建默认 PageView 结构。 | View/Content；可选 PageViewIndicator。 |
| `PageViewIndicator` | 创建默认指示器结构。 | Node + UITransform + PageViewIndicator。 |
| `ProgressBar` | 创建默认 ProgressBar 结构。 | Background、Bar。 |

约束：

- `factory` 创建的默认组件可被同节点 `components` 中同类型配置覆盖非默认属性。
- `addComponent` Patch 不得隐式创建 factory 默认子结构。
- 执行报告必须分别统计 `createdDefaultUINodes` 与 `addedComponents`。

## 5. Patch v0.1 规范

### 5.1 顶层结构

```json
{
  "schemaVersion": "ui-patch/v0.1",
  "target": { "type": "prefab", "path": "db://assets/ui/MainPanel.prefab" },
  "operations": []
}
```

### 5.2 Operation

```ts
type UIPatchOperation =
  | { op: 'setNodeProps'; target: NodeRef; props: Partial<UIGraphNode> }
  | { op: 'addNode'; parent: NodeRef; node: UIGraphNode; index?: number }
  | { op: 'removeNode'; target: NodeRef; ifMissing?: 'error' | 'ignore' }
  | { op: 'moveNode'; target: NodeRef; parent: NodeRef; index?: number }
  | { op: 'addComponent'; target: NodeRef; component: UIGraphComponent }
  | { op: 'removeComponent'; target: NodeRef; componentType: string }
  | { op: 'setComponentProps'; target: NodeRef; componentType: string; props: Record<string, unknown> }
  | { op: 'setAssetRef'; target: NodeRef; componentType: string; property: string; asset: UIGraphAssetRef }
  | { op: 'setEventBindings'; target: NodeRef; componentType: string; events: UIGraphEventBinding[] }
  | { op: 'instantiatePrefab'; prefab: UIGraphAssetRef; parent: NodeRef; props?: Partial<UIGraphNode> }
  | { op: 'setPrefabInstanceOverride'; instance: NodeRef; target: NodeRef; componentType?: string; props: Record<string, unknown> };
```

### 5.3 NodeRef

```ts
interface NodeRef {
  uuid?: string;
  path?: string;
  name?: string;
}
```

解析规则：

1. 修改既有节点时按 `uuid > path > name` 解析。
2. 新增节点不涉及匹配，只需要解析父节点。
3. `name` 只允许在唯一匹配时使用，否则 validation error。
4. 不向 Cocos 节点 metadata 写入或依赖任何 UI Graph id。
5. 任何 Patch 在执行前必须完成目标解析，并在执行报告中记录结果。


### 5.4 Prefab instance override

Prefab instance override 首期必须支持常用属性覆盖，但执行方式应模拟编辑器人工操作：先定位 Scene 中的 Prefab 实例及其实例内节点，再调用节点/组件属性设置能力，不直接修改 Cocos 原生 Prefab 序列化文件。

支持范围：

1. 实例根节点属性覆盖，例如 `name`、`active`、`position`、`scale`、`size`。
2. 实例内部子节点属性覆盖，例如子节点 `active`、`position`、`size`、`name`。
3. 实例内部子组件属性覆盖，例如 `Label.string`、`Sprite.spriteFrame`、`Button.interactable`、`Widget`、`Layout` 的基础属性。
4. 子节点定位仍使用 `uuid > path > name`；`path` 可以是实例根节点下的相对路径。

暂不支持范围：

1. 新增或删除 Prefab 实例内部原有节点。
2. 添加或删除 Prefab 实例内部组件。
3. apply override 回源 Prefab。
4. revert override。
5. 复杂数组属性 override。

实现难点不是“属性设置”本身，而是以下边界：

1. **定位上下文不同**：Prefab 资源内节点路径与 Scene 中 Prefab 实例路径不同，执行器必须明确是在实例内找子节点，而不是修改源 Prefab。
2. **Prefab 链接不能被破坏**：人工在编辑器里改实例属性会形成 override；工具也应触发等价编辑器操作，避免 unlink 或直接改序列化导致链接异常。
3. **报告需要区分来源**：报告中要说明这是 instance override，而不是源 Prefab 被修改。
4. **重复 name 风险更高**：实例内部常见 `Label`、`Content`、`Background` 等重名节点，按 name 匹配时必须唯一，否则返回 `AMBIGUOUS_NODE_NAME`。

### 5.5 自定义脚本组件引用属性

自定义脚本组件首期支持基础 JSON 属性以及节点、组件、资源引用，不支持数组和自定义类型。

建议表达：

```ts
interface UIGraphNodeRefValue {
  node: NodeRef;
}

interface UIGraphComponentRefValue {
  node: NodeRef;
  componentType: string;
}

interface UIGraphScriptAssetRefValue {
  asset: UIGraphAssetRef;
}
```

解析规则：

1. 节点引用按 `uuid > path > name` 解析。
2. 组件引用先按 `uuid > path > name` 解析节点，再在节点上查找 `componentType`。
3. 资源引用优先使用 `db://` path，再解析 uuid 和类型。
4. `name` 匹配多个节点时报错。
5. 数组和自定义类型暂不考虑；validator 应返回 `UNSUPPORTED_SCRIPT_PROP_TYPE`，不静默写入。

## 6. MCP 工具规范

### 6.1 `uiGraph_get_project_ui_context`

用途：查询当前项目的 UI 生产上下文。

输入：

```json
{ "includeAssets": false, "assetTypes": ["SpriteFrame", "Prefab", "Script"] }
```

输出关键字段：

- Cocos Creator 版本、项目路径、当前 Scene。
- Canvas/UIRoot/PageLayer/PopupLayer/OverlayLayer 探测结果。
- 已支持组件列表与默认控件 factory 列表。
- 工具版本、schema 版本。

### 6.2 `uiGraph_inspect_ui_graph`

用途：返回目标 UI 层级摘要，适合 AI 修改前快速查询。

输入：

```json
{ "target": { "type": "scene", "current": true }, "maxDepth": 4, "includeComponents": true }
```

输出：节点摘要、路径、uuid、组件类型、关键尺寸/位置、warnings。

### 6.3 `uiGraph_export_ui_graph`

用途：导出现有 Prefab/Scene/Node 为完整或稀疏 UI Graph。

输入：

```json
{ "target": { "type": "prefab", "path": "db://assets/ui/MainPanel.prefab" }, "sparse": true }
```

输出：`UIGraph`、unsupported 字段列表、warnings。

### 6.4 `uiGraph_validate_ui_graph`

用途：校验 Graph 或 Patch 是否可被插件识别和执行。

输入：

```json
{ "graph": {}, "patch": {}, "resolveAssets": true, "resolveTargets": true }
```

输出：

```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "resolvedAssets": [],
  "resolvedTargets": []
}
```

### 6.5 `uiGraph_generate_prefab_from_graph`

用途：根据 UI Graph 生成 Prefab。

输入：

```json
{
  "graph": {},
  "outputPath": "db://assets/ui/MainPanel.prefab",
  "overwrite": false
}
```

约束：

- 直接写入生成 Prefab。
- `outputPath` 已存在且 `overwrite=false` 时 validation error。
- 首期不做 dry-run、diff、confirmWrite、备份和回滚。

### 6.6 `uiGraph_apply_ui_patch`

用途：对 Prefab/Scene 应用局部修改。

输入：

```json
{
  "patch": {}
}
```

约束：

- Scene 写入必须 `target.type='scene'` 且明确 path/current，并返回更高等级 warning。
- 失败必须返回 errors，不允许静默跳过 required operation。

### 6.7 `uiGraph_instantiate_prefab_to_scene`

用途：将 Prefab 实例化到 Scene 指定父节点。

输入：

```json
{
  "scene": { "type": "scene", "current": true },
  "prefab": { "path": "db://assets/ui/MainPanel.prefab", "type": "Prefab" },
  "parent": { "path": "Canvas/PageLayer" },
  "props": { "name": "MainPanel", "active": true }
}
```

## 7. Report 规范

### 7.1 ExecutionReport

```ts
interface UIExecutionReport {
  success: boolean;
  target: UIGraphTarget;
  summary: {
    createdNodes: number;
    modifiedNodes: number;
    removedNodes: number;
    movedNodes: number;
    addedComponents: number;
    removedComponents: number;
    createdDefaultUINodes: number;
    modifiedProperties: number;
    usedAssets: number;
  };
  operations: Array<{ op: string; path?: string; status: 'success' | 'failed' | 'skipped'; before?: unknown; after?: unknown; message?: string }> ;
  usedAssets: Array<{ path?: string; uuid?: string; type?: string }>;
  warnings: Array<{ code: string; message: string; path?: string }>;
  errors: Array<{ code: string; message: string; path?: string }>;
  durationMs: number;
}
```

## 8. 开发前置约束

1. 写入型流程首期经过 `validate -> execute -> report`。
2. 首期不做 dry-run、diff、confirmWrite、备份和回滚；必须依靠 validate 和结构化 report 反馈问题。
3. Graph/Patch 中不认识的组件属性不能静默写入；应返回 warning 或 error。
4. 所有工具返回 JSON 对象，不返回纯字符串说明。
5. 工具描述必须提示 AI “修改前先 inspect/export，写入前先 validate”。

## 9. 自测矩阵

### 9.1 自动化检查

| 阶段 | 命令 | 通过标准 |
| --- | --- | --- |
| 类型检查 | `npm run build:ts` | TypeScript 无错误。 |
| 面板构建 | `npm run build:panel` | Vite 面板构建成功。 |
| 全量构建 | `npm run build` | 面板与主进程构建均成功。 |
| 工具 schema 快照 | `node source/test/ui-graph-schema-test.js` 或等价 TS 测试 | 工具列表、Graph/Patch schema 与快照一致。 |

### 9.2 Cocos 编辑器内手工自测

| 用例 | 步骤 | 期望 |
| --- | --- | --- |
| 面板启动 | Cocos 打开插件面板。 | 面板可打开，MCP Server 可启动。 |
| 工具列表 | MCP Client 调 `tools/list`。 | 默认只显示 UI Graph 高层工具与必要 server health/restart 工具。 |
| 项目上下文 | 调 `uiGraph_get_project_ui_context`。 | 返回版本、当前 scene、UI 根节点探测、支持组件列表。 |
| 导出场景 | 调 `inspect`/`export` 当前 Scene。 | 返回 Canvas/UI 节点摘要和稀疏 Graph。 |
| 校验失败 | 提供错误组件名/错误资源类型。 | 返回结构化 errors，含 path/code/message。 |
| Prefab 写入 | 提供基础 Graph 生成 Prefab。 | 生成 Prefab，报告含 summary。 |
| Patch 写入 | 应用 Patch。 | Prefab 内容变化，报告成功。 |
| Scene 实例化 | 将 Prefab 挂到 `Canvas/PageLayer`。 | Scene 出现实例，报告含实例节点 uuid/path。 |

## 10. 首期最小可交付标准

首期可以认为“具备直接开始开发与自测条件”的完成标准：

1. `uiGraph` 工具分类接入 MCP Server 和工具管理器。
2. `get_project_ui_context`、`validate_ui_graph`、`generate_prefab_from_graph` 可用。
3. Graph v0.1、Patch v0.1、Report 类型落地。
4. 支持至少 Node、UITransform、Sprite、Label、Button。
5. 默认 UI 控件创建与 addComponent 在 report 中能区分统计。
6. `npm run build` 通过。
7. Cocos 编辑器中可完成一次从 Graph 到真实生成基础 Prefab 的闭环。

## 11. AI 交互 JSON 规范与示例

### 11.1 规范状态

v0.1 阶段 AI 与插件交互的 JSON 结构已经确定为三类：

1. **Graph**：用于描述完整 UI 结构，主要传给 `uiGraph_generate_prefab_from_graph`。
2. **Patch**：用于修改已有 Prefab、Scene 或节点，主要传给 `uiGraph_apply_ui_patch`。
3. **Report**：所有生成、修改、实例化工具统一返回的执行结果。

首期不包含 dry-run、diff、confirmWrite、backup、rollback 字段。写入型工具执行前仍应先调用 `uiGraph_validate_ui_graph`，但真实写入工具本身直接执行。

### 11.2 组件命名与属性命名

AI 输入内置组件时，首期规范使用 Cocos 类名短名：

- `UITransform`
- `Sprite`
- `Label`
- `Button`
- `Widget`
- `Layout`

不推荐在 UI Graph/Patch 中写 `cc.Label`、`cc.Sprite` 这类带 `cc.` 前缀的旧工具命名。实现层可以兼容并归一化这些别名，但 Report 和 Export 应输出短名。

组件属性使用 Inspector/组件公开属性名。例如 Label 字号使用：

```json
{ "fontSize": 55 }
```

### 11.3 创建新 Prefab 时：节点 + Label + 字号 55

如果 AI 的目标是创建一个新的 UI Prefab，其中包含一个节点并给这个节点添加 `Label` 组件、设置字号为 `55`，推荐调用 `uiGraph_generate_prefab_from_graph`，传入完整 Graph：

```json
{
  "graph": {
    "schemaVersion": "ui-graph/v0.1",
    "target": {
      "type": "prefab",
      "path": "db://assets/ui/LabelExample.prefab"
    },
    "metadata": {
      "name": "LabelExample",
      "generator": "cocos-ui-mcp",
      "managedBy": "ui-graph"
    },
    "root": {
      "name": "LabelExample",
      "factory": "Node",
      "components": [
        {
          "type": "UITransform",
          "props": {
            "contentSize": { "width": 750, "height": 1334 }
          }
        }
      ],
      "children": [
        {
          "name": "TitleLabel",
          "factory": "Node",
          "components": [
            {
              "type": "UITransform",
              "props": {
                "contentSize": { "width": 300, "height": 80 }
              }
            },
            {
              "type": "Label",
              "props": {
                "string": "Title",
                "fontSize": 55
              }
            }
          ]
        }
      ]
    }
  },
  "outputPath": "db://assets/ui/LabelExample.prefab",
  "overwrite": false
}
```

说明：

1. `factory: "Node"` 表示创建普通节点。
2. `components` 表示给当前节点添加组件，不会隐式创建其他节点。
3. `Label.props.fontSize = 55` 表示设置 Label 字号。
4. 如果只是创建一个 Label 默认节点，也可以把子节点写成 `factory: "Label"`，再用同节点 `components` 覆盖 Label 的 `fontSize`。

### 11.4 修改已有 Prefab/Scene 时：新增节点 + 添加 Label + 字号 55

如果 AI 的目标是在已有 Prefab 或 Scene 中新增节点，并给该节点添加 `Label` 组件、设置字号为 `55`，推荐调用 `uiGraph_apply_ui_patch`，传入 Patch。

更简洁的写法是用一个 `addNode` operation，在新增节点内直接声明组件：

```json
{
  "patch": {
    "schemaVersion": "ui-patch/v0.1",
    "target": {
      "type": "prefab",
      "path": "db://assets/ui/MainPanel.prefab"
    },
    "operations": [
      {
        "op": "addNode",
        "parent": { "path": "MainPanel" },
        "node": {
          "name": "TitleLabel",
          "factory": "Node",
          "components": [
            {
              "type": "UITransform",
              "props": {
                "contentSize": { "width": 300, "height": 80 }
              }
            },
            {
              "type": "Label",
              "props": {
                "string": "Title",
                "fontSize": 55
              }
            }
          ]
        }
      }
    ]
  }
}
```

如果 AI 想表达“先创建节点，再添加组件，再修改组件属性”的步骤式语义，也可以拆成三个 operations：

```json
{
  "patch": {
    "schemaVersion": "ui-patch/v0.1",
    "target": {
      "type": "prefab",
      "path": "db://assets/ui/MainPanel.prefab"
    },
    "operations": [
      {
        "op": "addNode",
        "parent": { "path": "MainPanel" },
        "node": {
          "name": "TitleLabel",
          "factory": "Node",
          "components": [
            { "type": "UITransform", "props": { "contentSize": { "width": 300, "height": 80 } } }
          ]
        }
      },
      {
        "op": "addComponent",
        "target": { "path": "MainPanel/TitleLabel" },
        "component": {
          "type": "Label",
          "props": {
            "string": "Title"
          }
        }
      },
      {
        "op": "setComponentProps",
        "target": { "path": "MainPanel/TitleLabel" },
        "componentType": "Label",
        "props": {
          "fontSize": 55
        }
      }
    ]
  }
}
```

推荐优先使用第一种紧凑写法；第二种适合 AI 或开发者需要保留明确操作步骤的场景。

### 11.5 交互流程

AI 与插件的推荐交互流程如下：

1. 查询上下文：调用 `uiGraph_get_project_ui_context`，确认 Cocos 版本、当前 Scene、UI 根节点和支持组件。
2. 查询目标：如果修改已有 Prefab/Scene，先调用 `uiGraph_inspect_ui_graph` 或 `uiGraph_export_ui_graph` 获取路径、uuid、组件列表。
3. 生成 JSON：新建 Prefab 使用 Graph；修改已有资源使用 Patch。
4. 校验 JSON：调用 `uiGraph_validate_ui_graph`，解析目标节点和资源引用。
5. 执行写入：调用 `uiGraph_generate_prefab_from_graph`、`uiGraph_apply_ui_patch` 或 `uiGraph_instantiate_prefab_to_scene`。
6. 读取报告：根据 `success`、`summary`、`operations`、`warnings`、`errors` 判断是否需要修正 JSON 后重试。

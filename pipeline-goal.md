# UI Graph 生产线需求概要

## 1. 背景

现有 Cocos MCP 插件通常偏向“通用编辑器遥控器”，会暴露大量细粒度工具，例如创建节点、移动节点、添加组件、设置组件属性、保存场景、查询资源等。此类方式虽然灵活，但会带来工具数量多、上下文占用大、调用链长、执行过程不易审查、失败后难恢复等问题。

本需求的目标是在已经 fork 的 Cocos MCP 插件基础上，新增一套面向 UI 生产的结构化能力：UI Graph 生产线。

该生产线不是替代 Cocos 编辑器，也不是让 AI 直接逐步调用大量底层编辑器操作，而是让 AI 通过少量高层工具完成 UI 查询、导出、校验、生成、修改、预览和报告。

---

## 2. 总体目标

构建一套基于传统 MCP Streamable HTTP 的 Cocos UI Graph 生产线，使 AI 能够通过结构化 JSON 和少量高层 MCP 工具完成以下工作：

1. 查询当前 Cocos 项目的 UI 环境。
2. 查询现有 Prefab 或 Scene 的 UI 层级结构。
3. 将现有 Prefab 或 Scene 导出为可审查的 UI Graph。
4. 校验 AI 生成的 UI Graph 或 Patch 是否可被插件识别。
5. 根据 UI Graph 生成 Cocos UI Prefab。
6. 对已有 Prefab 或 Scene 执行局部 Patch 修改。
7. 在写入前提供 Dry-run 和 Diff 报告。
8. 将 UI Prefab 实例化到指定 Scene 层级中。
9. 输出结构化执行报告，供 AI 和开发者继续修正。

最终形成一条稳定、完整、可审查的生产流程：

Inspect → Export → Validate → Generate → Diff → Patch → Report

---

## 3. 核心理念

### 3.1 少量高层工具

AI 默认只应看到少量高层 MCP 工具，而不是大量细粒度 Cocos 操作工具。

AI 应该调用类似以下能力：

* 查询项目 UI 上下文
* 查询 UI Graph
* 导出 UI Graph
* 校验 UI Graph
* 根据 Graph 生成 Prefab
* 对 Prefab 或 Scene 应用 Patch
* 预览 Diff
* 实例化 Prefab 到 Scene

不应默认让 AI 直接调用：

* 创建节点
* 删除节点
* 添加组件
* 设置组件属性
* 保存 Prefab
* 保存 Scene

这些细粒度操作应由插件内部执行。

### 3.2 插件内部允许细粒度执行

插件内部仍然需要完整掌握 Cocos 节点、组件、资源、Prefab、Scene 的操作能力，但这些能力不直接暴露给 AI，而是作为 UI Graph 生产线的内部执行层。

### 3.3 创建默认 UI 组件与添加 UI 组件的区别

插件需要明确区分“创建默认 UI 组件”和“在节点上添加 UI 组件”两种行为。

创建默认 UI 组件是指直接创建带有预设组件组合和必要子节点结构的节点。例如：

* 创建 Sprite 节点时，同时创建 Node、UITransform、Sprite。
* 创建 Label 节点时，同时创建 Node、UITransform、Label。
* 创建 Button 节点时，同时创建 Node、UITransform、Sprite、Button。
* 创建 Toggle 节点时，同时创建 Node、UITransform、Toggle，并自动生成 CheckMark 等默认子节点结构。
* 创建 Slider 节点时，同时创建 Node、UITransform、Slider，并自动生成 Background、Fill Area、Fill、Handle Slide Area、Handle 等默认子节点结构。
* 创建 ScrollView 节点时，同时创建 Node、UITransform、ScrollView、Mask，并自动生成 View、Content 等默认子节点结构。
* 创建 PageView 节点时，同时创建 Node、UITransform、PageView，并自动生成 View、Content 等默认子节点结构；如启用分页指示器，还应自动创建 PageViewIndicator 及其关联节点。
* 创建 PageViewIndicator 节点时，同时创建 Node、UITransform、PageViewIndicator，并生成默认指示器容器结构。
* 创建 ProgressBar 节点时，同时创建 Node、UITransform、ProgressBar，并自动生成 Background、Bar 等默认子节点结构。

对于这类 Cocos 内置复合控件，插件应尽量遵循编辑器默认创建行为，保证生成结果与手动通过编辑器创建时的层级结构和组件配置保持一致。

此行为应尽量与 Cocos 编辑器中通过菜单创建 UI 节点的体验保持一致。

在节点上添加 UI 组件是指对已经存在的节点追加组件。例如：

* 给已有节点添加 Sprite。
* 给已有节点添加 Label。
* 给已有节点添加 Button。
* 给已有节点添加 Layout。

此行为不应隐式创建新的节点，也不应自动重建已有组件结构。

UI Graph、Patch、Diff 和执行报告中应能够明确区分这两类操作。

### 3.4 JSON 应贴近 Cocos 心智模型

UI Graph JSON 应尽量接近 Cocos 的 Hierarchy 和 Inspector，而不是设计成过度抽象的私有 DSL。

也就是说，JSON 应表达：

* 节点层级
* 节点名称
* 节点尺寸
* 节点位置
* 组件列表
* 组件属性
* 资源引用
* 事件绑定
* Prefab 实例引用
* 运行时动态内容描述

不应优先使用过度语义化但不透明的字段，例如 “large”、“primary”、“modal.center.v1” 这类无法直接映射到 Cocos Inspector 的抽象概念。

### 3.5 JSON 应保持稀疏

UI Graph JSON 不需要补全所有 Cocos 默认属性。

例如：

* 默认 active 不需要反复写。
* 默认 scale 不需要反复写。
* 默认 rotation 不需要反复写。
* 默认 anchorPoint 为中心时不需要反复写。
* 默认颜色、默认状态、默认数组不需要全部导出。

创建模式下，字段不存在表示使用 Cocos 默认值或插件安全默认值。

Patch 模式下，字段不存在表示不修改已有值。

### 3.6 先查询，再修改

任何对已有 Prefab 或 Scene 的修改，都必须遵循先查询、再修改的原则。

AI 不应盲目假设节点存在、组件存在、路径存在或属性存在。

标准流程应为：

1. 查询目标 Prefab 或 Scene。
2. 根据返回结构生成 Patch。
3. Dry-run 预览变更。
4. 确认无误后应用 Patch。
5. 返回执行报告。

---

## 4. 覆盖范围

### 4.1 Prefab

插件需要覆盖 UI Prefab 的完整生命周期：

* 查询 Prefab 层级。
* 导出 Prefab Graph。
* 根据 Graph 生成 Prefab。
* 对已有 Prefab 执行 Patch。
* 比较 Graph 与 Prefab 的差异。
* 输出执行报告。
* 支持资源引用与脚本引用。
* 支持基础 UI 组件。
* 支持 Prefab 实例引用和属性覆盖。

Prefab 是本生产线的核心目标。

### 4.2 Scene

插件需要覆盖 Scene 中与 UI 相关的能力：

* 查询当前 Scene 或指定 Scene 的 UI 层级。
* 查询 Canvas、UIRoot、PageLayer、PopupLayer、OverlayLayer 等关键 UI 根节点。
* 将 Prefab 实例化到指定 Scene 节点下。
* 修改 Scene 中 UI 节点的局部属性。
* 导出 Scene 中的 UI Graph。
* 对 Scene Patch 做 Dry-run 和 Diff。

Scene 能力主要用于挂载和组织 UI Prefab，不应把 Scene 作为主要生成目标。

### 4.3 Asset

插件需要支持 UI 生产线中常见资源查询和解析：

* SpriteFrame
* Prefab
* Material
* Script
* 资源路径
* uuid
* 资源是否存在
* 资源类型是否匹配

资源解析应优先支持人工可读的 db:// 路径。

### 4.4 Component

插件应支持常见 UI 组件及其扩展能力，包括但不限于：

* Node
* UITransform
* Sprite
* Label
* Button
* Widget
* Layout
* Toggle
* ToggleGroup
* Slider
* ProgressBar
* ScrollView
* PageView
* PageViewIndicator
* Mask
* 自定义脚本组件

组件支持范围应覆盖完整 UI Graph 生产线需求，并允许持续扩展更多 Cocos UI 组件类型。

### 4.5 动态内容

运行时动态生成的内容不应在 JSON 中写死为固定节点。

例如：

* PageView 页面数量
* 图鉴卡片数量
* 成就列表数量
* 背包格子数量
* 活动列表数量

这类内容应描述为：

* 容器节点
* 数据源标识
* itemPrefab
* 运行时绑定脚本
* 可选 editor preview 数量

Graph 只描述动态内容的结构规则，不负责写死真实运行时数量。

---

## 5. 非目标与边界

### 5.1 不做通用 Cocos MCP 工具全集

本插件不是为了替代所有 Cocos 编辑器操作。

已有 legacy 细粒度工具可以保留作为调试和兜底能力，但不应成为默认暴露给 AI 的主工具集。

默认工具集应聚焦 UI Graph 生产线。

### 5.2 不直接生成 Cocos 原生 .prefab 文件内容

插件不应让 AI 直接拼 Cocos 原生 Prefab 序列化文件。

正确方式是：

1. AI 提供 UI Graph。
2. 插件解析 Graph。
3. 插件通过 Cocos 编辑器能力创建节点和组件。
4. 由 Cocos 自己保存 Prefab 或 Scene。

### 5.3 聚焦 UI Graph 生产线

本需求聚焦于 UI Graph 生产线能力建设。

所有能力设计均应围绕 UI 查询、导出、校验、生成、修改、Diff、Dry-run、实例化和报告展开。

复杂控件、动态列表、Prefab Override、脚本绑定、Scene 编辑等能力均应纳入统一 UI Graph 模型和生产流程，而不是退化为大量独立的底层编辑器工具。

---

## 6. UI Graph 的基本要求

UI Graph 应是一种面向 Cocos UI 的中间结构描述，具备以下特征：

1. 人工可读。
2. 接近 Cocos 层级管理器和属性检查器。
3. 支持稀疏描述，不强制写默认值。
4. 支持 Prefab 和 Scene 统一 target 模型。
5. 支持节点 id 和 path 两种引用方式。
6. 支持资源路径引用。
7. 支持组件属性描述。
8. 支持事件绑定描述。
9. 支持 Prefab instance 表示。
10. 支持运行时动态内容描述。
11. 支持后续版本升级。

UI Graph 不是业务配置文档，也不是 Cocos 原生 Prefab 文件复制品。

它应该是介于二者之间的、可审查的 UI 结构快照。

---

## 7. Patch 的基本要求

Patch 用于修改已有 Prefab 或 Scene。

Patch 应支持：

* 设置属性
* 新增节点
* 删除节点
* 移动节点
* 添加组件
* 删除组件
* 修改组件属性
* 实例化 Prefab
* 设置 active
* 设置 position
* 设置 size
* 修改 Label 文本
* 修改 Sprite 资源
* 修改 Button 事件绑定

Patch 必须支持 Dry-run。

Dry-run 不应修改任何资源，只返回将会发生的变化。

Patch 应返回 before / after 信息，帮助 AI 和开发者审查变更。

Patch 失败时应能返回明确错误，而不是静默失败。

---

## 8. Diff 与报告要求

每次生成或修改操作都应返回结构化报告。

报告至少包含：

* 是否成功
* 目标资源
* 创建了多少节点
* 修改了多少节点
* 添加了多少组件
* 创建了多少默认 UI 组件节点
* 修改了哪些属性
* 使用了哪些资源
* warnings
* errors
* 执行耗时
* dryRun 状态
* backup 信息
* rollback 信息

报告目的是让 AI 可以根据错误继续修复，也让开发者能够人工判断本次操作是否安全。

---

## 9. 安全要求

### 9.1 默认保护已有资源

对已有 Prefab 或 Scene 的修改必须谨慎。

默认应先 Dry-run，再执行真实写入。

### 9.2 写入前备份

真实写入 Prefab 或 Scene 前，应尽量创建备份。

### 9.3 失败可回滚

如果 Patch 或生成过程中出现错误，应尽量回滚到操作前状态。

### 9.4 不默认覆盖人工修改

插件生成的节点应能被识别，例如通过 metadata、id 或管理标记。

后续更新时，不应无差别覆盖人工添加或人工微调的节点。

### 9.5 Scene 修改更谨慎

Scene 是更高风险资源。

默认应优先修改 Prefab。

Scene 操作主要用于 UI Prefab 实例化和 UI 层级挂载。

---

## 10. 与现有 fork 的关系

当前项目已基于 Trendymen/feature/self fork。

本需求不是要求推翻原仓库结构，而是：

1. 保留原仓库已有的 MCP 通信链路。
2. 保留 Cocos 编辑器内插件面板。
3. 保留构建流程和客户端配置能力。
4. 新增 UI Graph 工具分类。
5. 默认隐藏 legacy 细粒度工具。
6. 将主工作流迁移为 UI Graph 生产线。

原有 legacy tools 可以作为开发期调试能力保留，但不应成为 AI 默认使用的主要工具集。

---

## 11. 预期工具分组

默认主工具组应围绕 UI Graph：

* ping / health check
* get project UI context
* inspect UI graph
* export UI graph
* validate UI graph
* generate prefab from graph
* diff UI graph
* apply UI patch
* instantiate prefab to scene
* resolve assets

工具数量应保持克制，避免重新变成通用细粒度工具堆。

---

## 12. 需求验收标准

插件应做到：

1. Cocos 编辑器中可以打开面板。
2. MCP Server 可以启动。
3. MCP Client 可以连接。
4. AI 默认只看到 UI Graph 工具。
5. 能返回项目 UI 上下文。
6. 能查询当前 Scene 或 Prefab 的 UI 层级摘要。
7. 能导出现有 Prefab 或 Scene 为 UI Graph。
8. 能校验 UI Graph 并返回结构化错误。
9. 能根据 UI Graph 生成基础 UI Prefab。
10. 能区分创建默认 UI 组件节点与向已有节点添加组件两种行为。
11. 能对已有 Prefab 执行 Dry-run Patch。
12. 能返回结构化 Diff 与执行报告。
13. 能真实应用 Patch。
14. 能将 Prefab 实例化到 Scene。
15. 能支持常见 UI 组件

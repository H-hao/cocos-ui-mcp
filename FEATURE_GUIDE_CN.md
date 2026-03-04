# Cocos Creator MCP 服务器功能指南（v1.5.4）

## 概览

- 工具总数：**50**
- 分类分布：**5/8/4/4/2/3/3/2/2/5/4/5/3**
- 传输协议：`Streamable HTTP (MCP 2025-03-26)`
- 命名规范：使用 `分类_工具名`（例如 `node_node_query`）
- 说明：`sceneAdvanced` 已完全移除，不在暴露面。

## 工具分类索引

1. 场景工具（5）
2. 节点工具（8）
3. 组件工具（4）
4. 预制体工具（4）
5. 项目工具（2）
6. 调试工具（3）
7. 偏好设置工具（3）
8. 服务器工具（2）
9. 广播工具（2）
10. 场景视图工具（5）
11. 参考图像工具（4）
12. 资源高级工具（5）
13. 验证工具（3）

## 1. 场景工具（5）

### 1.1 `scene_scene_management`

- 用途：SCENE MANAGEMENT
- action：`get_current`、`get_list`、`open`、`save`、`create`、`save_as`、`close`
- 关键参数：`action`、`path`、`scenePath`
- 最小调用示例：

```json
{
  "tool": "scene_scene_management",
  "arguments": {
    "action": "get_current"
  }
}
```

### 1.2 `scene_scene_hierarchy`

- 用途：SCENE HIERARCHY
- action：`(none)`
- 关键参数：`(none)`
- 最小调用示例：

```json
{
  "tool": "scene_scene_hierarchy",
  "arguments": {}
}
```

### 1.3 `scene_scene_execution_control`

- 用途：EXECUTION CONTROL
- action：`execute_component_method`、`execute_scene_script`、`restore_prefab`
- 关键参数：`action`、`uuid`、`nodeUuid`
- 最小调用示例：

```json
{
  "tool": "scene_scene_execution_control",
  "arguments": {
    "action": "execute_component_method"
  }
}
```

### 1.4 `scene_scene_state_management`

- 用途：STATE MANAGEMENT
- action：`create_snapshot`、`abort_snapshot`、`begin_undo`、`end_undo`、`cancel_undo`、`soft_reload`
- 关键参数：`action`、`nodeUuid`
- 最小调用示例：

```json
{
  "tool": "scene_scene_state_management",
  "arguments": {
    "action": "create_snapshot"
  }
}
```

### 1.5 `scene_scene_query_system`

- 用途：QUERY SYSTEM
- action：`check_ready`、`check_dirty`、`list_classes`、`list_components`、`check_script`、`find_nodes_by_asset`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "scene_scene_query_system",
  "arguments": {
    "action": "check_ready"
  }
}
```

## 2. 节点工具（8）

### 2.1 `node_node_query`

- 用途：NODE SEARCH & INFORMATION
- action：`info`、`find`、`find_by_name`、`list_all`、`detect_type`、`tree`
- 关键参数：`action`、`uuid`
- 最小调用示例：

```json
{
  "tool": "node_node_query",
  "arguments": {
    "action": "info"
  }
}
```

### 2.2 `node_node_lifecycle`

- 用途：NODE CREATION & DELETION
- action：`create`、`delete`
- 关键参数：`action`、`uuid`
- 最小调用示例：

```json
{
  "tool": "node_node_lifecycle",
  "arguments": {
    "action": "create"
  }
}
```

### 2.3 `node_node_transform`

- 用途：MODIFY NODE PROPERTIES
- action：`(none)`
- 关键参数：`uuid`
- 最小调用示例：

```json
{
  "tool": "node_node_transform",
  "arguments": {
    "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### 2.4 `node_node_hierarchy`

- 用途：MOVE OR COPY NODES
- action：`move`、`duplicate`
- 关键参数：`action`、`uuid`、`nodeUuid`
- 最小调用示例：

```json
{
  "tool": "node_node_hierarchy",
  "arguments": {
    "action": "move"
  }
}
```

### 2.5 `node_node_clipboard`

- 用途：CLIPBOARD OPERATIONS
- action：`copy`、`paste`、`cut`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "node_node_clipboard",
  "arguments": {
    "action": "copy"
  }
}
```

### 2.6 `node_node_property_management`

- 用途：PROPERTY MANAGEMENT
- action：`reset_property`、`reset_transform`、`reset_component`
- 关键参数：`action`、`uuid`、`path`
- 最小调用示例：

```json
{
  "tool": "node_node_property_management",
  "arguments": {
    "action": "reset_property",
    "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### 2.7 `node_node_array_management`

- 用途：ARRAY MANAGEMENT
- action：`move_element`、`remove_element`
- 关键参数：`action`、`uuid`、`path`
- 最小调用示例：

```json
{
  "tool": "node_node_array_management",
  "arguments": {
    "action": "move_element",
    "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "path": "db://assets/example"
  }
}
```

### 2.8 `node_node_script_management`

- 用途：NODE SCRIPT MANAGEMENT
- action：`attach`、`remove`
- 关键参数：`action`、`nodeUuid`
- 最小调用示例：

```json
{
  "tool": "node_node_script_management",
  "arguments": {
    "action": "attach",
    "nodeUuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

## 3. 组件工具（4）

### 3.1 `component_component_manage`

- 用途：COMPONENT MANAGEMENT
- action：`add`、`remove`
- 关键参数：`action`、`nodeUuid`、`componentType`
- 最小调用示例：

```json
{
  "tool": "component_component_manage",
  "arguments": {
    "action": "add",
    "nodeUuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "componentType": "example"
  }
}
```

### 3.2 `component_component_query`

- 用途：COMPONENT QUERY
- action：`list`、`info`、`available_types`
- 关键参数：`action`、`nodeUuid`、`category`
- 最小调用示例：

```json
{
  "tool": "component_component_query",
  "arguments": {
    "action": "list"
  }
}
```

### 3.3 `component_set_component_property`

- 用途：COMPONENT PROPERTY SETTER
- action：`(none)`
- 关键参数：`nodeUuid`、`componentType`
- 最小调用示例：

```json
{
  "tool": "component_set_component_property",
  "arguments": {
    "nodeUuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "componentType": "example"
  }
}
```

### 3.4 `component_configure_click_event`

- 用途：Configure or remove click events for Button components.
- action：`(none)`
- 关键参数：`nodeUuid`
- 最小调用示例：

```json
{
  "tool": "component_configure_click_event",
  "arguments": {
    "nodeUuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

## 4. 预制体工具（4）

### 4.1 `prefab_prefab_browse`

- 用途：PREFAB BROWSER
- action：`list`、`info`、`validate`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "prefab_prefab_browse",
  "arguments": {
    "action": "list"
  }
}
```

### 4.2 `prefab_prefab_lifecycle`

- 用途：PREFAB LIFECYCLE
- action：`create`、`delete`
- 关键参数：`action`、`nodeUuid`
- 最小调用示例：

```json
{
  "tool": "prefab_prefab_lifecycle",
  "arguments": {
    "action": "create"
  }
}
```

### 4.3 `prefab_prefab_instance`

- 用途：PREFAB INSTANCES
- action：`instantiate`、`unlink`、`apply`、`revert`
- 关键参数：`action`、`nodeUuid`
- 最小调用示例：

```json
{
  "tool": "prefab_prefab_instance",
  "arguments": {
    "action": "instantiate"
  }
}
```

### 4.4 `prefab_prefab_edit`

- 用途：PREFAB EDIT WORKFLOW
- action：`enter`、`save`、`exit`、`test`
- 关键参数：`action`、`prefabPath`
- 最小调用示例：

```json
{
  "tool": "prefab_prefab_edit",
  "arguments": {
    "action": "enter",
    "prefabPath": "db://assets/example"
  }
}
```

## 5. 项目工具（2）

### 5.1 `project_project_manage`

- 用途：PROJECT MANAGEMENT
- action：`run`、`build`、`get_info`、`get_settings`
- 关键参数：`action`、`category`
- 最小调用示例：

```json
{
  "tool": "project_project_manage",
  "arguments": {
    "action": "run"
  }
}
```

### 5.2 `project_project_build_system`

- 用途：BUILD SYSTEM
- action：`get_build_settings`、`open_build_panel`、`check_builder_status`、`start_preview_server`、`stop_preview_server`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "project_project_build_system",
  "arguments": {
    "action": "get_build_settings"
  }
}
```

## 6. 调试工具（3）

### 6.1 `debug_debug_console`

- 用途：CONSOLE MANAGEMENT
- action：`get_logs`、`clear`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "debug_debug_console",
  "arguments": {
    "action": "get_logs"
  }
}
```

### 6.2 `debug_debug_logs`

- 用途：PROJECT LOG ANALYSIS
- action：`read`、`search`、`info`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "debug_debug_logs",
  "arguments": {
    "action": "read"
  }
}
```

### 6.3 `debug_debug_system`

- 用途：SYSTEM INFORMATION
- action：`editor_info`、`performance`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "debug_debug_system",
  "arguments": {
    "action": "editor_info"
  }
}
```

## 7. 偏好设置工具（3）

### 7.1 `preferences_preferences_manage`

- 用途：PREFERENCES MANAGEMENT
- action：`open_panel`、`get_config`、`set_config`、`reset_config`
- 关键参数：`action`、`path`、`category`
- 最小调用示例：

```json
{
  "tool": "preferences_preferences_manage",
  "arguments": {
    "action": "open_panel"
  }
}
```

### 7.2 `preferences_preferences_query`

- 用途：PREFERENCES QUERY
- action：`get_all`、`list_categories`、`search_settings`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "preferences_preferences_query",
  "arguments": {
    "action": "get_all"
  }
}
```

### 7.3 `preferences_preferences_backup`

- 用途：PREFERENCES BACKUP
- action：`export`、`validate_backup`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "preferences_preferences_backup",
  "arguments": {
    "action": "export"
  }
}
```

## 8. 服务器工具（2）

### 8.1 `server_server_information`

- 用途：SERVER INFORMATION
- action：`get_ip_list`、`get_sorted_ip_list`、`get_port`、`get_comprehensive_status`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "server_server_information",
  "arguments": {
    "action": "get_ip_list"
  }
}
```

### 8.2 `server_server_connectivity`

- 用途：SERVER CONNECTIVITY
- action：`test_connectivity`、`get_network_interfaces`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "server_server_connectivity",
  "arguments": {
    "action": "test_connectivity"
  }
}
```

## 9. 广播工具（2）

### 9.1 `broadcast_broadcast_log_management`

- 用途：BROADCAST LOG MANAGEMENT
- action：`get_log`、`clear_log`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "broadcast_broadcast_log_management",
  "arguments": {
    "action": "get_log"
  }
}
```

### 9.2 `broadcast_broadcast_listener_management`

- 用途：BROADCAST LISTENER MANAGEMENT
- action：`start_listening`、`stop_listening`、`get_active_listeners`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "broadcast_broadcast_listener_management",
  "arguments": {
    "action": "start_listening"
  }
}
```

## 10. 场景视图工具（5）

### 10.1 `sceneView_scene_view_gizmo_management`

- 用途：GIZMO MANAGEMENT
- action：`change_tool`、`query_tool`、`change_pivot`、`query_pivot`、`change_coordinate`、`query_coordinate`、`query_view_mode`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "sceneView_scene_view_gizmo_management",
  "arguments": {
    "action": "change_tool"
  }
}
```

### 10.2 `sceneView_scene_view_mode_control`

- 用途：VIEW MODE CONTROL
- action：`change_2d_3d`、`query_2d_3d`、`set_grid`、`query_grid`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "sceneView_scene_view_mode_control",
  "arguments": {
    "action": "change_2d_3d"
  }
}
```

### 10.3 `sceneView_scene_view_icon_gizmo`

- 用途：ICON GIZMO CONTROL
- action：`set_3d_mode`、`query_3d_mode`、`set_size`、`query_size`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "sceneView_scene_view_icon_gizmo",
  "arguments": {
    "action": "set_3d_mode"
  }
}
```

### 10.4 `sceneView_scene_view_camera_control`

- 用途：CAMERA CONTROL
- action：`focus_on_nodes`、`align_camera_with_view`、`align_view_with_node`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "sceneView_scene_view_camera_control",
  "arguments": {
    "action": "focus_on_nodes"
  }
}
```

### 10.5 `sceneView_scene_view_status_management`

- 用途：STATUS MANAGEMENT
- action：`get_status`、`reset_view`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "sceneView_scene_view_status_management",
  "arguments": {
    "action": "get_status"
  }
}
```

## 11. 参考图像工具（4）

### 11.1 `referenceImage_reference_image_management`

- 用途：REFERENCE IMAGE MANAGEMENT
- action：`add`、`remove`、`switch`、`clear_all`
- 关键参数：`action`、`path`
- 最小调用示例：

```json
{
  "tool": "referenceImage_reference_image_management",
  "arguments": {
    "action": "add"
  }
}
```

### 11.2 `referenceImage_reference_image_query`

- 用途：REFERENCE IMAGE QUERY
- action：`get_config`、`get_current`、`list_all`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "referenceImage_reference_image_query",
  "arguments": {
    "action": "get_config"
  }
}
```

### 11.3 `referenceImage_reference_image_transform`

- 用途：REFERENCE IMAGE TRANSFORM
- action：`set_position`、`set_scale`、`set_opacity`、`set_data`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "referenceImage_reference_image_transform",
  "arguments": {
    "action": "set_position"
  }
}
```

### 11.4 `referenceImage_reference_image_display`

- 用途：REFERENCE IMAGE DISPLAY
- action：`refresh`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "referenceImage_reference_image_display",
  "arguments": {
    "action": "refresh"
  }
}
```

## 12. 资源高级工具（5）

### 12.1 `assetAdvanced_asset_manage`

- 用途：ASSET MANAGEMENT
- action：`import`、`delete`、`save_meta`、`generate_url`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "assetAdvanced_asset_manage",
  "arguments": {
    "action": "import"
  }
}
```

### 12.2 `assetAdvanced_asset_analyze`

- 用途：ASSET ANALYSIS
- action：`dependencies`、`manifest`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "assetAdvanced_asset_analyze",
  "arguments": {
    "action": "dependencies"
  }
}
```

### 12.3 `assetAdvanced_asset_system`

- 用途：ASSET SYSTEM
- action：`check_ready`、`open_external`、`refresh`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "assetAdvanced_asset_system",
  "arguments": {
    "action": "check_ready"
  }
}
```

### 12.4 `assetAdvanced_asset_query`

- 用途：ASSET QUERY
- action：`get_info`、`get_assets`、`find_by_name`、`get_details`、`query_path`、`query_uuid`、`query_url`
- 关键参数：`action`、`uuid`
- 最小调用示例：

```json
{
  "tool": "assetAdvanced_asset_query",
  "arguments": {
    "action": "get_info"
  }
}
```

### 12.5 `assetAdvanced_asset_operations`

- 用途：ASSET OPERATIONS
- action：`create`、`copy`、`move`、`delete`、`save`、`reimport`、`import`
- 关键参数：`action`
- 最小调用示例：

```json
{
  "tool": "assetAdvanced_asset_operations",
  "arguments": {
    "action": "create"
  }
}
```

## 13. 验证工具（3）

### 13.1 `validation_validate_json_params`

- 用途：JSON PARAMETER VALIDATION
- action：`(none)`
- 关键参数：`jsonString`
- 最小调用示例：

```json
{
  "tool": "validation_validate_json_params",
  "arguments": {
    "jsonString": "example"
  }
}
```

### 13.2 `validation_safe_string_value`

- 用途：STRING SAFETY
- action：`(none)`
- 关键参数：`value`
- 最小调用示例：

```json
{
  "tool": "validation_safe_string_value",
  "arguments": {
    "value": "example"
  }
}
```

### 13.3 `validation_format_mcp_request`

- 用途：MCP REQUEST FORMATTING
- action：`(none)`
- 关键参数：`toolName`、`arguments`
- 最小调用示例：

```json
{
  "tool": "validation_format_mcp_request",
  "arguments": {
    "toolName": "example-name",
    "arguments": {}
  }
}
```

## 兼容与弃用说明

- 旧场景高级前缀工具不再暴露，也不再兼容调用。
- 无分类前缀旧名（如 `create_node`）不在文档承诺范围内。
- 以当前 `source/tools/*.ts` 的 `getTools()` 与 `action enum` 为最终依据。

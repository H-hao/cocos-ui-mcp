# Cocos Creator MCP Feature Guide (v1.5.4)

## Overview

- Total tools: **50**
- Category distribution: **5/8/4/4/2/3/3/2/2/5/4/5/3**
- Transport: `Streamable HTTP (MCP 2025-03-26)`
- Naming rule: use `category_tool` format (e.g. `node_node_query`)
- Note: `sceneAdvanced` has been fully removed from the public surface.

## Category Index

1. Scene Tools (5)
2. Node Tools (8)
3. Component Tools (4)
4. Prefab Tools (4)
5. Project Tools (2)
6. Debug Tools (3)
7. Preferences Tools (3)
8. Server Tools (2)
9. Broadcast Tools (2)
10. Scene View Tools (5)
11. Reference Image Tools (4)
12. Asset Advanced Tools (5)
13. Validation Tools (3)

## 1. Scene Tools (5)

### 1.1 `scene_scene_management`

- Purpose: SCENE MANAGEMENT
- actions: `get_current`, `get_list`, `open`, `save`, `create`, `save_as`, `close`
- key params: `action`, `path`, `scenePath`
- Minimal call example:

```json
{
  "tool": "scene_scene_management",
  "arguments": {
    "action": "get_current"
  }
}
```

### 1.2 `scene_scene_hierarchy`

- Purpose: SCENE HIERARCHY
- actions: `(none)`
- key params: `(none)`
- Minimal call example:

```json
{
  "tool": "scene_scene_hierarchy",
  "arguments": {}
}
```

### 1.3 `scene_scene_execution_control`

- Purpose: EXECUTION CONTROL
- actions: `execute_component_method`, `execute_scene_script`, `restore_prefab`
- key params: `action`, `uuid`, `nodeUuid`
- Minimal call example:

```json
{
  "tool": "scene_scene_execution_control",
  "arguments": {
    "action": "execute_component_method"
  }
}
```

### 1.4 `scene_scene_state_management`

- Purpose: STATE MANAGEMENT
- actions: `create_snapshot`, `abort_snapshot`, `begin_undo`, `end_undo`, `cancel_undo`, `soft_reload`
- key params: `action`, `nodeUuid`
- Minimal call example:

```json
{
  "tool": "scene_scene_state_management",
  "arguments": {
    "action": "create_snapshot"
  }
}
```

### 1.5 `scene_scene_query_system`

- Purpose: QUERY SYSTEM
- actions: `check_ready`, `check_dirty`, `list_classes`, `list_components`, `check_script`, `find_nodes_by_asset`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "scene_scene_query_system",
  "arguments": {
    "action": "check_ready"
  }
}
```

## 2. Node Tools (8)

### 2.1 `node_node_query`

- Purpose: NODE SEARCH & INFORMATION
- actions: `info`, `find`, `find_by_name`, `list_all`, `detect_type`, `tree`
- key params: `action`, `uuid`
- Minimal call example:

```json
{
  "tool": "node_node_query",
  "arguments": {
    "action": "info"
  }
}
```

### 2.2 `node_node_lifecycle`

- Purpose: NODE CREATION & DELETION
- actions: `create`, `delete`
- key params: `action`, `uuid`
- Minimal call example:

```json
{
  "tool": "node_node_lifecycle",
  "arguments": {
    "action": "create"
  }
}
```

### 2.3 `node_node_transform`

- Purpose: MODIFY NODE PROPERTIES
- actions: `(none)`
- key params: `uuid`
- Minimal call example:

```json
{
  "tool": "node_node_transform",
  "arguments": {
    "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### 2.4 `node_node_hierarchy`

- Purpose: MOVE OR COPY NODES
- actions: `move`, `duplicate`
- key params: `action`, `uuid`, `nodeUuid`
- Minimal call example:

```json
{
  "tool": "node_node_hierarchy",
  "arguments": {
    "action": "move"
  }
}
```

### 2.5 `node_node_clipboard`

- Purpose: CLIPBOARD OPERATIONS
- actions: `copy`, `paste`, `cut`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "node_node_clipboard",
  "arguments": {
    "action": "copy"
  }
}
```

### 2.6 `node_node_property_management`

- Purpose: PROPERTY MANAGEMENT
- actions: `reset_property`, `reset_transform`, `reset_component`
- key params: `action`, `uuid`, `path`
- Minimal call example:

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

- Purpose: ARRAY MANAGEMENT
- actions: `move_element`, `remove_element`
- key params: `action`, `uuid`, `path`
- Minimal call example:

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

- Purpose: NODE SCRIPT MANAGEMENT
- actions: `attach`, `remove`
- key params: `action`, `nodeUuid`
- Minimal call example:

```json
{
  "tool": "node_node_script_management",
  "arguments": {
    "action": "attach",
    "nodeUuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

## 3. Component Tools (4)

### 3.1 `component_component_manage`

- Purpose: COMPONENT MANAGEMENT
- actions: `add`, `remove`
- key params: `action`, `nodeUuid`, `componentType`
- Minimal call example:

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

- Purpose: COMPONENT QUERY
- actions: `list`, `info`, `available_types`
- key params: `action`, `nodeUuid`, `category`
- Minimal call example:

```json
{
  "tool": "component_component_query",
  "arguments": {
    "action": "list"
  }
}
```

### 3.3 `component_set_component_property`

- Purpose: COMPONENT PROPERTY SETTER
- actions: `(none)`
- key params: `nodeUuid`, `componentType`
- Minimal call example:

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

- Purpose: Configure or remove click events for Button components.
- actions: `(none)`
- key params: `nodeUuid`
- Minimal call example:

```json
{
  "tool": "component_configure_click_event",
  "arguments": {
    "nodeUuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

## 4. Prefab Tools (4)

### 4.1 `prefab_prefab_browse`

- Purpose: PREFAB BROWSER
- actions: `list`, `info`, `validate`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "prefab_prefab_browse",
  "arguments": {
    "action": "list"
  }
}
```

### 4.2 `prefab_prefab_lifecycle`

- Purpose: PREFAB LIFECYCLE
- actions: `create`, `delete`
- key params: `action`, `nodeUuid`
- Minimal call example:

```json
{
  "tool": "prefab_prefab_lifecycle",
  "arguments": {
    "action": "create"
  }
}
```

### 4.3 `prefab_prefab_instance`

- Purpose: PREFAB INSTANCES
- actions: `instantiate`, `unlink`, `apply`, `revert`
- key params: `action`, `nodeUuid`
- Minimal call example:

```json
{
  "tool": "prefab_prefab_instance",
  "arguments": {
    "action": "instantiate"
  }
}
```

### 4.4 `prefab_prefab_edit`

- Purpose: PREFAB EDIT WORKFLOW
- actions: `enter`, `save`, `exit`, `test`
- key params: `action`, `prefabPath`
- Minimal call example:

```json
{
  "tool": "prefab_prefab_edit",
  "arguments": {
    "action": "enter",
    "prefabPath": "db://assets/example"
  }
}
```

## 5. Project Tools (2)

### 5.1 `project_project_manage`

- Purpose: PROJECT MANAGEMENT
- actions: `run`, `build`, `get_info`, `get_settings`
- key params: `action`, `category`
- Minimal call example:

```json
{
  "tool": "project_project_manage",
  "arguments": {
    "action": "run"
  }
}
```

### 5.2 `project_project_build_system`

- Purpose: BUILD SYSTEM
- actions: `get_build_settings`, `open_build_panel`, `check_builder_status`, `start_preview_server`, `stop_preview_server`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "project_project_build_system",
  "arguments": {
    "action": "get_build_settings"
  }
}
```

## 6. Debug Tools (3)

### 6.1 `debug_debug_console`

- Purpose: CONSOLE MANAGEMENT
- actions: `get_logs`, `clear`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "debug_debug_console",
  "arguments": {
    "action": "get_logs"
  }
}
```

### 6.2 `debug_debug_logs`

- Purpose: PROJECT LOG ANALYSIS
- actions: `read`, `search`, `info`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "debug_debug_logs",
  "arguments": {
    "action": "read"
  }
}
```

### 6.3 `debug_debug_system`

- Purpose: SYSTEM INFORMATION
- actions: `editor_info`, `performance`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "debug_debug_system",
  "arguments": {
    "action": "editor_info"
  }
}
```

## 7. Preferences Tools (3)

### 7.1 `preferences_preferences_manage`

- Purpose: PREFERENCES MANAGEMENT
- actions: `open_panel`, `get_config`, `set_config`, `reset_config`
- key params: `action`, `path`, `category`
- Minimal call example:

```json
{
  "tool": "preferences_preferences_manage",
  "arguments": {
    "action": "open_panel"
  }
}
```

### 7.2 `preferences_preferences_query`

- Purpose: PREFERENCES QUERY
- actions: `get_all`, `list_categories`, `search_settings`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "preferences_preferences_query",
  "arguments": {
    "action": "get_all"
  }
}
```

### 7.3 `preferences_preferences_backup`

- Purpose: PREFERENCES BACKUP
- actions: `export`, `validate_backup`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "preferences_preferences_backup",
  "arguments": {
    "action": "export"
  }
}
```

## 8. Server Tools (2)

### 8.1 `server_server_information`

- Purpose: SERVER INFORMATION
- actions: `get_ip_list`, `get_sorted_ip_list`, `get_port`, `get_comprehensive_status`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "server_server_information",
  "arguments": {
    "action": "get_ip_list"
  }
}
```

### 8.2 `server_server_connectivity`

- Purpose: SERVER CONNECTIVITY
- actions: `test_connectivity`, `get_network_interfaces`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "server_server_connectivity",
  "arguments": {
    "action": "test_connectivity"
  }
}
```

## 9. Broadcast Tools (2)

### 9.1 `broadcast_broadcast_log_management`

- Purpose: BROADCAST LOG MANAGEMENT
- actions: `get_log`, `clear_log`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "broadcast_broadcast_log_management",
  "arguments": {
    "action": "get_log"
  }
}
```

### 9.2 `broadcast_broadcast_listener_management`

- Purpose: BROADCAST LISTENER MANAGEMENT
- actions: `start_listening`, `stop_listening`, `get_active_listeners`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "broadcast_broadcast_listener_management",
  "arguments": {
    "action": "start_listening"
  }
}
```

## 10. Scene View Tools (5)

### 10.1 `sceneView_scene_view_gizmo_management`

- Purpose: GIZMO MANAGEMENT
- actions: `change_tool`, `query_tool`, `change_pivot`, `query_pivot`, `change_coordinate`, `query_coordinate`, `query_view_mode`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "sceneView_scene_view_gizmo_management",
  "arguments": {
    "action": "change_tool"
  }
}
```

### 10.2 `sceneView_scene_view_mode_control`

- Purpose: VIEW MODE CONTROL
- actions: `change_2d_3d`, `query_2d_3d`, `set_grid`, `query_grid`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "sceneView_scene_view_mode_control",
  "arguments": {
    "action": "change_2d_3d"
  }
}
```

### 10.3 `sceneView_scene_view_icon_gizmo`

- Purpose: ICON GIZMO CONTROL
- actions: `set_3d_mode`, `query_3d_mode`, `set_size`, `query_size`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "sceneView_scene_view_icon_gizmo",
  "arguments": {
    "action": "set_3d_mode"
  }
}
```

### 10.4 `sceneView_scene_view_camera_control`

- Purpose: CAMERA CONTROL
- actions: `focus_on_nodes`, `align_camera_with_view`, `align_view_with_node`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "sceneView_scene_view_camera_control",
  "arguments": {
    "action": "focus_on_nodes"
  }
}
```

### 10.5 `sceneView_scene_view_status_management`

- Purpose: STATUS MANAGEMENT
- actions: `get_status`, `reset_view`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "sceneView_scene_view_status_management",
  "arguments": {
    "action": "get_status"
  }
}
```

## 11. Reference Image Tools (4)

### 11.1 `referenceImage_reference_image_management`

- Purpose: REFERENCE IMAGE MANAGEMENT
- actions: `add`, `remove`, `switch`, `clear_all`
- key params: `action`, `path`
- Minimal call example:

```json
{
  "tool": "referenceImage_reference_image_management",
  "arguments": {
    "action": "add"
  }
}
```

### 11.2 `referenceImage_reference_image_query`

- Purpose: REFERENCE IMAGE QUERY
- actions: `get_config`, `get_current`, `list_all`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "referenceImage_reference_image_query",
  "arguments": {
    "action": "get_config"
  }
}
```

### 11.3 `referenceImage_reference_image_transform`

- Purpose: REFERENCE IMAGE TRANSFORM
- actions: `set_position`, `set_scale`, `set_opacity`, `set_data`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "referenceImage_reference_image_transform",
  "arguments": {
    "action": "set_position"
  }
}
```

### 11.4 `referenceImage_reference_image_display`

- Purpose: REFERENCE IMAGE DISPLAY
- actions: `refresh`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "referenceImage_reference_image_display",
  "arguments": {
    "action": "refresh"
  }
}
```

## 12. Asset Advanced Tools (5)

### 12.1 `assetAdvanced_asset_manage`

- Purpose: ASSET MANAGEMENT
- actions: `import`, `delete`, `save_meta`, `generate_url`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "assetAdvanced_asset_manage",
  "arguments": {
    "action": "import"
  }
}
```

### 12.2 `assetAdvanced_asset_analyze`

- Purpose: ASSET ANALYSIS
- actions: `dependencies`, `manifest`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "assetAdvanced_asset_analyze",
  "arguments": {
    "action": "dependencies"
  }
}
```

### 12.3 `assetAdvanced_asset_system`

- Purpose: ASSET SYSTEM
- actions: `check_ready`, `open_external`, `refresh`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "assetAdvanced_asset_system",
  "arguments": {
    "action": "check_ready"
  }
}
```

### 12.4 `assetAdvanced_asset_query`

- Purpose: ASSET QUERY
- actions: `get_info`, `get_assets`, `find_by_name`, `get_details`, `query_path`, `query_uuid`, `query_url`
- key params: `action`, `uuid`
- Minimal call example:

```json
{
  "tool": "assetAdvanced_asset_query",
  "arguments": {
    "action": "get_info"
  }
}
```

### 12.5 `assetAdvanced_asset_operations`

- Purpose: ASSET OPERATIONS
- actions: `create`, `copy`, `move`, `delete`, `save`, `reimport`, `import`
- key params: `action`
- Minimal call example:

```json
{
  "tool": "assetAdvanced_asset_operations",
  "arguments": {
    "action": "create"
  }
}
```

## 13. Validation Tools (3)

### 13.1 `validation_validate_json_params`

- Purpose: JSON PARAMETER VALIDATION
- actions: `(none)`
- key params: `jsonString`
- Minimal call example:

```json
{
  "tool": "validation_validate_json_params",
  "arguments": {
    "jsonString": "example"
  }
}
```

### 13.2 `validation_safe_string_value`

- Purpose: STRING SAFETY
- actions: `(none)`
- key params: `value`
- Minimal call example:

```json
{
  "tool": "validation_safe_string_value",
  "arguments": {
    "value": "example"
  }
}
```

### 13.3 `validation_format_mcp_request`

- Purpose: MCP REQUEST FORMATTING
- actions: `(none)`
- key params: `toolName`, `arguments`
- Minimal call example:

```json
{
  "tool": "validation_format_mcp_request",
  "arguments": {
    "toolName": "example-name",
    "arguments": {}
  }
}
```

## Compatibility and Deprecation

- Legacy scene-advanced prefixed tools are not exposed and no longer supported.
- Unprefixed legacy names (for example `create_node`) are out of this guide scope.
- Source of truth is `getTools()` and `action` enums in `source/tools/*.ts`.

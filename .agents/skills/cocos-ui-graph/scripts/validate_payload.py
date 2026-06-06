#!/usr/bin/env python3
import json, sys
payload = json.load(open(sys.argv[1], encoding='utf-8')) if len(sys.argv) > 1 else json.load(sys.stdin)
errors = []
if not isinstance(payload, dict): errors.append("payload must be object")
version = payload.get("schemaVersion")
if version not in ("ui-graph/v0.1", "ui-patch/v0.1"): errors.append("invalid schemaVersion")
for key in ("dryRun", "diff", "confirmWrite", "backup", "rollback", "id"):
    if key in payload: errors.append(f"forbidden field: {key}")
if "target" not in payload: errors.append("target is required")
if version == "ui-graph/v0.1" and "root" not in payload: errors.append("root is required")
if version == "ui-patch/v0.1" and not isinstance(payload.get("operations"), list): errors.append("operations array is required")
if errors:
    print(json.dumps({"valid": False, "errors": errors}, ensure_ascii=False, indent=2)); sys.exit(1)
print(json.dumps({"valid": True, "errors": []}, ensure_ascii=False, indent=2))

#!/usr/bin/env python3
import argparse, hashlib, json, pathlib, sys
parser = argparse.ArgumentParser()
parser.add_argument("context_json", help="Path to uiGraph_get_project_ui_context JSON output")
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[1]
payload = json.loads((root / "schemas" / "schema-hash-payload.json").read_text(encoding="utf-8"))
local_hash = "sha256:" + hashlib.sha256(json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
context = json.loads(pathlib.Path(args.context_json).read_text(encoding="utf-8"))
remote_hash = context.get("schemaHash") or context.get("data", {}).get("schemaHash")
if remote_hash != local_hash:
    print(json.dumps({"matched": False, "localSchemaHash": local_hash, "pluginSchemaHash": remote_hash, "suggestion": "Call uiGraph_get_project_ui_context for latest summary and update the Skill or plugin before generating write payloads."}, ensure_ascii=False, indent=2))
    sys.exit(1)
print(json.dumps({"matched": True, "schemaHash": local_hash}, ensure_ascii=False, indent=2))

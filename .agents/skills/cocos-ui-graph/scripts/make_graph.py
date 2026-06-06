#!/usr/bin/env python3
import argparse, json
parser = argparse.ArgumentParser()
parser.add_argument("create-label-prefab")
parser.add_argument("--target", required=True)
parser.add_argument("--root-name", default="LabelExample")
parser.add_argument("--label-name", default="TitleLabel")
parser.add_argument("--text", default="Title")
parser.add_argument("--font-size", type=int, default=55)
args = parser.parse_args()
print(json.dumps({
  "schemaVersion": "ui-graph/v0.1",
  "target": {"type": "prefab", "path": args.target},
  "metadata": {"generator": "cocos-ui-graph-skill", "managedBy": "ui-graph"},
  "root": {"name": args.root_name, "factory": "Node", "children": [{"name": args.label_name, "factory": "Node", "components": [{"type": "Label", "props": {"string": args.text, "fontSize": args.font_size}}]}]}
}, ensure_ascii=False, indent=2))

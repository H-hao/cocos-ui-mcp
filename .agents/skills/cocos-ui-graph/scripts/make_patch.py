#!/usr/bin/env python3
import argparse, json

def add_label_node(args):
    return {
        "schemaVersion": "ui-patch/v0.1",
        "target": {"type": "prefab", "path": args.target},
        "operations": [{
            "op": "addNode",
            "parent": {"path": args.parent},
            "node": {
                "name": args.name,
                "factory": "Node",
                "components": [
                    {"type": "UITransform", "props": {"contentSize": {"width": args.width, "height": args.height}}},
                    {"type": "Label", "props": {"string": args.text, "fontSize": args.font_size}}
                ]
            }
        }]
    }

parser = argparse.ArgumentParser()
sub = parser.add_subparsers(dest="command", required=True)
p = sub.add_parser("add-label-node")
p.add_argument("--target", required=True)
p.add_argument("--parent", required=True)
p.add_argument("--name", required=True)
p.add_argument("--text", required=True)
p.add_argument("--font-size", type=int, required=True)
p.add_argument("--width", type=int, default=300)
p.add_argument("--height", type=int, default=80)
args = parser.parse_args()
if args.command == "add-label-node":
    print(json.dumps(add_label_node(args), ensure_ascii=False, indent=2))

#!/usr/bin/env python3
import csv
import json
import sys

with open(sys.argv[1], newline="", encoding="utf-8") as f:
    json.dump(list(csv.DictReader(f)), sys.stdout, ensure_ascii=False)

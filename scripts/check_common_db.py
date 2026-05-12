# -*- coding: utf-8 -*-
"""检查 static/sqlite/common.db 表是否存在及根节点是否与桥型 id 一致。"""
import sqlite3
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DB = BASE / "static" / "sqlite" / "common.db"
BRIDGE_IDS = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
EXPECT_TABLES = [
    "bi_disease_scale",
    "bi_disease_type",
    "bi_template_object",
    "bi_template_object_disease_type",
]


def main():
    if not DB.exists():
        print("未找到:", DB)
        sys.exit(1)
    conn = sqlite3.connect(str(DB))
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    names = {r[0] for r in c.fetchall()}
    for t in EXPECT_TABLES:
        print(t, "OK" if t in names else "MISSING")
    for t in EXPECT_TABLES:
        if t in names:
            n = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            print(f"  {t} rows:", n)
    roots = c.execute(
        "SELECT id FROM bi_template_object WHERE parent_id IS NULL OR parent_id = 0 ORDER BY id"
    ).fetchall()
    root_ids = [r[0] for r in roots]
    print("roots:", root_ids)
    miss = [x for x in BRIDGE_IDS if x not in root_ids]
    if miss:
        print("缺少桥型根 id:", miss)
    conn.close()


if __name__ == "__main__":
    main()

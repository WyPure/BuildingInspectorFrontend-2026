# -*- coding: utf-8 -*-
"""
离线：用 static/data/*_template.json 中的 selectColumn 写入 static/sqlite/common.db
的 bi_disease_type.select_column（缺列则 ALTER）。完成后请自行将 common.db 拷到设备 _doc/sqlite/。

用法（项目根目录）:
  python scripts/migrate_common_db_select_column.py
  python scripts/migrate_common_db_select_column.py path/to/common.db
"""
from __future__ import annotations

import json
import sqlite3
import stat
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DEFAULT_DB = BASE / "static" / "sqlite" / "common.db"
DATA_DIR = BASE / "static" / "data"


def ensure_writable(path: Path) -> None:
    try:
        m = path.stat().st_mode
        path.chmod(m | stat.S_IWRITE)
    except OSError:
        pass


def collect_from_templates() -> dict[int, int]:
    out: dict[int, int] = {}
    for path in sorted(DATA_DIR.glob("*_template.json")):
        if not path.is_file():
            continue
        with path.open(encoding="utf-8") as f:
            root = json.load(f)
        stack = [root]
        while stack:
            node = stack.pop()
            if not isinstance(node, dict):
                continue
            dts = node.get("diseaseTypes")
            if isinstance(dts, list):
                for dt in dts:
                    if not isinstance(dt, dict) or dt.get("id") is None:
                        continue
                    sc = dt.get("selectColumn", dt.get("select_column"))
                    if sc is None or sc == "":
                        continue
                    try:
                        out[int(dt["id"])] = int(sc)
                    except (TypeError, ValueError):
                        continue
            ch = node.get("children")
            if isinstance(ch, list):
                stack.extend(ch)
    return out


def main() -> int:
    db_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_DB
    if not db_path.is_file():
        print("未找到:", db_path)
        return 1

    id_to_col = collect_from_templates()
    if not id_to_col:
        print("未从模板 JSON 解析到 selectColumn")
        return 1
    print("模板中病害类型条数:", len(id_to_col))

    ensure_writable(db_path)
    conn = sqlite3.connect(str(db_path))
    try:
        try:
            conn.execute("ALTER TABLE bi_disease_type ADD COLUMN select_column INTEGER")
            conn.commit()
            print("已 ADD COLUMN select_column")
        except sqlite3.OperationalError as e:
            msg = str(e).lower()
            if "duplicate column" in msg or "already exists" in msg:
                pass
            else:
                raise
        cur = conn.cursor()
        n = 0
        for dt_id, sc in id_to_col.items():
            r = cur.execute(
                "UPDATE bi_disease_type SET select_column = ? WHERE id = ?",
                (sc, dt_id),
            )
            n += r.rowcount or 0
        conn.commit()
        print("UPDATE 影响行数:", n)
    finally:
        conn.close()
    print("完成:", db_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())

/**
 * 业务库表结构：与 static/sqlite 下 u95.db / data.db 示例一致（便于后续后端对齐），
 * 当前运行时以 document_store 承载与原 JSON 等价的整段数据；bi_* 表预置为空表。
 */

export const DOCUMENT_STORE_DDL = `
CREATE TABLE IF NOT EXISTS document_store (
  doc_type TEXT NOT NULL,
  doc_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT,
  PRIMARY KEY(doc_type, doc_id)
);
`

/** 旧库升级：与后端对齐的离线同步字段（存在则跳过 ALTER） */
export const DOCUMENT_STORE_OFFLINE_ALTER_SQL = [
	`ALTER TABLE document_store ADD COLUMN offline_uuid TEXT`,
	`ALTER TABLE document_store ADD COLUMN offline_deleted INTEGER NOT NULL DEFAULT 0`,
	`ALTER TABLE document_store ADD COLUMN is_offline_data INTEGER NOT NULL DEFAULT 0`,
]

/** u95.db 示例 */
export const UD_RELATION_DDL = `
CREATE TABLE IF NOT EXISTS bi_project (
  id INTEGER PRIMARY KEY,
  name TEXT,
  year INTEGER,
  status TEXT,
  code TEXT,
  start_date TEXT,
  end_date TEXT
);
CREATE TABLE IF NOT EXISTS bi_task (
  id INTEGER PRIMARY KEY,
  building_id INTEGER,
  project_id INTEGER,
  status TEXT,
  evaluation_result INTEGER,
  type INTEGER,
  create_by TEXT,
  create_time TEXT,
  update_by TEXT,
  update_time TEXT,
  remark TEXT
);
CREATE TABLE IF NOT EXISTS bi_building (
  id INTEGER PRIMARY KEY,
  name TEXT,
  is_leaf TEXT,
  status TEXT,
  del_flag TEXT,
  longitude REAL,
  latitude REAL,
  altitude REAL,
  address TEXT,
  area TEXT,
  line TEXT,
  admin_dept TEXT,
  weight REAL,
  video_feed TEXT,
  root_object_id INTEGER,
  root_property_id INTEGER,
  remark TEXT,
  create_by TEXT,
  create_time TEXT,
  update_by TEXT,
  update_time TEXT
);
`

/** data.db 示例 */
export const UL_RELATION_DDL = `
CREATE TABLE IF NOT EXISTS bi_object (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  name TEXT,
  ancestors TEXT,
  status TEXT,
  del_flag TEXT,
  longitude REAL,
  latitude REAL,
  altitude REAL,
  position TEXT,
  area TEXT,
  admin_dept TEXT,
  weight REAL,
  standard_weight REAL,
  video_feed TEXT,
  props TEXT,
  template_object_id INTEGER,
  create_by TEXT,
  create_time TEXT,
  update_by TEXT,
  update_time TEXT,
  remark TEXT
);
CREATE TABLE IF NOT EXISTS bi_component (
  id INTEGER PRIMARY KEY,
  bi_object_id INTEGER,
  name TEXT,
  code TEXT,
  status TEXT,
  del_flag TEXT,
  create_by TEXT,
  create_time TEXT,
  update_by TEXT,
  update_time TEXT,
  remark TEXT
);
CREATE TABLE IF NOT EXISTS bi_disease (
  id INTEGER PRIMARY KEY,
  position TEXT,
  position_number TEXT,
  type TEXT,
  disease_type_id INTEGER,
  description TEXT,
  level TEXT,
  quantity TEXT,
  units TEXT,
  nature TEXT,
  participate_assess TEXT,
  deduct_points INTEGER,
  img_no_exp TEXT,
  project_id INTEGER,
  bi_object_id INTEGER,
  bi_object_name TEXT,
  building_id INTEGER,
  component_id INTEGER,
  commit_type TEXT,
  local_id TEXT,
  remark TEXT,
  cause TEXT,
  repair_recommendation TEXT,
  crack_type TEXT,
  development_trend TEXT,
  detection_method TEXT,
  attachment_count INTEGER,
  create_by TEXT,
  create_time TEXT,
  update_by TEXT,
  update_time TEXT,
  task_id INTEGER
);
CREATE TABLE IF NOT EXISTS bi_disease_detail (
  id INTEGER PRIMARY KEY,
  disease_id INTEGER,
  reference1_location TEXT,
  reference1_location_start REAL,
  reference1_location_end REAL,
  reference2_location TEXT,
  reference2_location_start REAL,
  reference2_location_end REAL,
  length1 REAL,
  length2 REAL,
  length3 REAL,
  width REAL,
  height_depth REAL,
  crack_width REAL,
  area_length REAL,
  area_width REAL,
  area_identifier INTEGER,
  deformation REAL,
  angle INTEGER,
  numerator_ratio INTEGER,
  denominator_ratio INTEGER,
  length_range_start REAL,
  length_range_end REAL,
  width_range_start REAL,
  width_range_end REAL,
  height_depth_range_start REAL,
  height_depth_range_end REAL,
  crack_width_range_start REAL,
  crack_width_range_end REAL,
  area_range_start REAL,
  area_range_end REAL,
  deformation_range_start REAL,
  deformation_range_end REAL,
  angle_range_start REAL,
  angle_range_end REAL,
  other TEXT
);
CREATE TABLE IF NOT EXISTS bi_file_map (
  id INTEGER PRIMARY KEY,
  old_name TEXT,
  new_name TEXT,
  create_time TEXT,
  update_time TEXT,
  create_by TEXT,
  file_type TEXT
);
CREATE TABLE IF NOT EXISTS bi_attachment (
  id INTEGER PRIMARY KEY,
  name TEXT,
  minio_id INTEGER,
  thumb_minio_id INTEGER,
  type INTEGER,
  del_flag TEXT,
  create_by TEXT,
  create_time TEXT,
  update_by TEXT,
  update_time TEXT,
  weight REAL,
  subject_id INTEGER
);
`

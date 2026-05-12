/**
 * 业务用 SQLite 查询：Kysely 链式构建 + compile，再经 compiledQueryToExecutableSql 供 plus.sqlite 执行。
 */
import { getKyselyCompileOnly } from './kyselyCompileDb.mjs'
import { compiledQueryToExecutableSql } from './compiledQueryToSqlString.mjs'
import { sql } from 'kysely'

function toSql(compiled) {
    return compiledQueryToExecutableSql(compiled)
}

/**
 * UD/UL：按 doc_type、doc_id 读取一条 payload（readUdDocument / readUlBridgeDocument）
 */
export function buildSelectDocumentStorePayloadSql(docType, docId) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('document_store')
            .select(['payload'])
            .where('doc_type', '=', docType)
            .where('doc_id', '=', docId)
            .limit(1)
            .compile()
    )
}

/**
 * UD：病害 doc_id 前缀列表（listUdDiseaseYears）
 * @param {string} idPrefix 如 `${buildingId}::`
 */
export function buildSelectUdDiseaseDocIdsByPrefixSql(idPrefix) {
    const db = getKyselyCompileOnly()
    const pattern = `${idPrefix}%`
    return toSql(
        db
            .selectFrom('document_store')
            .select(['doc_id'])
            .where('doc_type', '=', 'disease')
            .where('doc_id', 'like', pattern)
            .compile()
    )
}

/**
 * UL：病害 doc_id 列表（listUlDiseaseYears）
 */
export function buildSelectUlDiseaseDocIdsSql() {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('document_store')
            .select(['doc_id'])
            .where('doc_type', '=', 'disease')
            .compile()
    )
}

/**
 * document_store：按主键读离线元数据（上传前取 offlineUuid 等）
 */
export function buildSelectDocumentStoreOfflineMetaSql(docType, docId) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('document_store')
            .select(['offline_uuid', 'offline_deleted', 'is_offline_data', 'updated_at'])
            .where('doc_type', '=', docType)
            .where('doc_id', '=', docId)
            .limit(1)
            .compile()
    )
}

/**
 * document_store：UPSERT（ON CONFLICT DO UPDATE）
 * @param {{ offlineUuid?: string|null, offlineDeleted?: number, isOfflineData?: number }} [meta]
 */
export function buildUpsertDocumentStoreSql(docType, docId, payloadJsonString, updatedAtIso, meta = {}) {
    const db = getKyselyCompileOnly()
    const offlineUuid = meta.offlineUuid != null ? meta.offlineUuid : null
    const offlineDeleted = meta.offlineDeleted != null ? Number(meta.offlineDeleted) : 0
    const isOfflineData = meta.isOfflineData != null ? Number(meta.isOfflineData) : 0
    return toSql(
        db
            .insertInto('document_store')
            .values({
                doc_type: docType,
                doc_id: docId,
                payload: payloadJsonString,
                updated_at: updatedAtIso,
                offline_uuid: offlineUuid,
                offline_deleted: offlineDeleted,
                is_offline_data: isOfflineData,
            })
            .onConflict((oc) =>
                oc.columns(['doc_type', 'doc_id']).doUpdateSet({
                    payload: payloadJsonString,
                    updated_at: updatedAtIso,
                    offline_uuid: offlineUuid,
                    offline_deleted: offlineDeleted,
                    is_offline_data: isOfflineData,
                })
            )
            .compile()
    )
}

// --- common.db（桥型目录）---

/**
 * 按模板根 id 列表取 id、name（预留：按 id 子集查询）
 * @param {readonly number[]} ids
 */
export function buildSelectCatalogBridgeTypeOptionsByIdsSql(ids) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('bi_template_object')
            .select(['id', 'name'])
            .where('id', 'in', [...ids])
            .orderBy('id', 'asc')
            .compile()
    )
}

/** queryDiseaseScalesByTypeCode */
export function buildSelectCatalogDiseaseScalesByTypeCodeSql(typeCode) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('bi_disease_scale')
            .select([
                'id',
                'scale',
                'qualitative_description',
                'quantitative_description',
                'status',
                'create_time',
                'update_time',
            ])
            .where('type_code', '=', typeCode)
            .orderBy('scale', 'asc')
            .compile()
    )
}

/**
 * loadBridgeTemplateTree 第一段：SELECT * FROM bi_template_object WHERE（条件为 treeWhere 整段）
 * @param {string} treeWhereSqlFragment 由 sqlTreeFilterForBridge(bid) 生成，不含 WHERE 关键字
 */
export function buildSelectCatalogTemplateObjectsByTreeWhereSql(treeWhereSqlFragment) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('bi_template_object')
            .selectAll()
            .where(sql.raw(treeWhereSqlFragment))
            .compile()
    )
}

/**
 * loadBridgeTemplateTree 第二段：三表 JOIN；WHERE 为 sqlTreeFilterForBridgeAlias('too', bid)
 */
export function buildSelectCatalogTemplateDiseaseJoinSql(tooTableWhereSqlFragment) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('bi_template_object as too')
            .innerJoin('bi_template_object_disease_type as rel', 'rel.template_object_id', 'too.id')
            .innerJoin('bi_disease_type as dt', 'dt.id', 'rel.disease_type_id')
            .select([
                'too.id as template_object_id',
                'dt.id',
                'dt.code',
                'dt.name',
                'dt.max_scale',
                'dt.min_scale',
                'dt.status',
                'dt.threshold',
                'dt.group_name',
                // SQLite：dt.select_column 会被解析成 dt + 保留字 select，必须用引号
                sql`dt.${sql.ref('select_column')}`.as('select_column'),
                'dt.create_by',
                'dt.create_time',
                'dt.update_by',
                'dt.update_time',
                'dt.remark',
            ])
            .where(sql.raw(tooTableWhereSqlFragment))
            .compile()
    )
}

// --- UD 关系表（u{userId}.db，与 businessDocumentStore 手写 SQL 对齐）---

/** bi_template_object：桥型根节点 WHERE 片段（与 bridgeCatalogDb 原 SQL_TEMPLATE_OBJECT_ROOT_WHERE 一致） */
export const CATALOG_TEMPLATE_OBJECT_ROOT_WHERE =
    "(parent_id IS NULL OR parent_id = 0 OR parent_id = '0' OR TRIM(CAST(parent_id AS TEXT)) = '')"

/** readUdRelationalProjects */
export function buildSelectUdBiProjectAllOrderedSql() {
    const db = getKyselyCompileOnly()
    return toSql(
        db.selectFrom('bi_project').selectAll().orderBy('year', 'desc').orderBy('id', 'desc').compile()
    )
}

/** readUdRelationalTasks：按项目 id 过滤；projectId 非有限数时查全部任务 */
export function buildSelectUdBiTaskByProjectIdSql(projectId) {
    const db = getKyselyCompileOnly()
    let q = db.selectFrom('bi_task').selectAll()
    const pid = Number(projectId)
    if (Number.isFinite(pid)) {
        q = q.where('project_id', '=', pid)
    }
    return toSql(q.compile())
}

/** readUdRelationalTasks：批量取 bi_building */
export function buildSelectUdBiBuildingByIdsSql(ids) {
    const db = getKyselyCompileOnly()
    const idNums = (Array.isArray(ids) ? ids : [])
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n))
    return toSql(db.selectFrom('bi_building').selectAll().where('id', 'in', idNums).compile())
}

/** readBuildingRootObjectId */
export function buildSelectUdBuildingRootObjectIdOnlySql(buildingId) {
    const db = getKyselyCompileOnly()
    const bid = Number(buildingId)
    return toSql(
        db
            .selectFrom('bi_building')
            .select(['root_object_id'])
            .where('id', '=', bid)
            .limit(1)
            .compile()
    )
}

/** readUdBuildingCatalogTemplateId */
export function buildSelectUdBuildingCatalogTemplateIdSql(buildingId) {
    const db = getKyselyCompileOnly()
    const bid = Number(buildingId)
    return toSql(
        db
            .selectFrom('bi_building as b')
            .leftJoin('bi_object as o', 'b.root_object_id', 'o.id')
            .select(sql`o.template_object_id`.as('tid'))
            .where('b.id', '=', bid)
            .limit(1)
            .compile()
    )
}

/** readUdRelationalObjectTree：取 building 上 root 列 */
export function buildSelectUdBiBuildingRootColumnsSql(buildingId) {
    const db = getKyselyCompileOnly()
    const bid = Number(buildingId)
    return toSql(
        db
            .selectFrom('bi_building')
            .select(['root_object_id', 'root_property_id'])
            .where('id', '=', bid)
            .limit(1)
            .compile()
    )
}

/**
 * readUdRelationalObjectTree：取实例树根及子树行（与历史手写 OR 条件一致）
 * @param {number} rootObjId
 */
export function buildSelectUdBiObjectSubtreeSql(rootObjId) {
    const rid = Number(rootObjId)
    const db = getKyselyCompileOnly()
    const aEq = `0,${rid}`
    const like1 = `0,${rid},%`
    const like2 = `%,${rid},%`
    const like3 = `%,${rid}`
    return toSql(
        db
            .selectFrom('bi_object')
            .selectAll()
            .where((eb) =>
                eb.or([
                    eb('id', '=', rid),
                    eb('ancestors', '=', aEq),
                    eb('ancestors', 'like', like1),
                    eb('ancestors', 'like', like2),
                    eb('ancestors', 'like', like3),
                    eb('parent_id', '=', rid),
                ])
            )
            .compile()
    )
}

/** document_store 兼容写入：是否存在一行 */
export function buildSelectDocumentStoreRowExistsSql(docType, docId) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('document_store')
            .select(sql`1`.as('_'))
            .where('doc_type', '=', docType)
            .where('doc_id', '=', docId)
            .limit(1)
            .compile()
    )
}

/** document_store 兼容写入：UPDATE（避免 ON CONFLICT 在部分机型上解析失败） */
export function buildUpdateDocumentStoreCompatSql(
    docType,
    docId,
    payloadJsonString,
    updatedAtIso,
    offlineUuid,
    offlineDeleted,
    isOfflineData
) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .updateTable('document_store')
            .set({
                payload: payloadJsonString,
                updated_at: updatedAtIso,
                offline_uuid: offlineUuid,
                offline_deleted: offlineDeleted,
                is_offline_data: isOfflineData,
            })
            .where('doc_type', '=', docType)
            .where('doc_id', '=', docId)
            .compile()
    )
}

/** document_store 兼容写入：INSERT */
export function buildInsertDocumentStoreCompatSql(
    docType,
    docId,
    payloadJsonString,
    updatedAtIso,
    offlineUuid,
    offlineDeleted,
    isOfflineData
) {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .insertInto('document_store')
            .values({
                doc_type: docType,
                doc_id: docId,
                payload: payloadJsonString,
                updated_at: updatedAtIso,
                offline_uuid: offlineUuid,
                offline_deleted: offlineDeleted,
                is_offline_data: isOfflineData,
            })
            .compile()
    )
}

/** queryBridgeTypeOptions：common.db 桥型根节点列表 */
export function buildSelectCatalogBridgeTypeRootOptionsSql() {
    const db = getKyselyCompileOnly()
    return toSql(
        db
            .selectFrom('bi_template_object')
            .select(['id', 'name'])
            .where(sql.raw(CATALOG_TEMPLATE_OBJECT_ROOT_WHERE))
            .orderBy('id', 'asc')
            .compile()
    )
}

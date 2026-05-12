/**
 * UD：_doc/{root}/u{userId}.db — 下发包内结构化数据（懒迁移原 JSON）
 * UL：_doc/{ulRoot}/building/{buildingId}/data.db — 单桥编辑数据（懒迁移原 JSON）
 */

import { unref } from 'vue'
import { idStore } from '@/store/idStorage'
import {
    hasBusinessSqlite,
    withOpenDatabase,
    selectSqlPromise,
    executeSqlPromise,
    readDocJsonFile,
    deleteDocFileIfExists,
    applySchemaStatements,
} from './businessSqliteCore.js'
import {
    DOCUMENT_STORE_DDL,
    DOCUMENT_STORE_OFFLINE_ALTER_SQL,
    UD_RELATION_DDL,
    UL_RELATION_DDL
} from './businessSqliteSchema.js'
import {
    buildSelectDocumentStoreOfflineMetaSql,
    buildSelectDocumentStorePayloadSql,
    buildSelectUdDiseaseDocIdsByPrefixSql,
    buildSelectUlDiseaseDocIdsSql,
    buildSelectUdBiProjectAllOrderedSql,
    buildSelectUdBiTaskByProjectIdSql,
    buildSelectUdBiBuildingByIdsSql,
    buildSelectUdBuildingRootObjectIdOnlySql,
    buildSelectUdBuildingCatalogTemplateIdSql,
    buildSelectUdBiBuildingRootColumnsSql,
    buildSelectUdBiObjectSubtreeSql,
    buildSelectDocumentStoreRowExistsSql,
    buildUpdateDocumentStoreCompatSql,
    buildInsertDocumentStoreCompatSql,
} from './kysely/sqliteSqlBuilders.js'
import { randomOfflineUuid } from './offlineSyncMeta.js'

/** 历史 UD 根目录下业务库文件名（仅用于一次性重命名到 {@link buildUdUserDbFilename}） */
const LEGACY_UD_PACKAGE_DB = 'package.db'

export const UL_BRIDGE_DB_NAME = 'data.db'

/** 用户 UD 业务库文件名，如 u95.db（95 为登录用户 id） */
export function buildUdUserDbFilename(userId) {
    const id = userId != null && userId !== '' ? String(userId).trim() : ''
    if (!id) throw new Error('缺少用户 id，无法确定用户库文件名')
    return `u${id}.db`
}

function resolveUdUserIdForDb(explicitUserId) {
    if (explicitUserId != null && explicitUserId !== '') {
        return String(explicitUserId).trim()
    }
    try {
        return String(unref(idStore().userId) || '').trim()
    } catch {
        return ''
    }
}

function udPackageDbRel(rootDir, explicitUserId) {
    const id = resolveUdUserIdForDb(explicitUserId)
    if (id) return `${rootDir}/${buildUdUserDbFilename(id)}`
    return `${rootDir}/${LEGACY_UD_PACKAGE_DB}`
}

const _legacyUdDbRenameChecked = new Set()

/**
 * 若仍存在 package.db 且尚无 u{id}.db，则重命名为新文件名（升级兼容）。
 */
function renameLegacyPackageDbIfNeeded(rootDir, userId) {
    return new Promise((resolve) => {
        if (!rootDir || !userId || typeof plus === 'undefined' || !plus.io) {
            resolve()
            return
        }
        const newName = buildUdUserDbFilename(userId)
        const key = `${rootDir}\t${newName}`
        if (_legacyUdDbRenameChecked.has(key)) {
            resolve()
            return
        }
        _legacyUdDbRenameChecked.add(key)
        plus.io.resolveLocalFileSystemURL(
            '_doc/',
            (docEntry) => {
                docEntry.getDirectory(
                    rootDir,
                    {},
                    (udEntry) => {
                        udEntry.getFile(
                            LEGACY_UD_PACKAGE_DB,
                            {},
                            (pkgFile) => {
                                udEntry.getFile(
                                    newName,
                                    { create: false },
                                    () => resolve(),
                                    () => {
                                        pkgFile.moveTo(
                                            udEntry,
                                            newName,
                                            () => {
                                                console.log(
                                                    `[UD SQLite] 已将 ${LEGACY_UD_PACKAGE_DB} 重命名为 ${newName}`
                                                )
                                                resolve()
                                            },
                                            () => resolve()
                                        )
                                    }
                                )
                            },
                            () => resolve()
                        )
                    },
                    () => resolve()
                )
            },
            () => resolve()
        )
    })
}

async function beforeUdDbAccess(rootDir, explicitUserId) {
    const id = resolveUdUserIdForDb(explicitUserId)
    if (id) await renameLegacyPackageDbIfNeeded(rootDir, id)
}

function ulBridgeDbRel(ulRoot, buildingId) {
    return `${ulRoot}/building/${buildingId}/${UL_BRIDGE_DB_NAME}`
}

async function migrateDocumentStoreOfflineColumns(dbName) {
    for (const sql of DOCUMENT_STORE_OFFLINE_ALTER_SQL) {
        try {
            await executeSqlPromise(dbName, sql)
        } catch (e) {
            const m = String(e?.message || '')
            if (!/duplicate column|duplicate column name/i.test(m)) throw e
        }
    }
}

async function ensureUdSchema(dbName) {
    await applySchemaStatements(dbName, DOCUMENT_STORE_DDL + UD_RELATION_DDL)
    await migrateDocumentStoreOfflineColumns(dbName)
}

async function ensureUlSchema(dbName) {
    await applySchemaStatements(dbName, DOCUMENT_STORE_DDL + UL_RELATION_DDL)
    await migrateDocumentStoreOfflineColumns(dbName)
}

async function selectDocumentStoreOfflineMeta(dbName, docType, docId) {
    const rows = await selectSqlPromise(dbName, buildSelectDocumentStoreOfflineMetaSql(docType, docId))
    return rows[0] || null
}

function metaOfflineUuid(row) {
    if (!row) return null
    return row.offline_uuid ?? row.OFFLINE_UUID ?? null
}

function metaOfflineDeleted(row) {
    if (!row) return 0
    const v = row.offline_deleted ?? row.OFFLINE_DELETED
    return v ? 1 : 0
}

/**
 * @param {{ offlineUuid?: string, offlineDeleted?: boolean, isOfflineData?: boolean }} [writeOpts]
 */
function buildOfflineUpsertFields(existing, writeOpts = {}) {
    const uuid = writeOpts.offlineUuid ?? metaOfflineUuid(existing) ?? randomOfflineUuid()
    const offlineDeleted =
        writeOpts.offlineDeleted !== undefined ? (writeOpts.offlineDeleted ? 1 : 0) : metaOfflineDeleted(existing)
    const isOfflineData =
        writeOpts.isOfflineData !== undefined ? (writeOpts.isOfflineData ? 1 : 0) : 1
    return { offlineUuid: uuid, offlineDeleted, isOfflineData }
}

const MIGRATE_ROW_META = () => ({
    isOfflineData: 0,
    offlineDeleted: 0,
    offlineUuid: randomOfflineUuid(),
})

function docRel(p) {
    if (!p) return p
    return p.startsWith('_doc/') ? p : `_doc/${p.replace(/^\//, '')}`
}

/**
 * @param {string} explicitUserId 可选；不传则从 idStore.userId 解析，用于定位 u{id}.db
 */
export async function readUdDocument(rootDir, docType, docId, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir) {
        console.log('[UD SQLite] readUdDocument 跳过: sqlite=', hasBusinessSqlite(), 'rootDir=', rootDir)
        return null
    }
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    console.log('[UD SQLite] readUdDocument 打开:', rel, 'docType=', docType, 'docId=', docId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const sql = buildSelectDocumentStorePayloadSql(docType, docId)
            const rows = await selectSqlPromise(name, sql)
            console.log('[UD SQLite] document_store 查询结果: rows=', rows.length, 'docType=', docType, 'docId=', docId)
            if (rows.length) {
                try {
                    const raw = rows[0].payload ?? rows[0].PAYLOAD
                    return JSON.parse(raw)
                } catch {
                    return null
                }
            }
            return null
        })
    } catch (e) {
        console.error('[UD SQLite] readUdDocument 失败:', e)
        return null
    }
}

/**
 * 当 document_store 无 projects/root 行时，从 bi_project 关系表读取项目列表作为回退。
 * 返回格式与 readUdDocument 写入 document_store 的 JSON 保持一致。
 */
export async function readUdRelationalProjects(rootDir, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir) return null
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const rows = await selectSqlPromise(name, buildSelectUdBiProjectAllOrderedSql())
            if (!rows || rows.length === 0) return null
            console.log('[UD SQLite] bi_project 回退命中, 行数:', rows.length)
            return { code: 0, msg: 'success', projects: rows }
        })
    } catch (e) {
        console.error('[UD SQLite] readUdRelationalProjects 失败:', e)
        return null
    }
}

/**
 * 当 document_store 无 task/{projectId} 行时，从 bi_task + bi_building 关系表读取任务列表。
 */
export async function readUdRelationalTasks(rootDir, projectId, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir) return null
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const pid = Number(projectId)
            const taskSql = buildSelectUdBiTaskByProjectIdSql(pid)
            const taskRows = await selectSqlPromise(name, taskSql)
            if (!taskRows || taskRows.length === 0) return null

            const buildingIds = [...new Set(taskRows.map(t => t.building_id).filter(Boolean))]
            const buildingMap = {}
            if (buildingIds.length > 0) {
                try {
                    const bRows = await selectSqlPromise(
                        name,
                        buildSelectUdBiBuildingByIdsSql(buildingIds)
                    )
                    for (const b of (bRows || [])) buildingMap[b.id] = b
                } catch { /* bi_building 可能不存在或为空 */ }
            }

            const tasks = taskRows.map(t => ({
                ...t,
                buildingId: t.building_id ?? t.buildingId,
                projectId: t.project_id ?? t.projectId,
                building: buildingMap[t.building_id] || null
            }))
            console.log('[UD SQLite] bi_task 回退命中, 行数:', tasks.length)
            return { code: 0, msg: 'success', tasks }
        })
    } catch (e) {
        console.error('[UD SQLite] readUdRelationalTasks 失败:', e)
        return null
    }
}

/**
 * 从 bi_building 读取指定桥梁的 root_object_id（构件树根 id）。
 */
export async function readBuildingRootObjectId(rootDir, buildingId, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir) return null
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const bid = Number(buildingId)
            if (isNaN(bid)) return null
            const rows = await selectSqlPromise(
                name,
                buildSelectUdBuildingRootObjectIdOnlySql(bid)
            )
            if (rows.length > 0) {
                const v = rows[0].root_object_id ?? rows[0].ROOT_OBJECT_ID
                return v != null ? Number(v) : null
            }
            return null
        })
    } catch (e) {
        console.error('[UD SQLite] readBuildingRootObjectId 失败:', e)
        return null
    }
}

function gfObj(row, ...keys) {
    if (!row || typeof row !== 'object') return undefined
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) return row[k]
        const lower = k.toLowerCase()
        for (const rk of Object.keys(row)) {
            if (rk.toLowerCase() === lower) return row[rk]
        }
    }
    return undefined
}

/**
 * 桥跨实例：bi_building.root_object_id → bi_object.id → template_object_id，
 * 即 common.db（bi_template_object）里桥型模板根 id（与 loadBridgeTemplateTree 参数一致）。
 * 注意：不要用 root_object_id（实例 id，如 1034167）去查模板库。
 */
export async function readUdBuildingCatalogTemplateId(rootDir, buildingId, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir) return null
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const bid = Number(buildingId)
            if (isNaN(bid)) return null
            let rows
            try {
                rows = await selectSqlPromise(
                    name,
                    buildSelectUdBuildingCatalogTemplateIdSql(bid)
                )
            } catch (e) {
                console.warn('[UD SQLite] readUdBuildingCatalogTemplateId:', e?.message || e)
                return null
            }
            if (!rows?.length) return null
            const tid = gfObj(rows[0], 'tid', 'template_object_id', 'TEMPLATE_OBJECT_ID')
            const n = tid != null && tid !== '' ? Number(tid) : NaN
            return Number.isFinite(n) && n > 0 ? n : null
        })
    } catch (e) {
        console.error('[UD SQLite] readUdBuildingCatalogTemplateId 失败:', e)
        return null
    }
}

/**
 * 实例树上某节点若带有与自身 id 不同的 templateObjectId，一般为 common.db 模板根 id（服务端偶发根节点未写）。
 */
export function pickCatalogTemplateIdFromInstanceTree(payload) {
    if (!payload || typeof payload !== 'object') return null
    const rootId = payload.id != null ? Number(payload.id) : NaN
    const stack = Array.isArray(payload.children) ? [...payload.children] : []
    while (stack.length) {
        const node = stack.shift()
        if (!node || typeof node !== 'object') continue
        const nid = node.id != null ? Number(node.id) : NaN
        const tpl = node.templateObjectId != null ? Number(node.templateObjectId) : NaN
        if (
            Number.isFinite(tpl) &&
            tpl > 0 &&
            tpl !== nid &&
            (!Number.isFinite(rootId) || tpl !== rootId)
        ) {
            return tpl
        }
        if (Array.isArray(node.children)) stack.push(...node.children)
    }
    return null
}

/**
 * UL/data.db 或 Pinia 里缓存的构件树常把实例根 id 误写入 templateObjectId；
 * 用 UD 库解析真正的 common.db 模板根 id 并写回展示用对象（不写库，避免循环）。
 */
export async function enrichObjectPayloadCatalogTemplateId(objectPayload, udRootDir, buildingId, explicitUserId) {
    if (!objectPayload || typeof objectPayload !== 'object') return objectPayload
    const rid = objectPayload.id != null ? Number(objectPayload.id) : NaN
    const tidRaw = objectPayload.templateObjectId
    const tid = tidRaw != null && tidRaw !== '' ? Number(tidRaw) : NaN
    const confusing =
        !Number.isFinite(tid) ||
        tid <= 0 ||
        (Number.isFinite(rid) && tid === rid)
    if (!confusing) return objectPayload

    let catalogId = null
    if (hasBusinessSqlite() && udRootDir && buildingId != null && buildingId !== '') {
        catalogId = await readUdBuildingCatalogTemplateId(udRootDir, buildingId, explicitUserId)
    }
    if (!catalogId) {
        catalogId = pickCatalogTemplateIdFromInstanceTree(objectPayload)
    }
    if (!catalogId) return objectPayload

    console.log(
        '[UD SQLite] enrich templateObjectId:',
        tidRaw,
        '→',
        catalogId,
        '(buildingId=',
        buildingId,
        ')'
    )
    return { ...objectPayload, templateObjectId: catalogId }
}

/**
 * 从 UD 数据库的 bi_object 表读取构件树（服务端若下发完整实例子树则优先于模板）。
 * bi_building.root_object_id → bi_object 树根 → 按 ancestors 获取全部后代 → 组装层级树。
 */
export async function readUdRelationalObjectTree(rootDir, buildingId, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir) return null
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const bid = Number(buildingId)
            if (isNaN(bid)) return null

            const bRows = await selectSqlPromise(
                name,
                buildSelectUdBiBuildingRootColumnsSql(bid)
            )
            if (!bRows.length) return null
            const rootObjId = Number(gfObj(bRows[0], 'root_object_id', 'ROOT_OBJECT_ID'))
            if (!rootObjId || isNaN(rootObjId)) return null

            let objectRows
            try {
                const rid = rootObjId
                objectRows = await selectSqlPromise(
                    name,
                    buildSelectUdBiObjectSubtreeSql(rid)
                )
            } catch (e) {
                console.warn('[UD SQLite] bi_object 查询失败 (表可能不存在):', e?.message || e)
                return null
            }
            if (!objectRows || objectRows.length === 0) return null

            const byId = new Map()
            for (const row of objectRows) {
                const nid = gfObj(row, 'id')
                byId.set(nid, {
                    id: nid,
                    name: gfObj(row, 'name') ?? '',
                    parentId: gfObj(row, 'parent_id', 'parentId') ?? null,
                    ancestors: gfObj(row, 'ancestors') ?? '',
                    status: gfObj(row, 'status') ?? null,
                    delFlag: gfObj(row, 'del_flag', 'delFlag') ?? null,
                    weight: gfObj(row, 'weight') ?? null,
                    standardWeight: gfObj(row, 'standard_weight', 'standardWeight') ?? null,
                    props: gfObj(row, 'props') ?? '',
                    templateObjectId: gfObj(row, 'template_object_id', 'templateObjectId') ?? null,
                    createBy: gfObj(row, 'create_by', 'createBy') ?? null,
                    createTime: gfObj(row, 'create_time', 'createTime') ?? null,
                    updateBy: gfObj(row, 'update_by', 'updateBy') ?? null,
                    updateTime: gfObj(row, 'update_time', 'updateTime') ?? null,
                    remark: gfObj(row, 'remark') ?? null,
                    orderNum: gfObj(row, 'weight') ?? gfObj(row, 'id') ?? 0,
                    children: [],
                    diseaseTypes: [],
                    warnNumber: 0,
                    diseaseTypeCount: null,
                    parentName: null
                })
            }

            const roots = []
            for (const [, node] of byId) {
                const pid = node.parentId
                const isRoot = pid === null || pid === undefined || pid === '' || Number(pid) === 0
                if (isRoot) {
                    roots.push(node)
                } else {
                    const parent = byId.get(Number(pid)) || byId.get(pid)
                    if (parent) parent.children.push(node)
                    else roots.push(node)
                }
            }

            const sortRec = (n) => {
                n.children.sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0))
                n.children.forEach(sortRec)
            }
            roots.forEach(sortRec)

            const root = roots.find(r => r.id === rootObjId) || roots[0]
            if (!root) return null

            console.log('[UD SQLite] bi_object 构件树命中, root_object_id=', rootObjId,
                '节点数:', objectRows.length, 'children:', root.children.length)
            const rawTpl = root.templateObjectId
            const tplNum = rawTpl != null && rawTpl !== '' ? Number(rawTpl) : NaN
            const resolvedCatalogTpl =
                Number.isFinite(tplNum) && tplNum > 0 && tplNum !== rootObjId ? tplNum : null
            return {
                ...root,
                buildingId: bid,
                templateObjectId: resolvedCatalogTpl,
                Iscommit: false,
                commit: 2,
                warning: false
            }
        })
    } catch (e) {
        console.error('[UD SQLite] readUdRelationalObjectTree 失败:', e)
        return null
    }
}

/**
 * 读取 document_store 离线同步字段（上传前组装变更集）
 */
export async function readUdDocumentOfflineMeta(rootDir, docType, docId, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir) return null
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const row = await selectDocumentStoreOfflineMeta(name, docType, docId)
            if (!row) return null
            return {
                offlineUuid: metaOfflineUuid(row),
                offlineDeleted: metaOfflineDeleted(row) === 1,
                isOfflineData:
                    Number(row.is_offline_data ?? row.IS_OFFLINE_DATA ?? 0) === 1,
                updatedAt: row.updated_at ?? row.UPDATED_AT ?? null,
            }
        })
    } catch (e) {
        console.error('[UD SQLite] readUdDocumentOfflineMeta 失败:', e)
        return null
    }
}

/**
 * document_store 写入：避免 INSERT ... ON CONFLICT DO UPDATE（部分 Android SQLite 解析报错 near "on"）。
 * 使用 SELECT + UPDATE / INSERT。
 * @param {{ offlineUuid?: string|null, offlineDeleted?: number, isOfflineData?: number }} meta
 */
async function executeDocumentStoreUpsertCompat(dbName, docType, docId, payloadJsonString, updatedAtIso, meta = {}) {
    const offlineUuid =
        meta.offlineUuid != null && meta.offlineUuid !== ''
            ? String(meta.offlineUuid)
            : null
    const offlineDeleted =
        meta.offlineDeleted != null ? Number(meta.offlineDeleted) : 0
    const isOfflineData =
        meta.isOfflineData != null ? Number(meta.isOfflineData) : 0

    const sel = buildSelectDocumentStoreRowExistsSql(docType, docId)
    const rows = await selectSqlPromise(dbName, sel)
    if (rows && rows.length > 0) {
        const upd = buildUpdateDocumentStoreCompatSql(
            docType,
            docId,
            payloadJsonString,
            updatedAtIso,
            offlineUuid,
            offlineDeleted,
            isOfflineData
        )
        await executeSqlPromise(dbName, upd)
    } else {
        const ins = buildInsertDocumentStoreCompatSql(
            docType,
            docId,
            payloadJsonString,
            updatedAtIso,
            offlineUuid,
            offlineDeleted,
            isOfflineData
        )
        await executeSqlPromise(dbName, ins)
    }
}

/**
 * @param {string} explicitUserId 可选；不传则从 idStore.userId 解析
 * @param {{ offlineUuid?: string, offlineDeleted?: boolean, isOfflineData?: boolean }} [writeOpts] isOfflineData 默认 true（本地保存视为待同步）；JSON 迁入用 { isOfflineData: false }
 */
export async function writeUdDocument(rootDir, docType, docId, dataObj, explicitUserId, writeOpts = {}) {
    if (!hasBusinessSqlite() || !rootDir) return false
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    return withOpenDatabase(rel, async (name) => {
        await ensureUdSchema(name)
        const existing = await selectDocumentStoreOfflineMeta(name, docType, docId)
        const meta = buildOfflineUpsertFields(existing, writeOpts)
        await executeDocumentStoreUpsertCompat(
            name,
            docType,
            docId,
            JSON.stringify(dataObj),
            new Date().toISOString(),
            meta
        )
        if (docType === 'projects' && docId === 'root') {
            await deleteDocFileIfExists(docRel(`${rootDir}/project/projects.json`))
        } else if (docType === 'task') {
            await deleteDocFileIfExists(docRel(`${rootDir}/project/${docId}/task.json`))
        }
        return true
    })
}

/** 软删除标记（payload 保留最后一次内容或调用方传入空对象） */
export async function markUdDocumentDeleted(rootDir, docType, docId, explicitUserId, deleted = true) {
    const payload = (await readUdDocument(rootDir, docType, docId, explicitUserId)) || {}
    return writeUdDocument(rootDir, docType, docId, payload, explicitUserId, {
        offlineDeleted: deleted,
        isOfflineData: true,
    })
}

function extractProjectIdsFromProjectsPayload(projectsPayload) {
    const arr = projectsPayload?.data?.projects ?? projectsPayload?.projects ?? []
    const ids = arr.map((p) => (p && p.id != null ? String(p.id) : null)).filter(Boolean)
    return [...new Set(ids)]
}

/**
 * 将 UD 根目录下的 project/projects.json 与各 project/{id}/task.json 一次性迁入 u{userId}.db，
 * 并删除已迁移的 JSON。若 projects 已在库中，则只补迁仍存在于磁盘上的 task.json。
 */
export async function migrateUdWorkspaceDocuments(rootDir) {
    return migrateUdWorkspaceDocumentsWithOptions(rootDir, { deleteJson: true })
}

/**
 * 将 UD 根目录下 JSON 导入 u{userId}.db（options.userId 可显式传入，否则用 idStore）。
 * @param {string} rootDir 例如 `UD-2025...-user`
 * @param {{deleteJson?: boolean, userId?: string|number}} options deleteJson=false 时保留 JSON 作为备份（仍建议业务读取只走 SQLite）
 */
export async function migrateUdWorkspaceDocumentsWithOptions(rootDir, options = {}) {
    const { deleteJson = true, userId: explicitUserId } = options || {}
    if (!hasBusinessSqlite() || !rootDir) return
    await beforeUdDbAccess(rootDir, explicitUserId)
    const dbRel = udPackageDbRel(rootDir, explicitUserId)
    const projectJsonRel = docRel(`${rootDir}/project/projects.json`)

    await withOpenDatabase(dbRel, async (dbName) => {
        await ensureUdSchema(dbName)

        let projectsPayload = null
        try {
            projectsPayload = await readDocJsonFile(projectJsonRel)
        } catch {
            projectsPayload = null
        }

        if (projectsPayload != null) {
            const nowIso = new Date().toISOString()
            await executeDocumentStoreUpsertCompat(
                dbName,
                'projects',
                'root',
                JSON.stringify(projectsPayload),
                nowIso,
                MIGRATE_ROW_META()
            )
            if (deleteJson) {
                await deleteDocFileIfExists(projectJsonRel)
            }
            const ids = extractProjectIdsFromProjectsPayload(projectsPayload)
            for (const pid of ids) {
                const taskRel = docRel(`${rootDir}/project/${pid}/task.json`)
                try {
                    const taskData = await readDocJsonFile(taskRel)
                    await executeDocumentStoreUpsertCompat(
                        dbName,
                        'task',
                        String(pid),
                        JSON.stringify(taskData),
                        nowIso,
                        MIGRATE_ROW_META()
                    )
                    if (deleteJson) {
                        await deleteDocFileIfExists(taskRel)
                    }
                } catch {
                    /* 无该项目的 task 文件则跳过 */
                }
            }
            return
        }

        const rows = await selectSqlPromise(dbName, buildSelectDocumentStorePayloadSql('projects', 'root'))
        if (!rows.length) return
        let pdata = null
        try {
            const raw = rows[0].payload ?? rows[0].PAYLOAD
            pdata = JSON.parse(raw)
        } catch {
            return
        }
        const ids = extractProjectIdsFromProjectsPayload(pdata)
        const nowIso2 = new Date().toISOString()
        for (const pid of ids) {
            const taskRel = docRel(`${rootDir}/project/${pid}/task.json`)
            try {
                const taskData = await readDocJsonFile(taskRel)
                await executeDocumentStoreUpsertCompat(
                    dbName,
                    'task',
                    String(pid),
                    JSON.stringify(taskData),
                    nowIso2,
                    MIGRATE_ROW_META()
                )
                if (deleteJson) {
                    await deleteDocFileIfExists(taskRel)
                }
            } catch {
                /* 已迁过或不存在 */
            }
        }
    })
}

/**
 * 与 {@link migrateUdWorkspaceDocuments} 相同，但捕获异常，便于本地联调时 SQLite 出问题仍可回退读 JSON。
 */
export async function safeMigrateUdWorkspaceDocuments(rootDir) {
    return safeMigrateUdWorkspaceDocumentsWithOptions(rootDir, { deleteJson: true })
}

export async function safeMigrateUdWorkspaceDocumentsWithOptions(rootDir, options = {}) {
    try {
        await migrateUdWorkspaceDocumentsWithOptions(rootDir, options)
    } catch (e) {
        console.error('[UD SQLite] migrateUdWorkspaceDocuments 失败，忽略并继续尝试 JSON:', e)
    }
}

export async function readUlBridgeDocument(ulRoot, buildingId, docType, docId) {
    if (!hasBusinessSqlite() || !ulRoot) return null
    const rel = ulBridgeDbRel(ulRoot, buildingId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUlSchema(name)
            const rows = await selectSqlPromise(name, buildSelectDocumentStorePayloadSql(docType, docId))
            if (rows.length) {
                try {
                    const raw = rows[0].payload ?? rows[0].PAYLOAD
                    return JSON.parse(raw)
                } catch {
                    return null
                }
            }
            // 已启用业务 SQLite 时读路径不再读 JSON 做懒迁移；数据以库为准
            return null
        })
    } catch (e) {
        console.error('[UL SQLite] readUlBridgeDocument 失败:', e)
        return null
    }
}

/**
 * UL data.db 中与 {@link readUdDocumentOfflineMeta} 相同语义
 */
export async function readUlBridgeDocumentOfflineMeta(ulRoot, buildingId, docType, docId) {
    if (!hasBusinessSqlite() || !ulRoot) return null
    const rel = ulBridgeDbRel(ulRoot, buildingId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUlSchema(name)
            const row = await selectDocumentStoreOfflineMeta(name, docType, docId)
            if (!row) return null
            return {
                offlineUuid: metaOfflineUuid(row),
                offlineDeleted: metaOfflineDeleted(row) === 1,
                isOfflineData:
                    Number(row.is_offline_data ?? row.IS_OFFLINE_DATA ?? 0) === 1,
                updatedAt: row.updated_at ?? row.UPDATED_AT ?? null,
            }
        })
    } catch (e) {
        console.error('[UL SQLite] readUlBridgeDocumentOfflineMeta 失败:', e)
        return null
    }
}

/**
 * @param {{ offlineUuid?: string, offlineDeleted?: boolean, isOfflineData?: boolean }} [writeOpts]
 */
export async function writeUlBridgeDocument(ulRoot, buildingId, docType, docId, dataObj, writeOpts = {}) {
    if (!hasBusinessSqlite() || !ulRoot) return false
    const rel = ulBridgeDbRel(ulRoot, buildingId)
    return withOpenDatabase(rel, async (name) => {
        await ensureUlSchema(name)
        const existing = await selectDocumentStoreOfflineMeta(name, docType, docId)
        const meta = buildOfflineUpsertFields(existing, writeOpts)
        await executeDocumentStoreUpsertCompat(
            name,
            docType,
            docId,
            JSON.stringify(dataObj),
            new Date().toISOString(),
            meta
        )
        if (docType === 'property' && docId === 'default') {
            await deleteDocFileIfExists(docRel(`${ulRoot}/building/${buildingId}/property.json`))
        } else if (docType === 'object' && docId === 'default') {
            await deleteDocFileIfExists(docRel(`${ulRoot}/building/${buildingId}/object.json`))
        } else if (docType === 'disease') {
            await deleteDocFileIfExists(docRel(`${ulRoot}/building/${buildingId}/disease/${docId}.json`))
        } else if (docType === 'frontPhoto' && docId === 'default') {
            await deleteDocFileIfExists(docRel(`${ulRoot}/building/${buildingId}/frontPhoto.json`))
        }
        return true
    })
}

export async function markUlBridgeDocumentDeleted(ulRoot, buildingId, docType, docId, deleted = true) {
    const payload = (await readUlBridgeDocument(ulRoot, buildingId, docType, docId)) || {}
    return writeUlBridgeDocument(ulRoot, buildingId, docType, docId, payload, {
        offlineDeleted: deleted,
        isOfflineData: true,
    })
}

/** UD 病害 docId：buildingId::yearId */
export function udDiseaseDocId(buildingId, yearId) {
    return `${buildingId}::${yearId}`
}

/**
 * 从 UD 用户库（u{userId}.db）列出该桥梁已有病害文档的年份
 * @param {string} rootDir UD 根目录，如 findMatchingDirectory 返回值
 * @param {string|number} buildingId
 * @param {string} [explicitUserId] 可选用户 id
 * @returns {Promise<string[]>} 四位年份字符串数组
 */
export async function listUdDiseaseYears(rootDir, buildingId, explicitUserId) {
    if (!hasBusinessSqlite() || !rootDir || buildingId == null || buildingId === '') return []
    await beforeUdDbAccess(rootDir, explicitUserId)
    const rel = udPackageDbRel(rootDir, explicitUserId)
    const prefix = `${String(buildingId)}::`
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUdSchema(name)
            const rows = await selectSqlPromise(name, buildSelectUdDiseaseDocIdsByPrefixSql(prefix))
            const years = []
            for (const row of rows) {
                const docId = row.doc_id ?? row.DOC_ID
                if (typeof docId === 'string' && docId.startsWith(prefix)) {
                    const y = docId.slice(prefix.length)
                    if (/^\d{4}$/.test(y)) years.push(y)
                }
            }
            return years
        })
    } catch (e) {
        console.error('[UD SQLite] listUdDiseaseYears 失败:', e)
        return []
    }
}

/**
 * 从 UL data.db 列出该桥梁已有病害文档的年份
 * @param {string} ulRoot UL 根目录
 * @param {string|number} buildingId
 * @returns {Promise<string[]>}
 */
export async function listUlDiseaseYears(ulRoot, buildingId) {
    if (!hasBusinessSqlite() || !ulRoot || buildingId == null || buildingId === '') return []
    const rel = ulBridgeDbRel(ulRoot, buildingId)
    try {
        return await withOpenDatabase(rel, async (name) => {
            await ensureUlSchema(name)
            const rows = await selectSqlPromise(name, buildSelectUlDiseaseDocIdsSql())
            const years = []
            for (const row of rows) {
                const docId = row.doc_id ?? row.DOC_ID
                if (typeof docId === 'string' && /^\d{4}$/.test(docId)) years.push(docId)
            }
            return years
        })
    } catch (e) {
        console.error('[UL SQLite] listUlDiseaseYears 失败:', e)
        return []
    }
}

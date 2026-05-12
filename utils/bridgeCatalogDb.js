import {
    recordBuiltinCommonDbReadyDisplay,
    recordCommonDbDisplayIfMissing,
} from './appSettingSyncMeta.js'
import { executeSqlPromise } from './businessSqliteCore.js'
import {
    buildSelectCatalogDiseaseScalesByTypeCodeSql,
    buildSelectCatalogTemplateObjectsByTreeWhereSql,
    buildSelectCatalogTemplateDiseaseJoinSql,
    buildSelectCatalogBridgeTypeRootOptionsSql,
} from './kysely/sqliteSqlBuilders.js'
import {
    loadSelectColumnOverrideMap,
    applySelectColumnOverrides,
} from './bridgeTemplateJsonSelectColumn.js'
import { resolveLocalFileSystemURLWithVariants } from './plusIoPathVariants.js'

/**
 * 桥型目录库 common.db
 * 开发：将文件放在项目 `static/sqlite/common.db`
 * 运行：App 内为 `_www/static/sqlite/common.db`，首次复制到 `_doc/sqlite/common.db`
 * 表：bi_template_object、bi_template_object_disease_type、bi_disease_type、bi_disease_scale
 */

/** common.db 在 _doc 下的相对路径 */
export const COMMON_CATALOG_DOC_REL_PATH = 'sqlite/common.db'
const DOC_COMMON_DB = `_doc/${COMMON_CATALOG_DOC_REL_PATH}`
/** 与 static/sqlite/ 对应（uni-app 打包进 _www/static/） */
const ASSET_SQLITE_PREFIX = '_www/static/sqlite/'

/** 更换内置库、落盘路径或结构变更时递增，触发从包内复制或迁移 */
const CATALOG_COPY_FLAG_KEY = 'common_catalog_sqlite_v5_static_sqlite'

/** plus.sqlite 连接名（与文件路径独立，仅作句柄） */
const COMMON_CATALOG_DB_NAME = 'CommonCatalogDB'
const COMMON_CATALOG_FILE = 'common.db'

/** 按桥型根 id 过滤 bi_template_object：根节点 id = bid，子树 ancestors 以 0,bid 为前缀 */
function sqlTreeFilterForBridge(bid) {
    const b = Number(bid)
    return `(id = ${b} OR ancestors = '0,' || ${b} OR ancestors LIKE '0,' || ${b} || ',%')`
}

function sqlTreeFilterForBridgeAlias(alias, bid) {
    const b = Number(bid)
    return `(${alias}.id = ${b} OR ${alias}.ancestors = '0,' || ${b} OR ${alias}.ancestors LIKE '0,' || ${b} || ',%')`
}

function gf(row, ...keys) {
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

function selectSqlPromise(dbName, sql) {
    return new Promise((resolve, reject) => {
        plus.sqlite.selectSql({
            name: dbName,
            sql,
            success: (rows) => resolve(rows || []),
            fail: (e) => reject(e)
        })
    })
}

/** 旧版 common.db 无 bi_disease_type.select_column，JOIN 会报 no such column（日志常被截成 dt.select…） */
async function ensureBiDiseaseTypeSelectColumnExists(dbName) {
    const rows = await selectSqlPromise(dbName, 'PRAGMA table_info(bi_disease_type)')
    const has = rows.some((r) => {
        const n = gf(r, 'name')
        return String(n || '').toLowerCase() === 'select_column'
    })
    if (!has) {
        await executeSqlPromise(dbName, 'ALTER TABLE bi_disease_type ADD COLUMN select_column INTEGER')
    }
}

function openDbPromise(name, path) {
    return new Promise((resolve, reject) => {
        if (plus.sqlite.isOpenDatabase({ name, path })) {
            resolve()
            return
        }
        plus.sqlite.openDatabase({
            name,
            path,
            success: () => resolve(),
            fail: (e) => reject(e)
        })
    })
}

function closeDbPromise(name) {
    return new Promise((resolve) => {
        plus.sqlite.closeDatabase({
            name,
            success: () => resolve(),
            fail: () => resolve()
        })
    })
}

/**
 * 从打包资源复制 common.db 到 _doc/sqlite/common.db；若仅有旧路径 _doc/common.db 则先迁移
 */
export function ensureBridgeCatalogFiles() {
    return new Promise((resolve, reject) => {
        if (uni.getStorageSync(CATALOG_COPY_FLAG_KEY)) {
            recordCommonDbDisplayIfMissing()
            resolve()
            return
        }

        const markDone = () => {
            try {
                uni.setStorageSync(CATALOG_COPY_FLAG_KEY, '1')
            } catch (e) {
                /* ignore */
            }
            resolve()
        }

        const copyFromBundleToSqliteDir = (sqliteDir) => {
            const fname = COMMON_CATALOG_FILE
            const srcPath = ASSET_SQLITE_PREFIX + fname
            const afterRemove = (srcEntry) => () => {
                srcEntry.copyTo(
                    sqliteDir,
                    fname,
                    () => {
                        recordBuiltinCommonDbReadyDisplay()
                        markDone()
                    },
                    (err) => {
                        console.error('复制数据库失败:', fname, err)
                        reject(err)
                    }
                )
            }
            plus.io.resolveLocalFileSystemURL(
                srcPath,
                (srcEntry) => {
                    sqliteDir.getFile(
                        fname,
                        { create: false },
                        (existing) => {
                            existing.remove(afterRemove(srcEntry), afterRemove(srcEntry))
                        },
                        afterRemove(srcEntry)()
                    )
                },
                (err) => {
                    const code = err && (err.code ?? err.CODE)
                    const msg = String((err && err.message) || '')
                    const missing =
                        code === 1 ||
                        code === 14 ||
                        /路径不存在|not found|no such file/i.test(msg)
                    if (missing) {
                        console.warn(
                            '[bridgeCatalog] 未找到 static/sqlite/common.db（开发阶段请放在该路径并重新运行到设备）',
                            srcPath
                        )
                        resolve()
                        return
                    }
                    console.error('找不到预置库:', srcPath, err)
                    reject(err)
                }
            )
        }

        plus.io.resolveLocalFileSystemURL(
            '_doc/',
            (docEntry) => {
                const tryFinishIfNewPathExists = (onNeedCopy) => {
                    plus.io.resolveLocalFileSystemURL(
                        DOC_COMMON_DB,
                        () => {
                            recordCommonDbDisplayIfMissing()
                            markDone()
                        },
                        () => onNeedCopy()
                    )
                }

                const tryMigrateOldRoot = (onNoOld) => {
                    plus.io.resolveLocalFileSystemURL(
                        '_doc/common.db',
                        (oldEntry) => {
                            docEntry.getDirectory(
                                'sqlite',
                                { create: true },
                                (sqliteDir) => {
                                    oldEntry.moveTo(
                                        sqliteDir,
                                        'common.db',
                                        () => {
                                            recordBuiltinCommonDbReadyDisplay()
                                            markDone()
                                        },
                                        (e) => {
                                            console.warn('迁移 _doc/common.db 失败:', e)
                                            onNoOld()
                                        }
                                    )
                                },
                                reject
                            )
                        },
                        () => onNoOld()
                    )
                }

                tryFinishIfNewPathExists(() => {
                    tryMigrateOldRoot(() => {
                        docEntry.getDirectory('sqlite', { create: true }, copyFromBundleToSqliteDir, reject)
                    })
                })
            },
            reject
        )
    })
}

export async function initBridgeCatalogDb() {
    await ensureBridgeCatalogFiles()
}

/** 已从服务器或手动放置 common.db 后调用，避免再用包内旧库覆盖 _doc/sqlite/common.db */
export function markCommonCatalogSyncFromServerDone() {
    try {
        uni.setStorageSync(CATALOG_COPY_FLAG_KEY, '1')
    } catch (e) {
        console.warn('markCommonCatalogSyncFromServerDone', e)
    }
}

/** 确保 common.db 已在 _doc/sqlite 下并打开连接 */
export async function ensureCommonCatalogDbOpen() {
    await ensureBridgeCatalogFiles()
    const exists = await new Promise((resolve) => {
        if (typeof plus === 'undefined' || !plus.io || !plus.io.resolveLocalFileSystemURL) {
            resolve(false)
            return
        }
        plus.io.resolveLocalFileSystemURL(DOC_COMMON_DB, () => resolve(true), () => resolve(false))
    })
    if (!exists) {
        const err = new Error('common.db 未就绪，请在系统设置中同步基础数据库')
        err.code = 'COMMON_DB_MISSING'
        throw err
    }
    await openDbPromise(COMMON_CATALOG_DB_NAME, DOC_COMMON_DB)
    await ensureBiDiseaseTypeSelectColumnExists(COMMON_CATALOG_DB_NAME)
}

/** 历史命名，行为同 ensureCommonCatalogDbOpen */
export async function ensureBridgeInspectorDbOpen() {
    await ensureCommonCatalogDbOpen()
}

/**
 * 查询标度列表（common.db / bi_disease_scale，供病害标度 UI）
 */
export async function queryDiseaseScalesByTypeCode(typeCode) {
    await ensureCommonCatalogDbOpen()
    const sql = buildSelectCatalogDiseaseScalesByTypeCodeSql(typeCode)
    const rows = await selectSqlPromise(COMMON_CATALOG_DB_NAME, sql)
    return rows.map((r) => {
        const st = gf(r, 'status')
        const statusNum = st === null || st === undefined || st === '' ? 0 : Number(st)
        return {
            id: gf(r, 'id'),
            scale: gf(r, 'scale'),
            qualitative_description: gf(r, 'qualitative_description') ?? '',
            quantitative_description: gf(r, 'quantitative_description') ?? '',
            status: Number.isFinite(statusNum) ? statusNum : 0,
            create_time: gf(r, 'create_time') ?? '',
            update_time: gf(r, 'update_time') ?? ''
        }
    })
}

/**
 * 查询桥跨类型下拉选项（供 `structure-info.vue` 使用）。
 * 来源：common.db 的 `bi_template_object` 根节点（id 为桥型模板根 id）。
 * @returns {Promise<Array<{id:number|string,name:string}>>}
 */
export async function queryBridgeTypeOptions() {
    await ensureCommonCatalogDbOpen()
    try {
        const sql = buildSelectCatalogBridgeTypeRootOptionsSql()
        const rows = await selectSqlPromise(COMMON_CATALOG_DB_NAME, sql)
        return rows.map((r) => ({
            id: gf(r, 'id'),
            name: gf(r, 'name') ?? ''
        }))
    } finally {
        await closeDbPromise(COMMON_CATALOG_DB_NAME)
    }
}

function defRowToDiseaseType(row) {
    return {
        createBy: gf(row, 'create_by', 'createBy') ?? null,
        createTime: gf(row, 'create_time', 'createTime') ?? null,
        updateBy: gf(row, 'update_by', 'updateBy') ?? null,
        updateTime: gf(row, 'update_time', 'updateTime') ?? null,
        remark: gf(row, 'remark') ?? null,
        id: gf(row, 'id'),
        code: gf(row, 'code'),
        name: gf(row, 'name'),
        maxScale: gf(row, 'max_scale', 'maxScale'),
        minScale: gf(row, 'min_scale', 'minScale'),
        status: gf(row, 'status'),
        selectColumn: gf(row, 'select_column', 'selectColumn'),
        threshold: gf(row, 'threshold'),
        groupName: gf(row, 'group_name', 'groupName'),
        diseaseScales: null
    }
}

/**
 * bi_template_object 行 → 前端构件树节点（与既有页面字段一致）
 */
function templateRowToTreeNode(row, diseaseTypes) {
    const propsVal = gf(row, 'props')
    const pid = gf(row, 'parent_id', 'parentId')
    const parentId =
        pid === null || pid === undefined || pid === '' || Number(pid) === 0 ? null : pid
    return {
        createBy: gf(row, 'create_by', 'createBy') ?? null,
        createTime: gf(row, 'create_time', 'createTime') ?? null,
        updateBy: gf(row, 'update_by', 'updateBy') ?? null,
        updateTime: gf(row, 'update_time', 'updateTime') ?? null,
        remark: gf(row, 'remark') ?? null,
        parentName: null,
        parentId,
        orderNum: gf(row, 'order_num', 'orderNum') ?? gf(row, 'id'),
        ancestors: gf(row, 'ancestors'),
        id: gf(row, 'id'),
        name: gf(row, 'name'),
        status: gf(row, 'status'),
        delFlag: gf(row, 'del_flag', 'delFlag'),
        weight: gf(row, 'weight'),
        props: propsVal === null || propsVal === undefined ? '' : propsVal,
        diseaseTypeCount: null,
        children: [],
        diseaseTypes: diseaseTypes || []
    }
}

/**
 * 从 common.db 按桥型 templateId（根节点 id）组装构件树根对象（供病害等页面）
 */
export async function loadBridgeTemplateTree(templateId) {
    const bid = Number(templateId)
    if (!Number.isFinite(bid) || bid <= 0) {
        return null
    }

    const treeWhere = sqlTreeFilterForBridge(bid)

    await ensureCommonCatalogDbOpen()

    try {
        const nodes = await selectSqlPromise(
            COMMON_CATALOG_DB_NAME,
            buildSelectCatalogTemplateObjectsByTreeWhereSql(treeWhere)
        )
        if (!nodes.length) return null

        const disJoin = await selectSqlPromise(
            COMMON_CATALOG_DB_NAME,
            buildSelectCatalogTemplateDiseaseJoinSql(sqlTreeFilterForBridgeAlias('too', bid))
        )

        /** 模板 JSON 中的 selectColumn（common.db 缺列或全 0 时补全） */
        const selectColumnFromTemplateJson = await loadSelectColumnOverrideMap(bid)

        const diseaseByObjectId = new Map()
        for (const r of disJoin) {
            const oid = gf(r, 'template_object_id', 'templateObjectId')
            if (oid === undefined || oid === null) continue
            if (!diseaseByObjectId.has(oid)) diseaseByObjectId.set(oid, [])
            const dto = defRowToDiseaseType(r)
            applySelectColumnOverrides(dto, selectColumnFromTemplateJson)
            diseaseByObjectId.get(oid).push(dto)
        }

        const byId = new Map()
        for (const r of nodes) {
            const nid = gf(r, 'id')
            const dts = diseaseByObjectId.get(nid) || []
            byId.set(nid, { row: r, obj: templateRowToTreeNode(r, dts) })
        }

        const roots = []
        for (const [, wrap] of byId) {
            const pid = gf(wrap.row, 'parent_id', 'parentId')
            const isRoot =
                pid === null ||
                pid === undefined ||
                pid === '' ||
                Number(pid) === 0
            if (isRoot) {
                roots.push(wrap.obj)
            } else {
                const p = byId.get(pid)
                if (p) p.obj.children.push(wrap.obj)
                else roots.push(wrap.obj)
            }
        }

        const sortRec = (n) => {
            n.children.sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0))
            n.children.forEach(sortRec)
        }
        roots.forEach(sortRec)

        if (roots.length === 0) return null
        if (roots.length === 1) return roots[0]
        return roots.find((r) => r.id === bid) || roots[0]
    } finally {
        await closeDbPromise(COMMON_CATALOG_DB_NAME)
    }
}

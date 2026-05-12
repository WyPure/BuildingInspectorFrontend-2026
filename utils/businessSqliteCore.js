/**
 * App-Plus 业务 SQLite 通用封装（UD u{userId}.db / UL building/data.db）
 * 非 App 环境或未提供 plus.sqlite 时由调用方回退到 JSON。
 */

const DOC_BASE = '_doc/'

export function hasBusinessSqlite() {
    return typeof plus !== 'undefined' && plus.sqlite && typeof plus.sqlite.openDatabase === 'function'
}

export function escSql(str) {
    if (str === null || str === undefined) return ''
    return String(str).replace(/'/g, "''")
}

/** 每个连接唯一，避免 plus.sqlite 并发下 -1401 Not Open */
function uniqueConnName(dbPath) {
    const h = String(dbPath || '').length
    return `Biz_${Date.now()}_${h}_${Math.random().toString(36).slice(2, 11)}`
}

/** 同一物理库文件串行打开，避免多页面同时读同一 data.db / u{userId}.db 触发 Not Open */
const _dbPathChains = new Map()

export function openDbPromise(name, path) {
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

export function closeDbPromise(name) {
    return new Promise((resolve) => {
        plus.sqlite.closeDatabase({
            name,
            success: () => resolve(),
            fail: () => resolve()
        })
    })
}

export function selectSqlPromise(name, sql) {
    return new Promise((resolve, reject) => {
        plus.sqlite.selectSql({
            name,
            sql,
            success: (rows) => resolve(rows || []),
            fail: (e) => reject(e)
        })
    })
}

export function executeSqlPromise(name, sql) {
    return new Promise((resolve, reject) => {
        plus.sqlite.executeSql({
            name,
            sql,
            success: () => resolve(),
            fail: (e) => reject(e)
        })
    })
}

/** 读取 _doc 下相对路径的 JSON 文件（与 readJsonNew.getJsonData 行为一致） */
export function readDocJsonFile(relativePathUnderDoc) {
    return new Promise((resolve, reject) => {
        plus.io.requestFileSystem(
            plus.io.PRIVATE_DOC,
            (fs) => {
                fs.root.getFile(
                    relativePathUnderDoc,
                    { create: false },
                    (fileEntry) => {
                        fileEntry.file((file) => {
                            const reader = new plus.io.FileReader()
                            reader.onload = () => {
                                try {
                                    resolve(JSON.parse(reader.result))
                                } catch (e) {
                                    reject(e)
                                }
                            }
                            reader.onerror = (e) => reject(e)
                            reader.readAsText(file)
                        }, reject)
                    },
                    reject
                )
            },
            reject
        )
    })
}

export function deleteDocFileIfExists(relativePathUnderDoc) {
    return new Promise((resolve) => {
        plus.io.requestFileSystem(
            plus.io.PRIVATE_DOC,
            (fs) => {
                fs.root.getFile(
                    relativePathUnderDoc,
                    { create: false },
                    (fileEntry) => {
                        fileEntry.remove(
                            () => resolve(true),
                            () => resolve(false)
                        )
                    },
                    () => resolve(false)
                )
            },
            () => resolve(false)
        )
    })
}

/**
 * 执行多条建表语句（分号分隔）
 */
export async function applySchemaStatements(dbName, statements) {
    const parts = statements
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    for (const sql of parts) {
        await executeSqlPromise(dbName, sql)
    }
}

export async function withOpenDatabase(dbRelativePath, fn) {
    const path = DOC_BASE + dbRelativePath.replace(/^\/?_doc\/?/, '')
    const prev = _dbPathChains.get(path) || Promise.resolve()
    const isNotOpenError = (e) => {
        const code = Number(e?.code)
        const message = String(e?.message || '')
        return code === -1401 || /Not\s*Open/i.test(message)
    }
    const runOnce = async () => {
        const name = uniqueConnName(path)
        await openDbPromise(name, path)
        try {
            return await fn(name, path)
        } finally {
            await closeDbPromise(name)
        }
    }
    const run = async () => {
        try {
            return await runOnce()
        } catch (e) {
            // App 端偶发 open 成功后首个 SQL 仍报 -1401，这里做一次自动重试
            if (!isNotOpenError(e)) throw e
            return await runOnce()
        }
    }
    const p = prev.catch(() => {}).then(run)
    _dbPathChains.set(path, p)
    p.catch(() => {}).finally(() => {
        if (_dbPathChains.get(path) === p) {
            _dbPathChains.delete(path)
        }
    })
    return p
}

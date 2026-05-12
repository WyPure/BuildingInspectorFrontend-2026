/**
 * 将 Kysely compile() 结果转为 plus.sqlite 可执行的整段 SQL（按 ? 顺序内联参数）。
 * 字符串转义规则与 utils/businessSqliteCore.js 中 escSql 一致。
 */
function escSql(str) {
    if (str === null || str === undefined) return ''
    return String(str).replace(/'/g, "''")
}

/**
 * @param {{ sql: string, parameters: readonly unknown[] }} compiled
 * @returns {string}
 */
export function compiledQueryToExecutableSql(compiled) {
    const { sql, parameters } = compiled
    if (!sql) return ''
    let i = 0
    const out = sql.replace(/\?/g, () => {
        const v = parameters[i++]
        if (v === null || v === undefined) return 'NULL'
        if (typeof v === 'number' && Number.isFinite(v)) return String(v)
        if (typeof v === 'boolean') return v ? '1' : '0'
        return `'${escSql(String(v))}'`
    })
    if (i !== parameters.length) {
        console.warn('[compiledQueryToSqlString] 占位符 ? 数量与 parameters 不一致', {
            sql,
            countQ: i,
            paramLen: parameters.length,
        })
    }
    return out
}

/**
 * 仅用于 Kysely .compile() 生成 SQL，不连接任何数据库（DummyDriver）。
 * 执行请用 businessSqliteCore / bridgeCatalogDb 中的 selectSqlPromise、executeSqlPromise。
 */
import {
    DummyDriver,
    Kysely,
    SqliteAdapter,
    SqliteIntrospector,
    SqliteQueryCompiler,
} from 'kysely'

/** @type {import('kysely').Kysely<any> | null} */
let _instance = null

/** @returns {import('kysely').Kysely<any>} */
export function getKyselyCompileOnly() {
    if (!_instance) {
        _instance = new Kysely({
            dialect: {
                createAdapter: () => new SqliteAdapter(),
                createDriver: () => new DummyDriver(),
                createIntrospector: (db) => new SqliteIntrospector(db),
                createQueryCompiler: () => new SqliteQueryCompiler(),
            },
        })
    }
    return _instance
}

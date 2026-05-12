/**
 * 从打包内的桥型模板 JSON（static/data/{templateId}_template.json）提取病害类型的 selectColumn，
 * 用于在 common.db 的 bi_disease_type.select_column 缺失或为 0 时补全，与历史「整树 JSON」行为一致。
 *
 * App-Plus：`uni.request('/static/...')` 往往拿不到包内资源，须用 plus.io 读 `_www/static/...`。
 */

const overrideMapCache = new Map()
const inflight = new Map()

/**
 * @param {string} relFromWww 如 `static/data/9_template.json`（不含 `_www/` 前缀）
 */
function readPackagedJsonAppPlus(relFromWww) {
    return new Promise((resolve) => {
        if (typeof plus === 'undefined' || !plus.io || !plus.io.resolveLocalFileSystemURL) {
            resolve(null)
            return
        }
        const raw = `_www/${relFromWww}`
        const tryPaths = [raw]
        try {
            const conv = plus.io.convertLocalFileSystemURL(raw)
            if (conv && conv !== raw) tryPaths.push(conv)
        } catch {
            /* ignore */
        }

        const tryOne = (idx) => {
            if (idx >= tryPaths.length) {
                resolve(null)
                return
            }
            const p = tryPaths[idx]
            plus.io.resolveLocalFileSystemURL(
                p,
                (entry) => {
                    if (!entry || typeof entry.file !== 'function' || entry.isDirectory) {
                        tryOne(idx + 1)
                        return
                    }
                    entry.file(
                        (file) => {
                            try {
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                    try {
                                        const text = String(reader.result || '').replace(/^\uFEFF/, '')
                                        resolve(text ? JSON.parse(text) : null)
                                    } catch {
                                        tryOne(idx + 1)
                                    }
                                }
                                reader.onerror = () => tryOne(idx + 1)
                                reader.readAsText(file, 'utf-8')
                            } catch {
                                tryOne(idx + 1)
                            }
                        },
                        () => tryOne(idx + 1)
                    )
                },
                () => tryOne(idx + 1)
            )
        }
        tryOne(0)
    })
}

function walkCollectSelectColumns(node, outMap) {
    if (!node || typeof node !== 'object') return
    const dts = node.diseaseTypes
    if (Array.isArray(dts)) {
        for (const dt of dts) {
            if (!dt || typeof dt !== 'object') continue
            const sc = dt.selectColumn ?? dt.select_column
            const num = Number(sc)
            if (!Number.isFinite(num) || num <= 0) continue
            if (dt.id != null && dt.id !== '') {
                const id = Number(dt.id)
                if (Number.isFinite(id)) {
                    outMap.set(id, num)
                    outMap.set(String(id), num)
                }
            }
            const code = dt.code != null ? String(dt.code).trim() : ''
            if (code) outMap.set(`c:${code}`, num)
        }
    }
    const ch = node.children
    if (Array.isArray(ch)) ch.forEach((c) => walkCollectSelectColumns(c, outMap))
}

/**
 * @param {number|string} templateId 桥型根 id，与 *_template.json 文件名前缀一致
 * @returns {Promise<Map<number|string, number>>} id → selectColumn，以及 `c:${code}` → selectColumn
 */
async function loadSelectColumnOverrideMapUncached(templateId) {
    const bid = Number(templateId)
    const out = new Map()
    if (!Number.isFinite(bid) || bid <= 0) return out

    const rel = `static/data/${bid}_template.json`
    let data = await readPackagedJsonAppPlus(rel)

    if (!data) {
        data = await new Promise((resolve) => {
            try {
                uni.request({
                    url: `/static/data/${bid}_template.json`,
                    method: 'GET',
                    dataType: 'json',
                    success: (res) => {
                        if (res.statusCode === 200 && res.data && typeof res.data === 'object') {
                            resolve(res.data)
                        } else resolve(null)
                    },
                    fail: () => resolve(null),
                })
            } catch {
                resolve(null)
            }
        })
    }

    if (!data) return out
    walkCollectSelectColumns(data, out)
    return out
}

/**
 * 带缓存的模板 JSON select_column 映射（按桥型 id）。
 * @param {number|string} templateId
 * @returns {Promise<Map<number|string, number>>}
 */
export async function loadSelectColumnOverrideMap(templateId) {
    const key = String(Number(templateId) || '')
    if (!key || key === 'NaN') return new Map()
    if (overrideMapCache.has(key)) return overrideMapCache.get(key)
    if (inflight.has(key)) return inflight.get(key)

    const p = loadSelectColumnOverrideMapUncached(templateId).then((m) => {
        overrideMapCache.set(key, m)
        inflight.delete(key)
        return m
    })
    inflight.set(key, p)
    return p
}

/**
 * @param {object} dto defRowToDiseaseType 的结果（会被就地补全）
 * @param {Map<number|string, number>} map loadSelectColumnOverrideMap 的返回值
 */
export function applySelectColumnOverrides(dto, map) {
    if (!dto || typeof dto !== 'object' || !map || map.size === 0) return dto
    const raw = dto.selectColumn ?? dto.select_column
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return dto

    let v = null
    const id = Number(dto.id)
    if (Number.isFinite(id)) v = map.get(id) ?? map.get(String(id))
    if (v == null && dto.id != null && dto.id !== '') v = map.get(String(dto.id).trim())
    const code = dto.code != null ? String(dto.code).trim() : ''
    if (v == null && code) v = map.get(`c:${code}`)

    const vn = Number(v)
    if (Number.isFinite(vn) && vn > 0) {
        dto.selectColumn = vn
        dto.select_column = vn
    }
    return dto
}

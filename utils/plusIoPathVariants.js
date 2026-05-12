/**
 * App-Plus：为 plus.io.resolveLocalFileSystemURL 生成多组候选路径。
 * Android 11+ 分区存储下，downloadFile / 文件选择器 / zip 解压出的路径有时是
 * content 映射或需经 convertLocalFileSystemURL 才能被 5+ Runtime 正确解析。
 */

/**
 * @param {string} path
 * @returns {string[]}
 */
export function plusIoPathVariants(path) {
    const out = []
    const push = (s) => {
        const v = typeof s === 'string' ? s.trim() : ''
        if (v && !out.includes(v)) out.push(v)
    }
    const raw = String(path || '').trim()
    push(raw)
    if (raw.startsWith('file://')) {
        push(raw.slice('file://'.length))
    }
    if (typeof plus !== 'undefined' && plus.io && typeof plus.io.convertLocalFileSystemURL === 'function') {
        try {
            const c = plus.io.convertLocalFileSystemURL(raw)
            push(c)
            if (typeof c === 'string' && c.startsWith('file://')) {
                push(c.slice('file://'.length))
            }
        } catch {
            /* ignore */
        }
    }
    return out
}

/**
 * 依次用候选路径 resolve，成功则回调 fileEntry，全部失败则 onFail
 * @param {string} path
 * @param {(entry: object) => void} onSuccess
 * @param {(err?: Error) => void} onFail
 */
export function resolveLocalFileSystemURLWithVariants(path, onSuccess, onFail) {
    const variants = plusIoPathVariants(path)
    if (!variants.length || typeof plus === 'undefined' || !plus.io || !plus.io.resolveLocalFileSystemURL) {
        if (onFail) onFail(new Error('路径无效或当前环境不支持 plus.io'))
        return
    }
    let i = 0
    const next = () => {
        if (i >= variants.length) {
            if (onFail) onFail(new Error('resolveLocalFileSystemURL 失败: ' + variants.join(' | ')))
            return
        }
        const p = variants[i++]
        plus.io.resolveLocalFileSystemURL(p, onSuccess, next)
    }
    next()
}

/**
 * @param {string} path
 * @returns {Promise<object>}
 */
export function resolveLocalFileSystemURLPromise(path) {
    return new Promise((resolve, reject) => {
        resolveLocalFileSystemURLWithVariants(path, resolve, reject)
    })
}

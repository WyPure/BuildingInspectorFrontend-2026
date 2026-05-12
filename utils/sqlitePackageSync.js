/**
 * 桥梁模板库 common.db（_doc/sqlite/common.db）、用户工作区库（UD 目录下 u{userId}.db）的元数据拉取与落盘。
 * 接口：POST /api/v2/common/sqlite 与 GET /api/v2/user/{id}/sqlite，响应 data: { url, timestamp, size }。
 *
 * 上传侧：document_store 表含 offline_uuid、offline_deleted、is_offline_data（见 businessDocumentStore.js、readUdDocumentOfflineMeta）。
 */

import apiConfig from '@/config/api.js'
import {
	formatLocalSyncDisplayTime,
	recordBaseDbSyncedWallClock,
	recordUserDbSyncedWallClock,
} from './appSettingSyncMeta.js'
import {
	markCommonCatalogSyncFromServerDone,
	COMMON_CATALOG_DOC_REL_PATH,
} from './bridgeCatalogDb.js'
import { resolveLocalFileSystemURLWithVariants } from './plusIoPathVariants.js'
import { buildUdUserDbFilename } from './businessDocumentStore.js'
import { STORAGE_COMMON_DB_TS, STORAGE_USER_DB_TS } from './sqliteSyncKeys.js'

function parseSizeHint(sizeStr) {
	if (sizeStr == null || sizeStr === '') return null
	if (typeof sizeStr === 'number' && !isNaN(sizeStr)) return sizeStr
	const m = String(sizeStr).match(/^([\d.]+)\s*([KMGT]?B)$/i)
	if (!m) return null
	const n = parseFloat(m[1])
	if (isNaN(n)) return null
	const u = m[2].toUpperCase()
	const mul =
		u === 'B' ? 1
		: u === 'KB' ? 1024
		: u === 'MB' ? 1024 * 1024
		: u === 'GB' ? 1024 * 1024 * 1024
		: u === 'TB' ? 1024 * 1024 * 1024 * 1024
		: null
	return mul == null ? null : n * mul
}

export { STORAGE_COMMON_DB_TS, STORAGE_USER_DB_TS } from './sqliteSyncKeys.js'

/** 将接口返回的 "2026-05-08 14:27:25" 转为 14 位 yyyymmddHHMMss */
export function apiTimestampTo14Digits(ts) {
	if (!ts || typeof ts !== 'string') return ''
	const digits = ts.replace(/\D/g, '')
	if (digits.length >= 14) return digits.slice(0, 14)
	return ''
}

/** UD 目录名：UD-{14位时间戳}-{用户名} */
export function buildUdDirectoryName(username, fourteenDigits) {
	const u = String(username || '').trim()
	const d = String(fourteenDigits || '').trim()
	if (!u || d.length !== 14) return ''
	return `UD-${d}-${u}`
}

/** 从 UD 目录名解析 14 位时间戳，失败返回空串 */
export function extract14DigitsFromUdPath(udPath) {
	if (!udPath || typeof udPath !== 'string') return ''
	const m = udPath.match(/UD-(\d{14})-/)
	return m && m[1] ? m[1] : ''
}

export async function fetchCommonSqliteMeta(token) {
	const res = await uni.request({
		url: `${apiConfig.baseURL}${apiConfig.endpoints.commonSqlite}`,
		method: 'POST',
		header: {
			Authorization: `${token}`,
			'Content-Type': 'application/json'
		},
		data: {},
		timeout: 30000
	})
	if (res.statusCode !== 200 || !res.data || res.data.code !== 0) {
		throw new Error(res.data?.msg || '获取桥梁模板库信息失败')
	}
	const d = res.data.data
	if (!d || !d.url) throw new Error('接口未返回下载地址')
	return { url: d.url, timestamp: d.timestamp, size: d.size }
}

export async function fetchUserSqliteMeta(userId, token) {
	const id = userId != null && userId !== '' ? String(userId) : ''
	if (!id) throw new Error('缺少用户 id，请重新登录')
	const path = apiConfig.endpoints.userSqlite.replace('{id}', encodeURIComponent(id))
	const res = await uni.request({
		url: `${apiConfig.baseURL}${path}`,
		method: 'GET',
		header: { Authorization: `${token}` },
		timeout: 30000
	})
	if (res.statusCode !== 200 || !res.data || res.data.code !== 0) {
		throw new Error(res.data?.msg || '获取用户数据库信息失败')
	}
	const d = res.data.data
	if (!d || !d.url) throw new Error('接口未返回下载地址')
	return { url: d.url, timestamp: d.timestamp, size: d.size }
}

/**
 * uni.downloadFile，返回临时文件路径（App 端为本地路径）
 * @param {{ taskId?: number, onProgress?: (p: object) => void, timeoutMs?: number, timeoutMessage?: string }} opts
 */
export function downloadUrlToTemp(url, sizeStr, opts = {}) {
	return new Promise((resolve, reject) => {
		if (!url || !String(url).startsWith('http')) {
			reject(new Error('下载地址无效'))
			return
		}
		let settled = false
		const finish = (fn, arg) => {
			if (settled) return
			settled = true
			if (timer) clearTimeout(timer)
			fn(arg)
		}
		const timeoutMs = typeof opts.timeoutMs === 'number' && opts.timeoutMs > 0 ? opts.timeoutMs : 0
		const timer =
			timeoutMs > 0
				? setTimeout(() => {
						try {
							if (downloadTask && typeof downloadTask.abort === 'function') downloadTask.abort()
						} catch (e) {
							/* ignore */
						}
						finish(reject, new Error(opts.timeoutMessage || '下载超时，请检查网络后重试'))
					}, timeoutMs)
				: null
		const parsed = parseSizeHint(sizeStr)
		const totalHint = parsed || 8 * 1024 * 1024
		const taskId = opts.taskId
		const downloadTask = uni.downloadFile({
			url,
			timeout: Math.max(timeoutMs || 0, 300000),
			success: (res) => {
				if (res.statusCode === 200 && res.tempFilePath) {
					finish(resolve, res.tempFilePath)
				} else {
					finish(reject, new Error(`下载失败: HTTP ${res.statusCode}`))
				}
			},
			fail: (e) => finish(reject, e || new Error('downloadFile 失败'))
		})
		const task = downloadTask
		if (task && typeof task.onProgressUpdate === 'function' && opts.onProgress) {
			task.onProgressUpdate((e) => {
				const total =
					e.totalBytesExpectedToWrite > 0 ? e.totalBytesExpectedToWrite : totalHint
				const progress = total > 0 ? Math.min(100, (e.totalBytesWritten / total) * 100) : 0
				opts.onProgress({
					progress,
					packageSize: totalHint,
					bytesWritten: e.totalBytesWritten,
					bytesExpected: total,
					taskId
				})
			})
		}
	})
}

/** 将临时文件复制为 _doc 下目标相对路径（会先删同名文件） */
/**
 * 将用户库元数据对应文件下载并写入 _doc/{UD-时间戳-用户名}/u{userId}.db，更新 store 中的 UD/UL 路径。
 * @param {{ onProgress?: (p: object) => void, taskId?: number, meta?: { url: string, timestamp?: string, size?: string } }} opts
 */
export async function installUserSqlitePackage(token, username, userId, opts = {}) {
	const meta = opts.meta || (await fetchUserSqliteMeta(userId, token))
	let fourteen = apiTimestampTo14Digits(meta.timestamp)
	if (!fourteen || fourteen.length !== 14) {
		const now = new Date()
		fourteen =
			now.getFullYear().toString() +
			(now.getMonth() + 1).toString().padStart(2, '0') +
			now.getDate().toString().padStart(2, '0') +
			now.getHours().toString().padStart(2, '0') +
			now.getMinutes().toString().padStart(2, '0') +
			now.getSeconds().toString().padStart(2, '0')
	}
	const dirNew = buildUdDirectoryName(username, fourteen)
	if (!dirNew) throw new Error('无法生成用户数据目录名')
	const uid = String(userId ?? '').trim()
	if (!uid) throw new Error('缺少用户 id，无法落盘用户库文件')
	const udDbFile = buildUdUserDbFilename(uid)
	const tempPath = await downloadUrlToTemp(meta.url, meta.size, {
		taskId: opts.taskId,
		onProgress: opts.onProgress
	})
	await copyTempFileToDocRelative(tempPath, `${dirNew}/${udDbFile}`)
	try {
		const rawTs = String(meta.timestamp || '').trim()
		uni.setStorageSync(STORAGE_USER_DB_TS, rawTs || formatLocalSyncDisplayTime())
	} catch (e) {
		/* ignore */
	}
	recordUserDbSyncedWallClock()
	return {
		dirNew,
		ulDir: `UL-${fourteen}-${username}`,
		meta
	}
}

/** 下载桥梁模板 common.db 到 _doc/sqlite/common.db（全用户共用）
 * @param {string} token
 * @param {{ meta?: { url: string, timestamp?: string, size?: string }, downloadTimeoutMs?: number }} [opts]
 */
export async function syncCommonSqliteToDoc(token, opts = {}) {
	const meta = opts.meta != null ? opts.meta : await fetchCommonSqliteMeta(token)
	const downloadTimeoutMs =
		typeof opts.downloadTimeoutMs === 'number' && opts.downloadTimeoutMs > 0
			? opts.downloadTimeoutMs
			: 120000
	const tempPath = await downloadUrlToTemp(meta.url, meta.size, {
		timeoutMs: downloadTimeoutMs,
		timeoutMessage: '下载 common.db 超时，请检查网络或下载地址是否可用'
	})
	await copyTempFileToDocRelative(tempPath, COMMON_CATALOG_DOC_REL_PATH)
	try {
		const rawTs = String(meta.timestamp || '').trim()
		uni.setStorageSync(STORAGE_COMMON_DB_TS, rawTs || formatLocalSyncDisplayTime())
	} catch (e) {
		/* ignore */
	}
	recordBaseDbSyncedWallClock()
	markCommonCatalogSyncFromServerDone()
}

/** 判断 _doc 下相对路径是否已有文件（仅 App 有 plus；非 App 一律 false） */
export function docRelativeFileExists(relativeUnderDoc) {
	const rel = String(relativeUnderDoc || '').replace(/^\//, '')
	if (!rel) return Promise.resolve(false)
	if (typeof plus === 'undefined' || !plus.io || !plus.io.resolveLocalFileSystemURL) {
		return Promise.resolve(false)
	}
	return new Promise((resolve) => {
		plus.io.resolveLocalFileSystemURL('_doc/' + rel, () => resolve(true), () => resolve(false))
	})
}

export function copyTempFileToDocRelative(tempPath, relativeUnderDoc) {
	const rel = String(relativeUnderDoc || '').replace(/^\//, '')
	if (!rel) return Promise.reject(new Error('目标路径无效'))
	if (typeof plus === 'undefined' || !plus.io) {
		return Promise.reject(new Error('当前环境无法写入本地数据库，请在 App 内同步'))
	}
	return new Promise((resolve, reject) => {
		resolveLocalFileSystemURLWithVariants(
			tempPath,
			(fileEntry) => {
				plus.io.resolveLocalFileSystemURL(
					'_doc/',
					(docEntry) => {
						const lastSlash = rel.lastIndexOf('/')
						const dirRel = lastSlash > 0 ? rel.slice(0, lastSlash) : ''
						const fileName = lastSlash > 0 ? rel.slice(lastSlash + 1) : rel

						const finishCopy = (parentEntry) => {
							parentEntry.getFile(
								fileName,
								{ create: false },
								(existing) => {
									existing.remove(
										() =>
											fileEntry.copyTo(
												parentEntry,
												fileName,
												() => resolve(`_doc/${rel}`),
												reject
											),
										reject
									)
								},
								() =>
									fileEntry.copyTo(
										parentEntry,
										fileName,
										() => resolve(`_doc/${rel}`),
										reject
									)
							)
						}

						if (!dirRel) {
							finishCopy(docEntry)
							return
						}
						const parts = dirRel.split('/').filter(Boolean)
						let i = 0
						const mkdirChain = (parent) => {
							if (i >= parts.length) {
								finishCopy(parent)
								return
							}
							const name = parts[i++]
							parent.getDirectory(name, { create: true }, mkdirChain, reject)
						}
						mkdirChain(docEntry)
					},
					reject
				)
			},
			(err) =>
				reject(
					err instanceof Error
						? err
						: new Error(
								'无法解析下载的临时文件路径（Android 11+ 可检查存储权限或重试同步）: ' +
									String(tempPath)
							)
				)
		)
	})
}

/** 比较两个 UD 目录名的时间戳：dir1 是否比 dir2 更新 */
export function compareUdDirByTimestamp(dir1, dir2) {
	const a = extract14DigitsFromUdPath(dir1)
	const b = extract14DigitsFromUdPath(dir2)
	if (a && b) return a > b
	if (!dir2) return true
	return String(dir1) > String(dir2)
}

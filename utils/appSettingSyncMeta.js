/**
 * 系统设置页展示的「同步时间」与基础库/用户库版本号相关 storage
 *（与 SystemSetting.vue 中列表展示一致，供下载、包内复制等统一写入）
 */
import { STORAGE_COMMON_DB_TS } from './sqliteSyncKeys.js'

export const STORAGE_SETTING_UL_SYNC_AT = 'setting_ul_sync_at'
export const STORAGE_SETTING_UD_SYNC_AT = 'setting_ud_sync_at'

export function formatLocalSyncDisplayTime() {
	const d = new Date()
	const p = (n) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 用户库下载/安装完成：写入「用户数据库同步时间」 */
export function recordUserDbSyncedWallClock() {
	const t = formatLocalSyncDisplayTime()
	try {
		uni.setStorageSync(STORAGE_SETTING_UD_SYNC_AT, t)
	} catch (e) {
		/* ignore */
	}
	return t
}

/** 基础库从服务端同步完成：写入「基础数据库同步时间」 */
export function recordBaseDbSyncedWallClock() {
	const t = formatLocalSyncDisplayTime()
	try {
		uni.setStorageSync(STORAGE_SETTING_UL_SYNC_AT, t)
	} catch (e) {
		/* ignore */
	}
	return t
}

/**
 * 包内首次复制 common.db 成功（无服务端 timestamp）：版本号与基础库同步时间用同一时间文本
 */
export function recordBuiltinCommonDbReadyDisplay() {
	const t = formatLocalSyncDisplayTime()
	try {
		uni.setStorageSync(STORAGE_COMMON_DB_TS, t)
		uni.setStorageSync(STORAGE_SETTING_UL_SYNC_AT, t)
	} catch (e) {
		/* ignore */
	}
	return t
}

/** _doc 已有 common.db 但从未写过版本字段时补一条，便于设置页展示 */
export function recordCommonDbDisplayIfMissing() {
	try {
		const existing = uni.getStorageSync(STORAGE_COMMON_DB_TS)
		if (existing != null && String(existing).trim() !== '') return
		recordBuiltinCommonDbReadyDisplay()
	} catch (e) {
		/* ignore */
	}
}

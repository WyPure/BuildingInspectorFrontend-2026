/** UD 根目录解析缓存：下载用户库并切换 UDPath 后必须清空，否则会误命中旧的 project/ */
export const directoryLookupCache = new Map()
export const taskBuildingCache = new Map()

export function clearAllPathLookupCaches() {
	directoryLookupCache.clear()
	taskBuildingCache.clear()
}

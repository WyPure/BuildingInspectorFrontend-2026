/** 与 `pages/bridge-disease` 入口 URL 一致的桥梁查询字段，用于新增/编辑病害页展示信息并在 redirect 时保留。 */

const BRIDGE_QUERY_KEYS = ['bridgeName', 'bridgeCode', 'bridgePileNumber', 'routeName', 'routeCode'];

/**
 * 从页面栈合并桥梁查询参数：优先 `bridge-disease` 页，其次当前页已有参数。
 * @returns {Record<string, string>}
 */
export function getBridgeOptionsFromPageStack() {
	const out = {};
	try {
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
		if (!pages?.length) {
			return out;
		}
		for (let i = pages.length - 1; i >= 0; i -= 1) {
			const p = pages[i];
			const route = String(p?.route || '');
			if (route.includes('bridge-disease')) {
				const opts = p.$page?.options || {};
				for (const k of BRIDGE_QUERY_KEYS) {
					const v = opts[k];
					if (v != null && String(v) !== '') {
						out[k] = String(v);
					}
				}
				break;
			}
		}
		const top = pages[pages.length - 1]?.$page?.options || {};
		for (const k of BRIDGE_QUERY_KEYS) {
			if (out[k] == null || out[k] === '') {
				const v = top[k];
				if (v != null && String(v) !== '') {
					out[k] = String(v);
				}
			}
		}
	} catch (_) {
		/* ignore */
	}
	return out;
}

/**
 * 为 url 追加栈内桥梁参数（若 url 已含同名 query 则跳过）。
 * @param {string} url
 */
export function appendBridgeQueryToUrl(url) {
	const merged = getBridgeOptionsFromPageStack();
	let result = String(url || '');
	for (const k of BRIDGE_QUERY_KEYS) {
		const v = merged[k];
		if (v == null || v === '') continue;
		const needle = `${k}=`;
		if (result.includes(needle)) continue;
		result += (result.includes('?') ? '&' : '?') + `${k}=${encodeURIComponent(v)}`;
	}
	return result;
}

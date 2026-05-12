// #ifdef APP-PLUS
import {
	queryDiseaseScalesByTypeCode,
	loadBridgeTemplateTree,
	queryBridgeTypeOptions,
} from '@/utils/bridgeCatalogDb.js'
import {
	readUdBuildingCatalogTemplateId,
	pickCatalogTemplateIdFromInstanceTree,
} from '@/utils/businessDocumentStore.js'
import { findUdDirForUser } from '@/utils/readUL.js'
import { idStore } from '@/store/idStorage.js'
import { userStore } from '@/store/index.js'
import { unref } from 'vue'

function normalizeBridgeTypeLabel(s) {
	return String(s || '').replace(/\s+/g, ' ').trim()
}

/** 与 structure-info 一致：用桥跨类型名称在 common.db 根节点表中匹配模板根 id */
async function resolveCatalogTemplateIdFromTypeName(payload) {
	if (!payload || typeof payload !== 'object') return null
	let typeName = normalizeBridgeTypeLabel(payload.bridgeSpanSetupTypeName)
	if (!typeName && payload.bridgeSpanSetupBySpan && typeof payload.bridgeSpanSetupBySpan === 'object') {
		for (const row of Object.values(payload.bridgeSpanSetupBySpan)) {
			if (!row || typeof row !== 'object') continue
			const t = normalizeBridgeTypeLabel(row.bridgeSpanSetupTypeName)
			if (t) {
				typeName = t
				break
			}
		}
	}
	if (!typeName) return null
	try {
		const opts = await queryBridgeTypeOptions()
		const tn = typeName.toLowerCase()
		const hit = opts.find((o) => normalizeBridgeTypeLabel(o.name).toLowerCase() === tn)
		if (hit?.id != null && hit.id !== '') {
			const n = Number(hit.id)
			return Number.isFinite(n) && n > 0 ? n : null
		}
	} catch (e) {
		console.warn('[getObjectTemplate] 按桥跨类型名查模板根失败:', e?.message || e)
	}
	return null
}
export { initBridgeCatalogDb } from '@/utils/bridgeCatalogDb.js'
// #endif

// #ifndef APP-PLUS
/** 非 App 无 plus.sqlite，桥梁目录库不可用 */
export async function initBridgeCatalogDb() {}
// #endif

/**
 * 病害标度列表：App 从 common.db（bi_disease_scale）查询
 */
export async function getDiseaseScale(typeCode) {
	// #ifdef APP-PLUS
	try {
		return await queryDiseaseScalesByTypeCode(typeCode)
	} catch (e) {
		console.error('getDiseaseScale SQLite 失败:', e)
		return []
	}
	// #endif
	// #ifndef APP-PLUS
	return []
	// #endif
}

/**
 * 桥型构件树：App 从 common.db 组装（bi_template_object 等）
 * @param {number|string} templateId 常为 templateObjectId；若误传实例根 id，需传 opts 从 UD 反查
 * @param {{ buildingId?: number|string, userName?: string, objectTree?: object }} [opts]
 */
export async function getObjectTemplate(templateId, opts = {}) {
	// #ifdef APP-PLUS
	try {
		let tid = Number(templateId)
		let tree = await loadBridgeTemplateTree(tid)
		if (tree) return tree

		const { buildingId, userName, objectTree } = opts || {}
		if (buildingId != null && buildingId !== '') {
			const uid = unref(idStore().userId)
			const um = userStore()
			const primary = userName || um?.username || um?.hadUsername
			if (primary) {
				const udRoot = await findUdDirForUser(primary)
				if (udRoot) {
					const catalogId = await readUdBuildingCatalogTemplateId(udRoot, buildingId, uid || undefined)
					if (catalogId && (!Number.isFinite(tid) || catalogId !== tid)) {
						tree = await loadBridgeTemplateTree(catalogId)
						if (tree) return tree
					}
				}
			}
		}

		const fromWalk = objectTree ? pickCatalogTemplateIdFromInstanceTree(objectTree) : null
		if (fromWalk && (!Number.isFinite(tid) || fromWalk !== tid)) {
			tree = await loadBridgeTemplateTree(fromWalk)
			if (tree) return tree
		}

		const fromTypeName = objectTree ? await resolveCatalogTemplateIdFromTypeName(objectTree) : null
		if (fromTypeName && (!Number.isFinite(tid) || fromTypeName !== tid)) {
			tree = await loadBridgeTemplateTree(fromTypeName)
			if (tree) return tree
		}

		console.error('getObjectTemplate 未得到构件树，templateObjectId=', templateId, 'opts=', opts)
	} catch (e) {
		console.error('getObjectTemplate SQLite 异常，templateObjectId=', templateId, e)
	}
	return undefined
	// #endif
	// #ifndef APP-PLUS
	return undefined
	// #endif
}

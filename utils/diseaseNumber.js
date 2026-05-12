import {setObject} from "./writeNew";
import {useObject} from "../store/object";
import {getULDisease} from "@/utils/readJsonNew";
import {getObjectUL} from "@/utils/readUL";
import {loadBridgeTemplateTree, queryBridgeTypeOptions} from "@/utils/bridgeCatalogDb";

/** 构件 id 与病害 biObjectId 可能为 number / string，避免 === 匹配失败 */
function idsMatch(nodeId, targetId) {
	if (nodeId === undefined || nodeId === null || nodeId === "") return false;
	if (targetId === undefined || targetId === null || targetId === "") return false;
	if (nodeId === targetId) return true;
	return String(nodeId) === String(targetId);
}

/**
 * 在 object 树中深度优先查找 id 匹配的节点（桥型模板树深度可能超过固定 3 层）
 */
export function findTreeNodeById(children, targetId) {
	if (!Array.isArray(children)) return null;
	for (const node of children) {
		if (!node || typeof node !== "object") continue;
		if (idsMatch(node.id, targetId)) return node;
		const hit = findTreeNodeById(node.children, targetId);
		if (hit) return hit;
	}
	return null;
}

/** 从 Pinia 构件树取某 biObject 对应节点（用于校验构件数量等） */
export function getObjectTreeNodeByBiObjectId(targetId) {
	const objectData = useObject();
	return findTreeNodeById(objectData.getData()?.children, targetId);
}

function mapGetLoose(map, id) {
	if (!map || id === undefined || id === null || id === "") return undefined;
	if (map.has(id)) return map.get(id);
	const s = String(id);
	for (const [k, v] of map.entries()) {
		if (String(k) === s) return v;
	}
	return undefined;
}

export async function incrementDiseaseNumber(username, buildingId, targetId) {
	const objectData = useObject();
	const data = objectData.getData();
	const target = findTreeNodeById(data?.children, targetId);
	if (!target) {
		console.warn("[incrementDiseaseNumber] 未在构件树中找到 id:", targetId);
		return false;
	}
	if (typeof target.diseaseNumber !== "number") {
		target.diseaseNumber = 0;
	}
	target.diseaseNumber++;
	await setObject(username, buildingId, data);
	return true;
}

export async function decrementDiseaseNumber(username, buildingId, targetId) {
	const objectData = useObject();
	const data = objectData.getData();
	const target = findTreeNodeById(data?.children, targetId);
	if (!target) {
		console.warn("[decrementDiseaseNumber] 未在构件树中找到 id:", targetId);
		return false;
	}
	if (typeof target.diseaseNumber !== "number") {
		target.diseaseNumber = 0;
	}
	target.diseaseNumber = Math.max(0, target.diseaseNumber - 1);
	await setObject(username, buildingId, data);
	return true;
}

/** 规范化桥型名称，用于与 queryBridgeTypeOptions 比对 */
function normalizeBridgeTypeLabel(s) {
	return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * 确保 data 拥有有效的 children（模板构件树）。
 * 若 Pinia 已有则直接用；否则按优先级：
 *   1. 从 UL 重新读 object（含 enrichObjectPayloadCatalogTemplateId）
 *   2. 用 templateObjectId / bridgeSpanSetupTypeName 查 catalog DB 加载模板
 * 返回带 children 的对象引用，失败返回 null。
 */
async function ensureObjectTree(username, buildingId) {
	const objectData = useObject();
	let data = objectData.getData();

	// Pinia 已有完整构件树
	if (data && Array.isArray(data.children) && data.children.length > 0) {
		return data;
	}

	// 从 UL 重新读（含 enrich templateObjectId）
	try {
		const raw = await getObjectUL(username, buildingId);
		if (raw && typeof raw === 'object') {
			data = raw;
		}
	} catch (e) {
		console.warn("[refreshDiseaseNumber] getObjectUL 失败:", e);
	}

	if (!data || typeof data !== 'object') return null;

	// 仍无 children，尝试从 catalog 加载模板树
	if (!Array.isArray(data.children) || data.children.length === 0) {
		let templateId = Number(data.templateObjectId);

		// templateId 无效时用桥跨类型名匹配
		if (!Number.isFinite(templateId) || templateId <= 0) {
			const typeName = normalizeBridgeTypeLabel(data.bridgeSpanSetupTypeName);
			if (typeName) {
				try {
					const opts = await queryBridgeTypeOptions();
					const hit = opts.find(o => normalizeBridgeTypeLabel(o.name) === typeName);
					if (hit?.id) templateId = Number(hit.id);
				} catch (e) {
					console.warn("[refreshDiseaseNumber] queryBridgeTypeOptions 失败:", e);
				}
			}
		}

		if (Number.isFinite(templateId) && templateId > 0) {
			try {
				const tplRoot = await loadBridgeTemplateTree(templateId);
				if (tplRoot?.children?.length) {
					const merged = JSON.parse(JSON.stringify(tplRoot));
					data.templateObjectId = templateId;
					data.children = merged.children;
				}
			} catch (e) {
				console.warn("[refreshDiseaseNumber] loadBridgeTemplateTree 失败:", e);
			}
		}
	}

	if (!Array.isArray(data.children) || data.children.length === 0) {
		return null;
	}

	// 写回 Pinia（让后续操作和侧栏 onDiseaseStatusChangedForSidebar 都能读到树）
	objectData.setData(data);
	return data;
}

export async function refreshDiseaseNumber(username, buildingId, projectYear) {
	const diseaseData = await getULDisease(username, buildingId, projectYear);
	if (!diseaseData || !Array.isArray(diseaseData.diseases)) return;

	// 先统计病害计数（不依赖树结构）
	const diseaseCountMap = new Map();
	const diseaseTypeMap = new Map();
	for (const disease of diseaseData.diseases) {
		if (
			disease.commitType !== 2 &&
			disease.component?.biObject?.id != null
		) {
			const biObjectId = disease.component.biObject.id;
			const mapKey = String(biObjectId);
			const componentName = disease.component.name;
			if (!diseaseTypeMap.has(mapKey)) diseaseTypeMap.set(mapKey, new Set());
			const types = diseaseTypeMap.get(mapKey);
			if (!types.has(componentName)) {
				types.add(componentName);
				diseaseCountMap.set(mapKey, (diseaseCountMap.get(mapKey) || 0) + 1);
			}
		}
	}

	// 确保有可写的构件树
	const data = await ensureObjectTree(username, buildingId);
	if (!data) return;

	function applyCounts(node) {
		if (!node || typeof node !== "object") return;
		const ch = node.children;
		const isLeaf = !Array.isArray(ch) || ch.length === 0;
		const nid = node.id;
		if (nid !== undefined && nid !== null && nid !== "") {
			const v = mapGetLoose(diseaseCountMap, nid);
			if (v !== undefined) {
				node.diseaseNumber = v;
			} else if (isLeaf) {
				// 叶子且无病害，重置为 0
				node.diseaseNumber = 0;
			}
		}
		if (Array.isArray(ch)) {
			for (const c of ch) applyCounts(c);
		}
	}

	for (const root of data.children) applyCounts(root);

	// Pinia 与磁盘同步（ensureObjectTree 已在 Pinia 为空时 setData，此处再覆盖确保最新计数生效）
	useObject().setData(data);
	await setObject(username, buildingId, data);
}

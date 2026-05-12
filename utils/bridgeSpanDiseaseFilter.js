/**
 * 桥梁病害是否属于指定桥跨（与 current-disease 筛选规则一致，供多页复用）
 * @param {object} item 病害记录
 * @param {number|string|null|undefined} selectedBridgeSpan 当前选中的跨号，无效则不过滤
 */
export function isDiseaseInBridgeSpan(item, selectedBridgeSpan) {
    const selectedSpan = Number(selectedBridgeSpan)
    const shouldFilterSpan = Number.isFinite(selectedSpan) && selectedSpan > 0
    if (!shouldFilterSpan) return true
    if (item?.bridgeSpanNo !== undefined && item?.bridgeSpanNo !== null && item?.bridgeSpanNo !== '') {
        return Number(item.bridgeSpanNo) === selectedSpan
    }
    const spanRegex = new RegExp(`第\\s*${selectedSpan}\\s*跨|${selectedSpan}\\s*跨`)
    const candidates = [
        item?.position,
        item?.description,
        item?.biObjectName,
        item?.type,
        item?.component?.code,
        item?.component?.name,
        item?.component?.biObject?.name,
    ].filter(Boolean)
    return candidates.some((v) => spanRegex.test(String(v)))
}

/**
 * 按跨过滤后，统计各模板构件节点（第三层 id）下的病害条数（规则同 refreshDiseaseNumber）
 * @param {Array<{commitType?:number, component?:object}>} diseases
 * @param {number|string|null|undefined} spanNo
 * @returns {Map<number|string, number>}
 */
export function buildBiObjectDiseaseCountMapForSpan(diseases, spanNo) {
    const diseaseCountMap = new Map()
    const diseaseTypeMap = new Map()
    const list = Array.isArray(diseases) ? diseases : []

    for (const disease of list) {
        if (!isDiseaseInBridgeSpan(disease, spanNo)) continue
        if (disease.commitType === 2) continue
        if (!disease.component?.biObject?.id) continue

        const biObjectId = disease.component.biObject.id
        const componentName = disease.component.name

        if (!diseaseTypeMap.has(biObjectId)) {
            diseaseTypeMap.set(biObjectId, new Set())
        }
        const diseaseTypes = diseaseTypeMap.get(biObjectId)
        if (!diseaseTypes.has(componentName)) {
            diseaseTypes.add(componentName)
            diseaseCountMap.set(biObjectId, (diseaseCountMap.get(biObjectId) || 0) + 1)
        }
    }
    return diseaseCountMap
}

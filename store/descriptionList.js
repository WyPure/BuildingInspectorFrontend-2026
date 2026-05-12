import { defineStore } from 'pinia'
import { ref } from 'vue'

export const descriptionListStore = defineStore('descriptionList', () => {
	// 存储描述数据的列表
	const descriptionList = ref([])

	// 添加数据
	const addDescription = (data) => {
		const newItem = {
			componentName: data.componentName || '', // 构件名称
			componentCode: data.componentCode || '', // 构件编号
			showColumns: data.showColumns || 0, // 是否显示裂缝特征
			diseaseType: data.diseaseType || '', // 病害类型
			diseasePosition: data.diseasePosition || '', // 病害位置
			positionNumber: data.positionNumber || '', // 位置编号
			mileageStation1: data.mileageStation1 || '', // 里程桩号1
			mileageStation2: data.mileageStation2 || '', // 里程桩号2
			mileageStation3: data.mileageStation3 || '', // 里程桩号3
			mileageStation4: data.mileageStation4 || '', // 里程桩号4
			crackType: data.crackType || '', // 裂缝特征（可选）
			defects: data.defects || [], // 缺损数据数组
			counts: data.counts || 0, // 病害数量（可选）
			units: data.units || '', // 单位
			threshold: data.threshold || '', // 阈值
		};
		descriptionList.value.push(newItem)
	}

	// 删除数据
	const removeDescription = (index) => {
		descriptionList.value.splice(index, 1)
	}

	// 清空列表
	const clearDescriptionList = () => {
		descriptionList.value = []
	}

	return {
		descriptionList,
		addDescription,
		removeDescription,
		clearDescriptionList,
	}
})


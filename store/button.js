import {
	defineStore
} from 'pinia'
import {
	ref
} from 'vue'

export const ButtonStore = defineStore('button', () => {
	const show = ref(false) // 默认隐藏按钮
	const photoData = ref(null) // 存储照片数据
	const firstIndex = ref(0) // 存储一级索引
	
	// 隐藏按钮
	const reback = (Id) => {
		show.value = false;
	}
	
	// 显示按钮
	const showPhotoInfo = () => {
		show.value = true;
	}
	
	// 设置照片数据
	const setPhotoData = (data) => {
		photoData.value = data;
	}
	
	// 设置一级索引
	const setFirstIndex = (index) => {
		firstIndex.value = index;
	}
	
	return {
		show,
		photoData,
		firstIndex,
		reback,
		showPhotoInfo,
		setPhotoData,
		setFirstIndex
	}
})
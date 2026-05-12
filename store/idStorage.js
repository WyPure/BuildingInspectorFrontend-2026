import {
	defineStore
} from 'pinia'
import {
	ref
} from 'vue'

export const idStore = defineStore('Id', () => {
	const userId = ref('')
	const projectId = ref('')
	const buildingId = ref('')
	const currentDir = ref('')
	const taskId = ref('')
	const projectYear = ref('')
	const setUserId = (Id)=>{
		userId.value = Id.value
	}
	const setProjectId = (Id)=>{
		projectId.value = Id.value
	}
	const setTaskId = (Id)=>{
		taskId.value = Id.value
	}
	const setBuildingId = (Id)=>{
		buildingId.value = Id.value
	}
	const setDir = (dir)=>{
		currentDir.value = dir.value
	}
	const setProjectYear = (year)=>{
		projectYear.value = year.value
	}
	return {
		currentDir,
		userId,
		projectId,
		buildingId,
		taskId,
		projectYear,
		setUserId,
		setProjectId,
		setTaskId,
		setBuildingId,
		setDir,
		setProjectYear
	}
})
//store旨在存储全局数据，让不同组件可以随时访问，而不必层层传递 props 或 emit
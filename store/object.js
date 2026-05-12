import {
	defineStore
} from 'pinia'
import { ref} from 'vue'; 
export const useObject = defineStore('object', () => {
	const data = ref({});
	const setData = (newData) =>{
		Object.assign(data.value, newData); // 合并属性到现有对象
	}
	const getData = () =>{
		return data.value
	}
	return {
		setData,
		getData
	}
})
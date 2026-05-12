import {
	defineStore
} from 'pinia'
import {
	ref
} from 'vue'

export const userStore2 = defineStore('userstorage', () => {
	const username = ref('')
	const password = ref('')
	const token = ref('')
	const userDept = ref('')
	const userName = ref('')
	const UDPath = ref('')
	const ULPath = ref('')
	const hadUsername = ref('') // 用于存储已存在的用户名

	const setUserInfo = (userinfo) => {
		username.value = userinfo.username
		password.value = userinfo.password
		token.value = userinfo.token
		userDept.value = userinfo.userDept
		userName.value = userinfo.userName
	}
	
	const setUDPath = (path) => {
		UDPath.value = path
	}
	
	const setULPath = (path) => {
		ULPath.value = path
	}

	const setHadUsername = (username) => {
		hadUsername.value = username
	}

	// 清理用户数据的方法
	const clearUserData = () => {
		console.log('清理用户数据');
		username.value = '';
		password.value = '';
		UDPath.value = '';
		ULPath.value = '';
		hadUsername.value = '';
	}

	return {
		username,
		password,
		token,
		userName,
		userDept,
		UDPath,
		ULPath,
		setUserInfo,
		setUDPath,
		setULPath,
		hadUsername,
		setHadUsername,
		clearUserData,
	}
})
//store旨在存储全局数据，让不同组件可以随时访问，而不必层层传递 props 或 emit
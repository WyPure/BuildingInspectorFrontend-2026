import {
	defineStore
} from 'pinia'
import {
	ref
} from 'vue'
import { clearAllPathLookupCaches } from '@/utils/directoryLookupCache.js'

export const userStore = defineStore('user', () => {
	const username = ref('')
	const password = ref('')
	const infoData = ref('')
	const UDPath = ref('')
	const ULPath = ref('')
	const hadUsername = ref('') // 用于存储已存在的用户名

	const persistBizPaths = () => {
		try {
			const u = username.value
			if (!u) return
			uni.setStorageSync(`biz_paths_${u}`, {
				udPath: UDPath.value || '',
				ulPath: ULPath.value || ''
			})
		} catch (e) {
			/* ignore */
		}
	}

	const restoreBizPathsForUser = (u) => {
		try {
			if (!u) return
			const o = uni.getStorageSync(`biz_paths_${u}`)
			if (o && typeof o === 'object') {
				if (o.udPath) UDPath.value = o.udPath
				if (o.ulPath) ULPath.value = o.ulPath
			}
		} catch (e) {
			/* ignore */
		}
	}

	const setUserInfo = (userinfo) => {
		username.value = userinfo.username
		password.value = userinfo.password
		infoData.value = userinfo.infoData
		restoreBizPathsForUser(userinfo.username)
	}
	
	const setUDPath = (path) => {
		UDPath.value = path
		persistBizPaths()
		if (path) {
			try {
				clearAllPathLookupCaches()
			} catch (e) {
				/* ignore */
			}
		}
	}
	
	const setULPath = (path) => {
		ULPath.value = path
		persistBizPaths()
		if (path) {
			try {
				clearAllPathLookupCaches()
			} catch (e) {
				/* ignore */
			}
		}
	}

	const setHadUsername = (username) => {
		hadUsername.value = username
	}

	// 清理用户数据的方法
	const clearUserData = () => {
		console.log('清理用户数据');
		username.value = '';
		password.value = '';
		infoData.value = '';
		UDPath.value = '';
		ULPath.value = '';
		hadUsername.value = '';
	}

	return {
		username,
		password,
		infoData,
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
<template>
	<view class="System">
		<!-- 下载进度条 -->
		<view class="download-progress-container" v-if="showDownloadProgress">
			<view class="progress-header">
				<text class="progress-title">正在下载数据包</text>
				<text class="progress-percent">{{ Math.floor(downloadProgress) }}%</text>
			</view>
			<view class="progress-bar-bg">
				<view class="progress-bar-fill" :style="{ width: downloadProgress + '%' }"></view>
			</view>
			<view class="progress-info">
				<text>下载中，请稍候...</text>
			</view>
		</view>

		<!-- 解压进度条 -->
		<view class="download-progress-container" v-if="showUnzipProgress">
			<view class="progress-header">
				<text class="progress-title">正在解压数据包</text>
				<text class="progress-percent">{{ Math.floor(unzipProgress) }}%</text>
			</view>
			<view class="progress-bar-bg">
				<view class="progress-bar-fill" :style="{ width: unzipProgress + '%' }"></view>
			</view>
			<view class="progress-info">
				<text>解压中，请稍候...</text>
			</view>
		</view>

		<!-- 用户信息区（浅蓝灰底） -->
		<view class="profile-card">
			<view class="profile-inner">
				<view class="avatar-wrap">
					<image src="/static/image/user1.png" class="avatar" mode="aspectFit" />
				</view>
				<view class="profile-text">
					<text class="profile-account">{{ userAccount }}</text>
					<text class="profile-name">{{ name }}</text>
				</view>
				<view class="profile-actions">
					<button class="profile-btn" hover-class="profile-btn-hover" @click="openPasswordModal">修改密码</button>
					<button class="profile-btn" hover-class="profile-btn-hover" @click="handleLogout">退出登录</button>
				</view>
			</view>
		</view>

		<!-- 设置列表（分割线用行 border-bottom，避免与 button 伪边线叠成双条、深浅不一） -->
		<view class="setting-list">
			<view class="setting-row setting-row--action">
				<text class="setting-label">当前应用版本</text>
				<view class="setting-row__tail">
					<text class="setting-value">{{ versionNumber }}</text>
					<button class="row-action" hover-class="row-action-hover" @click="onClickUpdate">版本更新</button>
				</view>
			</view>

			<view class="setting-row setting-row--action">
				<text class="setting-label">基础数据库版本</text>
				<view class="setting-row__tail">
					<text class="setting-value">{{ baseDbVersion }}</text>
					<button class="row-action" hover-class="row-action-hover" @click="handleSyncBaseDb">数据同步</button>
				</view>
			</view>

			<view class="setting-row setting-row--time">
				<text class="setting-label">基础数据库同步时间</text>
				<text class="setting-value setting-value--right">{{ ulSyncTimeText }}</text>
			</view>

			<view class="setting-row setting-row--action">
				<text class="setting-label">用户数据库版本</text>
				<view class="setting-row__tail">
					<text class="setting-value">{{ userDbVersion }}</text>
					<button class="row-action" hover-class="row-action-hover" @click="handleSyncUserDb">数据同步</button>
				</view>
			</view>

			<view class="setting-row setting-row--time">
				<text class="setting-label">用户数据库同步时间</text>
				<text class="setting-value setting-value--right">{{ udSyncTimeText }}</text>
			</view>

			<view class="setting-row setting-row--action">
				<text class="setting-label">媒体资源数量</text>
				<view class="setting-row__tail">
					<text class="setting-value">{{ mediaCountText }}</text>
					<button class="row-action" hover-class="row-action-hover" @click="handleResourceSync">资源同步</button>
				</view>
			</view>

			<view class="setting-row setting-row--time setting-row--last">
				<text class="setting-label">媒体资源同步时间</text>
				<text class="setting-value setting-value--right">{{ mediaSyncTimeText }}</text>
			</view>
		</view>

		<!-- 添加修改密码弹窗 -->
		<uni-popup ref="passwordPopup" type="center">
			<view class="password-popup-content">
				<view class="popup-title">修改密码</view>
				<view class="password-form">
					<view class="password-row">
						<text class="password-label">旧密码</text>
						<input type="password" v-model="oldPassword" placeholder="请输入旧密码" class="password-input" />
					</view>
					<view class="password-row">
						<text class="password-label">新密码</text>
						<input type="password" v-model="newPassword" placeholder="请输入新密码" class="password-input" />
					</view>
					<view class="password-row">
						<text class="password-label">确认新密码</text>
						<input type="password" v-model="confirmPassword" placeholder="请再次输入新密码"
							class="password-input" />
					</view>
				</view>
				<view class="popup-buttons">
					<button class="popup-btn cancel-btn" @click="closePasswordModal">取消</button>
					<button class="popup-btn confirm-btn" @click="changePassword">确定</button>
				</view>
			</view>
		</uni-popup>

		<!-- 版本更新弹窗 -->
		<updateVersionWindow :visible="showUpdateModal" :title="updateModalTitle" :content="updateModalContent"
			@confirm="handleUpdateConfirm" @cancel="handleUpdateCancel" />

		<!-- 自定义错误弹窗 -->
		<offlineFailVue ref="offlineFailRef" @confirm="handleOfflineFailConfirm" />
		<offlineVersionVue ref="offlineVersionRef" />

		<offlineFailVue ref="dataOffline" />

	</view>
</template>

<script setup>
	import {
		computed,
		onMounted,
		ref,
		unref
	} from 'vue';
	import {
		onShow
	} from '@dcloudio/uni-app'
	import {
		userStore
	} from '@/store/index.js'
	import {
		idStore
	} from '@/store/idStorage'
	import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update'
	// 导入下载工具
	import {
		useDownloader,
		parsePackageSize
	} from '@/utils/downloadUtils.js'
	// 导入版本更新弹窗组件
	import updateVersionWindow from '@/components/updateVersionWindow.vue'
	import offlineFailVue from '../../components/offlineFail.vue'
	import offlineVersionVue from '../../components/offlineVersion.vue';
	import apiConfig from '../../config/api';
	import {
		safeMigrateUdWorkspaceDocumentsWithOptions
	} from '@/utils/businessDocumentStore.js'
	import { COMMON_CATALOG_DOC_REL_PATH } from '@/utils/bridgeCatalogDb.js'
	import {
		STORAGE_SETTING_UL_SYNC_AT as STORAGE_UL_SYNC,
		STORAGE_SETTING_UD_SYNC_AT as STORAGE_UD_SYNC,
	} from '@/utils/appSettingSyncMeta.js'
	import {
		fetchCommonSqliteMeta,
		syncCommonSqliteToDoc,
		docRelativeFileExists,
		fetchUserSqliteMeta,
		installUserSqlitePackage,
		STORAGE_COMMON_DB_TS,
		STORAGE_USER_DB_TS,
		apiTimestampTo14Digits,
		extract14DigitsFromUdPath
	} from '@/utils/sqlitePackageSync.js'

	const STORAGE_MEDIA_SYNC = 'setting_media_sync_at'
	const STORAGE_MEDIA_COUNT = 'setting_media_count'

	const formatNowForDisplay = () => {
		const d = new Date()
		const p = (n) => String(n).padStart(2, '0')
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
	}

	/** 解析接口/本地存储的时间字符串 */
	const parseSettingsTimestamp = (raw) => {
		if (raw == null || raw === '') return null
		const s = String(raw).trim()
		if (!s) return null
		let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2}):(\d{2})/)
		if (m) {
			return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
		}
		m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
		if (m) {
			return new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0)
		}
		const d = new Date(s)
		return !isNaN(d.getTime()) ? d : null
	}

	/** 目录库版本展示：固定 2.0 + 年后两位 + 月日四位 + 小时（不补零，0–23） */
	const formatCatalogVersionFromRemoteTs = (raw) => {
		const d = parseSettingsTimestamp(raw)
		if (!d) return '—'
		const yy = String(d.getFullYear()).slice(-2)
		const mm = String(d.getMonth() + 1).padStart(2, '0')
		const dd = String(d.getDate()).padStart(2, '0')
		return `2.0.${yy}${mm}${dd}.${d.getHours()}`
	}

	/** 同步时间展示：YYYY-MM-DD HH:mm:ss */
	const formatSyncTimeDisplay = (raw) => {
		if (raw == null || raw === '') return '—'
		const s = String(raw).trim()
		if (!s || s === '—') return '—'
		const d = parseSettingsTimestamp(s)
		if (!d) return s
		const p = (n) => String(n).padStart(2, '0')
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
	}

	// 获取用户信息
	const userInfo = userStore();
	const idInfo = idStore();

	// 引入下载器
	const {
		downloadProgress,
		unzipProgress,
		resetProgress,
		currentTaskId
	} = useDownloader();

	// 密码相关变量
	const passwordPopup = ref(null);
	const oldPassword = ref('');
	const newPassword = ref('');
	const confirmPassword = ref('');
	const name = ref('未知用户');
	const userAccount = ref('unknownAccount')
	//版本号
	const versionNumber = ref('v2')
	// 打开修改密码弹窗
	const openPasswordModal = () => {
		// 清空输入框
		oldPassword.value = '';
		newPassword.value = '';
		confirmPassword.value = '';
		// 打开弹窗
		passwordPopup.value.open();
	};

	const commonDbRemoteTs = ref('')
	const userDbRemoteTs = ref('')
	const baseDbVersion = computed(() => formatCatalogVersionFromRemoteTs(commonDbRemoteTs.value))
	const userDbVersion = computed(() => formatCatalogVersionFromRemoteTs(userDbRemoteTs.value))

	const ulSyncTimeText = ref('—')
	const udSyncTimeText = ref('—')
	const mediaSyncTimeText = ref('—')
	const mediaCountText = ref('—')

	const loadSyncMetaFromStorage = () => {
		try {
			commonDbRemoteTs.value = String(uni.getStorageSync(STORAGE_COMMON_DB_TS) || '')
			userDbRemoteTs.value = String(uni.getStorageSync(STORAGE_USER_DB_TS) || '')
			const ul = uni.getStorageSync(STORAGE_UL_SYNC)
			const ud = uni.getStorageSync(STORAGE_UD_SYNC)
			const media = uni.getStorageSync(STORAGE_MEDIA_SYNC)
			ulSyncTimeText.value = ul ? formatSyncTimeDisplay(ul) : '—'
			udSyncTimeText.value = ud ? formatSyncTimeDisplay(ud) : '—'
			mediaSyncTimeText.value = media ? formatSyncTimeDisplay(media) : '—'
			const c = uni.getStorageSync(STORAGE_MEDIA_COUNT)
			mediaCountText.value = c !== '' && c !== undefined && c !== null ? String(c) : '—'
		} catch (e) {
			console.warn('loadSyncMetaFromStorage', e)
		}
	}

	const markBaseDbSyncedNow = () => {
		const t = formatNowForDisplay()
		try {
			uni.setStorageSync(STORAGE_UL_SYNC, t)
		} catch (e) {}
		ulSyncTimeText.value = t
	}

	const markUserDbSyncedNow = () => {
		const t = formatNowForDisplay()
		try {
			uni.setStorageSync(STORAGE_UD_SYNC, t)
		} catch (e) {}
		udSyncTimeText.value = t
	}

	const getAuthToken = async () => {
		let raw = userInfo.infoData
		const data = typeof raw === 'object' && raw !== null ? raw : {}
		let token = data.token
		if (!token && userInfo.username && userInfo.password) {
			const res = await uni.request({
				url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${encodeURIComponent(userInfo.username)}&password=${encodeURIComponent(userInfo.password)}`,
				method: 'POST',
				timeout: 10000
			})
			const loginData = res.data
			if (res.statusCode === 200 && loginData && loginData.code === 0 && loginData.token) {
				token = loginData.token
				userInfo.setUserInfo({
					username: userInfo.username,
					password: userInfo.password,
					infoData: loginData
				})
				infoData.value = loginData
			} else {
				throw new Error((loginData && loginData.msg) || '登录凭证失效，请重新登录')
			}
		}
		if (!token) throw new Error('无登录凭证，请先登录')
		return token
	}

	const handleSyncBaseDb = async () => {
		uni.showLoading({
			title: '同步中...',
			mask: true
		})
		try {
			const token = await getAuthToken()
			let storedTs = ''
			try {
				storedTs = String(uni.getStorageSync(STORAGE_COMMON_DB_TS) || '')
			} catch (e) {
				storedTs = ''
			}
			const meta = await fetchCommonSqliteMeta(token)
			const remoteTs = String(meta.timestamp ?? '')
			const commonDbOnDisk = await docRelativeFileExists(COMMON_CATALOG_DOC_REL_PATH)
			if (storedTs !== '' && remoteTs === storedTs && commonDbOnDisk) {
				uni.showToast({
					title: '已是最新版本',
					icon: 'success'
				})
				return
			}
			const hint = [remoteTs, meta.size].filter(Boolean).join(' · ')
			uni.hideLoading()
			const ok = await showUpdateConfirmModal(
				'同步基础数据库',
				hint
					? `将下载桥梁模板库 common.db（${hint}）到本机，是否继续？`
					: '将下载桥梁模板库 common.db 到本机，是否继续？'
			)
			if (!ok) return
			uni.showLoading({
				title: '正在下载...',
				mask: true
			})
			await syncCommonSqliteToDoc(token, { meta })
			markBaseDbSyncedNow()
			loadSyncMetaFromStorage()
			uni.showToast({
				title: '基础库同步完成',
				icon: 'success'
			})
		} catch (e) {
			console.error('同步基础库失败', e)
			if (offlineFailRef.value) {
				offlineFailRef.value.show('同步失败', (e && e.message) || '请检查网络后重试')
			} else {
				uni.showToast({
					title: (e && e.message) || '同步失败',
					icon: 'none'
				})
			}
		} finally {
			uni.hideLoading()
		}
	}

	const handleSyncUserDb = async () => {
		if (isDownloading.value) return
		uni.showLoading({
			title: '检查版本...',
			mask: true
		})
		try {
			const token = await getAuthToken()
			const uid = unref(idInfo.userId)
			if (!uid) {
				uni.showToast({
					title: '缺少用户 id，请重新登录',
					icon: 'none'
				})
				return
			}
			const meta = await fetchUserSqliteMeta(uid, token)
			let storedTs = ''
			try {
				storedTs = String(uni.getStorageSync(STORAGE_USER_DB_TS) || '')
			} catch (e) {
				storedTs = ''
			}
			const remoteTs = String(meta.timestamp ?? '')
			const dirOld = userInfo.UDPath
			const r14 = apiTimestampTo14Digits(meta.timestamp)
			const l14 = extract14DigitsFromUdPath(dirOld)
			const needs =
				!dirOld || remoteTs !== storedTs || Boolean(r14 && l14 && r14 > l14)
			if (!needs) {
				uni.showToast({
					title: '已是最新版本',
					icon: 'success'
				})
				return
			}
			const hint = [remoteTs, meta.size].filter(Boolean).join(' · ')
			const ok = await showUpdateConfirmModal(
				'同步用户数据库',
				hint
					? `将下载最新用户库（${hint}），是否继续？`
					: '将下载最新用户数据库，是否继续？'
			)
			if (!ok) return

			uni.hideLoading()
			cleanupDownloadListeners()
			resetDownloadState()
			isDownloading.value = true
			const taskId = Date.now()
			showDownloadProgress.value = true
			currentTaskId.value = taskId

			uni.$on('download-progress', (progress) => {
				if (!isDownloading.value || progress.taskId !== taskId) return
				downloadProgress.value = progress.progress || 0
				if (progress.packageSize) {
					const size = Number(progress.packageSize)
					if (!isNaN(size) && size > 0) packageSize.value = size
				}
			})

			const parsedSize = parsePackageSize(meta.size)
			if (parsedSize) packageSize.value = parsedSize

			const { dirNew, ulDir } = await installUserSqlitePackage(token, userInfo.username, uid, {
				taskId,
				meta,
				onProgress: (p) => {
					uni.$emit('download-progress', {
						...p,
						taskId
					})
				}
			})

			const oldUDPath = userInfo.UDPath
			if (oldUDPath && oldUDPath !== dirNew) {
				try {
					await deleteOldDirectory(`_doc/${oldUDPath}`)
				} catch (err) {
					console.warn('删除旧 UD 目录失败', err)
				}
			}
			userInfo.setUDPath(dirNew)
			userInfo.setULPath(ulDir)
			try {
				await safeMigrateUdWorkspaceDocumentsWithOptions(dirNew, {
					deleteJson: false,
					userId: unref(idInfo.userId)
				})
			} catch (e) {
				console.error('迁移 UD JSON -> SQLite 失败:', e)
			}

			markUserDbSyncedNow()
			loadSyncMetaFromStorage()
			uni.showToast({
				title: '用户库同步完成',
				icon: 'success'
			})
		} catch (e) {
			console.error('同步用户库失败', e)
			if (offlineFailRef.value) {
				offlineFailRef.value.show('同步失败', (e && e.message) || '请检查网络后重试')
			} else {
				uni.showToast({
					title: (e && e.message) || '同步失败',
					icon: 'none'
				})
			}
		} finally {
			cleanupDownloadListeners()
			resetDownloadState()
			uni.hideLoading()
		}
	}

	const countMediaUnderDoc = () => {
		return new Promise((resolve) => {
			// #ifdef APP-PLUS
			if (typeof plus === 'undefined') {
				resolve(0)
				return
			}
			const exts = /\.(jpg|jpeg|png|gif|webp|bmp)$/i
			let total = 0
			let pending = 0
			const readDirAll = (dirEntry, cb) => {
				const reader = dirEntry.createReader()
				const acc = []
				const readBatch = () => {
					reader.readEntries(
						(batch) => {
							if (batch.length) {
								acc.push(...batch)
								readBatch()
							} else {
								cb(acc)
							}
						},
						() => cb(acc)
					)
				}
				readBatch()
			}
			const walk = (dirEntry) => {
				pending++
				readDirAll(dirEntry, (entries) => {
					for (const e of entries) {
						if (e.isFile && exts.test(e.name)) total++
						else if (e.isDirectory) walk(e)
					}
					pending--
					if (pending <= 0) resolve(total)
				})
			}
			plus.io.resolveLocalFileSystemURL(
				'_doc/',
				(entry) => walk(entry),
				() => resolve(0)
			)
			// #endif
			// #ifndef APP-PLUS
			resolve(0)
			// #endif
		})
	}

	const handleResourceSync = async () => {
		uni.showLoading({ title: '统计中...', mask: true })
		try {
			const n = await countMediaUnderDoc()
			const t = formatNowForDisplay()
			uni.setStorageSync(STORAGE_MEDIA_COUNT, n)
			uni.setStorageSync(STORAGE_MEDIA_SYNC, t)
			mediaCountText.value = String(n)
			mediaSyncTimeText.value = t
			uni.showToast({ title: '资源统计完成', icon: 'success' })
		} catch (e) {
			uni.showToast({ title: '统计失败', icon: 'none' })
		} finally {
			uni.hideLoading()
		}
	}

	const refreshMediaCountFromStorage = () => {
		try {
			const c = uni.getStorageSync(STORAGE_MEDIA_COUNT)
			if (c !== '' && c !== undefined && c !== null) {
				mediaCountText.value = String(c)
			}
		} catch (e) {}
	}
	// 关闭修改密码弹窗
	const closePasswordModal = () => {
		passwordPopup.value.close();
	};

	const infoData = ref({});
	const loading = ref(false);

	// 添加进度条显示控制变量
	const showDownloadProgress = ref(false);
	const showUnzipProgress = ref(false);
	const packageSize = ref(null);
	const isDownloading = ref(false);

	// 版本更新弹窗相关变量
	const showUpdateModal = ref(false);
	const updateModalTitle = ref('发现新版本');
	const updateModalContent = ref('');
	const updateConfirmResolve = ref(null);

	// 自定义错误弹窗引用
	const offlineFailRef = ref(null);
	const offlineVersionRef = ref(null)

	// 检查更新按钮没网弹窗
	const dataOffline = ref(null);
	// 版本更新弹窗处理方法
	const handleUpdateConfirm = () => {
		showUpdateModal.value = false;
		if (updateConfirmResolve.value) {
			updateConfirmResolve.value(true);
			updateConfirmResolve.value = null;
		}
	};

	const handleUpdateCancel = () => {
		showUpdateModal.value = false;
		if (updateConfirmResolve.value) {
			updateConfirmResolve.value(false);
			updateConfirmResolve.value = null;
		}
	};

	// 处理自定义错误弹窗确认事件
	const handleOfflineFailConfirm = () => {
		console.log('用户确认了错误弹窗');
		// 可以在这里添加额外的处理逻辑
	};

	// 显示版本更新弹窗的方法
	const showUpdateConfirmModal = (title, content) => {
		return new Promise((resolve) => {
			updateModalTitle.value = title;
			updateModalContent.value = content;
			updateConfirmResolve.value = resolve;
			showUpdateModal.value = true;
		});
	};

	// 重置下载状态
	const resetDownloadState = () => {
		console.log('重置下载状态');
		resetProgress();
		showDownloadProgress.value = false;
		showUnzipProgress.value = false;
		packageSize.value = null;
		isDownloading.value = false;
	};

	// 清理事件监听器
	const cleanupDownloadListeners = () => {
		console.log('清理下载事件监听器');
		uni.$off('download-progress');
		uni.$off('unzip-progress');
		uni.$off('unzip-completed');
		uni.hideLoading();
	};

	// 删除旧目录
	const deleteOldDirectory = (dirPath) => {
		return new Promise((resolve, reject) => {
			console.log('准备删除目录:', dirPath);

			plus.io.resolveLocalFileSystemURL(dirPath, (entry) => {
				if (entry.isDirectory) {
					entry.removeRecursively(() => {
						console.log('目录删除成功:', dirPath);
						resolve();
					}, (err) => {
						console.error('目录删除失败:', dirPath, err);
						reject(err);
					});
				} else {
					console.error('路径不是目录:', dirPath);
					reject(new Error('路径不是目录'));
				}
			}, (err) => {
				console.error('解析目录路径失败:', dirPath, err);
				// 如果目录不存在，也认为删除成功
				if (err.code === 1) { // NOT_FOUND_ERR
					console.log('目录不存在，无需删除:', dirPath);
					resolve();
				} else {
					reject(err);
				}
			});
		});
	};

	// 退出登录
	const handleLogout = async () => {
		try {
			// 显示加载中
			uni.showLoading({
				title: '退出中...'
			});

			// 先获取token
			const responseLogin = await uni.request({
				url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${userInfo.username}&password=${userInfo.password}`,
				method: 'POST',
			});
			if (!responseLogin.data || !responseLogin.data.token) {
				uni.hideLoading();
				// 如果无法获取token，清理用户数据并跳转到登录页面
				userInfo.clearUserData();
				uni.reLaunch({
					url: '/pages/LoginPage/LoginPage'
				});
				return;
			}
			const token = responseLogin.data.token;

			// 向后端发送退出登录请求
			const response = await uni.request({
				// url: 'http://60.205.13.156:8090/api/user/logOut',
				url: `${apiConfig.baseURL}${apiConfig.endpoints.logOut}`,
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `${token}`
				}
			});

			uni.hideLoading();

			console.log('退出登录响应:', response.data);

			// 根据返回的code判断是否成功退出
			if (response.data && response.data.code === 0) {
				// 退出成功，清理用户数据
				userInfo.clearUserData();

				uni.showToast({
					title: '已退出登录',
					icon: 'success',
					duration: 1500,
					success: () => {
						// 跳转到登录页面
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/LoginPage/LoginPage'
							});
						}, 1500);
					}
				});
			} else {
				// 退出失败
				uni.showToast({
					title: response.data?.msg || '退出登录失败',
					icon: 'none',
					duration: 1500
				});
			}

		} catch (error) {
			uni.hideLoading();
			console.error('退出登录出错:', error);

			// 出错时也清理用户数据并跳转到登录页面
			userInfo.clearUserData();

			uni.showToast({
				title: '退出登录中出现错误',
				icon: 'none',
				duration: 1500,
				success: () => {
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/LoginPage/LoginPage'
						});
					}, 1500);
				}
			});
		}
	};

	// 修改密码
	const changePassword = async () => {
		// 验证输入
		if (!oldPassword.value) {
			uni.showToast({
				title: '请输入旧密码',
				icon: 'none'
			});
			return;
		}
		if (!newPassword.value) {
			uni.showToast({
				title: '请输入新密码',
				icon: 'none'
			});
			return;
		}
		if (newPassword.value !== confirmPassword.value) {
			uni.showToast({
				title: '两次输入的新密码不一致',
				icon: 'none'
			});
			return;
		}

		// 显示加载中
		uni.showLoading({
			title: '修改中...'
		});

		try {
			// 先获取token
			const responseLogin = await uni.request({
				url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${userInfo.username}&password=${userInfo.password}`,
				method: 'POST'
			});

			console.log('登录响应:', responseLogin.data);

			// 检查是否获取到token
			if (!responseLogin.data || !responseLogin.data.token) {
				uni.hideLoading();
				uni.showToast({
					title: '旧密码验证失败',
					icon: 'none'
				});
				return;
			}

			const token = responseLogin.data.token;

			// 向后端发送修改密码请求
			const response = await uni.request({
				url: `${apiConfig.baseURL}${apiConfig.endpoints.resetPassword}?oldPassword=${oldPassword.value}&newPassword=${newPassword.value}`,
				// url: `http://60.205.13.156:8090/api/user/resetPassword?oldPassword=${oldPassword.value}&newPassword=${newPassword.value}`,
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `${token}`
				}
			});

			// 隐藏加载中
			uni.hideLoading();

			console.log('修改密码响应:', response.data);

			// 检查响应状态
			if (response.data && response.data.code === 0) {
				// 关闭弹窗
				passwordPopup.value.close();

				// 清理用户数据
				userInfo.clearUserData();

				// 显示成功提示
				uni.showToast({
					title: '密码修改成功，请重新登录',
					icon: 'success',
					duration: 2000,
					success: () => {
						// 延迟跳转到登录页面，让用户看到提示
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/LoginPage/LoginPage'
							});
						}, 2000);
					}
				});
			} else {
				// 显示错误信息
				uni.showToast({
					title: response.data?.msg || '修改密码失败',
					icon: 'none'
				});
			}
		} catch (error) {
			// 隐藏加载中
			uni.hideLoading();

			console.error('修改密码出错:', error);
			uni.showToast({
				title: '网络错误，请稍后重试',
				icon: 'none'
			});
		}
	};

	const onClickUpdate = () => {
		uni.getNetworkType({
			success: (res) => {
				if (res.networkType === 'none') {
					// 离线，弹出离线版本弹窗
					if (offlineVersionRef.value) {
						offlineVersionRef.value.show()
					}
					return
				}

				// 在线情况下的检查更新逻辑
				// 显示检查中的提示
				uni.showLoading({
					title: '正在检查更新...',
					mask: true
				});

				// 检查当前环境
				const sysInfo = uni.getSystemInfoSync();
				if (sysInfo.platform === 'devtools') {
					uni.hideLoading();
					uni.showToast({
						title: '开发环境无法检查更新',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				// 获取当前版本号
				const currentVersion = versionNumber.value || sysInfo.appVersion || '1.0.0';
				console.log('当前应用版本:', currentVersion);
				console.log('当前系统信息:', sysInfo);
				console.log('appId:', sysInfo.appId);

				// 先检查是否能获取到widgetInfo.version，避免调用checkUpdate时出错
				if (typeof plus !== 'undefined' && plus.runtime) {
					plus.runtime.getProperty(plus.runtime.appid, function(widgetInfo) {
						console.log('widgetInfo:', widgetInfo);
						console.log('widgetInfo。version:', widgetInfo.version);
						if (!widgetInfo.version) {
							// 如果无法获取widgetInfo.version，直接显示当前是最新版本
							uni.hideLoading();
							uni.showToast({
								title: '已是最新版本',
								icon: 'success',
								duration: 2000
							});
							return;
						}

						// 如果能获取到版本信息，则调用checkUpdate
						try {
							// 直接调用checkUpdate，不传递参数，让它自己获取版本信息
							checkUpdate()
								.then(result => {
									uni.hideLoading();
									console.log('版本检查结果:', result);

									// 如果code为0，表示当前已是最新版本
									if (result && result.code === 0) {
										uni.showToast({
											title: '已是最新版本',
											icon: 'success',
											duration: 2000
										});
									}
									// 其他情况由checkUpdate函数内部处理
								})
								.catch(error => {
									uni.hideLoading();
									console.error('检查更新失败:', error);
									// const responseLogin = await uni.request({
									//   		url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${username.value}&password=${password.value}`,
									//   		method: 'POST'
									//   	});
									// infoData.value.token = responseLogin.data.token;
									// 显示友好的错误信息
									uni.showToast({
										title: '已是最新版本',
										icon: 'success',
										duration: 2000
									});
								});
						} catch (e) {
							uni.hideLoading();
							console.error('执行检查更新时出错:', e);

							uni.showToast({
								title: '已是最新版本',
								icon: 'success',
								duration: 2000
							});
						}
					});
				} else {
					// 如果plus环境不可用，直接显示当前是最新版本
					uni.hideLoading();
					// uni.showToast({
					// 	title: '已是最新版本',
					// 	icon: 'success',
					// 	duration: 2000
					// });
				}
			}
		});
	}

	//版本比较函数
	const compareVersion = (v1, v2) => {
		// 去掉前缀 v
		v1 = v1.replace(/^v/, '');
		v2 = v2.replace(/^v/, '');

		// 补年份（可选，如果你的年份只有两位，可以补成四位）
		// 假设 v1: 25-05-20 -> 2025-05-20
		const fullV1 = '20' + v1;
		const fullV2 = '20' + v2;

		// 转成日期对象或字符串比较
		if (fullV1 > fullV2) return 1;
		if (fullV1 < fullV2) return -1;
		return 0;
	}

	//下载并安装
	const downloadAndInstall = (url) => {
		uni.showLoading({
			title: '下载中...',
			mask: true
		});
		const dtask = plus.downloader.createDownload(url, {
			filename: "_doc/update/"
		}, (d, status) => {
			uni.hideLoading();
			if (status == 200) {
				console.log("下载成功：" + d.filename);
				plus.runtime.install(d.filename, {}, () => {
					console.log("安装成功");
					plus.runtime.restart();
				}, (e) => {
					console.error("安装失败：" + e.message);
					uni.showToast({
						title: '安装失败',
						icon: 'none'
					});
				});
			} else {
				console.error("下载失败：" + status);
				uni.showToast({
					title: '下载失败',
					icon: 'none'
				});
			}
		});
		dtask.start();
	}

	onMounted(() => {
		userAccount.value = userInfo.username
		loadSyncMetaFromStorage()
		refreshMediaCountFromStorage()
		if (typeof plus !== 'undefined' && plus.runtime) {
			plus.runtime.getProperty(plus.runtime.appid, (wgtinfo) => {
				versionNumber.value = wgtinfo.version || '—'
			})
		} else {
			versionNumber.value = '开发模式'
		}
		;(async () => {
			try {
				const responseLogin = await uni.request({
					url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${userInfo.username}&password=${userInfo.password}`,
					method: 'POST'
				})
				if (responseLogin.data && responseLogin.data.userName) {
					name.value = responseLogin.data.userName
				}
			} catch (error) {
				console.error('用户数据请求失败')
			}
		})()
	})

	onShow(() => {
		loadSyncMetaFromStorage()
		refreshMediaCountFromStorage()
		userAccount.value = userInfo.username
	})
</script>

<style lang="scss" scoped>
	$nav-blue: #0f4687;
	$row-action: #1677ff;
	$profile-bg: #bdcbed;
	/* 列表行高（略矮，与原型 1200:176「扁横条」观感一致的是资料区相对更舒展，而非把顶栏压死） */
	$setting-row-h: 64rpx;
	$setting-row-h-sm: 70rpx;

	.System {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #fff;
	}

	/* 资料区：在原先约 24+80+26rpx 量级上整体加高约 1/4 */
	.profile-card {
		background: $profile-bg;
		box-sizing: border-box;
		min-height: 163rpx;
		padding: 30rpx 24rpx 33rpx;
		border-bottom: 1rpx solid rgba(15, 70, 135, 0.06);
		display: flex;
		align-items: center;
	}

	.profile-inner {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: nowrap;
		width: 100%;
		min-width: 0;
	}

	/* 头像框 ≈ 2×「修改密码」按钮高度(40rpx) */
	.avatar-wrap {
		width: 80rpx;
		height: 80rpx;
		background: #fff;
		border-radius: 6rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.avatar {
		width: 58rpx;
		height: 58rpx;
	}

	.profile-text {
		flex: 1;
		min-width: 0;
		margin-left: 18rpx;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.profile-account {
		font-size: 14rpx;
		color: #333;
		font-weight: 500;
	}

	.profile-name {
		font-size: 12rpx;
		color: #888;
	}

	.profile-actions {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: nowrap;
		gap: 8rpx;
		flex-shrink: 0;
		margin-left: 10rpx;
	}

	.profile-btn {
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		margin: 0;
		font-size: 16rpx;
		color: #fff;
		background: $nav-blue;
		border-radius: 5rpx;
		border: none;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.profile-btn::after {
		border: none;
	}

	.profile-btn-hover {
		opacity: 0.88;
	}

	.setting-list {
		flex: 1;
		background: #fff;
		padding: 12rpx 24rpx 0;
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	}

	/* 所有列表行（含仅展示时间的行）栏高一致 */
	.setting-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		height: $setting-row-h;
		min-height: $setting-row-h;
		max-height: $setting-row-h;
		padding: 0;
		box-sizing: border-box;
		border-bottom: 1rpx solid #e8e8e8;
	}

	/* 版本号/数量与按钮同一侧，文本靠右贴近按钮 */
	.setting-row--action .setting-label {
		flex-shrink: 0;
	}

	.setting-row__tail {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		gap: 10rpx;
		padding-left: 8rpx;
	}

	.setting-row--action .setting-value {
		flex: 0 1 auto;
		max-width: 52%;
		text-align: right;
		padding: 0;
	}

	.setting-row--last {
		border-bottom: none;
	}

	.setting-row--time .setting-label {
		width: auto;
		flex: 0 1 auto;
		max-width: 56%;
		line-height: 1.25;
	}

	.setting-row--time .setting-value--right {
		flex: 1;
		min-width: 0;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.setting-label {
		font-size: 18rpx;
		color: #666666;
		width: 248rpx;
		flex-shrink: 0;
		line-height: 1.25;
	}

	.setting-value {
		flex: 1;
		min-width: 0;
		font-size: 18rpx;
		color: #666666;
		text-align: center;
		padding: 0 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.setting-value--right {
		text-align: right;
		font-size: 18rpx;
		color: #666666;
	}

	.row-action {
		flex-shrink: 0;
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		margin: 0;
		font-size: 16rpx;
		color: #fff;
		background: $row-action;
		border-radius: 5rpx;
		border: none;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.row-action::after {
		border: none !important;
	}

	.row-action-hover {
		opacity: 0.9;
	}

	@media (max-width: 599px) {
		.setting-label,
		.setting-value,
		.setting-value--right {
			font-size: 20rpx;
		}

		.setting-row {
			height: $setting-row-h-sm;
			min-height: $setting-row-h-sm;
			max-height: $setting-row-h-sm;
		}
	}

	// 修改密码弹窗样式
	.password-popup-content {
		background-color: #fff;
		padding: 0;
		width: 500rpx;
		border-radius: 10rpx;
		overflow: hidden;
	}

	.popup-title {
		font-size: 20rpx;
		text-align: center;
		color: #333;
		background-color: #BDCBE0;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.password-form {
		padding: 20rpx;
	}

	.password-row {
		margin-bottom: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.password-label {
		font-size: 20rpx;
		color: #666;
		margin-bottom: 10rpx;
	}

	.password-input {
		border: 1px solid #ddd;
		border-radius: 5rpx;
		height: 60rpx;
		padding: 0 10rpx;
		font-size: 20rpx;
	}

	.popup-buttons {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16rpx;
		padding: 16rpx 20rpx;
		border-top: 1px solid #eee;
		box-sizing: border-box;
	}

	.popup-btn {
		flex: 1;
		min-width: 0;
		height: 40rpx;
		line-height: 40rpx;
		border-radius: 5rpx;
		font-size: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 10rpx;
		box-sizing: border-box;
	}

	.cancel-btn {
		background-color: #f5f5f5;
		color: #333;
	}

	.confirm-btn {
		background-color: #1677ff;
		color: #fff;
	}

	/* 下载进度条样式 */
	.download-progress-container {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 80%;
		background-color: #fff;
		border-radius: 8px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.progress-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
	}

	.progress-percent {
		font-size: 16px;
		font-weight: bold;
		color: #1677ff;
	}

	.progress-bar-bg {
		width: 100%;
		height: 10px;
		background-color: #e0e0e0;
		border-radius: 5px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background-color: #1677ff;
		border-radius: 5px;
		transition: width 0.3s ease;
	}

	.progress-info {
		margin-top: 10px;
		font-size: 14px;
		color: #666;
		text-align: center;
	}
</style>
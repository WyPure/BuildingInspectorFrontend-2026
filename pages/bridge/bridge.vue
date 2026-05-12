<!-- 
 项目列表
 author:ykx
 date:2025.6.3
 Bug：4
 -->
<template>
	<!-- 内容区 -->
	<view class="container">
		<!-- 下载进度条 -->
		<view class="download-progress-container" v-if="showDownloadProgress && isActiveProgressId(currentProgressId)">
			<view class="progress-header">
				<text class="progress-title">正在下载数据包 {{ formattedPackageSize }}</text>
				<text class="progress-percent">{{ Math.floor(downloadProgress) }}%</text>
			</view>
			<view class="progress-bar-bg">
				<view class="progress-bar-fill" :style="{ width: downloadProgress + '%' }"></view>
			</view>
			<view class="progress-info">
				<text>已下载: {{ downloadedSize }}</text>
			</view>
		</view>

		<!-- 解压进度条 -->
		<view class="download-progress-container" v-if="showUnzipProgress && isActiveProgressId(currentProgressId)">
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

		<!-- 信息卡片 -->
		<view class="info-card">
			<view class="info-boxes">
				<view class="info-box">
					<text class="label">检测单位</text>
					<text class="value">{{ infoData.userDept|| '暂无数据' }}</text>
				</view>
				<view class="info-box">
					<text class="label">检测人员</text>
					<text class="value">{{ infoData.userName || '暂无数据' }}</text>
				</view>
				<view class="info-box">
					<text class="label">检测年度</text>
					<picker class="year-picker" :value="selectedYearIndex" :range="years" @change="changeYear">
						<view class="picker-content">
							<text class="value">{{ currentYear }}年度</text>
							<image class="year-value-chevron" src="/static/image/RightOutline.svg"
								mode="aspectFit" />
						</view>
					</picker>
				</view>
			</view>
		</view>

		<!-- 项目列表 -->
		<view class="bridge-list">
			<view class="bridge-item" v-for="(item, index) in filteredProjects" :key="index" @click="goToList(item)">
				<view class="bridge-info">
					<view class="bridge-code">{{ item.code || '暂无编号' }}</view>
					<view class="bridge-name">{{ item.name || '暂无名称' }}</view>
					<view class="bridge-location">{{ item.ownerDept?.deptName || '暂无公司' }}</view>
				</view>
				<view class="bridge-meta">
					<view class="text-group">
						<!--						<text class="bridge-status"
							:class="{ 'completed': item.status === '1' }">{{ getStatusText(item.status) }}</text>-->
						<text class="bridge-progress"
							:class="isProjectCompleted(item.id) ? 'completed' : 'uncompleted'">
							{{ filteredProjectsTasks.length > 0 ? getProjectProgressText(item.id) : '加载中...' }}
						</text>
						<text class="bridge-progress-count">
							{{ filteredProjectsTasks.length > 0 ? `${getCommitedTasksNumber(item.id)}/${getTasksNumber(item.id)}` : '' }}
						</text>
					</view>
					<image src="/static/image/RightOutline.svg" mode="scaleToFill" />
				</view>
			</view>
		</view>
		<ChatAgentButton />
	</view>

	<!-- 下载确认弹窗 -->
	<downLoadWindow :visible="showDownloadModal" :title="downloadModalTitle" :content="downloadModalContent"
		@confirm="handleDownloadConfirm" @cancel="handleDownloadCancel" />

	<!-- 版本更新弹窗 -->
	<updateVersionWindow :visible="showUpdateModal" :title="updateModalTitle" :content="updateModalContent"
		@confirm="handleUpdateConfirm" @cancel="handleUpdateCancel" />

</template>

<script setup>
	import {
		computed,
		onMounted,
		onUnmounted,
		ref,
		unref,
		watch
	} from 'vue';
	import {
		getProject,
		getTask,
		getTaskByHadUsername
	} from '../../utils/readJsonNew';
	import {
		userStore
	} from '@/store/index.js'
	import {
		idStore
	} from '../../store/idStorage';
	// 从downloadUtils中导入函数
	import {
		parsePackageSize,
		useDownloader
	} from '@/utils/downloadUtils.js';
	// 导入全局进度条管理器
	import {
		clearActiveProgressId,
		isActiveProgressId,
		setActiveProgressId
	} from '@/utils/progressManager.js';
	import ChatAgentButton from "../../components/ChatAgentButton.vue";
	// 导入下载确认弹窗组件
	import downLoadWindow from '@/components/downLoadWindow.vue';
	import apiConfig from '../../config/api';
	// 导入版本更新弹窗组件
	import updateVersionWindow from '@/components/updateVersionWindow.vue';
	import {
		getBuildingCommitedNumber
	} from "@/utils/isBuildingCommited";
	import {
		safeMigrateUdWorkspaceDocumentsWithOptions
	} from '@/utils/businessDocumentStore.js'
	import {
		fetchUserSqliteMeta,
		installUserSqlitePackage,
		apiTimestampTo14Digits,
		extract14DigitsFromUdPath,
		STORAGE_USER_DB_TS
	} from '@/utils/sqlitePackageSync.js'

	// 引入下载器（downloadAndUnzip 在 init 无本地数据分支里会用到，必须从 hook 解构出来）
	const {
		downloadProgress,
		unzipProgress,
		resetProgress,
		downloadAndUnzip
	} = useDownloader();

	// 添加进度条显示控制变量
	const showDownloadProgress = ref(false);
	const showUnzipProgress = ref(false);
	const packageSize = ref(null); // 添加包大小变量
	const isDownloading = ref(false);
	const hasCheckedVersion = ref(false); // 添加版本检查标志

	// 添加进度条ID管理
	const currentProgressId = ref(null); // 当前页面的进度条ID

	// 下载确认弹窗相关变量
	const showDownloadModal = ref(false);
	const downloadModalTitle = ref('需要下载数据包');
	const downloadModalContent = ref('');
	const downloadConfirmResolve = ref(null); // 用于Promise的resolve函数

	// 版本更新弹窗相关变量
	const showUpdateModal = ref(false);
	const updateModalTitle = ref('发现新版本');
	const updateModalContent = ref('');
	const updateConfirmResolve = ref(null); // 用于Promise的resolve函数

	// 下载确认弹窗处理方法
	const handleDownloadConfirm = () => {
		showDownloadModal.value = false;
		if (downloadConfirmResolve.value) {
			downloadConfirmResolve.value(true);
			downloadConfirmResolve.value = null;
		}
	};

	const handleDownloadCancel = () => {
		showDownloadModal.value = false;
		if (downloadConfirmResolve.value) {
			downloadConfirmResolve.value(false);
			downloadConfirmResolve.value = null;
		}
	};

	// 显示下载确认弹窗的方法
	const showDownloadConfirmModal = (title, content) => {
		return new Promise((resolve) => {
			downloadModalTitle.value = title;
			downloadModalContent.value = content;
			downloadConfirmResolve.value = resolve;
			showDownloadModal.value = true;
		});
	};

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

	// 显示版本更新弹窗的方法
	const showUpdateConfirmModal = (title, content) => {
		return new Promise((resolve) => {
			updateModalTitle.value = title;
			updateModalContent.value = content;
			updateConfirmResolve.value = resolve;
			showUpdateModal.value = true;
		});
	};

	// 获取当前日期字符串 (格式: YY-MM-DD)
	function getCurrentDateStr() {
		const now = new Date();
		const year = now.getFullYear().toString().slice(-2);
		const month = (now.getMonth() + 1).toString().padStart(2, '0');
		const day = now.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// 生成用户目录名（格式: UD25-06-11-userName）
	function getUserDir(userName) {
		return `UD${getCurrentDateStr()}-${userName}`;
	}

	// 从目录名中提取用户名
	function extractUserNameFromDir(dirName) {
		// 检查目录名格式是否符合 UD日期-用户名
		if (dirName && dirName.startsWith('UD') && dirName.includes('-')) {
			// 获取最后一个'-'后面的内容作为用户名
			const lastDashIndex = dirName.lastIndexOf('-');
			if (lastDashIndex !== -1 && lastDashIndex < dirName.length - 1) {
				return dirName.substring(lastDashIndex + 1);
			}
		}
		return ''; // 如果格式不符，返回空字符串
	}

	// 检测年度选项
	// const years = ref([2025, 2024, 2023, 2022, 2021, 2020]);

	// 获取当前年份
	const currentYear = ref(new Date().getFullYear());

	const initData = ref(null);
	const infoData = ref({});
	// const username = ref("admin")
	// const password = ref(123456);
	const userInfo = userStore()
	const idInfo = idStore()
	// 用户目录变量
	const dir = ref('');
	const selectedYearIndex = ref(0);
	const years = ref([]);
	const tasksNumber = ref(0)
	const loading = ref(false)
	const localProjects = ref([]);
	const data = ref('');

	const handleUnpdate = async () => {
		try {
			// 防止重复检查版本
			if (hasCheckedVersion.value) {

				return;
			}

			infoData.value = userInfo.infoData;
			if (typeof infoData.value !== 'object' || infoData.value === null) {
				infoData.value = {};
			}

			let token = infoData.value.token;
			if (!token && userInfo.username && userInfo.password) {
				const responseLogin = await uni.request({
					url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${encodeURIComponent(userInfo.username)}&password=${encodeURIComponent(userInfo.password)}`,
					method: 'POST',
					timeout: 10000
				});
				const loginData = responseLogin.data;
				if (responseLogin.statusCode === 200 && loginData && loginData.code === 0 && loginData.token) {
					token = loginData.token;
					infoData.value = loginData;
					userInfo.setUserInfo({
						username: userInfo.username,
						password: userInfo.password,
						infoData: loginData
					});
				} else {
					uni.showToast({
						title: (loginData && loginData.msg) || '登录凭证失效，请重新登录',
						icon: 'none'
					});
					return;
				}
			}

			if (!token) {
				uni.showToast({
					title: '无登录凭证，无法获取数据包信息',
					icon: 'none'
				});
				return;
			}

			const uid = unref(idInfo.userId);
			if (!uid) {
				uni.showToast({
					title: '缺少用户 id，请重新登录',
					icon: 'none'
				});
				return;
			}

			const meta = await fetchUserSqliteMeta(uid, token);
			let storedTs = '';
			try {
				storedTs = String(uni.getStorageSync(STORAGE_USER_DB_TS) || '');
			} catch (e) {
				storedTs = '';
			}
			const remoteTs = String(meta.timestamp ?? '');
			const dirOld = userInfo.UDPath;
			const r14 = apiTimestampTo14Digits(meta.timestamp);
			const l14 = extract14DigitsFromUdPath(dirOld);
			const tsChanged = remoteTs !== storedTs;
			const versionAhead = Boolean(r14 && l14 && r14 > l14);
			const needsUpdate = !dirOld || tsChanged || versionAhead;

			if (!dirOld) {
				const hint = [remoteTs, meta.size].filter(Boolean).join(' · ');
				const confirmResult = await showDownloadConfirmModal(
					'需要下载用户数据',
					hint
						? `将从服务器同步用户数据库（${hint}），是否继续？`
						: '将从服务器同步用户数据库，是否继续？'
				);

				if (confirmResult) {
					await downloadAndUnzipPackage(token, meta);
					hasCheckedVersion.value = true;
				}
				return;
			}

			if (needsUpdate) {
				const hint = [remoteTs, meta.size].filter(Boolean).join(' · ');
				const confirmResult = await showUpdateConfirmModal(
					'发现新版本',
					hint
						? `服务器用户库已更新（${hint}），是否立即同步？`
						: '服务器用户库已更新，是否立即同步？'
				);

				if (confirmResult) {
					await downloadAndUnzipPackage(token, meta);
				}
			}

			hasCheckedVersion.value = true;
		} catch (error) {
			console.error('检查更新失败:', error);
			hasCheckedVersion.value = true;

			const msg = error && error.message ? String(error.message) : '检查数据包失败';
			if (!msg.includes('无效的目录格式')) {
				uni.showToast({
					title: msg.length > 24 ? '无法获取数据包信息，请检查网络与接口' : msg,
					icon: 'none',
					duration: 3000
				});
			}
		} finally {
			loading.value = false;
		}
	};

	// 重置下载状态
	const resetDownloadState = () => {

		resetProgress();
		showDownloadProgress.value = false;
		showUnzipProgress.value = false;
		packageSize.value = null;
		isDownloading.value = false;
		// 清理进度条ID
		if (currentProgressId.value) {
			clearActiveProgressId(currentProgressId.value);
			currentProgressId.value = null;
		}
	};

	// 清理事件监听器
	const cleanupDownloadListeners = () => {

		uni.$off('download-progress');
		uni.$off('unzip-progress');
		uni.$off('unzip-completed');
		uni.hideLoading();
	};

	/** 用户工作区：v2 元数据 + 下载 u{userId}.db（沿用页面下载进度条） */
	const downloadAndUnzipPackage = async (token, prefetchedMeta) => {
		if (isDownloading.value) return;

		cleanupDownloadListeners();
		resetDownloadState();
		isDownloading.value = true;
		const taskId = Date.now();
		currentProgressId.value = taskId;
		setActiveProgressId(taskId);
		showDownloadProgress.value = true;

		uni.$on('download-progress', (progress) => {
			if (!isDownloading.value || progress.taskId !== taskId) return;
			if (!isActiveProgressId(currentProgressId.value)) return;
			downloadProgress.value = progress.progress || 0;
			if (progress.packageSize) {
				const size = Number(progress.packageSize);
				if (!isNaN(size) && size > 0) packageSize.value = size;
			}
		});

		try {
			let meta = prefetchedMeta;
			if (!meta || !meta.url) {
				meta = await fetchUserSqliteMeta(unref(idInfo.userId), token);
			}
			const parsedSize = parsePackageSize(meta.size);
			if (parsedSize) packageSize.value = parsedSize;

			const { dirNew, ulDir } = await installUserSqlitePackage(token, userInfo.username, unref(idInfo.userId), {
				taskId,
				meta,
				onProgress: (p) => {
					uni.$emit('download-progress', {
						...p,
						taskId
					});
				}
			});

			const oldUDPath = userInfo.UDPath;
			if (oldUDPath && oldUDPath !== dirNew) {
				try {
					await deleteOldDirectory(`_doc/${oldUDPath}`);
				} catch (error) {
					/* 继续 */
				}
			}

			userInfo.setUDPath(dirNew);
			userInfo.setULPath(ulDir);

			try {
				await safeMigrateUdWorkspaceDocumentsWithOptions(dirNew, {
					deleteJson: false,
					userId: unref(idInfo.userId)
				});
			} catch (e) {
				console.error('迁移 UD JSON -> SQLite 失败:', e);
			}

			uni.showToast({
				title: '数据更新成功',
				icon: 'success',
				duration: 2000
			});
		} catch (error) {
			console.error('用户库同步失败:', error);
			uni.showModal({
				title: '更新失败',
				content: error.message || '下载用户数据库失败，请重试',
				showCancel: false
			});
			throw error;
		} finally {
			cleanupDownloadListeners();
			resetDownloadState();
		}
	};

	// 删除旧目录
	const deleteOldDirectory = (dirPath) => {
		return new Promise((resolve, reject) => {


			plus.io.resolveLocalFileSystemURL(dirPath, (entry) => {
				if (entry.isDirectory) {
					entry.removeRecursively(() => {

						resolve();
					}, (err) => {

						reject(err);
					});
				} else {

					reject(new Error('路径不是目录'));
				}
			}, (err) => {

				// 如果目录不存在，也认为删除成功
				if (err.code === 1) { // NOT_FOUND_ERR

					resolve();
				} else {
					reject(err);
				}
			});
		});
	};

	// 初始化本地路径
	const initializeLocalPaths = async () => {
		try {

			// 检查UDPath是否匹配当前用户，如果不匹配则重置
			if (userInfo.UDPath) {
				const currentUsername = userInfo.username;
				const dirUser = extractUserNameFromDir(userInfo.UDPath);
				if (currentUsername && dirUser && dirUser !== currentUsername) {
					userInfo.setUDPath('');
					hasCheckedVersion.value = false;
				} else {
					return;
				}
			}

			// 检查本地是否有UD目录
			await new Promise((resolve) => {
				plus.io.resolveLocalFileSystemURL('_doc/', (entry) => {
					entry.createReader().readEntries((entries) => {

						// 查找UD开头的目录
						const udDirs = entries
							.filter(e => e.isDirectory && e.name.startsWith('UD'))
							.sort((a, b) => {
								// 按目录名排序，最新的在前
								return b.name.localeCompare(a.name);
							});

						if (udDirs.length > 0) {
							const latestDir = udDirs[0].name;

							// 检查目录是否包含当前用户名
							const currentUsername = userInfo.username;
							let matchedDir = null;

							// 优先查找匹配当前用户名的目录
							if (currentUsername) {
								for (const dir of udDirs) {
									if (extractUserNameFromDir(dir.name) === currentUsername) {
										matchedDir = dir.name;
										break;
									}
								}
							}

							// 如果没找到匹配的，不设置UDPath，让系统识别为需要下载
							if (!matchedDir) {
								// 不设置UDPath，让handleUnpdate识别为需要下载
							} else {
								userInfo.setUDPath(matchedDir);
							}
						} else {
							// 不设置UDPath，让handleUnpdate识别为首次安装
						}

						resolve();
					}, (err) => {
						resolve();
					});
				}, (err) => {
					resolve();
				});
			});

		} catch (error) {}
	};

	//初始化数据
	const init = async () => {
		try {
			// 在线登录逻辑
			// const responseLogin = await uni.request({
			// 	url: `http://60.205.13.156:8090/jwt/login?username=${userInfo.username}&password=${userInfo.password}`,
			// 	method: 'POST'
			// });
			infoData.value = userInfo.infoData

			// 在检查版本更新之前，先尝试设置本地的UDPath
			await initializeLocalPaths();

			// 然后再检查版本更新
			await handleUnpdate()

			if (infoData.value.token) {
				loading.value = true;

				// 不再调用testAPI
				// 直接下载数据包
				try {
					const token = infoData.value.token;

					// v2：尚无 UD 工作区时首次同步用户库
					if (!userInfo.UDPath) {
						const initTaskId = Date.now();
						currentProgressId.value = initTaskId;
						setActiveProgressId(initTaskId);
						showDownloadProgress.value = true;
						uni.$on('download-progress', (progress) => {
							if (!isActiveProgressId(currentProgressId.value)) return;
							downloadProgress.value = progress.progress || 0;
							if (progress.packageSize) {
								const size = Number(progress.packageSize);
								if (!isNaN(size) && size > 0) packageSize.value = size;
							}
						});
						uni.$on('unzip-progress', (progress) => {
							if (!isActiveProgressId(currentProgressId.value)) return;
							showDownloadProgress.value = false;
							showUnzipProgress.value = true;
							unzipProgress.value = progress.progress || 0;
						});
						uni.$on('unzip-completed', () => {
							if (!isActiveProgressId(currentProgressId.value)) return;
							uni.$off('download-progress');
							uni.$off('unzip-progress');
							uni.$off('unzip-completed');
							showDownloadProgress.value = false;
							showUnzipProgress.value = false;
							if (currentProgressId.value) {
								clearActiveProgressId(currentProgressId.value);
								currentProgressId.value = null;
							}
						});
						try {
							await downloadAndUnzip(token);
						} catch (e) {
							console.error('首次同步用户库失败:', e);
							uni.showModal({
								title: '下载失败',
								content: e.message || '无法下载用户数据，请检查网络后重试',
								showCancel: false
							});
						} finally {
							uni.$off('download-progress');
							uni.$off('unzip-progress');
							uni.$off('unzip-completed');
							showDownloadProgress.value = false;
							showUnzipProgress.value = false;
							clearActiveProgressId(initTaskId);
							currentProgressId.value = null;
						}
					}

				} catch (error) {
					// 移除下载进度监听并隐藏进度条
					uni.$off('download-progress');
					uni.$off('unzip-progress');
					uni.$off('unzip-completed'); // 确保移除解压完成事件监听
					showDownloadProgress.value = false;
					showUnzipProgress.value = false;
					uni.hideLoading();

					console.error('下载数据包失败:', error);
					// 显示更详细的错误信息
					let errorMsg = '下载失败';
					if (error.message) {
						if (error.message.includes('token')) {
							errorMsg = '身份验证失败，请重新登录';
						} else if (error.message.includes('解压')) {
							errorMsg = '同步用户库失败';
						} else if (error.message.includes('超时')) {
							errorMsg = '下载超时，请检查网络';
						} else if (error.message.includes('状态码')) {
							errorMsg = '服务器返回错误';
						} else {
							errorMsg = '下载数据包失败: ' + error.message;
						}
					}

					uni.showModal({
						title: '下载失败',
						content: errorMsg,
						showCancel: false
					});
				}
			} else {
				console.error('未获取到有效token');
				if (userInfo.username && userInfo.password) {
					const responseLogin = await uni.request({
						url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${encodeURIComponent(userInfo.username)}&password=${encodeURIComponent(userInfo.password)}`,
						method: 'POST',
						timeout: 10000
					});
					const ld = responseLogin.data;
					if (ld && ld.code === 0 && ld.token) {
						infoData.value = ld;
						userInfo.setUserInfo({
							username: userInfo.username,
							password: userInfo.password,
							infoData: ld
						});
					} else {
						uni.showToast({ title: (ld && ld.msg) || '请重新登录', icon: 'none' });
					}
				} else {
					uni.showToast({ title: '登录信息无效，请重新登录', icon: 'none' });
				}
			}
		} catch (error) {
			// 离线登录逻辑
			const allUsers = await readUserFolders();
			let foundUserData = false;

			for (const user of allUsers) {
				const hadUsernameArrBySplit = user.split('-');
				const hadUsername = hadUsernameArrBySplit[hadUsernameArrBySplit.length - 1];
				if (hadUsername === userInfo.username) {
					//已存在此用户 去读旧数据

					userInfo.setHadUsername(user); // 设置已存在的用户名到store


					// 离线模式下也设置UDPath，用于版本比较
					if (user.startsWith('UD')) {

						userInfo.setUDPath(user);
					}
					foundUserData = true;
					break;
				}
			}

			if (!foundUserData) {
				// 没有找到当前用户的数据，提示需要联网下载

				uni.showModal({
					title: '本地无数据',
					content: '检测到本地没有当前用户的数据包，请先联网登录下载数据包后再使用离线模式。',
					showCancel: false,
					confirmText: '返回登录',
					success: () => {
						// 清理用户数据，返回登录页面
						userInfo.clearUserData();
						uni.reLaunch({
							url: '/pages/LoginPage/LoginPage'
						});
					}
				});
				return; // 不继续执行后续逻辑
			}


			// uni.showToast({
			// 	title: '当前无网络，离线模式登录',
			// 	icon: 'none'
			// });

			// 离线模式下也尝试复制object.json文件

			// 移除自动复制代码
		} finally {
			try {
				//不论有没有网，都从本地读取project


				// 直接尝试读取项目数据，不做文件检查
				try {
					const localProjectsAsync = await getProject(userInfo.username);
					data.value = localProjectsAsync;


					// 确保data.value包含projects数组
					if (data.value && data.value.projects && Array.isArray(data.value.projects)) {
						// 获取项目数据
						const projectsData = data.value.projects;




						// 检查是否是离线模式（有hadUsername）
						if (userInfo.hadUsername) {

							await getProjectsTasksByHadUsername(projectsData, userInfo.hadUsername);
						} else {

							await getProjectsTasks(projectsData);
						}



						// 提取并处理年份
						const repeatYears = projectsData
							.map(item => Number(item.year))
							.filter(year => !isNaN(year));

						// 去重并降序排序
						years.value = [...new Set(repeatYears)].sort((a, b) => b - a);

						if (years.value.length > 0) {
							currentYear.value = years.value[0];

						} else {
							// 如果没有有效年份，使用当前年份
							const thisYear = new Date().getFullYear();
							years.value = [thisYear];
							currentYear.value = thisYear;

						}
					} else {

						// 确保data.value有一个空的projects数组
						if (!data.value) data.value = {};
						data.value.projects = [];
						years.value = [new Date().getFullYear()];
						currentYear.value = years.value[0];
					}
				} catch (readError) {
					console.error('读取项目数据失败:', readError);
					// 确保data.value有一个空的projects数组
					if (!data.value) data.value = {};
					data.value.projects = [];
					years.value = [new Date().getFullYear()];
					currentYear.value = years.value[0];
				}
			} catch (error) {
				console.error('从本地读取数据时发生错误:', error);
				// 设置默认值，避免页面显示错误
				if (!data.value) data.value = {};
				data.value.projects = [];
				years.value = [new Date().getFullYear()];
				currentYear.value = years.value[0];
			} finally {
				loading.value = false; // 确保加载状态在请求完成后被重置
			}
		}
	};

	function readUserFolders() {
		return new Promise((resolve, reject) => {
			plus.io.resolveLocalFileSystemURL('_doc/', (entry) => {
				entry.createReader().readEntries((entries) => {
					const folders = entries.filter(e => e.isDirectory);
					resolve(folders.map(f => f.name));
				}, reject);
			}, reject);
		});
	}

	// 添加计算属性
	const filteredProjects = computed(() => {
		// 确保data.value存在并且包含projects数组
		if (!data.value || !data.value.projects || !Array.isArray(data.value.projects)) {
			return [];
		}

		return data.value.projects.filter(project => {
			// 确保year字段存在并进行类型转换比较
			const projectYear = Number(project.year);
			const currentYearValue = Number(currentYear.value);
			return !isNaN(projectYear) && !isNaN(currentYearValue) && projectYear === currentYearValue;
		});
	});
	const filteredProjectsTasks = ref([])

	// 创建一个计算属性来映射项目ID到任务数量
	const projectTasksMap = computed(() => {

		const map = new Map();
		if (Array.isArray(filteredProjectsTasks.value)) {
			filteredProjectsTasks.value.forEach(item => {

				map.set(item.projectId, item.tastsNumber || 0);
			});
		}

		return map;
	});

	const projectCommitedTasksMap = computed(() => {

		const map = new Map();
		if (Array.isArray(filteredProjectsTasks.value)) {
			filteredProjectsTasks.value.forEach(item => {

				map.set(item.projectId, item.commitedNum || 0);
			});
		}

		return map;
	});

	// 同步获取任务数量的函数
	const getTasksNumber = (id) => {
		const result = projectTasksMap.value.get(id) || 0;

		return result;
	};

	// 同步获取任务数量的函数
	const getCommitedTasksNumber = (id) => {
		return projectCommitedTasksMap.value.get(id) || 0;
	};

	const isProjectCompleted = (id) => {
		const taskCount = getTasksNumber(id);
		const commitedCount = getCommitedTasksNumber(id);
		return taskCount > 0 && commitedCount === taskCount;
	};

	const getProjectProgressText = (id) => {
		return isProjectCompleted(id) ? '已完成' : '未完成';
	};

	// 监听 filteredProjectsTasks 的变化
	watch(filteredProjectsTasks, (newVal) => {

		newVal.forEach(item => {

		});
	}, {
		deep: true
	});

	//获取year的函数
	// const getYear = (objects[]) => {
	// 	for (int i = 0; i < objects.length; i++) {

	// 	}
	// }

	// 修改changeYear函数
	const changeYear = (e) => {
		selectedYearIndex.value = e.detail.value;
		currentYear.value = years.value[selectedYearIndex.value];

	};

	const back = () => {
		uni.navigateBack();
	};

	// Bug4  跳转后如何获取任务id
	const goToList = (item) => {
		// 先设置项目ID到store
		idInfo.setProjectId({
			value: item.id
		})
    idInfo.setProjectYear({
      value: item.year
    })
		// 然后导航到List页面
		uni.navigateTo({
			url: `/pages/List/List?projectId=${item.id}`
		});
	};

	const getProjectsTasks = async (projects) => {
		// 清空之前的数据，避免重复
		filteredProjectsTasks.value = [];

		for (const item of projects) {
			try {
				//读取本地task

				const taskGetWithProjectId = await getTask(userInfo.username, item.id)

				// 确保data和tasks存在
				const tasksCount = taskGetWithProjectId?.tasks?.length || 0;
				const commitedNum = await getBuildingCommitedNumber(userInfo.username, item.id)

				filteredProjectsTasks.value.push({
					projectId: item.id,
					tastsNumber: tasksCount,
					commitedNum: commitedNum
				});

			} catch (error) {
				console.error(`获取项目 ${item.id} 的任务失败:`, error);
				// 添加错误处理，确保即使一个项目失败也不会影响其他项目
				filteredProjectsTasks.value.push({
					projectId: item.id,
					tastsNumber: 0,
					commitedNum: 0
				});
			}
		}
	}

	const getProjectsTasksByHadUsername = async (projects, hadUsername) => {
		// 清空之前的数据，避免重复
		filteredProjectsTasks.value = [];

		for (const item of projects) {
			try {
				//读取本地task

				const taskGetWithProjectId = await getTaskByHadUsername(hadUsername, item.id)
				const commitedNum = await getBuildingCommitedNumber(hadUsername, item.id)

				// 确保data和tasks存在
				const tasksCount = taskGetWithProjectId?.data?.tasks?.length || 0;
				filteredProjectsTasks.value.push({
					projectId: item.id,
					tastsNumber: tasksCount,
					commitedNum: commitedNum
				});

			} catch (error) {

				// 添加错误处理，确保即使一个项目失败也不会影响其他项目
				filteredProjectsTasks.value.push({
					projectId: item.id,
					tastsNumber: 0,
					commitedNum: 0
				});
			}
		}
	}



	// 获取状态文本
	const getStatusText = (status) => {
		switch (status) {
			case '0':
				return '未完成';
			case '1':
				return '已完成';
			default:
				return '未知状态';
		}
	};

	// 添加一个计算属性来获取当前项目
	const currentProject = computed(() => {
		if (!initData.value || !initData.value.data || !initData.value.data.projects) {
			return null;
		}

		// 查找匹配当前projectId的项目
		const project = initData.value.data.projects.find(p => p.id == projectId.value);

		// 如果找不到匹配的项目，则返回第一个项目（作为后备）
		return project || initData.value.data.projects[0];
	});

	// 添加计算属性
	const formattedPackageSize = computed(() => {
		try {
			if (!packageSize.value || isNaN(packageSize.value)) return '';
			const sizeInMB = packageSize.value / (1024 * 1024);
			if (isNaN(sizeInMB)) return '';
			return `(${sizeInMB.toFixed(2)}MB)`;
		} catch (error) {
			console.error('计算格式化包大小时出错:', error);
			return '';
		}
	});

	const downloadedSize = computed(() => {
		try {
			// 如果没有包大小或包大小无效，只显示百分比
			if (!packageSize.value || isNaN(packageSize.value)) {

				return `${Math.floor(downloadProgress.value || 0)}%`;
			}

			// 确保downloadProgress有效
			const progress = downloadProgress.value || 0;

			// 计算已下载的MB数和总MB数
			const total = packageSize.value / (1024 * 1024);
			const downloaded = (progress * packageSize.value / 100) / (1024 * 1024);

			// 检查计算结果是否有效
			if (isNaN(downloaded) || isNaN(total)) {

				return `${Math.floor(progress)}%`;
			}

			// 返回格式化的字符串
			return `${downloaded.toFixed(2)}MB / ${total.toFixed(2)}MB`;
		} catch (error) {
			console.error('计算下载大小时出错:', error);
			return `${Math.floor(downloadProgress.value || 0)}%`;
		}
	});



	onMounted(async () => {
		// 重置版本检查标志，允许重新检查
		hasCheckedVersion.value = false;

		// 初始化进度条状态
		currentProgressId.value = null;
		showDownloadProgress.value = false;
		showUnzipProgress.value = false;
		isDownloading.value = false;
		// 设置屏幕常亮
		uni.setKeepScreenOn({
			keepScreenOn: true,
			success: function() {},
			fail: function(err) {}
		});

		await init();

		// 设置进度监听
		watch(downloadProgress, (newValue) => {
			uni.$emit('download-progress', {
				progress: newValue
			});
		});

		watch(unzipProgress, (newValue) => {
			uni.$emit('unzip-progress', {
				progress: newValue
			});
		});

		uni.$on('getCommitedNum', getCommitedNum);

		// 取消屏幕常亮
		uni.setKeepScreenOn({
			keepScreenOn: false
		});
	});
	const getCommitedNum = async (projectId) => {
		const commitedNum = await getBuildingCommitedNumber(userInfo.username, projectId);
		for (let i = 0; i < filteredProjectsTasks.value.length; i++) {
			if (filteredProjectsTasks.value[i].projectId === projectId) {
				filteredProjectsTasks.value[i].commitedNum = commitedNum;
			}
		}
	};

	const handleRadioChange = (e) => {
		const value = e.detail.value;
		if (value === 'remember') {
			rememberPassword.value = true;
			offlineLogin.value = false;
		} else if (value === 'offline') {
			offlineLogin.value = true;
			rememberPassword.value = false;
		}
	};

	onUnmounted(async () => {
		/*// 取消屏幕常亮
		uni.setKeepScreenOn({
		  keepScreenOn: false
		});*/

		// 清理下载相关状态
		cleanupDownloadListeners();

		// 如果当前页面的进度条是活跃状态，则清理全局活跃状态
		if (currentProgressId.value) {
			clearActiveProgressId(currentProgressId.value);
		}

		// 重置当前页面的状态
		showDownloadProgress.value = false;
		showUnzipProgress.value = false;
		isDownloading.value = false;
		currentProgressId.value = null;
	})

	// 测试数据包API接口
	// 测试数据包API接口函数已删除，直接使用testDataPackageAPI
</script>

<style scoped lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FFFFFF;
		padding: 0;
		margin: 0;
	}

	.uni-nav-bar {
		height: 88px;
		font-size: 34px;
		font-weight: bold;
		margin-bottom: 0;
		background-color: #0F4687 !important;
	}

	::v-deep .uni-nav-bar__content {
		font-size: 34px;
		font-weight: bold;
		background-color: #0F4687 !important;
	}

	::v-deep .uni-nav-bar__header-container-inner {
		font-size: 34px;
		font-weight: bold;
	}

	.info-card {
		background-color: #bdcbe0;
		padding: 22px 12px 10px 12px;
		margin: 0;
		margin-top: -14px;
		display: flex;
		align-items: center;

		.info-boxes {
			display: flex;
			justify-content: space-around;
			gap: 8rpx;
			// padding: 0 10px 0 10px;
			width: 100%;

			.info-box {
				border: 1px solid #0f4687;
				border-radius: 4px;
				padding: 8px 10px;
				display: flex;
				flex-direction: column;
				background-color: #bdcbe0;
				min-height: 62px;
				justify-content: center;

				&:first-child {
					width: 55%;
					margin-left: 0px;

					.value {
						font-size: 20rpx;
					}
				}

				&:nth-child(2) {
					// width: 19%;
					flex: 1;

					.value {
						font-size: 20rpx;
					}
				}

				&:last-child {
					// width: 19%;
					flex: 1;
					margin-right: 0px;

					.value {
						font-size: 20rpx;
					}
				}

				.label {
					font-size: 15rpx;
					color: #666;
					line-height: 1.2;
					margin-bottom: 3px;
				}

				.value {
					color: #333;
					font-weight: 500;
					line-height: 1.2;
					font-size: 20rpx;
				}

			}
		}
	}

	.year-picker {
		width: 100%;

		.picker-content {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			flex-wrap: nowrap;
			gap: 8rpx;

			.value {
				font-size: 20rpx;
				color: #333333;
				font-weight: 500;
				line-height: 1.2;
				flex-shrink: 0;
			}

			/* 与列表同图同尺寸；不加列表项上的灰化滤镜，保留 SVG 内建 #333 与年度文字一致 */
			.year-value-chevron {
				width: 20rpx;
				height: 20rpx;
				display: block;
				flex-shrink: 0;
			}
		}
	}

	.bridge-list {
		.bridge-item {
			display: flex;
			align-items: center;
			padding: 15px;
			background-color: #fff;
			margin-bottom: 0px;
			border-bottom: 1px solid #d0d0d0;
			border-radius: 0px;

			.bridge-info {
				flex: 1;

				.bridge-code {
					font-size: 15rpx;
					color: #666;
					margin-bottom: 4px;
				}

				.bridge-name {
					font-size: 20rpx;
					color: #333;
					margin-bottom: 4px;
				}

				.bridge-location {
					font-size: 15rpx;
					color: #999;
				}
			}

			.bridge-meta {
				text-align: right;
				margin-left: 10px;
				display: flex;
				align-items: center;
				gap: 10px;

				.text-group {
					text-align: right;

					.bridge-status {
						font-size: 18rpx;
						color: #333;
						display: block;

						&.completed {
							color: #00B578;
						}
					}

					.bridge-progress {
						font-size: 15rpx;
						display: block;
						margin: 0;

						&.completed {
							color: #00B578;
						}

						&.uncompleted {
							color: #666666;
						}
					}

					.bridge-progress-count {
						font-size: 20rpx;
						color: #999999;
						display: block;
						margin-top: 4rpx;
					}
				}

				image {
					width: 20rpx;
					height: 20rpx;
					display: block;
					filter: brightness(0) saturate(100%) invert(80%);
				}
			}
		}
	}

	.loading,
	.no-data {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		color: #666;
		font-size: 16px;
	}

	.appTitle {
		font-size: 20rpx;
		color: #333;
		font-weight: 500;
		line-height: 1.2;
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
		color: #0F4687;
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
		background-color: #0F4687;
		border-radius: 5px;
		transition: width 0.3s ease;
	}

	.progress-info {
		margin-top: 10px;
		font-size: 14px;
		color: #666;
		text-align: center;
	}

	/* 手机端适配 */
	@media (max-width: 599px) {
		.info-card {
			.info-boxes {
				.info-box {
					.label {
						font-size: 22rpx;
					}

					.value {}

					&:first-child {
						width: 50%;
						margin-left: 0px;

						.value {
							font-size: 26rpx;
						}
					}

					&:nth-child(2) {
						// width: 19%;
						flex: 1;

						.value {
							font-size: 26rpx;
						}
					}

					&:last-child {
						// width: 19%;
						flex: 1;
						margin-right: 0px;

						.value {
							font-size: 26rpx;
						}
					}
				}
			}
		}

		.year-picker .picker-content .year-value-chevron {
			width: 24rpx;
			height: 24rpx;
		}

		.bridge-list {
			.bridge-item {
				.bridge-info {
					.bridge-code {
						font-size: 20rpx;
					}

					.bridge-name {
						font-size: 24rpx;
					}

					.bridge-location {
						font-size: 20rpx;
					}
				}

				.bridge-meta {
					.text-group {
						.bridge-status {
							font-size: 24rpx;
						}

						.bridge-progress {
							font-size: 20rpx;
							margin: 4px 0;
						}
					}

					image {
						width: 24rpx;
						height: 24rpx;
					}
				}
			}
		}
	}
</style>
<!-- 
 任务列表
 author:ykx
 date：2025.6.3
 Bug 6
 -->
 <template>
	<view class="container">
		<!-- 顶部信息卡片 -->
		<view class="info-card">
			<view class="content-box">
				<view class="title">{{currentProject.name || '项目名称'}}</view>
				<view class="info-row">
					<text>项目编号: {{currentProject.code || ''}}</text>
					<text>检测状态:
						{{currentProject.status === '0' ? '未完成' : currentProject.status === '1' ? '已完成' : ''}}</text>
				</view>
				<view class="info-row">
					<text>项目单位: {{currentProject.ownerDept?.deptName || ''}}</text>
					<text>检测数量: {{initTaskData?.tasks?.length || 0}}</text>
				</view>
				<view class="info-row">
					<text>检测年度: {{currentProject.year || ''}}年度</text>
					<text>起止时间:
						{{ formatDate(currentProject.startDate) || '' }}至{{ formatDate(currentProject.endDate) || '' }}</text>
				</view>
				<view class="info-row">
					<text>检测单位: {{currentProject.dept?.deptName || ''}}</text>
				</view>
				<view class="info-row">
					<text>检测人员:
						{{currentProject.inspectors ? currentProject.inspectors.map(inspector => inspector.userName).join('/') : ''}}</text>
				</view>
			</view>
		</view>

		<!-- 搜索框 -->
		<view class="search-box">
			<text class="search-icon">&#xe654;</text>
			<input type="text" placeholder="搜索桥梁名称/编号/位置" v-model="searchText" @input="handleSearch" />
<!--      <button class="addBridge-button" @click="addBridge">新建桥梁</button>-->
		</view>
		<!-- 桥梁任务列表 -->
		<view class="bridge-list">
			<view class="bridge-item" v-for="bridge in filteredBridges" :key="bridge.id" @click="goToDetail(bridge)">
				<view class="bridge-icon">
					<image :src="getBridgeIcon(bridge?.building?.bridgeType)" mode="aspectFit"></image>
				</view>
				<view class="bridge-info">
					<view class="bridge-code">{{bridge?.building?.buildingCode || '-'}}</view>
					<view class="bridge-name">{{bridge?.building?.name || '未命名桥梁'}}</view>
					<view class="bridge-location"> {{
				        (bridge?.building?.routeCode || '') + '/' + 
				        (bridge?.building?.routeName || '') + '/' + 
				        (bridge?.building?.bridgePileNumber || '') 
				            }}
					</view>
				</view>
				<view class="bridge-meta">
					<view class="text-group">
						<!--						<view class="status" v-if="bridge.commited" style="background-color: #00B578; color: #ffffff;">
							已提交</view>-->
						<view class="status" v-if="bridge.commited === 0"
							style="background-color: #FF6430; color: #ffffff;">未提交</view>
						<view class="status" v-if="bridge.commited === 1"
							style="background-color: #00B578; color: #ffffff;">已提交</view>
						<text class="bridge-length">{{ formatBridgeLength(bridge?.building?.bridgeLength) }}</text>
						<text class="bridge-class">{{bridge.building?.bridgeRank||'/'}}类</text>
					</view>
					<image src="/static/image/RightOutline.svg" />
				</view>
			</view>
		</view>
		<!-- 无搜索结果提示 -->
		<view class="no-result" v-if="filteredBridges.length === 0">
			<text>未找到匹配的桥梁</text>
		</view>
		<ChatAgentButton />
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted,
		computed,
		onUnmounted
	} from 'vue'
	import {
		getProject,
		getTaskListWithBuildings,
		getULTask,
	} from '@/utils/readJsonNew.js'
	import {
		getObjectUL
	} from '../../utils/readUL'
	import {
		setTask,
	} from '../../utils/writeNew'
	import {
		userStore
	} from '@/store/index.js'
	import {
		idStore
	} from '../../store/idStorage'
	import {
		useObject
	} from '../../store/object'
	import ChatAgentButton from '../../components/ChatAgentButton.vue'
	// 返回上一页
	const back = () => {
		uni.navigateBack()
	}

	// 项目信息
	const projectInfo = ref({})
	// 搜索文本
	const searchText = ref('')
	const projectId = ref(2)
	const initTaskData = ref(null)
	const userInfo = userStore()
	const idInfo = idStore()
	const initTaskULData = ref(null)
	const objectData = useObject();
	// 初始化时获取projectId参数
	const getURLParams = () => {
		try {
			// 首先检查store中是否已有projectId
			const storeProjectId = idInfo.projectId?.value;
			if (storeProjectId) {
				projectId.value = storeProjectId;
				return;
			}

			// 尝试从URL获取
			const pages = getCurrentPages();
			if (pages.length > 0) {
				const currentPage = pages[pages.length - 1];

				// 检查options
				if (currentPage.$page?.options) {
					const options = currentPage.$page.options;

					if (options.projectId) {
						projectId.value = options.projectId;
						return;
					}
				}

				// 尝试从路由中获取
				if (currentPage.$page?.fullPath) {
					const fullPath = currentPage.$page.fullPath;

					// 解析URL参数
					const match = fullPath.match(/projectId=([^&]+)/);
					if (match && match[1]) {
						projectId.value = match[1];
						return;
					}
				}
			}
		} catch (error) {
			console.error('获取URL参数时出错:', error);
		}
	};

	const getTaskList = () => {
		if (Array.isArray(initTaskData.value?.tasks)) {
			return initTaskData.value.tasks;
		}
		if (Array.isArray(initTaskData.value?.data?.tasks)) {
			return initTaskData.value.data.tasks;
		}
		return [];
	};

	//初始化数据
	const init = async () => {
		try {
			// 先确保已经获取了URL参数
			getURLParams();

			// 获取项目数据
			try {
				projectInfo.value = await getProject(userInfo.username);
			} catch (projectError) {
				console.error('获取项目数据失败:', projectError);
				projectInfo.value = {
					data: {
						projects: []
					}
				}; // 设置默认值
			}

			// 获取任务数据
			try {
			initTaskData.value = await getTaskListWithBuildings(userInfo.username, projectId.value);
			try {
				initTaskULData.value = await getULTask(userInfo.username, projectId.value)
				} catch (error) {
					console.error('获取UL任务数据失败,创建ULtask:', error);

					// 如果UL任务数据不存在，则创建一个新的
					if (initTaskData.value && Array.isArray(initTaskData.value.tasks)) {
						// 创建与UD任务结构相同的UL任务数据
						const ulTasks = initTaskData.value.tasks.map(task => ({
							updatetime: task.updatetime || new Date().toISOString(),
							id: task.id,
							buildingId: task.buildingId,
							commited: 2 //0 未提交 1 提交 2 未保存数据
						}));

						// 创建UL任务数据对象
						initTaskULData.value = {
							projectId: projectId.value,
							tasks: ulTasks
						};

						// 保存新创建的UL任务数据
						try {
							await setTask(userInfo.username, projectId.value, initTaskULData.value);
						} catch (saveError) {
							console.error('保存UL任务数据失败:', saveError);
						}
					} else {
						console.warn('无法创建UL任务数据：UD任务数据不可用或格式不正确');
						initTaskULData.value = {
							tasks: []
						};
					}
				}
				// 检查任务数据结构
				if (!initTaskData.value) {
					initTaskData.value = {
						tasks: []
					};
				}
				// 如果没有tasks数组但有data.tasks数组
				else if (!Array.isArray(initTaskData.value.tasks) && initTaskData.value.data && Array.isArray(
						initTaskData.value.data.tasks)) {
					// 转换为直接结构，以兼容模板中的使用
					initTaskData.value = {
						projectId: initTaskData.value.data.projectId || projectId.value,
						tasks: initTaskData.value.data.tasks
					};
				}
				// 如果没有任何任务数组
				else if (!Array.isArray(initTaskData.value.tasks)) {
					initTaskData.value.tasks = [];
				}

				// 合并UL任务中的commited字段到initTaskData
				if (initTaskULData.value && initTaskULData.value.tasks && Array.isArray(initTaskULData.value
						.tasks)) {
					// 遍历UL任务数据
					initTaskULData.value.tasks.forEach(ulTask => {
						// 在initTaskData中查找对应id的任务
						const matchingTask = initTaskData.value.tasks.find(task => task.id === ulTask.id ||
							task.buildingId === ulTask.buildingId);

						// 如果找到匹配的任务，合并commited字段
						if (matchingTask && ulTask.commited !== undefined) {
							matchingTask.commited = ulTask.commited;
						}
					});
				} else if (initTaskULData.value && initTaskULData.value.data && initTaskULData.value.data.tasks &&
					Array.isArray(
						initTaskULData.value.data.tasks)) {
					// 遍历UL任务数据(嵌套结构)
					initTaskULData.value.data.tasks.forEach(ulTask => {
						// 在initTaskData中查找对应id的任务
						const matchingTask = initTaskData.value.tasks.find(task => task.id === ulTask.id ||
							task.buildingId === ulTask.buildingId);

						// 如果找到匹配的任务，合并commited字段
						if (matchingTask && ulTask.commited !== undefined) {
							matchingTask.commited = ulTask.commited;
						}
					});
				}

			} catch (taskError) {
				console.error('获取任务数据失败:', taskError);
				// 初始化默认的任务数据结构
				initTaskData.value = {
					projectId: projectId.value,
					tasks: []
				};
			}
		} catch (error) {
			console.error('初始化数据过程中发生错误:', error);
		}
	};

	const setBuildingUnCommit = async (buildingId) => {
		// 找到对应的任务项并设置 commited 字段为 0 未提交
		if (initTaskData.value && initTaskData.value.tasks) {
			for (let i = 0; i < initTaskData.value.tasks.length; i++) {
				if (initTaskData.value.tasks[i].buildingId === buildingId) {
					initTaskData.value.tasks[i].commited = 0;
					break;
				}
			}
		}
	};
	const setBuildingCommit = async (buildingId) => {
		// 找到对应的任务项并设置 commited 字段为 1 已提交
		if (initTaskData.value && initTaskData.value.tasks) {
			for (let i = 0; i < initTaskData.value.tasks.length; i++) {
				if (initTaskData.value.tasks[i].buildingId === buildingId) {
					initTaskData.value.tasks[i].commited = 1;
					break;
				}
			}
		}
	};
	const setBuildingNull = async (buildingId) => {
		// 找到对应的任务项并设置 commited 字段为 2 为刚初始化的状态
		if (initTaskData.value && initTaskData.value.tasks) {
			for (let i = 0; i < initTaskData.value.tasks.length; i++) {
				if (initTaskData.value.tasks[i].buildingId === buildingId) {
					initTaskData.value.tasks[i].commited = 2;
					break;
				}
			}
		}
	};
	const refreshTaskData = async () => {
		initTaskData.value = await getTaskListWithBuildings(userInfo.username, projectId.value)
	}

	// 页面加载时获取数据
	onMounted(async () => {
		// 首先获取URL参数
		getURLParams();

		// 然后初始化数据
		await init();

		// 注册事件监听
		uni.$on('setBuildingUnCommit', setBuildingUnCommit);
		uni.$on('setBuildingCommit', setBuildingCommit);
		uni.$on('setBuildingNull', setBuildingNull);
		uni.$on('refreshTaskData', refreshTaskData);
	});

	onUnmounted(() => {
		uni.$off('setBuildingUnCommit', setBuildingUnCommit)
		uni.$off('setBuildingCommit', setBuildingCommit)
		uni.$off('setBuildingNull', setBuildingNull)
		uni.$off('refreshTaskData', refreshTaskData)
	})
	// 添加计算属性来获取当前项目
	const currentProject = computed(() => {

		// 检查projectInfo是否有数据
		if (!projectInfo.value) {
			// 从任务数据中提取项目信息作为备选
			if (initTaskData.value?.tasks?.length > 0 && initTaskData.value.tasks[0].project) {
				return initTaskData.value.tasks[0].project;
			}

			return {};
		}

		// 检查projectInfo.data的结构
		if (projectInfo.value.data && projectInfo.value.data.projects) {
			// 新格式：{data: {projects: [...]}}
			const project = projectInfo.value.data.projects.find(p => String(p.id) === String(projectId.value));

			if (project) return project;

			// 如果找不到匹配的项目，但有项目列表，返回第一个
			if (projectInfo.value.data.projects.length > 0) {
				return projectInfo.value.data.projects[0];
			}
		}
		// 检查projectInfo.projects的结构
		else if (projectInfo.value.projects && Array.isArray(projectInfo.value.projects)) {
			// 旧格式：{projects: [...]}
			const project = projectInfo.value.projects.find(p => String(p.id) === String(projectId.value));

			if (project) return project;

			// 如果找不到匹配的项目，但有项目列表，返回第一个
			if (projectInfo.value.projects.length > 0) {
				return projectInfo.value.projects[0];
			}
		}

		// 从任务数据中提取项目信息作为备选
		if (initTaskData.value?.tasks?.length > 0 && initTaskData.value.tasks[0].project) {
			return initTaskData.value.tasks[0].project;
		}

		return {}; // 如果找不到，返回空对象
	});
	// 根据桥梁类型获取对应图标
	//Bug3 ---图标的对应规则未知
	const getBridgeIcon = (type) => {
		const normalizedType = String(type || '').trim();
		const icons = {
			'2': '/static/image/bridge1.png', //拱桥
			'1': '/static/image/bridge2.png', //梁式桥
			'4': '/static/image/bridge3.png', //斜拉桥
			'3': '/static/image/bridge4.png', //悬索桥
		}
		if (icons[normalizedType]) return icons[normalizedType]
		if (normalizedType.includes('拱')) return icons['2']
		if (normalizedType.includes('斜拉')) return icons['4']
		if (normalizedType.includes('悬索')) return icons['3']
		if (normalizedType.includes('梁')) return icons['1']
		return icons['1']
	}

	// 跳转到详情页
	const goToDetail = async (bridge) => {
		// 确保 bridge 和 buildingId 有效
		if (!bridge || !bridge.buildingId) {
			console.error('无效的桥梁数据或buildingId:', bridge);
			uni.showToast({
				title: '无效的桥梁数据',
				icon: 'none',
				duration: 2000
			});
			return;
		}

		// 将buildingId存储到store中
		idInfo.setBuildingId({
			value: bridge.buildingId
		});
		idInfo.setTaskId({
			value: bridge.id
		})
		// const newData = await getObjectUL(userInfo.username, idInfo.buildingId);
		// objectData.setData(newData);
		// console.log("objectData",objectData.getData());
		// 导航到桥梁疾病页面
		const building = bridge.building || {};
		uni.navigateTo({
			// url: `/pages/bridge-disease/bridge-disease?bridgeId=${bridge.buildingId}`
			url: `/pages/bridge-disease/bridge-disease?bridgeId=${bridge.buildingId}&bridgeCode=${building.buildingCode || ''}&bridgeName=${building.name || ''}&bridgePileNumber=${building.bridgePileNumber || ''}&routeName=${building.routeName || ''}&routeCode=${building.routeCode || ''}`
		});
		// // 在跳转前，检查并复制数据从UD到UL目录
		// try {
		// 	console.log('尝试从UL目录读取object.json，参数:', userInfo.username, bridge.buildingId);
		// 	// 尝试从UL目录读取数据
		// 	const structureData = await getObjectUL(userInfo.username, idInfo.buildingId);
		// 	// 如果从UL目录读不到数据（没有数据或只有默认空数据）
		// 	if (!structureData || !structureData.children || structureData.children.length === 0) {
		// 		console.log("UL目录中没有找到有效的object.json数据，尝试从UD目录复制");

		// 		// 从UD目录读取数据
		// 		console.log('尝试从UD目录读取object.json，参数:', userInfo.username, bridge.buildingId);
		// 		const udData = await getObject(userInfo.username, idInfo.buildingId);
		// 		console.log("udData0:", udData);
		// 		if (udData && udData.children && udData.children.length > 0) {
		// 			console.log("从UD目录读取到有效的object.json数据，准备复制到UL目录");

		// 			// 将UD目录的数据保存到UL目录
		// 			console.log('将object.json数据保存到UL目录，参数:', userInfo.username, bridge.buildingId);
		// 			udData.warning = false;
		// 			udData.commit = 2
		// 			await setObject(userInfo.username, idInfo.buildingId, udData);
		// 			console.log("udData:", udData);
		// 			console.log("object.json数据已从UD目录复制到UL目录");

		// 			// 验证数据是否成功保存
		// 			const verifyData = await getObjectUL(userInfo.username, idInfo.buildingId);
		// 			if (verifyData && verifyData.children && verifyData.children.length > 0) {
		// 				console.log("验证成功：object.json数据已正确保存到UL目录");
		// 			} else {
		// 				console.error("验证失败：object.json数据未能正确保存到UL目录");
		// 			}
		// 		} else {
		// 			console.log("UD目录中也没有有效的object.json数据");
		// 		}
		// 	} else {
		// 		console.log("UL目录已有有效的object.json数据，无需复制");
		// 	}
		// } catch (error) {
		// 	console.error("处理object.json数据时出错:", error);
		// }
	}

	// 根据搜索文本过滤桥梁列表
	const filteredBridges = computed(() => {
		// 检查任务数据是否存在
		if (!initTaskData.value) {
			return [];
		}

		// 检查数据结构
		let tasks = [];

		// 适配不同的数据结构
		if (Array.isArray(initTaskData.value.tasks)) {
			// 直接结构: {tasks: [...]}
			tasks = initTaskData.value.tasks;
		} else if (initTaskData.value.data && Array.isArray(initTaskData.value.data.tasks)) {
			// 嵌套结构: {data: {tasks: [...]}}
			tasks = initTaskData.value.data.tasks;
		} else {
			return [];
		}

		const validTasks = tasks.filter(task => {
			const hasBuilding = !!task?.building && !!(task?.building?.name || task?.building?.buildingCode || task?.buildingId);
			return hasBuilding;
		});

		// 如果没有搜索文本，返回所有任务
		if (!searchText.value) {
			return validTasks;
		}

		// 根据搜索文本过滤
		const searchLower = searchText.value.toLowerCase();
		return validTasks.filter(bridge => {
			try {
				// 安全地访问属性，避免undefined错误
				const name = bridge?.building?.name || '';
				const code = bridge?.building?.buildingCode || '';
				const routeName = bridge?.building?.routeName || '';
				const pileNumber = bridge?.building?.bridgePileNumber || '';

				return name.toLowerCase().includes(searchLower) ||
					code.toLowerCase().includes(searchLower) ||
					routeName.toLowerCase().includes(searchLower) ||
					pileNumber.toLowerCase().includes(searchLower);
			} catch (error) {
				console.error('过滤桥梁时出错:', error, bridge);
				return false; // 出错时排除该项
			}
		});
	});

	// 处理搜索输入
	const handleSearch = () => {
		// 由于使用了计算属性filteredBridges，无需在这里手动过滤
	}
	const formatBridgeLength = (length) => {
		if (length === undefined || length === null || length === '') {
			return '/';
		}
		return `${length}m`;
	}
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear().toString().slice(); // yyyy
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1并补零
    const day = String(date.getDate()).padStart(2, '0'); // 日期补零
    return `${year}-${month}-${day}`;
  };

  // 跳转新建桥梁页面
  const addBridge= () => {
    uni.navigateTo({
      url: `/pages/add-bridge/add-bridge?projectName=${currentProject.value.name}`
    });
  }

</script>

<style lang="scss">
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
	}

	::v-deep .uni-nav-bar__content {
		font-size: 34px;
		font-weight: bold;
	}

	::v-deep .uni-nav-bar__header-container-inner {
		font-size: 34px;
		font-weight: bold;
	}

	.info-card {
		background-color: #bdcbe0;
		padding: 12px;
		margin: 0;
		border-radius: 0;
		box-shadow: none;
		margin-top: 0px;

		.content-box {
			background-color: transparent;
			border: 1px solid #0f4687;
			border-radius: 4px;
			padding: 10px;

			.title,
			.info-row {
				color: #333;
			}
		}

		.title {
			font-size: 18px;
			font-weight: bold;
			margin-bottom: 8px;
		}

		.info-row {
			display: flex;
			justify-content: space-between;
			margin-top: 6px;
			font-size: 14px;

			text {
				line-height: 1.4;
			}
		}
	}

	@font-face {
		font-family: 'uniicons';
		src: url('/static/fonts/uniicons.ttf') format('truetype');
	}

	.uniicons {
		font-family: 'uniicons';
	}

	.search-box {
		margin: 0;
		padding: 10px;
		background-color: #bdcbe0;
		border-radius: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		position: relative;

		.search-icon {
			position: absolute;
			left: 20px;
			top: 50%;
			transform: translateY(-50%);
			font-family: 'uniicons';
			color: #999;
			font-size: 16px;
			z-index: 1;
			height: 16px;
			line-height: 1;
		}

		input {
			width: 100%;
			height: 36px;
			padding: 0 10px 0 35px;
			border: 1px solid rgba(0, 0, 0, 0.1);
			border-radius: 4px;
			font-size: 14px;
			background-color: #fff;
		}
	}

	.bridge-list {
		.bridge-item {
			display: flex;
			align-items: center;
			padding: 15px;
			background-color: #fff;
			margin-bottom: 1px;

			.bridge-icon {
				width: 50px;
				height: 50px;
				margin-right: 15px;

				image {
					width: 100%;
					height: 100%;
				}
			}

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

				.text-group {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
					margin-right: 8px;
					position: relative;
				}

				.bridge-length {
					font-size: 18rpx;
					color: #333;
					display: block;
					margin-bottom: 4px;
				}

				.status {
					font-size: 14rpx;
					padding: 2rpx 6rpx;
					background-color: #f5f5f5;
					border-radius: 4rpx;
					margin-bottom: 4px;
				}

				.bridge-class {
					font-size: 14px;
					color: #666;
					display: block;
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

	.no-result {
		padding: 20px;
		text-align: center;
		color: #999;
		font-size: 14px;
	}

	.search-box {
		margin: 0;
		padding: 10px;
		background-color: #bdcbe0;
		border-radius: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;

		input {
			background-color: #fff;
			border-radius: 4px;
			padding: 8px 10px 8px 35px;
			font-size: 14px;
			flex: 1;
			height: 36px;
			box-sizing: border-box;
			border: 1px solid #0f4687;

			&::placeholder {
				color: #999;
			}
		}

		.search-icon {
			position: absolute;
			left: 20px;
			top: 50%;
			transform: translateY(-50%);
			font-family: 'uniicons';
			color: #999;
			font-size: 16px;
			z-index: 1;
			height: 16px;
			line-height: 1;
		}
	}
  .addBridge-button{
    font-size: 14px;
    background-color: #0F4687;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 15px;
    height: 36px;
    border-radius: 4px;
    border: none;
    white-space: nowrap;
    flex-shrink: 0;
  }

	/* 手机端适配 */
	@media (max-width: 599px) {
		.info-card {
			.title {
				font-size: 16px;
				margin-bottom: 8px;
			}

			.info-row {
				font-size: 12px;

				text {
					line-height: 1.4;
				}
			}
		}

		.bridge-list {
			.bridge-item {
				padding: 15px;

				.bridge-info {
					.bridge-code {
						font-size: 18rpx;
						margin-bottom: 4px;
					}

					.bridge-name {
						font-size: 24rpx;
						margin-bottom: 4px;
					}

					.bridge-location {
						font-size: 18rpx;
					}
				}

				.bridge-meta {
					.text-group {
						margin-right: 8px;
					}

					.bridge-length {
						font-size: 22rpx;
						margin-bottom: 4px;
					}
				}
			}
		}
	}
</style>
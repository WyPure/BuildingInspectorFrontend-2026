<!--当前病害页面-->
<template>
	<view class="disease-container">
		<view class="content-layout">
			<!-- 左侧边栏 -->
			<view class="sidebar">
				<view v-for="(item, index) in tabItems" :key="index"
					:class="['sidebar-item', activeTab === index ? 'active' : '']" @click="changeTab(index)">
					<view class="sidebar-item-content">
						<text class="sidebar-item-text">{{item}}</text>
						<text class="sidebar-item-count">({{getTpyeItemCount(item)}})</text>
					</view>
				</view>
			</view>

			<!-- 右侧内容区 -->
			<view class="content">
				<disease-item v-for="(item, index) in filteredDiseases" :key="index" :item="item" :editMode="'edit'"
					:selectMode="isSelectMode" :selected="selectedItems.includes(item.id)" @select="handleItemSelect" />
				<view v-if="filteredDiseases.length === 0" class="placeholder">
					暂无数据
				</view>
			</view>
		</view>


	</view>
</template>

<script setup>
	import {
		ref,
		computed,
		onMounted,
		watch,
		onUnmounted
	} from 'vue';
	import {
		getULDisease,
	} from '../utils/readJsonNew.js';
	import {
		appendBridgeQueryToUrl
	} from '@/utils/bridgeNavQuery.js';
	import {
		setDisease,
	} from '../utils/writeNew.js';
	import {
		userStore
	} from "@/store";
	import {
		idStore
	} from "@/store/idStorage";
	import {
		refreshDiseaseNumber
	} from "@/utils/diseaseNumber";
	import {
		isBuildingCommited,
		setBuildingCommitted,
		setBuildingUnCommitted
	} from "@/utils/isBuildingCommited";
	import { isDiseaseInBridgeSpan } from '@/utils/bridgeSpanDiseaseFilter.js';

	const props = defineProps({
		activeTabTop: {
			type: Number,
			default: 0
		},
		/** 由父页（检测状况工具条）提供搜索与新增时，隐藏本组件内搜索条与「新增病害」 */
		externalToolbar: {
			type: Boolean,
			default: false
		},
		/** 父页控制「新增病害」不可点（如未配置桥跨） */
		disableAddDisease: {
			type: Boolean,
			default: false
		},
		/** 父页选中的桥跨号（为空表示不过滤） */
		selectedBridgeSpan: {
			type: [Number, String],
			default: null
		}
	})

	// 数据
	const tabItems = ref(['桥面系', '上部结构', '下部结构', '附属设施']);
	const activeTab = ref(0);
	const searchText = ref('');
	const diseaseList = ref([]);
	const userInfo = userStore();
	// 控制提交按钮是否可点击
	const submitButtonEnabled = ref(false);

	const idStorageInfo = idStore();

	/** 病害 JSON 写入后，按病害文件重算叶子构件 diseaseNumber 并回写 object（不依赖 Pinia 里是否已命中节点） */
	async function syncDiseaseCountsToObjectTreeAfterWrite() {
		try {
			await refreshDiseaseNumber(userInfo.username, idStorageInfo.buildingId, idStorageInfo.projectYear);
		} catch (e) {
			console.warn("[current-disease] refreshDiseaseNumber 失败:", e);
		}
	}

	// const structureStoreInfo = structureStore();

	/*watch(() => props.activeTabTop, async (newval, oldval) => {
		if (newval == 0) {
			console.log('当前activeTabTop为：', newval) // 使用newval而不是activeTabTop
			await readCurrentYearDiseaseDataByJson()
			// await checkUncommitted()
		}
	})*/
	// 顶部选择未完成、未提交
	const tags = ref(['全部', '已提交', '未提交', '未完成']);
	const tagIndex = ref(0);
	const tagChange = (e) => {
		// e.detail.value 可能为字符串，统一转为数字索引
		tagIndex.value = Number(e.detail.value);
		// commitType 0为已提交 1为未提交 2为删除 3为未保存
		// 切换筛选时，如处于选择模式可根据需要清空已选
		if (isSelectMode.value) {
			toggleSelectMode();
		}
	};

	const selectedItems = ref([]); // 存储选中项的ID
	const showDeleteButton = ref(false); // 是否显示删除按钮
	const isSelectMode = ref(false); // 是否处于选择模式
	// 切换选择模式
	const toggleSelectMode = () => {
		isSelectMode.value = !isSelectMode.value;
		showDeleteButton.value = isSelectMode.value;
		console.log('isSelectMode:', isSelectMode.value);

		// 退出选择模式时清空选中项
		if (!isSelectMode.value) {
			selectedItems.value = [];
		}
	};
	// 处理项目选择
	const handleItemSelect = (event) => {
		const {
			item,
			selected
		} = event;

		if (selected) {
			// 添加到选中数组
			if (!selectedItems.value.includes(item.id)) {
				selectedItems.value.push(item.id);
			}
		} else {
			// 从选中数组中移除
			const index = selectedItems.value.indexOf(item.id);
			if (index !== -1) {
				selectedItems.value.splice(index, 1);
			}
		}

		console.log('当前选中项:', selectedItems.value);
	};

	//全选所有病害
	// 全选所有病害
	const selectAllDisease = () => {
		// 获取当前筛选后的病害列表
		const allDiseases = filteredDiseases.value;
		// 清空当前选中项
		selectedItems.value = [];
		// 将所有病害ID添加到选中列表
		selectedItems.value = allDiseases.map(item => item.id);

		console.log('已全选病害:', selectedItems.value);
	};

	// 删除选中病害
	const deleteSelectDisease = () => {
		if (selectedItems.value.length === 0) {
			uni.showToast({
				title: '请先选择要删除的病害',
				icon: 'none'
			});
			return;
		}
		uni.showModal({
			title: '提示',
			content: '确定要删除所选病害吗？',
			success: async (res) => {
				if (res.confirm) {
					// 删除病害
					await deleteDiseaseByIds(selectedItems.value);
				}
			}
		})
	};

	const deleteDiseaseByIds = async (ids) => {
		try {
			uni.showLoading({
				title: '正在删除',
				mask: true
			});
			for (const id of ids) {
				// 获取病害数据
				const diseaseData = diseaseList.value.find(item => item.id === id);
				if (!diseaseData) {
					console.log(`未找到ID为${id}的病害数据`);
					continue;
				}

				// 删除病害数据
				const index = diseaseList.value.indexOf(diseaseData);
				console.log('index:', index)
				// 检查是否有历史病害引用，如果有则发送事件通知 history-disease 组件
				const diseaseToDelete = diseaseList.value[index];
				if (diseaseToDelete.historyDiseaseId && diseaseToDelete.localId) {
					console.log('发送删除历史病害引用事件:', {
						historyDiseaseId: diseaseToDelete.historyDiseaseId,
						localId: diseaseToDelete.localId || diseaseToDelete.id
					});

					// 发送事件给 history-disease 组件
					uni.$emit('deleteHistoryDiseaseReference', {
						historyDiseaseId: diseaseToDelete.historyDiseaseId,
						localId: diseaseToDelete.localId || diseaseToDelete.id
					});
				}

				// 将commit_type置为2表示已删除，而不是直接从数组中移除
				diseaseList.value[index].commitType = 2;
				console.log(`病害ID:${id}已标记为删除(commitType=2)`);
			}
			// 准备要保存的数据
			// const currentYear = new Date().getFullYear().toString();
      const currentYear = idStorageInfo.projectYear;

			// 构建要保存的数据对象
			const saveData = {
				year: parseInt(currentYear),
				buildingId: parseInt(idStorageInfo.buildingId),
				diseases: diseaseList.value
			};

			console.log('准备保存更新后的数据:', saveData);

			// 调用setDisease方法保存数据
			await setDisease(userInfo.username, idStorageInfo.buildingId, currentYear, saveData);
			await syncDiseaseCountsToObjectTreeAfterWrite();

			console.log('删除标记保存成功');
			const hasUncommittedDiseases = readDiseaseCommit();
			if (hasUncommittedDiseases) {
				await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
				uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId)
			} else {
				await setBuildingCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
				uni.$emit('setBuildingCommit', idStorageInfo.buildingId)
			}
			uni.$emit('diseaseStatusChanged');

			// 显示成功提示
			toggleSelectMode();
			uni.hideLoading();
			uni.showToast({
				title: `已删除${ids.length}条病害`,
				icon: 'success'
			});
		} catch (e) {
			console.error('保存删除失败:', e);
			uni.hideLoading();
			uni.showToast({
				title: '删除失败',
				icon: 'none'
			});
		}
	};

	//
	const readCurrentYearDiseaseDataByJson = async () => {
		try {
			const currentYear = idStorageInfo.projectYear;

			// 调用getDisease获取当前年份数据
			const yearData = await getULDisease(userInfo.username, idStorageInfo.buildingId, currentYear);
			console.log(`获取到${currentYear}年病害数据:`, yearData);

			// 直接使用diseases数组
			if (yearData && yearData.diseases && yearData.diseases.length > 0) {
				diseaseList.value = yearData.diseases;
			} else {
				diseaseList.value = [];
			}

			console.log('病害数据加载完成:', diseaseList.value);
		} catch (error) {
			console.error('读取当前病害数据失败,创建当前病害json:', error);
			const currentYear = idStorageInfo.projectYear;
			await setDisease(userInfo.username, idStorageInfo.buildingId, currentYear, {
				year: parseInt(currentYear),
				buildingId: parseInt(idStorageInfo.buildingId),
				diseases: []
			});
			await syncDiseaseCountsToObjectTreeAfterWrite();
		}
	};

	// 加载当前年份病害数据
	const loadCurrentYearDiseaseData = async () => {
		await readCurrentYearDiseaseDataByJson();
	};

	const copyDiseases = async (allCopiedDiseases) => {
		try {
			console.log('接收到复制病害数据:', allCopiedDiseases);
			for (const disease of allCopiedDiseases) {
				diseaseList.value.push(disease);
			}
			// 准备要保存的数据
			const currentYear = idStorageInfo.projectYear;

			// 构建要保存的数据对象
			const saveData = {
				year: parseInt(currentYear),
				buildingId: parseInt(idStorageInfo.buildingId),
				diseases: diseaseList.value
			};
			await setDisease(userInfo.username, idStorageInfo.buildingId, currentYear, saveData);
			await syncDiseaseCountsToObjectTreeAfterWrite();

			const hasUncommittedDiseases = readDiseaseCommit();
			if (hasUncommittedDiseases) {
				await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
				uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId)
			}

			// 修改顶部导航栏状态
			uni.$emit('diseaseStatusChanged');
		} catch (e) {
			console.error('复制病害数据失败:', e);
			uni.showToast({
				title: '复制失败',
				icon: 'none'
			});
		}
	}

	// 添加新增病害数据的方法
	const addNewDiseaseData = async (newDisease) => {
		try {
			console.log('接收到新增病害数据:', newDisease);
			// 将新病害数据添加到列表中
			diseaseList.value.push(newDisease);

			// 准备要保存的数据
			const currentYear = idStorageInfo.projectYear;

			// 构建要保存的数据对象
			const saveData = {
				year: parseInt(currentYear),
				buildingId: parseInt(idStorageInfo.buildingId),
				diseases: diseaseList.value
			};

			console.log('准备保存的数据:', saveData);

			// 调用setDisease方法保存数据
			await setDisease(userInfo.username, idStorageInfo.buildingId, currentYear, saveData);
			await syncDiseaseCountsToObjectTreeAfterWrite();

			console.log('新增病害数据保存成功');
			/*uni.showToast({
				title: '保存成功',
				icon: 'success'
			});*/
			// await checkUncommittedDiseases();
			// const hasUncommittedDiseases = await readDiseaseCommit(userInfo.username, idStorageInfo.buildingId, currentYear);
			const hasUncommittedDiseases = readDiseaseCommit();
			if (hasUncommittedDiseases) {
				await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
				uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId)
			}
			/*else{
			  await setBuildingCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
			  uni.$emit('setBuildingCommit', idStorageInfo.buildingId)
			}*/
			// await checkUncommitted();
			uni.$emit('diseaseStatusChanged');
		} catch (error) {
			console.error('保存新增病害数据失败:', error);
			uni.showToast({
				title: '保存失败',
				icon: 'none'
			});
		}
	};

	// 处理删除病害事件的方法
	const handleDeleteDisease = async (deleteData) => {
		try {
			console.log('接收到删除病害事件:', deleteData);

			if (!deleteData || !deleteData.id) {
				console.error('删除数据无效');
				return;
			}

			// 在列表中查找病害数据
			const index = diseaseList.value.findIndex(item => item.id == deleteData.id);
			if (index === -1) {
				console.error('未找到要删除的病害数据:', deleteData.id);
				return;
			}

			// 检查是否有历史病害引用，如果有则发送事件通知 history-disease 组件
			const diseaseToDelete = diseaseList.value[index];
			if (diseaseToDelete.historyDiseaseId && diseaseToDelete.localId) {
				console.log('发送删除历史病害引用事件:', {
					historyDiseaseId: diseaseToDelete.historyDiseaseId,
					localId: diseaseToDelete.localId || diseaseToDelete.id
				});

				// 发送事件给 history-disease 组件
				uni.$emit('deleteHistoryDiseaseReference', {
					historyDiseaseId: diseaseToDelete.historyDiseaseId,
					localId: diseaseToDelete.localId || diseaseToDelete.id
				});
			}

			// 将commit_type置为2表示已删除，而不是直接从数组中移除
			diseaseList.value[index].commitType = 2;
			console.log(`病害ID:${deleteData.id}已标记为删除(commitType=2)`);

			// 准备要保存的数据
			const currentYear = idStorageInfo.projectYear;

			// 构建要保存的数据对象
			const saveData = {
				year: parseInt(currentYear),
				buildingId: parseInt(idStorageInfo.buildingId),
				diseases: diseaseList.value
			};

			console.log('准备保存更新后的数据:', saveData);

			// 调用setDisease方法保存数据
			await setDisease(userInfo.username, idStorageInfo.buildingId, currentYear, saveData);
			await syncDiseaseCountsToObjectTreeAfterWrite();

			console.log('删除标记保存成功');
			// const hasUncommittedDiseases = await readDiseaseCommit(userInfo.username, idStorageInfo.buildingId, currentYear);
			const hasUncommittedDiseases = readDiseaseCommit();
			if (hasUncommittedDiseases) {
				await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
				uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId)
			} else {
				await setBuildingCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
				uni.$emit('setBuildingCommit', idStorageInfo.buildingId)
			}
			// await checkUncommitted();
			uni.$emit('diseaseStatusChanged');
		} catch (error) {
			console.error('保存删除失败:', error);
			uni.showToast({
				title: '删除失败',
				icon: 'none'
			});
		}
	};

	// 处理更新病害事件的方法
	const handleUpdateDisease = async (updatedDisease) => {
		try {
			console.log('接收到更新病害事件:', updatedDisease);

			if (!updatedDisease || !updatedDisease.id) {
				console.error('更新数据无效');
				return;
			}

			// 在列表中查找病害数据
			const index = diseaseList.value.findIndex(item => item.id == updatedDisease.id);
			if (index === -1) {
				console.error('未找到要更新的病害数据:', updatedDisease.id);
				return;
			}

			// 更新病害数据
			diseaseList.value[index] = updatedDisease;
			console.log(`病害ID:${updatedDisease.id}已更新`);

			// 准备要保存的数据
			const currentYear = idStorageInfo.projectYear;

			// 构建要保存的数据对象
			const saveData = {
				year: parseInt(currentYear),
				buildingId: parseInt(idStorageInfo.buildingId),
				diseases: diseaseList.value
			};

			console.log('准备保存更新后的数据:', saveData);

			// 调用setDisease方法保存数据
			await setDisease(userInfo.username, idStorageInfo.buildingId, currentYear, saveData);
			await syncDiseaseCountsToObjectTreeAfterWrite();

			console.log('更新数据保存成功');
			// await checkUncommittedDiseases();
			// const hasUncommittedDiseases = await readDiseaseCommit(userInfo.username, idStorageInfo.buildingId, currentYear);
			const hasUncommittedDiseases = readDiseaseCommit();
			if (hasUncommittedDiseases) {
				await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
				uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId)
			}
			/*else{
			  await setBuildingCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
			  uni.$emit('setBuildingCommit', idStorageInfo.buildingId)
			}*/
			// await checkUncommitted();
			uni.$emit('diseaseStatusChanged');
		} catch (error) {
			console.error('保存更新数据失败:', error);
			uni.showToast({
				title: '更新失败',
				icon: 'none'
			});
		}
	};

	const isItemInSelectedSpan = (item) => isDiseaseInBridgeSpan(item, props.selectedBridgeSpan);

	// 计算属性
	const filteredDiseases = computed(() => {
		// 根据activeTab和searchText过滤disease列表
		const selectedType = tabItems.value[activeTab.value];

		const filtered = diseaseList.value.filter(item => {
			// 过滤掉已删除的数据（commit_type=2）
			if (item.commitType === 2) {
				return false;
			}
			// 根据顶部标签按 commitType 过滤：0已提交，1未提交，3未保存
			const tIdx = Number(tagIndex.value);
			if (tIdx === 1 && item.commitType !== 0) return false; // 已提交
			if (tIdx === 2 && item.commitType !== 1) return false; // 未提交
			if (tIdx === 3 && item.commitType !== 3) return false; // 未完成
			// 按类型过滤 - 使用component.grandObjectName
			if (item.component?.grandObjectName !== selectedType) {
				return false;
			}
			// 按父页桥跨筛选
			if (!isItemInSelectedSpan(item)) {
				return false;
			}
			// 如果有搜索关键词，再按关键词过滤
			if (searchText.value) {
				// 将搜索文本按空格分词
				const keywords = searchText.value.trim().split(/\s+/);
				return keywords.some(keyword =>
					(item.description?.includes(keyword) ||
						item.type?.includes(keyword) ||
						item.biObjectName?.includes(keyword) ||
						item.position?.includes(keyword))
				);
			}

			return true;
		});

		// 按 component.code 升序排序
		return filtered.sort((a, b) => {
			const codeA = a.component?.code || '';
			const codeB = b.component?.code || '';
			return codeA.localeCompare(codeB);
		});
	});

	// 方法
	const search = (e) => {
		// 搜索逻辑
		searchText.value = e.value;
		console.log('搜索内容:', e);
	};

	// 处理搜索输入，实时筛选
	const handleSearchInput = (e) => {
		searchText.value = e;
		console.log('实时搜索内容:', e);
	};

	/** 父页共用搜索框写入关键词 */
	const setToolbarSearch = (v) => {
		searchText.value = typeof v === 'string' ? v : String(v ?? '');
	};
	const setSelectedBridgeSpan = () => {
		// 保留接口给父页显式同步，实际过滤由 computed + props 驱动
	};

	const changeTab = (index) => {
		activeTab.value = index;
		if (isSelectMode.value) {
			toggleSelectMode();
		}
	};

	const getTpyeItemCount = (type) => {
		// 根据type获取该类型病害数量（与右侧列表一致：排除已删除 + 按桥跨过滤）
		return diseaseList.value.filter(item =>
			item.component?.grandObjectName === type &&
			item.commitType !== 2 &&
			isItemInSelectedSpan(item)
		).length;
	};

	const addNewDisease = () => {
		const selectedGrandObject = tabItems.value[activeTab.value];
		// 打开新增病害页面，不再传递类型参数
		const base = `/pages/add-disease/add-disease?selectedGrandObject=${encodeURIComponent(selectedGrandObject)}`;
		uni.navigateTo({
			url: appendBridgeQueryToUrl(base)
		});
	};

	// 监听diseaseList的变化
	watch(diseaseList, async () => {
		console.log('diseaseList发生变化，检查未提交病害');
		// await checkUncommitted();
	}, {
		deep: true
	}); // 使用deep: true确保监听对象内部属性的变化

	const submitSuccess = async () => {
		// 提交成功，将所有commit_type为1的病害记录更新为0，删除commit_type为2的记录
		let hasChanges = false;
		const filteredDiseaseList = diseaseList.value.filter(disease => disease.commitType !== 2);
		// 如果有记录被过滤掉，标记为有变化
		if (filteredDiseaseList.length !== diseaseList.value.length) {
			hasChanges = true;
		}

		filteredDiseaseList.forEach(disease => {
			if (disease.commitType === 1) {
				disease.commitType = 0;
				hasChanges = true;
			}
		});
		diseaseList.value = filteredDiseaseList;

		// 如果有更改，保存更新后的数据
		if (hasChanges) {
			const currentYear = idStorageInfo.projectYear;

			// 构建要保存的数据对象
			const saveData = {
				year: parseInt(currentYear),
				buildingId: parseInt(idStorageInfo.buildingId),
				diseases: diseaseList.value
			};

			try {
				// 保存更新后的数据
				await setDisease(userInfo.username, idStorageInfo.buildingId, currentYear, saveData);
				await syncDiseaseCountsToObjectTreeAfterWrite();
				console.log('成功更新病害提交状态');
			} catch (error) {
				console.error('更新病害提交状态失败:', error);
			}
		}
	};

	const readDiseaseCommit = () => {
		try {
			// 检查diseases数组是否存在
			if (!diseaseList.value || !Array.isArray(diseaseList.value)) {
				console.log('没有找到病害数据或数据格式不正确');
				return false;
			}

			// 使用some方法检查是否有任何病害的commit_type为1（未提交）或为2（需要删除）
			const hasUncommittedDiseases = diseaseList.value.some(disease => disease.commitType === 1 || disease
				.commitType === 2);

			console.log(`检查未提交病害: ${hasUncommittedDiseases ? '有未提交病害' : '全部已提交'}`);
			return hasUncommittedDiseases;
		} catch (error) {
			console.error('检查病害提交状态时出错:', error);
			return false; // 出错时返回false
		}
	}

	// 组件挂载时
	onMounted(() => {
		console.log('current-disease组件挂载，准备加载数据');
		// 加载数据
		loadCurrentYearDiseaseData();
		console.log('diseaseList', diseaseList.value)

		// 提交成功 将所有commit_type为1的病害记录更新为0，删除commit_type为2的记录
		uni.$on('submitSuccess', submitSuccess);

		// 添加新增病害事件监听
		uni.$on('addNewDisease', addNewDiseaseData);

		// 添加删除病害事件监听
		uni.$on('deleteDisease', handleDeleteDisease);

		// 添加更新病害事件监听
		uni.$on('updateDisease', handleUpdateDisease);

		// 添加复制病害事件监听
		uni.$on('copyDiseases', copyDiseases)

		// 添加获取同类型病害列表的事件监听
		uni.$on('getDiseasesOfType', (data) => {
			if (!data || !data.grandObjectName || !data.callback) {
				console.error('获取同类型病害列表参数不完整');
				return;
			}

			// 过滤出同类型的病害列表
			const filteredList = diseaseList.value.filter(item =>
				item.component?.grandObjectName === data.grandObjectName
			);

			console.log(`获取${data.grandObjectName}类型的病害列表，共${filteredList.length}条`);

			// 通过回调函数返回结果
			data.callback(filteredList);
		});

		// 初始检查未提交病害
		// checkUncommitted();
	});

	// 组件卸载时
	onUnmounted(() => {
		// 移除事件监听
		uni.$off('addNewDisease');
		uni.$off('deleteDisease');
		uni.$off('updateDisease');
		uni.$off('getDiseasesOfType');
		uni.$off('submitSuccess')
		uni.$off('copyDiseases')
	});

	defineExpose({
		addNewDisease,
		setToolbarSearch,
		setSelectedBridgeSpan
	});
</script>

<style scoped>
	.disease-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
	}

	.search-add-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0rpx;
		background-color: #BDCBE0;
		z-index: 1;
	}

	.view-search-bar {
		width: 45%;
	}

	.search-bar {
		flex: 1;
	}

	.add-button {
		/*margin-right: 24rpx;*/
		margin-right: 16rpx;
		/* 使用右侧间距 */
		background-color: #0F4687;
		color: white;
		font-size: 16rpx;
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		border-radius: 5rpx;
		white-space: nowrap;
		/* 防止文本换行 */
	}

	.submit-button {
		margin-left: 50rpx;
		background-color: #0F4687;
		color: white;
		font-size: 16rpx;
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		border-radius: 5rpx;
	}

	/* 内容布局 */
	.content-layout {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	/* 侧边栏样式 */
	.sidebar {
		width: 16.67%;
		background-color: #f5f5f5;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.sidebar-item {
		padding: 24rpx 0;
		text-align: center;
		color: #666;
		border-bottom: 1px solid #eeeeee;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		/* 修改为 flex-start */
	}

	.sidebar-item-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		/* 修改为 flex-start */
		padding-left: 16rpx;
		/* 添加左内边距 */
	}

	.sidebar-item-text {
		font-size: 18rpx;
	}

	/* 仅未选中：分类名称 */
	.sidebar-item:not(.active) .sidebar-item-text {
		color: #333333;
	}

	.sidebar-item-count {
		font-size: 15rpx;
	}

	.sidebar-item:not(.active) .sidebar-item-count {
		color: #999;
	}

	.sidebar-item.active {
		background-color: #ffffff;
	}

	.sidebar-item.active .sidebar-item-content {
		background-color: #ffffff;
		color: #0F4687;
		font-weight: bold;
		border-left: 4rpx solid #0F4687;
	}

	/* 内容区样式 */
	.content {
		flex: 1;
		padding: 5rpx;
		overflow-y: auto;
		height: 100%;
		background-color: #ffffff;
	}

	.placeholder {
		text-align: center;
		color: #999;
		font-size: 28rpx;
		margin-top: 30rpx;
	}

	.select-button {
		margin-right: 16rpx;
		/*margin-right: 16rpx;*/
		background-color: #0F4687;
		color: white;
		font-size: 16rpx;
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		border-radius: 5rpx;
		white-space: nowrap;
		/* 防止文本换行 */
	}

	.delete-button {
		margin-right: 16rpx;
		background-color: #FF3141;
		color: #ffffff;
		font-size: 16rpx;
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		border-radius: 5rpx;
		white-space: nowrap;
		/* 防止文本换行 */
	}

	.allSelect-button {
		margin-right: 16rpx;
		background-color: #0F4687;
		color: white;
		font-size: 16rpx;
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		border-radius: 5rpx;
		white-space: nowrap;
		/* 防止文本换行 */
	}

	.button-group {
		display: flex;
		/* 内部按钮横向排列 */
		align-items: center;
		/* 垂直居中 */
		margin-left: auto;
		/* 整个按钮组靠右 */
		padding-right: 0;
		/* 由最后一个按钮的margin-right控制右侧留白 */
	}

	.tag-select {
		position: relative;
		display: inline-flex;
		align-items: center;
		margin-left: 8rpx;
		background: #ffffff;
		border: 1rpx solid #CFD7E6;
		border-radius: 4rpx;
		padding: 4rpx 28rpx 4rpx 10rpx;
		/* 右侧为箭头预留空间 */
		box-shadow: 0 0 0 rgba(0, 0, 0, 0);
		/* 需要时可加阴影 */
		width: 100rpx;
		box-sizing: border-box;
	}

	.tag-picker {
		padding: 0;
		/* 由外层控制内边距 */
		margin-left: 0;
		/* 使用外层margin */
		font-size: 20rpx;
		color: #333;
		display: block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tag-icon {
		position: absolute;
		right: 8rpx;
		top: 50%;
		transform: translateY(-50%);
		font-size: 18rpx;
		color: #6B778C;
		pointer-events: none;
		/* 不阻挡点击 */
	}

	/* 手机端适配 */
	@media (max-width: 599px) {
		.search-bar {
			padding: 6px 8px;
		}

		.tag-select {
			padding: 2rpx 20rpx 2rpx 4rpx;
		}

		.tag-picker {
			padding: 4rpx 10rpx;
			/* 由外层控制内边距 */
			font-size: 24rpx;
		}

		.tag-icon {
			font-size: 20rpx;
		}

		.add-button,
		.delete-button,
		.allSelect-button,
		.select-button{
			margin-right: 16rpx;
			font-size: 16rpx;
			height: 40rpx;
			line-height: 40rpx;
			padding: 0 10rpx;
			box-sizing: border-box;
			border-radius: 5rpx;
		}
		
		.sidebar {
			width: 18%;
		}
		
		.sidebar-item:not(.active) .sidebar-item-text {
			font-size: 18rpx;
			color: #333333;
		}

		.sidebar-item-count {
			font-size: 15rpx;
		}

		.sidebar-item:not(.active) .sidebar-item-count {
			color: #999;
		}
	}
</style>
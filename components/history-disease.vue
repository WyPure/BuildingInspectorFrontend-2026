<!--历史病害页面-->
<template>
	<view class="disease-container">
		<!-- 侧边栏布局 -->
		<view class="content-layout">
			<!--左侧边栏-->
			<view class="sidebar">
				<view v-for="(item, index) in visibleTabItems" :key="index"
					:class="['sidebar-item', activeTab === index ? 'active' : '']" @click="changeTab(index)">
					<view class="sidebar-item-content">
						<text class="sidebar-item-text">{{ item }}</text>
						<text class="sidebar-item-count">({{ typeItemCounts[item] ?? 0 }})</text>
					</view>
				</view>
			</view>

			<!-- 右侧内容区 -->
			<view class="content">
				<disease-item
					v-for="(item, itemIndex) in filteredDiseases"
					:key="item.id ?? item.localId ?? itemIndex"
					:item="item"
					:editMode="'history'"
					:selectMode="isSelectMode"
					:selected="selectedItems.includes(item.id)"
					@select="handleItemSelect"
					@delete="deleteDisease"
					@swipe-opened="handleSwipeOpened"
					ref="diseaseItems" />

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
		nextTick,
		watch,
		onMounted,
		onUnmounted
	} from 'vue';
	import {
		getDisease,
		getHistoryYear,
		getULDisease
	} from '../utils/readJsonNew.js';
	import {
		setDisease
	} from "@/utils/writeNew";
	import {
		userStore
	} from "@/store";
	import {
		idStore
	} from "@/store/idStorage";
	import {
		appendBridgeQueryToUrl
	} from '@/utils/bridgeNavQuery.js';
	import { isDiseaseInBridgeSpan } from '@/utils/bridgeSpanDiseaseFilter.js';

	// 组件名称
	defineOptions({
		name: "history-disease"
	});

	const props = defineProps({
		activeTabTop: {
			type: Number,
			default: 0
		},
		/** 由父页提供搜索条时隐藏本组件内搜索条 */
		externalToolbar: {
			type: Boolean,
			default: false
		},
		/** 父页选中的桥跨号：与当前病害一致，按跨过滤列表 */
		selectedBridgeSpan: {
			type: [Number, String],
			default: null
		}
	});

	const emit = defineEmits(['select-mode-change']);

	const userInfo = userStore()

	// 响应式状态
	const tabItems = ref(['桥面系', '上部结构', '下部结构', '附属设施']);
	const activeTab = ref(0);
	const searchText = ref('');
	const isSelectMode = ref(false);
	const showCopyButton = ref(false);
	const selectedItems = ref([]); // 存储选中项的ID
	const currentOpenSwipe = ref(null);
	const diseaseItems = ref(null);

	// 病害列表数据
	const diseaseMap = ref({}); // 用于按年份存储病害

	const idStorageInfo = idStore();

	/*watch(() => props.activeTabTop, (newval, oldval) => {
	  if (newval == 1) {
	    console.log('当前activeTabTop为：', newval) // 使用newval而不是activeTabTop
	    loadDiseaseData();
	  }
	})*/

	// 读取json文件中的数据
	const readHistoryDiseaseData = async () => {
		try {
			//  获取所有历史病害年份
			const years = await getHistoryYear(userInfo.username, idStorageInfo.buildingId, idStorageInfo.projectYear);

			// 清空现有数据
			diseaseMap.value = {};

			// 依次读取各年份数据 UD
			for (const year of years) {
				try {
					const yearData = await getDisease(userInfo.username, idStorageInfo.buildingId, year);
					console.log(`获取到${year}年UD病害数据:`, yearData);

					// 直接按年份存储
					if (yearData && yearData.diseases && yearData.diseases.length > 0) {
						diseaseMap.value[yearData.year] = yearData.diseases;
					} else {
						diseaseMap.value[year] = [];
					}
				} catch (yearError) {
					console.warn(`获取${year}年UD数据失败:`, yearError);
					diseaseMap.value[year] = [];
				}
			}

			//依次读取各年份数据 UL
			for (const year of years) {
				try {
					const yearData = await getULDisease(userInfo.username, idStorageInfo.buildingId, year);
					console.log(`获取到${year}年UL病害数据:`, yearData);

					if (yearData && yearData.diseases && yearData.diseases.length > 0) {
						// 获取当前年份的UD数据
						const currentYearDiseases = diseaseMap.value[year] || [];

						// 合并UL数据到UD数据中
						yearData.diseases.forEach(ulDisease => {
							// 查找对应ID的UD数据
							const existingDiseaseIndex = currentYearDiseases.findIndex(disease => disease
								.id === ulDisease.id);

							if (existingDiseaseIndex !== -1) {
								// 如果找到匹配的UD数据，更新copyId字段
								currentYearDiseases[existingDiseaseIndex].copyId = ulDisease.copyId;
							}
						});

						// 更新合并后的数据
						diseaseMap.value[year] = currentYearDiseases;
					}
				} catch (yearError) {
					console.warn(`获取${year}年UL数据失败:`, yearError);
				}
			}

		} catch (error) {
			console.error('读取病害数据失败:', error);
		}
	};

	// 加载数据
	const loadDiseaseData = async () => {
		await readHistoryDiseaseData();
		console.log('历史病害数据', diseaseMap.value);
	};

	// 历史病害的全量列表（不受搜索条件影响；按当前桥跨筛选）
	const allDiseases = computed(() =>
		Object.values(diseaseMap.value || {})
			.flat()
			.filter((item) => isDiseaseInBridgeSpan(item, props.selectedBridgeSpan))
	);

	const HISTORY_STRUCTURE_TYPES = ['上部结构', '下部结构', '桥面系', '附属设施'];

	/** 历史病害分组用：缺 grandObjectName 或与四类不一致时归入「上部结构」，避免全部被过滤导致「暂无数据」 */
	const historyStructureTypeForItem = (item) => {
		const g = item.component?.grandObjectName;
		if (g && HISTORY_STRUCTURE_TYPES.includes(g)) return g;
		return '上部结构';
	};

	/** 按一级结构分类预分组并排序（数据变时才算一次）。切换左侧 Tab 只换桶引用，避免每次全表 filter + sort */
	const diseasesByStructureType = computed(() => {
		const buckets = Object.fromEntries(tabItems.value.map((t) => [t, []]));
		for (const item of allDiseases.value) {
			const t = historyStructureTypeForItem(item);
			if (buckets[t]) buckets[t].push(item);
		}
		const cmpCode = (a, b) => (a.component?.code || '').localeCompare(b.component?.code || '');
		for (const t of tabItems.value) {
			buckets[t].sort(cmpCode);
		}
		return buckets;
	});

	const typeItemCounts = computed(() => {
		const b = diseasesByStructureType.value;
		return Object.fromEntries(tabItems.value.map((t) => [t, (b[t] || []).length]));
	});

	const sortByComponentCode = (arr) =>
		[...arr].sort((a, b) => (a.component?.code || '').localeCompare(b.component?.code || ''));

	// 计算属性 - 过滤后的病害列表（无搜索时直接复用预排序桶，切换 Tab 不重算大数组）
	const filteredDiseases = computed(() => {
		const selectedType = visibleTabItems.value[activeTab.value];
		if (!selectedType) return [];
		const bucket = diseasesByStructureType.value[selectedType] || [];
		const q = searchText.value?.trim();
		if (!q) return bucket;
		const keywords = q.split(/\s+/);
		const list = bucket.filter((item) =>
			keywords.some((keyword) =>
				(item.description?.includes(keyword) ||
					item.type?.includes(keyword) ||
					item.component?.grandObjectName?.includes(keyword) ||
					item.biObjectName?.includes(keyword) ||
					item.position?.includes(keyword))
			)
		);
		return sortByComponentCode(list);
	});

	// 删除病害
	const deleteDisease = (itemId) => {
		// 确认删除
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这条病害记录吗？',
			success: (res) => {
				if (res.confirm) {
					let removed = false;
					Object.keys(diseaseMap.value).forEach((year) => {
						const list = diseaseMap.value[year] || [];
						const index = list.findIndex(item => item.id === itemId);
						if (index !== -1) {
							list.splice(index, 1);
							diseaseMap.value[year] = [...list];
							removed = true;
						}
					});
					if (removed) {
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
					}
				}
			}
		});
	};

	// 切换选择模式
	const toggleSelectMode = () => {
		isSelectMode.value = !isSelectMode.value;
		showCopyButton.value = isSelectMode.value;

		if (!isSelectMode.value) {
			selectedItems.value = [];
		}
		emit('select-mode-change', isSelectMode.value);
	};

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

	// 使用闭包维护计数器
	const createIdGenerator = () => {
		let counter = 0;
		return () => {
			counter = counter >= 999 ? 0 : counter + 1; // 防止溢出
			return Number(`${Date.now()}${String(counter).padStart(3, '0')}`);
		};
	};
	const generateUniqueId = createIdGenerator();

	// 复制病害
	const copyDisease = () => {
		if (selectedItems.value.length === 0) {
			uni.showToast({
				title: '请先选择要复制的病害',
				icon: 'none'
			});
			return;
		}

		uni.showLoading({
			title: '正在复制',
			mask: true
		});

		// 按年份分组获取选中的病害
		const selectedDiseasesByYear = {};
		Object.keys(diseaseMap.value).forEach(year => {
			const yearDiseases = diseaseMap.value[year] || [];
			const selected = yearDiseases.filter(item => selectedItems.value.includes(item.id));
			if (selected.length > 0) {
				selectedDiseasesByYear[year] = selected;
			}
		});

		if (Object.keys(selectedDiseasesByYear).length === 0) {
			uni.showToast({
				title: '获取选中病害数据失败',
				icon: 'none'
			});
			return;
		}

		// 处理选中的病害，更新时间戳等信息
		const currentTime = new Date();
		const allCopiedDiseases = [];

		// 遍历每个年份的选中病害
		Object.keys(selectedDiseasesByYear).forEach(year => {
			const yearDiseases = selectedDiseasesByYear[year];
			const copiedDiseases = yearDiseases.map(disease => {
				// 创建病害的深拷贝，避免修改原始数据
				const newDisease = JSON.parse(JSON.stringify(disease));
				// 生成新的ID和localId
				const localId = generateUniqueId();
				newDisease.id = localId;
				newDisease.localId = localId;
				// 更新创建时间和更新时间为当前时间
				const formattedTime = formatDateTime(currentTime);
				newDisease.createTime = formattedTime;
				newDisease.updateTime = formattedTime;
				newDisease.commitType = 3;
				newDisease.projectId = idStorageInfo.projectId;
        newDisease.taskId = idStorageInfo.taskId;
				// 确保新复制出来的病害的copyId字段为空
				newDisease.copyId = [];
				newDisease.images = [];
				newDisease.ADImgs = [];
				newDisease.historyDiseaseId = disease.id;

				// 将原始病害添加到allCopiedDiseases以便发送到current-disease
				allCopiedDiseases.push(newDisease);

				return {
					originalDisease: disease,
					newDisease: newDisease
				};
			});

			// 更新原始病害，添加copyId字段
			const originalDiseases = diseaseMap.value[year] || [];
			const updatedDiseases = originalDiseases.map(disease => {
				const matchedCopy = copiedDiseases.find(item => item.originalDisease.id === disease
					.id);
				if (matchedCopy) {
					// 如果病害已有copyId字段且是数组，则添加新的localId
					if (disease.copyId && Array.isArray(disease.copyId)) {
						disease.copyId.push(matchedCopy.newDisease.localId);
					} else {
						// 否则创建新的copyId数组
						disease.copyId = [matchedCopy.newDisease.localId];
					}
				}
				return disease;
			});

			// 保存更新后的病害数据到对应年份
			setDisease(userInfo.username, idStorageInfo.buildingId, year, {
				year: year,
				diseases: updatedDiseases.map(disease => ({
					id: disease.id,
					copyId: disease.copyId
				}))
			});
		});

		// 发送添加新病害事件给current-disease组件
		uni.$emit('copyDiseases', allCopiedDiseases)

		// 显示成功提示
		uni.showToast({
			title: `已复制${allCopiedDiseases.length}条病害`,
			icon: 'success'
		});

		// 退出选择模式
		toggleSelectMode();
	};

	// 添加格式化日期时间的辅助函数
	const formatDateTime = (date = new Date()) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		const h = String(date.getHours()).padStart(2, '0');
		const mm = String(date.getMinutes()).padStart(2, '0');
		const s = String(date.getSeconds()).padStart(2, '0');
		return `${y}-${m}-${d} ${h}:${mm}:${s}`;
	};

	// 搜索
	const search = (e) => {
		// 搜索逻辑
		searchText.value = e.value;
		console.log('搜索内容:', e);
		closeAllSwipeActions();
	};

	// 处理搜索输入，实时筛选
	const handleSearchInput = (e) => {
		searchText.value = e;
		console.log('实时搜索内容:', e);
		closeAllSwipeActions();
	};

	/** 父页共用搜索框写入关键词（与内部输入行为一致） */
	const setToolbarSearch = (v) => {
		searchText.value = typeof v === 'string' ? v : String(v ?? '');
		closeAllSwipeActions();
	};
	const setSelectedBridgeSpan = () => {
		// 保留接口给父页显式同步，实际过滤由 computed + props 驱动
		closeAllSwipeActions();
	};

	// 切换选项卡（不再遍历全部 disease-item 调 closeSwipe：切换分类会替换列表，旧节点卸载即可）
	const changeTab = (index) => {
		activeTab.value = index;
		currentOpenSwipe.value = null;
	};

	// 左侧一级列表：没有病害的分类不显示
	const visibleTabItems = computed(() => {
		const items = tabItems.value.filter((type) => (typeItemCounts.value[type] ?? 0) > 0);
		return items.length ? items : tabItems.value;
	});

	// 可见分类变化时，修正选中索引
	watch(visibleTabItems, (items) => {
		if (!items.length) {
			activeTab.value = 0;
			return;
		}
		if (activeTab.value >= items.length) {
			activeTab.value = 0;
		}
	}, {
		immediate: true
	});

	// 处理滑动打开
	const handleSwipeOpened = (itemId) => {
		// 关闭之前打开的swipe（如果有的话）
		closeSwipeExcept(itemId);
		// 更新当前打开的swipe
		currentOpenSwipe.value = itemId;
	};

	// 关闭所有滑动操作
	const closeAllSwipeActions = () => {
		diseaseItems.value?.forEach(item => {
			item.closeSwipe && item.closeSwipe();
		});
		currentOpenSwipe.value = null;
	};

	// 关闭除特定项外的所有滑动操作
	const closeSwipeExcept = (itemId) => {
		diseaseItems.value?.forEach(item => {
			if (item.item.id !== itemId && item.closeSwipe) {
				item.closeSwipe();
			}
		});
	};

	// 组件挂载时
	onMounted(() => {
		console.log('history-disease组件挂载，准备加载数据');
		// 加载数据
		loadDiseaseData();

		// 监听删除病害事件
		uni.$on('deleteHistoryDiseaseReference', handleDeleteHistoryDiseaseReference);
		uni.$on('copyHistoryDisease', copyHistoryDisease);
		// 监听病害导航事件
		uni.$on('navigateHistoryDisease', handleNavigateHistoryDisease);
	});

	// 组件卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('deleteHistoryDiseaseReference');
		uni.$off('copyHistoryDisease');
		uni.$off('navigateHistoryDisease');
	});

	// 处理复制单条历史病害
	const copyHistoryDisease = async (diseaseData) => {
		// 创建病害的深拷贝，避免修改原始数据
		const newDisease = JSON.parse(JSON.stringify(diseaseData));

		// 生成新的ID和localId
		const localId = new Date().getTime();
		newDisease.id = localId;
		newDisease.localId = localId;

		// 更新创建时间和更新时间为当前时间
		const formattedTime = formatDateTime();
		newDisease.createTime = formattedTime;
		newDisease.updateTime = formattedTime;
		newDisease.commitType = 3;
		newDisease.projectId = idStorageInfo.projectId;

		// 确保新复制出来的病害的copyId字段为空
		newDisease.copyId = [];

		// 保存原始病害ID作为historyDiseaseId
		const historyDiseaseId = diseaseData.id;
		newDisease.historyDiseaseId = historyDiseaseId;

		// 查找原始病害并更新copyId
		let foundOriginalDisease = false;

		// 遍历所有年份查找对应的历史病害
		for (const year of Object.keys(diseaseMap.value)) {
			const yearDiseases = diseaseMap.value[year] || [];
			const diseaseIndex = yearDiseases.findIndex(disease => disease.id === historyDiseaseId);

			if (diseaseIndex !== -1) {
				const originalDisease = yearDiseases[diseaseIndex];

				// 如果病害已有copyId字段且是数组，则添加新的localId
				if (originalDisease.copyId && Array.isArray(originalDisease.copyId)) {
					originalDisease.copyId.push(localId);
				} else {
					// 否则创建新的copyId数组
					originalDisease.copyId = [localId];
				}

				// 更新数据
				diseaseMap.value[year] = [...yearDiseases];

				// 保存更新后的病害数据到对应年份
				await setDisease(userInfo.username, idStorageInfo.buildingId, year, {
					year: year,
					diseases: yearDiseases.map(disease => ({
						id: disease.id,
						copyId: disease.copyId
					}))
				});

				foundOriginalDisease = true;
				break;
			}
		}

		// 发送添加新病害事件给current-disease组件
		console.log('发送添加新病害事件给current-disease组件:', newDisease);
		uni.$emit('addNewDisease', newDisease);
		// 显示成功提示
		uni.showToast({
			title: '成功复制病害',
			icon: 'success'
		});
	};
	// 处理删除病害引用
	const handleDeleteHistoryDiseaseReference = async (data) => {
		if (!data || !data.historyDiseaseId || !data.localId) {
			console.error('删除历史病害引用数据无效:', data);
			return;
		}

		console.log('接收到删除历史病害引用事件:', data);
		const {
			historyDiseaseId,
			localId
		} = data;

		// 遍历所有年份查找对应的历史病害
		let foundDisease = false;

		for (const year of Object.keys(diseaseMap.value)) {
			const yearDiseases = diseaseMap.value[year] || [];
			const diseaseIndex = yearDiseases.findIndex(disease => disease.id === historyDiseaseId);

			if (diseaseIndex !== -1) {
				const disease = yearDiseases[diseaseIndex];

				// 检查并更新 copyId 字段
				if (disease.copyId && Array.isArray(disease.copyId)) {
					const copyIdIndex = disease.copyId.indexOf(localId);
					if (copyIdIndex !== -1) {
						// 从 copyId 数组中移除该 localId
						disease.copyId.splice(copyIdIndex, 1);

						// 更新数据
						diseaseMap.value[year] = [...yearDiseases];

						// 保存更新后的数据
						await setDisease(userInfo.username, idStorageInfo.buildingId, year, {
							year: year,
							diseases: yearDiseases.map(disease => ({
								id: disease.id,
								copyId: disease.copyId
							}))
						});

						console.log(`已从历史病害 ID:${historyDiseaseId} 的 copyId 中移除 localId:${localId}`);
						foundDisease = true;
						break;
					}
				}
			}
		}

		if (!foundDisease) {
			console.warn(`未找到 ID 为 ${historyDiseaseId} 的历史病害或该病害没有引用 localId:${localId}`);
		}
	};

	// 处理病害导航事件
	const handleNavigateHistoryDisease = (data) => {
		if (!data || !data.currentId || !data.action) {
			console.error('导航数据无效:', data);
			return;
		}

		console.log('接收到病害导航事件:', data);
		const {
			currentId,
			action
		} = data;

		// 使用当前筛选后的历史病害列表（与界面展示一致）
		const yearDiseases = filteredDiseases.value || [];

		// 查找当前病害在列表中的索引
		const currentIndex = yearDiseases.findIndex(disease => disease.id === currentId);
		if (currentIndex === -1) {
			console.warn(`未找到ID为${currentId}的病害`);
			return;
		}

		let targetIndex;
		if (action === 'previous') {
			// 上一条：如果已经是第一条，则循环到最后一条
			targetIndex = currentIndex > 0 ? currentIndex - 1 : yearDiseases.length - 1;
		} else if (action === 'next') {
			// 下一条：如果已经是最后一条，则循环到第一条
			targetIndex = currentIndex < yearDiseases.length - 1 ? currentIndex + 1 : 0;
		} else {
			console.error('不支持的导航操作:', action);
			return;
		}

		// 获取目标病害
		const targetDisease = yearDiseases[targetIndex];

		// 导航到目标病害的详情页
		uni.redirectTo({
			url: appendBridgeQueryToUrl(
				`/pages/add-disease/add-disease?mode=history&data=${encodeURIComponent(JSON.stringify(targetDisease))}`
			)
		});
	};

	defineExpose({
		setToolbarSearch,
		setSelectedBridgeSpan,
		toggleSelectMode,
		selectAllDisease,
		copyDisease
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
		background-color: #BDCBE0;
		z-index: 1;
	}

	.view-search-bar {
		width: 63%;
	}

	.search-bar {
		flex: 1;
	}

	.button-group {
		display: flex;
		gap: 10rpx;
		/* 按钮间距 */
		margin-left: auto;
		/* 靠右对齐 */
	}

	.select-button {
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


	.copy-button {
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
		color: #333333;
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

	.sidebar-item-count {
		font-size: 15rpx;
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

	/* 手机端适配 */
	@media (max-width: 599px) {
		.search-bar {
			padding: 6px 8px;
		}

		.select-button {
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

		.sidebar-item-text {
			font-size: 18rpx;
			color: #333333;
		}

		.sidebar-item-count {
			font-size: 18rpx;
			color: #333333;
		}
	}
</style>
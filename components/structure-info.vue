<template>
	<view class="container" :class="{ 'container--embed-inspection': embedInInspection }">
		<view class="span-bridge-meta">
			<view class="span-bridge-meta-row">
				<text class="span-meta-label required">桥跨类型</text>
				<view class="span-meta-type-selector" @tap="openBridgeTypePopup">
					<view class="span-meta-control-slot span-meta-control-slot--type">
						<view class="span-meta-type-text-cell"
							:class="{ 'span-meta-type-text-cell--selected': !!selectedBridgeTypeName }">
							<text :class="['span-meta-value', selectedBridgeTypeName ? '' : 'placeholder']">
								{{ selectedBridgeTypeName || '请选择桥跨类型' }}
							</text>
						</view>
						<view class="span-meta-arrow-wrap">
							<image src="/static/image/RightOutline.svg" class="span-meta-arrow-img" mode="aspectFit" />
						</view>
					</view>
				</view>
			</view>
			<view class="span-bridge-meta-row">
				<text class="span-meta-label required">桥跨跨径</text>
				<view class="span-meta-path-input-wrap">
					<view class="span-meta-control-slot span-meta-control-slot--path">
						<view class="span-meta-path-field">
							<input v-model="bridgeSpanPathValue" class="span-meta-path-input" type="number"
								placeholder="请填写" placeholder-class="span-meta-path-placeholder" />
							<image v-if="hasBridgeSpanPathText" src="/static/image/clear.png"
								class="span-meta-path-clear" mode="aspectFit"
								@tap.stop="clearBridgeSpanPath"></image>
						</view>
						<text class="span-meta-unit">m</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 加载状态 -->
		<view v-if="isLoading" class="loading">
			<text>加载中...</text>
		</view>

		<!-- 三个侧边栏 -->
		<view v-else-if="isReady" class="sidebar" :key="structureTreeEpoch">
			<!-- 第一级侧边栏 -->
			<view class='sidebar-level1'>
				<!-- 遍历展示第一层的数据 -->
				<view v-for="(item1,index1) in (safeTreeData?.children || [])" :key="item1.id"
					@click="changeTab(index1)" :class="{active: safeMenuIndex[0] === index1}">
					<!-- menuIndex[0]记录了当前选中的菜单项索引 index1 是当前循环渲染菜单项的索引 你每次修改后menuIndex会变会触发遍历 index会找到更新的index然后高亮-->
					<!-- 给每个容器设置宽高 -->
					<view class="box">
						<!-- 第一级菜单项的警告图片 -->
						<image v-if="item1.warnNumber > 0" src="@/static/image/warning.png" class="warning-icon" />
						{{item1.name}}
					</view>
				</view>
			</view>

			<!-- 第二级侧边栏 -->
			<view class="sidebar-level2">
				<!-- 遍历展示第2层的数据 -->
				<view v-for="(item2,index2) in (safeTreeData?.children?.[safeMenuIndex[0]]?.children || [])"
					:key="item2.id" @click="changeTab(safeMenuIndex[0],index2)"
					:class="{active: safeMenuIndex[1] === index2}">
					<!-- menuIndex[1]记录了第二级的菜单项索引 index2 是当前循环渲染菜单项的索引 你每次修改后menuIndex会变会触发遍历 index会找到更新的index然后高亮-->
					<!-- 给每个容器设置宽高 -->
					<view class="box">
						<!-- 第二级菜单项的警告图片 -->
						<image v-if="item2.warnNumber > 0" src="@/static/image/warning.png" class="warning-icon" />
						{{item2.name}}
					</view>
				</view>
			</view>

			<!-- 第三级侧边栏 -->
			<view class="sidebar-level3">
				<!-- 遍历展示第3层的数据 -->
				<view
					v-for="(item3,index3) in (safeTreeData?.children?.[safeMenuIndex[0]]?.children?.[safeMenuIndex[1]]?.children || [])"
					:key="item3.id" @click="changeTab(safeMenuIndex[0],safeMenuIndex[1],index3)"
					:class="{active2: safeMenuIndex[2] === index3}" class="fathercontentandbutton">
					<!-- menuIndex[2]记录了第3级的菜单项索引 index3 是当前循环渲染菜单项的索引 你每次修改后menuIndex会变会触发遍历 index会找到更新的index然后高亮-->
					<view class="content">

						<!-- 给每个容器设置宽高 -->
						<view class="box3">
							<!-- 第三级菜单项的警告图片 -->
							<image v-if="(item3?.diseaseNumber || 0) > (item3?.count || 0)"
								src="@/static/image/warning.png" class="warning-icon" />
							{{item3.name}}
						</view>

						<!-- 右侧信息区 -->
						<view class="right">
							<!-- 内容 -->
							<view class="content-container">
								<text class="disease">
									<span class="dissease-count">病害构件数量</span>
									{{item3?.diseaseNumber ?? 0}}
								</text>
								<text class="component-count">
									<span class="count">构件数量</span>
									{{item3.count}}
								</text>
							</view>

							<!-- 图标 -->
							<view class="image-container">
								<image src="/static/image/RightOutline.svg" class="rightarrow" />
							</view>

						</view>
					</view>

					<!-- 第三级菜单项的按钮 -->
					<!--					<view class = "button" :class="{show: safeMenuIndex[2] === index3 && Number(safeTreeData?.status) !== 3}">
						<view class = "cancle" @click.stop="closeButton">取消</view>
						<view class = "confirm" @click = "open">编辑</view>
					</view>-->
				</view>
			</view>



		</view>

		<!-- 数据未准备好时的提示 -->
		<view v-else class="loading">
			<text>数据加载中，请稍候...</text>
		</view>

		<!-- 编辑弹窗 -->
		<!-- 通过ref属性实现对弹窗的启用或者关闭 -->
		<uni-popup ref="windowPopup" type="center">
			<view class="edit-container">
				<!-- 弹窗标题栏 -->
				<view class="edit-title">构件信息编辑</view>
				<!-- 弹窗内容区 -->
				<view class="edit-content">
					<!-- 第一行构件名称 -->
					<view class="edit-content-first">
						<text class="edit-key">构件名称</text>
						<text class="edit-value1">{{componentName}}</text>
					</view>

					<!-- 第二行病害构件数量 -->
					<view class="edit-content-second">
						<text class="edit-key">病害构件数量</text>
						<text class="edit-value2">{{diseaseNumber}}</text>
					</view>

					<!-- 第三行构件数量 -->
					<view class="edit-content-third">
						<text class="edit-key">构件数量</text>
						<!--输入框 -->
						<view class="input-wrapper">
							<input class="input-text" v-model="componentCount" type="number" placeholder="请输入数量"
								placeholder-style="color: #CCCCCC;" :focus="isFocus" />
							<image src="/static/image/clear.png" class="clear-icon" @click="componentCount = ''" />
						</view>
					</view>

				</view>
				<!-- 按钮区域：与新增桥跨弹窗底部按钮同款样式 -->
				<view class="edit-button">
					<view class="edit-button-cancel" hover-class="edit-button--hover" @click="close">
						<text>取消</text>
					</view>
					<view class="edit-button-confirm" hover-class="edit-button--hover" @click="setComponentCount()">
						<text>确定</text>
					</view>
				</view>
			</view>
		</uni-popup>

		<uni-popup ref="bridgeTypePopupRef" type="bottom">
			<view class="bridge-type-popup">
				<view class="bridge-type-popup-title">请选择桥型</view>
				<scroll-view class="bridge-type-scroll" scroll-y="true">
					<view v-for="item in bridgeTypeOptions" :key="item.id" class="bridge-type-item"
						@tap="selectBridgeType(item)">
						<text class="bridge-type-item-text">{{ item.name }}</text>
					</view>
					<view v-if="!bridgeTypeOptions.length" class="bridge-type-empty">暂无桥型数据</view>
				</scroll-view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
	//1.引入结构数据全局变量
	import {
		onMounted,
		ref,
		watch,
		computed,
		onUnmounted,
		nextTick
	} from "vue";
	import {
		useObject
	} from "@/store/object.js";
	import {
		setObject
	} from "../utils/writeNew.js";
	import {
		userStore
	} from '../store/index.js';
	import {
		idStore
	} from '../store/idStorage.js';
	import {
		getObjectUL
	} from "@/utils/readUL";
	import {
		getObject
	} from '@/utils/readJsonNew.js'
	import {
		setBuildingUnCommitted
	} from "@/utils/isBuildingCommited";
	import {
		refreshDiseaseNumber
	} from "@/utils/diseaseNumber";
	import {
		queryBridgeTypeOptions,
		loadBridgeTemplateTree,
	} from "@/utils/bridgeCatalogDb";

	function spanKeyNo(spanNo) {
		const n = Number(spanNo);
		return Number.isFinite(n) && n > 0 ? String(n) : null;
	}

	function ensureSpanSetupMap(data) {
		if (!data || typeof data !== 'object') return {};
		if (!data.bridgeSpanSetupBySpan || typeof data.bridgeSpanSetupBySpan !== 'object') {
			data.bridgeSpanSetupBySpan = {};
		}
		return data.bridgeSpanSetupBySpan;
	}

	/** 多跨时：从实例树中仅统计「当前跨」子树下的构件数量（名称匹配 第N跨） */
	function findSpanSubtreeRootForCounts(root, spanNo) {
		const n = Number(spanNo);
		if (!Number.isFinite(n) || n <= 0 || !root || typeof root !== 'object') return null;
		const ch = root.children;
		if (!Array.isArray(ch)) return null;
		const re = new RegExp(`第\\s*${n}\\s*跨|${n}\\s*跨`);
		for (const c of ch) {
			if (!c || typeof c !== 'object') continue;
			const name = String(c.name || '');
			if (re.test(name)) return c;
			if (Number(c.bridgeSpanNo) === n) return c;
		}
		return null;
	}

	function readSpanMeta(data, spanNo) {
		const k = spanKeyNo(spanNo);
		const map = ensureSpanSetupMap(data);
		const row = k && map[k] && typeof map[k] === 'object' ? map[k] : null;
		const hasRow =
			row &&
			(String(row.bridgeSpanSetupTypeName || '').trim() !== '' ||
				String(row.bridgeSpanSetupPathM || '').trim() !== '' ||
				(row.templateObjectId != null &&
					row.templateObjectId !== '' &&
					Number.isFinite(Number(row.templateObjectId)) &&
					Number(row.templateObjectId) > 0));
		if (hasRow) {
			const tid = Number(row.templateObjectId);
			return {
				typeName: String(row.bridgeSpanSetupTypeName ?? ''),
				pathM: String(row.bridgeSpanSetupPathM ?? ''),
				templateObjectId: Number.isFinite(tid) && tid > 0 ? tid : null,
			};
		}
		const gTid = Number(data?.templateObjectId);
		return {
			typeName: String(data?.bridgeSpanSetupTypeName ?? ''),
			pathM: String(data?.bridgeSpanSetupPathM ?? ''),
			templateObjectId: Number.isFinite(gTid) && gTid > 0 ? gTid : null,
		};
	}

	function syncGlobalFieldsFromSpanRead(data, meta) {
		if (!data || typeof data !== 'object' || !meta) return;
		data.bridgeSpanSetupTypeName = meta.typeName || '';
		data.bridgeSpanSetupPathM = meta.pathM || '';
		if (meta.templateObjectId != null && Number.isFinite(meta.templateObjectId) && meta.templateObjectId > 0) {
			data.templateObjectId = meta.templateObjectId;
		}
	}

	function writeSpanRowToMap(data, spanNo, row) {
		const k = spanKeyNo(spanNo);
		if (!k || !data) return;
		const map = ensureSpanSetupMap(data);
		const prev = map[k] && typeof map[k] === 'object' ? { ...map[k] } : {};
		map[k] = {
			...prev,
			bridgeSpanSetupTypeName:
				row.typeName != null ? String(row.typeName) : String(prev.bridgeSpanSetupTypeName ?? ''),
			bridgeSpanSetupPathM:
				row.pathM != null ? String(row.pathM) : String(prev.bridgeSpanSetupPathM ?? ''),
		};
		if (row.templateObjectId != null) {
			const tid = Number(row.templateObjectId);
			if (Number.isFinite(tid) && tid > 0) map[k].templateObjectId = tid;
		}
	}

	/** 尚无分跨记录时，用顶层桥跨配置为区间内每一跨生成默认槽位，便于切换 pills 后仍能区分编辑 */
	function seedPerSpanFromLegacy(data) {
		if (!data || typeof data !== 'object') return false;
		const start = parseInt(String(data.bridgeSpanStart ?? '').trim(), 10);
		const end = parseInt(String(data.bridgeSpanEnd ?? '').trim(), 10);
		if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return false;
		const legacyType = String(data.bridgeSpanSetupTypeName ?? '').trim();
		const legacyPath = String(data.bridgeSpanSetupPathM ?? '').trim();
		const legacyTpl = Number(data.templateObjectId);
		const hasLegacy =
			legacyType ||
			legacyPath ||
			(Number.isFinite(legacyTpl) && legacyTpl > 0);
		if (!hasLegacy) return false;
		const map = ensureSpanSetupMap(data);
		let seeded = false;
		for (let i = start; i <= end; i++) {
			const k = String(i);
			const row = map[k];
			const empty =
				!row ||
				typeof row !== 'object' ||
				(!String(row.bridgeSpanSetupTypeName || '').trim() &&
					!String(row.bridgeSpanSetupPathM || '').trim() &&
					!(row.templateObjectId != null && Number(row.templateObjectId) > 0));
			if (empty) {
				map[k] = {
					bridgeSpanSetupTypeName: legacyType,
					bridgeSpanSetupPathM: legacyPath,
					...(Number.isFinite(legacyTpl) && legacyTpl > 0 ? { templateObjectId: legacyTpl } : {}),
				};
				seeded = true;
			}
		}
		return seeded;
	}

	/** 遍历实例树（可能含「跨」层），收集模板构件 id → count / diseaseNumber */
	function flattenObjectTreeCounts(root, out = new Map(), spanNo = null) {
		if (!root) return out;
		const sub = spanNo != null ? findSpanSubtreeRootForCounts(root, spanNo) : null;
		const walkRoot = sub || root;
		const walk = (node) => {
			if (!node || typeof node !== 'object') return;
			const id = node.id;
			if (id !== undefined && id !== null && id !== '') {
				const prev = out.get(id) || {};
				if (node.count !== undefined && node.count !== '') prev.count = node.count;
				if (node.diseaseNumber !== undefined && node.diseaseNumber !== '')
					prev.diseaseNumber = node.diseaseNumber;
				if (Object.keys(prev).length) out.set(id, prev);
			}
			const ch = node.children;
			if (Array.isArray(ch)) ch.forEach(walk);
		};
		walk(walkRoot);
		return out;
	}

	function applyCountsFromMap(node, map) {
		if (!node || typeof node !== 'object') return;
		const hit = map.get(node.id);
		if (hit) {
			if (hit.count !== undefined) node.count = hit.count;
			if (hit.diseaseNumber !== undefined) node.diseaseNumber = hit.diseaseNumber;
		}
		const ch = node.children;
		if (Array.isArray(ch)) ch.forEach((c) => applyCountsFromMap(c, map));
	}

	function normalizeBridgeTypeLabel(s) {
		return String(s || '').replace(/\s+/g, ' ').trim();
	}

	async function resolveCatalogTemplateRootId(data) {
		if (!data || typeof data !== 'object') return null;
		const tid = Number(data.templateObjectId);
		if (Number.isFinite(tid) && tid > 0) return tid;
		const typeName = normalizeBridgeTypeLabel(data.bridgeSpanSetupTypeName);
		if (!typeName) return null;
		let opts = bridgeTypeOptions.value;
		if (!opts.length) {
			try {
				opts = await queryBridgeTypeOptions();
				bridgeTypeOptions.value = opts;
			} catch {
				return null;
			}
		}
		const tn = typeName.toLowerCase();
		let hit = opts.find((o) => normalizeBridgeTypeLabel(o.name).toLowerCase() === tn);
		return hit?.id != null && hit?.id !== '' ? Number(hit.id) : null;
	}

	/**
	 * 侧栏展示必须以 catalog 模板为准（桥面系→…→构件）。
	 * UL/UD 实例树第一层常为「第N跨」等，不能直接当作三级导航第一层。
	 */
	async function rebuildStructureTreeFromCatalog(data, spanNo = null) {
		if (!data || typeof data !== 'object') return;
		const countMap = flattenObjectTreeCounts(data, new Map(), spanNo);
		const catalogId = await resolveCatalogTemplateRootId(data);
		if (!catalogId) return;
		try {
			const tplRoot = await loadBridgeTemplateTree(catalogId);
			if (!tplRoot?.children?.length) return;
			const merged = JSON.parse(JSON.stringify(tplRoot));
			applyCountsFromMap(merged, countMap);
			data.templateObjectId = catalogId;
			data.children = merged.children;
		} catch (e) {
			console.warn('[structure-info] 套用桥型模板树失败:', e);
		}
	}

	const props = defineProps({
		/** 嵌入检测页子 Tab 时，与「当前/历史病害」主内容列左缘对齐，减轻切换 Tab 时顶栏左右跳动感 */
		embedInInspection: {
			type: Boolean,
			default: false
		},
		/** 当前选中的桥跨序号（如 3 表示第 3 跨），来自桥梁检测页 pills */
		selectedBridgeSpan: {
			type: [Number, String],
			default: null
		},
	});

	//2.创建实例对象
	const objectData = useObject();
	const userInfo = userStore();
	const idInfo = idStore();
	const isActive = ref(true);
	/** 挂载时锁定的 buildingId，用于异步回调与 watch 判断页面是否仍有效 */
	let currentBuildingId = null;
	const bridgeSpanPathValue = ref('');
	const hasBridgeSpanPathText = computed(() => String(bridgeSpanPathValue.value ?? '').trim() !== '');
	const clearBridgeSpanPath = () => {
		bridgeSpanPathValue.value = '';
	};
	const bridgeTypePopupRef = ref(null);
	const bridgeTypeOptions = ref([]);
	const selectedBridgeTypeName = ref('');
	/** 从 UL 回填类型/跨径到 input 时跳过 watch，避免空类型 ref 把 object 里的桥型名覆盖掉 */
	const bridgeSpanMetaHydrating = ref(false);
	const structureTreeEpoch = ref(0);

	async function bumpStructureSidebar() {
		structureTreeEpoch.value += 1;
		await nextTick();
	}

	const openBridgeTypePopup = async () => {
		try {
			if (!bridgeTypeOptions.value.length) {
				bridgeTypeOptions.value = await queryBridgeTypeOptions();
			}
			bridgeTypePopupRef.value?.open();
		} catch (e) {
			console.error('读取桥型列表失败:', e);
			uni.showToast({
				title: '桥型读取失败',
				icon: 'none'
			});
		}
	};
	const selectBridgeType = async (item) => {
		selectedBridgeTypeName.value = item?.name || '';
		bridgeTypePopupRef.value?.close();
		const data = objectData.getData();
		const rawId = item?.id;
		if (!data || rawId === undefined || rawId === null || rawId === '') return;
		const nid = Number(rawId);
		if (!Number.isFinite(nid) || nid <= 0) return;
		data.templateObjectId = nid;
		data.bridgeSpanSetupTypeName = selectedBridgeTypeName.value;
		const sk = spanKeyNo(props.selectedBridgeSpan);
		if (sk) {
			writeSpanRowToMap(data, props.selectedBridgeSpan, {
				typeName: selectedBridgeTypeName.value,
				pathM: bridgeSpanPathValue.value,
				templateObjectId: nid,
			});
		}
		try {
			await rebuildStructureTreeFromCatalog(data, props.selectedBridgeSpan);
			objectData.setData(data);
			treeData.value = data;
			await bumpStructureSidebar();
			if (data.children) {
				data.children.forEach((item1) => {
					if (item1.children) {
						item1.children.forEach((item2) => {
							checkSecondLevelWarning(item2);
						});
					}
					checkFirstLevelWarning(item1);
				});
			}
			await checkPageWarning();
			await setObject(userInfo.username, idInfo.buildingId, data);
		} catch (e) {
			console.error('[structure-info] 切换桥型后更新构件树失败:', e);
		}
	};

	/** 将桥跨类型/跨径回写到 objectData 并持久化 */
	const saveSpanMeta = async () => {
		try {
			if (bridgeSpanMetaHydrating.value) return;
			const data = objectData.getData();
			if (!data) return;
			const t = String(selectedBridgeTypeName.value ?? '').trim();
			data.bridgeSpanSetupPathM = bridgeSpanPathValue.value ?? '';
			if (t !== '') {
				data.bridgeSpanSetupTypeName = selectedBridgeTypeName.value;
			}
			const sk = spanKeyNo(props.selectedBridgeSpan);
			if (sk) {
				writeSpanRowToMap(data, props.selectedBridgeSpan, {
					typeName: selectedBridgeTypeName.value,
					pathM: bridgeSpanPathValue.value,
					templateObjectId: data.templateObjectId,
				});
			}
			objectData.setData(data);
			await setObject(userInfo.username, idInfo.buildingId, data);
		} catch (e) {
			console.error('保存桥跨元信息失败:', e);
		}
	};

	watch(bridgeSpanPathValue, saveSpanMeta);

	async function persistCurrentSpanFormToSpanSlot(prevSpanNo) {
		const k = spanKeyNo(prevSpanNo);
		if (!k || !isActive.value || currentBuildingId !== idInfo.buildingId) return;
		const data = objectData.getData();
		if (!data) return;
		writeSpanRowToMap(data, prevSpanNo, {
			typeName: selectedBridgeTypeName.value,
			pathM: bridgeSpanPathValue.value,
			templateObjectId: data.templateObjectId,
		});
		await setObject(userInfo.username, idInfo.buildingId, data);
	}

	watch(
		() => props.selectedBridgeSpan,
		async (span, prev) => {
			if (!props.embedInInspection) return;
			if (!isActive.value || currentBuildingId !== idInfo.buildingId) return;
			if (isLoading.value || !treeData.value) return;
			if (bridgeSpanMetaHydrating.value) return;
			const prevK = spanKeyNo(prev);
			const newK = spanKeyNo(span);
			if (prevK === newK) return;
			const data = objectData.getData();
			if (!data) return;
			try {
				if (prevK) await persistCurrentSpanFormToSpanSlot(prev);
				bridgeSpanMetaHydrating.value = true;
				try {
					const meta = readSpanMeta(data, span);
					syncGlobalFieldsFromSpanRead(data, meta);
					selectedBridgeTypeName.value = meta.typeName || '';
					bridgeSpanPathValue.value = meta.pathM || '';
				} finally {
					bridgeSpanMetaHydrating.value = false;
				}
				await rebuildStructureTreeFromCatalog(data, span);
				objectData.setData(data);
				treeData.value = data;
				menuIndex.value = [0, 0, -1];
				await bumpStructureSidebar();
				if (data.children) {
					data.children.forEach((item1) => {
						if (item1.children) {
							item1.children.forEach((item2) => {
								checkSecondLevelWarning(item2);
							});
						}
						checkFirstLevelWarning(item1);
					});
				}
				await checkPageWarning();
				await setObject(userInfo.username, idInfo.buildingId, data);
			} catch (e) {
				console.error('[structure-info] 切换桥跨后刷新失败:', e);
			}
		}
	);

	// // 使用计算属性来响应式获取数据
	// const treeData = computed(() => {
	// 	const data = objectData.getData();
	// 	// 每次获取数据时都重新计算警告状态
	// 	if (data.children) {
	// 		data.children.forEach(item1 => {
	// 			if (item1.children) {
	// 				item1.children.forEach(item2 => {
	// 					checkSecondLevelWarning(item2);
	// 				});
	// 			}
	// 			checkFirstLevelWarning(item1);
	// 		});
	// 	}

	// 	// 检查页面警告状态并设置全局标志
	// 	checkPageWarning();

	// 	return data;
	// })

	const treeData = ref();
	watch(
		() => treeData.value, // 监听 treeData 的变化
		(newData) => {
			// 当 treeData 变化时执行警告检查
			if (newData.children) {
				newData.children.forEach(item1 => {
					if (item1.children) {
						item1.children.forEach(item2 => {
							checkSecondLevelWarning(item2);
						});
					}
					checkFirstLevelWarning(item1);
				});
			}

			// 检查页面警告状态
			checkPageWarning();
		}, {
			deep: true
		} // 深度监听，确保嵌套对象变化也能触发
	);

	//用数组存储索引下标,默认只选中前2项
	const menuIndex = ref([0, 0, -1])

	// 确保menuIndex有安全的值
	const safeMenuIndex = computed(() => {
		return menuIndex.value || [0, 0, -1]
	})
	//构件名称
	const componentName = ref("")
	//病害构件数量
	const diseaseNumber = ref(0)
	//构件数量
	const componentCount = ref(0)
	// 输入框聚焦引用
	const isFocus = ref(false)
	//通过这个变量控制第三级菜单项的按钮的显示
	const buttonVisible = ref({})

	// 添加加载状态
	const isLoading = ref(true)

	// 确保treeData有默认值
	const safeTreeData = computed(() => {
		return treeData.value || {
			children: [],
			status: 0
		}
	})

	// 检查组件是否准备好渲染
	const isReady = computed(() => {
		return !isLoading.value && treeData.value && safeMenuIndex.value
	})
	let previousValue = 0; // 用于保存上一次的值
	//检查一级菜单下的三级菜单警告状态，并统计数量
	const checkFirstLevelWarning = (item1) => {
		if (!item1.children) {
			item1.warnNumber = 0; // 初始化
			return false;
		}

		// 统计有问题的二级菜单项数量
		item1.warnNumber = item1.children.reduce((count, item2) => {
			return count + (item2.warnNumber > 0 ? 1 : 0);
		}, 0);

		// 返回是否存在警告（warnNumber > 0）
		return item1.warnNumber > 0;
	}
	// 检查二级菜单下的三级菜单警告状态，并统计数量
	const checkSecondLevelWarning = (item2) => {
		// 统计警告数量和判断是否有警告
		let warningCount = 0;
		const hasWarning = item2.children.some(item3 => {
			const isWarning = (item3.diseaseNumber || 0) > (item3.count || 0);
			if (isWarning) warningCount++;
			return isWarning;
		});

		// 将统计结果赋值给二级菜单
		item2.warnNumber = warningCount;

		return hasWarning;
	};

	// 检查整个页面是否存在警告，并设置全局标志warning
	const checkPageWarning = async () => {
		const data = objectData.getData();

		// 只遍历第一级菜单项
		if (data.children) {
			for (let item1 of data.children) {
				// 如果发现第一级菜单项的warnNumber > 0，直接设置标志并返回
				if (item1.warnNumber > 0) {
					data.warning = true;
					objectData.setData(data);
					return true;
				}
			}
		}

		// 没有找到警告，设置标志为false
		data.warning = false;
		await setObject(userInfo.username, idInfo.buildingId, data);
		return false;
	};
	//changeTab 动态更新索引值
	const changeTab = (index1, index2, index3) => {
		// 如果系统处于锁定状态，提示用户并不进行任何操作
		if (Number(treeData.value?.status) === 3) {
			uni.showToast({
				title: '系统已锁定，无法编辑',
				icon: 'none',
				duration: 2000
			});
			return;
		}
		//有值就取index 没值就取默认值
		const currentMenuIndex = menuIndex.value || [0, 0, -1];
		menuIndex.value = [
			index1 !== undefined ? index1 : currentMenuIndex[0],
			index2 !== undefined ? index2 : currentMenuIndex[1],
			index3 !== undefined ? index3 : currentMenuIndex[2],
		];
		// 当点击三级菜单时，设置该菜单按钮可见
		/*    if (index3 !== undefined) {
		      const key = `${index1}-${index2}-${index3}`;
		      buttonVisible.value = { [key]: true }; // 只显示当前点击的按钮
		    }*/

		//1.打开弹窗前先获取弹窗中的内容
		//根据menuIndex获取最新索引
		//获取数据
		if (index3 !== undefined) {
			const data = treeData.value?.children?.[menuIndex.value[0]]?.children?.[menuIndex.value[1]]?.children?.[
				menuIndex.value[2]
			]
			//更新构件名称
			componentName.value = data.name;
			//更新病害构件数量
			diseaseNumber.value = data.diseaseNumber ?? 0;
			//更新构件数量
			componentCount.value = data.count;
			windowPopup.value.open();
		}
		// 弹窗打开时，等待DOM更新完成后聚焦输入框
		nextTick(() => {
			isFocus.value = true;
		});
	}
	//初始化函数
	const initData = () => {
		//3.赋值结构树
		treeData.value = objectData.getData();

		// 初始化所有层级的警告状态
		if (treeData.value?.children) {
			// 遍历所有第一级菜单项
			treeData.value.children.forEach(item1 => {
				// 先遍历所有第二级菜单项，计算它们的警告状态
				if (item1.children) {
					item1.children.forEach(item2 => {
						// 计算第二级菜单项的警告状态
						checkSecondLevelWarning(item2);
					});
				}

				// 再计算第一级菜单项的警告状态（基于已计算的第二级菜单项状态）
				checkFirstLevelWarning(item1);
			});
		}
	}

	//控制弹窗的引用
	const windowPopup = ref(null)

	//打开弹窗的方法
	const open = () => {
		//1.打开弹窗前先获取弹窗中的内容
		//根据menuIndex获取最新索引
		//获取数据
		const currentMenuIndex = menuIndex.value || [0, 0, -1];
		const data = treeData.value?.children?.[currentMenuIndex[0]]?.children?.[currentMenuIndex[1]]?.children?.[
			currentMenuIndex[2]
		]
		if (!data) {
			uni.showToast({
				title: '数据加载中，请稍后重试',
				icon: 'none',
				duration: 2000
			});
			return;
		}
		//更新构件名称
		componentName.value = data.name;
		//更新病害构件数量
		diseaseNumber.value = data.diseaseNumber ?? 0;
		//更新构件数量
		componentCount.value = data.count;
		windowPopup.value.open();
	}

	// 关闭弹窗的方法
	const close = () => {
		windowPopup.value.close()
	}
	// 添加关闭按钮的方法
	const closeButton = () => {
		// 重置第三级菜单的选中状态
		const currentMenuIndex = menuIndex.value || [0, 0, -1];
		menuIndex.value = [currentMenuIndex[0], currentMenuIndex[1], -1];
	}
	//更新构件数量
	const setComponentCount = async () => {

		const currentData = objectData.getData();
		const currentMenuIndex = menuIndex.value || [0, 0, -1];
		if (!currentData?.children?.[currentMenuIndex[0]]?.children?.[currentMenuIndex[1]]?.children?.[
				currentMenuIndex[2]
			]) {
			uni.showToast({
				title: '数据加载中，请稍后重试',
				icon: 'none',
				duration: 2000
			});
			return;
		}
		previousValue = currentData.children[currentMenuIndex[0]].children[currentMenuIndex[1]].children[
			currentMenuIndex[2]].count;
		console.log("previous", previousValue);
		if (componentCount.value !== '') {
			currentData.children[currentMenuIndex[0]].children[currentMenuIndex[1]].children[currentMenuIndex[2]]
				.count = componentCount.value;
		} else {
			currentData.children[currentMenuIndex[0]].children[currentMenuIndex[1]].children[currentMenuIndex[2]]
				.count = 0;
		}
		//更新的差值
		const diff = componentCount.value - previousValue;
		console.log("diff", diff);

		//统计父节点数量
		currentData.children[currentMenuIndex[0]].children[currentMenuIndex[1]].count += diff;

		currentData.children[currentMenuIndex[0]].count += diff;

		// 重新计算第二级菜单项的警告状态
		const currentItem2 = currentData.children[currentMenuIndex[0]].children[currentMenuIndex[1]];
		checkSecondLevelWarning(currentItem2);

		// 重新计算第一级菜单项的警告状态
		const currentItem1 = currentData.children[currentMenuIndex[0]];
		checkFirstLevelWarning(currentItem1);
		if (diff !== 0) {
			await setBuildingUnCommitted(userInfo.username, idInfo.projectId, idInfo.buildingId);
			uni.$emit('setBuildingUnCommit', idInfo.buildingId)
			currentData.structureSubmitStatus = 0;
		}

		// 同时更新全局store中的数据
		objectData.setData(currentData);

		// 保存到本地文件系统
		await setObject(userInfo.username, idInfo.buildingId, currentData);
		uni.$emit('structureStatusChanged')

		// 最后检查整个页面的警告状态
		checkPageWarning();

		// 关闭弹窗
		close();
		//关闭按钮
		closeButton();
	}

	//初始化更新所有count 全部置0（套用桥型模板后部分二级节点可能无 children，须防御避免抛错导致侧栏空白）
	function resetCounts(data) {
		if (!data?.children?.length) {
			return;
		}
		for (const item1 of data.children) {
			if (!item1 || typeof item1 !== 'object') continue;
			const level2 = item1.children;
			if (!Array.isArray(level2) || !level2.length) {
				item1.count = 0;
				continue;
			}
			for (const item2 of level2) {
				if (!item2 || typeof item2 !== 'object') continue;
				const level3 = item2.children;
				if (Array.isArray(level3)) {
					for (const item3 of level3) {
						if (item3 && typeof item3 === 'object') item3.count = 0;
					}
				}
				item2.count = 0;
			}
			item1.count = 0;
		}
	}

	/** 新增/删除病害后 Pinia 内已更新 diseaseNumber，刷新侧栏与警告统计 */
	const onDiseaseStatusChangedForSidebar = async () => {
		if (!isActive.value || currentBuildingId !== idInfo.buildingId) return;
		try {
			await refreshDiseaseNumber(
				userInfo.username,
				idInfo.buildingId,
				idInfo.projectYear
			);
		} catch (e) {
			console.warn("[structure-info] diseaseStatusChanged refreshDiseaseNumber:", e);
		}
		const data = objectData.getData();
		if (!data?.children) return;
		treeData.value = data;
		data.children.forEach((item1) => {
			if (item1.children) {
				item1.children.forEach((item2) => {
					checkSecondLevelWarning(item2);
				});
			}
			checkFirstLevelWarning(item1);
		});
		await checkPageWarning();
		await bumpStructureSidebar();
	};

  onMounted(async () => {
    // 初始化状态
    isActive.value = true;
    currentBuildingId = idInfo.buildingId; // 锁定当前页面的ID

    try {
      uni.showLoading({
        title: '加载结构信息',
        mask: true
      });

      // 从 UL 工作区读构件树（data.db / object）
      console.log('加载结构数据（UL），参数:', userInfo.username, currentBuildingId);
      let structureData = await getObjectUL(userInfo.username, currentBuildingId);

      // 检查是否已经退出或页面已切换
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已退出或切换，终止执行');
        return;
      }

      // 如果UL目录中没有有效数据，尝试从UD目录复制
      if (!structureData || !structureData.children || structureData.children.length === 0) {
        console.log('UL 中无有效构件树，尝试从 UD（u{userId}.db）同步');

        const udData = await getObject(userInfo.username, currentBuildingId);

        // 检查是否已经退出或页面已切换
        if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
          console.log('页面已退出或切换，终止执行');
          return;
        }

        if (udData && udData.children && udData.children.length > 0) {
          console.log('已从 UD 读取构件树，正在写入 UL（data.db）');

          udData.warning = false;
          udData.commit = 2;

          // 关键：在执行写入前再次验证
          if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
            console.log('页面已切换，取消写入操作');
            return;
          }

          await setObject(userInfo.username, currentBuildingId, udData);
          console.log("udData:", udData);

          // 检查是否已经退出或页面已切换
          if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
            console.log('页面已退出或切换，终止执行');
            return;
          }

          // 重新从UL目录读取数据
          structureData = await getObjectUL(userInfo.username, currentBuildingId);
        }
      }

      // 检查是否已经退出或页面已切换
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已退出或切换，终止执行');
        return;
      }

      // 确保 structureData 是合法对象
      if (!structureData || typeof structureData !== 'object') {
        structureData = { children: [], buildingId: currentBuildingId };
      }
      if (!Array.isArray(structureData.children)) {
        structureData.children = [];
      }

      seedPerSpanFromLegacy(structureData);
      const curSpanAtLoad = props.selectedBridgeSpan;
      let metaAtLoad = readSpanMeta(structureData, curSpanAtLoad);
      // 如果 db 读回的数据中桥跨信息为空，从 Pinia（bridge-disease 已缓存）补充
      if (!metaAtLoad.typeName && !metaAtLoad.pathM) {
        const piniaFallback = objectData.getData();
        if (piniaFallback && (piniaFallback.bridgeSpanSetupTypeName || piniaFallback.bridgeSpanSetupPathM)) {
          if (piniaFallback.bridgeSpanSetupTypeName) structureData.bridgeSpanSetupTypeName = piniaFallback.bridgeSpanSetupTypeName;
          if (piniaFallback.bridgeSpanSetupPathM) structureData.bridgeSpanSetupPathM = piniaFallback.bridgeSpanSetupPathM;
          if (piniaFallback.bridgeSpanSetupBySpan) structureData.bridgeSpanSetupBySpan = piniaFallback.bridgeSpanSetupBySpan;
          if (piniaFallback.templateObjectId) structureData.templateObjectId = piniaFallback.templateObjectId;
          if (piniaFallback.bridgeSpanConfigured !== undefined) structureData.bridgeSpanConfigured = piniaFallback.bridgeSpanConfigured;
          metaAtLoad = readSpanMeta(structureData, curSpanAtLoad);
        }
      }
      syncGlobalFieldsFromSpanRead(structureData, metaAtLoad);

      // 先把 structureData 存入 Pinia 并回显桥跨类型/跨径（即使 children 为空也要显示这些信息）
      objectData.setData(structureData);
      bridgeSpanMetaHydrating.value = true;
      try {
        selectedBridgeTypeName.value = metaAtLoad.typeName || '';
        bridgeSpanPathValue.value = metaAtLoad.pathM || '';
      } finally {
        bridgeSpanMetaHydrating.value = false;
      }

      // 用 catalog 桥型模板填充构件树
      await rebuildStructureTreeFromCatalog(structureData, curSpanAtLoad);

      // 经过 catalog 填充后仍为空，只隐藏 loading，不再 return（桥跨信息区域仍可见）
      if (!Array.isArray(structureData.children) || structureData.children.length === 0) {
        console.warn('无有效结构数据（children 为空）')
        isLoading.value = false
        uni.hideLoading()
        return
      }

      // 检查是否已经退出或页面已切换
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已退出或切换，终止执行');
        return;
      }

      // 如果是未锁定 将所有count置0（在模板树形状上执行）
      console.log("status", structureData.status);
      console.log("structureData.init", structureData.init);
      if (structureData.status !== 3 && structureData.init === undefined) {
        resetCounts(structureData)
        structureData.init = false;
      }

      // 检查是否已经退出或页面已切换
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已退出或切换，终止执行');
        return;
      }

      objectData.setData(structureData);
      bridgeSpanMetaHydrating.value = true;
      try {
        selectedBridgeTypeName.value = metaAtLoad.typeName || '';
        bridgeSpanPathValue.value = metaAtLoad.pathM || '';
      } finally {
        bridgeSpanMetaHydrating.value = false;
      }
      const data = objectData.getData();

      if (data?.children) {
        data.children.forEach(item1 => {
          if (item1.children) {
            item1.children.forEach(item2 => {
              checkSecondLevelWarning(item2);
            });
          }
          checkFirstLevelWarning(item1);
        });
      }

      // 检查是否已经退出或页面已切换
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已退出或切换，终止执行');
        return;
      }

      // 检查页面警告状态
      await checkPageWarning();

      // 检查是否已经退出或页面已切换
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已退出或切换，终止执行');
        return;
      }

      treeData.value = objectData.getData();
      await bumpStructureSidebar();
      isLoading.value = false;
      uni.hideLoading();
      uni.showToast({
        title: '加载完成',
        icon: 'success',
        duration: 1000
      });
      console.log("组件挂载完成");

    } catch (error) {
      // 如果已经退出或页面已切换，不处理错误
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已退出或切换，忽略错误');
        return;
      }

      console.error("加载数据失败:", error);
      isLoading.value = false;
      uni.hideLoading();
      uni.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 1000
      });
    }

    // 事件监听器 - 同样需要安全检查
    uni.$on('setStructureSubmitStatus1', async () => {
      // 检查是否仍然在正确的页面上
      if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
        console.log('页面已切换，取消事件处理');
        return;
      }

      try {
        treeData.value.structureSubmitStatus = 1;
        objectData.setData(treeData.value);

        // 检查是否仍然在正确的页面上
        if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
          console.log('页面已切换，取消数据写入');
          return;
        }

        await setObject(userInfo.username, currentBuildingId, treeData.value);
      } catch (error) {
        if (!isActive.value || currentBuildingId !== idInfo.buildingId) {
          console.log('页面已切换，忽略事件处理错误');
          return;
        }
        console.error('设置提交状态失败:', error);
      }
    });

		// 新增桥跨后回显：桥梁-病害页保存后会广播；需重新拉 UL 并套用模板树，避免侧栏仍为「跨」层实例结构
		uni.$on('bridgeSpanMetaChanged', async (payload) => {
			try {
				if (!isActive.value || currentBuildingId !== idInfo.buildingId) return;
				if (!payload || payload.buildingId !== currentBuildingId) return;
				const data = objectData.getData();
				if (!data) return;
				const fresh = await getObjectUL(userInfo.username, currentBuildingId);
				if (fresh && typeof fresh === 'object') {
					// 只合并桥跨元信息字段，不用 fresh.children 覆盖已有模板树
					const preserveChildren = Array.isArray(data.children) && data.children.length > 0
						&& (!Array.isArray(fresh.children) || fresh.children.length === 0);
					const savedChildren = preserveChildren ? data.children : undefined;
					Object.assign(data, fresh);
					if (preserveChildren) data.children = savedChildren;
				}
				const sn = payload.spanNo ?? payload.spanEnd;
				if (sn !== undefined && sn !== null && String(sn).trim() !== '') {
					writeSpanRowToMap(data, sn, {
						typeName: payload.typeName != null ? String(payload.typeName) : '',
						pathM: payload.pathM != null ? String(payload.pathM) : '',
					});
				}
				bridgeSpanMetaHydrating.value = true;
				try {
					const meta = readSpanMeta(data, props.selectedBridgeSpan);
					syncGlobalFieldsFromSpanRead(data, meta);
					selectedBridgeTypeName.value = meta.typeName || '';
					bridgeSpanPathValue.value = meta.pathM || '';
				} finally {
					bridgeSpanMetaHydrating.value = false;
				}
				await rebuildStructureTreeFromCatalog(data, props.selectedBridgeSpan);
				objectData.setData(data);
				treeData.value = data;
				await bumpStructureSidebar();
				if (data.children) {
					data.children.forEach((item1) => {
						if (item1.children) {
							item1.children.forEach((item2) => {
								checkSecondLevelWarning(item2);
							});
						}
						checkFirstLevelWarning(item1);
					});
				}
				await checkPageWarning();
				await setObject(userInfo.username, currentBuildingId, data);
			} catch (e) {
				console.error('处理 bridgeSpanMetaChanged 失败:', e);
			}
		});

		uni.$on('diseaseStatusChanged', onDiseaseStatusChangedForSidebar);
  });

  onUnmounted(() => {
    // 标记为不活跃，终止所有后续操作
    isActive.value = false;
    currentBuildingId = null;

    // 移除事件监听器
    uni.$off('setStructureSubmitStatus1');
		uni.$off('bridgeSpanMetaChanged');
		uni.$off('diseaseStatusChanged', onDiseaseStatusChangedForSidebar);

    console.log('组件已卸载，所有操作已终止');
  });
</script>

<style>
	/*激活后的背景色 */
	.active {
		background-color: #FFF;
		color: #0F4687;
		position: relative;
	}

	/*使用伪元素添加竖线 */
	.active::before {
		content: "";
		/* 必需属性，定义伪元素的内容 */
		position: absolute;
		top: 50%;
		/* 线的顶部对齐盒子中心 */
		transform: translateY(-50%);
		/* 将线移动一半 使两者中心对齐 */
		left: 0;
		width: 4rpx;
		/* 线宽*/
		height: 48rpx;
		/* 线高 - 调整为与容器匹配 */
		background-color: #0F4687;
		/* 线色*/
	}

	/*第三个菜单项激活 文字不变色*/
	.active2 {
		background-color: #FFF;
		position: relative;
	}

	.container {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.span-bridge-meta {
		background-color: #ffffff;
		border-bottom: 1rpx solid #ececec;
	}

	.span-bridge-meta-row {
		display: flex;
		align-items: center;
		height: 72rpx;
		padding: 0 20rpx;
		border-bottom: 1rpx solid #f1f1f1;
		box-sizing: border-box;
	}

	.span-meta-label {
		width: 160rpx;
		flex: 0 0 160rpx;
		font-size: 20rpx;
		line-height: 1.2;
		color: #666666;
	}

	.span-meta-label.required::before {
		content: '*';
		color: #ea4335;
		margin-right: 2rpx;
	}

	.span-meta-value {
		font-size: 20rpx;
		line-height: 1.2;
		color: #666666;
	}

	.span-meta-type-text-cell .span-meta-value:not(.placeholder) {
		display: block;
		width: 100%;
		text-align: right;
	}

	.span-meta-value.placeholder {
		color: #CCCCCC;
		text-align: center;
		white-space: nowrap;
	}

	.span-meta-type-text-cell {
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.span-meta-type-text-cell--selected {
		justify-content: flex-end;
	}

	.span-meta-type-selector {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.span-meta-control-slot {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		box-sizing: border-box;
		width: 280rpx;
		flex-shrink: 0;
	}

	.span-meta-control-slot--type {
		gap: 10rpx;
	}

	.span-meta-control-slot--path {
		gap: 12rpx;
		justify-content: flex-end;
	}

	/* 与下方第三级导航栏 .rightarrow 同源图标与位置 */
	.span-meta-arrow-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* 与占位/选中文案垂直居中；与本页三级列表箭头统一浅灰 #CCCCCC */
	.span-meta-arrow-img {
		width: 20rpx;
		height: 20rpx;
		display: block;
		filter: brightness(0) saturate(100%) invert(80%);
	}

	.span-meta-path-input-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.span-meta-path-field {
		width: 180rpx;
		flex-shrink: 0;
		height: 44rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0 8rpx 0 14rpx;
		border: 1rpx solid #d9d9d9;
		border-radius: 4rpx;
		background-color: #ffffff;
	}

	.span-meta-path-input {
		flex: 1;
		min-width: 0;
		height: 44rpx;
		line-height: 44rpx;
		padding: 0;
		border: none;
		font-size: 20rpx;
		color: #666666;
		background-color: transparent;
		box-sizing: border-box;
		text-align: left;
	}

	.span-meta-path-placeholder {
		color: #CCCCCC;
		text-align: left;
	}

	/* 与 BridgeSpanRangeDialog / 病害表单 clear 一致的右侧叉号 */
	.span-meta-path-clear {
		width: 24rpx;
		height: 24rpx;
		flex-shrink: 0;
		margin-left: 4rpx;
		opacity: 0.55;
	}

	.span-meta-unit {
		font-size: 20rpx;
		color: #666666;
		min-width: 24rpx;
		text-align: center;
		flex-shrink: 0;
	}

	/* 与 BridgeSpanRangeDialog 内「选择桥跨类型」底栏列表字体、间距一致 */
	.bridge-type-popup {
		background: #fff;
		border-radius: 16rpx 16rpx 0 0;
		max-height: 60vh;
		overflow: hidden;
		padding-bottom: env(safe-area-inset-bottom);
		box-sizing: border-box;
	}

	.bridge-type-popup-title {
		font-size: 20rpx;
		color: #333;
		text-align: center;
		padding: 16rpx 20rpx;
		border-bottom: 1rpx solid #eee;
		box-sizing: border-box;
	}

	.bridge-type-scroll {
		max-height: 50vh;
	}

	.bridge-type-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		height: 56rpx;
		padding: 0 24rpx;
		border-bottom: 1rpx solid #f0f0f0;
		box-sizing: border-box;
	}

	.bridge-type-item-text {
		font-size: 20rpx;
		color: #333;
		text-align: center;
		line-height: 56rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bridge-type-empty {
		padding: 32rpx;
		text-align: center;
		font-size: 20rpx;
		color: #999;
	}

	.Title {
		padding: 20rpx 0;
		background-color: #BDCBE0;
		font-size: 20rpx;
		display: flex;
	}

	.Title button {
		margin-right: 20rpx;
		background-color: #0F4687;
		color: white;
		font-size: 15rpx;
		height: 36rpx;
		line-height: 26rpx;
		padding: 5rpx 10rpx;
		white-space: nowrap;
		/* 防止文本换行 */
	}

	.Title span {
		padding-top: 5rpx;
		padding-bottom: 5rpx;
	}

	.text {
		padding-left: 20rpx;
	}

	.sidebar {
		height: 100%;
		/*菜单项中的元素 横向排列*/
		display: flex;
		flex-direction: row;
		color: #333333;
	}

	.sidebar-level1 {
		width: 140rpx;
		background-color: #f5f5f5;
		font-size: 18rpx;
		white-space: nowrap;
		/* 强制文本不换行*/
		text-align: center;
		/* 添加水平居中 */
		color: #333333;
	}

	.sidebar-level2 {
		width: 140rpx;
		font-size: 18rpx;
		background-color: #fafafa;
		text-align: center;
		color: #333333;
		white-space: normal;
		/* 允许换行*/
		word-break: break-all;
	}

	.sidebar-level3 {
		flex: 1;
		position: relative;
		/* 为按钮提供定位参考 */
		background-color: #ffffff;
		font-size: 20rpx;
	}

	.fathercontentandbutton {
		position: relative;
		/* 为按钮提供定位参考 */
		display: flex;
		/* 新增：让容器成为flex容器 */
		align-items: stretch;
		/* 新增：让子元素拉伸到父容器高度 */
	}

	.box {
		height: 90rpx;
		/* 固定高度 */
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: 20rpx;
		/* 为图标预留空间 */
		position: relative;
		/* 为警告图标提供定位参考 */
	}

	/* 第一级菜单项的特殊样式 */
	.sidebar-level1 .box {
		padding-left: 20rpx;
		/* 与第二级保持一致 */
	}

	/* 第一级菜单项文字左移 */
	.sidebar-level1 .box {
		transform: translateX(-20rpx);
	}

	.box3 {
		height: auto;
		padding: 22rpx 20rpx;
		border-bottom: 1px solid #eee;
		position: relative;
		padding-left: 20rpx;
		/* 确保与第一级和第二级保持一致 */
		transform: translateX(10rpx);
		/* 第三级菜单项文字整体右移 */
	}

	.button {
		position: absolute;
		top: 0;
		bottom: 0;
		right: -200rpx;
		transition: right 0.3s ease;
		display: flex;
		flex-direction: row;
		font-size: 20rpx;
		color: #fff;
		width: 160rpx;
		align-items: stretch;
		/* 修改：从 center 改为 stretch */
	}

	/*将right设置为0 让按钮显示出来 */
	.button.show {
		right: 0;
	}

	.cancle {
		display: flex;
		width: 80rpx;
		background: #CCC;
		align-items: center;
		/*交叉轴对齐*/
		justify-content: center;
		/*主轴对齐 */
	}

	.confirm {
		display: flex;
		width: 80rpx;
		background: #1677ff;
		align-items: center;
		/*交叉轴对齐*/
		justify-content: center;
		/*主轴对齐 */
	}

	.content {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex: 1;
	}

	.content-container {
		font-size: 15rpx;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.right {
		display: flex;
		flex-direction: row;
		margin-left: auto;
		/*优先从右边找位置 */
	}

	.image-container {
		margin-left: 8rpx;
		margin-right: 12rpx;
	}

	.rightarrow {
		height: 20rpx;
		width: 20rpx;
		display: block;
		filter: brightness(0) saturate(100%) invert(80%);
	}

	.edit-container {
		width: 500rpx;
		background-color: #fff;
		border-radius: 10rpx;
		display: flex;
		flex-direction: column;
		overflow: hidden
	}

	.edit-title {
		font-size: 20rpx;
		text-align: center;
		background-color: #BDCBE0;
		height: 60rpx;
		color: #333;
		display: flex;
		/*只有该容器为flex容器 下面的属性才会生效*/
		align-items: center;
		/*交叉轴对齐*/
		justify-content: center;
		/*主轴对齐 */
	}

	.edit-content {
		font-size: 20rpx;
		margin: 10rpx 30rpx;
		display: flex;
		flex-direction: column;
	}

	.edit-content-first {
		margin: 15rpx 30rpx;
		padding-bottom: 10rpx;
	}

	.edit-content-second {
		margin: 15rpx 30rpx;
		padding-bottom: 10rpx;
	}

	.edit-content-third {
		margin: 15rpx 30rpx;
		padding-bottom: 10rpx;
		display: flex;
		flex-direction: row;
	}

	.edit-key {
		color: #666;
		width: 150rpx;
	}

	.edit-value1 {
		flex: 1;
		margin-left: 90rpx;
	}

	.edit-value2 {
		flex: 1;
		margin-left: 50rpx;
	}

	.input-wrapper {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
	}

	.input-text {
		width: 100%;
		padding-right: 40rpx;
		/* 为图标预留空间 */
		padding-left: 20rpx;
		height: 40rpx;
		border: 1rpx solid #ccc;
		border-radius: 8rpx;
		box-sizing: border-box;
		font-size: 20rpx;
		transform: translateY(-10rpx);
	}

	.clear-icon {
		position: absolute;
		right: 10rpx;
		top: 50%;
		transform: translateY(-25rpx);
		width: 28rpx;
		height: 28rpx;
		opacity: 0.6;
	}

	/* 取消 / 确定：成组水平居中，中间留间距 */
	.edit-button {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
		box-sizing: border-box;
		width: 100%;
		padding: 12rpx 24rpx 20rpx;
		margin-top: 0;
	}

	.edit-button-cancel {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #ffffff;
		color: #1677ff;
		border: 1rpx solid #1677ff;
		font-size: 16rpx;
		min-height: 40rpx;
		height: 40rpx;
		padding: 0 10rpx;
		border-radius: 5rpx;
		box-sizing: border-box;
	}

	.edit-button-cancel text {
		font-size: 16rpx;
		line-height: 1.2;
		text-align: center;
		color: inherit;
		white-space: nowrap;
	}

	.edit-button-confirm {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #1677ff;
		color: #ffffff;
		font-size: 16rpx;
		min-height: 40rpx;
		height: 40rpx;
		padding: 0 10rpx;
		border-radius: 5rpx;
		box-sizing: border-box;
		border: 1rpx solid #1677ff;
	}

	.edit-button-confirm text {
		font-size: 16rpx;
		line-height: 1.2;
		text-align: center;
		color: inherit;
		white-space: nowrap;
	}

	.edit-button--hover {
		opacity: 0.88;
	}

	.warning-icon {
		position: absolute;
		left: 10rpx;
		top: 50%;
		transform: translateY(-50%);
		width: 13rpx;
		height: 13rpx;
	}

	/* 第三级菜单项的警告图标特殊样式 */
	.box3 .warning-icon {
		left: 10rpx;
		transform: translateX(-10rpx) translateY(-7rpx);
		/* 抵消文字的右移并上移，与文字中心对齐 */
	}

	/* 第一级菜单项的警告图标左移 */
	.sidebar-level1 .warning-icon {
		left: 30rpx;
	}

	/* 加载状态样式 */
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200rpx;
		font-size: 28rpx;
		color: #666;
	}
	
	/* 手机端适配 */
	@media (max-width: 599px) {
		.Title {
			padding: 16rpx 0;
			font-size: 24rpx;
		}
		
		.Title button {
			font-size: 16rpx;
			height: 40rpx;
			line-height: 40rpx;
			padding: 0 10rpx;
			box-sizing: border-box;
			border-radius: 5rpx;
		}
	}
</style>